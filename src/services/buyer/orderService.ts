import axios from "axios";
import buyerApi from "@/src/lib/buyerApi";
import { Order, PlaceOrderRequest } from "@/src/types/buyer/order";

interface ApiResponseWrapper<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.data?.message ||
      error.message ||
      fallback
    );
  }
  return error instanceof Error ? error.message : fallback;
}

// One key per checkout attempt, reused across retries of that SAME attempt
// (see checkout page) so a double-click/network-retry doesn't place the
// order twice — the backend dedupes on this against Order.idempotencyKey.
export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function placeOrder(request: PlaceOrderRequest): Promise<Order> {
  try {
    const response = await buyerApi.post<ApiResponseWrapper<Order>>("/orders", request);
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to place order. Please try again."));
  }
}

export async function getOrder(orderId: string): Promise<Order> {
  const response = await buyerApi.get<ApiResponseWrapper<Order>>(`/orders/${orderId}`);
  return response.data.data;
}

export async function getOrdersByBuyer(buyerId: string): Promise<Order[]> {
  const response = await buyerApi.get<ApiResponseWrapper<Order[]>>(`/orders/buyer/${buyerId}`);
  return response.data.data ?? [];
}

export async function cancelOrder(
  orderId: string,
  actorId: string,
  reason: string
): Promise<Order> {
  try {
    const response = await buyerApi.post<ApiResponseWrapper<Order>>(`/orders/${orderId}/cancel`, {
      actorRole: "BUYER",
      actorId,
      reason,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to cancel order. Please try again."));
  }
}

// Cancels ONE seller's portion of a multi-seller order — distinct endpoint
// from cancelOrder above (POST /orders/{orderId}/cancel cancels every
// cancellable seller-order under that parent Order at once).
export async function cancelSellerOrder(
  sellerOrderId: string,
  actorId: string,
  reason: string
): Promise<void> {
  try {
    await buyerApi.patch(`/seller-orders/${sellerOrderId}/cancel`, {
      actorRole: "BUYER",
      actorId,
      reason,
    });
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to cancel this item. Please try again."));
  }
}
