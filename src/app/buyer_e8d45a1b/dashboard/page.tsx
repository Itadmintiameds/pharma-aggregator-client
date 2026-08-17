"use client";

import { HiOutlineShoppingBag, HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { LuWarehouse, LuWallet } from "react-icons/lu";
import { AiOutlinePieChart } from "react-icons/ai";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import BuyerKpiCard from "./components/BuyerKpiCard";
import BuyerSpendChart from "./components/BuyerSpendChart";
import RecentOrdersCard from "./components/RecentOrdersCard";
import BuyerSummaryCard from "./components/BuyerSummaryCard";
import DocumentExpiryCard from "./components/DocumentExpiryCard";

// Overview content — auth guard, sidebar, header, and the onboarding gate
// all live in ./layout.tsx, shared with the other dashboard routes (profile,
// catalog, orders, ...). KPI cards/chart/summary cards mirror seller's
// DashboardOverview.tsx layout with buyer-relevant metrics (orders, spend,
// RFQs, suppliers instead of seller's orders/revenue/products); the document
// expiry card has no seller equivalent and reads real TempBuyer data.
export default function BuyerDashboardPage() {
  const { tempBuyer } = useBuyerOnboardingStatus();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">Overview</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          A snapshot of your buying activity across the marketplace.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <BuyerKpiCard
          title="Total Orders"
          value={128}
          growth="+6.4%"
          icon={<HiOutlineShoppingBag size={20} />}
          style={{ backgroundColor: "#DED0FE" }}
        />
        <BuyerKpiCard
          title="Active RFQs"
          value={18}
          growth="+3.1%"
          icon={<HiOutlineClipboardDocumentList size={20} />}
          className="bg-white"
        />
        <BuyerKpiCard
          title="Total Spend"
          value="₹4,32,000"
          growth="+9.8%"
          icon={<LuWallet size={20} />}
          className="bg-white"
        />
        <BuyerKpiCard
          title="Saved Suppliers"
          value={12}
          growth="+2"
          icon={<LuWarehouse size={20} />}
          className="bg-white"
        />
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-h-[324px]">
          <BuyerSpendChart />
        </div>
        <div className="min-h-[324px]">
          <RecentOrdersCard />
        </div>
      </div>

      {/* Summary cards + document expiry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BuyerSummaryCard
          icon={<AiOutlinePieChart size={36} />}
          titleLeft="Spend"
          valueLeft="₹4,32,000"
          growthLeft="+9.80%"
          titleRight="Orders"
          valueRight="15"
          growthRight="+8.10%"
        />

        <BuyerSummaryCard
          icon={<LuWarehouse size={36} />}
          titleLeft="All RFQs"
          valueLeft="18"
          titleRight="Quoted"
          valueRight="13"
          pendingCount="5"
          isThreeColumn
          bgColor="bg-yellow-50"
        />

        <DocumentExpiryCard documents={tempBuyer?.documents} />
      </div>
    </div>
  );
}
