function marketingSrc(filename: string): string {
  return `/images/marketing/${filename}`;
}

type PortfolioPhoto = { src: string; alt: string };

function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const site = {
  name: "Photography by Piv",
  tagline: "Wedding, couple, & portrait photographer · Tremonton, Utah",
  heroSubline: "CREATIVE, TIMELESS, GOLDEN",
  /**
   * Default hero (for now): B44A4109 — birthday-pics-olivia gallery.
   * below-nav + object-cover @ 50% 36%. Swap via heroImageAlternate* fields.
   */
  heroImage: marketingSrc("B44A4109.jpg"),
  heroImageCrop: "object-cover object-[50%_36%]",
  heroImageLayout: "below-nav" as "full" | "below-nav",
  /** Alternate — swap src, crop, and layout together when comparing */
  heroImageAlternate: marketingSrc("B44A4018.jpg"),
  heroImageAlternateCrop: "object-cover object-[50%_36%]",
  heroImageAlternateLayout: "below-nav",
  heroImageAlternate2: marketingSrc("photograhybypiv-90.jpg"),
  heroImageAlternate2Crop: "object-cover object-[50%_36%]",
  heroImageAlternate2Layout: "below-nav",
  heroImageAlternate3: marketingSrc("B44A1185.jpg"),
  heroImageAlternate3Crop: "object-cover object-top",
  heroImageAlternate3Layout: "below-nav",
  heroImageAlternate4: marketingSrc("photograhybypiv-94.jpg"),
  heroImageAlternate4Crop: "object-contain",
  heroImageAlternate4Layout: "below-nav",
  heroImageAlternate5: marketingSrc("B44A1337.jpg"),
  heroImageAlternate5Crop: "object-contain",
  heroImageAlternate5Layout: "full",
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
  bio: "Photography is my way of creating art and sharing it with those around me. I enjoy meeting new people and am ready to capture you and your loved ones! My goal is for you to feel comfortable, confident, and seen during a photography session with me.",
  quote: {
    text: "Love the way the camera sees you.",
    attribution: "Photography by Piv",
  },
} as const;

export const specialtyCards = [
  {
    src: marketingSrc("photograhybypiv-241.jpg"),
    alt: "Wedding photography",
    title: "Weddings",
    subtitle: "Ceremony, reception, and all the details in between",
  },
  {
    src: marketingSrc("photograhybypiv-168.jpg"),
    alt: "Couple photography session",
    title: "Couples",
    subtitle: "Anniversaries, engagements, and just-because photos",
  },
  {
    src: marketingSrc("photograhybypiv-22.jpg"),
    alt: "Portrait photography session",
    title: "Portraits",
    subtitle: "Individual, birthdays, and creative styled sessions",
  },
  {
    src: marketingSrc("B44A6929.jpg"),
    alt: "Family photography session",
    title: "Families",
    subtitle: "Newborn, family photos, and milestones",
  },
] as const;

const portfolioPhotoAlt = "Portfolio photograph";

