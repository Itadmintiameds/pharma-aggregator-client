"use client";


import React, { useState } from "react";
import { FileText, ExternalLink, Gift, ShoppingBag, Tag, BadgePercent } from "lucide-react";
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


export interface ConsumableAttributes {
  brochurePath?: string;
  brochureType?: string;
  certificateDocuments?: CertificateDocument[];
  keyFeaturesSpecifications?: string;
  storageConditionId?: number;
  storageCondition?: string;
  storageConditionName?: string;
  purpose?: string;
  brandName?: string;
  manufacturerName?: string;
  sterileOrNonSterile?: string;
  disposalOrReusable?: string;
  shelfLife?: string;
  safetyInstructions?: string;
  dimensionSize?: string;
  materialTypes?: { materialTypeId: number; materialTypeName: string }[];
  /** May be absent from API — use deviceCategoryName prop instead */
  deviceCategoryName?: string;
  /** May be absent from API — use deviceSubCategoryName prop instead */
  deviceSubCategoryName?: string;
  usageType?: string;
}


export interface ConsumableViewProps {
  productName?: string | null;
  productDescription?: string | null;
  displayImages: string[];
  consAttr: ConsumableAttributes | null;
  storageConditionName?: string | null;
  /** Resolved device category name (looked up from deviceCatId by parent) */
  deviceCategoryName?: string | null;
  /** Resolved device subcategory name (looked up from deviceSubCatId by parent) */
  deviceSubCategoryName?: string | null;
  /** Resolved specification unit label (e.g. "mm", "cm") for the dimensionSize field */
  specificationUnitLabel?: string | null;
  brochureUrl?: string | null;
  placeholderImage?: string;
  countryName?: string | null;
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
  padding: "12px 16px",
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
  fontSize: 16,
  fontFamily: FONTS.workSans,
  fontWeight: 500,
  lineHeight: "24px",
  wordWrap: "break-word",
  margin: 0,
};


const REQUIRED_STAR: React.CSSProperties = {
  color: "#FF3B3B",
  fontSize: 16,
  fontFamily: FONTS.workSans,
  fontWeight: 500,
  lineHeight: "24px",
  flexShrink: 0,
};


const VALUE_TEXT: React.CSSProperties = {
  color: "#3C3D3A",
  fontSize: 16,
  fontFamily: FONTS.notoSans,
  fontWeight: 400,
  lineHeight: "24px",
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
  return !["", "PENDING", "NOT_UPLOADED"].includes(t);
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
}: {
  label: string;
  value?: string | number | null;
  required?: boolean;
  valueNode?: React.ReactNode;
  multiline?: boolean;
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
      <p style={VALUE_TEXT}>{value ?? "—"}</p>
    )}
  </div>
);


/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
   Renders only "Product Details" content.
   All common sections (Packaging, Batch, Pricing, TAX)
   are handled by the parent ProductView1.
───────────────────────────────────────────────────────── */


