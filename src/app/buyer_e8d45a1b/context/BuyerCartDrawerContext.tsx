"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";

interface BuyerCartDrawerValue {
  isOpen: boolean;
  /** The accepted quote being turned into an order, or null when the drawer shows the cart. */
  quote: QuoteRequest | null;
  /** Opens the in-dashboard cart (cart -> delivery -> order placed) instead of sending the buyer to /cart. */
  openCart: () => void;
  /** Opens the same drawer to place an order from an accepted quote (quote -> delivery -> order placed). */
  openQuoteOrder: (quote: QuoteRequest) => void;
  closeCart: () => void;
}

// Outside a provider (a card shown somewhere else) opening the cart is a harmless no-op rather than a crash.
const BuyerCartDrawerContext = createContext<BuyerCartDrawerValue>({
  isOpen: false,
  quote: null,
  openCart: () => {},
  openQuoteOrder: () => {},
  closeCart: () => {},
});

export function BuyerCartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const openCart = useCallback(() => {
    setQuote(null);
    setIsOpen(true);
  }, []);
  const openQuoteOrder = useCallback((next: QuoteRequest) => {
    setQuote(next);
    setIsOpen(true);
  }, []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const value = useMemo(
    () => ({ isOpen, quote, openCart, openQuoteOrder, closeCart }),
    [isOpen, quote, openCart, openQuoteOrder, closeCart]
  );
  return <BuyerCartDrawerContext.Provider value={value}>{children}</BuyerCartDrawerContext.Provider>;
}

export function useBuyerCartDrawer() {
  return useContext(BuyerCartDrawerContext);
}
