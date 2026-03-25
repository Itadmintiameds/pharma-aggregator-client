import CategoryButtons from "@/src/app/commonComponents/CategoryButtons";
import Input from "@/src/app/commonComponents/Input";
import { drugProductSchema } from "@/src/schema/product/DrugProductSchema";
import { getMoleculeDesc } from "@/src/services/product/MoleculeService";
import {
  createDrugProduct,
  drugProductDelete,
  editDrugProduct,
  getDosage,
  getDrugCategory,
  getDrugProductById,
  getTherapeuticSubcategory,
} from "@/src/services/product/ProductService";
import React, { useEffect, useState } from "react";
import Select from "react-select";

interface SelectOption {
  value: string;
  label: string;
}

const AddProduct = () => {
  const [form, setForm] = useState({
    productId: "",
    productCategoryId: "",
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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [mode, setMode] = useState<"create" | "edit" | "delete">("create");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption[]>(
    [],
  );
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dosageOptions, setDosageOptions] = useState<any[]>([]);
  const [loadingDosage, setLoadingDosage] = useState(false);

  const handleCategorySelect = () => {
    setShowForm(true);
  };

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (selected: SelectOption | null) => {
    setForm({
      ...form,
      productCategoryId: selected ? String(selected.value) : "",
    });
  };

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!form.productCategoryId) {
        setSubcategoryOptions([]);
        return;
      }
      try {
        setLoadingSubcategories(true);
        const data = await getTherapeuticSubcategory(form.productCategoryId);
        const options = data.map((sub: any) => ({
          value: sub.subcategoryId,
          label: sub.subcategoryName,
        }));
        setSubcategoryOptions(options);
        setForm((prev) => ({ ...prev, therapeuticSubcategory: "" }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    fetchSubcategories();
  }, [form.productCategoryId]);

  const handleSubcategoryChange = (selected: SelectOption | null) => {
    setForm((prev) => ({
      ...prev,
      therapeuticSubcategory: selected ? selected.value : "",
    }));
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
        {
          moleculeId: null,
          moleculeName: "",
          mechanismOfAction: "",
          primaryUse: "",
        },
      ],
    });
  };

  useEffect(() => {
    const fetchMoleculeData = async () => {
      const updated = [...form.molecules];
      for (let i = 0; i < updated.length; i++) {
        const molecule = updated[i];
        if (
          molecule.moleculeName &&
          molecule.moleculeName.length >= 3 &&
          !molecule.mechanismOfAction
        ) {
          try {
            const data = await getMoleculeDesc(molecule.moleculeName);
            updated[i] = {
              ...updated[i],
              moleculeId: data.moleculeId,
              mechanismOfAction: data.mechanismOfAction || "",
              primaryUse: data.primaryUse || "",
            };
          } catch (err) {
            console.error(err);
          }
        }
      }
      setForm((prev) => ({ ...prev, molecules: updated }));
    };
    fetchMoleculeData();
  }, [form.molecules.map((m) => m.moleculeName).join()]);

  const toLocalDateTimeString = (date: Date | null): string | null => {
    if (!date) return null;
    const now = new Date();
    const combined = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    );
    return combined.toISOString().slice(0, 19);
  };

  // const handleSubmit = async () => {
  //   const validation = drugProductSchema.safeParse(form);
  //   if (!validation.success) {
  //     const fieldErrors: Record<string, string> = {};
  //     validation.error.issues.forEach((err) => {
  //       const fieldName = err.path.join(".");
  //       fieldErrors[fieldName] = err.message;
  //     });
  //     setErrors(fieldErrors);
  //     return;
  //   }
  //   setErrors({});
  //   try {
  //     const moleculeIds = form.molecules
  //       .map((m) => m.moleculeId)
  //       .filter((id): id is number => id !== null);
  //     const payload = {
  //       product: {
  //         productId: form.productId,
  //         productName: form.productName,
  //         therapeuticCategory: form.productCategoryId,
  //         therapeuticSubcategory: form.therapeuticSubcategory,
  //         dosageForm: form.dosageForm,
  //         strength: Number(form.strength),
  //         warningsPrecautions: form.warningsPrecautions,
  //         productDescription: form.productDescription,
  //         productMarketingUrl: form.productMarketingUrl,
  //       },
  //       packagingDetails: {
  //         packagingUnit: form.packagingUnit,
  //         numberOfUnits: Number(form.numberOfUnits),
  //         packSize: Number(form.packSize),
  //         minimumOrderQuantity: Number(form.minimumOrderQuantity),
  //         maximumOrderQuantity: Number(form.maximumOrderQuantity),
  //       },
  //       pricingDetails: [
  //         {
  //           batchLotNumber: form.batchLotNumber,
  //           manufacturerName: form.manufacturerName,
  //           manufacturingDate: toLocalDateTimeString(form.manufacturingDate),
  //           expiryDate: toLocalDateTimeString(form.expiryDate),
  //           storageCondition: form.storageCondition,
  //           stockQuantity: Number(form.stockQuantity),
  //           pricePerUnit: Number(form.pricePerUnit),
  //           mrp: Number(form.mrp),
  //           createdDate: form.createdDate,
  //           gstPercentage: Number(form.gstPercentage),
  //           discountPercentage: Number(form.discountPercentage),
  //           minimumPurchaseQuantity: Number(form.minimumPurchaseQuantity),
  //           additionalDiscount: Number(form.additionalDiscount),
  //           finalPrice: Number(form.finalPrice),
  //           hsnCode: Number(form.hsnCode),
  //         },
  //       ],
  //       moleculeIds,
  //     };
  //     console.log("Payload:", payload);
  //     await createDrugProduct(payload);
  //     alert("Product created successfully!");
  //     window.location.reload();
  //   } catch (err) {
  //     alert("Failed to create product");
  //   }
  // };

  const handleSubmit = async () => {
    const validation = drugProductSchema.safeParse(form);

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
      // ✅ TEMP HARD CODE (replace later with dynamic values)
      const categoryId = "1";
      const molecules = [{ moleculeId: "5" }];

      const payload = {
        // ✅ FLAT STRUCTURE (IMPORTANT)
        productName: form.productName,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl,
        warningsPrecautions: form.warningsPrecautions,

        categoryId,

        molecules,

        packagingDetails: {
          packagingUnit: form.packagingUnit,
          numberOfUnits: Number(form.numberOfUnits),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },

        pricingDetails: [
          {
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
            dosageForm: form.dosageForm,
            strength: String(form.strength),
            therapeuticCategoryId: categoryId,
            therapeuticSubcategoryId: form.therapeuticSubcategory,
          },
        ],
      };

      console.log("✅ FINAL PAYLOAD:", payload);

      await createDrugProduct(payload);

      alert("✅ Product created successfully!");
      window.location.reload();
    } catch (err) {
      console.error("❌ Submit Error:", err);
      alert("❌ Failed to create product");
    }
  };

  useEffect(() => {
    if ((mode === "edit" || mode === "delete") && selectedProductId) {
      fetchProductByIdAndFillForm(selectedProductId);
    }
  }, [mode, selectedProductId]);

  const fetchProductByIdAndFillForm = async (id: string) => {
    try {
      const data = await getDrugProductById(id);
      if (!data) throw new Error("Product not found");
      const pricing = data.pricingDetails?.[0] || {};
      const packaging = data.packagingDetails || {};
      setForm({
        productId: data.productId || "",
        productCategoryId: String(data.productCategoryId || ""),
        productName: data.productName || "",
        therapeuticCategory: data.productCategoryId || "",
        therapeuticSubcategory: data.therapeuticSubcategory || "",
        dosageForm: data.dosageForm || "",
        strength: String(data.strength ?? ""),
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
            : [
                {
                  moleculeId: null,
                  moleculeName: "",
                  mechanismOfAction: "",
                  primaryUse: "",
                },
              ],
        packagingUnit: packaging.packagingUnit || "",
        numberOfUnits: String(packaging.numberOfUnits ?? ""),
        packSize: String(packaging.packSize ?? ""),
        minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
        maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
        packagingId: packaging.packagingId || "",
        pricingId: pricing.pricingId || "",
        batchLotNumber: pricing.batchLotNumber || "",
        manufacturerName: pricing.manufacturerName || "",
        manufacturingDate: pricing.manufacturingDate
          ? new Date(pricing.manufacturingDate)
          : null,
        expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
        storageCondition: pricing.storageCondition || "",
        stockQuantity: String(pricing.stockQuantity ?? ""),
        pricePerUnit: String(pricing.pricePerUnit ?? ""),
        mrp: String(pricing.mrp ?? ""),
        createdDate: form.createdDate,
        gstPercentage: String(pricing.gstPercentage ?? ""),
        discountPercentage: String(pricing.discountPercentage ?? ""),
        minimumPurchaseQuantity: String(pricing.minimumPurchaseQuantity ?? ""),
        additionalDiscount: String(pricing.additionalDiscount ?? ""),
        finalPrice: String(pricing.finalPrice ?? ""),
        hsnCode: String(pricing.hsnCode ?? ""),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load product");
    }
  };

  const handleDelete = async () => {
    if (!form.productId) return;
    const confirmed = confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;
    try {
      await drugProductDelete(form.productId);
      alert("Product deleted successfully");
      setMode("create");
      setSelectedProductId(null);
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const handleUpdate = async () => {
    try {
      const moleculeIds = form.molecules
        .map((m) => m.moleculeId)
        .filter((id): id is number => id !== null);
      const payload = {
        productId: form.productId,
        productCategoryId: form.productCategoryId,
        productName: form.productName,
        therapeuticCategory: form.therapeuticCategory,
        therapeuticSubcategory: form.therapeuticSubcategory,
        dosageForm: form.dosageForm,
        strength: Number(form.strength),
        warningsPrecautions: form.warningsPrecautions,
        productDescription: form.productDescription,
        productMarketingUrl: form.productMarketingUrl,
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
            discountPercentage: Number(form.discountPercentage),
            gstPercentage: Number(form.gstPercentage),
            additionalDiscount: Number(form.additionalDiscount),
            minimumPurchaseQuantity: Number(form.minimumPurchaseQuantity),
            finalPrice: Number(form.finalPrice),
            hsnCode: Number(form.hsnCode),
          },
        ],
        moleculeIds,
      };
      await editDrugProduct(form.productId, payload as any);
      alert("Product updated successfully");
      setMode("create");
      setSelectedProductId(null);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  const calculateFinalPrice = (
    mrp: string,
    discount: string,
    additionalDiscount: string,
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

  useEffect(() => {
    const fetchDosage = async () => {
      try {
        setLoadingDosage(true);

        const data = await getDosage();

        const options = data.map((d: any) => ({
          value: d.dosageName,
          label: d.dosageName,
        }));

        setDosageOptions(options);

        setForm((prev) => ({ ...prev, dosage: "" }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDosage(false);
      }
    };

    fetchDosage();
  }, []);

  const handleDosageChange = (selected: any) => {
    setForm((prev) => ({
      ...prev,
      dosageForm: selected ? selected.value : "",
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-h2 font-normal">Add Product</div>

        <CategoryButtons onSelect={handleCategorySelect} />

        {!showForm && (
          <div className="flex flex-col items-center mt-20 gap-10">
            <img src="/AddProdImg.svg" className="w-[330px] h-[329px]" />

            <p className="text-p4 font-normal">
              Enter a line here encouraging to start their journey by adding
              products
            </p>
          </div>
        )}
      </div>
      {showForm && (
        <div>
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">
              Product Details
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
              <div className="flex flex-col gap-1">
                <label className="text-label-l3 text-neutral-700 font-semibold">
                  Therapeutic Category
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <Select
                  options={categoryOptions}
                  isLoading={loadingCategories}
                  value={
                    categoryOptions.find(
                      (o) => o.value === form.productCategoryId,
                    ) || null
                  }
                  onChange={handleCategoryChange}
                  placeholder="Select category"
                  isDisabled={mode === "delete"}
                  theme={selectTheme}
                  styles={selectStyles("productCategoryId")}
                />
                {errors.productCategoryId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.productCategoryId}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-l3 text-neutral-700 font-semibold">
                  Therapeutic Subcategory
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <Select
                  options={subcategoryOptions}
                  isLoading={loadingSubcategories}
                  value={
                    subcategoryOptions.find(
                      (o) => o.value === form.therapeuticSubcategory,
                    ) || null
                  }
                  onChange={handleSubcategoryChange}
                  placeholder="Select subcategory"
                  isDisabled={!form.productCategoryId || mode === "delete"}
                  theme={selectTheme}
                  styles={selectStyles("therapeuticSubcategory")}
                />
                {errors.therapeuticSubcategory && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.therapeuticSubcategory}
                  </p>
                )}
              </div>

              <Input
                label="Product Name"
                name="productName"
                id="productName"
                placeholder="e.g., Paracetamol"
                onChange={handleChange}
                value={form.productName}
                disabled={mode === "delete"}
                error={errors.productName}
                required
              />

              <div className="flex flex-col gap-1">
                <label className="text-label-l3 text-neutral-700 font-semibold">
                 Dosage Form (Tablet, Syrup)
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <Select
                  options={dosageOptions}
                  isLoading={loadingDosage}
                  value={
                    dosageOptions.find((o) => o.value === form.dosageForm) || null
                  }
                  onChange={handleDosageChange}
                  placeholder="Select dosage"
                  isDisabled={mode === "delete"}
                  theme={selectTheme}
                  styles={selectStyles("dosage")}
                />
              </div>
              {/* <Input
                label="Dosage Form (Tablet, Syrup)"
                name="dosageForm"
                placeholder="e.g., Tablet / Capsule / Syrup / Injection"
                value={form.dosageForm}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.dosageForm}
                required
              /> */}

              <Input
                label="Strength (mg/ml)"
                name="strength"
                placeholder="e.g., 650 mg"
                value={form.strength}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.strength}
                required
              />

              <Input
                label="Marketing URL"
                name="productMarketingUrl"
                id="productMarketingUrl"
                placeholder="https://"
                value={form.productMarketingUrl}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.productMarketingUrl}
                required
              />

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
                          onChange={(e) =>
                            handleMoleculeChange(index, e.target.value)
                          }
                          disabled={mode === "delete"}
                        />
                      </div>
                      {index === form.molecules.length - 1 && (
                        <button
                          type="button"
                          onClick={addMoleculeField}
                          className="h-14 w-14 bg-[#4B0082] rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <img
                            src="/icons/PlusIcon.svg"
                            alt="Add"
                            className="w-3 h-3"
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {form.molecules.some(
                  (m) => m.mechanismOfAction || m.primaryUse,
                ) && (
                  <div className="col-span-2 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm space-y-4 mt-4">
                    {form.molecules.some((m) => m.mechanismOfAction) && (
                      <div>
                        <div className="font-semibold text-purple-900">
                          Mechanism of Action
                        </div>
                        <div className="text-neutral-700 mt-1">
                          {form.molecules
                            .filter((m) => m.mechanismOfAction)
                            .map((m) => m.mechanismOfAction)
                            .join(" & ")}
                        </div>
                      </div>
                    )}
                    {form.molecules.some((m) => m.primaryUse) && (
                      <div>
                        <div className="font-semibold text-purple-900">
                          Primary Use
                        </div>
                        <div className="text-neutral-700 mt-1">
                          {form.molecules
                            .filter((m) => m.primaryUse)
                            .map((m) => m.primaryUse)
                            .join(" & ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Warnings & Precautions
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="warningsPrecautions"
                  id="warningsPrecautions"
                  placeholder="Enter contraindications, side effects, storage conditions"
                  value={form.warningsPrecautions}
                  onChange={handleChange}
                  disabled={mode === "delete"}
                  rows={4}
                  className={`w-full h-36 rounded-2xl p-3 resize-none overflow-y-auto border ${
                    errors.warningsPrecautions
                      ? "border-[#FF3B3B] focus:border-[#FF3B3B]"
                      : "border-neutral-500 focus:border-[#4B0082]"
                  } focus:outline-none focus:ring-0`}
                />
                {errors.warningsPrecautions && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.warningsPrecautions}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-label-l3 text-neutral-700 font-semibold mb-1">
                  Product Description
                  <span className="text-warning-500 font-semibold ml-1">*</span>
                </label>
                <textarea
                  name="productDescription"
                  id="productDescription"
                  placeholder="Brief product overview, indications, pack details"
                  value={form.productDescription}
                  onChange={handleChange}
                  disabled={mode === "delete"}
                  rows={4}
                  className={`w-full h-36 rounded-2xl p-3 resize-none overflow-y-auto border ${
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

          {/* Packaging & Order Details */}
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">
              Packaging & Order Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
              <div className="col-span-2">
                <Input
                  label="Packaging Unit"
                  name="packagingUnit"
                  id="packagingUnit"
                  placeholder="Strip, Bottle"
                  value={form.packagingUnit}
                  onChange={handleChange}
                  disabled={mode === "delete"}
                  error={errors.packagingUnit}
                  required
                />
              </div>

              <Input
                label="Number of Units"
                name="numberOfUnits"
                id="numberOfUnits"
                placeholder=""
                value={form.numberOfUnits}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.numberOfUnits}
                required
              />
              <Input
                label="Pack Size"
                name="packSize"
                id="packSize"
                placeholder=""
                value={form.packSize}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.packSize}
                required
              />
              <Input
                label="Min Order Qty"
                name="minimumOrderQuantity"
                id="minimumOrderQuantity"
                placeholder=""
                value={form.minimumOrderQuantity}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.minimumOrderQuantity}
                required
              />
              <Input
                label="Max Order Qty"
                name="maximumOrderQuantity"
                id="maximumOrderQuantity"
                placeholder=""
                value={form.maximumOrderQuantity}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.maximumOrderQuantity}
                required
              />
            </div>
          </div>

          {/* Batch, Stock Entry, Pricing & Tax Details */}
          <div className="relative border border-neutral-200 rounded-xl p-6 mt-6">
            <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold">
              Batch, Stock Entry, Pricing & Tax Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
              <Input
                label="Batch/Lot Number"
                name="batchLotNumber"
                id="batchLotNumber"
                placeholder=""
                value={form.batchLotNumber}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.batchLotNumber}
                required
              />
              <Input
                label="Manufacturer Name"
                name="manufacturerName"
                id="manufacturerName"
                placeholder=""
                value={form.manufacturerName}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.manufacturerName}
                required
              />
              <Input
                label="Manufacturing Date"
                type="date"
                name="manufacturingDate"
                id="manufacturingDate"
                placeholder=""
                onChange={(e) =>
                  setForm({
                    ...form,
                    manufacturingDate: new Date(e.target.value),
                  })
                }
                value={
                  form.manufacturingDate
                    ? form.manufacturingDate.toISOString().split("T")[0]
                    : ""
                }
                disabled={mode === "delete"}
                error={errors.manufacturingDate}
                required
              />
              <Input
                label="Expiry Date"
                type="date"
                name="expiryDate"
                id="expiryDate"
                placeholder=""
                onChange={(e) =>
                  setForm({ ...form, expiryDate: new Date(e.target.value) })
                }
                value={
                  form.expiryDate
                    ? form.expiryDate.toISOString().split("T")[0]
                    : ""
                }
                disabled={mode === "delete"}
                error={errors.expiryDate}
                required
              />
              <Input
                label="Storage Condition"
                name="storageCondition"
                id="storageCondition"
                placeholder=""
                value={form.storageCondition}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.storageCondition}
                required
              />

              <Input
                label="Stock Quantity"
                name="stockQuantity"
                id="stockQuantity"
                placeholder=""
                value={form.stockQuantity}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.stockQuantity}
                required
              />
              <Input
                label="Price Per Unit"
                name="pricePerUnit"
                id="pricePerUnit"
                placeholder=""
                value={form.pricePerUnit}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.pricePerUnit}
                required
              />
              <Input
                label="MRP"
                name="mrp"
                id="mrp"
                value={form.mrp}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    mrp: value,
                    finalPrice: calculateFinalPrice(
                      value,
                      prev.discountPercentage,
                      prev.additionalDiscount,
                    ),
                  }));
                }}
                disabled={mode === "delete"}
                error={errors.mrp}
                required
              />
              <Input
                label="Date of Entry"
                type="date"
                name="createdDate"
                id="createdDate"
                required
                value={
                  form.createdDate
                    ? form.createdDate.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setForm({ ...form, createdDate: new Date(e.target.value) })
                }
                disabled={mode === "delete"}
                error={errors.createdDate}
              />
              <Input
                label="GST %"
                name="gstPercentage"
                id="gstPercentage"
                placeholder=""
                value={form.gstPercentage}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.gstPercentage}
                required
              />

              <Input
                label="Discount Percentage"
                name="discountPercentage"
                id="discountPercentage"
                value={form.discountPercentage}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    discountPercentage: value,
                    finalPrice: calculateFinalPrice(
                      prev.mrp,
                      value,
                      prev.additionalDiscount,
                    ),
                  }));
                }}
                disabled={mode === "delete"}
                error={errors.discountPercentage}
                required
              />

              <div className="py-2 text-label-l4 font-semibold col-span-2">
                Additional Discount (Quantity-based)
              </div>

              <Input
                label="Minimum Purchase Quantity"
                name="minimumPurchaseQuantity"
                id="minimumPurchaseQuantity"
                placeholder=""
                value={form.minimumPurchaseQuantity}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.minimumPurchaseQuantity}
              />

              <Input
                label="Discount Percentage %"
                name="additionalDiscount"
                id="additionalDiscount"
                value={form.additionalDiscount}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    additionalDiscount: value,
                    finalPrice: calculateFinalPrice(
                      prev.mrp,
                      prev.discountPercentage,
                      value,
                    ),
                  }));
                }}
                disabled={mode === "delete"}
              />

              <Input
                label="Final Price"
                name="finalPrice"
                id="finalPrice"
                value={form.finalPrice}
                disabled={true}
                required
              />
              <Input
                label="HSN Code"
                name="hsnCode"
                id="hsnCode"
                placeholder=""
                value={form.hsnCode}
                onChange={handleChange}
                disabled={mode === "delete"}
                error={errors.hsnCode}
                required
              />
            </div>

            <div className="w-full h-40 bg-neutral-50 mt-6 flex items-center justify-center rounded-lg">
              <div className="w-285 h-34.5 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center ">
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
                    or click to browse JPEG, PNG, and Pdf{" "}
                  </div>
                </div>
              </div>
            </div>

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
                {mode === "delete" ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="bg-red-600 text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
                  >
                    Delete
                  </button>
                ) : mode === "edit" ? (
                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
                  >
                    Update
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-[#4B0082] text-white rounded-lg p-3 w-21.75 h-12 cursor-pointer"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;
