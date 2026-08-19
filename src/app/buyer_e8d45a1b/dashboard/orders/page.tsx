"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuyerOrders } from "@/src/hooks/useBuyerOrders";

const STATUS_STYLES: Record<string, string> = {
  PLACED: "bg-info-50 text-info-600",
  PARTIALLY_SHIPPED: "bg-warning-50 text-warning-600",
  SHIPPED: "bg-warning-50 text-warning-600",
  DELIVERED: "bg-success-50 text-success-600",
  CANCELLED: "bg-red-50 text-red-500",
};

// Matches the page-size/pagination pattern used by seller's ProductList.tsx.
const PAGE_SIZE = 10;

export default function BuyerOrdersPage() {
  const router = useRouter();
  const { orders, error } = useBuyerOrders();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = orders ? Math.max(1, Math.ceil(orders.length / PAGE_SIZE)) : 1;
  const safePage = Math.min(currentPage, totalPages);
  const pagedOrders = orders?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">My Orders</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Every order you&apos;ve placed across sellers on the marketplace.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-p3 font-body text-red-700">{error}</p>
        </div>
      )}

      {!error && orders === null && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
        </div>
      )}

      {!error && orders !== null && orders.length === 0 && (
        <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm p-12 text-center">
          <p className="text-p2 font-body text-pneutral-600">You haven&apos;t placed any orders yet.</p>
        </div>
      )}

      {!error && orders !== null && orders.length > 0 && (
        <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-secondary-600 text-label-l2 font-heading text-pneutral-50">
                <tr>
                  <th className="px-5 py-3 font-medium">Order ID</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Sellers</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedOrders.map((order) => (
                  <tr
                    key={order.orderId}
                    onClick={() => router.push(`/buyer_e8d45a1b/dashboard/orders/${order.orderId}`)}
                    className="border-b border-neutral-100 last:border-0 cursor-pointer hover:bg-neutral-50"
                  >
                    <td className="px-5 py-3 text-p3 font-body font-semibold text-pneutral-900">{order.orderId}</td>
                    <td className="px-5 py-3 text-p3 font-body text-pneutral-600">
                      {order.placedAt ? new Date(order.placedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-p3 font-body text-pneutral-600">{order.sellerOrderCount ?? order.sellerOrders.length}</td>
                    <td className="px-5 py-3 text-p3 font-body text-pneutral-600">{order.itemCount ?? "—"}</td>
                    <td className="px-5 py-3 text-p3 font-body text-pneutral-900">₹{order.grandTotal?.toFixed(2) ?? "0.00"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-label-l2 font-heading font-medium ${
                          STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-p4 font-body text-neutral-600 p-4">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}-
              {Math.min(safePage * PAGE_SIZE, orders.length)} of {orders.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`px-3 py-1.5 rounded-md border text-p4 font-semibold ${
                  safePage === 1
                    ? "border-neutral-200 text-neutral-400 cursor-not-allowed"
                    : "border-primary-900 text-primary-900 cursor-pointer hover:bg-primary-50"
                }`}
              >
                Previous
              </button>
              <span className="px-2">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={`px-3 py-1.5 rounded-md border text-p4 font-semibold ${
                  safePage === totalPages
                    ? "border-neutral-200 text-neutral-400 cursor-not-allowed"
                    : "border-primary-900 text-primary-900 cursor-pointer hover:bg-primary-50"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
