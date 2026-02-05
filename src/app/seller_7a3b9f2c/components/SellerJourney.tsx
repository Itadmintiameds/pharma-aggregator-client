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
  FaDownload,
  FaStar,
  FaHeadset,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaTachometerAlt,
  FaUsers,
  FaHandsHelping
} from 'react-icons/fa'

const SellerJourney = () => {
  const [activeStory, setActiveStory] = useState(0)

  const successStories = [
    {
      name: "Dr. Ankit Verma",
      business: "Verma Pharmaceuticals",
      location: "Delhi",
      quote: "As a new distributor, TiaMeds helped us connect with hospital chains we couldn't reach before. Our monthly orders increased from 50 to 500+ in just 6 months.",
      achievement: "500+ Monthly Orders",
      timeline: "6 Months"
    },
    {
      name: "Ms. Priya Reddy",
      business: "MediPlus Distributors",
      location: "Hyderabad",
      quote: "The AI-powered demand forecasting helped us optimize inventory. We reduced stockouts by 80% and increased profit margins by 35%.",
      achievement: "35% Profit Increase",
      timeline: "4 Months"
    },
    {
      name: "Mr. Rajesh Iyer",
      business: "Lifeline Medical Supplies",
      location: "Mumbai",
      quote: "Compliance was our biggest challenge. TiaMeds' automated documentation and regulatory support made government tenders accessible to us.",
      achievement: "12 Govt Tenders Won",
      timeline: "8 Months"
    }
  ]

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

  return (
    <div className="relative py-16 lg:py-24 bg-white">
      {/* Why Choose TiaMeds */}
      <section className="mb-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              Why Pharma Distributors Choose{" "}
              <span className="text-primary-600">TiaMeds</span>
            </h2>
            <p className="text-xl text-neutral-600 max-w-4xl mx-auto">
              Join India&apos;s fastest-growing B2B pharma marketplace designed specifically
              for licensed distributors, manufacturers, and wholesalers.
            </p>
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
          <div className="mt-16 bg-linear-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
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

      {/* Success Stories */}
      <section className="bg-neutral-50 py-16">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
                Distributor Success Stories
              </h2>
              <p className="text-xl text-neutral-600">
                See how licensed pharma distributors are scaling their business with TiaMeds
              </p>
            </div>
            <Link
              href="/seller-stories"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold mt-4 lg:mt-0"
            >
              View All Case Studies
              <FaChevronRight className="ml-2" />
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 cursor-pointer ${activeStory === index ? 'border-primary-500' : 'border-transparent'
                  }`}
                onClick={() => setActiveStory(index)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900">{story.name}</h3>
                    <div className="flex items-center text-neutral-600 mt-1">
                      <span>{story.business}</span>
                      <span className="mx-2">•</span>
                      <span>{story.location}</span>
                    </div>
                  </div>
                  {activeStory === index && (
                    <span className="flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      <FaStar className="mr-1" /> Featured
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-neutral-700 italic border-l-4 border-primary-500 pl-4 py-2">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <div>
                    <div className="text-lg font-bold text-primary-700">{story.achievement}</div>
                    <div className="text-sm text-neutral-500">Key Achievement</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-700">{story.timeline}</div>
                    <div className="text-sm text-neutral-500">Time to Result</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your Selling Journey */}
      <section className="py-20">
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

          {/* CTA Section */}
          <div className="mt-20 bg-linear-to-r from-primary-50 to-white rounded-2xl p-8 lg:p-12 border border-primary-100">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="lg:w-1/2">
                <h3 className="text-3xl font-bold text-neutral-900 mb-4">
                  Ready to Expand Your Pharma Distribution?
                </h3>
                <p className="text-neutral-600 mb-6">
                  Join India&apos;s trusted B2B pharma marketplace. Get started with your existing inventory and reach buyers nationwide.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white px-4 py-2 rounded-lg border border-neutral-200">
                    <div className="text-sm text-neutral-500">No Setup Fee</div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border border-neutral-200">
                    <div className="text-sm text-neutral-500">Commission Only</div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border border-neutral-200">
                    <div className="text-sm text-neutral-500">Free Onboarding</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 lg:w-1/2 lg:justify-end">
                <button className="px-6 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold rounded-lg transition-colors flex items-center justify-center">
                  <FaHeadset className="mr-2" />
                  Book a Demo
                </button>
                <Link
                  href="/seller_7a3b9f2c"
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <span className="flex items-center">
                    Start Selling Now
                    <FaChevronRight className="ml-2" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div className="mt-12 pt-8 border-t border-primary-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <FaDownload className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900">Seller Resources</h4>
                    <p className="text-sm text-neutral-600">Download our compliance checklist and pricing guide</p>
                  </div>
                </div>

                <button className="px-6 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  Download Resources
                </button>
              </div>
            </div>
          </div>

          {/* Scroll to top */}
          <div className="text-center mt-12">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              <FaMapMarkerAlt className="mr-2" />
              Back to Top
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SellerJourney;