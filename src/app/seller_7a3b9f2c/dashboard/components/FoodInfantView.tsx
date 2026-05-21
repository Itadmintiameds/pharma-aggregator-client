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
  getNetQuantityUnits,
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
  productAttributeId?: string;
  productCategoryId?: number;
  productSubcategoryId?: number;
  productFormId?: number;
  ageGroupId?: number;
  ageGroupIds?: number[];
  ageGroupMastersDto?: Array<{ ageGroupId: number; ageGroup: string }>;
  storageConditionId?: number;
  countryId?: number;
  brandName?: string;
  variantName?: string;
  netQuantity?: number;
  unitId?: number;
  unitName?: string;
  servingSize?: number;
  servingSizeUnitId?: number;
  servingSizeUnitName?: string;
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
  const [ageGroupLabels, setAgeGroupLabels] = useState<Map<number, string>>(new Map());
  const [unitLabels, setUnitLabels] = useState<Map<number, string>>(new Map());

  // Fetch age groups for mapping IDs to labels
  useEffect(() => {
    const fetchAgeGroups = async () => {
      try {
        const ageData = await getAgeGroups();
        const map = new Map<number, string>();
        ageData.forEach((item: any) => {
          map.set(item.ageGroupId, item.ageGroup);
        });
        setAgeGroupLabels(map);
      } catch (err) {
        console.error("Failed to fetch age groups for view:", err);
      }
    };
    fetchAgeGroups();
  }, []);

  // Fetch net quantity units for mapping unitId to unit name
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const unitData = await getNetQuantityUnits(3);
        const map = new Map<number, string>();
        unitData.forEach((item: any) => {
          const unitId = item.unitId || item.id;
          const unitName = item.unitName || item.name || item.unitSymbol || "";
          if (unitId && unitName) {
            map.set(unitId, unitName);
          }
        });
        setUnitLabels(map);
      } catch (err) {
        console.error("Failed to fetch units for view:", err);
      }
    };
    fetchUnits();
  }, []);

  // Helper to get unit name from unitId
  const getUnitNameFromId = (unitId: number | undefined): string => {
    if (!unitId) return "";
    return unitLabels.get(unitId) || "";
  };

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

        // Preserve all original foodAttr data while adding resolved names
        setResolvedAttr({
          ...foodAttr,
          productCategoryName: findName(categories, foodAttr.productCategoryId, "productCategoryId", "productCategory"),
          productSubcategoryName: findName(subcategories, foodAttr.productSubcategoryId, "productSubcategoryId", "productSubcategory"),
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

  // ─────────────────────────────────────────────────────────
  // Format Age Group Display - Comma separated list
  // Supports both manual entry (ageGroupMastersDto) and Excel upload (ageGroupIds)
  // ─────────────────────────────────────────────────────────
  let ageGroupDisplay = "—";
  if (attr.ageGroupMastersDto && attr.ageGroupMastersDto.length > 0) {
    ageGroupDisplay = attr.ageGroupMastersDto.map(ag => ag.ageGroup).join(", ");
  } else if (attr.ageGroupIds && attr.ageGroupIds.length > 0) {
    ageGroupDisplay = attr.ageGroupIds
      .map(id => ageGroupLabels.get(id) || String(id))
      .filter(Boolean)
      .join(", ");
  } else if (attr.ageGroupId) {
    ageGroupDisplay = ageGroupLabels.get(attr.ageGroupId) || String(attr.ageGroupId);
  }

  // ─────────────────────────────────────────────────────────
  // Format Net Quantity - Value + Unit
  // Priority: unitName from API (manual entry) → lookup from unitLabels (Excel upload)
  // ─────────────────────────────────────────────────────────
  let netQuantityDisplay = "—";
  if (attr.netQuantity) {
    let unit = attr.unitName || "";
    if (!unit && attr.unitId) {
      unit = getUnitNameFromId(attr.unitId);
    }
    netQuantityDisplay = unit ? `${attr.netQuantity} ${unit}` : String(attr.netQuantity);
  }

  // ─────────────────────────────────────────────────────────
  // Format Serving Size - Value + Unit
  // ─────────────────────────────────────────────────────────
  let servingSizeDisplay = "—";
  if (attr.servingSize) {
    const unit = attr.servingSizeUnitName || "";
    servingSizeDisplay = unit ? `${attr.servingSize} ${unit}` : String(attr.servingSize);
  }

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
          <FieldRow label="Net Quantity" value={netQuantityDisplay} />
          <FieldRow label="Serving Size" value={servingSizeDisplay} />
          <FieldRow label="Age Group" value={ageGroupDisplay} />
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








// for manual entry it is working , not for the excel unit


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
//   getNetQuantityUnits,
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
//   productAttributeId?: string;
//   productCategoryId?: number;
//   productSubcategoryId?: number;
//   productFormId?: number;
//   ageGroupId?: number;
//   ageGroupIds?: number[];
//   ageGroupMastersDto?: Array<{ ageGroupId: number; ageGroup: string }>;
//   storageConditionId?: number;
//   countryId?: number;
//   brandName?: string;
//   variantName?: string;
//   netQuantity?: number;
//   unitId?: number;
//   unitName?: string;
//   servingSize?: number;
//   servingSizeUnitId?: number;
//   servingSizeUnitName?: string;
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
//    HELPER FUNCTIONS
// ───────────────────────────────────────────────────────── */

// const isValidUrl = (url?: string | null) => {
//   if (!url) return false;
//   const t = url.trim().toUpperCase();
//   return !["", "PENDING", "NOT_UPLOADED"].includes(t);
// };

// const isImageUrl = (url: string) =>
//   /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

// /* ─────────────────────────────────────────────────────────
//    MAIN COMPONENT
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
//   const [ageGroupLabels, setAgeGroupLabels] = useState<Map<number, string>>(new Map());
//   const [unitLabels, setUnitLabels] = useState<Map<number, string>>(new Map());

//   // Fetch age groups for mapping IDs to labels
//   useEffect(() => {
//     const fetchAgeGroups = async () => {
//       try {
//         const ageData = await getAgeGroups();
//         const map = new Map<number, string>();
//         ageData.forEach((item: any) => {
//           map.set(item.ageGroupId, item.ageGroup);
//         });
//         setAgeGroupLabels(map);
//       } catch (err) {
//         console.error("Failed to fetch age groups for view:", err);
//       }
//     };
//     fetchAgeGroups();
//   }, []);

//   // Fetch net quantity units for mapping unitId to unit name
//   useEffect(() => {
//     const fetchUnits = async () => {
//       try {
//         const unitData = await getNetQuantityUnits(3);
//         const map = new Map<number, string>();
//         unitData.forEach((item: any) => {
//           const unitId = item.unitId || item.id;
//           const unitName = item.unitName || item.name || item.unitSymbol || "";
//           if (unitId && unitName) {
//             map.set(unitId, unitName);
//           }
//         });
//         setUnitLabels(map);
//       } catch (err) {
//         console.error("Failed to fetch units for view:", err);
//       }
//     };
//     fetchUnits();
//   }, []);

//   // Resolve master data names from IDs
//   useEffect(() => {
//     if (!foodAttr) {
//       setLoading(false);
//       return;
//     }

//     const resolveMasterData = async () => {
//       setLoading(true);
//       try {
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

//         setResolvedAttr({
//           ...foodAttr,
//           productCategoryName: findName(categories, foodAttr.productCategoryId, "productCategoryId", "productCategory"),
//           productSubcategoryName: findName(subcategories, foodAttr.productSubcategoryId, "productSubcategoryId", "productSubcategory"),
//           ageGroupName: findName(ageGroups, foodAttr.ageGroupId, "ageGroupId", "ageGroup"),
//           productFormName: findName(productForms, foodAttr.productFormId, "productFormId", "productForm"),
//           countryName: findName(countries, foodAttr.countryId, "countryId", "countryName"),
//           storageConditionName: findName(storageConditions, foodAttr.storageConditionId, "storageConditionId", "conditionName"),
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

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center py-12">
//         <div className="w-8 h-8 border-3 border-secondary-200 border-t-primary-600 rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (!resolvedAttr) return null;

//   const attr = resolvedAttr;
//   const certDocs: CertificateDocument[] = (attr.certificateDocuments ?? []).filter(
//     (c) => isValidUrl(c.certificateUrl),
//   );
//   const storageCondition = attr.storageConditionName || null;
//   const imagesToShow = displayImages.length > 0 ? displayImages : [placeholderImage];
//   const resolvedBrochureUrl = isValidUrl(brochureUrl)
//     ? brochureUrl
//     : isValidUrl(attr.productUserManual)
//     ? attr.productUserManual
//     : null;

//   // ─────────────────────────────────────────────────────────
//   // Format Age Group Display - Comma separated list
//   // ─────────────────────────────────────────────────────────
//   let ageGroupDisplay = "—";
//   if (attr.ageGroupMastersDto && attr.ageGroupMastersDto.length > 0) {
//     ageGroupDisplay = attr.ageGroupMastersDto.map(ag => ag.ageGroup).join(", ");
//   } else if (attr.ageGroupIds && attr.ageGroupIds.length > 0) {
//     ageGroupDisplay = attr.ageGroupIds
//       .map(id => ageGroupLabels.get(id) || String(id))
//       .filter(Boolean)
//       .join(", ");
//   } else if (attr.ageGroupId) {
//     ageGroupDisplay = ageGroupLabels.get(attr.ageGroupId) || String(attr.ageGroupId);
//   }

//   // ─────────────────────────────────────────────────────────
//   // Format Net Quantity - Value + Unit (map unitId to unit name)
//   // ─────────────────────────────────────────────────────────
//   let netQuantityDisplay = "—";
//   if (attr.netQuantity) {
//     // Try to get unit name from multiple sources
//     let unit = attr.unitName || "";
//     if (!unit && attr.unitId && unitLabels.has(attr.unitId)) {
//       unit = unitLabels.get(attr.unitId) || "";
//     }
//     netQuantityDisplay = unit ? `${attr.netQuantity} ${unit}` : String(attr.netQuantity);
//   }

//   // ─────────────────────────────────────────────────────────
//   // Format Serving Size - Value + Unit
//   // ─────────────────────────────────────────────────────────
//   let servingSizeDisplay = "—";
//   if (attr.servingSize) {
//     const unit = attr.servingSizeUnitName || "";
//     servingSizeDisplay = unit ? `${attr.servingSize} ${unit}` : String(attr.servingSize);
//   }


//   return (
//     <div className="w-full flex flex-col gap-4">
//       {/* Section header */}
//       <div className="pt-2 pb-2 border-b border-pneutral-200">
//         <h2 className="text-h4 font-heading font-medium text-pneutral-900 m-0">
//           Product Details
//         </h2>
//       </div>

//       {/* Product Images */}
//       <div className="w-full flex flex-col gap-4">
//         <p className="text-label-l4 font-heading font-semibold text-pneutral-900 m-0">
//           Product Images
//         </p>
//         <div className="p-3 bg-secondary-50 rounded-lg outline outline-1 outline-primary-600 -outline-offset-1 flex flex-col gap-4">
//           <div className="grid grid-cols-4 gap-4">
//             {imagesToShow.slice(0, 4).map((img, idx) => (
//               <div
//                 key={idx}
//                 onClick={() => setSelectedImageIndex(idx)}
//                 className={`relative h-64 shadow-sm overflow-hidden rounded-lg cursor-pointer ${
//                   idx === selectedImageIndex ? "outline outline-1 outline-primary-600 -outline-offset-1" : ""
//                 }`}
//               >
//                 <Image
//                   src={img}
//                   alt={`Product image ${idx + 1}`}
//                   fill
//                   className="object-cover"
//                   unoptimized={img.startsWith("http")}
//                   onError={(e) => {
//                     (e.target as HTMLImageElement).src = placeholderImage;
//                   }}
//                 />
//                 {idx === 0 && (
//                   <div className="absolute left-2.5 top-2.5 px-2 py-1 bg-primary-600 rounded">
//                     <span className="text-white text-p2 font-heading font-semibold leading-[18px]">Primary</span>
//                   </div>
//                 )}
//               </div>
//             ))}
//             {Array.from({ length: Math.max(0, 4 - imagesToShow.length) }).map((_, i) => (
//               <div key={`empty-${i}`} className="h-64 rounded-lg bg-sneutral-50 shadow-sm" />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Two-column layout */}
//       <div className="flex gap-9 items-start">
//         {/* LEFT COLUMN */}
//         <div className="flex-1 flex flex-col">
//           <FieldRow label="Product Name" value={productName} multiline />
//           <FieldRow label="Product Category" value={attr.productCategoryName} />
//           <FieldRow label="Product Subcategory" value={attr.productSubcategoryName} />
//           <FieldRow label="Brand Name" value={attr.brandName} />
//           <FieldRow label="Variant Name" value={attr.variantName} required={false} />
//           <FieldRow label="Product Form" value={attr.productFormName} />
//           <FieldRow label="Net Quantity" value={netQuantityDisplay} />
//           <FieldRow label="Serving Size" value={servingSizeDisplay} />
//           <FieldRow label="Age Group" value={ageGroupDisplay} />
//           <FieldRow label="Product Claims" value={attr.productClaims} multiline />
//           <FieldRow label="Active Ingredients" value={attr.activeIngredients} multiline />
//           <FieldRow label="Additives / Preservatives" value={attr.additivesPreservatives} multiline required={false} />

//           {/* Nutritional Information */}
//           <div className="grid grid-cols-2 items-start gap-4 py-3 px-4 border-b border-pneutral-200">
//             <div className="flex items-start gap-1">
//               <span className="text-p4 font-heading font-medium text-pneutral-700">Nutritional Information</span>
//               <span className="text-warning-500 font-heading font-medium text-p4">*</span>
//             </div>
//             <div className="flex justify-end">
//               {attr.nutritionalInformation === "image-upload" && attr.nutritionalInformationImageUrl ? (
//                 <a href={attr.nutritionalInformationImageUrl} target="_blank" rel="noopener noreferrer">
//                   <img
//                     src={attr.nutritionalInformationImageUrl}
//                     alt="Nutritional Information"
//                     className="w-20 h-20 object-cover rounded-md border border-pneutral-200"
//                   />
//                 </a>
//               ) : attr.nutritionalInformation === "as-per-label" ? (
//                 <p className="text-p4 font-body font-normal text-pneutral-800">As per the label</p>
//               ) : (
//                 <p className="text-p4 font-body font-normal text-pneutral-800">—</p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div className="flex-1 flex flex-col">
//           <FieldRow label="Allergen Information" value={attr.allergenInformation} multiline />

//           {/* Veg / Non-Veg Indicator */}
//           <div className="py-3 px-4 border-b border-pneutral-200 flex flex-col gap-2">
//             <div className="flex items-center gap-1">
//               <span className="text-p4 font-heading font-medium text-pneutral-700">Veg / Non-Veg Indicator</span>
//               <span className="text-warning-500 font-heading font-medium text-p4">*</span>
//             </div>
//             <RadioDisplay value={attr.vegNonvegIndicator} />
//           </div>

//           <FieldRow label="Storage Condition" value={storageCondition} multiline />
//           <FieldRow label="Manufacturer Name" value={manufacturerName || attr.manufacturerName} />

//           {/* Uploaded Product Brochure */}
//           <div className="pt-3 pb-2 px-4 border-b border-pneutral-200 flex flex-col gap-2">
//             <div className="flex items-center gap-1">
//               <span className="text-p4 font-heading font-medium text-pneutral-700">Uploaded Product Brochure</span>
//               <span className="text-warning-500 font-heading font-medium text-p4">*</span>
//             </div>
//             {resolvedBrochureUrl ? (
//               <a href={resolvedBrochureUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-sneutral-50 rounded-md no-underline">
//                 <FileText size={24} color="#3C3D3A" />
//                 <span className="text-p4 font-body font-normal text-pneutral-800">
//                   {resolvedBrochureUrl.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
//                 </span>
//               </a>
//             ) : (
//               <div className="flex items-center gap-3 p-3 bg-sneutral-50 rounded-md">
//                 <FileText size={24} color="#3C3D3A" />
//                 <span className="text-p4 font-body font-normal text-pneutral-500">No brochure uploaded</span>
//               </div>
//             )}
//           </div>

//           <FieldRow label="Country of Origin" value={attr.countryName} />

//           {/* Certifications / Compliance */}
//           {certDocs.length > 0 && (
//             <div className="pt-3 pb-2 px-4 border-b border-pneutral-200 flex flex-col gap-2">
//               <div className="flex items-start gap-1">
//                 <span className="text-p4 font-heading font-medium text-pneutral-700">Certifications / Compliance</span>
//                 <span className="text-warning-500 font-heading font-medium text-p4">*</span>
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {certDocs.map((cert) => (
//                   <button
//                     key={cert.certificationId}
//                     type="button"
//                     onClick={() => {
//                       setActiveCertDoc(cert);
//                       setShowCertModal(true);
//                     }}
//                     className="flex items-center gap-2 px-2 py-1 bg-success-50 border-none rounded-md cursor-pointer font-body text-p4 font-medium text-success-900"
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

//       <FullWidthBlock label="Warnings & Precautions" value={warningsPrecautions} />
//       <FullWidthBlock label="Product Description" value={productDescription} />

//       {/* Certificate Modal */}
//       {showCertModal && activeCertDoc !== null && (
//         <div
//           onClick={() => {
//             setShowCertModal(false);
//             setActiveCertDoc(null);
//           }}
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]"
//           >
//             <div className="flex items-center justify-between px-6 py-4 border-b border-pneutral-200">
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 bg-success-50 rounded-md flex items-center justify-center">
//                   <PiSealCheckLight size={20} color="#378200" />
//                 </div>
//                 <div>
//                   <p className="text-p4 font-heading font-semibold text-pneutral-900 m-0">
//                     {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                   </p>
//                   <p className="text-p2 font-body font-normal text-pneutral-500 m-0">Certification Document</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <a
//                   href={activeCertDoc.certificateUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center gap-1.5 text-success-900 text-p3 font-heading font-semibold no-underline px-3 py-1.5 rounded-md"
//                 >
//                   <ExternalLink size={14} /> Open
//                 </a>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowCertModal(false);
//                     setActiveCertDoc(null);
//                   }}
//                   className="w-8 h-8 rounded-md border-none bg-transparent cursor-pointer text-pneutral-500 text-xl flex items-center justify-center"
//                 >
//                   ×
//                 </button>
//               </div>
//             </div>
//             <div className="flex-1 overflow-auto bg-sneutral-50 p-4 flex items-center justify-center min-h-[400px]">
//               {isImageUrl(activeCertDoc.certificateUrl) ? (
//                 <img
//                   src={activeCertDoc.certificateUrl}
//                   alt={activeCertDoc.certificationName ?? "Certificate"}
//                   className="max-w-full max-h-[600px] object-contain rounded-md"
//                 />
//               ) : (
//                 <div className="flex flex-col items-center gap-4 py-8">
//                   <div className="w-16 h-16 bg-success-50 rounded-lg flex items-center justify-center">
//                     <FileText size={32} color="#378200" />
//                   </div>
//                   <div className="text-center">
//                     <p className="text-p4 font-heading font-semibold text-pneutral-900 m-0 mb-2">
//                       {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                     </p>
//                     <p className="text-p3 font-body font-normal text-pneutral-500 m-0 mb-4">
//                       This file cannot be previewed in the browser.
//                     </p>
//                     <a
//                       href={activeCertDoc.certificateUrl}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="inline-flex items-center gap-2 bg-success-800 text-white text-p3 font-heading font-semibold py-2.5 px-5 rounded-md no-underline"
//                     >
//                       <ExternalLink size={14} /> Open / Download
//                     </a>
//                   </div>
//                 </div>
//               )}
//             </div>
//             {certDocs.length > 1 && (
//               <div className="border-t border-pneutral-200 px-6 py-3 flex items-center gap-2 overflow-x-auto">
//                 <span className="text-p2 font-body font-normal text-pneutral-500 flex-shrink-0">Other certs:</span>
//                 {certDocs
//                   .filter((c) => c.certificationId !== activeCertDoc.certificationId)
//                   .map((cert) => (
//                     <button
//                       key={cert.certificationId}
//                       type="button"
//                       onClick={() => setActiveCertDoc(cert)}
//                       className="flex-shrink-0 flex items-center gap-1.5 text-success-900 bg-success-50 text-p2 font-body font-medium px-3 py-1.5 rounded-full border-none cursor-pointer"
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
//   <div className={`grid grid-cols-2 gap-4 py-3 px-4 border-b border-pneutral-200 ${multiline ? "items-start" : "items-center"}`}>
//     <div className="flex items-start gap-1">
//       <span className="text-p4 font-heading font-medium text-pneutral-700">{label}</span>
//       {required && <span className="text-warning-500 font-heading font-medium text-p4">*</span>}
//     </div>
//     {valueNode ? (
//       <div className="flex justify-end flex-1">{valueNode}</div>
//     ) : (
//       <p className="text-p4 font-body font-normal text-pneutral-800 text-right m-0">{value ?? "—"}</p>
//     )}
//   </div>
// );

// const RadioDisplay = ({ value }: { value?: string | null }) => {
//   if (!value) return <p className="text-p4 font-body font-normal text-pneutral-800 text-right m-0">—</p>;
//   const displayValue = value === "veg" ? "Veg" : "Non-Veg";
//   return (
//     <div className="flex items-center gap-2 justify-start flex-1">
//       <div className="w-[18px] h-[18px] rounded-full border-2 border-primary-800 flex items-center justify-center flex-shrink-0">
//         <div className="w-2.5 h-2.5 rounded-full bg-primary-800" />
//       </div>
//       <span className="text-p4 font-body font-normal text-pneutral-800 text-left">{displayValue}</span>
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
//   <div className="px-4 py-3 border-b border-pneutral-200 flex flex-col gap-3">
//     <div className="flex items-center gap-1">
//       <span className="text-p4 font-heading font-medium text-pneutral-700">{label}</span>
//       {required && <span className="text-warning-500 font-heading font-medium text-p4">*</span>}
//     </div>
//     <p className="text-p4 font-body font-normal text-pneutral-800 whitespace-pre-wrap m-0">{value ?? "—"}</p>
//   </div>
// );

// export { FoodInfantView };
// export default FoodInfantView;













// old code  dated 21.05.2026

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
//    HELPER FUNCTIONS
// ───────────────────────────────────────────────────────── */

// const isValidUrl = (url?: string | null) => {
//   if (!url) return false;
//   const t = url.trim().toUpperCase();
//   return !["", "PENDING", "NOT_UPLOADED"].includes(t);
// };

// const isImageUrl = (url: string) =>
//   /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

// /* ─────────────────────────────────────────────────────────
//    MAIN COMPONENT
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

//         setResolvedAttr({
//           ...foodAttr,
//           productCategoryName: findName(categories, foodAttr.productCategoryId, "productCategoryId", "productCategory"),
//           productSubcategoryName: findName(subcategories, foodAttr.productSubcategoryId, "productSubcategoryId", "productSubcategory"),
//           ageGroupName: findName(ageGroups, foodAttr.ageGroupId, "ageGroupId", "ageGroup"),
//           productFormName: findName(productForms, foodAttr.productFormId, "productFormId", "productForm"),
//           countryName: findName(countries, foodAttr.countryId, "countryId", "countryName"),
//           storageConditionName: findName(storageConditions, foodAttr.storageConditionId, "storageConditionId", "conditionName"),
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

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center py-12">
//         <div className="w-8 h-8 border-3 border-secondary-200 border-t-primary-600 rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (!resolvedAttr) return null;

//   const attr = resolvedAttr;
//   const certDocs: CertificateDocument[] = (attr.certificateDocuments ?? []).filter(
//     (c) => isValidUrl(c.certificateUrl),
//   );
//   const storageCondition = attr.storageConditionName || null;
//   const imagesToShow = displayImages.length > 0 ? displayImages : [placeholderImage];
//   const resolvedBrochureUrl = isValidUrl(brochureUrl)
//     ? brochureUrl
//     : isValidUrl(attr.productUserManual)
//     ? attr.productUserManual
//     : null;

//   return (
//     <div className="w-full flex flex-col gap-4">
//       {/* Section header */}
//       <div className="pt-2 pb-2 border-b border-pneutral-200">
//         <h2 className="text-h4 font-heading font-medium text-pneutral-900 m-0">
//           Product Details
//         </h2>
//       </div>

//       {/* Product Images */}
//       <div className="w-full flex flex-col gap-4">
//         <p className="text-label-l4 font-heading font-semibold text-pneutral-900 m-0">
//           Product Images
//         </p>
//         <div className="p-3 bg-secondary-50 rounded-lg outline outline-1 outline-primary-600 -outline-offset-1 flex flex-col gap-4">
//           <div className="grid grid-cols-4 gap-4">
//             {imagesToShow.slice(0, 4).map((img, idx) => (
//               <div
//                 key={idx}
//                 onClick={() => setSelectedImageIndex(idx)}
//                 className={`relative h-64 shadow-sm overflow-hidden rounded-lg cursor-pointer ${
//                   idx === selectedImageIndex ? "outline outline-1 outline-primary-600 -outline-offset-1" : ""
//                 }`}
//               >
//                 <Image
//                   src={img}
//                   alt={`Product image ${idx + 1}`}
//                   fill
//                   className="object-cover"
//                   unoptimized={img.startsWith("http")}
//                   onError={(e) => {
//                     (e.target as HTMLImageElement).src = placeholderImage;
//                   }}
//                 />
//                 {idx === 0 && (
//                   <div className="absolute left-2.5 top-2.5 px-2 py-1 bg-primary-600 rounded">
//                     <span className="text-white text-p2 font-heading font-semibold leading-[18px]">Primary</span>
//                   </div>
//                 )}
//               </div>
//             ))}
//             {Array.from({ length: Math.max(0, 4 - imagesToShow.length) }).map((_, i) => (
//               <div key={`empty-${i}`} className="h-64 rounded-lg bg-sneutral-50 shadow-sm" />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Two-column layout */}
//       <div className="flex gap-9 items-start">
//         {/* LEFT COLUMN */}
//         <div className="flex-1 flex flex-col">
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
//           <div className="grid grid-cols-2 items-start gap-4 py-3 px-4 border-b border-pneutral-200">
//             <div className="flex items-start gap-1">
//               <span className="text-p4 font-heading font-medium text-pneutral-700">Nutritional Information</span>
//               <span className="text-warning-500 font-heading font-medium text-p4">*</span>
//             </div>
//             <div className="flex justify-end">
//               {attr.nutritionalInformation === "image-upload" && attr.nutritionalInformationImageUrl ? (
//                 <a href={attr.nutritionalInformationImageUrl} target="_blank" rel="noopener noreferrer">
//                   <img
//                     src={attr.nutritionalInformationImageUrl}
//                     alt="Nutritional Information"
//                     className="w-20 h-20 object-cover rounded-md border border-pneutral-200"
//                   />
//                 </a>
//               ) : attr.nutritionalInformation === "as-per-label" ? (
//                 <p className="text-p4 font-body font-normal text-pneutral-800">As per the label</p>
//               ) : (
//                 <p className="text-p4 font-body font-normal text-pneutral-800">—</p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div className="flex-1 flex flex-col">
//           <FieldRow label="Allergen Information" value={attr.allergenInformation} multiline />

//           {/* Veg / Non-Veg Indicator */}
//           <div className="py-3 px-4 border-b border-pneutral-200 flex flex-col gap-2">
//             <div className="flex items-center gap-1">
//               <span className="text-p4 font-heading font-medium text-pneutral-700">Veg / Non-Veg Indicator</span>
//               <span className="text-warning-500 font-heading font-medium text-p4">*</span>
//             </div>
//             <RadioDisplay value={attr.vegNonvegIndicator} />
//           </div>

//           <FieldRow label="Storage Condition" value={storageCondition} multiline />
//           <FieldRow label="Manufacturer Name" value={manufacturerName || attr.manufacturerName} />

//           {/* Uploaded Product Brochure */}
//           <div className="pt-3 pb-2 px-4 border-b border-pneutral-200 flex flex-col gap-2">
//             <div className="flex items-center gap-1">
//               <span className="text-p4 font-heading font-medium text-pneutral-700">Uploaded Product Brochure</span>
//               <span className="text-warning-500 font-heading font-medium text-p4">*</span>
//             </div>
//             {resolvedBrochureUrl ? (
//               <a href={resolvedBrochureUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-sneutral-50 rounded-md no-underline">
//                 <FileText size={24} color="#3C3D3A" />
//                 <span className="text-p4 font-body font-normal text-pneutral-800">
//                   {resolvedBrochureUrl.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
//                 </span>
//               </a>
//             ) : (
//               <div className="flex items-center gap-3 p-3 bg-sneutral-50 rounded-md">
//                 <FileText size={24} color="#3C3D3A" />
//                 <span className="text-p4 font-body font-normal text-pneutral-500">No brochure uploaded</span>
//               </div>
//             )}
//           </div>

//           <FieldRow label="Country of Origin" value={attr.countryName} />

//           {/* Certifications / Compliance */}
//           {certDocs.length > 0 && (
//             <div className="pt-3 pb-2 px-4 border-b border-pneutral-200 flex flex-col gap-2">
//               <div className="flex items-start gap-1">
//                 <span className="text-p4 font-heading font-medium text-pneutral-700">Certifications / Compliance</span>
//                 <span className="text-warning-500 font-heading font-medium text-p4">*</span>
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {certDocs.map((cert) => (
//                   <button
//                     key={cert.certificationId}
//                     type="button"
//                     onClick={() => {
//                       setActiveCertDoc(cert);
//                       setShowCertModal(true);
//                     }}
//                     className="flex items-center gap-2 px-2 py-1 bg-success-50 border-none rounded-md cursor-pointer font-body text-p4 font-medium text-success-900"
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

// <FullWidthBlock label="Warnings & Precautions" value={warningsPrecautions} />
//       <FullWidthBlock label="Product Description" value={productDescription} />
      

//       {/* Certificate Modal */}
//       {showCertModal && activeCertDoc !== null && (
//         <div
//           onClick={() => {
//             setShowCertModal(false);
//             setActiveCertDoc(null);
//           }}
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]"
//           >
//             <div className="flex items-center justify-between px-6 py-4 border-b border-pneutral-200">
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 bg-success-50 rounded-md flex items-center justify-center">
//                   <PiSealCheckLight size={20} color="#378200" />
//                 </div>
//                 <div>
//                   <p className="text-p4 font-heading font-semibold text-pneutral-900 m-0">
//                     {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                   </p>
//                   <p className="text-p2 font-body font-normal text-pneutral-500 m-0">Certification Document</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <a
//                   href={activeCertDoc.certificateUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center gap-1.5 text-success-900 text-p3 font-heading font-semibold no-underline px-3 py-1.5 rounded-md"
//                 >
//                   <ExternalLink size={14} /> Open
//                 </a>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowCertModal(false);
//                     setActiveCertDoc(null);
//                   }}
//                   className="w-8 h-8 rounded-md border-none bg-transparent cursor-pointer text-pneutral-500 text-xl flex items-center justify-center"
//                 >
//                   ×
//                 </button>
//               </div>
//             </div>
//             <div className="flex-1 overflow-auto bg-sneutral-50 p-4 flex items-center justify-center min-h-[400px]">
//               {isImageUrl(activeCertDoc.certificateUrl) ? (
//                 <img
//                   src={activeCertDoc.certificateUrl}
//                   alt={activeCertDoc.certificationName ?? "Certificate"}
//                   className="max-w-full max-h-[600px] object-contain rounded-md"
//                 />
//               ) : (
//                 <div className="flex flex-col items-center gap-4 py-8">
//                   <div className="w-16 h-16 bg-success-50 rounded-lg flex items-center justify-center">
//                     <FileText size={32} color="#378200" />
//                   </div>
//                   <div className="text-center">
//                     <p className="text-p4 font-heading font-semibold text-pneutral-900 m-0 mb-2">
//                       {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                     </p>
//                     <p className="text-p3 font-body font-normal text-pneutral-500 m-0 mb-4">
//                       This file cannot be previewed in the browser.
//                     </p>
//                     <a
//                       href={activeCertDoc.certificateUrl}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="inline-flex items-center gap-2 bg-success-800 text-white text-p3 font-heading font-semibold py-2.5 px-5 rounded-md no-underline"
//                     >
//                       <ExternalLink size={14} /> Open / Download
//                     </a>
//                   </div>
//                 </div>
//               )}
//             </div>
//             {certDocs.length > 1 && (
//               <div className="border-t border-pneutral-200 px-6 py-3 flex items-center gap-2 overflow-x-auto">
//                 <span className="text-p2 font-body font-normal text-pneutral-500 flex-shrink-0">Other certs:</span>
//                 {certDocs
//                   .filter((c) => c.certificationId !== activeCertDoc.certificationId)
//                   .map((cert) => (
//                     <button
//                       key={cert.certificationId}
//                       type="button"
//                       onClick={() => setActiveCertDoc(cert)}
//                       className="flex-shrink-0 flex items-center gap-1.5 text-success-900 bg-success-50 text-p2 font-body font-medium px-3 py-1.5 rounded-full border-none cursor-pointer"
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
//   <div className={`grid grid-cols-2 gap-4 py-3 px-4 border-b border-pneutral-200 ${multiline ? "items-start" : "items-center"}`}>
//     <div className="flex items-start gap-1">
//       <span className="text-p4 font-heading font-medium text-pneutral-700">{label}</span>
//       {required && <span className="text-warning-500 font-heading font-medium text-p4">*</span>}
//     </div>
//     {valueNode ? (
//       <div className="flex justify-end flex-1">{valueNode}</div>
//     ) : (
//       <p className="text-p4 font-body font-normal text-pneutral-800 text-right m-0">{value ?? "—"}</p>
//     )}
//   </div>
// );

// const RadioDisplay = ({ value }: { value?: string | null }) => {
//   if (!value) return <p className="text-p4 font-body font-normal text-pneutral-800 text-right m-0">—</p>;
//   const displayValue = value === "veg" ? "Veg" : "Non-Veg";
//   return (
//     <div className="flex items-center gap-2 justify-start flex-1">
//       <div className="w-[18px] h-[18px] rounded-full border-2 border-primary-800 flex items-center justify-center flex-shrink-0">
//         <div className="w-2.5 h-2.5 rounded-full bg-primary-800" />
//       </div>
//       <span className="text-p4 font-body font-normal text-pneutral-800 text-left">{displayValue}</span>
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
//   <div className="px-4 py-3 border-b border-pneutral-200 flex flex-col gap-3">
//     <div className="flex items-center gap-1">
//       <span className="text-p4 font-heading font-medium text-pneutral-700">{label}</span>
//       {required && <span className="text-warning-500 font-heading font-medium text-p4">*</span>}
//     </div>
//     <p className="text-p4 font-body font-normal text-pneutral-800 whitespace-pre-wrap m-0">{value ?? "—"}</p>
//   </div>
// );

// export { FoodInfantView };
// export default FoodInfantView;
