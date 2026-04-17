// "use client";

// /**
//  * EditProduct.tsx
//  *
//  * Fetches the product by ID, determines its category, then renders
//  * the matching form (DrugForm / ConsumableForm / NonConsumableForm)
//  * with all data pre-populated.  All edit/update logic lives inside
//  * each form — this component is just a loader + router.
//  */

// import React, { useEffect, useState } from "react";
// import { getProductById } from "@/src/services/product/ProductService";
// import { DashboardView } from "@/src/types/seller/dashboard";

// // Forms
// import { DrugForm, DrugFormInitialData } from "./DrugForm";
// import ConsumableForm, { ConsumableFormInitialData } from "./ConsumableForm";
// import NonConsumableForm, { NonConsumableFormInitialData } from "./NonConsumableForm";

// interface EditProductProps {
//   productId: string;
//   onSuccess?: () => void;
//   onCancel?: () => void;
//   setCurrentView?: (view: DashboardView) => void;
//   setSelectedProductId?: (id: string) => void;
// }

// const EditProduct = ({
//   productId,
//   onSuccess,
//   onCancel,
//   setCurrentView,
//   setSelectedProductId,
// }: EditProductProps) => {
//   const [loading, setLoading] = useState(true);
//   const [categoryId, setCategoryId] = useState<number | null>(null);

//   // Typed initial data for each form variant
//   const [drugData, setDrugData] = useState<DrugFormInitialData | null>(null);
//   const [consumableData, setConsumableData] = useState<ConsumableFormInitialData | null>(null);
//   const [nonConsumableData, setNonConsumableData] = useState<NonConsumableFormInitialData | null>(null);

//   useEffect(() => {
//     if (!productId) return;
//     setLoading(true);

//     getProductById(productId)
//       .then((data) => {
//         if (!data) throw new Error("Product not found");

//         const cat: number = data.categoryId;
//         setCategoryId(cat);

//         const pricing = data.pricingDetails?.[0] ?? {};
//         const packaging = data.packagingDetails ?? {};
//         const additionalDiscounts = pricing.additionalDiscounts ?? [];
//         const existingImages: string[] = (data.productImages ?? []).map(
//           (img: any) => img.productImage ?? img
//         );

