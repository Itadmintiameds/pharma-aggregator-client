"use client";

import React, { useEffect, useState } from "react";
import Input from "@/src/app/commonComponents/Input";
import UploadInput from "../commonComponent/UploadInput";
import PopupModal from "../commonComponent/PopupModal";
import { foodInfantSchema } from "@/src/schema/product/FoodandInfantSchema";
import Image from "next/image";
import AdditionalDiscount from "./AdditionalDiscount";
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
  getStorageConditions,
  getPackTypesByCategory,
  getCertificationsByCategoryId,
  uploadFoodInfantUserManual,
  createFoodInfantProduct,
  getFoodInfantAttributes,
  uploadFoodInfantBrochure,
  uploadNutritionalInformationImage
} from "@/src/services/product/FoodInfantService";

import AdditionalDiscountType from "./AdditionalDiscountType";
import CommonModal from "../commonComponent/CommonModal";

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

const FoodInfantForm: React.FC<FoodInfantFormProps> = ({ mode = "create", productId }) => {
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
    netQuantity: "",
    servingSize: "",
    ageGroup: "",
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
  const [resolvedProductId, setResolvedProductId] = useState<string>("");
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  
  // Certifications state
  const [selectedCertificationValues, setSelectedCertificationValues] = useState<string[]>([]);
  const [certificationsDetails, setCertificationsDetails] = useState<CertificationTag[]>([]);

  // Additional discounts
  const [additionalDiscounts, setAdditionalDiscounts] = useState<AdditionalDiscountData[]>([]);
  const [specialSchemes, setSpecialSchemes] = useState<SpecialSchemesData[]>([]);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingManualFile, setExistingManualFile] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [productAttributeId, setProductAttributeId] = useState<string | null>(null);
  const [existingNutritionalImageUrl, setExistingNutritionalImageUrl] = useState<string | null>(null);

  const isEditMode = mode === "edit";

  // Stock-based edit restrictions
  const currentStockQuantity = Number(form.stockQuantity) || 0;
  const isStockZero = currentStockQuantity === 0;
  const canEditStockDependent = !isEditMode || (isEditMode && isStockZero);

  // Helper to determine if a field should be disabled in edit mode
  const isFieldDisabled = (isEditable: boolean, isStockDependent: boolean = false): boolean => {
    if (!isEditMode) return false;
    if (!isEditable) return true;
    if (isStockDependent && !canEditStockDependent) return true;
    return false;
  };

  // Helper: format a Date or ISO string to YYYY-MM
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

  // Date validation functions
  const validateManufacturingDate = (date: Date | null): string | null => {
    if (!date) return null;
    const today = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(today.getFullYear() - 3);
    
    if (date > today) {
      return "Manufacturing date cannot be in the future";
    }
    if (date < threeYearsAgo) {
      return "Manufacturing date cannot be more than 3 years old";
    }
    return null;
  };

  const validateExpiryDate = (expiryDate: Date | null, manufacturingDate: Date | null): string | null => {
    if (!expiryDate) return null;
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    
    if (manufacturingDate && expiryDate < manufacturingDate) {
      return "Expiry date cannot be less than manufacturing date";
    }
    if (expiryDate < threeMonthsFromNow) {
      return "Expiry date must be at least 3 months from today";
    }
    return null;
  };

  const validateCrossFields = () => {
    const newErrors: Record<string, string> = {};
    const minQty = Number(form.minimumOrderQuantity) || 0;
    const maxQty = Number(form.maximumOrderQuantity) || 0;
    if (maxQty && minQty && maxQty < minQty) {
      newErrors.maximumOrderQuantity = "Max Order Qty must be greater than Min Order Qty";
    }
    const mrp = Number(form.mrp) || 0;
    const selling = Number(form.sellingPricePerPack) || 0;
    if (selling && mrp && selling >= mrp) {
      newErrors.sellingPricePerPack = "Selling Price must be less than MRP";
    }
    const discount = Number(form.discountPercentage);
    if (form.discountPercentage !== "" && (isNaN(discount) || discount < 0 || discount > 100)) {
      newErrors.discountPercentage = "Discount must be between 0 and 100";
    }
    const hsn = form.hsnCode;
    if (hsn) {
      const isValidLength = [4, 6, 8].includes(hsn.length);
      const isNumeric = /^\d+$/.test(hsn);
      if (!isNumeric || !isValidLength) {
        newErrors.hsnCode = "HSN Code must be 4, 6, or 8 digits only";
      }
    }
    
    // Date validations
    const mfgError = validateManufacturingDate(form.manufacturingDate);
    if (mfgError) newErrors.manufacturingDate = mfgError;
    
    const expiryError = validateExpiryDate(form.expiryDate, form.manufacturingDate);
    if (expiryError) newErrors.expiryDate = expiryError;
    
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Handle date fields (convert string "YYYY-MM" to Date object)
    if (name === "manufacturingDate" || name === "expiryDate") {
      let dateValue: Date | null = null;
      if (value) {
        const [year, month] = value.split("-").map(Number);
        dateValue = new Date(year, month - 1, 1);
        if (isNaN(dateValue.getTime())) dateValue = null;
      }

      setForm((prev) => {
        const updated = { ...prev, [name]: dateValue };
        if (name === "manufacturingDate") {
          updated.expiryDate = null;
          updated.shelfLifeMonths = "";
        }
        if (name === "expiryDate" && updated.manufacturingDate instanceof Date && dateValue instanceof Date) {
          updated.shelfLifeMonths = calculateShelfLife();
        }
        return updated;
      });
      setTimeout(validateCrossFields, 0);
      return;
    }

    // For all other fields
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "unitsPerPack" || name === "numberOfPacks") {
        updated.packSize = String(calculatePackSize());
      }
      return updated;
    });
    setTimeout(validateCrossFields, 0);
  };

  const handleDropdownChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTimeout(validateCrossFields, 0);
  };

  const handleCategoryChange = async (value: string, label: string) => {
    setForm((prev) => ({
      ...prev,
      productCategory: value,
      productCategoryName: label,
      productSubcategory: "",
    }));
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
    }
  };

  const handleCertificationSelectionChange = (selectedValues: string[]) => {
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
  };

  const handleTagClick = (certId: string) => {
    document.getElementById(`cert-upload-${certId}`)?.click();
  };

  const handleRemoveTag = (certId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCertificationValues((prev) => prev.filter((id) => id !== certId));
    setCertificationsDetails((prev) => prev.filter((cert) => cert.id !== certId));
  };

  const handleCertificationFileUpload = (certId: string, file: File) => {
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
    }, 1000);
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
  if (errors.manualFile) {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.manualFile;
      return newErrors;
    });
  }
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
    if (errors.nutritionalInfoImage) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.nutritionalInfoImage;
        return newErrors;
      });
    }
  };

  const handleRemoveNutritionalImage = () => {
    setForm((prev) => ({ ...prev, nutritionalInfoImage: null }));
    setExistingNutritionalImageUrl(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const total = existingImages.length + images.length + newFiles.length;
    if (total > 5) {
      setErrors((prev) => ({ ...prev, images: "Maximum 5 images allowed" }));
      const allowed = 5 - (existingImages.length + images.length);
      if (allowed > 0) setImages((prev) => [...prev, ...newFiles.slice(0, allowed)]);
      return;
    }
    setErrors((prev) => ({ ...prev, images: "" }));
    setImages((prev) => [...prev, ...newFiles]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Get min expiry date (manufacturing date + 1 month)
  const getMinExpiryMonth = () => {
    if (!form.manufacturingDate) return "";
    const minDate = new Date(form.manufacturingDate);
    minDate.setMonth(minDate.getMonth() + 1);
    return `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
  };

  // Get max manufacturing date (today)
  const getMaxManufacturingMonth = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  };

  // Get min expiry date from today (3 months)
  const getMinExpiryFromToday = () => {
    const today = new Date();
    const minDate = new Date();
    minDate.setMonth(today.getMonth() + 3);
    return `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
  };

  // ---------- Fetch master data ----------
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const catData = await getProductCategories(3);
        setCategories(
          catData.map((c: any) => ({ value: String(c.productCategoryId), label: c.productCategory }))
        );

        const ageData = await getAgeGroups();
        setAgeGroups(
          ageData.map((a: any) => ({ value: String(a.ageGroupId), label: a.ageGroup }))
        );

        const formData = await getProductForms();
        setProductForms(
          formData.map((f: any) => ({ value: String(f.productFormId), label: f.productForm }))
        );

        const countryData = await getCountries();
        if (Array.isArray(countryData)) {
          setCountries(
            countryData.map((c: any) => ({
              value: String(c.countryId ?? c.id),
              label: c.countryName ?? c.name,
            }))
          );
        } else {
          setCountries([]);
        }

        const storageData = await getStorageConditions();
        setStorageConditions(
          (storageData || []).map((s: any) => ({
            value: String(s.storageConditionId ?? s.id),
            label: s.conditionName ?? s.condition ?? s.name,
          }))
        );

        const packData = await getPackTypesByCategory(3);
        if (Array.isArray(packData)) {
          setPackTypes(
            packData.map((p: any) => ({
              value: String(p.packId ?? p.id),
              label: p.packType ?? p.type ?? p.name,
            }))
          );
        } else {
          setPackTypes([]);
        }

        const certData = await getCertificationsByCategoryId(3);
        setCertificationsMaster(
          (certData || []).map((c: any) => ({
            value: String(c.id ?? c.certificationId),
            label: c.name ?? c.certificationName,
            tagCode: c.code ?? (c.name?.slice(0, 4).toUpperCase() ?? "CERT"),
          }))
        );
      } catch (err) {
        console.error("Master data fetch failed", err);
      }
    };
    fetchMasterData();
  }, []);

  // ---------- Edit mode ----------
  useEffect(() => {
    if (isEditMode && productId) {
      const fetchProduct = async () => {
        try {
          const prod = await getProductById(productId);
          console.log("🔍 Full product for edit:", JSON.stringify(prod, null, 2));
          
          let attr = {};
          
          if (prod.productAttributeFoodInfants && Array.isArray(prod.productAttributeFoodInfants) && prod.productAttributeFoodInfants.length > 0) {
            attr = prod.productAttributeFoodInfants[0];
            console.log("✅ Found productAttributeFoodInfants in main response:", attr);
          } else if (prod.productAttributeFoodInfant) {
            attr = prod.productAttributeFoodInfant;
            console.log("✅ Found productAttributeFoodInfant in main response:", attr);
          } else {
            console.log("⚠️ No attributes in main response, fetching separately...");
            try {
              const foodInfantAttr = await getFoodInfantAttributes(productId);
              if (foodInfantAttr) {
                attr = foodInfantAttr;
                console.log("✅ Fetched attributes separately:", attr);
              }
            } catch (err) {
              console.error("Failed to fetch attributes separately:", err);
            }
          }
          
          const pricing = prod.pricingDetails?.[0] || {};
          const packaging = prod.packagingDetails?.[0] || {};

          // Set existing nutritional image URL if present
          if ((attr as any).nutritionalInformationImageUrl) {
            setExistingNutritionalImageUrl((attr as any).nutritionalInformationImageUrl);
          }

          setForm({
            productName: prod.productName || "",
            productDescription: prod.productDescription || "",
            warningsPrecautions: prod.warningsPrecautions || "",
            productCategory: (attr as any).productCategoryId?.toString() || "",
            productCategoryName: "",
            productSubcategory: (attr as any).productSubcategoryId?.toString() || "",
            productSubcategoryName: "",
            brandName: (attr as any).brandName || "",
            variantName: (attr as any).variantName || "",
            productForm: (attr as any).productFormId?.toString() || "",
            netQuantity: (attr as any).netQuantity || "",
            servingSize: (attr as any).servingSize || "",
            ageGroup: (attr as any).ageGroupId?.toString() || "",
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
            manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
            expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
            shelfLifeMonths: pricing.shelfLifeMonths?.toString() || "",
            stockQuantity: pricing.stockQuantity?.toString() || "",
            dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
            mrp: pricing.mrp?.toString() || "",
            sellingPricePerPack: pricing.sellingPrice?.toString() || "",
            discountPercentage: pricing.discountPercentage?.toString() || "",
            gstPercentage: pricing.gstPercentage?.toString() || "",
            hsnCode: pricing.hsnCode?.toString() || "",
            manualFile: null,
          });
          
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
                  label: "",
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
          
          console.log("✅ Form populated successfully");
        } catch (err) {
          console.error("Failed to load product for edit", err);
        }
      };
      fetchProduct();
    }
  }, [isEditMode, productId]);

  // Recalculate on dependency changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, packSize: String(calculatePackSize()) }));
  }, [form.unitsPerPack, form.numberOfPacks]);
  
  useEffect(() => {
    setForm((prev) => ({ ...prev, shelfLifeMonths: calculateShelfLife() }));
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
    
    const foodInfantAttr = {
      productCategoryId: Number(form.productCategory),
      productSubcategoryId: Number(form.productSubcategory),
      brandName: form.brandName,
      variantName: form.variantName,
      productFormId: Number(form.productForm),
      netQuantity: form.netQuantity,
      servingSize: form.servingSize,
      ageGroupId: Number(form.ageGroup),
      vegNonvegIndicator: form.dietaryClassification as "veg" | "non-veg",
      allergenInformation: form.allergenInformation,
      nutritionalInformation: form.nutritionalInfoType,
      // nutritionalInformationImageUrl: null as string | null,
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
    
    console.log("📦 Sending payload:", JSON.stringify(payload, null, 2));
    
    return payload;
  };

const handleSubmit = async () => {
  const validation = foodInfantSchema.safeParse({
    ...form,
    images: [...existingImages, ...images],
  });
  
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    validation.error.issues.forEach((err) => {
      fieldErrors[err.path.join(".")] = err.message;
    });
    setErrors(fieldErrors);
    return;
  }
  if (!validateCrossFields()) return;
  setErrors({});

  const payload = buildPayload();
  
  try {
    let response;
    let newProductAttributeId = productAttributeId;
    
    if (isEditMode && productId) {
      // Update mode
      response = await updateProduct(productId, payload);
      setModalType("update");
      
      const updatedData = response?.data || response;
      newProductAttributeId = updatedData?.productAttributeFoodInfants?.productAttributeId 
        || updatedData?.productAttributeFoodInfant?.productAttributeId 
        || productAttributeId;
      
      setProductAttributeId(newProductAttributeId || null);
      
      // Upload new images
      if (images.length > 0) {
        await uploadProductImages(productId, images);
      }
      
      // Upload user manual (this is the correct endpoint)
      if (form.manualFile && newProductAttributeId) {
        try {
          await uploadFoodInfantUserManual(newProductAttributeId, form.manualFile);
        } catch (err) {
          console.warn("⚠️ User manual upload failed:", err);
        }
      }
      
      // Upload nutritional image
      if (form.nutritionalInfoImage && newProductAttributeId) {
        try {
          await uploadNutritionalInformationImage(newProductAttributeId, 3, form.nutritionalInfoImage);
        } catch (err) {
          console.warn("⚠️ Nutritional image upload failed:", err);
        }
      }
    } else {
      // Create mode
      response = await createFoodInfantProduct(payload);
      
      console.log("Full response:", response);
      
      const newProductId = response?.data?.productId;
      newProductAttributeId = response?.data?.productAttributeFoodInfants?.[0]?.productAttributeId 
        || response?.data?.productAttributeFoodInfant?.productAttributeId;
      
      console.log("Extracted - ProductId:", newProductId, "AttributeId:", newProductAttributeId);
      
      if (!newProductId) {
        console.error("Response structure:", JSON.stringify(response, null, 2));
        throw new Error(`Product ID not returned from server. Response: ${JSON.stringify(response)}`);
      }
      
      setModalType("create");
      setProductAttributeId(newProductAttributeId || null);
      setResolvedProductId(newProductId);
      
      // Upload images
      if (images.length) {
        await uploadProductImages(newProductId, images);
      }
      
      // Upload user manual - THIS IS THE ONLY ONE NEEDED
      if (form.manualFile && newProductAttributeId) {
        try {
          await uploadFoodInfantUserManual(newProductAttributeId, form.manualFile);
        } catch (err) {
          console.warn("⚠️ User manual upload failed:", err);
        }
      }
      
      // Upload nutritional image
      if (form.nutritionalInfoImage && newProductAttributeId) {
        try {
          await uploadNutritionalInformationImage(newProductAttributeId, 3, form.nutritionalInfoImage);
        } catch (err) {
          console.warn("⚠️ Nutritional image upload failed:", err);
        }
      }
    }
    setShowSuccessModal(true);
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
      brandName: "", variantName: "", productForm: "", netQuantity: "", servingSize: "", ageGroup: "",
      dietaryClassification: "", allergenInformation: "", nutritionalInfoType: "as-per-label", nutritionalInfoImage: null,
      activeIngredients: "", additivesPreservatives: "", productClaims: "", storageConditionId: "",
      manufacturerName: "", countryOfOrigin: "", packType: "", unitsPerPack: "", numberOfPacks: "", packSize: "",
      minimumOrderQuantity: "", maximumOrderQuantity: "", batchLotNumber: "", manufacturingDate: null, expiryDate: null,
      shelfLifeMonths: "", stockQuantity: "", dateOfStockEntry: new Date(), mrp: "", sellingPricePerPack: "",
      discountPercentage: "", gstPercentage: "", hsnCode: "", manualFile: null,
    });
    setImages([]);
    setExistingImages([]);
    setExistingManualFile(null);
    setExistingNutritionalImageUrl(null);
    setSelectedCertificationValues([]);
    setCertificationsDetails([]);
    setAdditionalDiscounts([]);
    setErrors({});
  };

  const handleViewProduct = () => window.location.reload();
  const handleContinueEditing = () => setShowSuccessModal(false);
  const handleContinueAdding = () => {
    setShowSuccessModal(false);
    resetForm();
  };
  const handleBackToDashboard = () => window.location.reload();

  return (
    <>
      <PopupModal
        isOpen={showSuccessModal}
        title={modalType === "update" ? "Product Updated Successfully!" : "Product Saved Successfully!"}
        description={
          modalType === "update"
            ? "Your product has been updated and is now live on the platform"
            : "Your product has been saved and is now live on the platform"
        }
        primaryActionText="View Product"
        secondaryActionText={modalType === "update" ? "Continue Editing" : "Continue Adding"}
        tertiaryActionText="Back to Dashboard"
        onPrimaryAction={handleViewProduct}
        onSecondaryAction={modalType === "update" ? handleContinueEditing : handleContinueAdding}
        onTertiaryAction={handleBackToDashboard}
        onClose={() => setShowSuccessModal(false)}
      />

      <div className="flex flex-col gap-5 w-full max-w-full mx-auto bg-white">
        {/* Product Details Section */}
        <div className="border border-neutral-200 rounded-xl p-6">
          <div className="text-h4 font-semibold">Product Details</div>
          <div className="border-b border-neutral-200 mt-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
            {/* Product Name - Non-editable in edit mode */}
            <Input
              label="Product Name"
              name="productName"
              placeholder="e.g., Organic Protein Powder"
              onChange={handleChange}
              value={form.productName}
              error={errors.productName}
              required
              readOnly={isEditMode}
            />

            {/* Product Category - Non-editable in edit mode */}
            <Dropdown
              label="Product Category"
              options={categories}
              value={form.productCategory}
              onChange={handleCategoryChange}
              placeholder="Select category"
              required
              error={errors.productCategory}
              isDisabled={isEditMode}
            />

            {/* Product Subcategory - Styled like Supplement form, non-editable in edit mode */}
            <Dropdown
              label="Product Subcategory"
              options={subcategories}
              value={form.productSubcategory}
              onChange={(value) => handleDropdownChange("productSubcategory", value)}
              placeholder="Select subcategory"
              required
              error={errors.productSubcategory}
              isDisabled={isEditMode || !form.productCategory}
            />

            {/* Brand Name - Same schema as product name */}
            <Input
              label="Brand Name"
              name="brandName"
              placeholder="e.g., Nestle, Abbott"
              onChange={handleChange}
              value={form.brandName}
              readOnly={isEditMode}
              error={errors.brandName}
              required
            />

            {/* Variant Name - Editable in edit mode */}
            <Input
              label="Variant Name"
              name="variantName"
              placeholder="e.g., Chocolate, Vanilla"
              onChange={handleChange}
              value={form.variantName}
              readOnly={false}
              error={errors.variantName}
            />

            {/* Product Form - Non-editable in edit mode */}
            <Dropdown
              label="Product Form"
              options={productForms}
              value={form.productForm}
              onChange={(value) => handleDropdownChange("productForm", value)}
              placeholder="Select product form"
              required
              error={errors.productForm}
              isDisabled={isEditMode}
            />

            {/* Net Quantity - Non-editable in edit mode */}
            <Input
              label="Net Quantity"
              name="netQuantity"
              placeholder="e.g., 500g, 1kg"
              onChange={handleChange}
              value={form.netQuantity}
              readOnly={isEditMode}
              error={errors.netQuantity}
              required
            />

            {/* Serving Size - Editable in edit mode */}
            <Input
              label="Serving Size"
              name="servingSize"
              placeholder="e.g., 30g, 1 scoop"
              onChange={handleChange}
              value={form.servingSize}
              readOnly={false}
              error={errors.servingSize}
              required
            />

            {/* Age Group - Non-editable in edit mode */}
            <Dropdown
              label="Age Group"
              options={ageGroups}
              value={form.ageGroup}
              onChange={(value) => handleDropdownChange("ageGroup", value)}
              placeholder="Select age group"
              required
              error={errors.ageGroup}
              isDisabled={isEditMode}
            />

            {/* Veg/Non-Veg Indicator - Non-editable in edit mode */}
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Dietary Classification <span className="text-warning-500">*</span>
              </label>
              <div className="flex gap-6 mt-4">
                {dietaryOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dietaryClassification"
                      value={option.value}
                      checked={form.dietaryClassification === option.value}
                      onChange={(e) => setForm(prev => ({ ...prev, dietaryClassification: e.target.value as "veg" | "non-veg" }))}
                      disabled={isEditMode}
                      className="accent-primary-900 w-5 h-5"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.dietaryClassification && <p className="text-red-500 text-sm">{errors.dietaryClassification}</p>}
            </div>

            {/* Allergen Information - Editable in edit mode */}
            <Input
              label="Allergen Information"
              name="allergenInformation"
              placeholder="e.g., Contains milk, soy"
              onChange={handleChange}
              value={form.allergenInformation}
              readOnly={false}
              error={errors.allergenInformation}
              required
            />

            {/* Nutritional Information Table - Dropdown instead of radio buttons */}
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Nutritional Information Table <span className="text-warning-500">*</span>
              </label>
              <Dropdown
                label=""
                options={nutritionalInfoOptions}
                value={form.nutritionalInfoType}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, nutritionalInfoType: value }));
                  if (value === "as-per-label") {
                    handleRemoveNutritionalImage();
                  }
                }}
                placeholder="Select option"
                required
                error={errors.nutritionalInfoType}
                isDisabled={false}
              />
              {errors.nutritionalInfoType && <p className="text-red-500 text-sm">{errors.nutritionalInfoType}</p>}
            </div>

            {/* Nutritional Image Upload - Shown when image-upload is selected */}
            {form.nutritionalInfoType === "image-upload" && (
              <div className="flex flex-col gap-1">
                <label className="text-label-l3 text-neutral-700 font-semibold">
                  Upload Nutritional Information Image <span className="text-warning-500">*</span>
                </label>
                <div 
                  className="w-full border border-neutral-300 rounded-xl flex items-center overflow-hidden h-14 cursor-pointer"
                  onClick={() => document.getElementById("nutritionalImageInput")?.click()}
                >
                  <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
                    <Image src="/icons/upload.png" alt="Upload" width={20} height={20} />
                  </div>
                  <div className="flex flex-wrap gap-2 px-3 flex-1">
                    {(form.nutritionalInfoImage || existingNutritionalImageUrl) ? (
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-sm bg-green-100 text-green-800 border border-green-300">
                        <span>{form.nutritionalInfoImage ? form.nutritionalInfoImage.name : "Current Image"}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveNutritionalImage();
                            const input = document.getElementById("nutritionalImageInput") as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="ml-1 hover:text-gray-900 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Upload the Nutritional Information Image</span>
                    )}
                  </div>
                  {existingNutritionalImageUrl && !form.nutritionalInfoImage && (
                    <a 
                      href={existingNutritionalImageUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-purple-600 text-xs underline px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </a>
                  )}
                </div>
                <input
                  id="nutritionalImageInput"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleNutritionalImageUpload(file);
                  }}
                />
                {errors.nutritionalInfoImage && <p className="text-red-500 text-sm">{errors.nutritionalInfoImage}</p>}
              </div>
            )}

            {/* Active Ingredients - Non-editable in edit mode */}
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

            {/* Additives / Preservatives - Editable in edit mode */}
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

            {/* Product Claims - Editable in edit mode */}
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

            {/* Storage Condition - Stock dependent, non-editable in edit mode */}
            <Dropdown
              label="Storage Condition"
              options={storageConditions}
              value={form.storageConditionId}
              onChange={(value) => handleDropdownChange("storageConditionId", value)}
              placeholder="Select storage condition"
              required
              error={errors.storageConditionId}
              isDisabled={isFieldDisabled(false, true)}
            />

            {/* Manufacturer Name - Non-editable in edit mode */}
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

            {/* Certifications / Compliance - Editable in edit mode */}
            <CheckboxDropdown
              label="Certifications / Compliance"
              options={certificationsMaster}
              selectedValues={selectedCertificationValues}
              onChange={handleCertificationSelectionChange}
              placeholder="Select certifications"
              required
              disabled={false}
              showSelectAll={false}
            />

            {/* Upload Certifications / Compliance */}
            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Upload Certifications / Compliance <span className="text-warning-500">*</span>
              </label>
              <div className="w-full border border-neutral-300 rounded-xl flex items-center overflow-hidden h-14">
                <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
                  <Image src="/icons/upload.png" alt="Upload" width={20} height={20} />
                </div>
                <div className="flex flex-wrap gap-2 px-3 flex-1">
                  {certificationsDetails.map((cert) => (
                    <div
                      key={cert.id}
                      onClick={() => handleTagClick(cert.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm cursor-pointer transition ${
                        cert.isUploaded
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-purple-100 text-purple-800 border border-purple-300"
                      }`}
                    >
                      <span>{cert.tagCode}</span>
                      {cert.uploading && <span className="text-xs">Uploading...</span>}
                      <button
                        onClick={(e) => handleRemoveTag(cert.id, e)}
                        className="ml-1 hover:text-gray-900 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {certificationsDetails.length === 0 && (
                    <span className="text-gray-400 text-sm">Upload the Certificate</span>
                  )}
                </div>
              </div>
              {certificationsDetails.map((cert) => (
                <input
                  key={`input-${cert.id}`}
                  id={`cert-upload-${cert.id}`}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCertificationFileUpload(cert.id, e.target.files[0]);
                    }
                  }}
                />
              ))}
            </div>

            {/* Country of Origin - Non-editable in edit mode */}
            <Dropdown
              label="Country of Origin"
              options={countries}
              value={form.countryOfOrigin}
              onChange={(value) => handleDropdownChange("countryOfOrigin", value)}
              placeholder="Select country"
              required
              error={errors.countryOfOrigin}
              isDisabled={isEditMode}
            />

            {/* Product Brochure / User Manual - Editable in edit mode, click anywhere to upload */}
            {/* Product Brochure / User Manual - Editable in edit mode, click anywhere to upload, with + icon */}
<div className="col-span-1">
  <div className="flex flex-col gap-1">
    <label className="text-label-l3 text-neutral-700 font-semibold">
      Upload Product Brochure / User Manual
    </label>
    <div 
      className="w-full border border-neutral-300 rounded-xl flex items-center overflow-hidden h-14 cursor-pointer"
      onClick={() => document.getElementById("manualFileInput")?.click()}
    >
      <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
        <img src="/icons/upload.png" alt="Upload" width={20} height={20} />
      </div>
      <div className="flex flex-wrap gap-2 px-3 flex-1">
        {(form.manualFile || existingManualFile) ? (
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-sm bg-green-100 text-green-800 border border-green-300">
            <span>{form.manualFile ? form.manualFile.name : "Current Brochure"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleManualFileSelect(null);
                setExistingManualFile(null);
                const input = document.getElementById("manualFileInput") as HTMLInputElement;
                if (input) input.value = "";
              }}
              className="ml-1 hover:text-gray-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <span className="text-gray-400 text-sm">Upload the Product Brochure</span>
          </>
        )}
      </div>
      {existingManualFile && !form.manualFile && (
        <a 
          href={existingManualFile} 
          target="_blank" 
          rel="noreferrer" 
          className="text-purple-600 text-xs underline px-2"
          onClick={(e) => e.stopPropagation()}
        >
          View
        </a>
      )}
      {!form.manualFile && !existingManualFile && (
        <div className="px-4">
          <img src="/icons/UploadAddIcon.svg" alt="add" className="w-5 h-5" />
        </div>
      )}
    </div>
    <input
      id="manualFileInput"
      type="file"
      accept=".pdf"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
          handleManualFileSelect(file);
        } else if (file) {
          alert("Only PDF files are allowed");
        }
      }}
    />
    {errors.manualFile && <p className="text-red-500 text-sm">{errors.manualFile}</p>}
  </div>
</div>

            {/* Product Description and Warnings/Precautions */}
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                    Product Description <span className="text-warning-500">*</span>
                  </label>
                  <textarea
                    name="productDescription"
                    placeholder="Detailed product description, ingredients overview, and benefits (Minimum 10 characters)"
                    value={form.productDescription}
                    onChange={handleChange}
                    rows={4}
                    readOnly={false}
                    className={`w-full rounded-2xl p-3 resize-none border ${
                      errors.productDescription ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"
                    } focus:outline-none`}
                  />
                  {errors.productDescription && <p className="text-red-500 text-sm">{errors.productDescription}</p>}
                </div>
                <div>
                  <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                    Warnings / Precautions <span className="text-warning-500">*</span>
                  </label>
                  <textarea
                    name="warningsPrecautions"
                    placeholder="Enter warnings, precautions, and safety information"
                    value={form.warningsPrecautions}
                    onChange={handleChange}
                    rows={4}
                    readOnly={false}
                    className={`w-full rounded-2xl p-3 resize-none border ${
                      errors.warningsPrecautions ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"
                    } focus:outline-none`}
                  />
                  {errors.warningsPrecautions && <p className="text-red-500 text-sm">{errors.warningsPrecautions}</p>}
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
            {/* Pack Type - Stock dependent, non-editable in edit mode */}
            <Dropdown
              label="Pack Type"
              options={packTypes}
              value={form.packType}
              onChange={(value) => handleDropdownChange("packType", value)}
              placeholder="Select pack type"
              required
              error={errors.packType}
              isDisabled={isFieldDisabled(false, true)}
            />

            {/* Number of Units per Pack Type - Stock dependent, non-editable in edit mode */}
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

            {/* Number of Packs - Stock dependent, non-editable in edit mode */}
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

            {/* Pack Size - Auto-calculated, always read-only */}
            <Input label="Pack Size (auto-calculated)" name="packSize" value={form.packSize} readOnly required />

            {/* Order Details */}
            <div className="col-span-2 text-h6 font-normal mt-2">Order Details</div>
            <div className="col-span-2 border-b border-neutral-200"></div>

            {/* MOQ - Editable in edit mode */}
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

            {/* Max Order Qty - Editable in edit mode */}
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

            {/* Batch Management */}
            <div className="col-span-2 text-h6 font-normal mt-2">Batch Management</div>
            <div className="col-span-2 border-b"></div>

            {/* Batch Number - Non-editable in edit mode */}
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

            {/* Manufacturing Date - Non-editable in edit mode with validation */}
            <Input
              label="Manufacturing Date"
              type="month"
              name="manufacturingDate"
              value={formatMonthYear(form.manufacturingDate)}
              onChange={handleChange}
              readOnly={isEditMode}
              max={getMaxManufacturingMonth()}
              error={errors.manufacturingDate}
              required
            />

            {/* Expiry Date - Non-editable in edit mode with validation */}
            <Input
              label="Expiry Date"
              type="month"
              name="expiryDate"
              value={formatMonthYear(form.expiryDate)}
              onChange={handleChange}
              readOnly={isEditMode}
              min={form.manufacturingDate ? getMinExpiryMonth() : getMinExpiryFromToday()}
              error={errors.expiryDate}
              required
            />

            {/* Shelf Life - Auto-calculated, always read-only */}
            <Input
              type="number"
              label="Shelf Life (Months)"
              name="shelfLifeMonths"
              value={form.shelfLifeMonths}
              readOnly
              required
            />

            {/* Date of Entry - Disabled */}
            <Input
              label="Date of Entry"
              type="date"
              name="dateOfStockEntry"
              value={new Date().toISOString().split("T")[0]}
              disabled
            />

            {/* Stock Quantity - Non-editable in edit mode */}
            <Input
              type="number"
              label="Stock Quantity (numbers w.r.t pack size)"
              name="stockQuantity"
              placeholder="Number of packs in stock"
              onChange={handleChange}
              value={form.stockQuantity}
              readOnly={isEditMode}
              disabled={false}
              error={errors.stockQuantity}
              required
            />

            {/* Pricing */}
            <div className="col-span-2 text-h6 font-normal mt-2">Pricing</div>
            <div className="col-span-2 border-b"></div>

            {/* MRP - Editable in edit mode */}
            <Input
              type="number"
              label="MRP"
              name="mrp"
              placeholder="Maximum Retail Price"
              onChange={handleChange}
              value={form.mrp}
              error={errors.mrp}
              required
            />

            {/* Selling Price - Editable in edit mode */}
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

            {/* Discount Percentage and Special Offers */}
            <div className="col-span-2 flex gap-4">
              <div className="w-1/2">
                <Input
                  type="number"
                  label="Discount Percentage"
                  name="discountPercentage"
                  placeholder="e.g., 10"
                  onChange={handleChange}
                  value={form.discountPercentage}
                  error={errors.discountPercentage}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setShowAdditionalDiscount(true)}
                  className="px-4 py-2 h-14 bg-white text-[#7D32FC] border-2 border-[#7D32FC] rounded-xl font-semibold"
                >
                  + Add Special Offers
                </button>
              </div>
            </div>

            {/* TAX & BILLING */}
            <div className="col-span-2 text-h6 font-normal mt-2">TAX & BILLING</div>
            <div className="col-span-2 border-b"></div>

            {/* GST % - Non-editable in edit mode */}
            <Dropdown
              label="GST %"
              options={gstOptions}
              value={form.gstPercentage}
              onChange={(value) => handleDropdownChange("gstPercentage", value)}
              placeholder="Select GST"
              required
              error={errors.gstPercentage}
              isDisabled={isEditMode}
            />

            {/* HSN Code - Non-editable in edit mode */}
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
        </div>

        {/* Product Photos Section */}
        <div className="border border-neutral-200 rounded-xl p-6">
          <div className="text-p3 font-semibold">Product Photos <span className="text-warning-500">*</span></div>
          <div
            className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer mt-2"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              id="fileInput"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={false}
            />
            <div className="border-2 border-dashed border-neutral-300 rounded-lg w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <img src="/icons/FolderIcon.svg" alt="folder" className="w-10 h-10" />
                <div className="text-label-l2 font-normal mt-4">Choose a file or drag & drop it here</div>
                <div className="text-label-l1 text-neutral-400">Upload product images (JPEG, PNG)</div>
              </div>
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}

          <div className="flex flex-wrap gap-3 mt-4">
            {existingImages.map((img, idx) => (
              <div key={`existing-${idx}`} className="relative w-24 h-24">
                <img src={img} alt="existing" className="w-full h-full object-cover rounded-md border" />
                {!isEditMode && (
                  <button
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-1 right-1 bg-black text-white rounded-full w-5 h-5 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {images.map((file, idx) => (
              <div key={`new-${idx}`} className="relative w-24 h-24">
                <img src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover rounded-md border" />
                <button
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-1 right-1 bg-black text-white rounded-full w-5 h-5 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6 pb-8">
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-[#FF3B3B] font-semibold"
            >
              Cancel
            </button>
            <button className="px-6 py-2 bg-[#9F75FC] text-white rounded-lg flex items-center gap-2 font-semibold">
              <img src="/icons/SaveDraftIcon.svg" alt="save" className="w-5 h-5" />
              Save Draft
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800"
          >
            {isEditMode ? "Update" : "Submit"}
          </button>
        </div>

        {showAdditionalDiscount && (
          <CommonModal
            onClose={() => setShowAdditionalDiscount(false)}
            width="w-[600px]"
          >
            <div className="h-[80vh] overflow-y-auto flex flex-col p-6">
              <AdditionalDiscountType
                onClose={() => setShowAdditionalDiscount(false)}
                initialData={additionalDiscounts}
                baseDiscountPercentage={Number(form.discountPercentage) || 0}
                baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
                onSaveAdditionalDiscount={(data: AdditionalDiscountData[]) => {
                  setAdditionalDiscounts(data || []);
                  setShowAdditionalDiscount(false);
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
      </div>
    </>
  );
};

export default FoodInfantForm;

















// this code is working but having bugs , dated 15.052026

// "use client";

// import React, { useEffect, useState } from "react";
// import Input from "@/src/app/commonComponents/Input";
// import UploadInput from "../commonComponent/UploadInput";
// import PopupModal from "../commonComponent/PopupModal";
// import { foodInfantSchema } from "@/src/schema/product/FoodandInfantSchema";
// import Image from "next/image";
// // import Drawer from "@/src/app/commonComponents/Drawer";
// import AdditionalDiscount from "./AdditionalDiscount";
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
//   getStorageConditions,
//   getPackTypesByCategory,
//   getCertificationsByCategoryId,
//   uploadFoodInfantUserManual,
//   createFoodInfantProduct,
//   getFoodInfantAttributes,
//   uploadFoodInfantBrochure
// } from "@/src/services/product/FoodInfantService";

// import AdditionalDiscountType from "./AdditionalDiscountType";
// import CommonModal from "../commonComponent/CommonModal";

// import {
//   CreateProductRequest,
//   PackagingData,
//   PricingData,
//   AdditionalDiscountData,
//    SpecialSchemesData,
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

// const FoodInfantForm: React.FC<FoodInfantFormProps> = ({ mode = "create", productId }) => {
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
//     netQuantity: "",
//     servingSize: "",
//     ageGroup: "",
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
//   const [resolvedProductId, setResolvedProductId] = useState<string>("");
//   const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  
//   // Certifications state
//   const [selectedCertificationValues, setSelectedCertificationValues] = useState<string[]>([]);
//   const [certificationsDetails, setCertificationsDetails] = useState<CertificationTag[]>([]);

//   // Additional discounts

//   const [additionalDiscounts, setAdditionalDiscounts] = useState<AdditionalDiscountData[]>([]);
// const [specialSchemes, setSpecialSchemes] = useState<SpecialSchemesData[]>([]);

//   // UI state
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [images, setImages] = useState<File[]>([]);
//   const [existingImages, setExistingImages] = useState<string[]>([]);
//   const [existingManualFile, setExistingManualFile] = useState<string | null>(null);
//   // const [showDiscountDrawer, setShowDiscountDrawer] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [modalType, setModalType] = useState<"create" | "update">("create");
//   const [productAttributeId, setProductAttributeId] = useState<string | null>(null);

//   const isEditMode = mode === "edit";

//   // Stock-based edit restrictions
//   const currentStockQuantity = Number(form.stockQuantity) || 0;
//   const isStockZero = currentStockQuantity === 0;
//   const canEditStockDependent = !isEditMode || (isEditMode && isStockZero);

//   // Helper to determine if a field should be disabled in edit mode
//   const isFieldDisabled = (isEditable: boolean, isStockDependent: boolean = false): boolean => {
//     if (!isEditMode) return false;
//     if (!isEditable) return true;
//     if (isStockDependent && !canEditStockDependent) return true;
//     return false;
//   };

//   // Helper: format a Date or ISO string to YYYY-MM
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

//   const validateCrossFields = () => {
//     const newErrors: Record<string, string> = {};
//     const minQty = Number(form.minimumOrderQuantity) || 0;
//     const maxQty = Number(form.maximumOrderQuantity) || 0;
//     if (maxQty && minQty && maxQty < minQty) {
//       newErrors.maximumOrderQuantity = "Max Order Qty must be greater than Min Order Qty";
//     }
//     const mrp = Number(form.mrp) || 0;
//     const selling = Number(form.sellingPricePerPack) || 0;
//     if (selling && mrp && selling >= mrp) {
//       newErrors.sellingPricePerPack = "Selling Price must be less than MRP";
//     }
//     const discount = Number(form.discountPercentage);
//     if (form.discountPercentage !== "" && (isNaN(discount) || discount < 0 || discount > 100)) {
//       newErrors.discountPercentage = "Discount must be between 0 and 100";
//     }
//     const hsn = form.hsnCode;
//     if (hsn) {
//       const isValidLength = [4, 6, 8].includes(hsn.length);
//       const isNumeric = /^\d+$/.test(hsn);
//       if (!isNumeric || !isValidLength) {
//         newErrors.hsnCode = "HSN Code must be 4, 6, or 8 digits only";
//       }
//     }
//     setErrors((prev) => ({ ...prev, ...newErrors }));
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;

//     // Handle date fields (convert string "YYYY-MM" to Date object)
//     if (name === "manufacturingDate" || name === "expiryDate") {
//       let dateValue: Date | null = null;
//       if (value) {
//         const [year, month] = value.split("-").map(Number);
//         dateValue = new Date(year, month - 1, 1);
//         if (isNaN(dateValue.getTime())) dateValue = null;
//       }

//       setForm((prev) => {
//         const updated = { ...prev, [name]: dateValue };
//         if (name === "manufacturingDate") {
//           updated.expiryDate = null;
//           updated.shelfLifeMonths = "";
//         }
//         if (name === "expiryDate" && updated.manufacturingDate instanceof Date && dateValue instanceof Date) {
//           updated.shelfLifeMonths = calculateShelfLife();
//         }
//         return updated;
//       });
//       setTimeout(validateCrossFields, 0);
//       return;
//     }

//     // For all other fields
//     setForm((prev) => {
//       const updated = { ...prev, [name]: value };
//       if (name === "unitsPerPack" || name === "numberOfPacks") {
//         updated.packSize = String(calculatePackSize());
//       }
//       return updated;
//     });
//     setTimeout(validateCrossFields, 0);
//   };

//   const handleDropdownChange = (field: string, value: string) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     setTimeout(validateCrossFields, 0);
//   };

//   const handleCategoryChange = async (value: string, label: string) => {
//     setForm((prev) => ({
//       ...prev,
//       productCategory: value,
//       productCategoryName: label,
//       productSubcategory: "",
//     }));
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
//     }
//   };

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
//   };

//   const handleTagClick = (certId: string) => {
//     document.getElementById(`cert-upload-${certId}`)?.click();
//   };

//   const handleRemoveTag = (certId: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setSelectedCertificationValues((prev) => prev.filter((id) => id !== certId));
//     setCertificationsDetails((prev) => prev.filter((cert) => cert.id !== certId));
//   };

//   const handleCertificationFileUpload = (certId: string, file: File) => {
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
//     }, 1000);
//   };

//   const handleManualFileSelect = (file: File | null) => {
//     setForm((prev) => ({ ...prev, manualFile: file }));
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
//     setErrors((prev) => ({ ...prev, images: "" }));
//     setImages((prev) => [...prev, ...newFiles]);
//   };

//   const removeExistingImage = (index: number) => {
//     setExistingImages((prev) => prev.filter((_, i) => i !== index));
//   };

//   const removeNewImage = (index: number) => {
//     setImages((prev) => prev.filter((_, i) => i !== index));
//   };

//   // ---------- Fetch master data ----------
//   useEffect(() => {
//     const fetchMasterData = async () => {
//       try {
//         const catData = await getProductCategories(3);
//         setCategories(
//           catData.map((c: any) => ({ value: String(c.productCategoryId), label: c.productCategory }))
//         );

//         const ageData = await getAgeGroups();
//         setAgeGroups(
//           ageData.map((a: any) => ({ value: String(a.ageGroupId), label: a.ageGroup }))
//         );

//         const formData = await getProductForms();
//         setProductForms(
//           formData.map((f: any) => ({ value: String(f.productFormId), label: f.productForm }))
//         );

//         const countryData = await getCountries();
//         if (Array.isArray(countryData)) {
//           setCountries(
//             countryData.map((c: any) => ({
//               value: String(c.countryId ?? c.id),
//               label: c.countryName ?? c.name,
//             }))
//           );
//         } else {
//           setCountries([]);
//         }

//         const storageData = await getStorageConditions();
//         setStorageConditions(
//           (storageData || []).map((s: any) => ({
//             value: String(s.storageConditionId ?? s.id),
//             label: s.conditionName ?? s.condition ?? s.name,
//           }))
//         );

//         const packData = await getPackTypesByCategory(3);
//         if (Array.isArray(packData)) {
//           setPackTypes(
//             packData.map((p: any) => ({
//               value: String(p.packId ?? p.id),
//               label: p.packType ?? p.type ?? p.name,
//             }))
//           );
//         } else {
//           setPackTypes([]);
//         }

//         const certData = await getCertificationsByCategoryId(3);
//         setCertificationsMaster(
//           (certData || []).map((c: any) => ({
//             value: String(c.id ?? c.certificationId),
//             label: c.name ?? c.certificationName,
//             tagCode: c.code ?? (c.name?.slice(0, 4).toUpperCase() ?? "CERT"),
//           }))
//         );
//       } catch (err) {
//         console.error("Master data fetch failed", err);
//       }
//     };
//     fetchMasterData();
//   }, []);

//   // ---------- Edit mode ----------
//   useEffect(() => {
//     if (isEditMode && productId) {
//       const fetchProduct = async () => {
//         try {
//           const prod = await getProductById(productId);
//           console.log("🔍 Full product for edit:", JSON.stringify(prod, null, 2));
          
//           let attr = {};
          
//           if (prod.productAttributeFoodInfants && Array.isArray(prod.productAttributeFoodInfants) && prod.productAttributeFoodInfants.length > 0) {
//             attr = prod.productAttributeFoodInfants[0];
//             console.log("✅ Found productAttributeFoodInfants in main response:", attr);
//           } else if (prod.productAttributeFoodInfant) {
//             attr = prod.productAttributeFoodInfant;
//             console.log("✅ Found productAttributeFoodInfant in main response:", attr);
//           } else {
//             console.log("⚠️ No attributes in main response, fetching separately...");
//             try {
//               const foodInfantAttr = await getFoodInfantAttributes(productId);
//               if (foodInfantAttr) {
//                 attr = foodInfantAttr;
//                 console.log("✅ Fetched attributes separately:", attr);
//               }
//             } catch (err) {
//               console.error("Failed to fetch attributes separately:", err);
//             }
//           }
          
//           const pricing = prod.pricingDetails?.[0] || {};
//           const packaging = prod.packagingDetails?.[0] || {};

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
//             netQuantity: (attr as any).netQuantity || "",
//             servingSize: (attr as any).servingSize || "",
//             ageGroup: (attr as any).ageGroupId?.toString() || "",
//             dietaryClassification: (attr as any).vegNonvegIndicator || "",
//             allergenInformation: (attr as any).allergenInformation || "",
//             nutritionalInfoType: (attr as any).nutritionalInformation || "as-per-label",
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
//           });
          
//           setExistingImages(prod.productImages?.map((img: any) => img.productImage) || []);
//           setExistingManualFile((attr as any).productUserManual || null);
//           setAdditionalDiscounts(pricing.additionalDiscounts || []);
//           setSpecialSchemes(pricing.specialSchemes || []); 
//           setProductAttributeId((attr as any).productAttributeId || null);
          
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
//                   label: "",
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
          
//           console.log("✅ Form populated successfully");
//         } catch (err) {
//           console.error("Failed to load product for edit", err);
//         }
//       };
//       fetchProduct();
//     }
//   }, [isEditMode, productId]);

//   // Recalculate on dependency changes
//   useEffect(() => {
//     setForm((prev) => ({ ...prev, packSize: String(calculatePackSize()) }));
//   }, [form.unitsPerPack, form.numberOfPacks]);
  
//   useEffect(() => {
//     setForm((prev) => ({ ...prev, shelfLifeMonths: calculateShelfLife() }));
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
    
//     const foodInfantAttr = {
//       productCategoryId: Number(form.productCategory),
//       productSubcategoryId: Number(form.productSubcategory),
//       brandName: form.brandName,
//       variantName: form.variantName,
//       productFormId: Number(form.productForm),
//       netQuantity: form.netQuantity,
//       servingSize: form.servingSize,
//       ageGroupId: Number(form.ageGroup),
//       vegNonvegIndicator: form.dietaryClassification as "veg" | "non-veg",
//       allergenInformation: form.allergenInformation,
//       nutritionalInformation: form.nutritionalInfoType,
//       nutritionalInformationImageUrl: form.nutritionalInfoImage ? URL.createObjectURL(form.nutritionalInfoImage) : null,
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
    
//     console.log("📦 Sending payload:", JSON.stringify(payload, null, 2));
    
//     return payload;
//   };

//   const handleSubmit = async () => {
//     const validation = foodInfantSchema.safeParse({
//       ...form,
//       images: [...existingImages, ...images],
//     });
    
//     if (!validation.success) {
//       const fieldErrors: Record<string, string> = {};
//       validation.error.issues.forEach((err) => {
//         fieldErrors[err.path.join(".")] = err.message;
//       });
//       setErrors(fieldErrors);
//       return;
//     }
//     if (!validateCrossFields()) return;
//     setErrors({});

//     const payload = buildPayload();
    
//     try {
//       let response;
//       if (isEditMode && productId) {
//         // Update mode
//         response = await updateProduct(productId, payload);
//         setModalType("update");
        
//         const updatedData = response?.data || response;
//         const newProductAttributeId = updatedData?.productAttributeFoodInfants?.productAttributeId 
//           || updatedData?.productAttributeFoodInfant?.productAttributeId 
//           || productAttributeId;
        
//         if (newProductAttributeId && form.manualFile) {
//           await uploadFoodInfantUserManual(newProductAttributeId, form.manualFile);
//         }
//         if (images.length > 0) {
//           await uploadProductImages(productId, images);
//         }
//         if (form.manualFile && productAttributeId) {
//     try {
//       await uploadFoodInfantBrochure(productAttributeId, form.manualFile);
//     } catch (err) {
//       console.warn("⚠️ Brochure upload failed:", err);
//     }
//   }
//       } else {
//         // Create mode
//         response = await createFoodInfantProduct(payload);
        
//         console.log("Full response:", response);
        
//         const newProductId = response?.data?.productId;
//         const newAttrId = response?.data?.productAttributeFoodInfants?.productAttributeId 
//           || response?.data?.productAttributeFoodInfant?.productAttributeId;
        
//         console.log("Extracted - ProductId:", newProductId, "AttributeId:", newAttrId);
        
//         if (!newProductId) {
//           console.error("Response structure:", JSON.stringify(response, null, 2));
//           throw new Error(`Product ID not returned from server. Response: ${JSON.stringify(response)}`);
//         }
        
//         setModalType("create");
//         setProductAttributeId(newAttrId || null);
//         setResolvedProductId(newProductId);
        
//         if (images.length) {
//           await uploadProductImages(newProductId, images);
//         }
//         if (form.manualFile && newAttrId) {
//           await uploadFoodInfantUserManual(newAttrId, form.manualFile);
//         }
//         if (form.manualFile && newAttrId) {
//     try {
//       await uploadFoodInfantBrochure(newAttrId, form.manualFile);
//     } catch (err) {
//       console.warn("⚠️ Brochure upload failed:", err);
//     }
//   }
//       }
//       setShowSuccessModal(true);
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
//       brandName: "", variantName: "", productForm: "", netQuantity: "", servingSize: "", ageGroup: "",
//       dietaryClassification: "", allergenInformation: "", nutritionalInfoType: "as-per-label", nutritionalInfoImage: null,
//       activeIngredients: "", additivesPreservatives: "", productClaims: "", storageConditionId: "",
//       manufacturerName: "", countryOfOrigin: "", packType: "", unitsPerPack: "", numberOfPacks: "", packSize: "",
//       minimumOrderQuantity: "", maximumOrderQuantity: "", batchLotNumber: "", manufacturingDate: null, expiryDate: null,
//       shelfLifeMonths: "", stockQuantity: "", dateOfStockEntry: new Date(), mrp: "", sellingPricePerPack: "",
//       discountPercentage: "", gstPercentage: "", hsnCode: "", manualFile: null,
//     });
//     setImages([]);
//     setExistingImages([]);
//     setExistingManualFile(null);
//     setSelectedCertificationValues([]);
//     setCertificationsDetails([]);
//     setAdditionalDiscounts([]);
//     setErrors({});
//   };

//   const handleViewProduct = () => window.location.reload();
//   const handleContinueEditing = () => setShowSuccessModal(false);
//   const handleContinueAdding = () => {
//     setShowSuccessModal(false);
//     resetForm();
//   };
//   const handleBackToDashboard = () => window.location.reload();

//   return (
//     <>
//       <PopupModal
//         isOpen={showSuccessModal}
//         title={modalType === "update" ? "Product Updated Successfully!" : "Product Saved Successfully!"}
//         description={
//           modalType === "update"
//             ? "Your product has been updated and is now live on the platform"
//             : "Your product has been saved and is now live on the platform"
//         }
//         primaryActionText="View Product"
//         secondaryActionText={modalType === "update" ? "Continue Editing" : "Continue Adding"}
//         tertiaryActionText="Back to Dashboard"
//         onPrimaryAction={handleViewProduct}
//         onSecondaryAction={modalType === "update" ? handleContinueEditing : handleContinueAdding}
//         onTertiaryAction={handleBackToDashboard}
//         onClose={() => setShowSuccessModal(false)}
//       />

//       <div className="flex flex-col gap-5 w-full max-w-full mx-auto">
//         {/* Product Details Section */}
//         <div className="border border-neutral-200 rounded-xl p-6">
//           <div className="text-h4 font-semibold">Product Details</div>
//           <div className="border-b border-neutral-200 mt-3"></div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
//             {/* Product Name - Non-editable in edit mode */}
//             <Input
//               label="Product Name"
//               name="productName"
//               placeholder="e.g., Organic Protein Powder"
//               onChange={handleChange}
//               value={form.productName}
//               error={errors.productName}
//               required
//               readOnly={isEditMode}
//             />

//             {/* Product Category - Non-editable in edit mode */}
//             <Dropdown
//               label="Product Category"
//               options={categories}
//               value={form.productCategory}
//               onChange={handleCategoryChange}
//               placeholder="Select category"
//               required
//               error={errors.productCategory}
//               isDisabled={isEditMode}
//             />

//             {/* Product Subcategory - Non-editable in edit mode */}
//             <Dropdown
//               label="Product Subcategory"
//               options={subcategories}
//               value={form.productSubcategory}
//               onChange={(value) => handleDropdownChange("productSubcategory", value)}
//               placeholder="Select subcategory"
//               required
//               error={errors.productSubcategory}
//               isDisabled={isEditMode || !form.productCategory}
//             />

//             {/* Brand Name - Non-editable in edit mode */}
//             <Input
//               label="Brand Name"
//               name="brandName"
//               placeholder="e.g., Nestle, Abbott"
//               onChange={handleChange}
//               value={form.brandName}
//               readOnly={isEditMode}
//               error={errors.brandName}
//               required
//             />

//             {/* Variant Name - Editable in edit mode */}
//             <Input
//               label="Variant Name"
//               name="variantName"
//               placeholder="e.g., Chocolate, Vanilla"
//               onChange={handleChange}
//               value={form.variantName}
//               readOnly={false}
//               error={errors.variantName}
//             />

//             {/* Product Form - Non-editable in edit mode */}
//             <Dropdown
//               label="Product Form"
//               options={productForms}
//               value={form.productForm}
//               onChange={(value) => handleDropdownChange("productForm", value)}
//               placeholder="Select product form"
//               required
//               error={errors.productForm}
//               isDisabled={isEditMode}
//             />

//             {/* Net Quantity - Non-editable in edit mode */}
//             <Input
//               label="Net Quantity"
//               name="netQuantity"
//               placeholder="e.g., 500g, 1kg"
//               onChange={handleChange}
//               value={form.netQuantity}
//               readOnly={isEditMode}
//               error={errors.netQuantity}
//               required
//             />

//             {/* Serving Size - Editable in edit mode */}
//             <Input
//               label="Serving Size"
//               name="servingSize"
//               placeholder="e.g., 30g, 1 scoop"
//               onChange={handleChange}
//               value={form.servingSize}
//               readOnly={false}
//               error={errors.servingSize}
//               required
//             />

//             {/* Age Group - Non-editable in edit mode */}
//             <Dropdown
//               label="Age Group"
//               options={ageGroups}
//               value={form.ageGroup}
//               onChange={(value) => handleDropdownChange("ageGroup", value)}
//               placeholder="Select age group"
//               required
//               error={errors.ageGroup}
//               isDisabled={isEditMode}
//             />

//             {/* Veg/Non-Veg Indicator - Non-editable in edit mode */}
//             <div className="flex flex-col gap-1">
//               <label className="text-label-l3 text-neutral-700 font-semibold">
//                 Dietary Classification <span className="text-warning-500">*</span>
//               </label>
//               <div className="flex gap-6 mt-4">
//                 {dietaryOptions.map((option) => (
//                   <label key={option.value} className="flex items-center gap-2 cursor-pointer">
//                     <input
//                       type="radio"
//                       name="dietaryClassification"
//                       value={option.value}
//                       checked={form.dietaryClassification === option.value}
//                       onChange={(e) => setForm(prev => ({ ...prev, dietaryClassification: e.target.value as "veg" | "non-veg" }))}
//                       disabled={isEditMode}
//                       className="accent-primary-900 w-5 h-5"
//                     />
//                     <span>{option.label}</span>
//                   </label>
//                 ))}
//               </div>
//               {errors.dietaryClassification && <p className="text-red-500 text-sm">{errors.dietaryClassification}</p>}
//             </div>

//             {/* Allergen Information - Editable in edit mode */}
//             <Input
//               label="Allergen Information"
//               name="allergenInformation"
//               placeholder="e.g., Contains milk, soy"
//               onChange={handleChange}
//               value={form.allergenInformation}
//               readOnly={false}
//               error={errors.allergenInformation}
//               required
//             />

//             {/* Nutritional Information Table - Editable in edit mode */}
//             <div className="flex flex-col gap-1">
//               <label className="text-label-l3 text-neutral-700 font-semibold">
//                 Nutritional Information Table <span className="text-warning-500">*</span>
//               </label>
//               <div className="flex gap-6 mt-4">
//                 {nutritionalInfoOptions.map((option) => (
//                   <label key={option.value} className="flex items-center gap-2 cursor-pointer">
//                     <input
//                       type="radio"
//                       name="nutritionalInfoType"
//                       value={option.value}
//                       checked={form.nutritionalInfoType === option.value}
//                       onChange={handleChange}
//                       disabled={false}
//                       className="accent-primary-900 w-5 h-5"
//                     />
//                     <span>{option.label}</span>
//                   </label>
//                 ))}
//               </div>
//               {errors.nutritionalInfoType && <p className="text-red-500 text-sm">{errors.nutritionalInfoType}</p>}
//             </div>

//             {/* Active Ingredients - Non-editable in edit mode */}
//             <Input
//               label="Active Ingredients"
//               name="activeIngredients"
//               placeholder="e.g., Vitamin C, Protein"
//               onChange={handleChange}
//               value={form.activeIngredients}
//               readOnly={isEditMode}
//               error={errors.activeIngredients}
//               required
//             />

//             {/* Additives / Preservatives - Editable in edit mode */}
//             <Input
//               label="Additives / Preservatives"
//               name="additivesPreservatives"
//               placeholder="e.g., Citric acid"
//               onChange={handleChange}
//               value={form.additivesPreservatives}
//               readOnly={false}
//               error={errors.additivesPreservatives}
//               required
//             />

//             {/* Product Claims - Editable in edit mode */}
//             <Input
//               label="Product Claims"
//               name="productClaims"
//               placeholder="e.g., Gluten-free"
//               onChange={handleChange}
//               value={form.productClaims}
//               readOnly={false}
//               error={errors.productClaims}
//               required
//             />

//             {/* Storage Condition - Stock dependent, non-editable in edit mode */}
//             <Dropdown
//               label="Storage Condition"
//               options={storageConditions}
//               value={form.storageConditionId}
//               onChange={(value) => handleDropdownChange("storageConditionId", value)}
//               placeholder="Select storage condition"
//               required
//               error={errors.storageConditionId}
//               isDisabled={isFieldDisabled(false, true)}
//             />

//             {/* Manufacturer Name - Non-editable in edit mode */}
//             <Input
//               label="Manufacturer Name"
//               name="manufacturerName"
//               placeholder="Manufacturer company name"
//               onChange={handleChange}
//               value={form.manufacturerName}
//               readOnly={isEditMode}
//               error={errors.manufacturerName}
//               required
//             />

//             {/* Certifications / Compliance - Editable in edit mode */}
//             <CheckboxDropdown
//               label="Certifications / Compliance"
//               options={certificationsMaster}
//               selectedValues={selectedCertificationValues}
//               onChange={handleCertificationSelectionChange}
//               placeholder="Select certifications"
//               required
//               disabled={false}
//               showSelectAll={false}
//             />

//             {/* Upload Certifications / Compliance */}
//             <div className="flex flex-col gap-1">
//               <label className="text-label-l3 text-neutral-700 font-semibold">
//                 Upload Certifications / Compliance <span className="text-warning-500">*</span>
//               </label>
//               <div className="w-full border border-neutral-300 rounded-xl flex items-center overflow-hidden h-14">
//                 <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
//                   <Image src="/icons/upload.png" alt="Upload" width={20} height={20} />
//                 </div>
//                 <div className="flex flex-wrap gap-2 px-3 flex-1">
//                   {certificationsDetails.map((cert) => (
//                     <div
//                       key={cert.id}
//                       onClick={() => handleTagClick(cert.id)}
//                       className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm cursor-pointer transition ${
//                         cert.isUploaded
//                           ? "bg-green-100 text-green-800 border border-green-300"
//                           : "bg-purple-100 text-purple-800 border border-purple-300"
//                       }`}
//                     >
//                       <span>{cert.tagCode}</span>
//                       {cert.uploading && <span className="text-xs">Uploading...</span>}
//                       <button
//                         onClick={(e) => handleRemoveTag(cert.id, e)}
//                         className="ml-1 hover:text-gray-900 text-xs font-bold"
//                       >
//                         ✕
//                       </button>
//                     </div>
//                   ))}
//                   {certificationsDetails.length === 0 && (
//                     <span className="text-gray-400 text-sm">Upload the Certificate</span>
//                   )}
//                 </div>
//               </div>
//               {certificationsDetails.map((cert) => (
//                 <input
//                   key={`input-${cert.id}`}
//                   id={`cert-upload-${cert.id}`}
//                   type="file"
//                   accept=".pdf,.jpg,.jpeg,.png"
//                   className="hidden"
//                   onChange={(e) => {
//                     if (e.target.files && e.target.files[0]) {
//                       handleCertificationFileUpload(cert.id, e.target.files[0]);
//                     }
//                   }}
//                 />
//               ))}
//             </div>

//             {/* Country of Origin - Non-editable in edit mode */}
//             <Dropdown
//               label="Country of Origin"
//               options={countries}
//               value={form.countryOfOrigin}
//               onChange={(value) => handleDropdownChange("countryOfOrigin", value)}
//               placeholder="Select country"
//               required
//               error={errors.countryOfOrigin}
//               isDisabled={isEditMode}
//             />

//             {/* Product Brochure / User Manual - Editable in edit mode */}
//             <div className="col-span-1">
//               <UploadInput
//                 onFileSelect={handleManualFileSelect}
//                 existingFile={existingManualFile || undefined}
//                 // label="Upload Product Brochure / User Manual"
//               />
//             </div>

//             {/* Product Description and Warnings/Precautions */}
//             <div className="col-span-1 md:col-span-2">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
//                     Product Description <span className="text-warning-500">*</span>
//                   </label>
//                   <textarea
//                     name="productDescription"
//                     placeholder="Detailed product description, ingredients overview, and benefits (Minimum 10 characters)"
//                     value={form.productDescription}
//                     onChange={handleChange}
//                     rows={4}
//                     readOnly={false}
//                     className={`w-full rounded-2xl p-3 resize-none border ${
//                       errors.productDescription ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"
//                     } focus:outline-none`}
//                   />
//                   {errors.productDescription && <p className="text-red-500 text-sm">{errors.productDescription}</p>}
//                 </div>
//                 <div>
//                   <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
//                     Warnings / Precautions <span className="text-warning-500">*</span>
//                   </label>
//                   <textarea
//                     name="warningsPrecautions"
//                     placeholder="Enter warnings, precautions, and safety information"
//                     value={form.warningsPrecautions}
//                     onChange={handleChange}
//                     rows={4}
//                     readOnly={false}
//                     className={`w-full rounded-2xl p-3 resize-none border ${
//                       errors.warningsPrecautions ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"
//                     } focus:outline-none`}
//                   />
//                   {errors.warningsPrecautions && <p className="text-red-500 text-sm">{errors.warningsPrecautions}</p>}
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
//             {/* Pack Type - Stock dependent, non-editable in edit mode */}
//             <Dropdown
//               label="Pack Type"
//               options={packTypes}
//               value={form.packType}
//               onChange={(value) => handleDropdownChange("packType", value)}
//               placeholder="Select pack type"
//               required
//               error={errors.packType}
//               isDisabled={isFieldDisabled(false, true)}
//             />

//             {/* Number of Units per Pack Type - Stock dependent, non-editable in edit mode */}
//             <Input
//               type="number"
//               label="Number of Units per Pack Type"
//               name="unitsPerPack"
//               placeholder="e.g., 100"
//               onChange={handleChange}
//               value={form.unitsPerPack}
//               readOnly={isFieldDisabled(false, true)}
//               disabled={isFieldDisabled(false, true)}
//               error={errors.unitsPerPack}
//               required
//             />

//             {/* Number of Packs - Stock dependent, non-editable in edit mode */}
//             <Input
//               type="number"
//               label="Number of Packs"
//               name="numberOfPacks"
//               placeholder="e.g., 5"
//               onChange={handleChange}
//               value={form.numberOfPacks}
//               readOnly={isFieldDisabled(false, true)}
//               disabled={isFieldDisabled(false, true)}
//               error={errors.numberOfPacks}
//               required
//             />

//             {/* Pack Size - Auto-calculated, always read-only */}
//             <Input label="Pack Size (auto-calculated)" name="packSize" value={form.packSize} readOnly required />

//             {/* Order Details */}
//             <div className="col-span-2 text-h6 font-normal mt-2">Order Details</div>
//             <div className="col-span-2 border-b border-neutral-200"></div>

//             {/* MOQ - Editable in edit mode */}
//             <Input
//               type="number"
//               label="Min Order Qty"
//               name="minimumOrderQuantity"
//               placeholder="Minimum quantity per order"
//               onChange={handleChange}
//               value={form.minimumOrderQuantity}
//               readOnly={false}
//               error={errors.minimumOrderQuantity}
//               required
//             />

//             {/* Max Order Qty - Editable in edit mode */}
//             <Input
//               type="number"
//               label="Max Order Qty"
//               name="maximumOrderQuantity"
//               placeholder="Maximum quantity per order"
//               onChange={handleChange}
//               value={form.maximumOrderQuantity}
//               readOnly={false}
//               error={errors.maximumOrderQuantity}
//               required
//             />

//             {/* Batch Management */}
//             <div className="col-span-2 text-h6 font-normal mt-2">Batch Management</div>
//             <div className="col-span-2 border-b"></div>

//             {/* Batch Number - Non-editable in edit mode */}
//             <Input
//               label="Batch/Lot Number"
//               name="batchLotNumber"
//               placeholder="Enter batch number"
//               onChange={handleChange}
//               value={form.batchLotNumber}
//               readOnly={isEditMode}
//               error={errors.batchLotNumber}
//               required
//             />

//             {/* Manufacturing Date - Non-editable in edit mode */}
//             <Input
//               label="Manufacturing Date"
//               type="month"
//               name="manufacturingDate"
//               value={formatMonthYear(form.manufacturingDate)}
//               onChange={handleChange}
//               readOnly={isEditMode}
//               error={errors.manufacturingDate}
//               required
//             />

//             {/* Expiry Date - Non-editable in edit mode */}
//             <Input
//               label="Expiry Date"
//               type="month"
//               name="expiryDate"
//               value={formatMonthYear(form.expiryDate)}
//               onChange={handleChange}
//               readOnly={isEditMode}
//               error={errors.expiryDate}
//               required
//             />

//             {/* Shelf Life - Auto-calculated, always read-only */}
//             <Input
//               type="number"
//               label="Shelf Life (Months)"
//               name="shelfLifeMonths"
//               value={form.shelfLifeMonths}
//               readOnly
//               required
//             />

//             {/* Date of Entry - Disabled */}
//             <Input
//               label="Date of Entry"
//               type="date"
//               name="dateOfStockEntry"
//               value={new Date().toISOString().split("T")[0]}
//               disabled
//             />

//             {/* Stock Quantity - Non-editable in edit mode */}
//             <Input
//               type="number"
//               label="Stock Quantity (numbers w.r.t pack size)"
//               name="stockQuantity"
//               placeholder="Number of packs in stock"
//               onChange={handleChange}
//               value={form.stockQuantity}
//               readOnly={isEditMode}
//               disabled={false}
//               error={errors.stockQuantity}
//               required
//             />

//             {/* Pricing */}
//             <div className="col-span-2 text-h6 font-normal mt-2">Pricing</div>
//             <div className="col-span-2 border-b"></div>

//             {/* MRP - Editable in edit mode */}
//             <Input
//               type="number"
//               label="MRP"
//               name="mrp"
//               placeholder="Maximum Retail Price"
//               onChange={handleChange}
//               value={form.mrp}
//               error={errors.mrp}
//               required
//             />

//             {/* Selling Price - Editable in edit mode */}
//             <Input
//               type="number"
//               label="Selling Price (per Pack Size)"
//               name="sellingPricePerPack"
//               placeholder="Selling price per pack"
//               onChange={handleChange}
//               value={form.sellingPricePerPack}
//               error={errors.sellingPricePerPack}
//               required
//             />

//             {/* Discount Percentage and Special Offers */}
         
// {/* Discount Percentage and Special Offers */}
// <div className="col-span-2 flex gap-4">
//   <div className="w-1/2">
//     <Input
//       type="number"
//       label="Discount Percentage"
//       name="discountPercentage"
//       placeholder="e.g., 10"
//       onChange={handleChange}
//       value={form.discountPercentage}
//       error={errors.discountPercentage}
//     />
//   </div>
//   <div className="flex items-end">
//     <button
//       onClick={() => setShowAdditionalDiscount(true)}
//       className="px-4 py-2 h-14 bg-white text-[#7D32FC] border-2 border-[#7D32FC] rounded-xl font-semibold"
//     >
//       + Add Special Offers
//     </button>
//   </div>
// </div>

//             {/* TAX & BILLING */}
//             <div className="col-span-2 text-h6 font-normal mt-2">TAX & BILLING</div>
//             <div className="col-span-2 border-b"></div>

//             {/* GST % - Non-editable in edit mode */}
//             <Dropdown
//               label="GST %"
//               options={gstOptions}
//               value={form.gstPercentage}
//               onChange={(value) => handleDropdownChange("gstPercentage", value)}
//               placeholder="Select GST"
//               required
//               error={errors.gstPercentage}
//               isDisabled={isEditMode}
//             />

//             {/* HSN Code - Non-editable in edit mode */}
//             <Input
//               type="text"
//               label="HSN Code"
//               name="hsnCode"
//               placeholder="HSN Code"
//               onChange={handleChange}
//               value={form.hsnCode}
//               readOnly={isEditMode}
//               error={errors.hsnCode}
//               required
//             />
//           </div>
//         </div>

//         {/* Product Photos Section */}
//         <div className="border border-neutral-200 rounded-xl p-6">
//           <div className="text-p3 font-semibold">Product Photos <span className="text-warning-500">*</span></div>
//           <div
//             className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer mt-2"
//             onClick={() => document.getElementById("fileInput")?.click()}
//           >
//             <input
//               id="fileInput"
//               type="file"
//               multiple
//               accept="image/*"
//               className="hidden"
//               onChange={handleImageUpload}
//               disabled={false}
//             />
//             <div className="border-2 border-dashed border-neutral-300 rounded-lg w-full h-full flex items-center justify-center">
//               <div className="flex flex-col items-center">
//                 <img src="/icons/FolderIcon.svg" alt="folder" className="w-10 h-10" />
//                 <div className="text-label-l2 font-normal mt-4">Choose a file or drag & drop it here</div>
//                 <div className="text-label-l1 text-neutral-400">Upload product images (JPEG, PNG)</div>
//               </div>
//             </div>
//           </div>
//           {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}

//           <div className="flex flex-wrap gap-3 mt-4">
//             {existingImages.map((img, idx) => (
//               <div key={`existing-${idx}`} className="relative w-24 h-24">
//                 <img src={img} alt="existing" className="w-full h-full object-cover rounded-md border" />
//                 {!isEditMode && (
//                   <button
//                     onClick={() => removeExistingImage(idx)}
//                     className="absolute top-1 right-1 bg-black text-white rounded-full w-5 h-5 text-xs"
//                   >
//                     ✕
//                   </button>
//                 )}
//               </div>
//             ))}
//             {images.map((file, idx) => (
//               <div key={`new-${idx}`} className="relative w-24 h-24">
//                 <img src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover rounded-md border" />
//                 <button
//                   onClick={() => removeNewImage(idx)}
//                   className="absolute top-1 right-1 bg-black text-white rounded-full w-5 h-5 text-xs"
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
//             <button
//               onClick={() => window.location.reload()}
//               className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-[#FF3B3B] font-semibold"
//             >
//               Cancel
//             </button>
//             <button className="px-6 py-2 bg-[#9F75FC] text-white rounded-lg flex items-center gap-2 font-semibold">
//               <img src="/icons/SaveDraftIcon.svg" alt="save" className="w-5 h-5" />
//               Save Draft
//             </button>
//           </div>
//           <button
//             type="button"
//             onClick={handleSubmit}
//             className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800"
//           >
//             {isEditMode ? "Update" : "Submit"}
//           </button>
//         </div>

//         {/* {showDiscountDrawer && (
//           <Drawer setShowDrawer={setShowDiscountDrawer} title="Additional Discount">
//             <AdditionalDiscount
//               form={form}
//               onChange={handleChange}
//               onSave={() => setShowDiscountDrawer(false)}
//             />
//           </Drawer>
//         )} */}
// {showAdditionalDiscount && (
//   <CommonModal
//     onClose={() => setShowAdditionalDiscount(false)}
//     width="w-[600px]"
//   >
//     <div className="h-[80vh] overflow-y-auto flex flex-col p-6">
//       <AdditionalDiscountType
//         onClose={() => setShowAdditionalDiscount(false)}
//         initialData={additionalDiscounts}
//         baseDiscountPercentage={Number(form.discountPercentage) || 0}
//         baseMinimumOrderQuantity={Number(form.minimumOrderQuantity) || 0}
//         onSaveAdditionalDiscount={(data: AdditionalDiscountData[]) => {
//           setAdditionalDiscounts(data || []);
//           setShowAdditionalDiscount(false);
//         }}
//         initialSchemesData={specialSchemes}
//         onSaveSpecialSchemes={(data: SpecialSchemesData[]) => {
//           setSpecialSchemes(data || []);
//           setShowAdditionalDiscount(false);
//         }}
//       />
//     </div>
//   </CommonModal>
// )}
//       </div>
//     </>
//   );
// };

// export default FoodInfantForm;