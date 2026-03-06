"use client";

import React, { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface DashboardFiltersProps {
  setCurrentView: (view: DashboardView) => void;
}

type ModalView = "methods" | "excel";
type ProductType = "drugs" | "food";

interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const IMPORT_API_URL =
  "https://api-test-aggreator.tiameds.ai/api/v1/products/import";

// ─────────────────────────────────────────────
// Method definitions
// ─────────────────────────────────────────────

const METHODS = [
  {
    id: "manual",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Manual Entry",
    desc: "Fill the product details using the form",
    ready: true,
    accent: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  {
    id: "excel",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    label: "Excel / CSV",
    desc: "Bulk upload via spreadsheet",
    ready: true,
    accent: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    id: "api",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 4l-4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "API Integration",
    desc: "Connect via REST API",
    ready: false,
    accent: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    id: "db",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="2" />
        <path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="currentColor" strokeWidth="2" />
        <path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    label: "Database Sync",
    desc: "Sync from your database",
    ready: false,
    accent: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
];

// ─────────────────────────────────────────────
// Excel Upload View
// ─────────────────────────────────────────────

function ExcelUploadView({ onBack }: { onBack: () => void }) {
  const [productType, setProductType] = useState<ProductType>("drugs");
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({ file: f, status: "pending" as const })),
    ]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      [".xlsx", ".xls", ".csv"].some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (dropped.length) addFiles(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setSubmitting(true);
    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" as const })));
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i].file);
        try {
          const res = await fetch(IMPORT_API_URL, { method: "POST", body: formData });
          if (!res.ok) throw new Error(`${res.status}`);
          setFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: "done" as const } : f))
          );
        } catch (err: any) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "error" as const, error: err?.message || "Failed" } : f
            )
          );
        }
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ──
  if (submitted) {
    const failCount = files.filter((f) => f.status === "error").length;
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1E1E1E", marginBottom: 6 }}>Submitted Successfully!</div>
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16, lineHeight: 1.6 }}>
          {productType === "drugs" ? "Drugs" : "Supplements or Nutraceuticals"} Product_Upload_Template_v0.1 data is being processed
        </div>
        <div style={{ padding: "10px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 12, color: "#15803D", marginBottom: 20 }}>
          Processing usually takes 2–5 minutes for up to 500 products
        </div>
        {failCount > 0 && (
          <div style={{ padding: "8px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 12, color: "#DC2626", marginBottom: 16 }}>
            {failCount} file(s) failed to upload
          </div>
        )}
        <button onClick={() => { setSubmitted(false); setFiles([]); }} style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #DDD6FE", background: "white", color: "#4B0082", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Upload Another File
        </button>
      </div>
    );
  }

  // ── Upload ──
  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#4B0082", fontSize: 13, fontWeight: 600, marginBottom: 14, padding: 0 }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Back
      </button>

      <div style={{ fontWeight: 700, fontSize: 16, color: "#1E1E1E", marginBottom: 3 }}>Upload Excel / CSV</div>
      <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 16 }}>Download our template, fill in the product data, and upload</div>

      {/* Product type tabs */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#1E1E1E", marginBottom: 10 }}>Select the type of product you want to upload</div>
        <div style={{ display: "flex", gap: 8 }}>
          {([{ id: "drugs" as ProductType, label: "Drugs" }, { id: "food" as ProductType, label: "Food & Infant Nutrition" }]).map((tab) => (
            <button key={tab.id} onClick={() => setProductType(tab.id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${productType === tab.id ? "#4B0082" : "#E5E7EB"}`, background: productType === tab.id ? "#4B0082" : "white", color: productType === tab.id ? "white" : "#6B7280", fontWeight: productType === tab.id ? 700 : 500, fontSize: 12, cursor: "pointer", transition: "all 0.15s ease" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template download */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(75,0,130,0.04)", border: "1px solid rgba(75,0,130,0.12)", borderRadius: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 600, color: "#4B0082", fontSize: 13 }}>drug_products_template.xlsx</div>
          <div style={{ color: "#888", fontSize: 11 }}>Download and fill before uploading</div>
        </div>
        <a href={productType === "drugs" ? "/templates/drug_products_template.xlsx" : "/templates/Suppliments or Nutraceuticals _Product_Upload_Template_v0.1.xlsx"} download style={{ background: "#4B0082", color: "white", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>
          Download
        </a>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${dragging ? "#4B0082" : "#C4B5FD"}`, borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(75,0,130,0.04)" : "rgba(255,255,255,0.7)", transition: "all 0.2s ease", marginBottom: files.length ? 10 : 14 }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" multiple style={{ display: "none" }} onChange={handleFileInput} />
        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
        <div style={{ fontWeight: 600, color: "#4B0082", fontSize: 15, marginBottom: 3 }}>{dragging ? "Drop it here!" : "Drag & drop your file"}</div>
        <div style={{ fontSize: 11, color: "#9CA3AF" }}>or click to browse — .xlsx, .xls, .csv</div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {files.map((uf, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: uf.status === "done" ? "#F0FDF4" : uf.status === "error" ? "#FEF2F2" : "#FAFAFA", border: `1px solid ${uf.status === "done" ? "#BBF7D0" : uf.status === "error" ? "#FECACA" : "#E5E7EB"}`, borderRadius: 10 }}>
              <div style={{ fontSize: 18 }}>{uf.status === "done" ? "✅" : uf.status === "error" ? "❌" : uf.status === "uploading" ? "⏳" : "📄"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: uf.status === "done" ? "#15803D" : uf.status === "error" ? "#DC2626" : "#1E1E1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uf.file.name}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>{uf.status === "done" ? "Completed" : uf.status === "error" ? uf.error || "Failed" : uf.status === "uploading" ? "Uploading..." : `${(uf.file.size / 1024).toFixed(1)} KB`}</div>
              </div>
              {uf.status === "pending" && (
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center", padding: 2 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!files.length || submitting} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: !files.length ? "#F3F4F6" : "#4B0082", color: !files.length ? "#9CA3AF" : "white", fontWeight: 700, fontSize: 14, cursor: !files.length ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
        {submitting ? (<><span style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "dfSpin 0.8s linear infinite", display: "inline-block" }} />Uploading...</>) : "Submit File"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Onboarding Modal
// ─────────────────────────────────────────────

function OnboardingModal({ onClose, onManualEntry }: { onClose: () => void; onManualEntry: () => void }) {
  const [modalView, setModalView] = useState<ModalView>("methods");

  return (
    <>
      <style>{`
        @keyframes dfBackdropIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes dfModalIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) }
        }
        @keyframes dfSpin { to { transform: rotate(360deg) } }
        .df-method-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1.5px solid #F3F4F6;
          background: white;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          text-align: left;
          width: 100%;
        }
        .df-method-row:hover:not(.df-disabled) {
          border-color: rgba(75,0,130,0.25);
          background: #FAFAFA;
          box-shadow: 0 2px 12px rgba(75,0,130,0.08);
        }
        .df-disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "dfBackdropIn 0.2s ease forwards",
        }}
      />

      {/* Modal — uses its own transform origin so it scales from center */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          /* transform is baked into the keyframe endpoint so it stays at translate(-50%,-50%) after */
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          width: "90vw",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "white",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          animation: "dfModalIn 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) forwards",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, borderRadius: "50%", border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }}
        >
          <X size={14} />
        </button>

        {modalView === "methods" ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1E1E1E", marginBottom: 5 }}>
                How would you like to add products?
              </div>
              <div style={{ fontSize: 13, color: "#6B7280" }}>
                Choose the method that best fits your workflow.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {METHODS.map((method) => (
                <button
                  key={method.id}
                  className={`df-method-row${!method.ready ? " df-disabled" : ""}`}
                  onClick={() => {
                    if (!method.ready) return;
                    if (method.id === "manual") { onManualEntry(); return; }
                    if (method.id === "excel") { setModalView("excel"); }
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: method.bg, border: `1px solid ${method.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: method.accent, flexShrink: 0 }}>
                    {method.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1E1E1E", marginBottom: 2 }}>{method.label}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{method.desc}</div>
                  </div>
                  {method.ready ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: method.accent, whiteSpace: "nowrap" }}>
                      Get Started
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  ) : (
                    <div style={{ padding: "4px 10px", borderRadius: 6, background: "#F3F4F6", border: "1px solid #E5E7EB", fontSize: 11, fontWeight: 600, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                      Coming soon
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "#9CA3AF" }}>
              API & Database sync coming soon
            </div>
          </>
        ) : (
          <ExcelUploadView onBack={() => setModalView("methods")} />
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// DashboardFilters — main export
// ─────────────────────────────────────────────

const DashboardFilters = ({ setCurrentView }: DashboardFiltersProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <select className="h-11 w-50 px-4 rounded-md border border-neutral-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-50">
          <option>All Stocks</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>

        <select className="h-11 w-50 px-4 rounded-md border border-neutral-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-50">
          <option>All Categories</option>
          <option>Drugs</option>
          <option>Vitamins</option>
          <option>Diabetes</option>
        </select>

        <button
          onClick={() => setShowModal(true)}
          className="h-11 w-50 flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-800 text-white rounded-md shadow-md transition"
        >
          <Plus size={18} />
          Add New Product
        </button>
      </div>

      {showModal && (
        <OnboardingModal
          onClose={() => setShowModal(false)}
          onManualEntry={() => {
            setShowModal(false);
            setCurrentView("addProduct");
          }}
        />
      )}
    </>
  );
};

export default DashboardFilters;