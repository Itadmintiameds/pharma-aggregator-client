"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getProductList } from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import { ProductListData } from "@/src/types/product/ProductData";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import Delete from "./Delete";

export type StockFilter = "all" | "in" | "low" | "out";
export type CategoryFilter = number | "all";

interface ProductListProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: (id: string) => void;
  refreshKey?: number;
  categoryFilter?: CategoryFilter;
  stockFilter?: StockFilter;
}

export const categoryMap: Record<number, string> = {
  1: "Drugs",
  2: "Supplements/ Nutraceuticals",
  3: "Food & Infant Nutrition",
  4: "Cosmetic & Personal Care",
  5: "Consumable Medical Devices & Equipment",
  6: "Non-Consumable Medical Devices & Equipment",
};

const LOW_STOCK_THRESHOLD = 10;

const getBatchCount = (pricingDetails: any[] = []) => pricingDetails.length;

const getTotalStock = (pricingDetails: any[] = []) =>
  pricingDetails.reduce(
    (sum, batch) => sum + (Number(batch.stockQuantity) || 0),
    0,
  );

const getStockStatus = (totalStock: number): Exclude<StockFilter, "all"> => {
  if (totalStock <= 0) return "out";
  if (totalStock < LOW_STOCK_THRESHOLD) return "low";
  return "in";
};

type SortOption =
  | "nameAsc"
  | "nameDesc"
  | "categoryAsc"
  | "categoryDesc"
  | "batchesAsc"
  | "batchesDesc"
  | "stockAsc"
  | "stockDesc";

const SORT_LABELS: Record<SortOption, string> = {
  nameAsc: "Product Name (A-Z)",
  nameDesc: "Product Name (Z-A)",
  categoryAsc: "Category (A-Z)",
  categoryDesc: "Category (Z-A)",
  batchesAsc: "Batches (Low to High)",
  batchesDesc: "Batches (High to Low)",
  stockAsc: "Total Stock (Low to High)",
  stockDesc: "Total Stock (High to Low)",
};

const sortData = (
  data: ProductListData[],
  sortOption: SortOption | null,
): ProductListData[] => {
  if (!sortOption) return data;

  const sorted = [...data];
  sorted.sort((a, b) => {
    switch (sortOption) {
      case "nameAsc":
        return (a.productName ?? "").localeCompare(b.productName ?? "");
      case "nameDesc":
        return (b.productName ?? "").localeCompare(a.productName ?? "");
      case "categoryAsc":
        return (categoryMap[a.categoryId as number] ?? "").localeCompare(
          categoryMap[b.categoryId as number] ?? "",
        );
      case "categoryDesc":
        return (categoryMap[b.categoryId as number] ?? "").localeCompare(
          categoryMap[a.categoryId as number] ?? "",
        );
      case "batchesAsc":
        return getBatchCount(a.pricingDetails) - getBatchCount(b.pricingDetails);
      case "batchesDesc":
        return getBatchCount(b.pricingDetails) - getBatchCount(a.pricingDetails);
      case "stockAsc":
        return getTotalStock(a.pricingDetails) - getTotalStock(b.pricingDetails);
      case "stockDesc":
        return getTotalStock(b.pricingDetails) - getTotalStock(a.pricingDetails);
      default:
        return 0;
    }
  });
  return sorted;
};

const columns: Column<ProductListData>[] = [
  {
    header: "Thumbnail",
    accessor: (row) => {
      const image = row.productImages?.[0]?.productImage;

      return (
        <img
          src={image || "/icons/Tumbnail.svg"}
          alt="product"
          className="w-10 h-10 rounded-md object-cover"
        />
      );
    },
  },

  {
    header: "Product Names",
    accessor: (row) => (
      <div className="max-w-55 truncate whitespace-nowrap overflow-hidden">
        {row.productName ?? "-"}
      </div>
    ),
  },
  {
    header: "Category",
    accessor: (row) => categoryMap[row.categoryId as number] || "-",
  },
  {
    header: "Batches",
    accessor: (row) => getBatchCount(row.pricingDetails),
  },
  {
    header: "Total Stock",
    accessor: (row) => getTotalStock(row.pricingDetails),
  },
];

