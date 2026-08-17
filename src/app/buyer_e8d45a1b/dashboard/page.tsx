"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import BuyerAuthHeader from "../components/BuyerAuthHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import BuyerOnboardingGate from "./components/BuyerOnboardingGate";

// New buyer dashboard shell entry point (distinct from the legacy
// src/app/buyer_e8d45a1b/components/BuyerDashboard.tsx, which still just
// redirects "/" and is left untouched). Guards guests here directly since
// buyer_e8d45a1b/layout.tsx is a trivial passthrough with no auth check.
export default function BuyerDashboardPage() {
  const router = useRouter();
  const { tempBuyer } = useBuyerOnboardingStatus();
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
        router.replace("/buyer_e8d45a1b/login");
      }
    });
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <>
      <BuyerAuthHeader />

      <div className="min-h-screen pt-24 pb-16 px-4">
        <BuyerOnboardingGate>
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h1 className="text-h5 font-heading font-semibold text-pneutral-900 mb-1">
                {tempBuyer?.organizationName ?? "Welcome"}
              </h1>
              <p className="text-p3 font-body text-pneutral-600">
                Your buyer account is approved and ready to order.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/orders"
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <p className="text-h6 font-heading font-semibold text-pneutral-900 mb-1">My Orders</p>
                <p className="text-p4 font-body text-pneutral-500">
                  View your order history and track deliveries.
                </p>
              </Link>
              <Link href="/cart" className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <p className="text-h6 font-heading font-semibold text-pneutral-900 mb-1">My Cart</p>
                <p className="text-p4 font-body text-pneutral-500">
                  Review items you&apos;ve added and check out.
                </p>
              </Link>
              <Link href="/" className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow sm:col-span-2">
                <p className="text-h6 font-heading font-semibold text-pneutral-900 mb-1">Browse Products</p>
                <p className="text-p4 font-body text-pneutral-500">
                  Explore products across sellers on the marketplace.
                </p>
              </Link>
            </div>
          </div>
        </BuyerOnboardingGate>
      </div>

      <Footer />
    </>
  );
}
