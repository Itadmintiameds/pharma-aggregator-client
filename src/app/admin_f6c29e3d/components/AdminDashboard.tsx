"use client";

import Header from "@/src/app/components/Header";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type RequestType = "seller" | "buyer" | "lab";
type SortField = "requestId" | "name" | "email" | "date" | "status";
type SortOrder = "asc" | "desc";

type Request = {
  id: number;        
  requestId: string;
  name: string;
  email: string;
  date: string;
  status: string;
};

// ─── API ──────────────────────────────────────────────────────
const SELLER_API_URL = "https://api-test-aggreator.tiameds.ai/api/v1/temp-sellers";
const API_KEY        = "YOUR_API_KEY";

const normalizeStatus = (raw: string): string => {
  const map: Record<string, string> = {
    APPROVED:    "Closed",
    IN_PROGRESS: "In Progress",
    INPROGRESS:  "In Progress",
    PENDING:     "Open",
    OPEN:        "Open",
    CLOSED:      "Closed",
  };
  return map[raw?.toUpperCase()] ?? raw;
};

// ─── Demo data ────────────────────────────────────────────────
const buyerRequests: Request[] = [
  { id: 11, requestId: "BUY-2001", name: "ABC Buyers", email: "abc@buyers.com", date: "2026-01-21", status: "Open"        },
  { id: 12, requestId: "BUY-2002", name: "XYZ Buyers", email: "xyz@buyers.com", date: "2025-11-08", status: "In Progress" },
  { id: 13, requestId: "BUY-2003", name: "JKL Buyers", email: "jkl@buyers.com", date: "2025-12-12", status: "Closed"      },
];
const labRequests: Request[] = [
  { id: 21, requestId: "LAB-3001", name: "ABC Labs", email: "abc@lab.com", date: "2026-01-22", status: "Closed"      },
  { id: 22, requestId: "LAB-3002", name: "XYZ Labs", email: "xyz@lab.com", date: "2025-12-12", status: "In Progress" },
  { id: 23, requestId: "LAB-3003", name: "JKL Labs", email: "jkl@lab.com", date: "2025-11-08", status: "Open"        },
];

