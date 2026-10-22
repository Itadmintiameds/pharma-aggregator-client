import buyerApi from "@/src/lib/buyerApi";
import { BuyerProduct } from "@/src/types/buyer/product";

export interface BuyerSeller {
  sellerId: string;
  sellerName: string;
  sellerImageUrl?: string | null;
}

// Public, buyer-safe list for the landing page's "featured sellers" strip: approved sellers' name and logo only
// (seller-service GET /sellers/public/brands). It needs no login, so a visitor sees it too. (The old call,
// GET /sellers, is an admin-shaped listing that needs a token and returned 401 for visitors.)
export async function getAllSellers(): Promise<BuyerSeller[]> {
  const response = await buyerApi.get("/sellers/public/brands", { skipAuthRedirect: true });
  return response.data?.data ?? response.data ?? [];
}

// Browsing and searching the catalog goes through the search service (see searchService.ts); there is
// deliberately no "load every product" call here any more. GET /products/all returned the entire catalog
// (with pricing, packaging and images) and was downloaded by the landing page, the cart and every product page.

// Single buyer-facing product read: only PUBLISHED products are served (anything else is a 404, so drafts
// never leak) and the seller's display name is included. Public, so a visitor without a token can open it.
// Resolves to undefined when the product does not exist (or is no longer published).
export async function getProductById(productId: string): Promise<BuyerProduct | undefined> {
  try {
    const response = await buyerApi.get(`/products/public/${encodeURIComponent(productId)}`, {
      skipAuthRedirect: true,
    });
    return (response.data?.data ?? response.data) as BuyerProduct;
  } catch (error) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) return undefined;
    throw error;
  }
}

// Fresh data for the products in the cart: one request per distinct product, in parallel. Products that are
// gone (404) or temporarily unreadable are simply left out, so the caller keeps whatever it already has for them.
export async function getProductsByIds(productIds: string[]): Promise<BuyerProduct[]> {
  const distinct = [...new Set(productIds)];
  const settled = await Promise.allSettled(distinct.map((id) => getProductById(id)));
  return settled.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : []
  );
}
