export interface CartItem {
  productId: string;
  productName: string;
  image?: string;
  mrp?: number;
  sellingPrice?: number;
  quantity: number;
}
