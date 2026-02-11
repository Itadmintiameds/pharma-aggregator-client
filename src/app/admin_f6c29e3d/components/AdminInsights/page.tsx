"use client";

import Header from "@/src/app/components/Header";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TimeRange = "today" | "week" | "month" | "year";

interface Request {
  id: number;
  requestId: string;
  name: string;
  email: string;
  date: string;
  status: "Open" | "In Progress" | "Closed";
}

interface RequestWithType extends Request {
  type: string;
}

// Mock data
const demoRequests: Request[] = [
  { id: 1, requestId: "REQ-1001", name: "ABC Pharma", email: "abc@pharma.com", date: "2026-02-09", status: "Open" },
  { id: 2, requestId: "REQ-1002", name: "XYZ Distributors", email: "xyz@dist.com", date: "2026-02-08", status: "In Progress" },
  { id: 3, requestId: "REQ-1003", name: "JKL Distributors", email: "jkl@dist.com", date: "2026-02-01", status: "Closed" },
  { id: 4, requestId: "REQ-1004", name: "PQR Distributors", email: "pqr@dist.com", date: "2026-01-20", status: "Closed" },
  { id: 5, requestId: "REQ-1005", name: "MNO Pharma", email: "mno@pharma.com", date: "2026-01-15", status: "Open" },
];

const buyerRequests: Request[] = [
  { id: 11, requestId: "BUY-2001", name: "ABC Buyers", email: "abc@buyers.com", date: "2026-02-08", status: "Open" },
  { id: 12, requestId: "BUY-2002", name: "XYZ Buyers", email: "xyz@buyers.com", date: "2026-02-05", status: "In Progress" },
  { id: 13, requestId: "BUY-2003", name: "JKL Buyers", email: "jkl@buyers.com", date: "2026-01-28", status: "Closed" },
  { id: 14, requestId: "BUY-2004", name: "DEF Buyers", email: "def@buyers.com", date: "2026-01-10", status: "Closed" },
];

const labRequests: Request[] = [
  { id: 21, requestId: "LAB-3001", name: "ABC Labs", email: "abc@lab.com", date: "2026-02-07", status: "Closed" },
  { id: 22, requestId: "LAB-3002", name: "XYZ Labs", email: "xyz@lab.com", date: "2026-02-03", status: "In Progress" },
  { id: 23, requestId: "LAB-3003", name: "JKL Labs", email: "jkl@lab.com", date: "2026-01-25", status: "Open" },
];

