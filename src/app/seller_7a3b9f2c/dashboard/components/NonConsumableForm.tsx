"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Input from "@/src/app/commonComponents/Input";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import UploadInput from "../commonComponent/UploadInput";
import AdditionalDiscountType from "./AdditionalDiscountType";
import PopupModal from "../commonComponent/PopupModal";
import CommonModal from "../commonComponent/CommonModal";
import { AlertCircle } from "lucide-react";
import MonthPicker from "@/src/app/commonComponents/MonthPicker";
import ProductImageUpload from "../commonComponent/ProductImageUpload";
import { getProductById, uploadProductImages, updateProduct } from "@/src/services/product/ProductService";
import { validateBatchNumber } from "@/src/services/product/Pricing";
import {
  getNonConsumableDeviceCategories,
  getNonConsumableDeviceSubCategories,
  getNonConsumableMaterialTypes,
  getNonConsumableStorageConditions,
  getNonConsumableCountries,
  getNonConsumableCertifications,
  getNonConsumablePackTypes,
  getNonConsumablePowerSources,
  getNonConsumableProductCategories,
  createNonConsumableProduct,
  uploadNonConsumableCertificate,
  uploadNonConsumableBrochure,
  getStorageConditionsByCategoryId,
  getNonConsumableCertificationsByCategoryId,
  getSpecificationUnitsBySubCategory
} from "@/src/services/product/NonConsumbaleService";
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

