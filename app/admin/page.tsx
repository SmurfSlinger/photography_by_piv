import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import AdminNavCard from "@/components/admin/AdminNavCard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DashboardSummary = {
  toReply: number;
  scheduled: number;
  draftGalleries: number;
};

async function loadDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const [toReply, scheduled, draftGalleries] = await Promise.all([
      prisma.bookingInquiry.count({ where: { status: "new" } }),
      prisma.bookingInquiry.count({ where: { status: "scheduled" } }),
      prisma.gallery.count({ where: { status: "draft" } }),
    ]);

    return { toReply, scheduled, draftGalleries };
  } catch (error) {
    console.error("admin dashboard summary failed", error);
    return null;
  }
}

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?from=/admin");
  }

  const summary = await loadDashboardSummary();

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <h1 className="section-title mt-2">Dashboard</h1>
        </div>
        <AdminLogoutButton />
      </header>

      {summary ? (
        <section
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3"
          aria-label="What needs attention"
        >
          <Link
            href="/admin/inquiries?status=new"
            className="rounded-xl border border-stone-200/80 bg-white px-5 py-4 shadow-sm transition hover:border-[#5c6b4a]/40 hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              To reply
            </p>
            <p className="mt-2 font-serif text-2xl text-stone-900">
              {summary.toReply}
            </p>
          </Link>
          <Link
            href="/admin/inquiries?status=scheduled"
            className="rounded-xl border border-stone-200/80 bg-white px-5 py-4 shadow-sm transition hover:border-[#5c6b4a]/40 hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Scheduled
            </p>
            <p className="mt-2 font-serif text-2xl text-stone-900">
              {summary.scheduled}
            </p>
          </Link>
          <Link
            href="/admin/galleries"
            className="rounded-xl border border-stone-200/80 bg-white px-5 py-4 shadow-sm transition hover:border-[#5c6b4a]/40 hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Draft galleries
            </p>
            <p className="mt-2 font-serif text-2xl text-stone-900">
              {summary.draftGalleries}
            </p>
          </Link>
        </section>
      ) : null}

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminNavCard title="Inquiries" href="/admin/inquiries" />
        <AdminNavCard title="Clients" href="/admin/clients" />
        <AdminNavCard title="Galleries" href="/admin/galleries" />
      </section>
    </main>
  );
}
