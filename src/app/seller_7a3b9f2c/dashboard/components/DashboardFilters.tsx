"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardFiltersProps {
  setCurrentView: (view: DashboardView) => void;
}

type ModalView   = "methods" | "excel" | "api" | "success";
type ProductType = "drugs";

interface UploadedFile {
  file:      File;
  status:    "pending" | "uploading" | "done" | "error";
  error?:    string;
  progress?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const IMPORT_API_URL = "https://api-test-aggreator.tiameds.ai/api/v1/products/import";

const C = {
  primary:      "#4C1D95",
  primaryLight: "#EDE9FE",
  green:        "#4EB300",
  greenDark:    "#378200",
  greenLight:   "#DCF7CB",
} as const;

const METHODS = [
  {
    id: "manual", ready: true, accent: C.primary, bg: C.primaryLight,
    label: "Manual Entry", desc: "Fill the product details using the form",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "excel", ready: true, accent: C.greenDark, bg: "#DCFCE7",
    label: "Excel / CSV", desc: "Bulk upload via spreadsheet",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="14,2 14,8 20,8" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="8" y1="13" x2="16" y2="13" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="17" x2="16" y2="17" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "api", ready: false, accent: "#D97706", bg: "#FEF3C7",
    label: "API Integration", desc: "Connect via REST API",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 4l-4 16" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "db", ready: false, accent: "#CA8A04", bg: "#FEFCE8",
    label: "Database Sync", desc: "Sync directly from your database",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#CA8A04" strokeWidth="2"/>
        <path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="#CA8A04" strokeWidth="2"/>
        <path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" stroke="#CA8A04" strokeWidth="2"/>
      </svg>
    ),
  },
];

const PROGRESS_STEPS = [10, 25, 40, 55, 70, 85, 100];

const TEMPLATES: Record<ProductType, { name: string; xlsx: string; csv: string; xls: string }> = {
  drugs: {
    name: "drug_products_template",
    xlsx: "/templates/drugs/XLSX-Drugs Template.xlsx",
    csv:  "/templates/drugs/CSV-Drugs Template.csv",
    xls:  "/templates/drugs/XLS-Drugs Template.xls",
  },
};

const fileKey = (f: File) => `${f.name}-${f.size}`;

// ─── Shared Styles ────────────────────────────────────────────────────────────
const fontBase: React.CSSProperties = { fontFamily: "'Open Sans', sans-serif" };

const flex = (
  dir: "row" | "col",
  gap?: number,
  align?: string,
  justify?: string,
): React.CSSProperties => ({
  display: "flex",
  flexDirection: dir === "col" ? "column" : "row",
  ...(gap     ? { gap }                     : {}),
  ...(align   ? { alignItems: align }       : {}),
  ...(justify ? { justifyContent: justify } : {}),
});

