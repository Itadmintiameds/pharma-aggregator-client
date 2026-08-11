"use client";

import { useEffect, useState } from "react";
import { getAllProducts } from "@/src/services/buyer/buyerProductService";
import { BuyerProduct } from "@/src/types/buyer/product";

export default function ProductListing() {
  const [products, setProducts] = useState<BuyerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllProducts()
      .then(setProducts)
      .catch(() => setError("Failed to load products. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-p3 font-body text-neutral-600">Loading products...</p>;
  }

  if (error) {
    return <p className="text-p3 font-body text-red-500">{error}</p>;
  }

  if (products.length === 0) {
    return <p className="text-p3 font-body text-neutral-600">No products available yet.</p>;
  }

  return (
    <div>
      <h2 className="text-h4 font-heading font-medium text-pneutral-900 mb-6">Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const pricing = product.pricingDetails?.[0];
          const image = product.productImages?.[0]?.productImage;

          return (
            <div
              key={product.productId}
              className="bg-white rounded-xl shadow-md p-4 border border-neutral-100"
            >
              <img
                src={image || "/icons/Tumbnail.svg"}
                alt={product.productName}
                className="w-full h-36 object-cover rounded-lg mb-3 bg-neutral-50"
              />
              <h3 className="text-p2 font-heading font-semibold text-pneutral-900 truncate">
                {product.productName}
              </h3>
              {product.manufacturerName && (
                <p className="text-p4 font-body text-neutral-500 truncate mb-2">
                  {product.manufacturerName}
                </p>
              )}
              {pricing && (
                <div className="flex items-center gap-2 mt-1">
                  {pricing.mrp != null && (
                    <span className="text-p4 font-body text-neutral-400 line-through">
                      ₹{pricing.mrp}
                    </span>
                  )}
                  {pricing.sellingPrice != null && (
                    <span className="text-p2 font-heading font-semibold text-primary-800">
                      ₹{pricing.sellingPrice}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
