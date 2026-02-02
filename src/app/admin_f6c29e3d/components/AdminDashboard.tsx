"use client";

import Header from "@/src/app/components/Header";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RequestType = "seller" | "buyer" | "lab";

const demoRequests = [
  { id: 1, requestId: "REQ-1001", name: "ABC Pharma", email: "abc@pharma.com", date: "2026-01-18", status: "Open" },
  { id: 2, requestId: "REQ-1002", name: "XYZ Distributors", email: "xyz@dist.com", date: "2026-01-19", status: "In Progress" },
  { id: 3, requestId: "REQ-1003", name: "JKL Distributors", email: "jkl@dist.com", date: "2026-01-20", status: "Closed" },
  { id: 4, requestId: "REQ-1004", name: "PQR Distributors", email: "pqr@dist.com", date: "2026-01-20", status: "Closed" },
];

const buyerRequests = [
  { id: 11, requestId: "BUY-2001", name: "ABC Buyers", email: "abc@buyers.com", date: "2026-01-21", status: "Open" },
  { id: 12, requestId: "BUY-2002", name: "XYZ Buyers", email: "xyz@buyers.com", date: "2025-11-08", status: "In Progress" },
  { id: 13, requestId: "BUY-2003", name: "JKL Buyers", email: "jkl@buyers.com", date: "2025-12-12", status: "Closed" },
];

const labRequests = [
  { id: 21, requestId: "LAB-3001", name: "ABC Labs", email: "abc@lab.com", date: "2026-01-22", status: "Closed" },
  { id: 22, requestId: "LAB-3002", name: "XYZ Labs", email: "xyz@lab.com", date: "2025-12-12", status: "In Progress" },
  { id: 23, requestId: "LAB-3003", name: "JKL Labs", email: "jkl@lab.com", date: "2025-11-08", status: "Open" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RequestType>("seller");

  const handleLogout = () => {
    router.push("/admin_f6c29e3d/login");
  };

  const getRequests = () => {
    if (activeTab === "seller") return demoRequests;
    if (activeTab === "buyer") return buyerRequests;
    return labRequests;
  };

  return (
    <>
      <Header admin onLogout={handleLogout} />
      <main className="pt-20 bg-[#F7F2FB] min-h-screen px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
            <section>
              <div className="px-10 pt-8">
                <div className="inline-flex bg-[#e9e2ff] p-1 rounded-full shadow-sm">
                  {[
                    { key: "seller", label: "Seller" },
                    { key: "buyer", label: "Buyer" },
                    { key: "lab", label: "Lab" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as RequestType)}
                      className={`px-8 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out transform
                        ${activeTab === tab.key
                          ? "bg-[#4B0082] text-white shadow-md scale-100"
                          : "text-[#4B0082] hover:bg-white/60 hover:scale-105"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-10">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-[#2D0066] mb-2">
                    {activeTab === "seller"
                      ? "Seller Requests"
                      : activeTab === "buyer"
                        ? "Buyer Requests"
                        : "Lab Module Requests"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Review and manage onboarding requests
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm table-fixed">
                    <thead className="bg-[#faf7ff] text-[#2D0066]">
                      <tr>
                        <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">Sl. No</th>
                        <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">Request ID</th>
                        <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">Requestor Name</th>
                        <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">Requestor Email ID</th>
                        <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">Date</th>
                        <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRequests().map((item, index) => (
                        <tr key={item.id} className="border-t hover:bg-[#F9F6FF] transition">
                          <td className="px-6 py-4 font-medium">{index + 1}</td>
                          <td className="px-6 py-4 w-[140px]">
                            <span
                              className="inline-block text-[#4B0082] font-semibold cursor-pointer transition-all hover:text-[#751bb5] hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin_f6c29e3d/requests/${item.requestId}`);
                              }}
                            >
                              {item.requestId}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{item.name}</td>
                          <td className="px-6 py-4 font-medium">{item.email}</td>
                          <td className="px-6 py-4 font-medium">{item.date}</td>
                          <td className="px-6 py-4 font-medium">
                            <span
                              className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold ${
                                item.status === "Open"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : item.status === "In Progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
