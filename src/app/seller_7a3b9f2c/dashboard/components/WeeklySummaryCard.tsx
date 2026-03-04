"use client";

import React from "react";

interface WeeklySummaryCardProps {
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

const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
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
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>

        <select className="text-sm text-neutral-400  rounded-md px-3 py-1">
          <option>This Week</option>
          <option>This Month</option>
        </select>
      </div>

      {/* Body */}
      {isThreeColumn ? (
        /* 🔥 3 Column Layout (All Orders Card) */
        <div className="grid grid-cols-3 gap-6 text-center">
          {/* All Orders */}
          <div className="space-y-1">
            <p className="text-sm text-neutral-500">{titleLeft}</p>
            <p className="text-xl font-semibold">{valueLeft}</p>
          </div>

          {/* Pending */}
          <div className="space-y-1 border-l border-neutral-200 pl-6">
            <p className="text-sm text-neutral-500">Pending</p>
            <p className="text-xl font-semibold">
              {pendingCount}
            </p>
          </div>

          {/* Completed */}
          <div className="space-y-1 border-l border-neutral-200 pl-6">
            <p className="text-sm text-neutral-500">{titleRight}</p>
            <p className="text-xl font-semibold">
              {valueRight}
            </p>
          </div>
        </div>
      ) : (
        /* ✅ Default 2 Column Layout */
        <div className="grid grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="space-y-1">
            <p className="text-sm text-neutral-500">{titleLeft}</p>

            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold">{valueLeft}</p>

              {growthLeft && (
                <p className="text-sm text-success-1000">
                  {growthLeft}
                </p>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="border-l border-neutral-200 pl-6 space-y-1">
            <p className="text-sm text-neutral-500">{titleRight}</p>

            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold">{valueRight}</p>

              {growthRight && (
                <p className="text-sm text-success-1000">
                  {growthRight}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklySummaryCard;