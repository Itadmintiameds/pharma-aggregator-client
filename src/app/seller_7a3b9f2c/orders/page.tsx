"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { sellerAuthService } from "@/src/services/seller/authService";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { useReasonPrompt } from "@/src/app/commonComponents/useReasonPrompt";
import {
  cancelSellerOrderAsSeller,
  confirmSellerOrder,
  getSellerOrders,
  markDelivered,
  markOutForDelivery,
  packSellerOrder,
  resendDeliveryOtp,
  shipSellerOrder,
} from "@/src/services/seller/sellerOrderService";
import { SellerOrder } from "@/src/types/buyer/order";
import { StatusBadge, ProductThumb, prettyStatus, useProductSummaries, type ProductSummary } from "../components/sellerCardUi";

const STATUS_FILTERS = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_REJECTED",
  "RETURNED",
];

// Return actions (accept/reject, receive) live on the Returns page — these statuses just point there.
const RETURN_NOTICES: Record<string, string> = {
  RETURN_REQUESTED: "The buyer has requested a return. Accept or reject it on the Returns page.",
  RETURN_APPROVED: "Return accepted. Confirm receipt and record damaged units on the Returns page when it arrives.",
};

// An order sitting in PLACED longer than this is flagged as needing
// attention — sellers have no other signal today that an order is going
// stale (no SLA tracking exists anywhere else in this codebase).
const PLACED_SLA_HOURS = 24;

function hoursSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

function ShipForm({ onSubmit, busy }: { onSubmit: (courierName: string, trackingNumber: string, trackingUrl: string) => void; busy: boolean }) {
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  return (
    <div className="mt-3 grid gap-2 rounded-lg bg-neutral-50 p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
      <input
        placeholder="Courier name"
        value={courierName}
        onChange={(e) => setCourierName(e.target.value)}
        className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-[13px] focus:border-primary-800 focus:outline-none"
      />
      <input
        placeholder="Tracking number"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-[13px] focus:border-primary-800 focus:outline-none"
      />
      <input
        placeholder="Tracking URL (optional)"
        value={trackingUrl}
        onChange={(e) => setTrackingUrl(e.target.value)}
        className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-[13px] focus:border-primary-800 focus:outline-none"
      />
      <button
        disabled={busy || !courierName || !trackingNumber}
        onClick={() => onSubmit(courierName, trackingNumber, trackingUrl)}
        className="h-8 rounded-lg border-[1.5px] border-primary-900 bg-transparent px-4 text-xs font-semibold text-primary-900 hover:bg-primary-50 disabled:opacity-40"
      >
        {busy ? "Shipping..." : "Mark Shipped"}
      </button>
    </div>
  );
}

