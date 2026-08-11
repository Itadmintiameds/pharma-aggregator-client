"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductById } from "@/src/services/buyer/buyerProductService";
import { BuyerProduct } from "@/src/types/buyer/product";
import { useCart } from "@/src/context/CartContext";
import Button from "@/src/app/commonComponents/Button";

const PLACEHOLDER_IMAGE = "/icons/Tumbnail.svg";

interface FieldRowProps {
  label: string;
  value?: React.ReactNode;
}

function FieldRow({ label, value }: FieldRowProps) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-neutral-200">
      <p className="text-p3 font-heading font-medium text-pneutral-700">{label}</p>
      <p className="text-p3 font-body text-pneutral-800 text-right">{value}</p>
    </div>
  );
}

interface ProductDetailProps {
  productId: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<BuyerProduct | null | undefined>(undefined);
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    getProductById(productId).then((result) => setProduct(result ?? null));
  }, [productId]);

  if (product === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-md p-8 animate-pulse">
          <div className="h-64 bg-neutral-100 rounded-xl mb-6" />
          <div className="h-6 bg-neutral-100 rounded w-1/2 mb-3" />
          <div className="h-4 bg-neutral-100 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <p className="text-p2 font-body text-pneutral-600">Product not found.</p>
      </div>
    );
  }

  const images = product.productImages?.map((img) => img.productImage).filter(Boolean) as string[];
  const displayImages = images && images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const pricing = product.pricingDetails?.[0];
  const totalStock = product.pricingDetails?.reduce(
    (sum, p) => sum + (p.stockQuantity ?? 0),
    0
  );

  const handleAddToCart = () => addItem(product);
  const handleBuyNow = () => {
    addItem(product);
    router.push("/cart");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow-md p-8">
        {/* Image gallery */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {displayImages.slice(0, 5).map((src, index) => (
            <div
              key={index}
              className="relative h-40 overflow-hidden rounded-xl bg-neutral-50"
            >
              <img
                src={src}
                alt={product.productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
              />
              {index === 0 && (
                <span className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>

        <h1 className="text-h4 font-heading font-medium text-pneutral-900 mb-1">
          {product.productName}
        </h1>
        {product.manufacturerName && (
          <p className="text-p3 font-body text-pneutral-600 mb-6">{product.manufacturerName}</p>
        )}

        {/* Pricing */}
        <div className="flex items-center gap-3 mb-6">
          {pricing?.sellingPrice != null && (
            <span className="text-h5 font-heading font-semibold text-primary-800">
              ₹{pricing.sellingPrice}
            </span>
          )}
          {pricing?.mrp != null && pricing.mrp !== pricing?.sellingPrice && (
            <span className="text-p3 font-body text-neutral-400 line-through">₹{pricing.mrp}</span>
          )}
          {pricing?.discountPercentage != null && pricing.discountPercentage > 0 && (
            <span className="text-p4 font-body text-success-600">
              {pricing.discountPercentage}% off
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mb-8">
          <Button variant="filled" size="lg" label="Add to Cart" onClick={handleAddToCart} />
          <Button variant="outline" size="lg" label="Buy Now" onClick={handleBuyNow} />
        </div>

        {/* Fields */}
        <div className="space-y-0">
          <FieldRow
            label="Availability"
            value={totalStock != null ? (totalStock > 0 ? `${totalStock} in stock` : "Out of stock") : undefined}
          />
          <FieldRow label="GST" value={product.gstPercentage != null ? `${product.gstPercentage}%` : undefined} />
          <FieldRow label="HSN Code" value={product.hsnCode} />
        </div>

        {product.productDescription && (
          <div className="mt-6">
            <h2 className="text-p2 font-heading font-medium text-pneutral-900 mb-2">Description</h2>
            <p className="text-p3 font-body text-pneutral-700 leading-relaxed">
              {product.productDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
