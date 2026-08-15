import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import ClientList, {
  type AdminClientRow,
} from "@/components/admin/ClientList";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?from=/admin/clients");
  }

  let clients: AdminClientRow[];
  try {
    const rows = await prisma.client.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { galleries: true } } },
    });
    clients = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      galleryCount: row._count.galleries,
    }));
  } catch (error) {
    console.error("admin clients load failed", error);
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="section-title">Clients</h1>
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Unable to load clients. Check the database connection and try again.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <p className="mt-1 text-sm">
            <Link
              href="/admin"
              className="text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              ← Dashboard
            </Link>
          </p>
          <h1 className="section-title mt-2">Clients</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin/clients/new"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400"
          >
            Add without inquiry
          </Link>
          <AdminLogoutButton />
        </div>
      </header>

      <div className="mt-8">
        <ClientList clients={clients} />
      </div>
    </main>
  );
}
