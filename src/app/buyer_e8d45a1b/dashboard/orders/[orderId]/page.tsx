"use client";

import { useParams, useRouter } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import OrderDetailContent from "@/src/app/components/orders/OrderDetailContent";

// Dashboard-scoped counterpart to src/app/orders/[orderId] — same
// OrderDetailContent body, but stays inside the dashboard shell (sidebar/
// header from ./layout.tsx) instead of bouncing the buyer out to the
// marketing-site order page with its own LandingHeader/Footer.
export default function DashboardOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/buyer_e8d45a1b/dashboard/orders")}
        className="flex items-center gap-2 text-p3 font-body text-pneutral-600 hover:text-pneutral-900 mb-6"
      >
        <HiOutlineArrowLeft size={16} />
        Back to My Orders
      </button>

      <OrderDetailContent
        orderId={params.orderId}
        loginRedirectPath={`/buyer_e8d45a1b/dashboard/orders/${params.orderId}`}
      />
    </div>
  );
}
