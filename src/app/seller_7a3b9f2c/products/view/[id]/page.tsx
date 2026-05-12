"use client";

import { useParams, useRouter } from "next/navigation";
import ProductView1 from "../../../dashboard/components/ProductView1";
import { DashboardView } from "@/src/types/seller/dashboard";

export default function ProductViewPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const handleSetCurrentView = (view: DashboardView) => {
    if (view === "editDrug" || view === "editConsumable" || view === "editNonConsumable") {
      router.push(`/seller_7a3b9f2c/products/edit/${productId}?category=${view}`);
    } else {
      router.push("/seller_7a3b9f2c/products");
    }
  };

  return (
    <ProductView1
      productId={productId}
      setCurrentView={handleSetCurrentView}
    />
  );
}