"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBuyerOrders } from "@/src/hooks/useBuyerOrders";
import { getMyQuoteRequests } from "@/src/services/buyer/quoteRequestService";
import type { Order } from "@/src/types/buyer/order";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";
import {
  ProductSummary,
  ProductThumb,
  StatusBadge,
  prettyStatus,
  useProductSummaries,
} from "@/src/app/commonComponents/cardUi";
import { formatMoney } from "@/src/utils/dashboardFormat";

const STATUS_FILTERS = ["ALL", "PLACED", "PARTIALLY_SHIPPED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAGE_SIZE = 10;

function SummaryRow({ label, value, strong }: { label: string; value?: number; strong?: boolean }) {
  if (value == null) return null;
  return (
    <div className={`flex justify-between gap-8 ${strong ? "mt-1 border-t border-neutral-200 pt-2" : ""}`}>
      <span className={strong ? "text-p3 font-semibold text-neutral-900" : "text-p4 text-neutral-500"}>{label}</span>
      <span className={strong ? "text-p2 font-heading font-semibold text-neutral-900" : "text-p4 text-neutral-700"}>
        {formatMoney(value)}
      </span>
    </div>
  );
}

function QuotationOrderCard({
  order,
  quote,
  products,
}: {
  order: Order;
  quote?: QuoteRequest;
  products: Record<string, ProductSummary>;
}) {
  const router = useRouter();
  const items = order.sellerOrders.flatMap((so) => so.items);
  const placed = order.placedAt
    ? new Date(order.placedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;
  const detailHref = `/buyer_e8d45a1b/dashboard/orders/${order.orderId}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={detailHref} className="text-p2 font-heading font-semibold text-pneutral-900 hover:underline">
              {order.orderId}
            </Link>
            <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-800">
              Quotation price
            </span>
          </div>
          <p className="mt-0.5 text-p4 font-body text-neutral-500">
            {placed ? `Placed on ${placed}` : "Placed"}
            {quote?.sellerName ? ` · Seller: ${quote.sellerName}` : ""}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="divide-y divide-neutral-100 px-6">
        {items.map((item) => {
          const listed = item.productId ? products[item.productId]?.listedPrice : undefined;
          const unit = item.unitPriceSnapshot;
          const vsListed = listed && unit != null ? Math.round(((unit - listed) / listed) * 100) : null;
          return (
            <li key={item.orderItemId} className="flex items-center gap-4 py-4">
              <ProductThumb
                src={item.productId ? products[item.productId]?.image : undefined}
                alt={item.productNameSnapshot ?? "Product"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-p3 font-body font-semibold text-neutral-900">
                  {item.productNameSnapshot ?? "Item"}
                </p>
                <p className="mt-1 text-p4 font-body text-neutral-600">
                  {unit != null ? `${formatMoney(unit)} × ${item.quantity}` : `Qty ${item.quantity}`}
                  {quote?.unit ? ` ${quote.unit}` : ""}
                </p>
                {listed != null && (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Original listed price <span className="line-through">{formatMoney(listed)}</span>
                    {vsListed !== null && vsListed !== 0 && (
                      <span className={vsListed < 0 ? "text-green-700" : "text-amber-700"}>
                        {" "}
                        · you paid {Math.abs(vsListed)}% {vsListed < 0 ? "less" : "more"}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {item.lineTotal != null && (
                <p className="text-p3 font-body font-semibold text-neutral-900">{formatMoney(item.lineTotal)}</p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-4 border-t border-neutral-100 bg-neutral-50/60 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(detailHref)}
            className="rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
          >
            View order
          </button>
          <Link href="/buyer_e8d45a1b/dashboard/rfq" className="text-p4 font-semibold text-primary-800 hover:underline">
            View quote{order.quoteRequestId != null ? ` #${order.quoteRequestId}` : ""}
          </Link>
        </div>
        <div className="flex min-w-[220px] flex-col gap-1">
          {order.subtotal != null && order.grandTotal != null && order.subtotal !== order.grandTotal && (
            <>
              <SummaryRow label="Subtotal" value={order.subtotal} />
              {!!order.shippingTotal && <SummaryRow label="Shipping" value={order.shippingTotal} />}
              {!!order.taxTotal && <SummaryRow label="Tax" value={order.taxTotal} />}
            </>
          )}
          <SummaryRow label="Total" value={order.grandTotal} strong />
        </div>
      </div>
    </div>
  );
}

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
              <QuotationOrderCard
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
