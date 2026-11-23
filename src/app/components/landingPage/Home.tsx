"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import LandingHeader from "./LandingHeader";
import Footer from "./Footer";
import ProductGrid from "./ProductGrid";
import FeatureBrands from "./FeatureBrands";
import PromoBanner from "./PromoBanner";
import AdCarousel from "./AdCarousel";
import CategoryTiles from "./CategoryTiles";
import QuickNavRail from "./QuickNavRail";
import ProductRail from "./ProductRail";
import TrustStrip from "./TrustStrip";
import LoginModal from "../../modals/LoginModals/LoginModals";
import toast from "react-hot-toast";

const Home = () => {
  const searchParams = useSearchParams();

  // ✅ Check if URL contains ?showLogin=true (for login modal)
  const shouldAutoOpen = searchParams.get("showLogin") === "true";
  
  // ✅ Check if URL contains ?reset=success (to show success toast)
  const resetSuccess = searchParams.get("reset") === "success";

  // ✅ Initialize state directly from URL
  const [isLoginOpen, setIsLoginOpen] = useState(shouldAutoOpen);

  // ✅ Show success toast if password was reset
  useEffect(() => {
    if (resetSuccess) {
      toast.success("Password reset successful! Please login with your new password.");
      
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("reset");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [resetSuccess]);

  // ✅ Clean URL without redirecting or breaking routes
  useEffect(() => {
    const showLogin = searchParams.get("showLogin");

    if (showLogin === "true") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("showLogin");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  // ✅ Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isLoginOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLoginOpen]);

  return (
    <div className="min-h-screen">
      {/* Header — kept outside the zoomed wrapper below so it stays at normal size */}
      <LandingHeader />

      <div>
        {/* Marketplace layout: quick-nav rail on the left (desktop), sections on the right. */}
        <main className="bg-gray-100 pt-38">
          <div className="mx-auto flex max-w-[1400px] gap-5 px-4 py-5 sm:px-6">
            <QuickNavRail />
            <div className="min-w-0 flex-1">
              <PromoBanner />
              <AdCarousel />
              <CategoryTiles />
              <FeatureBrands />
              <ProductRail title="Newest Arrivals" subtitle="Recently listed by verified sellers" params={{ sort: "newest" }} />
              <TrustStrip />
              <ProductRail title="Best Prices" subtitle="Lowest price first, in stock only" params={{ sort: "price_asc", inStockOnly: true }} />
              <ProductGrid />
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Login Modal - Only opens when ?showLogin=true is present */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
};

export default Home;







// code before adding refresh token........................ dated 02.06.2026

// "use client";

// import React, { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";

// import LandingHeader from "./LandingHeader";
// import HeroSection from "./HeroSection";
// import Footer from "./Footer";
// import TrendingProducts from "./TrendingProducts";
// import TopRated from "./TopRated";
// import Deals from "./Deals";
// import FeatureBrands from "./FeatureBrands";
// import LoginModal from "../../modals/LoginModals/LoginModals";
// import toast from "react-hot-toast";

// const Home = () => {
//   const searchParams = useSearchParams();

//   // ✅ Check if URL contains ?showLogin=true (for login modal)
//   const shouldAutoOpen = searchParams.get("showLogin") === "true";
  
//   // ✅ Check if URL contains ?reset=success (to show success toast)
//   const resetSuccess = searchParams.get("reset") === "success";

//   // ✅ Initialize state directly from URL
//   const [isLoginOpen, setIsLoginOpen] = useState(shouldAutoOpen);

//   // ✅ Show success toast if password was reset
//   useEffect(() => {
//     if (resetSuccess) {
//       toast.success("Password reset successful! Please login with your new password.");
      
//       // Clean up the URL
//       const newUrl = new URL(window.location.href);
//       newUrl.searchParams.delete("reset");
//       window.history.replaceState({}, "", newUrl.toString());
//     }
//   }, [resetSuccess]);

//   // ✅ Clean URL without redirecting or breaking routes
//   useEffect(() => {
//     const showLogin = searchParams.get("showLogin");

//     if (showLogin === "true") {
//       const newUrl = new URL(window.location.href);
//       newUrl.searchParams.delete("showLogin");
//       window.history.replaceState({}, "", newUrl.toString());
//     }
//   }, [searchParams]);

//   // ✅ Lock body scroll when modal is open
//   useEffect(() => {
//     document.body.style.overflow = isLoginOpen ? "hidden" : "unset";
//     return () => {
//       document.body.style.overflow = "unset";
//     };
//   }, [isLoginOpen]);

//   return (
//     <div className="min-h-screen">
//       {/* Header */}
//       <LandingHeader onLoginClick={() => setIsLoginOpen(true)} />

//       {/* Main Content */}
//       <main className="pt-38">
//         <HeroSection />
//         <Deals />
//         <FeatureBrands />
//         <TrendingProducts />
//         <TopRated />
//       </main>

//       {/* Footer */}
//       <Footer />

//       {/* Login Modal - Only opens when ?showLogin=true is present */}
//       <LoginModal
//         isOpen={isLoginOpen}
//         onClose={() => setIsLoginOpen(false)}
//       />
//     </div>
//   );
// };

// export default Home;