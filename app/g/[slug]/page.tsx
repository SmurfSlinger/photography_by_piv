import { GalleryStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { readGallerySessionFromCookies } from "@/lib/gallery-session";
import { prisma } from "@/lib/prisma";

import GalleryClient from "./GalleryClient";
import TokenExchange from "./TokenExchange";

export const dynamic = "force-dynamic";

type GalleryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

function AccessRequired() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center sm:py-28">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8dfd0]/80">
        <svg
          className="h-7 w-7 text-stone-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15m0 0v8.25a2.25 2.25 0 01-2.25 2.25h-10.5a2.25 2.25 0 01-2.25-2.25v-8.25"
          />
        </svg>
      </div>
      <h1 className="mt-8 font-serif text-2xl text-stone-800">
        This gallery is private
      </h1>
      <p className="mt-4 text-base leading-relaxed text-stone-600">
        Open the personal link from your photographer to view and download your
        photos. If your link has expired, ask for a new one.
      </p>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex flex-col items-center px-6 py-24 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-[#5c6b4a]"
        aria-hidden
      />
      <p className="mt-5 text-stone-600">Loading…</p>
    </div>
  );
}

export default async function GalleryPage({
  params,
  searchParams,
}: GalleryPageProps) {
  const { slug } = await params;
  const { t: rawToken } = await searchParams;

  const gallery = await prisma.gallery.findUnique({ where: { slug } });

  if (!gallery || gallery.status !== GalleryStatus.active) {
    notFound();
  }

  if (rawToken) {
    return (
      <Suspense fallback={<PageLoading />}>
        <TokenExchange slug={slug} token={rawToken} />
      </Suspense>
    );
  }

  const session = await readGallerySessionFromCookies();

  if (session?.slug === slug && session.galleryId === gallery.id) {
    return (
      <GalleryClient
        slug={slug}
        title={gallery.title}
        allowDownload={gallery.allowOriginalDownload}
      />
    );
  }

  return <AccessRequired />;
}
