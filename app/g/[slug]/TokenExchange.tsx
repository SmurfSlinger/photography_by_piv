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
        setError(
          "This link is invalid or has expired. Please contact your photographer for a new gallery link."
        );
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
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center sm:py-28">
      {error ? (
        <>
          <h1 className="font-serif text-2xl text-stone-800">
            Unable to open gallery
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            {error}
          </p>
        </>
      ) : (
        <>
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-[#5c6b4a]"
            aria-hidden
          />
          <h1 className="mt-8 font-serif text-2xl text-stone-800">
            Welcome to your gallery
          </h1>
          <p className="mt-4 text-base text-stone-600">
            Securing your session…
          </p>
        </>
      )}
    </div>
  );
}
