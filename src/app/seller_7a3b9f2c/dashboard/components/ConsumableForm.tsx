"use client";

import { useRouter } from "next/navigation";
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

type SelectStyles = StylesConfig<SelectOption, false>;

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

const fieldLabel = "text-label-l4 font-medium text-pneutral-900";
const requiredStar = <span className="text-warning-500 ml-1">*</span>;
const errorMsg = "text-red-500 text-xs mt-1";
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
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const materialDropdownRef = useRef<HTMLDivElement>(null);

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
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

  const [showAdditionalDiscountModal, setShowAdditionalDiscountModal] = useState(false);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowCertDropdown(false);
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(e.target as Node)) setShowMaterialDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          packSize: Number(form.packSize),
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
        alert("Product updated successfully!");
        if (onSubmitSuccess) onSubmitSuccess();
        else window.location.reload();
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

  const unitSelectStyles = {
    control: (base: any) => ({
      ...base, minHeight: "52px", height: "52px", border: "none", boxShadow: "none",
      borderRadius: "0", cursor: "pointer", backgroundColor: "transparent", "&:hover": { border: "none" },
    }),
    valueContainer: (base: any) => ({ ...base, padding: "0 8px" }),
    indicatorsContainer: (base: any) => ({ ...base, height: "52px" }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base, color: state.isFocused ? "#7c3aed" : "#9ca3af", cursor: "pointer", "&:hover": { color: "#7c3aed" },
    }),
    option: (base: any, state: any) => ({
      ...base, backgroundColor: state.isSelected ? "#7c3aed" : state.isFocused ? "#f3f0ff" : "white",
      color: state.isSelected ? "white" : "#1f2937", cursor: "pointer",
      "&:active": { backgroundColor: "#7c3aed", color: "white" },
    }),
    placeholder: (base: any) => ({ ...base, color: "#969793" }),
    singleValue: (base: any) => ({ ...base, color: "#3C3D3A" }),
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

      <div className="flex flex-col gap-5 w-full">
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
                <Select options={deviceCategoryOptions} isLoading={loadingCategories}
                  value={deviceCategoryOptions.find((o) => o.value === form.deviceCategoryId) || null}
                  onChange={(sel) => handleSelectChange("deviceCategoryId", sel)}
                  placeholder={loadingCategories ? "Loading..." : "Select category"}
                  theme={selectTheme} styles={selectStyles("deviceCategoryId")} />
                {errors.deviceCategoryId && <p className={errorMsg}>{errors.deviceCategoryId}</p>}
              </div>
            )}

            {isEdit ? (
              <NonEditableSelect label="Device Sub-Category" value={displayLabels.deviceSubCategoryLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("deviceSubCategoryId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Device Sub-Category {requiredStar}</label>
                <Select options={deviceSubCategoryOptions} isLoading={loadingSubCategories} isDisabled={!form.deviceCategoryId}
                  value={deviceSubCategoryOptions.find((o) => o.value === form.deviceSubCategoryId) || null}
                  onChange={(sel) => handleSelectChange("deviceSubCategoryId", sel)}
                  placeholder={form.deviceCategoryId ? (loadingSubCategories ? "Loading..." : "Select sub-category") : "Select category first"}
                  theme={selectTheme} styles={selectStyles("deviceSubCategoryId")} />
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
                <div className="relative" ref={materialDropdownRef}>
                  <div onClick={() => setShowMaterialDropdown((p) => !p)} className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all bg-white ${errors.materialType ? "border-red-400" : "border-gray-300 hover:border-purple-600"}`}>
                    <span className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]" style={{ color: selectedMaterialTypes.length > 0 ? "#3C3D3A" : "#969793" }}>
                      {selectedMaterialTypes.length > 0
                        ? selectedMaterialTypes.map((v) => materialTypeOptions.find((o) => o.value === v)?.label).filter(Boolean).join(", ")
                        : "Select material types"}
                    </span>
                    <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${showMaterialDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {showMaterialDropdown && (
                    <div className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {loadingMaterialTypes ? <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div> : (
                        materialTypeOptions.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer">
                            <input type="checkbox" checked={selectedMaterialTypes.includes(opt.value)} onChange={() => handleMaterialCheckbox(opt)} className="accent-purple-600 w-4 h-4" />
                            <span className="text-base [font-family:'Open_Sans',sans-serif] [color:#3C3D3A]">{opt.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.materialType && <p className={errorMsg}>{errors.materialType}</p>}
              </div>
            )}

            {isEdit ? (
              <NonEditableField
                label="Size / Dimension"
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
                <label className={fieldLabel}>Size / Dimension {requiredStar}</label>
                <div className={`flex items-center border rounded-[8px] overflow-hidden ${errors.sizeDimension || errors.deviceSpecificationUnitId ? "border-[#FF3B3B]" : "border-[#C0C1BE]"}`}>
                  <input
                    name="sizeDimension"
                    value={form.sizeDimension}
                    onChange={handleChange}
                    placeholder="e.g., 10.5"
                    className="flex-1 h-[52px] px-4 text-base [font-family:'Open_Sans',sans-serif] bg-white focus:outline-none border-none outline-none"
                  />
                  <div className="w-px h-8 bg-[#C0C1BE] flex-shrink-0" />
                  <div className="w-36">
                    <Select
                      options={specificationUnitOptions}
                      isLoading={loadingSpecificationUnits}
                      isDisabled={!form.deviceSubCategoryId}
                      value={specificationUnitOptions.find((o) => o.value === form.deviceSpecificationUnitId) || null}
                      onChange={(sel) => handleSelectChange("deviceSpecificationUnitId", sel)}
                      placeholder={form.deviceSubCategoryId ? "Unit" : "Select sub-cat first"}
                      theme={selectTheme}
                      styles={unitSelectStyles}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                      menuPosition="fixed"
                    />
                  </div>
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

            {/* Certifications — dropdown */}
            <div className="flex flex-col gap-1" ref={setFieldRef("certifications") as React.RefCallback<HTMLDivElement>} data-field="certifications">
              {isEdit ? (
                <NonEditableField label="Certifications &amp; Compliance"
                  value={selectedCertifications.map((c) => c.label).join(", ")} required />
              ) : (
                <>
                  <label className={fieldLabel}>Certifications &amp; Compliance {requiredStar}</label>
                  <div className="relative" ref={dropdownRef}>
                    <div onClick={() => setShowCertDropdown((p) => !p)} className={`w-full h-14 px-4 border rounded-2xl flex items-center justify-between cursor-pointer transition-all bg-white ${errors.certifications ? "border-warning-500" : "border-neutral-500 hover:border-primary-900"}`}>
                      <span className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]" style={{ color: selectedCertifications.length > 0 ? "var(--pneutral-800)" : "var(--sneutral-400)" }}>
                        {selectedCertifications.length > 0 ? selectedCertifications.map((c) => c.label).join(", ") : "Select certifications"}
                      </span>
                      <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${showCertDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    {showCertDropdown && (
                      <div className="absolute z-20 w-full bg-white border border-neutral-200 mt-1 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                        {loadingCertifications ? <div className="px-4 py-3 text-neutral-500 text-sm">Loading...</div> : (
                          certificationMasterOptions.map((opt) => (
                            <label key={opt.value} className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer">
                              <input type="checkbox" checked={selectedCertifications.some((c) => c.id === opt.value)} onChange={() => handleCertCheckbox(opt)} className="accent-purple-600 w-4 h-4" />
                              <span className="text-base [font-family:'Open_Sans',sans-serif] [color:#3C3D3A]">{opt.label}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
                </>
              )}
            </div>

            {/* Certifications — upload */}
            {selectedCertifications.length === 0 ? (
              <div className="flex flex-col gap-1 col-span-1" data-field="certUploadFallback">
                <label className={fieldLabel}>Upload Certifications / Compliance {requiredStar}</label>
                <div className="flex items-center w-full h-[52px] rounded-lg border border-neutral-500 bg-white overflow-hidden">
                  <div className="flex items-center justify-center h-full px-4 bg-secondary-200">
                    <img src="/icons/UploadIcon.svg" className="w-6 h-6" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
                    <span className="text-pneutral-500 text-sm">Select certifications first</span>
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
                  />
                </div>
              ))
            )}

            {/* Country of Origin */}
            {isEdit ? (
              <NonEditableSelect label="Country of Origin" value={displayLabels.countryLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("countryOfOrigin") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Country of Origin {requiredStar}</label>
                <Select options={countryOptions} value={countryOptions.find((o) => o.value === form.countryOfOrigin) || null}
                  onChange={(sel) => handleSelectChange("countryOfOrigin", sel)}
                  placeholder="Select country" theme={selectTheme} styles={selectStyles("countryOfOrigin")} />
                {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
              </div>
            )}

            {isEdit ? (
              <NonEditableField label="Manufacturer Name" value={form.manufacturerName} required />
            ) : (
              <Input label="Manufacturer Name" name="manufacturerName" placeholder="Manufacturer company name"
                value={form.manufacturerName} onChange={handleChange} error={errors.manufacturerName} required />
            )}

            {/* Storage Condition — editable in both modes */}
            <div className="flex flex-col gap-1" ref={setFieldRef("storageCondition") as React.RefCallback<HTMLDivElement>}>
              <label className={fieldLabel}>Storage Condition {requiredStar}</label>
              <Select
                options={storageConditionOptions}
                value={storageConditionOptions.find((o) => o.value === form.storageCondition) || null}
                onChange={(sel) => handleSelectChange("storageCondition", sel)}
                placeholder="Select storage condition"
                theme={selectTheme} styles={selectStyles("storageCondition")}
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
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.safetyInstructions ? "border-red-400" : "border-gray-300"}`} />
                  {errors.safetyInstructions && <p className={errorMsg}>{errors.safetyInstructions}</p>}
                </div>
                <div>
                  <label className={fieldLabel}>Key Features &amp; Specifications {requiredStar}</label>
                  <textarea ref={setFieldRef("keyFeatures") as React.RefCallback<HTMLTextAreaElement>}
                    name="keyFeatures" value={form.keyFeatures} onChange={handleChange} rows={4}
                    placeholder="List key features, technical specifications"
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.keyFeatures ? "border-red-400" : "border-gray-300"}`} />
                  {errors.keyFeatures && <p className={errorMsg}>{errors.keyFeatures}</p>}
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                name="productDescription" value={form.productDescription} onChange={handleChange} rows={4}
                placeholder="Detailed product description"
                className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.productDescription ? "border-red-400" : "border-gray-300"}`} />
              {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
            </div>
          </div>
        </div>

        {/* ── Section 2: Packaging & Order Details ─────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Packaging &amp; Order Details</h2>
          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 pt-6">

            {isEdit ? (
              <NonEditableSelect label="Pack Type" value={displayLabels.packTypeLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("packType") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Pack Type {requiredStar}</label>
                <Select options={packTypeApiOptions} value={packTypeApiOptions.find((o) => o.value === form.packType) || null}
                  onChange={(sel) => handleSelectChange("packType", sel)}
                  placeholder="Select pack type" theme={selectTheme} styles={selectStyles("packType")} />
                {errors.packType && <p className={errorMsg}>{errors.packType}</p>}
              </div>
            )}

            <Input label="Number of Units per Pack Type" name="unitsPerPack" placeholder="e.g., 100"
              value={form.unitsPerPack} onChange={handleChange} error={errors.unitsPerPack} required />

            <Input label="Number of Packs" name="numberOfPacks" placeholder="e.g., 10"
              value={form.numberOfPacks} onChange={handleChange} error={errors.numberOfPacks} required />

            <Input label="Pack Size (No. of Units per Pack Type X No. of Packs)" name="packSize"
              value={form.packSize} readOnly />
          </div>

          <p className={subSectionTitle}>Order Details</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Input label="Min Order Qty" name="minimumOrderQuantity" placeholder="e.g., 1"
              value={form.minimumOrderQuantity} onChange={handleChange} error={errors.minimumOrderQuantity} required />
            <Input label="Max Order Qty" name="maximumOrderQuantity" placeholder="e.g., 100"
              value={form.maximumOrderQuantity} onChange={handleChange} error={errors.maximumOrderQuantity} required />
          </div>

          <p className={subSectionTitle}>Batch Management</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {isEdit ? (
              <NonEditableField label="Batch Number" value={form.batchLotNumber} required />
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
              <NonEditableField label="Stock Quantity (in units)" value={form.stockQuantity} required />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Input label="MRP (per Pack Size)" name="mrp" placeholder="e.g., 500"
              value={form.mrp} onChange={handleChange} error={errors.mrp} required />
            <Input label="Selling Price (per Pack Size)" name="sellingPricePerPack" placeholder="e.g., 450"
              value={form.sellingPricePerPack} onChange={handleChange} error={errors.sellingPricePerPack} required />
            <div className="col-span-1 md:col-span-2 flex items-end gap-4">
              <div className="w-1/2">
                <Input label="Discount Percentage (%)" name="discountPercentage" placeholder="0–100"
                  value={form.discountPercentage} onChange={handleChange} error={errors.discountPercentage} />
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdditionalDiscountModal(true)}
                  className="w-59.25 h-14 px-6 border-[2.5px] border-secondary-700 text-secondary-700 text-label-l4 font-semibold rounded-lg flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <img src="/icons/PlusIcon.svg" alt="add" className="w-6 h-6" />
                  Add Special Offers
                </button>
              </div>
            </div>
          </div>

          <p className={subSectionTitle}>TAX &amp; BILLING</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {isEdit ? (
              <NonEditableSelect label="GST %" value={displayLabels.gstLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("gstPercentage") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>GST % {requiredStar}</label>
                <Select options={gstOptions} value={gstOptions.find((o) => o.value === form.gstPercentage) || null}
                  onChange={(sel) => handleSelectChange("gstPercentage", sel)}
                  placeholder="Select GST" theme={selectTheme} styles={selectStyles("gstPercentage")} />
                {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
              </div>
            )}

            {isEdit ? (
              <NonEditableField label="HSN Code" value={form.hsnCode} required />
            ) : (
              <Input label="HSN Code" name="hsnCode" placeholder="4, 6, or 8 digit numeric code"
                value={form.hsnCode} onChange={handleChange} maxLength={8} error={errors.hsnCode} required />
            )}
          </div>
        </div>

        {/* ── Section 3: Product Photos ─────────────────────────────────────────── */}
        <div className={sectionCard} ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>} data-field="images">
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

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
            onClick={() => document.getElementById("ncFileInput")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files); }}>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-sm font-medium text-gray-600 text-center">Choose a file or drag &amp; drop it here</div>
              <div className="text-xs text-gray-400 text-center">Click to browse PNG, JPG, and SVG</div>
            </div>
          </div>

          <input id="ncFileInput" type="file" multiple accept="image/jpeg,image/png,image/jpg,image/svg+xml" className="hidden"
            onChange={(e) => { if (e.target.files) handleImageFiles(e.target.files); }} />

          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={i} className="relative group flex-shrink-0">
                    <img src={url} alt={`Product ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-purple-300 transition" />
                    <button type="button" onClick={() => { URL.revokeObjectURL(url); setImages((p) => p.filter((_, idx) => idx !== i)); }}
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

        {/* ── Actions ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 pb-8">
          <div className="flex gap-3">
            <button type="button" onClick={() => onSubmitSuccess ? onSubmitSuccess() : window.location.reload()}
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
      </div>
    </>
  );
};

export default ConsumableForm;