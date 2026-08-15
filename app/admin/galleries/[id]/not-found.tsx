import Link from "next/link";

export default function AdminGalleryNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="section-title">Gallery not found</h1>
      <p className="mt-4 text-sm text-stone-600">
        That gallery may have been removed.
      </p>
      <p className="mt-6 text-sm">
        <Link
          href="/admin/galleries"
          className="text-[#5c6b4a] underline-offset-2 hover:underline"
        >
          ← Client galleries
        </Link>
      </p>
    </main>
  );
}
