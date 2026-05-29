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
      setError(data.error ?? "Could not load photos");
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
    try {
      const response = await fetch(
        `/api/galleries/${slug}/photos/${selected.id}/download`,
        { method: "POST" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Download failed");
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
    return (
      <p className="px-6 py-24 text-center text-stone-600">Loading photos…</p>
    );
  }

  if (error) {
    return (
      <p className="px-6 py-24 text-center text-red-700">{error}</p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl text-stone-800 sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-stone-500">
        Full-resolution previews until dedicated web/thumb sizes are added.
      </p>

      {selected && (
        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.displayUrl}
            alt={selected.filename}
            className="max-h-[70vh] w-full object-contain"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3">
            <span className="text-sm text-stone-600">{selected.filename}</span>
            {allowDownload && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-full bg-[#5c6b4a] px-5 py-2 text-sm font-medium text-white hover:bg-[#4a5740] disabled:opacity-60"
              >
                {downloading ? "Preparing…" : "Download original"}
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
