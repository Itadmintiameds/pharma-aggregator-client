"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { id: "overview",  label: "Overview",    icon: <LayoutDashboard size={22} /> },
    { id: "product",   label: "Products",    icon: <Package size={22} /> },
    { id: "orders",    label: "Orders",      icon: <HiOutlineShoppingBag size={22} /> },
    { id: "rfqs",      label: "Conversions", icon: <AiOutlinePieChart size={22} /> },
    { id: "settings",  label: "Settings",    icon: <IoSettingsOutline size={22} /> },
    { id: "shipment",  label: "Shipment",    icon: <MdOutlineLocalShipping size={22} /> },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      toast.loading("Logging out...", { id: "logout" });
      await sellerAuthService.logout(false);
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

  const handleMenuClick = (itemId: string) => {
    if (itemId === "overview") setCurrentView("overview");
    else if (itemId === "product") setCurrentView("product");
    else if (itemId === "reports") setCurrentView("reports");
    else if (itemId === "profile") setCurrentView("profile");
  };

  const isActive = (itemId: string) =>
    (itemId === "product"  && currentView === "product")  ||
    (itemId === "overview" && currentView === "overview") ||
    (itemId === "reports"  && currentView === "reports")  ||
    (itemId === "profile"  && currentView === "profile");

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-64 bg-white flex flex-col"
      style={{ boxShadow: "2px 0px 12px rgba(0,0,0,0.06)" }}
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-6">
        <Link href="/seller_7a3b9f2c/dashboard">
          <Image
            src="/assets/images/tiameds.logo2.png"
            alt="TiaMeds"
            width={170}
            height={58}
            className="object-contain"
          />
        </Link>
      </div>

      {/* ── Nav items ────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-1">
        {menuItems.map((item) => {
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
              style={{
                background: active ? "#9F75FC" : "transparent",
                color: active ? "#FFFFFF" : "#1E1E1D",
                fontFamily: "Open Sans, sans-serif",
                fontSize: 15,
                fontWeight: 400,
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#F4F0FF";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <span style={{ opacity: active ? 1 : 0.75, display: "flex", flexShrink: 0 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Bottom section ───────────────────────────── */}
      <div className="px-4 pb-6 flex flex-col gap-3">

        {/* Help & Support */}
        <button
          onClick={handleHelpSupport}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors"
          style={{
            background: "#EAEAE9",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: "#1E1E1D",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#DDDDD9"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EAEAE9"; }}
        >
          <PiHeadphones size={22} style={{ flexShrink: 0 }} />
          <span>Help &amp; Support</span>
        </button>

        {/* Free Gift */}
        <button
          onClick={handleUpgrade}
          className="w-full rounded-2xl px-4 pt-4 pb-3 transition-colors text-left"
          style={{
            background: "#FFEEB8",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFE59E"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFEEB8"; }}
        >
          {/* Title row */}
          <div className="flex items-center gap-3 mb-2">
            <Gift size={22} color="#1E1E1D" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 400, color: "#1E1E1D" }}>
              Free Gift Awaits You!
            </span>
          </div>
          {/* Subtitle row */}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, fontWeight: 400, color: "#5A5B58" }}>
              Upgrade your account
            </span>
            <ChevronRight size={16} color="#5A5B58" />
          </div>
        </button>

        {/* Logout — narrow pill, not full width */}
        <div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl transition-colors"
            style={{
              background: "#FDEBEB",
              border: "none",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              opacity: isLoggingOut ? 0.5 : 1,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: "#FF3B3B",
            }}
            onMouseEnter={(e) => { if (!isLoggingOut) (e.currentTarget as HTMLButtonElement).style.background = "#FCD5D5"; }}
            onMouseLeave={(e) => { if (!isLoggingOut) (e.currentTarget as HTMLButtonElement).style.background = "#FDEBEB"; }}
          >
            <LogOut size={20} color="#FF3B3B" style={{ flexShrink: 0 }} />
            <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>
          </button>
        </div>

      </div>
    </aside>
  );
};

export default SellerSidebar;











// "use client";

// import React from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import Link from "next/link";
// import { 
//   LayoutDashboard, 
//   LogOut,
//   Package,
//   Gift
// } from "lucide-react";
// import toast from "react-hot-toast";
// import { HiOutlineShoppingBag } from "react-icons/hi";
// import { AiOutlinePieChart } from "react-icons/ai";
// import { IoSettingsOutline } from "react-icons/io5";
// import { MdOutlineLocalShipping } from "react-icons/md";
// import { PiHeadphones } from "react-icons/pi";
// import { DashboardView } from "@/src/types/seller/dashboard";

