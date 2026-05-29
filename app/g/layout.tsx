import Link from "next/link";

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f0e8] text-stone-800">
      <header className="border-b border-stone-200/70 bg-[#faf7f2]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="font-serif text-sm tracking-[0.16em] text-stone-800 uppercase hover:text-stone-600"
          >
            Photography by Piv
          </Link>
          <span className="rounded-full border border-stone-300/70 bg-white px-3 py-1 text-xs font-medium tracking-wide text-stone-600">
            Client gallery
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
