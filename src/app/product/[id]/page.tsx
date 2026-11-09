"use client";

import { useParams } from "next/navigation";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import ProductDetail from "./components/ProductDetail";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  return (
    <>
      <LandingHeader />
      <main className="pt-38 min-h-screen bg-neutral-50">
        <ProductDetail productId={productId} />
      </main>
      <Footer />
    </>
  );
}
