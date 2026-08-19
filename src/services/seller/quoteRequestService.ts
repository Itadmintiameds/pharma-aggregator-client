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
    const response = await api.get<ApiResponseWrapper<QuoteRequest[]>>("/seller/quote-requests");
    return response.data.data ?? [];
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
