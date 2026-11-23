import axios from "axios";
import api from "@/src/lib/api";
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

export async function getSellerReturns(sellerId: string, status?: string): Promise<ReturnRequest[]> {
  // order-service returns a Spring Page, so read every page - not just the first 100.
  return fetchAllPages<ReturnRequest>(`/returns/seller/${sellerId}`, status ? { status } : {});
}


export async function decideReturn(
  returnId: number,
  sellerId: string,
  approve: boolean,
  comment: string,
  // Units accepted per line when approving (0 turns that product down); unlisted lines = all requested.
  lines?: { lineId: number; approvedQuantity: number }[]
): Promise<ReturnRequest> {
  try {
    const response = await api.patch<ApiResponseWrapper<ReturnRequest>>(`/returns/${returnId}/decision`, {
      sellerId,
      approve,
      lines,
      comment,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, `Failed to ${approve ? "accept" : "reject"} this return. Please try again.`)
    );
  }
}

// Seller confirms the parcel arrived and inspects each line. damagedQuantity units go to damaged stock,
// rejectedQuantity are not accepted, the rest go back to normal stock. Accepted units are refunded now.
export async function receiveReturn(
  returnId: number,
  sellerId: string,
  lines: { lineId: number; damagedQuantity: number; rejectedQuantity: number }[],
  inspectionNote?: string
): Promise<ReturnRequest> {
  try {
    const response = await api.patch<ApiResponseWrapper<ReturnRequest>>(`/returns/${returnId}/receive`, {
      sellerId,
      lines,
      inspectionNote,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to record the received return. Please try again."));
  }
}
