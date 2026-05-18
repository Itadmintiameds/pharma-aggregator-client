"use client";

import Input from "@/src/app/commonComponents/Input";
import {
  createCosmeticProduct,
  getCosmeticAgeGroups,
  getCosmeticCertificationsByCategoryId,
  getCosmeticCountries,
  getCosmeticHairTypes,
  getCosmeticIntendedUseAreas,
  getCosmeticPackTypes,
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
import { AlertCircle, FileText, RefreshCw, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Select from "react-select";
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
  if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(trimmed))
    return "HSN code must be 4, 6, or 8 digits";
  return null;
}
function computeShelfLife(mfgDate: Date | null, expDate: Date | null): number | null {
  if (!mfgDate || !expDate) return null;

  const diffMs = expDate.getTime() - mfgDate.getTime();
  if (diffMs <= 0) return null;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Convert total days to months
  const months = Math.floor(days / 30);

  return months;
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

// ─── Style constants ──────────────────────────────────────────────────────────

const fieldLabel   = "text-label-l3 text-neutral-700 font-semibold";
const requiredStar = <span className="text-warning-500 font-semibold ml-1">*</span>;
const errorMsg     = "text-red-500 text-sm mt-1";

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
  { value: "28", label: "28%" },
];

// ─── Multi-checkbox dropdown ───────────────────────────────────────────────────

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
  label, required, options, selected, onChange,
  placeholder = "Select...", errorKey = "", errors = {},
  loading, disabled, fieldRef, dataField,
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

  const displayLabel =
    selected.length > 0
      ? selected.map((v) => options.find((o) => o.value === v)?.label).filter(Boolean).join(", ")
      : placeholder;

  return (
    <div className="flex flex-col gap-1" ref={fieldRef as React.RefObject<HTMLDivElement>} data-field={dataField}>
      <label className={fieldLabel}>{label} {required && requiredStar}</label>
      <div className="relative" ref={ref}>
        <div
          onClick={() => !disabled && setOpen((p) => !p)}
          className={`w-full h-14 px-4 border rounded-2xl flex items-center justify-between transition-all bg-white ${
            disabled ? "cursor-default bg-gray-50" : "cursor-pointer"
          } ${
            errors[errorKey]
              ? "border-[#FF3B3B]"
              : open
                ? "border-[#4B0082]"
                : "border-neutral-500 hover:border-[#4B0082]"
          }`}
        >
          <span
            className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]"
            style={{ color: selected.length > 0 ? "#3C3D3A" : "#A3A3A3" }}
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
          <div className="absolute z-20 w-full bg-white border border-neutral-200 mt-1 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-neutral-500 text-sm">Loading...</div>
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

// ─── Non-editable display fields ──────────────────────────────────────────────

