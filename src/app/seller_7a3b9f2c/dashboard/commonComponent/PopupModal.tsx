import React from "react";

type PopupModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  primaryActionText?: string;
  secondaryActionText?: string;
  tertiaryActionText?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onTertiaryAction?: () => void;
  onClose?: () => void;
};

export default function PopupModal({
  isOpen,
  title,
  description,
  primaryActionText = "Confirm",
  secondaryActionText,
  tertiaryActionText,
  onPrimaryAction,
  onSecondaryAction,
  onTertiaryAction,
  onClose,
}: PopupModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-open-sans">
      <div className="bg-white rounded-2xl w-125.25 h-90.5 p-6 shadow-xl relative">

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <img
            src="/icons/PopupIcon.svg"
            alt="upload"
            className="w-20 h-20 object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="text-h5 font-bold text-center text-pneutral-900">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-center text-p4 font-normal text-pneutral-700 whitespace-nowrap py-5">
            {description}
          </p>
        )}

        {/* Actions */}
       <div className="mt-2 flex flex-col items-center gap-3 w-full">
          {/* Primary Button */}
          {primaryActionText && (
            <button
              onClick={onPrimaryAction}
              className="w-100 h-12 bg-primary-900 text-white py-3 rounded-lg text-label-l4 font-semibold cursor-pointer"
            >
              {primaryActionText}
            </button>
          )}

          {/* Secondary + Tertiary */}
          <div className="flex gap-3 mt-1">
            {secondaryActionText && (
              <button
                onClick={onSecondaryAction}
                className="w-48.5 h-12 flex-1 border border-pneutral-200 py-2 rounded-lg text-label-l4 font-semibold text-pneutral-900 cursor-pointer"
              >
                {secondaryActionText}
              </button>
            )}

            {tertiaryActionText && (
              <button
                onClick={onTertiaryAction}
                className="w-48.5 h-12 flex-1 border-2 border-primary-900 text-primary-900 text-label-l4 font-semibold py-2 rounded-lg cursor-pointer"
              >
                {tertiaryActionText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
