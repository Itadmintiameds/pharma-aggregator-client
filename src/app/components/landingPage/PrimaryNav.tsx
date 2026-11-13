"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Home / About / Contact pill group shared by every public header, with the current page highlighted. */
export default function PrimaryNav({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Primary" className={`flex items-center gap-1 rounded-full bg-neutral-50 p-1 ${className}`}>
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-5 py-2 text-[15px] font-body font-semibold transition-colors ${
              active
                ? "bg-primary-900 text-white shadow-sm"
                : "text-neutral-700 hover:bg-primary-50 hover:text-primary-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
