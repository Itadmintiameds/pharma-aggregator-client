"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import { getProductById } from "@/src/services/buyer/buyerProductService";
import { BuyerProduct } from "@/src/types/buyer/product";
import ProductActionPageShell from "../components/ProductActionPageShell";
import GetQuoteForm from "./components/GetQuoteForm";

export default function GetQuotePage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<BuyerProduct | null | undefined>(undefined);

  useEffect(() => {
    getProductById(productId).then((result) => setProduct(result ?? null));
  }, [productId]);

  return (
    <>
      <LandingHeader />
      <main className="pt-38 min-h-screen bg-neutral-50">
        <ProductActionPageShell
          productId={productId}
          product={product}
          icon={<ClipboardList size={20} />}
          title="Get a Quote"
          subtitle="Raise an RFQ and receive competitive quotes from multiple verified sellers."
        >
          {product && <GetQuoteForm productId={productId} product={product} />}
        </ProductActionPageShell>
      </main>
      <Footer />
    </>
  );
}
