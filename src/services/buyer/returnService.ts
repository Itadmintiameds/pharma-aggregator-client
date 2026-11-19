import axios from "axios";
import buyerApi from "@/src/lib/buyerApi";
import { ReturnRequest } from "@/src/types/buyer/returns";
import { fetchAllPages } from "@/src/utils/fetchAllPages";

interface ApiResponseWrapper<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    // "Validation failed" responses carry the per-field messages in data.data ({ field: message }).
    const fieldErrors = error.response?.data?.data;
    if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors) && !fieldErrors.message) {
      const details = Object.values(fieldErrors).filter((v): v is string => typeof v === "string");
      if (details.length > 0) return details.join(". ");
    }
    return (
      error.response?.data?.message ||
      error.response?.data?.data?.message ||
      error.message ||
      fallback
    );
  }
  return error instanceof Error ? error.message : fallback;
}

export interface ReturnRequestInput {
  items: { orderItemId: number; quantity: number }[];
  buyerId: string;
  reasonCode: string;
  reason?: string;
}

// One return (one parcel) for units of one or more items of the same seller order, under one reason.
// Can be called again for the same order while the return window is open and units are left.
export async function requestReturn(input: ReturnRequestInput): Promise<ReturnRequest> {
  try {
    const response = await buyerApi.post<ApiResponseWrapper<ReturnRequest>>("/returns", input);
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to request a return. Please try again."));
  }
}


export async function getReturnsByBuyer(buyerId: string, status?: string): Promise<ReturnRequest[]> {
  // order-service returns a Spring Page, so read every page - not just the first 100.
  return fetchAllPages<ReturnRequest>(`/returns/buyer/${buyerId}`, status ? { status } : {}, buyerApi);
}

async function transition(returnId: number, action: string, body: Record<string, unknown>, fallback: string) {
  try {
    const response = await buyerApi.patch<ApiResponseWrapper<ReturnRequest>>(`/returns/${returnId}/${action}`, body);
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, fallback));
  }
}

// Buyer hands the approved return to a courier — same fields as the seller's forward shipment.
export function shipReturn(
  returnId: number,
  buyerId: string,
  courierName: string,
  trackingNumber: string,
  trackingUrl?: string
) {
  return transition(
    returnId,
    "ship",
    { buyerId, courierName, trackingNumber, trackingUrl },
    "Failed to mark the return as shipped. Please try again."
  );
}

// Buyer withdraws the return before it ships; its units can be returned again later in the window.
export function cancelReturn(returnId: number, buyerId: string, reason?: string) {
  return transition(returnId, "cancel", { buyerId, reason }, "Failed to cancel the return. Please try again.");
}

export function markReturnOutForDelivery(returnId: number, buyerId: string) {
  return transition(
    returnId,
    "out-for-delivery",
    { buyerId },
    "Failed to mark the return as out for delivery. Please try again."
  );
}
