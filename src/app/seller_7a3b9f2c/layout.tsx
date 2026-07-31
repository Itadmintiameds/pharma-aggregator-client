"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SellerSidebar from "./dashboard/components/SellerSidebar";
import SellerHeader from "./dashboard/components/SellerHeader";
import { sellerAuthService } from "@/src/services/seller/authService";
import { useSessionManager } from "@/src/hooks/useSessionManager";
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
  useSessionManager();

  // Define public routes that don't require authentication
  const isPublicRoute = () => {
    // The main seller page (registration/landing) is public
    return pathname === "/seller_7a3b9f2c";
  };

  // Define protected routes that require authentication
  const isProtectedRoute = () => {
    const protectedPaths = [
      "/seller_7a3b9f2c/dashboard",
      "/seller_7a3b9f2c/products",
      "/seller_7a3b9f2c/profile",
      "/seller_7a3b9f2c/reports",
      "/seller_7a3b9f2c/orders",
      "/seller_7a3b9f2c/conversions",
      "/seller_7a3b9f2c/settings",
      "/seller_7a3b9f2c/shipment",
    ];
    return protectedPaths.some(protectedPath => pathname.startsWith(protectedPath));
  };

  useEffect(() => {
    console.log("=========================================");
    console.log("🏪 SELLER LAYOUT INITIALIZED");
    console.log("📍 Current pathname:", pathname);
    console.log("🔓 Is public route:", isPublicRoute());
    console.log("🔒 Is protected route:", isProtectedRoute());
    
    // Only check authentication for protected routes
    if (isProtectedRoute()) {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const isAuthenticated = sellerAuthService.isAuthenticated();

       console.log("🔑 Access token present:", !!accessToken);
      console.log("🔑 Refresh token present:", !!refreshToken);
      console.log("✅ isAuthenticated():", isAuthenticated);
      
      if (!accessToken || !refreshToken || !isAuthenticated) {
        console.log("❌ Not authenticated, redirecting to login");
        router.push('/?showLogin=true');
        return;
      }
      console.log("✅ User authenticated for protected route");
    } else {
      console.log("📢 Public route - no authentication required");
    }
  }, [pathname, router]);

  // Back navigation protection - ONLY for protected dashboard routes
  useEffect(() => {
    // Only apply back navigation protection on dashboard home
    const isDashboardHome = pathname === "/seller_7a3b9f2c/dashboard";
    
    // Don't apply protection on public routes
    if (isPublicRoute() || !isDashboardHome) {
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
      window.removeEventListener("popstate", onBackButton);
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
  
  // For public routes (like /seller_7a3b9f2c), render without sidebar/header
  if (isPublicRoute()) {
    return (
      <>
        {children}
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
      </>
    );
  }

  // For protected routes, render with sidebar and header
  return (
    <div className="min-h-screen bg-secondary-50">
      <SellerSidebar
        currentView={currentView}
        setCurrentView={() => {}}
      />
      <SellerHeader
        currentView={currentView}
        setCurrentView={() => {}}
      />
      <main className="ml-64 p-6" style={{ marginTop: 74 }}>
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




// code withput refresh accessToken added.................

// "use client";

// import { useEffect, useRef, useState } from "react";
// import { usePathname, useRouter } from "next/navigation";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import SellerSidebar from "./dashboard/components/SellerSidebar";
// import SellerHeader from "./dashboard/components/SellerHeader";
// import { sellerAuthService } from "@/src/services/seller/authService";

// import toast from "react-hot-toast";
// import LogoutConfirmationModal from "./dashboard/components/LogoutConfirmationModal";

// export default function SellerLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [showLogoutModal, setShowLogoutModal] = useState(false);
//   const hasPushedState = useRef(false);

//   // Define public routes that don't require authentication
//   const isPublicRoute = () => {
//     // The main seller page (registration/landing) is public
//     return pathname === "/seller_7a3b9f2c";
//   };

//   // Define protected routes that require authentication
//   const isProtectedRoute = () => {
//     const protectedPaths = [
//       "/seller_7a3b9f2c/dashboard",
//       "/seller_7a3b9f2c/products",
//       "/seller_7a3b9f2c/profile",
//       "/seller_7a3b9f2c/reports",
//     ];
//     return protectedPaths.some(protectedPath => pathname.startsWith(protectedPath));
//   };

//   useEffect(() => {
//     console.log("=========================================");
//     console.log("🏪 SELLER LAYOUT INITIALIZED");
//     console.log("📍 Current pathname:", pathname);
//     console.log("🔓 Is public route:", isPublicRoute());
//     console.log("🔒 Is protected route:", isProtectedRoute());
    
//     // Only check authentication for protected routes
//     if (isProtectedRoute()) {
//       const accessToken = localStorage.getItem('accessToken');
//       const isAuthenticated = sellerAuthService.isAuthenticated();
      
//       if (!accessToken || !isAuthenticated) {
//         console.log("❌ Not authenticated, redirecting to login");
//         router.push('/?showLogin=true');
//         return;
//       }
//       console.log("✅ User authenticated for protected route");
//     } else {
//       console.log("📢 Public route - no authentication required");
//     }
//   }, [pathname, router]);

//   // Back navigation protection - ONLY for protected dashboard routes
//   useEffect(() => {
//     // Only apply back navigation protection on dashboard home
//     const isDashboardHome = pathname === "/seller_7a3b9f2c/dashboard";
    
//     // Don't apply protection on public routes
//     if (isPublicRoute() || !isDashboardHome) {
//       hasPushedState.current = false;
//       return;
//     }

//     if (!hasPushedState.current) {
//       window.history.pushState(
//         { dashboardProtected: true },
//         "",
//         window.location.href
//       );

//       hasPushedState.current = true;
//     }

//     const onBackButton = () => {
//       setShowLogoutModal(true);

//       window.history.pushState(
//         { dashboardProtected: true },
//         "",
//         window.location.href
//       );
//     };

//     const timeout = setTimeout(() => {
//       window.addEventListener("popstate", onBackButton);
//     }, 0);

//     return () => {
//       clearTimeout(timeout);
//       window.removeEventListener("popstate", onBackButton);
//     };
//   }, [pathname]);

//   const handleConfirmLogout = () => {
//     setShowLogoutModal(false);
//     sellerAuthService.clearAuth();
//     toast.success("Logged out successfully");
//     router.replace("/?showLogin=true");
//   };

//   const handleCancelLogout = () => {
//     setShowLogoutModal(false);
//   };

//   const getCurrentView = (path: string) => {
//     if (path.includes("/products")) return "product";
//     if (path.includes("/profile")) return "profile";
//     if (path.includes("/reports")) return "reports";
//     return "overview";
//   };

//   const currentView = getCurrentView(pathname) as any;
  
//   // For public routes (like /seller_7a3b9f2c), render without sidebar/header
//   if (isPublicRoute()) {
//     return (
//       <>
//         {children}
//         <ToastContainer
//           position="top-right"
//           autoClose={3000}
//           hideProgressBar={false}
//           newestOnTop
//           closeOnClick
//           rtl={false}
//           pauseOnFocusLoss
//           draggable
//           pauseOnHover
//           theme="light"
//           style={{ zIndex: 9999 }}
//         />
//       </>
//     );
//   }

//   // For protected routes, render with sidebar and header
//   return (
//     <div className="min-h-screen bg-secondary-50">
//       <SellerSidebar
//         currentView={currentView}
//         setCurrentView={() => {}}
//       />
//       <SellerHeader
//         currentView={currentView}
//         setCurrentView={() => {}}
//       />
//       <main className="ml-64 p-6" style={{ marginTop: 74 }}>
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
      
//       <LogoutConfirmationModal
//         isOpen={showLogoutModal}
//         onClose={handleCancelLogout}
//         onConfirm={handleConfirmLogout}
//       />
//     </div>
//   );
// }




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
//     <div className="min-h-screen bg-secondary-50">
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