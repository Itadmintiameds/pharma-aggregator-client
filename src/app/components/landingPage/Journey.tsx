'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FaUserPlus,
  FaBox,
  FaShoppingCart,
  FaShippingFast,
  FaRupeeSign,
  FaChevronRight,
  FaStar,
  FaChartLine,
  FaShieldAlt,
  FaTachometerAlt,
  FaHandsHelping,
  FaSearch,
  FaBalanceScale,
  FaClock,
  FaTags,
  FaHospital,
  FaClinicMedical,
  FaWarehouse
} from 'react-icons/fa'

const Journey = () => {
  const [activeTab, setActiveTab] = useState<'seller' | 'buyer'>('seller')

  // Common platform benefits
  const platformStats = [
    { value: "₹500Cr+", label: "Monthly GMV", icon: "💰" },
    { value: "50K+", label: "Verified Businesses", icon: "✅" },
    { value: "29", label: "States Covered", icon: "🗺️" },
    { value: "99.7%", label: "Order Accuracy", icon: "🎯" }
  ]

  // Seller-specific data
  const sellerJourneySteps = [
    {
      title: "Register & Verify",
      description: "Complete KYC with GSTIN and pharma license. Get verified within 24 hours.",
      icon: <FaUserPlus className="w-6 h-6" />,
      time: "24 Hours"
    },
    {
      title: "List Products",
      description: "Upload your catalog with batch numbers, expiry dates, and required certifications.",
      icon: <FaBox className="w-6 h-6" />,
      time: "1-2 Days"
    },
    {
      title: "Receive Orders",
      description: "Get orders from hospitals, clinics, pharmacies, and institutions nationwide.",
      icon: <FaShoppingCart className="w-6 h-6" />,
      time: "Immediate"
    },
    {
      title: "Dispatch & Track",
      description: "Use our logistics network or your own. Real-time tracking for all shipments.",
      icon: <FaShippingFast className="w-6 h-6" />,
      time: "Within 3 days"
    },
    {
      title: "Secure Payments",
      description: "Get paid within 7 days of delivery confirmation. Escrow protection available.",
      icon: <FaRupeeSign className="w-6 h-6" />,
      time: "7 Days"
    }
  ]

  const sellerBenefits = [
    {
      title: "Access to Premium Buyers",
      description: "Connect with hospitals, government institutions, and large pharmacy chains.",
      icon: <FaHospital className="w-8 h-8" />,
      metric: "5,000+ Hospitals"
    },
    {
      title: "AI-Powered Demand Insights",
      description: "Predict regional demand, optimize inventory, and maximize sales opportunities.",
      icon: <FaTachometerAlt className="w-8 h-8" />,
      metric: "40% Better Forecast"
    },
    {
      title: "Regulatory Compliance Made Easy",
      description: "Automated documentation for GST, FDA, and state regulations. Stay audit-ready.",
      icon: <FaShieldAlt className="w-8 h-8" />,
      metric: "100% Compliance"
    },
    {
      title: "Growth Acceleration",
      description: "Average sellers experience 3.2X growth in first year with our tools.",
      icon: <FaChartLine className="w-8 h-8" />,
      metric: "3.2X Growth"
    }
  ]

  const sellerStories = [
    {
      name: "Dr. John Cena",
      business: "XYZ Pharmaceuticals",
      type: "Manufacturer",
      quote: "From supplying to local pharmacies to serving 50+ hospitals nationwide. TiaMeds opened doors we couldn't access before.",
      achievement: "500% Growth",
      timeline: "8 Months"
    },
    {
      name: "Ms. Ching Lee",
      business: "ABCD Distributors",
      type: "Distributor",
      quote: "The AI inventory tools helped reduce our stockouts by 85%. Now we serve 200+ pharmacies efficiently.",
      achievement: "85% Efficiency",
      timeline: "6 Months"
    }
  ]

  // Buyer-specific data
  const buyerJourneySteps = [
    {
      title: "Register & Verify",
      description: "Register with business credentials. Get access to verified suppliers immediately.",
      icon: <FaUserPlus className="w-6 h-6" />,
      time: "15 Minutes"
    },
    {
      title: "Search & Compare",
      description: "Find medicines by molecule, brand, or therapeutic category. Compare prices & ratings.",
      icon: <FaSearch className="w-6 h-6" />,
      time: "Instant"
    },
    {
      title: "Place Orders",
      description: "Bulk order support, scheduled deliveries, and contract pricing options.",
      icon: <FaShoppingCart className="w-6 h-6" />,
      time: "2 Minutes"
    },
    {
      title: "Track & Receive",
      description: "Real-time tracking from warehouse to doorstep. Temperature-controlled logistics.",
      icon: <FaShippingFast className="w-6 h-6" />,
      time: "24-48 Hours"
    },
    {
      title: "Manage Inventory",
      description: "AI tools predict your needs and suggest optimal reorder points.",
      icon: <FaWarehouse className="w-6 h-6" />,
      time: "Ongoing"
    }
  ]

  const buyerBenefits = [
    {
      title: "Verified Suppliers Only",
      description: "All sellers are licensed distributors/manufacturers with verified credentials.",
      icon: <FaShieldAlt className="w-8 h-8" />,
      metric: "100% Verified"
    },
    {
      title: "Best Price Discovery",
      description: "Compare prices from multiple suppliers. Negotiate bulk discounts directly.",
      icon: <FaTags className="w-8 h-8" />,
      metric: "15-25% Savings"
    },
    {
      title: "Reliable Supply Chain",
      description: "Never face stockouts. Our network ensures availability of critical medicines.",
      icon: <FaClock className="w-8 h-8" />,
      metric: "99% Availability"
    },
    {
      title: "Simplified Procurement",
      description: "One platform for all your needs - from generics to specialty medicines.",
      icon: <FaBalanceScale className="w-8 h-8" />,
      metric: "80% Time Saved"
    }
  ]

  const buyerStories = [
    {
      name: "Dr. James Bond",
      business: "Mitra Hospital",
      type: "Hospital Procurement",
      quote: "Reduced our procurement costs by 22% and cut order processing time from 3 days to 2 hours.",
      achievement: "22% Cost Saving",
      timeline: "4 Months"
    },
    {
      name: "Ms. Yokohama Tanaka",
      business: "PQRS Pharmacy Chain",
      type: "Retail Pharmacy",
      quote: "Managing inventory for 12 stores became effortless. Stockouts reduced by 90%.",
      achievement: "90% Less Stockouts",
      timeline: "3 Months"
    }
  ]

  return (
    <div className="relative py-16 lg:py-24 bg-white">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Platform Overview */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
            One Platform for{" "}
            <span className="text-primary-600">Pharma Commerce</span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-4xl mx-auto mb-12">
            Connecting verified pharma distributors with hospitals, pharmacies, and healthcare institutions nationwide.
            Trust, transparency, and technology-driven solutions for the pharmaceutical supply chain.
          </p>

          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {platformStats.map((stat, index) => (
              <div key={index} className="bg-primary-50 rounded-xl p-4">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold text-primary-700">{stat.value}</div>
                <div className="text-neutral-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex rounded-xl bg-neutral-100 p-1">
            <button
              onClick={() => setActiveTab('seller')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'seller'
                  ? 'bg-white text-primary-600 shadow-lg'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              <span className="flex items-center">
                <FaBox className="mr-2" />
                For Suppliers
              </span>
            </button>
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'buyer'
                  ? 'bg-white text-primary-600 shadow-lg'
                  : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              <span className="flex items-center">
                <FaHospital className="mr-2" />
                For Buyers
              </span>
            </button>
          </div>
        </div>

        {/* Seller Journey Content */}
        {activeTab === 'seller' && (
          <div className="space-y-20">
            {/* Seller Benefits */}
            <section>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
                Grow Your Pharma Distribution Business
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {sellerBenefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6">
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
            </section>

            {/* Seller Journey Steps */}
            <section>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
                Start Selling in 5 Simple Steps
              </h2>
              <div className="relative">
                <div className="hidden lg:block absolute left-0 right-0 top-12 h-0.5 bg-linear-to-r from-primary-100 via-primary-300 to-primary-100 -translate-y-1/2 z-0"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
                  {sellerJourneySteps.map((step, index) => (
                    <div key={index} className="text-center">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-full bg-white border-4 border-primary-100 flex items-center justify-center mx-auto text-primary-600 shadow-lg">
                          {step.icon}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {index + 1}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-300 transition-colors h-full">
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">{step.title}</h3>
                        <p className="text-sm text-neutral-600 mb-3">{step.description}</p>
                        <div className="text-primary-700 font-medium text-sm">{step.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Seller Success Stories */}
            <section className="bg-neutral-50 rounded-3xl p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                    Supplier Success Stories
                  </h2>
                  <p className="text-xl text-neutral-600">
                    See how pharma distributors are scaling with TiaMeds
                  </p>
                </div>
                <Link
                  href="/supplier-stories"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold mt-4 lg:mt-0"
                >
                  View All Stories
                  <FaChevronRight className="ml-2" />
                </Link>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {sellerStories.map((story, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg"
                  >
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-neutral-900">{story.name}</h3>
                          <div className="flex items-center text-neutral-600 mt-1">
                            <span>{story.business}</span>
                            <span className="mx-2">•</span>
                            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm">
                              {story.type}
                            </span>
                          </div>
                        </div>
                        <FaStar className="text-yellow-400 w-6 h-6" />
                      </div>
                    </div>

                    <p className="text-neutral-700 italic border-l-4 border-primary-500 pl-4 py-2 mb-6">
                      &ldquo;{story.quote}&rdquo;
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <div>
                        <div className="text-xl font-bold text-primary-700">{story.achievement}</div>
                        <div className="text-sm text-neutral-500">Achievement</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary-700">{story.timeline}</div>
                        <div className="text-sm text-neutral-500">Time to Result</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Seller CTA */}
            <section className="text-center">
              <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-2xl p-8 lg:p-12 text-white">
                <h3 className="text-3xl font-bold mb-4">Ready to Expand Your Reach?</h3>
                <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
                  Join India&apos;s fastest-growing B2B pharma marketplace. No setup fees, commission-only model.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/seller_7a3b9f2c"
                    className="px-8 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-lg transition-colors shadow-lg flex items-center justify-center"
                  >
                    <span className="flex items-center">
                      Start Selling Now
                      <FaChevronRight className="ml-2" />
                    </span>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Buyer Journey Content */}
        {activeTab === 'buyer' && (
          <div className="space-y-20">
            {/* Buyer Benefits */}
            <section>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
                Streamline Your Pharma Procurement
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {buyerBenefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6">
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
            </section>

            {/* Buyer Journey Steps */}
            <section>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
                Start Buying in 5 Simple Steps
              </h2>
              <div className="relative">
                <div className="hidden lg:block absolute left-0 right-0 top-12 h-0.5 bg-linear-to-r from-primary-100 via-primary-300 to-primary-100 -translate-y-1/2 z-0"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
                  {buyerJourneySteps.map((step, index) => (
                    <div key={index} className="text-center">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-full bg-white border-4 border-primary-100 flex items-center justify-center mx-auto text-primary-600 shadow-lg">
                          {step.icon}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {index + 1}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-primary-300 transition-colors h-full">
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">{step.title}</h3>
                        <p className="text-sm text-neutral-600 mb-3">{step.description}</p>
                        <div className="text-primary-700 font-medium text-sm">{step.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Buyer Success Stories */}
            <section className="bg-neutral-50 rounded-3xl p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                    Buyer Success Stories
                  </h2>
                  <p className="text-xl text-neutral-600">
                    See how healthcare institutions are optimizing procurement with TiaMeds
                  </p>
                </div>
                <Link
                  href="/buyer-stories"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold mt-4 lg:mt-0"
                >
                  View All Stories
                  <FaChevronRight className="ml-2" />
                </Link>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {buyerStories.map((story, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg"
                  >
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-neutral-900">{story.name}</h3>
                          <div className="flex items-center text-neutral-600 mt-1">
                            <span>{story.business}</span>
                            <span className="mx-2">•</span>
                            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm">
                              {story.type}
                            </span>
                          </div>
                        </div>
                        <FaClinicMedical className="text-primary-600 w-6 h-6" />
                      </div>
                    </div>

                    <p className="text-neutral-700 italic border-l-4 border-primary-500 pl-4 py-2 mb-6">
                      &ldquo;{story.quote}&rdquo;
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <div>
                        <div className="text-xl font-bold text-primary-700">{story.achievement}</div>
                        <div className="text-sm text-neutral-500">Achievement</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary-700">{story.timeline}</div>
                        <div className="text-sm text-neutral-500">Time to Result</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Buyer CTA */}
            <section className="text-center">
              <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-2xl p-8 lg:p-12 text-white">
                <h3 className="text-3xl font-bold mb-4">Ready to Optimize Your Procurement?</h3>
                <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
                  Access India&apos;s largest network of verified pharma suppliers. Better prices, reliable supply.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/buyer_e8d45a1b"
                    className="px-8 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-lg transition-colors shadow-lg flex items-center justify-center"
                  >
                    <span className="flex items-center">
                      Start Buying Now
                      <FaChevronRight className="ml-2" />
                    </span>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Comparison Section */}
        <section className="mt-20 bg-linear-to-br from-primary-50 to-white rounded-3xl p-8 lg:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
            Why Choose TiaMeds?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">100% Verified Network</h3>
              <p className="text-neutral-600">
                Every business is verified with GSTIN and pharma licenses. No unverified listings.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <FaTachometerAlt className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">AI-Powered Intelligence</h3>
              <p className="text-neutral-600">
                Smart tools for demand forecasting, inventory optimization, and price discovery.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <FaHandsHelping className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Dedicated Support</h3>
              <p className="text-neutral-600">
                Personal account managers and 24/7 support for both buyers and sellers.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-6">
            <Link
              href="/seller_7a3b9f2c"
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              I&apos;m a Supplier
            </Link>
            <span className="hidden sm:flex items-center text-neutral-400">OR</span>
            <Link
              href="/buyer_e8d45a1b"
              className="px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              I&apos;m a Buyer
            </Link>
          </div>
          <p className="text-neutral-500 mt-6">
            Join 50,000+ businesses already on TiaMeds
          </p>
        </section>
      </div>
    </div>
  )
}

export default Journey