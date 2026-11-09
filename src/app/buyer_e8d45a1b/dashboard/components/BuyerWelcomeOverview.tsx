"use client";

import React from "react";
import { CheckCircle2, RefreshCw, Clock } from "lucide-react";
import { BuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import BuyerUnlockGrid from "./BuyerUnlockGrid";

interface SetupItem {
  title: string;
  status: "not_started" | "in_progress" | "completed";
}

function statusBadge(status: SetupItem["status"]) {
  if (status === "completed") return { label: "Completed", className: "bg-success-50 text-success-600" };
  if (status === "in_progress") return { label: "In Progress", className: "bg-primary-100 text-secondary-700" };
  return { label: "Not Started", className: "bg-neutral-100 text-pneutral-500" };
}

const REVIEW_STATUSES: BuyerOnboardingStatus[] = ["submitted", "under_review", "correction_required", "rejected"];

// Derives the three-row Setup Progress list and the Application
// Submission/Under Review/Approved timeline from the buyer's real status —
// `status` omitted (or "draft" with no progress) reproduces this
// component's original always-0%-complete content for a genuinely
// brand-new buyer; any later status renders the real progress instead of
// falsely claiming "0% Complete" / "Not Started" for a buyer who has
// actually submitted, is under review, or is already approved.
function deriveSetupItems(status?: BuyerOnboardingStatus, hasAnyProgress?: boolean): SetupItem[] {
  const beyondDraft = !!status && status !== "draft";
  const profileSetupDone = beyondDraft || !!hasAnyProgress;
  const verificationDone = status === "approved";
  const verificationInProgress = !!status && REVIEW_STATUSES.includes(status);
  return [
    { title: "Profile Setup", status: profileSetupDone ? "completed" : "not_started" },
    { title: "Business Verification", status: verificationDone ? "completed" : verificationInProgress ? "in_progress" : "not_started" },
    { title: "Account Activated", status: verificationDone ? "completed" : "not_started" },
  ];
}

interface Props {
  onRegister: () => void;
  // Real onboarding status, when known — omit for the true "never started
  // registration" landing page this component was originally built for.
  status?: BuyerOnboardingStatus;
  hasAnyProgress?: boolean;
  percentComplete?: number;
  // Shown instead of onRegister once an application already exists
  // (beyondDraft) — routes to the read-only submitted-details recap rather
  // than the editable wizard, since "Register Your Business" wouldn't make
  // sense (or worse, would silently drop the buyer back into the fill-in
  // form) for someone who has already submitted.
  onViewDetails?: () => void;
}

// Landing page shown to a buyer with no submitted application in progress,
// or reached directly via "Back to Dashboard" from any onboarding status —
// see deriveSetupItems above for how it reflects real progress in that case.
export default function BuyerWelcomeOverview({ onRegister, status, hasAnyProgress, percentComplete, onViewDetails }: Props) {
  const setupItems = deriveSetupItems(status, hasAnyProgress);
  const percent = percentComplete ?? (setupItems.every((i) => i.status === "not_started") ? 0 : undefined);
  const beyondDraft = !!status && status !== "draft";
  const isApproved = status === "approved";
  const isUnderReview = !!status && REVIEW_STATUSES.includes(status);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-h4 font-heading font-semibold text-pneutral-900">Welcome to TiaMeds</h1>
          <p className="text-p3 font-body font-regular text-pneutral-600 mt-1">
            Complete your profile and verification to start sourcing medicines from verified suppliers.
          </p>
        </div>
        {beyondDraft ? (
          onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="h-12 px-6 rounded-xl bg-primary-800 text-white text-p3 font-body font-semibold shrink-0"
            >
              View Submitted Details
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={onRegister}
            className="h-12 px-6 rounded-xl bg-primary-800 text-white text-p3 font-body font-semibold shrink-0"
          >
            Register Your Business
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-p2 font-body font-bold text-pneutral-900">Setup Progress</h2>
            <p className="text-p4 font-body font-regular text-pneutral-500 mt-0.5">
              {percent !== undefined ? `${percent}% Complete` : isApproved ? "100% Complete" : "Awaiting admin review"}
            </p>
          </div>
          <div className="border-t border-neutral-200" />
          <div className="flex flex-col gap-4">
            {setupItems.map((item, index) => {
              const badge = statusBadge(item.status);
              return (
                <div key={item.title} className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 text-pneutral-500 text-p4 font-body font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-p3 font-body font-regular text-pneutral-900">{item.title}</span>
                  <span className={`px-3 py-1 rounded-md text-p4 font-body font-medium shrink-0 ${badge.className}`}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-p2 font-body font-bold text-pneutral-900 mb-6">Registration Status</h2>
          <div className="flex items-center">
            <StatusNode
              icon={CheckCircle2}
              label="Application Submission"
              sub={beyondDraft ? "Completed" : "Pending"}
              tone={beyondDraft ? "success" : "neutral"}
            />
            <div className={`flex-1 h-0.5 mx-2 ${beyondDraft ? "bg-gradient-to-r from-success-500 to-secondary-600" : "bg-neutral-200"}`} />
            <StatusNode
              icon={isApproved ? CheckCircle2 : RefreshCw}
              label="Under Review"
              sub={isApproved ? "Completed" : isUnderReview ? "In Progress" : "Pending"}
              tone={isApproved ? "success" : isUnderReview ? "secondary" : "neutral"}
            />
            <div className={`flex-1 h-0.5 mx-2 ${isApproved ? "bg-gradient-to-r from-success-500 to-secondary-600" : "bg-neutral-200"}`} />
            <StatusNode icon={isApproved ? CheckCircle2 : Clock} label="Approved" sub={isApproved ? "Completed" : "Pending"} tone={isApproved ? "success" : "neutral"} />
          </div>
        </div>
      </div>

      <BuyerUnlockGrid />
    </div>
  );
}

function StatusNode({
  icon: Icon,
  label,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  sub: string;
  tone: "success" | "secondary" | "neutral";
}) {
  const toneClasses = {
    success: { circle: "bg-success-500 text-white", sub: "text-success-600" },
    secondary: { circle: "bg-info-500 text-white", sub: "text-secondary-700" },
    neutral: { circle: "bg-neutral-100 text-pneutral-400 border border-neutral-200", sub: "text-pneutral-400" },
  }[tone];

  return (
    <div className="flex flex-col items-center gap-2 text-center w-32 shrink-0">
      <span className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${toneClasses.circle}`}>
        <Icon size={20} />
      </span>
      <span className="text-p4 font-body font-semibold text-pneutral-900">{label}</span>
      <span className={`text-p4 font-body font-medium ${toneClasses.sub}`}>{sub}</span>
    </div>
  );
}
