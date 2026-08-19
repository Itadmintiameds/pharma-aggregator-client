"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaShoppingCart, FaMinus, FaPlus } from "react-icons/fa";
import { useCart } from "@/src/context/CartContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { BuyerProduct } from "@/src/types/buyer/product";

interface ProductCardProps {
  product: BuyerProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const router = useRouter();
  const [isBuyerLoggedIn, setIsBuyerLoggedIn] = useState(() =>
    buyerAuthService.isAuthenticated()
  );
  const pricing = product.pricingDetails?.[0];
  const image = product.productImages?.[0]?.productImage;
  const cartQuantity =
    cartItems.find((item) => item.productId === product.productId)?.quantity ?? 0;

  useEffect(() => {
    const syncBuyerAuth = () => setIsBuyerLoggedIn(buyerAuthService.isAuthenticated());
    window.addEventListener("buyer-auth-changed", syncBuyerAuth);
    return () => window.removeEventListener("buyer-auth-changed", syncBuyerAuth);
  }, []);

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity === 0) {
      addItem(product, 1);
    } else {
      updateQuantity(product.productId, cartQuantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity > 0) {
      updateQuantity(product.productId, cartQuantity - 1);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity === 0) {
      addItem(product, 1);
    }
    router.push("/cart");
  };

  return (
    <Link
      href={`/product/${product.productId}`}
      className="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-4 overflow-hidden flex flex-col"
    >
      <div className="transition-transform duration-500 flex-1">
        <div className="flex justify-center mb-4">
          <div className="h-[200px] overflow-hidden transition-all duration-500 ease-in-out group-hover:h-[170px]">
            <img
              src={image || "/icons/Tumbnail.svg"}
              alt={product.productName}
              className="w-full h-full object-contain transition-transform duration-500 ease-in-out group-hover:-translate-y-1"
            />
          </div>
        </div>

        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0">
            {product.manufacturerName && (
              <p className="text-sm text-gray-500 mb-1 truncate">{product.manufacturerName}</p>
            )}
            <h3 className="text-lg font-semibold text-gray-800 truncate">{product.productName}</h3>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex items-center justify-center gap-2 bg-primary-700 hover:bg-purple-800 text-white rounded-xl transition-all duration-500 ease-in-out w-10 h-10 group-hover:w-auto group-hover:px-4 overflow-hidden shrink-0 z-10"
          >
            <FaShoppingCart className="shrink-0 text-sm" />
            <span className="text-sm whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out">
              Add to Cart
            </span>
          </button>
        </div>

        {product.productDescription && (
          <p className="text-sm text-gray-500 mt-1 mb-2 line-clamp-2">{product.productDescription}</p>
        )}

        {product.sellerName && (
          <p className="text-xs text-gray-400 mb-2 truncate">
            Sold by <span className="text-gray-600 font-medium">{product.sellerName}</span>
          </p>
        )}

        {pricing && (
          <div className="flex items-center gap-1">
            {!isBuyerLoggedIn && (
              <span className="text-sm font-medium text-pneutral-900 whitespace-nowrap">
                MRP:
              </span>
            )}
            <div
              className={`flex items-center gap-3 ${
                isBuyerLoggedIn ? "" : "blur-[5px] select-none pointer-events-none"
              }`}
              title={isBuyerLoggedIn ? undefined : "Login to view price"}
            >
              {pricing.mrp != null && pricing.mrp !== pricing.sellingPrice && (
                <span className="text-gray-400 line-through text-sm">₹{pricing.mrp}</span>
              )}
              {pricing.sellingPrice != null && (
                <span className="text-lg font-bold text-gray-900">₹{pricing.sellingPrice}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 pb-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-in-out z-10">
        <div className="flex items-center justify-between bg-white pt-2 gap-2">
          <button
            onClick={handleBuyNow}
            className="border border-purple-700 text-purple-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-50 transition-colors duration-300 bg-white shadow-sm"
          >
            Buy Now
          </button>

          <div className="flex items-center gap-3 border border-pneutral-200  bg-pneutral-50 px-3 py-1 rounded-full">
            <button
              onClick={handleDecrement}
              disabled={cartQuantity === 0}
              className="text-purple-700 hover:text-purple-900 transition-colors disabled:opacity-40 disabled:hover:text-purple-700 disabled:cursor-default"
            >
              <FaMinus size={10} />
            </button>
            <span className="text-sm font-medium text-gray-800 w-4 text-center">{cartQuantity}</span>
            <button
              onClick={handleIncrement}
              className="text-purple-700 hover:text-purple-900 transition-colors"
            >
              <FaPlus size={10} />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none"></div>
    </Link>
  );
}
