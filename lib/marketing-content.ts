export const site = {
  name: "Photography by Piv",
  tagline: "Wedding, portrait & family photography · Tremonton, Utah",
} as const;

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Portfolio", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Pricing", href: "#pricing" },
  { label: "Book", href: "#contact" },
] as const;

export const intro = {
  bio: "I photograph the moments that matter—quiet glances, loud laughter, and everything in between. Based in Tremonton, Utah, I work with couples, families, and individuals who want timeless images they will love for years.",
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
    text: "Photos remind us that the best chapters of our lives are the ones we lived together.",
    attribution: "",
  },
} as const;

/** Public marketing portfolio only — add files under public/images/ */
export const workPhotos = [
  {
    src: "/images/hero.jpg",
    alt: "Outdoor wedding photography in golden light",
    title: "Weddings",
    subtitle: "Ceremony, portraits & celebration",
  },
  {
    src: "/images/hero.jpg",
    alt: "Couple photography session",
    title: "Couples",
    subtitle: "Engagements & anniversaries",
  },
  {
    src: "/images/hero.jpg",
    alt: "Family photography session",
    title: "Families",
    subtitle: "At home or on location",
  },
] as const;

export const about = {
  heading: "About",
  name: "Piv",
  body: "I believe every session should feel relaxed and personal. Whether it is your wedding day or a simple portrait at home, my goal is to guide you gently, capture honest emotion, and deliver a gallery you are proud to share.",
} as const;

export const pricingPackages = [
  {
    name: "Timeless Wedding Collection",
    description:
      "Engagement session, bridal portraits, and six hours of wedding day coverage—ideal if you want cohesive images from first look through reception.",
    priceFrom: "$1,750",
    note: "Additional coverage available",
  },
  {
    name: "Romantic Wedding Collection",
    description:
      "Choose either an engagement or bridal session, plus six hours on your wedding day. A thoughtful option when you want one pre-wedding session without both.",
    priceFrom: "$1,500",
    note: "Additional coverage available",
  },
  {
    name: "Portrait Session",
    description:
      "One hour on location, up to two outfits, and a curated set of edited digital images ready to print or share.",
    priceFrom: "$150",
  },
] as const;

export const contact = {
  heading: "Let's connect",
  body: "Tell me about your session, date, and vision. I will reply with availability and next steps—usually within one to two business days.",
  ctaLabel: "Request a session",
  ctaHref: "mailto:hello@photographybypiv.com?subject=Session%20inquiry",
} as const;