const NonEditableField = ({ label, value, required }: { label: string; value: string; required?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className={fieldLabel}>{label} {required && requiredStar}</label>
    <div className="w-full h-14 px-4 border border-neutral-200 rounded-2xl flex items-center text-base [font-family:'Open_Sans',sans-serif] bg-gray-50" style={{ color: "#5A5B58" }}>
      {value || "—"}
    </div>
  </div>
);

const NonEditableSelect = ({ label, value, required }: { label: string; value: string; required?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className={fieldLabel}>{label} {required && requiredStar}</label>
    <div className="w-full h-14 px-4 border border-neutral-200 rounded-2xl flex items-center text-base [font-family:'Open_Sans',sans-serif] bg-gray-50" style={{ color: "#5A5B58" }}>
      {value || "—"}
    </div>
  </div>
);

// ─── Submit progress overlay ──────────────────────────────────────────────────

interface SubmitStep {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
}

const SubmitProgressOverlay = ({ steps }: { steps: SubmitStep[] }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 flex flex-col gap-4">
      <p className="text-lg font-semibold text-neutral-800">Saving product…</p>
      <div className="flex flex-col gap-3">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center gap-3">
            {step.status === "running" && (
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            {step.status === "done" && (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {step.status === "error" && (
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <X size={10} className="text-white" />
              </div>
            )}
            {step.status === "pending" && (
              <div className="w-5 h-5 rounded-full border-2 border-neutral-300 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                step.status === "running"
                  ? "text-purple-700 font-semibold"
                  : step.status === "done"
                    ? "text-green-700"
                    : step.status === "error"
                      ? "text-red-600 font-semibold"
                      : "text-neutral-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const CosmeticForm = ({ productId, mode = "create", onSubmitSuccess }: CosmeticFormProps) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef = (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const productCategoryId = 4;

  // ─── Loading states ───────────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);
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
    ageGroupId:           "",
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
    // ✅ additionalDiscount stored directly as AdditionalDiscountData[] — same as DrugForm
    additionalDiscount:   [] as AdditionalDiscountData[],
  });

  const [shelfLifeDisplay, setShelfLifeDisplay] = useState<number | null>(null);
  const [resolvedProductId, setResolvedProductId] = useState("");
  const [productAttributeId, setProductAttributeId] = useState("");
  const [packagingId, setPackagingId] = useState("");
  const [pricingId, setPricingId] = useState("");

  // ─── Multi-select fields ──────────────────────────────────────────────────────
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

  // ─── Display labels (edit mode) ───────────────────────────────────────────────
  const [displayLabels, setDisplayLabels] = useState({
    productTypeLabel:     "",
    productSubTypeLabel:  "",
    ageGroupLabel:        "",
    storageConditionLabel:"",
    countryLabel:         "",
    packTypeLabel:        "",
    gstLabel:             "",
    genderLabel:          "",
  });

  // ─── Skin/Hair rule ───────────────────────────────────────────────────────────
  const [skinHairRule, setSkinHairRule] = useState<SkinHairRule>({ skinType: "optional", hairType: "optional" });

  // ─── Submit progress ──────────────────────────────────────────────────────────
  const [submitSteps, setSubmitSteps] = useState<SubmitStep[]>([]);
  const updateStep = (key: string, status: SubmitStep["status"]) =>
    setSubmitSteps((prev) => prev.map((s) => s.key === key ? { ...s, status } : s));

  // ─── Errors / modals ──────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string>("");
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  // ✅ Renamed to match DrugForm's state variable name exactly
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const certDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────────

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
    currentProductTypeOptions: SelectOption[],
    currentAgeGroupOptions: SelectOption[],
    currentStorageConditionOptions: SelectOption[],
    currentCountryOptions: SelectOption[],
    currentPackTypeOptions: SelectOption[],
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
      const ageGroupIdStr       = String(attribute.ageGroupId || "");
      const storageCondIdStr    = String(attribute.storageConditionId || "");
      const countryIdStr        = String(attribute.countryId || "");
      const packIdStr           = String(packaging.packId || "");
      const gstVal              = String(pricing.gstPercentage ?? "");

      const brandNameValue        = attribute.brandName || "";
      const variantNameValue      = attribute.VariantName || attribute.variantName || "";
      const genderValue           = (attribute.Gender || attribute.gender || "").toLowerCase();
      const activeIngredientsValue = attribute.ActiveIngredients || attribute.activeIngredients || "";
      const netQuantityValue      = attribute.NetQuantityStrength || attribute.netQuantityStrength || attribute.netQuantity || "";
      const productClaimsValue    = attribute.ProductClaims || attribute.productClaims || "";
      const warningsValue         = data.warningsPrecautions ?? attribute.WarningsPrecautions ?? attribute.warningsPrecautions ?? "";
      const descriptionValue      = data.productDescription || "";

      let resolvedSubCats = productSubTypeOptions;
      if (productTypeIdStr && resolvedSubCats.length === 0) {
        resolvedSubCats = await fetchSubTypes(productTypeIdStr);
      }

      setDisplayLabels({
        productTypeLabel:      currentProductTypeOptions.find((o) => o.value === productTypeIdStr)?.label || productTypeIdStr,
        productSubTypeLabel:   resolvedSubCats.find((o) => o.value === productSubTypeIdStr)?.label || productSubTypeIdStr,
        ageGroupLabel:         currentAgeGroupOptions.find((o) => o.value === ageGroupIdStr)?.label || ageGroupIdStr,
        storageConditionLabel: currentStorageConditionOptions.find((o) => o.value === storageCondIdStr)?.label || storageCondIdStr,
        countryLabel:          currentCountryOptions.find((o) => o.value === countryIdStr)?.label || countryIdStr,
        packTypeLabel:         currentPackTypeOptions.find((o) => o.value === packIdStr)?.label || packIdStr,
        gstLabel:              gstOptions.find((o) => o.value === gstVal)?.label || (gstVal ? `${gstVal}%` : ""),
        genderLabel:           genderOptions.find((o) => o.value === genderValue)?.label || genderValue,
      });

      setForm({
        productName:          data.productName || "",
        productTypeId:        productTypeIdStr,
        productSubTypeId:     productSubTypeIdStr,
        brandName:            brandNameValue,
        variantName:          variantNameValue,
        gender:               genderValue,
        activeIngredients:    activeIngredientsValue,
        netQuantity:          netQuantityValue,
        ageGroupId:           ageGroupIdStr,
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
        // ✅ Load additionalDiscount directly — same shape as DrugForm
        additionalDiscount:   Array.isArray(pricing.additionalDiscounts) ? pricing.additionalDiscounts : [],
      });

      setShelfLifeDisplay(computeShelfLife(mfgDate, expDate));

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
      else if (Array.isArray(attribute.hairType))  rawHair = attribute.hairType;
      else if (Array.isArray(attribute.hairTypes)) rawHair = attribute.hairTypes;

      if (rawIntended.length) setSelectedIntendedUseAreas(rawIntended.map(String));
      if (rawSkin.length)     setSelectedSkinTypes(rawSkin.map(String));
      if (rawHair.length)     setSelectedHairTypes(rawHair.map(String));

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

      setLoadingProductTypes(false);
      setLoadingSkinTypes(false);
      setLoadingHairTypes(false);
      setLoadingAgeGroups(false);
      setLoadingIntendedUseAreas(false);
      setLoadingStorageConditions(false);
      setLoadingCountries(false);
      setLoadingPackTypes(false);
      setLoadingCertifications(false);

      if (mode === "edit" && productId) {
        await fetchProductData(
          resolvedProductTypes,
          resolvedAgeGroups,
          resolvedStorageConditions,
          resolvedCountries,
          resolvedPackTypes,
        );
      }

      setInitialLoading(false);
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
    const sl = computeShelfLife(form.manufacturingDate, form.expiryDate);
    setShelfLifeDisplay(sl);
    if (sl && errors.expiryDate) setErrors((p) => { const n = { ...p }; delete n.expiryDate; return n; });
  }, [form.manufacturingDate, form.expiryDate]);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (certDropdownRef.current && !certDropdownRef.current.contains(e.target as Node))
        setShowCertDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericOnlyFields = [
      "stockQuantity", "sellingPrice", "mrp", "discountPercentage",
      "hsnCode", "unitsPerPack", "numberOfPacks",
      "minimumOrderQuantity", "maximumOrderQuantity",
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
      if (isNaN(v) || v < 0 || v > 100)
        setErrors((p) => ({ ...p, discountPercentage: "Discount must be between 0 and 100" }));
      else
        setErrors((p) => { const n = { ...p }; delete n.discountPercentage; return n; });
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
      setSelectedCertifications((p) => [
        ...p,
        {
          id: option.value, label: option.label, tagCode: option.tagCode,
          productCertificateDocumentId: option.certificationId,
          file: null, fileName: "", uploading: false, isUploaded: false, previewUrl: null,
        },
      ]);
    }
    if (errors.certifications) setErrors((p) => { const n = { ...p }; delete n.certifications; return n; });
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

      if (!form.manufacturingDate) e.manufacturingDate = "Manufacturing date is required";
      else if (isFutureDate(form.manufacturingDate)) e.manufacturingDate = "Manufacturing date cannot be a future date";

      if (!form.expiryDate) e.expiryDate = "Expiry date is required";
      else if (form.manufacturingDate && form.expiryDate <= form.manufacturingDate)
        e.expiryDate = "Expiry date must be after manufacturing date";

      const stock = parseFloat(form.stockQuantity);
      if (!form.stockQuantity.trim()) e.stockQuantity = "Stock quantity is required";
      else if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be greater than 0";
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

    const initialSteps: SubmitStep[] = [
      { key: "create", label: "Creating product record", status: "pending" },
      ...(hasImageUpload ? [{ key: "images", label: "Uploading product images", status: "pending" as const }] : []),
      ...certsToUpload.map((c) => ({ key: `cert-${c.id}`, label: `Uploading certificate: ${c.label}`, status: "pending" as const })),
      ...(hasBrochureUpload ? [{ key: "brochure", label: "Uploading brochure", status: "pending" as const }] : []),
    ];

    setSubmitSteps(initialSteps);
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
        shelfLifeMonths: shelfLifeDisplay ?? 0,
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
        NetQuantityStrength:  form.netQuantity,
        ageGroupId:           Number(form.ageGroupId),
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
        updateStep("create", "running");
        await updateProduct(currentProductId, payload as never);
        updateStep("create", "done");

        if (hasImageUpload) {
          updateStep("images", "running");
          await uploadProductImages(currentProductId, images);
          updateStep("images", "done");
        }

        if (currentAttributeId) {
          for (const cert of certsToUpload) {
            updateStep(`cert-${cert.id}`, "running");
            const result = await uploadCosmeticCertificate(currentAttributeId, cert.productCertificateDocumentId, cert.file!);
            if (!result.success) {
              updateStep(`cert-${cert.id}`, "error");
              throw new Error(`Failed to upload certificate "${cert.label}": ${result.message}`);
            }
            updateStep(`cert-${cert.id}`, "done");
          }

          if (hasBrochureUpload) {
            updateStep("brochure", "running");
            const result = await uploadCosmeticBrochure(currentAttributeId, brochureFile!);
            if (!result.success) {
              updateStep("brochure", "error");
              throw new Error(`Failed to upload brochure: ${result.message}`);
            }
            updateStep("brochure", "done");
          }
        }

        setSubmitting(false);
        setSubmitSteps([]);
        alert("Product updated successfully!");
        if (onSubmitSuccess) onSubmitSuccess();
        else window.location.reload();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("Edit submit error:", err);
        setApiError(`Failed to update product: ${msg}`);
        setSubmitting(false);
        setSubmitSteps([]);
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
      updateStep("create", "running");
      const createData: ApiResponseData = await createCosmeticProduct(payload as Record<string, unknown>);

      const dataInner = (createData?.data ?? createData) as ApiResponseData;
      createdProductId = String(dataInner?.productId ?? "").trim();

      if (!createdProductId || createdProductId === "undefined") {
        updateStep("create", "error");
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
        updateStep("create", "error");
        await rollback();
        throw new Error("The product attribute data was not saved by the server.");
      }

      updateStep("create", "done");
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
        updateStep("images", "running");
        try {
          await uploadProductImages(createdProductId, images);
          updateStep("images", "done");
        } catch (imgErr) {
          updateStep("images", "error");
          await rollback();
          throw new Error(`Image upload failed: ${imgErr instanceof Error ? imgErr.message : "unknown error"}`);
        }
      }

      for (const cert of certsToUpload) {
        updateStep(`cert-${cert.id}`, "running");
        const certIdNum = Number(cert.id);
        const docId = certDocMap.get(certIdNum) ?? cert.productCertificateDocumentId;
        try {
          const result = await uploadCosmeticCertificate(createdAttributeId, docId, cert.file!);
          if (!result.success) throw new Error(result.message);
          updateStep(`cert-${cert.id}`, "done");
        } catch (certErr) {
          updateStep(`cert-${cert.id}`, "error");
          await rollback();
          throw new Error(`Certificate upload failed for "${cert.label}"`);
        }
      }

      if (hasBrochureUpload) {
        updateStep("brochure", "running");
        try {
          const result = await uploadCosmeticBrochure(createdAttributeId, brochureFile!);
          if (!result.success) throw new Error(result.message);
          updateStep("brochure", "done");
        } catch {
          updateStep("brochure", "error");
          await rollback();
          throw new Error(`Brochure upload failed`);
        }
      }

      setSubmitting(false);
      setSubmitSteps([]);
      setShowSuccessModal(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      console.error("[CosmeticForm] Submit error:", err);
      setApiError(msg);
      setSubmitting(false);
      setTimeout(() => setSubmitSteps([]), 2000);
    }
  };

  // ─── Select styles ─────────────────────────────────────────────────────────────
  const selectStyles = (errorKey: string) => ({
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "56px",
      height: "auto",
      borderRadius: "16px",
      borderColor: errors[errorKey] ? "#FF3B3B" : state.isFocused ? "#4B0082" : "#737373",
      boxShadow: "none",
      cursor: "pointer",
      alignItems: "center",
      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base: any) => ({ ...base, padding: "8px 16px" }),
    indicatorsContainer: (base: any) => ({ ...base, height: "56px" }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused ? "#4B0082" : "#737373",
      cursor: "pointer",
      "&:hover": { color: "#4B0082" },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? "#4B0082" : state.isFocused ? "#F3E8FF" : "white",
      color: state.isSelected ? "white" : "#1E1E1E",
      cursor: "pointer",
      "&:active": { backgroundColor: "#4B0082", color: "white" },
    }),
    placeholder: (base: any) => ({ ...base, color: "#A3A3A3" }),
    singleValue: (base: any) => ({ ...base, color: "#1E1E1E" }),
  });

  const selectTheme = (theme: any) => ({
    ...theme,
    colors: { ...theme.colors, primary: "#4B0082", primary25: "#F3E8FF", primary50: "#E9D5FF" },
  });

  // ─── Certification upload UI ───────────────────────────────────────────────────
  const renderCertUploadList = () => {
    if (selectedCertifications.length === 0) {
      return (
        <div className="flex items-center w-full h-14 rounded-2xl border border-neutral-500 bg-white overflow-hidden">
          <div className="flex items-center justify-center h-full px-4 bg-[#DED0FE]">
            <img src="/icons/UploadIcon.svg" className="w-6 h-6" alt="upload" />
          </div>
          <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
            <span className="text-[#969793]">Select certifications first</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {selectedCertifications.map((cert) => (
          <div key={cert.id} className="flex flex-col gap-1">
            <div className="flex items-center w-full h-14 rounded-2xl border border-neutral-500 bg-white overflow-hidden">
              <div className="flex items-center justify-center h-full px-4 bg-[#DED0FE]">
                <img src="/icons/UploadIcon.svg" className="w-6 h-6" alt="upload" />
              </div>
              <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
                {cert.isUploaded || cert.existingUrl ? (
                  <div className="flex items-center bg-[#FDEBEB] text-sm px-3 py-2 rounded-lg max-w-full">
                    <FileText size={14} className="text-purple-600 mr-2 flex-shrink-0" />
                    <span className="truncate">{cert.fileName || "Existing certificate"}</span>
                    <button type="button" onClick={() => handleCertRemove(cert.id)} className="ml-2 text-gray-500 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <span className="text-[#969793]">Upload the {cert.label}</span>
                )}
              </div>
              {!cert.isUploaded && !cert.existingUrl ? (
                <label className="cursor-pointer px-4">
                  <img src="/icons/UploadAddIcon.svg" className="w-6 h-6" alt="add" />
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.svg" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCertFileSelect(cert.id, file); }} />
                </label>
              ) : (
                <label className="cursor-pointer px-4" title="Replace">
                  <RefreshCw size={16} className="text-purple-600" />
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.svg" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCertFileSelect(cert.id, file); }} />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Loading guard ─────────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === "edit" && loadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEdit = mode === "edit";
  const currentGenderLabel = isEdit
    ? (displayLabels.genderLabel || genderOptions.find((o) => o.value === form.gender)?.label || form.gender)
    : "";

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {submitting && submitSteps.length > 0 && <SubmitProgressOverlay steps={submitSteps} />}

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

      {/* ✅ Additional Discount Modal — identical pattern to DrugForm */}
      {showAdditionalDiscount && (
        <CommonModal
          onClose={() => setShowAdditionalDiscount(false)}
          width="w-[600px]"
        >
          <div className="h-[80vh] overflow-y-auto flex flex-col p-6">
            <AdditionalDiscountType
              onClose={() => setShowAdditionalDiscount(false)}
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
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-h4 font-semibold">Product Details</div>
          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div data-field="productName">
              {isEdit ? (
                <NonEditableField label="Product Name" value={form.productName} required />
              ) : (
                <Input label="Product Name" name="productName" placeholder="e.g., Hydrating Face Serum"
                  value={form.productName} onChange={handleChange} error={errors.productName} required />
              )}
            </div>

            <div data-field="brandName">
              <Input label="Brand Name" name="brandName" placeholder="e.g., Lakme, Neutrogena, Mamaearth"
                value={form.brandName} onChange={handleChange} error={errors.brandName} required />
            </div>

            <div className="flex flex-col gap-1" data-field="productTypeId">
              {isEdit ? (
                <NonEditableSelect label="Product Type" value={displayLabels.productTypeLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Product Type {requiredStar}</label>
                  <Select
                    options={productTypeOptions} isLoading={loadingProductTypes}
                    value={productTypeOptions.find((o) => o.value === form.productTypeId) || null}
                    onChange={(sel) => handleSelectChange("productTypeId", sel)}
                    placeholder={loadingProductTypes ? "Loading..." : "Select product type"}
                    theme={selectTheme} styles={selectStyles("productTypeId")}
                  />
                  {errors.productTypeId && <p className={errorMsg}>{errors.productTypeId}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1" data-field="productSubTypeId">
              {isEdit ? (
                <NonEditableSelect label="Product Sub-Type" value={displayLabels.productSubTypeLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Product Sub-Type {requiredStar}</label>
                  <Select
                    options={productSubTypeOptions} isLoading={loadingSubTypes} isDisabled={!form.productTypeId}
                    value={productSubTypeOptions.find((o) => o.value === form.productSubTypeId) || null}
                    onChange={(sel) => handleSelectChange("productSubTypeId", sel)}
                    placeholder={form.productTypeId ? (loadingSubTypes ? "Loading..." : "Select sub-type") : "Select product type first"}
                    theme={selectTheme} styles={selectStyles("productSubTypeId")}
                  />
                  {errors.productSubTypeId && <p className={errorMsg}>{errors.productSubTypeId}</p>}
                </>
              )}
            </div>

            <div data-field="variantName">
              <Input label="Variant Name" name="variantName" placeholder="e.g., Aloe Vera, Rose, Charcoal (optional)"
                value={form.variantName} onChange={handleChange} />
            </div>

            <div className="flex flex-col gap-1" data-field="gender">
              {isEdit ? (
                <NonEditableSelect label="Gender" value={currentGenderLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Gender {requiredStar}</label>
                  <Select
                    options={genderOptions}
                    value={genderOptions.find((o) => o.value === form.gender) || null}
                    onChange={(sel) => handleSelectChange("gender", sel)}
                    placeholder="Select gender" theme={selectTheme} styles={selectStyles("gender")}
                  />
                  {errors.gender && <p className={errorMsg}>{errors.gender}</p>}
                </>
              )}
            </div>

            <MultiCheckDropdown
              label="Intended Use Area" required
              options={intendedUseAreaOptions} selected={selectedIntendedUseAreas}
              onChange={(vals) => {
                setSelectedIntendedUseAreas(vals);
                if (errors.intendedUseAreas) setErrors((p) => { const n = { ...p }; delete n.intendedUseAreas; return n; });
              }}
              placeholder="Select intended use area(s)"
              errorKey="intendedUseAreas" errors={errors} loading={loadingIntendedUseAreas}
              fieldRef={setFieldRef("intendedUseAreas") as React.Ref<HTMLDivElement>}
              dataField="intendedUseAreas"
            />

            <div data-field="netQuantity">
              <Input label="Net Quantity / Strength" name="netQuantity" placeholder="e.g., 100ml, 50g, 200ml"
                value={form.netQuantity} onChange={handleChange} error={errors.netQuantity} required />
            </div>

            {skinHairRule.skinType !== "hidden" && (
              <MultiCheckDropdown
                label={skinHairRule.skinType === "mandatory" ? "Skin Type" : "Skin Type (optional)"}
                required={skinHairRule.skinType === "mandatory"}
                options={skinTypeOptions} selected={selectedSkinTypes}
                onChange={(vals) => {
                  setSelectedSkinTypes(vals);
                  if (errors.skinTypes) setErrors((p) => { const n = { ...p }; delete n.skinTypes; return n; });
                }}
                placeholder="Select skin type(s)"
                errorKey="skinTypes" errors={errors} loading={loadingSkinTypes}
                fieldRef={setFieldRef("skinTypes") as React.Ref<HTMLDivElement>}
                dataField="skinTypes"
              />
            )}

            {skinHairRule.hairType !== "hidden" && (
              <MultiCheckDropdown
                label={skinHairRule.hairType === "mandatory" ? "Hair Type" : "Hair Type (optional)"}
                required={skinHairRule.hairType === "mandatory"}
                options={hairTypeOptions} selected={selectedHairTypes}
                onChange={(vals) => {
                  setSelectedHairTypes(vals);
                  if (errors.hairTypes) setErrors((p) => { const n = { ...p }; delete n.hairTypes; return n; });
                }}
                placeholder="Select hair type(s)"
                errorKey="hairTypes" errors={errors} loading={loadingHairTypes}
                fieldRef={setFieldRef("hairTypes") as React.Ref<HTMLDivElement>}
                dataField="hairTypes"
              />
            )}

            <div className="flex flex-col gap-1" data-field="ageGroupId">
              {isEdit ? (
                <NonEditableSelect label="Age Group" value={displayLabels.ageGroupLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Age Group {requiredStar}</label>
                  <Select
                    options={ageGroupOptions} isLoading={loadingAgeGroups}
                    value={ageGroupOptions.find((o) => o.value === form.ageGroupId) || null}
                    onChange={(sel) => handleSelectChange("ageGroupId", sel)}
                    placeholder={loadingAgeGroups ? "Loading..." : "Select age group"}
                    theme={selectTheme} styles={selectStyles("ageGroupId")}
                  />
                  {errors.ageGroupId && <p className={errorMsg}>{errors.ageGroupId}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1" data-field="countryOfOriginId">
              {isEdit ? (
                <NonEditableSelect label="Country of Origin" value={displayLabels.countryLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Country of Origin {requiredStar}</label>
                  <Select
                    options={countryOptions} isLoading={loadingCountries}
                    value={countryOptions.find((o) => o.value === form.countryOfOriginId) || null}
                    onChange={(sel) => handleSelectChange("countryOfOriginId", sel)}
                    placeholder={loadingCountries ? "Loading..." : "Select country"}
                    theme={selectTheme} styles={selectStyles("countryOfOriginId")}
                  />
                  {errors.countryOfOriginId && <p className={errorMsg}>{errors.countryOfOriginId}</p>}
                </>
              )}
            </div>

            <div data-field="manufacturerName">
              {isEdit ? (
                <NonEditableField label="Manufacturer Name" value={form.manufacturerName} required />
              ) : (
                <Input label="Manufacturer Name" name="manufacturerName" placeholder="Manufacturer company name"
                  value={form.manufacturerName} onChange={handleChange} error={errors.manufacturerName} required />
              )}
            </div>

            <div className="flex flex-col gap-1" data-field="storageConditionId">
              <label className={fieldLabel}>Storage Condition {requiredStar}</label>
              <Select
                options={storageConditionOptions} isLoading={loadingStorageConditions}
                value={storageConditionOptions.find((o) => o.value === form.storageConditionId) || null}
                onChange={(sel) => handleSelectChange("storageConditionId", sel)}
                placeholder={loadingStorageConditions ? "Loading..." : "Select storage condition"}
                theme={selectTheme} styles={selectStyles("storageConditionId")}
              />
              {errors.storageConditionId && <p className={errorMsg}>{errors.storageConditionId}</p>}
            </div>

            <div className="flex flex-col gap-1" data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
              {isEdit ? (
                <div className="w-full h-14 px-4 border border-neutral-200 rounded-2xl flex items-center text-base bg-gray-50" style={{ color: "#5A5B58" }}>
                  {selectedCertifications.length > 0 ? selectedCertifications.map((c) => c.label).join(", ") : "No certifications selected"}
                </div>
              ) : (
                <div className="relative" ref={certDropdownRef}>
                  <div
                    onClick={() => setShowCertDropdown((p) => !p)}
                    className={`w-full h-14 px-4 border rounded-2xl flex items-center justify-between cursor-pointer transition-all bg-white ${errors.certifications ? "border-[#FF3B3B]" : "border-neutral-500 hover:border-[#4B0082]"}`}
                  >
                    <span className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]"
                      style={{ color: selectedCertifications.length > 0 ? "#3C3D3A" : "#A3A3A3" }}>
                      {selectedCertifications.length > 0 ? selectedCertifications.map((c) => c.label).join(", ") : "Select certifications"}
                    </span>
                    <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${showCertDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {showCertDropdown && (
                    <div className="absolute z-20 w-full bg-white border border-neutral-200 mt-1 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                      {loadingCertifications ? (
                        <div className="px-4 py-3 text-neutral-500 text-sm">Loading...</div>
                      ) : (
                        certificationMasterOptions.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer">
                            <input type="checkbox"
                              checked={selectedCertifications.some((c) => c.id === opt.value)}
                              onChange={() => handleCertCheckbox(opt)}
                              className="accent-purple-600 w-4 h-4" />
                            <span className="text-base [font-family:'Open_Sans',sans-serif] [color:#3C3D3A]">{opt.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Upload Certifications / Compliance {requiredStar}</label>
              {renderCertUploadList()}
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, SVG — max 5 MB per file</p>
            </div>

            <div data-field="brochure">
              <UploadInput onFileSelect={(file) => setBrochureFile(file)} existingFile={existingBrochureUrl || undefined} />
            </div>

            <div className="flex flex-col gap-1" data-field="activeIngredients">
              <label className={fieldLabel}>Active Ingredients {requiredStar}</label>
              <textarea
                ref={setFieldRef("activeIngredients") as React.RefCallback<HTMLTextAreaElement>}
                name="activeIngredients" value={form.activeIngredients} onChange={handleChange} rows={4}
                placeholder="e.g., Vitamin C, Vitamin E, Salicylic Acid, Hyaluronic Acid"
                className={`w-full rounded-2xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none border bg-white focus:outline-none focus:ring-0 transition-colors ${errors.activeIngredients ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
              />
              {errors.activeIngredients && <p className={errorMsg}>{errors.activeIngredients}</p>}
            </div>

            <div className="flex flex-col gap-1" data-field="productClaims">
              <label className={fieldLabel}>Product Claims {requiredStar}</label>
              <textarea
                ref={setFieldRef("productClaims") as React.RefCallback<HTMLTextAreaElement>}
                name="productClaims" value={form.productClaims} onChange={handleChange} rows={4}
                placeholder={`e.g., "Paraben Free", "Dermatologically Tested", "Clinically Proven"`}
                className={`w-full rounded-2xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none border bg-white focus:outline-none focus:ring-0 transition-colors ${errors.productClaims ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
              />
              {errors.productClaims && <p className={errorMsg}>{errors.productClaims}</p>}
            </div>

            <div className="flex flex-col gap-1" data-field="warningsPrecautions">
              <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
              <textarea
                ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
                name="warningsPrecautions" value={form.warningsPrecautions} onChange={handleChange} rows={4}
                placeholder="e.g., For external use only. Avoid contact with eyes. Keep out of reach of children."
                className={`w-full rounded-2xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none border bg-white focus:outline-none focus:ring-0 transition-colors ${errors.warningsPrecautions ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
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
                className={`w-full rounded-2xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none border bg-white focus:outline-none focus:ring-0 transition-colors ${errors.productDescription ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
              />
              {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Packaging & Order Details */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-h4 font-semibold">Packaging &amp; Order Details</div>
          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div className="flex flex-col gap-1" data-field="packTypeId">
              {isEdit ? (
                <NonEditableSelect label="Pack Type" value={displayLabels.packTypeLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Pack Type {requiredStar}</label>
                  <Select
                    options={packTypeOptions} isLoading={loadingPackTypes}
                    value={packTypeOptions.find((o) => o.value === form.packTypeId) || null}
                    onChange={(sel) => handleSelectChange("packTypeId", sel)}
                    placeholder={loadingPackTypes ? "Loading..." : "Select pack type"}
                    theme={selectTheme} styles={selectStyles("packTypeId")}
                  />
                  {errors.packTypeId && <p className={errorMsg}>{errors.packTypeId}</p>}
                </>
              )}
            </div>

            <Input label="Number of Units per Pack Type" name="unitsPerPack" placeholder="e.g., 1"
              value={form.unitsPerPack} onChange={handleChange} error={errors.unitsPerPack} required />

            <Input label="Number of Packs" name="numberOfPacks" placeholder="e.g., 1"
              value={form.numberOfPacks} onChange={handleChange} error={errors.numberOfPacks} required />

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Pack Size (No. of Units per Pack Type × No. of Packs)</label>
              <input name="packSize" value={form.packSize} readOnly
                className="w-full h-14 px-4 border border-neutral-200 rounded-2xl text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed" />
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
              {isEdit ? (
                <NonEditableField label="Batch Number" value={form.batchNumber} required />
              ) : (
                <Input label="Batch Number" name="batchNumber" placeholder="Alphanumeric only, e.g., BAT2024001"
                  value={form.batchNumber} onChange={handleChange} error={errors.batchNumber} required />
              )}
            </div>

            <div className="flex flex-col gap-1" data-field="manufacturingDate">
              <label className={fieldLabel}>Manufacturing Date {requiredStar}</label>
              {isEdit ? (
                <div className="w-full h-14 px-4 border border-neutral-200 rounded-2xl flex items-center bg-gray-50" style={{ color: "#5A5B58" }}>
                  {form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""}
                </div>
              ) : (
                <>
                  <input ref={setFieldRef("manufacturingDate")} type="date" name="manufacturingDate"
                    max={todayStr}
                    value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setForm((p) => ({ ...p, manufacturingDate: e.target.value ? new Date(e.target.value) : null }))}
                    className={`w-full h-14 px-4 border rounded-2xl text-base [font-family:'Open_Sans',sans-serif] bg-white focus:outline-none focus:ring-0 transition-colors ${errors.manufacturingDate ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
                  />
                  {errors.manufacturingDate && <p className={errorMsg}>{errors.manufacturingDate}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1" data-field="expiryDate">
              <label className={fieldLabel}>Expiry Date {requiredStar}</label>
              {isEdit ? (
                <div className="w-full h-14 px-4 border border-neutral-200 rounded-2xl flex items-center bg-gray-50" style={{ color: "#5A5B58" }}>
                  {form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""}
                </div>
              ) : (
                <>
                  <input ref={setFieldRef("expiryDate")} type="date" name="expiryDate"
                    min={form.manufacturingDate ? (() => { const d = new Date(form.manufacturingDate!); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })() : undefined}
                    value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value ? new Date(e.target.value) : null }))}
                    className={`w-full h-14 px-4 border rounded-2xl text-base [font-family:'Open_Sans',sans-serif] bg-white focus:outline-none focus:ring-0 transition-colors ${errors.expiryDate ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
                  />
                  {errors.expiryDate && <p className={errorMsg}>{errors.expiryDate}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Shelf Life (auto-calculated)</label>
              <div className={`w-full h-14 px-4 border rounded-2xl flex items-center text-base [font-family:'Open_Sans',sans-serif] ${shelfLifeDisplay ? "border-purple-200 bg-purple-50 [color:#7D32FC]" : "border-neutral-200 bg-gray-50 [color:#969793]"}`}>
                {shelfLifeDisplay || "Calculated from Manufacturing & Expiry dates"}
              </div>
            </div>

            <div data-field="stockQuantity">
              {isEdit ? (
                <NonEditableField label="Stock Quantity (in terms of Pack Size)" value={form.stockQuantity} required />
              ) : (
                <Input label="Stock Quantity (in terms of Pack Size)" name="stockQuantity" placeholder="e.g., 100"
                  value={form.stockQuantity} onChange={handleChange} error={errors.stockQuantity} required />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Date of Stock Entry {requiredStar}</label>
              <input type="date" value={todayStr} readOnly
                className="w-full h-14 px-4 border border-neutral-200 rounded-2xl text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed" />
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
                  className="w-55.5 h-10.5 px-6 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <img src="/icons/PlusIcon.svg" alt="add" className="w-[12.5px] h-[12.5px]" />
                  Add Special Discount
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Final Price (Auto-calculated)</label>
              <input name="finalPrice" value={form.finalPrice} readOnly
                className="w-full h-14 px-4 border border-neutral-200 rounded-2xl text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed" />
            </div>
          </div>

          <div className="text-h6 font-normal mt-5">Tax &amp; Billing</div>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex flex-col gap-1" data-field="gstPercentage">
              {isEdit ? (
                <NonEditableSelect label="GST %" value={displayLabels.gstLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>GST % {requiredStar}</label>
                  <Select
                    options={gstOptions}
                    value={gstOptions.find((o) => o.value === form.gstPercentage) || null}
                    onChange={(sel) => handleSelectChange("gstPercentage", sel)}
                    placeholder="Select GST %" theme={selectTheme} styles={selectStyles("gstPercentage")}
                  />
                  {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
                </>
              )}
            </div>

            <div data-field="hsnCode">
              {isEdit ? (
                <NonEditableField label="HSN Code" value={form.hsnCode} required />
              ) : (
                <Input label="HSN Code" name="hsnCode" placeholder="4, 6, or 8 digit numeric code"
                  value={form.hsnCode} onChange={handleChange} maxLength={8} error={errors.hsnCode} required />
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Product Photos */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6"
          ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>} data-field="images">
          <div className="text-[#364153] font-normal text-sm">
            Product Photos {mode === "create" && <span className="text-warning-500 font-semibold ml-1">*</span>}
          </div>

          {existingImages.length > 0 && (
            <div className="mb-4 mt-4">
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

          <div className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer mt-4"
            onClick={() => document.getElementById("cosmeticFileInput")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files); }}>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-sm font-medium text-gray-600 text-center">Choose a file or drag &amp; drop it here</div>
              <div className="text-xs text-gray-400 text-center">PNG, JPG, SVG — max 5 images, 5 MB each</div>
            </div>
          </div>

          <input id="cosmeticFileInput" type="file" multiple accept="image/jpeg,image/png,image/jpg,image/svg+xml"
            className="hidden" onChange={(e) => { if (e.target.files) handleImageFiles(e.target.files); }} />

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
        <div className="flex justify-between mt-6 mb-6">
          <div className="space-x-6 flex">
            <button type="button"
              onClick={() => onSubmitSuccess ? onSubmitSuccess() : window.location.reload()}
              disabled={submitting}
              className="w-21 h-12 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button type="button" disabled={submitting}
              className="w-35.25 h-12 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5 disabled:opacity-50">
              <img src="/icons/SaveDraftIcon.svg" alt="save draft" className="w-5 h-5 rounded-md object-cover" />
              Save Draft
            </button>
          </div>
          <div>
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CosmeticForm;