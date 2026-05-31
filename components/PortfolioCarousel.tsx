"use client";

import Image from "next/image";
import { useState } from "react";

import { portfolioPhotos } from "@/lib/marketing-content";

const arrowClass =
  "pointer-events-auto absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-300/80 bg-[#faf7f2]/95 text-stone-600 shadow-sm backdrop-blur-sm transition-colors hover:border-stone-400 hover:bg-white hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a] max-md:hidden";

type PortfolioCarouselProps = {
  photos?: readonly { src: string; alt: string }[];
};

export default function PortfolioCarousel({
  photos = portfolioPhotos,
}: PortfolioCarouselProps = {}) {
  const [index, setIndex] = useState(0);
  const count = photos.length;

  function showPrevious() {
    if (count === 0) return;
    setIndex((current) => (current - 1 + count) % count);
  }

  function showNext() {
    if (count === 0) return;
    setIndex((current) => (current + 1) % count);
  }

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    (event.currentTarget as HTMLElement).dataset.touchStartX = String(
      touch.clientX
    );
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const startX = Number(
      (event.currentTarget as HTMLElement).dataset.touchStartX
    );
    const endX = event.changedTouches[0].clientX;
    const delta = startX - endX;

    if (Math.abs(delta) < 40) return;
    if (delta > 0) showNext();
    else showPrevious();
  }

  if (count === 0) {
    return null;
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone-200/40 ring-1 ring-stone-200/70"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="pointer-events-none absolute inset-0">
          {photos.map((photo, i) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              fill
              className={`object-cover transition-opacity duration-500 ease-in-out motion-reduce:transition-none ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
              sizes="(max-width: 448px) 100vw, 448px"
              priority={i === 0}
              aria-hidden={i !== index}
            />
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              className={`${arrowClass} left-3 sm:left-4`}
              aria-label="Show previous portfolio photo"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                showPrevious();
              }}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 18l-6-6 6-6"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`${arrowClass} right-3 sm:right-4`}
              aria-label="Show next portfolio photo"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                showNext();
              }}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 18l6-6-6-6"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          className="mt-4 flex justify-center gap-2"
          aria-label={`Portfolio photo ${index + 1} of ${count}`}
          role="tablist"
        >
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show portfolio photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-[#5c6b4a]"
                  : "w-2 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
