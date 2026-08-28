"use client";

import React from "react";
import { Check, Headset } from "lucide-react";
import { RawTempBuyer } from "@/src/services/buyer/buyerRegistrationService";
import { BuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { BuyerSectionCompletion } from "@/src/utils/buyerSectionCompletion";

interface ChecklistItem {
  label: string;
  done: boolean;
  // Only ever populated where a real timestamp exists (reviewHistories) —
  // no created/updated timestamps exist on RawTempBuyer, so most items show
  // no date rather than a fabricated one (see buyerSectionCompletion.ts).
  timestamp?: string;
}

interface Props {
  tempBuyer: RawTempBuyer | null;
  status: BuyerOnboardingStatus;
  completion: BuyerSectionCompletion;
}

function formatTimestamp(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + ", " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// Right-side vertical timeline for the onboarding hub. No section-level
// created/updated timestamps exist on RawTempBuyer (confirmed — only
// reviewHistories[].reviewedAt is real), so every item's checked state is
// derived from section completion / status, and only the one item with a
// genuine matching admin review timestamp shows a date; everything else
// shows "Done" once checked, nothing fabricated.
export default function BuyerOnboardingChecklist({ tempBuyer, status, completion }: Props) {
  const submitted = status === "submitted" || status === "under_review" || status === "approved";
  const latestReview = tempBuyer?.reviewHistories?.length
    ? tempBuyer.reviewHistories.reduce((a, b) => (new Date(b.reviewedAt ?? 0).getTime() > new Date(a.reviewedAt ?? 0).getTime() ? b : a))
    : undefined;

  const items: ChecklistItem[] = [
    { label: "Account created", done: !!tempBuyer },
    { label: "Buyer contact details", done: completion.contact },
    { label: "Upload drug licence", done: completion.license },
    { label: "Add GST details", done: completion.gst },
    { label: "Submit for verification", done: submitted, timestamp: submitted ? formatTimestamp(latestReview?.reviewedAt) : undefined },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col gap-6 h-fit">
      <h2 className="text-h5 font-heading font-medium text-pneutral-900">Your activation checklist</h2>

      <ol className="flex flex-col">
        {items.map((item, index) => (
          <li key={item.label} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full shrink-0 border-2 ${
                  item.done ? "bg-success-500 border-success-700" : "bg-white border-neutral-200"
                }`}
              >
                {item.done && <Check size={14} className="text-white" strokeWidth={3.5} />}
              </div>
              {index !== items.length - 1 && (
                <div
                  className={`w-0 flex-1 min-h-[28px] my-1 border-l-2 border-dashed ${
                    item.done ? "border-secondary-500" : "border-neutral-200"
                  }`}
                />
              )}
            </div>
            <div className="pb-6">
              <p className={`text-p3 font-body font-semibold ${item.done ? "text-pneutral-900" : "text-pneutral-500"}`}>{item.label}</p>
              {item.timestamp && <p className="text-p4 font-body font-regular text-pneutral-500 mt-0.5">{item.timestamp}</p>}
            </div>
          </li>
        ))}
      </ol>

      <a
        href="mailto:support@tiameds.ai"
        className="flex items-center justify-between gap-2 rounded-xl bg-primary-100 px-4 py-3.5 text-p3 font-body font-semibold text-secondary-700"
      >
        <span className="flex items-center gap-2">
          <Headset size={18} className="shrink-0" />
          Need help? Contact our support team
        </span>
        <span aria-hidden className="shrink-0">→</span>
      </a>
    </div>
  );
}
