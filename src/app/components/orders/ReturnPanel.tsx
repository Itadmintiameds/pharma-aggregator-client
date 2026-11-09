"use client";

import { useState } from "react";
import Button from "@/src/app/commonComponents/Button";
import { cancelReturn, markReturnOutForDelivery, shipReturn } from "@/src/services/buyer/returnService";
import {
  CANCELLABLE_RETURN_STATUSES,
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
function lineSummary(returnRequest: ReturnRequest, line: ReturnLine): string {
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
}: {
  returnRequest: ReturnRequest;
  buyerId: string;
  onChanged: () => void;
}) {
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const { status } = returnRequest;
  const isRejected = status === "REJECTED";
  const isClosed = status === "CLOSED";
  const isCancelled = status === "CANCELLED";
  const isNegative = isRejected || isClosed || isCancelled;
  const currentStepIndex = RETURN_STEPS.indexOf(status);
  const acceptedLines = returnRequest.lines.filter((l) => (l.approvedQuantity ?? l.requestedQuantity) > 0);

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

      {error && <p className="text-p4 text-red-600 mt-2">{error}</p>}

      {status === "APPROVED" && (
        <div className="flex flex-col gap-2 mt-3">
          <p className="text-p4 font-body text-pneutral-700">
            Return accepted. Pack{" "}
            {acceptedLines.map((l) => `${units(l.approvedQuantity ?? l.requestedQuantity)} of ${l.productName ?? "item"}`).join(", ")}{" "}
            in one parcel, hand it to a courier and enter the shipment details.
          </p>
          <input
            placeholder="Courier name"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
          />
          <input
            placeholder="Tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
          />
          <input
            placeholder="Tracking URL (optional)"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
          />
          <button
            disabled={busy || !courierName || !trackingNumber}
            onClick={() =>
              run(() => shipReturn(returnRequest.returnId, buyerId, courierName, trackingNumber, trackingUrl))
            }
            className="bg-primary-900 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-40"
          >
            {busy ? "Shipping..." : "Mark Shipped"}
          </button>
        </div>
      )}

      {status === "SHIPPED" && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            label={busy ? "Updating..." : "Mark Out for Delivery"}
            disabled={busy}
            onClick={() => run(() => markReturnOutForDelivery(returnRequest.returnId, buyerId))}
          />
        </div>
      )}

      {CANCELLABLE_RETURN_STATUSES.has(status) &&
        (confirmingCancel ? (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <p className="text-p4 font-body text-pneutral-700">Cancel this return? You can still return these items while the return window is open.</p>
            <button
              disabled={busy}
              onClick={() => run(() => cancelReturn(returnRequest.returnId, buyerId))}
              className="border border-red-500 text-red-600 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            >
              {busy ? "Cancelling..." : "Yes, cancel return"}
            </button>
            <button
              disabled={busy}
              onClick={() => setConfirmingCancel(false)}
              className="border border-neutral-300 text-neutral-700 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            >
              Keep it
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingCancel(true)}
            className="mt-3 text-p4 font-body font-semibold text-red-600 hover:underline"
          >
            Cancel return
          </button>
        ))}
    </div>
  );
}