const XIcon = ({ size = 24, color = "#111827", strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

function FileIcon({ ext = "XLSX" }: { ext?: string }) {
  return (
    <div style={{ position: "relative", width: 44, height: 52, flexShrink: 0 }}>
      <div style={{ width: 44, height: 52, borderRadius: 6, background: "#F9FAFB", border: "1px solid #E5E7EB", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 12px 12px 0", borderColor: "transparent #E5E7EB transparent transparent" }}/>
        {[16, 22, 28].map((top) => (
          <div key={top} style={{ position: "absolute", top, left: 6, right: top === 28 ? 12 : 8, height: 2, background: "#E5E7EB", borderRadius: 1 }}/>
        ))}
        <div style={{ position: "absolute", bottom: 0, left: 0, background: "#16A34A", borderRadius: "0 4px 0 4px", padding: "2px 4px" }}>
          <span style={{ fontSize: 7, fontWeight: 800, color: "white", letterSpacing: 0.3, lineHeight: 1, fontFamily: "monospace" }}>
            {ext.slice(0, 4)}
          </span>
        </div>
      </div>
    </div>
  );
}

function FileRow({ uf, index, onRemove, submitting }: {
  uf: UploadedFile; index: number; onRemove: (i: number) => void; submitting: boolean;
}) {
  const fileSizeKB  = Math.max(1, Math.round(uf.file.size / 1024));
  const ext         = (uf.file.name.split(".").pop() ?? "xlsx").toUpperCase();
  const isUploading = uf.status === "uploading";
  const isDone      = uf.status === "done";
  const isError     = uf.status === "error";

  const sizeLabel = isUploading
    ? `${fileSizeKB} KB of ${fileSizeKB * 2} KB •`
    : isDone
    ? `${fileSizeKB} KB of ${fileSizeKB} KB •`
    : `${fileSizeKB} KB •`;

  return (
    <div style={{ background: isError ? "#FEF2F2" : "#F3F4F6", borderRadius: 8, padding: 8, ...flex("col", 6), border: isError ? "1px solid #FECACA" : "none" }}>
      <div style={{ ...flex("row", 0, "flex-start", "space-between") }}>
        <div style={{ ...flex("row", 12, "center"), flex: 1, minWidth: 0 }}>
          <FileIcon ext={ext} />
          <div style={{ ...flex("col", 6), minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fontBase, lineHeight: "16px" }}>
              {uf.file.name}
            </div>
            <div style={{ ...flex("row", 4, "center"), fontSize: 10, ...fontBase }}>
              <span style={{ color: "#6B7280" }}>{sizeLabel}</span>
              {isUploading && (
                <span style={{ ...flex("row", 3, "center"), color: "#374151" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #D1FAE5", borderTopColor: "#16A34A", display: "inline-block", flexShrink: 0, animation: "dfSpin 0.65s linear infinite" }}/>
                  <span style={{ color: "#111827", fontSize: 10 }}>Uploading...</span>
                </span>
              )}
              {isDone && (
                <span style={{ ...flex("row", 4, "center") }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#16A34A", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span style={{ color: "#111827", fontWeight: 600, fontSize: 10 }}>Completed</span>
                </span>
              )}
              {isError && (
                <span style={{ ...flex("row", 4, "center") }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#DC2626", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M3 3l4 4M7 3L3 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <span style={{ color: "#DC2626", fontWeight: 600, fontSize: 10 }}>{uf.error ?? "Upload failed"}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => !submitting && onRemove(index)}
          style={{ background: "none", border: "none", padding: "2px 4px", cursor: submitting ? "default" : "pointer", ...flex("row", 0, "center", "center"), flexShrink: 0, marginLeft: 8, opacity: submitting ? 0.3 : 1 }}
        >
          <XIcon size={14} color="#9CA3AF" strokeWidth={2} />
        </button>
      </div>
      {isUploading && (
        <div style={{ height: 6, background: "#EDE9FE", borderRadius: 99, overflow: "hidden", marginTop: 2 }}>
          <div style={{ height: "100%", background: "#7C3AED", borderRadius: 99, width: `${uf.progress ?? 0}%`, transition: "width 0.3s ease" }}/>
        </div>
      )}
    </div>
  );
}

// ─── ExcelUploadView ──────────────────────────────────────────────────────────
function ExcelUploadView({ onBack, onSuccess }: {
  onBack: () => void;
  onSuccess: (type: ProductType, files: UploadedFile[]) => void;
}) {
  const [productType, setProductType] = useState<ProductType>("drugs");
  const [dragging, setDragging]       = useState(false);
  const [files, setFiles]             = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ rowNumber: number; productName: string; errorMessage: string }>>([]);
  const [fileFormatError, setFileFormatError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const inputRef  = useRef<HTMLInputElement>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const getUserId = useCallback((): number | null => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.userId;
      }
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || payload.user_id || payload.sub;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchSellerCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setLoadingCategories(false); return; }
        const userId = getUserId();
        if (!userId) { setLoadingCategories(false); return; }

        const response = await fetch(
          `https://api-test-aggreator.tiameds.ai/api/v1/sellers/user/${userId}`,
          { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        const defaultCategories = [
          { id: 1, name: "Drugs" },
          { id: 2, name: "Supplements / Nutraceuticals" },
          { id: 3, name: "Food & Infant Nutrition" },
          { id: 4, name: "Cosmetic & Personal Care" },
          { id: 5, name: "Medical Devices (Consumable)" },
          { id: 6, name: "Medical Devices (Non-Consumable)" },
        ];

        if (response.ok) {
          const result = await response.json();
          if (result?.data?.productTypes?.length) {
            setAvailableCategories(
              result.data.productTypes.map((pt: any) => ({
                id: pt.productTypeId,
                name: pt.productTypeName,
              }))
            );
          } else {
            setAvailableCategories(defaultCategories);
          }
        } else {
          setAvailableCategories(defaultCategories);
        }
      } catch {
        setAvailableCategories([
          { id: 1, name: "Drugs" },
          { id: 2, name: "Supplements / Nutraceuticals" },
          { id: 3, name: "Food & Infant Nutrition" },
          { id: 4, name: "Cosmetic & Personal Care" },
          { id: 5, name: "Medical Devices (Consumable)" },
          { id: 6, name: "Medical Devices (Non-Consumable)" },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchSellerCategories();
  }, [getUserId]);

  const isSelectable = (id: number) => id === 1; // Only Drugs

  const updateFile = (key: string, patch: Partial<UploadedFile>) =>
    setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, ...patch } : f));

  const runFakeProgress = (key: string) => {
    let step = 0;
    const tick = () => {
      if (step >= PROGRESS_STEPS.length) {
        setFiles((prev) =>
          prev.map((f) => fileKey(f.file) === key ? { ...f, status: "done" as const, progress: 100 } : f)
        );
        timersRef.current.delete(key);
        return;
      }
      const p = PROGRESS_STEPS[step++];
      setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, progress: p } : f));
      timersRef.current.set(key, setTimeout(tick, 180));
    };
    timersRef.current.set(key, setTimeout(tick, 80));
  };

  const addFiles = (newFiles: File[]) => {
    setSubmitError(null); setValidationErrors([]); setFileFormatError(null);
    const validFiles: File[] = [];
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024;
    const validExts = ["xlsx", "csv", "xls"];

    newFiles.forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !validExts.includes(ext)) {
        errors.push(`${file.name}: Invalid format. Please upload .xlsx, .csv, or .xls files only.`);
        return;
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 10MB limit.`);
        return;
      }
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty.`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) { setFileFormatError(errors.join(" ")); return; }

    setFiles((prev) => {
      const filtered = validFiles.filter(
        (f) => !prev.some((ex) => ex.file.name === f.name && ex.file.size === f.size)
      );
      return [...prev, ...filtered.map((f) => ({ file: f, status: "uploading" as const, progress: 0 }))];
    });
    validFiles.forEach((f) => setTimeout(() => runFakeProgress(fileKey(f)), 50));
  };

  const removeFile = (i: number) => {
    setSubmitError(null); setValidationErrors([]); setFileFormatError(null);
    setFiles((prev) => {
      const key = fileKey(prev[i].file);
      const timer = timersRef.current.get(key);
      if (timer) { clearTimeout(timer); timersRef.current.delete(key); }
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { addFiles(Array.from(e.target.files)); e.target.value = ""; }
  };

  const downloadErrorReport = (errors: Array<{ rowNumber: number; productName: string; errorMessage: string }>) => {
    if (!errors.length) return;
    const csvRows = [
      ["Row Number", "Product Name", "Error Message"].join(","),
      ...errors.map((e) =>
        `"${e.rowNumber}","${e.productName.replace(/"/g, '""')}","${e.errorMessage.replace(/"/g, '""')}"`
      ),
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `upload_errors_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    const readyFiles = files.filter((f) => f.status === "done");
    if (!readyFiles.length || submitting) return;
    setSubmitting(true); setSubmitError(null); setValidationErrors([]); setFileFormatError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setSubmitError("You are not authenticated. Please log in and try again.");
      setSubmitting(false);
      return;
    }

    const results: { key: string; success: boolean; validationErrors?: any[] }[] = [];

    for (const uf of files) {
      if (uf.status !== "done") continue;
      const key = fileKey(uf.file);
      updateFile(key, { status: "uploading", progress: 0 });
      try {
        for (let p = 15; p <= 80; p += 20) {
          await new Promise((r) => setTimeout(r, 200));
          updateFile(key, { progress: p });
        }
        const fd = new FormData();
        fd.append("file", uf.file);
        const res = await fetch(IMPORT_API_URL, {
          method: "POST", body: fd,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          let msg = `Server error (${res.status})`;
          try { const b = await res.json(); msg = b?.data?.message ?? b?.message ?? msg; } catch {}
          throw new Error(msg);
        }
        const body = await res.json();
        if (body?.data?.status === "ERROR") throw new Error(body.data.message ?? "Upload failed");

        const hasErrors = body?.data?.errors?.length > 0;
        const successCount = body?.data?.successCount || 0;
        const failureCount = body?.data?.failureCount || 0;

        if (hasErrors) {
          setValidationErrors(body.data.errors);
          if (successCount === 0) {
            updateFile(key, { status: "error", error: `All ${body.data.totalRows || 0} row(s) have validation errors.`, progress: 100 });
            results.push({ key, success: false, validationErrors: body.data.errors });
          } else {
            updateFile(key, { status: "error", error: `Partial: ${successCount} succeeded, ${failureCount} failed.`, progress: 100 });
            results.push({ key, success: false, validationErrors: body.data.errors });
          }
        } else {
          updateFile(key, { status: "done", progress: 100 });
          results.push({ key, success: true });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        updateFile(key, { status: "error", error: message });
        results.push({ key, success: false });
      }
    }

    await new Promise((r) => setTimeout(r, 250));
    setSubmitting(false);

    const anySuccess = results.some((r) => r.success);
    const allFailed  = results.every((r) => !r.success);
    const hasVErrors = validationErrors.length > 0;

    if (hasVErrors) {
      setSubmitError("Please fix the validation errors in your Excel file and re-upload.");
    } else if (allFailed) {
      setSubmitError("Upload failed. Please check the errors above and try again.");
    } else if (anySuccess) {
      onSuccess(productType, files);
    }
  };

  const hasReadyFiles = files.some((f) => f.status === "done");
  const template = TEMPLATES[productType];

  const DownloadIcon = ({ color }: { color: string }) => (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
      <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" fill={color}/>
      <path d="M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div style={{ ...flex("col", 16) }}>
      {/* Back */}
      <button onClick={onBack} style={{ ...flex("row", 6, "center"), background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 14, fontWeight: 600, padding: 0, ...fontBase, alignSelf: "flex-start" }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {/* Heading */}
      <div style={{ ...flex("col", 4) }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", ...fontBase }}>Upload Excel / CSV</div>
        <div style={{ fontSize: 13, color: "#6B7280", ...fontBase }}>Download our template, fill in product data, and upload</div>
      </div>

      {/* ── Category grid ── */}
      <div style={{ ...flex("col", 10) }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", ...fontBase }}>Select product category</div>

        {loadingCategories ? (
          <div style={{ ...flex("row", 8, "center") }}>
            <span style={{ width: 14, height: 14, border: "2px solid #E5E7EB", borderTopColor: C.primary, borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }}/>
            <span style={{ fontSize: 13, color: "#6B7280", ...fontBase }}>Loading categories...</span>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}>
            {availableCategories.map((cat) => {
              const selectable = isSelectable(cat.id);
              const selected   = selectable && productType === "drugs";

              return (
                <button
                  key={cat.id}
                  onClick={() => selectable && setProductType("drugs")}
                  disabled={!selectable}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1.5px solid ${selected ? C.primary : "#E5E7EB"}`,
                    background: selected ? C.primaryLight : selectable ? "#FAFAFA" : "#F9FAFB",
                    color: selected ? C.primary : selectable ? "#374151" : "#9CA3AF",
                    fontWeight: selected ? 700 : 500,
                    fontSize: 12,
                    cursor: selectable ? "pointer" : "default",
                    textAlign: "left",
                    ...fontBase,
                    transition: "all 0.15s",
                    ...flex("row", 6, "center"),
                  }}
                >
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <span style={{ lineHeight: 1.4 }}>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Template download ── */}
      {template && (
        <div style={{ ...flex("row", 0, "center", "space-between"), padding: "12px 14px", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 12, gap: 12, flexWrap: "wrap" }}>
          <div style={{ ...flex("col", 3), minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "#5B21B6", fontSize: 13, ...fontBase }}>Drugs Template</div>
            <div style={{ color: "#6B7280", fontSize: 12, ...fontBase }}>Download and fill before uploading</div>
          </div>
          <div style={{ ...flex("row", 8, "center"), flexShrink: 0 }}>
            {[
              { href: template.csv,  label: ".CSV"  },
              { href: template.xlsx, label: ".XLSX" },
              { href: template.xls,  label: ".XLS"  },
            ].map(({ href, label }) => (
              <a
                key={label}
                href={href}
                download
                className="df-dl-btn"
                style={{ background: "#9F75FC", color: "white", borderRadius: 8, padding: "0 12px", height: 34, ...flex("row", 5, "center", "center"), fontSize: 12, fontWeight: 700, textDecoration: "none", border: "none", ...fontBase, gap: 5, transition: "all 0.2s", cursor: "pointer" }}
              >
                <DownloadIcon color="white" />
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── File format error ── */}
      {fileFormatError && (
        <div style={{ ...flex("row", 10, "center"), padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 12, color: "#991B1B", flex: 1, ...fontBase }}>{fileFormatError}</span>
          <button onClick={() => setFileFormatError(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <XIcon size={13} color="#991B1B" />
          </button>
        </div>
      )}

      {/* ── Drop zone ── */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 16, padding: 10, ...flex("col", 10) }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ background: dragging ? "#F5F3FF" : "#F9FAFB", border: `2px dashed ${dragging ? C.primary : "#A78BFA"}`, borderRadius: 10, padding: "22px 16px", cursor: "pointer", ...flex("col", 12, "center", "center"), transition: "all 0.2s", minHeight: files.length ? 90 : 140 }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.csv,.xls" multiple style={{ display: "none" }} onChange={handleFileInput}/>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M32.5075 15.6583L9.43565 16.5154C8.67212 16.5154 8.22691 16.8012 8.0166 17.5353L3.2273 33.9198C3.02929 34.6161 2.08003 34.9419 1.41968 34.9419C0.759773 34.9419 0.219727 34.4019 0.219727 33.742V29.1503V10.3386V9.43986V6.68562C0.219727 5.76227 0.968328 5.01367 1.89168 5.01367H13.771C14.2144 5.01367 14.6394 5.18974 14.9529 5.50323L18.3995 8.94987C18.713 9.26336 19.1385 9.43942 19.5815 9.43942H30.8356C31.7589 9.43942 32.5075 10.188 32.5075 11.1114V11.6826V15.6583Z" fill="#E0AD31"/>
            <path d="M1.41968 34.9419C2.07959 34.9419 2.42162 34.4383 2.61964 33.7419L7.44757 16.8986C7.65788 16.1645 8.3292 15.6587 9.09317 15.6587H38.6768C39.3832 15.6587 39.8908 16.3375 39.6914 17.0154L34.9074 33.2721C34.6914 34.0409 34.2176 34.9485 33.2377 34.9419H1.41968Z" fill="#FFC843"/>
          </svg>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 4, ...fontBase }}>
              {dragging ? "Drop files here!" : "Drag & drop your Excel / CSV"}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", ...fontBase }}>or click to browse · .xlsx · .csv · .xls · Max 10MB</div>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ ...flex("col", 8), marginTop: 4 }}>
            <div style={{ ...flex("row", 0, "space-between", "center"), marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", ...fontBase }}>
                Files  ({files.length})
              </span>
              {files.every((f) => f.status === "done" || f.status === "error") && (
                <button
                  onClick={() => { setFiles([]); setValidationErrors([]); setSubmitError(null); setFileFormatError(null); }}
                  style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer", ...fontBase }}
                >
                    Clear all
                </button>
              )}
            </div>
            {files.map((uf, i) => (
              <FileRow key={`${uf.file.name}-${i}`} uf={uf} index={i} onRemove={removeFile} submitting={submitting}/>
            ))}
          </div>
        )}
      </div>

      {/* ── Validation error table ── */}
      {validationErrors.length > 0 && (
        <div style={{ ...flex("col", 8) }}>
          <div style={{ ...flex("row", 8, "center"), padding: "10px 14px", background: "#FEF2F2", borderRadius: 8, borderLeft: "4px solid #DC2626" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", ...fontBase }}>
              {validationErrors.length} validation error(s) found
            </span>
          </div>
          <div style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 8, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, ...fontBase }}>
              <thead style={{ background: "#FEF2F2", borderBottom: "1px solid #FECACA" }}>
                <tr>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#991B1B", width: 60 }}>Row</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#991B1B" }}>Product Name</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#991B1B" }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {validationErrors.map((err, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < validationErrors.length - 1 ? "1px solid #FEE2E2" : "none" }}>
                    <td style={{ padding: "8px 12px", color: "#374151", fontWeight: 500 }}>{err.rowNumber}</td>
                    <td style={{ padding: "8px 12px", color: "#374151" }}>{err.productName}</td>
                    <td style={{ padding: "8px 12px", color: "#DC2626" }}>{err.errorMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => downloadErrorReport(validationErrors)}
            style={{ alignSelf: "flex-end", ...flex("row", 6, "center", "center"), padding: "7px 14px", background: "#fff", border: "1px solid #DC2626", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#DC2626", ...fontBase }}
          >
            <DownloadIcon color="#DC2626" />
            Download Error Report
          </button>
        </div>
      )}

      {/* ── Submit error ── */}
      {submitError && !validationErrors.length && (
        <div style={{ ...flex("row", 10, "center"), padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, color: "#991B1B", flex: 1, ...fontBase }}>{submitError}</span>
          <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <XIcon size={13} color="#991B1B" />
          </button>
        </div>
      )}

      {/* ── Upload button ── */}
      <button
        onClick={handleSubmit}
        disabled={!hasReadyFiles || submitting}
        style={{ width: "100%", height: 50, borderRadius: 10, border: "none", background: hasReadyFiles && !submitting ? "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)" : "#F3F4F6", cursor: hasReadyFiles && !submitting ? "pointer" : "not-allowed", ...flex("row", 10, "center", "center"), ...fontBase, boxShadow: hasReadyFiles && !submitting ? "0 4px 14px rgba(76,29,149,0.3)" : "none", transition: "all 0.2s" }}
      >
        <span style={{ color: hasReadyFiles && !submitting ? "white" : "#9CA3AF", fontWeight: 700, fontSize: 15, ...fontBase, ...flex("row", 8, "center") }}>
          {submitting ? (
            <>
              <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }}/>
              Processing...
            </>
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 3v12m0 0l-3-3m3 3l3-3M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Upload {files.length > 1 ? "Files" : "File"}
            </>
          )}
        </span>
      </button>

      <div style={{ ...flex("row", 6, "center"), justifyContent: "center" }}>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="1.5"/>
          <path d="M12 8v4M12 16h.01" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 11, color: "#9CA3AF", ...fontBase }}>
          Ensure your file follows the template format · Max 10MB per file
        </span>
      </div>
    </div>
  );
}

// ─── SuccessView ──────────────────────────────────────────────────────────────
function SuccessView({ files, onClose }: {
  productType: ProductType;
  files: UploadedFile[];
  onReset: () => void;
  onClose?: () => void;
}) {
  const fileName = files?.[0]?.file?.name ?? "drug_products_template.xlsx";
  return (
    <div style={{ ...flex("col", 24, "center"), padding: "32px 24px", position: "relative" }}>
      {onClose && (
        <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, background: "none", border: "1.5px solid #1E1E1D", borderRadius: "50%", cursor: "pointer", ...flex("row", 0, "center", "center"), padding: 0 }}>
          <XIcon size={12} color="#1E1E1D" strokeWidth={2.5}/>
        </button>
      )}
      <div style={{ padding: 24, background: "#DCF7CB", borderRadius: "50%", border: "1px solid #4EB300", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="#378200" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ ...flex("col", 12, "center") }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", ...fontBase, textAlign: "center" }}>Submitted Successfully!</div>
        <div style={{ ...flex("col", 4, "center") }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#378200", ...fontBase, textAlign: "center" }}>{fileName}</div>
          <div style={{ fontSize: 13, color: "#374151", ...fontBase, textAlign: "center" }}>is being processed</div>
        </div>
      </div>
      <div style={{ background: "#DCF7CB", border: "1px solid #4EB300", borderRadius: 8, padding: "10px 16px", width: "100%", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#378200", ...fontBase }}>
          Processing usually takes 2–5 minutes for up to 500 products
        </span>
      </div>
    </div>
  );
}

// ─── OnboardingModal ──────────────────────────────────────────────────────────
function OnboardingModal({ onClose, onManualEntry }: { onClose: () => void; onManualEntry: () => void }) {
  const [successData, setSuccessData]       = useState<{ type: ProductType; files: UploadedFile[] } | null>(null);
  const [hovered, setHovered]               = useState<string | null>(null);
  const [transitioning, setTransitioning]   = useState(false);
  const [displayView, setDisplayView]       = useState<ModalView>("methods");
  const [slideDir, setSlideDir]             = useState<"left" | "right">("left");
  const [contentVisible, setContentVisible] = useState(true);

  const changeView = (next: ModalView, dir: "left" | "right") => {
    if (transitioning) return;
    setTransitioning(true); setSlideDir(dir); setContentVisible(false);
    setTimeout(() => {
      setDisplayView(next);
      setTimeout(() => { setContentVisible(true); setTransitioning(false); }, 30);
    }, 180);
  };

  useEffect(() => {
    const id = "df-open-sans-font";
    if (!document.getElementById(id)) {
      const link = Object.assign(document.createElement("link"), {
        id, rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap",
      });
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isSuccess = displayView === "success";
  const slideX    = slideDir === "left" ? "-22px" : "22px";

  return (
    <>
      <style>{`
        @keyframes dfModalIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 18px)) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes dfSpin { to { transform: rotate(360deg); } }
        .df-card { transition: box-shadow 0.14s, transform 0.14s, border-color 0.14s !important; }
        .df-card:hover { transform: translateY(-1px) !important; box-shadow: 0 6px 18px rgba(0,0,0,0.09) !important; }
        .df-modal-root, .df-modal-root * { font-family: 'Open Sans', sans-serif !important; -webkit-font-smoothing: antialiased; }
        .df-dl-btn { transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease !important; }
        .df-dl-btn:hover { background: #C4A4FD !important; transform: translateY(-1px) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={displayView === "methods" ? onClose : undefined}
        style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", cursor: displayView === "methods" ? "pointer" : "default" }}
      />

      {/* Close button (methods view) */}
      {displayView === "methods" && (
        <button onClick={onClose} style={{ position: "fixed", top: 12, right: 12, zIndex: 1002, background: "none", border: "none", padding: 0, cursor: "pointer", ...flex("row", 0, "center", "center") }}>
          <div style={{ width: 36, height: 36, background: "white", borderRadius: 8, ...flex("row", 0, "center", "center") }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 3.75C9.81196 3.75 7.71354 4.61919 6.16637 6.16637C4.61919 7.71354 3.75 9.81196 3.75 12C3.75 13.0834 3.96339 14.1562 4.37799 15.1571C4.79259 16.1581 5.40029 17.0675 6.16637 17.8336C6.93245 18.5997 7.84193 19.2074 8.84286 19.622C9.8438 20.0366 10.9166 20.25 12 20.25C13.0834 20.25 14.1562 20.0366 15.1571 19.622C16.1581 19.2074 17.0675 18.5997 17.8336 17.8336C18.5997 17.0675 19.2074 16.1581 19.622 15.1571C20.0366 14.1562 20.25 13.0834 20.25 12C20.25 9.81196 19.3808 7.71354 17.8336 6.16637C16.2865 4.61919 14.188 3.75 12 3.75ZM5.10571 5.10571C6.93419 3.27723 9.41414 2.25 12 2.25C14.5859 2.25 17.0658 3.27723 18.8943 5.10571C20.7228 6.93419 21.75 9.41414 21.75 12C21.75 13.2804 21.4978 14.5482 21.0078 15.7312C20.5178 16.9141 19.7997 17.9889 18.8943 18.8943C17.9889 19.7997 16.9141 20.5178 15.7312 21.0078C14.5482 21.4978 13.2804 21.75 12 21.75C10.7196 21.75 9.45176 21.4978 8.26884 21.0078C7.08591 20.5178 6.01108 19.7997 5.10571 18.8943C4.20034 17.9889 3.48216 16.9141 2.99217 15.7312C2.50219 14.5482 2.25 13.2804 2.25 12C2.25 9.41414 3.27723 6.93419 5.10571 5.10571ZM9.21967 9.21967C9.51256 8.92678 9.98744 8.92678 10.2803 9.21967L12 10.9393L13.7197 9.21967C14.0126 8.92678 14.4874 8.92678 14.7803 9.21967C15.0732 9.51256 15.0732 9.98744 14.7803 10.2803L13.0607 12L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L12 13.0607L10.2803 14.7803C9.98744 15.0732 9.51256 15.0732 9.21967 14.7803C8.92678 14.4874 8.92678 14.0126 9.21967 13.7197L10.9393 12L9.21967 10.2803C8.92678 9.98744 8.92678 9.51256 9.21967 9.21967Z" fill="#111827"/>
            </svg>
          </div>
        </button>
      )}

      {/* Modal */}
      <div
        className="df-modal-root"
        onClick={(e) => e.stopPropagation()}
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, width: "90vw", maxWidth: 460, maxHeight: "92vh", overflowY: "auto", background: "white", borderRadius: 20, padding: isSuccess ? "0" : "24px", boxShadow: "0 24px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.05)", animation: "dfModalIn 0.28s cubic-bezier(0.22,1,0.36,1) forwards", fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif", transition: "padding 0.22s" }}
      >
        <div style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : `translateX(${slideX})`, transition: contentVisible ? "opacity 0.2s, transform 0.2s" : "opacity 0.17s, transform 0.17s" }}>

          {/* ── Methods view ── */}
          {displayView === "methods" && (
            <>
              <div style={{ marginBottom: 22, ...flex("col", 8) }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", ...fontBase }}>How would you like to add products?</div>
                <div style={{ fontSize: 13, color: "#6B7280", ...fontBase }}>Choose the method that fits your workflow.</div>
              </div>
              <div style={{ ...flex("col", 10) }}>
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    className="df-card"
                    onMouseEnter={() => m.ready && setHovered(m.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => {
                      if (!m.ready) return;
                      if (m.id === "manual") { onManualEntry(); return; }
                      if (m.id === "excel") changeView("excel", "left");
                      if (m.id === "api") changeView("api", "left");
                    }}
                    style={{ ...flex("row", 12, "center"), padding: "14px 16px", borderRadius: 14, border: `1px solid ${hovered === m.id ? "#D1D5DB" : "#E5E7EB"}`, background: hovered === m.id ? "#FAFAFA" : "white", cursor: m.ready ? "pointer" : "default", textAlign: "left", width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", opacity: m.ready ? 1 : 0.55 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: m.bg, border: "1px solid #E5E7EB", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
                      {m.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 2, ...fontBase }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>{m.desc}</div>
                    </div>
                    {m.ready ? (
                      <div style={{ ...flex("row", 5, "center"), fontSize: 13, fontWeight: 600, color: m.accent, whiteSpace: "nowrap", flexShrink: 0, ...fontBase }}>
                        Get Started
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#9CA3AF", ...fontBase, flexShrink: 0 }}>Soon</div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Excel view ── */}
          {displayView === "excel" && (
            <ExcelUploadView
              onBack={() => changeView("methods", "right")}
              onSuccess={(type, files) => { setSuccessData({ type, files }); changeView("success", "left"); }}
            />
          )}

          {/* ── Success view ── */}
          {displayView === "success" && successData && (
            <SuccessView
              productType={successData.type}
              files={successData.files}
              onReset={() => { setSuccessData(null); changeView("excel", "right"); }}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── DashboardFilters ─────────────────────────────────────────────────────────
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
          <Plus size={18}/> Add New Product
        </button>
      </div>
      {showModal && (
        <OnboardingModal
          onClose={() => setShowModal(false)}
          onManualEntry={() => { setShowModal(false); setCurrentView("addProduct"); }}
        />
      )}
    </>
  );
};

export default DashboardFilters;