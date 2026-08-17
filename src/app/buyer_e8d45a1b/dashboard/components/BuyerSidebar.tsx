"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Lock } from "lucide-react";
import { HiOutlineShoppingBag, HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { LuWarehouse } from "react-icons/lu";
import { PiHeadphones } from "react-icons/pi";
import { MdOutlineReceiptLong } from "react-icons/md";

// Dashboard nav rail — visual match for seller's SellerSidebar
// (dashboard/components/SellerSidebar.tsx). Distinct from
// ../../components/BuyerSidebar.tsx, which is the 5-step *registration
// wizard* progress rail, not dashboard navigation.
//
// Sections chosen for a B2B pharma marketplace buyer: browsing the seller
// catalog, tracking orders, raising RFQs/quotes (a B2B-specific flow sellers
// don't need), a supplier shortlist, and invoices/support. Each currently
// renders an UnderDevelopment placeholder until its data layer exists — same
// stub-first approach seller used for Orders/Conversions/Settings/Shipment.
const menuItems = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} />, path: "/buyer_e8d45a1b/dashboard" },
  { id: "catalog", label: "Browse Catalog", icon: <HiOutlineShoppingBag size={20} />, path: "/buyer_e8d45a1b/dashboard/catalog" },
  { id: "orders", label: "My Orders", icon: <MdOutlineReceiptLong size={20} />, path: "/buyer_e8d45a1b/dashboard/orders" },
  { id: "rfq", label: "RFQ & Quotes", icon: <HiOutlineClipboardDocumentList size={20} />, path: "/buyer_e8d45a1b/dashboard/rfq" },
  { id: "suppliers", label: "Saved Suppliers", icon: <LuWarehouse size={20} />, path: "/buyer_e8d45a1b/dashboard/suppliers" },
  { id: "support", label: "Support", icon: <PiHeadphones size={20} />, path: "/buyer_e8d45a1b/dashboard/support" },
];

interface BuyerSidebarProps {
  // While the buyer isn't yet approved, every item except Overview is
  // disabled — mirrors SellerSidebar's approval gate (see OnboardingGate).
  approved?: boolean;
}

export default function BuyerSidebar({ approved = true }: BuyerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/buyer_e8d45a1b/dashboard" ? pathname === path : pathname.startsWith(path);

  const handleMenuClick = (itemId: string, path: string) => {
    if (!approved && itemId !== "overview") return;
    router.push(path);
  };

  return (
    <aside
      className="fixed left-0 bottom-0 w-64 z-40 flex flex-col"
      style={{
        top: 74,
        padding: 24,
        background: "var(--Colors-Secondary-Secondary-600, #9659FD)",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.10)",
      }}
    >
      <nav className="flex-1 overflow-y-auto flex flex-col" style={{ gap: 8 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const disabled = !approved && item.id !== "overview";
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
                background: active ? "var(--Colors-Secondary-Secondary-700, #7D32FC)" : "transparent",
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
              <span style={{ display: "flex", flexShrink: 0, color: disabled ? "rgba(255, 255, 255, 0.4)" : "var(--Colors-Primary-Neutral-pneutral-50, #F8F8F9)" }}>
                {item.icon}
              </span>
              <span style={{
                flex: 1,
                textAlign: "left",
                color: disabled ? "rgba(255, 255, 255, 0.4)" : "var(--Colors-Primary-Neutral-pneutral-50, #F8F8F9)",
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
    </aside>
  );
}
