"use client";
import { resolveProductAvailability } from "@/src/utils/cartAvailability";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/src/context/CartContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";
import { BuyerProduct } from "@/src/types/buyer/product";
import { rememberSearchContext, SearchContext, trackSearchEvent } from "@/src/services/buyer/searchEvents";

/** At or below this many units an in-stock product is flagged as running low. */
const LOW_STOCK_UNITS = 20;

interface ProductCardProps {
  product: BuyerProduct;
  /** Set when the card is shown in a search/browse result list: which search showed it and at what rank. */
  searchContext?: SearchContext;
}

/** Placeholder with the same shape as a card, shown while a list of products loads. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" aria-hidden>
      <div className="h-52 animate-pulse bg-gray-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * A product in the storefront lists (home page and search). The price, stock and the buy actions are all visible at
 * once - nothing hides behind a hover, so it works on touch screens too - and every card has the same height so a row
 * stays tidy. A visitor who is not logged in sees the price blurred and is asked to sign up when they try to buy.
 */
export default function ProductCard({ product, searchContext }: ProductCardProps) {
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const router = useRouter();
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
    router.push("/cart");
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={href} onClick={trackClick} className="relative block bg-gray-50">
        <div className="flex h-52 items-center justify-center p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || "/icons/Tumbnail.svg"}
            alt={product.productName}
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
          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">
            {discount}% off
          </span>
        )}
        {unavailable && (
          <span className="absolute left-3 top-3 rounded-full bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white">
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
          <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-400">{product.manufacturerName}</p>
        )}
        <h3 className="line-clamp-2 min-h-[2.9rem] text-base font-semibold leading-snug text-gray-900">
          <Link href={href} onClick={trackClick} className="hover:text-primary-700">
            {product.productName}
          </Link>
        </h3>
        {product.productDescription && <p className="line-clamp-2 text-sm text-gray-500">{product.productDescription}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {product.sellerName && (
            <span className="truncate">
              Sold by <span className="font-medium text-gray-700">{product.sellerName}</span>
            </span>
          )}
          {minQuantity > 1 && <span>Min. order {minQuantity}</span>}
        </div>

        <div className="mt-auto pt-3">
          {sellingPrice != null ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              {!isBuyerLoggedIn && <span className="text-sm font-medium text-gray-700">MRP:</span>}
              <div
                className={`flex items-baseline gap-2 ${isBuyerLoggedIn ? "" : "pointer-events-none select-none blur-[5px]"}`}
                title={isBuyerLoggedIn ? undefined : "Login to view price"}
              >
                <span className="text-xl font-bold text-gray-900">₹{sellingPrice}</span>
                {mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice && (
                  <span className="text-sm text-gray-400 line-through">₹{mrp}</span>
                )}
                <span className="text-xs text-gray-400">/ unit</span>
              </div>
              {!isBuyerLoggedIn && (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
                >
                  <Lock size={12} /> Log in to see price
                </button>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500">Price on request</span>
          )}

          <div className="mt-3">
            {cartQuantity === 0 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={unavailable}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-800 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                >
                  <ShoppingCart size={16} />
                  {unavailable ? "Out of stock" : "Add to cart"}
                </button>
                {!unavailable && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="rounded-xl border border-primary-800 px-3 py-2.5 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50"
                  >
                    Buy now
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(product.productId, cartQuantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-800 hover:bg-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-900">{cartQuantity}</span>
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
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="rounded-xl border border-primary-800 px-4 py-2.5 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50"
                >
                  Buy now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
