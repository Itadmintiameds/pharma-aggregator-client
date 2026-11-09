"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { HiOutlineBuildingOffice2, HiOutlineDocumentCheck } from "react-icons/hi2";
import { IoPersonOutline } from "react-icons/io5";
import { FaRegHandshake } from "react-icons/fa";

interface Props {
  step: number;
}

// Buyer's 5-step visual sidebar — a deliberate fork of
// src/app/seller_7a3b9f2c/components/SellerSidebar.tsx rather than a shared
// parameterized component: that file hardcodes seller's 5 step labels/icons
// inline the same way, so buyer gets its own copy with its own step list.
const steps = [
  {
    title: "Terms",
    description: "Accept Terms & Conditions",
    icon: FaRegHandshake,
  },
  {
    title: "Org Details",
    description: "Provide Your Organization Details",
    icon: HiOutlineBuildingOffice2,
  },
  {
    title: "Contact",
    description: "Add Contact Information and Verify",
    icon: IoPersonOutline,
  },
  {
    title: "Documents",
    description: "Upload Required Compliance Documents",
    icon: HiOutlineDocumentCheck,
  },
  {
    title: "Review",
    description: "Review Summary & Submit",
    icon: ShieldCheck,
  },
];

export default function BuyerSidebar({ step }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-05 rounded-lg shadow-md"
      >
        <span className="sr-only">Toggle Menu</span>
        <div className="w-5 h-0.5 bg-neutral-900 mb-1"></div>
        <div className="w-5 h-0.5 bg-neutral-900 mb-1"></div>
        <div className="w-5 h-0.5 bg-neutral-900"></div>
      </button>

      <div
        className={`
        fixed lg:sticky lg:top-0
        w-70 sm:w-[320px] lg:w-96
        h-screen
        bg-secondary-50
        p-4 sm:p-6 lg:p-8
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        z-40
        overflow-y-auto
        lg:overflow-y-hidden
      `}
      >
        <div className="h-full flex flex-col">
          <div className="mb-8 sm:mb-10 lg:mb-12 shrink-0">
            <h2 className="text-h4 font-heading font-medium text-pneutral-900 mb-3 sm:mb-4">
              <span className="hidden sm:inline">
                Buyer Onboarding &amp;
                <br />
                Compliance Registration
              </span>
              <span className="sm:hidden">Onboarding &amp; Registration</span>
            </h2>

            <p className="text-p3 font-body font-regular text-pneutral-900 leading-[28px]">
              <span className="hidden sm:inline">
                Complete the 5-step verification process to start sourcing on
                India&apos;s most secure B2B pharma marketplace.
              </span>
              <span className="sm:hidden">5-step verification to start sourcing.</span>
            </p>
          </div>

          <div className="relative flex-1">
            {steps.map((item, index) => {
              const stepNumber = index + 1;
              const isActive = step === stepNumber;
              const isCompleted = step > stepNumber;
              const Icon = item.icon;

              return (
                <div key={index} className="flex gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10 relative">
                  {index !== steps.length - 1 && (
                    <div
                      className={`absolute left-[19px] sm:left-[23px] top-[44px] sm:top-[52px]
                        w-1.25 sm:w-1 h-[44px] sm:h-[56px]
                        rounded-full opacity-60
                        ${step > index + 1 ? "bg-secondary-600" : "bg-primary-300"}`}
                    />
                  )}

                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-xl shadow-md
                      ${isActive ? "bg-primary-05" : isCompleted ? "bg-primary-30" : "bg-neutral-50"}`}
                  >
                    <Icon size={16} className="sm:w-5 sm:h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900 truncate">
                      {item.title}
                    </h3>
                    <p className="text-label-l2 font-heading font-light text-pneutral-900 leading-[18px]">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isMobileMenuOpen && (
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden absolute top-4 right-4 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  );
}
