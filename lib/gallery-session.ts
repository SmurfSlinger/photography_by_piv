import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const GALLERY_SESSION_COOKIE = "gallery_session";

export type GallerySessionPayload = {
  galleryId: string;
  slug: string;
};

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createGallerySessionToken(
  payload: GallerySessionPayload
): Promise<string> {
  return new SignJWT({ galleryId: payload.galleryId, slug: payload.slug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSessionSecret());
}

export async function verifyGallerySessionToken(
  token: string
): Promise<GallerySessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const galleryId = payload.galleryId;
    const slug = payload.slug;

    if (typeof galleryId !== "string" || typeof slug !== "string") {
      return null;
    }

    return { galleryId, slug };
  } catch {
    return null;
  }
}

export async function readGallerySessionFromCookies(): Promise<GallerySessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GALLERY_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifyGallerySessionToken(token);
}

export function gallerySessionCookieOptions(maxAgeSeconds = 60 * 60 * 24) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
