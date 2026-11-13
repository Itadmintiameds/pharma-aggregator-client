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

function OrderCard({
  order,
  sellerId,
  onChanged,
}: {
  order: SellerOrder;
  sellerId: string;
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
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-p2 font-heading font-semibold text-pneutral-900">{order.sellerOrderId}</p>
          <span
            className={`text-label-l2 font-heading font-medium px-2.5 py-1 rounded-full ${
              order.quoteRequestId != null
                ? "bg-secondary-100 text-secondary-800"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {order.quoteRequestId != null ? "Quotation Price" : "Original Price"}
          </span>
        </div>
        <span className="text-p4 font-body font-semibold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">
          {order.status}
        </span>
      </div>

      {placedAt && (
        <p className="text-p4 font-body text-neutral-500 mb-3">
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

      {isStale && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
          <p className="text-p4 font-body text-red-700">
            Placed {Math.floor(ageHours!)}h ago — still not confirmed. Please action soon.
          </p>
        </div>
      )}

      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div key={item.orderItemId} className="flex justify-between text-p4 font-body text-pneutral-600">
            <span>
              {item.productNameSnapshot}
              {item.productId && item.productId !== item.productNameSnapshot ? ` (${item.productId})` : ""} x {item.quantity}
            </span>
            <span>₹{item.lineTotal?.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <p className={`text-p3 font-heading font-semibold text-pneutral-900 ${order.quoteRequestId != null ? "mb-1" : "mb-3"}`}>
        Total: ₹{order.grandTotal?.toFixed(2)}
      </p>
      {order.quoteRequestId != null && (
        <p className="text-p4 font-body text-secondary-700 mb-3">
          Priced at the quote you accepted for this buyer, not your current listed price.
        </p>
      )}

      {RETURN_NOTICES[order.status] && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-center justify-between gap-3">
          <p className="text-p4 font-body text-amber-800">{RETURN_NOTICES[order.status]}</p>
          <Link
            href="/seller_7a3b9f2c/returns"
            className="shrink-0 bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Go to Returns
          </Link>
        </div>
      )}

      {error && <p className="text-p4 text-red-600 mb-2">{error}</p>}

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

        {order.status === "OUT_FOR_DELIVERY" && (
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

        {["PLACED", "CONFIRMED", "PACKED"].includes(order.status) && order.status !== "PLACED" && (
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

      {order.status === "SHIPPED" && (
        <button
          disabled={busy}
          onClick={() => run(() => markOutForDelivery(order.sellerOrderId, sellerId))}
          className="bg-primary-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 mt-2"
        >
          Mark Out for Delivery
        </button>
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
              statusFilter === status ? "bg-primary-900 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {status}
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
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.sellerOrderId}
              order={order}
              sellerId={sellerId}
              onChanged={() => loadOrders(sellerId, statusFilter)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
