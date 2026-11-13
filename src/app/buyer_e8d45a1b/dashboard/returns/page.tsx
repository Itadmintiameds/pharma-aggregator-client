"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBuyerReturns } from "@/src/hooks/useBuyerReturns";
import { useBuyerOrders } from "@/src/hooks/useBuyerOrders";
import BuyerReturnCard, { OrderItemInfo } from "@/src/app/components/orders/BuyerReturnCard";
import { prettyStatus, useProductSummaries } from "@/src/app/commonComponents/cardUi";

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
const PAGE_SIZE = 10;

export default function BuyerReturnsPage() {
  const { returns, buyerId, error, refresh } = useBuyerReturns();
  const { orders } = useBuyerOrders();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Deep link, e.g. ?status=APPROVED opens that tab.
    const wanted = new URLSearchParams(window.location.search).get("status");
    if (wanted && STATUS_FILTERS.includes(wanted)) queueMicrotask(() => setStatusFilter(wanted));
  }, []);

  // Return lines carry only a line total; the price each unit was bought at (and whether it was a quotation
  // price) comes from the order the return belongs to.
  const orderItems = useMemo(() => {
    const map: Record<number, OrderItemInfo> = {};
    (orders ?? []).forEach((order) =>
      order.sellerOrders.forEach((so) =>
        so.items.forEach((item) => {
          if (item.orderItemId != null) {
            map[item.orderItemId] = { unitPrice: item.unitPriceSnapshot, isQuote: order.quoteRequestId != null, orderId: order.orderId };
          }
        })
      )
    );
    return map;
  }, [orders]);

  const countFor = (status: string) =>
    status === "ALL" ? returns?.length ?? 0 : (returns ?? []).filter((r) => r.status === status).length;
  const filtered = (returns ?? []).filter((r) => statusFilter === "ALL" || r.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageReturns = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const products = useProductSummaries(
    pageReturns.flatMap((r) => r.lines.map((l) => l.productId).filter((id): id is string => !!id))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Returns</h2>
        <p className="mt-1 text-p3 font-body text-pneutral-600">
          Track the returns you&apos;ve raised, ship approved ones back, and see your refunds. To start a return, open the
          delivered order.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            aria-pressed={statusFilter === status}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === status ? "bg-primary-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {prettyStatus(status)}
            {returns !== null && <span className="ml-1.5 opacity-70">{countFor(status)}</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {!error && returns === null && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" />
        </div>
      )}

      {!error && returns !== null && returns.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-p2 font-body text-pneutral-600">You haven&apos;t raised any returns.</p>
          <Link
            href="/buyer_e8d45a1b/dashboard/orders"
            className="mt-4 inline-block rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Orders
          </Link>
        </div>
      )}

      {!error && returns !== null && returns.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-p3 font-body text-neutral-500">
          No {prettyStatus(statusFilter).toLowerCase()} returns.
        </p>
      )}

      {!error && buyerId && pageReturns.length > 0 && (
        <>
          <div className="flex flex-col gap-5">
            {pageReturns.map((returnRequest) => (
              <BuyerReturnCard
                key={returnRequest.returnId}
                returnRequest={returnRequest}
                buyerId={buyerId}
                products={products}
                orderItems={orderItems}
                onChanged={refresh}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-p4 font-body text-neutral-600">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                  className="rounded-md border border-primary-900 px-3 py-1.5 text-p4 font-semibold text-primary-900 hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 disabled:hover:bg-transparent"
                >
                  Previous
                </button>
                <span className="px-2">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                  className="rounded-md border border-primary-900 px-3 py-1.5 text-p4 font-semibold text-primary-900 hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
