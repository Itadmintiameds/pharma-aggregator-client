"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Button from "@/src/app/commonComponents/Button";
import { useReasonPrompt } from "@/src/app/commonComponents/useReasonPrompt";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { cancelOrder, cancelSellerOrder, getOrder } from "@/src/services/buyer/orderService";
import { getReturnsByBuyer } from "@/src/services/buyer/returnService";
import { Order, SellerOrder } from "@/src/types/buyer/order";
import { ReturnRequest, consumedUnits } from "@/src/types/buyer/returns";
import ReturnPanel from "./ReturnPanel";
import ReturnRequestForm from "./ReturnRequestForm";
import { proRate } from "@/src/utils/pricing";

// Same as order-service's RETURN_WINDOW_DAYS; only used to hide the return controls once it has passed.
const RETURN_WINDOW_DAYS = 7;

// Shared order-detail body used by both the standalone marketing-site route
// (src/app/orders/[orderId], wrapped in LandingHeader/Footer) and the
// dashboard-scoped route (buyer_e8d45a1b/dashboard/orders/[orderId], wrapped
// in the dashboard sidebar/header) — same fetch + cancel logic, each caller
// supplies its own chrome and login-redirect target.
const CANCELLABLE_STATUSES = new Set(["PLACED", "CONFIRMED", "PACKED"]);

const FULFILLMENT_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

// Return-phase seller-order statuses all come after a completed delivery.
const POST_DELIVERY_STATUSES = new Set([
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_REJECTED",
  "RETURNED",
  "REFUNDED",
]);

