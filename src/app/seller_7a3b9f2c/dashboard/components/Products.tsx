"use client";

import React from "react";
import ProductList from "./ProductList";
import { DashboardView } from "@/src/types/seller/dashboard";

interface ProductsProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: React.Dispatch<React.SetStateAction<string | null>>;
}

const Products = ({ setCurrentView, setSelectedProductId }: ProductsProps) => {
  return (
    <>
      <div className="mt-7 flex gap-6">
        <button className="w-44.5 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-between px-4 gap-2">
          All Stocks
          <img
            src="/icons/DownArrow.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
        </button>

        <button className="w-44.5 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-between px-4 gap-2">
          All Categories
          <img
            src="/icons/DownArrow.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
        </button>

        <button
          onClick={() => setCurrentView("addProduct" as DashboardView)}
          className="w-44.5 h-12 bg-[#4B0082] rounded-lg text-white font-semibold text-label-l2 cursor-pointer flex items-center justify-center gap-3"
        >
          <img
            src="/icons/PlusIcon.svg"
            alt="drug"
            className="w-[12.5px] h-[12.5px]"
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
};

export default Products;
