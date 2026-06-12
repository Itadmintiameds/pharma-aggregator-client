import React, { useEffect, useRef, useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface NumericInputWithUnitProps {
  label: string;
  name: string;
  value: string | number;
  unit: string;
  onValueChange: (val: string) => void;
  onUnitChange: (unit: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  options: Option[];

  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
}

const NumericInputWithUnit: React.FC<NumericInputWithUnitProps> = ({
  label,
  name,
  value,
  unit,
  onValueChange,
  onUnitChange,
  placeholder = "",
  error,
  required = false,
  disabled = false,
  readOnly = false,
  options,
  min,
  max,
  step = 1,
  maxLength,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let val = e.target.value;

    if (maxLength) {
      val = val.slice(0, maxLength);
    }

    if (val === "" || /^\d*$/.test(val)) {
      onValueChange(val);
    }
  };

  const selectedOption = options.find(
    (option) => option.value === unit
  );

  const getBorderColor = () => {
    if (disabled)
      return "border-pneutral-300 bg-sneutral-100 cursor-not-allowed";

    if (readOnly)
      return "border-pneutral-300 bg-pneutral-50 cursor-default";

    if (error)
      return "border-warning-500 focus-within:ring-1 focus-within:ring-warning-500";

    return "border-pneutral-300 focus-within:border-secondary-300 focus-within:ring-1 focus-within:ring-secondary-300";
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-1 w-full relative"
    >
      <label
        className={`font-medium text-[16px] leading-6 ${
          disabled
            ? "text-pneutral-500"
            : "text-pneutral-900"
        }`}
      >
        {label}
        {required && (
          <span className="text-warning-500 ml-1">*</span>
        )}
      </label>

      <div
        className={`flex items-center h-[52px] w-full border rounded-lg overflow-hidden bg-white transition-all ${getBorderColor()}`}
      >
        <input
          type="number"
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled || readOnly}
          className="flex-1 h-full px-4 outline-none border-none bg-transparent text-pneutral-800 placeholder:text-pneutral-500"
        />

        <div className="h-full border-l border-neutral-300" />

        <button
          type="button"
          disabled={disabled || readOnly}
          onClick={() => setIsOpen((prev) => !prev)}
          className="min-w-[160px] h-full px-4 bg-pneutral-50 flex items-center justify-between hover:bg-neutral-100 disabled:opacity-60"
        >
          <span
            className={
              selectedOption
                ? "text-pneutral-800"
                : "text-pneutral-500"
            }
          >
            {selectedOption?.label || "Select Unit"}
          </span>

          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-[160px] bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onUnitChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-neutral-100 ${
                  unit === option.value
                    ? "bg-neutral-50 font-semibold"
                    : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-warning-500 px-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default NumericInputWithUnit;