function formatStepLabel(step: string): string {
  return step
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function SellerOrderCard({
  sellerOrder,
  onCancel,
  cancelling,
  returns,
  buyerId,
  onReturnsChanged,
}: {
  sellerOrder: SellerOrder;
  onCancel: (sellerOrderId: string) => void;
  cancelling: boolean;
  // This seller order's returns, oldest first.
  returns: ReturnRequest[];
  buyerId: string;
  onReturnsChanged: () => void;
}) {
  const isCancelled = sellerOrder.status === "CANCELLED";
  const currentStepIndex = POST_DELIVERY_STATUSES.has(sellerOrder.status)
    ? FULFILLMENT_STEPS.indexOf("DELIVERED")
    : FULFILLMENT_STEPS.indexOf(sellerOrder.status);
  // Returns can be started (again) any time within the window after delivery; the backend enforces it too.
  // Time is read once on mount — render must stay pure.
  const [now] = useState(() => Date.now());
  const windowOpen =
    !sellerOrder.deliveredAt ||
    now < new Date(sellerOrder.deliveredAt).getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const canRequestReturn =
    (sellerOrder.status === "DELIVERED" || POST_DELIVERY_STATUSES.has(sellerOrder.status)) && windowOpen;
  const canCancel = CANCELLABLE_STATUSES.has(sellerOrder.status);
  const [expanded, setExpanded] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  // Units of an item still returnable: its quantity minus what earlier (not rejected or cancelled) returns hold.
  const remainingUnits = (orderItemId: number, quantity: number) =>
    quantity -
    returns.reduce(
      (sum, r) =>
        sum + r.lines.filter((l) => l.orderItemId === orderItemId).reduce((s, l) => s + consumedUnits(r, l), 0),
      0
    );
  // orderItemId -> units to return; ticking an item starts at all its remaining units.
  const [returnQuantities, setReturnQuantities] = useState<Map<number, number>>(new Map());
  const toggleReturnSelection = (orderItemId: number, units: number) =>
    setReturnQuantities((prev) => {
      const next = new Map(prev);
      if (next.has(orderItemId)) next.delete(orderItemId);
      else next.set(orderItemId, units);
      return next;
    });
  const setReturnQuantity = (orderItemId: number, quantity: number) =>
    setReturnQuantities((prev) => new Map(prev).set(orderItemId, quantity));
  const selectedReturns = [...returnQuantities].map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
  const maxUnits = (orderItemId: number) => {
    const item = sellerOrder.items.find((i) => i.orderItemId === orderItemId);
    return item ? remainingUnits(orderItemId, item.quantity) : 0;
  };
  const allQuantitiesValid = selectedReturns.every(
    (r) => Number.isInteger(r.quantity) && r.quantity >= 1 && r.quantity <= maxUnits(r.orderItemId)
  );
  const anyReturnable =
    canRequestReturn &&
    sellerOrder.items.some((i) => i.orderItemId != null && remainingUnits(i.orderItemId, i.quantity) > 0);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between mb-4 text-left"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            size={18}
            className={`text-pneutral-500 shrink-0 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
          />
          <span className="text-p2 font-heading font-semibold text-pneutral-900">
            {sellerOrder.sellerOrderId}
          </span>
        </span>
        <span className="text-p2 font-heading font-semibold text-pneutral-900">
          ₹{sellerOrder.grandTotal?.toFixed(2)}
        </span>
      </button>

      {expanded && (
        <>
          {!isCancelled ? (
            <div className="flex items-start mb-8">
              {FULFILLMENT_STEPS.map((step, index) => {
                const isDone = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step} className="flex items-start flex-1 last:flex-none">
                    <div className="flex flex-col items-center w-16 shrink-0 -mt-0.5">
                      <div
                        className={`rounded-full shrink-0 transition-all ${
                          isDone ? "bg-primary-800" : "bg-neutral-200"
                        } ${isCurrent ? "w-4 h-4 ring-4 ring-primary-100" : "w-3 h-3"}`}
                      />
                      <p
                        className={`text-p4 font-body text-center mt-2 leading-tight ${
                          isCurrent
                            ? "text-primary-800 font-semibold"
                            : isDone
                              ? "text-pneutral-700 font-medium"
                              : "text-pneutral-400"
                        }`}
                      >
                        {formatStepLabel(step)}
                      </p>
                    </div>
                    {index < FULFILLMENT_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mt-1.5 ${index < currentStepIndex ? "bg-primary-800" : "bg-neutral-200"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-p3 font-body text-red-700">
                Cancelled{sellerOrder.cancelReason ? `: ${sellerOrder.cancelReason}` : ""}
              </p>
            </div>
          )}

          {sellerOrder.status === "OUT_FOR_DELIVERY" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-p3 font-body text-blue-700">
                A verification code was sent to your registered phone number. Please share it with
                the delivery person to confirm receipt.
              </p>
            </div>
          )}

          {sellerOrder.trackingNumber && (
            <p className="text-p3 font-body text-pneutral-600 mb-2">
              Courier: {sellerOrder.courierName ?? "-"} · Tracking: {sellerOrder.trackingNumber}
              {/* Seller-entered, so only link real http(s) URLs. */}
              {sellerOrder.trackingUrl && /^https?:\/\//i.test(sellerOrder.trackingUrl) && (
                <>
                  {" · "}
                  <a
                    href={sellerOrder.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-700 font-semibold underline"
                  >
                    Track shipment
                  </a>
                </>
              )}
            </p>
          )}

          <div className="space-y-2 mb-4">
            {sellerOrder.items.map((item) => {
              const remaining = item.orderItemId != null ? remainingUnits(item.orderItemId, item.quantity) : 0;
              const returnedSome = remaining < item.quantity;
              return (
                <div key={item.orderItemId}>
                  <div className="flex justify-between items-center text-p3 font-body text-pneutral-700">
                    {canRequestReturn && remaining > 0 && item.orderItemId != null ? (
                      <span className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={returnQuantities.has(item.orderItemId)}
                            disabled={showReturnForm}
                            onChange={() => toggleReturnSelection(item.orderItemId!, remaining)}
                            className="w-4 h-4 accent-primary-800"
                          />
                          <span>
                            {item.productNameSnapshot} x {item.quantity}
                            {returnedSome && (
                              <span className="text-p4 text-pneutral-500"> ({remaining} returnable)</span>
                            )}
                          </span>
                        </label>
                        {returnQuantities.has(item.orderItemId) && remaining > 1 && (
                          <label className="flex items-center gap-2 text-p4 text-pneutral-600">
                            Return
                            <input
                              type="number"
                              min={1}
                              max={remaining}
                              step={1}
                              value={returnQuantities.get(item.orderItemId) || ""}
                              disabled={showReturnForm}
                              onChange={(e) => setReturnQuantity(item.orderItemId!, Number(e.target.value))}
                              className="w-16 px-2 py-1 border border-neutral-300 rounded-lg text-sm"
                            />
                            of {remaining}
                          </label>
                        )}
                      </span>
                    ) : (
                      <span>{item.productNameSnapshot} x {item.quantity}</span>
                    )}
                    {item.orderItemId != null &&
                    returnQuantities.has(item.orderItemId) &&
                    item.lineTotal != null &&
                    allQuantitiesValid ? (
                      // Same pro-rating the order-service uses for the refund.
                      <span className="text-right">
                        <span className="block font-semibold text-primary-800">
                          Refund ₹
                          {proRate(item.lineTotal, returnQuantities.get(item.orderItemId)!, item.quantity).toFixed(2)}
                        </span>
                        <span className="block text-p4 text-pneutral-500">of ₹{item.lineTotal.toFixed(2)}</span>
                      </span>
                    ) : (
                      <span>₹{item.lineTotal?.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {returns.length > 0 && (
            <div className="mb-4">
              <p className="text-p3 font-heading font-semibold text-pneutral-900">Returns</p>
              {returns.map((r) => (
                <ReturnPanel key={r.returnId} returnRequest={r} buyerId={buyerId} onChanged={onReturnsChanged} />
              ))}
            </div>
          )}

          {anyReturnable && !showReturnForm && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                type="button"
                disabled={selectedReturns.length === 0 || !allQuantitiesValid}
                onClick={() => setShowReturnForm(true)}
                className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                {`Return selected${selectedReturns.length > 0 ? ` (${selectedReturns.length})` : ""}`}
              </button>
              {!allQuantitiesValid && (
                <p className="text-p4 font-body text-red-600">
                  Enter a whole number between 1 and the units you can still return.
                </p>
              )}
              <p className="text-p4 font-body text-pneutral-500">
                Returns are accepted within {RETURN_WINDOW_DAYS} days of delivery. You&apos;re refunded once the
                seller receives and checks the goods.
              </p>
            </div>
          )}

          {showReturnForm && (
            <ReturnRequestForm
              items={selectedReturns}
              buyerId={buyerId}
              onCancel={() => setShowReturnForm(false)}
              onDone={() => {
                setShowReturnForm(false);
                setReturnQuantities(new Map());
                onReturnsChanged();
              }}
            />
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              label={cancelling ? "Cancelling..." : "Cancel this item"}
              disabled={cancelling}
              onClick={() => onCancel(sellerOrder.sellerOrderId)}
            />
          )}
        </>
      )}
    </div>
  );
}

interface OrderDetailContentProps {
  orderId: string;
  loginRedirectPath: string;
}

export default function OrderDetailContent({ orderId, loginRedirectPath }: OrderDetailContentProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const { promptReason, modal: reasonModal } = useReasonPrompt();

  const loadReturns = async (buyerId?: string) => {
    if (!buyerId) return;
    try {
      const all = await getReturnsByBuyer(buyerId);
      // An order can have several returns; oldest first.
      setReturns(all.filter((r) => r.orderId === orderId).sort((a, b) => a.returnId - b.returnId));
    } catch {
      // Returns are supplementary — the order itself still renders if this fails.
    }
  };

  const loadOrder = async () => {
    try {
      const data = await getOrder(orderId);
      setOrder(data);
      await loadReturns(data.buyerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order.");
    }
  };

  useEffect(() => {
    if (!buyerAuthService.isAuthenticated()) {
      router.replace(`/buyer_e8d45a1b/login?redirect=${encodeURIComponent(loginRedirectPath)}`);
      return;
    }
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, router]);

  const handleCancelWholeOrder = async () => {
    const currentUser = buyerAuthService.getCurrentUser();
    if (!order || !currentUser) return;

    const reason = (await promptReason("Reason for cancellation")) ?? "";
    setCancellingId(order.orderId);
    try {
      // actorId for a buyer cancel must be the Buyer business ID, which the
      // order response already carries as buyerId — no extra lookup needed here.
      const updated = await cancelOrder(order.orderId, order.buyerId ?? "", reason);
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-p3 font-body text-red-700">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
      </div>
    );
  }

  const anyCancellable = order.sellerOrders.some((so) => CANCELLABLE_STATUSES.has(so.status));

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h4 font-heading font-medium text-pneutral-900 flex items-center gap-2">
            {order.orderId}
            {order.quoteRequestId != null && (
              <span className="px-2.5 py-1 rounded-full text-label-l2 font-heading font-medium bg-secondary-100 text-secondary-800">
                From Quote
              </span>
            )}
          </h1>
          <p className="text-p4 font-body text-pneutral-500">
            {order.placedAt
              ? new Date(order.placedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : ""}
          </p>
          {order.quoteRequestId != null && (
            <Link
              href="/buyer_e8d45a1b/dashboard/rfq"
              className="text-p4 font-body text-primary-800 hover:underline"
            >
              Placed at your accepted quote price — view in RFQ & Quotes
            </Link>
          )}
        </div>
        {anyCancellable && (
          <Button
            variant="outline"
            size="md"
            label={cancellingId === order.orderId ? "Cancelling..." : "Cancel Order"}
            disabled={cancellingId === order.orderId}
            onClick={handleCancelWholeOrder}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h2 className="text-h6 font-heading font-semibold text-pneutral-900 mb-3">
          Delivery Address
        </h2>
        <p className="text-p3 font-body text-pneutral-700">{order.deliveryName}</p>
        <p className="text-p3 font-body text-pneutral-700">{order.deliveryPhone}</p>
        <p className="text-p3 font-body text-pneutral-700">
          {order.deliveryAddressLine}, {order.deliveryCity}, {order.deliveryDistrict},{" "}
          {order.deliveryState} - {order.deliveryPinCode}
        </p>
      </div>

      <div className="space-y-6">
        {order.sellerOrders.map((sellerOrder) => (
          <SellerOrderCard
            key={sellerOrder.sellerOrderId}
            sellerOrder={sellerOrder}
            cancelling={cancellingId === sellerOrder.sellerOrderId}
            returns={returns.filter((r) => r.sellerOrderId === sellerOrder.sellerOrderId)}
            buyerId={order.buyerId ?? ""}
            onReturnsChanged={loadOrder}
            onCancel={async (sellerOrderId) => {
              const reason = (await promptReason("Reason for cancellation")) ?? "";
              setCancellingId(sellerOrderId);
              try {
                await cancelSellerOrder(sellerOrderId, order.buyerId ?? "", reason);
                await loadOrder();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to cancel item.");
              } finally {
                setCancellingId(null);
              }
            }}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mt-6 flex justify-between">
        <p className="text-p2 font-body text-pneutral-600">Grand Total</p>
        <p className="text-h5 font-heading font-semibold text-pneutral-900">
          ₹{order.grandTotal?.toFixed(2)}
        </p>
      </div>

      {reasonModal}
    </>
  );
}
