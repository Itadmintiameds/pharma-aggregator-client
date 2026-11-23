"use client";

import ProductImageGallery from "./ProductImageGallery";
import React, { useState } from "react";
import { FileText, ExternalLink, Edit2, X, Gift, ShoppingBag, Tag, BadgePercent } from "lucide-react";
import { PiSealCheckLight } from "react-icons/pi";
import Image from "next/image";


/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */


export interface CertificateDocument {
  certificationId: number;
  certificateUrl: string;
  certificationName?: string;
  label?: string;
  productCertificateDocumentId?: number;
}


export interface PromotionalScheme {
  schemeId?: number;
  schemeTitle: string;
  schemeDescription: string;
  schemeType?: "bogo" | "bulk" | "bundle" | "seasonal" | string;
  validFrom?: string;
  validTo?: string;
  isOngoing?: boolean;
}


export interface PricingDetails {
  mrp?: number | string;
  sellingPrice?: number | string;
  discountPercentage?: number | string;
  finalPrice?: number | string;
  additionalSchemeDescription?: string;
  batchNumber?: string;
  batchLotNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  stockQuantity?: number | string;
  dateOfStockEntry?: string;
  shelfLife?: string;
  gstPercentage?: number | string;
  hsnCode?: string | number;
}


export interface PackagingDetails {
  packType?: string;
  packTypeName?: string;
  unitsPerPack?: number | string;
  unitPerPack?: number | string;
  numberOfPacks?: number | string;
  packSize?: number | string;
  minimumOrderQuantity?: number | string;
  maximumOrderQuantity?: number | string;
}


export interface TaxDetails {
  gstPercentage?: number | string;
  hsnCode?: string | number;
}


export interface CosmeticAttributes {
  // Resolved label strings (set by parent via buildCosAttrForView)
  productType?: string;
  productSubtype?: string;
  productSubType?: string;
  brandName?: string;
  variantName?: string;
  VariantName?: string;
  gender?: string;
  Gender?: string;
  intendedUseArea?: string;
  // Also accept raw object arrays — view will extract labels from them
  intendedUseAreas?: string | string[] | { areaName?: string; useAreaId?: number }[];
  skinHairType?: string;
  skinTypes?: string | string[] | { skintypeId?: number; typeName?: string }[];
  hairTypes?: string | string[] | { hairTypeId?: number; typeId?: number; typeName?: string }[];
  ageGroup?: string;
  netQuantityStrength?: string;
  NetQuantityStrength?: string;
  netQuantity?: string;
  activeIngredients?: string;
  ActiveIngredients?: string;
  productClaims?: string;
  ProductClaims?: string;
  storageCondition?: string;
  storageConditionName?: string;
  storageConditionId?: number;
  manufacturerName?: string;
  countryOfOrigin?: string;
  countryName?: string;
  productForm?: string;
  brochurePath?: string;
  BrochurePath?: string;
  certificateDocuments?: CertificateDocument[];
  productDescription?: string;
  warningsPrecautions?: string;
  WarningsPrecautions?: string;
  // Raw ID fields (for fallback display)
  productCategoryId?: number;
  productSubcategoryId?: number;
  ageGroupId?: number;
  countryId?: number;
}


export interface CosmeticPersonalCareViewProps {
  productName?: string | null;
  productDescription?: string | null;
  warningsPrecautions?: string | null;
  displayImages?: string[];
  cosAttr?: CosmeticAttributes | null;
  storageConditionName?: string | null;
  brochureUrl?: string | null;
  placeholderImage?: string;
  promotionalSchemes?: PromotionalScheme[];
  packagingDetails?: PackagingDetails | null;
  pricingDetails?: PricingDetails | null;
  taxDetails?: TaxDetails | null;
  onEdit?: () => void;
  onClose?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalDiscounts?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specialSchemes?: any[];
}


/* ─────────────────────────────────────────────────────────
   SHARED STYLES
───────────────────────────────────────────────────────── */


const FONTS = {
  workSans: "'Work Sans', 'Segoe UI', sans-serif",
  notoSans: "'Noto Sans', 'Segoe UI', sans-serif",
  openSans: "'Open Sans', 'Segoe UI', sans-serif",
};


