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
import { validateBatchNumber } from "@/src/services/product/PricingService";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import { AlertCircle } from "lucide-react";
import MonthPicker from "@/src/app/commonComponents/MonthPicker";
import ProductImageUpload from "../commonComponent/ProductImageUpload";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import CommonModal from "../commonComponent/CommonModal";
import PopupModal from "../commonComponent/PopupModal";
import UploadInput from "../commonComponent/UploadInput";
import AdditionalDiscountType from "./AdditionalDiscountType";
import AppliedOffersView from "./AppliedOffersView";

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


// ─── Non-editable display fields ──────────────────────────────────────────────

const NonEditableField = ({ label, value, required }: { label: string; value: string; required?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className={fieldLabel}>{label} {required && requiredStar}</label>
    <div className="w-full h-[52px] px-4 border border-[#C0C1BE] rounded-[8px] flex items-center text-base [font-family:'Open_Sans',sans-serif] bg-gray-50" style={{ color: "#5A5B58" }}>
      {value || "—"}
    </div>
  </div>
);

const NonEditableSelect = ({ label, value, required }: { label: string; value: string; required?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className={fieldLabel}>{label} {required && requiredStar}</label>
    <div className="w-full h-[52px] px-4 border border-[#C0C1BE] rounded-[8px] flex items-center text-base [font-family:'Open_Sans',sans-serif] bg-gray-50" style={{ color: "#5A5B58" }}>
      {value || "—"}
    </div>
  </div>
);


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
    specialSchemes:       [] as any[],
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
  const [mandatoryCertCount, setMandatoryCertCount] = useState(0);

  // ─── Master options ───────────────────────────────────────────────────────────
  const [productTypeOptions, setProductTypeOptions] = useState<SelectOption[]>([]);
  const [productSubTypeOptions, setProductSubTypeOptions] = useState<SelectOption[]>([]);
  const productSubTypeOptionsRef = useRef<SelectOption[]>([]);
  productSubTypeOptionsRef.current = productSubTypeOptions;
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

  // ─── Errors / modals ──────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string>("");
  const [showManufacturingMonthPicker, setShowManufacturingMonthPicker] = useState(false);
  const [showExpiryMonthPicker, setShowExpiryMonthPicker] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [editTab, setEditTab] = useState<"additional_discount" | "special_schemes" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

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

      const packagingArr: any[] = Array.isArray(data.packagingDetails)
        ? data.packagingDetails
        : data.packagingDetails ? [data.packagingDetails] : [];
      const packaging = packagingArr.length > 0
        ? packagingArr.reduce((latest: any, curr: any) =>
            new Date(curr.createdDate) > new Date(latest.createdDate) ? curr : latest)
        : {};

      const pricingArr: any[] = Array.isArray(data.pricingDetails) ? data.pricingDetails : [];
      const pricing = pricingArr.length > 0
        ? pricingArr.reduce((latest: any, curr: any) =>
            new Date(curr.createdDate) > new Date(latest.createdDate) ? curr : latest)
        : {};

      setProductAttributeId(extractAttributeIdFromProduct(data) || "");
      setPackagingId(String(packaging.packagingId || packaging.packagingDetailsId || packaging.id || ""));
      setPricingId(String(pricing.pricingId || pricing.pricingDetailsId || pricing.id || ""));

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

      let resolvedSubCats = productSubTypeOptionsRef.current;
      if (productTypeIdStr && resolvedSubCats.length === 0) {
        resolvedSubCats = await fetchSubTypes(productTypeIdStr);
      }

      setDisplayLabels({
        productTypeLabel:      currentProductTypeOptions.find((o) => o.value === productTypeIdStr)?.label || productTypeIdStr,
        productSubTypeLabel:   resolvedSubCats.find((o) => o.value === productSubTypeIdStr)?.label || productSubTypeIdStr,
        ageGroupLabel:         ageGroupIds.map((id) => currentAgeGroupOptions.find((o) => o.value === id)?.label || id).join(", "),
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
        sellingPrice:         pricing.sellingPrice != null ? String(pricing.sellingPrice) : "",
        mrp:                  pricing.mrp != null ? String(pricing.mrp) : "",
        discountPercentage:   String(pricing.discountPercentage || ""),
        gstPercentage:        gstVal,
        hsnCode:              String(pricing.hsnCode || ""),
        finalPrice:           String(pricing.finalPrice || ""),
        shelfLifeMonths:      String(computeShelfLife(mfgDate, expDate) ?? ""),
        // ✅ Load additionalDiscount directly — same shape as DrugForm
        additionalDiscount:   Array.isArray(pricing.additionalDiscounts) ? pricing.additionalDiscounts : [],
        specialSchemes:       Array.isArray(pricing.specialSchemes) ? pricing.specialSchemes : [],
      });

      let rawIntended: unknown[] = [];
      let rawSkin: unknown[]     = [];
      let rawHair: unknown[]     = [];

      // API returns field as "IntendedUseArea" (capital I, array of objects {useAreaId, areaName})
      const rawUseArea = attribute.IntendedUseArea ?? attribute.intendedUseAreaIds ?? attribute.useAreaId ?? attribute.useAreaIds;
      if (Array.isArray(rawUseArea))                       rawIntended = rawUseArea;
      else if (rawUseArea != null)                         rawIntended = [rawUseArea];
      else if (Array.isArray(attribute.intendedarea))      rawIntended = attribute.intendedarea;
      else if (Array.isArray(attribute.intendedUseAreas))  rawIntended = attribute.intendedUseAreas;
      else if (Array.isArray(attribute.intendedAreas))     rawIntended = attribute.intendedAreas;

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
      const isRealUrl = (u: string) => !!u && !["PENDING", "NOT_UPLOADED"].includes(u.toUpperCase());
      if (isRealUrl(brochurePath)) {
        setExistingBrochureUrl(brochurePath);
      }

      if (attribute.certificateDocuments?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedCerts = attribute.certificateDocuments.map((cert: any) => ({
          id:                           String(cert.certificationId),
          label:                        cert.certificationName || `Certificate ${cert.certificationId}`,
          tagCode:                      `Tag ${String(cert.certificationId).padStart(2, "0")}`,
          file:                         null,
          fileName:                     isRealUrl(cert.certificateUrl)
                                          ? cert.certificateUrl.split("/").pop() || "" : "",
          uploading:                    false,
          isUploaded:                   isRealUrl(cert.certificateUrl),
          previewUrl:                   null,
          productCertificateDocumentId: Number(cert.productCertificateDocumentId),
          existingUrl:                  cert.certificateUrl || undefined,
        }));
        setSelectedCertifications(mappedCerts);
        setMandatoryCertCount(mappedCerts.length);
      }
    } catch (err) {
      console.error("Error fetching cosmetic product:", err);
      setApiError("Failed to load product data. Please refresh and try again.");
    } finally {
      setLoadingProduct(false);
    }
  }, [mode, productId, fetchSubTypes]);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node))
        setShowUnitDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    let value = e.target.value;

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

    // Field-specific sanitization (matches SupplementForm pattern)
    if (name === "unitsPerPack") {
      value = value.replace(/\D/g, "");
      if (value.length > 5) value = value.slice(0, 5);
    } else if (name === "numberOfPacks") {
      value = value.replace(/\D/g, "");
      if (value.length > 4) value = value.slice(0, 4);
    } else if (name === "minimumOrderQuantity" || name === "maximumOrderQuantity") {
      value = value.replace(/\D/g, "");
      if (value.length > 7) value = value.slice(0, 7);
    } else if (name === "mrp" || name === "sellingPrice") {
      value = value.replace(/[^0-9.]/g, "");
      const parts = value.split(".");
      if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
      if (parts.length > 1) {
        value = `${parts[0]}.${parts[1].slice(0, 2)}`;
      } else {
        value = parts[0];
      }
    } else if (name === "discountPercentage") {
      value = value.replace(/[^0-9.]/g, "");
      const parts = value.split(".");
      if (parts.length > 1) {
        value = `${parts[0]}.${parts[1].slice(0, 2)}`;
      } else {
        value = parts[0];
      }
      if (Number(value) > 100) value = "100";
    } else if (name === "stockQuantity" || name === "hsnCode") {
      if (value !== "" && !/^\d*$/.test(value)) return;
      if (name === "hsnCode" && value.length > 8) value = value.slice(0, 8);
    } else if (name === "netQuantity") {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      if (value.startsWith("-")) return;
    }

    const maxLengths: Record<string, number> = {
      productName: 150, brandName: 60, variantName: 60,
      manufacturerName: 100, productDescription: 1000, batchNumber: 20,
    };
    if (name in maxLengths && value.length > maxLengths[name]) return;

    setForm((p) => {
      const updated = { ...p, [name]: value };

      // Cross-field: maxQty >= minQty
      const minQ = Number(updated.minimumOrderQuantity) || 0;
      const maxQ = Number(updated.maximumOrderQuantity) || 0;
      if ((name === "minimumOrderQuantity" || name === "maximumOrderQuantity") && minQ && maxQ) {
        setErrors((prev) => {
          const n = { ...prev };
          if (maxQ < minQ) n.maximumOrderQuantity = "Max Order Qty must be ≥ Min Order Qty";
          else delete n.maximumOrderQuantity;
          return n;
        });
      }

      // Cross-field: sellingPrice <= mrp
      const mrpVal = Number(updated.mrp) || 0;
      const spVal  = Number(updated.sellingPrice) || 0;
      if ((name === "mrp" || name === "sellingPrice") && mrpVal && spVal) {
        setErrors((prev) => {
          const n = { ...prev };
          if (spVal > mrpVal) n.sellingPrice = "Selling Price must be ≤ MRP";
          else delete n.sellingPrice;
          return n;
        });
      }

      return updated;
    });
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
    if (name === "batchNumber" && value.trim()) {
      checkBatchNumber(value);
    }
  };

  const handleSelectChange = (field: string, sel: SelectOption | null) => {
    setForm((p) => ({ ...p, [field]: sel ? sel.value : "" }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleCertCheckbox = (option: CertificationMasterOption) => {
    const exists = selectedCertifications.some((c) => c.id === option.value);
    if (exists) {
      const isMandatory = mode === "edit" &&
        selectedCertifications.findIndex((c) => c.id === option.value) < mandatoryCertCount;
      if (isMandatory) {
        alert(`"${option.label}" is a mandatory certificate and cannot be removed. You may re-upload a new file for it instead.`);
        return;
      }
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
    const key = `certFile_${certId}`;
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const handleCertRemove = (certId: string) =>
    setSelectedCertifications((prev) =>
      prev.map((c) =>
        c.id === certId ? { ...c, file: null, fileName: "", isUploaded: false, existingUrl: undefined } : c,
      ),
    );

  const handleMonthSelect = (
    field: "manufacturingDate" | "expiryDate",
    month: number,
    year: number,
  ) => {
    const selectedDate = new Date(year, month, 1);

    if (field === "manufacturingDate") {
      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      if (selectedDate > currentMonth) {
        setErrors((prev) => ({ ...prev, manufacturingDate: "Manufacturing date cannot be in the future month" }));
        return;
      }
      setErrors((prev) => ({ ...prev, manufacturingDate: "", expiryDate: "" }));
      setForm({ ...form, manufacturingDate: selectedDate, expiryDate: null, shelfLifeMonths: "" });
      setShowManufacturingMonthPicker(false);
      return;
    }

    if (field === "expiryDate") {
      setForm((prev) => {
        const updatedForm = { ...prev, expiryDate: selectedDate };

        let expiryError = "";

        if (updatedForm.manufacturingDate) {
          const mfg = new Date(updatedForm.manufacturingDate);
          const today = new Date();

          const maxDate = new Date(mfg.getFullYear() + 5, mfg.getMonth(), 1);

          const totalMonths =
            (selectedDate.getFullYear() - mfg.getFullYear()) * 12 +
            (selectedDate.getMonth() - mfg.getMonth()) +
            1;

          const monthsUntilExpiry =
            (selectedDate.getFullYear() - today.getFullYear()) * 12 +
            (selectedDate.getMonth() - today.getMonth()) +
            1;

          updatedForm.shelfLifeMonths =
            totalMonths >= 0 ? totalMonths.toString() : "";

          if (monthsUntilExpiry > 0 && monthsUntilExpiry <= 3) {
            expiryError =
              monthsUntilExpiry === 1
                ? "This product expires within 1 month, but it can still be added."
                : `This product expires within ${monthsUntilExpiry} months, but it can still be added.`;
          } else if (selectedDate > maxDate) {
            expiryError =
              "Expiry cannot be more than 5 years from Manufacturing Date";
          }
        }

        setErrors((prevErrors) => ({
          ...prevErrors,
          expiryDate: expiryError,
        }));

        return updatedForm;
      });

      setShowExpiryMonthPicker(false);
    }
  };

  // ─── Batch number uniqueness check ────────────────────────────────────────────

  const checkBatchNumber = async (batchNumber: string) => {
    try {
      const response = await validateBatchNumber(batchNumber, productCategoryId);
      if (response.exists) {
        setErrors((prev) => ({ ...prev, batchNumber: "Batch number already exists" }));
      } else {
        setErrors((prev) => { const n = { ...prev }; delete n.batchNumber; return n; });
      }
    } catch (error) {
      console.error("Batch validation failed:", error);
    }
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

    // Fields below are non-editable in edit mode — validate only on create so
    // Excel-uploaded products (which may lack this data) are not blocked on edit.
    if (mode === "create") {
      if (!form.gender) e.gender = "Gender is required";
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
      const mName = form.manufacturerName.trim();
      if (!mName) e.manufacturerName = "Manufacturer name is required";
      else if (mName.length > 100) e.manufacturerName = "Manufacturer name must not exceed 100 characters";
      if (!form.countryOfOriginId) e.countryOfOriginId = "Country of origin is required";
    }

    if (selectedIntendedUseAreas.length === 0) e.intendedUseAreas = "At least one intended use area is required";
    if (!form.productClaims.trim()) e.productClaims = "Product claims are required";
    if (!form.warningsPrecautions.trim()) e.warningsPrecautions = "Warnings / precautions are required";

    const pDesc = form.productDescription.trim();
    if (!pDesc) e.productDescription = "Product description is required";
    else if (pDesc.length > 1000) e.productDescription = "Product description must not exceed 1000 characters";

    if (!form.storageConditionId) e.storageConditionId = "Storage condition is required";

    for (const cert of selectedCertifications) {
      if (!cert.file && !cert.existingUrl) {
        e[`certFile_${cert.id}`] = `Please upload the certificate file for "${cert.label}"`;
      }
    }
    if (mode === "edit" && selectedCertifications.length < mandatoryCertCount) {
      e.certifications = `You must keep all ${mandatoryCertCount} original certifications. Please re-add any removed ones.`;
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
      else if (form.manufacturingDate) {
        const maxDate = new Date(form.manufacturingDate.getFullYear() + 5, form.manufacturingDate.getMonth(), 1);
        if (form.expiryDate > maxDate)
          e.expiryDate = "Expiry cannot be more than 5 years from Manufacturing Date";
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

    if (images.length === 0 && existingImages.length === 0) e.images = "At least one product image is required";
    if (images.length + existingImages.length > 5) e.images = "Maximum 5 images allowed";

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

    if (mode === "create" && form.batchNumber.trim()) {
      try {
        const batchValidation = await validateBatchNumber(form.batchNumber, productCategoryId);
        if (batchValidation.exists) {
          setErrors((prev) => ({ ...prev, batchNumber: "Batch number already exists" }));
          setSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Batch validation failed:", error);
      }
    }

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
          displayOffer:                 d.displayOffer !== false,
        })),
        specialSchemes: (form.specialSchemes || []).map((s: any) => ({
          ...s,
          ...(s.specialSchemesId ? { specialSchemesId: s.specialSchemesId } : {}),
          displayOfferScheme: s.displayOfferScheme !== false,
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
        intendedUseAreaIds:   selectedIntendedUseAreas.map(Number),
        IntendedUseArea:      selectedIntendedUseAreas.map((id) => ({ useAreaId: Number(id) })),
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
      retainedImageUrls: existingImages,
    };

    // ── EDIT MODE ──────────────────────────────────────────────────────────────
    if (mode === "edit") {
      const currentProductId = resolvedProductId || productId || "";
      let currentAttributeId = productAttributeId;

      try {
        const updateData = await updateProduct(currentProductId, payload as never) as ApiResponseData;

        // For Excel-uploaded products the attributeId may not be pre-populated
        if (!currentAttributeId) {
          currentAttributeId = extractProductAttributeId(updateData) || extractAttributeIdFromProduct(updateData) || "";
        }

        // Extract server-assigned productCertificateDocumentId values from the update response
        let certDocMap = extractCertDocumentIdMap(updateData);
        if (certDocMap.size === 0) {
          certDocMap = extractCertDocumentIdMapFromProduct(updateData);
        }
        const finalCertsToUpload = certsToUpload.map((c) => {
          const serverDocId = certDocMap.get(Number(c.id));
          return serverDocId ? { ...c, productCertificateDocumentId: serverDocId } : c;
        });

        if (hasImageUpload) {
          await uploadProductImages(currentProductId, images);
        }

        if (currentAttributeId) {
          for (const cert of finalCertsToUpload) {
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
        else setShowSuccessModal(true);
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
  const currentGenderLabel = isEdit
    ? (displayLabels.genderLabel || genderOptions.find((o) => o.value === form.gender)?.label || form.gender)
    : "";

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <>

      <PopupModal
        isOpen={showSuccessModal}
        title={isEdit ? "Product Updated Successfully!" : "Product Saved Successfully!"}
        description={isEdit ? "Your product has been updated successfully." : "Your cosmetic product has been saved and is now live on the platform"}
        primaryActionText="View Product"
        secondaryActionText={isEdit ? "Continue Editing" : "Continue Adding"}
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={() => { router.push(`/seller_7a3b9f2c/products/view/${resolvedProductId}`); }}
        onSecondaryAction={isEdit ? () => setShowSuccessModal(false) : () => { setShowSuccessModal(false); router.push("/seller_7a3b9f2c/products/add"); }}
        onTertiaryAction={() => { router.push("/seller_7a3b9f2c/dashboard"); }}
        onClose={() => setShowSuccessModal(false)}
      />

      {showAdditionalDiscount && (
        <CommonModal
          onClose={() => {
            setShowAdditionalDiscount(false);
            setEditTab(null);
            setEditIndex(null);
          }}
          width="w-[600px]"
        >
            <AdditionalDiscountType
              onClose={() => {
                setShowAdditionalDiscount(false);
                setEditTab(null);
                setEditIndex(null);
              }}
              categoryId={productCategoryId}
              initialData={form.additionalDiscount}
              baseDiscountPercentage={Number(form.discountPercentage) || 0}
              baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
              onSaveAdditionalDiscount={(data) => {
                setForm((prev) => ({
                  ...prev,
                  additionalDiscount: data,
                }));

              }}
              initialSchemesData={form.specialSchemes}
              onSaveSpecialSchemes={(data) => {
                setForm((prev) => ({
                  ...prev,
                  specialSchemes: data || [],
                }));

              }}
              editTab={editTab}
              editIndex={editIndex}
            />
        </CommonModal>
      )}

      <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5 w-full">
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
              {isEdit ? (
                <NonEditableField label="Product Name" value={form.productName} required />
              ) : (
                <Input label="Product Name" name="productName" placeholder="e.g., Hydrating Face Serum"
                  value={form.productName} onChange={handleChange} error={errors.productName} required />
              )}
            </div>

            <div data-field="brandName">
              {isEdit ? (
                <NonEditableField label="Brand Name" value={form.brandName} required />
              ) : (
                <Input label="Brand Name" name="brandName" placeholder="e.g., Lakme, Neutrogena, Mamaearth"
                  value={form.brandName} onChange={handleChange} error={errors.brandName} required />
              )}
            </div>

            <div className="flex flex-col gap-1" data-field="productTypeId">
              {isEdit ? (
                <NonEditableSelect label="Product Type" value={displayLabels.productTypeLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Product Type {requiredStar}</label>
                  <Dropdown
                    options={productTypeOptions}
                    isLoading={loadingProductTypes}
                    value={form.productTypeId}
                    onChange={(val, label) => handleSelectChange("productTypeId", { value: val, label })}
                    placeholder={loadingProductTypes ? "Loading..." : "Select product type"}
                    error={errors.productTypeId ? " " : ""}
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
                  <Dropdown
                    options={productSubTypeOptions}
                    isLoading={loadingSubTypes}
                    isDisabled={!form.productTypeId}
                    value={form.productSubTypeId}
                    onChange={(val, label) => handleSelectChange("productSubTypeId", { value: val, label })}
                    placeholder={form.productTypeId ? (loadingSubTypes ? "Loading..." : "Select sub-type") : "Select product type first"}
                    error={errors.productSubTypeId ? " " : ""}
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
                  <Dropdown
                    options={genderOptions}
                    value={form.gender}
                    onChange={(val, label) => handleSelectChange("gender", { value: val, label })}
                    placeholder="Select gender"
                    error={errors.gender ? " " : ""}
                  />
                  {errors.gender && <p className={errorMsg}>{errors.gender}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1" ref={setFieldRef("intendedUseAreas") as React.RefCallback<HTMLDivElement>} data-field="intendedUseAreas">
              <label className={fieldLabel}>Intended Use Area {requiredStar}</label>
              <CheckboxDropdown
                options={intendedUseAreaOptions}
                selectedValues={selectedIntendedUseAreas}
                onChange={(vals) => {
                  setSelectedIntendedUseAreas(vals);
                  if (errors.intendedUseAreas) setErrors((p) => { const n = { ...p }; delete n.intendedUseAreas; return n; });
                }}
                placeholder={loadingIntendedUseAreas ? "Loading..." : "Select intended use area(s)"}
                disabled={loadingIntendedUseAreas}
                error={errors.intendedUseAreas ? " " : ""}
                showSelectAll={false}
              />
              {errors.intendedUseAreas && <p className={errorMsg}>{errors.intendedUseAreas}</p>}
            </div>

            <div className="flex flex-col gap-1" data-field="productFormId">
              {isEdit ? (
                <NonEditableSelect
                  label="Product Form"
                  value={productFormOptions.find((o) => o.value === form.productFormId)?.label || form.productFormId}
                  required
                />
              ) : (
                <>
                  <label className={fieldLabel}>Product Form {requiredStar}</label>
                  <Dropdown
                    options={productFormOptions}
                    isLoading={loadingProductForms}
                    value={form.productFormId}
                    onChange={(val, label) => {
                      handleSelectChange("productFormId", { value: val, label });
                      if (errors.productFormId) setErrors((p) => { const n = { ...p }; delete n.productFormId; return n; });
                    }}
                    placeholder={loadingProductForms ? "Loading..." : "Eg, Gel, Powder"}
                    error={errors.productFormId ? " " : ""}
                  />
                  {errors.productFormId && <p className={errorMsg}>{errors.productFormId}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1" data-field="netQuantity">
              {isEdit ? (
                <NonEditableField
                  label="Net Quantity"
                  value={`${form.netQuantity} ${netQuantityUnitOptions.find((o) => o.value === form.netQuantityUnitId)?.label || ""}`.trim()}
                  required
                />
              ) : (
                <>
                  <label className={fieldLabel}>Net Quantity {requiredStar}</label>
                  <div className="relative" ref={unitDropdownRef}>
                    <div className={`flex items-center h-[52px] border rounded-lg overflow-hidden ${errors.netQuantity || errors.netQuantityUnitId ? "border-warning-500" : "border-pneutral-300"}`}>
                      <input
                        name="netQuantity"
                        value={form.netQuantity}
                        onChange={handleChange}
                        placeholder="e.g., 100"
                        maxLength={10}
                        className="flex-1 h-full px-4 text-base bg-white focus:outline-none border-none outline-none text-pneutral-800 placeholder:text-pneutral-500"
                      />
                      <div className="h-full border-l border-neutral-300 flex-shrink-0"></div>
                      <button
                        type="button"
                        onClick={() => setShowUnitDropdown(p => !p)}
                        className="w-[149px] h-full px-3 bg-pneutral-50 flex items-center justify-between gap-1 hover:bg-neutral-100 transition-colors flex-shrink-0"
                      >
                        <span
                          className={netQuantityUnitOptions.find(o => o.value === form.netQuantityUnitId)?.label ? "text-pneutral-800" : "text-pneutral-500"}
                          style={{ fontWeight: 400, fontSize: "16px", lineHeight: "24px" }}
                        >
                          {loadingNetQuantityUnits ? "..." : (netQuantityUnitOptions.find(o => o.value === form.netQuantityUnitId)?.label || "Select Unit")}
                        </span>
                        <svg className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${showUnitDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {showUnitDropdown && (
                      <div className="absolute right-0 top-[calc(100%+4px)] w-[149px] max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col py-1">
                        {netQuantityUnitOptions.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              handleSelectChange("netQuantityUnitId", { value: opt.value, label: opt.label });
                              if (errors.netQuantityUnitId) setErrors(p => { const n = { ...p }; delete n.netQuantityUnitId; return n; });
                              setShowUnitDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm text-pneutral-800 hover:bg-pneutral-50 transition-colors cursor-pointer ${form.netQuantityUnitId === opt.value ? "bg-neutral-50 font-semibold" : "font-medium"}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.netQuantity && <p className={errorMsg}>{errors.netQuantity}</p>}
                  {errors.netQuantityUnitId && <p className={errorMsg}>{errors.netQuantityUnitId}</p>}
                </>
              )}
            </div>

            {skinHairRule.skinType !== "hidden" && (
              <div className="flex flex-col gap-1" ref={setFieldRef("skinTypes") as React.RefCallback<HTMLDivElement>} data-field="skinTypes">
                {isEdit ? (
                  <NonEditableField
                    label={skinHairRule.skinType === "mandatory" ? "Skin Type" : "Skin Type (optional)"}
                    value={selectedSkinTypes.map(id => skinTypeOptions.find(o => o.value === id)?.label || id).filter(Boolean).join(", ")}
                    required={skinHairRule.skinType === "mandatory"}
                  />
                ) : (
                  <>
                    <label className={fieldLabel}>
                      {skinHairRule.skinType === "mandatory" ? "Skin Type" : "Skin Type (optional)"}
                      {skinHairRule.skinType === "mandatory" && requiredStar}
                    </label>
                    <CheckboxDropdown
                      options={skinTypeOptions}
                      selectedValues={selectedSkinTypes}
                      onChange={(vals) => {
                        setSelectedSkinTypes(vals);
                        if (errors.skinTypes) setErrors((p) => { const n = { ...p }; delete n.skinTypes; return n; });
                      }}
                      placeholder={loadingSkinTypes ? "Loading..." : "Select skin type(s)"}
                      disabled={loadingSkinTypes}
                      error={errors.skinTypes ? " " : ""}
                      showSelectAll={false}
                    />
                    {errors.skinTypes && <p className={errorMsg}>{errors.skinTypes}</p>}
                  </>
                )}
              </div>
            )}

            {skinHairRule.hairType !== "hidden" && (
              <div className="flex flex-col gap-1" ref={setFieldRef("hairTypes") as React.RefCallback<HTMLDivElement>} data-field="hairTypes">
                {isEdit ? (
                  <NonEditableField
                    label={skinHairRule.hairType === "mandatory" ? "Hair Type" : "Hair Type (optional)"}
                    value={selectedHairTypes.map(id => hairTypeOptions.find(o => o.value === id)?.label || id).filter(Boolean).join(", ")}
                    required={skinHairRule.hairType === "mandatory"}
                  />
                ) : (
                  <>
                    <label className={fieldLabel}>
                      {skinHairRule.hairType === "mandatory" ? "Hair Type" : "Hair Type (optional)"}
                      {skinHairRule.hairType === "mandatory" && requiredStar}
                    </label>
                    <CheckboxDropdown
                      options={hairTypeOptions}
                      selectedValues={selectedHairTypes}
                      onChange={(vals) => {
                        setSelectedHairTypes(vals);
                        if (errors.hairTypes) setErrors((p) => { const n = { ...p }; delete n.hairTypes; return n; });
                      }}
                      placeholder={loadingHairTypes ? "Loading..." : "Select hair type(s)"}
                      disabled={loadingHairTypes}
                      error={errors.hairTypes ? " " : ""}
                      showSelectAll={false}
                    />
                    {errors.hairTypes && <p className={errorMsg}>{errors.hairTypes}</p>}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1" ref={setFieldRef("ageGroupId") as React.RefCallback<HTMLDivElement>} data-field="ageGroupId">
              {isEdit ? (
                <NonEditableField
                  label="Age Group"
                  value={selectedAgeGroups.map(id => ageGroupOptions.find(o => o.value === id)?.label || id).filter(Boolean).join(", ")}
                  required
                />
              ) : (
                <>
                  <label className={fieldLabel}>Age Group {requiredStar}</label>
                  <CheckboxDropdown
                    options={ageGroupOptions}
                    selectedValues={selectedAgeGroups}
                    onChange={(vals) => {
                      setSelectedAgeGroups(vals);
                      if (errors.ageGroupId) setErrors((p) => { const n = { ...p }; delete n.ageGroupId; return n; });
                    }}
                    placeholder={loadingAgeGroups ? "Loading..." : "Select age group(s)"}
                    disabled={loadingAgeGroups}
                    error={errors.ageGroupId ? " " : ""}
                    showSelectAll={false}
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
                  <Dropdown
                    options={countryOptions}
                    isLoading={loadingCountries}
                    value={form.countryOfOriginId}
                    onChange={(val, label) => handleSelectChange("countryOfOriginId", { value: val, label })}
                    placeholder={loadingCountries ? "Loading..." : "Select country"}
                    error={errors.countryOfOriginId ? " " : ""}
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
              {hasStock ? (
                <NonEditableSelect label="Storage Condition" value={displayLabels.storageConditionLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Storage Condition {requiredStar}</label>
                  <Dropdown
                    options={storageConditionOptions}
                    isLoading={loadingStorageConditions}
                    value={form.storageConditionId}
                    onChange={(val, label) => handleSelectChange("storageConditionId", { value: val, label })}
                    placeholder={loadingStorageConditions ? "Loading..." : "Select storage condition"}
                    error={errors.storageConditionId ? " " : ""}
                  />
                  {errors.storageConditionId && <p className={errorMsg}>{errors.storageConditionId}</p>}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1" data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
              <CheckboxDropdown
                options={certificationMasterOptions}
                selectedValues={selectedCertifications.map(c => c.id)}
                onChange={(values) => {
                  // In edit mode, preserve any certs already loaded from the server
                  const preservedIds = isEdit
                    ? selectedCertifications.filter((c) => c.existingUrl).map((c) => c.id)
                    : [];
                  const finalValues = Array.from(new Set([...values, ...preservedIds]));
                  const newCerts = finalValues.map(val => {
                    const existing = selectedCertifications.find(c => c.id === val);
                    if (existing) return existing;
                    const opt = certificationMasterOptions.find(o => o.value === val);
                    return {
                      id: val,
                      label: opt?.label || "",
                      tagCode: opt?.tagCode || "",
                      file: null,
                      fileName: "",
                      uploading: false,
                      isUploaded: false,
                      previewUrl: null,
                      productCertificateDocumentId: opt?.certificationId || 0,
                      existingUrl: undefined,
                    };
                  });
                  setSelectedCertifications(newCerts);
                  if (errors.certifications) setErrors((p) => { const n = { ...p }; delete n.certifications; return n; });
                }}
                placeholder={loadingCertifications ? "Loading..." : "Select certifications"}
                disabled={loadingCertifications}
                showSelectAll={false}
                error={errors.certifications ? " " : ""}
              />
              {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
            </div>

            {selectedCertifications.length === 0 ? (
              <div className="flex flex-col gap-1 col-span-1" data-field="certUploadFallback">
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
                <div key={cert.id} className="flex flex-col gap-1 col-span-1">
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
                    hasError={!!errors[`certFile_${cert.id}`]}
                  />
                  {errors[`certFile_${cert.id}`] && <p className={errorMsg}>{errors[`certFile_${cert.id}`]}</p>}
                </div>
              ))
            )}

            <div data-field="brochure">
              <UploadInput
                onFileSelect={(file) => setBrochureFile(file)}
                existingFile={existingBrochureUrl || undefined}
              />
            </div>

            <div className="flex flex-col gap-1" data-field="activeIngredients">
              <label className={fieldLabel}>Active Ingredients {requiredStar}</label>
              <textarea
                ref={setFieldRef("activeIngredients") as React.RefCallback<HTMLTextAreaElement>}
                name="activeIngredients" value={form.activeIngredients} onChange={handleChange} rows={2}
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
                name="productClaims" value={form.productClaims} onChange={handleChange} rows={2}
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

            <div className="flex flex-col gap-1" data-field="productDescription">
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
            <div className="flex flex-col gap-1" data-field="packTypeId">
              {hasStock ? (
                <NonEditableSelect label="Pack Type" value={displayLabels.packTypeLabel} required />
              ) : (
                <>
                  <label className={fieldLabel}>Pack Type {requiredStar}</label>
                  <Dropdown
                    options={packTypeOptions}
                    isLoading={loadingPackTypes}
                    value={form.packTypeId}
                    onChange={(val, label) => handleSelectChange("packTypeId", { value: val, label })}
                    placeholder={loadingPackTypes ? "Loading..." : "Select pack type"}
                    error={errors.packTypeId ? " " : ""}
                  />
                  {errors.packTypeId && <p className={errorMsg}>{errors.packTypeId}</p>}
                </>
              )}
            </div>

            {hasStock ? (
              <NonEditableField label="Number of Units per Pack Type" value={form.unitsPerPack} required />
            ) : (
              <Input label="Number of Units per Pack Type" name="unitsPerPack" placeholder="e.g., 1"
                value={form.unitsPerPack} onChange={handleChange} error={errors.unitsPerPack} required />
            )}

            {hasStock ? (
              <NonEditableField label="Number of Packs" value={form.numberOfPacks} required />
            ) : (
              <Input label="Number of Packs" name="numberOfPacks" placeholder="e.g., 1"
                value={form.numberOfPacks} onChange={handleChange} error={errors.numberOfPacks} required />
            )}

            <Input
              label="Pack Size (No. of Units per Pack Type × No. of Packs)"
              name="packSize"
              value={form.packSize}
              readOnly
            />
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
                  value={form.batchNumber} onChange={handleChange} error={errors.batchNumber} required maxLength={20} />
              )}
            </div>

            <div className="relative">
              <Input
                label="Manufacturing Month"
                type="text"
                name="manufacturingDate"
                id="manufacturingDate"
                required
                readOnly={isEdit}
                value={
                  form.manufacturingDate instanceof Date && !isNaN(form.manufacturingDate.getTime())
                    ? `${String(form.manufacturingDate.getMonth() + 1).padStart(2, "0")}/${form.manufacturingDate.getFullYear()}`
                    : ""
                }
                placeholder="MM/YYYY"
                onChange={() => {}}
                onClick={() => { if (!isEdit) setShowManufacturingMonthPicker(true); }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                error={errors.manufacturingDate}
              />
              {showManufacturingMonthPicker && !isEdit && (
                <MonthPicker
                  selectedMonth={form.manufacturingDate ? form.manufacturingDate.getMonth() : new Date().getMonth()}
                  selectedYear={form.manufacturingDate ? form.manufacturingDate.getFullYear() : new Date().getFullYear()}
                  maxDate={new Date()}
                  onSelect={(month, year) => handleMonthSelect("manufacturingDate", month, year)}
                  onClose={() => setShowManufacturingMonthPicker(false)}
                />
              )}
            </div>

            <div className="relative">
              <Input
                label="Expiry Month"
                name="expiryDate"
                type="text"
                required
                readOnly={isEdit}
                value={
                  form.expiryDate instanceof Date && !isNaN(form.expiryDate.getTime())
                    ? `${String(form.expiryDate.getMonth() + 1).padStart(2, "0")}/${form.expiryDate.getFullYear()}`
                    : ""
                }
                placeholder="MM/YYYY"
                onChange={() => {}}
                onClick={() => { if (!isEdit) setShowExpiryMonthPicker(true); }}
                onFocus={() => { if (!isEdit) setShowExpiryMonthPicker(true); }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                error={errors.expiryDate}
              />
              {showExpiryMonthPicker && !isEdit && (
                <MonthPicker
                  selectedMonth={form.expiryDate ? form.expiryDate.getMonth() : new Date().getMonth()}
                  selectedYear={form.expiryDate ? form.expiryDate.getFullYear() : new Date().getFullYear()}
                  minDate={new Date(new Date().getFullYear(), new Date().getMonth() + 4, 1)}
                  maxDate={
                    form.manufacturingDate
                      ? new Date(form.manufacturingDate.getFullYear() + 5, form.manufacturingDate.getMonth(), 1)
                      : undefined
                  }
                  onSelect={(month, year) => handleMonthSelect("expiryDate", month, year)}
                  onClose={() => setShowExpiryMonthPicker(false)}
                />
              )}
            </div>

            <Input
              type="number"
              label="Shelf Life (In Months)"
              name="shelfLifeMonths"
              value={form.shelfLifeMonths}
              readOnly
            />

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
                  onClick={() => {
                      setEditTab(null);
                      setEditIndex(null);
                      setShowAdditionalDiscount(true);
                    }}
                  className="w-59.25 h-14 px-6 border-[2.5px] border-secondary-700 text-secondary-700 text-label-l4 font-semibold rounded-lg flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <img src="/icons/PlusIcon.svg" alt="drug" className="w-6 h-6" />
                  Add Special Offers
                </button>
              </div>
            </div>

            <AppliedOffersView
              additionalDiscounts={form.additionalDiscount}
              specialSchemes={form.specialSchemes}
              productName={form.productName}
              onEditDiscount={(index) => {
                setEditTab("additional_discount");
                setEditIndex(index);
                setShowAdditionalDiscount(true);
              }}
              onDeleteDiscount={(index) =>
                setForm((prev) => ({
                  ...prev,
                  additionalDiscount: prev.additionalDiscount.map((d, i) =>
                    i === index ? { ...d, displayOffer: false, isSelected: false } : d
                  ),
                }))
              }
              onEditScheme={(index) => {
                setEditTab("special_schemes");
                setEditIndex(index);
                setShowAdditionalDiscount(true);
              }}
              onDeleteScheme={(index) =>
                setForm((prev) => ({
                  ...prev,
                  specialSchemes: prev.specialSchemes.map((s: any, i: number) =>
                    i === index ? { ...s, displayOfferScheme: false, isSelected: false } : s
                  ),
                }))
              }
              isEditMode={isEdit}
            />

            {/* <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Final Price (Auto-calculated)</label>
              <input name="finalPrice" value={form.finalPrice} readOnly
                className="w-full h-[52px] px-4 border border-[#C0C1BE] rounded-[8px] text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed" />
            </div> */}
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
                  <Dropdown
                    options={gstOptions}
                    value={form.gstPercentage}
                    onChange={(val, label) => handleSelectChange("gstPercentage", { value: val, label })}
                    placeholder="Select GST %"
                    error={errors.gstPercentage ? " " : ""}
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

        {/* ── Section 3: Product Photos ─────────────────────────────────────────── */}
        <div ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>} data-field="images">
          <ProductImageUpload
            title="Product Photos"
            required={mode === "create"}
            images={images}
            setImages={setImages}
            existingImages={existingImages}
            setExistingImages={setExistingImages}
            error={errors.images}
            setErrors={setErrors}
            isReadOnly={false}
            mode={mode}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 pb-8">
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 border-2 border-red-400 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
              Cancel
            </button>
            <button type="button" style={{ background: "#9F75FC", borderRadius: "8px" }}
              className="px-5 py-3 text-white text-base [font-family:'Open_Sans',sans-serif] font-semibold leading-[22px] flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/icons/SaveDraftIcon.svg" alt="save draft" className="w-5 h-5 object-contain" />
              Save Draft
            </button>
          </div>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            style={{ background: "#4B0082", borderRadius: "8px" }}
            className="px-8 py-3 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </button>
        </div>
      </form>
    </>
  );
};

export default CosmeticForm;
