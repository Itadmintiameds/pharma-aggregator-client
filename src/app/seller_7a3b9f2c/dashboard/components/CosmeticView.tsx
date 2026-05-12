// "use client";

// import React, { useState } from "react";
// import { FileText, ExternalLink } from "lucide-react";
// import { PiSealCheckLight } from "react-icons/pi";
// import Image from "next/image";

// /* ─────────────────────────────────────────────────────────
//    TYPES
// ───────────────────────────────────────────────────────── */

// export interface CertificateDocument {
//   certificationId: number;
//   certificateUrl: string;
//   certificationName?: string;
//   label?: string;
//   productCertificateDocumentId?: number;
// }

// export interface CosmeticAttributes {
//   productType?: string;
//   productSubtype?: string;
//   brandName?: string;
//   variantName?: string;
//   gender?: string;
//   intendedUseArea?: string;
//   skinHairType?: string;
//   ageGroup?: string;
//   netQuantityStrength?: string;
//   activeIngredients?: string;
//   productClaims?: string;
//   storageCondition?: string;
//   storageConditionName?: string;
//   storageConditionId?: number;
//   manufacturerName?: string;
//   countryOfOrigin?: string;
//   brochurePath?: string;
//   certificateDocuments?: CertificateDocument[];
//   productDescription?: string;
//   warningsPrecautions?: string;
// }

// export interface CosmeticPersonalCareViewProps {
//   productName?: string | null;
//   productDescription?: string | null;
//   warningsPrecautions?: string | null;
//   displayImages: string[];
//   cosAttr: CosmeticAttributes | null;
//   storageConditionName?: string | null;
//   brochureUrl?: string | null;
//   placeholderImage?: string;
// }

// /* ─────────────────────────────────────────────────────────
//    SHARED STYLES
// ───────────────────────────────────────────────────────── */

// const ROW: React.CSSProperties = {
//   display: "grid",
//   gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
//   alignItems: "center",
//   padding: "12px 16px",
//   borderBottom: "1px solid #D5D5D4",
//   gap: 16,
// };

// const ROW_LABEL: React.CSSProperties = {
//   display: "flex",
//   alignItems: "flex-start",
//   gap: 4,
//   flex: "1 1 0",
//   minWidth: 0,
// };

// const LABEL_TEXT: React.CSSProperties = {
//   color: "var(--Colors-Primary-Neutral-pneutral-700, #5A5B58)",
//   fontSize: 16,
//   fontFamily: "'Work Sans', sans-serif",
//   fontWeight: 500,
//   lineHeight: "24px",
//   wordWrap: "break-word",
//   margin: 0,
// };

// const REQUIRED_STAR: React.CSSProperties = {
//   color: "var(--Colors-Warning-warning-500, #FF3B3B)",
//   fontSize: 16,
//   fontFamily: "'Work Sans', sans-serif",
//   fontWeight: 500,
//   lineHeight: "24px",
//   flexShrink: 0,
// };

// const VALUE_TEXT: React.CSSProperties = {
//   color: "var(--Colors-Primary-Neutral-pneutral-800, #3C3D3A)",
//   fontSize: 16,
//   fontFamily: "'Noto Sans', sans-serif",
//   fontWeight: 400,
//   lineHeight: "24px",
//   wordWrap: "break-word",
//   textAlign: "right",
//   flex: "1 1 0",
//   margin: 0,
// };

// /* ─────────────────────────────────────────────────────────
//    HELPERS
// ───────────────────────────────────────────────────────── */

// const isImageUrl = (url: string) =>
//   /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

// const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

// const isValidUrl = (url?: string | null) => {
//   if (!url) return false;
//   const t = url.trim().toUpperCase();
//   return !["", "PENDING", "NOT_UPLOADED"].includes(t);
// };

// /* ─────────────────────────────────────────────────────────
//    SUB-COMPONENTS
// ───────────────────────────────────────────────────────── */

// const FieldRow = ({
//   label,
//   value,
//   required = true,
//   valueNode,
//   multiline = false,
// }: {
//   label: string;
//   value?: string | number | null;
//   required?: boolean;
//   valueNode?: React.ReactNode;
//   multiline?: boolean;
// }) => (
//   <div style={{ ...ROW, alignItems: multiline ? "flex-start" : "center" }}>
//     <div style={ROW_LABEL}>
//       <span style={LABEL_TEXT}>{label}</span>
//       {required && <span style={REQUIRED_STAR}>*</span>}
//     </div>
//     {valueNode ? (
//       <div style={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}>
//         {valueNode}
//       </div>
//     ) : (
//       <p style={VALUE_TEXT}>{value ?? "—"}</p>
//     )}
//   </div>
// );

