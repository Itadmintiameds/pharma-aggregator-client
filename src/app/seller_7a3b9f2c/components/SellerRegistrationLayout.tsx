"use client";

import React, { useEffect } from "react";
import SellerSidebar from "./SellerSidebar";

export default function SellerRegistrationLayout({
  step,
  children,
  hideSidebar = false,
}: {
  step: number
  children: React.ReactNode
  hideSidebar?: boolean
}) {
  // Scroll to top when step changes using window scroll
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [step]);

  if (hideSidebar) {
    return (
      <div className="bg-white overflow-visible">
        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen pt-12">
      <SellerSidebar step={step} />

      <div className="flex-1 bg-white overflow-visible">
        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}