// ─── Sort Icon ────────────────────────────────────────────────
const SortIcon = ({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) => {
  if (sortField !== field)
    return (
      <svg className="w-3.5 h-3.5 ml-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  return sortOrder === "asc" ? (
    <svg className="w-3.5 h-3.5 ml-1 text-[#4B0082] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5 ml-1 text-[#4B0082] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────
const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-gray-100">
        {[...Array(6)].map((_, j) => (
          <td key={j} className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${50 + j * 10}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ─── Main ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab,    setActiveTab]    = useState<RequestType>("seller");
  const [sortField,    setSortField]    = useState<SortField>("date");
  const [sortOrder,    setSortOrder]    = useState<SortOrder>("desc");
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [sellerRequests, setSellerRequests] = useState<Request[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerError,    setSellerError]    = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  // Re-fetch when window regains focus (user navigates back after Accept/Reject/Correction)
  useEffect(() => {
    const onFocus = () => setFetchTick(t => t + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // ── Fetch seller list ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "seller") return;
    let cancelled = false;

    const fetchSellers = async () => {
      setLoadingSellers(true);
      setSellerError(null);
      try {
        const res = await fetch(SELLER_API_URL, {
          headers: { "X-API-Key": API_KEY },
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        const json = await res.json();
        const list: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];

        if (cancelled) return;

        setSellerRequests(
          list.map((item) => ({
            id:        item.tempSellerId,
            requestId: item.tempSellerRequestId,
            name:      item.tempSellerName,
            email:     item.tempSellerEmail,
            date:      item.createdAt ? item.createdAt.split("T")[0] : "—",
            status:    normalizeStatus(item.status ?? ""),
          }))
        );
      } catch (err) {
        if (!cancelled)
          setSellerError(err instanceof Error ? err.message : "Failed to fetch sellers");
      } finally {
        if (!cancelled) setLoadingSellers(false);
      }
    };

    fetchSellers();
    return () => { cancelled = true; };
  }, [activeTab, fetchTick]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  const getRequests = (): Request[] => {
    let list =
      activeTab === "seller" ? sellerRequests :
      activeTab === "buyer"  ? buyerRequests  : labRequests;

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      list = list.filter(r =>
        r.requestId.toLowerCase().includes(t) ||
        r.name.toLowerCase().includes(t) ||
        r.email.toLowerCase().includes(t)
      );
    }
    if (statusFilter !== "All") list = list.filter(r => r.status === statusFilter);

    return [...list].sort((a, b) => {
      let av: string | number = a[sortField];
      let bv: string | number = b[sortField];
      if (sortField === "date") {
        av = new Date(av as string).getTime();
        bv = new Date(bv as string).getTime();
      }
      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ?  1 : -1;
      return 0;
    });
  };

  const isLoading  = activeTab === "seller" && loadingSellers;
  const hasError   = activeTab === "seller" && !!sellerError;
  const filtered   = getRequests();

  const columns: { field: SortField; label: string }[] = [
    { field: "requestId", label: "Request ID"      },
    { field: "name",      label: "Requestor Name"  },
    { field: "email",     label: "Requestor Email" },
    { field: "date",      label: "Date"             },
    { field: "status",    label: "Status"           },
  ];

  return (
    <>
      <Header admin onLogout={() => router.push("/admin_f6c29e3d/login")} />
      <main className="pt-10 bg-[#F7F2FB] min-h-screen px-5 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
            <section>

              {/* Tabs */}
              <div className="px-8 pt-5">
                <div className="inline-flex bg-[#e9e2ff] p-1 rounded-xl shadow-sm">
                  {[{ key: "seller", label: "Seller" }, { key: "buyer", label: "Buyer" }, { key: "lab", label: "Lab" }].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as RequestType)}
                      className={`px-10 py-2.5 rounded-lg text-base font-bold transition-all duration-200
                        ${activeTab === tab.key ? "bg-[#4B0082] text-white shadow-md" : "text-[#4B0082] hover:bg-white/60"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-8 py-6">

                {/* Title */}
                <div className="mb-5">
                  <h1 className="text-2xl font-bold text-[#2D0066]">
                    {activeTab === "seller" ? "Seller Requests" : activeTab === "buyer" ? "Buyer Requests" : "Lab Module Requests"}
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm">Review and manage onboarding requests</p>
                </div>

                {/* Search & Filter */}
                <div className="mb-5 flex flex-wrap gap-3 items-center">
                  <div className="flex-1 min-w-[260px] relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by Request ID, Name, or Email..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4B0082] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4B0082] bg-gray-50 focus:bg-white cursor-pointer font-medium text-gray-700 transition-all"
                    >
                      <option value="All">All Status</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {(searchTerm || statusFilter !== "All") && (
                    <button
                      onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-all"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Error */}
                {hasError && (
                  <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span><strong>Failed to load sellers:</strong> {sellerError}</span>
                  </div>
                )}

                {/* Table */}
                <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#faf7ff] border-b border-gray-100">
                          <th className="px-6 py-4 text-left font-semibold text-gray-500 w-16 whitespace-nowrap">Sl. No</th>
                          {columns.map(({ field, label }) => (
                            <th
                              key={field}
                              onClick={() => handleSort(field)}
                              className="px-6 py-4 text-left font-semibold text-gray-500 cursor-pointer hover:bg-[#f0ebff] transition-colors select-none whitespace-nowrap"
                            >
                              <div className="flex items-center">
                                {label}
                                <SortIcon field={field} sortField={sortField} sortOrder={sortOrder} />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {isLoading ? (
                          <TableSkeleton />
                        ) : filtered.length > 0 ? (
                          filtered.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-[#faf7ff] transition-colors">
                              <td className="px-6 py-4 text-gray-400 font-medium">{idx + 1}</td>

                              {/* ↓ passes both requestId (display) and sellerId (API) in the URL */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className="text-[#4B0082] font-semibold cursor-pointer hover:text-[#751bb5] hover:underline transition-all"
                                  onClick={() =>
                                    router.push(
                                      `/admin_f6c29e3d/requests/${item.requestId}?sellerId=${item.id}`
                                    )
                                  }
                                >
                                  {item.requestId}
                                </span>
                              </td>

                              <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{item.name}</td>

                              <td className="px-6 py-4">
                                <a
                                  href={`mailto:${item.email}`}
                                  className="text-gray-600 hover:text-[#4B0082] transition-colors"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {item.email}
                                </a>
                              </td>

                              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{item.date}</td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1
                                  ${item.status === "Open"        ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
                                  : item.status === "In Progress" ? "bg-blue-50   text-blue-700   ring-blue-200"
                                  :                                 "bg-green-50  text-green-700  ring-green-200"}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                                    ${item.status === "Open" ? "bg-yellow-500"
                                    : item.status === "In Progress" ? "bg-blue-500"
                                    : "bg-green-500"}`}
                                  />
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center gap-2 text-gray-400">
                                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium">
                                  {hasError ? "Could not load data. Please refresh." : "No requests found matching your criteria."}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                {!isLoading && (
                  <div className="mt-3 flex justify-between items-center text-xs text-gray-400 px-1">
                    <span>
                      {activeTab === "seller" && !hasError && sellerRequests.length > 0
                        ? `${sellerRequests.length} record${sellerRequests.length !== 1 ? "s" : ""} fetched`
                        : ""}
                    </span>
                    <span>
                      Showing {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                      {(searchTerm || statusFilter !== "All") && activeTab === "seller" && !hasError
                        ? ` of ${sellerRequests.length} total` : ""}
                    </span>
                  </div>
                )}

              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}