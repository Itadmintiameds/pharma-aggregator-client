"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { decideReturn, getSellerReturns, receiveReturn } from "@/src/services/seller/sellerReturnService";
import { ReturnLine, ReturnRequest, reasonLabel, units } from "@/src/types/buyer/returns";
import { proRate } from "@/src/utils/pricing";

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

function isWholeNumberIn(value: string, min: number, max: number): boolean {
  const n = Number(value);
  return value !== "" && Number.isInteger(n) && n >= min && n <= max;
}

const inputClass = "w-20 px-2 py-1 border border-neutral-300 rounded-lg text-sm bg-white";

const inspected = (status: string) => status === "RECEIVED" || status === "REFUNDED" || status === "CLOSED";

// One decision for the whole return. Units can be lowered per product (0 turns that product down).
// A note is required to reject, or to accept fewer units than requested.
function DecisionForm({
  lines,
  busy,
  onApprove,
  onReject,
}: {
  lines: ReturnLine[];
  busy: boolean;
  onApprove: (lines: { lineId: number; approvedQuantity: number }[], comment: string) => void;
  onReject: (comment: string) => void;
}) {
  const [approved, setApproved] = useState<Record<number, string>>(() =>
    Object.fromEntries(lines.map((l) => [l.lineId, String(l.requestedQuantity)]))
  );
  const [comment, setComment] = useState("");
  const [rejectTried, setRejectTried] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const quantitiesValid = lines.every((l) => isWholeNumberIn(approved[l.lineId] ?? "", 0, l.requestedQuantity));
  const totalApproved = quantitiesValid ? lines.reduce((sum, l) => sum + Number(approved[l.lineId]), 0) : 0;
  const partial = quantitiesValid && lines.some((l) => Number(approved[l.lineId]) < l.requestedQuantity);
  const hasComment = comment.trim() !== "";

  return (
    <div className="flex flex-col gap-2 mt-3 p-3 bg-neutral-50 rounded-lg">
      <p className="text-p4 font-body text-pneutral-700">Units to accept</p>
      {lines.map((l) => (
        <label key={l.lineId} className="flex items-center justify-between gap-3 text-p4 font-body text-pneutral-700">
          <span>{l.productName ?? "Item"}</span>
          <span className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={l.requestedQuantity}
              value={approved[l.lineId] ?? ""}
              disabled={busy}
              onChange={(e) => setApproved((prev) => ({ ...prev, [l.lineId]: e.target.value }))}
              className={inputClass}
            />
            of {l.requestedQuantity}
          </span>
        </label>
      ))}
      <textarea
        ref={commentRef}
        placeholder={partial ? "Why are you accepting fewer units? (required)" : "Note to the buyer (required to reject)"}
        value={comment}
        disabled={busy}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white resize-none"
      />
      {rejectTried && !hasComment && (
        <p className="text-p4 font-body text-red-600">Add a note telling the buyer why you are rejecting this return.</p>
      )}
      {!quantitiesValid && (
        <p className="text-p4 font-body text-red-600">Enter a whole number between 0 and the units requested.</p>
      )}
      {quantitiesValid && totalApproved === 0 && (
        <p className="text-p4 font-body text-red-600">Accept at least one unit, or reject the return.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy || !quantitiesValid || totalApproved === 0 || (partial && !hasComment)}
          onClick={() =>
            onApprove(
              lines.map((l) => ({ lineId: l.lineId, approvedQuantity: Number(approved[l.lineId]) })),
              comment.trim()
            )
          }
          className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {partial ? `Accept ${units(totalApproved)}` : "Accept"}
        </button>
        <button
          disabled={busy}
          onClick={() => {
            if (!hasComment) {
              setRejectTried(true);
              commentRef.current?.focus();
              return;
            }
            onReject(comment.trim());
          }}
          className="border border-red-500 text-red-600 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// Inspection on receipt, per product: damaged units go to damaged stock, rejected units aren't accepted, the
// rest go back to normal stock. Accepted (good + damaged) units are refunded as soon as this is saved.
function ReceiveForm({
  lines,
  busy,
  onSubmit,
}: {
  lines: ReturnLine[];
  busy: boolean;
  onSubmit: (
    lines: { lineId: number; damagedQuantity: number; rejectedQuantity: number }[],
    inspectionNote: string
  ) => void;
}) {
  // Products the seller turned down at the decision aren't in the parcel.
  const expected = lines.filter((l) => l.quantity > 0);
  const [damaged, setDamaged] = useState<Record<number, string>>(() =>
    Object.fromEntries(expected.map((l) => [l.lineId, "0"]))
  );
  const [rejected, setRejected] = useState<Record<number, string>>(() =>
    Object.fromEntries(expected.map((l) => [l.lineId, "0"]))
  );
  const [note, setNote] = useState("");

  const lineValid = (l: ReturnLine) =>
    isWholeNumberIn(damaged[l.lineId] ?? "", 0, l.quantity) &&
    isWholeNumberIn(rejected[l.lineId] ?? "", 0, l.quantity) &&
    Number(damaged[l.lineId]) + Number(rejected[l.lineId]) <= l.quantity;
  const valid = expected.every(lineValid);
  const anyRejected = valid && expected.some((l) => Number(rejected[l.lineId]) > 0);
  const noteMissing = anyRejected && note.trim() === "";
  const anyAccepted = valid && expected.some((l) => l.quantity - Number(rejected[l.lineId]) > 0);
  // Same pro-rating as the order-service (lineTotal is the value of all `quantity` units).
  const refund = valid
    ? expected.reduce((sum, l) => {
        const accepted = l.quantity - Number(rejected[l.lineId]);
        return sum + (l.lineTotal != null ? proRate(l.lineTotal, accepted, l.quantity) : 0);
      }, 0)
    : null;

  return (
    <div className="flex flex-col gap-2 mt-3 p-3 bg-neutral-50 rounded-lg">
      <p className="text-p4 font-body text-pneutral-700">
        Inspect the parcel. The buyer is refunded for every unit you accept.
      </p>
      {expected.map((l) => {
        const restock = l.quantity - Number(damaged[l.lineId]) - Number(rejected[l.lineId]);
        return (
          <div key={l.lineId} className="border-t border-neutral-200 pt-2">
            <p className="text-p4 font-body font-semibold text-pneutral-800">
              {l.productName ?? "Item"} · {units(l.quantity)} expected
            </p>
            <div className="flex flex-wrap gap-4 mt-1">
              <label className="flex items-center gap-2 text-p4 font-body text-pneutral-700">
                Damaged
                <input
                  type="number"
                  min={0}
                  max={l.quantity}
                  value={damaged[l.lineId] ?? ""}
                  disabled={busy}
                  onChange={(e) => setDamaged((prev) => ({ ...prev, [l.lineId]: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-2 text-p4 font-body text-pneutral-700">
                Rejected
                <input
                  type="number"
                  min={0}
                  max={l.quantity}
                  value={rejected[l.lineId] ?? ""}
                  disabled={busy}
                  onChange={(e) => setRejected((prev) => ({ ...prev, [l.lineId]: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
            {lineValid(l) ? (
              <p className="text-p4 font-body text-pneutral-500 mt-1">
                {restock} back to stock · {damaged[l.lineId]} to damaged stock · {rejected[l.lineId]} rejected
              </p>
            ) : (
              <p className="text-p4 font-body text-red-600 mt-1">
                Damaged and rejected together must be between 0 and {l.quantity}.
              </p>
            )}
          </div>
        );
      })}
      <p className="text-p4 font-body text-pneutral-500">
        Damaged units are still refunded and go to damaged stock. Rejected units (not as described, missing) are not
        refunded.
      </p>
      <textarea
        placeholder={anyRejected ? "Why were units rejected? (required)" : "Inspection note (optional)"}
        value={note}
        disabled={busy}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white resize-none"
      />
      {refund != null && <p className="text-p4 font-body text-pneutral-700">Refund ₹{refund.toFixed(2)}</p>}
      <button
        disabled={busy || !valid || noteMissing}
        onClick={() =>
          onSubmit(
            expected.map((l) => ({
              lineId: l.lineId,
              damagedQuantity: Number(damaged[l.lineId]),
              rejectedQuantity: Number(rejected[l.lineId]),
            })),
            note.trim()
          )
        }
        className="bg-primary-900 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-40"
      >
        {busy ? "Saving..." : anyAccepted ? "Confirm received & refund" : "Confirm received (no refund)"}
      </button>
    </div>
  );
}

function ReturnCard({
  returnRequest,
  sellerId,
  onChanged,
}: {
  returnRequest: ReturnRequest;
  sellerId: string;
  onChanged: () => void;
}) {
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

  const { status, lines } = returnRequest;
  const isNegative = status === "REJECTED" || status === "CLOSED" || status === "CANCELLED";

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-p2 font-heading font-semibold text-pneutral-900">Return #{returnRequest.returnId}</p>
          <p className="text-p4 font-body text-pneutral-500">
            Order {returnRequest.sellerOrderId}
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
        <span
          className={`text-p4 font-body font-semibold px-3 py-1 rounded-full ${
            isNegative ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {status}
        </span>
      </div>

      <ul className="mb-2">
        {lines.map((l) => (
          <li key={l.lineId} className="flex justify-between text-p4 font-body text-pneutral-600">
            <span>
              {l.productName ?? "Item"} x {l.quantity}
              {l.approvedQuantity != null &&
                l.approvedQuantity !== l.requestedQuantity &&
                ` (${l.requestedQuantity} requested)`}
              {inspected(status) &&
                l.quantity > 0 &&
                ` · ${l.restockedQuantity ?? 0} to stock, ${l.damagedQuantity ?? 0} damaged, ${l.rejectedQuantity ?? 0} rejected`}
            </span>
            {l.lineTotal != null && <span>₹{l.lineTotal.toFixed(2)}</span>}
          </li>
        ))}
      </ul>
      <p className="text-p4 font-body text-pneutral-600 mb-1">
        Buyer&apos;s reason: {reasonLabel(returnRequest.reasonCode)}
        {returnRequest.reason ? ` — ${returnRequest.reason}` : ""}
      </p>
      {returnRequest.sellerComment && (
        <p className="text-p4 font-body text-pneutral-600 mb-1">Your note: {returnRequest.sellerComment}</p>
      )}
      {status === "CANCELLED" && (
        <p className="text-p4 font-body text-pneutral-600 mb-1">
          Cancelled by the buyer{returnRequest.cancelReason ? ` — ${returnRequest.cancelReason}` : ""}.
        </p>
      )}
      {returnRequest.trackingNumber && (
        <p className="text-p4 font-body text-pneutral-600 mb-1">
          Courier: {returnRequest.courierName ?? "-"} · Tracking: {returnRequest.trackingNumber}
          {returnRequest.trackingUrl && /^https?:\/\//i.test(returnRequest.trackingUrl) && (
            <>
              {" · "}
              <a href={returnRequest.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">
                Track
              </a>
            </>
          )}
        </p>
      )}
      {status === "APPROVED" && (
        <p className="text-p4 font-body text-pneutral-500 mb-1">Waiting for the buyer to ship the parcel back.</p>
      )}
      {inspected(status) && returnRequest.inspectionNote && (
        <p className="text-p4 font-body text-pneutral-600 mb-1">Inspection: {returnRequest.inspectionNote}</p>
      )}
      {status === "RECEIVED" && returnRequest.refundAmount != null && (
        <p className="text-p4 font-body text-pneutral-600 mb-1">
          {returnRequest.refundHeld
            ? `Refund of ₹${returnRequest.refundAmount.toFixed(2)} will be issued once the buyer's whole COD order is delivered.`
            : `Refund of ₹${returnRequest.refundAmount.toFixed(2)} issued, awaiting completion.`}
        </p>
      )}
      {status === "REFUNDED" && returnRequest.refundAmount != null && (
        <p className="text-p4 font-body text-green-700 mb-1">Refunded ₹{returnRequest.refundAmount.toFixed(2)}</p>
      )}
      {status === "CLOSED" && <p className="text-p4 font-body text-red-700 mb-1">No units accepted — nothing refunded.</p>}

      {error && <p className="text-p4 text-red-600 mb-2">{error}</p>}

      {status === "REQUESTED" && (
        <DecisionForm
          lines={lines}
          busy={busy}
          onApprove={(approvedLines, comment) =>
            run(() => decideReturn(returnRequest.returnId, sellerId, true, comment, approvedLines))
          }
          onReject={(comment) => run(() => decideReturn(returnRequest.returnId, sellerId, false, comment))}
        />
      )}

      {(status === "SHIPPED" || status === "OUT_FOR_DELIVERY") && (
        <ReceiveForm
          lines={lines}
          busy={busy}
          onSubmit={(inspectedLines, note) => run(() => receiveReturn(returnRequest.returnId, sellerId, inspectedLines, note))}
        />
      )}
    </div>
  );
}

export default function SellerReturnsPage() {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  const loadReturns = useCallback(async (id: string, status: string) => {
    try {
      const data = await getSellerReturns(id, status === "ALL" ? undefined : status);
      setReturns(data.sort((a, b) => (b.requestedAt ?? "").localeCompare(a.requestedAt ?? "")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load returns.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const profile = await sellerProfileService.getCurrentSellerProfile();
        setSellerId(profile.sellerId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load seller profile.");
      }
    })();
  }, []);

  useEffect(() => {
    // Deferred to a microtask, same as useSellerOrders: the set-state-in-effect lint rule
    // flags loadReturns when called directly.
    if (sellerId) {
      queueMicrotask(() => loadReturns(sellerId, statusFilter));
    }
  }, [sellerId, statusFilter, loadReturns]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h4 font-heading font-medium text-pneutral-900">Returns</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              statusFilter === status ? "bg-primary-900 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {returns === null && !error && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
        </div>
      )}

      {returns !== null && returns.length === 0 && (
        <p className="text-p3 font-body text-neutral-500">No returns found.</p>
      )}

      {returns !== null && returns.length > 0 && sellerId && (
        <div className="space-y-4">
          {returns.map((returnRequest) => (
            <ReturnCard
              key={returnRequest.returnId}
              returnRequest={returnRequest}
              sellerId={sellerId}
              onChanged={() => loadReturns(sellerId, statusFilter)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
