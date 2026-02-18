"use client";

import Header from "@/src/app/components/Header";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────
const BASE_URL        = "https://api-test-aggreator.tiameds.ai/api/v1";
const API_KEY         = "YOUR_API_KEY";
const LOCAL_GST_DOC   = "/assets/docs/gst-certificate.png";
const LOCAL_CHEQUE    = "/assets/docs/cheque.jpg";
const LOCAL_LICENSE   = "/assets/docs/license-file.png";

const STATUS_MAP: Record<string, string> = {
  APPROVED: "Closed", CLOSED: "Closed", REJECTED: "Rejected",
  IN_PROGRESS: "In Progress", INPROGRESS: "In Progress",
  PENDING: "Open", OPEN: "Open",
  CORRECTION: "Corrections Needed", CORRECTION_REQUIRED: "Corrections Needed",
  CORRECTIONS_NEEDED: "Corrections Needed", CORRECTIONREQUIRED: "Corrections Needed",
};

const DECISION_CONFIG = {
  Accept:     { label: "Closed",             badgeClass: "bg-green-50 text-green-700 ring-green-200", dotClass: "bg-green-500" },
  Reject:     { label: "Rejected",           badgeClass: "bg-red-50 text-red-700 ring-red-200",       dotClass: "bg-red-500"   },
  Correction: { label: "Corrections Needed", badgeClass: "bg-amber-50 text-amber-700 ring-amber-200", dotClass: "bg-amber-500" },
} as const;

// ─── Types ────────────────────────────────────────────────────
type Decision = "Accept" | "Reject" | "Correction" | null;
type FileStateMap = Record<string, { viewed: boolean; verified: boolean | null }>;

interface Doc {
  DocumentsId: number; documentNumber: string; documentFileUrl: string;
  documentVerified: boolean; licenseIssueDate: string; licenseExpiryDate: string;
  licenseIssuingAuthority: string; licenseStatus: string;
  productTypes: { productTypeName: string };
}
interface SellerDetail {
  tempSellerId: number; tempSellerRequestId: string; sellerName: string;
  email: string; emailVerified: boolean; phone: string; phoneVerified: boolean;
  website: string; gstNumber: string; gstFileUrl: string; gstVerified: boolean;
  status: string; termsAccepted: boolean;
  companyType: { companyTypeName: string }; sellerType: { sellerTypeName: string };
  productTypes: { productTypeId: number; productTypeName: string }[];
  address: { buildingNo: string; street: string; city: string; landmark: string; pinCode: string;
    state: { stateName: string }; district: { districtName: string }; taluka: { talukaName: string } };
  coordinator: { name: string; designation: string; email: string; emailVerified: boolean; mobile: string; phoneVerified: boolean };
  bankDetails: { bankName: string; branch: string; ifscCode: string; accountNumber: string; accountHolderName: string; bankDocumentFileUrl: string };
  documents: Doc[];
}

// ─── Dummy data ───────────────────────────────────────────────
const DUMMY: SellerDetail = {
  tempSellerId: 0, tempSellerRequestId: "REQ-DEMO", sellerName: "Demo Pharma Pvt. Ltd.",
  email: "demo@pharmademo.com", emailVerified: true, phone: "+91 98765 43210", phoneVerified: true,
  website: "www.pharmademo.com", gstNumber: "27AABCU9603R1ZX", gstFileUrl: "", gstVerified: false,
  status: "open", termsAccepted: true,
  companyType: { companyTypeName: "Private Limited" }, sellerType: { sellerTypeName: "Buyer / Lab" },
  productTypes: [{ productTypeId: 1, productTypeName: "Drugs" }],
  address: { buildingNo: "42", street: "MG Road", city: "Pune", landmark: "Near City Mall", pinCode: "411001",
    state: { stateName: "Maharashtra" }, district: { districtName: "Pune" }, taluka: { talukaName: "Haveli" } },
  coordinator: { name: "Rahul Sharma", designation: "Manager", email: "rahul@pharmademo.com", emailVerified: true, mobile: "+91 91234 56789", phoneVerified: true },
  bankDetails: { bankName: "State Bank of India", branch: "MG Road Branch", ifscCode: "SBIN0001234", accountNumber: "00112233445566", accountHolderName: "Demo Pharma Pvt. Ltd.", bankDocumentFileUrl: "" },
  documents: [{ DocumentsId: 1, documentNumber: "DL-MH-2024-001", documentFileUrl: "", documentVerified: false,
    licenseIssueDate: "2024-01-15", licenseExpiryDate: "2026-01-14", licenseIssuingAuthority: "FDA Maharashtra",
    licenseStatus: "Active", productTypes: { productTypeName: "Drugs" } }],
};

