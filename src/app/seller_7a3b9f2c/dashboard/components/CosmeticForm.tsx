"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Select, { StylesConfig, Theme } from "react-select";
import Input from "@/src/app/commonComponents/Input";
import UploadInput from "../commonComponent/UploadInput";
import AdditionalDiscount from "./AdditionalDiscount";
import PopupModal from "../commonComponent/PopupModal";
import CommonModal from "../commonComponent/CommonModal";
import { X, RefreshCw, AlertCircle, FileText } from "lucide-react";
import { getProductById, uploadProductImages, updateProduct } from "@/src/services/product/ProductService";
import {
  getCosmeticProductTypes,
  getCosmeticProductSubTypes,
  getCosmeticSkinTypes,
  getCosmeticHairTypes,
  getCosmeticAgeGroups,
  getCosmeticIntendedUseAreas,
  getCosmeticStorageConditions,
  getCosmeticCountries,
  getCosmeticCertifications,
  getCosmeticPackTypes,
  createCosmeticProduct,
  uploadCosmeticCertificate,
  uploadCosmeticBrochure,
} from "@/src/services/product/CosmeticService";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string; }

interface CertificationTag {
  id: string;
  label: string;
  tagCode: string;
  file: File | null;
  fileName: string;
  uploading: boolean;
  isUploaded: boolean;
  previewUrl: string | null;
  productCertificateDocumentId: number;
  existingUrl?: string;
}

interface AdditionalDiscountSlab {
  minimumPurchaseQuantity: number;
  additionalDiscountPercentage: number;
  effectiveStartDate: string;
  effectiveStartTime: string;
  effectiveEndDate: string;
  effectiveEndTime: string;
}

interface CosmeticFormProps {
  productId?: string;
  mode?: "create" | "edit";
  onSubmitSuccess?: () => void;
}

interface CertificationMasterOption {
  value: string;
  label: string;
  certificationId: number;
  tagCode: string;
}

interface MasterItem { [key: string]: unknown; }
interface ApiResponseData { [key: string]: unknown; }

type SelectStyles = StylesConfig<SelectOption, false>;

// ─── Skin/Hair type visibility rules per Product Type ─────────────────────────
// Maps productTypeId (string) → { skinType: "mandatory"|"optional"|"hidden", hairType: "mandatory"|"optional"|"hidden" }
// This must be populated from the product-type master response labels.
// We handle it dynamically from the label returned by the API, falling back to a label-based lookup.

type FieldBehaviour = "mandatory" | "optional" | "hidden";

interface SkinHairRule {
  skinType: FieldBehaviour;
  hairType: FieldBehaviour;
}

// Label-based fallback mapping (matches spec table)
const SKIN_HAIR_RULES_BY_LABEL: Record<string, SkinHairRule> = {
  "Hair Care":                  { skinType: "hidden",    hairType: "mandatory" },
  "Skin Care (Face)":           { skinType: "mandatory", hairType: "hidden"    },
  "Body Care":                  { skinType: "mandatory", hairType: "hidden"    },
  "Lip Care":                   { skinType: "mandatory", hairType: "hidden"    },
  "Eye Care":                   { skinType: "mandatory", hairType: "hidden"    },
  "Personal Hygiene":           { skinType: "optional",  hairType: "hidden"    },
  "Fragrance":                  { skinType: "hidden",    hairType: "hidden"    },
  "Makeup / Color Cosmetics":   { skinType: "optional",  hairType: "hidden"    },
  "Makeup / Colour Cosmetics":  { skinType: "optional",  hairType: "hidden"    },
  "Men's Grooming":             { skinType: "optional",  hairType: "optional"  },
};

