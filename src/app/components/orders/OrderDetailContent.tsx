"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Truck } from "lucide-react";
import Button from "@/src/app/commonComponents/Button";
import { useReasonPrompt } from "@/src/app/commonComponents/useReasonPrompt";
import {
  ProductThumb,
  StatusBadge,
  UnitPriceLines,
  useProductSummaries,
} from "@/src/app/commonComponents/cardUi";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { cancelOrder, cancelSellerOrder, getOrder } from "@/src/services/buyer/orderService";
import { getReturnsByBuyer } from "@/src/services/buyer/returnService";
import { Order, SellerOrder } from "@/src/types/buyer/order";
import { ReturnRequest, consumedUnits } from "@/src/types/buyer/returns";
import BuyerReturnCard, { OrderItemInfo } from "./BuyerReturnCard";
import ReturnRequestForm from "./ReturnRequestForm";
import { proRate } from "@/src/utils/pricing";
import { formatMoney } from "@/src/utils/dashboardFormat";

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

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

function SummaryRow({ label, value, strong }: { label: string; value?: number | null; strong?: boolean }) {
  if (value == null) return null;
  return (
    <div className={`flex justify-between gap-6 ${strong ? "mt-1 border-t border-neutral-200 pt-3" : ""}`}>
      <span className={strong ? "text-p2 font-semibold text-neutral-900" : "text-p4 text-neutral-500"}>{label}</span>
      <span className={strong ? "text-h6 font-heading font-semibold text-neutral-900" : "text-p4 text-neutral-700"}>
        {formatMoney(value)}
      </span>
    </div>
  );
}

