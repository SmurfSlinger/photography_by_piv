export const site = {
  name: "Photography by Piv",
  tagline: "Wedding, portrait & family photography · Tremonton, Utah",
  /** Replace with Piv's own hero tagline or quote when ready */
  heroSubline:
    "Capturing honest moments and the people behind them—one session at a time.",
} as const;

export const bookCta = {
  label: "Request to Book",
  href: "/book",
} as const;

export const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "Portfolio", href: "/#portfolio" },
  { label: "About", href: "/#about" },
  { label: "Pricing", href: "/#pricing" },
  { label: bookCta.label, href: bookCta.href, isPrimary: true },
] as const;

export const bookPage = {
  eyebrow: "Request to Book",
  heading: "Tell me about your session",
  body: "Use this form to share what you are looking for—date, location, and the vibe you have in mind. I will reply with availability and next steps, usually within one to two business days.",
} as const;

export const intro = {
  eyebrow: "Welcome",
  /** Welcome voice: love of photography, meeting people, personality */
  bio: "Photography is how I connect—with light, with story, and especially with people. I love meeting new faces, hearing what matters to you, and creating a space where you can simply be yourself. Whether it is a quiet portrait or a full wedding day, my goal is to make you feel seen, celebrated, and at ease in front of the camera.",
  /** Replace with Piv's own words when ready */
  quote: {
    text: "You don't take a photograph, you make it.",
    attribution: "— Ansel Adams",
  },
} as const;

/** Specialty tiles — swap src paths when Piv adds approved images under public/images/ */
export const specialtyCards = [
  {
    src: "/images/hero.jpg",
    alt: "Wedding photography in golden light",
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
  {
    src: "/images/hero.jpg",
    alt: "Portrait photography session",
    title: "Portraits",
    subtitle: "Individual, couple & creative sessions",
  },
] as const;

/** Portfolio carousel — image only (no on-slide captions) */
export const portfolioPhotos = [
  {
    src: "/images/hero.jpg",
    alt: "Sample portfolio photograph one",
  },
  {
    src: "/images/hero.jpg",
    alt: "Sample portfolio photograph two",
  },
  {
    src: "/images/hero.jpg",
    alt: "Sample portfolio photograph three",
  },
  {
    src: "/images/hero.jpg",
    alt: "Sample portfolio photograph four",
  },
] as const;

export const portfolio = {
  eyebrow: "Portfolio",
  heading: "A glimpse of my work",
  body: "Browse a few favorite frames. Use the arrows or swipe on mobile to see more.",
} as const;

export const about = {
  heading: "About Me",
  name: "Piv",
  imageSrc: "/images/hero.jpg",
  imageAlt: "Piv, photographer based in Tremonton, Utah",
  /** Replace bracketed placeholders with Piv's final wording */
  paragraphs: [
    "Hi, I'm Piv—a photographer based in Tremonton, Utah. I grew up in [your hometown / region], and that sense of home still shapes how I see people and places through my lens.",
    "When I'm not behind the camera, you'll find me [hobbies and interests—e.g. hiking, baking, time with family]. Those little joys keep me grounded and remind me why the everyday moments are worth remembering.",
    "At my core, I'm [a few words about who you are—warm, curious, a good listener, etc.]. I show up for every session ready to meet you where you are and tell your story with honesty and heart.",
  ],
} as const;

export type PricingPackage = {
  name: string;
  description: string;
  priceFrom: string;
  note?: string;
};

export const pricingCategories: ReadonlyArray<{
  label: string;
  packages: readonly PricingPackage[];
}> = [
  {
    label: "Weddings",
    packages: [
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
    ],
  },
  {
    label: "Couples",
    packages: [
      {
        name: "Engagement Session",
        description:
          "On-location session for newly engaged couples—relaxed posing, golden-hour light, and images you'll love for save-the-dates and beyond.",
        priceFrom: "Starting rate TBD",
        note: "Piv will add final pricing",
      },
      {
        name: "Couples / Anniversary Session",
        description:
          "Celebrate your relationship with a session built around your story—engagements, anniversaries, or just because.",
        priceFrom: "Starting rate TBD",
        note: "Piv will add final pricing",
      },
    ],
  },
  {
    label: "Portraits",
    packages: [
      {
        name: "Portrait Session",
        description:
          "One hour on location, up to two outfits, and a curated set of edited digital images ready to print or share.",
        priceFrom: "$150",
      },
      {
        name: "Extended Portrait Session",
        description:
          "More time and flexibility for creative portraits, multiple looks, or a session that goes at an unhurried pace.",
        priceFrom: "Starting rate TBD",
        note: "Piv will add final pricing",
      },
    ],
  },
  {
    label: "Families",
    packages: [
      {
        name: "Family Session",
        description:
          "Relaxed family portraits at home or on location—candid laughs, cozy togetherness, and images you'll want on the wall.",
        priceFrom: "Starting rate TBD",
        note: "Piv will add final pricing",
      },
      {
        name: "Mini Family Session",
        description:
          "A shorter session perfect for updating photos with kids, extended family in town, or a quick seasonal refresh.",
        priceFrom: "Starting rate TBD",
        note: "Piv will add final pricing",
      },
    ],
  },
] as const;

export const pricing = {
  intro:
    "Every session is a little different. These collections are a starting point—reach out and we will tailor something that fits your day and your budget.",
} as const;

/** Public copy only — do not put the business email address in this file. */
export const contact = {
  eyebrow: "Request to Book",
  heading: "Ready to book?",
  body: "Use the Request to Book form to share your session, date, and vision. I will reply with availability and next steps—usually within one to two business days.",
} as const;
