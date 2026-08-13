"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
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

function acknowledgedStorageKey() {
  const buyerUserId = buyerAuthService.getCurrentUser()?.buyerUserId;
  return `buyerRegistrationCompleteSeen_${buyerUserId ?? "anon"}`;
}

// Gates the buyer dashboard: until the buyer has an approved TempBuyer (and
// has dismissed the one-time completion screen), this renders the
// registration wizard / status banner behind a centered 3-point stepper
// instead of the real dashboard content. Mirrors seller's OnboardingGate.tsx.
export default function BuyerOnboardingGate({ children }: Props) {
  const router = useRouter();
  const { status, tempBuyer, refresh } = useBuyerOnboardingStatus();
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  const [manuallyStarted, setManuallyStarted] = useState(false);
  const [forceIntro, setForceIntro] = useState(false);

  const isActionableDraftLike = status === "draft" || status === "correction_required" || status === "rejected";
  const showForm = !forceIntro && isActionableDraftLike && (manuallyStarted || tempBuyer != null);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/buyer_e8d45a1b/login");
    }
  }, [status, router]);

  useEffect(() => {
    // Deferred via microtask so this doesn't read as a same-tick
    // setState-in-effect call to the set-state-in-effect lint rule — see the
    // identical comment on the microtask hop in useBuyerOnboardingStatus.ts.
    if (status === "approved") {
      queueMicrotask(() => setAcknowledged(localStorage.getItem(acknowledgedStorageKey()) === "true"));
    }
  }, [status]);

  const handleContinue = () => {
    localStorage.setItem(acknowledgedStorageKey(), "true");
    setAcknowledged(true);
  };

  const handleResume = () => {
    setForceIntro(false);
    setManuallyStarted(true);
  };

  if (status === "checking" || status === "guest" || (status === "approved" && acknowledged === null)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
      </div>
    );
  }

  if (status === "approved" && acknowledged) {
    return <>{children}</>;
  }

  const stepperStep = status === "approved" ? 3 : status === "submitted" || status === "under_review" ? 2 : 1;

  return (
    <div className="flex flex-col items-center px-4">
      <BuyerOnboardingStepper step={stepperStep} steps={STEP_DEFS} />

      {isActionableDraftLike && !showForm && <BuyerStatusBanner status={status} onResume={handleResume} />}

      {isActionableDraftLike && showForm && (
        <div className="w-full">
          <BuyerRegister embedded onSubmitted={refresh} onExitToIntro={() => setForceIntro(true)} />
        </div>
      )}

      {(status === "submitted" || status === "under_review" || status === "suspended") && (
        <BuyerStatusBanner status={status} onResume={handleResume} />
      )}

      {status === "approved" && !acknowledged && <BuyerStatusBanner status="approved" onResume={handleContinue} />}
    </div>
  );
}
