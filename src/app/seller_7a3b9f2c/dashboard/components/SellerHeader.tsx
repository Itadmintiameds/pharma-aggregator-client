"use client";

import React, { useState, useEffect, useRef } from "react"; 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User, Settings, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { IoSearchSharp } from "react-icons/io5";
import Image from "next/image";
import { DashboardView } from "@/src/types/seller/dashboard";
import { sellerAuthService } from "@/src/services/seller/authService";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService"; 
import { SellerProfile } from "@/src/types/seller/SellerProfileData"; 

interface SellerHeaderProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
}

const SellerHeader = ({ currentView, setCurrentView }: SellerHeaderProps) => {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<SellerProfile | null>(null); 
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); 

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const inventoryAlerts = {
    lowStock: 5,
    nearingExpiry: 3,
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]); 

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showUserMenu, showNotifications]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profileData = await sellerProfileService.getCurrentSellerProfile();
        setProfile(profileData);
        console.log('✅ Profile loaded in header:', profileData.sellerName);
      } catch (error) {
        console.error('❌ Failed to load profile in header:', error);
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
      setShowUserMenu(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
    }
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    setCurrentView("profile");
  };

  const companyDisplay = profile?.sellerName
    ? `${profile.sellerName}`
    : "Official Store";

  const coordinatorName = profile?.coordinator?.name || null;

  return (
    <header
      style={{
        background: 'var(--Colors-Shades-white, white)',
        borderBottom: '1px var(--Colors-Primary-Neutral-pneutral-100, #EAEAE9) solid',
      }}
      className="fixed top-0 left-64 right-0 z-40"
    >
      <div
        style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}
        className="flex items-center justify-between"
      >

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="w-full">
            <div
              style={{
                height: 48,
                minHeight: 48,
                background: 'var(--Colors-Primary-Neutral-pneutral-50, #F9F9F8)',
                borderRadius: 8,
                outline: '1px var(--Colors-Primary-Neutral-pneutral-100, #EAEAE9) solid',
                outlineOffset: '-1px',
              }}
              className="flex items-center"
            >
              <div
                style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10 }}
                className="flex items-center gap-2 w-full"
              >
                <IoSearchSharp
                  size={20}
                  style={{ color: 'var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)', flexShrink: 0 }}
                />
                <input
                  type="text"
                  placeholder="Search by molecule, Brand or therapeutic area"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    color: 'var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)',
                    fontSize: 14,
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 300,
                    lineHeight: '20px',
                    wordWrap: 'break-word',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                  }}
                  className="placeholder:text-[#969793]"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Icons & User Menu */}
        <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex' }}>
          <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'flex' }}>

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notificationsRef}> 
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ width: 26, height: 26, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={20} style={{ color: 'var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)' }} />
              <span
                style={{
                  width: 6,
                  height: 6,
                  left: 15,
                  top: 3,
                  position: 'absolute',
                  background: 'var(--Colors-Warning-warning-500, #FF3B3B)',
                  borderRadius: 9999,
                }}
              />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-neutral-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <h3
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)',
                    }}
                  >
                    Inventory Alerts
                  </h3>
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

          {/* User Menu */}
          <div style={{ position: 'relative' }} ref={userMenuRef}> 
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              disabled={isLoggingOut}
              style={{ justifyContent: 'flex-start', alignItems: 'center', display: 'flex' }}
            >
              {/* Name & Coordinator */}
              <div
                style={{
                  height: 35,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  display: 'inline-flex',
                }}
              >
                <div
                  style={{
                    width: 119,
                    height: 17,
                    textAlign: 'center',
                    color: 'var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)',
                    fontSize: 12,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 700,
                    lineHeight: '18.5px',
                    wordWrap: 'break-word',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isLoadingProfile ? "Loading..." : companyDisplay}
                </div>
                <div
                  style={{
                    width: 79,
                    height: 15,
                    textAlign: 'center',
                    color: 'var(--Colors-Primary-Neutral-pneutral-500, #969793)',
                    fontSize: 10,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    lineHeight: '14px',
                    wordWrap: 'break-word',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isLoadingProfile ? "" : (coordinatorName || "Change Seller")}
                </div>
              </div>

              {/* Avatar + Chevron */}
              <div style={{ justifyContent: 'flex-start', alignItems: 'center', display: 'flex' }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <Image
                    src="/assets/images/sellerprofile.png"
                    alt="User avatar"
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Chevron — matches spec: 24×24 container, chevron shape */}
                <div style={{ width: 24, height: 24, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--Colors-Primary-Neutral-pneutral-900, #1E1E1D)',
                      transition: 'transform 0.2s',
                      transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </div>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-50">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setCurrentView("profile");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <div className="border-t border-neutral-100 my-1"></div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors ${
                    isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <LogOut size={16} />
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            )}
          </div>
          </div>{/* end inner flex */}
        </div>{/* end right section */}
      </div>
    </header>
  );
};

