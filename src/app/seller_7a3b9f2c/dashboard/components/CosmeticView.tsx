"use client";

import React, { useState } from "react";
import { FileText, ExternalLink, Edit2, X } from "lucide-react";
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
  productType?: string;
  productSubtype?: string;
  productSubType?: string;
  brandName?: string;
  variantName?: string;
  gender?: string;
  intendedUseArea?: string;
  intendedUseAreas?: string | string[];
  skinHairType?: string;
  skinTypes?: string | string[];
  hairTypes?: string | string[];
  ageGroup?: string;
  netQuantityStrength?: string;
  netQuantity?: string;
  activeIngredients?: string;
  productClaims?: string;
  storageCondition?: string;
  storageConditionName?: string;
  storageConditionId?: number;
  manufacturerName?: string;
  countryOfOrigin?: string;
  countryName?: string;
  brochurePath?: string;
  certificateDocuments?: CertificateDocument[];
  productDescription?: string;
  warningsPrecautions?: string;
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
}

/* ─────────────────────────────────────────────────────────
   SHARED STYLES  (mirrors ConsumableView exactly)
───────────────────────────────────────────────────────── */

const FONTS = {
  workSans: "'Work Sans', 'Segoe UI', sans-serif",
  notoSans: "'Noto Sans', 'Segoe UI', sans-serif",
  openSans: "'Open Sans', 'Segoe UI', sans-serif",
};

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

const resolveList = (
  val: string | string[] | undefined | null,
): string | null => {
  if (!val) return null;
  if (Array.isArray(val)) return val.filter(Boolean).join(", ") || null;
  return val.trim() || null;
};

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
    return new Date(val).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return val;
  }
};

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS  (identical API to ConsumableView)
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

/* Full-width block for long text (description, warnings, etc.) */
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
        fontSize: 16,
        fontFamily: FONTS.notoSans,
        fontWeight: 400,
        lineHeight: "24px",
        wordWrap: "break-word",
        margin: 0,
        whiteSpace: "pre-wrap",
      }}
    >
      {value ?? "—"}
    </p>
  </div>
);

/* Section heading (mirrors ConsumableView's h2 style) */
const SectionHeading = ({ title }: { title: string }) => (
  <div
    style={{
      paddingTop: 8,
      paddingBottom: 8,
      borderBottom: "1px #D5D5D4 solid",
      marginTop: 32,
    }}
  >
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
      {title}
    </h2>
  </div>
);

