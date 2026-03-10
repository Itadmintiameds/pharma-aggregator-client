"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import LandingHeader from "./LandingHeader";
import HeroSection from "./HeroSection";
import Footer from "./Footer";
import TrendingProducts from "./TrendingProducts";
import TopRated from "./TopRated";
import Deals from "./Deals";
import FeatureBrands from "./FeatureBrands";
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
      {/* Header */}
      <LandingHeader onLoginClick={() => setIsLoginOpen(true)} />

      {/* Main Content */}
      <main className="pt-38">
        <HeroSection />
        <Deals />
        <FeatureBrands />
        <TrendingProducts />
        <TopRated />
      </main>

      {/* Footer */}
      <Footer />

      {/* Login Modal - Only opens when ?showLogin=true is present */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
};

export default Home;








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

// const Home = () => {
//   const searchParams = useSearchParams();

//   // ✅ Check if URL contains ?autoLogin=true
//   const shouldAutoOpen = searchParams.get("autoLogin") === "true";

//   // ✅ Initialize state directly from URL (no effect setState)
//   const [isLoginOpen, setIsLoginOpen] = useState(shouldAutoOpen);

//   // ✅ Clean URL without redirecting or breaking routes
//   useEffect(() => {
//     const autoLogin = searchParams.get("autoLogin");

//     if (autoLogin === "true") {
//       const newUrl = new URL(window.location.href);
//       newUrl.searchParams.delete("autoLogin");

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

//       {/* Login Modal */}
//       <LoginModal
//         isOpen={isLoginOpen}
//         onClose={() => setIsLoginOpen(false)}
//       />
//     </div>
//   );
// };

// export default Home;









// This code is without adding the auto login from the backend..... 

// "use client";

// import React, { useState, useEffect  } from "react";
// import LandingHeader from "./LandingHeader";
// import HeroSection from "./HeroSection";
// import Footer from "./Footer";
// import TrendingProducts from "./TrendingProducts";
// import TopRated from "./TopRated";
// import Deals from "./Deals";
// import FeatureBrands from "./FeatureBrands";
// import LoginModal from "../../modals/LoginModals/LoginModals";

// const Home = () => {
//   const [isLoginOpen, setIsLoginOpen] = useState(false);
  
//    useEffect(() => {
//     if (isLoginOpen) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }
    

//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [isLoginOpen]);


//   return (
//     <div className="min-h-screen ">
//       <LandingHeader onLoginClick={() => setIsLoginOpen(true)} />

//       <main className="pt-38">
//         <HeroSection />
//         <Deals />
//         <FeatureBrands />
//         <TrendingProducts />
//         <TopRated />
//       </main>

//       <Footer />
//       {/* Login Modal */}
//       <LoginModal
//         isOpen={isLoginOpen}
//         onClose={() => setIsLoginOpen(false)}
//       />
//     </div>
//   );
// };

// export default Home;