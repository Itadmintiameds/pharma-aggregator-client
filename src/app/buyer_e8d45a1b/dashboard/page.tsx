"use client";

import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import BuyerOverview from "./components/BuyerOverview";

// Overview content — auth guard, sidebar, header, and the onboarding gate all live in ./layout.tsx, shared with
// the other dashboard routes (profile, catalog, orders, ...). Every number comes from the buyer's real orders,
// returns and quotes (see BuyerOverview and utils/buyerDashboardStats.ts); the licence documents come from the
// onboarding data.
export default function BuyerDashboardPage() {
  const { tempBuyer } = useBuyerOnboardingStatus();
  return <BuyerOverview documents={tempBuyer?.documents} />;
}
