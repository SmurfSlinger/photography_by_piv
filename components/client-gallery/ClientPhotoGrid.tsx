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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onSelect(photo.id)}
          className={`overflow-hidden rounded-lg bg-white text-left shadow-sm ring-2 transition ring-offset-2 ring-offset-[#f5f0e8] ${
            selectedId === photo.id ? "ring-[#5c6b4a]" : "ring-transparent"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.displayUrl}
            alt={photo.filename}
            className="aspect-square w-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}
