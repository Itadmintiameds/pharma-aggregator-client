import axios from "axios";
import buyerApi from "@/src/lib/buyerApi";
import { QuoteRequest, QuoteRequestCreatePayload } from "@/src/types/quote/quoteRequest";

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

// buyerUserId is resolved server-side from the JWT — never passed by the caller.
export async function createQuoteRequest(payload: QuoteRequestCreatePayload): Promise<QuoteRequest> {
  try {
    const response = await buyerApi.post<ApiResponseWrapper<QuoteRequest>>("/buyer/quote-requests", payload);
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to submit request. Please try again."));
  }
}

export async function getMyQuoteRequests(): Promise<QuoteRequest[]> {
  try {
    const response = await buyerApi.get<ApiResponseWrapper<QuoteRequest[]>>("/buyer/quote-requests");
    return response.data.data ?? [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to load your requests."));
  }
}

export async function acceptQuoteRequest(quoteRequestId: number): Promise<QuoteRequest> {
  try {
    const response = await buyerApi.patch<ApiResponseWrapper<QuoteRequest>>(
      `/buyer/quote-requests/${quoteRequestId}/accept`
    );
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to accept quote."));
  }
}

export async function rejectQuoteRequest(quoteRequestId: number): Promise<QuoteRequest> {
  try {
    const response = await buyerApi.patch<ApiResponseWrapper<QuoteRequest>>(
      `/buyer/quote-requests/${quoteRequestId}/reject`
    );
    return response.data.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to reject quote."));
  }
}
