import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import AdminNavCard from "@/components/admin/AdminNavCard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatInquiryDateTime } from "@/lib/booking-inquiry-display";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DashboardSummary = {
  totalInquiries: number;
  newestAt: Date | null;
  flaggedCount: number;
  newCount: number;
  needsContactCount: number;
  contactedCount: number;
  scheduledCount: number;
  archivedCanceledCount: number;
};

async function loadDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const [
      totalInquiries,
      newest,
      newCount,
      needsContactCount,
      contactedCount,
      scheduledCount,
      archivedCanceledCount,
    ] = await Promise.all([
      prisma.bookingInquiry.count(),
      prisma.bookingInquiry.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.bookingInquiry.count({ where: { status: "new" } }),
      prisma.bookingInquiry.count({
        where: { status: "new", spamFlagged: false },
      }),
      prisma.bookingInquiry.count({ where: { status: "contacted" } }),
      prisma.bookingInquiry.count({ where: { status: "scheduled" } }),
      prisma.bookingInquiry.count({
        where: { status: { in: ["archived", "canceled"] } },
      }),
    ]);

    let flaggedCount = 0;
    try {
      flaggedCount = await prisma.bookingInquiry.count({
        where: { spamFlagged: true },
      });
    } catch (spamCountError) {
      console.warn("admin dashboard spam count unavailable", spamCountError);
    }

    return {
      totalInquiries,
      newestAt: newest?.createdAt ?? null,
      flaggedCount,
      newCount,
      needsContactCount,
      contactedCount,
      scheduledCount,
      archivedCanceledCount,
    };
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
          <p className="mt-2 text-sm text-stone-600">
            Photography by Piv — internal tools
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      {summary ? (
        <>
          <section
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
            aria-label="Inquiry workflow summary"
          >
            <Link
              href="/admin/inquiries?status=new"
              className="rounded-xl border border-sky-200/80 bg-sky-50/40 px-4 py-4 shadow-sm transition hover:border-sky-300"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-sky-800">
                New inquiries
              </p>
              <p className="mt-2 font-serif text-2xl text-sky-950">
                {summary.newCount}
              </p>
            </Link>
            <Link
              href="/admin/inquiries?status=new"
              className="rounded-xl border border-[#5c6b4a]/25 bg-[#5c6b4a]/5 px-4 py-4 shadow-sm transition hover:border-[#5c6b4a]/40"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[#3d4a32]">
                Needs contact
              </p>
              <p className="mt-2 font-serif text-2xl text-[#3d4a32]">
                {summary.needsContactCount}
              </p>
              <p className="mt-1 text-xs text-stone-500">New, not spam-flagged</p>
            </Link>
            <Link
              href="/admin/inquiries?status=contacted"
              className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-4 shadow-sm transition hover:border-emerald-300"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                Contacted
              </p>
              <p className="mt-2 font-serif text-2xl text-emerald-950">
                {summary.contactedCount}
              </p>
            </Link>
            <Link
              href="/admin/inquiries?status=scheduled"
              className="rounded-xl border border-violet-200/80 bg-violet-50/40 px-4 py-4 shadow-sm transition hover:border-violet-300"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-violet-800">
                Scheduled
              </p>
              <p className="mt-2 font-serif text-2xl text-violet-950">
                {summary.scheduledCount}
              </p>
            </Link>
            <Link
              href="/admin/inquiries?status=archived"
              className="rounded-xl border border-stone-200/80 bg-stone-50 px-4 py-4 shadow-sm transition hover:border-stone-300 sm:col-span-2 lg:col-span-1"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-stone-600">
                Archived / canceled
              </p>
              <p className="mt-2 font-serif text-2xl text-stone-700">
                {summary.archivedCanceledCount}
              </p>
            </Link>
          </section>

          <section
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
            aria-label="Booking inquiry overview"
          >
            <div className="rounded-xl border border-stone-200/80 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Total inquiries
              </p>
              <p className="mt-2 font-serif text-2xl text-stone-900">
                {summary.totalInquiries}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200/80 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Newest inquiry
              </p>
              <p className="mt-2 text-sm font-medium text-stone-900">
                {summary.newestAt
                  ? formatInquiryDateTime(summary.newestAt)
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                Possible spam
              </p>
              <p className="mt-2 font-serif text-2xl text-amber-950">
                {summary.flaggedCount}
              </p>
              <p className="mt-1 text-xs text-amber-800/90">Stored at submission</p>
            </div>
          </section>
        </>
      ) : (
        <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Summary unavailable — database may be unreachable. You can still open
          sections below.
        </p>
      )}

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AdminNavCard
          title="Booking inquiries"
          description="View session requests, contact details, and spam warnings."
          href="/admin/inquiries"
        />
        <AdminNavCard
          title="Clients"
          description="People converted from inquiries, or added by hand."
          href="/admin/clients"
        />
        <AdminNavCard
          title="Client galleries"
          description="Create galleries, upload photos, and share client links."
          href="/admin/galleries"
        />
        <AdminNavCard
          title="Payments & invoices"
          description="Track deposits, balances, and receipts."
          disabled
        />
        <AdminNavCard
          title="Site settings"
          description="Packages, pricing copy, and site configuration."
          disabled
        />
      </section>

      <p className="mt-10 text-center text-sm text-stone-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to public site
        </Link>
      </p>
    </main>
  );
}
