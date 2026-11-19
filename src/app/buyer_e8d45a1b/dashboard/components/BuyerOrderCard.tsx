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
    <span
      className={`inline-flex items-baseline gap-1.5 whitespace-nowrap ${
        strong ? "rounded-md border border-primary-200 px-2.5 py-1" : ""
      }`}
    >
      <span className={strong ? "text-xs font-semibold text-primary-900" : "text-xs text-neutral-500"}>{label}</span>
      <span className={strong ? "text-sm font-bold text-primary-900" : "text-xs font-semibold text-neutral-700"}>
        {formatMoney(value)}
      </span>
    </span>
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
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-neutral-100 bg-neutral-50/60 px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <Link href={detailHref} className="text-[13px] font-heading font-bold text-pneutral-900 hover:underline">
            {order.orderId}
          </Link>
          {isQuote && (
            <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] font-semibold text-secondary-800">
              Quotation price
            </span>
          )}
          <span className="text-xs text-neutral-500">
            {placedText ? `Placed ${placedText}` : "Placed"}
            {` · ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            {multiSeller ? ` · ${order.sellerOrders.length} sellers` : ""}
            {quote?.sellerName ? ` · Seller: ${quote.sellerName}` : ""}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="divide-y divide-neutral-100 px-4">
        {order.sellerOrders.flatMap((so) =>
          so.items.map((item) => {
            const listed = item.productId ? products[item.productId]?.listedPrice : undefined;
            return (
              <li key={`${so.sellerOrderId}-${item.orderItemId}`} className="flex items-center gap-3 py-2">
                <ProductThumb
                  size="sm"
                  src={item.productId ? products[item.productId]?.image : undefined}
                  alt={item.productNameSnapshot ?? "Product"}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-neutral-900">
                    {item.productNameSnapshot ?? "Item"}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    {item.productId && item.productId !== item.productNameSnapshot && (
                      <span className="mr-2 text-neutral-400">{item.productId}</span>
                    )}
                    {item.unitPriceSnapshot != null
                      ? `${formatMoney(item.unitPriceSnapshot)} × ${item.quantity}`
                      : `Qty ${item.quantity}`}
                    {item.batchLotNumberSnapshot ? ` · Batch ${item.batchLotNumberSnapshot}` : ""}
                    {isQuote && quote?.unit ? ` ${quote.unit}` : ""}
                  </p>
                  {isQuote && listed != null && item.unitPriceSnapshot != null && Math.abs(listed - item.unitPriceSnapshot) > 0.005 && (
                    <span className="block text-[11px] text-neutral-500">
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
                    <p className="text-[13px] font-bold text-neutral-900">{formatMoney(item.lineTotal)}</p>
                  )}
                  {multiSeller && <StatusBadge status={so.status} />}
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-neutral-100 bg-neutral-50/60 px-4 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(detailHref)}
            className="rounded-lg border-[1.5px] border-primary-900 px-3 py-1 text-xs font-semibold text-primary-900 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800"
          >
            View order
          </button>
          {isQuote && (
            <Link
              href={`/buyer_e8d45a1b/dashboard/rfq#quote-${order.quoteRequestId}`}
              className="text-xs font-semibold text-primary-800 hover:underline"
            >
              View quote #{order.quoteRequestId}
            </Link>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
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
