import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import GalleryPhotoManager, {
  type AdminGalleryPhoto,
} from "@/components/admin/GalleryPhotoManager";
import GalleryShareControls from "@/components/admin/GalleryShareControls";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDisplayKey } from "@/lib/gallery-keys";
import { prisma } from "@/lib/prisma";
import { getDisplayUrlTtl, presignGet } from "@/lib/r2";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminGalleryDetailPage({ params }: PageProps) {
  if (!(await isAdminAuthenticated())) {
    const { id } = await params;
    redirect(`/admin/login?from=/admin/galleries/${id}`);
  }

  const { id } = await params;

  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, email: true } },
      photos: { orderBy: { sortOrder: "asc" } },
      accessTokens: {
        where: { revokedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          label: true,
          createdAt: true,
          expiresAt: true,
          revokedAt: true,
        },
      },
    },
  });

  if (!gallery) {
    notFound();
  }

  const ttl = getDisplayUrlTtl();
  const photos: AdminGalleryPhoto[] = await Promise.all(
    gallery.photos.map(async (photo) => {
      let displayUrl: string | null = null;
      try {
        displayUrl = await presignGet(getDisplayKey(photo), gallery.slug, ttl);
      } catch (error) {
        console.error("admin gallery photo preview failed", error);
      }
      return {
        id: photo.id,
        filename: photo.filename,
        displayUrl,
      };
    })
  );

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <p className="mt-1 text-sm">
            <Link
              href="/admin/galleries"
              className="text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              ← Client galleries
            </Link>
          </p>
          <h1 className="section-title mt-2">{gallery.title}</h1>
          <p className="mt-2 text-sm text-stone-600">{gallery.client.name}</p>
          {gallery.client.email ? (
            <a
              href={`mailto:${gallery.client.email}`}
              className="mt-1 inline-block text-sm text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              {gallery.client.email}
            </a>
          ) : null}
          <p className="mt-2 font-mono text-xs text-stone-400">/g/{gallery.slug}</p>
        </div>
        <AdminLogoutButton />
      </header>

      <section className="mt-8">
        <GalleryPhotoManager
          galleryId={gallery.id}
          archived={gallery.status === "archived"}
          photos={photos}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-lg text-stone-900">Status and links</h2>
        <GalleryShareControls
          galleryId={gallery.id}
          status={gallery.status}
          tokens={gallery.accessTokens}
        />
      </section>
    </main>
  );
}