// interface SellerSidebarProps {
//   currentView: DashboardView;
//   setCurrentView: (view: DashboardView) => void;
// }

// const SellerSidebar = ({ currentView, setCurrentView }: SellerSidebarProps) => {
//   const router = useRouter();

//   const menuItems = [
//     {
//       id: "overview",
//       label: "Overview",
//       icon: <LayoutDashboard size={20} />,
//     },
//     {
//       id: "product",
//       label: "Product",
//       icon: <Package size={20} />,
//     },
//     {
//       id: "orders",
//       label: "Orders",
//       icon: <HiOutlineShoppingBag size={20} />,
//     },
//     {
//       id: "rfqs",
//       label: "RFQs",
//       icon: <AiOutlinePieChart size={20} />,
//     },
//     {
//       id: "settings",
//       label: "Settings",
//       icon: <IoSettingsOutline size={20} />,
//     },
//     {
//       id: "shipment",
//       label: "Shipment",
//       icon: <MdOutlineLocalShipping size={20} />,
//     },
//     // {
//     //   id: "reports",
//     //   label: "Reports",
//     //   icon: <FileText size={20} />,
//     // },
//   ];

//   const handleLogout = () => {
//     toast.success("Logged out successfully");
//     router.push("/");
//   };

//   const handleHelpSupport = () => {
//     toast.success("Help & Support clicked");
//   };

//   const handleUpgrade = () => {
//     toast.success("Upgrade account clicked");
//   };

//   const handleMenuClick = (itemId: string) => {
//     if (itemId === "overview") {
//       setCurrentView("overview");
//     } else if (itemId === "product") {
//       setCurrentView("product");
//     } else if (itemId === "reports") {
//       setCurrentView("reports");
//     } else if (itemId === "profile") {
//       setCurrentView("profile");
//     }
//     // Handle other menu items as needed
//   };

//   return (
//     <aside className="fixed left-0 top-0 bottom-0 w-64 bg-base-white border-r border-neutral-100 flex flex-col">
//       {/* Logo at the top of sidebar */}
//       <div className="p-4 border-b border-white">
//         <Link href="/seller_7a3b9f2c/dashboard" className="flex items-center justify-center">
//           <Image
//             src="/assets/images/tiameds.logo.png"
//             alt="TiaMeds"
//             width={180}
//             height={84}
//             className="object-contain"
//           />
//         </Link>
//       </div>

//       {/* Navigation Menu - with scroll if needed */}
//       <nav className="flex-1 overflow-y-auto p-4 space-y-2">
//         {menuItems.map((item) => (
//           <button
//             key={item.id}
//             onClick={() => handleMenuClick(item.id)}
//             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
//               (item.id === "product" && currentView === "product") || 
//               (item.id === "overview" && currentView === "overview") ||
//               (item.id === "reports" && currentView === "reports") ||
//               (item.id === "profile" && currentView === "profile")
//                 ? "bg-primary-900 text-white"
//                 : "text-neutral-600 hover:bg-primary-05 hover:text-primary-900"
//             }`}
//           >
//             {item.icon}
//             <span>{item.label}</span>
//           </button>
//         ))}
//       </nav>

//       {/* Bottom Section */}
//       <div className="p-4 border-t border-white space-y-2">
//         {/* Help & Support Button */}
//         <button
//           onClick={handleHelpSupport}
//           className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#5E63661A] text-sm font-medium text-black hover:bg-primary-05 hover:text-primary-900 transition-all"
//         >
//           <PiHeadphones size={20} />
//           <span>Help & Support</span>
//         </button>

//         {/* Free Gifts/Upgrade Banner */}
//         <button
//           onClick={handleUpgrade}
//           className="w-full text-black flex items-start gap-3 px-4 py-3 rounded-lg bg-[#FFCC9133] hover:bg-primary-05 hover:text-primary-900 transition-all"
//         >
//           <Gift size={20} className="shrink-0 mt-0.5" />
//           <div className="text-left">
//             <p className="text-sm font-semibold">Free Gifts Awaits You!</p>
//             <p className="text-xs">Upgrade your account</p>
//           </div>
//         </button>

//         {/* Logout Button */}
//         <button
//           onClick={handleLogout}
//           className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-warning-600 hover:bg-warning-50 transition-all"
//         >
//           <LogOut size={20} />
//           <span>Logout</span>
//         </button>
//       </div>
//     </aside>
//   );
// };

// export default SellerSidebar;