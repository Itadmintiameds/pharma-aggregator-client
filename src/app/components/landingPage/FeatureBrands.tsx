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

    const marqueeSellers = [...sellers, ...sellers];

    return (
        <section className="w-full xl:w-[1280px] mx-auto bg-neutral-50 flex flex-col items-center justify-center py-6">

            {/* ================= HEADER ================= */}
            <div className="w-full max-w-[1240px] px-4 flex items-center">
                <h2 className="text-h4 font-semibold text-neutral-900">
                    Featured Sellers
                </h2>
            </div>

            {/* ================= LOGO MARQUEE ================= */}
            <div className="w-full max-w-[1240px] h-[92px] overflow-hidden mt-6">

                <div className="gap-8 brand-marquee">

                    {marqueeSellers.map((seller, index) => (
                        <div
                            key={`${seller.sellerId}-${index}`}
                            className="group relative w-[100px] h-[80px] shrink-0 flex flex-col items-center justify-center gap-2"
                        >
                            {seller.sellerImageUrl ? (
                                <img
                                    src={seller.sellerImageUrl}
                                    alt={seller.sellerName}
                                    className="w-14 h-14 rounded-2xl object-cover shadow-md ring-1 ring-pneutral-200"
                                />
                            ) : (
                                <SellerLogoMark name={seller.sellerName} />
                            )}

                            {/* Hover tooltip with the full company name */}
                            <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap z-20">
                                {seller.sellerName}
                            </span>
                        </div>
                    ))}

                </div>
            </div>

            {/* ================= MARQUEE ANIMATION ================= */}
            <style jsx>{`
  .brand-marquee {
    display: flex;
    width: max-content;
    animation: scrollBrands 20s linear infinite;
  }

  .brand-marquee:hover {
    animation-play-state: paused;
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
