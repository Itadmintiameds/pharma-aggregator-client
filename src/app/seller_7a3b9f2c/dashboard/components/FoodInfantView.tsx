"use client";

import React, { useState, useEffect } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { PiSealCheckLight } from "react-icons/pi";
import Image from "next/image";
import {
  getProductCategories,
  getProductSubcategories,
  getAgeGroups,
  getProductForms,
  getCountries,
  getStorageConditions,
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

export interface FoodInfantAttributes {
  productCategoryId?: number;
  productSubcategoryId?: number;
  productFormId?: number;
  ageGroupId?: number;
  storageConditionId?: number;
  countryId?: number;
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
  productCategoryName?: string | null;
  productSubcategoryName?: string | null;
  productFormName?: string | null;
  ageGroupName?: string | null;
  storageConditionName?: string | null;
  countryName?: string | null;
}

export interface FoodInfantViewProps {
  productName?: string | null;
  productDescription?: string | null;
  warningsPrecautions?: string | null;
  displayImages?: string[];
  foodAttr?: FoodInfantAttributes | null;
  brochureUrl?: string | null;
  placeholderImage?: string;
  manufacturerName?: string | null;
}

/* ─────────────────────────────────────────────────────────
   HELPER FUNCTIONS
───────────────────────────────────────────────────────── */

const isValidUrl = (url?: string | null) => {
  if (!url) return false;
  const t = url.trim().toUpperCase();
  return !["", "PENDING", "NOT_UPLOADED"].includes(t);
};

const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

const FoodInfantView = ({
  productName,
  productDescription,
  warningsPrecautions,
  displayImages = [],
  foodAttr,
  brochureUrl,
  manufacturerName,
  placeholderImage = "/assets/images/SellerMed.jpg",
}: FoodInfantViewProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);
  const [resolvedAttr, setResolvedAttr] = useState<FoodInfantAttributes | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve master data names from IDs
  useEffect(() => {
    if (!foodAttr) {
      setLoading(false);
      return;
    }

    const resolveMasterData = async () => {
      setLoading(true);
      try {
        const [
          categoriesResult,
          subcategoriesResult,
          ageGroupsResult,
          productFormsResult,
          countriesResult,
          storageConditionsResult,
        ] = await Promise.allSettled([
          getProductCategories(3),
          foodAttr.productSubcategoryId ? getProductSubcategories(foodAttr.productCategoryId || 0) : Promise.resolve([]),
          getAgeGroups(),
          getProductForms(),
          getCountries(),
          getStorageConditions(),
        ]);

        const findName = (data: any[], id: number | undefined, idKey: string, nameKey: string): string | null => {
          if (!data || !id) return null;
          const item = data.find((item: any) => Number(item[idKey]) === Number(id));
          return item ? item[nameKey] : null;
        };

        const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
        const subcategories = subcategoriesResult.status === "fulfilled" ? subcategoriesResult.value : [];
        const ageGroups = ageGroupsResult.status === "fulfilled" ? ageGroupsResult.value : [];
        const productForms = productFormsResult.status === "fulfilled" ? productFormsResult.value : [];
        const countries = countriesResult.status === "fulfilled" ? countriesResult.value : [];
        const storageConditions = storageConditionsResult.status === "fulfilled" ? storageConditionsResult.value : [];

        setResolvedAttr({
          ...foodAttr,
          productCategoryName: findName(categories, foodAttr.productCategoryId, "productCategoryId", "productCategory"),
          productSubcategoryName: findName(subcategories, foodAttr.productSubcategoryId, "productSubcategoryId", "productSubcategory"),
          ageGroupName: findName(ageGroups, foodAttr.ageGroupId, "ageGroupId", "ageGroup"),
          productFormName: findName(productForms, foodAttr.productFormId, "productFormId", "productForm"),
          countryName: findName(countries, foodAttr.countryId, "countryId", "countryName"),
          storageConditionName: findName(storageConditions, foodAttr.storageConditionId, "storageConditionId", "conditionName"),
        });
      } catch (err) {
        console.error("Failed to resolve Food/Infant master data:", err);
        setResolvedAttr(foodAttr);
      } finally {
        setLoading(false);
      }
    };

    resolveMasterData();
  }, [foodAttr]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-3 border-secondary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!resolvedAttr) return null;

  const attr = resolvedAttr;
  const certDocs: CertificateDocument[] = (attr.certificateDocuments ?? []).filter(
    (c) => isValidUrl(c.certificateUrl),
  );
  const storageCondition = attr.storageConditionName || null;
  const imagesToShow = displayImages.length > 0 ? displayImages : [placeholderImage];
  const resolvedBrochureUrl = isValidUrl(brochureUrl)
    ? brochureUrl
    : isValidUrl(attr.productUserManual)
    ? attr.productUserManual
    : null;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Section header */}
      <div className="pt-2 pb-2 border-b border-pneutral-200">
        <h2 className="text-h4 font-heading font-medium text-pneutral-900 m-0">
          Product Details
        </h2>
      </div>

      {/* Product Images */}
      <div className="w-full flex flex-col gap-4">
        <p className="text-label-l4 font-heading font-semibold text-pneutral-900 m-0">
          Product Images
        </p>
        <div className="p-3 bg-secondary-50 rounded-lg outline outline-1 outline-primary-600 -outline-offset-1 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
            {imagesToShow.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative h-64 shadow-sm overflow-hidden rounded-lg cursor-pointer ${
                  idx === selectedImageIndex ? "outline outline-1 outline-primary-600 -outline-offset-1" : ""
                }`}
              >
                <Image
                  src={img}
                  alt={`Product image ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={img.startsWith("http")}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderImage;
                  }}
                />
                {idx === 0 && (
                  <div className="absolute left-2.5 top-2.5 px-2 py-1 bg-primary-600 rounded">
                    <span className="text-white text-p2 font-heading font-semibold leading-[18px]">Primary</span>
                  </div>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - imagesToShow.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-64 rounded-lg bg-sneutral-50 shadow-sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-9 items-start">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col">
          <FieldRow label="Product Name" value={productName} multiline />
          <FieldRow label="Product Category" value={attr.productCategoryName} />
          <FieldRow label="Product Subcategory" value={attr.productSubcategoryName} />
          <FieldRow label="Brand Name" value={attr.brandName} />
          <FieldRow label="Variant Name" value={attr.variantName} required={false} />
          <FieldRow label="Product Form" value={attr.productFormName} />
          <FieldRow label="Net Quantity" value={attr.netQuantity} />
          <FieldRow label="Serving Size" value={attr.servingSize} />
          <FieldRow label="Age Group" value={attr.ageGroupName} />
          <FieldRow label="Product Claims" value={attr.productClaims} multiline />
          <FieldRow label="Active Ingredients" value={attr.activeIngredients} multiline />
          <FieldRow label="Additives / Preservatives" value={attr.additivesPreservatives} multiline required={false} />

          {/* Nutritional Information */}
          <div className="grid grid-cols-2 items-start gap-4 py-3 px-4 border-b border-pneutral-200">
            <div className="flex items-start gap-1">
              <span className="text-p4 font-heading font-medium text-pneutral-700">Nutritional Information</span>
              <span className="text-warning-500 font-heading font-medium text-p4">*</span>
            </div>
            <div className="flex justify-end">
              {attr.nutritionalInformation === "image-upload" && attr.nutritionalInformationImageUrl ? (
                <a href={attr.nutritionalInformationImageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={attr.nutritionalInformationImageUrl}
                    alt="Nutritional Information"
                    className="w-20 h-20 object-cover rounded-md border border-pneutral-200"
                  />
                </a>
              ) : attr.nutritionalInformation === "as-per-label" ? (
                <p className="text-p4 font-body font-normal text-pneutral-800">As per the label</p>
              ) : (
                <p className="text-p4 font-body font-normal text-pneutral-800">—</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col">
          <FieldRow label="Allergen Information" value={attr.allergenInformation} multiline />

          {/* Veg / Non-Veg Indicator */}
          <div className="py-3 px-4 border-b border-pneutral-200 flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-p4 font-heading font-medium text-pneutral-700">Veg / Non-Veg Indicator</span>
              <span className="text-warning-500 font-heading font-medium text-p4">*</span>
            </div>
            <RadioDisplay value={attr.vegNonvegIndicator} />
          </div>

          <FieldRow label="Storage Condition" value={storageCondition} multiline />
          <FieldRow label="Manufacturer Name" value={manufacturerName || attr.manufacturerName} />

          {/* Uploaded Product Brochure */}
          <div className="pt-3 pb-2 px-4 border-b border-pneutral-200 flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-p4 font-heading font-medium text-pneutral-700">Uploaded Product Brochure</span>
              <span className="text-warning-500 font-heading font-medium text-p4">*</span>
            </div>
            {resolvedBrochureUrl ? (
              <a href={resolvedBrochureUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-sneutral-50 rounded-md no-underline">
                <FileText size={24} color="#3C3D3A" />
                <span className="text-p4 font-body font-normal text-pneutral-800">
                  {resolvedBrochureUrl.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
                </span>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-sneutral-50 rounded-md">
                <FileText size={24} color="#3C3D3A" />
                <span className="text-p4 font-body font-normal text-pneutral-500">No brochure uploaded</span>
              </div>
            )}
          </div>

          <FieldRow label="Country of Origin" value={attr.countryName} />

          {/* Certifications / Compliance */}
          {certDocs.length > 0 && (
            <div className="pt-3 pb-2 px-4 border-b border-pneutral-200 flex flex-col gap-2">
              <div className="flex items-start gap-1">
                <span className="text-p4 font-heading font-medium text-pneutral-700">Certifications / Compliance</span>
                <span className="text-warning-500 font-heading font-medium text-p4">*</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {certDocs.map((cert) => (
                  <button
                    key={cert.certificationId}
                    type="button"
                    onClick={() => {
                      setActiveCertDoc(cert);
                      setShowCertModal(true);
                    }}
                    className="flex items-center gap-2 px-2 py-1 bg-success-50 border-none rounded-md cursor-pointer font-body text-p4 font-medium text-success-900"
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

<FullWidthBlock label="Warnings & Precautions" value={warningsPrecautions} />
      <FullWidthBlock label="Product Description" value={productDescription} />
      

      {/* Certificate Modal */}
      {showCertModal && activeCertDoc !== null && (
        <div
          onClick={() => {
            setShowCertModal(false);
            setActiveCertDoc(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-pneutral-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-success-50 rounded-md flex items-center justify-center">
                  <PiSealCheckLight size={20} color="#378200" />
                </div>
                <div>
                  <p className="text-p4 font-heading font-semibold text-pneutral-900 m-0">
                    {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
                  </p>
                  <p className="text-p2 font-body font-normal text-pneutral-500 m-0">Certification Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeCertDoc.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-success-900 text-p3 font-heading font-semibold no-underline px-3 py-1.5 rounded-md"
                >
                  <ExternalLink size={14} /> Open
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setShowCertModal(false);
                    setActiveCertDoc(null);
                  }}
                  className="w-8 h-8 rounded-md border-none bg-transparent cursor-pointer text-pneutral-500 text-xl flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-sneutral-50 p-4 flex items-center justify-center min-h-[400px]">
              {isImageUrl(activeCertDoc.certificateUrl) ? (
                <img
                  src={activeCertDoc.certificateUrl}
                  alt={activeCertDoc.certificationName ?? "Certificate"}
                  className="max-w-full max-h-[600px] object-contain rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 bg-success-50 rounded-lg flex items-center justify-center">
                    <FileText size={32} color="#378200" />
                  </div>
                  <div className="text-center">
                    <p className="text-p4 font-heading font-semibold text-pneutral-900 m-0 mb-2">
                      {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
                    </p>
                    <p className="text-p3 font-body font-normal text-pneutral-500 m-0 mb-4">
                      This file cannot be previewed in the browser.
                    </p>
                    <a
                      href={activeCertDoc.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-success-800 text-white text-p3 font-heading font-semibold py-2.5 px-5 rounded-md no-underline"
                    >
                      <ExternalLink size={14} /> Open / Download
                    </a>
                  </div>
                </div>
              )}
            </div>
            {certDocs.length > 1 && (
              <div className="border-t border-pneutral-200 px-6 py-3 flex items-center gap-2 overflow-x-auto">
                <span className="text-p2 font-body font-normal text-pneutral-500 flex-shrink-0">Other certs:</span>
                {certDocs
                  .filter((c) => c.certificationId !== activeCertDoc.certificationId)
                  .map((cert) => (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => setActiveCertDoc(cert)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-success-900 bg-success-50 text-p2 font-body font-medium px-3 py-1.5 rounded-full border-none cursor-pointer"
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
  <div className={`grid grid-cols-2 gap-4 py-3 px-4 border-b border-pneutral-200 ${multiline ? "items-start" : "items-center"}`}>
    <div className="flex items-start gap-1">
      <span className="text-p4 font-heading font-medium text-pneutral-700">{label}</span>
      {required && <span className="text-warning-500 font-heading font-medium text-p4">*</span>}
    </div>
    {valueNode ? (
      <div className="flex justify-end flex-1">{valueNode}</div>
    ) : (
      <p className="text-p4 font-body font-normal text-pneutral-800 text-right m-0">{value ?? "—"}</p>
    )}
  </div>
);

const RadioDisplay = ({ value }: { value?: string | null }) => {
  if (!value) return <p className="text-p4 font-body font-normal text-pneutral-800 text-right m-0">—</p>;
  const displayValue = value === "veg" ? "Veg" : "Non-Veg";
  return (
    <div className="flex items-center gap-2 justify-start flex-1">
      <div className="w-[18px] h-[18px] rounded-full border-2 border-primary-800 flex items-center justify-center flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-primary-800" />
      </div>
      <span className="text-p4 font-body font-normal text-pneutral-800 text-left">{displayValue}</span>
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
  <div className="px-4 py-3 border-b border-pneutral-200 flex flex-col gap-3">
    <div className="flex items-center gap-1">
      <span className="text-p4 font-heading font-medium text-pneutral-700">{label}</span>
      {required && <span className="text-warning-500 font-heading font-medium text-p4">*</span>}
    </div>
    <p className="text-p4 font-body font-normal text-pneutral-800 whitespace-pre-wrap m-0">{value ?? "—"}</p>
  </div>
);

export { FoodInfantView };
export default FoodInfantView;
















// This code is working only no global css is here.........

// "use client";

// import React, { useState, useEffect } from "react";
// import { FileText, ExternalLink } from "lucide-react";
// import { PiSealCheckLight } from "react-icons/pi";
// import Image from "next/image";
// import {
//   getProductCategories,
//   getProductSubcategories,
//   getAgeGroups,
//   getProductForms,
//   getCountries,
//   getStorageConditions,
// } from "@/src/services/product/FoodInfantService";

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

// export interface FoodInfantAttributes {
//   productCategoryId?: number;
//   productSubcategoryId?: number;
//   productFormId?: number;
//   ageGroupId?: number;
//   storageConditionId?: number;
//   countryId?: number;
//   brandName?: string;
//   variantName?: string;
//   netQuantity?: string;
//   servingSize?: string;
//   vegNonvegIndicator?: "veg" | "non-veg";
//   allergenInformation?: string;
//   nutritionalInformation?: string;
//   nutritionalInformationImageUrl?: string;
//   activeIngredients?: string;
//   additivesPreservatives?: string;
//   productClaims?: string;
//   manufacturerName?: string;
//   certificateDocuments?: CertificateDocument[];
//   productUserManual?: string;
//   // Resolved names will be added
//   productCategoryName?: string | null;
//   productSubcategoryName?: string | null;
//   productFormName?: string | null;
//   ageGroupName?: string | null;
//   storageConditionName?: string | null;
//   countryName?: string | null;
// }

// export interface FoodInfantViewProps {
//   productName?: string | null;
//   productDescription?: string | null;
//   warningsPrecautions?: string | null;
//   displayImages?: string[];
//   foodAttr?: FoodInfantAttributes | null;
//   brochureUrl?: string | null;
//   placeholderImage?: string;
//   manufacturerName?: string | null;
// }

// /* ─────────────────────────────────────────────────────────
//    SHARED STYLES
// ───────────────────────────────────────────────────────── */

// const FONTS = {
//   workSans: "'Work Sans', 'Segoe UI', sans-serif",
//   notoSans: "'Noto Sans', 'Segoe UI', sans-serif",
//   openSans: "'Open Sans', 'Segoe UI', sans-serif",
// };

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
//   color: "#5A5B58",
//   fontSize: 16,
//   fontFamily: FONTS.workSans,
//   fontWeight: 500,
//   lineHeight: "24px",
//   wordWrap: "break-word",
//   margin: 0,
// };

// const REQUIRED_STAR: React.CSSProperties = {
//   color: "#FF3B3B",
//   fontSize: 16,
//   fontFamily: FONTS.workSans,
//   fontWeight: 500,
//   lineHeight: "24px",
//   flexShrink: 0,
// };

// const VALUE_TEXT: React.CSSProperties = {
//   color: "#3C3D3A",
//   fontSize: 16,
//   fontFamily: FONTS.notoSans,
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

// const isValidUrl = (url?: string | null) => {
//   if (!url) return false;
//   const t = url.trim().toUpperCase();
//   return !["", "PENDING", "NOT_UPLOADED"].includes(t);
// };

// const formatDate = (dateStr?: string | null): string => {
//   if (!dateStr) return "—";
//   try {
//     return new Date(dateStr).toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//   } catch {
//     return dateStr;
//   }
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

// const RadioDisplay = ({ value }: { value?: string | null }) => {
//   if (!value) return <p style={VALUE_TEXT}>—</p>;
//   const displayValue = value === "veg" ? "Veg" : "Non-Veg";
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start", flex: 1 }}>
//       <div
//         style={{
//           width: 18,
//           height: 18,
//           borderRadius: "50%",
//           border: "2px solid #4B0082",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           flexShrink: 0,
//         }}
//       >
//         <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4B0082" }} />
//       </div>
//       <span style={{ ...VALUE_TEXT, textAlign: "left" }}>{displayValue}</span>
//     </div>
//   );
// };

// const FullWidthBlock = ({
//   label,
//   value,
//   required = true,
// }: {
//   label: string;
//   value?: string | null;
//   required?: boolean;
// }) => (
//   <div
//     style={{
//       paddingLeft: 16,
//       paddingRight: 16,
//       paddingTop: 12,
//       paddingBottom: 12,
//       borderBottom: "1px #D5D5D4 solid",
//       display: "flex",
//       flexDirection: "column",
//       gap: 12,
//     }}
//   >
//     <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//       <span style={LABEL_TEXT}>{label}</span>
//       {required && <span style={REQUIRED_STAR}>*</span>}
//     </div>
//     <p
//       style={{
//         color: "#3C3D3A",
//         fontSize: 16,
//         fontFamily: FONTS.notoSans,
//         fontWeight: 400,
//         lineHeight: "24px",
//         wordWrap: "break-word",
//         margin: 0,
//         whiteSpace: "pre-wrap",
//       }}
//     >
//       {value ?? "—"}
//     </p>
//   </div>
// );

// /* ─────────────────────────────────────────────────────────
//    MAIN COMPONENT - Self-contained with master data resolution
// ───────────────────────────────────────────────────────── */

// const FoodInfantView = ({
//   productName,
//   productDescription,
//   warningsPrecautions,
//   displayImages = [],
//   foodAttr,
//   brochureUrl,
//   manufacturerName,
//   placeholderImage = "/assets/images/SellerMed.jpg",
// }: FoodInfantViewProps) => {
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//   const [showCertModal, setShowCertModal] = useState(false);
//   const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);
//   const [resolvedAttr, setResolvedAttr] = useState<FoodInfantAttributes | null>(null);
//   const [loading, setLoading] = useState(true);

//   // Resolve master data names from IDs
//   useEffect(() => {
//     if (!foodAttr) {
//       setLoading(false);
//       return;
//     }

//     const resolveMasterData = async () => {
//       setLoading(true);
//       try {
//         // Fetch all master data in parallel
//         const [
//           categoriesResult,
//           subcategoriesResult,
//           ageGroupsResult,
//           productFormsResult,
//           countriesResult,
//           storageConditionsResult,
//         ] = await Promise.allSettled([
//           getProductCategories(3),
//           foodAttr.productSubcategoryId ? getProductSubcategories(foodAttr.productCategoryId || 0) : Promise.resolve([]),
//           getAgeGroups(),
//           getProductForms(),
//           getCountries(),
//           getStorageConditions(),
//         ]);

//         // Helper to find name from array
//         const findName = (data: any[], id: number | undefined, idKey: string, nameKey: string): string | null => {
//           if (!data || !id) return null;
//           const item = data.find((item: any) => Number(item[idKey]) === Number(id));
//           return item ? item[nameKey] : null;
//         };

//         const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
//         const subcategories = subcategoriesResult.status === "fulfilled" ? subcategoriesResult.value : [];
//         const ageGroups = ageGroupsResult.status === "fulfilled" ? ageGroupsResult.value : [];
//         const productForms = productFormsResult.status === "fulfilled" ? productFormsResult.value : [];
//         const countries = countriesResult.status === "fulfilled" ? countriesResult.value : [];
//         const storageConditions = storageConditionsResult.status === "fulfilled" ? storageConditionsResult.value : [];

//         // Resolve names
//         const productCategoryName = findName(categories, foodAttr.productCategoryId, "productCategoryId", "productCategory");
//         const productSubcategoryName = findName(subcategories, foodAttr.productSubcategoryId, "productSubcategoryId", "productSubcategory");
//         const ageGroupName = findName(ageGroups, foodAttr.ageGroupId, "ageGroupId", "ageGroup");
//         const productFormName = findName(productForms, foodAttr.productFormId, "productFormId", "productForm");
//         const countryName = findName(countries, foodAttr.countryId, "countryId", "countryName");
//         const storageConditionName = findName(storageConditions, foodAttr.storageConditionId, "storageConditionId", "conditionName");

//         setResolvedAttr({
//           ...foodAttr,
//           productCategoryName,
//           productSubcategoryName,
//           ageGroupName,
//           productFormName,
//           countryName,
//           storageConditionName,
//         });
//       } catch (err) {
//         console.error("Failed to resolve Food/Infant master data:", err);
//         setResolvedAttr(foodAttr);
//       } finally {
//         setLoading(false);
//       }
//     };

//     resolveMasterData();
//   }, [foodAttr]);

//   // Add this right after you set resolvedAttr (around line 200-210)
// useEffect(() => {
//   if (resolvedAttr) {
//     console.log("Full resolvedAttr object:", resolvedAttr);
//     console.log("All keys in resolvedAttr:", Object.keys(resolvedAttr));
//   }
// }, [resolvedAttr]);

//   // Show loading state
//   if (loading) {
//     return (
//       <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 0" }}>
//         <div
//           style={{
//             width: 32,
//             height: 32,
//             border: "3px solid #E9D5FF",
//             borderTopColor: "#4B0082",
//             borderRadius: "50%",
//             animation: "spin 0.8s linear infinite",
//           }}
//         />
//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     );
//   }

//   if (!resolvedAttr) return null;

//   // Get the final attribute object with resolved names
//   const attr = resolvedAttr;

  

//   // Resolve cert docs
//   const certDocs: CertificateDocument[] = (attr.certificateDocuments ?? []).filter(
//     (c) => isValidUrl(c.certificateUrl),
//   );

//   // Resolve storage condition
//   const storageCondition = attr.storageConditionName || null;

//   // Resolve nutritional information display
//   const nutritionalInfoDisplay = (() => {
//     if (attr.nutritionalInformation === "as-per-label") {
//       return "As per the label";
//     }
//     if (isValidUrl(attr.nutritionalInformationImageUrl)) {
//       return attr.nutritionalInformationImageUrl;
//     }
//     return null;
//   })();

//   // Images
//   const imagesToShow = displayImages.length > 0 ? displayImages : [placeholderImage];

//   // Brochure URL
//   const resolvedBrochureUrl = isValidUrl(brochureUrl)
//     ? brochureUrl
//     : isValidUrl(attr.productUserManual)
//     ? attr.productUserManual
//     : null;

//   return (
//     <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
//       {/* ── Section header ── */}
//       <div style={{ paddingTop: 8, paddingBottom: 8, borderBottom: "1px #D5D5D4 solid" }}>
//         <h2 style={{ color: "#1E1E1D", fontSize: 28, fontFamily: FONTS.workSans, fontWeight: 500, lineHeight: "36px", margin: 0 }}>
//           Product Details
//         </h2>
//       </div>

//       {/* ── Product Images ── */}
//       <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 16 }}>
//         <p style={{ color: "#1E1E1D", fontSize: 18, fontFamily: FONTS.openSans, fontWeight: 600, lineHeight: "24px", margin: 0 }}>
//           Product Images
//         </p>
//         <div style={{ padding: 12, background: "#F8F5FF", borderRadius: 12, outline: "1px #B550FA solid", outlineOffset: -1, display: "flex", flexDirection: "column", gap: 16 }}>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
//             {imagesToShow.slice(0, 4).map((img, idx) => (
//               <div
//                 key={idx}
//                 onClick={() => setSelectedImageIndex(idx)}
//                 style={{
//                   position: "relative",
//                   height: 276,
//                   boxShadow: "0px 2px 4px -2px rgba(0,0,0,0.10), 0px 4px 6px -1px rgba(0,0,0,0.10)",
//                   overflow: "hidden",
//                   borderRadius: 12,
//                   outline: idx === selectedImageIndex ? "1px #B550FA solid" : "none",
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
//                   <div style={{ position: "absolute", left: 10, top: 10, padding: "4px 8px", background: "#B550FA", borderRadius: 4 }}>
//                     <span style={{ color: "white", fontSize: 12, fontFamily: FONTS.openSans, fontWeight: 600, lineHeight: "18px" }}>Primary</span>
//                   </div>
//                 )}
//               </div>
//             ))}
//             {Array.from({ length: Math.max(0, 4 - imagesToShow.length) }).map((_, i) => (
//               <div key={`empty-${i}`} style={{ height: 276, borderRadius: 12, background: "#F5F5F5", boxShadow: "0px 1px 2px -1px rgba(0,0,0,0.10)" }} />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ── Two-column field rows ── */}
//       <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
//         {/* LEFT COLUMN */}
//         <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
//           <FieldRow label="Product Name" value={productName} multiline />
//           <FieldRow label="Product Category" value={attr.productCategoryName} />
//           <FieldRow label="Product Subcategory" value={attr.productSubcategoryName} />
//           <FieldRow label="Brand Name" value={attr.brandName} />
//           <FieldRow label="Variant Name" value={attr.variantName} required={false} />
//           <FieldRow label="Product Form" value={attr.productFormName} />
//           <FieldRow label="Net Quantity" value={attr.netQuantity} />
//           <FieldRow label="Serving Size" value={attr.servingSize} />
//           <FieldRow label="Age Group" value={attr.ageGroupName} />
//           <FieldRow label="Product Claims" value={attr.productClaims} multiline />
//           <FieldRow label="Active Ingredients" value={attr.activeIngredients} multiline />
//           <FieldRow label="Additives / Preservatives" value={attr.additivesPreservatives} multiline required={false} />

//           {/* Nutritional Information */}
//           {/* Nutritional Information */}
// {/* Nutritional Information */}
// {/* Nutritional Information */}
// {/* Nutritional Information */}
// <div style={{ ...ROW, alignItems: "flex-start" }}>
//   <div style={ROW_LABEL}>
//     <span style={LABEL_TEXT}>Nutritional Information</span>
//     <span style={REQUIRED_STAR}>*</span>
//   </div>
//   <div style={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}>
//     {attr.nutritionalInformation === "image-upload" ? (
//       (attr.nutritionalInformationImageUrl || attr.nutritionalInformationImageUrl) ? (
//         <a href={attr.nutritionalInformationImageUrl || attr.nutritionalInformationImageUrl} target="_blank" rel="noopener noreferrer">
//           <img
//             src={attr.nutritionalInformationImageUrl || attr.nutritionalInformationImageUrl}
//             alt="Nutritional Information"
//             style={{
//               width: 80,
//               height: 80,
//               objectFit: "cover",
//               borderRadius: 8,
//               border: "1px solid #D5D5D4",
//             }}
//             onError={(e) => {
//               console.error("Failed to load image");
//               (e.target as HTMLImageElement).style.display = "none";
//             }}
//           />
//         </a>
//       ) : (
//         <p style={{ ...VALUE_TEXT, color: "#FF6600" }}>
//           Image URL missing
//         </p>
//       )
//     ) : attr.nutritionalInformation === "as-per-label" ? (
//       <p style={VALUE_TEXT}>As per the label</p>
//     ) : (
//       <p style={VALUE_TEXT}>{attr.nutritionalInformation || "—"}</p>
//     )}
//   </div>
// </div>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column" }}>
//           <FieldRow label="Allergen Information" value={attr.allergenInformation} multiline />

//           {/* Veg / Non-Veg Indicator */}
//           <div style={{ padding: "12px 16px", borderBottom: "1px solid #D5D5D4", display: "flex", flexDirection: "column", gap: 8 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//               <span style={LABEL_TEXT}>Veg / Non-Veg Indicator</span>
//               <span style={REQUIRED_STAR}>*</span>
//             </div>
//             <RadioDisplay value={attr.vegNonvegIndicator} />
//           </div>

//           <FieldRow label="Storage Condition" value={storageCondition} multiline />
//           <FieldRow label="Manufacturer Name" value={manufacturerName || attr.manufacturerName} />

//           {/* Uploaded Product Brochure */}
//           <div style={{ paddingTop: 12, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderBottom: "1px #D5D5D4 solid", display: "flex", flexDirection: "column", gap: 8 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//               <span style={LABEL_TEXT}>Uploaded Product Brochure</span>
//               <span style={REQUIRED_STAR}>*</span>
//             </div>
//             {resolvedBrochureUrl ? (
//               <a href={resolvedBrochureUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F8F8F9", borderRadius: 8, textDecoration: "none" }}>
//                 <FileText size={24} color="#3C3D3A" />
//                 <span style={{ color: "#3C3D3A", fontSize: 16, fontFamily: FONTS.openSans, fontWeight: 400, lineHeight: "22px" }}>
//                   {resolvedBrochureUrl.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
//                 </span>
//               </a>
//             ) : (
//               <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F8F8F9", borderRadius: 8 }}>
//                 <FileText size={24} color="#3C3D3A" />
//                 <span style={{ color: "#5A5B58", fontSize: 16, fontFamily: FONTS.openSans, fontWeight: 400, lineHeight: "22px" }}>No brochure uploaded</span>
//               </div>
//             )}
//           </div>

//           <FieldRow label="Country of Origin" value={attr.countryName} />

//           {/* Certifications / Compliance */}
//           {certDocs.length > 0 && (
//             <div style={{ paddingTop: 12, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, borderBottom: "1px #D5D5D4 solid", display: "flex", flexDirection: "column", gap: 8 }}>
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
//                       background: "#DCF7CB",
//                       border: "none",
//                       borderRadius: 8,
//                       cursor: "pointer",
//                       fontFamily: FONTS.notoSans,
//                       fontSize: 16,
//                       fontWeight: 500,
//                       lineHeight: "24px",
//                       color: "#378200",
//                     }}
//                   >
//                     <PiSealCheckLight size={16} />
//                     {cert.certificationName ?? cert.label ?? `Cert ${cert.certificationId}`}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <FullWidthBlock label="Product Description" value={productDescription} />
//       <FullWidthBlock label="Warnings & Precautions" value={warningsPrecautions} />

//       {/* Certificate Modal */}
//       {showCertModal && activeCertDoc !== null && (
//         <div
//           onClick={() => {
//             setShowCertModal(false);
//             setActiveCertDoc(null);
//           }}
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
//             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px #D5D5D4 solid" }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//                 <div style={{ width: 36, height: 36, background: "#DCF7CB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
//                   <PiSealCheckLight size={20} color="#378200" />
//                 </div>
//                 <div>
//                   <p style={{ color: "#1E1E1D", fontSize: 16, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "22px", margin: 0 }}>
//                     {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                   </p>
//                   <p style={{ color: "#5A5B58", fontSize: 12, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "18px", margin: 0 }}>
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
//                     color: "#378200",
//                     fontSize: 14,
//                     fontFamily: FONTS.workSans,
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
//                   onClick={() => {
//                     setShowCertModal(false);
//                     setActiveCertDoc(null);
//                   }}
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
//               ) : (
//                 <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0" }}>
//                   <div style={{ width: 64, height: 64, background: "#DCF7CB", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <FileText size={32} color="#378200" />
//                   </div>
//                   <div style={{ textAlign: "center" }}>
//                     <p style={{ color: "#1E1E1D", fontSize: 16, fontFamily: FONTS.workSans, fontWeight: 600, lineHeight: "22px", margin: "0 0 8px" }}>
//                       {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                     </p>
//                     <p style={{ color: "#5A5B58", fontSize: 14, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "20px", margin: "0 0 16px" }}>
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
//                         background: "#47A400",
//                         color: "white",
//                         fontSize: 14,
//                         fontFamily: FONTS.workSans,
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
//             {certDocs.length > 1 && (
//               <div style={{ borderTop: "1px #D5D5D4 solid", padding: "12px 24px", display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
//                 <span style={{ color: "#5A5B58", fontSize: 12, fontFamily: FONTS.notoSans, fontWeight: 400, lineHeight: "18px", flexShrink: 0 }}>
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
//                         color: "#378200",
//                         background: "#DCF7CB",
//                         fontSize: 12,
//                         fontFamily: FONTS.notoSans,
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

// export { FoodInfantView };
// export default FoodInfantView;