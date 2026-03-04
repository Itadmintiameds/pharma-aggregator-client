"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  LayoutDashboard, 
  LogOut,
  Package,
  Gift
} from "lucide-react";
import toast from "react-hot-toast";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { AiOutlinePieChart } from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineLocalShipping } from "react-icons/md";
import { PiHeadphones } from "react-icons/pi";
import { DashboardView } from "@/src/types/seller/dashboard";

interface SellerSidebarProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
}

const SellerSidebar = ({ currentView, setCurrentView }: SellerSidebarProps) => {
  const router = useRouter();

  const menuItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: "product",
      label: "Product",
      icon: <Package size={20} />,
    },
    {
      id: "orders",
      label: "Orders",
      icon: <HiOutlineShoppingBag size={20} />,
    },
    {
      id: "rfqs",
      label: "RFQs",
      icon: <AiOutlinePieChart size={20} />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <IoSettingsOutline size={20} />,
    },
    {
      id: "shipment",
      label: "Shipment",
      icon: <MdOutlineLocalShipping size={20} />,
    },
    // {
    //   id: "reports",
    //   label: "Reports",
    //   icon: <FileText size={20} />,
    // },
  ];

  const handleLogout = () => {
    toast.success("Logged out successfully");
    router.push("/");
  };

  const handleHelpSupport = () => {
    toast.success("Help & Support clicked");
  };

  const handleUpgrade = () => {
    toast.success("Upgrade account clicked");
  };

  const handleMenuClick = (itemId: string) => {
    if (itemId === "overview") {
      setCurrentView("overview");
    } else if (itemId === "product") {
      setCurrentView("product");
    } else if (itemId === "reports") {
      setCurrentView("reports");
    } else if (itemId === "profile") {
      setCurrentView("profile");
    }
    // Handle other menu items as needed
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-base-white border-r border-neutral-100 flex flex-col">
      {/* Logo at the top of sidebar */}
      <div className="p-4 border-b border-white">
        <Link href="/seller_7a3b9f2c/dashboard" className="flex items-center justify-center">
          <Image
            src="/assets/images/tiameds.logo.png"
            alt="TiaMeds"
            width={180}
            height={84}
            className="object-contain"
          />
        </Link>
      </div>

      {/* Navigation Menu - with scroll if needed */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              (item.id === "product" && currentView === "product") || 
              (item.id === "overview" && currentView === "overview") ||
              (item.id === "reports" && currentView === "reports") ||
              (item.id === "profile" && currentView === "profile")
                ? "bg-primary-900 text-white"
                : "text-neutral-600 hover:bg-primary-05 hover:text-primary-900"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white space-y-2">
        {/* Help & Support Button */}
        <button
          onClick={handleHelpSupport}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#5E63661A] text-sm font-medium text-black hover:bg-primary-05 hover:text-primary-900 transition-all"
        >
          <PiHeadphones size={20} />
          <span>Help & Support</span>
        </button>

        {/* Free Gifts/Upgrade Banner */}
        <button
          onClick={handleUpgrade}
          className="w-full text-black flex items-start gap-3 px-4 py-3 rounded-lg bg-[#FFCC9133] hover:bg-primary-05 hover:text-primary-900 transition-all"
        >
          <Gift size={20} className="shrink-0 mt-0.5" />
          <div className="text-left">
            <p className="text-sm font-semibold">Free Gifts Awaits You!</p>
            <p className="text-xs">Upgrade your account</p>
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-warning-600 hover:bg-warning-50 transition-all"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default SellerSidebar;