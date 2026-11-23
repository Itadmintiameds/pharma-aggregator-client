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
 * A product in the buyer dashboard's catalog, in the same compact style as the storefront's cards (landing page and
 * search): small image, two-line title, one meta line, price and a single outlined Add button. Everything is visible at
 * once and every card has the same height. The buyer is always logged in here, so prices are never hidden, and adding
 * to the cart does not pop the drawer open - a "View cart" link appears once the product is in the cart.
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
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-md">
      <Link href={href} onClick={trackClick} className="relative block border-b border-neutral-100 bg-white">
        <div className="flex h-28 items-center justify-center p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || "/icons/Tumbnail.svg"}
            alt={product.productName}
            loading="lazy"
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
          <span className="absolute left-2 top-2 rounded-md bg-green-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            {discount}% off
          </span>
        )}
        {unavailable && (
          <span className="absolute left-2 top-2 rounded-md bg-neutral-800 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            Out of stock
          </span>
        )}
        {lowStock && (
          <span className="absolute right-2 top-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
            Only {maxQuantity} left
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        {product.manufacturerName && (
          <p className="truncate text-[9px] font-medium uppercase tracking-wide text-neutral-400">{product.manufacturerName}</p>
        )}
        <h3 className="line-clamp-2 min-h-[2.1rem] text-xs font-semibold leading-tight text-neutral-900">
          <Link href={href} onClick={trackClick} className="hover:text-primary-800">
            {product.productName}
          </Link>
        </h3>
        <p className="mt-0.5 flex items-center gap-x-1.5 truncate text-[10px] text-neutral-500">
          {product.sellerName && <span className="truncate">By {product.sellerName}</span>}
          {minQuantity > 1 && (
            <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-600">Min {minQuantity}</span>
          )}
        </p>

        <div className="mt-auto pt-2">
          {sellingPrice != null ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-neutral-900">{formatMoney(sellingPrice)}</span>
              {mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice && (
                <span className="text-xs text-neutral-400 line-through">{formatMoney(mrp)}</span>
              )}
              <span className="text-[11px] text-neutral-400">/ unit</span>
            </div>
          ) : (
            <span className="text-xs text-neutral-500">Price on request</span>
          )}

          <div className="mt-2">
            {cartQuantity === 0 ? (
              <button
                type="button"
                onClick={add}
                disabled={unavailable}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-primary-800 bg-white px-2 py-1.5 text-xs font-semibold text-primary-800 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-400"
              >
                <ShoppingCart size={14} />
                {unavailable ? "Out of stock" : "Add"}
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center justify-between rounded-lg border border-primary-800 bg-primary-50 p-0.5">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(product.productId, cartQuantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-primary-800 hover:bg-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-semibold text-neutral-900">{cartQuantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={atMax}
                    onClick={() => updateQuantity(product.productId, cartQuantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-primary-800 hover:bg-white disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={openCart}
                  className="shrink-0 text-[11px] font-semibold text-primary-800 no-underline hover:text-primary-600"
                >
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
