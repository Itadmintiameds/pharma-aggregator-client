"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "Jun", revenue: 12000, orders: 8000 },
  { month: "Jul", revenue: 18000, orders: 10000 },
  { month: "Aug", revenue: 15000, orders: 9000 },
  { month: "Sep", revenue: 20000, orders: 14000 },
  { month: "Oct", revenue: 17000, orders: 12000 },
  { month: "Nov", revenue: 22000, orders: 16000 },
  { month: "Dec", revenue: 19000, orders: 15000 },
  { month: "Jan", revenue: 25000, orders: 18000 },
];

const SalesChart = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">
          Sales Overtime
        </h3>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-tertiary-600 rounded-full" />
            Revenue
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-700 rounded-full" />
            Orders
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#D1A000"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#6C00B7"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;