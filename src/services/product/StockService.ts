import { api } from "@/src/utils/api";
import { getCurrentSellerId } from "@/src/services/product/sellerContext";

export interface PackagingDetailsPayload {
  packId: number;
  unitPerPack: number;
  packTypeUnitId: number;
  numberOfPacks: number;
  packSize: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
}

// Mirrors the backend's AdditionalDiscountDto — only the fields a seller sets when creating
// a special discount on a new batch; additionalDiscountId/pricingId are server-assigned.
export interface SpecialDiscountPayload {
  minimumPurchaseQuantity?: number;
  additionalDiscountPercentage?: number;
  displayOffer?: boolean;
}

export interface StockAddRequest {
  productId: string;
  // Referencing an existing variant — must already exist on this product.
  packagingId?: string;
  // Submitting new packaging details to create/reuse a variant in the same call,
  // instead of referencing an existing packagingId. Ignored if packagingId is set.
  packagingDetails?: PackagingDetailsPayload;
  batchLotNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  mrp?: number;
  sellingPrice?: number;
  // Optional — regular discount percentage on this batch (0-100). Only applies when creating
  // a new batch; ignored when restocking an existing one.
  discountPercentage?: number;
  // Optional — one or more separate special-offer/promotional discounts, distinct from
  // discountPercentage. Each entry is stored as its own AdditionalDiscount record on the
  // batch rather than a plain field. Only applies when creating a new batch.
  specialDiscounts?: SpecialDiscountPayload[];
  // Optional — shelf life of this batch in whole months. Only applies when creating a new batch.
  shelfLifeMonths?: number;
  // Optional — shelf life of this batch in whole days. Only applies when creating a new batch.
  shelfLifeDays?: number;
  // Optional — defaults to today (server-side) if omitted. Only applies when creating a new batch.
  dateOfStockEntry?: string;
  referenceId?: string;
  referenceType?: string;
}

export interface StockLedgerResponse {
  ledgerId: number;
  pricingId: string;
  packagingId?: string | null;
  batchLotNumber: string;
  productId: string;
  transactionType: string;
  quantity: number;
  balanceAfter: number;
  referenceId?: string | null;
  referenceType?: string | null;
  createdDate: string;
}

export interface BatchAvailability {
  pricingId: string;
  packagingId?: string | null;
  batchLotNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  stockQuantity: number;
  discountPercentage?: number | null;
  shelfLifeMonths?: number | null;
  shelfLifeDays?: number | null;
  dateOfStockEntry?: string | null;
}

// product-service's StockInRequestDto / PackagingDetailsDto / AdditionalDiscountDto use
// different field names from the ones the seller screens work with (it has no aliases for
// them), so values would silently be dropped: packId -> packTypeId, minimum/maximumOrderQuantity
// -> minOrderQty/maxOrderQty, minimumPurchaseQuantity/additionalDiscountPercentage ->
// minQty/discountPercentage. The original names are kept alongside (unknown fields are ignored).
const toBackendStockPayload = (payload: StockAddRequest) => {
  const out: Record<string, unknown> = { ...payload };
  if (payload.packagingDetails) {
    const p = payload.packagingDetails;
    out.packagingDetails = {
      ...p,
      packTypeId: p.packId,
      minOrderQty: p.minimumOrderQuantity,
      maxOrderQty: p.maximumOrderQuantity,
    };
  }
  if (payload.specialDiscounts) {
    out.specialDiscounts = payload.specialDiscounts.map((d) => ({
      ...d,
      minQty: d.minimumPurchaseQuantity,
      discountPercentage: d.additionalDiscountPercentage,
    }));
  }
  return out;
};

export const addStock = async (
  payload: StockAddRequest
): Promise<StockLedgerResponse> => {
  // product-service takes sellerId as a required query param (it does not read it from the JWT)
  const sellerId = await getCurrentSellerId();
  const response = await api.post("/stock/add", toBackendStockPayload(payload), { params: { sellerId } });
  return response.data?.data ?? response.data;
};

export const getAvailableBatches = async (
  productId: string,
  packagingId?: string
): Promise<BatchAvailability[]> => {
  const response = await api.get(`/stock/${productId}/batches`, {
    params: packagingId ? { packagingId } : undefined,
  });
  const list = response.data?.data ?? response.data;
  return Array.isArray(list) ? list : [];
};



export interface BatchDeleteResponse {
  pricingId: string;
  batchLotNumber: string;
  productId: string;
  deletedBy: string;
  deletedAt: string;
}

export const deleteBatch = async (
  productId: string,
  pricingId: string
): Promise<BatchDeleteResponse> => {
  const sellerId = await getCurrentSellerId();
  const response = await api.delete(`/stock/${productId}/batches/${pricingId}`, {
    params: { sellerId },
  });
  return response.data?.data ?? response.data;
};