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
import { StatusBadge, ProductThumb, prettyStatus, useProductImages } from "../components/sellerCardUi";

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
    <div className="flex flex-col gap-2 mt-3 p-3 bg-neutral-50 rounded-lg">
      <input
        placeholder="Courier name"
        value={courierName}
        onChange={(e) => setCourierName(e.target.value)}
        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
      />
      <input
        placeholder="Tracking number"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
      />
      <input
        placeholder="Tracking URL (optional)"
        value={trackingUrl}
        onChange={(e) => setTrackingUrl(e.target.value)}
        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
      />
      <button
        disabled={busy || !courierName || !trackingNumber}
        onClick={() => onSubmit(courierName, trackingNumber, trackingUrl)}
        className="bg-primary-900 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-40"
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
        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
      />
      <button
        disabled={busy || resending}
        onClick={onResendOtp}
        className="border border-neutral-300 text-neutral-700 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
        title="Buyer didn't receive the OTP? Resend it."
      >
        {resending ? "Resending..." : "Resend OTP"}
      </button>
      <button
        disabled={busy || !otp}
        onClick={() => onSubmit(otp)}
        className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        {busy ? "Confirming..." : "Confirm Delivery"}
      </button>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value?: number; strong?: boolean }) {
  if (value == null) return null;
  return (
    <div className={`flex justify-between gap-8 ${strong ? "pt-2 mt-1 border-t border-neutral-200" : ""}`}>
      <span className={strong ? "text-p3 font-semibold text-neutral-900" : "text-p4 text-neutral-500"}>{label}</span>
      <span className={strong ? "text-p2 font-heading font-semibold text-neutral-900" : "text-p4 text-neutral-700"}>
        ₹{value.toFixed(2)}
      </span>
    </div>
  );
}

function OrderCard({
  order,
  sellerId,
  images,
  onChanged,
}: {
  order: SellerOrder;
  sellerId: string;
  images: Record<string, string>;
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
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-p2 font-heading font-semibold text-pneutral-900">{order.sellerOrderId}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isQuote ? "bg-secondary-100 text-secondary-800" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {isQuote ? "Quotation price" : "Original price"}
            </span>
          </div>
          {placedAt && (
            <p className="mt-0.5 text-p4 font-body text-neutral-500">
              Placed on{" "}
              {new Date(placedAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {isStale && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-2">
          <p className="text-p4 font-body text-red-700">
            Placed {Math.floor(ageHours!)}h ago — still not confirmed. Please action soon.
          </p>
        </div>
      )}

      <ul className="divide-y divide-neutral-100 px-6">
        {order.items.map((item) => (
          <li key={item.orderItemId} className="flex items-center gap-4 py-4">
            <ProductThumb
              src={item.productId ? images[item.productId] : undefined}
              alt={item.productNameSnapshot ?? "Product"}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-p3 font-body font-semibold text-neutral-900">
                {item.productNameSnapshot ?? "Item"}
              </p>
              {item.productId && item.productId !== item.productNameSnapshot && (
                <p className="text-xs text-neutral-500">{item.productId}</p>
              )}
              <p className="mt-1 text-p4 font-body text-neutral-600">
                {item.unitPriceSnapshot != null
                  ? `₹${item.unitPriceSnapshot.toFixed(2)} × ${item.quantity}`
                  : `Qty ${item.quantity}`}
                {item.batchLotNumberSnapshot ? ` · Batch ${item.batchLotNumberSnapshot}` : ""}
              </p>
            </div>
            {item.lineTotal != null && (
              <p className="text-p3 font-body font-semibold text-neutral-900">₹{item.lineTotal.toFixed(2)}</p>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 border-t border-neutral-100 bg-neutral-50/60 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1 text-p4 font-body text-neutral-600">
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
        <div className="flex min-w-[220px] flex-col gap-1">
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

      {RETURN_NOTICES[order.status] && (
        <div className="flex items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-6 py-3">
          <p className="text-p4 font-body text-amber-800">{RETURN_NOTICES[order.status]}</p>
          <Link
            href="/seller_7a3b9f2c/returns"
            className="shrink-0 rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Returns
          </Link>
        </div>
      )}

      {(error || hasActions) && (
        <div className="border-t border-neutral-100 px-6 py-4">
          {error && <p className="mb-2 text-p4 text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {order.status === "PLACED" && (
              <>
                <button
                  disabled={busy}
                  onClick={() => run(() => confirmSellerOrder(order.sellerOrderId, sellerId))}
                  className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
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
                  className="border border-red-500 text-red-600 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Reject
                </button>
              </>
            )}

            {order.status === "CONFIRMED" && (
              <button
                disabled={busy}
                onClick={() => run(() => packSellerOrder(order.sellerOrderId, sellerId))}
                className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Mark Packed
              </button>
            )}

            {order.status === "SHIPPED" && (
              <button
                disabled={busy}
                onClick={() => run(() => markOutForDelivery(order.sellerOrderId, sellerId))}
                className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
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
                className="border border-red-500 text-red-600 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Cancel
              </button>
            )}
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
              {resendMessage && <p className="text-p4 font-body text-green-600 mt-2">{resendMessage}</p>}
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
      )}

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
  const images = useProductImages(
    (orders ?? []).flatMap((o) => o.items.map((i) => i.productId).filter((id): id is string => !!id))
  );

  // Counts/filter apply to the orders loaded for the selected status tab.
  const quotationCount = (orders ?? []).filter((o) => o.quoteRequestId != null).length;
  const visibleOrders = (orders ?? []).filter((o) =>
    priceFilter === "ALL" ? true : priceFilter === "QUOTATION" ? o.quoteRequestId != null : o.quoteRequestId == null
  );

  const loadOrders = useCallback(async (id: string, status: string) => {
    try {
      const data = await getSellerOrders(id, status === "ALL" ? undefined : status);
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
    if (sellerId) {
      loadOrders(sellerId, statusFilter);
    }
  }, [sellerId, statusFilter, loadOrders]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h4 font-heading font-medium text-pneutral-900">Orders</h1>
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
          </button>
        ))}
      </div>

      {orders !== null && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {([
            ["ALL", "All orders", orders.length],
            ["QUOTATION", "Quotation orders", quotationCount],
            ["ORIGINAL", "Original price orders", orders.length - quotationCount],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setPriceFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                priceFilter === key ? "bg-secondary-100 text-secondary-800" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      )}

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
        <div className="space-y-5">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.sellerOrderId}
              order={order}
              sellerId={sellerId}
              images={images}
              onChanged={() => loadOrders(sellerId, statusFilter)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
