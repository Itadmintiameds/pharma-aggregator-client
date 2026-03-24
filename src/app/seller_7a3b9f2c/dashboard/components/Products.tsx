"use client";

import React from "react";
import ProductList from "./ProductList";

interface ProductsProps {
  setCurrentView: React.Dispatch<React.SetStateAction<any>>;
  setSelectedProductId: React.Dispatch<React.SetStateAction<string | null>>;
}

const Products = ({ setCurrentView, setSelectedProductId }: ProductsProps) => {
  return (
    <div>
      <ProductList
        setCurrentView={setCurrentView}
        setSelectedProductId={setSelectedProductId}
      />
    </div>
  );
};

export default Products;







// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Search,
//   Filter,
//   Edit,
//   Trash2,
//   Eye,
//   ChevronLeft,
//   ChevronRight,
//   Package,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   X,
//   Plus,
//   RefreshCw,
// } from "lucide-react";
// import toast from "react-hot-toast";

// // ─────────────────────────────────────────────
// // API
// // ─────────────────────────────────────────────

// const GET_ALL_PRODUCTS_URL =
//   "https://api-test-aggreator.tiameds.ai/api/v1/products/getAll";

// const DELETE_PRODUCT_URL = (id: string) =>
//   `https://api-test-aggreator.tiameds.ai/api/v1/products/delete/${id}`;

// async function deleteProduct(id: string): Promise<void> {
//   const response = await fetch(DELETE_PRODUCT_URL(id), {
//     method: "DELETE",
//     headers: { "Content-Type": "application/json" },
//   });

//   if (!response.ok) {
//     let msg = `Failed to delete product (${response.status})`;
//     try {
//       const err = await response.json();
//       msg = err?.message ?? err?.error ?? msg;
//     } catch {
//       // ignore parse error
//     }
//     throw new Error(msg);
//   }
// }

// interface ProductsProps {
//   setCurrentView: React.Dispatch<React.SetStateAction<any>>;
//   setSelectedProductId: React.Dispatch<React.SetStateAction<string | null>>;
// }

// // ─────────────────────────────────────────────
// // Types & normalisers
// // ─────────────────────────────────────────────

// interface Product {
//   id: string;
//   name: string;
//   category: string;
//   price: string;
//   stock: number;
//   status: "in-stock" | "low-stock" | "out-of-stock";
//   expiryDate: string;
//   manufacturer: string;
//   prescription: string;
//   _raw: any;
// }

// function deriveStatus(stock: number): Product["status"] {
//   if (stock <= 0) return "out-of-stock";
//   if (stock <= 50) return "low-stock";
//   return "in-stock";
// }

// function normaliseProduct(p: any): Product {
//   const pricing = p.pricingDetails?.[0] ?? p.pricing ?? {};

//   const stock = Number(
//     pricing.stockQuantity ?? p.stockQuantity ?? p.stock ?? 0
//   );

//   const mrp =
//     pricing.mrp ?? pricing.pricePerUnit ?? p.mrp ?? p.pricePerUnit ?? p.price ?? 0;

//   const expiryDate = pricing.expiryDate ?? p.expiryDate ?? "";

//   return {
//     id: String(p.productId ?? p.id ?? ""),
//     name: p.productName ?? p.name ?? "—",
//     category: p.therapeuticCategory ?? p.category ?? p.productCategoryId ?? "—",
//     price: mrp ? `₹${Number(mrp).toFixed(2)}` : "—",
//     stock,
//     status: deriveStatus(stock),
//     expiryDate: expiryDate ? String(expiryDate).slice(0, 10) : "",
//     manufacturer:
//       pricing.manufacturerName ?? p.manufacturerName ?? p.manufacturer ?? "—",
//     prescription: p.prescription ?? "—",
//     _raw: p,
//   };
// }

// async function fetchAllProducts(): Promise<Product[]> {
//   const response = await fetch(GET_ALL_PRODUCTS_URL, {
//     method: "GET",
//     headers: { "Content-Type": "application/json" },
//   });

//   if (!response.ok) {
//     let msg = `Failed to fetch products (${response.status})`;
//     try {
//       const err = await response.json();
//       msg = err?.message ?? err?.error ?? msg;
//     } catch {}
//     throw new Error(msg);
//   }

//   const data = await response.json();
//   const list: any[] = Array.isArray(data)
//     ? data
//     : Array.isArray(data?.data)
//     ? data.data
//     : Array.isArray(data?.products)
//     ? data.products
//     : [];

//   return list.map(normaliseProduct);
// }

// // ─────────────────────────────────────────────
// // Status Badge
// // ─────────────────────────────────────────────

