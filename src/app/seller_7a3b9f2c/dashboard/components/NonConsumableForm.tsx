// NonConsumableForm.tsx — supports both create and edit modes
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Select, { StylesConfig, Theme } from "react-select";
import Input from "@/src/app/commonComponents/Input";
import Image from "next/image";
import Drawer from "@/src/app/commonComponents/Drawer";
import AdditionalDiscount from "./AdditionalDiscount";
import { FileText, X, Upload, RefreshCw, AlertCircle } from "lucide-react";
import { sellerAuthService } from "@/src/services/seller/authService";
import { uploadProductImages } from "@/src/services/product/ProductService";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";

interface SelectOption { value: string; label: string; }

interface CertificationTag {
  id: string; label: string; tagCode: string; file: File | null;
  fileName: string; uploading: boolean; isUploaded: boolean;
  previewUrl: string | null; certificationId: number;
  existingUrl?: string;
}

interface AdditionalDiscountSlab {
  minimumPurchaseQuantity: number; additionalDiscountPercentage: number;
  effectiveStartDate: string; effectiveStartTime: string;
  effectiveEndDate: string; effectiveEndTime: string;
}

// ─── Shape of pre-populated data from EditProduct ─────────────────────────────
export interface NonConsumableFormInitialData {
  productId: string;
  productAttributeId?: string;
  productName: string;
  productDescription: string;
  warningsPrecautions: string;
  productMarketingUrl: string;
  manufacturerName: string;
  brandName: string;
  deviceCategoryId: string | number;
  deviceSubCategoryId: string | number;
  modelName: string;
  modelNumber: string;
  keyFeaturesSpecifications: string;
  materialTypeIds: number[];
  purpose: string;
  powerSourceId: string | number;
  storageConditionId: string | number;
  countryId: string | number;
  warrantyPeriod: string;
  udiNumber: string;
  serviceAvailability: boolean;
  deviceClassification: string;
  // packaging
  packagingId?: string;
  packId: string | number;
  unitPerPack: string;
  numberOfPacks: string;
  packSize: string;
  minimumOrderQuantity: string;
  maximumOrderQuantity: string;
  // pricing
  pricingId?: string;
  batchLotNumber: string;
  manufacturingDate: Date | null;
  expiryDate: Date | null;
  dateOfStockEntry: Date | null;
  stockQuantity: string;
  sellingPrice: string;
  mrp: string;
  gstPercentage: string;
  discountPercentage: string;
  additionalDiscounts: AdditionalDiscountData[];
  finalPrice: string;
  hsnCode: string;
  // existing assets
  existingImages?: string[];
  existingBrochureUrl?: string;
  existingCertifications?: { certificationId: number; label: string; url: string }[];
}

interface NonConsumableFormProps {
  deviceType: "non-consumable";
  mode?: "create" | "edit";
  initialData?: NonConsumableFormInitialData;
  onSubmitSuccess?: () => void;
}

interface CertificationMasterOption { value: string; label: string; certificationId: number; tagCode: string; }
interface MasterItem { [key: string]: unknown; }
interface ApiResponseData { [key: string]: unknown; }
type SelectStyles = StylesConfig<SelectOption, false>;

const API_BASE = "https://api-test-aggreator.tiameds.ai/api/v1";
const MASTERS = `${API_BASE}/masters`;

function validateHSNCode(hsnCode: string): string | null {
  const trimmed = hsnCode.trim();
  if (trimmed === "") return null;
  if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(trimmed)) return "HSN code must be 4, 6, or 8 digits";
  const firstTwo = trimmed.substring(0, 2);
  if (!["90", "30", "39", "40", "84", "85"].includes(firstTwo)) return "Medical products typically have HSN codes starting with 90, 30, 39, 40, 84, or 85";
  return null;
}

function deepFind(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) { for (const item of obj) { const r = deepFind(item, key); if (r !== undefined) return r; } return undefined; }
  const rec = obj as Record<string, unknown>;
  if (key in rec && rec[key] != null) return rec[key];
  for (const k of Object.keys(rec)) { const r = deepFind(rec[k], key); if (r !== undefined) return r; }
  return undefined;
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

async function uploadWithRetry(url: string, headers: Record<string, string>, file: File, extra: Record<string, string>, fieldNames: string[], label: string, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const fieldName of fieldNames) {
      try {
        const fd = new FormData();
        Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
        fd.append(fieldName, file);
        const res = await fetch(url, { method: "POST", headers, body: fd });
        if (res.ok) { console.log(`Uploaded ${label} with field: ${fieldName}`); return true; }
      } catch (err) { console.error(`Error uploading ${label} with field ${fieldName}:`, err); }
    }
    if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return false;
}

function getMasterStr(item: MasterItem, ...keys: string[]): string {
  for (const key of keys) { const v = item[key]; if (v != null) return String(v); }
  return "";
}

