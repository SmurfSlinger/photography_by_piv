import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import InquiryList from "@/components/admin/InquiryList";
import InquiryStatusFilter from "@/components/admin/InquiryStatusFilter";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { inquiriesWithSpam } from "@/lib/booking-inquiry-display";
import {
  loadOccupiedBookings,
  prismaWhereForPhase,
} from "@/lib/inquiry-bookings";
import {
  INQUIRY_PHASES,
  INQUIRY_PHASE_LABELS,
  parseInquiryPhaseFilter,
  type InquiryPhase,
} from "@/lib/inquiry-phase";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_INQUIRIES = 200;

type PageProps = {
  searchParams: Promise<{ status?: string; open?: string }>;
};

async function loadPhaseCounts(): Promise<Record<InquiryPhase | "all", number>> {
  const grouped = await prisma.bookingInquiry.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const byStatus = Object.fromEntries(
    grouped.map((row) => [row.status, row._count._all])
  ) as Record<string, number>;

  const counts: Record<InquiryPhase | "all", number> = {
    all: 0,
    new: byStatus.new ?? 0,
    contacted: byStatus.contacted ?? 0,
    booked:
      (byStatus.scheduled ?? 0) + (byStatus.converted_to_booking ?? 0),
    canceled: (byStatus.canceled ?? 0) + (byStatus.archived ?? 0),
  };
  counts.all = INQUIRY_PHASES.reduce((sum, phase) => sum + counts[phase], 0);
  return counts;
}

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?from=/admin/inquiries");
  }

  const { status: statusParam, open: openId } = await searchParams;
  const phaseFilter = parseInquiryPhaseFilter(statusParam);

  let inquiries;
  let phaseCounts: Record<InquiryPhase | "all", number> | null = null;
  let occupied = [] as Awaited<ReturnType<typeof loadOccupiedBookings>>;
  try {
    const where =
      phaseFilter !== null ? prismaWhereForPhase(phaseFilter) : undefined;

    [inquiries, phaseCounts, occupied] = await Promise.all([
      prisma.bookingInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: MAX_INQUIRIES,
        include: {
          client: { select: { id: true, name: true } },
        },
      }),
      loadPhaseCounts(),
      loadOccupiedBookings(),
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
            Newest first · showing up to {MAX_INQUIRIES}
            {phaseFilter
              ? ` · ${INQUIRY_PHASE_LABELS[phaseFilter].toLowerCase()}`
              : ""}
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      {phaseCounts ? (
        <div className="mt-6">
          <InquiryStatusFilter
            activePhase={phaseFilter}
            counts={phaseCounts}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <InquiryList items={items} occupied={occupied} openId={openId} />
      </div>

      <p className="mt-10 text-center text-sm text-stone-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to site
        </Link>
      </p>
    </main>
  );
}
