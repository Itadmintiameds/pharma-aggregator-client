"use client";

import React, { useState } from "react";

import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  FileText,
  ChevronDown,
  BarChart3,
  DownloadCloud,
  Printer
} from "lucide-react";
import toast from "react-hot-toast";

// Mock data for reports
const mockReports = {
  salesOverview: {
    totalRevenue: "₹45,67,890",
    totalOrders: 1234,
    averageOrderValue: "₹3,700",
    conversionRate: "3.2%",
    growth: "+12.5%",
  },
  monthlySales: [
    { month: "Jan", sales: 320000, orders: 98 },
    { month: "Feb", sales: 350000, orders: 105 },
    { month: "Mar", sales: 380000, orders: 112 },
    { month: "Apr", sales: 410000, orders: 125 },
    { month: "May", sales: 390000, orders: 118 },
    { month: "Jun", sales: 430000, orders: 135 },
    { month: "Jul", sales: 470000, orders: 148 },
    { month: "Aug", sales: 490000, orders: 156 },
    { month: "Sep", sales: 520000, orders: 168 },
    { month: "Oct", sales: 550000, orders: 175 },
    { month: "Nov", sales: 580000, orders: 182 },
    { month: "Dec", sales: 620000, orders: 195 },
  ],
  topProducts: [
    { name: "Paracetamol 500mg", sales: 12500, revenue: "₹5,62,500", growth: "+15%" },
    { name: "Vitamin D3 60K IU", sales: 8900, revenue: "₹7,92,100", growth: "+8%" },
    { name: "Amoxicillin 250mg", sales: 7600, revenue: "₹9,12,000", growth: "-2%" },
    { name: "Metformin 500mg", sales: 6500, revenue: "₹4,22,500", growth: "+22%" },
    { name: "Aspirin 75mg", sales: 5400, revenue: "₹1,72,800", growth: "+5%" },
  ],
  categoryPerformance: [
    { category: "Drugs", revenue: "₹18,50,000", orders: 523, growth: "+12%" },
    { category: "Supplements", revenue: "₹12,30,000", orders: 345, growth: "+18%" },
    { category: "Medical Devices", revenue: "₹8,90,000", orders: 156, growth: "-3%" },
    { category: "Cosmetics", revenue: "₹4,20,000", orders: 128, growth: "+25%" },
    { category: "Food & Nutrition", revenue: "₹1,77,890", orders: 82, growth: "+7%" },
  ],
  recentTransactions: [
    { id: "TRX001", date: "2024-03-15", customer: "City Hospital", amount: "₹45,000", status: "completed" },
    { id: "TRX002", date: "2024-03-15", customer: "MedPlus Pharmacy", amount: "₹12,500", status: "pending" },
    { id: "TRX003", date: "2024-03-14", customer: "Apollo Pharmacy", amount: "₹89,000", status: "completed" },
    { id: "TRX004", date: "2024-03-14", customer: "Wellness Clinic", amount: "₹23,000", status: "processing" },
    { id: "TRX005", date: "2024-03-13", customer: "Care Hospital", amount: "₹67,500", status: "completed" },
    { id: "TRX006", date: "2024-03-13", customer: "Generic Pharmacy", amount: "₹8,900", status: "cancelled" },
  ],
  inventoryStatus: {
    totalProducts: 156,
    lowStock: 8,
    outOfStock: 3,
    expiringSoon: 12,
  },
};

