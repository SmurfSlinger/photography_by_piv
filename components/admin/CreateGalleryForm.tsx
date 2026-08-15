"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createGallery } from "@/lib/gallery-admin-actions";
import { slugifyGalleryTitle } from "@/lib/gallery-admin";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60";

export default function CreateGalleryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
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
        clientName,
        clientEmail,
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
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 className="font-serif text-lg text-stone-900">New gallery</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="gallery-title" className="text-xs font-medium uppercase tracking-wide text-stone-500">
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
          <label htmlFor="gallery-client" className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Client
          </label>
          <input
            id="gallery-client"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            disabled={pending}
            required
            maxLength={120}
            placeholder="Jordan Smith"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="gallery-email" className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Email
          </label>
          <input
            id="gallery-email"
            type="email"
            value={clientEmail}
            onChange={(event) => setClientEmail(event.target.value)}
            disabled={pending}
            maxLength={120}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="gallery-slug" className="text-xs font-medium uppercase tracking-wide text-stone-500">
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
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-4 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
