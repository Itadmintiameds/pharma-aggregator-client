"use client";

import React, { useState, useEffect } from "react";
import { FileText, ExternalLink, Edit2, X } from "lucide-react";
import { PiSealCheckLight } from "react-icons/pi";
import Image from "next/image";
import { getProductById } from "@/src/services/product/ProductService";
import {
  // getProductById,
  getAgeGroups,
  getProductForms,
  getCountries,
  getStorageConditions,
  getPackTypesByCategory,
  getCertificationsByCategoryId,
  getProductCategories,
  getProductSubcategories,
} from "@/src/services/product/FoodInfantService";

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

export interface PricingDetails {
  mrp?: number | string;
  sellingPrice?: number | string;
  discountPercentage?: number | string;
  finalPrice?: number | string;
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

export interface FoodInfantAttributes {
  productCategoryName?: string | null;  
  productSubcategoryName?: string | null;  
  productFormName?: string | null;  
  ageGroupName?: string | null;  
  storageConditionName?: string | null;  
  countryName?: string | null;  
  brandName?: string;
  variantName?: string;
  netQuantity?: string;
  servingSize?: string;
  vegNonvegIndicator?: "veg" | "non-veg";
  allergenInformation?: string;
  nutritionalInformation?: string;
  nutritionalInformationImageUrl?: string;
  activeIngredients?: string;
  additivesPreservatives?: string;
  productClaims?: string;
  manufacturerName?: string;
  certificateDocuments?: CertificateDocument[];
  productUserManual?: string;
}

export interface FoodInfantViewProps {
  productName?: string | null;
  productDescription?: string | null;
  warningsPrecautions?: string | null;
  displayImages?: string[];
  foodAttr?: FoodInfantAttributes | null;
  storageConditionName?: string | null;
  brochureUrl?: string | null;
  placeholderImage?: string;
  packagingDetails?: {
    packTypeName?: string | null;  
    unitsPerPack?: number | string | null;
    unitPerPack?: number | string | null;
    numberOfPacks?: number | string | null;
    packSize?: number | string | null;
    minimumOrderQuantity?: number | string | null;
    maximumOrderQuantity?: number | string | null;
  } | null;
  pricingDetails?: {
    mrp?: number | string | null;
    sellingPrice?: number | string | null;
    discountPercentage?: number | string | null;
    finalPrice?: number | string | null;
    batchLotNumber?: string | null;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
    stockQuantity?: number | string | null;
    dateOfStockEntry?: string | null;
    shelfLife?: string | null;
    gstPercentage?: number | string | null;
    hsnCode?: string | number | null;
  } | null;
  taxDetails?: {
    gstPercentage?: number | string | null;
    hsnCode?: string | number | null;
  } | null;
  onEdit?: () => void;
  onClose?: () => void;
}

/* ─────────────────────────────────────────────────────────
   SHARED STYLES
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

const RadioDisplay = ({ value }: { value?: string | null }) => {
  if (!value) return <p style={VALUE_TEXT}>—</p>;
  const displayValue = value === "veg" ? "Veg" : "Non-Veg";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start", flex: 1 }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "2px solid #4B0082",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4B0082" }} />
      </div>
      <span style={{ ...VALUE_TEXT, textAlign: "left" }}>{displayValue}</span>
    </div>
  );
};

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

const SectionHeading = ({ title }: { title: string }) => (
  <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid", marginTop: 32 }}>
    <h2 style={{ color: "#1E1E1D", fontSize: 28, fontFamily: FONTS.workSans, fontWeight: 500, lineHeight: "36px", margin: 0 }}>
      {title}
    </h2>
  </div>
);

const SubHeading = ({ title }: { title: string }) => (
  <div style={{ paddingTop: 8, paddingBottom: 4, borderBottom: "1px #D5D5D4 solid", marginTop: 20, marginBottom: 4 }}>
    <h3 style={{ color: "#1E1E1D", fontSize: 20, fontFamily: FONTS.workSans, fontWeight: 500, lineHeight: "28px", margin: 0 }}>
      {title}
    </h3>
  </div>
);

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

const FoodInfantView = ({
  productName,
  productDescription,
  warningsPrecautions,
  displayImages = [],
  foodAttr,
  storageConditionName,
  brochureUrl,
  placeholderImage = "/assets/images/SellerMed.jpg",
  packagingDetails,
  pricingDetails,
  taxDetails,
  onEdit,
  onClose,
}: FoodInfantViewProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);

  // Resolve cert docs
  const certDocs: CertificateDocument[] = (foodAttr?.certificateDocuments ?? []).filter(
    (c) => isValidUrl(c.certificateUrl),
  );

  // Resolve storage condition
  const storageCondition =
    storageConditionName?.trim() ||
    foodAttr?.storageConditionName?.trim() ||
    null;

  // Resolve nutritional information display
  const nutritionalInfoDisplay = (() => {
    if (foodAttr?.nutritionalInformation === "as-per-label") {
      return "As per the label";
    }
    if (isValidUrl(foodAttr?.nutritionalInformationImageUrl)) {
      return foodAttr!.nutritionalInformationImageUrl;
    }
    return null;
  })();

  // Images
  const imagesToShow = displayImages.length > 0 ? displayImages : [placeholderImage];

  // Brochure URL
  const resolvedBrochureUrl = isValidUrl(brochureUrl)
    ? brochureUrl
    : isValidUrl(foodAttr?.productUserManual)
    ? foodAttr!.productUserManual
    : null;

  // Pack size display
  const packSizeDisplay = (() => {
    if (!packagingDetails) return null;
    const n = packagingDetails.numberOfPacks;
    const u = packagingDetails.unitsPerPack ?? packagingDetails.unitsPerPack;
    if (n && u) return `${n} packs × ${u} units = ${Number(n) * Number(u)} units`;
    if (packagingDetails.packSize) return String(packagingDetails.packSize);
    return null;
  })();

  // Batch / pricing helpers
  const batchNumber = pricingDetails?.batchLotNumber ?? pricingDetails?.batchLotNumber ?? null;
  const shelfLife = pricingDetails?.shelfLife ?? null;
  const gstPct = taxDetails?.gstPercentage ?? pricingDetails?.gstPercentage ?? null;
  const hsnCode = taxDetails?.hsnCode ?? pricingDetails?.hsnCode ?? null;

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", fontFamily: FONTS.workSans }}>
      {/* Page Header */}
      {/* {(onEdit || onClose) && (
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
      )} */}

      {/* Product Details Section */}
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}>
          <h2 style={{ color: "#1E1E1D", fontSize: 28, fontFamily: FONTS.workSans, fontWeight: 500, lineHeight: "36px", margin: 0 }}>
            Product Details
          </h2>
        </div>

        {/* Product Images */}
        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "#1E1E1D", fontSize: 18, fontFamily: FONTS.openSans, fontWeight: 600, lineHeight: "24px", margin: 0 }}>
            Product Images
          </p>
          <div style={{ padding: 12, background: "#F8F5FF", borderRadius: 12, outline: "1px #B550FA solid", outlineOffset: -1, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {imagesToShow.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    position: "relative",
                    height: 276,
                    boxShadow: "0px 2px 4px -2px rgba(0,0,0,0.10), 0px 4px 6px -1px rgba(0,0,0,0.10)",
                    overflow: "hidden",
                    borderRadius: 12,
                    outline: idx === selectedImageIndex ? "1px #B550FA solid" : "none",
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
                    <div style={{ position: "absolute", left: 10, top: 10, padding: "4px 8px", background: "#B550FA", borderRadius: 4 }}>
                      <span style={{ color: "white", fontSize: 12, fontFamily: FONTS.openSans, fontWeight: 600, lineHeight: "18px" }}>Primary</span>
                    </div>
                  )}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 4 - imagesToShow.length) }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: 276, borderRadius: 12, background: "#F5F5F5", boxShadow: "0px 1px 2px -1px rgba(0,0,0,0.10)" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Two-column field rows */}
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            <FieldRow label="Product Name" value={productName} multiline />
            <FieldRow label="Product Category" value={foodAttr?.productCategoryName} />
            <FieldRow label="Product Subcategory" value={foodAttr?.productSubcategoryName} />
            <FieldRow label="Brand Name" value={foodAttr?.brandName} />
            <FieldRow label="Variant Name" value={foodAttr?.variantName} required={false} />
            <FieldRow label="Product Form" value={foodAttr?.productFormName} />
            <FieldRow label="Net Quantity" value={foodAttr?.netQuantity} />
            <FieldRow label="Serving Size" value={foodAttr?.servingSize} />
            <FieldRow label="Age Group" value={foodAttr?.ageGroupName} />
            <FieldRow label="Product Claims" value={foodAttr?.productClaims} multiline />
            <FieldRow label="Active Ingredients" value={foodAttr?.activeIngredients} multiline />
            <FieldRow label="Additives / Preservatives" value={foodAttr?.additivesPreservatives} multiline required={false} />

            {/* Nutritional Information */}
            <div style={{ ...ROW, alignItems: "flex-start" }}>
              <div style={ROW_LABEL}>
                <span style={LABEL_TEXT}>Nutritional Information</span>
                <span style={REQUIRED_STAR}>*</span>
              </div>
              <div style={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}>
                {typeof nutritionalInfoDisplay === "string" && nutritionalInfoDisplay.startsWith("http") ? (
                  <a href={nutritionalInfoDisplay} target="_blank" rel="noopener noreferrer">
                    <img
                      src={nutritionalInfoDisplay}
                      alt="Nutritional Information"
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #D5D5D4",
                      }}
                    />
                  </a>
                ) : (
                  <p style={VALUE_TEXT}>{nutritionalInfoDisplay ?? "—"}</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
            {/* <FieldRow label="Product Claims" value={foodAttr?.productClaims} multiline /> */}
            <FieldRow label="Allergen Information" value={foodAttr?.allergenInformation} multiline />

            {/* Veg / Non-Veg Indicator */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #D5D5D4", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={LABEL_TEXT}>Veg / Non-Veg Indicator</span>
                <span style={REQUIRED_STAR}>*</span>
              </div>
              <RadioDisplay value={foodAttr?.vegNonvegIndicator} />
            </div>

            <FieldRow label="Storage Condition" value={storageCondition} multiline />
            <FieldRow label="Manufacturer Name" value={foodAttr?.manufacturerName} />
            

            {/* Uploaded Product Brochure */}
            <div style={{ paddingTop: 12, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderBottom: "1px #D5D5D4 solid", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={LABEL_TEXT}>Uploaded Product Brochure</span>
                <span style={REQUIRED_STAR}>*</span>
              </div>
              {resolvedBrochureUrl ? (
                <a href={resolvedBrochureUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F8F8F9", borderRadius: 8, textDecoration: "none" }}>
                  <FileText size={24} color="#3C3D3A" />
                  <span style={{ color: "#3C3D3A", fontSize: 16, fontFamily: FONTS.openSans, fontWeight: 400, lineHeight: "22px" }}>
                    {resolvedBrochureUrl.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
                  </span>
                </a>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F8F8F9", borderRadius: 8 }}>
                  <FileText size={24} color="#3C3D3A" />
                  <span style={{ color: "#5A5B58", fontSize: 16, fontFamily: FONTS.openSans, fontWeight: 400, lineHeight: "22px" }}>No brochure uploaded</span>
                </div>
              )}
            </div>

            <FieldRow label="Country of Origin" value={foodAttr?.countryName} />

            {/* Certifications / Compliance */}
            {certDocs.length > 0 && (
              <div style={{ paddingTop: 12, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderBottom: "1px #D5D5D4 solid", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                  <span style={LABEL_TEXT}>Certifications / Compliance</span>
                  <span style={REQUIRED_STAR}>*</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
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
                      {cert.certificationName ?? cert.label ?? `Cert ${cert.certificationId}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <FullWidthBlock label="Product Description" value={productDescription} />
        <FullWidthBlock label="Warnings & Precautions" value={warningsPrecautions} />
      </div>

      {/* Packaging & Order Details */}
      {packagingDetails && (
        <>
          <SectionHeading title="Packaging & Order Details" />
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="Pack Type" value={packagingDetails.packTypeName ?? packagingDetails.packTypeName ?? null} />
              <FieldRow label="Units per Pack" value={formatVal(packagingDetails.unitsPerPack ?? packagingDetails.unitsPerPack)} />
              <FieldRow label="Number of Packs" value={formatVal(packagingDetails.numberOfPacks)} />
              <FieldRow label="Pack Size (Total Units)" value={packSizeDisplay} />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="Min. Order Quantity" value={formatVal(packagingDetails.minimumOrderQuantity)} />
              <FieldRow label="Max. Order Quantity" value={formatVal(packagingDetails.maximumOrderQuantity)} />
            </div>
          </div>
        </>
      )}

      {/* Batch, Stock & Expiry */}
      {pricingDetails && (
        <>
          <SubHeading title="Batch, Stock & Expiry" />
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="Batch Number" value={batchNumber} />
              <FieldRow label="Manufacturing Date" value={formatDate(pricingDetails.manufacturingDate)} />
              <FieldRow label="Expiry Date" value={formatDate(pricingDetails.expiryDate)} />
              <FieldRow label="Shelf Life" value={shelfLife} required={false} />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="Stock Quantity" value={formatVal(pricingDetails.stockQuantity)} />
              <FieldRow label="Date of Stock Entry" value={formatDate(pricingDetails.dateOfStockEntry)} required={false} />
            </div>
          </div>

          <SubHeading title="Pricing" />
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="MRP (per Pack Size)" value={formatCurrency(pricingDetails.mrp)} />
              <FieldRow label="Selling Price (per Pack Size)" value={formatCurrency(pricingDetails.sellingPrice)} />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="Discount %" value={pricingDetails.discountPercentage != null && pricingDetails.discountPercentage !== "" ? `${pricingDetails.discountPercentage}%` : "—"} required={false} />
              <FieldRow label="Final Price" value={formatCurrency(pricingDetails.finalPrice)} />
            </div>
          </div>

          <SubHeading title="Tax & Billing" />
          <div style={{ display: "flex", gap: 36, alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="GST %" value={gstPct != null && gstPct !== "" ? `${gstPct}%` : "—"} />
            </div>
            <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
              <FieldRow label="HSN Code" value={formatVal(hsnCode)} />
            </div>
          </div>
        </>
      )}

      <div style={{ height: 40 }} />

      {/* Certificate Modal */}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px #D5D5D4 solid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "#DCF7CB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                  <div style={{ width: 64, height: 64, background: "#DCF7CB", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            {certDocs.length > 1 && (
              <div style={{ borderTop: "1px #D5D5D4 solid", padding: "12px 24px", display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
                <span style={{ color: "#5A5B58", fontSize: 12, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "18px", flexShrink: 0 }}>
                  Other certs:
                </span>
                {certDocs
                  .filter((c) => c.certificationId !== activeCertDoc.certificationId)
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
                      {cert.certificationName ?? cert.label ?? `Cert ${cert.certificationId}`}
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

export { FoodInfantView };
export default FoodInfantView;