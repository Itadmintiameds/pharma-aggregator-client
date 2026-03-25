"use client";

import React, { useEffect, useState } from "react";
import Table, { Column } from "@/src/app/commonComponents/Table";
import {
  getDrugProductList,
  drugProductDelete,
  getDrugProductById,
} from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import {
  CreateDrugProductRequest,
  ProductData,
} from "@/src/types/product/ProductData";
import Image from "next/image";
import {HiOutlineExclamationCircle, HiExclamation} from "react-icons/hi";
import { HiOutlineTrash } from "react-icons/hi2";

interface ProductListProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: (id: string) => void;
}

const columns: Column<CreateDrugProductRequest & ProductData>[] = [
  {
    header: "Thumbnail",
    accessor: () => (
      <Image
        src="/icons/Tumbnail.svg"
        alt="drug"
        width={40}
        height={40}
        className="rounded-md object-cover"
      />
    ),
  },
  {
    header: "Product Name",
    accessor: (row) => row.productName ?? "-",
  },
  {
    header: "Category",
    accessor: () => "Drug",
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

const ProductList = ({
  setCurrentView,
  setSelectedProductId,
}: ProductListProps) => {
  const [data, setData] = useState<
    (CreateDrugProductRequest & ProductData)[]
  >([]);
  const [loading, setLoading] = useState(false);

  // ✅ Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<
    (CreateDrugProductRequest & ProductData) | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  // ✅ Category from API
  const [therapeuticCategory, setTherapeuticCategory] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getDrugProductList();
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

  // ✅ Fetch category when modal opens
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!selectedProduct?.productId) return;

      try {
        const res = await getDrugProductById(
          selectedProduct.productId
        );
        setTherapeuticCategory(res?.therapeuticCategory || "");
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    };

    if (showDeleteModal) {
      fetchProductDetails();
    }
  }, [showDeleteModal, selectedProduct]);

  // ✅ Delete Handler
  const handleDeleteProduct = async () => {
    if (!selectedProduct?.productId) return;

    try {
      setDeleting(true);
      await drugProductDelete(selectedProduct.productId);

      setData((prev) =>
        prev.filter(
          (item) => item.productId !== selectedProduct.productId
        )
      );

      setShowDeleteModal(false);
      setSelectedProduct(null);
      setTherapeuticCategory("");
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between gap-10">
        <button className="w-32 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
          <Image
            src="/icons/FilterIcon.svg"
            alt="filter"
            width={18}
            height={18}
            className="object-contain"
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
            <Image
              src="/icons/SearchIcon.svg"
              alt="search"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
        </div>

        <button className="w-36 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
          Sort By
          <Image
            src="/icons/SortbyIcon.svg"
            alt="filter"
            width={18}
            height={18}
            className="object-contain"
          />
        </button>
      </div>

      <div>
        <Table<CreateDrugProductRequest & ProductData>
          columns={columns}
          data={data}
          loading={loading}
          actions={(row) => (
            <div className="flex items-center gap-3">
              <Image
                src="/icons/EditIcon.svg"
                alt="edit"
                width={20}
                height={20}
                className="rounded-md object-cover text-[#7D00D3]"
              />

              <Image
                src="/icons/ViewIcon.svg"
                alt="view"
                width={20}
                height={20}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedProductId(row.productId ?? "");
                  setCurrentView("productView");
                }}
              />

              <Image
                src="/icons/DeleteIcon.svg"
                alt="delete"
                width={20}
                height={20}
                className="rounded-md object-cover cursor-pointer"
                onClick={() => {
                  setSelectedProduct(row);
                  setShowDeleteModal(true);
                }}
              />
            </div>
          )}
        />
      </div>

      {/* ✅ DELETE MODAL */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-[448px] p-6 shadow-xl">
            {/* ICON */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-warning-200 flex items-center justify-center">
                <HiOutlineExclamationCircle className="text-warning-600 text-4xl" />
              </div>
            </div>

            {/* TITLE */}
            <h2 className="text-h5 font-bold text-center text-neutral-900">
              Delete Product?
            </h2>

            <p className="text-center text-p3 text-neutral-700 mt-2">
              This action cannot be undone. The product will be permanently removed
              from your inventory.
            </p>

            {/* PRODUCT INFO */}
            <div className="bg-tertiary-100 border border-tertiary-500 rounded-xl p-4 mt-5">
              <p className="text-p5 text-warning-700 font-semibold flex items-center gap-2">
                <HiOutlineExclamationCircle className="text-lg" />
                You are about to delete:
              </p>

              <p className="text-p5 font-semibold text-neutral-900 mt-1">
                {selectedProduct.productName} {selectedProduct.strength}mg{" "}
                {selectedProduct.dosageForm}
              </p>

              <div className="flex justify-between text-p3 mt-3">
                <span className="text-warning-600">Category</span>
                <span className="text-neutral-900 font-semibold">
                  {therapeuticCategory || "-"}
                </span>
              </div>

              <div className="flex justify-between text-p3 mt-1">
                <span className="text-warning-600">Stock</span>
                <span className="text-success-900 font-bold">
                  {selectedProduct.pricingDetails?.[0]?.stockQuantity ?? 0} units
                </span>
              </div>
            </div>

            {/* WARNING */}
            <div className="bg-red-100 rounded-xl p-4 mt-5 text-p2">
              <p className="font-semibold mb-2 text-warning-700 flex items-center gap-2">
                < HiExclamation className="text-lg w-5 h-5" />
                This will permanently:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-warning-600">
                <li>Remove product from all listings</li>
                <li>Delete all product images and data</li>
                <li>Remove from customer wishlists</li>
                <li>Cannot be recovered after deletion</li>
              </ul>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 mt-6">
              <button
                className="flex-1 h-11 rounded-lg bg-neutral-100 text-neutral-900 font-medium"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                  setTherapeuticCategory("");
                }}
              >
                Cancel
              </button>

              <button
                className="flex-1 h-11 rounded-lg bg-warning-500 text-white font-medium flex items-center justify-center gap-2"
                onClick={handleDeleteProduct}
                disabled={deleting}
              >
                <HiOutlineTrash className="w-5 h-5" />
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductList;






