"use client";

import React from "react";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface Props {
  step: number; // 1 = Registration Details, 2 = Admin Approval, 3 = Registration Complete
}

const steps = [
  {
    title: "Registration Details",
    description: "Company, coordinator, documents, bank & review",
    icon: HiClipboardDocumentList,
  },
  {
    title: "Admin Approval",
    description: "Submitted for admin review",
    icon: ShieldCheck,
  },
  {
    title: "Registration Complete",
    description: "Approved & ready to sell",
    icon: CheckCircle2,
  },
];

export default function OnboardingStepper({ step }: Props) {
  return (
    <div className="flex items-start justify-center w-full max-w-2xl mx-auto py-3">
      {steps.map((item, index) => {
        const stepNumber = index + 1;
        const isActive = step === stepNumber;
        const isCompleted = step > stepNumber;
        const Icon = item.icon;

        return (
          <div key={item.title} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center text-center w-32 sm:w-40">
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-lg shadow-sm
                  ${isActive ? "bg-primary-05" : isCompleted ? "bg-primary-30" : "bg-neutral-50"}`}
              >
                <Icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <h3 className="mt-1.5 text-xs font-heading font-semibold text-pneutral-900">
                {item.title}
              </h3>
              <p className="mt-0.5 text-[11px] font-heading font-normal text-pneutral-600">
                {item.description}
              </p>
            </div>

            {index !== steps.length - 1 && (
              <div
                className={`h-1 flex-1 mt-4 rounded-full opacity-60
                  ${step > stepNumber ? "bg-secondary-600" : "bg-primary-300"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
