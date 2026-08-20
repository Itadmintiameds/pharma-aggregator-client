"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Package, X } from "lucide-react";
import LandingHeader from "@/src/app/components/landingPage/LandingHeader";
import Footer from "@/src/app/components/landingPage/Footer";
import Button from "@/src/app/commonComponents/Button";
import { useCart } from "@/src/context/CartContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerOnboardingStatus } from "@/src/hooks/useBuyerOnboardingStatus";
import { getBuyerId } from "@/src/services/buyer/buyerProfileService";
import { getAllProducts, getProductById } from "@/src/services/buyer/buyerProductService";
import { getMyQuoteRequests } from "@/src/services/buyer/quoteRequestService";
import { generateIdempotencyKey, placeOrder } from "@/src/services/buyer/orderService";
import { checkoutAddressSchema, CheckoutAddressFormData } from "@/src/schema/buyer/checkoutSchema";
import { Order } from "@/src/types/buyer/order";
import { QuoteRequest } from "@/src/types/quote/quoteRequest";

// One idempotency key per mount of this page — every submit attempt (including
// retries of the same click, e.g. after a transient network error) reuses it,
// so a double-click never places the order twice. A fresh key is only minted
// if the buyer navigates away and starts a new checkout later.
function useIdempotencyKey() {
  const [key] = useState(() => generateIdempotencyKey());
  return key;
}

type FieldName = keyof CheckoutAddressFormData;

function joinAddressParts(...parts: Array<string | undefined>): string {
  return parts.filter((part) => part && part.trim().length > 0).join(", ");
}