const ConsumableView = ({
  productName,
  productDescription,
  displayImages,
  consAttr,
  storageConditionName,
  deviceCategoryName,
  deviceSubCategoryName,
  specificationUnitLabel,
  brochureUrl,
  placeholderImage = "/assets/images/SellerMed.jpg",
  countryName,
  additionalDiscounts = [],
  specialSchemes = [],
}: ConsumableViewProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);


  const certDocs: CertificateDocument[] = (consAttr?.certificateDocuments ?? []).filter(
    (c) => isValidUrl(c.certificateUrl),
  );


  const storageCondition =
    storageConditionName ??
    consAttr?.storageConditionName?.trim() ??
    consAttr?.storageCondition?.trim() ??
    null;


  // Resolve device names: prefer explicit props (looked up by parent from IDs),
  // fall back to inline fields on consAttr (populated when API returns strings).
  const resolvedDeviceCategoryName =
    deviceCategoryName ?? consAttr?.deviceCategoryName ?? null;
  const resolvedDeviceSubCategoryName =
    deviceSubCategoryName ?? consAttr?.deviceSubCategoryName ?? null;


  const imagesToShow = displayImages;


  return (
    <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>


      {/* ── Section header ── */}
      <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}>
        <h2
          style={{
            color: "#1E1E1D",
            fontSize: 28,
            fontFamily: FONTS.workSans,
            fontWeight: 500,
            lineHeight: "36px",
            margin: 0,
          }}
        >
          Product Details
        </h2>
      </div>


      {/* ── Product Images ── */}
      <div className="flex flex-col gap-4 p-3 bg-[#F8F5FF] rounded-xl border border-pneutral-200 w-full min-h-[340px]">
        <h3 className="font-heading font-semibold text-[18px] leading-[24px] text-[#1E1E1D]">
          Product Images
        </h3>
        <div className="flex justify-center flex-wrap gap-3">
          {imagesToShow.slice(0, 5).map((img, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              className={`relative h-[274px] w-full max-w-[calc(20%-10px)] overflow-hidden rounded-xl cursor-pointer shadow-sm${idx === selectedImageIndex ? " outline outline-2 outline-primary-500 -outline-offset-1" : ""}`}
            >
              <Image
                src={img}
                alt={`Product image ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized={img.startsWith("http")}
                onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
              />
              {idx === 0 && (
                <div className="absolute left-[10px] top-[10px] px-2 py-1 bg-secondary-500 rounded-[4px]">
                  <span className="text-white text-xs font-body font-semibold leading-[18px]">Primary</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* ── Two-column field rows ── */}
      <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>


        {/* LEFT COLUMN */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
          <FieldRow label="Product Name" value={productName} multiline />
          {/* Use resolved names (from ID lookup) with fallback to inline consAttr fields */}
          <FieldRow label="Device Category" value={resolvedDeviceCategoryName} />
          <FieldRow label="Device Subcategory" value={resolvedDeviceSubCategoryName} />
          <FieldRow label="Brand Name" value={consAttr?.brandName} />
          <FieldRow
            label="Material Type"
            value={
              (consAttr?.materialTypes ?? []).length > 0
                ? consAttr!.materialTypes!.map((m) => m.materialTypeName).join(", ")
                : null
            }
          />
          <FieldRow
            label="Size / Dimension / Gauge"
            value={
              consAttr?.dimensionSize
                ? [consAttr.dimensionSize, specificationUnitLabel].filter(Boolean).join(" ")
                : null
            }
          />
          <FieldRow
            label="Usage Type"
            value={consAttr?.usageType ?? consAttr?.disposalOrReusable}
          />
          <FieldRow label="Intended Use / Purpose" value={consAttr?.purpose} multiline />
        </div>


        {/* RIGHT COLUMN */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
          <FieldRow label="Sterile / Non-Sterile" value={consAttr?.sterileOrNonSterile} />
          <FieldRow label="Storage Condition" value={storageCondition} multiline />
          <FieldRow label="Manufacturer Name" value={consAttr?.manufacturerName} />
          <FieldRow label="Country of Origin" value={countryName ?? (consAttr as any)?.countryName ?? (consAttr as any)?.countryOfOrigin ?? null} />


          {/* Uploaded Product Brochure */}
          <div
            style={{
              paddingTop: 12,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
              borderBottom: "1px #D5D5D4 solid",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={LABEL_TEXT}>Uploaded Product Brochure</span>
              <span style={REQUIRED_STAR}>*</span>
            </div>
            {brochureUrl ? (
              <a
                href={brochureUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  background: "#F8F8F9",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                <FileText size={24} color="#3C3D3A" />
                <span
                  style={{
                    color: "#3C3D3A",
                    fontSize: 16,
                    fontFamily: FONTS.openSans,
                    fontWeight: 400,
                    lineHeight: "22px",
                  }}
                >
                  product-brochure.pdf
                </span>
              </a>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  background: "#F8F8F9",
                  borderRadius: 8,
                }}
              >
                <FileText size={24} color="#3C3D3A" />
                <span
                  style={{
                    color: "#5A5B58",
                    fontSize: 16,
                    fontFamily: FONTS.openSans,
                    fontWeight: 400,
                    lineHeight: "22px",
                  }}
                >
                  No brochure uploaded
                </span>
              </div>
            )}
          </div>


          {/* Certifications / Compliance */}
          {certDocs.length > 0 && (
            <div
              style={{
                paddingTop: 12,
                paddingBottom: 8,
                paddingLeft: 16,
                paddingRight: 16,
                borderBottom: "1px #D5D5D4 solid",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                <span style={LABEL_TEXT}>Certifications / Compliance</span>
                <span style={REQUIRED_STAR}>*</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
                {certDocs.map((cert, idx) => {
                  const c = CERT_COLORS[idx % CERT_COLORS.length];
                  return (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => {
                        setActiveCertDoc(cert);
                        setShowCertModal(true);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 4,
                        paddingBottom: 4,
                        background: c.bg,
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontFamily: FONTS.notoSans,
                        fontSize: 16,
                        fontWeight: 500,
                        lineHeight: "24px",
                        color: c.color,
                      }}
                    >
                      <PiSealCheckLight size={16} />
                      {cert.certificationName ?? `Cert ${cert.certificationId}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ── Key Features + Safety Instructions side by side ── */}
      <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
        <div
          style={{
            flex: "1 1 0",
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
            <span style={LABEL_TEXT}>Key Features / Specifications</span>
            <span style={REQUIRED_STAR}>*</span>
          </div>
          {consAttr?.keyFeaturesSpecifications ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {consAttr.keyFeaturesSpecifications
                .split(/\n|;/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color: "#3C3D3A",
                      fontSize: 16,
                      fontFamily: FONTS.notoSans,
                      fontWeight: 400,
                      lineHeight: "24px",
                      wordWrap: "break-word",
                    }}
                  >
                    {line}
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: "#5A5B58", fontSize: 16, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "24px", margin: 0 }}>
              —
            </p>
          )}
        </div>


        <div
          style={{
            flex: "1 1 0",
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
            <span style={LABEL_TEXT}>Safety Instructions / Precautions</span>
            <span style={REQUIRED_STAR}>*</span>
          </div>
          <p
            style={{
              color: "#3C3D3A",
              fontSize: 16,
              fontFamily: FONTS.notoSans,
              fontWeight: 400,
              lineHeight: "24px",
              wordWrap: "break-word",
              margin: 0,
            }}
          >
            {consAttr?.safetyInstructions ?? "—"}
          </p>
        </div>
      </div>


      {/* ── Product Description (full width) ── */}
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
          <span style={LABEL_TEXT}>Product Description</span>
          <span style={REQUIRED_STAR}>*</span>
        </div>
        <p
          style={{
            color: "#3C3D3A",
            fontSize: 16,
            fontFamily: FONTS.notoSans,
            fontWeight: 400,
            lineHeight: "24px",
            wordWrap: "break-word",
            margin: 0,
          }}
        >
          {productDescription ?? "—"}
        </p>
      </div>


      {/* ── SPECIAL OFFERS & PROMOTIONAL SCHEMES ── */}
      {(additionalDiscounts.length > 0 || specialSchemes.length > 0) && (
        <div className="flex flex-col gap-4 pt-4 border-t border-pneutral-200 mt-2">
          <h4 className="text-[24px] font-heading font-medium leading-[32px] text-pneutral-900">
            Special Offers &amp; Promotional Schemes
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {specialSchemes.map((scheme, index) => {
              const themes = [
                { border: "#4EB300", bg: "#DCF7CB", text: "#47A400", Icon: Gift },
                { border: "#FFB020", bg: "#FFF8E7", text: "#D99100", Icon: ShoppingBag },
                { border: "#2563EB", bg: "#EFF6FF", text: "#2563EB", Icon: Tag },
              ];
              let theme = themes[index % themes.length];
              const type = (scheme.schemeType ?? "").toLowerCase();
              if (type === "bogo" || type === "buy_x_get_y") theme = themes[0];
              else if (type === "bundle") theme = themes[1];
              else if (type === "seasonal") theme = themes[2];
              const dateStr = scheme.effectiveStartDate && scheme.effectiveEndDate
                ? `Valid: ${new Date(scheme.effectiveStartDate).toLocaleDateString("en-GB")} - ${new Date(scheme.effectiveEndDate).toLocaleDateString("en-GB")}`
                : "Valid: Ongoing";
              return (
                <div key={index} className="flex flex-row items-start gap-4 border-2 rounded-xl p-[22px] h-[142px]" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md" style={{ backgroundColor: theme.border }}>
                    <theme.Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h5 className="font-heading font-medium text-[20px] leading-[28px] mb-1.5" style={{ color: theme.text }}>
                      {scheme.schemeName || "Special Scheme"}
                    </h5>
                    <p className="font-body font-medium text-[14px] leading-[20px] text-pneutral-900 line-clamp-2">
                      Purchase {scheme.buyQuantity} {productName || "this product"} and get {scheme.freeQuantity} absolutely free. Limited stock available!
                    </p>
                    <span className="font-body text-[12px] leading-[18px] text-pneutral-500 mt-1">{dateStr}</span>
                  </div>
                </div>
              );
            })}
            {additionalDiscounts.length > 0 && (
              <div className="flex flex-row items-start gap-4 border-2 rounded-xl p-[22px] bg-[#F8EDFF] border-[#6C12A9] h-[142px]">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md bg-[#6C12A9]">
                  <BadgePercent className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <h5 className="font-heading font-medium text-[20px] leading-[28px] text-[#6C12A9] mb-1.5">
                    Bulk Purchase Discount
                  </h5>
                  <p className="font-body font-medium text-[14px] leading-[20px] text-pneutral-900 line-clamp-2">
                    {additionalDiscounts.map((discount, i) => (
                      <span key={i}>
                        Get {discount.additionalDiscountPercentage}% off on orders of {discount.minimumPurchaseQuantity}+ units
                        {i < additionalDiscounts.length - 1 ? ", " : "."}
                      </span>
                    ))}
                  </p>
                  <span className="font-body text-[12px] leading-[18px] text-pneutral-500 mt-1">Valid: Ongoing</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── Certificate Modal ── */}
      {showCertModal && activeCertDoc !== null && (
        <div
          onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.50)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: 672,
              margin: "0 16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px #D5D5D4 solid",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "#DCF7CB",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PiSealCheckLight size={20} color="#378200" />
                </div>
                <div>
                  <p style={{ color: "#1E1E1D", fontSize: 16, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "22px", margin: 0 }}>
                    {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
                  </p>
                  <p style={{ color: "#5A5B58", fontSize: 12, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "18px", margin: 0 }}>
                    Certification Document
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <a
                  href={activeCertDoc.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#378200",
                    fontSize: 14,
                    fontFamily: FONTS.workSans,
                    fontWeight: 600,
                    lineHeight: "20px",
                    textDecoration: "none",
                    padding: "6px 12px",
                    borderRadius: 8,
                  }}
                >
                  <ExternalLink size={14} /> Open
                </a>
                <button
                  type="button"
                  onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#5A5B58",
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            </div>


            {/* Modal body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: "#F5F5F5",
                padding: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              {isImageUrl(activeCertDoc.certificateUrl) ? (
                <img
                  src={activeCertDoc.certificateUrl}
                  alt={activeCertDoc.certificationName ?? "Certificate"}
                  style={{ maxWidth: "100%", maxHeight: 600, objectFit: "contain", borderRadius: 8 }}
                />
              ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
                <iframe
                  src={activeCertDoc.certificateUrl}
                  title="Certificate PDF"
                  style={{ width: "100%", height: 560, border: "none", borderRadius: 8 }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0" }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: "#DCF7CB",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={32} color="#378200" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "#1E1E1D", fontSize: 16, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "22px", margin: "0 0 8px" }}>
                      {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
                    </p>
                    <p style={{ color: "#5A5B58", fontSize: 14, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "20px", margin: "0 0 16px" }}>
                      This file cannot be previewed in the browser.
                    </p>
                    <a
                      href={activeCertDoc.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#47A400",
                        color: "white",
                        fontSize: 14,
                        fontFamily: FONTS.workSans,
                        fontWeight: 600,
                        lineHeight: "20px",
                        padding: "10px 20px",
                        borderRadius: 8,
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={14} /> Open / Download
                    </a>
                  </div>
                </div>
              )}
            </div>


            {/* Other certs strip */}
            {certDocs.length > 1 && (
              <div
                style={{
                  borderTop: "1px #D5D5D4 solid",
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  overflowX: "auto",
                }}
              >
                <span style={{ color: "#5A5B58", fontSize: 12, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "18px", flexShrink: 0 }}>
                  Other certs:
                </span>
                {certDocs
                  .filter((c) => c.certificationId !== activeCertDoc.certificationId)
                  .map((cert) => {
                    const idx = certDocs.findIndex((c) => c.certificationId === cert.certificationId);
                    const cl = CERT_COLORS[idx % CERT_COLORS.length];
                    return (
                      <button
                        key={cert.certificationId}
                        type="button"
                        onClick={() => setActiveCertDoc(cert)}
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: cl.color,
                          background: cl.bg,
                          fontSize: 12,
                          fontFamily: FONTS.notoSans,
                          fontWeight: 500,
                          lineHeight: "18px",
                          padding: "6px 12px",
                          borderRadius: 9999,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
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


export default ConsumableView;
