"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import BookDaySection from "@/components/admin/BookDaySection";
import {
  bookClientOnDate,
  cancelClientBooking,
} from "@/lib/client-admin-actions";
import { type OccupiedBooking } from "@/lib/inquiry-phase";
import {
  DEFAULT_SLOT_END,
  DEFAULT_SLOT_START,
  denverDateFromDateTime,
  denverTimeFromDateTime,
  formatBookedSlot,
} from "@/lib/inquiry-time";

type Props = {
  clientId: string;
  scheduledAt: Date | string | null;
  scheduledEndAt: Date | string | null;
  occupied: OccupiedBooking[];
};

export default function ClientBookingControls({
  clientId,
  scheduledAt,
  scheduledEndAt,
  occupied,
}: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    denverDateFromDateTime(scheduledAt)
  );
  const [startTime, setStartTime] = useState(
    scheduledEndAt
      ? denverTimeFromDateTime(scheduledAt) ?? DEFAULT_SLOT_START
      : DEFAULT_SLOT_START
  );
  const [endTime, setEndTime] = useState(
    scheduledEndAt
      ? denverTimeFromDateTime(scheduledEndAt) ?? DEFAULT_SLOT_END
      : DEFAULT_SLOT_END
  );
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
          Book
        </p>
        {scheduledAt ? (
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900">
            {formatBookedSlot(scheduledAt, scheduledEndAt)}
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <BookDaySection
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          startTime={startTime}
          endTime={endTime}
          onStartTime={setStartTime}
          onEndTime={setEndTime}
          occupied={occupied}
          currentClientId={clientId}
          bookedStartAt={scheduledAt}
          pending={pending}
          onBook={() => {
            if (!selectedDate) return;
            void run(() =>
              bookClientOnDate(clientId, selectedDate, startTime, endTime)
            );
          }}
          onCancel={
            scheduledAt
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
