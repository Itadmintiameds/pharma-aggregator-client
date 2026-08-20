"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { getBuyerId } from "@/src/services/buyer/buyerProfileService";
import { getOrdersByBuyer } from "@/src/services/buyer/orderService";
import { Order } from "@/src/types/buyer/order";

const STATUS_STYLES: Record<string, string> = {
  PLACED: "bg-blue-50 text-blue-700",
  PARTIALLY_SHIPPED: "bg-amber-50 text-amber-700",
  SHIPPED: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function OrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buyerAuthService.isAuthenticated()) {
      router.replace("/buyer_e8d45a1b/login?redirect=/orders");
      return;
    }

    const currentUser = buyerAuthService.getCurrentUser();
    if (!currentUser?.buyerUserId) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    (async () => {
      try {
        const buyerId = await getBuyerId(currentUser.buyerUserId);
        const data = await getOrdersByBuyer(buyerId);
        setOrders(data.sort((a, b) => (b.placedAt ?? "").localeCompare(a.placedAt ?? "")));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your orders.");
      }
    })();
  }, [router]);

  return (
    <>
      <LandingHeader />
      <main className="pt-38 min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-h4 font-heading font-medium text-pneutral-900 mb-8">My Orders</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-p3 font-body text-red-700">{error}</p>
            </div>
          )}

          {orders === null && !error && (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
            </div>
          )}

          {orders !== null && orders.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <p className="text-p2 font-body text-pneutral-600 mb-4">You haven&apos;t placed any orders yet.</p>
              <Link href="/" className="text-primary-800 font-semibold">
                Start shopping
              </Link>
            </div>
          )}

          {orders !== null && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.orderId}
                  href={`/orders/${order.orderId}`}
                  className="block bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-p2 font-heading font-semibold text-pneutral-900 flex items-center gap-2">
                        {order.orderId}
                        {order.quoteRequestId != null && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                            From Quote
                          </span>
                        )}
                      </p>
                      <p className="text-p4 font-body text-pneutral-500">
                        {order.placedAt ? new Date(order.placedAt).toLocaleString() : ""}
                      </p>
                    </div>
                    <span
                      className={`text-p4 font-body font-semibold px-3 py-1 rounded-full ${
                        STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                    <p className="text-p3 font-body text-pneutral-600">
                      {order.itemCount} item(s) · {order.sellerOrderCount} seller(s)
                    </p>
                    <p className="text-p2 font-heading font-semibold text-pneutral-900">
                      ₹{order.grandTotal?.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
