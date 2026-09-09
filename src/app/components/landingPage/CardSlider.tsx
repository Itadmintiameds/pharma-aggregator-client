"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShoppingCart, ShoppingBag, Minus, Plus } from "lucide-react";
import Button from "@/src/app/commonComponents/Button";
import { getAllProducts } from "@/src/services/buyer/buyerProductService";
import { BuyerProduct } from "@/src/types/buyer/product";
import { useCart } from "@/src/context/CartContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerLoginModal } from "@/src/app/buyer_e8d45a1b/context/BuyerLoginModalContext";

const SLIDE_COUNT = 8;
const CARD_GAP = 20;

// Rotates through the same pastel design tokens Figma used for the carousel cards.
const CARD_BACKGROUNDS = ["bg-success-50", "bg-secondary-50", "bg-warning-50", "bg-danger-50"];

const PLACEHOLDER_IMAGE = "/icons/Tumbnail.svg";

interface SlideCardProps {
  product: BuyerProduct;
  bgClass: string;
}

function SlideCard({ product, bgClass }: SlideCardProps) {
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const router = useRouter();
  const { openSignupModal } = useBuyerLoginModal();
  const [isBuyerLoggedIn, setIsBuyerLoggedIn] = useState(() =>
    buyerAuthService.isAuthenticated()
  );

  useEffect(() => {
    const syncBuyerAuth = () => setIsBuyerLoggedIn(buyerAuthService.isAuthenticated());
    window.addEventListener("buyer-auth-changed", syncBuyerAuth);
    return () => window.removeEventListener("buyer-auth-changed", syncBuyerAuth);
  }, []);

  const pricing = product.pricingDetails?.[0];
  const packaging = product.packagingDetails?.[0];
  const rawImage = product.productImages?.[0]?.productImage;
  const hasImage = Boolean(rawImage);
  const image = rawImage || PLACEHOLDER_IMAGE;
  const cartQuantity =
    cartItems.find((item) => item.productId === product.productId)?.quantity ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
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

  return (
    <Link
      href={`/product/${product.productId}`}
      data-slide-card
      className={`shrink-0 snap-start flex items-center gap-3 h-[224px] w-[300px] sm:w-[380px] md:w-[420px] lg:w-[440px] xl:w-[460px] p-4 sm:p-5 xl:p-xlg rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)] ${bgClass}`}
    >
      <div
        className={`shrink-0 relative overflow-hidden h-[176px] w-[110px] sm:w-[130px] xl:w-[151px] rounded-lg px-2 py-1 ${bgClass}`}
      >
        <img
          src={image}
          alt={product.productName}
          className={`absolute inset-0 w-full h-full ${hasImage ? "object-cover" : "object-contain p-4"}`}
        />
      </div>

      <div className="flex flex-col h-full items-end justify-between min-w-0 flex-1">
        <p className="font-heading font-semibold text-lg xl:text-h4 text-pneutral-900 text-center truncate w-full">
          {product.manufacturerName || "Pharma Brand"}
        </p>

        <div className="flex flex-col items-end w-full min-w-0">
          <h3 className="font-heading font-semibold text-base xl:text-label-l5 text-primary-900 text-right truncate w-full">
            {product.productName}
          </h3>
          {product.productDescription && (
            <p className="text-p3 font-body text-pneutral-900 text-right truncate w-full">
              {product.productDescription}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between w-full gap-2">
          <div className="flex items-center gap-1 pt-1">
            <span className="size-2 rounded-full bg-warning-500 shrink-0" />
            <span className="text-p3 font-body text-pneutral-500 whitespace-nowrap">
              Limited stock
            </span>
          </div>
          {pricing && (
            <div className="flex items-end gap-1 shrink-0">
              {pricing.mrp != null && pricing.mrp !== pricing.sellingPrice && (
                <span className="text-p3 font-body text-pneutral-900 line-through whitespace-nowrap">
                  ₹{pricing.mrp.toFixed(2)}
                </span>
              )}
              {pricing.sellingPrice != null && (
                <span className="font-heading font-semibold text-label-l5 text-pneutral-900 whitespace-nowrap">
                  ₹{pricing.sellingPrice.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {packaging && (packaging.minimumOrderQuantity || packaging.maximumOrderQuantity) && (
          <div className="flex items-center justify-between w-full text-p3 font-body text-pneutral-500 whitespace-nowrap">
            {packaging.minimumOrderQuantity != null && <span>Min. QTY:{packaging.minimumOrderQuantity}</span>}
            {packaging.maximumOrderQuantity != null && <span>Max. QTY:{packaging.maximumOrderQuantity}</span>}
          </div>
        )}

        <div className="flex items-end justify-center gap-4 shrink-0">
          {cartQuantity > 0 ? (
            <div className="flex items-center gap-3 border border-pneutral-200 bg-pneutral-50 px-sm py-1 rounded-full h-[40px]">
              <button
                onClick={handleDecrement}
                className="text-primary-800 hover:text-primary-900 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="text-p3 font-medium text-pneutral-800 w-4 text-center">{cartQuantity}</span>
              <button
                onClick={handleAddToCart}
                className="text-primary-800 hover:text-primary-900 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="md"
              shape="square"
              label="Add to Cart"
              icon={<ShoppingCart size={16} />}
              onClick={handleAddToCart}
              className="min-w-[108px]"
            />
          )}
          <Button
            variant="filled"
            size="md"
            shape="square"
            label="Buy Now"
            icon={<ShoppingBag size={16} />}
            onClick={handleBuyNow}
            className="min-w-[108px]"
          />
        </div>
      </div>
    </Link>
  );
}

interface CardSliderProps {
  // When provided (e.g. the hero's category-filtered product list), these are shown
  // as-is instead of the component fetching its own top-N products.
  products?: BuyerProduct[];
}

export default function CardSlider({ products: providedProducts }: CardSliderProps = {}) {
  const [fetchedProducts, setFetchedProducts] = useState<BuyerProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (providedProducts) return;
    getAllProducts()
      .then((result) => setFetchedProducts(result.slice(0, SLIDE_COUNT)))
      .catch(() => setFetchedProducts([]));
  }, [providedProducts]);

  const products = providedProducts ?? fetchedProducts;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const firstCard = track.querySelector<HTMLElement>("[data-slide-card]");
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width + CARD_GAP : 1;
      setActiveIndex(Math.round(track.scrollLeft / cardWidth));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [products.length]);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector<HTMLElement>("[data-slide-card]");
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width + CARD_GAP : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  };

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>("[data-slide-card]");
    cards[index]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  if (products.length === 0) return null;

  return (
    <section className="w-full">
      <div className="relative">
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
        >
          {products.map((product, index) => (
            <SlideCard
              key={product.productId}
              product={product}
              bgClass={CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length]}
            />
          ))}
        </div>

        {products.length > 1 && (
          <>
            <button
              onClick={() => scrollByCard(-1)}
              aria-label="Previous products"
              className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 items-center justify-center size-11 rounded-full bg-primary-900 text-base-white shadow-[1px_2px_6px_rgba(76,0,128,0.5)] hover:bg-primary-800 transition-colors z-10"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={() => scrollByCard(1)}
              aria-label="Next products"
              className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 items-center justify-center size-11 rounded-full bg-primary-900 text-base-white shadow-[1px_2px_6px_rgba(76,0,128,0.5)] hover:bg-primary-800 transition-colors z-10"
            >
              <ArrowRight size={24} />
            </button>
          </>
        )}
      </div>

      {products.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {products.map((product, index) => (
            <button
              key={product.productId}
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-4 bg-pneutral-900" : "w-1.5 bg-pneutral-200"
              }`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
