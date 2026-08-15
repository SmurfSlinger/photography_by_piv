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
