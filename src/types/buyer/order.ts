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
  lines: OrderLineRequest[];
}