export default SellerHeader;





















// "use client";

// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Bell, ChevronDown, LogOut, User, Settings, AlertCircle } from "lucide-react";
// import toast from "react-hot-toast";
// import { IoSearchSharp } from "react-icons/io5";
// import Image from "next/image";
// import { DashboardView } from "@/src/types/seller/dashboard";
// import { sellerAuthService } from "@/src/services/seller/authService";
// import { sellerProfileService } from "@/src/services/seller/sellerProfileService"; 
// import { SellerProfile } from "@/src/types/seller/SellerProfileData"; 

// interface SellerHeaderProps {
//   currentView: DashboardView;
//   setCurrentView: (view: DashboardView) => void;
// }

// const SellerHeader = ({ currentView, setCurrentView }: SellerHeaderProps) => {
//   const router = useRouter();
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [profile, setProfile] = useState<SellerProfile | null>(null); 
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true); 

//   // Mock inventory alerts
//   const inventoryAlerts = {
//     lowStock: 5,
//     nearingExpiry: 3,
//   };

//   // ADD THIS EFFECT TO FETCH PROFILE
//   useEffect(() => {
//     const loadProfile = async () => {
//       try {
//         setIsLoadingProfile(true);
//         const profileData = await sellerProfileService.getCurrentSellerProfile();
//         setProfile(profileData);
//         console.log('✅ Profile loaded in header:', profileData.sellerName);
//       } catch (error) {
//         console.error('❌ Failed to load profile in header:', error);
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
//       // Show loading toast
//       toast.loading("Logging out...", { id: "logout" });
      
//       // Call the auth service logout
//       await sellerAuthService.logout(false); 
      
//       // Show success message
//       toast.success("Logged out successfully", { id: "logout" });
      
//       // Redirect to home with login modal
//       router.push("/?showLogin=true");
//     } catch (error) {
//       console.error("Logout error:", error);
//       toast.error("Error logging out", { id: "logout" });
      
//       // Even if error, clear local and redirect
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

//   const handleProfileClick = () => {
//     setShowUserMenu(false);
//     setCurrentView("profile");
//   };

//   // Get user data from auth service
//   // const user = sellerAuthService.getCurrentUser();

//   // Get display name and company info from profile
//   // const displayName = profile?.coordinator?.name || user?.username || "Seller";
//   const companyDisplay = profile?.sellerName || "Company";

//   return (
//     <header className="fixed top-0 left-64 right-0 bg-base-white border-b border-neutral-100 z-40">
//       <div className="flex items-center justify-between px-6 py-3">

//         {/* Search Bar */}
//         <div className="flex-1 max-w-xl mx-4">
//           <form onSubmit={handleSearch} className="w-full">
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search by molecule, Brand or therapeutic area"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full px-5 py-3 pl-12 pr-4 rounded-lg bg-neutral-100 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base placeholder:text-neutral-700"
//               />
//               <IoSearchSharp size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500" />
//             </div>
//           </form>
//         </div>

