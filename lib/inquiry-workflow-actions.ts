"use server";

import { revalidatePath } from "next/cache";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ensureClientForInquiry } from "@/lib/client-from-inquiry";
import { findBookingOnDate } from "@/lib/inquiry-bookings";
import { inquiryPhase, utcNoonFromIso } from "@/lib/inquiry-phase";
import { prisma } from "@/lib/prisma";

export type InquiryWorkflowActionResult =
  | { ok: true }
  | { ok: false; error: string };

function revalidateInquiryPaths(clientId?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/clients");
  if (clientId) {
    revalidatePath(`/admin/clients/${clientId}`);
  }
}

async function requireInquiry(inquiryId: string) {
  if (!inquiryId?.trim()) {
    return { ok: false as const, error: "Invalid inquiry id" };
  }

  const inquiry = await prisma.bookingInquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      status: true,
      contactedAt: true,
      archivedAt: true,
      scheduledAt: true,
      clientId: true,
      adminNotes: true,
    },
  });

  if (!inquiry) {
    return { ok: false as const, error: "Inquiry not found" };
  }

  return { ok: true as const, inquiry };
}

export async function setInquiryContacted(
  inquiryId: string,
  contacted: boolean
): Promise<InquiryWorkflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const loaded = await requireInquiry(inquiryId);
  if (!loaded.ok) return loaded;

  const phase = inquiryPhase(loaded.inquiry);
  if (phase === "booked" || phase === "canceled") {
    return {
      ok: false,
      error:
        phase === "booked"
          ? "Contacted stays checked after a day is booked."
          : "Reopen this inquiry before changing contacted.",
    };
  }

  await prisma.bookingInquiry.update({
    where: { id: inquiryId },
    data: contacted
      ? {
          status: "contacted",
          contactedAt: loaded.inquiry.contactedAt ?? new Date(),
        }
      : {
          status: "new",
          contactedAt: null,
        },
  });

  revalidateInquiryPaths(loaded.inquiry.clientId);
  return { ok: true };
}

export async function bookInquiryOnDate(
  inquiryId: string,
  dateIso: string
): Promise<InquiryWorkflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const scheduledAt = utcNoonFromIso(dateIso);
  if (!scheduledAt) {
    return { ok: false, error: "Pick a valid day" };
  }

  const loaded = await requireInquiry(inquiryId);
  if (!loaded.ok) return loaded;

  if (inquiryPhase(loaded.inquiry) === "canceled") {
    return { ok: false, error: "Reopen this inquiry before booking a day." };
  }

  const taken = await findBookingOnDate(dateIso, inquiryId);
  if (taken) {
    return {
      ok: false,
      error: `Already booked for ${taken.name} on that day.`,
    };
  }

  const ensured = await ensureClientForInquiry(inquiryId);
  if (!ensured.ok) {
    return { ok: false, error: ensured.error };
  }

  await prisma.bookingInquiry.update({
    where: { id: inquiryId },
    data: {
      status: "scheduled",
      scheduledAt,
      contactedAt: loaded.inquiry.contactedAt ?? new Date(),
      archivedAt: null,
    },
  });

  revalidateInquiryPaths(ensured.clientId);
  return { ok: true };
}

export async function cancelInquiryBooking(
  inquiryId: string
): Promise<InquiryWorkflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const loaded = await requireInquiry(inquiryId);
  if (!loaded.ok) return loaded;

  if (inquiryPhase(loaded.inquiry) === "canceled") {
    return { ok: false, error: "This inquiry is already canceled." };
  }

  await prisma.bookingInquiry.update({
    where: { id: inquiryId },
    data: {
      status: "canceled",
      scheduledAt: null,
      archivedAt: new Date(),
    },
  });

  revalidateInquiryPaths(loaded.inquiry.clientId);
  return { ok: true };
}

export async function reopenInquiry(
  inquiryId: string
): Promise<InquiryWorkflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const loaded = await requireInquiry(inquiryId);
  if (!loaded.ok) return loaded;

  if (inquiryPhase(loaded.inquiry) !== "canceled") {
    return { ok: false, error: "Only a canceled inquiry can be reopened." };
  }

  await prisma.bookingInquiry.update({
    where: { id: inquiryId },
    data: {
      status: loaded.inquiry.contactedAt ? "contacted" : "new",
      scheduledAt: null,
      archivedAt: null,
    },
  });

  revalidateInquiryPaths(loaded.inquiry.clientId);
  return { ok: true };
}

export async function saveInquiryNotes(
  inquiryId: string,
  adminNotes: string
): Promise<InquiryWorkflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  const loaded = await requireInquiry(inquiryId);
  if (!loaded.ok) return loaded;

  const trimmed = adminNotes.trim();
  await prisma.bookingInquiry.update({
    where: { id: inquiryId },
    data: { adminNotes: trimmed.length > 0 ? trimmed : null },
  });

  revalidateInquiryPaths(loaded.inquiry.clientId);
  return { ok: true };
}
