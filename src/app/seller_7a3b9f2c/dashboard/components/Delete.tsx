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
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 px-4">
      <div className="shrink-0 w-[448px] h-163.5 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex justify-center">
          <img src="/icons/DeleteImg.svg" alt="filter" className="w-20 h-20" />
        </div>

        <div className="mt-4 text-h5 font-bold text-center">
          Delete Product?
        </div>

        <div className="mt-4 text-p3 font-normal text-center text-pneutral-700">
          Are you sure you want to delete this product? <br />
          this action is{" "}
          <span className="font-semibold text-warning-500">permanent </span>
          and cannot be undone.
        </div>

        <div className="mt-4 p-4 w-100 h-29.5 bg-secondary-50 border border-secondary-300 rounded-xl">
          <div
            className="w-full text-pneutral-900 text-base font-semibold truncate"
            title={productDetails?.productName || "-"}
          >
            {productDetails?.productName || "-"}
          </div>

          <div className="flex">
            <div className="flex-1 py-2 min-w-0">
              <p className="text-p3 font-semibold text-pneutral-900">
                Category
              </p>
              <p
                className="mt-3 text-p3 text-secondary-700 font-medium truncate"
                title={categoryMap[productDetails?.categoryId] || "-"}
              >
                {categoryMap[productDetails?.categoryId] || "-"}
              </p>
            </div>

            <div className="flex items-center">
              <div className="w-px h-11 bg-pneutral-400"></div>
            </div>

            <div className="flex-1 py-2 px-6">
              <p className="text-p3 font-semibold text-pneutral-900">Stock</p>
              <p className="mt-3 text-p3 text-success-700 font-medium">
                {productDetails?.pricingDetails?.[0]?.stockQuantity || 0} units
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 w-100 h-53 bg-danger-50 border border-danger-500 rounded-xl flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <span>
              <img
                src="/icons/DeleteImg2.svg"
                alt="filter"
                className="w-5 h-5"
              />
            </span>
            <span className="text-p4 font-medium text-pneutral-900">
              Please Note
            </span>
          </div>

          <div className="flex gap-4 items-center">
            <img
              src="/icons/DeleteImg1.svg"
              alt="delete"
              className="w-9 h-9 flex-shrink-0"
            />

            <div className="flex-1">
              <p className="text-p3 font-normal text-pneutral-900">
                This product will be{" "}
                <span className="text-warning-500">Permanently deleted</span>{" "}
                from your inventory.
              </p>

              <div className="mt-2 border-b border-danger-200"></div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <img
              src="/icons/DeleteImg3.svg"
              alt="delete"
              className="w-9 h-9 flex-shrink-0"
            />

            <div className="flex-1">
              <p className="text-p3 font-normal text-pneutral-900">
                Historical records and transactions linked to this product may
                no longer be available.
              </p>

              <div className="mt-2 border-b border-danger-200"></div>
            </div>
          </div>

          <div>
            <div className="flex gap-4 items-center">
              <img
                src="/icons/DeleteImg4.svg"
                alt="delete"
                className="w-9 h-9 flex-shrink-0"
              />

              <div className="flex-1">
                <p className="text-p3 font-normal text-pneutral-900">
                  This action{" "}
                  <span className="text-warning-500">cannot be reversed.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            className="w-48.5 h-12 bg-pneutral-100 rounded-lg label-l4 font-medium flex items-center justify-center gap-2 "
            onClick={onClose}
          >
            <img src="/icons/DeleteImg5.svg" alt="filter" className="w-5 h-5" />
            Cancel
          </button>
          <button
            onClick={handleDeleteProduct}
            disabled={loading}
            className="w-48.5 h-12 bg-warning-500 rounded-lg label-l4 font-medium text-white flex items-center justify-center gap-2"
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

      {/* <div className="shrink-0 w-[448px] h-161.75 rounded-2xl bg-white p-6 shadow-2xl">
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

      </div> */}
    </div>
  );
};

export default Delete;
