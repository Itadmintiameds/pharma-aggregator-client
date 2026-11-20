"use client";
import { useRouter } from "next/navigation";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";
import { getCurrentSellerId } from "@/src/services/product/sellerContext";

// ─── Types ────────────────────────────────────────────────────────────────────

// interface DashboardFiltersProps {
//   setCurrentView: (view: DashboardView) => void;
// }


interface DashboardFiltersProps {
  setCurrentView: (view: DashboardView) => void;
  onRefreshRequested?: () => void;
}

type ModalView = "methods" | "excel" | "api" | "success";
type ProductType = "drugs" | "medical_devices_non_consumable" | "medical_devices_consumable" | "cosmetics" | "supplements" | "food_infant";
type MedicalDeviceSubType = "consumable" | "non_consumable";

interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  progress?: number;
}

interface ValidationError {
  rowNumber: number;
  productName: string;
  errorMessage: string;
}

interface UploadResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  totalRows: number;
  validationErrors: ValidationError[];
  warnings?: string[];
  message?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const IMPORT_API_URL = `${API_URL}/products/import`;

const C = {
  primary: "#4C1D95",
  primaryLight: "#EDE9FE",
  green: "#4EB300",
  greenDark: "#378200",
  greenLight: "#DCF7CB",
} as const;

const METHODS = [
  {
    id: "manual", ready: true, accent: C.primary, bg: C.primaryLight,
    label: "Manual Entry", desc: "Fill the product details using the form",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "excel", ready: true, accent: C.greenDark, bg: "#DCFCE7",
    label: "Excel / CSV", desc: "Bulk upload via spreadsheet",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14,2 14,8 20,8" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8" y1="13" x2="16" y2="13" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="17" x2="16" y2="17" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "api", ready: false, accent: "#D97706", bg: "#FEF3C7",
    label: "API Integration", desc: "Connect via REST API",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 4l-4 16" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "db", ready: false, accent: "#CA8A04", bg: "#FEFCE8",
    label: "Database Sync", desc: "Sync directly from your database",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#CA8A04" strokeWidth="2" />
        <path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="#CA8A04" strokeWidth="2" />
        <path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" stroke="#CA8A04" strokeWidth="2" />
      </svg>
    ),
  },
];

const PROGRESS_STEPS = [10, 25, 40, 55, 70, 85, 100];

const TEMPLATES: Record<ProductType, { name: string; xlsx: string; csv: string; xls: string }> = {
  drugs: {
    name: "drug_products_template",
    xlsx: "/templates/drugs/TiaMeds_Drugs_Import_Template_v1.xlsx",
    csv: "/templates/drugs/CSV-Drugs Template.csv",
    xls: "/templates/drugs/XLS-Drugs Template.xls",
  },
  medical_devices_non_consumable: {
    name: "medical_devices_non_consumable_template",
    xlsx: "/templates/medical-devices/nonconsumable/TiaMeds_NonConsumable_Medical_Devices_Import_Template_v1.xlsx",
    csv: "/templates/medical-devices/nonconsumable/CSV-Non Consumable Template.csv",
    xls: "/templates/medical-devices/nonconsumable/XLS-Non Consumable Template.xls",
  },
  medical_devices_consumable: {
    name: "medical_devices_consumable_template",
    xlsx: "/templates/medical-devices/consumable/TiaMeds_Consumable_Medical_Devices_Import_Template_v1.xlsx",
    csv: "/templates/medical-devices/consumable/CSV-Consumable Template.csv",
    xls: "/templates/medical-devices/consumable/XLS-Consumable Template.xls",
  },
  cosmetics: {
    name: "cosmetics_template",
    xlsx: "/templates/cosmetics/TiaMeds_Cosmetic_PersonalUse_Import_Template_v1.xlsx",
    csv: "/templates/cosmetics/CSV-Cosmetics Template.csv",
    xls: "/templates/cosmetics/XLS-Cosmetics Template.xls",
  },
  supplements: {
    name: "supplements_template",
    xlsx: "/templates/supplements/TiaMeds_Supplements_Import_Template_v1.xlsx",
    csv: "/templates/supplements/CSV-Supplements-Neutraceuticals_Product_Upload_Template_v0.1 1 3.csv",
    xls: "/templates/supplements/XLS-Supplements-Neutraceuticals_Product_Upload_Template 3.xls",
  },
  food_infant: {
    name: "food_infant_template",
    xlsx: "/templates/food&Infant/TiaMeds_Food_Infant_Import_Template_v1.xlsx",
    csv:  "/templates/food&Infant/CSV-Food&InfantHeader.csv",
    xls:  "/templates/food&Infant/XLS-Food&InfantHeader.xls",
  },
};

// categoryId mapping (confirmed via Postman):
//   Drugs                            → 1
//   Medical Devices (Consumable)     → 5
//   Medical Devices (Non-Consumable) → 6
//   Cosmetics                        → 4
const MEDICAL_DEVICE_CONSUMABLE_IDS = [5];
const MEDICAL_DEVICE_NON_CONSUMABLE_IDS = [6];
const COSMETICS_IDS = [4];
const SUPPLEMENTS_IDS = [2];

const getCategoryId = (productType: ProductType): number => {
  if (productType === "medical_devices_consumable") return 5;
  if (productType === "medical_devices_non_consumable") return 6;
  if (productType === "supplements") return 2;
  if (productType === "cosmetics")                      return 4;
  if (productType === "food_infant")                    return 3;
  return 1; // drugs
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
  ...(gap ? { gap } : {}),
  ...(align ? { alignItems: align } : {}),
  ...(justify ? { justifyContent: justify } : {}),
});

