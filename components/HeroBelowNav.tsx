import Image from "next/image";
import { bookCta, site } from "@/lib/marketing-content";

/** Below-nav hero — matches saved B44A1185 settings (cover, object-top, max-h 836px). */
export default function HeroBelowNav() {
  return (
    <section id="home" className="section-anchor pt-16">
      <div className="relative flex min-h-[calc(92vh-4rem)] max-h-[836px] items-center justify-center overflow-hidden">
        <Image
          src={site.heroImage}
          alt="Photography by Piv — portrait and wedding photography"
          fill
          priority
          className={site.heroImageCrop}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/45 via-stone-900/30 to-stone-900/50" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
          <p className="eyebrow !text-white/85">{site.tagline}</p>
          <h1 className="mt-5 font-serif text-5xl leading-tight tracking-wide sm:text-6xl md:text-7xl">
            {site.name}
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/90 sm:text-lg">
            {site.heroSubline}
          </p>
          <a href={bookCta.href} className="btn-primary mt-8">
            {bookCta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
