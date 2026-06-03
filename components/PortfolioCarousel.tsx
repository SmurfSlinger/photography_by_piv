"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { portfolioPhotos } from "@/lib/marketing-content";

const AXIS_RATIO = 1.3;
const SWIPE_MIN_PX = 40;
const AXIS_LOCK_PX = 15;

const arrowBase =
  "pointer-events-auto absolute top-1/2 z-20 flex -translate-y-1/2 items-center justify-center rounded-full border border-stone-300/80 text-stone-600 shadow-sm backdrop-blur-sm transition-colors hover:border-stone-400 hover:bg-white hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a]";

const desktopArrowClass = `${arrowBase} h-10 w-10 bg-[#faf7f2]/95 max-md:hidden`;
const mobileArrowClass = `${arrowBase} h-11 w-11 bg-[#faf7f2]/90 md:hidden`;

type GestureAxis = "none" | "horizontal" | "vertical";

type PortfolioCarouselProps = {
  photos?: readonly { src: string; alt: string }[];
};

function CarouselArrow({
  direction,
  className,
  onClick,
}: {
  direction: "previous" | "next";
  className: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const isPrevious = direction === "previous";
  return (
    <button
      type="button"
      className={className}
      aria-label={
        isPrevious
          ? "Show previous portfolio photo"
          : "Show next portfolio photo"
      }
      onClick={onClick}
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
          d={isPrevious ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
        />
      </svg>
    </button>
  );
}

export default function PortfolioCarousel({
  photos = portfolioPhotos,
}: PortfolioCarouselProps = {}) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    axis: "none" as GestureAxis,
  });

  function showPrevious() {
    if (count === 0) return;
    setIndex((current) => (current - 1 + count) % count);
  }

  function showNext() {
    if (count === 0) return;
    setIndex((current) => (current + 1) % count);
  }

  function lockAxis(deltaX: number, deltaY: number): GestureAxis {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX > absY * AXIS_RATIO && absX > AXIS_LOCK_PX) {
      return "horizontal";
    }
    if (absY > absX * AXIS_RATIO && absY > AXIS_LOCK_PX) {
      return "vertical";
    }
    return "none";
  }

  function isHorizontalSwipe(deltaX: number, deltaY: number): boolean {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    return absX > absY * AXIS_RATIO && absX > SWIPE_MIN_PX;
  }

  function applySwipe(deltaX: number) {
    if (deltaX < 0) {
      showNext();
    } else {
      showPrevious();
    }
  }

  function handleArrowClick(
    event: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) {
    event.preventDefault();
    event.stopPropagation();
    action();
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el || count <= 1) {
      return;
    }

    function resetGesture() {
      gestureRef.current.axis = "none";
    }

    function onTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      gestureRef.current.startX = touch.clientX;
      gestureRef.current.startY = touch.clientY;
      gestureRef.current.axis = "none";
    }

    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - gestureRef.current.startX;
      const deltaY = touch.clientY - gestureRef.current.startY;

      if (gestureRef.current.axis === "none") {
        const locked = lockAxis(deltaX, deltaY);
        if (locked !== "none") {
          gestureRef.current.axis = locked;
        }
      }

      if (gestureRef.current.axis === "horizontal") {
        event.preventDefault();
      }
    }

    function onTouchEnd(event: TouchEvent) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - gestureRef.current.startX;
      const deltaY = touch.clientY - gestureRef.current.startY;
      const { axis } = gestureRef.current;

      if (axis === "vertical") {
        resetGesture();
        return;
      }

      if (axis === "horizontal" || isHorizontalSwipe(deltaX, deltaY)) {
        if (isHorizontalSwipe(deltaX, deltaY)) {
          applySwipe(deltaX);
        }
      }

      resetGesture();
    }

    function onTouchCancel() {
      resetGesture();
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [count]);

  if (count === 0) {
    return null;
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        ref={trackRef}
        className="relative aspect-[4/5] w-full touch-pan-y overflow-hidden rounded-2xl bg-stone-200/40 ring-1 ring-stone-200/70"
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
            <CarouselArrow
              direction="previous"
              className={`${desktopArrowClass} left-3 sm:left-4`}
              onClick={(event) => handleArrowClick(event, showPrevious)}
            />
            <CarouselArrow
              direction="next"
              className={`${desktopArrowClass} right-3 sm:right-4`}
              onClick={(event) => handleArrowClick(event, showNext)}
            />
            <CarouselArrow
              direction="previous"
              className={`${mobileArrowClass} left-2`}
              onClick={(event) => handleArrowClick(event, showPrevious)}
            />
            <CarouselArrow
              direction="next"
              className={`${mobileArrowClass} right-2`}
              onClick={(event) => handleArrowClick(event, showNext)}
            />
          </>
        )}
      </div>

      {count > 1 && (
        <p
          className="mt-4 text-center text-xs tracking-wide text-stone-500"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Portfolio photo ${index + 1} of ${count}`}
        >
          <span className="md:hidden">Swipe to see more · </span>
          {index + 1} / {count}
        </p>
      )}
    </div>
  );
}
