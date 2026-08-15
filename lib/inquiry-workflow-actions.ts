"use server";

import { revalidatePath } from "next/cache";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  parseInquiryWorkflowUpdate,
  workflowTimestampsForStatusChange,
  type InquiryStatusValue,
} from "@/lib/booking-inquiry-admin";
import { ensureClientForInquiry } from "@/lib/client-from-inquiry";
import { prisma } from "@/lib/prisma";

export type InquiryWorkflowActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateInquiryWorkflow(
  inquiryId: string,
  body: unknown
): Promise<InquiryWorkflowActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!inquiryId?.trim()) {
    return { ok: false, error: "Invalid inquiry id" };
  }

  const parsed = parseInquiryWorkflowUpdate(body);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const existing = await prisma.bookingInquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      status: true,
      contactedAt: true,
      archivedAt: true,
    },
  });

  if (!existing) {
    return { ok: false, error: "Inquiry not found" };
  }

  const { status: nextStatus, adminNotes } = parsed.data;

  if (nextStatus === "converted_to_booking") {
    const ensured = await ensureClientForInquiry(inquiryId);
    if (!ensured.ok) {
      return { ok: false, error: ensured.error };
    }
    revalidatePath(`/admin/clients/${ensured.clientId}`);
  }

  const timestampUpdates =
    nextStatus !== undefined
      ? workflowTimestampsForStatusChange(nextStatus, {
          status: existing.status as InquiryStatusValue,
          contactedAt: existing.contactedAt,
          archivedAt: existing.archivedAt,
        })
      : {};

  await prisma.bookingInquiry.update({
    where: { id: inquiryId },
    data: {
      ...(nextStatus !== undefined ? { status: nextStatus } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...timestampUpdates,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/clients");

  return { ok: true };
}
