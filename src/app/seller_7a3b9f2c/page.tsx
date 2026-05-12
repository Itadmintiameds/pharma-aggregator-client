"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/seller_7a3b9f2c/dashboard");
  }, [router]);
  
  return null;
}