const CERT_COLORS = [
  { bg: "#DCF7CB", color: "#378200" },
  { bg: "#FFD6D9", color: "#B91C1C" },
  { bg: "#DBEAFE", color: "#1D4ED8" },
  { bg: "#FEF9C3", color: "#A16207" },
];


const ROW: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  alignItems: "center",
  padding: "8px 12px",
  borderBottom: "1px solid #D5D5D4",
  gap: 16,
};


const ROW_LABEL: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 4,
  flex: "1 1 0",
  minWidth: 0,
};


const LABEL_TEXT: React.CSSProperties = {
  color: "#5A5B58",
  fontSize: 13,
  fontFamily: FONTS.workSans,
  fontWeight: 500,
  lineHeight: "20px",
  wordWrap: "break-word",
  margin: 0,
};


const REQUIRED_STAR: React.CSSProperties = {
  color: "#FF3B3B",
  fontSize: 14,
  fontFamily: FONTS.workSans,
  fontWeight: 500,
  lineHeight: "20px",
  flexShrink: 0,
};


const VALUE_TEXT: React.CSSProperties = {
  color: "#3C3D3A",
  fontSize: 14,
  fontFamily: FONTS.notoSans,
  fontWeight: 600,
  lineHeight: "20px",
  wordWrap: "break-word",
  textAlign: "right",
  flex: "1 1 0",
  margin: 0,
};


/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */


const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);


const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);


const isValidUrl = (url?: string | null) => {
  if (!url) return false;
  const t = url.trim().toUpperCase();
  return !["", "PENDING", "NOT_UPLOADED", "TO_UPLOAD", "NULL", "UNDEFINED"].includes(t) && !t.startsWith("BLOB:");
};


/**
 * Resolves intendedUseAreas / skinTypes / hairTypes which may arrive as:
 *   - a plain string                       → return as-is
 *   - string[]                             → join with ", "
 *   - object[] with a label key            → extract label, join
 */
function resolveListOrObjects(
  val: string | string[] | Record<string, unknown>[] | undefined | null,
  objectLabelKeys: string[],   // keys to try on each object to find the display name
): string | null {
  if (!val) return null;
  if (typeof val === "string") return val.trim() || null;
  if (!Array.isArray(val) || val.length === 0) return null;


  const parts: string[] = [];
  for (const item of val) {
    if (typeof item === "string") {
      if (item.trim()) parts.push(item.trim());
    } else if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      let found = false;
      for (const key of objectLabelKeys) {
        if (obj[key] != null && String(obj[key]).trim()) {
          parts.push(String(obj[key]).trim());
          found = true;
          break;
        }
      }
      // Fallback: if no label key found, skip (ID-only objects aren't human-readable)
      if (!found) continue;
    }
  }
  return parts.join(", ") || null;
}


