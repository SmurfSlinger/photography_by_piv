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
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-serif text-2xl text-stone-800">Private gallery</h1>
      <p className="mt-4 text-stone-600">
        Use the secure link from your photographer to view this gallery.
      </p>
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
      <Suspense fallback={<p className="py-24 text-center">Loading…</p>}>
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
