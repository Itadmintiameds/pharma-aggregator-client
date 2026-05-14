"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SellerSidebar from "./dashboard/components/SellerSidebar";
import SellerHeader from "./dashboard/components/SellerHeader";
import { sellerAuthService } from "@/src/services/seller/authService";

import toast from "react-hot-toast";
import LogoutConfirmationModal from "./dashboard/components/LogoutConfirmationModal";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const hasPushedState = useRef(false);

  useEffect(() => {
    console.log("=========================================");
    console.log("🏪 SELLER LAYOUT INITIALIZED");
    console.log("📍 Current pathname:", pathname);
    
    const token = localStorage.getItem('token');
    const isAuthenticated = sellerAuthService.isAuthenticated();
    
    if (!token || !isAuthenticated) {
      console.log("❌ Not authenticated, redirecting to login");
      router.push('/?showLogin=true');
      return;
    }
    console.log("✅ User authenticated");
  }, [pathname, router]);


useEffect(() => {
  const isDashboardHome =
    pathname === "/seller_7a3b9f2c/dashboard";

  if (!isDashboardHome) {
    hasPushedState.current = false;
    return;
  }

  if (!hasPushedState.current) {
    window.history.pushState(
      { dashboardProtected: true },
      "",
      window.location.href
    );

    hasPushedState.current = true;
  }

  const onBackButton = () => {
    setShowLogoutModal(true);

    window.history.pushState(
      { dashboardProtected: true },
      "",
      window.location.href
    );
  };

  const timeout = setTimeout(() => {
    window.addEventListener("popstate", onBackButton);
  }, 0);

  return () => {
    clearTimeout(timeout);

    window.removeEventListener(
      "popstate",
      onBackButton
    );
  };
}, [pathname]);

const handleConfirmLogout = () => {
  setShowLogoutModal(false);

  sellerAuthService.clearAuth();

  toast.success("Logged out successfully");

  router.replace("/?showLogin=true");
};

const handleCancelLogout = () => {
  setShowLogoutModal(false);
};

  const getCurrentView = (path: string) => {
    if (path.includes("/products")) return "product";
    if (path.includes("/profile")) return "profile";
    if (path.includes("/reports")) return "reports";
    return "overview";
  };

  const currentView = getCurrentView(pathname) as any;
  return (
    <div className="min-h-screen bg-gray-50">
      <SellerSidebar
        currentView={currentView}
        setCurrentView={() => {}}
      />
      <SellerHeader
        currentView={currentView}
        setCurrentView={() => {}}
      />
      <main className="ml-64 mt-16 p-6">
        {children}
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
      
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}




// code without back navigation dated 14.05.2026

// "use client";

// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import SellerSidebar from "./dashboard/components/SellerSidebar";
// import SellerHeader from "./dashboard/components/SellerHeader";
// import { usePathname } from "next/navigation";

// export default function SellerLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();

//   const getCurrentView = (path: string) => {
//     if (path.includes("/products")) return "product";
//     if (path.includes("/profile")) return "profile";
//     if (path.includes("/reports")) return "reports";
//     return "overview";
//   };

//   const currentView = getCurrentView(pathname) as any;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <SellerSidebar
//         currentView={currentView}
//         setCurrentView={() => {}}
//       />
//       <SellerHeader
//         currentView={currentView}
//         setCurrentView={() => {}}
//       />
//       <main className="ml-64 mt-16 p-6">
//         {children}
//       </main>
//       <ToastContainer
//         position="top-right"
//         autoClose={3000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="light"
//         style={{ zIndex: 9999 }}
//       />
//     </div>
//   );
// }