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
    <div className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-5 flex items-center">
      {steps.map((item, index) => {
        const stepNumber = index + 1;
        const isCompleted = step > stepNumber;

        return (
          <React.Fragment key={item.title}>
            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-p3 font-body font-semibold shrink-0 ${
                  isCompleted ? "bg-success-500 text-white" : "bg-neutral-100 border border-neutral-200 text-pneutral-600"
                }`}
              >
                {isCompleted ? <Check size={16} /> : stepNumber}
              </div>
              <div className="max-w-[220px]">
                <h3 className={`text-p3 font-body font-semibold leading-tight ${isCompleted ? "text-pneutral-900" : "text-pneutral-700"}`}>
                  {item.title}
                </h3>
                <p className="text-p4 font-body font-regular text-pneutral-500 leading-snug mt-0.5">{item.description}</p>
              </div>
            </div>

            {index !== steps.length - 1 && (
              <div
                className={`flex-1 border-t-2 border-dashed mx-4 ${isCompleted ? "border-success-400" : "border-secondary-300"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
