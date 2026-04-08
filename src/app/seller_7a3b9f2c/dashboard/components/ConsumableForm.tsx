  "use client";

  import React, { useEffect, useState, useRef, useCallback } from "react";
  import Select, { StylesConfig, Theme } from "react-select";
  import Input from "@/src/app/commonComponents/Input";
  import Image from "next/image";
  import Drawer from "@/src/app/commonComponents/Drawer";
  import AdditionalDiscount from "./AdditionalDiscount";
  import VariantList from "./VariantList";
  import { ConsumableDeviceSchema } from "@/src/schema/product/ConsumableDeviceSchema";
  import { z } from "zod";
  import { FileText, X, Upload, Eye, RefreshCw } from "lucide-react";

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
  }

  interface ApiMasterData {
    id?: string;
    name?: string;
    value?: string;
    label?: string;
    deviceCategory?: string;
    materialType?: string;
    countryName?: string;
    storageName?: string;
    deviceCatId?: number;
    deviceName?: string;
    deviceCategoryType?: string;
    materialTypeId?: number;
    materialTypeName?: string;
    countryId?: number;
    countryNameApi?: string;
    storageConditionId?: number;
    conditionName?: string;
    [key: string]: unknown;
  }

  interface Variant {
    id: string;
    packSize: string;
    stock: string;
    sellingPrice: string;
    mrp: string;
    mpn?: string;
    moq: string;
    batch: string;
    expiryDate: string;
    [key: string]: unknown;
  }

  type SelectStyles = StylesConfig<SelectOption, false>;

  interface ConsumableFormProps {
    deviceType: "consumable" | "non-consumable";
  }

  const ConsumableForm = ({ deviceType }: ConsumableFormProps) => {
    const [form, setForm] = useState({
      productId: "",
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
      additionalDiscountName: "",
      additionalDiscountValue: "",
      gstPercentage: "",
      hsnCode: "",
      finalPrice: "",
      cdscoNumber: "",
      iso13485: false,
      ce: false,
      bis: false,
    });

    const certificationOptions = [
      { value: "cdsco", label: "CDSCO Registration Number", tagCode: "Tag 01" },
      { value: "import", label: "Import License Number", tagCode: "Tag 02" },
      { value: "iso", label: "ISO 13485", tagCode: "Tag 03" },
      { value: "ce", label: "CE Certification", tagCode: "Tag 04" },
      { value: "bis", label: "BIS Certification", tagCode: "Tag 05" },
    ];

    const sterileOptions = [
      { value: "sterile", label: "Sterile" },
      { value: "non-sterile", label: "Non-Sterile" },
    ];

    const disposableOptions = [
      { value: "disposable", label: "Disposable" },
      { value: "reusable", label: "Reusable" },
    ];

    const deviceClassOptions = [
      { value: "A", label: "Class A" },
      { value: "B", label: "Class B" },
      { value: "C", label: "Class C" },
      { value: "D", label: "Class D" },
    ];

    const packTypeOptions = [
      { value: "box", label: "Box" },
      { value: "pack", label: "Pack" },
      { value: "pouch", label: "Pouch" },
      { value: "piece", label: "Piece (Pc/Unit)" },
      { value: "set", label: "Set" },
      { value: "kit", label: "Kit" },
      { value: "roll", label: "Roll" },
      { value: "tube", label: "Tube" },
      { value: "bottle", label: "Bottle" },
      { value: "can", label: "Can" },
      { value: "jar", label: "Jar" },
      { value: "strip", label: "Strip" },
      { value: "blister", label: "Blister Pack" },
      { value: "bag", label: "Bag" },
      { value: "cartridge", label: "Cartridge" },
      { value: "sachet", label: "Sachet" },
      { value: "spray-bottle", label: "Bottle (Spray)" },
      { value: "container", label: "Container" },
    ];

    const gstOptions = [
      { value: "0", label: "0%" },
      { value: "5", label: "5%" },
      { value: "12", label: "12%" },
      { value: "18", label: "18%" },
    ];

    const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
    const [deviceSubCategoryOptions, setDeviceSubCategoryOptions] = useState<SelectOption[]>([]);
    const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
    const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
    const [storageConditionOptions, setStorageConditionOptions] = useState<SelectOption[]>([]);

    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [loadingMaterialTypes, setLoadingMaterialTypes] = useState(false);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingStorage, setLoadingStorage] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string | null>(null);

    const [images, setImages] = useState<File[]>([]);
    const [brochureFile, setBrochureFile] = useState<File | null>(null);
    const [uploadingBrochure, setUploadingBrochure] = useState(false);
    const [showCertDropdown, setShowCertDropdown] = useState(false);
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
    const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
    const [showDiscountDrawer, setShowDiscountDrawer] = useState(false);
    const [variants, setVariants] = useState<Variant[]>([]);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const materialDropdownRef = useRef<HTMLDivElement>(null);
    const brochureInputRef = useRef<HTMLInputElement>(null);

    const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

    const API_BASE_URL = "https://api-test-aggreator.tiameds.ai/api/v1/masters";

    const consumableDeviceSchema = ConsumableDeviceSchema;

    // Fetch device categories filtered by deviceType
    const fetchDeviceCategories = useCallback(async () => {
      setLoadingCategories(true);
      setApiError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/device-categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.data || []);

        if (items.length > 0) {
          const filtered = items.filter((item: ApiMasterData) => {
            const catType = (item.deviceCategoryType || "").toLowerCase();
            return catType === deviceType;
          });

          const options = filtered.map((item: ApiMasterData) => ({
            value: String(item.deviceCatId || item.id || ""),
            label: String(item.deviceName || item.name || "Unknown"),
          })).filter((opt: SelectOption) => opt.value && opt.label);

          setDeviceCategoryOptions(options);
        } else {
          setDeviceCategoryOptions([]);
        }
      } catch (error) {
        setApiError(`Failed to load device categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setDeviceCategoryOptions([]);
      } finally {
        setLoadingCategories(false);
      }
    }, [deviceType]);

    const fetchDeviceSubCategories = useCallback(async (categoryId: string) => {
      if (!categoryId) { setDeviceSubCategoryOptions([]); return; }
      setLoadingSubCategories(true);
      try {
        const response = await fetch(`${API_BASE_URL}/device-sub-categories/${categoryId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const options = items.map((item: ApiMasterData) => ({
          value: String(item.deviceSubCatId || item.subCategoryId || item.id || ""),
          label: String(item.deviceSubCatName || item.subCategoryName || item.name || "Unknown"),
        })).filter((opt: SelectOption) => opt.value && opt.label);
        setDeviceSubCategoryOptions(options);
      } catch (error) {
        setDeviceSubCategoryOptions([]);
        setApiError(`Failed to load sub-categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoadingSubCategories(false);
      }
    }, []);

    const fetchMaterialTypes = useCallback(async () => {
      setLoadingMaterialTypes(true);
      try {
        const response = await fetch(`${API_BASE_URL}/material-types`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const options = items.map((item: ApiMasterData) => ({
          value: String(item.materialTypeId || item.id || ""),
          label: String(item.materialTypeName || item.name || "Unknown"),
        })).filter((opt: SelectOption) => opt.value && opt.label);
        setMaterialTypeOptions(options);
      } catch { setMaterialTypeOptions([]); }
      finally { setLoadingMaterialTypes(false); }
    }, []);

    const fetchCountries = useCallback(async () => {
      setLoadingCountries(true);
      try {
        const response = await fetch(`${API_BASE_URL}/countries`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const options = items.map((item: ApiMasterData) => ({
          value: String(item.countryId || item.id || ""),
          label: String(item.countryName || item.name || "Unknown"),
        })).filter((opt: SelectOption) => opt.value && opt.label);
        setCountryOptions(options);
      } catch { setCountryOptions([]); }
      finally { setLoadingCountries(false); }
    }, []);

    const fetchStorageConditions = useCallback(async () => {
      setLoadingStorage(true);
      try {
        const response = await fetch(`${API_BASE_URL}/storagecondition`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        const options = items.map((item: ApiMasterData) => ({
          value: String(item.storageConditionId || item.id || ""),
          label: String(item.conditionName || item.name || "Unknown"),
        })).filter((opt: SelectOption) => opt.value && opt.label);
        setStorageConditionOptions(options);
      } catch { setStorageConditionOptions([]); }
      finally { setLoadingStorage(false); }
    }, []);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowCertDropdown(false);
        if (materialDropdownRef.current && !materialDropdownRef.current.contains(event.target as Node)) setShowMaterialDropdown(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      fetchDeviceCategories();
      fetchMaterialTypes();
      fetchCountries();
      fetchStorageConditions();
    }, [fetchDeviceCategories, fetchMaterialTypes, fetchCountries, fetchStorageConditions]);

    // Reset category when deviceType changes
    useEffect(() => {
      setForm(prev => ({ ...prev, deviceCategoryId: "", deviceSubCategoryId: "" }));
      setDeviceSubCategoryOptions([]);
    }, [deviceType]);

    useEffect(() => {
      if (form.deviceCategoryId) {
        fetchDeviceSubCategories(form.deviceCategoryId);
      } else {
        setDeviceSubCategoryOptions([]);
        setForm(prev => ({ ...prev, deviceSubCategoryId: "" }));
      }
    }, [form.deviceCategoryId, fetchDeviceSubCategories]);

    const handleAddVariant = (variantData: Omit<Variant, 'id'>) => {
  const newVariant = {
    id: Date.now().toString(),
    ...variantData
  } as Variant;
  setVariants([...variants, newVariant]);
};

    const handleEditVariant = (variant: Variant) => {
    setVariants((prev) => prev.map((v) => v.id === variant.id ? variant : v));
  };

    const handleDeleteVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        setForm({ ...form, [name]: checked });
      } else {
        setForm({ ...form, [name]: value });
      }
    };

    const handleSelectChange = (field: string, selected: SelectOption | null) => {
      setForm({ ...form, [field]: selected ? selected.value : "" });
    };

    const handleCertificationCheckboxChange = (option: typeof certificationOptions[0]) => {
      const isChecked = selectedCertifications.some(c => c.id === option.value);
      if (isChecked) {
        setSelectedCertifications(prev => prev.filter(c => c.id !== option.value));
      } else {
        setSelectedCertifications(prev => [...prev, {
          id: option.value,
          label: option.label,
          tagCode: option.tagCode,
          file: null,
          fileName: "",
          uploading: false,
          isUploaded: false,
          previewUrl: null,
        }]);
      }
    };

    const handleMaterialCheckboxChange = (option: SelectOption) => {
      const isChecked = selectedMaterialTypes.includes(option.value);
      if (isChecked) {
        const updated = selectedMaterialTypes.filter(v => v !== option.value);
        setSelectedMaterialTypes(updated);
        setForm({ ...form, materialType: updated.join(", ") });
      } else {
        const updated = [...selectedMaterialTypes, option.value];
        setSelectedMaterialTypes(updated);
        setForm({ ...form, materialType: updated.join(", ") });
      }
    };

    const handleTagClick = (certId: string) => {
      const inputElement = document.getElementById(`cert-upload-${certId}`);
      if (inputElement) inputElement.click();
    };

    const handleRemoveTag = (certId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedCertifications(prev => prev.filter(cert => cert.id !== certId));
    };

    const handleCertificationFileUpload = async (certId: string, file: File) => {
      setSelectedCertifications(prev =>
        prev.map(cert => cert.id === certId ? { ...cert, uploading: true } : cert)
      );
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        setSelectedCertifications(prev =>
          prev.map(cert => cert.id === certId
            ? { ...cert, file, fileName: file.name, uploading: false, isUploaded: true, previewUrl }
            : cert
          )
        );
      } catch (error) {
        console.error("Upload failed:", error);
        setSelectedCertifications(prev =>
          prev.map(cert => cert.id === certId ? { ...cert, uploading: false } : cert)
        );
      }
    };

    const handleBrochureUpload = async (file: File) => {
      setUploadingBrochure(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setBrochureFile(file);
      } catch (error) {
        console.error("Brochure upload failed:", error);
      } finally {
        setUploadingBrochure(false);
      }
    };

    const handleBrochureChange = () => {
      brochureInputRef.current?.click();
    };

    const handleRemoveBrochure = () => {
      setBrochureFile(null);
      if (brochureInputRef.current) brochureInputRef.current.value = "";
    };

    const calculatePackSize = useCallback(() => {
      const units = parseFloat(form.unitsPerPack);
      const packs = parseFloat(form.numberOfPacks);
      if (!isNaN(units) && !isNaN(packs)) {
        setForm(prev => ({ ...prev, packSize: (units * packs).toString() }));
      }
    }, [form.unitsPerPack, form.numberOfPacks]);

    const calculateFinalPrice = useCallback(() => {
      const sellingPrice = parseFloat(form.sellingPricePerPack);
      const discountValue = parseFloat(form.discountPercentage);
      if (isNaN(sellingPrice)) return "0.00";
      let price = sellingPrice;
      if (!isNaN(discountValue)) price = price - (price * discountValue) / 100;
      return price.toFixed(2);
    }, [form.sellingPricePerPack, form.discountPercentage]);

    useEffect(() => { calculatePackSize(); }, [calculatePackSize]);
    useEffect(() => {
      const finalPrice = calculateFinalPrice();
      setForm(prev => ({ ...prev, finalPrice }));
    }, [calculateFinalPrice]);

    const validateForm = (): Record<string, string> => {
      const newErrors: Record<string, string> = {};
      try {
        consumableDeviceSchema.parse({
          productName: form.productName,
          deviceCategoryId: form.deviceCategoryId,
          brandName: form.brandName,
          materialType: form.materialType,
          sizeDimension: form.sizeDimension,
          sterileStatus: form.sterileStatus,
          disposableType: form.disposableType,
          shelfLife: form.shelfLife,
          intendedUse: form.intendedUse,
          keyFeatures: form.keyFeatures,
          safetyInstructions: form.safetyInstructions,
          certifications: selectedCertifications.map(c => c.label).join(", "),
          cdscoNumber: form.cdscoNumber,
          iso13485: form.iso13485,
          ce: form.ce,
          bis: form.bis,
          countryOfOrigin: form.countryOfOrigin,
          manufacturerName: form.manufacturerName,
          productDescription: form.productDescription,
          storageCondition: form.storageCondition,
          productBrochureUrl: form.brochureUrl,
          packType: form.packType,
          unitsPerPack: form.unitsPerPack,
          numberOfPacks: form.numberOfPacks,
          packSize: form.packSize,
          minimumOrderQuantity: form.minimumOrderQuantity,
          maximumOrderQuantity: form.maximumOrderQuantity,
          batchLotNumber: form.batchLotNumber,
          manufacturingDate: form.manufacturingDate,
          expiryDate: form.expiryDate,
          stockQuantity: form.stockQuantity,
          dateOfStockEntry: form.dateOfStockEntry,
          sellingPricePerPack: form.sellingPricePerPack,
          mrp: form.mrp,
          discountPercentage: form.discountPercentage,
          additionalDiscount: form.additionalDiscountValue,
          minimumPurchaseQuantity: form.minimumOrderQuantity,
          additionalDiscountPercentage: "",
          effectiveStartDate: null,
          effectiveStartTime: "",
          effectiveEndDate: null,
          effectiveEndTime: "",
          gstPercentage: form.gstPercentage,
          finalPrice: form.finalPrice,
          hsnCode: form.hsnCode,
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          err.issues.forEach((error: z.ZodIssue) => {
            newErrors[error.path.join(".")] = error.message;
          });
        }
      }
      if (!form.deviceSubCategoryId) newErrors.deviceSubCategoryId = "Device sub-category is required";
      if (selectedMaterialTypes.length === 0) newErrors.materialType = "At least one material type must be selected";
      if (selectedCertifications.length === 0) newErrors.certifications = "At least one certification is required";
      if (!form.deviceClass) newErrors.deviceClass = "Device class is required";
      if (images.length === 0) newErrors.images = "At least 1 product image is required";
      if (images.length > 5) newErrors.images = "Maximum 5 product images allowed";
      if (form.manufacturingDate && form.expiryDate && form.expiryDate <= form.manufacturingDate)
        newErrors.expiryDate = "Expiry date must be after manufacturing date";
      const minQty = parseFloat(form.minimumOrderQuantity);
      const maxQty = parseFloat(form.maximumOrderQuantity);
      if (!isNaN(minQty) && !isNaN(maxQty) && maxQty < minQty)
        newErrors.maximumOrderQuantity = "Maximum order quantity must be greater than minimum";
      return newErrors;
    };

    const handleSubmit = async () => {
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        alert("Please fix all validation errors before submitting");
        return;
      }
      setErrors({});
      try {
        const formData = new FormData();
        Object.keys(form).forEach(key => {
          const value = form[key as keyof typeof form];
          if (value !== null && value !== undefined) {
            if (value instanceof Date) formData.append(key, value.toISOString());
            else formData.append(key, String(value));
          }
        });
        selectedMaterialTypes.forEach(type => formData.append("materialTypes[]", type));
        selectedCertifications.forEach(cert => {
          formData.append("certifications[]", cert.label);
          if (cert.file) formData.append(`certification_${cert.id}`, cert.file);
        });
        images.forEach((image, index) => formData.append(`product_images_${index}`, image));
        if (brochureFile) formData.append("brochure", brochureFile);
        formData.append("variants", JSON.stringify(variants));
        alert("Consumable device created successfully!");
      } catch (err) {
        console.error("Submit Error:", err);
        alert("Failed to create consumable device");
      }
    };

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
      colors: { ...theme.colors, primary: "#4B0082", primary25: "#F3E8FF", primary50: "#E9D5FF" },
    });

    const getFileIcon = (fileName: string) => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return '📄';
      if (['jpg', 'jpeg', 'png'].includes(ext || '')) return '🖼️';
      return '📎';
    };

    return (
      <div className="flex flex-col gap-5 max-w-full mx-auto">
        {apiError && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-2">
            <p className="text-red-800 text-sm font-semibold">⚠️ API Error:</p>
            <p className="text-red-700 text-xs">{apiError}</p>
            <button
              onClick={() => { fetchDeviceCategories(); fetchMaterialTypes(); fetchCountries(); fetchStorageConditions(); }}
              className="mt-2 text-xs text-red-600 underline"
            >Retry</button>
          </div>
        )}

        {/* Product Details Section */}
        <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
          <div className="text-h3 font-semibold mb-3">Product Details</div>
          <div className="border-b border-neutral-200"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-8 gap-y-4">
            <Input label="Product Name" name="productName" placeholder="e.g., Surgical Mask" onChange={handleChange} value={form.productName} error={errors.productName} required />

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Device Category <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={deviceCategoryOptions}
                isLoading={loadingCategories}
                value={deviceCategoryOptions.find(o => o.value === form.deviceCategoryId) || null}
                onChange={selected => handleSelectChange("deviceCategoryId", selected)}
                placeholder={loadingCategories ? "Loading..." : `Select ${deviceType} category`}
                theme={selectTheme}
                styles={selectStyles("deviceCategoryId")}
                noOptionsMessage={() => loadingCategories ? "Loading..." : `No ${deviceType} categories available`}
              />
              {errors.deviceCategoryId && <p className="text-red-500 text-sm mt-1">{errors.deviceCategoryId}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Device Sub-Category <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={deviceSubCategoryOptions}
                isLoading={loadingSubCategories}
                isDisabled={!form.deviceCategoryId}
                value={deviceSubCategoryOptions.find(o => o.value === form.deviceSubCategoryId) || null}
                onChange={selected => handleSelectChange("deviceSubCategoryId", selected)}
                placeholder={form.deviceCategoryId ? (loadingSubCategories ? "Loading..." : "Select sub-category") : "Select category first"}
                theme={selectTheme}
                styles={selectStyles("deviceSubCategoryId")}
                noOptionsMessage={() => loadingSubCategories ? "Loading..." : "No sub-categories available"}
              />
              {errors.deviceSubCategoryId && <p className="text-red-500 text-sm mt-1">{errors.deviceSubCategoryId}</p>}
            </div>

            <Input label="Brand / Model Name" name="brandName" placeholder="e.g., 3M, Johnson & Johnson" onChange={handleChange} value={form.brandName} error={errors.brandName} required />

            {/* Material Type */}
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Material Type <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <div className="relative" ref={materialDropdownRef}>
                <div
                  onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
                  className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${errors.materialType ? "border-red-500" : "border-neutral-300"}`}
                >
                  <span className="text-sm text-neutral-700 truncate pr-2">
                    {selectedMaterialTypes.length > 0
                      ? selectedMaterialTypes.map(val => materialTypeOptions.find(o => o.value === val)?.label).join(", ")
                      : "Select material types"}
                  </span>
                  <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${showMaterialDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {showMaterialDropdown && (
                  <div className="absolute z-10 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                    {loadingMaterialTypes ? (
                      <div className="px-4 py-2 text-gray-500">Loading...</div>
                    ) : materialTypeOptions.length > 0 ? materialTypeOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer">
                        <input type="checkbox" checked={selectedMaterialTypes.includes(option.value)} onChange={() => handleMaterialCheckboxChange(option)} className="accent-purple-600" />
                        <span>{option.label}</span>
                      </label>
                    )) : <div className="px-4 py-2 text-gray-500">No material types available</div>}
                  </div>
                )}
              </div>
              {errors.materialType && <p className="text-red-500 text-sm mt-1">{errors.materialType}</p>}
            </div>

            <Input label="Size / Dimension / Gauge" name="sizeDimension" placeholder="e.g., Size M, 22G, 10cm x 10cm" onChange={handleChange} value={form.sizeDimension} error={errors.sizeDimension} required />

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Sterile / Non-Sterile <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <div className="flex gap-6 mt-4">
                {sterileOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="sterileStatus" value={option.value} checked={form.sterileStatus === option.value} onChange={handleChange} className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0" />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.sterileStatus && <p className="text-red-500 text-sm">{errors.sterileStatus}</p>}
            </div>

            <Input label="Shelf Life" name="shelfLife" placeholder="e.g., 3 years, 24 months" onChange={handleChange} value={form.shelfLife} error={errors.shelfLife} required />

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Disposable / Reusable <span className="text-warning-500 ml-1">*</span>
              </label>
              <div className="flex gap-6 mt-4">
                {disposableOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="disposableType" value={option.value} checked={form.disposableType === option.value} onChange={handleChange} className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0" />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.disposableType && <p className="text-red-500 text-sm">{errors.disposableType}</p>}
            </div>

            {/* Certifications Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                    Certifications / Compliance <span className="text-warning-500 ml-1">*</span>
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <div
                      onClick={() => setShowCertDropdown(!showCertDropdown)}
                      className={`w-full h-14 px-4 border rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors ${errors.certifications ? "border-red-500" : "border-neutral-300"}`}
                    >
                      <span className="text-sm text-neutral-700 truncate pr-2">
                        {selectedCertifications.length > 0 ? selectedCertifications.map(c => c.label).join(", ") : "Select certifications"}
                      </span>
                      <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${showCertDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {showCertDropdown && (
                      <div className="absolute z-10 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                        {certificationOptions.map(option => (
                          <label key={option.value} className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer">
                            <input type="checkbox" checked={selectedCertifications.some(c => c.id === option.value)} onChange={() => handleCertificationCheckboxChange(option)} className="accent-purple-600" />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.certifications && <p className="text-red-500 text-sm mt-1">{errors.certifications}</p>}
                </div>

                {/* Upload Documents with preview */}
                <div>
                  <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                    Upload Documents <span className="text-warning-500 ml-1">*</span>
                  </label>
                  {selectedCertifications.length === 0 ? (
                    <div className={`w-full border rounded-xl flex items-center h-14 overflow-hidden ${errors.certifications ? "border-red-500" : "border-neutral-300"}`}>
                      <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center flex-shrink-0">
                        <Upload size={18} className="text-purple-700" />
                      </div>
                      <span className="text-gray-400 text-sm px-3">Select certifications first</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedCertifications.map(cert => (
                        <div key={cert.id} className={`w-full border rounded-xl flex items-center overflow-hidden h-12 transition-all ${cert.isUploaded ? "border-green-300 bg-green-50" : "border-neutral-300"}`}>
                          <button
                            type="button"
                            onClick={() => handleTagClick(cert.id)}
                            className="w-10 h-full bg-[#DED0FE] hover:bg-[#c9b4fe] transition flex items-center justify-center flex-shrink-0"
                            title="Upload file"
                          >
                            {cert.uploading ? (
                              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            ) : cert.isUploaded ? (
                              <RefreshCw size={15} className="text-purple-700" />
                            ) : (
                              <Upload size={15} className="text-purple-700" />
                            )}
                          </button>

                          <div className="flex items-center justify-between flex-1 px-3 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-semibold text-purple-700 flex-shrink-0">{cert.tagCode}</span>
                              <span className="text-xs text-neutral-500 truncate">{cert.label}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {cert.isUploaded && cert.fileName && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">{getFileIcon(cert.fileName)}</span>
                                  <span className="text-xs text-green-700 font-medium max-w-[100px] truncate">{cert.fileName}</span>
                                  {cert.previewUrl && (
                                    <a href={cert.previewUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-purple-600 hover:text-purple-800">
                                      <Eye size={14} />
                                    </a>
                                  )}
                                </div>
                              )}
                              <button onClick={e => handleRemoveTag(cert.id, e)} className="ml-1 hover:text-red-600 text-neutral-400 transition">
                                <X size={14} />
                              </button>
                            </div>
                          </div>

                          <input
                            id={`cert-upload-${cert.id}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) handleCertificationFileUpload(cert.id, e.target.files[0]);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Input label="Intended Use / Purpose" name="intendedUse" placeholder="e.g., For surgical procedures, wound care" onChange={handleChange} value={form.intendedUse} error={errors.intendedUse} required />

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Country of Origin <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={countryOptions}
                isLoading={loadingCountries}
                value={countryOptions.find(o => o.value === form.countryOfOrigin) || null}
                onChange={selected => handleSelectChange("countryOfOrigin", selected)}
                placeholder={loadingCountries ? "Loading..." : "Select country"}
                theme={selectTheme}
                styles={selectStyles("countryOfOrigin")}
                noOptionsMessage={() => loadingCountries ? "Loading..." : "No countries available"}
              />
              {errors.countryOfOrigin && <p className="text-red-500 text-sm mt-1">{errors.countryOfOrigin}</p>}
            </div>

            <Input label="Manufacturer Name" name="manufacturerName" placeholder="Manufacturer company name" onChange={handleChange} value={form.manufacturerName} error={errors.manufacturerName} required />

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Storage Condition <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={storageConditionOptions}
                isLoading={loadingStorage}
                value={storageConditionOptions.find(o => o.value === form.storageCondition) || null}
                onChange={selected => handleSelectChange("storageCondition", selected)}
                placeholder={loadingStorage ? "Loading..." : "Select storage condition"}
                theme={selectTheme}
                styles={selectStyles("storageCondition")}
                noOptionsMessage={() => loadingStorage ? "Loading..." : "No storage conditions available"}
              />
              {errors.storageCondition && <p className="text-red-500 text-sm mt-1">{errors.storageCondition}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Device Class (A / B / C / D) <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={deviceClassOptions}
                value={deviceClassOptions.find(o => o.value === form.deviceClass) || null}
                onChange={selected => handleSelectChange("deviceClass", selected)}
                placeholder="Select device class"
                theme={selectTheme}
                styles={selectStyles("deviceClass")}
              />
              {errors.deviceClass && <p className="text-red-500 text-sm mt-1">{errors.deviceClass}</p>}
            </div>

            {/* Brochure Upload — doc only, with preview & change */}
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
                    {uploadingBrochure ? "Uploading..." : "Upload PDF / Doc"}
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
                    <button
                      type="button"
                      onClick={handleBrochureChange}
                      className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-700 transition"
                      title="Change file"
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveBrochure}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"
                      title="Remove file"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )}
              <input
                ref={brochureInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) handleBrochureUpload(e.target.files[0]);
                }}
              />
            </div>

            {/* Key Features and Safety Instructions */}
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                    Safety Instructions / Precautions <span className="text-warning-500 font-semibold ml-1">*</span>
                  </label>
                  <textarea
                    name="safetyInstructions"
                    placeholder="Enter safety warnings, precautions, and handling instructions"
                    value={form.safetyInstructions}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${errors.safetyInstructions ? "border-[#FF3B3B] focus:border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`}
                  />
                  {errors.safetyInstructions && <p className="text-red-500 text-sm mt-1">{errors.safetyInstructions}</p>}
                </div>
                <div>
                  <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                    Key Features / Specifications <span className="text-warning-500 font-semibold ml-1">*</span>
                  </label>
                  <textarea
                    name="keyFeatures"
                    placeholder="List key features, specifications, and unique selling points"
                    value={form.keyFeatures}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${errors.keyFeatures ? "border-[#FF3B3B] focus:border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`}
                  />
                  {errors.keyFeatures && <p className="text-red-500 text-sm mt-1">{errors.keyFeatures}</p>}
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                Product Description <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <textarea
                name="productDescription"
                placeholder="Detailed product description, indications, and usage"
                value={form.productDescription}
                onChange={handleChange}
                rows={4}
                className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${errors.productDescription ? "border-[#FF3B3B] focus:border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`}
              />
              {errors.productDescription && <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>}
            </div>
          </div>
        </div>

        {/* Packaging & Order Details Section */}
        <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
          <div className="text-h3 font-semibold mb-3">Packaging & Order Details</div>
          <div className="border-b border-neutral-200"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-8">
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Pack Type <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={packTypeOptions}
                value={packTypeOptions.find(o => o.value === form.packType) || null}
                onChange={selected => handleSelectChange("packType", selected)}
                placeholder="Select pack type"
                theme={selectTheme}
                styles={selectStyles("packType")}
              />
              {errors.packType && <p className="text-red-500 text-sm mt-1">{errors.packType}</p>}
            </div>
            <Input label="Number of Units per Pack Type" name="unitsPerPack" placeholder="e.g., 100 gloves, 50 syringes" onChange={handleChange} value={form.unitsPerPack} error={errors.unitsPerPack} required />
            <Input label="Number of Packs" name="numberOfPacks" placeholder="Number of packs in order" onChange={handleChange} value={form.numberOfPacks} error={errors.numberOfPacks} required />
            <Input label="Pack Size (No. of packs X No. of Units per pack type)" name="packSize" value={form.packSize} disabled={true} required />
          </div>

          <div className="mb-4">
            <div className="text-h6 text-neutral-900 font-regular mb-2">Order Details</div>
            <div className="border-b border-neutral-200"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input label="Min Order Qty" name="minimumOrderQuantity" placeholder="Minimum quantity per order" onChange={handleChange} value={form.minimumOrderQuantity} error={errors.minimumOrderQuantity} required />
            <Input label="Max Order Qty" name="maximumOrderQuantity" placeholder="Maximum quantity per order" onChange={handleChange} value={form.maximumOrderQuantity} error={errors.maximumOrderQuantity} required />
          </div>

          <div className="mb-4">
            <div className="text-h6 text-neutral-900 font-regular mb-2">Batch Management</div>
            <div className="border-b border-neutral-200"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input label="Batch / Lot Number" name="batchLotNumber" placeholder="Enter batch number" onChange={handleChange} value={form.batchLotNumber} error={errors.batchLotNumber} required />
            <Input label="Manufacturing Date" type="date" name="manufacturingDate" onChange={e => setForm({ ...form, manufacturingDate: e.target.value ? new Date(e.target.value) : null })} value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""} error={errors.manufacturingDate} required />
            <Input label="Expiry Date" type="date" name="expiryDate" onChange={e => setForm({ ...form, expiryDate: e.target.value ? new Date(e.target.value) : null })} value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""} error={errors.expiryDate} required />
            <Input label="Stock Quantity (Numbers w.r.t pack size)" name="stockQuantity" placeholder="Number of packs in stock" onChange={handleChange} value={form.stockQuantity} error={errors.stockQuantity} required />
            <Input label="Date of Entry" type="date" name="dateOfStockEntry" onChange={e => setForm({ ...form, dateOfStockEntry: e.target.value ? new Date(e.target.value) : new Date() })} value={form.dateOfStockEntry ? form.dateOfStockEntry.toISOString().split("T")[0] : ""} />
          </div>

          <div className="mb-4">
            <div className="text-h6 text-neutral-900 font-regular mb-2">Pricing</div>
            <div className="border-b border-neutral-200"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input label="MRP" name="mrp" placeholder="Maximum Retail Price" onChange={handleChange} value={form.mrp} error={errors.mrp} required />
            <Input label="Selling Price (per Pack Size)" name="sellingPricePerPack" placeholder="Selling price per pack" onChange={handleChange} value={form.sellingPricePerPack} error={errors.sellingPricePerPack} required />
            <Input label="Discount Percentage" name="discountPercentage" placeholder="e.g., 10" onChange={handleChange} value={form.discountPercentage} error={errors.discountPercentage} />
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 font-semibold opacity-0">Hidden Label</label>
              <button onClick={() => setShowDiscountDrawer(true)} className="px-4 py-2 h-14 bg-[#9F75FC] text-white rounded-xl font-semibold transition w-1/2">
                + Add Additional Discount
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-h6 text-neutral-900 font-regular mb-2">TAX & BILLING</div>
            <div className="border-b border-neutral-200"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                GST % <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={gstOptions}
                value={gstOptions.find(o => o.value === form.gstPercentage) || null}
                onChange={selected => handleSelectChange("gstPercentage", selected)}
                placeholder="Select GST"
                theme={selectTheme}
                styles={selectStyles("gstPercentage")}
              />
              {errors.gstPercentage && <p className="text-red-500 text-sm mt-1">{errors.gstPercentage}</p>}
            </div>
            <Input label="HSN Code" name="hsnCode" placeholder="HSN Code" onChange={handleChange} value={form.hsnCode} error={errors.hsnCode} required />
          </div>

          <div className="mb-6">
            <label className="block text-label-l3 text-primary-1000 font-semibold mb-1">Final Price (after discounts):</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-700 text-p4 font-regular">₹</span>
              <input
                type="text"
                name="finalPrice"
                value={`${form.finalPrice || "0.00"}`}
                disabled
                className="w-full h-12 pl-8 pr-4 text-p4 rounded-xl border-2 border-[#C4AAFD] bg-[#F8F5FF] text-primary-700 font-regular focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-6 py-2 bg-[#9F75FC] text-white rounded-lg font-semibold hover:bg-purple-700 transition">Save</button>
          </div>
        </div>

        <VariantList 
    variants={variants} 
    onAdd={handleAddVariant} 
    onEdit={handleEditVariant} 
    onDelete={handleDeleteVariant} 
  />

        {/* Product Photos Section */}
        <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
          <div className="text-p3 text-neutral-900 font-semibold mb-2">
            Product Photos <span className="text-warning-500">*</span>
          </div>
          <div
            className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input id="fileInput" type="file" multiple accept="image/*" className="hidden" onChange={e => {
              if (e.target.files) {
                const files = Array.from(e.target.files);
                if (files.length > 5) { alert("Maximum 5 images allowed"); return; }
                setImages(files);
              }
            }} />
            <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
              <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Image src="/icons/FolderIcon.svg" alt="upload" width={40} height={40} className="rounded-md object-cover" />
                  <div className="text-label-l2 font-normal mt-4">Choose a file or drag & drop it here</div>
                  <div className="text-label-l1 font-normal text-neutral-400">Upload product images (JPEG, PNG) - Max 5 images</div>
                </div>
              </div>
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
          {images.length > 0 && <div className="mt-2 text-green-600 text-sm">✅ {images.length} image(s) added successfully</div>}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {images.map((file, index) => (
                <div key={index} className="relative">
                  <Image src={URL.createObjectURL(file)} alt="preview" width={100} height={96} className="w-full h-24 object-cover rounded-md border" />
                  <button onClick={() => setImages(images.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded hover:bg-red-600 transition">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pb-8">
          <div className="flex gap-4 justify-center sm:justify-start">
            <button onClick={() => window.location.reload()} className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer hover:bg-red-50 transition">Cancel</button>
            <button className="px-6 py-2 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition">
              <Image src="/icons/SaveDraftIcon.svg" alt="draft" width={20} height={20} className="rounded-md object-cover" />
              Save Draft
            </button>
          </div>
          <div className="flex justify-center sm:justify-end">
            <button type="button" onClick={handleSubmit} className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800 transition">Submit</button>
          </div>
        </div>

        {showDiscountDrawer && (
          <Drawer setShowDrawer={setShowDiscountDrawer} title="Additional Discount">
            <AdditionalDiscount />
          </Drawer>
        )}
      </div>
    );
  };

  export default ConsumableForm;