// const StatusBadge = ({ status }: { status: string }) => {
//   const statusConfig: Record<
//     string,
//     { bg: string; text: string; label: string; icon: any }
//   > = {
//     "in-stock": {
//       bg: "bg-success-50",
//       text: "text-success-700",
//       label: "In Stock",
//       icon: CheckCircle,
//     },
//     "low-stock": {
//       bg: "bg-warning-50",
//       text: "text-warning-700",
//       label: "Low Stock",
//       icon: AlertCircle,
//     },
//     "out-of-stock": {
//       bg: "bg-neutral-100",
//       text: "text-neutral-700",
//       label: "Out of Stock",
//       icon: XCircle,
//     },
//   };

//   const config = statusConfig[status] ?? statusConfig["out-of-stock"];
//   const Icon = config.icon;

//   return (
//     <span
//       className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
//     >
//       <Icon size={12} />
//       {config.label}
//     </span>
//   );
// };

// // ─────────────────────────────────────────────
// // Main Component
// // ─────────────────────────────────────────────

// const Products = ({ setCurrentView, setSelectedProductId }: ProductsProps) => {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [selectedStatus, setSelectedStatus] = useState("All");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showFilter, setShowFilter] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [deleting, setDeleting] = useState(false);

//   const itemsPerPage = 8;

//   const loadProducts = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await fetchAllProducts();
//       setProducts(data);
//     } catch (err: any) {
//       setError(err?.message ?? "Unable to load products");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadProducts();
//   }, [loadProducts]);

//   const categories = [
//     "All",
//     ...Array.from(new Set(products.map((p) => p.category))).filter(Boolean),
//   ];
//   const statuses = ["All", "in-stock", "low-stock", "out-of-stock"];

//   const filteredProducts = products.filter((product) => {
//     const q = searchTerm.toLowerCase();
//     const matchesSearch =
//       product.name.toLowerCase().includes(q) ||
//       product.id.toLowerCase().includes(q) ||
//       product.manufacturer.toLowerCase().includes(q);
//     const matchesCategory =
//       selectedCategory === "All" || product.category === selectedCategory;
//     const matchesStatus =
//       selectedStatus === "All" || product.status === selectedStatus;
//     return matchesSearch && matchesCategory && matchesStatus;
//   });

//   const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedProducts = filteredProducts.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, selectedCategory, selectedStatus]);

//   const handleView = (product: Product) => {
//     setSelectedProduct(product);
//     setShowViewModal(true);
//   };

//   const handleEdit = (product: Product) => {
//     toast.success(`Editing ${product.name}`);
//   };

//   const handleDelete = (product: Product) => {
//     setSelectedProduct(product);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = async () => {
//     if (!selectedProduct) return;
//     setDeleting(true);
//     try {
//       await deleteProduct(selectedProduct.id);
//       // Remove from local state immediately — no need to refetch
//       setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
//       toast.success(`"${selectedProduct.name}" deleted successfully`);
//       setShowDeleteModal(false);
//       setSelectedProduct(null);
//     } catch (err: any) {
//       toast.error(err?.message ?? "Failed to delete product");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // ── Loading skeleton ──
//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <div className="h-6 w-28 bg-neutral-200 rounded animate-pulse mb-1" />
//             <div className="h-4 w-48 bg-neutral-100 rounded animate-pulse" />
//           </div>
//           <div className="h-10 w-36 bg-neutral-200 rounded-lg animate-pulse" />
//         </div>
//         <div className="grid grid-cols-4 gap-4">
//           {[...Array(4)].map((_, i) => (
//             <div key={i} className="bg-white p-4 rounded-lg border border-neutral-200 animate-pulse">
//               <div className="h-3 w-20 bg-neutral-200 rounded mb-2" />
//               <div className="h-7 w-10 bg-neutral-300 rounded" />
//             </div>
//           ))}
//         </div>
//         <div className="bg-white rounded-lg border border-neutral-200 p-8">
//           <div className="space-y-4">
//             {[...Array(6)].map((_, i) => (
//               <div key={i} className="flex gap-4 animate-pulse">
//                 <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
//                 <div className="flex-1 space-y-2">
//                   <div className="h-4 w-40 bg-neutral-200 rounded" />
//                   <div className="h-3 w-20 bg-neutral-100 rounded" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ── Error state ──
//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center py-24 space-y-4">
//         <div className="w-16 h-16 bg-warning-50 rounded-full flex items-center justify-center">
//           <AlertCircle size={32} className="text-warning-600" />
//         </div>
//         <p className="text-neutral-700 font-medium">Failed to load products</p>
//         <p className="text-sm text-neutral-500 max-w-sm text-center">{error}</p>
//         <button
//           onClick={loadProducts}
//           className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors text-sm"
//         >
//           <RefreshCw size={15} />
//           Retry
//         </button>
//       </div>
//     );
//   }

