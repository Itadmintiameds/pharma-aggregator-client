"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/src/context/CartContext";
import { useBuyerCartDrawer } from "../../context/BuyerCartDrawerContext";
import { BuyerProduct } from "@/src/types/buyer/product";
import { resolveProductAvailability } from "@/src/utils/cartAvailability";
import { rememberSearchContext, SearchContext, trackSearchEvent } from "@/src/services/buyer/searchEvents";
import { formatMoney } from "@/src/utils/dashboardFormat";

/** At or below this many units an in-stock product is flagged as running low. */
const LOW_STOCK_UNITS = 20;

/**
 * A product in the buyer dashboard's catalog. Unlike the landing-page card (whose actions only appear on hover),
 * everything is visible at once - the price, the stock, and the add-to-cart control - and every card has the same
 * height so the grid stays tidy. The buyer is always logged in here, so prices are never hidden.
 */
export default function CatalogProductCard({
  product,
  searchContext,
}: {
  product: BuyerProduct;
  /** Which search showed this card and at what rank, for the search analytics. */
  searchContext?: SearchContext;
}) {
  const { items, addItem, updateQuantity } = useCart();
  const { openCart } = useBuyerCartDrawer();
  const { pricing, minQuantity, maxQuantity, unavailable } = resolveProductAvailability(product);
  const image = product.productImages?.[0]?.productImage;
  const cartQuantity = items.find((item) => item.productId === product.productId)?.quantity ?? 0;

  const sellingPrice = pricing?.sellingPrice ?? pricing?.mrp;
  const mrp = pricing?.mrp;
  const discount =
    mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice
      ? Math.round(((mrp - pricing.sellingPrice) / mrp) * 100)
      : null;
  const lowStock = !unavailable && maxQuantity != null && maxQuantity <= LOW_STOCK_UNITS;
  const atMax = maxQuantity != null && cartQuantity >= maxQuantity;
  const href = `/product/${product.productId}`;

  // Analytics: the buyer opened the product / put it in the cart from a search result. Remembering the context lets
  // a quote request or order made a few pages later still be tied to the search that found the product.
  const trackClick = () => {
    if (!searchContext) return;
    rememberSearchContext(product.productId, searchContext);
    trackSearchEvent("SEARCH_CLICK", product.productId, searchContext);
  };
  const add = () => {
    addItem(product, 1);
    if (searchContext && !unavailable) {
      rememberSearchContext(product.productId, searchContext);
      trackSearchEvent("ADD_TO_CART", product.productId, searchContext);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} onClick={trackClick} className="relative block bg-neutral-50">
        <div className="flex h-48 items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || "/icons/Tumbnail.svg"}
            alt={product.productName}
            className={`h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 ${
              unavailable ? "opacity-50 grayscale" : ""
            }`}
            onError={(e) => {
              // stale/unreachable image URL: fall back once to the default thumbnail
              const img = e.currentTarget;
              img.onerror = null;
              img.src = "/icons/Tumbnail.svg";
            }}
          />
        </div>
        {discount !== null && !unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">
            {discount}% off
          </span>
        )}
        {unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
        {lowStock && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Only {maxQuantity} left
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.manufacturerName && (
          <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-400">{product.manufacturerName}</p>
        )}
        <h3 className="line-clamp-2 min-h-[2.75rem] text-p3 font-heading font-semibold leading-snug text-neutral-900">
          <Link href={href} onClick={trackClick} className="hover:text-primary-800">
            {product.productName}
          </Link>
        </h3>
        {product.productDescription && (
          <p className="line-clamp-2 text-p4 font-body text-neutral-500">{product.productDescription}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          {product.sellerName && (
            <span className="truncate">
              Sold by <span className="font-medium text-neutral-700">{product.sellerName}</span>
            </span>
          )}
          {minQuantity > 1 && <span>Min. order {minQuantity}</span>}
        </div>

        <div className="mt-auto pt-3">
          {sellingPrice != null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-h6 font-heading font-bold text-neutral-900">{formatMoney(sellingPrice)}</span>
              {mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice && (
                <span className="text-p4 text-neutral-400 line-through">{formatMoney(mrp)}</span>
              )}
              <span className="text-xs text-neutral-400">/ unit</span>
            </div>
          ) : (
            <span className="text-p4 text-neutral-500">Price on request</span>
          )}

          <div className="mt-3">
            {cartQuantity === 0 ? (
              <button
                type="button"
                onClick={add}
                disabled={unavailable}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                <ShoppingCart size={16} />
                {unavailable ? "Out of stock" : "Add to cart"}
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(product.productId, cartQuantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-800 hover:bg-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-neutral-900">{cartQuantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={atMax}
                    onClick={() => updateQuantity(product.productId, cartQuantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-800 hover:bg-white disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button type="button" onClick={openCart} className="text-sm font-semibold text-primary-800 hover:underline">
                  View cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
