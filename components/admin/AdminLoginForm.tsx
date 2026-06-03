"use client";

import { useState } from "react";

type AdminLoginFormProps = {
  redirectTo: string;
};

export default function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    const password = new FormData(form).get("password");
    if (typeof password !== "string" || password.length === 0) {
      setError("Enter your admin password or access token.");
      setPending(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "same-origin",
      });

      if (res.ok) {
        window.location.href = redirectTo;
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Sign-in failed. Try again.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-medium text-stone-700"
        >
          Admin password or access token
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 shadow-sm focus:border-[#5c6b4a] focus:outline-none focus:ring-2 focus:ring-[#5c6b4a]/30"
        />
      </div>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
