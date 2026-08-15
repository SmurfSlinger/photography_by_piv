import type { GalleryStatus } from "@prisma/client";

export const GALLERY_STATUSES = [
  "draft",
  "active",
  "archived",
] as const satisfies readonly GalleryStatus[];

export type GalleryStatusValue = (typeof GALLERY_STATUSES)[number];

export const GALLERY_STATUS_LABELS: Record<GalleryStatusValue, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export function isGalleryStatus(value: string): value is GalleryStatusValue {
  return (GALLERY_STATUSES as readonly string[]).includes(value);
}

/** Draft is unpublished only. After leaving it, galleries stay Active or Archived. */
export function allowedGalleryStatuses(
  current: GalleryStatusValue | string
): readonly GalleryStatusValue[] {
  if (current === "draft") {
    return GALLERY_STATUSES;
  }
  return ["active", "archived"];
}

export function canTransitionGalleryStatus(
  from: GalleryStatusValue | string,
  to: GalleryStatusValue
): boolean {
  return allowedGalleryStatuses(from).includes(to);
}

export const GALLERY_STATUS_BADGE_CLASSES: Record<GalleryStatusValue, string> = {
  draft: "border-stone-200 bg-stone-100 text-stone-600",
  active: "border-emerald-200 bg-emerald-50 text-emerald-900",
  archived: "border-stone-300 bg-stone-50 text-stone-500",
};

export function galleryStatusBadgeClass(
  status: GalleryStatusValue | string
): string {
  return (
    GALLERY_STATUS_BADGE_CLASSES[status as GalleryStatusValue] ??
    "border-stone-200 bg-stone-100 text-stone-600"
  );
}

export function galleryStatusLabel(
  status: GalleryStatusValue | string
): string {
  return GALLERY_STATUS_LABELS[status as GalleryStatusValue] ?? status;
}

export function getPublicAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function buildGalleryShareUrl(slug: string, rawToken: string): string {
  return `${getPublicAppUrl()}/g/${encodeURIComponent(slug)}?t=${encodeURIComponent(rawToken)}`;
}

export const MAX_GALLERY_PHOTO_BYTES = 50 * 1024 * 1024;

const PHOTO_FILENAME_EXT = /\.(jpe?g|png|webp|heic|heif|tiff?|gif)$/i;

export function slugifyGalleryTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "gallery";
}

export function isValidGallerySlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 60;
}

export type CreateGalleryInput = {
  title: string;
  clientName: string;
  clientEmail: string | null;
  slug: string;
};

export function parseCreateGalleryInput(input: {
  title?: string;
  clientName?: string;
  clientEmail?: string | null;
  slug?: string;
}): { ok: true; data: CreateGalleryInput } | { ok: false; error: string } {
  const title = input.title?.trim() ?? "";
  const clientName = input.clientName?.trim() ?? "";
  const clientEmailRaw = input.clientEmail?.trim() ?? "";
  const slugRaw = input.slug?.trim() || slugifyGalleryTitle(title);

  if (title.length < 1 || title.length > 120) {
    return { ok: false, error: "Title is required (120 characters or fewer)." };
  }
  if (clientName.length < 1 || clientName.length > 120) {
    return { ok: false, error: "Client name is required (120 characters or fewer)." };
  }
  if (clientEmailRaw.length > 0) {
    if (clientEmailRaw.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmailRaw)) {
      return { ok: false, error: "Enter a valid client email, or leave it blank." };
    }
  }
  if (!isValidGallerySlug(slugRaw)) {
    return {
      ok: false,
      error: "Slug must be 2–60 characters: lowercase letters, numbers, and hyphens.",
    };
  }

  return {
    ok: true,
    data: {
      title,
      clientName,
      clientEmail: clientEmailRaw.length > 0 ? clientEmailRaw : null,
      slug: slugRaw,
    },
  };
}

export function sanitizePhotoFilename(originalName: string): string | null {
  const base = originalName.split(/[/\\]/).pop()?.trim() ?? "";
  if (!base || base === "." || base === "..") return null;

  const cleaned = base
    .replace(/[^\w.\-()+\s]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);

  if (!PHOTO_FILENAME_EXT.test(cleaned) || cleaned.includes("..")) {
    return null;
  }

  return cleaned;
}

export function isAllowedPhotoContentType(type: string): boolean {
  const normalized = type.trim().toLowerCase();
  if (!normalized || normalized === "application/octet-stream") return true;
  if (normalized === "image/svg+xml") return false;
  return normalized.startsWith("image/");
}

export function uniquifyFilename(
  desired: string,
  existingLower: ReadonlySet<string>
): string {
  if (!existingLower.has(desired.toLowerCase())) return desired;

  const dot = desired.lastIndexOf(".");
  const stem = dot > 0 ? desired.slice(0, dot) : desired;
  const ext = dot > 0 ? desired.slice(dot) : "";

  let n = 2;
  let candidate = `${stem}-${n}${ext}`;
  while (existingLower.has(candidate.toLowerCase())) {
    n += 1;
    candidate = `${stem}-${n}${ext}`;
  }
  return candidate;
}
