export interface CartItem {
  productId: string;
  pricingId?: string;
  productName: string;
  image?: string;
  sellerName?: string;
  mrp?: number;
  sellingPrice?: number;
  quantity: number;
  // From the batch's packaging record (minimum_order_quantity /
  // maximum_order_quantity, set by the seller when creating the batch) —
  // falls back to 1 / the batch's stock quantity when not set.
  minQuantity?: number;
  maxQuantity?: number;
}
