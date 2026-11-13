"use client";

import { useEffect, useState } from "react";
import { getProductsByIds } from "@/src/services/buyer/buyerProductService";
import { formatMoney } from "@/src/utils/dashboardFormat";
import { resolveProductAvailability } from "@/src/utils/cartAvailability";

// Small pieces shared by the seller and buyer dashboards' cards (orders, returns, quotes) so they all read the same way.

export const PLACEHOLDER_IMAGE = "/icons/Tumbnail.svg";

export const prettyStatus = (status: string) =>
  status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");

export const STATUS_STYLES: Record<string, string> = {
  PLACED: "bg-amber-50 text-amber-700 ring-amber-200",
  PARTIALLY_SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  QUOTED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  ACCEPTED: "bg-teal-50 text-teal-700 ring-teal-200",
  ORDER_PLACED: "bg-green-50 text-green-700 ring-green-200",
  EXPIRED: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  REQUESTED: "bg-amber-50 text-amber-700 ring-amber-200",
  RETURN_REQUESTED: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-200",
  PACKED: "bg-blue-50 text-blue-700 ring-blue-200",
  APPROVED: "bg-blue-50 text-blue-700 ring-blue-200",
  RETURN_APPROVED: "bg-blue-50 text-blue-700 ring-blue-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  OUT_FOR_DELIVERY: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  RECEIVED: "bg-teal-50 text-teal-700 ring-teal-200",
  RETURNED: "bg-teal-50 text-teal-700 ring-teal-200",
  DELIVERED: "bg-green-50 text-green-700 ring-green-200",
  REFUNDED: "bg-green-50 text-green-700 ring-green-200",
  CLOSED: "bg-red-50 text-red-700 ring-red-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  RETURN_REJECTED: "bg-red-50 text-red-700 ring-red-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-700 ring-neutral-200"
      }`}
    >
      {prettyStatus(status)}
    </span>
  );
}

export function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={!src || failed ? PLACEHOLDER_IMAGE : src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 object-contain"
    />
  );
}

/**
 * "Order price" of one unit, plus the product's listed price when it differs - the "Original listed price" for an
 * order placed at a quotation price, the "Current listed price" otherwise. Renders block-level lines, so it can sit
 * inside any text container. Nothing is rendered without a unit price.
 */
export function UnitPriceLines({
  unitPrice,
  listedPrice,
  isQuote,
  perspective = "buyer",
}: {
  unitPrice?: number | null;
  listedPrice?: number | null;
  isQuote: boolean;
  perspective?: "buyer" | "seller";
}) {
  if (unitPrice == null) return null;
  const differs = listedPrice != null && Math.abs(listedPrice - unitPrice) > 0.005;
  const percent = isQuote && differs ? Math.round(((unitPrice - listedPrice!) / listedPrice!) * 100) : null;
  return (
    <>
      <span className="mt-0.5 block text-xs text-neutral-500">
        Order price <span className="font-semibold text-neutral-800">{formatMoney(unitPrice)}</span> / unit
        {isQuote && (
          <span className="ml-1.5 rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-800">Quotation price</span>
        )}
      </span>
      {differs && (
        <span className="mt-0.5 block text-xs text-neutral-500">
          {isQuote ? "Original listed price" : "Current listed price"}{" "}
          <span className="line-through">{formatMoney(listedPrice!)}</span>
          {percent !== null && percent !== 0 && (
            <span className={percent < 0 ? "text-green-700" : "text-amber-700"}>
              {" "}
              ·{" "}
              {perspective === "buyer"
                ? `you paid ${Math.abs(percent)}% ${percent < 0 ? "less" : "more"}`
                : `quoted ${Math.abs(percent)}% ${percent < 0 ? "below" : "above"} listed`}
            </span>
          )}
        </span>
      )}
    </>
  );
}

export interface ProductSummary {
  image?: string;
  /** Current listed unit price (selling price, else MRP) of the batch the backend quotes against by default. */
  listedPrice?: number;
  mrp?: number;
}

/**
 * productId -> image and current listed price. Order, return and quote lines carry neither, so the products are
 * looked up (best effort; a product that is gone or unpublished simply gets no entry / the placeholder).
 */
export function useProductSummaries(productIds: string[]): Record<string, ProductSummary> {
  const [summaries, setSummaries] = useState<Record<string, ProductSummary>>({});
  const key = [...new Set(productIds)].sort().join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getProductsByIds(key.split(","))
      .then((products) => {
        if (cancelled) return;
        setSummaries((prev) => {
          const next = { ...prev };
          products.forEach((product) => {
            const pricing = resolveProductAvailability(product).pricing;
            next[product.productId] = {
              image: product.productImages?.find((img) => img.productImage)?.productImage,
              listedPrice: pricing?.sellingPrice ?? pricing?.mrp,
              mrp: pricing?.mrp,
            };
          });
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);

  return summaries;
}

/** productId -> first image URL (see useProductSummaries). */
export function useProductImages(productIds: string[]): Record<string, string> {
  const summaries = useProductSummaries(productIds);
  return Object.fromEntries(
    Object.entries(summaries).flatMap(([id, summary]) => (summary.image ? [[id, summary.image]] : []))
  );
}
