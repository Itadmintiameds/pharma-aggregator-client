"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The buyer product listing/detail/cart experience now lives on the real
// landing page ("/") instead of this standalone dashboard — redirect anyone
// who still lands on this URL directly.
export default function BuyerDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
