"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Matches the Figma "Input" component's size scale (see
// docs/INPUT_COMPONENT_SPEC.md). "lg" is the default and reproduces the
// exact pixel values every existing call site already relies on.
type FormInputSize = "xs" | "sm" | "md" | "lg";

interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  label?: string;
  required?: boolean;
  // Presence triggers the red border + error text below the field.
  error?: string;
  // Presence triggers the green border + success text below the field.
  // Ignored while `error` is set - error always wins.
  success?: string;
  // Gray supporting text shown only when there's no error/success.
  hint?: string;
  // Shows a spinner in the field and disables interaction, e.g. while an
  // async validation (OTP send, IFSC lookup) is in flight.
  loading?: boolean;
  leftIcon?: React.ReactNode;
  // Anything rendered inside the input on the right - a spinner overlay, a
  // static icon (e.g. Hash for account numbers), etc.
  rightSlot?: React.ReactNode;
  uppercase?: boolean;
  size?: FormInputSize;
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

const SIZE_FIELD_CLASSES: Record<FormInputSize, string> = {
  xs: "h-8 text-p2",
  sm: "h-9 text-p2",
  md: "h-11 text-p3",
  lg: "h-13 text-p4",
};

const SIZE_LABEL_CLASSES: Record<FormInputSize, string> = {
  xs: "text-label-l2 leading-[18px]",
  sm: "text-label-l3 leading-[20px]",
  md: "text-label-l4 leading-[24px]",
  lg: "text-label-l4 leading-[24px]",
};

// Matches the Figma spec's "exclamation-circle/outline" and check-circle
// helper-row icon sizes (12/12/14/16px for xs/sm/md/lg).
const SIZE_HELPER_ICON_CLASSES: Record<FormInputSize, string> = {
  xs: "w-3 h-3",
  sm: "w-3 h-3",
  md: "w-3.5 h-3.5",
  lg: "w-4 h-4",
};

// "lg" reproduces the exact pl-5/pr-4/pl-10/pr-10 values every existing
// call site already relies on; the other sizes scale down proportionally.
const SIZE_PADDING: Record<
  FormInputSize,
  { left: string; leftIcon: string; right: string; rightSlot: string }
> = {
  xs: { left: "pl-2", leftIcon: "pl-7", right: "pr-2", rightSlot: "pr-7" },
  sm: { left: "pl-3", leftIcon: "pl-8", right: "pr-3", rightSlot: "pr-8" },
  md: { left: "pl-3", leftIcon: "pl-9", right: "pr-3", rightSlot: "pr-9" },
  lg: { left: "pl-5", leftIcon: "pl-10", right: "pr-4", rightSlot: "pr-10" },
};

// Shared text/email/tel/number input for the seller registration wizard -
// every field using this gets the same default/focus/error/disabled
// treatment for free. Callers keep their own validation/error-selection
// logic exactly as before; they just pass whichever message is currently
// active into `error`.
export default function FormInput({
  label,
  required,
  error,
  success,
  hint,
  loading,
  leftIcon,
  rightSlot,
  uppercase,
  size = "lg",
  inputClassName = "",
  containerClassName = "",
  hideMessage,
  disabled,
  readOnly,
  id,
  ...inputProps
}: FormInputProps) {
  // Precedence matches the Figma states doc (docs/INPUT_COMPONENT_SPEC.md
  // ##5): error beats success beats loading beats read-only beats disabled.
  const stateBorder = error
    ? "border-red-500"
    : success
      ? "border-success-900"
      : loading
        ? "border-pneutral-300"
        : disabled
          ? "border-neutral-300"
          : "border-neutral-500";

  const stateBg = disabled
    ? "bg-neutral-100"
    : loading
      ? "bg-pneutral-100"
      : readOnly
        ? "bg-pneutral-50"
        : "bg-white";

  const stateText = disabled ? "text-pneutral-500" : "text-pneutral-900";

  const pad = SIZE_PADDING[size];
  const showSpinner = loading && !rightSlot;

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className={`font-heading font-medium text-pneutral-900 ${SIZE_LABEL_CLASSES[size]}`}
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
          readOnly={readOnly || loading}
          className={`w-full ${SIZE_FIELD_CLASSES[size]} ${
            leftIcon ? pad.leftIcon : pad.left
          } ${
            rightSlot || showSpinner ? pad.rightSlot : pad.right
          } rounded-xl border ${stateBorder} ${stateBg} ${stateText} focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 font-body font-regular placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500 disabled:cursor-not-allowed ${
            uppercase ? "uppercase" : ""
          } ${inputClassName}`}
          {...inputProps}
        />

        {showSpinner ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span
              aria-hidden
              className="block w-4 h-4 rounded-full border-2 border-white border-t-info-500 animate-spin"
            />
          </div>
        ) : (
          rightSlot && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightSlot}
            </div>
          )
        )}
      </div>

      {!hideMessage && (error ? (
        <p className="text-p2 font-body font-regular text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle
            className={`${SIZE_HELPER_ICON_CLASSES[size]} shrink-0 text-warning-500`}
          />
          <span>{error}</span>
        </p>
      ) : success ? (
        <p className="text-p2 font-body font-regular text-success-900 flex items-center gap-1 mt-1">
          <CheckCircle2
            className={`${SIZE_HELPER_ICON_CLASSES[size]} shrink-0 text-success-900`}
          />
          <span>{success}</span>
        </p>
      ) : hint ? (
        <p className="text-p2 font-body font-regular text-pneutral-500 mt-1">
          {hint}
        </p>
      ) : null)}
    </div>
  );
}
