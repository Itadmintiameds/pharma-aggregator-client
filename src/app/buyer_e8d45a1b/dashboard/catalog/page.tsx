"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import {
  isRequestCancelled,
  searchProducts,
  searchResultToBuyerProduct,
} from "@/src/services/buyer/searchService";
import { AutocompleteSuggestion, SearchFacet, SearchResultPage, SearchSort } from "@/src/types/buyer/search";
import { STOREFRONT_CATEGORIES } from "@/src/utils/storefrontCategories";
import CatalogProductCard from "../components/CatalogProductCard";
import SortDropdown, { SortOption } from "../components/SortDropdown";
import CatalogFilterSidebar, { CatalogFilters, FACET_GROUPS, NO_FILTERS } from "../components/CatalogFilterSidebar";

const PAGE_SIZE = 12;
const MIN_SUGGEST_LENGTH = 2;
const MAX_SUGGEST_LENGTH = 100; // the search API rejects longer queries
// The search API rejects page * size > 10,000.
const MAX_WINDOW = 10000;

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="h-28 animate-pulse bg-neutral-100" />
      <div className="space-y-2.5 p-2.5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-100" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-neutral-100" />
        <div className="h-8 w-full animate-pulse rounded-md bg-neutral-100" />
      </div>
    </div>
  );
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  // current page, its neighbours, and first/last, with gaps collapsed
  const wanted = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const visible = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
      >
        Previous
      </button>
      {visible.map((p, index) => (
        <span key={p} className="flex items-center gap-1">
          {index > 0 && p - visible[index - 1] > 1 && <span className="px-1 text-neutral-400">…</span>}
          <button
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`min-w-9 rounded-lg border px-3 py-1.5 text-sm font-medium ${
              p === page
                ? "border-primary-800 bg-primary-800 text-white"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

export default function BuyerCatalogPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CatalogFilters>(NO_FILTERS);
  const [sort, setSort] = useState<SearchSort | "default">("default");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  // Type-ahead suggestions (product names) under the search box.
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestDebounced = useDebouncedValue(query.trim(), 200);

  useEffect(() => {
    if (suggestDebounced.length < MIN_SUGGEST_LENGTH || suggestDebounced.length > MAX_SUGGEST_LENGTH) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    // Same search as the product list (name, molecule, composition, brand...), so the dropdown
    // lists every product the results below will show — not just names starting with the typed text.
    searchProducts({ q: suggestDebounced, sort: "relevance", page: 0, size: 8 }, controller.signal)
      .then((res) => {
        const seen = new Set<string>();
        const list: AutocompleteSuggestion[] = [];
        for (const item of res.results) {
          const key = item.productName.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          list.push({ suggestion: item.productName, productId: item.productId, categoryName: item.categoryName });
        }
        setSuggestions(list);
        setActiveSuggestion(-1);
      })
      .catch((err) => {
        if (!isRequestCancelled(err)) setSuggestions([]); // suggestions are optional: fail quietly
      });
    return () => controller.abort();
  }, [suggestDebounced]);

  const pickSuggestion = (text: string) => {
    setQuery(text);
    setPage(1);
    setSuggestOpen(false);
    setActiveSuggestion(-1);
  };

  const showSuggestions = suggestOpen && suggestions.length > 0 && query.trim().length >= MIN_SUGGEST_LENGTH;

  const effectiveSort: SearchSort = sort === "default" ? (debouncedQuery ? "relevance" : "newest") : sort;
  const requestKey = JSON.stringify([debouncedQuery, filters, effectiveSort, page]);

  // "Loading" is derived: the filters have moved on from the last answered request.
  const [result, setResult] = useState<{ key: string; data: SearchResultPage | null; error: string }>({
    key: "",
    data: null,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    const min = Number.parseFloat(filters.priceMin);
    const max = Number.parseFloat(filters.priceMax);
    searchProducts(
      {
        q: debouncedQuery || undefined,
        categoryId: filters.categoryId || undefined,
        therapeuticCategory: filters.therapeuticCategory || undefined,
        dosageForm: filters.dosageForm || undefined,
        packType: filters.packType || undefined,
        manufacturerName: filters.manufacturerName || undefined,
        priceMin: Number.isFinite(min) ? min : undefined,
        priceMax: Number.isFinite(max) ? max : undefined,
        inStockOnly: filters.inStockOnly || undefined,
        sort: effectiveSort,
        page: page - 1,
        size: PAGE_SIZE,
      },
      controller.signal
    )
      .then((data) => setResult({ key: requestKey, data, error: "" }))
      .catch((err) => {
        if (isRequestCancelled(err)) return;
        setResult((previous) => ({
          key: requestKey,
          data: previous.data,
          error: err instanceof Error ? err.message : "Could not load products. Please try again.",
        }));
      });
    return () => controller.abort();
  }, [debouncedQuery, filters, effectiveSort, page, requestKey]);

  const loading = result.key !== requestKey;
  const data = result.data;
  const error = loading ? "" : result.error;
  const totalPages = data ? Math.min(data.totalPages, Math.floor(MAX_WINDOW / PAGE_SIZE)) : 0;

  const sortOptions: SortOption[] = [
    debouncedQuery
      ? { value: "default", label: "Best match", hint: "Most relevant to your search" }
      : { value: "default", label: "Newest first", hint: "Recently listed products" },
    ...(debouncedQuery ? [{ value: "newest", label: "Newest first", hint: "Recently listed products" }] : []),
    { value: "price_asc", label: "Price: low to high", hint: "Cheapest first" },
    { value: "price_desc", label: "Price: high to low", hint: "Most expensive first" },
    { value: "bestselling", label: "Most selling", hint: "Most units sold recently" },
    { value: "fastest_delivery", label: "Fastest delivery", hint: "Sellers who deliver quickest" },
    { value: "fastest_approval", label: "Fastest approval", hint: "Sellers who approve orders quickest" },
  ];

  /** Any filter change returns to page 1. */
  const updateFilters = (patch: Partial<CatalogFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPage(1);
  };

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

  const activeFilters: { key: string; label: string; clear: Partial<CatalogFilters> }[] = [];
  if (filters.categoryId) {
    const name = STOREFRONT_CATEGORIES.find((c) => String(c.id) === filters.categoryId)?.name ?? "Category";
    activeFilters.push({ key: "category", label: name, clear: { categoryId: "" } });
  }
  FACET_GROUPS.forEach((group) => {
    const value = filters[group.field];
    if (value) activeFilters.push({ key: group.field, label: `${group.label}: ${value}`, clear: { [group.field]: "" } });
  });
  if (filters.priceMin || filters.priceMax) {
    activeFilters.push({
      key: "price",
      label: `Price: ${filters.priceMin ? `₹${filters.priceMin}` : "any"} – ${filters.priceMax ? `₹${filters.priceMax}` : "any"}`,
      clear: { priceMin: "", priceMax: "" },
    });
  }
  if (filters.inStockOnly) activeFilters.push({ key: "stock", label: "In stock only", clear: { inStockOnly: false } });
  // The sidebar counts its own filters; "in stock" is a switch in the toolbar.
  const sidebarActiveCount = activeFilters.filter((f) => f.key !== "stock").length;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-heading font-bold text-neutral-900">Browse Catalog</h2>
        <p className="mt-0.5 text-xs font-body text-neutral-600">
          Search and browse every product listed by approved sellers.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
            setSuggestOpen(true);
          }}
          onFocus={() => setSuggestOpen(true)}
          onBlur={() => setSuggestOpen(false)}
          onKeyDown={(e) => {
            if (!showSuggestions) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveSuggestion((i) => (i + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveSuggestion((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === "Enter" && activeSuggestion >= 0) {
              e.preventDefault();
              pickSuggestion(suggestions[activeSuggestion].suggestion);
            } else if (e.key === "Escape") {
              setSuggestOpen(false);
            }
          }}
          placeholder="Search by product, brand or manufacturer"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-10 text-[13px] shadow-sm focus:border-primary-600 focus:outline-none"
        />
        {showSuggestions && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
          >
            {suggestions.map((item, index) => (
              <li
                key={`${item.productId ?? item.suggestion}-${index}`}
                role="option"
                aria-selected={index === activeSuggestion}
                // mousedown fires before the input's blur, so the pick isn't lost
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickSuggestion(item.suggestion);
                }}
                onMouseEnter={() => setActiveSuggestion(index)}
                className={`flex cursor-pointer items-center gap-2 px-3.5 py-2 text-[13px] text-neutral-800 ${
                  index === activeSuggestion ? "bg-primary-50" : ""
                }`}
              >
                <Search size={14} className="shrink-0 text-neutral-400" />
                <span className="min-w-0 flex-1 truncate">{item.suggestion}</span>
                {item.categoryName && <span className="shrink-0 text-[11px] text-neutral-400">{item.categoryName}</span>}
              </li>
            ))}
          </ul>
        )}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPage(1);
              setSuggestions([]);
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
        <p className="text-xs font-body text-neutral-600" aria-live="polite">
          {data && !error ? (
            <>
              <span className="font-semibold text-neutral-900">{data.totalResults.toLocaleString("en-IN")}</span>{" "}
              product{data.totalResults === 1 ? "" : "s"}
              {debouncedQuery ? ` for “${debouncedQuery}”` : ""}
            </>
          ) : (
            " "
          )}
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            role="switch"
            aria-checked={filters.inStockOnly}
            onClick={() => updateFilters({ inStockOnly: !filters.inStockOnly })}
            className="flex items-center gap-2 text-xs font-medium text-neutral-700"
          >
            <span
              className={`relative h-5 w-9 rounded-full transition-colors ${filters.inStockOnly ? "bg-primary-800" : "bg-neutral-300"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  filters.inStockOnly ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
            In stock only
          </button>

          <span className="hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />

          <SortDropdown
            // Without a search the default already is "Newest first", so an explicit "newest" maps onto it.
            value={sort === "newest" && !debouncedQuery ? "default" : sort}
            options={sortOptions}
            onChange={(value) => {
              setSort(value as SearchSort | "default");
              setPage(1);
            }}
          />

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
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => updateFilters(filter.clear)}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800 hover:bg-primary-100"
              aria-label={`Remove filter ${filter.label}`}
            >
              {filter.label} <X size={12} aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={() => updateFilters(NO_FILTERS)}
            className="text-xs font-semibold text-neutral-500 underline hover:text-neutral-800"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className={`${showFilters ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-72`}>
          <CatalogFilterSidebar
            filters={filters}
            facetByField={facetByField}
            categoryCounts={categoryCounts}
            activeCount={sidebarActiveCount}
            onChange={updateFilters}
            onClear={() => updateFilters({ ...NO_FILTERS, inStockOnly: filters.inStockOnly })}
          />
        </aside>

        <section className="min-w-0 flex-1">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-p3 font-body text-red-700">{error}</p>
            </div>
          )}

          {!data && loading && (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(156px,1fr))]">
              {Array.from({ length: 6 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {data && data.results.length === 0 && !loading && !error && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
              <p className="text-p2 font-medium text-neutral-800">No products found</p>
              <p className="mt-1 text-p4 text-neutral-500">
                {activeFilters.length > 0
                  ? "Try removing a filter, or check the spelling of your search."
                  : "Check the spelling, or try a brand, molecule or therapeutic area."}
              </p>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => updateFilters(NO_FILTERS)}
                  className="mt-4 rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {data && data.results.length > 0 && (
            <div className={`transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(156px,1fr))]">
                {data.results.map((item, index) => (
                  <CatalogProductCard
                    key={item.productId}
                    product={searchResultToBuyerProduct(item)}
                    searchContext={
                      data.searchId ? { searchId: data.searchId, position: (page - 1) * PAGE_SIZE + index } : undefined
                    }
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pager
                  page={page}
                  totalPages={totalPages}
                  onChange={(next) => {
                    setPage(next);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
