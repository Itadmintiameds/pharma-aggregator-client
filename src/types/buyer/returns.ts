// Mirrors order-service's ReturnResponseDTO. Shared by the buyer and seller return screens.

export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED" // withdrawn by the buyer before shipping
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "RECEIVED" // inspected, refund issued for the accepted units
  | "REFUNDED"
  | "CLOSED"; // inspected, no unit accepted — nothing refunded

// Units of one order item inside a return.
export interface ReturnLine {
  lineId: number;
  orderItemId: number;
  productId?: string;
  productName?: string;
  requestedQuantity: number;
  // null until the seller decides; 0 when the seller turned this product down.
  approvedQuantity?: number | null;
  // Units in play (approved, or requested until decided) and their share of the item's total.
  quantity: number;
  lineTotal?: number;
  restockedQuantity?: number | null;
  damagedQuantity?: number | null;
  rejectedQuantity?: number | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
  refundId?: number | null;
}

// A photo or video the buyer attached; url is a signed link valid for about 15 minutes.
export interface ReturnEvidence {
  evidenceId: number;
  contentType: string;
  sizeBytes: number;
  url: string;
}

// One return = one parcel back to one seller, covering one or more products.
export interface ReturnRequest {
  returnId: number;
  orderId?: string;
  sellerOrderId?: string;
  buyerId?: string;
  reasonCode?: string;
  reason?: string;
  status: ReturnStatus | string;
  requestedAt?: string;
  resolvedAt?: string;
  resolvedByRole?: string;
  sellerComment?: string;
  cancelledAt?: string;
  cancelReason?: string;
  // Reverse transport (buyer -> seller), same fields as the forward shipment.
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  receivedAt?: string;
  inspectionNote?: string;
  // Value of the units in play across all lines.
  totalAmount?: number;
  refundAmount?: number;
  // COD order with other sellers still to deliver: the refund is sent once the whole order is delivered.
  refundHeld?: boolean;
  refundedAt?: string;
  lines: ReturnLine[];
  evidence?: ReturnEvidence[];
}

// Mirrors order-service's ReturnReasonCode. There is no "changed my mind" — medicines are only
// returnable for a concrete problem.
export const RETURN_REASONS: { code: string; label: string }[] = [
  { code: "DAMAGED", label: "Damaged or broken" },
  { code: "EXPIRED", label: "Expired" },
  { code: "NEAR_EXPIRY", label: "Near expiry" },
  { code: "WRONG_ITEM", label: "Wrong item received" },
  { code: "WRONG_BATCH", label: "Wrong batch received" },
  { code: "SHORT_QUANTITY", label: "Fewer units than ordered" },
  { code: "QUALITY_ISSUE", label: "Quality issue" },
  { code: "OTHER", label: "Other" },
];

export function reasonLabel(code?: string): string {
  return RETURN_REASONS.find((r) => r.code === code)?.label ?? code ?? "-";
}

// Units of an order item a return line holds; a rejected or cancelled return frees them (same rule as the backend).
export function consumedUnits(r: ReturnRequest, line: ReturnLine): number {
  return r.status === "REJECTED" || r.status === "CANCELLED" ? 0 : line.quantity ?? 0;
}

// The buyer can withdraw a return until the parcel is handed to a courier.
export const CANCELLABLE_RETURN_STATUSES = new Set(["REQUESTED", "APPROVED"]);

// Return steps, mirroring the forward fulfillment stepper.
export const RETURN_STEPS = ["REQUESTED", "APPROVED", "SHIPPED", "OUT_FOR_DELIVERY", "RECEIVED", "REFUNDED"];

export const units = (n: number) => `${n} unit${n === 1 ? "" : "s"}`;

// Mirrors order-service's ReturnEvidenceService limits.
export const RETURN_EVIDENCE_MAX_FILES = 5;
export const RETURN_EVIDENCE_MAX_IMAGE_MB = 10;
export const RETURN_EVIDENCE_MAX_VIDEO_MB = 50;
export const RETURN_EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
// Reasons the seller can't judge without seeing the goods.
export const REASONS_REQUIRING_EVIDENCE = ["DAMAGED", "WRONG_ITEM", "EXPIRED"];

/** Why this file can't be attached, or null when it can. */
export function evidenceFileError(file: File): string | null {
  if (!RETURN_EVIDENCE_TYPES.includes(file.type)) {
    return `${file.name}: only JPEG, PNG or WebP photos and MP4, WebM or MOV videos can be attached`;
  }
  const video = file.type.startsWith("video/");
  const limitMb = video ? RETURN_EVIDENCE_MAX_VIDEO_MB : RETURN_EVIDENCE_MAX_IMAGE_MB;
  if (file.size > limitMb * 1024 * 1024) return `${file.name}: ${video ? "videos" : "photos"} must be at most ${limitMb} MB`;
  return null;
}
