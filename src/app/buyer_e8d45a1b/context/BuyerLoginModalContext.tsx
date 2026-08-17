"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

interface BuyerLoginModalContextValue {
  isOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const BuyerLoginModalContext = createContext<BuyerLoginModalContextValue | null>(null);

export function useBuyerLoginModal() {
  const ctx = useContext(BuyerLoginModalContext);
  if (!ctx) {
    throw new Error("useBuyerLoginModal must be used within BuyerLoginModalProvider");
  }
  return ctx;
}

// Hosts the buyer login popup at the layout level so it overlays whatever
// buyer route is currently mounted (dashboard, signup, onboarding gate) with
// that page still visible/blurred behind it, instead of navigating to a
// dedicated full-page route.
export default function BuyerLoginModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Hard navigations that land directly on /buyer_e8d45a1b/login (bookmark,
  // external link, the axios interceptor's window.location.href redirect on
  // session expiry) have nothing mounted behind them yet — open the popup
  // over that route's own (blank) page instead of leaving a bare screen.
  useEffect(() => {
    if (pathname === "/buyer_e8d45a1b/login") {
      setIsOpen(true);
    }
  }, [pathname]);

  const openLoginModal = useCallback(() => setIsOpen(true), []);

  const closeLoginModal = useCallback(() => {
    setIsOpen(false);
    if (pathname === "/buyer_e8d45a1b/login") {
      router.push("/");
    }
  }, [pathname, router]);

  return (
    <BuyerLoginModalContext.Provider value={{ isOpen, openLoginModal, closeLoginModal }}>
      {children}
    </BuyerLoginModalContext.Provider>
  );
}
