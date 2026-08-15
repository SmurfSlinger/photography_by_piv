import InquiryWorkflowControls from "@/components/admin/InquiryWorkflowControls";
import type { InquiryWithSpam } from "@/lib/booking-inquiry-display";
import {
  contactMethodsLabel,
  formatInquiryDate,
  formatInquiryDateTime,
  sessionTypeLabel,
} from "@/lib/booking-inquiry-display";
import {
  formatBookedDate,
  inquiryPhase,
  inquiryPhaseBadgeClass,
  inquiryPhaseLabel,
  isoDateFromValue,
  type OccupiedBooking,
} from "@/lib/inquiry-phase";

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const text = value?.trim();
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-stone-800">
        {text && text.length > 0 ? text : "—"}
      </dd>
    </div>
  );
}

function InquiryDetails({
  item,
  occupied,
}: {
  item: InquiryWithSpam;
  occupied: OccupiedBooking[];
}) {
  const { inquiry, spam, spamSource } = item;

  return (
    <div className="border-t border-stone-100 px-4 pb-5 pt-4 sm:px-5">
      <InquiryWorkflowControls
        inquiryId={inquiry.id}
        status={inquiry.status}
        adminNotes={inquiry.adminNotes}
        contactedAt={inquiry.contactedAt}
        scheduledAt={inquiry.scheduledAt}
        archivedAt={inquiry.archivedAt}
        preferredDate={inquiry.preferredDate}
        backupDate={inquiry.backupDate}
        clientId={item.client?.id ?? null}
        clientName={item.client?.name ?? null}
        occupied={occupied}
      />

      {spam.flagged && spam.reasons.length > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Flagged
            {spamSource === "recomputed"
              ? " (recomputed — pre-migration inquiry)"
              : ""}
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-950">
            {spam.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" value={inquiry.email} />
        <Field label="Phone" value={inquiry.phone} />
        <Field label="Instagram" value={inquiry.instagramHandle} />
        <Field label="Other contact" value={inquiry.contactOther} />
        <Field label="Package interest" value={inquiry.packageInterest} />
        <Field
          label="Preferred date"
          value={formatInquiryDate(inquiry.preferredDate)}
        />
        <Field
          label="Backup date"
          value={formatInquiryDate(inquiry.backupDate)}
        />
        <Field label="Location idea" value={inquiry.locationIdea} />
        <Field label="Vibe / style" value={inquiry.vibeStyle} />
      </dl>

      <div className="mt-4">
        <Field label="Message" value={inquiry.message} />
      </div>
    </div>
  );
}

function InquiryRow({
  item,
  occupied,
  defaultOpen,
}: {
  item: InquiryWithSpam;
  occupied: OccupiedBooking[];
  defaultOpen: boolean;
}) {
  const { inquiry, spam } = item;
  const phase = inquiryPhase(inquiry);
  const bookedDate = isoDateFromValue(inquiry.scheduledAt);
  const preferred = formatInquiryDate(inquiry.preferredDate);
  const subtitleDate =
    phase === "booked" && bookedDate
      ? formatBookedDate(bookedDate)
      : preferred !== "—"
        ? `Pref. ${preferred}`
        : null;

  return (
    <details
      id={`inquiry-${inquiry.id}`}
      className="group rounded-xl border border-stone-200/80 bg-white shadow-sm open:border-stone-300 open:shadow-md"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 rounded-xl px-4 py-4 transition hover:bg-stone-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span
          className="mt-1 shrink-0 text-stone-400 transition group-open:rotate-90"
          aria-hidden
        >
          ▶
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="font-serif text-lg text-stone-900">{inquiry.name}</h2>
            <time className="shrink-0 text-xs text-stone-500">
              {formatInquiryDateTime(inquiry.createdAt)}
            </time>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {sessionTypeLabel(inquiry)}
            {subtitleDate ? (
              <span className="text-stone-500"> · {subtitleDate}</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {contactMethodsLabel(inquiry.contactMethods)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${inquiryPhaseBadgeClass(phase)}`}
          >
            {inquiryPhaseLabel(phase)}
          </span>
          {spam.flagged ? (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
              Flagged
            </span>
          ) : null}
        </div>
      </summary>
      <InquiryDetails item={item} occupied={occupied} />
    </details>
  );
}

export default function InquiryList({
  items,
  occupied,
  openId,
}: {
  items: InquiryWithSpam[];
  occupied: OccupiedBooking[];
  openId?: string | null;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center text-stone-600">
        No inquiries in this view.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.inquiry.id}>
          <InquiryRow
            item={item}
            occupied={occupied}
            defaultOpen={openId === item.inquiry.id}
          />
        </li>
      ))}
    </ul>
  );
}
