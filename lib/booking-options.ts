import { pricingCategories } from "@/lib/marketing-content";

export const contactMethodOptions = [
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "Other" },
] as const;

export const contactMethodValues = contactMethodOptions.map(
  (option) => option.value
);

export const sessionTypes = [
  { value: "wedding", label: "Wedding" },
  { value: "couples", label: "Couples" },
  { value: "family", label: "Family" },
  { value: "portrait", label: "Portrait" },
  { value: "other", label: "Other" },
] as const;

export const packageInterestOptions = [
  ...pricingCategories.flatMap((category) =>
    category.packages.map((pkg) => ({
      value: `${category.label} — ${pkg.name}`,
      label: `${category.label} — ${pkg.name}`,
    }))
  ),
  { value: "Not sure yet", label: "Not sure yet" },
  { value: "Other / custom package", label: "Other / custom package" },
] as const;

export type ContactMethodValue =
  (typeof contactMethodOptions)[number]["value"];

export type SessionTypeValue = (typeof sessionTypes)[number]["value"];

export const packageInterestValues = packageInterestOptions.map(
  (option) => option.value
);
