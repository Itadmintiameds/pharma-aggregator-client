"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, User, ChevronDown, ShoppingCart } from "lucide-react";
import SearchBox from "./SearchBox";
import CategoriesMenu from "./CategoriesMenu";
import ProfileProgressRing from "@/src/app/commonComponents/ProfileProgressRing";
import { useCart } from "@/src/context/CartContext";
import { useBuyerCartDrawer } from "@/src/app/buyer_e8d45a1b/context/BuyerCartDrawerContext";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { useBuyerOnboardingStatus, getBuyerProfileCompletion } from "@/src/hooks/useBuyerOnboardingStatus";

interface LandingHeaderProps {
    /** Pre-fills the search box (the results page passes its current ?q=). */
    searchQuery?: string;
}

const PAGE_LINKS = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
];

// Short labels for the shortcut row; ids match the storefront categories used by the search filter.
const CATEGORY_LINKS = [
    { label: "Drugs", id: 1 },
    { label: "Supplements", id: 2 },
    { label: "Food & Infant", id: 3 },
    { label: "Personal Care", id: 4 },
    { label: "Consumables", id: 5 },
    { label: "Equipment", id: 6 },
];

/**
 * Public storefront header. Two tiers, 128px in total (pages below are padded for that height):
 * a main bar (logo, categories + search, account and cart) and a slim nav row (pages, category shortcuts).
 */
const LandingHeader = ({ searchQuery }: LandingHeaderProps = {}) => {
    const { totalItems } = useCart();
    const { openCart } = useBuyerCartDrawer();
    const router = useRouter();
    const pathname = usePathname() ?? "";
    const [buyerEmail, setBuyerEmail] = useState<string | null>(() =>
        typeof window !== "undefined" ? buyerAuthService.getCurrentUser()?.username ?? null : null
    );
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const accountMenuRef = useRef<HTMLDivElement>(null);
    const { status: onboardingStatus } = useBuyerOnboardingStatus();
    const completion = getBuyerProfileCompletion(onboardingStatus);

    useEffect(() => {
        const syncBuyerAuth = () => setBuyerEmail(buyerAuthService.getCurrentUser()?.username ?? null);
        window.addEventListener("buyer-auth-changed", syncBuyerAuth);
        return () => window.removeEventListener("buyer-auth-changed", syncBuyerAuth);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
                setShowAccountMenu(false);
            }
        };
        if (showAccountMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAccountMenu]);

    const handleLogout = async () => {
        setShowAccountMenu(false);
        await buyerAuthService.logout();
        router.push("/");
    };

    const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

    return (
        <header className="fixed left-0 top-0 z-50 w-full bg-white shadow-sm">

            {/* ================= MAIN BAR (72px) ================= */}
            <div className="border-b border-neutral-100">
                <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-3 px-4 sm:gap-5 sm:px-6">

                    {/* Logo */}
                    <Link href="/" aria-label="TiaMeds home" className="relative hidden h-[48px] w-[121px] shrink-0 sm:block">
                        <Image
                            src="/assets/images/tiameds.logo.png"
                            alt="TiaMeds"
                            fill
                            className="object-contain"
                            priority
                        />
                    </Link>

                    {/* Categories + search: suggestions as you type, Enter opens the /search results page */}
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <CategoriesMenu />
                        <SearchBox initialQuery={searchQuery} />
                    </div>

                    {/* Account + cart */}
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {buyerEmail ? (
                            <div className="relative" ref={accountMenuRef}>
                                <button
                                    onClick={() => setShowAccountMenu((open) => !open)}
                                    aria-haspopup="true"
                                    aria-expanded={showAccountMenu}
                                    className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white pl-2 pr-3 transition-colors hover:bg-neutral-50"
                                >
                                    {completion ? (
                                        <ProfileProgressRing percent={completion.percent} color={completion.color} size={32}>
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50">
                                                <User size={14} className="text-primary-800" />
                                            </div>
                                        </ProfileProgressRing>
                                    ) : (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50">
                                            <User size={14} className="text-primary-800" />
                                        </div>
                                    )}
                                    <span className="hidden max-w-[120px] truncate text-sm text-neutral-700 md:inline">
                                        Hi, <span className="font-semibold text-primary-800">{buyerEmail.split("@")[0]}</span>
                                    </span>
                                    <ChevronDown
                                        size={16}
                                        className={`text-neutral-500 transition-transform ${showAccountMenu ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {showAccountMenu && (
                                    <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-neutral-100 bg-white py-1 shadow-lg">
                                        <button
                                            onClick={() => { setShowAccountMenu(false); router.push("/buyer_e8d45a1b/dashboard"); }}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-primary-50"
                                        >
                                            <LayoutDashboard size={16} />
                                            <span>Dashboard</span>
                                        </button>
                                        <button
                                            onClick={() => { setShowAccountMenu(false); router.push("/buyer_e8d45a1b/dashboard/profile"); }}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-primary-50"
                                        >
                                            <User size={16} />
                                            <span>Profile</span>
                                        </button>
                                        <div className="my-1 border-t border-neutral-100"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-warning-600 transition-colors hover:bg-warning-50"
                                        >
                                            <LogOut size={16} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/buyer_e8d45a1b/signup"
                                    className="flex h-11 items-center rounded-xl border border-primary-800 px-4 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50"
                                >
                                    <span className="hidden sm:inline">Become a Buyer</span>
                                    <span className="sm:hidden">Buyer</span>
                                </Link>
                                <Link
                                    href="/seller_7a3b9f2c"
                                    className="hidden h-11 items-center rounded-xl bg-primary-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-800 sm:flex"
                                >
                                    Become a Seller
                                </Link>
                            </>
                        )}

                        {buyerEmail && (
                            <button
                                type="button"
                                onClick={openCart}
                                aria-label={`Open cart${totalItems > 0 ? `, ${totalItems} item${totalItems === 1 ? "" : "s"}` : ""}`}
                                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary-800 text-primary-800 transition-colors hover:bg-primary-50"
                            >
                                <ShoppingCart size={20} aria-hidden="true" />
                                {totalItems > 0 && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                                        {totalItems}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= NAV ROW (56px) ================= */}
            <nav aria-label="Primary" className="bg-neutral-50">
                <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
                    <ul className="flex shrink-0 items-center gap-6">
                        {PAGE_LINKS.map((link) => (
                            <li key={link.label}>
                                <Link
                                    href={link.href}
                                    aria-current={isActive(link.href) ? "page" : undefined}
                                    className={`flex h-14 items-center border-b-2 text-sm font-semibold transition-colors ${
                                        isActive(link.href)
                                            ? "border-primary-800 text-primary-800"
                                            : "border-transparent text-neutral-700 hover:text-primary-800"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-neutral-300 md:block" />

                    <ul className="hidden items-center gap-5 md:flex">
                        {CATEGORY_LINKS.map((category) => (
                            <li key={category.id} className="shrink-0">
                                <Link
                                    href={`/search?categoryId=${category.id}`}
                                    className="text-sm font-medium text-neutral-600 transition-colors hover:text-primary-800"
                                >
                                    {category.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default LandingHeader;
