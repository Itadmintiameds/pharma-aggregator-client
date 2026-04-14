// ConsumableForm.tsx - COMPLETE FIXED VERSION (no ESLint errors)
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Select, { StylesConfig, Theme } from "react-select";
import Input from "@/src/app/commonComponents/Input";
import Image from "next/image";
import Drawer from "@/src/app/commonComponents/Drawer";
import AdditionalDiscount from "./AdditionalDiscount";
import { FileText, X, Upload, RefreshCw, AlertCircle } from "lucide-react";
import { sellerAuthService } from "@/src/services/seller/authService";
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
  certificationId: number;
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
  deviceType: "consumable";
  onSubmitSuccess?: () => void;
}

interface CertificationMasterOption {
  value: string;
  label: string;
  certificationId: number;
  tagCode: string;
}

// Shape of items returned from master API endpoints
interface MasterItem {
  [key: string]: unknown;
}

// Shape of the product creation API response (loosely typed)
interface ApiResponseData {
  [key: string]: unknown;
}

type SelectStyles = StylesConfig<SelectOption, false>;

const API_BASE = "https://api-test-aggreator.tiameds.ai/api/v1";
const MASTERS = `${API_BASE}/masters`;

function validateHSNCode(hsnCode: string): string | null {
  const trimmed = hsnCode.trim();
  if (trimmed === "") return null;
  if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(trimmed)) {
    return "HSN code must be 4, 6, or 8 digits";
  }
  const firstTwo = trimmed.substring(0, 2);
  if (!["30", "39", "40", "90", "84", "85"].includes(firstTwo)) {
    return "Medical consumables typically have HSN codes starting with 30, 39, 40, 84, 85, or 90";
  }
  return null;
}

function deepFind(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = deepFind(item, key);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  const rec = obj as Record<string, unknown>;
  if (key in rec && rec[key] != null) return rec[key];
  for (const k of Object.keys(rec)) {
    const r = deepFind(rec[k], key);
    if (r !== undefined) return r;
  }
  return undefined;
}

function extractProductAttributeId(data: ApiResponseData): string | undefined {
  const dataInner = data?.data as ApiResponseData | undefined;

  const consumableAttr = dataInner?.productAttributeConsumableMedicals;
  if (Array.isArray(consumableAttr) && consumableAttr.length > 0) {
    const id = (consumableAttr[0] as ApiResponseData)?.productAttributeId;
    if (id != null) return String(id);
  }

  const directAttr = data?.productAttributeConsumableMedicals;
  if (Array.isArray(directAttr) && directAttr.length > 0) {
    const id = (directAttr[0] as ApiResponseData)?.productAttributeId;
    if (id != null) return String(id);
  }

  const genericId = dataInner?.productAttributeId;
  if (genericId != null) return String(genericId);

  const directGenericId = data?.productAttributeId;
  if (directGenericId != null) return String(directGenericId);

  const deep = deepFind(data, "productAttributeId");
  if (deep !== undefined) return String(deep);

  console.error("productAttributeId not found in response");
  return undefined;
}

