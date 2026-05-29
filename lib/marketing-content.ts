export const site = {
  name: "Photography by Piv",
  tagline: "Timeless photographer · Tremonton, Utah",
} as const;

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Pricing", href: "#pricing" },
  { label: "Book", href: "#contact" },
] as const;

export const intro = {
  bio: "Utah photographer capturing weddings, couples, families, and individual sessions. I create beautiful memories and freeze emotions in time.",
  specialties: [
    "Weddings",
    "Couples",
    "Family",
    "Maternity",
    "Newborn",
    "Portrait",
    "Graduation",
  ],
  quote: {
    text: "Photography is the story I fail to put into words.",
    attribution: "— Destin Sparks",
  },
} as const;

/** Public marketing portfolio only — add files under public/images/ */
export const workPhotos = [
  {
    src: "/images/hero.jpg",
    alt: "Sample wedding photography",
    title: "Weddings",
  },
  {
    src: "/images/hero.jpg",
    alt: "Sample couple photography",
    title: "Couples",
  },
  {
    src: "/images/hero.jpg",
    alt: "Sample family photography",
    title: "Family",
  },
] as const;

export const about = {
  heading: "Meet the photographer",
  name: "Piv",
  body: "I am your photographer ready to capture your most memorable moments. Based in Tremonton, Utah, I love everything photography has to offer. My goal is to deliver timeless images you will cherish for years.",
} as const;

export const pricingPackages = [
  {
    name: "Timeless Wedding Package",
    description:
      "Engagements, bridals, and 6 hours of wedding day coverage. A great choice if you need photos for invitations, centerpiece portraits, and full wedding day coverage.",
    priceFrom: "$1,750",
    note: "Additional hour(s) $200",
  },
  {
    name: "Romantic Wedding Package",
    description:
      "Engagements or bridals plus 6 hours of wedding day coverage — for couples who want one session type without both.",
    priceFrom: "$1,500",
    note: "Additional hour(s) $200",
  },
  {
    name: "Portraits Full Session",
    description:
      "One hour session, 1–2 outfits, and 100–150 edited photos delivered.",
    priceFrom: "$150",
  },
] as const;

export const contact = {
  heading: "Book a session",
  body: "Ready to get in front of the camera? Send a request and we will follow up with availability and next steps.",
  ctaLabel: "Book with me",
  ctaHref: "mailto:hello@photographybypiv.com?subject=Booking%20request",
} as const;
