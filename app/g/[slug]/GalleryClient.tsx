"use client";

import { useCallback, useEffect, useState } from "react";

import ClientPhotoGrid, {
  type ClientPhoto,
} from "@/components/client-gallery/ClientPhotoGrid";

type GalleryClientProps = {
  slug: string;
  title: string;
  allowDownload: boolean;
};

type PhotosResponse = {
  title: string;
  photos: ClientPhoto[];
};

function GallerySpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-[#5c6b4a]"
        aria-hidden
      />
      <p className="mt-5 text-base text-stone-600">{label}</p>
    </div>
  );
}

function GalleryMessage({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h2 className="font-serif text-2xl text-stone-800">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-stone-600">{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn-primary mt-8"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default function GalleryClient({
  slug,
  title,
  allowDownload,
}: GalleryClientProps) {
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/galleries/${slug}/photos`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(
        data.error ??
          "We could not load your gallery. Please refresh the page or try again shortly."
      );
      setLoading(false);
      return;
    }

    const data = (await response.json()) as PhotosResponse;
    setPhotos(data.photos);
    setSelectedId(data.photos[0]?.id ?? null);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const selected = photos.find((p) => p.id === selectedId) ?? null;

  async function handleDownload() {
    if (!selected || !allowDownload) {
      return;
    }

    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/galleries/${slug}/photos/${selected.id}/download`,
        { method: "POST" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Download could not be started. Please try again.");
        return;
      }

      const data = (await response.json()) as {
        downloadUrl: string;
        filename: string;
      };

      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.filename;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <GallerySpinner label="Loading your gallery…" />;
  }

  if (error && photos.length === 0) {
    return (
      <GalleryMessage
        title="Something went wrong"
        body={error}
        action={{ label: "Try again", onClick: () => loadPhotos() }}
      />
    );
  }

  if (photos.length === 0) {
    return (
      <GalleryMessage
        title="Gallery is empty"
        body="There are no photos in this gallery yet. If you believe this is a mistake, please contact your photographer."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Your gallery</p>
        <h1 className="section-title mt-2">{title}</h1>
        <p className="mt-3 text-sm text-stone-600 sm:text-base">
          {photos.length} {photos.length === 1 ? "photo" : "photos"} · Tap a
          thumbnail below to preview, then download your favorites.
        </p>
      </header>

      {error && (
        <p
          className="mt-6 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}

      {selected && (
        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-stone-200/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.displayUrl}
            alt={selected.filename}
            className="max-h-[min(70vh,720px)] w-full bg-stone-100 object-contain"
          />
          <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="truncate text-sm text-stone-600">
              {selected.filename}
            </span>
            {allowDownload && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary w-full shrink-0 !px-6 !py-2.5 sm:w-auto disabled:opacity-60"
              >
                {downloading ? "Preparing download…" : "Download photo"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <ClientPhotoGrid
          photos={photos}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}