//   // ── Main render ──
//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-h5 font-bold text-neutral-900">Products</h2>
//           <p className="text-p3 text-neutral-500">Manage your product inventory</p>
//         </div>
//         <div className="flex items-center gap-3">
//           <button
//             onClick={loadProducts}
//             className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm text-neutral-700"
//             title="Refresh"
//           >
//             <RefreshCw size={15} />
//             Refresh
//           </button>
//           <button className="flex items-center gap-2 px-5 py-2.5 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors shadow-lg shadow-primary-900/20">
//             <Plus size={18} />
//             <span className="text-sm font-medium">Add New Product</span>
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-4 gap-4">
//         <div className="bg-white p-4 rounded-lg border border-neutral-200">
//           <p className="text-xs text-neutral-500">Total Products</p>
//           <p className="text-2xl font-bold text-primary-900">{products.length}</p>
//         </div>
//         <div className="bg-white p-4 rounded-lg border border-neutral-200">
//           <p className="text-xs text-neutral-500">In Stock</p>
//           <p className="text-2xl font-bold text-success-600">
//             {products.filter((p) => p.status === "in-stock").length}
//           </p>
//         </div>
//         <div className="bg-white p-4 rounded-lg border border-neutral-200">
//           <p className="text-xs text-neutral-500">Low Stock</p>
//           <p className="text-2xl font-bold text-warning-600">
//             {products.filter((p) => p.status === "low-stock").length}
//           </p>
//         </div>
//         <div className="bg-white p-4 rounded-lg border border-neutral-200">
//           <p className="text-xs text-neutral-500">Out of Stock</p>
//           <p className="text-2xl font-bold text-neutral-600">
//             {products.filter((p) => p.status === "out-of-stock").length}
//           </p>
//         </div>
//       </div>

//       {/* Search and Filter Bar */}
//       <div className="flex items-center gap-4">
//         <div className="flex-1 relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//           <input
//             type="text"
//             placeholder="Search by product name, ID, or manufacturer..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full h-11 pl-10 pr-4 rounded-lg border border-neutral-200 bg-base-white focus:outline-none focus:ring-2 focus:ring-primary-600"
//           />
//         </div>
//         <button
//           onClick={() => setShowFilter(!showFilter)}
//           className="h-11 px-4 rounded-lg border border-neutral-200 bg-base-white flex items-center gap-2 hover:bg-neutral-50 transition-colors"
//         >
//           <Filter size={18} className="text-neutral-600" />
//           <span className="text-sm text-neutral-700">Filters</span>
//         </button>
//       </div>

//       {/* Filter Panel */}
//       {showFilter && (
//         <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="text-xs font-medium text-neutral-700 mb-1 block">Category</label>
//               <select
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//                 className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-base-white focus:outline-none focus:ring-2 focus:ring-primary-600"
//               >
//                 {categories.map((cat) => (
//                   <option key={cat} value={cat}>{cat}</option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="text-xs font-medium text-neutral-700 mb-1 block">Status</label>
//               <select
//                 value={selectedStatus}
//                 onChange={(e) => setSelectedStatus(e.target.value)}
//                 className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-base-white focus:outline-none focus:ring-2 focus:ring-primary-600"
//               >
//                 {statuses.map((status) => (
//                   <option key={status} value={status}>
//                     {status === "All"
//                       ? "All"
//                       : status.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Products Table */}
//       <div className="bg-base-white rounded-lg border border-neutral-200 overflow-hidden">
//         <table className="w-full">
//           <thead className="bg-neutral-50 border-b border-neutral-200">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Product</th>
//               <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Category</th>
//               <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Price</th>
//               <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Stock</th>
//               <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Expiry Date</th>
//               <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-neutral-200">
//             {paginatedProducts.map((product) => (
//               <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
//                 <td className="px-6 py-4">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
//                       <Package size={20} className="text-neutral-500" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-neutral-900">{product.name}</p>
//                       <p className="text-xs text-neutral-500">ID: {product.id}</p>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 text-sm text-neutral-700">{product.category}</td>
//                 <td className="px-6 py-4 text-sm font-medium text-neutral-900">{product.price}</td>
//                 <td className="px-6 py-4">
//                   <span className={`text-sm font-medium ${product.stock < 10 ? "text-warning-600" : "text-neutral-900"}`}>
//                     {product.stock} units
//                   </span>
//                 </td>
//                 <td className="px-6 py-4"><StatusBadge status={product.status} /></td>
//                 <td className="px-6 py-4 text-sm text-neutral-700">
//                   {product.expiryDate
//                     ? new Date(product.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
//                     : "—"}
//                 </td>
//                 <td className="px-6 py-4">
//                   <div className="flex items-center justify-end gap-2">
//                     <button onClick={() => handleView(product)} className="p-2 hover:bg-primary-50 rounded-lg transition-colors" title="View">
//                       <Eye size={18} className="text-primary-600" />
//                     </button>
//                     <button onClick={() => handleEdit(product)} className="p-2 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
//                       <Edit size={18} className="text-primary-600" />
//                     </button>
//                     <button onClick={() => handleDelete(product)} className="p-2 hover:bg-warning-50 rounded-lg transition-colors" title="Delete">
//                       <Trash2 size={18} className="text-warning-600" />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {filteredProducts.length === 0 && (
//           <div className="text-center py-12">
//             <Package size={48} className="mx-auto text-neutral-300 mb-3" />
//             <p className="text-neutral-500">No products found matching your criteria</p>
//           </div>
//         )}
//       </div>

