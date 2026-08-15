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
import { formatInquiryDateTime } from "@/lib/booking-inquiry-display";

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

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function requiredDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

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

  async function handleStatusSave() {
    setPending(true);
    setError(null);
    try {
      const result = await updateGalleryStatus(
        galleryId,
        status as GalleryStatusValue
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to save status — try again");
    } finally {
      setPending(false);
    }
  }

  async function handleCreateLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      router.refresh();
    } catch {
      setError("Unable to create share link — try again");
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
      setError("Unable to revoke link — try again");
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
      setError("Copy failed — select the URL and copy it manually");
    }
  }

  const statusChanged = status !== String(initialStatus);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#5c6b4a]/20 bg-[#5c6b4a]/5 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a32]">
          Gallery status
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`gallery-status-${galleryId}`}
              className="text-xs font-medium uppercase tracking-wide text-stone-500"
            >
              Status
            </label>
            <select
              id={`gallery-status-${galleryId}`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={pending}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60"
            >
              {GALLERY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {GALLERY_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleStatusSave}
            disabled={pending || !statusChanged}
            className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && statusChanged ? "Saving…" : "Save status"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Share links
        </p>
        <p className="mt-1 text-xs text-stone-500">
          New links are shown once. Existing rows only show the label and dates —
          the secret is not stored in readable form.
        </p>

        {tokens.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">No share links yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tokens.map((token) => {
              const revoked = toDate(token.revokedAt);
              const expires = toDate(token.expiresAt);
              return (
                <li
                  key={token.id}
                  className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-stone-800">
                      {token.label?.trim() ? token.label : "Untitled link"}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Created {formatInquiryDateTime(requiredDate(token.createdAt))}
                      {expires ? ` · Expires ${formatInquiryDateTime(expires)}` : ""}
                      {revoked
                        ? ` · Revoked ${formatInquiryDateTime(revoked)}`
                        : ""}
                    </p>
                  </div>
                  {revoked ? (
                    <span className="shrink-0 text-xs text-stone-400">Revoked</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRevoke(token.id)}
                      disabled={pending}
                      className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-red-300 hover:text-red-800 disabled:opacity-60"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={handleCreateLink} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor={`link-label-${galleryId}`}
              className="text-xs font-medium uppercase tracking-wide text-stone-500"
            >
              New link label (optional)
            </label>
            <input
              id={`link-label-${galleryId}`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={pending || String(initialStatus) === "archived"}
              maxLength={80}
              placeholder="e.g. Sophie — June 2026"
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={pending || String(initialStatus) === "archived"}
            className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Please wait…" : "Create share link"}
          </button>
        </form>

        {shareUrl ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
              Copy this link now — it will not be shown again
            </p>
            <p className="mt-2 break-all font-mono text-xs text-stone-800">
              {shareUrl}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
