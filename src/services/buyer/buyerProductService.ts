import buyerApi from "@/src/lib/buyerApi";
import { BuyerProduct } from "@/src/types/buyer/product";

// GET /products/all is the cross-seller listing endpoint (unlike
// /products/getAll, which is scoped to the calling seller's own inventory
// via their JWT and would 500 for a buyer token — see backend
// ProductDetailsController). No buyer-specific backend work exists yet
// beyond this: it's currently open to any caller, not just buyers.
export async function getAllProducts(): Promise<BuyerProduct[]> {
  const response = await buyerApi.get("/products/all");
  return response.data?.data ?? response.data ?? [];
}

// No dedicated public single-product endpoint exists yet — reuses the full
// list and filters client-side. Fine at today's product volume; revisit
// with a real GET /products/{id}-style public endpoint if that changes.
export async function getProductById(productId: string): Promise<BuyerProduct | undefined> {
  const products = await getAllProducts();
  return products.find((product) => product.productId === productId);
}
