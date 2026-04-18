"use client";

import React, { useEffect, useState } from "react";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getProductList } from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import { ProductListData } from "@/src/types/product/ProductData";
import CommonModal from "../commonComponent/CommonModal";
import DeleteProduct from "./DeleteProduct";

interface ProductListProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: (id: string) => void;
}

const categoryMap: Record<number, string> = {
  1: "Drug",
  2: "Supplement",
  3: "Infant Food",
  4: "Cosmetic",
  5: "Consumable Medical Device",
  6: "Non-Consumable Medical Device",
};

const columns: Column<ProductListData>[] = [
  {
    header: "Thumbnail",
    accessor: (row) => {
      const image = row.productImages?.[0]?.productImage;

      return (
        <img
          src={image || "/icons/Tumbnail.svg"}
          alt="product"
          className="w-10 h-10 rounded-md object-cover"
        />
      );
    },
  },
  {
    header: "Product Name",
    accessor: (row) => row.productName ?? "-",
  },
  {
    header: "Category",
    accessor: (row) => categoryMap[row.categoryId as number] || "-",
  },
  {
    header: "Price",
    accessor: (row) => row.pricingDetails?.[0]?.mrp ?? "-",
  },
  {
    header: "Stock",
    accessor: (row) => row.pricingDetails?.[0]?.stockQuantity ?? "-",
  },
  // {
  //   header: "Status",
  //   accessor: () => (
  //     <span className="p-2 w-14 h-8 bg-success-50 text-p3 text-success-900 font-semibold rounded-lg">
  //       Active
  //     </span>
  //   ),
  // },
];
// const ProductList = () => {
const ProductList = ({
  setCurrentView,
  setSelectedProductId,
}: ProductListProps) => {
  const [data, setData] = useState<ProductListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<
    string | null
  >(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductList();
      setData(response || []);
      console.log("API DATA:", response);
    } catch (error) {
      console.error("Error fetching Drug Product List:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categoryViewMap: Record<number, DashboardView> = {
    1: "editDrug",
    2: "editSupplement",
    3: "editFoodInfant",
    4: "editCosmetic",
    5: "editConsumable",
    6: "editNonConsumable",
  };

  return (
    <>
      <div className="flex justify-between gap-10">
        <button className="w-32 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
          <img
            src="/icons/FilterIcon.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
          Filter
        </button>
        <div className="relative w-full">
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search"
            className="border border-neutral-200 text-p4 text-neutral-500 font-semibold w-full h-12 rounded-lg px-5 pr-14 focus:outline-none focus:ring-0 "
          />

          <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-purple-200 rounded-r-lg">
            <img src="/icons/SearchIcon.svg" alt="search" className="w-6 h-6" />
          </div>
        </div>

        <button className="w-36 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
          Sort By
          <img
            src="/icons/SortbyIcon.svg"
            alt="filter"
            className="w-4.5 h-4.5"
          />
        </button>
      </div>

      <div>
        <Table<ProductListData>
          columns={columns}
          data={data}
          loading={loading}
          actions={(row) => (
            <div className="flex items-center gap-3">
              <img
                src="/icons/EditIcon.svg"
                alt="edit"
                className="w-5 h-5 rounded-md object-cover cursor-pointer"
                onClick={() => {
                  const view = categoryViewMap[row.categoryId as number];
                  if (!view) return;

                  // ✅ FIX: ensure ID is set BEFORE view
                  setSelectedProductId(row.productId ?? "");

                  // ⏳ Delay view change (critical)
                  setTimeout(() => {
                    setCurrentView(view);
                  }, 0);
                }}
              />
              <img
                src="/icons/ViewIcon.svg"
                className="w-5 h-5 cursor-pointer"
                onClick={() => {
                  setSelectedProductId(row.productId ?? "");
                  setCurrentView("productView");
                }}
              />
              <img
                src="/icons/DeleteIcon.svg"
                alt="delete"
                className="w-5 h-5 rounded-md object-cover cursor-pointer"
                onClick={() => {
                  setSelectedProductIdLocal(row.productId);
                  setOpenDeleteModal(true);
                }}
              />
            </div>
          )}
        />
      </div>
      {openDeleteModal && selectedProductIdLocal && (
        <CommonModal onClose={() => setOpenDeleteModal(false)}>
          <DeleteProduct
            productId={selectedProductIdLocal}
            onClose={() => setOpenDeleteModal(false)}
            onSuccess={fetchProducts}
          />
        </CommonModal>
      )}
    </>
  );
};

export default ProductList;

// "use client";

// <<<<<<< HEAD
// import React, { useEffect, useState, useRef } from "react";
// =======
// import React, { useEffect, useState } from "react";
// >>>>>>> products
// import Table, { Column } from "@/src/app/commonComponents/Table";
// import { getProductList } from "@/src/services/product/ProductService";
// import { DashboardView } from "@/src/types/seller/dashboard";
// import { ProductListData } from "@/src/types/product/ProductData";
// import CommonModal from "../commonComponent/CommonModal";
// import DeleteProduct from "./DeleteProduct";

// interface ProductListProps {
//   setCurrentView: (view: DashboardView) => void;
//   setSelectedProductId: (id: string) => void;
// }

// <<<<<<< HEAD
// // Extended type to handle all product categories
// type ExtendedProductListData = ProductListData & {
//   productAttributeNonConsumableMedicals?: unknown[];
//   productAttributeConsumableMedicals?: unknown[];
//   productAttributeDrugs?: unknown;
//   drugAttributes?: unknown;
//   productImages?: Array<{ productImage?: string; imageUrl?: string; url?: string; imagePath?: string }>;
//   images?: string[];
//   manufacturerName?: string;
//   categoryName?: string;
// };

// // Helper: detect category from API response
// const getProductCategory = (product: ExtendedProductListData): string => {
//   if (product.categoryName) {
//     const catName = product.categoryName.toLowerCase();
//     if (catName.includes("drug") || catName.includes("medicine")) return "Drugs";
//     if (catName.includes("non-consumable") || catName.includes("nonconsumable")) return "Non-Consumable";
//     if (catName.includes("consumable")) return "Consumable";
//   }
//   if (product.productAttributeNonConsumableMedicals?.length) return "Non-Consumable";
//   if (product.productAttributeConsumableMedicals?.length) return "Consumable";
//   if (product.productAttributeDrugs || product.drugAttributes) return "Drugs";
//   return "Uncategorized";
// };

// // Get first valid image URL
// const getFirstImage = (product: ExtendedProductListData): string | null => {
//   const images = product.productImages;
//   if (Array.isArray(images) && images.length) {
//     const first = images[0];
//     const url = first?.productImage || first?.imageUrl || first?.url || first?.imagePath;
//     if (url && url !== "PENDING" && url.startsWith("http")) return url;
//   }
//   if (Array.isArray(product.images) && product.images.length) {
//     const url = product.images[0];
//     if (url && url !== "PENDING" && url.startsWith("http")) return url;
//   }
//   return null;
// };

// // Thumbnail component with fallback
// const ProductThumbnail = ({ product }: { product: ExtendedProductListData }) => {
//   const [src, setSrc] = React.useState(getFirstImage(product) ?? "/icons/Tumbnail.svg");
//   return (
//     <img
//       src={src}
//       alt="Thumbnail"
//       className="w-10 h-10 rounded-md object-cover"
//       onError={() => setSrc("/icons/Tumbnail.svg")}
//     />
//   );
// };

// type SortField = "name" | "price" | "stock" | "none";
// type SortDir = "asc" | "desc";

// const SORT_OPTIONS: Array<{ label: string; field: SortField; dir: SortDir }> = [
//   { label: "Name (A–Z)", field: "name", dir: "asc" },
//   { label: "Name (Z–A)", field: "name", dir: "desc" },
//   { label: "Price (Low–High)", field: "price", dir: "asc" },
//   { label: "Price (High–Low)", field: "price", dir: "desc" },
//   { label: "Stock (Low–High)", field: "stock", dir: "asc" },
//   { label: "Stock (High–Low)", field: "stock", dir: "desc" },
// ];

// const CATEGORY_OPTIONS = ["all", "Drugs", "Consumable", "Non-Consumable"];

// const ProductList = ({ setCurrentView, setSelectedProductId }: ProductListProps) => {
//   const [data, setData] = useState<ExtendedProductListData[]>([]);
//   const [filteredData, setFilteredData] = useState<ExtendedProductListData[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [openDeleteModal, setOpenDeleteModal] = useState(false);
//   const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState<string>("all");
//   const [sortField, setSortField] = useState<SortField>("none");
//   const [sortDir, setSortDir] = useState<SortDir>("asc");
//   const [activeSortLabel, setActiveSortLabel] = useState("Sort By");
//   const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
//   const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
//   const filterRef = useRef<HTMLDivElement>(null);
//   const sortRef = useRef<HTMLDivElement>(null);

//   // Close dropdowns on outside click
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterDropdownOpen(false);
//       if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortDropdownOpen(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);
// =======
// const columns: Column<ProductListData>[] = [
//   {
//     header: "Thumbnail",
//     accessor: () => (
//       <img
//         src="/icons/Tumbnail.svg"
//         alt="drug"
//         className="w-10 h-10 rounded-md object-cover"
//       />
//     ),
//   },
//   {
//     header: "Product Name",
//     accessor: (row) => row.productName ?? "-",
//   },
//   {
//     header: "Category",
//     accessor: () => "Drug",
//   },
//   {
//     header: "Price",
//     accessor: (row) => row.pricingDetails?.[0]?.mrp ?? "-",
//   },
//   {
//     header: "Stock",
//     accessor: (row) => row.pricingDetails?.[0]?.stockQuantity ?? "-",
//   },
//   // {
//   //   header: "Status",
//   //   accessor: () => (
//   //     <span className="p-2 w-14 h-8 bg-success-50 text-p3 text-success-900 font-semibold rounded-lg">
//   //       Active
//   //     </span>
//   //   ),
//   // },
// ];
// // const ProductList = () => {
// const ProductList = ({
//   setCurrentView,
//   setSelectedProductId,
// }: ProductListProps) => {
//   const [data, setData] = useState<ProductListData[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [openDeleteModal, setOpenDeleteModal] = useState(false);
//   const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<
//     string | null
//   >(null);
// >>>>>>> products

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       const response = await getProductList();
// <<<<<<< HEAD
//       setData(response as ExtendedProductListData[] || []);
//       setFilteredData(response as ExtendedProductListData[] || []);
// =======
//       setData(response || []);
//       console.log("API DATA:", response);
// >>>>>>> products
//     } catch (error) {
//       console.error("Error fetching Drug Product List:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

// <<<<<<< HEAD
//   // Filtering + sorting logic
//   useEffect(() => {
//     let filtered = [...data];

//     if (searchQuery.trim()) {
//       const q = searchQuery.toLowerCase();
//       filtered = filtered.filter(p =>
//         p.productName?.toLowerCase().includes(q) ||
//         p.productId?.toLowerCase().includes(q)
//       );
//     }

//     if (categoryFilter !== "all") {
//       filtered = filtered.filter(p => getProductCategory(p) === categoryFilter);
//     }

//     if (sortField !== "none") {
//       filtered.sort((a, b) => {
//         let valA: string | number = 0, valB: string | number = 0;
//         if (sortField === "name") {
//           valA = a.productName?.toLowerCase() ?? "";
//           valB = b.productName?.toLowerCase() ?? "";
//         } else if (sortField === "price") {
//           valA = a.pricingDetails?.[0]?.mrp ?? 0;
//           valB = b.pricingDetails?.[0]?.mrp ?? 0;
//         } else if (sortField === "stock") {
//           valA = Number(a.pricingDetails?.[0]?.stockQuantity ?? 0);
//           valB = Number(b.pricingDetails?.[0]?.stockQuantity ?? 0);
//         }
//         if (valA < valB) return sortDir === "asc" ? -1 : 1;
//         if (valA > valB) return sortDir === "asc" ? 1 : -1;
//         return 0;
//       });
//     }

//     setFilteredData(filtered);
//   }, [searchQuery, categoryFilter, data, sortField, sortDir]);

//   const columns: Column<ExtendedProductListData>[] = [
//     {
//       header: "Thumbnail",
//       accessor: (row) => <ProductThumbnail product={row} />,
//     },
//     {
//       header: "Product Name",
//       accessor: (row) => row.productName ?? "-",
//     },
//     {
//       header: "Category",
//       accessor: (row) => getProductCategory(row),
//     },
//     {
//       header: "Price",
//       accessor: (row) => {
//         const price = row.pricingDetails?.[0]?.mrp;
//         return price ? `₹${price.toFixed(2)}` : "-";
//       },
//     },
//     {
//       header: "Stock",
//       accessor: (row) => {
//         const stock = row.pricingDetails?.[0]?.stockQuantity;
//         return stock !== undefined && stock !== null ? String(stock) : "-";
//       },
//     },
//     {
//       header: "Status",
//       accessor: (row) => {
//         const stock = Number(row.pricingDetails?.[0]?.stockQuantity ?? 0);
//         if (stock === 0) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Out of Stock</span>;
//         if (stock < 10) return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">Low Stock</span>;
//         return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Active</span>;
//       },
//     },
//   ];

//   return (
//     <>
//       {/* Top bar */}
//       <div className="flex justify-between gap-10">
//         {/* Filter button with hover effect */}
//         <div className="relative" ref={filterRef}>
//           <button
//             onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
//             className={`w-32 h-12 bg-neutral-50 border rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2
//               hover:bg-neutral-100 hover:border-primary-900 transition
//               ${categoryFilter !== "all" ? "border-primary-900 text-primary-900" : "border-neutral-200"}`}
//           >
//             <img src="/icons/FilterIcon.svg" alt="filter" className="w-4.5 h-4.5" />
//             Filter
//             {categoryFilter !== "all" && (
//               <span className="ml-1 bg-primary-900 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
//                 1
//               </span>
//             )}
//           </button>
//           {filterDropdownOpen && (
//             <div className="absolute top-14 left-0 z-20 bg-white rounded-xl border border-neutral-200 shadow-lg p-3 w-48">
//               <p className="text-xs font-semibold text-neutral-500 mb-2">Category</p>
//               {CATEGORY_OPTIONS.map(cat => (
//                 <button
//                   key={cat}
//                   onClick={() => {
//                     setCategoryFilter(cat);
//                     setFilterDropdownOpen(false);
//                   }}
//                   className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
//                     categoryFilter === cat ? "bg-primary-900 text-white" : "hover:bg-neutral-100"
//                   }`}
//                 >
//                   {cat === "all" ? "All Products" : cat}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Search input with hover effect */}
// =======
//   const categoryViewMap: Record<number, DashboardView> = {
//     1: "editDrug",
//     2: "editSupplement",
//     3: "editFoodInfant",
//     4: "editCosmetic",
//     5: "editMedicalDevice",
//   };

//   return (
//     <>
//       <div className="flex justify-between gap-10">
//         <button className="w-32 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
//           <img
//             src="/icons/FilterIcon.svg"
//             alt="filter"
//             className="w-4.5 h-4.5"
//           />
//           Filter
//         </button>
// >>>>>>> products
//         <div className="relative w-full">
//           <input
//             type="text"
//             name="search"
//             id="search"
//             placeholder="Search"
// <<<<<<< HEAD
//             className="border border-neutral-200 text-p4 text-neutral-500 font-semibold w-full h-12 rounded-lg px-5 pr-14
//               focus:outline-none focus:ring-0 hover:border-primary-900 transition"
//           />
//           <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-purple-200 rounded-r-lg pointer-events-none">
// =======
//             className="border border-neutral-200 text-p4 text-neutral-500 font-semibold w-full h-12 rounded-lg px-5 pr-14 focus:outline-none focus:ring-0 "
//           />

//           <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-purple-200 rounded-r-lg">
// >>>>>>> products
//             <img src="/icons/SearchIcon.svg" alt="search" className="w-6 h-6" />
//           </div>
//         </div>

// <<<<<<< HEAD
//         {/* Sort By button with hover effect */}
//         <div className="relative" ref={sortRef}>
//           <button
//             onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
//             className="w-36 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2
//               hover:bg-neutral-100 hover:border-primary-900 transition"
//           >
//             {activeSortLabel}
//             <img src="/icons/SortbyIcon.svg" alt="sort" className="w-4.5 h-4.5" />
//           </button>
//           {sortDropdownOpen && (
//             <div className="absolute top-14 right-0 z-20 bg-white rounded-xl border border-neutral-200 shadow-lg p-2 w-52">
//               {SORT_OPTIONS.map(opt => (
//                 <button
//                   key={opt.label}
//                   onClick={() => {
//                     setSortField(opt.field);
//                     setSortDir(opt.dir);
//                     setActiveSortLabel(opt.label);
//                     setSortDropdownOpen(false);
//                   }}
//                   className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
//                     sortField === opt.field && sortDir === opt.dir
//                       ? "bg-primary-900 text-white"
//                       : "hover:bg-neutral-100"
//                   }`}
//                 >
//                   {opt.label}
//                 </button>
//               ))}
//               {sortField !== "none" && (
//                 <button
//                   onClick={() => {
//                     setSortField("none");
//                     setActiveSortLabel("Sort By");
//                     setSortDropdownOpen(false);
//                   }}
//                   className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 mt-1 border-t border-neutral-100"
//                 >
//                   Clear sort
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Results info + clear filters */}
//       <div className="flex justify-between items-center mt-3 text-sm text-neutral-600">
//         <p>
//           Showing <span className="font-semibold">{filteredData.length}</span> of{" "}
//           <span className="font-semibold">{data.length}</span> products
//           {categoryFilter !== "all" && (
//             <span className="ml-1">in category: <span className="font-semibold text-primary-900">{categoryFilter}</span></span>
//           )}
//         </p>
//         {(searchQuery || categoryFilter !== "all" || sortField !== "none") && (
//           <button
//             onClick={() => {
//               setSearchQuery("");
//               setCategoryFilter("all");
//               setSortField("none");
//               setActiveSortLabel("Sort By");
//             }}
//             className="text-primary-900 hover:underline font-medium"
//           >
//             Clear all
//           </button>
//         )}
//       </div>

