"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { getSellerOrders } from "@/src/services/seller/sellerOrderService";
import { getSellerReturns } from "@/src/services/seller/sellerReturnService";
import { getSellerQuoteRequests } from "@/src/services/seller/quoteRequestService";
import {
  getSellerCommissionCharges,
  getSellerSettlements,
  SellerCommissionCharge,
  SellerSettlement,
} from "@/src/services/seller/sellerBillingService";
import { getProductList } from "@/src/services/product/ProductService";
import type { SellerOrder } from "@/src/types/buyer/order";
import type { ReturnRequest } from "@/src/types/buyer/returns";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";
import type { SellerProduct } from "@/src/utils/sellerDashboardStats";

export type DashboardSource = "orders" | "returns" | "quotes" | "products" | "payouts" | "commission";

export interface SellerDashboardData {
  orders: SellerOrder[];
  returns: ReturnRequest[];
  quotes: QuoteRequest[];
  products: SellerProduct[];
  settlements: SellerSettlement[];
  commissions: SellerCommissionCharge[];
}

const EMPTY: SellerDashboardData = {
  orders: [],
  returns: [],
  quotes: [],
  products: [],
  settlements: [],
  commissions: [],
};

const SOURCE_LABELS: Record<DashboardSource, string> = {
  orders: "orders",
  returns: "returns",
  quotes: "quote requests",
  products: "products",
  payouts: "payouts",
  commission: "commission",
};

/**
 * Everything the seller dashboard shows, loaded in parallel. Each source fails on its own: if (say) billing is
 * down, orders and returns still render and only the money-from-billing tiles are marked unavailable.
 */
export function useSellerDashboardData() {
  const [data, setData] = useState<SellerDashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<DashboardSource[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const mine = ++requestId.current;
    setLoading(true);

    let sellerId: string;
    try {
      sellerId = (await sellerProfileService.getCurrentSellerProfile()).sellerId;
    } catch {
      if (mine !== requestId.current) return;
      setFailed(["orders", "returns", "quotes", "products", "payouts", "commission"]);
      setLoading(false);
      return;
    }

    const [orders, returns, quotes, products, settlements, commissions] = await Promise.allSettled([
      getSellerOrders(sellerId),
      getSellerReturns(sellerId),
      getSellerQuoteRequests(),
      // The list endpoint answers with a bare array; anything else is treated as "no products".
      getProductList().then((list: unknown) => (Array.isArray(list) ? (list as SellerProduct[]) : [])),
      getSellerSettlements(),
      getSellerCommissionCharges(),
    ]);
    if (mine !== requestId.current) return; // a newer refresh superseded this one

    const failures: DashboardSource[] = [];
    const take = <T,>(result: PromiseSettledResult<T>, source: DashboardSource, fallback: T): T => {
      if (result.status === "fulfilled") return result.value;
      failures.push(source);
      return fallback;
    };

    setData({
      orders: take(orders, "orders", []),
      returns: take(returns, "returns", []),
      quotes: take(quotes, "quotes", []),
      products: take(products, "products", []),
      settlements: take(settlements, "payouts", []),
      commissions: take(commissions, "commission", []),
    });
    setFailed(failures);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Deferred to a microtask: the set-state-in-effect lint rule flags load() when called directly.
    queueMicrotask(load);
  }, [load]);

  const failedLabels = failed.map((source) => SOURCE_LABELS[source]);
  return { data, loading, failed, failedLabels, lastUpdated, refresh: load };
}