/* Sub-section label (batch, pricing, tax) */
const SubHeading = ({ title }: { title: string }) => (
  <div
    style={{
      paddingTop: 8,
      paddingBottom: 4,
      borderBottom: "1px #D5D5D4 solid",
      marginTop: 20,
      marginBottom: 4,
    }}
  >
    <h3
      style={{
        color: "#1E1E1D",
        fontSize: 20,
        fontFamily: FONTS.workSans,
        fontWeight: 500,
        lineHeight: "28px",
        margin: 0,
      }}
    >
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
}: CosmeticPersonalCareViewProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);

  /* ── Resolve cert docs ── */
  const certDocs: CertificateDocument[] = (
    cosAttr?.certificateDocuments ?? []
  ).filter((c) => isValidUrl(c.certificateUrl));

  /* ── Resolve storage condition ── */
  const storageCondition =
    storageConditionName ??
    cosAttr?.storageConditionName?.trim() ??
    cosAttr?.storageCondition?.trim() ??
    null;

  /* ── Resolve long-form text ── */
  const resolvedProductDescription =
    productDescription ?? cosAttr?.productDescription ?? null;
  const resolvedWarnings =
    warningsPrecautions ?? cosAttr?.warningsPrecautions ?? null;

  /* ── Resolve skin/hair display ── */
  const skinHairDisplay = (() => {
    if (cosAttr?.skinHairType) return cosAttr.skinHairType;
    const parts: string[] = [];
    const skin = resolveList(cosAttr?.skinTypes);
    const hair = resolveList(cosAttr?.hairTypes);
    if (skin) parts.push(skin);
    if (hair) parts.push(hair);
    return parts.join(", ") || null;
  })();

  /* ── Resolve intended use area ── */
  const intendedUseDisplay =
    cosAttr?.intendedUseArea || resolveList(cosAttr?.intendedUseAreas) || null;

  /* ── Resolve country ── */
  const countryDisplay =
    cosAttr?.countryOfOrigin ?? cosAttr?.countryName ?? null;

  /* ── Resolve net quantity ── */
  const netQtyDisplay =
    cosAttr?.netQuantityStrength ?? cosAttr?.netQuantity ?? null;

  /* ── Resolve product subtype ── */
  const productSubtypeDisplay =
    cosAttr?.productSubtype ?? cosAttr?.productSubType ?? null;

  /* ── Images ── */
  const imagesToShow =
    displayImages.length > 0 ? displayImages : [placeholderImage];

  /* ── Brochure ── */
  const resolvedBrochureUrl = isValidUrl(brochureUrl)
    ? brochureUrl
    : isValidUrl(cosAttr?.brochurePath)
    ? cosAttr!.brochurePath!
    : null;

  /* ── Pack size display ── */
  const packSizeDisplay = (() => {
    if (!packagingDetails) return null;
    const n = packagingDetails.numberOfPacks;
    const u = packagingDetails.unitsPerPack ?? packagingDetails.unitPerPack;
    if (n && u)
      return `${n} packs × ${u} units = ${Number(n) * Number(u)} units`;
    if (packagingDetails.packSize) return String(packagingDetails.packSize);
    return null;
  })();

  /* ── Batch / pricing helpers ── */
  const batchNumber =
    pricingDetails?.batchNumber ??
    pricingDetails?.batchLotNumber ??
    null;
  const shelfLife = pricingDetails?.shelfLife ?? null;
  const gstPct = taxDetails?.gstPercentage ?? pricingDetails?.gstPercentage ?? null;
  const hsnCode = taxDetails?.hsnCode ?? pricingDetails?.hsnCode ?? null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        minHeight: "100vh",
        fontFamily: FONTS.workSans,
      }}
    >
      {/* ── Page Header ── */}
      {(onEdit || onClose) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 12,
            padding: "20px 0 16px",
            borderBottom: "1px solid #E5E5E5",
            marginBottom: 24,
          }}
        >
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                background: "#4B0082",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: FONTS.workSans,
                fontWeight: 600,
                lineHeight: "20px",
                cursor: "pointer",
              }}
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                background: "#FFFFFF",
                color: "#FF3B3B",
                border: "1.5px solid #FF3B3B",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: FONTS.workSans,
                fontWeight: 600,
                lineHeight: "20px",
                cursor: "pointer",
              }}
            >
              <X size={14} />
              Close
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PRODUCT DETAILS SECTION
      ══════════════════════════════════════════════════ */}
      <div
        style={{
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Section header */}
        <div
          style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}
        >
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
        <div
          style={{
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <p
            style={{
              color: "#1E1E1D",
              fontSize: 18,
              fontFamily: FONTS.openSans,
              fontWeight: 600,
              lineHeight: "24px",
              margin: 0,
            }}
          >
            Product Images
          </p>

          <div
            style={{
              padding: 12,
              background: "#F8F5FF",
              borderRadius: 12,
              outline: "1px #B550FA solid",
              outlineOffset: -1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
            >
              {imagesToShow.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    position: "relative",
                    height: 276,
                    boxShadow:
                      "0px 2px 4px -2px rgba(0,0,0,0.10), 0px 4px 6px -1px rgba(0,0,0,0.10)",
                    overflow: "hidden",
                    borderRadius: 12,
                    outline:
                      idx === selectedImageIndex ? "1px #B550FA solid" : "none",
                    outlineOffset: -1,
                    cursor: "pointer",
                  }}
                >
                  <Image
                    src={img}
                    alt={`Product image ${idx + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized={img.startsWith("http")}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = placeholderImage;
                    }}
                  />
                  {idx === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        top: 10,
                        padding: "4px 8px",
                        background: "#B550FA",
                        borderRadius: 4,
                      }}
                    >
                      <span
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontFamily: FONTS.openSans,
                          fontWeight: 600,
                          lineHeight: "18px",
                        }}
                      >
                        Primary
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {Array.from({
                length: Math.max(0, 4 - imagesToShow.length),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    height: 276,
                    borderRadius: 12,
                    background: "#F5F5F5",
                    boxShadow: "0px 1px 2px -1px rgba(0,0,0,0.10)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Two-column field rows ── */}
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <FieldRow label="Product Name" value={productName} multiline />
            <FieldRow label="Product Type" value={cosAttr?.productType} />
            <FieldRow label="Product Subtype" value={productSubtypeDisplay} />
            <FieldRow label="Brand Name" value={cosAttr?.brandName} />
            <FieldRow
              label="Variant Name"
              value={cosAttr?.variantName || null}
              required={false}
            />
            <FieldRow label="Gender" value={cosAttr?.gender} />
            <FieldRow
              label="Intended Use Area"
              value={intendedUseDisplay}
              multiline
            />
            <FieldRow
              label="Skin / Hair Type"
              value={skinHairDisplay}
              multiline
              required={false}
            />
            <FieldRow label="Age Group" value={cosAttr?.ageGroup} />
            <FieldRow
              label="Net Quantity / Strength"
              value={netQtyDisplay}
            />
            <FieldRow
              label="Active Ingredients"
              value={cosAttr?.activeIngredients}
              multiline
            />
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <FieldRow
              label="Product Claims"
              value={cosAttr?.productClaims}
              multiline
            />
            <FieldRow
              label="Storage Condition"
              value={storageCondition}
              multiline
            />
            <FieldRow
              label="Manufacturer Name"
              value={cosAttr?.manufacturerName}
            />
            <FieldRow
              label="Country of Origin"
              value={countryDisplay}
            />

            {/* ── Uploaded Product Brochure ── */}
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
              {resolvedBrochureUrl ? (
                <a
                  href={resolvedBrochureUrl}
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
                    {resolvedBrochureUrl.split("/").pop()?.split("?")[0] ||
                      "product-brochure.pdf"}
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

            {/* ── Certifications / Compliance ── */}
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
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 4 }}
                >
                  <span style={LABEL_TEXT}>Certifications / Compliance</span>
                  <span style={REQUIRED_STAR}>*</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignContent: "flex-start",
                  }}
                >
                  {certDocs.map((cert) => (
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
                        background: "#DCF7CB",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontFamily: FONTS.notoSans,
                        fontSize: 16,
                        fontWeight: 500,
                        lineHeight: "24px",
                        color: "#378200",
                      }}
                    >
                      <PiSealCheckLight size={16} />
                      {cert.certificationName ??
                        cert.label ??
                        `Cert ${cert.certificationId}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Product Description (full width) ── */}
        <FullWidthBlock label="Product Description" value={resolvedProductDescription} />

        {/* ── Warnings & Precautions (full width) ── */}
        <FullWidthBlock label="Warnings &amp; Precautions" value={resolvedWarnings} />
      </div>

      {/* ══════════════════════════════════════════════════
          SPECIAL OFFERS & PROMOTIONAL SCHEMES
      ══════════════════════════════════════════════════ */}
      {promotionalSchemes.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <SectionHeading title="Special Offers &amp; Promotional Schemes" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 16,
            }}
          >
            {promotionalSchemes.map((scheme, idx) => {
              const style = SCHEME_STYLES[idx % SCHEME_STYLES.length];
              const validityText = scheme.isOngoing
                ? "Valid: Ongoing"
                : scheme.validFrom && scheme.validTo
                ? `Valid: ${scheme.validFrom} - ${scheme.validTo}`
                : null;

              return (
                <div
                  key={idx}
                  style={{
                    background: style.bg,
                    border: `1.5px solid ${style.border}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: style.iconBg,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 16,
                      }}
                    >
                      {style.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          color: style.titleColor,
                          fontSize: 14,
                          fontFamily: FONTS.workSans,
                          fontWeight: 600,
                          lineHeight: "20px",
                          margin: "0 0 4px",
                        }}
                      >
                        {scheme.schemeTitle}
                      </p>
                      <p
                        style={{
                          color: "#3C3D3A",
                          fontSize: 13,
                          fontFamily: FONTS.notoSans,
                          fontWeight: 400,
                          lineHeight: "19px",
                          margin: 0,
                        }}
                      >
                        {scheme.schemeDescription}
                      </p>
                      {validityText && (
                        <p
                          style={{
                            color: "#5A5B58",
                            fontSize: 11,
                            fontFamily: FONTS.notoSans,
                            fontWeight: 400,
                            lineHeight: "16px",
                            margin: "6px 0 0",
                          }}
                        >
                          {validityText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PACKAGING & ORDER DETAILS
      ══════════════════════════════════════════════════ */}
      {packagingDetails && (
        <>
          <SectionHeading title="Packaging &amp; Order Details" />
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow
                label="Pack Type"
                value={
                  packagingDetails.packTypeName ??
                  packagingDetails.packType ??
                  null
                }
              />
              <FieldRow
                label="Units per Pack"
                value={formatVal(
                  packagingDetails.unitsPerPack ?? packagingDetails.unitPerPack,
                )}
              />
              <FieldRow
                label="Number of Packs"
                value={formatVal(packagingDetails.numberOfPacks)}
              />
              <FieldRow
                label="Pack Size (Total Units)"
                value={packSizeDisplay}
              />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow
                label="Min. Order Quantity"
                value={formatVal(packagingDetails.minimumOrderQuantity)}
              />
              <FieldRow
                label="Max. Order Quantity"
                value={formatVal(packagingDetails.maximumOrderQuantity)}
              />
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          BATCH, STOCK & EXPIRY
      ══════════════════════════════════════════════════ */}
      {pricingDetails && (
        <>
          <SubHeading title="Batch, Stock &amp; Expiry" />
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="Batch Number" value={batchNumber} />
              <FieldRow
                label="Manufacturing Date"
                value={formatDate(pricingDetails.manufacturingDate)}
              />
              <FieldRow
                label="Expiry Date"
                value={formatDate(pricingDetails.expiryDate)}
              />
              <FieldRow
                label="Shelf Life"
                value={shelfLife}
                required={false}
              />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow
                label="Stock Quantity"
                value={formatVal(pricingDetails.stockQuantity)}
              />
              <FieldRow
                label="Date of Stock Entry"
                value={formatDate(pricingDetails.dateOfStockEntry)}
                required={false}
              />
            </div>
          </div>

          {/* ── Pricing ── */}
          <SubHeading title="Pricing" />
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow
                label="MRP (per Pack Size)"
                value={formatCurrency(pricingDetails.mrp)}
              />
              <FieldRow
                label="Selling Price (per Pack Size)"
                value={formatCurrency(pricingDetails.sellingPrice)}
              />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow
                label="Discount %"
                value={
                  pricingDetails.discountPercentage != null &&
                  pricingDetails.discountPercentage !== ""
                    ? `${pricingDetails.discountPercentage}%`
                    : "—"
                }
                required={false}
              />
              <FieldRow
                label="Final Price"
                value={formatCurrency(pricingDetails.finalPrice)}
              />
            </div>
          </div>

          {/* ── Tax ── */}
          <SubHeading title="Tax &amp; Billing" />
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow
                label="GST %"
                value={gstPct != null && gstPct !== "" ? `${gstPct}%` : "—"}
              />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="HSN Code" value={formatVal(hsnCode)} />
            </div>
          </div>
        </>
      )}

      {/* Bottom padding */}
      <div style={{ height: 40 }} />

      {/* ══════════════════════════════════════════════════
          CERTIFICATE MODAL
      ══════════════════════════════════════════════════ */}
      {showCertModal && activeCertDoc !== null && (
        <div
          onClick={() => {
            setShowCertModal(false);
            setActiveCertDoc(null);
          }}
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
                  <p
                    style={{
                      color: "#1E1E1D",
                      fontSize: 16,
                      fontFamily: FONTS.workSans,
                      fontWeight: 600,
                      lineHeight: "22px",
                      margin: 0,
                    }}
                  >
                    {activeCertDoc.certificationName ??
                      activeCertDoc.label ??
                      `Certificate ${activeCertDoc.certificationId}`}
                  </p>
                  <p
                    style={{
                      color: "#5A5B58",
                      fontSize: 12,
                      fontFamily: FONTS.notoSans,
                      fontWeight: 400,
                      lineHeight: "18px",
                      margin: 0,
                    }}
                  >
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
                  onClick={() => {
                    setShowCertModal(false);
                    setActiveCertDoc(null);
                  }}
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
                  style={{
                    maxWidth: "100%",
                    maxHeight: 600,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
              ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
                <iframe
                  src={activeCertDoc.certificateUrl}
                  title="Certificate PDF"
                  style={{
                    width: "100%",
                    height: 560,
                    border: "none",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    padding: "32px 0",
                  }}
                >
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
                    <p
                      style={{
                        color: "#1E1E1D",
                        fontSize: 16,
                        fontFamily: FONTS.workSans,
                        fontWeight: 600,
                        lineHeight: "22px",
                        margin: "0 0 8px",
                      }}
                    >
                      {activeCertDoc.certificationName ??
                        activeCertDoc.label ??
                        `Certificate ${activeCertDoc.certificationId}`}
                    </p>
                    <p
                      style={{
                        color: "#5A5B58",
                        fontSize: 14,
                        fontFamily: FONTS.notoSans,
                        fontWeight: 400,
                        lineHeight: "20px",
                        margin: "0 0 16px",
                      }}
                    >
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
                <span
                  style={{
                    color: "#5A5B58",
                    fontSize: 12,
                    fontFamily: FONTS.notoSans,
                    fontWeight: 400,
                    lineHeight: "18px",
                    flexShrink: 0,
                  }}
                >
                  Other certs:
                </span>
                {certDocs
                  .filter(
                    (c) => c.certificationId !== activeCertDoc.certificationId,
                  )
                  .map((cert) => (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => setActiveCertDoc(cert)}
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#378200",
                        background: "#DCF7CB",
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
                      {cert.certificationName ??
                        cert.label ??
                        `Cert ${cert.certificationId}`}
                    </button>
                  ))}
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