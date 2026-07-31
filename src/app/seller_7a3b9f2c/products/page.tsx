"use client";

import Products from "../dashboard/components/Products";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardView } from "@/src/types/seller/dashboard";
import ProductList, {
  categoryMap,
  CategoryFilter,
  StockFilter,
  StatusFilter,
} from "../dashboard/components/ProductList";
import { OnboardingModal } from "../dashboard/components/DashboardFilters";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { useClickOutside } from "@/src/hooks/useClickOutside";

const STOCK_LABELS: Record<StockFilter, string> = {
  all: "All Stocks",
  in: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All Status",
  draft: "Draft",
  published: "Published",
};

interface ProductsProps {
  setCurrentView: (view: DashboardView) => void;
  // setSelectedProductId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ProductsPage({ setCurrentView }: ProductsProps) {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [allowedCategoryIds, setAllowedCategoryIds] = useState<number[]>([]);
  const stockDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(stockDropdownRef, () => setShowStockDropdown(false));
  useClickOutside(categoryDropdownRef, () => setShowCategoryDropdown(false));
  useClickOutside(statusDropdownRef, () => setShowStatusDropdown(false));

  useEffect(() => {
    const fetchSellerCategories = async () => {
      try {
        const profile = await sellerProfileService.getCurrentSellerProfile();
        setAllowedCategoryIds(
          profile.productTypes.map((pt) => pt.productTypeId),
        );
      } catch (error) {
        console.error("Error fetching seller product categories:", error);
        setAllowedCategoryIds([]);
      }
    };
    fetchSellerCategories();
  }, []);

  const availableCategoryEntries = Object.entries(categoryMap).filter(
    ([id]) => allowedCategoryIds.includes(Number(id)),
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
      <div className="flex items-center gap-6 font-open-sans">
        <div className="relative shrink-0" ref={stockDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowStockDropdown((prev) => !prev);
              setShowCategoryDropdown(false);
              setShowStatusDropdown(false);
            }}
            className="w-44.5 h-12 bg-neutral-50 border border-pneutral-200 rounded-lg text-lable-l2 font-semibold text-pneutral-900 flex items-center justify-between px-4 gap-2 cursor-pointer"
          >
            <span className="truncate">{STOCK_LABELS[stockFilter]}</span>
            <img
              src="/icons/DownArrow.svg"
              alt="filter"
              className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${
                showStockDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showStockDropdown && (
            <div className="absolute left-0 top-14 z-20 w-44.5 bg-neutral-50 rounded-lg shadow-md py-2">
              {(Object.keys(STOCK_LABELS) as StockFilter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setStockFilter(key);
                    setShowStockDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-lable-l2 hover:bg-neutral-100 cursor-pointer ${
                    stockFilter === key
                      ? "font-semibold text-primary-900"
                      : "text-pneutral-900"
                  }`}
                >
                  {STOCK_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative shrink-0" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowStatusDropdown((prev) => !prev);
              setShowStockDropdown(false);
              setShowCategoryDropdown(false);
            }}
            className="w-44.5 h-12 bg-neutral-50 border border-pneutral-200 rounded-lg text-lable-l2 font-semibold text-pneutral-900 flex items-center justify-between px-4 gap-2 cursor-pointer"
          >
            <span className="truncate">{STATUS_LABELS[statusFilter]}</span>
            <img
              src="/icons/DownArrow.svg"
              alt="filter"
              className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${
                showStatusDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showStatusDropdown && (
            <div className="absolute left-0 top-14 z-20 w-44.5 bg-neutral-50 rounded-lg shadow-md py-2">
              {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(key);
                    setShowStatusDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-lable-l2 hover:bg-neutral-100 cursor-pointer ${
                    statusFilter === key
                      ? "font-semibold text-primary-900"
                      : "text-pneutral-900"
                  }`}
                >
                  {STATUS_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative shrink-0" ref={categoryDropdownRef}>
          <button
            type="button"
            title={
              categoryFilter === "all" ? "All Categories" : categoryMap[categoryFilter]
            }
            onClick={() => {
              setShowCategoryDropdown((prev) => !prev);
              setShowStockDropdown(false);
              setShowStatusDropdown(false);
            }}
            className="w-72 h-12 bg-neutral-50 border border-pneutral-200 rounded-lg text-lable-l2 font-semibold text-pneutral-900 flex items-center justify-between px-4 gap-2 cursor-pointer"
          >
            <span className="truncate">
              {categoryFilter === "all" ? "All Categories" : categoryMap[categoryFilter]}
            </span>
            <img
              src="/icons/DownArrow.svg"
              alt="filter"
              className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${
                showCategoryDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showCategoryDropdown && (
            <div className="absolute left-0 top-14 z-20 w-72 bg-neutral-50 rounded-lg shadow-md py-2 max-h-72 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("all");
                  setShowCategoryDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 text-lable-l2 hover:bg-neutral-100 cursor-pointer ${
                  categoryFilter === "all"
                    ? "font-semibold text-primary-900"
                    : "text-pneutral-900"
                }`}
              >
                All Categories
              </button>
              {availableCategoryEntries.map(([id, name]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(Number(id));
                    setShowCategoryDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-lable-l2 hover:bg-neutral-100 cursor-pointer ${
                    categoryFilter === Number(id)
                      ? "font-semibold text-primary-900"
                      : "text-pneutral-900"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-50 h-12 shrink-0 bg-primary-900 rounded-lg text-white text-lable-l2 font-medium cursor-pointer flex items-center justify-center gap-3"
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
          categoryFilter={categoryFilter}
          stockFilter={stockFilter}
          statusFilter={statusFilter}
        />
      </div>

      {showAddModal && (
        <OnboardingModal
          onClose={() => setShowAddModal(false)}
          onManualEntry={() => {
            setShowAddModal(false);
            router.push("/seller_7a3b9f2c/products/add");
          }}
        />
      )}
    </>
  );
}
