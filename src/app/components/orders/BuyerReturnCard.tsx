"use client";

import Link from "next/link";
import { RETURN_STEPS, ReturnLine, ReturnRequest, reasonLabel, units } from "@/src/types/buyer/returns";
import ReturnActions from "@/src/app/components/orders/ReturnActions";
import {
  ProductSummary,
  ProductThumb,
  StatusBadge,
  UnitPriceLines,
  prettyStatus,
} from "@/src/app/commonComponents/cardUi";
import { formatMoney } from "@/src/utils/dashboardFormat";

/** What an order item was bought at (taken from the order the return belongs to). */
export type OrderItemInfo = { unitPrice?: number; isQuote: boolean; orderId?: string };

const inspected = (status: string) => status === "RECEIVED" || status === "REFUNDED" || status === "CLOSED";

// What happened to one product of the return, in a short phrase.
export function lineSummary(returnRequest: ReturnRequest, line: ReturnLine): string {
  const requested = line.requestedQuantity;
  const approved = line.approvedQuantity;
  if (inspected(returnRequest.status)) {
    const accepted = (line.restockedQuantity ?? 0) + (line.damagedQuantity ?? 0);
    if (approved === 0) return "not accepted by the seller";
    return `${units(accepted)} accepted${line.rejectedQuantity ? `, ${units(line.rejectedQuantity)} not accepted` : ""}`;
  }
  if (returnRequest.status === "REJECTED" || returnRequest.status === "CANCELLED") return units(requested);
  if (approved == null) return `${units(requested)} requested`;
  if (approved === 0) return "not accepted by the seller";
  return approved === requested ? units(approved) : `${units(approved)} accepted of ${requested} requested`;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-32 shrink-0 text-p4 font-body text-neutral-500">{label}</dt>
      <dd className="text-p4 font-body text-neutral-800">{children}</dd>
    </div>
  );
}

/**
 * The buyer's view of one return (one parcel): progress, the products with their images and the price they were
 * bought at, the seller's decision, the inspection outcome, the refund, and the actions (ship it back, mark it out
 * for delivery, cancel it). Used on the Returns page and inside an order's detail page.
 */
export default function BuyerReturnCard({
  returnRequest,
  buyerId,
  products,
  orderItems,
  onChanged,
  hideOrderLink = false,
}: {
  returnRequest: ReturnRequest;
  buyerId: string;
  products: Record<string, ProductSummary>;
  orderItems: Record<number, OrderItemInfo>;
  onChanged: () => void;
  /** Inside an order's own page the link back to that order is redundant. */
  hideOrderLink?: boolean;
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
            {!hideOrderLink && orderId ? (
              <>
                Order{" "}
                <Link href={`/buyer_e8d45a1b/dashboard/orders/${orderId}`} className="text-primary-800 hover:underline">
                  {returnRequest.sellerOrderId ?? orderId}
                </Link>
                {requested ? " · " : ""}
              </>
            ) : null}
            {requested ? `Requested ${requested}` : ""}
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
