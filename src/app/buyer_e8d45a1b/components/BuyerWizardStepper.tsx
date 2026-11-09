"use client";

import React from "react";
import { Check } from "lucide-react";

interface Props {
  step: number; // 1-based index into `titles`
  titles: string[];
}

// 5-point horizontal tracker shown above the registration wizard's step
// content (Organization/Contact/License/GST/Bank) — distinct from
// BuyerOnboardingStepper's 3-point hub tracker (Profile Setup/Business
// Verification/Account Activated), which uses a different completed/pending
// color language. Here the *current* step reads as a filled purple circle
// with bold purple text (not just "pending"), matching Figma
// node-id=5-3592 — past steps show a green check, future steps stay gray.
export default function BuyerWizardStepper({ step, titles }: Props) {
  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-5 flex items-center">
      {titles.map((title, index) => {
        const stepNumber = index + 1;
        const isCompleted = step > stepNumber;
        const isCurrent = step === stepNumber;

        return (
          <React.Fragment key={title}>
            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-full text-p3 font-body font-semibold shrink-0 ${
                  isCompleted
                    ? "bg-success-500 text-white"
                    : isCurrent
                      ? "bg-secondary-700 text-white"
                      : "bg-neutral-100 border border-neutral-200 text-pneutral-500"
                }`}
              >
                {isCompleted ? <Check size={16} /> : stepNumber}
              </div>
              <h3
                className={`max-w-[130px] text-p3 font-body leading-tight ${
                  isCompleted || isCurrent ? "font-semibold text-secondary-700" : "font-medium text-pneutral-500"
                }`}
              >
                {title}
              </h3>
            </div>

            {index !== titles.length - 1 && (
              <div
                className={`flex-1 border-t-2 border-dashed mx-4 ${isCompleted ? "border-success-400" : "border-secondary-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
