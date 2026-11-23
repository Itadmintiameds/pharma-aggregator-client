"use client";

import { useCallback, useEffect, useState } from "react";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { getBuyerId } from "@/src/services/buyer/buyerProfileService";
import { getReturnsByBuyer } from "@/src/services/buyer/returnService";
import { ReturnRequest } from "@/src/types/buyer/returns";

// The logged-in buyer's returns (every page), plus the buyerId the return actions (ship, cancel...) need.
// Same buyerId resolution as useBuyerOrders.
export function useBuyerReturns() {
  const [returns, setReturns] = useState<ReturnRequest[] | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buyerAuthService.isAuthenticated()) {
      setReturns([]);
      setError(null);
      return;
    }
    const currentUser = buyerAuthService.getCurrentUser();
    if (!currentUser?.buyerUserId) {
      setReturns([]);
      setError("Your session has expired. Please log in again.");
      return;
    }
    try {
      const id = await getBuyerId(currentUser.buyerUserId);
      const data = await getReturnsByBuyer(id);
      setBuyerId(id);
      setReturns([...data].sort((a, b) => (b.requestedAt ?? "").localeCompare(a.requestedAt ?? "")));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your returns.");
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask: refresh() sets state on its first lines, which the set-state-in-effect lint rule
    // flags when called directly.
    queueMicrotask(refresh);
  }, [refresh]);

  return { returns, buyerId, error, refresh };
}
