"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sellerAuthService } from "@/src/services/seller/authService";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import {
  FaUserPlus,
  FaBox,
  FaShoppingCart,
  FaShippingFast,
  FaRupeeSign,
  FaShieldAlt,
  FaTachometerAlt,
  FaUsers,
  FaHandsHelping,
  FaSignInAlt,
  FaArrowRight,
  FaClock,
} from "react-icons/fa";

import SellerRegister from "./SellerRegister";
import ProductOnboarding from "./ProductOnboarding";
import SellerDeclaration from "./SellerDeclaration";
import DrugProductList from "./DrugProductList";
import LoginModals from "@/src/app/modals/LoginModals/LoginModals";

type SellerViewState = "checking" | "guest" | "register" | "pending";

const SellerJourney = () => {
  const router = useRouter();
  const [viewState, setViewState] = useState<SellerViewState>("checking");
  const [showProductOnboarding, setShowProductOnboarding] = useState(false);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);


  const routeAuthenticatedSeller = async () => {
    if (!sellerAuthService.isAuthenticated()) {
      setViewState("guest");
      return;
    }
    setViewState("checking");

    try {
      await sellerProfileService.getCurrentSellerProfile();
      router.replace("/seller_7a3b9f2c/dashboard");
      return; // keep showing the spinner until the navigation lands
    } catch {
      // No approved Seller row yet — fall through to check TempSeller.
    }

    const currentUser = sellerAuthService.getCurrentUser();
    if (!currentUser?.userId) {
      setViewState("register");
      return;
    }

    try {
      await sellerRegService.getTempSellerByUserId(currentUser.userId);
      setViewState("pending");
    } catch {
      setViewState("register");
    }
  };

  useEffect(() => {
    routeAuthenticatedSeller();
  }, []);

  useEffect(() => {
    const handleAuthChanged = () => {
      routeAuthenticatedSeller();
    };
    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, []);

  const handleSellerLogin = () => {
    setShowLoginModal(true);
  };

  const handleAcceptDeclaration = () => {
    setShowDeclaration(false);
    setViewState("register");
  };

  const handleCloseDeclaration = () => {
    setShowDeclaration(false);
  };

  const journeySteps = [
    {
      title: "Register",
      description:
        "Complete KYC with GSTIN and pharma license. Get verified in 24 hours.",
      icon: <FaUserPlus className="w-6 h-6" />,
      time: "24 Hours",
    },
    {
      title: "List Products",
      description:
        "Upload your catalog with batch numbers, expiry dates, and certifications.",
      icon: <FaBox className="w-6 h-6" />,
      time: "1-2 Days",
    },
    {
      title: "Receive Orders",
      description:
        "Get orders from hospitals, clinics, and pharmacies across India.",
      icon: <FaShoppingCart className="w-6 h-6" />,
      time: "Immediate",
    },
    {
      title: "Dispatch",
      description:
        "Use our logistics network or your own. Track shipments in real-time.",
      icon: <FaShippingFast className="w-6 h-6" />,
      time: "Same Day",
    },
    {
      title: "Get Paid",
      description:
        "Secure payments released within 7 days of delivery confirmation.",
      icon: <FaRupeeSign className="w-6 h-6" />,
      time: "7 Days",
    },
  ];

  const platformBenefits = [
    {
      title: "Verified Buyer Network",
      description:
        "Access 50,000+ verified hospitals, clinics, and pharmacies with pre-vetted credentials.",
      icon: <FaUsers className="w-8 h-8" />,
      metric: "50K+ Buyers",
    },
    {
      title: "Regulatory Compliance",
      description:
        "Automated documentation for GST, FDA, and state regulations. Stay audit-ready always.",
      icon: <FaShieldAlt className="w-8 h-8" />,
      metric: "100% Compliant",
    },
    {
      title: "AI-Powered Insights",
      description:
        "Predict demand, optimize pricing, and identify high-margin opportunities with our AI tools.",
      icon: <FaTachometerAlt className="w-8 h-8" />,
      metric: "40% Smarter Decisions",
    },
    {
      title: "Dedicated Support",
      description:
        "Get a dedicated account manager and 24/7 support for order management and queries.",
      icon: <FaHandsHelping className="w-8 h-8" />,
      metric: "24/7 Support",
    },
  ];

  const growthStats = [
    { value: "3.2X", label: "Average Seller Growth" },
    { value: "₹500Cr+", label: "Monthly GMV" },
    { value: "29", label: "States Covered" },
    { value: "10K+", label: "Active Sellers" },
  ];

  // Brief spinner while we resolve which of the two seller tables (if any)
  // has this user's data — never the marketing/login page, so a returning
  // seller can't accidentally hit "Register" or "Login" mid-check.
  if (viewState === "checking") {
    return (
      <div className="min-h-screen bg-primary-100 pt-20 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-700 animate-spin" />
      </div>
    );
  }

  if (viewState === "register") {
    return (
      <div className="min-h-screen bg-primary-100 pt-20">
        <SellerRegister />
      </div>
    );
  }

  if (viewState === "pending") {
    return (
      <div className="min-h-screen bg-primary-100 pt-20 flex items-center justify-center px-4">
        <div className="bg-base-white rounded-2xl shadow-lg max-w-[28rem] w-full p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center mx-auto mb-6 text-warning-500">
            <FaClock className="w-7 h-7" />
          </div>
          <h2 className="text-h4 font-heading font-bold text-pneutral-900 mb-3">
            Application Under Review
          </h2>
          <p className="text-p3 font-body text-pneutral-600 mb-6">
            You&apos;ve already submitted your company details. Our team is
            reviewing your registration and you&apos;ll be notified by email
            once your account is approved.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-md bg-primary-800 text-base-white font-bold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Declaration Modal */}
      {showDeclaration && (
        <SellerDeclaration
          onAccept={handleAcceptDeclaration}
          onClose={handleCloseDeclaration}
        />
      )}

      {/* Login Modal */}
      <LoginModals
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <div className="relative py-12 lg:py-14 mt-16">
        {/* Why Choose TiaMeds with CTA Buttons */}
        <section className="mb-16">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-12">
              <div className="lg:w-2/3">
                <h2 className="text-h2 font-heading font-bold text-pneutral-900 mb-6">
                  Why Pharma Distributors Choose{" "}
                  <span className="text-primary-600">TiaMeds</span>
                </h2>
                <p className="text-p4 font-body text-pneutral-600 max-w-4xl">
                  Join India&apos;s fastest-growing B2B pharma marketplace
                  designed specifically for licensed distributors,
                  manufacturers, and wholesalers.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="mt-4 lg:mt-0 lg:ml-8 flex flex-col gap-3 sm:flex-row w-full sm:w-auto lg:w-auto">
                {/* Register/Sign Up Button*/}
                <button
                  onClick={() => setShowDeclaration(true)}
                  className="group relative px-4 py-3 bg-primary-600 hover:bg-primary-700 text-base-white font-bold text-label-l4 rounded-md shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 whitespace-nowrap"
                >
                  <span className="flex items-center justify-center">
                    <FaUserPlus className="mr-2" />
                    Register / Sign Up
                  </span>
                  <div className="absolute inset-0 rounded-md bg-base-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </button>

                {/* Login Button */}
                <button
                  onClick={handleSellerLogin}
                  className="group relative px-4 py-3 bg-secondary-600 hover:bg-secondary-700 text-base-white font-bold text-label-l4 rounded-md shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 whitespace-nowrap"
                >
                  <span className="flex items-center justify-center">
                    <FaSignInAlt className="mr-1" />
                    Seller Login
                  </span>
                  <div className="absolute inset-0 rounded-md bg-base-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {platformBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-secondary-50 rounded-lg p-6 border border-secondary-100 hover:border-primary-300 transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-sm bg-primary-100 flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors">
                    <div className="text-primary-600">{benefit.icon}</div>
                  </div>
                  <h3 className="text-h6 font-heading font-bold text-pneutral-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-p3 font-body text-pneutral-600 mb-4">
                    {benefit.description}
                  </p>
                  <div className="text-primary-700 font-semibold text-label-l3">
                    {benefit.metric}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Banner */}
            <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-base-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {growthStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-h5 font-heading font-bold mb-2">
                      {stat.value}
                    </div>
                    <div className="text-primary-200 text-p3 font-body">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Your Selling Journey */}
        <section className="py-2">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-h2 font-heading font-bold text-pneutral-900 mb-6">
                Start Selling in 5 Simple Steps
              </h2>
              <p className="text-p4 font-body text-pneutral-600 max-w-3xl mx-auto">
                From registration to revenue - our streamlined process gets your
                pharma business online quickly and securely.
              </p>
            </div>

            <div className="relative">
              {/* Timeline for desktop */}
              <div className="hidden lg:block absolute left-0 right-0 top-12 h-0.5 bg-gradient-to-r from-primary-100 via-primary-300 to-primary-100 -translate-y-1/2 z-0"></div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
                {journeySteps.map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full bg-base-white border-4 border-primary-100 flex items-center justify-center mx-auto text-primary-600 shadow-md">
                        {step.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 bg-primary-600 text-base-white text-p2 font-bold px-2 py-1 rounded-full">
                        Step {index + 1}
                      </div>
                    </div>

                    <div className="bg-base-white rounded-md p-5 border border-pneutral-100 hover:border-primary-300 transition-colors shadow-sm">
                      <h3 className="text-h6 font-heading font-bold text-pneutral-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-p3 font-body text-pneutral-600 mb-3">
                        {step.description}
                      </p>
                      <div className="text-primary-700 font-semibold text-label-l3">
                        {step.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Onboarding CTA */}
            <div className="mt-10 text-center">
              <div className="bg-gradient-to-r from-primary-50 to-base-white rounded-lg p-8 lg:p-12 border border-primary-100">
                <h3 className="text-h3 font-heading font-bold text-pneutral-900 mb-4">
                  Ready to List Your Products?
                </h3>
                <p className="text-p4 font-body text-pneutral-600 mb-8 max-w-2xl mx-auto">
                  Start your product onboarding process and get your medicines
                  listed on India&apos;s largest pharma marketplace.
                </p>

                <button
                  onClick={() => setShowProductOnboarding(true)}
                  className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-700 text-base-white font-bold text-label-l4 rounded-md shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 mx-auto"
                >
                  <span className="flex items-center justify-center">
                    Start Product Onboarding
                    <FaArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 rounded-md bg-base-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </button>

                <p className="text-p3 font-body text-pneutral-500 mt-4">
                  Already registered? Access your seller dashboard to manage
                  products and orders.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SellerJourney;








// "use client";

// import React, { useState } from "react";
// import {
//   FaUserPlus,
//   FaBox,
//   FaShoppingCart,
//   FaShippingFast,
//   FaRupeeSign,
//   FaShieldAlt,
//   FaTachometerAlt,
//   FaUsers,
//   FaHandsHelping,
//   FaSignInAlt,
//   FaArrowRight,
// } from "react-icons/fa";


// import SellerRegister from "./SellerRegister";
// import ProductOnboarding from "./ProductOnboarding";
// import SellerDeclaration from "./SellerDeclaration";
// // import ProductList from "./DrugProductList";
// import DrugProductList from "./DrugProductList";

// // import SellerRegister from './SellerRegister';
// // import ProductOnboarding from './ProductOnboarding';
// // import SellerDeclaration from './SellerDeclaration';
// // import { useRouter } from "next/navigation";


// const SellerJourney = () => {
//   // const router = useRouter();
//   const [showRegister, setShowRegister] = useState(false);
//   const [showProductOnboarding, setShowProductOnboarding] = useState(false);
//   const [showDeclaration, setShowDeclaration] = useState(false);
//   const [showProductList, setShowProductList] = useState(false);

//   const handleSellerLogin = () => {

//     alert(
//       "Seller login is currently under maintenance. Please try again later.",
//     );
//   };

// //   router.push("/seller_7a3b9f2c/login");
// // };


//   const handleAcceptDeclaration = () => {
//     setShowDeclaration(false);
//     setShowRegister(true);
//   };

//   const handleCloseDeclaration = () => {
//     setShowDeclaration(false);
//   };

//   const journeySteps = [
//     {
//       title: "Register",
//       description:
//         "Complete KYC with GSTIN and pharma license. Get verified in 24 hours.",
//       icon: <FaUserPlus className="w-6 h-6" />,
//       time: "24 Hours",
//     },
//     {
//       title: "List Products",
//       description:
//         "Upload your catalog with batch numbers, expiry dates, and certifications.",
//       icon: <FaBox className="w-6 h-6" />,
//       time: "1-2 Days",
//     },
//     {
//       title: "Receive Orders",
//       description:
//         "Get orders from hospitals, clinics, and pharmacies across India.",
//       icon: <FaShoppingCart className="w-6 h-6" />,
//       time: "Immediate",
//     },
//     {
//       title: "Dispatch",
//       description:
//         "Use our logistics network or your own. Track shipments in real-time.",
//       icon: <FaShippingFast className="w-6 h-6" />,
//       time: "Same Day",
//     },
//     {
//       title: "Get Paid",
//       description:
//         "Secure payments released within 7 days of delivery confirmation.",
//       icon: <FaRupeeSign className="w-6 h-6" />,
//       time: "7 Days",
//     },
//   ];

//   const platformBenefits = [
//     {
//       title: "Verified Buyer Network",
//       description:
//         "Access 50,000+ verified hospitals, clinics, and pharmacies with pre-vetted credentials.",
//       icon: <FaUsers className="w-8 h-8" />,
//       metric: "50K+ Buyers",
//     },
//     {
//       title: "Regulatory Compliance",
//       description:
//         "Automated documentation for GST, FDA, and state regulations. Stay audit-ready always.",
//       icon: <FaShieldAlt className="w-8 h-8" />,
//       metric: "100% Compliant",
//     },
//     {
//       title: "AI-Powered Insights",
//       description:
//         "Predict demand, optimize pricing, and identify high-margin opportunities with our AI tools.",
//       icon: <FaTachometerAlt className="w-8 h-8" />,
//       metric: "40% Smarter Decisions",
//     },
//     {
//       title: "Dedicated Support",
//       description:
//         "Get a dedicated account manager and 24/7 support for order management and queries.",
//       icon: <FaHandsHelping className="w-8 h-8" />,
//       metric: "24/7 Support",
//     },
//   ];

//   const growthStats = [
//     { value: "3.2X", label: "Average Seller Growth" },
//     { value: "₹500Cr+", label: "Monthly GMV" },
//     { value: "29", label: "States Covered" },
//     { value: "10K+", label: "Active Sellers" },
//   ];

//   if (showRegister) {
//     return (

//       <div className="min-h-screen bg-primary-50 pt-4">
//         <SellerRegister />

//       {/* <div className="min-h-screen pt-4">
//         <SellerRegister  /> */}

//       </div>
//     );
//   }

//   // if (showProductOnboarding) {
//   //   return (
//   //     <div className="min-h-screen bg-primary-50 pt-4">
//   //       <ProductOnboarding
//   //         onSuccess={() => {
//   //           setShowProductOnboarding(false);
//   //           setShowProductList(true);
//   //         }}
//   //       />
//   //     {/* <div className="min-h-screen pt-4">
//   //       <ProductOnboarding />*/}

//   //     </div> 
//   //   );
//   // }

// //   if (showProductList) {
// //   return (
// //     <div className="min-h-screen bg-primary-50 pt-4">
// //       <DrugProductList onDelete={function (productId: string): void {
// //         throw new Error("Function not implemented.");
// //       } } onEdit={function (productId: string): void {
// //         throw new Error("Function not implemented.");
// //       } } />
// //     </div>
// //   );
// // }

//   return (
//     <>
    
//       {/* Declaration Modal */}
//       {showDeclaration && (
//         <SellerDeclaration
//           onAccept={handleAcceptDeclaration}
//           onClose={handleCloseDeclaration}
//         />
//       )}

//       <div className="relative py-12 lg:py-14 mt-16">
//         {/* Why Choose TiaMeds with CTA Buttons */}
//         <section className="mb-16">
//           <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
//             <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-12">
//               <div className="lg:w-2/3">
//                 <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
//                   Why Pharma Distributors Choose{" "}
//                   <span className="text-primary-600">TiaMeds</span>
//                 </h2>
//                 <p className="text-xl text-neutral-600 max-w-4xl">
//                   Join India&apos;s fastest-growing B2B pharma marketplace
//                   designed specifically for licensed distributors,
//                   manufacturers, and wholesalers.
//                 </p>
//               </div>

//               {/* CTA Buttons */}
//               <div className="mt-4 lg:mt-0 lg:ml-8 flex flex-col gap-3 sm:flex-row w-full sm:w-auto lg:w-auto">
//                 {/* Register/Sign Up Button*/}
//                 <button
//                   onClick={() => setShowDeclaration(true)}
//                   className="group relative px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 whitespace-nowrap"
//                 >
//                   <span className="flex items-center justify-center">
//                     <FaUserPlus className="mr-2" />
//                     Register / Sign Up
//                   </span>
//                   <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
//                 </button>

//                 {/* Login Button */}
//                 <button
//                   onClick={handleSellerLogin}
//                   className="group relative px-4 py-3 bg-tertiary-600 hover:bg-tertiary-800 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 whitespace-nowrap"
//                 >
//                   <span className="flex items-center justify-center">
//                     <FaSignInAlt className="mr-1" />
//                     Seller Login
//                   </span>
//                   <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
//                 </button>
//               </div>
//             </div>

//             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
//               {platformBenefits.map((benefit, index) => (
//                 <div
//                   key={index}
//                   className="bg-bg-secondary-50 rounded-2xl p-6 border border-secondary-100 hover:border-primary-300 transition-all duration-300 group hover:-translate-y-1"
//                 >
//                   <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors">
//                     <div className="text-primary-600">{benefit.icon}</div>
//                   </div>
//                   <h3 className="text-xl font-bold text-neutral-900 mb-3">
//                     {benefit.title}
//                   </h3>
//                   <p className="text-neutral-600 mb-4 text-sm">
//                     {benefit.description}
//                   </p>
//                   <div className="text-primary-700 font-bold">
//                     {benefit.metric}
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Stats Banner */}
//             <div className="mt-12 bg-linear-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                 {growthStats.map((stat, index) => (
//                   <div key={index} className="text-center">
//                     <div className="text-3xl md:text-4xl font-bold mb-2">
//                       {stat.value}
//                     </div>
//                     <div className="text-primary-200">{stat.label}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Your Selling Journey */}
//         <section className="py-2">
//           <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
//             <div className="text-center mb-12">
//               <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
//                 Start Selling in 5 Simple Steps
//               </h2>
//               <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
//                 From registration to revenue - our streamlined process gets your
//                 pharma business online quickly and securely.
//               </p>
//             </div>

//             <div className="relative">
//               {/* Timeline for desktop */}
//               <div className="hidden lg:block absolute left-0 right-0 top-12 h-0.5 bg-linear-to-r from-primary-50 via-primary-300 to-primary-100 -translate-y-1/2 z-0"></div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
//                 {journeySteps.map((step, index) => (
//                   <div key={index} className="text-center">
//                     <div className="relative mb-6">
//                       <div className="w-16 h-16 rounded-full bg-white border-4 border-primary-100 flex items-center justify-center mx-auto text-primary-600 shadow-lg">
//                         {step.icon}
//                       </div>
//                       <div className="absolute -top-2 -right-2 bg-primary-50 text-white text-xs font-bold px-2 py-1 rounded-full">
//                         Step {index + 1}
//                       </div>
//                     </div>

//                     <div className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-300 transition-colors">
//                       <h3 className="text-lg font-bold text-neutral-900 mb-2">
//                         {step.title}
//                       </h3>
//                       <p className="text-sm text-neutral-600 mb-3">
//                         {step.description}
//                       </p>
//                       <div className="text-primary-700 font-medium text-sm">
//                         {step.time}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Product Onboarding CTA */}
//             <div className="mt-10 text-center">
//               <div className="bg-linear-to-r from-primary-50 to-white rounded-2xl p-8 lg:p-12 border border-primary-100">
//                 <h3 className="text-3xl font-bold text-neutral-900 mb-4">
//                   Ready to List Your Products?
//                 </h3>
//                 <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
//                   Start your product onboarding process and get your medicines
//                   listed on India&apos;s largest pharma marketplace.
//                 </p>

//                 <button
//                   onClick={() => setShowProductOnboarding(true)}
//                   className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mx-auto"
//                 >
//                   <span className="flex items-center justify-center">
//                     Start Product Onboarding
//                     <FaArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
//                   </span>
//                   <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
//                 </button>

//                 <p className="text-neutral-500 mt-4">
//                   Already registered? Access your seller dashboard to manage
//                   products and orders.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>
//       </div>
//     </>
//   );
// };

// export default SellerJourney;