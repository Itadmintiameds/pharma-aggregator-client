"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { getSectionCompletion, getCompletedSectionCount } from "@/src/utils/buyerSectionCompletion";
import { useBuyerLoginModal } from "../../context/BuyerLoginModalContext";
import BuyerRegister from "../../components/BuyerRegister";
import BuyerOnboardingStepper, { BuyerOnboardingStepDef } from "./BuyerOnboardingStepper";
import BuyerStatusBanner from "./BuyerStatusBanner";
import BuyerSubmittedDetailsCard from "./BuyerSubmittedDetailsCard";
import BuyerProfileHubCard, { BuyerHubTarget } from "./BuyerProfileHubCard";
import BuyerOnboardingChecklist from "./BuyerOnboardingChecklist";
import BuyerUnlockGrid from "./BuyerUnlockGrid";
import BuyerWelcomeOverview from "./BuyerWelcomeOverview";

// Hub section -> wizard step number (see BuyerRegister.tsx's steps:
// 1 Organization, 2 Contact, 3 Compliance Details [license+GST+PAN+logo],
// 4 Review & Submit — "review" is what "Continue Registration" targets once
// every section is already Completed, see BuyerProfileHubCard.tsx).
const SECTION_TO_STEP: Record<BuyerHubTarget, number> = {
  org: 1,
  contact: 2,
  license: 3,
  gst: 3,
  review: 4,
};

interface Props {
  children: React.ReactNode;
}

const STEP_DEFS: BuyerOnboardingStepDef[] = [
  { title: "Profile Setup", description: "Add organization, compliance & contact details" },
  { title: "Business Verification", description: "Under TiaMeds admin review" },
  { title: "Account Activated", description: "Start buying from verified suppliers" },
];

function approvalToastSeenKey() {
  const buyerUserId = buyerAuthService.getCurrentUser()?.buyerUserId;
  return `buyerApprovalToastSeen_${buyerUserId ?? "anon"}`;
}

// Gates the buyer dashboard: until the buyer has an approved TempBuyer, this
// renders the registration wizard / status banner behind a centered 3-point
// stepper instead of the real dashboard content. Mirrors seller's
// OnboardingGate.tsx. Once approved, the buyer sees a one-time
// "Congratulations!" screen (see approvedScreenSeen below) before dropping
// into the real dashboard on their next visit.
// Routes whose backend endpoints don't require an approved Buyer profile
// (just a valid buyer JWT — see BuyerQuoteRequestController), so they stay
// reachable while registration is still in progress instead of being
// replaced by the stepper below.
const UNGATED_ROUTES = ["/buyer_e8d45a1b/dashboard/rfq"];

