import GalleryShareControls from "@/components/admin/GalleryShareControls";
import { formatInquiryDateTime } from "@/lib/booking-inquiry-display";
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

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const text = value?.trim();
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-stone-800">
        {text && text.length > 0 ? text : "—"}
      </dd>
    </div>
  );
}

function GalleryRow({ gallery }: { gallery: AdminGalleryRow }) {
  const activeLinks = gallery.tokens.filter((token) => !token.revokedAt).length;

  return (
    <details className="group rounded-xl border border-stone-200/80 bg-white shadow-sm open:border-stone-300 open:shadow-md">
      <summary className="flex cursor-pointer list-none items-start gap-3 rounded-xl px-4 py-4 transition hover:bg-stone-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span
          className="mt-1 shrink-0 text-stone-400 transition group-open:rotate-90"
          aria-hidden
        >
          ▶
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="font-serif text-lg text-stone-900">{gallery.title}</h2>
            <time className="shrink-0 text-xs text-stone-500">
              {formatInquiryDateTime(gallery.createdAt)}
            </time>
          </div>
          <p className="mt-1 text-sm text-stone-600">{gallery.clientName}</p>
          <p className="mt-1 font-mono text-xs text-stone-500">/g/{gallery.slug}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${galleryStatusBadgeClass(gallery.status)}`}
          >
            {galleryStatusLabel(gallery.status)}
          </span>
          <span className="text-xs text-stone-500">
            {gallery.photoCount} photo{gallery.photoCount === 1 ? "" : "s"}
            {activeLinks > 0 ? ` · ${activeLinks} link${activeLinks === 1 ? "" : "s"}` : ""}
          </span>
          <span className="text-xs text-[#5c6b4a] group-open:hidden">
            Tap to expand
          </span>
        </div>
      </summary>

      <div className="border-t border-stone-100 px-4 pb-5 pt-4 sm:px-5">
        <dl className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Client" value={gallery.clientName} />
          <Field label="Client email" value={gallery.clientEmail} />
          <Field label="Slug" value={gallery.slug} />
          <Field
            label="Original downloads"
            value={gallery.allowOriginalDownload ? "Allowed" : "Disabled"}
          />
        </dl>

        <GalleryShareControls
          galleryId={gallery.id}
          status={gallery.status}
          tokens={gallery.tokens}
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
      <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center text-stone-600">
        No galleries registered yet. Use{" "}
        <code className="font-mono text-sm">npm run register-gallery</code> to
        add one, then create share links here.
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
