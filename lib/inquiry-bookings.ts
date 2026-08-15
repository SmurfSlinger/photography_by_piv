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

function dayRange(iso: string): { rangeStart: Date; nextDay: Date } | null {
  if (!utcNoonFromIso(iso)) return null;
  const rangeStart = new Date(`${iso}T00:00:00.000Z`);
  const nextDay = new Date(rangeStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return { rangeStart, nextDay };
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
        clientId: true,
        client: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.client.findMany({
      where: { scheduledAt: { not: null } },
      select: { id: true, name: true, scheduledAt: true },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const occupied: OccupiedBooking[] = [];
  const inquiryClientDays = new Set<string>();

  for (const row of inquiryRows) {
    const date = isoDateFromValue(row.scheduledAt);
    if (!date) continue;
    if (row.clientId) inquiryClientDays.add(`${row.clientId}:${date}`);
    occupied.push({
      date,
      name: row.client?.name ?? row.name,
      inquiryId: row.id,
      clientId: row.clientId ?? undefined,
    });
  }

  for (const row of clientRows) {
    const date = isoDateFromValue(row.scheduledAt);
    if (!date) continue;
    if (inquiryClientDays.has(`${row.id}:${date}`)) continue;
    occupied.push({
      date,
      name: row.name,
      clientId: row.id,
    });
  }

  occupied.sort((a, b) => a.date.localeCompare(b.date));
  return occupied;
}

export async function findBookingOnDate(
  iso: string,
  except: BookingExcept = {}
): Promise<OccupiedBooking | null> {
  const range = dayRange(iso);
  if (!range) return null;

  const inquiry = await prisma.bookingInquiry.findFirst({
    where: {
      status: { in: [...BOOKED_INQUIRY_STATUSES] },
      scheduledAt: { gte: range.rangeStart, lt: range.nextDay },
      ...(except.inquiryId ? { id: { not: except.inquiryId } } : {}),
    },
    select: {
      id: true,
      name: true,
      scheduledAt: true,
      clientId: true,
      client: { select: { name: true } },
    },
  });

  if (inquiry) {
    return {
      date: isoDateFromValue(inquiry.scheduledAt) ?? iso,
      inquiryId: inquiry.id,
      clientId: inquiry.clientId ?? undefined,
      name: inquiry.client?.name ?? inquiry.name,
    };
  }

  const client = await prisma.client.findFirst({
    where: {
      scheduledAt: { gte: range.rangeStart, lt: range.nextDay },
      ...(except.clientId ? { id: { not: except.clientId } } : {}),
    },
    select: { id: true, name: true, scheduledAt: true },
  });

  if (!client) return null;
  return {
    date: isoDateFromValue(client.scheduledAt) ?? iso,
    clientId: client.id,
    name: client.name,
  };
}