// /* ─────────────────────────────────────────────────────────
//    MAIN COMPONENT — Product Details section only.
//    All common sections (Packaging, Batch, Pricing, Tax)
//    are rendered by the parent ProductView1.
// ───────────────────────────────────────────────────────── */

// const CosmeticPersonalCareView = ({
//   productName,
//   productDescription,
//   warningsPrecautions,
//   displayImages,
//   cosAttr,
//   storageConditionName,
//   brochureUrl,
//   placeholderImage = "/assets/images/SellerMed.jpg",
// }: CosmeticPersonalCareViewProps) => {
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//   const [showCertModal, setShowCertModal] = useState(false);
//   const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);

//   const certDocs: CertificateDocument[] = (cosAttr?.certificateDocuments ?? []).filter(
//     (c) => isValidUrl(c.certificateUrl),
//   );

//   const storageCondition =
//     storageConditionName ??
//     cosAttr?.storageConditionName?.trim() ??
//     cosAttr?.storageCondition?.trim() ??
//     null;

//   const resolvedProductDescription = productDescription ?? cosAttr?.productDescription ?? null;
//   const resolvedWarnings = warningsPrecautions ?? cosAttr?.warningsPrecautions ?? null;

//   const imagesToShow = displayImages.length > 0 ? displayImages : [placeholderImage];

//   return (
//     <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
//       {/* ── Section header ── */}
//       <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}>
//         <h2
//           style={{
//             color: "#1E1E1D",
//             fontSize: 28,
//             fontFamily: "'Work Sans', sans-serif",
//             fontWeight: 500,
//             lineHeight: "36px",
//             margin: 0,
//           }}
//         >
//           Product Details
//         </h2>
//       </div>

//       {/* ── Product Images ── */}
//       <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
//         <p
//           style={{
//             color: "#1E1E1D",
//             fontSize: 18,
//             fontFamily: "'Open Sans', sans-serif",
//             fontWeight: 600,
//             lineHeight: "24px",
//             margin: 0,
//           }}
//         >
//           Product Images
//         </p>

//         <div
//           style={{
//             padding: 12,
//             background: "var(--Colors-Secondary-Secondary-50, #F8F5FF)",
//             borderRadius: 12,
//             outline: "1px var(--Colors-Brand-Primary-600, #B550FA) solid",
//             outlineOffset: -1,
//             display: "flex",
//             flexDirection: "column",
//             gap: 16,
//           }}
//         >
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
//             {imagesToShow.slice(0, 4).map((img, idx) => (
//               <div
//                 key={idx}
//                 onClick={() => setSelectedImageIndex(idx)}
//                 style={{
//                   position: "relative",
//                   height: 276,
//                   boxShadow:
//                     "0px 2px 4px -2px rgba(0,0,0,0.10), 0px 4px 6px -1px rgba(0,0,0,0.10)",
//                   overflow: "hidden",
//                   borderRadius: 12,
//                   outline:
//                     idx === selectedImageIndex
//                       ? "1px var(--Colors-Brand-Primary-600, #B550FA) solid"
//                       : "none",
//                   outlineOffset: -1,
//                   cursor: "pointer",
//                 }}
//               >
//                 <Image
//                   src={img}
//                   alt={`Product image ${idx + 1}`}
//                   fill
//                   style={{ objectFit: "cover" }}
//                   unoptimized={img.startsWith("http")}
//                   onError={(e) => {
//                     (e.target as HTMLImageElement).src = placeholderImage;
//                   }}
//                 />
//                 {idx === 0 && (
//                   <div
//                     style={{
//                       position: "absolute",
//                       left: 10,
//                       top: 10,
//                       padding: "4px 8px",
//                       background: "var(--Colors-Brand-Primary-600, #B550FA)",
//                       borderRadius: 4,
//                     }}
//                   >
//                     <span
//                       style={{
//                         color: "white",
//                         fontSize: 12,
//                         fontFamily: "'Open Sans', sans-serif",
//                         fontWeight: 600,
//                         lineHeight: "18px",
//                       }}
//                     >
//                       Primary
//                     </span>
//                   </div>
//                 )}
//               </div>
//             ))}
//             {Array.from({ length: Math.max(0, 4 - imagesToShow.length) }).map((_, i) => (
//               <div
//                 key={`empty-${i}`}
//                 style={{
//                   height: 276,
//                   borderRadius: 12,
//                   background: "#F5F5F5",
//                   boxShadow: "0px 1px 2px -1px rgba(0,0,0,0.10)",
//                 }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ── Two-column field rows ── */}
//       <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
//         {/* LEFT COLUMN */}
//         <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
//           <FieldRow label="Product Name" value={productName} multiline />
//           <FieldRow label="Product Type" value={cosAttr?.productType} />
//           <FieldRow label="Product Subtype" value={cosAttr?.productSubtype} />
//           <FieldRow label="Brand Name" value={cosAttr?.brandName} />
//           <FieldRow label="Variant Name" value={cosAttr?.variantName} />
//           <FieldRow label="Gender" value={cosAttr?.gender} />
//           <FieldRow label="Intended Use Area" value={cosAttr?.intendedUseArea} />
//           <FieldRow label="Skin / Hair Type" value={cosAttr?.skinHairType} />
//           <FieldRow label="Age Group" value={cosAttr?.ageGroup} />
//           <FieldRow label="Net Quantity / Strength" value={cosAttr?.netQuantityStrength} />
//           <FieldRow label="Active Ingredients" value={cosAttr?.activeIngredients} multiline />
//         </div>

