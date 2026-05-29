import Image from "next/image";

type PhotoCardProps = {
  src: string;
  alt: string;
  title?: string;
  className?: string;
};

export default function PhotoCard({
  src,
  alt,
  title,
  className = "",
}: PhotoCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-xl bg-white shadow-sm ${className}`}
    >
      <div className="relative aspect-[4/5] w-full">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 85vw, 320px"
        />
      </div>
      {title && (
        <div className="border-t border-stone-100 px-4 py-3">
          <h3 className="font-serif text-lg text-stone-800">{title}</h3>
        </div>
      )}
    </article>
  );
}
