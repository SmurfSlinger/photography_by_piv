"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import BookDaySection from "@/components/admin/BookDaySection";
import { formatInquiryDateTime } from "@/lib/booking-inquiry-display";
import {
  bookInquiryOnDate,
  cancelInquiryBooking,
  reopenInquiry,
  saveInquiryNotes,
  setInquiryContacted,
} from "@/lib/inquiry-workflow-actions";
import {
  formatBookedDate,
  inquiryPhase,
  inquiryPhaseBadgeClass,
  inquiryPhaseLabel,
  isoDateFromValue,
  type InquiryPhase,
  type OccupiedBooking,
} from "@/lib/inquiry-phase";

type Props = {
  inquiryId: string;
  status: string;
  adminNotes: string | null;
  contactedAt: Date | string | null;
  scheduledAt: Date | string | null;
  archivedAt: Date | string | null;
  preferredDate: Date | string | null;
  backupDate: Date | string | null;
  clientId: string | null;
  clientName: string | null;
  occupied: OccupiedBooking[];
};

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export default function InquiryWorkflowControls({
  inquiryId,
  status,
  adminNotes: initialNotes,
  contactedAt,
  scheduledAt,
  archivedAt,
  preferredDate,
  backupDate,
  clientId,
  clientName,
  occupied,
}: Props) {
  const router = useRouter();
  const [adminNotes, setAdminNotes] = useState(initialNotes ?? "");
  const [selectedDate, setSelectedDate] = useState(
    isoDateFromValue(scheduledAt) ?? isoDateFromValue(preferredDate)
  );
  const [contactedOverride, setContactedOverride] = useState<boolean | null>(
    null
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const phase: InquiryPhase = inquiryPhase({
    status,
    scheduledAt,
    contactedAt,
  });
  const bookedDate = isoDateFromValue(scheduledAt);
  const contacted = toDate(contactedAt);
  const archived = toDate(archivedAt);
  const contactedChecked =
    contactedOverride ?? (phase !== "new" && phase !== "canceled");
  const canBook = phase === "booked" || phase === "contacted";
  const notesChanged =
    (adminNotes.trim() || null) !== (initialNotes?.trim() || null);

  const hintDates = useMemo(() => {
    const hints: { date: string; label: string }[] = [];
    const preferred = isoDateFromValue(preferredDate);
    const backup = isoDateFromValue(backupDate);
    if (preferred) hints.push({ date: preferred, label: "Preferred date" });
    if (backup) hints.push({ date: backup, label: "Backup date" });
    return hints;
  }, [preferredDate, backupDate]);

  async function run(
    action: () => Promise<{ ok: true } | { ok: false; error: string }>
  ): Promise<boolean> {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setSavedAt(new Date());
      router.refresh();
      return true;
    } catch {
      setError("Unable to save — try again");
      return false;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-5 rounded-lg border border-[#5c6b4a]/20 bg-[#5c6b4a]/5 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a32]">
          Workflow
        </p>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${inquiryPhaseBadgeClass(phase)}`}
        >
          {phase === "booked" && bookedDate
            ? `Booked ${formatBookedDate(bookedDate)}`
            : inquiryPhaseLabel(phase)}
        </span>
      </div>

      {phase === "canceled" ? (
        <div className="mt-4">
          <p className="text-sm text-stone-600">
            Canceled
            {archived ? ` ${formatInquiryDateTime(archived)}` : ""}. The day is
            free again.
          </p>
          <button
            type="button"
            onClick={() => void run(() => reopenInquiry(inquiryId))}
            disabled={pending}
            className="mt-3 rounded-full border border-[#5c6b4a] bg-white px-4 py-2 text-sm font-medium text-[#3d4a32] transition hover:bg-[#5c6b4a]/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reopen
          </button>
        </div>
      ) : (
        <>
          <section className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Contact
            </p>
            <label className="mt-2 flex items-center gap-2 text-sm text-stone-800">
              <input
                type="checkbox"
                checked={contactedChecked}
                disabled={pending || phase === "booked"}
                onChange={(e) => {
                  const next = e.target.checked;
                  setContactedOverride(next);
                  void run(() => setInquiryContacted(inquiryId, next)).then(
                    (ok) => {
                      if (!ok) setContactedOverride(null);
                    }
                  );
                }}
                className="size-4 rounded border-stone-300 text-[#5c6b4a] focus:ring-[#5c6b4a]"
              />
              Contacted
              {contacted ? (
                <span className="text-xs text-stone-500">
                  {formatInquiryDateTime(contacted)}
                </span>
              ) : null}
            </label>
            {!contactedChecked ? (
              <p className="mt-2 text-sm text-stone-600">
                Check this after you reply. Booking unlocks next.
              </p>
            ) : null}
          </section>

          <section className="mt-4 border-t border-[#5c6b4a]/15 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {phase === "booked" ? "Booked day" : "Book a day"}
            </p>
            {canBook ? (
              <div className="mt-2">
                <BookDaySection
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  occupied={occupied}
                  currentInquiryId={inquiryId}
                  bookedDate={bookedDate}
                  bookedName={clientName}
                  hintDates={hintDates}
                  pending={pending}
                  onBook={() => {
                    if (!selectedDate) return;
                    void run(() => bookInquiryOnDate(inquiryId, selectedDate));
                  }}
                  onCancel={
                    phase === "booked"
                      ? () => void run(() => cancelInquiryBooking(inquiryId))
                      : undefined
                  }
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-stone-500">
                Calendar stays put until this inquiry is marked contacted.
              </p>
            )}
          </section>
        </>
      )}

      <section className="mt-4 border-t border-[#5c6b4a]/15 pt-4">
        <label
          htmlFor={`notes-${inquiryId}`}
          className="text-xs font-medium uppercase tracking-wide text-stone-500"
        >
          Admin notes (private)
        </label>
        <textarea
          id={`notes-${inquiryId}`}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          disabled={pending}
          rows={3}
          placeholder="Follow-up notes, call outcomes…"
          className="mt-1 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60"
        />
      </section>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void run(() => saveInquiryNotes(inquiryId, adminNotes))}
          disabled={pending || !notesChanged}
          className="rounded-full border border-[#5c6b4a] bg-white px-4 py-2 text-sm font-medium text-[#3d4a32] transition hover:bg-[#5c6b4a]/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save notes"}
        </button>
        {clientId ? (
          <>
            <Link
              href={`/admin/clients/${clientId}`}
              className="text-sm font-medium text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              {clientName ?? "Open client"}
            </Link>
            <Link
              href={`/admin/galleries/new?clientId=${clientId}`}
              className="text-sm font-medium text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              New gallery
            </Link>
          </>
        ) : null}
        {savedAt ? (
          <span className="text-xs text-stone-500">
            Saved {formatInquiryDateTime(savedAt)}
          </span>
        ) : null}
        {error ? (
          <span className="text-xs text-red-700" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
