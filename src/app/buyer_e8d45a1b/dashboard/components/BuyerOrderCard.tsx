"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order } from "@/src/types/buyer/order";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";
import { ProductSummary, ProductThumb, StatusBadge } from "@/src/app/commonComponents/cardUi";
import { formatMoney } from "@/src/utils/dashboardFormat";

function SummaryRow({ label, value, strong }: { label: string; value?: number | null; strong?: boolean }) {
  if (value == null) return null;
  return (
    <div className={`flex justify-between gap-8 ${strong ? "mt-1 border-t border-neutral-200 pt-2" : ""}`}>
      <span className={strong ? "text-p3 font-semibold text-neutral-900" : "text-p4 text-neutral-500"}>{label}</span>
      <span className={strong ? "text-p2 font-heading font-semibold text-neutral-900" : "text-p4 text-neutral-700"}>
        {formatMoney(value)}
      </span>
    </div>
  );
}

/**
 * One of the buyer's orders as a card: the products with their images and the price each was bought at (and, for a
 * quotation order, the original listed price), the seller, the status, and the price summary. Used by the Orders
 * list and the Quotation Orders list.
 */
export default function BuyerOrderCard({
  order,
  products,
  quote,
}: {
  order: Order;
  products: Record<string, ProductSummary>;
  /** The quote this order was placed from, when known - adds the seller's name. */
  quote?: QuoteRequest;
}) {
  const router = useRouter();
  const isQuote = order.quoteRequestId != null;
  const multiSeller = order.sellerOrders.length > 1;
  const detailHref = `/buyer_e8d45a1b/dashboard/orders/${order.orderId}`;
  const placed = order.placedAt ?? order.createdAt;
  const placedText = placed
    ? new Date(placed).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;
  const itemCount = order.sellerOrders.reduce((n, so) => n + so.items.length, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={detailHref} className="text-p2 font-heading font-semibold text-pneutral-900 hover:underline">
              {order.orderId}
            </Link>
            {isQuote && (
              <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-800">
                Quotation price
              </span>
            )}
          </div>
          <p className="mt-0.5 text-p4 font-body text-neutral-500">
            {placedText ? `Placed on ${placedText}` : "Placed"}
            {` · ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            {multiSeller ? ` · ${order.sellerOrders.length} sellers` : ""}
            {quote?.sellerName ? ` · Seller: ${quote.sellerName}` : ""}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="divide-y divide-neutral-100 px-6">
        {order.sellerOrders.flatMap((so) =>
          so.items.map((item) => {
            const listed = item.productId ? products[item.productId]?.listedPrice : undefined;
            return (
              <li key={`${so.sellerOrderId}-${item.orderItemId}`} className="flex items-center gap-4 py-4">
                <ProductThumb
                  src={item.productId ? products[item.productId]?.image : undefined}
                  alt={item.productNameSnapshot ?? "Product"}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-p3 font-body font-semibold text-neutral-900">
                    {item.productNameSnapshot ?? "Item"}
                  </p>
                  {item.productId && item.productId !== item.productNameSnapshot && (
                    <p className="text-xs text-neutral-500">{item.productId}</p>
                  )}
                  <p className="mt-1 text-p4 font-body text-neutral-600">
                    {item.unitPriceSnapshot != null
                      ? `${formatMoney(item.unitPriceSnapshot)} × ${item.quantity}`
                      : `Qty ${item.quantity}`}
                    {item.batchLotNumberSnapshot ? ` · Batch ${item.batchLotNumberSnapshot}` : ""}
                    {isQuote && quote?.unit ? ` ${quote.unit}` : ""}
                  </p>
                  {isQuote && listed != null && item.unitPriceSnapshot != null && Math.abs(listed - item.unitPriceSnapshot) > 0.005 && (
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      Original listed price <span className="line-through">{formatMoney(listed)}</span>
                      <span className={item.unitPriceSnapshot < listed ? "text-green-700" : "text-amber-700"}>
                        {" "}
                        · you paid {Math.abs(Math.round(((item.unitPriceSnapshot - listed) / listed) * 100))}%{" "}
                        {item.unitPriceSnapshot < listed ? "less" : "more"}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {item.lineTotal != null && (
                    <p className="text-p3 font-body font-semibold text-neutral-900">{formatMoney(item.lineTotal)}</p>
                  )}
                  {multiSeller && <StatusBadge status={so.status} />}
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="flex flex-col gap-4 border-t border-neutral-100 bg-neutral-50/60 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(detailHref)}
            className="rounded-lg bg-primary-900 px-4 py-2 text-sm font-semibold text-white"
          >
            View order
          </button>
          {isQuote && (
            <Link
              href={`/buyer_e8d45a1b/dashboard/rfq#quote-${order.quoteRequestId}`}
              className="text-p4 font-semibold text-primary-800 hover:underline"
            >
              View quote #{order.quoteRequestId}
            </Link>
          )}
        </div>
        <div className="flex min-w-[220px] flex-col gap-1">
          {order.subtotal != null && order.grandTotal != null && order.subtotal !== order.grandTotal && (
            <>
              <SummaryRow label="Subtotal" value={order.subtotal} />
              {!!order.shippingTotal && <SummaryRow label="Shipping" value={order.shippingTotal} />}
              {!!order.taxTotal && <SummaryRow label="Tax" value={order.taxTotal} />}
            </>
          )}
          <SummaryRow label="Total" value={order.grandTotal} strong />
        </div>
      </div>
    </div>
  );
}
