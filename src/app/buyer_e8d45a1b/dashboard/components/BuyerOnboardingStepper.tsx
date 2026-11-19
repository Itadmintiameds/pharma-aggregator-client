"use client";

import React from "react";
import { Check } from "lucide-react";

export interface BuyerOnboardingStepDef {
  title: string;
  description: string;
}

interface Props {
  step: number; // 1-based index into `steps`
  steps: BuyerOnboardingStepDef[];
}

// 3-point horizontal stepper card for the dashboard gate: a numbered/checked
// circle beside its label (not stacked above it), joined by dashed
// connectors — matches the "Buyer Account Activation" reference design.
// Unlike seller's OnboardingStepper.tsx (hardcoded labels), this accepts
// `steps` as a prop — there's only one caller today (BuyerOnboardingGate).
export default function BuyerOnboardingStepper({ step, steps }: Props) {
  return (
    <div className="flex w-full items-center rounded-xl border border-neutral-200 bg-white px-4 py-3">
      {steps.map((item, index) => {
        const stepNumber = index + 1;
        const isCompleted = step > stepNumber;

        return (
          <React.Fragment key={item.title}>
            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-body font-semibold shrink-0 ${
                  isCompleted ? "bg-success-500 text-white" : "bg-neutral-100 border border-neutral-200 text-pneutral-600"
                }`}
              >
                {isCompleted ? <Check size={14} /> : stepNumber}
              </div>
              <div className="max-w-[220px]">
                <h3 className={`text-[13px] font-body font-semibold leading-tight ${isCompleted ? "text-pneutral-900" : "text-pneutral-700"}`}>
                  {item.title}
                </h3>
                <p className="mt-0.5 text-[11px] leading-snug text-pneutral-500">{item.description}</p>
              </div>
            </div>

            {index !== steps.length - 1 && (
              <div
                className={`flex-1 border-t-2 border-dashed mx-3 ${isCompleted ? "border-success-400" : "border-secondary-300"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
