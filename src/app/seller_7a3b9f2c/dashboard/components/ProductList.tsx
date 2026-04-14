"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getProductList } from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import { ProductListData } from "@/src/types/product/ProductData";
import CommonModal from "../commonComponent/CommonModal";
import DeleteProduct from "./DeleteProduct";

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

const getCategoryBadge = (category: string) => {
  switch (category) {
    case "Drugs":
      return (
        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200">
          Drugs
        </span>
      );
    case "Consumable":
      return (
        <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">
          Consumable
        </span>
      );
    case "Non-Consumable":
      return (
        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200">
          Non-Consumable
        </span>
      );
    default:
      return (
        <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg">
          {category}
        </span>
      );
  }
};

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

// Thumbnail rendered as a regular img to support arbitrary external URLs
// (Next/Image requires domain allow-listing in next.config.js)
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
];

const ProductList = ({ setCurrentView, setSelectedProductId }: ProductListProps) => {
  const [data, setData] = useState<ExtendedProductListData[]>([]);
  const [filteredData, setFilteredData] = useState<ExtendedProductListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

    setFilteredData(filtered);
  }, [searchQuery, categoryFilter, data]);

  return (
    <>
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(["all", "Drugs", "Consumable", "Non-Consumable"] as const).map((cat) => {
            const colorMap: Record<string, string> = {
              all: categoryFilter === "all"
                ? "bg-primary-900 text-white border-primary-900"
                : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-primary-900",
              Drugs: categoryFilter === "Drugs"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-600",
              Consumable: categoryFilter === "Consumable"
                ? "bg-green-600 text-white border-green-600"
                : "bg-green-50 text-green-700 border-green-200 hover:border-green-600",
              "Non-Consumable": categoryFilter === "Non-Consumable"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-600",
            };
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 h-12 border rounded-lg text-sm font-semibold transition ${colorMap[cat]}`}
              >
                {cat === "all" ? "All Products" : cat}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 min-w-[300px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, manufacturer, or ID..."
            className="border border-neutral-200 text-sm text-neutral-700 font-medium w-full h-12 rounded-lg px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent"
          />
          <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-purple-200 rounded-r-lg pointer-events-none">
            <Image src="/icons/SearchIcon.svg" alt="Search" width={20} height={20} />
          </div>
        </div>
      </div>

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
        {(searchQuery || categoryFilter !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
            }}
            className="text-primary-900 hover:underline font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

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