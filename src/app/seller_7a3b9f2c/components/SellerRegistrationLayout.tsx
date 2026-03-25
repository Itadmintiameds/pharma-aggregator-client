"use client";

import React, { useEffect } from "react";
import SellerSidebar from "./SellerSidebar";

export default function SellerRegistrationLayout({
  step,
  children
}: {
  step: number
  children: React.ReactNode
}) {
  // Scroll to top when step changes using window scroll
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [step]);

  return (
    <div className="flex min-h-screen">
      <SellerSidebar step={step} />
      
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}





// "use client";

// import React, { useEffect, useRef } from "react";
// import SellerSidebar from "./SellerSidebar";

// export default function SellerRegistrationLayout({
//   step,
//   children
// }: {
//   step: number
//   children: React.ReactNode
// }) {
//   const scrollContainerRef = useRef<HTMLDivElement>(null)

//   // Scroll to top when step changes
//   useEffect(() => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollTop = 0
//     }
//   }, [step])

//   return (
//     <div className="flex h-screen overflow-hidden">
//       <SellerSidebar step={step} />
      
//       {/* Scrollable content area */}
//       <div 
//         ref={scrollContainerRef}
//         className="flex-1 bg-white overflow-y-auto"
//       >
//         <div className="p-4 sm:p-6 lg:p-10">
//           {children}
//         </div>
//       </div>
//     </div>
//   )
// }








// "use client"

// import SellerSidebar from "./SellerSidebar"

// export default function SellerRegistrationLayout({
//   step,
//   children
// }: {
//   step: number
//   children: React.ReactNode
// }) {

//   return (
//     <div className="flex h-screen overflow-hidden">
//       <SellerSidebar step={step} />
      
//       {/* Scrollable content area */}
//       <div className="flex-1 bg-white overflow-y-auto">
//         <div className="p-4 sm:p-6 lg:p-10">
//           {children}
//         </div>
//       </div>
//     </div>
//   )
// }