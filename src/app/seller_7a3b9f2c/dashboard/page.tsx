"use client";

import React, { useState, useEffect } from "react";
import SellerHeader from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerHeader";
import ViewProducts from "@/src/app/seller_7a3b9f2c/dashboard/components/ViewProducts";
import SellerSidebar from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerSidebar";
import SellerProfile from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerProfile";
import EditProduct from "@/src/app/seller_7a3b9f2c/dashboard/components/EditProduct";
import DashboardOverview from "@/src/app/seller_7a3b9f2c/dashboard/components/DashboardOverview";
import AddProduct from "@/src/app/seller_7a3b9f2c/dashboard/components/AddProduct";
import ProductView1 from "@/src/app/seller_7a3b9f2c/dashboard/components/ProductView1";
import { DashboardView } from "@/src/types/seller/dashboard";
import Reports from "./components/Reports";
import Products from "./components/Products";
import { X, Sparkles } from "lucide-react";

const SellerDashboard = () => {
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowWelcomePopup(false);
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
  };

  return (
    <div className="min-h-screen ">
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl animate-modal overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-linear-to-r from-primary-900 to-primary-700 px-8 py-6 relative">
              <button
                onClick={handleCloseWelcome}
                className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Sparkles size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Hello Seller ! Welcome to TiaMeds!
                  </h2>
                  <p className="text-white text-sm mt-1">
                    Your seller dashboard is ready
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-neutral-600 mb-6 text-lg">
                We&apos;re excited to have you on you own Dashboard! Click on
                Get Started !
              </p>

              <button
                onClick={handleCloseWelcome}
                className="w-full bg-primary-900 text-white py-3 rounded-xl font-semibold hover:bg-primary-800 transition-colors shadow-lg shadow-primary-900/20"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <SellerHeader currentView={currentView} setCurrentView={setCurrentView} />

      <div className="flex">
        {/* Left Sidebar Navigation */}
        <SellerSidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 ml-64 mt-16">
          {/* Render different views based on selection */}
          {/* {currentView === "overview" && <DashboardOverview setCurrentView={setCurrentView} />} */}
          {/*          
          <DashboardOverview
            currentView={currentView}
            setCurrentView={setCurrentView}
            selectedProductId={selectedProductId || ""}
            setSelectedProductId={setSelectedProductId}
          />

          {currentView === "product" && (
            <Products
              setCurrentView={setCurrentView}
              setSelectedProductId={setSelectedProductId}
            />
          )}
          {currentView === "addProduct" && <AddProduct />}
          {currentView === "editProduct" && (
            <EditProduct
              productId={selectedProductId || ""}
              setCurrentView={(view: DashboardView) => setCurrentView(view)}
              setSelectedProductId={setSelectedProductId}
              onCancel={() => setCurrentView("overview")}
            />
          )}
          {currentView === "viewProducts" && <ViewProducts />}
          {currentView === "profile" && <SellerProfile />}
          {currentView === "reports" && <Reports />}
          {currentView === "productView" && (
            <ProductView1
              productId={selectedProductId}
              setCurrentView={setCurrentView}
            />
          )} */}

          {currentView === "overview" || currentView.startsWith("edit") ? (
            <DashboardOverview
              currentView={currentView}
              setCurrentView={setCurrentView}
              selectedProductId={selectedProductId || ""}
              setSelectedProductId={setSelectedProductId}
            />
          ) : currentView === "product" ? (
            <Products
              setCurrentView={setCurrentView}
              setSelectedProductId={setSelectedProductId}
            />
          ) : currentView === "addProduct" ? (
            <AddProduct />
          ) : currentView === "editProduct" ? (
            <EditProduct
              productId={selectedProductId || ""}
              setCurrentView={setCurrentView}
              setSelectedProductId={setSelectedProductId}
              onCancel={() => setCurrentView("overview")}
            />
          ) : currentView === "viewProducts" ? (
            <ViewProducts />
          ) : currentView === "profile" ? (
            <SellerProfile />
          ) : currentView === "reports" ? (
            <Reports />
          ) : currentView === "productView" ? (
            <ProductView1
              productId={selectedProductId}
              setCurrentView={setCurrentView}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
