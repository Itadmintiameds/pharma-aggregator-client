"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReturnPanel from "@/src/app/components/orders/ReturnPanel";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { getBuyerId } from "@/src/services/buyer/buyerProfileService";
import { getReturnsByBuyer } from "@/src/services/buyer/returnService";
import { ReturnRequest } from "@/src/types/buyer/returns";

const STATUS_FILTERS = [
  "ALL",
  "REQUESTED",
  "APPROVED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "RECEIVED",
  "REFUNDED",
  "CLOSED",
  "REJECTED",
  "CANCELLED",
];

const filterLabel = (status: string) =>
  status === "ALL"
    ? "All"
    : status
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");

// Every return the buyer has raised, across orders. Each return is the same ReturnPanel shown on the
// order detail page, so the buyer can ship, cancel or track it from here too. New returns are still
// started from the order detail page, where the returnable units are known.
export default function BuyerReturnsPage() {
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  const loadReturns = useCallback(async (id: string, status: string) => {
    try {
      const data = await getReturnsByBuyer(id, status === "ALL" ? undefined : status);
      setReturns(data.sort((a, b) => (b.requestedAt ?? "").localeCompare(a.requestedAt ?? "")));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your returns.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const currentUser = buyerAuthService.getCurrentUser();
      if (!buyerAuthService.isAuthenticated() || !currentUser?.buyerUserId) {
        setError("Your session has expired. Please log in again.");
        return;
      }
      try {
        setBuyerId(await getBuyerId(currentUser.buyerUserId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your profile.");
      }
    })();
  }, []);

  useEffect(() => {
    // Deferred to a microtask, same as useBuyerOrders: the set-state-in-effect lint rule
    // flags loadReturns when called directly.
    if (buyerId) {
      queueMicrotask(() => loadReturns(buyerId, statusFilter));
    }
  }, [buyerId, statusFilter, loadReturns]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">My Returns</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Track the returns you&apos;ve raised. To start a new return, open the order from My Orders.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setStatusFilter(status);
              setReturns(null);
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              statusFilter === status ? "bg-secondary-600 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {filterLabel(status)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {!error && returns === null && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
        </div>
      )}

      {!error && returns !== null && returns.length === 0 && (
        <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-12 text-center">
          <p className="text-p2 font-body text-pneutral-600">No returns found.</p>
        </div>
      )}

      {!error && returns !== null && returns.length > 0 && buyerId && (
        <div className="flex flex-col gap-4">
          {returns.map((returnRequest) => (
            <div key={returnRequest.returnId} className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-p4 font-body text-pneutral-500">
                  {returnRequest.orderId ? (
                    <Link
                      href={`/buyer_e8d45a1b/dashboard/orders/${returnRequest.orderId}`}
                      className="text-secondary-600 font-semibold hover:underline"
                    >
                      Order {returnRequest.orderId}
                    </Link>
                  ) : (
                    `Seller order ${returnRequest.sellerOrderId ?? "-"}`
                  )}
                  {returnRequest.requestedAt
                    ? ` · ${new Date(returnRequest.requestedAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}`
                    : ""}
                </p>
              </div>
              <ReturnPanel
                returnRequest={returnRequest}
                buyerId={buyerId}
                onChanged={() => loadReturns(buyerId, statusFilter)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
