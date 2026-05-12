"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SellerSidebar from "./dashboard/components/SellerSidebar";
import SellerHeader from "./dashboard/components/SellerHeader";
import { usePathname } from "next/navigation";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
    </div>
  );
}