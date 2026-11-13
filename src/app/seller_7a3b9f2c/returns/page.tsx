"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductThumb, StatusBadge, prettyStatus, useProductSummaries, type ProductSummary } from "../components/sellerCardUi";
import { useSellerOrders } from "@/src/hooks/useSellerOrders";
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
          <span>
            {l.productName ?? "Item"}
            {l.productId && l.productId !== l.productName ? ` (${l.productId})` : ""}
          </span>
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
              {l.productName ?? "Item"}
              {l.productId && l.productId !== l.productName ? ` (${l.productId})` : ""} · {units(l.quantity)} expected
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
  sellerId,
  products,
  orderItems,
  onChanged,
}: {
  returnRequest: ReturnRequest;
  sellerId: string;
  products: Record<string, ProductSummary>;
  /** What each order item was bought at (from the seller order the return belongs to). */
  orderItems: Record<number, { unitPrice?: number; isQuote: boolean }>;
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
  const trackingOk = !!returnRequest.trackingUrl && /^https?:\/\//i.test(returnRequest.trackingUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4">
        <div>
          <p className="text-p2 font-heading font-semibold text-pneutral-900">Return #{returnRequest.returnId}</p>
          <p className="text-p4 font-body text-neutral-500">
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
        <StatusBadge status={status} />
      </div>

      <ul className="divide-y divide-neutral-100 px-6">
        {lines.map((l) => {
          const info = orderItems[l.orderItemId];
          const unitPrice = info?.unitPrice;
          const listed = l.productId ? products[l.productId]?.listedPrice : undefined;
          const showListed = listed != null && unitPrice != null && Math.abs(listed - unitPrice) > 0.005;
          const vsListed = info?.isQuote && showListed ? Math.round(((unitPrice! - listed!) / listed!) * 100) : null;
          return (
          <li key={l.lineId} className="flex items-center gap-4 py-4">
            <ProductThumb src={l.productId ? products[l.productId]?.image : undefined} alt={l.productName ?? "Product"} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-p3 font-body font-semibold text-neutral-900">{l.productName ?? "Item"}</p>
              {l.productId && l.productId !== l.productName && (
                <p className="text-xs text-neutral-500">{l.productId}</p>
              )}
              <p className="mt-1 text-p4 font-body text-neutral-600">
                Qty {l.quantity}
                {l.approvedQuantity != null &&
                  l.approvedQuantity !== l.requestedQuantity &&
                  ` (${l.requestedQuantity} requested)`}
              </p>
              {unitPrice != null && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  Order price <span className="font-semibold text-neutral-800">₹{unitPrice.toFixed(2)}</span> / unit
                  {info?.isQuote && (
                    <span className="ml-1.5 rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-800">
                      Quotation price
                    </span>
                  )}
                </p>
              )}
              {showListed && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  {info?.isQuote ? "Original listed price" : "Current listed price"}{" "}
                  <span className="line-through">₹{listed!.toFixed(2)}</span>
                  {vsListed !== null && vsListed !== 0 && (
                    <span className={vsListed < 0 ? "text-green-700" : "text-amber-700"}>
                      {" "}
                      · quoted {Math.abs(vsListed)}% {vsListed < 0 ? "below" : "above"} listed
                    </span>
                  )}
                </p>
              )}
              {inspected(status) && l.quantity > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">
                    {l.restockedQuantity ?? 0} to stock
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                    {l.damagedQuantity ?? 0} damaged
                  </span>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">
                    {l.rejectedQuantity ?? 0} rejected
                  </span>
                </div>
              )}
            </div>
            {l.lineTotal != null && (
              <p className="text-p3 font-body font-semibold text-neutral-900">₹{l.lineTotal.toFixed(2)}</p>
            )}
          </li>
          );
        })}
      </ul>

      <dl className="flex flex-col gap-2 border-t border-neutral-100 bg-neutral-50/60 px-6 py-4">
        <DetailRow label="Buyer's reason">
          {reasonLabel(returnRequest.reasonCode)}
          {returnRequest.reason ? ` — ${returnRequest.reason}` : ""}
        </DetailRow>
        {returnRequest.sellerComment && <DetailRow label="Your note">{returnRequest.sellerComment}</DetailRow>}
        {status === "CANCELLED" && (
          <DetailRow label="Cancelled">
            By the buyer{returnRequest.cancelReason ? ` — ${returnRequest.cancelReason}` : ""}
          </DetailRow>
        )}
        {returnRequest.trackingNumber && (
          <DetailRow label="Courier">
            {returnRequest.courierName ?? "-"} · Tracking {returnRequest.trackingNumber}
            {trackingOk && (
              <>
                {" · "}
                <a
                  href={returnRequest.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-800 hover:underline"
                >
                  Track
                </a>
              </>
            )}
          </DetailRow>
        )}
        {inspected(status) && returnRequest.inspectionNote && (
          <DetailRow label="Inspection">{returnRequest.inspectionNote}</DetailRow>
        )}
      </dl>

      {(status === "APPROVED" ||
        (status === "RECEIVED" && returnRequest.refundAmount != null) ||
        (status === "REFUNDED" && returnRequest.refundAmount != null) ||
        status === "CLOSED") && (
        <div
          className={`px-6 py-3 text-p4 font-body ${
            status === "REFUNDED"
              ? "bg-green-50 text-green-800"
              : status === "CLOSED"
                ? "bg-red-50 text-red-700"
                : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {status === "APPROVED" && "Waiting for the buyer to ship the parcel back."}
          {status === "RECEIVED" &&
            returnRequest.refundAmount != null &&
            (returnRequest.refundHeld
              ? `Refund of ₹${returnRequest.refundAmount.toFixed(2)} will be issued once the buyer's whole COD order is delivered.`
              : `Refund of ₹${returnRequest.refundAmount.toFixed(2)} issued, awaiting completion.`)}
          {status === "REFUNDED" &&
            returnRequest.refundAmount != null &&
            `Refunded ₹${returnRequest.refundAmount.toFixed(2)}`}
          {status === "CLOSED" && "No units accepted — nothing refunded."}
        </div>
      )}

      {(error || status === "REQUESTED" || status === "SHIPPED" || status === "OUT_FOR_DELIVERY") && (
        <div className="px-6 pb-5">
          {error && <p className="mt-3 text-p4 text-red-600">{error}</p>}

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
              onSubmit={(inspectedLines, note) =>
                run(() => receiveReturn(returnRequest.returnId, sellerId, inspectedLines, note))
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerReturnsPage() {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  // Return lines carry only a line total, so the price each unit was bought at comes from the seller's orders;
  // images and the current listed price come from the products.
  const { orders } = useSellerOrders();
  const orderItems = useMemo(() => {
    const map: Record<number, { unitPrice?: number; isQuote: boolean }> = {};
    (orders ?? []).forEach((order) =>
      order.items.forEach((item) => {
        if (item.orderItemId != null) map[item.orderItemId] = { unitPrice: item.unitPriceSnapshot, isQuote: order.quoteRequestId != null };
      })
    );
    return map;
  }, [orders]);
  const products = useProductSummaries(
    (returns ?? []).flatMap((r) => r.lines.map((l) => l.productId).filter((id): id is string => !!id))
  );

  // Every return is loaded once; the status tabs filter on screen so each tab can show its own count.
  const countFor = (status: string) =>
    status === "ALL" ? returns?.length ?? 0 : (returns ?? []).filter((r) => r.status === status).length;
  const visibleReturns = (returns ?? []).filter((r) => statusFilter === "ALL" || r.status === statusFilter);

  const loadReturns = useCallback(async (id: string) => {
    try {
      const data = await getSellerReturns(id);
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
    // Deep link from the dashboard tiles, e.g. ?status=PLACED opens that tab.
    const wanted = new URLSearchParams(window.location.search).get("status");
    if (wanted && STATUS_FILTERS.includes(wanted)) queueMicrotask(() => setStatusFilter(wanted));
  }, []);

  useEffect(() => {
    // Deferred to a microtask, same as useSellerOrders: the set-state-in-effect lint rule
    // flags loadReturns when called directly.
    if (sellerId) {
      queueMicrotask(() => loadReturns(sellerId));
    }
  }, [sellerId, loadReturns]);

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
              statusFilter === status ? "bg-primary-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {prettyStatus(status)}
            {returns !== null && <span className="ml-1.5 opacity-70">{countFor(status)}</span>}
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

      {returns !== null && visibleReturns.length === 0 && (
        <p className="text-p3 font-body text-neutral-500">No returns found.</p>
      )}

      {returns !== null && visibleReturns.length > 0 && sellerId && (
        <div className="space-y-5">
          {visibleReturns.map((returnRequest) => (
            <ReturnCard
              key={returnRequest.returnId}
              returnRequest={returnRequest}
              sellerId={sellerId}
              products={products}
              orderItems={orderItems}
              onChanged={() => loadReturns(sellerId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
