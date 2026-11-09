"use client";

import { useCallback, useEffect, useState } from "react";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { getBuyerId } from "@/src/services/buyer/buyerProfileService";
import { getOrdersByBuyer } from "@/src/services/buyer/orderService";
import { Order } from "@/src/types/buyer/order";

// Shared by the dashboard overview KPIs/RecentOrdersCard and the dashboard's
// "My Orders" tab so all three read the same real order list instead of each
// re-implementing the buyerId lookup + fetch (mirrors the buyerId resolution
// sequence used in src/app/orders/page.tsx and checkout/page.tsx).
export function useBuyerOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buyerAuthService.isAuthenticated()) {
      setOrders([]);
      setError(null);
      return;
    }

    const currentUser = buyerAuthService.getCurrentUser();
    if (!currentUser?.buyerUserId) {
      setOrders([]);
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      const buyerId = await getBuyerId(currentUser.buyerUserId);
      const data = await getOrdersByBuyer(buyerId);
      setOrders(data.sort((a, b) => (b.placedAt ?? "").localeCompare(a.placedAt ?? "")));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your orders.");
    }
  }, []);

  useEffect(() => {
    // Deferred to a microtask for the same reason as useBuyerOnboardingStatus:
    // refresh() sets state synchronously on its first line, which the
    // set-state-in-effect lint rule flags when called directly.
    queueMicrotask(refresh);
  }, [refresh]);

  return { orders, error, refresh };
}