async function uploadDocument(
  url: string,
  headers: Record<string, string>,
  file: File,
  extraFields: Record<string, string>,
  documentType: string,
  maxAttempts: number = 3
): Promise<{ success: boolean; fieldUsed?: string; response?: string }> {
  const fieldNamesByType: Record<string, string[]> = {
    certificate: [
      "certificate", "certificateFile", "certFile", "file", "document",
      "certDocument", "certificateDocument", "certificateUrl", "certificate_file",
      "cert", "certificatePath",
    ],
    brochure: [
      "brochure", "brochureFile", "file", "document", "pdfFile", "brochurePdf",
      "brochureUrl", "manual", "userManual", "brochure_file", "brochurePath", "pdf",
    ],
    image: ["images", "productImages", "image", "file", "files", "productImage", "photo", "picture"],
  };

  const fieldNames = [...(fieldNamesByType[documentType.toLowerCase()] ?? ["file", "document"])];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const fieldName of fieldNames) {
      try {
        const formData = new FormData();
        Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
        formData.append(fieldName, file);

        const response = await fetch(url, { method: "POST", headers, body: formData });
        const responseText = await response.text();

        if (response.ok) {
          return { success: true, fieldUsed: fieldName, response: responseText };
        }

        const requiredMatch = responseText.match(
          /Required (?:part|field|parameter) ['"]?(\w+)['"]? is (?:not present|missing|required)/i
        );
        if (requiredMatch) {
          const requiredField = requiredMatch[1];
          if (!fieldNames.includes(requiredField)) fieldNames.push(requiredField);
        }

        console.warn(`[${documentType}] Field "${fieldName}" failed: ${response.status}`);
      } catch (error) {
        console.error(`[${documentType}] Error with field "${fieldName}":`, error);
      }
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  return { success: false };
}

// Helper to safely get a string value from a MasterItem
function getMasterStr(item: MasterItem, ...keys: string[]): string {
  for (const key of keys) {
    const v = item[key];
    if (v != null) return String(v);
  }
  return "";
}

const ConsumableForm = ({ onSubmitSuccess }: ConsumableFormProps) => {
  const [form, setForm] = useState({
    productName: "", deviceCategoryId: "", deviceSubCategoryId: "",
    brandName: "", sizeDimension: "", sterileStatus: "",
    disposableType: "", shelfLife: "", intendedUse: "", keyFeatures: "",
    safetyInstructions: "", countryOfOrigin: "", manufacturerName: "",
    storageCondition: "", productDescription: "", brochureUrl: "",
    packType: "", unitsPerPack: "", numberOfPacks: "", packSize: "",
    minimumOrderQuantity: "", maximumOrderQuantity: "", batchLotNumber: "",
    manufacturingDate: null as Date | null, expiryDate: null as Date | null,
    stockQuantity: "", dateOfStockEntry: new Date(), mrp: "",
    sellingPricePerPack: "", discountPercentage: "", gstPercentage: "",
    hsnCode: "", finalPrice: "",
  });

  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [deviceSubCategoryOptions, setDeviceSubCategoryOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);
  const [packTypeApiOptions, setPackTypeApiOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<CertificationMasterOption[]>([]);
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);
  const [showDiscountDrawer, setShowDiscountDrawer] = useState(false);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  const sterileOptions: SelectOption[] = [
    { value: "sterile", label: "Sterile" },
    { value: "non-sterile", label: "Non-Sterile" },
  ];

  const disposableOptions: SelectOption[] = [
    { value: "disposable", label: "Disposable" },
    { value: "reusable", label: "Reusable" },
  ];

  const gstOptions: SelectOption[] = [
    { value: "0", label: "0%" }, { value: "5", label: "5%" },
    { value: "12", label: "12%" }, { value: "18", label: "18%" },
  ];

  const authHeaders = useCallback((): Record<string, string> => {
    const token = sellerAuthService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const convertToDiscountData = (slabs: AdditionalDiscountSlab[]): AdditionalDiscountData[] =>
    slabs.map((s) => ({ ...s }));

  const convertToDiscountSlab = (data: AdditionalDiscountData[]): AdditionalDiscountSlab[] =>
    data.map((item) => ({
      minimumPurchaseQuantity: item.minimumPurchaseQuantity,
      additionalDiscountPercentage: item.additionalDiscountPercentage,
      effectiveStartDate: item.effectiveStartDate || "",
      effectiveStartTime: item.effectiveStartTime || "",
      effectiveEndDate: item.effectiveEndDate || "",
      effectiveEndTime: item.effectiveEndTime || "",
    }));

  const fetchList = useCallback(
    async (
      url: string,
      setter: (v: SelectOption[]) => void,
      idKey: string[],
      labelKey: string[],
      fallback?: SelectOption[]
    ) => {
      try {
        const res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
        const mapped = items
          .map((item) => ({
            value: getMasterStr(item, ...idKey),
            label: getMasterStr(item, ...labelKey) || "Unknown",
          }))
          .filter((o) => o.value);
        setter(mapped);
      } catch {
        if (fallback) setter(fallback);
      }
    },
    [authHeaders]
  );

  const fetchProductCategoryId = useCallback(async () => {
    try {
      const res = await fetch(`${MASTERS}/categories`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      const consumable = items.find((i) => {
        const name = getMasterStr(i, "categoryName", "name").toLowerCase();
        return name.includes("consumable") && !name.includes("non-consumable");
      });
      setProductCategoryId(
        consumable ? Number(getMasterStr(consumable, "categoryId", "id") || "5") : 5
      );
    } catch {
      setProductCategoryId(5);
    }
  }, [authHeaders]);

  const fetchDeviceCategories = useCallback(async () => {
    setLoadingCategories(true);
    setApiError(null);
    try {
      const res = await fetch(`${MASTERS}/device-categories/consumable`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
      setDeviceCategoryOptions(
        items
          .map((i) => ({
            value: getMasterStr(i, "deviceCatId", "id"),
            label: getMasterStr(i, "deviceName", "name") || "Unknown",
          }))
          .filter((o) => o.value)
      );
    } catch (err) {
      setApiError(`Failed to load device categories: ${err instanceof Error ? err.message : String(err)}`);
      setDeviceCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [authHeaders]);

  const fetchDeviceSubCategories = useCallback(
    async (categoryId: string) => {
      if (!categoryId) { setDeviceSubCategoryOptions([]); return; }
      setLoadingSubCategories(true);
      try {
        const res = await fetch(`${MASTERS}/device-sub-categories/${categoryId}`, { headers: authHeaders() });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
        setDeviceSubCategoryOptions(
          items
            .map((i) => ({
              value: getMasterStr(i, "deviceSubCatId", "subCategoryId", "id"),
              label: getMasterStr(i, "deviceSubCatName", "subCategoryName", "name") || "Unknown",
            }))
            .filter((o) => o.value)
        );
      } catch {
        setDeviceSubCategoryOptions([]);
      } finally {
        setLoadingSubCategories(false);
      }
    },
    [authHeaders]
  );

  useEffect(() => {
    fetchDeviceCategories();
    fetchProductCategoryId();

    fetchList(
      `${MASTERS}/countries`, setCountryOptions,
      ["countryId", "id"], ["countryName", "name"]
    );
    fetchList(
      `${MASTERS}/storagecondition`, setStorageConditionOptions,
      ["storageConditionId", "id"], ["conditionName", "name"]
    );
    fetchList(
      `${MASTERS}/pack-types`, setPackTypeApiOptions,
      ["packId", "id"], ["packName", "name"],
      [
        { value: "1", label: "Box" }, { value: "2", label: "Pack" },
        { value: "3", label: "Pouch" }, { value: "4", label: "Piece" },
      ]
    );

    setLoadingCertifications(true);
    fetch(`${MASTERS}/certifications`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const items: MasterItem[] = Array.isArray(data) ? data : (data.data ?? []);
        setCertificationMasterOptions(
          items
            .map((item, idx) => ({
              value: getMasterStr(item, "certificationId", "id"),
              label: getMasterStr(item, "certificationName", "name") || "Unknown",
              certificationId: Number(getMasterStr(item, "certificationId", "id") || String(idx + 1)),
              tagCode: `Tag ${String(idx + 1).padStart(2, "0")}`,
            }))
            .filter((o) => o.value)
        );
      })
      .catch(() => {
        setCertificationMasterOptions([
          { value: "1", label: "CDSCO Registration", certificationId: 1, tagCode: "Tag 01" },
          { value: "2", label: "ISO 13485", certificationId: 2, tagCode: "Tag 02" },
          { value: "3", label: "CE Certification", certificationId: 3, tagCode: "Tag 03" },
          { value: "4", label: "BIS Certification", certificationId: 4, tagCode: "Tag 04" },
        ]);
      })
      .finally(() => setLoadingCertifications(false));
  }, [fetchDeviceCategories, fetchProductCategoryId, fetchList, authHeaders]);

  useEffect(() => {
    if (form.deviceCategoryId) {
      fetchDeviceSubCategories(form.deviceCategoryId);
      setForm((p) => ({ ...p, deviceSubCategoryId: "" }));
    } else {
      setDeviceSubCategoryOptions([]);
    }
  }, [form.deviceCategoryId, fetchDeviceSubCategories]);

  useEffect(() => {
    const u = parseFloat(form.unitsPerPack);
    const p = parseFloat(form.numberOfPacks);
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0) {
      setForm((prev) => ({ ...prev, packSize: (u * p).toString() }));
    }
  }, [form.unitsPerPack, form.numberOfPacks]);

  useEffect(() => {
    const selling = parseFloat(form.sellingPricePerPack);
    const disc = parseFloat(form.discountPercentage);
    setForm((prev) => ({
      ...prev,
      finalPrice:
        !isNaN(selling) && selling > 0
          ? (isNaN(disc) ? selling : selling - (selling * disc) / 100).toFixed(2)
          : "0.00",
    }));
  }, [form.sellingPricePerPack, form.discountPercentage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCertDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) {
      setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
    }
    if (name === "hsnCode" && value.trim()) {
      const hsnError = validateHSNCode(value);
      if (hsnError) {
        setErrors((p) => ({ ...p, hsnCode: hsnError }));
      } else {
        setErrors((p) => { const n = { ...p }; delete n.hsnCode; return n; });
      }
    }
  };

  const handleSelectChange = (field: string, sel: SelectOption | null) => {
    setForm((p) => ({ ...p, [field]: sel ? sel.value : "" }));
    if (errors[field]) {
      setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
    }
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
          certificationId: option.certificationId, file: null, fileName: "",
          uploading: false, isUploaded: false, previewUrl: null,
        },
      ]);
    }
  };

  const handleCertFileUpload = async (certId: string, file: File) => {
    setSelectedCertifications((p) => p.map((c) => c.id === certId ? { ...c, uploading: true } : c));
    await new Promise((r) => setTimeout(r, 500));
    setSelectedCertifications((p) =>
      p.map((c) =>
        c.id === certId
          ? {
              ...c, file, fileName: file.name, uploading: false, isUploaded: true,
              previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
            }
          : c
      )
    );
  };

  const handleBrochureUpload = async (file: File) => {
    setUploadingBrochure(true);
    await new Promise((r) => setTimeout(r, 500));
    setBrochureFile(file);
    setUploadingBrochure(false);
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.productName.trim() || form.productName.trim().length < 3)
      e.productName = "Product name required (minimum 3 characters)";
    if (!form.deviceCategoryId) e.deviceCategoryId = "Device category required";
    if (!form.deviceSubCategoryId) e.deviceSubCategoryId = "Device sub-category required";
    if (!form.brandName.trim()) e.brandName = "Brand name required";
    if (!form.sizeDimension.trim()) e.sizeDimension = "Size or dimension required";
    if (!form.sterileStatus) e.sterileStatus = "Sterile status required";
    if (!form.disposableType) e.disposableType = "Disposable type required";
    if (!form.shelfLife.trim()) e.shelfLife = "Shelf life required";
    if (!form.intendedUse.trim() || form.intendedUse.trim().length < 10)
      e.intendedUse = "Intended use required (minimum 10 characters)";
    if (!form.keyFeatures.trim() || form.keyFeatures.trim().length < 10)
      e.keyFeatures = "Key features required (minimum 10 characters)";
    if (!form.safetyInstructions.trim() || form.safetyInstructions.trim().length < 10)
      e.safetyInstructions = "Safety instructions required (minimum 10 characters)";
    if (selectedCertifications.length === 0)
      e.certifications = "At least one certification required";
    if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin required";
    if (!form.manufacturerName.trim()) e.manufacturerName = "Manufacturer name required";
    if (!form.storageCondition) e.storageCondition = "Storage condition required";
    if (!form.productDescription.trim() || form.productDescription.trim().length < 20)
      e.productDescription = "Product description required (minimum 20 characters)";
    if (!form.packType) e.packType = "Pack type required";

    const uPack = parseFloat(form.unitsPerPack);
    if (isNaN(uPack) || uPack <= 0) e.unitsPerPack = "Units per pack must be greater than 0";
    const nPacks = parseFloat(form.numberOfPacks);
    if (isNaN(nPacks) || nPacks <= 0) e.numberOfPacks = "Number of packs must be greater than 0";
    const minQ = parseFloat(form.minimumOrderQuantity);
    if (isNaN(minQ) || minQ <= 0) e.minimumOrderQuantity = "Minimum order quantity must be greater than 0";
    const maxQ = parseFloat(form.maximumOrderQuantity);
    if (isNaN(maxQ) || maxQ <= 0) e.maximumOrderQuantity = "Maximum order quantity must be greater than 0";
    if (!isNaN(minQ) && !isNaN(maxQ) && maxQ < minQ)
      e.maximumOrderQuantity = "Maximum order quantity must be >= minimum";

    if (!form.batchLotNumber.trim()) e.batchLotNumber = "Batch or lot number required";
    if (!form.manufacturingDate) e.manufacturingDate = "Manufacturing date required";
    if (!form.expiryDate) e.expiryDate = "Expiry date required";
    if (form.manufacturingDate && form.expiryDate && form.expiryDate <= form.manufacturingDate)
      e.expiryDate = "Expiry date must be after manufacturing date";

    const stock = parseFloat(form.stockQuantity);
    if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be greater than 0";

    const mrp = parseFloat(form.mrp);
    const selling = parseFloat(form.sellingPricePerPack);
    if (isNaN(selling) || selling <= 0) e.sellingPricePerPack = "Selling price must be greater than 0";
    if (isNaN(mrp) || mrp <= 0) e.mrp = "MRP must be greater than 0";
    if (!isNaN(mrp) && !isNaN(selling) && mrp < selling)
      e.mrp = "MRP must be >= selling price";

    if (!form.gstPercentage) e.gstPercentage = "GST percentage required";

    if (!form.hsnCode.trim()) {
      e.hsnCode = "HSN code required";
    } else {
      const hsnError = validateHSNCode(form.hsnCode);
      if (hsnError) e.hsnCode = hsnError;
    }

    if (images.length === 0) e.images = "At least 1 product image required";
    if (images.length > 5) e.images = "Maximum 5 images allowed";

    return e;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorField = Object.keys(validationErrors)[0];
      document.querySelector(`[name="${firstErrorField}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    if (!productCategoryId) {
      setApiError("Product category not loaded. Please refresh the page.");
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      const token = sellerAuthService.getToken();
      if (!token) throw new Error("Authentication required. Please log in again.");

      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const jsonHeaders = { ...headers, "Content-Type": "application/json" };

      const payload = {
        productName: form.productName,
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.brochureUrl || "",
        manufacturerName: form.manufacturerName,
        categoryId: String(productCategoryId),
        packagingDetails: {
          packId: Number(form.packType),
          unitPerPack: form.unitsPerPack,
          numberOfPacks: Number(form.numberOfPacks),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },
        pricingDetails: [{
          batchLotNumber: form.batchLotNumber,
          manufacturingDate: form.manufacturingDate?.toISOString() ?? null,
          expiryDate: form.expiryDate?.toISOString() ?? null,
          stockQuantity: Number(form.stockQuantity),
          dateOfStockEntry: form.dateOfStockEntry?.toISOString() ?? new Date().toISOString(),
          sellingPrice: Number(form.sellingPricePerPack),
          mrp: Number(form.mrp),
          discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : 0,
          gstPercentage: Number(form.gstPercentage),
          finalPrice: Number(form.finalPrice),
          hsnCode: form.hsnCode,
          additionalDiscounts: additionalDiscountSlabs,
        }],
        productAttributeConsumableMedicals: [{
          deviceCatId: Number(form.deviceCategoryId),
          deviceSubCatId: Number(form.deviceSubCategoryId),
          brandName: form.brandName,
          materialTypeId: [],
          dimensionSize: form.sizeDimension,
          sterileOrNonSterile: form.sterileStatus === "sterile" ? "Sterile" : "Non-Sterile",
          disposalOrReusable: form.disposableType === "disposable" ? "Disposable" : "Reusable",
          shelfLife: form.shelfLife,
          purpose: form.intendedUse,
          keyFeaturesSpecifications: form.keyFeatures,
          safetyInstructions: form.safetyInstructions,
          countryId: Number(form.countryOfOrigin),
          manufacturerName: form.manufacturerName,
          storageConditionId: form.storageCondition ? Number(form.storageCondition) : null,
          brochureType: "PDF",
          brochurePath: "PENDING",
          certificateDocuments: selectedCertifications.map((c) => ({
            certificationId: c.certificationId,
            certificateUrl: "PENDING",
          })),
        }],
        productImages: images.map(() => ({ productImage: "PENDING" })),
      };

      const createRes = await fetch(`${API_BASE}/products/create`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      });

      const rawText = await createRes.text();
      let createData: ApiResponseData;
      try {
        createData = JSON.parse(rawText) as ApiResponseData;
      } catch {
        throw new Error(`Invalid server response: ${rawText.substring(0, 200)}`);
      }

      if (!createRes.ok) {
        const inner = createData?.data as ApiResponseData | undefined;
        throw new Error(
          String(inner?.message ?? createData?.message ?? `HTTP ${createRes.status}`)
        );
      }

      const dataInner = createData?.data as ApiResponseData | undefined;
      const productId = String(dataInner?.productId ?? createData?.productId ?? "").trim();
      if (!productId || productId === "undefined") throw new Error("Product ID not returned from server");

      const productAttributeId = extractProductAttributeId(createData);

      // Upload images
      if (images.length > 0) {
        const imageUploadResult = await uploadDocument(
          `${API_BASE}/product-images/${productId}`,
          headers, images[0], {}, "image", 3
        );

        if (imageUploadResult.success && imageUploadResult.fieldUsed) {
          for (let i = 1; i < images.length; i++) {
            const fd = new FormData();
            fd.append(imageUploadResult.fieldUsed, images[i]);
            await fetch(`${API_BASE}/product-images/${productId}`, {
              method: "POST", headers, body: fd,
            }).catch((err) => console.error(`Image ${i + 1} upload error:`, err));
          }
        }
      }

      // Upload certificates & brochure
      if (productAttributeId) {
        const certBaseUrl = `${API_BASE}/product-documents/consumable/${productAttributeId}/certificates`;
        const brochureUploadUrl = `${API_BASE}/product-documents/consumable/${productAttributeId}/brochure`;

        for (const cert of selectedCertifications.filter((c) => c.file)) {
          await uploadDocument(
            certBaseUrl, headers, cert.file!,
            { certificationId: String(cert.certificationId) },
            "certificate", 3
          );
        }

        if (brochureFile) {
          await uploadDocument(brochureUploadUrl, headers, brochureFile, {}, "brochure", 3);
        }
      }

      alert("Product created successfully!");
      if (onSubmitSuccess) onSubmitSuccess();
      else window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setApiError(errorMessage);
      alert(`Failed to create product: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectStyles = (errorKey: string): SelectStyles => ({
    control: (base, state) => ({
      ...base, height: "56px", minHeight: "56px", borderRadius: "16px",
      borderColor: errors[errorKey] ? "#FF3B3B" : state.isFocused ? "#4B0082" : "#737373",
      boxShadow: "none", cursor: "pointer",
      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 16px", cursor: "pointer" }),
    indicatorsContainer: (base) => ({ ...base, height: "56px", cursor: "pointer" }),
    dropdownIndicator: (base, state) => ({
      ...base, color: state.isFocused ? "#4B0082" : "#737373", cursor: "pointer",
      "&:hover": { color: "#4B0082" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#4B0082" : state.isFocused ? "#F3E8FF" : "white",
      color: state.isSelected ? "white" : "#1E1E1E", cursor: "pointer",
      "&:active": { backgroundColor: "#4B0082", color: "white" },
    }),
    placeholder: (base) => ({ ...base, color: "#A3A3A3" }),
    singleValue: (base) => ({ ...base, color: "#1E1E1E" }),
  });

  const selectTheme = (theme: Theme) => ({
    ...theme,
    colors: { ...theme.colors, primary: "#4B0082", primary25: "#F3E8FF", primary50: "#E9D5FF" },
  });

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
          <Input
            label="Product Name" name="productName"
            placeholder="e.g., Surgical Mask, Syringe, Gloves"
            onChange={handleChange} value={form.productName} error={errors.productName} required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Device Category <span className="text-warning-500 ml-1">*</span>
            </label>
            <Select
              options={deviceCategoryOptions} isLoading={loadingCategories}
              value={deviceCategoryOptions.find((o) => o.value === form.deviceCategoryId) || null}
              onChange={(sel) => handleSelectChange("deviceCategoryId", sel)}
              placeholder={loadingCategories ? "Loading..." : "Select category"}
              theme={selectTheme} styles={selectStyles("deviceCategoryId")}
            />
            {errors.deviceCategoryId && <p className="text-red-500 text-sm mt-1">{errors.deviceCategoryId}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Device Sub-Category <span className="text-warning-500 ml-1">*</span>
            </label>
            <Select
              options={deviceSubCategoryOptions} isLoading={loadingSubCategories}
              isDisabled={!form.deviceCategoryId}
              value={deviceSubCategoryOptions.find((o) => o.value === form.deviceSubCategoryId) || null}
              onChange={(sel) => handleSelectChange("deviceSubCategoryId", sel)}
              placeholder={form.deviceCategoryId ? (loadingSubCategories ? "Loading..." : "Select sub-category") : "Select category first"}
              theme={selectTheme} styles={selectStyles("deviceSubCategoryId")}
            />
            {errors.deviceSubCategoryId && <p className="text-red-500 text-sm mt-1">{errors.deviceSubCategoryId}</p>}
          </div>

          <Input
            label="Brand Name" name="brandName"
            placeholder="e.g., 3M, Johnson & Johnson, Medtronic"
            onChange={handleChange} value={form.brandName} error={errors.brandName} required
          />

          <Input
            label="Size / Dimension / Gauge" name="sizeDimension"
            placeholder="e.g., Size M, 22G, 10cm x 10cm"
            onChange={handleChange} value={form.sizeDimension} error={errors.sizeDimension} required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Sterile Status <span className="text-warning-500 ml-1">*</span>
            </label>
            <div className="flex gap-6 mt-2">
              {sterileOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio" name="sterileStatus" value={option.value}
                    checked={form.sterileStatus === option.value} onChange={handleChange}
                    className="accent-primary-900 w-5 h-5"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.sterileStatus && <p className="text-red-500 text-sm mt-1">{errors.sterileStatus}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Disposable / Reusable <span className="text-warning-500 ml-1">*</span>
            </label>
            <div className="flex gap-6 mt-2">
              {disposableOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio" name="disposableType" value={option.value}
                    checked={form.disposableType === option.value} onChange={handleChange}
                    className="accent-primary-900 w-5 h-5"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.disposableType && <p className="text-red-500 text-sm mt-1">{errors.disposableType}</p>}
          </div>

          <Input
            label="Shelf Life" name="shelfLife"
            placeholder="e.g., 3 years, 24 months"
            onChange={handleChange} value={form.shelfLife} error={errors.shelfLife} required
          />

          {/* Certifications */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                  Certifications & Compliance <span className="text-warning-500 ml-1">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setShowCertDropdown((p) => !p)}
                    className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${errors.certifications ? "border-red-500" : "border-neutral-300"}`}
                  >
                    <span className="text-sm text-neutral-700 truncate pr-2">
                      {selectedCertifications.length > 0
                        ? selectedCertifications.map((c) => c.label).join(", ")
                        : "Select certifications"}
                    </span>
                    <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${showCertDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {showCertDropdown && (
                    <div className="absolute z-20 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                      {loadingCertifications ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
                      ) : (
                        certificationMasterOptions.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCertifications.some((c) => c.id === opt.value)}
                              onChange={() => handleCertCheckbox(opt)}
                              className="accent-purple-600"
                            />
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
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                  Upload Certificate Documents <span className="text-warning-500 ml-1">*</span>
                </label>
                {selectedCertifications.length === 0 ? (
                  <div className="w-full border border-neutral-300 rounded-xl flex items-center h-14 overflow-hidden">
                    <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                      <Upload size={18} className="text-purple-700" />
                    </div>
                    <span className="text-gray-400 text-sm px-3">Select certifications first</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedCertifications.map((cert) => (
                      <div key={cert.id}>
                        {!cert.isUploaded ? (
                          <div
                            className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-14 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition"
                            onClick={() => document.getElementById(`consumable-cert-upload-${cert.id}`)?.click()}
                          >
                            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                              {cert.uploading ? (
                                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload size={18} className="text-purple-700" />
                              )}
                            </div>
                            <span className="px-3 text-sm text-neutral-600 truncate flex-1">
                              {cert.uploading ? "Processing..." : cert.label}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id)); }}
                              className="pr-3 text-neutral-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center border border-purple-300 rounded-xl overflow-hidden h-14 bg-purple-50">
                            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                              <FileText size={18} className="text-purple-700" />
                            </div>
                            <div className="flex-1 px-3 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{cert.fileName}</p>
                              <p className="text-xs text-neutral-500">{cert.label}</p>
                            </div>
                            <div className="flex items-center gap-1 pr-3">
                              <button
                                type="button"
                                onClick={() => document.getElementById(`consumable-cert-upload-${cert.id}`)?.click()}
                                className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700" title="Replace"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id)); }}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-500" title="Remove"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                        <input
                          id={`consumable-cert-upload-${cert.id}`} type="file"
                          accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleCertFileUpload(cert.id, e.target.files[0]); }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Intended Use / Purpose" name="intendedUse"
            placeholder="e.g., For surgical procedures, wound dressing, injection"
            onChange={handleChange} value={form.intendedUse} error={errors.intendedUse} required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Country of Origin <span className="text-warning-500 ml-1">*</span>
            </label>
            <Select
              options={countryOptions}
              value={countryOptions.find((o) => o.value === form.countryOfOrigin) || null}
              onChange={(sel) => handleSelectChange("countryOfOrigin", sel)}
              placeholder="Select country" theme={selectTheme} styles={selectStyles("countryOfOrigin")}
            />
            {errors.countryOfOrigin && <p className="text-red-500 text-sm mt-1">{errors.countryOfOrigin}</p>}
          </div>

          <Input
            label="Manufacturer Name" name="manufacturerName"
            placeholder="Manufacturer company name"
            onChange={handleChange} value={form.manufacturerName} error={errors.manufacturerName} required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Storage Condition <span className="text-warning-500 ml-1">*</span>
            </label>
            <Select
              options={storageConditionOptions}
              value={storageConditionOptions.find((o) => o.value === form.storageCondition) || null}
              onChange={(sel) => handleSelectChange("storageCondition", sel)}
              placeholder="Select storage condition" theme={selectTheme} styles={selectStyles("storageCondition")}
            />
            {errors.storageCondition && <p className="text-red-500 text-sm mt-1">{errors.storageCondition}</p>}
          </div>

          {/* Brochure Upload */}
          <div>
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-3">
              Upload Product Brochure / User Manual
            </label>
            {!brochureFile ? (
              <div
                className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-14 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition"
                onClick={() => brochureInputRef.current?.click()}
              >
                <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                  {uploadingBrochure ? (
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={18} className="text-purple-700" />
                  )}
                </div>
                <span className="px-3 text-sm text-neutral-400">
                  {uploadingBrochure ? "Processing..." : "Upload PDF (max 5MB)"}
                </span>
              </div>
            ) : (
              <div className="flex items-center border border-purple-300 rounded-xl overflow-hidden h-14 bg-purple-50">
                <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-purple-700" />
                </div>
                <div className="flex-1 px-3 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{brochureFile.name}</p>
                  <p className="text-xs text-neutral-500">{(brochureFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex items-center gap-1 pr-3">
                  <button type="button" onClick={() => brochureInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700" title="Change">
                    <RefreshCw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBrochureFile(null); if (brochureInputRef.current) brochureInputRef.current.value = ""; }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500" title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            <input
              ref={brochureInputRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleBrochureUpload(e.target.files[0]); }}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Safety Instructions & Precautions <span className="text-warning-500 ml-1">*</span>
                </label>
                <textarea
                  name="safetyInstructions" value={form.safetyInstructions} onChange={handleChange} rows={4}
                  placeholder="Enter safety warnings, precautions, and handling instructions"
                  className={`w-full rounded-2xl p-3 resize-none border ${errors.safetyInstructions ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`}
                />
                {errors.safetyInstructions && <p className="text-red-500 text-sm mt-1">{errors.safetyInstructions}</p>}
              </div>
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Key Features & Specifications <span className="text-warning-500 ml-1">*</span>
                </label>
                <textarea
                  name="keyFeatures" value={form.keyFeatures} onChange={handleChange} rows={4}
                  placeholder="List key features, technical specifications"
                  className={`w-full rounded-2xl p-3 resize-none border ${errors.keyFeatures ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`}
                />
                {errors.keyFeatures && <p className="text-red-500 text-sm mt-1">{errors.keyFeatures}</p>}
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
              Product Description <span className="text-warning-500 ml-1">*</span>
            </label>
            <textarea
              name="productDescription" value={form.productDescription} onChange={handleChange} rows={4}
              placeholder="Detailed product description (minimum 20 characters)"
              className={`w-full rounded-2xl p-3 resize-none border ${errors.productDescription ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`}
            />
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
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Pack Type <span className="text-warning-500 ml-1">*</span>
            </label>
            <Select
              options={packTypeApiOptions}
              value={packTypeApiOptions.find((o) => o.value === form.packType) || null}
              onChange={(sel) => handleSelectChange("packType", sel)}
              placeholder="Select pack type" theme={selectTheme} styles={selectStyles("packType")}
            />
            {errors.packType && <p className="text-red-500 text-sm mt-1">{errors.packType}</p>}
          </div>

          <Input label="Number of Units per Pack" name="unitsPerPack" placeholder="e.g., 100"
            onChange={handleChange} value={form.unitsPerPack} error={errors.unitsPerPack} required />
          <Input label="Number of Packs" name="numberOfPacks" placeholder="e.g., 10"
            onChange={handleChange} value={form.numberOfPacks} error={errors.numberOfPacks} required />
          <Input label="Pack Size (auto calculated)" name="packSize" value={form.packSize} disabled required />
        </div>

        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Order Details</div>
          <div className="border-b border-neutral-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="Minimum Order Quantity (MOQ)" name="minimumOrderQuantity" placeholder="Minimum quantity per order"
            onChange={handleChange} value={form.minimumOrderQuantity} error={errors.minimumOrderQuantity} required />
          <Input label="Maximum Order Quantity" name="maximumOrderQuantity" placeholder="Maximum quantity per order"
            onChange={handleChange} value={form.maximumOrderQuantity} error={errors.maximumOrderQuantity} required />
        </div>

        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Batch & Stock Management</div>
          <div className="border-b border-neutral-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="Batch / Lot Number" name="batchLotNumber" placeholder="Enter batch or lot number"
            onChange={handleChange} value={form.batchLotNumber} error={errors.batchLotNumber} required />
          <Input label="Manufacturing Date" type="date" name="manufacturingDate"
            onChange={(e) => setForm((p) => ({ ...p, manufacturingDate: e.target.value ? new Date(e.target.value) : null }))}
            value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""}
            error={errors.manufacturingDate} required />
          <Input label="Expiry Date" type="date" name="expiryDate"
            onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value ? new Date(e.target.value) : null }))}
            value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""}
            error={errors.expiryDate} required />
          <Input label="Stock Quantity (per pack size)" name="stockQuantity" placeholder="Number of packs in stock"
            onChange={handleChange} value={form.stockQuantity} error={errors.stockQuantity} required />
          <Input label="Date of Stock Entry" type="date" name="dateOfStockEntry"
            onChange={(e) => setForm((p) => ({ ...p, dateOfStockEntry: e.target.value ? new Date(e.target.value) : new Date() }))}
            value={form.dateOfStockEntry ? form.dateOfStockEntry.toISOString().split("T")[0] : ""}
            error={errors.dateOfStockEntry} />
        </div>

        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Pricing</div>
          <div className="border-b border-neutral-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="MRP (per pack size)" name="mrp" placeholder="Maximum Retail Price"
            onChange={handleChange} value={form.mrp} error={errors.mrp} required />
          <Input label="Selling Price (per pack size)" name="sellingPricePerPack" placeholder="Selling price"
            onChange={handleChange} value={form.sellingPricePerPack} error={errors.sellingPricePerPack} required />
          <Input label="Discount Percentage (%)" name="discountPercentage" placeholder="e.g., 10"
            onChange={handleChange} value={form.discountPercentage} error={errors.discountPercentage} />
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 font-semibold opacity-0">_</label>
            <button type="button" onClick={() => setShowDiscountDrawer(true)}
              className="px-4 py-2 h-14 bg-[#9F75FC] text-white rounded-xl font-semibold transition w-1/2 hover:bg-purple-600">
              + Add Additional Discount
            </button>
          </div>
        </div>

        {additionalDiscountSlabs.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-purple-800">
                {additionalDiscountSlabs.length} Discount Slab{additionalDiscountSlabs.length > 1 ? "s" : ""} Added
              </span>
              <button type="button" onClick={() => setShowDiscountDrawer(true)} className="text-xs text-purple-600 underline">Edit</button>
            </div>
            {additionalDiscountSlabs.map((slab, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-purple-700 py-1 border-t border-purple-100">
                <span>Minimum Qty: {slab.minimumPurchaseQuantity} - {slab.additionalDiscountPercentage}% off</span>
                <button type="button" onClick={() => setAdditionalDiscountSlabs((p) => p.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 ml-3">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Tax & Billing</div>
          <div className="border-b border-neutral-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              GST Percentage <span className="text-warning-500 ml-1">*</span>
            </label>
            <Select
              options={gstOptions}
              value={gstOptions.find((o) => o.value === form.gstPercentage) || null}
              onChange={(sel) => handleSelectChange("gstPercentage", sel)}
              placeholder="Select GST" theme={selectTheme} styles={selectStyles("gstPercentage")}
            />
            {errors.gstPercentage && <p className="text-red-500 text-sm mt-1">{errors.gstPercentage}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              HSN Code <span className="text-warning-500 ml-1">*</span>
            </label>
            <input
              type="text" name="hsnCode" value={form.hsnCode} onChange={handleChange}
              placeholder="e.g., 90183110 (4, 6, or 8 digits)"
              className={`w-full h-14 px-4 border rounded-xl focus:outline-none focus:ring-0 ${errors.hsnCode ? "border-red-500" : "border-neutral-300 focus:border-[#4B0082]"}`}
            />
            {errors.hsnCode && <p className="text-red-500 text-sm mt-1">{errors.hsnCode}</p>}
            <p className="text-xs text-neutral-500 mt-1">
              Medical consumables typically use HSN codes starting with 30, 39, 40, 84, 85, or 90
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-label-l3 text-primary-1000 font-semibold mb-1">Final Price (after discounts):</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-700">₹</span>
            <input type="text" value={form.finalPrice || "0.00"} disabled
              className="w-full h-12 pl-8 pr-4 rounded-xl border-2 border-[#C4AAFD] bg-[#F8F5FF] text-primary-700 focus:outline-none cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* Section 3 - Product Photos */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-p3 text-neutral-900 font-semibold mb-2">
          Product Photos <span className="text-warning-500">*</span>
        </div>
        <p className="text-xs text-neutral-400 mb-3">Minimum 1, Maximum 5 images. JPG, PNG, JPEG formats accepted. Maximum 5MB each.</p>
        <div
          className="border-2 border-dashed border-neutral-300 rounded-xl p-6 cursor-pointer hover:border-purple-400 transition"
          onClick={() => document.getElementById("consumableFileInput")?.click()}
        >
          <div className="flex flex-col items-center justify-center py-4">
            <Image src="/icons/FolderIcon.svg" alt="Upload folder" width={40} height={40} className="mb-4" />
            <div className="text-label-l2 font-normal text-center">Choose files or drag and drop them here</div>
            <div className="text-label-l1 font-normal text-neutral-400 text-center">Upload product images - maximum 5</div>
          </div>
        </div>
        <input
          id="consumableFileInput" type="file" multiple accept="image/jpeg,image/png,image/jpg" className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              const files = Array.from(e.target.files);
              if (images.length + files.length > 5) { alert("Maximum 5 images allowed"); return; }
              setImages((p) => [...p, ...files]);
              setErrors((p) => { const n = { ...p }; delete n.images; return n; });
            }
          }}
        />
        {images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-neutral-700">{images.length} / 5 image{images.length !== 1 ? "s" : ""}</span>
              {images.length < 5 && (
                <button type="button" onClick={() => document.getElementById("consumableFileInput")?.click()}
                  className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  + Add More
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Product ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-xl border-2 border-neutral-200 group-hover:border-purple-300 transition shadow-sm" />
                    <button type="button"
                      onClick={() => { URL.revokeObjectURL(url); setImages((p) => p.filter((_, idx) => idx !== i)); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition">
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md">{i + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pb-8">
        <div className="flex gap-4 justify-center sm:justify-start">
          <button type="button" onClick={() => window.location.reload()}
            className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer hover:bg-red-50 transition">
            Cancel
          </button>
          <button type="button"
            className="px-6 py-2 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition">
            <Image src="/icons/SaveDraftIcon.svg" alt="Save draft" width={20} height={20} />
            Save Draft
          </button>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
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

export default ConsumableForm;