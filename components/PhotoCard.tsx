import Image from "next/image";

type PhotoCardProps = {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  className?: string;
};

export default function PhotoCard({
  src,
  alt,
  title,
  subtitle,
  className = "",
}: PhotoCardProps) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/60 transition-shadow hover:shadow-md ${className}`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 85vw, 320px"
        />
      </div>
      {title && (
        <div className="border-t border-stone-100 px-4 py-4 sm:px-5">
          <h3 className="font-serif text-lg text-stone-800">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
          )}
        </div>
      )}
    </article>
  );
}