//         {/* RIGHT COLUMN */}
//         <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
//           <FieldRow label="Product Claims" value={cosAttr?.productClaims} multiline />
//           <FieldRow label="Storage Condition" value={storageCondition} multiline />
//           <FieldRow label="Manufacturer Name" value={cosAttr?.manufacturerName} />

//           {/* Uploaded Product Brochure */}
//           <div
//             style={{
//               paddingTop: 12,
//               paddingBottom: 8,
//               paddingLeft: 16,
//               paddingRight: 16,
//               borderBottom: "1px #D5D5D4 solid",
//               display: "flex",
//               flexDirection: "column",
//               gap: 8,
//             }}
//           >
//             <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//               <span style={LABEL_TEXT}>Uploaded Product Brochure</span>
//               <span style={REQUIRED_STAR}>*</span>
//             </div>
//             {brochureUrl ? (
//               <a
//                 href={brochureUrl}
//                 target="_blank"
//                 rel="noreferrer"
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 12,
//                   padding: 12,
//                   background: "var(--Colors-Primary-Neutral-pneutral-50, #F8F8F9)",
//                   borderRadius: 8,
//                   textDecoration: "none",
//                 }}
//               >
//                 <FileText size={24} color="#3C3D3A" />
//                 <span
//                   style={{
//                     color: "#3C3D3A",
//                     fontSize: 16,
//                     fontFamily: "'Open Sans', sans-serif",
//                     fontWeight: 400,
//                     lineHeight: "22px",
//                   }}
//                 >
//                   product-brochure.pdf
//                 </span>
//               </a>
//             ) : (
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 12,
//                   padding: 12,
//                   background: "var(--Colors-Primary-Neutral-pneutral-50, #F8F8F9)",
//                   borderRadius: 8,
//                 }}
//               >
//                 <FileText size={24} color="#3C3D3A" />
//                 <span
//                   style={{
//                     color: "#5A5B58",
//                     fontSize: 16,
//                     fontFamily: "'Open Sans', sans-serif",
//                     fontWeight: 400,
//                     lineHeight: "22px",
//                   }}
//                 >
//                   No brochure uploaded
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* Country of Origin */}
//           <FieldRow label="Country of Origin" value={cosAttr?.countryOfOrigin} />

