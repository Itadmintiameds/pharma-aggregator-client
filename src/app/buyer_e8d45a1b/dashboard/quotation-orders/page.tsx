"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBuyerOrders } from "@/src/hooks/useBuyerOrders";
import { getMyQuoteRequests } from "@/src/services/buyer/quoteRequestService";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";
import { prettyStatus, useProductSummaries } from "@/src/app/commonComponents/cardUi";
import BuyerOrderCard from "../components/BuyerOrderCard";

const STATUS_FILTERS = ["ALL", "PLACED", "PARTIALLY_SHIPPED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAGE_SIZE = 10;

export default function BuyerQuotationOrdersPage() {
  const { orders, error } = useBuyerOrders();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Only adds the seller name; the page works without it, so a failure is ignored.
    queueMicrotask(() => {
      getMyQuoteRequests().then(setQuotes).catch(() => setQuotes([]));
    });
  }, []);

  useEffect(() => {
    // Deep link, e.g. ?status=DELIVERED opens that tab.
    const wanted = new URLSearchParams(window.location.search).get("status");
    if (wanted && STATUS_FILTERS.includes(wanted)) queueMicrotask(() => setStatusFilter(wanted));
  }, []);

  const quoteById = useMemo(() => new Map(quotes.map((q) => [q.quoteRequestId, q])), [quotes]);
  const quoteOrders = useMemo(
    () => (orders ?? []).filter((o) => o.quoteRequestId != null),
    [orders]
  );
  const countFor = (status: string) =>
    status === "ALL" ? quoteOrders.length : quoteOrders.filter((o) => o.status === status).length;
  const filtered = quoteOrders.filter((o) => statusFilter === "ALL" || o.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageOrders = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const products = useProductSummaries(
    pageOrders.flatMap((o) => o.sellerOrders.flatMap((so) => so.items.map((i) => i.productId).filter((id): id is string => !!id)))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Quotation Orders</h2>
        <p className="mt-1 text-p3 font-body text-pneutral-600">
          Orders you placed at a price a seller quoted you, instead of the listed price.
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
            {orders !== null && <span className="ml-1.5 opacity-70">{countFor(status)}</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {!error && orders === null && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" />
        </div>
      )}

      {!error && orders !== null && quoteOrders.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-p2 font-body text-pneutral-600">You haven&apos;t placed any orders from a quote yet.</p>
          <Link
            href="/buyer_e8d45a1b/dashboard/rfq"
            className="mt-4 inline-block rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Quotes
          </Link>
        </div>
      )}

      {!error && quoteOrders.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-p3 font-body text-neutral-500">
          No {prettyStatus(statusFilter).toLowerCase()} quotation orders.
        </p>
      )}

      {!error && pageOrders.length > 0 && (
        <>
          <div className="flex flex-col gap-5">
            {pageOrders.map((order) => (
              <BuyerOrderCard
                key={order.orderId}
                order={order}
                quote={order.quoteRequestId != null ? quoteById.get(order.quoteRequestId) : undefined}
                products={products}
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
