"use client"

import SellerSidebar from "./SellerSidebar"

export default function SellerRegistrationLayout({
  step,
  children
}: {
  step: number
  children: React.ReactNode
}) {

  return (
    <div className="flex h-screen overflow-hidden">
      <SellerSidebar step={step} />
      
      {/* Scrollable content area */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}










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

//     <div className="flex">

//       <SellerSidebar step={step} />

//       <div className="flex-1 bg-gray-50 p-10">
//         {children}
//       </div>

//     </div>

//   )

// }