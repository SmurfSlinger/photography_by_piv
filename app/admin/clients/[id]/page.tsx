import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import ClientForm from "@/components/admin/ClientForm";
import GalleryList, {
  type AdminGalleryRow,
} from "@/components/admin/GalleryList";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  formatInquiryDateTime,
  sessionTypeLabel,
} from "@/lib/booking-inquiry-display";
import {
  formatBookedDate,
  inquiryPhase,
  inquiryPhaseBadgeClass,
  inquiryPhaseLabel,
  isoDateFromValue,
} from "@/lib/inquiry-phase";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminClientDetailPage({ params }: PageProps) {
  if (!(await isAdminAuthenticated())) {
    const { id } = await params;
    redirect(`/admin/login?from=/admin/clients/${id}`);
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      galleries: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { photos: true } },
        },
      },
      inquiries: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          scheduledAt: true,
          contactedAt: true,
          sessionType: true,
          sessionTypeOther: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const galleries: AdminGalleryRow[] = client.galleries.map((gallery) => ({
    id: gallery.id,
    slug: gallery.slug,
    title: gallery.title,
    status: gallery.status,
    allowOriginalDownload: gallery.allowOriginalDownload,
    createdAt: gallery.createdAt,
    photoCount: gallery._count.photos,
    clientName: client.name,
    clientEmail: client.email,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <p className="mt-1 text-sm">
            <Link
              href="/admin/clients"
              className="text-[#5c6b4a] underline-offset-2 hover:underline"
            >
              ← Clients
            </Link>
          </p>
          <h1 className="section-title mt-2">{client.name}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/admin/galleries/new?clientId=${client.id}`}
            className="btn-primary !px-5 !py-2 text-sm"
          >
            New gallery
          </Link>
          <AdminLogoutButton />
        </div>
      </header>

      <section className="mt-8">
        <ClientForm
          key={client.id}
          clientId={client.id}
          initialName={client.name}
          initialEmail={client.email}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-lg text-stone-900">Booking inquiries</h2>
        {client.inquiries.length === 0 ? (
          <p className="text-sm text-stone-500">
            No booking inquiry is linked. This client was added manually.
          </p>
        ) : (
          <ul className="space-y-2">
            {client.inquiries.map((inquiry) => {
              const phase = inquiryPhase(inquiry);
              const bookedDate = isoDateFromValue(inquiry.scheduledAt);
              return (
                <li key={inquiry.id}>
                  <Link
                    href={`/admin/inquiries?open=${inquiry.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 transition hover:border-[#5c6b4a]/40"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-stone-800">
                        {sessionTypeLabel(inquiry)}
                        {phase === "booked" && bookedDate ? (
                          <span className="text-stone-500">
                            {" "}
                            · {formatBookedDate(bookedDate)}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {formatInquiryDateTime(inquiry.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${inquiryPhaseBadgeClass(phase)}`}
                    >
                      {inquiryPhaseLabel(phase)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-lg text-stone-900">Galleries</h2>
        <GalleryList
          galleries={galleries}
          newHref={`/admin/galleries/new?clientId=${client.id}`}
        />
      </section>
    </main>
  );
}
