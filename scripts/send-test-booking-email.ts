/**
 * Dry-run or send a sample booking notification email.
 *
 * Dry-run (default): checks BOOKING_NOTIFICATION_EMAIL + SMTP env, prints status.
 * Flagged preview: npx tsx --env-file=.env scripts/send-test-booking-email.ts --flagged
 * Send:            npx tsx --env-file=.env scripts/send-test-booking-email.ts --send
 * Send flagged:    npx tsx --env-file=.env scripts/send-test-booking-email.ts --send --flagged
 */
import type { BookingInquiry } from "@prisma/client";
import { SessionType } from "@prisma/client";

import { spamAssessmentForInquiry } from "../lib/booking-inquiry-display";
import { scoreBookingInquiryForNotification } from "../lib/booking-spam-filter";
import type { BookingInquiryInput } from "../lib/booking-inquiry-validation";
import {
  buildBookingInquiryEmailContent,
  getBookingNotificationEmail,
  isBookingNotificationEmailConfigured,
  sendBookingInquiryNotificationEmail,
} from "../lib/booking-notification";

const shouldSend = process.argv.includes("--send");
const showFlagged = process.argv.includes("--flagged");

const FLAGGED_TEST_MESSAGE =
  "Example crypto investment pitch for SEO backlinks. " +
  "See https://example-spam.test and https://fake-offer.test for details.";

function buildSampleInquiry(flagged: boolean): BookingInquiry {
  const input = toSpamInputFromFixture(flagged);
  const spam = scoreBookingInquiryForNotification(input);

  return {
    id: "00000000-0000-4000-8000-000000000001",
    createdAt: new Date(),
    name: "Test Client",
    contactMethods: ["email", "text"],
    email: "client@example.com",
    phone: "+1 555 0100",
    instagramHandle: "@exampleclient",
    contactOther: null,
    sessionType: SessionType.wedding,
    sessionTypeOther: null,
    packageInterest: "Weddings - Timeless Wedding Package",
    preferredDate: new Date("2026-09-15T12:00:00.000Z"),
    backupDate: new Date("2026-09-22T12:00:00.000Z"),
    locationIdea: "Tremonton area park",
    vibeStyle: "Golden hour, candid moments",
    message: flagged
      ? FLAGGED_TEST_MESSAGE
      : "This is a test booking inquiry notification.",
    status: "new",
    adminNotes: null,
    contactedAt: null,
    archivedAt: null,
    scheduledAt: null,
    externalCalendarId: null,
    spamScore: spam.score,
    spamReasons: spam.reasons,
    spamFlagged: spam.flagged,
  };
}

function toSpamInputFromFixture(flagged: boolean): BookingInquiryInput {
  return {
    name: "Test Client",
    contactMethods: ["email", "text"],
    email: "client@example.com",
    phone: "+1 555 0100",
    instagramHandle: "@exampleclient",
    contactOther: null,
    sessionType: SessionType.wedding,
    sessionTypeOther: null,
    packageInterest: "Weddings - Timeless Wedding Package",
    preferredDate: new Date("2026-09-15T12:00:00.000Z"),
    backupDate: new Date("2026-09-22T12:00:00.000Z"),
    locationIdea: "Tremonton area park",
    vibeStyle: "Golden hour, candid moments",
    message: flagged
      ? FLAGGED_TEST_MESSAGE
      : "This is a test booking inquiry notification.",
  };
}

async function main() {
  const recipient = getBookingNotificationEmail();
  const configured = isBookingNotificationEmailConfigured();

  console.log("Recipient configured:", Boolean(recipient));
  console.log("SMTP + recipient ready:", configured);

  if (!configured) {
    console.error(
      "Set BOOKING_NOTIFICATION_EMAIL, SMTP_HOST, SMTP_USER, and SMTP_PASS in .env"
    );
    process.exit(1);
  }

  const inquiry = buildSampleInquiry(showFlagged);
  const spam = spamAssessmentForInquiry(inquiry);
  const preview = buildBookingInquiryEmailContent(inquiry, spam);

  console.log("\nFlagged:", spam.flagged, "| Score:", spam.score);
  if (spam.reasons.length > 0) {
    console.log("Reasons:", spam.reasons.join("; "));
  }
  console.log("Subject:", preview.subject);
  console.log("\n--- Message preview ---\n");
  console.log(preview.text);
  console.log("\n--- End preview ---\n");

  if (showFlagged) {
    console.log(
      "Flagged preview/send uses defanged links in the email body (scoring still uses raw inquiry text)."
    );
  }

  if (!shouldSend) {
    console.log(
      "Dry run only. To send a real test email, run again with --send"
    );
    return;
  }

  await sendBookingInquiryNotificationEmail(inquiry, spam);
  console.log(
    spam.flagged
      ? "Test notification email sent (flagged sample)."
      : "Test notification email sent."
  );
}

main().catch((error) => {
  console.error("send-test-booking-email failed", error);
  process.exit(1);
});
