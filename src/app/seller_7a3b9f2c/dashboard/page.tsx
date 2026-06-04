
"use client";

import React, { useState } from "react";
import DashboardOverview from "./components/DashboardOverview";
import { DashboardView } from "@/src/types/seller/dashboard";


export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<DashboardView>("overview");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  return (
    <DashboardOverview
      currentView={currentView}
      setCurrentView={setCurrentView}
      selectedProductId={selectedProductId || ""}
      setSelectedProductId={setSelectedProductId}
    />
  );
}




// old code dated 03.06.2026...........without refresh token logic
// "use client";

// import React, { useState } from "react";
// import DashboardOverview from "./components/DashboardOverview";
// import { DashboardView } from "@/src/types/seller/dashboard";

// export default function DashboardPage() {
//   const [currentView, setCurrentView] = useState<DashboardView>("overview");
//   const [selectedProductId, setSelectedProductId] = useState<string | null>(null);


//   return (
//     <DashboardOverview
//       currentView={currentView}
//       setCurrentView={setCurrentView}
//       selectedProductId={selectedProductId || ""}
//       setSelectedProductId={setSelectedProductId}
//     />
//   );
// }





// "use client";

// import React, { useState, useEffect } from "react";
// import DashboardOverview from "./components/DashboardOverview";
// import { DashboardView } from "@/src/types/seller/dashboard";
// import CommonLoader from "../../commonComponents/CommonLoader";


// export default function DashboardPage() {
//   const [currentView, setCurrentView] = useState<DashboardView>("overview");
//   const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsLoading(false);
//     }, 1000);

//     return () => clearTimeout(timer);
//   }, []);

//   if (isLoading) {
//     return (
//       <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
//         <CommonLoader />
//       </div>
//     );
//   }

//   return (
//     <DashboardOverview
//       currentView={currentView}
//       setCurrentView={setCurrentView}
//       selectedProductId={selectedProductId || ""}
//       setSelectedProductId={setSelectedProductId}
//     />
//   );
// }




// old code without loader........

// "use client";

// import React, { useState } from "react";
// import DashboardOverview from "./components/DashboardOverview";
// import { DashboardView } from "@/src/types/seller/dashboard";

// export default function DashboardPage() {
//   const [currentView, setCurrentView] = useState<DashboardView>("overview");
//   const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

//   return (
//     <DashboardOverview
//       currentView={currentView}
//       setCurrentView={setCurrentView}
//       selectedProductId={selectedProductId || ""}
//       setSelectedProductId={setSelectedProductId}
//     />
//   );
// }