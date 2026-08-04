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
  const [gstOptions, setGstOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<CertificationMasterOption[]>([]);
  const [specificationUnitOptions, setSpecificationUnitOptions] = useState<SelectOption[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingMaterialTypes, setLoadingMaterialTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [loadingSpecificationUnits, setLoadingSpecificationUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
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
  const [mandatoryCertCount, setMandatoryCertCount] = useState(0);

  const [showAdditionalDiscountModal, setShowAdditionalDiscountModal] = useState(false);
  const [editTab, setEditTab] = useState<"additional_discount" | "special_schemes" | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);
  const [specialSchemes, setSpecialSchemes] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftModalError, setDraftModalError] = useState(false);

  const deviceClassOptions: SelectOption[] = [
    { value: "Class A", label: "Class A" },
    { value: "Class B", label: "Class B" },
    { value: "Class C", label: "Class C" },
    { value: "Class D", label: "Class D" },
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

      const ncArr: any[] = data.productAttributeNonConsumableMedicals ?? [];
      const attribute = ncArr.length > 0
        ? ncArr.reduce((latest: any, curr: any) => {
            const toMs = (e: any) => {
              const d = e.updatedDate ?? e.modifiedDate ?? e.createdDate;
              if (!d) return Infinity;
              const t = new Date(d).getTime();
              return isNaN(t) ? Infinity : t;
            };
            return toMs(curr) >= toMs(latest) ? curr : latest;
          })
        : {};
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
        gstPercentage: String(pricing.gstPercentage ?? attribute.gstPercentage ?? data.gstPercentage ?? ""),
        discountPercentage: String(pricing.discountPercentage || ""),
        finalPrice: String(pricing.finalPrice || ""),
        hsnCode: String(pricing.hsnCode || attribute.hsnCode || data.hsnCode || ""),
        batchLotNumber: pricing.batchLotNumber || "",
      });

      if (pricing.additionalDiscounts?.length) setAdditionalDiscountSlabs(convertToDiscountSlab(pricing.additionalDiscounts));
      if (pricing.specialSchemes?.length) setSpecialSchemes(pricing.specialSchemes);
      if (attribute.materialTypeIds?.length) setSelectedMaterialTypes(attribute.materialTypeIds.map(String));
      if (data.productImages?.length) setExistingImages(data.productImages.map((img: { productImage: string }) => img.productImage));
      const isRealUrl = (u: string) => !!u && !["PENDING", "NOT_UPLOADED"].includes(u.toUpperCase());
      if (isRealUrl(attribute.brochurePath)) setExistingBrochureUrl(attribute.brochurePath);

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

    const nonConsumableFallbackCerts: CertificationMasterOption[] = [
      { value: "1", label: "CDSCO License Number", certificationId: 1, tagCode: "CDSCO" },
      { value: "2", label: "ISO Certificate", certificationId: 2, tagCode: "Tag 02" },
      { value: "3", label: "CE Certification", certificationId: 3, tagCode: "Tag 03" },
      { value: "4", label: "BIS Certification", certificationId: 4, tagCode: "Tag 04" },
    ];
    setLoadingCertifications(true);
    getNonConsumableCertificationsByCategoryId(productCategoryId)
      .then((items: MasterItem[]) => {
        const mapped = Array.isArray(items)
          ? items.map((item, idx) => ({
              value: getMasterStr(item, "certificationId", "id"),
              label: getMasterStr(item, "certificationName", "name") || "Unknown",
              certificationId: Number(getMasterStr(item, "certificationId", "id") || String(idx + 1)),
              tagCode: `Tag ${String(idx + 1).padStart(2, "0")}`,
            })).filter((o) => o.value)
          : [];
        setCertificationMasterOptions(mapped.length ? mapped : nonConsumableFallbackCerts);
      })
      .catch(() => setCertificationMasterOptions(nonConsumableFallbackCerts))
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
    const { name } = e.target;
    let value = e.target.value;

    // Field-specific sanitization
    if (name === "unitPerPack") {
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
    } else if (name === "dimensionSize") {
      if (value !== "" && !/^[a-zA-Z0-9\s.×x]*$/.test(value)) return;
      if (value.startsWith(" ")) return;
      if (/\d+\.\d{3,}/.test(value)) return;
    }

    const maxLengths: Record<string, number> = { productName: 150, brandName: 60, modelName: 60, modelNumber: 60, udiNumber: 60, manufacturerName: 100, productDescription: 1000, warrantyPeriod: 3, dimensionSize: 30, batchLotNumber: 20 };
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


  const handleViewProduct = () => {
    // Full page navigation ensures ProductView1 mounts fresh and fetches
    // the latest data — router.push would serve a cached React tree instead.
    window.location.href = `/seller_7a3b9f2c/products/view/${resolvedProductId}`;
  };
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

      const dimSize = form.dimensionSize.trim();
      if (!dimSize) {
        e.dimensionSize = "Technical dimensions / capacity / configuration is required";
      } else if (dimSize.length > 30) {
        e.dimensionSize = "Maximum 30 characters allowed";
      } else if (/\d+\.\d{3,}/.test(dimSize)) {
        e.dimensionSize = "Decimal values are allowed up to 2 digits after the decimal point";
      } else if (!/^[a-zA-Z0-9\s.×x]+$/.test(dimSize)) {
        e.dimensionSize = "Only letters, numbers, spaces, and dimension separators (x, ×) are allowed";
      }
      if (!form.deviceSpecificationUnitId) e.deviceSpecificationUnitId = "Unit is required";

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

   

    if (images.length === 0 && existingImages.length === 0) e.images = "At least one product image is required";
    if (images.length + existingImages.length > 5) e.images = "Maximum 5 images allowed";

    for (const cert of selectedCertifications) {
      if (!cert.file && !cert.existingUrl) {
        e[`certFile_${cert.id}`] = `Please upload the certificate file for "${cert.label}"`;
      }
    }
    if (mode === "edit" && selectedCertifications.length < mandatoryCertCount) {
      e.certifications = `You must keep all ${mandatoryCertCount} original certifications. Please re-add any removed ones.`;
    } else if (mode !== "edit" && selectedCertifications.length === 0) {
      e.certifications = "At least one certification is required";
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

    try {
      const amcValue = form.amcAvailability === "true";

      const payload = {
        productName: form.productName,
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl || "",
        manufacturerName: form.manufacturerName,
        categoryId: productCategoryId,

        gstPercentage: Number(form.gstPercentage),
        hsnCode: Number(form.hsnCode),
        status: "PUBLISHED" as const,

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
          dimensionSize: form.dimensionSize.trim() || null,
          deviceSpecificationUnitId: form.deviceSpecificationUnitId ? Number(form.deviceSpecificationUnitId) : null,
          udiNumber: form.udiNumber || "",
          deviceClassification: form.deviceClassification,
          safetyInstructions: form.safetyInstructions,
          amcServiceAvailability: amcValue ? "Yes" : "No",
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
        // Diagnostic: confirm exact values being sent for the 3 fields
        const attrPayload = (payload as any).productAttributeNonConsumableMedicals?.[0];
        console.log("[NonConsumableForm] SENDING UPDATE - productAttributeId:", attrPayload?.productAttributeId, "| warrantyPeriod:", attrPayload?.warrantyPeriod, "| dimensionSize:", attrPayload?.dimensionSize, "| deviceSpecificationUnitId:", attrPayload?.deviceSpecificationUnitId, "| serviceAvailability:", attrPayload?.serviceAvailability);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData = await updateProduct(currentProductId, payload as any) as ApiResponseData;

        // Diagnostic: confirm what the backend returned for the 3 fields
        const returnedAttrs = (updateData as any)?.data?.productAttributeNonConsumableMedicals ?? (updateData as any)?.productAttributeNonConsumableMedicals ?? [];
        if (returnedAttrs.length > 0) {
          const r = returnedAttrs[returnedAttrs.length - 1];
          console.log("[NonConsumableForm] BACKEND RESPONSE - warrantyPeriod:", r?.warrantyPeriod, "| dimensionSize:", r?.dimensionSize, "| serviceAvailability:", r?.serviceAvailability);
        }

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

  // ─── Save Draft (skips validation entirely) ────────────────────────────────

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setApiError(null);
    try {
      const amcValue = form.amcAvailability === "true";

      const draftPayload = {
        productName: form.productName,
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl || "",
        manufacturerName: form.manufacturerName,
        categoryId: productCategoryId,

        gstPercentage: form.gstPercentage ? Number(form.gstPercentage) : undefined,
        hsnCode: form.hsnCode ? Number(form.hsnCode) : undefined,
        status: "DRAFT" as const,

        productAttributeNonConsumableMedicals: [{
          ...(productAttributeId ? { productAttributeId } : {}),
          brandName: form.brandName,
          deviceCategoryId: form.deviceCategoryId ? Number(form.deviceCategoryId) : undefined,
          deviceSubCategoryId: form.deviceSubCategoryId ? Number(form.deviceSubCategoryId) : undefined,
          modelName: form.modelName,
          modelNumber: form.modelNumber,
          keyFeaturesSpecifications: form.keyFeatures,
          materialTypeIds: selectedMaterialTypes.map(Number),
          purpose: form.intendedUse,
          powerSourceId: form.powerSourceId ? Number(form.powerSourceId) : 0,
          storageConditionId: form.storageCondition ? Number(form.storageCondition) : 0,
          countryId: form.countryOfOrigin ? Number(form.countryOfOrigin) : undefined,
          manufacturerName: form.manufacturerName,
          warrantyPeriod: form.warrantyPeriod || "",
          dimensionSize: form.dimensionSize.trim() || null,
          deviceSpecificationUnitId: form.deviceSpecificationUnitId ? Number(form.deviceSpecificationUnitId) : null,
          udiNumber: form.udiNumber || "",
          deviceClassification: form.deviceClassification,
          safetyInstructions: form.safetyInstructions,
          amcServiceAvailability: amcValue ? "Yes" : "No",
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

      if (mode === "edit" && currentProductId) {
        await updateProduct(currentProductId, draftPayload as any);
        if (images.length > 0) await uploadProductImages(currentProductId, images);
      } else {
        const createData: ApiResponseData = await createNonConsumableProduct(draftPayload as Record<string, unknown>);
        const dataInner = createData?.data as ApiResponseData | undefined;
        const newProductId = String(dataInner?.productId ?? createData?.productId ?? "").trim();
        if (newProductId && newProductId !== "undefined") {
          currentProductId = newProductId;
          setResolvedProductId(newProductId);
        }
        const newAttributeId = extractProductAttributeId(createData);
        if (newAttributeId) setProductAttributeId(newAttributeId);
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

            {/* Technical Dimensions / Capacity / Configuration */}
            <div
              className="flex flex-col gap-1"
              ref={(el) => { fieldRefs.current["dimensionSize"] = el; fieldRefs.current["deviceSpecificationUnitId"] = el; }}
            >
              {isEdit ? (
                <NonEditableField
                  label="Technical Dimensions / Capacity / Configuration"
                  value={[form.dimensionSize, specificationUnitOptions.find(o => o.value === form.deviceSpecificationUnitId)?.label].filter(Boolean).join(" ")}
                />
              ) : (
                <>
                  <label className={fieldLabel}>Technical Dimensions / Capacity / Configuration {requiredStar}</label>
                  <div className="relative" ref={unitDropdownRef}>
                    <div className={`flex items-center h-[52px] border rounded-lg overflow-hidden ${errors.dimensionSize || errors.deviceSpecificationUnitId ? "border-warning-500" : "border-pneutral-300"}`}>
                      <input
                        type="text"
                        name="dimensionSize"
                        value={form.dimensionSize}
                        onChange={handleChange}
                        placeholder="e.g., 210 × 80, Adult, XL, 350000"
                        maxLength={30}
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
                </>
              )}
            </div>

            {/* Certifications — dropdown (editable in both create and edit modes) */}
            <div className="flex flex-col gap-1" ref={setFieldRef("certifications") as React.RefCallback<HTMLDivElement>} data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
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

            {/* GST % */}
            {isEdit ? (
              <NonEditableField label="GST %" value={form.gstPercentage} required />
            ) : (
              <div ref={setFieldRef("gstPercentage") as React.RefCallback<HTMLDivElement>}>
                <Dropdown
                  label="GST %"
                  options={gstOptions}
                  value={form.gstPercentage || ""}
                  onChange={(value) => setForm((prev) => ({ ...prev, gstPercentage: value }))}
                  placeholder="Select GST %"
                  required
                  error={errors.gstPercentage}
                />
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
                  placeholder="e.g. 9018"
                  required
                  error={errors.hsnCode}
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
            isReadOnly={false}
            mode={mode}
          />
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 pb-8">
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border-2 border-red-400 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">Cancel</button>
            {mode !== "edit" && (
              <button type="button" onClick={handleSaveDraft} disabled={isSavingDraft} style={{ background: "#9F75FC", borderRadius: "8px" }} className="px-5 py-3 text-white text-base [font-family:'Open_Sans',sans-serif] font-semibold leading-[22px] flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60">
                <img src="/icons/SaveDraftIcon.svg" alt="save draft" className="w-5 h-5 object-contain" />
                {isSavingDraft ? "Saving..." : "Save Draft"}
              </button>
            )}
          </div>
          <button type="button" onClick={handleSubmit} disabled={submitting} style={{ background: "#4B0082", borderRadius: "8px" }} className="px-8 py-3 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </button>
        </div>
      </form>
    </>
  );
};

export default NonConsumableForm;