"use client";

import { createContext, useContext, useEffect, MutableRefObject } from "react";

// Returns true if it fully handled the back-press itself (the default
// logout-confirmation prompt in seller_7a3b9f2c/layout.tsx should be skipped).
type BackInterceptor = () => boolean;

export const DashboardBackInterceptContext = createContext<MutableRefObject<BackInterceptor | null> | null>(null);

// Lets a component deep inside the protected dashboard subtree take over the
// browser back button (e.g. to step back within its own in-place wizard)
// instead of triggering the layout's logout-confirmation modal. Registers
// while `handler` is non-null, unregisters automatically on unmount or once
// `handler` becomes null again.
export function useDashboardBackInterceptor(handler: BackInterceptor | null) {
  const ref = useContext(DashboardBackInterceptContext);

  useEffect(() => {
    if (!ref) return;
    ref.current = handler;
    return () => {
      if (ref.current === handler) {
        ref.current = null;
      }
    };
  }, [ref, handler]);
}
