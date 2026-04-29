"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Select, { StylesConfig, Theme } from "react-select";
import AdditionalDiscount from "./AdditionalDiscount";
import PopupModal from "../commonComponent/PopupModal";
import CommonModal from "../commonComponent/CommonModal";
import { FileText, X, RefreshCw, AlertCircle } from "lucide-react";
import { sellerAuthService } from "@/src/services/seller/authService";
import { getProductById, uploadProductImages, updateProduct } from "@/src/services/product/ProductService";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";

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

type SelectStyles = StylesConfig<SelectOption, false>;

const API_BASE = "https://api-test-aggreator.tiameds.ai/api/v1";
const MASTERS = `${API_BASE}/masters`;

// ─── Validation helpers ────────────────────────────────────────────────────────

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

async function uploadSingleCertificate(
  attributeId: string,
  headers: Record<string, string>,
  cert: CertificationTag,
): Promise<{ success: boolean; certId: string; message?: string }> {
  if (!cert.file) return { success: false, certId: cert.id, message: "No file attached" };
  const formData = new FormData();
  formData.append("documentIds", String(cert.productCertificateDocumentId));
  formData.append("certificateFiles", cert.file, cert.file.name);
  const url = `${API_BASE}/product-documents/non-consumable/${attributeId}/certificates`;
  try {
    const response = await fetch(url, { method: "POST", headers, body: formData });
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, certId: cert.id, message: `HTTP ${response.status}: ${errorText}` };
    }
    return { success: true, certId: cert.id };
  } catch (error) {
    return { success: false, certId: cert.id, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function uploadAllCertificates(
  attributeId: string,
  headers: Record<string, string>,
  certificates: CertificationTag[],
): Promise<{ allSuccess: boolean; failures: string[] }> {
  const certsWithFiles = certificates.filter((c) => c.file && !c.existingUrl);
  if (certsWithFiles.length === 0) return { allSuccess: true, failures: [] };
  const failures: string[] = [];
  for (const cert of certsWithFiles) {
    const result = await uploadSingleCertificate(attributeId, headers, cert);
    if (!result.success) failures.push(`${cert.label}: ${result.message || "Upload failed"}`);
  }
  return { allSuccess: failures.length === 0, failures };
}

async function uploadBrochure(
  baseUrl: string,
  headers: Record<string, string>,
  file: File,
): Promise<{ success: boolean; message?: string }> {
  const formData = new FormData();
  formData.append("brochureFile", file);
  try {
    const response = await fetch(baseUrl, { method: "POST", headers, body: formData });
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `HTTP ${response.status}: ${errorText}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

function getMasterStr(item: MasterItem, ...keys: string[]): string {
  for (const key of keys) { const v = item[key]; if (v != null) return String(v); }
  return "";
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const fieldLabel = "block mb-1.5 font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]";
const requiredStar = <span className="text-red-500 ml-0.5">*</span>;

// FIX #5 & #6: Placeholder color #969793, entered text color #3C3D3A
const inputBase =
  "w-full h-12 px-4 border border-gray-300 rounded-xl text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors bg-white";
const inputDisabled =
  "w-full h-12 px-4 border border-gray-200 rounded-xl text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] bg-gray-50 cursor-default flex items-center";
const inputError = "border-red-400 focus:border-red-400 focus:ring-red-100";
const errorMsg = "text-red-500 text-xs mt-1";
const sectionCard = "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm";
const sectionTitle = "mb-4 pb-3 border-b border-gray-100 text-[28px] [font-family:'Open_Sans',sans-serif] font-semibold leading-8 [color:#1E1E1D]";
const subSectionTitle = "mb-3 mt-5 pb-2 border-b border-gray-100 text-[21px] [font-family:'Open_Sans',sans-serif] font-normal leading-6 [color:#1E1E1D]";

const UploadCloudIcon = () => (
  <img src="/icons/upload-cloud.svg" alt="upload" className="w-5 h-5 object-contain" />
);

// ─── Non-editable field wrappers ──────────────────────────────────────────────
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
    amcAvailability: "",
    packType: "",
    unitPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
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
  });

  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [deviceSubCategoryOptions, setDeviceSubCategoryOptions] = useState<SelectOption[]>([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);
  const [powerSourceOptions, setPowerSourceOptions] = useState<SelectOption[]>([]);
  const [packTypeApiOptions, setPackTypeApiOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<CertificationMasterOption[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingMaterialTypes, setLoadingMaterialTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string>("");
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

  // FIX #2/#3: Use CommonModal for additional discount (like DrugForm), remove Drawer
  const [showAdditionalDiscountModal, setShowAdditionalDiscountModal] = useState(false);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const materialDropdownRef = useRef<HTMLDivElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

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

  const authHeaders = useCallback((): Record<string, string> => {
    const token = sellerAuthService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

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

  const fetchList = useCallback(async (
    url: string,
    setter: (v: SelectOption[]) => void,
    idKey: string[],
    labelKey: string[],
    fallback?: SelectOption[],
  ) => {
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      const mapped = items
        .map((i) => ({ value: getMasterStr(i, ...idKey), label: getMasterStr(i, ...labelKey) || "Unknown" }))
        .filter((o) => o.value);
      setter(mapped);
    } catch { if (fallback) setter(fallback); }
  }, [authHeaders]);

  const fetchDeviceCategories = useCallback(async () => {
    setLoadingCategories(true); setApiError(null);
    try {
      const res = await fetch(`${MASTERS}/device-categories/non-consumable`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      setDeviceCategoryOptions(
        items.map((i) => ({ value: getMasterStr(i, "deviceCatId", "id"), label: getMasterStr(i, "deviceName", "name") || "Unknown" }))
          .filter((o) => o.value),
      );
    } catch (err) {
      setApiError(`Failed to load device categories: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setLoadingCategories(false); }
  }, [authHeaders]);

  const fetchDeviceSubCategories = useCallback(async (catId: string) => {
    if (!catId) { setDeviceSubCategoryOptions([]); return; }
    setLoadingSubCategories(true);
    try {
      const res = await fetch(`${MASTERS}/device-sub-categories/${catId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      setDeviceSubCategoryOptions(
        items.map((i) => ({
          value: getMasterStr(i, "deviceSubCatId", "subCategoryId", "id"),
          label: getMasterStr(i, "deviceSubCatName", "subCategoryName", "name") || "Unknown",
        })).filter((o) => o.value),
      );
    } catch { setDeviceSubCategoryOptions([]); } finally { setLoadingSubCategories(false); }
  }, [authHeaders]);

  const fetchProductData = useCallback(async () => {
    if (mode !== "edit" || !productId) return;
    setLoadingProduct(true);
    try {
      const data = await getProductById(productId);
      if (!data) throw new Error("Product not found");

      const attribute = data.productAttributeNonConsumableMedicals?.[0] || {};
      const packaging = data.packagingDetails || {};
      const pricing = data.pricingDetails?.[0] || {};

      setResolvedProductId(data.productId || productId);
      setProductAttributeId(String(attribute.productAttributeId || ""));
      setPackagingId(String(packaging.packagingId || ""));
      setPricingId(String(pricing.pricingId || ""));

      const packIdVal = String(packaging.packId || "");
      if (packIdVal) {
        try {
          const packRes = await fetch(`${API_BASE}/dosage/packType/category/6`, { headers: authHeaders() });
          if (packRes.ok) {
            const packData = await packRes.json();
            const packItems: MasterItem[] = Array.isArray(packData) ? packData : (packData.data ?? []);
            const mapped = packItems
              .map((i) => ({ value: getMasterStr(i, "packId"), label: getMasterStr(i, "packType") }))
              .filter((o) => o.value);
            setPackTypeApiOptions(mapped);
            const found = mapped.find((o) => o.value === packIdVal);
            setDisplayLabels((prev) => ({ ...prev, packTypeLabel: found?.label || packIdVal }));
          }
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
        amcAvailability: (attribute.amcAvailability === true || attribute.serviceAvailability === true) ? "true" : "false",
        packType: packIdVal,
        unitPerPack: String(packaging.unitPerPack || ""),
        numberOfPacks: String(packaging.numberOfPacks || ""),
        packSize: String(packaging.packSize || ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity || ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity || ""),
        manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
        dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
        stockQuantity: String(pricing.stockQuantity || ""),
        sellingPrice: String(pricing.sellingPrice || ""),
        mrp: String(pricing.mrp || ""),
        gstPercentage: String(pricing.gstPercentage ?? ""),
        discountPercentage: String(pricing.discountPercentage || ""),
        finalPrice: String(pricing.finalPrice || ""),
        hsnCode: String(pricing.hsnCode || ""),
      });

      if (pricing.additionalDiscounts?.length) setAdditionalDiscountSlabs(convertToDiscountSlab(pricing.additionalDiscounts));
      if (attribute.materialTypeIds?.length) setSelectedMaterialTypes(attribute.materialTypeIds.map(String));
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

      const catId = String(attribute.deviceCategoryId || attribute.deviceCatId || "");
      if (catId) await fetchDeviceSubCategories(catId);
    } catch (err) {
      console.error("Error fetching product:", err);
      setApiError("Failed to load product data. Please refresh and try again.");
    } finally { setLoadingProduct(false); }
  }, [mode, productId, fetchDeviceSubCategories, authHeaders]);

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
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, deviceCategoryOptions, deviceSubCategoryOptions, countryOptions, powerSourceOptions, storageConditionOptions,
      form.deviceCategoryId, form.deviceSubCategoryId, form.countryOfOrigin, form.powerSourceId, form.storageCondition, form.amcAvailability, form.deviceClassification, form.gstPercentage]);

  useEffect(() => {
    fetchDeviceCategories();
    if (mode === "create") {
      fetch(`${MASTERS}/categories`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((data) => {
          const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
          const nonConsumable = items.find((i) => {
            const name = getMasterStr(i, "categoryName", "name").toLowerCase();
            return name.includes("non-consumable") || name.includes("nonconsumable");
          });
          setProductCategoryId(nonConsumable ? Number(getMasterStr(nonConsumable, "categoryId", "id") || "6") : 6);
        })
        .catch(() => setProductCategoryId(6));
    }

    fetchList(`${MASTERS}/countries`, setCountryOptions, ["countryId", "id"], ["countryName", "name"]);
    fetchList(`${MASTERS}/storagecondition`, setStorageConditionOptions, ["storageConditionId", "id"], ["conditionName", "name"]);
    fetchList(`${MASTERS}/power-sources`, setPowerSourceOptions, ["powerSourceId", "id"], ["powerSourceName", "name"],
      [{ value: "1", label: "Battery Operated" }, { value: "2", label: "Rechargeable" }, { value: "3", label: "Electric" }, { value: "4", label: "USB Powered" }, { value: "5", label: "Manual" }]);

    if (mode === "create") {
      fetchList(`${API_BASE}/dosage/packType/category/6`, setPackTypeApiOptions, ["packId"], ["packType"]);
    }

    setLoadingMaterialTypes(true);
    fetchList(`${MASTERS}/non-consumable-material-types`, setMaterialTypeOptions, ["materialTypeId", "id"], ["materialTypeName", "name"])
      .finally(() => setLoadingMaterialTypes(false));

    setLoadingCertifications(true);
    fetch(`${MASTERS}/certifications`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
        setCertificationMasterOptions(items.map((item, idx) => ({
          value: getMasterStr(item, "certificationId", "id"),
          label: getMasterStr(item, "certificationName", "name") || "Unknown",
          certificationId: Number(getMasterStr(item, "certificationId", "id") || String(idx + 1)),
          tagCode: `Tag ${String(idx + 1).padStart(2, "0")}`,
        })).filter((o) => o.value));
      })
      .catch(() => setCertificationMasterOptions([
        { value: "1", label: "CDSCO License Number", certificationId: 1, tagCode: "CDSCO" },
        { value: "2", label: "ISO Certificate", certificationId: 2, tagCode: "Tag 02" },
        { value: "3", label: "CE Certification", certificationId: 3, tagCode: "Tag 03" },
        { value: "4", label: "BIS Certification", certificationId: 4, tagCode: "Tag 04" },
      ]))
      .finally(() => setLoadingCertifications(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "edit" && productId) fetchProductData();
  }, [mode, productId, fetchProductData]);

  useEffect(() => {
    if (form.deviceCategoryId) {
      fetchDeviceSubCategories(form.deviceCategoryId);
      if (mode === "create") setForm((p) => ({ ...p, deviceSubCategoryId: "" }));
    } else {
      setDeviceSubCategoryOptions([]);
    }
  }, [form.deviceCategoryId, fetchDeviceSubCategories, mode]);

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowCertDropdown(false);
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(e.target as Node)) setShowMaterialDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericOnlyFields = ["stockQuantity", "sellingPrice", "mrp", "discountPercentage", "hsnCode", "unitPerPack", "numberOfPacks", "minimumOrderQuantity", "maximumOrderQuantity"];
    if (numericOnlyFields.includes(name)) {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      if (value.startsWith("-")) return;
    }
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
    const maxLengths: Record<string, number> = { productName: 150, brandName: 60, modelName: 60, modelNumber: 60, udiNumber: 60, manufacturerName: 100, productDescription: 1000, warrantyPeriod: 3 };
    if (name in maxLengths && value.length > maxLengths[name]) return;
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

  const handleBrochureUpload = async (file: File) => {
    if (file.type !== "application/pdf") { alert("Only PDF files are allowed for the brochure / user manual"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Brochure file size must be less than 5 MB"); return; }
    setUploadingBrochure(true);
    await new Promise((r) => setTimeout(r, 300));
    setBrochureFile(file); setExistingBrochureUrl(""); setUploadingBrochure(false);
  };

  const handleImageFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
    const maxSizeBytes = 5 * 1024 * 1024;
    const invalid = fileArr.find((f) => !allowedFormats.includes(f.type));
    if (invalid) { setErrors((p) => ({ ...p, images: "Unsupported image format. Only JPG, JPEG, PNG are allowed." })); return; }
    const oversized = fileArr.find((f) => f.size > maxSizeBytes);
    if (oversized) { setErrors((p) => ({ ...p, images: "Image file size exceeds the maximum limit." })); return; }
    if (images.length + fileArr.length > 5) { setErrors((p) => ({ ...p, images: "Maximum 5 images allowed" })); return; }
    setImages((p) => [...p, ...fileArr]);
    setErrors((p) => { const n = { ...p }; delete n.images; return n; });
  };

  const handleViewProduct = () => { console.log("Go to product page"); };
  const handleContinueAdding = () => { setShowSuccessModal(false); window.location.reload(); };
  const handleBackToDashboard = () => { window.location.reload(); };

  // ─── Validation ───────────────────────────────────────────────────────────────

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
      if (selectedCertifications.length === 0) {
        e.certifications = "At least one certification / compliance is required";
      } else {
        const missing = selectedCertifications.find((c) => !c.file && !c.existingUrl);
        if (missing) e.certifications = `Please upload the certificate file for "${missing.label}"`;
      }
      if (selectedMaterialTypes.length === 0) e.materialType = "At least one material / build type is required";
      if (!form.amcAvailability) e.amcAvailability = "AMC / Service availability is required";
      if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin is required";
      const manName = form.manufacturerName.trim();
      if (!manName) e.manufacturerName = "Manufacturer name is required";
      else if (manName.length > 100) e.manufacturerName = "Manufacturer name must not exceed 100 characters";
      if (!form.packType) e.packType = "Pack type is required";
      if (!form.gstPercentage) e.gstPercentage = "GST percentage is required";
      if (!form.hsnCode.trim()) e.hsnCode = "HSN code is required";
      else { const hsnErr = validateHSNCode(form.hsnCode); if (hsnErr) e.hsnCode = hsnErr; }
      if (images.length === 0) e.images = "Product Image upload is mandatory.";
      if (form.warrantyPeriod.trim() !== "") {
        const wp = Number(form.warrantyPeriod);
        if (isNaN(wp) || wp < 0 || !Number.isInteger(wp)) e.warrantyPeriod = "Warranty period must be a non-negative integer (months)";
      }
      if (form.manufacturingDate && isFutureDate(form.manufacturingDate)) e.manufacturingDate = "Manufacturing date cannot be a future date";
    }

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
    }

    if (mode === "create" && images.length > 5) e.images = "Maximum 5 images allowed";

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

  const toLocalDateTimeString = (date: Date | null): string | null => {
    if (!date) return null;
    const now = new Date();
    const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    return combined.toISOString().slice(0, 19);
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => scrollToFirstError(errs), 50);
      return;
    }
    setErrors({}); setSubmitting(true); setApiError(null);

    try {
      const token = sellerAuthService.getToken();
      if (!token) throw new Error("Authentication required. Please log in again.");
      const authOnlyHeaders: Record<string, string> = { Authorization: `Bearer ${token}` };
      const jsonHeaders: Record<string, string> = { ...authOnlyHeaders, "Content-Type": "application/json" };
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
          packSize: Number(form.packSize) || 0,
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
          batchLotNumber: "",
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
      };

      let currentProductId = resolvedProductId || productId || "";
      let currentAttributeId = productAttributeId;
      let certsToUpload: CertificationTag[] = [...selectedCertifications];

      if (mode === "edit" && currentProductId) {
        await updateProduct(currentProductId, payload);
        if (images.length > 0) await uploadProductImages(currentProductId, images);
        if (currentAttributeId) {
          const { allSuccess, failures } = await uploadAllCertificates(currentAttributeId, authOnlyHeaders, certsToUpload);
          if (!allSuccess) setApiError(`Warning: Some certificate files could not be uploaded:\n${failures.join("\n")}`);
          if (brochureFile) {
            const r = await uploadBrochure(`${API_BASE}/product-documents/non-consumable/${currentAttributeId}/brochure`, authOnlyHeaders, brochureFile);
            if (!r.success && !apiError) setApiError(`Warning: Brochure could not be uploaded — ${r.message}`);
          }
        }
        alert("Product updated successfully!");
        if (onSubmitSuccess) onSubmitSuccess();
        else window.location.reload();
      } else {
        const createRes = await fetch(`${API_BASE}/products/create`, { method: "POST", headers: jsonHeaders, body: JSON.stringify(payload) });
        const rawText = await createRes.text();
        let createData: ApiResponseData;
        try { createData = JSON.parse(rawText) as ApiResponseData; }
        catch { throw new Error(`Invalid server response: ${rawText.substring(0, 200)}`); }
        if (!createRes.ok) throw new Error(String((createData?.data as ApiResponseData)?.message ?? createData?.message ?? `HTTP ${createRes.status}`));
        const dataInner = createData?.data as ApiResponseData | undefined;
        currentProductId = String(dataInner?.productId ?? createData?.productId ?? "").trim();
        if (!currentProductId || currentProductId === "undefined") throw new Error("Product ID not returned from server");
        currentAttributeId = extractProductAttributeId(createData) || "";
        if (!currentAttributeId) throw new Error("Product attribute ID not returned from server — cannot upload certificates");

        const certDocIdMap = extractCertDocumentIdMap(createData);
        if (certDocIdMap.size > 0) {
          certsToUpload = certsToUpload.map((c) => { const serverDocId = certDocIdMap.get(Number(c.id)); return serverDocId ? { ...c, productCertificateDocumentId: serverDocId } : c; });
        }

        if (images.length > 0) await uploadProductImages(currentProductId, images);
        if (currentAttributeId) {
          const { allSuccess, failures } = await uploadAllCertificates(currentAttributeId, authOnlyHeaders, certsToUpload);
          if (!allSuccess) setApiError(`Warning: Some certificate files could not be uploaded:\n${failures.join("\n")}`);
          if (brochureFile) {
            const r = await uploadBrochure(`${API_BASE}/product-documents/non-consumable/${currentAttributeId}/brochure`, authOnlyHeaders, brochureFile);
            if (!r.success && !apiError) setApiError(`Warning: Brochure could not be uploaded — ${r.message}`);
          }
        }
        setShowSuccessModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setApiError(errorMessage);
      alert(`Failed to ${mode === "edit" ? "update" : "create"} product: ${errorMessage}`);
    } finally { setSubmitting(false); }
  };

  // FIX #6: singleValue text color changed to #3C3D3A for entered/selected data
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
    // FIX #6: entered/selected value text should be #3C3D3A not placeholder grey
    singleValue: (base) => ({ ...base, color: "#3C3D3A", fontFamily: "'Open Sans', sans-serif", fontSize: "16px" }),
  });

  const selectTheme = (theme: Theme) => ({
    ...theme, colors: { ...theme.colors, primary: "#7c3aed", primary25: "#f3f0ff", primary50: "#ede9fe" },
  });

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
        description="Your product has been saved and is now live on the platform"
        primaryActionText="View Product"
        secondaryActionText="Continue Adding"
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={handleViewProduct}
        onSecondaryAction={handleContinueAdding}
        onTertiaryAction={handleBackToDashboard}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* FIX #2/#3: CommonModal for additional discount, matching DrugForm pattern */}
      {showAdditionalDiscountModal && (
        <CommonModal
          onClose={() => setShowAdditionalDiscountModal(false)}
          width="w-[600px]"
        >
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

        {/* ── Section 1: Product Details ─────────────────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Product Details</h2>
          {/* FIX #4: gap-y-5 (20px) for consistent field spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {isEdit ? <NonEditableField label="Product Name" value={form.productName} required /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Product Name {requiredStar}</label>
                <input ref={setFieldRef("productName")} name="productName" value={form.productName} onChange={handleChange} placeholder="e.g., Digital BP Monitor" className={`${inputBase} ${errors.productName ? inputError : ""}`} />
                {errors.productName && <p className={errorMsg}>{errors.productName}</p>}
              </div>
            )}

            {isEdit ? <NonEditableSelect label="Device Category" value={displayLabels.deviceCategoryLabel} required /> : (
              <div className="flex flex-col gap-1" ref={setFieldRef("deviceCategoryId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Device Category {requiredStar}</label>
                <Select options={deviceCategoryOptions} isLoading={loadingCategories} value={deviceCategoryOptions.find((o) => o.value === form.deviceCategoryId) || null} onChange={(sel) => handleSelectChange("deviceCategoryId", sel)} placeholder={loadingCategories ? "Loading..." : "Select category"} theme={selectTheme} styles={selectStyles("deviceCategoryId")} />
                {errors.deviceCategoryId && <p className={errorMsg}>{errors.deviceCategoryId}</p>}
              </div>
            )}

            {isEdit ? <NonEditableSelect label="Device Sub-Category" value={displayLabels.deviceSubCategoryLabel} required /> : (
              <div className="flex flex-col gap-1" ref={setFieldRef("deviceSubCategoryId") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Device Sub-Category {requiredStar}</label>
                <Select options={deviceSubCategoryOptions} isLoading={loadingSubCategories} isDisabled={!form.deviceCategoryId} value={deviceSubCategoryOptions.find((o) => o.value === form.deviceSubCategoryId) || null} onChange={(sel) => handleSelectChange("deviceSubCategoryId", sel)} placeholder={form.deviceCategoryId ? (loadingSubCategories ? "Loading..." : "Select sub-category") : "Select category first"} theme={selectTheme} styles={selectStyles("deviceSubCategoryId")} />
                {errors.deviceSubCategoryId && <p className={errorMsg}>{errors.deviceSubCategoryId}</p>}
              </div>
            )}

            {isEdit ? <NonEditableField label="Brand Name" value={form.brandName} required /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Brand Name {requiredStar}</label>
                <input ref={setFieldRef("brandName")} name="brandName" value={form.brandName} onChange={handleChange} placeholder="e.g., Omron, Philips" className={`${inputBase} ${errors.brandName ? inputError : ""}`} />
                {errors.brandName && <p className={errorMsg}>{errors.brandName}</p>}
              </div>
            )}

            {isEdit ? <NonEditableField label="Model Name" value={form.modelName} required /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Model Name {requiredStar}</label>
                <input ref={setFieldRef("modelName")} name="modelName" value={form.modelName} onChange={handleChange} placeholder="e.g., Pro X" className={`${inputBase} ${errors.modelName ? inputError : ""}`} />
                {errors.modelName && <p className={errorMsg}>{errors.modelName}</p>}
              </div>
            )}

            {isEdit ? <NonEditableField label="Model Number" value={form.modelNumber} required /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Model Number {requiredStar}</label>
                <input ref={setFieldRef("modelNumber")} name="modelNumber" value={form.modelNumber} onChange={handleChange} placeholder="e.g., ACX-200" className={`${inputBase} ${errors.modelNumber ? inputError : ""}`} />
                {errors.modelNumber && <p className={errorMsg}>{errors.modelNumber}</p>}
              </div>
            )}

            {isEdit ? <NonEditableSelect label="Device Classification (Class A/B/C/D)" value={displayLabels.deviceClassLabel} required /> : (
              <div className="flex flex-col gap-1" ref={setFieldRef("deviceClassification") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Device Classification (Class A/B/C/D) {requiredStar}</label>
                <Select options={deviceClassOptions} value={deviceClassOptions.find((o) => o.value === form.deviceClassification) || null} onChange={(sel) => handleSelectChange("deviceClassification", sel)} placeholder="Select device classification" theme={selectTheme} styles={selectStyles("deviceClassification")} />
                {errors.deviceClassification && <p className={errorMsg}>{errors.deviceClassification}</p>}
              </div>
            )}

            {isEdit ? <NonEditableField label="UDI (Unique Device Identifier) / Serial Number" value={form.udiNumber} /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>UDI (Unique Device Identifier) / Serial Number</label>
                <input ref={setFieldRef("udiNumber")} name="udiNumber" value={form.udiNumber} onChange={handleChange} placeholder="Optional" className={`${inputBase} ${errors.udiNumber ? inputError : ""}`} />
                {errors.udiNumber && <p className={errorMsg}>{errors.udiNumber}</p>}
              </div>
            )}

            {/* Intended Use — always editable */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Intended Use / Purpose {requiredStar}</label>
              <input ref={setFieldRef("intendedUse")} name="intendedUse" value={form.intendedUse} onChange={handleChange} placeholder="e.g., Blood pressure monitoring" className={`${inputBase} ${errors.intendedUse ? inputError : ""}`} />
              {errors.intendedUse && <p className={errorMsg}>{errors.intendedUse}</p>}
            </div>

            {/* Material / Build Type */}
            {isEdit ? (
              <NonEditableField label="Material / Build Type (Plastic, Metal, Steel)" value={selectedMaterialTypes.map((v) => materialTypeOptions.find((o) => o.value === v)?.label).filter(Boolean).join(", ")} required />
            ) : (
              <div className="flex flex-col gap-1" data-field="materialType">
                <label className={fieldLabel}>Material / Build Type (Plastic, Metal, Steel) {requiredStar}</label>
                <div className="relative" ref={materialDropdownRef}>
                  <div onClick={() => setShowMaterialDropdown((p) => !p)} className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all bg-white ${errors.materialType ? "border-red-400" : "border-gray-300 hover:border-purple-600"}`}>
                    <span className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]" style={{ color: selectedMaterialTypes.length > 0 ? "#3C3D3A" : "#969793" }}>
                      {selectedMaterialTypes.length > 0 ? selectedMaterialTypes.map((v) => materialTypeOptions.find((o) => o.value === v)?.label).filter(Boolean).join(", ") : "Select material / build types"}
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

            {/* FIX #7: Certification upload — tag-chip style */}
            <div className="col-span-1 md:col-span-2" ref={setFieldRef("certifications") as React.RefCallback<HTMLDivElement>} data-field="certifications">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isEdit ? (
                  <NonEditableField label="Certifications / Compliance" value={selectedCertifications.map((c) => c.label).join(", ")} required />
                ) : (
                  <div>
                    <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
                    <div className="relative" ref={dropdownRef}>
                      <div onClick={() => setShowCertDropdown((p) => !p)} className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all bg-white ${errors.certifications ? "border-red-400" : "border-gray-300 hover:border-purple-600"}`}>
                        <span className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]" style={{ color: selectedCertifications.length > 0 ? "#3C3D3A" : "#969793" }}>
                          {selectedCertifications.length > 0 ? selectedCertifications.map((c) => c.label).join(", ") : "Select certifications"}
                        </span>
                        <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${showCertDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      {showCertDropdown && (
                        <div className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {loadingCertifications ? <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div> : (
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
                  </div>
                )}

                {/* FIX #7: Tag-chip style cert upload rows */}
                {isEdit ? (
                  <div>
                    <label className={fieldLabel}>Upload Certificate Documents {requiredStar}</label>
                    <div className="flex flex-col gap-2">
                      {selectedCertifications.map((cert) => (
                        <div key={cert.id} className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12 bg-gray-50">
                          <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <FileText size={16} className="text-purple-500" />
                          </div>
                          <div className="px-2 flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold [font-family:'Open_Sans',sans-serif]">
                              {cert.tagCode}
                            </span>
                          </div>
                          <span className="px-2 text-sm [font-family:'Open_Sans',sans-serif] [color:#969793] truncate flex-1">
                            {cert.existingUrl ? cert.label : `${cert.label} — pending`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={fieldLabel}>Upload Certificate Documents {requiredStar}</label>
                    {selectedCertifications.length === 0 ? (
                      <div className="w-full border border-gray-200 rounded-xl flex items-center h-12 overflow-hidden bg-gray-50">
                        <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <UploadCloudIcon />
                        </div>
                        <span className="[color:#969793] text-base [font-family:'Open_Sans',sans-serif] px-3">Select certifications first</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selectedCertifications.map((cert) => (
                          <div key={cert.id}>
                            {cert.existingUrl && !cert.file ? (
                              /* Existing uploaded cert — tag chip style */
                              <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50">
                                <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <FileText size={16} className="text-purple-600" />
                                </div>
                                <div className="px-2 flex-shrink-0">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-200 text-purple-800 text-xs font-semibold [font-family:'Open_Sans',sans-serif]">
                                    {cert.tagCode}
                                  </span>
                                </div>
                                <div className="flex-1 px-2 min-w-0">
                                  <p className="text-sm font-medium [color:#3C3D3A] truncate">{cert.label}</p>
                                  <p className="text-xs text-gray-500">Existing certificate</p>
                                </div>
                                <div className="flex items-center gap-1 pr-3">
                                  <button type="button" onClick={() => document.getElementById(`nc-cert-upload-${cert.id}`)?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600"><RefreshCw size={13} /></button>
                                  <button type="button" onClick={() => setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id))} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><X size={13} /></button>
                                </div>
                              </div>
                            ) : cert.isUploaded && cert.file ? (
                              /* File selected — tag chip style */
                              <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50">
                                <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <FileText size={16} className="text-purple-600" />
                                </div>
                                <div className="px-2 flex-shrink-0">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-200 text-purple-800 text-xs font-semibold [font-family:'Open_Sans',sans-serif]">
                                    {cert.tagCode}
                                  </span>
                                </div>
                                <div className="flex-1 px-2 min-w-0">
                                  <p className="text-sm font-medium [color:#3C3D3A] truncate">{cert.fileName}</p>
                                  <p className="text-xs text-gray-500">{(cert.file.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <div className="flex items-center gap-1 pr-3">
                                  <button type="button" onClick={() => document.getElementById(`nc-cert-upload-${cert.id}`)?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600"><RefreshCw size={13} /></button>
                                  <button type="button" onClick={() => setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id))} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><X size={13} /></button>
                                </div>
                              </div>
                            ) : (
                              /* Pending upload — tag chip style with upload prompt */
                              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12 bg-gray-50 cursor-pointer hover:bg-gray-100 transition" onClick={() => document.getElementById(`nc-cert-upload-${cert.id}`)?.click()}>
                                <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <UploadCloudIcon />
                                </div>
                                <div className="px-2 flex-shrink-0">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold [font-family:'Open_Sans',sans-serif]">
                                    {cert.tagCode}
                                  </span>
                                </div>
                                <span className="px-2 text-sm [font-family:'Open_Sans',sans-serif] [color:#969793] truncate flex-1">
                                  {cert.label} — click to upload
                                </span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id)); }} className="pr-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
                              </div>
                            )}
                            <input id={`nc-cert-upload-${cert.id}`} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCertFileSelect(cert.id, file); }} />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 5 MB per file. Files are uploaded on Save.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Power Source */}
            {isEdit ? <NonEditableSelect label="Power Source" value={displayLabels.powerSourceLabel} /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Power Source</label>
                <Select options={powerSourceOptions} value={powerSourceOptions.find((o) => o.value === form.powerSourceId) || null} onChange={(sel) => handleSelectChange("powerSourceId", sel)} placeholder="Select power source" theme={selectTheme} styles={selectStyles("powerSourceId")} isClearable />
              </div>
            )}

            {/* Warranty Period */}
            {isEdit ? <NonEditableField label="Warranty Period (months)" value={form.warrantyPeriod} /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Warranty Period (months)</label>
                <input ref={setFieldRef("warrantyPeriod")} name="warrantyPeriod" value={form.warrantyPeriod} onChange={handleChange} placeholder="e.g., 12" className={`${inputBase} ${errors.warrantyPeriod ? inputError : ""}`} />
                {errors.warrantyPeriod && <p className={errorMsg}>{errors.warrantyPeriod}</p>}
              </div>
            )}

            {/* AMC */}
            {isEdit ? <NonEditableSelect label="AMC / Service Availability" value={displayLabels.amcLabel} required /> : (
              <div className="flex flex-col gap-1" ref={setFieldRef("amcAvailability") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>AMC / Service Availability {requiredStar}</label>
                <Select options={amcOptions} value={amcOptions.find((o) => o.value === form.amcAvailability) || null} onChange={(sel) => handleSelectChange("amcAvailability", sel)} placeholder="Select Yes or No" theme={selectTheme} styles={selectStyles("amcAvailability")} />
                {errors.amcAvailability && <p className={errorMsg}>{errors.amcAvailability}</p>}
              </div>
            )}

            {/* Country of Origin */}
            {isEdit ? <NonEditableSelect label="Country of Origin" value={displayLabels.countryLabel} required /> : (
              <div className="flex flex-col gap-1" ref={setFieldRef("countryOfOrigin") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Country of Origin {requiredStar}</label>
                <Select options={countryOptions} value={countryOptions.find((o) => o.value === form.countryOfOrigin) || null} onChange={(sel) => handleSelectChange("countryOfOrigin", sel)} placeholder="Select country" theme={selectTheme} styles={selectStyles("countryOfOrigin")} />
                {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
              </div>
            )}

            {/* Manufacturer Name */}
            {isEdit ? <NonEditableField label="Manufacturer Name" value={form.manufacturerName} required /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Manufacturer Name {requiredStar}</label>
                <input ref={setFieldRef("manufacturerName")} name="manufacturerName" value={form.manufacturerName} onChange={handleChange} placeholder="Manufacturer company name" className={`${inputBase} ${errors.manufacturerName ? inputError : ""}`} />
                {errors.manufacturerName && <p className={errorMsg}>{errors.manufacturerName}</p>}
              </div>
            )}

            {/* Storage Condition — always editable */}
            <div className="flex flex-col gap-1" ref={setFieldRef("storageCondition") as React.RefCallback<HTMLDivElement>}>
              <label className={fieldLabel}>Storage Condition (If applicable)</label>
              <Select options={storageConditionOptions} value={storageConditionOptions.find((o) => o.value === form.storageCondition) || null} onChange={(sel) => handleSelectChange("storageCondition", sel)} placeholder="Select storage condition" theme={selectTheme} styles={selectStyles("storageCondition")} isClearable />
            </div>

            {/* Brochure — always editable */}
            <div ref={setFieldRef("brochure") as React.RefCallback<HTMLDivElement>}>
              <label className={fieldLabel}>Upload Product Brochure / User Manual</label>
              {existingBrochureUrl && !brochureFile && (
                <div className="mb-2 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <FileText size={15} />
                  <a href={existingBrochureUrl} target="_blank" rel="noreferrer" className="underline truncate">Current brochure</a>
                  <button type="button" onClick={() => setExistingBrochureUrl("")} className="ml-auto text-gray-400 hover:text-red-500"><X size={13} /></button>
                </div>
              )}
              {!brochureFile ? (
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12 bg-gray-50 cursor-pointer hover:bg-gray-100 transition" onClick={() => brochureInputRef.current?.click()}>
                  <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    {uploadingBrochure ? <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : <UploadCloudIcon />}
                  </div>
                  <span className="px-3 text-base [font-family:'Open_Sans',sans-serif] [color:#969793]">
                    {uploadingBrochure ? "Processing..." : existingBrochureUrl ? "Upload to replace" : "Upload PDF (max 5 MB)"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50">
                  <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0"><FileText size={16} className="text-purple-600" /></div>
                  <div className="flex-1 px-3 min-w-0">
                    <p className="text-sm font-medium [color:#3C3D3A] truncate">{brochureFile.name}</p>
                    <p className="text-xs text-gray-500">{(brochureFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex items-center gap-1 pr-3">
                    <button type="button" onClick={() => brochureInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600"><RefreshCw size={13} /></button>
                    <button type="button" onClick={() => { setBrochureFile(null); if (brochureInputRef.current) brochureInputRef.current.value = ""; }} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><X size={13} /></button>
                  </div>
                </div>
              )}
              <input ref={brochureInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleBrochureUpload(e.target.files[0]); }} />
            </div>

            {/* Safety Instructions & Key Features */}
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={fieldLabel}>Safety Instructions / Precautions {requiredStar}</label>
                  <textarea ref={setFieldRef("safetyInstructions") as React.RefCallback<HTMLTextAreaElement>} name="safetyInstructions" value={form.safetyInstructions} onChange={handleChange} rows={4} placeholder="Enter safety warnings, precautions, and handling instructions" className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.safetyInstructions ? "border-red-400" : "border-gray-300"}`} />
                  {errors.safetyInstructions && <p className={errorMsg}>{errors.safetyInstructions}</p>}
                </div>
                <div>
                  <label className={fieldLabel}>Key Features / Technical Specifications {requiredStar}</label>
                  <textarea ref={setFieldRef("keyFeatures") as React.RefCallback<HTMLTextAreaElement>} name="keyFeatures" value={form.keyFeatures} onChange={handleChange} rows={4} placeholder="List key features, technical specifications" className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.keyFeatures ? "border-red-400" : "border-gray-300"}`} />
                  {errors.keyFeatures && <p className={errorMsg}>{errors.keyFeatures}</p>}
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="col-span-1 md:col-span-2">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>} name="productDescription" value={form.productDescription} onChange={handleChange} rows={4} placeholder="Detailed product description" className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.productDescription ? "border-red-400" : "border-gray-300"}`} />
              {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
            </div>
          </div>
        </div>

        {/* ── Section 2: Packaging & Order Details ──────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Packaging &amp; Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {isEdit ? <NonEditableSelect label="Pack Type" value={displayLabels.packTypeLabel} required /> : (
              <div className="flex flex-col gap-1" ref={setFieldRef("packType") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>Pack Type {requiredStar}</label>
                <Select options={packTypeApiOptions} value={packTypeApiOptions.find((o) => o.value === form.packType) || null} onChange={(sel) => handleSelectChange("packType", sel)} placeholder="Select pack type" theme={selectTheme} styles={selectStyles("packType")} />
                {errors.packType && <p className={errorMsg}>{errors.packType}</p>}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Number of Units per Pack Type {requiredStar}</label>
              <input ref={setFieldRef("unitPerPack")} name="unitPerPack" value={form.unitPerPack} onChange={handleChange} placeholder="e.g., 100" inputMode="numeric" className={`${inputBase} ${errors.unitPerPack ? inputError : ""}`} />
              {errors.unitPerPack && <p className={errorMsg}>{errors.unitPerPack}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Number of Packs {requiredStar}</label>
              <input ref={setFieldRef("numberOfPacks")} name="numberOfPacks" value={form.numberOfPacks} onChange={handleChange} placeholder="e.g., 10" inputMode="numeric" className={`${inputBase} ${errors.numberOfPacks ? inputError : ""}`} />
              {errors.numberOfPacks && <p className={errorMsg}>{errors.numberOfPacks}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Pack Size (No. of Units per Pack Type X No. of Packs)</label>
              <input name="packSize" value={form.packSize} readOnly className={`${inputBase} bg-gray-50 [color:#969793] cursor-not-allowed`} />
            </div>
          </div>

          <p className={subSectionTitle}>Order Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Min Order Qty {requiredStar}</label>
              <input ref={setFieldRef("minimumOrderQuantity")} name="minimumOrderQuantity" value={form.minimumOrderQuantity} onChange={handleChange} placeholder="e.g., 1" inputMode="numeric" className={`${inputBase} ${errors.minimumOrderQuantity ? inputError : ""}`} />
              {errors.minimumOrderQuantity && <p className={errorMsg}>{errors.minimumOrderQuantity}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Max Order Qty {requiredStar}</label>
              <input ref={setFieldRef("maximumOrderQuantity")} name="maximumOrderQuantity" value={form.maximumOrderQuantity} onChange={handleChange} placeholder="e.g., 100" inputMode="numeric" className={`${inputBase} ${errors.maximumOrderQuantity ? inputError : ""}`} />
              {errors.maximumOrderQuantity && <p className={errorMsg}>{errors.maximumOrderQuantity}</p>}
            </div>
          </div>

          <p className={subSectionTitle}>Batch Management</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {isEdit ? <NonEditableField label="Manufacturing Date" value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""} /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Manufacturing Date</label>
                <input ref={setFieldRef("manufacturingDate")} type="date" name="manufacturingDate" max={todayStr} onChange={(e) => setForm((p) => ({ ...p, manufacturingDate: e.target.value ? new Date(e.target.value) : null }))} value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""} className={`${inputBase} ${errors.manufacturingDate ? inputError : ""}`} />
                {errors.manufacturingDate && <p className={errorMsg}>{errors.manufacturingDate}</p>}
              </div>
            )}

            {isEdit ? <NonEditableField label="Stock Quantity (in units)" value={form.stockQuantity} required /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>Stock Quantity (in units) {requiredStar}</label>
                <input ref={setFieldRef("stockQuantity")} name="stockQuantity" value={form.stockQuantity} onChange={handleChange} placeholder="e.g., 10" inputMode="numeric" className={`${inputBase} ${errors.stockQuantity ? inputError : ""}`} />
                {errors.stockQuantity && <p className={errorMsg}>{errors.stockQuantity}</p>}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Date of Stock Entry {requiredStar}</label>
              <input type="date" name="dateOfStockEntry" value={todayStr} readOnly className={`${inputBase} bg-gray-50 [color:#969793] cursor-not-allowed`} />
            </div>
          </div>

          <p className={subSectionTitle}>Pricing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Selling Price (per Pack Size) {requiredStar}</label>
              <input ref={setFieldRef("sellingPrice")} name="sellingPrice" value={form.sellingPrice} onChange={handleChange} placeholder="e.g., 4500" inputMode="decimal" className={`${inputBase} ${errors.sellingPrice ? inputError : ""}`} />
              {errors.sellingPrice && <p className={errorMsg}>{errors.sellingPrice}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>MRP (per Pack Size) {requiredStar}</label>
              <input ref={setFieldRef("mrp")} name="mrp" value={form.mrp} onChange={handleChange} placeholder="e.g., 5000" inputMode="decimal" className={`${inputBase} ${errors.mrp ? inputError : ""}`} />
              {errors.mrp && <p className={errorMsg}>{errors.mrp}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Discount Percentage (%)</label>
              <input ref={setFieldRef("discountPercentage")} name="discountPercentage" value={form.discountPercentage} onChange={handleChange} placeholder="0–100" inputMode="decimal" className={`${inputBase} ${errors.discountPercentage ? inputError : ""}`} />
              {errors.discountPercentage && <p className={errorMsg}>{errors.discountPercentage}</p>}
            </div>

            {/* FIX #2/#3: Open CommonModal instead of Drawer */}
            <div className="flex flex-col gap-1">
              <label className={`${fieldLabel} opacity-0`}>_</label>
              <button type="button" onClick={() => setShowAdditionalDiscountModal(true)} style={{ background: "#9F75FC", borderRadius: "8px" }} className="h-12 px-5 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] w-auto self-start hover:opacity-90 transition-opacity flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg></span>
                Add Additional Discount
              </button>
            </div>
          </div>

          {/* {additionalDiscountSlabs.length > 0 && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-800">{additionalDiscountSlabs.length} Discount Slab{additionalDiscountSlabs.length > 1 ? "s" : ""} Added</span>
                <button type="button" onClick={() => setShowAdditionalDiscountModal(true)} className="text-xs text-purple-600 underline">Edit</button>
              </div>
              {additionalDiscountSlabs.map((slab, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-purple-700 py-1.5 border-t border-purple-100">
                  <span>Min Qty: {slab.minimumPurchaseQuantity} — {slab.additionalDiscountPercentage}% off</span>
                  <button type="button" onClick={() => setAdditionalDiscountSlabs((p) => p.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 ml-3"><X size={12} /></button>
                </div>
              ))}
            </div>
          )} */}

          <p className={subSectionTitle}>TAX &amp; BILLING</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {isEdit ? <NonEditableSelect label="GST %" value={displayLabels.gstLabel} required /> : (
              <div className="flex flex-col gap-1" ref={setFieldRef("gstPercentage") as React.RefCallback<HTMLDivElement>}>
                <label className={fieldLabel}>GST % {requiredStar}</label>
                <Select options={gstOptions} value={gstOptions.find((o) => o.value === form.gstPercentage) || null} onChange={(sel) => handleSelectChange("gstPercentage", sel)} placeholder="Select GST" theme={selectTheme} styles={selectStyles("gstPercentage")} />
                {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
              </div>
            )}

            {isEdit ? <NonEditableField label="HSN Code" value={form.hsnCode} required /> : (
              <div className="flex flex-col gap-1">
                <label className={fieldLabel}>HSN Code {requiredStar}</label>
                <input ref={setFieldRef("hsnCode")} type="text" name="hsnCode" value={form.hsnCode} onChange={handleChange} placeholder="4, 6, or 8 digit numeric code" maxLength={8} inputMode="numeric" className={`${inputBase} ${errors.hsnCode ? inputError : ""}`} />
                {errors.hsnCode && <p className={errorMsg}>{errors.hsnCode}</p>}
              </div>
            )}
          </div>

          {/* <div className="flex justify-end mt-5">
            <button type="button" onClick={handleSubmit} disabled={submitting} style={{ background: "#9F75FC", borderRadius: "8px" }} className="px-8 py-3 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? "Saving..." : "Save"}
            </button>
          </div> */}
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

  {/* Existing Images (edit mode) */}
  {existingImages.length > 0 && (
    <div className="mb-4">
      <p className="text-sm font-semibold text-gray-600 mb-2">Current Images</p>
      <div className="flex flex-wrap gap-3">
        {existingImages.map((url, i) => (
          <div key={i} className="relative flex-shrink-0">
            <img
              src={url}
              alt={`existing-${i}`}
              className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200"
            />
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Drop Zone */}
  <div
    className="border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
    onClick={() => document.getElementById("ncFileInput")?.click()}
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => {
      e.preventDefault();
      if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files);
    }}
  >
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="w-12 h-12 flex items-center justify-center">
        <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 object-contain" />
      </div>
      <div className="text-sm font-medium text-gray-600 text-center">
        Choose a file or drag &amp; drop it here
      </div>
      <div className="text-xs text-gray-400 text-center">
        Click to browse PNG, JPG, and SVG
      </div>
    </div>
  </div>

  <input
    id="ncFileInput"
    type="file"
    multiple
    accept="image/jpeg,image/png,image/jpg,image/svg+xml"
    className="hidden"
    onChange={(e) => {
      if (e.target.files) handleImageFiles(e.target.files);
    }}
  />

  {/* New Image Previews */}
  {images.length > 0 && (
    <div className="mt-4 flex flex-wrap gap-3">
      {images.map((file, i) => {
        const url = URL.createObjectURL(file);
        return (
          <div key={i} className="relative group flex-shrink-0">
            <img
              src={url}
              alt={`Product ${i + 1}`}
              className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-purple-300 transition"
            />
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(url);
                setImages((p) => p.filter((_, idx) => idx !== i));
              }}
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