// "use client";

// import React, { useEffect, useState } from "react";
// import Table, { Column } from "@/src/app/commonComponents/Table";
// import {
//   getDrugProductList,
//   drugProductDelete,
//   getDrugProductById
// } from "@/src/services/product/ProductService";
// import { DashboardView } from "@/src/types/seller/dashboard";
// import {
//   CreateDrugProductRequest,
//   ProductData,
// } from "@/src/types/product/ProductData";
// import Image from "next/image";
// import { HiOutlineExclamationCircle, HiExclamation } from "react-icons/hi";

// interface ProductListProps {
//   setCurrentView: (view: DashboardView) => void;
//   setSelectedProductId: (id: string) => void;
// }

// const columns: Column<CreateDrugProductRequest & ProductData>[] = [
//   {
//     header: "Thumbnail",
//     accessor: () => (
//       <Image
//         src="/icons/Tumbnail.svg"
//         alt="drug"
//         width={40}
//         height={40}
//         className="rounded-md object-cover"
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

// const ProductList = ({
//   setCurrentView,
//   setSelectedProductId,
// }: ProductListProps) => {
//   const [data, setData] = useState<
//     (CreateDrugProductRequest & ProductData)[]
//   >([]);
//   const [loading, setLoading] = useState(false);

//   // ✅ Delete Modal State
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState<
//     (CreateDrugProductRequest & ProductData) | null
//   >(null);
//   const [deleting, setDeleting] = useState(false);
//   const [therapeuticCategory, setTherapeuticCategory] = useState("");

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       const response = await getDrugProductList();
//       setData(response || []);
//       console.log("API DATA:", response);
//     } catch (error) {
//       console.error("Error fetching Drug Product List:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   // ✅ Delete Handler
//   const handleDeleteProduct = async () => {
//     if (!selectedProduct?.productId) return;

