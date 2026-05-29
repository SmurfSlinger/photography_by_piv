import Link from "next/link";

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f0e8] text-stone-800">
      <header className="border-b border-stone-200/80 bg-[#f5f0e8]/95 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="font-serif text-sm tracking-[0.2em] text-stone-800 uppercase"
          >
            Photography by Piv
          </Link>
          <span className="font-mono text-xs tracking-wider text-stone-500 uppercase">
            Private gallery
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
