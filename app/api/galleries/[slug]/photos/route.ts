import { NextResponse } from "next/server";

import { getDisplayKey } from "@/lib/gallery-keys";
import { requireGallerySession } from "@/lib/gallery-guard";
import { getDisplayUrlTtl, presignGet } from "@/lib/r2";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const auth = await requireGallerySession(slug);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const ttl = getDisplayUrlTtl();
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const photos = await Promise.all(
    auth.gallery.photos.map(async (photo) => {
      const displayKey = getDisplayKey(photo);
      const displayUrl = await presignGet(displayKey, slug, ttl);

      return {
        id: photo.id,
        filename: photo.filename,
        displayUrl,
        expiresAt,
      };
    })
  );

  return NextResponse.json({
    title: auth.gallery.title,
    slug: auth.gallery.slug,
    photos,
  });
}
