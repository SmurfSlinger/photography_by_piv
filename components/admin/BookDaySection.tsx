"use client";

import BookingDayCalendar from "@/components/admin/BookingDayCalendar";
import { type OccupiedBooking } from "@/lib/inquiry-phase";
import { denverTimeFromDateTime, formatDenverTime } from "@/lib/inquiry-time";

type HintDate = {
  date: string;
  label: string;
};

type Props = {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  startTime: string;
  endTime: string;
  onStartTime: (value: string) => void;
  onEndTime: (value: string) => void;
  occupied: OccupiedBooking[];
  currentInquiryId?: string;
  currentClientId?: string;
  bookedStartAt: Date | string | null;
  hintDates?: HintDate[];
  pending: boolean;
  onBook: () => void;
  onCancel?: () => void;
};

function isOwnBooking(
  booking: OccupiedBooking,
  currentInquiryId?: string,
  currentClientId?: string
): boolean {
  return Boolean(
    (currentInquiryId && booking.inquiryId === currentInquiryId) ||
      (currentClientId &&
        booking.clientId === currentClientId &&
        !booking.inquiryId)
  );
}

export default function BookDaySection({
  selectedDate,
  onSelect,
  startTime,
  endTime,
  onStartTime,
  onEndTime,
  occupied,
  currentInquiryId,
  currentClientId,
  bookedStartAt,
  hintDates = [],
  pending,
  onBook,
  onCancel,
}: Props) {
  const own = occupied.find((booking) =>
    isOwnBooking(booking, currentInquiryId, currentClientId)
  );
  const sameSlot = Boolean(
    own &&
      selectedDate === own.date &&
      denverTimeFromDateTime(own.startAt) === startTime &&
      denverTimeFromDateTime(own.endAt) === endTime
  );
  const daySlots = selectedDate
    ? occupied
        .filter((booking) => booking.date === selectedDate)
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
    : [];

  const inputClass =
    "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60";

  return (
    <div>
      <div className="rounded-lg border border-stone-200 bg-white px-3 py-3">
        <BookingDayCalendar
          selectedDate={selectedDate}
          occupied={occupied}
          currentInquiryId={currentInquiryId}
          currentClientId={currentClientId}
          hintDates={hintDates}
          onSelect={onSelect}
        />
      </div>

      {selectedDate ? (
        <div className="mt-3 space-y-3">
          {daySlots.length > 0 ? (
            <ul className="space-y-1 text-sm text-stone-600">
              {daySlots.map((slot) => (
                <li key={`${slot.inquiryId ?? slot.clientId}-${slot.startAt}`}>
                  {slot.allDay
                    ? slot.name
                    : `${formatDenverTime(slot.startAt)}–${formatDenverTime(slot.endAt)} ${slot.name}`}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              step={900}
              value={startTime}
              onChange={(event) => onStartTime(event.target.value)}
              disabled={pending}
              className={inputClass}
              aria-label="Start time"
            />
            <span className="text-stone-400">–</span>
            <input
              type="time"
              step={900}
              value={endTime}
              onChange={(event) => onEndTime(event.target.value)}
              disabled={pending}
              className={inputClass}
              aria-label="End time"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBook}
          disabled={pending || !selectedDate || sameSlot}
          className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {bookedStartAt ? "Update" : "Book"}
        </button>
        {bookedStartAt && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
