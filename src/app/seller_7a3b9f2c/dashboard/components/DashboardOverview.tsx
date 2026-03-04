"use client";

import React from "react";
import {  CircleDashed } from "lucide-react";
import { HiOutlineCircleStack , HiOutlineUserGroup} from "react-icons/hi2";
import { BsHandbag } from "react-icons/bs";
import { AiOutlinePieChart } from "react-icons/ai";
import DashboardFilters from "./DashboardFilters";
import KpiCard from "./KpiCard";
import SalesChart from "./SalesChart";
import TopSellingCard from "./TopSellingCard";
import WeeklySummaryCard from "./WeeklySummaryCard";
import ProductTable from "./ProductTable";
import { DashboardView } from "@/src/types/seller/dashboard";


interface DashboardOverviewProps {
  setCurrentView: (view: DashboardView) => void;
}

const DashboardOverview = ( { setCurrentView }: DashboardOverviewProps) => {
  return (
    <div className="space-y-8">

      {/* Filters */}
       <DashboardFilters setCurrentView={setCurrentView} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
    title="Total Orders"
    value={6531}
    growth="+2.24%"
    icon={
      <HiOutlineCircleStack 
        size={22}
      />
    }
  />

  <KpiCard
    title="New Orders"
    value={653}
    growth="+2.24%"
    icon={
      <BsHandbag 
        size={20} 
      />
    }
  />

  <KpiCard
    title="Pending Orders"
    value={53}
    growth="+2.24%"
    icon={
      <CircleDashed 
        size={20} 
      />
    }
  />

  <KpiCard
    title="Completed Orders"
    value={63}
    growth="+2.24%"
    icon={
      <CircleDashed 
        size={20} 
      />
    }
  />
      </div>
      {/* Chart + Top Selling Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <SalesChart />
  <TopSellingCard />
</div>

{/* Weekly Summary Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <WeeklySummaryCard
    icon={<AiOutlinePieChart size={36} />}
    titleLeft="Sales"
    valueLeft="$4,000,000.00"
    titleRight="Volume"
    valueRight="450"
    growthRight="+20.00%"
  />

  <WeeklySummaryCard
    icon={<HiOutlineUserGroup size={36} />}
    titleLeft="Customers"
    valueLeft="1,250"
    growthLeft="+15.80%"
    titleRight="Active"
    valueRight="1,180"
    growthRight="85%"
    bgColor="bg-tertiary-50"
  />

  <WeeklySummaryCard
  icon={<BsHandbag size={36} />}
  titleLeft="All Orders"
  valueLeft="450"
  titleRight="Completed"
  valueRight="445"
  pendingCount="5"
  isThreeColumn
  bgColor="bg-tertiary-50"
/>
</div>
<ProductTable />

    </div>
  );
};

export default DashboardOverview;







// this code is included with product delete and edit functionality...........

// "use client";

// import React from "react";
// import {  CircleDashed } from "lucide-react";
// import { HiOutlineCircleStack , HiOutlineUserGroup} from "react-icons/hi2";
// import { BsHandbag } from "react-icons/bs";
// import { AiOutlinePieChart } from "react-icons/ai";
// import DashboardFilters from "./DashboardFilters";
// import KpiCard from "./KpiCard";
// import SalesChart from "./SalesChart";
// import TopSellingCard from "./TopSellingCard";
// import WeeklySummaryCard from "./WeeklySummaryCard";
// import ProductTable from "./ProductTable";
// import { DashboardView } from "@/src/types/seller/dashboard";

// interface DashboardOverviewProps {
//   setCurrentView: (view: DashboardView) => void;
// }

// const DashboardOverview = ( { setCurrentView }: DashboardOverviewProps) => {

//   const handleEditProduct = (productId: string) => {
//   // This will navigate to the add product page in edit mode
//   // You'll need to pass this up to SellerDashboard
//   console.log("Edit product:", productId);
// };

// const handleDeleteProduct = (productId: string) => {
//   console.log("Delete product:", productId);
// };

//   return (
//     <div className="space-y-8">

//       {/* Filters */}
//        <DashboardFilters setCurrentView={setCurrentView} />

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         <KpiCard
//     title="Total Orders"
//     value={6531}
//     growth="+2.24%"
//     icon={
//       <HiOutlineCircleStack 
//         size={22}
//       />
//     }
//   />

//   <KpiCard
//     title="New Orders"
//     value={653}
//     growth="+2.24%"
//     icon={
//       <BsHandbag 
//         size={20} 
//       />
//     }
//   />

//   <KpiCard
//     title="Pending Orders"
//     value={53}
//     growth="+2.24%"
//     icon={
//       <CircleDashed 
//         size={20} 
//       />
//     }
//   />

//   <KpiCard
//     title="Completed Orders"
//     value={63}
//     growth="+2.24%"
//     icon={
//       <CircleDashed 
//         size={20} 
//       />
//     }
//   />
//       </div>
//       {/* Chart + Top Selling Section */}
// <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//     <SalesChart />
//   <TopSellingCard />
// </div>

// {/* Weekly Summary Cards */}
// <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//   <WeeklySummaryCard
//     icon={<AiOutlinePieChart size={36} />}
//     titleLeft="Sales"
//     valueLeft="$4,000,000.00"
//     titleRight="Volume"
//     valueRight="450"
//     growthRight="+20.00%"
//   />

//   <WeeklySummaryCard
//     icon={<HiOutlineUserGroup size={36} />}
//     titleLeft="Customers"
//     valueLeft="1,250"
//     growthLeft="+15.80%"
//     titleRight="Active"
//     valueRight="1,180"
//     growthRight="85%"
//     bgColor="bg-tertiary-50"
//   />

//   <WeeklySummaryCard
//   icon={<BsHandbag size={36} />}
//   titleLeft="All Orders"
//   valueLeft="450"
//   titleRight="Completed"
//   valueRight="445"
//   pendingCount="5"
//   isThreeColumn
//   bgColor="bg-tertiary-50"
// />
// </div>
// <ProductTable 
//   onEdit={handleEditProduct}
//   onDelete={handleDeleteProduct}
// />

//     </div>
//   );
// };

// export default DashboardOverview;











