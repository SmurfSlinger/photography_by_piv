"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TokenExchangeProps = {
  slug: string;
  token: string;
};

export default function TokenExchange({ slug, token }: TokenExchangeProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function exchange() {
      const response = await fetch(`/api/galleries/${slug}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Could not verify access link");
        return;
      }

      router.replace(`/g/${slug}`);
      router.refresh();
    }

    exchange();

    return () => {
      cancelled = true;
    };
  }, [slug, token, router]);

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      {error ? (
        <>
          <h1 className="font-serif text-2xl text-stone-800">Access denied</h1>
          <p className="mt-4 text-stone-600">{error}</p>
        </>
      ) : (
        <>
          <h1 className="font-serif text-2xl text-stone-800">Opening gallery</h1>
          <p className="mt-4 text-stone-600">Verifying your secure link…</p>
        </>
      )}
    </div>
  );
}
