export const ADMIN_TIME_ZONE = "America/Denver";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DEFAULT_SLOT_START = "10:00";
export const DEFAULT_SLOT_END = "12:00";

export function parseDateValue(
  value: Date | string | null | undefined
): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function denverDateFromDateTime(
  value: Date | string | null | undefined
): string | null {
  const date = parseDateValue(value);
  if (!date) return null;
  return date.toLocaleDateString("en-CA", { timeZone: ADMIN_TIME_ZONE });
}

export function denverTimeFromDateTime(
  value: Date | string | null | undefined
): string | null {
  const date = parseDateValue(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ADMIN_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  let hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  if (hour === "24") hour = "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function localOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  const asLocal = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    hour,
    Number(get("minute")),
    Number(get("second"))
  );
  return asLocal - date.getTime();
}

export function denverDateTimeFromParts(
  dateIso: string,
  time: string
): Date | null {
  if (!ISO_DATE_RE.test(dateIso) || !TIME_RE.test(time)) return null;
  const [year, month, day] = dateIso.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const first = new Date(utcGuess.getTime() - localOffsetMs(utcGuess, ADMIN_TIME_ZONE));
  const secondOffset = localOffsetMs(first, ADMIN_TIME_ZONE);
  return new Date(utcGuess.getTime() - secondOffset);
}

export function parseBookingSlot(
  dateIso: string,
  startTime: string,
  endTime: string
): { ok: true; start: Date; end: Date } | { ok: false; error: string } {
  const start = denverDateTimeFromParts(dateIso, startTime);
  const end = denverDateTimeFromParts(dateIso, endTime);
  if (!start || !end) {
    return { ok: false, error: "Pick a valid time" };
  }
  if (end <= start) {
    return { ok: false, error: "End needs to be after start" };
  }
  return { ok: true, start, end };
}

export function isLegacyAllDay(
  start: Date,
  end: Date | null | undefined
): boolean {
  if (end) return false;
  return (
    start.getUTCHours() === 12 &&
    start.getUTCMinutes() === 0 &&
    start.getUTCSeconds() === 0 &&
    start.getUTCMilliseconds() === 0
  );
}

export function slotRange(
  startValue: Date | string,
  endValue: Date | string | null | undefined
): { start: Date; end: Date; allDay: boolean } | null {
  const start = parseDateValue(startValue);
  if (!start) return null;
  const end = parseDateValue(endValue ?? null);
  if (isLegacyAllDay(start, end)) {
    const date = start.toISOString().slice(0, 10);
    const dayStart = denverDateTimeFromParts(date, "00:00");
    const next = new Date(`${date}T12:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const dayEnd = denverDateTimeFromParts(next.toISOString().slice(0, 10), "00:00");
    if (!dayStart || !dayEnd) return null;
    return { start: dayStart, end: dayEnd, allDay: true };
  }
  if (end) return { start, end, allDay: false };
  return {
    start,
    end: new Date(start.getTime() + 2 * 60 * 60 * 1000),
    allDay: false,
  };
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function formatDenverTime(value: Date | string): string {
  const date = parseDateValue(value);
  if (!date) return "";
  return date.toLocaleTimeString("en-US", {
    timeZone: ADMIN_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBookedSlot(
  startValue: Date | string | null | undefined,
  endValue?: Date | string | null,
  dateStyle: "long" | "medium" = "medium"
): string {
  const start = parseDateValue(startValue);
  if (!start) return "—";
  const range = slotRange(start, endValue);
  const dateIso = range?.allDay
    ? start.toISOString().slice(0, 10)
    : denverDateFromDateTime(start);
  const dateLabel = dateIso
    ? new Date(`${dateIso}T12:00:00.000Z`).toLocaleDateString("en-US", {
        weekday: dateStyle === "long" ? "long" : undefined,
        month: dateStyle === "long" ? "long" : "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";
  if (!range || range.allDay) return dateLabel || "—";
  return `${dateLabel}, ${formatDenverTime(range.start)}–${formatDenverTime(range.end)}`;
}
