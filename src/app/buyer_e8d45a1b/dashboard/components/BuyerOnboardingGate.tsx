"use client";

import React, { useEffect, useState } from "react";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "../../context/BuyerLoginModalContext";
import BuyerRegister from "../../components/BuyerRegister";
import BuyerOnboardingStepper, { BuyerOnboardingStepDef } from "./BuyerOnboardingStepper";
import BuyerStatusBanner from "./BuyerStatusBanner";

interface Props {
  children: React.ReactNode;
}

const STEP_DEFS: BuyerOnboardingStepDef[] = [
  { title: "Registration Details", description: "Organization, contact, documents & review", icon: HiClipboardDocumentList },
  { title: "Admin Review", description: "Submitted for admin review", icon: ShieldCheck },
  { title: "Approved", description: "Approved & ready to buy", icon: CheckCircle2 },
];

function approvalToastSeenKey() {
  const buyerUserId = buyerAuthService.getCurrentUser()?.buyerUserId;
  return `buyerApprovalToastSeen_${buyerUserId ?? "anon"}`;
}

// Gates the buyer dashboard: until the buyer has an approved TempBuyer, this
// renders the registration wizard / status banner behind a centered 3-point
// stepper instead of the real dashboard content. Mirrors seller's
// OnboardingGate.tsx. Once approved, drops straight into the dashboard —
// there's no separate "registration complete" screen to click through, since
// registration itself already happens inside the dashboard. The buyer still
// gets told about it, just as a one-time toast instead of a blocking screen.
export default function BuyerOnboardingGate({ children }: Props) {
  const { openLoginModal } = useBuyerLoginModal();
  const { status, tempBuyer, refresh } = useBuyerOnboardingStatus();
  const [manuallyStarted, setManuallyStarted] = useState(false);
  const [forceIntro, setForceIntro] = useState(false);

  const isActionableDraftLike = status === "draft" || status === "correction_required" || status === "rejected";
  // A tempBuyer record always exists once a buyer has been rejected or sent
  // back for correction, so "tempBuyer != null" can't be used to decide
  // whether to auto-open the form for those two statuses the way it can for
  // "draft" (resuming an in-progress, never-submitted draft) — otherwise a
  // rejected/correction buyer is dropped straight into the edit wizard and
  // never sees BuyerStatusBanner's explanation of why.
  const showForm =
    !forceIntro && isActionableDraftLike && (manuallyStarted || (status === "draft" && tempBuyer != null));

  // The latest admin comment for the buyer's *current* status (only ever
  // populated for correction_required/rejected — see TempBuyerReviewHistory).
  const latestReviewComment = (() => {
    const history = tempBuyer?.reviewHistories;
    if (!history?.length) return undefined;
    const matching = history.filter((h) => h.status?.toUpperCase() === status.toUpperCase());
    if (!matching.length) return undefined;
    const latest = matching.reduce((a, b) =>
      new Date(b.reviewedAt ?? 0).getTime() > new Date(a.reviewedAt ?? 0).getTime() ? b : a
    );
    return latest.comments || undefined;
  })();

  useEffect(() => {
    if (status === "guest") {
      openLoginModal();
    }
  }, [status, openLoginModal]);

  useEffect(() => {
    if (status !== "approved") return;
    const key = approvalToastSeenKey();
    if (localStorage.getItem(key) === "true") return;
    localStorage.setItem(key, "true");
    toast.success(
      "Congratulations! Your registration has been approved. You now have full access to your buyer dashboard.",
      { duration: 6000 }
    );
  }, [status]);

  const handleResume = () => {
    setForceIntro(false);
    setManuallyStarted(true);
  };

  if (status === "checking" || status === "guest") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
      </div>
    );
  }

  if (status === "approved") {
    return <>{children}</>;
  }

  const stepperStep = status === "submitted" || status === "under_review" ? 2 : 1;

  return (
    <div className="flex flex-col items-center px-4">
      <BuyerOnboardingStepper step={stepperStep} steps={STEP_DEFS} />

      {isActionableDraftLike && !showForm && (
        <BuyerStatusBanner
          status={status}
          onResume={handleResume}
          hasDraft={tempBuyer != null}
          reason={latestReviewComment}
        />
      )}

      {isActionableDraftLike && showForm && (
        <div className="w-full">
          <BuyerRegister embedded onSubmitted={refresh} onExitToIntro={() => setForceIntro(true)} />
        </div>
      )}

      {(status === "submitted" || status === "under_review" || status === "suspended") && (
        <BuyerStatusBanner status={status} onResume={handleResume} hasDraft={tempBuyer != null} />
      )}
    </div>
  );
}
