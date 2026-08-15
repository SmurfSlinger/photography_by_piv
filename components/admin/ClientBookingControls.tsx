"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import BookDaySection from "@/components/admin/BookDaySection";
import {
  bookClientOnDate,
  cancelClientBooking,
} from "@/lib/client-admin-actions";
import {
  formatBookedDate,
  isoDateFromValue,
  type OccupiedBooking,
} from "@/lib/inquiry-phase";

type Props = {
  clientId: string;
  clientName: string;
  scheduledAt: Date | string | null;
  occupied: OccupiedBooking[];
};

export default function ClientBookingControls({
  clientId,
  clientName,
  scheduledAt,
  occupied,
}: Props) {
  const router = useRouter();
  const bookedDate = isoDateFromValue(scheduledAt);
  const [selectedDate, setSelectedDate] = useState(bookedDate);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(
    action: () => Promise<{ ok: true } | { ok: false; error: string }>
  ) {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to save — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#5c6b4a]/20 bg-[#5c6b4a]/5 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a32]">
          Book a day
        </p>
        {bookedDate ? (
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900">
            Booked {formatBookedDate(bookedDate)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-stone-600">
        Added without an inquiry, so contacted is not required.
      </p>
      <div className="mt-3">
        <BookDaySection
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          occupied={occupied}
          currentClientId={clientId}
          bookedDate={bookedDate}
          bookedName={clientName}
          pending={pending}
          onBook={() => {
            if (!selectedDate) return;
            void run(() => bookClientOnDate(clientId, selectedDate));
          }}
          onCancel={
            bookedDate
              ? () => void run(() => cancelClientBooking(clientId))
              : undefined
          }
        />
      </div>
      {error ? (
        <p className="mt-3 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
