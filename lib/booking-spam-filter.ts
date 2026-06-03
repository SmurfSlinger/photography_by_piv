import type { BookingInquiryInput } from "@/lib/booking-inquiry-validation";

/** Score at or above this adds a spam/scam warning to the notification email. */
export const BOOKING_SPAM_FLAG_THRESHOLD = 45;

const RECENT_SUCCESS_WINDOW_MS = 60 * 60 * 1000;
/** Prior successful saves from same IP in the window (this submission is additional). */
const RECENT_SUCCESS_PRIOR_MIN = 2;

const URL_PATTERN = /https?:\/\/|www\.\S/i;
const URL_GLOBAL = /https?:\/\/|www\.\S/gi;

const PHISHING_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "crypto", re: /\bcrypto\b/i },
  { label: "investment", re: /\binvestment\b/i },
  { label: "seo", re: /\bseo\b/i },
  { label: "backlink", re: /\bbacklinks?\b/i },
  { label: "ranking", re: /\branking\b/i },
  { label: "casino", re: /\bcasino\b/i },
  { label: "loan", re: /\bloan\b/i },
  { label: "whatsapp only", re: /\bwhatsapp\s+only\b/i },
  { label: "telegram", re: /\btelegram\b/i },
  { label: "password", re: /\bpassword\b/i },
  { label: "verify account", re: /\bverify\s+(your\s+)?account\b/i },
  { label: "urgent payment", re: /\burgent\s+payment\b/i },
];

const SUSPICIOUS_CONTACT_URL_FIELDS = [
  "email",
  "phone",
  "instagramHandle",
  "contactOther",
] as const;

type ScorableField = {
  label: string;
  value: string | null | undefined;
};

const recentSuccessByIp = new Map<string, number[]>();

export type BookingSpamScoreResult = {
  score: number;
  reasons: string[];
  flagged: boolean;
};

export function buildSpamWarningEmailBlock(
  assessment: BookingSpamScoreResult
): string {
  if (!assessment.flagged) {
    return "";
  }

  const reasonLines = assessment.reasons.map((r) => `- ${r}`).join("\n");

  return [
    "⚠️ Possible spam/scam inquiry",
    "",
    `Spam score: ${assessment.score}`,
    "Reasons:",
    reasonLines,
    "",
    "This inquiry was saved, but it matched spam/scam warning signals. Review carefully before clicking links or replying.",
    "",
    "---",
    "",
  ].join("\n");
}

function textFields(data: BookingInquiryInput): ScorableField[] {
  return [
    { label: "name", value: data.name },
    { label: "email", value: data.email },
    { label: "phone", value: data.phone },
    { label: "instagram", value: data.instagramHandle },
    { label: "contactOther", value: data.contactOther },
    { label: "sessionTypeOther", value: data.sessionTypeOther },
    { label: "location", value: data.locationIdea },
    { label: "vibe", value: data.vibeStyle },
    { label: "message", value: data.message },
  ];
}

function countUrls(text: string): number {
  return (text.match(URL_GLOBAL) ?? []).length;
}

/** Conservative: obvious junk names only, not short or unusual real names. */
function isGibberishName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 4) return false;

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) return true;

  const nonLetterRatio =
    (trimmed.length - letters.length) / trimmed.length;
  if (nonLetterRatio > 0.35) return true;

  const vowels = letters.replace(/[^aeiouyAEIOUY]/g, "").length;
  if (letters.length >= 8 && vowels === 0) return true;

  if (/(.)\1{4,}/.test(trimmed)) return true;

  return false;
}

function looksLikeInvalidInstagram(handle: string): boolean {
  const h = handle.trim();
  if (h.length === 0) return false;
  if (URL_PATTERN.test(h)) return true;
  if (/^@?\d+$/.test(h)) return true;
  return false;
}

function looksLikeInvalidPhone(phone: string): boolean {
  const p = phone.trim();
  if (p.length === 0) return false;
  if (URL_PATTERN.test(p)) return true;
  const digits = p.replace(/\D/g, "").length;
  if (digits > 0 && digits < 7) return true;
  return false;
}

function recentSuccessfulCount(ip: string): number {
  const now = Date.now();
  const list = recentSuccessByIp.get(ip) ?? [];
  return list.filter((t) => now - t < RECENT_SUCCESS_WINDOW_MS).length;
}

/** Call after a successful Postgres save (in-memory, per server process). */
export function recordBookingInquirySubmission(clientIp: string): void {
  const now = Date.now();
  const list = recentSuccessByIp.get(clientIp) ?? [];
  const pruned = list.filter((t) => now - t < RECENT_SUCCESS_WINDOW_MS);
  pruned.push(now);
  recentSuccessByIp.set(clientIp, pruned);
}

export function scoreBookingInquiryForNotification(
  data: BookingInquiryInput,
  context?: { clientIp?: string }
): BookingSpamScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const fields = textFields(data);
  const combinedText = fields
    .map((f) => f.value?.trim() ?? "")
    .filter(Boolean)
    .join("\n");

  const totalUrls = countUrls(combinedText);
  if (totalUrls >= 2) {
    score += 50;
    reasons.push(`multiple URLs in inquiry (${totalUrls})`);
  }

  for (const { label, re } of PHISHING_PATTERNS) {
    if (re.test(combinedText)) {
      score += 50;
      reasons.push(`phishing/spam term: ${label}`);
      break;
    }
  }

  for (const key of SUSPICIOUS_CONTACT_URL_FIELDS) {
    const value = data[key];
    if (value && URL_PATTERN.test(value)) {
      score += 45;
      reasons.push(`URL in ${key}`);
      break;
    }
  }

  if (isGibberishName(data.name)) {
    score += 40;
    reasons.push("name looks like gibberish");
  }

  const message = data.message.trim();
  if (message.length > 3000) {
    score += 40;
    reasons.push("message extremely long");
  }

  const clientIp = context?.clientIp?.trim();
  if (clientIp && clientIp !== "unknown") {
    const prior = recentSuccessfulCount(clientIp);
    if (prior >= RECENT_SUCCESS_PRIOR_MIN) {
      score += 35;
      reasons.push(
        `multiple recent inquiries from same IP (${prior} prior in last hour)`
      );
    }
  }

  if (data.contactMethods.includes("instagram") && data.instagramHandle) {
    if (looksLikeInvalidInstagram(data.instagramHandle)) {
      score += 30;
      reasons.push("instagram handle looks invalid or promotional");
    }
  }

  if (data.contactMethods.includes("text") && data.phone) {
    if (looksLikeInvalidPhone(data.phone)) {
      score += 30;
      reasons.push("phone looks invalid");
    }
  }

  const flagged = score >= BOOKING_SPAM_FLAG_THRESHOLD;

  return { score, reasons, flagged };
}
