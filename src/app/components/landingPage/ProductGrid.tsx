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
    <div className="py-14 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-10">Products</h2>

        {loading && <p className="text-gray-500">Loading products...</p>}
        {!loading && error && <p className="text-red-500">{error}</p>}
        {!loading && !error && filteredProducts.length === 0 && (
          <p className="text-gray-500">No products found.</p>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
