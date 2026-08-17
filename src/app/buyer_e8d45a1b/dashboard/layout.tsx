"use client";

import { useEffect, useState } from "react";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "../context/BuyerLoginModalContext";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import BuyerSidebar from "./components/BuyerSidebar";
import BuyerHeader from "./components/BuyerHeader";
import BuyerOnboardingGate from "./components/BuyerOnboardingGate";

// Dashboard shell shared by every /buyer_e8d45a1b/dashboard/* route (Overview,
// Profile, Catalog, Orders, ...): auth guard + sidebar + header + the
// onboarding gate, mirroring seller_7a3b9f2c/layout.tsx's protected-route
// shell. Individual page.tsx files under here only render their own content.
export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { openLoginModal } = useBuyerLoginModal();
  const { status, tempBuyer } = useBuyerOnboardingStatus();
  // Starts as null (neither true nor false) so server render and the
  // client's pre-hydration first paint agree on "unknown" — reading
  // localStorage inside a useState initializer runs during that first
  // paint too (not just "on mount"), and localStorage doesn't exist on the
  // server, so seeding this synchronously caused a server/client mismatch
  // (server always saw "unauthenticated", client's first paint already saw
  // the real value). The real check only happens inside useEffect, which is
  // client-only by definition, so it can never disagree with the server.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Microtask hop to avoid a same-tick setState-in-effect call, matching
    // the identical pattern in useBuyerOnboardingStatus.ts/BuyerOnboardingGate.tsx.
    queueMicrotask(() => {
      const authenticated = buyerAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (!authenticated) {
        openLoginModal();
      }
    });
  }, [openLoginModal]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-secondary-50">
      <BuyerSidebar approved={status === "approved"} />
      <BuyerHeader tempBuyer={tempBuyer} />

      <main className="ml-64 p-6" style={{ marginTop: 74 }}>
        <BuyerOnboardingGate>{children}</BuyerOnboardingGate>
      </main>
    </div>
  );
}
