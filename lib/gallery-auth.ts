import argon2 from "argon2";

import { prisma } from "@/lib/prisma";

function getPepper(): string {
  const pepper = process.env.GALLERY_TOKEN_PEPPER;
  if (!pepper) {
    throw new Error("GALLERY_TOKEN_PEPPER is not set");
  }
  return pepper;
}

export async function hashAccessToken(rawToken: string): Promise<string> {
  return argon2.hash(getPepper() + rawToken);
}

export async function verifyAccessToken(
  rawToken: string,
  tokenHash: string
): Promise<boolean> {
  try {
    return await argon2.verify(tokenHash, getPepper() + rawToken);
  } catch {
    return false;
  }
}

export async function validateGalleryAccessToken(
  galleryId: string,
  rawToken: string
): Promise<boolean> {
  const tokens = await prisma.galleryAccessToken.findMany({
    where: {
      galleryId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  for (const record of tokens) {
    if (await verifyAccessToken(rawToken, record.tokenHash)) {
      return true;
    }
  }

  return false;
}
