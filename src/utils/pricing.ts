import { CartItem } from "@/src/types/buyer/cart";
import { BuyerProduct, BuyerProductOffer, BuyerProductPricing } from "@/src/types/buyer/product";

// Mirrors the order-service's pricing (OrderPlacementServiceImpl) and refund pro-rating (ReturnLine.amountFor),
// so what the buyer sees before placing an order or requesting a return is what they are actually charged/refunded.

// BigDecimal.setScale(2, HALF_UP). The epsilon keeps binary-float values like 1.005 rounding up, as they do on the backend.
export function roundMoney(value: number): number {
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * 100 + 1e-9)) / 100;
}

export interface LinePrice {
  gross: number; // unit price x quantity
  discount: number;
  tax: number; // GST on (gross - discount), added on top
  total: number; // gross - discount + tax
}

export function priceLine(
  unitPrice: number,
  quantity: number,
  discountPercentage: number = 0,
  gstPercentage: number = 0
): LinePrice {
  const gross = unitPrice * quantity;
  const discount = roundMoney((gross * discountPercentage) / 100);
  const tax = roundMoney(((gross - discount) * gstPercentage) / 100);
  return { gross, discount, tax, total: gross - discount + tax };
}

// OfferSupport.effectiveDiscount: the batch discount, or a better quantity slab that is live, shown to buyers,
// and whose minimum quantity this order reaches. A slab replaces the base discount, it does not add to it.
export function effectiveDiscount(
  baseDiscount: number | undefined,
  offers: BuyerProductOffer[] | undefined,
  quantity: number
): number {
  let best = baseDiscount ?? 0;
  for (const offer of offers ?? []) {
    if (offer.minQty == null || quantity < offer.minQty || offer.discountPercentage == null) continue;
    if (offer.displayOffer === false || offer.active === false) continue;
    if (offer.discountPercentage > best) best = offer.discountPercentage;
  }
  return best;
}

// The pricing fields a cart line keeps from its batch. GST is per batch on the backend; the product-level
// value is only a fallback for responses that do not carry it on the batch.
export function batchPricingFields(product: BuyerProduct, pricing: BuyerProductPricing | undefined) {
  return {
    discountPercentage: pricing?.discountPercentage,
    gstPercentage: pricing?.gstPercentage ?? product.gstPercentage,
    offers: pricing?.additionalDiscounts,
  };
}

export function priceCartItem(item: CartItem): LinePrice {
  return priceLine(
    item.sellingPrice ?? item.mrp ?? 0,
    item.quantity,
    effectiveDiscount(item.discountPercentage, item.offers, item.quantity),
    item.gstPercentage ?? 0
  );
}

// ReturnLine.amountFor: a line's total split evenly over its units, rounded once.
export function proRate(lineTotal: number, units: number, lineQuantity: number): number {
  if (lineQuantity <= 0) return 0;
  if (units === lineQuantity) return lineTotal;
  return roundMoney((lineTotal * units) / lineQuantity);
}
