import type { BookingInquiry } from "@prisma/client";

import {
  INQUIRY_STATUS_LABELS,
  type InquiryStatusValue,
} from "@/lib/booking-inquiry-admin";
import type { BookingInquiryInput } from "@/lib/booking-inquiry-validation";
import { contactMethodOptions, sessionTypes } from "@/lib/booking-options";
import {
  scoreBookingInquiryForNotification,
  type BookingSpamScoreResult,
} from "@/lib/booking-spam-filter";

const contactMethodLabels = Object.fromEntries(
  contactMethodOptions.map((o) => [o.value, o.label])
) as Record<string, string>;

const sessionTypeLabels = Object.fromEntries(
  sessionTypes.map((o) => [o.value, o.label])
) as Record<string, string>;

export function bookingInquiryToInput(
  inquiry: BookingInquiry
): BookingInquiryInput {
  return {
    name: inquiry.name,
    contactMethods: inquiry.contactMethods,
    email: inquiry.email,
    phone: inquiry.phone,
    instagramHandle: inquiry.instagramHandle,
    contactOther: inquiry.contactOther,
    sessionType: inquiry.sessionType,
    sessionTypeOther: inquiry.sessionTypeOther,
    packageInterest: inquiry.packageInterest,
    preferredDate: inquiry.preferredDate,
    backupDate: inquiry.backupDate,
    locationIdea: inquiry.locationIdea,
    vibeStyle: inquiry.vibeStyle,
    message: inquiry.message,
  };
}

export function formatInquiryDate(value: Date | null): string {
  if (!value) return "—";
  return value.toISOString().slice(0, 10);
}

export function formatInquiryDateTime(value: Date): string {
  return value.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Denver",
  });
}

export function contactMethodsLabel(methods: string[]): string {
  return methods
    .map((m) => contactMethodLabels[m] ?? m)
    .join(", ");
}

export function sessionTypeLabel(inquiry: BookingInquiry): string {
  if (inquiry.sessionType === "other" && inquiry.sessionTypeOther) {
    return `Other — ${inquiry.sessionTypeOther}`;
  }
  return sessionTypeLabels[inquiry.sessionType] ?? inquiry.sessionType;
}

export function inquiryStatusLabel(status: InquiryStatusValue | string): string {
  return INQUIRY_STATUS_LABELS[status as InquiryStatusValue] ?? status;
}

const STATUS_BADGE_CLASSES: Record<InquiryStatusValue, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-900",
  contacted: "border-emerald-200 bg-emerald-50 text-emerald-900",
  scheduled: "border-violet-200 bg-violet-50 text-violet-900",
  converted_to_booking: "border-[#5c6b4a]/30 bg-[#5c6b4a]/10 text-[#3d4a32]",
  canceled: "border-stone-200 bg-stone-100 text-stone-600",
  archived: "border-stone-200 bg-stone-50 text-stone-500",
};

export function inquiryStatusBadgeClass(status: InquiryStatusValue | string): string {
  return (
    STATUS_BADGE_CLASSES[status as InquiryStatusValue] ??
    "border-stone-200 bg-stone-100 text-stone-600"
  );
}

/** Uses persisted assessment when present; otherwise recomputes (legacy rows). */
export function spamAssessmentForInquiry(
  inquiry: BookingInquiry
): BookingSpamScoreResult {
  if (inquiry.spamScore !== null) {
    return {
      score: inquiry.spamScore,
      reasons: inquiry.spamReasons,
      flagged: inquiry.spamFlagged,
    };
  }
  return scoreBookingInquiryForNotification(bookingInquiryToInput(inquiry));
}

export function spamAssessmentSource(
  inquiry: BookingInquiry
): "stored" | "recomputed" {
  return inquiry.spamScore !== null ? "stored" : "recomputed";
}

export type InquiryWithSpam = {
  inquiry: BookingInquiry;
  spam: BookingSpamScoreResult;
  spamSource: "stored" | "recomputed";
};

export function inquiriesWithSpam(
  inquiries: BookingInquiry[]
): InquiryWithSpam[] {
  return inquiries.map((inquiry) => ({
    inquiry,
    spam: spamAssessmentForInquiry(inquiry),
    spamSource: spamAssessmentSource(inquiry),
  }));
}

