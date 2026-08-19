"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { CartItem } from "@/src/types/buyer/cart";
import { BuyerProduct } from "@/src/types/buyer/product";

const CART_STORAGE_KEY = "buyerCart";

interface CartContextValue {
  items: CartItem[];
  addItem: (product: BuyerProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePricing: (productId: string, pricingId: string, mrp?: number, sellingPrice?: number) => void;
  backfillFromProduct: (product: BuyerProduct) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // The batch's own packaging record carries the seller-set order limits —
  // matched by packagingId rather than just taking packagingDetails[0], so
  // this lines up with whichever batch `pricing` actually came from.
  const resolveOrderLimits = (product: BuyerProduct) => {
    const pricing = product.pricingDetails?.[0];
    const packaging = product.packagingDetails?.find(
      (pkg) => pkg.packagingId != null && pkg.packagingId === pricing?.packagingId
    );
    return {
      pricing,
      minQuantity: packaging?.minimumOrderQuantity ?? 1,
      maxQuantity: packaging?.maximumOrderQuantity ?? pricing?.stockQuantity,
    };
  };

  const addItem = (product: BuyerProduct, quantity: number = 1) => {
    const { pricing, minQuantity, maxQuantity } = resolveOrderLimits(product);
    const clamp = (value: number) => {
      let next = Math.max(value, minQuantity);
      if (maxQuantity != null) next = Math.min(next, maxQuantity);
      return next;
    };

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: clamp(item.quantity + quantity) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          pricingId: pricing?.pricingId,
          productName: product.productName,
          image: product.productImages?.[0]?.productImage,
          sellerName: product.sellerName,
          mrp: pricing?.mrp,
          sellingPrice: pricing?.sellingPrice,
          quantity: clamp(quantity),
          minQuantity,
          maxQuantity,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // quantity <= 0 removes the line — relied on by the product-card mini
  // stepper's decrement button (0 = "take it out of the cart"). Callers that
  // must never remove on a sub-minimum value (the cart page's editable
  // quantity input) are responsible for clamping to minQuantity themselves
  // before calling this, rather than this function silently upgrading a
  // deliberate "remove" signal into a clamp.
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        let next = Math.max(quantity, item.minQuantity ?? 1);
        if (item.maxQuantity != null) next = Math.min(next, item.maxQuantity);
        return { ...item, quantity: next };
      })
    );
  };

  // Backfills pricingId (and optionally refreshed mrp/sellingPrice) on an
  // existing cart line — needed for carts persisted in localStorage from
  // before pricingId was captured on add-to-cart, and doubles as a general
  // "re-resolve against current product data" hook at checkout time.
  const updatePricing = (productId: string, pricingId: string, mrp?: number, sellingPrice?: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              pricingId,
              mrp: mrp ?? item.mrp,
              sellingPrice: sellingPrice ?? item.sellingPrice,
            }
          : item
      )
    );
  };

  // Re-syncs a cart line's sellerName/minQuantity/maxQuantity against
  // whatever the product's current data actually is. These always get
  // overwritten (not just filled in when missing) because minQuantity and
  // maxQuantity fall back to a computed default (1 / stock quantity) the
  // moment a line is added, so they're never actually null — a "only patch
  // if missing" guard would never re-run once a seller adds real packaging
  // limits after the item was already in someone's cart. The buyer's chosen
  // quantity itself is left alone except to reclamp it if it's now outside
  // the freshly-resolved bounds.
  const backfillFromProduct = (product: BuyerProduct) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== product.productId) return item;

        const { minQuantity, maxQuantity } = resolveOrderLimits(product);
        let quantity = item.quantity;
        if (quantity < minQuantity) quantity = minQuantity;
        if (maxQuantity != null && quantity > maxQuantity) quantity = maxQuantity;

        return {
          ...item,
          sellerName: product.sellerName ?? item.sellerName,
          minQuantity,
          maxQuantity,
          quantity,
        };
      })
    );
  };

  const clearCart = () => setItems([]);

  // Number of distinct products in the cart (its only consumer is the header
  // badge) — not the sum of quantities, since with B2B order quantities
  // running into the hundreds, "120" for one product read as a bug rather
  // than "1 product, 120 units."
  const totalItems = items.length;
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.sellingPrice ?? item.mrp ?? 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updatePricing, backfillFromProduct, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
