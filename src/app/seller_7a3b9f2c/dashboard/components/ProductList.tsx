"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getProductList } from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import { ProductListData } from "@/src/types/product/ProductData";
import CommonModal from "../commonComponent/CommonModal";
import DeleteProduct from "./DeleteProduct";
import { SlidersHorizontal, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

interface ProductListProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: (id: string) => void;
}

// Extend ProductListData with dynamic API fields that may not be in the base type
type ExtendedProductListData = ProductListData & {
  productAttributeNonConsumableMedicals?: unknown[];
  productAttributeConsumableMedicals?: unknown[];
  drugAttributes?: unknown;
  productAttributeDrugs?: unknown;
  productImages?: Array<{
    productImage?: string;
    imageUrl?: string;
    url?: string;
    imagePath?: string;
  }>;
  images?: string[];
  manufacturerName?: string;
};

const getProductCategory = (product: ExtendedProductListData): string => {
  if (product.categoryName) {
    const catName = product.categoryName.toLowerCase();
    if (catName.includes("drug") || catName.includes("medicine")) return "Drugs";
    if (catName.includes("non-consumable") || catName.includes("nonconsumable")) return "Non-Consumable";
    if (catName.includes("consumable")) return "Consumable";
  }

  if (
    product.productAttributeNonConsumableMedicals &&
    Array.isArray(product.productAttributeNonConsumableMedicals) &&
    product.productAttributeNonConsumableMedicals.length > 0
  ) {
    return "Non-Consumable";
  }

  if (
    product.productAttributeConsumableMedicals &&
    Array.isArray(product.productAttributeConsumableMedicals) &&
    product.productAttributeConsumableMedicals.length > 0
  ) {
    return "Consumable";
  }

  if (product.drugAttributes || product.productAttributeDrugs) {
    return "Drugs";
  }

  return "Uncategorized";
};

const getCategoryBadge = (category: string) => (
  <span className="text-sm text-neutral-700">{category}</span>
);

const getFirstImage = (product: ExtendedProductListData): string | null => {
  if (Array.isArray(product.productImages) && product.productImages.length > 0) {
    const firstImg = product.productImages[0];
    const url =
      firstImg?.productImage ||
      firstImg?.imageUrl ||
      firstImg?.url ||
      firstImg?.imagePath;
    if (url && url !== "PENDING" && url.startsWith("http")) return url;
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    const url = product.images[0];
    if (url && url !== "PENDING" && url.startsWith("http")) return url;
  }

  return null;
};

const ProductThumbnail = ({ product }: { product: ExtendedProductListData }) => {
  const [src, setSrc] = React.useState(
    getFirstImage(product) ?? "/assets/images/SellerMed.jpg"
  );

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt="Product thumbnail"
      className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
      onError={() => setSrc("/assets/images/SellerMed.jpg")}
    />
  );
};

type SortField = "name" | "price" | "stock" | "none";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { label: string; field: SortField; dir: SortDir }[] = [
  { label: "Name (A–Z)", field: "name", dir: "asc" },
  { label: "Name (Z–A)", field: "name", dir: "desc" },
  { label: "Price (Low–High)", field: "price", dir: "asc" },
  { label: "Price (High–Low)", field: "price", dir: "desc" },
  { label: "Stock (Low–High)", field: "stock", dir: "asc" },
  { label: "Stock (High–Low)", field: "stock", dir: "desc" },
];

const CATEGORY_OPTIONS = ["all", "Drugs", "Consumable", "Non-Consumable"] as const;

