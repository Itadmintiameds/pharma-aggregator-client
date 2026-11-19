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
    <div className="w-full">
      <button
        onClick={() => router.push("/buyer_e8d45a1b/dashboard/orders")}
        className="mb-2 flex items-center gap-1.5 text-xs font-medium text-pneutral-600 hover:text-pneutral-900"
      >
        <HiOutlineArrowLeft size={14} />
        Back to My Orders
      </button>

      <OrderDetailContent
        orderId={params.orderId}
        loginRedirectPath={`/buyer_e8d45a1b/dashboard/orders/${params.orderId}`}
      />
    </div>
  );
}
