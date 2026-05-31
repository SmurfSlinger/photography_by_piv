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
      value: `${category.label} - ${pkg.name}`,
      label: `${category.label} - ${pkg.name}`,
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

export const sessionTypeValues = sessionTypes.map((type) => type.value);

export function packageInterestLabel(
  categoryLabel: string,
  packageName: string
): string {
  return `${categoryLabel} - ${packageName}`;
}

export function sessionTypeForPackage(
  categoryLabel: string,
  packageName: string
): SessionTypeValue {
  if (categoryLabel === "Weddings") return "wedding";
  if (categoryLabel === "Events") return "other";
  if (packageName.startsWith("Family")) return "family";
  if (packageName.startsWith("Portraits")) return "portrait";
  if (packageName.startsWith("Couples")) return "couples";
  return "other";
}

export function packageBookHref(
  categoryLabel: string,
  packageName: string
): string {
  const params = new URLSearchParams({
    package: packageInterestLabel(categoryLabel, packageName),
    session: sessionTypeForPackage(categoryLabel, packageName),
  });
  return `/book?${params.toString()}`;
}