// ─── Helpers ──────────────────────────────────────────────────
const normalizeStatus = (raw: string) => STATUS_MAP[raw?.toUpperCase()] ?? raw;

const formatDate = (s: string): string => {
  if (!s || s === "—") return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
};

const decisionFromStatus = (status: string): Decision => {
  const n = normalizeStatus(status);
  if (n === "Closed")             return "Accept";
  if (n === "Rejected")           return "Reject";
  if (n === "Corrections Needed") return "Correction";
  return null;
};

const buildFileStates = (detail: SellerDetail, decision: Decision): FileStateMap => {
  const accepted = decision === "Accept";
  const locked   = accepted || decision === "Reject";
  const init: FileStateMap = {
    gstFile:    { viewed: locked, verified: accepted ? true : (detail.gstVerified === true ? true : null) },
    chequeFile: { viewed: locked, verified: accepted ? true : null },
  };
  detail.documents?.forEach(doc => {
    init[`doc_${doc.DocumentsId}`] = {
      viewed: locked,
      verified: accepted ? true : (doc.documentVerified === true ? true : null),
    };
  });
  return init;
};

// ─── Sub-components ───────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-purple-200 rounded-xl p-5">
      <h2 className="text-lg font-bold text-[#2D0066] mb-4 pb-2 border-b border-purple-100">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">{children}</div>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-medium text-sm text-gray-800">{value || "—"}</p>
    </div>
  );
}

function FileItem({ label, fileUrl, onView, isViewed, isVerified, isLocked }: {
  label: string; fileUrl?: string; onView: () => void;
  isViewed: boolean; isVerified: boolean | null; isLocked: boolean;
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
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onView} className="inline-flex items-center gap-1.5 text-[#4B0082] font-semibold hover:underline text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {isViewed ? "Re-view" : "View file"}
        </button>
        {isVerified === true  && <span className="text-green-600 text-xs font-semibold">✔ Verified</span>}
        {isVerified === false && <span className="text-red-500 text-xs font-semibold">✗ Rejected</span>}
        {isLocked && (
          <span className="inline-flex items-center gap-1 text-gray-400 text-xs italic">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Locked
          </span>
        )}
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
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border border-purple-100 rounded-xl p-5">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            {Array.from({ length: 6 }, (_, j) => (
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
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
      </svg>
      {message}
    </div>
  );
}