function FormField({
  label,
  name,
  register,
  error,
  value,
  onClear,
  span2 = false,
}: {
  label: string;
  name: FieldName;
  register: ReturnType<typeof useForm<CheckoutAddressFormData>>["register"];
  error?: string;
  value: string;
  onClear: () => void;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="text-p4 font-body font-medium text-pneutral-700">{label}</label>
      <div className="relative mt-1.5">
        <input
          {...register(name)}
          className={`w-full pr-9 px-3.5 py-2.5 border rounded-xl text-p3 font-body text-pneutral-900 bg-neutral-50/50 transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 focus:bg-white
            ${error ? "border-red-300" : "border-neutral-200"}`}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${label}`}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {error && <p className="text-p4 font-body text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageInner />
    </Suspense>
  );
}

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteRequestId = searchParams.get("quoteRequestId");
  const { items, totalPrice, clearCart, updatePricing, backfillFromProduct } = useCart();
  const idempotencyKey = useIdempotencyKey();
  const { tempBuyer } = useBuyerOnboardingStatus();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [resolvingPricing, setResolvingPricing] = useState(true);

  // Quote mode: placing an order from an already-ACCEPTED quote (see the RFQ
  // dashboard page) bypasses the cart entirely — the single line and its
  // negotiated price come from the quote itself, not live pricing.
  const [quote, setQuote] = useState<QuoteRequest | null | undefined>(
    quoteRequestId ? undefined : null
  );
  const [quoteError, setQuoteError] = useState<string | null>(null);
  // The quote itself only carries the buyer's target price and the seller's
  // quoted price — the product's current listed price is fetched separately
  // so both can be shown side by side in the order summary.
  const [quoteListedUnitPrice, setQuoteListedUnitPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!buyerAuthService.isAuthenticated()) {
      router.replace("/buyer_e8d45a1b/login?redirect=/checkout");
    }
  }, [router]);

  useEffect(() => {
    if (!quoteRequestId) return;
    getMyQuoteRequests()
      .then((all) => {
        const match = all.find((q) => q.quoteRequestId === Number(quoteRequestId)) ?? null;
        setQuote(match);
        if (!match) {
          setQuoteError("This quote request could not be found.");
        } else if (match.status !== "ACCEPTED") {
          setQuoteError(
            match.status === "ORDER_PLACED"
              ? "This quote has already been placed as an order."
              : "Only an accepted quote can be placed as an order."
          );
        }
      })
      .catch(() => setQuoteError("Failed to load this quote request."));
  }, [quoteRequestId]);

  useEffect(() => {
    if (!quote) return;
    getProductById(quote.productId)
      .then((product) => {
        const pricing = product?.pricingDetails?.[0];
        setQuoteListedUnitPrice(pricing?.sellingPrice ?? pricing?.mrp ?? null);
      })
      .catch(() => setQuoteListedUnitPrice(null));
  }, [quote]);

  // Cart items added before pricingId was captured are missing what the
  // backend requires to place an order — re-resolve it instead of making the
  // buyer manually remove and re-add those items. sellerName/minQuantity/
  // maxQuantity are always re-synced against current product data (not just
  // filled in when missing) since order-quantity limits can change after an
  // item is already in cart, and don't depend on the buyer having visited
  // /cart first (which runs the same sync) to get there.
  useEffect(() => {
    if (items.length === 0) {
      setResolvingPricing(false);
      return;
    }
    (async () => {
      try {
        const products = await getAllProducts();
        const byId = new Map(products.map((product) => [product.productId, product]));
        items.forEach((item) => {
          const product = byId.get(item.productId);
          if (!product) return;

          if (!item.pricingId) {
            const pricing = product.pricingDetails?.[0];
            if (pricing?.pricingId) {
              updatePricing(item.productId, pricing.pricingId, pricing.mrp, pricing.sellingPrice);
            }
          }
          backfillFromProduct(product);
        });
      } finally {
        setResolvingPricing(false);
      }
    })();
    // Only needs to run once per mount — updatePricing/backfillFromProduct/
    // items would otherwise retrigger this on every resolved item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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

  // Prefills the delivery address from the buyer's own registration details
  // (org contact + address) the moment they load, so the buyer isn't asked to
  // retype information they already gave during onboarding — every field
  // still stays editable, since delivery can differ from the registered address.
  useEffect(() => {
    if (!tempBuyer) return;
    reset({
      deliveryName: tempBuyer.contact?.name ?? tempBuyer.organizationName ?? "",
      deliveryPhone: tempBuyer.contact?.mobile ?? "",
      deliveryAddressLine: joinAddressParts(
        tempBuyer.address?.buildingNo,
        tempBuyer.address?.street,
        tempBuyer.address?.landmark
      ),
      deliveryCity: tempBuyer.address?.city ?? "",
      deliveryDistrict: tempBuyer.address?.district?.districtName ?? "",
      deliveryState: tempBuyer.address?.state?.stateName ?? "",
      deliveryPinCode: tempBuyer.address?.pinCode ?? "",
    });
  }, [tempBuyer, reset]);

  const values = watch();

  const isQuoteMode = !!quoteRequestId;
  const itemCount = useMemo(
    () => (isQuoteMode ? quote?.quantity ?? 0 : items.reduce((sum, item) => sum + item.quantity, 0)),
    [isQuoteMode, quote, items]
  );
  const displayTotal = isQuoteMode
    ? (quote?.quotedPrice ?? 0) * (quote?.quantity ?? 0)
    : totalPrice;

  const onSubmit = async (address: CheckoutAddressFormData) => {
    setSubmitError(null);

    const currentUser = buyerAuthService.getCurrentUser();
    if (!currentUser?.buyerUserId) {
      setSubmitError("Your session has expired. Please log in again.");
      return;
    }

    if (!isQuoteMode) {
      const linesMissingPricing = items.filter((item) => !item.pricingId);
      if (linesMissingPricing.length > 0) {
        const names = linesMissingPricing.map((item) => item.productName).join(", ");
        setSubmitError(
          `These items are no longer available from the seller and couldn't be priced: ${names}. Please remove them from your cart and try again.`
        );
        return;
      }

      // Mirrors the backend's own min/max order quantity check (see
      // OrderPlacementServiceImpl) so a violation surfaces immediately instead
      // of only after the network round-trip to place the order fails. The
      // backend re-validates this independently regardless — this is purely a
      // faster, friendlier front for the same rule.
      const invalidQuantityLines = items.filter(
        (item) =>
          (item.minQuantity != null && item.quantity < item.minQuantity) ||
          (item.maxQuantity != null && item.quantity > item.maxQuantity)
      );
      if (invalidQuantityLines.length > 0) {
        const messages = invalidQuantityLines.map((item) => {
          if (item.minQuantity != null && item.quantity < item.minQuantity) {
            return `${item.productName}: quantity is below the minimum order quantity of ${item.minQuantity}.`;
          }
          return `${item.productName}: quantity exceeds the maximum order quantity of ${item.maxQuantity}.`;
        });
        setSubmitError(`Please fix the quantities before placing this order: ${messages.join(" ")}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const buyerId = await getBuyerId(currentUser.buyerUserId);

      const order = await placeOrder({
        buyerId,
        idempotencyKey,
        ...address,
        paymentMethod: "COD",
        ...(isQuoteMode
          ? { quoteRequestId: Number(quoteRequestId), lines: [] }
          : {
              lines: items.map((item) => ({
                productId: item.productId,
                pricingId: item.pricingId!,
                quantity: item.quantity,
              })),
            }),
      });

      // Cart is cleared only after a confirmed placement — a failed/partial
      // request (e.g. all lines rejected, which throws before this point)
      // leaves the cart untouched so the buyer can retry.
      clearCart();
      setPlacedOrder(order);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <>
        <LandingHeader />
        <main className="pt-38 min-h-screen bg-neutral-50">
          <div className="max-w-2xl mx-auto px-6 py-12">
            <div className="bg-white rounded-2xl shadow-md p-10 text-center">
              <h1 className="text-h4 font-heading font-semibold text-pneutral-900 mb-2">
                Order Placed!
              </h1>
              <p className="text-p2 font-body text-pneutral-600 mb-1">
                Order ID: <span className="font-semibold text-pneutral-900">{placedOrder.orderId}</span>
              </p>
              <p className="text-p2 font-body text-pneutral-600 mb-6">
                Grand total: ₹{placedOrder.grandTotal?.toFixed(2)} (Cash on Delivery)
              </p>

              {placedOrder.rejectedLines && placedOrder.rejectedLines.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-p3 font-heading font-semibold text-amber-800 mb-2">
                    Some items couldn&apos;t be included in this order:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {placedOrder.rejectedLines.map((line) => (
                      <li key={line.productId} className="text-p4 font-body text-amber-700">
                        {line.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button variant="filled" size="lg" label="View My Orders" onClick={() => router.push("/orders")} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isQuoteMode && quote === undefined) {
    return (
      <>
        <LandingHeader />
        <main className="pt-38 min-h-screen bg-neutral-50 flex justify-center py-24">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  if (isQuoteMode && (quoteError || !quote)) {
    return (
      <>
        <LandingHeader />
        <main className="pt-38 min-h-screen bg-neutral-50">
          <div className="max-w-2xl mx-auto px-6 py-12">
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <p className="text-p2 font-body text-pneutral-600 mb-4">
                {quoteError ?? "This quote request could not be found."}
              </p>
              <Button
                variant="filled"
                size="lg"
                label="Back to RFQ & Quotes"
                onClick={() => router.push("/buyer_e8d45a1b/dashboard/rfq")}
              />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isQuoteMode && items.length === 0) {
    return (
      <>
        <LandingHeader />
        <main className="pt-38 min-h-screen bg-neutral-50">
          <div className="max-w-2xl mx-auto px-6 py-12">
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <p className="text-p2 font-body text-pneutral-600 mb-4">Your cart is empty.</p>
              <Button variant="filled" size="lg" label="Continue Shopping" onClick={() => router.push("/")} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const clear = (name: FieldName) => setValue(name, "", { shouldValidate: true });

  return (
    <>
      <LandingHeader />
      <main className="pt-38 min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-h4 font-heading font-semibold text-pneutral-900 mb-1">Checkout</h1>
          <p className="text-p3 font-body text-pneutral-500 mb-8">
            Review your delivery details and confirm your order.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-neutral-100 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center">
                  <MapPin size={16} />
                </span>
                <h2 className="text-h6 font-heading font-semibold text-pneutral-900">Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  label="Full Name"
                  name="deliveryName"
                  register={register}
                  error={errors.deliveryName?.message}
                  value={values.deliveryName}
                  onClear={() => clear("deliveryName")}
                  span2
                />
                <FormField
                  label="Phone Number"
                  name="deliveryPhone"
                  register={register}
                  error={errors.deliveryPhone?.message}
                  value={values.deliveryPhone}
                  onClear={() => clear("deliveryPhone")}
                />
                <FormField
                  label="Pin Code"
                  name="deliveryPinCode"
                  register={register}
                  error={errors.deliveryPinCode?.message}
                  value={values.deliveryPinCode}
                  onClear={() => clear("deliveryPinCode")}
                />
                <FormField
                  label="Address"
                  name="deliveryAddressLine"
                  register={register}
                  error={errors.deliveryAddressLine?.message}
                  value={values.deliveryAddressLine}
                  onClear={() => clear("deliveryAddressLine")}
                  span2
                />
                <FormField
                  label="City"
                  name="deliveryCity"
                  register={register}
                  error={errors.deliveryCity?.message}
                  value={values.deliveryCity}
                  onClear={() => clear("deliveryCity")}
                />
                <FormField
                  label="District"
                  name="deliveryDistrict"
                  register={register}
                  error={errors.deliveryDistrict?.message}
                  value={values.deliveryDistrict}
                  onClear={() => clear("deliveryDistrict")}
                />
                <FormField
                  label="State"
                  name="deliveryState"
                  register={register}
                  error={errors.deliveryState?.message}
                  value={values.deliveryState}
                  onClear={() => clear("deliveryState")}
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                  <p className="text-p3 font-body text-red-700">{submitError}</p>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-24 bg-white rounded-2xl shadow-md border border-neutral-100 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center">
                  <Package size={16} />
                </span>
                <h2 className="text-h6 font-heading font-semibold text-pneutral-900">Order Summary</h2>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {isQuoteMode && quote ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between gap-3 text-p3 font-body text-pneutral-700">
                      <span className="line-clamp-2">
                        {quote.productName} <span className="text-pneutral-400">x{quote.quantity}</span>
                      </span>
                      <span className="whitespace-nowrap font-medium">
                        ₹{((quote.quotedPrice ?? 0) * quote.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-p4 font-body text-pneutral-500">
                      <span>
                        {quoteListedUnitPrice != null && (
                          <>
                            Listed price: <span className="line-through">₹{quoteListedUnitPrice.toFixed(2)}</span>{" "}
                          </>
                        )}
                        Accepted price: ₹{(quote.quotedPrice ?? 0).toFixed(2)}/unit
                      </span>
                    </div>
                  </div>
                ) : (
                  items.map((item) => {
                    const unitPrice = item.sellingPrice ?? item.mrp ?? 0;
                    const hasDiscount = item.mrp != null && item.sellingPrice != null && item.mrp > item.sellingPrice;
                    return (
                      <div key={item.productId} className="flex flex-col gap-0.5">
                        <div className="flex justify-between gap-3 text-p3 font-body text-pneutral-700">
                          <span className="line-clamp-2">
                            {item.productName} <span className="text-pneutral-400">x{item.quantity}</span>
                          </span>
                          <span className="whitespace-nowrap font-medium">
                            ₹{(unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {hasDiscount && (
                          <div className="flex justify-end gap-2 text-p4 font-body text-pneutral-500">
                            <span className="line-through">₹{item.mrp!.toFixed(2)}</span>
                            <span>₹{item.sellingPrice!.toFixed(2)}/unit</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {isQuoteMode && (
                <p className="text-p4 font-body text-primary-800 bg-primary-05 rounded-lg px-3 py-2 mt-3">
                  Priced at your accepted quote — not the current listed price.
                </p>
              )}

              <div className="border-t border-neutral-100 mt-4 pt-4 space-y-1">
                <div className="flex justify-between text-p4 font-body text-pneutral-500">
                  <span>{itemCount} item(s)</span>
                  <span>Cash on Delivery</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-p3 font-body text-pneutral-600">Total</p>
                  <p className="text-h5 font-heading font-semibold text-pneutral-900">₹{displayTotal.toFixed(2)}</p>
                </div>
              </div>

              {!isQuoteMode && resolvingPricing && (
                <p className="text-p4 font-body text-neutral-500 mt-3 text-center">Checking latest prices…</p>
              )}

              <Button
                type="submit"
                variant="filled"
                size="lg"
                fullWidth
                className="mt-6"
                label={submitting ? "Placing Order..." : "Place Order"}
                disabled={submitting || (!isQuoteMode && resolvingPricing)}
              />
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