function getSkinHairRule(productTypeLabel: string): SkinHairRule {
  return SKIN_HAIR_RULES_BY_LABEL[productTypeLabel] ?? { skinType: "optional", hairType: "optional" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isFutureDate(date: Date | null): boolean {
  if (!date) return false;
  const todayStr = new Date().toLocaleDateString("en-CA");
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return dateStr > todayStr;
}

function validateHSNCode(hsnCode: string): string | null {
  const trimmed = hsnCode.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return "HSN code must contain numeric digits only";
  if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(trimmed)) return "HSN code must be 4, 6, or 8 digits";
  return null;
}

function computeShelfLife(mfgDate: Date | null, expDate: Date | null): string {
  if (!mfgDate || !expDate) return "";
  const diffMs = expDate.getTime() - mfgDate.getTime();
  if (diffMs <= 0) return "";
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remDays = days % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Year${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} Month${months > 1 ? "s" : ""}`);
  if (remDays > 0 && years === 0) parts.push(`${remDays} Day${remDays > 1 ? "s" : ""}`);
  return parts.join(" ");
}

function deepFind(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) { const r = deepFind(item, key); if (r !== undefined) return r; }
    return undefined;
  }
  const rec = obj as Record<string, unknown>;
  if (key in rec && rec[key] != null) return rec[key];
  for (const k of Object.keys(rec)) { const r = deepFind(rec[k], key); if (r !== undefined) return r; }
  return undefined;
}

function extractCertDocumentIdMap(data: ApiResponseData): Map<number, number> {
  const map = new Map<number, number>();
  try {
    const dataInner = (data?.data ?? data) as ApiResponseData;
    const attrs = dataInner?.productAttributeCosmetics;
    if (!Array.isArray(attrs) || attrs.length === 0) return map;
    const certDocs = (attrs[0] as ApiResponseData)?.certificateDocuments;
    if (!Array.isArray(certDocs)) return map;
    for (const doc of certDocs) {
      const d = doc as ApiResponseData;
      const certId = Number(d.certificationId);
      const docId = Number(d.productCertificateDocumentId);
      if (!isNaN(certId) && !isNaN(docId) && docId > 0) map.set(certId, docId);
    }
  } catch { /* ignore */ }
  return map;
}

function extractProductAttributeId(data: ApiResponseData): string | undefined {
  const dataInner = data?.data as ApiResponseData | undefined;
  const s1 = dataInner?.productAttributeCosmetics;
  if (Array.isArray(s1) && s1.length > 0) { const id = (s1[0] as ApiResponseData)?.productAttributeId; if (id != null) return String(id); }
  const s2 = data?.productAttributeCosmetics;
  if (Array.isArray(s2) && s2.length > 0) { const id = (s2[0] as ApiResponseData)?.productAttributeId; if (id != null) return String(id); }
  const s3 = dataInner?.productAttributeId; if (s3 != null) return String(s3);
  const s4 = data?.productAttributeId; if (s4 != null) return String(s4);
  const deep = deepFind(data, "productAttributeId"); if (deep !== undefined) return String(deep);
  return undefined;
}

function getMasterStr(item: MasterItem, ...keys: string[]): string {
  for (const key of keys) { const v = item[key]; if (v != null) return String(v); }
  return "";
}

// ─── Style constants ──────────────────────────────────────────────────────────

const fieldLabel = "block mb-1.5 font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]";
const requiredStar = <span className="text-red-500 ml-0.5">*</span>;
const errorMsg = "text-red-500 text-xs mt-1";
const sectionCard = "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm";
const sectionTitle = "mb-4 pb-3 border-b border-gray-100 text-[28px] [font-family:'Open_Sans',sans-serif] font-semibold leading-8 [color:#1E1E1D]";
const subSectionTitle = "mb-3 mt-5 pb-2 border-b border-gray-100 text-[21px] [font-family:'Open_Sans',sans-serif] font-normal leading-6 [color:#1E1E1D]";
const inputDisabled = "w-full h-12 px-4 border border-gray-200 rounded-xl text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] bg-gray-50 cursor-default flex items-center";

const UploadCloudIcon = () => (
  <img src="/icons/upload-cloud.svg" alt="upload" className="w-5 h-5 object-contain" />
);

const NonEditableField = ({ label, value, required }: { label: string; value: string; required?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className={fieldLabel}>{label} {required && requiredStar}</label>
    <div className={inputDisabled} style={{ color: "#5A5B58" }}>{value}</div>
  </div>
);

const NonEditableSelect = ({ label, value, required }: { label: string; value: string; required?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className={fieldLabel}>{label} {required && requiredStar}</label>
    <div className={inputDisabled} style={{ color: "#5A5B58" }}>{value}</div>
  </div>
);

// ─── Multi-checkbox dropdown (reusable inside form) ───────────────────────────

interface MultiCheckDropdownProps {
  label: string;
  required?: boolean;
  options: SelectOption[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  errorKey?: string;
  errors?: Record<string, string>;
  loading?: boolean;
  disabled?: boolean;
  fieldRef?: React.Ref<HTMLDivElement>;
  dataField?: string;
}

const MultiCheckDropdown = ({
  label,
  required,
  options,
  selected,
  onChange,
  placeholder = "Select...",
  errorKey = "",
  errors = {},
  loading,
  disabled,
  fieldRef,
  dataField,
}: MultiCheckDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  const displayLabel = selected.length > 0
    ? selected.map((v) => options.find((o) => o.value === v)?.label).filter(Boolean).join(", ")
    : placeholder;

  return (
    <div className="flex flex-col gap-1" ref={fieldRef as React.RefObject<HTMLDivElement>} data-field={dataField}>
      <label className={fieldLabel}>{label} {required && requiredStar}</label>
      <div className="relative" ref={ref}>
        <div
          onClick={() => !disabled && setOpen((p) => !p)}
          className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between transition-all bg-white ${
            disabled ? "cursor-default bg-gray-50" : "cursor-pointer"
          } ${
            errors[errorKey]
              ? "border-red-400"
              : open
              ? "border-purple-600 ring-2 ring-purple-200"
              : "border-gray-300 hover:border-purple-600"
          }`}
        >
          <span
            className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]"
            style={{ color: selected.length > 0 ? "#3C3D3A" : "#969793" }}
          >
            {displayLabel}
          </span>
          <svg
            className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {open && (
          <div className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
            ) : options.length === 0 ? (
              <div className="px-4 py-3 text-gray-400 text-sm">No options available</div>
            ) : (
              options.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="accent-purple-600 w-4 h-4"
                  />
                  <span className="text-base [font-family:'Open_Sans',sans-serif] [color:#3C3D3A]">{opt.label}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
      {errors[errorKey] && <p className={errorMsg}>{errors[errorKey]}</p>}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const CosmeticForm = ({ productId, mode = "create", onSubmitSuccess }: CosmeticFormProps) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef = (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  // Category ID for cosmetics
  const productCategoryId = 6;

  const [form, setForm] = useState({
    productName: "",
    productTypeId: "",
    productSubTypeId: "",
    brandName: "",
    variantName: "",
    gender: "",
    activeIngredients: "",
    netQuantity: "",
    ageGroupId: "",
    productClaims: "",
    warningsPrecautions: "",
    productDescription: "",
    storageConditionId: "",
    manufacturerName: "",
    countryOfOriginId: "",
    packTypeId: "",
    unitsPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    batchNumber: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    stockQuantity: "",
    dateOfStockEntry: new Date(),
    sellingPrice: "",
    mrp: "",
    discountPercentage: "",
    finalPrice: "",
    gstPercentage: "",
    hsnCode: "",
  });

  const [shelfLifeDisplay, setShelfLifeDisplay] = useState("");
  const [resolvedProductId, setResolvedProductId] = useState("");
  const [productAttributeId, setProductAttributeId] = useState("");
  const [packagingId, setPackagingId] = useState("");
  const [pricingId, setPricingId] = useState("");

  // Multi-select fields
  const [selectedIntendedUseAreas, setSelectedIntendedUseAreas] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedHairTypes, setSelectedHairTypes] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

  // Master options
  const [productTypeOptions, setProductTypeOptions] = useState<SelectOption[]>([]);
  const [productSubTypeOptions, setProductSubTypeOptions] = useState<SelectOption[]>([]);
  const [skinTypeOptions, setSkinTypeOptions] = useState<SelectOption[]>([]);
  const [hairTypeOptions, setHairTypeOptions] = useState<SelectOption[]>([]);
  const [ageGroupOptions, setAgeGroupOptions] = useState<SelectOption[]>([]);
  const [intendedUseAreaOptions, setIntendedUseAreaOptions] = useState<SelectOption[]>([]);
  const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<CertificationMasterOption[]>([]);
  const [packTypeOptions, setPackTypeOptions] = useState<SelectOption[]>([]);

  // Label maps for edit mode display
  const [displayLabels, setDisplayLabels] = useState({
    productTypeLabel: "",
    productSubTypeLabel: "",
    ageGroupLabel: "",
    storageConditionLabel: "",
    countryLabel: "",
    packTypeLabel: "",
    gstLabel: "",
    genderLabel: "",
  });

  // Skin/Hair type visibility rule derived from selected product type label
  const [skinHairRule, setSkinHairRule] = useState<SkinHairRule>({ skinType: "optional", hairType: "optional" });

  // Loading / UI state
  const [loadingProductTypes, setLoadingProductTypes] = useState(false);
  const [loadingSubTypes, setLoadingSubTypes] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string>("");
  const [showCertDropdown, setShowCertDropdown] = useState(false);

  const [showAdditionalDiscountModal, setShowAdditionalDiscountModal] = useState(false);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const certDropdownRef = useRef<HTMLDivElement>(null);

  const genderOptions: SelectOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "unisex", label: "Unisex" },
  ];

  const gstOptions: SelectOption[] = [
    { value: "0", label: "0%" },
    { value: "5", label: "5%" },
    { value: "12", label: "12%" },
    { value: "18", label: "18%" },
    { value: "28", label: "28%" },
  ];

  const convertToDiscountSlab = (data: AdditionalDiscountData[]): AdditionalDiscountSlab[] =>
    data.map((item) => ({
      minimumPurchaseQuantity: item.minimumPurchaseQuantity,
      additionalDiscountPercentage: item.additionalDiscountPercentage,
      effectiveStartDate: item.effectiveStartDate || "",
      effectiveStartTime: item.effectiveStartTime || "",
      effectiveEndDate: item.effectiveEndDate || "",
      effectiveEndTime: item.effectiveEndTime || "",
    }));

  const convertToDiscountData = (slabs: AdditionalDiscountSlab[]): AdditionalDiscountData[] =>
    slabs.map((s) => ({ ...s }));

  // ─── Fetch sub-types whenever product type changes ─────────────────────────

  const fetchSubTypes = useCallback(async (typeId: string) => {
    if (!typeId) { setProductSubTypeOptions([]); return; }
    setLoadingSubTypes(true);
    try {
      const items: MasterItem[] = await getCosmeticProductSubTypes(typeId);
      setProductSubTypeOptions(
        items
          .map((i) => ({
            value: getMasterStr(i, "productSubTypeId", "subTypeId", "id"),
            label: getMasterStr(i, "productSubTypeName", "subTypeName", "name") || "Unknown",
          }))
          .filter((o) => o.value),
      );
    } catch {
      setProductSubTypeOptions([]);
    } finally {
      setLoadingSubTypes(false);
    }
  }, []);

  // ─── Load product data for edit mode ──────────────────────────────────────

  const fetchProductData = useCallback(async () => {
    if (mode !== "edit" || !productId) return;
    setLoadingProduct(true);
    try {
      const data = await getProductById(productId);
      if (!data) throw new Error("Product not found");

      setResolvedProductId(data.productId || productId);
      const attribute = data.productAttributeCosmetics?.[0] || {};
      const packaging = (Array.isArray(data.packagingDetails) ? data.packagingDetails[0] : data.packagingDetails) || {};
      const pricing = data.pricingDetails?.[0] || {};

      setProductAttributeId(String(attribute.productAttributeId || ""));
      setPackagingId(String(packaging.packagingId || ""));
      setPricingId(String(pricing.pricingId || ""));

      const mfgDate = pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null;
      const expDate = pricing.expiryDate ? new Date(pricing.expiryDate) : null;

      setForm({
        productName: data.productName || "",
        productTypeId: String(attribute.productTypeId || ""),
        productSubTypeId: String(attribute.productSubTypeId || ""),
        brandName: attribute.brandName || "",
        variantName: attribute.variantName || "",
        gender: attribute.gender?.toLowerCase() || "",
        activeIngredients: attribute.activeIngredients || "",
        netQuantity: attribute.netQuantity || "",
        ageGroupId: String(attribute.ageGroupId || ""),
        productClaims: attribute.productClaims || "",
        warningsPrecautions: data.warningsPrecautions || attribute.warningsPrecautions || "",
        productDescription: data.productDescription || "",
        storageConditionId: String(attribute.storageConditionId || ""),
        manufacturerName: data.manufacturerName || "",
        countryOfOriginId: String(attribute.countryId || ""),
        packTypeId: String(packaging.packId || ""),
        unitsPerPack: String(packaging.unitPerPack || ""),
        numberOfPacks: String(packaging.numberOfPacks || ""),
        packSize: String(packaging.packSize || ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity || ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity || ""),
        batchNumber: pricing.batchLotNumber || pricing.batchNumber || "",
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        stockQuantity: String(pricing.stockQuantity || ""),
        dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
        sellingPrice: String(pricing.sellingPrice || ""),
        mrp: String(pricing.mrp || ""),
        discountPercentage: String(pricing.discountPercentage || ""),
        gstPercentage: String(pricing.gstPercentage ?? ""),
        hsnCode: String(pricing.hsnCode || ""),
        finalPrice: String(pricing.finalPrice || ""),
      });

      setShelfLifeDisplay(computeShelfLife(mfgDate, expDate));

      if (attribute.intendedUseAreaIds?.length) setSelectedIntendedUseAreas(attribute.intendedUseAreaIds.map(String));
      if (attribute.skinTypeIds?.length) setSelectedSkinTypes(attribute.skinTypeIds.map(String));
      if (attribute.hairTypeIds?.length) setSelectedHairTypes(attribute.hairTypeIds.map(String));
      if (pricing.additionalDiscounts?.length) setAdditionalDiscountSlabs(convertToDiscountSlab(pricing.additionalDiscounts));
      if (data.productImages?.length) setExistingImages(data.productImages.map((img: { productImage: string }) => img.productImage));
      if (attribute.brochurePath && attribute.brochurePath !== "PENDING") setExistingBrochureUrl(attribute.brochurePath);

      if (attribute.certificateDocuments?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSelectedCertifications(attribute.certificateDocuments.map((cert: any) => ({
          id: String(cert.certificationId),
          label: cert.certificationName || `Certificate ${cert.certificationId}`,
          tagCode: `Tag ${String(cert.certificationId).padStart(2, "0")}`,
          file: null,
          fileName: cert.certificateUrl && cert.certificateUrl !== "PENDING" ? cert.certificateUrl.split("/").pop() || "" : "",
          uploading: false,
          isUploaded: !!(cert.certificateUrl && cert.certificateUrl !== "PENDING"),
          previewUrl: null,
          productCertificateDocumentId: Number(cert.productCertificateDocumentId),
          existingUrl: cert.certificateUrl && cert.certificateUrl !== "PENDING" ? cert.certificateUrl : undefined,
        })));
      }

      if (attribute.productTypeId) await fetchSubTypes(String(attribute.productTypeId));
    } catch (err) {
      console.error("Error fetching cosmetic product:", err);
      setApiError("Failed to load product data. Please refresh and try again.");
    } finally {
      setLoadingProduct(false);
    }
  }, [mode, productId, fetchSubTypes]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Product types
    setLoadingProductTypes(true);
    getCosmeticProductTypes()
      .then((items: MasterItem[]) =>
        setProductTypeOptions(
          items
            .map((i) => ({
              value: getMasterStr(i, "productTypeId", "id"),
              label: getMasterStr(i, "productTypeName", "name") || "Unknown",
            }))
            .filter((o) => o.value),
        ),
      )
      .catch(() => {})
      .finally(() => setLoadingProductTypes(false));

    // Skin types
    getCosmeticSkinTypes()
      .then((items: MasterItem[]) =>
        setSkinTypeOptions(
          items.map((i) => ({ value: getMasterStr(i, "skinTypeId", "id"), label: getMasterStr(i, "skinTypeName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    // Hair types
    getCosmeticHairTypes()
      .then((items: MasterItem[]) =>
        setHairTypeOptions(
          items.map((i) => ({ value: getMasterStr(i, "hairTypeId", "id"), label: getMasterStr(i, "hairTypeName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    // Age groups
    getCosmeticAgeGroups()
      .then((items: MasterItem[]) =>
        setAgeGroupOptions(
          items.map((i) => ({ value: getMasterStr(i, "ageGroupId", "id"), label: getMasterStr(i, "ageGroupName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    // Intended use areas
    getCosmeticIntendedUseAreas()
      .then((items: MasterItem[]) =>
        setIntendedUseAreaOptions(
          items.map((i) => ({ value: getMasterStr(i, "useAreaId", "id"), label: getMasterStr(i, "useAreaName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    // Storage conditions
    getCosmeticStorageConditions()
      .then((items: MasterItem[]) =>
        setStorageConditionOptions(
          items.map((i) => ({ value: getMasterStr(i, "storageConditionId", "id"), label: getMasterStr(i, "conditionName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    // Countries
    getCosmeticCountries()
      .then((items: MasterItem[]) =>
        setCountryOptions(
          items.map((i) => ({ value: getMasterStr(i, "countryId", "id"), label: getMasterStr(i, "countryName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    // Pack types
    getCosmeticPackTypes(productCategoryId)
      .then((items: MasterItem[]) =>
        setPackTypeOptions(
          items.map((i) => ({ value: getMasterStr(i, "packId"), label: getMasterStr(i, "packType") })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    // Certifications
    setLoadingCertifications(true);
    getCosmeticCertifications()
      .then((items: MasterItem[]) =>
        setCertificationMasterOptions(
          items.map((item, idx) => ({
            value: getMasterStr(item, "certificationId", "id"),
            label: getMasterStr(item, "certificationName", "name") || "Unknown",
            certificationId: Number(getMasterStr(item, "certificationId", "id") || String(idx + 1)),
            tagCode: `Tag ${String(idx + 1).padStart(2, "0")}`,
          })).filter((o) => o.value),
        ),
      )
      .catch(() =>
        setCertificationMasterOptions([
          { value: "1", label: "ISO Certification", certificationId: 1, tagCode: "Tag 01" },
          { value: "2", label: "GMP (Good Manufacturing Practice)", certificationId: 2, tagCode: "Tag 02" },
          { value: "3", label: "CDSCO Registration", certificationId: 3, tagCode: "Tag 03" },
          { value: "4", label: "AYUSH License", certificationId: 4, tagCode: "Tag 04" },
          { value: "5", label: "Cruelty-Free Certification", certificationId: 5, tagCode: "Tag 05" },
          { value: "6", label: "Organic Certification", certificationId: 6, tagCode: "Tag 06" },
          { value: "7", label: "Vegan Certification", certificationId: 7, tagCode: "Tag 07" },
          { value: "8", label: "Dermatologically Tested", certificationId: 8, tagCode: "Tag 08" },
        ]),
      )
      .finally(() => setLoadingCertifications(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "edit" && productId) fetchProductData();
  }, [mode, productId, fetchProductData]);

  // Resolve display labels in edit mode
  useEffect(() => {
    if (mode !== "edit") return;
    setDisplayLabels((prev) => ({
      ...prev,
      productTypeLabel: productTypeOptions.find((o) => o.value === form.productTypeId)?.label || form.productTypeId,
      productSubTypeLabel: productSubTypeOptions.find((o) => o.value === form.productSubTypeId)?.label || form.productSubTypeId,
      ageGroupLabel: ageGroupOptions.find((o) => o.value === form.ageGroupId)?.label || form.ageGroupId,
      storageConditionLabel: storageConditionOptions.find((o) => o.value === form.storageConditionId)?.label || form.storageConditionId,
      countryLabel: countryOptions.find((o) => o.value === form.countryOfOriginId)?.label || form.countryOfOriginId,
      packTypeLabel: packTypeOptions.find((o) => o.value === form.packTypeId)?.label || form.packTypeId,
      gstLabel: gstOptions.find((o) => o.value === form.gstPercentage)?.label || (form.gstPercentage ? `${form.gstPercentage}%` : ""),
      genderLabel: genderOptions.find((o) => o.value === form.gender)?.label || form.gender,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productTypeOptions, productSubTypeOptions, ageGroupOptions, storageConditionOptions, countryOptions, packTypeOptions,
      form.productTypeId, form.productSubTypeId, form.ageGroupId, form.storageConditionId, form.countryOfOriginId, form.packTypeId, form.gstPercentage, form.gender]);

  // Fetch sub-types when product type changes (create mode)
  useEffect(() => {
    if (form.productTypeId && mode === "create") {
      fetchSubTypes(form.productTypeId);
      setForm((p) => ({ ...p, productSubTypeId: "" }));
    } else if (form.productTypeId && mode === "edit") {
      fetchSubTypes(form.productTypeId);
    } else {
      setProductSubTypeOptions([]);
    }
  }, [form.productTypeId, mode, fetchSubTypes]);

  // Update skin/hair rules when product type label changes
  useEffect(() => {
    const label = productTypeOptions.find((o) => o.value === form.productTypeId)?.label || "";
    const rule = getSkinHairRule(label);
    setSkinHairRule(rule);
    // Clear hidden fields to avoid stale values being submitted
    if (rule.skinType === "hidden") setSelectedSkinTypes([]);
    if (rule.hairType === "hidden") setSelectedHairTypes([]);
  }, [form.productTypeId, productTypeOptions]);

  // Auto-calculate pack size
  useEffect(() => {
    const u = parseFloat(form.unitsPerPack), p = parseFloat(form.numberOfPacks);
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0) {
      setForm((prev) => ({ ...prev, packSize: (u * p).toString() }));
    }
  }, [form.unitsPerPack, form.numberOfPacks]);

  // Auto-calculate shelf life
  useEffect(() => {
    const sl = computeShelfLife(form.manufacturingDate, form.expiryDate);
    setShelfLifeDisplay(sl);
    if (sl && errors.expiryDate) setErrors((p) => { const n = { ...p }; delete n.expiryDate; return n; });
  }, [form.manufacturingDate, form.expiryDate]);

  // Auto-calculate final price
  useEffect(() => {
    const selling = parseFloat(form.sellingPrice);
    const disc = parseFloat(form.discountPercentage);
    setForm((prev) => ({
      ...prev,
      finalPrice: !isNaN(selling) && selling > 0
        ? (isNaN(disc) ? selling : selling - (selling * disc) / 100).toFixed(2)
        : "0.00",
    }));
  }, [form.sellingPrice, form.discountPercentage]);

  // Close cert dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (certDropdownRef.current && !certDropdownRef.current.contains(e.target as Node)) setShowCertDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericOnlyFields = [
      "stockQuantity", "sellingPrice", "mrp", "discountPercentage", "hsnCode",
      "unitsPerPack", "numberOfPacks", "minimumOrderQuantity", "maximumOrderQuantity",
    ];
    if (numericOnlyFields.includes(name)) {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      if (value.startsWith("-")) return;
    }
    const maxLengths: Record<string, number> = {
      productName: 150, brandName: 60, variantName: 60,
      manufacturerName: 100, productDescription: 1000, netQuantity: 20,
    };
    if (name in maxLengths && value.length > maxLengths[name]) return;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
    if (name === "hsnCode" && value.trim()) {
      const hsnError = validateHSNCode(value);
      if (hsnError) setErrors((p) => ({ ...p, hsnCode: hsnError }));
      else setErrors((p) => { const n = { ...p }; delete n.hsnCode; return n; });
    }
    if (name === "discountPercentage" && value !== "") {
      const v = parseFloat(value);
      if (isNaN(v) || v < 0 || v > 100) setErrors((p) => ({ ...p, discountPercentage: "Discount must be between 0 and 100" }));
      else setErrors((p) => { const n = { ...p }; delete n.discountPercentage; return n; });
    }
  };

  const handleSelectChange = (field: string, sel: SelectOption | null) => {
    setForm((p) => ({ ...p, [field]: sel ? sel.value : "" }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleCertCheckbox = (option: CertificationMasterOption) => {
    const exists = selectedCertifications.some((c) => c.id === option.value);
    if (exists) {
      setSelectedCertifications((p) => p.filter((c) => c.id !== option.value));
    } else {
      setSelectedCertifications((p) => [...p, {
        id: option.value, label: option.label, tagCode: option.tagCode,
        productCertificateDocumentId: option.certificationId,
        file: null, fileName: "", uploading: false, isUploaded: false, previewUrl: null,
      }]);
    }
    if (errors.certifications) setErrors((p) => { const n = { ...p }; delete n.certifications; return n; });
  };

  const handleCertFileSelect = (certId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("Certificate file size must be less than 5 MB"); return; }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) { alert("Only PDF, JPG, PNG, SVG files are allowed for certificates"); return; }
    setSelectedCertifications((prev) =>
      prev.map((c) => c.id === certId
        ? { ...c, file, fileName: file.name, uploading: false, isUploaded: true, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null, existingUrl: undefined }
        : c,
      ),
    );
    if (errors.certifications) setErrors((p) => { const n = { ...p }; delete n.certifications; return n; });
  };

  const handleImageFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
    const maxSizeBytes = 5 * 1024 * 1024;
    const invalid = fileArr.find((f) => !allowedFormats.includes(f.type));
    if (invalid) { setErrors((p) => ({ ...p, images: "Unsupported image format. Only JPG, JPEG, PNG, SVG are allowed." })); return; }
    const oversized = fileArr.find((f) => f.size > maxSizeBytes);
    if (oversized) { setErrors((p) => ({ ...p, images: "Image file size exceeds the 5 MB limit." })); return; }
    if (images.length + fileArr.length > 5) { setErrors((p) => ({ ...p, images: "Maximum 5 images allowed" })); return; }
    setImages((p) => [...p, ...fileArr]);
    setErrors((p) => { const n = { ...p }; delete n.images; return n; });
  };

  // ─── Validation ───────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

    // Product name
    const pName = form.productName.trim();
    if (!pName) e.productName = "Product name is required";
    else if (pName.length < 3) e.productName = "Product name must be at least 3 characters";
    else if (pName.length > 150) e.productName = "Product name must not exceed 150 characters";

    if (mode === "create") {
      if (!form.productTypeId) e.productTypeId = "Product type is required";
      if (!form.productSubTypeId) e.productSubTypeId = "Product sub-type is required";
    }

    const bName = form.brandName.trim();
    if (!bName) e.brandName = "Brand name is required";
    else if (bName.length > 60) e.brandName = "Brand name must not exceed 60 characters";

    if (!form.gender) e.gender = "Gender is required";

    if (selectedIntendedUseAreas.length === 0) e.intendedUseAreas = "At least one intended use area is required";

    // Skin/hair type validation per rule
    if (skinHairRule.skinType === "mandatory" && selectedSkinTypes.length === 0)
      e.skinTypes = "Skin type is required for this product type";
    if (skinHairRule.hairType === "mandatory" && selectedHairTypes.length === 0)
      e.hairTypes = "Hair type is required for Hair Care products";

    if (!form.activeIngredients.trim()) e.activeIngredients = "Active ingredients are required";

    const nQty = form.netQuantity.trim();
    if (!nQty) e.netQuantity = "Net quantity / strength is required";
    else if (nQty.length > 20) e.netQuantity = "Net quantity must not exceed 20 characters";

    if (!form.ageGroupId) e.ageGroupId = "Age group is required";
    if (!form.productClaims.trim()) e.productClaims = "Product claims are required";
    if (!form.warningsPrecautions.trim()) e.warningsPrecautions = "Warnings / precautions are required";

    const pDesc = form.productDescription.trim();
    if (!pDesc) e.productDescription = "Product description is required";
    else if (pDesc.length > 1000) e.productDescription = "Product description must not exceed 1000 characters";

    if (!form.storageConditionId) e.storageConditionId = "Storage condition is required";

    const mName = form.manufacturerName.trim();
    if (!mName) e.manufacturerName = "Manufacturer name is required";
    else if (mName.length > 100) e.manufacturerName = "Manufacturer name must not exceed 100 characters";

    if (!form.countryOfOriginId) e.countryOfOriginId = "Country of origin is required";

    if (selectedCertifications.length === 0) {
      e.certifications = "At least one certification / compliance is required";
    } else {
      const missing = selectedCertifications.find((c) => !c.file && !c.existingUrl);
      if (missing) e.certifications = `Please upload the certificate file for "${missing.label}"`;
    }

    // Packaging
    if (mode === "create") {
      if (!form.packTypeId) e.packTypeId = "Pack type is required";
    }

    const uPack = Number(form.unitsPerPack);
    if (!form.unitsPerPack.trim()) e.unitsPerPack = "Number of units per pack is required";
    else if (!Number.isInteger(uPack) || uPack <= 0) e.unitsPerPack = "Units per pack must be a positive integer";

    const nPacks = Number(form.numberOfPacks);
    if (!form.numberOfPacks.trim()) e.numberOfPacks = "Number of packs is required";
    else if (!Number.isInteger(nPacks) || nPacks <= 0) e.numberOfPacks = "Number of packs must be a positive integer";

    const minQ = Number(form.minimumOrderQuantity);
    const maxQ = Number(form.maximumOrderQuantity);
    if (!form.minimumOrderQuantity.trim()) e.minimumOrderQuantity = "Minimum order quantity is required";
    else if (!Number.isInteger(minQ) || minQ <= 0) e.minimumOrderQuantity = "Minimum order quantity must be a positive integer";
    if (!form.maximumOrderQuantity.trim()) e.maximumOrderQuantity = "Maximum order quantity is required";
    else if (!Number.isInteger(maxQ) || maxQ <= 0) e.maximumOrderQuantity = "Maximum order quantity must be a positive integer";
    else if (!isNaN(minQ) && maxQ < minQ) e.maximumOrderQuantity = "Maximum order quantity must be ≥ minimum order quantity";

    // Batch
    if (mode === "create") {
      const bNum = form.batchNumber.trim();
      if (!bNum) e.batchNumber = "Batch number is required";
      else if (!/^[a-zA-Z0-9]+$/.test(bNum)) e.batchNumber = "Batch number must be alphanumeric only";

      if (!form.manufacturingDate) e.manufacturingDate = "Manufacturing date is required";
      else if (isFutureDate(form.manufacturingDate)) e.manufacturingDate = "Manufacturing date cannot be a future date";

      if (!form.expiryDate) e.expiryDate = "Expiry date is required";
      else if (form.manufacturingDate && form.expiryDate <= form.manufacturingDate) e.expiryDate = "Expiry date must be after manufacturing date";

      const stock = parseFloat(form.stockQuantity);
      if (!form.stockQuantity.trim()) e.stockQuantity = "Stock quantity is required";
      else if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be greater than 0";
    }

    // Pricing
    const selling = parseFloat(form.sellingPrice);
    if (!form.sellingPrice.trim()) e.sellingPrice = "Selling price is required";
    else if (isNaN(selling) || selling <= 0) e.sellingPrice = "Selling price must be greater than 0";

    const mrp = parseFloat(form.mrp);
    if (!form.mrp.trim()) e.mrp = "MRP is required";
    else if (isNaN(mrp) || mrp <= 0) e.mrp = "MRP must be greater than 0";
    else if (!isNaN(selling) && mrp < selling) e.mrp = "MRP must be ≥ selling price";

    if (form.discountPercentage.trim() !== "") {
      const disc = parseFloat(form.discountPercentage);
      if (isNaN(disc) || disc < 0 || disc > 100) e.discountPercentage = "Discount percentage must be between 0 and 100";
    }

    if (!form.gstPercentage) e.gstPercentage = "GST percentage is required";

    if (!form.hsnCode.trim()) e.hsnCode = "HSN code is required";
    else { const hsnErr = validateHSNCode(form.hsnCode); if (hsnErr) e.hsnCode = hsnErr; }

    if (mode === "create" && images.length === 0) e.images = "At least one product image is required";

    return e;
  };

  const scrollToFirstError = (errs: Record<string, string>) => {
    const errorKeys = Object.keys(errs);
    if (errorKeys.length === 0) return;
    for (const key of errorKeys) {
      const ref = fieldRefs.current[key];
      if (ref) { ref.scrollIntoView({ behavior: "smooth", block: "center" }); if (ref instanceof HTMLInputElement || ref instanceof HTMLTextAreaElement) ref.focus(); return; }
      const el = document.querySelector<HTMLElement>(`[name="${key}"], [data-field="${key}"]`);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus?.(); return; }
    }
  };

  const toLocalDateTimeString = (date: Date | null): string | null => {
    if (!date) return null;
    const now = new Date();
    const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    return combined.toISOString().slice(0, 19);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => scrollToFirstError(validationErrors), 50);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        productName: form.productName,
        warningsPrecautions: form.warningsPrecautions,
        productDescription: form.productDescription,
        manufacturerName: form.manufacturerName,
        categoryId: productCategoryId,
        packagingDetails: [{
          ...(packagingId ? { packagingId } : {}),
          packId: Number(form.packTypeId),
          unitPerPack: Number(form.unitsPerPack),
          numberOfPacks: Number(form.numberOfPacks),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        }],
        pricingDetails: [{
          ...(pricingId ? { pricingId } : {}),
          batchLotNumber: form.batchNumber,
          manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
          expiryDate: toLocalDateTimeString(form.expiryDate),
          shelfLife: shelfLifeDisplay,
          stockQuantity: Number(form.stockQuantity),
          dateOfStockEntry: toLocalDateTimeString(form.dateOfStockEntry),
          sellingPrice: Number(form.sellingPrice),
          mrp: Number(form.mrp),
          discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : 0,
          gstPercentage: Number(form.gstPercentage),
          finalPrice: Number(form.finalPrice),
          hsnCode: Number(form.hsnCode),
          additionalDiscounts: additionalDiscountSlabs,
        }],
        productAttributeCosmetics: [{
          ...(productAttributeId ? { productAttributeId } : {}),
          productTypeId: Number(form.productTypeId),
          productSubTypeId: Number(form.productSubTypeId),
          brandName: form.brandName,
          variantName: form.variantName || null,
          gender: form.gender,
          intendedUseAreaIds: selectedIntendedUseAreas.map(Number),
          skinTypeIds: skinHairRule.skinType !== "hidden" ? selectedSkinTypes.map(Number) : [],
          hairTypeIds: skinHairRule.hairType !== "hidden" ? selectedHairTypes.map(Number) : [],
          activeIngredients: form.activeIngredients,
          netQuantity: form.netQuantity,
          ageGroupId: Number(form.ageGroupId),
          productClaims: form.productClaims,
          warningsPrecautions: form.warningsPrecautions,
          storageConditionId: Number(form.storageConditionId),
          countryId: Number(form.countryOfOriginId),
          brochureType: "PDF",
          brochurePathStatus: existingBrochureUrl || (brochureFile ? "TO_UPLOAD" : "PENDING"),
          certificateDocuments: selectedCertifications.map((c) => ({
            certificationId: Number(c.id),
            certificateUrl: c.existingUrl || "PENDING",
          })),
        }],
        productImages: images.map(() => ({ productImage: "PENDING" })),
      };

      let currentProductId = resolvedProductId || productId || "";
      let currentAttributeId = productAttributeId;
      let certsToUpload: CertificationTag[] = [...selectedCertifications];

      if (mode === "edit" && currentProductId) {
        await updateProduct(currentProductId, payload as any);
        if (images.length > 0) await uploadProductImages(currentProductId, images);
        if (currentAttributeId) {
          for (const cert of certsToUpload.filter((c) => c.file && !c.existingUrl)) {
            const result = await uploadCosmeticCertificate(currentAttributeId, cert.productCertificateDocumentId, cert.file!);
            if (!result.success) setApiError(`Warning: Could not upload certificate "${cert.label}": ${result.message}`);
          }
          if (brochureFile) {
            const r = await uploadCosmeticBrochure(currentAttributeId, brochureFile);
            if (!r.success) setApiError(`Warning: Brochure could not be uploaded — ${r.message}`);
          }
        }
        alert("Product updated successfully!");
        if (onSubmitSuccess) onSubmitSuccess();
        else window.location.reload();
      } else {
        const createData: ApiResponseData = await createCosmeticProduct(payload as Record<string, unknown>);
        const dataInner = createData?.data as ApiResponseData | undefined;
        currentProductId = String(dataInner?.productId ?? createData?.productId ?? "").trim();
        if (!currentProductId || currentProductId === "undefined") throw new Error("Product ID not returned from server");
        currentAttributeId = extractProductAttributeId(createData) || "";
        if (!currentAttributeId) throw new Error("Product attribute ID not returned — cannot upload certificates");

        const certDocIdMap = extractCertDocumentIdMap(createData);
        if (certDocIdMap.size > 0) {
          certsToUpload = certsToUpload.map((c) => {
            const serverDocId = certDocIdMap.get(c.productCertificateDocumentId);
            return serverDocId ? { ...c, productCertificateDocumentId: serverDocId } : c;
          });
        }

        if (images.length > 0) await uploadProductImages(currentProductId, images);
        if (currentAttributeId) {
          for (const cert of certsToUpload.filter((c) => c.file && !c.existingUrl)) {
            const result = await uploadCosmeticCertificate(currentAttributeId, cert.productCertificateDocumentId, cert.file!);
            if (!result.success) setApiError(`Warning: Could not upload certificate "${cert.label}": ${result.message}`);
          }
          if (brochureFile) {
            const r = await uploadCosmeticBrochure(currentAttributeId, brochureFile);
            if (!r.success) setApiError(`Warning: Brochure could not be uploaded — ${r.message}`);
          }
        }
        setShowSuccessModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setApiError(errorMessage);
      alert(`Failed to ${mode === "edit" ? "update" : "create"} product: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Select styles ────────────────────────────────────────────────────────

  const selectStyles = (errorKey: string): SelectStyles => ({
    control: (base, state) => ({
      ...base, height: "48px", minHeight: "48px", borderRadius: "12px",
      borderColor: errors[errorKey] ? "#ef4444" : state.isFocused ? "#7c3aed" : "#d1d5db",
      boxShadow: state.isFocused ? (errors[errorKey] ? "0 0 0 3px rgba(239,68,68,0.15)" : "0 0 0 3px rgba(124,58,237,0.15)") : "none",
      cursor: "pointer", backgroundColor: "#fff", "&:hover": { borderColor: errors[errorKey] ? "#ef4444" : "#7c3aed" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 14px", cursor: "pointer" }),
    indicatorsContainer: (base) => ({ ...base, height: "48px", cursor: "pointer" }),
    dropdownIndicator: (base, state) => ({ ...base, color: state.isFocused ? "#7c3aed" : "#9ca3af", cursor: "pointer", "&:hover": { color: "#7c3aed" } }),
    option: (base, state) => ({
      ...base, backgroundColor: state.isSelected ? "#7c3aed" : state.isFocused ? "#f3f0ff" : "white",
      color: state.isSelected ? "white" : "#1f2937", cursor: "pointer", fontFamily: "'Open Sans', sans-serif", fontSize: "16px",
      "&:active": { backgroundColor: "#7c3aed", color: "white" },
    }),
    placeholder: (base) => ({ ...base, color: "#969793", fontFamily: "'Open Sans', sans-serif", fontSize: "16px" }),
    singleValue: (base) => ({ ...base, color: "#3C3D3A", fontFamily: "'Open Sans', sans-serif", fontSize: "16px" }),
  });

  const selectTheme = (theme: Theme) => ({
    ...theme, colors: { ...theme.colors, primary: "#7c3aed", primary25: "#f3f0ff", primary50: "#ede9fe" },
  });

  // ─── Certification upload UI (shared between create & edit) ───────────────

  const renderCertUploadList = () => {
    if (selectedCertifications.length === 0) {
      return (
        <div className="w-full border border-gray-200 rounded-xl flex items-center h-12 overflow-hidden bg-gray-50">
          <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0"><UploadCloudIcon /></div>
          <span className="[color:#969793] text-base [font-family:'Open_Sans',sans-serif] px-3">Select certifications first</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {selectedCertifications.map((cert) => (
          <div key={cert.id}>
            {cert.existingUrl && !cert.file ? (
              <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50">
                <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0"><FileText size={16} className="text-purple-600" /></div>
                <div className="px-2 flex-shrink-0"><span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-200 text-purple-800 text-xs font-semibold [font-family:'Open_Sans',sans-serif]">{cert.tagCode}</span></div>
                <div className="flex-1 px-2 min-w-0"><p className="text-sm font-medium [color:#3C3D3A] truncate">{cert.label}</p><p className="text-xs text-gray-500">Existing certificate</p></div>
                <div className="flex items-center gap-1 pr-3">
                  <button type="button" title="Replace" onClick={() => document.getElementById(`cosmetic-cert-upload-${cert.id}`)?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600"><RefreshCw size={13} /></button>
                  <button type="button" onClick={() => setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id))} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><X size={13} /></button>
                </div>
              </div>
            ) : cert.isUploaded && cert.file ? (
              <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50">
                <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0"><FileText size={16} className="text-purple-600" /></div>
                <div className="px-2 flex-shrink-0"><span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-200 text-purple-800 text-xs font-semibold [font-family:'Open_Sans',sans-serif]">{cert.tagCode}</span></div>
                <div className="flex-1 px-2 min-w-0"><p className="text-sm font-medium [color:#3C3D3A] truncate">{cert.fileName}</p><p className="text-xs text-gray-500">{(cert.file.size / 1024).toFixed(0)} KB</p></div>
                <div className="flex items-center gap-1 pr-3">
                  <button type="button" onClick={() => document.getElementById(`cosmetic-cert-upload-${cert.id}`)?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600"><RefreshCw size={13} /></button>
                  <button type="button" onClick={() => setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id))} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><X size={13} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12 bg-gray-50 cursor-pointer hover:bg-gray-100 transition" onClick={() => document.getElementById(`cosmetic-cert-upload-${cert.id}`)?.click()}>
                <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0"><UploadCloudIcon /></div>
                <div className="px-2 flex-shrink-0"><span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold [font-family:'Open_Sans',sans-serif]">{cert.tagCode}</span></div>
                <span className="px-2 text-sm [font-family:'Open_Sans',sans-serif] [color:#969793] truncate flex-1">{cert.label} — click to upload</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id)); }} className="pr-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
              </div>
            )}
            <input
              id={`cosmetic-cert-upload-${cert.id}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.svg"
              className="hidden"
              onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCertFileSelect(cert.id, file); }}
            />
          </div>
        ))}
      </div>
    );
  };

  if (loadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEdit = mode === "edit";

  return (
    <>
      <PopupModal
        isOpen={showSuccessModal}
        title="Product Saved Successfully!"
        description="Your cosmetic product has been saved and is now live on the platform"
        primaryActionText="View Product"
        secondaryActionText="Continue Adding"
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={() => { console.log("Go to product"); }}
        onSecondaryAction={() => { setShowSuccessModal(false); window.location.reload(); }}
        onTertiaryAction={() => { window.location.reload(); }}
        onClose={() => setShowSuccessModal(false)}
      />

      {showAdditionalDiscountModal && (
        <CommonModal onClose={() => setShowAdditionalDiscountModal(false)} width="w-[600px]">
          <div className="h-[80vh] overflow-hidden flex flex-col">
            <AdditionalDiscount
              initialData={convertToDiscountData(additionalDiscountSlabs)}
              onSave={(slabs?: AdditionalDiscountData[]) => {
                if (slabs) setAdditionalDiscountSlabs(convertToDiscountSlab(slabs));
                setShowAdditionalDiscountModal(false);
              }}
              onClose={() => setShowAdditionalDiscountModal(false)}
            />
          </div>
        </CommonModal>
      )}

      <div className="flex flex-col gap-5 w-full">

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-red-700 text-sm whitespace-pre-line">{apiError}</span>
          </div>
        )}

        {/* ── Section 1: Product Details ──────────────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Product Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* Product Name */}
            {isEdit ? (
              <NonEditableField label="Product Name" value={form.productName} required />
            ) : (
              <Input
                label="Product Name"
                name="productName"
                placeholder="e.g., Hydrating Face Serum"
                value={form.productName}
                onChange={handleChange}
                error={errors.productName}
                required
              />
            )}

            {/* Brand Name */}
            <Input
              label="Brand Name"
              name="brandName"
              placeholder="e.g., Lakme, Neutrogena, Mamaearth"
              value={form.brandName}
              onChange={handleChange}
              error={errors.brandName}
              required
            />

            {/* Product Type */}
            {isEdit ? (
              <NonEditableSelect label="Product Type" value={displayLabels.productTypeLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("productTypeId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Product Type {requiredStar}</label>
                <Select
                  options={productTypeOptions}
                  isLoading={loadingProductTypes}
                  value={productTypeOptions.find((o) => o.value === form.productTypeId) || null}
                  onChange={(sel) => handleSelectChange("productTypeId", sel)}
                  placeholder={loadingProductTypes ? "Loading..." : "Select product type"}
                  theme={selectTheme}
                  styles={selectStyles("productTypeId")}
                />
                {errors.productTypeId && <p className={errorMsg}>{errors.productTypeId}</p>}
              </div>
            )}

            {/* Product Sub-Type */}
            {isEdit ? (
              <NonEditableSelect label="Product Sub-Type" value={displayLabels.productSubTypeLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("productSubTypeId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Product Sub-Type {requiredStar}</label>
                <Select
                  options={productSubTypeOptions}
                  isLoading={loadingSubTypes}
                  isDisabled={!form.productTypeId}
                  value={productSubTypeOptions.find((o) => o.value === form.productSubTypeId) || null}
                  onChange={(sel) => handleSelectChange("productSubTypeId", sel)}
                  placeholder={form.productTypeId ? (loadingSubTypes ? "Loading..." : "Select sub-type") : "Select product type first"}
                  theme={selectTheme}
                  styles={selectStyles("productSubTypeId")}
                />
                {errors.productSubTypeId && <p className={errorMsg}>{errors.productSubTypeId}</p>}
              </div>
            )}

            {/* Variant Name (optional) */}
            <Input
              label="Variant Name"
              name="variantName"
              placeholder="e.g., Aloe Vera, Rose, Charcoal (optional)"
              value={form.variantName}
              onChange={handleChange}
            />

            {/* Gender */}
            {isEdit ? (
              <NonEditableSelect label="Gender" value={displayLabels.genderLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("gender") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Gender {requiredStar}</label>
                <Select
                  options={genderOptions}
                  value={genderOptions.find((o) => o.value === form.gender) || null}
                  onChange={(sel) => handleSelectChange("gender", sel)}
                  placeholder="Select gender"
                  theme={selectTheme}
                  styles={selectStyles("gender")}
                />
                {errors.gender && <p className={errorMsg}>{errors.gender}</p>}
              </div>
            )}

            {/* Intended Use Area */}
            <MultiCheckDropdown
              label="Intended Use Area"
              required
              options={intendedUseAreaOptions}
              selected={selectedIntendedUseAreas}
              onChange={(vals) => {
                setSelectedIntendedUseAreas(vals);
                if (errors.intendedUseAreas) setErrors((p) => { const n = { ...p }; delete n.intendedUseAreas; return n; });
              }}
              placeholder="Select intended use area(s)"
              errorKey="intendedUseAreas"
              errors={errors}
              fieldRef={setFieldRef("intendedUseAreas") as React.Ref<HTMLDivElement>}
              dataField="intendedUseAreas"
            />

            {/* Skin Type — conditional on rule */}
            {skinHairRule.skinType !== "hidden" && (
              <MultiCheckDropdown
                label={`Skin Type${skinHairRule.skinType === "mandatory" ? "" : " (optional)"}`}
                required={skinHairRule.skinType === "mandatory"}
                options={skinTypeOptions}
                selected={selectedSkinTypes}
                onChange={(vals) => {
                  setSelectedSkinTypes(vals);
                  if (errors.skinTypes) setErrors((p) => { const n = { ...p }; delete n.skinTypes; return n; });
                }}
                placeholder="Select skin type(s)"
                errorKey="skinTypes"
                errors={errors}
                fieldRef={setFieldRef("skinTypes") as React.Ref<HTMLDivElement>}
                dataField="skinTypes"
              />
            )}

            {/* Hair Type — conditional on rule */}
            {skinHairRule.hairType !== "hidden" && (
              <MultiCheckDropdown
                label={`Hair Type${skinHairRule.hairType === "mandatory" ? "" : " (optional)"}`}
                required={skinHairRule.hairType === "mandatory"}
                options={hairTypeOptions}
                selected={selectedHairTypes}
                onChange={(vals) => {
                  setSelectedHairTypes(vals);
                  if (errors.hairTypes) setErrors((p) => { const n = { ...p }; delete n.hairTypes; return n; });
                }}
                placeholder="Select hair type(s)"
                errorKey="hairTypes"
                errors={errors}
                fieldRef={setFieldRef("hairTypes") as React.Ref<HTMLDivElement>}
                dataField="hairTypes"
              />
            )}

            {/* Net Quantity / Strength */}
            <Input
              label="Net Quantity / Strength"
              name="netQuantity"
              placeholder="e.g., 100ml, 50g, 200ml"
              value={form.netQuantity}
              onChange={handleChange}
              error={errors.netQuantity}
              required
            />

            {/* Age Group */}
            {isEdit ? (
              <NonEditableSelect label="Age Group" value={displayLabels.ageGroupLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("ageGroupId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Age Group {requiredStar}</label>
                <Select
                  options={ageGroupOptions}
                  value={ageGroupOptions.find((o) => o.value === form.ageGroupId) || null}
                  onChange={(sel) => handleSelectChange("ageGroupId", sel)}
                  placeholder="Select age group"
                  theme={selectTheme}
                  styles={selectStyles("ageGroupId")}
                />
                {errors.ageGroupId && <p className={errorMsg}>{errors.ageGroupId}</p>}
              </div>
            )}

            {/* Country of Origin */}
            {isEdit ? (
              <NonEditableSelect label="Country of Origin" value={displayLabels.countryLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("countryOfOriginId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Country of Origin {requiredStar}</label>
                <Select
                  options={countryOptions}
                  value={countryOptions.find((o) => o.value === form.countryOfOriginId) || null}
                  onChange={(sel) => handleSelectChange("countryOfOriginId", sel)}
                  placeholder="Select country"
                  theme={selectTheme}
                  styles={selectStyles("countryOfOriginId")}
                />
                {errors.countryOfOriginId && <p className={errorMsg}>{errors.countryOfOriginId}</p>}
              </div>
            )}

            {/* Manufacturer Name */}
            {isEdit ? (
              <NonEditableField label="Manufacturer Name" value={form.manufacturerName} required />
            ) : (
              <Input
                label="Manufacturer Name"
                name="manufacturerName"
                placeholder="Manufacturer company name"
                value={form.manufacturerName}
                onChange={handleChange}
                error={errors.manufacturerName}
                required
              />
            )}

            {/* Storage Condition */}
            <div className="flex flex-col gap-1" ref={setFieldRef("storageConditionId") as React.RefCallback<HTMLDivElement>}>
              <label className={fieldLabel}>Storage Condition {requiredStar}</label>
              <Select
                options={storageConditionOptions}
                value={storageConditionOptions.find((o) => o.value === form.storageConditionId) || null}
                onChange={(sel) => handleSelectChange("storageConditionId", sel)}
                placeholder="Select storage condition"
                theme={selectTheme}
                styles={selectStyles("storageConditionId")}
              />
              {errors.storageConditionId && <p className={errorMsg}>{errors.storageConditionId}</p>}
            </div>

            {/* Certifications — full row */}
            <div className="col-span-1 md:col-span-2" ref={setFieldRef("certifications") as React.RefCallback<HTMLDivElement>} data-field="certifications">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Selector */}
                {isEdit ? (
                  <NonEditableField label="Certifications / Compliance" value={selectedCertifications.map((c) => c.label).join(", ")} required />
                ) : (
                  <div>
                    <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
                    <div className="relative" ref={certDropdownRef}>
                      <div
                        onClick={() => setShowCertDropdown((p) => !p)}
                        className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all bg-white ${errors.certifications ? "border-red-400" : "border-gray-300 hover:border-purple-600"}`}
                      >
                        <span
                          className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]"
                          style={{ color: selectedCertifications.length > 0 ? "#3C3D3A" : "#969793" }}
                        >
                          {selectedCertifications.length > 0 ? selectedCertifications.map((c) => c.label).join(", ") : "Select certifications"}
                        </span>
                        <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${showCertDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showCertDropdown && (
                        <div className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {loadingCertifications ? (
                            <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
                          ) : (
                            certificationMasterOptions.map((opt) => (
                              <label key={opt.value} className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedCertifications.some((c) => c.id === opt.value)}
                                  onChange={() => handleCertCheckbox(opt)}
                                  className="accent-purple-600 w-4 h-4"
                                />
                                <span className="text-base [font-family:'Open_Sans',sans-serif] [color:#3C3D3A]">{opt.label}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
                  </div>
                )}

                {/* Upload */}
                <div>
                  <label className={fieldLabel}>Upload Certificate Documents {requiredStar}</label>
                  {renderCertUploadList()}
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, SVG — max 5 MB per file. Files are uploaded on Save.</p>
                </div>
              </div>
            </div>

            {/* Brochure */}
            <div ref={setFieldRef("brochure") as React.RefCallback<HTMLDivElement>}>
              <UploadInput
                onFileSelect={(file) => setBrochureFile(file)}
                existingFile={existingBrochureUrl || undefined}
              />
            </div>

            {/* Active Ingredients */}
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={fieldLabel}>Active Ingredients {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("activeIngredients") as React.RefCallback<HTMLTextAreaElement>}
                    name="activeIngredients"
                    value={form.activeIngredients}
                    onChange={handleChange}
                    rows={4}
                    placeholder="e.g., Vitamin C, Vitamin E, Salicylic Acid, Hyaluronic Acid"
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.activeIngredients ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.activeIngredients && <p className={errorMsg}>{errors.activeIngredients}</p>}
                </div>

                <div>
                  <label className={fieldLabel}>Product Claims {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("productClaims") as React.RefCallback<HTMLTextAreaElement>}
                    name="productClaims"
                    value={form.productClaims}
                    onChange={handleChange}
                    rows={4}
                    placeholder={`e.g., "Paraben Free", "Dermatologically Tested", "Clinically Proven"`}
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.productClaims ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.productClaims && <p className={errorMsg}>{errors.productClaims}</p>}
                </div>

                <div>
                  <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
                    name="warningsPrecautions"
                    value={form.warningsPrecautions}
                    onChange={handleChange}
                    rows={4}
                    placeholder="e.g., For external use only. Avoid contact with eyes. Keep out of reach of children."
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.warningsPrecautions ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.warningsPrecautions && <p className={errorMsg}>{errors.warningsPrecautions}</p>}
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="col-span-1 md:col-span-2">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea
                ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                name="productDescription"
                value={form.productDescription}
                onChange={handleChange}
                rows={4}
                placeholder="Detailed product description (max 1000 characters)"
                maxLength={1000}
                className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.productDescription ? "border-red-400" : "border-gray-300"}`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.productDescription ? <p className={errorMsg}>{errors.productDescription}</p> : <span />}
                <span className="text-xs text-gray-400">{form.productDescription.length}/1000</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Packaging & Order Details ──────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Packaging &amp; Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* Pack Type */}
            {isEdit ? (
              <NonEditableSelect label="Pack Type" value={displayLabels.packTypeLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("packTypeId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Pack Type {requiredStar}</label>
                <Select
                  options={packTypeOptions}
                  value={packTypeOptions.find((o) => o.value === form.packTypeId) || null}
                  onChange={(sel) => handleSelectChange("packTypeId", sel)}
                  placeholder="Select pack type"
                  theme={selectTheme}
                  styles={selectStyles("packTypeId")}
                />
                {errors.packTypeId && <p className={errorMsg}>{errors.packTypeId}</p>}
              </div>
            )}

            <Input
              label="Number of Units per Pack Type"
              name="unitsPerPack"
              placeholder="e.g., 1"
              value={form.unitsPerPack}
              onChange={handleChange}
              error={errors.unitsPerPack}
              required
            />

            <Input
              label="Number of Packs"
              name="numberOfPacks"
              placeholder="e.g., 1"
              value={form.numberOfPacks}
              onChange={handleChange}
              error={errors.numberOfPacks}
              required
            />

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Pack Size (No. of Units per Pack Type × No. of Packs)</label>
              <input
                name="packSize"
                value={form.packSize}
                readOnly
                className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed"
              />
            </div>
          </div>

          <p className={subSectionTitle}>Order Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Input
              label="Min Order Qty (in terms of Pack Size)"
              name="minimumOrderQuantity"
              placeholder="e.g., 1"
              value={form.minimumOrderQuantity}
              onChange={handleChange}
              error={errors.minimumOrderQuantity}
              required
            />
            <Input
              label="Max Order Qty (in terms of Pack Size)"
              name="maximumOrderQuantity"
              placeholder="e.g., 100"
              value={form.maximumOrderQuantity}
              onChange={handleChange}
              error={errors.maximumOrderQuantity}
              required
            />
          </div>

          <p className={subSectionTitle}>Batch, Stock &amp; Expiry</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* Batch Number */}
            {isEdit ? (
              <NonEditableField label="Batch Number" value={form.batchNumber} required />
            ) : (
              <Input
                label="Batch Number"
                name="batchNumber"
                placeholder="Alphanumeric only, e.g., BAT2024001"
                value={form.batchNumber}
                onChange={handleChange}
                error={errors.batchNumber}
                required
              />
            )}

            {/* Manufacturing Date */}
            {isEdit ? (
              <NonEditableField label="Manufacturing Date" value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""} required />
            ) : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Manufacturing Date {requiredStar}</label>
                <input
                  ref={setFieldRef("manufacturingDate")}
                  type="date"
                  name="manufacturingDate"
                  max={todayStr}
                  value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""}
                  onChange={(e) => setForm((p) => ({ ...p, manufacturingDate: e.target.value ? new Date(e.target.value) : null }))}
                  className={`w-full h-12 px-4 border rounded-xl text-base [font-family:'Open_Sans',sans-serif] bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.manufacturingDate ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.manufacturingDate && <p className={errorMsg}>{errors.manufacturingDate}</p>}
              </div>
            )}

            {/* Expiry Date */}
            {isEdit ? (
              <NonEditableField label="Expiry Date" value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""} required />
            ) : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Expiry Date {requiredStar}</label>
                <input
                  ref={setFieldRef("expiryDate")}
                  type="date"
                  name="expiryDate"
                  min={form.manufacturingDate ? (() => { const d = new Date(form.manufacturingDate!); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })() : undefined}
                  value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""}
                  onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value ? new Date(e.target.value) : null }))}
                  className={`w-full h-12 px-4 border rounded-xl text-base [font-family:'Open_Sans',sans-serif] bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.expiryDate ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.expiryDate && <p className={errorMsg}>{errors.expiryDate}</p>}
              </div>
            )}

            {/* Shelf Life (auto-calculated) */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Shelf Life (auto-calculated)</label>
              <div className={`w-full h-12 px-4 border rounded-xl flex items-center text-base [font-family:'Open_Sans',sans-serif] ${shelfLifeDisplay ? "border-purple-200 bg-purple-50 [color:#7D32FC]" : "border-gray-200 bg-gray-50 [color:#969793]"}`}>
                {shelfLifeDisplay || "Calculated from Manufacturing & Expiry dates"}
              </div>
            </div>

            {/* Stock Quantity */}
            {isEdit ? (
              <NonEditableField label="Stock Quantity (in terms of Pack Size)" value={form.stockQuantity} required />
            ) : (
              <Input
                label="Stock Quantity (in terms of Pack Size)"
                name="stockQuantity"
                placeholder="e.g., 100"
                value={form.stockQuantity}
                onChange={handleChange}
                error={errors.stockQuantity}
                required
              />
            )}

            {/* Date of Stock Entry */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Date of Stock Entry {requiredStar}</label>
              <input
                type="date"
                value={todayStr}
                readOnly
                className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed"
              />
            </div>
          </div>

          <p className={subSectionTitle}>Pricing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            <Input
              label="MRP (per Pack Size)"
              name="mrp"
              placeholder="e.g., 599"
              value={form.mrp}
              onChange={handleChange}
              error={errors.mrp}
              required
            />

            <Input
              label="Selling Price (per Pack Size)"
              name="sellingPrice"
              placeholder="e.g., 499"
              value={form.sellingPrice}
              onChange={handleChange}
              error={errors.sellingPrice}
              required
            />

            <Input
              label="Discount Percentage (%)"
              name="discountPercentage"
              placeholder="0–100"
              value={form.discountPercentage}
              onChange={handleChange}
              error={errors.discountPercentage}
            />

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Final Price (Auto-calculated)</label>
              <input
                name="finalPrice"
                value={form.finalPrice}
                readOnly
                className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`${fieldLabel} opacity-0`}>_</label>
              <button
                type="button"
                onClick={() => setShowAdditionalDiscountModal(true)}
                style={{ background: "#9F75FC", borderRadius: "8px" }}
                className="h-12 px-5 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] w-auto self-start hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                Add Additional Discount
              </button>
            </div>
          </div>

          <p className={subSectionTitle}>Tax &amp; Billing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* GST */}
            {isEdit ? (
              <NonEditableSelect label="GST %" value={displayLabels.gstLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("gstPercentage") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>GST % {requiredStar}</label>
                <Select
                  options={gstOptions}
                  value={gstOptions.find((o) => o.value === form.gstPercentage) || null}
                  onChange={(sel) => handleSelectChange("gstPercentage", sel)}
                  placeholder="Select GST %"
                  theme={selectTheme}
                  styles={selectStyles("gstPercentage")}
                />
                {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
              </div>
            )}

            {/* HSN Code */}
            {isEdit ? (
              <NonEditableField label="HSN Code" value={form.hsnCode} required />
            ) : (
              <Input
                label="HSN Code"
                name="hsnCode"
                placeholder="4, 6, or 8 digit numeric code"
                value={form.hsnCode}
                onChange={handleChange}
                maxLength={8}
                error={errors.hsnCode}
                required
              />
            )}
          </div>
        </div>

        {/* ── Section 3: Product Photos ──────────────────────────────────────────── */}
        <div
          className={sectionCard}
          ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>}
          data-field="images"
        >
          <h2 className="text-[14px] [font-family:'Open_Sans',sans-serif] font-semibold leading-8 [color:#1E1E1D] mb-1">
            Product Photos {mode === "create" && <span className="text-red-500">*</span>}
          </h2>

          {existingImages.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">Current Images</p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((url, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={url} alt={`existing-${i}`} className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
            onClick={() => document.getElementById("cosmeticFileInput")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files); }}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-sm font-medium text-gray-600 text-center">Choose a file or drag &amp; drop it here</div>
              <div className="text-xs text-gray-400 text-center">PNG, JPG, SVG — max 5 images, 5 MB each</div>
            </div>
          </div>

          <input
            id="cosmeticFileInput"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/jpg,image/svg+xml"
            className="hidden"
            onChange={(e) => { if (e.target.files) handleImageFiles(e.target.files); }}
          />

          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={i} className="relative group flex-shrink-0">
                    <img src={url} alt={`Product ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-purple-300 transition" />
                    <button
                      type="button"
                      onClick={() => { URL.revokeObjectURL(url); setImages((p) => p.filter((_, idx) => idx !== i)); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {errors.images && <p className={`${errorMsg} mt-2`}>{errors.images}</p>}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 pb-8">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onSubmitSuccess ? onSubmitSuccess() : window.location.reload()}
              className="px-5 py-2.5 border-2 border-red-400 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              style={{ background: "#9F75FC", borderRadius: "8px" }}
              className="px-5 py-3 text-white text-base [font-family:'Open_Sans',sans-serif] font-semibold leading-[22px] flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <img src="/icons/SaveDraftIcon.svg" alt="save draft" className="w-5 h-5 object-contain" />
              Save Draft
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ background: "#4B0082", borderRadius: "8px" }}
            className="px-8 py-3 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CosmeticForm;