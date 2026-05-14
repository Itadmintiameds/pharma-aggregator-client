"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

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
  label?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const Dropdown: React.FC<CommonDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option",
  isLoading = false,
  isDisabled = false,
  label,
  error,
  required = false,
  icon,
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === String(value));
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = (selectedValue: string, selectedLabel: string) => {
    onChange(selectedValue, selectedLabel);
    setIsOpen(false);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          {icon && <span className="text-neutral-600 text-lg">{icon}</span>}
          {label}
          {required && <span className="text-warning-500">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <div
          className={`w-full h-14 px-4 rounded-xl border flex items-center justify-between cursor-pointer overflow-hidden
            ${!isDisabled && !isLoading
              ? "bg-white border-secondary-200 hover:border-primary-900"
              : "bg-neutral-50 border-neutral-100 cursor-not-allowed"
            }
            ${error ? "border-red-500" : ""}
          `}
          onClick={() => {
            if (!isDisabled && !isLoading) {
              setIsOpen(!isOpen);
            }
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            {icon && <span className="text-neutral-500 shrink-0">{icon}</span>}
            <span className={`${!selectedOption ? "text-neutral-500" : "text-neutral-900"} truncate`}>
              {isLoading ? "Loading..." : displayValue}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-neutral-500 transition-transform shrink-0 ml-2 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isOpen && !isDisabled && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {options.length > 0 ? (
                options.map((opt) => (
                  <div
                    key={opt.value}
                    className={`px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0
                      ${String(value) === opt.value ? "bg-purple-50 text-primary-900 font-medium" : "text-neutral-900"}
                    `}
                    onClick={() => handleSelect(opt.value, opt.label)}
                  >
                    <span className="text-sm">{opt.label}</span>
                  </div>
                ))
              ) : (
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

export default Dropdown;