"use client";

import { useState } from "react";
import { navLinks, site } from "@/lib/marketing-content";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-stone-200/70 bg-[#f5f0e8]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#home"
          className="font-serif text-sm tracking-[0.18em] text-stone-800 uppercase sm:text-[0.95rem]"
          onClick={() => setMenuOpen(false)}
        >
          {site.name}
        </a>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {navLinks.map((link) =>
            link.label === "Book" ? (
              <a
                key={link.href}
                href={link.href}
                className="btn-primary !px-5 !py-2 text-xs sm:text-sm"
              >
                {link.label}
              </a>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-stone-600 transition-colors hover:text-stone-900"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300/80 text-stone-800 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-stone-200/80 bg-[#faf7f2] px-4 py-5 md:hidden">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={
                    link.label === "Book"
                      ? "btn-primary mt-3 w-full"
                      : "block rounded-lg px-2 py-2.5 text-base text-stone-700 hover:bg-stone-100/80"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
