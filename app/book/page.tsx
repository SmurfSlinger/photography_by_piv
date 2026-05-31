import { Suspense } from "react";

import Navbar from "@/components/Navbar";
import BookingForm from "@/components/BookingForm";
import { bookPage, site } from "@/lib/marketing-content";

export const metadata = {
  title: `Request to Book | ${site.name}`,
  description:
    "Send a session inquiry to Photography by Piv — weddings, couples, families, and portraits in Tremonton, Utah.",
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-[#f5f0e8] text-stone-800">
      <Navbar />
      <main className="section-anchor mx-auto max-w-2xl px-6 pb-24 pt-28 sm:px-8">
        <p className="eyebrow">{bookPage.eyebrow}</p>
        <h1 className="section-title mt-3">{bookPage.heading}</h1>
        <p className="mt-4 text-base leading-relaxed text-stone-600">
          {bookPage.body}
        </p>
        <div className="mt-10">
          <Suspense fallback={<p className="text-stone-600">Loading form…</p>}>
            <BookingForm />
          </Suspense>
        </div>
      </main>
      <footer className="border-t border-stone-200/60 px-6 py-8 text-center text-sm text-stone-500">
        <p>
          &copy; {new Date().getFullYear()} {site.name}. Tremonton, Utah.
        </p>
      </footer>
    </div>
  );
}
