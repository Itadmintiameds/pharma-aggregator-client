"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import ProductCard from "@/src/app/components/landingPage/ProductCard";
import PriceFilter from "@/src/app/components/search/PriceFilter";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import {
  isRequestCancelled,
  searchProducts,
  searchResultToBuyerProduct,
} from "@/src/services/buyer/searchService";
import { SearchFacet, SearchResultPage, SearchSort } from "@/src/types/buyer/search";
import { STOREFRONT_CATEGORIES } from "@/src/utils/storefrontCategories";

const PAGE_SIZE = 12;
// The search API rejects page * size > 10,000.
const MAX_WINDOW = 10000;

type FacetKey = "therapeuticCategory" | "dosageForm" | "packType" | "manufacturerName";

// Facet groups shown in the sidebar: which facet, what to call it, and which API parameter it filters.
const FACET_GROUPS: { field: FacetKey; label: string }[] = [
  { field: "therapeuticCategory", label: "Therapeutic area" },
  { field: "dosageForm", label: "Dosage form" },
  { field: "packType", label: "Pack type" },
  { field: "manufacturerName", label: "Manufacturer" },
];

interface Filters {
  categoryId: string;
  therapeuticCategory: string;
  dosageForm: string;
  packType: string;
  manufacturerName: string;
  priceMin: string;
  priceMax: string;
  inStockOnly: boolean;
}

const NO_FILTERS: Filters = {
  categoryId: "",
  therapeuticCategory: "",
  dosageForm: "",
  packType: "",
  manufacturerName: "",
  priceMin: "",
  priceMax: "",
  inStockOnly: false,
};

export default function BuyerCatalogPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<SearchSort | "default">("default");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

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

  /** Any filter change returns to page 1. */
  const updateFilters = (patch: Partial<Filters>) => {
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

  const activeFilters: { key: string; label: string; clear: Partial<Filters> }[] = [];
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

  const optionClass = (selected: boolean) =>
    `w-full flex items-center justify-between gap-2 text-left text-sm rounded-md px-2 py-1.5 transition-colors ${
      selected ? "bg-primary-800 text-white" : "text-neutral-700 hover:bg-neutral-100"
    }`;

  const sidebar = (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-neutral-900 mb-2">Category</h3>
        <ul className="space-y-1">
          {STOREFRONT_CATEGORIES.map((category) => {
            const selected = filters.categoryId === String(category.id);
            const count = categoryCounts.get(category.facetName);
            return (
              <li key={category.id}>
                <button
                  onClick={() => updateFilters({ categoryId: selected ? "" : String(category.id) })}
                  className={optionClass(selected)}
                >
                  <span className="truncate">{category.name}</span>
                  {count !== undefined && (
                    <span className={selected ? "text-white/80" : "text-neutral-400"}>{count}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {FACET_GROUPS.map((group) => {
        const values = facetByField.get(group.field)?.values ?? [];
        if (values.length === 0) return null;
        const selectedValue = filters[group.field];
        return (
          <section key={group.field}>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">{group.label}</h3>
            <ul className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {values.map((v) => {
                const selected = selectedValue === v.value;
                return (
                  <li key={v.value}>
                    <button
                      onClick={() => updateFilters({ [group.field]: selected ? "" : v.value })}
                      className={optionClass(selected)}
                    >
                      <span className="truncate">{v.value}</span>
                      <span className={selected ? "text-white/80" : "text-neutral-400"}>{v.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* keyed on the applied range so the boxes reset when it changes from elsewhere (chip, clear all) */}
      <PriceFilter
        disabled={false}
        key={`${filters.priceMin}-${filters.priceMax}`}
        initialMin={filters.priceMin}
        initialMax={filters.priceMax}
        onApply={(priceMin, priceMax) => updateFilters({ priceMin, priceMax })}
      />

      <label className="flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(e) => updateFilters({ inStockOnly: e.target.checked })}
          className="h-4 w-4 accent-primary-800"
        />
        In stock only
      </label>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Browse Catalog</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Search and browse every product listed by approved sellers.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product, brand or manufacturer"
            className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              <FiX />
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SearchSort | "default");
            setPage(1);
          }}
          className="px-3 py-2.5 border border-neutral-300 rounded-lg text-sm bg-white"
        >
          <option value="default">{debouncedQuery ? "Best match" : "Newest first"}</option>
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>

        <button
          onClick={() => setShowFilters((open) => !open)}
          className="lg:hidden rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-700"
        >
          {showFilters ? "Hide filters" : `Filters${activeFilters.length ? ` (${activeFilters.length})` : ""}`}
        </button>
      </div>

      {data && !error && (
        <p className="text-p4 font-body text-neutral-500 -mt-3">
          {data.totalResults.toLocaleString("en-IN")} product{data.totalResults === 1 ? "" : "s"}
          {debouncedQuery ? ` for “${debouncedQuery}”` : ""}
        </p>
      )}

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => updateFilters(filter.clear)}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 text-primary-800 text-xs px-3 py-1 hover:bg-primary-100"
              aria-label={`Remove filter ${filter.label}`}
            >
              {filter.label} <span aria-hidden>×</span>
            </button>
          ))}
          <button
            onClick={() => updateFilters(NO_FILTERS)}
            className="text-xs text-neutral-500 underline hover:text-neutral-800"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:w-64 shrink-0`}>{sidebar}</aside>

        <section className="flex-1 min-w-0">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-p3 font-body text-red-700">{error}</p>
            </div>
          )}

          {!data && loading && (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
            </div>
          )}

          {data && data.results.length === 0 && !loading && !error && (
            <div className="py-10 text-center">
              <p className="text-p3 font-body text-neutral-500">No products found.</p>
              {activeFilters.length > 0 && (
                <button
                  onClick={() => updateFilters(NO_FILTERS)}
                  className="mt-3 text-sm text-primary-800 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {data && data.results.length > 0 && (
            <div className={`transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6">
                {data.results.map((item, index) => (
                  <ProductCard
                    key={item.productId}
                    product={searchResultToBuyerProduct(item)}
                    searchContext={
                      data.searchId
                        ? { searchId: data.searchId, position: (page - 1) * PAGE_SIZE + index }
                        : undefined
                    }
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-neutral-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
