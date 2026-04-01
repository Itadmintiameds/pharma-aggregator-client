"use client"

import React, { useEffect, useState } from "react";
import Select from "react-select";
import Input from "@/src/app/commonComponents/Input";
import CategoryButtons from "@/src/app/commonComponents/CategoryButtons";
import { consumableDeviceSchema } from "@/src/schema/product/ConsumableDeviceSchema";

interface SelectOption {
  value: string;
  label: string;
}

const AddConsumableDevice = () => {
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
    certifications: "",
    cdscoNumber: "",
    iso13485: false,
    ce: false,
    bis: false,
    countryOfOrigin: "",
    manufacturerName: "",
    productDescription: "",
    storageCondition: "",
    productBrochureUrl: "",

    // Packaging Details
    packType: "",
    unitsPerPack: "",
    numberOfPacks: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",

    // Batch & Stock Details
    batchLotNumber: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    stockQuantity: "",
    dateOfStockEntry: new Date(),

    // Pricing & Tax Details
    sellingPricePerPack: "",
    mrp: "",
    discountPercentage: "",
    additionalDiscount: "",
    minimumPurchaseQuantity: "",
    additionalDiscountPercentage: "",
    effectiveStartDate: null as Date | null,
    effectiveStartTime: "",
    effectiveEndDate: null as Date | null,
    effectiveEndTime: "",
    gstPercentage: "",
    finalPrice: "",
    hsnCode: "",
  });

  const [deviceCategoryOptions, setDeviceCategoryOptions] = useState<SelectOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "delete">("create");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [brochure, setBrochure] = useState<File | null>(null);

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

  // Pack Type options
  const packTypeOptions = [
    { value: "box", label: "Box" },
    { value: "pouch", label: "Pouch" },
    { value: "strip", label: "Strip" },
    { value: "roll", label: "Roll" },
    { value: "bottle", label: "Bottle" },
  ];

  // Device Category options (you'll need to fetch these from API)
  const deviceCategories = [
    { value: "syringe", label: "Syringe" },
    { value: "mask", label: "Mask" },
    { value: "gloves", label: "Gloves" },
    { value: "bandage", label: "Bandage" },
    { value: "test-strip", label: "Test Strip" },
    { value: "catheter", label: "Catheter" },
    { value: "gauze", label: "Gauze" },
    { value: "swab", label: "Swab" },
    { value: "thermometer", label: "Thermometer" },
    { value: "stethoscope", label: "Stethoscope" },
  ];

  const handleCategorySelect = () => {
    setShowForm(true);
  };

  useEffect(() => {
    // Fetch device categories from API
    const fetchDeviceCategories = async () => {
      setLoadingCategories(true);
      try {
        // Replace with actual API call
        // const data = await getDeviceCategories();
        // const options = data.map((cat: any) => ({
        //   value: cat.categoryId,
        //   label: cat.categoryName,
        // }));
        // setDeviceCategoryOptions(options);
        
        // Using mock data for now
        setDeviceCategoryOptions(deviceCategories);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchDeviceCategories();
  }, []);

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

  const calculatePackSize = () => {
    const units = parseFloat(form.unitsPerPack);
    const packs = parseFloat(form.numberOfPacks);
    if (!isNaN(units) && !isNaN(packs)) {
      const calculated = units * packs;
      setForm({ ...form, packSize: calculated.toString() });
    }
  };

  const calculateFinalPrice = (
    mrp: string,
    discount: string,
    additionalDiscount: string
  ) => {
    const mrpValue = parseFloat(mrp);
    const discountValue = parseFloat(discount);
    const additionalDiscountValue = parseFloat(additionalDiscount);

    if (isNaN(mrpValue)) return "";

    let price = mrpValue;

    if (!isNaN(discountValue)) {
      price = price - (price * discountValue) / 100;
    }

    if (!isNaN(additionalDiscountValue)) {
      price = price - (price * additionalDiscountValue) / 100;
    }

    return price.toFixed(2);
  };

  useEffect(() => {
    calculatePackSize();
  }, [form.unitsPerPack, form.numberOfPacks]);

  useEffect(() => {
    const finalPrice = calculateFinalPrice(
      form.mrp,
      form.discountPercentage,
      form.additionalDiscountPercentage || "0"
    );
    setForm((prev) => ({ ...prev, finalPrice }));
  }, [form.mrp, form.discountPercentage, form.additionalDiscountPercentage]);

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
        effectiveStartDate: form.effectiveStartDate?.toISOString(),
        effectiveEndDate: form.effectiveEndDate?.toISOString(),
        unitsPerPack: Number(form.unitsPerPack),
        numberOfPacks: Number(form.numberOfPacks),
        packSize: Number(form.packSize),
        minimumOrderQuantity: Number(form.minimumOrderQuantity),
        maximumOrderQuantity: Number(form.maximumOrderQuantity),
        stockQuantity: Number(form.stockQuantity),
        sellingPricePerPack: Number(form.sellingPricePerPack),
        mrp: Number(form.mrp),
        discountPercentage: Number(form.discountPercentage),
        additionalDiscountPercentage: Number(form.additionalDiscountPercentage || 0),
        gstPercentage: Number(form.gstPercentage),
        hsnCode: Number(form.hsnCode),
      };

      console.log("Payload:", payload);
      // await createConsumableDevice(payload);
      
      // Upload images and brochure
      if (images.length > 0) {
        // await uploadProductImages(productId, images);
      }
      if (brochure) {
        // await uploadBrochure(productId, brochure);
      }

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
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-h2 font-normal">Add Consumable Device</div>
        <CategoryButtons onSelect={handleCategorySelect} />
        {!showForm && (
          <div className="flex flex-col items-center mt-20 gap-10">
            <img src="/AddProdImg.svg" className="w-[330px] h-[329px]" />
            <p className="text-p4 font-normal">
              Start by adding your consumable devices and medical supplies
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <div>
          {/* Product Details Section */}
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">
              Product Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
              <Input
                label="Product Name"
                name="productName"
                placeholder="e.g., Surgical Mask Level 3"
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
                label="Brand Name"
                name="brandName"
                placeholder="e.g., 3M, Johnson & Johnson"
                onChange={handleChange}
                value={form.brandName}
                error={errors.brandName}
                required
              />

              <Input
                label="Material Type"
                name="materialType"
                placeholder="e.g., Non-woven fabric, Latex-free"
                onChange={handleChange}
                value={form.materialType}
                error={errors.materialType}
                required
              />

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
                  Sterile Status
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <Select
                  options={sterileOptions}
                  value={
                    sterileOptions.find((o) => o.value === form.sterileStatus) ||
                    null
                  }
                  onChange={(selected) =>
                    handleSelectChange("sterileStatus", selected)
                  }
                  placeholder="Select sterile status"
                  theme={selectTheme}
                  styles={selectStyles("sterileStatus")}
                />
                {errors.sterileStatus && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.sterileStatus}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-l3 text-neutral-700 font-semibold">
                  Disposable / Reusable
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <Select
                  options={disposableOptions}
                  value={
                    disposableOptions.find(
                      (o) => o.value === form.disposableType
                    ) || null
                  }
                  onChange={(selected) =>
                    handleSelectChange("disposableType", selected)
                  }
                  placeholder="Select type"
                  theme={selectTheme}
                  styles={selectStyles("disposableType")}
                />
                {errors.disposableType && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.disposableType}
                  </p>
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

              <div className="col-span-2">
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Intended Use / Purpose
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="intendedUse"
                  placeholder="e.g., For surgical procedures, wound care, patient monitoring"
                  value={form.intendedUse}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full rounded-2xl p-3 resize-none overflow-y-auto border ${
                    errors.intendedUse
                      ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                      : "border-neutral-500 focus:border-[#4B0082]"
                  } focus:outline-none focus:ring-0`}
                />
                {errors.intendedUse && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.intendedUse}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Key Features / Specifications
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="keyFeatures"
                  placeholder="List key features, specifications, and unique selling points"
                  value={form.keyFeatures}
                  onChange={handleChange}
                  rows={3}
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

              <div className="col-span-2">
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Safety Instructions / Precautions
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="safetyInstructions"
                  placeholder="Enter safety warnings, precautions, and handling instructions"
                  value={form.safetyInstructions}
                  onChange={handleChange}
                  rows={3}
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

              <div className="col-span-2">
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Certifications / Compliance
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <div className="flex gap-6 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="iso13485"
                      checked={form.iso13485}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>ISO 13485</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="ce"
                      checked={form.ce}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>CE</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="bis"
                      checked={form.bis}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>BIS</span>
                  </label>
                </div>
                <Input
                  label="CDSCO Registration Number / Import License No."
                  name="cdscoNumber"
                  placeholder="Enter registration number if applicable"
                  onChange={handleChange}
                  value={form.cdscoNumber}
                />
              </div>

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

              <div className="col-span-2">
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

              <Input
                label="Storage Condition"
                name="storageCondition"
                placeholder="e.g., Store in cool dry place, 2-8°C"
                onChange={handleChange}
                value={form.storageCondition}
                error={errors.storageCondition}
                required
              />

              <div className="col-span-2">
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Product Brochure / User Manual (PDF/URL)
                </label>
                <div
                  className="w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors"
                  onClick={() => document.getElementById("brochureInput")?.click()}
                >
                  <input
                    id="brochureInput"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBrochure(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center">
                    <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10" />
                    <div className="text-label-l2 font-normal mt-2">
                      {brochure ? brochure.name : "Upload brochure or enter URL"}
                    </div>
                  </div>
                </div>
                <Input
                  name="productBrochureUrl"
                  placeholder="Or enter brochure URL"
                  onChange={handleChange}
                  value={form.productBrochureUrl}
                  className="mt-2" label={""}    
                />
              </div>
            </div>
          </div>

          {/* Packaging & Order Details */}
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">
              Packaging & Order Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
              <div className="flex flex-col gap-1">
                <label className="text-label-l3 text-neutral-700 font-semibold">
                  Pack Type
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <Select
                  options={packTypeOptions}
                  value={
                    packTypeOptions.find((o) => o.value === form.packType) ||
                    null
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
                label="Units per Pack"
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
                label="Pack Size (Auto-calculated)"
                name="packSize"
                value={form.packSize}
                disabled={true}
                required
              />

              <Input
                label="Minimum Order Quantity (MOQ)"
                name="minimumOrderQuantity"
                placeholder="Minimum quantity per order"
                onChange={handleChange}
                value={form.minimumOrderQuantity}
                error={errors.minimumOrderQuantity}
                required
              />

              <Input
                label="Maximum Order Quantity"
                name="maximumOrderQuantity"
                placeholder="Maximum quantity per order"
                onChange={handleChange}
                value={form.maximumOrderQuantity}
                error={errors.maximumOrderQuantity}
                required
              />
            </div>
          </div>

          {/* Batch, Stock, Pricing & Tax Details */}
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">
              Batch, Stock, Pricing & Tax Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
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
                label="Stock Quantity (in pack sizes)"
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
                  setForm({ ...form, dateOfStockEntry: new Date(e.target.value) })
                }
                value={
                  form.dateOfStockEntry
                    ? form.dateOfStockEntry.toISOString().split("T")[0]
                    : ""
                }
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
                label="Discount Percentage"
                name="discountPercentage"
                placeholder="e.g., 10"
                onChange={handleChange}
                value={form.discountPercentage}
                error={errors.discountPercentage}
                required
              />

              <div className="col-span-2">
                <div className="text-label-l4 font-semibold mb-2">
                  Additional Discount (Quantity-based)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Minimum Purchase Quantity"
                    name="minimumPurchaseQuantity"
                    placeholder="Min quantity to qualify"
                    onChange={handleChange}
                    value={form.minimumPurchaseQuantity}
                  />
                  <Input
                    label="Discount Percentage"
                    name="additionalDiscountPercentage"
                    placeholder="Additional discount %"
                    onChange={handleChange}
                    value={form.additionalDiscountPercentage}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-label-l4 font-semibold mb-2">
                  Effective Period
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Effective Start Date"
                    type="date"
                    name="effectiveStartDate"
                    onChange={(e) =>
                      setForm({ ...form, effectiveStartDate: new Date(e.target.value) })
                    }
                    value={
                      form.effectiveStartDate
                        ? form.effectiveStartDate.toISOString().split("T")[0]
                        : ""
                    }
                  />
                  <Input
                    label="Effective Start Time"
                    type="time"
                    name="effectiveStartTime"
                    onChange={handleChange}
                    value={form.effectiveStartTime}
                  />
                  <Input
                    label="Effective End Date"
                    type="date"
                    name="effectiveEndDate"
                    onChange={(e) =>
                      setForm({ ...form, effectiveEndDate: new Date(e.target.value) })
                    }
                    value={
                      form.effectiveEndDate
                        ? form.effectiveEndDate.toISOString().split("T")[0]
                        : ""
                    }
                  />
                  <Input
                    label="Effective End Time"
                    type="time"
                    name="effectiveEndTime"
                    onChange={handleChange}
                    value={form.effectiveEndTime}
                  />
                </div>
              </div>

              <Input
                label="GST %"
                name="gstPercentage"
                placeholder="e.g., 18"
                onChange={handleChange}
                value={form.gstPercentage}
                error={errors.gstPercentage}
                required
              />

              <Input
                label="Final Price (Auto-calculated)"
                name="finalPrice"
                value={form.finalPrice}
                disabled={true}
                required
              />

              <Input
                label="HSN Code"
                name="hsnCode"
                placeholder="HSN/SAC code"
                onChange={handleChange}
                value={form.hsnCode}
                error={errors.hsnCode}
                required
              />
            </div>

            {/* Image Upload Section */}
            <div
              className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg cursor-pointer"
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
              <div className="grid grid-cols-4 gap-3 mt-4">
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
                      className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between mt-6 col-span-2">
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
                  className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddConsumableDevice;