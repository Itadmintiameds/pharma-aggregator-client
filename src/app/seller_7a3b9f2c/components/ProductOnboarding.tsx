"use client";

import { getMoleculeDesc } from "@/src/services/product/MoleculeService";
import {
  createDrugProduct,
  getDrugCategory,
} from "@/src/services/product/ProductService";
import React, { useEffect, useState } from "react";
import Select from "react-select";

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

    packagingUnit: "",
    numberOfUnits: "",
    packSize: "",
    minimumOrderQuantity: "",
    maximumOrderQuantity: "",

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
    try {
      // 1️⃣ Extract molecule IDs (many-to-many)
      const moleculeIds = form.molecules
        .map((m) => m.moleculeId)
        .filter((id): id is number => id !== null);

      // 2️⃣ Build payload
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

        moleculeIds, // ✅ MANY-TO-MANY
      };

      console.log("FINAL PAYLOAD", payload);

      await createDrugProduct(payload);

      alert("Product created successfully!");
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to create product");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 mt-4">
      <h3>Product Management</h3>

      <div className="card space-y-4">
        <h5>Product Details</h5>

        <div className="grid grid-cols-2 gap-4">
          <input
            className="input"
            name="productName"
            placeholder="Product Name"
            onChange={handleChange}
          />
          <Select
            options={categoryOptions}
            isLoading={loadingCategories}
            placeholder="Select Category"
            onChange={handleCategoryChange}
            classNamePrefix="react-select"
          />
          <input
            className="input"
            name="therapeuticCategory"
            placeholder="Therapeutic Category"
            onChange={handleChange}
          />
          <input
            className="input"
            name="therapeuticSubcategory"
            placeholder="Therapeutic Subcategory"
            onChange={handleChange}
          />

          <input
            className="input"
            name="dosageForm"
            placeholder="Dosage Form (Tablet, Syrup)"
            onChange={handleChange}
          />
          <input
            className="input"
            name="strength"
            placeholder="Strength (mg/ml)"
            onChange={handleChange}
          />

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
          {form.molecules.some((m) => m.mechanismOfAction || m.primaryUse) && (
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

          <textarea
            className="input col-span-2 h-28 resize-none"
            name="warningsPrecautions"
            placeholder="Warnings & Precautions"
            onChange={handleChange}
          />

          <textarea
            className="input col-span-2 h-32 resize-none"
            name="productDescription"
            placeholder="Product Description"
            onChange={handleChange}
          />

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
          <input
            className="input"
            name="packagingUnit"
            placeholder="Packaging Unit (Strip, Bottle)"
            onChange={handleChange}
          />
          <input
            className="input"
            name="numberOfUnits"
            placeholder="Number of Units"
            onChange={handleChange}
          />

          <input
            className="input"
            name="packSize"
            placeholder="Pack Size"
            onChange={handleChange}
          />
          <input
            className="input"
            name="minimumOrderQuantity"
            placeholder="Min Order Qty"
            onChange={handleChange}
          />

          <input
            className="input"
            name="maximumOrderQuantity"
            placeholder="Max Order Qty"
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="card space-y-4">
        <h5>Batch, Stock Entry, Pricing & Tax Details</h5>

        <div className="grid grid-cols-2 gap-4">
          <input
            className="input"
            name="batchLotNumber"
            placeholder="Batch / Lot Number"
            onChange={handleChange}
          />
          <input
            className="input"
            name="manufacturerName"
            placeholder="Manufacturer Name"
            onChange={handleChange}
          />

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
          />
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
          />

          <input
            className="input"
            name="storageCondition"
            placeholder="Storage Condition"
            onChange={handleChange}
          />
          <input
            className="input"
            name="stockQuantity"
            placeholder="Stock Quantity"
            onChange={handleChange}
          />

          <input
            className="input"
            name="pricePerUnit"
            placeholder="Price Per Unit"
            onChange={handleChange}
          />
          <input
            className="input"
            name="mrp"
            placeholder="MRP"
            onChange={handleChange}
          />

          <input
            className="input"
            name="discountPercentage"
            placeholder="Discount %"
            onChange={handleChange}
          />
          <input
            className="input"
            name="gstPercentage"
            placeholder="GST %"
            onChange={handleChange}
          />

          <input
            className="input"
            name="hsnCode"
            placeholder="HSN Code"
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={handleSubmit}>
          Save Product
        </button>
      </div>
    </div>
  );
};

export default ProductOnboarding;

// "use client";

// import React, { useState } from 'react';
// import ConsumableProductForm from './ConsumableProductForm';
// import NonConsumableProductForm from './NonConsumableProductForm';
// import Header from '@/src/app/components/Header';

// type ProductType = 'consumable' | 'non-consumable';

// // Export these interfaces/types
// export interface BaseFormData {
//   // Common fields
//   productCategory: string;
//   therapeuticCategory: string;
//   subCategory: string;
//   productName: string;
//   productDescription: string;
//   warnings: string;
//   productImage: File | null;
//   // Packaging & Order Details
//   packagingUnit: string;
//   moq: string;
//   maxOrderQuantity: string;
//   // Stock, Pricing & Tax Details
//   stockQuantity: string;
//   dateOfEntry: string;
//   pricePerUnit: string;
//   discountPercentage: string;
//   gstPercentage: string;
//   hsnCode: string;
// }

