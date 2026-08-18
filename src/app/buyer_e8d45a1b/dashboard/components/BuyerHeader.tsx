"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import toast from "react-hot-toast";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { RawTempBuyer } from "@/src/services/buyer/buyerRegistrationService";

interface BuyerHeaderProps {
  // Passed down from the dashboard page's own useBuyerOnboardingStatus()
  // call so the header can show the organization name once it exists,
  // without re-deriving onboarding state itself. Mirrors SellerHeader,
  // which instead fetches the seller profile directly (no buyer equivalent
  // of sellerProfileService exists yet).
  tempBuyer?: RawTempBuyer | null;
}

export default function BuyerHeader({ tempBuyer }: BuyerHeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      toast.loading("Logging out...", { id: "buyer-logout" });
      const refreshToken = localStorage.getItem("buyerRefreshToken");
      await buyerAuthService.logout(refreshToken || undefined);
      toast.success("Logged out successfully", { id: "buyer-logout" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out", { id: "buyer-logout" });
      buyerAuthService.clearAuth();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
      setShowUserMenu(false);
    }
  };

  const currentUser = buyerAuthService.getCurrentUser();
  const displayName = tempBuyer?.organizationName || "Buyer Account";
  const subDisplay = currentUser?.email ?? null;

  return (
    <header
      style={{
        background: "var(--Colors-Shades-white, white)",
        borderBottom: "1px var(--Colors-Primary-Neutral-pneutral-100, #EAEAE9) solid",
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div
        style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 12, paddingBottom: 12 }}
        className="flex items-end justify-between"
      >
        <Link href="/" className="relative w-[121px] h-[44px]">
          <Image
            src="/assets/images/tiameds.logo.png"
            alt="TiaMeds"
            fill
            className="object-contain"
            priority
          />
        </Link>

        <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 16, display: "flex" }}>
          <div style={{ position: "relative" }} ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              disabled={isLoggingOut}
              style={{ justifyContent: "flex-start", alignItems: "flex-end", display: "flex" }}
            >
              <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 10, display: "flex" }}>
                <div style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-end", display: "inline-flex" }}>
                  <div style={{ justifyContent: "flex-end", alignItems: "center", gap: 6, display: "flex" }}>
                    <div style={{ textAlign: "right", color: "#4B465C", fontSize: 14, fontFamily: "Work Sans, sans-serif", fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                      {displayName}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "Work Sans, sans-serif",
                        fontWeight: 600,
                        letterSpacing: 0.4,
                        color: "#7C3AED",
                        background: "#EDE4FF",
                        borderRadius: 999,
                        padding: "2px 8px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Buyer
                    </span>
                  </div>
                  {subDisplay && (
                    <div style={{ textAlign: "center", color: "#979797", fontSize: 12, fontFamily: "Work Sans, sans-serif", fontWeight: 400, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                      {subDisplay}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#EDE4FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={18} style={{ color: "#7C3AED" }} />
                </div>
              </div>
              <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronDown size={12} style={{ color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)", transition: "transform 0.2s", transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)" }} />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-50">
                <button
                  onClick={() => { setShowUserMenu(false); router.push("/buyer_e8d45a1b/dashboard/profile"); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <div className="border-t border-neutral-100 my-1"></div>
                <button
                  onClick={() => { setShowUserMenu(false); handleLogout(); }}
                  disabled={isLoggingOut}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <LogOut size={16} />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
