"use client";

import React from "react";

export interface BuyerOnboardingStepDef {
  title: string;
  description: string;
  // Widened beyond lucide-react's LucideIcon so callers can mix in
  // react-icons components (e.g. HiClipboardDocumentList) without a type
  // error — both icon families accept size/className props.
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface Props {
  step: number; // 1-based index into `steps`
  steps: BuyerOnboardingStepDef[];
}

// 3-point visual stepper for the dashboard gate. Unlike seller's
// OnboardingStepper.tsx (which hardcodes its 3 step labels/icons inline),
// this accepts `steps` as a prop — there's only one caller today
// (BuyerOnboardingGate), but hardcoding here would repeat the same
// inflexibility the seller version already has, with no reason to.
export default function BuyerOnboardingStepper({ step, steps }: Props) {
  return (
    <div className="flex items-start justify-center w-full max-w-2xl mx-auto py-8">
      {steps.map((item, index) => {
        const stepNumber = index + 1;
        const isActive = step === stepNumber;
        const isCompleted = step > stepNumber;
        const Icon = item.icon;

        return (
          <div key={item.title} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center text-center w-32 sm:w-40">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl shadow-md
                  ${isActive ? "bg-primary-05" : isCompleted ? "bg-primary-30" : "bg-neutral-50"}`}
              >
                <Icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <h3 className="mt-3 text-label-l5 font-heading font-semibold text-pneutral-900">{item.title}</h3>
              <p className="mt-1 text-label-l2 font-heading font-light text-pneutral-600">{item.description}</p>
            </div>

            {index !== steps.length - 1 && (
              <div
                className={`h-1 flex-1 mt-5 sm:mt-6 rounded-full opacity-60
                  ${step > stepNumber ? "bg-secondary-600" : "bg-primary-300"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
