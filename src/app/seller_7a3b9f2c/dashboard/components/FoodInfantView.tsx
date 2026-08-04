"use client";

import React, { useState, useEffect } from "react";
import { FileText, ExternalLink, Gift, Tag, Handbag, BadgePercent } from "lucide-react";
import { PiSealCheckLight } from "react-icons/pi";
import Image from "next/image";
import { downloadProductImage } from "@/src/utils/downloadImage";
import {
  getProductCategories,
  getProductSubcategories,
  getAgeGroups,
  getProductForms,
  getCountries,
  getStorageConditionsByCategory,
  getNetQuantityUnits,
} from "@/src/services/product/FoodInfantService";
import { useConfirmClose } from "@/src/hooks/useConfirmClose";
import ConfirmCloseDialog from "@/src/components/common/ConfirmCloseDialog";

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
  additionalDiscounts?: any[];
  specialSchemes?: any[];
}

/* ─────────────────────────────────────────────────────────
   HELPER FUNCTIONS
───────────────────────────────────────────────────────── */

const isValidUrl = (url?: string | null) => {
  if (!url) return false;
  const t = url.trim().toUpperCase();
  
  // Reject blob URLs
  if (url.startsWith('blob:')) return false;
  
  // Check if it's a valid HTTP URL
  if (t.startsWith('HTTP://') || t.startsWith('HTTPS://')) {
    return true;
  }
  return !["", "PENDING", "NOT_UPLOADED"].includes(t);
};

