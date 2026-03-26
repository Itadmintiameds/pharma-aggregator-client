"use client";

import React, { useEffect, useState } from "react";
import {
  getProductById,
  deleteProduct,
} from "@/src/services/product/ProductService";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { HiExclamation } from "react-icons/hi";
import { HiOutlineTrash } from "react-icons/hi2";

interface DeleteProductProps {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteProduct = ({
  productId,
  onClose,
  onSuccess,
}: DeleteProductProps) => {
  const [product, setProduct] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

useEffect(() => {
  const fetchProduct = async () => {
    try {
      const res = await getProductById(productId);
      setProduct(res);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  if (productId) {
    fetchProduct();
  }
}, [productId]);


  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteProduct(productId);

      onSuccess(); 
      onClose();  
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };



  return (
    <>
      {/* ICON */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-warning-200 flex items-center justify-center">
          <HiOutlineExclamationCircle className="text-warning-600 text-4xl" />
        </div>
      </div>

      {/* TITLE */}
      <h2 className="text-h5 font-bold text-center text-neutral-900">
        Delete Product?
      </h2>

      <p className="text-center text-p3 text-neutral-700 mt-2">
        This action cannot be undone. The product will be permanently removed
        from your inventory.
      </p>

      {/* PRODUCT INFO */}
      <div className="bg-tertiary-100 border border-tertiary-500 rounded-xl p-4 mt-5">
        <p className="text-p5 text-warning-700 font-semibold flex items-center gap-2">
          <HiOutlineExclamationCircle className="text-lg" />
          You are about to delete:
        </p>

        <p className="text-p5 font-semibold text-neutral-900 mt-1">
          {product?.productName || "-"}{" "}
          {product?.productAttributeDrugs?.[0]?.strength}mg{" "}
          {product?.productAttributeDrugs?.[0]?.dosageForm}
        </p>

        <div className="flex justify-between text-p3 mt-3">
          <span className="text-warning-600">Category</span>
          <span className="text-neutral-900 font-semibold">
  {"Anti-Infectives"}
</span>
        </div>

        <div className="flex justify-between text-p3 mt-1">
          <span className="text-warning-600">Stock</span>
          <span className="text-success-900 font-bold">
            {product?.pricingDetails?.[0]?.stockQuantity ?? 0} units
          </span>
        </div>
      </div>

      {/* WARNING */}
      <div className="bg-red-100 rounded-xl p-4 mt-5 text-p2">
        <p className="font-semibold mb-2 text-warning-700 flex items-center gap-2">
          <HiExclamation className="text-lg w-5 h-5" />
          This will permanently:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-warning-600">
          <li>Remove product from all listings</li>
          <li>Delete all product images and data</li>
          <li>Remove from customer wishlists</li>
          <li>Cannot be recovered after deletion</li>
        </ul>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-4 mt-6">
        <button
          className="flex-1 h-11 rounded-lg bg-neutral-100 text-neutral-900 font-medium"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          className="flex-1 h-11 rounded-lg bg-warning-500 text-white font-medium flex items-center justify-center gap-2"
          onClick={handleDelete}
          disabled={deleting}
        >
          <HiOutlineTrash className="w-5 h-5" />
          {deleting ? "Deleting..." : "Delete Product"}
        </button>
      </div>
    </>
  );
};

export default DeleteProduct;