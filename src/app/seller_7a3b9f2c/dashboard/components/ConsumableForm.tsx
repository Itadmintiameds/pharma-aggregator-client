"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Input from "@/src/app/commonComponents/Input";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import UploadInput from "../commonComponent/UploadInput";
import AdditionalDiscountType from "./AdditionalDiscountType";
import AppliedOffersView from "./AppliedOffersView";
import PopupModal from "../commonComponent/PopupModal";
import CommonModal from "../commonComponent/CommonModal";
import { AlertCircle } from "lucide-react";
import MonthPicker from "@/src/app/commonComponents/MonthPicker";
import ProductImageUpload from "../commonComponent/ProductImageUpload";
import { getProductById, uploadProductImages, updateProduct } from "@/src/services/product/ProductService";
import { validateBatchNumber } from "@/src/services/product/PricingService";
import { getGstPercentages } from "@/src/services/product/GstPercentageService";
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
const inputDisabled = "w-full h-12 px-4 border border-gray-200 rounded-xl text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] bg-gray-50 cursor-default flex items-center";

const UploadCloudIcon = () => (
  <img src="/icons/upload-cloud.svg" alt="upload" className="w-5 h-5 object-contain" />
);

const NonEditableField = ({ label, value, required }: { label: string; value: string; required?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className={fieldLabel}>{label} {required && requiredStar}</label>
    <div className={inputDisabled} style={{ color: "#5A5B58" }}>{value || "—"}</div>
  </div>
);

const NonEditableSelect = ({ label, value, required }: { label: string; value: string; required?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className={fieldLabel}>{label} {required && requiredStar}</label>
    <div className={inputDisabled} style={{ color: "#5A5B58" }}>{value || "—"}</div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ConsumableForm = ({ productId, mode = "create", onSubmitSuccess }: ConsumableFormProps) => {
  const router = useRouter();

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
  const [gstOptions, setGstOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<CertificationMasterOption[]>([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  const [specificationUnitOptions, setSpecificationUnitOptions] = useState<SelectOption[]>([]);
  const [loadingSpecificationUnits, setLoadingSpecificationUnits] = useState(false);

  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingMaterialTypes, setLoadingMaterialTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string>("");
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);
  const [mandatoryCertCount, setMandatoryCertCount] = useState(0);

  const [showManufacturingMonthPicker, setShowManufacturingMonthPicker] = useState(false);
  const [showExpiryMonthPicker, setShowExpiryMonthPicker] = useState(false);
  const [showAdditionalDiscountModal, setShowAdditionalDiscountModal] = useState(false);
  const [editTab, setEditTab] = useState<"additional_discount" | "special_schemes" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);
  const [specialSchemes, setSpecialSchemes] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftModalError, setDraftModalError] = useState(false);

  const sterileOptions: SelectOption[] = [
    { value: "sterile", label: "Sterile" },
    { value: "non-sterile", label: "Non-Sterile" },
  ];
  const disposableOptions: SelectOption[] = [
    { value: "disposable", label: "Disposable" },
    { value: "reusable", label: "Reusable" },
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
      const gstVal = String(pricing.gstPercentage ?? attribute.gstPercentage ?? data.gstPercentage ?? "");

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
        mrp: pricing.mrp != null ? String(pricing.mrp) : "",
        sellingPricePerPack: pricing.sellingPrice != null ? String(pricing.sellingPrice) : "",
        discountPercentage: String(pricing.discountPercentage || ""),
        gstPercentage: gstVal,
        hsnCode: String(pricing.hsnCode || attribute.hsnCode || data.hsnCode || ""),
        finalPrice: String(pricing.finalPrice || ""),
        shelfLifeMonths: String(computeShelfLife(mfgDate, expDate) ?? ""),
      });

      if (pricing.additionalDiscounts?.length) {
        setAdditionalDiscountSlabs(convertToDiscountSlab(pricing.additionalDiscounts));
      }
      if (pricing.specialSchemes?.length) {
        setSpecialSchemes(pricing.specialSchemes);
      }

      if (data.productImages?.length) {
        setExistingImages(
          data.productImages.map((img: { productImage?: string; imageUrl?: string }) =>
            img.productImage || img.imageUrl || "",
          ).filter(Boolean),
        );
      }

      const isRealUrl = (u: string) => !!u && !["PENDING", "NOT_UPLOADED"].includes(u.toUpperCase());
      if (isRealUrl(attribute.brochurePath)) {
        setExistingBrochureUrl(attribute.brochurePath);
      }

      if (attribute.certificateDocuments?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedCerts = attribute.certificateDocuments.map((cert: any) => ({
          id: String(cert.certificationId),
          label: cert.certificationName || `Certificate ${cert.certificationId}`,
          tagCode: `Tag ${String(cert.certificationId).padStart(2, "0")}`,
          file: null,
          fileName: isRealUrl(cert.certificateUrl) ? cert.certificateUrl.split("/").pop() || "" : "",
          uploading: false,
          isUploaded: isRealUrl(cert.certificateUrl),
          previewUrl: null,
          productCertificateDocumentId: Number(cert.productCertificateDocumentId),
          existingUrl: cert.certificateUrl || undefined,
        }));
        setSelectedCertifications(mappedCerts);
        setMandatoryCertCount(mappedCerts.length);
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

      let resolvedCerts: CertificationMasterOption[] = fallbackCerts;
      try {
        if (certificationsResult.status === "fulfilled" && Array.isArray(certificationsResult.value)) {
          const mapped = (certificationsResult.value as MasterItem[])
            .map((item, idx) => ({
              value: getMasterStr(item, "certificationId", "id"),
              label: getMasterStr(item, "certificationName", "name") || "Unknown",
              certificationId: Number(getMasterStr(item, "certificationId", "id") || String(idx + 1)),
              tagCode: `Tag ${String(idx + 1).padStart(2, "0")}`,
            }))
            .filter((o) => o.value);
          if (mapped.length > 0) resolvedCerts = mapped;
        }
      } catch {
        resolvedCerts = fallbackCerts;
      }

      setDeviceCategoryOptions(resolvedCategories);
      setCountryOptions(resolvedCountries);
      setStorageConditionOptions(resolvedStorage);
      setPackTypeApiOptions(resolvedPackTypes);
      setMaterialTypeOptions(resolvedMaterialTypes);
      setCertificationMasterOptions(resolvedCerts);

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

    loadAll().catch(() => {
      setLoadingCertifications(false);
    });

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

  // Fetch valid GST % values from the master list
  useEffect(() => {
    (async () => {
      try {
        const response = await getGstPercentages();
        const options = response
          .map((item: any) => ({
            label: `${item.gstPercentageValue}%`,
            value: String(item.gstPercentageValue),
          }))
          .sort((a: any, b: any) => Number(a.value) - Number(b.value));
        setGstOptions(options);
      } catch (error) {
        console.error("Error fetching GST percentages:", error);
      }
    })();
  }, []);

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

  // Close unit dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node)) setShowUnitDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    let value = e.target.value;

    // Field-specific sanitization
    if (name === "unitsPerPack") {
      value = value.replace(/\D/g, "");
      if (value.length > 5) value = value.slice(0, 5);
    } else if (name === "numberOfPacks") {
      value = value.replace(/\D/g, "");
      if (value.length > 4) value = value.slice(0, 4);
    } else if (name === "minimumOrderQuantity" || name === "maximumOrderQuantity") {
      value = value.replace(/\D/g, "");
      if (value.length > 7) value = value.slice(0, 7);
    } else if (name === "mrp" || name === "sellingPricePerPack") {
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
    } else if (name === "sizeDimension") {
      if (value !== "" && !/^[a-zA-Z0-9\s.×x]*$/.test(value)) return;
      if (value.startsWith(" ")) return;
      if (/\d+\.\d{3,}/.test(value)) return;
    }

    const maxLengths: Record<string, number> = { productName: 150, brandName: 60, manufacturerName: 100, productDescription: 1000, sizeDimension: 20, batchLotNumber: 20 };
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
      const spVal  = Number(updated.sellingPricePerPack) || 0;
      if ((name === "mrp" || name === "sellingPricePerPack") && mrpVal && spVal) {
        setErrors((prev) => {
          const n = { ...prev };
          if (spVal > mrpVal) n.sellingPricePerPack = "Selling Price must be ≤ MRP";
          else delete n.sellingPricePerPack;
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
      if (isNaN(v) || v < 0 || v > 100) setErrors((p) => ({ ...p, discountPercentage: "Discount must be between 0 and 100" }));
      else setErrors((p) => { const n = { ...p }; delete n.discountPercentage; return n; });
    }
    if (name === "batchLotNumber" && value.trim()) {
      checkBatchNumber(value);
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
      const isMandatory = mode === "edit" &&
        selectedCertifications.findIndex((c) => c.id === option.value) < mandatoryCertCount;
      if (isMandatory) {
        alert(`"${option.label}" is a mandatory certificate and cannot be removed. You may re-upload a new file for it instead.`);
        return;
      }
      setSelectedCertifications((p) => p.filter((c) => c.id !== option.value));
    } else {
      setSelectedCertifications((p) => [...p, {
        id: option.value, label: option.label, tagCode: option.tagCode,
        productCertificateDocumentId: option.certificationId,
        file: null, fileName: "", uploading: false, isUploaded: false, previewUrl: null,
      }]);
    }
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
    const key = `certFile_${certId}`;
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const handleCertRemove = (certId: string) => {
    setSelectedCertifications((prev) =>
      prev.map((c) => c.id === certId ? { ...c, file: null, fileName: "", isUploaded: false, existingUrl: undefined } : c)
    );
  };

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

  const handleViewProduct = () => { router.push(`/seller_7a3b9f2c/products/view/${resolvedProductId}`); };
  const handleContinueAdding = () => { setShowSuccessModal(false); router.push("/seller_7a3b9f2c/products/add"); };
  const handleBackToDashboard = () => { router.push("/seller_7a3b9f2c/dashboard"); };

  // ─── Batch number uniqueness check ────────────────────────────────────────

  const checkBatchNumber = async (batchLotNumber: string) => {
    try {
      const response = await validateBatchNumber(batchLotNumber, productCategoryId);
      if (response.exists) {
        setErrors((prev) => ({ ...prev, batchLotNumber: "Batch number already exists" }));
      } else {
        setErrors((prev) => { const n = { ...prev }; delete n.batchLotNumber; return n; });
      }
    } catch (error) {
      console.error("Batch validation failed:", error);
    }
  };

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
        e.sizeDimension = "Size / Dimension / Gauge is required";
      } else if (sDim.length > 20) {
        e.sizeDimension = "Maximum 20 characters allowed";
      } else if (/\d+\.\d{3,}/.test(sDim)) {
        e.sizeDimension = "Decimal values are allowed up to 2 digits after the decimal point";
      } else if (!/^[a-zA-Z0-9\s.×x]+$/.test(sDim)) {
        e.sizeDimension = "Only letters, numbers, spaces, and dimension separators (x, ×) are allowed";
      }
      if (!form.deviceSpecificationUnitId) e.deviceSpecificationUnitId = "Unit is required";
      if (!form.sterileStatus) e.sterileStatus = "Sterile status is required";
      if (!form.disposableType) e.disposableType = "Disposable / Reusable selection is required";
      if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin is required";
      const mName = form.manufacturerName.trim();
      if (!mName) e.manufacturerName = "Manufacturer name is required";
      else if (mName.length > 100) e.manufacturerName = "Manufacturer name must not exceed 100 characters";
      if (!form.storageCondition) e.storageCondition = "Storage condition is required";

      const gstVal = form.gstPercentage.trim();
      if (!gstVal) e.gstPercentage = "GST % is required";
      else if (!["0", "5", "8", "10", "12"].includes(gstVal)) e.gstPercentage = "Select a valid GST %";

      const hsnVal = form.hsnCode.trim();
      if (!hsnVal) e.hsnCode = "HSN Code is required";
      else {
        const hsnError = validateHSNCode(hsnVal);
        if (hsnError) e.hsnCode = hsnError;
      }
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

    if (mode === "edit" && Number(form.stockQuantity) === 0) {
      if (!form.storageCondition) e.storageCondition = "Storage condition is required";
    }

 
    if (images.length === 0 && existingImages.length === 0) e.images = "At least one product image is required";
    if (images.length + existingImages.length > 5) e.images = "Maximum 5 images allowed";

    for (const cert of selectedCertifications) {
      if (!cert.file && !cert.existingUrl) {
        e[`certFile_${cert.id}`] = `Please upload the certificate file for "${cert.label}"`;
      }
    }
    if (mode === "edit" && selectedCertifications.length < mandatoryCertCount) {
      e.certifications = `You must keep all ${mandatoryCertCount} original certifications. Please re-add any removed ones.`;
    }

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
    console.log("Submitting form:", form, "Images:", images, "Brochure:", brochureFile, "Certs:", selectedCertifications);
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

        gstPercentage: Number(form.gstPercentage),
        hsnCode: Number(form.hsnCode),
        status: "PUBLISHED" as const,

        productAttributeConsumableMedicals: [{
          ...(productAttributeId ? { productAttributeId } : {}),
          deviceCatId: Number(form.deviceCategoryId),
          deviceSubCatId: Number(form.deviceSubCategoryId),
          brandName: form.brandName,
          materialTypeId: selectedMaterialTypes.map(Number),
          dimensionSize: form.sizeDimension.trim() || null,
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
        retainedImageUrls: existingImages,
      };

      let currentProductId = resolvedProductId || productId || "";
      let currentAttributeId = productAttributeId;
      const certsToUpload: CertificationTag[] = [...selectedCertifications];

      if (mode === "edit" && currentProductId) {
        const updateData = await updateProduct(currentProductId, payload as any) as ApiResponseData;

        // For Excel-uploaded products the attributeId may not be pre-populated
        if (!currentAttributeId) {
          currentAttributeId = extractProductAttributeId(updateData) || "";
        }

        // Extract server-assigned productCertificateDocumentId values from the update response
        const certDocMap = extractCertDocumentIdMap(updateData);
        const finalCertsToUpload = certsToUpload.map((c) => {
          const serverDocId = certDocMap.get(Number(c.id));
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
        if (onSubmitSuccess) onSubmitSuccess();
        else setShowSuccessModal(true);
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

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const draftPayload = {
        productName: form.productName,
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.brochureUrl || "",
        manufacturerName: form.manufacturerName,
        categoryId: productCategoryId,

        gstPercentage: form.gstPercentage ? Number(form.gstPercentage) : undefined,
        hsnCode: form.hsnCode ? Number(form.hsnCode) : undefined,
        status: "DRAFT" as const,

        productAttributeConsumableMedicals: [{
          ...(productAttributeId ? { productAttributeId } : {}),
          deviceCatId: form.deviceCategoryId ? Number(form.deviceCategoryId) : undefined,
          deviceSubCatId: form.deviceSubCategoryId ? Number(form.deviceSubCategoryId) : undefined,
          brandName: form.brandName,
          materialTypeId: selectedMaterialTypes.map(Number),
          dimensionSize: form.sizeDimension.trim() || null,
          deviceSpecificationUnitId: form.deviceSpecificationUnitId ? Number(form.deviceSpecificationUnitId) : undefined,
          sterileOrNonSterile: form.sterileStatus === "sterile" ? "Sterile" : "Non-Sterile",
          disposalOrReusable: form.disposableType === "disposable" ? "Disposable" : "Reusable",
          purpose: form.intendedUse,
          keyFeaturesSpecifications: form.keyFeatures,
          safetyInstructions: form.safetyInstructions,
          countryId: form.countryOfOrigin ? Number(form.countryOfOrigin) : undefined,
          manufacturerName: form.manufacturerName,
          storageConditionId: form.storageCondition ? Number(form.storageCondition) : undefined,
          shelfLife: form.shelfLifeMonths,
          brochureType: "PDF",
          brochurePathStatus: existingBrochureUrl || (brochureFile ? "TO_UPLOAD" : "PENDING"),
          certificateDocuments: selectedCertifications.map((c) => ({
            certificationId: Number(c.id),
            certificateUrl: c.existingUrl || "PENDING",
          })),
        }],
        productImages: images.map(() => ({ productImage: "PENDING" })),
        retainedImageUrls: existingImages,
      };

      let currentProductId = resolvedProductId || productId || "";

      if (mode === "edit" && currentProductId) {
        await updateProduct(currentProductId, draftPayload as any);
        if (images.length > 0) await uploadProductImages(currentProductId, images);
      } else {
        const createData: ApiResponseData = await createConsumableProduct(draftPayload as Record<string, unknown>);
        const dataInner = createData?.data as ApiResponseData | undefined;
        const newProductId = String(dataInner?.productId ?? createData?.productId ?? "").trim();
        if (newProductId && newProductId !== "undefined") {
          currentProductId = newProductId;
          setResolvedProductId(newProductId);
        }
        if (currentProductId && images.length > 0) await uploadProductImages(currentProductId, images);
      }

      setDraftModalError(false);
      setShowDraftModal(true);
    } catch (err) {
      console.error("❌ Save Draft Error:", err);
      setDraftModalError(true);
      setShowDraftModal(true);
    } finally {
      setIsSavingDraft(false);
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
  const hasStock = isEdit && Number(form.stockQuantity) > 0;

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
        title={isEdit ? "Product Updated Successfully!" : "Product Saved Successfully!"}
        description={isEdit ? "Your product has been updated successfully." : "Your product has been saved and is now live on the platform"}
        primaryActionText="View Product"
        secondaryActionText={isEdit ? "Continue Editing" : "Continue Adding"}
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={handleViewProduct}
        onSecondaryAction={isEdit ? () => setShowSuccessModal(false) : handleContinueAdding}
        onTertiaryAction={handleBackToDashboard}
        onClose={() => setShowSuccessModal(false)}
      />

      <PopupModal
        isOpen={showDraftModal}
        title={draftModalError ? "Failed to Save Draft" : "Draft Saved!"}
        description={
          draftModalError
            ? "Something went wrong while saving your draft. Please try again."
            : "Your product has been saved as a draft."
        }
        primaryActionText="OK"
        celebrate={!draftModalError}
        onPrimaryAction={() => setShowDraftModal(false)}
        onClose={() => setShowDraftModal(false)}
      />

      {showAdditionalDiscountModal && (
        <CommonModal onClose={() => { setShowAdditionalDiscountModal(false); setEditTab(null); setEditIndex(null); }} width="w-[600px]">
          <AdditionalDiscountType
            initialData={convertToDiscountData(additionalDiscountSlabs)}
            baseDiscountPercentage={Number(form.discountPercentage) || 0}
            baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
            onSaveAdditionalDiscount={(data: AdditionalDiscountData[]) => {
              setAdditionalDiscountSlabs(convertToDiscountSlab(data));
              setShowAdditionalDiscountModal(false);
              setEditTab(null);
              setEditIndex(null);
            }}
            initialSchemesData={specialSchemes}
            onSaveSpecialSchemes={(data: any) => {
              setSpecialSchemes(data || []);
              setShowAdditionalDiscountModal(false);
              setEditTab(null);
              setEditIndex(null);
            }}
            onClose={() => { setShowAdditionalDiscountModal(false); setEditTab(null); setEditIndex(null); }}
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

        {/* ── Section 1: Product Details ───────────────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Product Details</h2>
          <div className="border-b border-neutral-200 mt-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 pt-6">

            {isEdit ? (
              <NonEditableField label="Product Name" value={form.productName} required />
            ) : (
              <Input label="Product Name" name="productName" placeholder="e.g., Surgical Mask, Syringe"
                value={form.productName} onChange={handleChange} error={errors.productName} required />
            )}

            {isEdit ? (
              <NonEditableSelect label="Device Category" value={displayLabels.deviceCategoryLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("deviceCategoryId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Device Category {requiredStar}</label>
                <Dropdown
                  options={deviceCategoryOptions}
                  isLoading={loadingCategories}
                  value={form.deviceCategoryId}
                  onChange={(val, label) => handleSelectChange("deviceCategoryId", { value: val, label })}
                  placeholder={loadingCategories ? "Loading..." : "Select category"}
                  error={errors.deviceCategoryId ? " " : ""}
                />
                {errors.deviceCategoryId && <p className={errorMsg}>{errors.deviceCategoryId}</p>}
              </div>
            )}

            {isEdit ? (
              <NonEditableSelect label="Device Sub-Category" value={displayLabels.deviceSubCategoryLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("deviceSubCategoryId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Device Sub-Category {requiredStar}</label>
                <Dropdown
                  options={deviceSubCategoryOptions}
                  isLoading={loadingSubCategories}
                  value={form.deviceSubCategoryId}
                  onChange={(val, label) => handleSelectChange("deviceSubCategoryId", { value: val, label })}
                  placeholder={form.deviceCategoryId ? (loadingSubCategories ? "Loading..." : "Select sub-category") : "Select category first"}
                  isDisabled={!form.deviceCategoryId}
                  error={errors.deviceSubCategoryId ? " " : ""}
                />
                {errors.deviceSubCategoryId && <p className={errorMsg}>{errors.deviceSubCategoryId}</p>}
              </div>
            )}

            {isEdit ? (
              <NonEditableField label="Brand Name" value={form.brandName} required />
            ) : (
              <Input label="Brand Name" name="brandName" placeholder="e.g., 3M, Johnson & Johnson"
                value={form.brandName} onChange={handleChange} error={errors.brandName} required />
            )}

            {/* Material Type */}
            {isEdit ? (
              <NonEditableField label="Material Type" value={materialTypesDisplayValue} required />
            ) : (
              <div className="flex flex-col gap-1" data-field="materialType">
                <label className={fieldLabel}>Material Type {requiredStar}</label>
                <CheckboxDropdown
                  options={materialTypeOptions}
                  selectedValues={selectedMaterialTypes}
                  onChange={(vals) => {
                    setSelectedMaterialTypes(vals);
                    if (errors.materialType) setErrors((p) => { const n = { ...p }; delete n.materialType; return n; });
                  }}
                  placeholder={loadingMaterialTypes ? "Loading..." : "Select material types"}
                  disabled={loadingMaterialTypes}
                  error={errors.materialType ? " " : ""}
                  showSelectAll={false}
                />
                {errors.materialType && <p className={errorMsg}>{errors.materialType}</p>}
              </div>
            )}

            {/* Size / Dimension / Gauge */}
            {isEdit ? (
              <NonEditableField
                label="Size / Dimension / Gauge"
                value={form.sizeDimension && displayLabels.specificationUnitLabel
                  ? `${form.sizeDimension} ${displayLabels.specificationUnitLabel}`
                  : form.sizeDimension || "—"}
                required
              />
            ) : (
              <div
                className="flex flex-col gap-1"
                ref={(el) => { fieldRefs.current["sizeDimension"] = el; fieldRefs.current["deviceSpecificationUnitId"] = el; }}
              >
                <label className={fieldLabel}>Size / Dimension / Gauge {requiredStar}</label>
                <div className="relative" ref={unitDropdownRef}>
                  <div className={`flex items-center h-[52px] border rounded-lg overflow-hidden ${errors.sizeDimension || errors.deviceSpecificationUnitId ? "border-warning-500" : "border-pneutral-300"}`}>
                    <input
                      name="sizeDimension"
                      value={form.sizeDimension}
                      onChange={handleChange}
                      placeholder="e.g., 22 × 25, M, Adult, 14"
                      maxLength={20}
                      className="flex-1 h-full px-4 text-base bg-white focus:outline-none border-none outline-none text-pneutral-800 placeholder:text-pneutral-500"
                    />
                    <div className="h-full border-l border-neutral-300 flex-shrink-0"></div>
                    <button
                      type="button"
                      onClick={() => form.deviceSubCategoryId && setShowUnitDropdown(p => !p)}
                      disabled={!form.deviceSubCategoryId}
                      className="w-[149px] h-full px-3 bg-pneutral-50 flex items-center justify-between gap-1 hover:bg-neutral-100 transition-colors flex-shrink-0 disabled:cursor-not-allowed"
                    >
                      <span className="truncate text-pneutral-800" style={{ fontWeight: 400, fontSize: "16px", lineHeight: "24px" }}>
                        {loadingSpecificationUnits ? "..." : (specificationUnitOptions.find(o => o.value === form.deviceSpecificationUnitId)?.label || (form.deviceSubCategoryId ? "Select Unit" : "Select sub-cat first"))}
                      </span>
                      <svg className={`w-4 h-4 text-neutral-500 transition-transform duration-200 flex-shrink-0 ${showUnitDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {showUnitDropdown && form.deviceSubCategoryId && (
                    <div className="absolute right-0 top-[calc(100%+4px)] w-[149px] max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col py-1">
                      {specificationUnitOptions.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => {
                            handleSelectChange("deviceSpecificationUnitId", { value: opt.value, label: opt.label });
                            if (errors.deviceSpecificationUnitId) setErrors(p => { const n = { ...p }; delete n.deviceSpecificationUnitId; return n; });
                            setShowUnitDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm text-pneutral-800 hover:bg-pneutral-50 transition-colors cursor-pointer ${form.deviceSpecificationUnitId === opt.value ? "bg-neutral-50 font-semibold" : "font-medium"}`}>
                          {opt.label}
                        </button>
                      ))}
                      {specificationUnitOptions.length === 0 && (
                        <div className="px-4 py-2 text-sm text-neutral-500">No units available</div>
                      )}
                    </div>
                  )}
                </div>
                {errors.sizeDimension && <p className={errorMsg}>{errors.sizeDimension}</p>}
                {errors.deviceSpecificationUnitId && <p className={errorMsg}>{errors.deviceSpecificationUnitId}</p>}
              </div>
            )}

            {/* Sterile status */}
            {isEdit ? (
              <NonEditableField label="Sterile / Non-Sterile" value={form.sterileStatus === "sterile" ? "Sterile" : form.sterileStatus ? "Non-Sterile" : "—"} required />
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
              <NonEditableField label="Disposable / Reusable" value={form.disposableType === "disposable" ? "Disposable" : form.disposableType ? "Reusable" : "—"} required />
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

            {/* Certifications — dropdown (editable in both modes; existing certs preserved in edit) */}
            <div className="flex flex-col gap-1" ref={setFieldRef("certifications") as React.RefCallback<HTMLDivElement>} data-field="certifications">
              <label className={fieldLabel}>Certifications &amp; Compliance {requiredStar}</label>
              <CheckboxDropdown
                options={certificationMasterOptions}
                selectedValues={selectedCertifications.map(c => c.id)}
                onChange={(values) => {
                  const preservedIds = isEdit
                    ? selectedCertifications.filter((c) => c.existingUrl).map((c) => c.id)
                    : [];
                  const finalValues = Array.from(new Set([...values, ...preservedIds]));
                  const newCerts = finalValues.map(val => {
                    const existing = selectedCertifications.find(c => c.id === val);
                    if (existing) return existing;
                    const opt = certificationMasterOptions.find(o => o.value === val);
                    return {
                      id: val, label: opt?.label || "", tagCode: opt?.tagCode || "",
                      file: null, fileName: "", uploading: false, isUploaded: false,
                      previewUrl: null, productCertificateDocumentId: opt?.certificationId || 0,
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

            {/* Certifications — upload (editable in both modes) */}
            {selectedCertifications.length === 0 ? (
              <div className="flex flex-col gap-1 col-span-1" data-field="certUploadFallback">
                <label className={fieldLabel}>Upload Certifications / Compliance {requiredStar}</label>
                <div className="flex items-center w-full h-[52px] rounded-lg border border-pneutral-300 bg-white overflow-hidden">
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

            {/* Country of Origin */}
            {isEdit ? (
              <NonEditableSelect label="Country of Origin" value={displayLabels.countryLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("countryOfOrigin") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Country of Origin {requiredStar}</label>
                <Dropdown
                  options={countryOptions}
                  value={form.countryOfOrigin}
                  onChange={(val, label) => handleSelectChange("countryOfOrigin", { value: val, label })}
                  placeholder="Select country"
                  error={errors.countryOfOrigin ? " " : ""}
                />
                {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
              </div>
            )}

            {isEdit ? (
              <NonEditableField label="Manufacturer Name" value={form.manufacturerName} required />
            ) : (
              <Input label="Manufacturer Name" name="manufacturerName" placeholder="Manufacturer company name"
                value={form.manufacturerName} onChange={handleChange} error={errors.manufacturerName} required />
            )}

            {isEdit ? (
              <NonEditableField label="GST %" value={form.gstPercentage} required />
            ) : (
              <Dropdown label="GST %" options={gstOptions}
                value={form.gstPercentage || ""}
                onChange={(value) => setForm((prev) => ({ ...prev, gstPercentage: value }))}
                placeholder="Select GST %" error={errors.gstPercentage} required />
            )}

            {isEdit ? (
              <NonEditableField label="HSN Code" value={form.hsnCode} required />
            ) : (
              <Input label="HSN Code" name="hsnCode" placeholder="e.g. 3926"
                value={form.hsnCode} onChange={handleChange} error={errors.hsnCode} required />
            )}

            {/* Storage Condition — locked after stock entry */}
            {hasStock ? (
              <NonEditableSelect label="Storage Condition" value={displayLabels.storageConditionLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("storageCondition") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Storage Condition {requiredStar}</label>
                <Dropdown
                  options={storageConditionOptions}
                  value={form.storageCondition}
                  onChange={(val, label) => handleSelectChange("storageCondition", { value: val, label })}
                  placeholder="Select storage condition"
                  error={errors.storageCondition ? " " : ""}
                />
                {errors.storageCondition && <p className={errorMsg}>{errors.storageCondition}</p>}
              </div>
            )}

            {/* Brochure */}
            <div ref={setFieldRef("brochure") as React.RefCallback<HTMLDivElement>}>
              <UploadInput
                onFileSelect={(file) => setBrochureFile(file)}
                existingFile={existingBrochureUrl || undefined}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Safety Instructions &amp; Precautions {requiredStar}</label>
              <textarea ref={setFieldRef("safetyInstructions") as React.RefCallback<HTMLTextAreaElement>}
                name="safetyInstructions" value={form.safetyInstructions} onChange={handleChange} rows={4}
                placeholder="Enter safety warnings, precautions, and handling instructions"
                className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.safetyInstructions ? "border-red-400" : "border-gray-300"}`} />
              {errors.safetyInstructions && <p className={errorMsg}>{errors.safetyInstructions}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Key Features &amp; Specifications {requiredStar}</label>
              <textarea ref={setFieldRef("keyFeatures") as React.RefCallback<HTMLTextAreaElement>}
                name="keyFeatures" value={form.keyFeatures} onChange={handleChange} rows={4}
                placeholder="List key features, technical specifications"
                className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.keyFeatures ? "border-red-400" : "border-gray-300"}`} />
              {errors.keyFeatures && <p className={errorMsg}>{errors.keyFeatures}</p>}
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                name="productDescription" value={form.productDescription} onChange={handleChange} rows={4}
                placeholder="Detailed product description"
                className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.productDescription ? "border-red-400" : "border-gray-300"}`} />
              {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
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

        {/* ── Actions ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 pb-8">
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 border-2 border-red-400 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
              Cancel
            </button>
            {mode !== "edit" && (
              <button type="button" onClick={handleSaveDraft} disabled={isSavingDraft}
                style={{ background: "#9F75FC", borderRadius: "8px" }}
                className="px-5 py-3 text-white text-base [font-family:'Open_Sans',sans-serif] font-semibold leading-[22px] flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60">
                <img src="/icons/SaveDraftIcon.svg" alt="save draft" className="w-5 h-5 object-contain" />
                {isSavingDraft ? "Saving..." : "Save Draft"}
              </button>
            )}
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

export default ConsumableForm;