const NonConsumableForm = ({ mode = "create", initialData, onSubmitSuccess }: NonConsumableFormProps) => {
  const [form, setForm] = useState({
    productName: "", brandName: "", modelName: "", modelNumber: "",
    deviceClassification: "", udiNumber: "", intendedUse: "", keyFeatures: "",
    safetyInstructions: "", countryOfOrigin: "", manufacturerName: "",
    storageCondition: "", deviceCategoryId: "", deviceSubCategoryId: "",
    powerSourceId: "", warrantyPeriod: "", amcAvailability: "",
    productDescription: "", brochureUrl: "", packType: "",
    unitsPerPack: "", numberOfPacks: "", packSize: "",
    minimumOrderQuantity: "", maximumOrderQuantity: "",
    manufacturingDate: null as Date | null, stockQuantity: "",
    dateOfStockEntry: new Date(), mrp: "", sellingPricePerPack: "",
    discountPercentage: "", gstPercentage: "", hsnCode: "", finalPrice: "",
  });

  // Edit-mode IDs
  const [productId, setProductId] = useState("");
  const [productAttributeId, setProductAttributeId] = useState("");
  const [packagingId, setPackagingId] = useState("");
  const [pricingId, setPricingId] = useState("");

  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [deviceSubCategoryOptions, setDeviceSubCategoryOptions] = useState<SelectOption[]>([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);
  const [powerSourceOptions, setPowerSourceOptions] = useState<SelectOption[]>([]);
  const [packTypeApiOptions, setPackTypeApiOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<CertificationMasterOption[]>([]);
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);

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
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);
  const [showDiscountDrawer, setShowDiscountDrawer] = useState(false);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const materialDropdownRef = useRef<HTMLDivElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  const deviceClassOptions: SelectOption[] = [
    { value: "Class A", label: "Class A" }, { value: "Class B", label: "Class B" },
    { value: "Class C", label: "Class C" }, { value: "Class D", label: "Class D" },
  ];
  const gstOptions: SelectOption[] = [
    { value: "0", label: "0%" }, { value: "5", label: "5%" },
    { value: "12", label: "12%" }, { value: "18", label: "18%" },
  ];
  const amcOptions: SelectOption[] = [{ value: "true", label: "Yes" }, { value: "false", label: "No" }];

  const authHeaders = useCallback((): Record<string, string> => {
    const token = sellerAuthService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const convertToDiscountSlab = (data: AdditionalDiscountData[]): AdditionalDiscountSlab[] =>
    data.map((item) => ({
      minimumPurchaseQuantity: item.minimumPurchaseQuantity,
      additionalDiscountPercentage: item.additionalDiscountPercentage,
      effectiveStartDate: item.effectiveStartDate || "", effectiveStartTime: item.effectiveStartTime || "",
      effectiveEndDate: item.effectiveEndDate || "", effectiveEndTime: item.effectiveEndTime || "",
    }));

  const convertToDiscountData = (slabs: AdditionalDiscountSlab[]): AdditionalDiscountData[] => slabs.map((s) => ({ ...s }));

  const fetchList = useCallback(async (url: string, setter: (v: SelectOption[]) => void, idKey: string[], labelKey: string[], fallback?: SelectOption[]) => {
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      const mapped = items.map((i) => ({ value: getMasterStr(i, ...idKey), label: getMasterStr(i, ...labelKey) || "Unknown" })).filter((o) => o.value);
      setter(mapped);
    } catch { if (fallback) setter(fallback); }
  }, [authHeaders]);

  const fetchProductCategoryId = useCallback(async () => {
    try {
      const res = await fetch(`${MASTERS}/categories`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      const nc = items.find((i) => { const n = getMasterStr(i, "categoryName", "name").toLowerCase(); return n.includes("non-consumable") || n.includes("nonconsumable"); });
      setProductCategoryId(nc ? Number(getMasterStr(nc, "categoryId", "id") || "6") : 6);
    } catch { setProductCategoryId(6); }
  }, [authHeaders]);

  const fetchDeviceCategories = useCallback(async () => {
    setLoadingCategories(true); setApiError(null);
    try {
      const res = await fetch(`${MASTERS}/device-categories/non-consumable`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      setDeviceCategoryOptions(items.map((i) => ({ value: getMasterStr(i, "deviceCatId", "id"), label: getMasterStr(i, "deviceName", "name") || "Unknown" })).filter((o) => o.value));
    } catch (err) { setApiError(`Failed to load device categories: ${err instanceof Error ? err.message : String(err)}`); } finally { setLoadingCategories(false); }
  }, [authHeaders]);

  const fetchDeviceSubCategories = useCallback(async (catId: string) => {
    if (!catId) { setDeviceSubCategoryOptions([]); return; }
    setLoadingSubCategories(true);
    try {
      const res = await fetch(`${MASTERS}/device-sub-categories/${catId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      setDeviceSubCategoryOptions(items.map((i) => ({ value: getMasterStr(i, "deviceSubCatId", "subCategoryId", "id"), label: getMasterStr(i, "deviceSubCatName", "subCategoryName", "name") || "Unknown" })).filter((o) => o.value));
    } catch { setDeviceSubCategoryOptions([]); } finally { setLoadingSubCategories(false); }
  }, [authHeaders]);

  // ── Load masters ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDeviceCategories(); fetchProductCategoryId();
    setLoadingMaterialTypes(true);
    fetchList(`${MASTERS}/non-consumable-material-types`, setMaterialTypeOptions, ["materialTypeId", "id"], ["materialTypeName", "name"]).finally(() => setLoadingMaterialTypes(false));
    fetchList(`${MASTERS}/countries`, setCountryOptions, ["countryId", "id"], ["countryName", "name"]);
    fetchList(`${MASTERS}/storagecondition`, setStorageConditionOptions, ["storageConditionId", "id"], ["conditionName", "name"]);
    fetchList(`${MASTERS}/power-sources`, setPowerSourceOptions, ["powerSourceId", "id"], ["powerSourceName", "name"],
      [{ value: "1", label: "Battery Operated" }, { value: "2", label: "Rechargeable" }, { value: "3", label: "Electric" }, { value: "4", label: "USB Powered" }, { value: "5", label: "Manual" }]);
    fetchList(`${MASTERS}/pack-types`, setPackTypeApiOptions, ["packId", "id"], ["packName", "name"],
      [{ value: "1", label: "Box" }, { value: "2", label: "Unit" }, { value: "3", label: "Carrying Case" }, { value: "4", label: "Kit" }, { value: "5", label: "Bag" }]);

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
        { value: "1", label: "CDSCO License Number", certificationId: 1, tagCode: "Tag 01" },
        { value: "2", label: "ISO Certificate", certificationId: 2, tagCode: "Tag 02" },
        { value: "3", label: "CE Certification", certificationId: 3, tagCode: "Tag 03" },
        { value: "4", label: "BIS Certification", certificationId: 4, tagCode: "Tag 04" },
      ]))
      .finally(() => setLoadingCertifications(false));
  }, [fetchDeviceCategories, fetchProductCategoryId, fetchList, authHeaders]);

  // ── Pre-populate from initialData in edit mode ────────────────────────────
  useEffect(() => {
    if (mode !== "edit" || !initialData) return;

    setProductId(initialData.productId);
    setProductAttributeId(initialData.productAttributeId || "");
    setPackagingId(initialData.packagingId || "");
    setPricingId(initialData.pricingId || "");

    setForm({
      productName: initialData.productName,
      brandName: initialData.brandName,
      modelName: initialData.modelName,
      modelNumber: initialData.modelNumber,
      deviceClassification: initialData.deviceClassification,
      udiNumber: initialData.udiNumber,
      intendedUse: initialData.purpose,
      keyFeatures: initialData.keyFeaturesSpecifications,
      safetyInstructions: initialData.warningsPrecautions,
      countryOfOrigin: String(initialData.countryId),
      manufacturerName: initialData.manufacturerName,
      storageCondition: String(initialData.storageConditionId),
      deviceCategoryId: String(initialData.deviceCategoryId),
      deviceSubCategoryId: String(initialData.deviceSubCategoryId),
      powerSourceId: String(initialData.powerSourceId),
      warrantyPeriod: initialData.warrantyPeriod,
      amcAvailability: initialData.serviceAvailability ? "true" : "false",
      productDescription: initialData.productDescription,
      brochureUrl: initialData.productMarketingUrl,
      packType: String(initialData.packId),
      unitsPerPack: initialData.unitPerPack,
      numberOfPacks: initialData.numberOfPacks,
      packSize: initialData.packSize,
      minimumOrderQuantity: initialData.minimumOrderQuantity,
      maximumOrderQuantity: initialData.maximumOrderQuantity,
      manufacturingDate: initialData.manufacturingDate,
      stockQuantity: initialData.stockQuantity,
      dateOfStockEntry: initialData.dateOfStockEntry || new Date(),
      mrp: initialData.mrp,
      sellingPricePerPack: initialData.sellingPrice,
      discountPercentage: initialData.discountPercentage,
      gstPercentage: initialData.gstPercentage,
      hsnCode: initialData.hsnCode,
      finalPrice: initialData.finalPrice,
    } as any);

    if (initialData.additionalDiscounts?.length) {
      setAdditionalDiscountSlabs(convertToDiscountSlab(initialData.additionalDiscounts));
    }
    if (initialData.materialTypeIds?.length) {
      setSelectedMaterialTypes(initialData.materialTypeIds.map(String));
    }
    if (initialData.existingImages?.length) setExistingImages(initialData.existingImages);
    if (initialData.existingBrochureUrl) setExistingBrochureUrl(initialData.existingBrochureUrl);
    if (initialData.existingCertifications?.length) {
      setSelectedCertifications(initialData.existingCertifications.map((c) => ({
        id: String(c.certificationId), label: c.label, tagCode: "",
        certificationId: c.certificationId, file: null,
        fileName: c.url ? c.url.split("/").pop() || "" : "",
        uploading: false, isUploaded: !!c.url, previewUrl: null, existingUrl: c.url,
      })));
    }
    if (initialData.deviceCategoryId) fetchDeviceSubCategories(String(initialData.deviceCategoryId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialData]);

  useEffect(() => {
    if (form.deviceCategoryId) {
      fetchDeviceSubCategories(form.deviceCategoryId);
      if (mode === "create") setForm((p) => ({ ...p, deviceSubCategoryId: "" }));
    } else setDeviceSubCategoryOptions([]);
  }, [form.deviceCategoryId, fetchDeviceSubCategories, mode]);

  useEffect(() => {
    const u = parseFloat(form.unitsPerPack), p = parseFloat(form.numberOfPacks);
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0) setForm((prev) => ({ ...prev, packSize: (u * p).toString() }));
  }, [form.unitsPerPack, form.numberOfPacks]);

  useEffect(() => {
    const s = parseFloat(form.sellingPricePerPack), d = parseFloat(form.discountPercentage);
    setForm((prev) => ({ ...prev, finalPrice: !isNaN(s) && s > 0 ? (isNaN(d) ? s : s - (s * d) / 100).toFixed(2) : "0.00" }));
  }, [form.sellingPricePerPack, form.discountPercentage]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowCertDropdown(false);
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(e.target as Node)) setShowMaterialDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
    if (name === "hsnCode" && value.trim()) {
      const hsnError = validateHSNCode(value);
      if (hsnError) setErrors((p) => ({ ...p, hsnCode: hsnError }));
      else setErrors((p) => { const n = { ...p }; delete n.hsnCode; return n; });
    }
  };

  const handleSelectChange = (field: string, sel: SelectOption | null) => {
    setForm((p) => ({ ...p, [field]: sel ? sel.value : "" }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const handleCertCheckbox = (option: CertificationMasterOption) => {
    const exists = selectedCertifications.some((c) => c.id === option.value);
    if (exists) setSelectedCertifications((p) => p.filter((c) => c.id !== option.value));
    else setSelectedCertifications((p) => [...p, { id: option.value, label: option.label, tagCode: option.tagCode, certificationId: option.certificationId, file: null, fileName: "", uploading: false, isUploaded: false, previewUrl: null }]);
  };

  const handleMaterialCheckbox = (option: SelectOption) => {
    setSelectedMaterialTypes((p) => p.includes(option.value) ? p.filter((v) => v !== option.value) : [...p, option.value]);
    if (errors.materialType) setErrors((p) => { const n = { ...p }; delete n.materialType; return n; });
  };

  const handleCertFileUpload = async (certId: string, file: File) => {
    setSelectedCertifications((p) => p.map((c) => c.id === certId ? { ...c, uploading: true } : c));
    await new Promise((r) => setTimeout(r, 300));
    setSelectedCertifications((p) => p.map((c) => c.id === certId ? { ...c, file, fileName: file.name, uploading: false, isUploaded: true, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null } : c));
  };

  const handleBrochureUpload = async (file: File) => {
    setUploadingBrochure(true);
    await new Promise((r) => setTimeout(r, 300));
    setBrochureFile(file);
    setUploadingBrochure(false);
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.productName.trim() || form.productName.trim().length < 3) e.productName = "Product name required (min 3 characters)";
    if (!form.deviceCategoryId) e.deviceCategoryId = "Device category required";
    if (!form.deviceSubCategoryId) e.deviceSubCategoryId = "Device sub-category required";
    if (!form.brandName.trim()) e.brandName = "Brand name required";
    if (!form.modelName.trim()) e.modelName = "Model name required";
    if (!form.modelNumber.trim()) e.modelNumber = "Model number required";
    if (!form.deviceClassification) e.deviceClassification = "Device classification required";
    if (!form.intendedUse.trim() || form.intendedUse.trim().length < 10) e.intendedUse = "Intended use required (min 10 characters)";
    if (!form.keyFeatures.trim() || form.keyFeatures.trim().length < 10) e.keyFeatures = "Key features required (min 10 characters)";
    if (!form.safetyInstructions.trim() || form.safetyInstructions.trim().length < 10) e.safetyInstructions = "Safety instructions required (min 10 characters)";
    if (selectedCertifications.length === 0) e.certifications = "At least one certification required";
    if (selectedMaterialTypes.length === 0) e.materialType = "At least one material type required";
    if (!form.warrantyPeriod.trim() || !/^\d{1,3}$/.test(form.warrantyPeriod.trim())) e.warrantyPeriod = "Warranty period required (numeric, max 3 digits)";
    if (!form.amcAvailability) e.amcAvailability = "AMC availability required";
    if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin required";
    if (!form.manufacturerName.trim()) e.manufacturerName = "Manufacturer name required";
    if (!form.productDescription.trim() || form.productDescription.trim().length < 20) e.productDescription = "Product description required (min 20 characters)";
    if (!form.packType) e.packType = "Pack type required";
    const uPack = parseFloat(form.unitsPerPack); if (isNaN(uPack) || uPack <= 0) e.unitsPerPack = "Units per pack must be > 0";
    const nPacks = parseFloat(form.numberOfPacks); if (isNaN(nPacks) || nPacks <= 0) e.numberOfPacks = "Number of packs must be > 0";
    const minQ = parseFloat(form.minimumOrderQuantity); if (isNaN(minQ) || minQ <= 0) e.minimumOrderQuantity = "Min order qty must be > 0";
    const maxQ = parseFloat(form.maximumOrderQuantity); if (isNaN(maxQ) || maxQ <= 0) e.maximumOrderQuantity = "Max order qty must be > 0";
    if (!isNaN(minQ) && !isNaN(maxQ) && maxQ < minQ) e.maximumOrderQuantity = "Max order qty must be >= minimum";
    if (!form.manufacturingDate) e.manufacturingDate = "Manufacturing date required";
    if (form.manufacturingDate && form.manufacturingDate > new Date()) e.manufacturingDate = "Manufacturing date cannot be in the future";
    const stock = parseFloat(form.stockQuantity); if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be > 0";
    const mrp = parseFloat(form.mrp), selling = parseFloat(form.sellingPricePerPack);
    if (isNaN(selling) || selling <= 0) e.sellingPricePerPack = "Selling price must be > 0";
    if (isNaN(mrp) || mrp <= 0) e.mrp = "MRP must be > 0";
    if (!isNaN(mrp) && !isNaN(selling) && mrp < selling) e.mrp = "MRP must be >= selling price";
    if (!form.gstPercentage) e.gstPercentage = "GST percentage required";
    if (!form.hsnCode.trim()) { e.hsnCode = "HSN code required"; } else { const hsnError = validateHSNCode(form.hsnCode); if (hsnError) e.hsnCode = hsnError; }
    if (mode === "create" && images.length === 0) e.images = "At least 1 product image required";
    if (images.length > 8) e.images = "Maximum 8 images allowed";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    if (!productCategoryId) { setApiError("Product category not loaded. Please refresh."); return; }

    setSubmitting(true); setApiError(null);
    try {
      const token = sellerAuthService.getToken();
      if (!token) throw new Error("Authentication required.");
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const jsonHeaders = { ...headers, "Content-Type": "application/json" };

      const devCatId = Number(form.deviceCategoryId), devSubCatId = Number(form.deviceSubCategoryId);
      if (isNaN(devCatId) || devCatId <= 0) throw new Error("Invalid device category selected");
      if (isNaN(devSubCatId) || devSubCatId <= 0) throw new Error("Invalid device sub-category selected");

      const payload = {
        productName: form.productName,
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.brochureUrl || "",
        manufacturerName: form.manufacturerName,
        categoryId: String(productCategoryId),
        packagingDetails: {
          ...(packagingId ? { packagingId } : {}),
          packId: Number(form.packType), unitPerPack: form.unitsPerPack,
          numberOfPacks: Number(form.numberOfPacks), packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity), maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },
        pricingDetails: [{
          ...(pricingId ? { pricingId } : {}),
          manufacturingDate: form.manufacturingDate?.toISOString() ?? null,
          stockQuantity: Number(form.stockQuantity),
          dateOfStockEntry: form.dateOfStockEntry?.toISOString() ?? new Date().toISOString(),
          sellingPrice: Number(form.sellingPricePerPack), mrp: Number(form.mrp),
          discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : 0,
          gstPercentage: Number(form.gstPercentage), finalPrice: Number(form.finalPrice),
          hsnCode: form.hsnCode, additionalDiscounts: additionalDiscountSlabs,
        }],
        productAttributeNonConsumableMedicals: [{
          ...(productAttributeId ? { productAttributeId } : {}),
          deviceCategoryId: devCatId, deviceSubCategoryId: devSubCatId,
          brandName: form.brandName, modelName: form.modelName, modelNumber: form.modelNumber,
          deviceClassification: form.deviceClassification, udiNumber: form.udiNumber || "",
          purpose: form.intendedUse, keyFeaturesSpecifications: form.keyFeatures,
          certificateDocuments: selectedCertifications.map((c) => ({ certificationId: c.certificationId, certificateUrl: c.existingUrl || "PENDING" })),
          materialTypeIds: selectedMaterialTypes.map(Number),
          powerSourceId: form.powerSourceId ? Number(form.powerSourceId) : null,
          warrantyPeriod: form.warrantyPeriod, amcAvailability: form.amcAvailability === "true",
          countryId: Number(form.countryOfOrigin), manufacturerName: form.manufacturerName,
          storageConditionId: form.storageCondition ? Number(form.storageCondition) : null,
          brochurePath: existingBrochureUrl || "PENDING",
        }],
        productImages: images.map(() => ({ productImage: "PENDING" })),
      };

      let resolvedProductId = productId;
      let resolvedAttributeId = productAttributeId;

      if (mode === "edit" && productId) {
        // Update existing product
        const updateRes = await fetch(`${API_BASE}/products/update/${productId}`, { method: "PUT", headers: jsonHeaders, body: JSON.stringify(payload) });
        if (!updateRes.ok) throw new Error("Failed to update product");
        
        // Upload new images if any
        if (images.length > 0) {
          const imageFd = new FormData();
          images.forEach((img) => imageFd.append("images", img));
          const uploadRes = await fetch(`${API_BASE}/product-images/${productId}`, { method: "POST", headers, body: imageFd });
          if (!uploadRes.ok) throw new Error("Failed to upload product images");
        }
      } else {
        // Create new product
        const createRes = await fetch(`${API_BASE}/products/create`, { method: "POST", headers: jsonHeaders, body: JSON.stringify(payload) });
        const rawText = await createRes.text();
        let createData: ApiResponseData;
        try { createData = JSON.parse(rawText) as ApiResponseData; } catch { throw new Error(`Invalid server response: ${rawText.substring(0, 200)}`); }
        if (!createRes.ok) throw new Error(String((createData?.data as any)?.message ?? createData?.message ?? `HTTP ${createRes.status}`));
        const dataInner = createData?.data as ApiResponseData | undefined;
        resolvedProductId = String(dataInner?.productId ?? createData?.productId ?? "").trim();
        if (!resolvedProductId || resolvedProductId === "undefined") throw new Error("Product ID not returned from server");
        resolvedAttributeId = extractProductAttributeId(createData) || "";
        
        // Upload images for new product
        if (images.length > 0) {
          const imageFd = new FormData();
          images.forEach((img) => imageFd.append("images", img));
          const uploadRes = await fetch(`${API_BASE}/product-images/${resolvedProductId}`, { method: "POST", headers, body: imageFd });
          if (!uploadRes.ok) throw new Error("Failed to upload product images");
        }
      }

      // Upload certificates and brochure if we have attribute ID
      if (resolvedAttributeId) {
        const certBaseUrl = `${API_BASE}/product-documents/non-consumable/${resolvedAttributeId}/certificates`;
        const brochureUrl = `${API_BASE}/product-documents/non-consumable/${resolvedAttributeId}/brochure`;
        
        for (const cert of selectedCertifications.filter((c) => c.file)) {
          await uploadWithRetry(certBaseUrl, headers, cert.file!, { certificationId: String(cert.certificationId) }, ["certificate", "certificateFile", "certFile", "file"], `certificate: ${cert.label}`, 3);
        }
        if (brochureFile) {
          await uploadWithRetry(brochureUrl, headers, brochureFile, {}, ["brochure", "brochureFile", "file", "document"], "brochure", 3);
        }
      }

      alert(`Product ${mode === "edit" ? "updated" : "created"} successfully!`);
      if (onSubmitSuccess) onSubmitSuccess();
      else window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setApiError(errorMessage);
      alert(`Failed to ${mode === "edit" ? "update" : "create"} product: ${errorMessage}`);
    } finally { setSubmitting(false); }
  };

  const selectStyles = (errorKey: string): SelectStyles => ({
    control: (base, state) => ({
      ...base, height: "56px", minHeight: "56px", borderRadius: "16px",
      borderColor: errors[errorKey] ? "#FF3B3B" : state.isFocused ? "#4B0082" : "#737373",
      boxShadow: "none", cursor: "pointer", "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 16px", cursor: "pointer" }),
    indicatorsContainer: (base) => ({ ...base, height: "56px", cursor: "pointer" }),
    dropdownIndicator: (base, state) => ({ ...base, color: state.isFocused ? "#4B0082" : "#737373", cursor: "pointer", "&:hover": { color: "#4B0082" } }),
    option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? "#4B0082" : state.isFocused ? "#F3E8FF" : "white", color: state.isSelected ? "white" : "#1E1E1E", cursor: "pointer", "&:active": { backgroundColor: "#4B0082", color: "white" } }),
    placeholder: (base) => ({ ...base, color: "#A3A3A3" }),
    singleValue: (base) => ({ ...base, color: "#1E1E1E" }),
  });

  const selectTheme = (theme: Theme) => ({ ...theme, colors: { ...theme.colors, primary: "#4B0082", primary25: "#F3E8FF", primary50: "#E9D5FF" } });

  return (
    <div className="flex flex-col gap-5 max-w-full mx-auto">
      {apiError && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-red-700 text-sm">{apiError}</span>
        </div>
      )}

      {/* Section 1 - Product Details */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-h3 font-semibold mb-3">Product Details</div>
        <div className="border-b border-neutral-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-8 gap-y-4">
          <Input label="Product Name" name="productName" placeholder="e.g., Digital BP Monitor"
            onChange={handleChange} value={form.productName} error={errors.productName} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Device Category <span className="text-warning-500 ml-1">*</span></label>
            <Select options={deviceCategoryOptions} isLoading={loadingCategories}
              value={deviceCategoryOptions.find((o) => o.value === form.deviceCategoryId) || null}
              onChange={(sel) => handleSelectChange("deviceCategoryId", sel)}
              placeholder={loadingCategories ? "Loading..." : "Select category"} theme={selectTheme} styles={selectStyles("deviceCategoryId")} />
            {errors.deviceCategoryId && <p className="text-red-500 text-sm mt-1">{errors.deviceCategoryId}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Device Sub-Category <span className="text-warning-500 ml-1">*</span></label>
            <Select options={deviceSubCategoryOptions} isLoading={loadingSubCategories} isDisabled={!form.deviceCategoryId}
              value={deviceSubCategoryOptions.find((o) => o.value === form.deviceSubCategoryId) || null}
              onChange={(sel) => handleSelectChange("deviceSubCategoryId", sel)}
              placeholder={form.deviceCategoryId ? (loadingSubCategories ? "Loading..." : "Select sub-category") : "Select category first"}
              theme={selectTheme} styles={selectStyles("deviceSubCategoryId")} />
            {errors.deviceSubCategoryId && <p className="text-red-500 text-sm mt-1">{errors.deviceSubCategoryId}</p>}
          </div>

          <Input label="Brand Name" name="brandName" placeholder="e.g., Omron, Philips"
            onChange={handleChange} value={form.brandName} error={errors.brandName} required />
          <Input label="Model Name" name="modelName" placeholder="e.g., Pro X"
            onChange={handleChange} value={form.modelName} error={errors.modelName} required />
          <Input label="Model Number" name="modelNumber" placeholder="e.g., ACX-200"
            onChange={handleChange} value={form.modelNumber} error={errors.modelNumber} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Device Classification <span className="text-warning-500 ml-1">*</span></label>
            <Select options={deviceClassOptions} value={deviceClassOptions.find((o) => o.value === form.deviceClassification) || null}
              onChange={(sel) => handleSelectChange("deviceClassification", sel)}
              placeholder="Select device classification" theme={selectTheme} styles={selectStyles("deviceClassification")} />
            {errors.deviceClassification && <p className="text-red-500 text-sm mt-1">{errors.deviceClassification}</p>}
          </div>

          <Input label="UDI / Serial Number (Optional)" name="udiNumber"
            onChange={handleChange} value={form.udiNumber} />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Material / Build Type <span className="text-warning-500 ml-1">*</span></label>
            <div className="relative" ref={materialDropdownRef}>
              <div onClick={() => setShowMaterialDropdown((p) => !p)}
                className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${errors.materialType ? "border-red-500" : "border-neutral-300"}`}>
                <span className="text-sm text-neutral-700 truncate pr-2">
                  {selectedMaterialTypes.length > 0 ? selectedMaterialTypes.map((v) => materialTypeOptions.find((o) => o.value === v)?.label).join(", ") : "Select material types"}
                </span>
                <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${showMaterialDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {showMaterialDropdown && (
                <div className="absolute z-20 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                  {loadingMaterialTypes ? <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div> : (
                    materialTypeOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer">
                        <input type="checkbox" checked={selectedMaterialTypes.includes(opt.value)} onChange={() => handleMaterialCheckbox(opt)} className="accent-purple-600" />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.materialType && <p className="text-red-500 text-sm mt-1">{errors.materialType}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Power Source</label>
            <Select options={powerSourceOptions} value={powerSourceOptions.find((o) => o.value === form.powerSourceId) || null}
              onChange={(sel) => handleSelectChange("powerSourceId", sel)} placeholder="Select power source" theme={selectTheme} styles={selectStyles("powerSourceId")} isClearable />
          </div>

          <Input label="Warranty Period (months)" name="warrantyPeriod" placeholder="e.g., 12"
            onChange={handleChange} value={form.warrantyPeriod} error={errors.warrantyPeriod} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">AMC / Service Availability <span className="text-warning-500 ml-1">*</span></label>
            <Select options={amcOptions} value={amcOptions.find((o) => o.value === form.amcAvailability) || null}
              onChange={(sel) => handleSelectChange("amcAvailability", sel)} placeholder="Select Yes or No" theme={selectTheme} styles={selectStyles("amcAvailability")} />
            {errors.amcAvailability && <p className="text-red-500 text-sm mt-1">{errors.amcAvailability}</p>}
          </div>

          {/* Certifications */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">Certifications / Compliance <span className="text-warning-500 ml-1">*</span></label>
                <div className="relative" ref={dropdownRef}>
                  <div onClick={() => setShowCertDropdown((p) => !p)}
                    className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${errors.certifications ? "border-red-500" : "border-neutral-300"}`}>
                    <span className="text-sm text-neutral-700 truncate pr-2">
                      {selectedCertifications.length > 0 ? selectedCertifications.map((c) => c.label).join(", ") : "Select certifications"}
                    </span>
                    <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${showCertDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {showCertDropdown && (
                    <div className="absolute z-20 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                      {loadingCertifications ? <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div> : (
                        certificationMasterOptions.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer">
                            <input type="checkbox" checked={selectedCertifications.some((c) => c.id === opt.value)} onChange={() => handleCertCheckbox(opt)} className="accent-purple-600" />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.certifications && <p className="text-red-500 text-sm mt-1">{errors.certifications}</p>}
              </div>

              <div>
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">Upload Certificate Documents <span className="text-warning-500 ml-1">*</span></label>
                {selectedCertifications.length === 0 ? (
                  <div className="w-full border border-neutral-300 rounded-xl flex items-center h-14 overflow-hidden">
                    <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0"><Upload size={18} className="text-purple-700" /></div>
                    <span className="text-gray-400 text-sm px-3">Select certifications first</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedCertifications.map((cert) => (
                      <div key={cert.id}>
                        {cert.existingUrl && !cert.file ? (
                          <div className="flex items-center border border-purple-300 rounded-xl overflow-hidden h-14 bg-purple-50">
                            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-purple-700" /></div>
                            <div className="flex-1 px-3 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{cert.label}</p>
                              <p className="text-xs text-neutral-500">Existing certificate</p>
                            </div>
                            <div className="flex items-center gap-1 pr-3">
                              <button type="button" onClick={() => document.getElementById(`nc-cert-upload-${cert.id}`)?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700" title="Replace"><RefreshCw size={14} /></button>
                              <button type="button" onClick={() => setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id))} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500" title="Remove"><X size={14} /></button>
                            </div>
                          </div>
                        ) : !cert.isUploaded ? (
                          <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-14 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition"
                            onClick={() => document.getElementById(`nc-cert-upload-${cert.id}`)?.click()}>
                            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                              {cert.uploading ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} className="text-purple-700" />}
                            </div>
                            <span className="px-3 text-sm text-neutral-600 truncate flex-1">{cert.uploading ? "Processing..." : cert.label}</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id)); }} className="pr-3 text-neutral-400 hover:text-red-500"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center border border-purple-300 rounded-xl overflow-hidden h-14 bg-purple-50">
                            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-purple-700" /></div>
                            <div className="flex-1 px-3 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{cert.fileName}</p>
                              <p className="text-xs text-neutral-500">{cert.label}</p>
                            </div>
                            <div className="flex items-center gap-1 pr-3">
                              <button type="button" onClick={() => document.getElementById(`nc-cert-upload-${cert.id}`)?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700" title="Replace"><RefreshCw size={14} /></button>
                              <button type="button" onClick={() => setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id))} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500" title="Remove"><X size={14} /></button>
                            </div>
                          </div>
                        )}
                        <input id={`nc-cert-upload-${cert.id}`} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleCertFileUpload(cert.id, e.target.files[0]); }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Input label="Intended Use / Purpose" name="intendedUse" placeholder="e.g., Blood pressure monitoring"
            onChange={handleChange} value={form.intendedUse} error={errors.intendedUse} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Country of Origin <span className="text-warning-500 ml-1">*</span></label>
            <Select options={countryOptions} value={countryOptions.find((o) => o.value === form.countryOfOrigin) || null}
              onChange={(sel) => handleSelectChange("countryOfOrigin", sel)} placeholder="Select country" theme={selectTheme} styles={selectStyles("countryOfOrigin")} />
            {errors.countryOfOrigin && <p className="text-red-500 text-sm mt-1">{errors.countryOfOrigin}</p>}
          </div>

          <Input label="Manufacturer Name" name="manufacturerName"
            onChange={handleChange} value={form.manufacturerName} error={errors.manufacturerName} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Storage Condition</label>
            <Select options={storageConditionOptions} value={storageConditionOptions.find((o) => o.value === form.storageCondition) || null}
              onChange={(sel) => handleSelectChange("storageCondition", sel)} placeholder="Select storage condition" theme={selectTheme} styles={selectStyles("storageCondition")} isClearable />
          </div>

          {/* Brochure */}
          <div>
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-3">Upload Product Brochure / User Manual</label>
            {existingBrochureUrl && !brochureFile && (
              <div className="mb-2 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <FileText size={16} />
                <a href={existingBrochureUrl} target="_blank" rel="noreferrer" className="underline truncate">Current brochure</a>
                <button type="button" onClick={() => setExistingBrochureUrl("")} className="ml-auto text-neutral-400 hover:text-red-500"><X size={14} /></button>
              </div>
            )}
            {!brochureFile ? (
              <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-14 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition" onClick={() => brochureInputRef.current?.click()}>
                <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                  {uploadingBrochure ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} className="text-purple-700" />}
                </div>
                <span className="px-3 text-sm text-neutral-400">{uploadingBrochure ? "Processing..." : existingBrochureUrl ? "Upload to replace" : "Upload PDF (max 5MB)"}</span>
              </div>
            ) : (
              <div className="flex items-center border border-purple-300 rounded-xl overflow-hidden h-14 bg-purple-50">
                <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-purple-700" /></div>
                <div className="flex-1 px-3 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{brochureFile.name}</p>
                  <p className="text-xs text-neutral-500">{(brochureFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex items-center gap-1 pr-3">
                  <button type="button" onClick={() => brochureInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700"><RefreshCw size={14} /></button>
                  <button type="button" onClick={() => { setBrochureFile(null); if (brochureInputRef.current) brochureInputRef.current.value = ""; }} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><X size={14} /></button>
                </div>
              </div>
            )}
            <input ref={brochureInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleBrochureUpload(e.target.files[0]); }} />
          </div>

          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">Safety Instructions / Precautions <span className="text-warning-500 ml-1">*</span></label>
                <textarea name="safetyInstructions" value={form.safetyInstructions} onChange={handleChange} rows={4}
                  className={`w-full rounded-2xl p-3 resize-none border ${errors.safetyInstructions ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`} />
                {errors.safetyInstructions && <p className="text-red-500 text-sm mt-1">{errors.safetyInstructions}</p>}
              </div>
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">Key Features / Technical Specifications <span className="text-warning-500 ml-1">*</span></label>
                <textarea name="keyFeatures" value={form.keyFeatures} onChange={handleChange} rows={4}
                  className={`w-full rounded-2xl p-3 resize-none border ${errors.keyFeatures ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`} />
                {errors.keyFeatures && <p className="text-red-500 text-sm mt-1">{errors.keyFeatures}</p>}
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">Product Description <span className="text-warning-500 ml-1">*</span></label>
            <textarea name="productDescription" value={form.productDescription} onChange={handleChange} rows={4}
              className={`w-full rounded-2xl p-3 resize-none border ${errors.productDescription ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`} />
            {errors.productDescription && <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>}
          </div>
        </div>
      </div>

      {/* Section 2 - Packaging & Order Details */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-h3 font-semibold mb-3">Packaging & Order Details</div>
        <div className="border-b border-neutral-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-8">
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Pack Type <span className="text-warning-500 ml-1">*</span></label>
            <Select options={packTypeApiOptions} value={packTypeApiOptions.find((o) => o.value === form.packType) || null}
              onChange={(sel) => handleSelectChange("packType", sel)} placeholder="Select pack type" theme={selectTheme} styles={selectStyles("packType")} />
            {errors.packType && <p className="text-red-500 text-sm mt-1">{errors.packType}</p>}
          </div>
          <Input label="Number of Units per Pack Type" name="unitsPerPack" onChange={handleChange} value={form.unitsPerPack} error={errors.unitsPerPack} required />
          <Input label="Number of Packs" name="numberOfPacks" onChange={handleChange} value={form.numberOfPacks} error={errors.numberOfPacks} required />
          <Input label="Pack Size (auto calculated)" name="packSize" value={form.packSize} disabled required />
          <Input label="Minimum Order Quantity" name="minimumOrderQuantity" onChange={handleChange} value={form.minimumOrderQuantity} error={errors.minimumOrderQuantity} required />
          <Input label="Maximum Order Quantity" name="maximumOrderQuantity" onChange={handleChange} value={form.maximumOrderQuantity} error={errors.maximumOrderQuantity} required />
        </div>

        <div className="mb-4"><div className="text-h6 text-neutral-900 font-regular mb-2">Stock Details</div><div className="border-b border-neutral-200" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="Manufacturing Date" type="date" name="manufacturingDate"
            onChange={(e) => setForm((p) => ({ ...p, manufacturingDate: e.target.value ? new Date(e.target.value) : null }))}
            value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""} error={errors.manufacturingDate} required />
          <Input label="Stock Quantity" name="stockQuantity" onChange={handleChange} value={form.stockQuantity} error={errors.stockQuantity} required />
          <Input label="Date of Stock Entry" type="date" name="dateOfStockEntry"
            onChange={(e) => setForm((p) => ({ ...p, dateOfStockEntry: e.target.value ? new Date(e.target.value) : new Date() }))}
            value={form.dateOfStockEntry ? form.dateOfStockEntry.toISOString().split("T")[0] : ""} />
        </div>

        <div className="mb-4"><div className="text-h6 text-neutral-900 font-regular mb-2">Pricing</div><div className="border-b border-neutral-200" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="MRP (per pack size)" name="mrp" onChange={handleChange} value={form.mrp} error={errors.mrp} required />
          <Input label="Selling Price (per pack size)" name="sellingPricePerPack" onChange={handleChange} value={form.sellingPricePerPack} error={errors.sellingPricePerPack} required />
          <Input label="Discount Percentage (%)" name="discountPercentage" onChange={handleChange} value={form.discountPercentage} />
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 font-semibold opacity-0">_</label>
            <button type="button" onClick={() => setShowDiscountDrawer(true)} className="px-4 py-2 h-14 bg-[#9F75FC] text-white rounded-xl font-semibold w-1/2 hover:bg-purple-600">+ Add Additional Discount</button>
          </div>
        </div>

        {additionalDiscountSlabs.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-purple-800">{additionalDiscountSlabs.length} Discount Slab{additionalDiscountSlabs.length > 1 ? "s" : ""} Added</span>
              <button type="button" onClick={() => setShowDiscountDrawer(true)} className="text-xs text-purple-600 underline">Edit</button>
            </div>
            {additionalDiscountSlabs.map((slab, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-purple-700 py-1 border-t border-purple-100">
                <span>Min Qty: {slab.minimumPurchaseQuantity} — {slab.additionalDiscountPercentage}% off</span>
                <button type="button" onClick={() => setAdditionalDiscountSlabs((p) => p.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 ml-3"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4"><div className="text-h6 text-neutral-900 font-regular mb-2">Tax & Billing</div><div className="border-b border-neutral-200" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">GST Percentage <span className="text-warning-500 ml-1">*</span></label>
            <Select options={gstOptions} value={gstOptions.find((o) => o.value === form.gstPercentage) || null}
              onChange={(sel) => handleSelectChange("gstPercentage", sel)} placeholder="Select GST" theme={selectTheme} styles={selectStyles("gstPercentage")} />
            {errors.gstPercentage && <p className="text-red-500 text-sm mt-1">{errors.gstPercentage}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">HSN Code <span className="text-warning-500 ml-1">*</span></label>
            <input type="text" name="hsnCode" value={form.hsnCode} onChange={handleChange} placeholder="e.g., 90183110"
              className={`w-full h-14 px-4 border rounded-xl focus:outline-none focus:ring-0 ${errors.hsnCode ? "border-red-500" : "border-neutral-300 focus:border-[#4B0082]"}`} />
            {errors.hsnCode && <p className="text-red-500 text-sm mt-1">{errors.hsnCode}</p>}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-label-l3 text-primary-1000 font-semibold mb-1">Final Price (after discounts):</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-700">₹</span>
            <input type="text" value={form.finalPrice || "0.00"} disabled className="w-full h-12 pl-8 pr-4 rounded-xl border-2 border-[#C4AAFD] bg-[#F8F5FF] text-primary-700 focus:outline-none cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* Section 3 - Product Photos */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-p3 text-neutral-900 font-semibold mb-2">Product Photos {mode === "create" && <span className="text-warning-500">*</span>}</div>

        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-neutral-600 mb-2">Current Images</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {existingImages.map((url, i) => (
                <img key={i} src={url} alt={`existing-${i}`} className="w-full aspect-square object-cover rounded-xl border-2 border-neutral-200" />
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-2">Upload new images below to add more.</p>
          </div>
        )}

        <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 cursor-pointer hover:border-purple-400 transition"
          onClick={() => document.getElementById("ncFileInput")?.click()}>
          <div className="flex flex-col items-center justify-center py-4">
            <Image src="/icons/FolderIcon.svg" alt="upload" width={40} height={40} className="mb-4" />
            <div className="text-label-l2 font-normal text-center">Choose files or drag and drop them here</div>
            <div className="text-label-l1 font-normal text-neutral-400 text-center">Upload product images — maximum 8</div>
          </div>
        </div>
        <input id="ncFileInput" type="file" multiple accept="image/jpeg,image/png,image/jpg" className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              const files = Array.from(e.target.files);
              if (images.length + files.length > 8) { alert("Maximum 8 images allowed"); return; }
              setImages((p) => [...p, ...files]);
              setErrors((p) => { const n = { ...p }; delete n.images; return n; });
            }
          }} />
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((file, i) => {
              const url = URL.createObjectURL(file);
              return (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Product ${i + 1}`} className="w-full aspect-square object-cover rounded-xl border-2 border-neutral-200 group-hover:border-purple-300 transition" />
                  <button type="button" onClick={() => { URL.revokeObjectURL(url); setImages((p) => p.filter((_, idx) => idx !== i)); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
                </div>
              );
            })}
          </div>
        )}
        {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pb-8">
        <div className="flex gap-4">
          <button type="button" onClick={() => onSubmitSuccess ? onSubmitSuccess() : window.location.reload()}
            className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer hover:bg-red-50 transition">Cancel</button>
          <button type="button" className="px-6 py-2 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition">
            <Image src="/icons/SaveDraftIcon.svg" alt="draft" width={20} height={20} />
            Save Draft
          </button>
        </div>
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-60 flex items-center gap-2">
          {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
        </button>
      </div>

      {showDiscountDrawer && (
        <Drawer setShowDrawer={setShowDiscountDrawer} title="Additional Discount">
          <AdditionalDiscount
            onSave={(slabs?: AdditionalDiscountData[]) => {
              if (slabs) setAdditionalDiscountSlabs(convertToDiscountSlab(slabs));
              setShowDiscountDrawer(false);
            }}
            initialData={convertToDiscountData(additionalDiscountSlabs)}
          />
        </Drawer>
      )}
    </div>
  );
};

export default NonConsumableForm;