"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaShoppingCart } from "react-icons/fa";
import Button from "@/src/app/commonComponents/Button";
import { useCart } from "@/src/context/CartContext";
import { BuyerProduct } from "@/src/types/buyer/product";

interface ProductCardProps {
  product: BuyerProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const pricing = product.pricingDetails?.[0];
  const image = product.productImages?.[0]?.productImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    router.push("/cart");
  };

  return (
    <Link
      href={`/product/${product.productId}`}
      className="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-4 overflow-hidden flex flex-col"
    >
      <div className="h-[200px] flex items-center justify-center mb-3">
        <img
          src={image || "/icons/Tumbnail.svg"}
          alt={product.productName}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {product.manufacturerName && (
            <p className="text-sm text-gray-500 truncate">{product.manufacturerName}</p>
          )}
          <p className="text-lg font-semibold truncate">{product.productName}</p>
        </div>

        <div className="relative w-10 h-10 shrink-0">
          <button
            onClick={handleAddToCart}
            className="absolute right-0 top-0 flex items-center bg-primary-700 hover:bg-purple-800 text-white rounded-full transition-all duration-300 w-10 h-10 group-hover:w-auto overflow-hidden z-20"
          >
            <span className="flex items-center justify-center w-10 h-10 shrink-0">
              <FaShoppingCart size={16} />
            </span>
            <span className="max-w-0 opacity-0 group-hover:max-w-35 group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:pr-4">
              Add to Cart
            </span>
          </button>
        </div>
      </div>

      {product.productDescription && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.productDescription}</p>
      )}

      {pricing && (
        <div className="flex items-center gap-2 mt-2">
          {pricing.sellingPrice != null && (
            <span className="text-lg font-bold text-primary-800">₹{pricing.sellingPrice}</span>
          )}
          {pricing.mrp != null && pricing.mrp !== pricing.sellingPrice && (
            <span className="text-sm text-gray-400 line-through">₹{pricing.mrp}</span>
          )}
        </div>
      )}

      <Button
        variant="filled"
        size="sm"
        label="Buy Now"
        onClick={handleBuyNow}
        className="mt-3 w-full"
      />
    </Link>
  );
}
