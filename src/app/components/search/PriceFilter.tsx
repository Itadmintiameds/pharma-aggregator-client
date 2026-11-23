"use client";

import { useState } from "react";

export default function PriceFilter({
  initialMin,
  initialMax,
  onApply,
  disabled,
  hideTitle = false,
}: {
  initialMin: string;
  initialMax: string;
  onApply: (priceMin: string, priceMax: string) => void;
  /** True for visitors who are not logged in: prices are hidden from them, so they cannot filter by price. */
  disabled: boolean;
  /** The caller already shows a "Price" heading (for instance a collapsible section title). */
  hideTitle?: boolean;
}) {
  const [minInput, setMinInput] = useState(initialMin);
  const [maxInput, setMaxInput] = useState(initialMax);
  const [error, setError] = useState("");

  const apply = () => {
    if (disabled) return;
    const min = minInput.trim() === "" ? null : Number(minInput);
    const max = maxInput.trim() === "" ? null : Number(maxInput);
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) {
      setError("Enter a valid price.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      setError("Minimum price can't be above maximum.");
      return;
    }
    setError("");
    onApply(min === null ? "" : String(min), max === null ? "" : String(max));
  };

  const inputClass =
    "w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed";

  return (
    <section>
      {!hideTitle && <h3 className="text-sm font-semibold text-neutral-900 mb-2">Price (₹)</h3>}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          inputMode="decimal"
          placeholder="Min"
          aria-label="Minimum price"
          disabled={disabled}
          value={minInput}
          onChange={(e) => setMinInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className={inputClass}
        />
        <span className="text-neutral-400">–</span>
        <input
          type="number"
          min={0}
          inputMode="decimal"
          placeholder="Max"
          aria-label="Maximum price"
          disabled={disabled}
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className={inputClass}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <button
        onClick={apply}
        disabled={disabled}
        className="mt-2 w-full rounded-md border border-primary-700 text-primary-700 text-sm py-1.5 hover:bg-primary-50 transition-colors disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
      >
        Apply
      </button>
      {disabled && <p className="mt-1 text-xs text-neutral-500">Log in to filter and sort by price.</p>}
    </section>
  );
}
