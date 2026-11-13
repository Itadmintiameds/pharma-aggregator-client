"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBuyerReturns } from "@/src/hooks/useBuyerReturns";
import { useBuyerOrders } from "@/src/hooks/useBuyerOrders";
import { RETURN_STEPS, ReturnRequest, reasonLabel } from "@/src/types/buyer/returns";
import ReturnActions from "@/src/app/components/orders/ReturnActions";
import { lineSummary } from "@/src/app/components/orders/ReturnPanel";
import {
  ProductSummary,
  ProductThumb,
  StatusBadge,
  UnitPriceLines,
  prettyStatus,
  useProductSummaries,
} from "@/src/app/commonComponents/cardUi";
import { formatMoney } from "@/src/utils/dashboardFormat";

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

type OrderItemInfo = { unitPrice?: number; isQuote: boolean; orderId: string };

const inspected = (status: string) => status === "RECEIVED" || status === "REFUNDED" || status === "CLOSED";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-32 shrink-0 text-p4 font-body text-neutral-500">{label}</dt>
      <dd className="text-p4 font-body text-neutral-800">{children}</dd>
    </div>
  );
}

function ReturnCard({
  returnRequest,
  buyerId,
  products,
  orderItems,
  onChanged,
}: {
  returnRequest: ReturnRequest;
  buyerId: string;
  products: Record<string, ProductSummary>;
  orderItems: Record<number, OrderItemInfo>;
  onChanged: () => void;
}) {
  const { status, lines } = returnRequest;
  const negative = status === "REJECTED" || status === "CLOSED" || status === "CANCELLED";
  const stepIndex = RETURN_STEPS.indexOf(status);
  const orderId = returnRequest.orderId ?? lines.map((l) => orderItems[l.orderItemId]?.orderId).find(Boolean);
  const requested = returnRequest.requestedAt
    ? new Date(returnRequest.requestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const trackingOk = !!returnRequest.trackingUrl && /^https?:\/\//i.test(returnRequest.trackingUrl);
  const actionable = status === "REQUESTED" || status === "APPROVED" || status === "SHIPPED";

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4">
        <div>
          <p className="text-p2 font-heading font-semibold text-pneutral-900">Return #{returnRequest.returnId}</p>
          <p className="text-p4 font-body text-neutral-500">
            {orderId ? (
              <>
                Order{" "}
                <Link href={`/buyer_e8d45a1b/dashboard/orders/${orderId}`} className="text-primary-800 hover:underline">
                  {returnRequest.sellerOrderId ?? orderId}
                </Link>
              </>
            ) : (
              <>Order {returnRequest.sellerOrderId}</>
            )}
            {requested ? ` · Requested ${requested}` : ""}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {!negative && (
        <ol className="flex flex-wrap gap-x-2 gap-y-1 border-b border-neutral-100 px-6 py-3 text-xs">
          {RETURN_STEPS.map((step, index) => (
            <li
              key={step}
              className={
                index === stepIndex
                  ? "font-semibold text-primary-800"
                  : index < stepIndex
                    ? "text-neutral-700"
                    : "text-neutral-400"
              }
            >
              {index > 0 && <span className="mr-2 text-neutral-300">→</span>}
              {prettyStatus(step)}
            </li>
          ))}
        </ol>
      )}

      <ul className="divide-y divide-neutral-100 px-6">
        {lines.map((l) => {
          const info = orderItems[l.orderItemId];
          const refund = l.refundAmount != null && l.refundAmount > 0 ? l.refundAmount : null;
          return (
            <li key={l.lineId} className="flex items-center gap-4 py-4">
              <ProductThumb src={l.productId ? products[l.productId]?.image : undefined} alt={l.productName ?? "Product"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-p3 font-body font-semibold text-neutral-900">{l.productName ?? "Item"}</p>
                {l.productId && l.productId !== l.productName && <p className="text-xs text-neutral-500">{l.productId}</p>}
                <p className="mt-1 text-p4 font-body text-neutral-600">{lineSummary(returnRequest, l)}</p>
                <UnitPriceLines
                  unitPrice={info?.unitPrice}
                  listedPrice={l.productId ? products[l.productId]?.listedPrice : undefined}
                  isQuote={info?.isQuote ?? false}
                />
              </div>
              <div className="text-right">
                {l.lineTotal != null && (
                  <p className="text-p3 font-body font-semibold text-neutral-900">{formatMoney(l.lineTotal)}</p>
                )}
                {refund != null && (
                  <p className="text-xs text-green-700">
                    {l.refundedAt ? "Refunded" : "Refund"} {formatMoney(refund)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="flex flex-col gap-2 border-t border-neutral-100 bg-neutral-50/60 px-6 py-4">
        <DetailRow label="Your reason">
          {reasonLabel(returnRequest.reasonCode)}
          {returnRequest.reason ? ` — ${returnRequest.reason}` : ""}
        </DetailRow>
        {returnRequest.sellerComment && <DetailRow label="Seller's note">{returnRequest.sellerComment}</DetailRow>}
        {returnRequest.trackingNumber && (
          <DetailRow label="Courier">
            {returnRequest.courierName ?? "-"} · Tracking {returnRequest.trackingNumber}
            {trackingOk && (
              <>
                {" · "}
                <a href={returnRequest.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">
                  Track
                </a>
              </>
            )}
          </DetailRow>
        )}
        {inspected(status) && returnRequest.inspectionNote && (
          <DetailRow label="Inspection">{returnRequest.inspectionNote}</DetailRow>
        )}
        {status === "CANCELLED" && (
          <DetailRow label="Cancelled">
            By you{returnRequest.cancelReason ? ` — ${returnRequest.cancelReason}` : ""}
          </DetailRow>
        )}
      </dl>

      {(status === "REQUESTED" ||
        status === "APPROVED" ||
        status === "SHIPPED" ||
        status === "OUT_FOR_DELIVERY" ||
        status === "REJECTED" ||
        status === "CLOSED" ||
        (status === "RECEIVED" && returnRequest.refundAmount != null) ||
        (status === "REFUNDED" && returnRequest.refundAmount != null)) && (
        <div
          className={`px-6 py-3 text-p4 font-body ${
            status === "REFUNDED"
              ? "bg-green-50 text-green-800"
              : status === "REJECTED" || status === "CLOSED"
                ? "bg-red-50 text-red-700"
                : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {status === "REQUESTED" && "Waiting for the seller to review your return."}
          {(status === "APPROVED" || status === "SHIPPED" || status === "OUT_FOR_DELIVERY") &&
            "You'll be refunded once the seller receives and checks the goods."}
          {status === "REJECTED" && "The seller rejected this return."}
          {status === "CLOSED" && "No refund is due for this return."}
          {status === "RECEIVED" &&
            returnRequest.refundAmount != null &&
            (returnRequest.refundHeld
              ? `Refund of ${formatMoney(returnRequest.refundAmount)} will be issued once the rest of your order is delivered.`
              : `Refund of ${formatMoney(returnRequest.refundAmount)} is on its way.`)}
          {status === "REFUNDED" && returnRequest.refundAmount != null && `Refunded ${formatMoney(returnRequest.refundAmount)}`}
        </div>
      )}

      {actionable && (
        <div className="border-t border-neutral-100 px-6 pb-5 pt-1">
          <ReturnActions returnRequest={returnRequest} buyerId={buyerId} onChanged={onChanged} />
        </div>
      )}
    </div>
  );
}

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
              <ReturnCard
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
