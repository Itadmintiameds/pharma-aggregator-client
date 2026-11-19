"use client";

import React, { useEffect, useState } from "react";
import { FaClock, FaCheckCircle, FaBuilding } from "react-icons/fa";
import { useSellerOnboardingStatus } from "@/src/hooks/useSellerOnboardingStatus";
import { useDashboardBackInterceptor } from "@/src/context/DashboardBackInterceptContext";
import { sellerAuthService } from "@/src/services/seller/authService";
import SellerRegister from "../../components/SellerRegister";
import OnboardingStepper from "./OnboardingStepper";

interface Props {
  children: React.ReactNode;
}

// Once approved, the seller is shown a one-time "Registration Complete"
// screen they have to dismiss (rather than silently skipping straight to
// the dashboard) - remembered per-user so it never reappears after that.
function acknowledgedStorageKey() {
  const userId = sellerAuthService.getCurrentUser()?.userId;
  return `sellerRegistrationCompleteSeen_${userId ?? "anon"}`;
}

// Gates the dashboard's Overview area: until the seller has an approved
// profile (and has dismissed the one-time completion screen), this renders
// the registration wizard / pending-approval / complete status behind a
// centered 3-point stepper instead of the normal KPI/charts Overview.
export default function OnboardingGate({ children }: Props) {
  const { status, tempSeller, refresh } = useSellerOnboardingStatus();
  // null = not checked yet (avoids flashing the dashboard before we know).
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  // Clicking "Fill Company Details" before any backend draft row exists.
  // Once the seller has actually saved a step (nextStep() auto-saves - see
  // SellerRegister.tsx), `tempSeller` alone proves they've started, which
  // survives logout/login on its own - no localStorage flag needed, so it
  // can't be wiped out by an unrelated 401 clearing localStorage on logout.
  const [manuallyStarted, setManuallyStarted] = useState(false);
  // Forces the intro card back open after a back-button press, even though
  // `tempSeller` already proves they'd started - see the interceptor below.
  const [forceIntro, setForceIntro] = useState(false);
  const showForm = !forceIntro && (manuallyStarted || tempSeller != null);

  useEffect(() => {
    if (status === "approved") {
      setAcknowledged(localStorage.getItem(acknowledgedStorageKey()) === "true");
    }
  }, [status]);

  const handleContinue = () => {
    localStorage.setItem(acknowledgedStorageKey(), "true");
    setAcknowledged(true);
  };

  const handleStart = () => {
    setForceIntro(false);
    setManuallyStarted(true);
  };

  // While the embedded form is showing, the browser back button steps back
  // to this "Fill Company Details" intro card in place - not a real
  // navigation/reload, and not the layout's usual logout-confirmation
  // prompt. Once back on the intro card, back reverts to that default.
  useDashboardBackInterceptor(
    status === "draft" && showForm
      ? () => {
          setForceIntro(true);
          return true;
        }
      : null
  );

  if (
    status === "checking" ||
    status === "guest" ||
    (status === "approved" && acknowledged === null)
  ) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
      </div>
    );
  }

  if (status === "approved" && acknowledged) {
    return <>{children}</>;
  }

  const stepperStep = status === "pending" ? 2 : status === "approved" ? 3 : 1;

  return (
    <div className="flex flex-col items-center px-3">
      <OnboardingStepper step={stepperStep} />

      {status === "draft" && !showForm && (
        <div className="bg-base-white rounded-xl border border-neutral-200 shadow-sm max-w-[26rem] w-full px-5 py-5 text-center mt-2">
          <div className="w-12 h-12 rounded-full bg-primary-05 flex items-center justify-center mx-auto mb-3 text-primary-700">
            <FaBuilding className="w-5 h-5" />
          </div>
          <h2 className="text-base font-heading font-bold text-pneutral-900 mb-2">
            Let&apos;s get your company registered
          </h2>
          <p className="text-[13px] font-body text-pneutral-600 mb-4">
            Complete your company, coordinator, document and bank details so
            we can review and approve your seller account.
          </p>
          <button
            onClick={handleStart}
            className="h-9 px-4 rounded-lg border-[1.5px] border-primary-900 text-primary-900 text-[13px] font-semibold hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
          >
            Fill Company Details
          </button>
        </div>
      )}

      {status === "draft" && showForm && (
        <div className="w-full">
          <SellerRegister
            embedded
            onSubmitted={refresh}
            onExitToIntro={() => setForceIntro(true)}
          />
        </div>
      )}

      {status === "pending" && (
        <div className="bg-base-white rounded-xl border border-neutral-200 shadow-sm max-w-[26rem] w-full px-5 py-5 text-center mt-2">
          <div className="w-12 h-12 rounded-full bg-warning-50 flex items-center justify-center mx-auto mb-3 text-warning-500">
            <FaClock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-heading font-bold text-pneutral-900 mb-2">
            Application Under Review
          </h2>
          <p className="text-[13px] font-body text-pneutral-600">
            You&apos;ve already submitted your company details. Our team is
            reviewing your registration and you&apos;ll be notified by email
            once your account is approved.
          </p>
        </div>
      )}

      {status === "approved" && !acknowledged && (
        <div className="bg-base-white rounded-xl border border-neutral-200 shadow-sm max-w-[26rem] w-full px-5 py-5 text-center mt-2">
          <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-3 text-success-600">
            <FaCheckCircle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-heading font-bold text-pneutral-900 mb-2">
            Seller Registration Complete
          </h2>
          <p className="text-[13px] font-body text-pneutral-600 mb-4">
            Congratulations! Your registration has been approved. You now
            have full access to your seller dashboard.
          </p>
          <button
            onClick={handleContinue}
            className="h-9 px-4 rounded-lg border-[1.5px] border-primary-900 text-primary-900 text-[13px] font-semibold hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
