/**
 * Offline checks for booking notification spam filter (no email, no HTTP).
 * Run: npx tsx scripts/test-booking-spam-filter.ts
 */
import { SessionType } from "@prisma/client";

import { defangSuspiciousText } from "../lib/booking-notification";
import { scoreBookingInquiryForNotification } from "../lib/booking-spam-filter";
import type { BookingInquiryInput } from "../lib/booking-inquiry-validation";

function baseInquiry(
  overrides: Partial<BookingInquiryInput> = {}
): BookingInquiryInput {
  return {
    name: "Jordan Lee",
    contactMethods: ["email"],
    email: "jordan@example.com",
    phone: null,
    instagramHandle: null,
    contactOther: null,
    sessionType: SessionType.couples,
    sessionTypeOther: null,
    packageInterest: "Sessions - Couples Session - 1 Hour",
    preferredDate: null,
    backupDate: null,
    locationIdea: "Bear Lake",
    vibeStyle: "Golden hour",
    message: "",
    ...overrides,
  };
}

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error("FAIL:", label);
    process.exit(1);
  }
  console.log("OK:", label);
}

const normalBlank = scoreBookingInquiryForNotification(
  baseInquiry({ message: "" })
);
assert(
  !normalBlank.flagged && normalBlank.score === 0,
  "normal inquiry with blank message -> not flagged"
);

const spamLinks = scoreBookingInquiryForNotification(
  baseInquiry({
    message:
      "Visit https://spam1.example and https://spam2.example for deals",
  })
);
assert(
  spamLinks.flagged && spamLinks.score >= 45,
  "inquiry with multiple spam links -> flagged"
);

const seoSpam = scoreBookingInquiryForNotification(
  baseInquiry({
    message: "We offer SEO backlink packages to boost your ranking.",
  })
);
assert(
  seoSpam.flagged && seoSpam.reasons.some((r) => r.includes("phishing")),
  "inquiry mentioning SEO/backlinks -> flagged"
);

assert(
  defangSuspiciousText("See https://example.com/path") ===
    "See hxxps://example[.]com/path",
  "defang https URL host dots"
);
assert(
  defangSuspiciousText("http://example.com") === "hxxp://example[.]com",
  "defang http URL"
);
assert(
  defangSuspiciousText("Visit www.example.com today") ===
    "Visit www[.]example[.]com today",
  "defang www host"
);

console.log("\nAll booking-spam-filter checks passed.");
