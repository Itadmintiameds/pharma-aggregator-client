"use client";

import React from "react";
import { Edit, Eye, Trash2 } from "lucide-react";

const products = new Array(6).fill({
  name: "Paracetamol",
  category: "Drugs",
  price: "₹20",
  stock: 10000,
  status: "Active",
});

const ProductTable = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 border-neutral-100 text-left">
          <tr>
            <th className="p-4">Thumbnail</th>
            <th className="p-4">Product Name</th>
            <th className="p-4">Category</th>
            <th className="p-4">Price</th>
            <th className="p-4">Stock</th>
            <th className="p-4">Status</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product, index) => (
            <tr
              key={index}
              className="border-t border-neutral-100 hover:bg-neutral-50 transition"
            >
              <td className="p-4">
                <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
              </td>

              <td className="p-4">{product.name}</td>
              <td className="p-4">{product.category}</td>
              <td className="p-4">{product.price}</td>
              <td className="p-4">{product.stock}</td>

              <td className="p-4">
                <span className="px-3 py-1 text-xs rounded-md bg-success-50 text-success-900">
                  {product.status}
                </span>
              </td>

              <td className="p-4">
                <div className="flex items-center gap-1">

                  <button className="p-2 rounded-md hover:bg-primary-05 transition">
                    <Edit size={20} className="text-primary-600" />
                  </button>

                  <button className="p-2 rounded-md hover:bg-neutral-100 transition">
                    <Eye size={20} className="text-neutral-500" />
                  </button>                  

                  <button className="p-2 rounded-md hover:bg-warning-100 transition">
                    <Trash2 size={20} className="text-warning-500" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
// 
















// This code is not completely functional as of now................

// "use client";

// import React, { useEffect, useState } from "react";
// import { Edit, Eye, Trash2, X } from "lucide-react";
// import { getDrugProductList, drugProductDelete, getDrugProductById } from "@/src/services/product/ProductService";
// import { CreateDrugProductRequest } from "@/src/types/product/ProductData";
// import { DashboardView } from "@/src/types/seller/dashboard";

// interface ProductTableProps {
//   setCurrentView: (view: DashboardView) => void;
//   onEditProduct?: (productId: string) => void;
//   refreshTrigger?: number;
// }

// interface Product {
//   productId: string;
//   productName: string;
//   therapeuticCategory: string;
//   dosageForm: string;
//   strength: number;
//   packagingDetails?: {
//     packagingUnit: string;
//     numberOfUnits: number;
//     packSize: number;
//   };
//   pricingDetails?: Array<{
//     pricePerUnit: number;
//     mrp: number;
//     stockQuantity: number;
//     batchLotNumber: string;
//     manufacturerName: string;
//     expiryDate: string | null;
//     gstPercentage: number;
//     finalPrice: number;
//   }>;
//   molecules?: Array<{
//     moleculeId: number;
//     moleculeName: string;
//     mechanismOfAction: string;
//     primaryUse: string;
//   }>;
// }

// const ProductTable = ({ setCurrentView, onEditProduct, refreshTrigger = 0 }: ProductTableProps) => {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [selectedProduct, setSelectedProduct] = useState<any>(null);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [productToDelete, setProductToDelete] = useState<Product | null>(null);

//   useEffect(() => {
//     fetchProducts();
//   }, [refreshTrigger]);

//   const fetchProducts = async () => {
//     try {
//       const data = await getDrugProductList();
      
//       // Handle different response structures
//       let productList = [];
//       if (data?.content) {
//         productList = data.content; // Paginated response
//       } else if (Array.isArray(data)) {
//         productList = data; // Direct array
//       } else if (data?.data && Array.isArray(data.data)) {
//         productList = data.data; // Wrapped response
//       }

//       setProducts(productList);
//     } catch (error) {
//       console.error("Failed to fetch products:", error);
//     }
//   };

//   const getCategoryName = (categoryId: string) => {
//     // This will need to be mapped from your categories list
//     // For now, return a placeholder or you can pass categories as prop
//     return categoryId || "N/A";
//   };

//   const getStatus = (stockQuantity: number) => {
//     if (stockQuantity <= 0) return { label: "Out of Stock", className: "bg-warning-100 text-warning-800" };
//     if (stockQuantity < 10) return { label: "Low Stock", className: "bg-warning-50 text-warning-700" };
//     return { label: "Active", className: "bg-success-50 text-success-700" };
//   };

//   const handleEditClick = (productId: string) => {
//     // Store the product ID in localStorage or state management to be used in AddProduct component
//     localStorage.setItem("editProductId", productId);
//     localStorage.setItem("productMode", "edit");
//     setCurrentView("addProduct");
//     if (onEditProduct) {
//       onEditProduct(productId);
//     }
//   };

//   const handleViewClick = async (productId: string) => {
//     try {
//       const productData = await getDrugProductById(productId);
//       setSelectedProduct(productData);
//       setShowViewModal(true);
//     } catch (error) {
//       console.error("Failed to fetch product details:", error);
//     }
//   };

//   const handleDeleteClick = (product: Product) => {
//     setProductToDelete(product);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = async () => {
//     if (!productToDelete) return;

//     try {
//       await drugProductDelete(productToDelete.productId);
//       setShowDeleteModal(false);
//       setProductToDelete(null);
//       fetchProducts(); // Refresh the list
//     } catch (error) {
//       console.error("Failed to delete product:", error);
//     }
//   };

//   const formatPrice = (price: number) => {
//     return `₹${price?.toFixed(2) || '0.00'}`;
//   };

//   // Get the first pricing detail or use defaults
//   const getPricingDetail = (product: Product) => {
//     return product.pricingDetails?.[0] || {
//       pricePerUnit: 0,
//       mrp: 0,
//       stockQuantity: 0,
//       batchLotNumber: '',
//       manufacturerName: '',
//       expiryDate: null,
//       gstPercentage: 0,
//       finalPrice: 0
//     };
//   };

//   return (
//     <>
//       <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-neutral-50 border-neutral-100 text-left">
//             <tr>
//               <th className="p-4">Thumbnail</th>
//               <th className="p-4">Product Name</th>
//               <th className="p-4">Category</th>
//               <th className="p-4">Price</th>
//               <th className="p-4">Stock</th>
//               <th className="p-4">Status</th>
//               <th className="p-4">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {products.length === 0 ? (
//               <tr>
//                 <td colSpan={7} className="text-center py-8 text-neutral-500">
//                   No products found
//                 </td>
//               </tr>
//             ) : (
//               products.map((product, index) => {
//                 const pricing = getPricingDetail(product);
//                 const status = getStatus(pricing.stockQuantity);
                
//                 return (
//                   <tr
//                     key={product.productId || index}
//                     className="border-t border-neutral-100 hover:bg-neutral-50 transition"
//                   >
//                     <td className="p-4">
//                       <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
//                     </td>

//                     <td className="p-4 font-medium">{product.productName}</td>
//                     <td className="p-4">{getCategoryName(product.therapeuticCategory)}</td>
//                     <td className="p-4">{formatPrice(pricing.pricePerUnit)}</td>
//                     <td className="p-4">{pricing.stockQuantity}</td>

//                     <td className="p-4">
//                       <span className={`px-3 py-1 text-xs rounded-md ${status.className}`}>
//                         {status.label}
//                       </span>
//                     </td>

//                     <td className="p-4">
//                       <div className="flex items-center gap-1">
//                         <button 
//                           className="p-2 rounded-md hover:bg-primary-05 transition"
//                           onClick={() => handleEditClick(product.productId)}
//                           title="Edit Product"
//                         >
//                           <Edit size={20} className="text-primary-600" />
//                         </button>

//                         <button 
//                           className="p-2 rounded-md hover:bg-neutral-100 transition"
//                           onClick={() => handleViewClick(product.productId)}
//                           title="View Product"
//                         >
//                           <Eye size={20} className="text-neutral-500" />
//                         </button>                  

//                         <button 
//                           className="p-2 rounded-md hover:bg-warning-100 transition"
//                           onClick={() => handleDeleteClick(product)}
//                           title="Delete Product"
//                         >
//                           <Trash2 size={20} className="text-warning-500" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* View Product Modal */}
//       {showViewModal && selectedProduct && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
//             <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between">
//               <h3 className="text-h6 font-bold text-neutral-900">Product Details</h3>
//               <button
//                 onClick={() => setShowViewModal(false)}
//                 className="p-2 hover:bg-neutral-100 rounded-lg"
//               >
//                 <X size={18} />
//               </button>
//             </div>
            
//             <div className="p-6 space-y-6">
//               {/* Basic Information */}
//               <div>
//                 <h4 className="font-semibold text-primary-900 mb-3">Basic Information</h4>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-xs text-neutral-500">Product Name</p>
//                     <p className="text-sm font-medium text-neutral-900">{selectedProduct.productName}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-neutral-500">Dosage Form</p>
//                     <p className="text-sm font-medium text-neutral-900">{selectedProduct.dosageForm}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-neutral-500">Strength</p>
//                     <p className="text-sm font-medium text-neutral-900">{selectedProduct.strength}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Molecules */}
//               {selectedProduct.molecules && selectedProduct.molecules.length > 0 && (
//                 <div>
//                   <h4 className="font-semibold text-primary-900 mb-3">Molecules</h4>
//                   <div className="space-y-3">
//                     {selectedProduct.molecules.map((molecule: any, idx: number) => (
//                       <div key={idx} className="bg-neutral-50 p-3 rounded-lg">
//                         <p className="text-sm font-medium text-neutral-900">{molecule.moleculeName}</p>
//                         {molecule.mechanismOfAction && (
//                           <p className="text-xs text-neutral-600 mt-1">
//                             <span className="font-medium">Mechanism:</span> {molecule.mechanismOfAction}
//                           </p>
//                         )}
//                         {molecule.primaryUse && (
//                           <p className="text-xs text-neutral-600 mt-1">
//                             <span className="font-medium">Primary Use:</span> {molecule.primaryUse}
//                           </p>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Pricing Information */}
//               {selectedProduct.pricingDetails && selectedProduct.pricingDetails.length > 0 && (
//                 <div>
//                   <h4 className="font-semibold text-primary-900 mb-3">Pricing & Stock</h4>
//                   {selectedProduct.pricingDetails.map((pricing: any, idx: number) => (
//                     <div key={idx} className="bg-neutral-50 p-3 rounded-lg space-y-2">
//                       <div className="grid grid-cols-2 gap-3">
//                         <div>
//                           <p className="text-xs text-neutral-500">Batch Number</p>
//                           <p className="text-sm font-medium">{pricing.batchLotNumber || 'N/A'}</p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-neutral-500">Manufacturer</p>
//                           <p className="text-sm font-medium">{pricing.manufacturerName || 'N/A'}</p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-neutral-500">MRP</p>
//                           <p className="text-sm font-medium">₹{pricing.mrp?.toFixed(2)}</p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-neutral-500">Price/Unit</p>
//                           <p className="text-sm font-medium">₹{pricing.pricePerUnit?.toFixed(2)}</p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-neutral-500">Final Price</p>
//                           <p className="text-sm font-medium">₹{pricing.finalPrice?.toFixed(2)}</p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-neutral-500">Stock</p>
//                           <p className="text-sm font-medium">{pricing.stockQuantity} units</p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-neutral-500">Expiry Date</p>
//                           <p className="text-sm font-medium">
//                             {pricing.expiryDate ? new Date(pricing.expiryDate).toLocaleDateString() : 'N/A'}
//                           </p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-neutral-500">GST</p>
//                           <p className="text-sm font-medium">{pricing.gstPercentage}%</p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Warnings & Description */}
//               {selectedProduct.warningsPrecautions && (
//                 <div>
//                   <h4 className="font-semibold text-primary-900 mb-2">Warnings & Precautions</h4>
//                   <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg">
//                     {selectedProduct.warningsPrecautions}
//                   </p>
//                 </div>
//               )}

//               {selectedProduct.productDescription && (
//                 <div>
//                   <h4 className="font-semibold text-primary-900 mb-2">Description</h4>
//                   <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg">
//                     {selectedProduct.productDescription}
//                   </p>
//                 </div>
//               )}
//             </div>

//             <div className="sticky bottom-0 bg-white border-t border-neutral-100 px-6 py-4 flex justify-end">
//               <button
//                 onClick={() => setShowViewModal(false)}
//                 className="px-6 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {showDeleteModal && productToDelete && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
//             <div className="text-center mb-4">
//               <div className="w-16 h-16 bg-warning-50 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <Trash2 size={32} className="text-warning-600" />
//               </div>
//               <h3 className="text-h6 font-bold text-neutral-900 mb-2">Delete Product</h3>
//               <p className="text-sm text-neutral-500">
//                 Are you sure you want to delete &quot;{productToDelete.productName}&quot;? This action cannot be undone.
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 className="flex-1 h-11 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDelete}
//                 className="flex-1 h-11 rounded-lg bg-warning-600 text-white hover:bg-warning-700 transition-colors"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ProductTable;



















