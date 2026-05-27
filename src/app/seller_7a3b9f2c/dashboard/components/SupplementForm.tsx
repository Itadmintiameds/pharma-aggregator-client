/*
import React from 'react'

const SupplementForm = () => {
  return (
    <div>SupplementForm</div>
  )
}

export default SupplementForm
*/

"use client";

import React, { useEffect, useState, useRef } from "react";
import { FileText, X, RefreshCw } from "lucide-react";
// import Select from "react-select";
import { useRouter } from "next/navigation";
import Dropdown from "@/src/app/commonComponents/Dropdown";
import Input from "@/src/app/commonComponents/Input";
import CheckboxDropdown from "@/src/app/commonComponents/CheckboxDropdown";
import CommonModal from "../commonComponent/CommonModal";
import PopupModal from "../commonComponent/PopupModal";
import UploadInput from "../commonComponent/UploadInput";
import ProductImageUpload from "../commonComponent/ProductImageUpload";
import MonthPicker from "@/src/app/commonComponents/MonthPicker";
import AdditionalDiscountType from "./AdditionalDiscountType";
import { getSupplementDosageForms, getSupplementAgeGroups, getSupplementFlavours, getSupplementStorageConditions, getSupplementCertifications, getCountries, getSupplementPackTypes, createSupplementProduct, uploadSupplementProductImages, uploadNutritionalInformationImage, uploadSupplementBrochure, uploadSupplementCertifications, getServingSizeUnits, getNetQuantityUnits } from "@/src/services/product/SupplementService";
import { getProductById, updateProduct } from "@/src/services/product/ProductService";
import { validateBatchNumber } from "@/src/services/product/Pricing";

import { getTherapeuticCategory, getTherapeuticSubcategory } from "@/src/services/product/TherapeuticCategoryService";
import { supplementProductSchema } from "@/src/schema/product/SupplementProductSchema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string; }

interface CertificationTag {
  id: string;
  label: string;
  tagCode: string;
  file: File | null;
  fileName: string;
  isUploaded: boolean;
  existingUrl?: string;
  documentId?: number;
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const fieldLabel = "font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle text-pneutral-900";
const requiredStar = <span className="text-warning-500 font-semibold ml-1">*</span>;

const errorMsg = "font-heading font-normal text-sm leading-[28px] px-1 text-warning-500";

// ─── Upload Icon ───────────────────────────────────────────────────────────────

const UploadCloudIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

// ─── Static Options ────────────────────────────────────────────────────────────

// Removed static therapeuticCategoryOptions and subCategoryOptions


const nutritionalInfoOptions: SelectOption[] = [
  { value: "label", label: "As per the label" },
  { value: "image", label: "Image upload" },
];



const genderOptions: SelectOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unisex", label: "Unisex" },
];





const countryOptions: SelectOption[] = [
  { value: "1", label: "India" },
  { value: "2", label: "United States" },
  { value: "3", label: "United Kingdom" },
  { value: "4", label: "Germany" },
  { value: "5", label: "Australia" },
];



// Removed static packTypeOptions

const gstOptions: SelectOption[] = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
];

const extractUnitString = (item: any): string => {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";

  // 1. Check known direct keys strictly for strings
  if (typeof item.netQuantityUnitName === "string") return item.netQuantityUnitName;
  if (typeof item.servingSizeUnitName === "string") return item.servingSizeUnitName;
  if (typeof item.unitName === "string") return item.unitName;
  if (item.unit) {
    if (typeof item.unit === "string") return item.unit;
    if (typeof item.unit === "object") {
      if (typeof item.unit.netQuantityUnitName === "string") return item.unit.netQuantityUnitName;
      if (typeof item.unit.servingSizeUnitName === "string") return item.unit.servingSizeUnitName;
      if (typeof item.unit.name === "string") return item.unit.name;
      if (typeof item.unit.unit === "string") return item.unit.unit;
    }
  }
  if (typeof item.name === "string") return item.name;
  if (typeof item.label === "string") return item.label;

  // 2. Check nested objects
  const nestedUnit = item.netQuantityUnit || item.servingSizeUnit || item.unit;
  if (nestedUnit && typeof nestedUnit === "object") {
    if (typeof nestedUnit.netQuantityUnitName === "string") return nestedUnit.netQuantityUnitName;
    if (typeof nestedUnit.servingSizeUnitName === "string") return nestedUnit.servingSizeUnitName;
    if (typeof nestedUnit.unitName === "string") return nestedUnit.unitName;
    if (typeof nestedUnit.name === "string") return nestedUnit.name;
    if (typeof nestedUnit.unit === "string") return nestedUnit.unit;
  }

  // 3. Fallback: Search all keys for a string value that is a non-numeric short word
  for (const key of Object.keys(item)) {
    const val = item[key];
    if (typeof val === "string" && val.trim().length > 0 && isNaN(Number(val))) {
      return val;
    }
    if (val && typeof val === "object") {
      for (const subKey of Object.keys(val)) {
        const subVal = val[subKey];
        if (typeof subVal === "string" && subVal.trim().length > 0 && isNaN(Number(subVal))) {
          return subVal;
        }
      }
    }
  }
  return "";
};

// ─── Custom Numeric Input with Unit Dropdown ───────────────────────────────────

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
  options: string[];
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
  options
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    // Allow digits and at most one decimal point
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      onValueChange(val);
    }
  };

  // State mappings for border/shadow color matching original Input component
  const getBorderColor = () => {
    if (disabled) return "border-pneutral-300 bg-sneutral-100 cursor-not-allowed";
    if (readOnly) return "border-pneutral-300 bg-pneutral-50 cursor-default";
    if (error) return "border-warning-500 focus-within:ring-1 focus-within:ring-warning-500 focus-within:border-warning-500";
    return "border-pneutral-300 focus-within:border-secondary-300 focus-within:ring-1 focus-within:ring-secondary-300";
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-0 w-full relative">
      {/* Label */}
      <label className={`font-heading font-medium text-[16px] leading-[24px] tracking-normal align-middle transition-colors duration-200 ${disabled ? "text-pneutral-500" : "text-pneutral-900"}`}>
        {label}
        {required && <span className="text-warning-500 ml-1">*</span>}
      </label>

      {/* Input Group Container */}
      <div className={`flex items-center h-[52px] w-full border rounded-lg bg-white overflow-hidden transition-all duration-200 ${getBorderColor()}`}>
        {/* Left Side: Numerical Input */}
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          disabled={disabled || readOnly}
          className="flex-1 h-full px-4 text-base outline-none border-none bg-transparent text-pneutral-800 placeholder:text-pneutral-500"
        />

        {/* Divider line */}
        <div className="h-full border-l border-neutral-300"></div>

        {/* Right Side: Unit Dropdown Trigger */}
        <button
          type="button"
          disabled={disabled || readOnly}
          onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
          className="w-[149px] h-full px-3 bg-pneutral-50 flex items-center justify-between gap-1 transition-colors hover:bg-neutral-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            className={unit ? "text-pneutral-800" : "text-pneutral-500"}
            style={{
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "0em",
            }}
          >
            {unit || "Select Unit"}
          </span>
          <svg
            className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Absolute Dropdown List */}
        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+4px)] w-[149px] max-h-60 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onUnitChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm text-pneutral-800 hover:bg-pneutral-50 transition-colors cursor-pointer font-medium ${unit === opt ? "bg-neutral-50 font-semibold" : ""}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="font-heading font-normal text-sm leading-[28px] px-1 text-warning-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────

interface SupplementFormProps {
  categoryId?: number | string;
  productId?: string;
  mode?: "create" | "edit";
}

