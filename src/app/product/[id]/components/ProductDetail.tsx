"use client";
import { bestApplicableOffer, offerMinQty, offerPercent } from "@/src/utils/pricing";
import { formatOfferInstant } from "@/src/utils/offerWindow";
import { resolveProductAvailability } from "@/src/utils/cartAvailability";
import { returnPolicyLabel } from "@/src/utils/returnPolicy";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Lock, Minus, Plus, ShoppingCart, Tag } from "lucide-react";
import { getProductById } from "@/src/services/buyer/buyerProductService";
import { isRequestCancelled, searchProducts, searchResultToBuyerProduct } from "@/src/services/buyer/searchService";
import { BuyerProduct } from "@/src/types/buyer/product";
import { useCart } from "@/src/context/CartContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";
import ProductCard, { ProductCardSkeleton } from "@/src/app/components/landingPage/ProductCard";
import ProductInfoTabs from "./ProductInfoTabs";

const PLACEHOLDER_IMAGE = "/icons/Tumbnail.svg";
const ZOOM_FACTOR = 2.5;
const LENS_SIZE = 120;
const IMAGE_HEIGHT = 320;
/** At or below this many units an in-stock product is flagged as running low. */
const LOW_STOCK_UNITS = 20;

interface ImageZoomProps {
  src: string;
  alt: string;
  onError: () => void;
}