const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

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
  additionalDiscounts = [],
  specialSchemes = [],
}: FoodInfantViewProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertDoc, setActiveCertDoc] = useState<CertificateDocument | null>(null);
  const [resolvedAttr, setResolvedAttr] = useState<FoodInfantAttributes | null>(null);
  const [loading, setLoading] = useState(true);
  const [ageGroupLabels, setAgeGroupLabels] = useState<Map<number, string>>(new Map());
  const [unitLabels, setUnitLabels] = useState<Map<number, string>>(new Map());
  const closeCertModal = () => {
    setShowCertModal(false);
    setActiveCertDoc(null);
  };
  const {
    isConfirmOpen: isCertCloseConfirmOpen,
    requestClose: requestCertModalClose,
    confirmClose: confirmCertModalClose,
    cancelClose: cancelCertModalClose,
  } = useConfirmClose(closeCertModal);

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
          getStorageConditionsByCategory(3),
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
          console.log("✅ ResolvedAttr updated:", {
        nutritionalInformation: foodAttr.nutritionalInformation,
        nutritionalInformationImageUrl: foodAttr.nutritionalInformationImageUrl,
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
  const imagesToShow = displayImages;
  const resolvedBrochureUrl = isValidUrl(brochureUrl)
    ? brochureUrl
    : isValidUrl(attr.productUserManual)
    ? attr.productUserManual
    : null;

  // Check if brochure exists
  const hasBrochure = resolvedBrochureUrl !== null;

  // Format Age Group Display
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

  // Format Net Quantity
  let netQuantityDisplay = "—";
  if (attr.netQuantity) {
    let unit = attr.unitName || "";
    if (!unit && attr.unitId) {
      unit = getUnitNameFromId(attr.unitId);
    }
    netQuantityDisplay = unit ? `${attr.netQuantity} ${unit}` : String(attr.netQuantity);
  }

  console.log('Certificate URL:', activeCertDoc?.certificateUrl);
console.log('Is Image:', isImageUrl(activeCertDoc?.certificateUrl || ''));



  return (
    <div className="bg-base-white min-h-screen font-heading w-full flex flex-col gap-4">
      {/* Section header */}
      <div className="pt-2 pb-2 border-b border-pneutral-200">
        <h2 className="text-h4 font-heading font-medium text-pneutral-900 m-0">
          Product Details
        </h2>
      </div>

      {/* Product Images - 5 images grid*/}
      <div className="flex flex-col gap-4 p-3 bg-[#F8F5FF] rounded-xl border border-pneutral-200 w-full">
        <p className="font-heading font-semibold text-[18px] leading-[24px] text-[#1E1E1D]">
          Product Images
        </p>
       <div className="flex justify-center flex-wrap gap-3">
  {imagesToShow.slice(0, 5).map((img, idx) => (
    <div
      key={idx}
      onClick={() => setSelectedImageIndex(idx)}
      className={`relative h-[274px] w-full max-w-[calc(20%-12px)] overflow-hidden rounded-xl cursor-pointer shadow-sm ${idx === selectedImageIndex ? "outline outline-2 outline-primary-500 -outline-offset-1" : ""}`}
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
        <div className="absolute left-[10px] top-[10px] px-2 py-1 bg-secondary-500 rounded-[4px]">
          <span className="text-white text-xs font-body font-semibold leading-[18px]">Primary</span>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          downloadProductImage(img, `product-image-${idx + 1}.jpg`);
        }}
        aria-label="Download image"
        className="absolute right-2.5 bottom-2.5 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E1E1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </button>
    </div>
  ))}
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
                {(() => {
      return null;
    })()}
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
          {hasBrochure && (
            <div className="pt-3 pb-2 px-4 border-b border-pneutral-200 flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="text-p4 font-heading font-medium text-pneutral-700">Uploaded Product Brochure</span>
              </div>
              <a href={resolvedBrochureUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-sneutral-50 rounded-md no-underline">
                <FileText size={24} color="#3C3D3A" />
                <span className="text-p4 font-body font-normal text-pneutral-800">
                  {resolvedBrochureUrl!.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
                </span>
              </a>
            </div>
          )}

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


{/* SPECIAL OFFERS & PROMOTIONAL SCHEMES */}
{specialSchemes.length > 0 && (
  <div className="flex flex-col gap-4 pt-4 border-t border-pneutral-200 mt-2">
    <h4 className="text-[24px] font-heading font-medium leading-[32px] text-pneutral-900">
      Special Offers & Promotional Schemes
    </h4>
    <div className={`grid gap-4 ${specialSchemes.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {specialSchemes.map((scheme, index) => {
        // Define themes based on index (0-based)
        const themes = [
          { 
            bg: "bg-success-50", 
            border: "border-success-700", 
            text: "text-success-700", 
            iconBg: "bg-success-700",
            Icon: Gift 
          },
          { 
            bg: "bg-primary-100", 
            border: "border-primary-800", 
            text: "text-primary-800", 
            iconBg: "bg-primary-800",
            Icon: BadgePercent 
          },
          { 
            bg: "bg-danger-50",  
            border: "border-danger-500", 
            text: "text-danger-600", 
            iconBg: "bg-danger-600",
            Icon: Handbag 
          },
          { 
            bg: "bg-info-50", 
            border: "border-info-500", 
            text: "text-info-500", 
            iconBg: "bg-info-500",
            Icon: Tag 
          },
        ];
        
        const theme = themes[index % 4];

        const dateStr = scheme.effectiveStartDate && scheme.effectiveEndDate
          ? `Valid: ${new Date(scheme.effectiveStartDate).toLocaleDateString("en-GB")} - ${new Date(scheme.effectiveEndDate).toLocaleDateString("en-GB")}`
          : "Valid: Ongoing";

        return (
          <div 
            key={index} 
            className={`flex flex-row items-start gap-4 border-2 rounded-xl p-[22px] h-[142px] ${theme.bg} ${theme.border}`}
          >
            {/* Icon Box - background matches scheme name color */}
            <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md ${theme.iconBg}`}>
              <theme.Icon className="w-6 h-6 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex flex-col">
              <h5 className={`font-heading font-medium text-[20px] leading-[28px] mb-1.5 ${theme.text}`}>
                {scheme.schemeName || "Special Scheme"}
              </h5>
              <p className="font-body font-medium text-[14px] leading-[20px] text-pneutral-900 line-clamp-2">
                Purchase {scheme.buyQuantity} {productName || "this product"} and get {scheme.freeQuantity} absolutely free. Limited stock available!
              </p>
              <span className="font-body text-[12px] leading-[18px] text-pneutral-500 mt-1">
                {dateStr}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

      {/* Certificate Modal - FIXED to show images correctly */}
      {showCertModal && activeCertDoc !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
          onClick={requestCertModalClose}
        >
          <ConfirmCloseDialog
            isOpen={isCertCloseConfirmOpen}
            onConfirm={confirmCertModalClose}
            onCancel={cancelCertModalClose}
          />
          <div
            className="bg-base-white rounded-2xl shadow-2xl w-full max-w-[672px] mx-4 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-pneutral-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-success-50 rounded-lg flex items-center justify-center">
                  <PiSealCheckLight size={20} color="var(--success-900)" />
                </div>
                <div>
                  <p className="text-pneutral-900 text-base font-heading font-semibold leading-[22px]">
                    {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
                  </p>
                  <p className="text-pneutral-500 text-xs font-body font-normal leading-[18px]">Certification Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeCertDoc.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-[6px] text-success-900 text-sm font-heading font-semibold leading-5 no-underline px-3 py-[6px] rounded-lg"
                >
                  <ExternalLink size={14} /> Open
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setShowCertModal(false);
                    setActiveCertDoc(null);
                  }}
                  className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer text-pneutral-500 text-xl flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body - FIXED: Now properly checks for both image and PDF */}
            <div className="flex-1 overflow-y-auto bg-pneutral-50 p-4 flex items-center justify-center min-h-[400px]">
              {isImageUrl(activeCertDoc.certificateUrl) ? (
                <img
                  src={activeCertDoc.certificateUrl}
                  alt={activeCertDoc.certificationName ?? "Certificate"}
                  className="max-w-full max-h-[600px] object-contain rounded-lg"
                />
              ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
                <iframe
                  src={activeCertDoc.certificateUrl}
                  title="Certificate PDF"
                  className="w-full border-none rounded-lg h-[560px]"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 bg-success-50 rounded-2xl flex items-center justify-center">
                    <FileText size={32} color="var(--success-900)" />
                  </div>
                  <div className="text-center">
                    <p className="text-pneutral-900 text-base font-heading font-semibold leading-[22px] mb-2">
                      {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
                    </p>
                    <p className="text-pneutral-500 text-sm font-body font-normal leading-5 mb-4">
                      This file cannot be previewed in the browser.
                    </p>
                    <a
                      href={activeCertDoc.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-success-700 text-white text-sm font-heading font-semibold leading-5 px-5 py-[10px] rounded-lg no-underline"
                    >
                      <ExternalLink size={14} /> Open / Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Other certificates */}
            {certDocs.length > 1 && (
              <div className="border-t border-pneutral-200 px-6 py-3 flex items-center gap-2 overflow-x-auto">
                <span className="text-pneutral-500 text-xs font-body font-normal leading-[18px] shrink-0">Other certs:</span>
                {certDocs
                  .filter((c) => c.certificationId !== activeCertDoc.certificationId)
                  .map((cert) => (
                    <button
                      key={cert.certificationId}
                      type="button"
                      onClick={() => setActiveCertDoc(cert)}
                      className="shrink-0 flex items-center gap-[6px] text-success-900 bg-success-50 text-xs font-body font-medium leading-[18px] px-3 py-[6px] rounded-full border-none cursor-pointer"
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













// code dated 10.06.2026.............

// "use client";

// import React, { useState, useEffect } from "react";
// import { FileText, ExternalLink, Gift, BadgePercent, ShoppingBag, Tag } from "lucide-react";
// import { PiSealCheckLight } from "react-icons/pi";
// import Image from "next/image";
// import {
//   getProductCategories,
//   getProductSubcategories,
//   getAgeGroups,
//   getProductForms,
//   getCountries,
//   getStorageConditionsByCategory,
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
//   additionalDiscounts?: any[];
//   specialSchemes?: any[];
// }

// /* ─────────────────────────────────────────────────────────
//    HELPER FUNCTIONS
// ───────────────────────────────────────────────────────── */

// const isValidUrl = (url?: string | null) => {
//   if (!url) return false;
//   const t = url.trim().toUpperCase();
  
//   // Reject blob URLs
//   if (url.startsWith('blob:')) return false;
  
//   // Check if it's a valid HTTP URL
//   if (t.startsWith('HTTP://') || t.startsWith('HTTPS://')) {
//     return true;
//   }
//   return !["", "PENDING", "NOT_UPLOADED"].includes(t);
// };

// const isImageUrl = (url: string) =>
//   /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

// const isPdfUrl = (url: string) => /\.pdf(\?.*)?$/i.test(url);

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
//   additionalDiscounts = [],
//   specialSchemes = [],
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

//   // Helper to get unit name from unitId
//   const getUnitNameFromId = (unitId: number | undefined): string => {
//     if (!unitId) return "";
//     return unitLabels.get(unitId) || "";
//   };

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
//           getStorageConditionsByCategory(3),
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

//         // Preserve all original foodAttr data while adding resolved names
//         setResolvedAttr({
//           ...foodAttr,
//           productCategoryName: findName(categories, foodAttr.productCategoryId, "productCategoryId", "productCategory"),
//           productSubcategoryName: findName(subcategories, foodAttr.productSubcategoryId, "productSubcategoryId", "productSubcategory"),
//           productFormName: findName(productForms, foodAttr.productFormId, "productFormId", "productForm"),
//           countryName: findName(countries, foodAttr.countryId, "countryId", "countryName"),
//           storageConditionName: findName(storageConditions, foodAttr.storageConditionId, "storageConditionId", "conditionName"),
          
//         });
//           console.log("✅ ResolvedAttr updated:", {
//         nutritionalInformation: foodAttr.nutritionalInformation,
//         nutritionalInformationImageUrl: foodAttr.nutritionalInformationImageUrl,
//       });
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
//   const imagesToShow = displayImages;
//   const resolvedBrochureUrl = isValidUrl(brochureUrl)
//     ? brochureUrl
//     : isValidUrl(attr.productUserManual)
//     ? attr.productUserManual
//     : null;

//   // Check if brochure exists
//   const hasBrochure = resolvedBrochureUrl !== null;

//   // Format Age Group Display
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

//   // Format Net Quantity
//   let netQuantityDisplay = "—";
//   if (attr.netQuantity) {
//     let unit = attr.unitName || "";
//     if (!unit && attr.unitId) {
//       unit = getUnitNameFromId(attr.unitId);
//     }
//     netQuantityDisplay = unit ? `${attr.netQuantity} ${unit}` : String(attr.netQuantity);
//   }

//   console.log('Certificate URL:', activeCertDoc?.certificateUrl);
// console.log('Is Image:', isImageUrl(activeCertDoc?.certificateUrl || ''));



//   return (
//     <div className="bg-base-white min-h-screen font-heading w-full flex flex-col gap-4">
//       {/* Section header */}
//       <div className="pt-2 pb-2 border-b border-pneutral-200">
//         <h2 className="text-h4 font-heading font-medium text-pneutral-900 m-0">
//           Product Details
//         </h2>
//       </div>

//       {/* Product Images - 5 images grid like Supplement */}
//       <div className="flex flex-col gap-4 p-3 bg-[#F8F5FF] rounded-xl border border-pneutral-200 w-full">
//         <p className="font-heading font-semibold text-[18px] leading-[24px] text-[#1E1E1D]">
//           Product Images
//         </p>
//         <div className="grid grid-cols-5 gap-3">
//           {imagesToShow.slice(0, 5).map((img, idx) => (
//             <div
//               key={idx}
//               onClick={() => setSelectedImageIndex(idx)}
//               className={`relative h-[274px] w-full overflow-hidden rounded-xl cursor-pointer shadow-sm ${idx === selectedImageIndex ? "outline outline-2 outline-primary-500 -outline-offset-1" : ""}`}
//             >
//               <Image
//                 src={img}
//                 alt={`Product image ${idx + 1}`}
//                 fill
//                 className="object-cover"
//                 unoptimized={img.startsWith("http")}
//                 onError={(e) => {
//                   (e.target as HTMLImageElement).src = placeholderImage;
//                 }}
//               />
//               {idx === 0 && (
//                 <div className="absolute left-[10px] top-[10px] px-2 py-1 bg-secondary-500 rounded-[4px]">
//                   <span className="text-white text-xs font-body font-semibold leading-[18px]">Primary</span>
//                 </div>
//               )}
//             </div>
//           ))}
//           {Array.from({ length: Math.max(0, 5 - imagesToShow.length) }).map((_, i) => (
//             <div key={`empty-${i}`} className="h-[274px] w-full rounded-xl bg-pneutral-50 shadow-sm" />
//           ))}
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
//                 {(() => {
//       return null;
//     })()}
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
//           {hasBrochure && (
//             <div className="pt-3 pb-2 px-4 border-b border-pneutral-200 flex flex-col gap-2">
//               <div className="flex items-center gap-1">
//                 <span className="text-p4 font-heading font-medium text-pneutral-700">Uploaded Product Brochure</span>
//               </div>
//               <a href={resolvedBrochureUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-sneutral-50 rounded-md no-underline">
//                 <FileText size={24} color="#3C3D3A" />
//                 <span className="text-p4 font-body font-normal text-pneutral-800">
//                   {resolvedBrochureUrl!.split("/").pop()?.split("?")[0] || "product-brochure.pdf"}
//                 </span>
//               </a>
//             </div>
//           )}

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

//       {/* SPECIAL OFFERS & PROMOTIONAL SCHEMES */}
//       {(additionalDiscounts.length > 0 || specialSchemes.length > 0) && (
//         <div className="flex flex-col gap-4 pt-4 border-t border-pneutral-200 mt-2">
//           <h4 className="text-[24px] font-heading font-medium leading-[32px] text-pneutral-900">
//             Special Offers & Promotional Schemes
//           </h4>
//           <div className="grid grid-cols-2 gap-4">
//             {/* Special Schemes */}
//             {specialSchemes.map((scheme, index) => {
//               const themes = [
//                 { border: "#4EB300", bg: "#DCF7CB", text: "#47A400", Icon: Gift },
//                 { border: "#FFB020", bg: "#FFF8E7", text: "#D99100", Icon: ShoppingBag },
//                 { border: "#2563EB", bg: "#EFF6FF", text: "#2563EB", Icon: Tag },
//               ];
//               let theme = themes[index % themes.length];
//               const type = scheme.schemeType?.toLowerCase();
//               if (type === "bogo" || type === "buy_x_get_y") theme = themes[0];
//               else if (type === "bundle") theme = themes[1];
//               else if (type === "seasonal") theme = themes[2];

//               const dateStr = scheme.effectiveStartDate && scheme.effectiveEndDate
//                 ? `Valid: ${new Date(scheme.effectiveStartDate).toLocaleDateString("en-GB")} - ${new Date(scheme.effectiveEndDate).toLocaleDateString("en-GB")}`
//                 : "Valid: Ongoing";

//               return (
//                 <div key={index} className="flex flex-row items-start gap-4 border-2 rounded-xl p-[22px] h-[142px]" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
//                   <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md" style={{ backgroundColor: theme.border }}>
//                     <theme.Icon className="w-6 h-6 text-white" />
//                   </div>
//                   <div className="flex flex-col">
//                     <h5 className="font-heading font-medium text-[20px] leading-[28px] mb-1.5" style={{ color: theme.text }}>
//                       {scheme.schemeName || "Special Scheme"}
//                     </h5>
//                     <p className="font-body font-medium text-[14px] leading-[20px] text-pneutral-900 line-clamp-2">
//                       Purchase {scheme.buyQuantity} {productName || "this product"} and get {scheme.freeQuantity} absolutely free. Limited stock available!
//                     </p>
//                     <span className="font-body text-[12px] leading-[18px] text-pneutral-500 mt-1">
//                       {dateStr}
//                     </span>
//                   </div>
//                 </div>
//               );
//             })}

//             {/* Additional Discount */}
//             {additionalDiscounts.length > 0 && (
//               <div className="flex flex-row items-start gap-4 border-2 rounded-xl p-[22px] bg-[#F8EDFF] border-[#6C12A9] h-[142px]">
//                 <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md bg-[#6C12A9]">
//                   <BadgePercent className="w-6 h-6 text-white" />
//                 </div>
//                 <div className="flex flex-col">
//                   <h5 className="font-heading font-medium text-[20px] leading-[28px] text-[#6C12A9] mb-1.5">
//                     Bulk Purchase Discount
//                   </h5>
//                   <p className="font-body font-medium text-[14px] leading-[20px] text-pneutral-900 line-clamp-2">
//                     {additionalDiscounts.map((discount, index) => (
//                       <span key={index}>
//                         Get {discount.additionalDiscountPercentage}% off on orders of {discount.minimumPurchaseQuantity}+ units
//                         {index < additionalDiscounts.length - 1 ? ", " : "."}
//                       </span>
//                     ))}
//                   </p>
//                   <span className="font-body text-[12px] leading-[18px] text-pneutral-500 mt-1">
//                     Valid: Ongoing
//                   </span>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Certificate Modal - FIXED to show images correctly */}
//       {showCertModal && activeCertDoc !== null && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
//           onClick={() => {
//             setShowCertModal(false);
//             setActiveCertDoc(null);
//           }}
//         >
//           <div
//             className="bg-base-white rounded-2xl shadow-2xl w-full max-w-[672px] mx-4 overflow-hidden flex flex-col max-h-[90vh]"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Modal Header */}
//             <div className="flex items-center justify-between px-6 py-4 border-b border-pneutral-200">
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 bg-success-50 rounded-lg flex items-center justify-center">
//                   <PiSealCheckLight size={20} color="var(--success-900)" />
//                 </div>
//                 <div>
//                   <p className="text-pneutral-900 text-base font-heading font-semibold leading-[22px]">
//                     {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                   </p>
//                   <p className="text-pneutral-500 text-xs font-body font-normal leading-[18px]">Certification Document</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <a
//                   href={activeCertDoc.certificateUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center gap-[6px] text-success-900 text-sm font-heading font-semibold leading-5 no-underline px-3 py-[6px] rounded-lg"
//                 >
//                   <ExternalLink size={14} /> Open
//                 </a>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowCertModal(false);
//                     setActiveCertDoc(null);
//                   }}
//                   className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer text-pneutral-500 text-xl flex items-center justify-center"
//                 >
//                   ×
//                 </button>
//               </div>
//             </div>

//             {/* Modal Body - FIXED: Now properly checks for both image and PDF */}
//             <div className="flex-1 overflow-y-auto bg-pneutral-50 p-4 flex items-center justify-center min-h-[400px]">
//               {isImageUrl(activeCertDoc.certificateUrl) ? (
//                 <img
//                   src={activeCertDoc.certificateUrl}
//                   alt={activeCertDoc.certificationName ?? "Certificate"}
//                   className="max-w-full max-h-[600px] object-contain rounded-lg"
//                 />
//               ) : isPdfUrl(activeCertDoc.certificateUrl) ? (
//                 <iframe
//                   src={activeCertDoc.certificateUrl}
//                   title="Certificate PDF"
//                   className="w-full border-none rounded-lg h-[560px]"
//                 />
//               ) : (
//                 <div className="flex flex-col items-center gap-4 py-8">
//                   <div className="w-16 h-16 bg-success-50 rounded-2xl flex items-center justify-center">
//                     <FileText size={32} color="var(--success-900)" />
//                   </div>
//                   <div className="text-center">
//                     <p className="text-pneutral-900 text-base font-heading font-semibold leading-[22px] mb-2">
//                       {activeCertDoc.certificationName ?? activeCertDoc.label ?? `Certificate ${activeCertDoc.certificationId}`}
//                     </p>
//                     <p className="text-pneutral-500 text-sm font-body font-normal leading-5 mb-4">
//                       This file cannot be previewed in the browser.
//                     </p>
//                     <a
//                       href={activeCertDoc.certificateUrl}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="inline-flex items-center gap-2 bg-success-700 text-white text-sm font-heading font-semibold leading-5 px-5 py-[10px] rounded-lg no-underline"
//                     >
//                       <ExternalLink size={14} /> Open / Download
//                     </a>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Modal Footer - Other certificates */}
//             {certDocs.length > 1 && (
//               <div className="border-t border-pneutral-200 px-6 py-3 flex items-center gap-2 overflow-x-auto">
//                 <span className="text-pneutral-500 text-xs font-body font-normal leading-[18px] shrink-0">Other certs:</span>
//                 {certDocs
//                   .filter((c) => c.certificationId !== activeCertDoc.certificationId)
//                   .map((cert) => (
//                     <button
//                       key={cert.certificationId}
//                       type="button"
//                       onClick={() => setActiveCertDoc(cert)}
//                       className="shrink-0 flex items-center gap-[6px] text-success-900 bg-success-50 text-xs font-body font-medium leading-[18px] px-3 py-[6px] rounded-full border-none cursor-pointer"
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