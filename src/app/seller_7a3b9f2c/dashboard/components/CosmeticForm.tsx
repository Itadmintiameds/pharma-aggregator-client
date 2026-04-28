"use client";

import React, { useEffect, useState, useRef } from "react";
import { FileText, X, RefreshCw, AlertCircle } from "lucide-react";

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

const fieldLabel =
  "block mb-1.5 font-semibold text-base leading-[22px] [color:#5A5B58] [font-family:'Open_Sans',sans-serif]";
const requiredStar = <span className="text-red-500 ml-0.5">*</span>;

const inputBase =
  "w-full h-12 px-4 border border-gray-300 rounded-xl text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors bg-white";
const inputError = "border-red-400 focus:border-red-400 focus:ring-red-100";
const errorMsg = "text-red-500 text-xs mt-1";
const sectionCard = "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm";
const sectionTitle =
  "mb-4 pb-3 border-b border-gray-100 text-[28px] [font-family:'Open_Sans',sans-serif] font-semibold leading-8 [color:#1E1E1D]";
const subSectionTitle =
  "mb-3 mt-5 pb-2 border-b border-gray-100 text-[21px] [font-family:'Open_Sans',sans-serif] font-normal leading-6 [color:#1E1E1D]";

// ─── Custom Select ─────────────────────────────────────────────────────────────

interface SimpleSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  errorKey?: string;
  errors?: Record<string, string>;
  isClearable?: boolean;
  disabled?: boolean;
}

const SimpleSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  errorKey = "",
  errors = {},
  isClearable,
  disabled,
}: SimpleSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between bg-white transition-all ${
          disabled ? "cursor-default bg-gray-50" : "cursor-pointer"
        } ${
          errors[errorKey]
            ? "border-red-400"
            : open
            ? "border-purple-600 ring-2 ring-purple-200"
            : "border-gray-300 hover:border-purple-600"
        }`}
      >
        <span
          className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]"
          style={{ color: selected ? "#3C3D3A" : "#969793" }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isClearable && selected && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {open && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`px-4 py-2.5 cursor-pointer text-base [font-family:'Open_Sans',sans-serif] transition-colors ${
                opt.value === value
                  ? "bg-purple-600 text-white"
                  : "text-[#1f2937] hover:bg-purple-50"
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Multi-select Dropdown ─────────────────────────────────────────────────────

interface MultiSelectProps {
  options: SelectOption[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  errorKey?: string;
  errors?: Record<string, string>;
}

const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  errorKey = "",
  errors = {},
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };

  const label = selected.length > 0
    ? selected.map((v) => options.find((o) => o.value === v)?.label).filter(Boolean).join(", ")
    : placeholder;

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen((p) => !p)}
        className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer bg-white transition-all ${
          errors[errorKey]
            ? "border-red-400"
            : open
            ? "border-purple-600 ring-2 ring-purple-200"
            : "border-gray-300 hover:border-purple-600"
        }`}
      >
        <span
          className="truncate pr-2 text-base leading-[22px] [font-family:'Open_Sans',sans-serif]"
          style={{ color: selected.length > 0 ? "#3C3D3A" : "#969793" }}
        >
          {label}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="accent-purple-600 w-4 h-4"
              />
              <span className="text-base [font-family:'Open_Sans',sans-serif] [color:#3C3D3A]">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Upload Icon ───────────────────────────────────────────────────────────────

const UploadCloudIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9F75FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

// ─── Static Options ────────────────────────────────────────────────────────────

const productTypeOptions: SelectOption[] = [
  { value: "skincare", label: "Skincare" },
  { value: "haircare", label: "Haircare" },
  { value: "makeup", label: "Makeup" },
  { value: "fragrance", label: "Fragrance" },
  { value: "bodycare", label: "Body Care" },
  { value: "oral", label: "Oral Care" },
  { value: "eyecare", label: "Eye Care" },
];

const subCategoryOptions: Record<string, SelectOption[]> = {
  skincare: [
    { value: "moisturizer", label: "Moisturizer" },
    { value: "serum", label: "Serum" },
    { value: "cleanser", label: "Cleanser" },
    { value: "toner", label: "Toner" },
    { value: "sunscreen", label: "Sunscreen" },
  ],
  haircare: [
    { value: "shampoo", label: "Shampoo" },
    { value: "conditioner", label: "Conditioner" },
    { value: "hair_oil", label: "Hair Oil" },
    { value: "hair_mask", label: "Hair Mask" },
  ],
  makeup: [
    { value: "foundation", label: "Foundation" },
    { value: "lipstick", label: "Lipstick" },
    { value: "mascara", label: "Mascara" },
    { value: "eyeshadow", label: "Eyeshadow" },
  ],
  fragrance: [
    { value: "perfume", label: "Perfume" },
    { value: "deodorant", label: "Deodorant" },
    { value: "body_mist", label: "Body Mist" },
  ],
  bodycare: [
    { value: "body_lotion", label: "Body Lotion" },
    { value: "body_wash", label: "Body Wash" },
    { value: "scrub", label: "Scrub" },
  ],
  oral: [
    { value: "toothpaste", label: "Toothpaste" },
    { value: "mouthwash", label: "Mouthwash" },
    { value: "toothbrush", label: "Toothbrush" },
  ],
  eyecare: [
    { value: "eye_drops", label: "Eye Drops" },
    { value: "eye_cream", label: "Eye Cream" },
  ],
};

const skinTypeOptions: SelectOption[] = [
  { value: "normal", label: "Normal" },
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
  { value: "all", label: "All Skin Types" },
];

const formulationOptions: SelectOption[] = [
  { value: "cream", label: "Cream" },
  { value: "gel", label: "Gel" },
  { value: "lotion", label: "Lotion" },
  { value: "serum", label: "Serum" },
  { value: "oil", label: "Oil" },
  { value: "foam", label: "Foam" },
  { value: "powder", label: "Powder" },
  { value: "spray", label: "Spray" },
  { value: "stick", label: "Stick" },
  { value: "sheet_mask", label: "Sheet Mask" },
];

const packTypeOptions: SelectOption[] = [
  { value: "tube", label: "Tube" },
  { value: "bottle", label: "Bottle" },
  { value: "jar", label: "Jar" },
  { value: "pump", label: "Pump Bottle" },
  { value: "sachet", label: "Sachet" },
  { value: "ampoule", label: "Ampoule" },
  { value: "stick_pack", label: "Stick Pack" },
];

const countryOptions: SelectOption[] = [
  { value: "1", label: "India" },
  { value: "2", label: "United States" },
  { value: "3", label: "France" },
  { value: "4", label: "South Korea" },
  { value: "5", label: "Germany" },
  { value: "6", label: "Japan" },
  { value: "7", label: "United Kingdom" },
];

const storageOptions: SelectOption[] = [
  { value: "1", label: "Cool & Dry Place" },
  { value: "2", label: "Room Temperature" },
  { value: "3", label: "Refrigerate (2–8°C)" },
  { value: "4", label: "Avoid Direct Sunlight" },
  { value: "5", label: "Below 25°C" },
];

const gstOptions: SelectOption[] = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

const certificationOptions = [
  { value: "1", label: "CDSCO License", tagCode: "CDSCO" },
  { value: "2", label: "ISO 22716 (GMP)", tagCode: "Tag 02" },
  { value: "3", label: "ECOCERT / Organic", tagCode: "Tag 03" },
  { value: "4", label: "Cruelty-Free Certified", tagCode: "Tag 04" },
  { value: "5", label: "Dermatologically Tested", tagCode: "Tag 05" },
];

const ingredientHighlightOptions: SelectOption[] = [
  { value: "hyaluronic_acid", label: "Hyaluronic Acid" },
  { value: "niacinamide", label: "Niacinamide" },
  { value: "retinol", label: "Retinol" },
  { value: "vitamin_c", label: "Vitamin C" },
  { value: "aha_bha", label: "AHA/BHA" },
  { value: "ceramide", label: "Ceramide" },
  { value: "peptide", label: "Peptide" },
  { value: "collagen", label: "Collagen" },
  { value: "aloe_vera", label: "Aloe Vera" },
  { value: "argan_oil", label: "Argan Oil" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const CosmeticForm = () => {
  const todayStr = new Date().toISOString().split("T")[0];

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const setFieldRef =
    (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const [form, setForm] = useState({
    productName: "",
    brandName: "",
    productType: "",
    subCategory: "",
    formulation: "",
    skinType: "",
    countryOfOrigin: "",
    manufacturerName: "",
    storageCondition: "",
    batchNumber: "",
    productDescription: "",
    ingredients: "",
    keyBenefits: "",
    usageDirections: "",
    warningsPrecautions: "",
    productMarketingUrl: "",
    packType: "",
    netContent: "",
    unitOfMeasure: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    manufacturingDate: "",
    expiryDate: "",
    stockQuantity: "",
    sellingPrice: "",
    mrp: "",
    discountPercentage: "",
    finalPrice: "",
    gstPercentage: "",
    hsnCode: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const brochureInputRef = useRef<HTMLInputElement>(null);
  const certDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-compute pack size
  useEffect(() => {
    const net = parseFloat(form.netContent);
    const packs = parseFloat(form.numberOfPacks);
    if (!isNaN(net) && !isNaN(packs) && net > 0 && packs > 0) {
      setForm((p) => ({ ...p, packSize: (net * packs).toFixed(2) }));
    }
  }, [form.netContent, form.numberOfPacks]);

  // Auto-compute final price
  useEffect(() => {
    const s = parseFloat(form.sellingPrice);
    const d = parseFloat(form.discountPercentage);
    setForm((p) => ({
      ...p,
      finalPrice: !isNaN(s) && s > 0 ? (isNaN(d) ? s : s - (s * d) / 100).toFixed(2) : "",
    }));
  }, [form.sellingPrice, form.discountPercentage]);

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
    const numericFields = [
      "netContent", "numberOfPacks", "minimumOrderQuantity", "maximumOrderQuantity",
      "stockQuantity", "sellingPrice", "mrp", "discountPercentage", "hsnCode",
    ];
    if (numericFields.includes(name) && value !== "" && !/^\d*\.?\d*$/.test(value)) return;
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

  const handleBrochureUpload = (file: File) => {
    if (file.type !== "application/pdf") { alert("Only PDF files are allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File size must be less than 5 MB"); return; }
    setBrochureFile(file);
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.productName.trim()) e.productName = "Product name is required";
    if (!form.brandName.trim()) e.brandName = "Brand name is required";
    if (!form.productType) e.productType = "Product type is required";
    if (!form.subCategory) e.subCategory = "Sub-category is required";
    if (!form.formulation) e.formulation = "Formulation type is required";
    if (!form.manufacturerName.trim()) e.manufacturerName = "Manufacturer name is required";
    if (!form.countryOfOrigin) e.countryOfOrigin = "Country of origin is required";
    if (!form.productDescription.trim()) e.productDescription = "Product description is required";
    if (!form.ingredients.trim()) e.ingredients = "Ingredients list is required";
    if (!form.keyBenefits.trim()) e.keyBenefits = "Key benefits are required";
    if (!form.usageDirections.trim()) e.usageDirections = "Usage directions are required";
    if (!form.warningsPrecautions.trim()) e.warningsPrecautions = "Warnings / precautions are required";
    if (!form.packType) e.packType = "Pack type is required";
    if (!form.netContent.trim()) e.netContent = "Net content is required";
    if (!form.numberOfPacks.trim()) e.numberOfPacks = "Number of packs is required";
    if (!form.minimumOrderQuantity.trim()) e.minimumOrderQuantity = "Min order quantity is required";
    if (!form.maximumOrderQuantity.trim()) e.maximumOrderQuantity = "Max order quantity is required";
    if (!form.stockQuantity.trim()) e.stockQuantity = "Stock quantity is required";
    if (!form.sellingPrice.trim()) e.sellingPrice = "Selling price is required";
    if (!form.mrp.trim()) e.mrp = "MRP is required";
    if (!form.gstPercentage) e.gstPercentage = "GST is required";
    if (!form.hsnCode.trim()) e.hsnCode = "HSN code is required";
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
    form.productType && subCategoryOptions[form.productType] ? subCategoryOptions[form.productType] : [];

  return (
    <>
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
            <p className="text-sm text-gray-500 mb-6">Your cosmetic product has been saved and is now live.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowSuccess(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Continue Adding</button>
              <button onClick={() => setShowSuccess(false)} style={{ background: "#9F75FC" }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90">Back to Dashboard</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 w-full">

        {/* ── Section 1: Product Details ──────────────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Product Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* Product Name */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Product Name {requiredStar}</label>
              <input
                ref={setFieldRef("productName") as React.RefCallback<HTMLInputElement>}
                name="productName"
                value={form.productName}
                onChange={handleChange}
                placeholder="e.g., Hydrating Face Serum"
                className={`${inputBase} ${errors.productName ? inputError : ""}`}
              />
              {errors.productName && <p className={errorMsg}>{errors.productName}</p>}
            </div>

            {/* Brand Name */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Brand Name {requiredStar}</label>
              <input
                ref={setFieldRef("brandName") as React.RefCallback<HTMLInputElement>}
                name="brandName"
                value={form.brandName}
                onChange={handleChange}
                placeholder="e.g., Lakme, Neutrogena"
                className={`${inputBase} ${errors.brandName ? inputError : ""}`}
              />
              {errors.brandName && <p className={errorMsg}>{errors.brandName}</p>}
            </div>

            {/* Product Type */}
            <div className="flex flex-col gap-1" data-field="productType">
              <label className={fieldLabel}>Product Type {requiredStar}</label>
              <SimpleSelect
                options={productTypeOptions}
                value={form.productType}
                onChange={(val) => {
                  setForm((p) => ({ ...p, productType: val, subCategory: "" }));
                  if (errors.productType) setErrors((p) => { const n = { ...p }; delete n.productType; return n; });
                }}
                placeholder="Select product type"
                errorKey="productType"
                errors={errors}
              />
              {errors.productType && <p className={errorMsg}>{errors.productType}</p>}
            </div>

            {/* Sub-Category */}
            <div className="flex flex-col gap-1" data-field="subCategory">
              <label className={fieldLabel}>Sub-Category {requiredStar}</label>
              <SimpleSelect
                options={currentSubCategories}
                value={form.subCategory}
                onChange={(val) => {
                  setForm((p) => ({ ...p, subCategory: val }));
                  if (errors.subCategory) setErrors((p) => { const n = { ...p }; delete n.subCategory; return n; });
                }}
                placeholder={form.productType ? "Select sub-category" : "Select product type first"}
                errorKey="subCategory"
                errors={errors}
                disabled={!form.productType}
              />
              {errors.subCategory && <p className={errorMsg}>{errors.subCategory}</p>}
            </div>

            {/* Formulation Type */}
            <div className="flex flex-col gap-1" data-field="formulation">
              <label className={fieldLabel}>Formulation Type {requiredStar}</label>
              <SimpleSelect
                options={formulationOptions}
                value={form.formulation}
                onChange={(val) => {
                  setForm((p) => ({ ...p, formulation: val }));
                  if (errors.formulation) setErrors((p) => { const n = { ...p }; delete n.formulation; return n; });
                }}
                placeholder="Select formulation type"
                errorKey="formulation"
                errors={errors}
              />
              {errors.formulation && <p className={errorMsg}>{errors.formulation}</p>}
            </div>

            {/* Skin / Hair Type */}
            <div className="flex flex-col gap-1" data-field="skinType">
              <label className={fieldLabel}>Suitable Skin / Hair Type</label>
              <MultiSelectDropdown
                options={skinTypeOptions}
                selected={selectedSkinTypes}
                onChange={setSelectedSkinTypes}
                placeholder="Select skin / hair type(s)"
              />
            </div>

            {/* Country of Origin */}
            <div className="flex flex-col gap-1" data-field="countryOfOrigin">
              <label className={fieldLabel}>Country of Origin {requiredStar}</label>
              <SimpleSelect
                options={countryOptions}
                value={form.countryOfOrigin}
                onChange={(val) => {
                  setForm((p) => ({ ...p, countryOfOrigin: val }));
                  if (errors.countryOfOrigin) setErrors((p) => { const n = { ...p }; delete n.countryOfOrigin; return n; });
                }}
                placeholder="Select country"
                errorKey="countryOfOrigin"
                errors={errors}
              />
              {errors.countryOfOrigin && <p className={errorMsg}>{errors.countryOfOrigin}</p>}
            </div>

            {/* Manufacturer Name */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Manufacturer Name {requiredStar}</label>
              <input
                ref={setFieldRef("manufacturerName") as React.RefCallback<HTMLInputElement>}
                name="manufacturerName"
                value={form.manufacturerName}
                onChange={handleChange}
                placeholder="Manufacturer company name"
                className={`${inputBase} ${errors.manufacturerName ? inputError : ""}`}
              />
              {errors.manufacturerName && <p className={errorMsg}>{errors.manufacturerName}</p>}
            </div>

            {/* Storage Condition */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Storage Condition</label>
              <SimpleSelect
                options={storageOptions}
                value={form.storageCondition}
                onChange={(val) => setForm((p) => ({ ...p, storageCondition: val }))}
                placeholder="Select storage condition"
                isClearable
              />
            </div>

            {/* Marketing URL */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Product Marketing URL</label>
              <input
                name="productMarketingUrl"
                value={form.productMarketingUrl}
                onChange={handleChange}
                placeholder="https://..."
                className={inputBase}
              />
            </div>

            {/* Ingredient Highlights */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className={fieldLabel}>Key Ingredient Highlights</label>
              <MultiSelectDropdown
                options={ingredientHighlightOptions}
                selected={selectedIngredients}
                onChange={setSelectedIngredients}
                placeholder="Select key ingredients"
              />
            </div>

            {/* Certifications */}
            <div className="col-span-1 md:col-span-2" data-field="certifications">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Cert Selector */}
                <div>
                  <label className={fieldLabel}>Certifications / Compliance {requiredStar}</label>
                  <div className="relative" ref={certDropdownRef}>
                    <div
                      onClick={() => setShowCertDropdown((p) => !p)}
                      className={`w-full h-12 px-4 border rounded-xl flex items-center justify-between cursor-pointer bg-white transition-all ${
                        errors.certifications ? "border-red-400" : "border-gray-300 hover:border-purple-600"
                      }`}
                    >
                      <span
                        className="truncate pr-2 text-base [font-family:'Open_Sans',sans-serif]"
                        style={{ color: selectedCertifications.length > 0 ? "#3C3D3A" : "#969793" }}
                      >
                        {selectedCertifications.length > 0
                          ? selectedCertifications.map((c) => c.label).join(", ")
                          : "Select certifications"}
                      </span>
                      <svg
                        className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${showCertDropdown ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {showCertDropdown && (
                      <div className="absolute z-20 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {certificationOptions.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCertifications.some((c) => c.id === opt.value)}
                              onChange={() => handleCertCheckbox(opt)}
                              className="accent-purple-600 w-4 h-4"
                            />
                            <span className="text-base [font-family:'Open_Sans',sans-serif] [color:#3C3D3A]">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.certifications && <p className={errorMsg}>{errors.certifications}</p>}
                </div>

                {/* Cert Upload */}
                <div>
                  <label className={fieldLabel}>Upload Certificate Documents {requiredStar}</label>
                  {selectedCertifications.length === 0 ? (
                    <div className="w-full border border-gray-200 rounded-xl flex items-center h-12 overflow-hidden bg-gray-50">
                      <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <UploadCloudIcon />
                      </div>
                      <span className="[color:#969793] text-base [font-family:'Open_Sans',sans-serif] px-3">
                        Select certifications first
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedCertifications.map((cert) => (
                        <div key={cert.id}>
                          {cert.isUploaded && cert.file ? (
                            <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50">
                              <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <FileText size={16} className="text-purple-600" />
                              </div>
                              <div className="px-2 flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-200 text-purple-800 text-xs font-semibold">
                                  {cert.tagCode}
                                </span>
                              </div>
                              <div className="flex-1 px-2 min-w-0">
                                <p className="text-sm font-medium [color:#3C3D3A] truncate">{cert.fileName}</p>
                                <p className="text-xs text-gray-500">{cert.file ? `${(cert.file.size / 1024).toFixed(0)} KB` : ""}</p>
                              </div>
                              <div className="flex items-center gap-1 pr-3">
                                <button type="button" onClick={() => document.getElementById(`cert-upload-${cert.id}`)?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600"><RefreshCw size={13} /></button>
                                <button type="button" onClick={() => setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id))} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><X size={13} /></button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                              onClick={() => document.getElementById(`cert-upload-${cert.id}`)?.click()}
                            >
                              <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <UploadCloudIcon />
                              </div>
                              <div className="px-2 flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold">
                                  {cert.tagCode}
                                </span>
                              </div>
                              <span className="px-2 text-sm [font-family:'Open_Sans',sans-serif] [color:#969793] truncate flex-1">
                                {cert.label} — click to upload
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedCertifications((p) => p.filter((c) => c.id !== cert.id)); }}
                                className="pr-3 text-gray-400 hover:text-red-500"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )}
                          <input
                            id={`cert-upload-${cert.id}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCertFileSelect(cert.id, file); }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 5 MB per file.</p>
                </div>
              </div>
            </div>

            {/* Brochure */}
            <div>
              <label className={fieldLabel}>Upload Safety Data Sheet / Brochure</label>
              {!brochureFile ? (
                <div
                  className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => brochureInputRef.current?.click()}
                >
                  <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <UploadCloudIcon />
                  </div>
                  <span className="px-3 text-base [font-family:'Open_Sans',sans-serif] [color:#969793]">
                    Upload PDF (max 5 MB)
                  </span>
                </div>
              ) : (
                <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden h-12 bg-purple-50">
                  <div className="w-11 h-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1 px-3 min-w-0">
                    <p className="text-sm font-medium [color:#3C3D3A] truncate">{brochureFile.name}</p>
                    <p className="text-xs text-gray-500">{(brochureFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex items-center gap-1 pr-3">
                    <button type="button" onClick={() => brochureInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-purple-200 text-purple-600"><RefreshCw size={13} /></button>
                    <button type="button" onClick={() => { setBrochureFile(null); if (brochureInputRef.current) brochureInputRef.current.value = ""; }} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><X size={13} /></button>
                  </div>
                </div>
              )}
              <input ref={brochureInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleBrochureUpload(e.target.files[0]); }} />
            </div>

            {/* Textareas */}
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={fieldLabel}>Ingredients (INCI List) {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("ingredients") as React.RefCallback<HTMLTextAreaElement>}
                    name="ingredients"
                    value={form.ingredients}
                    onChange={handleChange}
                    rows={4}
                    placeholder="List all ingredients in INCI format"
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.ingredients ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.ingredients && <p className={errorMsg}>{errors.ingredients}</p>}
                </div>
                <div>
                  <label className={fieldLabel}>Key Benefits {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("keyBenefits") as React.RefCallback<HTMLTextAreaElement>}
                    name="keyBenefits"
                    value={form.keyBenefits}
                    onChange={handleChange}
                    rows={4}
                    placeholder="e.g., Deep hydration, brightening, anti-aging..."
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.keyBenefits ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.keyBenefits && <p className={errorMsg}>{errors.keyBenefits}</p>}
                </div>
                <div>
                  <label className={fieldLabel}>How to Use / Usage Directions {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("usageDirections") as React.RefCallback<HTMLTextAreaElement>}
                    name="usageDirections"
                    value={form.usageDirections}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Step-by-step application instructions"
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.usageDirections ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.usageDirections && <p className={errorMsg}>{errors.usageDirections}</p>}
                </div>
                <div>
                  <label className={fieldLabel}>Warnings / Precautions {requiredStar}</label>
                  <textarea
                    ref={setFieldRef("warningsPrecautions") as React.RefCallback<HTMLTextAreaElement>}
                    name="warningsPrecautions"
                    value={form.warningsPrecautions}
                    onChange={handleChange}
                    rows={4}
                    placeholder="e.g., For external use only. Avoid contact with eyes..."
                    className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.warningsPrecautions ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.warningsPrecautions && <p className={errorMsg}>{errors.warningsPrecautions}</p>}
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="col-span-1 md:col-span-2">
              <label className={fieldLabel}>Product Description {requiredStar}</label>
              <textarea
                ref={setFieldRef("productDescription") as React.RefCallback<HTMLTextAreaElement>}
                name="productDescription"
                value={form.productDescription}
                onChange={handleChange}
                rows={4}
                placeholder="Detailed product description (max 1000 characters)"
                maxLength={1000}
                className={`w-full rounded-xl p-3 text-base [font-family:'Open_Sans',sans-serif] font-normal leading-[22px] [color:#3C3D3A] placeholder:[color:#969793] resize-none border bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 transition-colors ${errors.productDescription ? "border-red-400" : "border-gray-300"}`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.productDescription ? <p className={errorMsg}>{errors.productDescription}</p> : <span />}
                <span className="text-xs text-gray-400">{form.productDescription.length}/1000</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Packaging & Order Details ──────────────────────────────── */}
        <div className={sectionCard}>
          <h2 className={sectionTitle}>Packaging &amp; Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            {/* Pack Type */}
            <div className="flex flex-col gap-1" data-field="packType">
              <label className={fieldLabel}>Pack Type {requiredStar}</label>
              <SimpleSelect
                options={packTypeOptions}
                value={form.packType}
                onChange={(val) => {
                  setForm((p) => ({ ...p, packType: val }));
                  if (errors.packType) setErrors((p) => { const n = { ...p }; delete n.packType; return n; });
                }}
                placeholder="Select pack type"
                errorKey="packType"
                errors={errors}
              />
              {errors.packType && <p className={errorMsg}>{errors.packType}</p>}
            </div>

            {/* Net Content */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Net Content (ml / g) {requiredStar}</label>
              <div className="flex gap-2">
                <input
                  ref={setFieldRef("netContent") as React.RefCallback<HTMLInputElement>}
                  name="netContent"
                  value={form.netContent}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                  inputMode="decimal"
                  className={`${inputBase} ${errors.netContent ? inputError : ""}`}
                />
                <SimpleSelect
                  options={[
                    { value: "ml", label: "ml" },
                    { value: "g", label: "g" },
                    { value: "oz", label: "oz" },
                    { value: "fl oz", label: "fl oz" },
                  ]}
                  value={form.unitOfMeasure}
                  onChange={(val) => setForm((p) => ({ ...p, unitOfMeasure: val }))}
                  placeholder="Unit"
                />
              </div>
              {errors.netContent && <p className={errorMsg}>{errors.netContent}</p>}
            </div>

            {/* Number of Packs */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Number of Packs {requiredStar}</label>
              <input
                ref={setFieldRef("numberOfPacks") as React.RefCallback<HTMLInputElement>}
                name="numberOfPacks"
                value={form.numberOfPacks}
                onChange={handleChange}
                placeholder="e.g., 1"
                inputMode="numeric"
                className={`${inputBase} ${errors.numberOfPacks ? inputError : ""}`}
              />
              {errors.numberOfPacks && <p className={errorMsg}>{errors.numberOfPacks}</p>}
            </div>

            {/* Pack Size (auto) */}
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Pack Size (Net Content × No. of Packs)</label>
              <input
                name="packSize"
                value={form.packSize}
                readOnly
                className={`${inputBase} bg-gray-50 [color:#969793] cursor-not-allowed`}
              />
            </div>
          </div>

          <p className={subSectionTitle}>Order Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Min Order Qty {requiredStar}</label>
              <input
                ref={setFieldRef("minimumOrderQuantity") as React.RefCallback<HTMLInputElement>}
                name="minimumOrderQuantity"
                value={form.minimumOrderQuantity}
                onChange={handleChange}
                placeholder="e.g., 1"
                inputMode="numeric"
                className={`${inputBase} ${errors.minimumOrderQuantity ? inputError : ""}`}
              />
              {errors.minimumOrderQuantity && <p className={errorMsg}>{errors.minimumOrderQuantity}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Max Order Qty {requiredStar}</label>
              <input
                ref={setFieldRef("maximumOrderQuantity") as React.RefCallback<HTMLInputElement>}
                name="maximumOrderQuantity"
                value={form.maximumOrderQuantity}
                onChange={handleChange}
                placeholder="e.g., 100"
                inputMode="numeric"
                className={`${inputBase} ${errors.maximumOrderQuantity ? inputError : ""}`}
              />
              {errors.maximumOrderQuantity && <p className={errorMsg}>{errors.maximumOrderQuantity}</p>}
            </div>
          </div>

          <p className={subSectionTitle}>Batch Management</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Batch / Lot Number</label>
              <input
                name="batchNumber"
                value={form.batchNumber}
                onChange={handleChange}
                placeholder="e.g., BAT2024001"
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Manufacturing Date</label>
              <input
                name="manufacturingDate"
                type="date"
                max={todayStr}
                value={form.manufacturingDate}
                onChange={handleChange}
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Expiry Date</label>
              <input
                name="expiryDate"
                type="date"
                min={todayStr}
                value={form.expiryDate}
                onChange={handleChange}
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Stock Quantity (units) {requiredStar}</label>
              <input
                ref={setFieldRef("stockQuantity") as React.RefCallback<HTMLInputElement>}
                name="stockQuantity"
                value={form.stockQuantity}
                onChange={handleChange}
                placeholder="e.g., 200"
                inputMode="numeric"
                className={`${inputBase} ${errors.stockQuantity ? inputError : ""}`}
              />
              {errors.stockQuantity && <p className={errorMsg}>{errors.stockQuantity}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Date of Stock Entry {requiredStar}</label>
              <input
                type="date"
                value={todayStr}
                readOnly
                className={`${inputBase} bg-gray-50 [color:#969793] cursor-not-allowed`}
              />
            </div>
          </div>

          <p className={subSectionTitle}>Pricing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Selling Price (per Pack) {requiredStar}</label>
              <input
                ref={setFieldRef("sellingPrice") as React.RefCallback<HTMLInputElement>}
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="e.g., 499"
                inputMode="decimal"
                className={`${inputBase} ${errors.sellingPrice ? inputError : ""}`}
              />
              {errors.sellingPrice && <p className={errorMsg}>{errors.sellingPrice}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>MRP (per Pack) {requiredStar}</label>
              <input
                ref={setFieldRef("mrp") as React.RefCallback<HTMLInputElement>}
                name="mrp"
                value={form.mrp}
                onChange={handleChange}
                placeholder="e.g., 599"
                inputMode="decimal"
                className={`${inputBase} ${errors.mrp ? inputError : ""}`}
              />
              {errors.mrp && <p className={errorMsg}>{errors.mrp}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Discount Percentage (%)</label>
              <input
                name="discountPercentage"
                value={form.discountPercentage}
                onChange={handleChange}
                placeholder="0–100"
                inputMode="decimal"
                className={`${inputBase} ${errors.discountPercentage ? inputError : ""}`}
              />
              {errors.discountPercentage && <p className={errorMsg}>{errors.discountPercentage}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Final Price (Auto-calculated)</label>
              <input
                name="finalPrice"
                value={form.finalPrice}
                readOnly
                className={`${inputBase} bg-gray-50 [color:#969793] cursor-not-allowed`}
              />
            </div>
          </div>

          <p className={subSectionTitle}>TAX &amp; BILLING</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="flex flex-col gap-1" data-field="gstPercentage">
              <label className={fieldLabel}>GST % {requiredStar}</label>
              <SimpleSelect
                options={gstOptions}
                value={form.gstPercentage}
                onChange={(val) => {
                  setForm((p) => ({ ...p, gstPercentage: val }));
                  if (errors.gstPercentage) setErrors((p) => { const n = { ...p }; delete n.gstPercentage; return n; });
                }}
                placeholder="Select GST %"
                errorKey="gstPercentage"
                errors={errors}
              />
              {errors.gstPercentage && <p className={errorMsg}>{errors.gstPercentage}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>HSN Code {requiredStar}</label>
              <input
                ref={setFieldRef("hsnCode") as React.RefCallback<HTMLInputElement>}
                name="hsnCode"
                type="text"
                value={form.hsnCode}
                onChange={handleChange}
                placeholder="4, 6, or 8 digit numeric code"
                maxLength={8}
                inputMode="numeric"
                className={`${inputBase} ${errors.hsnCode ? inputError : ""}`}
              />
              {errors.hsnCode && <p className={errorMsg}>{errors.hsnCode}</p>}
            </div>
          </div>

          {/* Save inside pricing section */}
          <div className="flex justify-end mt-5">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: "#9F75FC", borderRadius: "8px" }}
              className="px-8 py-3 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* ── Section 3: Product Photos ──────────────────────────────────────────── */}
        <div
          className={sectionCard}
          ref={setFieldRef("images") as React.RefCallback<HTMLDivElement>}
          data-field="images"
        >
          <h2 className="text-[14px] [font-family:'Open_Sans',sans-serif] font-semibold leading-8 [color:#1E1E1D] mb-1">
            Product Photos <span className="text-red-500">*</span>
          </h2>

          {/* Drop Zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
            onClick={() => document.getElementById("cosFileInput")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files); }}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <div className="w-12 h-12 flex items-center justify-center">
        <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 object-contain" />
      </div>
              </div>
              <div className="text-sm font-medium text-gray-600 text-center">Choose a file or drag &amp; drop it here</div>
              <div className="text-xs text-gray-400 text-center">Click to browse PNG, JPG, and SVG (max 5 images)</div>
            </div>
          </div>

          <input
            id="cosFileInput"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/jpg,image/svg+xml"
            className="hidden"
            onChange={(e) => { if (e.target.files) handleImageFiles(e.target.files); }}
          />

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

          {errors.images && <p className={`${errorMsg} mt-2`}>{errors.images}</p>}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 pb-8">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 border-2 border-red-400 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              style={{ background: "#9F75FC", borderRadius: "8px" }}
              className="px-5 py-3 text-white text-base [font-family:'Open_Sans',sans-serif] font-semibold leading-[22px] flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path d="M4 10h12M10 4v12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Save Draft
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ background: "#4B0082", borderRadius: "8px" }}
            className="px-8 py-3 text-white font-semibold text-base [font-family:'Open_Sans',sans-serif] leading-[22px] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CosmeticForm;