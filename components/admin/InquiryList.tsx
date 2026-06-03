import type { InquiryWithSpam } from "@/lib/booking-inquiry-display";
import {
  contactMethodsLabel,
  formatInquiryDate,
  formatInquiryDateTime,
  sessionTypeLabel,
} from "@/lib/booking-inquiry-display";

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

function InquiryCard({ inquiry, spam }: InquiryWithSpam) {
  return (
    <article className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
      <header className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-stone-900">{inquiry.name}</h2>
          <p className="mt-1 font-mono text-xs text-stone-500">
            {formatInquiryDateTime(inquiry.createdAt)}
          </p>
          <p className="mt-1 break-all font-mono text-xs text-stone-400">
            ID {inquiry.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {inquiry.status}
          </span>
          {spam.flagged ? (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
              Possible spam · score {spam.score}
            </span>
          ) : (
            <span className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600">
              Score {spam.score}
            </span>
          )}
        </div>
      </header>

      {spam.flagged && spam.reasons.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Spam / scam signals (recomputed from saved inquiry)
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-950">
            {spam.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-800/90">
            IP-based rules are not shown here because the client IP is not stored.
          </p>
        </div>
      ) : null}

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contact methods" value={contactMethodsLabel(inquiry.contactMethods)} />
        <Field label="Email" value={inquiry.email} />
        <Field label="Phone" value={inquiry.phone} />
        <Field label="Instagram" value={inquiry.instagramHandle} />
        <Field label="Other contact" value={inquiry.contactOther} />
        <Field label="Session type" value={sessionTypeLabel(inquiry)} />
        <Field label="Package interest" value={inquiry.packageInterest} />
        <Field label="Preferred date" value={formatInquiryDate(inquiry.preferredDate)} />
        <Field label="Backup date" value={formatInquiryDate(inquiry.backupDate)} />
        <Field label="Location idea" value={inquiry.locationIdea} />
        <Field label="Vibe / style" value={inquiry.vibeStyle} />
      </dl>

      <div className="mt-4">
        <Field label="Message" value={inquiry.message} />
      </div>
    </article>
  );
}

export default function InquiryList({ items }: { items: InquiryWithSpam[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center text-stone-600">
        No booking inquiries yet.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {items.map((item) => (
        <li key={item.inquiry.id}>
          <InquiryCard inquiry={item.inquiry} spam={item.spam} />
        </li>
      ))}
    </ul>
  );
}