//           {/* Certifications / Compliance */}
//           {certDocs.length > 0 && (
//             <div
//               style={{
//                 paddingTop: 12,
//                 paddingBottom: 8,
//                 paddingLeft: 16,
//                 paddingRight: 16,
//                 borderBottom: "1px #D5D5D4 solid",
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: 8,
//               }}
//             >
//               <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
//                 <span style={LABEL_TEXT}>Certifications / Compliance</span>
//                 <span style={REQUIRED_STAR}>*</span>
//               </div>
//               <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
//                 {certDocs.map((cert) => (
//                   <button
//                     key={cert.certificationId}
//                     type="button"
//                     onClick={() => {
//                       setActiveCertDoc(cert);
//                       setShowCertModal(true);
//                     }}
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: 8,
//                       paddingLeft: 8,
//                       paddingRight: 8,
//                       paddingTop: 4,
//                       paddingBottom: 4,
//                       background: "var(--Colors-Success-Success-50, #DCF7CB)",
//                       border: "none",
//                       borderRadius: 8,
//                       cursor: "pointer",
//                       fontFamily: "'Noto Sans', sans-serif",
//                       fontSize: 16,
//                       fontWeight: 500,
//                       lineHeight: "24px",
//                       color: "var(--Colors-Success-Success-900, #378200)",
//                     }}
//                   >
//                     <PiSealCheckLight size={16} />
//                     {cert.certificationName ?? `Cert ${cert.certificationId}`}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Product Description (full width) ── */}
//       <div
//         style={{
//           paddingLeft: 16,
//           paddingRight: 16,
//           paddingTop: 12,
//           paddingBottom: 12,
//           borderBottom: "1px #D5D5D4 solid",
//           display: "flex",
//           flexDirection: "column",
//           gap: 12,
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//           <span style={LABEL_TEXT}>Product Description</span>
//           <span style={REQUIRED_STAR}>*</span>
//         </div>
//         <p
//           style={{
//             color: "#3C3D3A",
//             fontSize: 16,
//             fontFamily: "'Noto Sans', sans-serif",
//             fontWeight: 400,
//             lineHeight: "24px",
//             wordWrap: "break-word",
//             margin: 0,
//           }}
//         >
//           {resolvedProductDescription ?? "—"}
//         </p>
//       </div>

//       {/* ── Warnings & Precautions (full width) ── */}
//       <div
//         style={{
//           paddingLeft: 16,
//           paddingRight: 16,
//           paddingTop: 12,
//           paddingBottom: 12,
//           borderBottom: "1px #D5D5D4 solid",
//           display: "flex",
//           flexDirection: "column",
//           gap: 12,
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//           <span style={LABEL_TEXT}>Warnings &amp; Precautions</span>
//           <span style={REQUIRED_STAR}>*</span>
//         </div>
//         <p
//           style={{
//             color: "#3C3D3A",
//             fontSize: 16,
//             fontFamily: "'Noto Sans', sans-serif",
//             fontWeight: 400,
//             lineHeight: "24px",
//             wordWrap: "break-word",
//             margin: 0,
//           }}
//         >
//           {resolvedWarnings ?? "—"}
//         </p>
//       </div>

//       {/* ── Certificate Modal ── */}
//       {showCertModal && activeCertDoc !== null && (
//         <div
//           onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }}
//           style={{
//             position: "fixed",
//             inset: 0,
//             zIndex: 50,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             background: "rgba(0,0,0,0.50)",
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "white",
//               borderRadius: 16,
//               boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
//               width: "100%",
//               maxWidth: 672,
//               margin: "0 16px",
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//               maxHeight: "90vh",
//             }}
//           >
//             {/* Modal header */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "16px 24px",
//                 borderBottom: "1px #D5D5D4 solid",
//               }}
//             >
//               <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//                 <div
//                   style={{
//                     width: 36,
//                     height: 36,
//                     background: "var(--Colors-Success-Success-50, #DCF7CB)",
//                     borderRadius: 8,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   <PiSealCheckLight size={20} color="var(--Colors-Success-Success-900, #378200)" />
//                 </div>
//                 <div>
//                   <p style={{ color: "#1E1E1D", fontSize: 16, fontFamily: "'Work Sans', sans-serif", fontWeight: 600, lineHeight: "22px", margin: 0 }}>
//                     {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                   </p>
//                   <p style={{ color: "#5A5B58", fontSize: 12, fontFamily: "'Noto Sans', sans-serif", fontWeight: 400, lineHeight: "18px", margin: 0 }}>
//                     Certification Document
//                   </p>
//                 </div>
//               </div>
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <a
//                   href={activeCertDoc.certificateUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 6,
//                     color: "var(--Colors-Success-Success-900, #378200)",
//                     fontSize: 14,
//                     fontFamily: "'Work Sans', sans-serif",
//                     fontWeight: 600,
//                     lineHeight: "20px",
//                     textDecoration: "none",
//                     padding: "6px 12px",
//                     borderRadius: 8,
//                   }}
//                 >
//                   <ExternalLink size={14} /> Open
//                 </a>
//                 <button
//                   type="button"
//                   onClick={() => { setShowCertModal(false); setActiveCertDoc(null); }}
//                   style={{
//                     width: 32,
//                     height: 32,
//                     borderRadius: 8,
//                     border: "none",
//                     background: "transparent",
//                     cursor: "pointer",
//                     color: "#5A5B58",
//                     fontSize: 20,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   ×
//                 </button>
//               </div>
//             </div>

