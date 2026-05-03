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
import AdditionalDiscount from "./AdditionalDiscount";

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

const therapeuticCategoryOptions: SelectOption[] = [
  { value: "vitamins", label: "Vitamins & Minerals" },
  { value: "herbal", label: "Herbal Supplements" },
  { value: "sports", label: "Sports Nutrition" },
  { value: "weight", label: "Weight Management" },
];

const subCategoryOptions: Record<string, SelectOption[]> = {
  vitamins: [
    { value: "multivitamins", label: "Multivitamins" },
    { value: "vitamin_c", label: "Vitamin C" },
    { value: "vitamin_d", label: "Vitamin D" },
  ],
  herbal: [
    { value: "ashwagandha", label: "Ashwagandha" },
    { value: "ginseng", label: "Ginseng" },
  ],
  sports: [
    { value: "whey_protein", label: "Whey Protein" },
    { value: "creatine", label: "Creatine" },
    { value: "bcaa", label: "BCAA" },
  ],
  weight: [
    { value: "fat_burners", label: "Fat Burners" },
    { value: "meal_replacements", label: "Meal Replacements" },
  ],
};

const dosageFormOptions: SelectOption[] = [
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "powder", label: "Powder" },
  { value: "liquid", label: "Liquid" },
  { value: "gummies", label: "Gummies" },
];

const nutritionalInfoOptions: SelectOption[] = [
  { value: "label", label: "As per the label" },
  { value: "image", label: "Image upload" },
];

const ageGroupOptions: SelectOption[] = [
  { value: "adults", label: "Adults" },
  { value: "children", label: "Children" },
  { value: "seniors", label: "Seniors" },
  { value: "all", label: "All Ages" },
];

const genderOptions: SelectOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unisex", label: "Unisex" },
];

const flavourOptions: SelectOption[] = [
  { value: "unflavoured", label: "Unflavoured" },
  { value: "chocolate", label: "Chocolate" },
  { value: "vanilla", label: "Vanilla" },
  { value: "strawberry", label: "Strawberry" },
  { value: "orange", label: "Orange" },
  { value: "lemon", label: "Lemon" },
];

const storageOptions: SelectOption[] = [
  { value: "1", label: "Cool & Dry Place" },
  { value: "2", label: "Room Temperature" },
  { value: "3", label: "Refrigerate (2–8°C)" },
  { value: "4", label: "Avoid Direct Sunlight" },
  { value: "5", label: "Below 25°C" },
];

const countryOptions: SelectOption[] = [
  { value: "1", label: "India" },
  { value: "2", label: "United States" },
  { value: "3", label: "United Kingdom" },
  { value: "4", label: "Germany" },
  { value: "5", label: "Australia" },
];

const certificationOptions = [
  { value: "1", label: "FSSAI License", tagCode: "FSSAI" },
  { value: "2", label: "GMP Certified", tagCode: "GMP" },
  { value: "3", label: "ISO 9001", tagCode: "ISO" },
  { value: "4", label: "FDA Registered", tagCode: "FDA" },
  { value: "5", label: "Organic Certified", tagCode: "ORG" },
];

const packTypeOptions: SelectOption[] = [
  { value: "1", label: "Bottle" },
  { value: "2", label: "Blister Pack" },
  { value: "3", label: "Jar" },
  { value: "4", label: "Box" },
];

