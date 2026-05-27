import {
  deleteProduct,
  getProductById,
} from "@/src/services/product/ProductService";
import React, { useEffect, useState } from "react";

type DeleteProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productId: string;
};

const Delete = ({ isOpen, onClose, onConfirm, productId }: DeleteProps) => {
  const [productDetails, setProductDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);

      const response = await getProductById(productId);
      setProductDetails(response);
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const categoryMap: Record<number, string> = {
    1: "Drugs",
    2: "Supplements/ Nutraceuticals",
    3: "Food & Infant Nutrition",
    4: "Cosmetic & Personal Care",
    5: "Consumable Medical Devices & Equipment",
    6: "Non-Consumable Medical Devices & Equipment",
  };

  const handleDeleteProduct = async () => {
    try {
      setLoading(true);

      await deleteProduct(productId);

      onConfirm();

      onClose();
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="shrink-0 w-[448px] h-161.75 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex justify-center">
          <img src="/icons/DeleteImg.svg" alt="filter" className="w-20 h-20" />
        </div>

        <div className="mt-6 text-h5 font-bold text-center">
          Delete Product?
        </div>

        <div className="mt-5 text-p3 font-normal text-center text-pneutral-700">
          This action cannot be undone. The product will be permanently removed
          from your inventory.
        </div>

        <div className="mt-5 flex flex-col gap-5">
          <div className="w-100 h-34.75 border border-danger-500 bg-danger-100 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex gap-3 items-center">
                <span>
                  <img
                    src="/icons/DeleteImg1.svg"
                    alt="filter"
                    className="w-6 h-6"
                  />
                </span>
                <span className="text-warning-700 text-base font-semibold">
                  You are about to delete:
                </span>
              </div>
              <div
                className="pl-9 w-full max-w-[340px] text-pneutral-900 text-base font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
                title={productDetails?.productName}
              >
                {productDetails?.productName || "-"}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-p3">
                <span className="font-normal text-warning-600">Category</span>
                <span className="font-semibold">
                  {" "}
                  {categoryMap[productDetails?.categoryId] || "-"}
                </span>
              </div>
              <div className="flex justify-between text-p3">
                <span className="font-normal text-warning-600">Stock</span>
                <span className="font-semibold text-success-900">
                  {productDetails?.pricingDetails?.[0]?.stockQuantity || 0}{" "}
                  units
                </span>
              </div>
            </div>
          </div>

          <div className="w-100 h-35 bg-warning-50 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <span>
                <img
                  src="/icons/DeleteImg2.svg"
                  alt="filter"
                  className="w-5 h-5"
                />
              </span>
              <span className="text-xs font-semibold text-warning-700">
                This will permanently:
              </span>
            </div>

            <div>
              <ul className="list-disc pl-9 text-xs text-warning-600 space-y-1">
                <li>This action cannot be undone.</li>
                <li>The product will be permanently deleted.</li>
                <li>All associated data may be removed.</li>
                <li>Please confirm before proceeding.</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="w-48.5 h-12 bg-pneutral-100 rounded-lg text-base font-semibold"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProduct}
              disabled={loading}
              className="w-48.5 h-12 bg-warning-500 rounded-lg text-base font-semibold text-white flex items-center justify-center gap-2"
            >
              <img
                src="/icons/DeleteWhite.svg"
                alt="filter"
                className="w-5 h-5"
              />
              Delete Product
            </button>
          </div>
        </div>

        {/* <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-[#0F172A] whitespace-nowrap">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="flex-shrink-0 text-3xl leading-none text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div> */}

        {/* Message */}
        {/* <p className="mt-5 text-lg leading-8 text-gray-600 break-words">
          {message}
        </p> */}

        {/* Footer */}
        {/* <div className="mt-10 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="h-12 min-w-[120px] rounded-xl border border-gray-300 bg-gray-100 px-6 text-base font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="h-12 min-w-[120px] rounded-xl bg-red-600 px-6 text-base font-semibold text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default Delete;