//         {/* Right Icons & User Menu */}
//         <div className="flex items-center gap-4">
//           {/* Notifications with Inventory Alerts */}
//           <div className="relative">
//             <button 
//               className="relative"
//               onClick={() => setShowNotifications(!showNotifications)}
//             >
//               <Bell size={20} className="text-neutral-600" />
//               <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning-500 text-white text-xs rounded-full flex items-center justify-center">
//                 {inventoryAlerts.lowStock + inventoryAlerts.nearingExpiry}
//               </span>
//             </button>

//             {/* Notifications Dropdown */}
//             {showNotifications && (
//               <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-neutral-100 py-2 z-50">
//                 <div className="px-4 py-2 border-b border-neutral-100">
//                   <h3 className="text-sm font-semibold text-neutral-900">Inventory Alerts</h3>
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
//                   <Link 
//                     href="/seller_7a3b9f2c/dashboard?view=inventory"
//                     className="text-xs text-primary-700 hover:underline"
//                   >
//                     View all inventory alerts →
//                   </Link>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* User Menu with Dropdown */}
//           <div className="relative">
//             <button
//               onClick={() => setShowUserMenu(!showUserMenu)}
//               className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors"
//               disabled={isLoggingOut}
//             >
//               <div className="text-left">
//                 <p className="text-sm font-medium text-neutral-900">
//                   {isLoadingProfile ? "Loading..." : companyDisplay}
//                 </p>
//                 {/* <p className="text-xs text-neutral-500">
//                   {isLoadingProfile ? "Loading..." : companyDisplay}
//                 </p> */}
//               </div>
//               <div className="w-8 h-8 rounded-md overflow-hidden shrink-0">
//                 <Image
//                   src="/assets/images/sellerprofile.png"
//                   alt="User avatar"
//                   width={32}
//                   height={32}
//                   className="object-cover w-full h-full"
//                 />
//               </div>
              
//               <ChevronDown size={16} className={`text-neutral-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
//             </button>

//             {/* User Dropdown Menu */}
//             {showUserMenu && (
//               <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-50">
//                 <button
//                   onClick={handleProfileClick}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
//                 >
//                   <User size={16} />
//                   <span>My Profile</span>
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowUserMenu(false);
//                     setCurrentView("profile");
//                   }}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
//                 >
//                   <Settings size={16} />
//                   <span>Settings</span>
//                 </button>
//                 <div className="border-t border-neutral-100 my-1"></div>
//                 <button
//                   onClick={() => {
//                     setShowUserMenu(false);
//                     handleLogout();
//                   }}
//                   disabled={isLoggingOut}
//                   className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors ${
//                     isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
//                   }`}
//                 >
//                   <LogOut size={16} />
//                   <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
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











































// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Bell, ChevronDown, LogOut, User, Settings, AlertCircle } from "lucide-react";
// import toast from "react-hot-toast";
// import { IoSearchSharp } from "react-icons/io5";
// import Image from "next/image";
// import { DashboardView } from "@/src/types/seller/dashboard";

// interface SellerHeaderProps {
//   currentView: DashboardView;
//   setCurrentView: (view: DashboardView) => void;
// }

// const SellerHeader = ({ currentView, setCurrentView }: SellerHeaderProps) => {
//   const router = useRouter();
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   // Mock inventory alerts
//   const inventoryAlerts = {
//     lowStock: 5,
//     nearingExpiry: 3,
//   };

//   const handleLogout = () => {
//     // Clear any auth tokens/session here
//     toast.success("Logged out successfully");
//     router.push("/");
//   };

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     // Handle search logic here
//     if (searchQuery.trim()) {
//       toast.success(`Searching for: ${searchQuery}`);
//       // navigate to search results or filter products
//       // router.push(`/seller_7a3b9f2c/dashboard?search=${encodeURIComponent(searchQuery)}`);
//     }
//   };

//   const handleProfileClick = () => {
//     setShowUserMenu(false);
//     setCurrentView("profile");
//   };

//   return (
//     <header className="fixed top-0 left-64 right-0 bg-base-white border-b border-neutral-100 z-40">
//       <div className="flex items-center justify-between px-6 py-3">

