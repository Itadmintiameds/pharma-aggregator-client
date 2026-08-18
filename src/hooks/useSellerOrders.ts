"use client";

import { useCallback, useEffect, useState } from "react";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { getSellerOrders } from "@/src/services/seller/sellerOrderService";
import { SellerOrder } from "@/src/types/buyer/order";

// Mirrors buyer's useBuyerOrders.ts — resolves the logged-in seller's id via
// sellerProfileService (same pattern as seller_7a3b9f2c/orders/page.tsx) then
// fetches that seller's own SellerOrders, so dashboard-overview widgets read
// real, seller-scoped data instead of the hardcoded numbers DashboardOverview
// previously rendered.
export function useSellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const profile = await sellerProfileService.getCurrentSellerProfile();
      const data = await getSellerOrders(profile.sellerId);
      setOrders(data.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
      setError(null);
    } catch (err) {
      setOrders([]);
      setError(err instanceof Error ? err.message : "Failed to load your orders.");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);

  return { orders, error, refresh };
}
