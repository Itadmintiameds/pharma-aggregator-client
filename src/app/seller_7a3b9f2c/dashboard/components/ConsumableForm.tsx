"use client";

import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import Input from "@/src/app/commonComponents/Input";
import { consumableDeviceSchema } from "@/src/schema/product/ConsumableDeviceSchema";
import Image from "next/image";
import Drawer from "@/src/app/commonComponents/Drawer";
import AdditionalDiscount from "./AdditionalDiscount";
import VariantList from "./VariantList";

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
}

const ConsumableForm = () => {
  const [form, setForm] = useState({
    // Product Details
    productId: "",
    productName: "",
    deviceCategoryId: "",
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
    
    // Brochure/Manual
    brochureType: "pdf",
    brochureUrl: "",
    
    // Packaging Details
    packType: "",
    unitsPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",
    
    // Batch Management
    batchLotNumber: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    stockQuantity: "",
    dateOfStockEntry: new Date(),
    
    // Pricing
    mrp: "",
    sellingPricePerPack: "",
    discountPercentage: "",
    additionalDiscountName: "",
additionalDiscountValue: "",
    
    // Tax & Billing
    gstPercentage: "",
    hsnCode: "",
    finalPrice: "",
  });

  // Certification options for dropdown with tags
  const certificationOptions = [
    { value: "cdsco", label: "CDSCO Registration Number", tagCode: "Tag 01" },
    { value: "import", label: "Import License Number", tagCode: "Tag 02" },
    { value: "iso", label: "ISO 13485", tagCode: "Tag 03" },
    { value: "ce", label: "CE Certification", tagCode: "Tag 04" },
    { value: "bis", label: "BIS Certification", tagCode: "Tag 05" },
  ];

  // Material Type options
  const materialTypeOptions = [
    { value: "latex", label: "Latex" },
    { value: "latex-free", label: "Latex-Free" },
    { value: "nitrile", label: "Nitrile" },
    { value: "vinyl", label: "Vinyl" },
    { value: "plastic", label: "Plastic" },
    { value: "non-woven", label: "Non-woven Fabric" },
    { value: "stainless-steel", label: "Stainless Steel" },
    { value: "rubber", label: "Rubber" },
    { value: "glass", label: "Glass" },
    { value: "silicone", label: "Silicone" },
  ];

  // Storage Condition options
  const storageConditionOptions = [
    { value: "room-temperature", label: "Room Temperature" },
    { value: "cold-dry", label: "Cold & Dry Place" },
    { value: "refrigerated", label: "Refrigerated" },
    { value: "sterile-storage", label: "Sterile Storage" },
    { value: "avoid-sunlight", label: "Avoid Sunlight" },
  ];

  // Pack Type options
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

  // GST options
  const gstOptions = [
    { value: "0", label: "0%" },
    { value: "5", label: "5%" },
    { value: "12", label: "12%" },
    { value: "18", label: "18%" },
  ];

  // Selected certifications from dropdown
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [showDiscountDrawer, setShowDiscountDrawer] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const materialDropdownRef = useRef<HTMLDivElement>(null);

  // Sterile options
  const sterileOptions = [
    { value: "sterile", label: "Sterile" },
    { value: "non-sterile", label: "Non-Sterile" },
  ];

  // Disposable/Reusable options
  const disposableOptions = [
    { value: "disposable", label: "Disposable" },
    { value: "reusable", label: "Reusable" },
  ];

  // Device Class options
  const deviceClassOptions = [
    { value: "A", label: "Class A" },
    { value: "B", label: "Class B" },
    { value: "C", label: "Class C" },
    { value: "D", label: "Class D" },
  ];

  // Device Category options
  const deviceCategories = [
    { value: "syringe", label: "Syringe" },
    { value: "gloves", label: "Gloves" },
    { value: "mask", label: "Face Mask" },
    { value: "bandage", label: "Bandage" },
    { value: "test-strip", label: "Test Strip" },
    { value: "catheter", label: "Catheter" },
    { value: "iVSet", label: "IV Set" },
    { value: "cottonRoll", label: "Cotton Roll" },
    { value: "alcoholSwab", label: "Alcohol Swab" },
    { value: "surgicalBlade", label: "Surgical Blade" },
    { value: "gauze", label: "Gauze Swab" },
    { value: "swab", label: "Swab" },
    { value: "nebulizerKit", label: "Nebulizer Kit" },
    { value: "Lancet", label: "Lancet" },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCertDropdown(false);
      }
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(event.target as Node)) {
        setShowMaterialDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDeviceCategories = async () => {
      setLoadingCategories(true);
      try {
        setDeviceCategoryOptions(deviceCategories);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchDeviceCategories();
  }, []);

  const handleAddVariant = () => {
  // later you can open drawer/modal
  console.log("Add variant clicked");
};

const handleEditVariant = (variant: any) => {
  console.log("Edit:", variant);
};

const handleDeleteVariant = (id: string) => {
  setVariants((prev) => prev.filter((v) => v.id !== id));
};

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      setSelectedCertifications(prev => [
        ...prev,
        {
          id: option.value,
          label: option.label,
          tagCode: option.tagCode,
          file: null,
          fileName: "",
          uploading: false,
          isUploaded: false,
        },
      ]);
    }
  };

  const handleMaterialCheckboxChange = (option: typeof materialTypeOptions[0]) => {
    const isChecked = selectedMaterialTypes.includes(option.value);
    
    if (isChecked) {
      setSelectedMaterialTypes(prev => prev.filter(v => v !== option.value));
      // Update form value with comma-separated selected materials
      const updatedMaterials = selectedMaterialTypes.filter(v => v !== option.value);
      setForm({ ...form, materialType: updatedMaterials.join(", ") });
    } else {
      setSelectedMaterialTypes(prev => [...prev, option.value]);
      const updatedMaterials = [...selectedMaterialTypes, option.value];
      setForm({ ...form, materialType: updatedMaterials.join(", ") });
    }
  };

  const handleTagClick = (certId: string) => {
    const inputElement = document.getElementById(`cert-upload-${certId}`);
    if (inputElement) {
      inputElement.click();
    }
  };

  const handleRemoveTag = (certId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCertifications(prev => prev.filter(cert => cert.id !== certId));
  };

  const handleCertificationFileUpload = async (certId: string, file: File) => {
    setSelectedCertifications(prev => 
      prev.map(cert => 
        cert.id === certId 
          ? { ...cert, uploading: true }
          : cert
      )
    );
    
    setTimeout(() => {
      setSelectedCertifications(prev => 
        prev.map(cert => 
          cert.id === certId 
            ? { ...cert, file, fileName: file.name, uploading: false, isUploaded: true }
            : cert
        )
      );
    }, 1000);
  };

  const handleBrochureUpload = async (file: File) => {
    setUploadingBrochure(true);
    setTimeout(() => {
      setBrochureFile(file);
      setUploadingBrochure(false);
    }, 1000);
  };

  const calculatePackSize = () => {
    const units = parseFloat(form.unitsPerPack);
    const packs = parseFloat(form.numberOfPacks);
    if (!isNaN(units) && !isNaN(packs)) {
      const calculated = units * packs;
      setForm({ ...form, packSize: calculated.toString() });
    }
  };

  const calculateFinalPrice = () => {
    const mrpValue = parseFloat(form.mrp);
    const discountValue = parseFloat(form.discountPercentage);
    const sellingPrice = parseFloat(form.sellingPricePerPack);

    if (isNaN(mrpValue) || isNaN(sellingPrice)) return "0.00";

    let price = sellingPrice;
    
    if (!isNaN(discountValue)) {
      price = price - (price * discountValue) / 100;
    }
    
    return price.toFixed(2);
  };

  useEffect(() => {
    calculatePackSize();
  }, [form.unitsPerPack, form.numberOfPacks]);

  useEffect(() => {
    const finalPrice = calculateFinalPrice();
    setForm((prev) => ({ ...prev, finalPrice }));
  }, [form.mrp, form.sellingPricePerPack, form.discountPercentage]);

  const handleSubmit = async () => {
    const validation = consumableDeviceSchema.safeParse(form);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const fieldName = err.path.join(".");
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    
    try {
      const payload = {
        ...form,
        manufacturingDate: form.manufacturingDate?.toISOString(),
        expiryDate: form.expiryDate?.toISOString(),
        dateOfStockEntry: form.dateOfStockEntry?.toISOString(),
        unitsPerPack: Number(form.unitsPerPack),
        numberOfPacks: Number(form.numberOfPacks),
        packSize: Number(form.packSize),
        minimumOrderQuantity: Number(form.minimumOrderQuantity),
        maximumOrderQuantity: Number(form.maximumOrderQuantity),
        stockQuantity: Number(form.stockQuantity),
        sellingPricePerPack: Number(form.sellingPricePerPack),
        mrp: Number(form.mrp),
        discountPercentage: Number(form.discountPercentage),
        gstPercentage: Number(form.gstPercentage),
        hsnCode: Number(form.hsnCode),
        selectedCertifications: selectedCertifications.map(cert => cert.label).join(", "),
        certifications: selectedCertifications,
      };
      
      console.log("Payload:", payload);
      alert("Consumable device created successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Submit Error:", err);
      alert("Failed to create consumable device");
    }
  };

  const selectStyles = (errorKey: string) => ({
    control: (base: any, state: any) => ({
      ...base,
      height: "56px",
      minHeight: "56px",
      borderRadius: "16px",
      borderColor: errors[errorKey]
        ? "#FF3B3B"
        : state.isFocused
        ? "#4B0082"
        : "#737373",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "0 16px",
      cursor: "pointer",
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: "56px",
      cursor: "pointer",
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

  return (
    <div className="flex flex-col gap-5 max-w-full mx-auto">
      {/* Product Details Section */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-h3 font-semibold mb-3">Product Details</div>
        <div className="border-b border-neutral-200"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-8 gap-y-4">
          <Input
            label="Product Name"
            name="productName"
            placeholder="e.g., Surgical Mask"
            onChange={handleChange}
            value={form.productName}
            error={errors.productName}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Device Category
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={deviceCategoryOptions}
              isLoading={loadingCategories}
              value={
                deviceCategoryOptions.find(
                  (o) => o.value === form.deviceCategoryId
                ) || null
              }
              onChange={(selected) =>
                handleSelectChange("deviceCategoryId", selected)
              }
              placeholder="Select category"
              theme={selectTheme}
              styles={selectStyles("deviceCategoryId")}
            />
            {errors.deviceCategoryId && (
              <p className="text-red-500 text-sm mt-1">
                {errors.deviceCategoryId}
              </p>
            )}
          </div>

          <Input
            label="Brand / Model Name"
            name="brandName"
            placeholder="e.g., 3M, Johnson & Johnson"
            onChange={handleChange}
            value={form.brandName}
            error={errors.brandName}
            required
          />

          {/* Material Type Dropdown with Checkboxes */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Material Type
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative" ref={materialDropdownRef}>
              <div
                onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
                className="w-full h-14 px-4 border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors"
              >
                <span className="text-sm text-neutral-700">
                  {selectedMaterialTypes.length > 0
                    ? selectedMaterialTypes.map(val => {
                        const option = materialTypeOptions.find(o => o.value === val);
                        return option?.label;
                      }).join(", ")
                    : "Select material types"}
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform ${showMaterialDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {showMaterialDropdown && (
                <div className="absolute z-10 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                  {materialTypeOptions.map((option) => {
                    const isChecked = selectedMaterialTypes.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleMaterialCheckboxChange(option)}
                          className="accent-purple-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            {errors.materialType && (
              <p className="text-red-500 text-sm mt-1">{errors.materialType}</p>
            )}
          </div>

          <Input
            label="Size / Dimension / Gauge"
            name="sizeDimension"
            placeholder="e.g., Size M, 22G, 10cm x 10cm"
            onChange={handleChange}
            value={form.sizeDimension}
            error={errors.sizeDimension}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Sterile / Non-Sterile
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="flex gap-6 mt-4">
              {sterileOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sterileStatus"
                    value={option.value}
                    checked={form.sterileStatus === option.value}
                    onChange={handleChange}
                    className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.sterileStatus && (
              <p className="text-red-500 text-sm">{errors.sterileStatus}</p>
            )}
          </div>

          <Input
            label="Shelf Life"
            name="shelfLife"
            placeholder="e.g., 3 years, 24 months"
            onChange={handleChange}
            value={form.shelfLife}
            error={errors.shelfLife}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Disposable / Reusable
              <span className="text-warning-500 ml-1">*</span>
            </label>
            <div className="flex gap-6 mt-4">
              {disposableOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="disposableType"
                    value={option.value}
                    checked={form.disposableType === option.value}
                    onChange={handleChange}
                    className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.disposableType && (
              <p className="text-red-500 text-sm">{errors.disposableType}</p>
            )}
          </div>

          {/* Certifications Section - Dropdown and Upload Side by Side */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Dropdown Section */}
              <div>
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                  Certifications / Compliance
                  <span className="text-warning-500 ml-1">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setShowCertDropdown(!showCertDropdown)}
                    className="w-full h-14 px-4 border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors"
                  >
                    <span className="text-sm text-neutral-700">
                      {selectedCertifications.length > 0
                        ? selectedCertifications.map(c => c.label).join(", ")
                        : "Select certifications"}
                    </span>
                    <svg 
                      className={`w-5 h-5 transition-transform ${showCertDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {showCertDropdown && (
                    <div className="absolute z-10 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
                      {certificationOptions.map((option) => {
                        const isChecked = selectedCertifications.some(
                          (c) => c.id === option.value
                        );
                        return (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCertificationCheckboxChange(option)}
                              className="accent-purple-600"
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Upload Section */}
              <div>
                <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
                  Certifications / Compliance
                  <span className="text-warning-500 ml-1">*</span>
                </label>
                <div className="w-full border border-neutral-300 rounded-xl flex items-center overflow-hidden h-14">
                  <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
                    <Image
                      src="/icons/upload.png"
                      alt="Upload"
                      width={20}
                      height={20}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 px-3 flex-1">
                    {selectedCertifications.map((cert) => (
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
                        {cert.uploading && (
                          <span className="text-xs">Uploading...</span>
                        )}
                        <button
                          onClick={(e) => handleRemoveTag(cert.id, e)}
                          className="ml-1 hover:text-gray-900 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {selectedCertifications.length === 0 && (
                      <span className="text-gray-400 text-sm">
                        Upload the Certificate
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden file inputs for each certification */}
            {selectedCertifications.map((cert) => (
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

          {/* Intended Use and Country of Origin */}
          <Input
            label="Intended Use / Purpose"
            name="intendedUse"
            placeholder="e.g., For surgical procedures, wound care"
            onChange={handleChange}
            value={form.intendedUse}
            error={errors.intendedUse}
            required
          />

          <Input
            label="Country of Origin"
            name="countryOfOrigin"
            placeholder="e.g., India, USA, Germany"
            onChange={handleChange}
            value={form.countryOfOrigin}
            error={errors.countryOfOrigin}
            required
          />

          <Input
            label="Manufacturer Name"
            name="manufacturerName"
            placeholder="Manufacturer company name"
            onChange={handleChange}
            value={form.manufacturerName}
            error={errors.manufacturerName}
            required
          />

          {/* Storage Condition Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Storage Condition
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={storageConditionOptions}
              value={
                storageConditionOptions.find((o) => o.value === form.storageCondition) ||
                null
              }
              onChange={(selected) =>
                handleSelectChange("storageCondition", selected)
              }
              placeholder="Select storage condition"
              theme={selectTheme}
              styles={selectStyles("storageCondition")}
            />
            {errors.storageCondition && (
              <p className="text-red-500 text-sm mt-1">
                {errors.storageCondition}
              </p>
            )}
          </div>

          {/* Device Class and Brochure Upload side by side */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Device Class (A / B / C / D)
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={deviceClassOptions}
              value={
                deviceClassOptions.find((o) => o.value === form.deviceClass) ||
                null
              }
              onChange={(selected) =>
                handleSelectChange("deviceClass", selected)
              }
              placeholder="Select device class"
              theme={selectTheme}
              styles={selectStyles("deviceClass")}
            />
            {errors.deviceClass && (
              <p className="text-red-500 text-sm mt-1">
                {errors.deviceClass}
              </p>
            )}
          </div>

          {/* Brochure Upload with Radio Buttons - Inline layout */}
          <div>
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-3">
              Upload Product Brochure / User Manual
            </label>
            <div className="flex items-center gap-3">
              <div className="flex gap-3">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="brochureType"
                    value="pdf"
                    checked={form.brochureType === "pdf"}
                    onChange={handleChange}
                    className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
                  />
                  <span className="text-sm">PDF</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="brochureType"
                    value="url"
                    checked={form.brochureType === "url"}
                    onChange={handleChange}
                    className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
                  />
                  <span className="text-sm">URL</span>
                </label>
              </div>
              
              <div className="flex-1">
                {form.brochureType === "pdf" ? (
                  <div
                    className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-10 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition"
                    onClick={() => document.getElementById("brochure-upload")?.click()}
                  >
                    <div className="w-8 h-full bg-[#DED0FE] flex items-center justify-center">
                      <Image
                        src="/icons/upload.png"
                        alt="Upload"
                        width={16}
                        height={16}
                      />
                    </div>
                    <div className="flex-1 px-2 text-xs">
                      {uploadingBrochure ? (
                        <span className="text-neutral-500">Uploading...</span>
                      ) : brochureFile ? (
                        <span className="text-neutral-900 font-medium truncate block">
                          {brochureFile.name}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Upload PDF</span>
                      )}
                    </div>
                    <input
                      id="brochure-upload"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleBrochureUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    name="brochureUrl"
                    placeholder="Enter brochure URL"
                    onChange={handleChange}
                    value={form.brochureUrl}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-[#4B0082] text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Key Features and Safety Instructions */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Safety Instructions / Precautions
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
                      ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                      : "border-neutral-500 focus:border-[#4B0082]"
                  } focus:outline-none focus:ring-0`}
                />
                {errors.safetyInstructions && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.safetyInstructions}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Key Features / Specifications
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="keyFeatures"
                  placeholder="List key features, specifications, and unique selling points"
                  value={form.keyFeatures}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
                    errors.keyFeatures
                      ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                      : "border-neutral-500 focus:border-[#4B0082]"
                  } focus:outline-none focus:ring-0`}
                />
                {errors.keyFeatures && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.keyFeatures}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
              Product Description
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <textarea
              name="productDescription"
              placeholder="Detailed product description, indications, and usage"
              value={form.productDescription}
              onChange={handleChange}
              rows={4}
              className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
                errors.productDescription
                  ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                  : "border-neutral-500 focus:border-[#4B0082]"
              } focus:outline-none focus:ring-0`}
            />
            {errors.productDescription && (
              <p className="text-red-500 text-sm mt-1">
                {errors.productDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Packaging & Order Details Section */}
      <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
        <div className="text-h3 font-semibold mb-3">Packaging & Order Details</div>
        <div className="border-b border-neutral-200"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-8">
          {/* Pack Type Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Pack Type
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={packTypeOptions}
              value={
                packTypeOptions.find((o) => o.value === form.packType) || null
              }
              onChange={(selected) =>
                handleSelectChange("packType", selected)
              }
              placeholder="Select pack type"
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
            placeholder="e.g., 100 gloves, 50 syringes"
            onChange={handleChange}
            value={form.unitsPerPack}
            error={errors.unitsPerPack}
            required
          />

          <Input
            label="Number of Packs"
            name="numberOfPacks"
            placeholder="Number of packs in order"
            onChange={handleChange}
            value={form.numberOfPacks}
            error={errors.numberOfPacks}
            required
          />

          <Input
            label="Pack Size (No. of packs X No. of Units per pack type)"
            name="packSize"
            value={form.packSize}
            disabled={true}
            required
          />
        </div>

        {/* Order Details Sub-header */}
        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Order Details</div>
          <div className="border-b border-neutral-200"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="Min Order Qty"
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

        {/* Batch Management Sub-header */}
        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Batch Management</div>
          <div className="border-b border-neutral-200"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="Batch / Lot Number"
            name="batchLotNumber"
            placeholder="Enter batch number"
            onChange={handleChange}
            value={form.batchLotNumber}
            error={errors.batchLotNumber}
            required
          />

          <Input
            label="Manufacturing Date"
            type="date"
            name="manufacturingDate"
            onChange={(e) =>
              setForm({ ...form, manufacturingDate: new Date(e.target.value) })
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
            label="Expiry Date"
            type="date"
            name="expiryDate"
            onChange={(e) =>
              setForm({ ...form, expiryDate: new Date(e.target.value) })
            }
            value={
              form.expiryDate
                ? form.expiryDate.toISOString().split("T")[0]
                : ""
            }
            error={errors.expiryDate}
            required
          />

          <Input
            label="Stock Quantity (Numbers w.r.t pack size)"
            name="stockQuantity"
            placeholder="Number of packs in stock"
            onChange={handleChange}
            value={form.stockQuantity}
            error={errors.stockQuantity}
            required
          />

          <Input
            label="Date of Entry"
            type="date"
            name="dateOfStockEntry"
            onChange={(e) =>
              setForm({ ...form, dateOfStockEntry: new Date(e.target.value) })
            }
            value={
              form.dateOfStockEntry
                ? form.dateOfStockEntry.toISOString().split("T")[0]
                : ""
            }
          />
        </div>

        {/* Pricing Sub-header */}
        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">Pricing</div>
          <div className="border-b border-neutral-200"></div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  {/* Row 1 */}
  <Input
    label="MRP"
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
    placeholder="Selling price per pack"
    onChange={handleChange}
    value={form.sellingPricePerPack}
    error={errors.sellingPricePerPack}
    required
  />

  {/* Row 2 */}
  <Input
    label="Discount Percentage"
    name="discountPercentage"
    placeholder="e.g., 10"
    onChange={handleChange}
    value={form.discountPercentage}
    error={errors.discountPercentage}
    required
  />

  {/* Button with fake label space */}
  <div className="flex flex-col gap-1">
    {/* Empty label to match Input spacing */}
    <label className="text-label-l3 font-semibold opacity-0">
      Hidden Label
    </label>

    <button
  onClick={() => setShowDiscountDrawer(true)}
  className="px-4 py-2 h-14 bg-[#9F75FC] text-white rounded-xl font-semibold transition w-1/2"
>
  + Add Additional Discount
</button>

    {/* <button className="px-4 py-2 h-14 bg-[#9F75FC] text-white rounded-xl font-semibold transition w-1/2">
      + Add Additional Discount
    </button> */}
  </div>
</div>

        {/* Tax & Billing Sub-header */}
        <div className="mb-4">
          <div className="text-h6 text-neutral-900 font-regular mb-2">TAX & BILLING</div>
          <div className="border-b border-neutral-200"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* GST Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              GST %
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <Select
              options={gstOptions}
              value={
                gstOptions.find((o) => o.value === form.gstPercentage) || null
              }
              onChange={(selected) =>
                handleSelectChange("gstPercentage", selected)
              }
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

        {/* Final Price */}
        <div className="mb-6">
          <label className="block text-label-l3 text-primary-1000 font-semibold mb-1">
            Final Price (after discounts):
          </label>
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

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-[#9F75FC] text-white rounded-lg font-semibold hover:bg-purple-700 transition">
            Save
          </button>
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
          <input
            id="fileInput"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                setImages(Array.from(e.target.files));
              }
            }}
          />
          <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
            <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/icons/FolderIcon.svg"
                  alt="drug"
                  className="w-10 h-10 rounded-md object-cover"
                />
                <div className="text-label-l2 font-normal mt-4">
                  Choose a file or drag & drop it here
                </div>
                <div className="text-label-l1 font-normal text-neutral-400">
                  Upload product images (JPEG, PNG)
                </div>
              </div>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div className="mt-2 text-green-600 text-sm">
            ✅ {images.length} image(s) added successfully
          </div>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {images.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-full h-24 object-cover rounded-md border"
                />
                <button
                  onClick={() =>
                    setImages(images.filter((_, i) => i !== index))
                  }
                  className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded hover:bg-red-600 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pb-8">
        <div className="flex gap-4 justify-center sm:justify-start">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer hover:bg-red-50 transition"
          >
            Cancel
          </button>
          <button className="px-6 py-2 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition">
            <img
              src="/icons/SaveDraftIcon.svg"
              alt="drug"
              className="w-5 h-5 rounded-md object-cover"
            />
            Save Draft
          </button>
        </div>
        <div className="flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800 transition"
          >
            Submit
          </button>
        </div>
      </div>
      {showDiscountDrawer && (
  <Drawer
    setShowDrawer={setShowDiscountDrawer}
    title="Additional Discount"
  >
    <AdditionalDiscount
      form={form}
      onChange={handleChange}
      onSave={() => setShowDiscountDrawer(false)}
    />
  </Drawer>
)}
    </div>
  );
};

export default ConsumableForm;
















// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import Select from "react-select";
// import Input from "@/src/app/commonComponents/Input";
// import { consumableDeviceSchema } from "@/src/schema/product/ConsumableDeviceSchema";
// import Image from "next/image";

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
// }

// const ConsumableForm = () => {
//   const [form, setForm] = useState({
//     // Product Details
//     productId: "",
//     productName: "",
//     deviceCategoryId: "",
//     brandName: "",
//     materialType: "",
//     sizeDimension: "",
//     sterileStatus: "",
//     disposableType: "",
//     shelfLife: "",
//     intendedUse: "",
//     keyFeatures: "",
//     safetyInstructions: "",
//     countryOfOrigin: "",
//     manufacturerName: "",
//     storageCondition: "",
//     deviceClass: "",
//     productDescription: "",
    
//     // Brochure/Manual
//     brochureType: "pdf",
//     brochureUrl: "",
    
//     // Packaging Details
//     packType: "",
//     unitsPerPack: "",
//     numberOfPacks: "",
//     packSize: "",
//     minimumOrderQuantity: "",
//     maximumOrderQuantity: "",
    
//     // Batch Management
//     batchLotNumber: "",
//     manufacturingDate: null as Date | null,
//     expiryDate: null as Date | null,
//     stockQuantity: "",
//     dateOfStockEntry: new Date(),
    
//     // Pricing
//     mrp: "",
//     sellingPricePerPack: "",
//     discountPercentage: "",
    
//     // Tax & Billing
//     gstPercentage: "",
//     hsnCode: "",
//     finalPrice: "",
//   });

//   // Certification options for dropdown with tags
//   const certificationOptions = [
//     { value: "cdsco", label: "CDSCO Registration Number", tagCode: "Tag 01" },
//     { value: "import", label: "Import License Number", tagCode: "Tag 02" },
//     { value: "iso", label: "ISO 13485", tagCode: "Tag 03" },
//     { value: "ce", label: "CE Certification", tagCode: "Tag 04" },
//     { value: "bis", label: "BIS Certification", tagCode: "Tag 05" },
//   ];

//   // Material Type options
//   const materialTypeOptions = [
//     { value: "latex", label: "Latex" },
//     { value: "latex-free", label: "Latex-Free" },
//     { value: "nitrile", label: "Nitrile" },
//     { value: "vinyl", label: "Vinyl" },
//     { value: "plastic", label: "Plastic" },
//     { value: "non-woven", label: "Non-woven Fabric" },
//     { value: "stainless-steel", label: "Stainless Steel" },
//     { value: "rubber", label: "Rubber" },
//     { value: "glass", label: "Glass" },
//     { value: "silicone", label: "Silicone" },
//   ];

//   // Storage Condition options
//   const storageConditionOptions = [
//     { value: "room-temperature", label: "Room Temperature" },
//     { value: "cold-dry", label: "Cold & Dry Place" },
//     { value: "refrigerated", label: "Refrigerated" },
//     { value: "sterile-storage", label: "Sterile Storage" },
//     { value: "avoid-sunlight", label: "Avoid Sunlight" },
//   ];

//   // Pack Type options
//   const packTypeOptions = [
//     { value: "box", label: "Box" },
//     { value: "pack", label: "Pack" },
//     { value: "pouch", label: "Pouch" },
//     { value: "piece", label: "Piece (Pc/Unit)" },
//     { value: "set", label: "Set" },
//     { value: "kit", label: "Kit" },
//     { value: "roll", label: "Roll" },
//     { value: "tube", label: "Tube" },
//     { value: "bottle", label: "Bottle" },
//     { value: "can", label: "Can" },
//     { value: "jar", label: "Jar" },
//     { value: "strip", label: "Strip" },
//     { value: "blister", label: "Blister Pack" },
//     { value: "bag", label: "Bag" },
//     { value: "cartridge", label: "Cartridge" },
//     { value: "sachet", label: "Sachet" },
//     { value: "spray-bottle", label: "Bottle (Spray)" },
//     { value: "container", label: "Container" },
//   ];

//   // GST options
//   const gstOptions = [
//     { value: "0", label: "0%" },
//     { value: "5", label: "5%" },
//     { value: "12", label: "12%" },
//     { value: "18", label: "18%" },
//   ];

//   // Selected certifications from dropdown
//   const [selectedCertifications, setSelectedCertifications] = useState<CertificationTag[]>([]);

//   const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
//   const [loadingCategories, setLoadingCategories] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [images, setImages] = useState<File[]>([]);
//   const [brochureFile, setBrochureFile] = useState<File | null>(null);
//   const [uploadingBrochure, setUploadingBrochure] = useState(false);
//   const [showCertDropdown, setShowCertDropdown] = useState(false);
//   const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
//   const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const materialDropdownRef = useRef<HTMLDivElement>(null);

//   // Sterile options
//   const sterileOptions = [
//     { value: "sterile", label: "Sterile" },
//     { value: "non-sterile", label: "Non-Sterile" },
//   ];

//   // Disposable/Reusable options
//   const disposableOptions = [
//     { value: "disposable", label: "Disposable" },
//     { value: "reusable", label: "Reusable" },
//   ];

//   // Device Class options
//   const deviceClassOptions = [
//     { value: "A", label: "Class A" },
//     { value: "B", label: "Class B" },
//     { value: "C", label: "Class C" },
//     { value: "D", label: "Class D" },
//   ];

//   // Device Category options
//   const deviceCategories = [
//     { value: "syringe", label: "Syringe" },
//     { value: "gloves", label: "Gloves" },
//     { value: "mask", label: "Face Mask" },
//     { value: "bandage", label: "Bandage" },
//     { value: "test-strip", label: "Test Strip" },
//     { value: "catheter", label: "Catheter" },
//     { value: "iVSet", label: "IV Set" },
//     { value: "cottonRoll", label: "Cotton Roll" },
//     { value: "alcoholSwab", label: "Alcohol Swab" },
//     { value: "surgicalBlade", label: "Surgical Blade" },
//     { value: "gauze", label: "Gauze Swab" },
//     { value: "swab", label: "Swab" },
//     { value: "nebulizerKit", label: "Nebulizer Kit" },
//     { value: "Lancet", label: "Lancet" },
//   ];

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowCertDropdown(false);
//       }
//       if (materialDropdownRef.current && !materialDropdownRef.current.contains(event.target as Node)) {
//         setShowMaterialDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     const fetchDeviceCategories = async () => {
//       setLoadingCategories(true);
//       try {
//         setDeviceCategoryOptions(deviceCategories);
//       } catch (error) {
//         console.error(error);
//       } finally {
//         setLoadingCategories(false);
//       }
//     };
//     fetchDeviceCategories();
//   }, []);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value, type } = e.target;
//     if (type === "checkbox") {
//       const checked = (e.target as HTMLInputElement).checked;
//       setForm({ ...form, [name]: checked });
//     } else {
//       setForm({ ...form, [name]: value });
//     }
//   };

//   const handleSelectChange = (field: string, selected: SelectOption | null) => {
//     setForm({ ...form, [field]: selected ? selected.value : "" });
//   };

//   const handleCertificationCheckboxChange = (option: typeof certificationOptions[0]) => {
//     const isChecked = selectedCertifications.some(c => c.id === option.value);
    
//     if (isChecked) {
//       setSelectedCertifications(prev => prev.filter(c => c.id !== option.value));
//     } else {
//       setSelectedCertifications(prev => [
//         ...prev,
//         {
//           id: option.value,
//           label: option.label,
//           tagCode: option.tagCode,
//           file: null,
//           fileName: "",
//           uploading: false,
//           isUploaded: false,
//         },
//       ]);
//     }
//   };

//   const handleMaterialCheckboxChange = (option: typeof materialTypeOptions[0]) => {
//     const isChecked = selectedMaterialTypes.includes(option.value);
    
//     if (isChecked) {
//       setSelectedMaterialTypes(prev => prev.filter(v => v !== option.value));
//       // Update form value with comma-separated selected materials
//       const updatedMaterials = selectedMaterialTypes.filter(v => v !== option.value);
//       setForm({ ...form, materialType: updatedMaterials.join(", ") });
//     } else {
//       setSelectedMaterialTypes(prev => [...prev, option.value]);
//       const updatedMaterials = [...selectedMaterialTypes, option.value];
//       setForm({ ...form, materialType: updatedMaterials.join(", ") });
//     }
//   };

//   const handleTagClick = (certId: string) => {
//     const inputElement = document.getElementById(`cert-upload-${certId}`);
//     if (inputElement) {
//       inputElement.click();
//     }
//   };

//   const handleRemoveTag = (certId: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setSelectedCertifications(prev => prev.filter(cert => cert.id !== certId));
//   };

//   const handleCertificationFileUpload = async (certId: string, file: File) => {
//     setSelectedCertifications(prev => 
//       prev.map(cert => 
//         cert.id === certId 
//           ? { ...cert, uploading: true }
//           : cert
//       )
//     );
    
//     setTimeout(() => {
//       setSelectedCertifications(prev => 
//         prev.map(cert => 
//           cert.id === certId 
//             ? { ...cert, file, fileName: file.name, uploading: false, isUploaded: true }
//             : cert
//         )
//       );
//     }, 1000);
//   };

//   const handleBrochureUpload = async (file: File) => {
//     setUploadingBrochure(true);
//     setTimeout(() => {
//       setBrochureFile(file);
//       setUploadingBrochure(false);
//     }, 1000);
//   };

//   const calculatePackSize = () => {
//     const units = parseFloat(form.unitsPerPack);
//     const packs = parseFloat(form.numberOfPacks);
//     if (!isNaN(units) && !isNaN(packs)) {
//       const calculated = units * packs;
//       setForm({ ...form, packSize: calculated.toString() });
//     }
//   };

//   const calculateFinalPrice = () => {
//     const mrpValue = parseFloat(form.mrp);
//     const discountValue = parseFloat(form.discountPercentage);
//     const sellingPrice = parseFloat(form.sellingPricePerPack);

//     if (isNaN(mrpValue) || isNaN(sellingPrice)) return "0.00";

//     let price = sellingPrice;
    
//     if (!isNaN(discountValue)) {
//       price = price - (price * discountValue) / 100;
//     }
    
//     return price.toFixed(2);
//   };

//   useEffect(() => {
//     calculatePackSize();
//   }, [form.unitsPerPack, form.numberOfPacks]);

//   useEffect(() => {
//     const finalPrice = calculateFinalPrice();
//     setForm((prev) => ({ ...prev, finalPrice }));
//   }, [form.mrp, form.sellingPricePerPack, form.discountPercentage]);

//   const handleSubmit = async () => {
//     const validation = consumableDeviceSchema.safeParse(form);
    
//     if (!validation.success) {
//       const fieldErrors: Record<string, string> = {};
//       validation.error.issues.forEach((err) => {
//         const fieldName = err.path.join(".");
//         fieldErrors[fieldName] = err.message;
//       });
//       setErrors(fieldErrors);
//       return;
//     }
    
//     setErrors({});
    
//     try {
//       const payload = {
//         ...form,
//         manufacturingDate: form.manufacturingDate?.toISOString(),
//         expiryDate: form.expiryDate?.toISOString(),
//         dateOfStockEntry: form.dateOfStockEntry?.toISOString(),
//         unitsPerPack: Number(form.unitsPerPack),
//         numberOfPacks: Number(form.numberOfPacks),
//         packSize: Number(form.packSize),
//         minimumOrderQuantity: Number(form.minimumOrderQuantity),
//         maximumOrderQuantity: Number(form.maximumOrderQuantity),
//         stockQuantity: Number(form.stockQuantity),
//         sellingPricePerPack: Number(form.sellingPricePerPack),
//         mrp: Number(form.mrp),
//         discountPercentage: Number(form.discountPercentage),
//         gstPercentage: Number(form.gstPercentage),
//         hsnCode: Number(form.hsnCode),
//         selectedCertifications: selectedCertifications.map(cert => cert.label).join(", "),
//         certifications: selectedCertifications,
//       };
      
//       console.log("Payload:", payload);
//       alert("Consumable device created successfully!");
//       window.location.reload();
//     } catch (err) {
//       console.error("Submit Error:", err);
//       alert("Failed to create consumable device");
//     }
//   };

//   const selectStyles = (errorKey: string) => ({
//     control: (base: any, state: any) => ({
//       ...base,
//       height: "56px",
//       minHeight: "56px",
//       borderRadius: "16px",
//       borderColor: errors[errorKey]
//         ? "#FF3B3B"
//         : state.isFocused
//         ? "#4B0082"
//         : "#737373",
//       boxShadow: "none",
//       cursor: "pointer",
//       "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
//     }),
//     valueContainer: (base: any) => ({
//       ...base,
//       padding: "0 16px",
//       cursor: "pointer",
//     }),
//     indicatorsContainer: (base: any) => ({
//       ...base,
//       height: "56px",
//       cursor: "pointer",
//     }),
//     dropdownIndicator: (base: any, state: any) => ({
//       ...base,
//       color: state.isFocused ? "#4B0082" : "#737373",
//       cursor: "pointer",
//       "&:hover": { color: "#4B0082" },
//     }),
//     option: (base: any, state: any) => ({
//       ...base,
//       backgroundColor: state.isSelected
//         ? "#4B0082"
//         : state.isFocused
//         ? "#F3E8FF"
//         : "white",
//       color: state.isSelected ? "white" : "#1E1E1E",
//       cursor: "pointer",
//       "&:active": { backgroundColor: "#4B0082", color: "white" },
//     }),
//     placeholder: (base: any) => ({ ...base, color: "#A3A3A3" }),
//     singleValue: (base: any) => ({ ...base, color: "#1E1E1E" }),
//   });

//   const selectTheme = (theme: any) => ({
//     ...theme,
//     colors: {
//       ...theme.colors,
//       primary: "#4B0082",
//       primary25: "#F3E8FF",
//       primary50: "#E9D5FF",
//     },
//   });

//   return (
//     <div className="flex flex-col gap-5 max-w-full mx-auto">
//       {/* Product Details Section */}
//       <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
//         <div className="text-h3 font-semibold mb-3">Product Details</div>
//         <div className="border-b border-neutral-200"></div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-8 gap-y-4">
//           <Input
//             label="Product Name"
//             name="productName"
//             placeholder="e.g., Surgical Mask"
//             onChange={handleChange}
//             value={form.productName}
//             error={errors.productName}
//             required
//           />

//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Device Category
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <Select
//               options={deviceCategoryOptions}
//               isLoading={loadingCategories}
//               value={
//                 deviceCategoryOptions.find(
//                   (o) => o.value === form.deviceCategoryId
//                 ) || null
//               }
//               onChange={(selected) =>
//                 handleSelectChange("deviceCategoryId", selected)
//               }
//               placeholder="Select category"
//               theme={selectTheme}
//               styles={selectStyles("deviceCategoryId")}
//             />
//             {errors.deviceCategoryId && (
//               <p className="text-red-500 text-sm mt-1">
//                 {errors.deviceCategoryId}
//               </p>
//             )}
//           </div>

//           <Input
//             label="Brand / Model Name"
//             name="brandName"
//             placeholder="e.g., 3M, Johnson & Johnson"
//             onChange={handleChange}
//             value={form.brandName}
//             error={errors.brandName}
//             required
//           />

//           {/* Material Type Dropdown with Checkboxes */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Material Type
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative" ref={materialDropdownRef}>
//               <div
//                 onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
//                 className="w-full h-14 px-4 border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors"
//               >
//                 <span className="text-sm text-neutral-700">
//                   {selectedMaterialTypes.length > 0
//                     ? selectedMaterialTypes.map(val => {
//                         const option = materialTypeOptions.find(o => o.value === val);
//                         return option?.label;
//                       }).join(", ")
//                     : "Select material types"}
//                 </span>
//                 <svg 
//                   className={`w-5 h-5 transition-transform ${showMaterialDropdown ? 'rotate-180' : ''}`} 
//                   fill="none" 
//                   stroke="currentColor" 
//                   viewBox="0 0 24 24"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                 </svg>
//               </div>

//               {showMaterialDropdown && (
//                 <div className="absolute z-10 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
//                   {materialTypeOptions.map((option) => {
//                     const isChecked = selectedMaterialTypes.includes(option.value);
//                     return (
//                       <label
//                         key={option.value}
//                         className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer"
//                       >
//                         <input
//                           type="checkbox"
//                           checked={isChecked}
//                           onChange={() => handleMaterialCheckboxChange(option)}
//                           className="accent-purple-600"
//                         />
//                         <span>{option.label}</span>
//                       </label>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//             {errors.materialType && (
//               <p className="text-red-500 text-sm mt-1">{errors.materialType}</p>
//             )}
//           </div>

//           <Input
//             label="Size / Dimension / Gauge"
//             name="sizeDimension"
//             placeholder="e.g., Size M, 22G, 10cm x 10cm"
//             onChange={handleChange}
//             value={form.sizeDimension}
//             error={errors.sizeDimension}
//             required
//           />

//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Sterile / Non-Sterile
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="flex gap-6 mt-4">
//               {sterileOptions.map((option) => (
//                 <label key={option.value} className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="sterileStatus"
//                     value={option.value}
//                     checked={form.sterileStatus === option.value}
//                     onChange={handleChange}
//                     className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
//                   />
//                   <span>{option.label}</span>
//                 </label>
//               ))}
//             </div>
//             {errors.sterileStatus && (
//               <p className="text-red-500 text-sm">{errors.sterileStatus}</p>
//             )}
//           </div>

//           <Input
//             label="Shelf Life"
//             name="shelfLife"
//             placeholder="e.g., 3 years, 24 months"
//             onChange={handleChange}
//             value={form.shelfLife}
//             error={errors.shelfLife}
//             required
//           />

//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Disposable / Reusable
//               <span className="text-warning-500 ml-1">*</span>
//             </label>
//             <div className="flex gap-6 mt-4">
//               {disposableOptions.map((option) => (
//                 <label key={option.value} className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="disposableType"
//                     value={option.value}
//                     checked={form.disposableType === option.value}
//                     onChange={handleChange}
//                     className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
//                   />
//                   <span>{option.label}</span>
//                 </label>
//               ))}
//             </div>
//             {errors.disposableType && (
//               <p className="text-red-500 text-sm">{errors.disposableType}</p>
//             )}
//           </div>

//           {/* Certifications Section - Dropdown and Upload Side by Side */}
//           <div className="col-span-1 md:col-span-2">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Left Side - Dropdown Section */}
//               <div>
//                 <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
//                   Certifications / Compliance
//                   <span className="text-warning-500 ml-1">*</span>
//                 </label>
//                 <div className="relative" ref={dropdownRef}>
//                   <div
//                     onClick={() => setShowCertDropdown(!showCertDropdown)}
//                     className="w-full h-14 px-4 border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#4B0082] transition-colors"
//                   >
//                     <span className="text-sm text-neutral-700">
//                       {selectedCertifications.length > 0
//                         ? selectedCertifications.map(c => c.label).join(", ")
//                         : "Select certifications"}
//                     </span>
//                     <svg 
//                       className={`w-5 h-5 transition-transform ${showCertDropdown ? 'rotate-180' : ''}`} 
//                       fill="none" 
//                       stroke="currentColor" 
//                       viewBox="0 0 24 24"
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </div>

//                   {showCertDropdown && (
//                     <div className="absolute z-10 w-full bg-white border mt-1 rounded-xl shadow-md max-h-60 overflow-y-auto">
//                       {certificationOptions.map((option) => {
//                         const isChecked = selectedCertifications.some(
//                           (c) => c.id === option.value
//                         );
//                         return (
//                           <label
//                             key={option.value}
//                             className="flex items-center gap-2 px-4 py-2 hover:bg-purple-50 cursor-pointer"
//                           >
//                             <input
//                               type="checkbox"
//                               checked={isChecked}
//                               onChange={() => handleCertificationCheckboxChange(option)}
//                               className="accent-purple-600"
//                             />
//                             <span>{option.label}</span>
//                           </label>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Right Side - Upload Section */}
//               <div>
//                 <label className="text-label-l3 text-neutral-700 font-semibold block mb-2">
//                   Certifications / Compliance
//                   <span className="text-warning-500 ml-1">*</span>
//                 </label>
//                 <div className="w-full border border-neutral-300 rounded-xl flex items-center overflow-hidden h-14">
//                   <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
//                     <Image
//                       src="/icons/upload.png"
//                       alt="Upload"
//                       width={20}
//                       height={20}
//                     />
//                   </div>

//                   <div className="flex flex-wrap gap-2 px-3 flex-1">
//                     {selectedCertifications.map((cert) => (
//                       <div
//                         key={cert.id}
//                         onClick={() => handleTagClick(cert.id)}
//                         className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm cursor-pointer transition ${
//                           cert.isUploaded
//                             ? "bg-green-100 text-green-800 border border-green-300"
//                             : "bg-purple-100 text-purple-800 border border-purple-300"
//                         }`}
//                       >
//                         <span>{cert.tagCode}</span>
//                         {cert.uploading && (
//                           <span className="text-xs">Uploading...</span>
//                         )}
//                         <button
//                           onClick={(e) => handleRemoveTag(cert.id, e)}
//                           className="ml-1 hover:text-gray-900 text-xs font-bold"
//                         >
//                           ✕
//                         </button>
//                       </div>
//                     ))}

//                     {selectedCertifications.length === 0 && (
//                       <span className="text-gray-400 text-sm">
//                         Upload the Certificate
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Hidden file inputs for each certification */}
//             {selectedCertifications.map((cert) => (
//               <input
//                 key={`input-${cert.id}`}
//                 id={`cert-upload-${cert.id}`}
//                 type="file"
//                 accept=".pdf,.jpg,.jpeg,.png"
//                 className="hidden"
//                 onChange={(e) => {
//                   if (e.target.files && e.target.files[0]) {
//                     handleCertificationFileUpload(cert.id, e.target.files[0]);
//                   }
//                 }}
//               />
//             ))}
//           </div>

//           {/* Intended Use and Country of Origin */}
//           <Input
//             label="Intended Use / Purpose"
//             name="intendedUse"
//             placeholder="e.g., For surgical procedures, wound care"
//             onChange={handleChange}
//             value={form.intendedUse}
//             error={errors.intendedUse}
//             required
//           />

//           <Input
//             label="Country of Origin"
//             name="countryOfOrigin"
//             placeholder="e.g., India, USA, Germany"
//             onChange={handleChange}
//             value={form.countryOfOrigin}
//             error={errors.countryOfOrigin}
//             required
//           />

//           <Input
//             label="Manufacturer Name"
//             name="manufacturerName"
//             placeholder="Manufacturer company name"
//             onChange={handleChange}
//             value={form.manufacturerName}
//             error={errors.manufacturerName}
//             required
//           />

//           {/* Storage Condition Dropdown */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Storage Condition
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <Select
//               options={storageConditionOptions}
//               value={
//                 storageConditionOptions.find((o) => o.value === form.storageCondition) ||
//                 null
//               }
//               onChange={(selected) =>
//                 handleSelectChange("storageCondition", selected)
//               }
//               placeholder="Select storage condition"
//               theme={selectTheme}
//               styles={selectStyles("storageCondition")}
//             />
//             {errors.storageCondition && (
//               <p className="text-red-500 text-sm mt-1">
//                 {errors.storageCondition}
//               </p>
//             )}
//           </div>

//           {/* Device Class and Brochure Upload side by side */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Device Class (A / B / C / D)
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <Select
//               options={deviceClassOptions}
//               value={
//                 deviceClassOptions.find((o) => o.value === form.deviceClass) ||
//                 null
//               }
//               onChange={(selected) =>
//                 handleSelectChange("deviceClass", selected)
//               }
//               placeholder="Select device class"
//               theme={selectTheme}
//               styles={selectStyles("deviceClass")}
//             />
//             {errors.deviceClass && (
//               <p className="text-red-500 text-sm mt-1">
//                 {errors.deviceClass}
//               </p>
//             )}
//           </div>

//           {/* Brochure Upload with Radio Buttons - Inline layout */}
//           <div>
//             <label className="block text-label-l3 text-neutral-700 font-semibold mb-3">
//               Upload Product Brochure / User Manual
//             </label>
//             <div className="flex items-center gap-3">
//               <div className="flex gap-3">
//                 <label className="flex items-center gap-1">
//                   <input
//                     type="radio"
//                     name="brochureType"
//                     value="pdf"
//                     checked={form.brochureType === "pdf"}
//                     onChange={handleChange}
//                     className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
//                   />
//                   <span className="text-sm">PDF</span>
//                 </label>
//                 <label className="flex items-center gap-1">
//                   <input
//                     type="radio"
//                     name="brochureType"
//                     value="url"
//                     checked={form.brochureType === "url"}
//                     onChange={handleChange}
//                     className="accent-primary-900 w-5 h-5 mt-1 sm:mt-0"
//                   />
//                   <span className="text-sm">URL</span>
//                 </label>
//               </div>
              
//               <div className="flex-1">
//                 {form.brochureType === "pdf" ? (
//                   <div
//                     className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-10 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition"
//                     onClick={() => document.getElementById("brochure-upload")?.click()}
//                   >
//                     <div className="w-8 h-full bg-[#DED0FE] flex items-center justify-center">
//                       <Image
//                         src="/icons/upload.png"
//                         alt="Upload"
//                         width={16}
//                         height={16}
//                       />
//                     </div>
//                     <div className="flex-1 px-2 text-xs">
//                       {uploadingBrochure ? (
//                         <span className="text-neutral-500">Uploading...</span>
//                       ) : brochureFile ? (
//                         <span className="text-neutral-900 font-medium truncate block">
//                           {brochureFile.name}
//                         </span>
//                       ) : (
//                         <span className="text-neutral-400">Upload PDF</span>
//                       )}
//                     </div>
//                     <input
//                       id="brochure-upload"
//                       type="file"
//                       accept=".pdf"
//                       className="hidden"
//                       onChange={(e) => {
//                         if (e.target.files && e.target.files[0]) {
//                           handleBrochureUpload(e.target.files[0]);
//                         }
//                       }}
//                     />
//                   </div>
//                 ) : (
//                   <input
//                     type="text"
//                     name="brochureUrl"
//                     placeholder="Enter brochure URL"
//                     onChange={handleChange}
//                     value={form.brochureUrl}
//                     className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-[#4B0082] text-sm"
//                   />
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Key Features and Safety Instructions */}
//           <div className="col-span-1 md:col-span-2">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
//                   Safety Instructions / Precautions
//                   <span className="text-warning-500 font-semibold ml-1">*</span>
//                 </label>
//                 <textarea
//                   name="safetyInstructions"
//                   placeholder="Enter safety warnings, precautions, and handling instructions"
//                   value={form.safetyInstructions}
//                   onChange={handleChange}
//                   rows={4}
//                   className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
//                     errors.safetyInstructions
//                       ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
//                       : "border-neutral-500 focus:border-[#4B0082]"
//                   } focus:outline-none focus:ring-0`}
//                 />
//                 {errors.safetyInstructions && (
//                   <p className="text-red-500 text-sm mt-1">
//                     {errors.safetyInstructions}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
//                   Key Features / Specifications
//                   <span className="text-warning-500 font-semibold ml-1">*</span>
//                 </label>
//                 <textarea
//                   name="keyFeatures"
//                   placeholder="List key features, specifications, and unique selling points"
//                   value={form.keyFeatures}
//                   onChange={handleChange}
//                   rows={4}
//                   className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
//                     errors.keyFeatures
//                       ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
//                       : "border-neutral-500 focus:border-[#4B0082]"
//                   } focus:outline-none focus:ring-0`}
//                 />
//                 {errors.keyFeatures && (
//                   <p className="text-red-500 text-sm mt-1">
//                     {errors.keyFeatures}
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Product Description */}
//           <div className="col-span-1 md:col-span-2">
//             <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
//               Product Description
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <textarea
//               name="productDescription"
//               placeholder="Detailed product description, indications, and usage"
//               value={form.productDescription}
//               onChange={handleChange}
//               rows={4}
//               className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
//                 errors.productDescription
//                   ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
//                   : "border-neutral-500 focus:border-[#4B0082]"
//               } focus:outline-none focus:ring-0`}
//             />
//             {errors.productDescription && (
//               <p className="text-red-500 text-sm mt-1">
//                 {errors.productDescription}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Packaging & Order Details Section */}
//       <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
//         <div className="text-h3 font-semibold mb-3">Packaging & Order Details</div>
//         <div className="border-b border-neutral-200"></div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-8">
//           {/* Pack Type Dropdown */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Pack Type
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <Select
//               options={packTypeOptions}
//               value={
//                 packTypeOptions.find((o) => o.value === form.packType) || null
//               }
//               onChange={(selected) =>
//                 handleSelectChange("packType", selected)
//               }
//               placeholder="Select pack type"
//               theme={selectTheme}
//               styles={selectStyles("packType")}
//             />
//             {errors.packType && (
//               <p className="text-red-500 text-sm mt-1">{errors.packType}</p>
//             )}
//           </div>

//           <Input
//             label="Number of Units per Pack Type"
//             name="unitsPerPack"
//             placeholder="e.g., 100 gloves, 50 syringes"
//             onChange={handleChange}
//             value={form.unitsPerPack}
//             error={errors.unitsPerPack}
//             required
//           />

//           <Input
//             label="Number of Packs"
//             name="numberOfPacks"
//             placeholder="Number of packs in order"
//             onChange={handleChange}
//             value={form.numberOfPacks}
//             error={errors.numberOfPacks}
//             required
//           />

//           <Input
//             label="Pack Size (No. of packs X No. of Units per pack type)"
//             name="packSize"
//             value={form.packSize}
//             disabled={true}
//             required
//           />
//         </div>

//         {/* Order Details Sub-header */}
//         <div className="mb-4">
//           <div className="text-h6 text-neutral-900 font-regular mb-2">Order Details</div>
//           <div className="border-b border-neutral-200"></div>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <Input
//             label="Min Order Qty"
//             name="minimumOrderQuantity"
//             placeholder="Minimum quantity per order"
//             onChange={handleChange}
//             value={form.minimumOrderQuantity}
//             error={errors.minimumOrderQuantity}
//             required
//           />

//           <Input
//             label="Max Order Qty"
//             name="maximumOrderQuantity"
//             placeholder="Maximum quantity per order"
//             onChange={handleChange}
//             value={form.maximumOrderQuantity}
//             error={errors.maximumOrderQuantity}
//             required
//           />
//         </div>

//         {/* Batch Management Sub-header */}
//         <div className="mb-4">
//           <div className="text-h6 text-neutral-900 font-regular mb-2">Batch Management</div>
//           <div className="border-b border-neutral-200"></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <Input
//             label="Batch / Lot Number"
//             name="batchLotNumber"
//             placeholder="Enter batch number"
//             onChange={handleChange}
//             value={form.batchLotNumber}
//             error={errors.batchLotNumber}
//             required
//           />

//           <Input
//             label="Manufacturing Date"
//             type="date"
//             name="manufacturingDate"
//             onChange={(e) =>
//               setForm({ ...form, manufacturingDate: new Date(e.target.value) })
//             }
//             value={
//               form.manufacturingDate
//                 ? form.manufacturingDate.toISOString().split("T")[0]
//                 : ""
//             }
//             error={errors.manufacturingDate}
//             required
//           />

//           <Input
//             label="Expiry Date"
//             type="date"
//             name="expiryDate"
//             onChange={(e) =>
//               setForm({ ...form, expiryDate: new Date(e.target.value) })
//             }
//             value={
//               form.expiryDate
//                 ? form.expiryDate.toISOString().split("T")[0]
//                 : ""
//             }
//             error={errors.expiryDate}
//             required
//           />

//           <Input
//             label="Stock Quantity (Numbers w.r.t pack size)"
//             name="stockQuantity"
//             placeholder="Number of packs in stock"
//             onChange={handleChange}
//             value={form.stockQuantity}
//             error={errors.stockQuantity}
//             required
//           />

//           <Input
//             label="Date of Entry"
//             type="date"
//             name="dateOfStockEntry"
//             onChange={(e) =>
//               setForm({ ...form, dateOfStockEntry: new Date(e.target.value) })
//             }
//             value={
//               form.dateOfStockEntry
//                 ? form.dateOfStockEntry.toISOString().split("T")[0]
//                 : ""
//             }
//           />
//         </div>

//         {/* Pricing Sub-header */}
//         <div className="mb-4">
//           <div className="text-h6 text-neutral-900 font-regular mb-2">Pricing</div>
//           <div className="border-b border-neutral-200"></div>
//         </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//   {/* Row 1 */}
//   <Input
//     label="MRP"
//     name="mrp"
//     placeholder="Maximum Retail Price"
//     onChange={handleChange}
//     value={form.mrp}
//     error={errors.mrp}
//     required
//   />

//   <Input
//     label="Selling Price (per Pack Size)"
//     name="sellingPricePerPack"
//     placeholder="Selling price per pack"
//     onChange={handleChange}
//     value={form.sellingPricePerPack}
//     error={errors.sellingPricePerPack}
//     required
//   />

//   {/* Row 2 */}
//   <Input
//     label="Discount Percentage"
//     name="discountPercentage"
//     placeholder="e.g., 10"
//     onChange={handleChange}
//     value={form.discountPercentage}
//     error={errors.discountPercentage}
//     required
//   />

//   {/* Button with fake label space */}
//   <div className="flex flex-col gap-1">
//     {/* Empty label to match Input spacing */}
//     <label className="text-label-l3 font-semibold opacity-0">
//       Hidden Label
//     </label>

//     <button className="px-4 py-2 h-14 bg-[#9F75FC] text-white rounded-xl font-semibold transition w-1/2">
//       + Add Additional Discount
//     </button>
//   </div>
// </div>

//         {/* Tax & Billing Sub-header */}
//         <div className="mb-4">
//           <div className="text-h6 text-neutral-900 font-regular mb-2">TAX & BILLING</div>
//           <div className="border-b border-neutral-200"></div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           {/* GST Dropdown */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               GST %
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <Select
//               options={gstOptions}
//               value={
//                 gstOptions.find((o) => o.value === form.gstPercentage) || null
//               }
//               onChange={(selected) =>
//                 handleSelectChange("gstPercentage", selected)
//               }
//               placeholder="Select GST"
//               theme={selectTheme}
//               styles={selectStyles("gstPercentage")}
//             />
//             {errors.gstPercentage && (
//               <p className="text-red-500 text-sm mt-1">{errors.gstPercentage}</p>
//             )}
//           </div>

//           <Input
//             label="HSN Code"
//             name="hsnCode"
//             placeholder="HSN Code"
//             onChange={handleChange}
//             value={form.hsnCode}
//             error={errors.hsnCode}
//             required
//           />
//         </div>

//         {/* Final Price */}
//         <div className="mb-6">
//           <label className="block text-label-l3 text-primary-1000 font-semibold mb-1">
//             Final Price (after discounts):
//           </label>
//           <div className="relative">
//             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-700 text-p4 font-regular">₹</span>
//             <input
//               type="text"
//               name="finalPrice"
//               value={`${form.finalPrice || "0.00"}`}
//               disabled
//               className="w-full h-12 pl-8 pr-4 text-p4 rounded-xl border-2 border-[#C4AAFD] bg-[#F8F5FF] text-primary-700 font-regular focus:outline-none cursor-not-allowed"
//             />
//           </div>
//         </div>

//         {/* Save Button */}
//         <div className="flex justify-end">
//           <button className="px-6 py-2 bg-[#9F75FC] text-white rounded-lg font-semibold hover:bg-purple-700 transition">
//             Save
//           </button>
//         </div>
//       </div>

//       {/* Product Photos Section */}
//       <div className="border border-neutral-200 rounded-xl p-4 sm:p-6">
//         <div className="text-p3 text-neutral-900 font-semibold mb-2">
//           Product Photos <span className="text-warning-500">*</span>
//         </div>
        
//         <div
//           className="w-full h-40 bg-neutral-50 flex items-center justify-center rounded-lg cursor-pointer"
//           onClick={() => document.getElementById("fileInput")?.click()}
//         >
//           <input
//             id="fileInput"
//             type="file"
//             multiple
//             accept="image/*"
//             className="hidden"
//             onChange={(e) => {
//               if (e.target.files) {
//                 setImages(Array.from(e.target.files));
//               }
//             }}
//           />
//           <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
//             <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
//               <div className="flex flex-col items-center justify-center">
//                 <img
//                   src="/icons/FolderIcon.svg"
//                   alt="drug"
//                   className="w-10 h-10 rounded-md object-cover"
//                 />
//                 <div className="text-label-l2 font-normal mt-4">
//                   Choose a file or drag & drop it here
//                 </div>
//                 <div className="text-label-l1 font-normal text-neutral-400">
//                   Upload product images (JPEG, PNG)
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {images.length > 0 && (
//           <div className="mt-2 text-green-600 text-sm">
//             ✅ {images.length} image(s) added successfully
//           </div>
//         )}

//         {images.length > 0 && (
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
//             {images.map((file, index) => (
//               <div key={index} className="relative">
//                 <img
//                   src={URL.createObjectURL(file)}
//                   alt="preview"
//                   className="w-full h-24 object-cover rounded-md border"
//                 />
//                 <button
//                   onClick={() =>
//                     setImages(images.filter((_, i) => i !== index))
//                   }
//                   className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded hover:bg-red-600 transition"
//                 >
//                   ✕
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Action Buttons */}
//       <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 pb-8">
//         <div className="flex gap-4 justify-center sm:justify-start">
//           <button
//             onClick={() => window.location.reload()}
//             className="px-6 py-2 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer hover:bg-red-50 transition"
//           >
//             Cancel
//           </button>
//           <button className="px-6 py-2 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-purple-600 transition">
//             <img
//               src="/icons/SaveDraftIcon.svg"
//               alt="drug"
//               className="w-5 h-5 rounded-md object-cover"
//             />
//             Save Draft
//           </button>
//         </div>
//         <div className="flex justify-center sm:justify-end">
//           <button
//             type="button"
//             onClick={handleSubmit}
//             className="px-8 py-2 bg-[#4B0082] text-white rounded-lg font-semibold hover:bg-purple-800 transition"
//           >
//             Submit
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ConsumableForm;