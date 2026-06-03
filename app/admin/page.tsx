import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import AdminNavCard from "@/components/admin/AdminNavCard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  formatInquiryDateTime,
  spamAssessmentForInquiry,
} from "@/lib/booking-inquiry-display";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DashboardSummary = {
  totalInquiries: number;
  newestAt: Date | null;
  flaggedCount: number;
};

async function loadDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const [totalInquiries, newest, allInquiries] = await Promise.all([
      prisma.bookingInquiry.count(),
      prisma.bookingInquiry.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.bookingInquiry.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const flaggedCount = allInquiries.filter(
      (inquiry) => spamAssessmentForInquiry(inquiry).flagged
    ).length;

    return {
      totalInquiries,
      newestAt: newest?.createdAt ?? null,
      flaggedCount,
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
        <section
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
          aria-label="Booking inquiry summary"
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
            <p className="mt-1 text-xs text-amber-800/90">Recomputed from saved text</p>
          </div>
        </section>
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
          title="Client galleries"
          description="Upload and share private client galleries."
          disabled
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
