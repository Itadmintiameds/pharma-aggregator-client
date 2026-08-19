"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import Button from "@/src/app/commonComponents/Button";
import { useCart } from "@/src/context/CartContext";
import { getAllProducts } from "@/src/services/buyer/buyerProductService";

// B2B order quantities can run into the hundreds/thousands, where a ±1
// stepper alone means dozens of clicks to reach a usable value — this lets
// the buyer type the exact quantity directly (clamped to the batch's real
// min/max on commit), while the +/- buttons stay for quick ±1 fine-tuning
// near the boundary. Kept as its own component because it needs local
// editing state per row (typing "1" toward "150" would otherwise get
// clamped/overwritten mid-keystroke by the committed cart value).
function QuantityControl({
  quantity,
  minQuantity,
  maxQuantity,
  onCommit,
}: {
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  onCommit: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  // Clamped here, before onCommit/updateQuantity ever sees the value —
  // updateQuantity treats <=0 as "remove this line" (relied on elsewhere by
  // the product-card mini stepper), so 0 or a sub-minimum typed value must
  // never reach it from this input; it should snap back to the minimum
  // instead of deleting the line.
  const commit = (value: string) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(quantity));
      return;
    }
    let next = Math.max(parsed, minQuantity);
    if (maxQuantity != null) next = Math.min(next, maxQuantity);
    // Set explicitly rather than relying on the [quantity] effect above —
    // when the clamped value equals what the quantity already was (e.g.
    // typing 0 below a minimum of 150 clamps right back to the existing
    // 150), the prop never changes, so that effect never fires and the box
    // would otherwise stay stuck showing the invalid typed value.
    setDraft(String(next));
    onCommit(next);
  };

  const atMin = quantity <= minQuantity;
  const atMax = maxQuantity != null && quantity >= maxQuantity;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onCommit(quantity - 1)}
          disabled={atMin}
          aria-label="Decrease quantity"
          className="w-8 h-8 rounded-md border border-neutral-300 text-pneutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          -
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={minQuantity}
          max={maxQuantity}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          aria-label="Quantity"
          className="w-16 text-center border border-neutral-300 rounded-md py-1 text-p3 font-body text-pneutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => onCommit(quantity + 1)}
          disabled={atMax}
          aria-label="Increase quantity"
          className="w-8 h-8 rounded-md border border-neutral-300 text-pneutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
      <p className="text-label-l1 font-body text-pneutral-400 whitespace-nowrap">
        Min {minQuantity}
        {maxQuantity != null && ` · Max ${maxQuantity}`}
      </p>
    </div>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, backfillFromProduct } = useCart();
  const router = useRouter();

  // Always re-sync sellerName/minQuantity/maxQuantity against current
  // product data on load — these can change after an item is already in
  // cart (e.g. a seller adds real packaging order-quantity limits after the
  // item was added with only a stock-quantity fallback), so this can't be
  // skipped just because the fields already hold some earlier value.
  useEffect(() => {
    if (items.length === 0) return;
    (async () => {
      const products = await getAllProducts();
      const byId = new Map(products.map((product) => [product.productId, product]));
      items.forEach((item) => {
        const product = byId.get(item.productId);
        if (product) backfillFromProduct(product);
      });
    })();
    // Only needs to run once per mount — backfillFromProduct/items would
    // otherwise retrigger this on every resolved item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  const minQuantity = item.minQuantity ?? 1;
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
                        {item.sellerName && (
                          <p className="text-p4 font-body text-pneutral-500 truncate">
                            Sold by <span className="font-medium text-pneutral-700">{item.sellerName}</span>
                          </p>
                        )}
                        <p className="text-p3 font-body text-pneutral-600">₹{unitPrice} each</p>
                      </div>

                      <QuantityControl
                        quantity={item.quantity}
                        minQuantity={minQuantity}
                        maxQuantity={item.maxQuantity}
                        onCommit={(quantity) => updateQuantity(item.productId, quantity)}
                      />

                      <p className="w-24 text-right font-semibold text-pneutral-900">
                        ₹{(unitPrice * item.quantity).toFixed(2)}
                      </p>

                      <button
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.productName} from cart`}
                        title="Remove"
                        className="text-red-500 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"
                      >
                        <Trash2 size={18} />
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
