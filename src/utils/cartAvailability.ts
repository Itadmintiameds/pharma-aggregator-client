import { CartItem } from "@/src/types/buyer/cart";
import { BuyerProduct } from "@/src/types/buyer/product";

// A product can have several batches (every "Update Stock" adds one), and the backend sells them first-in
// first-out as ONE pool. So availability is the sum over the live batches - not the first batch alone, which
// may well be the empty one - and the price shown is that of the first live batch that actually has a price.
export function resolveProductAvailability(product: BuyerProduct) {
  const batches = product.pricingDetails ?? [];
  const now = Date.now();
  const live = batches
    .filter((b) => (b.stockQuantity ?? 0) > 0)
    .filter((b) => !(b.expiryDate && new Date(b.expiryDate).getTime() < now))
    .sort((a, b) => (a.manufacturingDate ?? "").localeCompare(b.manufacturingDate ?? ""));

  const pricing = live.find((b) => b.sellingPrice != null) ?? live[0] ?? batches[0];
  const packaging = product.packagingDetails?.find(
    (pkg) => pkg.packagingId != null && pkg.packagingId === pricing?.packagingId
  );

  const stock = batches.length > 0 ? live.reduce((sum, b) => sum + (b.stockQuantity ?? 0), 0) : undefined;
  const packagingMax = packaging?.maximumOrderQuantity;
  const maxQuantity =
    packagingMax != null && stock != null ? Math.min(packagingMax, stock) : packagingMax ?? stock;
  const minQuantity = packaging?.minimumOrderQuantity ?? 1;

  return { pricing, minQuantity, maxQuantity, unavailable: maxQuantity != null && maxQuantity < minQuantity };
}

// Out of stock (or less stock than the seller's minimum order): the line cannot be ordered as it stands.
export function isCartItemUnavailable(item: CartItem): boolean {
  return item.maxQuantity != null && item.maxQuantity < (item.minQuantity ?? 1);
}
