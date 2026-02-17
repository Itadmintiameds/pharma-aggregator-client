"use client";

import Header from "@/src/app/components/Header";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";

// ─── API ──────────────────────────────────────────────────────
const BASE_URL = "https://api-test-aggreator.tiameds.ai/api/v1";
const API_KEY  = "YOUR_API_KEY"; // 🔑 replace

// ─── Types ────────────────────────────────────────────────────
interface SellerDetail {
  tempSellerId: number;
  tempSellerRequestId: string;
  sellerName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  website: string;
  gstNumber: string;
  gstFileUrl: string;
  gstVerified: boolean;
  status: string;
  termsAccepted: boolean;
  companyType:  { companyTypeName: string };
  sellerType:   { sellerTypeName: string };
  productTypes: { productTypeId: number; productTypeName: string }[];
  address: {
    buildingNo: string; street: string; city: string;
    landmark: string;   pinCode: string;
    state:    { stateName: string };
    district: { districtName: string };
    taluka:   { talukaName: string };
  };
  coordinator: {
    name: string; designation: string;
    email: string; emailVerified: boolean;
    mobile: string; phoneVerified: boolean;
  };
  bankDetails: {
    bankName: string; branch: string; ifscCode: string;
    accountNumber: string; accountHolderName: string;
    bankDocumentFileUrl: string;
  };
  documents: {
    DocumentsId: number;
    documentNumber: string;
    documentFileUrl: string;
    documentVerified: boolean;
    licenseIssueDate: string;
    licenseExpiryDate: string;
    licenseIssuingAuthority: string;
    licenseStatus: string;
    productTypes: { productTypeName: string };
  }[];
}

// ─── Sub-components ───────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-purple-200 rounded-xl p-5">
      <h2 className="text-lg font-bold text-[#2D0066] mb-4 pb-2 border-b border-purple-100">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">{children}</div>
    </div>
  );
}

function Item({ label, value, verified }: { label: string; value?: string | null; verified?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-medium text-sm text-gray-800 flex items-center gap-2 flex-wrap">
        {value || "—"}
        {verified === true  && <span className="text-green-600 text-xs font-semibold">✔ Verified</span>}
        {verified === false && <span className="text-red-500  text-xs font-semibold">✗ Not Verified</span>}
      </p>
    </div>
  );
}

function FileItem({
  label, fileUrl, onView, isViewed, isVerified,
}: {
  label: string; fileUrl?: string;
  onView: () => void; isViewed: boolean; isVerified: boolean | null;
}) {
  if (!fileUrl) return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-gray-400 italic text-sm">Not uploaded</p>
    </div>
  );
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={onView}
          className="inline-flex items-center gap-1.5 text-[#4B0082] font-semibold hover:underline text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {isViewed ? "Re-view" : "View file"}
        </button>
        {isViewed && isVerified === true  && <span className="text-green-600 text-xs font-semibold">✔ Verified</span>}
        {isViewed && isVerified === false && <span className="text-red-500  text-xs font-semibold">✗ Rejected</span>}
        {isViewed && isVerified === null  && <span className="text-gray-400 text-xs">Pending decision</span>}
      </div>
    </div>
  );
}

