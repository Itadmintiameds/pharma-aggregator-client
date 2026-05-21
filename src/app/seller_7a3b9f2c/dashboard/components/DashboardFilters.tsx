"use client";
import { useRouter } from "next/navigation";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { DashboardView } from "@/src/types/seller/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardFiltersProps {
  setCurrentView: (view: DashboardView) => void;
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
  message?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const IMPORT_API_URL = "https://api-test-aggreator.tiameds.ai/api/v1/products/import";

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
    xlsx: "/templates/drugs/XLSX-Drugs Template.xlsx",
    csv: "/templates/drugs/CSV-Drugs Template.csv",
    xls: "/templates/drugs/XLS-Drugs Template.xls",
  },
  medical_devices_non_consumable: {
    name: "medical_devices_non_consumable_template",
    xlsx: "/templates/medical-devices/nonconsumable/XLSX-Non Consumable Template.xlsx",
    csv: "/templates/medical-devices/nonconsumable/CSV-Non Consumable Template.csv",
    xls: "/templates/medical-devices/nonconsumable/XLS-Non Consumable Template.xls",
  },
  medical_devices_consumable: {
    name: "medical_devices_consumable_template",
    xlsx: "/templates/medical-devices/consumable/XLSX-Consumable Template.xlsx",
    csv: "/templates/medical-devices/consumable/CSV-Consumable Template.csv",
    xls: "/templates/medical-devices/consumable/XLS-Consumable Template.xls",
  },
  cosmetics: {
    name: "cosmetics_template",
    xlsx: "/templates/cosmetics/XLSX-Cosmetics Template.xlsx",
    csv: "/templates/cosmetics/CSV-Cosmetics Template.csv",
    xls: "/templates/cosmetics/XLS-Cosmetics Template.xls",
  },
  supplements: {
    name: "supplements_template",
    xlsx: "/templates/supplements/XLSX-Supplements Template.xlsx",
    csv: "/templates/supplements/CSV-Supplements Template.csv",
    xls: "/templates/supplements/XLS-Supplements Template.xls",
  },
  food_infant: {
    name: "food_infant_template",
    xlsx: "/templates/food&Infant/XLSX-FoodInfant.xlsx",
    csv:  "/templates/food&Infant/CSV-FoodInfant.csv",
    xls:  "/templates/food&Infant/XLS-FoodInfant.xls",
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

// ─── Cosmetics required columns (from template) ───────────────────────────────
// Starred (*) fields in the template are mandatory.
const COSMETICS_REQUIRED_COLUMNS = [
  "Product Category*",
  "Product Sub Category*",
  "Product Name*",
  "Brand Name*",
  "Net Quantity*",
  "Active Ingredients*",
  "Gender*",
  "Age Group*",
  "Product Claims*",
  "Warnings / Precautions*",
  "Product Description*",
  "Storage Condition*",
  "Manufacturer Name*",
  "Country of Origin*",
  "Certifications / Compliance*",
  "Minimum Order Qty*",
  "Max Order Qty*",
  "Batch Number*",
  "Manufacturing Date*",
  "Expiry Date*",
  "Stock Quantity*",
  "MRP (INR)*",
  "Selling Price(INR)*",
  "GST %",
  "HSN Code*",
  "Intended Use Area*",
];

// Friendly name map for cosmetics columns (strips asterisk for display)
const COSMETICS_FIELD_LABELS: Record<string, string> = {
  "Product Category*": "Product Category",
  "Product Sub Category*": "Product Sub Category",
  "Product Name*": "Product Name",
  "Brand Name*": "Brand Name",
  "Net Quantity*": "Net Quantity",
  "Active Ingredients*": "Active Ingredients",
  "Gender*": "Gender",
  "Age Group*": "Age Group",
  "Product Claims*": "Product Claims",
  "Warnings / Precautions*": "Warnings / Precautions",
  "Product Description*": "Product Description",
  "Storage Condition*": "Storage Condition",
  "Manufacturer Name*": "Manufacturer Name",
  "Country of Origin*": "Country of Origin",
  "Certifications / Compliance*": "Certifications / Compliance",
  "Minimum Order Qty*": "Minimum Order Qty",
  "Max Order Qty*": "Max Order Qty",
  "Batch Number*": "Batch Number",
  "Manufacturing Date*": "Manufacturing Date",
  "Expiry Date*": "Expiry Date",
  "Stock Quantity*": "Stock Quantity",
  "MRP (INR)*": "MRP (INR)",
  "Selling Price(INR)*": "Selling Price (INR)",
  "GST %": "GST %",
  "HSN Code*": "HSN Code",
  "Intended Use Area*": "Intended Use Area",
};

/**
 * Client-side validation for cosmetics CSV/XLSX rows.
 * Returns an array of ValidationError objects (empty = all good).
 */
function validateCosmeticsRows(
  rows: Record<string, string>[],
  headers: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check that all required columns are present in the file at all
  const missingCols = COSMETICS_REQUIRED_COLUMNS.filter(
    (col) => !headers.some((h) => h.trim() === col.trim())
  );

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // 1-indexed, row 1 = header
    const productName = (
      row["Product Name*"] ?? row["Product Name"] ?? ""
    ).trim();

    // Per-column missing-value checks
    const missingFields: string[] = [];

    for (const col of COSMETICS_REQUIRED_COLUMNS) {
      // Skip columns that aren't even in the file (already flagged above)
      if (missingCols.includes(col)) continue;

      // Find the actual key (headers may or may not have the asterisk in data)
      const key = headers.find((h) => h.trim() === col.trim()) ?? col;
      const val = (row[key] ?? "").toString().trim();

      if (!val) {
        missingFields.push(COSMETICS_FIELD_LABELS[col] ?? col.replace("*", ""));
      }
    }

    // Numeric range checks
    const mrp = parseFloat(row["MRP (INR)*"] ?? row["MRP (INR)"] ?? "");
    const sellingPrice = parseFloat(row["Selling Price(INR)*"] ?? row["Selling Price(INR)"] ?? "");
    const minQty = parseInt(row["Minimum Order Qty*"] ?? row["Minimum Order Qty"] ?? "", 10);
    const maxQty = parseInt(row["Max Order Qty*"] ?? row["Max Order Qty"] ?? "", 10);
    const stockQty = parseInt(row["Stock Quantity*"] ?? row["Stock Quantity"] ?? "", 10);

    if (!isNaN(mrp) && !isNaN(sellingPrice) && sellingPrice > mrp) {
      errors.push({ rowNumber, productName, errorMessage: "Selling Price cannot exceed MRP." });
    }
    if (!isNaN(minQty) && !isNaN(maxQty) && minQty > maxQty) {
      errors.push({ rowNumber, productName, errorMessage: "Minimum Order Qty cannot exceed Max Order Qty." });
    }
    if (!isNaN(stockQty) && stockQty < 0) {
      errors.push({ rowNumber, productName, errorMessage: "Stock Quantity must be 0 or greater." });
    }

    // Date checks: Manufacturing Date must be before Expiry Date
    const mfgRaw = (row["Manufacturing Date*"] ?? row["Manufacturing Date"] ?? "").trim();
    const expRaw = (row["Expiry Date*"] ?? row["Expiry Date"] ?? "").trim();
    if (mfgRaw && expRaw) {
      const mfgDate = new Date(mfgRaw);
      const expDate = new Date(expRaw);
      if (!isNaN(mfgDate.getTime()) && !isNaN(expDate.getTime()) && mfgDate >= expDate) {
        errors.push({ rowNumber, productName, errorMessage: "Manufacturing Date must be before Expiry Date." });
      }
    }

    // Discount % sanity (optional field)
    const discountRaw = (row["Discount %"] ?? "").trim();
    if (discountRaw) {
      const discount = parseFloat(discountRaw);
      if (!isNaN(discount) && (discount < 0 || discount > 100)) {
        errors.push({ rowNumber, productName, errorMessage: "Discount % must be between 0 and 100." });
      }
    }

    if (missingFields.length > 0) {
      errors.push({
        rowNumber,
        productName,
        errorMessage: `Missing required field(s): ${missingFields.join(", ")}.`,
      });
    }
  });

  // If structural columns are missing, add a single top-level error (row 1)
  if (missingCols.length > 0) {
    errors.unshift({
      rowNumber: 1,
      productName: "—",
      errorMessage: `Template columns missing: ${missingCols.map((c) => c.replace("*", "")).join(", ")}. Please use the official Cosmetics template.`,
    });
  }

  return errors;
}

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
            flex: 1, padding: "10px 12px", borderRadius: 10,
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
            flex: 1, padding: "10px 12px", borderRadius: 10,
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
  return (
    <div style={{ ...flex("col", 8), background: "#FFF8F8", border: "1px solid #FECACA", borderRadius: 12, padding: 14, overflow: "hidden" }}>
      <div style={{ ...flex("row", 0, "center", "space-between") }}>
        <div style={{ ...flex("row", 8, "center") }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", ...fontBase }}>
            {allFailed
              ? `All ${totalRows} row(s) failed validation`
              : `${failureCount} of ${totalRows} row(s) failed — ${successCount} added successfully`}
          </span>
        </div>
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <XIcon size={13} color="#991B1B" />
        </button>
      </div>

      {!allFailed && (
        <div style={{ ...flex("row", 6, "center") }}>
          <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, ...fontBase }}>
            ✓ {successCount} added
          </span>
          <span style={{ background: "#FEE2E2", color: "#991B1B", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, ...fontBase }}>
            ✗ {failureCount} failed
          </span>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 8, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, ...fontBase }}>
          <thead style={{ background: "#FEF2F2", position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", width: 48, borderBottom: "1px solid #FECACA" }}>Row</th>
              <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", width: "35%", borderBottom: "1px solid #FECACA" }}>Product</th>
              <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", borderBottom: "1px solid #FECACA" }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#FFF8F8" }}>
                <td style={{ padding: "7px 10px", color: "#6B7280", fontWeight: 600, borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none" }}>
                  {err.rowNumber}
                </td>
                <td style={{ padding: "7px 10px", color: "#374151", fontWeight: 500, borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {err.productName || <em style={{ color: "#9CA3AF" }}>Unnamed</em>}
                </td>
                <td style={{ padding: "7px 10px", color: "#DC2626", borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none" }}>
                  {err.errorMessage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={onDownload}
        style={{ alignSelf: "flex-end", ...flex("row", 6, "center", "center"), padding: "6px 12px", background: "#fff", border: "1px solid #DC2626", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#DC2626", ...fontBase }}
      >
        <DownloadIcon color="#DC2626" />
        Download Error Report (.csv)
      </button>
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
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || payload.user_id || payload.sub;
      }
      return null;
    } catch { return null; }
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

  // ── SIMPLIFIED Food & Infant validation - only basic checks, let backend handle everything ──
  const runClientSideFoodInfantValidation = async (file: File): Promise<ValidationError[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).filter((l) => l.trim());
          
          // Only check if file is empty
          if (lines.length < 2) {
            resolve([{ rowNumber: 1, productName: "—", errorMessage: "File appears empty or has no data rows." }]);
            return;
          }

          // Only check if essential headers exist (basic structure)
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let cur = "";
            let inQuote = false;
            for (let i = 0; i < line.length; i++) {
              const ch = line[i];
              if (ch === '"') {
                if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
                else inQuote = !inQuote;
              } else if (ch === "," && !inQuote) {
                result.push(cur); cur = "";
              } else {
                cur += ch;
              }
            }
            result.push(cur);
            return result;
          };

          const headers = parseCSVLine(lines[0]);
          const essentialHeaders = ["Product Name*", "Product Category*"];
          const missingHeaders = essentialHeaders.filter(
            (h) => !headers.some((header) => header.trim() === h)
          );

          if (missingHeaders.length > 0) {
            resolve([{
              rowNumber: 1,
              productName: "—",
              errorMessage: `Missing essential headers: ${missingHeaders.join(", ")}. Please use the official Food & Infant template.`,
            }]);
            return;
          }

          // No other validations - let backend handle everything
          resolve([]);
        } catch {
          resolve([]);
        }
      };
      reader.onerror = () => resolve([]);

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        reader.readAsText(file, "utf-8");
      } else {
        resolve([]);
      }
    });
  };

  // ── FIX 4: Client-side cosmetics CSV validation before sending to API ────
  const runClientSideCosmeticsValidation = async (file: File): Promise<ValidationError[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).filter((l) => l.trim());
          if (lines.length < 2) {
            resolve([{ rowNumber: 1, productName: "—", errorMessage: "File appears empty or has no data rows." }]);
            return;
          }

          // Parse CSV (simple — handles quoted commas)
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let cur = "";
            let inQuote = false;
            for (let i = 0; i < line.length; i++) {
              const ch = line[i];
              if (ch === '"') {
                if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
                else inQuote = !inQuote;
              } else if (ch === "," && !inQuote) {
                result.push(cur); cur = "";
              } else {
                cur += ch;
              }
            }
            result.push(cur);
            return result;
          };

          const headers = parseCSVLine(lines[0]);
          const rows: Record<string, string>[] = lines.slice(1).map((line) => {
            const vals = parseCSVLine(line);
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? "").trim(); });
            return obj;
          });

          resolve(validateCosmeticsRows(rows, headers));
        } catch {
          resolve([]); // If we can't parse, let the server handle it
        }
      };
      reader.onerror = () => resolve([]);

      // Only CSV can be parsed in the browser; XLSX/XLS go straight to the server
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        reader.readAsText(file, "utf-8");
      } else {
        resolve([]); // xlsx/xls: skip client-side, rely on server
      }
    });
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

    return { success: successCount > 0, successCount, failureCount, totalRows, validationErrors };
  };

  const handleSubmit = async () => {
    const readyFiles = files.filter((f) => f.status === "done");
    if (!readyFiles.length || submitting) return;
    setSubmitting(true); setSubmitError(null); setUploadResult(null); setFileFormatError(null);

    const token = localStorage.getItem("token");
    if (!token) {
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
        // ── Client-side validation for cosmetics CSV before uploading ──
        if (effectiveProductType === "cosmetics") {
          updateFile(key, { progress: 10 });
          const clientErrors = await runClientSideCosmeticsValidation(uf.file);
          if (clientErrors.length > 0) {
            const productName = clientErrors[0]?.productName ?? "—";
            const failureCount = clientErrors.filter((e) => e.rowNumber !== 1).length;
            const result: UploadResult = {
              success: false,
              successCount: 0,
              failureCount: Math.max(failureCount, 1),
              totalRows: Math.max(failureCount, 1),
              validationErrors: clientErrors,
            };
            updateFile(key, {
              status: "error",
              error: `${clientErrors.length} validation error(s) found`,
              progress: 100,
            });
            setUploadResult(result);
            setSubmitting(false);
            return;
          }
        } 

        // ── Food & Infant - only basic validation (let backend handle the rest) ──
        else if (effectiveProductType === "food_infant") {
          updateFile(key, { progress: 10 });
          const clientErrors = await runClientSideFoodInfantValidation(uf.file);
          if (clientErrors.length > 0) {
            const productName = clientErrors[0]?.productName ?? "—";
            const failureCount = clientErrors.filter((e) => e.rowNumber !== 1).length;
            const result: UploadResult = {
              success: false,
              successCount: 0,
              failureCount: Math.max(failureCount, 1),
              totalRows: Math.max(failureCount, 1),
              validationErrors: clientErrors,
            };
            updateFile(key, {
              status: "error",
              error: `${clientErrors.length} validation error(s) found`,
              progress: 100,
            });
            setUploadResult(result);
            setSubmitting(false);
            return;
          }
        }

        for (let p = 15; p <= 80; p += 20) {
          await new Promise((r) => setTimeout(r, 200));
          updateFile(key, { progress: p });
        }

        const fd = new FormData();
        fd.append("file", uf.file);
        fd.append("categoryId", String(categoryId));

        const res = await fetch(IMPORT_API_URL, {
          method: "POST",
          body: fd,
          headers: { Authorization: `Bearer ${token}` },
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
      <button onClick={onBack} style={{ ...flex("row", 6, "center"), background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 14, fontWeight: 600, padding: 0, ...fontBase, alignSelf: "flex-start" }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>

      {/* Heading */}
      <div style={{ ...flex("col", 3) }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", ...fontBase }}>Upload Excel / CSV</div>
        <div style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>Download our template, fill in product data, and upload</div>
      </div>

      {/* Category grid */}
      <div style={{ ...flex("col", 8) }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", ...fontBase }}>Select product category</div>
        {loadingCategories ? (
          <div style={{ ...flex("row", 8, "center") }}>
            <span style={{ width: 14, height: 14, border: "2px solid #E5E7EB", borderTopColor: C.primary, borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>Loading categories...</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {renderCategories().map((cat) => {
              const selected = isCategorySelected(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => cat.selectable && handleCategorySelect(cat.id)}
                  disabled={!cat.selectable}
                  style={{
                    padding: "8px 10px", borderRadius: 8,
                    border: `1.5px solid ${selected ? C.primary : "#E5E7EB"}`,
                    background: selected ? C.primaryLight : cat.selectable ? "#FAFAFA" : "#F9FAFB",
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
        <div style={{ ...flex("row", 0, "center", "space-between"), padding: "10px 12px", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 10, gap: 10, flexWrap: "wrap" }}>
          <div style={{ ...flex("col", 2), minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "#5B21B6", fontSize: 12, ...fontBase }}>{templateLabel}</div>
            <div style={{ color: "#6B7280", fontSize: 11, ...fontBase }}>Download and fill before uploading</div>
          </div>
          <div style={{ ...flex("row", 6, "center"), flexShrink: 0 }}>
            {[
              { href: template.csv, label: ".CSV" },
              { href: template.xlsx, label: ".XLSX" },
              { href: template.xls, label: ".XLS" },
            ].map(({ href, label }) => (
              <a
                key={label}
                href={href}
                download
                className="df-dl-btn"
                style={{ background: "#9F75FC", color: "white", borderRadius: 6, padding: "0 10px", height: 30, ...flex("row", 4, "center", "center"), fontSize: 11, fontWeight: 700, textDecoration: "none", border: "none", ...fontBase, transition: "all 0.2s", cursor: "pointer" }}
              >
                <DownloadIcon color="white" />
                {label}
              </a>
            ))}
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
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: 8, ...flex("col", 8) }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ background: dragging ? "#F5F3FF" : "#F9FAFB", border: `2px dashed ${dragging ? C.primary : "#A78BFA"}`, borderRadius: 8, padding: files.length ? "14px 16px" : "20px 16px", cursor: "pointer", ...flex("col", 10, "center", "center"), transition: "all 0.2s" }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.csv,.xls" multiple style={{ display: "none" }} onChange={handleFileInput} />
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <path d="M32.5075 15.6583L9.43565 16.5154C8.67212 16.5154 8.22691 16.8012 8.0166 17.5353L3.2273 33.9198C3.02929 34.6161 2.08003 34.9419 1.41968 34.9419C0.759773 34.9419 0.219727 34.4019 0.219727 33.742V29.1503V10.3386V9.43986V6.68562C0.219727 5.76227 0.968328 5.01367 1.89168 5.01367H13.771C14.2144 5.01367 14.6394 5.18974 14.9529 5.50323L18.3995 8.94987C18.713 9.26336 19.1385 9.43942 19.5815 9.43942H30.8356C31.7589 9.43942 32.5075 10.188 32.5075 11.1114V11.6826V15.6583Z" fill="#E0AD31" />
            <path d="M1.41968 34.9419C2.07959 34.9419 2.42162 34.4383 2.61964 33.7419L7.44757 16.8986C7.65788 16.1645 8.3292 15.6587 9.09317 15.6587H38.6768C39.3832 15.6587 39.8908 16.3375 39.6914 17.0154L34.9074 33.2721C34.6914 34.0409 34.2176 34.9485 33.2377 34.9419H1.41968Z" fill="#FFC843" />
          </svg>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 2, ...fontBase }}>
              {dragging ? "Drop files here!" : "Drag & drop your Excel / CSV"}
            </div>
            <div style={{ fontSize: 10, color: "#9CA3AF", ...fontBase }}>or click to browse · .xlsx · .csv · .xls · Max 10MB</div>
          </div>
        </div>

        {files.length > 0 && (
          <div style={{ ...flex("col", 6) }}>
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
      </div>

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
        <div style={{ ...flex("row", 10, "center"), padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
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
        style={{ width: "100%", height: 46, borderRadius: 10, border: "none", background: hasReadyFiles && !submitting ? "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)" : "#F3F4F6", cursor: hasReadyFiles && !submitting ? "pointer" : "not-allowed", ...flex("row", 10, "center", "center"), ...fontBase, boxShadow: hasReadyFiles && !submitting ? "0 4px 14px rgba(76,29,149,0.3)" : "none", transition: "all 0.2s" }}
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
function OnboardingModal({ onClose, onManualEntry }: { onClose: () => void; onManualEntry: () => void }) {
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
        .df-dl-btn:hover { background: #C4A4FD !important; transform: translateY(-1px) !important; }
        .df-modal-scroll::-webkit-scrollbar { width: 4px; }
        .df-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .df-modal-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={displayView === "methods" ? onClose : undefined}
        style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", cursor: displayView === "methods" ? "pointer" : "default" }}
      />

      {/* Close button */}
      {displayView === "methods" && (
        <button onClick={onClose} style={{ position: "fixed", top: 12, right: 12, zIndex: 1002, background: "none", border: "none", padding: 0, cursor: "pointer", ...flex("row", 0, "center", "center") }}>
          <div style={{ width: 36, height: 36, background: "white", borderRadius: 8, ...flex("row", 0, "center", "center") }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 3.75C9.81196 3.75 7.71354 4.61919 6.16637 6.16637C4.61919 7.71354 3.75 9.81196 3.75 12C3.75 13.0834 3.96339 14.1562 4.37799 15.1571C4.79259 16.1581 5.40029 17.0675 6.16637 17.8336C6.93245 18.5997 7.84193 19.2074 8.84286 19.622C9.8438 20.0366 10.9166 20.25 12 20.25C13.0834 20.25 14.1562 20.0366 15.1571 19.622C16.1581 19.2074 17.0675 18.5997 17.8336 17.8336C18.5997 17.0675 19.2074 16.1581 19.622 15.1571C20.0366 14.1562 20.25 13.0834 20.25 12C20.25 9.81196 19.3808 7.71354 17.8336 6.16637C16.2865 4.61919 14.188 3.75 12 3.75ZM5.10571 5.10571C6.93419 3.27723 9.41414 2.25 12 2.25C14.5859 2.25 17.0658 3.27723 18.8943 5.10571C20.7228 6.93419 21.75 9.41414 21.75 12C21.75 13.2804 21.4978 14.5482 21.0078 15.7312C20.5178 16.9141 19.7997 17.9889 18.8943 18.8943C17.9889 19.7997 16.9141 20.5178 15.7312 21.0078C14.5482 21.4978 13.2804 21.75 12 21.75C10.7196 21.75 9.45176 21.4978 8.26884 21.0078C7.08591 20.5178 6.01108 19.7997 5.10571 18.8943C4.20034 17.9889 3.48216 16.9141 2.99217 15.7312C2.50219 14.5482 2.25 13.2804 2.25 12C2.25 9.41414 3.27723 6.93419 5.10571 5.10571ZM9.21967 9.21967C9.51256 8.92678 9.98744 8.92678 10.2803 9.21967L12 10.9393L13.7197 9.21967C14.0126 8.92678 14.4874 8.92678 14.7803 9.21967C15.0732 9.51256 15.0732 9.98744 14.7803 10.2803L13.0607 12L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L12 13.0607L10.2803 14.7803C9.98744 15.0732 9.51256 15.0732 9.21967 14.7803C8.92678 14.4874 8.92678 14.0126 9.21967 13.7197L10.9393 12L9.21967 10.2803C8.92678 9.98744 8.92678 9.51256 9.21967 9.21967Z" fill="#111827" />
            </svg>
          </div>
        </button>
      )}

      {/* Modal */}
      <div
        className="df-modal-root"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          width: "90vw", maxWidth: 460,
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
        <div
          className="df-modal-scroll"
          style={{ flex: 1, overflowY: "auto", padding: isSuccess ? "0" : "22px" }}
        >
          <div style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : `translateX(${slideX})`, transition: contentVisible ? "opacity 0.2s, transform 0.2s" : "opacity 0.17s, transform 0.17s" }}>

            {/* Methods view */}
            {displayView === "methods" && (
              <>
                <div style={{ marginBottom: 16, ...flex("col", 4) }}>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#111827", ...fontBase }}>How would you like to add products?</div>
                  <div style={{ fontSize: 13, color: "#6B7280", ...fontBase }}>Choose the method that fits your workflow.</div>
                </div>
                <div style={{ ...flex("col", 8) }}>
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
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
                onClose={onClose}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── DashboardFilters ─────────────────────────────────────────────────────────
const DashboardFilters = ({ setCurrentView }: DashboardFiltersProps) => {
  const router = useRouter();
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
          <Plus size={18} /> Add New Product
        </button>
      </div>
      {showModal && (
        <OnboardingModal
          onClose={() => setShowModal(false)}
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












// code dated 21.05.2026...........................

// "use client";
// import { useRouter } from "next/navigation";
// import React, { useRef, useState, useEffect, useCallback } from "react";
// import { Plus } from "lucide-react";
// import { DashboardView } from "@/src/types/seller/dashboard";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface DashboardFiltersProps {
//   setCurrentView: (view: DashboardView) => void;
// }

// type ModalView = "methods" | "excel" | "api" | "success";
// type ProductType = "drugs" | "medical_devices_non_consumable" | "medical_devices_consumable" | "cosmetics" | "supplements" | "food_infant";
// type MedicalDeviceSubType = "consumable" | "non_consumable";

// interface UploadedFile {
//   file: File;
//   status: "pending" | "uploading" | "done" | "error";
//   error?: string;
//   progress?: number;
// }

// interface ValidationError {
//   rowNumber: number;
//   productName: string;
//   errorMessage: string;
// }

// interface UploadResult {
//   success: boolean;
//   successCount: number;
//   failureCount: number;
//   totalRows: number;
//   validationErrors: ValidationError[];
//   message?: string;
// }

// // ─── Constants ────────────────────────────────────────────────────────────────
// const IMPORT_API_URL = "https://api-test-aggreator.tiameds.ai/api/v1/products/import";

// const C = {
//   primary: "#4C1D95",
//   primaryLight: "#EDE9FE",
//   green: "#4EB300",
//   greenDark: "#378200",
//   greenLight: "#DCF7CB",
// } as const;

// const METHODS = [
//   {
//     id: "manual", ready: true, accent: C.primary, bg: C.primaryLight,
//     label: "Manual Entry", desc: "Fill the product details using the form",
//     icon: (
//       <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
//         <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//         <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//       </svg>
//     ),
//   },
//   {
//     id: "excel", ready: true, accent: C.greenDark, bg: "#DCFCE7",
//     label: "Excel / CSV", desc: "Bulk upload via spreadsheet",
//     icon: (
//       <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
//         <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//         <polyline points="14,2 14,8 20,8" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//         <line x1="8" y1="13" x2="16" y2="13" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" />
//         <line x1="8" y1="17" x2="16" y2="17" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" />
//       </svg>
//     ),
//   },
//   {
//     id: "api", ready: false, accent: "#D97706", bg: "#FEF3C7",
//     label: "API Integration", desc: "Connect via REST API",
//     icon: (
//       <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
//         <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 4l-4 16" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//       </svg>
//     ),
//   },
//   {
//     id: "db", ready: false, accent: "#CA8A04", bg: "#FEFCE8",
//     label: "Database Sync", desc: "Sync directly from your database",
//     icon: (
//       <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
//         <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#CA8A04" strokeWidth="2" />
//         <path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="#CA8A04" strokeWidth="2" />
//         <path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" stroke="#CA8A04" strokeWidth="2" />
//       </svg>
//     ),
//   },
// ];

// const PROGRESS_STEPS = [10, 25, 40, 55, 70, 85, 100];

// const TEMPLATES: Record<ProductType, { name: string; xlsx: string; csv: string; xls: string }> = {
//   drugs: {
//     name: "drug_products_template",
//     xlsx: "/templates/drugs/XLSX-Drugs Template.xlsx",
//     csv: "/templates/drugs/CSV-Drugs Template.csv",
//     xls: "/templates/drugs/XLS-Drugs Template.xls",
//   },
//   medical_devices_non_consumable: {
//     name: "medical_devices_non_consumable_template",
//     xlsx: "/templates/medical-devices/nonconsumable/XLSX-Non Consumable Template.xlsx",
//     csv: "/templates/medical-devices/nonconsumable/CSV-Non Consumable Template.csv",
//     xls: "/templates/medical-devices/nonconsumable/XLS-Non Consumable Template.xls",
//   },
//   medical_devices_consumable: {
//     name: "medical_devices_consumable_template",
//     xlsx: "/templates/medical-devices/consumable/XLSX-Consumable Template.xlsx",
//     csv: "/templates/medical-devices/consumable/CSV-Consumable Template.csv",
//     xls: "/templates/medical-devices/consumable/XLS-Consumable Template.xls",
//   },
//   cosmetics: {
//     name: "cosmetics_template",
//     xlsx: "/templates/cosmetics/XLSX-Cosmetics Template.xlsx",
//     csv: "/templates/cosmetics/CSV-Cosmetics Template.csv",
//     xls: "/templates/cosmetics/XLS-Cosmetics Template.xls",
//   },
//   supplements: {
//     name: "supplements_template",
//     xlsx: "/templates/supplements/XLSX-Supplements Template.xlsx",
//     csv: "/templates/supplements/CSV-Supplements Template.csv",
//     xls: "/templates/supplements/XLS-Supplements Template.xls",
//   },
//   food_infant: {
//     name: "food_infant_template",
//     xlsx: "/templates/food&Infant/XLSX-FoodInfant.xlsx",
//     csv:  "/templates/food&Infant/CSV-FoodInfant.csv",
//     xls:  "/templates/food&Infant/XLS-FoodInfant.xls",
//   },
// };

// // categoryId mapping (confirmed via Postman):
// //   Drugs                            → 1
// //   Medical Devices (Consumable)     → 5
// //   Medical Devices (Non-Consumable) → 6
// //   Cosmetics                        → 4
// const MEDICAL_DEVICE_CONSUMABLE_IDS = [5];
// const MEDICAL_DEVICE_NON_CONSUMABLE_IDS = [6];
// const COSMETICS_IDS = [4];
// const SUPPLEMENTS_IDS = [2];

// const getCategoryId = (productType: ProductType): number => {
//   if (productType === "medical_devices_consumable") return 5;
//   if (productType === "medical_devices_non_consumable") return 6;
//   if (productType === "supplements") return 2;
//   if (productType === "cosmetics")                      return 4;
//   if (productType === "food_infant")                    return 3;
//   return 1; // drugs
// };


// // Food & Infant required columns
// const FOOD_INFANT_REQUIRED_COLUMNS = [
//   "Product Category*",
//   "Product Subcategory*",
//   "Product Name*",
//   "Brand Name*",
//   "Variant Name*",
//   "Product Form*",
//   "Net Quantity*",
//   "Serving Size*",
//   "Age Group*",
//   "Veg / Non-Veg Indicator*",
//   "Allergen Information*",
//   "Nutritional Information Table",        //  No asterisk
//   "Active Ingredients*",
//   "Additives / Preservatives*",
//   "Product Claims*",
//   "Warnings / Precautions*",
//   "Product Description*",
//   "Storage Condition*",
//   "Manufacturer Name*",
//   "Country of Origin*",
//   "Certifications / Compliance*",
//   "Pack Type",                             // No asterisk
//   "Unit Per Pack",                         // No asterisk
//   "Number Of Packs",                       // No asterisk
//   "Minimum Order Qty*",
//   "Max Order Qty*",
//   "Batch Number*",
//   "Manufacturing Date*",
//   "Expiry Date*",
//   "Stock Quantity*",
//   "Date of Entry*",
//   "MRP (INR)*",
//   "Selling Price(INR)*",
//   "Discount %",                            // No asterisk
//   "GST %",                                 // No asterisk
//   "HSN Code*",
// ];

// // Map for Food & Infant columns
// const FOOD_INFANT_FIELD_LABELS: Record<string, string> = {
//   "Product Category*":           "Product Category",
//   "Product Subcategory*":        "Product Subcategory",
//   "Product Name*":               "Product Name",
//   "Brand Name*":                 "Brand Name",
//   "Variant Name*":               "Variant Name",
//   "Product Form*":               "Product Form",
//   "Net Quantity*":               "Net Quantity",
//   "Serving Size*":               "Serving Size",
//   "Age Group*":                  "Age Group",
//   "Veg / Non-Veg Indicator*":    "Veg / Non-Veg Indicator",
//   "Allergen Information*":       "Allergen Information",
//   "Nutritional Information Table": "Nutritional Information Table",
//   "Active Ingredients*":         "Active Ingredients",
//   "Additives / Preservatives*":  "Additives / Preservatives",
//   "Product Claims*":             "Product Claims",
//   "Warnings / Precautions*":     "Warnings / Precautions",
//   "Product Description*":        "Product Description",
//   "Storage Condition*":          "Storage Condition",
//   "Manufacturer Name*":          "Manufacturer Name",
//   "Country of Origin*":          "Country of Origin",
//   "Certifications / Compliance*": "Certifications / Compliance",
//   "Pack Type":                   "Pack Type",
//   "Unit Per Pack":               "Unit Per Pack",
//   "Number Of Packs":             "Number Of Packs",
//   "Minimum Order Qty*":          "Minimum Order Qty",
//   "Max Order Qty*":              "Max Order Qty",
//   "Batch Number*":               "Batch Number",
//   "Manufacturing Date*":         "Manufacturing Date",
//   "Expiry Date*":                "Expiry Date",
//   "Stock Quantity*":             "Stock Quantity",
//   "Date of Entry*":              "Date of Entry",
//   "MRP (INR)*":                  "MRP (INR)",
//   "Selling Price(INR)*":         "Selling Price (INR)",
//   "Discount %":                  "Discount %",
//   "GST %":                       "GST %",
//   "HSN Code*":                   "HSN Code",
// };

// // ─── Cosmetics required columns (from template) ───────────────────────────────
// // Starred (*) fields in the template are mandatory.
// const COSMETICS_REQUIRED_COLUMNS = [
//   "Product Category*",
//   "Product Sub Category*",
//   "Product Name*",
//   "Brand Name*",
//   "Net Quantity*",
//   "Active Ingredients*",
//   "Gender*",
//   "Age Group*",
//   "Product Claims*",
//   "Warnings / Precautions*",
//   "Product Description*",
//   "Storage Condition*",
//   "Manufacturer Name*",
//   "Country of Origin*",
//   "Certifications / Compliance*",
//   "Minimum Order Qty*",
//   "Max Order Qty*",
//   "Batch Number*",
//   "Manufacturing Date*",
//   "Expiry Date*",
//   "Stock Quantity*",
//   "MRP (INR)*",
//   "Selling Price(INR)*",
//   "GST %",
//   "HSN Code*",
//   "Intended Use Area*",
// ];

// // Friendly name map for cosmetics columns (strips asterisk for display)
// const COSMETICS_FIELD_LABELS: Record<string, string> = {
//   "Product Category*": "Product Category",
//   "Product Sub Category*": "Product Sub Category",
//   "Product Name*": "Product Name",
//   "Brand Name*": "Brand Name",
//   "Net Quantity*": "Net Quantity",
//   "Active Ingredients*": "Active Ingredients",
//   "Gender*": "Gender",
//   "Age Group*": "Age Group",
//   "Product Claims*": "Product Claims",
//   "Warnings / Precautions*": "Warnings / Precautions",
//   "Product Description*": "Product Description",
//   "Storage Condition*": "Storage Condition",
//   "Manufacturer Name*": "Manufacturer Name",
//   "Country of Origin*": "Country of Origin",
//   "Certifications / Compliance*": "Certifications / Compliance",
//   "Minimum Order Qty*": "Minimum Order Qty",
//   "Max Order Qty*": "Max Order Qty",
//   "Batch Number*": "Batch Number",
//   "Manufacturing Date*": "Manufacturing Date",
//   "Expiry Date*": "Expiry Date",
//   "Stock Quantity*": "Stock Quantity",
//   "MRP (INR)*": "MRP (INR)",
//   "Selling Price(INR)*": "Selling Price (INR)",
//   "GST %": "GST %",
//   "HSN Code*": "HSN Code",
//   "Intended Use Area*": "Intended Use Area",
// };



// /**
//  * Client-side validation for Food & Infant CSV/XLSX rows.
//  * Matches backend validations from FoodInfantImportStrategy.java
//  */
// function validateFoodInfantRows(
//   rows: Record<string, string>[],
//   headers: string[]
// ): ValidationError[] {
//   const errors: ValidationError[] = [];

//   // ─────────────────────────────────────────────────────────
//   // MANDATORY FIELDS (based on backend validateMandatoryCsv)
//   // Note: Asterisk in header does NOT determine mandatory status!
//   // ─────────────────────────────────────────────────────────
//   const MANDATORY_FIELDS = [
//     "Product Category*",
//     "Product Subcategory*",
//     "Product Name*",
//     "Brand Name*",
//     "Product Form*",
//     "Net Quantity*",
//     "Serving Size*",
//     "Age Group*",
//     "Veg / Non-Veg Indicator*",
//     "Allergen Information*",
//     "Additives / Preservatives*",
//     "Active Ingredients*",
//     "Product Claims*",
//     "Warnings / Precautions*",
//     "Product Description*",
//     "Storage Condition*",
//     "Manufacturer Name*",
//     "Country of Origin*",
//     "Certifications / Compliance*",
//     "Pack Type",                    // No asterisk but MANDATORY!
//     "Unit Per Pack",                // No asterisk but MANDATORY!
//     "Number Of Packs",              // No asterisk but MANDATORY!
//     "Minimum Order Qty*",
//     "Max Order Qty*",
//     "Batch Number*",
//     "Manufacturing Date*",
//     "Expiry Date*",
//     "Stock Quantity*",
//     "MRP (INR)*",
//     "Selling Price(INR)*",
//     "GST %",                        // No asterisk but MANDATORY!
//     "HSN Code*",
//   ];

//   // Valid GST percentages (from backend)
//   const VALID_GST_VALUES = [0, 5, 12, 18];

//   // Check missing columns
//   const missingCols = MANDATORY_FIELDS.filter(
//     (col) => !headers.some((h) => h.trim() === col.trim())
//   );

//   rows.forEach((row, idx) => {
//     const rowNumber = idx + 2;
//     const productName = (row["Product Name*"] ?? row["Product Name"] ?? "").trim() || `Row ${rowNumber}`;
//     const missingFields: string[] = [];

//     // ─────────────────────────────────────────────────────────
//     // 1. Check for missing mandatory fields
//     // ─────────────────────────────────────────────────────────
//     for (const col of MANDATORY_FIELDS) {
//       if (missingCols.includes(col)) continue;
//       const key = headers.find((h) => h.trim() === col.trim()) ?? col;
//       const val = (row[key] ?? "").toString().trim();
//       if (!val) {
//         missingFields.push(col.replace("*", "").trim());
//       }
//     }

//     // ─────────────────────────────────────────────────────────
//     // 2. Product Name validation
//     // ─────────────────────────────────────────────────────────
//     const productNameVal = (row["Product Name*"] ?? row["Product Name"] ?? "").trim();
//     if (productNameVal) {
//       if (productNameVal.length < 3) {
//         errors.push({ rowNumber, productName, errorMessage: "Product Name must be at least 3 characters" });
//       }
//       if (productNameVal.length > 150) {
//         errors.push({ rowNumber, productName, errorMessage: "Product Name must not exceed 150 characters" });
//       }
//     }

//     // ─────────────────────────────────────────────────────────
//     // 3. Brand Name validation
//     // ─────────────────────────────────────────────────────────
//     const brandName = (row["Brand Name*"] ?? row["Brand Name"] ?? "").trim();
//     if (brandName && brandName.length > 60) {
//       errors.push({ rowNumber, productName, errorMessage: "Brand Name must not exceed 60 characters" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 4. Serving Size validation
//     // ─────────────────────────────────────────────────────────
//     const servingSize = (row["Serving Size*"] ?? row["Serving Size"] ?? "").trim();
//     if (servingSize && servingSize.length > 20) {
//       errors.push({ rowNumber, productName, errorMessage: "Serving Size must not exceed 20 characters" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 5. Active Ingredients validation
//     // ─────────────────────────────────────────────────────────
//     const activeIngredients = (row["Active Ingredients*"] ?? row["Active Ingredients"] ?? "").trim();
//     if (activeIngredients && activeIngredients.length > 1000) {
//       errors.push({ rowNumber, productName, errorMessage: "Active Ingredients must not exceed 1000 characters" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 6. Allergen Information validation
//     // ─────────────────────────────────────────────────────────
//     const allergenInfo = (row["Allergen Information*"] ?? row["Allergen Information"] ?? "").trim();
//     if (allergenInfo && allergenInfo.length > 500) {
//       errors.push({ rowNumber, productName, errorMessage: "Allergen Information must not exceed 500 characters" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 7. Product Claims validation
//     // ─────────────────────────────────────────────────────────
//     const productClaims = (row["Product Claims*"] ?? row["Product Claims"] ?? "").trim();
//     if (productClaims && productClaims.length > 1000) {
//       errors.push({ rowNumber, productName, errorMessage: "Product Claims must not exceed 1000 characters" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 8. Warnings / Precautions validation
//     // ─────────────────────────────────────────────────────────
//     const warnings = (row["Warnings / Precautions*"] ?? row["Warnings / Precautions"] ?? "").trim();
//     if (warnings && warnings.length > 1000) {
//       errors.push({ rowNumber, productName, errorMessage: "Warnings / Precautions must not exceed 1000 characters" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 9. Product Description validation
//     // ─────────────────────────────────────────────────────────
//     const description = (row["Product Description*"] ?? row["Product Description"] ?? "").trim();
//     if (description && description.length > 1000) {
//       errors.push({ rowNumber, productName, errorMessage: "Product Description must not exceed 1000 characters" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 10. Manufacturer Name validation
//     // ─────────────────────────────────────────────────────────
//     const manufacturer = (row["Manufacturer Name*"] ?? row["Manufacturer Name"] ?? "").trim();
//     if (manufacturer && manufacturer.length > 100) {
//       errors.push({ rowNumber, productName, errorMessage: "Manufacturer Name must not exceed 100 characters" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 11. Veg / Non-Veg Indicator validation
//     // ─────────────────────────────────────────────────────────
//     const vegNonVeg = (row["Veg / Non-Veg Indicator*"] ?? row["Veg / Non-Veg Indicator"] ?? "").trim().toLowerCase();
//     if (vegNonVeg && !["veg", "non-veg"].includes(vegNonVeg)) {
//       errors.push({ rowNumber, productName, errorMessage: "Veg / Non-Veg Indicator must be 'veg' or 'non-veg'" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 12. Unit Per Pack validation (mandatory, positive number)
//     // ─────────────────────────────────────────────────────────
//     const unitPerPackRaw = (row["Unit Per Pack"] ?? "").trim();
//     if (!unitPerPackRaw) {
//       errors.push({ rowNumber, productName, errorMessage: "Number of Units per Pack Type is mandatory" });
//     } else {
//       const unitPerPack = Number(unitPerPackRaw);
//       if (isNaN(unitPerPack) || unitPerPack <= 0) {
//         errors.push({ rowNumber, productName, errorMessage: "Number of Units per Pack Type must be a positive numeric value" });
//       }
//     }

//     // ─────────────────────────────────────────────────────────
//     // 13. Number of Packs validation (mandatory, positive number)
//     // ─────────────────────────────────────────────────────────
//     const numberOfPacksRaw = (row["Number Of Packs"] ?? "").trim();
//     if (!numberOfPacksRaw) {
//       errors.push({ rowNumber, productName, errorMessage: "Number of Packs is mandatory" });
//     } else {
//       const numberOfPacks = Number(numberOfPacksRaw);
//       if (isNaN(numberOfPacks) || numberOfPacks <= 0) {
//         errors.push({ rowNumber, productName, errorMessage: "Number of Packs must be a positive numeric value" });
//       }
//     }

//     // ─────────────────────────────────────────────────────────
//     // 14. Batch Number validation (alphanumeric, 3-20 chars)
//     // ─────────────────────────────────────────────────────────
//     const batchNumber = (row["Batch Number*"] ?? row["Batch Number"] ?? "").trim();
//     if (batchNumber) {
//       if (!/^[A-Za-z0-9]+$/.test(batchNumber)) {
//         errors.push({ rowNumber, productName, errorMessage: "Batch Number must be alphanumeric only (no special characters)" });
//       }
//       if (batchNumber.length < 3) {
//         errors.push({ rowNumber, productName, errorMessage: "Batch Number must be at least 3 characters" });
//       }
//       if (batchNumber.length > 20) {
//         errors.push({ rowNumber, productName, errorMessage: "Batch Number must not exceed 20 characters" });
//       }
//     }

//     // ─────────────────────────────────────────────────────────
//     // 15. Min Order Qty vs Max Order Qty
//     // ─────────────────────────────────────────────────────────
//     const minQty = Number((row["Minimum Order Qty*"] ?? row["Minimum Order Qty"] ?? "0").trim());
//     const maxQty = Number((row["Max Order Qty*"] ?? row["Max Order Qty"] ?? "0").trim());

//     if (!isNaN(minQty) && !isNaN(maxQty) && minQty > 0 && maxQty > 0 && minQty > maxQty) {
//       errors.push({ rowNumber, productName, errorMessage: "Minimum Order Qty must be ≤ Maximum Order Qty" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 16. Stock Quantity validation
//     // ─────────────────────────────────────────────────────────
//     const stockQty = Number((row["Stock Quantity*"] ?? row["Stock Quantity"] ?? "0").trim());
//     if (!isNaN(stockQty) && stockQty <= 0) {
//       errors.push({ rowNumber, productName, errorMessage: "Stock Quantity must be a positive value" });
//     }
//     if (!isNaN(stockQty) && !isNaN(minQty) && stockQty > 0 && minQty > 0 && stockQty < minQty) {
//       errors.push({ rowNumber, productName, errorMessage: `Stock Quantity (${stockQty}) must be ≥ Minimum Order Quantity (${minQty})` });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 17. MRP validation
//     // ─────────────────────────────────────────────────────────
//     const mrp = Number((row["MRP (INR)*"] ?? row["MRP (INR)"] ?? "0").trim());
//     if (!isNaN(mrp) && mrp <= 0) {
//       errors.push({ rowNumber, productName, errorMessage: "MRP must be greater than 0" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 18. Selling Price validation
//     // ─────────────────────────────────────────────────────────
//     const sellingPrice = Number((row["Selling Price(INR)*"] ?? row["Selling Price(INR)"] ?? "0").trim());
//     if (!isNaN(sellingPrice) && sellingPrice <= 0) {
//       errors.push({ rowNumber, productName, errorMessage: "Selling Price must be greater than 0" });
//     }
//     if (!isNaN(sellingPrice) && !isNaN(mrp) && sellingPrice > mrp) {
//       errors.push({ rowNumber, productName, errorMessage: "Selling Price cannot exceed MRP" });
//     }

//     // ─────────────────────────────────────────────────────────
//     // 19. Discount % validation (optional, but if present must be 0-100)
//     // ─────────────────────────────────────────────────────────
//     const discountPct = (row["Discount %"] ?? "").trim();
//     if (discountPct) {
//       const discount = Number(discountPct);
//       if (!isNaN(discount) && (discount < 0 || discount > 100)) {
//         errors.push({ rowNumber, productName, errorMessage: "Discount % must be between 0 and 100" });
//       }
//     }

//     // ─────────────────────────────────────────────────────────
//     // 20. GST % validation (mandatory, must be 0,5,12,18)
//     // ─────────────────────────────────────────────────────────
//     const gstPct = (row["GST %"] ?? "").trim();
//     if (!gstPct) {
//       errors.push({ rowNumber, productName, errorMessage: "GST % is mandatory" });
//     } else {
//       const gst = Number(gstPct);
//       if (!isNaN(gst) && !VALID_GST_VALUES.includes(gst)) {
//         errors.push({ rowNumber, productName, errorMessage: "GST % must be one of: 0, 5, 12, 18" });
//       }
//     }

//     // ─────────────────────────────────────────────────────────
//     // 21. HSN Code validation (4, 6, or 8 digits)
//     // ─────────────────────────────────────────────────────────
//     const hsnCode = (row["HSN Code*"] ?? row["HSN Code"] ?? "").trim();
//     if (hsnCode) {
//       const hsnLength = hsnCode.length;
//       if (![4, 6, 8].includes(hsnLength)) {
//         errors.push({ rowNumber, productName, errorMessage: "HSN Code must be 4, 6, or 8 digits" });
//       }
//       if (!/^\d+$/.test(hsnCode)) {
//         errors.push({ rowNumber, productName, errorMessage: "HSN Code must contain only digits" });
//       }
//     }


// // ─────────────────────────────────────────────────────────
// // 22. Manufacturing Date & Expiry Date validations
// // ─────────────────────────────────────────────────────────
// const mfgDateRaw = (row["Manufacturing Date*"] ?? row["Manufacturing Date"] ?? "").trim();
// const expDateRaw = (row["Expiry Date*"] ?? row["Expiry Date"] ?? "").trim();

// // Helper to parse date safely
// const parseDate = (dateStr: string): Date | null => {
//   if (!dateStr) return null;
//   // Try different formats
//   let date: Date;
//   if (dateStr.includes('-')) {
//     date = new Date(dateStr);
//   } else if (dateStr.includes('/')) {
//     const parts = dateStr.split('/');
//     if (parts.length === 3) {
//       // Assume DD/MM/YYYY
//       date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
//     } else {
//       date = new Date(dateStr);
//     }
//   } else {
//     date = new Date(dateStr);
//   }
//   return isNaN(date.getTime()) ? null : date;
// };

// // Manufacturing Date validations
// if (mfgDateRaw) {
//   const mfgDate = parseDate(mfgDateRaw);
//   if (mfgDate) {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//     const threeYearsAgo = new Date();
//     threeYearsAgo.setFullYear(today.getFullYear() - 3);
//     threeYearsAgo.setHours(0, 0, 0, 0);
    
//     // Rule 1: Manufacturing Date cannot be in future month
//     if (mfgDate > currentMonth) {
//       errors.push({ rowNumber, productName, errorMessage: "Manufacturing Date cannot be a future month" });
//     }
    
//     // Rule 2: Manufacturing Date cannot be more than 3 years old from today
//     if (mfgDate < threeYearsAgo) {
//       errors.push({ rowNumber, productName, errorMessage: "Manufacturing Date cannot be more than 3 years old from today" });
//     }
//   } else {
//     errors.push({ rowNumber, productName, errorMessage: "Manufacturing Date is in an invalid format. Use YYYY-MM-DD or DD-MM-YYYY" });
//   }
// }

// // Expiry Date validations
// if (expDateRaw) {
//   const expDate = parseDate(expDateRaw);
//   if (expDate) {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const threeMonthsFromNow = new Date();
//     threeMonthsFromNow.setMonth(today.getMonth() + 3);
//     threeMonthsFromNow.setHours(0, 0, 0, 0);
    
//     const fiveYearsFromNow = new Date();
//     fiveYearsFromNow.setFullYear(today.getFullYear() + 5);
//     fiveYearsFromNow.setHours(0, 0, 0, 0);
    
//     // Rule 3: Expiry Date must be at least 3 months from today
//     if (expDate < threeMonthsFromNow) {
//       errors.push({ rowNumber, productName, errorMessage: "Expiry Date must be at least 3 months from today" });
//     }
    
//     // Rule 4: Expiry Date cannot exceed 5 years from today
//     if (expDate > fiveYearsFromNow) {
//       errors.push({ rowNumber, productName, errorMessage: "Expiry Date cannot exceed 5 years from today" });
//     }
//   } else {
//     errors.push({ rowNumber, productName, errorMessage: "Expiry Date is in an invalid format. Use YYYY-MM-DD or DD-MM-YYYY" });
//   }
// }

// // Compare Manufacturing Date and Expiry Date
// if (mfgDateRaw && expDateRaw) {
//   const mfgDate = parseDate(mfgDateRaw);
//   const expDate = parseDate(expDateRaw);
//   if (mfgDate && expDate) {
//     // Rule 5: Expiry Date must be after Manufacturing Date
//     if (mfgDate >= expDate) {
//       errors.push({ rowNumber, productName, errorMessage: "Expiry Date must be after Manufacturing Date" });
//     }
//   }
// }
//     // ─────────────────────────────────────────────────────────
//     // 23. Missing mandatory fields error
//     // ─────────────────────────────────────────────────────────
//     if (missingFields.length > 0) {
//       errors.push({
//         rowNumber,
//         productName: productName || "—",
//         errorMessage: `Missing required field(s): ${missingFields.join(", ")}`,
//       });
//     }
//   });

//   // ─────────────────────────────────────────────────────────
//   // 24. Structural columns missing
//   // ─────────────────────────────────────────────────────────
//   if (missingCols.length > 0) {
//     errors.unshift({
//       rowNumber: 1,
//       productName: "—",
//       errorMessage: `Template columns missing: ${missingCols.join(", ")}. Please use the official Food & Infant template.`,
//     });
//   }

//   return errors;
// }

// /**
//  * Client-side validation for cosmetics CSV/XLSX rows.
//  * Returns an array of ValidationError objects (empty = all good).
//  */
// function validateCosmeticsRows(
//   rows: Record<string, string>[],
//   headers: string[]
// ): ValidationError[] {
//   const errors: ValidationError[] = [];

//   // Check that all required columns are present in the file at all
//   const missingCols = COSMETICS_REQUIRED_COLUMNS.filter(
//     (col) => !headers.some((h) => h.trim() === col.trim())
//   );

//   rows.forEach((row, idx) => {
//     const rowNumber = idx + 2; // 1-indexed, row 1 = header
//     const productName = (
//       row["Product Name*"] ?? row["Product Name"] ?? ""
//     ).trim();

//     // Per-column missing-value checks
//     const missingFields: string[] = [];

//     for (const col of COSMETICS_REQUIRED_COLUMNS) {
//       // Skip columns that aren't even in the file (already flagged above)
//       if (missingCols.includes(col)) continue;

//       // Find the actual key (headers may or may not have the asterisk in data)
//       const key = headers.find((h) => h.trim() === col.trim()) ?? col;
//       const val = (row[key] ?? "").toString().trim();

//       if (!val) {
//         missingFields.push(COSMETICS_FIELD_LABELS[col] ?? col.replace("*", ""));
//       }
//     }

//     // Numeric range checks
//     const mrp = parseFloat(row["MRP (INR)*"] ?? row["MRP (INR)"] ?? "");
//     const sellingPrice = parseFloat(row["Selling Price(INR)*"] ?? row["Selling Price(INR)"] ?? "");
//     const minQty = parseInt(row["Minimum Order Qty*"] ?? row["Minimum Order Qty"] ?? "", 10);
//     const maxQty = parseInt(row["Max Order Qty*"] ?? row["Max Order Qty"] ?? "", 10);
//     const stockQty = parseInt(row["Stock Quantity*"] ?? row["Stock Quantity"] ?? "", 10);

//     if (!isNaN(mrp) && !isNaN(sellingPrice) && sellingPrice > mrp) {
//       errors.push({ rowNumber, productName, errorMessage: "Selling Price cannot exceed MRP." });
//     }
//     if (!isNaN(minQty) && !isNaN(maxQty) && minQty > maxQty) {
//       errors.push({ rowNumber, productName, errorMessage: "Minimum Order Qty cannot exceed Max Order Qty." });
//     }
//     if (!isNaN(stockQty) && stockQty < 0) {
//       errors.push({ rowNumber, productName, errorMessage: "Stock Quantity must be 0 or greater." });
//     }

//     // Date checks: Manufacturing Date must be before Expiry Date
//     const mfgRaw = (row["Manufacturing Date*"] ?? row["Manufacturing Date"] ?? "").trim();
//     const expRaw = (row["Expiry Date*"] ?? row["Expiry Date"] ?? "").trim();
//     if (mfgRaw && expRaw) {
//       const mfgDate = new Date(mfgRaw);
//       const expDate = new Date(expRaw);
//       if (!isNaN(mfgDate.getTime()) && !isNaN(expDate.getTime()) && mfgDate >= expDate) {
//         errors.push({ rowNumber, productName, errorMessage: "Manufacturing Date must be before Expiry Date." });
//       }
//     }

//     // Discount % sanity (optional field)
//     const discountRaw = (row["Discount %"] ?? "").trim();
//     if (discountRaw) {
//       const discount = parseFloat(discountRaw);
//       if (!isNaN(discount) && (discount < 0 || discount > 100)) {
//         errors.push({ rowNumber, productName, errorMessage: "Discount % must be between 0 and 100." });
//       }
//     }

//     if (missingFields.length > 0) {
//       errors.push({
//         rowNumber,
//         productName,
//         errorMessage: `Missing required field(s): ${missingFields.join(", ")}.`,
//       });
//     }
//   });

//   // If structural columns are missing, add a single top-level error (row 1)
//   if (missingCols.length > 0) {
//     errors.unshift({
//       rowNumber: 1,
//       productName: "—",
//       errorMessage: `Template columns missing: ${missingCols.map((c) => c.replace("*", "")).join(", ")}. Please use the official Cosmetics template.`,
//     });
//   }

//   return errors;
// }

// const fileKey = (f: File) => `${f.name}-${f.size}`;

// // ─── Shared Styles ────────────────────────────────────────────────────────────
// const fontBase: React.CSSProperties = { fontFamily: "'Open Sans', sans-serif" };

// const flex = (
//   dir: "row" | "col",
//   gap?: number,
//   align?: string,
//   justify?: string,
// ): React.CSSProperties => ({
//   display: "flex",
//   flexDirection: dir === "col" ? "column" : "row",
//   ...(gap ? { gap } : {}),
//   ...(align ? { alignItems: align } : {}),
//   ...(justify ? { justifyContent: justify } : {}),
// });

// const XIcon = ({ size = 24, color = "#111827", strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
//   <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
//     <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
//   </svg>
// );

// const DownloadIcon = ({ color }: { color: string }) => (
//   <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
//     <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" fill={color} />
//     <path d="M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
//   </svg>
// );

// function FileIcon({ ext = "XLSX" }: { ext?: string }) {
//   return (
//     <div style={{ position: "relative", width: 44, height: 52, flexShrink: 0 }}>
//       <div style={{ width: 44, height: 52, borderRadius: 6, background: "#F9FAFB", border: "1px solid #E5E7EB", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
//         <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 12px 12px 0", borderColor: "transparent #E5E7EB transparent transparent" }} />
//         {[16, 22, 28].map((top) => (
//           <div key={top} style={{ position: "absolute", top, left: 6, right: top === 28 ? 12 : 8, height: 2, background: "#E5E7EB", borderRadius: 1 }} />
//         ))}
//         <div style={{ position: "absolute", bottom: 0, left: 0, background: "#16A34A", borderRadius: "0 4px 0 4px", padding: "2px 4px" }}>
//           <span style={{ fontSize: 7, fontWeight: 800, color: "white", letterSpacing: 0.3, lineHeight: 1, fontFamily: "monospace" }}>
//             {ext.slice(0, 4)}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// function FileRow({ uf, index, onRemove, submitting }: {
//   uf: UploadedFile; index: number; onRemove: (i: number) => void; submitting: boolean;
// }) {
//   const fileSizeKB = Math.max(1, Math.round(uf.file.size / 1024));
//   const ext = (uf.file.name.split(".").pop() ?? "xlsx").toUpperCase();
//   const isUploading = uf.status === "uploading";
//   const isDone = uf.status === "done";
//   const isError = uf.status === "error";

//   const sizeLabel = isUploading
//     ? `${fileSizeKB} KB of ${fileSizeKB * 2} KB •`
//     : isDone
//       ? `${fileSizeKB} KB of ${fileSizeKB} KB •`
//       : `${fileSizeKB} KB •`;

//   return (
//     <div style={{ background: isError ? "#FEF2F2" : "#F3F4F6", borderRadius: 8, padding: 8, ...flex("col", 6), border: isError ? "1px solid #FECACA" : "none" }}>
//       <div style={{ ...flex("row", 0, "flex-start", "space-between") }}>
//         <div style={{ ...flex("row", 12, "center"), flex: 1, minWidth: 0 }}>
//           <FileIcon ext={ext} />
//           <div style={{ ...flex("col", 6), minWidth: 0 }}>
//             <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fontBase, lineHeight: "16px" }}>
//               {uf.file.name}
//             </div>
//             <div style={{ ...flex("row", 4, "center"), fontSize: 10, ...fontBase }}>
//               <span style={{ color: "#6B7280" }}>{sizeLabel}</span>
//               {isUploading && (
//                 <span style={{ ...flex("row", 3, "center"), color: "#374151" }}>
//                   <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #D1FAE5", borderTopColor: "#16A34A", display: "inline-block", flexShrink: 0, animation: "dfSpin 0.65s linear infinite" }} />
//                   <span style={{ color: "#111827", fontSize: 10 }}>Uploading...</span>
//                 </span>
//               )}
//               {isDone && (
//                 <span style={{ ...flex("row", 4, "center") }}>
//                   <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#16A34A", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
//                     <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
//                       <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                   </span>
//                   <span style={{ color: "#111827", fontWeight: 600, fontSize: 10 }}>Completed</span>
//                 </span>
//               )}
//               {isError && (
//                 <span style={{ ...flex("row", 4, "center") }}>
//                   <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#DC2626", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
//                     <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
//                       <path d="M3 3l4 4M7 3L3 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
//                     </svg>
//                   </span>
//                   <span style={{ color: "#DC2626", fontWeight: 600, fontSize: 10 }}>{uf.error ?? "Upload failed"}</span>
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>
//         <button
//           onClick={() => !submitting && onRemove(index)}
//           style={{ background: "none", border: "none", padding: "2px 4px", cursor: submitting ? "default" : "pointer", ...flex("row", 0, "center", "center"), flexShrink: 0, marginLeft: 8, opacity: submitting ? 0.3 : 1 }}
//         >
//           <XIcon size={14} color="#9CA3AF" strokeWidth={2} />
//         </button>
//       </div>
//       {isUploading && (
//         <div style={{ height: 6, background: "#EDE9FE", borderRadius: 99, overflow: "hidden", marginTop: 2 }}>
//           <div style={{ height: "100%", background: "#7C3AED", borderRadius: 99, width: `${uf.progress ?? 0}%`, transition: "width 0.3s ease" }} />
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── MedicalDeviceSubTypePicker ───────────────────────────────────────────────
// function MedicalDeviceSubTypePicker({
//   selected,
//   onChange,
// }: {
//   selected: MedicalDeviceSubType;
//   onChange: (v: MedicalDeviceSubType) => void;
// }) {
//   return (
//     <div style={{ ...flex("col", 8) }}>
//       <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", ...fontBase }}>
//         Select device type
//       </div>
//       <div style={{ ...flex("row", 10) }}>
//         <button
//           onClick={() => onChange("consumable")}
//           style={{
//             flex: 1, padding: "10px 12px", borderRadius: 10,
//             border: `1.5px solid ${selected === "consumable" ? C.primary : "#E5E7EB"}`,
//             background: selected === "consumable" ? C.primaryLight : "#FAFAFA",
//             color: selected === "consumable" ? C.primary : "#374151",
//             fontWeight: selected === "consumable" ? 700 : 500,
//             fontSize: 12, cursor: "pointer", textAlign: "left", ...fontBase,
//             transition: "all 0.15s", ...flex("col", 3),
//           }}
//         >
//           <div style={{ ...flex("row", 6, "center") }}>
//             {selected === "consumable" && (
//               <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
//                 <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//             )}
//             <span>Consumable</span>
//           </div>
//           <span style={{ fontSize: 10, color: selected === "consumable" ? "#7C3AED" : "#9CA3AF", fontWeight: 400 }}>
//             Single-use / disposable
//           </span>
//         </button>

//         <button
//           onClick={() => onChange("non_consumable")}
//           style={{
//             flex: 1, padding: "10px 12px", borderRadius: 10,
//             border: `1.5px solid ${selected === "non_consumable" ? C.primary : "#E5E7EB"}`,
//             background: selected === "non_consumable" ? C.primaryLight : "#FAFAFA",
//             color: selected === "non_consumable" ? C.primary : "#374151",
//             fontWeight: selected === "non_consumable" ? 700 : 500,
//             fontSize: 12, cursor: "pointer", textAlign: "left", ...fontBase,
//             transition: "all 0.15s", ...flex("col", 3),
//           }}
//         >
//           <div style={{ ...flex("row", 6, "center") }}>
//             {selected === "non_consumable" && (
//               <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
//                 <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//             )}
//             <span>Non-Consumable</span>
//           </div>
//           <span style={{ fontSize: 10, color: selected === "non_consumable" ? "#7C3AED" : "#9CA3AF", fontWeight: 400 }}>
//             Durable / reusable devices
//           </span>
//         </button>
//       </div>
//     </div>
//   );
// }

// // ─── ValidationErrorPanel ─────────────────────────────────────────────────────
// function ValidationErrorPanel({
//   errors, successCount, failureCount, totalRows, onDownload, onDismiss,
// }: {
//   errors: ValidationError[]; successCount: number; failureCount: number;
//   totalRows: number; onDownload: () => void; onDismiss: () => void;
// }) {
//   const allFailed = successCount === 0 && failureCount > 0;
//   return (
//     <div style={{ ...flex("col", 8), background: "#FFF8F8", border: "1px solid #FECACA", borderRadius: 12, padding: 14, overflow: "hidden" }}>
//       <div style={{ ...flex("row", 0, "center", "space-between") }}>
//         <div style={{ ...flex("row", 8, "center") }}>
//           <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
//             <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8" />
//             <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
//           </svg>
//           <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", ...fontBase }}>
//             {allFailed
//               ? `All ${totalRows} row(s) failed validation`
//               : `${failureCount} of ${totalRows} row(s) failed — ${successCount} added successfully`}
//           </span>
//         </div>
//         <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
//           <XIcon size={13} color="#991B1B" />
//         </button>
//       </div>

//       {!allFailed && (
//         <div style={{ ...flex("row", 6, "center") }}>
//           <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, ...fontBase }}>
//             ✓ {successCount} added
//           </span>
//           <span style={{ background: "#FEE2E2", color: "#991B1B", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, ...fontBase }}>
//             ✗ {failureCount} failed
//           </span>
//         </div>
//       )}

//       <div style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 8, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
//         <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, ...fontBase }}>
//           <thead style={{ background: "#FEF2F2", position: "sticky", top: 0, zIndex: 1 }}>
//             <tr>
//               <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", width: 48, borderBottom: "1px solid #FECACA" }}>Row</th>
//               <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", width: "35%", borderBottom: "1px solid #FECACA" }}>Product</th>
//               <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", borderBottom: "1px solid #FECACA" }}>Reason</th>
//             </tr>
//           </thead>
//           <tbody>
//             {errors.map((err, idx) => (
//               <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#FFF8F8" }}>
//                 <td style={{ padding: "7px 10px", color: "#6B7280", fontWeight: 600, borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none" }}>
//                   {err.rowNumber}
//                 </td>
//                 <td style={{ padding: "7px 10px", color: "#374151", fontWeight: 500, borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                   {err.productName || <em style={{ color: "#9CA3AF" }}>Unnamed</em>}
//                 </td>
//                 <td style={{ padding: "7px 10px", color: "#DC2626", borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none" }}>
//                   {err.errorMessage}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <button
//         onClick={onDownload}
//         style={{ alignSelf: "flex-end", ...flex("row", 6, "center", "center"), padding: "6px 12px", background: "#fff", border: "1px solid #DC2626", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#DC2626", ...fontBase }}
//       >
//         <DownloadIcon color="#DC2626" />
//         Download Error Report (.csv)
//       </button>
//     </div>
//   );
// }

// // ─── ExcelUploadView ──────────────────────────────────────────────────────────
// function ExcelUploadView({ onBack, onSuccess }: {
//   onBack: () => void;
//   onSuccess: (type: ProductType, files: UploadedFile[], result: UploadResult) => void;
// }) {
//   const [productType, setProductType] = useState<ProductType>("drugs");
//   const [medDevSubType, setMedDevSubType] = useState<MedicalDeviceSubType>("consumable");
//   const [dragging, setDragging] = useState(false);
//   const [files, setFiles] = useState<UploadedFile[]>([]);
//   const [submitting, setSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);
//   const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
//   const [fileFormatError, setFileFormatError] = useState<string | null>(null);
//   const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string }>>([]);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

//   // Derive the effective ProductType from (productType, medDevSubType)
//   const effectiveProductType: ProductType =
//     productType === "medical_devices_non_consumable"
//       ? medDevSubType === "consumable"
//         ? "medical_devices_consumable"
//         : "medical_devices_non_consumable"
//       : productType === "cosmetics"
//         ? "cosmetics"
//         : productType;

//   const getUserId = useCallback((): number | null => {
//     try {
//       const userStr = localStorage.getItem("user");
//       if (userStr) { const user = JSON.parse(userStr); return user.userId; }
//       const token = localStorage.getItem("token");
//       if (token) {
//         const payload = JSON.parse(atob(token.split(".")[1]));
//         return payload.userId || payload.user_id || payload.sub;
//       }
//       return null;
//     } catch { return null; }
//   }, []);

//   useEffect(() => {
//     const fetchSellerCategories = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) { setLoadingCategories(false); return; }
//         const userId = getUserId();
//         if (!userId) { setLoadingCategories(false); return; }

//         const response = await fetch(
//           `https://api-test-aggreator.tiameds.ai/api/v1/sellers/user/${userId}`,
//           { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
//         );

//         const defaultCategories = [
//           { id: 1, name: "Drugs" },
//           { id: 2, name: "Supplements / Nutraceuticals" },
//           { id: 3, name: "Food & Infant Nutrition" },
//           { id: 4, name: "Cosmetic & Personal Care" },
//           { id: 5, name: "Medical Devices (Consumable)" },
//           { id: 6, name: "Medical Devices (Non-Consumable)" },
//         ];

//         if (response.ok) {
//           const result = await response.json();
//           setAvailableCategories(
//             result?.data?.productTypes?.length
//               ? result.data.productTypes.map((pt: any) => ({ id: pt.productTypeId, name: pt.productTypeName }))
//               : defaultCategories
//           );
//         } else {
//           setAvailableCategories(defaultCategories);
//         }
//       } catch {
//         setAvailableCategories([
//           { id: 1, name: "Drugs" },
//           { id: 2, name: "Supplements / Nutraceuticals" },
//           { id: 3, name: "Food & Infant Nutrition" },
//           { id: 4, name: "Cosmetic & Personal Care" },
//           { id: 5, name: "Medical Devices (Consumable)" },
//           { id: 6, name: "Medical Devices (Non-Consumable)" },
//         ]);
//       } finally {
//         setLoadingCategories(false);
//       }
//     };
//     fetchSellerCategories();
//   }, [getUserId]);

//   const isMedDevCategory = (catId: number) =>
//     MEDICAL_DEVICE_CONSUMABLE_IDS.includes(catId) || MEDICAL_DEVICE_NON_CONSUMABLE_IDS.includes(catId);

//   const isCosmeticsCategory = (catId: number) => COSMETICS_IDS.includes(catId);
//   const isSupplementCategory = (catId: number) => SUPPLEMENTS_IDS.includes(catId);

//   // ── FIX 1: isCategorySelected now handles cosmetics ──────────────────────
//   const isCategorySelected = (catId: number) => {

//     if (catId === 1) return productType === "drugs";
//     if (isMedDevCategory(catId)) return productType === "medical_devices_non_consumable";
//     if (isCosmeticsCategory(catId)) return productType === "cosmetics";
//     if (isSupplementCategory(catId)) return productType === "supplements";
//     if (catId === 3)                  return productType === "food_infant";

//     return false;
//   };

//   // ── FIX 2: isSelectable now includes cosmetics ───────────────────────────
//   const isSelectable = (catId: number) =>
//     catId === 1 ||
//     MEDICAL_DEVICE_NON_CONSUMABLE_IDS.includes(catId) ||
//     MEDICAL_DEVICE_CONSUMABLE_IDS.includes(catId) ||
//     COSMETICS_IDS.includes(catId) ||
//     catId === 3 ||
//     SUPPLEMENTS_IDS.includes(catId);

  

//   // ── FIX 3: handleCategorySelect now handles cosmetics ───────────────────
//   const handleCategorySelect = (catId: number) => {
//     if (catId === 1) {
//       setProductType("drugs");
//     } else if (isMedDevCategory(catId)) {
//       setProductType("medical_devices_non_consumable");
//       setMedDevSubType("consumable");
//     } else if (isCosmeticsCategory(catId)) {
//       setProductType("cosmetics");
//     } else if (isSupplementCategory(catId)) {
//       setProductType("supplements");
//     }
//     else if (catId === 3) {
//     setProductType("food_infant");
//   }
//     setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null);
//   };

//   const updateFile = (key: string, patch: Partial<UploadedFile>) =>
//     setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, ...patch } : f));

//   const runFakeProgress = (key: string) => {
//     let step = 0;
//     const tick = () => {
//       if (step >= PROGRESS_STEPS.length) {
//         setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, status: "done" as const, progress: 100 } : f));
//         timersRef.current.delete(key);
//         return;
//       }
//       const p = PROGRESS_STEPS[step++];
//       setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, progress: p } : f));
//       timersRef.current.set(key, setTimeout(tick, 180));
//     };
//     timersRef.current.set(key, setTimeout(tick, 80));
//   };

//   const addFiles = (newFiles: File[]) => {
//     setSubmitError(null); setUploadResult(null); setFileFormatError(null);
//     const validFiles: File[] = [];
//     const errors: string[] = [];
//     const maxSize = 10 * 1024 * 1024;
//     const validExts = ["xlsx", "csv", "xls"];

//     newFiles.forEach((file) => {
//       const ext = file.name.split(".").pop()?.toLowerCase();
//       if (!ext || !validExts.includes(ext)) {
//         errors.push(`${file.name}: Invalid format. Please upload .xlsx, .csv, or .xls files only.`);
//         return;
//       }
//       if (file.size > maxSize) { errors.push(`${file.name}: File size exceeds 10MB limit.`); return; }
//       if (file.size === 0) { errors.push(`${file.name}: File is empty — please use our template.`); return; }
//       validFiles.push(file);
//     });

//     if (errors.length > 0) { setFileFormatError(errors.join(" ")); return; }

//     setFiles((prev) => {
//       const filtered = validFiles.filter((f) => !prev.some((ex) => ex.file.name === f.name && ex.file.size === f.size));
//       return [...prev, ...filtered.map((f) => ({ file: f, status: "uploading" as const, progress: 0 }))];
//     });
//     validFiles.forEach((f) => setTimeout(() => runFakeProgress(fileKey(f)), 50));
//   };

//   const removeFile = (i: number) => {
//     setSubmitError(null); setUploadResult(null); setFileFormatError(null);
//     setFiles((prev) => {
//       const key = fileKey(prev[i].file);
//       const timer = timersRef.current.get(key);
//       if (timer) { clearTimeout(timer); timersRef.current.delete(key); }
//       return prev.filter((_, idx) => idx !== i);
//     });
//   };

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault(); setDragging(false);
//     const dropped = Array.from(e.dataTransfer.files);
//     if (dropped.length) addFiles(dropped);
//   };

//   const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files?.length) { addFiles(Array.from(e.target.files)); e.target.value = ""; }
//   };

//   const downloadErrorReport = (errors: ValidationError[]) => {
//     if (!errors.length) return;
//     const csvRows = [
//       ["Row Number", "Product Name", "Error Message"].join(","),
//       ...errors.map((e) =>
//         `"${e.rowNumber}","${(e.productName ?? "").replace(/"/g, '""')}","${(e.errorMessage ?? "").replace(/"/g, '""')}"`
//       ),
//     ];
//     const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = `upload_errors_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
//     document.body.appendChild(link); link.click(); document.body.removeChild(link);
//   };




//   // Add this function
// const runClientSideFoodInfantValidation = async (file: File): Promise<ValidationError[]> => {
//   return new Promise((resolve) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const text = e.target?.result as string;
//         const lines = text.split(/\r?\n/).filter((l) => l.trim());
//         if (lines.length < 2) {
//           resolve([{ rowNumber: 1, productName: "—", errorMessage: "File appears empty or has no data rows." }]);
//           return;
//         }

//         const parseCSVLine = (line: string): string[] => {
//           const result: string[] = [];
//           let cur = "";
//           let inQuote = false;
//           for (let i = 0; i < line.length; i++) {
//             const ch = line[i];
//             if (ch === '"') {
//               if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
//               else inQuote = !inQuote;
//             } else if (ch === "," && !inQuote) {
//               result.push(cur); cur = "";
//             } else {
//               cur += ch;
//             }
//           }
//           result.push(cur);
//           return result;
//         };

//         const headers = parseCSVLine(lines[0]);
//         const rows: Record<string, string>[] = lines.slice(1).map((line) => {
//           const vals = parseCSVLine(line);
//           const obj: Record<string, string> = {};
//           headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? "").trim(); });
//           return obj;
//         });

//         resolve(validateFoodInfantRows(rows, headers));
//       } catch {
//         resolve([]);
//       }
//     };
//     reader.onerror = () => resolve([]);

//     const ext = file.name.split(".").pop()?.toLowerCase();
//     if (ext === "csv") {
//       reader.readAsText(file, "utf-8");
//     } else {
//       resolve([]);
//     }
//   });
// };




//   // ── FIX 4: Client-side cosmetics CSV validation before sending to API ────
//   const runClientSideCosmeticsValidation = async (file: File): Promise<ValidationError[]> => {
//     return new Promise((resolve) => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const text = e.target?.result as string;
//           const lines = text.split(/\r?\n/).filter((l) => l.trim());
//           if (lines.length < 2) {
//             resolve([{ rowNumber: 1, productName: "—", errorMessage: "File appears empty or has no data rows." }]);
//             return;
//           }

//           // Parse CSV (simple — handles quoted commas)
//           const parseCSVLine = (line: string): string[] => {
//             const result: string[] = [];
//             let cur = "";
//             let inQuote = false;
//             for (let i = 0; i < line.length; i++) {
//               const ch = line[i];
//               if (ch === '"') {
//                 if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
//                 else inQuote = !inQuote;
//               } else if (ch === "," && !inQuote) {
//                 result.push(cur); cur = "";
//               } else {
//                 cur += ch;
//               }
//             }
//             result.push(cur);
//             return result;
//           };

//           const headers = parseCSVLine(lines[0]);
//           const rows: Record<string, string>[] = lines.slice(1).map((line) => {
//             const vals = parseCSVLine(line);
//             const obj: Record<string, string> = {};
//             headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? "").trim(); });
//             return obj;
//           });

//           resolve(validateCosmeticsRows(rows, headers));
//         } catch {
//           resolve([]); // If we can't parse, let the server handle it
//         }
//       };
//       reader.onerror = () => resolve([]);

//       // Only CSV can be parsed in the browser; XLSX/XLS go straight to the server
//       const ext = file.name.split(".").pop()?.toLowerCase();
//       if (ext === "csv") {
//         reader.readAsText(file, "utf-8");
//       } else {
//         resolve([]); // xlsx/xls: skip client-side, rely on server
//       }
//     });
//   };

//   const parseUploadResponse = async (res: Response): Promise<UploadResult> => {
//     let body: any;
//     try { body = await res.json(); } catch {
//       throw new Error(`Server error (${res.status}): Could not parse response.`);
//     }

//     if (!res.ok) {
//       const msg =
//         body?.data?.message ??
//         body?.message ??
//         body?.error ??
//         `Server error (${res.status})`;
//       throw new Error(msg);
//     }

//     const data = body?.data ?? body;
//     if (data?.status === "ERROR") throw new Error(data.message ?? "Upload failed");

//     const successCount: number = data?.successCount ?? 0;
//     const failureCount: number = data?.failureCount ?? data?.errorCount ?? 0;
//     const totalRows: number = data?.totalRows ?? (successCount + failureCount);
//     const validationErrors: ValidationError[] = (data?.errors ?? []).map((e: any) => ({
//       rowNumber: e.rowNumber ?? e.row ?? "?",
//       productName: e.productName ?? e.product ?? "",
//       errorMessage: e.errorMessage ?? e.message ?? e.error ?? "Unknown error",
//     }));

//     if (totalRows === 0 && successCount === 0 && failureCount === 0 && validationErrors.length === 0) {
//       throw new Error(
//         "No product rows found in the file. Please ensure your file has at least one data row below the header, using our template."
//       );
//     }

//     return { success: successCount > 0, successCount, failureCount, totalRows, validationErrors };
//   };

//   const handleSubmit = async () => {
//     const readyFiles = files.filter((f) => f.status === "done");
//     if (!readyFiles.length || submitting) return;
//     setSubmitting(true); setSubmitError(null); setUploadResult(null); setFileFormatError(null);

//     const token = localStorage.getItem("token");
//     if (!token) {
//       setSubmitError("You are not authenticated. Please log in and try again.");
//       setSubmitting(false);
//       return;
//     }

//     const categoryId = getCategoryId(effectiveProductType);
//     let lastResult: UploadResult | null = null;

//     for (const uf of readyFiles) {
//       const key = fileKey(uf.file);
//       updateFile(key, { status: "uploading", progress: 0 });

//       try {
//         // ── FIX 5: Run client-side validation for cosmetics CSV before uploading
//         if (effectiveProductType === "cosmetics") {
//           updateFile(key, { progress: 10 });
//           const clientErrors = await runClientSideCosmeticsValidation(uf.file);
//           if (clientErrors.length > 0) {
//             const productName = clientErrors[0]?.productName ?? "—";
//             const failureCount = clientErrors.filter((e) => e.rowNumber !== 1).length;
//             const result: UploadResult = {
//               success: false,
//               successCount: 0,
//               failureCount: Math.max(failureCount, 1),
//               totalRows: Math.max(failureCount, 1),
//               validationErrors: clientErrors,
//             };
//             updateFile(key, {
//               status: "error",
//               error: `${clientErrors.length} validation error(s) found`,
//               progress: 100,
//             });
//             setUploadResult(result);
//             setSubmitting(false);
//             return;
//           }
//         } 

//         //Food and infant.......
//         else if (effectiveProductType === "food_infant") {
//         // ── Food & Infant validation block ──
//         updateFile(key, { progress: 10 });
//         const clientErrors = await runClientSideFoodInfantValidation(uf.file);
//         if (clientErrors.length > 0) {
//           const productName = clientErrors[0]?.productName ?? "—";
//           const failureCount = clientErrors.filter((e) => e.rowNumber !== 1).length;
//           const result: UploadResult = {
//             success: false,
//             successCount: 0,
//             failureCount: Math.max(failureCount, 1),
//             totalRows: Math.max(failureCount, 1),
//             validationErrors: clientErrors,
//           };
//           updateFile(key, {
//             status: "error",
//             error: `${clientErrors.length} validation error(s) found`,
//             progress: 100,
//           });
//           setUploadResult(result);
//           setSubmitting(false);
//           return;
//         }
//       }

//         for (let p = 15; p <= 80; p += 20) {
//           await new Promise((r) => setTimeout(r, 200));
//           updateFile(key, { progress: p });
//         }

//         const fd = new FormData();
//         fd.append("file", uf.file);
//         fd.append("categoryId", String(categoryId));

//         const res = await fetch(IMPORT_API_URL, {
//           method: "POST",
//           body: fd,
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const result = await parseUploadResponse(res);
//         lastResult = result;

//         if (result.validationErrors.length > 0) {
//           const errMsg = result.successCount > 0
//             ? `${result.failureCount} row(s) failed — see errors below`
//             : `All ${result.totalRows} row(s) failed validation`;
//           updateFile(key, { status: "error", error: errMsg, progress: 100 });
//           setUploadResult(result);
//         } else {
//           updateFile(key, { status: "done", progress: 100 });
//         }
//       } catch (err) {
//         const message = err instanceof Error ? err.message : "Upload failed";
//         updateFile(key, { status: "error", error: message });
//         setSubmitError(message);
//         lastResult = null;
//       }
//     }

//     await new Promise((r) => setTimeout(r, 250));
//     setSubmitting(false);

//     if (lastResult && lastResult.success && !lastResult.validationErrors.length) {
//       onSuccess(effectiveProductType, files, lastResult);
//     } else if (lastResult && lastResult.success && lastResult.validationErrors.length > 0) {
//       setUploadResult(lastResult);
//     }
//   };

//   const hasReadyFiles = files.some((f) => f.status === "done");
//   const template = TEMPLATES[effectiveProductType];

// const templateLabel =
//   effectiveProductType === "medical_devices_consumable"
//     ? "Medical Devices (Consumable) Template"
//     : effectiveProductType === "medical_devices_non_consumable"
//     ? "Medical Devices (Non-Consumable) Template"
//     : effectiveProductType === "cosmetics"
//     ? "Cosmetics & Personal Care Template"
//     : effectiveProductType === "supplements"
//     ? "Supplements & Nutraceuticals Template"
//     : effectiveProductType === "food_infant"
//     ? "Food & Infant Nutrition Template"
//     : "Drugs Template";


//   const renderCategories = () => {
//     const seen = new Set<string>();
//     const tiles: Array<{ id: number; name: string; displayName: string; selectable: boolean }> = [];
//     availableCategories.forEach((cat) => {
//       if (isMedDevCategory(cat.id)) {
//         if (!seen.has("medical_devices")) {
//           seen.add("medical_devices");
//           tiles.push({ id: cat.id, name: cat.name, displayName: "Medical Devices", selectable: true });
//         }
//       } else {
//         tiles.push({ id: cat.id, name: cat.name, displayName: cat.name, selectable: isSelectable(cat.id) });
//       }
//     });
//     return tiles;
//   };

//   return (
//     <div style={{ ...flex("col", 14) }}>
//       {/* Back */}
//       <button onClick={onBack} style={{ ...flex("row", 6, "center"), background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 14, fontWeight: 600, padding: 0, ...fontBase, alignSelf: "flex-start" }}>
//         <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
//           <path d="M19 12H5M12 5l-7 7 7 7" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
//         </svg>
//         Back
//       </button>

//       {/* Heading */}
//       <div style={{ ...flex("col", 3) }}>
//         <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", ...fontBase }}>Upload Excel / CSV</div>
//         <div style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>Download our template, fill in product data, and upload</div>
//       </div>

//       {/* Category grid */}
//       <div style={{ ...flex("col", 8) }}>
//         <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", ...fontBase }}>Select product category</div>
//         {loadingCategories ? (
//           <div style={{ ...flex("row", 8, "center") }}>
//             <span style={{ width: 14, height: 14, border: "2px solid #E5E7EB", borderTopColor: C.primary, borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }} />
//             <span style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>Loading categories...</span>
//           </div>
//         ) : (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
//             {renderCategories().map((cat) => {
//               const selected = isCategorySelected(cat.id);
//               return (
//                 <button
//                   key={cat.id}
//                   onClick={() => cat.selectable && handleCategorySelect(cat.id)}
//                   disabled={!cat.selectable}
//                   style={{
//                     padding: "8px 10px", borderRadius: 8,
//                     border: `1.5px solid ${selected ? C.primary : "#E5E7EB"}`,
//                     background: selected ? C.primaryLight : cat.selectable ? "#FAFAFA" : "#F9FAFB",
//                     color: selected ? C.primary : cat.selectable ? "#374151" : "#9CA3AF",
//                     fontWeight: selected ? 700 : 500,
//                     fontSize: 11,
//                     cursor: cat.selectable ? "pointer" : "default",
//                     textAlign: "left", ...fontBase,
//                     transition: "all 0.15s",
//                     ...flex("row", 5, "center"),
//                     lineHeight: 1.3,
//                   }}
//                 >
//                   {selected && (
//                     <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
//                       <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                   )}
//                   {cat.displayName}
//                 </button>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* Medical Devices Sub-Type Picker */}
//       {productType === "medical_devices_non_consumable" && (
//         <MedicalDeviceSubTypePicker
//           selected={medDevSubType}
//           onChange={(v) => {
//             setMedDevSubType(v);
//             setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null);
//           }}
//         />
//       )}

//       {/* Template download */}
//       {template && (
//         <div style={{ ...flex("row", 0, "center", "space-between"), padding: "10px 12px", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 10, gap: 10, flexWrap: "wrap" }}>
//           <div style={{ ...flex("col", 2), minWidth: 0 }}>
//             <div style={{ fontWeight: 600, color: "#5B21B6", fontSize: 12, ...fontBase }}>{templateLabel}</div>
//             <div style={{ color: "#6B7280", fontSize: 11, ...fontBase }}>Download and fill before uploading</div>
//           </div>
//           <div style={{ ...flex("row", 6, "center"), flexShrink: 0 }}>
//             {[
//               { href: template.csv, label: ".CSV" },
//               { href: template.xlsx, label: ".XLSX" },
//               { href: template.xls, label: ".XLS" },
//             ].map(({ href, label }) => (
//               <a
//                 key={label}
//                 href={href}
//                 download
//                 className="df-dl-btn"
//                 style={{ background: "#9F75FC", color: "white", borderRadius: 6, padding: "0 10px", height: 30, ...flex("row", 4, "center", "center"), fontSize: 11, fontWeight: 700, textDecoration: "none", border: "none", ...fontBase, transition: "all 0.2s", cursor: "pointer" }}
//               >
//                 <DownloadIcon color="white" />
//                 {label}
//               </a>
//             ))}
//           </div>
//         </div>
//       )}



//       {/* File format error */}
//       {fileFormatError && (
//         <div style={{ ...flex("row", 10, "center"), padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
//           <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
//             <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8" />
//             <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
//           </svg>
//           <span style={{ fontSize: 12, color: "#991B1B", flex: 1, ...fontBase }}>{fileFormatError}</span>
//           <button onClick={() => setFileFormatError(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
//             <XIcon size={12} color="#991B1B" />
//           </button>
//         </div>
//       )}

//       {/* Drop zone */}
//       <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: 8, ...flex("col", 8) }}>
//         <div
//           onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
//           onDragLeave={() => setDragging(false)}
//           onDrop={handleDrop}
//           onClick={() => inputRef.current?.click()}
//           style={{ background: dragging ? "#F5F3FF" : "#F9FAFB", border: `2px dashed ${dragging ? C.primary : "#A78BFA"}`, borderRadius: 8, padding: files.length ? "14px 16px" : "20px 16px", cursor: "pointer", ...flex("col", 10, "center", "center"), transition: "all 0.2s" }}
//         >
//           <input ref={inputRef} type="file" accept=".xlsx,.csv,.xls" multiple style={{ display: "none" }} onChange={handleFileInput} />
//           <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
//             <path d="M32.5075 15.6583L9.43565 16.5154C8.67212 16.5154 8.22691 16.8012 8.0166 17.5353L3.2273 33.9198C3.02929 34.6161 2.08003 34.9419 1.41968 34.9419C0.759773 34.9419 0.219727 34.4019 0.219727 33.742V29.1503V10.3386V9.43986V6.68562C0.219727 5.76227 0.968328 5.01367 1.89168 5.01367H13.771C14.2144 5.01367 14.6394 5.18974 14.9529 5.50323L18.3995 8.94987C18.713 9.26336 19.1385 9.43942 19.5815 9.43942H30.8356C31.7589 9.43942 32.5075 10.188 32.5075 11.1114V11.6826V15.6583Z" fill="#E0AD31" />
//             <path d="M1.41968 34.9419C2.07959 34.9419 2.42162 34.4383 2.61964 33.7419L7.44757 16.8986C7.65788 16.1645 8.3292 15.6587 9.09317 15.6587H38.6768C39.3832 15.6587 39.8908 16.3375 39.6914 17.0154L34.9074 33.2721C34.6914 34.0409 34.2176 34.9485 33.2377 34.9419H1.41968Z" fill="#FFC843" />
//           </svg>
//           <div style={{ textAlign: "center" }}>
//             <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 2, ...fontBase }}>
//               {dragging ? "Drop files here!" : "Drag & drop your Excel / CSV"}
//             </div>
//             <div style={{ fontSize: 10, color: "#9CA3AF", ...fontBase }}>or click to browse · .xlsx · .csv · .xls · Max 10MB</div>
//           </div>
//         </div>

//         {files.length > 0 && (
//           <div style={{ ...flex("col", 6) }}>
//             <div style={{ ...flex("row", 0, "center", "space-between") }}>
//               <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", ...fontBase }}>Files ({files.length})</span>
//               {files.every((f) => f.status === "done" || f.status === "error") && (
//                 <button onClick={() => { setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null); }} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer", ...fontBase }}>
//                   Clear all
//                 </button>
//               )}
//             </div>
//             {files.map((uf, i) => (
//               <FileRow key={`${uf.file.name}-${i}`} uf={uf} index={i} onRemove={removeFile} submitting={submitting} />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Validation error panel */}
//       {uploadResult && uploadResult.validationErrors.length > 0 && (
//         <ValidationErrorPanel
//           errors={uploadResult.validationErrors}
//           successCount={uploadResult.successCount}
//           failureCount={uploadResult.failureCount}
//           totalRows={uploadResult.totalRows}
//           onDownload={() => downloadErrorReport(uploadResult.validationErrors)}
//           onDismiss={() => setUploadResult(null)}
//         />
//       )}

//       {/* Generic submit error */}
//       {submitError && (
//         <div style={{ ...flex("row", 10, "center"), padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
//           <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
//             <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8" />
//             <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
//           </svg>
//           <span style={{ fontSize: 12, color: "#991B1B", flex: 1, ...fontBase }}>{submitError}</span>
//           <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
//             <XIcon size={12} color="#991B1B" />
//           </button>
//         </div>
//       )}

//       {/* Upload button */}
//       <button
//         onClick={handleSubmit}
//         disabled={!hasReadyFiles || submitting}
//         style={{ width: "100%", height: 46, borderRadius: 10, border: "none", background: hasReadyFiles && !submitting ? "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)" : "#F3F4F6", cursor: hasReadyFiles && !submitting ? "pointer" : "not-allowed", ...flex("row", 10, "center", "center"), ...fontBase, boxShadow: hasReadyFiles && !submitting ? "0 4px 14px rgba(76,29,149,0.3)" : "none", transition: "all 0.2s" }}
//       >
//         <span style={{ color: hasReadyFiles && !submitting ? "white" : "#9CA3AF", fontWeight: 700, fontSize: 14, ...fontBase, ...flex("row", 8, "center") }}>
//           {submitting ? (
//             <>
//               <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }} />
//               Processing...
//             </>
//           ) : (
//             <>
//               <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
//                 <path d="M12 3v12m0 0l-3-3m3 3l3-3M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//               Upload {files.length > 1 ? "Files" : "File"}
//             </>
//           )}
//         </span>
//       </button>

//       <div style={{ ...flex("row", 6, "center"), justifyContent: "center" }}>
//         <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
//           <circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="1.5" />
//           <path d="M12 8v4M12 16h.01" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
//         </svg>
//         <span style={{ fontSize: 10, color: "#9CA3AF", ...fontBase }}>
//           Ensure your file follows the template format · Max 10MB per file
//         </span>
//       </div>
//     </div>
//   );
// }

// // ─── SuccessView ──────────────────────────────────────────────────────────────
// function SuccessView({ files, result, onClose }: {
//   productType: ProductType;
//   files: UploadedFile[];
//   result: UploadResult;
//   onReset: () => void;
//   onClose?: () => void;
// }) {
//   const fileName = files?.[0]?.file?.name ?? "product_template.xlsx";
//   return (
//     <div style={{ ...flex("col", 20, "center"), padding: "32px 24px", position: "relative" }}>
//       {onClose && (
//         <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, background: "none", border: "1.5px solid #1E1E1D", borderRadius: "50%", cursor: "pointer", ...flex("row", 0, "center", "center"), padding: 0 }}>
//           <XIcon size={12} color="#1E1E1D" strokeWidth={2.5} />
//         </button>
//       )}
//       <div style={{ padding: 20, background: "#DCF7CB", borderRadius: "50%", border: "1px solid #4EB300", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
//         <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
//           <path d="M5 13l4 4L19 7" stroke="#378200" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
//         </svg>
//       </div>
//       <div style={{ ...flex("col", 10, "center"), width: "100%" }}>
//         <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", ...fontBase, textAlign: "center" }}>
//           Products Added Successfully!
//         </div>
//         <div style={{ fontSize: 13, color: "#374151", ...fontBase, textAlign: "center" }}>
//           <strong style={{ color: "#166534" }}>{result.successCount} product{result.successCount !== 1 ? "s" : ""}</strong> from <em>{fileName}</em> {result.successCount !== 1 ? "have" : "has"} been added to your catalogue.
//         </div>
//       </div>
//       <div style={{ ...flex("row", 12, "center", "center"), width: "100%" }}>
//         <div style={{ flex: 1, background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", ...flex("col", 4, "center") }}>
//           <span style={{ fontSize: 22, fontWeight: 800, color: "#166534", ...fontBase }}>{result.successCount}</span>
//           <span style={{ fontSize: 11, color: "#166534", fontWeight: 600, ...fontBase }}>Products Added</span>
//         </div>
//         <div style={{ flex: 1, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", ...flex("col", 4, "center") }}>
//           <span style={{ fontSize: 22, fontWeight: 800, color: "#15803D", ...fontBase }}>{result.totalRows}</span>
//           <span style={{ fontSize: 11, color: "#15803D", fontWeight: 600, ...fontBase }}>Total Rows</span>
//         </div>
//       </div>
//       <div style={{ background: "#DCF7CB", border: "1px solid #4EB300", borderRadius: 8, padding: "10px 16px", width: "100%", textAlign: "center" }}>
//         <span style={{ fontSize: 12, color: "#378200", ...fontBase }}>
//           Products are now live in your catalogue. Processing usually takes 2–5 minutes.
//         </span>
//       </div>
//       {onClose && (
//         <button
//           onClick={onClose}
//           style={{ width: "100%", height: 44, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)", cursor: "pointer", ...flex("row", 0, "center", "center"), ...fontBase, boxShadow: "0 4px 14px rgba(76,29,149,0.3)", color: "white", fontWeight: 700, fontSize: 14 }}
//         >
//           View My Products
//         </button>
//       )}
//     </div>
//   );
// }

// // ─── OnboardingModal ──────────────────────────────────────────────────────────
// function OnboardingModal({ onClose, onManualEntry }: { onClose: () => void; onManualEntry: () => void }) {
//   const [successData, setSuccessData] = useState<{ type: ProductType; files: UploadedFile[]; result: UploadResult } | null>(null);
//   const [hovered, setHovered] = useState<string | null>(null);
//   const [transitioning, setTransitioning] = useState(false);
//   const [displayView, setDisplayView] = useState<ModalView>("methods");
//   const [slideDir, setSlideDir] = useState<"left" | "right">("left");
//   const [contentVisible, setContentVisible] = useState(true);

//   const changeView = (next: ModalView, dir: "left" | "right") => {
//     if (transitioning) return;
//     setTransitioning(true); setSlideDir(dir); setContentVisible(false);
//     setTimeout(() => {
//       setDisplayView(next);
//       setTimeout(() => { setContentVisible(true); setTransitioning(false); }, 30);
//     }, 180);
//   };

//   useEffect(() => {
//     const id = "df-open-sans-font";
//     if (!document.getElementById(id)) {
//       const link = Object.assign(document.createElement("link"), {
//         id, rel: "stylesheet",
//         href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap",
//       });
//       document.head.appendChild(link);
//     }
//   }, []);

//   useEffect(() => {
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = "hidden";
//     return () => { document.body.style.overflow = prev; };
//   }, []);

//   const isSuccess = displayView === "success";
//   const slideX = slideDir === "left" ? "-22px" : "22px";

//   return (
//     <>
//       <style>{`
//         @keyframes dfModalIn {
//           from { opacity: 0; transform: translate(-50%, calc(-50% + 18px)) scale(0.96); }
//           to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
//         }
//         @keyframes dfSpin { to { transform: rotate(360deg); } }
//         .df-card { transition: box-shadow 0.14s, transform 0.14s, border-color 0.14s !important; }
//         .df-card:hover { transform: translateY(-1px) !important; box-shadow: 0 6px 18px rgba(0,0,0,0.09) !important; }
//         .df-modal-root, .df-modal-root * { font-family: 'Open Sans', sans-serif !important; -webkit-font-smoothing: antialiased; }
//         .df-dl-btn { transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease !important; }
//         .df-dl-btn:hover { background: #C4A4FD !important; transform: translateY(-1px) !important; }
//         .df-modal-scroll::-webkit-scrollbar { width: 4px; }
//         .df-modal-scroll::-webkit-scrollbar-track { background: transparent; }
//         .df-modal-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
//       `}</style>

//       {/* Backdrop */}
//       <div
//         onClick={displayView === "methods" ? onClose : undefined}
//         style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", cursor: displayView === "methods" ? "pointer" : "default" }}
//       />

//       {/* Close button */}
//       {displayView === "methods" && (
//         <button onClick={onClose} style={{ position: "fixed", top: 12, right: 12, zIndex: 1002, background: "none", border: "none", padding: 0, cursor: "pointer", ...flex("row", 0, "center", "center") }}>
//           <div style={{ width: 36, height: 36, background: "white", borderRadius: 8, ...flex("row", 0, "center", "center") }}>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//               <path fillRule="evenodd" clipRule="evenodd" d="M12 3.75C9.81196 3.75 7.71354 4.61919 6.16637 6.16637C4.61919 7.71354 3.75 9.81196 3.75 12C3.75 13.0834 3.96339 14.1562 4.37799 15.1571C4.79259 16.1581 5.40029 17.0675 6.16637 17.8336C6.93245 18.5997 7.84193 19.2074 8.84286 19.622C9.8438 20.0366 10.9166 20.25 12 20.25C13.0834 20.25 14.1562 20.0366 15.1571 19.622C16.1581 19.2074 17.0675 18.5997 17.8336 17.8336C18.5997 17.0675 19.2074 16.1581 19.622 15.1571C20.0366 14.1562 20.25 13.0834 20.25 12C20.25 9.81196 19.3808 7.71354 17.8336 6.16637C16.2865 4.61919 14.188 3.75 12 3.75ZM5.10571 5.10571C6.93419 3.27723 9.41414 2.25 12 2.25C14.5859 2.25 17.0658 3.27723 18.8943 5.10571C20.7228 6.93419 21.75 9.41414 21.75 12C21.75 13.2804 21.4978 14.5482 21.0078 15.7312C20.5178 16.9141 19.7997 17.9889 18.8943 18.8943C17.9889 19.7997 16.9141 20.5178 15.7312 21.0078C14.5482 21.4978 13.2804 21.75 12 21.75C10.7196 21.75 9.45176 21.4978 8.26884 21.0078C7.08591 20.5178 6.01108 19.7997 5.10571 18.8943C4.20034 17.9889 3.48216 16.9141 2.99217 15.7312C2.50219 14.5482 2.25 13.2804 2.25 12C2.25 9.41414 3.27723 6.93419 5.10571 5.10571ZM9.21967 9.21967C9.51256 8.92678 9.98744 8.92678 10.2803 9.21967L12 10.9393L13.7197 9.21967C14.0126 8.92678 14.4874 8.92678 14.7803 9.21967C15.0732 9.51256 15.0732 9.98744 14.7803 10.2803L13.0607 12L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L12 13.0607L10.2803 14.7803C9.98744 15.0732 9.51256 15.0732 9.21967 14.7803C8.92678 14.4874 8.92678 14.0126 9.21967 13.7197L10.9393 12L9.21967 10.2803C8.92678 9.98744 8.92678 9.51256 9.21967 9.21967Z" fill="#111827" />
//             </svg>
//           </div>
//         </button>
//       )}

//       {/* Modal */}
//       <div
//         className="df-modal-root"
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           position: "fixed", top: "50%", left: "50%",
//           transform: "translate(-50%, -50%)",
//           zIndex: 1000,
//           width: "90vw", maxWidth: 460,
//           height: "auto",
//           maxHeight: "92vh",
//           background: "white",
//           borderRadius: 20,
//           boxShadow: "0 24px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.05)",
//           animation: "dfModalIn 0.28s cubic-bezier(0.22,1,0.36,1) forwards",
//           fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
//           display: "flex", flexDirection: "column",
//           overflow: "hidden",
//         }}
//       >
//         <div
//           className="df-modal-scroll"
//           style={{ flex: 1, overflowY: "auto", padding: isSuccess ? "0" : "22px" }}
//         >
//           <div style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : `translateX(${slideX})`, transition: contentVisible ? "opacity 0.2s, transform 0.2s" : "opacity 0.17s, transform 0.17s" }}>

//             {/* Methods view */}
//             {displayView === "methods" && (
//               <>
//                 <div style={{ marginBottom: 16, ...flex("col", 4) }}>
//                   <div style={{ fontSize: 19, fontWeight: 700, color: "#111827", ...fontBase }}>How would you like to add products?</div>
//                   <div style={{ fontSize: 13, color: "#6B7280", ...fontBase }}>Choose the method that fits your workflow.</div>
//                 </div>
//                 <div style={{ ...flex("col", 8) }}>
//                   {METHODS.map((m) => (
//                     <button
//                       key={m.id}
//                       className="df-card"
//                       onMouseEnter={() => m.ready && setHovered(m.id)}
//                       onMouseLeave={() => setHovered(null)}
//                       onClick={() => {
//                         if (!m.ready) return;
//                         if (m.id === "manual") { onManualEntry(); return; }
//                         if (m.id === "excel") changeView("excel", "left");
//                         if (m.id === "api") changeView("api", "left");
//                       }}
//                       style={{ ...flex("row", 12, "center"), padding: "14px 16px", borderRadius: 14, border: `1px solid ${hovered === m.id ? "#D1D5DB" : "#E5E7EB"}`, background: hovered === m.id ? "#FAFAFA" : "white", cursor: m.ready ? "pointer" : "default", textAlign: "left", width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", opacity: m.ready ? 1 : 0.55 }}
//                     >
//                       <div style={{ width: 40, height: 40, borderRadius: 8, background: m.bg, border: "1px solid #E5E7EB", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
//                         {m.icon}
//                       </div>
//                       <div style={{ flex: 1 }}>
//                         <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 2, ...fontBase }}>{m.label}</div>
//                         <div style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>{m.desc}</div>
//                       </div>
//                       {m.ready ? (
//                         <div style={{ ...flex("row", 5, "center"), fontSize: 13, fontWeight: 600, color: m.accent, whiteSpace: "nowrap", flexShrink: 0, ...fontBase }}>
//                           Get Started
//                           <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
//                             <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
//                           </svg>
//                         </div>
//                       ) : (
//                         <div style={{ fontSize: 11, color: "#9CA3AF", ...fontBase, flexShrink: 0 }}>Soon</div>
//                       )}
//                     </button>
//                   ))}
//                 </div>
//               </>
//             )}

//             {/* Excel view */}
//             {displayView === "excel" && (
//               <ExcelUploadView
//                 onBack={() => changeView("methods", "right")}
//                 onSuccess={(type, files, result) => { setSuccessData({ type, files, result }); changeView("success", "left"); }}
//               />
//             )}

//             {/* Success view */}
//             {displayView === "success" && successData && (
//               <SuccessView
//                 productType={successData.type}
//                 files={successData.files}
//                 result={successData.result}
//                 onReset={() => { setSuccessData(null); changeView("excel", "right"); }}
//                 onClose={onClose}
//               />
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// // ─── DashboardFilters ─────────────────────────────────────────────────────────
// const DashboardFilters = ({ setCurrentView }: DashboardFiltersProps) => {
//   const router = useRouter();
//   const [showModal, setShowModal] = useState(false);

//   return (
//     <>
//       <div className="flex flex-wrap items-center gap-4">
//         <select className="h-11 w-50 px-4 rounded-md border border-neutral-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-50">
//           <option>All Stocks</option>
//           <option>Low Stock</option>
//           <option>Out of Stock</option>
//         </select>
//         <select className="h-11 w-50 px-4 rounded-md border border-neutral-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-50">
//           <option>All Categories</option>
//           <option>Drugs</option>
//           <option>Vitamins</option>
//           <option>Diabetes</option>
//         </select>
//         <button
//           onClick={() => setShowModal(true)}
//           className="h-11 w-50 flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-800 text-white rounded-md shadow-md transition"
//         >
//           <Plus size={18} /> Add New Product
//         </button>
//       </div>
//       {showModal && (
//         <OnboardingModal
//           onClose={() => setShowModal(false)}
//           onManualEntry={() => {
//             setShowModal(false);
//             router.push("/seller_7a3b9f2c/products/add");
//           }}
//         />
//       )}
//     </>
//   );
// };

// export default DashboardFilters;











// This code is without food infant view excel upload , dated 18.05.2026...................

// "use client";
// import { useRouter } from "next/navigation";
// import React, { useRef, useState, useEffect, useCallback } from "react";
// import { Plus } from "lucide-react";
// import { DashboardView } from "@/src/types/seller/dashboard";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface DashboardFiltersProps {
//   setCurrentView: (view: DashboardView) => void;
// }

// type ModalView   = "methods" | "excel" | "api" | "success";
// type ProductType = "drugs" | "medical_devices_non_consumable" | "medical_devices_consumable" | "cosmetics";
// type MedicalDeviceSubType = "consumable" | "non_consumable";

// interface UploadedFile {
//   file:      File;
//   status:    "pending" | "uploading" | "done" | "error";
//   error?:    string;
//   progress?: number;
// }

// interface ValidationError {
//   rowNumber:    number;
//   productName:  string;
//   errorMessage: string;
// }

// interface UploadResult {
//   success:          boolean;
//   successCount:     number;
//   failureCount:     number;
//   totalRows:        number;
//   validationErrors: ValidationError[];
//   message?:         string;
// }

// // ─── Constants ────────────────────────────────────────────────────────────────
// const IMPORT_API_URL = "https://api-test-aggreator.tiameds.ai/api/v1/products/import";

// const C = {
//   primary:      "#4C1D95",
//   primaryLight: "#EDE9FE",
//   green:        "#4EB300",
//   greenDark:    "#378200",
//   greenLight:   "#DCF7CB",
// } as const;

// const METHODS = [
//   {
//     id: "manual", ready: true, accent: C.primary, bg: C.primaryLight,
//     label: "Manual Entry", desc: "Fill the product details using the form",
//     icon: (
//       <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
//         <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//         <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     ),
//   },
//   {
//     id: "excel", ready: true, accent: C.greenDark, bg: "#DCFCE7",
//     label: "Excel / CSV", desc: "Bulk upload via spreadsheet",
//     icon: (
//       <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
//         <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//         <polyline points="14,2 14,8 20,8" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//         <line x1="8" y1="13" x2="16" y2="13" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round"/>
//         <line x1="8" y1="17" x2="16" y2="17" stroke={C.greenDark} strokeWidth="2" strokeLinecap="round"/>
//       </svg>
//     ),
//   },
//   {
//     id: "api", ready: false, accent: "#D97706", bg: "#FEF3C7",
//     label: "API Integration", desc: "Connect via REST API",
//     icon: (
//       <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
//         <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 4l-4 16" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     ),
//   },
//   {
//     id: "db", ready: false, accent: "#CA8A04", bg: "#FEFCE8",
//     label: "Database Sync", desc: "Sync directly from your database",
//     icon: (
//       <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
//         <ellipse cx="12" cy="6" rx="8" ry="3" stroke="#CA8A04" strokeWidth="2"/>
//         <path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="#CA8A04" strokeWidth="2"/>
//         <path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" stroke="#CA8A04" strokeWidth="2"/>
//       </svg>
//     ),
//   },
// ];

// const PROGRESS_STEPS = [10, 25, 40, 55, 70, 85, 100];

// const TEMPLATES: Record<ProductType, { name: string; xlsx: string; csv: string; xls: string }> = {
//   drugs: {
//     name: "drug_products_template",
//     xlsx: "/templates/drugs/XLSX-Drugs Template.xlsx",
//     csv:  "/templates/drugs/CSV-Drugs Template.csv",
//     xls:  "/templates/drugs/XLS-Drugs Template.xls",
//   },
//   medical_devices_non_consumable: {
//     name: "medical_devices_non_consumable_template",
//     xlsx: "/templates/medical-devices/nonconsumable/XLSX-Non Consumable Template.xlsx",
//     csv:  "/templates/medical-devices/nonconsumable/CSV-Non Consumable Template.csv",
//     xls:  "/templates/medical-devices/nonconsumable/XLS-Non Consumable Template.xls",
//   },
//   medical_devices_consumable: {
//     name: "medical_devices_consumable_template",
//     xlsx: "/templates/medical-devices/consumable/XLSX-Consumable Template.xlsx",
//     csv:  "/templates/medical-devices/consumable/CSV-Consumable Template.csv",
//     xls:  "/templates/medical-devices/consumable/XLS-Consumable Template.xls",
//   },
//   cosmetics: {
//     name: "cosmetics_template",
//     xlsx: "/templates/cosmetics/XLSX-Cosmetics Template.xlsx",
//     csv:  "/templates/cosmetics/CSV-Cosmetics Template.csv",
//     xls:  "/templates/cosmetics/XLS-Cosmetics Template.xls",
//   },
// };

// // categoryId mapping (confirmed via Postman):
// //   Drugs                            → 1
// //   Medical Devices (Consumable)     → 5
// //   Medical Devices (Non-Consumable) → 6
// //   Cosmetics                        → 4
// const MEDICAL_DEVICE_CONSUMABLE_IDS     = [5];
// const MEDICAL_DEVICE_NON_CONSUMABLE_IDS = [6];
// const COSMETICS_IDS                     = [4];

// const getCategoryId = (productType: ProductType): number => {
//   if (productType === "medical_devices_consumable")     return 5;
//   if (productType === "medical_devices_non_consumable") return 6;
//   if (productType === "cosmetics")                      return 4;
//   return 1; // drugs
// };

// // ─── Cosmetics required columns (from template) ───────────────────────────────
// // Starred (*) fields in the template are mandatory.
// const COSMETICS_REQUIRED_COLUMNS = [
//   "Product Category*",
//   "Product Sub Category*",
//   "Product Name*",
//   "Brand Name*",
//   "Net Quantity*",
//   "Active Ingredients*",
//   "Gender*",
//   "Age Group*",
//   "Product Claims*",
//   "Warnings / Precautions*",
//   "Product Description*",
//   "Storage Condition*",
//   "Manufacturer Name*",
//   "Country of Origin*",
//   "Certifications / Compliance*",
//   "Minimum Order Qty*",
//   "Max Order Qty*",
//   "Batch Number*",
//   "Manufacturing Date*",
//   "Expiry Date*",
//   "Stock Quantity*",
//   "MRP (INR)*",
//   "Selling Price(INR)*",
//   "GST %",
//   "HSN Code*",
//   "Intended Use Area*",
// ];

// // Friendly name map for cosmetics columns (strips asterisk for display)
// const COSMETICS_FIELD_LABELS: Record<string, string> = {
//   "Product Category*":           "Product Category",
//   "Product Sub Category*":       "Product Sub Category",
//   "Product Name*":               "Product Name",
//   "Brand Name*":                 "Brand Name",
//   "Net Quantity*":               "Net Quantity",
//   "Active Ingredients*":         "Active Ingredients",
//   "Gender*":                     "Gender",
//   "Age Group*":                  "Age Group",
//   "Product Claims*":             "Product Claims",
//   "Warnings / Precautions*":     "Warnings / Precautions",
//   "Product Description*":        "Product Description",
//   "Storage Condition*":          "Storage Condition",
//   "Manufacturer Name*":          "Manufacturer Name",
//   "Country of Origin*":          "Country of Origin",
//   "Certifications / Compliance*":"Certifications / Compliance",
//   "Minimum Order Qty*":          "Minimum Order Qty",
//   "Max Order Qty*":              "Max Order Qty",
//   "Batch Number*":               "Batch Number",
//   "Manufacturing Date*":         "Manufacturing Date",
//   "Expiry Date*":                "Expiry Date",
//   "Stock Quantity*":             "Stock Quantity",
//   "MRP (INR)*":                  "MRP (INR)",
//   "Selling Price(INR)*":         "Selling Price (INR)",
//   "GST %":                       "GST %",
//   "HSN Code*":                   "HSN Code",
//   "Intended Use Area*":          "Intended Use Area",
// };

// /**
//  * Client-side validation for cosmetics CSV/XLSX rows.
//  * Returns an array of ValidationError objects (empty = all good).
//  */
// function validateCosmeticsRows(
//   rows: Record<string, string>[],
//   headers: string[]
// ): ValidationError[] {
//   const errors: ValidationError[] = [];

//   // Check that all required columns are present in the file at all
//   const missingCols = COSMETICS_REQUIRED_COLUMNS.filter(
//     (col) => !headers.some((h) => h.trim() === col.trim())
//   );

//   rows.forEach((row, idx) => {
//     const rowNumber  = idx + 2; // 1-indexed, row 1 = header
//     const productName = (
//       row["Product Name*"] ?? row["Product Name"] ?? ""
//     ).trim();

//     // Per-column missing-value checks
//     const missingFields: string[] = [];

//     for (const col of COSMETICS_REQUIRED_COLUMNS) {
//       // Skip columns that aren't even in the file (already flagged above)
//       if (missingCols.includes(col)) continue;

//       // Find the actual key (headers may or may not have the asterisk in data)
//       const key = headers.find((h) => h.trim() === col.trim()) ?? col;
//       const val = (row[key] ?? "").toString().trim();

//       if (!val) {
//         missingFields.push(COSMETICS_FIELD_LABELS[col] ?? col.replace("*", ""));
//       }
//     }

//     // Numeric range checks
//     const mrp          = parseFloat(row["MRP (INR)*"]          ?? row["MRP (INR)"]          ?? "");
//     const sellingPrice = parseFloat(row["Selling Price(INR)*"] ?? row["Selling Price(INR)"] ?? "");
//     const minQty       = parseInt(row["Minimum Order Qty*"]    ?? row["Minimum Order Qty"]    ?? "", 10);
//     const maxQty       = parseInt(row["Max Order Qty*"]        ?? row["Max Order Qty"]        ?? "", 10);
//     const stockQty     = parseInt(row["Stock Quantity*"]       ?? row["Stock Quantity"]       ?? "", 10);

//     if (!isNaN(mrp) && !isNaN(sellingPrice) && sellingPrice > mrp) {
//       errors.push({ rowNumber, productName, errorMessage: "Selling Price cannot exceed MRP." });
//     }
//     if (!isNaN(minQty) && !isNaN(maxQty) && minQty > maxQty) {
//       errors.push({ rowNumber, productName, errorMessage: "Minimum Order Qty cannot exceed Max Order Qty." });
//     }
//     if (!isNaN(stockQty) && stockQty < 0) {
//       errors.push({ rowNumber, productName, errorMessage: "Stock Quantity must be 0 or greater." });
//     }

//     // Date checks: Manufacturing Date must be before Expiry Date
//     const mfgRaw = (row["Manufacturing Date*"] ?? row["Manufacturing Date"] ?? "").trim();
//     const expRaw = (row["Expiry Date*"]         ?? row["Expiry Date"]         ?? "").trim();
//     if (mfgRaw && expRaw) {
//       const mfgDate = new Date(mfgRaw);
//       const expDate = new Date(expRaw);
//       if (!isNaN(mfgDate.getTime()) && !isNaN(expDate.getTime()) && mfgDate >= expDate) {
//         errors.push({ rowNumber, productName, errorMessage: "Manufacturing Date must be before Expiry Date." });
//       }
//     }

//     // Discount % sanity (optional field)
//     const discountRaw = (row["Discount %"] ?? "").trim();
//     if (discountRaw) {
//       const discount = parseFloat(discountRaw);
//       if (!isNaN(discount) && (discount < 0 || discount > 100)) {
//         errors.push({ rowNumber, productName, errorMessage: "Discount % must be between 0 and 100." });
//       }
//     }

//     if (missingFields.length > 0) {
//       errors.push({
//         rowNumber,
//         productName,
//         errorMessage: `Missing required field(s): ${missingFields.join(", ")}.`,
//       });
//     }
//   });

//   // If structural columns are missing, add a single top-level error (row 1)
//   if (missingCols.length > 0) {
//     errors.unshift({
//       rowNumber:    1,
//       productName:  "—",
//       errorMessage: `Template columns missing: ${missingCols.map((c) => c.replace("*", "")).join(", ")}. Please use the official Cosmetics template.`,
//     });
//   }

//   return errors;
// }

// const fileKey = (f: File) => `${f.name}-${f.size}`;

// // ─── Shared Styles ────────────────────────────────────────────────────────────
// const fontBase: React.CSSProperties = { fontFamily: "'Open Sans', sans-serif" };

// const flex = (
//   dir: "row" | "col",
//   gap?: number,
//   align?: string,
//   justify?: string,
// ): React.CSSProperties => ({
//   display: "flex",
//   flexDirection: dir === "col" ? "column" : "row",
//   ...(gap     ? { gap }                     : {}),
//   ...(align   ? { alignItems: align }       : {}),
//   ...(justify ? { justifyContent: justify } : {}),
// });

// const XIcon = ({ size = 24, color = "#111827", strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) => (
//   <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
//     <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
//   </svg>
// );

// const DownloadIcon = ({ color }: { color: string }) => (
//   <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
//     <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" fill={color}/>
//     <path d="M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
//   </svg>
// );

// function FileIcon({ ext = "XLSX" }: { ext?: string }) {
//   return (
//     <div style={{ position: "relative", width: 44, height: 52, flexShrink: 0 }}>
//       <div style={{ width: 44, height: 52, borderRadius: 6, background: "#F9FAFB", border: "1px solid #E5E7EB", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
//         <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 12px 12px 0", borderColor: "transparent #E5E7EB transparent transparent" }}/>
//         {[16, 22, 28].map((top) => (
//           <div key={top} style={{ position: "absolute", top, left: 6, right: top === 28 ? 12 : 8, height: 2, background: "#E5E7EB", borderRadius: 1 }}/>
//         ))}
//         <div style={{ position: "absolute", bottom: 0, left: 0, background: "#16A34A", borderRadius: "0 4px 0 4px", padding: "2px 4px" }}>
//           <span style={{ fontSize: 7, fontWeight: 800, color: "white", letterSpacing: 0.3, lineHeight: 1, fontFamily: "monospace" }}>
//             {ext.slice(0, 4)}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// function FileRow({ uf, index, onRemove, submitting }: {
//   uf: UploadedFile; index: number; onRemove: (i: number) => void; submitting: boolean;
// }) {
//   const fileSizeKB  = Math.max(1, Math.round(uf.file.size / 1024));
//   const ext         = (uf.file.name.split(".").pop() ?? "xlsx").toUpperCase();
//   const isUploading = uf.status === "uploading";
//   const isDone      = uf.status === "done";
//   const isError     = uf.status === "error";

//   const sizeLabel = isUploading
//     ? `${fileSizeKB} KB of ${fileSizeKB * 2} KB •`
//     : isDone
//     ? `${fileSizeKB} KB of ${fileSizeKB} KB •`
//     : `${fileSizeKB} KB •`;

//   return (
//     <div style={{ background: isError ? "#FEF2F2" : "#F3F4F6", borderRadius: 8, padding: 8, ...flex("col", 6), border: isError ? "1px solid #FECACA" : "none" }}>
//       <div style={{ ...flex("row", 0, "flex-start", "space-between") }}>
//         <div style={{ ...flex("row", 12, "center"), flex: 1, minWidth: 0 }}>
//           <FileIcon ext={ext} />
//           <div style={{ ...flex("col", 6), minWidth: 0 }}>
//             <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fontBase, lineHeight: "16px" }}>
//               {uf.file.name}
//             </div>
//             <div style={{ ...flex("row", 4, "center"), fontSize: 10, ...fontBase }}>
//               <span style={{ color: "#6B7280" }}>{sizeLabel}</span>
//               {isUploading && (
//                 <span style={{ ...flex("row", 3, "center"), color: "#374151" }}>
//                   <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #D1FAE5", borderTopColor: "#16A34A", display: "inline-block", flexShrink: 0, animation: "dfSpin 0.65s linear infinite" }}/>
//                   <span style={{ color: "#111827", fontSize: 10 }}>Uploading...</span>
//                 </span>
//               )}
//               {isDone && (
//                 <span style={{ ...flex("row", 4, "center") }}>
//                   <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#16A34A", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
//                     <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
//                       <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//                     </svg>
//                   </span>
//                   <span style={{ color: "#111827", fontWeight: 600, fontSize: 10 }}>Completed</span>
//                 </span>
//               )}
//               {isError && (
//                 <span style={{ ...flex("row", 4, "center") }}>
//                   <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#DC2626", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
//                     <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
//                       <path d="M3 3l4 4M7 3L3 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
//                     </svg>
//                   </span>
//                   <span style={{ color: "#DC2626", fontWeight: 600, fontSize: 10 }}>{uf.error ?? "Upload failed"}</span>
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>
//         <button
//           onClick={() => !submitting && onRemove(index)}
//           style={{ background: "none", border: "none", padding: "2px 4px", cursor: submitting ? "default" : "pointer", ...flex("row", 0, "center", "center"), flexShrink: 0, marginLeft: 8, opacity: submitting ? 0.3 : 1 }}
//         >
//           <XIcon size={14} color="#9CA3AF" strokeWidth={2} />
//         </button>
//       </div>
//       {isUploading && (
//         <div style={{ height: 6, background: "#EDE9FE", borderRadius: 99, overflow: "hidden", marginTop: 2 }}>
//           <div style={{ height: "100%", background: "#7C3AED", borderRadius: 99, width: `${uf.progress ?? 0}%`, transition: "width 0.3s ease" }}/>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── MedicalDeviceSubTypePicker ───────────────────────────────────────────────
// function MedicalDeviceSubTypePicker({
//   selected,
//   onChange,
// }: {
//   selected: MedicalDeviceSubType;
//   onChange: (v: MedicalDeviceSubType) => void;
// }) {
//   return (
//     <div style={{ ...flex("col", 8) }}>
//       <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", ...fontBase }}>
//         Select device type
//       </div>
//       <div style={{ ...flex("row", 10) }}>
//         <button
//           onClick={() => onChange("consumable")}
//           style={{
//             flex: 1, padding: "10px 12px", borderRadius: 10,
//             border: `1.5px solid ${selected === "consumable" ? C.primary : "#E5E7EB"}`,
//             background: selected === "consumable" ? C.primaryLight : "#FAFAFA",
//             color: selected === "consumable" ? C.primary : "#374151",
//             fontWeight: selected === "consumable" ? 700 : 500,
//             fontSize: 12, cursor: "pointer", textAlign: "left", ...fontBase,
//             transition: "all 0.15s", ...flex("col", 3),
//           }}
//         >
//           <div style={{ ...flex("row", 6, "center") }}>
//             {selected === "consumable" && (
//               <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
//                 <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//               </svg>
//             )}
//             <span>Consumable</span>
//           </div>
//           <span style={{ fontSize: 10, color: selected === "consumable" ? "#7C3AED" : "#9CA3AF", fontWeight: 400 }}>
//             Single-use / disposable
//           </span>
//         </button>

//         <button
//           onClick={() => onChange("non_consumable")}
//           style={{
//             flex: 1, padding: "10px 12px", borderRadius: 10,
//             border: `1.5px solid ${selected === "non_consumable" ? C.primary : "#E5E7EB"}`,
//             background: selected === "non_consumable" ? C.primaryLight : "#FAFAFA",
//             color: selected === "non_consumable" ? C.primary : "#374151",
//             fontWeight: selected === "non_consumable" ? 700 : 500,
//             fontSize: 12, cursor: "pointer", textAlign: "left", ...fontBase,
//             transition: "all 0.15s", ...flex("col", 3),
//           }}
//         >
//           <div style={{ ...flex("row", 6, "center") }}>
//             {selected === "non_consumable" && (
//               <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
//                 <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//               </svg>
//             )}
//             <span>Non-Consumable</span>
//           </div>
//           <span style={{ fontSize: 10, color: selected === "non_consumable" ? "#7C3AED" : "#9CA3AF", fontWeight: 400 }}>
//             Durable / reusable devices
//           </span>
//         </button>
//       </div>
//     </div>
//   );
// }

// // ─── ValidationErrorPanel ─────────────────────────────────────────────────────
// function ValidationErrorPanel({
//   errors, successCount, failureCount, totalRows, onDownload, onDismiss,
// }: {
//   errors: ValidationError[]; successCount: number; failureCount: number;
//   totalRows: number; onDownload: () => void; onDismiss: () => void;
// }) {
//   const allFailed = successCount === 0 && failureCount > 0;
//   return (
//     <div style={{ ...flex("col", 8), background: "#FFF8F8", border: "1px solid #FECACA", borderRadius: 12, padding: 14, overflow: "hidden" }}>
//       <div style={{ ...flex("row", 0, "center", "space-between") }}>
//         <div style={{ ...flex("row", 8, "center") }}>
//           <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
//             <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8"/>
//             <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"/>
//           </svg>
//           <span style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", ...fontBase }}>
//             {allFailed
//               ? `All ${totalRows} row(s) failed validation`
//               : `${failureCount} of ${totalRows} row(s) failed — ${successCount} added successfully`}
//           </span>
//         </div>
//         <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
//           <XIcon size={13} color="#991B1B" />
//         </button>
//       </div>

//       {!allFailed && (
//         <div style={{ ...flex("row", 6, "center") }}>
//           <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, ...fontBase }}>
//             ✓ {successCount} added
//           </span>
//           <span style={{ background: "#FEE2E2", color: "#991B1B", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, ...fontBase }}>
//             ✗ {failureCount} failed
//           </span>
//         </div>
//       )}

//       <div style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 8, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
//         <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, ...fontBase }}>
//           <thead style={{ background: "#FEF2F2", position: "sticky", top: 0, zIndex: 1 }}>
//             <tr>
//               <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", width: 48, borderBottom: "1px solid #FECACA" }}>Row</th>
//               <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", width: "35%", borderBottom: "1px solid #FECACA" }}>Product</th>
//               <th style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "#991B1B", borderBottom: "1px solid #FECACA" }}>Reason</th>
//             </tr>
//           </thead>
//           <tbody>
//             {errors.map((err, idx) => (
//               <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#FFF8F8" }}>
//                 <td style={{ padding: "7px 10px", color: "#6B7280", fontWeight: 600, borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none" }}>
//                   {err.rowNumber}
//                 </td>
//                 <td style={{ padding: "7px 10px", color: "#374151", fontWeight: 500, borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                   {err.productName || <em style={{ color: "#9CA3AF" }}>Unnamed</em>}
//                 </td>
//                 <td style={{ padding: "7px 10px", color: "#DC2626", borderBottom: idx < errors.length - 1 ? "1px solid #FEE2E2" : "none" }}>
//                   {err.errorMessage}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <button
//         onClick={onDownload}
//         style={{ alignSelf: "flex-end", ...flex("row", 6, "center", "center"), padding: "6px 12px", background: "#fff", border: "1px solid #DC2626", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#DC2626", ...fontBase }}
//       >
//         <DownloadIcon color="#DC2626" />
//         Download Error Report (.csv)
//       </button>
//     </div>
//   );
// }

// // ─── ExcelUploadView ──────────────────────────────────────────────────────────
// function ExcelUploadView({ onBack, onSuccess }: {
//   onBack:    () => void;
//   onSuccess: (type: ProductType, files: UploadedFile[], result: UploadResult) => void;
// }) {
//   const [productType, setProductType]                 = useState<ProductType>("drugs");
//   const [medDevSubType, setMedDevSubType]             = useState<MedicalDeviceSubType>("consumable");
//   const [dragging, setDragging]                       = useState(false);
//   const [files, setFiles]                             = useState<UploadedFile[]>([]);
//   const [submitting, setSubmitting]                   = useState(false);
//   const [submitError, setSubmitError]                 = useState<string | null>(null);
//   const [uploadResult, setUploadResult]               = useState<UploadResult | null>(null);
//   const [fileFormatError, setFileFormatError]         = useState<string | null>(null);
//   const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string }>>([]);
//   const [loadingCategories, setLoadingCategories]     = useState(true);
//   const inputRef  = useRef<HTMLInputElement>(null);
//   const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

//   // Derive the effective ProductType from (productType, medDevSubType)
//   const effectiveProductType: ProductType =
//     productType === "medical_devices_non_consumable"
//       ? medDevSubType === "consumable"
//         ? "medical_devices_consumable"
//         : "medical_devices_non_consumable"
//       : productType === "cosmetics"
//       ? "cosmetics"
//       : productType;

//   const getUserId = useCallback((): number | null => {
//     try {
//       const userStr = localStorage.getItem("user");
//       if (userStr) { const user = JSON.parse(userStr); return user.userId; }
//       const token = localStorage.getItem("token");
//       if (token) {
//         const payload = JSON.parse(atob(token.split(".")[1]));
//         return payload.userId || payload.user_id || payload.sub;
//       }
//       return null;
//     } catch { return null; }
//   }, []);

//   useEffect(() => {
//     const fetchSellerCategories = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) { setLoadingCategories(false); return; }
//         const userId = getUserId();
//         if (!userId) { setLoadingCategories(false); return; }

//         const response = await fetch(
//           `https://api-test-aggreator.tiameds.ai/api/v1/sellers/user/${userId}`,
//           { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
//         );

//         const defaultCategories = [
//           { id: 1, name: "Drugs" },
//           { id: 2, name: "Supplements / Nutraceuticals" },
//           { id: 3, name: "Food & Infant Nutrition" },
//           { id: 4, name: "Cosmetic & Personal Care" },
//           { id: 5, name: "Medical Devices (Consumable)" },
//           { id: 6, name: "Medical Devices (Non-Consumable)" },
//         ];

//         if (response.ok) {
//           const result = await response.json();
//           setAvailableCategories(
//             result?.data?.productTypes?.length
//               ? result.data.productTypes.map((pt: any) => ({ id: pt.productTypeId, name: pt.productTypeName }))
//               : defaultCategories
//           );
//         } else {
//           setAvailableCategories(defaultCategories);
//         }
//       } catch {
//         setAvailableCategories([
//           { id: 1, name: "Drugs" },
//           { id: 2, name: "Supplements / Nutraceuticals" },
//           { id: 3, name: "Food & Infant Nutrition" },
//           { id: 4, name: "Cosmetic & Personal Care" },
//           { id: 5, name: "Medical Devices (Consumable)" },
//           { id: 6, name: "Medical Devices (Non-Consumable)" },
//         ]);
//       } finally {
//         setLoadingCategories(false);
//       }
//     };
//     fetchSellerCategories();
//   }, [getUserId]);

//   const isMedDevCategory = (catId: number) =>
//     MEDICAL_DEVICE_CONSUMABLE_IDS.includes(catId) || MEDICAL_DEVICE_NON_CONSUMABLE_IDS.includes(catId);

//   const isCosmeticsCategory = (catId: number) => COSMETICS_IDS.includes(catId);

//   // ── FIX 1: isCategorySelected now handles cosmetics ──────────────────────
//   const isCategorySelected = (catId: number) => {
//     if (catId === 1)                  return productType === "drugs";
//     if (isMedDevCategory(catId))      return productType === "medical_devices_non_consumable";
//     if (isCosmeticsCategory(catId))   return productType === "cosmetics";
//     return false;
//   };

//   // ── FIX 2: isSelectable now includes cosmetics ───────────────────────────
//   const isSelectable = (catId: number) =>
//     catId === 1 ||
//     MEDICAL_DEVICE_NON_CONSUMABLE_IDS.includes(catId) ||
//     MEDICAL_DEVICE_CONSUMABLE_IDS.includes(catId) ||
//     COSMETICS_IDS.includes(catId);

//   // ── FIX 3: handleCategorySelect now handles cosmetics ───────────────────
//   const handleCategorySelect = (catId: number) => {
//     if (catId === 1) {
//       setProductType("drugs");
//     } else if (isMedDevCategory(catId)) {
//       setProductType("medical_devices_non_consumable");
//       setMedDevSubType("consumable");
//     } else if (isCosmeticsCategory(catId)) {
//       setProductType("cosmetics");
//     }
//     setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null);
//   };

//   const updateFile = (key: string, patch: Partial<UploadedFile>) =>
//     setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, ...patch } : f));

//   const runFakeProgress = (key: string) => {
//     let step = 0;
//     const tick = () => {
//       if (step >= PROGRESS_STEPS.length) {
//         setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, status: "done" as const, progress: 100 } : f));
//         timersRef.current.delete(key);
//         return;
//       }
//       const p = PROGRESS_STEPS[step++];
//       setFiles((prev) => prev.map((f) => fileKey(f.file) === key ? { ...f, progress: p } : f));
//       timersRef.current.set(key, setTimeout(tick, 180));
//     };
//     timersRef.current.set(key, setTimeout(tick, 80));
//   };

//   const addFiles = (newFiles: File[]) => {
//     setSubmitError(null); setUploadResult(null); setFileFormatError(null);
//     const validFiles: File[] = [];
//     const errors: string[]   = [];
//     const maxSize = 10 * 1024 * 1024;
//     const validExts = ["xlsx", "csv", "xls"];

//     newFiles.forEach((file) => {
//       const ext = file.name.split(".").pop()?.toLowerCase();
//       if (!ext || !validExts.includes(ext)) {
//         errors.push(`${file.name}: Invalid format. Please upload .xlsx, .csv, or .xls files only.`);
//         return;
//       }
//       if (file.size > maxSize) { errors.push(`${file.name}: File size exceeds 10MB limit.`); return; }
//       if (file.size === 0)     { errors.push(`${file.name}: File is empty — please use our template.`); return; }
//       validFiles.push(file);
//     });

//     if (errors.length > 0) { setFileFormatError(errors.join(" ")); return; }

//     setFiles((prev) => {
//       const filtered = validFiles.filter((f) => !prev.some((ex) => ex.file.name === f.name && ex.file.size === f.size));
//       return [...prev, ...filtered.map((f) => ({ file: f, status: "uploading" as const, progress: 0 }))];
//     });
//     validFiles.forEach((f) => setTimeout(() => runFakeProgress(fileKey(f)), 50));
//   };

//   const removeFile = (i: number) => {
//     setSubmitError(null); setUploadResult(null); setFileFormatError(null);
//     setFiles((prev) => {
//       const key = fileKey(prev[i].file);
//       const timer = timersRef.current.get(key);
//       if (timer) { clearTimeout(timer); timersRef.current.delete(key); }
//       return prev.filter((_, idx) => idx !== i);
//     });
//   };

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault(); setDragging(false);
//     const dropped = Array.from(e.dataTransfer.files);
//     if (dropped.length) addFiles(dropped);
//   };

//   const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files?.length) { addFiles(Array.from(e.target.files)); e.target.value = ""; }
//   };

//   const downloadErrorReport = (errors: ValidationError[]) => {
//     if (!errors.length) return;
//     const csvRows = [
//       ["Row Number", "Product Name", "Error Message"].join(","),
//       ...errors.map((e) =>
//         `"${e.rowNumber}","${(e.productName ?? "").replace(/"/g, '""')}","${(e.errorMessage ?? "").replace(/"/g, '""')}"`
//       ),
//     ];
//     const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = `upload_errors_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
//     document.body.appendChild(link); link.click(); document.body.removeChild(link);
//   };

//   // ── FIX 4: Client-side cosmetics CSV validation before sending to API ────
//   const runClientSideCosmeticsValidation = async (file: File): Promise<ValidationError[]> => {
//     return new Promise((resolve) => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const text = e.target?.result as string;
//           const lines = text.split(/\r?\n/).filter((l) => l.trim());
//           if (lines.length < 2) {
//             resolve([{ rowNumber: 1, productName: "—", errorMessage: "File appears empty or has no data rows." }]);
//             return;
//           }

//           // Parse CSV (simple — handles quoted commas)
//           const parseCSVLine = (line: string): string[] => {
//             const result: string[] = [];
//             let cur = "";
//             let inQuote = false;
//             for (let i = 0; i < line.length; i++) {
//               const ch = line[i];
//               if (ch === '"') {
//                 if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
//                 else inQuote = !inQuote;
//               } else if (ch === "," && !inQuote) {
//                 result.push(cur); cur = "";
//               } else {
//                 cur += ch;
//               }
//             }
//             result.push(cur);
//             return result;
//           };

//           const headers = parseCSVLine(lines[0]);
//           const rows: Record<string, string>[] = lines.slice(1).map((line) => {
//             const vals = parseCSVLine(line);
//             const obj: Record<string, string> = {};
//             headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? "").trim(); });
//             return obj;
//           });

//           resolve(validateCosmeticsRows(rows, headers));
//         } catch {
//           resolve([]); // If we can't parse, let the server handle it
//         }
//       };
//       reader.onerror = () => resolve([]);

//       // Only CSV can be parsed in the browser; XLSX/XLS go straight to the server
//       const ext = file.name.split(".").pop()?.toLowerCase();
//       if (ext === "csv") {
//         reader.readAsText(file, "utf-8");
//       } else {
//         resolve([]); // xlsx/xls: skip client-side, rely on server
//       }
//     });
//   };

//   const parseUploadResponse = async (res: Response): Promise<UploadResult> => {
//     let body: any;
//     try { body = await res.json(); } catch {
//       throw new Error(`Server error (${res.status}): Could not parse response.`);
//     }

//     if (!res.ok) {
//       const msg =
//         body?.data?.message ??
//         body?.message ??
//         body?.error ??
//         `Server error (${res.status})`;
//       throw new Error(msg);
//     }

//     const data = body?.data ?? body;
//     if (data?.status === "ERROR") throw new Error(data.message ?? "Upload failed");

//     const successCount: number = data?.successCount ?? 0;
//     const failureCount: number = data?.failureCount ?? data?.errorCount ?? 0;
//     const totalRows: number    = data?.totalRows ?? (successCount + failureCount);
//     const validationErrors: ValidationError[] = (data?.errors ?? []).map((e: any) => ({
//       rowNumber:    e.rowNumber    ?? e.row     ?? "?",
//       productName:  e.productName  ?? e.product ?? "",
//       errorMessage: e.errorMessage ?? e.message ?? e.error ?? "Unknown error",
//     }));

//     if (totalRows === 0 && successCount === 0 && failureCount === 0 && validationErrors.length === 0) {
//       throw new Error(
//         "No product rows found in the file. Please ensure your file has at least one data row below the header, using our template."
//       );
//     }

//     return { success: successCount > 0, successCount, failureCount, totalRows, validationErrors };
//   };

//   const handleSubmit = async () => {
//     const readyFiles = files.filter((f) => f.status === "done");
//     if (!readyFiles.length || submitting) return;
//     setSubmitting(true); setSubmitError(null); setUploadResult(null); setFileFormatError(null);

//     const token = localStorage.getItem("token");
//     if (!token) {
//       setSubmitError("You are not authenticated. Please log in and try again.");
//       setSubmitting(false);
//       return;
//     }

//     const categoryId = getCategoryId(effectiveProductType);
//     let lastResult: UploadResult | null = null;

//     for (const uf of readyFiles) {
//       const key = fileKey(uf.file);
//       updateFile(key, { status: "uploading", progress: 0 });

//       try {
//         // ── FIX 5: Run client-side validation for cosmetics CSV before uploading
//         if (effectiveProductType === "cosmetics") {
//           updateFile(key, { progress: 10 });
//           const clientErrors = await runClientSideCosmeticsValidation(uf.file);
//           if (clientErrors.length > 0) {
//             const productName = clientErrors[0]?.productName ?? "—";
//             const failureCount = clientErrors.filter((e) => e.rowNumber !== 1).length;
//             const result: UploadResult = {
//               success: false,
//               successCount: 0,
//               failureCount: Math.max(failureCount, 1),
//               totalRows: Math.max(failureCount, 1),
//               validationErrors: clientErrors,
//             };
//             updateFile(key, {
//               status: "error",
//               error: `${clientErrors.length} validation error(s) found`,
//               progress: 100,
//             });
//             setUploadResult(result);
//             setSubmitting(false);
//             return;
//           }
//         }

//         for (let p = 15; p <= 80; p += 20) {
//           await new Promise((r) => setTimeout(r, 200));
//           updateFile(key, { progress: p });
//         }

//         const fd = new FormData();
//         fd.append("file", uf.file);
//         fd.append("categoryId", String(categoryId));

//         const res = await fetch(IMPORT_API_URL, {
//           method: "POST",
//           body: fd,
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const result = await parseUploadResponse(res);
//         lastResult = result;

//         if (result.validationErrors.length > 0) {
//           const errMsg = result.successCount > 0
//             ? `${result.failureCount} row(s) failed — see errors below`
//             : `All ${result.totalRows} row(s) failed validation`;
//           updateFile(key, { status: "error", error: errMsg, progress: 100 });
//           setUploadResult(result);
//         } else {
//           updateFile(key, { status: "done", progress: 100 });
//         }
//       } catch (err) {
//         const message = err instanceof Error ? err.message : "Upload failed";
//         updateFile(key, { status: "error", error: message });
//         setSubmitError(message);
//         lastResult = null;
//       }
//     }

//     await new Promise((r) => setTimeout(r, 250));
//     setSubmitting(false);

//     if (lastResult && lastResult.success && !lastResult.validationErrors.length) {
//       onSuccess(effectiveProductType, files, lastResult);
//     } else if (lastResult && lastResult.success && lastResult.validationErrors.length > 0) {
//       setUploadResult(lastResult);
//     }
//   };

//   const hasReadyFiles = files.some((f) => f.status === "done");
//   const template      = TEMPLATES[effectiveProductType];

//   const templateLabel =
//     effectiveProductType === "medical_devices_consumable"
//       ? "Medical Devices (Consumable) Template"
//       : effectiveProductType === "medical_devices_non_consumable"
//       ? "Medical Devices (Non-Consumable) Template"
//       : effectiveProductType === "cosmetics"
//       ? "Cosmetics & Personal Care Template"
//       : "Drugs Template";

//   const renderCategories = () => {
//     const seen  = new Set<string>();
//     const tiles: Array<{ id: number; name: string; displayName: string; selectable: boolean }> = [];
//     availableCategories.forEach((cat) => {
//       if (isMedDevCategory(cat.id)) {
//         if (!seen.has("medical_devices")) {
//           seen.add("medical_devices");
//           tiles.push({ id: cat.id, name: cat.name, displayName: "Medical Devices", selectable: true });
//         }
//       } else {
//         tiles.push({ id: cat.id, name: cat.name, displayName: cat.name, selectable: isSelectable(cat.id) });
//       }
//     });
//     return tiles;
//   };

//   return (
//     <div style={{ ...flex("col", 14) }}>
//       {/* Back */}
//       <button onClick={onBack} style={{ ...flex("row", 6, "center"), background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 14, fontWeight: 600, padding: 0, ...fontBase, alignSelf: "flex-start" }}>
//         <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
//           <path d="M19 12H5M12 5l-7 7 7 7" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
//         </svg>
//         Back
//       </button>

//       {/* Heading */}
//       <div style={{ ...flex("col", 3) }}>
//         <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", ...fontBase }}>Upload Excel / CSV</div>
//         <div style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>Download our template, fill in product data, and upload</div>
//       </div>

//       {/* Category grid */}
//       <div style={{ ...flex("col", 8) }}>
//         <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", ...fontBase }}>Select product category</div>
//         {loadingCategories ? (
//           <div style={{ ...flex("row", 8, "center") }}>
//             <span style={{ width: 14, height: 14, border: "2px solid #E5E7EB", borderTopColor: C.primary, borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }}/>
//             <span style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>Loading categories...</span>
//           </div>
//         ) : (
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
//             {renderCategories().map((cat) => {
//               const selected = isCategorySelected(cat.id);
//               return (
//                 <button
//                   key={cat.id}
//                   onClick={() => cat.selectable && handleCategorySelect(cat.id)}
//                   disabled={!cat.selectable}
//                   style={{
//                     padding: "8px 10px", borderRadius: 8,
//                     border: `1.5px solid ${selected ? C.primary : "#E5E7EB"}`,
//                     background: selected ? C.primaryLight : cat.selectable ? "#FAFAFA" : "#F9FAFB",
//                     color: selected ? C.primary : cat.selectable ? "#374151" : "#9CA3AF",
//                     fontWeight: selected ? 700 : 500,
//                     fontSize: 11,
//                     cursor: cat.selectable ? "pointer" : "default",
//                     textAlign: "left", ...fontBase,
//                     transition: "all 0.15s",
//                     ...flex("row", 5, "center"),
//                     lineHeight: 1.3,
//                   }}
//                 >
//                   {selected && (
//                     <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
//                       <path d="M2 6l3 3 5-5" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                     </svg>
//                   )}
//                   {cat.displayName}
//                 </button>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* Medical Devices Sub-Type Picker */}
//       {productType === "medical_devices_non_consumable" && (
//         <MedicalDeviceSubTypePicker
//           selected={medDevSubType}
//           onChange={(v) => {
//             setMedDevSubType(v);
//             setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null);
//           }}
//         />
//       )}

//       {/* Template download */}
//       {template && (
//         <div style={{ ...flex("row", 0, "center", "space-between"), padding: "10px 12px", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 10, gap: 10, flexWrap: "wrap" }}>
//           <div style={{ ...flex("col", 2), minWidth: 0 }}>
//             <div style={{ fontWeight: 600, color: "#5B21B6", fontSize: 12, ...fontBase }}>{templateLabel}</div>
//             <div style={{ color: "#6B7280", fontSize: 11, ...fontBase }}>Download and fill before uploading</div>
//           </div>
//           <div style={{ ...flex("row", 6, "center"), flexShrink: 0 }}>
//             {[
//               { href: template.csv,  label: ".CSV"  },
//               { href: template.xlsx, label: ".XLSX" },
//               { href: template.xls,  label: ".XLS"  },
//             ].map(({ href, label }) => (
//               <a
//                 key={label}
//                 href={href}
//                 download
//                 className="df-dl-btn"
//                 style={{ background: "#9F75FC", color: "white", borderRadius: 6, padding: "0 10px", height: 30, ...flex("row", 4, "center", "center"), fontSize: 11, fontWeight: 700, textDecoration: "none", border: "none", ...fontBase, transition: "all 0.2s", cursor: "pointer" }}
//               >
//                 <DownloadIcon color="white" />
//                 {label}
//               </a>
//             ))}
//           </div>
//         </div>
//       )}

      

//       {/* File format error */}
//       {fileFormatError && (
//         <div style={{ ...flex("row", 10, "center"), padding: "8px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
//           <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
//             <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8"/>
//             <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"/>
//           </svg>
//           <span style={{ fontSize: 12, color: "#991B1B", flex: 1, ...fontBase }}>{fileFormatError}</span>
//           <button onClick={() => setFileFormatError(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
//             <XIcon size={12} color="#991B1B" />
//           </button>
//         </div>
//       )}

//       {/* Drop zone */}
//       <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: 8, ...flex("col", 8) }}>
//         <div
//           onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
//           onDragLeave={() => setDragging(false)}
//           onDrop={handleDrop}
//           onClick={() => inputRef.current?.click()}
//           style={{ background: dragging ? "#F5F3FF" : "#F9FAFB", border: `2px dashed ${dragging ? C.primary : "#A78BFA"}`, borderRadius: 8, padding: files.length ? "14px 16px" : "20px 16px", cursor: "pointer", ...flex("col", 10, "center", "center"), transition: "all 0.2s" }}
//         >
//           <input ref={inputRef} type="file" accept=".xlsx,.csv,.xls" multiple style={{ display: "none" }} onChange={handleFileInput}/>
//           <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
//             <path d="M32.5075 15.6583L9.43565 16.5154C8.67212 16.5154 8.22691 16.8012 8.0166 17.5353L3.2273 33.9198C3.02929 34.6161 2.08003 34.9419 1.41968 34.9419C0.759773 34.9419 0.219727 34.4019 0.219727 33.742V29.1503V10.3386V9.43986V6.68562C0.219727 5.76227 0.968328 5.01367 1.89168 5.01367H13.771C14.2144 5.01367 14.6394 5.18974 14.9529 5.50323L18.3995 8.94987C18.713 9.26336 19.1385 9.43942 19.5815 9.43942H30.8356C31.7589 9.43942 32.5075 10.188 32.5075 11.1114V11.6826V15.6583Z" fill="#E0AD31"/>
//             <path d="M1.41968 34.9419C2.07959 34.9419 2.42162 34.4383 2.61964 33.7419L7.44757 16.8986C7.65788 16.1645 8.3292 15.6587 9.09317 15.6587H38.6768C39.3832 15.6587 39.8908 16.3375 39.6914 17.0154L34.9074 33.2721C34.6914 34.0409 34.2176 34.9485 33.2377 34.9419H1.41968Z" fill="#FFC843"/>
//           </svg>
//           <div style={{ textAlign: "center" }}>
//             <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 2, ...fontBase }}>
//               {dragging ? "Drop files here!" : "Drag & drop your Excel / CSV"}
//             </div>
//             <div style={{ fontSize: 10, color: "#9CA3AF", ...fontBase }}>or click to browse · .xlsx · .csv · .xls · Max 10MB</div>
//           </div>
//         </div>

//         {files.length > 0 && (
//           <div style={{ ...flex("col", 6) }}>
//             <div style={{ ...flex("row", 0, "center", "space-between") }}>
//               <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", ...fontBase }}>Files ({files.length})</span>
//               {files.every((f) => f.status === "done" || f.status === "error") && (
//                 <button onClick={() => { setFiles([]); setUploadResult(null); setSubmitError(null); setFileFormatError(null); }} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer", ...fontBase }}>
//                   Clear all
//                 </button>
//               )}
//             </div>
//             {files.map((uf, i) => (
//               <FileRow key={`${uf.file.name}-${i}`} uf={uf} index={i} onRemove={removeFile} submitting={submitting}/>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Validation error panel */}
//       {uploadResult && uploadResult.validationErrors.length > 0 && (
//         <ValidationErrorPanel
//           errors={uploadResult.validationErrors}
//           successCount={uploadResult.successCount}
//           failureCount={uploadResult.failureCount}
//           totalRows={uploadResult.totalRows}
//           onDownload={() => downloadErrorReport(uploadResult.validationErrors)}
//           onDismiss={() => setUploadResult(null)}
//         />
//       )}

//       {/* Generic submit error */}
//       {submitError && (
//         <div style={{ ...flex("row", 10, "center"), padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
//           <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
//             <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.8"/>
//             <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"/>
//           </svg>
//           <span style={{ fontSize: 12, color: "#991B1B", flex: 1, ...fontBase }}>{submitError}</span>
//           <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
//             <XIcon size={12} color="#991B1B" />
//           </button>
//         </div>
//       )}

//       {/* Upload button */}
//       <button
//         onClick={handleSubmit}
//         disabled={!hasReadyFiles || submitting}
//         style={{ width: "100%", height: 46, borderRadius: 10, border: "none", background: hasReadyFiles && !submitting ? "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)" : "#F3F4F6", cursor: hasReadyFiles && !submitting ? "pointer" : "not-allowed", ...flex("row", 10, "center", "center"), ...fontBase, boxShadow: hasReadyFiles && !submitting ? "0 4px 14px rgba(76,29,149,0.3)" : "none", transition: "all 0.2s" }}
//       >
//         <span style={{ color: hasReadyFiles && !submitting ? "white" : "#9CA3AF", fontWeight: 700, fontSize: 14, ...fontBase, ...flex("row", 8, "center") }}>
//           {submitting ? (
//             <>
//               <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "dfSpin 0.7s linear infinite", display: "inline-block" }}/>
//               Processing...
//             </>
//           ) : (
//             <>
//               <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
//                 <path d="M12 3v12m0 0l-3-3m3 3l3-3M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//               </svg>
//               Upload {files.length > 1 ? "Files" : "File"}
//             </>
//           )}
//         </span>
//       </button>

//       <div style={{ ...flex("row", 6, "center"), justifyContent: "center" }}>
//         <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
//           <circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="1.5"/>
//           <path d="M12 8v4M12 16h.01" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
//         </svg>
//         <span style={{ fontSize: 10, color: "#9CA3AF", ...fontBase }}>
//           Ensure your file follows the template format · Max 10MB per file
//         </span>
//       </div>
//     </div>
//   );
// }

// // ─── SuccessView ──────────────────────────────────────────────────────────────
// function SuccessView({ files, result, onClose }: {
//   productType: ProductType;
//   files:       UploadedFile[];
//   result:      UploadResult;
//   onReset:     () => void;
//   onClose?:    () => void;
// }) {
//   const fileName = files?.[0]?.file?.name ?? "product_template.xlsx";
//   return (
//     <div style={{ ...flex("col", 20, "center"), padding: "32px 24px", position: "relative" }}>
//       {onClose && (
//         <button onClick={onClose} style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, background: "none", border: "1.5px solid #1E1E1D", borderRadius: "50%", cursor: "pointer", ...flex("row", 0, "center", "center"), padding: 0 }}>
//           <XIcon size={12} color="#1E1E1D" strokeWidth={2.5}/>
//         </button>
//       )}
//       <div style={{ padding: 20, background: "#DCF7CB", borderRadius: "50%", border: "1px solid #4EB300", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
//         <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
//           <path d="M5 13l4 4L19 7" stroke="#378200" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
//         </svg>
//       </div>
//       <div style={{ ...flex("col", 10, "center"), width: "100%" }}>
//         <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", ...fontBase, textAlign: "center" }}>
//           Products Added Successfully!
//         </div>
//         <div style={{ fontSize: 13, color: "#374151", ...fontBase, textAlign: "center" }}>
//           <strong style={{ color: "#166534" }}>{result.successCount} product{result.successCount !== 1 ? "s" : ""}</strong> from <em>{fileName}</em> {result.successCount !== 1 ? "have" : "has"} been added to your catalogue.
//         </div>
//       </div>
//       <div style={{ ...flex("row", 12, "center", "center"), width: "100%" }}>
//         <div style={{ flex: 1, background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", ...flex("col", 4, "center") }}>
//           <span style={{ fontSize: 22, fontWeight: 800, color: "#166534", ...fontBase }}>{result.successCount}</span>
//           <span style={{ fontSize: 11, color: "#166534", fontWeight: 600, ...fontBase }}>Products Added</span>
//         </div>
//         <div style={{ flex: 1, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", ...flex("col", 4, "center") }}>
//           <span style={{ fontSize: 22, fontWeight: 800, color: "#15803D", ...fontBase }}>{result.totalRows}</span>
//           <span style={{ fontSize: 11, color: "#15803D", fontWeight: 600, ...fontBase }}>Total Rows</span>
//         </div>
//       </div>
//       <div style={{ background: "#DCF7CB", border: "1px solid #4EB300", borderRadius: 8, padding: "10px 16px", width: "100%", textAlign: "center" }}>
//         <span style={{ fontSize: 12, color: "#378200", ...fontBase }}>
//           Products are now live in your catalogue. Processing usually takes 2–5 minutes.
//         </span>
//       </div>
//       {onClose && (
//         <button
//           onClick={onClose}
//           style={{ width: "100%", height: 44, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)", cursor: "pointer", ...flex("row", 0, "center", "center"), ...fontBase, boxShadow: "0 4px 14px rgba(76,29,149,0.3)", color: "white", fontWeight: 700, fontSize: 14 }}
//         >
//           View My Products
//         </button>
//       )}
//     </div>
//   );
// }

// // ─── OnboardingModal ──────────────────────────────────────────────────────────
// function OnboardingModal({ onClose, onManualEntry }: { onClose: () => void; onManualEntry: () => void }) {
//   const [successData, setSuccessData]       = useState<{ type: ProductType; files: UploadedFile[]; result: UploadResult } | null>(null);
//   const [hovered, setHovered]               = useState<string | null>(null);
//   const [transitioning, setTransitioning]   = useState(false);
//   const [displayView, setDisplayView]       = useState<ModalView>("methods");
//   const [slideDir, setSlideDir]             = useState<"left" | "right">("left");
//   const [contentVisible, setContentVisible] = useState(true);

//   const changeView = (next: ModalView, dir: "left" | "right") => {
//     if (transitioning) return;
//     setTransitioning(true); setSlideDir(dir); setContentVisible(false);
//     setTimeout(() => {
//       setDisplayView(next);
//       setTimeout(() => { setContentVisible(true); setTransitioning(false); }, 30);
//     }, 180);
//   };

//   useEffect(() => {
//     const id = "df-open-sans-font";
//     if (!document.getElementById(id)) {
//       const link = Object.assign(document.createElement("link"), {
//         id, rel: "stylesheet",
//         href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap",
//       });
//       document.head.appendChild(link);
//     }
//   }, []);

//   useEffect(() => {
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = "hidden";
//     return () => { document.body.style.overflow = prev; };
//   }, []);

//   const isSuccess = displayView === "success";
//   const slideX    = slideDir === "left" ? "-22px" : "22px";

//   return (
//     <>
//       <style>{`
//         @keyframes dfModalIn {
//           from { opacity: 0; transform: translate(-50%, calc(-50% + 18px)) scale(0.96); }
//           to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
//         }
//         @keyframes dfSpin { to { transform: rotate(360deg); } }
//         .df-card { transition: box-shadow 0.14s, transform 0.14s, border-color 0.14s !important; }
//         .df-card:hover { transform: translateY(-1px) !important; box-shadow: 0 6px 18px rgba(0,0,0,0.09) !important; }
//         .df-modal-root, .df-modal-root * { font-family: 'Open Sans', sans-serif !important; -webkit-font-smoothing: antialiased; }
//         .df-dl-btn { transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease !important; }
//         .df-dl-btn:hover { background: #C4A4FD !important; transform: translateY(-1px) !important; }
//         .df-modal-scroll::-webkit-scrollbar { width: 4px; }
//         .df-modal-scroll::-webkit-scrollbar-track { background: transparent; }
//         .df-modal-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
//       `}</style>

//       {/* Backdrop */}
//       <div
//         onClick={displayView === "methods" ? onClose : undefined}
//         style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", cursor: displayView === "methods" ? "pointer" : "default" }}
//       />

//       {/* Close button */}
//       {displayView === "methods" && (
//         <button onClick={onClose} style={{ position: "fixed", top: 12, right: 12, zIndex: 1002, background: "none", border: "none", padding: 0, cursor: "pointer", ...flex("row", 0, "center", "center") }}>
//           <div style={{ width: 36, height: 36, background: "white", borderRadius: 8, ...flex("row", 0, "center", "center") }}>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//               <path fillRule="evenodd" clipRule="evenodd" d="M12 3.75C9.81196 3.75 7.71354 4.61919 6.16637 6.16637C4.61919 7.71354 3.75 9.81196 3.75 12C3.75 13.0834 3.96339 14.1562 4.37799 15.1571C4.79259 16.1581 5.40029 17.0675 6.16637 17.8336C6.93245 18.5997 7.84193 19.2074 8.84286 19.622C9.8438 20.0366 10.9166 20.25 12 20.25C13.0834 20.25 14.1562 20.0366 15.1571 19.622C16.1581 19.2074 17.0675 18.5997 17.8336 17.8336C18.5997 17.0675 19.2074 16.1581 19.622 15.1571C20.0366 14.1562 20.25 13.0834 20.25 12C20.25 9.81196 19.3808 7.71354 17.8336 6.16637C16.2865 4.61919 14.188 3.75 12 3.75ZM5.10571 5.10571C6.93419 3.27723 9.41414 2.25 12 2.25C14.5859 2.25 17.0658 3.27723 18.8943 5.10571C20.7228 6.93419 21.75 9.41414 21.75 12C21.75 13.2804 21.4978 14.5482 21.0078 15.7312C20.5178 16.9141 19.7997 17.9889 18.8943 18.8943C17.9889 19.7997 16.9141 20.5178 15.7312 21.0078C14.5482 21.4978 13.2804 21.75 12 21.75C10.7196 21.75 9.45176 21.4978 8.26884 21.0078C7.08591 20.5178 6.01108 19.7997 5.10571 18.8943C4.20034 17.9889 3.48216 16.9141 2.99217 15.7312C2.50219 14.5482 2.25 13.2804 2.25 12C2.25 9.41414 3.27723 6.93419 5.10571 5.10571ZM9.21967 9.21967C9.51256 8.92678 9.98744 8.92678 10.2803 9.21967L12 10.9393L13.7197 9.21967C14.0126 8.92678 14.4874 8.92678 14.7803 9.21967C15.0732 9.51256 15.0732 9.98744 14.7803 10.2803L13.0607 12L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L12 13.0607L10.2803 14.7803C9.98744 15.0732 9.51256 15.0732 9.21967 14.7803C8.92678 14.4874 8.92678 14.0126 9.21967 13.7197L10.9393 12L9.21967 10.2803C8.92678 9.98744 8.92678 9.51256 9.21967 9.21967Z" fill="#111827"/>
//             </svg>
//           </div>
//         </button>
//       )}

//       {/* Modal */}
//       <div
//         className="df-modal-root"
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           position: "fixed", top: "50%", left: "50%",
//           transform: "translate(-50%, -50%)",
//           zIndex: 1000,
//           width: "90vw", maxWidth: 460,
//           height: "auto",
//           maxHeight: "92vh",
//           background: "white",
//           borderRadius: 20,
//           boxShadow: "0 24px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.05)",
//           animation: "dfModalIn 0.28s cubic-bezier(0.22,1,0.36,1) forwards",
//           fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
//           display: "flex", flexDirection: "column",
//           overflow: "hidden",
//         }}
//       >
//         <div
//           className="df-modal-scroll"
//           style={{ flex: 1, overflowY: "auto", padding: isSuccess ? "0" : "22px" }}
//         >
//           <div style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? "translateX(0)" : `translateX(${slideX})`, transition: contentVisible ? "opacity 0.2s, transform 0.2s" : "opacity 0.17s, transform 0.17s" }}>

//             {/* Methods view */}
//             {displayView === "methods" && (
//               <>
//                 <div style={{ marginBottom: 16, ...flex("col", 4) }}>
//                   <div style={{ fontSize: 19, fontWeight: 700, color: "#111827", ...fontBase }}>How would you like to add products?</div>
//                   <div style={{ fontSize: 13, color: "#6B7280", ...fontBase }}>Choose the method that fits your workflow.</div>
//                 </div>
//                 <div style={{ ...flex("col", 8) }}>
//                   {METHODS.map((m) => (
//                     <button
//                       key={m.id}
//                       className="df-card"
//                       onMouseEnter={() => m.ready && setHovered(m.id)}
//                       onMouseLeave={() => setHovered(null)}
//                       onClick={() => {
//                         if (!m.ready) return;
//                         if (m.id === "manual") { onManualEntry(); return; }
//                         if (m.id === "excel") changeView("excel", "left");
//                         if (m.id === "api") changeView("api", "left");
//                       }}
//                       style={{ ...flex("row", 12, "center"), padding: "14px 16px", borderRadius: 14, border: `1px solid ${hovered === m.id ? "#D1D5DB" : "#E5E7EB"}`, background: hovered === m.id ? "#FAFAFA" : "white", cursor: m.ready ? "pointer" : "default", textAlign: "left", width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", opacity: m.ready ? 1 : 0.55 }}
//                     >
//                       <div style={{ width: 40, height: 40, borderRadius: 8, background: m.bg, border: "1px solid #E5E7EB", ...flex("row", 0, "center", "center"), flexShrink: 0 }}>
//                         {m.icon}
//                       </div>
//                       <div style={{ flex: 1 }}>
//                         <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 2, ...fontBase }}>{m.label}</div>
//                         <div style={{ fontSize: 12, color: "#6B7280", ...fontBase }}>{m.desc}</div>
//                       </div>
//                       {m.ready ? (
//                         <div style={{ ...flex("row", 5, "center"), fontSize: 13, fontWeight: 600, color: m.accent, whiteSpace: "nowrap", flexShrink: 0, ...fontBase }}>
//                           Get Started
//                           <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
//                             <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
//                           </svg>
//                         </div>
//                       ) : (
//                         <div style={{ fontSize: 11, color: "#9CA3AF", ...fontBase, flexShrink: 0 }}>Soon</div>
//                       )}
//                     </button>
//                   ))}
//                 </div>
//               </>
//             )}

//             {/* Excel view */}
//             {displayView === "excel" && (
//               <ExcelUploadView
//                 onBack={() => changeView("methods", "right")}
//                 onSuccess={(type, files, result) => { setSuccessData({ type, files, result }); changeView("success", "left"); }}
//               />
//             )}

//             {/* Success view */}
//             {displayView === "success" && successData && (
//               <SuccessView
//                 productType={successData.type}
//                 files={successData.files}
//                 result={successData.result}
//                 onReset={() => { setSuccessData(null); changeView("excel", "right"); }}
//                 onClose={onClose}
//               />
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// // ─── DashboardFilters ─────────────────────────────────────────────────────────
// const DashboardFilters = ({ setCurrentView }: DashboardFiltersProps) => {
//   const router = useRouter();
//   const [showModal, setShowModal] = useState(false);

//   return (
//     <>
//       <div className="flex flex-wrap items-center gap-4">
//         <select className="h-11 w-50 px-4 rounded-md border border-neutral-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-50">
//           <option>All Stocks</option>
//           <option>Low Stock</option>
//           <option>Out of Stock</option>
//         </select>
//         <select className="h-11 w-50 px-4 rounded-md border border-neutral-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-50">
//           <option>All Categories</option>
//           <option>Drugs</option>
//           <option>Vitamins</option>
//           <option>Diabetes</option>
//         </select>
//         <button
//           onClick={() => setShowModal(true)}
//           className="h-11 w-50 flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-800 text-white rounded-md shadow-md transition"
//         >
//           <Plus size={18}/> Add New Product
//         </button>
//       </div>
//       {showModal && (
//         <OnboardingModal
//           onClose={() => setShowModal(false)}
//           onManualEntry={() => {
//             setShowModal(false);
//             router.push("/seller_7a3b9f2c/products/add");
//           }}
//         />
//       )}
//     </>
//   );
// };

// export default DashboardFilters;