//         {/* Search Bar */}
//         <div className="flex-1  max-w-xl mx-4">
//           <form onSubmit={handleSearch} className="w-full">
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search by molecule, Brand or therapeutic area"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full px-5 py-3 pl-12 pr-4 rounded-lg bg-neutral-100 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base placeholder:text-neutral-700"
//               />
//               <IoSearchSharp size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2" />
//             </div>
//           </form>
//         </div>

//         {/* Add Product Button */}
//         {/* <div className="flex items-center gap-4 mr-4">
//           <button
//             onClick={() => setCurrentView("addProduct")}
//             className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
//               currentView === "addProduct"
//                 ? "bg-primary-900 text-white"
//                 : "bg-primary-05 text-primary-900 hover:bg-primary-10"
//             }`}
//           >
//             + Add New Product
//           </button>
//         </div> */}

//         {/* View Product and Delete Product - Commented out for future use */}
//         {/* 
//           <button
//             onClick={() => setCurrentView("viewProducts")}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
//               currentView === "viewProducts"
//                 ? "bg-primary-900 text-white"
//                 : "bg-primary-05 text-primary-900 hover:bg-primary-10"
//             }`}
//           >
//             View Product
//           </button>

//           <button
//             onClick={() => setCurrentView("deleteProduct")}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
//               currentView === "deleteProduct"
//                 ? "bg-primary-900 text-white"
//                 : "bg-primary-05 text-primary-900 hover:bg-primary-10"
//             }`}
//           >
//             Delete Product
//           </button>
//         */}

//         {/* Right Icons & User Menu */}
//         <div className="flex items-center gap-4">
//           {/* Notifications with Inventory Alerts */}
//           <div className="relative">
//             <button 
//               className="relative"
//               onClick={() => setShowNotifications(!showNotifications)}
//             >
//               <Bell size={20} className="text-neutral-600" />
//               <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning-500 text-white text-xs rounded-full flex items-center justify-center">
//                 {inventoryAlerts.lowStock + inventoryAlerts.nearingExpiry}
//               </span>
//             </button>

//             {/* Notifications Dropdown */}
//             {showNotifications && (
//               <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-neutral-100 py-2 z-50">
//                 <div className="px-4 py-2 border-b border-neutral-100">
//                   <h3 className="text-sm font-semibold text-neutral-900">Inventory Alerts</h3>
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
//                   <Link 
//                     href="/seller_7a3b9f2c/dashboard?view=inventory"
//                     className="text-xs text-primary-700 hover:underline"
//                   >
//                     View all inventory alerts →
//                   </Link>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* User Menu with Dropdown */}
//           <div className="relative">
//             <button
//               onClick={() => setShowUserMenu(!showUserMenu)}
//               className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-colors"
//             >
//               <div className="text-left">
//                 <p className="text-sm font-medium text-neutral-900">Sunny</p>
//                <p className="text-xs text-neutral-500">ABCD pvt ltd.</p>
//              </div>
//               <div className="w-8 h-8 rounded-md overflow-hidden shrink-0">
//                 <Image
//                   src="/assets/images/sellerprofile.png"
//                   alt="User avatar"
//                   width={32}
//                   height={32}
//                   className="object-cover w-full h-full"
//                 />
//               </div>
              
//               <ChevronDown size={16} className={`text-neutral-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
//             </button>

//             {/* User Dropdown Menu */}
//             {showUserMenu && (
//               <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-50">
//                  <button
//                   onClick={handleProfileClick}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
//                 >
//                   <User size={16} />
//                   <span>My Profile</span>
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowUserMenu(false);
//                     // Handle settings click - since "settings" is not in DashboardView, we'll use "profile" or another valid view
//                     setCurrentView("profile"); // or you can remove this button if settings view doesn't exist
//                   }}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-primary-05 transition-colors"
//                 >
//                   <Settings size={16} />
//                   <span>Settings</span>
//                 </button>
//                 <div className="border-t border-neutral-100 my-1"></div>
//                 <button
//                   onClick={() => {
//                     setShowUserMenu(false);
//                     handleLogout();
//                   }}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors"
//                 >
//                   <LogOut size={16} />
//                   <span>Logout</span>
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