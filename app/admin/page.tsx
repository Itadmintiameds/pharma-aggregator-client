"use client";

import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";

const demoRequests = [
  {
    id: 1,
    requestId: "REQ-1001",
    name: "ABC Pharma",
    email: "abc@pharma.com",
    date: "2026-01-18",
    status: "Open",
  },
  {
    id: 2,
    requestId: "REQ-1002",
    name: "XYZ Distributors",
    email: "xyz@dist.com",
    date: "2026-01-19",
    status: "In Progress",
  },
  {
    id: 3,
    requestId: "REQ-1003",
    name: "JKL Distributors",
    email: "jkl@dist.com",
    date: "2026-01-20",
    status: "Closed",
  },
  {
    id: 4,
    requestId: "REQ-1004",
    name: "PQR Distributors",
    email: "pqr@dist.com",
    date: "2026-01-20",
    status: "Closed",
  },
];

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/admin/login");
  };

  return (
    <>
      <Header showLogout onLogout={handleLogout} />

      {/* Page background */}
      <main className="pt-20 bg-[#F7F2FB] min-h-screen px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* NEW: Main white container */}
          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10">

            <section>

              {/* Page Title */}
              <div className="mb-10">
                <h1 className="text-4xl font-bold text-[#2D0066] mb-2">
                  Seller / Buyer Requests
                </h1>
                <p className="text-gray-600 mt-1">
                  Review and manage seller & buyer onboarding requests
                </p>
              </div>

              {/* Table Card (unchanged) */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-200 overflow-hidden">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-[#faf7ff] text-[#2D0066]">
                    <tr>
                      <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">
                        Sl. No
                      </th>
                      <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">
                        Request ID
                      </th>
                      <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">
                        Requestor Name
                      </th>
                      <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">
                        Requestor Email ID
                      </th>
                      <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">
                        Date
                      </th>
                      <th className="px-6 py-6 text-left font-semibold text-gray-700 w-[140px]">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {demoRequests.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-t hover:bg-[#F9F6FF] transition"
                      >
                        <td className="px-6 py-4 font-medium">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 w-[140px]">
                          <span
                            className="inline-block text-[#4B0082] font-semibold cursor-pointer transition-all hover:text-[#751bb5] hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/requests/${item.requestId}`);
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

            </section>
          </div>
        </div>
      </main>
    </>
  );
}
