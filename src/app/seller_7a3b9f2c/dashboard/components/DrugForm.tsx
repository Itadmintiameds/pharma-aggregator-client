"use client";

import Input from "@/src/app/commonComponents/Input";
import { drugProductSchema } from "@/src/schema/product/DrugProductSchema";
import { getAllMolecules } from "@/src/services/product/MoleculeService";
import {
  createDrugProduct,
  drugProductDelete,
  getDosage,
  getMoleculeStrengthByDosage,
  getPackTypesByDosageId,
  getTherapeuticCategory,
  getTherapeuticSubcategory,
  updateProduct,
  uploadProductImages,
} from "@/src/services/product/ProductService";
import { AdditionalDiscountData } from "@/src/types/product/ProductData";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import CommonModal from "../commonComponent/CommonModal";
import AdditionalDiscount from "./AdditionalDiscount";

interface SelectOption {
  value: string;
  label: string;
}

// ─── Initial data shape passed in from EditProduct ────────────────────────────
export interface DrugFormInitialData {
  productId: string;
  productAttributeId?: string;
  productName: string;
  therapeuticCategoryId: string;
  therapeuticSubcategoryId: string;
  dosageForm: string;         // e.g. "Tablet"
  strength: string;
  warningsPrecautions: string;
  productDescription: string;
  productMarketingUrl: string;
  manufacturerName: string;
  molecules: {
    moleculeId: string;
    moleculeName: string;
    drugSchedule: string;
    mechanismOfAction: string;
    primaryUse: string;
    strength: string;
  }[];
  // packaging
  packagingId?: string;
  packId: string;
  packType: string;
  unitPerPack: string;
  numberOfPacks: string;
  packSize: string;
  minimumOrderQuantity: string;
  maximumOrderQuantity: string;
  // pricing
  pricingId?: string;
  batchLotNumber: string;
  manufacturingDate: Date | null;
  expiryDate: Date | null;
  dateOfStockEntry: Date;
  storageCondition: string;
  stockQuantity: string;
  sellingPrice: string;
  mrp: string;
  gstPercentage: string;
  discountPercentage: string;
  finalPrice: string;
  hsnCode: string;
  additionalDiscount: AdditionalDiscountData[];
  // existing images
  existingImages?: string[];
}

interface DrugFormProps {
  categoryId: number;
  mode?: "create" | "edit";
  initialData?: DrugFormInitialData;
  onSuccess?: () => void;
}

type FormState = {
  productId: string;
  categoryId: string;
  productName: string;
  productDescription: string;
  productMarketingUrl: string;
  warningsPrecautions: string;
  therapeuticCategoryId: string;
  therapeuticCategory: string;
  therapeuticSubcategoryId: string;
  therapeuticSubcategory: string;
  manufacturerName: string;
  dosageId: number | "";
  strength: string;
  molecules: {
    moleculeId: string;
    moleculeName: string;
    drugSchedule: string;
    mechanismOfAction: string;
    primaryUse: string;
    strength: string;
  }[];
  packId: string;
  packType: string;
  unitPerPack: string;
  numberOfPacks: string;
  packSize: string;
  minimumOrderQuantity: string;
  maximumOrderQuantity: string;
  pricingId: string;
  batchLotNumber: string;
  manufacturingDate: Date | null;
  expiryDate: Date | null;
  dateOfStockEntry: Date;
  storageCondition: string;
  stockQuantity: string;
  sellingPrice: string;
  mrp: string;
  gstPercentage: string;
  discountPercentage: string;
  finalPrice: string;
  hsnCode: string;
  additionalDiscount: AdditionalDiscountData[];
};

const emptyForm = (catId: number): FormState => ({
  productId: "",
  categoryId: String(catId),
  productName: "",
  productDescription: "",
  productMarketingUrl: "",
  warningsPrecautions: "",
  therapeuticCategoryId: "",
  therapeuticCategory: "",
  therapeuticSubcategoryId: "",
  therapeuticSubcategory: "",
  manufacturerName: "",
  dosageId: "",
  strength: "",
  molecules: [{ moleculeId: "", moleculeName: "", drugSchedule: "", mechanismOfAction: "", primaryUse: "", strength: "" }],
  packId: "",
  packType: "",
  unitPerPack: "",
  numberOfPacks: "",
  packSize: "",
  minimumOrderQuantity: "",
  maximumOrderQuantity: "",
  pricingId: "",
  batchLotNumber: "",
  manufacturingDate: null,
  expiryDate: null,
  dateOfStockEntry: new Date(),
  storageCondition: "",
  stockQuantity: "",
  sellingPrice: "",
  mrp: "",
  gstPercentage: "",
  discountPercentage: "",
  finalPrice: "",
  hsnCode: "",
  additionalDiscount: [],
});

