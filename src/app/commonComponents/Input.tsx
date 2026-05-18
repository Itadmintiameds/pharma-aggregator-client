/*
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
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
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
  onKeyDown,
  onFocus,
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
          onKeyDown?.(e);
        }}
        onFocus={onFocus}
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
*/

import React, { forwardRef } from "react";

// 1. Define types for our variants
export type InputSize = "sm" | "md" | "lg";
export type InputState = "enabled" | "active" | "error" | "success" | "readonly" | "disabled";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  sizeVariant?: InputSize;
  error?: string;
  success?: string;
  hint?: string;
  labelClassName?: string;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  name,
  id,
  sizeVariant = "md",
  error,
  success,
  hint,
  disabled = false,
  readOnly = false,
  className = "",
  labelClassName = "",
  containerClassName = "",
  type = "text",
  onKeyDown,
  ...props
}, ref) => {
  const inputId = id || name;

  // 2. Size Mapping (Height, Padding, Text Size)
  const sizeStyles: Record<InputSize, string> = {
    sm: "h-10 px-3 text-sm rounded-xl",
    md: "h-14 px-4 text-base rounded-2xl",
    lg: "h-16 px-5 text-lg rounded-2xl",
  };

  // 3. State Mapping (Borders, Backgrounds, Text Colors)
  const getVariantStyles = (): string => {
    if (disabled) return "border-[#D5D5D4] bg-[#E1E1E1] text-[#969793] cursor-not-allowed";
    if (readOnly) return "border-[#EAEAE9] bg-[#F8F8F9] text-[#3C3D3A] cursor-default";
    if (error) return "border-[#FF3B3B] text-[#3C3D3A] bg-white focus:border-[#FF3B3B] focus:ring-1 focus:ring-[#FF3B3B]";
    if (success) return "border-[#378200] text-[#3C3D3A] bg-white focus:border-[#378200] focus:ring-1 focus:ring-[#378200]";
    
    // Default (Enabled) / Active State
    return "border-neutral-500 text-[#3C3D3A] bg-white focus:border-[#C4AAFD] focus:ring-1 focus:ring-[#C4AAFD]";
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
      {/* Label Logic */}
      <label
        htmlFor={inputId}
        className={`text-label-l3 font-semibold transition-colors duration-200 ${
          disabled ? "text-[#969793]" : "text-[#1E1E1D]"
        } ${labelClassName}`}
      >
        {label}
        {props.required && <span className="text-[#FF3B3B] ml-1">*</span>}
      </label>

      {/* Input Field */}
      <input
        {...props}
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        disabled={disabled}
        readOnly={readOnly}
        onKeyDown={(e) => {
          // Prevent scientific notation in number inputs
          if (type === "number" && ["e", "E", "+", "-", "."].includes(e.key)) {
            e.preventDefault();
          }
          onKeyDown?.(e);
        }}
        className={`
          w-full border outline-none transition-all duration-200
          ${sizeStyles[sizeVariant]}
          ${getVariantStyles()}
          ${className}
        `}
      />

      {/* Supporting Text (Hint / Error / Success) */}
      {(error || success || hint) && (
        <p
          className={`text-xs px-1 font-medium ${
            error ? "text-[#FF3B3B]" : success ? "text-[#378200]" : "text-neutral-500"
          }`}
        >
          {error || success || hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
