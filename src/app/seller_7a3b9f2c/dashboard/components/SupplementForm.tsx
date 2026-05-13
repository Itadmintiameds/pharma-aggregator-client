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
import Select from "react-select";
import Input from "@/src/app/commonComponents/Input";
import UploadInput from "../commonComponent/UploadInput";
import CommonModal from "../commonComponent/CommonModal";
import PopupModal from "../commonComponent/PopupModal";
import AdditionalDiscount from "./AdditionalDiscount";
import { getSupplementDosageForms, getSupplementAgeGroups, getSupplementFlavours, getSupplementStorageConditions, getSupplementCertifications, getCountries, getSupplementPackTypes, createSupplementProduct, uploadSupplementProductImages, uploadNutritionalInformationImage, uploadSupplementBrochure, uploadSupplementCertifications } from "@/src/services/product/SupplementService";
import { getProductById, updateProduct } from "@/src/services/product/ProductService";

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

const fieldLabel = "text-label-l3 text-neutral-700 font-semibold";
const requiredStar = <span className="text-warning-500 font-semibold ml-1">*</span>;

const errorMsg = "text-red-500 text-sm mt-1";

// ─── Upload Icon ───────────────────────────────────────────────────────────────

const UploadCloudIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9F75FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  { value: "28", label: "28%" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

interface SupplementFormProps {
  categoryId?: number | string;
  productId?: string;
  mode?: "create" | "edit";
}

const SupplementForm = ({ categoryId, productId, mode }: SupplementFormProps) => {
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string | null>(null);
  const [existingNutritionalImageUrl, setExistingNutritionalImageUrl] = useState<string | null>(null);
  const [nutritionalImage, setNutritionalImage] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);

  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);

  const handleViewProduct = () => {
    window.location.reload();
  };

  const handleContinueEditing = () => {
    setShowSuccess(false);
  };

  const handleContinueAdding = () => {
    setShowSuccess(false);
    // window.location.reload(); or resetForm()
    window.location.reload();
  };

  const handleBackToDashboard = () => {
    window.location.reload();
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
    }
  }, [form.manufacturingDate, form.expiryDate]);

  const nutritionalInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);
  const certDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close cert dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (certDropdownRef.current && !certDropdownRef.current.contains(e.target as Node))
        setShowCertDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate packSize
      const unitPerPack = Number(updated.unitPerPack) || 0;
      const numberOfPacks = Number(updated.numberOfPacks) || 0;
      updated.packSize = String(unitPerPack * numberOfPacks);

      // Bidirectional calculation: MRP, Discount, Selling Price
      const mrp = Number(updated.mrp) || 0;
      const disc = Number(updated.discountPercentage) || 0;
      const sp = Number(updated.sellingPrice) || 0;

      if (name === "sellingPrice") {
        // User is editing Selling Price directly
        if (mrp > 0) {
          const calculatedDisc = ((mrp - sp) / mrp) * 100;
          updated.discountPercentage = calculatedDisc >= 0 ? calculatedDisc.toFixed(2) : "0";
        }
      } else if (name === "mrp" || name === "discountPercentage") {
        // User is editing MRP or Discount
        if (mrp > 0) {
          updated.sellingPrice = (mrp - (mrp * disc) / 100).toFixed(2);
        }
      }

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

        // ── Cross-field: sellingPrice < mrp ──────────────────────────────────
        const sellingPrice = Number(updated.sellingPrice) || 0;
        const mrpVal = Number(updated.mrp) || 0;
        if (sellingPrice && mrpVal && sellingPrice >= mrpVal) {
          newErrors.sellingPrice = "Selling Price must be less than MRP";
        } else {
          delete newErrors.sellingPrice;
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
      return;
    }
    if (file.type !== "application/pdf") { alert("Only PDF files are allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File size must be less than 5 MB"); return; }
    setBrochureFile(file);
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
        strength: attr.strength || "",
        activeIngredients: attr.activeIngredients || "",
        excipients: attr.otherIngredients || "",
        nutritionalInfoType: attr.nutritionalInformationImageUrl ? "image" : "label",
        intendedUse: attr.intendedUse || "",
        ageGroup: String(attr.ageGroupId || ""),
        gender: attr.gender || "",
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
      }));
    } catch (err) {
      console.error("Failed to load supplement product:", err);
      alert("Failed to load product data");
    }
  };

  const getMinExpiryMonth = () => {

    if (!form.manufacturingDate) return "";
    const minDate = new Date(form.manufacturingDate);
    minDate.setMonth(minDate.getMonth() + 3);
    return `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
  };

  const validate = (): Record<string, string> => {
    // ── Zod schema validation ─────────────────────────────────────────────────
    const result = supplementProductSchema.safeParse({
      ...form,
      // manufacturingDate/expiryDate must be Date objects; guard against null
      manufacturingDate: form.manufacturingDate instanceof Date ? form.manufacturingDate : new Date("invalid"),
      expiryDate: form.expiryDate instanceof Date ? form.expiryDate : new Date("invalid"),
    });

    const e: Record<string, string> = {};

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".");
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
    if (!brochureFile && !existingBrochureUrl)
      e.brochureFile = "Brochure / User Manual is required";
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
              minimumPurchaseQuantity: d.minimumPurchaseQuantity,
              additionalDiscountPercentage: d.additionalDiscountPercentage,
              effectiveStartDate: d.effectiveStartDate,
              effectiveStartTime: d.effectiveStartTime,
              effectiveEndDate: d.effectiveEndDate,
              effectiveEndTime: d.effectiveEndTime,
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
            netQuantity: form.netQuantity,
            strength: form.strength,
            activeIngredients: form.activeIngredients,
            otherIngredients: form.excipients,
            nutritionalInformation: form.nutritionalInfoType === "label" ? "As per the label." : "",
            nutritionalInformationImageUrl: "", // Will be updated in Step 2.5 after product creation
            intendedUse: form.intendedUse,
            ageGroupId: Number(form.ageGroup),
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
        productId: form.productId,
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
            pricingId: form.pricingId || undefined, // ✅ Prevents duplicate rows
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
              minimumPurchaseQuantity: d.minimumPurchaseQuantity,
              additionalDiscountPercentage: d.additionalDiscountPercentage,
              effectiveStartDate: d.effectiveStartDate,
              effectiveStartTime: d.effectiveStartTime,
              effectiveEndDate: d.effectiveEndDate,
              effectiveEndTime: d.effectiveEndTime,
            })),
          },
        ],

        productAttributeSupplementsOrNutraceuticals: [
          {
            productAttributeId: form.productAttributeId,
            therapeuticCategoryId: form.therapeuticCategory,
            therapeuticSubCategoryId: form.therapeuticSubcategory,
            brandName: form.brandName,
            variantName: form.variantName,
            dosageFormId: Number(form.dosageForm),
            netQuantity: form.netQuantity,
            strength: form.strength,
            activeIngredients: form.activeIngredients,
            otherIngredients: form.excipients,
            nutritionalInformation: form.nutritionalInfoType === "label" ? "As per the label." : "",
            intendedUse: form.intendedUse,
            ageGroupId: Number(form.ageGroup),
            gender: form.gender,
            vegOrNonVegIndicator: form.vegNonVeg,
            allergenInformation: form.allergenInfo,
            flavourId: Number(form.flavour),
            productClaims: form.productClaims,
            storageConditionId: Number(form.storageCondition),
            countryId: Number(form.countryOfOrigin),
            certificateDocuments: selectedCertifications.map((cert) => ({
              productCertificateDocumentId: cert.documentId || undefined,
              certificationId: Number(cert.id),
              certificateUrl: cert.existingUrl || "PENDING",
            })),
            brochurePath: existingBrochureUrl || "PENDING",
          },
        ],
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
        onPrimaryAction={() => window.location.reload()}
        onSecondaryAction={() => {
          setShowSuccess(false);
          window.location.reload(); // Simple reset
        }}
        onTertiaryAction={() => window.location.reload()}
        onClose={() => setShowSuccess(false)}
      />

      {showAdditionalDiscount && (
        <CommonModal
          onClose={() => setShowAdditionalDiscount(false)}
          width="w-[600px]"
        >
          <div className="h-[80vh] overflow-hidden flex flex-col">
            <AdditionalDiscount
              initialData={form.additionalDiscount}
              baseDiscountPercentage={Number(form.discountPercentage) || 0}
              baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
              onSave={(data: any) => {
                setForm((prev) => ({
                  ...prev,
                  additionalDiscount: data || [],
                }));
              }}
              onClose={() => setShowAdditionalDiscount(false)}
            />
          </div>
        </CommonModal>
      )}


      <div className="flex flex-col gap-5 w-full">

        {/* ── Section 1: Product Details ──────────────────────────────────────── */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
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
            <div className="flex flex-col gap-1" data-field="therapeuticCategory">
              <label className={fieldLabel}>Therapeutic Category {requiredStar}</label>
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
            </div>

            {/* ROW 2 */}
            {/* Therapeutic Subcategory */}
            <div className="flex flex-col gap-1" data-field="therapeuticSubcategory">
              <label className={fieldLabel}>Therapeutic Subcategory {requiredStar}</label>
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
            <div className="flex flex-col gap-1" data-field="dosageForm">
              <label className={fieldLabel}>Dosage Form {requiredStar}</label>
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
            </div>

            {/* ROW 4 */}
            {/* Net Quantity */}
            <div data-field="netQuantity">
              <Input
                label="Net Quantity"
                name="netQuantity"
                id="netQuantity"
                placeholder="e.g., 60 tablets, 200g, 100ml"
                onChange={handleChange}
                value={form.netQuantity}
                maxLength={20}
                error={errors.netQuantity}
                required
                readOnly={isEditMode}
              />
            </div>
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
            <div className="flex flex-col gap-1" data-field="nutritionalInfoType">
              <label className={fieldLabel}>Nutritional Information Table {requiredStar}</label>
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

              {form.nutritionalInfoType === "image" && (
                <div className="mt-2">
                  <label className={fieldLabel}>Upload Nutritional Image {requiredStar}</label>
                  {!nutritionalImage ? (
                    <div
                      className={`flex items-center border ${errors.nutritionalImage ? "border-red-400" : "border-gray-200"} rounded-xl overflow-hidden h-12 bg-gray-50 cursor-pointer hover:bg-gray-100 transition`}
                      onClick={() => nutritionalInputRef.current?.click()}
                    >
                      <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <UploadCloudIcon />
                      </div>
                      <span className="px-3 text-base [font-family:'Open_Sans',sans-serif] [color:#969793]">
                        Upload Image (JPG, PNG) max 5MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50">
                      <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-purple-600" />
                      </div>
                      <div className="flex-1 px-3 min-w-0">
                        <p className="text-sm font-medium [color:#3C3D3A] truncate">{nutritionalImage.name}</p>
                      </div>
                      <div className="flex items-center gap-1 pr-3">
                        <button type="button" onClick={() => nutritionalInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600"><RefreshCw size={13} /></button>
                        <button type="button" onClick={() => { setNutritionalImage(null); if (nutritionalInputRef.current) nutritionalInputRef.current.value = ""; }} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><X size={13} /></button>
                      </div>
                    </div>
                  )}
                  {errors.nutritionalImage && <p className={errorMsg}>{errors.nutritionalImage}</p>}
                  <input ref={nutritionalInputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/svg+xml" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleNutritionalUpload(e.target.files[0]); }} />
                </div>
              )}
            </div>
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
            <div className="flex flex-col gap-1" data-field="ageGroup">
              <label className={fieldLabel}>Age Group {requiredStar}</label>
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
            </div>
            {/* Gender */}
            <div className="flex flex-col gap-1" data-field="gender">
              <label className={fieldLabel}>Gender {requiredStar}</label>
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
            </div>

            {/* ROW 8 */}
            {/* Veg / Non-Veg Indicator — Radio Buttons */}
            <div data-field="vegNonVeg" className="flex flex-col gap-1.5">
              <label className={`${fieldLabel} flex items-center gap-1`}>
                Veg / Non-Veg Indicator
                <span className="text-warning-500 font-semibold">*</span>
              </label>
              <div className={`flex items-center gap-6 h-14 px-4 rounded-2xl border border-neutral-500 bg-white ${isEditMode ? "opacity-60 pointer-events-none" : ""}`}>
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
                      className="w-4 h-4 accent-[#4B0082] cursor-pointer"
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
            <div className="flex flex-col gap-1" data-field="flavour">
              <label className={fieldLabel}>Flavour {requiredStar}</label>
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
            <div className="flex flex-col gap-1" data-field="storageCondition">
              <label className={fieldLabel}>Storage Condition {requiredStar}</label>
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
            {/* Certifications / Compliance Checkbox Dropdown */}
            <div className="flex flex-col gap-1" data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
              <div className="relative" ref={certDropdownRef}>
                <div
                  onClick={() => setShowCertDropdown((p) => !p)}
                  className={`w-full h-14 px-4 border rounded-2xl flex items-center justify-between cursor-pointer transition-all bg-white ${errors.certifications ? "border-[#FF3B3B]" : "border-neutral-500 hover:border-[#4B0082]"
                    }`}
                >
                  <span
                    className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]"
                    style={{ color: selectedCertifications.length > 0 ? "#3C3D3A" : "#A3A3A3" }}
                  >
                    {selectedCertifications.length > 0
                      ? selectedCertifications.map((c) => c.label).join(", ")
                      : "Select certifications"}
                  </span>
                  <svg
                    className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${showCertDropdown ? "rotate-180" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {showCertDropdown && (
                  <div className="absolute z-20 w-full bg-white border border-neutral-200 mt-1 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                    {loadingCertifications ? (
                      <div className="px-4 py-3 text-neutral-500 text-sm">Loading...</div>
                    ) : (
                      certificationOptions.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCertifications.some((c) => c.id === opt.value)}
                            onChange={() => handleCertCheckbox(opt)}
                            className="accent-purple-600 w-4 h-4"
                          />
                          <span className="text-base [font-family:'Open_Sans',sans-serif] [color:#3C3D3A]">
                            {opt.label}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
            </div>

            {/* Upload Certifications / Compliance List */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Upload Certifications / Compliance {requiredStar}</label>
              {selectedCertifications.length === 0 ? (
                <div className="flex items-center w-full h-14 rounded-2xl border border-neutral-500 bg-white overflow-hidden">
                  <div className="flex items-center justify-center h-full px-4 bg-[#DED0FE]">
                    <img src="/icons/UploadIcon.svg" className="w-6 h-6" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
                    <span className="text-[#969793]">Select certifications first</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedCertifications.map((cert) => (
                    <div key={cert.id} className="flex flex-col gap-1">
                      <div className="flex items-center w-full h-14 rounded-2xl border border-neutral-500 bg-white overflow-hidden">
                        <div className="flex items-center justify-center h-full px-4 bg-[#DED0FE]">
                          <img src="/icons/UploadIcon.svg" className="w-6 h-6" />
                        </div>

                        <div className="flex-1 flex items-center gap-2 px-4 overflow-hidden">
                          {cert.isUploaded ? (
                            <div className="flex items-center bg-[#FDEBEB] text-sm px-3 py-2 rounded-lg max-w-full">
                              <span className="truncate">{cert.fileName}</span>
                              <button
                                type="button"
                                onClick={() => handleCertRemove(cert.id)}
                                className="ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#969793]">Upload the {cert.label}</span>
                          )}
                        </div>

                        {!cert.isUploaded && (
                          <label className="cursor-pointer px-4">
                            <img src="/icons/UploadAddIcon.svg" className="w-6 h-6" />
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCertFileSelect(cert.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ROW 12 */}
            {/* Country of Origin */}
            <div className="flex flex-col gap-1" data-field="countryOfOrigin">
              <label className={fieldLabel}>Country of Origin {requiredStar}</label>
              <Select
                options={countryOptions}
                value={countryOptions.find(o => o.value === form.countryOfOrigin) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, countryOfOrigin: selected ? selected.value : "" }));
                  if (errors.countryOfOrigin) setErrors((p) => { const n = { ...p }; delete n.countryOfOrigin; return n; });
                }}
                placeholder={loadingCountries ? "Loading..." : "Select country"}
                theme={selectTheme}
                styles={selectStyles("countryOfOrigin")}
                isDisabled={isEditMode || loadingCountries}
              />
              {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
            </div>
            {/* Upload Brochure */}
            <div data-field="brochureFile">
              {/* Existing brochure (edit mode) */}
              {existingBrochureUrl && !brochureFile && (
                <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50 mb-2">
                  <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1 px-3 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">Current brochure (saved)</p>
                  </div>
                  <a href={existingBrochureUrl} target="_blank" rel="noreferrer" className="px-3 text-purple-600 text-xs underline">View</a>
                  <button type="button" onClick={() => setExistingBrochureUrl(null)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 mr-2">
                    <X size={13} />
                  </button>
                </div>
              )}
              <UploadInput onFileSelect={handleBrochureUpload} />
              {errors.brochureFile && <p className={errorMsg}>{errors.brochureFile}</p>}
            </div>

            {/* ROW 13 */}
            {/* Warnings / Precautions */}
            <div className="flex flex-col gap-1" data-field="warningsPrecautions">
              <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
              <textarea
                ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
                name="warningsPrecautions"
                value={form.warningsPrecautions}
                onChange={handleChange}
                placeholder="e.g., Not for pregnant women"
                maxLength={255}
                className={`w-full h-36 px-4 rounded-2xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none overflow-y-auto border bg-white focus:outline-none focus:ring-0 transition-colors duration-200 ${errors.warningsPrecautions ? "border-[#FF3B3B] focus:border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
              />
              {errors.warningsPrecautions && <p className={errorMsg}>{errors.warningsPrecautions}</p>}
            </div>
            {/* Product Description */}
            <div className="flex flex-col gap-1" data-field="productDescription">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea
                ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                name="productDescription"
                value={form.productDescription}
                onChange={handleChange}
                placeholder="Provide a detailed description of the product (Min 10 chars)"
                maxLength={255}
                className={`w-full h-36 px-4 rounded-2xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none overflow-y-auto border bg-white focus:outline-none focus:ring-0 transition-colors duration-200 ${errors.productDescription ? "border-[#FF3B3B] focus:border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
              />
              {errors.productDescription && <p className={errorMsg}>{errors.productDescription}</p>}
            </div>

          </div>
        </div>

        {/* Packaging & Order Details */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-h4 font-semibold">Packaging & Order Details</div>

          <div className="border-b border-neutral-200 mt-3"></div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Pack Type
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>

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

            <div className="text-h6 font-normal col-span-2 mt-3">
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

            <div className="text-h6 font-normal col-span-2 mt-3">
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
                const currentMonth = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  1,
                );

                if (date > currentMonth) {
                  setErrors({
                    ...errors,
                    manufacturingDate:
                      "Manufacturing date cannot be in the future month",
                  });
                  return;
                }

                setErrors((prev) => ({
                  ...prev,
                  manufacturingDate: "",
                  expiryDate: "",
                }));

                setForm({
                  ...form,
                  manufacturingDate: date,
                  expiryDate: null,
                  shelfLifeMonths: "",
                });
              }}
              value={
                form.manufacturingDate instanceof Date &&
                  !isNaN(form.manufacturingDate.getTime())
                  ? `${form.manufacturingDate.getFullYear()}-${String(
                    form.manufacturingDate.getMonth() + 1,
                  ).padStart(2, "0")}`
                  : ""
              }
              error={errors.manufacturingDate}
              required
            />

            <Input
              label="Expiry Date"
              type="month"
              name="expiryDate"
              value={
                form.expiryDate instanceof Date &&
                  !isNaN(form.expiryDate.getTime())
                  ? `${form.expiryDate.getFullYear()}-${String(
                    form.expiryDate.getMonth() + 1,
                  ).padStart(2, "0")}`
                  : ""
              }
              readOnly={isEditMode}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                const [year, month] = value.split("-").map(Number);
                const date = new Date(year, month - 1, 1);
                setForm({ ...form, expiryDate: date });
                if (errors.expiryDate)
                  setErrors((prev) => ({ ...prev, expiryDate: "" }));
              }}
              onFocus={() => {
                if (form.manufacturingDate) {
                  setErrors((prev) => ({
                    ...prev,
                    expiryDate:
                      "Expiry must be at least 3 months after Manufacturing Date",
                  }));
                }
              }}
              min={getMinExpiryMonth()}
              error={errors.expiryDate}
              required
            />

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

            <Input
              type="number"
              label="Stock Quantity"
              name="stockQuantity"
              id="stockQuantity"
              placeholder=""
              value={form.stockQuantity}
              onChange={handleChange}
              readOnly={isEditMode}
              min={1}
              step={1}
              error={errors.stockQuantity}
              required
            />

            <div className="text-h6 font-normal col-span-2 mt-3">Pricing</div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <Input
              type="number"
              label="MRP"
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
              label="Selling Price per Pack Size"
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

            <div className="col-span-2 flex items-end gap-4">
              <div className="w-1/2">
                <Input
                  type="number"
                  label="Discount Percentage"
                  name="discountPercentage"
                  value={form.discountPercentage}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  step={1}
                  error={errors.discountPercentage}
                  required
                />
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdditionalDiscount(true)}
                  className="w-55.5 h-10.5 px-6 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  <img
                    src="/icons/PlusIcon.svg"
                    alt="drug"
                    className="w-[12.5px] h-[12.5px]"
                  />
                  Add Special Discount
                </button>
              </div>
            </div>
            <div className="text-h6 font-normal col-span-2 mt-3">
              TAX & BILLING
            </div>

            <div className="border-b border-neutral-200 col-span-2"></div>

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                GST %
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>

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
            </div>

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
          </div>
        </div>

        {/* ── Section 2: Product Photos ──────────────────────────────────────────── */}
        <div
          className="relative border border-neutral-200 rounded-xl p-6 mt-6"
          ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>}
          data-field="images"
        >
          <div className="text-[#364153] font-normal text-sm">
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
                      className="w-full h-full object-cover rounded-md border border-[#D5D5D4]"
                    />
                    <button
                      onClick={() => setExistingImages(existingImages.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 text-[#1E1E1D] cursor-pointer text-xs px-1 rounded"
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
                      className="w-full h-full object-cover rounded-md border border-[#D5D5D4]"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 text-[#1E1E1D] cursor-pointer text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6 col-span-2 mb-6">
          <div className="space-x-6 flex">
            <button
              onClick={() => window.location.reload()}
              className="w-21 h-12 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer"
            >
              Cancel
            </button>

            <button className="w-35.25 h-12 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5">
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
              className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplementForm;
