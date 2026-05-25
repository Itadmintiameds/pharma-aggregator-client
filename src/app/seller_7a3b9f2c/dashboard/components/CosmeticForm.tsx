"use client";

import Input from "@/src/app/commonComponents/Input";
import {
  createCosmeticProduct,
  getCosmeticAgeGroups,
  getCosmeticCertificationsByCategoryId,
  getCosmeticCountries,
  getCosmeticHairTypes,
  getCosmeticIntendedUseAreas,
  getCosmeticNetQuantityUnits,
  getCosmeticPackTypes,
  getCosmeticProductForms,
  getCosmeticProductSubTypes,
  getCosmeticProductTypes,
  getCosmeticSkinTypes,
  getStorageConditionsByCategoryId,
  uploadCosmeticBrochure,
  uploadCosmeticCertificate
} from "@/src/services/product/CosmeticService";
import {
  deleteProduct,
  getProductById,
  updateProduct,
  uploadProductImages,
} from "@/src/services/product/ProductService";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";
import { AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import CommonModal from "../commonComponent/CommonModal";
import PopupModal from "../commonComponent/PopupModal";
import UploadInput from "../commonComponent/UploadInput";
import AdditionalDiscountType from "./AdditionalDiscountType";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

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

interface MasterItem {
  [key: string]: unknown;
}

interface ApiResponseData {
  [key: string]: unknown;
}

// ─── Skin / Hair visibility rules ────────────────────────────────────────────

type FieldBehaviour = "mandatory" | "optional" | "hidden";

interface SkinHairRule {
  skinType: FieldBehaviour;
  hairType: FieldBehaviour;
}

const SKIN_HAIR_RULES_BY_LABEL: Record<string, SkinHairRule> = {
  "Hair Care":                 { skinType: "hidden",    hairType: "mandatory" },
  "Skin Care (Face)":          { skinType: "mandatory", hairType: "hidden"    },
  "Body Care":                 { skinType: "mandatory", hairType: "hidden"    },
  "Lip Care":                  { skinType: "mandatory", hairType: "hidden"    },
  "Eye Care":                  { skinType: "mandatory", hairType: "hidden"    },
  "Personal Hygiene":          { skinType: "optional",  hairType: "hidden"    },
  "Makeup / Colour Cosmetics": { skinType: "optional",  hairType: "hidden"    },
  "Makeup / Color Cosmetics":  { skinType: "optional",  hairType: "hidden"    },
  "Fragrance":                 { skinType: "hidden",    hairType: "hidden"    },
  "Men's Grooming":            { skinType: "optional",  hairType: "optional"  },
};

function getSkinHairRule(productTypeLabel: string): SkinHairRule {
  if (productTypeLabel in SKIN_HAIR_RULES_BY_LABEL)
    return SKIN_HAIR_RULES_BY_LABEL[productTypeLabel];
  const lower = productTypeLabel.toLowerCase();
  for (const [key, rule] of Object.entries(SKIN_HAIR_RULES_BY_LABEL)) {
    if (key.toLowerCase() === lower) return rule;
  }
  return { skinType: "optional", hairType: "optional" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────



function validateHSNCode(hsnCode: string): string | null {
  const trimmed = hsnCode.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return "HSN code must contain numeric digits only";
  if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(trimmed))
    return "HSN code must be 4, 6, or 8 digits";
  return null;
}
function computeShelfLife(mfgDate: Date | null, expDate: Date | null): number | null {
  if (!mfgDate || !expDate) return null;
  const totalMonths = (expDate.getFullYear() - mfgDate.getFullYear()) * 12 + (expDate.getMonth() - mfgDate.getMonth());
  return totalMonths > 0 ? totalMonths : null;
}

function getMasterStr(item: MasterItem, ...keys: string[]): string {
  for (const key of keys) {
    const v = item[key];
    if (v != null) return String(v);
  }
  return "";
}

function extractProductAttributeId(data: ApiResponseData): string | undefined {
  const inner = (data?.data ?? data) as ApiResponseData;

  const arrayKeys = [
    "productAttributeCosmeticAndPersonalUse",
    "productAttributeCosmetics",
    "productAttributes",
    "cosmeticAttributes",
  ];

  const idKeys = [
    "productAttributeId",
    "productAttributeCosmeticAndPersonalUseId",
    "attributeId",
    "id",
  ];

  for (const arrayKey of arrayKeys) {
    const arr = inner?.[arrayKey] ?? data?.[arrayKey];
    if (Array.isArray(arr) && arr.length > 0) {
      const item = arr[0] as ApiResponseData;
      for (const idKey of idKeys) {
        if (item[idKey] != null) return String(item[idKey]);
      }
    }
  }

  for (const idKey of idKeys) {
    if (inner?.[idKey] != null) return String(inner[idKey]);
    if (data?.[idKey]  != null) return String(data[idKey]);
  }

  return undefined;
}

function extractAttributeIdFromProduct(productData: ApiResponseData): string {
  const attr =
    (productData?.productAttributeCosmeticAndPersonalUse as ApiResponseData[] | null)?.[0] ??
    (productData?.productAttributeCosmetics as ApiResponseData[] | null)?.[0] ??
    null;

  if (!attr) return "";

  const idKeys = [
    "productAttributeId",
    "productAttributeCosmeticAndPersonalUseId",
    "attributeId",
    "id",
  ];

  for (const key of idKeys) {
    if (attr[key] != null) return String(attr[key]);
  }
  return "";
}

function extractCertDocumentIdMap(data: ApiResponseData): Map<number, number> {
  const map = new Map<number, number>();
  try {
    const inner   = (data?.data ?? data) as ApiResponseData;
    const arrayKeys = [
      "productAttributeCosmeticAndPersonalUse",
      "productAttributeCosmetics",
      "productAttributes",
    ];
    for (const key of arrayKeys) {
      const arr = inner?.[key] ?? data?.[key];
      if (Array.isArray(arr) && arr.length > 0) {
        const certDocs = (arr[0] as ApiResponseData)?.certificateDocuments;
        if (Array.isArray(certDocs)) {
          for (const doc of certDocs) {
            const d      = doc as ApiResponseData;
            const certId = Number(d.certificationId);
            const docId  = Number(d.productCertificateDocumentId);
            if (!isNaN(certId) && !isNaN(docId) && docId > 0) map.set(certId, docId);
          }
          return map;
        }
      }
    }
  } catch { /* ignore */ }
  return map;
}

function extractCertDocumentIdMapFromProduct(productData: ApiResponseData): Map<number, number> {
  const map = new Map<number, number>();
  try {
    const attr =
      (productData?.productAttributeCosmeticAndPersonalUse as ApiResponseData[] | null)?.[0] ??
      (productData?.productAttributeCosmetics as ApiResponseData[] | null)?.[0] ??
      null;
    if (!attr) return map;
    const certDocs = attr.certificateDocuments as ApiResponseData[] | null;
    if (!Array.isArray(certDocs)) return map;
    for (const doc of certDocs) {
      const certId = Number(doc.certificationId);
      const docId  = Number(doc.productCertificateDocumentId);
      if (!isNaN(certId) && !isNaN(docId) && docId > 0) map.set(certId, docId);
    }
  } catch { /* ignore */ }
  return map;
}

// ─── NumericInputWithUnit ─────────────────────────────────────────────────────

interface NumericInputWithUnitProps {
  label: string;
  name: string;
  value: string;
  unitId: string;
  onValueChange: (val: string) => void;
  onUnitChange: (unitId: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  options: SelectOption[];
  loading?: boolean;
  unitDisabled?: boolean;
}

const NumericInputWithUnit: React.FC<NumericInputWithUnitProps> = ({
  label, name, value, unitId, onValueChange, onUnitChange, placeholder = "", error,
  required = false, disabled = false, readOnly = false, options, loading = false, unitDisabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find(o => o.value === unitId)?.label || "";

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const getBorderColor = () => {
    if (disabled) return "border-pneutral-200 bg-sneutral-100 cursor-not-allowed";
    if (readOnly) return "border-pneutral-100 bg-pneutral-50 cursor-default";
    if (error) return "border-warning-500 focus-within:ring-1 focus-within:ring-warning-500 focus-within:border-warning-500";
    return "border-neutral-500 focus-within:border-secondary-300 focus-within:ring-1 focus-within:ring-secondary-300";
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-0 w-full relative">
      <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${disabled ? "text-pneutral-500" : "text-pneutral-900"}`}>
        {label}{required && <span className="text-warning-500 ml-1">*</span>}
      </label>
      <div className={`flex items-center h-[52px] w-full border rounded-lg bg-white overflow-hidden transition-all duration-200 ${getBorderColor()}`}>
        <input
          type="text" name={name} placeholder={placeholder} value={value}
          onChange={(e) => { if (e.target.value === "" || /^\d*\.?\d*$/.test(e.target.value)) onValueChange(e.target.value); }}
          disabled={disabled || readOnly}
          className="flex-1 h-full px-4 text-base outline-none border-none bg-transparent text-pneutral-800 placeholder:text-pneutral-500"
        />
        <div className="h-full border-l border-neutral-300" />
        <button type="button" disabled={disabled || readOnly || unitDisabled}
          onClick={() => !disabled && !readOnly && !unitDisabled && setIsOpen(!isOpen)}
          className="w-[149px] h-full px-3 bg-pneutral-50 flex items-center justify-between gap-1 transition-colors hover:bg-neutral-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
          <span className={selectedLabel ? "text-pneutral-800" : "text-pneutral-500"} style={{ fontWeight: 400, fontSize: "16px", lineHeight: "24px" }}>
            {loading ? "Loading..." : (selectedLabel || "Select Unit")}
          </span>
          <svg className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+4px)] w-[149px] max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col py-1">
            {options.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => { onUnitChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm text-pneutral-800 hover:bg-pneutral-50 transition-colors cursor-pointer font-medium ${unitId === opt.value ? "bg-neutral-50 font-semibold" : ""}`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="font-heading font-normal text-sm leading-[28px] px-1 text-warning-500 mt-1">{error}</p>}
    </div>
  );
};

// ─── Style constants ──────────────────────────────────────────────────────────

const fieldLabel   = "font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle text-pneutral-900";
const requiredStar = <span className="text-warning-500 font-semibold ml-1">*</span>;
const errorMsg     = "font-heading font-normal text-sm leading-[28px] px-1 text-warning-500";

// ─── Static Options ───────────────────────────────────────────────────────────

const genderOptions: SelectOption[] = [
  { value: "male",   label: "Male"   },
  { value: "female", label: "Female" },
  { value: "unisex", label: "Unisex" },
];

const gstOptions: SelectOption[] = [
  { value: "0",  label: "0%"  },
  { value: "5",  label: "5%"  },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
];



// ─── Component ────────────────────────────────────────────────────────────────

const CosmeticForm = ({ productId, mode = "create", onSubmitSuccess }: CosmeticFormProps) => {
  const router = useRouter();
  const todayStr = new Date().toISOString().split("T")[0];

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef = (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const productCategoryId = 4;

  // ─── Loading states ───────────────────────────────────────────────────────────
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingProductTypes, setLoadingProductTypes] = useState(false);
  const [loadingSubTypes, setLoadingSubTypes] = useState(false);
  const [loadingSkinTypes, setLoadingSkinTypes] = useState(false);
  const [loadingHairTypes, setLoadingHairTypes] = useState(false);
  const [loadingAgeGroups, setLoadingAgeGroups] = useState(false);
  const [loadingIntendedUseAreas, setLoadingIntendedUseAreas] = useState(false);
  const [loadingStorageConditions, setLoadingStorageConditions] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingPackTypes, setLoadingPackTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [loadingNetQuantityUnits, setLoadingNetQuantityUnits] = useState(false);
  const [loadingProductForms, setLoadingProductForms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    productName:          "",
    productTypeId:        "",
    productSubTypeId:     "",
    brandName:            "",
    variantName:          "",
    gender:               "",
    activeIngredients:    "",
    netQuantity:          "",
    netQuantityUnitId:    "",
    productFormId:        "",
    productClaims:        "",
    warningsPrecautions:  "",
    productDescription:   "",
    storageConditionId:   "",
    manufacturerName:     "",
    countryOfOriginId:    "",
    packTypeId:           "",
    unitsPerPack:         "",
    numberOfPacks:        "",
    packSize:             "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    batchNumber:          "",
    manufacturingDate:    null as Date | null,
    expiryDate:           null as Date | null,
    stockQuantity:        "",
    dateOfStockEntry:     new Date(),
    sellingPrice:         "",
    mrp:                  "",
    discountPercentage:   "",
    finalPrice:           "",
    gstPercentage:        "",
    hsnCode:              "",
    shelfLifeMonths:      "",
    // ✅ additionalDiscount stored directly as AdditionalDiscountData[] — same as DrugForm
    additionalDiscount:   [] as AdditionalDiscountData[],
  });
  const [resolvedProductId, setResolvedProductId] = useState("");
  const [productAttributeId, setProductAttributeId] = useState("");
  const [packagingId, setPackagingId] = useState("");
  const [pricingId, setPricingId] = useState("");

  // ─── Multi-select fields ──────────────────────────────────────────────────────
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedIntendedUseAreas, setSelectedIntendedUseAreas] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedHairTypes, setSelectedHairTypes] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

  // ─── Master options ───────────────────────────────────────────────────────────
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
  const [netQuantityUnitOptions, setNetQuantityUnitOptions] = useState<SelectOption[]>([]);
  const [productFormOptions, setProductFormOptions] = useState<SelectOption[]>([]);

  // ─── Skin/Hair rule ───────────────────────────────────────────────────────────
  const [skinHairRule, setSkinHairRule] = useState<SkinHairRule>({ skinType: "optional", hairType: "optional" });

  // ─── Errors / modals ──────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string>("");
  // ✅ Renamed to match DrugForm's state variable name exactly
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const getMinExpiryMonth = () => {
    const today = new Date();
    const minFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    if (!form.manufacturingDate) {
      return `${minFromNow.getFullYear()}-${String(minFromNow.getMonth() + 1).padStart(2, "0")}`;
    }
    const mfg = new Date(form.manufacturingDate);
    const minFromMfg = new Date(mfg.getFullYear(), mfg.getMonth() + 3, 1);
    const min = minFromMfg > minFromNow ? minFromMfg : minFromNow;
    return `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMaxExpiryMonth = () => {
    if (!form.manufacturingDate) return "";
    const mfg = new Date(form.manufacturingDate);
    const maxDate = new Date(mfg.getFullYear() + 5, mfg.getMonth(), 1);
    return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, "0")}`;
  };

  const toLocalDateTimeString = (date: Date | null): string | null => {
    if (!date) return null;
    const now = new Date();
    const combined = new Date(
      date.getFullYear(), date.getMonth(), date.getDate(),
      now.getHours(), now.getMinutes(), now.getSeconds(),
    );
    return combined.toISOString().slice(0, 19);
  };

  // ─── Fetch sub-types ─────────────────────────────────────────────────────────
  const fetchSubTypes = useCallback(async (typeId: string): Promise<SelectOption[]> => {
    if (!typeId) {
      setProductSubTypeOptions([]);
      return [];
    }
    setLoadingSubTypes(true);
    try {
      const items: MasterItem[] = await getCosmeticProductSubTypes(typeId);
      const opts = items
        .map((i) => ({
          value: getMasterStr(i, "productSubTypeId", "subcategoryId", "subTypeId", "id"),
          label: getMasterStr(i, "productSubTypeName", "subcategoryName", "subTypeName", "name") || "Unknown",
        }))
        .filter((o) => o.value);
      setProductSubTypeOptions(opts);
      return opts;
    } catch {
      setProductSubTypeOptions([]);
      return [];
    } finally {
      setLoadingSubTypes(false);
    }
  }, []);

  // ─── Load product for edit mode ───────────────────────────────────────────────
  const fetchProductData = useCallback(async (
    _currentProductTypeOptions: SelectOption[],
    _currentAgeGroupOptions: SelectOption[],
    _currentStorageConditionOptions: SelectOption[],
    _currentCountryOptions: SelectOption[],
    _currentPackTypeOptions: SelectOption[],
  ) => {
    if (mode !== "edit" || !productId) return;
    setLoadingProduct(true);
    try {
      const data = await getProductById(productId);
      if (!data) throw new Error("Product not found");

      setResolvedProductId(data.productId || productId);

      const attribute = data.productAttributeCosmeticAndPersonalUse?.[0]
                     ?? data.productAttributeCosmetics?.[0]
                     ?? {};

      const packaging = (Array.isArray(data.packagingDetails) ? data.packagingDetails[0] : data.packagingDetails) ?? {};
      const pricing = data.pricingDetails?.[0] ?? {};

      setProductAttributeId(String(attribute.productAttributeId || ""));
      setPackagingId(String(packaging.packagingId || ""));
      setPricingId(String(pricing.pricingId || ""));

      const mfgDate = pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null;
      const expDate = pricing.expiryDate ? new Date(pricing.expiryDate) : null;

      const productTypeIdStr    = String(attribute.productCategoryId ?? attribute.productTypeId ?? "");
      const productSubTypeIdStr = String(attribute.productSubcategoryId ?? attribute.productSubTypeId ?? "");
      const storageCondIdStr    = String(attribute.storageConditionId || "");
      const countryIdStr        = String(attribute.countryId || "");
      const packIdStr           = String(packaging.packId || "");
      const gstVal              = String(pricing.gstPercentage ?? "");
      const netQuantityUnitIdStr = String(attribute.unitId || attribute.netQuantityUnitId || "");
      const productFormIdStr    = String(attribute.formId || attribute.productFormId || "");

      let ageGroupIds: string[] = [];
      if (Array.isArray(attribute.ageGroupIds))     ageGroupIds = attribute.ageGroupIds.map(String);
      else if (Array.isArray(attribute.ageGroupId)) ageGroupIds = attribute.ageGroupId.map(String);
      else if (attribute.ageGroupId)                ageGroupIds = [String(attribute.ageGroupId)];

      const brandNameValue        = attribute.brandName || "";
      const variantNameValue      = attribute.VariantName || attribute.variantName || "";
      const genderValue           = (attribute.Gender || attribute.gender || "").toLowerCase();
      const activeIngredientsValue = attribute.ActiveIngredients || attribute.activeIngredients || "";
      const netQuantityValue      = String(attribute.NetQuantityStrength ?? attribute.netQuantityStrength ?? attribute.netQuantity ?? "");
      const productClaimsValue    = attribute.ProductClaims || attribute.productClaims || "";
      const warningsValue         = data.warningsPrecautions ?? attribute.WarningsPrecautions ?? attribute.warningsPrecautions ?? "";
      const descriptionValue      = data.productDescription || "";

      let resolvedSubCats = productSubTypeOptions;
      if (productTypeIdStr && resolvedSubCats.length === 0) {
        resolvedSubCats = await fetchSubTypes(productTypeIdStr);
      }

      setForm({
        productName:          data.productName || "",
        productTypeId:        productTypeIdStr,
        productSubTypeId:     productSubTypeIdStr,
        brandName:            brandNameValue,
        variantName:          variantNameValue,
        gender:               genderValue,
        activeIngredients:    activeIngredientsValue,
        netQuantity:          netQuantityValue,
        netQuantityUnitId:    netQuantityUnitIdStr,
        productFormId:        productFormIdStr,
        productClaims:        productClaimsValue,
        warningsPrecautions:  warningsValue,
        productDescription:   descriptionValue,
        storageConditionId:   storageCondIdStr,
        manufacturerName:     data.manufacturerName ?? attribute.manufacturerName ?? "",
        countryOfOriginId:    countryIdStr,
        packTypeId:           packIdStr,
        unitsPerPack:         String(packaging.unitPerPack || packaging.unitPerPackType || ""),
        numberOfPacks:        String(packaging.numberOfPacks || ""),
        packSize:             String(packaging.packSize || ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity || ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity || ""),
        batchNumber:          pricing.batchLotNumber ?? pricing.batchNumber ?? "",
        manufacturingDate:    mfgDate,
        expiryDate:           expDate,
        stockQuantity:        String(pricing.stockQuantity || ""),
        dateOfStockEntry:     pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
        sellingPrice:         String(pricing.sellingPrice || ""),
        mrp:                  String(pricing.mrp || ""),
        discountPercentage:   String(pricing.discountPercentage || ""),
        gstPercentage:        gstVal,
        hsnCode:              String(pricing.hsnCode || ""),
        finalPrice:           String(pricing.finalPrice || ""),
        shelfLifeMonths:      String(computeShelfLife(mfgDate, expDate) ?? ""),
        // ✅ Load additionalDiscount directly — same shape as DrugForm
        additionalDiscount:   Array.isArray(pricing.additionalDiscounts) ? pricing.additionalDiscounts : [],
      });

      let rawIntended: unknown[] = [];
      let rawSkin: unknown[]     = [];
      let rawHair: unknown[]     = [];

      if (Array.isArray(attribute.intendedUseAreaIds))  rawIntended = attribute.intendedUseAreaIds;
      else if (Array.isArray(attribute.useAreaId))      rawIntended = attribute.useAreaId;
      else if (Array.isArray(attribute.intendedarea))   rawIntended = attribute.intendedarea;
      else if (Array.isArray(attribute.intendedUseAreas)) rawIntended = attribute.intendedUseAreas;

      if (Array.isArray(attribute.skinTypeIds))   rawSkin = attribute.skinTypeIds;
      else if (Array.isArray(attribute.skintypeId)) rawSkin = attribute.skintypeId;
      else if (Array.isArray(attribute.skinType))  rawSkin = attribute.skinType;
      else if (Array.isArray(attribute.skinTypes)) rawSkin = attribute.skinTypes;

      if (Array.isArray(attribute.hairTypeIds))   rawHair = attribute.hairTypeIds;
      else if (Array.isArray(attribute.typeId))    rawHair = attribute.typeId;
      else if (Array.isArray(attribute.hairType))  rawHair = attribute.hairType;
      else if (Array.isArray(attribute.hairTypes)) rawHair = attribute.hairTypes;

      const toIdStrings = (arr: unknown[], ...keys: string[]): string[] =>
        arr.map((item) => {
          if (item !== null && typeof item === "object") {
            const o = item as Record<string, unknown>;
            for (const k of keys) if (o[k] != null) return String(o[k]);
            return "";
          }
          return String(item);
        }).filter(Boolean);

      setSelectedAgeGroups(ageGroupIds);
      if (rawIntended.length) setSelectedIntendedUseAreas(toIdStrings(rawIntended, "useAreaId", "areaId", "id"));
      if (rawSkin.length)     setSelectedSkinTypes(toIdStrings(rawSkin, "skintypeId", "skinTypeId", "typeId", "id"));
      if (rawHair.length)     setSelectedHairTypes(toIdStrings(rawHair, "typeId", "hairTypeId", "id"));

      if (data.productImages?.length) {
        setExistingImages(data.productImages.map((img: { productImage: string }) => img.productImage));
      }

      const brochurePath = attribute.brochurePath || attribute.BrochurePath || "";
      if (brochurePath && brochurePath !== "PENDING") {
        setExistingBrochureUrl(brochurePath);
      }

      if (attribute.certificateDocuments?.length) {
        setSelectedCertifications(attribute.certificateDocuments.map((cert: any) => ({
          id:                           String(cert.certificationId),
          label:                        cert.certificationName || `Certificate ${cert.certificationId}`,
          tagCode:                      `Tag ${String(cert.certificationId).padStart(2, "0")}`,
          file:                         null,
          fileName:                     cert.certificateUrl && cert.certificateUrl !== "PENDING"
                                          ? cert.certificateUrl.split("/").pop() || "" : "",
          uploading:                    false,
          isUploaded:                   !!(cert.certificateUrl && cert.certificateUrl !== "PENDING"),
          previewUrl:                   null,
          productCertificateDocumentId: Number(cert.productCertificateDocumentId),
          existingUrl:                  cert.certificateUrl && cert.certificateUrl !== "PENDING"
                                          ? cert.certificateUrl : undefined,
        })));
      }
    } catch (err) {
      console.error("Error fetching cosmetic product:", err);
      setApiError("Failed to load product data. Please refresh and try again.");
    } finally {
      setLoadingProduct(false);
    }
  }, [mode, productId, fetchSubTypes, productSubTypeOptions]);

  // ─── Load all master data ─────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const loadAllMasters = async () => {
      setLoadingProductTypes(true);
      setLoadingSkinTypes(true);
      setLoadingHairTypes(true);
      setLoadingAgeGroups(true);
      setLoadingIntendedUseAreas(true);
      setLoadingStorageConditions(true);
      setLoadingCountries(true);
      setLoadingPackTypes(true);
      setLoadingCertifications(true);
      setLoadingNetQuantityUnits(true);
      setLoadingProductForms(true);

      const [
        productTypesResult,
        skinTypesResult,
        hairTypesResult,
        ageGroupsResult,
        intendedUseAreasResult,
        storageConditionsResult,
        countriesResult,
        packTypesResult,
        certificationsResult,
        netQuantityUnitsResult,
        productFormsResult,
      ] = await Promise.allSettled([
        getCosmeticProductTypes(),
        getCosmeticSkinTypes(),
        getCosmeticHairTypes(),
        getCosmeticAgeGroups(),
        getCosmeticIntendedUseAreas(),
        getStorageConditionsByCategoryId(productCategoryId),
        getCosmeticCountries(),
        getCosmeticPackTypes(productCategoryId),
        getCosmeticCertificationsByCategoryId(productCategoryId),
        getCosmeticNetQuantityUnits(productCategoryId),
        getCosmeticProductForms(),
      ]);

      if (!mounted) return;

      const resolvedProductTypes: SelectOption[] =
        productTypesResult.status === "fulfilled"
          ? (productTypesResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "categoryId", "productTypeId", "id"), label: getMasterStr(i, "categoryName", "productTypeName", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const resolvedSkinTypes: SelectOption[] =
        skinTypesResult.status === "fulfilled"
          ? (skinTypesResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "skinTypeId", "id"), label: getMasterStr(i, "skinTypeName", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const resolvedHairTypes: SelectOption[] =
        hairTypesResult.status === "fulfilled"
          ? (hairTypesResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "hairTypeId", "id"), label: getMasterStr(i, "hairTypeName", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const resolvedAgeGroups: SelectOption[] =
        ageGroupsResult.status === "fulfilled"
          ? (ageGroupsResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "ageGroupId", "id"), label: getMasterStr(i, "ageGroupName", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const resolvedIntendedUseAreas: SelectOption[] =
        intendedUseAreasResult.status === "fulfilled"
          ? (intendedUseAreasResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "useAreaId", "id"), label: getMasterStr(i, "useAreaName", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const resolvedStorageConditions: SelectOption[] =
        storageConditionsResult.status === "fulfilled"
          ? (storageConditionsResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "storageConditionId", "id"), label: getMasterStr(i, "conditionName", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const resolvedCountries: SelectOption[] =
        countriesResult.status === "fulfilled"
          ? (countriesResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "countryId", "id"), label: getMasterStr(i, "countryName", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const resolvedPackTypes: SelectOption[] =
        packTypesResult.status === "fulfilled"
          ? (packTypesResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "packId"), label: getMasterStr(i, "packType") }))
              .filter((o) => o.value)
          : [];

      const resolvedNetQuantityUnits: SelectOption[] =
        netQuantityUnitsResult.status === "fulfilled"
          ? (netQuantityUnitsResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "netQuantityUnitId", "unitId", "id"), label: getMasterStr(i, "unitName", "unit", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const resolvedProductForms: SelectOption[] =
        productFormsResult.status === "fulfilled"
          ? (productFormsResult.value as MasterItem[])
              .map((i) => ({ value: getMasterStr(i, "productFormId", "formId", "id"), label: getMasterStr(i, "productFormName", "formName", "productForm", "name") || "Unknown" }))
              .filter((o) => o.value)
          : [];

      const fallbackCerts: CertificationMasterOption[] = [
        { value: "1", label: "ISO Certification", certificationId: 1, tagCode: "Tag 01" },
        { value: "2", label: "GMP (Good Manufacturing Practice)", certificationId: 2, tagCode: "Tag 02" },
        { value: "3", label: "CDSCO Registration", certificationId: 3, tagCode: "Tag 03" },
        { value: "4", label: "AYUSH License", certificationId: 4, tagCode: "Tag 04" },
        { value: "5", label: "Cruelty-Free Certification", certificationId: 5, tagCode: "Tag 05" },
        { value: "6", label: "Organic Certification", certificationId: 6, tagCode: "Tag 06" },
        { value: "7", label: "Vegan Certification", certificationId: 7, tagCode: "Tag 07" },
        { value: "8", label: "Dermatologically Tested", certificationId: 8, tagCode: "Tag 08" },
      ];

      const resolvedCerts: CertificationMasterOption[] =
        certificationsResult.status === "fulfilled"
          ? (certificationsResult.value as MasterItem[])
              .map((item, idx) => ({
                value: getMasterStr(item, "certificationId", "id"),
                label: getMasterStr(item, "certificationName", "name") || "Unknown",
                certificationId: Number(getMasterStr(item, "certificationId", "id") || String(idx + 1)),
                tagCode: `Tag ${String(idx + 1).padStart(2, "0")}`,
              }))
              .filter((o) => o.value)
          : fallbackCerts;

      setProductTypeOptions(resolvedProductTypes);
      setSkinTypeOptions(resolvedSkinTypes);
      setHairTypeOptions(resolvedHairTypes);
      setAgeGroupOptions(resolvedAgeGroups);
      setIntendedUseAreaOptions(resolvedIntendedUseAreas);
      setStorageConditionOptions(resolvedStorageConditions);
      setCountryOptions(resolvedCountries);
      setPackTypeOptions(resolvedPackTypes);
      setCertificationMasterOptions(resolvedCerts.length ? resolvedCerts : fallbackCerts);
      setNetQuantityUnitOptions(resolvedNetQuantityUnits);
      setProductFormOptions(resolvedProductForms);

      setLoadingProductTypes(false);
      setLoadingSkinTypes(false);
      setLoadingHairTypes(false);
      setLoadingAgeGroups(false);
      setLoadingIntendedUseAreas(false);
      setLoadingStorageConditions(false);
      setLoadingCountries(false);
      setLoadingPackTypes(false);
      setLoadingCertifications(false);
      setLoadingNetQuantityUnits(false);
      setLoadingProductForms(false);

      if (mode === "edit" && productId) {
        await fetchProductData(
          resolvedProductTypes,
          resolvedAgeGroups,
          resolvedStorageConditions,
          resolvedCountries,
          resolvedPackTypes,
        );
      }

    };

    loadAllMasters();
    return () => { mounted = false; };
  }, [mode, productId, fetchProductData]);

  useEffect(() => {
    if (!form.productTypeId || mode !== "create") {
      if (!form.productTypeId) setProductSubTypeOptions([]);
      return;
    }
    fetchSubTypes(form.productTypeId);
    setForm((p) => ({ ...p, productSubTypeId: "" }));
  }, [form.productTypeId, mode, fetchSubTypes]);

  useEffect(() => {
    if (!form.productTypeId || productTypeOptions.length === 0) return;
    const label = productTypeOptions.find((o) => o.value === form.productTypeId)?.label || "";
    const rule = getSkinHairRule(label);
    setSkinHairRule(rule);
    if (mode === "create") {
      if (rule.skinType === "hidden") setSelectedSkinTypes([]);
      if (rule.hairType === "hidden") setSelectedHairTypes([]);
    }
  }, [form.productTypeId, productTypeOptions, mode]);

  useEffect(() => {
    const u = parseFloat(form.unitsPerPack), p = parseFloat(form.numberOfPacks);
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0)
      setForm((prev) => ({ ...prev, packSize: (u * p).toString() }));
  }, [form.unitsPerPack, form.numberOfPacks]);

  useEffect(() => {
    const selling = parseFloat(form.sellingPrice);
    const disc    = parseFloat(form.discountPercentage);
    setForm((prev) => ({
      ...prev,
      finalPrice: !isNaN(selling) && selling > 0
        ? (isNaN(disc) ? selling : selling - (selling * disc) / 100).toFixed(2)
        : "0.00",
    }));
  }, [form.sellingPrice, form.discountPercentage]);


  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "activeIngredients" && /[^a-zA-Z0-9\s,.()\-%&'/]/.test(value)) return;

    if (name === "expiryDate") {
      if (!value) {
        setForm((prev) => ({ ...prev, expiryDate: null, shelfLifeMonths: "" }));
        setErrors((prev) => { const n = { ...prev }; delete n.expiryDate; return n; });
      } else {
        const [year, month] = value.split("-").map(Number);
        const date = new Date(year, month - 1, 1);
        const today = new Date();
        const minFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 1);
        if (date < minFromNow) {
          setErrors((p) => ({ ...p, expiryDate: "Expiry date must be at least 3 months from current month" }));
          setForm((prev) => ({ ...prev, expiryDate: date, shelfLifeMonths: "" }));
          return;
        }
        if (form.manufacturingDate) {
          const mfg = form.manufacturingDate;
          const minDate = new Date(mfg.getFullYear(), mfg.getMonth() + 3, 1);
          const totalMonths = (date.getFullYear() - mfg.getFullYear()) * 12 + (date.getMonth() - mfg.getMonth());
          if (date < minDate) {
            setErrors((p) => ({ ...p, expiryDate: "Expiry must be at least 3 months after Manufacturing Date" }));
            setForm((prev) => ({ ...prev, expiryDate: date, shelfLifeMonths: "" }));
          } else if (totalMonths < 0) {
            setErrors((p) => ({ ...p, expiryDate: "Expiry cannot be before Manufacturing Date" }));
            setForm((prev) => ({ ...prev, expiryDate: date, shelfLifeMonths: "" }));
          } else if (totalMonths > 60) {
            setErrors((p) => ({ ...p, expiryDate: "Shelf life cannot exceed 5 years (60 months)" }));
            setForm((prev) => ({ ...prev, expiryDate: date, shelfLifeMonths: "" }));
          } else {
            setErrors((p) => { const n = { ...p }; delete n.expiryDate; return n; });
            setForm((prev) => ({ ...prev, expiryDate: date, shelfLifeMonths: totalMonths.toString() }));
          }
        } else {
          setForm((prev) => ({ ...prev, expiryDate: date, shelfLifeMonths: "" }));
        }
      }
      return;
    }

    const numericOnlyFields = [
      "stockQuantity", "sellingPrice", "mrp", "discountPercentage",
      "hsnCode", "unitsPerPack", "numberOfPacks",
      "minimumOrderQuantity", "maximumOrderQuantity", "netQuantity",
    ];
    if (numericOnlyFields.includes(name)) {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      if (value.startsWith("-")) return;
    }
    const maxLengths: Record<string, number> = {
      productName: 150, brandName: 60, variantName: 60,
      manufacturerName: 100, productDescription: 1000, batchNumber: 20,
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
      if (isNaN(v) || v < 0 || v > 100)
        setErrors((p) => ({ ...p, discountPercentage: "Discount must be between 0 and 100" }));
      else
        setErrors((p) => { const n = { ...p }; delete n.discountPercentage; return n; });
    }
  };

  const handleDropdownChange = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleCertFileSelect = (certId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("Certificate file size must be less than 5 MB"); return; }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) { alert("Only PDF, JPG, PNG, SVG files are allowed"); return; }
    setSelectedCertifications((prev) =>
      prev.map((c) =>
        c.id === certId
          ? { ...c, file, fileName: file.name, uploading: false, isUploaded: true,
              previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
              existingUrl: undefined }
          : c,
      ),
    );
    if (errors.certifications) setErrors((p) => { const n = { ...p }; delete n.certifications; return n; });
  };

  const handleCertRemove = (certId: string) =>
    setSelectedCertifications((prev) =>
      prev.map((c) =>
        c.id === certId ? { ...c, file: null, fileName: "", isUploaded: false, existingUrl: undefined } : c,
      ),
    );

  const handleImageFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
    const maxSizeBytes = 5 * 1024 * 1024;
    if (fileArr.find((f) => !allowedFormats.includes(f.type))) {
      setErrors((p) => ({ ...p, images: "Unsupported image format. Only JPG, JPEG, PNG, SVG are allowed." })); return;
    }
    if (fileArr.find((f) => f.size > maxSizeBytes)) {
      setErrors((p) => ({ ...p, images: "Image file size exceeds the 5 MB limit." })); return;
    }
    if (images.length + fileArr.length > 5) {
      setErrors((p) => ({ ...p, images: "Maximum 5 images allowed" })); return;
    }
    setImages((p) => [...p, ...fileArr]);
    setErrors((p) => { const n = { ...p }; delete n.images; return n; });
  };

  // ─── Validation ───────────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

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

    if (skinHairRule.skinType === "mandatory" && selectedSkinTypes.length === 0)
      e.skinTypes = "Skin type is required for this product type";
    if (skinHairRule.hairType === "mandatory" && selectedHairTypes.length === 0)
      e.hairTypes = "Hair type is required for Hair Care products";

    if (!form.activeIngredients.trim()) e.activeIngredients = "Active ingredients are required";

    if (!form.netQuantity.trim()) e.netQuantity = "Net quantity is required";
    else if (form.netQuantity.length > 10) e.netQuantity = "Net quantity must not exceed 10 characters";
    else if (isNaN(Number(form.netQuantity)) || Number(form.netQuantity) <= 0)
      e.netQuantity = "Net quantity must be a positive number";
    if (!form.netQuantityUnitId) e.netQuantityUnitId = "Unit is required";
    if (!form.productFormId) e.productFormId = "Product form is required";

    if (selectedAgeGroups.length === 0) e.ageGroupId = "At least one age group is required";
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

    if (mode === "create" && !form.packTypeId) e.packTypeId = "Pack type is required";

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

    if (mode === "create") {
      const bNum = form.batchNumber.trim();
      if (!bNum) e.batchNumber = "Batch number is required";
      else if (!/^[a-zA-Z0-9]+$/.test(bNum)) e.batchNumber = "Batch number must be alphanumeric only";
      else if (bNum.length < 3) e.batchNumber = "Batch number must be at least 3 characters";
      else if (bNum.length > 20) e.batchNumber = "Batch number must not exceed 20 characters";

      if (!form.manufacturingDate) e.manufacturingDate = "Manufacturing date is required";
      else {
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (form.manufacturingDate > currentMonth)
          e.manufacturingDate = "Manufacturing date cannot be in the future month";
      }

      if (!form.expiryDate) e.expiryDate = "Expiry date is required";
      else {
        const today = new Date();
        const minFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 1);
        if (form.expiryDate < minFromNow)
          e.expiryDate = "Expiry date must be at least 3 months from current month";
        else if (form.manufacturingDate) {
          const minExpiry = new Date(form.manufacturingDate.getFullYear(), form.manufacturingDate.getMonth() + 3, 1);
          if (form.expiryDate < minExpiry)
            e.expiryDate = "Expiry must be at least 3 months after Manufacturing Date";
          else {
            const totalMonths = (form.expiryDate.getFullYear() - form.manufacturingDate.getFullYear()) * 12 + (form.expiryDate.getMonth() - form.manufacturingDate.getMonth());
            if (totalMonths > 60) e.expiryDate = "Shelf life cannot exceed 5 years (60 months)";
          }
        }
      }

      const stock = parseFloat(form.stockQuantity);
      if (!form.stockQuantity.trim()) e.stockQuantity = "Stock quantity is required";
      else if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be greater than 0";
      else if (!isNaN(minQ) && minQ > 0 && stock <= minQ) e.stockQuantity = "Stock quantity must be greater than minimum order quantity";
    }

    const selling = parseFloat(form.sellingPrice);
    if (!form.sellingPrice.trim()) e.sellingPrice = "Selling price is required";
    else if (isNaN(selling) || selling <= 0) e.sellingPrice = "Selling price must be greater than 0";

    const mrp = parseFloat(form.mrp);
    if (!form.mrp.trim()) e.mrp = "MRP is required";
    else if (isNaN(mrp) || mrp <= 0) e.mrp = "MRP must be greater than 0";
    else if (!isNaN(selling) && mrp < selling) e.mrp = "MRP must be ≥ selling price";

    if (form.discountPercentage.trim() !== "") {
      const disc = parseFloat(form.discountPercentage);
      if (isNaN(disc) || disc < 0 || disc > 100)
        e.discountPercentage = "Discount percentage must be between 0 and 100";
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
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" });
        if (ref instanceof HTMLInputElement || ref instanceof HTMLTextAreaElement) ref.focus();
        return;
      }
      const el = document.querySelector<HTMLElement>(`[name="${key}"], [data-field="${key}"]`);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus?.(); return; }
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => scrollToFirstError(validationErrors), 50);
      return;
    }

    setErrors({});
    setApiError(null);

    const certsToUpload = selectedCertifications.filter((c) => c.file && !c.existingUrl);
    const hasBrochureUpload = !!brochureFile;
    const hasImageUpload = images.length > 0;

    setSubmitting(true);

    const payload = {
      productName:          form.productName,
      warningsPrecautions:  form.warningsPrecautions,
      productDescription:   form.productDescription,
      manufacturerName:     form.manufacturerName,
      categoryId:           productCategoryId,

      packagingDetails: [{
        ...(packagingId ? { packagingId } : {}),
        packId:               Number(form.packTypeId),
        unitPerPack:          Number(form.unitsPerPack),
        numberOfPacks:        Number(form.numberOfPacks),
        packSize:             Number(form.packSize),
        minimumOrderQuantity: Number(form.minimumOrderQuantity),
        maximumOrderQuantity: Number(form.maximumOrderQuantity),
      }],

      pricingDetails: [{
        ...(pricingId ? { pricingId } : {}),
        batchLotNumber:     form.batchNumber,
        manufacturingDate:  toLocalDateTimeString(form.manufacturingDate),
        expiryDate:         toLocalDateTimeString(form.expiryDate),
        shelfLifeMonths: Number(form.shelfLifeMonths),
        stockQuantity:      Number(form.stockQuantity),
        dateOfStockEntry:   toLocalDateTimeString(form.dateOfStockEntry),
        sellingPrice:       Number(form.sellingPrice),
        mrp:                Number(form.mrp),
        discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : 0,
        gstPercentage:      Number(form.gstPercentage),
        finalPrice:         Number(form.finalPrice),
        hsnCode:            Number(form.hsnCode),
        // ✅ Map additionalDiscount exactly as DrugForm does
        additionalDiscounts: form.additionalDiscount.map((d) => ({
          minimumPurchaseQuantity:      d.minimumPurchaseQuantity,
          additionalDiscountPercentage: d.additionalDiscountPercentage,
          effectiveStartDate:           d.effectiveStartDate,
          effectiveStartTime:           d.effectiveStartTime,
          effectiveEndDate:             d.effectiveEndDate,
          effectiveEndTime:             d.effectiveEndTime,
        })),
      }],

      productAttributeCosmeticAndPersonalUse: [{
        ...(productAttributeId ? { productAttributeId } : {}),
        productCategoryId:    Number(form.productTypeId),
        productSubcategoryId: Number(form.productSubTypeId),
        brandName:            form.brandName,
        VariantName:          form.variantName || null,
        Gender:               form.gender,
        useAreaId:            selectedIntendedUseAreas.map(Number),
        skintypeId:           skinHairRule.skinType !== "hidden" ? selectedSkinTypes.map(Number) : [],
        typeId:           skinHairRule.hairType !== "hidden" ? selectedHairTypes.map(Number) : [],
        ActiveIngredients:    form.activeIngredients,
        NetQuantityStrength:  Number(form.netQuantity),
        unitId:               Number(form.netQuantityUnitId),
        formId:               Number(form.productFormId),
        ageGroupId:           selectedAgeGroups.length > 0 ? Number(selectedAgeGroups[0]) : 0,
        ageGroupIds:          selectedAgeGroups.map(Number),
        ProductClaims:        form.productClaims,
        WarningsPrecautions:  form.warningsPrecautions,
        storageConditionId:   Number(form.storageConditionId),
        countryId:            Number(form.countryOfOriginId),
        manufacturerName:     form.manufacturerName,
        brochureType:         "PDF",
        brochurePath:         existingBrochureUrl || "PENDING",
        brochurePathStatus:   existingBrochureUrl || brochureFile ? "TO_UPLOAD" : "PENDING",
        certificateDocuments: selectedCertifications.map((c) => ({
          certificationId: Number(c.id),
          certificateUrl:  c.existingUrl || "PENDING",
        })),
      }],

      productImages: images.map(() => ({ productImage: "PENDING" })),
    };

    // ── EDIT MODE ──────────────────────────────────────────────────────────────
    if (mode === "edit") {
      const currentProductId  = resolvedProductId || productId || "";
      const currentAttributeId = productAttributeId;

      try {
        await updateProduct(currentProductId, payload as never);

        if (hasImageUpload) {
          await uploadProductImages(currentProductId, images);
        }

        if (currentAttributeId) {
          for (const cert of certsToUpload) {
            const result = await uploadCosmeticCertificate(currentAttributeId, cert.productCertificateDocumentId, cert.file!);
            if (!result.success) {
              throw new Error(`Failed to upload certificate "${cert.label}": ${result.message}`);
            }
          }

          if (hasBrochureUpload) {
            const result = await uploadCosmeticBrochure(currentAttributeId, brochureFile!);
            if (!result.success) {
              throw new Error(`Failed to upload brochure: ${result.message}`);
            }
          }
        }

        setSubmitting(false);
        if (onSubmitSuccess) onSubmitSuccess();
        else router.push(`/seller_7a3b9f2c/products/view/${currentProductId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("Edit submit error:", err);
        setApiError(`Failed to update product: ${msg}`);
        setSubmitting(false);
      }
      return;
    }

    // ── CREATE MODE ────────────────────────────────────────────────────────────
    let createdProductId  = "";
    let createdAttributeId = "";

    const rollback = async () => {
      if (!createdProductId) return;
      try {
        await deleteProduct(createdProductId);
      } catch (rollbackErr) {
        console.error(`[CosmeticForm] Rollback failed for product ${createdProductId}:`, rollbackErr);
      }
    };

    try {
      const createData: ApiResponseData = await createCosmeticProduct(payload as Record<string, unknown>);

      const dataInner = (createData?.data ?? createData) as ApiResponseData;
      createdProductId = String(dataInner?.productId ?? "").trim();

      if (!createdProductId || createdProductId === "undefined") {
        throw new Error("Server did not return a product ID. The product was not created.");
      }

      createdAttributeId = extractProductAttributeId(createData) || "";

      if (!createdAttributeId) {
        try {
          const fetchedProduct = await getProductById(createdProductId) as ApiResponseData;
          createdAttributeId = extractAttributeIdFromProduct(fetchedProduct);
        } catch (fetchErr) {
          console.warn("[CosmeticForm] Could not fetch product after create:", fetchErr);
        }
      }

      if (!createdAttributeId) {
        await rollback();
        throw new Error("The product attribute data was not saved by the server.");
      }

      setResolvedProductId(createdProductId);
      setProductAttributeId(createdAttributeId);

      let certDocMap = extractCertDocumentIdMap(createData);
      if (certDocMap.size === 0 && createdProductId) {
        try {
          const fetchedProduct = await getProductById(createdProductId) as ApiResponseData;
          certDocMap = extractCertDocumentIdMapFromProduct(fetchedProduct);
        } catch { /* ignore */ }
      }

      if (hasImageUpload) {
        try {
          await uploadProductImages(createdProductId, images);
        } catch (imgErr) {
          await rollback();
          throw new Error(`Image upload failed: ${imgErr instanceof Error ? imgErr.message : "unknown error"}`);
        }
      }

      for (const cert of certsToUpload) {
        const certIdNum = Number(cert.id);
        const docId = certDocMap.get(certIdNum) ?? cert.productCertificateDocumentId;
        try {
          const result = await uploadCosmeticCertificate(createdAttributeId, docId, cert.file!);
          if (!result.success) throw new Error(result.message);
        } catch (certErr) {
          await rollback();
          throw new Error(`Certificate upload failed for "${cert.label}"`);
        }
      }

      if (hasBrochureUpload) {
        try {
          const result = await uploadCosmeticBrochure(createdAttributeId, brochureFile!);
          if (!result.success) throw new Error(result.message);
        } catch {
          await rollback();
          throw new Error(`Brochure upload failed`);
        }
      }

      setSubmitting(false);
      setShowSuccessModal(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      console.error("[CosmeticForm] Submit error:", err);
      setApiError(msg);
      setSubmitting(false);
    }
  };

  // ─── Loading guard ─────────────────────────────────────────────────────────────
  if (mode === "edit" && loadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEdit = mode === "edit";
  const hasStock = isEdit && Number(form.stockQuantity) > 0;

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <>

      <PopupModal
        isOpen={showSuccessModal}
        title="Product Saved Successfully!"
        description="Your cosmetic product has been saved and is now live on the platform"
        primaryActionText="View Product"
        secondaryActionText="Continue Adding"
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={() => { router.push(`/seller_7a3b9f2c/products/view/${resolvedProductId}`); }}
        onSecondaryAction={() => { setShowSuccessModal(false); router.push("/seller_7a3b9f2c/products/add"); }}
        onTertiaryAction={() => { router.push("/seller_7a3b9f2c/dashboard"); }}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* ✅ Additional Discount Modal — identical pattern to DrugForm */}
      {showAdditionalDiscount && (
        <CommonModal
          onClose={() => setShowAdditionalDiscount(false)}
          width="w-[600px]"
        >
          <div className="h-[80vh] overflow-y-auto flex flex-col p-6">
            <AdditionalDiscountType
              onClose={() => setShowAdditionalDiscount(false)}
              categoryId={productCategoryId}
              initialData={form.additionalDiscount}
              baseDiscountPercentage={Number(form.discountPercentage) || 0}
              baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
              onSaveAdditionalDiscount={(data) =>
                setForm((prev) => ({
                  ...prev,
                  additionalDiscount: data,
                }))
              }
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

        {/* Section 1: Product Details */}
        <div className="relative border border-neutral-200 rounded-xl p-6 bg-white">
          <div className="text-h4 font-semibold">Product Details</div>
          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div data-field="productName">
              <Input label="Product Name" name="productName"
                placeholder="e.g., Hydrating Face Serum"
                value={form.productName} onChange={handleChange}
                error={errors.productName} required readOnly={isEdit} />
            </div>

            <div data-field="brandName">
              <Input label="Brand Name" name="brandName"
                placeholder="e.g., Lakme, Neutrogena, Mamaearth"
                value={form.brandName} onChange={handleChange}
                error={errors.brandName} required readOnly={isEdit} />
            </div>

            <div data-field="productTypeId">
              <Dropdown
                label="Product Type"
                options={productTypeOptions}
                value={form.productTypeId}
                onChange={(value) => handleDropdownChange("productTypeId", value)}
                isLoading={loadingProductTypes}
                isDisabled={isEdit}
                placeholder={loadingProductTypes ? "Loading..." : "Select product type"}
                error={errors.productTypeId}
                required
              />
            </div>

            <div data-field="productSubTypeId">
              <Dropdown
                label="Product Sub-Type"
                options={productSubTypeOptions}
                value={form.productSubTypeId}
                onChange={(value) => handleDropdownChange("productSubTypeId", value)}
                isLoading={loadingSubTypes}
                isDisabled={isEdit || !form.productTypeId}
                placeholder={form.productTypeId ? (loadingSubTypes ? "Loading..." : "Select sub-type") : "Select product type first"}
                error={errors.productSubTypeId}
                required
              />
            </div>

            <div data-field="variantName">
              <Input label="Variant Name" name="variantName" placeholder="e.g., Aloe Vera, Rose, Charcoal (optional)"
                value={form.variantName} onChange={handleChange} />
            </div>

            <div data-field="gender">
              <Dropdown
                label="Gender"
                options={genderOptions}
                value={form.gender}
                onChange={(value) => handleDropdownChange("gender", value)}
                isDisabled={isEdit}
                placeholder="Select gender"
                error={errors.gender}
                required
              />
            </div>

            <div ref={setFieldRef("intendedUseAreas") as React.RefCallback<HTMLDivElement>} data-field="intendedUseAreas">
              <CheckboxDropdown
                label="Intended Use Area"
                required
                options={intendedUseAreaOptions}
                selectedValues={selectedIntendedUseAreas}
                onChange={(vals) => {
                  setSelectedIntendedUseAreas(vals);
                  if (errors.intendedUseAreas) setErrors((p) => { const n = { ...p }; delete n.intendedUseAreas; return n; });
                }}
                placeholder="Select intended use area(s)"
                error={errors.intendedUseAreas}
                disabled={loadingIntendedUseAreas}
              />
            </div>

            <div data-field="productFormId">
              <Dropdown
                label="Product Form"
                options={productFormOptions}
                value={form.productFormId}
                onChange={(value) => handleDropdownChange("productFormId", value)}
                isLoading={loadingProductForms}
                isDisabled={isEdit}
                placeholder={loadingProductForms ? "Loading..." : "Eg, Gel, Powder"}
                error={errors.productFormId}
                required
              />
            </div>

            <div data-field="netQuantity">
              <NumericInputWithUnit
                label="Net Quantity"
                name="netQuantity"
                value={form.netQuantity}
                unitId={form.netQuantityUnitId}
                onValueChange={(val) => {
                  setForm((p) => ({ ...p, netQuantity: val }));
                  if (errors.netQuantity) setErrors((p) => { const n = { ...p }; delete n.netQuantity; return n; });
                }}
                onUnitChange={(unitId) => { handleDropdownChange("netQuantityUnitId", unitId); }}
                placeholder="e.g., 100"
                error={errors.netQuantity || errors.netQuantityUnitId}
                options={netQuantityUnitOptions}
                loading={loadingNetQuantityUnits}
                required
                readOnly={isEdit}
              />
            </div>

            {skinHairRule.skinType !== "hidden" && (
              <div ref={setFieldRef("skinTypes") as React.RefCallback<HTMLDivElement>} data-field="skinTypes">
                <CheckboxDropdown
                  label={skinHairRule.skinType === "mandatory" ? "Skin Type" : "Skin Type (optional)"}
                  required={skinHairRule.skinType === "mandatory"}
                  options={skinTypeOptions}
                  selectedValues={selectedSkinTypes}
                  onChange={(vals) => {
                    setSelectedSkinTypes(vals);
                    if (errors.skinTypes) setErrors((p) => { const n = { ...p }; delete n.skinTypes; return n; });
                  }}
                  placeholder="Select skin type(s)"
                  error={errors.skinTypes}
                  disabled={isEdit || loadingSkinTypes}
                />
              </div>
            )}

            {skinHairRule.hairType !== "hidden" && (
              <div ref={setFieldRef("hairTypes") as React.RefCallback<HTMLDivElement>} data-field="hairTypes">
                <CheckboxDropdown
                  label={skinHairRule.hairType === "mandatory" ? "Hair Type" : "Hair Type (optional)"}
                  required={skinHairRule.hairType === "mandatory"}
                  options={hairTypeOptions}
                  selectedValues={selectedHairTypes}
                  onChange={(vals) => {
                    setSelectedHairTypes(vals);
                    if (errors.hairTypes) setErrors((p) => { const n = { ...p }; delete n.hairTypes; return n; });
                  }}
                  placeholder="Select hair type(s)"
                  error={errors.hairTypes}
                  disabled={isEdit || loadingHairTypes}
                />
              </div>
            )}

            <div ref={setFieldRef("ageGroupId") as React.RefCallback<HTMLDivElement>} data-field="ageGroupId">
              <CheckboxDropdown
                label="Age Group"
                required
                options={ageGroupOptions}
                selectedValues={selectedAgeGroups}
                onChange={(vals) => {
                  setSelectedAgeGroups(vals);
                  if (errors.ageGroupId) setErrors((p) => { const n = { ...p }; delete n.ageGroupId; return n; });
                }}
                placeholder="Select age group(s)"
                error={errors.ageGroupId}
                disabled={isEdit || loadingAgeGroups}
              />
            </div>

            <div data-field="countryOfOriginId">
              <Dropdown
                label="Country of Origin"
                options={countryOptions}
                value={form.countryOfOriginId}
                onChange={(value) => handleDropdownChange("countryOfOriginId", value)}
                isLoading={loadingCountries}
                isDisabled={isEdit}
                placeholder={loadingCountries ? "Loading..." : "Select country"}
                error={errors.countryOfOriginId}
                required
              />
            </div>

            <div data-field="manufacturerName">
              <Input label="Manufacturer Name" name="manufacturerName" placeholder="Manufacturer company name"
                value={form.manufacturerName} onChange={handleChange}
                error={errors.manufacturerName} required readOnly={isEdit} />
            </div>

            <div data-field="storageConditionId">
              <Dropdown
                label="Storage Condition"
                options={storageConditionOptions}
                value={form.storageConditionId}
                onChange={(value) => handleDropdownChange("storageConditionId", value)}
                isLoading={loadingStorageConditions}
                isDisabled={hasStock}
                placeholder={loadingStorageConditions ? "Loading..." : "Select storage condition"}
                error={errors.storageConditionId}
                required
              />
            </div>

            <div className="flex flex-col gap-0" ref={setFieldRef("certifications") as React.RefCallback<HTMLDivElement>} data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
              <CheckboxDropdown
                options={certificationMasterOptions}
                selectedValues={selectedCertifications.map((c) => c.id)}
                disabled={loadingCertifications}
                onChange={(newValues) => {
                  setSelectedCertifications((prev) => {
                    return newValues.reduce<CertificationTag[]>((acc, val) => {
                      const existing = prev.find((c) => c.id === val);
                      if (existing) return [...acc, existing];
                      const master = certificationMasterOptions.find((o) => o.value === val);
                      if (!master) return acc;
                      return [...acc, {
                        id: val, label: master.label, tagCode: master.tagCode,
                        productCertificateDocumentId: master.certificationId,
                        file: null, fileName: "", uploading: false, isUploaded: false, previewUrl: null,
                      }];
                    }, []);
                  });
                  if (errors.certifications) setErrors((p) => { const n = { ...p }; delete n.certifications; return n; });
                }}
                placeholder={loadingCertifications ? "Loading..." : "Select certifications"}
                error={errors.certifications ? " " : ""}
              />
              {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
            </div>

            {selectedCertifications.length === 0 ? (
              <div className="flex flex-col gap-0 col-span-1" data-field="certUploadFallback">
                <label className={fieldLabel}>Upload Certifications / Compliance {requiredStar}</label>
                <div className="flex items-center w-full h-[52px] rounded-lg border border-neutral-500 bg-white overflow-hidden">
                  <div className="flex items-center justify-center h-full px-4 bg-secondary-800 rounded-md">
                    <img src="/icons/UploadIcon.svg" className="w-6 h-6" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
                    <span className="text-pneutral-500 text-md">Select certifications first</span>
                  </div>
                </div>
              </div>
            ) : (
              selectedCertifications.map((cert) => (
                <div key={cert.id} className="flex flex-col gap-0 col-span-1">
                  <label className={fieldLabel}>Upload {cert.label} {requiredStar}</label>
                  <UploadInput
                    onFileSelect={(file) => {
                      if (file) handleCertFileSelect(cert.id, file);
                      else handleCertRemove(cert.id);
                    }}
                    existingFile={cert.existingUrl || undefined}
                    label=""
                    placeholder={`Upload the ${cert.label}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              ))
            )}

            <div data-field="brochure">
              <UploadInput onFileSelect={(file) => setBrochureFile(file)} existingFile={existingBrochureUrl || undefined} />
            </div>

            <div className="flex flex-col gap-1" data-field="activeIngredients">
              <label className={fieldLabel}>Active Ingredients {requiredStar}</label>
              <textarea
                ref={setFieldRef("activeIngredients") as React.RefCallback<HTMLTextAreaElement>}
                name="activeIngredients" value={form.activeIngredients} onChange={handleChange} rows={4}
                readOnly={isEdit}
                placeholder="e.g., Vitamin C, Vitamin E, Salicylic Acid, Hyaluronic Acid"
                className={`w-full rounded-[8px] p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none border transition-colors ${isEdit ? "bg-gray-50 cursor-default focus:outline-none border-[#C0C1BE]" : `bg-white focus:outline-none focus:ring-2 focus:ring-[#C4AAFD] ${errors.activeIngredients ? "border-[#FF3B3B]" : "border-[#C0C1BE] focus:border-[#C4AAFD]"}`}`}
              />
              {errors.activeIngredients && <p className={errorMsg}>{errors.activeIngredients}</p>}
            </div>

            <div className="flex flex-col gap-1" data-field="productClaims">
              <label className={fieldLabel}>Product Claims {requiredStar}</label>
              <textarea
                ref={setFieldRef("productClaims") as React.RefCallback<HTMLTextAreaElement>}
                name="productClaims" value={form.productClaims} onChange={handleChange} rows={4}
                placeholder={`e.g., "Paraben Free", "Dermatologically Tested", "Clinically Proven"`}
                className={`w-full rounded-[8px] p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-[#C4AAFD] transition-colors ${errors.productClaims ? "border-[#FF3B3B]" : "border-[#C0C1BE] focus:border-[#C4AAFD]"}`}
              />
              {errors.productClaims && <p className={errorMsg}>{errors.productClaims}</p>}
            </div>

            <div className="flex flex-col gap-1" data-field="warningsPrecautions">
              <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
              <textarea
                ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
                name="warningsPrecautions" value={form.warningsPrecautions} onChange={handleChange} rows={4}
                placeholder="e.g., For external use only. Avoid contact with eyes. Keep out of reach of children."
                className={`w-full rounded-[8px] p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-[#C4AAFD] transition-colors ${errors.warningsPrecautions ? "border-[#FF3B3B]" : "border-[#C0C1BE] focus:border-[#C4AAFD]"}`}
              />
              {errors.warningsPrecautions && <p className={errorMsg}>{errors.warningsPrecautions}</p>}
            </div>

            <div className="col-span-2 flex flex-col gap-1" data-field="productDescription">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea
                ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                name="productDescription" value={form.productDescription} onChange={handleChange}
                rows={4} maxLength={1000}
                placeholder="Detailed product description (max 1000 characters)"
                className={`w-full rounded-[8px] p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-[#C4AAFD] transition-colors ${errors.productDescription ? "border-[#FF3B3B]" : "border-[#C0C1BE] focus:border-[#C4AAFD]"}`}
              />
              {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Packaging & Order Details */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6 bg-white">
          <div className="text-h4 font-semibold">Packaging &amp; Order Details</div>
          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div data-field="packTypeId">
              <Dropdown
                label="Pack Type"
                options={packTypeOptions}
                value={form.packTypeId}
                onChange={(value) => handleDropdownChange("packTypeId", value)}
                isLoading={loadingPackTypes}
                isDisabled={hasStock}
                placeholder={loadingPackTypes ? "Loading..." : "Select pack type"}
                error={errors.packTypeId}
                required
              />
            </div>

            <Input label="Number of Units per Pack Type" name="unitsPerPack" placeholder="e.g., 1"
              value={form.unitsPerPack} onChange={handleChange} error={errors.unitsPerPack}
              required readOnly={hasStock} />

            <Input label="Number of Packs" name="numberOfPacks" placeholder="e.g., 1"
              value={form.numberOfPacks} onChange={handleChange} error={errors.numberOfPacks}
              required readOnly={hasStock} />

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Pack Size (No. of Units per Pack Type × No. of Packs)</label>
              <input name="packSize" value={form.packSize} readOnly
                className="w-full h-[52px] px-4 border border-[#C0C1BE] rounded-[8px] text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed" />
            </div>
          </div>

          <div className="text-h6 font-normal col-span-2 mt-5">Order Details</div>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Input label="Min Order Qty (in terms of Pack Size)" name="minimumOrderQuantity" placeholder="e.g., 1"
              value={form.minimumOrderQuantity} onChange={handleChange} error={errors.minimumOrderQuantity} required />
            <Input label="Max Order Qty (in terms of Pack Size)" name="maximumOrderQuantity" placeholder="e.g., 100"
              value={form.maximumOrderQuantity} onChange={handleChange} error={errors.maximumOrderQuantity} required />
          </div>

          <div className="text-h6 font-normal col-span-2 mt-5">Batch, Stock &amp; Expiry</div>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div data-field="batchNumber">
              <Input label="Batch Number" name="batchNumber" placeholder="Alphanumeric only, e.g., BAT2024001"
                value={form.batchNumber} onChange={handleChange} error={errors.batchNumber}
                required readOnly={isEdit} />
            </div>

            <Input
              label="Manufacturing Date"
              type="month"
              name="manufacturingDate"
              id="manufacturingDate"
              readOnly={isEdit}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                const [year, month] = value.split("-").map(Number);
                const date = new Date(year, month - 1, 1);
                const today = new Date();
                const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                if (date > currentMonth) {
                  setErrors((prev) => ({ ...prev, manufacturingDate: "Manufacturing date cannot be in the future month" }));
                  return;
                }
                setErrors((prev) => ({ ...prev, manufacturingDate: "", expiryDate: "" }));
                setForm({ ...form, manufacturingDate: date, expiryDate: null, shelfLifeMonths: "" });
              }}
              value={
                form.manufacturingDate instanceof Date && !isNaN(form.manufacturingDate.getTime())
                  ? `${form.manufacturingDate.getFullYear()}-${String(form.manufacturingDate.getMonth() + 1).padStart(2, "0")}`
                  : ""
              }
              error={errors.manufacturingDate}
              required
            />

            <Input
              label="Expiry Date"
              type="month"
              name="expiryDate"
              value={
                form.expiryDate instanceof Date && !isNaN(form.expiryDate.getTime())
                  ? `${form.expiryDate.getFullYear()}-${String(form.expiryDate.getMonth() + 1).padStart(2, "0")}`
                  : ""
              }
              readOnly={isEdit}
              onChange={handleChange}
              min={getMinExpiryMonth()}
              max={getMaxExpiryMonth()}
              error={errors.expiryDate}
              required
            />

            <Input
              type="number"
              label="Shelf Life (In Months)"
              name="shelfLifeMonths"
              value={form.shelfLifeMonths}
              readOnly
            />

            <div data-field="stockQuantity">
              <Input label="Stock Quantity (in terms of Pack Size)" name="stockQuantity" placeholder="e.g., 100"
                value={form.stockQuantity} onChange={handleChange} error={errors.stockQuantity}
                required readOnly={isEdit} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Date of Stock Entry {requiredStar}</label>
              <input type="date" value={todayStr} readOnly
                className="w-full h-[52px] px-4 border border-[#C0C1BE] rounded-[8px] text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed" />
            </div>
          </div>

          <div className="text-h6 font-normal mt-5">Pricing</div>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Input label="MRP (per Pack Size)" name="mrp" placeholder="e.g., 599"
              value={form.mrp} onChange={handleChange} error={errors.mrp} required />

            <Input label="Selling Price (per Pack Size)" name="sellingPrice" placeholder="e.g., 499"
              value={form.sellingPrice} onChange={handleChange} error={errors.sellingPrice} required />

            {/* ✅ Discount + Add Special Discount button — identical layout to DrugForm */}
            <div className="col-span-2 flex items-end gap-4">
              <div className="w-1/2">
                <Input
                  label="Discount Percentage"
                  name="discountPercentage"
                  placeholder="0–100"
                  value={form.discountPercentage}
                  onChange={handleChange}
                  error={errors.discountPercentage}
                />
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdditionalDiscount(true)}
                  className="w-[237px] h-[52px] px-6 border-[2px] border-[#7D32FC] text-[#9659FD] text-sm font-semibold rounded-lg flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 4V16M4 10H16" stroke="#9659FD" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Add Special Discount
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Final Price (Auto-calculated)</label>
              <input name="finalPrice" value={form.finalPrice} readOnly
                className="w-full h-[52px] px-4 border border-[#C0C1BE] rounded-[8px] text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed" />
            </div>
          </div>

          <div className="text-h6 font-normal mt-5">Tax &amp; Billing</div>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div data-field="gstPercentage">
              <Dropdown
                label="GST %"
                options={gstOptions}
                value={form.gstPercentage}
                onChange={(value) => handleDropdownChange("gstPercentage", value)}
                isDisabled={isEdit}
                placeholder="Select GST %"
                error={errors.gstPercentage}
                required
              />
            </div>

            <div data-field="hsnCode">
              <Input label="HSN Code" name="hsnCode" placeholder="4, 6, or 8 digit numeric code"
                value={form.hsnCode} onChange={handleChange} maxLength={8}
                error={errors.hsnCode} required readOnly={isEdit} />
            </div>
          </div>
        </div>

        {/* ── Section 3: Product Photos ─────────────────────────────────────────── */}
        <div className="relative border border-neutral-200 rounded-xl p-6 bg-white"
          ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>} data-field="images">
          <div className="text-pneutral-700 font-normal text-sm mb-3">
            Product Photos {mode === "create" && <span className="text-warning-500 font-semibold ml-1">*</span>}
          </div>

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

          <div className="bg-neutral-50 h-40 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer border border-dashed border-neutral-300 hover:border-purple-400 hover:bg-purple-50 transition-all"
            onClick={() => document.getElementById("cosmeticFileInput")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files); }}>
            <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 object-contain" />
            <div className="text-sm font-medium text-gray-600 text-center">Choose a file or drag &amp; drop it here</div>
            <div className="text-xs text-gray-400 text-center">PNG, JPG, SVG (max 5MB each)</div>
          </div>

          <input id="cosmeticFileInput" type="file" multiple accept="image/jpeg,image/png,image/jpg,image/svg+xml" className="hidden"
            onChange={(e) => { if (e.target.files) handleImageFiles(e.target.files); }} />

          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={i} className="relative group flex-shrink-0">
                    <img src={url} alt={`Product ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-purple-300 transition" />
                    <button type="button"
                      onClick={() => { URL.revokeObjectURL(url); setImages((p) => p.filter((_, idx) => idx !== i)); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {errors.images && <p className={`${errorMsg} mt-2`}>{errors.images}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 pb-8">
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 border-2 border-warning-500 rounded-xl text-sm font-semibold text-warning-500 hover:bg-orange-50 transition-colors">
              Cancel
            </button>
            <button type="button"
              className="px-5 py-3 bg-secondary-700 text-white text-base font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/icons/SaveDraftIcon.svg" alt="save draft" className="w-5 h-5 object-contain" />
              Save Draft
            </button>
          </div>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="px-8 py-3 bg-primary-800 text-white font-semibold text-base rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </>
  );
};  

export default CosmeticForm;
