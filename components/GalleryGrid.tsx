"use client";

import { useRef } from "react";
import PhotoCard from "@/components/PhotoCard";
import { portfolio, workPhotos } from "@/lib/marketing-content";

function scrollGallery(container: HTMLDivElement | null, direction: "left" | "right") {
  if (!container) return;

  const firstCard = container.firstElementChild as HTMLElement | null;
  const style = getComputedStyle(container);
  const gap = parseFloat(style.columnGap || style.gap) || 16;
  const amount = firstCard
    ? firstCard.offsetWidth + gap
    : container.clientWidth * 0.85;

  container.scrollBy({
    left: direction === "left" ? -amount : amount,
    behavior: "smooth",
  });
}

const arrowButtonClass =
  "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-300/70 bg-[#faf7f2]/95 text-stone-600 shadow-sm backdrop-blur-sm transition-colors hover:border-stone-400/80 hover:bg-white hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a] md:flex";

export default function GalleryGrid() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="-mx-4 sm:-mx-6">
      <div className="relative px-4 sm:px-6">
        <button
          type="button"
          className={`${arrowButtonClass} left-0`}
          aria-label="Scroll gallery left"
          onClick={() => scrollGallery(scrollRef.current, "left")}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="scroll-hint flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth sm:gap-5 [scrollbar-width:thin]"
        >
          {workPhotos.map((photo) => (
            <div
              key={photo.title}
              className="w-[min(82vw,300px)] shrink-0 snap-center sm:w-[min(42vw,320px)]"
            >
              <PhotoCard
                src={photo.src}
                alt={photo.alt}
                title={photo.title}
                subtitle={photo.subtitle}
                className="h-full"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`${arrowButtonClass} right-0`}
          aria-label="Scroll gallery right"
          onClick={() => scrollGallery(scrollRef.current, "right")}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-stone-500 sm:text-sm">
        {portfolio.scrollHint}
      </p>
    </div>
  );
}
