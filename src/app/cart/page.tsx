"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import Button from "@/src/app/commonComponents/Button";
import { useCart } from "@/src/context/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const router = useRouter();

  return (
    <>
      <LandingHeader />
      <main className="pt-38 min-h-screen bg-neutral-50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-h4 font-heading font-medium text-pneutral-900 mb-8">Your Cart</h1>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <p className="text-p2 font-body text-pneutral-600 mb-4">Your cart is empty.</p>
              <Link href="/" className="text-primary-800 font-semibold">
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="space-y-4">
                {items.map((item) => {
                  const unitPrice = item.sellingPrice ?? item.mrp ?? 0;
                  return (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 border-b border-neutral-100 pb-4"
                    >
                      <img
                        src={item.image || "/icons/Tumbnail.svg"}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-lg bg-neutral-50"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-p2 font-heading font-semibold text-pneutral-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-p3 font-body text-pneutral-600">₹{unitPrice} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 rounded-md border border-neutral-300 text-pneutral-700"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 rounded-md border border-neutral-300 text-pneutral-700"
                        >
                          +
                        </button>
                      </div>

                      <p className="w-24 text-right font-semibold text-pneutral-900">
                        ₹{(unitPrice * item.quantity).toFixed(2)}
                      </p>

                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-500 text-p3 font-body hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4">
                <p className="text-h5 font-heading font-semibold text-pneutral-900">
                  Total: ₹{totalPrice.toFixed(2)}
                </p>
                <Button
                  variant="filled"
                  size="lg"
                  label="Proceed to Checkout"
                  onClick={() => router.push("/checkout")}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
