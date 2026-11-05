import type { BuyerQuantityOffer } from "@/src/utils/offers";

export interface BuyerProductPricing {
  pricingId?: string;
  packagingId?: string;
  stockQuantity?: number;
  manufacturingDate?: string;
  expiryDate?: string;
  sellingPrice?: number;
  mrp?: number;
  discountPercentage?: number;
  finalPrice?: number;
  // Quantity offers that were live when the product was fetched (expired / future / hidden ones are
  // already dropped server-side), and the server's clock at that moment for countdowns.
  additionalDiscounts?: BuyerQuantityOffer[];
  serverTime?: string;
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
