"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  GALLERY_STATUSES,
  GALLERY_STATUS_LABELS,
  type GalleryStatusValue,
} from "@/lib/gallery-admin";
import {
  createGalleryShareLink,
  revokeGalleryShareLink,
  updateGalleryStatus,
} from "@/lib/gallery-admin-actions";

export type GalleryTokenRow = {
  id: string;
  label: string | null;
  createdAt: Date | string;
  expiresAt: Date | string | null;
  revokedAt: Date | string | null;
};

type Props = {
  galleryId: string;
  status: GalleryStatusValue | string;
  tokens: GalleryTokenRow[];
};

export default function GalleryShareControls({
  galleryId,
  status: initialStatus,
  tokens,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(String(initialStatus));
  const [label, setLabel] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const archived = status === "archived";

  async function handleStatus(next: GalleryStatusValue) {
    if (next === status || pending) return;
    const previous = status;
    setStatus(next);
    setPending(true);
    setError(null);
    try {
      const result = await updateGalleryStatus(galleryId, next);
      if (!result.ok) {
        setStatus(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setStatus(previous);
      setError("Couldn’t update status");
    } finally {
      setPending(false);
    }
  }

  async function handleCreateLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (archived) return;
    setPending(true);
    setError(null);
    setShareUrl(null);
    setCopied(false);
    try {
      const result = await createGalleryShareLink(galleryId, label);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShareUrl(result.shareUrl);
      setLabel("");
      try {
        await navigator.clipboard.writeText(result.shareUrl);
        setCopied(true);
      } catch {
        setCopied(false);
      }
      router.refresh();
    } catch {
      setError("Couldn’t create link");
    } finally {
      setPending(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    setPending(true);
    setError(null);
    try {
      const result = await revokeGalleryShareLink(tokenId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn’t revoke link");
    } finally {
      setPending(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setError("Copy failed");
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-3 overflow-hidden rounded-lg border border-stone-200"
        role="group"
        aria-label="Status"
      >
        {GALLERY_STATUSES.map((value) => {
          const selected = status === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleStatus(value)}
              disabled={pending}
              className={
                "px-2 py-2 text-sm font-medium transition disabled:opacity-60 " +
                (selected
                  ? "bg-[#5c6b4a] text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50")
              }
            >
              {GALLERY_STATUS_LABELS[value]}
            </button>
          );
        })}
      </div>

      {tokens.length > 0 ? (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex items-center justify-between gap-3 bg-white px-3 py-2.5"
            >
              <span className="min-w-0 truncate text-sm text-stone-800">
                {token.label?.trim() || "Share link"}
              </span>
              <button
                type="button"
                onClick={() => handleRevoke(token.id)}
                disabled={pending}
                className="shrink-0 text-sm text-stone-500 hover:text-red-700 disabled:opacity-60"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!archived ? (
        <form onSubmit={handleCreateLink} className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={pending}
            maxLength={80}
            placeholder="Link name"
            aria-label="Link name"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending}
            className="btn-primary shrink-0 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "…" : "Create link"}
          </button>
        </form>
      ) : null}

      {shareUrl ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#5c6b4a]/25 bg-[#5c6b4a]/5 px-3 py-2">
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-stone-800">
            {shareUrl}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-[#5c6b4a] px-3 py-1.5 text-xs font-medium text-white"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
