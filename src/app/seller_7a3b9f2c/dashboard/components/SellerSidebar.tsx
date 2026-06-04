"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Package,
  Gift,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { AiOutlinePieChart } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineLocalShipping } from "react-icons/md";
import { PiHeadphones } from "react-icons/pi";
import { DashboardView } from "@/src/types/seller/dashboard";
import { sellerAuthService } from "@/src/services/seller/authService";

interface SellerSidebarProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
}

const SellerSidebar = ({ currentView, setCurrentView }: SellerSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} />, path: "/seller_7a3b9f2c/dashboard" },
    { id: "product", label: "Products", icon: <Package size={20} />, path: "/seller_7a3b9f2c/products" },
    { id: "orders", label: "Orders", icon: <HiOutlineShoppingBag size={20} />, path: "/seller_7a3b9f2c/orders" },
    { id: "rfqs", label: "Conversions", icon: <AiOutlinePieChart size={20} />, path: "/seller_7a3b9f2c/conversions" },
    { id: "settings", label: "Settings", icon: <IoSettingsOutline size={20} />, path: "/seller_7a3b9f2c/settings" },
    { id: "shipment", label: "Shipment", icon: <MdOutlineLocalShipping size={20} />, path: "/seller_7a3b9f2c/shipment" },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      toast.loading("Logging out...", { id: "logout" });
      const refreshToken = localStorage.getItem('refreshToken');
      await sellerAuthService.logout(refreshToken || undefined);
      // await sellerAuthService.logout(false);
      toast.success("Logged out successfully", { id: "logout" });
      router.push("/?showLogin=true");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out", { id: "logout" });
      sellerAuthService.clearAuth();
      router.push("/?showLogin=true");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleHelpSupport = () => toast.success("Help & Support clicked");
  const handleUpgrade = () => toast.success("Upgrade account clicked");

  const handleMenuClick = (itemId: string, path: string) => {
    setCurrentView(itemId as DashboardView);
    router.push(path);
  };

  const isActive = (itemId: string, path: string) => {
    if (itemId === "overview" && pathname.includes("/dashboard")) return true;
    if (itemId === "product" && pathname.includes("/products")) return true;
    if (itemId === "profile" && pathname.includes("/profile")) return true;
    if (itemId === "reports" && pathname.includes("/reports")) return true;
    return false;
  };

  return (
    <aside
      className="fixed left-0 bottom-0 w-64 bg-white z-40 flex flex-col"
      style={{ top: 74, padding: 24, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.10)", justifyContent: "space-between" }}
    >
      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto flex flex-col" style={{ gap: 8 }}>
        {menuItems.map((item) => {
          const active = isActive(item.id, item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id, item.path)}
              style={{
                alignSelf: "stretch",
                height: 48,
                minHeight: 48,
                maxHeight: 52,
                background: active ? "var(--Colors-Secondary-Secondary-700, #7D32FC)" : "transparent",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                paddingLeft: 16,
                paddingRight: 16,
                gap: 8,
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#F4F0FF";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <span style={{ display: "flex", flexShrink: 0, color: active ? "var(--Colors-Primary-Neutral-pneutral-50, #F8F8F9)" : "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)" }}>
                {item.icon}
              </span>
              <span style={{
                color: active ? "var(--Colors-Primary-Neutral-pneutral-50, #F8F8F9)" : "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)",
                fontSize: 16,
                fontFamily: "Work Sans, sans-serif",
                fontWeight: active ? 500 : 400,
                lineHeight: "24px",
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Help & Support */}
        <button
          onClick={handleHelpSupport}
          style={{
            alignSelf: "stretch",
            paddingLeft: 16, paddingRight: 16, paddingTop: 11, paddingBottom: 11,
            background: "var(--Colors-Primary-Neutral-pneutral-100, #EAEAE9)",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#DDDDD9"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EAEAE9"; }}
        >
          <PiHeadphones size={24} style={{ flexShrink: 0, color: "#1E1E1D" }} />
          <span style={{ color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)", fontSize: 14, fontFamily: "Noto Sans, sans-serif", fontWeight: 400, lineHeight: "20px" }}>
            Help &amp; Support
          </span>
        </button>

        {/* Free Gift */}
        <button
          onClick={handleUpgrade}
          style={{
            alignSelf: "stretch",
            height: 82,
            background: "var(--Colors-Danger-Danger-100, #FFEEB8)",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFE59E"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFEEB8"; }}
        >
          <div style={{ position: "absolute", left: 20, top: 11, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <Gift size={24} color="#1E1E1D" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 400, color: "#1E1E1D" }}>
                Free Gift Awaits You!
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ width: 144, fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 400, color: "var(--Colors-Primary-Neutral-pneutral-700, #5A5B58)", lineHeight: "18px" }}>
                Upgrade your account
              </span>
              <ChevronRight size={16} color="#5A5B58" />
            </div>
          </div>
        </button>

        {/* Logout */}
        {/* <div style={{ alignSelf: "flex-start" }}>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              padding: 11,
              background: "var(--Colors-Warning-warning-50, #FDEBEB)",
              borderRadius: 16,
              border: "none",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              opacity: isLoggingOut ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => { if (!isLoggingOut) (e.currentTarget as HTMLButtonElement).style.background = "#FCD5D5"; }}
            onMouseLeave={(e) => { if (!isLoggingOut) (e.currentTarget as HTMLButtonElement).style.background = "#FDEBEB"; }}
          >
            <LogOut size={24} color="#FF3B3B" style={{ flexShrink: 0 }} />
            <span style={{ color: "var(--Colors-Warning-warning-500, #FF3B3B)", fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 400 }}>
              {isLoggingOut ? "Logging out…" : "Logout"}
            </span>
          </button>
        </div> */}
      </div>
    </aside>
  );
};

export default SellerSidebar;