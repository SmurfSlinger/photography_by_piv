import { randomBytes } from "node:crypto";

import { hashAccessToken } from "../lib/gallery-auth";
import { prisma } from "../lib/prisma";

async function main() {
  const slug = process.argv[2];
  const label = process.argv[3];

  if (!slug) {
    console.error("Usage: npm run create-gallery-token -- <gallery-slug> [label]");
    process.exit(1);
  }

  const gallery = await prisma.gallery.findUnique({ where: { slug } });
  if (!gallery) {
    throw new Error(`Gallery not found: ${slug}`);
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = await hashAccessToken(rawToken);

  await prisma.galleryAccessToken.create({
    data: {
      galleryId: gallery.id,
      tokenHash,
      label: label ?? null,
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const shareUrl = `${baseUrl}/g/${slug}?t=${encodeURIComponent(rawToken)}`;

  console.log(`Gallery: ${gallery.title} (${slug})`);
  console.log("Share URL (shown once — store it securely):");
  console.log(shareUrl);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
