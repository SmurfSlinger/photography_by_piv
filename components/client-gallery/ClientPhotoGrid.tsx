"use client";

export type ClientPhoto = {
  id: string;
  filename: string;
  displayUrl: string;
};

type ClientPhotoGridProps = {
  photos: ClientPhoto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function ClientPhotoGrid({
  photos,
  selectedId,
  onSelect,
}: ClientPhotoGridProps) {
  return (
    <div>
      <p className="eyebrow mb-4">All photos</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4">
        {photos.map((photo) => {
          const selected = selectedId === photo.id;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onSelect(photo.id)}
              aria-label={`View ${photo.filename}`}
              aria-pressed={selected}
              className={`overflow-hidden rounded-xl bg-white text-left shadow-sm ring-2 transition ring-offset-2 ring-offset-[#f5f0e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a] ${
                selected
                  ? "ring-[#5c6b4a]"
                  : "ring-transparent hover:ring-stone-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.displayUrl}
                alt=""
                className="aspect-square w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
