import { NextResponse } from "next/server";

import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";

const MIN_FORM_FILL_MS = 3_000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const ANTI_BOT_KEYS = [
  "turnstileToken",
  "formStartedAt",
  "website",
] as const;

type RateBucket = {
  count: number;
  windowStart: number;
};

const rateLimitStore = new Map<string, RateBucket>();

export function isBookingBotChecksDisabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.BOOKING_BOT_CHECKS_DISABLED === "true"
  );
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp && realIp.length > 0 ? realIp : "unknown";
}

export function stripBookingAntiBotFields(
  body: Record<string, unknown>
): Record<string, unknown> {
  const cleaned = { ...body };
  for (const key of ANTI_BOT_KEYS) {
    delete cleaned[key];
  }
  return cleaned;
}

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isHoneypotTriggered(body: Record<string, unknown>): boolean {
  return trimString(body.website).length > 0;
}

function isFormFilledTooFast(body: Record<string, unknown>): boolean {
  const started = body.formStartedAt;
  if (typeof started !== "number" || !Number.isFinite(started)) {
    return true;
  }
  return Date.now() - started < MIN_FORM_FILL_MS;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitStore.get(ip);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return false;
  }

  bucket.count += 1;
  return true;
}

function pruneRateLimitStore(): void {
  const now = Date.now();
  for (const [ip, bucket] of rateLimitStore.entries()) {
    if (now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}

export type BookingBotGuardResult =
  | { status: "honeypot" }
  | { status: "blocked"; response: NextResponse }
  | { status: "ok"; body: Record<string, unknown> };

export async function runBookingBotGuard(
  request: Request,
  body: Record<string, unknown>
): Promise<BookingBotGuardResult> {
  if (isHoneypotTriggered(body)) {
    return { status: "honeypot" };
  }

  if (isBookingBotChecksDisabled()) {
    return { status: "ok", body: stripBookingAntiBotFields(body) };
  }

  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && !isTurnstileConfigured()) {
    console.error("TURNSTILE_SECRET_KEY missing in production");
    return {
      status: "blocked",
      response: NextResponse.json(
        {
          error:
            "Booking is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      ),
    };
  }

  if (Math.random() < 0.01) {
    pruneRateLimitStore();
  }

  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return {
      status: "blocked",
      response: NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: { "Retry-After": "3600" },
        }
      ),
    };
  }

  if (isFormFilledTooFast(body)) {
    return {
      status: "blocked",
      response: NextResponse.json(
        {
          error: "Unable to submit right now. Please try again.",
        },
        { status: 400 }
      ),
    };
  }

  if (!isTurnstileConfigured()) {
    console.error("TURNSTILE_SECRET_KEY missing");
    return {
      status: "blocked",
      response: NextResponse.json(
        {
          error:
            "Booking is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      ),
    };
  }

  const token = trimString(body.turnstileToken);
  if (!token) {
    return {
      status: "blocked",
      response: NextResponse.json(
        {
          error: "Verification failed. Please try again.",
          resetTurnstile: true,
        },
        { status: 403 }
      ),
    };
  }

  const verified = await verifyTurnstileToken(token, clientIp);
  if (!verified) {
    return {
      status: "blocked",
      response: NextResponse.json(
        {
          error: "Verification failed. Please try again.",
          resetTurnstile: true,
        },
        { status: 403 }
      ),
    };
  }

  return { status: "ok", body: stripBookingAntiBotFields(body) };
}
