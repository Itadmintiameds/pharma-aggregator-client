"use client";

import { useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import ProductCard from "@/src/app/components/landingPage/ProductCard";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import {
  isRequestCancelled,
  searchProducts,
  searchResultToBuyerProduct,
} from "@/src/services/buyer/searchService";
import { SearchResultPage, SearchSort } from "@/src/types/buyer/search";

const PAGE_SIZE = 12;
// The search API rejects page * size > 10,000.
const MAX_WINDOW = 10000;

export default function BuyerCatalogPage() {
  const [query, setQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SearchSort | "default">("default");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const effectiveSort: SearchSort = sort === "default" ? (debouncedQuery ? "relevance" : "newest") : sort;
  const requestKey = JSON.stringify([debouncedQuery, inStockOnly, effectiveSort, page]);

  // "Loading" is derived: the filters have moved on from the last answered request.
  const [result, setResult] = useState<{ key: string; data: SearchResultPage | null; error: string }>({
    key: "",
    data: null,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    searchProducts(
      {
        q: debouncedQuery || undefined,
        inStockOnly: inStockOnly || undefined,
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
  }, [debouncedQuery, inStockOnly, effectiveSort, page, requestKey]);

  const loading = result.key !== requestKey;
  const data = result.data;
  const error = loading ? "" : result.error;
  const totalPages = data ? Math.min(data.totalPages, Math.floor(MAX_WINDOW / PAGE_SIZE)) : 0;

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

        <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setInStockOnly(e.target.checked);
              setPage(1);
            }}
          />
          In stock only
        </label>
      </div>

      {data && !error && (
        <p className="text-p4 font-body text-neutral-500">
          {data.totalResults.toLocaleString("en-IN")} product{data.totalResults === 1 ? "" : "s"}
          {debouncedQuery ? ` for “${debouncedQuery}”` : ""}
        </p>
      )}

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
        <p className="text-p3 font-body text-neutral-500 py-10 text-center">No products found.</p>
      )}

      {data && data.results.length > 0 && (
        <div className={`transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
    </div>
  );
}
