"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Gift,
  ChevronRight,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { AiOutlinePieChart } from "react-icons/ai";
import { MdOutlineAssignmentReturn } from "react-icons/md";
import { PiHeadphones } from "react-icons/pi";
import { DashboardView } from "@/src/types/seller/dashboard";
import { GiftPopup, HelpSupportPopup } from "./SellerSidebarPopups";

interface SellerSidebarProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  // While the seller isn't yet approved, every item except Overview is
  // disabled — the dashboard's Overview area is the only thing they can use
  // until admin approval (see OnboardingGate). Defaults to true so pages
  // that don't pass it (e.g. any leftover standalone usage) behave as before.
  approved?: boolean;
  /** Icon-only rail (64px) instead of the full one (208px). Owned by the layout, which also moves the page content. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const menuItems = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} />, path: "/seller_7a3b9f2c/dashboard" },
  { id: "product", label: "Products", icon: <Package size={18} />, path: "/seller_7a3b9f2c/products" },
  { id: "orders", label: "Orders", icon: <HiOutlineShoppingBag size={18} />, path: "/seller_7a3b9f2c/orders" },
  { id: "returns", label: "Returns", icon: <MdOutlineAssignmentReturn size={18} />, path: "/seller_7a3b9f2c/returns" },
  { id: "rfqs", label: "Quote Requests", icon: <AiOutlinePieChart size={18} />, path: "/seller_7a3b9f2c/conversions" },
];

const SellerSidebar = ({
  setCurrentView,
  approved = true,
  collapsed = false,
  onToggleCollapsed,
}: SellerSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [popup, setPopup] = useState<"help" | "gift" | null>(null);

  const handleMenuClick = (itemId: string, path: string) => {
    if (!approved && itemId !== "overview") return;
    setCurrentView(itemId as DashboardView);
    router.push(path);
  };

  // Active = the current route is the item's route or one of its sub-routes (e.g. /products/add).
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

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
            const disabled = !approved && item.id !== "overview";
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
          onClick={() => setPopup("help")}
          title={collapsed ? "Help & Support" : undefined}
          aria-label="Help & Support"
          className={`flex items-center rounded-xl bg-neutral-100 text-xs font-body text-neutral-900 hover:bg-neutral-200 ${
            collapsed ? "h-10 justify-center" : "gap-2.5 px-3 py-2.5"
          }`}
        >
          <PiHeadphones size={18} className="shrink-0" />
          {!collapsed && "Help & Support"}
        </button>

        <button
          type="button"
          onClick={() => setPopup("gift")}
          title={collapsed ? "Free Gift Awaits You!" : undefined}
          aria-label="Free Gift Awaits You! Upgrade your account"
          className={`flex items-center rounded-xl bg-[#FFEEB8] text-neutral-900 hover:bg-[#FFE59E] ${
            collapsed ? "h-10 justify-center" : "gap-2.5 px-3 py-2"
          }`}
        >
          <Gift size={18} className="shrink-0" />
          {!collapsed && (
            <span className="flex min-w-0 flex-1 items-center justify-between gap-1 text-left">
              <span className="min-w-0">
                <span className="block truncate text-xs font-body">Free Gift Awaits You!</span>
                <span className="block truncate text-[11px] font-body text-neutral-600">Upgrade your account</span>
              </span>
              <ChevronRight size={14} className="shrink-0 text-neutral-600" />
            </span>
          )}
        </button>
      </div>

      {popup === "help" && <HelpSupportPopup onClose={() => setPopup(null)} />}
      {popup === "gift" && <GiftPopup onClose={() => setPopup(null)} />}
    </aside>
  );
};

export default SellerSidebar;
