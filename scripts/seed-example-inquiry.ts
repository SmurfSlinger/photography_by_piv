import { readFile } from "node:fs/promises";
import path from "node:path";

import { SessionType } from "@prisma/client";

import { scoreBookingInquiryForNotification } from "../lib/booking-spam-filter";
import { prisma } from "../lib/prisma";

type InquirySeed = {
  name: string;
  contactMethods: string[];
  email?: string | null;
  phone?: string | null;
  instagramHandle?: string | null;
  contactOther?: string | null;
  sessionType: SessionType;
  sessionTypeOther?: string | null;
  packageInterest: string;
  preferredDate?: string | null;
  backupDate?: string | null;
  locationIdea?: string | null;
  vibeStyle?: string | null;
  message: string;
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  return new Date(`${value}T12:00:00.000Z`);
}

async function main() {
  const manifestPath = process.argv[2] ?? "scripts/seed/example-inquiry.json";
  const absolutePath = path.resolve(manifestPath);
  const raw = await readFile(absolutePath, "utf8");
  const seed = JSON.parse(raw) as InquirySeed;

  if (!seed.name || !seed.sessionType || !seed.packageInterest || !seed.message) {
    throw new Error("Seed requires name, sessionType, packageInterest, and message");
  }

  const email = seed.email?.trim() || null;

  if (email) {
    const existing = await prisma.bookingInquiry.findFirst({
      where: { email },
      select: { id: true, name: true },
    });
    if (existing) {
      console.log(`Example inquiry already exists: ${existing.name} (${existing.id})`);
      return;
    }
  }

  const preferredDate = parseDate(seed.preferredDate);
  const backupDate = parseDate(seed.backupDate);
  const spam = scoreBookingInquiryForNotification({
    name: seed.name,
    contactMethods: seed.contactMethods,
    email,
    phone: seed.phone ?? null,
    instagramHandle: seed.instagramHandle ?? null,
    contactOther: seed.contactOther ?? null,
    sessionType: seed.sessionType,
    sessionTypeOther: seed.sessionTypeOther ?? null,
    packageInterest: seed.packageInterest,
    preferredDate,
    backupDate,
    locationIdea: seed.locationIdea ?? null,
    vibeStyle: seed.vibeStyle ?? null,
    message: seed.message,
  });

  const inquiry = await prisma.bookingInquiry.create({
    data: {
      name: seed.name,
      contactMethods: seed.contactMethods,
      email,
      phone: seed.phone ?? null,
      instagramHandle: seed.instagramHandle ?? null,
      contactOther: seed.contactOther ?? null,
      sessionType: seed.sessionType,
      sessionTypeOther: seed.sessionTypeOther ?? null,
      packageInterest: seed.packageInterest,
      preferredDate,
      backupDate,
      locationIdea: seed.locationIdea ?? null,
      vibeStyle: seed.vibeStyle ?? null,
      message: seed.message,
      spamScore: spam.score,
      spamReasons: spam.reasons,
      spamFlagged: spam.flagged,
    },
  });

  console.log(`Created example inquiry "${inquiry.name}" (${inquiry.id})`);
  console.log(`Status: ${inquiry.status}${spam.flagged ? " · flagged" : ""}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
