import Image from "next/image";
import GalleryGrid from "@/components/GalleryGrid";
import Navbar from "@/components/Navbar";
import {
  about,
  contact,
  intro,
  pricingPackages,
  site,
} from "@/lib/marketing-content";

export default function Home() {
  return (
    <div className="bg-[#f5f0e8] text-stone-800">
      <Navbar />
      {/* Hero / brand */}
      <section
        id="home"
        className="section-anchor relative flex min-h-[85vh] items-center justify-center"
      >
        <Image
          src="/images/hero.jpg"
          alt="Photography by Piv hero"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-stone-900/35" />
        <div className="relative z-10 px-6 text-center text-white">
          <p className="font-mono text-xs tracking-[0.25em] uppercase sm:text-sm">
            {site.tagline}
          </p>
          <h1 className="mt-4 font-serif text-5xl tracking-wide sm:text-7xl">
            {site.name}
          </h1>
        </div>
      </section>

      {/* Intro / specialties / quote */}
      <section
        id="intro"
        className="section-anchor mx-auto max-w-3xl px-6 py-20 sm:px-8"
      >
        <p className="text-lg leading-relaxed text-stone-700">{intro.bio}</p>
        <div className="mt-10">
          <h2 className="font-mono text-xs tracking-[0.2em] text-stone-500 uppercase">
            Specialties
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {intro.specialties.map((item) => (
              <li
                key={item}
                className="rounded-full border border-stone-300/80 bg-[#faf7f2] px-4 py-1.5 text-sm text-stone-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <blockquote className="mt-12 border-l-2 border-[#5c6b4a] pl-6 font-serif text-xl text-stone-700 italic sm:text-2xl">
          {intro.quote.text}
          <footer className="mt-3 font-mono text-sm text-stone-500 not-italic">
            {intro.quote.attribution}
          </footer>
        </blockquote>
      </section>

      {/* Public work gallery */}
      <section
        id="work"
        className="section-anchor bg-[#e8dfd0]/60 py-20"
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <h2 className="font-serif text-3xl text-stone-800 sm:text-4xl">
            My work
          </h2>
          <p className="mt-2 max-w-xl text-stone-600">
            A selection of sessions and styles. Scroll sideways to browse
            recent work.
          </p>
          <div className="mt-10">
            <GalleryGrid />
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="section-anchor mx-auto max-w-3xl px-6 py-20 sm:px-8"
      >
        <p className="font-mono text-xs tracking-[0.2em] text-stone-500 uppercase">
          {about.heading}
        </p>
        <h2 className="mt-3 font-serif text-4xl text-stone-800">
          I&apos;m {about.name}
        </h2>
        <div className="relative mx-auto mt-10 aspect-[4/5] max-w-sm overflow-hidden rounded-lg shadow-md">
          <Image
            src="/images/hero.jpg"
            alt="Photographer portrait placeholder"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 384px"
          />
        </div>
        <p className="mt-10 leading-relaxed text-stone-700">{about.body}</p>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="section-anchor bg-[#faf7f2] py-20"
      >
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <h2 className="font-serif text-3xl text-stone-800 sm:text-4xl">
            Pricing
          </h2>
          <p className="mt-2 text-stone-600">
            Starting rates — final quotes depend on your session needs.
          </p>
          <ul className="mt-10 flex flex-col gap-6">
            {pricingPackages.map((pkg) => (
              <li
                key={pkg.name}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-stone-900">
                    {pkg.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">
                    {pkg.description}
                  </p>
                  {"note" in pkg && pkg.note && (
                    <p className="mt-2 text-sm text-stone-500">{pkg.note}</p>
                  )}
                </div>
                <div className="border-t border-stone-100 bg-stone-50 px-6 py-3">
                  <p className="font-mono text-xs tracking-wider text-stone-500 uppercase">
                    Prices start from {pkg.priceFrom}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact / book */}
      <section
        id="contact"
        className="section-anchor mx-auto max-w-3xl px-6 py-24 text-center sm:px-8"
      >
        <h2 className="font-serif text-3xl text-stone-800 sm:text-4xl">
          {contact.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-stone-600">{contact.body}</p>
        <a
          href={contact.ctaHref}
          className="mt-10 inline-block rounded-full bg-[#5c6b4a] px-10 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#4a5740]"
        >
          {contact.ctaLabel}
        </a>
      </section>
    </div>
  );
}
