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
        className="section-anchor relative flex min-h-[min(92vh,900px)] items-center justify-center"
      >
        <Image
          src="/images/hero.jpg"
          alt="Photography by Piv — portrait and wedding photography"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/45 via-stone-900/30 to-stone-900/50" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
          <p className="eyebrow text-white/85">{site.tagline}</p>
          <h1 className="mt-5 font-serif text-5xl leading-tight tracking-wide sm:text-6xl md:text-7xl">
            {site.name}
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/90 sm:text-lg">
            Timeless images for weddings, families, and every season in between.
          </p>
        </div>
      </section>

      {/* Intro / specialties / quote */}
      <section
        id="intro"
        className="section-anchor mx-auto max-w-3xl section-pad px-6 sm:px-8"
      >
        <p className="eyebrow">Welcome</p>
        <p className="mt-4 text-lg leading-relaxed text-stone-700 sm:text-xl">
          {intro.bio}
        </p>
        <div className="mt-12">
          <p className="eyebrow">Sessions I love</p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {intro.specialties.map((item) => (
              <li
                key={item}
                className="rounded-full border border-stone-300/70 bg-[#faf7f2] px-4 py-2 text-sm text-stone-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <blockquote className="mt-14 rounded-2xl border border-stone-200/80 bg-[#faf7f2] px-6 py-8 sm:px-8">
          <p className="font-serif text-xl leading-relaxed text-stone-700 italic sm:text-2xl">
            &ldquo;{intro.quote.text}&rdquo;
          </p>
          {intro.quote.attribution ? (
            <footer className="mt-4 text-sm text-stone-500 not-italic">
              {intro.quote.attribution}
            </footer>
          ) : null}
        </blockquote>
      </section>

      {/* Public work gallery */}
      <section
        id="work"
        className="section-anchor bg-[#e8dfd0]/50 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <p className="eyebrow">Portfolio</p>
          <h2 className="section-title mt-3">Recent sessions</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
            A glimpse of the moments and moods I love to capture. Your gallery
            will be curated with the same care and warmth.
          </p>
          <div className="mt-12">
            <GalleryGrid />
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="section-anchor mx-auto max-w-3xl section-pad px-6 sm:px-8"
      >
        <p className="eyebrow">{about.heading}</p>
        <h2 className="section-title mt-3">Hi, I&apos;m {about.name}</h2>
        <div className="relative mx-auto mt-10 aspect-[4/5] max-w-xs overflow-hidden rounded-2xl shadow-md ring-1 ring-stone-200/60 sm:max-w-sm">
          <Image
            src="/images/hero.jpg"
            alt="Piv, photographer based in Tremonton, Utah"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 90vw, 384px"
          />
        </div>
        <p className="mt-10 text-base leading-relaxed text-stone-700 sm:text-lg">
          {about.body}
        </p>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="section-anchor bg-[#faf7f2] py-20 md:py-24"
      >
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <p className="eyebrow">Invest in your memories</p>
          <h2 className="section-title mt-3">Packages & starting rates</h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Every session is a little different. These collections are a
            starting point—reach out and we will tailor something that fits your
            day and your budget.
          </p>
          <ul className="mt-12 flex flex-col gap-5">
            {pricingPackages.map((pkg) => (
              <li
                key={pkg.name}
                className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
              >
                <div className="p-6 sm:p-7">
                  <h3 className="font-serif text-xl text-stone-900">
                    {pkg.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
                    {pkg.description}
                  </p>
                  {"note" in pkg && pkg.note && (
                    <p className="mt-3 text-sm text-stone-500">{pkg.note}</p>
                  )}
                </div>
                <div className="border-t border-stone-100 bg-stone-50/80 px-6 py-3.5 sm:px-7">
                  <p className="eyebrow !text-[0.65rem]">
                    Starting at {pkg.priceFrom}
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
        className="section-anchor border-t border-stone-200/60 bg-[#f5f0e8] px-6 py-24 text-center sm:px-8 md:py-28"
      >
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">Book</p>
          <h2 className="section-title mt-3">{contact.heading}</h2>
          <p className="mx-auto mt-5 text-base leading-relaxed text-stone-600">
            {contact.body}
          </p>
          <a href={contact.ctaHref} className="btn-primary mt-10">
            {contact.ctaLabel}
          </a>
        </div>
      </section>

      <footer className="border-t border-stone-200/60 px-6 py-8 text-center text-sm text-stone-500">
        <p>
          &copy; {new Date().getFullYear()} {site.name}. Tremonton, Utah.
        </p>
      </footer>
    </div>
  );
}
