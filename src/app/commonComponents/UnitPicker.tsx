"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface UnitOption {
  value: string;
  label: string;
}

interface UnitPickerProps {
  options: UnitOption[];
  value: string | number | null | undefined;
  onSelect: (option: UnitOption) => void;
  /** text shown when nothing is selected */
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}

/**
 * Compact unit selector that sits at the right edge of a "value + unit" field.
 * Keyboard: Tab to reach; Enter / Space / ArrowUp / ArrowDown open; ArrowUp/Down (wrapping), Home/End move the
 * highlight; Enter or Space selects; Escape or Tab closes; typing jumps to the matching unit.
 */
const UnitPicker: React.FC<UnitPickerProps> = ({
  options,
  value,
  onSelect,
  placeholder = "Select Unit",
  loading = false,
  disabled = false,
  ariaLabel,
  className = "w-[149px]",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const typedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useId();
  const interactive = !disabled && !loading;

  const selected = options.find((o) => String(o.value) === String(value));

  const closeList = () => {
    setIsOpen(false);
    setTyped("");
  };

  const openList = () => {
    if (!interactive) return;
    const idx = options.findIndex((o) => String(o.value) === String(value));
    setActiveIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
  };

  const commit = (opt?: UnitOption) => {
    if (!opt || !interactive) return;
    onSelect(opt);
    closeList();
    triggerRef.current?.focus(); // Tab then continues to the next field
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setTyped("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(
    () => () => {
      if (typedTimer.current) clearTimeout(typedTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex]);

  const typeAhead = (ch: string) => {
    if (typedTimer.current) clearTimeout(typedTimer.current);
    const next = typed + ch.toLowerCase();
    setTyped(next);
    typedTimer.current = setTimeout(() => setTyped(""), 800);
    let idx = options.findIndex((o) => o.label.toLowerCase().startsWith(next));
    if (idx < 0) idx = options.findIndex((o) => o.label.toLowerCase().includes(next));
    if (idx >= 0) {
      setActiveIndex(idx);
      setIsOpen(true);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!interactive) return;
    const last = Math.max(options.length - 1, 0);
    const printable = e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.altKey && !e.metaKey;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault(); // Enter must not submit the form just to open the list
        openList();
      } else if (printable) {
        e.preventDefault();
        typeAhead(e.key);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((p) => (p >= last ? 0 : p + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((p) => (p <= 0 ? last : p - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(options[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closeList();
        break;
      case "Tab":
        closeList();
        break;
      default:
        if (printable) {
          e.preventDefault();
          typeAhead(e.key);
        }
    }
  };

  return (
    <div ref={wrapRef} className={`relative h-full flex-shrink-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${uid}-units` : undefined}
        aria-activedescendant={isOpen ? `${uid}-unit-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (isOpen ? closeList() : openList())}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) closeList();
        }}
        className="flex h-full w-full items-center justify-between gap-1 bg-pneutral-50 px-3 outline-none transition-colors hover:bg-neutral-100 focus-visible:bg-purple-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-800 disabled:cursor-not-allowed"
      >
        <span
          className={`truncate ${selected ? "text-pneutral-800" : "text-pneutral-500"}`}
          style={{ fontWeight: 400, fontSize: "16px", lineHeight: "24px" }}
        >
          {loading ? "..." : selected?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id={`${uid}-units`}
          role="listbox"
          aria-label={ariaLabel}
          // keep focus on the trigger while clicking / scrolling the list
          onMouseDown={(e) => e.preventDefault()}
          className="absolute right-0 top-[calc(100%+4px)] z-50 max-h-60 w-full min-w-[149px] overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            const isActive = activeIndex === idx;
            return (
              <div
                key={opt.value}
                id={`${uid}-unit-${idx}`}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(opt)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`cursor-pointer border-l-4 px-4 py-2 text-sm ${
                  isActive ? "border-l-primary-800 bg-purple-100" : "border-l-transparent"
                } ${isSelected ? "font-semibold text-primary-900" : "font-medium text-pneutral-800"} ${
                  isSelected && !isActive ? "bg-purple-50" : ""
                }`}
              >
                {opt.label}
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-4 py-2 text-sm text-neutral-500">No units available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnitPicker;
