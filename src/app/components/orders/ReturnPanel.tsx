"use client";

import ReturnActions from "./ReturnActions";
import { UnitPriceLines } from "@/src/app/commonComponents/cardUi";
import {
  RETURN_STEPS,
  ReturnLine,
  ReturnRequest,
  reasonLabel,
  units,
} from "@/src/types/buyer/returns";

function formatStepLabel(step: string): string {
  return step
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

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

// Buyer's side of one return (one parcel): progress, products, the seller's decision, the inspection
// outcome and refund, and the actions — cancel before shipping, ship, mark out for delivery.
export default function ReturnPanel({
  returnRequest,
  buyerId,
  onChanged,
  priceInfo,
}: {
  returnRequest: ReturnRequest;
  buyerId: string;
  onChanged: () => void;
  /** Order price / listed price of each order item, so the returned products show what they were bought at. */
  priceInfo?: Record<number, { unitPrice?: number; listedPrice?: number; isQuote: boolean }>;
}) {
  const { status } = returnRequest;
  const isRejected = status === "REJECTED";
  const isClosed = status === "CLOSED";
  const isCancelled = status === "CANCELLED";
  const isNegative = isRejected || isClosed || isCancelled;
  const currentStepIndex = RETURN_STEPS.indexOf(status);

  return (
    <div className="mt-2 mb-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-p4 font-heading font-semibold text-pneutral-800">Return #{returnRequest.returnId}</p>
        <span
          className={`text-label-l2 font-heading font-medium px-2.5 py-1 rounded-full ${
            isNegative ? "bg-red-100 text-red-700" : "bg-primary-100 text-primary-800"
          }`}
        >
          {formatStepLabel(status)}
        </span>
      </div>

      {!isNegative && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
          {RETURN_STEPS.map((step, index) => (
            <span
              key={step}
              className={`text-p4 font-body ${
                index === currentStepIndex
                  ? "text-primary-800 font-semibold"
                  : index < currentStepIndex
                    ? "text-pneutral-700"
                    : "text-pneutral-400"
              }`}
            >
              {index > 0 && "→ "}
              {formatStepLabel(step)}
            </span>
          ))}
        </div>
      )}

      <ul className="mb-1">
        {returnRequest.lines.map((line) => (
          <li key={line.lineId} className="flex justify-between text-p4 font-body text-pneutral-700">
            <span>
              {line.productName ?? "Item"} · {lineSummary(returnRequest, line)}
              <UnitPriceLines
                unitPrice={priceInfo?.[line.orderItemId]?.unitPrice}
                listedPrice={priceInfo?.[line.orderItemId]?.listedPrice}
                isQuote={priceInfo?.[line.orderItemId]?.isQuote ?? false}
              />
            </span>
            {line.refundAmount != null && line.refundAmount > 0 && (
              <span className="text-green-700">
                {line.refundedAt ? "Refunded" : "Refund"} ₹{line.refundAmount.toFixed(2)}
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="text-p4 font-body text-pneutral-600">
        Reason: {reasonLabel(returnRequest.reasonCode)}
        {returnRequest.reason ? ` — ${returnRequest.reason}` : ""}
      </p>
      {returnRequest.sellerComment && (
        <p className="text-p4 font-body text-pneutral-600">Seller: {returnRequest.sellerComment}</p>
      )}

      {status === "REQUESTED" && (
        <p className="text-p4 font-body text-pneutral-600 mt-1">Waiting for the seller to review your return.</p>
      )}
      {isRejected && <p className="text-p4 font-body text-red-700 mt-1">The seller rejected this return.</p>}
      {isCancelled && (
        <p className="text-p4 font-body text-pneutral-600 mt-1">
          You cancelled this return{returnRequest.cancelReason ? ` — ${returnRequest.cancelReason}` : ""}.
        </p>
      )}

      {returnRequest.trackingNumber && (
        <p className="text-p4 font-body text-pneutral-600 mt-1">
          Courier: {returnRequest.courierName ?? "-"} · Tracking: {returnRequest.trackingNumber}
        </p>
      )}

      {["APPROVED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(status) && (
        <p className="text-p4 font-body text-pneutral-500 mt-1">
          You&apos;ll be refunded once the seller receives and checks the goods.
        </p>
      )}

      {inspected(status) && returnRequest.inspectionNote && (
        <p className="text-p4 font-body text-pneutral-600 mt-1">Inspection: {returnRequest.inspectionNote}</p>
      )}
      {status === "RECEIVED" && returnRequest.refundAmount != null && (
        <p className="text-p4 font-body text-green-700">
          {returnRequest.refundHeld
            ? `Refund of ₹${returnRequest.refundAmount.toFixed(2)} will be issued once the rest of your order is delivered.`
            : `Refund of ₹${returnRequest.refundAmount.toFixed(2)} is on its way.`}
        </p>
      )}
      {status === "REFUNDED" && returnRequest.refundAmount != null && (
        <p className="text-p4 font-body text-green-700 font-semibold">
          Refunded ₹{returnRequest.refundAmount.toFixed(2)}
        </p>
      )}
      {isClosed && <p className="text-p4 font-body text-red-700">No refund is due for this return.</p>}

      <ReturnActions returnRequest={returnRequest} buyerId={buyerId} onChanged={onChanged} />
    </div>
  );
}
