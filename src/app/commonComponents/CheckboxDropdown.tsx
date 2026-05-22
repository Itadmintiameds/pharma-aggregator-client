"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

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
  showSelectAll?: boolean;   // 👈 make it optional – you decide
  disabled?: boolean;
  className?: string;
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  label,
  placeholder = "Select options",
  required = false,
  icon,
  error,
  showSelectAll = true,   // default = true, but you can set to false
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const toggleOption = (value: string) => {
    if (disabled) return;
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (disabled) return;
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const displayText = selectedValues.length
    ? options
      .filter((opt) => selectedValues.includes(opt.value))
      .map((opt) => opt.label)
      .join(", ")
    : placeholder;

  const allSelected = options.length > 0 && selectedValues.length === options.length;
  const someSelected = selectedValues.length > 0 && selectedValues.length < options.length;

  return (
    <div className={`flex flex-col gap-0 ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          {icon && <span className="text-neutral-600 text-lg">{icon}</span>}
          {label}
          {required && <span className="text-warning-500">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <div
          className={`w-full h-13 px-4 rounded-lg border flex items-center justify-between cursor-pointer overflow-hidden
            ${!disabled
              ? "bg-white border-pneutral-300"
              : "bg-neutral-50 border-neutral-300 cursor-not-allowed"
            }
            ${error ? "border-red-500" : ""}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2 flex-1">
            {icon && <span className="text-pneutral-500 shrink-0">{icon}</span>}
            <span className={`text-pneutral-500 truncate ${!selectedValues.length ? "text-pneutral-900" : ""}`}>
              {displayText}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-pneutral-800 transition-transform shrink-0 ml-2 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </div>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {showSelectAll && options.length > 0 && (
                <div
                  className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200"
                  onClick={toggleSelectAll}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={() => { }}
                    className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
                  />
                  <label className="ml-3 text-sm font-medium text-[#4B0082] cursor-pointer">
                    Select All
                  </label>
                </div>
              )}

              {options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                  onClick={() => toggleOption(option.value)}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => { }}
                    className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
                  />
                  <label className="ml-3 text-sm text-neutral-900 cursor-pointer">
                    {option.label}
                  </label>
                </div>
              ))}

              {options.length === 0 && (
                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default CheckboxDropdown;