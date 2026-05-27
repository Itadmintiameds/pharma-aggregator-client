"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/app/commonComponents/Input";
import UploadInput from "../commonComponent/UploadInput";
import PopupModal from "../commonComponent/PopupModal";
import { foodInfantSchema } from "@/src/schema/product/FoodandInfantSchema";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import {
  getProductById,
  updateProduct,
  uploadProductImages,
} from "@/src/services/product/ProductService";
import {
  getProductCategories,
  getProductSubcategories,
  getAgeGroups,
  getProductForms,
  getCountries,
  getStorageConditionsByCategory,
  getPackTypesByCategory,
  getCertificationsByCategoryId,
  uploadFoodInfantUserManual,
  createFoodInfantProduct,
  getFoodInfantAttributes,
  uploadNutritionalInformationImage,
  getNetQuantityUnits,
  getServingSizeUnits,
} from "@/src/services/product/FoodInfantService";

import AdditionalDiscountType from "./AdditionalDiscountType";
import CommonModal from "../commonComponent/CommonModal";
import MonthPicker from "@/src/app/commonComponents/MonthPicker";
import ProductImageUpload from "../commonComponent/ProductImageUpload";

import {
  CreateProductRequest,
  PackagingData,
  PricingData,
  AdditionalDiscountData,
  SpecialSchemesData,
} from "@/src/types/product/ProductData";

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
  existingUrl?: string;
}

interface FoodInfantFormProps {
  mode?: "create" | "edit";
  productId?: string;
}

// Hardcoded GST options
const gstOptions = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
];

const dietaryOptions = [
  { value: "veg", label: "Veg" },
  { value: "non-veg", label: "Non-veg" },
];

const nutritionalInfoOptions = [
  { value: "as-per-label", label: "As per the label" },
  { value: "image-upload", label: "Image upload" },
];

// Styles
const fieldLabel = "font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle text-pneutral-900";
const requiredStar = <span className="text-warning-500 font-semibold ml-1">*</span>;
const errorMsg = "font-heading font-normal text-sm leading-[28px] px-1 text-warning-500";

// Helper to extract unit string from API response
const extractUnitString = (item: any): string => {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";

  if (typeof item.unitName === "string" && item.unitName.trim()) return item.unitName.trim();
  if (typeof item.name === "string" && item.name.trim()) return item.name.trim();
  if (typeof item.netQuantityUnitName === "string" && item.netQuantityUnitName.trim()) return item.netQuantityUnitName.trim();
  if (typeof item.servingSizeUnitName === "string" && item.servingSizeUnitName.trim()) return item.servingSizeUnitName.trim();
  if (typeof item.unit === "string" && item.unit.trim()) return item.unit.trim();
  if (typeof item.label === "string" && item.label.trim()) return item.label.trim();
  if (typeof item.unitSymbol === "string" && item.unitSymbol.trim()) return item.unitSymbol.trim();
  
  const nestedUnit = item.netQuantityUnit || item.servingSizeUnit || item.unit;
  if (nestedUnit && typeof nestedUnit === "object") {
    if (typeof nestedUnit.unitName === "string" && nestedUnit.unitName.trim()) return nestedUnit.unitName.trim();
    if (typeof nestedUnit.name === "string" && nestedUnit.name.trim()) return nestedUnit.name.trim();
    if (typeof nestedUnit.unitSymbol === "string" && nestedUnit.unitSymbol.trim()) return nestedUnit.unitSymbol.trim();
  }

  for (const key of Object.keys(item)) {
    const val = item[key];
    if (typeof val === "string" && val.trim().length > 0 && isNaN(Number(val))) {
      return val.trim();
    }
  }
  return "";
};

// ─── Numeric Input with Unit Component ───────────────────────────────────
interface NumericInputWithUnitProps {
  label: string;
  name: string;
  value: string;
  unit: string;
  onValueChange: (val: string) => void;
  onUnitChange: (unit: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  options: SelectOption[];
  loading?: boolean;
}

const NumericInputWithUnit: React.FC<NumericInputWithUnitProps> = ({
  label,
  name,
  value,
  unit,
  onValueChange,
  onUnitChange,
  placeholder = "",
  error,
  required = false,
  disabled = false,
  readOnly = false,
  options,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      onValueChange(val);
    }
  };

  const getBorderColor = () => {
    if (disabled) return "border-pneutral-300 bg-sneutral-100 cursor-not-allowed";
    if (readOnly) return "border-pneutral-300 bg-pneutral-50 cursor-default";
    if (error) return "border-warning-500 focus-within:ring-1 focus-within:ring-warning-500 focus-within:border-warning-500";
    return "border-pneutral-300 focus-within:border-secondary-300 focus-within:ring-1 focus-within:ring-secondary-300";
  };

  const selectedUnitLabel = options.find(opt => opt.value === unit)?.label || unit;

  return (
    <div ref={containerRef} className="flex flex-col gap-0 w-full relative">
      <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${disabled ? "text-pneutral-500" : "text-pneutral-900"}`}>
        {label}
        {required && <span className="text-warning-500 ml-1">*</span>}
      </label>

      <div className={`flex items-center h-[52px] w-full border rounded-lg bg-white overflow-hidden transition-all duration-200 ${getBorderColor()}`}>
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          disabled={disabled || readOnly}
          className="flex-1 h-full px-4 text-base outline-none border-none bg-transparent text-pneutral-800 placeholder:text-pneutral-500"
        />

        <div className="h-full border-l border-neutral-300"></div>

        <button
          type="button"
          disabled={disabled || readOnly || loading}
          onClick={() => !disabled && !readOnly && !loading && setIsOpen(!isOpen)}
          className="w-[149px] h-full px-3 bg-pneutral-50 flex items-center justify-between gap-1 transition-colors hover:bg-neutral-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={unit ? "text-pneutral-800" : "text-pneutral-500"} style={{ fontWeight: 400, fontSize: "16px", lineHeight: "24px" }}>
            {loading ? "Loading..." : (selectedUnitLabel || "Select Unit")}
          </span>
          <svg className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+4px)] w-[149px] max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onUnitChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm text-pneutral-800 hover:bg-pneutral-50 transition-colors cursor-pointer font-medium ${unit === opt.value ? "bg-neutral-50 font-semibold" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="font-heading font-normal text-sm leading-[28px] px-1 text-warning-500 mt-1">{error}</p>}
    </div>
  );
};

// ─── Serving Size Disabled Component ───────────────────────────────────
const ServingSizeDisabled: React.FC<{ label: string; required?: boolean }> = ({ label, required = false }) => {
  return (
    <div className="flex flex-col gap-0 w-full">
      <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle text-pneutral-900`}>
        {label}
        {required && <span className="text-warning-500 ml-1">*</span>}
      </label>
      <div className="flex items-center h-[52px] w-full border rounded-lg bg-pneutral-50 border-pneutral-300 cursor-default">
        <div className="flex-1 h-full px-4 flex items-center text-pneutral-500">
          As prescribed by Doctor
        </div>
      </div>
    </div>
  );
};

