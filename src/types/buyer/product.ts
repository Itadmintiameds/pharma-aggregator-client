export interface BuyerProductPricing {
  pricingId?: string;
  stockQuantity?: number;
  sellingPrice?: number;
  mrp?: number;
  discountPercentage?: number;
  finalPrice?: number;
}

export interface BuyerProductImage {
  productImageId?: string;
  productImage?: string;
}

export interface BuyerProduct {
  productId: string;
  productName: string;
  productDescription?: string;
  manufacturerName?: string;
  categoryId?: number;
  gstPercentage?: number;
  hsnCode?: number;
  pricingDetails?: BuyerProductPricing[];
  productImages?: BuyerProductImage[];
  status?: string;
}
