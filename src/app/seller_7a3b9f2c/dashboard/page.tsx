"use client";

import React, { useState } from "react";
import SellerHeader from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerHeader";
import ViewProducts from "@/src/app/seller_7a3b9f2c/dashboard/components/ViewProducts";
import SellerSidebar from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerSidebar";
import SellerProfile from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerProfile";
import DeleteProduct from "@/src/app/seller_7a3b9f2c/dashboard/components/DeleteProduct";
import DashboardOverview from "@/src/app/seller_7a3b9f2c/dashboard/components/DashboardOverview";
import AddProduct from "@/src/app/seller_7a3b9f2c/dashboard/components/AddProduct";
import Reports from "./components/Reports";


type DashboardView = "overview" | "addProduct" | "viewProducts" | "deleteProduct" | "profile" | "reports";

const SellerDashboard = () => {
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome back, Seller!");

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Navigation */}
      <SellerHeader 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <div className="flex">
        {/* Left Sidebar Navigation */}
        <SellerSidebar 
          currentView={currentView}
          setCurrentView={setCurrentView}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 ml-64 mt-16">
          {/* Welcome Message */}
          <div className="mb-6 bg-primary-05 p-4 rounded-lg">
            <h1 className="text-h5 font-semibold text-primary-900">{welcomeMessage}</h1>
          </div>

          {/* Render different views based on selection */}
          {currentView === "overview" && <DashboardOverview />}
          {currentView === "addProduct" && <AddProduct />}
          {currentView === "viewProducts" && <ViewProducts />}
          {currentView === "deleteProduct" && <DeleteProduct />}
          {currentView === "profile" && <SellerProfile />}
          {currentView === "reports" && <Reports />}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;