import Image from "next/image";
import GalleryGrid from "@/components/GalleryGrid";
import Navbar from "@/components/Navbar";
import {
  about,
  bookCta,
  contact,
  intro,
  portfolio,
  pricing,
  pricingCategories,
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
            {site.heroSubline}
          </p>
          <a href={bookCta.href} className="btn-primary mt-8">
            {bookCta.label}
          </a>
        </div>
      </section>

      {/* Intro / specialties / quote */}
      <section
        id="intro"
        className="section-anchor mx-auto max-w-3xl section-pad px-6 sm:px-8"
      >
        <p className="eyebrow">{intro.eyebrow}</p>
        <p className="mt-4 text-lg leading-relaxed text-stone-700 sm:text-xl">
          {intro.bio}
        </p>
        <div className="mt-12">
          <p className="eyebrow">Specialties</p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {intro.specialties.map((item) => (
              <li
                key={item}
                className={
                  item === "Portraits"
                    ? "rounded-full border border-[#5c6b4a]/40 bg-[#5c6b4a]/10 px-4 py-2 text-sm font-medium text-stone-800"
                    : "rounded-full border border-stone-300/70 bg-[#faf7f2] px-4 py-2 text-sm text-stone-700"
                }
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-stone-600 italic">
            {intro.portraitNote}
          </p>
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

      {/* About */}
      <section
        id="about"
        className="section-anchor mx-auto max-w-5xl section-pad px-6 sm:px-8"
      >
        <p className="eyebrow">{about.heading}</p>
        <h2 className="section-title mt-3">Hi, I&apos;m {about.name}</h2>
        <div className="mt-10 grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl shadow-md ring-1 ring-stone-200/60 sm:max-w-sm md:mx-0">
            <Image
              src={about.imageSrc}
              alt={about.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 384px"
            />
          </div>
          <div className="space-y-5 text-base leading-relaxed text-stone-700 sm:text-lg">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        </div>
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
            {pricing.intro}
          </p>
          <div className="mt-12 flex flex-col gap-12">
            {pricingCategories.map((category) => (
              <div key={category.label}>
                <h3 className="font-serif text-xl text-stone-900">
                  {category.label}
                </h3>
                <ul className="mt-5 flex flex-col gap-5">
                  {category.packages.map((pkg) => (
                    <li
                      key={pkg.name}
                      className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
                    >
                      <div className="p-6 sm:p-7">
                        <h4 className="font-serif text-lg text-stone-900">
                          {pkg.name}
                        </h4>
                        <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
                          {pkg.description}
                        </p>
                        {pkg.note ? (
                          <p className="mt-3 text-sm text-stone-500">
                            {pkg.note}
                          </p>
                        ) : null}
                      </div>
                      <div className="border-t border-stone-100 bg-stone-50/80 px-6 py-3.5 sm:px-7">
                        <p className="eyebrow !text-[0.65rem]">
                          {pkg.priceFrom.startsWith("$")
                            ? `Starting at ${pkg.priceFrom}`
                            : pkg.priceFrom}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public work gallery */}
      <section
        id="work"
        className="section-anchor bg-[#e8dfd0]/50 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <p className="eyebrow">{portfolio.eyebrow}</p>
          <h2 className="section-title mt-3">{portfolio.heading}</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600">
            {portfolio.body}
          </p>
          <div className="mt-12">
            <GalleryGrid />
          </div>
        </div>
      </section>

      {/* Contact / book */}
      <section
        id="contact"
        className="section-anchor border-t border-stone-200/60 bg-[#f5f0e8] px-6 py-24 text-center sm:px-8 md:py-28"
      >
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">{contact.eyebrow}</p>
          <h2 className="section-title mt-3">{contact.heading}</h2>
          <p className="mx-auto mt-5 text-base leading-relaxed text-stone-600">
            {contact.body}
          </p>
          <a href={contact.mailtoHref} className="btn-primary mt-10">
            {bookCta.label}
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
