"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientOptionLabel } from "@/lib/client-admin";
import { createGallery } from "@/lib/gallery-admin-actions";
import { slugifyGalleryTitle } from "@/lib/gallery-admin";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60";

export type GalleryClientOption = {
  id: string;
  name: string;
  email: string | null;
};

export default function CreateGalleryForm({
  clients,
  initialClientId = "",
}: {
  clients: GalleryClientOption[];
  initialClientId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(
    clients.some((client) => client.id === initialClientId) ? initialClientId : ""
  );
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugifyGalleryTitle(value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const result = await createGallery({
        title,
        clientId,
        slug,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/galleries/${result.galleryId}`);
      router.refresh();
    } catch {
      setError("Couldn’t create gallery");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor="gallery-client"
            className="text-xs font-medium uppercase tracking-wide text-stone-500"
          >
            Client
          </label>
          <Link
            href="/admin/clients/new"
            className="text-xs text-[#5c6b4a] underline-offset-2 hover:underline"
          >
            New client
          </Link>
        </div>
        <select
          id="gallery-client"
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          disabled={pending}
          required
          className={inputClass}
        >
          <option value="">Choose a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {clientOptionLabel(client)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="gallery-title"
            className="text-xs font-medium uppercase tracking-wide text-stone-500"
          >
            Title
          </label>
          <input
            id="gallery-title"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            disabled={pending}
            required
            maxLength={120}
            placeholder="Smith wedding"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="gallery-slug"
            className="text-xs font-medium uppercase tracking-wide text-stone-500"
          >
            URL slug
          </label>
          <input
            id="gallery-slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            disabled={pending}
            maxLength={60}
            placeholder="smith-wedding"
            className={inputClass}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
