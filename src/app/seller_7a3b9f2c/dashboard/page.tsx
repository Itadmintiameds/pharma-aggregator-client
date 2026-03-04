"use client";

import React, { useState, useEffect } from "react";
import SellerHeader from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerHeader";
import ViewProducts from "@/src/app/seller_7a3b9f2c/dashboard/components/ViewProducts";
import SellerSidebar from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerSidebar";
import SellerProfile from "@/src/app/seller_7a3b9f2c/dashboard/components/SellerProfile";
import DeleteProduct from "@/src/app/seller_7a3b9f2c/dashboard/components/DeleteProduct";
import DashboardOverview from "@/src/app/seller_7a3b9f2c/dashboard/components/DashboardOverview";
import AddProduct from "@/src/app/seller_7a3b9f2c/dashboard/components/AddProduct";
import { DashboardView } from "@/src/types/seller/dashboard";
import Reports from "./components/Reports";
import Products from "./components/Products"; 
import { X, Sparkles } from "lucide-react";


const SellerDashboard = () => {
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowWelcomePopup(true);
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
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
                  <h2 className="text-2xl font-bold text-white">Hello Seller ! Welcome to TiaMeds!</h2>
                  <p className="text-white text-sm mt-1">Your seller dashboard is ready</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8">
              <p className="text-neutral-600 mb-6 text-lg">
                We&apos;re excited to have you on you own Dashboard! Click on Get Started !
              </p>
              
              {/* Commented out for future use */}
              {/* <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-primary-05 p-4 rounded-xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="bg-primary-100 p-2 rounded-lg mb-2">
                    <Package size={24} className="text-primary-900" />
                  </div>
                  <h3 className="font-semibold text-primary-900 text-sm">Manage Products</h3>
                  <p className="text-xs text-neutral-600 mt-1">Add, edit, or remove products</p>
                </div>
                
                <div className="bg-secondary-50 p-4 rounded-xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="bg-secondary-200 p-2 rounded-lg mb-2">
                    <ShoppingBag size={24} className="text-secondary-800" />
                  </div>
                  <h3 className="font-semibold text-secondary-800 text-sm">Track Orders</h3>
                  <p className="text-xs text-neutral-600 mt-1">Monitor and fulfill orders</p>
                </div>
                
                <div className="bg-tertiary-50 p-4 rounded-xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="bg-tertiary-200 p-2 rounded-lg mb-2">
                    <BarChart3 size={24} className="text-tertiary-800" />
                  </div>
                  <h3 className="font-semibold text-tertiary-800 text-sm">View Reports</h3>
                  <p className="text-xs text-neutral-600 mt-1">Track sales performance</p>
                </div>
                
                <div className="bg-success-50 p-4 rounded-xl flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="bg-success-200 p-2 rounded-lg mb-2">
                    <UserCheck size={24} className="text-success-700" />
                  </div>
                  <h3 className="font-semibold text-success-700 text-sm">Profile Setup</h3>
                  <p className="text-xs text-neutral-600 mt-1">Update business details</p>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-900 text-white text-xs font-bold px-2 py-1 rounded-full">TIP</div>
                  <p className="text-sm text-neutral-600">Start by adding your first product to showcase your inventory to potential buyers!</p>
                </div>
              </div> */}

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
          {/* Welcome Message - Commented out for future use */}
          {/* <div className="mb-6 bg-primary-05 p-4 rounded-lg">
            <h1 className="text-h5 font-semibold text-primary-900">Welcome back, Seller!</h1>
          </div> */}

          {/* Render different views based on selection */}
          {currentView === "overview" && <DashboardOverview setCurrentView={setCurrentView} />}
          {currentView === "addProduct" && <AddProduct />}
          {currentView === "viewProducts" && <ViewProducts />}
          {currentView === "deleteProduct" && <DeleteProduct />}
          {currentView === "profile" && <SellerProfile />}
          {currentView === "reports" && <Reports />}
          {currentView === "product" && <Products />}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;