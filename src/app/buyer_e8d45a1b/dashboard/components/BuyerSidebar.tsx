"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Lock,
  Headset,
  LogOut,
  Undo2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
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
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} />, path: "/buyer_e8d45a1b/dashboard" },
  { id: "catalog", label: "Products", icon: <Package size={18} />, path: "/buyer_e8d45a1b/dashboard/catalog" },
  { id: "orders", label: "Orders", icon: <HiOutlineShoppingBag size={18} />, path: "/buyer_e8d45a1b/dashboard/orders" },
  { id: "returns", label: "Returns", icon: <Undo2 size={18} />, path: "/buyer_e8d45a1b/dashboard/returns" },
  { id: "rfq", label: "Quotes", icon: <FileText size={18} />, path: "/buyer_e8d45a1b/dashboard/rfq" },
  { id: "quote-orders", label: "Quotation Orders", icon: <ClipboardList size={18} />, path: "/buyer_e8d45a1b/dashboard/quotation-orders" },
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
  /** Icon-only rail (64px) instead of the full one (208px). Owned by the layout, which also moves the page content. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function BuyerSidebar({ approved = true, collapsed = false, onToggleCollapsed }: BuyerSidebarProps) {
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

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      aria-label="Dashboard navigation"
      className={`fixed bottom-0 left-0 z-40 flex flex-col justify-between bg-[#9659FD] shadow-md transition-[width] duration-200 ${
        collapsed ? "w-16 p-3" : "w-52 p-4"
      }`}
      style={{ top: 74 }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`mb-3 flex h-8 items-center rounded-lg text-white/90 transition-colors hover:bg-white/15 hover:text-white ${
            collapsed ? "w-full justify-center" : "self-start px-3 justify-start"
          }`}
        >
          <ToggleIcon size={18} />
        </button>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const disabled = !approved && !UNGATED_ITEM_IDS.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMenuClick(item.id, item.path)}
                disabled={disabled}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 shrink-0 items-center overflow-hidden rounded-lg transition-colors ${
                  collapsed ? "justify-center px-0" : "gap-2.5 px-3"
                } ${
                  active
                    ? "bg-white text-black"
                    : disabled
                      ? "cursor-not-allowed text-white/40"
                      : "text-neutral-50 hover:bg-white/15"
                }`}
              >
                <span className="flex shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className={`flex-1 truncate text-left text-sm font-heading ${active ? "font-medium" : "font-normal"}`}>
                      {item.label}
                    </span>
                    {disabled && <Lock size={14} className="shrink-0" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          title={collapsed ? "Help & Support" : undefined}
          aria-label="Help & Support"
          className={`flex items-center rounded-xl bg-neutral-100 text-xs font-body text-neutral-900 hover:bg-neutral-200 ${
            collapsed ? "h-10 justify-center" : "gap-2.5 px-3 py-2.5"
          }`}
        >
          <Headset size={18} className="shrink-0" />
          {!collapsed && "Help & Support"}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={collapsed ? "Logout" : undefined}
          aria-label="Logout"
          className={`flex items-center rounded-xl bg-warning-50 text-xs font-body font-semibold text-red-500 disabled:opacity-60 ${
            collapsed ? "h-10 justify-center" : "gap-2.5 px-3 py-2.5"
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && (isLoggingOut ? "Logging out…" : "Logout")}
        </button>
      </div>

      {showHelp && <HelpSupportPopup audience="buyer" onClose={() => setShowHelp(false)} />}
    </aside>
  );
}
