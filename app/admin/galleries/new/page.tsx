import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import CreateGalleryForm, {
  type GalleryClientOption,
} from "@/components/admin/CreateGalleryForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isClientId } from "@/lib/client-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ clientId?: string }>;
};

export default async function NewGalleryPage({ searchParams }: PageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?from=/admin/galleries/new");
  }

  const { clientId: clientIdParam } = await searchParams;
  const initialClientId =
    clientIdParam && isClientId(clientIdParam) ? clientIdParam : "";

  const clients: GalleryClientOption[] = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <p className="mt-1 text-sm">
            <Link
              href="/admin/galleries"
              className="text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              ← Client galleries
            </Link>
          </p>
          <h1 className="section-title mt-2">New gallery</h1>
        </div>
        <AdminLogoutButton />
      </header>

      <div className="mt-8">
        {clients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center text-stone-600">
            Create a client first, then come back to make their gallery.{" "}
            <Link
              href="/admin/clients/new"
              className="text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              New client
            </Link>
          </p>
        ) : (
          <CreateGalleryForm
            clients={clients}
            initialClientId={initialClientId}
          />
        )}
      </div>
    </main>
  );
}
