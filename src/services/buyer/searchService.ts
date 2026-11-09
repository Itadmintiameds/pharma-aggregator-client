import axios from "axios";
import buyerApi from "@/src/lib/buyerApi";
import { BuyerProduct } from "@/src/types/buyer/product";
import {
  AutocompleteSuggestion,
  SearchParams,
  SearchProductResult,
  SearchResultPage,
  TrendingTerm,
} from "@/src/types/buyer/search";

// Search is public (anonymous visitors can search), so every call opts out of the buyer-login redirect that
// buyerApi performs on a 401.
const PUBLIC = { skipAuthRedirect: true } as const;

/** Drops undefined/empty params so they are not sent as "q=" / "categoryId=undefined". */
function cleanParams(params: SearchParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    out[key] = value as string | number | boolean;
  });
  return out;
}

/** True when a request was cancelled via AbortController (not an error worth showing). */
export function isRequestCancelled(error: unknown): boolean {
  return axios.isCancel(error) || (error as { code?: string })?.code === "ERR_CANCELED";
}

/** The API reports problems as { status: "ERROR", message } (400) - surface that message to the UI. */
function toError(error: unknown, fallback: string): Error {
  if (isRequestCancelled(error)) return error as Error;
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return new Error(message || fallback);
}

export async function searchProducts(params: SearchParams, signal?: AbortSignal): Promise<SearchResultPage> {
  try {
    const response = await buyerApi.get("/search", { params: cleanParams(params), signal, ...PUBLIC });
    return response.data?.data as SearchResultPage;
  } catch (error) {
    throw toError(error, "Search is unavailable right now. Please try again.");
  }
}

export async function getAutocompleteSuggestions(
  q: string,
  limit = 8,
  signal?: AbortSignal
): Promise<AutocompleteSuggestion[]> {
  try {
    const response = await buyerApi.get("/search/autocomplete", { params: { q, limit }, signal, ...PUBLIC });
    return (response.data?.data ?? []) as AutocompleteSuggestion[];
  } catch (error) {
    throw toError(error, "Suggestions are unavailable right now.");
  }
}

export async function getTrendingSearches(limit = 8, signal?: AbortSignal): Promise<TrendingTerm[]> {
  try {
    const response = await buyerApi.get("/search/trending", { params: { limit }, signal, ...PUBLIC });
    return (response.data?.data ?? []) as TrendingTerm[];
  } catch (error) {
    throw toError(error, "Trending searches are unavailable right now.");
  }
}

/**
 * Turns a search hit into the BuyerProduct shape the existing ProductCard, cart and availability helpers work
 * with. The hit carries the headline batch (price, stock, order limits, pricingId/packagingId), which is all
 * they need to show the card and add the product to the cart.
 */
export function searchResultToBuyerProduct(result: SearchProductResult): BuyerProduct {
  const categoryId = result.categoryId != null && result.categoryId !== "" ? Number(result.categoryId) : undefined;
  const hasBatch = result.sellingPrice != null || result.mrp != null || result.pricingId != null;

  return {
    productId: result.productId,
    productName: result.productName,
    productDescription: result.productDescription ?? undefined,
    manufacturerName: result.manufacturerName ?? undefined,
    categoryId: Number.isFinite(categoryId) ? categoryId : undefined,
    sellerId: result.sellerId ?? undefined,
    sellerName: result.sellerName ?? undefined,
    status: "PUBLISHED",
    productImages: result.imageUrl ? [{ productImage: result.imageUrl }] : [],
    // An out-of-stock hit always carries a zero-stock entry (even with no price at all): resolveProductAvailability
    // treats "no batch information" as buyable, which would leave "Add to cart" enabled for something with no stock.
    pricingDetails: hasBatch || !result.inStock
      ? [
          {
            pricingId: result.pricingId ?? undefined,
            packagingId: result.packagingId ?? undefined,
            stockQuantity: result.inStock ? result.stockQuantity ?? undefined : 0,
            sellingPrice: result.sellingPrice ?? undefined,
            mrp: result.mrp ?? undefined,
            discountPercentage: result.discountPercentage ?? undefined,
          },
        ]
      : [],
    packagingDetails: result.packagingId
      ? [
          {
            packagingId: result.packagingId,
            minimumOrderQuantity: result.minOrderQty ?? undefined,
            maximumOrderQuantity: result.maxOrderQty ?? undefined,
          },
        ]
      : [],
  };
}
