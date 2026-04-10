import React from "react";

interface InputProps {
  label: string;
  name: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  readOnly?: boolean;
  labelClassName?: string;
  min?: number | string;
  max?: number | string;
  step?: number;
  maxLength?: number;
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  id,
  placeholder,
  required = false,
  type = "text",
  className = "",
  value,
  onChange,
  onInput,
  disabled = false,
  error,
  readOnly,
  labelClassName,
  min,
  max,
  step,
  maxLength,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id || name}
        className={`text-label-l3 font-semibold ${labelClassName || "text-neutral-700"}`}
      >
        {label}
        {required && (
          <span className="text-warning-500 font-semibold ml-1">*</span>
        )}
      </label>

      <input
        type={type}
        name={name}
        id={id || name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onInput={onInput}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        onKeyDown={(e) => {
          if (type === "number") {
            if (["e", "E", "+", "-", "."].includes(e.key)) {
              e.preventDefault();
            }
          }
        }}
        className={`px-4 w-full h-14 rounded-2xl
          border ${
            error
              ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
              : "border-neutral-500 focus:border-[#4B0082]"
          }
          focus:outline-none focus:ring-0
          transition-colors duration-200 ${className}`}
      />

      {error && <p className="text-[#FF3B3B] text-sm px-1">{error}</p>}
    </div>
  );
};

export default Input;
