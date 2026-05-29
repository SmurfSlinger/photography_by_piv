import PhotoCard from "@/components/PhotoCard";
import { workPhotos } from "@/lib/marketing-content";

export default function GalleryGrid() {
  return (
    <div className="scroll-hint -mx-4 sm:-mx-6">
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scroll-smooth sm:gap-5 sm:px-6 [scrollbar-width:thin]">
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
      <p className="mt-4 text-center text-xs text-stone-500 sm:text-sm">
        Swipe to explore · Sample images shown
      </p>
    </div>
  );
}
