"use client";

import React from "react";
import { 
  Package, 
  ShoppingBag, 
  Clock, 
  CheckCircle,
  TrendingUp,
  FileText
} from "lucide-react";

const DashboardOverview = () => {
  // Mock data - replace with actual API data
  const metrics = {
    totalProducts: 156,
    categories: 12,
    orders: {
      new: 8,
      inProgress: 15,
      completed: 124,
    },
    rfqs: 23,
  };

  const categories = [
    { name: "Antibiotics", count: 45 },
    { name: "Pain Management", count: 32 },
    { name: "Cardiovascular", count: 28 },
    { name: "Diabetes Care", count: 21 },
    { name: "Vitamins", count: 18 },
    { name: "Others", count: 12 },
  ];

  const recentOrders = [
    { id: "ORD001", customer: "City Hospital", status: "new", amount: "₹45,000" },
    { id: "ORD002", customer: "MedPlus Pharmacy", status: "inProgress", amount: "₹12,500" },
    { id: "ORD003", customer: "Apollo Pharmacy", status: "completed", amount: "₹89,000" },
    { id: "ORD004", customer: "Wellness Clinic", status: "new", amount: "₹23,000" },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "new": return "bg-primary-100 text-primary-900";
      case "inProgress": return "bg-tertiary-100 text-tertiary-800";
      case "completed": return "bg-success-100 text-success-800";
      default: return "bg-neutral-100 text-neutral-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Row */}
      <div>
        <h2 className="text-h4 font-bold text-neutral-900">Seller Insights Dashboard</h2>
        <p className="text-p3 text-neutral-500">Track your performance and manage your inventory</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products Onboarded */}
        <div className="bg-base-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <Package size={24} className="text-primary-600" />
            <span className="text-xs text-success-600 bg-success-50 px-2 py-1 rounded">+12 this month</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{metrics.totalProducts}</p>
          <p className="text-sm text-neutral-500">Products Onboarded</p>
        </div>

        {/* Product Categories */}
        <div className="bg-base-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} className="text-secondary-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{metrics.categories}</p>
          <p className="text-sm text-neutral-500">Product Categories</p>
        </div>

        {/* RFQs Received */}
        <div className="bg-base-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <FileText size={24} className="text-tertiary-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{metrics.rfqs}</p>
          <p className="text-sm text-neutral-500">RFQs Received</p>
        </div>

        {/* Active Orders */}
        <div className="bg-base-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag size={24} className="text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{metrics.orders.new + metrics.orders.inProgress}</p>
          <p className="text-sm text-neutral-500">Active Orders</p>
        </div>
      </div>

      {/* Order Summary & Product Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="bg-base-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Order Summary</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-primary-700" />
                <span className="text-sm font-medium text-neutral-800">New Orders</span>
              </div>
              <span className="text-lg font-bold text-primary-900">{metrics.orders.new}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-tertiary-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-tertiary-700" />
                <span className="text-sm font-medium text-neutral-800">In Progress</span>
              </div>
              <span className="text-lg font-bold text-tertiary-800">{metrics.orders.inProgress}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-success-700" />
                <span className="text-sm font-medium text-neutral-800">Completed</span>
              </div>
              <span className="text-lg font-bold text-success-800">{metrics.orders.completed}</span>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">Recent Orders</h4>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{order.customer}</p>
                    <p className="text-xs text-neutral-500">{order.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-neutral-900">{order.amount}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Categories & Availability */}
        <div className="bg-base-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Product Categories</h3>
          
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{category.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-neutral-900">{category.count} products</span>
                  <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 rounded-full"
                      style={{ width: `${(category.count / metrics.totalProducts) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;