const ProductList = ({
  setCurrentView,
  setSelectedProductId,
  refreshKey,
  categoryFilter = "all",
  stockFilter = "all",
}: ProductListProps) => {
  const [data, setData] = useState<ProductListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useClickOutside(sortDropdownRef, () => setShowSortDropdown(false));

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductList();
      setData(response || []);
    } catch (error) {
      console.error("Error fetching Drug Product List:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshKey]);

  const categoryViewMap: Record<number, DashboardView> = {
    1: "editDrug",
    2: "editSupplement",
    3: "editFoodInfant",
    4: "editCosmetic",
    5: "editConsumable",
    6: "editNonConsumable",
  };

  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      !term ||
      item.productName?.toLowerCase().includes(term) ||
      categoryMap[item.categoryId as number]?.toLowerCase().includes(term) ||
      String(getBatchCount(item.pricingDetails)).includes(term) ||
      String(getTotalStock(item.pricingDetails)).includes(term);

    const matchesCategory =
      categoryFilter === "all" || item.categoryId === categoryFilter;

    const matchesStock =
      stockFilter === "all" ||
      getStockStatus(getTotalStock(item.pricingDetails)) === stockFilter;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const sortedData = sortData(filteredData, sortOption);

  return (
    <>
      <div className="flex justify-between gap-10 font-open-sans">
        <div className="relative w-full">
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-pneutral-200 text-p4 text-pneutral-500 font-medium w-full h-12 rounded-lg px-5 pr-14 focus:outline-none focus:ring-0 "
          />

          <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center rounded-r-lg bg-[#E4D6FB]">
            <img src="/icons/SearchIcon.svg" alt="search" className="w-6 h-6" />
          </div>
        </div>

        <div className="relative shrink-0" ref={sortDropdownRef}>
          <button
            type="button"
            onClick={() => setShowSortDropdown((prev) => !prev)}
            className="w-36 h-12 bg-pneutral-50 border border-pneutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2 cursor-pointer"
          >
            Sort By
            <img
              src="/icons/DownArrow.svg"
              alt="sort"
              className={`w-4.5 h-4.5 transition-transform duration-200 ${
                showSortDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showSortDropdown && (
            <div className="absolute right-0 top-14 z-20 w-56 bg-white border border-pneutral-200 rounded-lg shadow-lg py-2">
              {sortOption && (
                <button
                  type="button"
                  onClick={() => {
                    setSortOption(null);
                    setShowSortDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-p4 font-semibold text-primary-900 hover:bg-neutral-100 cursor-pointer"
                >
                  Clear sort
                </button>
              )}
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSortOption(key);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-p4 hover:bg-neutral-100 cursor-pointer ${
                    sortOption === key
                      ? "font-semibold text-primary-900"
                      : "text-neutral-900"
                  }`}
                >
                  {SORT_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <Table<ProductListData>
          columns={columns}
          data={sortedData}
          loading={loading}
          actions={(row) => (
            <div className="flex items-center gap-3">
              <img
                src="/icons/EditIcon.svg"
                alt="edit"
                className="w-6 h-6 rounded-md object-cover cursor-pointer"
                onClick={() => {
                  const categoryViewMap: Record<number, string> = {
                    1: "editDrug",
                    2: "editSupplement",
                    3: "editFoodInfant",
                    4: "editCosmetic",
                    5: "editConsumable",
                    6: "editNonConsumable",
                  };
                  const category = categoryViewMap[row.categoryId as number];
                  if (!category || !row.productId) return;
                  router.push(
                    `/seller_7a3b9f2c/products/edit/${row.productId}?category=${category}`,
                  );
                }}
              />
              <img
                src="/icons/ViewIcon.svg"
                className="w-6 h-6 cursor-pointer"
                onClick={() => {
                  if (!row.productId) return;
                  router.push(
                    `/seller_7a3b9f2c/products/view/${row.productId}`,
                  );
                }}
              />
              <img
                src="/icons/DeleteIcon.svg"
                alt="delete"
                className="w-6 h-6 rounded-md object-cover cursor-pointer"
                onClick={() => {
                  setSelectedProductIdLocal(row.productId);
                  setOpenDeleteModal(true);
                }}
              />
            </div>
          )}
        />
      </div>
      {openDeleteModal && selectedProductIdLocal && (
        <Delete
          isOpen={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          productId={selectedProductIdLocal}
          onConfirm={async () => {
            await fetchProducts();
            setOpenDeleteModal(false);
          }}
        />
      )}
    </>
  );
};

export default ProductList;
