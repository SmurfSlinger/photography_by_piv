"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  INQUIRY_PHASES,
  INQUIRY_PHASE_LABELS,
  type InquiryPhase,
} from "@/lib/inquiry-phase";

type Props = {
  activePhase: InquiryPhase | null;
  counts: Record<InquiryPhase | "all", number>;
};

function filterHref(pathname: string, phase: InquiryPhase | null): string {
  if (!phase) return pathname;
  return `${pathname}?status=${phase}`;
}

export default function InquiryStatusFilter({ activePhase, counts }: Props) {
  const pathname = usePathname() ?? "/admin/inquiries";

  const filters: { key: InquiryPhase | "all"; label: string }[] = [
    { key: "all", label: "All" },
    ...INQUIRY_PHASES.map((value) => ({
      key: value,
      label: INQUIRY_PHASE_LABELS[value],
    })),
  ];

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filter inquiries">
      {filters.map(({ key, label }) => {
        const isActive =
          key === "all" ? activePhase === null : activePhase === key;
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
