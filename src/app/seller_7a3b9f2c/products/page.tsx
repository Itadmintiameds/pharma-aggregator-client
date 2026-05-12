"use client";

import Products from "../dashboard/components/Products";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardView } from "@/src/types/seller/dashboard";

export default function ProductsPage() {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleSetCurrentView = (view: DashboardView) => {
    if (view === "addProduct") {
      router.push("/seller_7a3b9f2c/products/add");
    } else if (view === "productView") {
      router.push(`/seller_7a3b9f2c/products/view/${selectedProductId}`);
    } else if (view === "editDrug" || view === "editConsumable" || view === "editNonConsumable") {
      router.push(`/seller_7a3b9f2c/products/edit/${selectedProductId}?category=${view}`);
    }
  };

  return (
    <Products
      setCurrentView={handleSetCurrentView}
      setSelectedProductId={setSelectedProductId}
    />
  );
}