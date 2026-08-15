import type { Prisma } from "@prisma/client";

import {
  BOOKED_INQUIRY_STATUSES,
  CANCELED_INQUIRY_STATUSES,
  type InquiryPhase,
  type OccupiedBooking,
  isoDateFromValue,
  utcNoonFromIso,
} from "@/lib/inquiry-phase";
import { prisma } from "@/lib/prisma";

export type { OccupiedBooking };

export function prismaWhereForPhase(
  phase: InquiryPhase
): Prisma.BookingInquiryWhereInput {
  switch (phase) {
    case "new":
      return { status: "new" };
    case "contacted":
      return { status: "contacted" };
    case "booked":
      return { status: { in: [...BOOKED_INQUIRY_STATUSES] } };
    case "canceled":
      return { status: { in: [...CANCELED_INQUIRY_STATUSES] } };
  }
}

export async function loadOccupiedBookings(): Promise<OccupiedBooking[]> {
  const rows = await prisma.bookingInquiry.findMany({
    where: {
      scheduledAt: { not: null },
      status: { in: [...BOOKED_INQUIRY_STATUSES] },
    },
    select: {
      id: true,
      name: true,
      scheduledAt: true,
      client: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return rows.flatMap((row) => {
    const date = isoDateFromValue(row.scheduledAt);
    if (!date) return [];
    return [
      {
        date,
        inquiryId: row.id,
        name: row.client?.name ?? row.name,
      },
    ];
  });
}

export async function findBookingOnDate(
  iso: string,
  exceptInquiryId?: string
): Promise<OccupiedBooking | null> {
  if (!utcNoonFromIso(iso)) return null;

  const rangeStart = new Date(`${iso}T00:00:00.000Z`);
  const nextDay = new Date(rangeStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const row = await prisma.bookingInquiry.findFirst({
    where: {
      status: { in: [...BOOKED_INQUIRY_STATUSES] },
      scheduledAt: { gte: rangeStart, lt: nextDay },
      ...(exceptInquiryId ? { id: { not: exceptInquiryId } } : {}),
    },
    select: {
      id: true,
      name: true,
      scheduledAt: true,
      client: { select: { name: true } },
    },
  });

  if (!row) return null;
  const date = isoDateFromValue(row.scheduledAt) ?? iso;
  return {
    date,
    inquiryId: row.id,
    name: row.client?.name ?? row.name,
  };
}