const portfolioPhotosBase: PortfolioPhoto[] = [
  { src: marketingSrc("B44A5783.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("photograhybypiv-9.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A2053.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("IMG_7652.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A5589.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("IMG_4102.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("IMG_3610.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A7380.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A5982.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("photograhybypiv-157.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("photograhybypiv-227.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A0827.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A0946.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A1300.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("photograhybypiv-2.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A8369.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A0842-Edit.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A0143.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A0050-Edit.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A2032.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A1940.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A1327.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("photograhybypiv-10.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("photograhybypiv-92.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("IMG_4503.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A7012-2.jpg"), alt: portfolioPhotoAlt },
  { src: marketingSrc("B44A6138-Edit.jpg"), alt: portfolioPhotoAlt },
];

/** Shuffled display order; 8th slide (photograhybypiv-157) leads the carousel */
const portfolioPhotosShuffled = shuffleWithSeed(portfolioPhotosBase, 0x5071_2026);
const portfolioLead = portfolioPhotosShuffled[7];
export const portfolioPhotos: readonly PortfolioPhoto[] = [
  portfolioLead,
  ...portfolioPhotosShuffled.filter((_, index) => index !== 7),
];

export const portfolio = {
  eyebrow: "Portfolio",
  heading: "A glimpse of my work",
} as const;

export const about = {
  heading: "About Me",
  name: "Piv",
  imageSrc: marketingSrc("IMG_7732.jpg"),
  /** 4:5 frame + object-cover, anchored to the bottom so none of the waist/camera is clipped. */
  imageCrop: "object-cover object-bottom",
  imageAlt: "Piv, photographer based in Northern Utah",
  paragraphs: [
    "Hi, I'm Piv! I'm a photographer based in Northern Utah. I love capturing memories for the people around me, and I love meeting new people through photography.",
    "Photography helps me be more creative, and I've also had lots of practice in front of the camera myself. When I'm not creating with photography, I spend my time with music, writing, and reading.",
    "Another fun fact: Piv has been a nickname of mine since I was little. I honestly hated it at first, but it stuck!",
    "Whether you call me Piv, Liv, or Olivia, I'm your girl for professional photos. Don't hesitate to reach out with any questions or booking ideas!",
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
  categoryNote?: string;
}> = [
  {
    label: "Weddings",
    packages: [
      {
        name: "Timeless Wedding Package",
        description:
          "BAM!! The Timeless Package gives you the whole shaBAM! It includes engagements, bridals, and 6 hours of wedding day coverage. It's a great choice if you need engagement photos for invitations, bridals for centerpiece pictures, and wedding day coverage to look back on years from now with your partner.",
        priceFrom: "$1,750",
      },
      {
        name: "Romantic Wedding Package",
        description:
          "Engagements? Bridals? Want one of those options without the other, plus wedding day coverage? The Romantic Package is a great choice. It includes either engagements or bridals, plus 6 hours of wedding day coverage. Not every couple needs both—it just depends on what fits your needs.",
        priceFrom: "$1,500",
      },
      {
        name: "Dreamy Wedding Package",
        description:
          "If you only need wedding day coverage, the Dreamy Package is perfect for your special day. It includes 6 hours of wedding day coverage. I'll capture the little details, ceremony, guests, reception, and so many more moments from your day.",
        priceFrom: "$1,250",
      },
    ],
    categoryNote:
      "Need more time? Additional wedding coverage is available at $200/hour.",
  },
  {
    label: "Sessions",
    packages: [
      {
        name: "Family Session - 1 Hour",
        description:
          "I know family photos can get a little wild, and that's okay! This session is one location for a full hour. The starting price covers a 3-4 person family. Larger families are always welcome - additional people are $25 per extra person. See the notes below for travel and studio details.",
        priceFrom: "$250",
      },
      {
        name: "Portraits Session - 1 Hour",
        description:
          "Perfect if you need branding photos, portraits, or even a little confidence photoshoot! This 1 hour session includes 1-2 outfits, whether you're a senior graduating or just want extra outfits for two different looks. It includes 1 location anywhere you'd like, and if you don't know where to go, I'll help you choose.",
        priceFrom: "$150",
      },
      {
        name: "Couples Session - 1 Hour",
        description:
          "A full couples session could be exactly what you need. One hour gives us time to capture the little details of your relationship and the love you two share. There is an opportunity for 2 outfits for you and your lover, plus a beautiful location.",
        priceFrom: "$200",
      },
    ],
  },
  {
    label: "Events",
    packages: [
      {
        name: "Big Events",
        description:
          "Anything other than a wedding falls under this category, such as company events, birthday parties, conferences, galas, and more. With big events like these, it's important to capture the necessities: who attends, timeless memories with friends and family, and social media marketing for those special events. For 3 hours, I'll capture details like party guests, table centerpieces, candid moments, speeches, and more. Must be an event with 50+ people to be considered a big event.",
        priceFrom: "$750",
      },
    ],
  },
] as const;

export const pricingAdditionalInfo = {
  heading: "Additional Info",
  items: [
    "I also offer 30-minute sessions. If you're interested, reach out and we can talk about what works best for your needs.",
    "Additional wedding coverage is $200/hour.",
    "Family sessions include 3-4 people. Additional people are $25 per extra person.",
    "A variable travel fee applies if the session location is more than 25 miles from Tremonton, Utah.",
    "Indoor studios require a booking fee depending on the studio and how long it is reserved. The client is responsible for the studio booking fee.",
  ],
} as const;

export const pricing = {
  intro:
    "Every session is a little different, and these packages are a starting point. Take a look through the options below, and be sure to check the notes at the bottom for travel, studio fees, extra coverage, and smaller session options.",
} as const;

/** Public copy only — do not put the business email address in this file. */
export const contact = {
  eyebrow: "Request to Book",
  heading: "Ready to book?",
  body: "Use the Request to Book form to share your session, date, and vision. I will reply with availability and next steps—usually within one to two business days.",
} as const;
