import { readFile } from "node:fs/promises";
import path from "node:path";

import { GalleryStatus } from "@prisma/client";

import { buildOriginalKey } from "../lib/gallery-keys";
import { prisma } from "../lib/prisma";

type ManifestPhoto = {
  filename: string;
  sortOrder?: number;
};

type GalleryManifest = {
  slug: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  status?: GalleryStatus;
  photos: ManifestPhoto[];
};

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error("Usage: npm run register-gallery -- scripts/seed/example.json");
    process.exit(1);
  }

  const absolutePath = path.resolve(manifestPath);
  const raw = await readFile(absolutePath, "utf8");
  const manifest = JSON.parse(raw) as GalleryManifest;

  if (!manifest.slug || !manifest.title || !manifest.clientName) {
    throw new Error("Manifest requires slug, title, and clientName");
  }

  if (!Array.isArray(manifest.photos) || manifest.photos.length === 0) {
    throw new Error("Manifest requires at least one photo");
  }

  const status = manifest.status ?? GalleryStatus.active;

  const existingGallery = await prisma.gallery.findUnique({
    where: { slug: manifest.slug },
  });

  let clientId = existingGallery?.clientId;

  if (clientId) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        name: manifest.clientName,
        email: manifest.clientEmail ?? null,
      },
    });
  } else {
    const client = await prisma.client.create({
      data: {
        name: manifest.clientName,
        email: manifest.clientEmail ?? null,
      },
    });
    clientId = client.id;
  }

  const gallery = await prisma.gallery.upsert({
    where: { slug: manifest.slug },
    update: {
      title: manifest.title,
      status,
      clientId,
    },
    create: {
      slug: manifest.slug,
      title: manifest.title,
      status,
      clientId,
    },
  });

  await prisma.photo.deleteMany({ where: { galleryId: gallery.id } });

  for (const [index, photo] of manifest.photos.entries()) {
    await prisma.photo.create({
      data: {
        galleryId: gallery.id,
        filename: photo.filename,
        sortOrder: photo.sortOrder ?? index,
        r2KeyOriginal: buildOriginalKey(manifest.slug, photo.filename),
        r2KeyWeb: null,
        r2KeyThumb: null,
      },
    });
  }

  console.log(`Registered gallery "${gallery.title}" (${gallery.slug})`);
  console.log(`Photos: ${manifest.photos.length}`);
  console.log(`Client: ${manifest.clientName}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
