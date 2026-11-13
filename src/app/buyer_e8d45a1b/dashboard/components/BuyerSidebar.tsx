"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ClipboardList, FileText, LayoutDashboard, Package, Lock, Headset, LogOut, Undo2 } from "lucide-react";
import { HiOutlineShoppingBag } from "react-icons/hi";
import toast from "react-hot-toast";
import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import { HelpSupportPopup } from "@/src/app/commonComponents/SidebarPopups";

// Dashboard nav rail. Distinct from ../../components/BuyerSidebar.tsx, the registration wizard's own progress rail,
// which is not dashboard navigation.
//   Products         -> browse catalog
//   Orders           -> every order
//   Returns          -> the returns you raised, their progress and refunds
//   Quotes           -> price requests / RFQs and the sellers' quotes (the old "Conversions" item)
//   Quotation Orders -> only the orders that were placed from an accepted quote
const menuItems = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} />, path: "/buyer_e8d45a1b/dashboard" },
  { id: "catalog", label: "Products", icon: <Package size={20} />, path: "/buyer_e8d45a1b/dashboard/catalog" },
  { id: "orders", label: "Orders", icon: <HiOutlineShoppingBag size={20} />, path: "/buyer_e8d45a1b/dashboard/orders" },
  { id: "returns", label: "Returns", icon: <Undo2 size={20} />, path: "/buyer_e8d45a1b/dashboard/returns" },
  { id: "rfq", label: "Quotes", icon: <FileText size={20} />, path: "/buyer_e8d45a1b/dashboard/rfq" },
  { id: "quote-orders", label: "Quotation Orders", icon: <ClipboardList size={20} />, path: "/buyer_e8d45a1b/dashboard/quotation-orders" },
];

// Items reachable before full approval — "Quotes" needs no approved
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
  const [showHelp, setShowHelp] = useState(false);

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
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-3 rounded-2xl bg-neutral-100 text-pneutral-900 text-p3 font-body font-regular px-4 py-3 hover:bg-neutral-200"
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

      {showHelp && <HelpSupportPopup audience="buyer" onClose={() => setShowHelp(false)} />}
    </aside>
  );
}
