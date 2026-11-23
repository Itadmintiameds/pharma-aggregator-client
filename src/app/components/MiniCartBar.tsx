"use client";

import { usePathname } from "next/navigation";
import { ShoppingCart, ChevronUp } from "lucide-react";
import { useCart } from "@/src/context/CartContext";
import { useBuyerCartDrawer } from "@/src/app/buyer_e8d45a1b/context/BuyerCartDrawerContext";
import { formatMoney } from "@/src/utils/dashboardFormat";

// Pages where a floating cart bar would be noise: the dashboard has its own header cart, sellers have no cart, and
// the auth / cart / checkout pages are already about the cart or sign-in.
const HIDDEN_PREFIXES = ["/buyer_e8d45a1b", "/seller_7a3b9f2c", "/login", "/register", "/reset-password", "/cart", "/checkout"];

/**
 * Sticky "View Cart" bar at the bottom of public pages (like the marketplace reference): appears once the cart has
 * something in it, shows the product count and total, and opens the side cart.
 */
export default function MiniCartBar() {
  const { totalItems, totalPrice } = useCart();
  const { isOpen, openCart } = useBuyerCartDrawer();
  const pathname = usePathname() ?? "";

  if (totalItems === 0 || isOpen) return null;
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:justify-end sm:px-6">
      <button
        type="button"
        onClick={openCart}
        aria-label={`View cart, ${totalItems} product${totalItems === 1 ? "" : "s"}, total ${formatMoney(totalPrice)}`}
        className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-4 rounded-2xl bg-primary-900 px-5 py-3 text-white shadow-xl transition-colors hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 sm:w-auto sm:min-w-[20rem]"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <ShoppingCart size={18} aria-hidden="true" />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-primary-900">
              {totalItems}
            </span>
          </span>
          <span className="text-left leading-tight">
            <span className="block text-xs text-white/75">
              {totalItems} product{totalItems === 1 ? "" : "s"}
            </span>
            <span className="block text-sm font-semibold">{formatMoney(totalPrice)}</span>
          </span>
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold">
          View Cart <ChevronUp size={16} aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
