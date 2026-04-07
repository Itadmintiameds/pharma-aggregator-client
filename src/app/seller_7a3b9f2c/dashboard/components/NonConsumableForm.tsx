"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Select, { StylesConfig, Theme } from "react-select";
import Input from "@/src/app/commonComponents/Input";
import Image from "next/image";
import Drawer from "@/src/app/commonComponents/Drawer";
import AdditionalDiscount from "./AdditionalDiscount";
import VariantList from "./VariantList";
import { FileText, X, Upload, Eye, RefreshCw, AlertCircle } from "lucide-react";

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

interface NonConsumableFormProps {
  deviceType: "non-consumable";
}

interface Variant {
  id: string;
  packSize: string;
  stock: string;
  sellingPrice: string;
  mrp: string;
  moq: string;
  batch: string;
  expiryDate: string;
  packType?: string;
  unitsPerPack?: string;
  numberOfPacks?: string;
  minOrderQty?: string;
  maxOrderQty?: string;
  manufacturingDate?: string;
  stockQuantity?: string;
  dateOfEntry?: string;
  discountPercent?: string;
  finalPrice?: string;
  gst?: string;
  hsnCode?: string;
  [key: string]: unknown;
}

interface ApiErrorResponse {
  message?: string;
}

type SelectStyles = StylesConfig<SelectOption, false>;

// ─── API constants ─────────────────────────────────────────────────────────────

const API_BASE = "https://api-test-aggreator.tiameds.ai/api/v1";
const MASTERS = `${API_BASE}/masters`;

