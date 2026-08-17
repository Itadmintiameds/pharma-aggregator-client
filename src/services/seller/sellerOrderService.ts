import axios from "axios";
import api from "@/src/lib/api";
// Order/SellerOrder DTOs are identical across buyer/seller call sites (same
// backend response shape) — reused from buyer/order.ts rather than duplicated.
import { SellerOrder } from "@/src/types/buyer/order";

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

export async function getSellerOrders(sellerId: string, status?: string): Promise<SellerOrder[]> {
  const response = await api.get<ApiResponseWrapper<SellerOrder[]>>(`/seller-orders/seller/${sellerId}`, {
    params: status ? { status } : undefined,
  });
  return response.data.data ?? [];
}

export async function getSellerOrder(sellerOrderId: string): Promise<SellerOrder> {
  const response = await api.get<ApiResponseWrapper<SellerOrder>>(`/seller-orders/${sellerOrderId}`);
  return response.data.data;
}

async function transition(sellerOrderId: string, action: string, body: Record<string, unknown>) {
  try {
    const response = await api.patch<ApiResponseWrapper<SellerOrder>>(
      `/seller-orders/${sellerOrderId}/${action}`,
      body
    );
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, `Failed to ${action} this order. Please try again.`));
  }
}

export function confirmSellerOrder(sellerOrderId: string, sellerId: string) {
  return transition(sellerOrderId, "confirm", { sellerId });
}

export function packSellerOrder(sellerOrderId: string, sellerId: string) {
  return transition(sellerOrderId, "pack", { sellerId });
}

export function shipSellerOrder(
  sellerOrderId: string,
  sellerId: string,
  courierName: string,
  trackingNumber: string,
  trackingUrl?: string
) {
  return transition(sellerOrderId, "ship", { sellerId, courierName, trackingNumber, trackingUrl });
}

export function markOutForDelivery(sellerOrderId: string, sellerId: string) {
  return transition(sellerOrderId, "out-for-delivery", { sellerId });
}

// Requires the delivery OTP sent to the buyer when the order moved to
// OUT_FOR_DELIVERY (see backend SellerOrderFulfillmentServiceImpl) — the
// seller/delivery staff asks the buyer for it at the doorstep.
export function markDelivered(sellerOrderId: string, sellerId: string, otp: string) {
  return transition(sellerOrderId, "deliver", { sellerId, otp });
}

// Recovery action for a SellerOrder stuck in OUT_FOR_DELIVERY whose original
// OTP send silently failed (e.g. SMS provider issue) — resends without
// re-running the SHIPPED→OUT_FOR_DELIVERY transition itself.
export async function resendDeliveryOtp(sellerOrderId: string, sellerId: string): Promise<void> {
  try {
    await api.patch(`/seller-orders/${sellerOrderId}/resend-delivery-otp`, { sellerId });
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to resend delivery OTP. Please try again."));
  }
}

export async function cancelSellerOrderAsSeller(
  sellerOrderId: string,
  sellerId: string,
  reason: string
): Promise<SellerOrder> {
  try {
    const response = await api.patch<ApiResponseWrapper<SellerOrder>>(`/seller-orders/${sellerOrderId}/cancel`, {
      actorRole: "SELLER",
      actorId: sellerId,
      reason,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to cancel this order. Please try again."));
  }
}
