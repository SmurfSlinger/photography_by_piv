import Link from "next/link";
import type { ReactNode } from "react";

type AdminNavCardProps = {
  title: string;
  href?: string;
  disabled?: boolean;
  badge?: ReactNode;
};

export default function AdminNavCard({
  title,
  href,
  disabled = false,
  badge,
}: AdminNavCardProps) {
  const inner = (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-serif text-lg text-stone-900">{title}</h2>
      {badge}
    </div>
  );

  const className =
    "block rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm transition sm:p-6 " +
    (disabled
      ? "cursor-not-allowed opacity-70"
      : "hover:border-[#5c6b4a]/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c6b4a]");

  if (disabled || !href) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
