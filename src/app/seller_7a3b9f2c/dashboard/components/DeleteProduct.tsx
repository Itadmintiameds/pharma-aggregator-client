"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Search, 
  Filter, 
  Trash2, 
  AlertTriangle,
  Package,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

// Mock product data (same as ViewProducts)
const mockProducts = [
  {
    id: "PRD001",
    name: "Paracetamol 500mg",
    category: "Pain Management",
    price: "₹45.00",
    stock: 1250,
    status: "in-stock",
    expiryDate: "2025-12-31",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Sun Pharma",
    selected: false,
  },
  {
    id: "PRD002",
    name: "Amoxicillin 250mg",
    category: "Antibiotics",
    price: "₹120.00",
    stock: 45,
    status: "low-stock",
    expiryDate: "2024-08-15",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Cipla",
    selected: false,
  },
  {
    id: "PRD003",
    name: "Vitamin D3 60K IU",
    category: "Vitamins",
    price: "₹89.00",
    stock: 350,
    status: "in-stock",
    expiryDate: "2026-03-20",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Abbott",
    selected: false,
  },
  {
    id: "PRD004",
    name: "Metformin 500mg",
    category: "Diabetes Care",
    price: "₹65.00",
    stock: 8,
    status: "low-stock",
    expiryDate: "2024-11-10",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Lupin",
    selected: false,
  },
  {
    id: "PRD005",
    name: "Aspirin 75mg",
    category: "Cardiovascular",
    price: "₹32.00",
    stock: 0,
    status: "out-of-stock",
    expiryDate: "2025-05-05",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Bayer",
    selected: false,
  },
  {
    id: "PRD006",
    name: "Omeprazole 20mg",
    category: "Gastroenterology",
    price: "₹78.00",
    stock: 210,
    status: "in-stock",
    expiryDate: "2025-09-18",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Dr. Reddy's",
    selected: false,
  },
  {
    id: "PRD007",
    name: "Cetirizine 10mg",
    category: "Allergy",
    price: "₹28.00",
    stock: 500,
    status: "in-stock",
    expiryDate: "2025-07-22",
    image: "/icons/product-placeholder.svg",
    manufacturer: "GSK",
    selected: false,
  },
  {
    id: "PRD008",
    name: "Insulin Glargine",
    category: "Diabetes Care",
    price: "₹450.00",
    stock: 15,
    status: "low-stock",
    expiryDate: "2024-06-30",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Sanofi",
    selected: false,
  },
  {
    id: "PRD009",
    name: "Azithromycin 500mg",
    category: "Antibiotics",
    price: "₹185.00",
    stock: 75,
    status: "in-stock",
    expiryDate: "2025-10-12",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Pfizer",
    selected: false,
  },
  {
    id: "PRD010",
    name: "Calcium + Vitamin D",
    category: "Vitamins",
    price: "₹120.00",
    stock: 180,
    status: "in-stock",
    expiryDate: "2026-01-08",
    image: "/icons/product-placeholder.svg",
    manufacturer: "Abbott",
    selected: false,
  },
];

