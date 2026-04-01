"use client";

import React, { useEffect, useState } from "react";
import Table, { Column } from "@/src/app/commonComponents/Table";
import { getProductList } from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import {ProductListData} from "@/src/types/product/ProductData";
import CommonModal from "../commonComponent/CommonModal";
import DeleteProduct from "./DeleteProduct";

interface ProductListProps {
  setCurrentView: (view: DashboardView) => void;
  setSelectedProductId: (id: string) => void;
}

const columns: Column<ProductListData>[] = [
  {
    header: "Thumbnail",
    accessor: () => (
      <img
        src="/icons/Tumbnail.svg"
        alt="drug"
        className="w-10 h-10 rounded-md object-cover"
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
// const ProductList = () => {
const ProductList = ({
  setCurrentView,
  setSelectedProductId,
}: ProductListProps) => {

  const [data, setData] = useState<ProductListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<string | null>(null);

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
        setSelectedProductId(row.productId ?? "");
        setCurrentView("editProduct");
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













// old code without edit functionality.............
// "use client";

// import React, { useEffect, useState } from "react";
// import Table, { Column } from "@/src/app/commonComponents/Table";
// import { getProductList } from "@/src/services/product/ProductService";
// import { DashboardView } from "@/src/types/seller/dashboard";
// import {
//   ProductListData,
// } from "@/src/types/product/ProductData";
// import CommonModal from "../commonComponent/CommonModal";
// import DeleteProduct from "./DeleteProduct";

// interface ProductListProps {
//   setCurrentView: (view: DashboardView) => void;
//   setSelectedProductId: (id: string) => void;
// }

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
//   const [selectedProductIdLocal, setSelectedProductIdLocal] = useState<string | null>(null);

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       const response = await getProductList();
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
//         <Table<ProductListData>
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
//                 src="/icons/ViewIcon.svg"
//                 className="w-5 h-5 cursor-pointer"
//                 onClick={() => {
//                   setSelectedProductId(row.productId ?? "");
//                   setCurrentView("productView");
//                 }}
//               />
//               <img
//                 src="/icons/DeleteIcon.svg"
//                 alt="delete"
//                 className="w-5 h-5 rounded-md object-cover cursor-pointer"
//                 onClick={() => {
//                   setSelectedProductIdLocal(row.productId);
//                   setOpenDeleteModal(true);
//                 }}
//               />
//             </div>
//           )}
//         />
//       </div>
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