//         if (cat === 1) {
//           // ── Drug ──────────────────────────────────────────────────────────
//           const attr = data.productAttributeDrugs?.[0] ?? {};
//           setDrugData({
//             productId: data.productId ?? "",
//             productAttributeId: attr.productAttributeId ?? "",
//             productName: data.productName ?? "",
//             therapeuticCategoryId: String(attr.therapeuticCategoryId ?? ""),
//             therapeuticSubcategoryId: String(attr.therapeuticSubcategoryId ?? ""),
//             dosageForm: attr.dosageForm ?? "",
//             strength: String(attr.strength ?? ""),
//             warningsPrecautions: data.warningsPrecautions ?? "",
//             productDescription: data.productDescription ?? "",
//             productMarketingUrl: data.productMarketingUrl ?? "",
//             manufacturerName: pricing.manufacturerName ?? data.manufacturerName ?? "",
//             molecules: data.molecules?.length > 0
//               ? data.molecules.map((m: any) => ({
//                   moleculeId: String(m.moleculeId ?? ""),
//                   moleculeName: m.moleculeName ?? "",
//                   drugSchedule: m.drugSchedule ?? "",
//                   mechanismOfAction: m.mechanismOfAction ?? "",
//                   primaryUse: m.primaryUse ?? "",
//                   strength: String(m.strength ?? ""),
//                 }))
//               : [{ moleculeId: "", moleculeName: "", drugSchedule: "", mechanismOfAction: "", primaryUse: "", strength: "" }],
//             packagingId: packaging.packagingId ?? "",
//             packId: String(packaging.packId ?? ""),
//             packType: packaging.packType ?? "",
//             unitPerPack: String(packaging.unitPerPack ?? ""),
//             numberOfPacks: String(packaging.numberOfPacks ?? ""),
//             packSize: String(packaging.packSize ?? ""),
//             minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
//             maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
//             pricingId: pricing.pricingId ?? "",
//             batchLotNumber: pricing.batchLotNumber ?? "",
//             manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
//             expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
//             dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : new Date(),
//             storageCondition: pricing.storageCondition ?? "",
//             stockQuantity: String(pricing.stockQuantity ?? ""),
//             sellingPrice: String(pricing.sellingPrice ?? ""),
//             mrp: String(pricing.mrp ?? ""),
//             gstPercentage: String(pricing.gstPercentage ?? ""),
//             discountPercentage: String(pricing.discountPercentage ?? ""),
//             finalPrice: String(pricing.finalPrice ?? ""),
//             hsnCode: String(pricing.hsnCode ?? ""),
//             additionalDiscount: additionalDiscounts,
//             existingImages,
//           });
//         } else if (cat === 5) {
//           // ── Consumable ────────────────────────────────────────────────────
//           const attr = data.productAttributeConsumableMedicals?.[0] ?? {};
//           setConsumableData({
//             productId: data.productId ?? "",
//             productAttributeId: attr.productAttributeId ?? "",
//             productName: data.productName ?? "",
//             productDescription: data.productDescription ?? "",
//             warningsPrecautions: data.warningsPrecautions ?? "",
//             productMarketingUrl: data.productMarketingUrl ?? "",
//             manufacturerName: attr.manufacturerName ?? data.manufacturerName ?? "",
//             brandName: attr.brandName ?? "",
//             deviceCatId: attr.deviceCatId ?? "",
//             deviceSubCatId: attr.deviceSubCatId ?? "",
//             dimensionSize: attr.dimensionSize ?? "",
//             disposalOrReusable: attr.disposalOrReusable ?? "",
//             keyFeaturesSpecifications: attr.keyFeaturesSpecifications ?? "",
//             materialTypeId: attr.materialTypeId ?? [],
//             purpose: attr.purpose ?? "",
//             safetyInstructions: attr.safetyInstructions ?? data.warningsPrecautions ?? "",
//             shelfLife: attr.shelfLife ?? "",
//             sterileOrNonSterile: attr.sterileOrNonSterile ?? "",
//             storageConditionId: attr.storageConditionId ?? "",
//             countryId: attr.countryId ?? "",
//             packagingId: packaging.packagingId ?? "",
//             packId: packaging.packId ?? "",
//             unitPerPack: String(packaging.unitPerPack ?? ""),
//             numberOfPacks: String(packaging.numberOfPacks ?? ""),
//             packSize: String(packaging.packSize ?? ""),
//             minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
//             maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
//             pricingId: pricing.pricingId ?? "",
//             batchLotNumber: pricing.batchLotNumber ?? "",
//             manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
//             expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
//             dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : null,
//             stockQuantity: String(pricing.stockQuantity ?? ""),
//             sellingPrice: String(pricing.sellingPrice ?? ""),
//             mrp: String(pricing.mrp ?? ""),
//             gstPercentage: String(pricing.gstPercentage ?? ""),
//             discountPercentage: String(pricing.discountPercentage ?? ""),
//             additionalDiscounts,
//             finalPrice: String(pricing.finalPrice ?? ""),
//             hsnCode: String(pricing.hsnCode ?? ""),
//             existingImages,
//             existingBrochureUrl: attr.brochurePath ?? attr.productBrochureUrl ?? "",
//             existingCertifications: (attr.certificateDocuments ?? []).map((c: any) => ({
//               certificationId: c.certificationId,
//               label: c.certificationName ?? `Certification ${c.certificationId}`,
//               url: c.certificateUrl ?? "",
//             })),
//           });
//         } else if (cat === 6) {
//           // ── Non-Consumable ────────────────────────────────────────────────
//           const attr = data.productAttributeNonConsumableMedicals?.[0] ?? {};
//           setNonConsumableData({
//             productId: data.productId ?? "",
//             productAttributeId: attr.productAttributeId ?? "",
//             productName: data.productName ?? "",
//             productDescription: data.productDescription ?? "",
//             warningsPrecautions: data.warningsPrecautions ?? "",
//             productMarketingUrl: data.productMarketingUrl ?? "",
//             manufacturerName: attr.manufacturerName ?? data.manufacturerName ?? "",
//             brandName: attr.brandName ?? "",
//             deviceCategoryId: attr.deviceCategoryId ?? "",
//             deviceSubCategoryId: attr.deviceSubCategoryId ?? "",
//             modelName: attr.modelName ?? "",
//             modelNumber: attr.modelNumber ?? "",
//             keyFeaturesSpecifications: attr.keyFeaturesSpecifications ?? "",
//             materialTypeIds: attr.materialTypeIds ?? [],
//             purpose: attr.purpose ?? "",
//             powerSourceId: attr.powerSourceId ?? "",
//             storageConditionId: attr.storageConditionId ?? "",
//             countryId: attr.countryId ?? "",
//             warrantyPeriod: String(attr.warrantyPeriod ?? ""),
//             udiNumber: attr.udiNumber ?? "",
//             serviceAvailability: attr.serviceAvailability ?? false,
//             deviceClassification: attr.deviceClassification ?? "",
//             packagingId: packaging.packagingId ?? "",
//             packId: packaging.packId ?? "",
//             unitPerPack: String(packaging.unitPerPack ?? ""),
//             numberOfPacks: String(packaging.numberOfPacks ?? ""),
//             packSize: String(packaging.packSize ?? ""),
//             minimumOrderQuantity: String(packaging.minimumOrderQuantity ?? ""),
//             maximumOrderQuantity: String(packaging.maximumOrderQuantity ?? ""),
//             pricingId: pricing.pricingId ?? "",
//             batchLotNumber: pricing.batchLotNumber ?? "",
//             manufacturingDate: pricing.manufacturingDate ? new Date(pricing.manufacturingDate) : null,
//             expiryDate: pricing.expiryDate ? new Date(pricing.expiryDate) : null,
//             dateOfStockEntry: pricing.dateOfStockEntry ? new Date(pricing.dateOfStockEntry) : null,
//             stockQuantity: String(pricing.stockQuantity ?? ""),
//             sellingPrice: String(pricing.sellingPrice ?? ""),
//             mrp: String(pricing.mrp ?? ""),
//             gstPercentage: String(pricing.gstPercentage ?? ""),
//             discountPercentage: String(pricing.discountPercentage ?? ""),
//             additionalDiscounts,
//             finalPrice: String(pricing.finalPrice ?? ""),
//             hsnCode: String(pricing.hsnCode ?? ""),
//             existingImages,
//             existingBrochureUrl: attr.brochurePath ?? "",
//             existingCertifications: (attr.certificateDocuments ?? []).map((c: any) => ({
//               certificationId: c.certificationId,
//               label: c.certificationName ?? `Certification ${c.certificationId}`,
//               url: c.certificateUrl ?? "",
//             })),
//           });
//         }
//       })
//       .catch((err) => {
//         console.error("Error loading product:", err);
//         alert("Failed to load product. Please try again.");
//       })
//       .finally(() => setLoading(false));
//   }, [productId]);

