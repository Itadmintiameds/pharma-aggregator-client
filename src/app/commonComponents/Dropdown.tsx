"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface CommonDropdownProps {
  options: DropdownOption[];
  value: string | number | null;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  readOnly?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const byLabel = (a: DropdownOption, b: DropdownOption) => a.label.localeCompare(b.label);

/**
 * Keyboard model (matches the WAI-ARIA combobox/listbox pattern):
 *  - Tab / Shift+Tab reach the control; Tab while open just closes the list and moves on.
 *  - Enter, Space, ArrowDown/ArrowUp open the list (Enter never submits the form just to open it).
 *  - Typing (also from the closed state) filters the list; Backspace edits the filter.
 *  - ArrowUp/Down (wrapping), Home/End, PageUp/PageDown move the highlight, which scrolls into view.
 *  - Enter selects the highlighted option, Escape closes without changing the value.
 */
const Dropdown: React.FC<CommonDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option",
  isLoading = false,
  isDisabled = false,
  readOnly = false,
  label,
  error,
  required = false,
  icon,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const interactive = !isDisabled && !isLoading && !readOnly;

  // Filter options based on typed text, always shown in ascending order
  const filteredOptions = (
    searchTerm
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options
  )
    .slice()
    .sort(byLabel);

  const selectedOption = options.find((opt) => opt.value === String(value));

  const closeList = () => {
    setIsOpen(false);
    setSearchTerm("");
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  };

  const openList = (initialSearch = "") => {
    if (!interactive) return;
    setSearchTerm(initialSearch);
    const sorted = options.slice().sort(byLabel);
    const base = initialSearch
      ? sorted.filter((o) => o.label.toLowerCase().includes(initialSearch.toLowerCase()))
      : sorted;
    // open on the current selection so ArrowUp/Down continue from where the user is
    const selectedIdx = initialSearch ? -1 : base.findIndex((o) => o.value === String(value));
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
    setIsOpen(true);
  };

  const commit = (opt: DropdownOption | undefined) => {
    if (!opt || !interactive) return;
    onChange(opt.value, opt.label);
    closeList();
    // keep focus on the control so Tab continues to the next field
    triggerRef.current?.focus();
  };

  // Click outside closes the list
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear any pending filter timer on unmount
  useEffect(
    () => () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    },
    [],
  );

  // Keep the highlighted row inside the scroll area
  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex, searchTerm]);

  const appendSearch = (ch: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearchTerm((prev) => prev + ch);
    setActiveIndex(0); // highlight the first match
    searchTimeoutRef.current = setTimeout(() => setSearchTerm(""), 15000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const last = Math.max(filteredOptions.length - 1, 0);
    const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault(); // Enter must not submit the form just to open a list
        openList();
      } else if (isPrintable) {
        e.preventDefault();
        openList(e.key); // type-ahead from the closed state
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev >= last ? 0 : prev + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? last : prev - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(last);
        break;
      case "PageDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 5, last));
        break;
      case "PageUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 5, 0));
        break;
      case "Enter":
        e.preventDefault();
        commit(filteredOptions[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closeList();
        break;
      case "Tab":
        // move on naturally; the list only closes (the value changes with Enter / click)
        closeList();
        break;
      case "Backspace":
        e.preventDefault();
        setSearchTerm((prev) => prev.slice(0, -1));
        setActiveIndex(0);
        break;
      default:
        if (isPrintable) {
          e.preventDefault();
          appendSearch(e.key);
        }
    }
  };

  // Show search term when typing, otherwise show selected option or placeholder
  const displayValue = isOpen && searchTerm ? searchTerm : selectedOption?.label || placeholder;

  const handleClick = () => {
    if (!interactive) return;
    if (isOpen) closeList();
    else openList();
  };

  const getVariantStyles = (): string => {
    if (isDisabled)
      return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-not-allowed";
    if (readOnly)
      return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-default";
    if (error)
      return "border-warning-500 text-pneutral-800 bg-white focus:border-warning-500 focus:ring-2 focus:ring-warning-500/30 cursor-pointer";

    // Default enabled state
    return "border-pneutral-300 text-pneutral-800 bg-white focus:border-primary-800 focus:ring-2 focus:ring-primary-100 cursor-pointer";
  };

  const activeOptionId =
    isOpen && filteredOptions[activeIndex] ? `${uid}-opt-${activeIndex}` : undefined;

  return (
    <div className={`flex flex-col gap-0 w-full ${className}`}>
      {label && (
        <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${
          isDisabled ? "text-pneutral-500" : "text-pneutral-900"
        }`}>
          {icon && <span className="text-neutral-600 text-lg mr-2">{icon}</span>}
          {label}
          {required && <span className="text-warning-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <div
          ref={triggerRef}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-disabled={isDisabled || undefined}
          aria-readonly={readOnly || undefined}
          aria-invalid={error ? true : undefined}
          aria-label={label ?? placeholder}
          tabIndex={isDisabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            // focus left the whole control (not just moved onto the list) -> close
            if (!dropdownRef.current?.contains(e.relatedTarget as Node | null)) closeList();
          }}
          className={`
            w-full border outline-none transition-all duration-200 flex items-center justify-between
            h-[52px] min-h-[52px] max-h-[56px] px-4 py-3 text-base rounded-lg
            ${getVariantStyles()}
          `}
          onClick={handleClick}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {icon && <span className="text-pneutral-500 shrink-0">{icon}</span>}
            <span className={`truncate ${isOpen && searchTerm ? "text-primary-900 font-medium" : ""}`}>
              {isLoading ? "Loading..." : displayValue}
              {isOpen && searchTerm && (
                <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-primary-800 align-middle" />
              )}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform shrink-0 ml-2 ${
              isOpen && !readOnly && !isDisabled ? "rotate-180" : ""
            } ${
              isDisabled ? "text-pneutral-500" : "text-pneutral-800"
            }`}
          />
        </div>

        {isOpen && interactive && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden"
            // keep focus on the trigger while clicking / scrolling the list
            onMouseDown={(e) => e.preventDefault()}
          >
            <div
              id={listboxId}
              role="listbox"
              aria-label={label ?? placeholder}
              className="max-h-60 overflow-y-auto"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(value) === opt.value;
                  const isActive = activeIndex === idx;
                  return (
                    <div
                      key={opt.value}
                      id={`${uid}-opt-${idx}`}
                      ref={(el) => {
                        optionRefs.current[idx] = el;
                      }}
                      role="option"
                      aria-selected={isSelected}
                      className={`flex items-center justify-between gap-2 px-4 py-2 cursor-pointer border-b border-neutral-200 last:border-b-0 border-l-4
                        ${isActive ? "bg-purple-100 border-l-primary-800" : "border-l-transparent"}
                        ${isSelected ? "text-primary-900 font-semibold" : "text-neutral-900"}
                        ${isSelected && !isActive ? "bg-purple-50" : ""}
                      `}
                      onClick={() => commit(opt)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <span className="text-sm truncate">{opt.label}</span>
                      {isSelected && <Check size={14} className="shrink-0 text-primary-800" aria-hidden />}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                  {searchTerm ? `No match for "${searchTerm}"` : "No options available"}
                </div>
              )}
            </div>
            {searchTerm && filteredOptions.length > 0 && (
              <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-1 text-[11px] text-neutral-500">
                {filteredOptions.length} match{filteredOptions.length === 1 ? "" : "es"} · ↑↓ move · Enter select · Esc close
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="font-heading font-normal text-sm leading-[28px] px-1 text-warning-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Dropdown;
