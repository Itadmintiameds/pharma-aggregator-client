"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import BuyerDashboardHeader from "./BuyerDashboardHeader";
import ProductListing from "./ProductListing";

export default function BuyerDashboard() {
  const router = useRouter();
  const [email] = useState<string | null>(() =>
    typeof window !== "undefined" ? buyerAuthService.getCurrentUser()?.username ?? null : null
  );

  useEffect(() => {
    if (!buyerAuthService.isAuthenticated()) {
      router.replace("/buyer_e8d45a1b/login");
    }
  }, [router]);

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <BuyerDashboardHeader email={email} />
      <div className="pt-24 px-4 pb-16 max-w-7xl mx-auto">
        <ProductListing />
      </div>
    </div>
  );
}