type ReportType = "sales" | "products" | "inventory" | "financial" | "customers";
type DateRange = "today" | "week" | "month" | "quarter" | "year" | "custom";

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>("sales");
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    toast.success(`Exporting report as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    toast.success("Preparing report for print");
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "completed": return "bg-success-100 text-success-700";
      case "pending": return "bg-warning-100 text-warning-700";
      case "processing": return "bg-primary-100 text-primary-700";
      case "cancelled": return "bg-neutral-100 text-neutral-700";
      default: return "bg-neutral-100 text-neutral-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h5 font-bold text-neutral-900">Reports & Analytics</h2>
          <p className="text-p3 text-neutral-500">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="h-10 px-4 rounded-lg border border-neutral-200 bg-white flex items-center gap-2 hover:bg-neutral-50 transition-colors"
            >
              <Calendar size={16} className="text-neutral-500" />
              <span className="text-sm text-neutral-700">
                {dateRange === "today" && "Today"}
                {dateRange === "week" && "This Week"}
                {dateRange === "month" && "This Month"}
                {dateRange === "quarter" && "This Quarter"}
                {dateRange === "year" && "This Year"}
                {dateRange === "custom" && "Custom Range"}
              </span>
              <ChevronDown size={14} className="text-neutral-500" />
            </button>
            
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 p-4 z-10">
                <div className="space-y-2">
                  <button
                    onClick={() => { setDateRange("today"); setShowDatePicker(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 rounded"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => { setDateRange("week"); setShowDatePicker(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 rounded"
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => { setDateRange("month"); setShowDatePicker(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 rounded"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => { setDateRange("quarter"); setShowDatePicker(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 rounded"
                  >
                    This Quarter
                  </button>
                  <button
                    onClick={() => { setDateRange("year"); setShowDatePicker(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 rounded"
                  >
                    This Year
                  </button>
                  <div className="border-t border-neutral-200 my-2"></div>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded border border-neutral-200"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded border border-neutral-200"
                      placeholder="End Date"
                    />
                    <button
                      onClick={() => { setDateRange("custom"); setShowDatePicker(false); }}
                      className="w-full px-3 py-2 bg-primary-900 text-white text-sm rounded hover:bg-primary-800"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="h-10 px-4 rounded-lg border border-neutral-200 bg-white flex items-center gap-2 hover:bg-neutral-50 transition-colors">
              <Download size={16} className="text-neutral-500" />
              <span className="text-sm text-neutral-700">Export</span>
              <ChevronDown size={14} className="text-neutral-500" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 hidden group-hover:block z-10">
              <button onClick={() => handleExport("pdf")} className="w-full text-left px-4 py-2 text-sm hover:bg-primary-50 flex items-center gap-2">
                <FileText size={14} /> Export as PDF
              </button>
              <button onClick={() => handleExport("excel")} className="w-full text-left px-4 py-2 text-sm hover:bg-primary-50 flex items-center gap-2">
                <BarChart3 size={14} /> Export as Excel
              </button>
              <button onClick={() => handleExport("csv")} className="w-full text-left px-4 py-2 text-sm hover:bg-primary-50 flex items-center gap-2">
                <DownloadCloud size={14} /> Export as CSV
              </button>
              <div className="border-t border-neutral-200 my-1"></div>
              <button onClick={handlePrint} className="w-full text-left px-4 py-2 text-sm hover:bg-primary-50 flex items-center gap-2">
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex border-b border-neutral-200">
        {[
          { id: "sales", label: "Sales Report", icon: TrendingUp },
          { id: "products", label: "Products Report", icon: Package },
          { id: "inventory", label: "Inventory Report", icon: ShoppingBag },
          { id: "financial", label: "Financial Report", icon: DollarSign },
          { id: "customers", label: "Customers Report", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id as ReportType)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedReport === tab.id
                  ? "border-primary-900 text-primary-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} className="text-primary-600" />
            <span className={`text-xs font-medium ${mockReports.salesOverview.growth.startsWith('+') ? 'text-success-600' : 'text-warning-600'} bg-success-50 px-2 py-1 rounded`}>
              {mockReports.salesOverview.growth}
            </span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{mockReports.salesOverview.totalRevenue}</p>
          <p className="text-sm text-neutral-500">Total Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag size={24} className="text-secondary-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{mockReports.salesOverview.totalOrders}</p>
          <p className="text-sm text-neutral-500">Total Orders</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} className="text-tertiary-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{mockReports.salesOverview.averageOrderValue}</p>
          <p className="text-sm text-neutral-500">Average Order Value</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} className="text-success-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{mockReports.salesOverview.conversionRate}</p>
          <p className="text-sm text-neutral-500">Conversion Rate</p>
        </div>
      </div>

      {/* Sales Chart (if sales report selected) */}
      {selectedReport === "sales" && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
          <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Monthly Sales Trend</h3>
          <div className="h-64 flex items-end gap-2">
            {mockReports.monthlySales.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary-100 rounded-t-lg hover:bg-primary-200 transition-colors relative group"
                  style={{ height: `${(item.sales / 700000) * 200}px` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    ₹{(item.sales / 100000).toFixed(1)}L • {item.orders} orders
                  </div>
                </div>
                <span className="text-xs text-neutral-500">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout for Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Products */}
          {selectedReport === "products" && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
              <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Top Selling Products</h3>
              <div className="space-y-4">
                {mockReports.topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-700">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.sales.toLocaleString()} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900">{product.revenue}</p>
                      <p className={`text-xs ${product.growth.startsWith('+') ? 'text-success-600' : 'text-warning-600'}`}>
                        {product.growth}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Status */}
          {selectedReport === "inventory" && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
              <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Inventory Status</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-success-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-success-700">{mockReports.inventoryStatus.totalProducts}</p>
                  <p className="text-xs text-neutral-600">Total Products</p>
                </div>
                <div className="p-4 bg-warning-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-warning-700">{mockReports.inventoryStatus.lowStock}</p>
                  <p className="text-xs text-neutral-600">Low Stock</p>
                </div>
                <div className="p-4 bg-neutral-100 rounded-lg text-center">
                  <p className="text-2xl font-bold text-neutral-700">{mockReports.inventoryStatus.outOfStock}</p>
                  <p className="text-xs text-neutral-600">Out of Stock</p>
                </div>
                <div className="p-4 bg-primary-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary-700">{mockReports.inventoryStatus.expiringSoon}</p>
                  <p className="text-xs text-neutral-600">Expiring Soon</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-700">Stock Level Distribution</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>In Stock</span>
                      <span>75%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-success-500 rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Low Stock</span>
                      <span>15%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-warning-500 rounded-full" style={{ width: "15%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Out of Stock</span>
                      <span>10%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-500 rounded-full" style={{ width: "10%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
            <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {mockReports.recentTransactions.map((trx) => (
                <div key={trx.id} className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{trx.customer}</p>
                    <p className="text-xs text-neutral-500">{trx.id} • {new Date(trx.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">{trx.amount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(trx.status)}`}>
                      {trx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Category Performance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
            <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Category Performance</h3>
            <div className="space-y-4">
              {mockReports.categoryPerformance.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-neutral-700">{cat.category}</p>
                    <span className={`text-xs ${cat.growth.startsWith('+') ? 'text-success-600' : 'text-warning-600'}`}>
                      {cat.growth}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>{cat.revenue}</span>
                    <span>{cat.orders} orders</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 rounded-full" 
                      style={{ width: `${(parseInt(cat.revenue.replace(/[^0-9]/g, '')) / 1850000) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
            <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Quick Insights</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg">
                <TrendingUp size={18} className="text-primary-600 mt-0.5" />
                <div>
                  <p className="text-xs text-primary-700 font-medium">Best Performing Day</p>
                  <p className="text-sm font-semibold text-primary-900">Friday • Avg ₹2.5L</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-success-50 rounded-lg">
                <Package size={18} className="text-success-600 mt-0.5" />
                <div>
                  <p className="text-xs text-success-700 font-medium">Most Ordered Product</p>
                  <p className="text-sm font-semibold text-success-900">Paracetamol 500mg</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg">
                <Users size={18} className="text-warning-600 mt-0.5" />
                <div>
                  <p className="text-xs text-warning-700 font-medium">Top Customer</p>
                  <p className="text-sm font-semibold text-warning-900">City Hospital • ₹4.5L</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
            <h3 className="text-h6 font-semibold text-neutral-900 mb-4">Export Summary</h3>
            <div className="space-y-3">
              <button className="w-full p-3 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <span className="text-sm text-neutral-700">Monthly Sales Report</span>
                <Download size={16} className="text-neutral-500" />
              </button>
              <button className="w-full p-3 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <span className="text-sm text-neutral-700">Product Catalog</span>
                <Download size={16} className="text-neutral-500" />
              </button>
              <button className="w-full p-3 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <span className="text-sm text-neutral-700">Inventory Status</span>
                <Download size={16} className="text-neutral-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;