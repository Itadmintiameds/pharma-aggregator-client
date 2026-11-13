"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import ProductCard from "@/src/app/components/landingPage/ProductCard";
import CatalogFilterSidebar from "@/src/app/buyer_e8d45a1b/dashboard/components/CatalogFilterSidebar";
import SortDropdown, { SortOption } from "@/src/app/buyer_e8d45a1b/dashboard/components/SortDropdown";
import {
  isRequestCancelled,
  searchProducts,
  searchResultToBuyerProduct,
} from "@/src/services/buyer/searchService";
import { SearchFacet, SearchParams, SearchResultPage, SearchSort } from "@/src/types/buyer/search";
import { useBuyerLoggedIn } from "@/src/hooks/useBuyerLoggedIn";
import { STOREFRONT_CATEGORIES } from "@/src/utils/storefrontCategories";

const PAGE_SIZE = 24;
// The API rejects page * size > 10,000, so deeper pages are never offered (the buyer narrows the search instead).
const MAX_RESULT_WINDOW = 10_000;
const MAX_PAGE_INDEX = Math.floor(MAX_RESULT_WINDOW / PAGE_SIZE);

const SORT_OPTIONS: { value: SearchSort; label: string; hint: string }[] = [
  { value: "relevance", label: "Relevance", hint: "Best match for your search" },
  { value: "price_asc", label: "Price: low to high", hint: "Cheapest first" },
  { value: "price_desc", label: "Price: high to low", hint: "Most expensive first" },
  { value: "newest", label: "Newest", hint: "Recently listed products" },
];

// Facet groups shown in the sidebar: which facet, what to call it, and which URL/API parameter it filters.
const FACET_GROUPS: { field: string; label: string; param: keyof SearchParams }[] = [
  { field: "therapeuticCategory", label: "Therapeutic area", param: "therapeuticCategory" },
  { field: "dosageForm", label: "Dosage form", param: "dosageForm" },
  { field: "packType", label: "Pack type", param: "packType" },
  { field: "manufacturerName", label: "Manufacturer", param: "manufacturerName" },
];

/** Everything the page's state lives in is the URL, so searches are shareable and the back button works. */
interface UrlState {
  q: string;
  categoryId: string;
  therapeuticCategory: string;
  dosageForm: string;
  packType: string;
  manufacturerName: string;
  priceMin: string;
  priceMax: string;
  inStockOnly: boolean;
  sort: SearchSort;
  /** 1-based, as shown to the buyer. */
  page: number;
}

function readUrlState(params: URLSearchParams): UrlState {
  const sort = params.get("sort") as SearchSort | null;
  const q = params.get("q") ?? "";
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  return {
    q,
    categoryId: params.get("categoryId") ?? "",
    therapeuticCategory: params.get("therapeuticCategory") ?? "",
    dosageForm: params.get("dosageForm") ?? "",
    packType: params.get("packType") ?? "",
    manufacturerName: params.get("manufacturerName") ?? "",
    priceMin: params.get("priceMin") ?? "",
    priceMax: params.get("priceMax") ?? "",
    inStockOnly: params.get("inStockOnly") === "true",
    // Without text there is nothing to rank by, so browsing defaults to newest first.
    sort: sort && SORT_OPTIONS.some((o) => o.value === sort) ? sort : q.trim() ? "relevance" : "newest",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, MAX_PAGE_INDEX + 1) : 1,
  };
}

function toApiParams(state: UrlState): SearchParams {
  const min = Number.parseFloat(state.priceMin);
  const max = Number.parseFloat(state.priceMax);
  return {
    q: state.q.trim() || undefined,
    categoryId: state.categoryId || undefined,
    therapeuticCategory: state.therapeuticCategory || undefined,
    dosageForm: state.dosageForm || undefined,
    packType: state.packType || undefined,
    manufacturerName: state.manufacturerName || undefined,
    priceMin: Number.isFinite(min) ? min : undefined,
    priceMax: Number.isFinite(max) ? max : undefined,
    inStockOnly: state.inStockOnly || undefined,
    sort: state.sort,
    page: state.page - 1,
    size: PAGE_SIZE,
  };
}