const gstOptions: SelectOption[] = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const SupplementForm = () => {
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef =
    (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const [form, setForm] = useState({
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
  const [nutritionalImage, setNutritionalImage] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);

  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const isEditMode = false; // Mock edit mode variable for JSX validation

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
          : "#737373", // neutral-500
      boxShadow: "none",
      cursor: "pointer",
      alignItems:
        state.hasValue && state.selectProps.isMulti ? "flex-start" : "center",
      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "8px 16px",
      flexWrap: "wrap",
      overflow: "visible",
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: "56px",
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
      color: state.isSelected ? "white" : "#1E1E1D",
      cursor: "pointer",
      fontFamily: "'Open_Sans', sans-serif",
      "&:active": { backgroundColor: "#4B0082", color: "white" },
    }),
    placeholder: (base: any) => ({ ...base, color: "#969793", fontFamily: "'Open_Sans', sans-serif" }),
    singleValue: (base: any) => ({ ...base, color: "#3C3D3A", fontFamily: "'Open_Sans', sans-serif" }),
    multiValue: (base: any) => ({
      ...base,
      margin: "2px",
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
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleRadioChange = (name: string, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleCertCheckbox = (opt: typeof certificationOptions[0]) => {
    const exists = selectedCertifications.some((c) => c.id === opt.value);
    if (exists) {
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

  const getMinExpiryMonth = () => {
    if (!form.manufacturingDate) return "";
    const minDate = new Date(form.manufacturingDate);
    minDate.setMonth(minDate.getMonth() + 3);
    return `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.productName.trim()) e.productName = "Product Name is required";
    if (!form.therapeuticCategory) e.therapeuticCategory = "Therapeutic Category is required";
    if (!form.therapeuticSubcategory) e.therapeuticSubcategory = "Therapeutic Subcategory is required";
    if (!form.brandName.trim()) e.brandName = "Brand Name is required";
    if (!form.dosageForm) e.dosageForm = "Dosage Form is required";
    if (!form.netQuantity.trim()) e.netQuantity = "Net Quantity is required";
    if (!form.strength.trim()) e.strength = "Strength / Composition is required";
    if (!form.activeIngredients.trim()) e.activeIngredients = "Active Ingredients is required";
    if (!form.nutritionalInfoType) e.nutritionalInfoType = "Nutritional Information is required";
    if (form.nutritionalInfoType === "image" && !nutritionalImage) e.nutritionalImage = "Nutritional Image is required";
    if (!form.intendedUse.trim() || form.intendedUse.length < 10) e.intendedUse = "Intended Use must be at least 10 characters";
    if (!form.ageGroup) e.ageGroup = "Age Group is required";
    if (!form.gender) e.gender = "Gender is required";
    if (!form.vegNonVeg) e.vegNonVeg = "Veg / Non-Veg Indicator is required";
    if (!form.allergenInfo.trim() || form.allergenInfo.length < 3) e.allergenInfo = "Allergen Information must be at least 3 characters";
    if (!form.flavour) e.flavour = "Flavour is required";
    if (!form.productClaims.trim()) e.productClaims = "Product Claims is required";
    if (!form.warningsPrecautions.trim()) e.warningsPrecautions = "Warnings / Precautions is required";
    if (!form.productDescription.trim() || form.productDescription.length < 10) e.productDescription = "Product Description must be at least 10 characters";
    if (!form.storageCondition) e.storageCondition = "Storage Condition is required";
    if (!form.manufacturerName.trim()) e.manufacturerName = "Manufacturer Name is required";
    if (!form.countryOfOrigin) e.countryOfOrigin = "Country of Origin is required";

    if (images.length === 0) e.images = "At least one product image is required";
    if (selectedCertifications.length === 0) e.certifications = "At least one certification is required";
    else {
      const missing = selectedCertifications.find((c) => !c.file && !c.existingUrl);
      if (missing) e.certifications = `Please upload the file for "${missing.label}"`;
    }
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = fieldRefs.current[firstKey] || document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setShowSuccess(true);
  };

  const currentSubCategories =
    form.therapeuticCategory && subCategoryOptions[form.therapeuticCategory] ? subCategoryOptions[form.therapeuticCategory] : [];

  return (
    <>
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

      {/* ── Success Toast ──────────────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold [color:#1E1E1D] [font-family:'Open_Sans',sans-serif] mb-2">Product Saved Successfully!</h3>
            <p className="text-sm text-gray-500 mb-6">Your supplement product has been saved.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowSuccess(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Continue Adding</button>
              <button onClick={() => setShowSuccess(false)} style={{ background: "#9F75FC" }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90">Back to Dashboard</button>
            </div>
          </div>
        </div>
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
              />
            </div>
            {/* Therapeutic Category */}
            <div className="flex flex-col gap-1" data-field="therapeuticCategory">
              <label className={fieldLabel}>Therapeutic Category {requiredStar}</label>
              <Select
                options={therapeuticCategoryOptions}
                value={therapeuticCategoryOptions.find(o => o.value === form.therapeuticCategory) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, therapeuticCategory: selected ? selected.value : "", therapeuticSubcategory: "" }));
                  if (errors.therapeuticCategory) setErrors((p) => { const n = { ...p }; delete n.therapeuticCategory; return n; });
                }}
                placeholder="Select category"
                theme={selectTheme}
                styles={selectStyles("therapeuticCategory")}
              />
              {errors.therapeuticCategory && <p className={errorMsg}>{errors.therapeuticCategory}</p>}
            </div>

            {/* ROW 2 */}
            {/* Therapeutic Subcategory */}
            <div className="flex flex-col gap-1" data-field="therapeuticSubcategory">
              <label className={fieldLabel}>Therapeutic Subcategory {requiredStar}</label>
              <Select
                options={currentSubCategories}
                value={currentSubCategories.find(o => o.value === form.therapeuticSubcategory) || null}
                onChange={(selected) => {
                  setForm((p) => ({ ...p, therapeuticSubcategory: selected ? selected.value : "" }));
                  if (errors.therapeuticSubcategory) setErrors((p) => { const n = { ...p }; delete n.therapeuticSubcategory; return n; });
                }}
                placeholder={form.therapeuticCategory ? "Select sub-category" : "Select category first"}
                isDisabled={!form.therapeuticCategory}
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
                placeholder="Select dosage form"
                theme={selectTheme}
                styles={selectStyles("dosageForm")}
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
                placeholder="Select age group"
                theme={selectTheme}
                styles={selectStyles("ageGroup")}
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
            {/* Veg / Non-Veg Indicator */}
            <div data-field="vegNonVeg">
              <Input
                label="Veg / Non-Veg Indicator"
                name="vegNonVeg"
                id="vegNonVeg"
                placeholder="e.g., Veg, Non-Veg"
                onChange={handleChange}
                value={form.vegNonVeg}
                error={errors.vegNonVeg}
                required
              />
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
                placeholder="Select flavour"
                theme={selectTheme}
                styles={selectStyles("flavour")}
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
                placeholder="Select storage condition"
                theme={selectTheme}
                styles={selectStyles("storageCondition")}
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
              />
            </div>

            {/* ROW 11 */}
            {/* Certifications / Compliance */}
            <div className="flex flex-col gap-1" data-field="certifications">
              <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
              <Select
                isMulti
                options={certificationOptions}
                value={certificationOptions.filter(o => selectedCertifications.some(c => c.id === o.value))}
                onChange={(selected: any) => {
                  const newCerts = selected.map((opt: any) => {
                    const existing = selectedCertifications.find(c => c.id === opt.value);
                    if (existing) return existing;
                    return {
                      id: opt.value,
                      label: opt.label,
                      tagCode: certificationOptions.find(c => c.value === opt.value)?.tagCode || opt.label.slice(0, 3).toUpperCase(),
                      isUploaded: false,
                      file: null,
                      fileName: "",
                    };
                  });
                  setSelectedCertifications(newCerts);
                  if (errors.certifications) setErrors(p => { const n = { ...p }; delete n.certifications; return n; });
                }}
                placeholder="Select certifications"
                theme={selectTheme}
                styles={selectStyles("certifications")}
              />
              {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
            </div>
            {/* Upload Certifications / Compliance */}
            <div>
              <UploadInput onFileSelect={(file) => {
                setSelectedCertifications((prev) =>
                  prev.map(c => ({ ...c, file, fileName: file ? file.name : "", isUploaded: !!file }))
                );
              }} />
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
                placeholder="Select country"
                theme={selectTheme}
                styles={selectStyles("countryOfOrigin")}
              />
              {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
            </div>
            {/* Upload Brochure */}
            <div>
              <UploadInput onFileSelect={handleBrochureUpload} />
            </div>

            {/* ROW 13 */}
            {/* Warnings / Precautions */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
              <textarea
                ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
                name="warningsPrecautions"
                value={form.warningsPrecautions}
                onChange={handleChange}
                placeholder="e.g., Not for pregnant women"
                className={`w-full h-36 px-4 rounded-2xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#A3A3A3] resize-none overflow-y-auto border bg-white focus:outline-none focus:ring-0 transition-colors duration-200 ${errors.warningsPrecautions ? "border-[#FF3B3B] focus:border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"}`}
              />
              {errors.warningsPrecautions && <p className={errorMsg}>{errors.warningsPrecautions}</p>}
            </div>
            {/* Product Description */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea
                ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                name="productDescription"
                value={form.productDescription}
                onChange={handleChange}
                placeholder="Provide a detailed description of the product (Min 10 chars)"
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
                options={packTypeOptions}
                value={
                  packTypeOptions.find(
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
                placeholder="Select Pack Type"
                isDisabled={isEditMode}
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
              onChange={handleChange}
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

          {/* Drop Zone */}
          <div
            className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer mt-4"
            onClick={() => document.getElementById("supFileInput")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files); }}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-sm font-medium text-gray-600 text-center">Choose a file or drag &amp; drop it here</div>
              <div className="text-xs text-gray-400 text-center">Click to browse PNG, JPG, and SVG (Min 1, Max 5 images)</div>
            </div>
          </div>

          <input
            id="supFileInput"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/jpg,image/svg+xml"
            className="hidden"
            onChange={(e) => { if (e.target.files) handleImageFiles(e.target.files); }}
          />
          {errors.images && <p className={errorMsg}>{errors.images}</p>}

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
                      onClick={() => { URL.revokeObjectURL(url); setImages((p) => p.filter((_, idx) => idx !== i)); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
