"use client";

import React, { useEffect, useState } from "react";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getDrugProductList } from "@/src/services/product/ProductService";
import {
  CreateDrugProductRequest,
  ProductData,
} from "@/src/types/product/ProductData";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";

const columns: Column<CreateDrugProductRequest & ProductData>[] = [
  {
    header: "Thumbnail",
    accessor: () => (
      <img
        src="/icons/Tumbnail.svg"
        alt="drug"
        className="w-10 h-10 rounded-md object-cover"
      />
    ),
  },
  {
    header: "Product Name",
    accessor: (row) => row.productName ?? "-",
  },
  {
    header: "Category",
    accessor: () => "Drug",
  },
  {
    header: "Price",
    accessor: (row) => row.pricingDetails?.[0]?.mrp ?? "-",
  },
  {
    header: "Stock",
    accessor: (row) => row.pricingDetails?.[0]?.stockQuantity ?? "-",
  },
  {
    header: "Status",
    accessor: () => (
      <span className="p-2 w-14 h-8 bg-success-50 text-p3 text-success-900 font-semibold rounded-lg">
        Active
      </span>
    ),
  },
];
const ProductList = () => {
  const [data, setData] = useState<(CreateDrugProductRequest & ProductData)[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getDrugProductList();
      setData(response || []);
      console.log("API DATA:", response);
    } catch (error) {
      console.error("Error fetching Drug Product List:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <>
      <div className="flex justify-between gap-10">
        <button className="w-32 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
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
            className="border border-neutral-200 text-p4 text-neutral-500 font-semibold w-full h-12 rounded-lg px-5 pr-12"
          />

          <Search
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2  text-[#4C0080]"
          />
        </div>

        <button className="w-36 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
          Sort By
          <img
            src="/icons/SortbyIcon.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
        </button>
      </div>


      <div>
        <Table<CreateDrugProductRequest & ProductData>
          columns={columns}
          data={data}
          loading={loading}
          actions={(row) => (
            <div className="flex items-center gap-3">
              <img
                src="/icons/EditIcon.svg"
                alt="drug"
                className="w-5 h-5 rounded-md object-cover text-[#7D00D3]"
              />
              <img
                src="/icons/ViewIcon.svg"
                alt="drug"
                className="w-5 h-5 rounded-md object-cover"
              />
              <img
                src="/icons/DeleteIcon.svg"
                alt="drug"
                className="w-5 h-5 rounded-md object-cover"
              />
            </div>
          )}
        />
      </div>
    </>
  );
};

export default ProductList;
