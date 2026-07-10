import React from "react";
import { Check } from "lucide-react";

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

// Same celebratory look as StockUpdateModal's post-update SuccessView, so
// finishing "Add Product" feels consistent with finishing a stock update.
const CONFETTI = [
  { top: "6%", left: "10%", color: "#A855F7", rotate: "18deg" },
  { top: "10%", left: "86%", color: "#22C55E", rotate: "-15deg" },
  { top: "78%", left: "8%", color: "#3B82F6", rotate: "30deg" },
  { top: "82%", left: "88%", color: "#FBBF24", rotate: "-25deg" },
  { top: "44%", left: "4%", color: "#FBBF24", rotate: "10deg" },
  { top: "40%", left: "94%", color: "#A855F7", rotate: "-10deg" },
];

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
      <div className="bg-white rounded-2xl w-125.25 p-8 pt-10 shadow-xl relative overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="absolute w-2 h-2 rounded-sm"
            style={{
              top: c.top,
              left: c.left,
              background: c.color,
              transform: `rotate(${c.rotate})`,
            }}
          />
        ))}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-18 h-18 rounded-full bg-[#DCFCE7] flex items-center justify-center">
            <div className="w-13 h-13 rounded-full bg-[#16A34A] flex items-center justify-center">
              <Check size={28} color="white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-h5 font-bold text-center text-[#15803D]">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-center text-p4 font-normal text-pneutral-700 py-5">
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
