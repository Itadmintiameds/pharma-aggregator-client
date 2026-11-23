"use client";
import { resolveProductAvailability } from "@/src/utils/cartAvailability";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/src/context/CartContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerCartDrawer } from "@/src/app/buyer_e8d45a1b/context/BuyerCartDrawerContext";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";
import { BuyerProduct } from "@/src/types/buyer/product";
import { rememberSearchContext, SearchContext, trackSearchEvent } from "@/src/services/buyer/searchEvents";

/** At or below this many units an in-stock product is flagged as running low. */
const LOW_STOCK_UNITS = 20;

interface ProductCardProps {
  product: BuyerProduct;
  /** Set when the card is shown in a search/browse result list: which search showed it and at what rank. */
  searchContext?: SearchContext;
  /** Dense marketplace card for the home page rows/grid: small image, one-line meta, a single Add button. */
  compact?: boolean;
}

/** Placeholder with the same shape as a card, shown while a list of products loads. */
export function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-hidden>
      <div className={`animate-pulse bg-gray-100 ${compact ? "h-28" : "h-52"}`} />
      <div className={`space-y-2.5 ${compact ? "p-2.5" : "p-4"}`}>
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
        {!compact && <div className="h-3 w-full animate-pulse rounded bg-gray-100" />}
        <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * A product in the storefront lists (home page and search). The price, stock and the buy actions are all visible at
 * once - nothing hides behind a hover, so it works on touch screens too - and every card has the same height so a row
 * stays tidy. A visitor who is not logged in sees the price blurred and is asked to sign up when they try to buy.
 */
