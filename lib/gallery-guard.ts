import { GalleryStatus } from "@prisma/client";

import { readGallerySessionFromCookies } from "@/lib/gallery-session";
import { prisma } from "@/lib/prisma";

export async function requireGallerySession(slug: string) {
  const session = await readGallerySessionFromCookies();
  if (!session || session.slug !== slug) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!gallery || gallery.status !== GalleryStatus.active) {
    return { ok: false as const, status: 404, message: "Gallery not found" };
  }

  if (gallery.id !== session.galleryId) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  return { ok: true as const, gallery, session };
}
