"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BuyerProduct } from "@/src/types/buyer/product";
import ProductSummaryCard from "./ProductSummaryCard";

interface ProductActionPageShellProps {
  productId: string;
  product: BuyerProduct | null | undefined;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function ProductActionPageShell({
  productId,
  product,
  icon,
  title,
  subtitle,
  children,
}: ProductActionPageShellProps) {
  const router = useRouter();

  if (product === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-md p-8 animate-pulse">
          <div className="h-6 bg-neutral-100 rounded w-1/3 mb-6" />
          <div className="h-40 bg-neutral-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <p className="text-p2 font-body text-pneutral-600">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <button
        type="button"
        onClick={() => router.push(`/product/${productId}`)}
        className="inline-flex items-center gap-2 text-p4 font-heading font-medium text-pneutral-600 hover:text-primary-800 mb-6"
      >
        <ArrowLeft size={16} />
        Back to product
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl bg-primary-05 text-primary-700 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h1 className="text-h5 font-heading font-semibold text-pneutral-900">{title}</h1>
          <p className="text-p4 font-body text-pneutral-600 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">{children}</div>
        <ProductSummaryCard product={product} />
      </div>
    </div>
  );
}
