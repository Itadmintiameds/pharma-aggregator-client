// Mirrors the backend's dto/order/*.java response shapes (see
// pharma-aggregator-server OrderResponseDTO/SellerOrderResponseDTO/OrderItemResponseDTO).

export interface RejectedLine {
  productId: string;
  reason: string;
}

export interface OrderItem {
  orderItemId?: number;
  productId?: string;
  pricingId?: string;
  productNameSnapshot?: string;
  batchLotNumberSnapshot?: string;
  packagingIdSnapshot?: string;
  quantity: number;
  unitPriceSnapshot?: number;
  discountAmount?: number;
  taxAmount?: number;
  lineTotal?: number;
  itemStatus?: string;
}

export interface OrderStatusHistoryEntry {
  historyId?: number;
  fromStatus?: string;
  toStatus?: string;
  changedByRole?: string;
  changedById?: string;
  comment?: string;
  changedAt?: string;
}

export interface SellerOrder {
  sellerOrderId: string;
  orderId?: string;
  // Set when the parent order was placed from an already-ACCEPTED quote
  // request — null/undefined for an ordinary cart checkout at the seller's
  // own listed price.
  quoteRequestId?: number;
  sellerId?: string;
  status: string;
  subtotal?: number;
  shippingFee?: number;
  taxAmount?: number;
  grandTotal?: number;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelledByRole?: string;
  invoiceId?: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  createdAt?: string;
}

export interface Order {
  orderId: string;
  buyerId?: string;
  deliveryName?: string;
  deliveryPhone?: string;
  deliveryAddressLine?: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  deliveryState?: string;
  deliveryPinCode?: string;
  status: string;
  // Set when this order was placed from an already-ACCEPTED quote request
  // (see the RFQ dashboard's "Place Order" action) — undefined for an
  // ordinary cart checkout.
  quoteRequestId?: number;
  itemCount?: number;
  sellerOrderCount?: number;
  subtotal?: number;
  shippingTotal?: number;
  taxTotal?: number;
  grandTotal?: number;
  paymentId?: string;
  paymentStatus?: string;
  placedAt?: string;
  cancelledAt?: string;
  cancelledByRole?: string;
  cancelReason?: string;
  sellerOrders: SellerOrder[];
  createdAt?: string;
  rejectedLines?: RejectedLine[];
}

export interface OrderLineRequest {
  productId: string;
  pricingId: string;
  quantity: number;
}

export interface PlaceOrderRequest {
  buyerId: string;
  // When present, the backend derives the single order line entirely from
  // the stored, already-ACCEPTED QuoteRequest (product, quantity, negotiated
  // price) — `lines` is ignored server-side in that case.
  quoteRequestId?: number;
  deliveryAddressId?: number;
  deliveryName?: string;
  deliveryPhone?: string;
  deliveryAddressLine?: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  deliveryState?: string;
  deliveryPinCode?: string;
  paymentMethod?: string;
  idempotencyKey?: string;
  // Required unless quoteRequestId is set.
  lines: OrderLineRequest[];
}
