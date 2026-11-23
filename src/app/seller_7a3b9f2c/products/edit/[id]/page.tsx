"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { DrugForm } from "../../../dashboard/components/DrugForm";
import ConsumableForm from "../../../dashboard/components/ConsumableForm";
import NonConsumableForm from "../../../dashboard/components/NonConsumableForm";
import SupplementForm from "../../../dashboard/components/SupplementForm";
import FoodInfantForm from "../../../dashboard/components/FoodInfantForm";
import CosmeticForm from "../../../dashboard/components/CosmeticForm";
import { getProductById } from "@/src/services/product/ProductService";
import {
  EditViewKey,
  editKeyForProduct,
  isEditViewKey,
} from "@/src/utils/productRouting";

export default function EditProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = params.id as string;
  const categoryParam = searchParams.get("category");

  // The form is chosen from the product itself (categoryId / populated attribute set) so a
  // missing, stale or unknown `?category=` value can never open the wrong form. The query
  // value is only a fallback when the product cannot be inspected.
  const [category, setCategory] = useState<EditViewKey | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const hint = isEditViewKey(categoryParam) ? categoryParam : null;
    setStatus("loading");
    (async () => {
      try {
        const product = await getProductById(productId);
        if (cancelled) return;
        const key = editKeyForProduct(product) ?? hint;
        if (key) {
          setCategory(key);
          setStatus("ready");
        } else {
          setErrorMessage("Could not determine this product's category.");
          setStatus("error");
        }
      } catch (err) {
        if (cancelled) return;
        if (hint) {
          setCategory(hint);
          setStatus("ready");
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to load product.",
          );
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, categoryParam]);

  const renderForm = () => {
    switch (category) {
      case "editDrug":
        return <DrugForm productId={productId} mode="edit" />;
      case "editConsumable":
        return <ConsumableForm productId={productId} mode="edit" />;
      case "editNonConsumable":
        return <NonConsumableForm productId={productId} mode="edit" />;
      case "editSupplement":
        return <SupplementForm productId={productId} mode="edit" />;
      case "editFoodInfant":
        return <FoodInfantForm productId={productId} mode="edit" />;
      case "editCosmetic":
        return <CosmeticForm productId={productId} mode="edit" />;
      default:
        return null;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-64 font-open-sans">
        <p className="text-p3 text-pneutral-700">{errorMessage}</p>
        <button
          type="button"
          onClick={() => router.push("/seller_7a3b9f2c/products")}
          className="px-4 py-2 rounded-lg border border-primary-900 text-primary-900 font-semibold cursor-pointer"
        >
          Back to products
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {renderForm()}
    </div>
  );
}
