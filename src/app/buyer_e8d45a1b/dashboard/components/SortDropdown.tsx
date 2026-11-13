"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";

export interface SortOption {
  value: string;
  label: string;
  /** One line under the label that says what the order means. */
  hint?: string;
}

/**
 * A sort picker styled to match the dashboard (the browser's own <select> menu cannot be styled): a button showing the
 * current choice, and a menu with a tick on the selected option. Works with the mouse and the keyboard (arrows, Enter,
 * Escape) and closes when you click elsewhere.
 */
export default function SortDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SortOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    setActive(Math.max(options.findIndex((o) => o.value === selected.value), 0));
    setOpen(true);
  };
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(options[active].value);
    }
  };

  return (
    <div ref={ref} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex h-10 items-center gap-2 rounded-xl border bg-white px-3 text-sm shadow-sm transition-colors hover:border-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 ${
          open ? "border-primary-600" : "border-neutral-300"
        }`}
      >
        <ArrowUpDown size={16} className="text-neutral-500" />
        <span className="text-neutral-500">Sort by</span>
        <span className="font-semibold text-neutral-900">{selected.label}</span>
        <ChevronDown size={16} className={`text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Sort products"
          className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg"
        >
          {options.map((option, index) => {
            const isSelected = option.value === selected.value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => choose(option.value)}
                  onMouseEnter={() => setActive(index)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left ${
                    index === active ? "bg-neutral-100" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-primary-800">
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm ${isSelected ? "font-semibold text-primary-800" : "font-medium text-neutral-800"}`}>
                      {option.label}
                    </span>
                    {option.hint && <span className="block text-xs text-neutral-500">{option.hint}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
