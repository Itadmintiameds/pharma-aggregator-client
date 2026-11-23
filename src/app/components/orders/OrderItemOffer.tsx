import { OrderItem } from "@/src/types/buyer/order";

/**
 * The discount an order line got, and why: a "Special offer" badge when a time-limited offer is what applied
 * (recorded on the line when the order was placed, so it stays correct after the offer has ended), otherwise
 * the regular discount percentage. Renders nothing for a line with no discount.
 */
export default function OrderItemOffer({ item }: { item: OrderItem }) {
  const offerApplied = item.offerDiscountPercentage != null && item.offerMinQuantity != null;
  const percentage = item.discountPercentageSnapshot ?? 0;
  const amount = item.discountAmount ?? 0;

  if (!offerApplied && percentage <= 0 && amount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-0.5 mb-1 text-p4 font-body">
      {offerApplied ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded-full bg-success-50 px-2 py-0.5 font-semibold text-success-600">Special offer</span>
          <span className="text-pneutral-600">
            {item.offerDiscountPercentage}% off for {item.offerMinQuantity}+ units
          </span>
        </span>
      ) : (
        // Orders placed before the percentage was recorded only have the amount, so omit the "%" for them.
        <span className="text-pneutral-500">{percentage > 0 ? `Discount ${percentage}%` : "Discount"}</span>
      )}
      {amount > 0 && <span className="text-success-600">− ₹{amount.toFixed(2)}</span>}
    </div>
  );
}