const SupplementForm = ({ categoryId, productId, mode }: SupplementFormProps) => {
  const router = useRouter();
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef =
    (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const isEditMode = mode === "edit";

  const [form, setForm] = useState({
    // Internal IDs needed for update
    productId: "",
    pricingId: "",
    productAttributeId: "",
    packagingId: "",

    productName: "",
    therapeuticCategory: "",
    therapeuticSubcategory: "",
    brandName: "",
    variantName: "",
    dosageForm: "",
    netQuantity: "",
    netQuantityValue: "",
    netQuantityUnit: "",
    servingSizeValue: "",
    servingSizeUnit: "",
    netQuantityUnitId: 0,
    servingSizeUnitId: 0,
    strength: "",
    activeIngredients: "",
    excipients: "",
    nutritionalInfoType: "",
    intendedUse: "",
    ageGroup: "",
    gender: "",
    vegNonVeg: "",
    allergenInfo: "",
    flavour: "",
    productClaims: "",
    warningsPrecautions: "",
    productDescription: "",
    storageCondition: "",
    manufacturerName: "",
    countryOfOrigin: "",
    packId: "",
    packType: "",
    unitPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    batchLotNumber: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    dateOfStockEntry: new Date(),
    stockQuantity: "",
    sellingPrice: "",
    mrp: "",
    gstPercentage: "",
    discountPercentage: "",
    finalPrice: "",
    hsnCode: "",
    shelfLifeMonths: "",
    additionalDiscount: [] as any[],
    specialSchemes: [] as any[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string | null>(null);
  const [existingNutritionalImageUrl, setExistingNutritionalImageUrl] = useState<string | null>(null);
  const [nutritionalImage, setNutritionalImage] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [brochureUploadKey, setBrochureUploadKey] = useState(Date.now());

  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [showAgeGroupDropdown, setShowAgeGroupDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [showManufacturingMonthPicker, setShowManufacturingMonthPicker] = useState(false);
  const [showExpiryMonthPicker, setShowExpiryMonthPicker] = useState(false);

  const resetForm = () => {
    setForm({
      productId: "",
      pricingId: "",
      productAttributeId: "",
      packagingId: "",

      productName: "",
      therapeuticCategory: "",
      therapeuticSubcategory: "",
      brandName: "",
      variantName: "",
      dosageForm: "",
      netQuantity: "",
      netQuantityValue: "",
      netQuantityUnit: "",
      servingSizeValue: "",
      servingSizeUnit: "",
      netQuantityUnitId: 0,
      servingSizeUnitId: 0,
      strength: "",
      activeIngredients: "",
      excipients: "",
      nutritionalInfoType: "",
      intendedUse: "",
      ageGroup: "",
      gender: "",
      vegNonVeg: "",
      allergenInfo: "",
      flavour: "",
      productClaims: "",
      warningsPrecautions: "",
      productDescription: "",
      storageCondition: "",
      manufacturerName: "",
      countryOfOrigin: "",
      packId: "",
      packType: "",
      unitPerPack: "",
      numberOfPacks: "",
      packSize: "",
      minimumOrderQuantity: "",
      maximumOrderQuantity: "",
      batchLotNumber: "",
      manufacturingDate: null,
      expiryDate: null,
      dateOfStockEntry: new Date(),
      stockQuantity: "",
      sellingPrice: "",
      mrp: "",
      gstPercentage: "",
      discountPercentage: "",
      finalPrice: "",
      hsnCode: "",
      shelfLifeMonths: "",
      additionalDiscount: [],
      specialSchemes: [],
    });
    setImages([]);
    setErrors({});
    setBrochureFile(null);
    setNutritionalImage(null);
    setSelectedCertifications([]);
  };

  const handleMonthSelect = (
    field: "manufacturingDate" | "expiryDate",
    month: number,
    year: number,
  ) => {
    const selectedDate = new Date(year, month, 1);

    if (field === "manufacturingDate") {
      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      if (selectedDate > currentMonth) {
        setErrors((prev) => ({
          ...prev,
          manufacturingDate: "Manufacturing date cannot be in the future month",
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
          const minDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);

          if (selectedDate < minDate) {
            expiryError = "Expiry must be at least 3 months from current month";
          }

          const totalMonths =
            (selectedDate.getFullYear() - mfg.getFullYear()) * 12 +
            (selectedDate.getMonth() - mfg.getMonth());

          updatedForm.shelfLifeMonths =
            totalMonths >= 0 ? totalMonths.toString() : "";
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

  const checkBatchNumber = async (batchLotNumber: string) => {
    try {
      const response = await validateBatchNumber(batchLotNumber);
      if (response.exists) {
        setErrors((prev) => ({
          ...prev,
          batchLotNumber: "Batch number already exists",
        }));
      } else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.batchLotNumber;
          return copy;
        });
      }
    } catch (error) {
      console.error("Batch validation failed:", error);
    }
  };

  const handleViewProduct = () => {
    router.push("/seller_7a3b9f2c/products");
  };

  const handleContinueEditing = () => {
    setShowSuccess(false);
  };

  const handleContinueAdding = () => {
    setShowSuccess(false);
    resetForm();
  };

  const handleBackToDashboard = () => {
    router.push("/seller_7a3b9f2c/dashboard");
  };

  // In create mode, use the prop. In edit mode, this is set from the fetched product.
  const [effectiveCategoryId, setEffectiveCategoryId] = useState<number | string | undefined>(categoryId);

  // Tracks how many certs were loaded from the server — these are mandatory in edit mode
  const [mandatoryCertCount, setMandatoryCertCount] = useState(0);

  // true when stock > 0; used to conditionally lock pack/storage fields
  const hasStock = isEditMode && Number(form.stockQuantity) > 0;

  const [therapeuticCategoryOptions, setTherapeuticCategoryOptions] = useState<SelectOption[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<SelectOption[]>([]);
  const [dosageFormOptions, setDosageFormOptions] = useState<SelectOption[]>([]);
  const [ageGroupOptions, setAgeGroupOptions] = useState<SelectOption[]>([]);
  const [flavourOptions, setFlavourOptions] = useState<SelectOption[]>([]);
  const [storageOptions, setStorageOptions] = useState<SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [packTypeApiOptions, setPackTypeApiOptions] = useState<SelectOption[]>([]);
  const [certificationOptions, setCertificationOptions] = useState<any[]>([]);
  const [netQuantityUnitOptions, setNetQuantityUnitOptions] = useState<string[]>([]);
  const [netQuantityUnitsList, setNetQuantityUnitsList] = useState<any[]>([]);
  const [loadingNetQuantityUnits, setLoadingNetQuantityUnits] = useState(false);
  const [servingSizeUnitOptions, setServingSizeUnitOptions] = useState<string[]>([]);
  const [servingSizeUnitsList, setServingSizeUnitsList] = useState<any[]>([]);
  const [loadingServingSizeUnits, setLoadingServingSizeUnits] = useState(false);

  const [loadingTherapeuticCategories, setLoadingTherapeuticCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingDosageForms, setLoadingDosageForms] = useState(false);
  const [loadingAgeGroups, setLoadingAgeGroups] = useState(false);
  const [loadingFlavours, setLoadingFlavours] = useState(false);
  const [loadingStorageConditions, setLoadingStorageConditions] = useState(false);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingPackTypes, setLoadingPackTypes] = useState(false);

  useEffect(() => {
    if (!effectiveCategoryId) return;
    const fetchTherapeuticCategories = async () => {
      setLoadingTherapeuticCategories(true);
      try {
        const data = await getTherapeuticCategory(effectiveCategoryId);
        const options = data.map((cat: any) => ({
          value: cat.therapeuticCategoryId,
          label: cat.therapeuticCategory,
        }));
        setTherapeuticCategoryOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingTherapeuticCategories(false);
      }
    };
    fetchTherapeuticCategories();
  }, [effectiveCategoryId]);

  useEffect(() => {
    if (!form.therapeuticCategory) {
      setSubCategoryOptions([]);
      return;
    }
    const fetchSubcategories = async () => {
      setLoadingSubcategories(true);
      try {
        const data = await getTherapeuticSubcategory(form.therapeuticCategory);
        const options = data.map((sub: any) => ({
          value: sub.therapeuticSubcategoryId,
          label: sub.therapeuticSubcategory,
        }));
        setSubCategoryOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, [form.therapeuticCategory]);

  useEffect(() => {
    if (!effectiveCategoryId) return;
    const fetchDosageForms = async () => {
      setLoadingDosageForms(true);
      try {
        const data = await getSupplementDosageForms(effectiveCategoryId);
        const options = data.map((item: any) => ({
          value: String(item.dosageId),
          label: item.dosageName || "Unknown",
        }));
        setDosageFormOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDosageForms(false);
      }
    };
    fetchDosageForms();
  }, [effectiveCategoryId]);

  useEffect(() => {
    const fetchAgeGroups = async () => {
      setLoadingAgeGroups(true);
      try {
        const data = await getSupplementAgeGroups();
        const options = data.map((item: any) => ({
          value: String(item.ageGroupId),
          label: item.ageGroup || "Unknown",
        }));
        setAgeGroupOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAgeGroups(false);
      }
    };
    fetchAgeGroups();
  }, []);

  useEffect(() => {
    const fetchFlavours = async () => {
      setLoadingFlavours(true);
      try {
        const data = await getSupplementFlavours();
        const options = data.map((item: any) => ({
          value: String(item.flavourId),
          label: item.flavourName || "Unknown",
        }));
        setFlavourOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingFlavours(false);
      }
    };
    fetchFlavours();
  }, []);

  useEffect(() => {
    if (!effectiveCategoryId) return;
    const fetchStorageConditions = async () => {
      setLoadingStorageConditions(true);
      try {
        const data = await getSupplementStorageConditions(effectiveCategoryId);
        const options = data.map((item: any) => ({
          value: String(item.storageConditionId),
          label: item.conditionName || "Unknown",
        }));
        setStorageOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStorageConditions(false);
      }
    };
    fetchStorageConditions();
  }, [effectiveCategoryId]);

  useEffect(() => {
    if (!effectiveCategoryId) return;
    const fetchCertifications = async () => {
      setLoadingCertifications(true);
      try {
        const data = await getSupplementCertifications(effectiveCategoryId);
        const options = data.map((item: any) => ({
          value: String(item.certificationId),
          label: item.certificationName || "Unknown",
          tagCode: (item.certificationName || "").split(' ')[0].toUpperCase() || "CERT",
        }));
        setCertificationOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCertifications(false);
      }
    };
    fetchCertifications();
  }, [effectiveCategoryId]);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const data = await getCountries();
        const options = data.map((item: any) => ({
          value: String(item.countryId),
          label: item.countryName || "Unknown",
        }));
        setCountryOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!form.dosageForm) {
      setPackTypeApiOptions([]);
      return;
    }
    const fetchPackTypes = async () => {
      setLoadingPackTypes(true);
      try {
        const data = await getSupplementPackTypes(form.dosageForm);
        const options = data.map((item: any) => ({
          value: String(item.packId),
          label: item.packType || "Unknown",
        }));
        setPackTypeApiOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPackTypes(false);
      }
    };
    fetchPackTypes();
  }, [form.dosageForm]);

  useEffect(() => {
    if (!effectiveCategoryId) return;
    const fetchNetQtyUnits = async () => {
      setLoadingNetQuantityUnits(true);
      try {
        const data = await getNetQuantityUnits(effectiveCategoryId);
        if (Array.isArray(data)) {
          setNetQuantityUnitsList(data);
          const parsed = Array.from(new Set(data.map(extractUnitString).filter((u): u is string => typeof u === "string" && u.trim().length > 0)));
          setNetQuantityUnitOptions(parsed);
        } else {
          setNetQuantityUnitsList([]);
          setNetQuantityUnitOptions([]);
        }
      } catch (error) {
        console.error("Error fetching net quantity units:", error);
        setNetQuantityUnitsList([]);
        setNetQuantityUnitOptions([]);
      } finally {
        setLoadingNetQuantityUnits(false);
      }
    };
    fetchNetQtyUnits();
  }, [effectiveCategoryId]);

  useEffect(() => {
    if (!form.dosageForm) {
      setServingSizeUnitOptions([]);
      setServingSizeUnitsList([]);
      return;
    }
    const fetchServingSizeUnits = async () => {
      setLoadingServingSizeUnits(true);
      try {
        const data = await getServingSizeUnits(form.dosageForm);
        if (Array.isArray(data)) {
          setServingSizeUnitsList(data);
          const parsed = Array.from(new Set(data.map(extractUnitString).filter((u): u is string => typeof u === "string" && u.trim().length > 0)));
          setServingSizeUnitOptions(parsed);
        } else {
          setServingSizeUnitsList([]);
          setServingSizeUnitOptions([]);
        }
      } catch (error) {
        console.error("Error fetching serving size units:", error);
        setServingSizeUnitsList([]);
        setServingSizeUnitOptions([]);
      } finally {
        setLoadingServingSizeUnits(false);
      }
    };
    fetchServingSizeUnits();
  }, [form.dosageForm]);

  useEffect(() => {
    const units = parseFloat(form.unitPerPack) || 0;
    const packs = parseFloat(form.numberOfPacks) || 0;
    const total = units * packs;
    setForm((prev) => ({
      ...prev,
      packSize: total > 0 ? total.toString() : "",
    }));
  }, [form.unitPerPack, form.numberOfPacks]);

  useEffect(() => {
    if (form.manufacturingDate instanceof Date && form.expiryDate instanceof Date) {
      const mfg = form.manufacturingDate;
      const exp = form.expiryDate;
      const totalMonths = (exp.getFullYear() - mfg.getFullYear()) * 12 + (exp.getMonth() - mfg.getMonth());
      setForm((prev) => ({
        ...prev,
        shelfLifeMonths: totalMonths > 0 ? totalMonths.toString() : "",
      }));
      if (totalMonths > 60) {
        setErrors((prev) => ({
          ...prev,
          shelfLifeMonths: "Shelf life cannot exceed 5 years (60 months)",
        }));
      } else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.shelfLifeMonths;
          return copy;
        });
      }
    }
  }, [form.manufacturingDate, form.expiryDate]);

  // const nutritionalInputRef = useRef<HTMLInputElement>(null);
  // const brochureInputRef = useRef<HTMLInputElement>(null);
  const certDropdownRef = useRef<HTMLDivElement>(null);
  const ageGroupDropdownRef = useRef<HTMLDivElement>(null);

  /*
  const selectStyles = (errorKey: string) => ({
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "56px",
      height: "auto",
      borderRadius: "16px",
      borderColor: errors[errorKey]
        ? "#FF3B3B"
        : state.isFocused
          ? "#4B0082"
          : "#737373",
      boxShadow: "none",
      cursor: "pointer",

      // ✅ FIX: dynamic alignment
      alignItems:
        state.hasValue && state.selectProps.isMulti ? "flex-start" : "center",

      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),

    valueContainer: (base: any) => ({
      ...base,
      padding: "8px 16px", // slight vertical padding for multi-line
      flexWrap: "wrap", // ✅ enables wrapping
      overflow: "visible",
    }),

    indicatorsContainer: (base: any) => ({
      ...base,
      height: "56px", // ✅ keep icon aligned like other fields
    }),

    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused ? "#4B0082" : "#737373",
      cursor: "pointer",
      "&:hover": { color: "#4B0082" },
    }),

    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#4B0082"
        : state.isFocused
          ? "#F3E8FF"
          : "white",
      color: state.isSelected ? "white" : "#1E1E1E",
      cursor: "pointer",
      "&:active": { backgroundColor: "#4B0082", color: "white" },
    }),

    placeholder: (base: any) => ({ ...base, color: "#A3A3A3" }),
    singleValue: (base: any) => ({ ...base, color: "#1E1E1E" }),

    multiValue: (base: any) => ({
      ...base,
      margin: "2px", // neat spacing when wrapping
    }),
  });

  const selectTheme = (theme: any) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: "#4B0082",
      primary25: "#F3E8FF",
      primary50: "#E9D5FF",
    },
  });
  */

  // Close cert and ageGroup dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (certDropdownRef.current && !certDropdownRef.current.contains(e.target as Node))
        setShowCertDropdown(false);
      if (ageGroupDropdownRef.current && !ageGroupDropdownRef.current.contains(e.target as Node))
        setShowAgeGroupDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNetQuantityValueChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      netQuantityValue: val,
      netQuantity: `${val} ${prev.netQuantityUnit}`.trim(),
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.netQuantityValue;
      delete copy.netQuantity;
      const ssVal = Number(form.servingSizeValue);
      const nqVal = Number(val);
      if (!isNaN(ssVal) && !isNaN(nqVal) && ssVal > nqVal) {
        copy.servingSizeValue = "Serving Size cannot exceed Net Quantity";
      } else {
        delete copy.servingSizeValue;
      }
      return copy;
    });
  };

  const handleNetQuantityUnitChange = (unit: string) => {
    const matchedItem = netQuantityUnitsList.find((item) => extractUnitString(item) === unit);
    const unitId = matchedItem ? (matchedItem.unitId || matchedItem.id) : 0;
    setForm((prev) => ({
      ...prev,
      netQuantityUnit: unit,
      netQuantityUnitId: unitId,
      netQuantity: `${prev.netQuantityValue} ${unit}`.trim(),
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.netQuantityUnit;
      delete copy.netQuantity;
      return copy;
    });
  };

  const handleServingSizeValueChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      servingSizeValue: val,
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.servingSizeValue;
      const ssVal = Number(val);
      const nqVal = Number(form.netQuantityValue);
      if (!isNaN(ssVal) && !isNaN(nqVal) && ssVal > nqVal) {
        copy.servingSizeValue = "Serving Size cannot exceed Net Quantity";
      }
      return copy;
    });
  };

  const handleServingSizeUnitChange = (unit: string) => {
    const matchedItem = servingSizeUnitsList.find((item) => extractUnitString(item) === unit);
    const unitId = matchedItem ? (matchedItem.id || matchedItem.unitId) : 0;
    setForm((prev) => ({
      ...prev,
      servingSizeUnit: unit,
      servingSizeUnitId: unitId,
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.servingSizeUnit;
      return copy;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate packSize
      const unitPerPack = Number(updated.unitPerPack) || 0;
      const numberOfPacks = Number(updated.numberOfPacks) || 0;
      updated.packSize = String(unitPerPack * numberOfPacks);

      // Auto-calculate finalPrice from sellingPrice & gst
      const currentSP = Number(updated.sellingPrice) || 0;
      const gst = Number(updated.gstPercentage) || 0;
      if (currentSP > 0) {
        updated.finalPrice = (currentSP + (currentSP * gst) / 100).toFixed(2);
      }

      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };

        // Clear the field's own error as user types
        if (newErrors[name]) delete newErrors[name];

        // ── Cross-field: maxQty >= minQty ────────────────────────────────────
        const minQty = Number(updated.minimumOrderQuantity) || 0;
        const maxQty = Number(updated.maximumOrderQuantity) || 0;
        if (maxQty && minQty && maxQty < minQty) {
          newErrors.maximumOrderQuantity = "Max Order Qty must be ≥ Min Order Qty";
        } else {
          delete newErrors.maximumOrderQuantity;
        }

        // ── Cross-field: stockQty >= minQty ──────────────────────────────────
        const stockQty = Number(updated.stockQuantity) || 0;
        if (stockQty && minQty && stockQty < minQty) {
          newErrors.stockQuantity = "Stock Quantity must be greater than or equal to Min Order Qty";
        } else {
          delete newErrors.stockQuantity;
        }

        // ── Cross-field: sellingPrice < mrp ──────────────────────────────────
        const sellingPrice = Number(updated.sellingPrice) || 0;
        const mrpVal = Number(updated.mrp) || 0;
        if (sellingPrice && mrpVal && sellingPrice >= mrpVal) {
          newErrors.sellingPrice = "Selling Price must be less than MRP";
        } else {
          delete newErrors.sellingPrice;
        }

        // ── Batch/Lot Number Validation ──────────────────────────────────────
        if (name === "batchLotNumber" && value.trim()) {
          checkBatchNumber(value);
        }

        // ── Product Name Validation ──────────────────────────────────────────
        if (name === "productName") {
          if (!value.trim()) {
            newErrors.productName = "Product Name is required";
          } else if (value.trim().length < 3) {
            newErrors.productName = "Product Name must be at least 3 characters";
          } else if (value.length > 150) {
            newErrors.productName = "Product Name must not exceed 150 characters";
          } else if (!/^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/.test(value)) {
            newErrors.productName = "Product Name can contain alphanumeric and special characters only";
          } else {
            delete newErrors.productName;
          }
        }

        // ── Discount 0–100 ───────────────────────────────────────────────────
        if (name === "discountPercentage") {
          const d = Number(value);
          if (value !== "" && (isNaN(d) || d < 0 || d > 100)) {
            newErrors.discountPercentage = "Discount must be between 0 and 100";
          } else {
            delete newErrors.discountPercentage;
          }
        }

        // ── HSN Code: 4/6/8 digits ───────────────────────────────────────────
        if (name === "hsnCode" && value) {
          const isValid = /^\d+$/.test(value) && [4, 6, 8].includes(value.length);
          if (!isValid) {
            newErrors.hsnCode = "HSN Code must be 4, 6, or 8 digits";
          } else {
            delete newErrors.hsnCode;
          }
        }

        // ── Brand Name: alphanum + space + hyphen ────────────────────────────
        if (name === "brandName" && value) {
          if (!/^[a-zA-Z0-9\s\-]*$/.test(value)) {
            newErrors.brandName = "Brand Name allows alphabets, numbers, spaces, hyphens only";
          } else if (value.length > 60) {
            newErrors.brandName = "Brand Name must not exceed 60 characters";
          } else {
            delete newErrors.brandName;
          }
        }

        // ── Product Name: max 150 ───────────────────────────────────────────
        if (name === "productName") {
          if (value.length > 150) {
            newErrors.productName = "Product Name must not exceed 150 characters";
          } else {
            delete newErrors.productName;
          }
        }

        // ── Manufacturer Name: max 100 ───────────────────────────────────────
        if (name === "manufacturerName" && value.length > 100) {
          newErrors.manufacturerName = "Manufacturer Name must not exceed 100 characters";
        }

        // ── Intended Use: min 10 ────────────────────────────────────────────
        if (name === "intendedUse") {
          if (value.length > 0 && value.trim().length < 10) {
            newErrors.intendedUse = "Intended Use must be at least 10 characters";
          } else {
            delete newErrors.intendedUse;
          }
        }

        // ── Allergen Info: min 3 ────────────────────────────────────────────
        if (name === "allergenInfo") {
          if (value.length > 0 && value.trim().length < 3) {
            newErrors.allergenInfo = "Allergen Information must be at least 3 characters";
          } else {
            delete newErrors.allergenInfo;
          }
        }

        // ── Product Description: min 10 ──────────────────────────────────────
        if (name === "productDescription") {
          if (value.length > 0 && value.trim().length < 10) {
            newErrors.productDescription = "Product Description must be at least 10 characters";
          } else {
            delete newErrors.productDescription;
          }
        }

        return newErrors;
      });

      return updated;
    });
  };

  const handleRadioChange = (name: string, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleCertCheckbox = (opt: typeof certificationOptions[0]) => {
    const exists = selectedCertifications.some((c) => c.id === opt.value);
    if (exists) {
      // In edit mode, block removing certs that were loaded from the server (mandatory)
      const isMandatory = isEditMode &&
        selectedCertifications.findIndex((c) => c.id === opt.value) < mandatoryCertCount;
      if (isMandatory) {
        alert(`"${opt.label}" is a mandatory certificate and cannot be removed. You may re-upload a new file for it instead.`);
        return;
      }
      setSelectedCertifications((p) => p.filter((c) => c.id !== opt.value));
    } else {
      setSelectedCertifications((p) => [
        ...p,
        { id: opt.value, label: opt.label, tagCode: opt.tagCode, file: null, fileName: "", isUploaded: false },
      ]);
    }
  };

  const handleCertFileSelect = (certId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("File size must be less than 5 MB"); return; }
    setSelectedCertifications((prev) =>
      prev.map((c) =>
        c.id === certId
          ? { ...c, file, fileName: file.name, isUploaded: true, existingUrl: undefined }
          : c,
      ),
    );
  };

  const handleCertRemove = (certId: string) => {
    setSelectedCertifications((prev) =>
      prev.map((c) =>
        c.id === certId
          ? { ...c, file: null, fileName: "", isUploaded: false }
          : c,
      ),
    );
  };

  const handleImageFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (images.length + fileArr.length > 5) {
      setErrors((p) => ({ ...p, images: "Maximum 5 images allowed" }));
      return;
    }
    setImages((p) => [...p, ...fileArr]);
    setErrors((p) => { const n = { ...p }; delete n.images; return n; });
  };

  const handleNutritionalUpload = (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Only image files are allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File size must be less than 5 MB"); return; }
    setNutritionalImage(file);
    if (errors.nutritionalImage) setErrors((p) => { const n = { ...p }; delete n.nutritionalImage; return n; });
  };

  const handleBrochureUpload = (file: File | null) => {
    if (!file) {
      setBrochureFile(null);
      setExistingBrochureUrl(null);
      return;
    }
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      setBrochureUploadKey(Date.now());
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5 MB");
      setBrochureUploadKey(Date.now());
      return;
    }
    setBrochureFile(file);
    if (errors.brochureFile) {
      setErrors((p) => { const n = { ...p }; delete n.brochureFile; return n; });
    }
  };

  // ── Edit mode: fetch and populate form ──────────────────────────────────────
  useEffect(() => {
    if (mode === "edit" && productId) {
      fetchProductByIdAndFillForm(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productId]);

  const fetchProductByIdAndFillForm = async (id: string) => {
    try {
      const data = await getProductById(id);
      if (!data) throw new Error("Product not found");

      // Get the latest pricing and packaging entries
      const pricing = data.pricingDetails?.length > 0
        ? data.pricingDetails.reduce((latest: any, curr: any) =>
          new Date(curr.createdDate) > new Date(latest.createdDate) ? curr : latest)
        : {};
      const packaging = data.packagingDetails?.length > 0
        ? data.packagingDetails.reduce((latest: any, curr: any) =>
          new Date(curr.createdDate) > new Date(latest.createdDate) ? curr : latest)
        : {};
      const attr = data.productAttributeSupplementsOrNutraceuticals?.[0] || {};

      // ✅ KEY FIX: set categoryId from the product so all dropdowns load in edit mode
      if (data.categoryId) {
        setEffectiveCategoryId(data.categoryId);
      }

      // Existing files (URLs, not new File objects)
      setExistingImages(data.productImages?.map((img: any) => img.productImage) || []);
      setExistingBrochureUrl(attr.brochurePath || null);
      setExistingNutritionalImageUrl(attr.nutritionalInformationImageUrl || null);

      // Re-populate certifications from existing data
      if (attr.certificateDocuments?.length > 0) {
        const mappedCerts: CertificationTag[] = attr.certificateDocuments.map((cert: any) => ({
          id: String(cert.certificationId),
          label: cert.certificationName || `Cert ${cert.certificationId}`,
          tagCode: (cert.certificationName || "").split(" ")[0].toUpperCase() || "CERT",
          file: null,
          fileName: "",
          isUploaded: false,
          existingUrl: cert.certificateUrl || undefined,
          documentId: cert.productCertificateDocumentId,
        }));
        setSelectedCertifications(mappedCerts);
        // Lock these certs as mandatory — they must be kept or re-uploaded
        setMandatoryCertCount(mappedCerts.length);
      }

      setForm((prev) => ({
        ...prev,
        productId: data.productId || "",
        pricingId: pricing.pricingId || "",
        productAttributeId: attr.productAttributeId || "",

        productName: data.productName || "",
        warningsPrecautions: data.warningsPrecautions || "",
        productDescription: data.productDescription || "",
        manufacturerName: data.manufacturerName || "",

        therapeuticCategory: String(attr.therapeuticCategoryId || ""),
        therapeuticSubcategory: String(attr.therapeuticSubCategoryId || ""),
        brandName: attr.brandName || "",
        variantName: attr.variantName || "",
        dosageForm: String(attr.dosageFormId || ""),
        netQuantity: attr.netQuantity || "",
        netQuantityValue: attr.netQuantityValue || (
          typeof attr.netQuantity === "number"
            ? String(attr.netQuantity)
            : (attr.netQuantity ? (String(attr.netQuantity).match(/^(\d+(?:\.\d+)?)/)?.[1] || "") : "")
        ),
        netQuantityUnit: attr.netQuantityUnitName || attr.netQuantityUnitSymbol || (
          attr.netQuantity && typeof attr.netQuantity === "string"
            ? (String(attr.netQuantity).match(/^\d+(?:\.\d+)?\s*(.*)$/)?.[1] || "")
            : ""
        ),
        netQuantityUnitId: attr.netQuantityUnitId || 0,
        servingSizeValue: attr.servingSizeValue || (
          typeof attr.servingSize === "number"
            ? String(attr.servingSize)
            : (attr.servingSize ? (String(attr.servingSize).match(/^(\d+(?:\.\d+)?)/)?.[1] || "") : "")
        ),
        servingSizeUnit: attr.servingSizeUnitName || attr.servingSizeUnitSymbol || (
          attr.servingSize && typeof attr.servingSize === "string"
            ? (String(attr.servingSize).match(/^\d+(?:\.\d+)?\s*(.*)$/)?.[1] || "")
            : ""
        ),
        servingSizeUnitId: attr.servingSizeUnitId || 0,
        strength: attr.strength || "",
        activeIngredients: attr.activeIngredients || "",
        excipients: attr.otherIngredients || "",
        nutritionalInfoType: attr.nutritionalInformationImageUrl ? "image" : "label",
        intendedUse: attr.intendedUse || "",
        ageGroup: attr.ageGroupIds && attr.ageGroupIds.length > 0
          ? attr.ageGroupIds.map(String).join(",")
          : String(attr.ageGroupId || ""),
        gender: attr.gender ? attr.gender.toLowerCase() : "",
        vegNonVeg: attr.vegOrNonVegIndicator || "",
        allergenInfo: attr.allergenInformation || "",
        flavour: String(attr.flavourId || ""),
        productClaims: attr.productClaims || "",
        storageCondition: String(attr.storageConditionId || ""),
        countryOfOrigin: String(attr.countryId || ""),

        packagingId: String(packaging.packagingId || ""),
        packId: String(packaging.packId || ""),
        packType: packaging.packType || "",
        unitPerPack: String(packaging.unitPerPack ?? ""),
        numberOfPacks: String(packaging.numberOfPacks ?? ""),
        packSize: String(packaging.packSize ?? ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),

        batchLotNumber: pricing.batchLotNumber || "",
        manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
        expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
        dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
        stockQuantity: String(pricing.stockQuantity ?? ""),
        sellingPrice: String(pricing.sellingPrice ?? ""),
        mrp: String(pricing.mrp ?? ""),
        gstPercentage: pricing.gstPercentage != null ? String(pricing.gstPercentage) : "",
        discountPercentage: String(pricing.discountPercentage ?? ""),
        finalPrice: String(pricing.finalPrice ?? ""),
        hsnCode: String(pricing.hsnCode ?? ""),
        shelfLifeMonths: String(pricing.shelfLifeMonths ?? ""),
        additionalDiscount: pricing.additionalDiscounts || [],
        specialSchemes: pricing.specialSchemes || [],
      }));
    } catch (err) {
      console.error("Failed to load supplement product:", err);
      alert("Failed to load product data");
    }
  };

  const getMinExpiryMonth = () => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    if (!form.manufacturingDate) return currentMonth;
    const minDate = new Date(form.manufacturingDate);
    minDate.setMonth(minDate.getMonth() + 3);
    const mfgMin = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
    return mfgMin > currentMonth ? mfgMin : currentMonth;
  };

  const validate = (): Record<string, string> => {
    // Sync netQuantity compiled string before safeParse
    const compiledNetQty = `${form.netQuantityValue} ${form.netQuantityUnit}`.trim();

    // ── Zod schema validation ─────────────────────────────────────────────────
    const result = supplementProductSchema.safeParse({
      ...form,
      netQuantity: compiledNetQty || form.netQuantity,
      // manufacturingDate/expiryDate must be Date objects; guard against null
      manufacturingDate: form.manufacturingDate instanceof Date ? form.manufacturingDate : new Date("invalid"),
      expiryDate: form.expiryDate instanceof Date ? form.expiryDate : new Date("invalid"),
    });

    const e: Record<string, string> = {};

    // ── Custom value and unit validations for Net Quantity ───────────────────
    if (!form.netQuantityValue) {
      e.netQuantityValue = "Net Quantity is required";
    } else if (isNaN(Number(form.netQuantityValue)) || Number(form.netQuantityValue) <= 0) {
      e.netQuantityValue = "Net Quantity must be a positive number";
    }
    if (!form.netQuantityUnit) {
      e.netQuantityUnit = "Please select a unit";
    }

    // ── SERVING SIZE VALIDATION (COMMENTED OUT — FIELD DISABLED AS "As prescribed by Doctor") ──
    // if (!form.servingSizeValue) {
    //   e.servingSizeValue = "Serving Size is required";
    // } else if (isNaN(Number(form.servingSizeValue)) || Number(form.servingSizeValue) <= 0) {
    //   e.servingSizeValue = "Serving Size must be a positive number";
    // } else if (form.netQuantityValue && Number(form.servingSizeValue) > Number(form.netQuantityValue)) {
    //   e.servingSizeValue = "Serving Size cannot exceed Net Quantity";
    // }
    // if (!form.servingSizeUnit) {
    //   e.servingSizeUnit = "Please select a unit";
    // }

    // ── Custom validation for shelf life (cannot exceed 5 years / 60 months) ──
    if (form.shelfLifeMonths) {
      const slVal = Number(form.shelfLifeMonths);
      if (!isNaN(slVal) && slVal > 60) {
        e.shelfLifeMonths = "Shelf life cannot exceed 5 years (60 months)";
      }
    }

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".");
        // Ignore generic netQuantity schema error since we do granular custom validation
        if (key === "netQuantity") return;
        if (!e[key]) e[key] = issue.message; // keep first error per field
      });
    }

    // ── Extra validations not in Zod (file state) ─────────────────────────────
    if (!form.nutritionalInfoType) e.nutritionalInfoType = "Nutritional Information selection is required";
    if (form.nutritionalInfoType === "image" && !nutritionalImage && !existingNutritionalImageUrl)
      e.nutritionalImage = "Nutritional Image is required";
    // In edit mode, existing images/brochures count as valid
    if (images.length === 0 && existingImages.length === 0)
      e.images = "At least one product image is required";
    if (images.length > 5) e.images = "Maximum 5 images allowed";
    if (selectedCertifications.length === 0) {
      e.certifications = "At least one certification is required";
    } else {
      // Every cert must have either an existing URL or a newly uploaded file
      const missing = selectedCertifications.find((c) => !c.file && !c.existingUrl);
      if (missing) e.certifications = `Please upload the file for "${missing.label}"`;
      // In edit mode, mandatory certs (originally on the product) must still all be present
      if (isEditMode && selectedCertifications.length < mandatoryCertCount) {
        e.certifications = `You must keep all ${mandatoryCertCount} original certifications. Please re-add any removed ones.`;
      }
    }

    return e;
  };

  const handleSubmit = async () => {
    if (isEditMode) {
      await handleUpdate();
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = fieldRefs.current[firstKey] || document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const batchValidation = await validateBatchNumber(form.batchLotNumber);
    if (batchValidation.exists) {
      setErrors((prev) => ({
        ...prev,
        batchLotNumber: "Batch number already exists",
      }));
      const el = fieldRefs.current["batchLotNumber"] || document.querySelector<HTMLElement>(`[data-field="batchLotNumber"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      // ─── Build JSON Payload ───────────────────────────────────────────────────
      const payload = {
        productName: form.productName,
        warningsPrecautions: form.warningsPrecautions,
        productDescription: form.productDescription,
        manufacturerName: form.manufacturerName,
        categoryId: Number(categoryId),

        packagingDetails: [
          {
            packId: Number(form.packId),
            unitPerPack: Number(form.unitPerPack),
            numberOfPacks: Number(form.numberOfPacks),
            packSize: Number(form.packSize),
            minimumOrderQuantity: Number(form.minimumOrderQuantity),
            maximumOrderQuantity: Number(form.maximumOrderQuantity),
          },
        ],

        pricingDetails: [
          {
            batchLotNumber: form.batchLotNumber,
            manufacturingDate: form.manufacturingDate instanceof Date
              ? form.manufacturingDate.toISOString().split("T")[0] + "T00:00:00"
              : null,
            expiryDate: form.expiryDate instanceof Date
              ? form.expiryDate.toISOString().split("T")[0] + "T00:00:00"
              : null,
            shelfLifeMonths: Number(form.shelfLifeMonths),
            stockQuantity: Number(form.stockQuantity),
            dateOfStockEntry: form.dateOfStockEntry instanceof Date
              ? form.dateOfStockEntry.toISOString().split("T")[0] + "T00:00:00"
              : null,
            discountPercentage: Number(form.discountPercentage),
            sellingPrice: Number(form.sellingPrice),
            mrp: Number(form.mrp),
            gstPercentage: Number(form.gstPercentage),
            finalPrice: Number(form.finalPrice),
            hsnCode: Number(form.hsnCode),
            additionalDiscounts: form.additionalDiscount.map((d: any) => ({
              ...(d.additionalDiscountId ? { additionalDiscountId: d.additionalDiscountId } : {}),
              minimumPurchaseQuantity: d.minimumPurchaseQuantity,
              additionalDiscountPercentage: d.additionalDiscountPercentage,
              effectiveStartDate: d.effectiveStartDate,
              effectiveStartTime: d.effectiveStartTime,
              effectiveEndDate: d.effectiveEndDate,
              effectiveEndTime: d.effectiveEndTime,
            })),
            specialSchemes: (form.specialSchemes || []).map((s: any) => ({
              ...s,
              ...(s.specialSchemesId ? { specialSchemesId: s.specialSchemesId } : {}),
            })),
          },
        ],

        productAttributeSupplementsOrNutraceuticals: [
          {
            therapeuticCategoryId: Number(form.therapeuticCategory),
            therapeuticSubCategoryId: Number(form.therapeuticSubcategory),
            brandName: form.brandName,
            variantName: form.variantName,
            dosageFormId: Number(form.dosageForm),
            netQuantity: Number(form.netQuantityValue),
            netQuantityUnitId: Number(
              netQuantityUnitsList.find((item) => extractUnitString(item) === form.netQuantityUnit)?.unitId ||
              netQuantityUnitsList.find((item) => extractUnitString(item) === form.netQuantityUnit)?.id ||
              form.netQuantityUnitId ||
              0
            ),
            servingSize: form.servingSizeValue ? Number(form.servingSizeValue) : null,
            servingSizeUnitId: form.servingSizeUnitId ? Number(form.servingSizeUnitId) : null,
            strength: form.strength,
            activeIngredients: form.activeIngredients,
            otherIngredients: form.excipients,
            nutritionalInformation: form.nutritionalInfoType === "label" ? "As per the label." : "",
            nutritionalInformationImageUrl: "", // Will be updated in Step 2.5 after product creation
            intendedUse: form.intendedUse,
            ageGroupId: form.ageGroup ? Number(form.ageGroup.split(",")[0]) : 0,
            ageGroupIds: form.ageGroup ? form.ageGroup.split(",").map(Number) : [],
            gender: form.gender,
            vegOrNonVegIndicator: form.vegNonVeg,
            allergenInformation: form.allergenInfo,
            flavourId: Number(form.flavour),
            productClaims: form.productClaims,
            storageConditionId: Number(form.storageCondition),
            manufacturerName: form.manufacturerName,
            countryId: Number(form.countryOfOrigin),
            certificateDocuments: selectedCertifications.map((cert) => ({
              certificationId: Number(cert.id),
              certificateUrl: "PENDING", // TODO: upload cert files after submit
            })),
            brochurePath: "PENDING", // TODO: upload brochure after submit
          },
        ],

        productImages: images.map((img) => ({
          productImage: img.name,
        })),
      };

      // ─── STEP 1: Create Product ───────────────────────────────────────────────
      console.log("🚀 Sending Supplement Payload:", payload);
      const response = await createSupplementProduct(payload);
      const productId = response?.data?.productId;
      const productAttributeId = response?.data?.productAttributeSupplementsOrNutraceuticals?.[0]?.productAttributeId;

      if (!productId) throw new Error("Product ID not returned from backend");

      // ─── STEP 2: Upload Product Images ────────────────────────────────────────
      if (images.length > 0) {
        await uploadSupplementProductImages(productId, images);
      }

      // ─── STEP 2.5: Upload Nutritional Information Image ───────────────────────
      if (nutritionalImage && productAttributeId) {
        try {
          await uploadNutritionalInformationImage(productAttributeId, categoryId ?? 0, nutritionalImage);
        } catch (nutritionalErr: any) {
          console.warn("⚠️ Nutritional image upload failed:", nutritionalErr.message);
        }
      }

      // ─── STEP 3: Upload Brochure ──────────────────────────────────────────────
      // NOTE: Backend currently returns 500 with body "Request processed successfully"
      // Wrapping separately so it doesn't block the overall submit while backend is fixed.
      if (brochureFile && productAttributeId) {
        try {
          await uploadSupplementBrochure(productAttributeId, brochureFile);
        } catch (brochureErr: any) {
          // If body says success despite 500 status, treat as non-fatal
          console.warn("⚠️ Brochure upload returned error (likely a backend 500 bug):", brochureErr.message);
        }
      }

      // ─── STEP 4: Upload Certifications (batch) ─────────────────────────────────
      // NOTE: Backend also returns 500 with "Request processed successfully" — same non-fatal pattern.
      if (productAttributeId && selectedCertifications.length > 0) {
        try {
          const certDocs = response?.data?.productAttributeSupplementsOrNutraceuticals?.[0]?.certificateDocuments ?? [];
          const documentIds: number[] = [];
          const certFiles: File[] = [];
          selectedCertifications.forEach((cert) => {
            const matched = certDocs.find((c: any) => c.certificationId === Number(cert.id));
            if (matched?.productCertificateDocumentId && cert.file) {
              documentIds.push(matched.productCertificateDocumentId);
              certFiles.push(cert.file);
            }
          });
          if (documentIds.length > 0 && certFiles.length > 0) {
            await uploadSupplementCertifications(productAttributeId, documentIds, certFiles);
          }
        } catch (certErr: any) {
          console.warn("⚠️ Certifications upload returned error (likely a backend 500 bug):", certErr.message);
        }
      }

      setShowSuccess(true);
    } catch (err) {
      console.error("❌ Submit Error:", err);
      alert("❌ Failed to create supplement product");
    } finally {
      setSubmitting(false);
    }
  };

  // ── handleUpdate: called when mode === "edit" ────────────────────────────────
  const handleUpdate = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      console.warn("⚠️ Validation failed during update:", errs);
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = fieldRefs.current[firstKey] || document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productName: form.productName,
        warningsPrecautions: form.warningsPrecautions,
        productDescription: form.productDescription,
        manufacturerName: form.manufacturerName,
        categoryId: Number(effectiveCategoryId),

        packagingDetails: [
          {
            packId: Number(form.packId),
            unitPerPack: Number(form.unitPerPack),
            numberOfPacks: Number(form.numberOfPacks),
            packSize: Number(form.packSize),
            minimumOrderQuantity: Number(form.minimumOrderQuantity),
            maximumOrderQuantity: Number(form.maximumOrderQuantity),
          },
        ],

        pricingDetails: [
          {
            batchLotNumber: form.batchLotNumber,
            manufacturingDate: form.manufacturingDate instanceof Date
              ? form.manufacturingDate.toISOString().split("T")[0] + "T00:00:00" : null,
            expiryDate: form.expiryDate instanceof Date
              ? form.expiryDate.toISOString().split("T")[0] + "T00:00:00" : null,
            shelfLifeMonths: Number(form.shelfLifeMonths),
            stockQuantity: Number(form.stockQuantity),
            dateOfStockEntry: form.dateOfStockEntry instanceof Date
              ? form.dateOfStockEntry.toISOString().split("T")[0] + "T00:00:00" : null,
            discountPercentage: Number(form.discountPercentage),
            sellingPrice: Number(form.sellingPrice),
            mrp: Number(form.mrp),
            gstPercentage: form.gstPercentage ? Number(form.gstPercentage) : 0,
            finalPrice: Number(form.finalPrice),
            hsnCode: Number(form.hsnCode),
            additionalDiscounts: form.additionalDiscount.map((d: any) => ({
              ...(d.additionalDiscountId ? { additionalDiscountId: d.additionalDiscountId } : {}),
              minimumPurchaseQuantity: d.minimumPurchaseQuantity,
              additionalDiscountPercentage: d.additionalDiscountPercentage,
              effectiveStartDate: d.effectiveStartDate,
              effectiveStartTime: d.effectiveStartTime,
              effectiveEndDate: d.effectiveEndDate,
              effectiveEndTime: d.effectiveEndTime,
            })),
            specialSchemes: (form.specialSchemes || []).map((s: any) => ({
              ...s,
              ...(s.specialSchemesId ? { specialSchemesId: s.specialSchemesId } : {}),
            })),
          },
        ],

        productAttributeSupplementsOrNutraceuticals: [
          {
            therapeuticCategoryId: form.therapeuticCategory,
            therapeuticSubCategoryId: form.therapeuticSubcategory,
            brandName: form.brandName,
            variantName: form.variantName,
            dosageFormId: Number(form.dosageForm),
            netQuantity: Number(form.netQuantityValue),
            netQuantityUnitId: Number(
              netQuantityUnitsList.find((item) => extractUnitString(item) === form.netQuantityUnit)?.unitId ||
              netQuantityUnitsList.find((item) => extractUnitString(item) === form.netQuantityUnit)?.id ||
              form.netQuantityUnitId ||
              0
            ),
            servingSize: form.servingSizeValue ? Number(form.servingSizeValue) : null,
            servingSizeUnitId: form.servingSizeUnitId ? Number(form.servingSizeUnitId) : null,
            strength: form.strength,
            activeIngredients: form.activeIngredients,
            otherIngredients: form.excipients,
            nutritionalInformation: form.nutritionalInfoType === "label" ? "As per the label." : "",
            intendedUse: form.intendedUse,
            ageGroupId: form.ageGroup ? Number(form.ageGroup.split(",")[0]) : 0,
            ageGroupIds: form.ageGroup ? form.ageGroup.split(",").map(Number) : [],
            gender: form.gender,
            vegOrNonVegIndicator: form.vegNonVeg,
            allergenInformation: form.allergenInfo,
            flavourId: Number(form.flavour),
            productClaims: form.productClaims,
            storageConditionId: Number(form.storageCondition),
            countryId: Number(form.countryOfOrigin),
            certificateDocuments: selectedCertifications.map((cert) => ({
              certificationId: Number(cert.id),
              certificateUrl: cert.existingUrl || "PENDING",
            })),
            brochurePath: existingBrochureUrl || "PENDING",
          },
        ],

        retainedImageUrls: existingImages,
      };

      console.log("🚀 Sending update payload:", payload);

      // ─── STEP 1: Update core product JSON ────────────────────────────────────
      const response = await updateProduct(form.productId, payload);

      console.log("✅ Update successful response:", response);

      const attrId = form.productAttributeId;

      // ─── STEP 2: Upload new product images (if any new ones selected) ─────────
      if (images.length > 0) {
        await uploadSupplementProductImages(form.productId, images);
      }

      // ─── STEP 3: Upload new nutritional image (if replaced) ──────────────────
      if (nutritionalImage && attrId) {
        try {
          await uploadNutritionalInformationImage(attrId, Number(effectiveCategoryId) || 0, nutritionalImage);
        } catch (e: any) {
          console.warn("⚠️ Nutritional image upload failed:", e.message);
        }
      }

      // ─── STEP 4: Upload new brochure (if replaced) ───────────────────────────
      if (brochureFile && attrId) {
        try {
          await uploadSupplementBrochure(attrId, brochureFile);
        } catch (e: any) {
          console.warn("⚠️ Brochure upload failed:", e.message);
        }
      }

      // ─── STEP 5: Upload new cert files (only newly added ones) ───────────────
      if (attrId && response?.data) {
        // Extract the latest certificate documents from the response to get their real DB IDs
        const responseSuppAttr = response.data.productAttributeSupplementsOrNutraceuticals?.[0];
        const responseCerts = responseSuppAttr?.certificateDocuments || [];

        const newCerts = selectedCertifications.filter((c) => c.file && !c.existingUrl);
        if (newCerts.length > 0) {
          try {
            const documentIds: number[] = [];
            const certFiles: File[] = [];

            newCerts.forEach((cert) => {
              // Match by certificationId (the master ID) to find the new productCertificateDocumentId
              const matched = responseCerts.find(
                (rc: any) => Number(rc.certificationId) === Number(cert.id)
              );
              if (matched?.productCertificateDocumentId) {
                documentIds.push(matched.productCertificateDocumentId);
                certFiles.push(cert.file as File);
              }
            });

            if (documentIds.length > 0) {
              console.log("📂 Uploading cert files for DB IDs:", documentIds);
              await uploadSupplementCertifications(attrId, documentIds, certFiles);
            }
          } catch (e: any) {
            console.warn("⚠️ Cert upload failed:", e.message);
          }
        }
      }

      setModalType(isEditMode ? "update" : "create");
      setShowSuccess(true);
    } catch (err) {
      console.error("❌ Update Error:", err);
      alert("❌ Failed to update supplement product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PopupModal
        isOpen={showSuccess}
        title={isEditMode ? "Product Updated Successfully!" : "Product Saved Successfully!"}
        description={
          isEditMode
            ? "Your product has been updated and is now live on the platform"
            : "Your product has been saved and is now live on the platform"
        }
        primaryActionText="View Product"
        secondaryActionText={isEditMode ? "Continue Editing" : "Continue Adding"}
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={handleViewProduct}
        onSecondaryAction={isEditMode ? handleContinueEditing : handleContinueAdding}
        onTertiaryAction={handleBackToDashboard}
        onClose={() => setShowSuccess(false)}
      />

      {showAdditionalDiscount && (
        <CommonModal
          onClose={() => setShowAdditionalDiscount(false)}
          width="w-[600px]"
        >
          <div className="h-[80vh] overflow-y-auto flex flex-col p-6">
            <AdditionalDiscountType
              categoryId={effectiveCategoryId ? Number(effectiveCategoryId) : undefined}
              onClose={() => setShowAdditionalDiscount(false)}
              initialData={form.additionalDiscount}
              baseDiscountPercentage={Number(form.discountPercentage) || 0}
              baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
              onSaveAdditionalDiscount={(data: any) => {
                setForm((prev) => ({
                  ...prev,
                  additionalDiscount: data || [],
                }));
              }}
              initialSchemesData={form.specialSchemes}
              onSaveSpecialSchemes={(data: any) => {
                setForm((prev) => ({
                  ...prev,
                  specialSchemes: data || [],
                }));
              }}
            />
          </div>
        </CommonModal>
      )}

      <form
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-5 w-full"
      >

        {/* ── Section 1: Product Details ──────────────────────────────────────── */}
        <div className="relative border border-neutral-200 rounded-xl p-6 bg-white">
          <div className="text-h4 font-semibold">Product Details</div>
          <div className="border-b border-neutral-200 mt-3"></div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            {/* ROW 1 */}
            {/* Product Name */}
            <div data-field="productName">
              <Input
                label="Product Name"
                name="productName"
                id="productName"
                placeholder="e.g., Vitamin C Gummies"
                onChange={handleChange}
                value={form.productName}
                error={errors.productName}
                required
                maxLength={150}
                readOnly={isEditMode}
              />
            </div>
            {/* Therapeutic Category */}
            <div className="flex flex-col gap-0" data-field="therapeuticCategory">
              <label className={fieldLabel}>Therapeutic Category {requiredStar}</label>
              {/*
              <Select
                options={therapeuticCategoryOptions}
                isLoading={loadingTherapeuticCategories}
                value={therapeuticCategoryOptions.find(o => String(o.value) === String(form.therapeuticCategory)) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, therapeuticCategory: selected ? selected.value : "", therapeuticSubcategory: "" }));
                  if (errors.therapeuticCategory) setErrors((p) => { const n = { ...p }; delete n.therapeuticCategory; return n; });
                }}
                placeholder="Select category"
                theme={selectTheme}
                styles={selectStyles("therapeuticCategory")}
                isDisabled={isEditMode}
              />
              {errors.therapeuticCategory && <p className={errorMsg}>{errors.therapeuticCategory}</p>}
              */}
              <Dropdown
                options={therapeuticCategoryOptions}
                isLoading={loadingTherapeuticCategories}
                value={form.therapeuticCategory}
                onChange={(val) => {
                  setForm((p) => ({ ...p, therapeuticCategory: val, therapeuticSubcategory: "" }));
                  if (errors.therapeuticCategory) setErrors((p) => { const n = { ...p }; delete n.therapeuticCategory; return n; });
                }}
                placeholder="Select category"
                isDisabled={isEditMode}
                error={errors.therapeuticCategory ? " " : ""}
              />
              {errors.therapeuticCategory && <p className={errorMsg}>{errors.therapeuticCategory}</p>}
            </div>

            {/* ROW 2 */}
            {/* Therapeutic Subcategory */}
            <div className="flex flex-col gap-0" data-field="therapeuticSubcategory">
              <label className={fieldLabel}>Therapeutic Subcategory {requiredStar}</label>
              {/*
              <Select
                options={subCategoryOptions}
                isLoading={loadingSubcategories}
                value={subCategoryOptions.find(o => String(o.value) === String(form.therapeuticSubcategory)) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, therapeuticSubcategory: selected ? selected.value : "" }));
                  if (errors.therapeuticSubcategory) setErrors((p) => { const n = { ...p }; delete n.therapeuticSubcategory; return n; });
                }}
                placeholder={form.therapeuticCategory ? "Select sub-category" : "Select category first"}
                isDisabled={isEditMode || !form.therapeuticCategory}
                theme={selectTheme}
                styles={selectStyles("therapeuticSubcategory")}
              />
              {errors.therapeuticSubcategory && <p className={errorMsg}>{errors.therapeuticSubcategory}</p>}
              */}
              <Dropdown
                options={subCategoryOptions}
                isLoading={loadingSubcategories}
                value={form.therapeuticSubcategory}
                onChange={(val) => {
                  setForm((p) => ({ ...p, therapeuticSubcategory: val }));
                  if (errors.therapeuticSubcategory) setErrors((p) => { const n = { ...p }; delete n.therapeuticSubcategory; return n; });
                }}
                placeholder={form.therapeuticCategory ? "Select sub-category" : "Select category first"}
                isDisabled={isEditMode || !form.therapeuticCategory}
                error={errors.therapeuticSubcategory ? " " : ""}
                className="[&_.border-2]:!border-t [&_.border-2]:!border-r [&_.border-2]:!border-b [&_.border-2]:!border-l"
              />
              {errors.therapeuticSubcategory && <p className={errorMsg}>{errors.therapeuticSubcategory}</p>}
            </div>
            {/* Brand Name */}
            <div data-field="brandName">
              <Input
                label="Brand Name"
                name="brandName"
                id="brandName"
                placeholder="e.g., HealthPlus"
                onChange={handleChange}
                value={form.brandName}
                maxLength={60}
                error={errors.brandName}
                required
                readOnly={isEditMode}
              />
            </div>

            {/* ROW 3 */}
            {/* Variant Name */}
            <div data-field="variantName">
              <Input
                label="Variant Name"
                name="variantName"
                id="variantName"
                placeholder="e.g., Orange Flavor, Sugar-Free"
                onChange={handleChange}
                value={form.variantName}
                maxLength={60}
              />
            </div>
            {/* Dosage Form */}
            <div className="flex flex-col gap-0" data-field="dosageForm">
              <label className={fieldLabel}>Dosage Form {requiredStar}</label>
              {/*
              <Select
                options={dosageFormOptions}
                value={dosageFormOptions.find(o => o.value === form.dosageForm) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, dosageForm: selected ? selected.value : "" }));
                  if (errors.dosageForm) setErrors((p) => { const n = { ...p }; delete n.dosageForm; return n; });
                }}
                placeholder={loadingDosageForms ? "Loading..." : "Select dosage form"}
                theme={selectTheme}
                styles={selectStyles("dosageForm")}
                isDisabled={isEditMode || loadingDosageForms}
              />
              {errors.dosageForm && <p className={errorMsg}>{errors.dosageForm}</p>}
              */}
              <Dropdown
                options={dosageFormOptions}
                value={form.dosageForm}
                onChange={(val) => {
                  setForm((p) => ({ ...p, dosageForm: val, servingSizeUnit: "" }));
                  if (errors.dosageForm) setErrors((p) => { const n = { ...p }; delete n.dosageForm; return n; });
                }}
                placeholder={loadingDosageForms ? "Loading..." : "Select dosage form"}
                isDisabled={isEditMode || loadingDosageForms}
                error={errors.dosageForm ? " " : ""}
              />
              {errors.dosageForm && <p className={errorMsg}>{errors.dosageForm}</p>}
            </div>

            {/* ROW 4 */}
            {/* Net Quantity */}
            <div data-field="netQuantity">
              <NumericInputWithUnit
                label="Net Quantity"
                name="netQuantityValue"
                placeholder="e.g., 60, 200, 100"
                value={form.netQuantityValue}
                unit={form.netQuantityUnit}
                onValueChange={handleNetQuantityValueChange}
                onUnitChange={handleNetQuantityUnitChange}
                error={errors.netQuantityValue || errors.netQuantity}
                options={netQuantityUnitOptions}
                required
                readOnly={isEditMode}
              />
            </div>

            {/* Serving Size */}
            <div data-field="servingSize">
              {/*
              <NumericInputWithUnit
                label="Serving Size"
                name="servingSizeValue"
                placeholder="e.g., 1, 5, 10"
                value={form.servingSizeValue}
                unit={form.servingSizeUnit}
                onValueChange={handleServingSizeValueChange}
                onUnitChange={handleServingSizeUnitChange}
                error={errors.servingSizeValue}
                options={servingSizeUnitOptions}
                required
                readOnly={isEditMode}
              />
              */}
              <Input
                label="Serving Size"
                name="servingSizeValue"
                placeholder="As prescribed by Doctor"
                value=""
                onChange={() => { }}
                disabled={true}
              />
            </div>

            {/* ROW 5 */}
            {/* Strength / Composition */}
            <div data-field="strength">
              <Input
                label="Strength / Composition"
                name="strength"
                id="strength"
                placeholder="e.g., Vitamin C 500mg"
                onChange={handleChange}
                value={form.strength}
                error={errors.strength}
                required
                readOnly={isEditMode}
              />
            </div>

            {/* ROW 5 */}
            {/* Active Ingredients */}
            <div data-field="activeIngredients">
              <Input
                label="Active Ingredients"
                name="activeIngredients"
                id="activeIngredients"
                placeholder="e.g., Aloe vera, Vitamin C, Vitamin D3, Magnesium"
                onChange={handleChange}
                value={form.activeIngredients}
                error={errors.activeIngredients}
                required
                readOnly={isEditMode}
              />
            </div>
            {/* Excipients / Other Ingredients */}
            <div data-field="excipients">
              <Input
                label="Excipients / Other Ingredients"
                name="excipients"
                id="excipients"
                placeholder="List of excipients (comma separated)"
                onChange={handleChange}
                value={form.excipients}
                error={errors.excipients}
              />
            </div>

            {/* ROW 6 */}
            {/* Nutritional Information Table */}
            <div className="flex flex-col gap-0" data-field="nutritionalInfoType">
              <label className={fieldLabel}>Nutritional Information Table {requiredStar}</label>
              {/*
              <Select
                options={nutritionalInfoOptions}
                value={nutritionalInfoOptions.find(o => o.value === form.nutritionalInfoType) || null}
                onChange={(selected) => {
                  const val = selected ? selected.value : "";
                  setForm((p) => ({ ...p, nutritionalInfoType: val }));
                  if (val === "label") {
                    setNutritionalImage(null);
                    setErrors((p) => { const n = { ...p }; delete n.nutritionalImage; return n; });
                  }
                  if (errors.nutritionalInfoType) setErrors((p) => { const n = { ...p }; delete n.nutritionalInfoType; return n; });
                }}
                placeholder="Select option"
                theme={selectTheme}
                styles={selectStyles("nutritionalInfoType")}
              />
              {errors.nutritionalInfoType && <p className={errorMsg}>{errors.nutritionalInfoType}</p>}
              */}
              <Dropdown
                options={nutritionalInfoOptions}
                value={form.nutritionalInfoType}
                onChange={(val) => {
                  setForm((p) => ({ ...p, nutritionalInfoType: val }));
                  if (val === "label") {
                    setNutritionalImage(null);
                    setErrors((p) => { const n = { ...p }; delete n.nutritionalImage; return n; });
                  }
                  if (errors.nutritionalInfoType) setErrors((p) => { const n = { ...p }; delete n.nutritionalInfoType; return n; });
                }}
                placeholder="Select option"
                error={errors.nutritionalInfoType ? " " : ""}
              />
              {errors.nutritionalInfoType && <p className={errorMsg}>{errors.nutritionalInfoType}</p>}
            </div>

            {form.nutritionalInfoType === "image" && (
              <div data-field="nutritionalImage">
                {/* Legacy Hardcoded Upload commented out
                <div className="flex flex-col gap-0">
                  <label className={fieldLabel}>Upload Nutritional Information {requiredStar}</label>

                  <div className="flex items-center w-full h-14 rounded-2xl border border-neutral-500 bg-white overflow-hidden">
                    <div className="flex items-center justify-center h-full px-4 bg-[#DED0FE]">
                      <img src="/icons/UploadIcon.svg" className="w-6 h-6" />
                    </div>

                    <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
                      {nutritionalImage || (existingNutritionalImageUrl && !nutritionalImage) ? (
                        <div className="flex items-center bg-[#FDEBEB] text-sm px-3 py-2 rounded-lg max-w-full">
                          <span className="truncate">
                            {nutritionalImage ? nutritionalImage.name : "Current Nutritional Image"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (nutritionalImage) {
                                setNutritionalImage(null);
                                if (nutritionalInputRef.current) nutritionalInputRef.current.value = "";
                              } else {
                                setExistingNutritionalImageUrl(null);
                              }
                            }}
                            className="ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#969793]">Upload the Nutritional Information Image</span>
                      )}
                    </div>

                    {existingNutritionalImageUrl && !nutritionalImage && (
                      <a href={existingNutritionalImageUrl} target="_blank" rel="noreferrer" className="text-purple-600 text-xs underline px-2">View</a>
                    )}

                    {!nutritionalImage && (!existingNutritionalImageUrl || nutritionalImage === null) && (
                      <label className="cursor-pointer px-4">
                        <img src="/icons/UploadAddIcon.svg" className="w-6 h-6" />
                        <input
                          ref={nutritionalInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleNutritionalUpload(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {errors.nutritionalImage && <p className={errorMsg}>{errors.nutritionalImage}</p>}
                </div>
                */}
                <UploadInput
                  onFileSelect={(file) => {
                    setNutritionalImage(file);
                    if (!file) {
                      setExistingNutritionalImageUrl(null);
                    }
                    if (file && errors.nutritionalImage) {
                      setErrors((p) => { const n = { ...p }; delete n.nutritionalImage; return n; });
                    }
                  }}
                  existingFile={existingNutritionalImageUrl || undefined}
                  label={`Upload Nutritional Information ${requiredStar}`}
                  placeholder="Upload the Nutritional Information Image"
                  accept="image/jpeg,image/png,image/jpg"
                />
                {errors.nutritionalImage && <p className={errorMsg}>{errors.nutritionalImage}</p>}
              </div>
            )}
            {/* Intended Use / Health Benefit */}
            <div data-field="intendedUse">
              <Input
                label="Intended Use / Health Benefit"
                name="intendedUse"
                id="intendedUse"
                placeholder="e.g., Immunity booster, Bone health (Min 10 chars)"
                onChange={handleChange}
                value={form.intendedUse}
                error={errors.intendedUse}
                required
              />
            </div>

            {/* ROW 7 */}
            {/* Age Group */}
            <div className="flex flex-col gap-0" data-field="ageGroup">
              <label className={fieldLabel}>Age Group {requiredStar}</label>
              {/*
              <Select
                options={ageGroupOptions}
                value={ageGroupOptions.find(o => o.value === form.ageGroup) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, ageGroup: selected ? selected.value : "" }));
                  if (errors.ageGroup) setErrors((p) => { const n = { ...p }; delete n.ageGroup; return n; });
                }}
                placeholder={loadingAgeGroups ? "Loading..." : "Select age group"}
                theme={selectTheme}
                styles={selectStyles("ageGroup")}
                isDisabled={isEditMode || loadingAgeGroups}
              />
              {errors.ageGroup && <p className={errorMsg}>{errors.ageGroup}</p>}
              */}
              <CheckboxDropdown
                options={ageGroupOptions}
                selectedValues={form.ageGroup ? form.ageGroup.split(",") : []}
                onChange={(values) => {
                  setForm((p) => ({ ...p, ageGroup: values.join(",") }));
                  if (errors.ageGroup) {
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.ageGroup;
                      return n;
                    });
                  }
                }}
                placeholder={loadingAgeGroups ? "Loading..." : "Select age group"}
                disabled={isEditMode || loadingAgeGroups}
                error={errors.ageGroup ? " " : ""}
                showSelectAll={false}
              />
              {errors.ageGroup && <p className={errorMsg}>{errors.ageGroup}</p>}
            </div>
            {/* Gender */}
            <div className="flex flex-col gap-0" data-field="gender">
              <label className={fieldLabel}>Gender {requiredStar}</label>
              {/*
              <Select
                options={genderOptions}
                value={genderOptions.find(o => o.value === form.gender) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, gender: selected ? selected.value : "" }));
                  if (errors.gender) setErrors((p) => { const n = { ...p }; delete n.gender; return n; });
                }}
                placeholder="Select gender"
                theme={selectTheme}
                styles={selectStyles("gender")}
              />
              {errors.gender && <p className={errorMsg}>{errors.gender}</p>}
              */}
              <Dropdown
                options={genderOptions}
                value={form.gender}
                onChange={(val) => {
                  setForm((p) => ({ ...p, gender: val }));
                  if (errors.gender) setErrors((p) => { const n = { ...p }; delete n.gender; return n; });
                }}
                placeholder="Select gender"
                error={errors.gender ? " " : ""}
              />
              {errors.gender && <p className={errorMsg}>{errors.gender}</p>}
            </div>

            {/* ROW 8 */}
            {/* Dietary Classification — Radio Buttons */}
            <div data-field="vegNonVeg" className="flex flex-col gap-0.5 pt-1.5">
              <label className={fieldLabel}>
                Dietary Classification {requiredStar}
              </label>
              <div className={`flex items-center gap-6 h-14 ${isEditMode ? "opacity-60 pointer-events-none" : ""}`}>
                {(["Veg", "Non-Veg"] as const).map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="vegNonVeg"
                      value={option}
                      checked={form.vegNonVeg === option}
                      onChange={() => !isEditMode && handleRadioChange("vegNonVeg", option)}
                      className="w-4 h-4 accent-primary-900 cursor-pointer"
                      disabled={isEditMode}
                    />
                    <span className="text-neutral-800 font-medium text-sm">{option}</span>
                  </label>
                ))}
              </div>
              {errors.vegNonVeg && <p className={errorMsg}>{errors.vegNonVeg}</p>}
            </div>
            {/* Allergen Information */}
            <div data-field="allergenInfo">
              <Input
                label="Allergen Information"
                name="allergenInfo"
                id="allergenInfo"
                placeholder="e.g., Contains soy, nuts, gluten (Min 3 chars)"
                onChange={handleChange}
                value={form.allergenInfo}
                error={errors.allergenInfo}
                required
              />
            </div>

            {/* ROW 9 */}
            {/* Flavour */}
            <div className="flex flex-col gap-0" data-field="flavour">
              <label className={fieldLabel}>Flavour {requiredStar}</label>
              {/*
              <Select
                options={flavourOptions}
                value={flavourOptions.find(o => o.value === form.flavour) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, flavour: selected ? selected.value : "" }));
                  if (errors.flavour) setErrors((p) => { const n = { ...p }; delete n.flavour; return n; });
                }}
                placeholder={loadingFlavours ? "Loading..." : "Select flavour"}
                theme={selectTheme}
                styles={selectStyles("flavour")}
                isDisabled={loadingFlavours}
              />
              {errors.flavour && <p className={errorMsg}>{errors.flavour}</p>}
              */}
              <Dropdown
                options={flavourOptions}
                value={form.flavour}
                onChange={(val) => {
                  setForm((p) => ({ ...p, flavour: val }));
                  if (errors.flavour) setErrors((p) => { const n = { ...p }; delete n.flavour; return n; });
                }}
                placeholder={loadingFlavours ? "Loading..." : "Select flavour"}
                isDisabled={loadingFlavours}
                error={errors.flavour ? " " : ""}
              />
              {errors.flavour && <p className={errorMsg}>{errors.flavour}</p>}
            </div>
            {/* Product Claims */}
            <div data-field="productClaims">
              <Input
                label="Product Claims"
                name="productClaims"
                id="productClaims"
                placeholder="e.g., Sugar-Free, Gluten-Free"
                onChange={handleChange}
                value={form.productClaims}
                error={errors.productClaims}
                required
              />
            </div>

            {/* ROW 10 */}
            {/* Storage Condition */}
            <div className="flex flex-col gap-0" data-field="storageCondition">
              <label className={fieldLabel}>Storage Condition {requiredStar}</label>
              {/*
              <Select
                options={storageOptions}
                value={storageOptions.find(o => o.value === form.storageCondition) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, storageCondition: selected ? selected.value : "" }));
                  if (errors.storageCondition) setErrors((p) => { const n = { ...p }; delete n.storageCondition; return n; });
                }}
                placeholder={loadingStorageConditions ? "Loading..." : "Select storage condition"}
                theme={selectTheme}
                styles={selectStyles("storageCondition")}
                isDisabled={hasStock || loadingStorageConditions}
              />
              {errors.storageCondition && <p className={errorMsg}>{errors.storageCondition}</p>}
              */}
              <Dropdown
                options={storageOptions}
                value={form.storageCondition}
                onChange={(val) => {
                  setForm((p) => ({ ...p, storageCondition: val }));
                  if (errors.storageCondition) setErrors((p) => { const n = { ...p }; delete n.storageCondition; return n; });
                }}
                placeholder={loadingStorageConditions ? "Loading..." : "Select storage condition"}
                isDisabled={hasStock || loadingStorageConditions}
                error={errors.storageCondition ? " " : ""}
              />
              {errors.storageCondition && <p className={errorMsg}>{errors.storageCondition}</p>}
            </div>
            {/* Manufacturer Name */}
            <div data-field="manufacturerName">
              <Input
                label="Manufacturer Name"
                name="manufacturerName"
                id="manufacturerName"
                placeholder="Manufacturer company name"
                onChange={handleChange}
                value={form.manufacturerName}
                maxLength={100}
                error={errors.manufacturerName}
                required
                readOnly={isEditMode}
              />
            </div>

            {/* ROW 11 */}
            {/* Country of Origin */}
            <div className="flex flex-col gap-0" data-field="countryOfOrigin">
              <label className={fieldLabel}>Country of Origin {requiredStar}</label>
              <Dropdown
                options={countryOptions}
                value={form.countryOfOrigin}
                onChange={(val) => {
                  setForm((p) => ({ ...p, countryOfOrigin: val }));
                  if (errors.countryOfOrigin) setErrors((p) => { const n = { ...p }; delete n.countryOfOrigin; return n; });
                }}
                placeholder={loadingCountries ? "Loading..." : "Select country"}
                isDisabled={isEditMode || loadingCountries}
                error={errors.countryOfOrigin ? " " : ""}
              />
              {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
            </div>
            {/* Certifications / Compliance Checkbox Dropdown */}
            <div className="flex flex-col gap-0" data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
              <CheckboxDropdown
                options={certificationOptions}
                selectedValues={selectedCertifications.map(c => c.id)}
                onChange={(values) => {
                  const preservedIds = isEditMode
                    ? selectedCertifications.filter((c) => c.existingUrl).map((c) => c.id)
                    : [];
                  const finalValues = Array.from(new Set([...values, ...preservedIds]));

                  const newCerts = finalValues.map(val => {
                    const existing = selectedCertifications.find(c => c.id === val);
                    if (existing) return existing;
                    const opt = certificationOptions.find(o => o.value === val);
                    return {
                      id: val,
                      label: opt?.label || "",
                      tagCode: (opt as any)?.tagCode || "",
                      existingUrl: null,
                      file: null,
                      previewUrl: null
                    } as any;
                  });
                  setSelectedCertifications(newCerts);
                  if (errors.certifications) {
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.certifications;
                      return n;
                    });
                  }
                }}
                placeholder={loadingCertifications ? "Loading..." : "Select certifications"}
                disabled={loadingCertifications}
                error={errors.certifications ? " " : ""}
              />
              {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
            </div>

            {/* Upload Certifications / Compliance List */}
            {selectedCertifications.length === 0 ? (
              <div className="flex flex-col gap-0 col-span-1" data-field="certUploadFallback">
                <label className={fieldLabel}>Upload Certifications / Compliance {requiredStar}</label>
                <div className="flex items-center w-full h-[52px] rounded-lg border border-neutral-300 bg-white overflow-hidden">
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
                <div key={cert.id} className="flex flex-col gap-0 col-span-1">
                  <label className={fieldLabel}>Upload {cert.label} {requiredStar}</label>
                  <UploadInput
                    onFileSelect={(file) => {
                      if (file) {
                        handleCertFileSelect(cert.id, file);
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

            {/* Upload Brochure */}
            <div className="flex flex-col gap-0" data-field="brochureFile">
              <label className={fieldLabel}>Upload Product Brochure / User Manual</label>
              <UploadInput
                key={brochureUploadKey}
                onFileSelect={handleBrochureUpload}
                existingFile={existingBrochureUrl || undefined}
                label=""
                placeholder="Upload the Product Brochure"
                accept="application/pdf"
              />
              {errors.brochureFile && <p className={errorMsg}>{errors.brochureFile}</p>}
            </div>

            {/* Bottom Section Wrapper to protect layout from dynamic shifting above */}
            <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-3">
              {/* Warnings / Precautions */}
              <div className="flex flex-col gap-0" data-field="warningsPrecautions">
                <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
                <textarea
                  ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
                  name="warningsPrecautions"
                  value={form.warningsPrecautions}
                  onChange={handleChange}
                  placeholder="e.g., Not for pregnant women"
                  maxLength={255}
                  className={`w-full h-36 px-4 rounded-lg p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] text-[#3C3D3A] placeholder:text-sneutral-400 resize-none overflow-y-auto border bg-white focus:outline-none transition-all duration-200 ${errors.warningsPrecautions ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-pneutral-300 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`}
                />
                {errors.warningsPrecautions && <p className={errorMsg}>{errors.warningsPrecautions}</p>}
              </div>
              {/* Product Description */}
              <div className="flex flex-col gap-0" data-field="productDescription">
                <label className={fieldLabel}>Product Description {requiredStar}</label>
                <textarea
                  ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                  name="productDescription"
                  value={form.productDescription}
                  onChange={handleChange}
                  placeholder="Provide a detailed description of the product (Min 10 chars)"
                  maxLength={255}
                  className={`w-full h-36 px-4 rounded-lg p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] text-[#3C3D3A] placeholder:text-sneutral-400 resize-none overflow-y-auto border bg-white focus:outline-none transition-all duration-200 ${errors.productDescription ? "border-warning-500 focus:border-warning-500 focus:ring-1 focus:ring-warning-500" : "border-pneutral-300 focus:border-secondary-300 focus:ring-1 focus:ring-secondary-300"}`}
                />
                {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
              </div>
            </div>

          </div>
        </div>

        {/* Packaging & Order Details */}
        <div className="relative border border-neutral-200 rounded-xl p-6 bg-white">
          <div className="text-h4 font-semibold">Packaging & Order Details</div>

          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div className="flex flex-col gap-0">
              <label className="text-label-l4 text-neutral-700 font-medium">
                Pack Type
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              {/*
              <Select
                options={packTypeApiOptions}
                value={
                  packTypeApiOptions.find(
                    (o: any) => String(o.value) === String(form.packId),
                  ) || null
                }
                onChange={(selected: any) =>
                  setForm((prev) => ({
                    ...prev,
                    packId: selected?.value || "",
                    packType: selected?.label || "",
                  }))
                }
                placeholder={loadingPackTypes ? "Loading..." : "Select Pack Type"}
                isDisabled={isEditMode || loadingPackTypes}
                theme={selectTheme}
                styles={selectStyles("packId")}
              />
              {errors.packId && (
                <p className="text-red-500 text-sm mt-1">{errors.packId}</p>
              )}
              */}
              <Dropdown
                options={packTypeApiOptions}
                value={form.packId}
                onChange={(val, label) =>
                  setForm((prev) => ({
                    ...prev,
                    packId: val,
                    packType: label,
                  }))
                }
                placeholder={loadingPackTypes ? "Loading..." : "Select Pack Type"}
                isDisabled={isEditMode || loadingPackTypes}
                error={errors.packId ? " " : ""}
              />
              {errors.packId && <p className={errorMsg}>{errors.packId}</p>}
            </div>

            <Input
              type="number"
              label="Number of Units per Pack Type"
              name="unitPerPack"
              id="unitPerPack"
              placeholder=""
              value={form.unitPerPack}
              onChange={handleChange}
              error={errors.unitPerPack}
              required
              min={1}
              step={1}
              readOnly={hasStock}
            />

            <Input
              type="number"
              label="Number of Packs"
              name="numberOfPacks"
              id="numberOfPacks"
              placeholder=""
              value={form.numberOfPacks}
              onChange={handleChange}
              error={errors.numberOfPacks}
              required
              min={1}
              step={1}
              readOnly={hasStock}
            />

            <Input
              type="number"
              label="Pack Size (No. of packs X No. of Units per pack type)"
              name="packSize"
              id="packSize"
              placeholder=""
              value={form.packSize}
              onChange={handleChange}
              readOnly
              required
            />

            <div className="font-open-sans text-[21px] leading-[24px] tracking-[-0.02em] font-normal align-middle col-span-2 mt-3">
              Order Details
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              type="number"
              label="Min Order Qty"
              name="minimumOrderQuantity"
              id="minimumOrderQuantity"
              placeholder=""
              value={form.minimumOrderQuantity}
              onChange={handleChange}
              min={1}
              step={1}
              error={errors.minimumOrderQuantity}
              required
            />
            <Input
              type="number"
              label="Max Order Qty"
              name="maximumOrderQuantity"
              id="maximumOrderQuantity"
              placeholder=""
              value={form.maximumOrderQuantity}
              onChange={handleChange}
              min={1}
              step={1}
              error={errors.maximumOrderQuantity}
              required
            />

            <div className="font-open-sans text-[21px] leading-[24px] tracking-[-0.02em] font-normal align-middle col-span-2 mt-3">
              Batch Management
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              label="Batch/Lot Number"
              name="batchLotNumber"
              id="batchLotNumber"
              placeholder=""
              value={form.batchLotNumber}
              onChange={handleChange}
              readOnly={isEditMode}
              error={errors.batchLotNumber}
              required
              maxLength={20}
            />

            {/* ── OLD MANUFACTURING DATE INPUT (COMMENTED OUT) ────────────────────── */}
            {/*
            <Input
              label="Manufacturing Date"
              type="month"
              name="manufacturingDate"
              id="manufacturingDate"
              readOnly={isEditMode}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                const [year, month] = value.split("-").map(Number);
                const date = new Date(year, month - 1, 1);
                const today = new Date();
                const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                if (date > currentMonth) {
                  setErrors({ ...errors, manufacturingDate: "Manufacturing date cannot be in the future month" });
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
            */}
            {/* ── NEW MANUFACTURING DATE WITH MONTHPICKER ─────────────────────────── */}
            <div className="relative">
              <Input
                label="Manufacturing Date"
                type="text"
                name="manufacturingDate"
                id="manufacturingDate"
                placeholder="MM/YYYY"
                value={
                  form.manufacturingDate instanceof Date &&
                    !isNaN(form.manufacturingDate.getTime())
                    ? `${String(form.manufacturingDate.getMonth() + 1).padStart(2, "0")}/${form.manufacturingDate.getFullYear()}`
                    : ""
                }
                readOnly={isEditMode}
                required
                onChange={() => { }}
                onClick={() => {
                  if (!isEditMode) {
                    setShowManufacturingMonthPicker(!showManufacturingMonthPicker);
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
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

            {/* ── OLD EXPIRY DATE INPUT (COMMENTED OUT) ──────────────────────────── */}
            {/*
            <Input
              label="Expiry Date"
              type="month"
              name="expiryDate"
              value={
                form.expiryDate instanceof Date && !isNaN(form.expiryDate.getTime())
                  ? `${form.expiryDate.getFullYear()}-${String(form.expiryDate.getMonth() + 1).padStart(2, "0")}`
                  : ""
              }
              readOnly={isEditMode}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                const [year, month] = value.split("-").map(Number);
                const date = new Date(year, month - 1, 1);
                setForm({ ...form, expiryDate: date });
                if (errors.expiryDate) setErrors((prev) => ({ ...prev, expiryDate: "" }));
              }}
              onFocus={() => {
                if (form.manufacturingDate) {
                  setErrors((prev) => ({ ...prev, expiryDate: "Expiry must be at least 3 months after Manufacturing Date" }));
                }
              }}
              min={getMinExpiryMonth()}
              error={errors.expiryDate}
              required
            />
            */}
            {/* ── NEW EXPIRY DATE WITH MONTHPICKER ────────────────────────────────── */}
            <div className="relative">
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
                onChange={() => { }}
                onClick={() => {
                  if (!isEditMode) {
                    setShowExpiryMonthPicker(!showExpiryMonthPicker);
                  }
                }}
                onFocus={() => {
                  if (!isEditMode) {
                    setShowExpiryMonthPicker(true);
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
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
                      new Date().getMonth() + 1,
                      1,
                    )
                  }
                  onSelect={(month, year) =>
                    handleMonthSelect("expiryDate", month, year)
                  }
                  onClose={() => setShowExpiryMonthPicker(false)}
                />
              )}
            </div>

            <Input
              type="number"
              label="Shelf Life (In Months)"
              name="shelfLifeMonths"
              id="shelfLifeMonths"
              value={form.shelfLifeMonths}
              readOnly
              error={errors.shelfLifeMonths}
              required
            />

            <Input
              type="number"
              label="Stock Quantity"
              name="stockQuantity"
              id="stockQuantity"
              placeholder=""
              value={form.stockQuantity}
              onChange={handleChange}
              readOnly={isEditMode}
              min={0}
              step={1}
              error={errors.stockQuantity}
              required
            />

            <Input
              label="Date of Entry"
              type="date"
              name="dateOfStockEntry"
              id="dateOfStockEntry"
              placeholder=""
              onChange={(e) =>
                setForm({ ...form, dateOfStockEntry: new Date(e.target.value) })
              }
              value={
                form.dateOfStockEntry
                  ? form.dateOfStockEntry.toISOString().split("T")[0]
                  : ""
              }
              disabled
              error={errors.dateOfStockEntry}
              required
            />

            <div className="font-open-sans text-[21px] leading-[24px] tracking-[-0.02em] font-normal align-middle col-span-2 mt-3">Pricing</div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              type="number"
              label="Discount(%)"
              name="discountPercentage"
              value={form.discountPercentage}
              onChange={handleChange}
              min={0}
              max={100}
              step={1}
              error={errors.discountPercentage}
              required={false}
            />

            <Input
              type="number"
              label="MRP (per Pack Size)"
              name="mrp"
              id="mrp"
              placeholder=""
              value={form.mrp}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "0" && form.mrp === "") {
                  e.preventDefault();
                }
              }}
              min={1}
              step={1}
              error={errors.mrp}
              required
            />

            <Input
              type="number"
              label="Selling Price (per Pack Size)"
              name="sellingPrice"
              id="sellingPrice"
              placeholder=""
              value={form.sellingPrice}
              onChange={handleChange}
              min={1}
              step={1}
              error={errors.sellingPrice}
              required
            />

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowAdditionalDiscount(true)}
                className="w-[237px] h-[52px] bg-transparent border-[2.5px] border-[#7D32FC] text-[#9659FD] font-heading font-medium text-[18px] leading-[28px] rounded-lg flex items-center justify-center gap-[12px] cursor-pointer hover:bg-purple-50 transition-all duration-200"
              >
                <svg
                  width="14.24"
                  height="14.24"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                >
                  <path
                    d="M7 1v12M1 7h12"
                    stroke="#9659FD"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Add Special Discount</span>
              </button>
            </div>

            <div className="text-h6 font-normal col-span-2 mt-3">
              TAX & BILLING
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              type="number"
              label="HSN Code"
              name="hsnCode"
              id="hsnCode"
              placeholder=""
              value={form.hsnCode}
              onChange={handleChange}
              min={1}
              step={1}
              maxLength={8}
              readOnly={isEditMode}
              error={errors.hsnCode}
              required
            />

            <div className="flex flex-col gap-0">
              <label className="text-label-l4 text-neutral-700 font-medium">
                GST %
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              {/*
              <Select
                options={gstOptions}
                value={
                  gstOptions.find((o) => o.value === form.gstPercentage) ||
                  (form.gstPercentage
                    ? {
                      value: form.gstPercentage,
                      label: `${form.gstPercentage}%`,
                    }
                    : null)
                }
                onChange={(selected: any) =>
                  setForm((prev) => ({
                    ...prev,
                    gstPercentage: selected?.value || "",
                  }))
                }
                placeholder="Select GST %"
                isDisabled={isEditMode}
                theme={selectTheme}
                styles={selectStyles("gstPercentage")}
              />

              {errors.gstPercentage && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.gstPercentage}
                </p>
              )}
              */}
              <Dropdown
                options={gstOptions}
                value={form.gstPercentage}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    gstPercentage: val,
                  }))
                }
                placeholder="Select GST %"
                isDisabled={isEditMode}
                error={errors.gstPercentage ? " " : ""}
              />
              {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              className="w-[108px] h-[48px] bg-[#7D32FC] rounded-[4px] text-white font-[family:var(--font-heading)] font-medium text-lg leading-normal flex items-center justify-center"
            >
              Save
            </button>
          </div>
        </div>

        {/* -- Section 2: Product Photos (Old) -------------------------------------------- */}
        {/*
{/* ── Section 2: Product Photos ──────────────────────────────────────────── * /}
        <div
          className="relative border border-neutral-200 rounded-xl p-6 bg-white"
          ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>}
          data-field="images"
        >
          <div className="text-pneutral-700 font-normal text-sm">
            Product Photos{" "}
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </div>

          <div
            className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer"
            onClick={() => {
              if (!isEditMode || mode === "edit") {
                document.getElementById("supFileInput")?.click();
              }
            }}
          >
            <input
              id="supFileInput"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  const totalFiles = images.length + existingImages.length + newFiles.length;
                  if (totalFiles > 5) {
                    setErrors((prev) => ({ ...prev, images: "Maximum 5 images are allowed" }));
                    const remainingSlots = 5 - (images.length + existingImages.length);
                    const allowedFiles = newFiles.slice(0, remainingSlots);
                    if (allowedFiles.length > 0) setImages((prev) => [...prev, ...allowedFiles]);
                    return;
                  }
                  setErrors((prev) => ({ ...prev, images: "" }));
                  setImages((prev) => [...prev, ...newFiles]);
                }
              }}
            />

            <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
              <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 rounded-md object-cover" />
                  <div className="text-label-l2 font-normal mt-4">Choose a file or drag &amp; drop it here</div>
                  <div className="text-label-l1 font-normal text-neutral-400">or click to browse JPEG, PNG, and SVG</div>
                </div>
              </div>
            </div>
          </div>

          {errors.images && (
            <div className="text-red-500 text-sm mt-2">{errors.images}</div>
          )}

          <div className="flex gap-4">
            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={img}
                      alt="product"
                      className="w-full h-full object-cover rounded-md border border-pneutral-200"
                    />
                    <button
                      onClick={() => setExistingImages(existingImages.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 text-pneutral-900 cursor-pointer text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {images.map((file, index) => (
                  <div key={index} className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover rounded-md border border-pneutral-200"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 text-pneutral-900 cursor-pointer text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        */}

        <ProductImageUpload
          title="Product Photos"
          required
          images={images}
          setImages={setImages}
          existingImages={existingImages}
          setExistingImages={setExistingImages}
          error={errors.images}
          setErrors={setErrors}
          isReadOnly={false}
          mode={mode}
        />

        <div className="flex justify-between mt-6 col-span-2 mb-6">
          <div className="space-x-6 flex">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-35.25 h-12 border-2 border-warning-500 rounded-lg text-label-l4 font-medium text-warning-500 cursor-pointer"
            >
              Cancel
            </button>

            <button className="w-35.25 h-12 bg-secondary-700 text-pneutral-50 text-label-l4 font-medium rounded-lg flex items-center justify-center gap-2.5">
              <img
                src="/icons/SaveDraftIcon.svg"
                alt="drug"
                className="w-5 h-5 rounded-md object-cover"
              />
              Save Draft
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary-800 text-pneutral-50 text-label-l4 font-medium rounded-lg p-3 w-35.25 h-12 cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default SupplementForm;