function ImageZoom({ src, alt, onError }: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState({ active: false, lensLeft: 0, lensTop: 0, percentX: 50, percentY: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    // The lens is positioned here (not while rendering) so no ref is read during render.
    setZoom({
      active: true,
      lensLeft: Math.min(Math.max(x - LENS_SIZE / 2, 0), rect.width - LENS_SIZE),
      lensTop: Math.min(Math.max(y - LENS_SIZE / 2, 0), rect.height - LENS_SIZE),
      percentX: (x / rect.width) * 100,
      percentY: (y / rect.height) * 100,
    });
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative cursor-crosshair overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
        style={{ height: IMAGE_HEIGHT }}
        onMouseEnter={handleMouseMove}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-contain p-3" onError={onError} />

        {zoom.active && (
          <div
            className="pointer-events-none absolute border-2 border-primary-600 bg-white/30"
            style={{ width: LENS_SIZE, height: LENS_SIZE, left: zoom.lensLeft, top: zoom.lensTop }}
          />
        )}
      </div>

      {zoom.active && (
        <div
          className="absolute top-0 z-30 hidden rounded-xl border border-gray-200 bg-white bg-no-repeat shadow-xl lg:block"
          style={{
            left: "calc(100% + 16px)",
            width: IMAGE_HEIGHT,
            height: IMAGE_HEIGHT,
            backgroundImage: `url(${src})`,
            backgroundSize: `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
            backgroundPosition: `${zoom.percentX}% ${zoom.percentY}%`,
          }}
        />
      )}
    </div>
  );
}

/** Units that can really be sold: stock of the batches that have not expired. */
function liveStock(product: BuyerProduct): number | undefined {
  const batches = product.pricingDetails ?? [];
  if (batches.length === 0) return undefined;
  const now = Date.now();
  return batches
    .filter((b) => (b.stockQuantity ?? 0) > 0)
    .filter((b) => !(b.expiryDate && new Date(b.expiryDate).getTime() < now))
    .reduce((sum, b) => sum + (b.stockQuantity ?? 0), 0);
}

/**
 * The seller's description is usually "Label: text" lines (Composition, Used for, How to use ...). Those are shown as a
 * tidy label/value list; any other line stays a normal paragraph.
 */
function descriptionBlocks(text: string): { label: string | null; text: string }[] {
  return text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([A-Za-z][A-Za-z /&()-]{1,40}):\s*(.+)$/);
      return match ? { label: match[1], text: match[2] } : { label: null, text: line };
    });
}

/** "2027-03-31" -> "Mar 2027". Returns undefined for a missing or unreadable date. */
function formatMonthYear(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function Fact({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/** Other products from the same category, so a visitor can keep browsing without going back to the list. */
function RelatedProducts({ product }: { product: BuyerProduct }) {
  const [state, setState] = useState<{ key: string; items: BuyerProduct[] }>({ key: "", items: [] });
  const key = product.productId;

  useEffect(() => {
    const controller = new AbortController();
    searchProducts({ categoryId: product.categoryId, sort: "newest", size: 10 }, controller.signal)
      .then((result) =>
        setState({
          key,
          items: result.results
            .filter((r) => r.productId !== product.productId)
            .slice(0, 6)
            .map(searchResultToBuyerProduct),
        })
      )
      .catch((err) => {
        if (!isRequestCancelled(err)) setState({ key, items: [] });
      });
    return () => controller.abort();
  }, [key, product.categoryId, product.productId]);

  const loading = state.key !== key;
  if (!loading && state.items.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="related-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 id="related-heading" className="text-lg font-semibold text-gray-900">
          You may also like
        </h2>
        <Link href="/search" className="text-xs font-semibold text-primary-700 no-underline hover:text-primary-600">
          View all products →
        </Link>
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(156px,1fr))]">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} compact />)
          : state.items.map((item) => <ProductCard compact key={item.productId} product={item} />)}
      </div>
    </section>
  );
}

interface ProductDetailProps {
  productId: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<BuyerProduct | null | undefined>(undefined);
  const [mainIndex, setMainIndex] = useState(0);
  const [requestedQty, setRequestedQty] = useState<number | null>(null);
  const { items: cartItems, addItem } = useCart();
  const router = useRouter();
  const { openSignupModal, openLoginModal } = useBuyerLoginModal();
  const [isBuyerLoggedIn, setIsBuyerLoggedIn] = useState(() => buyerAuthService.isAuthenticated());

  useEffect(() => {
    getProductById(productId).then((result) => setProduct(result ?? null));
  }, [productId]);

  useEffect(() => {
    const syncBuyerAuth = () => setIsBuyerLoggedIn(buyerAuthService.isAuthenticated());
    window.addEventListener("buyer-auth-changed", syncBuyerAuth);
    return () => window.removeEventListener("buyer-auth-changed", syncBuyerAuth);
  }, []);

  if (product === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-8 rounded-3xl border border-gray-200 bg-white p-10 shadow-sm lg:grid-cols-2">
          <div className="animate-pulse rounded-2xl bg-gray-100" style={{ height: IMAGE_HEIGHT }} />
          <div className="space-y-4">
            <div className="h-4 w-1/4 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-gray-100" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <p className="text-lg text-gray-600">Product not found.</p>
        <Link href="/search" className="mt-4 inline-block text-sm font-semibold text-primary-700 hover:underline">
          Browse all products
        </Link>
      </div>
    );
  }

  const images = product.productImages?.map((img) => img.productImage).filter(Boolean) as string[];
  const displayImages = images && images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const { pricing, minQuantity, maxQuantity, unavailable } = resolveProductAvailability(product);
  const stock = liveStock(product);
  const sellingPrice = pricing?.sellingPrice ?? pricing?.mrp;
  const mrp = pricing?.mrp;
  const discount =
    mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice
      ? Math.round(((mrp - pricing.sellingPrice) / mrp) * 100)
      : null;
  const cartQuantity = cartItems.find((item) => item.productId === product.productId)?.quantity ?? 0;

  const clampQty = (value: number) => Math.min(maxQuantity ?? Infinity, Math.max(minQuantity, Number.isFinite(value) ? value : minQuantity));
  const quantity = requestedQty ?? minQuantity;

  const handleAddToCart = () => {
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
    addItem(product, clampQty(quantity));
  };
  const handleBuyNow = () => {
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
    if (cartQuantity === 0) addItem(product, clampQty(quantity));
    router.push("/cart");
  };

  // Quantity slabs the backend lets buyers see: live now and not hidden by the seller.
  const offers = (pricing?.additionalDiscounts ?? [])
    .filter((o) => offerMinQty(o) != null && offerPercent(o) != null && o.displayOffer !== false && o.active !== false)
    .sort((a, b) => (offerMinQty(a) ?? 0) - (offerMinQty(b) ?? 0));
  const appliedOffer = bestApplicableOffer(pricing?.discountPercentage, offers, clampQty(quantity));
  const offerUnitPrice =
    appliedOffer && pricing?.sellingPrice != null
      ? Math.round(pricing.sellingPrice * (1 - (offerPercent(appliedOffer) ?? 0) / 100) * 100) / 100
      : null;

  const stockBadge = unavailable
    ? { text: "Out of stock", className: "bg-red-50 text-red-700" }
    : stock != null && stock <= LOW_STOCK_UNITS
      ? { text: `Only ${stock} left`, className: "bg-amber-50 text-amber-800" }
      : { text: stock != null ? `In stock · ${stock.toLocaleString("en-IN")} units` : "In stock", className: "bg-green-50 text-green-700" };

  const blocks = product.productDescription ? descriptionBlocks(product.productDescription) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-primary-700">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/search" className="hover:text-primary-700">
          Products
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate font-medium text-gray-800">{product.productName}</span>
      </nav>

      <div className="grid gap-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-2 lg:gap-8 lg:p-6">
        {/* ---------------------------------------------------------------- gallery */}
        <section aria-label="Product images" className="flex gap-3">
          {displayImages.length > 1 && (
            <div className="flex shrink-0 flex-col gap-2">
              {displayImages.slice(0, 6).map((src, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMainIndex(index)}
                  aria-label={`Show image ${index + 1}`}
                  className={`h-12 w-12 overflow-hidden rounded-lg border-2 bg-gray-50 transition-colors ${
                    index === mainIndex ? "border-primary-600" : "border-transparent hover:border-gray-300"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${product.productName} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <ImageZoom
              src={displayImages[mainIndex] ?? PLACEHOLDER_IMAGE}
              alt={product.productName}
              onError={() => setMainIndex(mainIndex)}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- details + buy box */}
        <section className="flex min-w-0 flex-col">
          {product.manufacturerName && (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{product.manufacturerName}</p>
          )}
          <h1 className="mt-1 text-xl font-semibold leading-tight text-gray-900">{product.productName}</h1>
          {(product.sellerName || product.sellerEmail) && (
            <p className="mt-1.5 text-xs text-gray-500">
              Sold by <span className="font-medium text-gray-700">{product.sellerName ?? "Unknown seller"}</span>
              {product.sellerEmail && (
                <>
                  {" · "}
                  <a href={`mailto:${product.sellerEmail}`} className="text-primary-700 hover:underline">
                    {product.sellerEmail}
                  </a>
                </>
              )}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stockBadge.className}`}>{stockBadge.text}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                product.returnable === false ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-700"
              }`}
              title="Return period counts from delivery"
            >
              {returnPolicyLabel(product.returnable, product.returnPeriodDays)}
            </span>
            {discount !== null && isBuyerLoggedIn && (
              <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">{discount}% off</span>
            )}
          </div>

          <div className="mt-3 border-y border-gray-100 py-3">
            {sellingPrice != null ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {!isBuyerLoggedIn && <span className="text-xs font-medium text-gray-700">MRP:</span>}
                <div
                  className={`flex items-baseline gap-3 ${isBuyerLoggedIn ? "" : "pointer-events-none select-none blur-[5px]"}`}
                  title={isBuyerLoggedIn ? undefined : "Login to view price"}
                >
                  <span className="text-2xl font-bold text-primary-800">₹{sellingPrice}</span>
                  {mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice && (
                    <span className="text-sm text-gray-400 line-through">₹{mrp}</span>
                  )}
                  <span className="text-xs text-gray-500">/ unit</span>
                </div>
                {!isBuyerLoggedIn && (
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-600"
                  >
                    <Lock size={12} /> Log in to see price
                  </button>
                )}
              </div>
            ) : (
              <p className="text-base text-gray-600">Price on request</p>
            )}
            {isBuyerLoggedIn && product.gstPercentage != null && sellingPrice != null && (
              <p className="mt-1 text-xs text-gray-500">+ {product.gstPercentage}% GST</p>
            )}
          </div>

          {offers.length > 0 && (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50/60 p-3" aria-label="Special offers">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-green-800">
                <Tag size={14} /> Special offers
              </p>
              <ul className="mt-2 space-y-1.5">
                {offers.map((o, i) => {
                  const minQty = offerMinQty(o) as number;
                  const reachable = maxQuantity == null || minQty <= maxQuantity;
                  const until = formatOfferInstant(o.endsAt);
                  const active = appliedOffer === o;
                  return (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-800">
                      <span>
                        <span className="font-semibold">{offerPercent(o)}% off</span> on {minQty}+ units
                        {until && <span className="text-gray-500"> · until {until}</span>}
                        {!reachable && <span className="text-amber-700"> · above current max order</span>}
                      </span>
                      {active ? (
                        <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">Applied</span>
                      ) : (
                        reachable &&
                        !unavailable && (
                          <button
                            type="button"
                            onClick={() => setRequestedQty(clampQty(minQty))}
                            className="rounded-md border border-green-600 px-2 py-0.5 text-[11px] font-semibold text-green-700 hover:bg-green-100"
                          >
                            Set qty {minQty}
                          </button>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
              {appliedOffer && isBuyerLoggedIn && offerUnitPrice != null && (
                <p className="mt-2 text-xs font-semibold text-green-800">Offer price: ₹{offerUnitPrice} / unit at {clampQty(quantity)} units</p>
              )}
            </div>
          )}

          <div className="mt-3">
            <label className="text-xs font-medium text-gray-700" htmlFor="product-quantity">
              Quantity
            </label>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-0.5">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={unavailable || quantity <= minQuantity}
                  onClick={() => setRequestedQty(clampQty(quantity - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-primary-800 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus size={14} />
                </button>
                <input
                  id="product-quantity"
                  type="number"
                  inputMode="numeric"
                  min={minQuantity}
                  max={maxQuantity}
                  value={quantity}
                  disabled={unavailable}
                  onChange={(e) => setRequestedQty(Number(e.target.value))}
                  onBlur={() => setRequestedQty(clampQty(quantity))}
                  className="w-14 bg-transparent text-center text-sm font-semibold text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={unavailable || (maxQuantity != null && quantity >= maxQuantity)}
                  onClick={() => setRequestedQty(clampQty(quantity + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-primary-800 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                Min. order {minQuantity}
                {maxQuantity != null && ` · Max ${maxQuantity.toLocaleString("en-IN")}`}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable}
              className="flex min-w-36 flex-1 items-center justify-center gap-2 rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              <ShoppingCart size={16} />
              {unavailable ? "Out of stock" : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={unavailable}
              className="min-w-28 flex-1 rounded-lg border-2 border-primary-800 px-4 py-2.5 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
            >
              Buy now
            </button>
          </div>
          {cartQuantity > 0 && (
            <p className="mt-2 text-xs text-green-700">
              ✓ {cartQuantity} in your cart ·{" "}
              <Link href="/cart" className="font-semibold underline">
                View cart
              </Link>
            </p>
          )}

          <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50/40 p-3">
            <p className="text-xs font-semibold text-gray-900">Buying in bulk or want a better price?</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Ask the seller directly - it only takes a minute.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={`/product/${productId}/request-price`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-800 hover:bg-primary-200"
              >
                <Tag size={14} /> Request price option
              </Link>
              <Link
                href={`/product/${productId}/get-quote`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
              >
                <ClipboardList size={14} /> Get a quote
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Fact label="GST" value={product.gstPercentage != null ? `${product.gstPercentage}%` : undefined} />
            <Fact label="HSN code" value={product.hsnCode} />
            <Fact label="Min. order" value={minQuantity} />
            <Fact label="Max. order" value={maxQuantity != null ? maxQuantity.toLocaleString("en-IN") : undefined} />
          </div>
        </section>
      </div>

      <ProductInfoTabs
        manufacturerName={product.manufacturerName}
        blocks={blocks}
        facts={[
          { label: "Sold by", value: product.sellerName },
          { label: "GST", value: product.gstPercentage != null ? `${product.gstPercentage}%` : undefined },
          { label: "HSN code", value: product.hsnCode },
          { label: "Min. order", value: minQuantity },
          { label: "Max. order", value: maxQuantity != null ? maxQuantity.toLocaleString("en-IN") : undefined },
          { label: "Returns", value: returnPolicyLabel(product.returnable, product.returnPeriodDays) },
          { label: "Manufacturing date", value: formatMonthYear(pricing?.manufacturingDate) },
          { label: "Expiry date", value: formatMonthYear(pricing?.expiryDate) },
        ]}
      />

      <RelatedProducts product={product} />
    </div>
  );
}
