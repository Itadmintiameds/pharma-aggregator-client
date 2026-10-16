import axios from "axios";
import api from "@/src/lib/api";
import { QuoteRequest, SellerQuoteResponsePayload } from "@/src/types/quote/quoteRequest";

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
      error.response?.data?.data?.message ||
      error.response?.data?.message ||
      error.message ||
      fallback
    );
  }
  return error instanceof Error ? error.message : fallback;
}

// sellerId is resolved server-side from the JWT — never passed by the caller.
export async function getSellerQuoteRequests(): Promise<QuoteRequest[]> {
  try {
    // quotation-service returns a Spring Page ({ content: [...] }), not a bare array.
    const response = await api.get<ApiResponseWrapper<QuoteRequest[] | { content?: QuoteRequest[] }>>(
      "/seller/quote-requests"
    );
    const data = response.data.data;
    return Array.isArray(data) ? data : data?.content ?? [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to load quote requests."));
  }
}

export async function respondToQuoteRequest(
  quoteRequestId: number,
  payload: SellerQuoteResponsePayload
): Promise<QuoteRequest> {
  try {
    const response = await api.patch<ApiResponseWrapper<QuoteRequest>>(
      `/seller/quote-requests/${quoteRequestId}/respond`,
      payload
    );
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to send your response."));
  }
}