export default function SearchResultsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const loggedIn = useBuyerLoggedIn();
  // Prices are hidden from visitors who are not logged in (the cards blur them), so price filtering and price
  // sorting must not work for them either - otherwise they would reveal what the page hides. A price range or
  // price sort arriving in the URL is ignored until the buyer logs in.
  const state = useMemo(() => {
    const parsed = readUrlState(new URLSearchParams(queryString));
    if (loggedIn) return parsed;
    const priceSort = parsed.sort === "price_asc" || parsed.sort === "price_desc";
    return {
      ...parsed,
      priceMin: "",
      priceMax: "",
      sort: priceSort ? (parsed.q.trim() ? "relevance" : "newest") : parsed.sort,
    } as UrlState;
  }, [queryString, loggedIn]);

  // The last completed request, tagged with the request it answered. "Loading" is derived (the URL has moved on
  // from the last answer), which also lets the previous results stay visible, dimmed, while a new page loads.
  const [retryKey, setRetryKey] = useState(0);
  const requestKey = `${queryString}#${retryKey}`;
  const [result, setResult] = useState<{ key: string; data: SearchResultPage | null; error: string }>({
    key: "",
    data: null,
    error: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // One request per URL change; a newer navigation cancels the one still in flight.
  useEffect(() => {
    const controller = new AbortController();
    searchProducts(toApiParams(state), controller.signal)
      .then((data) => setResult({ key: requestKey, data, error: "" }))
      .catch((err) => {
        if (isRequestCancelled(err)) return;
        setResult((previous) => ({
          key: requestKey,
          data: previous.data,
          error: err instanceof Error ? err.message : "Search is unavailable right now. Please try again.",
        }));
      });
    return () => controller.abort();
  }, [state, requestKey]);

  const loading = result.key !== requestKey;
  const data = result.data;
  const error = loading ? "" : result.error;

  /** Writes a change into the URL. Any filter/sort change returns to page 1; only paging keeps the page. */
  const update = useCallback(
    (patch: Partial<UrlState>, keepPage = false) => {
      const next: UrlState = { ...state, ...patch, page: keepPage ? patch.page ?? state.page : 1 };
      const params = new URLSearchParams();
      if (next.q.trim()) params.set("q", next.q.trim());
      if (next.categoryId) params.set("categoryId", next.categoryId);
      if (next.therapeuticCategory) params.set("therapeuticCategory", next.therapeuticCategory);
      if (next.dosageForm) params.set("dosageForm", next.dosageForm);
      if (next.packType) params.set("packType", next.packType);
      if (next.manufacturerName) params.set("manufacturerName", next.manufacturerName);
      if (next.priceMin) params.set("priceMin", next.priceMin);
      if (next.priceMax) params.set("priceMax", next.priceMax);
      if (next.inStockOnly) params.set("inStockOnly", "true");
      if (next.sort !== (next.q.trim() ? "relevance" : "newest")) params.set("sort", next.sort);
      if (next.page > 1) params.set("page", String(next.page));
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [state, router, pathname]
  );

  const facetByField = useMemo(() => {
    const map = new Map<string, SearchFacet>();
    (data?.facets ?? []).forEach((facet) => map.set(facet.field, facet));
    return map;
  }, [data]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    facetByField.get("categoryName")?.values.forEach((v) => counts.set(v.value, v.count));
    return counts;
  }, [facetByField]);

  const activeFilters: { key: string; label: string; clear: Partial<UrlState> }[] = [];
  if (state.categoryId) {
    const name = STOREFRONT_CATEGORIES.find((c) => String(c.id) === state.categoryId)?.name ?? "Category";
    activeFilters.push({ key: "category", label: name, clear: { categoryId: "" } });
  }
  FACET_GROUPS.forEach((group) => {
    const value = state[group.param as keyof UrlState] as string;
    if (value) activeFilters.push({ key: group.field, label: `${group.label}: ${value}`, clear: { [group.param]: "" } });
  });
  if (state.priceMin || state.priceMax) {
    activeFilters.push({
      key: "price",
      label: `Price: ${state.priceMin ? `₹${state.priceMin}` : "any"} – ${state.priceMax ? `₹${state.priceMax}` : "any"}`,
      clear: { priceMin: "", priceMax: "" },
    });
  }
  if (state.inStockOnly) activeFilters.push({ key: "stock", label: "In stock only", clear: { inStockOnly: false } });

  const clearAll = () => update({
    categoryId: "", therapeuticCategory: "", dosageForm: "", packType: "", manufacturerName: "",
    priceMin: "", priceMax: "", inStockOnly: false,
  });

  const totalPages = data ? Math.min(data.totalPages, MAX_PAGE_INDEX + 1) : 0;
  const cappedResults = data !== null && data.totalPages > MAX_PAGE_INDEX + 1;

  // Prices are hidden from visitors who are not logged in, so price sorting is not offered to them either.
  const sortOptions: SortOption[] = SORT_OPTIONS.map((option) => {
    const needsLogin = !loggedIn && (option.value === "price_asc" || option.value === "price_desc");
    return { ...option, disabled: needsLogin, hint: needsLogin ? "Log in to sort by price" : option.hint };
  });
  // The sidebar counts its own filters; "in stock" is a switch next to the sort.
  const sidebarActiveCount = activeFilters.filter((f) => f.key !== "stock").length;

  const sidebar = (
    <CatalogFilterSidebar
      filters={state}
      facetByField={facetByField}
      categoryCounts={categoryCounts}
      activeCount={sidebarActiveCount}
      onChange={(patch) => update(patch)}
      onClear={() =>
        update({ categoryId: "", therapeuticCategory: "", dosageForm: "", packType: "", manufacturerName: "", priceMin: "", priceMax: "" })
      }
      priceLocked={!loggedIn}
      // this page sits under the site's taller fixed header
      stickyClassName="lg:top-40 lg:max-h-[calc(100vh-11rem)]"
    />
  );

  return (
    <>
      <LandingHeader searchQuery={state.q} />
      <main className="pt-38 min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h1 className="text-h5 font-heading font-semibold text-neutral-900">
                {state.q.trim() ? <>Results for “{state.q.trim()}”</> : "All products"}
              </h1>
              {data && !loading && (
                <p className="text-sm text-neutral-500 mt-0.5">
                  {data.totalResults.toLocaleString("en-IN")} {data.totalResults === 1 ? "product" : "products"}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                type="button"
                role="switch"
                aria-checked={state.inStockOnly}
                onClick={() => update({ inStockOnly: !state.inStockOnly })}
                className="flex items-center gap-2 text-sm font-medium text-neutral-700"
              >
                <span className={`relative h-6 w-11 rounded-full transition-colors ${state.inStockOnly ? "bg-primary-800" : "bg-neutral-300"}`}>
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      state.inStockOnly ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </span>
                In stock only
              </button>

              <span className="hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />

              <SortDropdown value={state.sort} options={sortOptions} onChange={(value) => update({ sort: value as SearchSort })} />

              <button
                type="button"
                onClick={() => setShowFilters((open) => !open)}
                aria-expanded={showFilters}
                className="flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-800 shadow-sm lg:hidden"
              >
                <SlidersHorizontal size={16} />
                {showFilters ? "Hide filters" : "Filters"}
                {sidebarActiveCount > 0 && (
                  <span className="rounded-full bg-primary-900 px-1.5 text-xs font-semibold text-white">{sidebarActiveCount}</span>
                )}
              </button>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => update(filter.clear)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-50 text-primary-800 text-xs px-3 py-1 hover:bg-primary-100"
                  aria-label={`Remove filter ${filter.label}`}
                >
                  {filter.label} <span aria-hidden>×</span>
                </button>
              ))}
              <button onClick={clearAll} className="text-xs text-neutral-500 underline hover:text-neutral-800">
                Clear all
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-72 shrink-0`}>{sidebar}</aside>

            <section className="flex-1 min-w-0">
              {loading && !data && <p className="text-neutral-500">Searching…</p>}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p>{error}</p>
                  <button onClick={() => setRetryKey((key) => key + 1)} className="mt-2 underline">
                    Try again
                  </button>
                </div>
              )}

              {!error && data && data.results.length === 0 && !loading && (
                <div className="rounded-2xl bg-white shadow-sm p-10 text-center">
                  <p className="text-neutral-800 font-medium">No products found</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {activeFilters.length > 0
                      ? "Try removing a filter, or check the spelling of your search."
                      : "Check the spelling, or try a brand, molecule or therapeutic area."}
                  </p>
                  {activeFilters.length > 0 && (
                    <button onClick={clearAll} className="mt-4 text-sm text-primary-800 underline">
                      Clear all filters
                    </button>
                  )}
                </div>
              )}

              {data && data.results.length > 0 && (
                <div className={`transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data.results.map((result, index) => (
                      <ProductCard
                        key={result.productId}
                        product={searchResultToBuyerProduct(result)}
                        // which search showed this product and at what rank, for the search analytics
                        searchContext={
                          data.searchId
                            ? { searchId: data.searchId, position: (state.page - 1) * PAGE_SIZE + index }
                            : undefined
                        }
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <Pagination
                      page={state.page}
                      totalPages={totalPages}
                      onChange={(page) => {
                        update({ page }, true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  )}
                  {cappedResults && (
                    <p className="mt-3 text-center text-xs text-neutral-500">
                      Only the first {MAX_RESULT_WINDOW.toLocaleString("en-IN")} results can be paged through — use
                      filters or a more specific search to narrow them down.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  // current page, its neighbours, and first/last, with gaps collapsed
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const visible = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-md text-sm border border-neutral-300 disabled:opacity-40"
      >
        Previous
      </button>
      {visible.map((p, index) => (
        <span key={p} className="flex items-center gap-1">
          {index > 0 && p - visible[index - 1] > 1 && <span className="px-1 text-neutral-400">…</span>}
          <button
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`min-w-9 px-3 py-1.5 rounded-md text-sm border ${
              p === page
                ? "bg-primary-800 border-primary-800 text-white"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-md text-sm border border-neutral-300 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
