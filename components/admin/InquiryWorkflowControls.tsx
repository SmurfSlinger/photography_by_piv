"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  type InquiryStatusValue,
} from "@/lib/booking-inquiry-admin";
import { formatInquiryDateTime } from "@/lib/booking-inquiry-display";
import { updateInquiryWorkflow } from "@/lib/inquiry-workflow-actions";

type Props = {
  inquiryId: string;
  status: InquiryStatusValue | string;
  adminNotes: string | null;
  contactedAt: Date | string | null;
  archivedAt: Date | string | null;
};

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export default function InquiryWorkflowControls({
  inquiryId,
  status: initialStatus,
  adminNotes: initialNotes,
  contactedAt,
  archivedAt,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(String(initialStatus));
  const [adminNotes, setAdminNotes] = useState(initialNotes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const contacted = toDate(contactedAt);
  const archived = toDate(archivedAt);

  async function handleSave() {
    setPending(true);
    setError(null);

    const payload: { status?: InquiryStatusValue; adminNotes: string | null } = {
      adminNotes: adminNotes.trim().length > 0 ? adminNotes.trim() : null,
    };

    if (status !== initialStatus) {
      payload.status = status as InquiryStatusValue;
    }

    try {
      const result = await updateInquiryWorkflow(inquiryId, payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSavedAt(new Date());
      router.refresh();
    } catch {
      setError("Unable to save — try again");
    } finally {
      setPending(false);
    }
  }

  const hasChanges =
    status !== String(initialStatus) ||
    (adminNotes.trim() || null) !== (initialNotes?.trim() || null);

  return (
    <div className="mb-5 rounded-lg border border-[#5c6b4a]/20 bg-[#5c6b4a]/5 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a32]">
        Workflow
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`status-${inquiryId}`}
            className="text-xs font-medium uppercase tracking-wide text-stone-500"
          >
            Status
          </label>
          <select
            id={`status-${inquiryId}`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={pending}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60"
          >
            {INQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {INQUIRY_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-end text-xs text-stone-500">
          {contacted ? (
            <p>Contacted {formatInquiryDateTime(contacted)}</p>
          ) : null}
          {archived ? (
            <p className={contacted ? "mt-1" : ""}>
              Archived {formatInquiryDateTime(archived)}
            </p>
          ) : null}
          {!contacted && !archived ? <p>No workflow timestamps yet</p> : null}
        </div>
      </div>

      <div className="mt-4">
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
          placeholder="Follow-up notes, call outcomes, scheduling details…"
          className="mt-1 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || !hasChanges}
          className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save workflow"}
        </button>
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
