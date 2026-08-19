export interface BuyerProductPricing {
  pricingId?: string;
  packagingId?: string;
  stockQuantity?: number;
  sellingPrice?: number;
  mrp?: number;
  discountPercentage?: number;
  finalPrice?: number;
}

export interface BuyerProductPackaging {
  packagingId?: string;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
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
  packagingDetails?: BuyerProductPackaging[];
  productImages?: BuyerProductImage[];
  status?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
}
