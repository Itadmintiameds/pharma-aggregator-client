import React, { useEffect } from "react";
import { Check, X } from "lucide-react";
import confetti from "canvas-confetti";

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
  celebrate?: boolean;
};

// Google brand colors
const CONFETTI_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

function celebrate() {
  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: CONFETTI_COLORS,
    zIndex: 60,
  });

  const end = Date.now() + 2000;
  const shower = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: CONFETTI_COLORS,
      zIndex: 60,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: CONFETTI_COLORS,
      zIndex: 60,
    });
    if (Date.now() < end) requestAnimationFrame(shower);
  };
  shower();
}

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
  celebrate: shouldCelebrate = true,
}: PopupModalProps) {
  useEffect(() => {
    if (isOpen && shouldCelebrate) celebrate();
  }, [isOpen, shouldCelebrate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-open-sans">
      <div className="bg-white rounded-2xl w-125.25 p-8 pt-10 shadow-xl relative overflow-hidden">
        {/* Close */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-pneutral-500 hover:bg-pneutral-100 hover:text-pneutral-900 cursor-pointer"
          >
            <X size={20} />
          </button>
        )}

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
