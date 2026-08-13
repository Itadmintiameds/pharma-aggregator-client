"use client";

import React from "react";
import { FaClock, FaCheckCircle, FaBuilding, FaExclamationTriangle, FaBan } from "react-icons/fa";
import { BuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";

interface Props {
  status: BuyerOnboardingStatus;
  onResume: () => void;
}

const CARD_CONTENT: Partial<
  Record<
    BuyerOnboardingStatus,
    { icon: React.ElementType; iconBg: string; iconColor: string; title: string; body: string; cta?: string }
  >
> = {
  draft: {
    icon: FaBuilding,
    iconBg: "bg-primary-05",
    iconColor: "text-primary-700",
    title: "Let's get your organization registered",
    body: "Complete your organization, contact, and document details so we can review and approve your buyer account.",
    cta: "Resume Draft",
  },
  submitted: {
    icon: FaClock,
    iconBg: "bg-warning-50",
    iconColor: "text-warning-500",
    title: "Application Submitted",
    body: "We've received your registration. Our team will begin reviewing it shortly.",
  },
  under_review: {
    icon: FaClock,
    iconBg: "bg-warning-50",
    iconColor: "text-warning-500",
    title: "Application Under Review",
    body: "You've already submitted your organization details. Our team is reviewing your registration and you'll be notified by email once your account is approved.",
  },
  correction_required: {
    icon: FaExclamationTriangle,
    iconBg: "bg-warning-50",
    iconColor: "text-warning-500",
    title: "Correction Required",
    body: "Our team has requested changes to your registration. Please review and resubmit your details.",
    cta: "Edit & Resubmit",
  },
  rejected: {
    icon: FaExclamationTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    title: "Application Rejected",
    body: "Unfortunately your registration was not approved. You can review your details and resubmit.",
    cta: "Edit & Resubmit",
  },
  suspended: {
    icon: FaBan,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    title: "Account Suspended",
    body: "Your buyer account has been suspended. Please contact support for more information.",
  },
  approved: {
    icon: FaCheckCircle,
    iconBg: "bg-success-50",
    iconColor: "text-success-600",
    title: "Buyer Registration Complete",
    body: "Congratulations! Your registration has been approved. You now have full access to your buyer dashboard.",
    cta: "Go to Dashboard",
  },
};

// Renders the state-specific card for one of the 7 real TempBuyerStatus
// states. draft/correction_required/rejected get an actionable CTA that
// resumes the (embedded) wizard; submitted/under_review/suspended are
// read-only status cards.
export default function BuyerStatusBanner({ status, onResume }: Props) {
  const content = CARD_CONTENT[status];
  if (!content) return null;

  const Icon = content.icon;

  return (
    <div className="bg-base-white rounded-2xl shadow-lg max-w-[28rem] w-full p-10 text-center mt-4">
      <div className={`w-16 h-16 rounded-full ${content.iconBg} flex items-center justify-center mx-auto mb-6 ${content.iconColor}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h2 className="text-h4 font-heading font-bold text-pneutral-900 mb-3">{content.title}</h2>
      <p className="text-p3 font-body text-pneutral-600 mb-6">{content.body}</p>
      {content.cta && (
        <button onClick={onResume} className="px-6 py-3 rounded-md bg-primary-800 text-base-white font-bold">
          {content.cta}
        </button>
      )}
    </div>
  );
}
