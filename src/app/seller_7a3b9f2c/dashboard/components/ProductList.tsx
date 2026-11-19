"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getProductList } from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import { PricingData, ProductListData } from "@/src/types/product/ProductData";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import Delete from "./Delete";
import StockUpdateModal from "./StockUpdateModal";
import { editKeyForProduct, editUrlFor } from "@/src/utils/productRouting";

export type StockFilter = "all" | "in" | "low" | "out";
export type CategoryFilter = number | "all";
export type StatusFilter = "all" | "draft" | "published" | "unpublished";

interface ProductListProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: (id: string) => void;
  refreshKey?: number;
  categoryFilter?: CategoryFilter;
  stockFilter?: StockFilter;
  statusFilter?: StatusFilter;
}

export const categoryMap: Record<number, string> = {
  1: "Drugs",
  2: "Supplements/ Nutraceuticals",
  3: "Food & Infant Nutrition",
  4: "Cosmetic & Personal Care",
  5: "Consumable Medical Devices & Equipment",
  6: "Non-Consumable Medical Devices & Equipment",
};

// Row action buttons: square icon buttons (label in the tooltip / aria-label), so the Actions column is the same
// width on every row whether the product is a draft or published.
const actionBtn =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300";

const LOW_STOCK_THRESHOLD = 10;
const PAGE_SIZE = 10;

// pricingDetails can be null (e.g. a saved draft with no batches yet); a default
// parameter only covers undefined, so guard both.
const getBatchCount = (pricingDetails?: any[] | null) => pricingDetails?.length ?? 0;

const getTotalStock = (pricingDetails?: any[] | null) =>
  (pricingDetails ?? []).reduce(
    (sum, batch) => sum + (Number(batch?.stockQuantity) || 0),
    0,
  );

