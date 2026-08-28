"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Package, Lock, ArrowRight, Headset, LogOut } from "lucide-react";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { AiOutlinePieChart } from "react-icons/ai";
import { MdOutlineLocalShipping } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";

// Dashboard nav rail — labels/icons now match seller's SellerSidebar
// (dashboard/components/SellerSidebar.tsx) exactly (Overview/Products/
// Orders/Conversions/Shipment/Settings), per the Figma buyer reference.
// Distinct from ../../components/BuyerSidebar.tsx, the registration
// wizard's own progress rail, not dashboard navigation.
//
// Routes still point at buyer's existing real pages (Products -> browse
// catalog, Conversions -> RFQ & Quotes, Shipment -> saved suppliers,
// Settings -> support) rather than new stub routes, so nothing already
// built becomes unreachable — only the label/icon changed, not what each
// item links to. Flag if dedicated Shipment/Settings pages are wanted
// instead of this positional relabeling.
const menuItems = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} />, path: "/buyer_e8d45a1b/dashboard" },
  { id: "catalog", label: "Products", icon: <Package size={20} />, path: "/buyer_e8d45a1b/dashboard/catalog" },
  { id: "orders", label: "Orders", icon: <HiOutlineShoppingBag size={20} />, path: "/buyer_e8d45a1b/dashboard/orders" },
  { id: "rfq", label: "Conversions", icon: <AiOutlinePieChart size={20} />, path: "/buyer_e8d45a1b/dashboard/rfq" },
  { id: "suppliers", label: "Shipment", icon: <MdOutlineLocalShipping size={20} />, path: "/buyer_e8d45a1b/dashboard/suppliers" },
  { id: "support", label: "Settings", icon: <IoSettingsOutline size={20} />, path: "/buyer_e8d45a1b/dashboard/support" },
];

// Items reachable before full approval — "RFQ & Quotes" needs no approved
// Buyer profile on the backend (BuyerQuoteRequestController only checks
// ROLE_BUYER), so a buyer who's mid-registration (or a guest-provisioned
// account that never registered) can still track requests they've raised.
const UNGATED_ITEM_IDS = new Set(["overview", "rfq"]);

interface BuyerSidebarProps {
  // While the buyer isn't yet approved, every item except the ones in
  // UNGATED_ITEM_IDS is disabled — mirrors SellerSidebar's approval gate
  // (see OnboardingGate).
  approved?: boolean;
}

export default function BuyerSidebar({ approved = true }: BuyerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) =>
    path === "/buyer_e8d45a1b/dashboard" ? pathname === path : pathname.startsWith(path);

  const handleMenuClick = (itemId: string, path: string) => {
    if (!approved && !UNGATED_ITEM_IDS.has(itemId)) return;
    router.push(path);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      toast.loading("Logging out...", { id: "buyer-logout" });
      const refreshToken = localStorage.getItem("refreshToken");
      await buyerAuthService.logout(refreshToken || undefined);
      toast.success("Logged out successfully", { id: "buyer-logout" });
      router.push("/?showLogin=true");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out", { id: "buyer-logout" });
      buyerAuthService.clearAuth();
      router.push("/?showLogin=true");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className="fixed left-0 bottom-0 w-64 z-40 flex flex-col"
      style={{
        top: 74,
        padding: 24,
        background: "var(--Colors-Secondary-Secondary-600, #9659FD)",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.10)",
        justifyContent: "space-between",
      }}
    >
      <nav className="flex-1 overflow-y-auto flex flex-col" style={{ gap: 8 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const disabled = !approved && !UNGATED_ITEM_IDS.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id, item.path)}
              disabled={disabled}
              style={{
                alignSelf: "stretch",
                height: 48,
                minHeight: 48,
                maxHeight: 52,
                background: active ? "#FFFFFF" : "transparent",
                borderRadius: 8,
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                paddingLeft: 16,
                paddingRight: 16,
                gap: 8,
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.12)";
              }}
              onMouseLeave={(e) => {
                if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <span style={{ display: "flex", flexShrink: 0, color: disabled ? "rgba(255, 255, 255, 0.4)" : active ? "#000000" : "var(--Colors-Primary-Neutral-pneutral-50, #F8F8F9)" }}>
                {item.icon}
              </span>
              <span style={{
                flex: 1,
                textAlign: "left",
                color: disabled ? "rgba(255, 255, 255, 0.4)" : active ? "#000000" : "var(--Colors-Primary-Neutral-pneutral-50, #F8F8F9)",
                fontSize: 16,
                fontFamily: "Work Sans, sans-serif",
                fontWeight: active ? 500 : 400,
                lineHeight: "24px",
              }}>
                {item.label}
              </span>
              {disabled && (
                <Lock size={16} style={{ flexShrink: 0, color: "rgba(255, 255, 255, 0.4)" }} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2">
        <div className="rounded-2xl bg-white p-4 flex flex-col gap-2">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-600 text-white shrink-0">
            <Lock size={18} />
          </span>
          <div>
            <p className="text-p3 font-body font-bold text-pneutral-900">Unlock marketplace features</p>
            <p className="text-p4 font-body font-regular text-pneutral-600 mt-1">
              Complete your verification to access 10,000+ products from verified suppliers.
            </p>
          </div>
          <button
            type="button"
            className="self-start flex items-center gap-1.5 rounded-xl bg-secondary-600 text-white text-p4 font-body font-semibold px-4 py-2 mt-1"
          >
            Learn more
            <ArrowRight size={14} />
          </button>
        </div>

        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl bg-neutral-100 text-pneutral-900 text-p3 font-body font-regular px-4 py-3"
        >
          <Headset size={20} />
          Help &amp; Support
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 rounded-2xl bg-warning-50 text-red-500 text-p3 font-body font-semibold px-4 py-3 disabled:opacity-60"
        >
          <LogOut size={20} />
          {isLoggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </aside>
  );
}
