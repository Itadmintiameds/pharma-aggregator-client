"use client";

import React, { useEffect, useState } from "react";
import { getDrugProductById } from "@/src/services/product/ProductService";
import { CreateDrugProductRequest } from "@/src/types/product/ProductData";

interface DrugProductViewProps {
  productId: string;
  onBack: () => void;
}

const DrugProductView = ({ productId, onBack }: DrugProductViewProps) => {
  const [productData, setProductData] =
    useState<CreateDrugProductRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getDrugProductById(productId);

      if (data) {
        // 🔥 MAP API RESPONSE TO YOUR TYPE
        const mapped: CreateDrugProductRequest = {
          product: {
            productId: data.productId,
            productCategoryId: data.productCategoryId,
            productName: data.productName,
            therapeuticCategory: data.therapeuticCategory,
            therapeuticSubcategory: data.therapeuticSubcategory,
            dosageForm: data.dosageForm,
            strength: data.strength,
            warningsPrecautions: data.warningsPrecautions,
            productDescription: data.productDescription,
            productMarketingUrl: data.productMarketingUrl,
          },
          packagingDetails: data.packagingDetails,
          pricingDetails: data.pricingDetails || [],
          moleculeIds: data.molecules?.map((m: any) => m.moleculeId) || [],
        };

        setProductData(mapped);
      } else {
        setProductData(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const product = productData?.product;
  const packaging = productData?.packagingDetails;
  const price = productData?.pricingDetails?.[0];

  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-sm">
        Loading product details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-sm mb-4">{error}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <button
        onClick={onBack}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer rounded-md text-sm shadow-sm transition-colors duration-200"
      >
        ← Back to List
      </button>

      <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
          Product Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <Info label="Product Name" value={product?.productName} />
          <Info label="Category" value={product?.productCategoryId} />
          <Info
            label="Therapeutic Category"
            value={product?.therapeuticCategory}
          />
          <Info
            label="Therapeutic Subcategory"
            value={product?.therapeuticSubcategory}
          />
          <Info label="Dosage Form" value={product?.dosageForm} />
          <Info label="Strength" value={product?.strength?.toString()} />
          <Info
            label="Molecules"
            value={productData?.moleculeIds?.join(", ")}
          />
          <Info
            label="Warnings & Precautions"
            value={product?.warningsPrecautions}
          />

          <div className="md:col-span-2">
            <p className="font-medium text-gray-600 mb-1">
              Product Description
            </p>
            <p className="text-gray-700 text-sm">
              {product?.productDescription || "-"}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="font-medium text-gray-600 mb-1">Marketing URL</p>
            {product?.productMarketingUrl ? (
              <a
                href={product.productMarketingUrl}
                target="_blank"
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {product.productMarketingUrl}
              </a>
            ) : (
              "-"
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
          Packaging & Order Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <Info label="Packaging Unit" value={packaging?.packagingUnit} />
          <Info
            label="Number of Units"
            value={packaging?.numberOfUnits?.toString()}
          />
          <Info label="Pack Size" value={packaging?.packSize?.toString()} />
          <Info
            label="Min Order Qty"
            value={packaging?.minimumOrderQuantity?.toString()}
          />
          <Info
            label="Max Order Qty"
            value={packaging?.maximumOrderQuantity?.toString()}
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
          Batch, Stock Entry, Pricing & Tax Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <Info label="Batch / Lot Number" value={price?.batchLotNumber} />
          <Info label="Manufacturer Name" value={price?.manufacturerName} />
          <Info
            label="Manufacturing Date"
            value={price?.manufacturingDate ?? "-"}
          />

          <Info label="Expiry Date" value={price?.expiryDate ?? "-"} />
          <Info label="Storage Condition" value={price?.storageCondition} />
          <Info
            label="Stock Quantity"
            value={price?.stockQuantity?.toString()}
          />
          <Info
            label="Price Per Unit"
            value={price?.pricePerUnit ? `₹${price.pricePerUnit}` : "-"}
          />
          <Info label="MRP" value={price?.mrp ? `₹${price.mrp}` : "-"} />
          <Info
            label="Discount %"
            value={price?.discountPercentage?.toString()}
          />
          <Info label="GST %" value={price?.gstPercentage?.toString()} />
          <Info label="HSN Code" value={price?.hsnCode?.toString()} />
        </div>
      </div>
    </div>
  );
};

export default DrugProductView;

/* ---------------- Reusable Info Component ---------------- */

interface InfoProps {
  label: string;
  value?: string;
}

const Info = ({ label, value }: InfoProps) => (
  <div>
    <p className="font-medium text-gray-600 mb-1">{label}</p>
    <p className="text-gray-800">{value || "-"}</p>
  </div>
);
