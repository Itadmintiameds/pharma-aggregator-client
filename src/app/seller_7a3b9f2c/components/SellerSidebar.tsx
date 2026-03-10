"use client";

import React from "react";
import {
  Landmark,
  ShieldCheck
} from "lucide-react"
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { IoPersonOutline } from "react-icons/io5";
import { HiClipboardDocumentList } from "react-icons/hi2";

interface Props {
  step: number
}

const steps = [
  {
    title: "Company",
    description: "Provide Your Company Details",
    icon: HiOutlineBuildingOffice2,
  },
  {
    title: "Coordinator",
    description: "Add Coordinator Information and Verify",
    icon: IoPersonOutline,
  },
  {
    title: "Documents",
    description: "Upload Required Compliance Documents",
    icon: HiClipboardDocumentList,
  },
  {
    title: "Bank",
    description: "Enter Bank Account Details",
    icon: Landmark,
  },
  {
    title: "Review",
    description: "Review Summary & Submit",
    icon: ShieldCheck,
  },
]

export default function SellerSidebar({ step }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Menu Toggle Button - visible only on mobile */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-05 rounded-lg shadow-md"
      >
        <span className="sr-only">Toggle Menu</span>
        <div className="w-5 h-0.5 bg-neutral-900 mb-1"></div>
        <div className="w-5 h-0.5 bg-neutral-900 mb-1"></div>
        <div className="w-5 h-0.5 bg-neutral-900"></div>
      </button>

      {/* Sidebar - sticky on desktop, slide-in on mobile */}
      <div className={`
        fixed lg:sticky lg:top-0
        w-70 sm:w-[320px] lg:w-96
        h-screen
        bg-primary-05 
        p-4 sm:p-6 lg:p-8
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        z-40
        overflow-y-auto
        lg:overflow-y-hidden
      `}>
        
        {/* Content wrapper - allows scrolling on mobile if needed */}
        <div className="h-full flex flex-col">
          {/* Title Section - responsive text */}
          <div className="mb-8 sm:mb-10 lg:mb-12 shrink-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-3 sm:mb-4">
              <span className="hidden sm:inline">
                Seller Onboarding &
                <br />
                Compliance Registration
              </span>
              <span className="sm:hidden">
                Onboarding & Registration
              </span>
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed text-neutral-700">
              <span className="hidden sm:inline">
                Complete the 5-step verification process to start trading on
                India&apos;s most secure B2B pharma marketplace.
              </span>
              <span className="sm:hidden">
                5-step verification to start trading.
              </span>
            </p>
          </div>

          {/* Steps - non-scrollable */}
          <div className="relative flex-1">
            {steps.map((item, index) => {
              const stepNumber = index + 1;
              const isActive = step === stepNumber;
              const isCompleted = step > stepNumber;
              const Icon = item.icon;

              return (
                <div key={index} className="flex gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10 relative">
                  
                  {/* Vertical line - responsive positioning */}
                  {index !== steps.length - 1 && (
                    <div className="absolute left-5.5 sm:left-6.5 top-11 sm:top-13 w-0.75 sm:w-[4px] h-12 sm:h-15 bg-primary-30 rounded-full opacity-60" />
                  )}

                  {/* Icon Box - responsive sizing */}
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-xl shadow-md
                    ${
                      isActive
                        ? "bg-primary-05"
                        : isCompleted
                        ? "bg-primary-30"
                        : "bg-neutral-50"
                    }`}
                  >
                    <Icon size={16} className="sm:w-5 sm:h-5" />
                  </div>

                  {/* Text - responsive typography */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold text-sm sm:text-base truncate
                      ${isActive ? "text-neutral-900" : "text-gray-800"}`}
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-neutral-700 line-clamp-2 sm:line-clamp-none">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Close Button - visible only when mobile menu is open */}
        {isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Overlay for mobile - appears when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
