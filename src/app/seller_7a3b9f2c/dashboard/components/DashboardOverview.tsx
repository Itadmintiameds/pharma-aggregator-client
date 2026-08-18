"use client";

import React from "react";
import { CircleDashed } from "lucide-react";
import { HiOutlineCircleStack, HiOutlineUserGroup } from "react-icons/hi2";
import { BsHandbag } from "react-icons/bs";
import { AiOutlinePieChart } from "react-icons/ai";
import { useSellerOrders } from "@/src/hooks/useSellerOrders";
import DashboardFilters from "./DashboardFilters";
import KpiCard from "./KpiCard";
import SalesChart from "./SalesChart";
import TopSellingCard from "./TopSellingCard";
import WeeklySummaryCard from "./WeeklySummaryCard";
import ProductTable from "./ProductTable";
import { DashboardView } from "@/src/types/seller/dashboard";
import ProductList from "./ProductList";
import MedicalDevicesForm from "./MedicalDevicesForm";
import { DrugForm } from "./DrugForm";
import SupplementForm from "./SupplementForm";
import FoodInfantForm from "./FoodInfantForm";
import CosmeticForm from "./CosmeticForm";
import ConsumableForm from "./ConsumableForm";
import NonConsumableForm from "./NonConsumableForm";
import OnboardingGate from "./OnboardingGate";

// interface DashboardOverviewProps {
//   setCurrentView: (view: DashboardView) => void;
// }

interface DashboardOverviewProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
}

// const DashboardOverview = ( { setCurrentView }: DashboardOverviewProps) => {
const DashboardOverview = ({
  currentView,
  setCurrentView,
  setSelectedProductId,
  selectedProductId,
}: DashboardOverviewProps) => {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { orders, error: ordersError } = useSellerOrders();

  const totalOrders = orders?.length ?? null;
  const newOrders = orders?.filter((o) => o.status === "PLACED").length ?? null;
  const completedOrders = orders?.filter((o) => o.status === "DELIVERED").length ?? null;
  const pendingOrders =
    orders?.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length ?? null;
  const totalSales =
    orders
      ?.filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + (o.grandTotal ?? 0), 0) ?? null;

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
      {/* Filters */}
      <DashboardFilters 
        setCurrentView={setCurrentView} 
        onRefreshRequested={() => setRefreshKey((prev) => prev + 1)} 
      />

      {/* KPI Cards */}
      {ordersError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-p3 font-body text-red-700">{ordersError}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Orders"
          value={totalOrders ?? "..."}
          icon={<HiOutlineCircleStack size={22} />}
          style={{ backgroundColor: "#DED0FE" }}
        />

        <KpiCard
          title="New Orders"
          value={newOrders ?? "..."}
          icon={<BsHandbag size={20} />}
          className="bg-white"
        />

        <KpiCard
          title="Pending Orders"
          value={pendingOrders ?? "..."}
          icon={<CircleDashed size={20} />}
          className="bg-white"
        />

        <KpiCard
          title="Completed Orders"
          value={completedOrders ?? "..."}
          icon={<CircleDashed size={20} />}
          className="bg-white"
        />
      </div>
      {/* Chart + Top Selling Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-h-[324px]">
          <SalesChart />
        </div>
        <div className="min-h-[324px]">
          <TopSellingCard />
        </div>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WeeklySummaryCard
          icon={<AiOutlinePieChart size={36} />}
          titleLeft="Sales"
          valueLeft={totalSales !== null ? `Rs.${totalSales.toFixed(2)}` : "..."}
          titleRight="Volume"
          valueRight={totalOrders !== null ? String(totalOrders) : "..."}
        />

        <WeeklySummaryCard
          icon={<HiOutlineUserGroup size={36} />}
          titleLeft="Customers"
          valueLeft="1,250"
          growthLeft="+15.80%"
          titleRight="Active"
          valueRight="1,180"
          growthRight="85%"
          bgColor="bg-yellow-50"
        />

        <WeeklySummaryCard
          icon={<BsHandbag size={36} />}
          titleLeft="All Orders"
          valueLeft={totalOrders !== null ? String(totalOrders) : "..."}
          titleRight="Completed"
          valueRight={completedOrders !== null ? String(completedOrders) : "..."}
          pendingCount={pendingOrders !== null ? String(pendingOrders) : "..."}
          isThreeColumn
          bgColor="bg-yellow-50"
        />
      </div>

      <ProductList
        setCurrentView={setCurrentView}
        setSelectedProductId={setSelectedProductId}
        refreshKey={refreshKey}
      />
    </div>
    </OnboardingGate>
  );
};

export default DashboardOverview;