const formatCurrency = (val?: number | string | null): string => {
  if (val == null || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString("en-IN")}`;
};


const formatVal = (val?: number | string | null): string => {
  if (val == null || val === "") return "—";
  return String(val);
};


const formatDate = (val?: string | null): string => {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return val;
  }
};


/** Resolve a field that may exist under multiple casing variants */
const resolveField = (
  obj: CosmeticAttributes | null | undefined,
  ...keys: (keyof CosmeticAttributes)[]
): string | null => {
  if (!obj) return null;
  for (const key of keys) {
    const val = obj[key];
    if (val == null) continue;
    if (typeof val === "string" && val.trim() !== "") return val.trim();
    if (typeof val === "number" && !isNaN(val)) return String(val);
  }
  return null;
};


/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */


const FieldRow = ({
  label,
  value,
  required = true,
  valueNode,
  multiline = false,
  bold = false,
}: {
  label: string;
  value?: string | number | null;
  required?: boolean;
  valueNode?: React.ReactNode;
  multiline?: boolean;
  bold?: boolean;
}) => (
  <div style={{ ...ROW, alignItems: multiline ? "flex-start" : "center" }}>
    <div style={ROW_LABEL}>
      <span style={LABEL_TEXT}>{label}</span>
      {required && <span style={REQUIRED_STAR}>*</span>}
    </div>
    {valueNode ? (
      <div style={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}>
        {valueNode}
      </div>
    ) : (
      <p style={bold ? { ...VALUE_TEXT, fontWeight: 700, color: "#1E1E1D" } : VALUE_TEXT}>{value ?? "—"}</p>
    )}
  </div>
);


const FullWidthBlock = ({
  label,
  value,
  required = true,
}: {
  label: string;
  value?: string | null;
  required?: boolean;
}) => (
  <div
    style={{
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottom: "1px #D5D5D4 solid",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={LABEL_TEXT}>{label}</span>
      {required && <span style={REQUIRED_STAR}>*</span>}
    </div>
    <p
      style={{
        color: "#3C3D3A",
        fontSize: 14,
        fontFamily: FONTS.notoSans,
        fontWeight: 400,
        lineHeight: "20px",
        wordWrap: "break-word",
        margin: 0,
        whiteSpace: "pre-wrap",
      }}
    >
      {value ?? "—"}
    </p>
  </div>
);


const SectionHeading = ({ title }: { title: string }) => (
  <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid", marginTop: 32 }}>
    <h2 style={{ color: "#1E1E1D", fontSize: 20, fontFamily: FONTS.workSans, fontWeight: 700, lineHeight: "28px", borderLeft: "4px solid var(--Colors-Brand-Primary-800, #6C12A9)", paddingLeft: 10, margin: 0 }}>
      {title}
    </h2>
  </div>
);


const SubHeading = ({ title }: { title: string }) => (
  <div style={{ paddingTop: 8, paddingBottom: 4, borderBottom: "1px #D5D5D4 solid", marginTop: 20, marginBottom: 4 }}>
    <h3 style={{ color: "#1E1E1D", fontSize: 20, fontFamily: FONTS.workSans, fontWeight: 700, lineHeight: "28px", borderLeft: "4px solid var(--Colors-Brand-Primary-800, #6C12A9)", paddingLeft: 10, margin: 0 }}>
      {title}
    </h3>
  </div>
);


/* ─────────────────────────────────────────────────────────
   SCHEME CARD COLORS
───────────────────────────────────────────────────────── */


interface SchemeStyle {
  bg: string;
  border: string;
  iconBg: string;
  titleColor: string;
  icon: string;
}


const SCHEME_STYLES: SchemeStyle[] = [
  { bg: "#F0FAE8", border: "#7CC450", iconBg: "#4CAF50", titleColor: "#2E7D32", icon: "🎁" },
  { bg: "#F3E8FF", border: "#B550FA", iconBg: "#9C27B0", titleColor: "#6A1B9A", icon: "📦" },
  { bg: "#FFF8E1", border: "#F59E0B", iconBg: "#F59E0B", titleColor: "#92400E", icon: "🛍️" },
  { bg: "#E8F4FD", border: "#3B82F6", iconBg: "#2563EB", titleColor: "#1E3A8A", icon: "🏷️" },
];


/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */


const CosmeticPersonalCareView = ({
  productName,
  productDescription,
  warningsPrecautions,
  displayImages = [],
  cosAttr,
  storageConditionName,
  brochureUrl,
  placeholderImage = "/assets/images/SellerMed.jpg",
  promotionalSchemes = [],
  packagingDetails,
  pricingDetails,
  taxDetails,
  onEdit,
  onClose,
  additionalDiscounts = [],
  specialSchemes = [],
}: CosmeticPersonalCareViewProps) => {
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);


  /* ── Resolve cert docs ── */
  const certDocs: CertificateDocument[] = (cosAttr?.certificateDocuments ?? []).filter(
    (c) => isValidUrl(c.certificateUrl),
  );


  /* ── Resolve storage condition ──────────────────────────────────────────────
     Priority:
     1. storageConditionName prop (passed from parent, resolved from master list)
     2. cosAttr.storageCondition or storageConditionName (if parent pre-resolved)
     3. Fallback to empty string (never show a raw ID)
  */
  const storageCondition =
    storageConditionName?.trim() ||
    cosAttr?.storageConditionName?.trim() ||
    cosAttr?.storageCondition?.trim() ||
    null;


  /* ── Resolve long-form text ── */
  const resolvedProductDescription = productDescription ?? cosAttr?.productDescription ?? null;
  const resolvedWarnings =
    warningsPrecautions ??
    resolveField(cosAttr, "warningsPrecautions", "WarningsPrecautions") ??
    null;


  /* ── Resolve variant name ── */
  const variantNameDisplay = resolveField(cosAttr, "VariantName", "variantName") ?? null;


  /* ── Resolve gender ── */
  const genderDisplay = resolveField(cosAttr, "Gender", "gender") ?? null;


  /* ── Resolve net quantity ── */
  const netQtyDisplay =
    resolveField(cosAttr, "netQuantityStrength", "NetQuantityStrength", "netQuantity") ?? null;


  /* ── Resolve active ingredients ── */
  const activeIngredientsDisplay =
    resolveField(cosAttr, "ActiveIngredients", "activeIngredients") ?? null;


  /* ── Resolve product claims ── */
  const productClaimsDisplay =
    resolveField(cosAttr, "ProductClaims", "productClaims") ?? null;


  /* ── Resolve intended use area ───────────────────────────────────────────────
     The parent should pre-resolve this via buildCosAttrForView().
     If not, we handle the raw object array [{areaName, useAreaId}] here as fallback.
  */
  const intendedUseDisplay =
    cosAttr?.intendedUseArea ||
    resolveListOrObjects(
      cosAttr?.intendedUseAreas as string | string[] | Record<string, unknown>[],
      ["areaName", "name"],           // label keys to try on object items
    ) ||
    null;


  /* ── Resolve skin/hair display ───────────────────────────────────────────────
     Parent should pre-resolve via buildCosAttrForView → cosAttr.skinHairType.
     Fallback: extract typeName from object arrays.
  */
  const skinHairDisplay = (() => {
    if (cosAttr?.skinHairType) return cosAttr.skinHairType;
    const skin = resolveListOrObjects(
      cosAttr?.skinTypes as string | string[] | Record<string, unknown>[],
      ["typeName", "name"],
    );
    const hair = resolveListOrObjects(
      cosAttr?.hairTypes as string | string[] | Record<string, unknown>[],
      ["typeName", "name"],
    );
    const parts = [skin, hair].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  })();


  /* ── Resolve product subtype ─────────────────────────────────────────────────
     API field is "productSubcategoryId" (not "productSubTypeId").
     Parent should resolve this to a label string and pass it as cosAttr.productSubtype.
  */
  const productSubtypeDisplay =
    cosAttr?.productSubtype ?? cosAttr?.productSubType ?? null;


  /* ── Resolve country ── */
  const countryDisplay = cosAttr?.countryOfOrigin ?? cosAttr?.countryName ?? null;


  /* ── Images ── */
  const imagesToShow = displayImages;


  /* ── Brochure ── */
  const resolvedBrochureUrl = isValidUrl(brochureUrl)
    ? brochureUrl
    : isValidUrl(cosAttr?.brochurePath)
    ? cosAttr!.brochurePath!
    : isValidUrl(cosAttr?.BrochurePath)
    ? cosAttr!.BrochurePath!
    : null;


  /* ── Pack size display ── */
  const resolvedPackLabel = packagingDetails?.packTypeName?.trim() || packagingDetails?.packType?.trim() || "packs";
  const packSizeDisplay = (() => {
    if (!packagingDetails) return null;
    const n = packagingDetails.numberOfPacks;
    const u = packagingDetails.unitsPerPack ?? packagingDetails.unitPerPack;
    if (n && u) return `${n} ${resolvedPackLabel} × ${u} units = ${Number(n) * Number(u)} units`;
    if (packagingDetails.packSize) return String(packagingDetails.packSize);
    return null;
  })();


  /* ── Batch / pricing helpers ── */
  const batchNumber = pricingDetails?.batchNumber ?? pricingDetails?.batchLotNumber ?? null;
  const shelfLife = pricingDetails?.shelfLife ?? null;
  const gstPct = taxDetails?.gstPercentage ?? pricingDetails?.gstPercentage ?? null;
  const hsnCode = taxDetails?.hsnCode ?? pricingDetails?.hsnCode ?? null;


  return (
    <div style={{ background: "#FFFFFF", fontFamily: FONTS.workSans }}>
      {/* ── Page Header ── */}
      {(onEdit || onClose) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 12, padding: "20px 0 16px", borderBottom: "1px solid #E5E5E5", marginBottom: 24 }}>
          {onEdit && (
            <button type="button" onClick={onEdit} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", background: "#4B0082", color: "#FFFFFF", border: "none", borderRadius: 8, fontSize: 14, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "20px", cursor: "pointer" }}>
              <Edit2 size={14} /> Edit
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", background: "#FFFFFF", color: "#FF3B3B", border: "1.5px solid #FF3B3B", borderRadius: 8, fontSize: 14, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "20px", cursor: "pointer" }}>
              <X size={14} /> Close
            </button>
          )}
        </div>
      )}


      {/* ── Product Details Section ── */}
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}>
          <h2 style={{ color: "#4A0D75", background: "#F8EDFF", borderLeft: "4px solid #6C12A9", borderRadius: 6, padding: "6px 12px", fontSize: 18, fontWeight: 700, lineHeight: "26px", margin: 0 }}>
            Product Details
          </h2>
        </div>



        {/* ── Two-column field rows ── */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <ProductImageGallery className="mb-2" images={imagesToShow} placeholderImage={placeholderImage} />
            <FieldRow label="Product Name" value={productName} multiline bold />
            <FieldRow label="Product Type" value={cosAttr?.productType} />
            {/* FIX: productSubtype resolved from parent; falls back to productSubType */}
            <FieldRow label="Product Subtype" value={productSubtypeDisplay} />
            <FieldRow label="Brand Name" value={cosAttr?.brandName} />
            <FieldRow label="Variant Name" value={variantNameDisplay} required={false} />
            <FieldRow label="Gender" value={genderDisplay} />
            {/* FIX: intendedUseArea now handles both string and [{areaName}] objects */}
            <FieldRow label="Intended Use Area" value={intendedUseDisplay} multiline />
            <FieldRow label="Product Form" value={cosAttr?.productForm ?? null} />
            {/* FIX: skinHairDisplay now handles [{typeName}] object arrays */}
            <FieldRow label="Skin / Hair Type" value={skinHairDisplay} multiline required={false} />
            <FieldRow label="Age Group" value={cosAttr?.ageGroup} />
            <FieldRow label="Net Quantity / Strength" value={netQtyDisplay} />
            <FieldRow label="Active Ingredients" value={activeIngredientsDisplay} multiline />
          </div>


          {/* RIGHT COLUMN */}
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <FieldRow label="Product Claims" value={productClaimsDisplay} multiline />
            {/* FIX: storageCondition resolved from prop > cosAttr.storageCondition (never raw ID) */}
            <FieldRow label="Storage Condition" value={storageCondition} multiline />
            <FieldRow label="Manufacturer Name" value={cosAttr?.manufacturerName} />
            <FieldRow label="Country of Origin" value={countryDisplay} />


            {/* ── Uploaded Product Brochure ── */}
            <div style={{ paddingTop: 12, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderBottom: "1px #D5D5D4 solid", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={LABEL_TEXT}>Uploaded Product Brochure</span>
                {/* <span style={REQUIRED_STAR}>*</span> */}
              </div>
              {resolvedBrochureUrl ? (
                <a href={resolvedBrochureUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F8F8F9", borderRadius: 8, textDecoration: "none" }}>
                  <FileText size={24} color="#3C3D3A" />
                  <span style={{ color: "#3C3D3A", fontSize: 14, fontFamily: FONTS.openSans, fontWeight: 400, lineHeight: "22px" }}>
                    {resolvedBrochureUrl.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
                  </span>
                </a>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F8F8F9", borderRadius: 8 }}>
                  <FileText size={24} color="#3C3D3A" />
                  <span style={{ color: "#5A5B58", fontSize: 14, fontFamily: FONTS.openSans, fontWeight: 400, lineHeight: "22px" }}>No brochure uploaded</span>
                </div>
              )}
            </div>


            {/* ── Certifications / Compliance ── */}
            {certDocs.length > 0 && (
              <div style={{ paddingTop: 12, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderBottom: "1px #D5D5D4 solid", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                  <span style={LABEL_TEXT}>Certifications / Compliance</span>
                  <span style={REQUIRED_STAR}>*</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
                  {certDocs.map((cert, idx) => {
                    const c = CERT_COLORS[idx % CERT_COLORS.length];
                    return (
                      <button key={cert.certificationId} type="button" onClick={() => { setActiveCertDoc(cert); setShowCertModal(true); }} style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, background: c.bg, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONTS.notoSans, fontSize: 14, fontWeight: 500, lineHeight: "20px", color: c.color }}>
                        <PiSealCheckLight size={16} />
                        {cert.certificationName ?? cert.label ?? `Cert ${cert.certificationId}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <FullWidthBlock label="Product Description" value={resolvedProductDescription} />
            <FullWidthBlock label="Warnings & Precautions" value={resolvedWarnings} />
          </div>
        </div>
      </div>





      <div style={{ height: 40 }} />


      {/* ── Certificate Modal ── */}
      {showCertModal && activeCertDoc !== null && (
        <div onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.50)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 16, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", width: "100%", maxWidth: 672, margin: "0 16px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px #D5D5D4 solid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "#DCF7CB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PiSealCheckLight size={20} color="#378200" />
                </div>
                <div>
                  <p style={{ color: "#1E1E1D", fontSize: 14, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "22px", margin: 0 }}>{activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}</p>
                  <p style={{ color: "#5A5B58", fontSize: 12, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "18px", margin: 0 }}>Certification Document</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <a href={activeCertDoc.certificateUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "#378200", fontSize: 14, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "20px", textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>
                  <ExternalLink size={14} /> Open
                </a>
                <button type="button" onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#5A5B58", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", background: "#F5F5F5", padding: 16, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
              {isImageUrl(activeCertDoc.certificateUrl) ? (
                <img src={activeCertDoc.certificateUrl} alt={activeCertDoc.certificationName ?? "Certificate"} style={{ maxWidth: "100%", maxHeight: 600, objectFit: "contain", borderRadius: 8 }} />
              ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
                <iframe src={activeCertDoc.certificateUrl} title="Certificate PDF" style={{ width: "100%", height: 560, border: "none", borderRadius: 8 }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0" }}>
                  <div style={{ width: 64, height: 64, background: "#DCF7CB", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={32} color="#378200" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "#1E1E1D", fontSize: 14, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "22px", margin: "0 0 8px" }}>{activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}</p>
                    <p style={{ color: "#5A5B58", fontSize: 14, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "20px", margin: "0 0 16px" }}>This file cannot be previewed in the browser.</p>
                    <a href={activeCertDoc.certificateUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#47A400", color: "white", fontSize: 14, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "20px", padding: "10px 20px", borderRadius: 8, textDecoration: "none" }}>
                      <ExternalLink size={14} /> Open / Download
                    </a>
                  </div>
                </div>
              )}
            </div>
            {certDocs.length > 1 && (
              <div style={{ borderTop: "1px #D5D5D4 solid", padding: "12px 24px", display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
                <span style={{ color: "#5A5B58", fontSize: 12, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "18px", flexShrink: 0 }}>Other certs:</span>
                {certDocs.filter((c) => c.certificationId !== activeCertDoc.certificationId).map((cert) => {
                  const idx = certDocs.findIndex((c) => c.certificationId === cert.certificationId);
                  const cl = CERT_COLORS[idx % CERT_COLORS.length];
                  return (
                    <button key={cert.certificationId} type="button" onClick={() => setActiveCertDoc(cert)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, color: cl.color, background: cl.bg, fontSize: 12, fontFamily: FONTS.notoSans, fontWeight: 500, lineHeight: "18px", padding: "6px 12px", borderRadius: 9999, border: "none", cursor: "pointer" }}>
                      <PiSealCheckLight size={12} />
                      {cert.certificationName ?? cert.label ?? `Cert ${cert.certificationId}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export { CosmeticPersonalCareView as CosmeticView };
export default CosmeticPersonalCareView;