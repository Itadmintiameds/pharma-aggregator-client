"use client";

import React from "react";

// Buyer-owned fork of seller's dashboard/components/WeeklySummaryCard.tsx —
// same two-column / three-column layout, no buyer-specific changes needed
// beyond the props passed in from the overview page.
interface BuyerSummaryCardProps {
  icon: React.ReactNode;
  titleLeft: string;
  valueLeft: string;
  growthLeft?: string;
  titleRight: string;
  valueRight: string;
  growthRight?: string;
  pendingCount?: string;
  isThreeColumn?: boolean;
  bgColor?: string;
}

export default function BuyerSummaryCard({
  icon,
  titleLeft,
  valueLeft,
  growthLeft,
  titleRight,
  valueRight,
  growthRight,
  pendingCount,
  isThreeColumn = false,
  bgColor = "bg-purple-100",
}: BuyerSummaryCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
      <div className="flex justify-between items-center mb-6">
        <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
        <select className="text-sm text-neutral-400 rounded-md px-3 py-1">
          <option>This Week</option>
          <option>This Month</option>
        </select>
      </div>

      {isThreeColumn ? (
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-sm font-body text-neutral-500">{titleLeft}</p>
            <p className="text-xl font-bold font-heading">{valueLeft}</p>
          </div>
          <div className="space-y-1 border-l border-neutral-200 pl-6">
            <p className="text-sm font-body text-neutral-500">Pending</p>
            <p className="text-xl font-bold font-heading">{pendingCount}</p>
          </div>
          <div className="space-y-1 border-l border-neutral-200 pl-6">
            <p className="text-sm font-body text-neutral-500">{titleRight}</p>
            <p className="text-xl font-bold font-heading">{valueRight}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm font-body text-neutral-500">{titleLeft}</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold font-heading">{valueLeft}</p>
              {growthLeft && <p className="text-sm font-body text-success-900">{growthLeft}</p>}
            </div>
          </div>
          <div className="border-l border-neutral-200 pl-6 space-y-1">
            <p className="text-sm font-body text-neutral-500">{titleRight}</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold font-heading">{valueRight}</p>
              {growthRight && <p className="text-sm font-body text-success-900">{growthRight}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