function StatusItem({ label, status, highlight = false, error = false }: { label: string; status: string; highlight?: boolean; error?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-semibold text-sm ${error ? "text-red-600" : highlight ? "text-green-700" : "text-gray-700"}`}>{status}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border border-purple-100 rounded-xl p-5">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            {[...Array(6)].map((_, j) => (
              <div key={j}>
                <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-44 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium animate-fade-in
      ${type === "success" ? "bg-green-600" : "bg-red-600"}`}
    >
      {type === "success"
        ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
      {message}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
// No props needed — reads requestId from the URL path and sellerId from ?sellerId=
interface RequestDetailsProps {
  requestId: string; // passed from the [requestId] page — display only
}

export default function RequestDetails({ requestId }: RequestDetailsProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Read numeric sellerId from query string: ?sellerId=1
  const sellerId = Number(searchParams.get("sellerId") ?? 0);

  // Fetch state
  const [data,       setData]       = useState<SellerDetail | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal
  const [modalOpen,   setModalOpen]   = useState(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; label: string; fileKey: string } | null>(null);

  // Per-file verify state
  const [fileStates, setFileStates] = useState<Record<string, { viewed: boolean; verified: boolean | null }>>({});

  // Admin decision
  const [adminComment,     setAdminComment]     = useState("");
  const [showCommentError, setShowCommentError] = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [toast,            setToast]            = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch detail by sellerId (tempSellerId from URL) ──────────
  useEffect(() => {
    if (!sellerId) {
      setFetchError("Seller ID missing. Please go back and click a request from the list.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    const fetchDetail = async () => {
      try {
        const res = await fetch(`${BASE_URL}/temp-sellers/${sellerId}`, {
          headers: { "X-API-Key": API_KEY },
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        const json = await res.json();
        const detail: SellerDetail = json.data ?? json;

        if (cancelled) return;
        setData(detail);

        // Seed file verification state from API flags
        const init: Record<string, { viewed: boolean; verified: boolean | null }> = {
          gstFile:    { viewed: false, verified: detail.gstVerified ? true : null },
          chequeFile: { viewed: false, verified: null },
        };
        detail.documents?.forEach(doc => {
          init[`doc_${doc.DocumentsId}`] = {
            viewed: false,
            verified: doc.documentVerified ? true : null,
          };
        });
        setFileStates(init);
      } catch (err) {
        if (!cancelled)
          setFetchError(err instanceof Error ? err.message : "Failed to fetch seller details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [sellerId]);

  // ── Verification logic ─────────────────────────────────────────
  const allKeys = Object.keys(fileStates);

  const documentsVerified = useMemo(() => {
    const keys = allKeys.filter(k => k === "gstFile" || k.startsWith("doc_"));
    if (!keys.length) return { status: "Pending Verification", error: true };
    if (keys.every(k => fileStates[k]?.verified === true))  return { status: "Complete",             error: false };
    if (keys.some(k  => fileStates[k]?.verified === false)) return { status: "Rejected",             error: true  };
    return                                                         { status: "Pending Verification", error: true  };
  }, [fileStates, allKeys]);

  const bankVerified = useMemo(() => {
    const s = fileStates["chequeFile"];
    if (!s || s.verified === null) return { status: "Pending Verification", error: true  };
    if (s.verified === true)       return { status: "Complete",             error: false };
    return                                { status: "Rejected",             error: true  };
  }, [fileStates]);

  const canAccept = useMemo(
    () => allKeys.length > 0 && allKeys.every(k => fileStates[k]?.verified === true),
    [fileStates, allKeys]
  );

  // ── File viewer ────────────────────────────────────────────────
  const handleViewFile = (url: string, label: string, fileKey: string) => {
    setCurrentFile({ url, label, fileKey });
    setModalOpen(true);
    setFileStates(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], viewed: true } }));
  };

  const handleVerifyInModal = (verified: boolean) => {
    if (currentFile)
      setFileStates(prev => ({ ...prev, [currentFile.fileKey]: { ...prev[currentFile.fileKey], verified } }));
    setModalOpen(false);
  };

  // ── Review API ─────────────────────────────────────────────────
  // POST /api/v1/admin/sellers/review  →  { id, status, comments }
  const handleAction = async (action: "Accept" | "Reject" | "Correction") => {
    if (!adminComment.trim()) { setShowCommentError(true); return; }
    if (action === "Accept" && !canAccept) {
      showToast("Verify all documents before accepting.", "error");
      return;
    }
    setShowCommentError(false);
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/sellers/review`, {
        method: "POST",
        headers: {
          "X-API-Key":    API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id:       sellerId,   
          status:   action,     // "Accept" | "Reject" | "Correction"
          comments: adminComment,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? `${res.status} ${res.statusText}`);

      showToast(`Request ${action}ed successfully!`, "success");
      setTimeout(() => router.back(), 1800);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────
  const fullAddress = data
    ? [data.address?.buildingNo, data.address?.street, data.address?.landmark, data.address?.city, data.address?.pinCode]
        .filter(Boolean).join(", ")
    : "—";

  const statusBadgeClass = (s: string) => {
    const l = s?.toLowerCase();
    if (l === "open")              return "bg-yellow-50 text-yellow-700 ring-yellow-200";
    if (l?.includes("progress"))   return "bg-blue-50   text-blue-700   ring-blue-200";
    return                                "bg-green-50  text-green-700  ring-green-200";
  };
  const statusDotClass = (s: string) => {
    const l = s?.toLowerCase();
    if (l === "open")            return "bg-yellow-500";
    if (l?.includes("progress")) return "bg-blue-500";
    return                              "bg-green-500";
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <Header admin onLogout={() => router.push("/admin_f6c29e3d/login")} />

      <main className="pt-12 bg-[#F7F2FB] min-h-screen px-6 pb-10">
        <div className="max-w-5xl mx-auto">

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="fixed left-6 top-32 z-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-3 shadow-lg transition-all"
            aria-label="Go back"
          >
            <svg className="h-5 w-5 text-[#2D0066]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-8 space-y-5">

            {/* Page header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-3xl font-bold text-[#2D0066]">Final Verification Summary</h1>
                <p className="text-gray-500 mt-1 text-sm">Review all details before taking action</p>
              </div>
              {data && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${statusBadgeClass(data.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass(data.status)}`} />
                  {data.status?.charAt(0).toUpperCase() + data.status?.slice(1)}
                </span>
              )}
            </div>

            {/* Request ID pill */}
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Request ID</span>
              <span className="text-sm font-bold text-[#2D0066]">{requestId}</span>
            </div>

            {/* ── Loading / Error / Content ── */}
            {loading ? (
              <PageSkeleton />
            ) : fetchError ? (
              <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Failed to load seller details</p>
                  <p className="text-red-600 mt-0.5">{fetchError}</p>
                </div>
              </div>
            ) : data ? (
              <>
                {/* Company Details */}
                <Section title="Company Details">
                  <Item label="Phone" value={data.phone} />
                  <Item label="Email" value={data.email} />
                </Section>

                {/* Coordinator Details */}
                <Section title="Coordinator Details">
                  <Item label="Email"  value={data.coordinator?.email} />
                  <Item label="Mobile" value={data.coordinator?.mobile} />
                </Section>

                {/* Compliance Documents */}
                <Section title="Compliance Documents">
                  <Item label="GST Number" value={data.gstNumber} />
                  <FileItem
                    label="GST Certificate"
                    fileUrl={data.gstFileUrl}
                    onView={() => handleViewFile(data.gstFileUrl, "GST Certificate", "gstFile")}
                    isViewed={fileStates["gstFile"]?.viewed   ?? false}
                    isVerified={fileStates["gstFile"]?.verified ?? null}
                  />
                  {data.documents?.map(doc => (
                    <div
                      key={doc.DocumentsId}
                      className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 pt-4 mt-1 border-t border-purple-50"
                    >
                      <Item label="Document Type"     value={doc.productTypes?.productTypeName} />
                      <Item label="Document Number"   value={doc.documentNumber} />
                      <Item label="Issuing Authority" value={doc.licenseIssuingAuthority} />
                      <Item label="Issue Date"        value={doc.licenseIssueDate} />
                      <Item label="Expiry Date"       value={doc.licenseExpiryDate} />
                      <Item label="License Status"    value={doc.licenseStatus} />
                      <FileItem
                        label="License File"
                        fileUrl={doc.documentFileUrl}
                        onView={() => handleViewFile(doc.documentFileUrl, `License — ${doc.productTypes?.productTypeName}`, `doc_${doc.DocumentsId}`)}
                        isViewed={fileStates[`doc_${doc.DocumentsId}`]?.viewed   ?? false}
                        isVerified={fileStates[`doc_${doc.DocumentsId}`]?.verified ?? null}
                      />
                    </div>
                  ))}
                </Section>

                {/* Bank Details */}
                <Section title="Bank Account Details">
                  <Item label="Bank Name"           value={data.bankDetails?.bankName} />
                  <Item label="Branch"              value={data.bankDetails?.branch} />
                  <Item label="IFSC Code"           value={data.bankDetails?.ifscCode} />
                  <Item label="Account Number"      value={data.bankDetails?.accountNumber ? `****${data.bankDetails.accountNumber.slice(-4)}` : "—"} />
                  <Item label="Account Holder Name" value={data.bankDetails?.accountHolderName} />
                  <Item label="State"               value={data.address?.state?.stateName} />
                  <Item label="District"            value={data.address?.district?.districtName} />
                  <Item label="Taluka"              value={data.address?.taluka?.talukaName} />
                  <FileItem
                    label="Cancelled Cheque"
                    fileUrl={data.bankDetails?.bankDocumentFileUrl}
                    onView={() => handleViewFile(data.bankDetails.bankDocumentFileUrl, "Cancelled Cheque", "chequeFile")}
                    isViewed={fileStates["chequeFile"]?.viewed   ?? false}
                    isVerified={fileStates["chequeFile"]?.verified ?? null}
                  />
                </Section>

                {/* Validation Summary */}
                <Section title="Validation Summary">
                  <StatusItem label="Company Info" status="Complete" highlight />
                  <StatusItem label="Verification"  status="Complete" highlight />
                  <StatusItem label="Documents"     status={documentsVerified.status} error={documentsVerified.error} highlight={!documentsVerified.error} />
                  <StatusItem label="Bank Details"  status={bankVerified.status}      error={bankVerified.error}      highlight={!bankVerified.error} />
                  <StatusItem
                    label="Overall Status"
                    status={canAccept ? "Ready to Submit" : "Pending Verification"}
                    highlight={canAccept} error={!canAccept}
                  />
                </Section>

                {/* Admin Decision */}
                <div className="border border-purple-200 rounded-xl p-5">
                  <h2 className="text-lg font-bold text-[#2D0066] mb-4 pb-2 border-b border-purple-100">Admin Decision</h2>

                  {!canAccept && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-semibold text-amber-800 text-sm">Verification Incomplete</p>
                        <p className="text-amber-700 text-sm mt-0.5">View and verify all documents before accepting.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                        Comments <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={adminComment}
                        onChange={e => { setAdminComment(e.target.value); setShowCommentError(false); }}
                        placeholder="Enter your comments here..."
                        rows={4}
                        className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 transition-all resize-none bg-gray-50 focus:bg-white
                          ${showCommentError ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-[#4B0082]"}`}
                      />
                      {showCommentError && (
                        <p className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Please add a comment before taking action
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Select Action</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <button
                          onClick={() => handleAction("Accept")}
                          disabled={!canAccept || submitting}
                          className={`px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200
                            ${canAccept && !submitting
                              ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {submitting ? "Submitting…" : "Accept Request"}
                        </button>

                        <button
                          onClick={() => handleAction("Reject")}
                          disabled={submitting}
                          className="px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {submitting ? "Submitting…" : "Reject Request"}
                        </button>

                        <button
                          onClick={() => handleAction("Correction")}
                          disabled={submitting}
                          className="px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {submitting ? "Submitting…" : "Request Correction"}
                        </button>

                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

          </div>
        </div>
      </main>

      {/* File Viewer Modal */}
      {modalOpen && currentFile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2D0066]">{currentFile.label}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center min-h-[300px]">
              {currentFile.url.toLowerCase().endsWith(".pdf") ? (
                <iframe src={currentFile.url} className="w-full h-[60vh] rounded-lg border border-gray-200" title={currentFile.label} />
              ) : (
                <Image
                  src={currentFile.url} alt={currentFile.label}
                  width={800} height={600}
                  className="max-w-full h-auto object-contain rounded-lg shadow"
                  unoptimized
                />
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm">
                Cancel
              </button>
              <button
                onClick={() => handleVerifyInModal(true)}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Verify
              </button>
              <button
                onClick={() => handleVerifyInModal(false)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}