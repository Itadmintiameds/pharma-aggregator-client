"use client";

import Header from "@/src/app/components/Header";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RequestType = "seller" | "buyer" | "lab";
type SortField = "requestId" | "name" | "email" | "date" | "status";
type SortOrder = "asc" | "desc";

// Add this type definition
type Request = {
  id: number;
  requestId: string;
  name: string;
  email: string;
  date: string;
  status: string;
};

const demoRequests: Request[] = [
  { id: 1, requestId: "REQ-1001", name: "ABC Pharma", email: "abc@pharma.com", date: "2026-01-18", status: "Open" },
  { id: 2, requestId: "REQ-1002", name: "XYZ Distributors", email: "xyz@dist.com", date: "2026-01-19", status: "In Progress" },
  { id: 3, requestId: "REQ-1003", name: "JKL Distributors", email: "jkl@dist.com", date: "2026-01-20", status: "Closed" },
  { id: 4, requestId: "REQ-1004", name: "PQR Distributors", email: "pqr@dist.com", date: "2026-01-20", status: "Closed" },
];

const buyerRequests: Request[] = [
  { id: 11, requestId: "BUY-2001", name: "ABC Buyers", email: "abc@buyers.com", date: "2026-01-21", status: "Open" },
  { id: 12, requestId: "BUY-2002", name: "XYZ Buyers", email: "xyz@buyers.com", date: "2025-11-08", status: "In Progress" },
  { id: 13, requestId: "BUY-2003", name: "JKL Buyers", email: "jkl@buyers.com", date: "2025-12-12", status: "Closed" },
];

const labRequests: Request[] = [
  { id: 21, requestId: "LAB-3001", name: "ABC Labs", email: "abc@lab.com", date: "2026-01-22", status: "Closed" },
  { id: 22, requestId: "LAB-3002", name: "XYZ Labs", email: "xyz@lab.com", date: "2025-12-12", status: "In Progress" },
  { id: 23, requestId: "LAB-3003", name: "JKL Labs", email: "jkl@lab.com", date: "2025-11-08", status: "Open" },
];

const SortIcon = ({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) => {
  if (sortField !== field) {
    return (
      <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  
  return sortOrder === "asc" ? (
    <svg className="w-4 h-4 ml-1 text-[#4B0082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 ml-1 text-[#4B0082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RequestType>("seller");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const handleLogout = () => {
    router.push("/admin_f6c29e3d/login");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getRequests = () => {
    let requests = activeTab === "seller" 
      ? demoRequests 
      : activeTab === "buyer" 
        ? buyerRequests 
        : labRequests;
    
    if (searchTerm) {
      requests = requests.filter(
        (req) =>
          req.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      requests = requests.filter((req) => req.status === statusFilter);
    }
    
    return [...requests].sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  return (
    <>
      <Header admin onLogout={handleLogout} />
      <main className="pt-10 bg-[#F7F2FB] min-h-screen px-5">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
            <section>
              <div className="px-10 pt-1">
                <div className="inline-flex bg-[#e9e2ff] p-1 rounded-lg shadow-sm">
                  {[
                    { key: "seller", label: "Seller" },
                    { key: "buyer", label: "Buyer" },
                    { key: "lab", label: "Lab" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as RequestType)}
                      className={`px-12 py-3 rounded-lg text-lg font-bold transition-all duration-300 ease-in-out transform
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
              <div className="p-4">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-[#2D0066] mb-2">
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

                <div className="mb-6 flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <svg
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by Request ID, Name, or Email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B0082] focus:border-transparent transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B0082] focus:border-transparent transition-all bg-white cursor-pointer font-medium text-gray-700"
                    >
                      <option value="All">All Status</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {(searchTerm || statusFilter !== "All") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("All");
                      }}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
                  <table className="w-full text-lg table-fixed">
                    <thead className="bg-[#faf7ff] text-[#2D0066]">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-4 text-left font-semibold text-gray-700 w-[140px]">Sl. No</th>
                        <th 
                          className="px-5 py-4 text-left font-semibold text-gray-700 w-[140px] cursor-pointer hover:bg-[#f0ebff] transition-colors select-none"
                          onClick={() => handleSort("requestId")}
                        >
                          <div className="flex items-center">
                            Request ID
                            <SortIcon field="requestId" sortField={sortField} sortOrder={sortOrder} />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-left font-semibold text-gray-700 w-[140px] cursor-pointer hover:bg-[#f0ebff] transition-colors select-none"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center">
                            Requestor Name
                            <SortIcon field="name" sortField={sortField} sortOrder={sortOrder} />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-left font-semibold text-gray-700 w-[140px] cursor-pointer hover:bg-[#f0ebff] transition-colors select-none"
                          onClick={() => handleSort("email")}
                        >
                          <div className="flex items-center">
                            Requestor Email ID
                            <SortIcon field="email" sortField={sortField} sortOrder={sortOrder} />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-left font-semibold text-gray-700 w-[140px] cursor-pointer hover:bg-[#f0ebff] transition-colors select-none"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center">
                            Date
                            <SortIcon field="date" sortField={sortField} sortOrder={sortOrder} />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-left font-semibold text-gray-700 w-[140px] cursor-pointer hover:bg-[#f0ebff] transition-colors select-none"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center">
                            Status
                            <SortIcon field="status" sortField={sortField} sortOrder={sortOrder} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRequests().length > 0 ? (
                        getRequests().map((item, index) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-[#F9F6FF] transition">
                            <td className="px-6 py-3 font-medium">{index + 1}</td>
                            <td className="px-6 py-3 w-[140px]">
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
                            <td className="px-6 py-3 font-medium">{item.name}</td>
                            <td className="px-6 py-3 font-medium">{item.email}</td>
                            <td className="px-6 py-3 font-medium">{item.date}</td>
                            <td className="px-6 py-3 font-medium">
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No requests found matching your search criteria
                          </td>
                        </tr>
                      )}
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