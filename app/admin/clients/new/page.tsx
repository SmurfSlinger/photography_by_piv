import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import ClientForm from "@/components/admin/ClientForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?from=/admin/clients/new");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <p className="mt-1 text-sm">
            <Link
              href="/admin/clients"
              className="text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              ← Clients
            </Link>
          </p>
          <h1 className="section-title mt-2">New client</h1>
        </div>
        <AdminLogoutButton />
      </header>

      <div className="mt-8">
        <ClientForm />
      </div>
    </main>
  );
}
