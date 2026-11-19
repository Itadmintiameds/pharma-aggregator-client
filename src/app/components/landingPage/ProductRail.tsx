"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isRequestCancelled, searchProducts, searchResultToBuyerProduct } from "@/src/services/buyer/searchService";
import { BuyerProduct } from "@/src/types/buyer/product";
import { SearchParams } from "@/src/types/buyer/search";
import { SearchContext } from "@/src/services/buyer/searchEvents";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

const CARD_WIDTH = "w-[148px] sm:w-[164px]";

/** Shell for one titled, horizontally scrolling row of cards (title, View All, arrows, snap scrolling). */
export function RailShell({
  title,
  subtitle,
  viewAllHref,
  children,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  children: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <section className="py-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link href={viewAllHref} className="text-sm font-semibold text-primary-800 no-underline hover:text-primary-600 hover:no-underline">
              View All
            </Link>
          )}
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollBy(-1)}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:border-primary-700 hover:text-primary-700 sm:flex"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollBy(1)}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:border-primary-700 hover:text-primary-700 sm:flex"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={scroller} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}

export function RailItem({ children }: { children: ReactNode }) {
  return <div className={`${CARD_WIDTH} shrink-0 snap-start`}>{children}</div>;
}

export function RailSkeletons({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <RailItem key={i}>
          <ProductCardSkeleton compact />
        </RailItem>
      ))}
    </>
  );
}

interface ProductRailProps {
  title: string;
  subtitle?: string;
  /** Search-service filters/sort that define this row, e.g. { sort: "price_asc", inStockOnly: true }. */
  params: SearchParams;
  size?: number;
}

/** "View All" opens the same filters on the full results page. */
function toSearchHref(params: SearchParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && k !== "page" && k !== "size") qs.set(k, String(v));
  });
  return `/search?${qs.toString()}`;
}

/** One landing-page row of products, loaded from the search service. Hides itself when there is nothing to show. */
export default function ProductRail({ title, subtitle, params, size = 10 }: ProductRailProps) {
  const [products, setProducts] = useState<BuyerProduct[]>([]);
  const [contexts, setContexts] = useState<Record<string, SearchContext>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // Params are a literal at the call site, so key the effect on their serialised form.
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const controller = new AbortController();
    searchProducts({ ...(JSON.parse(paramsKey) as SearchParams), page: 0, size }, controller.signal)
      .then((result) => {
        setProducts(result.results.map(searchResultToBuyerProduct));
        if (result.searchId) {
          const searchId = result.searchId;
          const next: Record<string, SearchContext> = {};
          result.results.forEach((hit, i) => (next[hit.productId] = { searchId, position: i }));
          setContexts(next);
        }
      })
      .catch((err) => {
        if (!isRequestCancelled(err)) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [paramsKey, size]);

  if (!loading && (failed || products.length === 0)) return null;

  return (
    <RailShell title={title} subtitle={subtitle} viewAllHref={toSearchHref(params)}>
      {loading ? (
        <RailSkeletons count={7} />
      ) : (
        products.map((product) => (
          <RailItem key={product.productId}>
            <ProductCard compact product={product} searchContext={contexts[product.productId]} />
          </RailItem>
        ))
      )}
    </RailShell>
  );
}
