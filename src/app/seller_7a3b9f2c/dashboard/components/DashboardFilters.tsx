"use client";

import React, { useRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardFiltersProps {
  setCurrentView: (view: DashboardView) => void;
}

type ModalView   = "methods" | "excel" | "api" | "success";
type ProductType = "drugs" | "food";

interface UploadedFile {
  file:      File;
  status:    "pending" | "uploading" | "done" | "error";
  error?:    string;
  progress?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const IMPORT_API_URL = "http://localhost:8080/api/v1/products/import";

const C = {
  primary:     "#4C1D95",
  primaryLight:"#EDE9FE",
  green:       "#4EB300",
  greenDark:   "#378200",
  greenLight:  "#DCF7CB",
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
    label: "Excel / CSV", desc: "Bulk upload via spreedsheet",
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

const TEMPLATES: Record<ProductType, { name: string; xlsx: string; csv: string, xls: string }> = {
  drugs: {
    name: "drug_products_template",
    xlsx: "/templates/drugs/Drugs_Pharma_Product_Upload_Template_v0.1.xlsx",
    csv:  "/templates/drugs/Drugs_Pharma_Product_Upload_Template_v0.1.csv",
    xls: "/templates/drugs/Drugs_Pharma_Product_Upload_Template_v0.1.xls"
  },
  food: {
    name: "food_products_template",
    xlsx: "/templates/food/Suppliments or Nutraceuticals _Product_Upload_Template_v0.1.xlsx",
    csv:  "/templates/drugs/Drugs_Pharma_Product_Upload_Template_v0.1.csv",
    xls: "/templates/drugs/Drugs_Pharma_Product_Upload_Template_v0.1.xls"
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

// ─── Reusable X icon ──────────────────────────────────────────────────────────
const XIcon = ({ size = 24, color = "#111827", strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

// ─── FileIcon ─────────────────────────────────────────────────────────────────
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

// ─── FileRow ──────────────────────────────────────────────────────────────────
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
    <div style={{ background: "#F3F4F6", borderRadius: 8, padding: 8, ...flex("col", 6) }}>
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
              {isError && <span style={{ color: "#DC2626", fontSize: 10 }}>Failed</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => !submitting && onRemove(index)}
          style={{ background: "none", border: "none", padding: "2px 4px", cursor: submitting ? "default" : "pointer", ...flex("row", 0, "center", "center"), flexShrink: 0, marginLeft: 8, opacity: submitting ? 0.3 : 1 }}
        >
          {isUploading ? (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="1.5"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M9.41606 3.01753C9.40709 3.01753 9.39364 3.01753 9.38019 3.01753C7.00826 2.77989 4.64081 2.69022 2.29578 2.92786L1.38108 3.01753C1.19276 3.03547 1.02686 2.90096 1.00893 2.71264C0.990993 2.52432 1.12551 2.3629 1.30934 2.34496L2.22404 2.25529C4.60942 2.01316 7.02619 2.10732 9.44744 2.34496C9.63128 2.3629 9.76579 2.5288 9.74786 2.71264C9.73441 2.8875 9.58644 3.01753 9.41606 3.01753Z" fill="#9CA3AF"/>
              <path d="M3.81123 2.56481C3.79329 2.56481 3.77536 2.56481 3.75294 2.56032C3.57359 2.52894 3.44804 2.35407 3.47943 2.17472L3.57807 1.58734C3.64981 1.15689 3.74845 0.560547 4.79318 0.560547H5.96794C7.01715 0.560547 7.11579 1.17931 7.18305 1.59182L7.28169 2.17472C7.31308 2.35855 7.18753 2.53342 7.00818 2.56032C6.82434 2.59171 6.64947 2.46616 6.62257 2.28681L6.52393 1.70392C6.46115 1.31383 6.4477 1.2376 5.97242 1.2376H4.79766C4.32238 1.2376 4.31341 1.30037 4.24616 1.69943L4.14303 2.28233C4.11613 2.44823 3.97264 2.56481 3.81123 2.56481Z" fill="#9CA3AF"/>
              <path d="M6.81979 10.2009H3.94119C2.37634 10.2009 2.31357 9.33549 2.26425 8.63602L1.9728 4.12083C1.95935 3.937 2.10283 3.77558 2.28666 3.76213C2.47498 3.75316 2.63192 3.89216 2.64537 4.076L2.93682 8.59118C2.98614 9.27272 3.00407 9.5283 3.94119 9.5283H6.81979C7.76139 9.5283 7.77932 9.27272 7.82416 8.59118L8.11561 4.076C8.12906 3.89216 8.29048 3.75316 8.47431 3.76213C8.65815 3.77558 8.80163 3.93251 8.78818 4.12083L8.49673 8.63602C8.44741 9.33549 8.38464 10.2009 6.81979 10.2009Z" fill="#9CA3AF"/>
              <path d="M6.1248 7.73458H4.6317C4.44786 7.73458 4.29541 7.58213 4.29541 7.3983C4.29541 7.21446 4.44786 7.06201 4.6317 7.06201H6.1248C6.30864 7.06201 6.46109 7.21446 6.46109 7.3983C6.46109 7.58213 6.30864 7.73458 6.1248 7.73458Z" fill="#9CA3AF"/>
              <path d="M6.50153 5.94112H4.25963C4.07579 5.94112 3.92334 5.78868 3.92334 5.60484C3.92334 5.421 4.07579 5.26855 4.25963 5.26855H6.50153C6.68536 5.26855 6.83781 5.421 6.83781 5.60484C6.83781 5.78868 6.68536 5.94112 6.50153 5.94112Z" fill="#9CA3AF"/>
            </svg>
          )}
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
  const inputRef  = useRef<HTMLInputElement>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const updateFile = (key: string, patch: Partial<UploadedFile>) =>
    setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, ...patch } : f));

  const runFakeProgress = (key: string) => {
    let step = 0;
    const tick = () => {
      if (step >= PROGRESS_STEPS.length) {
        setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, status: "done" as const, progress: 100 } : f));
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
    setFiles((prev) => {
      const filtered = newFiles.filter((f) => !prev.some((ex) => ex.file.name === f.name && ex.file.size === f.size));
      return [...prev, ...filtered.map((f) => ({ file: f, status: "uploading" as const, progress: 0 }))];
    });
    newFiles.forEach((f) => setTimeout(() => runFakeProgress(fileKey(f)), 50));
  };

  const removeFile = (i: number) => {
    setFiles((prev) => {
      const key   = fileKey(prev[i].file);
      const timer = timersRef.current.get(key);
      if (timer) { clearTimeout(timer); timersRef.current.delete(key); }
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      [".xlsx", ".csv", ".xls"].some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (dropped.length) addFiles(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { addFiles(Array.from(e.target.files)); e.target.value = ""; }
  };

  const handleSubmit = async () => {
    const readyFiles = files.filter((f) => f.status === "done");
    if (!readyFiles.length || submitting) return;
    setSubmitting(true);

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
        const res = await fetch(IMPORT_API_URL, { method: "POST", body: fd });
        if (!res.ok) throw new Error(`${res.status}`);
        updateFile(key, { status: "done", progress: 100 });
      } catch (err) {
        updateFile(key, { status: "error", error: err instanceof Error ? err.message : "Failed" });
      }
    }

    await new Promise((r) => setTimeout(r, 250));
    setSubmitting(false);
    onSuccess(productType, files);
  };

  const allReady = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");
  const template = TEMPLATES[productType];

  // Download icon SVG
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

      {/* Title */}
      <div style={{ ...flex("col", 5) }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", ...fontBase, lineHeight: 1.2 }}>Upload Excel / CSV</div>
        <div style={{ fontSize: 14, color: "#6B7280", ...fontBase }}>Download our template, fill in the product data, and upload</div>
      </div>

      {/* Product type */}
      <div style={{ ...flex("col", 12) }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", ...fontBase }}>Select the type of product you want to upload</div>
        <div style={{ ...flex("row", 8) }}>
          {(["drugs", "food"] as ProductType[]).map((tab) => {
            const active = productType === tab;
            return (
              <button
                key={tab}
                onClick={() => setProductType(tab)}
                style={{ height: 34, padding: "0 12px", borderRadius: 8, border: `1.5px solid ${active ? C.primary : "#D1D5DB"}`, background: active ? C.primaryLight : "white", color: active ? C.primary : "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", ...flex("row", 6, "center"), ...fontBase, transition: "all 0.15s" }}
              >
                {active && (
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {tab === "drugs" ? "Drugs" : "Food & Infant Nutrition"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template download */}
      <div style={{ ...flex("row", 0, "center", "space-between"), padding: "8px 12px", background: "#FAF5FF", outline: "1px solid #E5E7EB", outlineOffset: "-1px", borderRadius: 12 }}>
        <div style={{ ...flex("col", 4) }}>
          <div style={{ fontWeight: 600, color: "#5B21B6", fontSize: 14, ...fontBase, lineHeight: "20px" }}>{template.name}</div>
          <div style={{ color: "#4B5563", fontSize: 12, ...fontBase, lineHeight: "16px" }}>Download your required format and fill before uploading</div>
        </div>
        <div style={{ ...flex("row", 8, "center") }}>
          <a
            href={template.csv}
            download={`${template.name}.csv`}
            className="df-dl-btn"
            style={{ background: "#9F75FC", color: "white", borderRadius: 8, padding: "0 10px", height: 34, ...flex("row", 4, "center", "center"), fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0, border: "none", ...fontBase, letterSpacing: 0.2, gap: 4, transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
          >
            <DownloadIcon color="white" />
            .csv
          </a>
          <a
            href={template.xlsx}
            download={`${template.name}.xlsx`}
            className="df-dl-btn"
            style={{ background: "#9F75FC", color: "white", borderRadius: 8, padding: "0 10px", height: 34, ...flex("row", 4, "center", "center"), fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0, border: "none", ...fontBase, letterSpacing: 0.2, gap: 4, transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
          >
            <DownloadIcon color="white" />
            .xlsx
          </a>
          <a
            href={template.xls}
            download={`${template.name}.xls`}
            className="df-dl-btn"
            style={{ background: "#9F75FC", color: "white", borderRadius: 8, padding: "0 10px", height: 34, ...flex("row", 4, "center", "center"), fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0, border: "none", ...fontBase, letterSpacing: 0.2, gap: 4, transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
          >
            <DownloadIcon color="white" />
            .xls
          </a>
        </div>
      </div>

      {/* Drop zone */}
      <div style={{ background: "#F9FAFB", boxShadow: "inset 0 0 0 0.5px #E5E7EB", borderRadius: 16, padding: 10, ...flex("col", 10) }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ background: dragging ? "#F5F3FF" : "#F9FAFB", border: "1.5px dashed #6D28D9", borderRadius: 8, padding: "20px 10px", cursor: "pointer", ...flex("col", 16, "center", "center"), transition: "background 0.18s ease", minHeight: files.length ? 100 : 160 }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.csv,.xls" multiple style={{ display: "none" }} onChange={handleFileInput}/>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M32.5075 15.6583L9.43565 16.5154C8.67212 16.5154 8.22691 16.8012 8.0166 17.5353L3.2273 33.9198C3.02929 34.6161 2.08003 34.9419 1.41968 34.9419C0.759773 34.9419 0.219727 34.4019 0.219727 33.742V29.1503V10.3386V9.43986V6.68562C0.219727 5.76227 0.968328 5.01367 1.89168 5.01367H13.771C14.2144 5.01367 14.6394 5.18974 14.9529 5.50323L18.3995 8.94987C18.713 9.26336 19.1385 9.43942 19.5815 9.43942H30.8356C31.7589 9.43942 32.5075 10.188 32.5075 11.1114V11.6826V15.6583Z" fill="#E0AD31"/>
            <path d="M1.41968 34.9419C2.07959 34.9419 2.42162 34.4383 2.61964 33.7419L7.44757 16.8986C7.65788 16.1645 8.3292 15.6587 9.09317 15.6587H38.6768C39.3832 15.6587 39.8908 16.3375 39.6914 17.0154L34.9074 33.2721C34.6914 34.0409 34.2176 34.9485 33.2377 34.9419H1.41968Z" fill="#FFC843"/>
          </svg>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 4, ...fontBase }}>
              {dragging ? "Drop it here!" : "Drag & drop your file"}
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", ...fontBase }}>or click to browse — .xlsx, .csv, .xls</div>
          </div>
        </div>

        {files.length > 0 && (
          <div style={{ ...flex("col", 8) }}>
            {files.map((uf, i) => (
              <FileRow key={`${uf.file.name}-${i}`} uf={uf} index={i} onRemove={removeFile} submitting={submitting}/>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!allReady || submitting}
        style={{ width: "100%", height: 50, minHeight: 50, borderRadius: 10, border: "none", background: allReady ? "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)" : "#F3F4F6", cursor: allReady && !submitting ? "pointer" : "not-allowed", ...flex("row", 8, "center", "center"), transition: "all 0.2s", ...fontBase, boxShadow: allReady ? "0 4px 14px rgba(76,29,149,0.35)" : "none" }}
      >
        <span style={{ color: allReady ? "white" : "#9CA3AF", opacity: allReady ? 1 : 0.5, fontWeight: 700, fontSize: 16, ...fontBase, ...flex("row", 8, "center") }}>
          {submitting ? (
            <>
              <span style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }}/>
              Uploading...
            </>
          ) : "Submit File"}
        </span>
      </button>
    </div>
  );
}

// ─── SuccessView ──────────────────────────────────────────────────────────────
function SuccessView({ files, onClose }: {
  productType: ProductType; files: UploadedFile[]; onReset: () => void; onClose?: () => void;
}) {
  const fileName = files?.[0]?.file?.name ?? "Suppliments or Nutraceuticals Product_Upload_Template_v0.1 (1).xlsx";
  return (
    <div style={{ ...flex("col", 24, "center"), padding: "32px 24px", position: "relative" }}>
      {onClose && (
        <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, background: "none", border: "1.5px solid #1E1E1D", borderRadius: "50%", cursor: "pointer", ...flex("row", 0, "center", "center"), padding: 0 }}>
          <XIcon size={12} color="#1E1E1D" strokeWidth={2.5}/>
        </button>
      )}
      <div style={{ padding: 24, background: C.greenLight, borderRadius: "50%", outline: "1px solid #4EB300", outlineOffset: "-1.13px", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke={C.greenDark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ ...flex("col", 12, "center"), width: "100%" }}>
        <div style={{ padding: "4px 8px", fontSize: 18, fontWeight: 600, color: "#000000", ...fontBase, textAlign: "center", lineHeight: "24px" }}>Submitted Successfully!</div>
        <div style={{ ...flex("col", 4, "center"), width: "100%" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.greenDark, ...fontBase, textAlign: "center", lineHeight: "20px", width: "100%" }}>{fileName}</div>
          <div style={{ fontSize: 14, fontWeight: 400, color: "#000000", ...fontBase, textAlign: "center", lineHeight: "20px", width: "100%" }}>is being processed</div>
        </div>
      </div>
      <div style={{ height: 40, minHeight: 40, background: C.greenLight, outline: "1px solid #4EB300", outlineOffset: "-1px", borderRadius: 8, ...flex("row", 0, "center", "center"), padding: "6px 12px", width: "100%" }}>
        <span style={{ fontSize: 12, fontWeight: 400, color: C.greenDark, ...fontBase, textAlign: "center", lineHeight: "16px" }}>
          Processing usually takes 2-5 minutes for up to 500 products
        </span>
      </div>
    </div>
  );
}

// ─── ApiIntegrationView ───────────────────────────────────────────────────────
function ApiIntegrationView({ onBack, onSuccess }: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [productType, setProductType] = useState<ProductType>("drugs");
  const [apiKey, setApiKey]           = useState("");
  const [endpoint, setEndpoint]       = useState("");
  const [authType, setAuthType]       = useState<"bearer" | "basic" | "apikey">("bearer");
  const [testing, setTesting]         = useState(false);
  const [testStatus, setTestStatus]   = useState<"idle" | "success" | "error">("idle");
  const [showKey, setShowKey]         = useState(false);
  const [copied, setCopied]           = useState(false);

  const sampleEndpoint = productType === "drugs"
    ? "https://your-system.com/api/v1/drugs"
    : "https://your-system.com/api/v1/food-products";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };

  const handleTest = async () => {
    if (!endpoint || !apiKey || testing) return;
    setTesting(true); setTestStatus("idle");
    await new Promise((r) => setTimeout(r, 1600));
    setTesting(false);
    setTestStatus("success");
  };

  const allFilled = !!endpoint.trim() && !!apiKey.trim();

  const AUTH_TYPES: { id: "bearer" | "basic" | "apikey"; label: string }[] = [
    { id: "bearer",  label: "Bearer Token" },
    { id: "basic",   label: "Basic Auth"   },
    { id: "apikey",  label: "API Key"      },
  ];

  const InputLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, ...fontBase }}>{children}</div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 40, borderRadius: 8, border: "1.5px solid #E5E7EB",
    padding: "0 12px", fontSize: 13, color: "#111827", background: "#FAFAFA",
    outline: "none", boxSizing: "border-box", ...fontBase,
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ ...flex("col", 16) }}>
      {/* Back */}
      <button onClick={onBack} style={{ ...flex("row", 6, "center"), background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 14, fontWeight: 600, padding: 0, ...fontBase, alignSelf: "flex-start" }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {/* Title */}
      <div style={{ ...flex("col", 5) }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", ...fontBase, lineHeight: 1.2 }}>API Integration</div>
        <div style={{ fontSize: 14, color: "#6B7280", ...fontBase }}>Connect your system via REST API to sync products automatically</div>
      </div>

      {/* Product type */}
      <div style={{ ...flex("col", 10) }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", ...fontBase }}>Select the type of product</div>
        <div style={{ ...flex("row", 8) }}>
          {(["drugs", "food"] as ProductType[]).map((tab) => {
            const active = productType === tab;
            return (
              <button
                key={tab}
                onClick={() => setProductType(tab)}
                style={{ height: 34, padding: "0 12px", borderRadius: 8, border: `1.5px solid ${active ? C.primary : "#D1D5DB"}`, background: active ? C.primaryLight : "white", color: active ? C.primary : "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", ...flex("row", 6, "center"), ...fontBase, transition: "all 0.15s" }}
              >
                {active && (
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {tab === "drugs" ? "Drugs" : "Food & Infant Nutrition"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sample endpoint info box */}
      <div style={{ background: "#FFFBEB", outline: "1px solid #FCD34D", outlineOffset: "-1px", borderRadius: 12, padding: "10px 14px", ...flex("row", 10, "flex-start") }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="9" stroke="#9F75FC" strokeWidth="1.8"/>
          <path d="M12 8v4M12 16h.01" stroke="#9F75FC" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <div style={{ ...flex("col", 4), flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#9F75FC", ...fontBase }}>Expected endpoint format</div>
          <div style={{ ...flex("row", 6, "center"), minWidth: 0 }}>
            <code style={{ fontSize: 11, color: "#78350F", background: "#FEF3C7", padding: "2px 6px", borderRadius: 4, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
              {sampleEndpoint}
            </code>
            <button
              onClick={() => handleCopy(sampleEndpoint)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0, ...flex("row", 0, "center", "center"), color: "#D97706" }}
            >
              {copied ? (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke="#D97706" strokeWidth="1.8"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#D97706" strokeWidth="1.8"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div style={{ ...flex("col", 14) }}>

        {/* Auth type */}
        <div>
          <InputLabel>Authentication Type</InputLabel>
          <div style={{ ...flex("row", 8) }}>
            {AUTH_TYPES.map((a) => {
              const active = authType === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAuthType(a.id)}
                  style={{ flex: 1, height: 34, borderRadius: 8, border: `1.5px solid ${active ? "#D97706" : "#E5E7EB"}`, background: active ? "#FFFBEB" : "white", color: active ? "#92400E" : "#6B7280", fontWeight: active ? 700 : 500, fontSize: 12, cursor: "pointer", ...fontBase, transition: "all 0.15s" }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Endpoint URL */}
        <div>
          <InputLabel>API Endpoint URL</InputLabel>
          <input
            value={endpoint}
            onChange={(e) => { setEndpoint(e.target.value); setTestStatus("idle"); }}
            placeholder="https://your-system.com/api/v1/products"
            className="df-api-input"
            style={inputStyle}
          />
        </div>

        {/* API Key / Token */}
        <div>
          <InputLabel>{authType === "bearer" ? "Bearer Token" : authType === "basic" ? "Password / Secret" : "API Key"}</InputLabel>
          <div style={{ position: "relative" }}>
            <input
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
              type={showKey ? "text" : "password"}
              placeholder={authType === "bearer" ? "eyJhbGciOiJIUzI1NiIs..." : authType === "basic" ? "your-secret-password" : "sk-xxxxxxxxxxxxxxxx"}
              className="df-api-input"
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9CA3AF", ...flex("row", 0, "center", "center") }}
            >
              {showKey ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/></svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="1.8"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Test connection result */}
        {testStatus === "success" && (
          <div style={{ ...flex("row", 8, "center"), padding: "10px 12px", background: "#DCFCE7", borderRadius: 8, outline: "1px solid #4EB300", outlineOffset: "-1px" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#16A34A", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#166534", ...fontBase }}>Connection successful! API is reachable.</span>
          </div>
        )}
        {testStatus === "error" && (
          <div style={{ ...flex("row", 8, "center"), padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, outline: "1px solid #FCA5A5", outlineOffset: "-1px" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", ...fontBase }}>Could not reach endpoint. Check URL and credentials.</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ ...flex("row", 10) }}>
        {/* Test connection */}
        <button
          onClick={handleTest}
          disabled={!allFilled || testing}
          style={{ flex: 1, height: 46, borderRadius: 10, border: `1.5px solid ${allFilled ? "#9F75FC" : "#E5E7EB"}`, background: "white", cursor: allFilled && !testing ? "pointer" : "not-allowed", ...flex("row", 8, "center", "center"), ...fontBase, transition: "all 0.2s", opacity: allFilled ? 1 : 0.5 }}
        >
          {testing ? (
            <>
              <span style={{ width: 14, height: 14, border: "2px solid #9F75FC", borderTopColor: "#9F75FC", borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#9F75FC", ...fontBase }}>Testing...</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#9F75FC", ...fontBase }}>Test Connection</span>
            </>
          )}
        </button>

        {/* Connect */}
        <button
          onClick={() => allFilled && testStatus === "success" && onSuccess()}
          disabled={!allFilled || testStatus !== "success"}
          style={{ flex: 1, height: 46, borderRadius: 10, border: "none", background: allFilled && testStatus === "success" ? "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)" : "#F3F4F6", cursor: allFilled && testStatus === "success" ? "pointer" : "not-allowed", ...flex("row", 8, "center", "center"), ...fontBase, transition: "all 0.2s", boxShadow: allFilled && testStatus === "success" ? "0 4px 14px rgba(76,29,149,0.35)" : "none" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: allFilled && testStatus === "success" ? "white" : "#9CA3AF", ...fontBase }}>Connect API</span>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke={allFilled && testStatus === "success" ? "white" : "#9CA3AF"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
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
        .df-dl-btn:hover { background: #C4A4FD !important; transform: translateY(-1px) !important; box-shadow: 0 4px 12px rgba(159,117,252,0.45) !important; font-weight: 800 !important; }
        .df-api-input:focus { border-color: #7C3AED !important; background: #fff !important; outline: none !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={displayView === "methods" ? onClose : undefined}
        style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", minHeight: "100dvh", zIndex: 998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", cursor: displayView === "methods" ? "pointer" : "default" }}
      />

      {/* Close button — methods view only, outside modal, square */}
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

          {displayView === "methods" && (
            <>
              <div style={{ marginBottom: 22, ...flex("col", 8) }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", ...fontBase }}>How would you like to add products?</div>
                <div style={{ fontSize: 14, color: "#6B7280", ...fontBase }}>Choose the method that best fits for your workflow.</div>
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
                    style={{ ...flex("row", 12, "center"), padding: "14px 16px", borderRadius: 14, border: `1px solid ${hovered === m.id ? "#D1D5DB" : "#E5E7EB"}`, background: hovered === m.id ? "#FAFAFA" : "white", cursor: m.ready ? "pointer" : "default", textAlign: "left", width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: m.bg, border: "1px solid #E5E7EB", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
                      {m.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 2, ...fontBase }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>{m.desc}</div>
                    </div>
                    {m.ready ? (
                      <div style={{ ...flex("row", 5, "center"), fontSize: 14, fontWeight: 600, color: m.accent, whiteSpace: "nowrap", flexShrink: 0, ...fontBase }}>
                        Get Started
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : (
                      <div style={{ height: 28, padding: "0 10px", borderRadius: 6, background: "#F3F4F6", border: "1px solid #E5E7EB", ...flex("row", 0, "center"), fontSize: 12, fontWeight: 500, color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0, ...fontBase }}>
                        Coming soon
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 18, textAlign: "center", fontSize: 12, color: "#9CA3AF", ...fontBase }}>Database sync coming soon</div>
            </>
          )}

          {displayView === "api" && (
            <ApiIntegrationView
              onBack={() => changeView("methods", "right")}
              onSuccess={() => changeView("methods", "right")}
            />
          )}

          {displayView === "excel" && (
            <ExcelUploadView
              onBack={() => changeView("methods", "right")}
              onSuccess={(type, files) => { setSuccessData({ type, files }); changeView("success", "left"); }}
            />
          )}

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