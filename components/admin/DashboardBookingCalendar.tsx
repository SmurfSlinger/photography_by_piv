"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import BookingDayCalendar from "@/components/admin/BookingDayCalendar";
import {
  bookingHref,
  bookingKey,
  todayIsoInDenver,
  type OccupiedBooking,
} from "@/lib/inquiry-phase";
import { formatDenverTime } from "@/lib/inquiry-time";

export default function DashboardBookingCalendar({
  occupied,
}: {
  occupied: OccupiedBooking[];
}) {
  const [selectedDate, setSelectedDate] = useState(todayIsoInDenver);

  const daySlots = useMemo(
    () =>
      occupied
        .filter((booking) => booking.date === selectedDate)
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [occupied, selectedDate]
  );

  return (
    <div>
      <BookingDayCalendar
        selectedDate={selectedDate}
        occupied={occupied}
        onSelect={setSelectedDate}
      />
      <ul className="mt-5 divide-y divide-stone-100 border-t border-stone-100">
        {daySlots.length === 0 ? (
          <li className="py-2.5 text-sm text-stone-500">None</li>
        ) : (
          daySlots.map((booking) => (
            <li key={bookingKey(booking)}>
              <Link
                href={bookingHref(booking)}
                className="flex items-baseline justify-between gap-3 py-2.5 text-sm hover:text-[#3d4a32]"
              >
                <span className="font-medium text-stone-800">
                  {booking.name}
                </span>
                <span className="shrink-0 text-stone-500">
                  {booking.allDay
                    ? "All day"
                    : `${formatDenverTime(booking.startAt)}–${formatDenverTime(booking.endAt)}`}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
