import type { Prisma } from "@prisma/client";

import {
  BOOKED_INQUIRY_STATUSES,
  CANCELED_INQUIRY_STATUSES,
  type InquiryPhase,
  type OccupiedBooking,
  isoDateFromValue,
} from "@/lib/inquiry-phase";
import {
  denverDateFromDateTime,
  rangesOverlap,
  slotRange,
} from "@/lib/inquiry-time";
import { prisma } from "@/lib/prisma";

export type { OccupiedBooking };

export type BookingExcept = {
  inquiryId?: string;
  clientId?: string;
};

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

function toOccupied(input: {
  start: Date;
  end: Date | null;
  name: string;
  inquiryId?: string;
  clientId?: string | null;
}): OccupiedBooking | null {
  const range = slotRange(input.start, input.end);
  if (!range) return null;
  const date = range.allDay
    ? isoDateFromValue(input.start)
    : denverDateFromDateTime(input.start);
  if (!date) return null;
  return {
    date,
    name: input.name,
    startAt: range.start.toISOString(),
    endAt: range.end.toISOString(),
    allDay: range.allDay,
    inquiryId: input.inquiryId,
    clientId: input.clientId ?? undefined,
  };
}

export async function loadOccupiedBookings(): Promise<OccupiedBooking[]> {
  const [inquiryRows, clientRows] = await Promise.all([
    prisma.bookingInquiry.findMany({
      where: {
        scheduledAt: { not: null },
        status: { in: [...BOOKED_INQUIRY_STATUSES] },
      },
      select: {
        id: true,
        name: true,
        scheduledAt: true,
        scheduledEndAt: true,
        clientId: true,
        client: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.client.findMany({
      where: { scheduledAt: { not: null } },
      select: {
        id: true,
        name: true,
        scheduledAt: true,
        scheduledEndAt: true,
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const occupied: OccupiedBooking[] = [];
  const inquiryClientDays = new Set<string>();

  for (const row of inquiryRows) {
    if (!row.scheduledAt) continue;
    const booking = toOccupied({
      start: row.scheduledAt,
      end: row.scheduledEndAt,
      name: row.client?.name ?? row.name,
      inquiryId: row.id,
      clientId: row.clientId,
    });
    if (!booking) continue;
    if (row.clientId) inquiryClientDays.add(`${row.clientId}:${booking.date}`);
    occupied.push(booking);
  }

  for (const row of clientRows) {
    if (!row.scheduledAt) continue;
    const booking = toOccupied({
      start: row.scheduledAt,
      end: row.scheduledEndAt,
      name: row.name,
      clientId: row.id,
    });
    if (!booking) continue;
    if (inquiryClientDays.has(`${row.id}:${booking.date}`)) continue;
    occupied.push(booking);
  }

  occupied.sort((a, b) => a.startAt.localeCompare(b.startAt));
  return occupied;
}

export async function findOverlappingBooking(
  start: Date,
  end: Date,
  except: BookingExcept = {}
): Promise<OccupiedBooking | null> {
  const occupied = await loadOccupiedBookings();
  return (
    occupied.find((booking) => {
      if (except.inquiryId && booking.inquiryId === except.inquiryId) {
        return false;
      }
      if (except.clientId && booking.clientId === except.clientId && !booking.inquiryId) {
        return false;
      }
      return rangesOverlap(
        start,
        end,
        new Date(booking.startAt),
        new Date(booking.endAt)
      );
    }) ?? null
  );
}