// ─── Component ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NonConsumableForm = ({ deviceType: _deviceType }: NonConsumableFormProps) => {
  // ── Form State ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    productName: "",
    brandName: "",
    modelName: "",
    modelNumber: "",
    deviceClassification: "",
    udiNumber: "",
    intendedUse: "",
    keyFeatures: "",
    safetyInstructions: "",
    countryOfOrigin: "",
    manufacturerName: "",
    storageCondition: "",
    deviceCategoryId: "",
    deviceSubCategoryId: "",
    powerSourceId: "",
    warrantyPeriod: "",
    amcAvailability: "",
    productDescription: "",
    brochureType: "pdf",
    brochureUrl: "",
    packType: "",
    unitsPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    manufacturingDate: null as Date | null,
    stockQuantity: "",
    dateOfStockEntry: new Date(),
    mrp: "",
    sellingPricePerPack: "",
    discountPercentage: "",
    gstPercentage: "",
    hsnCode: "",
    finalPrice: "",
  });

  // ── Master Options ───────────────────────────────────────────────────────────
  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [deviceSubCategoryOptions, setDeviceSubCategoryOptions] = useState<SelectOption[]>([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);
  const [powerSourceOptions, setPowerSourceOptions] = useState<SelectOption[]>([]);
  const [packTypeApiOptions, setPackTypeApiOptions] = useState<SelectOption[]>([]);
  const [certificationMasterOptions, setCertificationMasterOptions] = useState<
    { value: string; label: string; certificationId: number; tagCode: string }[]
  >([]);

  // ── Loading flags ────────────────────────────────────────────────────────────
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingMaterialTypes, setLoadingMaterialTypes] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [loadingPowerSource, setLoadingPowerSource] = useState(false);
  const [loadingPackTypes, setLoadingPackTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── UI State ─────────────────────────────────────────────────────────────────
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
  const [variants, setVariants] = useState<Variant[]>([]);
  const [additionalDiscountSlabs, setAdditionalDiscountSlabs] = useState<AdditionalDiscountSlab[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const materialDropdownRef = useRef<HTMLDivElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  // ── Static options ───────────────────────────────────────────────────────────
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

  // ── API: Fetch Masters ───────────────────────────────────────────────────────

  const fetchDeviceCategories = useCallback(async () => {
    setLoadingCategories(true);
    setApiError(null);
    try {
      const res = await fetch(`${MASTERS}/device-categories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      const filtered = (
        items as Array<{
          deviceCategoryType?: string;
          deviceCatId?: number;
          id?: number;
          deviceName?: string;
          name?: string;
        }>
      ).filter((item) => {
        const t = (item.deviceCategoryType || "").toLowerCase();
        return t === "non-consumable" || t === "non_consumable";
      });
      setDeviceCategoryOptions(
        filtered
          .map((item) => ({
            value: String(item.deviceCatId || item.id || ""),
            label: String(item.deviceName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch (err) {
      setApiError(
        `Failed to load device categories: ${err instanceof Error ? err.message : err}`
      );
      setDeviceCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchDeviceSubCategories = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setDeviceSubCategoryOptions([]);
      return;
    }
    setLoadingSubCategories(true);
    try {
      const res = await fetch(`${MASTERS}/device-sub-categories/${categoryId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setDeviceSubCategoryOptions(
        (
          items as Array<{
            deviceSubCatId?: number;
            subCategoryId?: number;
            id?: number;
            deviceSubCatName?: string;
            subCategoryName?: string;
            name?: string;
          }>
        )
          .map((item) => ({
            value: String(item.deviceSubCatId || item.subCategoryId || item.id || ""),
            label: String(item.deviceSubCatName || item.subCategoryName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch {
      setDeviceSubCategoryOptions([]);
    } finally {
      setLoadingSubCategories(false);
    }
  }, []);

  const fetchMaterialTypes = useCallback(async () => {
    setLoadingMaterialTypes(true);
    try {
      const res = await fetch(`${MASTERS}/material-types`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setMaterialTypeOptions(
        (
          items as Array<{
            materialTypeId?: number;
            id?: number;
            materialTypeName?: string;
            name?: string;
          }>
        )
          .map((item) => ({
            value: String(item.materialTypeId || item.id || ""),
            label: String(item.materialTypeName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch {
      setMaterialTypeOptions([]);
    } finally {
      setLoadingMaterialTypes(false);
    }
  }, []);

  const fetchCountries = useCallback(async () => {
    setLoadingCountries(true);
    try {
      const res = await fetch(`${MASTERS}/countries`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setCountryOptions(
        (
          items as Array<{
            countryId?: number;
            id?: number;
            countryName?: string;
            name?: string;
          }>
        )
          .map((item) => ({
            value: String(item.countryId || item.id || ""),
            label: String(item.countryName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch {
      setCountryOptions([]);
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  const fetchStorageConditions = useCallback(async () => {
    setLoadingStorage(true);
    try {
      const res = await fetch(`${MASTERS}/storagecondition`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setStorageConditionOptions(
        (
          items as Array<{
            storageConditionId?: number;
            id?: number;
            conditionName?: string;
            name?: string;
          }>
        )
          .map((item) => ({
            value: String(item.storageConditionId || item.id || ""),
            label: String(item.conditionName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch {
      setStorageConditionOptions([]);
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  const fetchPowerSources = useCallback(async () => {
    setLoadingPowerSource(true);
    try {
      const res = await fetch(`${MASTERS}/power-sources`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setPowerSourceOptions(
        (
          items as Array<{
            powerSourceId?: number;
            id?: number;
            powerSourceName?: string;
            name?: string;
          }>
        )
          .map((item) => ({
            value: String(item.powerSourceId || item.id || ""),
            label: String(item.powerSourceName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch {
      setPowerSourceOptions([
        { value: "1", label: "Battery Operated" },
        { value: "2", label: "Rechargeable" },
        { value: "3", label: "Electric (Direct Power)" },
        { value: "4", label: "USB Powered" },
        { value: "5", label: "Manual (No Power Required)" },
      ]);
    } finally {
      setLoadingPowerSource(false);
    }
  }, []);

  const fetchPackTypes = useCallback(async () => {
    setLoadingPackTypes(true);
    try {
      const res = await fetch(`${MASTERS}/pack-types`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setPackTypeApiOptions(
        (
          items as Array<{
            packId?: number;
            id?: number;
            packName?: string;
            name?: string;
          }>
        )
          .map((item) => ({
            value: String(item.packId || item.id || ""),
            label: String(item.packName || item.name || "Unknown"),
          }))
          .filter((o) => o.value)
      );
    } catch {
      setPackTypeApiOptions([
        { value: "1", label: "Box" },
        { value: "2", label: "Unit" },
        { value: "3", label: "Carrying Case" },
        { value: "4", label: "Kit" },
        { value: "5", label: "Bag" },
        { value: "6", label: "Set" },
        { value: "7", label: "Other" },
      ]);
    } finally {
      setLoadingPackTypes(false);
    }
  }, []);

  const fetchCertifications = useCallback(async () => {
    setLoadingCertifications(true);
    try {
      const res = await fetch(`${MASTERS}/certifications`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: unknown[] = Array.isArray(data) ? data : (data.data || []);
      setCertificationMasterOptions(
        (
          items as Array<{
            certificationId?: number;
            id?: number;
            certificationName?: string;
            name?: string;
          }>
        )
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
        { value: "1", label: "CDSCO License Number", certificationId: 1, tagCode: "Tag 01" },
        { value: "2", label: "ISO Certificate", certificationId: 2, tagCode: "Tag 02" },
        { value: "3", label: "CE Certification", certificationId: 3, tagCode: "Tag 03" },
        { value: "4", label: "BIS Certification", certificationId: 4, tagCode: "Tag 04" },
      ]);
    } finally {
      setLoadingCertifications(false);
    }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchDeviceCategories();
    fetchMaterialTypes();
    fetchCountries();
    fetchStorageConditions();
    fetchPowerSources();
    fetchPackTypes();
    fetchCertifications();
  }, [
    fetchDeviceCategories,
    fetchMaterialTypes,
    fetchCountries,
    fetchStorageConditions,
    fetchPowerSources,
    fetchPackTypes,
    fetchCertifications,
  ]);

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
    if (!isNaN(u) && !isNaN(p) && u > 0 && p > 0) {
      setForm((prev) => ({ ...prev, packSize: (u * p).toString() }));
    }
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowCertDropdown(false);
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(e.target as Node))
        setShowMaterialDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSelectChange = (field: string, selected: SelectOption | null) => {
    setForm((prev) => ({ ...prev, [field]: selected ? selected.value : "" }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleCertificationCheckboxChange = (
    option: (typeof certificationMasterOptions)[0]
  ) => {
    const exists = selectedCertifications.some((c) => c.id === option.value);
    if (exists) {
      setSelectedCertifications((prev) => prev.filter((c) => c.id !== option.value));
    } else {
      setSelectedCertifications((prev) => [
        ...prev,
        {
          id: option.value,
          label: option.label,
          tagCode: option.tagCode,
          certificationId: option.certificationId,
          file: null,
          fileName: "",
          uploading: false,
          isUploaded: false,
          previewUrl: null,
        },
      ]);
    }
  };

  const handleMaterialCheckboxChange = (option: SelectOption) => {
    const isChecked = selectedMaterialTypes.includes(option.value);
    const updated = isChecked
      ? selectedMaterialTypes.filter((v) => v !== option.value)
      : [...selectedMaterialTypes, option.value];
    setSelectedMaterialTypes(updated);
    if (errors.materialType)
      setErrors((prev) => { const n = { ...prev }; delete n.materialType; return n; });
  };

  const handleTagClick = (certId: string) => {
    document.getElementById(`cert-upload-${certId}`)?.click();
  };

  const handleRemoveTag = (certId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCertifications((prev) => prev.filter((c) => c.id !== certId));
  };

  const handleCertificationFileUpload = async (certId: string, file: File) => {
    setSelectedCertifications((prev) =>
      prev.map((c) => (c.id === certId ? { ...c, uploading: true } : c))
    );
    await new Promise((r) => setTimeout(r, 800));
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setSelectedCertifications((prev) =>
      prev.map((c) =>
        c.id === certId
          ? { ...c, file, fileName: file.name, uploading: false, isUploaded: true, previewUrl }
          : c
      )
    );
  };

  const handleBrochureUpload = async (file: File) => {
    setUploadingBrochure(true);
    await new Promise((r) => setTimeout(r, 800));
    setBrochureFile(file);
    setUploadingBrochure(false);
  };

  // ── Variant Handlers ─────────────────────────────────────────────────────────

  // FIX 1: parameter is Omit<Variant, 'id'>, then id is added separately (no duplicate)
  const handleAddVariant = (variantData: Omit<Variant, "id">) => {
    const newVariant = { ...variantData, id: Date.now().toString() } as Variant;
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleEditVariant = (v: Variant) => {
    setVariants((prev) => prev.map((x) => (x.id === v.id ? v : x)));
  };

  const handleDeleteVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

    if (!form.productName.trim() || form.productName.trim().length < 3)
      e.productName = "Product name is required (min 3 characters)";
    if (!form.deviceCategoryId) e.deviceCategoryId = "Device category is required";
    if (!form.deviceSubCategoryId) e.deviceSubCategoryId = "Device sub-category is required";
    if (!form.brandName.trim()) e.brandName = "Brand name is required";
    if (!form.modelName.trim()) e.modelName = "Model name is required";
    if (!form.modelNumber.trim()) e.modelNumber = "Model number is required";
    if (!form.deviceClassification) e.deviceClassification = "Device class is required";
    if (!form.intendedUse.trim() || form.intendedUse.trim().length < 10)
      e.intendedUse = "Intended use is required (min 10 characters)";
    if (!form.keyFeatures.trim() || form.keyFeatures.trim().length < 10)
      e.keyFeatures = "Key features are required (min 10 characters)";
    if (!form.safetyInstructions.trim() || form.safetyInstructions.trim().length < 10)
      e.safetyInstructions = "Safety instructions are required (min 10 characters)";
    if (selectedCertifications.length === 0)
      e.certifications = "At least one certification is required";
    if (selectedMaterialTypes.length === 0)
      e.materialType = "At least one material type must be selected";
    if (!form.warrantyPeriod.trim()) e.warrantyPeriod = "Warranty period is required";
    if (!/^\d{1,3}$/.test(form.warrantyPeriod.trim()))
      e.warrantyPeriod = "Warranty period must be a number (max 3 digits)";
    if (!form.amcAvailability) e.amcAvailability = "AMC / Service availability is required";
    if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin is required";
    if (!form.manufacturerName.trim()) e.manufacturerName = "Manufacturer name is required";
    if (!form.productDescription.trim() || form.productDescription.trim().length < 20)
      e.productDescription = "Product description is required (min 20 characters)";

    if (!form.packType) e.packType = "Pack type is required";
    const uPack = parseFloat(form.unitsPerPack);
    if (isNaN(uPack) || uPack <= 0) e.unitsPerPack = "Number of units per pack must be > 0";
    const nPacks = parseFloat(form.numberOfPacks);
    if (isNaN(nPacks) || nPacks <= 0) e.numberOfPacks = "Number of packs must be > 0";
    const minQ = parseFloat(form.minimumOrderQuantity);
    if (isNaN(minQ) || minQ <= 0) e.minimumOrderQuantity = "Minimum order quantity must be > 0";
    const maxQ = parseFloat(form.maximumOrderQuantity);
    if (isNaN(maxQ) || maxQ <= 0) e.maximumOrderQuantity = "Maximum order quantity must be > 0";
    if (!isNaN(minQ) && !isNaN(maxQ) && maxQ < minQ)
      e.maximumOrderQuantity = "Maximum order quantity must be ≥ minimum";

    if (!form.manufacturingDate) e.manufacturingDate = "Manufacturing date is required";
    if (form.manufacturingDate && form.manufacturingDate > new Date())
      e.manufacturingDate = "Manufacturing date cannot be a future date";
    const stock = parseFloat(form.stockQuantity);
    if (isNaN(stock) || stock <= 0) e.stockQuantity = "Stock quantity must be > 0";
    if (form.dateOfStockEntry && form.dateOfStockEntry > new Date())
      e.dateOfStockEntry = "Date of stock entry cannot be a future date";

    const mrp = parseFloat(form.mrp);
    const selling = parseFloat(form.sellingPricePerPack);
    if (isNaN(selling) || selling <= 0) e.sellingPricePerPack = "Selling price must be > 0";
    if (isNaN(mrp) || mrp <= 0) e.mrp = "MRP must be > 0";
    if (!isNaN(mrp) && !isNaN(selling) && mrp < selling) e.mrp = "MRP must be ≥ selling price";
    const disc = parseFloat(form.discountPercentage);
    if (form.discountPercentage && (isNaN(disc) || disc < 0 || disc > 100))
      e.discountPercentage = "Discount must be between 0 and 100";

    if (!form.gstPercentage) e.gstPercentage = "GST% is required";
    if (!form.hsnCode.trim()) e.hsnCode = "HSN code is required";

    if (images.length === 0) e.images = "At least 1 product image is required";
    if (images.length > 8) e.images = "Maximum 8 product images allowed";

    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors)[0];
      document
        .querySelector(`[name="${firstKey}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        productName: form.productName,
        warningsPrecautions: form.safetyInstructions,
        productDescription: form.productDescription,
        productMarketingUrl: form.brochureType === "url" ? form.brochureUrl : "",
        manufacturerName: form.manufacturerName,
        categoryId: Number(form.deviceCategoryId),
        packagingDetails: {
          packId: Number(form.packType),
          unitPerPack: form.unitsPerPack,
          numberOfPacks: Number(form.numberOfPacks),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },
        pricingDetails: [
          {
            manufacturingDate: form.manufacturingDate
              ? form.manufacturingDate.toISOString()
              : null,
            stockQuantity: Number(form.stockQuantity),
            dateOfStockEntry: form.dateOfStockEntry
              ? form.dateOfStockEntry.toISOString()
              : new Date().toISOString(),
            sellingPrice: Number(form.sellingPricePerPack),
            mrp: Number(form.mrp),
            discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : 0,
            gstPercentage: Number(form.gstPercentage),
            finalPrice: Number(form.finalPrice),
            hsnCode: form.hsnCode,
            additionalDiscounts: additionalDiscountSlabs,
          },
        ],
        productAttributeNonConsumableMedicals: [
          {
            deviceCategoryId: Number(form.deviceCategoryId),
            deviceSubCategoryId: Number(form.deviceSubCategoryId),
            brandName: form.brandName,
            modelName: form.modelName,
            modelNumber: form.modelNumber,
            deviceClassification: form.deviceClassification,
            udiNumber: form.udiNumber || "",
            purpose: form.intendedUse,
            keyFeaturesSpecifications: form.keyFeatures,
            certificateDocuments: selectedCertifications.map((c) => ({
              certificationId: c.certificationId,
              certificateUrl: "PENDING",
            })),
            materialTypeIds: selectedMaterialTypes.map(Number),
            powerSourceId: form.powerSourceId ? Number(form.powerSourceId) : null,
            warrantyPeriod: form.warrantyPeriod,
            amcAvailability: form.amcAvailability === "true",
            countryId: Number(form.countryOfOrigin),
            manufacturerName: form.manufacturerName,
            storageConditionId: form.storageCondition ? Number(form.storageCondition) : null,
            brochurePath: "PENDING",
          },
        ],
        productImages: images.map(() => ({ productImage: "PENDING" })),
      };

      const createRes = await fetch(`${API_BASE}/products/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch((): ApiErrorResponse => ({}));
        throw new Error(errData.message || `HTTP ${createRes.status}`);
      }

      const createData = (await createRes.json()) as {
        data?: {
          productId?: string;
          productAttributeNonConsumableMedicals?: Array<{ productAttributeId?: string }>;
        };
      };
      const productId: string | undefined = createData?.data?.productId;
      const productAttributeId: string | undefined =
        createData?.data?.productAttributeNonConsumableMedicals?.[0]?.productAttributeId;

      if (!productId) throw new Error("Product creation failed: no productId returned");

      if (images.length > 0) {
        const imgFormData = new FormData();
        images.forEach((img) => imgFormData.append("productImages", img));
        const imgRes = await fetch(`${API_BASE}/product-images/${productId}`, {
          method: "POST",
          body: imgFormData,
        });
        if (!imgRes.ok) console.warn("Image upload warning:", await imgRes.text());
      }

      if (productAttributeId) {
        const certsWithFiles = selectedCertifications.filter((c) => c.file);
        for (const cert of certsWithFiles) {
          const certFormData = new FormData();
          certFormData.append("certificationId", String(cert.certificationId));
          certFormData.append("certificate", cert.file!);
          const certRes = await fetch(
            `${API_BASE}/product-documents/non-consumable/${productAttributeId}/certificates`,
            { method: "POST", body: certFormData }
          );
          if (!certRes.ok)
            console.warn(`Cert upload warning for ${cert.label}:`, await certRes.text());
        }

        if (brochureFile) {
          const brochureFormData = new FormData();
          brochureFormData.append("brochure", brochureFile);
          const brochureRes = await fetch(
            `${API_BASE}/product-documents/non-consumable/${productAttributeId}/brochure`,
            { method: "POST", body: brochureFormData }
          );
          if (!brochureRes.ok)
            console.warn("Brochure upload warning:", await brochureRes.text());
        }
      }

      alert(`Non-consumable device created successfully! Product ID: ${productId}`);
      window.location.reload();
    } catch (err) {
      console.error("Submit error:", err);
      alert(
        `Failed to create product: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Style helpers ────────────────────────────────────────────────────────────

  const selectStyles = (errorKey: string): SelectStyles => ({
    control: (base, state) => ({
      ...base,
      height: "56px",
      minHeight: "56px",
      borderRadius: "16px",
      borderColor: errors[errorKey] ? "#FF3B3B" : state.isFocused ? "#4B0082" : "#737373",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 16px", cursor: "pointer" }),
    indicatorsContainer: (base) => ({ ...base, height: "56px", cursor: "pointer" }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "#4B0082" : "#737373",
      cursor: "pointer",
      "&:hover": { color: "#4B0082" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#4B0082" : state.isFocused ? "#F3E8FF" : "white",
      color: state.isSelected ? "white" : "#1E1E1E",
      cursor: "pointer",
      "&:active": { backgroundColor: "#4B0082", color: "white" },
    }),
    placeholder: (base) => ({ ...base, color: "#A3A3A3" }),
    singleValue: (base) => ({ ...base, color: "#1E1E1E" }),
  });

  const selectTheme = (theme: Theme) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: "#4B0082",
      primary25: "#F3E8FF",
      primary50: "#E9D5FF",
    },
  });

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (["jpg", "jpeg", "png"].includes(ext || "")) return "🖼️";
    return "📎";
  };

  // ── Render ───────────────────────────────────────────────────────────────────

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
              onClick={() => {
                fetchDeviceCategories();
                fetchMaterialTypes();
                fetchCountries();
                fetchStorageConditions();
                fetchPowerSources();
                fetchPackTypes();
                fetchCertifications();
              }}
              className="mt-1 text-xs text-red-600 underline"
            >
              Retry all
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SECTION 1 — Product Details
      ══════════════════════════════════════════ */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-h3 font-semibold mb-3">Product Details</div>
        <div className="border-b border-neutral-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-8 gap-y-4">

          <Input
            label="Product Name"
            name="productName"
            placeholder="e.g., Digital BP Monitor"
            onChange={handleChange}
            value={form.productName}
            error={errors.productName}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Device Category <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={deviceCategoryOptions}
              isLoading={loadingCategories}
              value={deviceCategoryOptions.find((o) => o.value === form.deviceCategoryId) || null}
              onChange={(sel) => handleSelectChange("deviceCategoryId", sel)}
              placeholder={loadingCategories ? "Loading..." : "Select non-consumable category"}
              theme={selectTheme}
              styles={selectStyles("deviceCategoryId")}
              noOptionsMessage={() => (loadingCategories ? "Loading..." : "No categories found")}
            />
            {errors.deviceCategoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.deviceCategoryId}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Device Sub-Category <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={deviceSubCategoryOptions}
              isLoading={loadingSubCategories}
              isDisabled={!form.deviceCategoryId}
              value={
                deviceSubCategoryOptions.find((o) => o.value === form.deviceSubCategoryId) || null
              }
              onChange={(sel) => handleSelectChange("deviceSubCategoryId", sel)}
              placeholder={
                form.deviceCategoryId
                  ? loadingSubCategories
                    ? "Loading..."
                    : "Select sub-category"
                  : "Select category first"
              }
              theme={selectTheme}
              styles={selectStyles("deviceSubCategoryId")}
              noOptionsMessage={() =>
                loadingSubCategories ? "Loading..." : "No sub-categories found"
              }
            />
            {errors.deviceSubCategoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.deviceSubCategoryId}</p>
            )}
          </div>

          <Input
            label="Brand Name"
            name="brandName"
            placeholder="e.g., Omron, Philips"
            onChange={handleChange}
            value={form.brandName}
            error={errors.brandName}
            required
          />

          <Input
            label="Model Name"
            name="modelName"
            placeholder="e.g., Pro X"
            onChange={handleChange}
            value={form.modelName}
            error={errors.modelName}
            required
          />

          <Input
            label="Model Number"
            name="modelNumber"
            placeholder="e.g., ACX-200"
            onChange={handleChange}
            value={form.modelNumber}
            error={errors.modelNumber}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Device Class (A / B / C / D){" "}
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={deviceClassOptions}
              value={
                deviceClassOptions.find((o) => o.value === form.deviceClassification) || null
              }
              onChange={(sel) => handleSelectChange("deviceClassification", sel)}
              placeholder="Select device class"
              theme={selectTheme}
              styles={selectStyles("deviceClassification")}
            />
            {errors.deviceClassification && (
              <p className="text-red-500 text-sm mt-1">{errors.deviceClassification}</p>
            )}
          </div>

          <Input
            label="UDI / Serial Number (Optional)"
            name="udiNumber"
            placeholder="Unique Device Identification number"
            onChange={handleChange}
            value={form.udiNumber}
            error={errors.udiNumber}
          />

          {/* Material Type — multi-select checkbox dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Material / Build Type <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={materialDropdownRef}>
              <div
                onClick={() => setShowMaterialDropdown((prev) => !prev)}
                className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${
                  errors.materialType ? "border-red-500" : "border-neutral-300"
                }`}
              >
                <span className="text-sm text-neutral-700 truncate pr-2">
                  {selectedMaterialTypes.length > 0
                    ? selectedMaterialTypes
                        .map((v) => materialTypeOptions.find((o) => o.value === v)?.label)
                        .join(", ")
                    : "Select material types"}
                </span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    showMaterialDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {showMaterialDropdown && (
                <div className="absolute z-20 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                  {loadingMaterialTypes ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
                  ) : materialTypeOptions.length > 0 ? (
                    materialTypeOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMaterialTypes.includes(option.value)}
                          onChange={() => handleMaterialCheckboxChange(option)}
                          className="accent-purple-600"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      No material types available
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors.materialType && (
              <p className="text-red-500 text-sm mt-1">{errors.materialType}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">Power Source</label>
            <Select
              options={powerSourceOptions}
              isLoading={loadingPowerSource}
              value={powerSourceOptions.find((o) => o.value === form.powerSourceId) || null}
              onChange={(sel) => handleSelectChange("powerSourceId", sel)}
              placeholder={loadingPowerSource ? "Loading..." : "Select power source"}
              theme={selectTheme}
              styles={selectStyles("powerSourceId")}
              isClearable
            />
          </div>

          <Input
            label="Warranty Period (months)"
            name="warrantyPeriod"
            placeholder="e.g., 12"
            onChange={handleChange}
            value={form.warrantyPeriod}
            error={errors.warrantyPeriod}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              AMC / Service Availability{" "}
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={amcOptions}
              value={amcOptions.find((o) => o.value === form.amcAvailability) || null}
              onChange={(sel) => handleSelectChange("amcAvailability", sel)}
              placeholder="Yes / No"
              theme={selectTheme}
              styles={selectStyles("amcAvailability")}
            />
            {errors.amcAvailability && (
              <p className="text-red-500 text-sm mt-1">{errors.amcAvailability}</p>
            )}
          </div>

          {/* Certifications */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                  Certifications / Compliance{" "}
                  <span className="text-warning-500 ml-1">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setShowCertDropdown((prev) => !prev)}
                    className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${
                      errors.certifications ? "border-red-500" : "border-neutral-300"
                    }`}
                  >
                    <span className="text-sm text-neutral-700 truncate pr-2">
                      {selectedCertifications.length > 0
                        ? selectedCertifications.map((c) => c.label).join(", ")
                        : "Select certifications"}
                    </span>
                    <svg
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        showCertDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {showCertDropdown && (
                    <div className="absolute z-20 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                      {loadingCertifications ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">Loading...</div>
                      ) : (
                        certificationMasterOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCertifications.some((c) => c.id === option.value)}
                              onChange={() => handleCertificationCheckboxChange(option)}
                              className="accent-purple-600"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.certifications && (
                  <p className="text-red-500 text-sm mt-1">{errors.certifications}</p>
                )}
              </div>

              <div>
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                  Upload Certificate Documents <span className="text-warning-500 ml-1">*</span>
                </label>
                {selectedCertifications.length === 0 ? (
                  <div
                    className={`w-full border rounded-xl flex items-center h-14 overflow-hidden ${
                      errors.certifications ? "border-red-500" : "border-neutral-300"
                    }`}
                  >
                    <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                      <Upload size={18} className="text-purple-700" />
                    </div>
                    <span className="text-gray-400 text-sm px-3">Select certifications first</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedCertifications.map((cert) => (
                      <div
                        key={cert.id}
                        className={`w-full border rounded-xl flex items-center overflow-hidden h-12 transition-all ${
                          cert.isUploaded
                            ? "border-green-300 bg-green-50"
                            : "border-neutral-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleTagClick(cert.id)}
                          className="w-10 h-full bg-[#DED0FE] hover:bg-[#c9b4fe] transition flex items-center justify-center flex-shrink-0"
                          title="Upload file"
                        >
                          {cert.uploading ? (
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          ) : cert.isUploaded ? (
                            <RefreshCw size={14} className="text-purple-700" />
                          ) : (
                            <Upload size={14} className="text-purple-700" />
                          )}
                        </button>
                        <div className="flex items-center justify-between flex-1 px-3 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold text-purple-700 flex-shrink-0">
                              {cert.tagCode}
                            </span>
                            <span className="text-xs text-neutral-500 truncate">{cert.label}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {cert.isUploaded && cert.fileName && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">{getFileIcon(cert.fileName)}</span>
                                <span className="text-xs text-green-700 font-medium max-w-[80px] truncate">
                                  {cert.fileName}
                                </span>
                                {cert.previewUrl && (
                                  <a
                                    href={cert.previewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-purple-600 hover:text-purple-800"
                                  >
                                    <Eye size={13} />
                                  </a>
                                )}
                              </div>
                            )}
                            <button
                              onClick={(e) => handleRemoveTag(cert.id, e)}
                              className="hover:text-red-600 text-neutral-400 transition"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                        <input
                          id={`cert-upload-${cert.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0])
                              handleCertificationFileUpload(cert.id, e.target.files[0]);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Intended Use / Purpose"
            name="intendedUse"
            placeholder="e.g., Blood pressure monitoring for adults"
            onChange={handleChange}
            value={form.intendedUse}
            error={errors.intendedUse}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Country of Origin <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={countryOptions}
              isLoading={loadingCountries}
              value={countryOptions.find((o) => o.value === form.countryOfOrigin) || null}
              onChange={(sel) => handleSelectChange("countryOfOrigin", sel)}
              placeholder={loadingCountries ? "Loading..." : "Select country"}
              theme={selectTheme}
              styles={selectStyles("countryOfOrigin")}
              noOptionsMessage={() =>
                loadingCountries ? "Loading..." : "No countries available"
              }
            />
            {errors.countryOfOrigin && (
              <p className="text-red-500 text-sm mt-1">{errors.countryOfOrigin}</p>
            )}
          </div>

          <Input
            label="Manufacturer Name"
            name="manufacturerName"
            placeholder="Manufacturer company name"
            onChange={handleChange}
            value={form.manufacturerName}
            error={errors.manufacturerName}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Storage Condition <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={storageConditionOptions}
              isLoading={loadingStorage}
              value={
                storageConditionOptions.find((o) => o.value === form.storageCondition) || null
              }
              onChange={(sel) => handleSelectChange("storageCondition", sel)}
              placeholder={loadingStorage ? "Loading..." : "Select storage condition"}
              theme={selectTheme}
              styles={selectStyles("storageCondition")}
              isClearable
              noOptionsMessage={() =>
                loadingStorage ? "Loading..." : "No options available"
              }
            />
            {errors.storageCondition && (
              <p className="text-red-500 text-sm mt-1">{errors.storageCondition}</p>
            )}
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
                  {uploadingBrochure ? "Uploading..." : "Upload PDF (max 5MB)"}
                </span>
              </div>
            ) : (
              <div className="flex items-center border border-purple-300 rounded-xl overflow-hidden h-14 bg-purple-50">
                <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-purple-700" />
                </div>
                <div className="flex-1 px-3 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {brochureFile.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(brochureFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex items-center gap-1 pr-3">
                  <button
                    type="button"
                    onClick={() => brochureInputRef.current?.click()}
                    className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700 transition"
                    title="Change file"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrochureFile(null);
                      if (brochureInputRef.current) brochureInputRef.current.value = "";
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            <input
              ref={brochureInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleBrochureUpload(e.target.files[0]);
              }}
            />
          </div>

          {/* Key Features & Safety Instructions */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Safety Instructions / Precautions{" "}
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="safetyInstructions"
                  placeholder="Enter safety warnings, precautions, and handling instructions"
                  value={form.safetyInstructions}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
                    errors.safetyInstructions
                      ? "border-[#FF3B3B]"
                      : "border-neutral-500 focus:border-[#4B0082]"
                  } focus:outline-none focus:ring-0`}
                />
                {errors.safetyInstructions && (
                  <p className="text-red-500 text-sm mt-1">{errors.safetyInstructions}</p>
                )}
              </div>
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Key Features / Technical Specifications{" "}
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="keyFeatures"
                  placeholder="List key features, technical specifications"
                  value={form.keyFeatures}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
                    errors.keyFeatures
                      ? "border-[#FF3B3B]"
                      : "border-neutral-500 focus:border-[#4B0082]"
                  } focus:outline-none focus:ring-0`}
                />
                {errors.keyFeatures && (
                  <p className="text-red-500 text-sm mt-1">{errors.keyFeatures}</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
              Product Description{" "}
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <textarea
              name="productDescription"
              placeholder="Detailed product description, indications, and usage (min 20 characters)"
              value={form.productDescription}
              onChange={handleChange}
              rows={4}
              className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
                errors.productDescription
                  ? "border-[#FF3B3B]"
                  : "border-neutral-500 focus:border-[#4B0082]"
              } focus:outline-none focus:ring-0`}
            />
            {errors.productDescription && (
              <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — Packaging & Order Details
      ══════════════════════════════════════════ */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-h3 font-semibold mb-3">Packaging & Order Details</div>
        <div className="border-b border-neutral-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-8">
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Pack Type <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={packTypeApiOptions}
              isLoading={loadingPackTypes}
              value={packTypeApiOptions.find((o) => o.value === form.packType) || null}
              onChange={(sel) => handleSelectChange("packType", sel)}
              placeholder={loadingPackTypes ? "Loading..." : "Select pack type"}
              theme={selectTheme}
              styles={selectStyles("packType")}
            />
            {errors.packType && (
              <p className="text-red-500 text-sm mt-1">{errors.packType}</p>
            )}
          </div>

          <Input
            label="Number of Units per Pack Type"
            name="unitsPerPack"
            placeholder="e.g., 1"
            onChange={handleChange}
            value={form.unitsPerPack}
            error={errors.unitsPerPack}
            required
          />

          <Input
            label="Number of Packs"
            name="numberOfPacks"
            placeholder="e.g., 10"
            onChange={handleChange}
            value={form.numberOfPacks}
            error={errors.numberOfPacks}
            required
          />

          <Input
            label="Pack Size (Units × Packs — auto calculated)"
            name="packSize"
            value={form.packSize}
            disabled
            required
          />
        </div>

        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Order Details</div>
          <div className="border-b border-neutral-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="Min Order Qty (MOQ)"
            name="minimumOrderQuantity"
            placeholder="Minimum quantity per order"
            onChange={handleChange}
            value={form.minimumOrderQuantity}
            error={errors.minimumOrderQuantity}
            required
          />
          <Input
            label="Max Order Qty"
            name="maximumOrderQuantity"
            placeholder="Maximum quantity per order"
            onChange={handleChange}
            value={form.maximumOrderQuantity}
            error={errors.maximumOrderQuantity}
            required
          />
        </div>

        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Stock Details</div>
          <div className="border-b border-neutral-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="Manufacturing Date"
            type="date"
            name="manufacturingDate"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                manufacturingDate: e.target.value ? new Date(e.target.value) : null,
              }))
            }
            value={
              form.manufacturingDate
                ? form.manufacturingDate.toISOString().split("T")[0]
                : ""
            }
            error={errors.manufacturingDate}
            required
          />
          <Input
            label="Stock Quantity (w.r.t pack size)"
            name="stockQuantity"
            placeholder="Number of packs in stock"
            onChange={handleChange}
            value={form.stockQuantity}
            error={errors.stockQuantity}
            required
          />
          <Input
            label="Date of Stock Entry"
            type="date"
            name="dateOfStockEntry"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                dateOfStockEntry: e.target.value ? new Date(e.target.value) : new Date(),
              }))
            }
            value={
              form.dateOfStockEntry
                ? form.dateOfStockEntry.toISOString().split("T")[0]
                : ""
            }
            error={errors.dateOfStockEntry}
          />
        </div>

        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Pricing</div>
          <div className="border-b border-neutral-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="MRP (per Pack Size)"
            name="mrp"
            placeholder="Maximum Retail Price"
            onChange={handleChange}
            value={form.mrp}
            error={errors.mrp}
            required
          />
          <Input
            label="Selling Price (per Pack Size)"
            name="sellingPricePerPack"
            placeholder="Selling price"
            onChange={handleChange}
            value={form.sellingPricePerPack}
            error={errors.sellingPricePerPack}
            required
          />
          <Input
            label="Discount Percentage (%)"
            name="discountPercentage"
            placeholder="e.g., 10"
            onChange={handleChange}
            value={form.discountPercentage}
            error={errors.discountPercentage}
          />
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

        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">TAX & BILLING</div>
          <div className="border-b border-neutral-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              GST % <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={gstOptions}
              value={gstOptions.find((o) => o.value === form.gstPercentage) || null}
              onChange={(sel) => handleSelectChange("gstPercentage", sel)}
              placeholder="Select GST"
              theme={selectTheme}
              styles={selectStyles("gstPercentage")}
            />
            {errors.gstPercentage && (
              <p className="text-red-500 text-sm mt-1">{errors.gstPercentage}</p>
            )}
          </div>
          <Input
            label="HSN Code"
            name="hsnCode"
            placeholder="HSN Code"
            onChange={handleChange}
            value={form.hsnCode}
            error={errors.hsnCode}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-label-l3 text-primary-1000 font-semibold mb-1">
            Final Price (after discounts):
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-700 text-p4">
              ₹
            </span>
            <input
              type="text"
              value={form.finalPrice || "0.00"}
              disabled
              className="w-full h-12 pl-8 pr-4 text-p4 rounded-xl border-2 border-[#C4AAFD] bg-[#F8F5FF] text-primary-700 focus:outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-6 py-2 bg-[#9F75FC] text-white rounded-lg font-semibold hover:bg-purple-700 transition">
            Save
          </button>
        </div>
      </div>

      {/* Variant List — FIX 1 & FIX 4: correct handler signatures, no duplicate id */}
      <VariantList
        variants={variants}
        onAdd={handleAddVariant}
        onEdit={handleEditVariant}
        onDelete={handleDeleteVariant}
      />

      {/* ══════════════════════════════════════════
          SECTION 3 — Product Photos
      ══════════════════════════════════════════ */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-p3 text-neutral-900 font-semibold mb-2">
          Product Photos <span className="text-warning-500">*</span>
        </div>
        <p className="text-xs text-neutral-400 mb-3">
          Min 1, Max 8 images. JPG / PNG / JPEG / SVG. Max 5MB each.
        </p>
        <div
          className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer border-2 border-dashed border-neutral-300 hover:border-purple-400 transition"
          onClick={() => document.getElementById("ncFileInput")?.click()}
        >
          <input
            id="ncFileInput"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/jpg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                const files = Array.from(e.target.files);
                if (files.length > 8) {
                  alert("Maximum 8 images allowed");
                  return;
                }
                setImages(files);
                if (errors.images)
                  setErrors((prev) => { const n = { ...prev }; delete n.images; return n; });
              }
            }}
          />
          <div className="flex flex-col items-center justify-center">
            <Image
              src="/icons/FolderIcon.svg"
              alt="upload"
              width={40}
              height={40}
              className="rounded-md object-cover"
            />
            <div className="text-label-l2 font-normal mt-4">
              Choose a file or drag & drop it here
            </div>
            <div className="text-label-l1 font-normal text-neutral-400">
              Upload product images — max 8
            </div>
          </div>
        </div>
        {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
        {images.length > 0 && (
          <div className="mt-2 text-green-600 text-sm">
            ✅ {images.length} image(s) selected
          </div>
        )}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {images.map((file, i) => {
              const imageUrl = URL.createObjectURL(file);
              return (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="w-full h-24 object-cover rounded-md border"
                  />
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(imageUrl);
                      setImages(images.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded hover:bg-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pb-8">
        <div className="flex gap-4 justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer hover:bg-red-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition"
          >
            <Image
              src="/icons/SaveDraftIcon.svg"
              alt="draft"
              width={20}
              height={20}
              className="rounded-md object-cover"
            />
            Save Draft
          </button>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* Additional Discount Drawer — FIX 2: onSave passed correctly */}
      {showDiscountDrawer && (
        <Drawer setShowDrawer={setShowDiscountDrawer} title="Additional Discount">
          <AdditionalDiscount
            onSave={(slabs?: AdditionalDiscountSlab[]) => {
              if (slabs) setAdditionalDiscountSlabs(slabs);
              setShowDiscountDrawer(false);
            }}
          />
        </Drawer>
      )}
    </div>
  );
};

export default NonConsumableForm;