import { api } from "@/src/utils/api";

export interface PackagingDetailsPayload {
  packId: number;
  unitPerPack: number;
  packTypeUnitId: number;
  numberOfPacks: number;
  packSize: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
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
}

export const addStock = async (
  payload: StockAddRequest
): Promise<StockLedgerResponse> => {
  const response = await api.post("/stock/add", payload);
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