//   // ── Success handler — shared across all forms ────────────────────────────
//   const handleSuccess = () => {
//     if (onSuccess) { onSuccess(); return; }
//     if (setSelectedProductId && setCurrentView) {
//       setSelectedProductId(productId);
//       setCurrentView("productView");
//     } else {
//       setCurrentView?.("overview");
//     }
//   };

//   const handleCancel = () => {
//     if (onCancel) { onCancel(); return; }
//     setCurrentView?.("overview");
//   };

//   // ── Loading state ────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto" />
//           <p className="mt-4 text-gray-600">Loading product data...</p>
//         </div>
//       </div>
//     );
//   }

//   const categoryLabel =
//     categoryId === 1 ? "Drug"
//     : categoryId === 5 ? "Consumable Medical Device"
//     : categoryId === 6 ? "Non-Consumable Medical Device"
//     : "Unknown Category";

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header */}
//       <div className="flex items-center gap-3">
//         <div className="text-h2 font-normal">Edit Product</div>
//         <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
//           {categoryLabel}
//         </span>
//       </div>

//       {/* Render the correct form with pre-populated data */}
//       {categoryId === 1 && drugData && (
//         <DrugForm
//           categoryId={1}
//           mode="edit"
//           initialData={drugData}
//           onSuccess={handleSuccess}
//         />
//       )}

//       {categoryId === 5 && consumableData && (
//         <ConsumableForm
//           deviceType="consumable"
//           mode="edit"
//           initialData={consumableData}
//           onSubmitSuccess={handleSuccess}
//         />
//       )}

//       {categoryId === 6 && nonConsumableData && (
//         <NonConsumableForm
//           deviceType="non-consumable"
//           mode="edit"
//           initialData={nonConsumableData}
//           onSubmitSuccess={handleSuccess}
//         />
//       )}

//       {/* Fallback if category is unrecognised */}
//       {categoryId !== null && ![1, 5, 6].includes(categoryId) && (
//         <div className="text-center py-12 text-neutral-500">
//           <p>Editing is not supported for this product category (ID: {categoryId}).</p>
//           <button onClick={handleCancel} className="mt-4 px-6 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition">
//             Go Back
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EditProduct;


import React from 'react'

const EditProduct = () => {
  return (
    <div>EditProduct</div>
  )
}

export default EditProduct