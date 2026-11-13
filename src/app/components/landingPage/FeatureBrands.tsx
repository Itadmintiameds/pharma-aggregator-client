"use client";

import { useEffect, useState } from "react";
import { getAllSellers, BuyerSeller } from "@/src/services/buyer/buyerProductService";

// Curated gradient pairs (drawn from the app's own design tokens) — picked deterministically
// per seller so the same company always gets the same mark, without needing a stored image.
const GRADIENTS: [string, string][] = [
    ["#6D28D9", "#C4AAFD"], // primary-900 -> secondary-300
    ["#9F75FC", "#4C1D95"], // secondary-500 -> deep purple
    ["#0EA5A5", "#5EEAD4"], // tertiary teal
    ["#DB2777", "#F9A8D4"], // pink
    ["#EA580C", "#FDBA74"], // orange
    ["#2563EB", "#93C5FD"], // blue
    ["#059669", "#6EE7B7"], // green
    ["#7C3AED", "#A78BFA"], // violet
];

// Marquee geometry: each seller cell is 120px wide with a 24px gap after it. STRIP_WIDTH is the widest the strip gets.
const ITEM_WIDTH = 120;
const ITEM_GAP = 24;
const STRIP_WIDTH = 1280;
/** Scroll speed, so a long list does not race past and a short one does not crawl. */
const SCROLL_PX_PER_SECOND = 80;

function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function initialsFor(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

// Dev/QA seed data is full of placeholder seller names ("test", "TestUser", "testSomil", ...) —
// filter those out so Featured Sellers isn't dominated by duplicate junk accounts.
const JUNK_NAME_PATTERN = /^test/i;

function isRealSellerName(name: string) {
    const trimmed = name.trim();
    return trimmed.length > 0 && !JUNK_NAME_PATTERN.test(trimmed);
}

interface SellerLogoMarkProps {
    name: string;
}

// A generated wordmark-style badge: deterministic gradient + monogram + a subtle diagonal
// highlight, styled like an app-icon logo rather than a flat avatar circle. Used whenever a
// seller has no real uploaded logo (sellerImageUrl).
function SellerLogoMark({ name }: SellerLogoMarkProps) {
    const [from, to] = GRADIENTS[hashString(name) % GRADIENTS.length];
    return (
        <div
            className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md ring-1 ring-white/50 flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
            <span
                aria-hidden
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/20"
            />
            <span className="relative text-white font-bold text-base tracking-tight drop-shadow-sm">
                {initialsFor(name)}
            </span>
        </div>
    );
}

const FeatureBrands = () => {
    const [sellers, setSellers] = useState<BuyerSeller[]>([]);

    useEffect(() => {
        getAllSellers()
            .then((result) => {
                const seen = new Set<string>();
                const filtered = result.filter((s) => {
                    if (!s.sellerName || !isRealSellerName(s.sellerName)) return false;
                    const key = s.sellerName.trim().toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                setSellers(filtered);
            })
            .catch(() => setSellers([]));
    }, []);

    if (sellers.length === 0) return null;

    // The scroll loops by sliding the row left by exactly one copy of itself, so one copy has to be wider than the
    // strip - otherwise the right-hand side is empty while it scrolls. With only a few sellers the list is repeated
    // until one copy fills the strip, then doubled for the seamless loop.
    const cell = ITEM_WIDTH + ITEM_GAP;
    const copies = Math.ceil((STRIP_WIDTH + ITEM_WIDTH) / cell / sellers.length);
    const oneCopy = Array.from({ length: Math.max(copies, 1) }, () => sellers).flat();
    const marqueeSellers = [...oneCopy, ...oneCopy];
    const loopSeconds = Math.round((oneCopy.length * cell) / SCROLL_PX_PER_SECOND);

    return (
        <section className="mx-auto w-full max-w-[1280px] px-3 py-6 sm:px-4" aria-labelledby="featured-sellers-heading">
            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-5 shadow-sm sm:px-8">
                {/* ================= HEADER ================= */}
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 id="featured-sellers-heading" className="text-h5 font-semibold text-neutral-900">
                            Featured Sellers
                        </h2>
                        <p className="mt-0.5 text-sm text-neutral-500">Manufacturers and distributors selling on TiaMeds</p>
                    </div>
                </div>

                {/* ================= LOGO MARQUEE ================= */}
                {/* The edges fade out, so logos glide in and out of view instead of being cut off. */}
                <div
                    className="overflow-hidden"
                    style={{
                        WebkitMaskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
                        maskImage: "linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)",
                    }}
                >
                    <div className="brand-marquee" style={{ animationDuration: `${loopSeconds}s` }}>
                        {marqueeSellers.map((seller, index) => (
                            <div
                                key={`${seller.sellerId}-${index}`}
                                title={seller.sellerName}
                                className="group mr-6 flex w-[120px] shrink-0 flex-col items-center gap-2 rounded-xl px-2 py-3 transition-colors hover:bg-neutral-50"
                            >
                                <div className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                                    {seller.sellerImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={seller.sellerImageUrl}
                                            alt={seller.sellerName}
                                            className="h-14 w-14 rounded-2xl object-cover shadow-md ring-1 ring-pneutral-200"
                                        />
                                    ) : (
                                        <SellerLogoMark name={seller.sellerName} />
                                    )}
                                </div>
                                <span className="w-full truncate text-center text-xs font-medium text-neutral-600 group-hover:text-neutral-900">
                                    {seller.sellerName}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ================= MARQUEE ANIMATION ================= */}
            <style jsx>{`
  .brand-marquee {
    display: flex;
    width: max-content;
    animation: scrollBrands 15s linear infinite;
  }

  .brand-marquee:hover {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    .brand-marquee {
      animation: none;
    }
  }

  @keyframes scrollBrands {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
`}</style>
        </section>
    );
};

export default FeatureBrands;