interface NonConsumableFormProps {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────


function validateHSNCode(hsnCode: string): string | null {
  const trimmed = hsnCode.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return "HSN code must contain numeric digits only";
  if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(trimmed)) return "HSN code must be 4, 6, or 8 digits";
  return null;
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
    const attrs = dataInner?.productAttributeNonConsumableMedicals;
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
  const s1 = dataInner?.productAttributeNonConsumableMedicals;
  if (Array.isArray(s1) && s1.length > 0) { const id = (s1[0] as ApiResponseData)?.productAttributeId; if (id != null) return String(id); }
  const s2 = data?.productAttributeNonConsumableMedicals;
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
const inputDisabled = "w-full h-12 px-4 border border-neutral-200 rounded-xl text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] bg-gray-50 cursor-default flex items-center";
const errorMsg = "font-heading font-normal text-sm leading-[28px] px-1 text-warning-500";
const sectionCard = "relative border border-neutral-200 rounded-xl p-6 bg-white";
const sectionTitle = "text-h4 font-semibold";
const subSectionTitle = "text-h6 font-normal mt-5";

// Input className to match the existing design (passed as className to <Input>)
// const inputClass = "!h-12 !rounded-xl border-gray-300 focus:border-purple-600 [font-family:'Open_Sans',sans-serif] text-base font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793]";

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

// ─── Component ─────────────────────────────────────────────────────────────────

const NonConsumableForm = ({ productId, mode = "create", onSubmitSuccess }: NonConsumableFormProps) => {
  const router = useRouter();
  const todayStr = new Date().toISOString().split("T")[0];

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef = (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const [form, setForm] = useState({
    productName: "",
    productDescription: "",
    productMarketingUrl: "",
    warningsPrecautions: "",
    manufacturerName: "",
    brandName: "",
    modelName: "",
    modelNumber: "",
    deviceClassification: "",
    udiNumber: "",
    intendedUse: "",
    keyFeatures: "",
    safetyInstructions: "",
    countryOfOrigin: "",
    storageCondition: "",
    deviceCategoryId: "",
    deviceSubCategoryId: "",
    powerSourceId: "",
    warrantyPeriod: "",
    dimensionSize: "",
    deviceSpecificationUnitId: "",
    amcAvailability: "",
    packType: "",
    unitPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    batchLotNumber: "",
    manufacturingDate: null as Date | null,
    dateOfStockEntry: new Date(),
    stockQuantity: "",
    sellingPrice: "",
    mrp: "",
    gstPercentage: "",
    discountPercentage: "",
    finalPrice: "",
    hsnCode: "",
  });

  const [resolvedProductId, setResolvedProductId] = useState("");
  const [productAttributeId, setProductAttributeId] = useState("");
  const [packagingId, setPackagingId] = useState("");
  const [pricingId, setPricingId] = useState("");
  const [productCategoryId, setProductCategoryId] = useState<number>(6);

  const [displayLabels, setDisplayLabels] = useState({
    deviceCategoryLabel: "",
    deviceSubCategoryLabel: "",
    packTypeLabel: "",
    countryLabel: "",
    powerSourceLabel: "",
    storageConditionLabel: "",
    amcLabel: "",
    deviceClassLabel: "",
    gstLabel: "",
    specificationUnitLabel: "",
  });

  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [deviceSubCategoryOptions, setDeviceSubCategoryOptions] = useState<SelectOption[]>([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);
  const [powerSourceOptions, setPowerSourceOptions] = useState<SelectOption[]>([]);
  const [packTypeApiOptions, setPackTypeApiOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<CertificationMasterOption[]>([]);
  const [specificationUnitOptions, setSpecificationUnitOptions] = useState<SelectOption[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingMaterialTypes, setLoadingMaterialTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [loadingSpecificationUnits, setLoadingSpecificationUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string>("");
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [showManufacturingMonthPicker, setShowManufacturingMonthPicker] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

  const [showAdditionalDiscountModal, setShowAdditionalDiscountModal] = useState(false);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const deviceClassOptions: SelectOption[] = [
    { value: "Class A", label: "Class A" },
    { value: "Class B", label: "Class B" },
    { value: "Class C", label: "Class C" },
    { value: "Class D", label: "Class D" },
  ];
  const gstOptions: SelectOption[] = [
    { value: "0", label: "0%" },
    { value: "5", label: "5%" },
    { value: "12", label: "12%" },
    { value: "18", label: "18%" },
  ];
  const amcOptions: SelectOption[] = [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
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

  // ─── Data fetching via service ─────────────────────────────────────────────

  const fetchDeviceCategories = useCallback(async () => {
    setLoadingCategories(true);
    setApiError(null);
    try {
      const items: MasterItem[] = await getNonConsumableDeviceCategories();
      setDeviceCategoryOptions(
        items
          .map((i) => ({ value: getMasterStr(i, "deviceCatId", "id"), label: getMasterStr(i, "deviceName", "name") || "Unknown" }))
          .filter((o) => o.value),
      );
    } catch (err) {
      setApiError(`Failed to load device categories: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchDeviceSubCategories = useCallback(async (catId: string) => {
    if (!catId) { setDeviceSubCategoryOptions([]); return; }
    setLoadingSubCategories(true);
    try {
      const items: MasterItem[] = await getNonConsumableDeviceSubCategories(catId);
      setDeviceSubCategoryOptions(
        items
          .map((i) => ({
            value: getMasterStr(i, "deviceSubCatId", "subCategoryId", "id"),
            label: getMasterStr(i, "deviceSubCatName", "subCategoryName", "name") || "Unknown",
          }))
          .filter((o) => o.value),
      );
    } catch {
      setDeviceSubCategoryOptions([]);
    } finally {
      setLoadingSubCategories(false);
    }
  }, []);

  const fetchSpecificationUnits = useCallback(async (subCatId: string) => {
    if (!subCatId) { setSpecificationUnitOptions([]); return; }
    setLoadingSpecificationUnits(true);
    try {
      const items: MasterItem[] = await getSpecificationUnitsBySubCategory(subCatId);
      setSpecificationUnitOptions(
        items
          .map((i) => ({
            value: getMasterStr(i, "unitId", "specificationUnitId", "id"),
            label: getMasterStr(i, "unitName", "specificationUnit", "name", "unit") || "Unknown",
          }))
          .filter((o) => o.value),
      );
    } catch {
      setSpecificationUnitOptions([]);
    } finally {
      setLoadingSpecificationUnits(false);
    }
  }, []);

  const fetchProductData = useCallback(async () => {
    if (mode !== "edit" || !productId) return;
    setLoadingProduct(true);
    try {
      const data = await getProductById(productId);
      if (!data) throw new Error("Product not found");

      const attribute = data.productAttributeNonConsumableMedicals?.[0] || {};
      const packaging = (Array.isArray(data.packagingDetails) ? data.packagingDetails[0] : data.packagingDetails) || {};
      const pricing = data.pricingDetails?.[0] || {};

      setResolvedProductId(data.productId || productId);
      setProductAttributeId(String(attribute.productAttributeId || ""));
      setPackagingId(String(packaging.packagingId || ""));
      setPricingId(String(pricing.pricingId || ""));

      const packIdVal = String(packaging.packId || "");
      if (packIdVal) {
        try {
          const packItems: MasterItem[] = await getNonConsumablePackTypes(6);
          const mapped = packItems
            .map((i) => ({ value: getMasterStr(i, "packId"), label: getMasterStr(i, "packType") }))
            .filter((o) => o.value);
          setPackTypeApiOptions(mapped);
          const found = mapped.find((o) => o.value === packIdVal);
          setDisplayLabels((prev) => ({ ...prev, packTypeLabel: found?.label || packIdVal }));
        } catch { /* ignore */ }
      }

      setForm({
        productName: data.productName || "",
        productDescription: data.productDescription || "",
        productMarketingUrl: data.productMarketingUrl || "",
        warningsPrecautions: data.warningsPrecautions || "",
        manufacturerName: data.manufacturerName || "",
        brandName: attribute.brandName || "",
        modelName: attribute.modelName || "",
        modelNumber: attribute.modelNumber || "",
        deviceClassification: attribute.deviceClassification || "",
        udiNumber: attribute.udiNumber || "",
        intendedUse: attribute.purpose || "",
        keyFeatures: attribute.keyFeaturesSpecifications || "",
        safetyInstructions: attribute.safetyInstructions || data.warningsPrecautions || "",
        countryOfOrigin: String(attribute.countryId || ""),
        storageCondition: String(attribute.storageConditionId || ""),
        deviceCategoryId: String(attribute.deviceCategoryId || attribute.deviceCatId || ""),
        deviceSubCategoryId: String(attribute.deviceSubCategoryId || attribute.deviceSubCatId || ""),
        powerSourceId: String(attribute.powerSourceId || ""),
        warrantyPeriod: String(attribute.warrantyPeriod || ""),
        dimensionSize: attribute.dimensionSize != null ? String(attribute.dimensionSize) : "",
        deviceSpecificationUnitId: String(attribute.deviceSpecificationUnitId || ""),
        amcAvailability: (() => {
          if (attribute.amcAvailability === true || attribute.serviceAvailability === true) return "true";
          if (attribute.amcAvailability === false || attribute.serviceAvailability === false) return "false";
          const s = String(attribute.amcServiceAvailability ?? attribute.amcAvailability ?? "").trim().toLowerCase();
          if (s === "yes" || s === "true") return "true";
          if (s === "no" || s === "false") return "false";
          return "";
        })(),
        packType: packIdVal,
        unitPerPack: String(packaging.unitPerPack || ""),
        numberOfPacks: String(packaging.numberOfPacks || ""),
        packSize: String(packaging.packSize || ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity || ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity || ""),
        manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
        dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
        stockQuantity: String(pricing.stockQuantity || ""),
        sellingPrice: pricing.sellingPrice != null ? String(pricing.sellingPrice) : "",
        mrp: pricing.mrp != null ? String(pricing.mrp) : "",
        gstPercentage: String(pricing.gstPercentage ?? ""),
        discountPercentage: String(pricing.discountPercentage || ""),
        finalPrice: String(pricing.finalPrice || ""),
        hsnCode: String(pricing.hsnCode || ""),
        batchLotNumber: pricing.batchLotNumber || "",
      });

      if (pricing.additionalDiscounts?.length) setAdditionalDiscountSlabs(convertToDiscountSlab(pricing.additionalDiscounts));
      if (attribute.materialTypeIds?.length) setSelectedMaterialTypes(attribute.materialTypeIds.map(String));
      if (data.productImages?.length) setExistingImages(data.productImages.map((img: { productImage: string }) => img.productImage));
      const isRealUrl = (u: string) => !!u && !["PENDING", "NOT_UPLOADED"].includes(u.toUpperCase());
      if (isRealUrl(attribute.brochurePath)) setExistingBrochureUrl(attribute.brochurePath);

      if (attribute.certificateDocuments?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSelectedCertifications(attribute.certificateDocuments.map((cert: any) => ({
          id: String(cert.certificationId),
          label: cert.certificationName || `Certificate ${cert.certificationId}`,
          tagCode: `Tag ${String(cert.certificationId).padStart(2, "0")}`,
          file: null,
          fileName: isRealUrl(cert.certificateUrl) ? cert.certificateUrl.split("/").pop() || "" : "",
          uploading: false,
          isUploaded: isRealUrl(cert.certificateUrl),
          previewUrl: null,
          productCertificateDocumentId: Number(cert.productCertificateDocumentId),
          existingUrl: isRealUrl(cert.certificateUrl) ? cert.certificateUrl : undefined,
        })));
      }

      const catId = String(attribute.deviceCategoryId || attribute.deviceCatId || "");
      if (catId) await fetchDeviceSubCategories(catId);
      const subCatId = String(attribute.deviceSubCategoryId || attribute.deviceSubCatId || "");
      if (subCatId) await fetchSpecificationUnits(subCatId);
    } catch (err) {
      console.error("Error fetching product:", err);
      setApiError("Failed to load product data. Please refresh and try again.");
    } finally {
      setLoadingProduct(false);
    }
  }, [mode, productId, fetchDeviceSubCategories, fetchSpecificationUnits]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchDeviceCategories();

    // if (mode === "create") {
    //   getNonConsumableProductCategories()
    //     .then((items: MasterItem[]) => {
    //       const nonConsumable = items.find((i) => {
    //         const name = getMasterStr(i, "categoryName", "name").toLowerCase();
    //         return name.includes("non-consumable") || name.includes("nonconsumable");
    //       });
    //       setProductCategoryId(nonConsumable ? Number(getMasterStr(nonConsumable, "categoryId", "id") || "6") : 6);
    //     })
    //     .catch(() => setProductCategoryId(6));
    // }

    getNonConsumableCountries()
      .then((items: MasterItem[]) =>
        setCountryOptions(
          items.map((i) => ({ value: getMasterStr(i, "countryId", "id"), label: getMasterStr(i, "countryName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    getStorageConditionsByCategoryId(productCategoryId)
      .then((items: MasterItem[]) =>
        setStorageConditionOptions(
          items.map((i) => ({ value: getMasterStr(i, "storageConditionId", "id"), label: getMasterStr(i, "conditionName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {});

    getNonConsumablePowerSources()
      .then((items: MasterItem[]) =>
        setPowerSourceOptions(
          items.map((i) => ({ value: getMasterStr(i, "powerSourceId", "id"), label: getMasterStr(i, "powerSourceName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() =>
        setPowerSourceOptions([
          { value: "1", label: "Battery Operated" },
          { value: "2", label: "Rechargeable" },
          { value: "3", label: "Electric" },
          { value: "4", label: "USB Powered" },
          { value: "5", label: "Manual" },
        ]),
      );

    if (mode === "create") {
      getNonConsumablePackTypes(6)
        .then((items: MasterItem[]) =>
          setPackTypeApiOptions(
            items.map((i) => ({ value: getMasterStr(i, "packId"), label: getMasterStr(i, "packType") })).filter((o) => o.value),
          ),
        )
        .catch(() => {});
    }

    setLoadingMaterialTypes(true);
    getNonConsumableMaterialTypes()
      .then((items: MasterItem[]) =>
        setMaterialTypeOptions(
          items.map((i) => ({ value: getMasterStr(i, "materialTypeId", "id"), label: getMasterStr(i, "materialTypeName", "name") || "Unknown" })).filter((o) => o.value),
        ),
      )
      .catch(() => {})
      .finally(() => setLoadingMaterialTypes(false));

    setLoadingCertifications(true);
    getNonConsumableCertificationsByCategoryId(productCategoryId)
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
          { value: "1", label: "CDSCO License Number", certificationId: 1, tagCode: "CDSCO" },
          { value: "2", label: "ISO Certificate", certificationId: 2, tagCode: "Tag 02" },
          { value: "3", label: "CE Certification", certificationId: 3, tagCode: "Tag 03" },
          { value: "4", label: "BIS Certification", certificationId: 4, tagCode: "Tag 04" },
        ]),
      )
      .finally(() => setLoadingCertifications(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "edit" && productId) fetchProductData();
  }, [mode, productId, fetchProductData]);

  useEffect(() => {
    if (mode !== "edit") return;
    setDisplayLabels((prev) => ({
      ...prev,
      deviceCategoryLabel: deviceCategoryOptions.find((o) => o.value === form.deviceCategoryId)?.label || form.deviceCategoryId,
      deviceSubCategoryLabel: deviceSubCategoryOptions.find((o) => o.value === form.deviceSubCategoryId)?.label || form.deviceSubCategoryId,
      countryLabel: countryOptions.find((o) => o.value === form.countryOfOrigin)?.label || form.countryOfOrigin,
      powerSourceLabel: powerSourceOptions.find((o) => o.value === form.powerSourceId)?.label || form.powerSourceId,
      storageConditionLabel: storageConditionOptions.find((o) => o.value === form.storageCondition)?.label || form.storageCondition,
      amcLabel: amcOptions.find((o) => o.value === form.amcAvailability)?.label || form.amcAvailability,
      deviceClassLabel: deviceClassOptions.find((o) => o.value === form.deviceClassification)?.label || form.deviceClassification,
      gstLabel: gstOptions.find((o) => o.value === form.gstPercentage)?.label || (form.gstPercentage ? `${form.gstPercentage}%` : ""),
      specificationUnitLabel: specificationUnitOptions.find((o) => o.value === form.deviceSpecificationUnitId)?.label || form.deviceSpecificationUnitId,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, deviceCategoryOptions, deviceSubCategoryOptions, countryOptions, powerSourceOptions, storageConditionOptions, specificationUnitOptions,
      form.deviceCategoryId, form.deviceSubCategoryId, form.countryOfOrigin, form.powerSourceId, form.storageCondition,
      form.amcAvailability, form.deviceClassification, form.gstPercentage, form.deviceSpecificationUnitId]);

  useEffect(() => {
    if (form.deviceCategoryId) {
      fetchDeviceSubCategories(form.deviceCategoryId);
      if (mode === "create") setForm((p) => ({ ...p, deviceSubCategoryId: "" }));
    } else {
      setDeviceSubCategoryOptions([]);
    }
  }, [form.deviceCategoryId, fetchDeviceSubCategories, mode]);

  useEffect(() => {
    if (form.deviceSubCategoryId) {
      fetchSpecificationUnits(form.deviceSubCategoryId);
      if (mode === "create") setForm((p) => ({ ...p, deviceSpecificationUnitId: "" }));
    } else {
      setSpecificationUnitOptions([]);
    }
  }, [form.deviceSubCategoryId, fetchSpecificationUnits, mode]);

  useEffect(() => {
    const u = parseFloat(form.unitPerPack), p = parseFloat(form.numberOfPacks);
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0) {
      setForm((prev) => ({ ...prev, packSize: (u * p).toString() }));
    }
  }, [form.unitPerPack, form.numberOfPacks]);

  useEffect(() => {
    const s = parseFloat(form.sellingPrice);
    const d = parseFloat(form.discountPercentage);
    setForm((prev) => ({
      ...prev,
      finalPrice: !isNaN(s) && s > 0 ? (isNaN(d) ? s : s - (s * d) / 100).toFixed(2) : "0.00",
    }));
  }, [form.sellingPrice, form.discountPercentage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node)) setShowUnitDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const checkBatchNumber = async (batchLotNumber: string) => {
    try {
      const response = await validateBatchNumber(batchLotNumber, productCategoryId);
      if (response.exists) {
        setErrors((prev) => ({ ...prev, batchLotNumber: "Batch number already exists" }));
      } else {
        setErrors((prev) => { const n = { ...prev }; delete n.batchLotNumber; return n; });
      }
    } catch {
      // silent — uniqueness re-checked on submit
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericOnlyFields = ["stockQuantity", "sellingPrice", "mrp", "discountPercentage", "hsnCode", "unitPerPack", "numberOfPacks", "minimumOrderQuantity", "maximumOrderQuantity", "dimensionSize"];
    if (numericOnlyFields.includes(name)) {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      if (value.startsWith("-")) return;
    }
    const maxLengths: Record<string, number> = { productName: 150, brandName: 60, modelName: 60, modelNumber: 60, udiNumber: 60, manufacturerName: 100, productDescription: 1000, warrantyPeriod: 3, dimensionSize: 10, batchLotNumber: 20 };
    if (name in maxLengths && value.length > maxLengths[name]) return;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
    if (name === "batchLotNumber" && value.trim()) checkBatchNumber(value);
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
    setSelectedMaterialTypes((prev) => prev.includes(option.value) ? prev.filter((v) => v !== option.value) : [...prev, option.value]);
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
      prev.map((c) => c.id === certId ? { ...c, file: null, fileName: "", isUploaded: false } : c)
    );
  };

  // ─── Brochure handler wired to UploadInput's onFileSelect callback ─────────
  const handleBrochureFileSelect = (file: File | null) => {
    if (!file) {
      setBrochureFile(null);
      setExistingBrochureUrl("");
      return;
    }
    if (file.type !== "application/pdf") { alert("Only PDF files are allowed for the brochure / user manual"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Brochure file size must be less than 5 MB"); return; }
    setBrochureFile(file);
    setExistingBrochureUrl("");
  };

  const handleManufacturingMonthSelect = (month: number, year: number) => {
    const selectedDate = new Date(year, month, 1);
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (selectedDate > currentMonth) {
      setErrors((prev) => ({ ...prev, manufacturingDate: "Manufacturing date cannot be in the future month" }));
      return;
    }
    setErrors((prev) => ({ ...prev, manufacturingDate: "" }));
    setForm((p) => ({ ...p, manufacturingDate: selectedDate }));
    setShowManufacturingMonthPicker(false);
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
      const mName2 = form.modelName.trim();
      if (!mName2) e.modelName = "Model name is required";
      else if (mName2.length > 60) e.modelName = "Model name must not exceed 60 characters";
      const mNumber = form.modelNumber.trim();
      if (!mNumber) e.modelNumber = "Model number is required";
      else if (mNumber.length > 60) e.modelNumber = "Model number must not exceed 60 characters";
      if (!form.deviceClassification) e.deviceClassification = "Device classification is required";
      if (form.udiNumber.trim().length > 60) e.udiNumber = "UDI / Serial number must not exceed 60 characters";
      if (selectedMaterialTypes.length === 0) e.materialType = "At least one material / build type is required";
      if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin is required";
      const manName = form.manufacturerName.trim();
      if (!manName) e.manufacturerName = "Manufacturer name is required";
      else if (manName.length > 100) e.manufacturerName = "Manufacturer name must not exceed 100 characters";
      if (!form.packType) e.packType = "Pack type is required";
      const bNum = form.batchLotNumber.trim();
      if (!bNum) e.batchLotNumber = "Batch / lot number is required";
      else if (!/^[a-zA-Z0-9]+$/.test(bNum)) e.batchLotNumber = "Batch number must be alphanumeric only";
      else if (bNum.length < 3) e.batchLotNumber = "Batch number must be at least 3 characters";
      else if (bNum.length > 20) e.batchLotNumber = "Batch number must not exceed 20 characters";
      if (!form.gstPercentage) e.gstPercentage = "GST percentage is required";
      if (!form.hsnCode.trim()) e.hsnCode = "HSN code is required";
      else { const hsnErr = validateHSNCode(form.hsnCode); if (hsnErr) e.hsnCode = hsnErr; }
      if (!form.manufacturingDate) {
        e.manufacturingDate = "Manufacturing date is required";
      } else {
        const mfg = form.manufacturingDate;
        const today = new Date();
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const mfgMonth = new Date(mfg.getFullYear(), mfg.getMonth(), 1);
        if (mfgMonth > currentMonth) e.manufacturingDate = "Manufacturing date cannot be in the future month";
      }

      const dimSize = form.dimensionSize.trim();
      if (!dimSize) {
        e.dimensionSize = "Technical dimensions / capacity / configuration is required";
      } else if (isNaN(Number(dimSize)) || Number(dimSize) <= 0) {
        e.dimensionSize = "Technical dimensions must be a positive number";
      }
      if (!form.deviceSpecificationUnitId) e.deviceSpecificationUnitId = "Unit is required";
    }

    // Warranty Period and AMC are editable in both create and edit modes
    if (!form.warrantyPeriod.trim()) {
      e.warrantyPeriod = "Warranty period is required";
    } else {
      const wp = Number(form.warrantyPeriod);
      if (isNaN(wp) || wp < 0 || !Number.isInteger(wp)) e.warrantyPeriod = "Warranty period must be a non-negative integer (months)";
    }
    if (!form.amcAvailability) e.amcAvailability = "AMC / Service availability is required";

    const iUse = form.intendedUse.trim();
    if (!iUse) e.intendedUse = "Intended use / purpose is required";
    else if (iUse.length < 10) e.intendedUse = "Intended use must be at least 10 characters";

    const kFeat = form.keyFeatures.trim();
    if (!kFeat) e.keyFeatures = "Key features / technical specifications is required";
    else if (kFeat.length < 10) e.keyFeatures = "Key features must be at least 10 characters";

    const sInstr = form.safetyInstructions.trim();
    if (!sInstr) e.safetyInstructions = "Safety instructions / precautions is required";
    else if (sInstr.length < 10) e.safetyInstructions = "Safety instructions must be at least 10 characters";

    const pDesc = form.productDescription.trim();
    if (!pDesc) e.productDescription = "Product description is required";
    else if (pDesc.length > 1000) e.productDescription = "Product description must not exceed 1000 characters";

    const uPack = Number(form.unitPerPack);
    if (!form.unitPerPack.trim()) e.unitPerPack = "Number of units per pack is required";
    else if (!Number.isInteger(uPack) || uPack <= 0) e.unitPerPack = "Units per pack must be a positive integer";

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

    if (mode === "create") {
      const stock = parseFloat(form.stockQuantity);
      if (!form.stockQuantity.trim()) e.stockQuantity = "Stock quantity is required";
      else if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be a positive value greater than 0";
      else if (!isNaN(minQ) && minQ > 0 && stock <= minQ) e.stockQuantity = "Stock quantity must be greater than minimum order quantity";
    }

    if (images.length === 0 && existingImages.length === 0) e.images = "At least one product image is required";
    if (images.length + existingImages.length > 5) e.images = "Maximum 5 images allowed";

    for (const cert of selectedCertifications) {
      if (!cert.file && !cert.existingUrl) {
        e[`certFile_${cert.id}`] = `Please upload the certificate file for "${cert.label}"`;
      }
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
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => scrollToFirstError(errs), 50);
      return;
    }
    setErrors({}); setSubmitting(true); setApiError(null);

    if (mode === "create" && form.batchLotNumber.trim()) {
      try {
        const batchValidation = await validateBatchNumber(form.batchLotNumber, productCategoryId);
        if (batchValidation.exists) {
          setErrors((prev) => ({ ...prev, batchLotNumber: "Batch number already exists" }));
          setSubmitting(false);
          return;
        }
      } catch {
        // non-fatal — proceed
      }
    }

    try {
      const amcValue = form.amcAvailability === "true";

      const payload = {
        productName: form.productName,
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl || "",
        manufacturerName: form.manufacturerName,
        categoryId: productCategoryId,
        packagingDetails: [{
          ...(packagingId ? { packagingId } : {}),
          packId: Number(form.packType),
          unitPerPack: Number(form.unitPerPack) || 0,
          numberOfPacks: Number(form.numberOfPacks) || 0,
          packSize: Number(form.unitPerPack) * Number(form.numberOfPacks) || 0,
          minimumOrderQuantity: Number(form.minimumOrderQuantity) || 0,
          maximumOrderQuantity: Number(form.maximumOrderQuantity) || 0,
        }],
        pricingDetails: [{
          ...(pricingId ? { pricingId } : {}),
          manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
          stockQuantity: Number(form.stockQuantity) || 0,
          dateOfStockEntry: toLocalDateTimeString(form.dateOfStockEntry),
          sellingPrice: Number(form.sellingPrice) || 0,
          mrp: Number(form.mrp) || 0,
          discountPercentage: Number(form.discountPercentage) || 0,
          gstPercentage: Number(form.gstPercentage) || 0,
          finalPrice: Number(form.finalPrice) || 0,
          hsnCode: Number(form.hsnCode) || 0,
          batchLotNumber: form.batchLotNumber,
          expiryDate: "",
          additionalDiscounts: additionalDiscountSlabs.map((slab) => ({
            minimumPurchaseQuantity: slab.minimumPurchaseQuantity,
            additionalDiscountPercentage: slab.additionalDiscountPercentage,
            effectiveStartDate: slab.effectiveStartDate || null,
            effectiveStartTime: slab.effectiveStartTime || null,
            effectiveEndDate: slab.effectiveEndDate || null,
            effectiveEndTime: slab.effectiveEndTime || null,
          })),
        }],
        productAttributeNonConsumableMedicals: [{
          ...(productAttributeId ? { productAttributeId } : {}),
          brandName: form.brandName,
          deviceCategoryId: Number(form.deviceCategoryId),
          deviceSubCategoryId: Number(form.deviceSubCategoryId),
          modelName: form.modelName,
          modelNumber: form.modelNumber,
          keyFeaturesSpecifications: form.keyFeatures,
          materialTypeIds: selectedMaterialTypes.map(Number),
          purpose: form.intendedUse,
          powerSourceId: form.powerSourceId ? Number(form.powerSourceId) : 0,
          storageConditionId: form.storageCondition ? Number(form.storageCondition) : 0,
          countryId: Number(form.countryOfOrigin),
          manufacturerName: form.manufacturerName,
          warrantyPeriod: form.warrantyPeriod || "",
          dimensionSize: form.dimensionSize ? Number(form.dimensionSize) : null,
          deviceSpecificationUnitId: form.deviceSpecificationUnitId ? Number(form.deviceSpecificationUnitId) : null,
          udiNumber: form.udiNumber || "",
          deviceClassification: form.deviceClassification,
          safetyInstructions: form.safetyInstructions,
          serviceAvailability: amcValue,
          amcAvailability: amcValue,
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
      let certsToUpload: CertificationTag[] = [...selectedCertifications];

      if (mode === "edit" && currentProductId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData = await updateProduct(currentProductId, payload as any) as ApiResponseData;

        // For Excel-uploaded products the attributeId may not be pre-populated
        if (!currentAttributeId) {
          currentAttributeId = extractProductAttributeId(updateData) || "";
        }

        // Extract server-assigned productCertificateDocumentId values from the update response
        const certDocMap = extractCertDocumentIdMap(updateData);
        if (certDocMap.size > 0) {
          certsToUpload = certsToUpload.map((c) => {
            const serverDocId = certDocMap.get(Number(c.id));
            return serverDocId ? { ...c, productCertificateDocumentId: serverDocId } : c;
          });
        }

        if (images.length > 0) await uploadProductImages(currentProductId, images);
        if (currentAttributeId) {
          for (const cert of certsToUpload.filter((c) => c.file && !c.existingUrl)) {
            const result = await uploadNonConsumableCertificate(currentAttributeId, cert.productCertificateDocumentId, cert.file!);
            if (!result.success) setApiError(`Warning: Could not upload certificate "${cert.label}": ${result.message}`);
          }
          if (brochureFile) {
            const r = await uploadNonConsumableBrochure(currentAttributeId, brochureFile);
            if (!r.success) setApiError(`Warning: Brochure could not be uploaded — ${r.message}`);
          }
        }
        if (onSubmitSuccess) onSubmitSuccess();
        else setShowSuccessModal(true);
      } else {
        const createData: ApiResponseData = await createNonConsumableProduct(payload as Record<string, unknown>);
        const dataInner = createData?.data as ApiResponseData | undefined;
        currentProductId = String(dataInner?.productId ?? createData?.productId ?? "").trim();
        if (!currentProductId || currentProductId === "undefined") throw new Error("Product ID not returned from server");
        setResolvedProductId(currentProductId);
        currentAttributeId = extractProductAttributeId(createData) || "";
        if (!currentAttributeId) throw new Error("Product attribute ID not returned from server — cannot upload certificates");

        const certDocIdMap = extractCertDocumentIdMap(createData);
        if (certDocIdMap.size > 0) {
          certsToUpload = certsToUpload.map((c) => {
            const serverDocId = certDocIdMap.get(Number(c.id));
            return serverDocId ? { ...c, productCertificateDocumentId: serverDocId } : c;
          });
        }

        if (images.length > 0) await uploadProductImages(currentProductId, images);
        if (currentAttributeId) {
          for (const cert of certsToUpload.filter((c) => c.file && !c.existingUrl)) {
            const result = await uploadNonConsumableCertificate(currentAttributeId, cert.productCertificateDocumentId, cert.file!);
            if (!result.success) setApiError(`Warning: Could not upload certificate "${cert.label}": ${result.message}`);
          }
          if (brochureFile) {
            const r = await uploadNonConsumableBrochure(currentAttributeId, brochureFile);
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

      {showAdditionalDiscountModal && (
        <CommonModal onClose={() => setShowAdditionalDiscountModal(false)} width="w-[600px]">
          <AdditionalDiscountType
            initialData={convertToDiscountData(additionalDiscountSlabs)}
            baseDiscountPercentage={Number(form.discountPercentage) || 0}
            baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
            onSaveAdditionalDiscount={(data: AdditionalDiscountData[]) => {
              setAdditionalDiscountSlabs(convertToDiscountSlab(data));
              setShowAdditionalDiscountModal(false);
            }}
            onClose={() => setShowAdditionalDiscountModal(false)}
          />
        </CommonModal>
      )}

      <div className="flex flex-col gap-5 w-full">
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-red-700 text-sm whitespace-pre-line">{apiError}</span>
          </div>
        )}

        {/* ── Section 1: Product Details ─────────────────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Product Details</h2>
          <div className="border-b border-neutral-200 mt-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 pt-6">

            {/* Product Name */}
            {isEdit ? (
              <NonEditableField label="Product Name" value={form.productName} required />
            ) : (
              <div ref={setFieldRef("productName") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Product Name"
                  name="productName"
                  value={form.productName}
                  onChange={handleChange}
                  placeholder="e.g., Digital BP Monitor"
                  required
                  error={errors.productName}
                  maxLength={150}
                  // className={inputClass}
                  // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
                />
              </div>
            )}

            {/* Device Category */}
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

            {/* Device Sub-Category */}
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

            {/* Brand Name */}
            {isEdit ? (
              <NonEditableField label="Brand Name" value={form.brandName} required />
            ) : (
              <div ref={setFieldRef("brandName") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Brand Name"
                  name="brandName"
                  value={form.brandName}
                  onChange={handleChange}
                  placeholder="e.g., Omron, Philips"
                  required
                  error={errors.brandName}
                  maxLength={60}
                  // className={inputClass}
                  // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
                />
              </div>
            )}

            {/* Model Name */}
            {isEdit ? (
              <NonEditableField label="Model Name" value={form.modelName} required />
            ) : (
              <div ref={setFieldRef("modelName") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Model Name"
                  name="modelName"
                  value={form.modelName}
                  onChange={handleChange}
                  placeholder="e.g., Pro X"
                  required
                  error={errors.modelName}
                  maxLength={60}
                  // className={inputClass}
                  // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
                />
              </div>
            )}

            {/* Model Number */}
            {isEdit ? (
              <NonEditableField label="Model Number" value={form.modelNumber} required />
            ) : (
              <div ref={setFieldRef("modelNumber") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Model Number"
                  name="modelNumber"
                  value={form.modelNumber}
                  onChange={handleChange}
                  placeholder="e.g., ACX-200"
                  required
                  error={errors.modelNumber}
                  maxLength={60}
                  // className={inputClass}
                  // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
                />
              </div>
            )}

            {/* Device Classification */}
            {isEdit ? (
              <NonEditableSelect label="Device Classification (Class A/B/C/D)" value={displayLabels.deviceClassLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("deviceClassification") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Device Classification (Class A/B/C/D) {requiredStar}</label>
                <Dropdown
                  options={deviceClassOptions}
                  value={form.deviceClassification}
                  onChange={(val, label) => handleSelectChange("deviceClassification", { value: val, label })}
                  placeholder="Select device classification"
                  error={errors.deviceClassification ? " " : ""}
                />
                {errors.deviceClassification && <p className={errorMsg}>{errors.deviceClassification}</p>}
              </div>
            )}

            {/* UDI Number */}
            {isEdit ? (
              <NonEditableField label="UDI (Unique Device Identifier) / Serial Number" value={form.udiNumber} />
            ) : (
              <div ref={setFieldRef("udiNumber") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="UDI (Unique Device Identifier) / Serial Number"
                  name="udiNumber"
                  value={form.udiNumber}
                  onChange={handleChange}
                  placeholder="Optional"
                  error={errors.udiNumber}
                  maxLength={60}
                  // className={inputClass}
                  // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
                />
              </div>
            )}

            {/* Intended Use — editable in both modes */}
            <div ref={setFieldRef("intendedUse") as React.RefCallback<HTMLDivElement>}>
              <Input
                label="Intended Use / Purpose"
                name="intendedUse"
                value={form.intendedUse}
                onChange={handleChange}
                placeholder="e.g., Blood pressure monitoring"
                required
                error={errors.intendedUse}
                // className={inputClass}
                // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
              />
            </div>

            {/* Technical Dimensions / Capacity / Configuration — editable in both create and edit */}
            <div
              className="flex flex-col gap-1"
              ref={(el) => { fieldRefs.current["dimensionSize"] = el; fieldRefs.current["deviceSpecificationUnitId"] = el; }}
            >
              <label className={fieldLabel}>Technical Dimensions / Capacity / Configuration</label>
              <div className="relative" ref={unitDropdownRef}>
                <div className={`flex items-center h-[52px] border rounded-lg overflow-hidden ${errors.dimensionSize || errors.deviceSpecificationUnitId ? "border-warning-500" : "border-pneutral-300"}`}>
                  <input
                    type="text"
                    name="dimensionSize"
                    value={form.dimensionSize}
                    onChange={handleChange}
                    placeholder="e.g., 20.5"
                    maxLength={10}
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
              {errors.dimensionSize && <p className={errorMsg}>{errors.dimensionSize}</p>}
              {errors.deviceSpecificationUnitId && <p className={errorMsg}>{errors.deviceSpecificationUnitId}</p>}
            </div>

            {/* Certifications — dropdown (editable in both create and edit modes) */}
            <div className="flex flex-col gap-1" ref={setFieldRef("certifications") as React.RefCallback<HTMLDivElement>} data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
              <CheckboxDropdown
                options={certificationMasterOptions}
                selectedValues={selectedCertifications.map(c => c.id)}
                onChange={(values) => {
                  const newCerts = values.map(val => {
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
                }}
                placeholder={loadingCertifications ? "Loading..." : "Select certifications"}
                disabled={loadingCertifications}
                showSelectAll={false}
              />
            </div>

            {/* Certifications — upload (editable in both create and edit modes) */}
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

            {/* Material / Build Type */}
            {isEdit ? (
              <NonEditableField
                label="Material / Build Type (Plastic, Metal, Steel)"
                value={selectedMaterialTypes.map((v) => materialTypeOptions.find((o) => o.value === v)?.label).filter(Boolean).join(", ")}
                required
              />
            ) : (
              <div className="flex flex-col gap-1" data-field="materialType">
                <label className={fieldLabel}>Material / Build Type (Plastic, Metal, Steel) {requiredStar}</label>
                <CheckboxDropdown
                  options={materialTypeOptions}
                  selectedValues={selectedMaterialTypes}
                  onChange={(vals) => {
                    setSelectedMaterialTypes(vals);
                    if (errors.materialType) setErrors((p) => { const n = { ...p }; delete n.materialType; return n; });
                  }}
                  placeholder={loadingMaterialTypes ? "Loading..." : "Select material / build types"}
                  disabled={loadingMaterialTypes}
                  error={errors.materialType ? " " : ""}
                  showSelectAll={false}
                />
                {errors.materialType && <p className={errorMsg}>{errors.materialType}</p>}
              </div>
            )}

            {/* Power Source */}
            {isEdit ? (
              <NonEditableSelect label="Power Source" value={displayLabels.powerSourceLabel} />
            ) : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Power Source</label>
                <Dropdown
                  options={powerSourceOptions}
                  value={form.powerSourceId}
                  onChange={(val, label) => handleSelectChange("powerSourceId", { value: val, label })}
                  placeholder="Select power source"
                />
              </div>
            )}

            {/* Warranty Period — editable in both create and edit modes */}
            <div ref={setFieldRef("warrantyPeriod") as React.RefCallback<HTMLDivElement>}>
              <Input
                label="Warranty Period (months)"
                name="warrantyPeriod"
                value={form.warrantyPeriod}
                onChange={handleChange}
                placeholder="e.g., 12"
                required
                error={errors.warrantyPeriod}
                maxLength={3}
              />
            </div>

            {/* AMC / Service Availability — editable in both create and edit modes */}
            <div className="flex flex-col gap-1" ref={setFieldRef("amcAvailability") as React.RefCallback<HTMLDivElement>}>
              <label className={fieldLabel}>AMC / Service Availability {requiredStar}</label>
              <Dropdown
                options={amcOptions}
                value={form.amcAvailability}
                onChange={(val, label) => handleSelectChange("amcAvailability", { value: val, label })}
                placeholder="Select Yes or No"
                error={errors.amcAvailability ? " " : ""}
              />
              {errors.amcAvailability && <p className={errorMsg}>{errors.amcAvailability}</p>}
            </div>

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

            {/* Manufacturer Name */}
            {isEdit ? (
              <NonEditableField label="Manufacturer Name" value={form.manufacturerName} required />
            ) : (
              <div ref={setFieldRef("manufacturerName") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Manufacturer Name"
                  name="manufacturerName"
                  value={form.manufacturerName}
                  onChange={handleChange}
                  placeholder="Manufacturer company name"
                  required
                  error={errors.manufacturerName}
                  maxLength={100}
                  // className={inputClass}
                  // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
                />
              </div>
            )}

            {/* Storage Condition — editable only when stock is 0 */}
            {isEdit && Number(form.stockQuantity) > 0 ? (
              <NonEditableSelect label="Storage Condition (If applicable)" value={displayLabels.storageConditionLabel || "—"} />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("storageCondition") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Storage Condition (If applicable)</label>
                <Dropdown
                  options={storageConditionOptions}
                  value={form.storageCondition}
                  onChange={(val, label) => handleSelectChange("storageCondition", { value: val, label })}
                  placeholder="Select storage condition"
                />
              </div>
            )}

            {/* Brochure Upload — uses UploadInput component */}
            <div ref={setFieldRef("brochure") as React.RefCallback<HTMLDivElement>}>
              <UploadInput
                onFileSelect={handleBrochureFileSelect}
                existingFile={existingBrochureUrl || undefined}
              />
            </div>

            {/* Safety Instructions */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Safety Instructions / Precautions {requiredStar}</label>
              <textarea ref={setFieldRef("safetyInstructions") as React.RefCallback<HTMLTextAreaElement>} name="safetyInstructions" value={form.safetyInstructions} onChange={handleChange} rows={4} placeholder="Enter safety warnings, precautions, and handling instructions" className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.safetyInstructions ? "border-red-400" : "border-gray-300"}`} />
              {errors.safetyInstructions && <p className={errorMsg}>{errors.safetyInstructions}</p>}
            </div>

            {/* Key Features */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Key Features / Technical Specifications {requiredStar}</label>
              <textarea ref={setFieldRef("keyFeatures") as React.RefCallback<HTMLTextAreaElement>} name="keyFeatures" value={form.keyFeatures} onChange={handleChange} rows={4} placeholder="List key features, technical specifications" className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.keyFeatures ? "border-red-400" : "border-gray-300"}`} />
              {errors.keyFeatures && <p className={errorMsg}>{errors.keyFeatures}</p>}
            </div>

            {/* Product Description */}
            <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>} name="productDescription" value={form.productDescription} onChange={handleChange} rows={4} placeholder="Detailed product description" className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.productDescription ? "border-red-400" : "border-gray-300"}`} />
              {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
            </div>
          </div>
        </div>

        {/* ── Section 2: Packaging & Order Details ──────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Packaging &amp; Order Details</h2>
          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 pt-6">

            {/* Pack Type */}
            {isEdit ? (
              <NonEditableSelect label="Pack Type" value={displayLabels.packTypeLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("packType") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Pack Type {requiredStar}</label>
                <Dropdown
                  options={packTypeApiOptions}
                  value={form.packType}
                  onChange={(val, label) => handleSelectChange("packType", { value: val, label })}
                  placeholder="Select pack type"
                  error={errors.packType ? " " : ""}
                />
                {errors.packType && <p className={errorMsg}>{errors.packType}</p>}
              </div>
            )}

            {/* Units per Pack — locked after stock entry */}
            {isEdit && Number(form.stockQuantity) > 0 ? (
              <NonEditableField label="Number of Units per Pack Type" value={form.unitPerPack} required />
            ) : (
              <div ref={setFieldRef("unitPerPack") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Number of Units per Pack Type"
                  name="unitPerPack"
                  value={form.unitPerPack}
                  onChange={handleChange}
                  placeholder="e.g., 100"
                  required
                  error={errors.unitPerPack}
                />
              </div>
            )}

            {/* Number of Packs — locked after stock entry */}
            {isEdit && Number(form.stockQuantity) > 0 ? (
              <NonEditableField label="Number of Packs" value={form.numberOfPacks} required />
            ) : (
              <div ref={setFieldRef("numberOfPacks") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Number of Packs"
                  name="numberOfPacks"
                  value={form.numberOfPacks}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  required
                  error={errors.numberOfPacks}
                />
              </div>
            )}

            {/* Pack Size — read-only, auto-computed */}
            <div>
              <Input
                label="Pack Size (No. of Units per Pack Type X No. of Packs)"
                name="packSize"
                value={form.packSize}
                readOnly
                className="!h-12 !rounded-xl bg-gray-50 [color:#969793] cursor-not-allowed border-gray-300 [font-family:'Open_Sans',sans-serif] text-base"
                labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
              />
            </div>
          </div>

          <p className={subSectionTitle}>Order Details</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div ref={setFieldRef("minimumOrderQuantity") as React.RefCallback<HTMLDivElement>}>
              <Input
                label="Min Order Qty"
                name="minimumOrderQuantity"
                value={form.minimumOrderQuantity}
                onChange={handleChange}
                placeholder="e.g., 1"
                required
                error={errors.minimumOrderQuantity}
                // className={inputClass}
                // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
              />
            </div>
            <div ref={setFieldRef("maximumOrderQuantity") as React.RefCallback<HTMLDivElement>}>
              <Input
                label="Max Order Qty"
                name="maximumOrderQuantity"
                value={form.maximumOrderQuantity}
                onChange={handleChange}
                placeholder="e.g., 100"
                required
                error={errors.maximumOrderQuantity}
                // className={inputClass}
                // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
              />
            </div>
          </div>

          <p className={subSectionTitle}>Batch Management</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* Batch Number */}
            <div ref={setFieldRef("batchLotNumber") as React.RefCallback<HTMLDivElement>}>
              {isEdit ? (
                <NonEditableField label="Batch Number" value={form.batchLotNumber} required />
              ) : (
                <Input label="Batch Number" name="batchLotNumber" placeholder="Alphanumeric only"
                  value={form.batchLotNumber} onChange={handleChange} error={errors.batchLotNumber} required maxLength={20} />
              )}
            </div>

            {/* Manufacturing Date */}
            <div ref={setFieldRef("manufacturingDate") as React.RefCallback<HTMLDivElement>} className="relative">
              <Input
                label="Manufacturing Date"
                type="text"
                name="manufacturingDate"
                required={!isEdit}
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
                  onSelect={handleManufacturingMonthSelect}
                  onClose={() => setShowManufacturingMonthPicker(false)}
                />
              )}
            </div>

            {/* Stock Quantity */}
            {isEdit ? (
              <NonEditableField label="Stock Quantity (in units)" value={form.stockQuantity} required />
            ) : (
              <div ref={setFieldRef("stockQuantity") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Stock Quantity (in units)"
                  name="stockQuantity"
                  value={form.stockQuantity}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  required
                  error={errors.stockQuantity}
                  // className={inputClass}
                  // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
                />
              </div>
            )}

            {/* Date of Stock Entry — always read-only */}
            <div>
              <Input
                label="Date of Stock Entry"
                name="dateOfStockEntry"
                value={todayStr}
                readOnly
                required
                className="!h-12 !rounded-xl bg-gray-50 [color:#969793] cursor-not-allowed border-gray-300 [font-family:'Open_Sans',sans-serif] text-base"
                labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
              />
            </div>
          </div>

          <p className={subSectionTitle}>Pricing</p>
          <div className="border-b border-neutral-200 mt-2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            <div ref={setFieldRef("sellingPrice") as React.RefCallback<HTMLDivElement>}>
              <Input
                label="Selling Price (per Pack Size)"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="e.g., 4500"
                required
                error={errors.sellingPrice}
                // className={inputClass}
                // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
              />
            </div>

            <div ref={setFieldRef("mrp") as React.RefCallback<HTMLDivElement>}>
              <Input
                label="MRP (per Pack Size)"
                name="mrp"
                value={form.mrp}
                onChange={handleChange}
                placeholder="e.g., 5000"
                required
                error={errors.mrp}
                // className={inputClass}
                // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex items-end gap-4">
              <div className="w-1/2" ref={setFieldRef("discountPercentage") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="Discount Percentage (%)"
                  name="discountPercentage"
                  value={form.discountPercentage}
                  onChange={handleChange}
                  placeholder="0–100"
                  error={errors.discountPercentage}
                />
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

            {/* GST % */}
            {isEdit ? (
              <NonEditableSelect label="GST %" value={displayLabels.gstLabel} required />
            ) : (
              <div className="flex flex-col gap-1" ref={setFieldRef("gstPercentage") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>GST % {requiredStar}</label>
                <Dropdown
                  options={gstOptions}
                  value={form.gstPercentage}
                  onChange={(val, label) => handleSelectChange("gstPercentage", { value: val, label })}
                  placeholder="Select GST"
                  error={errors.gstPercentage ? " " : ""}
                />
                {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
              </div>
            )}

            {/* HSN Code */}
            {isEdit ? (
              <NonEditableField label="HSN Code" value={form.hsnCode} required />
            ) : (
              <div ref={setFieldRef("hsnCode") as React.RefCallback<HTMLDivElement>}>
                <Input
                  label="HSN Code"
                  name="hsnCode"
                  value={form.hsnCode}
                  onChange={handleChange}
                  placeholder="4, 6, or 8 digit numeric code"
                  required
                  error={errors.hsnCode}
                  maxLength={8}
                  // className={inputClass}
                  // labelClassName="font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Section 3: Product Photos ──────────────────────────────────────────── */}
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
            isReadOnly={isEdit}
            mode={mode}
          />
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 pb-8">
          <div className="flex gap-3">
            <button type="button" onClick={() => onSubmitSuccess ? onSubmitSuccess() : window.location.reload()} className="px-5 py-2.5 border-2 border-red-400 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">Cancel</button>
            <button type="button" style={{ background: "#9F75FC", borderRadius: "8px" }} className="px-5 py-3 text-white text-base [font-family:'Open_Sans',sans-serif] font-semibold leading-[22px] flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/icons/SaveDraftIcon.svg" alt="save draft" className="w-5 h-5 object-contain" />
              Save Draft
            </button>
          </div>
          <button type="button" onClick={handleSubmit} disabled={submitting} style={{ background: "#4B0082", borderRadius: "8px" }} className="px-8 py-3 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </>
  );
};

export default NonConsumableForm;