const DeleteProduct = () => {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectAll, setSelectAll] = useState(false);

  const itemsPerPage = 5;

  // Get unique categories for filter
  const categories = ["All", ...new Set(products.map(p => p.category))];
  const statuses = ["All", "in-stock", "low-stock", "out-of-stock"];

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Handle select all
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setProducts(products.map(p => 
      filteredProducts.some(fp => fp.id === p.id) 
        ? { ...p, selected: newSelectAll }
        : p
    ));
  };

  // Handle single product selection
  const handleSelect = (productId: string) => {
    setProducts(products.map(p =>
      p.id === productId ? { ...p, selected: !p.selected } : p
    ));
    setSelectAll(false);
  };

  // Get selected products count
  const selectedCount = products.filter(p => p.selected).length;

  // Handle single delete
  const handleDeleteClick = (product: any) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setProducts(products.filter(p => p.id !== selectedProduct.id));
    toast.success(`${selectedProduct.name} deleted successfully`);
    setShowDeleteModal(false);
    setSelectedProduct(null);
  };

  // Handle bulk delete
  const handleBulkDeleteClick = () => {
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    const selectedIds = products.filter(p => p.selected).map(p => p.id);
    setProducts(products.filter(p => !selectedIds.includes(p.id)));
    toast.success(`${selectedCount} products deleted successfully`);
    setShowBulkDeleteModal(false);
    setSelectAll(false);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      "in-stock": { bg: "bg-success-50", text: "text-success-700", label: "In Stock", icon: CheckCircle },
      "low-stock": { bg: "bg-warning-50", text: "text-warning-700", label: "Low Stock", icon: AlertCircle },
      "out-of-stock": { bg: "bg-neutral-100", text: "text-neutral-700", label: "Out of Stock", icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["out-of-stock"];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h5 font-bold text-neutral-900">Delete Products</h2>
          <p className="text-p3 text-neutral-500">Select and remove products from your inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 px-4 py-2 rounded-lg">
            <p className="text-xs text-neutral-500">Total Products</p>
            <p className="text-xl font-bold text-primary-900">{products.length}</p>
          </div>
          {selectedCount > 0 && (
            <div className="bg-warning-50 px-4 py-2 rounded-lg">
              <p className="text-xs text-neutral-500">Selected</p>
              <p className="text-xl font-bold text-warning-700">{selectedCount}</p>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by product name, ID, or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-neutral-200 bg-base-white focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="h-11 px-4 rounded-lg border border-neutral-200 bg-base-white flex items-center gap-2 hover:bg-neutral-50 transition-colors"
        >
          <Filter size={18} className="text-neutral-600" />
          <span className="text-sm text-neutral-700">Filters</span>
        </button>
        {selectedCount > 0 && (
          <button
            onClick={handleBulkDeleteClick}
            className="h-11 px-4 rounded-lg bg-warning-600 text-white flex items-center gap-2 hover:bg-warning-700 transition-colors"
          >
            <Trash2 size={18} />
            <span className="text-sm font-medium">Delete Selected ({selectedCount})</span>
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-700 mb-1 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-base-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-700 mb-1 block">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-base-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === "All" ? "All" : status.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-base-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={product.selected || false}
                    onChange={() => handleSelect(product.id)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Package size={20} className="text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                      <p className="text-xs text-neutral-500">ID: {product.id}</p>
                      <p className="text-xs text-neutral-500">{product.manufacturer}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-700">{product.category}</td>
                <td className="px-6 py-4 text-sm font-medium text-neutral-900">{product.price}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${
                    product.stock < 10 ? "text-warning-600" : "text-neutral-900"
                  }`}>
                    {product.stock} units
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={product.status} />
                </td>
                <td className="px-6 py-4 text-sm text-neutral-700">
                  {new Date(product.expiryDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="p-2 hover:bg-warning-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-warning-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-neutral-300 mb-3" />
            <p className="text-neutral-500">No products found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-neutral-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-warning-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={32} className="text-warning-600" />
              </div>
              <h3 className="text-h6 font-bold text-neutral-900 mb-2">Delete Product</h3>
              <p className="text-sm text-neutral-500">
                Are you sure you want to delete <span className="font-semibold text-neutral-900">"{selectedProduct.name}"</span>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-11 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-lg bg-warning-600 text-white hover:bg-warning-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-warning-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={32} className="text-warning-600" />
              </div>
              <h3 className="text-h6 font-bold text-neutral-900 mb-2">Delete Multiple Products</h3>
              <p className="text-sm text-neutral-500">
                Are you sure you want to delete <span className="font-semibold text-warning-600">{selectedCount}</span> selected products? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 h-11 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="flex-1 h-11 rounded-lg bg-warning-600 text-white hover:bg-warning-700 transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteProduct;