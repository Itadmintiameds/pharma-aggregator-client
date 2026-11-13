"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Banknote, Check, MapPin, Minus, PackageCheck, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/src/context/CartContext";
import { useBuyerCartDrawer } from "../../context/BuyerCartDrawerContext";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { getBuyerId } from "@/src/services/buyer/buyerProfileService";
import { getProductById, getProductsByIds } from "@/src/services/buyer/buyerProductService";
import { trackFromRememberedSearch } from "@/src/services/buyer/searchEvents";
import { generateIdempotencyKey, getOrdersByBuyer, placeOrder, placeOrderFromQuote } from "@/src/services/buyer/orderService";
import { checkoutAddressSchema, CheckoutAddressFormData } from "@/src/schema/buyer/checkoutSchema";
import type { Order } from "@/src/types/buyer/order";
import type { QuoteRequest } from "@/src/types/quote/quoteRequest";
import type { RawTempBuyer } from "@/src/services/buyer/buyerRegistrationService";
import { isCartItemUnavailable, resolveProductAvailability } from "@/src/utils/cartAvailability";
import { priceCartItem, priceLine } from "@/src/utils/pricing";
import { formatMoney } from "@/src/utils/dashboardFormat";
import { ProductThumb } from "@/src/app/commonComponents/cardUi";

type Step = "cart" | "delivery" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "cart", label: "Cart" },
  { key: "delivery", label: "Delivery" },
  { key: "done", label: "Done" },
];

/** quoteValidUntil is a plain "valid through this day" date, so the whole expiry day still counts as valid. */
function isQuoteExpired(validUntil?: string): boolean {
  if (!validUntil) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(validUntil);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
}

const joinParts = (...parts: Array<string | undefined | null>) => parts.filter((p) => p && p.trim()).join(", ");

/** Quantity box: type an exact number (B2B orders run into the hundreds) or nudge it with - and +. */
function QuantityInput({
  quantity,
  min,
  max,
  disabled,
  onCommit,
}: {
  quantity: number;
  min: number;
  max?: number;
  disabled: boolean;
  onCommit: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState(String(quantity));

  // Clamped before it reaches the cart: updateQuantity treats <= 0 as "remove the line", and a typed 0 must
  // snap back to the minimum instead of deleting it.
  const commit = (value: string) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(quantity));
      return;
    }
    let next = Math.max(parsed, min);
    if (max != null) next = Math.min(next, max);
    setDraft(String(next));
    onCommit(next);
  };
  const atMin = disabled || quantity <= min;
  const atMax = disabled || (max != null && quantity >= max);

  return (
    <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={atMin}
        onClick={() => onCommit(quantity - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-800 hover:bg-white disabled:opacity-40"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        disabled={disabled}
        aria-label="Quantity"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="w-14 bg-transparent text-center text-sm font-semibold text-neutral-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={atMax}
        onClick={() => onCommit(quantity + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-800 hover:bg-white disabled:opacity-40"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-neutral-600">
        {label}
        <div className="mt-1">{children}</div>
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border px-3 py-2 text-sm text-neutral-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
    invalid ? "border-red-300" : "border-neutral-200"
  }`;

function SummaryRow({ label, value, strong, negative }: { label: string; value: number; strong?: boolean; negative?: boolean }) {
  return (
    <div className={`flex justify-between gap-6 ${strong ? "mt-1 border-t border-neutral-200 pt-3" : ""}`}>
      <span className={strong ? "text-p3 font-semibold text-neutral-900" : "text-p4 text-neutral-500"}>{label}</span>
      <span
        className={
          strong
            ? "text-h6 font-heading font-semibold text-neutral-900"
            : `text-p4 ${negative ? "text-green-700" : "text-neutral-700"}`
        }
      >
        {negative ? "− " : ""}
        {formatMoney(value)}
      </span>
    </div>
  );
}

function StepIndicator({ step, quoteMode }: { step: Step; quoteMode: boolean }) {
  const steps = quoteMode ? [{ key: "cart" as Step, label: "Quote" }, ...STEPS.slice(1)] : STEPS;
  const index = steps.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-2 px-6 pb-4" aria-label="Checkout progress">
      {steps.map((s, i) => (
        <li key={s.key} className="flex flex-1 items-center gap-2 last:flex-none">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i < index ? "bg-primary-800 text-white" : i === index ? "bg-primary-100 text-primary-800 ring-2 ring-primary-800" : "bg-neutral-100 text-neutral-400"
            }`}
          >
            {i < index ? <Check size={14} strokeWidth={3} /> : i + 1}
          </span>
          <span className={`text-xs font-medium ${i === index ? "text-neutral-900" : "text-neutral-400"}`}>{s.label}</span>
          {i < steps.length - 1 && <span className={`h-px flex-1 ${i < index ? "bg-primary-800" : "bg-neutral-200"}`} />}
        </li>
      ))}
    </ol>
  );
}

