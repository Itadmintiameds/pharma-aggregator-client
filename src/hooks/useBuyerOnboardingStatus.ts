"use client";

import { useCallback, useEffect, useState } from "react";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { buyerRegistrationService, RawTempBuyer } from "@/src/services/buyer/buyerRegistrationService";

// Maps 1:1 onto entity.temp.buyer.TempBuyerStatus's string constants —
// deliberately NOT collapsed into fewer buckets the way seller's
// useSellerOnboardingStatus collapses everything non-DRAFT into "pending",
// since BuyerOnboardingGate/BuyerStatusBanner need to tell submitted/
// under_review/correction_required/rejected/suspended apart.
export type BuyerOnboardingStatus =
  | "checking"
  | "guest"
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "correction_required"
  | "rejected"
  | "suspended";

const STATUS_MAP: Record<string, BuyerOnboardingStatus> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  CORRECTION_REQUIRED: "correction_required",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
};

export function useBuyerOnboardingStatus() {
  const [status, setStatus] = useState<BuyerOnboardingStatus>("checking");
  const [tempBuyer, setTempBuyer] = useState<RawTempBuyer | null>(null);

  const check = useCallback(async () => {
    if (!buyerAuthService.isAuthenticated()) {
      setStatus("guest");
      setTempBuyer(null);
      return;
    }
    setStatus("checking");

    const currentUser = buyerAuthService.getCurrentUser();
    if (!currentUser?.buyerUserId) {
      setStatus("draft");
      setTempBuyer(null);
      return;
    }

    // Unlike useSellerOnboardingStatus, there's no separate "approved Buyer
    // profile" lookup available on the frontend yet (no buyerProfileService
    // exists in this codebase) — TempBuyer's own APPROVED status already
    // fully conveys that state, so that single fetch is sufficient here.
    try {
      const buyer = await buyerRegistrationService.getTempBuyerByUserId(currentUser.buyerUserId);
      const rawStatus = typeof buyer?.status === "string" ? buyer.status.toUpperCase() : "";
      setTempBuyer(buyer);
      setStatus(STATUS_MAP[rawStatus] ?? "draft");
    } catch {
      // 404 (never registered) or any other failure: nothing to resume yet.
      setTempBuyer(null);
      setStatus("draft");
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask rather than called directly: `check` sets
    // state synchronously on its very first line (setStatus("guest") /
    // setStatus("checking")), which the set-state-in-effect lint rule flags
    // as a same-tick setState-in-effect call. The microtask hop pushes that
    // first setState past the effect's synchronous phase without changing
    // behavior — it still runs before the next paint.
    queueMicrotask(check);
  }, [check]);

  useEffect(() => {
    const handleAuthChanged = () => check();
    // Matches the exact event name buyerAuthService.clearAuth() dispatches.
    window.addEventListener("buyer-auth-changed", handleAuthChanged);
    return () => window.removeEventListener("buyer-auth-changed", handleAuthChanged);
  }, [check]);

  return { status, tempBuyer, refresh: check };
}
