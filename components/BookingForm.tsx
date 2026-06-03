"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import TurnstileField, {
  type TurnstileFieldHandle,
} from "@/components/TurnstileField";
import {
  contactMethodOptions,
  isPackageAllowedForSessionType,
  packageInterestOptionsForSessionType,
  packageInterestValues,
  sessionTypes,
  sessionTypeValues,
  type ContactMethodValue,
  type SessionTypeValue,
} from "@/lib/booking-options";
import type { FieldErrors } from "@/lib/booking-inquiry-validation";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

type FormState = {
  name: string;
  contactMethods: ContactMethodValue[];
  email: string;
  phone: string;
  instagramHandle: string;
  contactOther: string;
  sessionType: string;
  sessionTypeOther: string;
  packageInterest: string;
  preferredDate: string;
  backupDate: string;
  locationIdea: string;
  vibeStyle: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  contactMethods: [],
  email: "",
  phone: "",
  instagramHandle: "",
  contactOther: "",
  sessionType: "wedding",
  sessionTypeOther: "",
  packageInterest: "",
  preferredDate: "",
  backupDate: "",
  locationIdea: "",
  vibeStyle: "",
  message: "",
};

function isSessionTypeValue(value: string): value is SessionTypeValue {
  return (sessionTypeValues as readonly string[]).includes(value);
}

