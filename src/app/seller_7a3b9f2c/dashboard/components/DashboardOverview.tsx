"use client";

import React from "react";
  import SellerOverview from "./overview/SellerOverview";
import { DashboardView } from "@/src/types/seller/dashboard";
import MedicalDevicesForm from "./MedicalDevicesForm";
import { DrugForm } from "./DrugForm";
import SupplementForm from "./SupplementForm";
import FoodInfantForm from "./FoodInfantForm";
import CosmeticForm from "./CosmeticForm";
import ConsumableForm from "./ConsumableForm";
import NonConsumableForm from "./NonConsumableForm";
import OnboardingGate from "./OnboardingGate";

interface DashboardOverviewProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
}

// const DashboardOverview = ( { setCurrentView }: DashboardOverviewProps) => {
const DashboardOverview = ({
  currentView,
  selectedProductId,
}: DashboardOverviewProps) => {
  if (currentView === "editDrug") {
    if (!selectedProductId) {
      return <div>Loading...</div>; // ✅ prevents blank screen
    }

    return <DrugForm productId={selectedProductId} mode="edit" />;
  }
  if (currentView === "editSupplement") {
    if (!selectedProductId) {
      return <div>Loading...</div>;
    }
    return <SupplementForm productId={selectedProductId} mode="edit" />;
  }

  // if (currentView === "editFoodInfant") {
  //   return <FoodInfantForm productId={selectedProductId} mode="edit" />;
  // }

  // if (currentView === "editCosmetic") {
  //   return <CosmeticForm productId={selectedProductId} mode="edit" />;
  // }


  if (currentView === "editFoodInfant") {
  if (!selectedProductId) {
    return <div>Loading...</div>;
  }
  return <FoodInfantForm productId={selectedProductId} mode="edit" />;
}

  if (currentView === "editConsumable") {
    if (!selectedProductId) {
      return <div>Loading...</div>;
    }
    return <ConsumableForm productId={selectedProductId} mode="edit" />;
  }

  if (currentView === "editNonConsumable") {
    if (!selectedProductId) {
      return <div>Loading...</div>;
    }
    return <NonConsumableForm productId={selectedProductId} mode="edit" />;
  }

  return (
    <OnboardingGate>
    <div className="space-y-8">
      <SellerOverview />
    </div>
    </OnboardingGate>
  );
};

export default DashboardOverview;
