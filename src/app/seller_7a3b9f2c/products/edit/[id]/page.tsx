"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { DrugForm } from "../../../dashboard/components/DrugForm";
import ConsumableForm from "../../../dashboard/components/ConsumableForm";
import NonConsumableForm from "../../../dashboard/components/NonConsumableForm";
import SupplementForm from "../../../dashboard/components/SupplementForm";
import FoodInfantForm from "../../../dashboard/components/FoodInfantForm";
import CosmeticForm from "../../../dashboard/components/CosmeticForm";

export default function EditProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = params.id as string;
  const category = searchParams.get("category") ?? "editDrug";

  const handleBack = () => {
    router.push(`/seller_7a3b9f2c/products/view/${productId}`);
  };

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
      // case "editCosmetic":
      //   return <CosmeticForm productId={productId} mode="edit" />;
      default:
        return <DrugForm productId={productId} mode="edit" />;
    }
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div style={{ marginBottom: 16 }}>
        {/* <button
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9F75FC",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Open Sans', sans-serif",
            padding: 0,
          }}
        >
          ← Back to Product
        </button> */}
      </div>
      {renderForm()}
    </div>
  );
}