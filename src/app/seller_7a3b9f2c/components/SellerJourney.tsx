'use client'

import React, { useState } from 'react';
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
  FaArrowRight
} from 'react-icons/fa'


import SellerRegister from './SellerRegister';
import ProductOnboarding from './ProductOnboarding';

const SellerJourney = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showProductOnboarding, setShowProductOnboarding] = useState(false);

  const handleSellerLogin = () => {
    alert('Seller login is currently under maintenance. Please try again later.');
  };

  const journeySteps = [
    {
      title: "Register",
      description: "Complete KYC with GSTIN and pharma license. Get verified in 24 hours.",
      icon: <FaUserPlus className="w-6 h-6" />,
      time: "24 Hours"
    },
    {
      title: "List Products",
      description: "Upload your catalog with batch numbers, expiry dates, and certifications.",
      icon: <FaBox className="w-6 h-6" />,
      time: "1-2 Days"
    },
    {
      title: "Receive Orders",
      description: "Get orders from hospitals, clinics, and pharmacies across India.",
      icon: <FaShoppingCart className="w-6 h-6" />,
      time: "Immediate"
    },
    {
      title: "Dispatch",
      description: "Use our logistics network or your own. Track shipments in real-time.",
      icon: <FaShippingFast className="w-6 h-6" />,
      time: "Same Day"
    },
    {
      title: "Get Paid",
      description: "Secure payments released within 7 days of delivery confirmation.",
      icon: <FaRupeeSign className="w-6 h-6" />,
      time: "7 Days"
    }
  ]

  const platformBenefits = [
    {
      title: "Verified Buyer Network",
      description: "Access 50,000+ verified hospitals, clinics, and pharmacies with pre-vetted credentials.",
      icon: <FaUsers className="w-8 h-8" />,
      metric: "50K+ Buyers"
    },
    {
      title: "Regulatory Compliance",
      description: "Automated documentation for GST, FDA, and state regulations. Stay audit-ready always.",
      icon: <FaShieldAlt className="w-8 h-8" />,
      metric: "100% Compliant"
    },
    {
      title: "AI-Powered Insights",
      description: "Predict demand, optimize pricing, and identify high-margin opportunities with our AI tools.",
      icon: <FaTachometerAlt className="w-8 h-8" />,
      metric: "40% Smarter Decisions"
    },
    {
      title: "Dedicated Support",
      description: "Get a dedicated account manager and 24/7 support for order management and queries.",
      icon: <FaHandsHelping className="w-8 h-8" />,
      metric: "24/7 Support"
    }
  ]

  const growthStats = [
    { value: "3.2X", label: "Average Seller Growth" },
    { value: "₹500Cr+", label: "Monthly GMV" },
    { value: "29", label: "States Covered" },
    { value: "10K+", label: "Active Sellers" }
  ]

  if (showRegister) {
    return (
      <div className="min-h-screen bg-primary-50 pt-4">
        <SellerRegister  />
      </div>
    );
  }

  if (showProductOnboarding) {
    return (
      <div className="min-h-screen bg-primary-50 pt-4">
        <ProductOnboarding />
      </div>
    );
  }

  return (
    <div className="relative py-4 lg:py-4 bg-primary-100">
      {/* Why Choose TiaMeds with CTA Buttons */}
      <section className="mb-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-16">
            <div className="lg:w-2/3">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Why Pharma Distributors Choose{" "}
                <span className="text-primary-600">TiaMeds</span>
              </h2>
              <p className="text-xl text-neutral-600 max-w-4xl">
                Join India&apos;s fastest-growing B2B pharma marketplace designed specifically
                for licensed distributors, manufacturers, and wholesalers.
              </p>
            </div>
            
            {/* CTA Buttons - Right side */}
            <div className="mt-8 lg:mt-0 lg:ml-8 flex flex-col sm:flex-row lg:flex-col gap-4">
              {/* Register/Sign Up Button */}
              <button
                onClick={() => setShowRegister(true)}
                className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center"
              >
                <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
                  <FaUserPlus className="mr-3" />
                  Register / Sign Up
                </span>
                <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              </button>

              {/* Login Button */}
              <button
                onClick={handleSellerLogin}
                className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center"
              >
                <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
                  <FaSignInAlt className="mr-3" />
                  Seller Login
                </span>
                <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformBenefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-primary-50 rounded-2xl p-6 border border-primary-100 hover:border-primary-300 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors">
                  <div className="text-primary-600">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{benefit.title}</h3>
                <p className="text-neutral-600 mb-4 text-sm">{benefit.description}</p>
                <div className="text-primary-700 font-bold">{benefit.metric}</div>
              </div>
            ))}
          </div>

          {/* Stats Banner */}
          <div className="mt-16 bg-linear-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {growthStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-primary-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Your Selling Journey */}
      <section className="py-2">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              Start Selling in 5 Simple Steps
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              From registration to revenue - our streamlined process gets your pharma business online quickly and securely.
            </p>
          </div>

          <div className="relative">
            {/* Timeline for desktop */}
            <div className="hidden lg:block absolute left-0 right-0 top-12 h-0.5 bg-linear-to-r from-primary-100 via-primary-300 to-primary-100 -translate-y-1/2 z-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              {journeySteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-primary-100 flex items-center justify-center mx-auto text-primary-600 shadow-lg">
                      {step.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Step {index + 1}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-300 transition-colors">
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-neutral-600 mb-3">{step.description}</p>
                    <div className="text-primary-700 font-medium text-sm">{step.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Onboarding CTA */}
          <div className="mt-20 text-center">
            <div className="bg-linear-to-r from-primary-50 to-white rounded-2xl p-8 lg:p-12 border border-primary-100">
              <h3 className="text-3xl font-bold text-neutral-900 mb-4">
                Ready to List Your Products?
              </h3>
              <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
                Start your product onboarding process and get your medicines listed on India&apos;s largest pharma marketplace.
              </p>
              
              <button
                onClick={() => setShowProductOnboarding(true)}
                className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mx-auto"
              >
                <span className="flex items-center justify-center">
                  Start Product Onboarding
                  <FaArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </button>

              <p className="text-neutral-500 mt-6">
                Already registered? Access your seller dashboard to manage products and orders.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SellerJourney;