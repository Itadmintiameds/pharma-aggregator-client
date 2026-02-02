"use client";

import React, { useState } from "react";
import Header from "@/src/app/components/Header";
import Section from "./Section";
import SellerRegister from "./SellerRegister";
import ProductOnboarding from "./ProductOnboarding";

type ViewType = "dashboard" | "register" | "product-onboarding";

export default function SellerDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  const renderContent = () => {
    switch (currentView) {
      case "register":
        return (
          <SellerRegister 
            onBackToDashboard={() => setCurrentView("dashboard")}
          />
        );
      case "product-onboarding":
        return (
          <ProductOnboarding 
            onBackToDashboard={() => setCurrentView("dashboard")}
          />
        );
      case "dashboard":
      default:
        return (
          <Section 
            onRegisterClick={() => setCurrentView("register")}
            onProductOnboardingClick={() => setCurrentView("product-onboarding")}
          />
        );
    }
  };

  return (
    <div>
      <div className="bg-[#F3ECF8] pt-22">
        <Header />
      </div>
      <div className="mt-4 ml-10">
        {renderContent()}
      </div>
    </div>
  );
}





// import React from "react";
// import Header from "@/src/app/components/Header";
// import Section from "./Section";

// export default function SellerDashboard() {
//   return (
//     <div>
//       <div className="bg-[#F3ECF8] pt-22">
//         <Header />
//       </div>
//       <div className="mt-4 ml-10">
//         <Section />
//       </div>
//     </div>
//   );
// }
