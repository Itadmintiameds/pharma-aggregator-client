"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User, Settings, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface SellerHeaderProps {
  currentView: string;
  setCurrentView: (view: "addProduct" | "viewProducts" | "deleteProduct") => void;
}

const SellerHeader = ({ currentView, setCurrentView }: SellerHeaderProps) => {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock inventory alerts
  const inventoryAlerts = {
    lowStock: 5,
    nearingExpiry: 3,
  };

  const handleLogout = () => {
    // Clear any auth tokens/session here
    toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-base-white border-b border-neutral-100 z-40">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/seller_7a3b9f2c/dashboard" className="flex items-center">
          <Image
            src="/assets/images/tiameds.logo.png"
            alt="TiaMeds"
            width={120}
            height={40}
            className="object-contain"
          />
        </Link>

        {/* Top Navigation Options */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView("addProduct")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === "addProduct"
                ? "bg-primary-900 text-white"
                : "bg-primary-05 text-primary-900 hover:bg-primary-10"
            }`}
          >
            Add New Product
          </button>

          <button
            onClick={() => setCurrentView("viewProducts")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === "viewProducts"
                ? "bg-primary-900 text-white"
                : "bg-primary-05 text-primary-900 hover:bg-primary-10"
            }`}
          >
            View Product
          </button>

          <button
            onClick={() => setCurrentView("deleteProduct")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === "deleteProduct"
                ? "bg-primary-900 text-white"
                : "bg-primary-05 text-primary-900 hover:bg-primary-10"
            }`}
          >
            Delete Product
          </button>
        </div>

        {/* Right Icons & User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications with Inventory Alerts */}
          <div className="relative">
            <button 
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} className="text-neutral-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning-500 text-white text-xs rounded-full flex items-center justify-center">
                {inventoryAlerts.lowStock + inventoryAlerts.nearingExpiry}
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-neutral-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <h3 className="text-sm font-semibold text-neutral-900">Inventory Alerts</h3>
                </div>
                <div className="p-3">
                  <div className="flex items-start gap-2 mb-2 p-2 hover:bg-warning-50 rounded">
                    <AlertCircle size={16} className="text-warning-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-800">{inventoryAlerts.lowStock} products running low on stock</p>
                      <p className="text-xs text-neutral-500 mt-1">Reorder soon to avoid stockout</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 hover:bg-warning-50 rounded">
                    <AlertCircle size={16} className="text-warning-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-800">{inventoryAlerts.nearingExpiry} products nearing expiry</p>
                      <p className="text-xs text-neutral-500 mt-1">Check expiry dates and take action</p>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-neutral-100">
                  <Link 
                    href="/seller_7a3b9f2c/dashboard?view=inventory"
                    className="text-xs text-primary-700 hover:underline"
                  >
                    View all inventory alerts →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-900 font-semibold">S</span>
              </div>
              {/* <div className="text-left">
                <p className="text-sm font-medium text-neutral-900">Seller Name</p>
                <p className="text-xs text-neutral-500">seller@company.com</p>
              </div> */}
              <ChevronDown size={16} className={`text-neutral-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-50">
                <Link
                  href="/seller_7a3b9f2c/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/seller_7a3b9f2c/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <div className="border-t border-neutral-100 my-1"></div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;





// "use client";

// import React from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { Bell, ChevronDown } from "lucide-react";

// interface SellerHeaderProps {
//   currentView: string;
//   setCurrentView: (view: "addProduct" | "viewProducts" | "deleteProduct") => void;
// }

// const SellerHeader = ({ currentView, setCurrentView }: SellerHeaderProps) => {
//   return (
//     <header className="fixed top-0 left-0 right-0 bg-base-white border-b border-neutral-100 z-40">
//       <div className="flex items-center justify-between px-6 py-3">
//         {/* Logo */}
//         <Link href="/seller_7a3b9f2c/dashboard" className="flex items-center">
//           <Image
//             src="/assets/images/tiameds.logo.png"
//             alt="TiaMeds"
//             width={120}
//             height={40}
//             className="object-contain"
//           />
//         </Link>

//         {/* Top Navigation Options */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => setCurrentView("addProduct")}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//               currentView === "addProduct"
//                 ? "bg-primary-900 text-white"
//                 : "bg-primary-05 text-primary-900 hover:bg-primary-10"
//             }`}
//           >
//             Add New Product
//           </button>

//           <button
//             onClick={() => setCurrentView("viewProducts")}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//               currentView === "viewProducts"
//                 ? "bg-primary-900 text-white"
//                 : "bg-primary-05 text-primary-900 hover:bg-primary-10"
//             }`}
//           >
//             View Product
//           </button>

//           <button
//             onClick={() => setCurrentView("deleteProduct")}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//               currentView === "deleteProduct"
//                 ? "bg-primary-900 text-white"
//                 : "bg-primary-05 text-primary-900 hover:bg-primary-10"
//             }`}
//           >
//             Delete Product
//           </button>
//         </div>

//         {/* User Menu */}
//         <div className="flex items-center gap-4">
//           <button className="relative">
//             <Bell size={20} className="text-neutral-600" />
//             <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning-500 text-white text-xs rounded-full flex items-center justify-center">
//               3
//             </span>
//           </button>

//           <div className="flex items-center gap-2 cursor-pointer">
//             <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
//               <span className="text-primary-900 font-semibold">S</span>
//             </div>
//             <div>
//               <p className="text-sm font-medium text-neutral-900">Seller Name</p>
//               <p className="text-xs text-neutral-500">seller@company.com</p>
//             </div>
//             <ChevronDown size={16} className="text-neutral-500" />
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default SellerHeader;