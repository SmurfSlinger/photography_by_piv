export const INQUIRY_PHASES = [
  "new",
  "contacted",
  "booked",
  "canceled",
] as const;

export type InquiryPhase = (typeof INQUIRY_PHASES)[number];

export const INQUIRY_PHASE_LABELS: Record<InquiryPhase, string> = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  canceled: "Canceled",
};

export const BOOKED_INQUIRY_STATUSES = [
  "scheduled",
  "converted_to_booking",
] as const;

export const CANCELED_INQUIRY_STATUSES = ["canceled", "archived"] as const;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PHASE_BADGE_CLASSES: Record<InquiryPhase, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-900",
  contacted: "border-emerald-200 bg-emerald-50 text-emerald-900",
  booked: "border-violet-200 bg-violet-50 text-violet-900",
  canceled: "border-stone-200 bg-stone-100 text-stone-600",
};

export type OccupiedBooking = {
  date: string;
  inquiryId: string;
  name: string;
};

export type InquiryPhaseFields = {
  status: string;
  scheduledAt?: Date | string | null;
  contactedAt?: Date | string | null;
};

export function isInquiryPhase(value: string): value is InquiryPhase {
  return (INQUIRY_PHASES as readonly string[]).includes(value);
}

/** Map UI filters and legacy enum query params to a phase. */
export function parseInquiryPhaseFilter(
  value: string | undefined
): InquiryPhase | null {
  if (!value) return null;
  if (isInquiryPhase(value)) return value;
  if (value === "scheduled" || value === "converted_to_booking") return "booked";
  if (value === "archived") return "canceled";
  return null;
}

export function inquiryPhase(inquiry: InquiryPhaseFields): InquiryPhase {
  if (inquiry.status === "canceled" || inquiry.status === "archived") {
    return "canceled";
  }
  if (
    inquiry.status === "scheduled" ||
    inquiry.status === "converted_to_booking" ||
    inquiry.scheduledAt
  ) {
    return "booked";
  }
  if (inquiry.status === "contacted" || inquiry.contactedAt) {
    return "contacted";
  }
  return "new";
}

export function inquiryPhaseLabel(phase: InquiryPhase): string {
  return INQUIRY_PHASE_LABELS[phase];
}

export function inquiryPhaseBadgeClass(phase: InquiryPhase): string {
  return PHASE_BADGE_CLASSES[phase];
}

export function utcNoonFromIso(iso: string): Date | null {
  if (!ISO_DATE_RE.test(iso)) return null;
  const parsed = new Date(`${iso}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== iso) return null;
  return parsed;
}

export function isoDateFromValue(
  value: Date | string | null | undefined
): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const iso = value.slice(0, 10);
    return ISO_DATE_RE.test(iso) ? iso : null;
  }
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 10);
}

export function todayIsoInDenver(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });
}

export function formatBookedDate(
  value: Date | string | null | undefined,
  style: "long" | "medium" = "medium"
): string {
  const iso = isoDateFromValue(value);
  if (!iso) return "—";
  const date = utcNoonFromIso(iso);
  if (!date) return iso;
  return date.toLocaleDateString("en-US", {
    weekday: style === "long" ? "long" : undefined,
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthTitle(year: number, monthIndex0: number): string {
  return new Date(Date.UTC(year, monthIndex0, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type CalendarCell = {
  iso: string;
  day: number;
  inMonth: boolean;
};

export function monthGrid(year: number, monthIndex0: number): CalendarCell[] {
  const firstWeekday = new Date(Date.UTC(year, monthIndex0, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const cells: CalendarCell[] = [];

  for (let i = 0; i < cellCount; i++) {
    const date = new Date(Date.UTC(year, monthIndex0, 1 - firstWeekday + i));
    cells.push({
      iso: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthIndex0,
    });
  }

  return cells;
}

export function splitIsoDate(
  iso: string
): { year: number; monthIndex0: number } | null {
  const date = utcNoonFromIso(iso);
  if (!date) return null;
  return {
    year: date.getUTCFullYear(),
    monthIndex0: date.getUTCMonth(),
  };
}
