import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import CreateGalleryForm from "@/components/admin/CreateGalleryForm";
import GalleryList, {
  type AdminGalleryRow,
} from "@/components/admin/GalleryList";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminGalleriesPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?from=/admin/galleries");
  }

  let galleries: AdminGalleryRow[];
  try {
    const rows = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, email: true } },
        _count: { select: { photos: true } },
      },
    });

    galleries = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
      allowOriginalDownload: row.allowOriginalDownload,
      createdAt: row.createdAt,
      photoCount: row._count.photos,
      clientName: row.client.name,
      clientEmail: row.client.email,
    }));
  } catch (error) {
    console.error("admin galleries load failed", error);
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="section-title">Client galleries</h1>
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Unable to load galleries. Check the database connection and try again.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <p className="mt-1 text-sm">
            <Link
              href="/admin"
              className="text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              ← Dashboard
            </Link>
          </p>
          <h1 className="section-title mt-2">Client galleries</h1>
        </div>
        <AdminLogoutButton />
      </header>

      <div className="mt-8 space-y-6">
        <CreateGalleryForm />
        <GalleryList galleries={galleries} />
      </div>

      <p className="mt-10 text-center text-sm text-stone-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to site
        </Link>
      </p>
    </main>
  );
}
