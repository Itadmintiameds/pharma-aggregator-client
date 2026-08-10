"use client";

import React from "react";

interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  required?: boolean;
  // Presence triggers the red border + error text below the field.
  error?: string;
  // Gray supporting text shown only when there's no error.
  hint?: string;
  leftIcon?: React.ReactNode;
  // Anything rendered inside the input on the right - a spinner overlay, a
  // static icon (e.g. Hash for account numbers), etc.
  rightSlot?: React.ReactNode;
  uppercase?: boolean;
  // Escape hatch for one-off needs a fixed set of props can't cover (e.g.
  // split-pill rounding on a compound phone-with-country-code field).
  inputClassName?: string;
  containerClassName?: string;
  // Suppresses the built-in error/hint <p> below the input while still
  // using `error` to drive the border color - for compound fields (e.g. a
  // country-code button + this input side by side) where this input only
  // occupies part of a row's width, so its own error text would render
  // narrower/offset instead of spanning the whole field. The caller renders
  // one shared error message outside the row instead.
  hideMessage?: boolean;
}

// Shared text/email/tel/number input for the seller registration wizard -
// every field using this gets the same default/focus/error/disabled
// treatment for free. Callers keep their own validation/error-selection
// logic exactly as before; they just pass whichever message is currently
// active into `error`.
export default function FormInput({
  label,
  required,
  error,
  hint,
  leftIcon,
  rightSlot,
  uppercase,
  inputClassName = "",
  containerClassName = "",
  hideMessage,
  disabled,
  id,
  ...inputProps
}: FormInputProps) {
  const stateBorder = error
    ? "border-red-500"
    : disabled
      ? "border-neutral-300"
      : "border-neutral-500";

  const stateBg = disabled ? "bg-neutral-100" : "bg-white";
  const stateText = disabled ? "text-pneutral-500" : "text-pneutral-900";

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]"
        >
          {label}
          {required && (
            <span className="text-warning-500 font-semibold ml-1">*</span>
          )}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-pneutral-900">
            {leftIcon}
          </div>
        )}

        <input
          id={id}
          disabled={disabled}
          className={`w-full h-13 ${leftIcon ? "pl-10" : "pl-5"} ${
            rightSlot ? "pr-10" : "pr-4"
          } rounded-xl border ${stateBorder} ${stateBg} ${stateText} focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 text-p4 font-body font-regular placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500 disabled:cursor-not-allowed ${
            uppercase ? "uppercase" : ""
          } ${inputClassName}`}
          {...inputProps}
        />

        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>

      {!hideMessage && (error ? (
        <p className="text-p2 font-body font-regular text-red-500 flex items-start mt-1">
          <span className="mr-1">⚠️</span>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-p2 font-body font-regular text-pneutral-500 mt-1">
          {hint}
        </p>
      ) : null)}
    </div>
  );
}