//       {/* Table */}
//       <div className="mt-4">
//         <Table<ExtendedProductListData>
// =======
//         <button className="w-36 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
//           Sort By
//           <img
//             src="/icons/SortbyIcon.svg"
//             alt="filter"
//             className="w-4.5 h-4.5"
//           />
//         </button>
//       </div>

//       <div>
//         <Table<ProductListData>
// >>>>>>> products
//           columns={columns}
//           data={data}
//           loading={loading}
//           actions={(row) => (
//             <div className="flex items-center gap-3">
//               <img
//                 src="/icons/EditIcon.svg"
//                 alt="edit"
// <<<<<<< HEAD
//                 className="w-5 h-5 rounded-md object-cover cursor-pointer opacity-70 hover:opacity-100 transition"
// =======
//                 className="w-5 h-5 rounded-md object-cover cursor-pointer"
// >>>>>>> products
//                 onClick={() => {
//                   const view = categoryViewMap[row.categoryId as number];
//                   if (!view) return;

//                   // ✅ FIX: ensure ID is set BEFORE view
//                   setSelectedProductId(row.productId ?? "");

//                   // ⏳ Delay view change (critical)
//                   setTimeout(() => {
//                     setCurrentView(view);
//                   }, 0);
//                 }}
//               />
//               <img
//                 src="/icons/ViewIcon.svg"
// <<<<<<< HEAD
//                 alt="view"
//                 className="w-5 h-5 cursor-pointer opacity-70 hover:opacity-100 transition"
// =======
//                 className="w-5 h-5 cursor-pointer"
// >>>>>>> products
//                 onClick={() => {
//                   setSelectedProductId(row.productId ?? "");
//                   setCurrentView("productView");
//                 }}
//               />
//               <img
//                 src="/icons/DeleteIcon.svg"
//                 alt="delete"
// <<<<<<< HEAD
//                 className="w-5 h-5 rounded-md object-cover cursor-pointer opacity-70 hover:opacity-100 transition"
// =======
//                 className="w-5 h-5 rounded-md object-cover cursor-pointer"
// >>>>>>> products
//                 onClick={() => {
//                   setSelectedProductIdLocal(row.productId);
//                   setOpenDeleteModal(true);
//                 }}
//               />
//             </div>
//           )}
//         />
//       </div>
// <<<<<<< HEAD

//       {/* Delete modal */}
// =======
// >>>>>>> products
//       {openDeleteModal && selectedProductIdLocal && (
//         <CommonModal onClose={() => setOpenDeleteModal(false)}>
//           <DeleteProduct
//             productId={selectedProductIdLocal}
//             onClose={() => setOpenDeleteModal(false)}
//             onSuccess={fetchProducts}
//           />
//         </CommonModal>
//       )}
//     </>
//   );
// };

// export default ProductList;
