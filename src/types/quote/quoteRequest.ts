export type QuoteRequestType = "PRICE_REQUEST" | "RFQ";

export type QuoteRequestStatus = "PENDING" | "QUOTED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "ORDER_PLACED";

// Matches backend QuoteRequestCreateDTO. Fields only relevant to one
// requestType (e.g. targetPrice/pincode for PRICE_REQUEST, or
// deliveryLocation/paymentTerms/companyName/gstNumber/contactPerson for RFQ)
// are simply omitted for the other type.
export interface QuoteRequestCreatePayload {
  productId: string;
  requestType: QuoteRequestType;
  quantity: number;
  unit?: string;

  targetPrice?: number;
  pincode?: string;

  deliveryLocation?: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  companyName?: string;
  gstNumber?: string;
  contactPerson: string;

  phone: string;
  email: string;
  message?: string;
}

// Matches backend QuoteRequestResponseDTO.
export interface QuoteRequest {
  quoteRequestId: number;
  requestType: QuoteRequestType;
  status: QuoteRequestStatus;

  productId: string;
  productName: string;
  sellerId: string;
  sellerName: string;

  quantity: number;
  unit?: string;
  targetPrice?: number;
  pincode?: string;
  deliveryLocation?: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  companyName?: string;
  gstNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  message?: string;

  quotedPrice?: number;
  quoteValidUntil?: string;
  sellerNotes?: string;

  // Set once this ACCEPTED quote has been converted into an order.
  orderId?: string;

  createdAt: string;
  updatedAt: string;
}

// Matches backend SellerQuoteResponseDTO.
export interface SellerQuoteResponsePayload {
  quotedPrice: number;
  quoteValidUntil?: string;
  sellerNotes?: string;
}