export default function BookingForm() {
  const searchParams = useSearchParams();
  const formStartedAtRef = useRef(Date.now());
  const turnstileRef = useRef<TurnstileFieldHandle>(null);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const showTurnstile = TURNSTILE_SITE_KEY.length > 0;

  useEffect(() => {
    const packageParam = searchParams.get("package");
    const sessionParam = searchParams.get("session");
    const hasPackage =
      Boolean(packageParam) &&
      packageInterestValues.includes(packageParam!);
    const hasSession =
      Boolean(sessionParam) && isSessionTypeValue(sessionParam!);

    if (!hasPackage && !hasSession) return;

    setForm((prev) => {
      const next = { ...prev };
      if (hasSession) next.sessionType = sessionParam!;
      const session = (
        hasSession ? sessionParam! : prev.sessionType
      ) as SessionTypeValue;
      if (
        hasPackage &&
        isPackageAllowedForSessionType(packageParam!, session)
      ) {
        next.packageInterest = packageParam!;
      } else if (
        next.packageInterest &&
        !isPackageAllowedForSessionType(next.packageInterest, session)
      ) {
        next.packageInterest = "";
      }
      return next;
    });
  }, [searchParams]);

  function updateSessionType(value: string) {
    if (!isSessionTypeValue(value)) return;
    setForm((prev) => {
      const next = { ...prev, sessionType: value };
      if (
        prev.packageInterest &&
        !isPackageAllowedForSessionType(prev.packageInterest, value)
      ) {
        next.packageInterest = "";
      }
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.sessionType;
      delete next.packageInterest;
      return next;
    });
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function toggleContactMethod(method: ContactMethodValue, checked: boolean) {
    setForm((prev) => {
      const contactMethods = checked
        ? [...prev.contactMethods, method]
        : prev.contactMethods.filter((m) => m !== method);
      return { ...prev, contactMethods };
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.contactMethods;
      if (!checked) {
        if (method === "email") delete next.email;
        if (method === "text") delete next.phone;
        if (method === "instagram") delete next.instagramHandle;
        if (method === "other") delete next.contactOther;
      }
      return next;
    });
  }

  const wantsEmail = form.contactMethods.includes("email");
  const wantsText = form.contactMethods.includes("text");
  const wantsInstagram = form.contactMethods.includes("instagram");
  const wantsContactOther = form.contactMethods.includes("other");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (showTurnstile && !turnstileToken) {
      setFormError("Please complete the verification check.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/booking-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          turnstileToken: turnstileToken ?? "",
          formStartedAt: formStartedAtRef.current,
          website: honeypot,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        fields?: FieldErrors;
        resetTurnstile?: boolean;
      };

      if (!response.ok) {
        if (payload.resetTurnstile) {
          turnstileRef.current?.reset();
        }
        if (payload.fields) {
          setFieldErrors(payload.fields);
        }
        setFormError(payload.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-stone-200/80 bg-white px-6 py-10 text-center shadow-sm sm:px-10"
        role="status"
      >
        <p className="eyebrow">Thank you</p>
        <h2 className="section-title mt-3">Your inquiry was received</h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-stone-600">
          Piv will review your details and reply with availability and next
          steps—usually within one to two business days.
        </p>
        <a href="/" className="btn-primary mt-8">
          Back to home
        </a>
      </div>
    );
  }

  function fieldError(id: string) {
    const message = fieldErrors[id];
    if (!message) return null;
    return (
      <p id={`${id}-error`} className="mt-1 text-sm text-red-700" role="alert">
        {message}
      </p>
    );
  }

  const showSessionOther = form.sessionType === "other";
  const packageOptions = isSessionTypeValue(form.sessionType)
    ? packageInterestOptionsForSessionType(form.sessionType)
    : [];

  return (
    <form onSubmit={handleSubmit} className="relative space-y-8" noValidate>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {formError && (
        <p
          className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {formError}
        </p>
      )}

      <div className="form-field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldError("name")}
      </div>

      <fieldset className="space-y-3">
        <legend className="form-legend">How should Piv reach you?</legend>
        <p className="text-sm text-stone-500">
          Select one or more. Enter the details for each option you choose.
        </p>
        {fieldError("contactMethods")}

        <div className="space-y-3">
          {contactMethodOptions.map((method) => {
            const checked = form.contactMethods.includes(method.value);

            return (
              <div
                key={method.value}
                className={`contact-option ${checked ? "contact-option--active" : ""}`}
              >
                <label className="contact-option__label">
                  <input
                    type="checkbox"
                    name="contactMethods"
                    value={method.value}
                    checked={checked}
                    onChange={(e) =>
                      toggleContactMethod(method.value, e.target.checked)
                    }
                  />
                  <span>{method.label}</span>
                </label>

                {method.value === "email" && wantsEmail && (
                  <div className="contact-option__detail form-field">
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                    {fieldError("email")}
                  </div>
                )}

                {method.value === "text" && wantsText && (
                  <div className="contact-option__detail form-field">
                    <label htmlFor="phone">Phone number for texts</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      aria-invalid={Boolean(fieldErrors.phone)}
                    />
                    {fieldError("phone")}
                  </div>
                )}

                {method.value === "instagram" && wantsInstagram && (
                  <div className="contact-option__detail form-field">
                    <label htmlFor="instagramHandle">Instagram handle</label>
                    <input
                      id="instagramHandle"
                      name="instagramHandle"
                      type="text"
                      placeholder="@yourhandle"
                      value={form.instagramHandle}
                      onChange={(e) =>
                        updateField("instagramHandle", e.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.instagramHandle)}
                    />
                    {fieldError("instagramHandle")}
                  </div>
                )}

                {method.value === "other" && wantsContactOther && (
                  <div className="contact-option__detail form-field">
                    <label htmlFor="contactOther">
                      How should I contact you?
                    </label>
                    <input
                      id="contactOther"
                      name="contactOther"
                      type="text"
                      placeholder="e.g. Facebook message, best time to call back"
                      value={form.contactOther}
                      onChange={(e) =>
                        updateField("contactOther", e.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.contactOther)}
                    />
                    {fieldError("contactOther")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="sr-only">Session details</legend>

        <div className="form-field">
          <label htmlFor="sessionType">Photoshoot / session type</label>
          <select
            id="sessionType"
            name="sessionType"
            required
            value={form.sessionType}
            onChange={(e) => updateSessionType(e.target.value)}
            aria-invalid={Boolean(fieldErrors.sessionType)}
          >
            {sessionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {fieldError("sessionType")}
        </div>

        {showSessionOther && (
          <div className="form-field">
            <label htmlFor="sessionTypeOther">Describe your session type</label>
            <input
              id="sessionTypeOther"
              name="sessionTypeOther"
              type="text"
              required
              value={form.sessionTypeOther}
              onChange={(e) => updateField("sessionTypeOther", e.target.value)}
              aria-invalid={Boolean(fieldErrors.sessionTypeOther)}
            />
            {fieldError("sessionTypeOther")}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="packageInterest">Package or session interest</label>
          <select
            id="packageInterest"
            name="packageInterest"
            required
            value={form.packageInterest}
            onChange={(e) => updateField("packageInterest", e.target.value)}
            aria-invalid={Boolean(fieldErrors.packageInterest)}
          >
            <option value="" disabled>
              Select a package or option
            </option>
            {packageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError("packageInterest")}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="form-field">
            <label htmlFor="preferredDate">Date in mind</label>
            <input
              id="preferredDate"
              name="preferredDate"
              type="date"
              value={form.preferredDate}
              onChange={(e) => updateField("preferredDate", e.target.value)}
              aria-invalid={Boolean(fieldErrors.preferredDate)}
            />
            {fieldError("preferredDate")}
          </div>

          <div className="form-field">
            <label htmlFor="backupDate">Backup / alternate date</label>
            <input
              id="backupDate"
              name="backupDate"
              type="date"
              value={form.backupDate}
              onChange={(e) => updateField("backupDate", e.target.value)}
              aria-invalid={Boolean(fieldErrors.backupDate)}
            />
            {fieldError("backupDate")}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="locationIdea">Location idea</label>
          <input
            id="locationIdea"
            name="locationIdea"
            type="text"
            placeholder="Venue, park, home, etc."
            value={form.locationIdea}
            onChange={(e) => updateField("locationIdea", e.target.value)}
            aria-invalid={Boolean(fieldErrors.locationIdea)}
          />
          {fieldError("locationIdea")}
        </div>

        <div className="form-field">
          <label htmlFor="vibeStyle">Vibe / style you are looking for</label>
          <textarea
            id="vibeStyle"
            name="vibeStyle"
            rows={3}
            placeholder="Mood, inspiration, colors, candid vs posed…"
            value={form.vibeStyle}
            onChange={(e) => updateField("vibeStyle", e.target.value)}
            aria-invalid={Boolean(fieldErrors.vibeStyle)}
          />
          {fieldError("vibeStyle")}
        </div>

        <div className="form-field">
          <label htmlFor="message">Message / additional details</label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={form.message}
            onChange={(e) => updateField("message", e.target.value)}
            aria-invalid={Boolean(fieldErrors.message)}
          />
          {fieldError("message")}
        </div>
      </fieldset>

      {showTurnstile ? (
        <TurnstileField
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onTokenChange={setTurnstileToken}
        />
      ) : (
        <p className="text-sm text-stone-500">
          Verification is not configured. Set Turnstile keys in your environment,
          or use BOOKING_BOT_CHECKS_DISABLED=true in local development only.
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto"
        disabled={submitting || (showTurnstile && !turnstileToken)}
      >
        {submitting ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