// Component declared outside - StatCard
const StatCard = ({ 
  title, 
  total, 
  open, 
  inProgress, 
  closed, 
  color 
}: { 
  title: string; 
  total: number; 
  open: number; 
  inProgress: number; 
  closed: number; 
  color: string;
}) => (
  <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-200 p-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
      <div className={`w-12 h-12 rounded-full ${color} bg-opacity-10 flex items-center justify-center`}>
        <svg className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold text-[#2D0066]">{total}</span>
        <span className="text-sm text-gray-500">Total Requests</span>
      </div>
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Open</span>
          <span className="font-semibold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">{open}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">In Progress</span>
          <span className="font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{inProgress}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Closed</span>
          <span className="font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">{closed}</span>
        </div>
      </div>
    </div>
  </div>
);

// Component declared outside - RecentActivity
const RecentActivity = ({ 
  requests 
}: { 
  requests: RequestWithType[] 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-[#2D0066] mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.requestId} className="flex items-center justify-between p-3 bg-[#F9F6FF] rounded-xl hover:bg-[#f0ebff] transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#4B0082]">{req.requestId}</span>
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{req.type}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{req.name}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                req.status === "Open"
                  ? "bg-yellow-100 text-yellow-800"
                  : req.status === "In Progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
              }`}>
                {req.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">{req.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminInsights() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const handleLogout = () => {
    router.push("/admin_f6c29e3d/login");
  };

  // Filter requests by time range
  const filterByTimeRange = (requests: Request[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return requests.filter(req => {
      const reqDate = new Date(req.date);
      
      if (timeRange === "today") {
        return reqDate >= today;
      } else if (timeRange === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return reqDate >= weekAgo;
      } else if (timeRange === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return reqDate >= monthAgo;
      } else if (timeRange === "year") {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return reqDate >= yearAgo;
      }
      return true;
    });
  };

  const getStats = () => {
    const sellers = filterByTimeRange(demoRequests);
    const buyers = filterByTimeRange(buyerRequests);
    const labs = filterByTimeRange(labRequests);
    
    const allRequests = [...sellers, ...buyers, ...labs];

    return {
      sellers: {
        total: sellers.length,
        open: sellers.filter(r => r.status === "Open").length,
        inProgress: sellers.filter(r => r.status === "In Progress").length,
        closed: sellers.filter(r => r.status === "Closed").length,
      },
      buyers: {
        total: buyers.length,
        open: buyers.filter(r => r.status === "Open").length,
        inProgress: buyers.filter(r => r.status === "In Progress").length,
        closed: buyers.filter(r => r.status === "Closed").length,
      },
      labs: {
        total: labs.length,
        open: labs.filter(r => r.status === "Open").length,
        inProgress: labs.filter(r => r.status === "In Progress").length,
        closed: labs.filter(r => r.status === "Closed").length,
      },
      overall: {
        total: allRequests.length,
        open: allRequests.filter(r => r.status === "Open").length,
        inProgress: allRequests.filter(r => r.status === "In Progress").length,
        closed: allRequests.filter(r => r.status === "Closed").length,
      }
    };
  };

  const stats = getStats();

  // Get recent activity data
  const getRecentActivity = (): RequestWithType[] => {
    const allRequests = [
      ...filterByTimeRange(demoRequests).map(r => ({ ...r, type: "Seller" })),
      ...filterByTimeRange(buyerRequests).map(r => ({ ...r, type: "Buyer" })),
      ...filterByTimeRange(labRequests).map(r => ({ ...r, type: "Lab" }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    
    return allRequests;
  };

  const recentRequests = getRecentActivity();

  return (
    <>
      <Header admin onLogout={handleLogout} />
      <main className="pt-10 bg-[#F7F2FB] min-h-screen px-5 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-[#2D0066] mb-2">Admin Insights</h1>
                  <p className="text-gray-600">Overview of all requests across modules</p>
                </div>
                
                {/* Time Range Filter */}
                <div className="inline-flex bg-[#e9e2ff] p-1 rounded-full shadow-sm">
                  {[
                    { key: "today", label: "Today" },
                    { key: "week", label: "Week" },
                    { key: "month", label: "Month" },
                    { key: "year", label: "Year" },
                  ].map((range) => (
                    <button
                      key={range.key}
                      onClick={() => setTimeRange(range.key as TimeRange)}
                      className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out transform
                        ${timeRange === range.key
                          ? "bg-[#4B0082] text-white shadow-md scale-100"
                          : "text-[#4B0082] hover:bg-white/60 hover:scale-105"
                        }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Overall Summary Card */}
            <div className="mb-8 bg-gradient-to-r from-[#2D0066] to-[#4B0082] rounded-2xl p-8 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Overall Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">{stats.overall.total}</p>
                  <p className="text-purple-200">Total Requests</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">{stats.overall.open}</p>
                  <p className="text-purple-200">Open</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">{stats.overall.inProgress}</p>
                  <p className="text-purple-200">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">{stats.overall.closed}</p>
                  <p className="text-purple-200">Closed</p>
                </div>
              </div>
            </div>

            {/* Module Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Seller Requests"
                total={stats.sellers.total}
                open={stats.sellers.open}
                inProgress={stats.sellers.inProgress}
                closed={stats.sellers.closed}
                color="bg-purple-600"
              />
              <StatCard
                title="Buyer Requests"
                total={stats.buyers.total}
                open={stats.buyers.open}
                inProgress={stats.buyers.inProgress}
                closed={stats.buyers.closed}
                color="bg-purple-600"
              />
              <StatCard
                title="Lab Requests"
                total={stats.labs.total}
                open={stats.labs.open}
                inProgress={stats.labs.inProgress}
                closed={stats.labs.closed}
                color="bg-purple-600"
              />
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivity requests={recentRequests} />
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-[#2D0066] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/admin_f6c29e3d/dashboard")}
                    className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 text-[#4B0082] rounded-xl font-medium transition-all flex items-center justify-between group"
                  >
                    <span>View All Requests</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push("/admin_f6c29e3d/reports")}
                    className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-all flex items-center justify-between group"
                  >
                    <span>Generate Report</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push("/admin_f6c29e3d/settings")}
                    className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-medium transition-all flex items-center justify-between group"
                  >
                    <span>Settings</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}