export default function ProductCard({ product, searchContext, compact = false }: ProductCardProps) {
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const { openCart } = useBuyerCartDrawer();
  const { openSignupModal, openLoginModal } = useBuyerLoginModal();
  const [isBuyerLoggedIn, setIsBuyerLoggedIn] = useState(() => buyerAuthService.isAuthenticated());
  const { pricing, minQuantity, maxQuantity, unavailable } = resolveProductAvailability(product);
  const image = product.productImages?.[0]?.productImage;
  const cartQuantity = cartItems.find((item) => item.productId === product.productId)?.quantity ?? 0;

  const sellingPrice = pricing?.sellingPrice ?? pricing?.mrp;
  const mrp = pricing?.mrp;
  const discount =
    mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice
      ? Math.round(((mrp - pricing.sellingPrice) / mrp) * 100)
      : null;
  const lowStock = !unavailable && maxQuantity != null && maxQuantity <= LOW_STOCK_UNITS;
  const atMax = maxQuantity != null && cartQuantity >= maxQuantity;
  const href = `/product/${product.productId}`;

  useEffect(() => {
    const syncBuyerAuth = () => setIsBuyerLoggedIn(buyerAuthService.isAuthenticated());
    window.addEventListener("buyer-auth-changed", syncBuyerAuth);
    return () => window.removeEventListener("buyer-auth-changed", syncBuyerAuth);
  }, []);

  // Analytics: the buyer opened the product / put it in the cart from a search result. Remembering the context lets
  // a quote request or order made a few pages later still be tied to the search that found the product.
  const trackClick = () => {
    if (!searchContext) return;
    rememberSearchContext(product.productId, searchContext);
    trackSearchEvent("SEARCH_CLICK", product.productId, searchContext);
  };
  const trackAddedToCart = () => {
    if (!searchContext || unavailable) return;
    rememberSearchContext(product.productId, searchContext);
    trackSearchEvent("ADD_TO_CART", product.productId, searchContext);
  };

  const handleAddToCart = () => {
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
    addItem(product, 1);
    trackAddedToCart();
    openCart();
  };

  const handleBuyNow = () => {
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
    if (cartQuantity === 0) {
      addItem(product, 1);
      trackAddedToCart();
    }
    openCart();
  };

  // Compact vs. regular sizing, in one place.
  const imageBox = compact ? "h-28 p-2" : "h-52 p-5";
  const body = compact ? "gap-0.5 p-2.5" : "gap-1 p-4";
  const titleCls = compact
    ? "line-clamp-2 min-h-[2.1rem] text-xs font-semibold leading-tight text-gray-900"
    : "line-clamp-2 min-h-[2.9rem] text-base font-semibold leading-snug text-gray-900";
  const priceCls = compact ? "text-sm font-bold text-gray-900" : "text-xl font-bold text-gray-900";
  const btn = compact ? "rounded-md px-2 py-1.5 text-xs" : "rounded-xl px-3 py-2.5 text-sm";
  const badge = compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-xs";

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-md ${
        compact ? "rounded-xl" : "rounded-2xl hover:-translate-y-1"
      }`}
    >
      <Link href={href} onClick={trackClick} className="relative block border-b border-gray-100 bg-white">
        <div className={`flex items-center justify-center ${imageBox}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || "/icons/Tumbnail.svg"}
            alt={product.productName}
            loading="lazy"
            className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 ${
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
        {discount !== null && !unavailable && isBuyerLoggedIn && (
          <span className={`absolute left-2 top-2 rounded-md bg-green-600 font-semibold text-white ${badge}`}>
            {discount}% off
          </span>
        )}
        {unavailable && (
          <span className={`absolute left-2 top-2 rounded-md bg-gray-800 font-semibold text-white ${badge}`}>Out of stock</span>
        )}
        {lowStock && (
          <span className={`absolute right-2 top-2 rounded-md bg-amber-100 font-semibold text-amber-800 ${badge}`}>
            Only {maxQuantity} left
          </span>
        )}
      </Link>

      <div className={`flex flex-1 flex-col ${body}`}>
        {product.manufacturerName && (
          <p className={`truncate font-medium uppercase tracking-wide text-gray-400 ${compact ? "text-[9px]" : "text-[11px]"}`}>
            {product.manufacturerName}
          </p>
        )}
        <h3 className={titleCls}>
          <Link href={href} onClick={trackClick} className="hover:text-primary-700">
            {product.productName}
          </Link>
        </h3>
        {!compact && product.productDescription && (
          <p className="line-clamp-2 text-sm text-gray-500">{product.productDescription}</p>
        )}
        <p className={`mt-0.5 flex items-center gap-x-1.5 truncate text-gray-500 ${compact ? "text-[10px]" : "text-[11px]"}`}>
          {product.sellerName && <span className="truncate">By {product.sellerName}</span>}
          {minQuantity > 1 && <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">Min {minQuantity}</span>}
        </p>

        <div className="mt-auto pt-2">
          {sellingPrice != null ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <div
                className={`flex items-baseline gap-1.5 ${isBuyerLoggedIn ? "" : "pointer-events-none select-none blur-[5px]"}`}
                title={isBuyerLoggedIn ? undefined : "Login to view price"}
              >
                <span className={priceCls}>₹{sellingPrice}</span>
                {mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice && (
                  <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
                )}
                <span className="text-[11px] text-gray-400">/ unit</span>
              </div>
              {!isBuyerLoggedIn && (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:underline"
                >
                  <Lock size={11} /> Log in for price
                </button>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500">Price on request</span>
          )}

          <div className={compact ? "mt-2" : "mt-2.5"}>
            {cartQuantity === 0 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={unavailable}
                  className={`flex flex-1 items-center justify-center gap-1.5 border border-primary-800 bg-white font-semibold text-primary-800 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 ${btn}`}
                >
                  <ShoppingCart size={compact ? 14 : 16} />
                  {unavailable ? "Out of stock" : "Add"}
                </button>
                {!compact && !unavailable && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className={`border border-primary-800 font-semibold text-primary-800 transition-colors hover:bg-primary-50 ${btn}`}
                  >
                    Buy now
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`flex flex-1 items-center justify-between rounded-lg border border-primary-800 bg-primary-50 ${
                    compact ? "p-0.5" : "p-1"
                  }`}
                >
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(product.productId, cartQuantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-primary-800 hover:bg-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">{cartQuantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={atMax}
                    onClick={() => updateQuantity(product.productId, cartQuantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-primary-800 hover:bg-white disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {!compact && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className={`border border-primary-800 font-semibold text-primary-800 transition-colors hover:bg-primary-50 ${btn}`}
                  >
                    Buy now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
