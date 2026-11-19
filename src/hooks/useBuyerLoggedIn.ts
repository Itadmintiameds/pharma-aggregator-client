import { useSyncExternalStore } from "react";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

function subscribe(onChange: () => void) {
  window.addEventListener("buyer-auth-changed", onChange);
  window.addEventListener("storage", onChange); // login/logout in another tab
  return () => {
    window.removeEventListener("buyer-auth-changed", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Whether a buyer is logged in, kept in step with login/logout. Server render and first hydration report
 * `false`, so a statically prerendered page never mismatches what a logged-in buyer sees afterwards.
 */
export function useBuyerLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, () => buyerAuthService.isAuthenticated(), () => false);
}