export const DrugForm: React.FC<DrugFormProps> = ({
  categoryId,
  mode = "create",
  initialData,
  onSuccess,
}) => {
  const [form, setForm] = useState<FormState>(emptyForm(categoryId));
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const gstOptions = [
    { value: "0", label: "0%" },
    { value: "5", label: "5%" },
    { value: "12", label: "12%" },
    { value: "18", label: "18%" },
  ];

  const [therapeuticCategories, setTherapeuticCategories] = useState<SelectOption[]>([]);
  const [loadingTherapeuticCategories, setLoadingTherapeuticCategories] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [dosageOptions, setDosageOptions] = useState<{ value: number | string; label: string }[]>([]);
  const [loadingDosage, setLoadingDosage] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [moleculeOptions, setMoleculeOptions] = useState<{ value: any; label: string }[]>([]);
  const [loadingMolecules, setLoadingMolecules] = useState(false);
  const [packTypeOptions, setPackTypeOptions] = useState<{ value: any; label: string }[]>([]);
  const [strengthFormats, setStrengthFormats] = useState<string[]>([]);
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Populate form from initialData when editing ───────────────────────────
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        productId: initialData.productId,
        categoryId: String(categoryId),
        productName: initialData.productName,
        productDescription: initialData.productDescription,
        productMarketingUrl: initialData.productMarketingUrl,
        warningsPrecautions: initialData.warningsPrecautions,
        therapeuticCategoryId: initialData.therapeuticCategoryId,
        therapeuticCategory: initialData.therapeuticCategoryId,
        therapeuticSubcategoryId: initialData.therapeuticSubcategoryId,
        therapeuticSubcategory: initialData.therapeuticSubcategoryId,
        manufacturerName: initialData.manufacturerName,
        dosageId: "",
        strength: initialData.strength,
        molecules: initialData.molecules.length > 0 ? initialData.molecules : emptyForm(categoryId).molecules,
        packId: initialData.packId,
        packType: initialData.packType,
        unitPerPack: initialData.unitPerPack,
        numberOfPacks: initialData.numberOfPacks,
        packSize: initialData.packSize,
        minimumOrderQuantity: initialData.minimumOrderQuantity,
        maximumOrderQuantity: initialData.maximumOrderQuantity,
        pricingId: initialData.pricingId || "",
        batchLotNumber: initialData.batchLotNumber,
        manufacturingDate: initialData.manufacturingDate,
        expiryDate: initialData.expiryDate,
        dateOfStockEntry: initialData.dateOfStockEntry,
        storageCondition: initialData.storageCondition,
        stockQuantity: initialData.stockQuantity,
        sellingPrice: initialData.sellingPrice,
        mrp: initialData.mrp,
        gstPercentage: initialData.gstPercentage,
        discountPercentage: initialData.discountPercentage,
        finalPrice: initialData.finalPrice,
        hsnCode: initialData.hsnCode,
        additionalDiscount: initialData.additionalDiscount || [],
      });
      if (initialData.existingImages?.length) {
        setExistingImages(initialData.existingImages);
      }
    }
  }, [mode, initialData, categoryId]);

  // ── Once dosageOptions loaded, resolve dosageId from dosageForm string ───
  useEffect(() => {
    if (mode === "edit" && initialData && dosageOptions.length > 0 && !form.dosageId) {
      const match = dosageOptions.find(
        (o) => o.label.toLowerCase() === initialData.dosageForm.toLowerCase()
      );
      if (match) {
        setForm((p) => ({ ...p, dosageId: match.value as number }));
        // Also load pack types for this dosage
        getPackTypesByDosageId(Number(match.value))
          .then((res) => {
            const data = Array.isArray(res) ? res : res?.data;
            setPackTypeOptions(data.map((p: any) => ({ value: p.packId, label: p.packType })));
          })
          .catch(console.error);
        // Load strength formats
        getMoleculeStrengthByDosage(Number(match.value))
          .then((data) => setStrengthFormats(data.map((item: any) => item.moleculeStrengthFormat)))
          .catch(console.error);
      }
    }
  }, [dosageOptions, mode, initialData, form.dosageId]);

  // ── Fetch therapeutic categories ─────────────────────────────────────────
  useEffect(() => {
    setLoadingTherapeuticCategories(true);
    getTherapeuticCategory()
      .then((data) =>
        setTherapeuticCategories(
          data.map((cat: any) => ({ value: cat.therapeuticCategoryId, label: cat.therapeuticCategory }))
        )
      )
      .catch(console.error)
      .finally(() => setLoadingTherapeuticCategories(false));
  }, []);

  // ── Fetch subcategories when therapeuticCategory changes ─────────────────
  useEffect(() => {
    if (!form.therapeuticCategory) { setSubcategoryOptions([]); return; }
    setLoadingSubcategories(true);
    getTherapeuticSubcategory(form.therapeuticCategory)
      .then((data) =>
        setSubcategoryOptions(
          data.map((sub: any) => ({ value: sub.therapeuticSubcategoryId, label: sub.therapeuticSubcategory }))
        )
      )
      .catch(console.error)
      .finally(() => setLoadingSubcategories(false));
  }, [form.therapeuticCategory]);

  // ── Fetch molecules ───────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingMolecules(true);
    getAllMolecules()
      .then((data) =>
        setMoleculeOptions(data.map((m: any) => ({ label: m.moleculeName, value: m })))
      )
      .catch(console.error)
      .finally(() => setLoadingMolecules(false));
  }, []);

  // ── Fetch dosage options ──────────────────────────────────────────────────
  useEffect(() => {
    setLoadingDosage(true);
    getDosage()
      .then((data) =>
        setDosageOptions(data.map((d: any) => ({ value: d.dosageId, label: d.dosageName })))
      )
      .catch(console.error)
      .finally(() => setLoadingDosage(false));
  }, []);

  // ── Fetch pack types when dosageId changes ────────────────────────────────
  useEffect(() => {
    if (!form.dosageId) return;
    getPackTypesByDosageId(Number(form.dosageId))
      .then((res) => {
        const data = Array.isArray(res) ? res : res?.data;
        setPackTypeOptions(data.map((p: any) => ({ value: p.packId, label: p.packType })));
      })
      .catch(console.error);
  }, [form.dosageId]);

  const getMinExpiryDate = () => {
    const today = new Date();
    today.setMonth(today.getMonth() + 3);
    return today.toISOString().split("T")[0];
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string }
  ) => {
    const name = "target" in e ? e.target.name : e.name;
    const value = "target" in e ? e.target.value : e.value;
    const finalValue = name === "expiryDate" && value ? new Date(value) : value;

    setForm((prev) => {
      const updatedForm = { ...prev, [name]: finalValue };
      const unitPerPack = Number(updatedForm.unitPerPack) || 0;
      const numberOfPacks = Number(updatedForm.numberOfPacks) || 0;
      updatedForm.packSize = String(unitPerPack * numberOfPacks);

      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        const minQty = Number(updatedForm.minimumOrderQuantity) || 0;
        const maxQty = Number(updatedForm.maximumOrderQuantity) || 0;
        const mrp = Number(updatedForm.mrp) || 0;
        const sellingPrice = Number(updatedForm.sellingPrice) || 0;
        const hsn = updatedForm.hsnCode || "";
        const expiry = updatedForm.expiryDate || null;

        if (maxQty && minQty && maxQty <= minQty) {
          newErrors.maximumOrderQuantity = "Max Order Qty must be greater than Min Order Qty";
        } else { delete newErrors.maximumOrderQuantity; }

        if (sellingPrice && mrp && sellingPrice >= mrp) {
          newErrors.sellingPrice = "Selling Price must be less than MRP";
        } else { delete newErrors.sellingPrice; }

        if (name === "discountPercentage") {
          if (value === "") { delete newErrors.discountPercentage; }
          else {
            const dv = Number(value);
            if (isNaN(dv) || dv < 0 || dv > 100) {
              newErrors.discountPercentage = "Discount must be between 0 and 100";
              updatedForm.discountPercentage = "";
            } else { delete newErrors.discountPercentage; }
          }
        }

        if (hsn) {
          const isValidLength = [4, 6, 8].includes(hsn.length);
          const isNumeric = /^\d+$/.test(hsn);
          if (!isNumeric || !isValidLength) {
            newErrors.hsnCode = "HSN Code must be 4, 6, or 8 digits only";
          } else { delete newErrors.hsnCode; }
        }

        if (expiry) {
          const minDate = new Date();
          minDate.setMonth(minDate.getMonth() + 3);
          const ne = new Date(expiry); ne.setHours(0, 0, 0, 0);
          const nm = new Date(minDate); nm.setHours(0, 0, 0, 0);
          if (ne < nm) { newErrors.expiryDate = "Expiry date must be at least 3 months from today"; }
          else { delete newErrors.expiryDate; }
        }

        return newErrors;
      });

      return updatedForm;
    });
  };

  const handleTherapeuticCategoriesChange = (selected: SelectOption | null) => {
    setForm((prev) => ({
      ...prev,
      therapeuticCategory: selected ? selected.value : "",
      therapeuticSubcategory: "",
    }));
  };

  const handleSubcategoryChange = (selected: SelectOption | null) => {
    setForm((prev) => ({ ...prev, therapeuticSubcategory: selected ? selected.value : "" }));
  };

  const handleMoleculeSelect = (index: number, selected: any) => {
    const m = selected?.value;
    if (!m) return;
    const isDuplicate = form.molecules.some(
      (mol, i) => i !== index && Number(mol.moleculeId) === Number(m.moleculeId)
    );
    if (isDuplicate) {
      setErrors((prev) => ({ ...prev, [`molecules.${index}.moleculeId`]: "Molecule already selected" }));
      return;
    }
    setErrors((prev) => { const n = { ...prev }; delete n[`molecules.${index}.moleculeId`]; return n; });
    setForm((prev) => {
      const updated = [...prev.molecules];
      updated[index] = { ...updated[index], moleculeId: m.moleculeId, moleculeName: m.moleculeName, drugSchedule: m.drugSchedule, mechanismOfAction: m.mechanismOfAction, primaryUse: m.primaryUse };
      return { ...prev, molecules: updated };
    });
  };

  const addMolecule = () => {
    setForm((prev) => ({
      ...prev,
      molecules: [...prev.molecules, { moleculeId: "", moleculeName: "", drugSchedule: "", mechanismOfAction: "", primaryUse: "", strength: "" }],
    }));
  };

  const handleStrengthChange = (index: number, value: string) => {
    const updated = [...form.molecules];
    updated[index].strength = value;
    setForm((prev) => ({ ...prev, molecules: updated }));
  };

  const getFinalDrugSchedule = (molecules: any[]) => {
    const schedules = molecules.map((m) => m.drugSchedule).filter(Boolean);
    if (schedules.length === 0) return "";
    if (schedules.includes("H1")) return "H1";
    if (schedules.includes("H")) return "H";
    return "OTC";
  };

  const toLocalDateTimeString = (date: Date | null): string | null => {
    if (!date) return null;
    const now = new Date();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString().slice(0, 19);
  };

  const handleDosageChange = async (selected: any) => {
    const dosageId = selected?.value;
    setForm((prev) => ({
      ...prev, dosageId,
      molecules: [{ moleculeId: "", moleculeName: "", drugSchedule: "", strength: "", mechanismOfAction: "", primaryUse: "" }],
      packId: "", packType: "",
    }));
    setErrors((prev) => ({ ...prev, molecules: "", packId: "" }));
    try {
      const data = await getMoleculeStrengthByDosage(dosageId);
      setStrengthFormats(data.map((item: any) => item.moleculeStrengthFormat));
    } catch { setStrengthFormats([]); }
  };

  const calculateFinalPrice = (mrp: string, standardDiscount: string, gst: string, quantity: number, additionalDiscounts: AdditionalDiscountData[]) => {
    const mrpValue = parseFloat(mrp);
    const stdDiscount = parseFloat(standardDiscount);
    const gstValue = parseFloat(gst);
    if (isNaN(mrpValue)) return { finalPerUnit: "", total: "", appliedDiscount: 0 };
    let appliedDiscount = stdDiscount;
    const applicableSlab = additionalDiscounts.filter((d) => quantity >= d.minimumPurchaseQuantity).sort((a, b) => b.minimumPurchaseQuantity - a.minimumPurchaseQuantity)[0];
    if (applicableSlab) appliedDiscount = applicableSlab.additionalDiscountPercentage;
    const discountedPrice = mrpValue - (mrpValue * appliedDiscount) / 100;
    const finalPerUnit = discountedPrice + (discountedPrice * gstValue) / 100;
    return { finalPerUnit: finalPerUnit.toFixed(2), total: (finalPerUnit * quantity).toFixed(2), appliedDiscount };
  };

  const handleSubmit = async () => {
    if (mode === "create") {
      const validation = drugProductSchema.safeParse(form);
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.issues.forEach((err) => { fieldErrors[err.path.join(".")] = err.message; });
        setErrors(fieldErrors);
        return;
      }
    }

    setErrors({});
    setSaving(true);
    try {
      const payload: any = {
        productName: form.productName,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl,
        warningsPrecautions: form.warningsPrecautions,
        manufacturerName: form.manufacturerName,
        categoryId: Number(form.categoryId),
        packagingDetails: {
          ...(initialData?.packagingId ? { packagingId: initialData.packagingId } : {}),
          packId: Number(form.packId),
          packType: form.packType,
          unitPerPack: Number(form.unitPerPack),
          numberOfPacks: Number(form.numberOfPacks),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },
        pricingDetails: [{
          ...(form.pricingId ? { pricingId: form.pricingId } : {}),
          batchLotNumber: form.batchLotNumber,
          manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
          expiryDate: toLocalDateTimeString(form.expiryDate),
          storageCondition: form.storageCondition,
          stockQuantity: Number(form.stockQuantity),
          dateOfStockEntry: toLocalDateTimeString(form.dateOfStockEntry),
          sellingPrice: Number(form.sellingPrice),
          mrp: Number(form.mrp),
          discountPercentage: Number(form.discountPercentage),
          gstPercentage: Number(form.gstPercentage),
          finalPrice: Number(form.finalPrice),
          hsnCode: Number(form.hsnCode),
          additionalDiscounts: form.additionalDiscount.map((d) => ({
            minimumPurchaseQuantity: d.minimumPurchaseQuantity,
            additionalDiscountPercentage: d.additionalDiscountPercentage,
            effectiveStartDate: d.effectiveStartDate,
            effectiveStartTime: d.effectiveStartTime,
            effectiveEndDate: d.effectiveEndDate,
            effectiveEndTime: d.effectiveEndTime,
          })),
        }],
        productAttributeDrugs: [{
          ...(initialData?.productAttributeId ? { productAttributeId: initialData.productAttributeId } : {}),
          therapeuticCategoryId: form.therapeuticCategory,
          therapeuticSubcategoryId: form.therapeuticSubcategory,
          dosageForm: dosageOptions.find((d) => d.value === form.dosageId)?.label || "",
          molecules: form.molecules.map((m) => ({ moleculeId: Number(m.moleculeId), strength: m.strength })),
        }],
        productImages: images.map((img) => ({ productImage: img.name })),
      };

      if (mode === "edit" && form.productId) {
        await updateProduct(form.productId, payload);
        if (images.length > 0) await uploadProductImages(form.productId, images);
        alert("✅ Product updated successfully!");
      } else {
        const productResponse = await createDrugProduct(payload);
        const productId = productResponse.data.productId;
        if (!productId) throw new Error("Product ID not returned from backend");
        if (images.length > 0) await uploadProductImages(productId, images);
        alert("✅ Product created successfully!");
      }

      if (onSuccess) onSuccess();
      else window.location.reload();
    } catch (err) {
      console.error("Submit Error:", err);
      alert(`❌ Failed to ${mode === "edit" ? "update" : "create"} product`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.productId) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await drugProductDelete(form.productId);
      alert("Product deleted successfully");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const selectStyles = (errorKey: string) => ({
    control: (base: any, state: any) => ({
      ...base, height: "56px", minHeight: "56px", borderRadius: "16px",
      borderColor: errors[errorKey] ? "#FF3B3B" : state.isFocused ? "#4B0082" : "#737373",
      boxShadow: "none", cursor: "pointer",
      "&:hover": { borderColor: errors[errorKey] ? "#FF3B3B" : "#4B0082" },
    }),
    valueContainer: (base: any) => ({ ...base, padding: "0 16px", cursor: "pointer" }),
    indicatorsContainer: (base: any) => ({ ...base, height: "56px", cursor: "pointer" }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base, color: state.isFocused ? "#4B0082" : "#737373", cursor: "pointer",
      "&:hover": { color: "#4B0082" },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? "#4B0082" : state.isFocused ? "#F3E8FF" : "white",
      color: state.isSelected ? "white" : "#1E1E1E", cursor: "pointer",
      "&:active": { backgroundColor: "#4B0082", color: "white" },
    }),
    placeholder: (base: any) => ({ ...base, color: "#A3A3A3" }),
    singleValue: (base: any) => ({ ...base, color: "#1E1E1E" }),
  });

  const selectTheme = (theme: any) => ({
    ...theme,
    colors: { ...theme.colors, primary: "#4B0082", primary25: "#F3E8FF", primary50: "#E9D5FF" },
  });

  return (
    <>
      {showAdditionalDiscount && (
        <CommonModal onClose={() => setShowAdditionalDiscount(false)} width="w-[600px]">
          <div className="h-[80vh] overflow-hidden flex flex-col">
            <AdditionalDiscount
              initialData={form.additionalDiscount}
              onSave={(data) => {
                setForm((prev) => {
                  const result = calculateFinalPrice(prev.mrp, prev.discountPercentage, prev.gstPercentage, Number(prev.minimumOrderQuantity || 1), data || []);
                  return { ...prev, additionalDiscount: data || [], finalPrice: result?.finalPerUnit || "" };
                });
              }}
              onClose={() => setShowAdditionalDiscount(false)}
            />
          </div>
        </CommonModal>
      )}

      <div>
        {/* ── Product Details ─────────────────────────────────────────────── */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-h4 font-semibold">Product Details</div>
          <div className="border-b border-neutral-200 mt-3" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Therapeutic Category <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={therapeuticCategories}
                isLoading={loadingTherapeuticCategories}
                value={therapeuticCategories.find((o) => o.value === form.therapeuticCategory) || null}
                onChange={handleTherapeuticCategoriesChange}
                placeholder="Select category"
                theme={selectTheme}
                styles={selectStyles("therapeuticCategory")}
              />
              {errors.therapeuticCategory && <p className="text-red-500 text-sm mt-1">{errors.therapeuticCategory}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Therapeutic Subcategory <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={subcategoryOptions}
                isLoading={loadingSubcategories}
                value={subcategoryOptions.find((o) => o.value === form.therapeuticSubcategory) || null}
                onChange={handleSubcategoryChange}
                placeholder="Select subcategory"
                isDisabled={!form.therapeuticCategory}
                theme={selectTheme}
                styles={selectStyles("therapeuticSubcategory")}
              />
              {errors.therapeuticSubcategory && <p className="text-red-500 text-sm mt-1">{errors.therapeuticSubcategory}</p>}
            </div>

            <Input
              label="Product Name"
              name="productName"
              placeholder="e.g., Paracetamol"
              onChange={handleChange}
              value={form.productName}
              error={errors.productName}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Dosage Form <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={dosageOptions}
                isLoading={loadingDosage}
                value={dosageOptions.find((o) => o.value === form.dosageId) || null}
                onChange={handleDosageChange}
                placeholder="Select dosage"
                theme={selectTheme}
                styles={selectStyles("dosageId")}
              />
              {errors.dosageId && <p className="text-red-500 text-sm mt-1">{errors.dosageId}</p>}
            </div>

            {form.molecules.map((molecule, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 col-span-2">
                <div className="flex flex-col gap-1">
                  <label className="text-label-l3 text-neutral-700 font-semibold">
                    Molecule <span className="text-warning-500 font-semibold ml-1">*</span>
                  </label>
                  <Select
                    options={moleculeOptions}
                    isLoading={loadingMolecules}
                    value={moleculeOptions.find((o) => o.value.moleculeId === molecule.moleculeId) || null}
                    onChange={(selected) => handleMoleculeSelect(index, selected)}
                    placeholder="Select molecule"
                    theme={selectTheme}
                    styles={selectStyles("molecule")}
                  />
                  {errors[`molecules.${index}.moleculeId`] && (
                    <p className="text-red-500 text-sm">{errors[`molecules.${index}.moleculeId`]}</p>
                  )}
                </div>
                <Input
                  label="Molecule Strength"
                  name="strength"
                  placeholder={strengthFormats.join(", ") || "Enter strength"}
                  value={molecule.strength || ""}
                  onChange={(e) => handleStrengthChange(index, e.target.value)}
                  required
                />
              </div>
            ))}

            <button onClick={addMolecule}
              className="col-span-2 w-41.25 h-10.5 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5">
              <img src="/icons/PlusIcon.svg" alt="add" className="w-[12.5px] h-[12.5px]" />
              Add Molecule
            </button>

            <Input label="Drug Schedule" name="drugSchedule" value={getFinalDrugSchedule(form.molecules)} readOnly required />
            <Input label="Mechanism of Action (MoA)" name="mechanismOfAction" value={form.molecules.map((m) => m.mechanismOfAction).filter(Boolean).join(" & ")} readOnly required />
            <Input label="Primary Use" name="primaryUse" value={form.molecules.map((m) => m.primaryUse).filter(Boolean).join(" & ")} readOnly required />

            <Input
              label="Manufacturer Name"
              name="manufacturerName"
              placeholder=""
              value={form.manufacturerName}
              onChange={handleChange}
              error={errors.manufacturerName}
              required
            />

            <div className="col-span-2">
              <Input
                label="Marketing URL"
                name="productMarketingUrl"
                placeholder="https://"
                value={form.productMarketingUrl}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                Warnings & Precautions <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <textarea
                name="warningsPrecautions"
                placeholder="Enter contraindications, side effects, storage conditions"
                value={form.warningsPrecautions}
                onChange={handleChange}
                rows={4}
                className={`w-full h-36 rounded-2xl p-3 resize-none overflow-y-auto border ${errors.warningsPrecautions ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`}
              />
              {errors.warningsPrecautions && <p className="text-red-500 text-sm mt-1">{errors.warningsPrecautions}</p>}
            </div>

            <div>
              <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                Product Description <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <textarea
                name="productDescription"
                placeholder="Brief product overview, indications, pack details"
                value={form.productDescription}
                onChange={handleChange}
                rows={4}
                className={`w-full h-36 rounded-2xl p-3 resize-none overflow-y-auto border ${errors.productDescription ? "border-[#FF3B3B]" : "border-neutral-500 focus:border-[#4B0082]"} focus:outline-none focus:ring-0`}
              />
              {errors.productDescription && <p className="text-red-500 text-sm mt-1">{errors.productDescription}</p>}
            </div>
          </div>
        </div>

        {/* ── Packaging & Order Details ────────────────────────────────────── */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-h4 font-semibold">Packaging & Order Details</div>
          <div className="border-b border-neutral-200 mt-3" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                Pack Type <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={packTypeOptions}
                value={packTypeOptions.find((o: any) => String(o.value) === String(form.packId)) || null}
                onChange={(selected: any) => setForm((prev) => ({ ...prev, packId: selected?.value || "", packType: selected?.label || "" }))}
                placeholder="Select Pack Type"
                isDisabled={!form.dosageId}
                theme={selectTheme}
                styles={selectStyles("packId")}
              />
              {errors.packId && <p className="text-red-500 text-sm mt-1">{errors.packId}</p>}
            </div>

            <Input type="number" label="Number of Units per Pack Type" name="unitPerPack"
              value={form.unitPerPack} onChange={handleChange} error={errors.unitPerPack} required min={1} step={1} />
            <Input type="number" label="Number of Packs" name="numberOfPacks"
              value={form.numberOfPacks} onChange={handleChange} error={errors.numberOfPacks} required min={1} step={1} />
            <Input type="number" label="Pack Size (Units × Packs)" name="packSize"
              value={form.packSize} onChange={handleChange} readOnly required />

            <div className="text-h6 font-normal col-span-2 mt-3">Order Details</div>
            <div className="border-b border-neutral-200 col-span-2" />

            <Input type="number" label="Min Order Qty" name="minimumOrderQuantity"
              value={form.minimumOrderQuantity} onChange={handleChange} min={1} step={1} error={errors.minimumOrderQuantity} required />
            <Input type="number" label="Max Order Qty" name="maximumOrderQuantity"
              value={form.maximumOrderQuantity} onChange={handleChange} min={1} step={1} error={errors.maximumOrderQuantity} required />

            <div className="text-h6 font-normal col-span-2 mt-3">Batch Management</div>
            <div className="border-b border-neutral-200 col-span-2" />

            <Input label="Batch/Lot Number" name="batchLotNumber" value={form.batchLotNumber} onChange={handleChange} error={errors.batchLotNumber} required />
            <Input label="Manufacturing Date" type="date" name="manufacturingDate"
              onChange={(e) => setForm({ ...form, manufacturingDate: e.target.value ? new Date(e.target.value) : null })}
              value={form.manufacturingDate ? form.manufacturingDate.toISOString().split("T")[0] : ""}
              error={errors.manufacturingDate} required />
            <Input label="Expiry Date" type="date" name="expiryDate"
              value={form.expiryDate ? form.expiryDate.toISOString().split("T")[0] : ""}
              onChange={handleChange} min={getMinExpiryDate()} error={errors.expiryDate} required />
            <Input label="Date of Entry" type="date" name="dateOfStockEntry"
              onChange={(e) => setForm({ ...form, dateOfStockEntry: e.target.value ? new Date(e.target.value) : new Date() })}
              value={form.dateOfStockEntry ? form.dateOfStockEntry.toISOString().split("T")[0] : ""}
              disabled />
            <Input label="Storage Condition" name="storageCondition" value={form.storageCondition} onChange={handleChange} error={errors.storageCondition} required />
            <Input type="number" label="Stock Quantity" name="stockQuantity" value={form.stockQuantity} onChange={handleChange} min={1} step={1} error={errors.stockQuantity} required />

            <div className="text-h6 font-normal col-span-2 mt-3">Pricing</div>
            <div className="border-b border-neutral-200 col-span-2" />

            <Input type="number" label="MRP" name="mrp" value={form.mrp} onChange={handleChange} min={1} step={1} error={errors.mrp} required />
            <Input type="number" label="Selling Price per Pack Size" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} min={1} step={1} error={errors.sellingPrice} required />

            <div className="col-span-2 flex items-end gap-4">
              <div className="w-1/2">
                <Input type="number" label="Discount Percentage" name="discountPercentage"
                  value={form.discountPercentage} onChange={handleChange} min={0} max={100} step={1} error={errors.discountPercentage} required />
              </div>
              <div className="mt-6">
                <button onClick={() => setShowAdditionalDiscount(true)}
                  className="w-55.5 h-10.5 px-6 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5 whitespace-nowrap">
                  <img src="/icons/PlusIcon.svg" alt="add" className="w-[12.5px] h-[12.5px]" />
                  Add Special Discount
                </button>
              </div>
            </div>

            <div className="text-h6 font-normal col-span-2 mt-3">TAX & BILLING</div>
            <div className="border-b border-neutral-200 col-span-2" />

            <div className="flex flex-col gap-1">
              <label className="text-label-l3 text-neutral-700 font-semibold">
                GST % <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>
              <Select
                options={gstOptions}
                value={gstOptions.find((o: any) => String(o.value) === String(form.gstPercentage)) || null}
                onChange={(selected: any) => setForm((prev) => ({ ...prev, gstPercentage: selected?.value || "" }))}
                placeholder="Select GST %"
                theme={selectTheme}
                styles={selectStyles("gstPercentage")}
              />
              {errors.gstPercentage && <p className="text-red-500 text-sm mt-1">{errors.gstPercentage}</p>}
            </div>

            <Input type="number" label="HSN Code" name="hsnCode" value={form.hsnCode} onChange={handleChange} min={1} step={1} maxLength={8} error={errors.hsnCode} required />
          </div>
        </div>

        {/* ── Product Photos ───────────────────────────────────────────────── */}
        <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
          <div className="text-[#364153] font-normal text-sm">
            Product Photos <span className="text-warning-500 font-semibold ml-1">*</span>
          </div>

          {existingImages.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-neutral-600 mb-2">Current Images</p>
              <div className="grid grid-cols-4 gap-3">
                {existingImages.map((url, i) => (
                  <img key={i} src={url} alt={`existing-${i}`} className="w-full h-24 object-cover rounded-md border border-neutral-300" />
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-2">Upload new images below to replace / add to these.</p>
            </div>
          )}

          <div
            className="w-full h-40 bg-neutral-50 mt-4 flex items-center justify-center rounded-lg cursor-pointer"
            onClick={() => document.getElementById("drugFileInput")?.click()}
          >
            <input id="drugFileInput" type="file" multiple accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files) setImages(Array.from(e.target.files)); }} />
            <div className="border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center w-full h-full">
              <img src="/icons/FolderIcon.svg" alt="upload" className="w-10 h-10 rounded-md object-cover" />
              <div className="text-label-l2 font-normal mt-4">Choose a file or drag & drop it here</div>
              <div className="text-label-l1 font-normal text-neutral-400">JPEG, PNG, PDF</div>
            </div>
          </div>

          {images.length > 0 && (
            <>
              <div className="mt-2 text-green-600 text-sm">✅ {images.length} new image(s) selected</div>
              <div className="grid grid-cols-4 gap-3 mt-3">
                {images.map((file, index) => (
                  <div key={index} className="relative">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-24 object-cover rounded-md border" />
                    <button onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded">✕</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex justify-between mt-6 col-span-2">
          <div className="space-x-6 flex">
            <button onClick={() => onSuccess ? onSuccess() : window.location.reload()}
              className="w-21 h-12 border-2 border-[#FF3B3B] rounded-lg text-label-l3 font-semibold text-[#FF3B3B] cursor-pointer">
              Cancel
            </button>
            <button className="w-35.25 h-12 bg-[#9F75FC] text-white text-label-l3 font-semibold rounded-lg flex items-center justify-center gap-2.5">
              <img src="/icons/SaveDraftIcon.svg" alt="draft" className="w-5 h-5 rounded-md object-cover" />
              Save Draft
            </button>
          </div>
          <div className="flex gap-3">
            {mode === "edit" && (
              <button type="button" onClick={handleDelete}
                className="border-2 border-red-600 text-red-600 rounded-lg p-3 h-12 px-5 cursor-pointer hover:bg-red-50 transition">
                Delete
              </button>
            )}
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer hover:bg-[#3a0068] transition disabled:opacity-60">
              {saving ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};