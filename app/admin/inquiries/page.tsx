import Link from "next/link";
import { redirect } from "next/navigation";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import InquiryList from "@/components/admin/InquiryList";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
import { inquiriesWithSpam } from "@/lib/booking-inquiry-display";
import { prisma } from "@/lib/prisma";

const MAX_INQUIRIES = 200;

export default async function AdminInquiriesPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login?from=/admin/inquiries");
  }

  let inquiries;
  try {
    inquiries = await prisma.bookingInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_INQUIRIES,
    });
  } catch (error) {
    console.error("admin inquiries load failed", error);
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="section-title">Booking inquiries</h1>
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Unable to load inquiries. Check the database connection and try again.
        </p>
      </main>
    );
  }

  const items = inquiriesWithSpam(inquiries);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Private admin</p>
          <p className="mt-1 text-sm">
            <Link href="/admin" className="text-[#5c6b4a] underline-offset-2 hover:underline">
              ← Dashboard
            </Link>
          </p>
          <h1 className="section-title mt-2">Booking inquiries</h1>
          <p className="mt-2 text-sm text-stone-600">
            Newest first · showing up to {MAX_INQUIRIES} inquiries
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      <div className="mt-8">
        <InquiryList items={items} />
      </div>

      <p className="mt-10 text-center text-sm text-stone-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to site
        </Link>
      </p>
    </main>
  );
}
