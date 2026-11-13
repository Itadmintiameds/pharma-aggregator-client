"use client";

import { useState } from "react";
import Button from "@/src/app/commonComponents/Button";
import { cancelReturn, markReturnOutForDelivery, shipReturn } from "@/src/services/buyer/returnService";
import { CANCELLABLE_RETURN_STATUSES, ReturnRequest, units } from "@/src/types/buyer/returns";

// What the buyer can DO with a return: ship it once approved, mark it out for delivery, or cancel it before it
// ships. Shared by the return panel inside an order and by the buyer's Returns page, so both behave the same.
export default function ReturnActions({
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
  const acceptedLines = returnRequest.lines.filter((l) => (l.approvedQuantity ?? l.requestedQuantity) > 0);

  return (
    <>
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
    </>
  );
}
