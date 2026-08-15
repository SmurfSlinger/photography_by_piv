"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  buildGalleryShareUrl,
  canTransitionGalleryStatus,
  isGalleryStatus,
  isValidGallerySlug,
  parseCreateGalleryInput,
  slugifyGalleryTitle,
  type GalleryStatusValue,
} from "@/lib/gallery-admin";
import { hashAccessToken } from "@/lib/gallery-auth";
import { prisma } from "@/lib/prisma";
import { deleteGalleryObject } from "@/lib/r2";

export type GalleryAdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateShareLinkResult =
  | { ok: true; shareUrl: string; label: string | null }
  | { ok: false; error: string };

export type CreateGalleryResult =
  | { ok: true; galleryId: string }
  | { ok: false; error: string };

const MAX_LABEL_LENGTH = 80;

async function uniqueGallerySlug(preferred: string): Promise<string> {
  const base = isValidGallerySlug(preferred)
    ? preferred
    : slugifyGalleryTitle(preferred);
  let slug = base;
  let n = 2;
  while (await prisma.gallery.findUnique({ where: { slug }, select: { id: true } })) {
    const suffix = `-${n}`;
    slug = `${base.slice(0, Math.max(2, 60 - suffix.length))}${suffix}`;
    n += 1;
    if (n > 50) {
      throw new Error("Could not allocate a unique gallery slug");
    }
  }
  return slug;
}

export async function createGallery(input: {
  title: string;
  clientName: string;
  clientEmail?: string | null;
  slug?: string;
}): Promise<CreateGalleryResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = parseCreateGalleryInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  const { title, clientName, clientEmail, slug: requestedSlug } = parsed.data;

  try {
    const slug = await uniqueGallerySlug(requestedSlug);

    const gallery = await prisma.$transaction(async (tx) => {
      let clientId: string | null = null;
      if (clientEmail) {
        const existing = await tx.client.findFirst({
          where: { email: clientEmail },
          select: { id: true },
        });
        if (existing) {
          await tx.client.update({
            where: { id: existing.id },
            data: { name: clientName },
          });
          clientId = existing.id;
        }
      }

      if (!clientId) {
        const client = await tx.client.create({
          data: { name: clientName, email: clientEmail },
        });
        clientId = client.id;
      }

      return tx.gallery.create({
        data: {
          title,
          slug,
          status: "draft",
          clientId,
        },
        select: { id: true },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/galleries");
    return { ok: true, galleryId: gallery.id };
  } catch (error) {
    console.error("createGallery failed", error);
    return { ok: false, error: "Unable to create gallery. Try again." };
  }
}

export async function createGalleryShareLink(
  galleryId: string,
  label?: string | null
): Promise<CreateShareLinkResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!galleryId?.trim()) {
    return { ok: false, error: "Invalid gallery id" };
  }

  const trimmedLabel = label?.trim() ?? "";
  if (trimmedLabel.length > MAX_LABEL_LENGTH) {
    return { ok: false, error: `Label must be ${MAX_LABEL_LENGTH} characters or fewer` };
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { id: true, slug: true, status: true },
  });

  if (!gallery) {
    return { ok: false, error: "Gallery not found" };
  }

  if (gallery.status === "archived") {
    return { ok: false, error: "Archived galleries cannot issue new share links" };
  }

  try {
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = await hashAccessToken(rawToken);

    await prisma.galleryAccessToken.create({
      data: {
        galleryId: gallery.id,
        tokenHash,
        label: trimmedLabel.length > 0 ? trimmedLabel : null,
      },
    });

    revalidatePath("/admin/galleries");
    revalidatePath(`/admin/galleries/${gallery.id}`);

    return {
      ok: true,
      shareUrl: buildGalleryShareUrl(gallery.slug, rawToken),
      label: trimmedLabel.length > 0 ? trimmedLabel : null,
    };
  } catch (error) {
    console.error("createGalleryShareLink failed", error);
    return {
      ok: false,
      error:
        "Unable to create share link. Check GALLERY_TOKEN_PEPPER and try again.",
    };
  }
}

export async function revokeGalleryShareLink(
  tokenId: string
): Promise<GalleryAdminActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!tokenId?.trim()) {
    return { ok: false, error: "Invalid token id" };
  }

  const existing = await prisma.galleryAccessToken.findUnique({
    where: { id: tokenId },
    select: { id: true, revokedAt: true },
  });

  if (!existing) {
    return { ok: false, error: "Share link not found" };
  }

  if (existing.revokedAt) {
    return { ok: true };
  }

  await prisma.galleryAccessToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/admin/galleries");
  return { ok: true };
}

export async function updateGalleryStatus(
  galleryId: string,
  status: GalleryStatusValue
): Promise<GalleryAdminActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!galleryId?.trim() || !isGalleryStatus(status)) {
    return { ok: false, error: "Invalid gallery or status" };
  }

  const existing = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { id: true, status: true },
  });

  if (!existing) {
    return { ok: false, error: "Gallery not found" };
  }

  if (!canTransitionGalleryStatus(existing.status, status)) {
    return {
      ok: false,
      error:
        "Draft is only for unpublished galleries. After that, a gallery can be Active or Archived.",
    };
  }

  await prisma.gallery.update({
    where: { id: galleryId },
    data: { status },
  });

  revalidatePath("/admin/galleries");
  revalidatePath(`/admin/galleries/${galleryId}`);
  return { ok: true };
}

export async function deleteGalleryPhoto(
  photoId: string
): Promise<GalleryAdminActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!photoId?.trim()) {
    return { ok: false, error: "Invalid photo id" };
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      r2KeyOriginal: true,
      r2KeyWeb: true,
      r2KeyThumb: true,
      gallery: { select: { id: true, slug: true } },
    },
  });

  if (!photo) {
    return { ok: false, error: "Photo not found" };
  }

  const keys = [photo.r2KeyOriginal, photo.r2KeyWeb, photo.r2KeyThumb].filter(
    (key): key is string => Boolean(key)
  );

  try {
    for (const key of keys) {
      await deleteGalleryObject({ key, slug: photo.gallery.slug });
    }
  } catch (error) {
    console.error("deleteGalleryPhoto R2 failed", error);
    return { ok: false, error: "Unable to delete photo from storage." };
  }

  await prisma.photo.delete({ where: { id: photo.id } });
  revalidatePath("/admin/galleries");
  revalidatePath(`/admin/galleries/${photo.gallery.id}`);
  return { ok: true };
}