//     try {
//       setDeleting(true);
//       await drugProductDelete(selectedProduct.productId);

//       // remove from UI
//       setData((prev) =>
//         prev.filter((item) => item.productId !== selectedProduct.productId)
//       );

//       setShowDeleteModal(false);
//       setSelectedProduct(null);
//     } catch (error) {
//       console.error("Delete failed:", error);
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <>
//       <div className="flex justify-between gap-10">
//         <button className="w-32 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
//           <Image
//             src="/icons/FilterIcon.svg"
//             alt="filter"
//             width={18}
//             height={18}
//             className="object-contain"
//           />
//           Filter
//         </button>

//         <div className="relative w-full">
//           <input
//             type="text"
//             name="search"
//             id="search"
//             placeholder="Search"
//             className="border border-neutral-200 text-p4 text-neutral-500 font-semibold w-full h-12 rounded-lg px-5 pr-14 focus:outline-none focus:ring-0 "
//           />

//           <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-purple-200 rounded-r-lg">
//             <Image
//               src="/icons/SearchIcon.svg"
//               alt="search"
//               width={24}
//               height={24}
//               className="object-contain"
//             />
//           </div>
//         </div>

//         <button className="w-36 h-12 bg-neutral-50 border border-neutral-200 rounded-lg text-p3 font-semibold text-neutral-900 flex items-center justify-center gap-2">
//           Sort By
//           <Image
//             src="/icons/SortbyIcon.svg"
//             alt="filter"
//             width={18}
//             height={18}
//             className="object-contain"
//           />
//         </button>
//       </div>

//       <div>
//         <Table<CreateDrugProductRequest & ProductData>
//           columns={columns}
//           data={data}
//           loading={loading}
//           actions={(row) => (
//             <div className="flex items-center gap-3">
//               <Image
//                 src="/icons/EditIcon.svg"
//                 alt="edit"
//                 width={20}
//                 height={20}
//                 className="rounded-md object-cover text-[#7D00D3]"
//               />

//               <Image
//                 src="/icons/ViewIcon.svg"
//                 alt="view"
//                 width={20}
//                 height={20}
//                 className="cursor-pointer"
//                 onClick={() => {
//                   setSelectedProductId(row.productId ?? "");
//                   setCurrentView("productView");
//                 }}
//               />

//               <Image
//                 src="/icons/DeleteIcon.svg"
//                 alt="delete"
//                 width={20}
//                 height={20}
//                 className="rounded-md object-cover cursor-pointer"
//                 onClick={() => {
//                   setSelectedProduct(row);
//                   setShowDeleteModal(true);
//                 }}
//               />
//             </div>
//           )}
//         />
//       </div>

//       {/* ✅ DELETE MODAL */}
//       {showDeleteModal && selectedProduct && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-2xl w-[448px] p-6 shadow-xl">
//             {/* ICON */}
//             <div className="flex justify-center mb-4">
//               <div className="w-16 h-16 rounded-full bg-warning-200 flex items-center justify-center">
//                 <span className="text-warning-600 text-2xl font-bold"><HiOutlineExclamationCircle /></span>
//               </div>
//             </div>

//             {/* TITLE */}
//             <h2 className="text-h5 font-bold text-center text-neutral-900">
//               Delete Product?
//             </h2>

//             <p className="text-center text-p3 text-neutral-700 mt-2">
//               This action cannot be undone. The product will be permanently removed
//               from your inventory.
//             </p>

//             {/* PRODUCT INFO */}
//             <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mt-5">
//               <p className="text-p5 text-warning-700 font-semibold">
//                 You are about to delete:
//               </p>

//               <p className="text-p5 font-semibold text-neutral-900 mt-1">
//                 {selectedProduct.productName}
//               </p>

//               <div className="flex justify-between text-p3 mt-3">
//                 <span className="text-warning-600">Category</span>
//                 <span className="text-neutral-900 font-semibold">
//                   Anti-Infectives
//                 </span>
//               </div>

