"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient, updateClient } from "@/lib/client-admin-actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#5c6b4a] focus:outline-none focus:ring-1 focus:ring-[#5c6b4a] disabled:opacity-60";

type Props = {
  clientId?: string;
  initialName?: string;
  initialEmail?: string | null;
};

export default function ClientForm({
  clientId,
  initialName = "",
  initialEmail = "",
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const editing = Boolean(clientId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setSaved(false);

    try {
      if (clientId) {
        const result = await updateClient(clientId, { name, email });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
        return;
      }

      const result = await createClient({ name, email });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/clients/${result.clientId}`);
      router.refresh();
    } catch {
      setError(editing ? "Couldn’t save client" : "Couldn’t create client");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="client-name"
            className="text-xs font-medium uppercase tracking-wide text-stone-500"
          >
            Name
          </label>
          <input
            id="client-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
            required
            maxLength={120}
            placeholder="Jordan Smith"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="client-email"
            className="text-xs font-medium uppercase tracking-wide text-stone-500"
          >
            Email
          </label>
          <input
            id="client-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            maxLength={120}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-[#3d4a32]" role="status">
          Saved
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (editing ? "Saving…" : "Creating…") : editing ? "Save" : "Create client"}
      </button>
    </form>
  );
}
