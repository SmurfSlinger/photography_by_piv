import Link from "next/link";

export default function AdminClientNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="section-title">Client not found</h1>
      <p className="mt-4 text-sm text-stone-600">
        That client may have been removed.
      </p>
      <p className="mt-6 text-sm">
        <Link
          href="/admin/clients"
          className="text-[#5c6b4a] underline-offset-2 hover:underline"
        >
          ← Clients
        </Link>
      </p>
    </main>
  );
}