//       {/* Pagination */}
//       {filteredProducts.length > 0 && (
//         <div className="flex items-center justify-between">
//           <p className="text-sm text-neutral-500">
//             Showing {startIndex + 1} to{" "}
//             {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{" "}
//             {filteredProducts.length} products
//           </p>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className="p-2 rounded-lg border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
//             >
//               <ChevronLeft size={18} />
//             </button>
//             <span className="text-sm text-neutral-700">Page {currentPage} of {totalPages}</span>
//             <button
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//               className="p-2 rounded-lg border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
//             >
//               <ChevronRight size={18} />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ── View Product Modal ── */}
//       {showViewModal && selectedProduct && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-h6 font-bold text-neutral-900">Product Details</h3>
//               <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
//                 <X size={18} />
//               </button>
//             </div>
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 {[
//                   { label: "Product ID", value: selectedProduct.id },
//                   { label: "Product Name", value: selectedProduct.name },
//                   { label: "Category", value: selectedProduct.category },
//                   { label: "Manufacturer", value: selectedProduct.manufacturer },
//                   { label: "Price", value: selectedProduct.price },
//                   { label: "Stock", value: `${selectedProduct.stock} units` },
//                   { label: "Prescription", value: selectedProduct.prescription },
//                   {
//                     label: "Expiry Date",
//                     value: selectedProduct.expiryDate
//                       ? new Date(selectedProduct.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
//                       : "—",
//                   },
//                 ].map(({ label, value }) => (
//                   <div key={label}>
//                     <p className="text-xs text-neutral-500">{label}</p>
//                     <p className="text-sm font-medium text-neutral-900">{value}</p>
//                   </div>
//                 ))}
//                 <div>
//                   <p className="text-xs text-neutral-500">Status</p>
//                   <div className="mt-1"><StatusBadge status={selectedProduct.status} /></div>
//                 </div>
//               </div>
//               {selectedProduct._raw && (
//                 <details className="mt-4">
//                   <summary className="text-xs text-neutral-400 cursor-pointer select-none">Show all fields</summary>
//                   <pre className="mt-2 p-3 bg-neutral-50 rounded-lg text-xs text-neutral-600 overflow-x-auto max-h-60">
//                     {JSON.stringify(selectedProduct._raw, null, 2)}
//                   </pre>
//                 </details>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── Delete Confirmation Modal ── */}
//       {showDeleteModal && selectedProduct && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
//           <div className="bg-white rounded-2xl w-[420px] max-w-full p-6 shadow-2xl">
//             <div className="flex flex-col items-center text-center gap-3 mb-6">
//               <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
//                 <Trash2 size={22} className="text-red-500" />
//               </div>
//               <h3 className="text-base font-bold text-neutral-900">Delete Product</h3>
//               <p className="text-sm text-neutral-500 leading-6 max-w-xs">
//                 Are you sure you want to delete <span className="font-semibold text-neutral-800">"{selectedProduct.name}"</span>? This action cannot be undone.
//               </p>
//               <div className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
//                 <p className="text-xs text-neutral-400 font-mono">ID: {selectedProduct.id}</p>
//               </div>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => { setShowDeleteModal(false); setSelectedProduct(null); }}
//                 disabled={deleting}
//                 className="flex-1 h-10 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDelete}
//                 disabled={deleting}
//                 className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {deleting ? (
//                   <>
//                     <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     Deleting...
//                   </>
//                 ) : (
//                   <>
//                     <Trash2 size={15} />
//                     Delete
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Products;