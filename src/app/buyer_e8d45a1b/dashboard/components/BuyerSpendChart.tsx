"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Buyer-owned fork of seller's dashboard/components/SalesChart.tsx, relabeled
// for spend instead of revenue. Sample data — no purchase-history API exists
// yet for buyers.
const data = [
  { month: "Jun", spend: 42000, orders: 6 },
  { month: "Jul", spend: 58000, orders: 9 },
  { month: "Aug", spend: 51000, orders: 8 },
  { month: "Sep", spend: 67000, orders: 11 },
  { month: "Oct", spend: 60000, orders: 10 },
  { month: "Nov", spend: 73000, orders: 13 },
  { month: "Dec", spend: 65000, orders: 12 },
  { month: "Jan", spend: 81000, orders: 15 },
];

export default function BuyerSpendChart() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Spend Overtime</h3>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-tertiary-600 rounded-full" />
            Spend
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
          <Line type="monotone" dataKey="spend" stroke="#D1A000" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="orders" stroke="#6C00B7" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