//             {/* Modal body */}
//             <div
//               style={{
//                 flex: 1,
//                 overflowY: "auto",
//                 background: "#F5F5F5",
//                 padding: 16,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 minHeight: 400,
//               }}
//             >
//               {isImageUrl(activeCertDoc.certificateUrl) ? (
//                 <img
//                   src={activeCertDoc.certificateUrl}
//                   alt={activeCertDoc.certificationName ?? "Certificate"}
//                   style={{ maxWidth: "100%", maxHeight: 600, objectFit: "contain", borderRadius: 8 }}
//                 />
//               ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
//                 <iframe
//                   src={activeCertDoc.certificateUrl}
//                   title="Certificate PDF"
//                   style={{ width: "100%", height: 560, border: "none", borderRadius: 8 }}
//                 />
//               ) : (
//                 <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0" }}>
//                   <div
//                     style={{
//                       width: 64,
//                       height: 64,
//                       background: "var(--Colors-Success-Success-50, #DCF7CB)",
//                       borderRadius: 16,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                     }}
//                   >
//                     <FileText size={32} color="var(--Colors-Success-Success-900, #378200)" />
//                   </div>
//                   <div style={{ textAlign: "center" }}>
//                     <p style={{ color: "#1E1E1D", fontSize: 16, fontFamily: "'Work Sans', sans-serif", fontWeight: 600, lineHeight: "22px", margin: "0 0 8px" }}>
//                       {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                     </p>
//                     <p style={{ color: "#5A5B58", fontSize: 14, fontFamily: "'Noto Sans', sans-serif", fontWeight: 400, lineHeight: "20px", margin: "0 0 16px" }}>
//                       This file cannot be previewed in the browser.
//                     </p>
//                     <a
//                       href={activeCertDoc.certificateUrl}
//                       target="_blank"
//                       rel="noreferrer"
//                       style={{
//                         display: "inline-flex",
//                         alignItems: "center",
//                         gap: 8,
//                         background: "var(--Colors-Success-Success-700, #47A400)",
//                         color: "white",
//                         fontSize: 14,
//                         fontFamily: "'Work Sans', sans-serif",
//                         fontWeight: 600,
//                         lineHeight: "20px",
//                         padding: "10px 20px",
//                         borderRadius: 8,
//                         textDecoration: "none",
//                       }}
//                     >
//                       <ExternalLink size={14} /> Open / Download
//                     </a>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Other certs strip */}
//             {certDocs.length > 1 && (
//               <div
//                 style={{
//                   borderTop: "1px #D5D5D4 solid",
//                   padding: "12px 24px",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 8,
//                   overflowX: "auto",
//                 }}
//               >
//                 <span style={{ color: "#5A5B58", fontSize: 12, fontFamily: "'Noto Sans', sans-serif", fontWeight: 400, lineHeight: "18px", flexShrink: 0 }}>
//                   Other certs:
//                 </span>
//                 {certDocs
//                   .filter((c) => c.certificationId !== activeCertDoc.certificationId)
//                   .map((cert) => (
//                     <button
//                       key={cert.certificationId}
//                       type="button"
//                       onClick={() => setActiveCertDoc(cert)}
//                       style={{
//                         flexShrink: 0,
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 6,
//                         color: "var(--Colors-Success-Success-900, #378200)",
//                         background: "var(--Colors-Success-Success-50, #DCF7CB)",
//                         fontSize: 12,
//                         fontFamily: "'Noto Sans', sans-serif",
//                         fontWeight: 500,
//                         lineHeight: "18px",
//                         padding: "6px 12px",
//                         borderRadius: 9999,
//                         border: "none",
//                         cursor: "pointer",
//                       }}
//                     >
//                       <PiSealCheckLight size={12} />
//                       {cert.certificationName ?? cert.label ?? `Cert ${cert.certificationId}`}
//                     </button>
//                   ))}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CosmeticView;