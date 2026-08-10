"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { sellerAuthService } from "@/src/services/seller/authService";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { SellerProfile } from "@/src/types/seller/SellerProfileData";

// Keep props for backward compat but ignore setCurrentView
interface SellerHeaderProps {
  currentView?: string;
  setCurrentView?: (view: any) => void;
  // While the seller isn't yet approved, My Profile/Settings are disabled —
  // same admin-approval gate as the sidebar (see OnboardingGate). Defaults
  // to true so this behaves as before wherever it isn't passed.
  approved?: boolean;
}

const SellerHeader = ({ currentView, setCurrentView, approved = true }: SellerHeaderProps) => {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener("keydown", handleEscKey);
    }
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [showUserMenu]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profileData = await sellerProfileService.getCurrentSellerProfile();
        setProfile(profileData);
      } catch (error) {
        console.error("Failed to load profile in header:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      toast.loading("Logging out...", { id: "logout" });
      const refreshToken = localStorage.getItem('refreshToken');
      await sellerAuthService.logout(refreshToken || undefined);
      toast.success("Logged out successfully", { id: "logout" });
      router.push("/?showLogin=true");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out", { id: "logout" });
      sellerAuthService.clearAuth();
      router.push("/?showLogin=true");
    } finally {
      setIsLoggingOut(false);
      setShowUserMenu(false);
    }
  };

  const companyDisplay = profile?.sellerName ?? "Official Store";
  const coordinatorName = profile?.coordinator?.name ?? null;

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
        {/* Logo */}
        <Link href="/seller_7a3b9f2c/dashboard">
          <Image
            src="/assets/images/tiameds.logo2.png"
            alt="TiaMeds"
            width={145}
            height={50}
            className="object-contain"
          />
        </Link>

        {/* Right section: user */}
        <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 16, display: "flex" }}>

          {/* User Menu */}
          <div style={{ position: "relative" }} ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              disabled={isLoggingOut}
              style={{ justifyContent: "flex-start", alignItems: "flex-end", display: "flex" }}
            >
              <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 4, display: "flex" }}>
                <div style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-end", display: "inline-flex" }}>
                  <div style={{ textAlign: "center", color: "#4B465C", fontSize: 14, fontFamily: "Work Sans, sans-serif", fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                    {isLoadingProfile ? "Loading..." : companyDisplay}
                  </div>
                  <div style={{ textAlign: "center", color: "#979797", fontSize: 12, fontFamily: "Work Sans, sans-serif", fontWeight: 400, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                    {isLoadingProfile ? "" : (coordinatorName || "Change Seller")}
                  </div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                  <Image src="/assets/images/sellerprofile.png" alt="User avatar" width={36} height={36} className="object-cover w-full h-full" />
                </div>
              </div>
              <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronDown size={12} style={{ color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)", transition: "transform 0.2s", transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)" }} />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-50">
                <button
                  onClick={() => { if (!approved) return; setShowUserMenu(false); router.push("/seller_7a3b9f2c/profile"); }}
                  disabled={!approved}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors ${approved ? "hover:bg-primary-05" : "opacity-40 cursor-not-allowed"}`}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => { if (!approved) return; setShowUserMenu(false); router.push("/seller_7a3b9f2c/settings"); }}
                  disabled={!approved}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors ${approved ? "hover:bg-primary-05" : "opacity-40 cursor-not-allowed"}`}
                >
                  <Settings size={16} />
                  <span>Settings</span>
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
};

export default SellerHeader;









// before adding refresh token .............

// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Bell, ChevronDown, LogOut, User, Settings, AlertCircle } from "lucide-react";
// import toast from "react-hot-toast";
// import { IoSearchSharp } from "react-icons/io5";
// import Image from "next/image";
// import { sellerAuthService } from "@/src/services/seller/authService";
// import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
// import { SellerProfile } from "@/src/types/seller/SellerProfileData";

// // Keep props for backward compat but ignore setCurrentView
// interface SellerHeaderProps {
//   currentView?: string;
//   setCurrentView?: (view: any) => void;
// }

// const SellerHeader = ({ currentView, setCurrentView }: SellerHeaderProps) => {
//   const router = useRouter();
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [profile, setProfile] = useState<SellerProfile | null>(null);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true);

