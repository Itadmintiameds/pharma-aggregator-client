"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Button from "@/src/app/commonComponents/Button";
import { useReasonPrompt } from "@/src/app/commonComponents/useReasonPrompt";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { cancelOrder, cancelSellerOrder, getOrder } from "@/src/services/buyer/orderService";
import { Order, SellerOrder } from "@/src/types/buyer/order";

// Shared order-detail body used by both the standalone marketing-site route
// (src/app/orders/[orderId], wrapped in LandingHeader/Footer) and the
// dashboard-scoped route (buyer_e8d45a1b/dashboard/orders/[orderId], wrapped
// in the dashboard sidebar/header) — same fetch + cancel logic, each caller
// supplies its own chrome and login-redirect target.
const CANCELLABLE_STATUSES = new Set(["PLACED", "CONFIRMED", "PACKED"]);

const FULFILLMENT_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

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
}: {
  sellerOrder: SellerOrder;
  onCancel: (sellerOrderId: string) => void;
  cancelling: boolean;
}) {
  const isCancelled = sellerOrder.status === "CANCELLED";
  const currentStepIndex = FULFILLMENT_STEPS.indexOf(sellerOrder.status);
  const canCancel = CANCELLABLE_STATUSES.has(sellerOrder.status);
  const [expanded, setExpanded] = useState(false);

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
            </p>
          )}

          <div className="space-y-2 mb-4">
            {sellerOrder.items.map((item) => (
              <div key={item.orderItemId} className="flex justify-between text-p3 font-body text-pneutral-700">
                <span>{item.productNameSnapshot} x {item.quantity}</span>
                <span>₹{item.lineTotal?.toFixed(2)}</span>
              </div>
            ))}
          </div>

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
  const { promptReason, modal: reasonModal } = useReasonPrompt();

  const loadOrder = async () => {
    try {
      const data = await getOrder(orderId);
      setOrder(data);
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
            {order.placedAt ? new Date(order.placedAt).toLocaleString() : ""}
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
