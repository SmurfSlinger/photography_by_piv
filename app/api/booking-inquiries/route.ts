import { NextResponse } from "next/server";

import { getClientIp, runBookingBotGuard } from "@/lib/booking-bot-guard";
import { validateBookingInquiryBody } from "@/lib/booking-inquiry-validation";
import { sendBookingInquiryNotificationEmail } from "@/lib/booking-notification";
import {
  recordBookingInquirySubmission,
  scoreBookingInquiryForNotification,
} from "@/lib/booking-spam-filter";
import { prisma } from "@/lib/prisma";

const MAX_BODY_BYTES = 32_000;

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawBody = body as Record<string, unknown>;
  const guard = await runBookingBotGuard(request, rawBody);

  if (guard.status === "honeypot") {
    return NextResponse.json({ ok: true });
  }

  if (guard.status === "blocked") {
    return guard.response;
  }

  const result = validateBookingInquiryBody(guard.body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, fields: result.errors },
      { status: 400 }
    );
  }

  const data = result.data;

  const clientIp = getClientIp(request);
  const spam = scoreBookingInquiryForNotification(data, { clientIp });

  try {
    const inquiry = await prisma.bookingInquiry.create({
      data: {
        name: data.name,
        contactMethods: data.contactMethods,
        email: data.email,
        phone: data.phone,
        instagramHandle: data.instagramHandle,
        contactOther: data.contactOther,
        sessionType: data.sessionType,
        sessionTypeOther: data.sessionTypeOther,
        packageInterest: data.packageInterest,
        preferredDate: data.preferredDate,
        backupDate: data.backupDate,
        locationIdea: data.locationIdea,
        vibeStyle: data.vibeStyle,
        message: data.message,
        spamScore: spam.score,
        spamReasons: spam.reasons,
        spamFlagged: spam.flagged,
      },
    });

    recordBookingInquirySubmission(clientIp);

    if (spam.flagged) {
      console.warn("booking inquiry notification flagged", {
        inquiryId: inquiry.id,
        spamScore: spam.score,
        reasons: spam.reasons,
      });
    }

    try {
      await sendBookingInquiryNotificationEmail(inquiry, spam);
    } catch (emailError) {
      console.error(
        "booking-inquiry notification email failed",
        { inquiryId: inquiry.id },
        emailError
      );
    }

    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (error) {
    console.error("booking-inquiry create failed", error);
    return NextResponse.json(
      { error: "Unable to save your inquiry. Please try again shortly." },
      { status: 500 }
    );
  }
}
