"use client";

import React, { useEffect, useState } from "react";
import { getDrugProductList } from "@/src/services/product/ProductService";
import {
  CreateDrugProductRequest,
  ProductData,
} from "@/src/types/product/ProductData";
import { MdDelete } from "react-icons/md";
import { AiFillEdit } from "react-icons/ai";
import { IoEyeSharp } from "react-icons/io5";

type ViewMode = "table" | "list";

interface DrugProductListProps {
  onDelete: (productId: string) => void;
  onEdit: (productId: string) => void;
}

const DrugProductList = ({ onDelete, onEdit }: DrugProductListProps) => {
  const [products, setProducts] = useState<CreateDrugProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getDrugProductList();

      console.log("RAW PRODUCT API RESPONSE:", data);

      if (Array.isArray(data)) {
        // 🔥 MAP FLAT RESPONSE → YOUR EXISTING TYPE
        const mapped: CreateDrugProductRequest[] = data.map((item: any) => ({
          product: {
            productId: item.productId,
            productCategoryId: item.productCategoryId,
            productName: item.productName,
            therapeuticCategory: item.therapeuticCategory,
            therapeuticSubcategory: item.therapeuticSubcategory,
            dosageForm: item.dosageForm,
            strength: item.strength,
            warningsPrecautions: item.warningsPrecautions,
            productDescription: item.productDescription,
            productMarketingUrl: item.productMarketingUrl,
          } as ProductData,

          packagingDetails: item.packagingDetails,
          pricingDetails: item.pricingDetails || [],
          moleculeIds: item.molecules?.map((m: any) => m.moleculeId) || [],
        }));

        setProducts(mapped);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to load products", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3>Drug Products</h3>

        <div className="flex gap-2">
          <button
            className={`btn ${
              viewMode === "table" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => setViewMode("table")}
          >
            Table View
          </button>

          <button
            className={`btn ${
              viewMode === "list" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => setViewMode("list")}
          >
            List View
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-muted">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-muted">No products available</div>
      ) : viewMode === "table" ? (
        <div className="card overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-default text-left">
                <th className="py-3 px-4">Product ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dosage</th>
                <th className="py-3 px-4">Strength</th>
                <th className="py-3 px-4">MRP</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {products.map((item, index) => {
                const price = item.pricingDetails?.[0];

                return (
                  <tr
                    key={index}
                    className="border-b border-default hover:bg-(--neutral-100)"
                  >
                    <td className="py-3 px-4">
                      {item.product.productId ?? "-"}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {item.product.productName ?? "-"}
                    </td>
                    <td className="py-3 px-4">
                      {item.product.therapeuticCategory ?? "-"}
                    </td>
                    <td className="py-3 px-4">
                      {item.product.dosageForm ?? "-"}
                    </td>
                    <td className="py-3 px-4">
                      {item.product.strength ?? "-"}
                    </td>
                    <td className="py-3 px-4">₹{price?.mrp ?? "-"}</td>
                    <td className="py-3 px-4">{price?.stockQuantity ?? "-"}</td>
                    <td className="py-3 px-4 flex space-x-3">
                      <AiFillEdit
                        size={22}
                        className="text-green-600 cursor-pointer hover:text-green-800"
                        onClick={() => {
                          if (item.product.productId) {
                            onEdit(item.product.productId);
                          }
                        }}
                      />
                      <MdDelete
                        size={22}
                        className="text-red-600 cursor-pointer hover:text-red-800"
                        onClick={() => {
                          if (item.product.productId) {
                            onDelete(item.product.productId);
                          }
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((item, index) => {
            const price = item.pricingDetails?.[0];

            return (
              <div key={index} className="card animate-fadeIn space-y-3">
                <div>
                  <h5>{item.product.productName ?? "-"}</h5>
                  <small>{item.product.productId ?? "-"}</small>
                </div>

                <div className="text-sm space-y-1">
                  <p>
                    <strong>Category:</strong>{" "}
                    {item.product.therapeuticCategory ?? "-"}
                  </p>
                  <p>
                    <strong>Dosage:</strong> {item.product.dosageForm ?? "-"}
                  </p>
                  <p>
                    <strong>Strength:</strong> {item.product.strength ?? "-"}
                  </p>
                  <p>
                    <strong>Manufacturer:</strong>{" "}
                    {price?.manufacturerName ?? "-"}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-default">
                  <span className="font-semibold">₹{price?.mrp ?? "-"}</span>
                  <span className="text-muted text-sm">
                    Stock: {price?.stockQuantity ?? "-"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DrugProductList;