// export interface FormErrors {
//   [key: string]: string;
// }

// interface ProductOnboardingProps {
//   onBackToDashboard?: () => void;
// }

// export default function ProductOnboarding({ onBackToDashboard }: ProductOnboardingProps) {
//   const [productType, setProductType] = useState<ProductType>('consumable');

//   const handleBack = () => {
//     if (onBackToDashboard) {
//       onBackToDashboard();
//     }
//   };

//   return (
//     <>
//       <Header />

//       <div className="container mt-3 ml-10">
//         <button
//           onClick={handleBack}
//           className="mb-3 px-4 py-2 bg-[#f3ecf8] border border-[#751bb5] text-[#751bb5] rounded-lg hover:bg-[#751bb5] hover:text-white transition"
//         >
//           <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
//         </button>
//       </div>

//       <div className="po-seller-register-container ml-10 mr-10">
//         <div className="po-header-row">
//           <div className="po-title-section">
//             <h1 className="po-main-title">
//               <i className={`fas fa-${productType === 'consumable' ? 'pills' : 'stethoscope'} po-title-icon`}></i>
//               {productType === 'consumable' ? 'Pharmaceutical Product Onboarding' : 'Medical Equipment Onboarding'}
//             </h1>
//           </div>
//           <div className="po-product-type-toggle-top">
//             <div className="po-toggle-label">
//               <i className="fas fa-boxes"></i>
//               <span>Product Type:</span>
//             </div>
//             <div className="po-toggle-buttons-top">
//               <button
//                 type="button"
//                 className={`po-toggle-btn-top ${productType === 'consumable' ? 'po-active' : ''}`}
//                 onClick={() => setProductType('consumable')}
//               >
//                 <i className="fas fa-pills"></i>
//                 <span>Consumables</span>
//               </button>
//               <button
//                 type="button"
//                 className={`po-toggle-btn-top ${productType === 'non-consumable' ? 'po-active' : ''}`}
//                 onClick={() => setProductType('non-consumable')}
//               >
//                 <i className="fas fa-stethoscope"></i>
//                 <span>Non-Consumables</span>
//               </button>
//             </div>
//           </div>
//         </div>
//         {productType === 'consumable' ? (
//           <ConsumableProductForm  />
//         ) : (
//           <NonConsumableProductForm  />
//         )}
//       </div>
//     </>
//   );
// }

// "use client";

// import React, { useState } from 'react';
// import ConsumableProductForm from './ConsumableProductForm';
// import NonConsumableProductForm from './NonConsumableProductForm';
// import Header from '@/src/app/components/Header';

// type ProductType = 'consumable' | 'non-consumable';

// export interface BaseFormData {
//   // Common fields
//   productCategory: string;
//   therapeuticCategory: string;
//   subCategory: string;
//   productName: string;
//   productDescription: string;
//   warnings: string;
//   productImage: File | null;
//   // Packaging & Order Details
//   packagingUnit: string;
//   moq: string;
//   maxOrderQuantity: string;
//   // Stock, Pricing & Tax Details
//   stockQuantity: string;
//   dateOfEntry: string;
//   pricePerUnit: string;
//   discountPercentage: string;
//   gstPercentage: string;
//   hsnCode: string;
// }

// export interface FormErrors {
//   [key: string]: string;
// }

// export default function ProductOnboarding() {
//   const [productType, setProductType] = useState<ProductType>('consumable');

//   return (
//     <>
//       <Header />
//       <div className="po-seller-register-container">
//         <div className="po-header-row">
//           <div className="po-title-section ">
//             <h1 className="po-main-title ">
//               <i className={`fas fa-${productType === 'consumable' ? 'pills' : 'stethoscope'} po-title-icon`}></i>
//               {productType === 'consumable' ? 'Pharmaceutical Product Onboarding' : 'Medical Equipment Onboarding'}
//             </h1>
//           </div>
//           <div className="po-product-type-toggle-top">
//             <div className="po-toggle-label">
//               <i className="fas fa-boxes"></i>
//               <span>Product Type:</span>
//             </div>
//             <div className="po-toggle-buttons-top">
//               <button
//                 type="button"
//                 className={`po-toggle-btn-top ${productType === 'consumable' ? 'po-active' : ''}`}
//                 onClick={() => setProductType('consumable')}
//               >
//                 <i className="fas fa-pills"></i>
//                 <span>Consumables</span>
//               </button>
//               <button
//                 type="button"
//                 className={`po-toggle-btn-top ${productType === 'non-consumable' ? 'po-active' : ''}`}
//                 onClick={() => setProductType('non-consumable')}
//               >
//                 <i className="fas fa-stethoscope"></i>
//                 <span>Non-Consumables</span>
//               </button>
//             </div>
//           </div>
//         </div>
//         {productType === 'consumable' ? (
//           <ConsumableProductForm />
//         ) : (
//           <NonConsumableProductForm />
//         )}
//       </div>
//     </>
//   );
// }
