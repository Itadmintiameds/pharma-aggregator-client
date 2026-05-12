"use client";

import React, { useState } from "react";
import DashboardOverview from "./components/DashboardOverview";
import { DashboardView } from "@/src/types/seller/dashboard";

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  return (
    <DashboardOverview
      currentView={currentView}
      setCurrentView={setCurrentView}
      selectedProductId={selectedProductId || ""}
      setSelectedProductId={setSelectedProductId}
    />
  );
}