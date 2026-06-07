"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  type InquiryStatusValue,
} from "@/lib/booking-inquiry-admin";

type Props = {
  activeStatus: InquiryStatusValue | null;
  counts: Record<InquiryStatusValue | "all", number>;
};

function filterHref(pathname: string, status: InquiryStatusValue | null): string {
  if (!status) return pathname;
  return `${pathname}?status=${status}`;
}

export default function InquiryStatusFilter({ activeStatus, counts }: Props) {
  const pathname = usePathname();

  const filters: { key: InquiryStatusValue | "all"; label: string }[] = [
    { key: "all", label: "All" },
    ...INQUIRY_STATUSES.map((value) => ({
      key: value,
      label: INQUIRY_STATUS_LABELS[value],
    })),
  ];

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Filter inquiries by status"
    >
      {filters.map(({ key, label }) => {
        const isActive =
          key === "all" ? activeStatus === null : activeStatus === key;
        const count = counts[key];

        return (
          <Link
            key={key}
            href={filterHref(pathname, key === "all" ? null : key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              isActive
                ? "border-[#5c6b4a] bg-[#5c6b4a] text-white"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
            <span className={isActive ? "opacity-80" : "text-stone-400"}>
              {" "}
              ({count})
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
