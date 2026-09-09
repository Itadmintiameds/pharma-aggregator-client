"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ShoppingBag, Minus, Plus } from "lucide-react";
import Button from "@/src/app/commonComponents/Button";
import { useCart } from "@/src/context/CartContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";
import { BuyerProduct } from "@/src/types/buyer/product";

interface ProductCardProps {
  product: BuyerProduct;
}

interface QuantityStepperProps {
  quantity: number;
  onDecrement: (e: React.MouseEvent) => void;
  onIncrement: (e: React.MouseEvent) => void;
}

function QuantityStepper({ quantity, onDecrement, onIncrement }: QuantityStepperProps) {
  return (
    <div className="flex items-center h-10 rounded-[10px] border border-pneutral-300 overflow-hidden shrink-0">
      <button
        onClick={onDecrement}
        aria-label="Decrease quantity"
        className="flex items-center justify-center h-full px-2 hover:bg-pneutral-50 transition-colors"
      >
        <Minus size={20} className="text-pneutral-900" />
      </button>
      <span className="flex items-center justify-center h-full min-w-[36px] px-2 border-l border-r border-pneutral-300 font-body font-medium text-p4 text-pneutral-900 text-center">
        {quantity}
      </span>
      <button
        onClick={onIncrement}
        aria-label="Increase quantity"
        className="flex items-center justify-center h-full px-2 hover:bg-pneutral-50 transition-colors"
      >
        <Plus size={20} className="text-pneutral-900" />
      </button>
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const router = useRouter();
  const { openSignupModal } = useBuyerLoginModal();
  const [isBuyerLoggedIn, setIsBuyerLoggedIn] = useState(() =>
    buyerAuthService.isAuthenticated()
  );
  const pricing = product.pricingDetails?.[0];
  const image = product.productImages?.[0]?.productImage;
  const cartQuantity =
    cartItems.find((item) => item.productId === product.productId)?.quantity ?? 0;
  const inCart = cartQuantity > 0;

  useEffect(() => {
    const syncBuyerAuth = () => setIsBuyerLoggedIn(buyerAuthService.isAuthenticated());
    window.addEventListener("buyer-auth-changed", syncBuyerAuth);
    return () => window.removeEventListener("buyer-auth-changed", syncBuyerAuth);
  }, []);

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
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
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
    addItem(product, 1);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
    if (cartQuantity === 0) {
      addItem(product, 1);
    }
    router.push("/cart");
  };

  const priceBlock = pricing && (
    <div className="flex items-end gap-1">
      {!isBuyerLoggedIn && (
        <span className="text-sm font-medium text-pneutral-900 whitespace-nowrap">MRP:</span>
      )}
      <div
        className={`flex items-end gap-2.5 ${
          isBuyerLoggedIn ? "" : "blur-[5px] select-none pointer-events-none"
        }`}
        title={isBuyerLoggedIn ? undefined : "Login to view price"}
      >
        {pricing.sellingPrice != null && (
          <span className="font-heading font-semibold text-label-l5 text-pneutral-800 whitespace-nowrap">
            ₹{pricing.sellingPrice.toFixed(2)}
          </span>
        )}
        {pricing.mrp != null && pricing.mrp !== pricing.sellingPrice && (
          <span className="font-heading font-normal text-label-l3 text-pneutral-800 line-through whitespace-nowrap">
            ₹{pricing.mrp.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Link
      href={`/product/${product.productId}`}
      className="group relative flex flex-col gap-5 bg-white p-6 rounded-[25px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.1)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex items-center justify-center h-[220px] w-full rounded-[10px] bg-danger-50 overflow-hidden">
        <img
          src={image || "/icons/Tumbnail.svg"}
          alt={product.productName}
          className="w-full h-full object-contain transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      </div>

      {inCart ? (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {product.manufacturerName && (
                <p className="text-p3 font-body text-pneutral-600 truncate">
                  {product.manufacturerName}
                </p>
              )}
              <h3 className="font-heading font-bold text-label-l4 text-pneutral-900 truncate">
                {product.productName}
              </h3>
            </div>
            <QuantityStepper
              quantity={cartQuantity}
              onDecrement={handleDecrement}
              onIncrement={handleIncrement}
            />
          </div>

          {product.productDescription && (
            <p className="font-heading font-normal text-label-l3 text-pneutral-600 truncate">
              {product.productDescription}
            </p>
          )}

          <div className="flex items-end justify-between gap-2">
            {priceBlock}
            <div className="flex items-center gap-1 pt-1 shrink-0">
              <span className="size-2 rounded-full bg-danger-600 shrink-0" />
              <span className="text-p3 font-body font-light text-pneutral-600 whitespace-nowrap">
                Limited stock
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            {product.manufacturerName && (
              <p className="text-p3 font-body text-pneutral-600 truncate">
                {product.manufacturerName}
              </p>
            )}
            <h3 className="font-heading font-bold text-label-l4 text-pneutral-900 truncate">
              {product.productName}
            </h3>
            {product.productDescription && (
              <p className="font-heading font-normal text-label-l3 text-pneutral-600 truncate">
                {product.productDescription}
              </p>
            )}
            {priceBlock}
          </div>

          <button
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="flex items-center justify-center size-14 rounded-lg bg-primary-900 hover:bg-primary-800 text-white transition-colors shrink-0"
          >
            <ShoppingCart size={24} />
          </button>
        </div>
      )}

      {inCart ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="filled"
            size="md"
            shape="square"
            label="Buy Now"
            icon={<ShoppingBag size={16} />}
            onClick={handleBuyNow}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="md"
            shape="square"
            label="Add to Cart"
            icon={<ShoppingCart size={16} />}
            onClick={handleAddToCart}
            className="flex-1"
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-between gap-3 opacity-0 translate-y-1 pointer-events-none
          group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
          group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto
          transition-all duration-300 ease-out"
        >
          <Button
            variant="outline"
            size="md"
            shape="square"
            label="Add to Cart"
            icon={<ShoppingCart size={20} />}
            onClick={handleAddToCart}
            className="flex-1"
          />
          <Button
            variant="filled"
            size="md"
            shape="square"
            label="Buy Now"
            icon={<ShoppingBag size={20} />}
            onClick={handleBuyNow}
            className="flex-1"
          />
        </div>
      )}
    </Link>
  );
}
