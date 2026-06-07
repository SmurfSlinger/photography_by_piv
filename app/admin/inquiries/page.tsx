import type { InquiryStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import InquiryList from "@/components/admin/InquiryList";
import InquiryStatusFilter from "@/components/admin/InquiryStatusFilter";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  INQUIRY_STATUSES,
  isInquiryStatus,
  type InquiryStatusValue,
} from "@/lib/booking-inquiry-admin";

export const dynamic = "force-dynamic";
import { inquiriesWithSpam } from "@/lib/booking-inquiry-display";
import { prisma } from "@/lib/prisma";

const MAX_INQUIRIES = 200;

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

function parseStatusFilter(value: string | undefined): InquiryStatusValue | null {
  if (!value) return null;
  return isInquiryStatus(value) ? value : null;
}

async function loadStatusCounts(): Promise<Record<InquiryStatusValue | "all", number>> {
  const grouped = await prisma.bookingInquiry.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    INQUIRY_STATUSES.map((status) => [status, 0])
  ) as Record<InquiryStatusValue, number>;

  let total = 0;
  for (const row of grouped) {
    const status = row.status as InquiryStatusValue;
    counts[status] = row._count._all;
    total += row._count._all;
  }

  return { all: total, ...counts };
}

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?from=/admin/inquiries");
  }

  const { status: statusParam } = await searchParams;
  const statusFilter = parseStatusFilter(statusParam);

  let inquiries;
  let statusCounts: Record<InquiryStatusValue | "all", number> | null = null;
  try {
    const where =
      statusFilter !== null
        ? { status: statusFilter as InquiryStatus }
        : undefined;

    [inquiries, statusCounts] = await Promise.all([
      prisma.bookingInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: MAX_INQUIRIES,
      }),
      loadStatusCounts(),
    ]);
  } catch (error) {
    console.error("admin inquiries load failed", error);
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="section-title">Booking inquiries</h1>
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Unable to load inquiries. Check the database connection and try again.
        </p>
      </main>
    );
  }

  const items = inquiriesWithSpam(inquiries);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <p className="mt-1 text-sm">
            <Link href="/admin" className="text-[#5c6b4a] underline-offset-2 hover:underline">
              ← Dashboard
            </Link>
          </p>
          <h1 className="section-title mt-2">Booking inquiries</h1>
          <p className="mt-2 text-sm text-stone-600">
            Newest first · showing up to {MAX_INQUIRIES} inquiries
            {statusFilter ? ` · filtered to ${statusFilter.replaceAll("_", " ")}` : ""}
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      {statusCounts ? (
        <div className="mt-6">
          <InquiryStatusFilter
            activeStatus={statusFilter}
            counts={statusCounts}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <InquiryList items={items} />
      </div>

      <p className="mt-10 text-center text-sm text-stone-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to site
        </Link>
      </p>
    </main>
  );
}
