import PhotoCard from "@/components/PhotoCard";
import { workPhotos } from "@/lib/marketing-content";

export default function GalleryGrid() {
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:-mx-6 sm:px-6">
      {workPhotos.map((photo) => (
        <div
          key={`${photo.title}-${photo.src}`}
          className="w-[min(85vw,320px)] shrink-0 snap-center"
        >
          <PhotoCard
            src={photo.src}
            alt={photo.alt}
            title={photo.title}
            className="h-full"
          />
        </div>
      ))}
    </div>
  );
}
