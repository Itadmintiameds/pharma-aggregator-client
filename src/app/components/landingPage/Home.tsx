"use client";

import React, { useState, useEffect  } from "react";
import LandingHeader from "./LandingHeader";
import HeroSection from "./HeroSection";
import Footer from "./Footer";
import TrendingProducts from "./TrendingProducts";
import TopRated from "./TopRated";
import Deals from "./Deals";
import FeatureBrands from "./FeatureBrands";
import LoginModal from "../../modals/LoginModals/LoginModals";

const Home = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
   useEffect(() => {
    if (isLoginOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoginOpen]);


  return (
    <div className="min-h-screen ">
      <LandingHeader onLoginClick={() => setIsLoginOpen(true)} />

      <main className="pt-38">
        <HeroSection />
        <Deals />
        <FeatureBrands />
        <TrendingProducts />
        <TopRated />
      </main>

      <Footer />
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
};

export default Home;







// Original code withouit new global css...........
// import React from "react";
// import LandingHeader from "./LandingHeader";
// import HeroSection from "./HeroSection";
// import Footer from "./Footer";
// import Journey from "./Journey";
// import FAQS from "./FAQS";
// import Deals from "./Deals";

// const Home = () => {
//   return (
//     <div className="min-h-screen bg-primary-100">
//       <LandingHeader />

//       <main className="pt-1">
//         <HeroSection />
//         <Deals />
//         <Journey />
//         <FAQS />
//       </main>

//       <Footer />
//     </div>
//   );
// };

// export default Home;