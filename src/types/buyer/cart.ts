export interface CartItem {
  productId: string;
  pricingId?: string;
  productName: string;
  image?: string;
  mrp?: number;
  sellingPrice?: number;
  quantity: number;
}
