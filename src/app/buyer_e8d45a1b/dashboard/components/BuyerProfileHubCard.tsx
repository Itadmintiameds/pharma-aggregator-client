"use client";

import React from "react";
import { Building2, UserRound, FileText, Landmark, ChevronRight } from "lucide-react";
import { BuyerSectionCompletion, BUYER_SECTION_COUNT, getCompletedSectionCount } from "@/src/utils/buyerSectionCompletion";

export type BuyerHubSectionKey = "org" | "contact" | "license" | "gst";
// Passed to onSectionClick by the "Continue Registration" button once every
// section above is already Completed — there's no next incomplete section
// to jump to, so it goes straight to Review & Submit instead of falling
// back to the first section again.
export type BuyerHubTarget = BuyerHubSectionKey | "review";

interface SectionDef {
  key: BuyerHubSectionKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SECTIONS: SectionDef[] = [
  { key: "org", title: "Organization Details", description: "Company name, address, type and other details", icon: Building2 },
  { key: "contact", title: "Buyer Contact Details", description: "Primary and alternate contact information", icon: UserRound },
  { key: "license", title: "License Details", description: "Upload valid drug licence issued by authority", icon: FileText },
  { key: "gst", title: "GST Details", description: "Add your GST number and tax information", icon: Landmark },
];

interface Props {
  completion: BuyerSectionCompletion;
  onSectionClick: (section: BuyerHubTarget) => void;
}

// "Complete your Buyer Profile" hub card — replaces the old single embedded
// wizard with a per-section overview (Completed/Pending badges + overall
// progress). Bank/Billing has no backend support (see
// buyerSectionCompletion.ts) so it has no row here at all.
export default function BuyerProfileHubCard({ completion, onSectionClick }: Props) {
  const completedCount = getCompletedSectionCount(completion);
  const percent = Math.round((completedCount / BUYER_SECTION_COUNT) * 100);
  const firstIncomplete = SECTIONS.find((s) => !completion[s.key]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-h4 font-heading font-medium text-pneutral-900">Complete your Buyer Profile</h2>
        <p className="text-p3 font-body font-regular text-pneutral-600 mt-1">
          You&apos;re almost ready to start sourcing medicines from verified suppliers.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-p3 font-body">
          <span className="text-pneutral-700">
            {completedCount} of {BUYER_SECTION_COUNT} sections completed
          </span>
          <span className="font-semibold text-primary-800">{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div className="h-full rounded-full bg-primary-800 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="flex flex-col divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isCompleted = completion[section.key];

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => onSectionClick(section.key)}
              className="flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-neutral-50"
            >
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 ${
                  isCompleted ? "border-success-200 bg-success-50 text-success-600" : "border-primary-100 bg-primary-100 text-primary-800"
                }`}
              >
                <Icon size={18} />
              </span>

              <span className="flex-1 min-w-0">
                <span className="block text-p3 font-body font-semibold text-pneutral-900">{section.title}</span>
                <span className="block text-p2 font-body font-regular text-pneutral-500 truncate">{section.description}</span>
              </span>

              <span
                className={`px-3.5 py-1.5 rounded-full border text-p3 font-body font-semibold shrink-0 ${
                  isCompleted ? "bg-success-50 border-success-200 text-success-600" : "bg-white border-warning-300 text-warning-600"
                }`}
              >
                {isCompleted ? "Completed" : "Pending"}
              </span>

              <ChevronRight size={18} className="text-pneutral-400 shrink-0" />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onSectionClick(firstIncomplete?.key ?? "review")}
        className="self-start flex items-center gap-2 h-12 px-6 rounded-xl bg-primary-800 text-white text-p3 font-body font-semibold"
      >
        {firstIncomplete ? "Continue Registration" : "Review & Submit"}
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