function ActionButton({ action, label, icon, submittingAction, disabled, onClick }: {
  action: string; label: string; icon: React.ReactNode; submittingAction: Decision;
  disabled: boolean; onClick: () => void;
}) {
  const isSubmitting = submittingAction === action;
  const colorClass =
    action === "Accept"     ? "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" :
    action === "Reject"     ? "from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" :
                              "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700";
  return (
    <button onClick={onClick} disabled={disabled || isSubmitting}
      className={`px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200
        ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : `bg-gradient-to-r ${colorClass} text-white shadow-md hover:shadow-lg hover:-translate-y-0.5`}`}>
      {isSubmitting
        ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
        : icon}
      {isSubmitting ? "Submitting…" : label}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function RequestDetails({ requestId }: { requestId: string }) {
  const router      = useRouter();
  const sellerId    = Number(useSearchParams().get("sellerId") ?? 0);

  const [data,              setData]              = useState<SellerDetail | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [fileStates,        setFileStates]        = useState<FileStateMap>({});
  const [lockedFileStates,  setLockedFileStates]  = useState<FileStateMap | null>(null);
  const [submittedDecision, setSubmittedDecision] = useState<Decision>(null);
  const [modalOpen,         setModalOpen]         = useState(false);
  const [currentFile,       setCurrentFile]       = useState<{ url: string; label: string; fileKey: string } | null>(null);
  const [adminComment,      setAdminComment]      = useState("");
  const [showCommentError,  setShowCommentError]  = useState(false);
  const [submittingAction,  setSubmittingAction]  = useState<Decision>(null);
  const [toast,             setToast]             = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isLocked        = submittedDecision === "Accept" || submittedDecision === "Reject";
  const isCorrectionMode = submittedDecision === "Correction";
  const activeStates     = isLocked && lockedFileStates ? lockedFileStates : fileStates;
  const displayedStates  = activeStates;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDetail = (detail: SellerDetail, decision: Decision) => {
    const sessionKey = `fileStates_${detail.tempSellerId}`;
    const locked = decision === "Accept" || decision === "Reject";
    let states = buildFileStates(detail, decision);

    if (locked) {
      try {
        const persisted = sessionStorage.getItem(sessionKey);
        if (persisted) {
          const restored: FileStateMap = JSON.parse(persisted);
          states = Object.fromEntries(Object.entries(restored).map(([k, v]) => [k, { ...v, viewed: true }]));
        }
      } catch {}
    }

    setData(detail);
    setFileStates(states);
    if (locked) setLockedFileStates(states);
    setSubmittedDecision(decision);
  };

  useEffect(() => {
    if (!sellerId) { loadDetail(DUMMY, null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    fetch(`${BASE_URL}/temp-sellers/${sellerId}`, { headers: { "X-API-Key": API_KEY } })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(json => { if (!cancelled) loadDetail((json.data ?? json) as SellerDetail, decisionFromStatus((json.data ?? json).status ?? "")); })
      .catch(() => { if (!cancelled) loadDetail(DUMMY, null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [sellerId]);

  // ── Memos ─────────────────────────────────────────────────
  const documentsVerified = useMemo(() => {
    const keys = Object.keys(activeStates).filter(k => k === "gstFile" || k.startsWith("doc_"));
    if (!keys.length) return { status: "No Documents", error: true };
    if (keys.every(k => activeStates[k]?.verified === true))  return { status: "Complete", error: false };
    if (keys.some(k  => activeStates[k]?.verified === false)) return { status: "Rejected",  error: true  };
    return { status: isLocked ? "Not Verified" : "Pending Verification", error: true };
  }, [activeStates, isLocked]);

  const bankVerified = useMemo(() => {
    const s = activeStates["chequeFile"];
    if (!s || s.verified === null) return { status: isLocked ? "Not Verified" : "Pending Verification", error: true };
    return s.verified ? { status: "Complete", error: false } : { status: "Rejected", error: true };
  }, [activeStates, isLocked]);

  const canAccept = useMemo(() =>
    Object.keys(activeStates).length > 0 && Object.values(activeStates).every(v => v.verified === true),
    [activeStates]
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleViewFile = (url: string, label: string, fileKey: string) => {
    setCurrentFile({ url, label, fileKey });
    setModalOpen(true);
    const update = (prev: FileStateMap) => ({ ...prev, [fileKey]: { ...(prev[fileKey] ?? { verified: null }), viewed: true } });
    setFileStates(update);
    if (isLocked) setLockedFileStates(prev => prev ? update(prev) : prev);
  };

  const handleVerifyInModal = (verified: boolean) => {
    if (!currentFile || isLocked) return;
    setFileStates(prev => ({ ...prev, [currentFile.fileKey]: { ...prev[currentFile.fileKey], verified } }));
    setModalOpen(false);
  };

  const handleAction = async (action: "Accept" | "Reject" | "Correction") => {
    if (!adminComment.trim()) { setShowCommentError(true); return; }
    if (action === "Accept" && !canAccept) { showToast("Verify all documents before accepting.", "error"); return; }
    setShowCommentError(false);
    setSubmittingAction(action);
    try {
      const res  = await fetch(`${BASE_URL}/admin/sellers/review`, {
        method: "POST",
        headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ id: sellerId, status: action, comments: adminComment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? `${res.status}`);

      if (action === "Accept" || action === "Reject") {
        const frozen = Object.fromEntries(Object.entries(fileStates).map(([k, v]) => [k, { verified: v.verified, viewed: true }]));
        if (sellerId) sessionStorage.setItem(`fileStates_${sellerId}`, JSON.stringify(frozen));
        setLockedFileStates(frozen);
        setFileStates(frozen);
      } else {
        sessionStorage.removeItem(`fileStates_${sellerId}`);
        setLockedFileStates(null);
      }
      setSubmittedDecision(action);
      showToast(
        action === "Accept" ? "Request accepted — status set to Closed!"  :
        action === "Reject" ? "Request rejected — status set to Rejected!" :
        "Correction requested — seller notified!", "success"
      );
      setTimeout(() => router.back(), 1800);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed.", "error");
    } finally {
      setSubmittingAction(null);
    }
  };

  // ── Status badge ──────────────────────────────────────────
  const statusBadge = () => {
    if (submittedDecision && submittedDecision in DECISION_CONFIG) {
      const cfg = DECISION_CONFIG[submittedDecision as keyof typeof DECISION_CONFIG];
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${cfg.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} /> {cfg.label}
        </span>
      );
    }
    if (!data) return null;
    const s = data.status?.toLowerCase();
    const badgeClass = s === "open" ? "bg-yellow-50 text-yellow-700 ring-yellow-200" : s?.includes("progress") ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-green-50 text-green-700 ring-green-200";
    const dotClass   = s === "open" ? "bg-yellow-500" : s?.includes("progress") ? "bg-blue-500" : "bg-green-500";
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${badgeClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        {data.status?.charAt(0).toUpperCase() + data.status?.slice(1)}
      </span>
    );
  };

  const LOCK_ICON = <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />;

  return (
    <>
      <Header admin onLogout={() => router.push("/admin_f6c29e3d/login")} />
      <main className="pt-12 bg-[#F7F2FB] min-h-screen px-4 sm:px-6 pb-10">
        <div className="max-w-5xl mx-auto">

          {/* Back — mobile */}
          <div className="block lg:hidden py-4">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full px-4 py-2 shadow text-[#2D0066] font-medium text-sm transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
          </div>

          {/* Back — desktop */}
          <button onClick={() => router.back()} aria-label="Go back"
            className="hidden lg:flex fixed left-6 top-32 z-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-3 shadow-lg transition-all items-center justify-center">
            <svg className="h-5 w-5 text-[#2D0066]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-5 sm:p-8 space-y-5">

            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#2D0066]">Final Verification Summary</h1>
                <p className="text-gray-500 mt-1 text-sm">Review all details before taking action</p>
              </div>
              {statusBadge()}
            </div>

            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Request ID</span>
              <span className="text-sm font-bold text-[#2D0066]">{requestId}</span>
            </div>

            {/* Banners */}
            {submittedDecision === "Accept" && (
              <div className="flex items-start gap-3 px-5 py-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div><p className="font-semibold">Request Accepted — Status: Closed</p><p className="text-green-600 mt-0.5">The seller has been approved. All documents are now view-only.</p></div>
              </div>
            )}
            {submittedDecision === "Reject" && (
              <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div><p className="font-semibold">Request Rejected — Status: Rejected</p><p className="text-red-600 mt-0.5">This request has been declined. All documents are now view-only.</p></div>
              </div>
            )}
            {isLocked && (
              <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">{LOCK_ICON}</svg>
                <p className="font-semibold">Verification locked — documents are view-only</p>
              </div>
            )}
            {isCorrectionMode && (
              <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                <div><p className="font-semibold">Corrections Needed — Status: Corrections Needed</p><p className="text-amber-600 mt-0.5">Seller has been notified. You can re-view and update document verification statuses.</p></div>
              </div>
            )}

            {loading ? <PageSkeleton /> : data ? (
              <>
                <Section title="Company Details">
                  <Item label="Name"    value={data.sellerName} />
                  <Item label="Type"    value={data.companyType?.companyTypeName} />
                  <Item label="Address" value={`${data.address?.buildingNo}, ${data.address?.street}, ${data.address?.city} - ${data.address?.pinCode}`} />
                  <Item label="Website" value={data.website} />
                  <Item label="Phone"   value={data.phone} />
                  <Item label="Email"   value={data.email} />
                </Section>

                <Section title="Coordinator Details">
                  <Item label="Name"        value={data.coordinator?.name} />
                  <Item label="Designation" value={data.coordinator?.designation} />
                  <Item label="Email"       value={data.coordinator?.email} />
                  <Item label="Mobile"      value={data.coordinator?.mobile} />
                </Section>

                <Section title="Compliance Documents">
                  <Item label="GST Number" value={data.gstNumber} />
                  <FileItem label="GST Certificate" fileUrl={LOCAL_GST_DOC} isLocked={isLocked}
                    onView={() => handleViewFile(LOCAL_GST_DOC, "GST Certificate", "gstFile")}
                    isViewed={displayedStates["gstFile"]?.viewed ?? false}
                    isVerified={displayedStates["gstFile"]?.verified ?? null} />
                  {data.documents?.map(doc => (
                    <div key={doc.DocumentsId} className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 pt-4 mt-1 border-t border-purple-50">
                      <Item label="Document Type"     value={doc.productTypes?.productTypeName} />
                      <Item label="Document Number"   value={doc.documentNumber} />
                      <Item label="Issuing Authority" value={doc.licenseIssuingAuthority} />
                      <Item label="Issue Date"        value={formatDate(doc.licenseIssueDate)} />
                      <Item label="Expiry Date"       value={formatDate(doc.licenseExpiryDate)} />
                      <Item label="License Status"    value={doc.licenseStatus} />
                      <FileItem label="License File" fileUrl={LOCAL_LICENSE} isLocked={isLocked}
                        onView={() => handleViewFile(LOCAL_LICENSE, `License — ${doc.productTypes?.productTypeName}`, `doc_${doc.DocumentsId}`)}
                        isViewed={displayedStates[`doc_${doc.DocumentsId}`]?.viewed ?? false}
                        isVerified={displayedStates[`doc_${doc.DocumentsId}`]?.verified ?? null} />
                    </div>
                  ))}
                </Section>

                <Section title="Bank Account Details">
                  <Item label="Bank Name"           value={data.bankDetails?.bankName} />
                  <Item label="Branch"              value={data.bankDetails?.branch} />
                  <Item label="IFSC Code"           value={data.bankDetails?.ifscCode} />
                  <Item label="Account Number"      value={data.bankDetails?.accountNumber ? `****${data.bankDetails.accountNumber.slice(-4)}` : "—"} />
                  <Item label="Account Holder Name" value={data.bankDetails?.accountHolderName} />
                  <Item label="State"               value={data.address?.state?.stateName} />
                  <Item label="District"            value={data.address?.district?.districtName} />
                  <Item label="Taluka"              value={data.address?.taluka?.talukaName} />
                  <FileItem label="Cancelled Cheque" fileUrl={LOCAL_CHEQUE} isLocked={isLocked}
                    onView={() => handleViewFile(LOCAL_CHEQUE, "Cancelled Cheque", "chequeFile")}
                    isViewed={displayedStates["chequeFile"]?.viewed ?? false}
                    isVerified={displayedStates["chequeFile"]?.verified ?? null} />
                </Section>

                <Section title="Validation Summary">
                  <StatusItem label="Company Info" status="Complete" highlight />
                  <StatusItem label="Verification" status="Complete" highlight />
                  <StatusItem label="Documents"    status={documentsVerified.status} error={documentsVerified.error} highlight={!documentsVerified.error} />
                  <StatusItem label="Bank Details" status={bankVerified.status}      error={bankVerified.error}      highlight={!bankVerified.error} />
                  <StatusItem label="Overall Status"
                    status={
                      isLocked && submittedDecision === "Accept" ? "Closed" :
                      isLocked && submittedDecision === "Reject" ? "Rejected" :
                      isCorrectionMode ? "Corrections Needed" :
                      canAccept ? "Ready to Submit" : "Pending Verification"
                    }
                    highlight={canAccept || (isLocked && submittedDecision === "Accept")}
                    error={!canAccept && !(isLocked && submittedDecision === "Accept")} />
                </Section>

                {/* Admin Decision */}
                <div className="border border-purple-200 rounded-xl p-5">
                  <h2 className="text-lg font-bold text-[#2D0066] mb-4 pb-2 border-b border-purple-100">Admin Decision</h2>

                  {isLocked && (
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">{LOCK_ICON}</svg>
                      <div>
                        <p className="font-semibold text-gray-600 text-sm">Decision submitted — no further changes allowed</p>
                        <p className="text-gray-500 text-sm mt-0.5">All actions and document verification are locked. You may only view files.</p>
                      </div>
                    </div>
                  )}

                  {!canAccept && !isLocked && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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
                      <textarea value={adminComment} rows={4} readOnly={isLocked}
                        onChange={e => { if (isLocked) return; setAdminComment(e.target.value); setShowCommentError(false); }}
                        placeholder={isLocked ? "Decision has been submitted — no further changes allowed." : "Enter your comments here..."}
                        className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 transition-all resize-none
                          ${isLocked ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 focus:ring-0"
                            : showCommentError ? "border-red-400 focus:ring-red-400 bg-gray-50 focus:bg-white"
                            : "border-gray-200 focus:ring-[#4B0082] bg-gray-50 focus:bg-white"}`} />
                      {showCommentError && (
                        <p className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          Please add a comment before taking action
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Select Action</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ActionButton action="Accept" label="Accept Request" submittingAction={submittingAction}
                          disabled={!canAccept || submittingAction !== null || isLocked}
                          onClick={() => handleAction("Accept")}
                          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
                        <ActionButton action="Reject" label="Reject Request" submittingAction={submittingAction}
                          disabled={submittingAction !== null || isLocked}
                          onClick={() => handleAction("Reject")}
                          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
                        <ActionButton action="Correction" label="Request Correction" submittingAction={submittingAction}
                          disabled={submittingAction !== null || isLocked}
                          onClick={() => handleAction("Correction")}
                          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} />
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentFile.url} alt={currentFile.label} className="max-w-full max-h-[60vh] object-contain rounded-lg shadow" />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLocked && submittedDecision === "Accept" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Closed
                  </span>
                )}
                {isLocked && submittedDecision === "Reject" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Rejected
                  </span>
                )}
                {isLocked && <span className="text-xs text-gray-400 italic">View only</span>}
                {isCorrectionMode && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-semibold">
                    Corrections Needed — verification enabled
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm">
                  {isLocked ? "Close" : "Cancel"}
                </button>
                {!isLocked && (
                  <>
                    <button onClick={() => handleVerifyInModal(true)} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Verify
                    </button>
                    <button onClick={() => handleVerifyInModal(false)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}