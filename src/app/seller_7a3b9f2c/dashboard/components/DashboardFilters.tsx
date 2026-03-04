"use client";

import React from "react";
import { Plus } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";

interface DashboardFiltersProps {
  setCurrentView: (view: DashboardView) => void;
}

const DashboardFilters = ({ setCurrentView }: DashboardFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      
      {/* All Stocks */}
      <select className="h-11 w-50 px-4 rounded-md border border-neutral-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-50">
        <option>All Stocks</option>
        <option>Low Stock</option>
        <option>Out of Stock</option>
      </select>

      {/* All Categories */}
      <select className="h-11 w-50 px-4 rounded-md border border-neutral-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-50">
        <option>All Categories</option>
        <option>Drugs</option>
        <option>Vitamins</option>
        <option>Diabetes</option>
      </select>

      {/* Add Button */}
      <button 
        onClick={() => setCurrentView("addProduct")}
        className="h-11 w-50 flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-800 text-white rounded-md shadow-md transition"
      >
        <Plus size={18} />
        Add New Product
      </button>

    </div>
  );
};

export default DashboardFilters;