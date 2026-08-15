"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  buildGalleryShareUrl,
  canTransitionGalleryStatus,
  isGalleryStatus,
  type GalleryStatusValue,
} from "@/lib/gallery-admin";
import { hashAccessToken } from "@/lib/gallery-auth";
import { prisma } from "@/lib/prisma";

export type GalleryAdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateShareLinkResult =
  | { ok: true; shareUrl: string; label: string | null }
  | { ok: false; error: string };

const MAX_LABEL_LENGTH = 80;

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

  revalidatePath("/admin");
  revalidatePath("/admin/galleries");
  return { ok: true };
}
