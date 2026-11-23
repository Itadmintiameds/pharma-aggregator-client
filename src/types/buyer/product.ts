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
  gstPercentage?: number;
  additionalDiscounts?: BuyerProductOffer[];
}

// A time-limited quantity slab on a batch (backend AdditionalDiscountDto). `active` is computed by the server.
// The backend serializes minimumPurchaseQuantity / additionalDiscountPercentage; minQty / discountPercentage
// are the older names, kept so either shape is understood (read them through offerMinQty / offerPercent).
export interface BuyerProductOffer {
  minimumPurchaseQuantity?: number;
  additionalDiscountPercentage?: number;
  minQty?: number;
  discountPercentage?: number;
  displayOffer?: boolean;
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
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
  returnable?: boolean;
  returnPeriodDays?: number | null;
  pricingDetails?: BuyerProductPricing[];
  packagingDetails?: BuyerProductPackaging[];
  productImages?: BuyerProductImage[];
  status?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
}
