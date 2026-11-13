"use client";
import { resolveProductAvailability } from "@/src/utils/cartAvailability";

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

const PLACEHOLDER_IMAGE = "/icons/Tumbnail.svg";
const ZOOM_FACTOR = 2.5;
const LENS_SIZE = 160;
const IMAGE_HEIGHT = 440;
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
        className="relative cursor-crosshair overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
        style={{ height: IMAGE_HEIGHT }}
        onMouseEnter={handleMouseMove}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-contain p-4" onError={onError} />

        {zoom.active && (
          <div
            className="pointer-events-none absolute border-2 border-primary-600 bg-white/30"
            style={{ width: LENS_SIZE, height: LENS_SIZE, left: zoom.lensLeft, top: zoom.lensTop }}
          />
        )}
      </div>

      {zoom.active && (
        <div
          className="absolute top-0 z-30 hidden rounded-2xl border border-gray-200 bg-white bg-no-repeat shadow-xl lg:block"
          style={{
            left: "calc(100% + 16px)",
            width: 440,
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

function Fact({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/** Other products from the same category, so a visitor can keep browsing without going back to the list. */
function RelatedProducts({ product }: { product: BuyerProduct }) {
  const [state, setState] = useState<{ key: string; items: BuyerProduct[] }>({ key: "", items: [] });
  const key = product.productId;

  useEffect(() => {
    const controller = new AbortController();
    searchProducts({ categoryId: product.categoryId, sort: "newest", size: 8 }, controller.signal)
      .then((result) =>
        setState({
          key,
          items: result.results
            .filter((r) => r.productId !== product.productId)
            .slice(0, 4)
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
    <section className="mt-12" aria-labelledby="related-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 id="related-heading" className="text-2xl font-semibold text-gray-900">
          You may also like
        </h2>
        <Link href="/search" className="text-sm font-semibold text-primary-700 hover:underline">
          View all products →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
          : state.items.map((item) => <ProductCard key={item.productId} product={item} />)}
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
      <div className="mx-auto max-w-7xl px-6 py-10">
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

  const stockBadge = unavailable
    ? { text: "Out of stock", className: "bg-red-50 text-red-700" }
    : stock != null && stock <= LOW_STOCK_UNITS
      ? { text: `Only ${stock} left`, className: "bg-amber-50 text-amber-800" }
      : { text: stock != null ? `In stock · ${stock.toLocaleString("en-IN")} units` : "In stock", className: "bg-green-50 text-green-700" };

  const blocks = product.productDescription ? descriptionBlocks(product.productDescription) : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
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

      <div className="grid gap-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:gap-12 lg:p-10">
        {/* ---------------------------------------------------------------- gallery */}
        <section aria-label="Product images" className="flex gap-4">
          {displayImages.length > 1 && (
            <div className="flex shrink-0 flex-col gap-3">
              {displayImages.slice(0, 6).map((src, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMainIndex(index)}
                  aria-label={`Show image ${index + 1}`}
                  className={`h-16 w-16 overflow-hidden rounded-xl border-2 bg-gray-50 transition-colors ${
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
          <h1 className="mt-1 text-3xl font-semibold leading-tight text-gray-900">{product.productName}</h1>
          {(product.sellerName || product.sellerEmail) && (
            <p className="mt-2 text-sm text-gray-500">
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

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stockBadge.className}`}>{stockBadge.text}</span>
            {discount !== null && isBuyerLoggedIn && (
              <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">{discount}% off</span>
            )}
          </div>

          <div className="mt-5 border-y border-gray-100 py-5">
            {sellingPrice != null ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {!isBuyerLoggedIn && <span className="text-sm font-medium text-gray-700">MRP:</span>}
                <div
                  className={`flex items-baseline gap-3 ${isBuyerLoggedIn ? "" : "pointer-events-none select-none blur-[5px]"}`}
                  title={isBuyerLoggedIn ? undefined : "Login to view price"}
                >
                  <span className="text-4xl font-bold text-primary-800">₹{sellingPrice}</span>
                  {mrp != null && pricing?.sellingPrice != null && mrp > pricing.sellingPrice && (
                    <span className="text-lg text-gray-400 line-through">₹{mrp}</span>
                  )}
                  <span className="text-sm text-gray-500">/ unit</span>
                </div>
                {!isBuyerLoggedIn && (
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline"
                  >
                    <Lock size={14} /> Log in to see price
                  </button>
                )}
              </div>
            ) : (
              <p className="text-lg text-gray-600">Price on request</p>
            )}
            {isBuyerLoggedIn && product.gstPercentage != null && sellingPrice != null && (
              <p className="mt-1 text-sm text-gray-500">+ {product.gstPercentage}% GST</p>
            )}
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-gray-700" htmlFor="product-quantity">
              Quantity
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl border border-gray-300 bg-white p-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={unavailable || quantity <= minQuantity}
                  onClick={() => setRequestedQty(clampQty(quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-800 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus size={16} />
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
                  className="w-20 bg-transparent text-center text-base font-semibold text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={unavailable || (maxQuantity != null && quantity >= maxQuantity)}
                  onClick={() => setRequestedQty(clampQty(quantity + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-800 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Min. order {minQuantity}
                {maxQuantity != null && ` · Max ${maxQuantity.toLocaleString("en-IN")}`}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable}
              className="flex min-w-44 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-800 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              <ShoppingCart size={18} />
              {unavailable ? "Out of stock" : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={unavailable}
              className="min-w-36 flex-1 rounded-xl border-2 border-primary-800 px-6 py-3.5 text-base font-semibold text-primary-800 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
            >
              Buy now
            </button>
          </div>
          {cartQuantity > 0 && (
            <p className="mt-3 text-sm text-green-700">
              ✓ {cartQuantity} in your cart ·{" "}
              <Link href="/cart" className="font-semibold underline">
                View cart
              </Link>
            </p>
          )}

          <div className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/40 p-4">
            <p className="text-sm font-semibold text-gray-900">Buying in bulk or want a better price?</p>
            <p className="mt-0.5 text-xs text-gray-500">Ask the seller directly - it only takes a minute.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/product/${productId}/request-price`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-200"
              >
                <Tag size={16} /> Request price option
              </Link>
              <Link
                href={`/product/${productId}/get-quote`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                <ClipboardList size={16} /> Get a quote
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label="GST" value={product.gstPercentage != null ? `${product.gstPercentage}%` : undefined} />
            <Fact label="HSN code" value={product.hsnCode} />
            <Fact label="Min. order" value={minQuantity} />
            <Fact label="Max. order" value={maxQuantity != null ? maxQuantity.toLocaleString("en-IN") : undefined} />
          </div>
        </section>
      </div>

      {blocks.length > 0 && (
        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:p-10" aria-labelledby="about-heading">
          <h2 id="about-heading" className="mb-5 text-2xl font-semibold text-gray-900">
            About this product
          </h2>
          <div className="divide-y divide-gray-100">
            {blocks.map((block, index) =>
              block.label ? (
                <div key={index} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
                  <p className="text-sm font-semibold text-gray-900">{block.label}</p>
                  <p className="text-sm leading-relaxed text-gray-700">{block.text}</p>
                </div>
              ) : (
                <p key={index} className="py-3 text-sm leading-relaxed text-gray-700">
                  {block.text}
                </p>
              )
            )}
          </div>
        </section>
      )}

      <RelatedProducts product={product} />
    </div>
  );
}
