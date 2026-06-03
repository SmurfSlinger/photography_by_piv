import type { BookingInquiry } from "@prisma/client";
import nodemailer, { type Transporter } from "nodemailer";

import { contactMethodOptions, sessionTypes } from "@/lib/booking-options";
import {
  buildSpamWarningEmailBlock,
  type BookingSpamScoreResult,
} from "@/lib/booking-spam-filter";

/**
 * Server-only booking notification recipient.
 * Never use NEXT_PUBLIC_ or import this from client components.
 */
export function getBookingNotificationEmail(): string | null {
  const email = process.env.BOOKING_NOTIFICATION_EMAIL?.trim();
  if (!email) return null;
  return email;
}

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return null;
  }

  const portRaw = process.env.SMTP_PORT?.trim();
  const port = portRaw ? Number.parseInt(portRaw, 10) : 587;
  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  const secureExplicit = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureExplicit === "true"
      ? true
      : secureExplicit === "false"
        ? false
        : port === 465;

  const from = process.env.SMTP_FROM?.trim() || user;

  return { host, port, secure, user, pass, from };
}

export function isBookingNotificationEmailConfigured(): boolean {
  return Boolean(getBookingNotificationEmail() && getSmtpConfig());
}

function createTransporter(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    ...(config.port === 587 && !config.secure
      ? { requireTLS: true as const }
      : {}),
  });
}

const contactMethodLabels = Object.fromEntries(
  contactMethodOptions.map((o) => [o.value, o.label])
) as Record<string, string>;

const sessionTypeLabels = Object.fromEntries(
  sessionTypes.map((o) => [o.value, o.label])
) as Record<string, string>;

function formatDate(value: Date | null): string {
  if (!value) return "(not provided)";
  return value.toISOString().slice(0, 10);
}

function formatLine(label: string, value: string | null | undefined): string {
  const text = value?.trim();
  return `${label}: ${text && text.length > 0 ? text : "(not provided)"}`;
}

/** Defang dots in the host portion of a URL after the protocol has been rewritten. */
function defangUrlHostPart(withoutProtocol: string): string {
  let hostEnd = withoutProtocol.length;
  for (const ch of ["/", "?", "#"]) {
    const i = withoutProtocol.indexOf(ch);
    if (i !== -1) hostEnd = Math.min(hostEnd, i);
  }
  const host = withoutProtocol.slice(0, hostEnd).replace(/\./g, "[.]");
  return host + withoutProtocol.slice(hostEnd);
}

/**
 * Makes URLs and www hosts non-clickable for outbound notification safety.
 * Used only when rendering flagged inquiry emails (DB values stay unchanged).
 */
export function defangSuspiciousText(text: string): string {
  if (!text) return text;

  let out = text.replace(/https?:\/\/[^\s<>"']+/gi, (url) => {
    const isHttps = /^https:/i.test(url);
    const withoutProto = url.replace(/^https?:\/\//i, "");
    const prefix = isHttps ? "hxxps://" : "hxxp://";
    return prefix + defangUrlHostPart(withoutProto);
  });

  out = out.replace(/\bwww\.[^\s<>"']+/gi, (host) =>
    host.replace(/\./g, "[.]")
  );

  return out;
}

function displayField(
  value: string | null | undefined,
  flagged: boolean
): string | null | undefined {
  if (!flagged || value == null) return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  return defangSuspiciousText(trimmed);
}

function withDefangSafetyNote(warningBlock: string): string {
  const note = "Suspicious links have been made non-clickable for safety.";
  const marker = "\n\n---\n";
  const idx = warningBlock.lastIndexOf(marker);
  if (idx === -1) {
    return `${warningBlock}\n${note}\n`;
  }
  return `${warningBlock.slice(0, idx)}\n${note}${warningBlock.slice(idx)}`;
}

export function buildBookingInquiryEmailContent(
  inquiry: BookingInquiry,
  spam?: BookingSpamScoreResult
): { subject: string; text: string } {
  const contactMethods = inquiry.contactMethods
    .map((m) => contactMethodLabels[m] ?? m)
    .join(", ");

  const flagged = Boolean(spam?.flagged);

  const sessionLabel =
    inquiry.sessionType === "other" && inquiry.sessionTypeOther
      ? `Other — ${displayField(inquiry.sessionTypeOther, flagged) ?? inquiry.sessionTypeOther}`
      : (sessionTypeLabels[inquiry.sessionType] ?? inquiry.sessionType);

  let warningBlock = spam ? buildSpamWarningEmailBlock(spam) : "";
  if (flagged && warningBlock) {
    warningBlock = withDefangSafetyNote(warningBlock);
  }

  const messageBody = flagged
    ? displayField(inquiry.message, true) ?? inquiry.message.trim()
    : inquiry.message.trim();

  const lines = [
    ...(warningBlock ? [warningBlock] : []),
    "A new booking inquiry was submitted on Photography by Piv.",
    "",
    formatLine("Inquiry ID", inquiry.id),
    formatLine("Submitted at", inquiry.createdAt.toISOString()),
    "",
    formatLine("Name", displayField(inquiry.name, flagged)),
    formatLine("Contact methods", contactMethods),
    formatLine("Email", displayField(inquiry.email, flagged)),
    formatLine("Phone", displayField(inquiry.phone, flagged)),
    formatLine("Instagram", displayField(inquiry.instagramHandle, flagged)),
    formatLine("Other contact", displayField(inquiry.contactOther, flagged)),
    "",
    formatLine("Session type", sessionLabel),
    formatLine("Package interest", inquiry.packageInterest),
    formatLine("Preferred date", formatDate(inquiry.preferredDate)),
    formatLine("Backup date", formatDate(inquiry.backupDate)),
    formatLine("Location idea", displayField(inquiry.locationIdea, flagged)),
    "",
    "Vibe / style:",
    displayField(inquiry.vibeStyle, flagged)?.trim() ||
      inquiry.vibeStyle?.trim() ||
      "(not provided)",
    "",
    "Message:",
    messageBody,
  ];

  const displayName = displayField(inquiry.name, flagged) ?? inquiry.name;
  const subject = flagged
    ? `⚠️ Possible spam — New booking inquiry — ${displayName}`
    : `New booking inquiry — ${inquiry.name}`;

  return { subject, text: lines.join("\n") };
}

/**
 * Sends notification to BOOKING_NOTIFICATION_EMAIL. Throws on failure.
 * No-op if recipient or SMTP is not configured.
 */
export async function sendBookingInquiryNotificationEmail(
  inquiry: BookingInquiry,
  spam?: BookingSpamScoreResult
): Promise<void> {
  const to = getBookingNotificationEmail();
  const smtp = getSmtpConfig();

  if (!to || !smtp) {
    return;
  }

  const { subject, text } = buildBookingInquiryEmailContent(inquiry, spam);
  const transporter = createTransporter(smtp);

  await transporter.sendMail({
    from: smtp.from,
    to,
    replyTo: inquiry.email ?? undefined,
    subject,
    text,
  });
}
