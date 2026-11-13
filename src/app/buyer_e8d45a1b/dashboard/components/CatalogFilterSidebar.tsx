"use client";

import React, { useState } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import PriceFilter from "@/src/app/components/search/PriceFilter";
import type { SearchFacet } from "@/src/types/buyer/search";
import { STOREFRONT_CATEGORIES } from "@/src/utils/storefrontCategories";

export type FacetKey = "therapeuticCategory" | "dosageForm" | "packType" | "manufacturerName";

export interface CatalogFilters {
  categoryId: string;
  therapeuticCategory: string;
  dosageForm: string;
  packType: string;
  manufacturerName: string;
  priceMin: string;
  priceMax: string;
  inStockOnly: boolean;
}

export const NO_FILTERS: CatalogFilters = {
  categoryId: "",
  therapeuticCategory: "",
  dosageForm: "",
  packType: "",
  manufacturerName: "",
  priceMin: "",
  priceMax: "",
  inStockOnly: false,
};

// Facet groups shown in the sidebar: which facet, what to call it, and which API parameter it filters.
export const FACET_GROUPS: { field: FacetKey; label: string }[] = [
  { field: "therapeuticCategory", label: "Therapeutic area" },
  { field: "dosageForm", label: "Dosage form" },
  { field: "packType", label: "Pack type" },
  { field: "manufacturerName", label: "Manufacturer" },
];

const QUICK_PRICE_RANGES = [
  { label: "Under ₹100", min: "", max: "100" },
  { label: "₹100 – ₹500", min: "100", max: "500" },
  { label: "₹500 – ₹1,000", min: "500", max: "1000" },
  { label: "Over ₹1,000", min: "1000", max: "" },
];

const SHOW_FIRST = 6;

function Section({
  title,
  selected,
  defaultOpen = false,
  children,
}: {
  title: string;
  /** What is picked in this section, shown next to the title so a collapsed section still tells the story. */
  selected?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-neutral-100 py-3 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <span className="text-p4 font-heading font-semibold text-neutral-900">{title}</span>
        <span className="flex min-w-0 items-center gap-2">
          {selected && (
            <span className="max-w-[7rem] truncate rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
              {selected}
            </span>
          )}
          <ChevronDown size={16} className="shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

function OptionList({
  options,
  selectedValue,
  onSelect,
}: {
  options: { value: string; label: string; count?: number }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  // Keep the picked option visible even when it would fall below the fold.
  const selectedIndex = options.findIndex((o) => o.value === selectedValue);
  const collapsed = !showAll && options.length > SHOW_FIRST + 1;
  const visible = collapsed
    ? options.filter((o, i) => i < SHOW_FIRST || i === selectedIndex)
    : options;

  return (
    <>
      <ul className="space-y-0.5">
        {visible.map((option) => {
          const selected = option.value === selectedValue;
          return (
            <li key={option.value}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(selected ? "" : option.value)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-p4 transition-colors ${
                  selected ? "bg-primary-50 font-medium text-primary-800" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    selected ? "border-primary-800 bg-primary-800 text-white" : "border-neutral-300 bg-white"
                  }`}
                >
                  {selected && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.count !== undefined && (
                  <span className={`text-xs ${selected ? "text-primary-700" : "text-neutral-400"}`}>{option.count}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {options.length > SHOW_FIRST + 1 && (
        <button
          type="button"
          onClick={() => setShowAll((open) => !open)}
          className="mt-1 px-2 text-xs font-semibold text-primary-800 hover:underline"
        >
          {showAll ? "Show less" : `Show all ${options.length}`}
        </button>
      )}
    </>
  );
}

export default function CatalogFilterSidebar({
  filters,
  facetByField,
  categoryCounts,
  activeCount,
  onChange,
  onClear,
  priceLocked = false,
  stickyClassName = "lg:top-24 lg:max-h-[calc(100vh-7rem)]",
}: {
  filters: CatalogFilters;
  facetByField: Map<string, SearchFacet>;
  categoryCounts: Map<string, number>;
  activeCount: number;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClear: () => void;
  /** Visitors who are not logged in cannot see prices, so they cannot filter by them either. */
  priceLocked?: boolean;
  /** Where the panel sticks while scrolling: it must clear whatever fixed header the page has. */
  stickyClassName?: string;
}) {
  const categoryOptions = STOREFRONT_CATEGORIES.map((c) => ({
    value: String(c.id),
    label: c.name,
    count: categoryCounts.get(c.facetName),
  }));
  const selectedCategory = STOREFRONT_CATEGORIES.find((c) => String(c.id) === filters.categoryId)?.name;
  const priceSelected =
    filters.priceMin || filters.priceMax
      ? `${filters.priceMin ? `₹${filters.priceMin}` : "Any"} – ${filters.priceMax ? `₹${filters.priceMax}` : "Any"}`
      : undefined;

  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:overflow-y-auto ${stickyClassName}`}>
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <h3 className="flex items-center gap-2 text-p3 font-heading font-semibold text-neutral-900">
          <SlidersHorizontal size={16} className="text-neutral-500" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary-900 px-2 py-0.5 text-xs font-semibold text-white">{activeCount}</span>
          )}
        </h3>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-primary-800 hover:underline">
            Clear all
          </button>
        )}
      </div>

      <Section title="Category" selected={selectedCategory} defaultOpen>
        <OptionList options={categoryOptions} selectedValue={filters.categoryId} onSelect={(value) => onChange({ categoryId: value })} />
      </Section>

      {FACET_GROUPS.map((group, index) => {
        const values = facetByField.get(group.field)?.values ?? [];
        const selectedValue = filters[group.field];
        // A picked value must stay listed even if the narrowed results no longer include it as a facet.
        if (values.length === 0 && !selectedValue) return null;
        const options: { value: string; label: string; count?: number }[] = values.map((v) => ({ value: v.value, label: v.value, count: v.count }));
        if (selectedValue && !options.some((o) => o.value === selectedValue)) {
          options.unshift({ value: selectedValue, label: selectedValue });
        }
        return (
          <Section key={group.field} title={group.label} selected={selectedValue || undefined} defaultOpen={index === 0 || !!selectedValue}>
            <OptionList options={options} selectedValue={selectedValue} onSelect={(value) => onChange({ [group.field]: value })} />
          </Section>
        );
      })}

      <Section title="Price (₹)" selected={priceSelected} defaultOpen>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {QUICK_PRICE_RANGES.map((range) => {
            const selected = filters.priceMin === range.min && filters.priceMax === range.max;
            return (
              <button
                key={range.label}
                type="button"
                aria-pressed={selected}
                disabled={priceLocked}
                onClick={() => onChange(selected ? { priceMin: "", priceMax: "" } : { priceMin: range.min, priceMax: range.max })}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? "border-primary-800 bg-primary-50 text-primary-800"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
        {/* keyed on the applied range so the boxes reset when it changes from elsewhere (chip, clear all) */}
        <PriceFilter
          disabled={priceLocked}
          hideTitle
          key={`${filters.priceMin}-${filters.priceMax}`}
          initialMin={filters.priceMin}
          initialMax={filters.priceMax}
          onApply={(priceMin, priceMax) => onChange({ priceMin, priceMax })}
        />
      </Section>
    </div>
  );
}
