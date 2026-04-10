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

type SelectStyles = StylesConfig<SelectOption, false>;

interface ConsumableFormProps {
  deviceType: "consumable" | "non-consumable";
  onSubmitSuccess?: () => void;
}

const API_BASE = "https://api-test-aggreator.tiameds.ai/api/v1";
const MASTERS = `${API_BASE}/masters`;

// Helper: extract productAttributeId from response
function extractConsumableProductAttributeId(data: Record<string, unknown>): string | undefined {
  // Check for productAttributeConsumableMedicals array
  const consumableMedicals = (data?.data as Record<string, unknown>)?.productAttributeConsumableMedicals ||
                            (data as Record<string, unknown>)?.productAttributeConsumableMedicals;
  
  if (Array.isArray(consumableMedicals) && consumableMedicals.length > 0) {
    const id = (consumableMedicals[0] as Record<string, unknown>)?.productAttributeId;
    if (id !== undefined && id !== null) return String(id);
  }

  // Fallback: direct productAttributeId
  const directId = (data?.data as Record<string, unknown>)?.productAttributeId ||
                   (data as Record<string, unknown>)?.productAttributeId;
  if (directId !== undefined && directId !== null) return String(directId);

  return undefined;
}

const ConsumableForm = ({ deviceType, onSubmitSuccess }: ConsumableFormProps) => {
  const [form, setForm] = useState({
    productName: "",
    deviceCategoryId: "",
    deviceSubCategoryId: "",
    brandName: "",
    materialType: "",
    sizeDimension: "",
    sterileStatus: "",
    disposableType: "",
    shelfLife: "",
    intendedUse: "",
    keyFeatures: "",
    safetyInstructions: "",
    countryOfOrigin: "",
    manufacturerName: "",
    storageCondition: "",
    deviceClass: "",
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
  });

  // Master Options
  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [deviceSubCategoryOptions, setDeviceSubCategoryOptions] = useState<SelectOption[]>([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);
  const [packTypeApiOptions, setPackTypeApiOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<
    { value: string; label: string; certificationId: number; tagCode: string }[]
  >([]);

  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);

  // Loading flags
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingMaterialTypes, setLoadingMaterialTypes] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [loadingPackTypes, setLoadingPackTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
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

  // Static options
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

  // Helpers
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

  // API: Fetch Product Category ID
  const fetchProductCategoryId = useCallback(async () => {
    try {
      const res = await fetch(`${MASTERS}/categories`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      const allItems = items as Array<{
        categoryId?: number;
        id?: number;
        categoryName?: string;
        name?: string;
        categoryType?: string;
      }>;

      const consumable = allItems.find((item) => {
        const name = (item.categoryName || item.name || "").toLowerCase();
        const type = (item.categoryType || "").toLowerCase();
        return (
          (name.includes("consumable") && !name.includes("non-consumable")) ||
          (type.includes("consumable") && !type.includes("non-consumable"))
        );
      });

      if (consumable) {
        setProductCategoryId(Number(consumable.categoryId || consumable.id));
      } else {
        setProductCategoryId(5);
      }
    } catch {
      setProductCategoryId(5);
    }
  }, [authHeaders]);

  // API: Fetch Masters
  const fetchDeviceCategories = useCallback(async () => {
    setLoadingCategories(true);
    setApiError(null);
    try {
      const res = await fetch(`${MASTERS}/device-categories/consumable`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      const allItems = items as Array<{
        deviceCategoryType?: string;
        deviceCatId?: number;
        id?: number;
        deviceName?: string;
        name?: string;
      }>;

      const filtered = allItems.filter((item) => {
        const t = (item.deviceCategoryType || "").toLowerCase().replace(/[\s_]/g, "-");
        return t === deviceType || t.includes(deviceType);
      });

      const finalList = filtered.length > 0 ? filtered : allItems;

      setDeviceCategoryOptions(
        finalList
          .map((item) => ({
            value: String(item.deviceCatId || item.id || ""),
            label: String(item.deviceName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch (err) {
      setApiError(`Failed to load device categories: ${err instanceof Error ? err.message : err}`);
      setDeviceCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [deviceType, authHeaders]);

  const fetchDeviceSubCategories = useCallback(async (categoryId: string) => {
    if (!categoryId) { setDeviceSubCategoryOptions([]); return; }
    setLoadingSubCategories(true);
    try {
      const res = await fetch(`${MASTERS}/device-sub-categories/${categoryId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setDeviceSubCategoryOptions(
        (items as Array<{ deviceSubCatId?: number; subCategoryId?: number; id?: number; deviceSubCatName?: string; subCategoryName?: string; name?: string }>)
          .map((item) => ({
            value: String(item.deviceSubCatId || item.subCategoryId || item.id || ""),
            label: String(item.deviceSubCatName || item.subCategoryName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch { setDeviceSubCategoryOptions([]); } finally { setLoadingSubCategories(false); }
  }, [authHeaders]);

  const fetchMaterialTypes = useCallback(async () => {
    setLoadingMaterialTypes(true);
    try {
      const res = await fetch(`${MASTERS}/consumable-material-types`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setMaterialTypeOptions(
        (items as Array<{ materialTypeId?: number; id?: number; materialTypeName?: string; name?: string }>)
          .map((item) => ({ value: String(item.materialTypeId || item.id || ""), label: String(item.materialTypeName || item.name || "Unknown") }))
          .filter((o) => o.value)
      );
    } catch { setMaterialTypeOptions([]); } finally { setLoadingMaterialTypes(false); }
  }, [authHeaders]);

  const fetchCountries = useCallback(async () => {
    setLoadingCountries(true);
    try {
      const res = await fetch(`${MASTERS}/countries`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setCountryOptions(
        (items as Array<{ countryId?: number; id?: number; countryName?: string; name?: string }>)
          .map((item) => ({ value: String(item.countryId || item.id || ""), label: String(item.countryName || item.name || "Unknown") }))
          .filter((o) => o.value)
      );
    } catch { setCountryOptions([]); } finally { setLoadingCountries(false); }
  }, [authHeaders]);

  const fetchStorageConditions = useCallback(async () => {
    setLoadingStorage(true);
    try {
      const res = await fetch(`${MASTERS}/storagecondition`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setStorageConditionOptions(
        (items as Array<{ storageConditionId?: number; id?: number; conditionName?: string; name?: string }>)
          .map((item) => ({ value: String(item.storageConditionId || item.id || ""), label: String(item.conditionName || item.name || "Unknown") }))
          .filter((o) => o.value)
      );
    } catch { setStorageConditionOptions([]); } finally { setLoadingStorage(false); }
  }, [authHeaders]);

  const fetchPackTypes = useCallback(async () => {
    setLoadingPackTypes(true);
    try {
      const res = await fetch(`${MASTERS}/pack-types`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setPackTypeApiOptions(
        (items as Array<{ packId?: number; id?: number; packName?: string; name?: string }>)
          .map((item) => ({ value: String(item.packId || item.id || ""), label: String(item.packName || item.name || "Unknown") }))
          .filter((o) => o.value)
      );
    } catch {
      setPackTypeApiOptions([
        { value: "1", label: "Box" }, { value: "2", label: "Pack" },
        { value: "3", label: "Pouch" }, { value: "4", label: "Piece" },
      ]);
    } finally { setLoadingPackTypes(false); }
  }, [authHeaders]);

  const fetchCertifications = useCallback(async () => {
    setLoadingCertifications(true);
    try {
      const res = await fetch(`${MASTERS}/certifications`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setCertificationMasterOptions(
        (items as Array<{ certificationId?: number; id?: number; certificationName?: string; name?: string }>)
          .map((item, idx: number) => ({
            value: String(item.certificationId || item.id || ""),
            label: String(item.certificationName || item.name || "Unknown"),
            certificationId: Number(item.certificationId || item.id || idx + 1),
            tagCode: `Tag ${String(idx + 1).padStart(2, "0")}`,
          }))
          .filter((o) => o.value)
      );
    } catch {
      setCertificationMasterOptions([
        { value: "1", label: "CDSCO Registration", certificationId: 1, tagCode: "Tag 01" },
        { value: "2", label: "ISO 13485", certificationId: 2, tagCode: "Tag 02" },
        { value: "3", label: "CE Certification", certificationId: 3, tagCode: "Tag 03" },
        { value: "4", label: "BIS Certification", certificationId: 4, tagCode: "Tag 04" },
      ]);
    } finally { setLoadingCertifications(false); }
  }, [authHeaders]);

  // Effects
  useEffect(() => {
    fetchProductCategoryId();
    fetchDeviceCategories();
    fetchMaterialTypes();
    fetchCountries();
    fetchStorageConditions();
    fetchPackTypes();
    fetchCertifications();
  }, [fetchProductCategoryId, fetchDeviceCategories, fetchMaterialTypes, fetchCountries, fetchStorageConditions, fetchPackTypes, fetchCertifications]);

  useEffect(() => {
    if (form.deviceCategoryId) {
      fetchDeviceSubCategories(form.deviceCategoryId);
      setForm((prev) => ({ ...prev, deviceSubCategoryId: "" }));
    } else {
      setDeviceSubCategoryOptions([]);
    }
  }, [form.deviceCategoryId, fetchDeviceSubCategories]);

  useEffect(() => {
    const u = parseFloat(form.unitsPerPack);
    const p = parseFloat(form.numberOfPacks);
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0)
      setForm((prev) => ({ ...prev, packSize: (u * p).toString() }));
  }, [form.unitsPerPack, form.numberOfPacks]);

  useEffect(() => {
    const selling = parseFloat(form.sellingPricePerPack);
    const disc = parseFloat(form.discountPercentage);
    if (!isNaN(selling) && selling > 0) {
      const price = isNaN(disc) ? selling : selling - (selling * disc) / 100;
      setForm((prev) => ({ ...prev, finalPrice: price.toFixed(2) }));
    } else {
      setForm((prev) => ({ ...prev, finalPrice: "0.00" }));
    }
  }, [form.sellingPricePerPack, form.discountPercentage]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowCertDropdown(false);
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(e.target as Node)) setShowMaterialDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSelectChange = (field: string, selected: SelectOption | null) => {
    setForm((prev) => ({ ...prev, [field]: selected ? selected.value : "" }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleCertificationCheckboxChange = (option: (typeof certificationMasterOptions)[0]) => {
    const exists = selectedCertifications.some((c) => c.id === option.value);
    if (exists) {
      setSelectedCertifications((prev) => prev.filter((c) => c.id !== option.value));
    } else {
      setSelectedCertifications((prev) => [
        ...prev,
        { id: option.value, label: option.label, tagCode: option.tagCode, certificationId: option.certificationId, file: null, fileName: "", uploading: false, isUploaded: false, previewUrl: null },
      ]);
    }
  };

  const handleMaterialCheckboxChange = (option: SelectOption) => {
    const isChecked = selectedMaterialTypes.includes(option.value);
    const updated = isChecked ? selectedMaterialTypes.filter((v) => v !== option.value) : [...selectedMaterialTypes, option.value];
    setSelectedMaterialTypes(updated);
    if (errors.materialType) setErrors((prev) => { const n = { ...prev }; delete n.materialType; return n; });
  };

  const handleTagClick = (certId: string) => { document.getElementById(`cert-upload-${certId}`)?.click(); };

  const handleRemoveTag = (certId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCertifications((prev) => prev.filter((c) => c.id !== certId));
  };

  const handleCertificationFileUpload = async (certId: string, file: File) => {
    setSelectedCertifications((prev) => prev.map((c) => (c.id === certId ? { ...c, uploading: true } : c)));
    await new Promise((r) => setTimeout(r, 800));
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setSelectedCertifications((prev) =>
      prev.map((c) => c.id === certId ? { ...c, file, fileName: file.name, uploading: false, isUploaded: true, previewUrl } : c)
    );
  };

  const handleBrochureUpload = async (file: File) => {
    setUploadingBrochure(true);
    await new Promise((r) => setTimeout(r, 800));
    setBrochureFile(file);
    setUploadingBrochure(false);
  };

  // Validation
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.productName.trim() || form.productName.trim().length < 3) e.productName = "Product name is required (min 3 characters)";
    if (!form.deviceCategoryId) e.deviceCategoryId = "Device category is required";
    if (!form.deviceSubCategoryId) e.deviceSubCategoryId = "Device sub-category is required";
    if (!form.brandName.trim()) e.brandName = "Brand name is required";
    if (selectedMaterialTypes.length === 0) e.materialType = "At least one material type is required";
    if (!form.sizeDimension.trim()) e.sizeDimension = "Size/Dimension is required";
    if (!form.sterileStatus) e.sterileStatus = "Sterile status is required";
    if (!form.disposableType) e.disposableType = "Disposable type is required";
    if (!form.shelfLife.trim()) e.shelfLife = "Shelf life is required";
    if (!form.intendedUse.trim() || form.intendedUse.trim().length < 10) e.intendedUse = "Intended use is required (min 10 characters)";
    if (!form.keyFeatures.trim() || form.keyFeatures.trim().length < 10) e.keyFeatures = "Key features are required (min 10 characters)";
    if (!form.safetyInstructions.trim() || form.safetyInstructions.trim().length < 10) e.safetyInstructions = "Safety instructions are required (min 10 characters)";
    if (selectedCertifications.length === 0) e.certifications = "At least one certification is required";
    if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin is required";
    if (!form.manufacturerName.trim()) e.manufacturerName = "Manufacturer name is required";
    if (!form.storageCondition) e.storageCondition = "Storage condition is required";
    if (!form.productDescription.trim() || form.productDescription.trim().length < 20) e.productDescription = "Product description is required (min 20 characters)";
    if (!form.packType) e.packType = "Pack type is required";
    const uPack = parseFloat(form.unitsPerPack);
    if (isNaN(uPack) || uPack <= 0) e.unitsPerPack = "Units per pack must be > 0";
    const nPacks = parseFloat(form.numberOfPacks);
    if (isNaN(nPacks) || nPacks <= 0) e.numberOfPacks = "Number of packs must be > 0";
    const minQ = parseFloat(form.minimumOrderQuantity);
    if (isNaN(minQ) || minQ <= 0) e.minimumOrderQuantity = "Minimum order quantity must be > 0";
    const maxQ = parseFloat(form.maximumOrderQuantity);
    if (isNaN(maxQ) || maxQ <= 0) e.maximumOrderQuantity = "Maximum order quantity must be > 0";
    if (!isNaN(minQ) && !isNaN(maxQ) && maxQ < minQ) e.maximumOrderQuantity = "Maximum must be ≥ minimum";
    if (!form.batchLotNumber.trim()) e.batchLotNumber = "Batch number is required";
    if (!form.manufacturingDate) e.manufacturingDate = "Manufacturing date is required";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required";
    if (form.manufacturingDate && form.expiryDate && form.expiryDate <= form.manufacturingDate) e.expiryDate = "Expiry date must be after manufacturing date";
    const stock = parseFloat(form.stockQuantity);
    if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be > 0";
    const mrp = parseFloat(form.mrp);
    const selling = parseFloat(form.sellingPricePerPack);
    if (isNaN(selling) || selling <= 0) e.sellingPricePerPack = "Selling price must be > 0";
    if (isNaN(mrp) || mrp <= 0) e.mrp = "MRP must be > 0";
    if (!isNaN(mrp) && !isNaN(selling) && mrp < selling) e.mrp = "MRP must be ≥ selling price";
    if (!form.gstPercentage) e.gstPercentage = "GST% is required";
    if (!form.hsnCode.trim()) e.hsnCode = "HSN code is required";
    if (images.length === 0) e.images = "At least 1 product image is required";
    if (images.length > 5) e.images = "Maximum 5 product images allowed";
    return e;
  };

  // Submit
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors)[0];
      document.querySelector(`[name="${firstKey}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});

    if (!productCategoryId) {
      alert("Product category could not be loaded. Please refresh the page and try again.");
      return;
    }

    setSubmitting(true);

    try {
      const token = sellerAuthService.getToken();
      if (!token) throw new Error("Authentication required. Please login again.");

      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const jsonHeaders = { ...headers, "Content-Type": "application/json" };

      // Prepare payload with correct field names matching backend expectations
      const payload = {
        productName: form.productName,
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.brochureUrl || "",
        manufacturerName: form.manufacturerName,
        categoryId: productCategoryId,
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
          manufacturingDate: form.manufacturingDate ? form.manufacturingDate.toISOString() : null,
          expiryDate: form.expiryDate ? form.expiryDate.toISOString() : null,
          stockQuantity: Number(form.stockQuantity),
          dateOfStockEntry: form.dateOfStockEntry ? form.dateOfStockEntry.toISOString() : new Date().toISOString(),
          sellingPrice: Number(form.sellingPricePerPack),
          mrp: Number(form.mrp),
          discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : 0,
          gstPercentage: Number(form.gstPercentage),
          finalPrice: Number(form.finalPrice),
          hsnCode: form.hsnCode,
          additionalDiscounts: additionalDiscountSlabs,
        }],
        // Updated to match backend field names exactly
        productAttributeConsumableMedicals: [{
          deviceCatId: Number(form.deviceCategoryId),
          deviceSubCatId: Number(form.deviceSubCategoryId),
          brandName: form.brandName,
          materialTypeId: selectedMaterialTypes.map(Number),
          dimensionSize: form.sizeDimension,
          sterileOrNonSterile: form.sterileStatus === "sterile" ? "Sterile" : "Non-Sterile",
          disposalOrReusable: form.disposableType === "disposable" ? "Disposable" : "Reusable",
          shelfLife: form.shelfLife,
          purpose: form.intendedUse,
          keyFeaturesSpecifications: form.keyFeatures,
          safetyInstructions: form.safetyInstructions,
          countryId: form.countryOfOrigin,
          manufacturerName: form.manufacturerName,
          storageConditionId: form.storageCondition ? Number(form.storageCondition) : null,
          brochureType: "PDF",
          brochurePath: "pending",
          certificateDocuments: selectedCertifications.map((c) => ({
            certificationId: c.certificationId,
            certificateUrl: "PENDING",
          })),
        }],
        productImages: images.map(() => ({ productImage: "PENDING" })),
      };

      console.log("📤 Submitting consumable payload:", JSON.stringify(payload, null, 2));

      // Step 1: Create product
      const createRes = await fetch(`${API_BASE}/products/create`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      });

      const responseText = await createRes.text();
      let createData: Record<string, unknown>;
      try {
        createData = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid response from server: ${responseText.substring(0, 200)}`);
      }

      console.log("📥 Product create response:", createData);

      if (!createRes.ok) {
        const errorMsg =
          (createData?.data as Record<string, unknown>)?.message as string ||
          createData?.message as string ||
          `HTTP ${createRes.status}`;
        throw new Error(errorMsg);
      }

      // Extract IDs
      const productId: string | undefined =
        String((createData?.data as Record<string, unknown>)?.productId ?? "").trim() ||
        String((createData as Record<string, unknown>)?.productId ?? "").trim() ||
        undefined;

      if (!productId || productId === "undefined") {
        throw new Error("Product creation failed: no productId returned");
      }

      const productAttributeId = extractConsumableProductAttributeId(createData);

      console.log(`✅ Product created — productId: ${productId}, productAttributeId: ${productAttributeId ?? "NOT FOUND"}`);

      // Step 2: Upload product images
      if (images.length > 0) {
        console.log(`📸 Uploading ${images.length} image(s) to /product-images/${productId}`);
        const imgFormData = new FormData();
        images.forEach((img) => imgFormData.append("productImages", img));
        const imgRes = await fetch(`${API_BASE}/product-images/${productId}`, {
          method: "POST",
          headers,
          body: imgFormData,
        });
        if (!imgRes.ok) {
          const imgErr = await imgRes.text();
          console.warn(`⚠️ Image upload returned ${imgRes.status}: ${imgErr}`);
        } else {
          console.log("✅ Images uploaded successfully");
        }
      }

      // Step 3: Upload certificates & brochure
      if (productAttributeId) {
        // Certificates
        const certsWithFiles = selectedCertifications.filter((c) => c.file);
        if (certsWithFiles.length > 0) {
          console.log(`📜 Uploading ${certsWithFiles.length} certificate(s)`);
          for (const cert of certsWithFiles) {
            const certFormData = new FormData();
            certFormData.append("certificationId", String(cert.certificationId));
            certFormData.append("certificate", cert.file!);
            const certRes = await fetch(
              `${API_BASE}/product-documents/consumable/${productAttributeId}/certificates`,
              { method: "POST", headers, body: certFormData }
            );
            if (!certRes.ok) {
              const certErr = await certRes.text();
              console.warn(`⚠️ Certificate upload (${cert.label}) returned ${certRes.status}: ${certErr}`);
            } else {
              console.log(`✅ Certificate uploaded: ${cert.label}`);
            }
          }
        }

        // Brochure
        if (brochureFile) {
          console.log(`📄 Uploading brochure`);
          const brochureFormData = new FormData();
          brochureFormData.append("brochure", brochureFile);
          const brochureRes = await fetch(
            `${API_BASE}/product-documents/consumable/${productAttributeId}/brochure`,
            { method: "POST", headers, body: brochureFormData }
          );
          if (!brochureRes.ok) {
            const brochureErr = await brochureRes.text();
            console.warn(`⚠️ Brochure upload returned ${brochureRes.status}: ${brochureErr}`);
          } else {
            console.log("✅ Brochure uploaded successfully");
          }
        }
      } else {
        console.warn("⚠️ productAttributeId not found — skipping document uploads");
      }

      alert("Product created successfully!");

      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert(`Failed to create product: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Style helpers
  const selectStyles = (errorKey: string): SelectStyles => ({
    control: (base, state) => ({
      ...base, height: "56px", minHeight: "56px", borderRadius: "16px",
      borderColor: errors[errorKey] ? "#FF3B3B" : state.isFocused ? "#4B0082" : "#737373",
      boxShadow: "none", cursor: "pointer",
      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 16px", cursor: "pointer" }),
    indicatorsContainer: (base) => ({ ...base, height: "56px", cursor: "pointer" }),
    dropdownIndicator: (base, state) => ({ ...base, color: state.isFocused ? "#4B0082" : "#737373", cursor: "pointer", "&:hover": { color: "#4B0082" } }),
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

  // Render
  return (
    <div className="flex flex-col gap-5 max-w-full mx-auto">
      {/* API Error Banner */}
      {apiError && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 text-sm font-semibold">API Error</p>
            <p className="text-red-700 text-xs">{apiError}</p>
            <button
              onClick={() => { fetchDeviceCategories(); fetchMaterialTypes(); fetchCountries(); fetchStorageConditions(); fetchPackTypes(); fetchCertifications(); }}
              className="mt-1 text-xs text-red-600 underline"
            >
              Retry all
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1 — Product Details */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-h3 font-semibold mb-3">Product Details</div>
        <div className="border-b border-neutral-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-8 gap-y-4">
          <Input label="Product Name" name="productName" placeholder="e.g., Surgical Mask" onChange={handleChange} value={form.productName} error={errors.productName} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Device Category <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <Select options={deviceCategoryOptions} isLoading={loadingCategories} value={deviceCategoryOptions.find((o) => o.value === form.deviceCategoryId) || null} onChange={(sel) => handleSelectChange("deviceCategoryId", sel)} placeholder={loadingCategories ? "Loading..." : "Select consumable category"} theme={selectTheme} styles={selectStyles("deviceCategoryId")} noOptionsMessage={() => (loadingCategories ? "Loading..." : "No categories found")} />
            {errors.deviceCategoryId && <p className="text-red-500 text-sm mt-1">{errors.deviceCategoryId}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Device Sub-Category <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <Select options={deviceSubCategoryOptions} isLoading={loadingSubCategories} isDisabled={!form.deviceCategoryId} value={deviceSubCategoryOptions.find((o) => o.value === form.deviceSubCategoryId) || null} onChange={(sel) => handleSelectChange("deviceSubCategoryId", sel)} placeholder={form.deviceCategoryId ? (loadingSubCategories ? "Loading..." : "Select sub-category") : "Select category first"} theme={selectTheme} styles={selectStyles("deviceSubCategoryId")} noOptionsMessage={() => (loadingSubCategories ? "Loading..." : "No sub-categories found")} />
            {errors.deviceSubCategoryId && <p className="text-red-500 text-sm mt-1">{errors.deviceSubCategoryId}</p>}
          </div>

          <Input label="Brand / Model Name" name="brandName" placeholder="e.g., 3M, Johnson & Johnson" onChange={handleChange} value={form.brandName} error={errors.brandName} required />

          {/* Material Type — multi-select */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Material Type <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <div className="relative" ref={materialDropdownRef}>
              <div onClick={() => setShowMaterialDropdown((prev) => !prev)} className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${errors.materialType ? "border-red-500" : "border-neutral-300"}`}>
                <span className="text-sm text-neutral-700 truncate pr-2">
                  {selectedMaterialTypes.length > 0 ? selectedMaterialTypes.map((v) => materialTypeOptions.find((o) => o.value === v)?.label).join(", ") : "Select material types"}
                </span>
                <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${showMaterialDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {showMaterialDropdown && (
                <div className="absolute z-20 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                  {loadingMaterialTypes ? <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
                    : materialTypeOptions.length > 0
                      ? materialTypeOptions.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer">
                          <input type="checkbox" checked={selectedMaterialTypes.includes(option.value)} onChange={() => handleMaterialCheckboxChange(option)} className="accent-purple-600" />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))
                      : <div className="px-4 py-3 text-gray-500 text-sm">No material types available</div>}
                </div>
              )}
            </div>
            {errors.materialType && <p className="text-red-500 text-sm mt-1">{errors.materialType}</p>}
          </div>

          <Input label="Size / Dimension / Gauge" name="sizeDimension" placeholder="e.g., Size M, 22G, 10cm x 10cm" onChange={handleChange} value={form.sizeDimension} error={errors.sizeDimension} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Sterile / Non-Sterile <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <div className="flex gap-6 mt-2">
              {sterileOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="sterileStatus" value={option.value} checked={form.sterileStatus === option.value} onChange={handleChange} className="accent-primary-900 w-5 h-5" />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.sterileStatus && <p className="text-red-500 text-sm mt-1">{errors.sterileStatus}</p>}
          </div>

          <Input label="Shelf Life" name="shelfLife" placeholder="e.g., 3 years, 24 months" onChange={handleChange} value={form.shelfLife} error={errors.shelfLife} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Disposable / Reusable <span className="text-warning-500 ml-1">*</span></label>
            <div className="flex gap-6 mt-2">
              {disposableOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="disposableType" value={option.value} checked={form.disposableType === option.value} onChange={handleChange} className="accent-primary-900 w-5 h-5" />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.disposableType && <p className="text-red-500 text-sm mt-1">{errors.disposableType}</p>}
          </div>

          {/* Certifications Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                  Certifications / Compliance <span className="text-warning-500 ml-1">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div onClick={() => setShowCertDropdown((prev) => !prev)} className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${errors.certifications ? "border-red-500" : "border-neutral-300"}`}>
                    <span className="text-sm text-neutral-700 truncate pr-2">
                      {selectedCertifications.length > 0 ? selectedCertifications.map((c) => c.label).join(", ") : "Select certifications"}
                    </span>
                    <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${showCertDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {showCertDropdown && (
                    <div className="absolute z-20 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                      {loadingCertifications ? <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
                        : certificationMasterOptions.map((option) => (
                          <label key={option.value} className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer">
                            <input type="checkbox" checked={selectedCertifications.some((c) => c.id === option.value)} onChange={() => handleCertificationCheckboxChange(option)} className="accent-purple-600" />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
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
                  <div className={`w-full border rounded-xl flex items-center h-14 overflow-hidden ${errors.certifications ? "border-red-500" : "border-neutral-300"}`}>
                    <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0"><Upload size={18} className="text-purple-700" /></div>
                    <span className="text-gray-400 text-sm px-3">Select certifications first</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedCertifications.map((cert) => (
                      <div key={cert.id}>
                        {!cert.isUploaded ? (
                          <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-14 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition" onClick={() => handleTagClick(cert.id)}>
                            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                              {cert.uploading ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} className="text-purple-700" />}
                            </div>
                            <span className="px-3 text-sm text-neutral-600 truncate flex-1">{cert.uploading ? "Uploading..." : cert.label}</span>
                            <button type="button" onClick={(e) => handleRemoveTag(cert.id, e)} className="pr-3 text-neutral-400 hover:text-red-500 transition"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center border border-purple-300 rounded-xl overflow-hidden h-14 bg-purple-50">
                            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-purple-700" /></div>
                            <div className="flex-1 px-3 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{cert.fileName}</p>
                              <p className="text-xs text-neutral-500">{cert.label}</p>
                            </div>
                            <div className="flex items-center gap-1 pr-3">
                              <button type="button" onClick={() => handleTagClick(cert.id)} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700 transition" title="Replace file"><RefreshCw size={14} /></button>
                              <button type="button" onClick={(e) => handleRemoveTag(cert.id, e)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition" title="Remove"><X size={14} /></button>
                            </div>
                          </div>
                        )}
                        <input id={`cert-upload-${cert.id}`} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) handleCertificationFileUpload(cert.id, e.target.files[0]); }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Input label="Intended Use / Purpose" name="intendedUse" placeholder="e.g., For surgical procedures, wound care" onChange={handleChange} value={form.intendedUse} error={errors.intendedUse} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Country of Origin <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <Select options={countryOptions} isLoading={loadingCountries} value={countryOptions.find((o) => o.value === form.countryOfOrigin) || null} onChange={(sel) => handleSelectChange("countryOfOrigin", sel)} placeholder={loadingCountries ? "Loading..." : "Select country"} theme={selectTheme} styles={selectStyles("countryOfOrigin")} noOptionsMessage={() => (loadingCountries ? "Loading..." : "No countries available")} />
            {errors.countryOfOrigin && <p className="text-red-500 text-sm mt-1">{errors.countryOfOrigin}</p>}
          </div>

          <Input label="Manufacturer Name" name="manufacturerName" placeholder="Manufacturer company name" onChange={handleChange} value={form.manufacturerName} error={errors.manufacturerName} required />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Storage Condition <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <Select options={storageConditionOptions} isLoading={loadingStorage} value={storageConditionOptions.find((o) => o.value === form.storageCondition) || null} onChange={(sel) => handleSelectChange("storageCondition", sel)} placeholder={loadingStorage ? "Loading..." : "Select storage condition"} theme={selectTheme} styles={selectStyles("storageCondition")} noOptionsMessage={() => (loadingStorage ? "Loading..." : "No options available")} />
            {errors.storageCondition && <p className="text-red-500 text-sm mt-1">{errors.storageCondition}</p>}
          </div>

          {/* Brochure Upload */}
          <div>
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-3">Upload Product Brochure / User Manual</label>
            {!brochureFile ? (
              <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-14 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition" onClick={() => brochureInputRef.current?.click()}>
                <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                  {uploadingBrochure ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} className="text-purple-700" />}
                </div>
                <span className="px-3 text-sm text-neutral-400">{uploadingBrochure ? "Uploading..." : "Upload PDF (max 5MB)"}</span>
              </div>
            ) : (
              <div className="flex items-center border border-purple-300 rounded-xl overflow-hidden h-14 bg-purple-50">
                <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-purple-700" /></div>
                <div className="flex-1 px-3 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{brochureFile.name}</p>
                  <p className="text-xs text-neutral-500">{(brochureFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex items-center gap-1 pr-3">
                  <button type="button" onClick={() => brochureInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700 transition" title="Change file"><RefreshCw size={14} /></button>
                  <button type="button" onClick={() => { setBrochureFile(null); if (brochureInputRef.current) brochureInputRef.current.value = ""; }} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition" title="Remove file"><X size={14} /></button>
                </div>
              </div>
            )}
            <input ref={brochureInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleBrochureUpload(e.target.files[0]); }} />
          </div>

          {/* Key Features & Safety Instructions */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">Safety Instructions / Precautions <span className="text-warning-500 font-semibold ml-1">*</span></label>
                <textarea name="safetyInstructions" placeholder="Enter safety warnings, precautions, and handling instructions" value={form.safetyInstructions} onChange={handleChange} rows={4} className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${errors.safetyInstructions ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`} />
                {errors.safetyInstructions && <p className="text-red-500 text-sm mt-1">{errors.safetyInstructions}</p>}
              </div>
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">Key Features / Technical Specifications <span className="text-warning-500 font-semibold ml-1">*</span></label>
                <textarea name="keyFeatures" placeholder="List key features, technical specifications" value={form.keyFeatures} onChange={handleChange} rows={4} className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${errors.keyFeatures ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`} />
                {errors.keyFeatures && <p className="text-red-500 text-sm mt-1">{errors.keyFeatures}</p>}
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">Product Description <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <textarea name="productDescription" placeholder="Detailed product description, indications, and usage (min 20 characters)" value={form.productDescription} onChange={handleChange} rows={4} className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${errors.productDescription ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`} />
            {errors.productDescription && <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 2 — Packaging & Order Details */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-h3 font-semibold mb-3">Packaging & Order Details</div>
        <div className="border-b border-neutral-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-8">
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Pack Type <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <Select options={packTypeApiOptions} isLoading={loadingPackTypes} value={packTypeApiOptions.find((o) => o.value === form.packType) || null} onChange={(sel) => handleSelectChange("packType", sel)} placeholder={loadingPackTypes ? "Loading..." : "Select pack type"} theme={selectTheme} styles={selectStyles("packType")} />
            {errors.packType && <p className="text-red-500 text-sm mt-1">{errors.packType}</p>}
          </div>
          <Input label="Number of Units per Pack Type" name="unitsPerPack" placeholder="e.g., 100" onChange={handleChange} value={form.unitsPerPack} error={errors.unitsPerPack} required />
          <Input label="Number of Packs" name="numberOfPacks" placeholder="e.g., 10" onChange={handleChange} value={form.numberOfPacks} error={errors.numberOfPacks} required />
          <Input label="Pack Size (Units × Packs — auto calculated)" name="packSize" value={form.packSize} disabled required />
        </div>

        <div className="mb-4"><div className="text-h6 text-neutral-900 font-regular mb-2">Order Details</div><div className="border-b border-neutral-200" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="Min Order Qty (MOQ)" name="minimumOrderQuantity" placeholder="Minimum quantity per order" onChange={handleChange} value={form.minimumOrderQuantity} error={errors.minimumOrderQuantity} required />
          <Input label="Max Order Qty" name="maximumOrderQuantity" placeholder="Maximum quantity per order" onChange={handleChange} value={form.maximumOrderQuantity} error={errors.maximumOrderQuantity} required />
        </div>

        <div className="mb-4"><div className="text-h6 text-neutral-900 font-regular mb-2">Batch Management</div><div className="border-b border-neutral-200" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="Batch / Lot Number" name="batchLotNumber" placeholder="Enter batch number" onChange={handleChange} value={form.batchLotNumber} error={errors.batchLotNumber} required />
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold flex items-center gap-2">Manufacturing Date <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <input type="date" name="manufacturingDate" onChange={(e) => setForm((prev) => ({ ...prev, manufacturingDate: e.target.value ? new Date(e.target.value) : null }))} value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""} className={`w-full h-14 px-4 border rounded-xl focus:outline-none focus:ring-0 ${errors.manufacturingDate ? "border-red-500" : "border-neutral-300 focus:border-[#4B0082]"} bg-white text-neutral-900`} />
            {errors.manufacturingDate && <p className="text-red-500 text-sm mt-1">{errors.manufacturingDate}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold flex items-center gap-2">Expiry Date <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <input type="date" name="expiryDate" onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value ? new Date(e.target.value) : null }))} value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""} className={`w-full h-14 px-4 border rounded-xl focus:outline-none focus:ring-0 ${errors.expiryDate ? "border-red-500" : "border-neutral-300 focus:border-[#4B0082]"} bg-white text-neutral-900`} />
            {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
          </div>
          <Input label="Stock Quantity (w.r.t pack size)" name="stockQuantity" placeholder="Number of packs in stock" onChange={handleChange} value={form.stockQuantity} error={errors.stockQuantity} required />
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold flex items-center gap-2">Date of Stock Entry</label>
            <input type="date" name="dateOfStockEntry" onChange={(e) => setForm((prev) => ({ ...prev, dateOfStockEntry: e.target.value ? new Date(e.target.value) : new Date() }))} value={form.dateOfStockEntry ? form.dateOfStockEntry.toISOString().split("T")[0] : ""} className="w-full h-14 px-4 border border-neutral-300 rounded-xl focus:outline-none focus:ring-0 focus:border-[#4B0082] bg-white text-neutral-900" />
          </div>
        </div>

        <div className="mb-4"><div className="text-h6 text-neutral-900 font-regular mb-2">Pricing</div><div className="border-b border-neutral-200" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="MRP (per Pack Size)" name="mrp" placeholder="Maximum Retail Price" onChange={handleChange} value={form.mrp} error={errors.mrp} required />
          <Input label="Selling Price (per Pack Size)" name="sellingPricePerPack" placeholder="Selling price" onChange={handleChange} value={form.sellingPricePerPack} error={errors.sellingPricePerPack} required />
          <Input label="Discount Percentage (%)" name="discountPercentage" placeholder="e.g., 10" onChange={handleChange} value={form.discountPercentage} error={errors.discountPercentage} />
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 font-semibold opacity-0">Hidden</label>
            <button
              type="button"
              onClick={() => setShowDiscountDrawer(true)}
              className="px-4 py-2 h-14 bg-[#9F75FC] text-white rounded-xl font-semibold transition w-1/2 hover:bg-purple-600"
            >
              + Add Additional Discount
            </button>
          </div>
        </div>

        {additionalDiscountSlabs.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-purple-800">
                {additionalDiscountSlabs.length} Additional Discount Slab{additionalDiscountSlabs.length > 1 ? "s" : ""} Added
              </span>
              <button type="button" onClick={() => setShowDiscountDrawer(true)} className="text-xs text-purple-600 underline">Edit All</button>
            </div>
            {additionalDiscountSlabs.map((slab, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-purple-700 py-1 border-t border-purple-100">
                <span>Min Qty: {slab.minimumPurchaseQuantity} — Discount: {slab.additionalDiscountPercentage}%</span>
                <button
                  type="button"
                  onClick={() => setAdditionalDiscountSlabs((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-600 ml-3"
                  title="Remove this slab"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4"><div className="text-h6 text-neutral-900 font-regular mb-2">TAX & BILLING</div><div className="border-b border-neutral-200" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">GST % <span className="text-warning-500 font-semibold ml-1">*</span></label>
            <Select options={gstOptions} value={gstOptions.find((o) => o.value === form.gstPercentage) || null} onChange={(sel) => handleSelectChange("gstPercentage", sel)} placeholder="Select GST" theme={selectTheme} styles={selectStyles("gstPercentage")} />
            {errors.gstPercentage && <p className="text-red-500 text-sm mt-1">{errors.gstPercentage}</p>}
          </div>
          <Input label="HSN Code" name="hsnCode" placeholder="HSN Code" onChange={handleChange} value={form.hsnCode} error={errors.hsnCode} required />
        </div>

        <div className="mb-6">
          <label className="block text-label-l3 text-primary-1000 font-semibold mb-1">Final Price (after discounts):</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-700 text-p4">₹</span>
            <input type="text" value={form.finalPrice || "0.00"} disabled className="w-full h-12 pl-8 pr-4 text-p4 rounded-xl border-2 border-[#C4AAFD] bg-[#F8F5FF] text-primary-700 focus:outline-none cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* SECTION 3 — Product Photos */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-p3 text-neutral-900 font-semibold mb-2">
          Product Photos <span className="text-warning-500">*</span>
        </div>
        <p className="text-xs text-neutral-400 mb-3">Min 1, Max 5 images. JPG / PNG / JPEG. Max 5MB each.</p>

        <div
          className="border-2 border-dashed border-neutral-300 rounded-xl p-6 cursor-pointer hover:border-purple-400 transition"
          onClick={() => document.getElementById("consumableFileInput")?.click()}
        >
          <div className="flex flex-col items-center justify-center py-4">
            <Image src="/icons/FolderIcon.svg" alt="upload" width={40} height={40} className="rounded-md object-cover mb-4" />
            <div className="text-label-l2 font-normal text-center">Choose files or drag & drop them here</div>
            <div className="text-label-l1 font-normal text-neutral-400 text-center">Upload product images (JPEG, PNG) — Max 5 images</div>
          </div>
        </div>

        <input
          id="consumableFileInput"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              const files = Array.from(e.target.files);
              if (images.length + files.length > 5) { alert("Maximum 5 images allowed"); return; }
              setImages((prev) => [...prev, ...files]);
              if (errors.images) setErrors((prev) => { const n = { ...prev }; delete n.images; return n; });
            }
          }}
        />

        {images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-neutral-700">{images.length} / 5 image{images.length > 1 ? "s" : ""} uploaded</span>
              {images.length < 5 && (
                <button type="button" onClick={() => document.getElementById("consumableFileInput")?.click()} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  + Add More
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((file, i) => {
                const imageUrl = URL.createObjectURL(file);
                return (
                  <div key={i} className="relative group">
                    <img src={imageUrl} alt={`product-${i + 1}`} className="w-full aspect-square object-cover rounded-xl border-2 border-neutral-200 group-hover:border-purple-300 transition shadow-sm" />
                    <button
                      type="button"
                      onClick={() => { URL.revokeObjectURL(imageUrl); setImages((prev) => prev.filter((_, idx) => idx !== i)); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition opacity-0 group-hover:opacity-100"
                    >
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pb-8">
        <div className="flex gap-4 justify-center sm:justify-start">
          <button type="button" onClick={() => window.location.reload()} className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer hover:bg-red-50 transition">
            Cancel
          </button>
          <button type="button" className="px-6 py-2 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition">
            <Image src="/icons/SaveDraftIcon.svg" alt="draft" width={20} height={20} className="rounded-md object-cover" />
            Save Draft
          </button>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button type="button" onClick={handleSubmit} disabled={submitting} className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* Additional Discount Drawer */}
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