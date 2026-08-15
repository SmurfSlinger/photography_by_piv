"use client";

import { useMemo, useState } from "react";

import {
  formatBookedDate,
  monthGrid,
  monthTitle,
  splitIsoDate,
  todayIsoInDenver,
  type OccupiedBooking,
} from "@/lib/inquiry-phase";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HintDate = {
  date: string;
  label: string;
};

type Props = {
  selectedDate: string | null;
  occupied: OccupiedBooking[];
  currentInquiryId?: string;
  currentClientId?: string;
  hintDates?: HintDate[];
  onSelect?: (date: string) => void;
  hrefForDate?: (booking: OccupiedBooking) => string;
};

function initialMonth(selectedDate: string | null): { year: number; monthIndex0: number } {
  const fromSelected = selectedDate ? splitIsoDate(selectedDate) : null;
  if (fromSelected) return fromSelected;
  const today = splitIsoDate(todayIsoInDenver());
  if (today) return today;
  const now = new Date();
  return { year: now.getUTCFullYear(), monthIndex0: now.getUTCMonth() };
}

export default function BookingDayCalendar({
  selectedDate,
  occupied,
  currentInquiryId,
  currentClientId,
  hintDates = [],
  onSelect,
  hrefForDate,
}: Props) {
  const [{ year, monthIndex0 }, setMonth] = useState(() =>
    initialMonth(selectedDate)
  );

  const occupiedByDate = useMemo(() => {
    const map = new Map<string, OccupiedBooking[]>();
    for (const booking of occupied) {
      const list = map.get(booking.date) ?? [];
      list.push(booking);
      map.set(booking.date, list);
    }
    return map;
  }, [occupied]);

  const hintByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const hint of hintDates) {
      if (hint.date) map.set(hint.date, hint.label);
    }
    return map;
  }, [hintDates]);

  const today = todayIsoInDenver();
  const cells = monthGrid(year, monthIndex0);
  const interactive = Boolean(onSelect);

  function shiftMonth(delta: number) {
    setMonth((current) => {
      const next = new Date(Date.UTC(current.year, current.monthIndex0 + delta, 1));
      return {
        year: next.getUTCFullYear(),
        monthIndex0: next.getUTCMonth(),
      };
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-serif text-base text-stone-900">
          {monthTitle(year, monthIndex0)}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div
        className="mt-3 grid grid-cols-7 gap-1"
        role="grid"
        aria-label={monthTitle(year, monthIndex0)}
      >
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-stone-400"
            role="columnheader"
          >
            {label}
          </div>
        ))}
        {cells.map((cell) => {
          const slots = occupiedByDate.get(cell.iso) ?? [];
          const own = slots.some(
            (booking) =>
              (currentInquiryId && booking.inquiryId === currentInquiryId) ||
              (currentClientId && booking.clientId === currentClientId)
          );
          const hasBookings = slots.length > 0;
          const selected = selectedDate === cell.iso;
          const hint = hintByDate.get(cell.iso);
          const names = slots.map((slot) => slot.name).join(", ");
          const labelParts = [
            formatBookedDate(cell.iso, "long"),
            hasBookings ? names : null,
            hint && !hasBookings ? hint : null,
          ].filter(Boolean);

          const className = [
            "relative flex aspect-square items-center justify-center rounded-lg text-sm transition",
            cell.inMonth ? "text-stone-800" : "text-stone-300",
            selected
              ? "bg-[#5c6b4a] font-medium text-white"
              : own
                ? "bg-violet-100 font-medium text-violet-900"
                : hasBookings
                  ? "bg-violet-50 text-stone-800"
                  : interactive
                    ? "hover:bg-[#5c6b4a]/10"
                    : "",
            cell.iso === today && !selected
              ? "ring-1 ring-[#5c6b4a]/40"
              : "",
            hint && !selected && !hasBookings ? "ring-1 ring-amber-300" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const single = slots.length === 1 ? slots[0] : null;
          const inner = (
            <>
              {cell.day}
              {hasBookings && !selected ? (
                <span
                  className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-violet-500"
                  aria-hidden
                />
              ) : null}
            </>
          );

          if (!interactive && hrefForDate && single) {
            return (
              <a
                key={cell.iso}
                href={hrefForDate(single)}
                className={className}
                aria-label={labelParts.join(", ")}
                title={names}
              >
                {inner}
              </a>
            );
          }

          if (!interactive) {
            return (
              <div
                key={cell.iso}
                className={className}
                aria-label={labelParts.join(", ")}
                title={names || undefined}
                role="gridcell"
              >
                {inner}
              </div>
            );
          }

          return (
            <button
              key={cell.iso}
              type="button"
              className={className}
              aria-label={labelParts.join(", ")}
              aria-pressed={selected}
              title={names || undefined}
              onClick={() => onSelect?.(cell.iso)}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