function SellerOrderCard({
  sellerOrder,
  onCancel,
  cancelling,
  returns,
  buyerId,
  onReturnsChanged,
  isQuote,
}: {
  sellerOrder: SellerOrder;
  onCancel: (sellerOrderId: string) => void;
  cancelling: boolean;
  // This seller order's returns, oldest first.
  returns: ReturnRequest[];
  buyerId: string;
  onReturnsChanged: () => void;
  /** The order was placed at an accepted quote's price, not the listed price. */
  isQuote: boolean;
}) {
  const isCancelled = sellerOrder.status === "CANCELLED";
  // Product images and the current listed price, for the item rows and the returns.
  const productSummaries = useProductSummaries(
    sellerOrder.items.map((i) => i.productId).filter((id): id is string => !!id)
  );
  // What each item was bought at, so returned products show the price they were bought at too.
  const orderItems: Record<number, OrderItemInfo> = {};
  sellerOrder.items.forEach((item) => {
    if (item.orderItemId != null) orderItems[item.orderItemId] = { unitPrice: item.unitPriceSnapshot, isQuote };
  });
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
  // Open by default: the products are the point of this page, so they are never hidden behind a click.
  const [expanded, setExpanded] = useState(true);
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
  const trackingOk = !!sellerOrder.trackingUrl && /^https?:\/\//i.test(sellerOrder.trackingUrl);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-6 py-4 text-left"
      >
        <span className="flex flex-wrap items-center gap-3">
          <ChevronDown
            size={18}
            className={`shrink-0 text-neutral-500 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
          />
          <span className="text-p2 font-heading font-semibold text-pneutral-900">{sellerOrder.sellerOrderId}</span>
          <StatusBadge status={sellerOrder.status} />
        </span>
        <span className="text-p2 font-heading font-semibold text-pneutral-900">
          {sellerOrder.grandTotal != null ? formatMoney(sellerOrder.grandTotal) : ""}
        </span>
      </button>

      {expanded && (
        <div className="space-y-5 px-6 py-5">
          {!isCancelled ? (
            <div className="flex items-start">
              {FULFILLMENT_STEPS.map((step, index) => {
                const isDone = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step} className="flex flex-1 items-start last:flex-none">
                    <div className="-mt-0.5 flex w-16 shrink-0 flex-col items-center">
                      <div
                        className={`shrink-0 rounded-full transition-all ${isDone ? "bg-primary-800" : "bg-neutral-200"} ${
                          isCurrent ? "h-4 w-4 ring-4 ring-primary-100" : "h-3 w-3"
                        }`}
                      />
                      <p
                        className={`mt-2 text-center text-xs leading-tight ${
                          isCurrent
                            ? "font-semibold text-primary-800"
                            : isDone
                              ? "font-medium text-neutral-700"
                              : "text-neutral-400"
                        }`}
                      >
                        {formatStepLabel(step)}
                      </p>
                    </div>
                    {index < FULFILLMENT_STEPS.length - 1 && (
                      <div className={`mt-1.5 h-0.5 flex-1 ${index < currentStepIndex ? "bg-primary-800" : "bg-neutral-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-p3 font-body text-red-700">
                Cancelled{sellerOrder.cancelReason ? `: ${sellerOrder.cancelReason}` : ""}
              </p>
            </div>
          )}

          {sellerOrder.status === "OUT_FOR_DELIVERY" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-p3 font-body text-blue-700">
                A verification code was sent to your registered phone number. Please share it with the delivery person
                to confirm receipt.
              </p>
            </div>
          )}

          {sellerOrder.trackingNumber && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="flex items-center gap-2 text-p4 font-body text-neutral-700">
                <Truck size={16} className="text-neutral-500" />
                Courier: <span className="font-semibold">{sellerOrder.courierName ?? "-"}</span> · Tracking:{" "}
                <span className="font-semibold">{sellerOrder.trackingNumber}</span>
              </p>
              {/* Seller-entered, so only link real http(s) URLs. */}
              {trackingOk && (
                <a
                  href={sellerOrder.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-primary-800 px-3 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-50"
                >
                  Track shipment
                </a>
              )}
            </div>
          )}

          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {sellerOrder.items.map((item) => {
              const orderItemId = item.orderItemId;
              const remaining = orderItemId != null ? remainingUnits(orderItemId, item.quantity) : 0;
              const returnedSome = remaining < item.quantity;
              const selectable = canRequestReturn && remaining > 0 && orderItemId != null;
              const selected = orderItemId != null && returnQuantities.has(orderItemId);
              const listed = item.productId ? productSummaries[item.productId]?.listedPrice : undefined;
              return (
                <li key={item.orderItemId} className={`flex items-start gap-4 p-4 ${selected ? "bg-primary-50/40" : ""}`}>
                  {selectable && (
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.productNameSnapshot ?? "item"} to return`}
                      checked={selected}
                      disabled={showReturnForm}
                      onChange={() => toggleReturnSelection(orderItemId!, remaining)}
                      className="mt-6 h-4 w-4 shrink-0 accent-primary-800"
                    />
                  )}
                  <ProductThumb
                    src={item.productId ? productSummaries[item.productId]?.image : undefined}
                    alt={item.productNameSnapshot ?? "Product"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-p3 font-body font-semibold text-neutral-900">{item.productNameSnapshot ?? "Item"}</p>
                    {item.productId && item.productId !== item.productNameSnapshot && (
                      <p className="text-xs text-neutral-500">{item.productId}</p>
                    )}
                    <p className="mt-1 text-p4 font-body text-neutral-600">
                      Qty {item.quantity}
                      {item.batchLotNumberSnapshot ? ` · Batch ${item.batchLotNumberSnapshot}` : ""}
                      {returnedSome && <span className="text-neutral-500"> · {remaining} returnable</span>}
                    </p>
                    <UnitPriceLines unitPrice={item.unitPriceSnapshot} listedPrice={listed} isQuote={isQuote} />
                    {selected && remaining > 1 && (
                      <label className="mt-2 flex items-center gap-2 text-p4 text-neutral-600">
                        Return
                        <input
                          type="number"
                          min={1}
                          max={remaining}
                          step={1}
                          value={returnQuantities.get(orderItemId!) || ""}
                          disabled={showReturnForm}
                          onChange={(e) => setReturnQuantity(orderItemId!, Number(e.target.value))}
                          className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                        />
                        of {remaining}
                      </label>
                    )}
                  </div>
                  <div className="text-right">
                    {selected && item.lineTotal != null && allQuantitiesValid ? (
                      // Same pro-rating the order-service uses for the refund.
                      <>
                        <p className="text-p3 font-body font-semibold text-primary-800">
                          Refund {formatMoney(proRate(item.lineTotal, returnQuantities.get(orderItemId!)!, item.quantity))}
                        </p>
                        <p className="text-xs text-neutral-500">of {formatMoney(item.lineTotal)}</p>
                      </>
                    ) : (
                      item.lineTotal != null && (
                        <p className="text-p3 font-body font-semibold text-neutral-900">{formatMoney(item.lineTotal)}</p>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {returns.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-p3 font-heading font-semibold text-pneutral-900">
                Returns on this order ({returns.length})
              </h3>
              {returns.map((r) => (
                <BuyerReturnCard
                  key={r.returnId}
                  returnRequest={r}
                  buyerId={buyerId}
                  products={productSummaries}
                  orderItems={orderItems}
                  onChanged={onReturnsChanged}
                  hideOrderLink
                />
              ))}
            </div>
          )}

          {anyReturnable && !showReturnForm && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3">
              <button
                type="button"
                disabled={selectedReturns.length === 0 || !allQuantitiesValid}
                onClick={() => setShowReturnForm(true)}
                className="rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {`Return selected${selectedReturns.length > 0 ? ` (${selectedReturns.length})` : ""}`}
              </button>
              {!allQuantitiesValid && (
                <p className="text-p4 font-body text-red-600">
                  Enter a whole number between 1 and the units you can still return.
                </p>
              )}
              <p className="text-p4 font-body text-neutral-500">
                Tick the products to return. Returns are accepted within {RETURN_WINDOW_DAYS} days of delivery, and
                you&apos;re refunded once the seller receives and checks the goods.
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
        </div>
      )}
    </section>
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-p3 font-body text-red-700">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" />
      </div>
    );
  }

  const anyCancellable = order.sellerOrders.some((so) => CANCELLABLE_STATUSES.has(so.status));
  const isQuote = order.quoteRequestId != null;
  const itemCount = order.sellerOrders.reduce((n, so) => n + so.items.length, 0);
  const placed = formatDateTime(order.placedAt ?? order.createdAt);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h4 font-heading font-medium text-pneutral-900">{order.orderId}</h1>
            {isQuote && (
              <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-800">
                Quotation price
              </span>
            )}
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-p4 font-body text-neutral-500">
            {placed ? `Placed on ${placed}` : "Placed"}
            {` · ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            {order.sellerOrders.length > 1 ? ` · ${order.sellerOrders.length} sellers` : ""}
          </p>
          {isQuote && (
            <Link
              href={`/buyer_e8d45a1b/dashboard/rfq#quote-${order.quoteRequestId}`}
              className="text-p4 font-body text-primary-800 hover:underline"
            >
              Placed at your accepted quote price — view quote #{order.quoteRequestId}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {order.sellerOrders.map((sellerOrder) => (
            <SellerOrderCard
              key={sellerOrder.sellerOrderId}
              sellerOrder={sellerOrder}
              cancelling={cancellingId === sellerOrder.sellerOrderId}
              returns={returns.filter((r) => r.sellerOrderId === sellerOrder.sellerOrderId)}
              buyerId={order.buyerId ?? ""}
              isQuote={isQuote}
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

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-h6 font-heading font-semibold text-pneutral-900">Order summary</h2>
            <div className="flex flex-col gap-1.5">
              <SummaryRow label="Subtotal" value={order.subtotal} />
              <SummaryRow label="Shipping" value={order.shippingTotal ?? 0} />
              <SummaryRow label="Tax" value={order.taxTotal} />
              <SummaryRow label="Grand total" value={order.grandTotal} strong />
            </div>
            {order.paymentStatus && (
              <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-p4 font-body text-neutral-600">
                Payment: <span className="font-semibold text-neutral-800">{order.paymentStatus}</span>
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-h6 font-heading font-semibold text-pneutral-900">
              <MapPin size={18} className="text-neutral-500" />
              Delivery address
            </h2>
            <p className="text-p3 font-body font-semibold text-neutral-800">{order.deliveryName}</p>
            <p className="text-p4 font-body text-neutral-600">{order.deliveryPhone}</p>
            <p className="mt-1 text-p4 font-body text-neutral-600">
              {order.deliveryAddressLine}, {order.deliveryCity}, {order.deliveryDistrict}, {order.deliveryState} -{" "}
              {order.deliveryPinCode}
            </p>
          </section>
        </aside>
      </div>

      {reasonModal}
    </>
  );
}