// Units returned damaged (kept out of stockQuantity, so not counted in Total Stock).
const getTotalDamaged = (pricingDetails?: Pick<PricingData, "damagedQuantity">[] | null) =>
  (pricingDetails ?? []).reduce(
    (sum, batch) => sum + (Number(batch?.damagedQuantity) || 0),
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
          className="w-8 h-8 rounded-md object-cover"
          onError={(e) => {
            // stale/unreachable image URL: fall back once to the placeholder
            const img = e.currentTarget;
            img.onerror = null;
            img.src = "/icons/Tumbnail.svg";
          }}
        />
      );
    },
  },

  {
    header: "Product Names",
    accessor: (row) => (
      <div className="max-w-56 truncate font-medium whitespace-nowrap overflow-hidden">
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
  {
    header: "Damaged",
    accessor: (row) => {
      const damaged = getTotalDamaged(row.pricingDetails);
      return damaged > 0 ? <span className="text-red-600 font-semibold">{damaged}</span> : 0;
    },
  },
  {
    header: "Status",
    accessor: (row) => {
      const isDraft = row.status === "DRAFT";
      const isUnpublished = row.status === "UNPUBLISHED";
      return (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            isDraft
              ? "bg-warning-50 text-warning-900"
              : isUnpublished
                ? "bg-neutral-100 text-neutral-700"
                : "bg-success-50 text-success-900"
          }`}
        >
          {isDraft ? "Draft" : isUnpublished ? "Unpublished" : "Published"}
        </span>
      );
    },
  },
];

const ProductList = ({
  setCurrentView,
  setSelectedProductId,
  refreshKey,
  categoryFilter = "all",
  stockFilter = "all",
  statusFilter = "all",
}: ProductListProps) => {
  const [data, setData] = useState<ProductListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<
    string | null
  >(null);
  const [stockUpdateProduct, setStockUpdateProduct] =
    useState<ProductListData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useClickOutside(sortDropdownRef, () => setShowSortDropdown(false));

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductList();
      setData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching Drug Product List:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOption, categoryFilter, stockFilter, statusFilter]);

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

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "draft"
        ? item.status === "DRAFT"
        : statusFilter === "unpublished"
          ? item.status === "UNPUBLISHED"
          : item.status !== "DRAFT" && item.status !== "UNPUBLISHED");

    return matchesSearch && matchesCategory && matchesStock && matchesStatus;
  });

  const sortedData = sortData(filteredData, sortOption);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const paginatedData = sortedData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <>
      <div className="flex items-center gap-2 font-open-sans">
        <div className="relative w-full">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            type="text"
            name="search"
            id="search"
            aria-label="Search products"
            placeholder="Search by name, category, batches or stock"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-pneutral-200 bg-white pl-9 pr-9 text-[13px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 focus:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
            >
              ×
            </button>
          )}
        </div>

        <div className="relative shrink-0" ref={sortDropdownRef}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={showSortDropdown}
            onClick={() => setShowSortDropdown((prev) => !prev)}
            className={`flex h-9 w-36 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 text-[13px] font-semibold text-neutral-900 transition-colors hover:border-primary-800 ${
              showSortDropdown || sortOption ? "border-primary-800" : "border-pneutral-200"
            }`}
          >
            <span className="truncate">{sortOption ? "Sorted" : "Sort By"}</span>
            <ChevronDown size={16} className={`shrink-0 text-neutral-500 transition-transform duration-200 ${showSortDropdown ? "rotate-180" : ""}`} />
          </button>

          {showSortDropdown && (
            <div className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-pneutral-200 bg-white py-1 shadow-lg">
              {sortOption && (
                <button
                  type="button"
                  onClick={() => {
                    setSortOption(null);
                    setShowSortDropdown(false);
                  }}
                  className="w-full cursor-pointer px-3 py-1.5 text-left text-[13px] font-semibold text-primary-900 hover:bg-neutral-100"
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
                  className={`w-full cursor-pointer px-3 py-1.5 text-left text-[13px] hover:bg-neutral-100 ${
                    sortOption === key ? "bg-primary-50 font-semibold text-primary-900" : "text-neutral-900"
                  }`}
                >
                  {SORT_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2">
        <Table<ProductListData>
          columns={columns}
          data={paginatedData}
          loading={loading}
          compact
          onRowClick={(row) => {
            if (!row.productId) return;
            router.push(`/seller_7a3b9f2c/products/view/${row.productId}`);
          }}
          actions={(row) => {
            const isDraft = row.status === "DRAFT";
            return (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!row.productId) return;
                    // Unknown/missing category: open the view page, which infers it from the attributes.
                    const key = editKeyForProduct(row);
                    router.push(
                      key
                        ? editUrlFor(row.productId, key)
                        : `/seller_7a3b9f2c/products/view/${row.productId}`,
                    );
                  }}
                  aria-label={`${isDraft ? "Edit / Submit" : "Edit"} ${row.productName ?? "product"}`}
                  title={isDraft ? "Edit / Submit draft" : "Edit product"}
                  className={`${actionBtn} cursor-pointer ${
                    isDraft
                      ? "border-primary-900 bg-primary-900 text-white hover:bg-primary-800"
                      : "border-primary-900 text-primary-900 hover:bg-primary-50"
                  }`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  disabled={isDraft}
                  aria-label={`Update stock for ${row.productName ?? "product"}`}
                  title={isDraft ? "Submit the draft before updating stock" : "Update stock"}
                  onClick={() => setStockUpdateProduct(row)}
                  className={`${actionBtn} ${
                    isDraft
                      ? "border-neutral-300 text-neutral-400 cursor-not-allowed"
                      : "border-primary-900 text-primary-900 cursor-pointer hover:bg-primary-50"
                  }`}
                >
                  <PackagePlus size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${row.productName ?? "product"}`}
                  title="Delete product"
                  onClick={() => {
                    setSelectedProductIdLocal(row.productId);
                    setOpenDeleteModal(true);
                  }}
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          }}
        />
      </div>

      {!loading && sortedData.length > 0 && (
        <div className="flex items-center justify-between font-open-sans text-xs text-neutral-600 mt-2">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, sortedData.length)} of{" "}
            {sortedData.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className={`h-7 px-2.5 rounded-md border text-xs font-semibold ${
                currentPage === 1
                  ? "border-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "border-primary-900 text-primary-900 cursor-pointer hover:bg-primary-50"
              }`}
            >
              Previous
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              className={`h-7 px-2.5 rounded-md border text-xs font-semibold ${
                currentPage === totalPages
                  ? "border-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "border-primary-900 text-primary-900 cursor-pointer hover:bg-primary-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

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
      <StockUpdateModal
        open={!!stockUpdateProduct}
        onClose={() => setStockUpdateProduct(null)}
        productName={stockUpdateProduct?.productName}
        productId={stockUpdateProduct?.productId}
        categoryId={stockUpdateProduct?.categoryId as number | null}
        onSuccess={async () => {
          await fetchProducts();
        }}
      />
    </>
  );
};

export default ProductList;
