import type { InquiryStatus } from "@prisma/client";

export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "scheduled",
  "converted_to_booking",
  "canceled",
  "archived",
] as const satisfies readonly InquiryStatus[];

export type InquiryStatusValue = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatusValue, string> = {
  new: "New",
  contacted: "Contacted",
  scheduled: "Scheduled",
  converted_to_booking: "Converted to booking",
  canceled: "Canceled",
  archived: "Archived",
};

export function isInquiryStatus(value: string): value is InquiryStatusValue {
  return (INQUIRY_STATUSES as readonly string[]).includes(value);
}

export type InquiryWorkflowUpdateInput = {
  status?: InquiryStatusValue;
  adminNotes?: string | null;
};

export function parseInquiryWorkflowUpdate(
  body: unknown
): { ok: true; data: InquiryWorkflowUpdateInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const data: InquiryWorkflowUpdateInput = {};
  const record = body as Record<string, unknown>;

  if ("status" in record) {
    if (typeof record.status !== "string" || !isInquiryStatus(record.status)) {
      return { ok: false, error: "Invalid status value" };
    }
    data.status = record.status;
  }

  if ("adminNotes" in record) {
    if (record.adminNotes === null) {
      data.adminNotes = null;
    } else if (typeof record.adminNotes === "string") {
      const trimmed = record.adminNotes.trim();
      data.adminNotes = trimmed.length > 0 ? trimmed : null;
    } else {
      return { ok: false, error: "adminNotes must be a string or null" };
    }
  }

  if (data.status === undefined && data.adminNotes === undefined) {
    return { ok: false, error: "No fields to update" };
  }

  return { ok: true, data };
}

export type InquiryWorkflowTimestamps = {
  contactedAt?: Date | null;
  archivedAt?: Date | null;
};

/** Derive timestamp side-effects when status changes. */
export function workflowTimestampsForStatusChange(
  nextStatus: InquiryStatusValue,
  current: { status: InquiryStatusValue; contactedAt: Date | null; archivedAt: Date | null }
): InquiryWorkflowTimestamps {
  const updates: InquiryWorkflowTimestamps = {};

  if (nextStatus === "contacted" && current.contactedAt === null) {
    updates.contactedAt = new Date();
  }

  if (nextStatus === "archived") {
    updates.archivedAt = new Date();
  } else if (current.status === "archived") {
    // Clear archivedAt when moving out of archived (simple clear behavior).
    updates.archivedAt = null;
  }

  return updates;
}