//               <div className="flex justify-between text-p3 mt-1">
//                 <span className="text-warning-600">Stock</span>
//                 <span className="text-success-900 font-bold">
//                   {selectedProduct.pricingDetails?.[0]?.stockQuantity ?? 0} units
//                 </span>
//               </div>
//             </div>

//             {/* WARNING */}
//             <div className="bg-red-100 rounded-xl p-4 mt-5 text-p2 ">
//               <p className="font-semibold mb-2 text-warning-700">This will permanently:</p>
//               <ul className="list-disc pl-5 space-y-1 text-warning-600">
//                 <li>Remove product from all listings</li>
//                 <li>Delete all product images and data</li>
//                 <li>Remove from customer wishlists</li>
//                 <li>Cannot be recovered after deletion</li>
//               </ul>
//             </div>

//             {/* BUTTONS */}
//             <div className="flex gap-4 mt-6">
//               <button
//                 className="flex-1 h-11 rounded-lg bg-neutral-100 text-neutral-900 font-medium"
//                 onClick={() => {
//                   setShowDeleteModal(false);
//                   setSelectedProduct(null);
//                 }}
//               >
//                 Cancel
//               </button>

//               <button
//                 className="flex-1 h-11 rounded-lg bg-warning-500 text-white font-medium flex items-center justify-center gap-2"
//                 onClick={handleDeleteProduct}
//                 disabled={deleting}
//               >
//                 {deleting ? "Deleting..." : "Delete Product"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ProductList;













// code before adding the edit and delete functionality...........


// "use client";

// import React, { useEffect, useState } from "react";
// import Table, { Column } from "@/src/app/commonComponents/Table";
// import { getDrugProductList } from "@/src/services/product/ProductService";
// import { DashboardView } from "@/src/types/seller/dashboard";
// import {
//   CreateDrugProductRequest,
//   ProductData,
// } from "@/src/types/product/ProductData";

// interface ProductListProps {
//   setCurrentView: (view: DashboardView) => void;
//   setSelectedProductId: (id: string) => void;
// }

// const columns: Column<CreateDrugProductRequest & ProductData>[] = [
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
// const ProductList = ({ setCurrentView, setSelectedProductId }: ProductListProps) => {
//   const [data, setData] = useState<(CreateDrugProductRequest & ProductData)[]>(
//     [],
//   );
//   const [loading, setLoading] = useState(false);

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       const response = await getDrugProductList();
//       setData(response || []);
//       console.log("API DATA:", response);
//     } catch (error) {
//       console.error("Error fetching Drug Product List:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

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
//         <div className="relative w-full">
//           <input
//             type="text"
//             name="search"
//             id="search"
//             placeholder="Search"
//             className="border border-neutral-200 text-p4 text-neutral-500 font-semibold w-full h-12 rounded-lg px-5 pr-14 focus:outline-none focus:ring-0 "
//           />

//           <div className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center bg-purple-200 rounded-r-lg">
//             <img src="/icons/SearchIcon.svg" alt="search" className="w-6 h-6" />
//           </div>
//         </div>

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
//         <Table<CreateDrugProductRequest & ProductData>
//           columns={columns}
//           data={data}
//           loading={loading}
//           actions={(row) => (
//             <div className="flex items-center gap-3">
//               <img
//                 src="/icons/EditIcon.svg"
//                 alt="drug"
//                 className="w-5 h-5 rounded-md object-cover text-[#7D00D3]"
//               />
//               <img
//   src="/icons/ViewIcon.svg"
//   className="w-5 h-5 cursor-pointer"
//   onClick={() => {
//     setSelectedProductId(row.productId ?? "");
//     setCurrentView("productView");
//   }}
// />
//               <img
//                 src="/icons/DeleteIcon.svg"
//                 alt="drug"
//                 className="w-5 h-5 rounded-md object-cover"
//               />
//             </div>
//           )}
//         />
//       </div>
//     </>
//   );
// };

// export default ProductList;
