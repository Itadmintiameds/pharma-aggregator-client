'use client'

import { useState } from 'react'
import { FaChevronDown, FaStore, FaShoppingCart, FaQuestionCircle } from 'react-icons/fa'

const FAQS = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "What documents do I need to register as a seller?",
      answer: "You need a valid GSTIN, Drug License (Wholesale/Retail), business PAN card, and proof of business address. Verification typically takes 24-48 hours.",
      type: "seller",
      icon: <FaStore className="w-5 h-5" />
    },
    {
      question: "How do I place my first order as a buyer?",
      answer: "Register with your business credentials, browse verified products, add to cart, and checkout. You can schedule deliveries, request bulk quotes, and track orders in real-time.",
      type: "buyer",
      icon: <FaShoppingCart className="w-5 h-5" />
    },
    {
      question: "How are prices determined on the platform?",
      answer: "Prices are set by verified sellers. You can compare prices from multiple suppliers, request bulk quotes, and negotiate directly with sellers for contract pricing.",
      type: "buyer",
      icon: <FaShoppingCart className="w-5 h-5" />
    },
    {
      question: "How do I handle returns and refunds?",
      answer: "Returns are accepted for damaged/expired products within 7 days of delivery. Refunds are processed within 5-7 business days after quality verification.",
      type: "seller",
      icon: <FaStore className="w-5 h-5" />
    },
    {
      question: "What payment methods are available?",
      answer: "We support NEFT/RTGS, UPI, credit/debit cards, and corporate accounts. Payment terms can be negotiated with sellers for bulk orders.",
      type: "buyer",
      icon: <FaShoppingCart className="w-5 h-5" />
    },
    {
      question: "How does the AI-powered matching work?",
      answer: "Our AI analyzes your product catalog, pricing, and past performance to match you with the most relevant buyers. It also suggests optimal pricing based on market demand.",
      type: "seller",
      icon: <FaStore className="w-5 h-5" />
    },
    {
      question: "How do I verify seller credentials?",
      answer: "All sellers display verified badges showing their GSTIN, Drug License status, and platform ratings. You can also download their compliance certificates before ordering.",
      type: "buyer",
      icon: <FaShoppingCart className="w-5 h-5" />
    },
    {
      question: "What logistics support is provided?",
      answer: "You can use our integrated logistics network with temperature-controlled transport or your own logistics. We provide tracking and delivery confirmation.",
      type: "seller",
      icon: <FaStore className="w-5 h-5" />
    },
    {
      question: "Can I schedule recurring orders?",
      answer: "Yes, you can set up automatic reordering based on your consumption patterns. Our AI predicts your needs and suggests optimal order quantities.",
      type: "buyer",
      icon: <FaShoppingCart className="w-5 h-5" />
    }
  ]

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <div className="py-16 lg:py-24 bg-linear-to-b from-white to-neutral-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-6">
            <FaQuestionCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-neutral-600">
            Get answers to common questions from both sellers and buyers
          </p>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-10">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-primary-600 mr-2"></div>
            <span className="text-sm font-medium text-neutral-700">Seller Questions</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-secondary-500 mr-2"></div>
            <span className="text-sm font-medium text-neutral-700">Buyer Questions</span>
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                activeIndex === index 
                  ? 'border-primary-300 shadow-lg' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    faq.type === 'seller' 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'bg-secondary-50 text-secondary-600'
                  }`}>
                    {faq.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        faq.type === 'seller'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-secondary-100 text-secondary-700'
                      }`}>
                        {faq.type === 'seller' ? 'For Sellers' : 'For Buyers'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {faq.question}
                    </h3>
                  </div>
                </div>
                <div className={`shrink-0 ml-4 transition-transform duration-300 ${
                  activeIndex === index ? 'rotate-180' : ''
                }`}>
                  <FaChevronDown className={`w-5 h-5 ${
                    faq.type === 'seller' ? 'text-primary-500' : 'text-secondary-500'
                  }`} />
                </div>
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ${
                  activeIndex === index 
                    ? 'py-4 max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className={`pl-14 pr-4 border-l-2 ${
                  faq.type === 'seller' 
                    ? 'border-l-primary-300 bg-primary-50' 
                    : 'border-l-secondary-300 bg-secondary-50'
                } rounded-r-lg py-3`}>
                  <p className="text-neutral-700 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <div className="bg-linear-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 border border-neutral-200">
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
              Our team is here to help both sellers and buyers. Contact us for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:seller-support@tiameds.ai" 
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                Email Seller Support
              </a>
              <a 
                href="mailto:buyer-support@tiameds.ai" 
                className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-lg transition-colors"
              >
                Email Buyer Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQS