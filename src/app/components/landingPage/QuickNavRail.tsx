"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgePercent, Clock, PackageCheck, Store, Tag, LucideIcon } from "lucide-react";
import { isRequestCancelled, searchProducts } from "@/src/services/buyer/searchService";
import { SearchParams } from "@/src/types/buyer/search";

interface RailLink {
  label: string;
  href: string;
  Icon: LucideIcon;
  /** Search that picks the real product photo shown for this shortcut (omit to use `image`). */
  photoOf?: SearchParams;
  image?: string;
}

const ITEMS: RailLink[] = [
  { label: "New", href: "/search?sort=newest", Icon: Clock, photoOf: { sort: "newest" } },
  { label: "In stock", href: "/search?inStockOnly=true", Icon: PackageCheck, photoOf: { inStockOnly: true, sort: "newest" } },
  { label: "Lowest price", href: "/search?sort=price_asc", Icon: Tag, photoOf: { sort: "price_asc" } },
  { label: "Deals", href: "/search?sort=price_asc&inStockOnly=true", Icon: BadgePercent, photoOf: { sort: "price_asc", inStockOnly: true } },
  { label: "Sell with us", href: "/seller_7a3b9f2c", Icon: Store },
];

/**
 * Narrow left rail of shortcuts (desktop only), sticky below the two-row header. Each shortcut shows a real
 * product photo from the catalog; the icon is the fallback until it loads or when none exists.
 * Different shortcuts pick different products so the rail does not repeat one picture.
 */
export default function QuickNavRail() {
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    const controller = new AbortController();
    const used = new Set<string>();
    (async () => {
      // Sequential on purpose: each shortcut skips photos an earlier one already took.
      for (const item of ITEMS) {
        if (!item.photoOf) continue;
        try {
          const page = await searchProducts({ ...item.photoOf, page: 0, size: 10 }, controller.signal);
          const pick = page.results.find((r) => r.imageUrl && !used.has(r.imageUrl))?.imageUrl;
          if (pick) {
            used.add(pick);
            setPhotos((prev) => ({ ...prev, [item.label]: pick }));
          }
        } catch (err) {
          if (isRequestCancelled(err)) return;
        }
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <nav
      aria-label="Quick links"
      className="sticky top-40 hidden w-[92px] shrink-0 self-start rounded-2xl border border-gray-200 bg-white py-2 shadow-sm lg:block"
    >
      <ul className="flex flex-col">
        {ITEMS.map(({ label, href, Icon, image }) => {
          const photo = image ?? photos[label];
          return (
            <li key={label}>
              <Link
                href={href}
                className="group flex flex-col items-center gap-1.5 px-1 py-2.5 text-center text-[11px] font-semibold text-gray-600 transition-colors hover:text-primary-800"
              >
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-primary-800 ring-1 ring-gray-100 transition-shadow group-hover:ring-primary-300">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain p-1"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Icon size={22} aria-hidden="true" />
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
