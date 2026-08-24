"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

interface BuyerLoginModalContextValue {
  isOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isSignupOpen: boolean;
  openSignupModal: () => void;
  closeSignupModal: () => void;
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
  const [isSignupOpen, setIsSignupOpen] = useState(false);


  useEffect(() => {
    if (pathname === "/buyer_e8d45a1b/login") {
      setIsOpen(true);
    }
  }, [pathname]);

  const openLoginModal = useCallback(() => {
    setIsSignupOpen(false);
    setIsOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsOpen(false);
    if (pathname === "/buyer_e8d45a1b/login") {
      router.push("/");
    }
  }, [pathname, router]);

  const openSignupModal = useCallback(() => {
    setIsOpen(false);
    setIsSignupOpen(true);
  }, []);

  const closeSignupModal = useCallback(() => setIsSignupOpen(false), []);

  return (
    <BuyerLoginModalContext.Provider
      value={{
        isOpen,
        openLoginModal,
        closeLoginModal,
        isSignupOpen,
        openSignupModal,
        closeSignupModal,
      }}
    >
      {children}
    </BuyerLoginModalContext.Provider>
  );
}
