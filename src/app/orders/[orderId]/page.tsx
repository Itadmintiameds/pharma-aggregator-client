"use client";

import { useParams } from "next/navigation";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import OrderDetailContent from "@/src/app/components/orders/OrderDetailContent";

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();

  return (
    <>
      <LandingHeader />
      <main className="pt-38 min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <OrderDetailContent
            orderId={params.orderId}
            loginRedirectPath={`/orders/${params.orderId}`}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
