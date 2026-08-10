"use client";

import { useCallback, useEffect, useState } from "react";
import { sellerAuthService } from "@/src/services/seller/authService";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";

export type SellerOnboardingStatus =
  | "checking"
  | "guest"
  | "draft"
  | "pending"
  | "approved";

export function useSellerOnboardingStatus() {
  const [status, setStatus] = useState<SellerOnboardingStatus>("checking");
  const [tempSeller, setTempSeller] = useState<any>(null);

  const check = useCallback(async () => {
    if (!sellerAuthService.isAuthenticated()) {
      setStatus("guest");
      setTempSeller(null);
      return;
    }
    setStatus("checking");

    try {
      await sellerProfileService.getCurrentSellerProfile();
      setStatus("approved");
      return;
    } catch {
      // No approved Seller row yet — fall through to check TempSeller.
    }

    const currentUser = sellerAuthService.getCurrentUser();
    if (!currentUser?.userId) {
      setStatus("draft");
      setTempSeller(null);
      return;
    }

    try {
      const seller = await sellerRegService.getTempSellerByUserId(currentUser.userId);
      const tempStatus = typeof seller?.status === "string" ? seller.status.toUpperCase() : "";
      setTempSeller(seller);
      // A DRAFT row is an in-progress, unsubmitted registration - route back
      // into the wizard (which resumes it) rather than the "already
      // submitted, pending review" state. Any other status (OPEN,
      // RESUBMITTED, CORRECTION_REQUIRED, REJECTED, ...) means a real
      // submission exists, so "pending" is still correct for those.
      setStatus(tempStatus === "DRAFT" ? "draft" : "pending");
    } catch {
      setTempSeller(null);
      setStatus("draft");
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    const handleAuthChanged = () => check();
    window.addEventListener("auth-changed", handleAuthChanged);
    return () => window.removeEventListener("auth-changed", handleAuthChanged);
  }, [check]);

  return { status, tempSeller, refresh: check };
}
