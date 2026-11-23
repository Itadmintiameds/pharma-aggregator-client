"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { getBuyerId } from "@/src/services/buyer/buyerProfileService";
import { getOrdersByBuyer } from "@/src/services/buyer/orderService";
import { getReturnsByBuyer } from "@/src/services/buyer/returnService";
import { getMyQuoteRequests } from "@/src/services/buyer/quoteRequestService";
import type { Order } from "@/src/types/buyer/order";
import type { ReturnRequest } from "@/src/types/buyer/returns";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";

export type BuyerDashboardSource = "orders" | "returns" | "quotes";

export interface BuyerDashboardData {
  orders: Order[];
  returns: ReturnRequest[];
  quotes: QuoteRequest[];
}

const EMPTY: BuyerDashboardData = { orders: [], returns: [], quotes: [] };

const SOURCE_LABELS: Record<BuyerDashboardSource, string> = {
  orders: "orders",
  returns: "returns",
  quotes: "quotes",
};

/**
 * Everything the buyer dashboard shows, loaded in parallel (every page of each list). Each source fails on its
 * own: if returns are unavailable, orders and quotes still render and only the tiles that depend on returns are
 * marked unavailable.
 */
export function useBuyerDashboardData() {
  const [data, setData] = useState<BuyerDashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<BuyerDashboardSource[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const mine = ++requestId.current;
    setLoading(true);

    if (!buyerAuthService.isAuthenticated()) {
      setData(EMPTY);
      setFailed([]);
      setLoading(false);
      return;
    }
    const currentUser = buyerAuthService.getCurrentUser();

    // Orders and returns are keyed by the buyer profile id; quotes only need the logged-in user.
    let buyerId: string | null = null;
    if (currentUser?.buyerUserId) {
      try {
        buyerId = await getBuyerId(currentUser.buyerUserId);
      } catch {
        buyerId = null;
      }
    }
    const noProfile = () => Promise.reject(new Error("No buyer profile"));

    const [orders, returns, quotes] = await Promise.allSettled([
      buyerId ? getOrdersByBuyer(buyerId) : noProfile(),
      buyerId ? getReturnsByBuyer(buyerId) : noProfile(),
      getMyQuoteRequests(),
    ]);
    if (mine !== requestId.current) return; // a newer refresh superseded this one

    const failures: BuyerDashboardSource[] = [];
    const take = <T,>(result: PromiseSettledResult<T>, source: BuyerDashboardSource, fallback: T): T => {
      if (result.status === "fulfilled") return result.value;
      failures.push(source);
      return fallback;
    };

    setData({
      orders: take(orders as PromiseSettledResult<Order[]>, "orders", []),
      returns: take(returns as PromiseSettledResult<ReturnRequest[]>, "returns", []),
      quotes: take(quotes, "quotes", []),
    });
    setFailed(failures);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Deferred to a microtask: the set-state-in-effect lint rule flags load() when called directly.
    queueMicrotask(load);
  }, [load]);

  return { data, loading, failed, failedLabels: failed.map((s) => SOURCE_LABELS[s]), lastUpdated, refresh: load };
}
