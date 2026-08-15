import GalleryShareControls from "@/components/admin/GalleryShareControls";
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
  tokens: {
    id: string;
    label: string | null;
    createdAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
  }[];
};

function GalleryRow({ gallery }: { gallery: AdminGalleryRow }) {
  const activeTokens = gallery.tokens.filter((token) => !token.revokedAt);

  return (
    <details className="group rounded-xl border border-stone-200/80 bg-white shadow-sm open:border-stone-300 open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-4 transition hover:bg-stone-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span
          className="shrink-0 text-stone-400 transition group-open:rotate-90"
          aria-hidden
        >
          ▶
        </span>
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
      </summary>

      <div className="border-t border-stone-100 px-4 pb-5 pt-4 sm:px-5">
        {gallery.clientEmail ? (
          <a
            href={`mailto:${gallery.clientEmail}`}
            className="mb-4 inline-block text-sm text-[#5c6b4a] underline-offset-2 hover:underline"
          >
            {gallery.clientEmail}
          </a>
        ) : null}

        <GalleryShareControls
          galleryId={gallery.id}
          status={gallery.status}
          tokens={activeTokens}
        />
      </div>
    </details>
  );
}

export default function GalleryList({
  galleries,
}: {
  galleries: AdminGalleryRow[];
}) {
  if (galleries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center text-stone-500">
        No galleries yet
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {galleries.map((gallery) => (
        <li key={gallery.id}>
          <GalleryRow gallery={gallery} />
        </li>
      ))}
    </ul>
  );
}