export default function BuyerOnboardingGate({ children }: Props) {
  const pathname = usePathname();
  const { openLoginModal } = useBuyerLoginModal();
  const { status, tempBuyer, refresh } = useBuyerOnboardingStatus();
  const isUngatedRoute = UNGATED_ROUTES.some((route) => pathname?.startsWith(route));
  const [manuallyStarted, setManuallyStarted] = useState(false);
  const [forceIntro, setForceIntro] = useState(false);
  const [showSubmittedDetails, setShowSubmittedDetails] = useState(false);
  const [showWelcomeHome, setShowWelcomeHome] = useState(false);
  // Which wizard step a hub-row click should open — see BuyerRegister.tsx's
  // initialStep prop and SECTION_TO_STEP above.
  const [targetStep, setTargetStep] = useState<number | undefined>(undefined);

  const isActionableDraftLike =
    status === "draft" ||
    status === "correction_required" ||
    status === "rejected" ||
    status === "submitted" ||
    status === "under_review";
  // Unlike before the hub existed, a draft with an in-progress tempBuyer no
  // longer auto-opens the wizard — the hub is now that landing point, and
  // the wizard only opens once the buyer clicks a section row or "Continue
  // Registration" (manuallyStarted). correction_required/rejected still
  // route through BuyerStatusBanner first (see render below), since those
  // need its explanation of why before editing.
  const showForm = !forceIntro && isActionableDraftLike && manuallyStarted;

  const completion = getSectionCompletion(tempBuyer);
  const hasAnyProgress = getCompletedSectionCount(completion) > 0;

  const handleSectionClick = (section: BuyerHubTarget) => {
    setTargetStep(SECTION_TO_STEP[section]);
    setForceIntro(false);
    setManuallyStarted(true);
  };

  // The latest admin review entry for the buyer's *current* status (only
  // ever populated for correction_required/rejected/approved — see
  // TempBuyerReviewHistory, which has no SUBMITTED/UNDER_REVIEW rows).
  const latestReview = (() => {
    const history = tempBuyer?.reviewHistories;
    if (!history?.length) return undefined;
    const matching = history.filter((h) => h.status?.toUpperCase() === status.toUpperCase());
    if (!matching.length) return undefined;
    return matching.reduce((a, b) =>
      new Date(b.reviewedAt ?? 0).getTime() > new Date(a.reviewedAt ?? 0).getTime() ? b : a
    );
  })();
  const latestReviewComment = latestReview?.comments || undefined;

  useEffect(() => {
    if (status === "guest") {
      openLoginModal();
    }
  }, [status, openLoginModal]);

  useEffect(() => {
    setShowSubmittedDetails(false);
    setShowWelcomeHome(false);
  }, [status]);

  // Shows the one-time "Congratulations!" screen below instead of the
  // toast this used to fire — tracked by the same seen-flag so a refresh
  // after dismissal drops straight into the real dashboard.
  const [approvedScreenSeen, setApprovedScreenSeen] = useState(false);
  useEffect(() => {
    if (status !== "approved") return;
    const key = approvalToastSeenKey();
    setApprovedScreenSeen(localStorage.getItem(key) === "true");
  }, [status]);

  const handleResume = () => {
    setForceIntro(false);
    setManuallyStarted(true);
    setTargetStep(undefined);
  };

  // While the buyer is gated (anything short of "approved"), every
  // dashboard route renders this same gate, so there's no separate "/dashboard"
  // page to navigate to — "Back to Dashboard" instead shows the overview
  // screen below (BuyerWelcomeOverview, fed the real status so it doesn't
  // falsely claim "0% Complete" for a buyer who already submitted).
  // Deliberately does NOT call refresh() here: that transitions status
  // through "checking" and back, and the effect below (which resets
  // showWelcomeHome on any *real* status change) fires on that transient
  // cycle too, snapping this flag straight back to false before the buyer
  // ever sees the overview screen.
  const handleBack = () => {
    setShowWelcomeHome(true);
  };

  const handleDismissApprovedScreen = () => {
    localStorage.setItem(approvalToastSeenKey(), "true");
    setApprovedScreenSeen(true);
  };

  if (status === "checking" || status === "guest") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
      </div>
    );
  }

  if (status === "approved" && !isUngatedRoute && !approvedScreenSeen) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4">
        <div className="mb-4">
          <h1 className="text-h4 font-heading font-semibold text-pneutral-900">Buyer Account Activation</h1>
          <p className="text-p3 font-body font-regular text-pneutral-600 mt-1">
            Complete your profile and verification to start sourcing medicines from verified suppliers.
          </p>
        </div>
        <BuyerOnboardingStepper step={3} steps={STEP_DEFS} />
        <div className="w-full mt-6">
          <BuyerStatusBanner status="approved" tempBuyer={tempBuyer} onResume={handleResume} onBack={handleDismissApprovedScreen} hasDraft />
        </div>
      </div>
    );
  }

  if (status === "approved" || isUngatedRoute) {
    return <>{children}</>;
  }

  // A buyer who has never touched registration at all (no tempBuyer record
  // yet) lands on this plain welcome page instead of the "Complete your
  // Buyer Profile" hub — "Register Your Business" is what actually starts
  // the wizard (manuallyStarted), matching the Figma reference where the
  // hub only appears once there's something to show progress on. Also
  // reachable via "Back to Dashboard" (showWelcomeHome) from any other
  // status — real status/progress is passed through so it reflects actual
  // state instead of always claiming "0% Complete".
  if ((status === "draft" && tempBuyer == null && !showForm) || (showWelcomeHome && !showForm)) {
    return (
      <BuyerWelcomeOverview
        status={status}
        hasAnyProgress={hasAnyProgress}
        onRegister={() => {
          setShowWelcomeHome(false);
          setForceIntro(false);
          setManuallyStarted(true);
        }}
        onViewDetails={() => {
          setShowWelcomeHome(false);
          setShowSubmittedDetails(true);
        }}
      />
    );
  }

  // "Profile Setup" (step 1) reads as done as soon as any section has
  // progress, not just once the whole application is submitted — otherwise
  // it sits gray through most of the draft even at 4/5 sections completed.
  const stepperStep = status === "submitted" || status === "under_review" || hasAnyProgress ? 2 : 1;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4">
      <div className="mb-4">
        <h1 className="text-h4 font-heading font-semibold text-pneutral-900">Buyer Account Activation</h1>
        <p className="text-p3 font-body font-regular text-pneutral-600 mt-1">
          Complete your profile and verification to start sourcing medicines from verified suppliers.
        </p>
      </div>

      {/* The wizard shows its own 5-step tracker (BuyerWizardStepper) while
          active, so this 3-point hub tracker only makes sense outside it. */}
      {!showForm && <BuyerOnboardingStepper step={stepperStep} steps={STEP_DEFS} />}

      {isActionableDraftLike && !showForm && status !== "draft" && (
        <div className="w-full mt-6">
          {showSubmittedDetails ? (
            <BuyerSubmittedDetailsCard tempBuyer={tempBuyer} onBack={() => setShowSubmittedDetails(false)} />
          ) : (
            <BuyerStatusBanner
              status={status}
              tempBuyer={tempBuyer}
              onResume={handleResume}
              onBack={handleBack}
              onViewDetails={() => setShowSubmittedDetails(true)}
              hasDraft={tempBuyer != null}
              reason={latestReviewComment}
              reviewedAt={latestReview?.reviewedAt}
            />
          )}
        </div>
      )}

      {isActionableDraftLike && !showForm && status === "draft" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-6">
          <BuyerProfileHubCard completion={completion} onSectionClick={handleSectionClick} />
          <BuyerOnboardingChecklist tempBuyer={tempBuyer} status={status} completion={completion} />
        </div>
      )}

      {isActionableDraftLike && showForm && (
        <div className="w-full mt-6">
          <BuyerRegister
            key={targetStep ?? "resume"}
            embedded
            initialStep={targetStep}
            onSubmitted={refresh}
            onExitToIntro={() => setForceIntro(true)}
          />
        </div>
      )}

      {status === "suspended" && (
        <div className="flex flex-col items-center">
          <BuyerStatusBanner status={status} onResume={handleResume} onBack={handleBack} hasDraft={tempBuyer != null} />
        </div>
      )}

      <BuyerUnlockGrid />
    </div>
  );
}
