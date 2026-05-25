"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Input from "@/src/app/commonComponents/Input";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import UploadInput from "../commonComponent/UploadInput";
import AdditionalDiscount from "./AdditionalDiscount";
import PopupModal from "../commonComponent/PopupModal";
import CommonModal from "../commonComponent/CommonModal";
import { X, AlertCircle } from "lucide-react";
import { getProductById, uploadProductImages, updateProduct } from "@/src/services/product/ProductService";
import {
  getConsumableDeviceCategories,
  getConsumableDeviceSubCategories,
  getConsumableMaterialTypes,
  getConsumableStorageConditions,
  getConsumableCountries,
  getConsumableCertifications,
  getConsumablePackTypes,
  createConsumableProduct,
  uploadConsumableCertificate,
  uploadConsumableBrochure,
  getStorageConditionsByCategoryId,
  getConsumableCertificationsByCategoryId,
  getConsumableSpecificationUnitsBySubCategory,
} from "@/src/services/product/ConsumbaleService";
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

interface ConsumableFormProps {
  productId?: string;
  mode?: "create" | "edit";
  onSubmitSuccess?: () => void;
  deviceType?: "consumable" | "non-consumable";
}

interface CertificationMasterOption {
  value: string;
  label: string;
  certificationId: number;
  tagCode: string;
}

interface MasterItem { [key: string]: unknown; }
interface ApiResponseData { [key: string]: unknown; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateHSNCode(hsnCode: string): string | null {
  const trimmed = hsnCode.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return "HSN code must contain numeric digits only";
  if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(trimmed)) return "HSN code must be 4, 6, or 8 digits";
  return null;
}