function DrawerBody({ onClose, quote }: { onClose: () => void; quote: QuoteRequest | null }) {
  const router = useRouter();
  const { items, subtotal, discountTotal, taxTotal, totalPrice, removeItem, updateQuantity, updatePricing, backfillFromProduct, clearCart } =
    useCart();
  const { tempBuyer } = useBuyerOnboardingStatus();
  const [step, setStep] = useState<Step>("cart");
  const [resolving, setResolving] = useState(quote !== null || items.length > 0);
  // For an order from a quote: the product's image and its current listed price / discount / GST (the order-service
  // applies that discount and GST to the quoted price the same way).
  const [quoteProduct, setQuoteProduct] = useState<{ image?: string; listed: number | null; discount: number; gst: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [addressSource, setAddressSource] = useState<"order" | "profile" | null>(null);
  // One key per opening of the drawer: every submit attempt (including a retry after a network error) reuses it,
  // so a double click never places the order twice.
  const [idempotencyKey] = useState(() => generateIdempotencyKey());
  const prefilled = useRef(false);

  const hasUnavailable = items.some(isCartItemUnavailable);
  const unitCount = quote ? quote.quantity : items.reduce((sum, item) => sum + item.quantity, 0);

  // Quote orders: the quoted price is the unit price; the batch discount only applies when the quote is at the listed
  // price (a negotiated price is already discounted); GST goes on top either way.
  const listed = quoteProduct?.listed ?? null;
  const quoteUnit = quote ? (quote.quotedPrice ?? listed ?? 0) : 0;
  const quoteAtList = quote ? quote.quotedPrice == null || quote.quotedPrice === listed : false;
  const quoteLine =
    quote && quoteProduct
      ? priceLine(quoteUnit, quote.quantity, quoteAtList ? quoteProduct.discount : 0, quoteProduct.gst)
      : null;
  const quoteExpired = quote ? isQuoteExpired(quote.quoteValidUntil) : false;
  const summary = quote
    ? { subtotal: quoteLine?.gross ?? 0, discountTotal: quoteLine?.discount ?? 0, taxTotal: quoteLine?.tax ?? 0, total: quoteLine?.total ?? 0 }
    : { subtotal, discountTotal, taxTotal, total: totalPrice };
  const summaryLines = quote
    ? [{ key: `quote-${quote.quoteRequestId}`, name: quote.productName, qty: quote.quantity, total: summary.total }]
    : items.map((item) => ({ key: item.productId, name: item.productName, qty: item.quantity, total: priceCartItem(item).total }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      deliveryName: "",
      deliveryPhone: "",
      deliveryAddressLine: "",
      deliveryCity: "",
      deliveryDistrict: "",
      deliveryState: "",
      deliveryPinCode: "",
    },
  });

  // Same re-sync the cart and checkout pages do: pricing ids for old carts, and current order limits.
  useEffect(() => {
    let cancelled = false;
    if (quote) {
      getProductById(quote.productId)
        .then((product) => {
          if (cancelled) return;
          const pricing = product ? resolveProductAvailability(product).pricing : undefined;
          setQuoteProduct({
            image: product?.productImages?.find((img) => img.productImage)?.productImage,
            listed: pricing?.sellingPrice ?? pricing?.mrp ?? null,
            discount: pricing?.discountPercentage ?? 0,
            gst: pricing?.gstPercentage ?? product?.gstPercentage ?? 0,
          });
        })
        .catch(() => {
          if (!cancelled) setQuoteProduct({ listed: null, discount: 0, gst: 0 });
        })
        .finally(() => {
          if (!cancelled) setResolving(false);
        });
      return () => {
        cancelled = true;
      };
    }
    if (items.length === 0) return;
    (async () => {
      try {
        const products = await getProductsByIds(items.map((item) => item.productId));
        if (cancelled) return;
        const byId = new Map(products.map((product) => [product.productId, product]));
        items.forEach((item) => {
          const product = byId.get(item.productId);
          if (!product) return;
          if (!item.pricingId) {
            const pricing = product.pricingDetails?.[0];
            if (pricing?.pricingId) updatePricing(item.productId, pricing.pricingId, pricing.mrp, pricing.sellingPrice);
          }
          backfillFromProduct(product);
        });
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Once per opening - the cart functions and items change on every resolved line.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes the drawer - but never in the middle of placing an order.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !submitting && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, submitting]);

  const fromRegistration = (buyer: RawTempBuyer) => ({
    deliveryName: buyer.contact?.name ?? buyer.organizationName ?? "",
    deliveryPhone: buyer.contact?.mobile ?? "",
    deliveryAddressLine: joinParts(buyer.address?.buildingNo, buyer.address?.street, buyer.address?.landmark),
    deliveryCity: buyer.address?.city ?? "",
    deliveryDistrict: buyer.address?.district?.districtName ?? "",
    deliveryState: buyer.address?.state?.stateName ?? "",
    deliveryPinCode: buyer.address?.pinCode ?? "",
  });

  // Prefill the address once, the first time the buyer reaches the delivery step: the address of their latest order
  // (it has every field, including district and state), else their registration details. Always editable.
  const goToDelivery = async () => {
    setStep("delivery");
    if (prefilled.current) return;
    prefilled.current = true;
    try {
      const currentUser = buyerAuthService.getCurrentUser();
      if (currentUser?.buyerUserId) {
        const buyerId = await getBuyerId(currentUser.buyerUserId);
        const orders = await getOrdersByBuyer(buyerId);
        const latest = [...orders]
          .filter((o) => o.deliveryName && o.deliveryAddressLine)
          .sort((a, b) => (b.placedAt ?? b.createdAt ?? "").localeCompare(a.placedAt ?? a.createdAt ?? ""))[0];
        if (latest) {
          reset({
            deliveryName: latest.deliveryName ?? "",
            deliveryPhone: latest.deliveryPhone ?? "",
            deliveryAddressLine: latest.deliveryAddressLine ?? "",
            deliveryCity: latest.deliveryCity ?? "",
            deliveryDistrict: latest.deliveryDistrict ?? "",
            deliveryState: latest.deliveryState ?? "",
            deliveryPinCode: latest.deliveryPinCode ?? "",
          });
          setAddressSource("order");
          return;
        }
      }
    } catch {
      // fall through to the registration details
    }
    if (tempBuyer) {
      reset(fromRegistration(tempBuyer));
      setAddressSource("profile");
    }
  };

  const onSubmit = async (address: CheckoutAddressFormData) => {
    setSubmitError(null);
    const currentUser = buyerAuthService.getCurrentUser();
    if (!currentUser?.buyerUserId) {
      setSubmitError("Your session has expired. Please log in again.");
      return;
    }

    if (!quote) {
    const outOfStock = items.filter(isCartItemUnavailable);
    if (outOfStock.length > 0) {
      setSubmitError(`These items are out of stock: ${outOfStock.map((i) => i.productName).join(", ")}. Remove them from your cart and try again.`);
      return;
    }
    const missingPricing = items.filter((item) => !item.pricingId);
    if (missingPricing.length > 0) {
      setSubmitError(
        `These items are no longer available from the seller and couldn't be priced: ${missingPricing.map((i) => i.productName).join(", ")}. Remove them from your cart and try again.`
      );
      return;
    }
    // Mirrors the backend's own min/max order quantity check so a violation shows up straight away.
    const badQuantity = items.filter(
      (item) => (item.minQuantity != null && item.quantity < item.minQuantity) || (item.maxQuantity != null && item.quantity > item.maxQuantity)
    );
    if (badQuantity.length > 0) {
      setSubmitError(
        `Please fix the quantities: ${badQuantity
          .map((item) =>
            item.minQuantity != null && item.quantity < item.minQuantity
              ? `${item.productName} is below the minimum order of ${item.minQuantity}.`
              : `${item.productName} is above the maximum order of ${item.maxQuantity}.`
          )
          .join(" ")}`
      );
      return;
    }

    }
    if (quote && (quoteExpired || !quoteLine)) {
      setSubmitError(quoteExpired ? "This quote has expired. Ask the seller for a new quote to place this order." : "The quote is still loading. Please try again in a moment.");
      return;
    }

    setSubmitting(true);
    try {
      const buyerId = await getBuyerId(currentUser.buyerUserId);
      const order = quote
        ? await placeOrderFromQuote({ buyerId, idempotencyKey, quoteRequestId: quote.quoteRequestId, ...address })
        : await placeOrder({
            buyerId,
            idempotencyKey,
            ...address,
            paymentMethod: "COD",
            lines: items.map((item) => ({ productId: item.productId, pricingId: item.pricingId!, quantity: item.quantity })),
          });
      // Search analytics: tie each ordered product to the search that found it. Lines the order rejected are not counted.
      const rejected = new Set((order.rejectedLines ?? []).map((line) => line.productId));
      (quote ? [quote.productId] : items.map((item) => item.productId))
        .filter((id) => !rejected.has(id))
        .forEach((id) => trackFromRememberedSearch("ORDER", id));

      // The cart is emptied only after a confirmed placement, so a failed request can simply be retried.
      if (!quote) clearCart();
      setPlacedOrder(order);
      setStep("done");
      // Let any open orders list know there is a new order.
      window.dispatchEvent(new Event("buyer-orders-changed"));
      if (quote) window.dispatchEvent(new Event("buyer-quotes-changed"));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to place the order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const safeClose = () => {
    if (!submitting) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100]" role="presentation">
      <div className="animate-cart-overlay-in absolute inset-0 bg-black/40" onClick={safeClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="animate-cart-drawer-in absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl sm:w-[30rem]"
      >
        <header className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            {step === "delivery" && (
              <button
                type="button"
                onClick={() => setStep("cart")}
                disabled={submitting}
                aria-label="Back to cart"
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="truncate text-h6 font-heading font-semibold text-neutral-900">
              {step === "cart" ? (quote ? "Order from your quote" : "Your cart") : step === "delivery" ? "Delivery & payment" : "Order placed"}
            </h2>
            {step === "cart" && !quote && items.length > 0 && (
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-800">
                {items.length} product{items.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={safeClose}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </header>

        <StepIndicator step={step} quoteMode={quote !== null} />

        {/* ---------------------------------------------------------------- 1. cart */}
        {step === "cart" && !quote && (
          <>
            <div className="flex-1 overflow-y-auto border-t border-neutral-100 px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                    <ShoppingCart size={28} />
                  </span>
                  <p className="text-p2 font-heading font-semibold text-neutral-900">Your cart is empty</p>
                  <p className="text-p4 font-body text-neutral-500">Add products from the catalog and they&apos;ll show up here.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push("/buyer_e8d45a1b/dashboard/catalog");
                    }}
                    className="mt-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Browse products
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {items.map((item) => {
                    const unit = item.sellingPrice ?? item.mrp ?? 0;
                    const unavailable = isCartItemUnavailable(item);
                    const line = priceCartItem(item);
                    return (
                      <li key={item.productId} className="flex gap-3 py-4">
                        <ProductThumb src={item.image} alt={item.productName} />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-p4 font-body font-semibold text-neutral-900">{item.productName}</p>
                          {item.sellerName && (
                            <p className="truncate text-xs text-neutral-500">
                              Sold by <span className="font-medium text-neutral-700">{item.sellerName}</span>
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {formatMoney(unit)} / unit
                            {item.mrp != null && item.sellingPrice != null && item.mrp > item.sellingPrice && (
                              <span className="ml-1.5 text-neutral-400 line-through">{formatMoney(item.mrp)}</span>
                            )}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <QuantityInput
                              key={item.quantity}
                              quantity={item.quantity}
                              min={item.minQuantity ?? 1}
                              max={item.maxQuantity}
                              disabled={unavailable}
                              onCommit={(quantity) => updateQuantity(item.productId, quantity)}
                            />
                            <p className="text-p3 font-body font-semibold text-neutral-900">
                              {unavailable ? "—" : formatMoney(line.total)}
                            </p>
                          </div>
                          {unavailable ? (
                            <p className="mt-1 text-xs font-medium text-red-600">Out of stock — remove it to continue</p>
                          ) : (
                            <p className="mt-1 text-xs text-neutral-400">
                              Min {item.minQuantity ?? 1}
                              {item.maxQuantity != null && ` · Max ${item.maxQuantity}`}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          aria-label={`Remove ${item.productName} from cart`}
                          title="Remove"
                          className="h-8 w-8 shrink-0 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} className="mx-auto" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-neutral-200 bg-neutral-50/70 px-6 py-4">
                <div className="flex flex-col gap-1.5">
                  <SummaryRow label="Subtotal" value={summary.subtotal} />
                  {summary.discountTotal > 0 && <SummaryRow label="Discount" value={summary.discountTotal} negative />}
                  <SummaryRow label="GST" value={summary.taxTotal} />
                  <SummaryRow label={`Total · ${unitCount} unit${unitCount === 1 ? "" : "s"}`} value={summary.total} strong />
                </div>
                {hasUnavailable && (
                  <p className="mt-3 text-xs font-medium text-red-600">Some items are out of stock. Remove them to continue.</p>
                )}
                <button
                  type="button"
                  onClick={goToDelivery}
                  disabled={hasUnavailable || resolving}
                  className="mt-4 w-full rounded-xl bg-primary-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {resolving ? "Checking prices…" : "Continue to delivery"}
                </button>
                <button type="button" onClick={onClose} className="mt-2 w-full py-1.5 text-sm font-semibold text-primary-800 hover:underline">
                  Continue shopping
                </button>
              </footer>
            )}
          </>
        )}

        {/* ---------------------------------------------------------------- 1. quote review (order from a quote) */}
        {step === "cart" && quote && (
          <>
            <div className="flex-1 overflow-y-auto border-t border-neutral-100 px-6 py-5">
              {resolving ? (
                <div className="space-y-3">
                  <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />
                  <div className="h-28 animate-pulse rounded-xl bg-neutral-100" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <ProductThumb src={quoteProduct?.image} alt={quote.productName} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-p4 font-body font-semibold text-neutral-900">{quote.productName}</p>
                      <p className="text-xs text-neutral-500">
                        Quote #{quote.quoteRequestId}
                        {quote.sellerName ? ` · Seller: ${quote.sellerName}` : ""}
                      </p>
                      <p className="mt-1 text-p4 font-body text-neutral-600">
                        {quote.quantity} {quote.unit ?? "units"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Your agreed price</p>
                    <p className="text-h6 font-heading font-semibold text-neutral-900">
                      {formatMoney(quoteUnit)} <span className="text-p4 font-normal text-neutral-500">/ unit</span>
                    </p>
                    {listed != null && Math.abs(listed - quoteUnit) > 0.005 && (
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Original listed price <span className="line-through">{formatMoney(listed)}</span>
                        <span className={quoteUnit < listed ? "text-green-700" : "text-amber-700"}>
                          {" "}
                          · you pay {Math.abs(Math.round(((quoteUnit - listed) / listed) * 100))}% {quoteUnit < listed ? "less" : "more"}
                        </span>
                      </p>
                    )}
                    {quote.quoteValidUntil && (
                      <p className={`mt-2 text-xs ${quoteExpired ? "font-medium text-red-600" : "text-neutral-500"}`}>
                        {quoteExpired ? "Expired on" : "Valid until"}{" "}
                        {new Date(quote.quoteValidUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    )}
                    {quote.sellerNotes && (
                      <p className="mt-2 text-xs text-neutral-600">
                        <span className="text-neutral-500">Seller&apos;s note:</span> {quote.sellerNotes}
                      </p>
                    )}
                  </div>

                  {quoteExpired && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-p4 font-body text-red-700">
                        This quote has expired. Ask the seller for a new quote to place this order.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="border-t border-neutral-200 bg-neutral-50/70 px-6 py-4">
              <div className="flex flex-col gap-1.5">
                <SummaryRow label="Subtotal" value={summary.subtotal} />
                {summary.discountTotal > 0 && <SummaryRow label="Discount" value={summary.discountTotal} negative />}
                <SummaryRow label="GST" value={summary.taxTotal} />
                <SummaryRow label={`Total · ${unitCount} unit${unitCount === 1 ? "" : "s"}`} value={summary.total} strong />
              </div>
              <button
                type="button"
                onClick={goToDelivery}
                disabled={resolving || quoteExpired || !quoteLine}
                className="mt-4 w-full rounded-xl bg-primary-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {resolving ? "Checking the price…" : "Continue to delivery"}
              </button>
              <button type="button" onClick={onClose} className="mt-2 w-full py-1.5 text-sm font-semibold text-primary-800 hover:underline">
                Not now
              </button>
            </footer>
          </>
        )}

        {/* ---------------------------------------------------------------- 2. delivery + payment */}
        {step === "delivery" && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="flex-1 space-y-6 overflow-y-auto border-t border-neutral-100 px-6 py-5">
              <section>
                <h3 className="mb-1 flex items-center gap-2 text-p3 font-heading font-semibold text-neutral-900">
                  <MapPin size={16} className="text-neutral-500" />
                  Delivery address
                </h3>
                {addressSource && (
                  <p className="mb-3 text-xs text-neutral-500">
                    {addressSource === "order"
                      ? "Filled in from your latest order. Change it if this order ships elsewhere."
                      : "Filled in from your registration details. Change it if this order ships elsewhere."}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full name" error={errors.deliveryName?.message} className="col-span-2">
                    <input {...register("deliveryName")} autoComplete="name" className={inputClass(!!errors.deliveryName)} />
                  </Field>
                  <Field label="Phone" error={errors.deliveryPhone?.message} className="col-span-2">
                    <input {...register("deliveryPhone")} inputMode="tel" autoComplete="tel" className={inputClass(!!errors.deliveryPhone)} />
                  </Field>
                  <Field label="Address" error={errors.deliveryAddressLine?.message} className="col-span-2">
                    <input {...register("deliveryAddressLine")} autoComplete="street-address" className={inputClass(!!errors.deliveryAddressLine)} />
                  </Field>
                  <Field label="City" error={errors.deliveryCity?.message}>
                    <input {...register("deliveryCity")} className={inputClass(!!errors.deliveryCity)} />
                  </Field>
                  <Field label="District" error={errors.deliveryDistrict?.message}>
                    <input {...register("deliveryDistrict")} className={inputClass(!!errors.deliveryDistrict)} />
                  </Field>
                  <Field label="State" error={errors.deliveryState?.message}>
                    <input {...register("deliveryState")} className={inputClass(!!errors.deliveryState)} />
                  </Field>
                  <Field label="Pin code" error={errors.deliveryPinCode?.message}>
                    <input {...register("deliveryPinCode")} inputMode="numeric" maxLength={6} className={inputClass(!!errors.deliveryPinCode)} />
                  </Field>
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-p3 font-heading font-semibold text-neutral-900">
                  <Banknote size={16} className="text-neutral-500" />
                  Payment
                </h3>
                <div className="flex items-start gap-3 rounded-xl border border-primary-800 bg-primary-50/50 p-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-800 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-p4 font-body font-semibold text-neutral-900">Cash on delivery</p>
                    <p className="text-xs text-neutral-500">Pay when your order arrives. No payment is taken now.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl bg-neutral-50 p-4">
                <h3 className="mb-2 text-p4 font-heading font-semibold text-neutral-900">
                  Order summary · {summaryLines.length} product{summaryLines.length === 1 ? "" : "s"}
                </h3>
                <ul className="mb-3 space-y-1.5">
                  {summaryLines.map((line) => (
                    <li key={line.key} className="flex justify-between gap-3 text-xs text-neutral-600">
                      <span className="min-w-0 truncate">
                        {line.name} <span className="text-neutral-400">× {line.qty}</span>
                      </span>
                      <span className="shrink-0 font-medium text-neutral-800">{formatMoney(line.total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-1.5 border-t border-neutral-200 pt-3">
                  <SummaryRow label="Subtotal" value={summary.subtotal} />
                  {summary.discountTotal > 0 && <SummaryRow label="Discount" value={summary.discountTotal} negative />}
                  <SummaryRow label="GST" value={summary.taxTotal} />
                </div>
              </section>

              {submitError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-p4 font-body text-red-700">{submitError}</p>
                </div>
              )}
            </div>

            <footer className="border-t border-neutral-200 bg-neutral-50/70 px-6 py-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-p3 font-semibold text-neutral-900">Total to pay</span>
                <span className="text-h6 font-heading font-semibold text-neutral-900">{formatMoney(summary.total)}</span>
              </div>
              <button
                type="submit"
                disabled={submitting || (quote ? !quoteLine || quoteExpired : items.length === 0)}
                className="w-full rounded-xl bg-primary-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Placing your order…" : `Place order · ${formatMoney(summary.total)}`}
              </button>
              <p className="mt-2 text-center text-xs text-neutral-500">Cash on delivery · GST included</p>
            </footer>
          </form>
        )}

        {/* ---------------------------------------------------------------- 3. done */}
        {step === "done" && placedOrder && (
          <div className="flex flex-1 flex-col overflow-y-auto border-t border-neutral-100 px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <PackageCheck size={30} />
              </span>
              <h3 className="mt-4 text-h5 font-heading font-semibold text-neutral-900">Thank you! Your order is placed</h3>
              <p className="mt-1 text-p4 font-body text-neutral-500">The seller will confirm it shortly.</p>
            </div>

            <dl className="mt-6 space-y-2 rounded-xl bg-neutral-50 p-4 text-p4">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Order ID</dt>
                <dd className="font-semibold text-neutral-900">{placedOrder.orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Total</dt>
                <dd className="font-semibold text-neutral-900">{formatMoney(placedOrder.grandTotal ?? 0)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Payment</dt>
                <dd className="font-semibold text-neutral-900">Cash on delivery</dd>
              </div>
            </dl>

            {placedOrder.rejectedLines && placedOrder.rejectedLines.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-p4 font-heading font-semibold text-amber-800">Some items couldn&apos;t be included:</p>
                <ul className="list-inside list-disc space-y-1">
                  {placedOrder.rejectedLines.map((line) => (
                    <li key={line.productId} className="text-xs text-amber-700">
                      {line.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto flex flex-col gap-2 pt-8">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/buyer_e8d45a1b/dashboard/orders/${placedOrder.orderId}`);
                }}
                className="w-full rounded-xl bg-primary-900 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-800"
              >
                View order
              </button>
              <button type="button" onClick={onClose} className="w-full py-2 text-sm font-semibold text-primary-800 hover:underline">
                Keep shopping
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

/**
 * The buyer's cart as a slide-over inside the dashboard: review the cart, enter the delivery address, and place the
 * order (cash on delivery) without leaving the page. Opened with useBuyerCartDrawer().openCart().
 */
export default function BuyerCartDrawer() {
  const { isOpen, closeCart, quote } = useBuyerCartDrawer();
  // Mounted only while open, so every opening starts fresh at the cart step. Portalled to <body> so it sits above
  // the dashboard header and sidebar.
  if (!isOpen) return null;
  return createPortal(<DrawerBody onClose={closeCart} quote={quote} />, document.body);
}
