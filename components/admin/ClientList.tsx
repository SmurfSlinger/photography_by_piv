import Link from "next/link";

export type AdminClientRow = {
  id: string;
  name: string;
  email: string | null;
  galleryCount: number;
};

export default function ClientList({ clients }: { clients: AdminClientRow[] }) {
  if (clients.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center text-stone-500">
        No clients yet.{" "}
        <Link
          href="/admin/clients/new"
          className="text-[#5c6b4a] underline-offset-2 hover:underline"
        >
          New client
        </Link>
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {clients.map((client) => (
        <li key={client.id}>
          <Link
            href={`/admin/clients/${client.id}`}
            className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white px-4 py-4 shadow-sm transition hover:border-[#5c6b4a]/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a] sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-lg leading-tight text-stone-900">
                {client.name}
              </h2>
              <p className="mt-1 truncate text-sm text-stone-600">
                {client.email ?? "No email"}
              </p>
            </div>
            <span className="shrink-0 tabular-nums text-xs text-stone-500">
              {client.galleryCount}{" "}
              {client.galleryCount === 1 ? "gallery" : "galleries"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
