import { SessionType } from "@prisma/client";

import {
  contactMethodValues,
  isPackageAllowedForSessionType,
  type SessionTypeValue,
} from "@/lib/booking-options";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const contactMethodSet = new Set<string>(contactMethodValues);
const sessionTypeSet = new Set<string>(Object.values(SessionType));

export type BookingInquiryInput = {
  name: string;
  contactMethods: string[];
  email: string | null;
  phone: string | null;
  instagramHandle: string | null;
  contactOther: string | null;
  sessionType: SessionType;
  sessionTypeOther: string | null;
  packageInterest: string;
  preferredDate: Date | null;
  backupDate: Date | null;
  locationIdea: string | null;
  vibeStyle: string | null;
  message: string;
};

export type FieldErrors = Partial<Record<string, string>>;

export type ValidationResult =
  | { ok: true; data: BookingInquiryInput }
  | { ok: false; errors: FieldErrors; message: string };

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalTrim(value: unknown): string | null {
  const trimmed = trimString(value);
  return trimmed.length > 0 ? trimmed : null;
}

function parseContactMethods(value: unknown, errors: FieldErrors): string[] {
  if (!Array.isArray(value)) {
    errors.contactMethods = "Select at least one way to reach you.";
    return [];
  }

  const methods = [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => contactMethodSet.has(item))
    ),
  ];

  if (methods.length === 0) {
    errors.contactMethods = "Select at least one way to reach you.";
  }

  return methods;
}

function parseDateField(
  value: unknown,
  field: string,
  errors: FieldErrors
): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const str = trimString(value);
  if (!DATE_RE.test(str)) {
    errors[field] = "Enter a valid date (YYYY-MM-DD).";
    return null;
  }
  const parsed = new Date(`${str}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    errors[field] = "Enter a valid date.";
    return null;
  }
  return parsed;
}

export function validateBookingInquiryBody(
  body: unknown
): ValidationResult {
  const errors: FieldErrors = {};

  if (!body || typeof body !== "object") {
    return { ok: false, errors, message: "Invalid request body." };
  }

  const raw = body as Record<string, unknown>;

  const name = trimString(raw.name);
  if (name.length < 2) {
    errors.name = "Name is required (at least 2 characters).";
  } else if (name.length > 120) {
    errors.name = "Name is too long.";
  }

  const contactMethods = parseContactMethods(raw.contactMethods, errors);

  const emailRaw = trimString(raw.email).toLowerCase();
  const phoneRaw = trimString(raw.phone);
  const instagramHandle = optionalTrim(raw.instagramHandle);
  const contactOtherRaw = optionalTrim(raw.contactOther);

  let email: string | null = null;
  let phone: string | null = null;
  let contactOther: string | null = null;

  if (contactMethods.includes("email")) {
    if (!emailRaw) {
      errors.email = "Email is required when Email is selected.";
    } else if (!EMAIL_RE.test(emailRaw) || emailRaw.length > 254) {
      errors.email = "Enter a valid email address.";
    } else {
      email = emailRaw;
    }
  }

  if (contactMethods.includes("text")) {
    if (phoneRaw.length < 7) {
      errors.phone = "Phone number is required when Text is selected.";
    } else if (phoneRaw.length > 40) {
      errors.phone = "Phone number is too long.";
    } else {
      phone = phoneRaw;
    }
  }

  if (contactMethods.includes("instagram")) {
    if (!instagramHandle) {
      errors.instagramHandle =
        "Instagram handle is required when Instagram is selected.";
    } else if (instagramHandle.length > 100) {
      errors.instagramHandle = "Instagram handle is too long.";
    }
  } else if (instagramHandle && instagramHandle.length > 100) {
    errors.instagramHandle = "Instagram handle is too long.";
  }

  if (contactMethods.includes("other")) {
    if (!contactOtherRaw) {
      errors.contactOther =
        "Tell us how to reach you when Other is selected.";
    } else if (contactOtherRaw.length < 3) {
      errors.contactOther = "Please enter at least a few characters.";
    } else if (contactOtherRaw.length > 300) {
      errors.contactOther = "Description is too long.";
    } else {
      contactOther = contactOtherRaw;
    }
  }

  const sessionType = trimString(raw.sessionType);
  if (!sessionTypeSet.has(sessionType)) {
    errors.sessionType = "Select a session type.";
  }

  let sessionTypeOther: string | null = optionalTrim(raw.sessionTypeOther);
  if (sessionType === "other") {
    if (!sessionTypeOther) {
      errors.sessionTypeOther = "Describe your session type.";
    } else if (sessionTypeOther.length > 200) {
      errors.sessionTypeOther = "Description is too long.";
    }
  } else {
    sessionTypeOther = null;
  }

  const packageInterest = trimString(raw.packageInterest);
  if (!packageInterest) {
    errors.packageInterest = "Select a package or interest.";
  } else if (
    !isPackageAllowedForSessionType(
      packageInterest,
      sessionType as SessionTypeValue
    )
  ) {
    errors.packageInterest = "Select a package that matches your session type.";
  }

  const preferredDate = parseDateField(
    raw.preferredDate,
    "preferredDate",
    errors
  );
  const backupDate = parseDateField(raw.backupDate, "backupDate", errors);

  const locationIdea = optionalTrim(raw.locationIdea);
  if (locationIdea && locationIdea.length > 500) {
    errors.locationIdea = "Location is too long.";
  }

  const vibeStyle = optionalTrim(raw.vibeStyle);
  if (vibeStyle && vibeStyle.length > 2000) {
    errors.vibeStyle = "Vibe/style description is too long.";
  }

  const message = trimString(raw.message);
  if (message.length > 5000) {
    errors.message = "Message is too long.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: "Please fix the highlighted fields.",
    };
  }

  return {
    ok: true,
    data: {
      name,
      contactMethods,
      email,
      phone,
      instagramHandle: contactMethods.includes("instagram")
        ? instagramHandle
        : null,
      contactOther,
      sessionType: sessionType as SessionType,
      sessionTypeOther,
      packageInterest,
      preferredDate,
      backupDate,
      locationIdea,
      vibeStyle,
      message,
    },
  };
}
