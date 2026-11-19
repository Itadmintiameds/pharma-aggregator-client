"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxDropdownProps {
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  error?: string;
  showSelectAll?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

/**
 * Multi-select keyboard model:
 *  - Tab / Shift+Tab reach the control; Tab while open closes the list and moves on.
 *  - Enter, ArrowDown/ArrowUp open it. Typing filters (also from the closed state).
 *  - ArrowUp/Down (wrapping), Home/End, PageUp/PageDown move the highlight.
 *  - Enter or Space (when not mid-search) toggles the highlighted row; the list stays open for more picks.
 *  - Escape closes.
 */
const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  label,
  placeholder = "Select options",
  required = false,
  icon,
  error,
  showSelectAll = true,
  disabled = false,
  readOnly = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const interactive = !disabled && !readOnly;

  // Filter options based on search term, always shown in ascending order
  const filteredOptions = (
    searchTerm
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options
  )
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));

  // Keyboard rows: an optional "Select All" row first, then the options.
  const hasSelectAll = showSelectAll && options.length > 0 && !searchTerm;
  const rowCount = filteredOptions.length + (hasSelectAll ? 1 : 0);
  const optionIndexOf = (rowIdx: number) => rowIdx - (hasSelectAll ? 1 : 0);

  const closeList = () => {
    setIsOpen(false);
    setSearchTerm("");
    setActiveIndex(0);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  };

  const openList = (initialSearch = "") => {
    if (!interactive) return;
    setSearchTerm(initialSearch);
    setActiveIndex(0);
    setIsOpen(true);
  };

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

  useEffect(
    () => () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    },
    [],
  );

  // Keep the highlighted row inside the scroll area
  useEffect(() => {
    if (isOpen) rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex, searchTerm]);

  const toggleOption = (value: string) => {
    if (!interactive) return;
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (!interactive) return;
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const activateRow = (rowIdx: number) => {
    if (hasSelectAll && rowIdx === 0) {
      toggleSelectAll();
      return;
    }
    const opt = filteredOptions[optionIndexOf(rowIdx)];
    if (opt) toggleOption(opt.value);
  };

  const appendSearch = (ch: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearchTerm((prev) => prev + ch);
    setActiveIndex(0);
    searchTimeoutRef.current = setTimeout(() => setSearchTerm(""), 15000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const last = Math.max(rowCount - 1, 0);
    const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault(); // Enter must not submit the form just to open a list
        openList();
      } else if (isPrintable) {
        e.preventDefault();
        openList(e.key);
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
        activateRow(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closeList();
        break;
      case "Tab":
        closeList();
        break;
      case "Backspace":
        e.preventDefault();
        setSearchTerm((prev) => prev.slice(0, -1));
        setActiveIndex(0);
        break;
      default:
        if (e.key === " " && !searchTerm) {
          e.preventDefault();
          activateRow(activeIndex);
        } else if (isPrintable) {
          e.preventDefault();
          appendSearch(e.key);
        }
    }
  };

  // Show search term when typing, otherwise the selected labels
  const getDisplayText = () => {
    if (isOpen && searchTerm) return searchTerm;
    if (selectedValues.length) {
      return options
        .filter((opt) => selectedValues.includes(opt.value))
        .map((opt) => opt.label)
        .join(", ");
    }
    return placeholder;
  };

  const displayText = getDisplayText();

  const allSelected = options.length > 0 && selectedValues.length === options.length;
  const someSelected = selectedValues.length > 0 && selectedValues.length < options.length;

  const getVariantStyles = (): string => {
    if (disabled)
      return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-not-allowed";
    if (readOnly)
      return "border-pneutral-300 bg-pneutral-50 text-pneutral-800 cursor-default";
    if (error)
      return "border-warning-500 text-pneutral-800 bg-white focus:border-warning-500 focus:ring-2 focus:ring-warning-500/30 cursor-pointer";

    return "border-pneutral-300 text-pneutral-800 bg-white focus:border-primary-800 focus:ring-2 focus:ring-primary-100 cursor-pointer";
  };

  const handleClick = () => {
    if (!interactive) return;
    if (isOpen) closeList();
    else openList();
  };

  const rowClass = (idx: number) =>
    `flex items-center px-4 py-2 cursor-pointer border-b border-neutral-200 last:border-b-0 border-l-4 ${
      activeIndex === idx ? "bg-purple-100 border-l-primary-800" : "border-l-transparent hover:bg-purple-50"
    }`;

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${
          disabled ? "text-pneutral-500" : "text-pneutral-900"
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
          aria-activedescendant={isOpen && rowCount > 0 ? `${uid}-row-${activeIndex}` : undefined}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          aria-invalid={error ? true : undefined}
          aria-label={label ?? placeholder}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
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
              {displayText}
              {isOpen && searchTerm && (
                <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-primary-800 align-middle" />
              )}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform shrink-0 ml-2 ${
              isOpen && interactive ? "rotate-180" : ""
            } ${disabled ? "text-pneutral-500" : "text-pneutral-800"}`}
          />
        </div>

        {isOpen && interactive && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div
              id={listboxId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={label ?? placeholder}
              className="max-h-60 overflow-y-auto"
            >
              {hasSelectAll && (
                <div
                  id={`${uid}-row-0`}
                  ref={(el) => {
                    rowRefs.current[0] = el;
                  }}
                  role="option"
                  aria-selected={allSelected}
                  className={rowClass(0)}
                  onClick={toggleSelectAll}
                  onMouseEnter={() => setActiveIndex(0)}
                >
                  <input
                    type="checkbox"
                    tabIndex={-1}
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={() => {}}
                    className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200 pointer-events-none"
                  />
                  <span className="ml-3 text-sm font-medium text-[#4B0082]">Select All</span>
                </div>
              )}

              {filteredOptions.map((option, i) => {
                const rowIdx = i + (hasSelectAll ? 1 : 0);
                const checked = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    id={`${uid}-row-${rowIdx}`}
                    ref={(el) => {
                      rowRefs.current[rowIdx] = el;
                    }}
                    role="option"
                    aria-selected={checked}
                    className={rowClass(rowIdx)}
                    onClick={() => toggleOption(option.value)}
                    onMouseEnter={() => setActiveIndex(rowIdx)}
                  >
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      checked={checked}
                      onChange={() => {}}
                      className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200 pointer-events-none"
                    />
                    <span className={`ml-3 flex-1 truncate text-sm ${checked ? "font-semibold text-primary-900" : "text-neutral-900"}`}>
                      {option.label}
                    </span>
                    {checked && <Check size={14} className="shrink-0 text-primary-800" aria-hidden />}
                  </div>
                );
              })}

              {filteredOptions.length === 0 && (
                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                  {searchTerm ? `No match for "${searchTerm}"` : "No options available"}
                </div>
              )}
            </div>
            <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-1 text-[11px] text-neutral-500">
              {selectedValues.length} selected · ↑↓ move · Space/Enter toggle · Esc close
            </div>
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

export default CheckboxDropdown;
