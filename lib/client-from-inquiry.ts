import { parseClientInput } from "@/lib/client-admin";
import {
  workflowTimestampsForStatusChange,
  type InquiryStatusValue,
} from "@/lib/booking-inquiry-admin";
import { prisma } from "@/lib/prisma";

const OPEN_INQUIRY_STATUSES: readonly InquiryStatusValue[] = [
  "new",
  "contacted",
  "scheduled",
];

export async function ensureClientForInquiry(
  inquiryId: string,
  options?: { convertIfOpen?: boolean }
): Promise<{ ok: true; clientId: string } | { ok: false; error: string }> {
  const inquiry = await prisma.bookingInquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      clientId: true,
      contactedAt: true,
      archivedAt: true,
    },
  });

  if (!inquiry) {
    return { ok: false, error: "Inquiry not found" };
  }

  let clientId = inquiry.clientId;

  if (!clientId && inquiry.email) {
    const existing = await prisma.client.findFirst({
      where: { email: { equals: inquiry.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      clientId = existing.id;
    }
  }

  if (!clientId) {
    const parsed = parseClientInput({
      name: inquiry.name,
      email: inquiry.email,
    });
    if (!parsed.ok) {
      return parsed;
    }
    const created = await prisma.client.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
      },
      select: { id: true },
    });
    clientId = created.id;
  }

  const currentStatus = inquiry.status as InquiryStatusValue;
  const shouldConvert =
    Boolean(options?.convertIfOpen) &&
    OPEN_INQUIRY_STATUSES.includes(currentStatus);

  await prisma.bookingInquiry.update({
    where: { id: inquiry.id },
    data: {
      clientId,
      ...(shouldConvert ? { status: "converted_to_booking" } : {}),
      ...(shouldConvert
        ? workflowTimestampsForStatusChange("converted_to_booking", {
            status: currentStatus,
            contactedAt: inquiry.contactedAt,
            archivedAt: inquiry.archivedAt,
          })
        : {}),
    },
  });

  return { ok: true, clientId };
}
