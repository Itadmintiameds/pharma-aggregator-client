"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  User, 
  FileText,
  LogOut
} from "lucide-react";
import toast from "react-hot-toast";

interface SellerSidebarProps {
  currentView: string;
  setCurrentView: (view: "overview" | "profile" | "reports") => void;
}

const SellerSidebar = ({ currentView, setCurrentView }: SellerSidebarProps) => {
  const router = useRouter();

  const menuItems = [
    {
      id: "overview",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: "profile",
      label: "Seller Profile",
      icon: <User size={20} />,
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileText size={20} />,
    },
  ];

  const handleLogout = () => {
    toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-base-white border-r border-neutral-100 p-4 flex flex-col">
      {/* Navigation Menu */}
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              currentView === item.id
                ? "bg-primary-900 text-white"
                : "text-neutral-600 hover:bg-primary-05 hover:text-primary-900"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button at Bottom */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-warning-600 hover:bg-warning-50 transition-all mt-auto border-t border-neutral-100 pt-4"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default SellerSidebar;








// "use client";

// import React from "react";
// import { 
//   LayoutDashboard, 
//   User, 
//   BarChart3, 
//   FileText,
//   Package,
//   AlertCircle
// } from "lucide-react";

// interface SellerSidebarProps {
//   currentView: string;
//   setCurrentView: (view: "overview" | "profile" | "reports") => void;
// }

// const SellerSidebar = ({ currentView, setCurrentView }: SellerSidebarProps) => {
//   const menuItems = [
//     {
//       id: "overview",
//       label: "Dashboard",
//       icon: <LayoutDashboard size={20} />,
//     },
//     {
//       id: "profile",
//       label: "Seller Profile",
//       icon: <User size={20} />,
//     },
//     {
//       id: "reports",
//       label: "Reports",
//       icon: <FileText size={20} />,
//     },
//   ];

//   return (
//     <aside className="fixed left-0 top-16 bottom-0 w-64 bg-base-white border-r border-neutral-100 p-4">
//       <nav className="space-y-2">
//         {menuItems.map((item) => (
//           <button
//             key={item.id}
//             onClick={() => setCurrentView(item.id as any)}
//             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
//               currentView === item.id
//                 ? "bg-primary-900 text-white"
//                 : "text-neutral-600 hover:bg-primary-05 hover:text-primary-900"
//             }`}
//           >
//             {item.icon}
//             <span>{item.label}</span>
//           </button>
//         ))}
//       </nav>

//       {/* Inventory Alerts - Quick View */}
//       <div className="absolute bottom-4 left-4 right-4">
//         <div className="bg-warning-50 p-3 rounded-lg border border-warning-100">
//           <div className="flex items-center gap-2 mb-2">
//             <AlertCircle size={16} className="text-warning-600" />
//             <span className="text-xs font-semibold text-warning-700">Inventory Alerts</span>
//           </div>
//           <div className="space-y-1">
//             <p className="text-xs text-neutral-600">• 5 products low in stock</p>
//             <p className="text-xs text-neutral-600">• 3 products nearing expiry</p>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// };

// export default SellerSidebar;