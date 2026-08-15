import Link from "next/link";

import {
  galleryStatusBadgeClass,
  galleryStatusLabel,
  type GalleryStatusValue,
} from "@/lib/gallery-admin";

export type AdminGalleryRow = {
  id: string;
  slug: string;
  title: string;
  status: GalleryStatusValue | string;
  allowOriginalDownload: boolean;
  createdAt: Date;
  photoCount: number;
  clientName: string;
  clientEmail: string | null;
};

export default function GalleryList({
  galleries,
  newHref = "/admin/galleries/new",
}: {
  galleries: AdminGalleryRow[];
  newHref?: string;
}) {
  if (galleries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center text-stone-500">
        No galleries yet.{" "}
        <Link
          href={newHref}
          className="text-[#5c6b4a] underline-offset-2 hover:underline"
        >
          New gallery
        </Link>
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {galleries.map((gallery) => (
        <li key={gallery.id}>
          <Link
            href={`/admin/galleries/${gallery.id}`}
            className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white px-4 py-4 shadow-sm transition hover:border-[#5c6b4a]/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a] sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-lg leading-tight text-stone-900">
                {gallery.title}
              </h2>
              <p className="mt-1 truncate text-sm text-stone-600">
                {gallery.clientName}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${galleryStatusBadgeClass(gallery.status)}`}
              >
                {galleryStatusLabel(gallery.status)}
              </span>
              <span className="tabular-nums text-xs text-stone-500">
                {gallery.photoCount}{" "}
                {gallery.photoCount === 1 ? "photo" : "photos"}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