//   const userMenuRef = useRef<HTMLDivElement>(null);
//   const notificationsRef = useRef<HTMLDivElement>(null);

//   const inventoryAlerts = { lowStock: 5, nearingExpiry: 3 };

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
//         setShowUserMenu(false);
//       }
//       if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
//         setShowNotifications(false);
//       }
//     };
//     if (showUserMenu || showNotifications) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [showUserMenu, showNotifications]);

//   useEffect(() => {
//     const handleEscKey = (event: KeyboardEvent) => {
//       if (event.key === "Escape") {
//         setShowUserMenu(false);
//         setShowNotifications(false);
//       }
//     };
//     if (showUserMenu || showNotifications) {
//       document.addEventListener("keydown", handleEscKey);
//     }
//     return () => document.removeEventListener("keydown", handleEscKey);
//   }, [showUserMenu, showNotifications]);

//   useEffect(() => {
//     const loadProfile = async () => {
//       try {
//         setIsLoadingProfile(true);
//         const profileData = await sellerProfileService.getCurrentSellerProfile();
//         setProfile(profileData);
//       } catch (error) {
//         console.error("Failed to load profile in header:", error);
//       } finally {
//         setIsLoadingProfile(false);
//       }
//     };
//     loadProfile();
//   }, []);

//   const handleLogout = async () => {
//     if (isLoggingOut) return;
//     setIsLoggingOut(true);
//     try {
//       toast.loading("Logging out...", { id: "logout" });
//       await sellerAuthService.logout(false);
//       toast.success("Logged out successfully", { id: "logout" });
//       router.push("/?showLogin=true");
//     } catch (error) {
//       console.error("Logout error:", error);
//       toast.error("Error logging out", { id: "logout" });
//       sellerAuthService.clearAuth();
//       router.push("/?showLogin=true");
//     } finally {
//       setIsLoggingOut(false);
//       setShowUserMenu(false);
//     }
//   };

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (searchQuery.trim()) {
//       toast.success(`Searching for: ${searchQuery}`);
//     }
//   };

//   const companyDisplay = profile?.sellerName ?? "Official Store";
//   const coordinatorName = profile?.coordinator?.name ?? null;

//   return (
//     <header
//       style={{
//         background: "var(--Colors-Shades-white, white)",
//         borderBottom: "1px var(--Colors-Primary-Neutral-pneutral-100, #EAEAE9) solid",
//       }}
//       className="fixed top-0 left-0 right-0 z-50"
//     >
//       <div
//         style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 12, paddingBottom: 12 }}
//         className="flex items-end justify-between"
//       >
//         {/* Logo */}
//         <Link href="/seller_7a3b9f2c/dashboard">
//           <Image
//             src="/assets/images/tiameds.logo2.png"
//             alt="TiaMeds"
//             width={145}
//             height={50}
//             className="object-contain"
//           />
//         </Link>

//         {/* Right section: search + notifications + user */}
//         <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 16, display: "flex" }}>

//           {/* Search Bar — fixed 198px per Figma */}
//           <div style={{ width: 198 }}>
//             <form onSubmit={handleSearch}>
//               <div
//                 style={{
//                   height: 36,
//                   background: "var(--Colors-Shades-white, white)",
//                   borderRadius: 8,
//                   outline: "1.5px var(--Colors-Secondary-Neutral-Secondary-100, #E1E1E1) solid",
//                   outlineOffset: "-1.5px",
//                 }}
//                 className="flex items-center overflow-hidden"
//               >
//                 <div
//                   style={{ paddingLeft: 12, paddingRight: 12 }}
//                   className="flex items-center gap-2 w-full"
//                 >
//                   <IoSearchSharp
//                     size={16}
//                     style={{ color: "var(--Colors-Secondary-Neutral-Secondary-700, #626666)", flexShrink: 0 }}
//                   />
//                   <input
//                     type="text"
//                     placeholder="Search by molecule, Brand or therapeutic area"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     style={{
//                       color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)",
//                       fontSize: 12,
//                       fontFamily: "Work Sans, sans-serif",
//                       fontWeight: 400,
//                       lineHeight: "18px",
//                       background: "transparent",
//                       border: "none",
//                       outline: "none",
//                       width: "100%",
//                     }}
//                     className="placeholder:text-[#C0C1BE]"
//                   />
//                 </div>
//               </div>
//             </form>
//           </div>

//           {/* Notifications */}
//           <div style={{ position: "relative" }} ref={notificationsRef}>
//             <button
//               onClick={() => setShowNotifications(!showNotifications)}
//               style={{ width: 26, height: 26, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
//             >
//               <Bell size={20} style={{ color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)" }} />
//               <span
//                 style={{
//                   width: 6, height: 6, left: 15, top: 3,
//                   position: "absolute",
//                   background: "var(--Colors-Warning-warning-500, #FF3B3B)",
//                   borderRadius: 9999,
//                 }}
//               />
//             </button>
//             {showNotifications && (
//               <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-neutral-100 py-2 z-50">
//                 <div className="px-4 py-2 border-b border-neutral-100">
//                   <h3 style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 12, color: "#1E1E1D" }}>
//                     Inventory Alerts
//                   </h3>
//                 </div>
//                 <div className="p-3">
//                   <div className="flex items-start gap-2 mb-2 p-2 hover:bg-warning-50 rounded">
//                     <AlertCircle size={16} className="text-warning-600 mt-0.5" />
//                     <div>
//                       <p className="text-xs text-neutral-800">{inventoryAlerts.lowStock} products running low on stock</p>
//                       <p className="text-xs text-neutral-500 mt-1">Reorder soon to avoid stockout</p>
//                     </div>
//                   </div>
//                   <div className="flex items-start gap-2 p-2 hover:bg-warning-50 rounded">
//                     <AlertCircle size={16} className="text-warning-600 mt-0.5" />
//                     <div>
//                       <p className="text-xs text-neutral-800">{inventoryAlerts.nearingExpiry} products nearing expiry</p>
//                       <p className="text-xs text-neutral-500 mt-1">Check expiry dates and take action</p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="px-3 py-2 border-t border-neutral-100">
//                   <Link href="/seller_7a3b9f2c/dashboard" className="text-xs text-primary-700 hover:underline">
//                     View all inventory alerts →
//                   </Link>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* User Menu */}
//           <div style={{ position: "relative" }} ref={userMenuRef}>
//             <button
//               onClick={() => setShowUserMenu(!showUserMenu)}
//               disabled={isLoggingOut}
//               style={{ justifyContent: "flex-start", alignItems: "flex-end", display: "flex" }}
//             >
//               <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 4, display: "flex" }}>
//                 <div style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-end", display: "inline-flex" }}>
//                   <div style={{ textAlign: "center", color: "#4B465C", fontSize: 14, fontFamily: "Work Sans, sans-serif", fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
//                     {isLoadingProfile ? "Loading..." : companyDisplay}
//                   </div>
//                   <div style={{ textAlign: "center", color: "#979797", fontSize: 12, fontFamily: "Work Sans, sans-serif", fontWeight: 400, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
//                     {isLoadingProfile ? "" : (coordinatorName || "Change Seller")}
//                   </div>
//                 </div>
//                 <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
//                   <Image src="/assets/images/sellerprofile.png" alt="User avatar" width={36} height={36} className="object-cover w-full h-full" />
//                 </div>
//               </div>
//               <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
//                 <ChevronDown size={12} style={{ color: "var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)", transition: "transform 0.2s", transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)" }} />
//               </div>
//             </button>

//             {showUserMenu && (
//               <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-50">
//                 <button
//                   onClick={() => { setShowUserMenu(false); router.push("/seller_7a3b9f2c/profile"); }}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
//                 >
//                   <User size={16} />
//                   <span>My Profile</span>
//                 </button>
//                 <button
//                   onClick={() => { setShowUserMenu(false); router.push("/seller_7a3b9f2c/settings"); }}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
//                 >
//                   <Settings size={16} />
//                   <span>Settings</span>
//                 </button>
//                 <div className="border-t border-neutral-100 my-1"></div>
//                 <button
//                   onClick={() => { setShowUserMenu(false); handleLogout(); }}
//                   disabled={isLoggingOut}
//                   className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
//                 >
//                   <LogOut size={16} />
//                   <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
//                 </button>
//               </div>
//             )}
//           </div>

//         </div>
//       </div>
//     </header>
//   );
// };

// export default SellerHeader;