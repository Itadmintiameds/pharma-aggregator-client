"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { getAllProducts } from "@/src/services/buyer/buyerProductService";
import { BuyerProduct } from "@/src/types/buyer/product";
import ProductCard from "./ProductCard";
import SectionTitleBar from "./SectionTitleBar";

const DEAL_COUNT = 8;

const Deals = () => {
  const [products, setProducts] = useState<BuyerProduct[]>([]);

  useEffect(() => {
    getAllProducts()
      .then((result) => setProducts(result.slice(0, DEAL_COUNT)))
      .catch(() => setProducts([]));
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="max-w-[1280px] mx-auto px-3 sm:px-4 py-10 w-full">
      <SectionTitleBar icon={<Zap size={24} />} title="Deal of the day" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 xl:gap-6 items-start">
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </section>
  );
};

export default Deals;