const XIcon = ({ size = 24, color = "#111827", strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

const DownloadIcon = ({ color }: { color: string }) => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
    <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" fill={color} />
    <path d="M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function FileIcon({ ext = "XLSX" }: { ext?: string }) {
  return (
    <div style={{ position: "relative", width: 44, height: 52, flexShrink: 0 }}>
      <div style={{ width: 44, height: 52, borderRadius: 6, background: "#F9FAFB", border: "1px solid #E5E7EB", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 12px 12px 0", borderColor: "transparent #E5E7EB transparent transparent" }} />
        {[16, 22, 28].map((top) => (
          <div key={top} style={{ position: "absolute", top, left: 6, right: top === 28 ? 12 : 8, height: 2, background: "#E5E7EB", borderRadius: 1 }} />
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
  const fileSizeKB = Math.max(1, Math.round(uf.file.size / 1024));
  const ext = (uf.file.name.split(".").pop() ?? "xlsx").toUpperCase();
  const isUploading = uf.status === "uploading";
  const isDone = uf.status === "done";
  const isError = uf.status === "error";

  const sizeLabel = isUploading
    ? `${fileSizeKB} KB of ${fileSizeKB * 2} KB •`
    : isDone
      ? `${fileSizeKB} KB of ${fileSizeKB} KB •`
      : `${fileSizeKB} KB •`;

  return (
    <div style={{ background: isError ? "#FEF2F2" : "#FFFFFF", borderRadius: 8, padding: 8, ...flex("col", 6), border: `1px solid ${isError ? "#FECACA" : "#E5E7EB"}`, boxShadow: isError ? "none" : "0 1px 2px rgba(16,24,40,0.04)" }}>
      <div style={{ ...flex("row", 0, "flex-start", "space-between") }}>
        <div style={{ ...flex("row", 12, "center"), flex: 1, minWidth: 0 }}>
          <FileIcon ext={ext} />
          <div style={{ ...flex("col", 6), minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fontBase, lineHeight: "16px" }}>
              {uf.file.name}
            </div>
            <div style={{ ...flex("row", 4, "center"), fontSize: 10, ...fontBase }}>
              <span style={{ color: "#6B7280", whiteSpace: "nowrap" }}>{sizeLabel}</span>
              {isUploading && (
                <span style={{ ...flex("row", 3, "center"), color: "#374151" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #D1FAE5", borderTopColor: "#16A34A", display: "inline-block", flexShrink: 0, animation: "dfSpin 0.65s linear infinite" }} />
                  <span style={{ color: "#111827", fontSize: 10 }}>Uploading...</span>
                </span>
              )}
              {isDone && (
                <span style={{ ...flex("row", 4, "center") }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#16A34A", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span style={{ color: "#111827", fontWeight: 600, fontSize: 10 }}>Completed</span>
                </span>
              )}
              {isError && (
                <span style={{ ...flex("row", 4, "center") }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#DC2626", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M3 3l4 4M7 3L3 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span title={uf.error ?? "Upload failed"} style={{ color: "#DC2626", fontWeight: 600, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>{uf.error ?? "Upload failed"}</span>
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
          <div style={{ height: "100%", background: "#7C3AED", borderRadius: 99, width: `${uf.progress ?? 0}%`, transition: "width 0.3s ease" }} />
        </div>
      )}
    </div>
  );
}

// ─── MedicalDeviceSubTypePicker ───────────────────────────────────────────────
function MedicalDeviceSubTypePicker({
  selected,
  onChange,
}: {
  selected: MedicalDeviceSubType;
  onChange: (v: MedicalDeviceSubType) => void;
}) {
  return (
    <div style={{ ...flex("col", 8) }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", ...fontBase }}>
        Select device type
      </div>
      <div style={{ ...flex("row", 10) }}>
        <button
          onClick={() => onChange("consumable")}
          style={{
            flex: 1, padding: "7px 10px", borderRadius: 10,
            border: `1.5px solid ${selected === "consumable" ? C.primary : "#E5E7EB"}`,
            background: selected === "consumable" ? C.primaryLight : "#FAFAFA",
            color: selected === "consumable" ? C.primary : "#374151",
            fontWeight: selected === "consumable" ? 700 : 500,
            fontSize: 12, cursor: "pointer", textAlign: "left", ...fontBase,
            transition: "all 0.15s", ...flex("col", 3),
          }}
        >
          <div style={{ ...flex("row", 6, "center") }}>
            {selected === "consumable" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span>Consumable</span>
          </div>
          <span style={{ fontSize: 10, color: selected === "consumable" ? "#7C3AED" : "#9CA3AF", fontWeight: 400 }}>
            Single-use / disposable
          </span>
        </button>

        <button
          onClick={() => onChange("non_consumable")}
          style={{
            flex: 1, padding: "7px 10px", borderRadius: 10,
            border: `1.5px solid ${selected === "non_consumable" ? C.primary : "#E5E7EB"}`,
            background: selected === "non_consumable" ? C.primaryLight : "#FAFAFA",
            color: selected === "non_consumable" ? C.primary : "#374151",
            fontWeight: selected === "non_consumable" ? 700 : 500,
            fontSize: 12, cursor: "pointer", textAlign: "left", ...fontBase,
            transition: "all 0.15s", ...flex("col", 3),
          }}
        >
          <div style={{ ...flex("row", 6, "center") }}>
            {selected === "non_consumable" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span>Non-Consumable</span>
          </div>
          <span style={{ fontSize: 10, color: selected === "non_consumable" ? "#7C3AED" : "#9CA3AF", fontWeight: 400 }}>
            Durable / reusable devices
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── ValidationErrorPanel ─────────────────────────────────────────────────────
function ValidationErrorPanel({
  errors, successCount, failureCount, totalRows, onDownload, onDismiss,
}: {
  errors: ValidationError[]; successCount: number; failureCount: number;
  totalRows: number; onDownload: () => void; onDismiss: () => void;
}) {
  const allFailed = successCount === 0 && failureCount > 0;
  const th: React.CSSProperties = { padding: "7px 12px", textAlign: "left", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6B7280", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" };
  const td: React.CSSProperties = { padding: "8px 12px", fontSize: 12, lineHeight: 1.45, borderBottom: "1px solid #F3F4F6", verticalAlign: "top", wordBreak: "break-word" };
  const chip = (text: string, bg: string, fg: string) => (
    <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap", ...fontBase }}>{text}</span>
  );
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
      {/* Header */}
      <div style={{ ...flex("row", 10, "center", "space-between"), padding: "10px 12px 10px 14px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ ...flex("row", 10, "center"), minWidth: 0 }}>
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: allFailed ? "#FEE2E2" : "#FEF3C7", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M12 8v5M12 16.5h.01" stroke={allFailed ? "#DC2626" : "#D97706"} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <div style={{ ...flex("col", 1), minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", ...fontBase }}>
              {allFailed ? "No rows were imported" : `${successCount} imported, ${failureCount} need attention`}
            </span>
            <span style={{ fontSize: 11, color: "#6B7280", ...fontBase }}>
              {allFailed ? `All ${totalRows} row(s) failed validation` : `${totalRows} row(s) processed`}
            </span>
          </div>
        </div>
        <div style={{ ...flex("row", 6, "center"), flexShrink: 0 }}>
          {!allFailed && chip(`${successCount} added`, "#DCFCE7", "#166534")}
          {chip(`${failureCount} failed`, "#FEE2E2", "#991B1B")}
          <button onClick={onDismiss} aria-label="Dismiss" className="df-close-btn" style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", ...flex("row", 0, "center", "center") }}>
            <XIcon size={14} color="#6B7280" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ maxHeight: 190, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, ...fontBase }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ ...th, width: 52 }}>Row</th>
              <th style={{ ...th, width: "32%" }}>Product</th>
              <th style={th}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err, idx) => (
              <tr key={idx}>
                <td style={{ ...td, color: "#6B7280", fontWeight: 600 }}>{err.rowNumber}</td>
                <td style={{ ...td, color: "#111827", fontWeight: 500 }}>{err.productName || <em style={{ color: "#9CA3AF" }}>Unnamed</em>}</td>
                <td style={{ ...td, color: "#B91C1C" }}>{err.errorMessage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ ...flex("row", 0, "center", "flex-end"), padding: "8px 12px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
        <button
          onClick={onDownload}
          style={{ ...flex("row", 6, "center", "center"), height: 30, padding: "0 12px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#374151", ...fontBase }}
        >
          <DownloadIcon color="#374151" />
          Download error report
        </button>
      </div>
    </div>
  );
}

// ─── PreflightReviewDialog ────────────────────────────────────────────────────
// Shown after the file has been checked (nothing saved yet). The seller sees how many rows are
// correct / wrong, which rows are wrong and why, then decides: import only the correct rows,
// or cancel and import nothing.
export function PreflightReviewDialog({
  fileName, result, onDownload, onApprove, onCancel,
}: {
  fileName: string; result: UploadResult; onDownload: () => void; onApprove: () => void; onCancel: () => void;
}) {
  const good = result.successCount;
  const bad = result.failureCount;
  const canImport = good > 0;
  if (typeof document === "undefined") return null;

  const tile = (label: string, value: number, dot: string, fg: string) => (
    <div style={{ flex: 1, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", ...flex("col", 3) }}>
      <div style={{ ...flex("row", 6, "center") }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", ...fontBase }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: fg, lineHeight: 1.1, ...fontBase }}>{value}</div>
    </div>
  );
  const th: React.CSSProperties = { padding: "7px 12px", textAlign: "left", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6B7280", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" };
  const td: React.CSSProperties = { padding: "8px 12px", fontSize: 12, borderBottom: "1px solid #F3F4F6", verticalAlign: "top", wordBreak: "break-word" };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review file before import"
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(17,24,39,0.55)", backdropFilter: "blur(4px)", ...flex("row", 0, "center", "center"), padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "86vh", ...flex("col", 0), boxShadow: "0 24px 60px rgba(16,24,40,0.28)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ ...flex("row", 12, "flex-start", "space-between"), padding: "14px 18px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ ...flex("col", 2), minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", ...fontBase }}>Review your file</span>
            <span style={{ fontSize: 11, color: "#6B7280", wordBreak: "break-all", ...fontBase }}>{fileName} · nothing has been saved yet</span>
          </div>
          <button onClick={onCancel} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, flexShrink: 0 }}>
            <XIcon size={16} color="#6B7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ ...flex("col", 12), padding: "14px 18px", overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>
          <div style={{ ...flex("row", 8) }}>
            {tile("Total rows", result.totalRows, "#9CA3AF", "#111827")}
            {tile("Ready to import", good, "#16A34A", "#166534")}
            {tile("Need fixing", bad, "#DC2626", "#991B1B")}
          </div>

          {result.warnings && result.warnings.length > 0 && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "7px 10px", fontSize: 12, color: "#92400E", maxHeight: 72, overflowY: "auto", lineHeight: 1.5, ...fontBase }}>
              {result.warnings.map((w, i) => <div key={i}>{w}</div>)}
            </div>
          )}

          <div style={{ ...flex("row", 12, "center", "space-between") }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", ...fontBase }}>Rows that need fixing</span>
            <button
              onClick={onDownload}
              style={{ ...flex("row", 6, "center", "center"), padding: "5px 10px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#374151", ...fontBase }}
            >
              <DownloadIcon color="#374151" />
              Download error report
            </button>
          </div>

          <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "auto", minHeight: 60, maxHeight: 220 }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, ...fontBase }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ ...th, width: 64 }}>Row</th>
                  <th style={{ ...th, width: "30%" }}>Product</th>
                  <th style={th}>What is wrong</th>
                </tr>
              </thead>
              <tbody>
                {result.validationErrors.map((err, idx) => (
                  <tr key={idx}>
                    <td style={{ ...td, color: "#6B7280", fontWeight: 600 }}>{err.rowNumber}</td>
                    <td style={{ ...td, color: "#111827", fontWeight: 500 }}>
                      {err.productName || <em style={{ color: "#9CA3AF" }}>Unnamed</em>}
                    </td>
                    <td style={{ ...td, color: "#B91C1C", lineHeight: 1.5 }}>{err.errorMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.5, ...fontBase }}>
            {canImport
              ? <>Import only the <b>{good} correct row{good === 1 ? "" : "s"}</b>? The <b>{bad} wrong row{bad === 1 ? "" : "s"}</b> will be skipped. Choose <b>Cancel</b> to import nothing, fix the file and upload it again.</>
              : <>No row in this file can be imported. Fix the rows above and upload the file again. Nothing was imported.</>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ ...flex("row", 10, "center", "flex-end"), padding: "10px 18px", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
          <button
            onClick={onCancel}
            style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 12, cursor: "pointer", ...fontBase }}
          >
            {canImport ? "Cancel, import nothing" : "Close"}
          </button>
          {canImport && (
            <button
              onClick={onApprove}
              style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", boxShadow: "0 4px 14px rgba(76,29,149,0.3)", ...fontBase }}
            >
              Import {good} correct row{good === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── StepLabel ────────────────────────────────────────────────────────────────
function StepLabel({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div style={{ ...flex("row", 10, "center") }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.primaryLight, color: C.primary, fontSize: 11, fontWeight: 700, ...flex("row", 0, "center", "center"), flexShrink: 0, ...fontBase }}>{n}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", ...fontBase }}>{title}</span>
      {hint && <span style={{ fontSize: 12, color: "#6B7280", marginLeft: "auto", ...fontBase }}>{hint}</span>}
    </div>
  );
}

// ─── ExcelUploadView ──────────────────────────────────────────────────────────
function ExcelUploadView({ onBack, onSuccess }: {
  onBack: () => void;
  onSuccess: (type: ProductType, files: UploadedFile[], result: UploadResult) => void;
}) {
  const [productType, setProductType] = useState<ProductType>("drugs");
  const [medDevSubType, setMedDevSubType] = useState<MedicalDeviceSubType>("consumable");
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [fileFormatError, setFileFormatError] = useState<string | null>(null);
  const [review, setReview] = useState<{ fileName: string; result: UploadResult } | null>(null);
  const reviewResolver = useRef<((approved: boolean) => void) | null>(null);
  const requestApproval = (fileName: string, result: UploadResult) =>
    new Promise<boolean>((resolve) => {
      reviewResolver.current = resolve;
      setReview({ fileName, result });
    });
  const decideReview = (approved: boolean) => {
    reviewResolver.current?.(approved);
    reviewResolver.current = null;
    setReview(null);
  };
  useEffect(() => () => { reviewResolver.current?.(false); reviewResolver.current = null; }, []);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Derive the effective ProductType from (productType, medDevSubType)
  const effectiveProductType: ProductType =
    productType === "medical_devices_non_consumable"
      ? medDevSubType === "consumable"
        ? "medical_devices_consumable"
        : "medical_devices_non_consumable"
      : productType === "cosmetics"
        ? "cosmetics"
        : productType;

  const getUserId = useCallback((): number | null => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) { const user = JSON.parse(userStr); return user.userId; }
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        return payload.userId || payload.user_id || payload.sub;
      }
      return null;
    } catch { return null; }
  }, []);

  useEffect(() => {
    const fetchSellerCategories = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) { setLoadingCategories(false); return; }
        const userId = getUserId();
        if (!userId) { setLoadingCategories(false); return; }

        const response = await fetch(
          `${API_URL}/sellers/user/${userId}`,
          { method: "GET", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
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
          setAvailableCategories(
            result?.data?.productTypes?.length
              ? result.data.productTypes.map((pt: any) => ({ id: pt.productTypeId, name: pt.productTypeName }))
              : defaultCategories
          );
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

  const isMedDevCategory = (catId: number) =>
    MEDICAL_DEVICE_CONSUMABLE_IDS.includes(catId) || MEDICAL_DEVICE_NON_CONSUMABLE_IDS.includes(catId);

  const isCosmeticsCategory = (catId: number) => COSMETICS_IDS.includes(catId);
  const isSupplementCategory = (catId: number) => SUPPLEMENTS_IDS.includes(catId);

  // ── FIX 1: isCategorySelected now handles cosmetics ──────────────────────
  const isCategorySelected = (catId: number) => {

    if (catId === 1) return productType === "drugs";
    if (isMedDevCategory(catId)) return productType === "medical_devices_non_consumable";
    if (isCosmeticsCategory(catId)) return productType === "cosmetics";
    if (isSupplementCategory(catId)) return productType === "supplements";
    if (catId === 3)                  return productType === "food_infant";

    return false;
  };

  // ── FIX 2: isSelectable now includes cosmetics ───────────────────────────
  const isSelectable = (catId: number) =>
    catId === 1 ||
    MEDICAL_DEVICE_NON_CONSUMABLE_IDS.includes(catId) ||
    MEDICAL_DEVICE_CONSUMABLE_IDS.includes(catId) ||
    COSMETICS_IDS.includes(catId) ||
    catId === 3 ||
    SUPPLEMENTS_IDS.includes(catId);

  

  // ── FIX 3: handleCategorySelect now handles cosmetics ───────────────────
  const handleCategorySelect = (catId: number) => {
    if (catId === 1) {
      setProductType("drugs");
    } else if (isMedDevCategory(catId)) {
      setProductType("medical_devices_non_consumable");
      setMedDevSubType("consumable");
    } else if (isCosmeticsCategory(catId)) {
      setProductType("cosmetics");
    } else if (isSupplementCategory(catId)) {
      setProductType("supplements");
    }
    else if (catId === 3) {
    setProductType("food_infant");
  }
    setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null);
  };

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
    setSubmitError(null); setUploadResult(null); setFileFormatError(null);
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
      if (file.size > maxSize) { errors.push(`${file.name}: File size exceeds 10MB limit.`); return; }
      if (file.size === 0) { errors.push(`${file.name}: File is empty — please use our template.`); return; }
      validFiles.push(file);
    });

    if (errors.length > 0) { setFileFormatError(errors.join(" ")); return; }

    setFiles((prev) => {
      const filtered = validFiles.filter((f) => !prev.some((ex) => ex.file.name === f.name && ex.file.size === f.size));
      return [...prev, ...filtered.map((f) => ({ file: f, status: "uploading" as const, progress: 0 }))];
    });
    validFiles.forEach((f) => setTimeout(() => runFakeProgress(fileKey(f)), 50));
  };

  const removeFile = (i: number) => {
    setSubmitError(null); setUploadResult(null); setFileFormatError(null);
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

  const downloadErrorReport = (errors: ValidationError[]) => {
    if (!errors.length) return;
    const csvRows = [
      ["Row Number", "Product Name", "Error Message"].join(","),
      ...errors.map((e) =>
        `"${e.rowNumber}","${(e.productName ?? "").replace(/"/g, '""')}","${(e.errorMessage ?? "").replace(/"/g, '""')}"`
      ),
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `upload_errors_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const parseUploadResponse = async (res: Response): Promise<UploadResult> => {
    let body: any;
    try { body = await res.json(); } catch {
      throw new Error(`Server error (${res.status}): Could not parse response.`);
    }

    if (!res.ok) {
      const msg =
        body?.data?.message ??
        body?.message ??
        body?.error ??
        `Server error (${res.status})`;
      throw new Error(msg);
    }

    const data = body?.data ?? body;
    if (data?.status === "ERROR") throw new Error(data.message ?? "Upload failed");

    const successCount: number = data?.successCount ?? 0;
    const failureCount: number = data?.failureCount ?? data?.errorCount ?? 0;
    const totalRows: number = data?.totalRows ?? (successCount + failureCount);
    const validationErrors: ValidationError[] = (data?.errors ?? []).map((e: any) => ({
      rowNumber: e.rowNumber ?? e.row ?? "?",
      productName: e.productName ?? e.product ?? "",
      errorMessage: e.errorMessage ?? e.message ?? e.error ?? "Unknown error",
    }));

    if (totalRows === 0 && successCount === 0 && failureCount === 0 && validationErrors.length === 0) {
      throw new Error(
        "No product rows found in the file. Please ensure your file has at least one data row below the header, using our template."
      );
    }

    const warnings: string[] = Array.isArray(data?.warnings) ? data.warnings : [];
    return { success: successCount > 0, successCount, failureCount, totalRows, validationErrors, warnings };
  };

  const handleSubmit = async () => {
    const readyFiles = files.filter((f) => f.status === "done");
    if (!readyFiles.length || submitting) return;
    setSubmitting(true); setSubmitError(null); setUploadResult(null); setFileFormatError(null);

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setSubmitError("You are not authenticated. Please log in and try again.");
      setSubmitting(false);
      return;
    }

    const categoryId = getCategoryId(effectiveProductType);
    let lastResult: UploadResult | null = null;

    for (const uf of readyFiles) {
      const key = fileKey(uf.file);
      updateFile(key, { status: "uploading", progress: 0 });

      try {
        // No client-side validation for any category - backend handles everything
        // Just update progress
        for (let p = 15; p <= 80; p += 20) {
          await new Promise((r) => setTimeout(r, 200));
          updateFile(key, { progress: p });
        }

        // product-service's import endpoint takes sellerId as a request param
        // (no JWT principal lookup like the old monolith).
        const sellerId = await getCurrentSellerId();
        const fd = new FormData();
        fd.append("file", uf.file);
        fd.append("categoryId", String(categoryId));
        fd.append("sellerId", sellerId);

        // Step 1: preflight - validate the whole file (headers + every row) without saving anything.
        // A bad header problem comes back as an error message; row problems are listed and nothing is imported.
        const preflight = await parseUploadResponse(
          await fetch(`${IMPORT_API_URL}/preflight`, {
            method: "POST",
            body: fd,
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        );
        if (preflight.validationErrors.length > 0) {
          // Some rows are wrong: let the seller review and decide. Nothing has been saved yet.
          const userSaidYes = await requestApproval(uf.file.name, preflight);
          const approved = userSaidYes && preflight.successCount > 0;
          if (!approved) {
            updateFile(key, {
              status: "error",
              error: `${preflight.failureCount} of ${preflight.totalRows} row(s) have problems - nothing was imported.`,
              progress: 100,
            });
            setUploadResult(preflight);
            lastResult = null;
            continue;
          }
          // approved: continue below and import; the backend skips the wrong rows again.
        }

        // Step 2: import (clean file, or seller approved importing only the correct rows).
        const res = await fetch(IMPORT_API_URL, {
          method: "POST",
          body: fd,
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const result = await parseUploadResponse(res);
        lastResult = result;

        if (result.validationErrors.length > 0) {
          const errMsg = result.successCount > 0
            ? `${result.failureCount} row(s) failed — see errors below`
            : `All ${result.totalRows} row(s) failed validation`;
          updateFile(key, { status: "error", error: errMsg, progress: 100 });
          setUploadResult(result);
        } else {
          updateFile(key, { status: "done", progress: 100 });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        updateFile(key, { status: "error", error: message });
        setSubmitError(message);
        lastResult = null;
      }
    }

    await new Promise((r) => setTimeout(r, 250));
    setSubmitting(false);

    if (lastResult && lastResult.success && !lastResult.validationErrors.length) {
      onSuccess(effectiveProductType, files, lastResult);
    } else if (lastResult && lastResult.success && lastResult.validationErrors.length > 0) {
      setUploadResult(lastResult);
    }
  };

  const hasReadyFiles = files.some((f) => f.status === "done");
  const template = TEMPLATES[effectiveProductType];

const templateLabel =
  effectiveProductType === "medical_devices_consumable"
    ? "Medical Devices (Consumable) Template"
    : effectiveProductType === "medical_devices_non_consumable"
    ? "Medical Devices (Non-Consumable) Template"
    : effectiveProductType === "cosmetics"
    ? "Cosmetics & Personal Care Template"
    : effectiveProductType === "supplements"
    ? "Supplements & Nutraceuticals Template"
    : effectiveProductType === "food_infant"
    ? "Food & Infant Nutrition Template"
    : "Drugs Template";


  const renderCategories = () => {
    const seen = new Set<string>();
    const tiles: Array<{ id: number; name: string; displayName: string; selectable: boolean }> = [];
    availableCategories.forEach((cat) => {
      if (isMedDevCategory(cat.id)) {
        if (!seen.has("medical_devices")) {
          seen.add("medical_devices");
          tiles.push({ id: cat.id, name: cat.name, displayName: "Medical Devices", selectable: true });
        }
      } else {
        tiles.push({ id: cat.id, name: cat.name, displayName: cat.name, selectable: isSelectable(cat.id) });
      }
    });
    return tiles;
  };

  return (
    <div style={{ ...flex("col", 14) }}>
      {/* Back */}
      <button onClick={onBack} style={{ ...flex("row", 6, "center"), background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 13, fontWeight: 600, padding: 0, ...fontBase, alignSelf: "flex-start" }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>

      {/* Heading */}
      <div style={{ ...flex("col", 4), paddingBottom: 10, borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em", ...fontBase }}>Bulk upload products</div>
        <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4, ...fontBase }}>Choose a category, download its template, fill in your product data and upload it. Every row is checked before anything is saved.</div>
      </div>

      {/* Two columns: setup on the left, upload and results on the right */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
      <div style={{ ...flex("col", 16), minWidth: 0 }}>
      {/* Category grid */}
      <div style={{ ...flex("col", 8) }}>
        <StepLabel n={1} title="Select product category" />
        {loadingCategories ? (
          <div style={{ ...flex("row", 8, "center") }}>
            <span style={{ width: 14, height: 14, border: "2px solid #E5E7EB", borderTopColor: C.primary, borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>Loading categories...</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
            {renderCategories().map((cat) => {
              const selected = isCategorySelected(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => cat.selectable && handleCategorySelect(cat.id)}
                  disabled={!cat.selectable}
                  style={{
                    padding: "7px 10px", borderRadius: 8, minHeight: 36,
                    border: `1.5px solid ${selected ? C.primary : "#E5E7EB"}`,
                    background: selected ? C.primaryLight : cat.selectable ? "#FFFFFF" : "#F9FAFB",
                    color: selected ? C.primary : cat.selectable ? "#374151" : "#9CA3AF",
                    fontWeight: selected ? 700 : 500,
                    fontSize: 11,
                    cursor: cat.selectable ? "pointer" : "default",
                    textAlign: "left", ...fontBase,
                    transition: "all 0.15s",
                    ...flex("row", 5, "center"),
                    lineHeight: 1.3,
                  }}
                >
                  {selected && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {cat.displayName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Medical Devices Sub-Type Picker */}
      {productType === "medical_devices_non_consumable" && (
        <MedicalDeviceSubTypePicker
          selected={medDevSubType}
          onChange={(v) => {
            setMedDevSubType(v);
            setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null);
          }}
        />
      )}

      {/* Template download */}
      {template && (
        <div style={{ ...flex("col", 8) }}>
          <StepLabel n={2} title="Download the template" />
          <div style={{ ...flex("row", 12, "center", "space-between"), padding: "8px 12px", background: "#FAFAFF", border: "1px solid #E5E7EB", borderRadius: 10, flexWrap: "wrap" }}>
            <div style={{ ...flex("col", 2), minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "#111827", fontSize: 12, ...fontBase }}>{templateLabel}</div>
              <div style={{ color: "#6B7280", fontSize: 11, ...fontBase }}>Fill it in without changing the column headers</div>
            </div>
            <div style={{ ...flex("row", 8, "center"), flexShrink: 0 }}>
              {[
                { href: template.csv, label: "CSV" },
                { href: template.xlsx, label: "XLSX" },
                { href: template.xls, label: "XLS" },
              ].map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  download
                  className="df-dl-btn"
                  style={{ background: "#FFFFFF", color: C.primary, borderRadius: 8, padding: "0 10px", height: 28, ...flex("row", 5, "center", "center"), fontSize: 11, fontWeight: 600, textDecoration: "none", border: "1px solid #C4B5FD", ...fontBase, cursor: "pointer" }}
                >
                  <DownloadIcon color={C.primary} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* File format error */}
      {fileFormatError && (
        <div style={{ ...flex("row", 10, "center"), padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 12, color: "#991B1B", flex: 1, ...fontBase }}>{fileFormatError}</span>
          <button onClick={() => setFileFormatError(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <XIcon size={12} color="#991B1B" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div style={{ ...flex("col", 8) }}>
        <StepLabel n={3} title="Upload your file" hint="Max 10 MB" />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ background: dragging ? "#F5F3FF" : "#FAFAFF", border: `1.5px dashed ${dragging ? C.primary : "#C4B5FD"}`, borderRadius: 12, padding: files.length ? "10px" : "16px 12px", cursor: "pointer", ...flex("col", 10, "center", "center"), transition: "all 0.2s" }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.csv,.xls" multiple style={{ display: "none" }} onChange={handleFileInput} />
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryLight, ...flex("row", 0, "center", "center") }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 1, ...fontBase }}>
              {dragging ? "Drop your files here" : <>Drag &amp; drop, or <span style={{ color: C.primary }}>browse</span></>}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", ...fontBase }}>Supports .xlsx, .xls and .csv</div>
          </div>
        </div>
      </div>

      </div>
      <div style={{ ...flex("col", 14), minWidth: 0 }}>
      {files.length === 0 && !uploadResult && !submitError && (
      <div style={{ ...flex("col", 6), padding: "10px 12px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", ...fontBase }}>Before you upload</span>
        {["Keep the column headers exactly as in the template", "Use real dates, not text, for manufacturing and expiry", "Batch numbers must be unique for your account"].map((t) => (
          <div key={t} style={{ ...flex("row", 8, "flex-start") }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: 3, flexShrink: 0 }}>
              <path d="M2 6l3 3 5-5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 11, color: "#4B5563", lineHeight: 1.45, ...fontBase }}>{t}</span>
          </div>
        ))}
      </div>
      )}

        {files.length > 0 && (
          <div style={{ ...flex("col", 8) }}>
            <div style={{ ...flex("row", 0, "center", "space-between") }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", ...fontBase }}>Files ({files.length})</span>
              {files.every((f) => f.status === "done" || f.status === "error") && (
                <button onClick={() => { setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null); }} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer", ...fontBase }}>
                  Clear all
                </button>
              )}
            </div>
            {files.map((uf, i) => (
              <FileRow key={`${uf.file.name}-${i}`} uf={uf} index={i} onRemove={removeFile} submitting={submitting} />
            ))}
          </div>
        )}

      {/* Review popup: correct vs wrong rows, then import only correct rows or cancel */}
      {review && (
        <PreflightReviewDialog
          fileName={review.fileName}
          result={review.result}
          onDownload={() => downloadErrorReport(review.result.validationErrors)}
          onApprove={() => decideReview(true)}
          onCancel={() => decideReview(false)}
        />
      )}

      {/* Validation error panel */}
      {uploadResult && uploadResult.validationErrors.length > 0 && (
        <ValidationErrorPanel
          errors={uploadResult.validationErrors}
          successCount={uploadResult.successCount}
          failureCount={uploadResult.failureCount}
          totalRows={uploadResult.totalRows}
          onDownload={() => downloadErrorReport(uploadResult.validationErrors)}
          onDismiss={() => setUploadResult(null)}
        />
      )}

      {/* Generic submit error */}
      {submitError && (
        <div style={{ ...flex("row", 10, "center"), padding: "7px 10px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 12, color: "#991B1B", flex: 1, ...fontBase }}>{submitError}</span>
          <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <XIcon size={12} color="#991B1B" />
          </button>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleSubmit}
        disabled={!hasReadyFiles || submitting}
        style={{ width: "100%", height: 40, borderRadius: 10, border: "none", background: hasReadyFiles && !submitting ? "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)" : "#F3F4F6", cursor: hasReadyFiles && !submitting ? "pointer" : "not-allowed", ...flex("row", 10, "center", "center"), ...fontBase, boxShadow: hasReadyFiles && !submitting ? "0 4px 14px rgba(76,29,149,0.3)" : "none", transition: "all 0.2s" }}
      >
        <span style={{ color: hasReadyFiles && !submitting ? "white" : "#9CA3AF", fontWeight: 700, fontSize: 14, ...fontBase, ...flex("row", 8, "center") }}>
          {submitting ? (
            <>
              <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }} />
              Processing...
            </>
          ) : (
            <>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                <path d="M12 3v12m0 0l-3-3m3 3l3-3M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload {files.length > 1 ? "Files" : "File"}
            </>
          )}
        </span>
      </button>

      <div style={{ ...flex("row", 6, "center"), justifyContent: "center" }}>
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="1.5" />
          <path d="M12 8v4M12 16h.01" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 10, color: "#9CA3AF", ...fontBase }}>
          Ensure your file follows the template format · Max 10MB per file
        </span>
      </div>
      </div>
      </div>
    </div>
  );
}

// ─── SuccessView ──────────────────────────────────────────────────────────────
function SuccessView({ files, result, onClose }: {
  productType: ProductType;
  files: UploadedFile[];
  result: UploadResult;
  onReset: () => void;
  onClose?: () => void;
}) {
  const fileName = files?.[0]?.file?.name ?? "product_template.xlsx";
  return (
    <div style={{ ...flex("col", 20, "center"), padding: "32px 24px", position: "relative" }}>
      {onClose && (
        <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, background: "none", border: "1.5px solid #1E1E1D", borderRadius: "50%", cursor: "pointer", ...flex("row", 0, "center", "center"), padding: 0 }}>
          <XIcon size={12} color="#1E1E1D" strokeWidth={2.5} />
        </button>
      )}
      <div style={{ padding: 20, background: "#DCF7CB", borderRadius: "50%", border: "1px solid #4EB300", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="#378200" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ ...flex("col", 10, "center"), width: "100%" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", ...fontBase, textAlign: "center" }}>
          Products Added Successfully!
        </div>
        <div style={{ fontSize: 13, color: "#374151", ...fontBase, textAlign: "center" }}>
          <strong style={{ color: "#166534" }}>{result.successCount} product{result.successCount !== 1 ? "s" : ""}</strong> from <em>{fileName}</em> {result.successCount !== 1 ? "have" : "has"} been added to your catalogue.
        </div>
      </div>
      <div style={{ ...flex("row", 12, "center", "center"), width: "100%" }}>
        <div style={{ flex: 1, background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", ...flex("col", 4, "center") }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#166534", ...fontBase }}>{result.successCount}</span>
          <span style={{ fontSize: 11, color: "#166534", fontWeight: 600, ...fontBase }}>Products Added</span>
        </div>
        <div style={{ flex: 1, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", ...flex("col", 4, "center") }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#15803D", ...fontBase }}>{result.totalRows}</span>
          <span style={{ fontSize: 11, color: "#15803D", fontWeight: 600, ...fontBase }}>Total Rows</span>
        </div>
      </div>
      <div style={{ background: "#DCF7CB", border: "1px solid #4EB300", borderRadius: 8, padding: "10px 16px", width: "100%", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#378200", ...fontBase }}>
          Products are now live in your catalogue. Processing usually takes 2–5 minutes.
        </span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ width: "100%", height: 44, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)", cursor: "pointer", ...flex("row", 0, "center", "center"), ...fontBase, boxShadow: "0 4px 14px rgba(76,29,149,0.3)", color: "white", fontWeight: 700, fontSize: 14 }}
        >
          View My Products
        </button>
      )}
    </div>
  );
}

// ─── OnboardingModal ──────────────────────────────────────────────────────────
export function OnboardingModal({ onClose, onManualEntry, onSuccessAction }: { onClose: () => void; onManualEntry: () => void; onSuccessAction?: () => void }) {
  const [successData, setSuccessData] = useState<{ type: ProductType; files: UploadedFile[]; result: UploadResult } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [displayView, setDisplayView] = useState<ModalView>("methods");
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
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
  const slideX = slideDir === "left" ? "-22px" : "22px";

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
        .df-close-btn:hover { background: #F3F4F6 !important; }
        .df-dl-btn:hover { background: #F5F3FF !important; border-color: #8B5CF6 !important; }
        .df-modal-scroll::-webkit-scrollbar { width: 4px; }
        .df-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .df-modal-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
      `}</style>

      {/* Backdrop */}
      <div
        style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", cursor: "default" }}
      />

      {/* Modal */}
      <div
        className="df-modal-root"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          width: "92vw", maxWidth: displayView === "excel" ? 880 : 400,
          transition: "max-width 0.25s ease",
          height: "auto",
          maxHeight: "92vh",
          background: "white",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.05)",
          animation: "dfModalIn 0.28s cubic-bezier(0.22,1,0.36,1) forwards",
          fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {!isSuccess && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="df-close-btn"
            style={{ position: "absolute", top: 12, right: 12, zIndex: 2, width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", ...flex("row", 0, "center", "center") }}
          >
            <XIcon size={16} color="#6B7280" />
          </button>
        )}
        <div
          className="df-modal-scroll"
          style={{ flex: 1, overflowY: "auto", padding: isSuccess ? "0" : displayView === "excel" ? "20px" : "18px" }}
        >
          <div style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : `translateX(${slideX})`, transition: contentVisible ? "opacity 0.2s, transform 0.2s" : "opacity 0.17s, transform 0.17s" }}>

            {/* Methods view */}
            {displayView === "methods" && (
              <>
                <div style={{ marginBottom: 12, paddingRight: 28, ...flex("col", 2) }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em", ...fontBase }}>Add products</div>
                  <div style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>Choose the method that fits your workflow.</div>
                </div>
                <div style={{ ...flex("col", 6) }}>
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
                      style={{ ...flex("row", 10, "center"), padding: "9px 12px", borderRadius: 10, border: `1px solid ${hovered === m.id ? "#D1D5DB" : "#E5E7EB"}`, background: hovered === m.id ? "#FAFAFA" : "white", cursor: m.ready ? "pointer" : "default", textAlign: "left", width: "100%", boxShadow: "0 1px 2px rgba(16,24,40,0.05)", opacity: m.ready ? 1 : 0.55 }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: m.bg, border: "1px solid #E5E7EB", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
                        {m.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 1, ...fontBase }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: "#6B7280", ...fontBase }}>{m.desc}</div>
                      </div>
                      {m.ready ? (
                        <div style={{ ...flex("row", 5, "center"), fontSize: 12, fontWeight: 600, color: m.accent, whiteSpace: "nowrap", flexShrink: 0, ...fontBase }}>
                          Start
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", borderRadius: 99, padding: "2px 8px", ...fontBase, flexShrink: 0 }}>Soon</div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Excel view */}
            {displayView === "excel" && (
              <ExcelUploadView
                onBack={() => changeView("methods", "right")}
                onSuccess={(type, files, result) => { setSuccessData({ type, files, result }); changeView("success", "left"); }}
              />
            )}

            {/* Success view */}
            {displayView === "success" && successData && (
              <SuccessView
                productType={successData.type}
                files={successData.files}
                result={successData.result}
                onReset={() => { setSuccessData(null); changeView("excel", "right"); }}
                onClose={() => {
                  if (onSuccessAction) onSuccessAction();
                  onClose();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── DashboardFilters ─────────────────────────────────────────────────────────
const DashboardFilters = ({ setCurrentView, onRefreshRequested }: DashboardFiltersProps) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 24 }}>
        <div style={{ boxShadow: "-1px 1px 4px rgba(0, 0, 0, 0.25)", borderRadius: 8, minWidth: 108, maxHeight: 52, minHeight: 48 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              height: 48,
              paddingLeft: 16,
              paddingRight: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "#4C0080",
              color: "#ffffff",
              fontSize: 16,
              fontFamily: "'Work Sans', sans-serif",
              fontWeight: 500,
              lineHeight: "24px",
              borderRadius: 8,
              border: "none",
              outline: "1px solid #4C0080",
              outlineOffset: "-1px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#6C12A9"; (e.currentTarget as HTMLButtonElement).style.outline = "1px solid #6C12A9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#4C0080"; (e.currentTarget as HTMLButtonElement).style.outline = "1px solid #4C0080"; }}
          >
            <Plus size={20} color="#ffffff" />
            Add Product
          </button>
        </div>
      </div>
      {showModal && (
        <OnboardingModal
          onClose={() => setShowModal(false)}
          onSuccessAction={onRefreshRequested}
          onManualEntry={() => {
            setShowModal(false);
            router.push("/seller_7a3b9f2c/products/add");
          }}
        />
      )}
    </>
  );
};

export default DashboardFilters;