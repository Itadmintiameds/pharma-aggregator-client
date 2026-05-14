import React, { useState } from "react";
import { PiSealCheckLight } from "react-icons/pi";
import { FileText } from "lucide-react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   CONSTANTS & STYLES
───────────────────────────────────────────────────────── */

const FONTS = {
  workSans: "'Work Sans', sans-serif",
  notoSans: "'Noto Sans', sans-serif",
  openSans: "'Open Sans', sans-serif",
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
  color: "var(--Colors-Primary-Neutral-pneutral-700, #5A5B58)",
  fontSize: 16,
  fontFamily: FONTS.workSans,
  fontWeight: 500,
  lineHeight: "24px",
  wordWrap: "break-word",
  margin: 0,
};

const VALUE_TEXT: React.CSSProperties = {
  color: "var(--Colors-Primary-Neutral-pneutral-800, #3C3D3A)",
  fontSize: 16,
  fontFamily: FONTS.notoSans,
  fontWeight: 400,
  lineHeight: "24px",
  wordWrap: "break-word",
  textAlign: "right",
  flex: "1 1 0",
  margin: 0,
};

const REQUIRED_STAR: React.CSSProperties = {
  color: "var(--Colors-Warning-warning-500, #FF3B3B)",
  fontSize: 16,
  fontFamily: FONTS.workSans,
  fontWeight: 500,
  lineHeight: "24px",
  flexShrink: 0,
};

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */

const FieldRow = ({
  label,
  value,
  required = true,
  multiline = false,
  valueNode,
}: {
  label: string;
  value?: string | number | null;
  required?: boolean;
  multiline?: boolean;
  valueNode?: React.ReactNode;
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
      <p style={VALUE_TEXT}>
        {value ?? "—"}
      </p>
    )}
  </div>
);

const RadioDisplay = ({ value }: { value?: string | null }) => {
  if (!value) return <p style={VALUE_TEXT}>—</p>;
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
          flexShrink: 0
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4B0082" }} />
      </div>
      <span style={{ ...VALUE_TEXT, textAlign: "left" }}>{value}</span>
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

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

interface SupplementDetailsViewProps {
  productName?: string | null;
  productDescription?: string | null;
  warningsPrecautions?: string | null;
  displayImages?: string[];
  suppAttr?: any | null;
  storageConditionName?: string | null;
  brochureUrl?: string | null;
  placeholderImage?: string;
  manufacturerName?: string | null;
}

export default function SupplementDetailsView({
  productName,
  productDescription,
  warningsPrecautions,
  displayImages = [],
  suppAttr,
  storageConditionName,
  placeholderImage = "/assets/images/SellerMed.jpg",
  manufacturerName,
  brochureUrl,
}: SupplementDetailsViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!suppAttr) return null;

  const imagesToShow = displayImages.length > 0 ? displayImages : [placeholderImage];

  return (
    <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Section header ── */}
      <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}>
        <h2 style={{ color: "#1E1E1D", fontSize: 28, fontFamily: FONTS.workSans, fontWeight: 500, lineHeight: "36px", margin: 0 }}>
          Product Details
        </h2>
      </div>

      {/* ── Product Images ── */}
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

      {/* ── Two-column details ── */}
      <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
        
        {/* LEFT COLUMN: BASIC & COMPOSITION */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
          <FieldRow label="Product Name" value={productName} multiline />
          <FieldRow label="Therapeutic Category" value={suppAttr.therapeuticCategoryName} />
          <FieldRow label="Therapeutic Subcategory" value={suppAttr.therapeuticSubCategoryName} />
          <FieldRow label="Brand Name" value={suppAttr.brandName} />
          <FieldRow label="Variant Name" value={suppAttr.variantName} />
          <FieldRow label="Dosage Form" value={suppAttr.dosageFormName} />
          <FieldRow label="Net Quantity" value={suppAttr.netQuantity} />
          <FieldRow label="Strength / Composition" value={suppAttr.strength} />
          <FieldRow label="Active Ingredients" value={suppAttr.activeIngredients} multiline />
          <FieldRow label="Other Ingredients" value={suppAttr.otherIngredients} multiline />
          <FieldRow label="Intended Use / Health Benefit" value={suppAttr.intendedUse} multiline />

          {/* Nutritional Info Thumbnail */}
          <div style={{ ...ROW, alignItems: "flex-start" }}>
            <div style={ROW_LABEL}>
              <span style={LABEL_TEXT}>Nutritional Information</span>
              <span style={REQUIRED_STAR}>*</span>
            </div>
            <div style={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}>
              {suppAttr.nutritionalInformationImageUrl ? (
                <a href={suppAttr.nutritionalInformationImageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={suppAttr.nutritionalInformationImageUrl}
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
                <p style={VALUE_TEXT}>{suppAttr.nutritionalInformation ?? "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ATTRIBUTES & COMPLIANCE */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
          <FieldRow label="Age Group" value={suppAttr.ageGroupName} />
          <FieldRow label="Gender" value={suppAttr.gender} />

          {/* Veg / Non-Veg Indicator (Vertical Left-Aligned Stack) */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #D5D5D4", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={LABEL_TEXT}>Veg / Non-Veg Indicator</span>
              <span style={REQUIRED_STAR}>*</span>
            </div>
            <RadioDisplay value={suppAttr.vegOrNonVegIndicator} />
          </div>

          <FieldRow label="Storage Condition" value={storageConditionName} multiline />
          <FieldRow label="Manufacturer Name" value={manufacturerName} />
          
          {/* ── Uploaded Product Brochure ── */}
          <div style={{ paddingTop: 12, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderBottom: "1px #D5D5D4 solid", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={LABEL_TEXT}>Uploaded Product Brochure</span>
              <span style={REQUIRED_STAR}>*</span>
            </div>
            {brochureUrl ? (
              <a href={brochureUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F8F8F9", borderRadius: 8, textDecoration: "none" }}>
                <FileText size={24} color="#3C3D3A" />
                <span style={{ color: "#3C3D3A", fontSize: 16, fontFamily: FONTS.openSans, fontWeight: 400, lineHeight: "22px" }}>
                  {brochureUrl.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
                </span>
              </a>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F8F8F9", borderRadius: 8 }}>
                <FileText size={24} color="#3C3D3A" />
                <span style={{ color: "#5A5B58", fontSize: 16, fontFamily: FONTS.openSans, fontWeight: 400, lineHeight: "22px" }}>No brochure uploaded</span>
              </div>
            )}
          </div>

          <FieldRow label="Country of Origin" value={suppAttr.countryName} />

          {/* Certifications Seals */}
          {(suppAttr.certificateDocuments ?? []).length > 0 && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #D5D5D4" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 8 }}>
                <span style={LABEL_TEXT}>Certifications / Compliance</span>
                <span style={REQUIRED_STAR}>*</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {suppAttr.certificateDocuments.map((cert: any, idx: number) => (
                  <a
                    key={idx}
                    href={cert.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 12px",
                      background: "#DCF7CB",
                      borderRadius: 8,
                      textDecoration: "none",
                      color: "#378200",
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    <PiSealCheckLight size={16} />
                    {cert.certificationName || `Cert ${cert.certificationId}`}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <FieldRow label="Product Claims" value={suppAttr.productClaims} multiline />
        </div>
      </div>

      {/* ── DESCRIPTION & WARNINGS ── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <FullWidthBlock label="Product Description" value={productDescription} />
        <FullWidthBlock label="Warnings & Precautions" value={warningsPrecautions} />
      </div>
    </div>
  );
}



