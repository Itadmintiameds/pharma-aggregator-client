"use client";

import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

// Buyer-specific counterpart to seller's TopSellingCard.tsx — a seller cares
// about which products are moving, a buyer cares about what they've recently
// ordered and its status. Sample data — no order-history API exists yet.
const RECENT_ORDERS = [
  { id: "ORD-20482", seller: "MedCore Pharma", amount: "₹18,400", status: "Delivered" },
  { id: "ORD-20475", seller: "Wellness Labs", amount: "₹6,750", status: "Shipped" },
  { id: "ORD-20461", seller: "HealthFirst Distributors", amount: "₹42,100", status: "Processing" },
];

const STATUS_COLOR: Record<string, string> = {
  Delivered: "text-success-900",
  Shipped: "text-info-600",
  Processing: "text-warning-600",
};

export default function RecentOrdersCard() {
  const router = useRouter();

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold font-heading text-black">Recent Orders</h3>
        <button
          onClick={() => router.push("/buyer_e8d45a1b/dashboard/orders")}
          className="text-sm px-4 py-1.5 border border-neutral-200 rounded-lg bg-white font-body text-neutral-700 hover:bg-neutral-50 shadow-sm transition"
        >
          See All Orders
        </button>
      </div>

      <div className="divide-y divide-neutral-100">
        {RECENT_ORDERS.map((order) => (
          <div key={order.id} className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <span className="w-[52px] h-[52px] rounded-md bg-primary-05 text-primary-700 flex items-center justify-center flex-shrink-0">
                <Package size={22} />
              </span>

              <div className="space-y-0.5">
                <p className="text-sm font-semibold font-heading text-black">{order.id}</p>
                <p className="text-xs font-body text-neutral-500">{order.seller}</p>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <p className={`text-sm font-medium font-body flex items-center justify-end gap-1 ${STATUS_COLOR[order.status]}`}>
                <span className="text-base leading-none">•</span>
                {order.status}
              </p>
              <p className="text-xs font-body text-neutral-600">{order.amount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
