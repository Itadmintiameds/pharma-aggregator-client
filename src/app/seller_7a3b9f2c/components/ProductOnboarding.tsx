"use client";

import { getMoleculeDesc } from "@/src/services/product/MoleculeService";
import {
  createDrugProduct,
  drugProductDelete,
  editDrugProduct,
  getDrugCategory,
  getDrugProductById,
} from "@/src/services/product/ProductService";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import DrugProductList from "./DrugProductList";
import { CreateDrugProductRequest } from "@/src/types/product/ProductData";
import { drugProductSchema } from "@/src/schema/product/DrugProductSchema";

interface SelectOption {
  value: number;
  label: string;
}

interface ProductOnboardingProps {
  onSuccess: () => void;
}

const ProductOnboarding = ({ onSuccess }: ProductOnboardingProps) => {
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
    discountPercentage: "",
    gstPercentage: "",
    hsnCode: "",
  });

  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [view, setView] = useState<"form" | "list">("form");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [mode, setMode] = useState<"create" | "edit" | "delete">("create");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          moleculeId: null, // ✅ REQUIRED
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
              moleculeId: data.moleculeId, // ✅ VERY IMPORTANT
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

    return combined.toISOString().slice(0, 19); // yyyy-MM-ddTHH:mm:ss
  };

  const handleSubmit = async () => {
    const validation = drugProductSchema.safeParse(form);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};

      validation.error.issues.forEach((err) => {
        const fieldName = err.path[0] as string;
        fieldErrors[fieldName] = err.message;
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      const moleculeIds = form.molecules
        .map((m) => m.moleculeId)
        .filter((id): id is number => id !== null);

      const payload = {
        product: {
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
        },
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
            discountPercentage: Number(form.discountPercentage),
            gstPercentage: Number(form.gstPercentage),
            hsnCode: Number(form.hsnCode),
          },
        ],
        moleculeIds,
      };

      await createDrugProduct(payload);

      alert("Product created successfully!");
      onSuccess();
    } catch (err) {
      alert("Failed to create product");
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
        therapeuticCategory: data.therapeuticCategory || "",
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
        discountPercentage: String(pricing.discountPercentage ?? ""),
        gstPercentage: String(pricing.gstPercentage ?? ""),
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

      setView("list");
      setMode("create");
      setSelectedProductId(null);
      onSuccess();
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
        // 🔥 FLAT PRODUCT FIELDS (THIS FIXES NULL ISSUE)
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

        // packaging
        packagingDetails: {
          packagingUnit: form.packagingUnit,
          numberOfUnits: Number(form.numberOfUnits),
          packSize: Number(form.packSize),
          minimumOrderQuantity: Number(form.minimumOrderQuantity),
          maximumOrderQuantity: Number(form.maximumOrderQuantity),
        },

        // pricing
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
            hsnCode: Number(form.hsnCode),
          },
        ],

        moleculeIds,
      };

      console.log("UPDATE PAYLOAD (FLAT)", payload);

      await editDrugProduct(form.productId, payload as any);

      alert("Product updated successfully");
      setView("list");
      setMode("create");
      setSelectedProductId(null);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 mt-4">
      {view === "list" ? (
        <>
          {/* Back Button */}
          <div className="flex justify-between items-center">
            <h3>Product List</h3>
            <button
              className="btn btn-secondary"
              onClick={() => setView("form")}
            >
              + Add Product
            </button>
          </div>

          <DrugProductList
            onDelete={(productId) => {
              setSelectedProductId(productId);
              setMode("delete");
              setView("form");
            }}
            onEdit={(productId) => {
              setSelectedProductId(productId);
              setMode("edit");
              setView("form");
            }}
          />
        </>
      ) : (
        <>
          <div className="max-w-6xl mx-auto p-6 space-y-8 mt-4">
            <div className="flex items-center justify-between">
              <h3>Product Management</h3>

              <button
                className="btn btn-secondary"
                onClick={() => setView("list")}
              >
                Product List
              </button>
            </div>

            <div className="card space-y-4">
              <h5>Product Details</h5>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <input
                    className="input"
                    name="productName"
                    placeholder="Product Name"
                    onChange={handleChange}
                    value={form.productName}
                    disabled={mode === "delete"}
                  />
                  {errors.productName && (
                    <p className="text-red-500 text-sm">{errors.productName}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <Select
                    options={categoryOptions}
                    isLoading={loadingCategories}
                    placeholder="Select Category"
                    value={categoryOptions.find(
                      (o) => String(o.value) === form.productCategoryId,
                    )}
                    onChange={handleCategoryChange}
                    isDisabled={mode === "delete"}
                    classNamePrefix="react-select"
                  />
                  {errors.productCategoryId && (
                    <p className="text-red-500 text-sm">
                      {errors.productCategoryId}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="therapeuticCategory"
                    placeholder="Therapeutic Category"
                    value={form.therapeuticCategory}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.therapeuticCategory && (
                    <p className="text-red-500 text-sm">
                      {errors.therapeuticCategory}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="therapeuticSubcategory"
                    placeholder="Therapeutic Subcategory"
                    value={form.therapeuticSubcategory}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.therapeuticSubcategory && (
                    <p className="text-red-500 text-sm">
                      {errors.therapeuticSubcategory}
                    </p>
                  )}
                </div>
                <div className="flex flex-col">
                <input
                  className="input"
                  name="dosageForm"
                  placeholder="Dosage Form (Tablet, Syrup)"
                  value={form.dosageForm}
                  onChange={handleChange}
                  disabled={mode === "delete"}
                />
                {errors.dosageForm && (
                  <p className="text-red-500 text-sm">{errors.dosageForm}</p>
                )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="strength"
                    placeholder="Strength (mg/ml)"
                    value={form.strength}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.strength && (
                    <p className="text-red-500 text-sm">{errors.strength}</p>
                  )}
                </div>

                {/* Molecules Section */}
                <div className="col-span-2 grid grid-cols-2 gap-4 items-start">
                  {form.molecules.map((molecule, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="input flex-1"
                          placeholder={`Molecule ${index + 1}`}
                          value={molecule.moleculeName}
                          onChange={(e) =>
                            handleMoleculeChange(index, e.target.value)
                          }
                          disabled={mode === "delete"}
                        />
                        {/* Always show + on last molecule */}
                        {index === form.molecules.length - 1 && (
                          <button
                            type="button"
                            onClick={addMoleculeField}
                            className="w-9 h-9 flex items-center justify-center rounded-md bg-purple-600 text-white text-lg hover:bg-purple-700"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Combined Molecule Description */}
                {form.molecules.some(
                  (m) => m.mechanismOfAction || m.primaryUse,
                ) && (
                  <div className="col-span-2 bg-purple-50 border border-purple-200 rounded-md p-4 text-sm space-y-3">
                    {/* Mechanism */}
                    <div>
                      <span className="font-semibold text-gray-700">
                        Mechanism of Action:
                      </span>
                      <p className="text-gray-600">
                        {form.molecules
                          .filter((m) => m.mechanismOfAction)
                          .map((m) => m.mechanismOfAction)
                          .join(" & ")}
                      </p>
                    </div>

                    {/* Primary Use */}
                    <div>
                      <span className="font-semibold text-gray-700">
                        Primary Use:
                      </span>
                      <p className="text-gray-600">
                        {form.molecules
                          .filter((m) => m.primaryUse)
                          .map((m) => m.primaryUse)
                          .join(" & ")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col">
                  <textarea
                    className="input col-span-2 h-28 resize-none"
                    name="warningsPrecautions"
                    placeholder="Warnings & Precautions"
                    value={form.warningsPrecautions}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.warningsPrecautions && (
                    <p className="text-red-500 text-sm">
                      {errors.warningsPrecautions}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <textarea
                    className="input col-span-2 h-32 resize-none"
                    name="productDescription"
                    placeholder="Product Description"
                    value={form.productDescription}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.productDescription && (
                    <p className="text-red-500 text-sm">
                      {errors.productDescription}
                    </p>
                  )}
                </div>

                <input
                  className="input col-span-2"
                  name="productMarketingUrl"
                  placeholder="Marketing URL"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="card space-y-4">
              <h5>Packaging & Order Details</h5>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <input
                    className="input"
                    name="packagingUnit"
                    placeholder="Packaging Unit (Strip, Bottle)"
                    value={form.packagingUnit}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.packagingUnit && (
                    <p className="text-red-500 text-sm">
                      {errors.packagingUnit}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="numberOfUnits"
                    placeholder="Number of Units"
                    value={form.numberOfUnits}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.numberOfUnits && (
                    <p className="text-red-500 text-sm">
                      {errors.numberOfUnits}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="packSize"
                    placeholder="Pack Size"
                    value={form.packSize}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.packSize && (
                    <p className="text-red-500 text-sm">{errors.packSize}</p>
                  )}
                </div>
                <div className="flex flex-col">
                  <input
                    className="input"
                    name="minimumOrderQuantity"
                    placeholder="Min Order Qty"
                    value={form.minimumOrderQuantity}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.minimumOrderQuantity && (
                    <p className="text-red-500 text-sm">
                      {errors.minimumOrderQuantity}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="maximumOrderQuantity"
                    placeholder="Max Order Qty"
                    value={form.maximumOrderQuantity}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.maximumOrderQuantity && (
                    <p className="text-red-500 text-sm">
                      {errors.maximumOrderQuantity}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="card space-y-4">
              <h5>Batch, Stock Entry, Pricing & Tax Details</h5>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <input
                    className="input"
                    name="batchLotNumber"
                    placeholder="Batch / Lot Number"
                    value={form.batchLotNumber}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.batchLotNumber && (
                    <p className="text-red-500 text-sm">
                      {errors.batchLotNumber}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="manufacturerName"
                    placeholder="Manufacturer Name"
                    value={form.manufacturerName}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.manufacturerName && (
                    <p className="text-red-500 text-sm">
                      {errors.manufacturerName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    type="date"
                    className="input"
                    name="manufacturingDate"
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
                  />
                  {errors.manufacturingDate && (
                    <p className="text-red-500 text-sm">
                      {errors.manufacturingDate}
                    </p>
                  )}
                </div>
                <div className="flex flex-col">
                  <input
                    type="date"
                    className="input"
                    name="expiryDate"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        expiryDate: new Date(e.target.value),
                      })
                    }
                    value={
                      form.expiryDate
                        ? form.expiryDate.toISOString().split("T")[0]
                        : ""
                    }
                    disabled={mode === "delete"}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-sm">{errors.expiryDate}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="storageCondition"
                    placeholder="Storage Condition"
                    value={form.storageCondition}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.storageCondition && (
                    <p className="text-red-500 text-sm">
                      {errors.storageCondition}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="stockQuantity"
                    placeholder="Stock Quantity"
                    value={form.stockQuantity}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.stockQuantity && (
                    <p className="text-red-500 text-sm">
                      {errors.stockQuantity}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="pricePerUnit"
                    placeholder="Price Per Unit"
                    value={form.pricePerUnit}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.pricePerUnit && (
                    <p className="text-red-500 text-sm">
                      {errors.pricePerUnit}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="mrp"
                    placeholder="MRP"
                    value={form.mrp}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.mrp && (
                    <p className="text-red-500 text-sm">{errors.mrp}</p>
                  )}
                </div>
                <div className="flex flex-col">
                  <input
                    className="input"
                    name="discountPercentage"
                    placeholder="Discount %"
                    value={form.discountPercentage}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.discountPercentage && (
                    <p className="text-red-500 text-sm">
                      {errors.discountPercentage}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="gstPercentage"
                    placeholder="GST %"
                    value={form.gstPercentage}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.gstPercentage && (
                    <p className="text-red-500 text-sm">
                      {errors.gstPercentage}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    className="input"
                    name="hsnCode"
                    placeholder="HSN Code"
                    value={form.hsnCode}
                    onChange={handleChange}
                    disabled={mode === "delete"}
                  />
                  {errors.hsnCode && (
                    <p className="text-red-500 text-sm">{errors.hsnCode}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              {mode === "delete" ? (
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete Product
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={mode === "edit" ? handleUpdate : handleSubmit}
                >
                  {mode === "edit" ? "Update Product" : "Save Product"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductOnboarding;
function fetchProductForDelete(selectedProductId: string) {
  throw new Error("Function not implemented.");
}