function computeShelfLife(mfgDate: Date | null, expDate: Date | null): number | null {
  if (!mfgDate || !expDate) return null;
  const totalMonths = (expDate.getFullYear() - mfgDate.getFullYear()) * 12 + (expDate.getMonth() - mfgDate.getMonth());
  return totalMonths > 0 ? totalMonths : null;
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
    const attrs = dataInner?.productAttributeConsumableMedicals;
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
  const s1 = dataInner?.productAttributeConsumableMedicals;
  if (Array.isArray(s1) && s1.length > 0) { const id = (s1[0] as ApiResponseData)?.productAttributeId; if (id != null) return String(id); }
  const s2 = data?.productAttributeConsumableMedicals;
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

const fieldLabel = "font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle text-pneutral-900";
const requiredStar = <span className="text-warning-500 font-semibold ml-1">*</span>;
const errorMsg = "font-heading font-normal text-sm leading-[28px] px-1 text-warning-500";
const sectionCard = "relative border border-neutral-200 rounded-xl p-6 bg-white";
const sectionTitle = "text-h4 font-semibold";
const subSectionTitle = "text-h6 font-normal mt-5";

const UploadCloudIcon = () => (
  <img src="/icons/upload-cloud.svg" alt="upload" className="w-5 h-5 object-contain" />
);

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

// ─── Component ────────────────────────────────────────────────────────────────

const ConsumableForm = ({ productId, mode = "create", onSubmitSuccess }: ConsumableFormProps) => {
  const router = useRouter();
  const todayStr = new Date().toISOString().split("T")[0];

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef = (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const [form, setForm] = useState({
    productName: "",
    deviceCategoryId: "",
    deviceSubCategoryId: "",
    brandName: "",
    sizeDimension: "",
    deviceSpecificationUnitId: "",
    sterileStatus: "",
    disposableType: "",
    intendedUse: "",
    keyFeatures: "",
    safetyInstructions: "",
    countryOfOrigin: "",
    manufacturerName: "",
    storageCondition: "",
    productDescription: "",
    brochureUrl: "",
    packType: "",
    unitsPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    batchLotNumber: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    stockQuantity: "",
    dateOfStockEntry: new Date(),
    mrp: "",
    sellingPricePerPack: "",
    discountPercentage: "",
    gstPercentage: "",
    hsnCode: "",
    finalPrice: "",
    shelfLifeMonths: "",
  });
  const [resolvedProductId, setResolvedProductId] = useState("");
  const [productAttributeId, setProductAttributeId] = useState("");
  const [packagingId, setPackagingId] = useState("");
  const [pricingId, setPricingId] = useState("");
  const productCategoryId = 5;

  // Display labels for edit mode (non-editable fields)
  const [displayLabels, setDisplayLabels] = useState({
    deviceCategoryLabel: "",
    deviceSubCategoryLabel: "",
    packTypeLabel: "",
    countryLabel: "",
    storageConditionLabel: "",
    gstLabel: "",
    materialTypesLabel: "",
    specificationUnitLabel: "",
  });

  // Master option lists
  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [deviceSubCategoryOptions, setDeviceSubCategoryOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);
  const [packTypeApiOptions, setPackTypeApiOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<CertificationMasterOption[]>([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [specificationUnitOptions, setSpecificationUnitOptions] = useState<SelectOption[]>([]);
  const [loadingSpecificationUnits, setLoadingSpecificationUnits] = useState(false);

  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingMaterialTypes, setLoadingMaterialTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string>("");
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

  const [showAdditionalDiscountModal, setShowAdditionalDiscountModal] = useState(false);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const sterileOptions: SelectOption[] = [
    { value: "sterile", label: "Sterile" },
    { value: "non-sterile", label: "Non-Sterile" },
  ];
  const disposableOptions: SelectOption[] = [
    { value: "disposable", label: "Disposable" },
    { value: "reusable", label: "Reusable" },
  ];
  const gstOptions: SelectOption[] = [
    { value: "0", label: "0%" },
    { value: "5", label: "5%" },
    { value: "12", label: "12%" },
    { value: "18", label: "18%" },
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

  // ─── Sub-category fetch ────────────────────────────────────────────────────

  const fetchDeviceSubCategories = useCallback(async (categoryId: string): Promise<SelectOption[]> => {
    if (!categoryId) { setDeviceSubCategoryOptions([]); return []; }
    setLoadingSubCategories(true);
    try {
      const items: MasterItem[] = await getConsumableDeviceSubCategories(categoryId);
      const opts = items
        .map((i) => ({
          value: getMasterStr(i, "deviceSubCatId", "subCategoryId", "id"),
          label: getMasterStr(i, "deviceSubCatName", "subCategoryName", "name") || "Unknown",
        }))
        .filter((o) => o.value);
      setDeviceSubCategoryOptions(opts);
      return opts;
    } catch {
      setDeviceSubCategoryOptions([]);
      return [];
    } finally {
      setLoadingSubCategories(false);
    }
  }, []);

  const fetchSpecificationUnits = useCallback(async (subCategoryId: string): Promise<SelectOption[]> => {
    if (!subCategoryId) { setSpecificationUnitOptions([]); return []; }
    setLoadingSpecificationUnits(true);
    try {
      const items: MasterItem[] = await getConsumableSpecificationUnitsBySubCategory(subCategoryId);
      const opts = items
        .map((i) => ({
          value: getMasterStr(i, "unitId", "id"),
          label: getMasterStr(i, "unitName", "name", "unit") || "Unknown",
        }))
        .filter((o) => o.value);
      setSpecificationUnitOptions(opts);
      return opts;
    } catch {
      setSpecificationUnitOptions([]);
      return [];
    } finally {
      setLoadingSpecificationUnits(false);
    }
  }, []);

  // ─── Load product for edit (called after all masters are ready) ────────────

  const fetchProductData = useCallback(async (
    currentCategoryOptions: SelectOption[],
    currentSubCategoryOptions: SelectOption[],
    currentCountryOptions: SelectOption[],
    currentStorageOptions: SelectOption[],
    currentPackTypeOptions: SelectOption[],
    currentMaterialTypeOptions: SelectOption[],
  ) => {
    if (mode !== "edit" || !productId) return;
    setLoadingProduct(true);
    try {
      const data = await getProductById(productId);
      if (!data) throw new Error("Product not found");

      setResolvedProductId(data.productId || productId);
      const attribute = data.productAttributeConsumableMedicals?.[0] || {};
      const packaging = (Array.isArray(data.packagingDetails) ? data.packagingDetails[0] : data.packagingDetails) || {};
      const pricing = data.pricingDetails?.[0] || {};

      setProductAttributeId(String(attribute.productAttributeId || ""));
      setPackagingId(String(packaging.packagingId || ""));
      setPricingId(String(pricing.pricingId || ""));

      const mfgRaw = String(pricing.manufacturingDate || "");
      const expRaw = String(pricing.expiryDate || "");
      const mfgDate = mfgRaw ? new Date(mfgRaw.split("T")[0]) : null;
      const expDate = expRaw ? new Date(expRaw.split("T")[0]) : null;

      const deviceCatIdStr = String(attribute.deviceCatId || "");
      const deviceSubCatIdStr = String(attribute.deviceSubCatId || "");
      const countryIdStr = String(attribute.countryId || "");
      const storageCondIdStr = String(attribute.storageConditionId || "");
      const packIdStr = String(packaging.packId || "");
      const gstVal = String(pricing.gstPercentage ?? "");

      // Fetch sub-categories for this category so we can resolve the label
      let resolvedSubCats = currentSubCategoryOptions;
      if (deviceCatIdStr && resolvedSubCats.length === 0) {
        resolvedSubCats = await fetchDeviceSubCategories(deviceCatIdStr);
      }

      // Fetch specification units for sub-category
      let resolvedSpecUnits: SelectOption[] = [];
      if (deviceSubCatIdStr) {
        resolvedSpecUnits = await fetchSpecificationUnits(deviceSubCatIdStr);
      }
      const specUnitIdStr = String(attribute.deviceSpecificationUnitId || "");

      // Resolve material type labels
      const materialTypeIds: string[] = Array.isArray(attribute.materialTypeId)
        ? attribute.materialTypeId.map(String)
        : [];
      const materialTypesLabel = materialTypeIds
        .map((id) => currentMaterialTypeOptions.find((o) => o.value === id)?.label || id)
        .filter(Boolean)
        .join(", ");

      setDisplayLabels({
        deviceCategoryLabel: currentCategoryOptions.find((o) => o.value === deviceCatIdStr)?.label || deviceCatIdStr,
        deviceSubCategoryLabel: resolvedSubCats.find((o) => o.value === deviceSubCatIdStr)?.label || deviceSubCatIdStr,
        packTypeLabel: currentPackTypeOptions.find((o) => o.value === packIdStr)?.label || packIdStr,
        countryLabel: currentCountryOptions.find((o) => o.value === countryIdStr)?.label || countryIdStr,
        storageConditionLabel: currentStorageOptions.find((o) => o.value === storageCondIdStr)?.label || storageCondIdStr,
        gstLabel: gstOptions.find((o) => o.value === gstVal)?.label || (gstVal ? `${gstVal}%` : ""),
        materialTypesLabel,
        specificationUnitLabel: resolvedSpecUnits.find((o) => o.value === specUnitIdStr)?.label || specUnitIdStr,
      });

      setSelectedMaterialTypes(materialTypeIds);

      setForm({
        productName: data.productName || "",
        deviceCategoryId: deviceCatIdStr,
        deviceSubCategoryId: deviceSubCatIdStr,
        brandName: attribute.brandName || "",
        sizeDimension: attribute.dimensionSize != null ? String(attribute.dimensionSize) : "",
        deviceSpecificationUnitId: specUnitIdStr,
        sterileStatus: (attribute.sterileOrNonSterile || "").toLowerCase() === "sterile" ? "sterile" : "non-sterile",
        disposableType: (attribute.disposalOrReusable || "").toLowerCase() === "disposable" ? "disposable" : "reusable",
        intendedUse: attribute.purpose || "",
        keyFeatures: attribute.keyFeaturesSpecifications || "",
        safetyInstructions: attribute.safetyInstructions || data.warningsPrecautions || "",
        countryOfOrigin: countryIdStr,
        manufacturerName: data.manufacturerName || attribute.manufacturerName || "",
        storageCondition: storageCondIdStr,
        productDescription: data.productDescription || "",
        brochureUrl: data.productMarketingUrl || "",
        packType: packIdStr,
        unitsPerPack: String(packaging.unitPerPack || ""),
        numberOfPacks: String(packaging.numberOfPacks || ""),
        packSize: String(packaging.packSize || ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity || ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity || ""),
        batchLotNumber: pricing.batchLotNumber || "",
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        stockQuantity: String(pricing.stockQuantity || ""),
        dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
        mrp: String(pricing.mrp || ""),
        sellingPricePerPack: String(pricing.sellingPrice || ""),
        discountPercentage: String(pricing.discountPercentage || ""),
        gstPercentage: gstVal,
        hsnCode: String(pricing.hsnCode || ""),
        finalPrice: String(pricing.finalPrice || ""),
        shelfLifeMonths: String(computeShelfLife(mfgDate, expDate) ?? ""),
      });

      if (pricing.additionalDiscounts?.length) {
        setAdditionalDiscountSlabs(convertToDiscountSlab(pricing.additionalDiscounts));
      }

      if (data.productImages?.length) {
        setExistingImages(
          data.productImages.map((img: { productImage?: string; imageUrl?: string }) =>
            img.productImage || img.imageUrl || "",
          ).filter(Boolean),
        );
      }

      if (attribute.brochurePath && attribute.brochurePath !== "PENDING") {
        setExistingBrochureUrl(attribute.brochurePath);
      }

      if (attribute.certificateDocuments?.length) {
        setSelectedCertifications(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attribute.certificateDocuments.map((cert: any) => ({
            id: String(cert.certificationId),
            label: cert.certificationName || `Certificate ${cert.certificationId}`,
            tagCode: `Tag ${String(cert.certificationId).padStart(2, "0")}`,
            file: null,
            fileName:
              cert.certificateUrl && cert.certificateUrl !== "PENDING"
                ? cert.certificateUrl.split("/").pop() || ""
                : "",
            uploading: false,
            isUploaded: !!(cert.certificateUrl && cert.certificateUrl !== "PENDING"),
            previewUrl: null,
            productCertificateDocumentId: Number(cert.productCertificateDocumentId),
            existingUrl:
              cert.certificateUrl && cert.certificateUrl !== "PENDING"
                ? cert.certificateUrl
                : undefined,
          })),
        );
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setApiError("Failed to load product data. Please refresh and try again.");
    } finally {
      setLoadingProduct(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productId, fetchDeviceSubCategories, fetchSpecificationUnits]);

  // ─── Load all masters, then product (sequenced like CosmeticForm) ──────────

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      setLoadingCategories(true);
      setLoadingMaterialTypes(true);
      setLoadingCertifications(true);

      const [
        categoriesResult,
        countriesResult,
        storageResult,
        packTypesResult,
        materialTypesResult,
        certificationsResult,
      ] = await Promise.allSettled([
        getConsumableDeviceCategories(),
        getConsumableCountries(),
        getStorageConditionsByCategoryId(productCategoryId),
        getConsumablePackTypes(productCategoryId),
        getConsumableMaterialTypes(),
        getConsumableCertificationsByCategoryId(productCategoryId),
      ]);

      if (!mounted) return;

      const resolvedCategories: SelectOption[] =
        categoriesResult.status === "fulfilled"
          ? (categoriesResult.value as MasterItem[])
            .map((i) => ({ value: getMasterStr(i, "deviceCatId", "id"), label: getMasterStr(i, "deviceName", "name") || "Unknown" }))
            .filter((o) => o.value)
          : [];

      const resolvedCountries: SelectOption[] =
        countriesResult.status === "fulfilled"
          ? (countriesResult.value as MasterItem[])
            .map((i) => ({ value: getMasterStr(i, "countryId", "id"), label: getMasterStr(i, "countryName", "name") || "Unknown" }))
            .filter((o) => o.value)
          : [];

      const resolvedStorage: SelectOption[] =
        storageResult.status === "fulfilled"
          ? (storageResult.value as MasterItem[])
            .map((i) => ({ value: getMasterStr(i, "storageConditionId", "id"), label: getMasterStr(i, "conditionName", "name") || "Unknown" }))
            .filter((o) => o.value)
          : [];

      const resolvedPackTypes: SelectOption[] =
        packTypesResult.status === "fulfilled"
          ? (packTypesResult.value as MasterItem[])
            .map((i) => ({ value: getMasterStr(i, "packId"), label: getMasterStr(i, "packType") }))
            .filter((o) => o.value)
          : [];

      const resolvedMaterialTypes: SelectOption[] =
        materialTypesResult.status === "fulfilled"
          ? (materialTypesResult.value as MasterItem[])
            .map((i) => ({ value: getMasterStr(i, "materialTypeId", "id"), label: getMasterStr(i, "materialTypeName", "name") || "Unknown" }))
            .filter((o) => o.value)
          : [];

      const fallbackCerts: CertificationMasterOption[] = [
        { value: "1", label: "CDSCO Registration", certificationId: 1, tagCode: "Tag 01" },
        { value: "2", label: "ISO 13485", certificationId: 2, tagCode: "Tag 02" },
        { value: "3", label: "CE Certification", certificationId: 3, tagCode: "Tag 03" },
        { value: "4", label: "BIS Certification", certificationId: 4, tagCode: "Tag 04" },
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

      setDeviceCategoryOptions(resolvedCategories);
      setCountryOptions(resolvedCountries);
      setStorageConditionOptions(resolvedStorage);
      setPackTypeApiOptions(resolvedPackTypes);
      setMaterialTypeOptions(resolvedMaterialTypes);
      setCertificationMasterOptions(resolvedCerts.length ? resolvedCerts : fallbackCerts);

      setLoadingCategories(false);
      setLoadingMaterialTypes(false);
      setLoadingCertifications(false);

      // Fetch product AFTER all masters are ready — so label resolution works
      if (mode === "edit" && productId) {
        await fetchProductData(
          resolvedCategories,
          [], // sub-categories fetched inside fetchProductData based on deviceCatId
          resolvedCountries,
          resolvedStorage,
          resolvedPackTypes,
          resolvedMaterialTypes,
        );
      }
    };

    loadAll();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch sub-categories when product type changes (create mode only)
  useEffect(() => {
    if (!form.deviceCategoryId) {
      setDeviceSubCategoryOptions([]);
      return;
    }
    if (mode === "create") {
      fetchDeviceSubCategories(form.deviceCategoryId);
      setForm((p) => ({ ...p, deviceSubCategoryId: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.deviceCategoryId, mode]);

  // Fetch specification units when sub-category changes (create mode only)
  useEffect(() => {
    if (!form.deviceSubCategoryId) {
      setSpecificationUnitOptions([]);
      if (mode === "create") setForm((p) => ({ ...p, deviceSpecificationUnitId: "" }));
      return;
    }
    if (mode === "create") {
      fetchSpecificationUnits(form.deviceSubCategoryId);
      setForm((p) => ({ ...p, deviceSpecificationUnitId: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.deviceSubCategoryId, mode]);

  // Auto-compute pack size
  useEffect(() => {
    const u = parseFloat(form.unitsPerPack), p = parseFloat(form.numberOfPacks);
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0) {
      setForm((prev) => ({ ...prev, packSize: (u * p).toString() }));
    }
  }, [form.unitsPerPack, form.numberOfPacks]);

  // Auto-compute shelf life
  // Auto-compute final price
  useEffect(() => {
    const selling = parseFloat(form.sellingPricePerPack);
    const disc = parseFloat(form.discountPercentage);
    setForm((prev) => ({
      ...prev,
      finalPrice: !isNaN(selling) && selling > 0
        ? (isNaN(disc) ? selling : selling - (selling * disc) / 100).toFixed(2)
        : "0.00",
    }));
  }, [form.sellingPricePerPack, form.discountPercentage]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericOnlyFields = ["stockQuantity", "sellingPricePerPack", "mrp", "discountPercentage", "hsnCode", "unitsPerPack", "numberOfPacks", "minimumOrderQuantity", "maximumOrderQuantity", "sizeDimension"];
    if (numericOnlyFields.includes(name)) {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      if (value.startsWith("-")) return;
    }
    const maxLengths: Record<string, number> = { productName: 150, brandName: 60, manufacturerName: 100, productDescription: 1000, sizeDimension: 10 };
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

  const handleMaterialCheckbox = (option: SelectOption) => {
    setSelectedMaterialTypes((p) => p.includes(option.value) ? p.filter((v) => v !== option.value) : [...p, option.value]);
    if (errors.materialType) setErrors((p) => { const n = { ...p }; delete n.materialType; return n; });
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
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) { alert("Only PDF, JPG, JPEG, PNG files are allowed for certificates"); return; }
    setSelectedCertifications((prev) =>
      prev.map((c) => c.id === certId
        ? { ...c, file, fileName: file.name, uploading: false, isUploaded: true, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null, existingUrl: undefined }
        : c,
      ),
    );
    if (errors.certifications) setErrors((p) => { const n = { ...p }; delete n.certifications; return n; });
  };

  const handleCertRemove = (certId: string) => {
    setSelectedCertifications((prev) =>
      prev.map((c) => c.id === certId ? { ...c, file: null, fileName: "", isUploaded: false } : c)
    );
  };

  const handleImageFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
    const maxSizeBytes = 5 * 1024 * 1024;
    if (fileArr.find((f) => !allowedFormats.includes(f.type))) { setErrors((p) => ({ ...p, images: "Unsupported image format. Only JPG, JPEG, PNG are allowed." })); return; }
    if (fileArr.find((f) => f.size > maxSizeBytes)) { setErrors((p) => ({ ...p, images: "Image file size exceeds the maximum limit." })); return; }
    if (images.length + fileArr.length > 5) { setErrors((p) => ({ ...p, images: "Maximum 5 images allowed" })); return; }
    setImages((p) => [...p, ...fileArr]);
    setErrors((p) => { const n = { ...p }; delete n.images; return n; });
  };

  const handleViewProduct = () => { router.push(`/seller_7a3b9f2c/products/view/${resolvedProductId}`); };
  const handleContinueAdding = () => { setShowSuccessModal(false); router.push("/seller_7a3b9f2c/products/add"); };
  const handleBackToDashboard = () => { router.push("/seller_7a3b9f2c/dashboard"); };

  // ─── Validation ───────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

    if (mode === "create") {
      if (!form.deviceCategoryId) e.deviceCategoryId = "Device category is required";
      if (!form.deviceSubCategoryId) e.deviceSubCategoryId = "Device sub-category is required";
      const pName = form.productName.trim();
      if (!pName) e.productName = "Product name is required";
      else if (pName.length < 3) e.productName = "Product name must be at least 3 characters";
      else if (pName.length > 150) e.productName = "Product name must not exceed 150 characters";
      const bName = form.brandName.trim();
      if (!bName) e.brandName = "Brand name is required";
      else if (bName.length > 60) e.brandName = "Brand name must not exceed 60 characters";
      if (selectedMaterialTypes.length === 0) e.materialType = "At least one material type is required";
      const sDim = form.sizeDimension.trim();
      if (!sDim) {
        e.sizeDimension = "Size / Dimension is required";
      } else if (isNaN(Number(sDim)) || Number(sDim) <= 0) {
        e.sizeDimension = "Size / Dimension must be a positive number";
      }
      if (!form.deviceSpecificationUnitId) e.deviceSpecificationUnitId = "Unit is required";
      if (!form.sterileStatus) e.sterileStatus = "Sterile status is required";
      if (!form.disposableType) e.disposableType = "Disposable / Reusable selection is required";
      if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin is required";
      const mName = form.manufacturerName.trim();
      if (!mName) e.manufacturerName = "Manufacturer name is required";
      else if (mName.length > 100) e.manufacturerName = "Manufacturer name must not exceed 100 characters";
      if (selectedCertifications.length === 0) {
        e.certifications = "At least one certification / compliance is required";
      } else {
        const missing = selectedCertifications.find((c) => !c.file && !c.existingUrl);
        if (missing) e.certifications = `Please upload the certificate file for "${missing.label}"`;
      }
      if (!form.packType) e.packType = "Pack type is required";
      const bNum = form.batchLotNumber.trim();
      if (!bNum) e.batchLotNumber = "Batch / lot number is required";
      else if (!/^[a-zA-Z0-9]+$/.test(bNum)) e.batchLotNumber = "Batch number must be alphanumeric only";
      if (!form.manufacturingDate) e.manufacturingDate = "Manufacturing date is required";
      else {
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (form.manufacturingDate > currentMonth) e.manufacturingDate = "Manufacturing date cannot be in the future month";
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
      if (!form.gstPercentage) e.gstPercentage = "GST percentage is required";
      if (!form.hsnCode.trim()) e.hsnCode = "HSN code is required";
      else { const hsnErr = validateHSNCode(form.hsnCode); if (hsnErr) e.hsnCode = hsnErr; }
      if (!form.storageCondition) e.storageCondition = "Storage condition is required";
      if (images.length === 0) e.images = "Product Image upload is mandatory.";
    }

    const iUse = form.intendedUse.trim();
    if (!iUse) e.intendedUse = "Intended use / purpose is required";
    else if (iUse.length < 10) e.intendedUse = "Intended use must be at least 10 characters";

    const kFeat = form.keyFeatures.trim();
    if (!kFeat) e.keyFeatures = "Key features / specifications is required";
    else if (kFeat.length < 10) e.keyFeatures = "Key features must be at least 10 characters";

    const sInstr = form.safetyInstructions.trim();
    if (!sInstr) e.safetyInstructions = "Safety instructions / precautions is required";
    else if (sInstr.length < 10) e.safetyInstructions = "Safety instructions must be at least 10 characters";

    const pDesc = form.productDescription.trim();
    if (!pDesc) e.productDescription = "Product description is required";
    else if (pDesc.length > 1000) e.productDescription = "Product description must not exceed 1000 characters";

    if (mode === "edit") {
      if (!form.storageCondition) e.storageCondition = "Storage condition is required";
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

    const selling = parseFloat(form.sellingPricePerPack);
    if (!form.sellingPricePerPack.trim()) e.sellingPricePerPack = "Selling price is required";
    else if (isNaN(selling) || selling <= 0) e.sellingPricePerPack = "Selling price must be greater than 0";

    const mrp = parseFloat(form.mrp);
    if (!form.mrp.trim()) e.mrp = "MRP is required";
    else if (isNaN(mrp) || mrp <= 0) e.mrp = "MRP must be greater than 0";
    else if (!isNaN(selling) && mrp < selling) e.mrp = "MRP must be ≥ selling price";

    if (form.discountPercentage.trim() !== "") {
      const disc = parseFloat(form.discountPercentage);
      if (isNaN(disc) || disc < 0 || disc > 100) e.discountPercentage = "Discount percentage must be between 0 and 100";
    }

    if (mode === "create") {
      const stock = parseFloat(form.stockQuantity);
      if (!form.stockQuantity.trim()) e.stockQuantity = "Stock quantity is required";
      else if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be a positive value greater than 0";
      else if (!isNaN(minQ) && minQ > 0 && stock <= minQ) e.stockQuantity = "Stock quantity must be greater than minimum order quantity";
    }

    if (mode === "create" && images.length > 5) e.images = "Maximum 5 images allowed";

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
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.brochureUrl || "",
        manufacturerName: form.manufacturerName,
        categoryId: productCategoryId,
        packagingDetails: [{
          ...(packagingId ? { packagingId } : {}),
          packId: Number(form.packType),
          unitPerPack: Number(form.unitsPerPack),
          numberOfPacks: Number(form.numberOfPacks),
          packSize: Number(form.unitsPerPack) * Number(form.numberOfPacks),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        }],
        pricingDetails: [{
          ...(pricingId ? { pricingId } : {}),
          batchLotNumber: form.batchLotNumber,
          manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
          expiryDate: toLocalDateTimeString(form.expiryDate),
          stockQuantity: Number(form.stockQuantity),
          dateOfStockEntry: toLocalDateTimeString(form.dateOfStockEntry),
          sellingPrice: Number(form.sellingPricePerPack),
          mrp: Number(form.mrp),
          discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : 0,
          gstPercentage: Number(form.gstPercentage),
          finalPrice: Number(form.finalPrice),
          hsnCode: Number(form.hsnCode),
          additionalDiscounts: additionalDiscountSlabs,
        }],
        productAttributeConsumableMedicals: [{
          ...(productAttributeId ? { productAttributeId } : {}),
          deviceCatId: Number(form.deviceCategoryId),
          deviceSubCatId: Number(form.deviceSubCategoryId),
          brandName: form.brandName,
          materialTypeId: selectedMaterialTypes.map(Number),
          dimensionSize: parseFloat(form.sizeDimension) || 0,
          deviceSpecificationUnitId: Number(form.deviceSpecificationUnitId),
          sterileOrNonSterile: form.sterileStatus === "sterile" ? "Sterile" : "Non-Sterile",
          disposalOrReusable: form.disposableType === "disposable" ? "Disposable" : "Reusable",
          purpose: form.intendedUse,
          keyFeaturesSpecifications: form.keyFeatures,
          safetyInstructions: form.safetyInstructions,
          countryId: Number(form.countryOfOrigin),
          manufacturerName: form.manufacturerName,
          storageConditionId: form.storageCondition ? Number(form.storageCondition) : 0,
          shelfLife: form.shelfLifeMonths,
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
      const certsToUpload: CertificationTag[] = [...selectedCertifications];

      if (mode === "edit" && currentProductId) {
        await updateProduct(currentProductId, payload as any);
        if (images.length > 0) await uploadProductImages(currentProductId, images);
        if (currentAttributeId) {
          for (const cert of certsToUpload.filter((c) => c.file && !c.existingUrl)) {
            const result = await uploadConsumableCertificate(currentAttributeId, cert.productCertificateDocumentId, cert.file!);
            if (!result.success) setApiError(`Warning: Could not upload certificate "${cert.label}": ${result.message}`);
          }
          if (brochureFile) {
            const r = await uploadConsumableBrochure(currentAttributeId, brochureFile);
            if (!r.success) setApiError(`Warning: Brochure could not be uploaded — ${r.message}`);
          }
        }
        if (onSubmitSuccess) onSubmitSuccess();
        else router.push(`/seller_7a3b9f2c/products/view/${currentProductId}`);
      } else {
        const createData: ApiResponseData = await createConsumableProduct(payload as Record<string, unknown>);
        const dataInner = createData?.data as ApiResponseData | undefined;
        currentProductId = String(dataInner?.productId ?? createData?.productId ?? "").trim();
        if (!currentProductId || currentProductId === "undefined") throw new Error("Product ID not returned from server");
        setResolvedProductId(currentProductId);
        currentAttributeId = extractProductAttributeId(createData) || "";
        if (!currentAttributeId) throw new Error("Product attribute ID not returned from server — cannot upload certificates");

        const certDocIdMap = extractCertDocumentIdMap(createData);
        const finalCertsToUpload = certsToUpload.map((c) => {
          const serverDocId = certDocIdMap.get(c.productCertificateDocumentId);
          return serverDocId ? { ...c, productCertificateDocumentId: serverDocId } : c;
        });

        if (images.length > 0) await uploadProductImages(currentProductId, images);
        if (currentAttributeId) {
          for (const cert of finalCertsToUpload.filter((c) => c.file && !c.existingUrl)) {
            const result = await uploadConsumableCertificate(currentAttributeId, cert.productCertificateDocumentId, cert.file!);
            if (!result.success) setApiError(`Warning: Could not upload certificate "${cert.label}": ${result.message}`);
          }
          if (brochureFile) {
            const r = await uploadConsumableBrochure(currentAttributeId, brochureFile);
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

  // ─── Loading guard ────────────────────────────────────────────────────────

  if (loadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEdit = mode === "edit";

  // Resolved display for material types multi-select in edit mode
  const materialTypesDisplayValue = isEdit
    ? displayLabels.materialTypesLabel ||
    selectedMaterialTypes
      .map((v) => materialTypeOptions.find((o) => o.value === v)?.label || v)
      .filter(Boolean)
      .join(", ")
    : "";

  return (
    <>
      <PopupModal
        isOpen={showSuccessModal}
        title="Product Saved Successfully!"
        description="Your product has been saved and is now live on the platform"
        primaryActionText="View Product"
        secondaryActionText="Continue Adding"
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={handleViewProduct}
        onSecondaryAction={handleContinueAdding}
        onTertiaryAction={handleBackToDashboard}
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

      <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5 w-full">
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-red-700 text-sm whitespace-pre-line">{apiError}</span>
          </div>
        )}

        {/* ── Section 1: Product Details ───────────────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Product Details</h2>
          <div className="border-b border-neutral-200 mt-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-6">

            {isEdit ? (
              <Input label="Product Name" name="productName" value={form.productName} onChange={() => {}} required readOnly />
            ) : (
              <Input label="Product Name" name="productName" placeholder="e.g., Surgical Mask, Syringe"
                value={form.productName} onChange={handleChange} error={errors.productName} required />
            )}

            <div className="flex flex-col gap-0" data-field="deviceCategoryId">
              <label className={fieldLabel}>Device Category {requiredStar}</label>
              <Dropdown
                options={deviceCategoryOptions}
                value={form.deviceCategoryId}
                onChange={(val) => {
                  setForm(p => ({ ...p, deviceCategoryId: val }));
                  if (errors.deviceCategoryId) setErrors(p => { const n = { ...p }; delete n.deviceCategoryId; return n; });
                }}
                placeholder={loadingCategories ? "Loading..." : "Select category"}
                isLoading={loadingCategories}
                isDisabled={isEdit}
                error={errors.deviceCategoryId ? " " : ""}
              />
              {errors.deviceCategoryId && <p className={errorMsg}>{errors.deviceCategoryId}</p>}
            </div>

            <div className="flex flex-col gap-0" data-field="deviceSubCategoryId">
              <label className={fieldLabel}>Device Sub-Category {requiredStar}</label>
              <Dropdown
                options={deviceSubCategoryOptions}
                value={form.deviceSubCategoryId}
                onChange={(val) => {
                  setForm(p => ({ ...p, deviceSubCategoryId: val }));
                  if (errors.deviceSubCategoryId) setErrors(p => { const n = { ...p }; delete n.deviceSubCategoryId; return n; });
                }}
                placeholder={form.deviceCategoryId ? (loadingSubCategories ? "Loading..." : "Select sub-category") : "Select category first"}
                isLoading={loadingSubCategories}
                isDisabled={isEdit || !form.deviceCategoryId}
                error={errors.deviceSubCategoryId ? " " : ""}
              />
              {errors.deviceSubCategoryId && <p className={errorMsg}>{errors.deviceSubCategoryId}</p>}
            </div>

            {isEdit ? (
              <Input label="Brand Name" name="brandName" value={form.brandName} onChange={() => {}} required readOnly />
            ) : (
              <Input label="Brand Name" name="brandName" placeholder="e.g., 3M, Johnson & Johnson"
                value={form.brandName} onChange={handleChange} error={errors.brandName} required />
            )}

            {/* Material Type */}
            <div className="flex flex-col gap-0" data-field="materialType">
              <label className={fieldLabel}>Material Type {requiredStar}</label>
              <CheckboxDropdown
                options={materialTypeOptions}
                selectedValues={selectedMaterialTypes}
                onChange={(values) => {
                  setSelectedMaterialTypes(values);
                  if (errors.materialType) setErrors(p => { const n = { ...p }; delete n.materialType; return n; });
                }}
                placeholder={loadingMaterialTypes ? "Loading..." : "Select material types"}
                disabled={isEdit || loadingMaterialTypes}
                error={errors.materialType ? " " : ""}
                showSelectAll={false}
              />
              {errors.materialType && <p className={errorMsg}>{errors.materialType}</p>}
            </div>

            <div data-field="sizeDimension"
              ref={(el) => { fieldRefs.current["sizeDimension"] = el; fieldRefs.current["deviceSpecificationUnitId"] = el; }}
            >
              <NumericInputWithUnit
                label="Size / Dimension"
                name="sizeDimension"
                value={form.sizeDimension}
                unitId={form.deviceSpecificationUnitId}
                onValueChange={(val) => {
                  setForm(p => ({ ...p, sizeDimension: val }));
                  if (errors.sizeDimension) setErrors(p => { const n = { ...p }; delete n.sizeDimension; return n; });
                }}
                onUnitChange={(unitId) => {
                  handleSelectChange("deviceSpecificationUnitId", { value: unitId, label: "" } as SelectOption);
                }}
                placeholder="e.g., 10.5"
                error={errors.sizeDimension || errors.deviceSpecificationUnitId}
                required
                readOnly={isEdit}
                options={specificationUnitOptions}
                loading={loadingSpecificationUnits}
                unitDisabled={!form.deviceSubCategoryId}
              />
            </div>

            {/* Sterile status */}
            {isEdit ? (
              <Input label="Sterile / Non-Sterile" name="sterileStatus" value={form.sterileStatus === "sterile" ? "Sterile" : form.sterileStatus ? "Non-Sterile" : "—"} onChange={() => {}} required readOnly />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("sterileStatus") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Sterile / Non-Sterile {requiredStar}</label>
                <div className="flex gap-6 mt-1">
                  {sterileOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sterileStatus" value={option.value} checked={form.sterileStatus === option.value} onChange={handleChange} className="accent-purple-700 w-4 h-4" />
                      <span className="text-base [font-family:'Open_Sans',sans-serif] font-normal [color:#3C3D3A]">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.sterileStatus && <p className={errorMsg}>{errors.sterileStatus}</p>}
              </div>
            )}

            {/* Disposable type */}
            {isEdit ? (
              <Input label="Disposable / Reusable" name="disposableType" value={form.disposableType === "disposable" ? "Disposable" : form.disposableType ? "Reusable" : "—"} onChange={() => {}} required readOnly />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("disposableType") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Disposable / Reusable {requiredStar}</label>
                <div className="flex gap-6 mt-1">
                  {disposableOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="disposableType" value={option.value} checked={form.disposableType === option.value} onChange={handleChange} className="accent-purple-700 w-4 h-4" />
                      <span className="text-base [font-family:'Open_Sans',sans-serif] font-normal [color:#3C3D3A]">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.disposableType && <p className={errorMsg}>{errors.disposableType}</p>}
              </div>
            )}

            <Input label="Intended Use / Purpose" name="intendedUse" placeholder="e.g., For surgical procedures"
              value={form.intendedUse} onChange={handleChange} error={errors.intendedUse} required />

            {/* Certifications — dropdown */}
            <div className="flex flex-col gap-0" ref={setFieldRef("certifications") as React.RefCallback<HTMLDivElement>} data-field="certifications">
              <label className={fieldLabel}>Certifications &amp; Compliance {requiredStar}</label>
              <CheckboxDropdown
                options={certificationMasterOptions}
                selectedValues={selectedCertifications.map(c => c.id)}
                onChange={(values) => {
                  const newCerts = values.map(val => {
                    const existing = selectedCertifications.find(c => c.id === val);
                    if (existing) return existing;
                    const opt = certificationMasterOptions.find(o => o.value === val);
                    return {
                      id: val, label: opt?.label || "", tagCode: (opt as any)?.tagCode || opt?.label || "",
                      file: null, fileName: "", uploading: false, isUploaded: false, previewUrl: null,
                      productCertificateDocumentId: Number(val),
                    };
                  });
                  setSelectedCertifications(newCerts as any);
                  if (errors.certifications) setErrors(p => { const n = { ...p }; delete n.certifications; return n; });
                }}
                placeholder={loadingCertifications ? "Loading..." : "Select certifications"}
                disabled={loadingCertifications}
                error={errors.certifications ? " " : ""}
                showSelectAll={false}
              />
              {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
            </div>

            {/* Certifications — upload */}
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

            {/* Country of Origin */}
            <div className="flex flex-col gap-0" data-field="countryOfOrigin">
              <label className={fieldLabel}>Country of Origin {requiredStar}</label>
              <Dropdown
                options={countryOptions}
                value={form.countryOfOrigin}
                onChange={(val) => {
                  setForm(p => ({ ...p, countryOfOrigin: val }));
                  if (errors.countryOfOrigin) setErrors(p => { const n = { ...p }; delete n.countryOfOrigin; return n; });
                }}
                placeholder="Select country"
                isDisabled={isEdit}
                error={errors.countryOfOrigin ? " " : ""}
              />
              {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
            </div>

            {isEdit ? (
              <Input label="Manufacturer Name" name="manufacturerName" value={form.manufacturerName} onChange={() => {}} required readOnly />
            ) : (
              <Input label="Manufacturer Name" name="manufacturerName" placeholder="Manufacturer company name"
                value={form.manufacturerName} onChange={handleChange} error={errors.manufacturerName} required />
            )}

            {/* Storage Condition — editable in both modes */}
            <div className="flex flex-col gap-0" data-field="storageCondition">
              <label className={fieldLabel}>Storage Condition {requiredStar}</label>
              <Dropdown
                options={storageConditionOptions}
                value={form.storageCondition}
                onChange={(val) => {
                  setForm(p => ({ ...p, storageCondition: val }));
                  if (errors.storageCondition) setErrors(p => { const n = { ...p }; delete n.storageCondition; return n; });
                }}
                placeholder="Select storage condition"
                error={errors.storageCondition ? " " : ""}
              />
              {errors.storageCondition && <p className={errorMsg}>{errors.storageCondition}</p>}
            </div>

            {/* Brochure */}
            <div ref={setFieldRef("brochure") as React.RefCallback<HTMLDivElement>}>
              <UploadInput onFileSelect={(file) => setBrochureFile(file)} existingFile={existingBrochureUrl || undefined} />
            </div>

            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={fieldLabel}>Safety Instructions &amp; Precautions {requiredStar}</label>
                  <textarea ref={setFieldRef("safetyInstructions") as React.RefCallback<HTMLTextAreaElement>}
                    name="safetyInstructions" value={form.safetyInstructions} onChange={handleChange} rows={4}
                    placeholder="Enter safety warnings, precautions, and handling instructions"
                    className={`w-full h-36 px-4 rounded-lg p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] text-[#3C3D3A] placeholder:text-sneutral-400 resize-none overflow-y-auto border bg-white focus:outline-none transition-all duration-200 ${errors.safetyInstructions ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-neutral-500 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`} />
                  {errors.safetyInstructions && <p className={errorMsg}>{errors.safetyInstructions}</p>}
                </div>
                <div>
                  <label className={fieldLabel}>Key Features &amp; Specifications {requiredStar}</label>
                  <textarea ref={setFieldRef("keyFeatures") as React.RefCallback<HTMLTextAreaElement>}
                    name="keyFeatures" value={form.keyFeatures} onChange={handleChange} rows={4}
                    placeholder="List key features, technical specifications"
                    className={`w-full h-36 px-4 rounded-lg p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] text-[#3C3D3A] placeholder:text-sneutral-400 resize-none overflow-y-auto border bg-white focus:outline-none transition-all duration-200 ${errors.keyFeatures ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-neutral-500 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`} />
                  {errors.keyFeatures && <p className={errorMsg}>{errors.keyFeatures}</p>}
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                name="productDescription" value={form.productDescription} onChange={handleChange} rows={4}
                placeholder="Detailed product description"
                className={`w-full h-36 px-4 rounded-lg p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] text-[#3C3D3A] placeholder:text-sneutral-400 resize-none overflow-y-auto border bg-white focus:outline-none transition-all duration-200 ${errors.productDescription ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-neutral-500 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`} />
              {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
            </div>
          </div>
        </div>

        {/* ── Section 2: Packaging & Order Details ─────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Packaging &amp; Order Details</h2>
          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-6">

            <div className="flex flex-col gap-0" data-field="packType">
              <label className={fieldLabel}>Pack Type {requiredStar}</label>
              <Dropdown
                options={packTypeApiOptions}
                value={form.packType}
                onChange={(val) => {
                  setForm(p => ({ ...p, packType: val }));
                  if (errors.packType) setErrors(p => { const n = { ...p }; delete n.packType; return n; });
                }}
                placeholder="Select pack type"
                isDisabled={isEdit}
                error={errors.packType ? " " : ""}
              />
              {errors.packType && <p className={errorMsg}>{errors.packType}</p>}
            </div>

            <Input label="Number of Units per Pack Type" name="unitsPerPack" placeholder="e.g., 100"
              value={form.unitsPerPack} onChange={handleChange} error={errors.unitsPerPack} required />

            <Input label="Number of Packs" name="numberOfPacks" placeholder="e.g., 10"
              value={form.numberOfPacks} onChange={handleChange} error={errors.numberOfPacks} required />

            <Input label="Pack Size (No. of Units per Pack Type X No. of Packs)" name="packSize"
              value={form.packSize} readOnly />
          </div>

          <p className={subSectionTitle}>Order Details</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <Input label="Min Order Qty" name="minimumOrderQuantity" placeholder="e.g., 1"
              value={form.minimumOrderQuantity} onChange={handleChange} error={errors.minimumOrderQuantity} required />
            <Input label="Max Order Qty" name="maximumOrderQuantity" placeholder="e.g., 100"
              value={form.maximumOrderQuantity} onChange={handleChange} error={errors.maximumOrderQuantity} required />
          </div>

          <p className={subSectionTitle}>Batch Management</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">

            {isEdit ? (
              <Input label="Batch Number" name="batchLotNumber" value={form.batchLotNumber} onChange={() => {}} required readOnly />
            ) : (
              <Input label="Batch Number" name="batchLotNumber" placeholder="Alphanumeric only"
                value={form.batchLotNumber} onChange={handleChange} error={errors.batchLotNumber} required />
            )}

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
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setForm((prev) => ({ ...prev, expiryDate: null, shelfLifeMonths: "" }));
                  setErrors((prev) => { const n = { ...prev }; delete n.expiryDate; return n; });
                  return;
                }
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
              }}
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

            {isEdit ? (
              <Input label="Stock Quantity (in units)" name="stockQuantity" value={form.stockQuantity} onChange={() => {}} required readOnly />
            ) : (
              <Input label="Stock Quantity (in units)" name="stockQuantity" placeholder="e.g., 10"
                value={form.stockQuantity} onChange={handleChange} error={errors.stockQuantity} required />
            )}

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Date of Stock Entry {requiredStar}</label>
              <input type="date" name="dateOfStockEntry" value={todayStr} readOnly
                className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base [font-family:'Open_Sans',sans-serif] bg-gray-50 [color:#969793] cursor-not-allowed" />
            </div>
          </div>

          <p className={subSectionTitle}>Pricing</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <Input label="MRP (per Pack Size)" name="mrp" placeholder="e.g., 500"
              value={form.mrp} onChange={handleChange} error={errors.mrp} required />
            <Input label="Selling Price (per Pack Size)" name="sellingPricePerPack" placeholder="e.g., 450"
              value={form.sellingPricePerPack} onChange={handleChange} error={errors.sellingPricePerPack} required />
            <div className="col-span-1 md:col-span-2 flex items-end gap-4">
              <div className="w-1/2">
                <Input label="Discount Percentage (%)" name="discountPercentage" placeholder="0–100"
                  value={form.discountPercentage} onChange={handleChange} error={errors.discountPercentage} />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowAdditionalDiscountModal(true)}
                  className="w-[237px] h-[52px] bg-transparent border-[2.5px] border-[#7D32FC] text-[#9659FD] font-heading font-medium text-[18px] leading-[28px] rounded-lg flex items-center justify-center gap-[12px] cursor-pointer hover:bg-purple-50 transition-all duration-200"
                >
                  <svg width="14.24" height="14.24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M7 1v12M1 7h12" stroke="#9659FD" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <span>Add Special Discount</span>
                </button>
              </div>
            </div>
          </div>

          <p className={subSectionTitle}>TAX &amp; BILLING</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex flex-col gap-0" data-field="gstPercentage">
              <label className={fieldLabel}>GST % {requiredStar}</label>
              <Dropdown
                options={gstOptions}
                value={form.gstPercentage}
                onChange={(val) => {
                  setForm(p => ({ ...p, gstPercentage: val }));
                  if (errors.gstPercentage) setErrors(p => { const n = { ...p }; delete n.gstPercentage; return n; });
                }}
                placeholder="Select GST"
                isDisabled={isEdit}
                error={errors.gstPercentage ? " " : ""}
              />
              {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
            </div>

            {isEdit ? (
              <Input label="HSN Code" name="hsnCode" value={form.hsnCode} onChange={() => {}} required readOnly />
            ) : (
              <Input label="HSN Code" name="hsnCode" placeholder="4, 6, or 8 digit numeric code"
                value={form.hsnCode} onChange={handleChange} maxLength={8} error={errors.hsnCode} required />
            )}
          </div>
        </div>

        {/* ── Section 3: Product Photos ─────────────────────────────────────────── */}
        <div className={sectionCard} ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>} data-field="images">
          <div className="text-pneutral-700 font-normal text-sm">
            Product Photos <span className="text-warning-500 font-semibold ml-1">*</span>
          </div>

          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {existingImages.map((img, index) => (
                <div key={index} className="relative w-24 h-24 flex-shrink-0">
                  <img src={img} alt="product" className="w-full h-full object-cover rounded-md border border-pneutral-200" />
                  <button
                    onClick={() => setExistingImages(existingImages.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 text-pneutral-900 cursor-pointer text-xs px-1 rounded"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer"
            onClick={() => document.getElementById("ncFileInput")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files); }}>
            <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
              <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 rounded-md object-cover" />
                  <div className="text-label-l2 font-normal mt-4">Choose a file or drag &amp; drop it here</div>
                  <div className="text-label-l1 font-normal text-neutral-400">or click to browse JPEG, PNG, and SVG</div>
                </div>
              </div>
            </div>
          </div>

          <input id="ncFileInput" type="file" multiple accept="image/jpeg,image/png,image/jpg,image/svg+xml" className="hidden"
            onChange={(e) => { if (e.target.files) handleImageFiles(e.target.files); }} />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {images.map((file, index) => (
                <div key={index} className="relative w-24 h-24 flex-shrink-0">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-full object-cover rounded-md border border-pneutral-200"
                  />
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 text-pneutral-900 cursor-pointer text-xs px-1 rounded"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {errors.images && <p className={`${errorMsg} mt-2`}>{errors.images}</p>}
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────────── */}
        <div className="flex justify-between mt-6 col-span-2 mb-6">
          <div className="space-x-6 flex">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-35.25 h-12 border-2 border-warning-500 rounded-lg text-label-l4 font-medium text-warning-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-35.25 h-12 bg-secondary-700 text-pneutral-50 text-label-l4 font-medium rounded-lg flex items-center justify-center gap-2.5"
            >
              <img src="/icons/SaveDraftIcon.svg" alt="save" className="w-5 h-5 rounded-md object-cover" />
              Save Draft
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary-800 text-pneutral-50 text-label-l4 font-medium rounded-lg p-3 w-35.25 h-12 cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </button>
        </div>
      </div>
      </form>
    </>
  );
};

export default ConsumableForm;