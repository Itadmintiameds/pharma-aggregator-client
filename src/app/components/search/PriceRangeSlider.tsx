"use client";

import { useEffect, useState } from "react";
import { searchProducts } from "@/src/services/buyer/searchService";
import type { SearchProductResult } from "@/src/types/buyer/search";

interface Bounds {
  min: number;
  max: number;
}

// The catalog's cheapest and dearest listed prices change rarely: fetch once per page load and share it.
let boundsPromise: Promise<Bounds | null> | null = null;

const unitPrice = (r: SearchProductResult | undefined, side: "low" | "high"): number | null => {
  if (!r) return null;
  const value = r.sellingPrice ?? (side === "low" ? r.priceMin : r.priceMax) ?? r.mrp;
  return value != null && Number.isFinite(value) ? value : null;
};

function loadBounds(): Promise<Bounds | null> {
  if (!boundsPromise) {
    boundsPromise = Promise.all([
      searchProducts({ sort: "price_asc", page: 0, size: 1 }),
      searchProducts({ sort: "price_desc", page: 0, size: 1 }),
    ])
      .then(([cheapest, dearest]) => {
        const min = unitPrice(cheapest.results[0], "low");
        const max = unitPrice(dearest.results[0], "high");
        if (min == null || max == null || max <= min) return null;
        return { min: Math.floor(min), max: Math.ceil(max) };
      })
      .catch(() => {
        boundsPromise = null; // let a later render retry
        return null;
      });
  }
  return boundsPromise;
}

const thumb =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary-800 [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--color-primary-800)] " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary-800 [&::-moz-range-thumb]:shadow-[0_0_0_2px_var(--color-primary-800)]";

const formatRupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Dual-handle price range slider. Shows "₹low - ₹high" under the track; the filter is applied when a handle is
 * released (not on every drag tick), and a handle left at the catalog's end means "no limit" on that side.
 * Remount it (change its key) when the applied range changes from elsewhere.
 */
export default function PriceRangeSlider({
  disabled = false,
  initialMin,
  initialMax,
  onApply,
}: {
  /** Visitors who are not logged in cannot see prices, so they cannot filter by them either. */
  disabled?: boolean;
  initialMin: string;
  initialMax: string;
  onApply: (priceMin: string, priceMax: string) => void;
}) {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [lo, setLo] = useState<number | null>(initialMin ? Number(initialMin) : null);
  const [hi, setHi] = useState<number | null>(initialMax ? Number(initialMax) : null);

  useEffect(() => {
    if (disabled) return;
    let cancelled = false;
    loadBounds().then((b) => {
      if (!cancelled) setBounds(b);
    });
    return () => {
      cancelled = true;
    };
  }, [disabled]);

  if (disabled || !bounds) {
    return (
      <div aria-disabled="true" className="opacity-60">
        <div className="relative h-5">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" />
          <span className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-white bg-neutral-300 shadow-[0_0_0_2px_var(--color-neutral-300)]" />
          <span className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-white bg-neutral-300 shadow-[0_0_0_2px_var(--color-neutral-300)]" />
        </div>
        <p className="mt-2 text-xs text-neutral-500">{disabled ? "Log in to filter by price" : "Loading price range…"}</p>
      </div>
    );
  }

  const { min, max } = bounds;
  const low = Math.min(Math.max(lo ?? min, min), max);
  const high = Math.min(Math.max(hi ?? max, min), max);
  const step = Math.max(1, Math.round((max - min) / 200));
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const commit = () => onApply(low <= min ? "" : String(low), high >= max ? "" : String(high));

  return (
    <div>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary-800"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        <input
          type="range"
          aria-label="Minimum price"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => setLo(Math.min(Number(e.target.value), high))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          // when both handles meet near the right end, the left one must stay grabbable
          style={{ zIndex: low > (min + max) / 2 ? 30 : 20 }}
          className={`pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent focus:outline-none ${thumb}`}
        />
        <input
          type="range"
          aria-label="Maximum price"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => setHi(Math.max(Number(e.target.value), low))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          style={{ zIndex: 25 }}
          className={`pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent focus:outline-none ${thumb}`}
        />
      </div>
      <p className="mt-2 text-xs font-medium text-neutral-600">
        {formatRupees(low)} - {formatRupees(high)}
      </p>
    </div>
  );
}
