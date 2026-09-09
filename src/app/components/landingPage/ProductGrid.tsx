"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllProducts } from "@/src/services/buyer/buyerProductService";
import { BuyerProduct } from "@/src/types/buyer/product";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  searchQuery?: string;
}

export default function ProductGrid({ searchQuery = "" }: ProductGridProps) {
  const [products, setProducts] = useState<BuyerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllProducts()
      .then(setProducts)
      .catch(() => setError("Failed to load products. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.productName?.toLowerCase().includes(query) ||
        product.manufacturerName?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  return (
    <div id="products" className="py-10 bg-base-white">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4">
        <h2 className="font-heading font-semibold text-h4 text-pneutral-900 mb-10">Products</h2>

        {loading && <p className="text-pneutral-500">Loading products...</p>}
        {!loading && error && <p className="text-warning-600">{error}</p>}
        {!loading && !error && filteredProducts.length === 0 && (
          <p className="text-pneutral-500">No products found.</p>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 xl:gap-6 items-start">
            {filteredProducts.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
