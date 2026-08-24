"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductById } from "@/src/services/buyer/buyerProductService";
import { BuyerProduct } from "@/src/types/buyer/product";
import { useCart } from "@/src/context/CartContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";
import Button from "@/src/app/commonComponents/Button";
import { Tag, ClipboardList } from "lucide-react";

const PLACEHOLDER_IMAGE = "/icons/Tumbnail.svg";
const ZOOM_FACTOR = 2.5;
const LENS_SIZE = 160;

interface ImageZoomProps {
  src: string;
  alt: string;
  onError: () => void;
}

function ImageZoom({ src, alt, onError }: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ active: boolean; x: number; y: number; percentX: number; percentY: number }>({
    active: false,
    x: 0,
    y: 0,
    percentX: 50,
    percentY: 50,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    setZoom({ active: true, x, y, percentX, percentY });
  };

  const lensLeft = Math.min(Math.max(zoom.x - LENS_SIZE / 2, 0), (containerRef.current?.clientWidth ?? LENS_SIZE) - LENS_SIZE);
  const lensTop = Math.min(Math.max(zoom.y - LENS_SIZE / 2, 0), (containerRef.current?.clientHeight ?? LENS_SIZE) - LENS_SIZE);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative h-[400px] overflow-hidden rounded-xl bg-neutral-50 cursor-crosshair"
        onMouseEnter={handleMouseMove}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
      >
        <img src={src} alt={alt} className="w-full h-full object-contain" onError={onError} />

        {zoom.active && (
          <div
            className="absolute border-2 border-primary-600 bg-white/30 pointer-events-none"
            style={{
              width: LENS_SIZE,
              height: LENS_SIZE,
              left: lensLeft,
              top: lensTop,
            }}
          />
        )}
      </div>

      {zoom.active && (
        <div
          className="hidden lg:block absolute top-0 left-[calc(100%+16px)] w-[420px] h-[400px] rounded-xl border border-pneutral-200 shadow-lg bg-white bg-no-repeat z-30"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
            backgroundPosition: `${zoom.percentX}% ${zoom.percentY}%`,
          }}
        />
      )}
    </div>
  );
}

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
  const [mainIndex, setMainIndex] = useState(0);
  const { addItem } = useCart();
  const router = useRouter();
  const { openSignupModal } = useBuyerLoginModal();
  const [isBuyerLoggedIn, setIsBuyerLoggedIn] = useState(() =>
    buyerAuthService.isAuthenticated()
  );

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

  const handleAddToCart = () => {
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
    addItem(product);
  };
  const handleBuyNow = () => {
    if (!isBuyerLoggedIn) {
      openSignupModal();
      return;
    }
    addItem(product);
    router.push("/cart");
  };
  const handleRequestPrice = () => router.push(`/product/${productId}/request-price`);
  const handleGetQuote = () => router.push(`/product/${productId}/get-quote`);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow-md p-8">
        {/* Image gallery */}
        <div className="flex gap-4 mb-8">
          {displayImages.length > 1 && (
            <div className="flex flex-col gap-3 shrink-0">
              {displayImages.slice(0, 6).map((src, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMainIndex(index)}
                  className={`relative w-16 h-16 overflow-hidden rounded-lg bg-neutral-50 border-2 transition-colors ${
                    index === mainIndex ? "border-primary-600" : "border-transparent hover:border-pneutral-300"
                  }`}
                >
                  <img
                    src={src}
                    alt={`${product.productName} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="relative flex-1 max-w-105">
            <ImageZoom
              src={displayImages[mainIndex] ?? PLACEHOLDER_IMAGE}
              alt={product.productName}
              onError={() => setMainIndex(mainIndex)}
            />
          </div>
        </div>

        <h1 className="text-h4 font-heading font-medium text-pneutral-900 mb-1">
          {product.productName}
        </h1>
        {product.manufacturerName && (
          <p className="text-p3 font-body text-pneutral-600 mb-2">{product.manufacturerName}</p>
        )}

        {(product.sellerName || product.sellerEmail) && (
          <p className="text-p4 font-body text-pneutral-500 mb-6">
            Sold by{" "}
            <span className="font-medium text-pneutral-700">
              {product.sellerName ?? "Unknown seller"}
            </span>
            {product.sellerEmail && (
              <>
                {" "}
                &middot;{" "}
                <a
                  href={`mailto:${product.sellerEmail}`}
                  className="text-primary-700 hover:underline"
                >
                  {product.sellerEmail}
                </a>
              </>
            )}
          </p>
        )}

        {/* Pricing */}
        <div className="flex items-center gap-1 mb-6">
          {!isBuyerLoggedIn && (
            <span className="text-p3 font-body text-pneutral-900 whitespace-nowrap">MRP:</span>
          )}
          <div
            className={`flex items-center gap-3 ${
              isBuyerLoggedIn ? "" : "blur-[5px] select-none pointer-events-none"
            }`}
            title={isBuyerLoggedIn ? undefined : "Login to view price"}
          >
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
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Button variant="filled" size="lg" label="Add to Cart" onClick={handleAddToCart} />
          <Button variant="outline" size="lg" label="Buy Now" onClick={handleBuyNow} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Button
            variant="tonal"
            size="md"
            label="Request Price Option"
            icon={<Tag size={16} />}
            onClick={handleRequestPrice}
          />
          <Button
            variant="text"
            size="md"
            label="Get a Quote"
            icon={<ClipboardList size={16} />}
            onClick={handleGetQuote}
            className="border border-pneutral-300"
          />
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
