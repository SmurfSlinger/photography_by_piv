import type { Photo } from "@prisma/client";

export function buildOriginalKey(slug: string, filename: string): string {
  return `galleries/${slug}/${filename}`;
}

export function getDisplayKey(
  photo: Pick<Photo, "r2KeyThumb" | "r2KeyWeb" | "r2KeyOriginal">
): string {
  return photo.r2KeyThumb ?? photo.r2KeyWeb ?? photo.r2KeyOriginal;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** MVP flat layout; later allows thumbs/ and web/ subpaths. */
export function isAllowedR2Key(key: string, slug: string): boolean {
  const safeSlug = escapeRegex(slug);
  const flat = new RegExp(`^galleries/${safeSlug}/[^/]+$`);
  const derived = new RegExp(`^galleries/${safeSlug}/(thumbs|web)/[^/]+$`);
  return flat.test(key) || derived.test(key);
}
