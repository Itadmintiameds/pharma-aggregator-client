"use client";

import CategoryButtons from "@/src/app/commonComponents/CategoryButtons";
import Input from "@/src/app/commonComponents/Input";
import { drugProductSchema } from "@/src/schema/product/DrugProductSchema";
import {
  getDosage,
  getDrugCategory,
  getProductById,
  getTherapeuticSubcategory,
  uploadProductImages,
  updateProduct,
} from "@/src/services/product/ProductService";
import { DashboardView } from "@/src/types/seller/dashboard";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import UpdateSuccessModal from "../commonComponent/UpdateSuccessModal";

// Import the dedicated forms for consumable / non-consumable
import ConsumableForm, { ConsumableFormInitialData } from "./ConsumableForm";
import NonConsumableForm, { NonConsumableFormInitialData } from "./NonConsumableForm";

interface SelectOption {
  value: string;
  label: string;
}

interface EditProductProps {
  productId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  setCurrentView?: (view: DashboardView) => void;
  setSelectedProductId?: (id: string) => void;
}

const EditProduct = ({
  productId,
  onSuccess,
  onCancel,
  setCurrentView,
  setSelectedProductId,
}: EditProductProps) => {
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // 1. State for the hardcoded DRUG form (unchanged)
  // ─────────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Drugs");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    productCategoryId: "1",
    productAttributeId: "",
    productName: "",
    therapeuticCategory: "",
    therapeuticSubcategory: "",
    dosageForm: "",
    strength: "",
    warningsPrecautions: "",
    productDescription: "",
    productMarketingUrl: "",

    molecules: [
      {
        moleculeId: null as number | null,
        moleculeName: "",
        mechanismOfAction: "",
        primaryUse: "",
      },
    ],

    packagingId: "",
    packagingUnit: "",
    numberOfUnits: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",

    pricingId: "",
    batchLotNumber: "",
    manufacturerName: "",
    manufacturingDate: null as Date | null,
    expiryDate: null as Date | null,
    storageCondition: "",
    stockQuantity: "",
    pricePerUnit: "",
    mrp: "",
    createdDate: new Date(),
    gstPercentage: "",
    discountPercentage: "",
    minimumPurchaseQuantity: "",
    additionalDiscount: "",
    finalPrice: "",
    hsnCode: "",
  });

  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [dosageOptions, setDosageOptions] = useState<any[]>([]);
  const [loadingDosage, setLoadingDosage] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // ─────────────────────────────────────────────────────────────────
  // 2. State for CONSUMABLE / NON-CONSUMABLE (dedicated forms)
  // ─────────────────────────────────────────────────────────────────
  const [consumableData, setConsumableData] = useState<ConsumableFormInitialData | null>(null);
  const [nonConsumableData, setNonConsumableData] = useState<NonConsumableFormInitialData | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // 3. Fetch product and decide which UI to show
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);

      try {
        const data = await getProductById(productId);
        if (!data) throw new Error("Product not found");

        const cat: number = data.categoryId;
        setCategoryId(cat);

        // ----- DRUG (category 1) : populate hardcoded drug form state -----
        if (cat === 1) {
          const pricing = data.pricingDetails?.[0] || {};
          const packaging = data.packagingDetails || {};
          const therapeuticCategoryId = data.productAttributeDrugs?.[0]?.therapeuticCategoryId || "1";
          const therapeuticSubcategoryId = data.productAttributeDrugs?.[0]?.therapeuticSubcategoryId || "";
          const dosageFormValue = data.productAttributeDrugs?.[0]?.dosageForm || "";
          const strengthValue = String(data.productAttributeDrugs?.[0]?.strength ?? "");
          const productAttributeId = data.productAttributeDrugs?.[0]?.productAttributeId || "";

          setForm({
            productId: data.productId || "",
            productCategoryId: "1",
            productAttributeId: productAttributeId,
            productName: data.productName || "",
            therapeuticCategory: String(therapeuticCategoryId),
            therapeuticSubcategory: therapeuticSubcategoryId,
            dosageForm: dosageFormValue,
            strength: strengthValue,
            warningsPrecautions: data.warningsPrecautions || "",
            productDescription: data.productDescription || "",
            productMarketingUrl: data.productMarketingUrl || "",
            molecules:
              data.molecules?.length > 0
                ? data.molecules.map((m: any) => ({
                    moleculeId: m.moleculeId ?? null,
                    moleculeName: m.moleculeName ?? "",
                    mechanismOfAction: m.mechanismOfAction ?? "",
                    primaryUse: m.primaryUse ?? "",
                  }))
                : [{ moleculeId: null, moleculeName: "", mechanismOfAction: "", primaryUse: "" }],
            packagingUnit: packaging.packagingUnit || "",
            numberOfUnits: String(packaging.numberOfUnits ?? ""),
            packSize: String(packaging.packSize ?? ""),
            minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
            maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
            packagingId: packaging.packagingId || "",
            pricingId: pricing.pricingId || "",
            batchLotNumber: pricing.batchLotNumber || "",
            manufacturerName: pricing.manufacturerName || "",
            manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
            expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
            storageCondition: pricing.storageCondition || "",
            stockQuantity: String(pricing.stockQuantity ?? ""),
            pricePerUnit: String(pricing.pricePerUnit ?? ""),
            mrp: String(pricing.mrp ?? ""),
            createdDate: pricing.createdDate ? new Date(pricing.createdDate) : new Date(),
            gstPercentage: String(pricing.gstPercentage ?? ""),
            discountPercentage: String(pricing.discountPercentage ?? ""),
            minimumPurchaseQuantity: String(pricing.minimumPurchaseQuantity ?? ""),
            additionalDiscount: String(pricing.additionalDiscount ?? ""),
            finalPrice: String(pricing.finalPrice ?? ""),
            hsnCode: String(pricing.hsnCode ?? ""),
          });

          if (data.productImages && data.productImages.length > 0) {
            setExistingImages(data.productImages.map((img: any) => img.productImage || img));
          }
        }

        // ----- CONSUMABLE (category 5) : build data for ConsumableForm -----
        else if (cat === 5) {
          const pricing = data.pricingDetails?.[0] ?? {};
          const packaging = data.packagingDetails ?? {};
          const attr = data.productAttributeConsumableMedicals?.[0] ?? {};
          const additionalDiscounts = pricing.additionalDiscounts ?? [];

          setConsumableData({
            productId: data.productId ?? "",
            productAttributeId: attr.productAttributeId ?? "",
            productName: data.productName ?? "",
            productDescription: data.productDescription ?? "",
            warningsPrecautions: data.warningsPrecautions ?? "",
            productMarketingUrl: data.productMarketingUrl ?? "",
            manufacturerName: attr.manufacturerName ?? data.manufacturerName ?? "",
            brandName: attr.brandName ?? "",
            deviceCatId: attr.deviceCatId ?? "",
            deviceSubCatId: attr.deviceSubCatId ?? "",
            dimensionSize: attr.dimensionSize ?? "",
            disposalOrReusable: attr.disposalOrReusable ?? "",
            keyFeaturesSpecifications: attr.keyFeaturesSpecifications ?? "",
            materialTypeId: attr.materialTypeId ?? [],
            purpose: attr.purpose ?? "",
            safetyInstructions: attr.safetyInstructions ?? data.warningsPrecautions ?? "",
            shelfLife: attr.shelfLife ?? "",
            sterileOrNonSterile: attr.sterileOrNonSterile ?? "",
            storageConditionId: attr.storageConditionId ?? "",
            countryId: attr.countryId ?? "",
            packagingId: packaging.packagingId ?? "",
            packId: packaging.packId ?? "",
            unitPerPack: String(packaging.unitPerPack ?? ""),
            numberOfPacks: String(packaging.numberOfPacks ?? ""),
            packSize: String(packaging.packSize ?? ""),
            minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
            maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
            pricingId: pricing.pricingId ?? "",
            batchLotNumber: pricing.batchLotNumber ?? "",
            manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
            expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
            dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : null,
            stockQuantity: String(pricing.stockQuantity ?? ""),
            sellingPrice: String(pricing.sellingPrice ?? ""),
            mrp: String(pricing.mrp ?? ""),
            gstPercentage: String(pricing.gstPercentage ?? ""),
            discountPercentage: String(pricing.discountPercentage ?? ""),
            additionalDiscounts,
            finalPrice: String(pricing.finalPrice ?? ""),
            hsnCode: String(pricing.hsnCode ?? ""),
            existingImages: (data.productImages ?? []).map((img: any) => img.productImage ?? img),
            existingBrochureUrl: attr.brochurePath ?? attr.productBrochureUrl ?? "",
            existingCertifications: (attr.certificateDocuments ?? []).map((c: any) => ({
              certificationId: c.certificationId,
              label: c.certificationName ?? `Certification ${c.certificationId}`,
              url: c.certificateUrl ?? "",
            })),
          });
        }

        // ----- NON-CONSUMABLE (category 6) : build data for NonConsumableForm -----
        else if (cat === 6) {
          const pricing = data.pricingDetails?.[0] ?? {};
          const packaging = data.packagingDetails ?? {};
          const attr = data.productAttributeNonConsumableMedicals?.[0] ?? {};
          const additionalDiscounts = pricing.additionalDiscounts ?? [];

          setNonConsumableData({
            productId: data.productId ?? "",
            productAttributeId: attr.productAttributeId ?? "",
            productName: data.productName ?? "",
            productDescription: data.productDescription ?? "",
            warningsPrecautions: data.warningsPrecautions ?? "",
            productMarketingUrl: data.productMarketingUrl ?? "",
            manufacturerName: attr.manufacturerName ?? data.manufacturerName ?? "",
            brandName: attr.brandName ?? "",
            deviceCategoryId: attr.deviceCategoryId ?? "",
            deviceSubCategoryId: attr.deviceSubCategoryId ?? "",
            modelName: attr.modelName ?? "",
            modelNumber: attr.modelNumber ?? "",
            keyFeaturesSpecifications: attr.keyFeaturesSpecifications ?? "",
            materialTypeIds: attr.materialTypeIds ?? [],
            purpose: attr.purpose ?? "",
            powerSourceId: attr.powerSourceId ?? "",
            storageConditionId: attr.storageConditionId ?? "",
            countryId: attr.countryId ?? "",
            warrantyPeriod: String(attr.warrantyPeriod ?? ""),
            udiNumber: attr.udiNumber ?? "",
            serviceAvailability: attr.serviceAvailability ?? false,
            deviceClassification: attr.deviceClassification ?? "",
            packagingId: packaging.packagingId ?? "",
            packId: packaging.packId ?? "",
            unitPerPack: String(packaging.unitPerPack ?? ""),
            numberOfPacks: String(packaging.numberOfPacks ?? ""),
            packSize: String(packaging.packSize ?? ""),
            minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
            maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
            pricingId: pricing.pricingId ?? "",
            batchLotNumber: pricing.batchLotNumber ?? "",
            manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
            expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
            dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : null,
            stockQuantity: String(pricing.stockQuantity ?? ""),
            sellingPrice: String(pricing.sellingPrice ?? ""),
            mrp: String(pricing.mrp ?? ""),
            gstPercentage: String(pricing.gstPercentage ?? ""),
            discountPercentage: String(pricing.discountPercentage ?? ""),
            additionalDiscounts,
            finalPrice: String(pricing.finalPrice ?? ""),
            hsnCode: String(pricing.hsnCode ?? ""),
            existingImages: (data.productImages ?? []).map((img: any) => img.productImage ?? img),
            existingBrochureUrl: attr.brochurePath ?? "",
            existingCertifications: (attr.certificateDocuments ?? []).map((c: any) => ({
              certificationId: c.certificationId,
              label: c.certificationName ?? `Certification ${c.certificationId}`,
              url: c.certificateUrl ?? "",
            })),
          });
        }
      } catch (err) {
        console.error("Error loading product:", err);
        alert("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // ─────────────────────────────────────────────────────────────────
  // 4. Drug‑specific hooks (unchanged)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await getDrugCategory();
        const options = data.map((cat: any) => ({
          value: cat.categoryId,
          label: cat.categoryName,
        }));
        setCategoryOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDosage = async () => {
      try {
        setLoadingDosage(true);
        const data = await getDosage();
        const options = data.map((d: any) => ({ value: d.dosageName, label: d.dosageName }));
        setDosageOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDosage(false);
      }
    };
    fetchDosage();
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!form.therapeuticCategory) {
        setSubcategoryOptions([]);
        return;
      }
      try {
        setLoadingSubcategories(true);
        const data = await getTherapeuticSubcategory(form.therapeuticCategory);
        const options = data.map((sub: any) => ({
          value: sub.subcategoryId,
          label: sub.subcategoryName,
        }));
        setSubcategoryOptions(options);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, [form.therapeuticCategory]);

  // Drug form handlers (unchanged)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTherapeuticCategoryChange = (selected: SelectOption | null) => {
    setForm({
      ...form,
      therapeuticCategory: selected ? String(selected.value) : "",
      therapeuticSubcategory: "",
    });
  };

  const handleSubcategoryChange = (selected: SelectOption | null) => {
    setForm((prev) => ({ ...prev, therapeuticSubcategory: selected ? selected.value : "" }));
  };

  const handleDosageChange = (selected: any) => {
    setForm((prev) => ({ ...prev, dosageForm: selected ? selected.value : "" }));
  };

  const handleMoleculeChange = (index: number, value: string) => {
    const updated = [...form.molecules];
    updated[index].moleculeName = value;
    setForm({ ...form, molecules: updated });
  };

  const addMoleculeField = () => {
    setForm({
      ...form,
      molecules: [
        ...form.molecules,
        { moleculeId: null, moleculeName: "", mechanismOfAction: "", primaryUse: "" },
      ],
    });
  };

  const calculateFinalPrice = (mrp: string, discount: string, additionalDiscount: string) => {
    const mrpValue = parseFloat(mrp);
    const discountValue = parseFloat(discount);
    const additionalDiscountValue = parseFloat(additionalDiscount);
    if (isNaN(mrpValue)) return "";
    let price = mrpValue;
    if (!isNaN(discountValue)) price = price - (price * discountValue) / 100;
    if (!isNaN(additionalDiscountValue)) price = price - (price * additionalDiscountValue) / 100;
    return price.toFixed(2);
  };

  const toLocalDateTimeString = (date: Date | null): string | null => {
    if (!date) return null;
    const now = new Date();
    const combined = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    return combined.toISOString().slice(0, 19);
  };

  const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const formWithCategory = { ...form, productCategoryId: "1" };
    const validation = drugProductSchema.safeParse(formWithCategory);
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
      const moleculeIds = form.molecules
        .map((m) => m.moleculeId)
        .filter((id): id is number => id !== null && id !== undefined);

      const payload = {
        productName: form.productName,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl,
        warningsPrecautions: form.warningsPrecautions,
        categoryId: 1,
        molecules: moleculeIds.map((id) => ({ moleculeId: id.toString() })),
        packagingDetails: {
          packagingUnit: form.packagingUnit,
          numberOfUnits: Number(form.numberOfUnits),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },
        pricingDetails: [
          {
            pricingId: form.pricingId || undefined,
            batchLotNumber: form.batchLotNumber,
            manufacturerName: form.manufacturerName,
            manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
            expiryDate: toLocalDateTimeString(form.expiryDate),
            storageCondition: form.storageCondition,
            stockQuantity: Number(form.stockQuantity),
            pricePerUnit: Number(form.pricePerUnit),
            mrp: Number(form.mrp),
            gstPercentage: Number(form.gstPercentage),
            discountPercentage: Number(form.discountPercentage),
            minimumPurchaseQuantity: Number(form.minimumPurchaseQuantity),
            additionalDiscount: Number(form.additionalDiscount),
            finalPrice: Number(form.finalPrice),
            hsnCode: Number(form.hsnCode),
          },
        ],
        productAttributeDrugs: [
          {
            productAttributeId: form.productAttributeId || undefined,
            dosageForm: form.dosageForm,
            strength: String(form.strength),
            therapeuticCategoryId: String(form.therapeuticCategory || 1),
            therapeuticSubcategoryId: form.therapeuticSubcategory,
          },
        ],
      };

      await updateProduct(form.productId, payload as any);
      if (images.length > 0) await uploadProductImages(form.productId, images);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      alert(`Update failed: ${err.message || "Unknown error"}`);
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
    valueContainer: (base: any) => ({ ...base, padding: "0 16px", cursor: "pointer" }),
    indicatorsContainer: (base: any) => ({ ...base, height: "56px", cursor: "pointer" }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused ? "#4B0082" : "#737373",
      cursor: "pointer",
      "&:hover": { color: "#4B0082" },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? "#4B0082" : state.isFocused ? "#F3E8FF" : "white",
      color: state.isSelected ? "white" : "#1E1E1E",
      cursor: "pointer",
      "&:active": { backgroundColor: "#4B0082", color: "white" },
    }),
    placeholder: (base: any) => ({ ...base, color: "#A3A3A3" }),
    singleValue: (base: any) => ({ ...base, color: "#1E1E1E" }),
  });

  const selectTheme = (theme: any) => ({
    ...theme,
    colors: { ...theme.colors, primary: "#4B0082", primary25: "#F3E8FF", primary50: "#E9D5FF" },
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Shared success/cancel handlers
  // ─────────────────────────────────────────────────────────────────
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    if (setSelectedProductId && setCurrentView) {
      setSelectedProductId(productId);
      setCurrentView("productView");
    } else {
      setCurrentView?.("overview");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    setCurrentView?.("overview");
  };

  // ─────────────────────────────────────────────────────────────────
  // 6. Render based on categoryId
  // ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto" />
          <p className="mt-4 text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  // ----- DRUG (category 1) : render the existing hardcoded form -----
  if (categoryId === 1) {
    // All the original JSX from your second component goes here.
    // (I've kept it exactly as you had it, only wrapped in this condition)
    return (
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-h2 font-normal">Edit Product</div>
          {showForm && (
            <div>
              <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
                <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">
                  Product Details
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
                  {/* Therapeutic Category */}
                  <div className="flex flex-col gap-1">
                    <label className="text-label-l3 text-neutral-700 font-semibold">
                      Therapeutic Category <span className="text-warning-500">*</span>
                    </label>
                    <Select
                      options={categoryOptions}
                      isLoading={loadingCategories}
                      value={categoryOptions.find((o) => o.value === form.therapeuticCategory)}
                      onChange={handleTherapeuticCategoryChange}
                      placeholder="Select category"
                      theme={selectTheme}
                      styles={selectStyles("therapeuticCategory")}
                    />
                    {errors.therapeuticCategory && <p className="text-red-500 text-sm mt-1">{errors.therapeuticCategory}</p>}
                  </div>
                  {/* Subcategory */}
                  <div className="flex flex-col gap-1">
                    <label className="text-label-l3 text-neutral-700 font-semibold">
                      Therapeutic Subcategory <span className="text-warning-500">*</span>
                    </label>
                    <Select
                      options={subcategoryOptions}
                      isLoading={loadingSubcategories}
                      value={subcategoryOptions.find((o) => o.value === form.therapeuticSubcategory)}
                      onChange={handleSubcategoryChange}
                      placeholder={form.therapeuticCategory ? "Select subcategory" : "Select a category first"}
                      isDisabled={!form.therapeuticCategory}
                      theme={selectTheme}
                      styles={selectStyles("therapeuticSubcategory")}
                    />
                    {errors.therapeuticSubcategory && <p className="text-red-500 text-sm mt-1">{errors.therapeuticSubcategory}</p>}
                  </div>
                  {/* Product Name */}
                  <Input
                    label="Product Name"
                    name="productName"
                    placeholder="e.g., Paracetamol"
                    onChange={handleChange}
                    value={form.productName}
                    error={errors.productName}
                    required
                  />
                  {/* Dosage Form */}
                  <div className="flex flex-col gap-1">
                    <label className="text-label-l3 text-neutral-700 font-semibold">
                      Dosage Form (Tablet, Syrup) <span className="text-warning-500">*</span>
                    </label>
                    <Select
                      options={dosageOptions}
                      isLoading={loadingDosage}
                      value={dosageOptions.find((o) => o.value === form.dosageForm)}
                      onChange={handleDosageChange}
                      placeholder="Select dosage"
                      theme={selectTheme}
                      styles={selectStyles("dosageForm")}
                    />
                    {errors.dosageForm && <p className="text-red-500 text-sm mt-1">{errors.dosageForm}</p>}
                  </div>
                  {/* Strength */}
                  <Input
                    label="Strength (mg/ml)"
                    name="strength"
                    placeholder="e.g., 650 mg"
                    value={form.strength}
                    onChange={handleChange}
                    error={errors.strength}
                    required
                  />
                  {/* Marketing URL */}
                  <Input
                    label="Marketing URL"
                    name="productMarketingUrl"
                    placeholder="https://"
                    value={form.productMarketingUrl}
                    onChange={handleChange}
                    error={errors.productMarketingUrl}
                    required
                  />
                  {/* Molecules */}
                  <div className="col-span-2">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {form.molecules.map((molecule, index) => (
                        <div key={index} className="flex items-end gap-2">
                          <div className="flex-1">
                            <Input
                              label={`Molecule ${index + 1}`}
                              name={`molecule-${index}`}
                              placeholder="e.g., Paracetamol"
                              required
                              value={molecule.moleculeName}
                              onChange={(e) => handleMoleculeChange(index, e.target.value)}
                            />
                          </div>
                          {index === form.molecules.length - 1 && (
                            <button
                              type="button"
                              onClick={addMoleculeField}
                              className="h-14 w-14 bg-[#4B0082] rounded-lg flex items-center justify-center cursor-pointer"
                            >
                              <img src="/icons/PlusIcon.svg" alt="Add" className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {form.molecules.some((m) => m.mechanismOfAction || m.primaryUse) && (
                      <div className="col-span-2 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm space-y-4 mt-4">
                        {form.molecules.some((m) => m.mechanismOfAction) && (
                          <div>
                            <div className="font-semibold text-purple-900">Mechanism of Action</div>
                            <div className="text-neutral-700 mt-1">
                              {form.molecules.filter((m) => m.mechanismOfAction).map((m) => m.mechanismOfAction).join(" & ")}
                            </div>
                          </div>
                        )}
                        {form.molecules.some((m) => m.primaryUse) && (
                          <div>
                            <div className="font-semibold text-purple-900">Primary Use</div>
                            <div className="text-neutral-700 mt-1">
                              {form.molecules.filter((m) => m.primaryUse).map((m) => m.primaryUse).join(" & ")}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Warnings & Precautions */}
                  <div>
                    <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                      Warnings & Precautions <span className="text-warning-500">*</span>
                    </label>
                    <textarea
                      name="warningsPrecautions"
                      value={form.warningsPrecautions}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full h-36 rounded-2xl p-3 resize-none border ${errors.warningsPrecautions ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none`}
                    />
                    {errors.warningsPrecautions && <p className="text-red-500 text-sm mt-1">{errors.warningsPrecautions}</p>}
                  </div>
                  {/* Product Description */}
                  <div>
                    <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                      Product Description <span className="text-warning-500">*</span>
                    </label>
                    <textarea
                      name="productDescription"
                      value={form.productDescription}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full h-36 rounded-2xl p-3 resize-none border ${errors.productDescription ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none`}
                    />
                    {errors.productDescription && <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>}
                  </div>
                </div>
              </div>

              {/* Packaging & Order Details */}
              <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
                <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">Packaging & Order Details</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
                  <div className="col-span-2">
                    <Input
                      label="Packaging Unit"
                      name="packagingUnit"
                      placeholder="Strip, Bottle"
                      value={form.packagingUnit}
                      onChange={handleChange}
                      error={errors.packagingUnit}
                      required
                    />
                  </div>
                  <Input label="Number of Units" name="numberOfUnits" value={form.numberOfUnits} onChange={handleChange} error={errors.numberOfUnits} required />
                  <Input label="Pack Size" name="packSize" value={form.packSize} onChange={handleChange} error={errors.packSize} required />
                  <Input label="Min Order Qty" name="minimumOrderQuantity" value={form.minimumOrderQuantity} onChange={handleChange} error={errors.minimumOrderQuantity} required />
                  <Input label="Max Order Qty" name="maximumOrderQuantity" value={form.maximumOrderQuantity} onChange={handleChange} error={errors.maximumOrderQuantity} required />
                </div>
              </div>

              {/* Batch, Stock, Pricing */}
              <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
                <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">Batch, Stock Entry, Pricing & Tax Details</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
                  <Input label="Batch/Lot Number" name="batchLotNumber" value={form.batchLotNumber} onChange={handleChange} error={errors.batchLotNumber} required />
                  <Input label="Manufacturer Name" name="manufacturerName" value={form.manufacturerName} onChange={handleChange} error={errors.manufacturerName} required />
                  <Input
                    label="Manufacturing Date" type="date" name="manufacturingDate"
                    value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setForm({ ...form, manufacturingDate: new Date(e.target.value) })}
                    error={errors.manufacturingDate} required
                  />
                  <Input
                    label="Expiry Date" type="date" name="expiryDate"
                    value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setForm({ ...form, expiryDate: new Date(e.target.value) })}
                    error={errors.expiryDate} required
                  />
                  <Input label="Storage Condition" name="storageCondition" value={form.storageCondition} onChange={handleChange} error={errors.storageCondition} required />
                  <Input label="Stock Quantity" name="stockQuantity" value={form.stockQuantity} onChange={handleChange} error={errors.stockQuantity} required />
                  <Input label="Price Per Unit" name="pricePerUnit" value={form.pricePerUnit} onChange={handleChange} error={errors.pricePerUnit} required />
                  <Input
                    label="MRP" name="mrp" value={form.mrp}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        mrp: value,
                        finalPrice: calculateFinalPrice(value, prev.discountPercentage, prev.additionalDiscount),
                      }));
                    }}
                    error={errors.mrp} required
                  />
                  <Input
                    label="Date of Entry" type="date" name="createdDate"
                    value={form.createdDate ? form.createdDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setForm({ ...form, createdDate: new Date(e.target.value) })}
                    error={errors.createdDate} required
                  />
                  <Input label="GST %" name="gstPercentage" value={form.gstPercentage} onChange={handleChange} error={errors.gstPercentage} required />
                  <Input
                    label="Discount Percentage" name="discountPercentage" value={form.discountPercentage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        discountPercentage: value,
                        finalPrice: calculateFinalPrice(prev.mrp, value, prev.additionalDiscount),
                      }));
                    }}
                    error={errors.discountPercentage} required
                  />
                  <div className="py-2 text-label-l4 font-semibold col-span-2">Additional Discount (Quantity-based)</div>
                  <Input label="Minimum Purchase Quantity" name="minimumPurchaseQuantity" value={form.minimumPurchaseQuantity} onChange={handleChange} error={errors.minimumPurchaseQuantity} />
                  <Input
                    label="Discount Percentage %" name="additionalDiscount" value={form.additionalDiscount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        additionalDiscount: value,
                        finalPrice: calculateFinalPrice(prev.mrp, prev.discountPercentage, value),
                      }));
                    }}
                  />
                  <Input label="Final Price" name="finalPrice" value={form.finalPrice} disabled required />
                  <Input label="HSN Code" name="hsnCode" value={form.hsnCode} onChange={handleChange} error={errors.hsnCode} required />
                </div>

                {/* Image Upload */}
                <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg cursor-pointer" onClick={() => document.getElementById("fileInput")?.click()}>
                  <input id="fileInput" type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && setImages(Array.from(e.target.files))} />
                  <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
                    <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center">
                        <img src="/icons/FolderIcon.svg" alt="drug" className="w-10 h-10 rounded-md object-cover" />
                        <div className="text-label-l2 font-normal mt-4">Choose a file or drag & drop it here</div>
                        <div className="text-label-l1 font-normal text-neutral-400">or click to browse JPEG, PNG, and Pdf</div>
                      </div>
                    </div>
                  </div>
                </div>
                {existingImages.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-2">Existing Images:</div>
                    <div className="grid grid-cols-4 gap-3">
                      {existingImages.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt={`product-${idx}`} className="w-full h-24 object-cover rounded-md border" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {images.length > 0 && <div className="mt-2 text-green-600 text-sm">✅ {images.length} new image(s) will be added</div>}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {images.map((file, idx) => (
                      <div key={idx} className="relative">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-24 object-cover rounded-md border" />
                        <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between mt-6 col-span-2">
                  <div className="space-x-6 flex">
                    <button type="button" onClick={handleCancel} className="w-21 h-12 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer">Cancel</button>
                    <button type="button" className="w-35.25 h-12 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5">
                      <img src="/icons/SaveDraftIcon.svg" alt="drug" className="w-5 h-5 rounded-md object-cover" /> Save Draft
                    </button>
                  </div>
                  <div>
                    <button type="button" onClick={handleUpdate} className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer hover:bg-[#3a0068] transition-colors">Update</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {showSuccessModal && (
          <UpdateSuccessModal
            onClose={() => setShowSuccessModal(false)}
            onViewProduct={() => {
              setShowSuccessModal(false);
              if (setSelectedProductId) setSelectedProductId(form.productId);
              if (setCurrentView) setCurrentView("productView");
            }}
            onContinueEditing={() => setShowSuccessModal(false)}
            onBackToDashboard={() => {
              setShowSuccessModal(false);
              if (setCurrentView) setCurrentView("overview");
            }}
          />
        )}
      </div>
    );
  }

  // ----- CONSUMABLE (category 5) -----
  if (categoryId === 5 && consumableData) {
    return (
      <ConsumableForm
        deviceType="consumable"
        mode="edit"
        initialData={consumableData}
        onSubmitSuccess={handleSuccess}
      />
    );
  }

  // ----- NON-CONSUMABLE (category 6) -----
  if (categoryId === 6 && nonConsumableData) {
    return (
      <NonConsumableForm
        deviceType="non-consumable"
        mode="edit"
        initialData={nonConsumableData}
        onSubmitSuccess={handleSuccess}
      />
    );
  }

  // Fallback for unsupported categories
  if (categoryId !== null && ![1, 5, 6].includes(categoryId)) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>Editing is not supported for this product category (ID: {categoryId}).</p>
        <button onClick={handleCancel} className="mt-4 px-6 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50">Go Back</button>
      </div>
    );
  }

  return null;
};

export default EditProduct;