import { fetchAllPages } from "@/src/utils/fetchAllPages";

// Mirrors billing-service's SettlementResponse / CommissionChargeResponse. BigDecimals arrive as JSON numbers.
// Both endpoints are scoped to the logged-in seller by their JWT; no sellerId is passed.

export interface SellerSettlement {
  settlementId: number;
  periodFrom?: string;
  periodTo?: string;
  grossSales?: number;
  refunds?: number;
  commission?: number;
  gstOnCommission?: number;
  tcs?: number;
  tds?: number;
  adjustments?: number;
  netPayable?: number;
  /** DRAFT -> APPROVED -> PAID */
  status: string;
}

export interface SellerCommissionCharge {
  chargeId: number;
  sellerOrderId?: string;
  chargeType?: string;
  baseAmount?: number;
  commissionAmount?: number;
  gstOnCommission?: number;
  /** ACCRUED -> SETTLED */
  status?: string;
  accruedAt?: string;
}

export const getSellerSettlements = () => fetchAllPages<SellerSettlement>("/billing/seller/settlements");

export const getSellerCommissionCharges = () =>
  fetchAllPages<SellerCommissionCharge>("/billing/seller/commissions");
