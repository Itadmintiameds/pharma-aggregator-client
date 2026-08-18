"use client";

import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { Order } from "@/src/types/buyer/order";

// Buyer-specific counterpart to seller's TopSellingCard.tsx — a seller cares
// about which products are moving, a buyer cares about what they've recently
// ordered and its status. `orders` is fetched once by the overview page via
// useBuyerOrders and passed down so this card and the KPI cards share one
// network call instead of each re-fetching the same list.
const STATUS_COLOR: Record<string, string> = {
  PLACED: "text-info-600",
  PARTIALLY_SHIPPED: "text-warning-600",
  SHIPPED: "text-warning-600",
  DELIVERED: "text-success-900",
  CANCELLED: "text-red-500",
};

interface RecentOrdersCardProps {
  orders: Order[] | null;
  error: string | null;
}

export default function RecentOrdersCard({ orders, error }: RecentOrdersCardProps) {
  const router = useRouter();
  const recentOrders = orders?.slice(0, 3) ?? [];

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

      {error && <p className="text-sm font-body text-red-500">{error}</p>}

      {!error && orders === null && (
        <p className="text-sm font-body text-neutral-500 py-4">Loading your orders...</p>
      )}

      {!error && orders !== null && recentOrders.length === 0 && (
        <p className="text-sm font-body text-neutral-500 py-4">You haven&apos;t placed any orders yet.</p>
      )}

      <div className="divide-y divide-neutral-100">
        {recentOrders.map((order) => (
          <div
            key={order.orderId}
            className="flex items-center justify-between py-4 cursor-pointer"
            onClick={() => router.push(`/buyer_e8d45a1b/dashboard/orders/${order.orderId}`)}
          >
            <div className="flex items-center gap-4">
              <span className="w-[52px] h-[52px] rounded-md bg-primary-05 text-primary-700 flex items-center justify-center flex-shrink-0">
                <Package size={22} />
              </span>

              <div className="space-y-0.5">
                <p className="text-sm font-semibold font-heading text-black">{order.orderId}</p>
                <p className="text-xs font-body text-neutral-500">
                  {order.itemCount ?? order.sellerOrders.reduce((n, so) => n + so.items.length, 0)} item(s)
                </p>
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <p
                className={`text-sm font-medium font-body flex items-center justify-end gap-1 ${
                  STATUS_COLOR[order.status] ?? "text-neutral-600"
                }`}
              >
                <span className="text-base leading-none">•</span>
                {order.status}
              </p>
              <p className="text-xs font-body text-neutral-600">₹{order.grandTotal?.toFixed(2) ?? "0.00"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
