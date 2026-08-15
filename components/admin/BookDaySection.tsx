"use client";

import BookingDayCalendar from "@/components/admin/BookingDayCalendar";
import {
  formatBookedDate,
  type OccupiedBooking,
} from "@/lib/inquiry-phase";

type HintDate = {
  date: string;
  label: string;
};

type Props = {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  occupied: OccupiedBooking[];
  currentInquiryId?: string;
  currentClientId?: string;
  bookedDate: string | null;
  bookedName?: string | null;
  hintDates?: HintDate[];
  pending: boolean;
  onBook: () => void;
  onCancel?: () => void;
};

export default function BookDaySection({
  selectedDate,
  onSelect,
  occupied,
  currentInquiryId,
  currentClientId,
  bookedDate,
  bookedName,
  hintDates = [],
  pending,
  onBook,
  onCancel,
}: Props) {
  const bookedForSelected = Boolean(
    selectedDate && bookedDate && selectedDate === bookedDate
  );

  return (
    <div>
      {bookedDate ? (
        <p className="text-sm text-stone-800">
          {bookedName ?? "Client"} is booked for{" "}
          {formatBookedDate(bookedDate, "long")}.
        </p>
      ) : (
        <p className="text-sm text-stone-600">
          Pick a free day. That holds the date on the calendar.
        </p>
      )}

      <div className="mt-3 rounded-lg border border-stone-200 bg-white px-3 py-3">
        <BookingDayCalendar
          selectedDate={selectedDate}
          occupied={occupied}
          currentInquiryId={currentInquiryId}
          currentClientId={currentClientId}
          hintDates={hintDates}
          onSelect={onSelect}
        />
      </div>

      {hintDates.length > 0 ? (
        <p className="mt-2 text-xs text-stone-500">
          {hintDates
            .map((hint) => `${hint.label} ${formatBookedDate(hint.date)}`)
            .join(" · ")}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBook}
          disabled={pending || !selectedDate || bookedForSelected}
          className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {bookedDate
            ? "Update date"
            : selectedDate
              ? `Book ${formatBookedDate(selectedDate)}`
              : "Book this day"}
        </button>
        {bookedDate && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel booking
          </button>
        ) : null}
      </div>
    </div>
  );
}