function DeliverForm({
  onSubmit,
  onResendOtp,
  busy,
  resending,
}: {
  onSubmit: (otp: string) => void;
  onResendOtp: () => void;
  busy: boolean;
  resending: boolean;
}) {
  const [otp, setOtp] = useState("");
  return (
    <div className="flex gap-2 mt-3">
      <input
        placeholder="Delivery OTP from buyer"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="h-9 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-[13px] focus:border-primary-800 focus:outline-none"
      />
      <button
        disabled={busy || resending}
        onClick={onResendOtp}
        className="h-9 rounded-lg border border-neutral-300 px-3 text-[13px] font-semibold text-neutral-700 disabled:opacity-40"
        title="Buyer didn't receive the OTP? Resend it."
      >
        {resending ? "Resending..." : "Resend OTP"}
      </button>
      <button
        disabled={busy || !otp}
        onClick={() => onSubmit(otp)}
        className="h-8 rounded-lg border-[1.5px] border-primary-900 bg-transparent px-3 text-xs font-semibold text-primary-900 hover:bg-primary-50 disabled:opacity-40"
      >
        {busy ? "Confirming..." : "Confirm Delivery"}
      </button>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value?: number; strong?: boolean }) {
  if (value == null) return null;
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 whitespace-nowrap ${
        strong ? "rounded-md border border-primary-200 px-2.5 py-1" : ""
      }`}
    >
      <span className={strong ? "text-xs font-semibold text-primary-900" : "text-xs text-neutral-500"}>{label}</span>
      <span className={strong ? "text-sm font-bold text-primary-900" : "text-xs font-semibold text-neutral-700"}>
        ₹{value.toFixed(2)}
      </span>
    </span>
  );
}

function OrderCard({
  order,
  sellerId,
  products,
  onChanged,
}: {
  order: SellerOrder;
  sellerId: string;
  products: Record<string, ProductSummary>;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const { promptReason, modal: reasonModal } = useReasonPrompt();

  const runWithReason = async (
    title: string,
    action: (reason: string) => Promise<unknown>
  ) => {
    const reason = await promptReason(title);
    if (reason === null) return; // dismissed
    run(() => action(reason));
  };

  const placedHistory = order.statusHistory.find((h) => h.toStatus === "PLACED");
  const placedAt = placedHistory?.changedAt ?? order.createdAt;
  const ageHours = order.status === "PLACED" ? hoursSince(placedAt) : null;
  const isStale = ageHours !== null && ageHours > PLACED_SLA_HOURS;
  const isQuote = order.quoteRequestId != null;
  const trackingOk = !!order.trackingUrl && /^https?:\/\//i.test(order.trackingUrl);
  const hasActions = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(order.status);

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

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-neutral-100 bg-neutral-50/60 px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="text-[13px] font-heading font-bold text-pneutral-900">{order.sellerOrderId}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isQuote ? "bg-secondary-100 text-secondary-800" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {isQuote ? "Quotation price" : "Original price"}
          </span>
          {placedAt && (
            <span className="text-xs text-neutral-500">
              Placed{" "}
              {new Date(placedAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {isStale && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-1.5">
          <p className="text-xs text-red-700">
            Placed {Math.floor(ageHours!)}h ago — still not confirmed. Please action soon.
          </p>
        </div>
      )}

      <ul className="divide-y divide-neutral-100 px-4">
        {order.items.map((item) => {
          // Quotation orders are priced at the accepted quote, so show what the product normally sells for.
          const listed = item.productId ? products[item.productId]?.listedPrice : undefined;
          const vsListed =
            isQuote && listed && item.unitPriceSnapshot != null
              ? Math.round(((item.unitPriceSnapshot - listed) / listed) * 100)
              : null;
          return (
          <li key={item.orderItemId} className="flex items-center gap-3 py-2.5">
            <ProductThumb
              size="sm"
              src={item.productId ? products[item.productId]?.image : undefined}
              alt={item.productNameSnapshot ?? "Product"}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-900">
                {item.productNameSnapshot ?? "Item"}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">
                {item.productId && item.productId !== item.productNameSnapshot && (
                  <span className="mr-2 text-neutral-400">{item.productId}</span>
                )}
                {item.unitPriceSnapshot != null
                  ? `₹${item.unitPriceSnapshot.toFixed(2)} × ${item.quantity}`
                  : `Qty ${item.quantity}`}
                {item.batchLotNumberSnapshot ? ` · Batch ${item.batchLotNumberSnapshot}` : ""}
              </p>
              {isQuote && listed != null && (
                <p className="text-[11px] text-neutral-500">
                  Original listed price <span className="line-through">₹{listed.toFixed(2)}</span>
                  {vsListed !== null && vsListed !== 0 && (
                    <span className={vsListed < 0 ? "text-green-700" : "text-amber-700"}>
                      {" "}
                      · quoted {Math.abs(vsListed)}% {vsListed < 0 ? "below" : "above"} listed
                    </span>
                  )}
                </p>
              )}
            </div>
            {item.lineTotal != null && (
              <p className="text-[13px] font-bold text-neutral-900">₹{item.lineTotal.toFixed(2)}</p>
            )}
          </li>
          );
        })}
      </ul>

      {(order.trackingNumber || order.status === "CANCELLED" || isQuote) && (
        <div className="flex flex-col gap-0.5 border-t border-neutral-100 px-4 py-2 text-xs text-neutral-600">
          {order.trackingNumber && (
            <p>
              <span className="text-neutral-500">Courier:</span> {order.courierName ?? "-"} · Tracking{" "}
              {order.trackingNumber}
              {trackingOk && (
                <>
                  {" · "}
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-800 hover:underline"
                  >
                    Track
                  </a>
                </>
              )}
            </p>
          )}
          {order.status === "CANCELLED" && (
            <p>
              <span className="text-neutral-500">Cancelled:</span>{" "}
              {order.cancelledByRole ? `by ${order.cancelledByRole.toLowerCase()}` : ""}
              {order.cancelReason ? ` — ${order.cancelReason}` : ""}
            </p>
          )}
          {isQuote && (
            <p className="text-secondary-700">
              Priced at the quote you accepted for this buyer, not your current listed price.
            </p>
          )}
        </div>
      )}

      {RETURN_NOTICES[order.status] && (
        <div className="flex items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-4 py-2">
          <p className="text-xs text-amber-800">{RETURN_NOTICES[order.status]}</p>
          <Link
            href="/seller_7a3b9f2c/returns"
            className="shrink-0 rounded-lg border-[1.5px] border-primary-900 px-3 py-1.5 text-xs font-semibold text-primary-900 hover:bg-primary-50"
          >
            Go to Returns
          </Link>
        </div>
      )}

      <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-2.5">
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="flex flex-wrap gap-2">
            {order.status === "PLACED" && (
              <>
                <button
                  disabled={busy}
                  onClick={() => run(() => confirmSellerOrder(order.sellerOrderId, sellerId))}
                  className="border-[1.5px] border-primary-900 text-primary-900 hover:bg-primary-50 rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-40"
                >
                  Confirm
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    runWithReason("Reason for rejecting this order", (reason) =>
                      cancelSellerOrderAsSeller(order.sellerOrderId, sellerId, reason)
                    )
                  }
                  className="border-[1.5px] border-red-500 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-40"
                >
                  Reject
                </button>
              </>
            )}

            {order.status === "CONFIRMED" && (
              <button
                disabled={busy}
                onClick={() => run(() => packSellerOrder(order.sellerOrderId, sellerId))}
                className="border-[1.5px] border-primary-900 text-primary-900 hover:bg-primary-50 rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-40"
              >
                Mark Packed
              </button>
            )}

            {order.status === "SHIPPED" && (
              <button
                disabled={busy}
                onClick={() => run(() => markOutForDelivery(order.sellerOrderId, sellerId))}
                className="border-[1.5px] border-primary-900 text-primary-900 hover:bg-primary-50 rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-40"
              >
                Mark Out for Delivery
              </button>
            )}

            {["CONFIRMED", "PACKED", "OUT_FOR_DELIVERY"].includes(order.status) && (
              <button
                disabled={busy}
                onClick={() =>
                  runWithReason("Reason for cancelling", (reason) =>
                    cancelSellerOrderAsSeller(order.sellerOrderId, sellerId, reason)
                  )
                }
                className="border-[1.5px] border-red-500 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-40"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
            {order.subtotal != null && order.grandTotal != null && order.subtotal !== order.grandTotal && (
              <>
                <SummaryRow label="Subtotal" value={order.subtotal} />
                {!!order.shippingFee && <SummaryRow label="Shipping" value={order.shippingFee} />}
                {!!order.taxAmount && <SummaryRow label="Tax" value={order.taxAmount} />}
              </>
            )}
            <SummaryRow label="Total" value={order.grandTotal} strong />
          </div>
        </div>

          {order.status === "PACKED" && (
            <ShipForm
              busy={busy}
              onSubmit={(courierName, trackingNumber, trackingUrl) =>
                run(() => shipSellerOrder(order.sellerOrderId, sellerId, courierName, trackingNumber, trackingUrl))
              }
            />
          )}

          {order.status === "OUT_FOR_DELIVERY" && (
            <>
              {resendMessage && <p className="text-xs text-green-600 mt-2">{resendMessage}</p>}
              <DeliverForm
                busy={busy}
                resending={resending}
                onSubmit={(otp) => run(() => markDelivered(order.sellerOrderId, sellerId, otp))}
                onResendOtp={async () => {
                  setResending(true);
                  setResendMessage(null);
                  setError(null);
                  try {
                    await resendDeliveryOtp(order.sellerOrderId, sellerId);
                    setResendMessage("A new OTP has been sent to the buyer.");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to resend OTP");
                  } finally {
                    setResending(false);
                  }
                }}
              />
            </>
          )}
      </div>

      {reasonModal}
    </div>
  );
}

export default function SellerOrdersPage() {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<SellerOrder[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priceFilter, setPriceFilter] = useState<"ALL" | "QUOTATION" | "ORIGINAL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const products = useProductSummaries(
    (orders ?? []).flatMap((o) => o.items.map((i) => i.productId).filter((id): id is string => !!id))
  );

  // Every order is loaded once; the status tabs filter on screen so each tab can show its own count.
  const countFor = (status: string) =>
    status === "ALL" ? orders?.length ?? 0 : (orders ?? []).filter((o) => o.status === status).length;
  const inStatus = (orders ?? []).filter((o) => statusFilter === "ALL" || o.status === statusFilter);
  // The price-type pills below count the orders in the selected status tab.
  const quotationCount = inStatus.filter((o) => o.quoteRequestId != null).length;
  const visibleOrders = inStatus.filter((o) =>
    priceFilter === "ALL" ? true : priceFilter === "QUOTATION" ? o.quoteRequestId != null : o.quoteRequestId == null
  );

  const loadOrders = useCallback(async (id: string) => {
    try {
      const data = await getSellerOrders(id);
      setOrders(data.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
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
    // Deferred to a microtask: the set-state-in-effect lint rule flags loadOrders when called directly.
    if (sellerId) queueMicrotask(() => loadOrders(sellerId));
  }, [sellerId, loadOrders]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-heading font-bold text-pneutral-900">Orders</h1>
          {orders !== null && <span className="text-xs text-neutral-500">{visibleOrders.length} shown</span>}
        </div>
        {orders !== null && (
          <div className="inline-flex gap-0.5 rounded-lg border border-neutral-200 p-0.5">
            {([
              ["ALL", "All", inStatus.length],
              ["QUOTATION", "Quotation", quotationCount],
              ["ORIGINAL", "Original price", inStatus.length - quotationCount],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setPriceFilter(key)}
                className={`rounded-md border-[1.5px] px-3 py-1 text-xs font-semibold transition-colors ${
                  priceFilter === key ? "border-primary-900 text-primary-900" : "border-transparent text-neutral-500 hover:text-primary-900"
                }`}
              >
                {label} <span className="opacity-70">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border-[1.5px] px-3 py-1 text-xs font-semibold transition-colors ${
              statusFilter === status
                ? "border-primary-900 bg-transparent text-primary-900"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-800 hover:text-primary-900"
            }`}
          >
            {prettyStatus(status)}
            {orders !== null && <span className="ml-1.5 opacity-70">{countFor(status)}</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {orders === null && !error && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
        </div>
      )}

      {orders !== null && visibleOrders.length === 0 && (
        <p className="text-p3 font-body text-neutral-500">No orders found.</p>
      )}

      {orders !== null && visibleOrders.length > 0 && sellerId && (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.sellerOrderId}
              order={order}
              sellerId={sellerId}
              products={products}
              onChanged={() => loadOrders(sellerId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
