"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { deleteGalleryPhoto } from "@/lib/gallery-admin-actions";
import {
  isAllowedPhotoContentType,
  MAX_GALLERY_PHOTO_BYTES,
  sanitizePhotoFilename,
} from "@/lib/gallery-admin";

export type AdminGalleryPhoto = {
  id: string;
  filename: string;
  displayUrl: string | null;
};

type Props = {
  galleryId: string;
  archived: boolean;
  photos: AdminGalleryPhoto[];
};

type UploadItem = {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,image/gif,.jpg,.jpeg,.png,.webp,.heic,.heif,.tif,.tiff,.gif";

function clientRejectReason(file: File): string | null {
  if (file.size <= 0) return "Empty file";
  if (file.size > MAX_GALLERY_PHOTO_BYTES) return "Larger than 50 MB";
  if (!isAllowedPhotoContentType(file.type)) return "Unsupported type";
  if (!sanitizePhotoFilename(file.name)) return "Use JPEG, PNG, WebP, HEIC, TIFF, or GIF";
  return null;
}

async function uploadFiles(galleryId: string, files: File[], onItem: (item: UploadItem) => void) {
  const queue = [...files];
  const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
    while (queue.length > 0) {
      const file = queue.shift();
      if (!file) return;
      const rejected = clientRejectReason(file);
      if (rejected) {
        onItem({ name: file.name, status: "error", error: rejected });
        continue;
      }
      onItem({ name: file.name, status: "uploading" });
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch(`/admin/api/galleries/${galleryId}/photos`, {
          method: "POST",
          body,
          credentials: "same-origin",
        });
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        if (!response.ok) {
          onItem({
            name: file.name,
            status: "error",
            error: data?.error ?? "Upload failed",
          });
          continue;
        }
        onItem({ name: file.name, status: "done" });
      } catch {
        onItem({ name: file.name, status: "error", error: "Network error" });
      }
    }
  });
  await Promise.all(workers);
}

export default function GalleryPhotoManager({
  galleryId,
  archived,
  photos,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  function mergeItem(next: UploadItem) {
    setItems((current) => {
      const index = current.findIndex(
        (item) => item.name === next.name && item.status === "uploading"
      );
      if (index >= 0) {
        const copy = [...current];
        copy[index] = next;
        return copy;
      }
      return [...current, next];
    });
  }

  async function handleFiles(fileList: FileList | File[]) {
    if (archived || pending) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setPending(true);
    setError(null);
    setItems(files.map((file) => ({ name: file.name, status: "uploading" as const })));
    await uploadFiles(galleryId, files, mergeItem);
    setPending(false);
    router.refresh();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(photoId: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await deleteGalleryPhoto(photoId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn’t remove photo");
    } finally {
      setPending(false);
    }
  }

  const uploadingCount = items.filter((item) => item.status === "uploading").length;
  const errorItems = items.filter((item) => item.status === "error");

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-lg text-stone-900">Photos</h2>
        <p className="tabular-nums text-sm text-stone-500">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
      </div>

      {archived ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
          Archived galleries can’t accept new photos.
        </p>
      ) : (
        <label
          onDragEnter={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={
            "flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-4 py-8 text-center transition " +
            (dragOver
              ? "border-[#5c6b4a] bg-[#5c6b4a]/5"
              : "border-stone-300 bg-white hover:border-[#5c6b4a]/50")
          }
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            disabled={pending}
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void handleFiles(event.target.files);
            }}
          />
          <span className="text-sm font-medium text-stone-800">
            {pending ? "Uploading…" : "Drop photos here or browse"}
          </span>
          <span className="mt-1 text-xs text-stone-500">
            JPEG, PNG, WebP, HEIC, TIFF, or GIF · 50 MB each
          </span>
        </label>
      )}

      {pending && uploadingCount > 0 ? (
        <p className="text-sm text-stone-600" aria-live="polite">
          Uploading {items.length - uploadingCount} of {items.length}
        </p>
      ) : null}

      {errorItems.length > 0 ? (
        <ul className="space-y-1 text-sm text-red-700" role="alert">
          {errorItems.map((item) => (
            <li key={`${item.name}-${item.error}`}>
              {item.name}: {item.error}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-lg border border-stone-200 bg-white"
            >
              {photo.displayUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.displayUrl}
                  alt=""
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-stone-100 px-2 text-center text-xs text-stone-500">
                  {photo.filename}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="min-w-0 truncate text-xs text-stone-600">
                  {photo.filename}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRemove(photo.id)}
                  disabled={pending}
                  className="shrink-0 text-xs text-stone-500 hover:text-red-700 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