const ProductList = ({ setCurrentView, setSelectedProductId }: ProductListProps) => {
  const [data, setData] = useState<ExtendedProductListData[]>([]);
  const [filteredData, setFilteredData] = useState<ExtendedProductListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Sort state
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [activeSortLabel, setActiveSortLabel] = useState("Sort by");

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductList();
      setData((response as ExtendedProductListData[]) || []);
      setFilteredData((response as ExtendedProductListData[]) || []);
    } catch (error) {
      console.error("Error fetching product list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = [...data];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.productName?.toLowerCase().includes(query) ||
          product.manufacturerName?.toLowerCase().includes(query) ||
          product.productId?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) => getProductCategory(product) === categoryFilter
      );
    }

    // Apply sort
    if (sortField !== "none") {
      filtered = [...filtered].sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        if (sortField === "name") {
          valA = a.productName?.toLowerCase() ?? "";
          valB = b.productName?.toLowerCase() ?? "";
        } else if (sortField === "price") {
          valA = a.pricingDetails?.[0]?.mrp ?? 0;
          valB = b.pricingDetails?.[0]?.mrp ?? 0;
        } else if (sortField === "stock") {
          valA = Number(a.pricingDetails?.[0]?.stockQuantity ?? 0);
          valB = Number(b.pricingDetails?.[0]?.stockQuantity ?? 0);
        }

        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
  }, [searchQuery, categoryFilter, data, sortField, sortDir]);

  const columns: Column<ExtendedProductListData>[] = [
    {
      header: "Thumbnail",
      accessor: (row) => <ProductThumbnail product={row} />,
    },
    {
      header: "Product Name",
      accessor: (row) => (
        <div className="max-w-xs">
          <p className="font-medium text-neutral-900 truncate">{row.productName || "-"}</p>
          <p className="text-xs text-neutral-500 truncate">{row.manufacturerName || ""}</p>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: (row) => getCategoryBadge(getProductCategory(row)),
    },
    {
      header: "Price",
      accessor: (row) => {
        const price = row.pricingDetails?.[0]?.mrp;
        return price ? `₹${price.toFixed(2)}` : "-";
      },
    },
    {
      header: "Stock",
      accessor: (row) => {
        const stock = row.pricingDetails?.[0]?.stockQuantity;
        if (!stock) return "-";

        const stockNum = Number(stock);
        let colorClass = "text-neutral-700";
        if (stockNum === 0) colorClass = "text-red-600 font-semibold";
        else if (stockNum < 10) colorClass = "text-orange-600";
        else if (stockNum >= 100) colorClass = "text-green-600";

        return <span className={colorClass}>{stock}</span>;
      },
    },
    {
      header: "Status",
      accessor: (row) => {
        const stock = Number(row.pricingDetails?.[0]?.stockQuantity ?? 0);
        if (stock === 0)
          return (
            <span className="px-3 py-1 text-xs rounded-md bg-red-50 text-red-700 font-medium">
              Out of Stock
            </span>
          );
        if (stock < 10)
          return (
            <span className="px-3 py-1 text-xs rounded-md bg-orange-50 text-orange-700 font-medium">
              Low Stock
            </span>
          );
        return (
          <span className="px-3 py-1 text-xs rounded-md bg-green-50 text-green-700 font-medium">
            Active
          </span>
        );
      },
    },
  ];

  return (
    <>
      {/* ── Top bar: Filter | Search | Sort by ── */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        {/* Filter button */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen((prev) => !prev)}
            className={`flex items-center gap-2 h-12 px-5 rounded-xl border text-sm font-semibold transition
              ${filterOpen || categoryFilter !== "all"
                ? "bg-primary-900 text-white border-primary-900"
                : "bg-white text-neutral-700 border-neutral-200 hover:border-primary-900"
              }`}
          >
            <SlidersHorizontal size={16} />
            Filter
            {categoryFilter !== "all" && (
              <span className="ml-1 bg-white text-primary-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                1
              </span>
            )}
          </button>

          {/* Filter panel dropdown */}
          {filterOpen && (
            <div className="absolute top-14 left-0 z-20 bg-white rounded-xl border border-neutral-200 shadow-lg p-4 w-56">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                Category
              </p>
              <div className="flex flex-col gap-1">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setFilterOpen(false);
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition
                      ${categoryFilter === cat
                        ? "bg-primary-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                  >
                    {cat === "all" ? "All Products" : cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="relative flex-1 min-w-[260px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="border border-neutral-200 text-sm text-neutral-700 font-medium w-full h-12 rounded-xl px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent bg-neutral-50"
          />
          <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-purple-200 rounded-r-xl pointer-events-none">
            <Search size={18} className="text-purple-700" />
          </div>
        </div>

        {/* Sort by dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-2 h-12 px-5 rounded-xl border text-sm font-semibold transition whitespace-nowrap
              ${sortDropdownOpen || sortField !== "none"
                ? "bg-primary-900 text-white border-primary-900"
                : "bg-white text-neutral-700 border-neutral-200 hover:border-primary-900"
              }`}
          >
            <ArrowUpDown size={16} />
            {activeSortLabel}
            {sortDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {sortDropdownOpen && (
            <div className="absolute top-14 right-0 z-20 bg-white rounded-xl border border-neutral-200 shadow-lg p-2 w-52">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setSortField(opt.field);
                    setSortDir(opt.dir);
                    setActiveSortLabel(opt.label);
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition
                    ${sortField === opt.field && sortDir === opt.dir
                      ? "bg-primary-900 text-white"
                      : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
              {sortField !== "none" && (
                <button
                  onClick={() => {
                    setSortField("none");
                    setActiveSortLabel("Sort by");
                    setSortDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition mt-1 border-t border-neutral-100"
                >
                  Clear sort
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results count + clear filters */}
      <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
        <p>
          Showing{" "}
          <span className="font-semibold text-neutral-900">{filteredData.length}</span> of{" "}
          <span className="font-semibold text-neutral-900">{data.length}</span> products
          {categoryFilter !== "all" && (
            <span className="ml-1">
              in category:{" "}
              <span className="font-semibold text-primary-900">{categoryFilter}</span>
            </span>
          )}
        </p>
        {(searchQuery || categoryFilter !== "all" || sortField !== "none") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setSortField("none");
              setActiveSortLabel("Sort by");
            }}
            className="text-primary-900 hover:underline font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      <div>
        <Table<ExtendedProductListData>
          columns={columns}
          data={filteredData}
          loading={loading}
          actions={(row) => (
            <div className="flex items-center gap-3">
              <Image
                src="/icons/EditIcon.svg"
                alt="Edit product"
                width={20}
                height={20}
                className="cursor-pointer opacity-70 hover:opacity-100 transition"
                onClick={() => {
                  setSelectedProductId(row.productId ?? "");
                  setCurrentView("editProduct");
                }}
              />
              <Image
                src="/icons/ViewIcon.svg"
                alt="View product"
                width={20}
                height={20}
                className="cursor-pointer opacity-70 hover:opacity-100 transition"
                onClick={() => {
                  setSelectedProductId(row.productId ?? "");
                  setCurrentView("productView");
                }}
              />
              <Image
                src="/icons/DeleteIcon.svg"
                alt="Delete product"
                width={20}
                height={20}
                className="cursor-pointer opacity-70 hover:opacity-100 transition"
                onClick={() => {
                  setSelectedProductIdLocal(row.productId ?? null);
                  setOpenDeleteModal(true);
                }}
              />
            </div>
          )}
        />
      </div>

      {openDeleteModal && selectedProductIdLocal && (
        <CommonModal onClose={() => setOpenDeleteModal(false)}>
          <DeleteProduct
            productId={selectedProductIdLocal}
            onClose={() => setOpenDeleteModal(false)}
            onSuccess={fetchProducts}
          />
        </CommonModal>
      )}
    </>
  );
};

export default ProductList;