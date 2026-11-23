import React, { useEffect, useId, useRef, useState } from "react";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const typedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useId();
  const interactive = !disabled && !readOnly;

  const closeList = () => {
    setIsOpen(false);
    setTyped("");
  };

  const openList = () => {
    if (!interactive) return;
    const idx = options.findIndex((o) => o.value === unit);
    setActiveIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
  };

  const commit = (opt?: Option) => {
    if (!opt || !interactive) return;
    onUnitChange(opt.value);
    closeList();
    triggerRef.current?.focus(); // Tab then continues to the next field
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setTyped("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(
    () => () => {
      if (typedTimer.current) clearTimeout(typedTimer.current);
    },
    [],
  );

  // keep the highlighted option visible
  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex]);

  // Jump to the first option starting with what was typed (type-ahead)
  const typeAhead = (ch: string) => {
    if (typedTimer.current) clearTimeout(typedTimer.current);
    const next = typed + ch.toLowerCase();
    setTyped(next);
    typedTimer.current = setTimeout(() => setTyped(""), 800);
    let idx = options.findIndex((o) => o.label.toLowerCase().startsWith(next));
    if (idx < 0) idx = options.findIndex((o) => o.label.toLowerCase().includes(next));
    if (idx >= 0) {
      setActiveIndex(idx);
      if (!isOpen) setIsOpen(true);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
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
          onKeyDown={(e) => {
            // whole numbers only: block exponent / sign / decimal characters in the number field
            if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled || readOnly}
          className="flex-1 h-full px-4 outline-none border-none bg-transparent text-pneutral-800 placeholder:text-pneutral-500"
        />

        <div className="h-full border-l border-neutral-300" />

        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${uid}-units` : undefined}
          aria-activedescendant={isOpen ? `${uid}-unit-${activeIndex}` : undefined}
          aria-label={`${label} unit`}
          disabled={disabled || readOnly}
          onClick={() => (isOpen ? closeList() : openList())}
          onKeyDown={handleTriggerKeyDown}
          onBlur={(e) => {
            if (!containerRef.current?.contains(e.relatedTarget as Node | null)) closeList();
          }}
          className="min-w-[160px] h-full px-4 bg-pneutral-50 flex items-center justify-between outline-none hover:bg-neutral-100 focus-visible:bg-purple-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-800 disabled:opacity-60"
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
          <div
            id={`${uid}-units`}
            role="listbox"
            aria-label={`${label} unit`}
            // keep focus on the trigger while clicking / scrolling the list
            onMouseDown={(e) => e.preventDefault()}
            className="absolute top-full right-0 mt-1 w-[160px] bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            {options.map((option, idx) => {
              const isSelected = unit === option.value;
              const isActive = activeIndex === idx;
              return (
                <div
                  key={option.value}
                  id={`${uid}-unit-${idx}`}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => commit(option)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full cursor-pointer border-l-4 px-4 py-2 text-left text-sm ${
                    isActive ? "border-l-primary-800 bg-purple-100" : "border-l-transparent"
                  } ${isSelected ? "font-semibold text-primary-900" : "text-neutral-900"} ${
                    isSelected && !isActive ? "bg-purple-50" : ""
                  }`}
                >
                  {option.label}
                </div>
              );
            })}
            {options.length === 0 && (
              <div className="px-4 py-3 text-center text-sm text-neutral-500">No units available</div>
            )}
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