"use client";

import Products from "../dashboard/components/Products";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardView } from "@/src/types/seller/dashboard";
import ProductList from "../dashboard/components/ProductList";

interface ProductsProps {
  setCurrentView: (view: DashboardView) => void;
  // setSelectedProductId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ProductsPage({ setCurrentView }: ProductsProps) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const handleSetCurrentView = (view: DashboardView) => {
    if (view === "addProduct") {
      router.push("/seller_7a3b9f2c/products/add");
    } else if (view === "productView") {
      router.push(`/seller_7a3b9f2c/products/view/${selectedProductId}`);
    } else if (
      view === "editDrug" ||
      view === "editConsumable" ||
      view === "editNonConsumable" ||
      view === "editSupplement" ||
      view === "editFoodInfant" ||
      view === "editCosmetic"
    ) {
      router.push(
        `/seller_7a3b9f2c/products/edit/${selectedProductId}?category=${view}`,
      );
    }
  };

  return (
    <>
      <div className="mt-7 flex gap-6">
        <button className="w-44.5 h-12 bg-neutral-50 rounded-lg text-lable-l2 font-semibold text-pneutral-900 flex items-center justify-between px-4 gap-2 shadow-md">
          All Stocks
          <img
            src="/icons/DownArrow.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
        </button>

        <button className="w-44.5 h-12 bg-neutral-50 rounded-lg text-lable-l2 font-semibold text-pneutral-900 flex items-center justify-between px-4 gap-2 shadow-md">
          All Categories
          <img
            src="/icons/DownArrow.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
        </button>

        <button
          onClick={() => setCurrentView("addProduct" as DashboardView)}
          className="w-44.5 h-12 bg-primary-900 rounded-lg text-white text-lable-l2 font-medium cursor-pointer flex items-center justify-center gap-3"
        >
          <img
            src="/icons/PlusIconWhite.svg"
            alt="drug"
            className="w-5 h-5"
          />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="mt-5 space-y-2">
        <ProductList
          setCurrentView={setCurrentView}
          setSelectedProductId={setSelectedProductId}
        />
      </div>
    </>
  );
}
