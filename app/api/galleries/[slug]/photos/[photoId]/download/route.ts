import { NextResponse } from "next/server";

import { requireGallerySession } from "@/lib/gallery-guard";
import { getDownloadUrlTtl, presignGet } from "@/lib/r2";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string; photoId: string }> }
) {
  const { slug, photoId } = await context.params;
  const auth = await requireGallerySession(slug);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  if (!auth.gallery.allowOriginalDownload) {
    return NextResponse.json({ error: "Downloads disabled" }, { status: 403 });
  }

  const photo = await prisma.photo.findFirst({
    where: { id: photoId, galleryId: auth.gallery.id },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const ttl = getDownloadUrlTtl();
  const downloadUrl = await presignGet(photo.r2KeyOriginal, slug, ttl);

  return NextResponse.json({
    downloadUrl,
    filename: photo.filename,
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
  });
}
