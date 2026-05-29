import { GalleryStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { validateGalleryAccessToken } from "@/lib/gallery-auth";
import {
  createGallerySessionToken,
  GALLERY_SESSION_COOKIE,
  gallerySessionCookieOptions,
} from "@/lib/gallery-session";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = body.token;
  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const gallery = await prisma.gallery.findUnique({ where: { slug } });
  if (!gallery || gallery.status !== GalleryStatus.active) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const valid = await validateGalleryAccessToken(gallery.id, token);
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const sessionToken = await createGallerySessionToken({
    galleryId: gallery.id,
    slug: gallery.slug,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    GALLERY_SESSION_COOKIE,
    sessionToken,
    gallerySessionCookieOptions()
  );

  return response;
}
