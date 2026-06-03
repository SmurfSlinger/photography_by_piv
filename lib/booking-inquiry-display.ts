import type { BookingInquiry } from "@prisma/client";

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

