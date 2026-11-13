"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import {
  isRequestCancelled,
  searchProducts,
  searchResultToBuyerProduct,
} from "@/src/services/buyer/searchService";
import { BuyerProduct } from "@/src/types/buyer/product";
import { SearchResultPage } from "@/src/types/buyer/search";
import { SearchContext } from "@/src/services/buyer/searchEvents";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

const PAGE_SIZE = 12;
// The search API rejects page * size > 10,000, so the list stops there instead of asking for a page it would refuse.
const MAX_RESULT_WINDOW = 10_000;
const LOAD_ERROR = "Failed to load products. Please try again later.";

const listingParams = (page: number) => ({ sort: "newest" as const, page, size: PAGE_SIZE });

/**
 * Storefront default listing: the newest buyable products from the search service, loaded as the visitor scrolls
 * (infinite scroll): when the end of the list comes within view a loading bar shows and the next page is fetched,
 * with no button to press. Searching or filtering happens on /search, opened from the header search box.
 */
export default function ProductGrid() {
  const [products, setProducts] = useState<BuyerProduct[]>([]);
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  // which search (page) showed each product and at what rank - for the search analytics
  const [contexts, setContexts] = useState<Record<string, SearchContext>>({});
  const [loading, setLoading] = useState(true); // true on first render: the initial load starts in the effect below
  const [error, setError] = useState("");
  const inFlight = useRef<AbortController | null>(null);
  const busy = useRef(false); // guards against the observer firing twice before the state update lands
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const applyPage = useCallback((pageLoaded: number, result: SearchResultPage) => {
    const mapped = result.results.map(searchResultToBuyerProduct);
    setProducts((previous) => (pageLoaded === 0 ? mapped : [...previous, ...mapped]));
    if (result.searchId) {
      const searchId = result.searchId;
      setContexts((previous) => {
        const next = pageLoaded === 0 ? {} : { ...previous };
        result.results.forEach((hit, index) => {
          next[hit.productId] = { searchId, position: pageLoaded * PAGE_SIZE + index };
        });
        return next;
      });
    }
    setPage(pageLoaded);
    setTotalResults(result.totalResults);
  }, []);

  // Initial load.
  useEffect(() => {
    const controller = new AbortController();
    searchProducts(listingParams(0), controller.signal)
      .then((result) => applyPage(0, result))
      .catch((err) => {
        if (!isRequestCancelled(err)) setError(LOAD_ERROR);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [applyPage]);

  // Next page (called by the scroll observer below, and by "Try again" after a failure).
  const loadPage = useCallback(
    (pageToLoad: number) => {
      if (busy.current) return;
      busy.current = true;
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      setLoading(true);
      setError("");
      searchProducts(listingParams(pageToLoad), controller.signal)
        .then((result) => applyPage(pageToLoad, result))
        .catch((err) => {
          if (!isRequestCancelled(err)) setError(LOAD_ERROR);
        })
        .finally(() => {
          busy.current = false;
          if (!controller.signal.aborted) setLoading(false);
        });
    },
    [applyPage]
  );

  const canLoadMore = products.length < totalResults && (page + 1) * PAGE_SIZE <= MAX_RESULT_WINDOW;

  // Infinite scroll: watch an invisible marker below the list; when it comes within ~400px of the viewport, load
  // the next page. The observer is re-created after every load, so if the new page still leaves the marker in
  // view (a tall screen) the following page is fetched straight away. Not armed while loading or after an error,
  // so a failing request is never retried in a loop.
  useEffect(() => {
    const marker = sentinelRef.current;
    if (!marker || !canLoadMore || loading || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadPage(page + 1);
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [canLoadMore, loading, error, page, loadPage, products.length]);

  return (
    <div className="py-14 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Products</h2>
            <p className="mt-1 text-sm text-gray-500">
              {totalResults > 0
                ? `${totalResults.toLocaleString("en-IN")} products from verified sellers · newest first`
                : "The newest products from verified sellers"}
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-primary-700 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Browse all &amp; filter
          </Link>
        </div>

        {loading && products.length === 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading products">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!loading && error && products.length === 0 && (
          <div className="text-red-500">
            <p>{error}</p>
            <button onClick={() => loadPage(0)} className="mt-2 text-sm underline">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && products.length === 0 && <p className="text-gray-500">No products found.</p>}

        {products.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.productId} product={product} searchContext={contexts[product.productId]} />
              ))}
            </div>

            {/* invisible marker: reaching it triggers the next load */}
            <div ref={sentinelRef} aria-hidden className="h-px" />

            {loading && (
              <div className="mt-10 flex flex-col items-center gap-2" role="status" aria-live="polite">
                <div className="h-1.5 w-56 overflow-hidden rounded-full bg-primary-100">
                  <div className="h-full w-full animate-pulse rounded-full bg-primary-700" />
                </div>
                <span className="text-sm text-gray-500">Loading more products…</span>
              </div>
            )}

            {error && !loading && (
              <p className="mt-10 text-center text-sm text-red-500">
                Couldn&apos;t load more products.{" "}
                <button onClick={() => loadPage(page + 1)} className="underline">
                  Try again
                </button>
              </p>
            )}

            {!canLoadMore && !loading && !error && page > 0 && (
              <p className="mt-10 text-center text-sm text-gray-400">You&apos;ve reached the end of the list.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
