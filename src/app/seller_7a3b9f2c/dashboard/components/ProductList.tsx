"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getProductList } from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import { ProductListData } from "@/src/types/product/ProductData";
import Delete from "./Delete";

interface ProductListProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: (id: string) => void;
  refreshKey?: number;
}

const categoryMap: Record<number, string> = {
  1: "Drugs",
  2: "Supplements/ Nutraceuticals",
  3: "Food & Infant Nutrition",
  4: "Cosmetic & Personal Care",
  5: "Consumable Medical Devices & Equipment",
  6: "Non-Consumable Medical Devices & Equipment",
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
    header: "Product Name",
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
    header: "Price",
    accessor: (row) => row.pricingDetails?.[0]?.mrp ?? "-",
  },
  {
    header: "Stock",
    accessor: (row) => row.pricingDetails?.[0]?.stockQuantity ?? "-",
  },
  // {
  //   header: "Status",
  //   accessor: () => (
  //     <span className="p-2 w-14 h-8 bg-success-50 text-p3 text-success-900 font-semibold rounded-lg">
  //       Active
  //     </span>
  //   ),
  // },
];

const ProductList = ({
  setCurrentView,
  setSelectedProductId,
  refreshKey,
}: ProductListProps) => {
  const [data, setData] = useState<ProductListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

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

    return (
      item.productName?.toLowerCase().includes(term) ||
      categoryMap[item.categoryId as number]?.toLowerCase().includes(term) ||
      String(item.pricingDetails?.[0]?.mrp ?? "").includes(term) ||
      String(item.pricingDetails?.[0]?.stockQuantity ?? "").includes(term)
    );
  });

  return (
    <>
      <div className="flex justify-between gap-10 font-open-sans">
        <button className="w-32 h-12 bg-pneutral-50 border border-pneutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
          <img
            src="/icons/FilterIcon.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
          Filter
        </button>
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

          <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center rounded-r-lg">
            <img src="/icons/SearchIcon.svg" alt="search" className="w-6 h-6" />
          </div>
        </div>

        <button className="w-36 h-12 bg-pneutral-50 border border-pneutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
          Sort By
          <img
            src="/icons/SortbyIcon.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
        </button>
      </div>

      <div>
        <Table<ProductListData>
          columns={columns}
          data={filteredData}
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
