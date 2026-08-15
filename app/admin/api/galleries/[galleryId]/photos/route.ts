import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  isAllowedPhotoContentType,
  MAX_GALLERY_PHOTO_BYTES,
  sanitizePhotoFilename,
  uniquifyFilename,
} from "@/lib/gallery-admin";
import { buildOriginalKey } from "@/lib/gallery-keys";
import { prisma } from "@/lib/prisma";
import { deleteGalleryObject, putGalleryObject } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  request: Request,
  context: { params: Promise<{ galleryId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { galleryId } = await context.params;
  if (!galleryId?.trim()) {
    return NextResponse.json({ error: "Invalid gallery" }, { status: 400 });
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { id: true, slug: true, status: true },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  if (gallery.status === "archived") {
    return NextResponse.json(
      { error: "Archived galleries cannot accept new photos" },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = formData.get("file");
  if (
    !file ||
    typeof file !== "object" ||
    !("arrayBuffer" in file) ||
    !("name" in file) ||
    !("size" in file) ||
    typeof file.arrayBuffer !== "function"
  ) {
    return NextResponse.json({ error: "Choose a photo to upload" }, { status: 400 });
  }

  const upload = file as File;

  if (upload.size <= 0) {
    return NextResponse.json({ error: "That file is empty" }, { status: 400 });
  }

  if (upload.size > MAX_GALLERY_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "Photos must be 50 MB or smaller" },
      { status: 400 }
    );
  }

  if (!isAllowedPhotoContentType(upload.type)) {
    return NextResponse.json({ error: "That file type is not supported" }, { status: 400 });
  }

  const sanitized = sanitizePhotoFilename(upload.name);
  if (!sanitized) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP, HEIC, TIFF, or GIF filename" },
      { status: 400 }
    );
  }

  const existing = await prisma.photo.findMany({
    where: { galleryId: gallery.id },
    select: { filename: true, sortOrder: true },
  });
  const filename = uniquifyFilename(
    sanitized,
    new Set(existing.map((photo) => photo.filename.toLowerCase()))
  );
  const nextSort =
    existing.reduce((max, photo) => Math.max(max, photo.sortOrder), -1) + 1;
  const key = buildOriginalKey(gallery.slug, filename);

  const contentType =
    upload.type.trim() || "application/octet-stream";

  try {
    const body = Buffer.from(await upload.arrayBuffer());
    await putGalleryObject({
      key,
      slug: gallery.slug,
      body,
      contentType,
    });
  } catch (error) {
    console.error("gallery photo R2 upload failed", error);
    return NextResponse.json(
      { error: "Unable to store photo. Check R2 configuration." },
      { status: 500 }
    );
  }

  try {
    const photo = await prisma.photo.create({
      data: {
        galleryId: gallery.id,
        filename,
        sortOrder: nextSort,
        r2KeyOriginal: key,
        r2KeyWeb: null,
        r2KeyThumb: null,
      },
      select: { id: true, filename: true },
    });

    revalidatePath("/admin/galleries");
    revalidatePath(`/admin/galleries/${gallery.id}`);

    return NextResponse.json({
      ok: true,
      photo,
    });
  } catch (error) {
    console.error("gallery photo DB create failed", error);
    try {
      await deleteGalleryObject({ key, slug: gallery.slug });
    } catch (cleanupError) {
      console.error("gallery photo orphan cleanup failed", cleanupError);
    }
    return NextResponse.json(
      { error: "Photo uploaded but could not be saved. Try again." },
      { status: 500 }
    );
  }
}