const FoodInfantForm: React.FC<FoodInfantFormProps> = ({ mode = "create", productId }) => {
  const router = useRouter();
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef = (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const isEditMode = mode === "edit";
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  const categoryId = 3;

  // Month picker states
  const [showManufacturingMonthPicker, setShowManufacturingMonthPicker] = useState(false);
  const [showExpiryMonthPicker, setShowExpiryMonthPicker] = useState(false);

  // ---------- Form state ----------
  const [form, setForm] = useState({
    productName: "",
    productDescription: "",
    warningsPrecautions: "",
    productCategory: "",
    productCategoryName: "",
    productSubcategory: "",
    productSubcategoryName: "",
    brandName: "",
    variantName: "",
    productForm: "",
    netQuantityValue: "",
    netQuantityUnit: "",
    netQuantityUnitId: 0,
    // Serving size is disabled - not required
    servingSizeValue: "",
    servingSizeUnit: "",
    servingSizeUnitId: 0,
    ageGroup: [] as string[],
    dietaryClassification: "" as "veg" | "non-veg" | "",
    allergenInformation: "",
    nutritionalInfoType: "as-per-label",
    nutritionalInfoImage: null as File | null,
    activeIngredients: "",
    additivesPreservatives: "",
    productClaims: "",
    storageConditionId: "",
    manufacturerName: "",
    countryOfOrigin: "",
    packType: "",
    unitsPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    batchLotNumber: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    shelfLifeMonths: "",
    stockQuantity: "",
    dateOfStockEntry: new Date(),
    mrp: "",
    sellingPricePerPack: "",
    discountPercentage: "",
    gstPercentage: "",
    hsnCode: "",
    manualFile: null as File | null,
    finalPrice: "",
  });

  // ---------- Dropdown data ----------
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [subcategories, setSubcategories] = useState<SelectOption[]>([]);
  const [ageGroups, setAgeGroups] = useState<SelectOption[]>([]);
  const [productForms, setProductForms] = useState<SelectOption[]>([]);
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [storageConditions, setStorageConditions] = useState<SelectOption[]>([]);
  const [packTypes, setPackTypes] = useState<SelectOption[]>([]);
  const [certificationsMaster, setCertificationsMaster] = useState<SelectOption[]>([]);
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);

  // Unit options states
  const [netQuantityUnitOptions, setNetQuantityUnitOptions] = useState<SelectOption[]>([]);
  const [netQuantityUnitsList, setNetQuantityUnitsList] = useState<any[]>([]);
  const [loadingNetQuantityUnits, setLoadingNetQuantityUnits] = useState(false);
  const [servingSizeUnitOptions, setServingSizeUnitOptions] = useState<SelectOption[]>([]);
  const [servingSizeUnitsList, setServingSizeUnitsList] = useState<any[]>([]);
  const [loadingServingSizeUnits, setLoadingServingSizeUnits] = useState(false);

  // Certifications state
  const [selectedCertificationValues, setSelectedCertificationValues] = useState<string[]>([]);
  const [certificationsDetails, setCertificationsDetails] = useState<CertificationTag[]>([]);

  // Additional discounts and special schemes
  const [additionalDiscounts, setAdditionalDiscounts] = useState<AdditionalDiscountData[]>([]);
  const [specialSchemes, setSpecialSchemes] = useState<SpecialSchemesData[]>([]);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingManualFile, setExistingManualFile] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [productAttributeId, setProductAttributeId] = useState<string | null>(null);
  const [existingNutritionalImageUrl, setExistingNutritionalImageUrl] = useState<string | null>(null);

  // Loading states
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingAgeGroups, setLoadingAgeGroups] = useState(false);
  const [loadingProductForms, setLoadingProductForms] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStorageConditions, setLoadingStorageConditions] = useState(false);
  const [loadingPackTypes, setLoadingPackTypes] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [ageGroupOptionsMap, setAgeGroupOptionsMap] = useState<Map<string, string>>(new Map());

  // Stock-based edit restrictions
  const currentStockQuantity = Number(form.stockQuantity) || 0;
  const isStockZero = currentStockQuantity === 0;
  const canEditStockDependent = !isEditMode || (isEditMode && isStockZero);

  const isFieldDisabled = (isEditable: boolean, isStockDependent: boolean = false): boolean => {
    if (!isEditMode) return false;
    if (!isEditable) return true;
    if (isStockDependent && !canEditStockDependent) return true;
    return false;
  };

  const formatMonthYear = (date: Date | string | null): string => {
    if (!date) return "";
    let d: Date;
    if (date instanceof Date) d = date;
    else if (typeof date === "string") d = new Date(date);
    else return "";
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const calculatePackSize = () => {
    const units = Number(form.unitsPerPack) || 0;
    const packs = Number(form.numberOfPacks) || 0;
    return units * packs;
  };

  const calculateShelfLife = () => {
    if (!form.manufacturingDate || !form.expiryDate) return "";
    const mfg = form.manufacturingDate instanceof Date ? form.manufacturingDate : new Date(form.manufacturingDate);
    const exp = form.expiryDate instanceof Date ? form.expiryDate : new Date(form.expiryDate);
    if (isNaN(mfg.getTime()) || isNaN(exp.getTime())) return "";
    const months = (exp.getFullYear() - mfg.getFullYear()) * 12 + (exp.getMonth() - mfg.getMonth());
    return months >= 0 ? months.toString() : "";
  };

  // Month picker handlers
  const handleMonthSelect = (
    field: "manufacturingDate" | "expiryDate",
    month: number,
    year: number,
  ) => {
    const selectedDate = new Date(year, month, 1);

    if (field === "manufacturingDate") {
      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(today.getFullYear() - 3);

      if (selectedDate > currentMonth) {
        setErrors((prev) => ({
          ...prev,
          manufacturingDate: "Manufacturing date cannot be in the future month",
        }));
        return;
      }

      if (selectedDate < threeYearsAgo) {
        setErrors((prev) => ({
          ...prev,
          manufacturingDate: "Manufacturing date cannot be more than 3 years old",
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        manufacturingDate: "",
        expiryDate: "",
      }));

      setForm((prev) => ({
        ...prev,
        manufacturingDate: selectedDate,
        expiryDate: null,
        shelfLifeMonths: "",
      }));

      setShowManufacturingMonthPicker(false);
      return;
    }

    if (field === "expiryDate") {
      setForm((prev) => {
        const updatedForm = {
          ...prev,
          expiryDate: selectedDate,
        };

        let expiryError = "";

        if (updatedForm.manufacturingDate) {
          const mfg = new Date(updatedForm.manufacturingDate);
          const today = new Date();
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(today.getMonth() + 3);
          const maxDate = new Date(mfg.getFullYear() + 5, mfg.getMonth(), 1);

          if (selectedDate < threeMonthsFromNow) {
            expiryError = "Expiry date must be at least 3 months from today";
          } else if (selectedDate > maxDate) {
            expiryError = "Expiry cannot be more than 5 years from Manufacturing Date";
          }

          const totalMonths =
            (selectedDate.getFullYear() - mfg.getFullYear()) * 12 +
            (selectedDate.getMonth() - mfg.getMonth());

          updatedForm.shelfLifeMonths = totalMonths >= 0 ? totalMonths.toString() : "";
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

  // ORIGINAL CERTIFICATION FUNCTIONS
const handleCertificationSelectionChange = (selectedValues: string[]) => {
  // In edit mode, prevent removal of existing certifications
  if (isEditMode && selectedCertificationValues.length > 0) {
    // Find which certifications were removed
    const removedCerts = selectedCertificationValues.filter(
      (oldId) => !selectedValues.includes(oldId)
    );
    
    // Check if any removed certification has an existingUrl (existing cert)
    const hasExistingRemoved = removedCerts.some(removedId => {
      const cert = certificationsDetails.find(c => c.id === removedId);
      return cert?.existingUrl; // true if it's an existing certification
    });
    
    // If any existing certification is being removed, block it
    if (hasExistingRemoved) {
      setErrors((prev) => ({
        ...prev,
        certifications: "Existing certifications cannot be removed. Add new ones or replace existing files."
      }));
      return;
    }
  }
  
  setSelectedCertificationValues(selectedValues);
  setCertificationsDetails((prev) => {
    const filtered = prev.filter((cert) => selectedValues.includes(cert.id));
    for (const val of selectedValues) {
      if (!filtered.some((c) => c.id === val)) {
        const option = certificationsMaster.find((opt) => opt.value === val);
        if (option) {
          filtered.push({
            id: option.value,
            label: option.label,
            tagCode: (option as any).tagCode || option.label.slice(0, 4).toUpperCase(),
            file: null,
            fileName: "",
            uploading: false,
            isUploaded: false,
          });
        }
      }
    }
    return filtered;
  });
  
  // Clear certification error if any
  setErrors((prev) => {
    const newErrors = { ...prev };
    delete newErrors.certifications;
    return newErrors;
  });
};

const handleCertificationFileUpload = (certId: string, file: File) => {
  if (file.size > 5 * 1024 * 1024) { 
    alert("File size must be less than 5 MB"); 
    return; 
  }
  setCertificationsDetails((prev) =>
    prev.map((cert) => (cert.id === certId ? { ...cert, uploading: true } : cert))
  );
  setTimeout(() => {
    setCertificationsDetails((prev) =>
      prev.map((cert) =>
        cert.id === certId
          ? { ...cert, file, fileName: file.name, uploading: false, isUploaded: true }
          : cert
      )
    );
  }, 100);
};

const handleCertRemove = (certId: string) => {
  const cert = certificationsDetails.find(c => c.id === certId);
  
  // In edit mode, prevent removal ONLY if it's an existing certification (has existingUrl)
  if (isEditMode && cert?.existingUrl) {
    setErrors((prev) => ({
      ...prev,
      certifications: "Existing certification files cannot be removed. You can only replace them with new files."
    }));
    return;
  }
  
  // For new certifications (no existingUrl) OR in create mode, allow removal
  setCertificationsDetails((prev) =>
    prev.filter((c) => c.id !== certId)
  );
  
  // Also remove from selectedCertificationValues
  setSelectedCertificationValues((prev) =>
    prev.filter((id) => id !== certId)
  );
};

  const validateCertifications = (): string | null => {
    if (selectedCertificationValues.length === 0) {
      return "At least one certification is required";
    }
    const missingFiles = certificationsDetails.filter(
      (cert) => !cert.isUploaded && !cert.existingUrl
    );
    if (missingFiles.length > 0) {
      return `Please upload file for: ${missingFiles.map(c => c.label).join(", ")}`;
    }
    return null;
  };

  // Validation functions
  const validateCrossFields = () => {
    const newErrors: Record<string, string> = {};
    
    // 1. Max Order Qty > Min Order Qty (strictly greater)
    const minQty = Number(form.minimumOrderQuantity) || 0;
    const maxQty = Number(form.maximumOrderQuantity) || 0;
    if (minQty > 0 && maxQty > 0 && maxQty <= minQty) {
      newErrors.maximumOrderQuantity = "Max Order Qty must be greater than Min Order Qty";
    }
    
    // 2. Stock Quantity >= Min Order Qty
    const stockQty = Number(form.stockQuantity) || 0;
    if (stockQty > 0 && minQty > 0 && stockQty < minQty) {
      newErrors.stockQuantity = `Stock Quantity must be greater than or equal to Min Order Qty (${minQty})`;
    }
    
    // 3. Selling Price < MRP
    const mrp = Number(form.mrp) || 0;
    const selling = Number(form.sellingPricePerPack) || 0;
    if (selling > 0 && mrp > 0 && selling >= mrp) {
      newErrors.sellingPricePerPack = "Selling Price must be less than MRP";
    }
    
    // 4. Discount between 0-100
    const discount = Number(form.discountPercentage);
    if (form.discountPercentage !== "" && (isNaN(discount) || discount < 0 || discount > 100)) {
      newErrors.discountPercentage = "Discount must be between 0 and 100";
    }
    
    // 5. HSN Code validation - FIXED
    const hsn = form.hsnCode;
    if (hsn && hsn.trim() !== "") {
      const isValidLength = [4, 6, 8].includes(hsn.length);
      const isNumeric = /^\d+$/.test(hsn);
      if (!isNumeric) {
        newErrors.hsnCode = "HSN Code must contain only numbers";
      } else if (!isValidLength) {
        newErrors.hsnCode = "HSN Code must be 4, 6, or 8 digits";
      }
    } else if (hsn && hsn.trim() === "") {
      // If empty, no error - field is required separately
      delete newErrors.hsnCode;
    }
    
    // 6. Shelf life validation
    const shelfLife = Number(form.shelfLifeMonths);
    if (form.shelfLifeMonths && !isNaN(shelfLife) && shelfLife > 60) {
      newErrors.shelfLifeMonths = "Shelf life cannot exceed 5 years (60 months)";
    }
    
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "unitsPerPack" || name === "numberOfPacks") {
        updated.packSize = String(calculatePackSize());
      }
      
      if (name === "sellingPricePerPack" || name === "gstPercentage") {
        const currentSP = Number(updated.sellingPricePerPack) || 0;
        const gst = Number(updated.gstPercentage) || 0;
        if (currentSP > 0) {
          updated.finalPrice = (currentSP + (currentSP * gst) / 100).toFixed(2);
        }
      }

      return updated;
    });

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    
    // Run cross-field validations after state update
    setTimeout(() => {
      const currentMinQty = name === "minimumOrderQuantity" ? Number(value) : Number(form.minimumOrderQuantity);
      const currentMaxQty = name === "maximumOrderQuantity" ? Number(value) : Number(form.maximumOrderQuantity);
      const currentStockQty = name === "stockQuantity" ? Number(value) : Number(form.stockQuantity);
      const currentMrp = name === "mrp" ? Number(value) : Number(form.mrp);
      const currentSelling = name === "sellingPricePerPack" ? Number(value) : Number(form.sellingPricePerPack);
      const currentHsn = name === "hsnCode" ? value : form.hsnCode;
      
      // Validate Max Qty > Min Qty
      if (currentMaxQty > 0 && currentMinQty > 0 && currentMaxQty <= currentMinQty) {
        setErrors((prev) => ({
          ...prev,
          maximumOrderQuantity: "Max Order Qty must be greater than Min Order Qty"
        }));
      } else if (name === "minimumOrderQuantity" || name === "maximumOrderQuantity") {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.maximumOrderQuantity;
          return newErrors;
        });
      }
      
      // Validate Stock Qty >= Min Qty
      if (currentStockQty > 0 && currentMinQty > 0 && currentStockQty < currentMinQty) {
        setErrors((prev) => ({
          ...prev,
          stockQuantity: `Stock Quantity must be greater than or equal to Min Order Qty (${currentMinQty})`
        }));
      } else if (name === "minimumOrderQuantity" || name === "stockQuantity") {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.stockQuantity;
          return newErrors;
        });
      }
      
      // Validate Selling Price < MRP
      if (currentSelling > 0 && currentMrp > 0 && currentSelling >= currentMrp) {
        setErrors((prev) => ({
          ...prev,
          sellingPricePerPack: "Selling Price must be less than MRP"
        }));
      } else if (name === "mrp" || name === "sellingPricePerPack") {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.sellingPricePerPack;
          return newErrors;
        });
      }
      
      // Validate HSN Code - FIXED: Clear error when validation passes
      if (name === "hsnCode") {
        if (currentHsn && currentHsn.trim() !== "") {
          const isValidLength = [4, 6, 8].includes(currentHsn.length);
          const isNumeric = /^\d+$/.test(currentHsn);
          if (!isNumeric) {
            setErrors((prev) => ({ ...prev, hsnCode: "HSN Code must contain only numbers" }));
          } else if (!isValidLength) {
            setErrors((prev) => ({ ...prev, hsnCode: "HSN Code must be 4, 6, or 8 digits" }));
          } else {
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.hsnCode;
              return newErrors;
            });
          }
        } else if (currentHsn && currentHsn.trim() === "") {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.hsnCode;
            return newErrors;
          });
        }
      }
    }, 100);
  };

  const handleNetQuantityValueChange = (val: string) => {
    setForm((prev) => ({ ...prev, netQuantityValue: val }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.netQuantityValue;
      delete newErrors.netQuantity;
      return newErrors;
    });
  };

  const handleNetQuantityUnitChange = (unit: string) => {
    const matchedItem = netQuantityUnitsList.find((item) => extractUnitString(item) === unit);
    const unitId = matchedItem ? (matchedItem.unitId || matchedItem.id) : 0;
    setForm((prev) => ({ ...prev, netQuantityUnit: unit, netQuantityUnitId: unitId }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.netQuantityUnit;
      return newErrors;
    });
  };

  const handleDropdownChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setTimeout(() => {
      validateCrossFields();
    }, 100);
  };

  const handleCategoryChange = async (value: string, label: string) => {
    setForm((prev) => ({
      ...prev,
      productCategory: value,
      productCategoryName: label,
      productSubcategory: "",
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.productCategory;
      delete newErrors.productSubcategory;
      return newErrors;
    });
    setLoadingSubcategories(true);
    try {
      const subData = await getProductSubcategories(Number(value));
      const subs = subData.map((item: any) => ({
        value: String(item.productSubcategoryId),
        label: item.productSubcategory,
      }));
      setSubcategories(subs);
    } catch (err) {
      console.error("Failed to load subcategories", err);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleManualFileSelect = (file: File | null) => {
    if (file && file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, manualFile: "Only PDF files are allowed" }));
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, manualFile: "File size must be less than 5 MB" }));
      return;
    }
    setForm((prev) => ({ ...prev, manualFile: file }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.manualFile;
      return newErrors;
    });
  };

  const handleNutritionalImageUpload = (file: File | null) => {
    if (file && !file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, nutritionalInfoImage: "Only image files are allowed" }));
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, nutritionalInfoImage: "File size must be less than 5 MB" }));
      return;
    }
    setForm((prev) => ({ ...prev, nutritionalInfoImage: file }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.nutritionalInfoImage;
      return newErrors;
    });
  };

  const handleRemoveNutritionalImage = () => {
    setForm((prev) => ({ ...prev, nutritionalInfoImage: null }));
    setExistingNutritionalImageUrl(null);
  };

  const getMinExpiryMonth = () => {
    if (!form.manufacturingDate) return "";
    const minDate = new Date(form.manufacturingDate);
    minDate.setMonth(minDate.getMonth() + 3);
    return `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMinExpiryFromToday = () => {
    const today = new Date();
    const minDate = new Date();
    minDate.setMonth(today.getMonth() + 3);
    return `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMaxManufacturingMonth = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  };

  // ---------- Fetch master data ----------
  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingCategories(true);
      try {
        const catData = await getProductCategories(3);
        setCategories(
          catData.map((c: any) => ({ value: String(c.productCategoryId), label: c.productCategory }))
        );
      } catch (err) {
        console.error("Failed to fetch categories", err);
      } finally {
        setLoadingCategories(false);
      }

      setLoadingAgeGroups(true);
      try {
        const ageData = await getAgeGroups();
        const ageOpts = ageData.map((a: any) => ({ value: String(a.ageGroupId), label: a.ageGroup }));
        setAgeGroups(ageOpts);
        const map = new Map<string, string>();
        ageOpts.forEach((opt: { value: string; label: string }) => map.set(opt.value, opt.label));
        setAgeGroupOptionsMap(map);
      } catch (err) {
        console.error("Failed to fetch age groups", err);
      } finally {
        setLoadingAgeGroups(false);
      }

      setLoadingProductForms(true);
      try {
        const formData = await getProductForms();
        setProductForms(
          formData.map((f: any) => ({ value: String(f.productFormId), label: f.productForm }))
        );
      } catch (err) {
        console.error("Failed to fetch product forms", err);
      } finally {
        setLoadingProductForms(false);
      }

      setLoadingCountries(true);
      try {
        const countryData = await getCountries();
        if (Array.isArray(countryData)) {
          setCountries(
            countryData.map((c: any) => ({
              value: String(c.countryId ?? c.id),
              label: c.countryName ?? c.name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch countries", err);
      } finally {
        setLoadingCountries(false);
      }

      setLoadingStorageConditions(true);
      try {
        const storageData = await getStorageConditionsByCategory(3); 
        setStorageConditions(
          (storageData || []).map((s: any) => ({
            value: String(s.storageConditionId ?? s.id),
            label: s.conditionName ?? s.condition ?? s.name,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch storage conditions", err);
      } finally {
        setLoadingStorageConditions(false);
      }

      setLoadingPackTypes(true);
      try {
        const packData = await getPackTypesByCategory(3);
        if (Array.isArray(packData)) {
          setPackTypes(
            packData.map((p: any) => ({
              value: String(p.packId ?? p.id),
              label: p.packType ?? p.type ?? p.name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch pack types", err);
      } finally {
        setLoadingPackTypes(false);
      }

      setLoadingCertifications(true);
      try {
        const certData = await getCertificationsByCategoryId(3);
        setCertificationsMaster(
          (certData || []).map((c: any) => ({
            value: String(c.id ?? c.certificationId),
            label: c.name ?? c.certificationName,
            tagCode: c.code ?? (c.name?.slice(0, 4).toUpperCase() ?? "CERT"),
          }))
        );
      } catch (err) {
        console.error("Failed to fetch certifications", err);
      } finally {
        setLoadingCertifications(false);
      }

      setLoadingNetQuantityUnits(true);
      try {
        const data = await getNetQuantityUnits(3);
        if (Array.isArray(data)) {
          setNetQuantityUnitsList(data);
          const parsedUnits = data.map((item: any) => {
            let displayName = "";
            if (item.unitName && item.unitName.trim()) {
              displayName = item.unitName.trim();
            } else if (item.name && item.name.trim()) {
              displayName = item.name.trim();
            } else if (item.unitSymbol && item.unitSymbol.trim()) {
              displayName = item.unitSymbol.trim();
            } else {
              displayName = extractUnitString(item);
            }
            return { value: displayName, label: displayName };
          });
          const uniqueUnits = Array.from(new Map(parsedUnits.map(u => [u.value, u])).values());
          setNetQuantityUnitOptions(uniqueUnits);
        }
      } catch (err) {
        console.error("Failed to fetch net quantity units", err);
      } finally {
        setLoadingNetQuantityUnits(false);
      }
    };
    fetchMasterData();
  }, []);

  // ---------- Edit mode ----------
  useEffect(() => {
  if (isEditMode && productId && netQuantityUnitsList.length > 0) {
    const fetchProduct = async () => {
      try {
        const prod = await getProductById(productId);
        let attr = {};

        if (prod.productAttributeFoodInfants && Array.isArray(prod.productAttributeFoodInfants) && prod.productAttributeFoodInfants.length > 0) {
          attr = prod.productAttributeFoodInfants[0];
        } else if (prod.productAttributeFoodInfant) {
          attr = prod.productAttributeFoodInfant;
        } else {
          try {
            const foodInfantAttr = await getFoodInfantAttributes(productId);
            if (foodInfantAttr) attr = foodInfantAttr;
          } catch (err) {
            console.error("Failed to fetch attributes separately:", err);
          }
        }

        const pricing = prod.pricingDetails?.[0] || {};
        const packaging = prod.packagingDetails?.[0] || {};

        let ageGroupArray: string[] = [];
        if ((attr as any).ageGroupMastersDto && Array.isArray((attr as any).ageGroupMastersDto)) {
          ageGroupArray = (attr as any).ageGroupMastersDto.map((ag: any) => String(ag.ageGroupId));
        } else if ((attr as any).ageGroupIds && Array.isArray((attr as any).ageGroupIds)) {
          ageGroupArray = (attr as any).ageGroupIds.map(String);
        }

        let netQuantityUnitValue = "";
        let netQuantityUnitIdValue = 0;
        if ((attr as any).unitId) {
          netQuantityUnitIdValue = (attr as any).unitId;
        }
        if ((attr as any).unitName) {
          netQuantityUnitValue = (attr as any).unitName;
        } else if ((attr as any).netQuantityUnitName) {
          netQuantityUnitValue = (attr as any).netQuantityUnitName;
        }

        if (netQuantityUnitIdValue > 0 && netQuantityUnitsList.length > 0 && !netQuantityUnitValue) {
          const matchedUnit = netQuantityUnitsList.find((item: any) => 
            item.unitId === netQuantityUnitIdValue || 
            item.id === netQuantityUnitIdValue ||
            Number(item.unitId) === netQuantityUnitIdValue ||
            Number(item.id) === netQuantityUnitIdValue
          );
          if (matchedUnit) {
            netQuantityUnitValue = matchedUnit.unitName || matchedUnit.name || matchedUnit.unitSymbol || extractUnitString(matchedUnit);
            netQuantityUnitValue = netQuantityUnitValue?.trim();
          }
        }

        // Serving size - not required, keep as is for backend but display disabled
        let servingSizeUnitValue = "";
        let servingSizeUnitIdValue = 0;
        if ((attr as any).servingSizeUnit) {
          if (typeof (attr as any).servingSizeUnit === "object") {
            servingSizeUnitValue = (attr as any).servingSizeUnit.unitName || 
                                   (attr as any).servingSizeUnit.name || 
                                   (attr as any).servingSizeUnit.servingSizeUnitName || "";
            servingSizeUnitIdValue = (attr as any).servingSizeUnit.unitId || 
                                     (attr as any).servingSizeUnit.id || 0;
          } else if (typeof (attr as any).servingSizeUnit === "string") {
            servingSizeUnitValue = (attr as any).servingSizeUnit;
          }
        } else if ((attr as any).servingSizeUnitName) {
          servingSizeUnitValue = (attr as any).servingSizeUnitName;
          servingSizeUnitIdValue = (attr as any).servingSizeUnitId || 0;
        }

        if ((attr as any).nutritionalInformationImageUrl) {
          setExistingNutritionalImageUrl((attr as any).nutritionalInformationImageUrl);
        }

        // Parse manufacturing and expiry dates
        let manufacturingDate = null;
        let expiryDate = null;
        
        if (pricing.manufacturingDate) {
          const mfgDate = new Date(pricing.manufacturingDate);
          if (!isNaN(mfgDate.getTime())) manufacturingDate = mfgDate;
        }
        
        if (pricing.expiryDate) {
          const expDate = new Date(pricing.expiryDate);
          if (!isNaN(expDate.getTime())) expiryDate = expDate;
        }

        const categoryId = (attr as any).productCategoryId;
        const subcategoryId = (attr as any).productSubcategoryId;
        
        // FIRST: Set category and other basic form data
        setForm(prev => ({
          ...prev,
          productName: prod.productName || "",
          productDescription: prod.productDescription || "",
          warningsPrecautions: prod.warningsPrecautions || "",
          productCategory: categoryId?.toString() || "",
          productCategoryName: "",
          // Don't set subcategory yet - will set after loading options
          productSubcategory: "",
          productSubcategoryName: "",
          brandName: (attr as any).brandName || "",
          variantName: (attr as any).variantName || "",
          productForm: (attr as any).productFormId?.toString() || "",
          netQuantityValue: (attr as any).netQuantity?.toString() || "",
          netQuantityUnit: netQuantityUnitValue,
          netQuantityUnitId: netQuantityUnitIdValue,
          servingSizeValue: (attr as any).servingSize?.toString() || "",
          servingSizeUnit: servingSizeUnitValue,
          servingSizeUnitId: servingSizeUnitIdValue,
          ageGroup: ageGroupArray,
          dietaryClassification: (attr as any).vegNonvegIndicator || "",
          allergenInformation: (attr as any).allergenInformation || "",
          nutritionalInfoType: (attr as any).nutritionalInformation === "image-upload" ? "image-upload" : "as-per-label",
          nutritionalInfoImage: null,
          activeIngredients: (attr as any).activeIngredients || "",
          additivesPreservatives: (attr as any).additivesPreservatives || "",
          productClaims: (attr as any).productClaims || "",
          storageConditionId: (attr as any).storageConditionId?.toString() || "",
          manufacturerName: (attr as any).manufacturerName || prod.manufacturerName || "",
          countryOfOrigin: (attr as any).countryId?.toString() || "",
          packType: packaging.packId?.toString() || packaging.packType?.toString() || "",
          unitsPerPack: packaging.unitPerPack?.toString() || "",
          numberOfPacks: packaging.numberOfPacks?.toString() || "",
          packSize: packaging.packSize?.toString() || "",
          minimumOrderQuantity: packaging.minimumOrderQuantity?.toString() || "",
          maximumOrderQuantity: packaging.maximumOrderQuantity?.toString() || "",
          batchLotNumber: pricing.batchLotNumber || "",
          manufacturingDate: manufacturingDate,
          expiryDate: expiryDate,
          shelfLifeMonths: pricing.shelfLifeMonths?.toString() || "",
          stockQuantity: pricing.stockQuantity?.toString() || "",
          dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
          mrp: pricing.mrp?.toString() || "",
          sellingPricePerPack: pricing.sellingPrice?.toString() || "",
          discountPercentage: pricing.discountPercentage?.toString() || "",
          gstPercentage: pricing.gstPercentage?.toString() || "",
          hsnCode: pricing.hsnCode?.toString() || "",
          manualFile: null,
          finalPrice: pricing.finalPrice?.toString() || "",
        }));

        setExistingImages(prod.productImages?.map((img: any) => img.productImage) || []);
        setExistingManualFile((attr as any).productUserManual || null);
        setAdditionalDiscounts(pricing.additionalDiscounts || []);
        setSpecialSchemes(pricing.specialSchemes || []);
        setProductAttributeId((attr as any).productAttributeId || null);

        if ((attr as any).certificateDocuments?.length) {
          const selected = (attr as any).certificateDocuments.map((c: any) => String(c.certificationId));
          setSelectedCertificationValues(selected);
          const certDocMap = new Map();
          (attr as any).certificateDocuments.forEach((doc: any) => {
            certDocMap.set(String(doc.certificationId), doc);
          });
          setCertificationsDetails(
            selected.map((id: string) => {
              const certDoc = certDocMap.get(id);
              return {
                id,
                label: certDoc?.certificationName || "",
                tagCode: "",
                file: null,
                fileName: "",
                uploading: false,
                isUploaded: true,
                existingUrl: certDoc?.certificateUrl || "",
              };
            })
          );
        }

        // SECOND: Load subcategories for the category
        if (categoryId) {
          setLoadingSubcategories(true);
          try {
            const subData = await getProductSubcategories(Number(categoryId));
            const subs = subData.map((item: any) => ({
              value: String(item.productSubcategoryId),
              label: item.productSubcategory,
            }));
            setSubcategories(subs);
            
            // THIRD: After subcategories are loaded, set the subcategory value
            if (subcategoryId) {
              setForm(prev => ({
                ...prev,
                productSubcategory: String(subcategoryId),
              }));
            }
          } catch (err) {
            console.error("Failed to load subcategories for edit mode:", err);
            setSubcategories([]);
          } finally {
            setLoadingSubcategories(false);
          }
        }
        
      } catch (err) {
        console.error("Failed to load product for edit", err);
      }
    };
    fetchProduct();
  }
}, [isEditMode, productId, netQuantityUnitsList]);

  // useEffect(() => {
  //   if (isEditMode && productId && netQuantityUnitsList.length > 0) {
  //     const fetchProduct = async () => {
  //       try {
  //         const prod = await getProductById(productId);
  //         let attr = {};

  //         if (prod.productAttributeFoodInfants && Array.isArray(prod.productAttributeFoodInfants) && prod.productAttributeFoodInfants.length > 0) {
  //           attr = prod.productAttributeFoodInfants[0];
  //         } else if (prod.productAttributeFoodInfant) {
  //           attr = prod.productAttributeFoodInfant;
  //         } else {
  //           try {
  //             const foodInfantAttr = await getFoodInfantAttributes(productId);
  //             if (foodInfantAttr) attr = foodInfantAttr;
  //           } catch (err) {
  //             console.error("Failed to fetch attributes separately:", err);
  //           }
  //         }

  //         const pricing = prod.pricingDetails?.[0] || {};
  //         const packaging = prod.packagingDetails?.[0] || {};

  //         let ageGroupArray: string[] = [];
  //         if ((attr as any).ageGroupMastersDto && Array.isArray((attr as any).ageGroupMastersDto)) {
  //           ageGroupArray = (attr as any).ageGroupMastersDto.map((ag: any) => String(ag.ageGroupId));
  //         } else if ((attr as any).ageGroupIds && Array.isArray((attr as any).ageGroupIds)) {
  //           ageGroupArray = (attr as any).ageGroupIds.map(String);
  //         }

  //         let netQuantityUnitValue = "";
  //         let netQuantityUnitIdValue = 0;
  //         if ((attr as any).unitId) {
  //           netQuantityUnitIdValue = (attr as any).unitId;
  //         }
  //         if ((attr as any).unitName) {
  //           netQuantityUnitValue = (attr as any).unitName;
  //         } else if ((attr as any).netQuantityUnitName) {
  //           netQuantityUnitValue = (attr as any).netQuantityUnitName;
  //         }

  //         if (netQuantityUnitIdValue > 0 && netQuantityUnitsList.length > 0 && !netQuantityUnitValue) {
  //           const matchedUnit = netQuantityUnitsList.find((item: any) => 
  //             item.unitId === netQuantityUnitIdValue || 
  //             item.id === netQuantityUnitIdValue ||
  //             Number(item.unitId) === netQuantityUnitIdValue ||
  //             Number(item.id) === netQuantityUnitIdValue
  //           );
  //           if (matchedUnit) {
  //             netQuantityUnitValue = matchedUnit.unitName || matchedUnit.name || matchedUnit.unitSymbol || extractUnitString(matchedUnit);
  //             netQuantityUnitValue = netQuantityUnitValue?.trim();
  //           }
  //         }

  //         // Serving size - not required, keep as is for backend but display disabled
  //         let servingSizeUnitValue = "";
  //         let servingSizeUnitIdValue = 0;
  //         if ((attr as any).servingSizeUnit) {
  //           if (typeof (attr as any).servingSizeUnit === "object") {
  //             servingSizeUnitValue = (attr as any).servingSizeUnit.unitName || 
  //                                    (attr as any).servingSizeUnit.name || 
  //                                    (attr as any).servingSizeUnit.servingSizeUnitName || "";
  //             servingSizeUnitIdValue = (attr as any).servingSizeUnit.unitId || 
  //                                      (attr as any).servingSizeUnit.id || 0;
  //           } else if (typeof (attr as any).servingSizeUnit === "string") {
  //             servingSizeUnitValue = (attr as any).servingSizeUnit;
  //           }
  //         } else if ((attr as any).servingSizeUnitName) {
  //           servingSizeUnitValue = (attr as any).servingSizeUnitName;
  //           servingSizeUnitIdValue = (attr as any).servingSizeUnitId || 0;
  //         }

  //         if ((attr as any).nutritionalInformationImageUrl) {
  //           setExistingNutritionalImageUrl((attr as any).nutritionalInformationImageUrl);
  //         }

  //         // Parse manufacturing and expiry dates
  //         let manufacturingDate = null;
  //         let expiryDate = null;
          
  //         if (pricing.manufacturingDate) {
  //           const mfgDate = new Date(pricing.manufacturingDate);
  //           if (!isNaN(mfgDate.getTime())) manufacturingDate = mfgDate;
  //         }
          
  //         if (pricing.expiryDate) {
  //           const expDate = new Date(pricing.expiryDate);
  //           if (!isNaN(expDate.getTime())) expiryDate = expDate;
  //         }

  //         setForm({
  //           productName: prod.productName || "",
  //           productDescription: prod.productDescription || "",
  //           warningsPrecautions: prod.warningsPrecautions || "",
  //           productCategory: (attr as any).productCategoryId?.toString() || "",
  //           productCategoryName: "",
  //           productSubcategory: (attr as any).productSubcategoryId?.toString() || "",
  //           productSubcategoryName: "",
  //           brandName: (attr as any).brandName || "",
  //           variantName: (attr as any).variantName || "",
  //           productForm: (attr as any).productFormId?.toString() || "",
  //           netQuantityValue: (attr as any).netQuantity?.toString() || "",
  //           netQuantityUnit: netQuantityUnitValue,
  //           netQuantityUnitId: netQuantityUnitIdValue,
  //           servingSizeValue: (attr as any).servingSize?.toString() || "",
  //           servingSizeUnit: servingSizeUnitValue,
  //           servingSizeUnitId: servingSizeUnitIdValue,
  //           ageGroup: ageGroupArray,
  //           dietaryClassification: (attr as any).vegNonvegIndicator || "",
  //           allergenInformation: (attr as any).allergenInformation || "",
  //           nutritionalInfoType: (attr as any).nutritionalInformation === "image-upload" ? "image-upload" : "as-per-label",
  //           nutritionalInfoImage: null,
  //           activeIngredients: (attr as any).activeIngredients || "",
  //           additivesPreservatives: (attr as any).additivesPreservatives || "",
  //           productClaims: (attr as any).productClaims || "",
  //           storageConditionId: (attr as any).storageConditionId?.toString() || "",
  //           manufacturerName: (attr as any).manufacturerName || prod.manufacturerName || "",
  //           countryOfOrigin: (attr as any).countryId?.toString() || "",
  //           packType: packaging.packId?.toString() || packaging.packType?.toString() || "",
  //           unitsPerPack: packaging.unitPerPack?.toString() || "",
  //           numberOfPacks: packaging.numberOfPacks?.toString() || "",
  //           packSize: packaging.packSize?.toString() || "",
  //           minimumOrderQuantity: packaging.minimumOrderQuantity?.toString() || "",
  //           maximumOrderQuantity: packaging.maximumOrderQuantity?.toString() || "",
  //           batchLotNumber: pricing.batchLotNumber || "",
  //           manufacturingDate: manufacturingDate,
  //           expiryDate: expiryDate,
  //           shelfLifeMonths: pricing.shelfLifeMonths?.toString() || "",
  //           stockQuantity: pricing.stockQuantity?.toString() || "",
  //           dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
  //           mrp: pricing.mrp?.toString() || "",
  //           sellingPricePerPack: pricing.sellingPrice?.toString() || "",
  //           discountPercentage: pricing.discountPercentage?.toString() || "",
  //           gstPercentage: pricing.gstPercentage?.toString() || "",
  //           hsnCode: pricing.hsnCode?.toString() || "",
  //           manualFile: null,
  //           finalPrice: pricing.finalPrice?.toString() || "",
  //         });

  //         setExistingImages(prod.productImages?.map((img: any) => img.productImage) || []);
  //         setExistingManualFile((attr as any).productUserManual || null);
  //         setAdditionalDiscounts(pricing.additionalDiscounts || []);
  //         setSpecialSchemes(pricing.specialSchemes || []);
  //         setProductAttributeId((attr as any).productAttributeId || null);

  //         if ((attr as any).certificateDocuments?.length) {
  //           const selected = (attr as any).certificateDocuments.map((c: any) => String(c.certificationId));
  //           setSelectedCertificationValues(selected);
  //           const certDocMap = new Map();
  //           (attr as any).certificateDocuments.forEach((doc: any) => {
  //             certDocMap.set(String(doc.certificationId), doc);
  //           });
  //           setCertificationsDetails(
  //             selected.map((id: string) => {
  //               const certDoc = certDocMap.get(id);
  //               return {
  //                 id,
  //                 label: certDoc?.certificationName || "",
  //                 tagCode: "",
  //                 file: null,
  //                 fileName: "",
  //                 uploading: false,
  //                 isUploaded: true,
  //                 existingUrl: certDoc?.certificateUrl || "",
  //               };
  //             })
  //           );
  //         }
  //       } catch (err) {
  //         console.error("Failed to load product for edit", err);
  //       }
  //     };
  //     fetchProduct();
  //   }
  // }, [isEditMode, productId, netQuantityUnitsList]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, packSize: String(calculatePackSize()) }));
  }, [form.unitsPerPack, form.numberOfPacks]);

  useEffect(() => {
    const newShelfLife = calculateShelfLife();
    setForm((prev) => ({ ...prev, shelfLifeMonths: newShelfLife }));
    
    if (newShelfLife && Number(newShelfLife) > 60) {
      setErrors((prev) => ({
        ...prev,
        shelfLifeMonths: "Shelf life cannot exceed 5 years (60 months)"
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.shelfLifeMonths;
        return newErrors;
      });
    }
  }, [form.manufacturingDate, form.expiryDate]);

  // ---------- Build payload ----------
  const buildPayload = (): CreateProductRequest => {
    const toISODate = (date: Date | string | null): string | null => {
      if (!date) return null;
      let d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    };

    const packaging: PackagingData = {
      packId: Number(form.packType),
      packType: form.packType,
      unitPerPack: Number(form.unitsPerPack) || 0,
      numberOfPacks: Number(form.numberOfPacks) || 0,
      packSize: Number(form.packSize) || 0,
      minimumOrderQuantity: Number(form.minimumOrderQuantity) || 0,
      maximumOrderQuantity: Number(form.maximumOrderQuantity) || 0,
    };

    const pricing: PricingData = {
      batchLotNumber: form.batchLotNumber,
      manufacturingDate: toISODate(form.manufacturingDate),
      expiryDate: toISODate(form.expiryDate),
      dateOfStockEntry: new Date().toISOString(),
      stockQuantity: Number(form.stockQuantity) || 0,
      sellingPrice: Number(form.sellingPricePerPack) || 0,
      mrp: Number(form.mrp) || 0,
      gstPercentage: Number(form.gstPercentage) || 0,
      discountPercentage: Number(form.discountPercentage) || 0,
      finalPrice: Number(form.sellingPricePerPack) || 0,
      hsnCode: Number(form.hsnCode) || 0,
      shelfLifeMonths: Number(form.shelfLifeMonths) || 0,
      additionalDiscounts: additionalDiscounts,
      specialSchemes: specialSchemes,
    };

    const ageGroupMastersDto = form.ageGroup.map(id => ({
      ageGroupId: Number(id)
    }));
    const firstAgeGroupId = form.ageGroup.length > 0 ? Number(form.ageGroup[0]) : 0;

    const foodInfantAttr = {
      productCategoryId: Number(form.productCategory),
      productSubcategoryId: Number(form.productSubcategory),
      brandName: form.brandName,
      variantName: form.variantName,
      productFormId: Number(form.productForm),
      netQuantity: Number(form.netQuantityValue) || 0,
      unitId: form.netQuantityUnitId,
      // servingSize: Number(form.servingSizeValue) || 0,
      // servingSizeUnitId: form.servingSizeUnitId,
      ageGroupId: firstAgeGroupId,
      ageGroupMastersDto: ageGroupMastersDto,
      vegNonvegIndicator: form.dietaryClassification as "veg" | "non-veg",
      allergenInformation: form.allergenInformation,
      nutritionalInformation: form.nutritionalInfoType,
      nutritionalInformationImageUrl: "",
      activeIngredients: form.activeIngredients,
      additivesPreservatives: form.additivesPreservatives,
      productClaims: form.productClaims,
      storageConditionId: form.storageConditionId ? Number(form.storageConditionId) : 0,
      countryId: Number(form.countryOfOrigin),
      certificateDocuments: certificationsDetails
        .filter((c) => c.isUploaded)
        .map((c) => ({
          certificationId: Number(c.id),
          certificateUrl: c.existingUrl || (c.file ? URL.createObjectURL(c.file) : ""),
        })),
      productUserManual: existingManualFile || "PENDING",
    };

    const payload: CreateProductRequest = {
      productName: form.productName,
      productDescription: form.productDescription,
      warningsPrecautions: form.warningsPrecautions,
      manufacturerName: form.manufacturerName,
      categoryId: 3,
      packagingDetails: [packaging],
      pricingDetails: [pricing],
      productAttributeFoodInfants: [foodInfantAttr],
    };

    return payload;
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!form.productName.trim()) newErrors.productName = "Product Name is required";
    if (!form.productCategory) newErrors.productCategory = "Product Category is required";
    if (!form.productSubcategory) newErrors.productSubcategory = "Product Subcategory is required";
    if (!form.brandName.trim()) newErrors.brandName = "Brand Name is required";
    if (!form.productForm) newErrors.productForm = "Product Form is required";
    
    if (!form.netQuantityValue) {
      newErrors.netQuantityValue = "Net Quantity is required";
    } else if (isNaN(Number(form.netQuantityValue)) || Number(form.netQuantityValue) <= 0) {
      newErrors.netQuantityValue = "Net Quantity must be a positive number";
    }
    if (!form.netQuantityUnit) newErrors.netQuantityUnit = "Please select a unit";
    
    // Serving size is NOT required - removed validation
    
    if (form.ageGroup.length === 0) newErrors.ageGroup = "At least one age group is required";
    if (!form.dietaryClassification) newErrors.dietaryClassification = "Dietary classification is required";
    if (!form.allergenInformation.trim()) newErrors.allergenInformation = "Allergen Information is required";
    if (!form.nutritionalInfoType) newErrors.nutritionalInfoType = "Nutritional info type is required";
    if (!form.activeIngredients.trim()) newErrors.activeIngredients = "Active ingredients are required";
    if (!form.additivesPreservatives.trim()) newErrors.additivesPreservatives = "Additives/Preservatives are required";
    if (!form.productClaims.trim()) newErrors.productClaims = "Product claims are required";
    if (!form.storageConditionId) newErrors.storageConditionId = "Storage condition is required";
    if (!form.manufacturerName.trim()) newErrors.manufacturerName = "Manufacturer Name is required";
    if (!form.countryOfOrigin) newErrors.countryOfOrigin = "Country of origin is required";
    if (!form.productDescription.trim()) newErrors.productDescription = "Product Description is required";
    if (!form.warningsPrecautions.trim()) newErrors.warningsPrecautions = "Warnings/Precautions is required";
    if (!form.packType) newErrors.packType = "Pack type is required";
    if (!form.unitsPerPack) newErrors.unitsPerPack = "Number of Units per Pack Type is required";
    if (!form.numberOfPacks) newErrors.numberOfPacks = "Number of Packs is required";
    if (!form.minimumOrderQuantity) newErrors.minimumOrderQuantity = "Min Order Qty is required";
    if (!form.maximumOrderQuantity) newErrors.maximumOrderQuantity = "Max Order Qty is required";
    if (!form.batchLotNumber) newErrors.batchLotNumber = "Batch/Lot Number is required";
    if (!form.manufacturingDate) newErrors.manufacturingDate = "Manufacturing Date is required";
    if (!form.expiryDate) newErrors.expiryDate = "Expiry Date is required";
    if (!form.stockQuantity) newErrors.stockQuantity = "Stock Quantity is required";
    if (!form.mrp) newErrors.mrp = "MRP is required";
    if (!form.sellingPricePerPack) newErrors.sellingPricePerPack = "Selling Price is required";
    if (!form.gstPercentage) newErrors.gstPercentage = "GST % is required";
    if (!form.hsnCode) newErrors.hsnCode = "HSN Code is required";

    if (form.nutritionalInfoType === "image-upload" && !form.nutritionalInfoImage && !existingNutritionalImageUrl) {
      newErrors.nutritionalInfoImage = "Nutritional Information Image is required";
    }

    if (images.length === 0 && existingImages.length === 0) {
      newErrors.images = "At least one product image is required";
    }
    if (images.length > 5) newErrors.images = "Maximum 5 images allowed";

    const certError = validateCertifications();
    if (certError) newErrors.certifications = certError;

    return newErrors;
  };

  const handleSubmit = async () => {
    const certError = validateCertifications();
    if (certError) {
      setErrors((prev) => ({ ...prev, certifications: certError }));
      const el = document.querySelector<HTMLElement>(`[data-field="certifications"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const fieldErrors = validateForm();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const firstKey = Object.keys(fieldErrors)[0];
      const el = fieldRefs.current[firstKey] || document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!validateCrossFields()) {
      const firstErrorKey = Object.keys(errors)[0];
      const el = fieldRefs.current[firstErrorKey] || document.querySelector<HTMLElement>(`[data-field="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = buildPayload();

    try {
      let response;
      let newProductAttributeId = productAttributeId;
      let newProductId = productId;

      if (isEditMode && productId) {
        response = await updateProduct(productId, payload);
        setModalType("update");
        setShowUpdateSuccessModal(true);

        const updatedData = response?.data || response;
        newProductAttributeId = updatedData?.productAttributeFoodInfants?.productAttributeId
          || updatedData?.productAttributeFoodInfant?.productAttributeId
          || productAttributeId;

        setProductAttributeId(newProductAttributeId || null);

        if (images.length > 0) {
          await uploadProductImages(productId, images);
        }

        if (form.manualFile && newProductAttributeId) {
          try {
            await uploadFoodInfantUserManual(newProductAttributeId, form.manualFile);
          } catch (err) {
            console.warn("⚠️ User manual upload failed:", err);
          }
        }

        if (form.nutritionalInfoImage && newProductAttributeId) {
          try {
            await uploadNutritionalInformationImage(newProductAttributeId, 3, form.nutritionalInfoImage);
          } catch (err) {
            console.warn("⚠️ Nutritional image upload failed:", err);
          }
        }
      } else {
        response = await createFoodInfantProduct(payload);

        newProductId = response?.data?.productId;
        newProductAttributeId = response?.data?.productAttributeFoodInfants?.[0]?.productAttributeId
          || response?.data?.productAttributeFoodInfant?.productAttributeId;

        if (!newProductId) {
          throw new Error(`Product ID not returned from server.`);
        }

        setModalType("create");
        setCreatedProductId(newProductId);
        setProductAttributeId(newProductAttributeId || null);

        if (images.length) {
          await uploadProductImages(newProductId, images);
        }

        if (form.manualFile && newProductAttributeId) {
          try {
            await uploadFoodInfantUserManual(newProductAttributeId, form.manualFile);
          } catch (err) {
            console.warn("⚠️ User manual upload failed:", err);
          }
        }

        if (form.nutritionalInfoImage && newProductAttributeId) {
          try {
            await uploadNutritionalInformationImage(newProductAttributeId, 3, form.nutritionalInfoImage);
          } catch (err) {
            console.warn("⚠️ Nutritional image upload failed:", err);
          }
        }

        setShowSuccessModal(true);
      }
    } catch (err: any) {
      console.error("Submit failed", err);
      setErrors({ submit: err.message || "Submission failed" });
      alert(`Failed to ${isEditMode ? "update" : "create"} product: ${err.message}`);
    }
  };

  const resetForm = () => {
    setForm({
      productName: "", productDescription: "", warningsPrecautions: "",
      productCategory: "", productCategoryName: "", productSubcategory: "", productSubcategoryName: "",
      brandName: "", variantName: "", productForm: "",
      netQuantityValue: "", netQuantityUnit: "", netQuantityUnitId: 0,
      servingSizeValue: "", servingSizeUnit: "", servingSizeUnitId: 0,
      ageGroup: [],
      dietaryClassification: "", allergenInformation: "", nutritionalInfoType: "as-per-label", nutritionalInfoImage: null,
      activeIngredients: "", additivesPreservatives: "", productClaims: "", storageConditionId: "",
      manufacturerName: "", countryOfOrigin: "", packType: "", unitsPerPack: "", numberOfPacks: "", packSize: "",
      minimumOrderQuantity: "", maximumOrderQuantity: "", batchLotNumber: "", manufacturingDate: null, expiryDate: null,
      shelfLifeMonths: "", stockQuantity: "", dateOfStockEntry: new Date(), mrp: "", sellingPricePerPack: "",
      discountPercentage: "", gstPercentage: "", hsnCode: "", manualFile: null,
      finalPrice: "",
    });
    setImages([]);
    setExistingImages([]);
    setExistingManualFile(null);
    setExistingNutritionalImageUrl(null);
    setSelectedCertificationValues([]);
    setCertificationsDetails([]);
    setAdditionalDiscounts([]);
    setSpecialSchemes([]);
    setErrors({});
  };

  const handleViewProduct = () => {
    if (createdProductId) {
      router.push(`/seller_7a3b9f2c/products/view/${createdProductId}`);
    } else if (productId) {
      router.push(`/seller_7a3b9f2c/products/view/${productId}`);
    } else {
      window.location.reload();
    }
  };

  const handleContinueEditing = () => {
    setShowSuccessModal(false);
    setShowUpdateSuccessModal(false);
  };

  const handleContinueAdding = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  const handleBackToDashboard = () => {
    router.push("/seller_7a3b9f2c/dashboard");
  };

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

      <PopupModal
        isOpen={showUpdateSuccessModal}
        title="Product Updated Successfully!"
        description="Your product has been updated and is now live on the platform"
        primaryActionText="View Product"
        secondaryActionText="Continue Editing"
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={handleViewProduct}
        onSecondaryAction={handleContinueEditing}
        onTertiaryAction={handleBackToDashboard}
        onClose={() => setShowUpdateSuccessModal(false)}
      />

      {showAdditionalDiscount && (
        <CommonModal onClose={() => setShowAdditionalDiscount(false)} width="w-[600px]">
          <div className="h-[80vh] overflow-y-auto flex flex-col p-6">
            <AdditionalDiscountType
              onClose={() => setShowAdditionalDiscount(false)}
              categoryId={categoryId}
              initialData={additionalDiscounts}
              baseDiscountPercentage={Number(form.discountPercentage) || 0}
              baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
              onSaveAdditionalDiscount={(data: AdditionalDiscountData[]) => {
                setAdditionalDiscounts(data || []);
              }}
              initialSchemesData={specialSchemes}
              onSaveSpecialSchemes={(data: SpecialSchemesData[]) => {
                setSpecialSchemes(data || []);
                setShowAdditionalDiscount(false);
              }}
            />
          </div>
        </CommonModal>
      )}

      <form
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-5 w-full max-w-full mx-auto bg-white"
      >
        {/* Product Details Section */}
        <div className="border border-neutral-200 rounded-xl p-6">
          <div className="text-h4 font-semibold">Product Details</div>
          <div className="border-b border-neutral-200 mt-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
            <div data-field="productName">
              <Input
                label="Product Name"
                name="productName"
                placeholder="e.g., Organic Protein Powder"
                onChange={handleChange}
                value={form.productName}
                error={errors.productName}
                required
                readOnly={isEditMode}
                maxLength={150}
              />
            </div>

            <div className="flex flex-col gap-0" data-field="productCategory">
              <label className={fieldLabel}>Product Category {requiredStar}</label>
              <Dropdown
                options={categories}
                value={form.productCategory}
                onChange={handleCategoryChange}
                placeholder="Select category"
                isDisabled={isEditMode || loadingCategories}
                error={errors.productCategory ? " " : ""}
              />
              {errors.productCategory && <p className={errorMsg}>{errors.productCategory}</p>}
            </div>

            <div className="flex flex-col gap-0" data-field="productSubcategory">
              <label className={fieldLabel}>Product Subcategory {requiredStar}</label>
              <Dropdown
                options={subcategories}
                value={form.productSubcategory}
                onChange={(value) => handleDropdownChange("productSubcategory", value)}
                placeholder="Select subcategory"
                isDisabled={isEditMode || !form.productCategory || loadingSubcategories}
                error={errors.productSubcategory ? " " : ""}
              />
              {errors.productSubcategory && <p className={errorMsg}>{errors.productSubcategory}</p>}
            </div>

            <div data-field="brandName">
              <Input
                label="Brand Name"
                name="brandName"
                placeholder="e.g., Nestle, Abbott"
                onChange={handleChange}
                value={form.brandName}
                readOnly={isEditMode}
                error={errors.brandName}
                required
                maxLength={60}
              />
            </div>

            <div data-field="variantName">
              <Input
                label="Variant Name"
                name="variantName"
                placeholder="e.g., Chocolate, Vanilla"
                onChange={handleChange}
                value={form.variantName}
                readOnly={false}
                error={errors.variantName}
              />
            </div>

            <div className="flex flex-col gap-0" data-field="productForm">
              <label className={fieldLabel}>Product Form {requiredStar}</label>
              <Dropdown
                options={productForms}
                value={form.productForm}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, productForm: value, servingSizeValue: "", servingSizeUnit: "", servingSizeUnitId: 0 }));
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.productForm;
                    return newErrors;
                  });
                }}
                placeholder="Select product form"
                isDisabled={isEditMode || loadingProductForms}
                error={errors.productForm ? " " : ""}
              />
              {errors.productForm && <p className={errorMsg}>{errors.productForm}</p>}
            </div>

            <div data-field="netQuantity">
              <NumericInputWithUnit
                label="Net Quantity"
                name="netQuantityValue"
                placeholder="Enter quantity"
                value={form.netQuantityValue}
                unit={form.netQuantityUnit}
                onValueChange={handleNetQuantityValueChange}
                onUnitChange={handleNetQuantityUnitChange}
                error={errors.netQuantityValue || errors.netQuantityUnit}
                required
                readOnly={isEditMode}
                options={netQuantityUnitOptions}
                loading={loadingNetQuantityUnits}
              />
            </div>

            {/* Serving Size - Disabled with "As prescribed by Doctor" */}
            <div data-field="servingSize">
              <ServingSizeDisabled label="Serving Size" required={false} />
            </div>

            <div className="flex flex-col gap-0" data-field="ageGroup">
              <label className={fieldLabel}>Age Group {requiredStar}</label>
              <CheckboxDropdown
                label=""
                options={ageGroups}
                selectedValues={form.ageGroup}
                onChange={(values) => {
                  setForm((prev) => ({ ...prev, ageGroup: values }));
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.ageGroup;
                    return newErrors;
                  });
                }}
                placeholder="Select age group"
                required
                disabled={isEditMode || loadingAgeGroups}
                showSelectAll={false}
                error={errors.ageGroup ? " " : ""}
              />
              {errors.ageGroup && <p className={errorMsg}>{errors.ageGroup}</p>}
            </div>

            <div className="flex flex-col gap-1" data-field="dietaryClassification">
              <label className={fieldLabel}>Dietary Classification {requiredStar}</label>
              <div className="flex gap-6 mt-2">
                {dietaryOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dietaryClassification"
                      value={option.value}
                      checked={form.dietaryClassification === option.value}
                      onChange={(e) => {
                        setForm(prev => ({ ...prev, dietaryClassification: e.target.value as "veg" | "non-veg" }));
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.dietaryClassification;
                          return newErrors;
                        });
                      }}
                      disabled={isEditMode}
                      className="accent-primary-900 w-5 h-5"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.dietaryClassification && <p className={errorMsg}>{errors.dietaryClassification}</p>}
            </div>

            <div data-field="allergenInformation">
              <Input
                label="Allergen Information"
                name="allergenInformation"
                placeholder="e.g., Contains milk, soy (Min 3 chars)"
                onChange={handleChange}
                value={form.allergenInformation}
                readOnly={false}
                error={errors.allergenInformation}
                required
              />
            </div>

            <div className="flex flex-col gap-0" data-field="nutritionalInfoType">
              <label className={fieldLabel}>Nutritional Information Table {requiredStar}</label>
              <Dropdown
                label=""
                options={nutritionalInfoOptions}
                value={form.nutritionalInfoType}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, nutritionalInfoType: value }));
                  if (value === "as-per-label") handleRemoveNutritionalImage();
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.nutritionalInfoType;
                    return newErrors;
                  });
                }}
                placeholder="Select option"
                error={errors.nutritionalInfoType ? " " : ""}
              />
              {errors.nutritionalInfoType && <p className={errorMsg}>{errors.nutritionalInfoType}</p>}
            </div>

            {form.nutritionalInfoType === "image-upload" && (
              <div data-field="nutritionalInfoImage">
                <UploadInput
                  onFileSelect={(file) => {
                    if (file) {
                      handleNutritionalImageUpload(file);
                    } else {
                      handleRemoveNutritionalImage();
                    }
                  }}
                  existingFile={existingNutritionalImageUrl || undefined}
                  label="Upload Nutritional Information Image"
                  placeholder="Upload the Nutritional Information Image"
                  accept="image/jpeg,image/png,image/jpg"
                />
                {errors.nutritionalInfoImage && <p className={errorMsg}>{errors.nutritionalInfoImage}</p>}
              </div>
            )}

            <div data-field="activeIngredients">
              <Input
                label="Active Ingredients"
                name="activeIngredients"
                placeholder="e.g., Vitamin C, Protein"
                onChange={handleChange}
                value={form.activeIngredients}
                readOnly={isEditMode}
                error={errors.activeIngredients}
                required
              />
            </div>

            <div data-field="additivesPreservatives">
              <Input
                label="Additives / Preservatives"
                name="additivesPreservatives"
                placeholder="e.g., Citric acid"
                onChange={handleChange}
                value={form.additivesPreservatives}
                readOnly={false}
                error={errors.additivesPreservatives}
                required
              />
            </div>

            <div data-field="productClaims">
              <Input
                label="Product Claims"
                name="productClaims"
                placeholder="e.g., Gluten-free"
                onChange={handleChange}
                value={form.productClaims}
                readOnly={false}
                error={errors.productClaims}
                required
              />
            </div>

            <div className="flex flex-col gap-0" data-field="storageConditionId">
              <label className={fieldLabel}>Storage Condition {requiredStar}</label>
              <Dropdown
                options={storageConditions}
                value={form.storageConditionId}
                onChange={(value) => {
                  handleDropdownChange("storageConditionId", value);
                }}
                placeholder="Select storage condition"
                isDisabled={isFieldDisabled(false, true) || loadingStorageConditions}
                error={errors.storageConditionId ? " " : ""}
              />
              {errors.storageConditionId && <p className={errorMsg}>{errors.storageConditionId}</p>}
            </div>

            <div data-field="manufacturerName">
              <Input
                label="Manufacturer Name"
                name="manufacturerName"
                placeholder="Manufacturer company name"
                onChange={handleChange}
                value={form.manufacturerName}
                readOnly={isEditMode}
                error={errors.manufacturerName}
                required
              />
            </div>

            {/* Certifications / Compliance - CheckboxDropdown */}
            <div className="flex flex-col gap-0" data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
              <CheckboxDropdown
                label=""
                options={certificationsMaster}
                selectedValues={selectedCertificationValues}
                onChange={handleCertificationSelectionChange}
                placeholder="Select certifications"
                disabled={loadingCertifications}
                showSelectAll={false}
                error={errors.certifications ? " " : ""}
              />
              {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
            </div>

            {/* Upload Certifications - Individual UploadInputs */}
            {/* Upload Certifications - Individual UploadInputs */}
{/* Upload Certifications - Individual UploadInputs */}
{selectedCertificationValues.length === 0 ? (
  <div className="flex flex-col gap-0" data-field="certUploadFallback">
    <label className={fieldLabel}>Upload Certifications / Compliance {requiredStar}</label>
    <div className="flex items-center w-full h-[52px] rounded-lg border border-neutral-500 bg-white overflow-hidden">
      <div className="flex items-center justify-center h-full px-4 bg-secondary-800 rounded-md">
        <img src="/icons/UploadIcon.svg" className="w-6 h-6" />
      </div>
      <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
        <span className="text-pneutral-500 text-md">Select certifications first</span>
      </div>
    </div>
  </div>
) : (
  certificationsDetails.map((cert) => (
    <div key={cert.id} className="flex flex-col gap-0">
      <label className={fieldLabel}>Upload {cert.label} {requiredStar}</label>
      <UploadInput
        onFileSelect={(file) => {
          if (file) {
            handleCertificationFileUpload(cert.id, file);
          } else {
            handleCertRemove(cert.id);
          }
        }}
        existingFile={cert.existingUrl || undefined}
        label=""
        placeholder={`Upload the ${cert.label}`}
        accept=".pdf,.jpg,.jpeg,.png"
      />
    </div>
  ))
)}

            <div className="flex flex-col gap-0" data-field="countryOfOrigin">
              <label className={fieldLabel}>Country of Origin {requiredStar}</label>
              <Dropdown
                options={countries}
                value={form.countryOfOrigin}
                onChange={(value) => handleDropdownChange("countryOfOrigin", value)}
                placeholder="Select country"
                isDisabled={isEditMode || loadingCountries}
                error={errors.countryOfOrigin ? " " : ""}
              />
              {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
            </div>

            <div className="flex flex-col gap-1" data-field="manualFile">
              <label className={fieldLabel}>Upload Product Brochure / User Manual</label>
              <UploadInput
                onFileSelect={(file) => {
                  if (file) {
                    handleManualFileSelect(file);
                  } else {
                    handleManualFileSelect(null);
                    setExistingManualFile(null);
                  }
                }}
                existingFile={existingManualFile || undefined}
                label=""
                placeholder="Upload the Product Brochure"
                accept=".pdf"
              />
              {errors.manualFile && <p className={errorMsg}>{errors.manualFile}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1" data-field="productDescription">
                  <label className={fieldLabel}>Product Description {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                    name="productDescription"
                    value={form.productDescription}
                    onChange={handleChange}
                    placeholder="Detailed product description (Minimum 10 characters)"
                    rows={4}
                    className={`w-full rounded-lg p-3 resize-none border bg-white focus:outline-none transition-all duration-200 ${errors.productDescription ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-pneutral-300 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`}
                  />
                  {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
                </div>
                <div className="flex flex-col gap-1" data-field="warningsPrecautions">
                  <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
                    name="warningsPrecautions"
                    value={form.warningsPrecautions}
                    onChange={handleChange}
                    placeholder="Enter warnings, precautions, and safety information"
                    rows={4}
                    className={`w-full rounded-lg p-3 resize-none border bg-white focus:outline-none transition-all duration-200 ${errors.warningsPrecautions ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-pneutral-300 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`}
                  />
                  {errors.warningsPrecautions && <p className={errorMsg}>{errors.warningsPrecautions}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packaging & Order Details Section */}
        <div className="border border-neutral-200 rounded-xl p-6">
          <div className="text-h4 font-semibold">Packaging & Order Details</div>
          <div className="border-b border-neutral-200 mt-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
            <div className="flex flex-col gap-0" data-field="packType">
              <label className={fieldLabel}>Pack Type {requiredStar}</label>
              <Dropdown
                options={packTypes}
                value={form.packType}
                onChange={(value) => handleDropdownChange("packType", value)}
                placeholder="Select pack type"
                isDisabled={isFieldDisabled(false, true) || loadingPackTypes}
                error={errors.packType ? " " : ""}
              />
              {errors.packType && <p className={errorMsg}>{errors.packType}</p>}
            </div>

            <div data-field="unitsPerPack">
              <Input
                type="number"
                label="Number of Units per Pack Type"
                name="unitsPerPack"
                placeholder="e.g., 100"
                onChange={handleChange}
                value={form.unitsPerPack}
                readOnly={isFieldDisabled(false, true)}
                disabled={isFieldDisabled(false, true)}
                error={errors.unitsPerPack}
                required
              />
            </div>

            <div data-field="numberOfPacks">
              <Input
                type="number"
                label="Number of Packs"
                name="numberOfPacks"
                placeholder="e.g., 5"
                onChange={handleChange}
                value={form.numberOfPacks}
                readOnly={isFieldDisabled(false, true)}
                disabled={isFieldDisabled(false, true)}
                error={errors.numberOfPacks}
                required
              />
            </div>

            <div data-field="packSize">
              <Input
                label="Pack Size (auto-calculated)"
                name="packSize"
                value={form.packSize}
                readOnly
                required
              />
            </div>

            <div className="col-span-2 text-h6 font-normal mt-2">Order Details</div>
            <div className="col-span-2 border-b border-neutral-200"></div>

            <div data-field="minimumOrderQuantity">
              <Input
                type="number"
                label="Min Order Qty"
                name="minimumOrderQuantity"
                placeholder="Minimum quantity per order"
                onChange={handleChange}
                value={form.minimumOrderQuantity}
                readOnly={false}
                error={errors.minimumOrderQuantity}
                required
              />
            </div>

            <div data-field="maximumOrderQuantity">
              <Input
                type="number"
                label="Max Order Qty"
                name="maximumOrderQuantity"
                placeholder="Maximum quantity per order"
                onChange={handleChange}
                value={form.maximumOrderQuantity}
                readOnly={false}
                error={errors.maximumOrderQuantity}
                required
              />
            </div>

            <div className="col-span-2 text-h6 font-normal mt-2">Batch Management</div>
            <div className="col-span-2 border-b"></div>

            <div data-field="batchLotNumber">
              <Input
                label="Batch/Lot Number"
                name="batchLotNumber"
                placeholder="Enter batch number"
                onChange={handleChange}
                value={form.batchLotNumber}
                readOnly={isEditMode}
                error={errors.batchLotNumber}
                required
              />
            </div>

            {/* Manufacturing Date with MonthPicker */}
            <div className="relative" data-field="manufacturingDate">
              <Input
                label="Manufacturing Date"
                type="text"
                name="manufacturingDate"
                required
                readOnly={isEditMode}
                value={
                  form.manufacturingDate instanceof Date &&
                  !isNaN(form.manufacturingDate.getTime())
                    ? `${String(form.manufacturingDate.getMonth() + 1).padStart(2, "0")}/${form.manufacturingDate.getFullYear()}`
                    : ""
                }
                placeholder="MM/YYYY"
                onChange={() => {}}
                onClick={() => {
                  if (!isEditMode) {
                    setShowManufacturingMonthPicker(true);
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                error={errors.manufacturingDate}
              />

              {showManufacturingMonthPicker && !isEditMode && (
                <MonthPicker
                  selectedMonth={
                    form.manufacturingDate
                      ? form.manufacturingDate.getMonth()
                      : new Date().getMonth()
                  }
                  selectedYear={
                    form.manufacturingDate
                      ? form.manufacturingDate.getFullYear()
                      : new Date().getFullYear()
                  }
                  maxDate={new Date()}
                  onSelect={(month, year) =>
                    handleMonthSelect("manufacturingDate", month, year)
                  }
                  onClose={() => setShowManufacturingMonthPicker(false)}
                />
              )}
            </div>

            {/* Expiry Date with MonthPicker */}
            <div className="relative" data-field="expiryDate">
              <Input
                label="Expiry Date"
                name="expiryDate"
                type="text"
                required
                readOnly={isEditMode}
                value={
                  form.expiryDate instanceof Date &&
                  !isNaN(form.expiryDate.getTime())
                    ? `${String(form.expiryDate.getMonth() + 1).padStart(2, "0")}/${form.expiryDate.getFullYear()}`
                    : ""
                }
                placeholder="MM/YYYY"
                onChange={() => {}}
                onClick={() => {
                  if (!isEditMode) {
                    setShowExpiryMonthPicker(true);
                  }
                }}
                onFocus={() => {
                  if (!isEditMode) {
                    setShowExpiryMonthPicker(true);
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                error={errors.expiryDate}
              />

              {showExpiryMonthPicker && !isEditMode && (
                <MonthPicker
                  selectedMonth={
                    form.expiryDate
                      ? form.expiryDate.getMonth()
                      : new Date().getMonth()
                  }
                  selectedYear={
                    form.expiryDate
                      ? form.expiryDate.getFullYear()
                      : new Date().getFullYear()
                  }
                  minDate={
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth() + 4,
                      1,
                    )
                  }
                  maxDate={
                    form.manufacturingDate
                      ? new Date(
                          form.manufacturingDate.getFullYear() + 5,
                          form.manufacturingDate.getMonth(),
                          1,
                        )
                      : undefined
                  }
                  onSelect={(month, year) =>
                    handleMonthSelect("expiryDate", month, year)
                  }
                  onClose={() => setShowExpiryMonthPicker(false)}
                />
              )}
            </div>

            <div data-field="shelfLifeMonths">
              <Input
                type="number"
                label="Shelf Life (Months)"
                name="shelfLifeMonths"
                value={form.shelfLifeMonths}
                readOnly
                error={errors.shelfLifeMonths}
                required
              />
            </div>

            <div data-field="dateOfStockEntry">
              <Input
                label="Date of Entry"
                type="date"
                name="dateOfStockEntry"
                value={new Date().toISOString().split("T")[0]}
                disabled
              />
            </div>

            <div data-field="stockQuantity">
              <Input
                type="number"
                label="Stock Quantity (numbers w.r.t pack size)"
                name="stockQuantity"
                placeholder="Number of packs in stock"
                onChange={handleChange}
                value={form.stockQuantity}
                readOnly={isEditMode}
                error={errors.stockQuantity}
                required
              />
            </div>

            <div className="col-span-2 text-h6 font-normal mt-2">Pricing</div>
            <div className="col-span-2 border-b"></div>

            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div data-field="discountPercentage">
                    <Input
                      type="number"
                      label="Discount (%)"
                      name="discountPercentage"
                      placeholder="e.g., 10"
                      onChange={handleChange}
                      value={form.discountPercentage}
                      error={errors.discountPercentage}
                    />
                  </div>
                  <div data-field="mrp">
                    <Input
                      type="number"
                      label="MRP (per Pack Size)"
                      name="mrp"
                      placeholder="Maximum Retail Price"
                      onChange={handleChange}
                      value={form.mrp}
                      error={errors.mrp}
                      required
                    />
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div data-field="sellingPricePerPack">
                    <Input
                      type="number"
                      label="Selling Price (per Pack Size)"
                      name="sellingPricePerPack"
                      placeholder="Selling price per pack"
                      onChange={handleChange}
                      value={form.sellingPricePerPack}
                      error={errors.sellingPricePerPack}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setShowAdditionalDiscount(true)}
                      className="w-[237px] h-[52px] bg-transparent border-[2.5px] border-[#7D32FC] text-[#9659FD] font-heading font-medium text-[18px] leading-[28px] rounded-lg flex items-center justify-center gap-[12px] cursor-pointer hover:bg-purple-50 transition-all duration-200"
                    >
                      <svg width="14.24" height="14.24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                        <path d="M7 1v12M1 7h12" stroke="#9659FD" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      <span>Add Special Offers</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 text-h6 font-normal mt-2">TAX & BILLING</div>
            <div className="col-span-2 border-b"></div>

            <div data-field="hsnCode">
              <Input
                type="text"
                label="HSN Code"
                name="hsnCode"
                placeholder="HSN Code"
                onChange={handleChange}
                value={form.hsnCode}
                readOnly={isEditMode}
                error={errors.hsnCode}
                required
              />
            </div>

            <div className="flex flex-col gap-0" data-field="gstPercentage">
              <label className={fieldLabel}>GST % {requiredStar}</label>
              <Dropdown
                options={gstOptions}
                value={form.gstPercentage}
                onChange={(value) => handleDropdownChange("gstPercentage", value)}
                placeholder="Select GST %"
                isDisabled={isEditMode}
                error={errors.gstPercentage ? " " : ""}
              />
              {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
            </div>
          </div>
        </div>

        {/* Product Photos Section - Using ProductImageUpload component */}
        <ProductImageUpload
          title="Product Photos"
          required
          images={images}
          setImages={setImages}
          existingImages={existingImages}
          setExistingImages={setExistingImages}
          error={errors.images}
          setErrors={setErrors}
          isReadOnly={isEditMode}
          mode={mode}
        />

        {/* Action Buttons */}
        <div className="flex justify-between mt-6 pb-8">
          <div className="flex gap-4">
            <button type="button" onClick={() => router.back()} className="px-6 py-2 border-2 border-warning-500 rounded-lg text-warning-500 font-semibold">Cancel</button>
            <button type="button" className="px-6 py-2 bg-secondary-700 text-white rounded-lg flex items-center gap-2 font-semibold">
              <img src="/icons/SaveDraftIcon.svg" alt="save" className="w-5 h-5" />
              Save Draft
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-2 bg-primary-800 text-white rounded-lg font-semibold hover:bg-primary-900"
          >
            {isEditMode ? "Update" : "Submit"}
          </button>
        </div>
      </form>
    </>
  );
};

export default FoodInfantForm;










// code dated 27.05.2026........

// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import Input from "@/src/app/commonComponents/Input";
// import UploadInput from "../commonComponent/UploadInput";
// import PopupModal from "../commonComponent/PopupModal";
// import { foodInfantSchema } from "@/src/schema/product/FoodandInfantSchema";
// import Dropdown from "@/src/app/commonComponents/Dropdown";
// import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
// import {
//   getProductById,
//   updateProduct,
//   uploadProductImages,
// } from "@/src/services/product/ProductService";
// import {
//   getProductCategories,
//   getProductSubcategories,
//   getAgeGroups,
//   getProductForms,
//   getCountries,
//   getStorageConditionsByCategory,
//   getPackTypesByCategory,
//   getCertificationsByCategoryId,
//   uploadFoodInfantUserManual,
//   createFoodInfantProduct,
//   getFoodInfantAttributes,
//   uploadNutritionalInformationImage,
//   getNetQuantityUnits,
//   getServingSizeUnits,
// } from "@/src/services/product/FoodInfantService";

// import AdditionalDiscountType from "./AdditionalDiscountType";
// import CommonModal from "../commonComponent/CommonModal";

// import {
//   CreateProductRequest,
//   PackagingData,
//   PricingData,
//   AdditionalDiscountData,
//   SpecialSchemesData,
// } from "@/src/types/product/ProductData";

// interface SelectOption {
//   value: string;
//   label: string;
// }

// interface CertificationTag {
//   id: string;
//   label: string;
//   tagCode: string;
//   file: File | null;
//   fileName: string;
//   uploading: boolean;
//   isUploaded: boolean;
//   existingUrl?: string;
// }

// interface FoodInfantFormProps {
//   mode?: "create" | "edit";
//   productId?: string;
// }

// // Hardcoded GST options
// const gstOptions = [
//   { value: "0", label: "0%" },
//   { value: "5", label: "5%" },
//   { value: "12", label: "12%" },
//   { value: "18", label: "18%" },
// ];

// const dietaryOptions = [
//   { value: "veg", label: "Veg" },
//   { value: "non-veg", label: "Non-veg" },
// ];

// const nutritionalInfoOptions = [
//   { value: "as-per-label", label: "As per the label" },
//   { value: "image-upload", label: "Image upload" },
// ];

// // Styles
// const fieldLabel = "font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle text-pneutral-900";
// const requiredStar = <span className="text-warning-500 font-semibold ml-1">*</span>;
// const errorMsg = "font-heading font-normal text-sm leading-[28px] px-1 text-warning-500";

// // Helper to extract unit string from API response
// const extractUnitString = (item: any): string => {
//   if (typeof item === "string") return item;
//   if (!item || typeof item !== "object") return "";

//   if (typeof item.unitName === "string" && item.unitName.trim()) return item.unitName.trim();
//   if (typeof item.name === "string" && item.name.trim()) return item.name.trim();
//   if (typeof item.netQuantityUnitName === "string" && item.netQuantityUnitName.trim()) return item.netQuantityUnitName.trim();
//   if (typeof item.servingSizeUnitName === "string" && item.servingSizeUnitName.trim()) return item.servingSizeUnitName.trim();
//   if (typeof item.unit === "string" && item.unit.trim()) return item.unit.trim();
//   if (typeof item.label === "string" && item.label.trim()) return item.label.trim();
//   if (typeof item.unitSymbol === "string" && item.unitSymbol.trim()) return item.unitSymbol.trim();
  
//   const nestedUnit = item.netQuantityUnit || item.servingSizeUnit || item.unit;
//   if (nestedUnit && typeof nestedUnit === "object") {
//     if (typeof nestedUnit.unitName === "string" && nestedUnit.unitName.trim()) return nestedUnit.unitName.trim();
//     if (typeof nestedUnit.name === "string" && nestedUnit.name.trim()) return nestedUnit.name.trim();
//     if (typeof nestedUnit.unitSymbol === "string" && nestedUnit.unitSymbol.trim()) return nestedUnit.unitSymbol.trim();
//   }

//   for (const key of Object.keys(item)) {
//     const val = item[key];
//     if (typeof val === "string" && val.trim().length > 0 && isNaN(Number(val))) {
//       return val.trim();
//     }
//   }
//   return "";
// };

// // ─── Numeric Input with Unit Component ───────────────────────────────────
// interface NumericInputWithUnitProps {
//   label: string;
//   name: string;
//   value: string;
//   unit: string;
//   onValueChange: (val: string) => void;
//   onUnitChange: (unit: string) => void;
//   placeholder?: string;
//   error?: string;
//   required?: boolean;
//   disabled?: boolean;
//   readOnly?: boolean;
//   options: SelectOption[];
//   loading?: boolean;
// }

// const NumericInputWithUnit: React.FC<NumericInputWithUnitProps> = ({
//   label,
//   name,
//   value,
//   unit,
//   onValueChange,
//   onUnitChange,
//   placeholder = "",
//   error,
//   required = false,
//   disabled = false,
//   readOnly = false,
//   options,
//   loading = false,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleOutsideClick = (e: MouseEvent) => {
//       if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleOutsideClick);
//     return () => document.removeEventListener("mousedown", handleOutsideClick);
//   }, []);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const val = e.target.value;
//     if (val === "" || /^\d*\.?\d*$/.test(val)) {
//       onValueChange(val);
//     }
//   };

//   const getBorderColor = () => {
//     if (disabled) return "border-pneutral-300 bg-sneutral-100 cursor-not-allowed";
//     if (readOnly) return "border-pneutral-300 bg-pneutral-50 cursor-default";
//     if (error) return "border-warning-500 focus-within:ring-1 focus-within:ring-warning-500 focus-within:border-warning-500";
//     return "border-pneutral-300 focus-within:border-secondary-300 focus-within:ring-1 focus-within:ring-secondary-300";
//   };

//   const selectedUnitLabel = options.find(opt => opt.value === unit)?.label || unit;

//   return (
//     <div ref={containerRef} className="flex flex-col gap-0 w-full relative">
//       <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${disabled ? "text-pneutral-500" : "text-pneutral-900"}`}>
//         {label}
//         {required && <span className="text-warning-500 ml-1">*</span>}
//       </label>

//       <div className={`flex items-center h-[52px] w-full border rounded-lg bg-white overflow-hidden transition-all duration-200 ${getBorderColor()}`}>
//         <input
//           type="text"
//           name={name}
//           placeholder={placeholder}
//           value={value}
//           onChange={handleInputChange}
//           disabled={disabled || readOnly}
//           className="flex-1 h-full px-4 text-base outline-none border-none bg-transparent text-pneutral-800 placeholder:text-pneutral-500"
//         />

//         <div className="h-full border-l border-neutral-300"></div>

//         <button
//           type="button"
//           disabled={disabled || readOnly || loading}
//           onClick={() => !disabled && !readOnly && !loading && setIsOpen(!isOpen)}
//           className="w-[149px] h-full px-3 bg-pneutral-50 flex items-center justify-between gap-1 transition-colors hover:bg-neutral-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
//         >
//           <span className={unit ? "text-pneutral-800" : "text-pneutral-500"} style={{ fontWeight: 400, fontSize: "16px", lineHeight: "24px" }}>
//             {loading ? "Loading..." : (selectedUnitLabel || "Select Unit")}
//           </span>
//           <svg className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>

//         {isOpen && (
//           <div className="absolute right-0 top-[calc(100%+4px)] w-[149px] max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col py-1">
//             {options.map((opt) => (
//               <button
//                 key={opt.value}
//                 type="button"
//                 onClick={() => {
//                   onUnitChange(opt.value);
//                   setIsOpen(false);
//                 }}
//                 className={`w-full text-left px-4 py-2.5 text-sm text-pneutral-800 hover:bg-pneutral-50 transition-colors cursor-pointer font-medium ${unit === opt.value ? "bg-neutral-50 font-semibold" : ""}`}
//               >
//                 {opt.label}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {error && <p className="font-heading font-normal text-sm leading-[28px] px-1 text-warning-500 mt-1">{error}</p>}
//     </div>
//   );
// };

// const FoodInfantForm: React.FC<FoodInfantFormProps> = ({ mode = "create", productId }) => {
//   const router = useRouter();
//   const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
//   const setFieldRef = (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

//   const isEditMode = mode === "edit";
//   const [createdProductId, setCreatedProductId] = useState<string | null>(null);

//   const categoryId = 3;

//   // ---------- Form state ----------
//   const [form, setForm] = useState({
//     productName: "",
//     productDescription: "",
//     warningsPrecautions: "",
//     productCategory: "",
//     productCategoryName: "",
//     productSubcategory: "",
//     productSubcategoryName: "",
//     brandName: "",
//     variantName: "",
//     productForm: "",
//     netQuantityValue: "",
//     netQuantityUnit: "",
//     netQuantityUnitId: 0,
//     servingSizeValue: "",
//     servingSizeUnit: "",
//     servingSizeUnitId: 0,
//     ageGroup: [] as string[],
//     dietaryClassification: "" as "veg" | "non-veg" | "",
//     allergenInformation: "",
//     nutritionalInfoType: "as-per-label",
//     nutritionalInfoImage: null as File | null,
//     activeIngredients: "",
//     additivesPreservatives: "",
//     productClaims: "",
//     storageConditionId: "",
//     manufacturerName: "",
//     countryOfOrigin: "",
//     packType: "",
//     unitsPerPack: "",
//     numberOfPacks: "",
//     packSize: "",
//     minimumOrderQuantity: "",
//     maximumOrderQuantity: "",
//     batchLotNumber: "",
//     manufacturingDate: null as Date | null,
//     expiryDate: null as Date | null,
//     shelfLifeMonths: "",
//     stockQuantity: "",
//     dateOfStockEntry: new Date(),
//     mrp: "",
//     sellingPricePerPack: "",
//     discountPercentage: "",
//     gstPercentage: "",
//     hsnCode: "",
//     manualFile: null as File | null,
//     finalPrice: "",
//   });

//   // ---------- Dropdown data ----------
//   const [categories, setCategories] = useState<SelectOption[]>([]);
//   const [subcategories, setSubcategories] = useState<SelectOption[]>([]);
//   const [ageGroups, setAgeGroups] = useState<SelectOption[]>([]);
//   const [productForms, setProductForms] = useState<SelectOption[]>([]);
//   const [countries, setCountries] = useState<SelectOption[]>([]);
//   const [storageConditions, setStorageConditions] = useState<SelectOption[]>([]);
//   const [packTypes, setPackTypes] = useState<SelectOption[]>([]);
//   const [certificationsMaster, setCertificationsMaster] = useState<SelectOption[]>([]);
//   const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);

//   // Unit options states
//   const [netQuantityUnitOptions, setNetQuantityUnitOptions] = useState<SelectOption[]>([]);
//   const [netQuantityUnitsList, setNetQuantityUnitsList] = useState<any[]>([]);
//   const [loadingNetQuantityUnits, setLoadingNetQuantityUnits] = useState(false);
//   const [servingSizeUnitOptions, setServingSizeUnitOptions] = useState<SelectOption[]>([]);
//   const [servingSizeUnitsList, setServingSizeUnitsList] = useState<any[]>([]);
//   const [loadingServingSizeUnits, setLoadingServingSizeUnits] = useState(false);

//   // Certifications state - ORIGINAL PATTERN
//   const [selectedCertificationValues, setSelectedCertificationValues] = useState<string[]>([]);
//   const [certificationsDetails, setCertificationsDetails] = useState<CertificationTag[]>([]);

//   // Additional discounts and special schemes
//   const [additionalDiscounts, setAdditionalDiscounts] = useState<AdditionalDiscountData[]>([]);
//   const [specialSchemes, setSpecialSchemes] = useState<SpecialSchemesData[]>([]);

//   // UI state
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [images, setImages] = useState<File[]>([]);
//   const [existingImages, setExistingImages] = useState<string[]>([]);
//   const [existingManualFile, setExistingManualFile] = useState<string | null>(null);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
//   const [modalType, setModalType] = useState<"create" | "update">("create");
//   const [productAttributeId, setProductAttributeId] = useState<string | null>(null);
//   const [existingNutritionalImageUrl, setExistingNutritionalImageUrl] = useState<string | null>(null);

//   // Loading states
//   const [loadingCategories, setLoadingCategories] = useState(false);
//   const [loadingSubcategories, setLoadingSubcategories] = useState(false);
//   const [loadingAgeGroups, setLoadingAgeGroups] = useState(false);
//   const [loadingProductForms, setLoadingProductForms] = useState(false);
//   const [loadingCountries, setLoadingCountries] = useState(false);
//   const [loadingStorageConditions, setLoadingStorageConditions] = useState(false);
//   const [loadingPackTypes, setLoadingPackTypes] = useState(false);
//   const [loadingCertifications, setLoadingCertifications] = useState(false);
//   const [ageGroupOptionsMap, setAgeGroupOptionsMap] = useState<Map<string, string>>(new Map());

//   // Stock-based edit restrictions
//   const currentStockQuantity = Number(form.stockQuantity) || 0;
//   const isStockZero = currentStockQuantity === 0;
//   const canEditStockDependent = !isEditMode || (isEditMode && isStockZero);

//   const isFieldDisabled = (isEditable: boolean, isStockDependent: boolean = false): boolean => {
//     if (!isEditMode) return false;
//     if (!isEditable) return true;
//     if (isStockDependent && !canEditStockDependent) return true;
//     return false;
//   };

//   const formatMonthYear = (date: Date | string | null): string => {
//     if (!date) return "";
//     let d: Date;
//     if (date instanceof Date) d = date;
//     else if (typeof date === "string") d = new Date(date);
//     else return "";
//     if (isNaN(d.getTime())) return "";
//     return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
//   };

//   const calculatePackSize = () => {
//     const units = Number(form.unitsPerPack) || 0;
//     const packs = Number(form.numberOfPacks) || 0;
//     return units * packs;
//   };

//   const calculateShelfLife = () => {
//     if (!form.manufacturingDate || !form.expiryDate) return "";
//     const mfg = form.manufacturingDate instanceof Date ? form.manufacturingDate : new Date(form.manufacturingDate);
//     const exp = form.expiryDate instanceof Date ? form.expiryDate : new Date(form.expiryDate);
//     if (isNaN(mfg.getTime()) || isNaN(exp.getTime())) return "";
//     const months = (exp.getFullYear() - mfg.getFullYear()) * 12 + (exp.getMonth() - mfg.getMonth());
//     return months >= 0 ? months.toString() : "";
//   };

//   // ORIGINAL CERTIFICATION FUNCTIONS
//   const handleCertificationSelectionChange = (selectedValues: string[]) => {
//     setSelectedCertificationValues(selectedValues);
//     setCertificationsDetails((prev) => {
//       const filtered = prev.filter((cert) => selectedValues.includes(cert.id));
//       for (const val of selectedValues) {
//         if (!filtered.some((c) => c.id === val)) {
//           const option = certificationsMaster.find((opt) => opt.value === val);
//           if (option) {
//             filtered.push({
//               id: option.value,
//               label: option.label,
//               tagCode: (option as any).tagCode || option.label.slice(0, 4).toUpperCase(),
//               file: null,
//               fileName: "",
//               uploading: false,
//               isUploaded: false,
//             });
//           }
//         }
//       }
//       return filtered;
//     });
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.certifications;
//       return newErrors;
//     });
//   };

//   const handleCertificationFileUpload = (certId: string, file: File) => {
//     if (file.size > 5 * 1024 * 1024) { alert("File size must be less than 5 MB"); return; }
//     setCertificationsDetails((prev) =>
//       prev.map((cert) => (cert.id === certId ? { ...cert, uploading: true } : cert))
//     );
//     setTimeout(() => {
//       setCertificationsDetails((prev) =>
//         prev.map((cert) =>
//           cert.id === certId
//             ? { ...cert, file, fileName: file.name, uploading: false, isUploaded: true }
//             : cert
//         )
//       );
//     }, 100);
//   };

//   const handleCertRemove = (certId: string) => {
//     setCertificationsDetails((prev) =>
//       prev.map((c) =>
//         c.id === certId
//           ? { ...c, file: null, fileName: "", isUploaded: false, existingUrl: undefined }
//           : c
//       )
//     );
//   };

//   const validateCertifications = (): string | null => {
//     if (selectedCertificationValues.length === 0) {
//       return "At least one certification is required";
//     }
//     const missingFiles = certificationsDetails.filter(
//       (cert) => !cert.isUploaded && !cert.existingUrl
//     );
//     if (missingFiles.length > 0) {
//       return `Please upload file for: ${missingFiles.map(c => c.label).join(", ")}`;
//     }
//     return null;
//   };

//   // Validation functions
//   const validateCrossFields = () => {
//     const newErrors: Record<string, string> = {};
    
//     // 1. Max Order Qty > Min Order Qty (strictly greater)
//     const minQty = Number(form.minimumOrderQuantity) || 0;
//     const maxQty = Number(form.maximumOrderQuantity) || 0;
//     if (minQty > 0 && maxQty > 0 && maxQty <= minQty) {
//       newErrors.maximumOrderQuantity = "Max Order Qty must be greater than Min Order Qty";
//     }
    
//     // 2. Stock Quantity >= Min Order Qty
//     const stockQty = Number(form.stockQuantity) || 0;
//     if (stockQty > 0 && minQty > 0 && stockQty < minQty) {
//       newErrors.stockQuantity = `Stock Quantity must be greater than or equal to Min Order Qty (${minQty})`;
//     }
    
//     // 3. Selling Price < MRP
//     const mrp = Number(form.mrp) || 0;
//     const selling = Number(form.sellingPricePerPack) || 0;
//     if (selling > 0 && mrp > 0 && selling >= mrp) {
//       newErrors.sellingPricePerPack = "Selling Price must be less than MRP";
//     }
    
//     // 4. Discount between 0-100
//     const discount = Number(form.discountPercentage);
//     if (form.discountPercentage !== "" && (isNaN(discount) || discount < 0 || discount > 100)) {
//       newErrors.discountPercentage = "Discount must be between 0 and 100";
//     }
    
//     // 5. HSN Code validation
//     const hsn = form.hsnCode;
//     if (hsn) {
//       const isValidLength = [4, 6, 8].includes(hsn.length);
//       const isNumeric = /^\d+$/.test(hsn);
//       if (!isNumeric) {
//         newErrors.hsnCode = "HSN Code must contain only numbers";
//       } else if (!isValidLength) {
//         newErrors.hsnCode = "HSN Code must be 4, 6, or 8 digits";
//       }
//     }
    
//     // 6. Shelf life validation
//     const shelfLife = Number(form.shelfLifeMonths);
//     if (form.shelfLifeMonths && !isNaN(shelfLife) && shelfLife > 60) {
//       newErrors.shelfLifeMonths = "Shelf life cannot exceed 5 years (60 months)";
//     }
    
//     setErrors((prev) => ({ ...prev, ...newErrors }));
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;

//     setForm((prev) => {
//       const updated = { ...prev, [name]: value };
//       if (name === "unitsPerPack" || name === "numberOfPacks") {
//         updated.packSize = String(calculatePackSize());
//       }
      
//       if (name === "sellingPricePerPack" || name === "gstPercentage") {
//         const currentSP = Number(updated.sellingPricePerPack) || 0;
//         const gst = Number(updated.gstPercentage) || 0;
//         if (currentSP > 0) {
//           updated.finalPrice = (currentSP + (currentSP * gst) / 100).toFixed(2);
//         }
//       }

//       return updated;
//     });

//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors[name];
//       return newErrors;
//     });
    
//     // Run cross-field validations after state update
//     setTimeout(() => {
//       const currentMinQty = name === "minimumOrderQuantity" ? Number(value) : Number(form.minimumOrderQuantity);
//       const currentMaxQty = name === "maximumOrderQuantity" ? Number(value) : Number(form.maximumOrderQuantity);
//       const currentStockQty = name === "stockQuantity" ? Number(value) : Number(form.stockQuantity);
      
//       // Validate Max Qty > Min Qty
//       if (currentMaxQty > 0 && currentMinQty > 0 && currentMaxQty <= currentMinQty) {
//         setErrors((prev) => ({
//           ...prev,
//           maximumOrderQuantity: "Max Order Qty must be greater than Min Order Qty"
//         }));
//       } else if (name === "minimumOrderQuantity" || name === "maximumOrderQuantity") {
//         setErrors((prev) => {
//           const newErrors = { ...prev };
//           delete newErrors.maximumOrderQuantity;
//           return newErrors;
//         });
//       }
      
//       // Validate Stock Qty >= Min Qty
//       if (currentStockQty > 0 && currentMinQty > 0 && currentStockQty < currentMinQty) {
//         setErrors((prev) => ({
//           ...prev,
//           stockQuantity: `Stock Quantity must be greater than or equal to Min Order Qty (${currentMinQty})`
//         }));
//       } else if (name === "minimumOrderQuantity" || name === "stockQuantity") {
//         setErrors((prev) => {
//           const newErrors = { ...prev };
//           delete newErrors.stockQuantity;
//           return newErrors;
//         });
//       }
      
//       // Validate Selling Price < MRP
//       const currentMrp = name === "mrp" ? Number(value) : Number(form.mrp);
//       const currentSelling = name === "sellingPricePerPack" ? Number(value) : Number(form.sellingPricePerPack);
//       if (currentSelling > 0 && currentMrp > 0 && currentSelling >= currentMrp) {
//         setErrors((prev) => ({
//           ...prev,
//           sellingPricePerPack: "Selling Price must be less than MRP"
//         }));
//       } else if (name === "mrp" || name === "sellingPricePerPack") {
//         setErrors((prev) => {
//           const newErrors = { ...prev };
//           delete newErrors.sellingPricePerPack;
//           return newErrors;
//         });
//       }
//     }, 100);
//   };

//   const handleNetQuantityValueChange = (val: string) => {
//     setForm((prev) => ({ ...prev, netQuantityValue: val }));
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.netQuantityValue;
//       delete newErrors.netQuantity;
//       return newErrors;
//     });
//   };

//   const handleNetQuantityUnitChange = (unit: string) => {
//     const matchedItem = netQuantityUnitsList.find((item) => extractUnitString(item) === unit);
//     const unitId = matchedItem ? (matchedItem.unitId || matchedItem.id) : 0;
//     setForm((prev) => ({ ...prev, netQuantityUnit: unit, netQuantityUnitId: unitId }));
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.netQuantityUnit;
//       return newErrors;
//     });
//   };

//   const handleServingSizeValueChange = (val: string) => {
//     setForm((prev) => ({ ...prev, servingSizeValue: val }));
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.servingSizeValue;
//       return newErrors;
//     });
//   };

//   const handleServingSizeUnitChange = (unit: string) => {
//     const matchedItem = servingSizeUnitsList.find((item) => extractUnitString(item) === unit);
//     const unitId = matchedItem ? (matchedItem.id || matchedItem.unitId) : 0;
//     setForm((prev) => ({ ...prev, servingSizeUnit: unit, servingSizeUnitId: unitId }));
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.servingSizeUnit;
//       return newErrors;
//     });
//   };

//   const handleDropdownChange = (field: string, value: string) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors[field];
//       return newErrors;
//     });
//     setTimeout(() => {
//       validateCrossFields();
//     }, 100);
//   };

//   const handleCategoryChange = async (value: string, label: string) => {
//     setForm((prev) => ({
//       ...prev,
//       productCategory: value,
//       productCategoryName: label,
//       productSubcategory: "",
//     }));
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.productCategory;
//       delete newErrors.productSubcategory;
//       return newErrors;
//     });
//     setLoadingSubcategories(true);
//     try {
//       const subData = await getProductSubcategories(Number(value));
//       const subs = subData.map((item: any) => ({
//         value: String(item.productSubcategoryId),
//         label: item.productSubcategory,
//       }));
//       setSubcategories(subs);
//     } catch (err) {
//       console.error("Failed to load subcategories", err);
//       setSubcategories([]);
//     } finally {
//       setLoadingSubcategories(false);
//     }
//   };

//   const handleManualFileSelect = (file: File | null) => {
//     if (file && file.type !== "application/pdf") {
//       setErrors((prev) => ({ ...prev, manualFile: "Only PDF files are allowed" }));
//       return;
//     }
//     if (file && file.size > 5 * 1024 * 1024) {
//       setErrors((prev) => ({ ...prev, manualFile: "File size must be less than 5 MB" }));
//       return;
//     }
//     setForm((prev) => ({ ...prev, manualFile: file }));
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.manualFile;
//       return newErrors;
//     });
//   };

//   const handleNutritionalImageUpload = (file: File | null) => {
//     if (file && !file.type.startsWith("image/")) {
//       setErrors((prev) => ({ ...prev, nutritionalInfoImage: "Only image files are allowed" }));
//       return;
//     }
//     if (file && file.size > 5 * 1024 * 1024) {
//       setErrors((prev) => ({ ...prev, nutritionalInfoImage: "File size must be less than 5 MB" }));
//       return;
//     }
//     setForm((prev) => ({ ...prev, nutritionalInfoImage: file }));
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.nutritionalInfoImage;
//       return newErrors;
//     });
//   };

//   const handleRemoveNutritionalImage = () => {
//     setForm((prev) => ({ ...prev, nutritionalInfoImage: null }));
//     setExistingNutritionalImageUrl(null);
//   };

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return;
//     const newFiles = Array.from(e.target.files);
//     const total = existingImages.length + images.length + newFiles.length;
//     if (total > 5) {
//       setErrors((prev) => ({ ...prev, images: "Maximum 5 images allowed" }));
//       const allowed = 5 - (existingImages.length + images.length);
//       if (allowed > 0) setImages((prev) => [...prev, ...newFiles.slice(0, allowed)]);
//       return;
//     }
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors.images;
//       return newErrors;
//     });
//     setImages((prev) => [...prev, ...newFiles]);
//   };

//   const removeExistingImage = (index: number) => {
//     setExistingImages((prev) => prev.filter((_, i) => i !== index));
//   };

//   const removeNewImage = (index: number) => {
//     setImages((prev) => prev.filter((_, i) => i !== index));
//   };

//   const getMinExpiryMonth = () => {
//     if (!form.manufacturingDate) return "";
//     const minDate = new Date(form.manufacturingDate);
//     minDate.setMonth(minDate.getMonth() + 3);
//     return `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
//   };

//   const getMinExpiryFromToday = () => {
//     const today = new Date();
//     const minDate = new Date();
//     minDate.setMonth(today.getMonth() + 3);
//     return `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
//   };

//   const getMaxManufacturingMonth = () => {
//     const today = new Date();
//     return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
//   };

//   // ---------- Fetch master data ----------
//   useEffect(() => {
//     const fetchMasterData = async () => {
//       setLoadingCategories(true);
//       try {
//         const catData = await getProductCategories(3);
//         setCategories(
//           catData.map((c: any) => ({ value: String(c.productCategoryId), label: c.productCategory }))
//         );
//       } catch (err) {
//         console.error("Failed to fetch categories", err);
//       } finally {
//         setLoadingCategories(false);
//       }

//       setLoadingAgeGroups(true);
//       try {
//         const ageData = await getAgeGroups();
//         const ageOpts = ageData.map((a: any) => ({ value: String(a.ageGroupId), label: a.ageGroup }));
//         setAgeGroups(ageOpts);
//         const map = new Map<string, string>();
//         ageOpts.forEach((opt: { value: string; label: string }) => map.set(opt.value, opt.label));
//         setAgeGroupOptionsMap(map);
//       } catch (err) {
//         console.error("Failed to fetch age groups", err);
//       } finally {
//         setLoadingAgeGroups(false);
//       }

//       setLoadingProductForms(true);
//       try {
//         const formData = await getProductForms();
//         setProductForms(
//           formData.map((f: any) => ({ value: String(f.productFormId), label: f.productForm }))
//         );
//       } catch (err) {
//         console.error("Failed to fetch product forms", err);
//       } finally {
//         setLoadingProductForms(false);
//       }

//       setLoadingCountries(true);
//       try {
//         const countryData = await getCountries();
//         if (Array.isArray(countryData)) {
//           setCountries(
//             countryData.map((c: any) => ({
//               value: String(c.countryId ?? c.id),
//               label: c.countryName ?? c.name,
//             }))
//           );
//         }
//       } catch (err) {
//         console.error("Failed to fetch countries", err);
//       } finally {
//         setLoadingCountries(false);
//       }

//       setLoadingStorageConditions(true);
//       try {
//         const storageData = await getStorageConditionsByCategory(3); 
//         setStorageConditions(
//           (storageData || []).map((s: any) => ({
//             value: String(s.storageConditionId ?? s.id),
//             label: s.conditionName ?? s.condition ?? s.name,
//           }))
//         );
//       } catch (err) {
//         console.error("Failed to fetch storage conditions", err);
//       } finally {
//         setLoadingStorageConditions(false);
//       }

//       setLoadingPackTypes(true);
//       try {
//         const packData = await getPackTypesByCategory(3);
//         if (Array.isArray(packData)) {
//           setPackTypes(
//             packData.map((p: any) => ({
//               value: String(p.packId ?? p.id),
//               label: p.packType ?? p.type ?? p.name,
//             }))
//           );
//         }
//       } catch (err) {
//         console.error("Failed to fetch pack types", err);
//       } finally {
//         setLoadingPackTypes(false);
//       }

//       setLoadingCertifications(true);
//       try {
//         const certData = await getCertificationsByCategoryId(3);
//         setCertificationsMaster(
//           (certData || []).map((c: any) => ({
//             value: String(c.id ?? c.certificationId),
//             label: c.name ?? c.certificationName,
//             tagCode: c.code ?? (c.name?.slice(0, 4).toUpperCase() ?? "CERT"),
//           }))
//         );
//       } catch (err) {
//         console.error("Failed to fetch certifications", err);
//       } finally {
//         setLoadingCertifications(false);
//       }

//       setLoadingNetQuantityUnits(true);
//       try {
//         const data = await getNetQuantityUnits(3);
//         if (Array.isArray(data)) {
//           setNetQuantityUnitsList(data);
//           const parsedUnits = data.map((item: any) => {
//             let displayName = "";
//             if (item.unitName && item.unitName.trim()) {
//               displayName = item.unitName.trim();
//             } else if (item.name && item.name.trim()) {
//               displayName = item.name.trim();
//             } else if (item.unitSymbol && item.unitSymbol.trim()) {
//               displayName = item.unitSymbol.trim();
//             } else {
//               displayName = extractUnitString(item);
//             }
//             return { value: displayName, label: displayName };
//           });
//           const uniqueUnits = Array.from(new Map(parsedUnits.map(u => [u.value, u])).values());
//           setNetQuantityUnitOptions(uniqueUnits);
//         }
//       } catch (err) {
//         console.error("Failed to fetch net quantity units", err);
//       } finally {
//         setLoadingNetQuantityUnits(false);
//       }
//     };
//     fetchMasterData();
//   }, []);

//   useEffect(() => {
//     if (!form.productForm) {
//       setServingSizeUnitOptions([]);
//       setServingSizeUnitsList([]);
//       return;
//     }
//     const fetchServingSizeUnits = async () => {
//       setLoadingServingSizeUnits(true);
//       try {
//         const data = await getServingSizeUnits(form.productForm);
//         if (Array.isArray(data)) {
//           setServingSizeUnitsList(data);
//           const parsedUnits = Array.from(new Set(data.map(extractUnitString).filter((u): u is string => typeof u === "string" && u.trim().length > 0)));
//           setServingSizeUnitOptions(parsedUnits.map(unit => ({ value: unit, label: unit })));
//         }
//       } catch (error) {
//         console.error("Error fetching serving size units:", error);
//       } finally {
//         setLoadingServingSizeUnits(false);
//       }
//     };
//     fetchServingSizeUnits();
//   }, [form.productForm]);

//   // ---------- Edit mode ----------
//   useEffect(() => {
//     if (isEditMode && productId && netQuantityUnitsList.length > 0) {
//       const fetchProduct = async () => {
//         try {
//           const prod = await getProductById(productId);
//           let attr = {};

//           if (prod.productAttributeFoodInfants && Array.isArray(prod.productAttributeFoodInfants) && prod.productAttributeFoodInfants.length > 0) {
//             attr = prod.productAttributeFoodInfants[0];
//           } else if (prod.productAttributeFoodInfant) {
//             attr = prod.productAttributeFoodInfant;
//           } else {
//             try {
//               const foodInfantAttr = await getFoodInfantAttributes(productId);
//               if (foodInfantAttr) attr = foodInfantAttr;
//             } catch (err) {
//               console.error("Failed to fetch attributes separately:", err);
//             }
//           }

//           const pricing = prod.pricingDetails?.[0] || {};
//           const packaging = prod.packagingDetails?.[0] || {};

//           let ageGroupArray: string[] = [];
//           if ((attr as any).ageGroupMastersDto && Array.isArray((attr as any).ageGroupMastersDto)) {
//             ageGroupArray = (attr as any).ageGroupMastersDto.map((ag: any) => String(ag.ageGroupId));
//           } else if ((attr as any).ageGroupIds && Array.isArray((attr as any).ageGroupIds)) {
//             ageGroupArray = (attr as any).ageGroupIds.map(String);
//           }

//           let netQuantityUnitValue = "";
//           let netQuantityUnitIdValue = 0;
//           if ((attr as any).unitId) {
//             netQuantityUnitIdValue = (attr as any).unitId;
//           }
//           if ((attr as any).unitName) {
//             netQuantityUnitValue = (attr as any).unitName;
//           } else if ((attr as any).netQuantityUnitName) {
//             netQuantityUnitValue = (attr as any).netQuantityUnitName;
//           }

//           if (netQuantityUnitIdValue > 0 && netQuantityUnitsList.length > 0 && !netQuantityUnitValue) {
//             const matchedUnit = netQuantityUnitsList.find((item: any) => 
//               item.unitId === netQuantityUnitIdValue || 
//               item.id === netQuantityUnitIdValue ||
//               Number(item.unitId) === netQuantityUnitIdValue ||
//               Number(item.id) === netQuantityUnitIdValue
//             );
//             if (matchedUnit) {
//               netQuantityUnitValue = matchedUnit.unitName || matchedUnit.name || matchedUnit.unitSymbol || extractUnitString(matchedUnit);
//               netQuantityUnitValue = netQuantityUnitValue?.trim();
//             }
//           }

//           let servingSizeUnitValue = "";
//           let servingSizeUnitIdValue = 0;
//           if ((attr as any).servingSizeUnit) {
//             if (typeof (attr as any).servingSizeUnit === "object") {
//               servingSizeUnitValue = (attr as any).servingSizeUnit.unitName || 
//                                      (attr as any).servingSizeUnit.name || 
//                                      (attr as any).servingSizeUnit.servingSizeUnitName || "";
//               servingSizeUnitIdValue = (attr as any).servingSizeUnit.unitId || 
//                                        (attr as any).servingSizeUnit.id || 0;
//             } else if (typeof (attr as any).servingSizeUnit === "string") {
//               servingSizeUnitValue = (attr as any).servingSizeUnit;
//             }
//           } else if ((attr as any).servingSizeUnitName) {
//             servingSizeUnitValue = (attr as any).servingSizeUnitName;
//             servingSizeUnitIdValue = (attr as any).servingSizeUnitId || 0;
//           }

//           if ((attr as any).nutritionalInformationImageUrl) {
//             setExistingNutritionalImageUrl((attr as any).nutritionalInformationImageUrl);
//           }

//           setForm({
//             productName: prod.productName || "",
//             productDescription: prod.productDescription || "",
//             warningsPrecautions: prod.warningsPrecautions || "",
//             productCategory: (attr as any).productCategoryId?.toString() || "",
//             productCategoryName: "",
//             productSubcategory: (attr as any).productSubcategoryId?.toString() || "",
//             productSubcategoryName: "",
//             brandName: (attr as any).brandName || "",
//             variantName: (attr as any).variantName || "",
//             productForm: (attr as any).productFormId?.toString() || "",
//             netQuantityValue: (attr as any).netQuantity?.toString() || "",
//             netQuantityUnit: netQuantityUnitValue,
//             netQuantityUnitId: netQuantityUnitIdValue,
//             servingSizeValue: (attr as any).servingSize?.toString() || "",
//             servingSizeUnit: servingSizeUnitValue,
//             servingSizeUnitId: servingSizeUnitIdValue,
//             ageGroup: ageGroupArray,
//             dietaryClassification: (attr as any).vegNonvegIndicator || "",
//             allergenInformation: (attr as any).allergenInformation || "",
//             nutritionalInfoType: (attr as any).nutritionalInformation === "image-upload" ? "image-upload" : "as-per-label",
//             nutritionalInfoImage: null,
//             activeIngredients: (attr as any).activeIngredients || "",
//             additivesPreservatives: (attr as any).additivesPreservatives || "",
//             productClaims: (attr as any).productClaims || "",
//             storageConditionId: (attr as any).storageConditionId?.toString() || "",
//             manufacturerName: (attr as any).manufacturerName || prod.manufacturerName || "",
//             countryOfOrigin: (attr as any).countryId?.toString() || "",
//             packType: packaging.packId?.toString() || packaging.packType?.toString() || "",
//             unitsPerPack: packaging.unitPerPack?.toString() || "",
//             numberOfPacks: packaging.numberOfPacks?.toString() || "",
//             packSize: packaging.packSize?.toString() || "",
//             minimumOrderQuantity: packaging.minimumOrderQuantity?.toString() || "",
//             maximumOrderQuantity: packaging.maximumOrderQuantity?.toString() || "",
//             batchLotNumber: pricing.batchLotNumber || "",
//             manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
//             expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
//             shelfLifeMonths: pricing.shelfLifeMonths?.toString() || "",
//             stockQuantity: pricing.stockQuantity?.toString() || "",
//             dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
//             mrp: pricing.mrp?.toString() || "",
//             sellingPricePerPack: pricing.sellingPrice?.toString() || "",
//             discountPercentage: pricing.discountPercentage?.toString() || "",
//             gstPercentage: pricing.gstPercentage?.toString() || "",
//             hsnCode: pricing.hsnCode?.toString() || "",
//             manualFile: null,
//             finalPrice: pricing.finalPrice?.toString() || "",
//           });

//           setExistingImages(prod.productImages?.map((img: any) => img.productImage) || []);
//           setExistingManualFile((attr as any).productUserManual || null);
//           setAdditionalDiscounts(pricing.additionalDiscounts || []);
//           setSpecialSchemes(pricing.specialSchemes || []);
//           setProductAttributeId((attr as any).productAttributeId || null);

//           // ORIGINAL CERTIFICATION LOADING FOR EDIT MODE
//           if ((attr as any).certificateDocuments?.length) {
//             const selected = (attr as any).certificateDocuments.map((c: any) => String(c.certificationId));
//             setSelectedCertificationValues(selected);
//             const certDocMap = new Map();
//             (attr as any).certificateDocuments.forEach((doc: any) => {
//               certDocMap.set(String(doc.certificationId), doc);
//             });
//             setCertificationsDetails(
//               selected.map((id: string) => {
//                 const certDoc = certDocMap.get(id);
//                 return {
//                   id,
//                   label: certDoc?.certificationName || "",
//                   tagCode: "",
//                   file: null,
//                   fileName: "",
//                   uploading: false,
//                   isUploaded: true,
//                   existingUrl: certDoc?.certificateUrl || "",
//                 };
//               })
//             );
//           }
//         } catch (err) {
//           console.error("Failed to load product for edit", err);
//         }
//       };
//       fetchProduct();
//     }
//   }, [isEditMode, productId, netQuantityUnitsList, servingSizeUnitsList]);

//   useEffect(() => {
//     setForm((prev) => ({ ...prev, packSize: String(calculatePackSize()) }));
//   }, [form.unitsPerPack, form.numberOfPacks]);

//   useEffect(() => {
//     const newShelfLife = calculateShelfLife();
//     setForm((prev) => ({ ...prev, shelfLifeMonths: newShelfLife }));
    
//     if (newShelfLife && Number(newShelfLife) > 60) {
//       setErrors((prev) => ({
//         ...prev,
//         shelfLifeMonths: "Shelf life cannot exceed 5 years (60 months)"
//       }));
//     } else {
//       setErrors((prev) => {
//         const newErrors = { ...prev };
//         delete newErrors.shelfLifeMonths;
//         return newErrors;
//       });
//     }
//   }, [form.manufacturingDate, form.expiryDate]);

//   // ---------- Build payload ----------
//   const buildPayload = (): CreateProductRequest => {
//     const toISODate = (date: Date | string | null): string | null => {
//       if (!date) return null;
//       let d = date instanceof Date ? date : new Date(date);
//       if (isNaN(d.getTime())) return null;
//       return d.toISOString();
//     };

//     const packaging: PackagingData = {
//       packId: Number(form.packType),
//       packType: form.packType,
//       unitPerPack: Number(form.unitsPerPack) || 0,
//       numberOfPacks: Number(form.numberOfPacks) || 0,
//       packSize: Number(form.packSize) || 0,
//       minimumOrderQuantity: Number(form.minimumOrderQuantity) || 0,
//       maximumOrderQuantity: Number(form.maximumOrderQuantity) || 0,
//     };

//     const pricing: PricingData = {
//       batchLotNumber: form.batchLotNumber,
//       manufacturingDate: toISODate(form.manufacturingDate),
//       expiryDate: toISODate(form.expiryDate),
//       dateOfStockEntry: new Date().toISOString(),
//       stockQuantity: Number(form.stockQuantity) || 0,
//       sellingPrice: Number(form.sellingPricePerPack) || 0,
//       mrp: Number(form.mrp) || 0,
//       gstPercentage: Number(form.gstPercentage) || 0,
//       discountPercentage: Number(form.discountPercentage) || 0,
//       finalPrice: Number(form.sellingPricePerPack) || 0,
//       hsnCode: Number(form.hsnCode) || 0,
//       shelfLifeMonths: Number(form.shelfLifeMonths) || 0,
//       additionalDiscounts: additionalDiscounts,
//       specialSchemes: specialSchemes,
//     };

//     const ageGroupMastersDto = form.ageGroup.map(id => ({
//       ageGroupId: Number(id)
//     }));
//     const firstAgeGroupId = form.ageGroup.length > 0 ? Number(form.ageGroup[0]) : 0;

//     const foodInfantAttr = {
//       productCategoryId: Number(form.productCategory),
//       productSubcategoryId: Number(form.productSubcategory),
//       brandName: form.brandName,
//       variantName: form.variantName,
//       productFormId: Number(form.productForm),
//       netQuantity: Number(form.netQuantityValue) || 0,
//       unitId: form.netQuantityUnitId,
//       servingSize: Number(form.servingSizeValue) || 0,
//       servingSizeUnitId: form.servingSizeUnitId,
//       ageGroupId: firstAgeGroupId,
//       ageGroupMastersDto: ageGroupMastersDto,
//       vegNonvegIndicator: form.dietaryClassification as "veg" | "non-veg",
//       allergenInformation: form.allergenInformation,
//       nutritionalInformation: form.nutritionalInfoType,
//       nutritionalInformationImageUrl: "",
//       activeIngredients: form.activeIngredients,
//       additivesPreservatives: form.additivesPreservatives,
//       productClaims: form.productClaims,
//       storageConditionId: form.storageConditionId ? Number(form.storageConditionId) : 0,
//       countryId: Number(form.countryOfOrigin),
//       certificateDocuments: certificationsDetails
//         .filter((c) => c.isUploaded)
//         .map((c) => ({
//           certificationId: Number(c.id),
//           certificateUrl: c.existingUrl || (c.file ? URL.createObjectURL(c.file) : ""),
//         })),
//       productUserManual: existingManualFile || "PENDING",
//     };

//     const payload: CreateProductRequest = {
//       productName: form.productName,
//       productDescription: form.productDescription,
//       warningsPrecautions: form.warningsPrecautions,
//       manufacturerName: form.manufacturerName,
//       categoryId: 3,
//       packagingDetails: [packaging],
//       pricingDetails: [pricing],
//       productAttributeFoodInfants: [foodInfantAttr],
//     };

//     return payload;
//   };

//   const validateForm = (): Record<string, string> => {
//     const newErrors: Record<string, string> = {};

//     if (!form.productName.trim()) newErrors.productName = "Product Name is required";
//     if (!form.productCategory) newErrors.productCategory = "Product Category is required";
//     if (!form.productSubcategory) newErrors.productSubcategory = "Product Subcategory is required";
//     if (!form.brandName.trim()) newErrors.brandName = "Brand Name is required";
//     if (!form.productForm) newErrors.productForm = "Product Form is required";
    
//     if (!form.netQuantityValue) {
//       newErrors.netQuantityValue = "Net Quantity is required";
//     } else if (isNaN(Number(form.netQuantityValue)) || Number(form.netQuantityValue) <= 0) {
//       newErrors.netQuantityValue = "Net Quantity must be a positive number";
//     }
//     if (!form.netQuantityUnit) newErrors.netQuantityUnit = "Please select a unit";
    
//     if (!form.servingSizeValue) {
//       newErrors.servingSizeValue = "Serving Size is required";
//     } else if (isNaN(Number(form.servingSizeValue)) || Number(form.servingSizeValue) <= 0) {
//       newErrors.servingSizeValue = "Serving Size must be a positive number";
//     }
//     if (!form.servingSizeUnit) newErrors.servingSizeUnit = "Please select a unit";
    
//     if (form.ageGroup.length === 0) newErrors.ageGroup = "At least one age group is required";
//     if (!form.dietaryClassification) newErrors.dietaryClassification = "Dietary classification is required";
//     if (!form.allergenInformation.trim()) newErrors.allergenInformation = "Allergen Information is required";
//     if (!form.nutritionalInfoType) newErrors.nutritionalInfoType = "Nutritional info type is required";
//     if (!form.activeIngredients.trim()) newErrors.activeIngredients = "Active ingredients are required";
//     if (!form.additivesPreservatives.trim()) newErrors.additivesPreservatives = "Additives/Preservatives are required";
//     if (!form.productClaims.trim()) newErrors.productClaims = "Product claims are required";
//     if (!form.storageConditionId) newErrors.storageConditionId = "Storage condition is required";
//     if (!form.manufacturerName.trim()) newErrors.manufacturerName = "Manufacturer Name is required";
//     if (!form.countryOfOrigin) newErrors.countryOfOrigin = "Country of origin is required";
//     if (!form.productDescription.trim()) newErrors.productDescription = "Product Description is required";
//     if (!form.warningsPrecautions.trim()) newErrors.warningsPrecautions = "Warnings/Precautions is required";
//     if (!form.packType) newErrors.packType = "Pack type is required";
//     if (!form.unitsPerPack) newErrors.unitsPerPack = "Number of Units per Pack Type is required";
//     if (!form.numberOfPacks) newErrors.numberOfPacks = "Number of Packs is required";
//     if (!form.minimumOrderQuantity) newErrors.minimumOrderQuantity = "Min Order Qty is required";
//     if (!form.maximumOrderQuantity) newErrors.maximumOrderQuantity = "Max Order Qty is required";
//     if (!form.batchLotNumber) newErrors.batchLotNumber = "Batch/Lot Number is required";
//     if (!form.manufacturingDate) newErrors.manufacturingDate = "Manufacturing Date is required";
//     if (!form.expiryDate) newErrors.expiryDate = "Expiry Date is required";
//     if (!form.stockQuantity) newErrors.stockQuantity = "Stock Quantity is required";
//     if (!form.mrp) newErrors.mrp = "MRP is required";
//     if (!form.sellingPricePerPack) newErrors.sellingPricePerPack = "Selling Price is required";
//     if (!form.gstPercentage) newErrors.gstPercentage = "GST % is required";
//     if (!form.hsnCode) newErrors.hsnCode = "HSN Code is required";

//     if (form.nutritionalInfoType === "image-upload" && !form.nutritionalInfoImage && !existingNutritionalImageUrl) {
//       newErrors.nutritionalInfoImage = "Nutritional Information Image is required";
//     }

//     if (images.length === 0 && existingImages.length === 0) {
//       newErrors.images = "At least one product image is required";
//     }
//     if (images.length > 5) newErrors.images = "Maximum 5 images allowed";

//     const certError = validateCertifications();
//     if (certError) newErrors.certifications = certError;

//     return newErrors;
//   };

//   const handleSubmit = async () => {
//     const certError = validateCertifications();
//     if (certError) {
//       setErrors((prev) => ({ ...prev, certifications: certError }));
//       const el = document.querySelector<HTMLElement>(`[data-field="certifications"]`);
//       if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
//       return;
//     }

//     const fieldErrors = validateForm();
//     if (Object.keys(fieldErrors).length > 0) {
//       setErrors(fieldErrors);
//       const firstKey = Object.keys(fieldErrors)[0];
//       const el = fieldRefs.current[firstKey] || document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
//       if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
//       return;
//     }

//     if (!validateCrossFields()) {
//       const firstErrorKey = Object.keys(errors)[0];
//       const el = fieldRefs.current[firstErrorKey] || document.querySelector<HTMLElement>(`[data-field="${firstErrorKey}"]`);
//       if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
//       return;
//     }

//     const payload = buildPayload();

//     try {
//       let response;
//       let newProductAttributeId = productAttributeId;
//       let newProductId = productId;

//       if (isEditMode && productId) {
//         response = await updateProduct(productId, payload);
//         setModalType("update");
//         setShowUpdateSuccessModal(true);

//         const updatedData = response?.data || response;
//         newProductAttributeId = updatedData?.productAttributeFoodInfants?.productAttributeId
//           || updatedData?.productAttributeFoodInfant?.productAttributeId
//           || productAttributeId;

//         setProductAttributeId(newProductAttributeId || null);

//         if (images.length > 0) {
//           await uploadProductImages(productId, images);
//         }

//         if (form.manualFile && newProductAttributeId) {
//           try {
//             await uploadFoodInfantUserManual(newProductAttributeId, form.manualFile);
//           } catch (err) {
//             console.warn("⚠️ User manual upload failed:", err);
//           }
//         }

//         if (form.nutritionalInfoImage && newProductAttributeId) {
//           try {
//             await uploadNutritionalInformationImage(newProductAttributeId, 3, form.nutritionalInfoImage);
//           } catch (err) {
//             console.warn("⚠️ Nutritional image upload failed:", err);
//           }
//         }
//       } else {
//         response = await createFoodInfantProduct(payload);

//         newProductId = response?.data?.productId;
//         newProductAttributeId = response?.data?.productAttributeFoodInfants?.[0]?.productAttributeId
//           || response?.data?.productAttributeFoodInfant?.productAttributeId;

//         if (!newProductId) {
//           throw new Error(`Product ID not returned from server.`);
//         }

//         setModalType("create");
//         setCreatedProductId(newProductId);
//         setProductAttributeId(newProductAttributeId || null);

//         if (images.length) {
//           await uploadProductImages(newProductId, images);
//         }

//         if (form.manualFile && newProductAttributeId) {
//           try {
//             await uploadFoodInfantUserManual(newProductAttributeId, form.manualFile);
//           } catch (err) {
//             console.warn("⚠️ User manual upload failed:", err);
//           }
//         }

//         if (form.nutritionalInfoImage && newProductAttributeId) {
//           try {
//             await uploadNutritionalInformationImage(newProductAttributeId, 3, form.nutritionalInfoImage);
//           } catch (err) {
//             console.warn("⚠️ Nutritional image upload failed:", err);
//           }
//         }

//         setShowSuccessModal(true);
//       }
//     } catch (err: any) {
//       console.error("Submit failed", err);
//       setErrors({ submit: err.message || "Submission failed" });
//       alert(`Failed to ${isEditMode ? "update" : "create"} product: ${err.message}`);
//     }
//   };

//   const resetForm = () => {
//     setForm({
//       productName: "", productDescription: "", warningsPrecautions: "",
//       productCategory: "", productCategoryName: "", productSubcategory: "", productSubcategoryName: "",
//       brandName: "", variantName: "", productForm: "",
//       netQuantityValue: "", netQuantityUnit: "", netQuantityUnitId: 0,
//       servingSizeValue: "", servingSizeUnit: "", servingSizeUnitId: 0,
//       ageGroup: [],
//       dietaryClassification: "", allergenInformation: "", nutritionalInfoType: "as-per-label", nutritionalInfoImage: null,
//       activeIngredients: "", additivesPreservatives: "", productClaims: "", storageConditionId: "",
//       manufacturerName: "", countryOfOrigin: "", packType: "", unitsPerPack: "", numberOfPacks: "", packSize: "",
//       minimumOrderQuantity: "", maximumOrderQuantity: "", batchLotNumber: "", manufacturingDate: null, expiryDate: null,
//       shelfLifeMonths: "", stockQuantity: "", dateOfStockEntry: new Date(), mrp: "", sellingPricePerPack: "",
//       discountPercentage: "", gstPercentage: "", hsnCode: "", manualFile: null,
//       finalPrice: "",
//     });
//     setImages([]);
//     setExistingImages([]);
//     setExistingManualFile(null);
//     setExistingNutritionalImageUrl(null);
//     setSelectedCertificationValues([]);
//     setCertificationsDetails([]);
//     setAdditionalDiscounts([]);
//     setSpecialSchemes([]);
//     setErrors({});
//   };

//   const handleViewProduct = () => {
//     if (createdProductId) {
//       router.push(`/seller_7a3b9f2c/products/view/${createdProductId}`);
//     } else if (productId) {
//       router.push(`/seller_7a3b9f2c/products/view/${productId}`);
//     } else {
//       window.location.reload();
//     }
//   };

//   const handleContinueEditing = () => {
//     setShowSuccessModal(false);
//     setShowUpdateSuccessModal(false);
//   };

//   const handleContinueAdding = () => {
//     setShowSuccessModal(false);
//     resetForm();
//   };

//   const handleBackToDashboard = () => {
//     router.push("/seller_7a3b9f2c/dashboard");
//   };

//   return (
//     <>
//       <PopupModal
//         isOpen={showSuccessModal}
//         title="Product Saved Successfully!"
//         description="Your product has been saved and is now live on the platform"
//         primaryActionText="View Product"
//         secondaryActionText="Continue Adding"
//         tertiaryActionText="Back to Dashboard"
//         onPrimaryAction={handleViewProduct}
//         onSecondaryAction={handleContinueAdding}
//         onTertiaryAction={handleBackToDashboard}
//         onClose={() => setShowSuccessModal(false)}
//       />

//       <PopupModal
//         isOpen={showUpdateSuccessModal}
//         title="Product Updated Successfully!"
//         description="Your product has been updated and is now live on the platform"
//         primaryActionText="View Product"
//         secondaryActionText="Continue Editing"
//         tertiaryActionText="Back to Dashboard"
//         onPrimaryAction={handleViewProduct}
//         onSecondaryAction={handleContinueEditing}
//         onTertiaryAction={handleBackToDashboard}
//         onClose={() => setShowUpdateSuccessModal(false)}
//       />

//       {showAdditionalDiscount && (
//         <CommonModal onClose={() => setShowAdditionalDiscount(false)} width="w-[600px]">
//           <div className="h-[80vh] overflow-y-auto flex flex-col p-6">
//             <AdditionalDiscountType
//               onClose={() => setShowAdditionalDiscount(false)}
//               categoryId={categoryId}
//               initialData={additionalDiscounts}
//               baseDiscountPercentage={Number(form.discountPercentage) || 0}
//               baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
//               onSaveAdditionalDiscount={(data: AdditionalDiscountData[]) => {
//                 setAdditionalDiscounts(data || []);
//               }}
//               initialSchemesData={specialSchemes}
//               onSaveSpecialSchemes={(data: SpecialSchemesData[]) => {
//                 setSpecialSchemes(data || []);
//                 setShowAdditionalDiscount(false);
//               }}
//             />
//           </div>
//         </CommonModal>
//       )}

//       <form
//         autoComplete="off"
//         onSubmit={(e) => e.preventDefault()}
//         className="flex flex-col gap-5 w-full max-w-full mx-auto bg-white"
//       >
//         {/* Product Details Section */}
//         <div className="border border-neutral-200 rounded-xl p-6">
//           <div className="text-h4 font-semibold">Product Details</div>
//           <div className="border-b border-neutral-200 mt-3"></div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
//             <div data-field="productName">
//               <Input
//                 label="Product Name"
//                 name="productName"
//                 placeholder="e.g., Organic Protein Powder"
//                 onChange={handleChange}
//                 value={form.productName}
//                 error={errors.productName}
//                 required
//                 readOnly={isEditMode}
//                 maxLength={150}
//               />
//             </div>

//             <div className="flex flex-col gap-0" data-field="productCategory">
//               <label className={fieldLabel}>Product Category {requiredStar}</label>
//               <Dropdown
//                 options={categories}
//                 value={form.productCategory}
//                 onChange={handleCategoryChange}
//                 placeholder="Select category"
//                 isDisabled={isEditMode || loadingCategories}
//                 error={errors.productCategory ? " " : ""}
//               />
//               {errors.productCategory && <p className={errorMsg}>{errors.productCategory}</p>}
//             </div>

//             <div className="flex flex-col gap-0" data-field="productSubcategory">
//               <label className={fieldLabel}>Product Subcategory {requiredStar}</label>
//               <Dropdown
//                 options={subcategories}
//                 value={form.productSubcategory}
//                 onChange={(value) => handleDropdownChange("productSubcategory", value)}
//                 placeholder="Select subcategory"
//                 isDisabled={isEditMode || !form.productCategory || loadingSubcategories}
//                 error={errors.productSubcategory ? " " : ""}
//               />
//               {errors.productSubcategory && <p className={errorMsg}>{errors.productSubcategory}</p>}
//             </div>

//             <div data-field="brandName">
//               <Input
//                 label="Brand Name"
//                 name="brandName"
//                 placeholder="e.g., Nestle, Abbott"
//                 onChange={handleChange}
//                 value={form.brandName}
//                 readOnly={isEditMode}
//                 error={errors.brandName}
//                 required
//                 maxLength={60}
//               />
//             </div>

//             <div data-field="variantName">
//               <Input
//                 label="Variant Name"
//                 name="variantName"
//                 placeholder="e.g., Chocolate, Vanilla"
//                 onChange={handleChange}
//                 value={form.variantName}
//                 readOnly={false}
//                 error={errors.variantName}
//               />
//             </div>

//             <div className="flex flex-col gap-0" data-field="productForm">
//               <label className={fieldLabel}>Product Form {requiredStar}</label>
//               <Dropdown
//                 options={productForms}
//                 value={form.productForm}
//                 onChange={(value) => {
//                   setForm((prev) => ({ ...prev, productForm: value, servingSizeValue: "", servingSizeUnit: "", servingSizeUnitId: 0 }));
//                   setErrors((prev) => {
//                     const newErrors = { ...prev };
//                     delete newErrors.productForm;
//                     return newErrors;
//                   });
//                 }}
//                 placeholder="Select product form"
//                 isDisabled={isEditMode || loadingProductForms}
//                 error={errors.productForm ? " " : ""}
//               />
//               {errors.productForm && <p className={errorMsg}>{errors.productForm}</p>}
//             </div>

//             <div data-field="netQuantity">
//               <NumericInputWithUnit
//                 label="Net Quantity"
//                 name="netQuantityValue"
//                 placeholder="Enter quantity"
//                 value={form.netQuantityValue}
//                 unit={form.netQuantityUnit}
//                 onValueChange={handleNetQuantityValueChange}
//                 onUnitChange={handleNetQuantityUnitChange}
//                 error={errors.netQuantityValue || errors.netQuantityUnit}
//                 required
//                 readOnly={isEditMode}
//                 options={netQuantityUnitOptions}
//                 loading={loadingNetQuantityUnits}
//               />
//             </div>

//             <div data-field="servingSize">
//               <NumericInputWithUnit
//                 label="Serving Size"
//                 name="servingSizeValue"
//                 placeholder="Enter serving size"
//                 value={form.servingSizeValue}
//                 unit={form.servingSizeUnit}
//                 onValueChange={handleServingSizeValueChange}
//                 onUnitChange={handleServingSizeUnitChange}
//                 error={errors.servingSizeValue || errors.servingSizeUnit}
//                 required
//                 readOnly={isEditMode}
//                 options={servingSizeUnitOptions}
//                 loading={loadingServingSizeUnits || !form.productForm}
//               />
//             </div>

//             <div className="flex flex-col gap-0" data-field="ageGroup">
//               <label className={fieldLabel}>Age Group {requiredStar}</label>
//               <CheckboxDropdown
//                 label=""
//                 options={ageGroups}
//                 selectedValues={form.ageGroup}
//                 onChange={(values) => {
//                   setForm((prev) => ({ ...prev, ageGroup: values }));
//                   setErrors((prev) => {
//                     const newErrors = { ...prev };
//                     delete newErrors.ageGroup;
//                     return newErrors;
//                   });
//                 }}
//                 placeholder="Select age group"
//                 required
//                 disabled={isEditMode || loadingAgeGroups}
//                 showSelectAll={false}
//                 error={errors.ageGroup ? " " : ""}
//               />
//               {errors.ageGroup && <p className={errorMsg}>{errors.ageGroup}</p>}
//             </div>

//             <div className="flex flex-col gap-1" data-field="dietaryClassification">
//               <label className={fieldLabel}>Dietary Classification {requiredStar}</label>
//               <div className="flex gap-6 mt-2">
//                 {dietaryOptions.map((option) => (
//                   <label key={option.value} className="flex items-center gap-2 cursor-pointer">
//                     <input
//                       type="radio"
//                       name="dietaryClassification"
//                       value={option.value}
//                       checked={form.dietaryClassification === option.value}
//                       onChange={(e) => {
//                         setForm(prev => ({ ...prev, dietaryClassification: e.target.value as "veg" | "non-veg" }));
//                         setErrors((prev) => {
//                           const newErrors = { ...prev };
//                           delete newErrors.dietaryClassification;
//                           return newErrors;
//                         });
//                       }}
//                       disabled={isEditMode}
//                       className="accent-primary-900 w-5 h-5"
//                     />
//                     <span>{option.label}</span>
//                   </label>
//                 ))}
//               </div>
//               {errors.dietaryClassification && <p className={errorMsg}>{errors.dietaryClassification}</p>}
//             </div>

//             <div data-field="allergenInformation">
//               <Input
//                 label="Allergen Information"
//                 name="allergenInformation"
//                 placeholder="e.g., Contains milk, soy (Min 3 chars)"
//                 onChange={handleChange}
//                 value={form.allergenInformation}
//                 readOnly={false}
//                 error={errors.allergenInformation}
//                 required
//               />
//             </div>

//             <div className="flex flex-col gap-0" data-field="nutritionalInfoType">
//               <label className={fieldLabel}>Nutritional Information Table {requiredStar}</label>
//               <Dropdown
//                 label=""
//                 options={nutritionalInfoOptions}
//                 value={form.nutritionalInfoType}
//                 onChange={(value) => {
//                   setForm((prev) => ({ ...prev, nutritionalInfoType: value }));
//                   if (value === "as-per-label") handleRemoveNutritionalImage();
//                   setErrors((prev) => {
//                     const newErrors = { ...prev };
//                     delete newErrors.nutritionalInfoType;
//                     return newErrors;
//                   });
//                 }}
//                 placeholder="Select option"
//                 error={errors.nutritionalInfoType ? " " : ""}
//               />
//               {errors.nutritionalInfoType && <p className={errorMsg}>{errors.nutritionalInfoType}</p>}
//             </div>

//             {form.nutritionalInfoType === "image-upload" && (
//               <div data-field="nutritionalInfoImage">
//                 <UploadInput
//                   onFileSelect={(file) => {
//                     if (file) {
//                       handleNutritionalImageUpload(file);
//                     } else {
//                       handleRemoveNutritionalImage();
//                     }
//                   }}
//                   existingFile={existingNutritionalImageUrl || undefined}
//                   label="Upload Nutritional Information Image"
//                   placeholder="Upload the Nutritional Information Image"
//                   accept="image/jpeg,image/png,image/jpg"
//                 />
//                 {errors.nutritionalInfoImage && <p className={errorMsg}>{errors.nutritionalInfoImage}</p>}
//               </div>
//             )}

//             <div data-field="activeIngredients">
//               <Input
//                 label="Active Ingredients"
//                 name="activeIngredients"
//                 placeholder="e.g., Vitamin C, Protein"
//                 onChange={handleChange}
//                 value={form.activeIngredients}
//                 readOnly={isEditMode}
//                 error={errors.activeIngredients}
//                 required
//               />
//             </div>

//             <div data-field="additivesPreservatives">
//               <Input
//                 label="Additives / Preservatives"
//                 name="additivesPreservatives"
//                 placeholder="e.g., Citric acid"
//                 onChange={handleChange}
//                 value={form.additivesPreservatives}
//                 readOnly={false}
//                 error={errors.additivesPreservatives}
//                 required
//               />
//             </div>

//             <div data-field="productClaims">
//               <Input
//                 label="Product Claims"
//                 name="productClaims"
//                 placeholder="e.g., Gluten-free"
//                 onChange={handleChange}
//                 value={form.productClaims}
//                 readOnly={false}
//                 error={errors.productClaims}
//                 required
//               />
//             </div>

//             <div className="flex flex-col gap-0" data-field="storageConditionId">
//               <label className={fieldLabel}>Storage Condition {requiredStar}</label>
//               <Dropdown
//                 options={storageConditions}
//                 value={form.storageConditionId}
//                 onChange={(value) => {
//                   handleDropdownChange("storageConditionId", value);
//                 }}
//                 placeholder="Select storage condition"
//                 isDisabled={isFieldDisabled(false, true) || loadingStorageConditions}
//                 error={errors.storageConditionId ? " " : ""}
//               />
//               {errors.storageConditionId && <p className={errorMsg}>{errors.storageConditionId}</p>}
//             </div>

//             <div data-field="manufacturerName">
//               <Input
//                 label="Manufacturer Name"
//                 name="manufacturerName"
//                 placeholder="Manufacturer company name"
//                 onChange={handleChange}
//                 value={form.manufacturerName}
//                 readOnly={isEditMode}
//                 error={errors.manufacturerName}
//                 required
//               />
//             </div>

//             {/* Certifications / Compliance - CheckboxDropdown */}
//             <div className="flex flex-col gap-0" data-field="certifications">
//               <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
//               <CheckboxDropdown
//                 label=""
//                 options={certificationsMaster}
//                 selectedValues={selectedCertificationValues}
//                 onChange={handleCertificationSelectionChange}
//                 placeholder="Select certifications"
//                 disabled={loadingCertifications}
//                 showSelectAll={false}
//                 error={errors.certifications ? " " : ""}
//               />
//               {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
//             </div>

//             {/* Upload Certifications - Individual UploadInputs */}
//             {selectedCertificationValues.length === 0 ? (
//               <div className="flex flex-col gap-0" data-field="certUploadFallback">
//                 <label className={fieldLabel}>Upload Certifications / Compliance {requiredStar}</label>
//                 <div className="flex items-center w-full h-[52px] rounded-lg border border-neutral-500 bg-white overflow-hidden">
//                   <div className="flex items-center justify-center h-full px-4 bg-secondary-800 rounded-md">
//                     <img src="/icons/UploadIcon.svg" className="w-6 h-6" />
//                   </div>
//                   <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
//                     <span className="text-pneutral-500 text-md">Select certifications first</span>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               certificationsDetails.map((cert) => (
//                 <div key={cert.id} className="flex flex-col gap-0">
//                   <label className={fieldLabel}>Upload {cert.label} {requiredStar}</label>
//                   <UploadInput
//                     onFileSelect={(file) => {
//                       if (file) {
//                         handleCertificationFileUpload(cert.id, file);
//                       } else {
//                         handleCertRemove(cert.id);
//                       }
//                     }}
//                     existingFile={cert.existingUrl || undefined}
//                     label=""
//                     placeholder={`Upload the ${cert.label}`}
//                     accept=".pdf,.jpg,.jpeg,.png"
//                   />
//                 </div>
//               ))
//             )}

//             <div className="flex flex-col gap-0" data-field="countryOfOrigin">
//               <label className={fieldLabel}>Country of Origin {requiredStar}</label>
//               <Dropdown
//                 options={countries}
//                 value={form.countryOfOrigin}
//                 onChange={(value) => handleDropdownChange("countryOfOrigin", value)}
//                 placeholder="Select country"
//                 isDisabled={isEditMode || loadingCountries}
//                 error={errors.countryOfOrigin ? " " : ""}
//               />
//               {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
//             </div>

//             <div className="flex flex-col gap-1" data-field="manualFile">
//               <label className={fieldLabel}>Upload Product Brochure / User Manual</label>
//               <UploadInput
//                 onFileSelect={(file) => {
//                   if (file) {
//                     handleManualFileSelect(file);
//                   } else {
//                     handleManualFileSelect(null);
//                     setExistingManualFile(null);
//                   }
//                 }}
//                 existingFile={existingManualFile || undefined}
//                 label=""
//                 placeholder="Upload the Product Brochure"
//                 accept=".pdf"
//               />
//               {errors.manualFile && <p className={errorMsg}>{errors.manualFile}</p>}
//             </div>

//             <div className="col-span-1 md:col-span-2">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="flex flex-col gap-1" data-field="productDescription">
//                   <label className={fieldLabel}>Product Description {requiredStar}</label>
//                   <textarea
//                     ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
//                     name="productDescription"
//                     value={form.productDescription}
//                     onChange={handleChange}
//                     placeholder="Detailed product description (Minimum 10 characters)"
//                     rows={4}
//                     className={`w-full rounded-lg p-3 resize-none border bg-white focus:outline-none transition-all duration-200 ${errors.productDescription ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-pneutral-300 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`}
//                   />
//                   {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
//                 </div>
//                 <div className="flex flex-col gap-1" data-field="warningsPrecautions">
//                   <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
//                   <textarea
//                     ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
//                     name="warningsPrecautions"
//                     value={form.warningsPrecautions}
//                     onChange={handleChange}
//                     placeholder="Enter warnings, precautions, and safety information"
//                     rows={4}
//                     className={`w-full rounded-lg p-3 resize-none border bg-white focus:outline-none transition-all duration-200 ${errors.warningsPrecautions ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-pneutral-300 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`}
//                   />
//                   {errors.warningsPrecautions && <p className={errorMsg}>{errors.warningsPrecautions}</p>}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Packaging & Order Details Section */}
//         <div className="border border-neutral-200 rounded-xl p-6">
//           <div className="text-h4 font-semibold">Packaging & Order Details</div>
//           <div className="border-b border-neutral-200 mt-3"></div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
//             <div className="flex flex-col gap-0" data-field="packType">
//               <label className={fieldLabel}>Pack Type {requiredStar}</label>
//               <Dropdown
//                 options={packTypes}
//                 value={form.packType}
//                 onChange={(value) => handleDropdownChange("packType", value)}
//                 placeholder="Select pack type"
//                 isDisabled={isFieldDisabled(false, true) || loadingPackTypes}
//                 error={errors.packType ? " " : ""}
//               />
//               {errors.packType && <p className={errorMsg}>{errors.packType}</p>}
//             </div>

//             <div data-field="unitsPerPack">
//               <Input
//                 type="number"
//                 label="Number of Units per Pack Type"
//                 name="unitsPerPack"
//                 placeholder="e.g., 100"
//                 onChange={handleChange}
//                 value={form.unitsPerPack}
//                 readOnly={isFieldDisabled(false, true)}
//                 disabled={isFieldDisabled(false, true)}
//                 error={errors.unitsPerPack}
//                 required
//               />
//             </div>

//             <div data-field="numberOfPacks">
//               <Input
//                 type="number"
//                 label="Number of Packs"
//                 name="numberOfPacks"
//                 placeholder="e.g., 5"
//                 onChange={handleChange}
//                 value={form.numberOfPacks}
//                 readOnly={isFieldDisabled(false, true)}
//                 disabled={isFieldDisabled(false, true)}
//                 error={errors.numberOfPacks}
//                 required
//               />
//             </div>

//             <div data-field="packSize">
//               <Input
//                 label="Pack Size (auto-calculated)"
//                 name="packSize"
//                 value={form.packSize}
//                 readOnly
//                 required
//               />
//             </div>

//             <div className="col-span-2 text-h6 font-normal mt-2">Order Details</div>
//             <div className="col-span-2 border-b border-neutral-200"></div>

//             <div data-field="minimumOrderQuantity">
//               <Input
//                 type="number"
//                 label="Min Order Qty"
//                 name="minimumOrderQuantity"
//                 placeholder="Minimum quantity per order"
//                 onChange={handleChange}
//                 value={form.minimumOrderQuantity}
//                 readOnly={false}
//                 error={errors.minimumOrderQuantity}
//                 required
//               />
//             </div>

//             <div data-field="maximumOrderQuantity">
//               <Input
//                 type="number"
//                 label="Max Order Qty"
//                 name="maximumOrderQuantity"
//                 placeholder="Maximum quantity per order"
//                 onChange={handleChange}
//                 value={form.maximumOrderQuantity}
//                 readOnly={false}
//                 error={errors.maximumOrderQuantity}
//                 required
//               />
//             </div>

//             <div className="col-span-2 text-h6 font-normal mt-2">Batch Management</div>
//             <div className="col-span-2 border-b"></div>

//             <div data-field="batchLotNumber">
//               <Input
//                 label="Batch/Lot Number"
//                 name="batchLotNumber"
//                 placeholder="Enter batch number"
//                 onChange={handleChange}
//                 value={form.batchLotNumber}
//                 readOnly={isEditMode}
//                 error={errors.batchLotNumber}
//                 required
//               />
//             </div>

//             {/* Manufacturing Date - Inline validation */}
//             <div data-field="manufacturingDate">
//               <Input
//                 label="Manufacturing Date"
//                 type="month"
//                 name="manufacturingDate"
//                 onChange={(e) => {
//                   const value = e.target.value;
//                   if (!value) return;
//                   const [year, month] = value.split("-").map(Number);
//                   const date = new Date(year, month - 1, 1);
                  
//                   const today = new Date();
//                   const threeYearsAgo = new Date();
//                   threeYearsAgo.setFullYear(today.getFullYear() - 3);
//                   const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  
//                   if (date > currentMonth) {
//                     setErrors((prev) => ({ ...prev, manufacturingDate: "Manufacturing date cannot be in the future month" }));
//                     return;
//                   }
                  
//                   if (date < threeYearsAgo) {
//                     setErrors((prev) => ({ ...prev, manufacturingDate: "Manufacturing date cannot be more than 3 years old" }));
//                     return;
//                   }
                  
//                   setForm((prev) => ({ ...prev, manufacturingDate: date, expiryDate: null }));
//                   setErrors((prev) => {
//                     const newErrors = { ...prev };
//                     delete newErrors.manufacturingDate;
//                     return newErrors;
//                   });
//                 }}
//                 value={form.manufacturingDate ? `${form.manufacturingDate.getFullYear()}-${String(form.manufacturingDate.getMonth() + 1).padStart(2, "0")}` : ""}
//                 readOnly={isEditMode}
//                 error={errors.manufacturingDate}
//                 required
//                 placeholder="YYYY-MM"
//               />
//             </div>

//             {/* Expiry Date - Inline validation */}
//             <div data-field="expiryDate">
//               <Input
//                 label="Expiry Date"
//                 type="month"
//                 name="expiryDate"
//                 onChange={(e) => {
//                   const value = e.target.value;
//                   if (!value) return;
//                   const [year, month] = value.split("-").map(Number);
//                   const date = new Date(year, month - 1, 1);
                  
//                   const today = new Date();
//                   const threeMonthsFromNow = new Date();
//                   threeMonthsFromNow.setMonth(today.getMonth() + 3);
                  
//                   if (date < threeMonthsFromNow) {
//                     setErrors((prev) => ({ ...prev, expiryDate: "Expiry date must be at least 3 months from today" }));
//                     return;
//                   }
                  
//                   if (form.manufacturingDate) {
//                     const mfgDate = form.manufacturingDate instanceof Date ? form.manufacturingDate : new Date(form.manufacturingDate);
//                     const minExpiry = new Date(mfgDate);
//                     minExpiry.setMonth(minExpiry.getMonth() + 3);
                    
//                     if (date < minExpiry) {
//                       setErrors((prev) => ({ ...prev, expiryDate: "Expiry must be at least 3 months after Manufacturing Date" }));
//                       return;
//                     }
//                   }
                  
//                   setForm((prev) => ({ ...prev, expiryDate: date }));
//                   setErrors((prev) => {
//                     const newErrors = { ...prev };
//                     delete newErrors.expiryDate;
//                     return newErrors;
//                   });
//                 }}
//                 min={form.manufacturingDate ? getMinExpiryMonth() : getMinExpiryFromToday()}
//                 value={form.expiryDate ? `${form.expiryDate.getFullYear()}-${String(form.expiryDate.getMonth() + 1).padStart(2, "0")}` : ""}
//                 readOnly={isEditMode}
//                 error={errors.expiryDate}
//                 required
//                 placeholder="YYYY-MM"
//               />
//             </div>

//             <div data-field="shelfLifeMonths">
//               <Input
//                 type="number"
//                 label="Shelf Life (Months)"
//                 name="shelfLifeMonths"
//                 value={form.shelfLifeMonths}
//                 readOnly
//                 error={errors.shelfLifeMonths}
//                 required
//               />
//             </div>

//             <div data-field="dateOfStockEntry">
//               <Input
//                 label="Date of Entry"
//                 type="date"
//                 name="dateOfStockEntry"
//                 value={new Date().toISOString().split("T")[0]}
//                 disabled
//               />
//             </div>

//             <div data-field="stockQuantity">
//               <Input
//                 type="number"
//                 label="Stock Quantity (numbers w.r.t pack size)"
//                 name="stockQuantity"
//                 placeholder="Number of packs in stock"
//                 onChange={handleChange}
//                 value={form.stockQuantity}
//                 readOnly={isEditMode}
//                 error={errors.stockQuantity}
//                 required
//               />
//             </div>

//             <div className="col-span-2 text-h6 font-normal mt-2">Pricing</div>
//             <div className="col-span-2 border-b"></div>

//             <div className="col-span-2">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="col-span-2 grid grid-cols-2 gap-4">
//                   <div data-field="discountPercentage">
//                     <Input
//                       type="number"
//                       label="Discount (%)"
//                       name="discountPercentage"
//                       placeholder="e.g., 10"
//                       onChange={handleChange}
//                       value={form.discountPercentage}
//                       error={errors.discountPercentage}
//                     />
//                   </div>
//                   <div data-field="mrp">
//                     <Input
//                       type="number"
//                       label="MRP (per Pack Size)"
//                       name="mrp"
//                       placeholder="Maximum Retail Price"
//                       onChange={handleChange}
//                       value={form.mrp}
//                       error={errors.mrp}
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="col-span-2 grid grid-cols-2 gap-4">
//                   <div data-field="sellingPricePerPack">
//                     <Input
//                       type="number"
//                       label="Selling Price (per Pack Size)"
//                       name="sellingPricePerPack"
//                       placeholder="Selling price per pack"
//                       onChange={handleChange}
//                       value={form.sellingPricePerPack}
//                       error={errors.sellingPricePerPack}
//                       required
//                     />
//                   </div>
//                   <div className="flex items-end">
//                     <button
//                       type="button"
//                       onClick={() => setShowAdditionalDiscount(true)}
//                       className="w-[237px] h-[52px] bg-transparent border-[2.5px] border-[#7D32FC] text-[#9659FD] font-heading font-medium text-[18px] leading-[28px] rounded-lg flex items-center justify-center gap-[12px] cursor-pointer hover:bg-purple-50 transition-all duration-200"
//                     >
//                       <svg width="14.24" height="14.24" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
//                         <path d="M7 1v12M1 7h12" stroke="#9659FD" strokeWidth="2.5" strokeLinecap="round" />
//                       </svg>
//                       <span>Add Special Offers</span>
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="col-span-2 text-h6 font-normal mt-2">TAX & BILLING</div>
//             <div className="col-span-2 border-b"></div>

//             <div data-field="hsnCode">
//               <Input
//                 type="text"
//                 label="HSN Code"
//                 name="hsnCode"
//                 placeholder="HSN Code"
//                 onChange={handleChange}
//                 value={form.hsnCode}
//                 readOnly={isEditMode}
//                 error={errors.hsnCode}
//                 required
//               />
//             </div>

//             <div className="flex flex-col gap-0" data-field="gstPercentage">
//               <label className={fieldLabel}>GST % {requiredStar}</label>
//               <Dropdown
//                 options={gstOptions}
//                 value={form.gstPercentage}
//                 onChange={(value) => handleDropdownChange("gstPercentage", value)}
//                 placeholder="Select GST %"
//                 isDisabled={isEditMode}
//                 error={errors.gstPercentage ? " " : ""}
//               />
//               {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
//             </div>
//           </div>
//         </div>

//         {/* Product Photos Section */}
//         <div
//           className="border border-pneutral-200 rounded-xl p-6"
//           ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>}
//           data-field="images"
//         >
//           <div className="text-label-l4 font-heading font-medium text-pneutral-900">
//             Product Photos <span className="text-warning-500">*</span>
//           </div>
          
//           <div
//             className="w-full h-40 bg-pneutral-50 flex items-center justify-center rounded-lg cursor-pointer mt-2"
//             onClick={() => document.getElementById("fileInput")?.click()}
//           >
//             <input
//               id="fileInput"
//               type="file"
//               multiple
//               accept="image/*"
//               className="hidden"
//               onChange={handleImageUpload}
//             />
//             <div className="border-2 border-dashed border-pneutral-300 rounded-lg w-full h-full flex items-center justify-center">
//               <div className="flex flex-col items-center">
//                 <img src="/icons/FolderIcon.svg" alt="folder" className="w-10 h-10" />
//                 <div className="text-label-l3 font-body font-normal text-pneutral-900 mt-4">Choose a file or drag & drop it here</div>
//                 <div className="text-label-l2 font-body font-normal text-pneutral-400 mt-1">or click to browse JPEG, PNG, and PDF</div>
//               </div>
//             </div>
//           </div>
          
//           {errors.images && <p className="text-warning-500 text-p3 font-body font-normal mt-2">{errors.images}</p>}

//           <div className="flex flex-wrap gap-3 mt-4">
//             {existingImages.map((img, idx) => (
//               <div key={`existing-${idx}`} className="relative w-24 h-24">
//                 <img src={img} alt="existing" className="w-full h-full object-cover rounded-md border border-pneutral-200" />
//                 {!isEditMode && (
//                   <button 
//                     onClick={() => removeExistingImage(idx)} 
//                     className="absolute -top-2 -right-2 w-5 h-5 bg-warning-500 text-base-white rounded-full flex items-center justify-center text-p2 font-body font-medium hover:bg-warning-600 transition-colors"
//                   >
//                     ✕
//                   </button>
//                 )}
//               </div>
//             ))}
//             {images.map((file, idx) => (
//               <div key={`new-${idx}`} className="relative w-24 h-24">
//                 <img src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover rounded-md border border-pneutral-200" />
//                 <button 
//                   onClick={() => removeNewImage(idx)} 
//                   className="absolute -top-2 -right-2 w-5 h-5 bg-warning-500 text-base-white rounded-full flex items-center justify-center text-p2 font-body font-medium transition-colors"
//                 >
//                   ✕
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex justify-between mt-6 pb-8">
//           <div className="flex gap-4">
//             <button type="button" onClick={() => router.back()} className="px-6 py-2 border-2 border-warning-500 rounded-lg text-warning-500 font-semibold">Cancel</button>
//             <button type="button" className="px-6 py-2 bg-secondary-700 text-white rounded-lg flex items-center gap-2 font-semibold">
//               <img src="/icons/SaveDraftIcon.svg" alt="save" className="w-5 h-5" />
//               Save Draft
//             </button>
//           </div>
//           <button
//             type="button"
//             onClick={handleSubmit}
//             className="px-8 py-2 bg-primary-800 text-white rounded-lg font-semibold hover:bg-primary-900"
//           >
//             {isEditMode ? "Update" : "Submit"}
//           </button>
//         </div>
//       </form>
//     </>
//   );
// };

// export default FoodInfantForm;