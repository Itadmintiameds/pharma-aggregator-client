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


export default function BuyerLoginModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

 
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
