
import React from 'react'

const AddProduct = () => {
  return (
    <div>AddProduct</div>
  )
}

export default AddProduct;

// "use client";

// import React, { useState } from "react";
// import {
//   Upload,
//   Plus,
//   X,
//   Search,
//   Calendar,
//   Code
// } from "lucide-react";

// /* ----------------------------- CONFIG ----------------------------- */

// const categories = [
//   "Drugs",
//   "Supplements / Nutraceuticals",
//   "Food & Infant Nutrition",
//   "Cosmetic & Personal Use",
//   "Medical Devices & Equipment"
// ];

// /* ============================= MAIN ============================= */

// export default function AddProduct() {
//   const [selectedCategory, setSelectedCategory] = useState("Drugs");
//   const [deviceType, setDeviceType] = useState<"consumable" | "nonConsumable" | null>(null);
//   const [molecules, setMolecules] = useState([""]);
//   const [files, setFiles] = useState<File[]>([]);

//   const addMolecule = () => setMolecules([...molecules, ""]);
//   const removeMolecule = (index: number) =>
//     setMolecules(molecules.filter((_, i) => i !== index));

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       setFiles([...files, ...Array.from(e.target.files)]);
//     }
//   };

//   return (
//     <div className="space-y-8 pb-16">

//       {/* HEADER */}
//       <div>
//         <h1 className="text-2xl font-bold text-neutral-900">
//           Add Product
//         </h1>
//         <p className="text-sm text-neutral-500">
//           Here’s Your Current Sales Overview
//         </p>
//       </div>

//       {/* CATEGORY PILLS */}
//       <div className="flex flex-wrap gap-3">
//         {categories.map((cat) => (
//           <button
//             key={cat}
//             onClick={() => setSelectedCategory(cat)}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//               selectedCategory === cat
//                 ? "bg-purple-600 text-white"
//                 : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//             }`}
//           >
//             {cat}
//           </button>
//         ))}
//       </div>

//       {/* PRODUCT DETAILS */}
//       <SectionCard title="Product Details">
//         <ProductDetails
//           category={selectedCategory}
//           molecules={molecules}
//           addMolecule={addMolecule}
//           removeMolecule={removeMolecule}
//           deviceType={deviceType}
//           setDeviceType={setDeviceType}
//         />
//       </SectionCard>

//       {/* PACKAGING */}
//       <SectionCard title="Packaging & Order Details">
//         <PackagingOrderDetails />
//       </SectionCard>

//       {/* BATCH */}
//       <SectionCard title="Batch, Stock Entry, Pricing & Tax Details">
//         <BatchStockPricingDetails />
//       </SectionCard>

//       {/* MEDIA */}
//       <SectionCard title="Media">
//         <MediaUpload files={files} onFileChange={handleFileChange} />
//       </SectionCard>

//       {/* FOOTER BUTTONS */}
//       <div className="flex justify-between pt-6">
//         <button className="px-6 py-2 border border-red-500 text-red-500 rounded-lg">
//           Cancel
//         </button>

//         <div className="flex gap-3">
//           <button className="px-6 py-2 bg-purple-200 text-purple-700 rounded-lg">
//             Save Draft
//           </button>
//           <button className="px-6 py-2 bg-purple-700 text-white rounded-lg">
//             Submit
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ============================= SECTION CARD ============================= */

// const SectionCard = ({ title, children }: any) => (
//   <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
//     <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
//     {children}
//   </div>
// );

// /* ============================= PRODUCT DETAILS ============================= */

// const ProductDetails = ({
//   category,
//   molecules,
//   addMolecule,
//   removeMolecule,
//   deviceType,
//   setDeviceType
// }: any) => {

//   /* ---------------- DRUGS ---------------- */
//   if (category === "Drugs") {
//     return (
//       <div className="grid grid-cols-2 gap-6">

//         <Input label="Product Name *" />
//         <Select label="Select Category *" />

//         <Input label="Therapeutic Category *" icon={<Search size={16} />} />
//         <Input label="Therapeutic Subcategory *" icon={<Search size={16} />} />

//         <Select label="Dosage Form *" />
//         <Input label="Strength (mg/ml) *" />

//         {molecules.map((_, i) => (
//           <div key={i} className="flex gap-2 items-end">
//             <Input label={`Molecule ${i + 1} *`} />
//             {i === molecules.length - 1 ? (
//               <button
//                 onClick={addMolecule}
//                 className="h-10 w-10 bg-purple-600 text-white rounded-lg flex items-center justify-center"
//               >
//                 <Plus size={16} />
//               </button>
//             ) : (
//               <button
//                 onClick={() => removeMolecule(i)}
//                 className="h-10 w-10 bg-red-500 text-white rounded-lg flex items-center justify-center"
//               >
//                 <X size={16} />
//               </button>
//             )}
//           </div>
//         ))}

//         <TextArea label="Warnings & Precautions *" full />
//         <TextArea label="Product Description *" full />

//         <Input label="Marketing URL" full />
//       </div>
//     );
//   }

//   /* ---------------- SUPPLEMENTS ---------------- */
//   if (category === "Supplements / Nutraceuticals") {
//     return (
//       <div className="grid grid-cols-2 gap-6">
//         <Input label="Product Name *" />
//         <Input label="Active Ingredients *" />
//         <Select label="Dosage Form *" />
//         <Input label="Strength / Net Quantity *" />
//         <TextArea label="Warnings & Precautions *" full />
//         <TextArea label="Product Description *" full />
//         <Input label="Nutritional Information *" full />
//         <Select label="Veg / Non-Veg Indicator *" />
//       </div>
//     );
//   }

//   /* ---------------- FOOD ---------------- */
//   if (category === "Food & Infant Nutrition") {
//     return (
//       <div className="grid grid-cols-2 gap-6">
//         <Input label="Product Name *" />
//         <Select label="Product Form *" />
//         <Input label="Net Quantity / Serving Size *" />
//         <Input label="Target Age Group *" />
//         <Input label="Allergen Information *" />
//         <TextArea label="Product Description *" full />
//       </div>
//     );
//   }

//   /* ---------------- COSMETICS ---------------- */
//   if (category === "Cosmetic & Personal Use") {
//     return (
//       <div className="grid grid-cols-2 gap-6">
//         <Input label="Product Name *" />
//         <Select label="Product Type *" />
//         <Input label="Ingredient List (INCI Names) *" />
//         <Input label="Net Quantity *" />
//         <TextArea label="Warnings & Precautions *" full />
//         <TextArea label="Product Description *" full />
//       </div>
//     );
//   }

//   /* ---------------- MEDICAL DEVICES ---------------- */
//   if (category === "Medical Devices & Equipment") {
//     return (
//       <div className="space-y-6">

//         <div>
//           <label className="text-sm font-medium mb-2 block">
//             Device Type *
//           </label>
//           <div className="flex gap-6">
//             <label className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 checked={deviceType === "consumable"}
//                 onChange={() => setDeviceType("consumable")}
//               />
//               Consumable
//             </label>
//             <label className="flex items-center gap-2">
//               <input
//                 type="radio"
//                 checked={deviceType === "nonConsumable"}
//                 onChange={() => setDeviceType("nonConsumable")}
//               />
//               Non-Consumable
//             </label>
//           </div>
//         </div>

//         {deviceType && (
//           <div className="grid grid-cols-2 gap-6">
//             <Input label="Product Name *" />
//             <Input label="Brand / Model Name *" />
//             <Input label="Device Class *" />
//             <Input label="Country of Origin *" />
//             <TextArea label="Product Description *" full />
//           </div>
//         )}
//       </div>
//     );
//   }

//   return null;
// };

// /* ============================= PACKAGING ============================= */

// const PackagingOrderDetails = () => (
//   <div className="grid grid-cols-2 gap-6">
//     <Input label="Packaging Unit *" />
//     <Input label="Number of Units *" />
//     <Input label="Pack Size *" />
//     <Input label="Min Order Qty *" />
//     <Input label="Max Order Qty *" />
//   </div>
// );

// /* ============================= BATCH ============================= */

// const BatchStockPricingDetails = () => (
//   <div className="grid grid-cols-2 gap-6">
//     <Input label="Batch/Lot Number *" />
//     <Input label="Manufacturer Name *" />
//     <Input label="Manufacturing Date *" icon={<Calendar size={16} />} />
//     <Input label="Expiry Date *" icon={<Calendar size={16} />} />
//     <Input label="Storage Condition *" />
//     <Input label="Stock Quantity *" />
//     <Input label="Date of Entry *" icon={<Calendar size={16} />} />
//     <Input label="MRP *" />
//     <Input label="Price Per Unit *" />
//     <Input label="GST % *" />
//     <Input label="Minimum Purchase Quantity" />
//     <Input label="Discount Percentage %" />
//     <Input label="HSN Code *" icon={<Code size={16} />} full />
//   </div>
// );

// /* ============================= MEDIA ============================= */

// const MediaUpload = ({ files, onFileChange }: any) => (
//   <div className="space-y-4">
//     <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center">
//       <Upload className="mx-auto text-neutral-400" />
//       <p className="mt-2 text-sm text-neutral-600">
//         Choose a file or drag & drop it here
//       </p>
//       <p className="text-xs text-neutral-500">
//         JPEG, PNG, PDF, and MP4 formats, up to 50MB
//       </p>

//       <label className="mt-4 inline-block">
//         <input
//           type="file"
//           multiple
//           className="hidden"
//           onChange={onFileChange}
//         />
//         <span className="px-4 py-2 bg-purple-700 text-white rounded-lg cursor-pointer">
//           Browse File
//         </span>
//       </label>
//     </div>

//     {files.length > 0 && (
//       <div className="grid grid-cols-4 gap-4">
//         {files.map((file: File, index: number) => (
//           <div
//             key={index}
//             className="p-3 border rounded-lg text-xs text-neutral-600"
//           >
//             {file.name}
//           </div>
//         ))}
//       </div>
//     )}
//   </div>
// );

// /* ============================= INPUTS ============================= */

// const Input = ({ label, icon, full }: any) => (
//   <div className={full ? "col-span-2" : ""}>
//     <label className="block text-sm font-medium mb-1 text-neutral-700">
//       {label}
//     </label>
//     <div className="relative">
//       <input className="w-full h-10 px-3 pr-8 border border-neutral-200 rounded-lg bg-neutral-50 focus:ring-2 focus:ring-purple-500 outline-none" />
//       {icon && (
//         <div className="absolute right-2 top-2.5 text-neutral-400">
//           {icon}
//         </div>
//       )}
//     </div>
//   </div>
// );

// const Select = ({ label }: any) => (
//   <div>
//     <label className="block text-sm font-medium mb-1 text-neutral-700">
//       {label}
//     </label>
//     <select className="w-full h-10 px-3 border border-neutral-200 rounded-lg bg-neutral-50 focus:ring-2 focus:ring-purple-500 outline-none">
//       <option>Select</option>
//     </select>
//   </div>
// );

// const TextArea = ({ label, full }: any) => (
//   <div className={full ? "col-span-2" : ""}>
//     <label className="block text-sm font-medium mb-1 text-neutral-700">
//       {label}
//     </label>
//     <textarea
//       rows={4}
//       className="w-full border border-neutral-200 rounded-lg bg-neutral-50 p-3 focus:ring-2 focus:ring-purple-500 outline-none"
//     />
//   </div>
// );








// "use client";

// import React, { useState } from "react";
// import Image from "next/image";
// import { 
//   Upload, 
//   Plus, 
//   X, 
//   ChevronDown,
//   Info,
//   AlertCircle
// } from "lucide-react";
// import toast from "react-hot-toast";

// // Mock license type (would come from user context)
// const mockLicense = "Drug Manufacturing Licence (Form 25 / 28)";

// // License to category mapping (as per FRS)
// const licenseCategoryMap = {
//   "Drug Manufacturing Licence (Form 25 / 28)": ["Drugs"],
//   "Wholesale Drug Licence (Form 20B / 21B)": ["Drugs"],
//   "FSSAI Manufacturing Licence": ["Supplements / Nutraceuticals", "Food & Infant Nutrition"],
//   "FSSAI Trade / Marketing / Distribution Licence": ["Supplements / Nutraceuticals", "Food & Infant Nutrition"],
//   "Cosmetic Manufacturing Licence (Form 32)": ["Cosmetic & Personal Use"],
//   "Cosmetic Marketing Licence (Form 42)": ["Cosmetic & Personal Use"],
//   "Cosmetic Wholesale / Distribution Licence": ["Cosmetic & Personal Use"],
//   "Medical Device Manufacturing Licence (MD-5 / MD-9)": ["Medical Devices & Equipment"],
//   "Medical Device Wholesale / Distribution Licence (MD-42)": ["Medical Devices & Equipment"],
//   "GMP Compliance (Schedule M / M-II / ISO 13485)": ["Drugs", "Cosmetic & Personal Use", "Medical Devices & Equipment"],
//   "PCD Agreement (with Manufacturer / Brand Owner)": ["Drugs"],
// };

// // Get allowed categories based on license
// const getAllowedCategories = () => {
//   return licenseCategoryMap[mockLicense as keyof typeof licenseCategoryMap] || ["Drugs"];
// };

// // Category icons (for left sidebar)
// const categoryIcons: Record<string, string> = {
//   "Drugs": "/icons/drugs.svg",
//   "Supplements / Nutraceuticals": "/icons/supplements.svg",
//   "Food & Infant Nutrition": "/icons/food.svg",
//   "Cosmetic & Personal Use": "/icons/cosmetics.svg",
//   "Medical Devices & Equipment": "/icons/medical-devices.svg",
// };

// // Form sections
// type Section = "productDetails" | "packagingOrder" | "batchStockPricing" | "media";

// const AddProduct = () => {
//   const allowedCategories = getAllowedCategories();
//   const [selectedCategory, setSelectedCategory] = useState(allowedCategories[0]);
//   const [activeSection, setActiveSection] = useState<Section>("productDetails");
//   const [deviceType, setDeviceType] = useState<"consumable" | "nonConsumable" | null>(null);
//   const [files, setFiles] = useState<File[]>([]);
//   const [molecules, setMolecules] = useState([""]);

//   // Handle file upload
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       setFiles([...files, ...Array.from(e.target.files)]);
//     }
//   };

//   const removeFile = (index: number) => {
//     setFiles(files.filter((_, i) => i !== index));
//   };

//   // Handle molecule addition for drugs
//   const addMolecule = () => setMolecules([...molecules, ""]);
//   const removeMolecule = (index: number) => {
//     if (molecules.length > 1) {
//       setMolecules(molecules.filter((_, i) => i !== index));
//     }
//   };

//   // Render based on category
//   const renderProductDetails = () => {
//     switch (selectedCategory) {
//       case "Drugs":
//         return <DrugProductDetails molecules={molecules} addMolecule={addMolecule} removeMolecule={removeMolecule} />;
//       case "Supplements / Nutraceuticals":
//         return <SupplementProductDetails />;
//       case "Food & Infant Nutrition":
//         return <FoodProductDetails />;
//       case "Cosmetic & Personal Use":
//         return <CosmeticProductDetails />;
//       case "Medical Devices & Equipment":
//         return <MedicalDeviceProductDetails deviceType={deviceType} setDeviceType={setDeviceType} />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-h5 font-bold text-neutral-900">Add Product</h2>
//           <p className="text-p3 text-neutral-500">Here’s Your Current Sales Overview</p>
//         </div>
//         <div className="flex items-center gap-3">
//           <button className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors">
//             Cancel
//           </button>
//           <button className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors">
//             Save Draft
//           </button>
//           <button className="px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors">
//             Submit
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex gap-6">
//         {/* Left Sidebar - Categories */}
//         <div className="w-64 flex-shrink-0">
//           <div className="bg-white rounded-lg border border-neutral-200 p-4">
//             <h3 className="text-sm font-semibold text-neutral-700 mb-3">Product Categories</h3>
//             <ul className="space-y-1">
//               {allowedCategories.map((cat) => (
//                 <li key={cat}>
//                   <button
//                     onClick={() => setSelectedCategory(cat)}
//                     className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
//                       selectedCategory === cat
//                         ? "bg-primary-50 text-primary-900 font-medium"
//                         : "text-neutral-600 hover:bg-neutral-50"
//                     }`}
//                   >
//                     {categoryIcons[cat] && (
//                       <Image src={categoryIcons[cat]} alt={cat} width={20} height={20} />
//                     )}
//                     <span className="text-left">{cat}</span>
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>

//         {/* Right Main Form */}
//         <div className="flex-1">
//           {/* Section Tabs */}
//           <div className="flex border-b border-neutral-200 mb-6">
//             {["productDetails", "packagingOrder", "batchStockPricing", "media"].map((section) => (
//               <button
//                 key={section}
//                 onClick={() => setActiveSection(section as Section)}
//                 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
//                   activeSection === section
//                     ? "border-primary-900 text-primary-900"
//                     : "border-transparent text-neutral-500 hover:text-neutral-700"
//                 }`}
//               >
//                 {section === "productDetails" && "Product Details"}
//                 {section === "packagingOrder" && "Packaging & Order Details"}
//                 {section === "batchStockPricing" && "Batch, Stock, Pricing & Tax"}
//                 {section === "media" && "Media"}
//               </button>
//             ))}
//           </div>

//           {/* Section Content */}
//           <div className="bg-white rounded-lg border border-neutral-200 p-6">
//             {activeSection === "productDetails" && (
//               <div className="space-y-6">
//                 {renderProductDetails()}
//               </div>
//             )}

//             {activeSection === "packagingOrder" && (
//               <PackagingOrderDetails />
//             )}

//             {activeSection === "batchStockPricing" && (
//               <BatchStockPricingDetails category={selectedCategory} deviceType={deviceType} />
//             )}

//             {activeSection === "media" && (
//               <MediaUpload files={files} onFileChange={handleFileChange} onRemoveFile={removeFile} />
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ==================== Product Details Subcomponents ====================

// const DrugProductDetails = ({ molecules, addMolecule, removeMolecule }: any) => (
//   <div className="space-y-4">
//     <h3 className="text-h6 font-semibold text-neutral-900">Product Details</h3>
//     <div className="grid grid-cols-2 gap-4">
//       <InputField label="Therapeutic Category *" placeholder="e.g., Analgesic" />
//       <InputField label="Therapeutic Subcategory *" placeholder="e.g., NSAID" />
//       <InputField label="Product Name *" placeholder="e.g., Paracetamol" />
//       <div className="col-span-2">
//         <label className="block text-sm font-medium text-neutral-700 mb-1">Molecule *</label>
//         {molecules.map((mol: string, idx: number) => (
//           <div key={idx} className="flex items-center gap-2 mb-2">
//             <input
//               type="text"
//               value={mol}
//               onChange={(e) => {
//                 const newMolecules = [...molecules];
//                 newMolecules[idx] = e.target.value;
//                 // update state via parent
//               }}
//               placeholder={`Molecule ${idx + 1}`}
//               className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-600"
//             />
//             {idx === molecules.length - 1 ? (
//               <button onClick={addMolecule} className="p-2 text-primary-600 hover:bg-primary-50 rounded">
//                 <Plus size={18} />
//               </button>
//             ) : (
//               <button onClick={() => removeMolecule(idx)} className="p-2 text-warning-600 hover:bg-warning-50 rounded">
//                 <X size={18} />
//               </button>
//             )}
//           </div>
//         ))}
//       </div>
//       <InputField label="Dosage Form *" placeholder="e.g., Tablet / Capsule / Syrup / Injection" />
//       <InputField label="Strength (mg/ml) *" placeholder="e.g., 650 mg" />
//       <div className="col-span-2">
//         <InputField label="Warnings & Precautions *" placeholder="Enter contraindications, side effects, storage conditions" textarea />
//       </div>
//       <div className="col-span-2">
//         <InputField label="Product Description *" placeholder="Brief product overview, indications, pack details" textarea />
//       </div>
//       <InputField label="Product Marketing URL" placeholder="https://" />
//     </div>
//   </div>
// );

// const SupplementProductDetails = () => (
//   <div className="space-y-4">
//     <h3 className="text-h6 font-semibold text-neutral-900">Product Details</h3>
//     <div className="grid grid-cols-2 gap-4">
//       <InputField label="Therapeutic Category *" placeholder="e.g., Vitamins" />
//       <InputField label="Therapeutic Subcategory *" placeholder="e.g., Multivitamin" />
//       <InputField label="Product Name *" placeholder="e.g., Vitamin D3 60K IU" />
//       <InputField label="Active Ingredients *" placeholder="e.g., Cholecalciferol" />
//       <InputField label="Dosage Form *" placeholder="e.g., Tablet / Capsule / Syrup" />
//       <InputField label="Strength / Net Quantity *" placeholder="e.g., 60K IU" />
//       <div className="col-span-2">
//         <InputField label="Warnings & Precautions *" placeholder="Enter contraindications, side effects" textarea />
//       </div>
//       <div className="col-span-2">
//         <InputField label="Product Description *" placeholder="Brief product overview" textarea />
//       </div>
//       <InputField label="Nutritional Information Table *" placeholder="e.g., Serving size, nutrients" />
//       <InputField label="Recommended Daily Allowance (RDA %)" placeholder="e.g., 100%" />
//       <SelectField label="Veg / Non-Veg Indicator *" options={["Veg", "Non-Veg"]} />
//       <InputField label="Product Marketing URL" placeholder="https://" />
//     </div>
//   </div>
// );

// const FoodProductDetails = () => (
//   <div className="space-y-4">
//     <h3 className="text-h6 font-semibold text-neutral-900">Product Details</h3>
//     <div className="grid grid-cols-2 gap-4">
//       <InputField label="Product Name *" placeholder="e.g., Infant Formula" />
//       <SelectField label="Product Form *" options={["Powder", "Liquid", "Solid"]} />
//       <InputField label="Net Quantity / Serving Size *" placeholder="e.g., 400g" />
//       <div className="col-span-2">
//         <InputField label="Warnings & Precautions *" placeholder="Enter allergens, storage" textarea />
//       </div>
//       <div className="col-span-2">
//         <InputField label="Product Description *" placeholder="Brief product overview" textarea />
//       </div>
//       <InputField label="Nutritional Information Table *" placeholder="e.g., Calories, protein" />
//       <InputField label="Target Age Group *" placeholder="e.g., 0-6 months" />
//       <InputField label="Allergen Information *" placeholder="e.g., Contains milk" />
//       <SelectField label="Veg / Non-Veg Indicator *" options={["Veg", "Non-Veg"]} />
//       <InputField label="FSSAI Product Category Code *" placeholder="e.g., 12.2.1" />
//       <InputField label="Product Marketing URL" placeholder="https://" />
//     </div>
//   </div>
// );

// const CosmeticProductDetails = () => (
//   <div className="space-y-4">
//     <h3 className="text-h6 font-semibold text-neutral-900">Product Details</h3>
//     <div className="grid grid-cols-2 gap-4">
//       <InputField label="Product Name *" placeholder="e.g., Moisturizing Cream" />
//       <SelectField label="Product Type *" options={["Cream", "Lotion", "Gel", "Powder"]} />
//       <SelectField label="Gender *" options={["Male", "Female", "Unisex"]} />
//       <SelectField label="Intended Use Area *" options={["Face", "Hair", "Body"]} />
//       <InputField label="Skin / Hair Type *" placeholder="e.g., Dry skin" />
//       <InputField label="Ingredient List (INCI Names) *" placeholder="e.g., Aqua, Glycerin" />
//       <InputField label="Net Quantity *" placeholder="e.g., 50ml" />
//       <InputField label="Target Age Group *" placeholder="e.g., Adult" />
//       <div className="col-span-2">
//         <InputField label="Warnings & Precautions *" placeholder="Enter contraindications" textarea />
//       </div>
//       <div className="col-span-2">
//         <InputField label="Product Description *" placeholder="Brief product overview" textarea />
//       </div>
//       <InputField label="Product Marketing URL" placeholder="https://" />
//     </div>
//   </div>
// );

// const MedicalDeviceProductDetails = ({ deviceType, setDeviceType }: any) => (
//   <div className="space-y-4">
//     <h3 className="text-h6 font-semibold text-neutral-900">Product Details</h3>
//     <div className="mb-4">
//       <label className="block text-sm font-medium text-neutral-700 mb-2">Device Type *</label>
//       <div className="flex gap-4">
//         <label className="flex items-center gap-2">
//           <input
//             type="radio"
//             name="deviceType"
//             value="consumable"
//             checked={deviceType === "consumable"}
//             onChange={() => setDeviceType("consumable")}
//             className="w-4 h-4 text-primary-600"
//           />
//           <span className="text-sm">Consumable</span>
//         </label>
//         <label className="flex items-center gap-2">
//           <input
//             type="radio"
//             name="deviceType"
//             value="nonConsumable"
//             checked={deviceType === "nonConsumable"}
//             onChange={() => setDeviceType("nonConsumable")}
//             className="w-4 h-4 text-primary-600"
//           />
//           <span className="text-sm">Non-Consumable</span>
//         </label>
//       </div>
//     </div>
//     {deviceType === "consumable" && <ConsumableDeviceFields />}
//     {deviceType === "nonConsumable" && <NonConsumableDeviceFields />}
//   </div>
// );

// const ConsumableDeviceFields = () => (
//   <div className="grid grid-cols-2 gap-4">
//     <InputField label="Therapeutic Category *" placeholder="e.g., Cardiology" />
//     <InputField label="Therapeutic Sub-Category *" placeholder="e.g., Catheters" />
//     <InputField label="Device Category *" placeholder="e.g., Disposable" />
//     <InputField label="Product Name *" placeholder="e.g., Foley Catheter" />
//     <InputField label="Brand / Model Name *" placeholder="e.g., BARD 2-Way" />
//     <InputField label="Serial Number (if applicable)" placeholder="e.g., SN12345" />
//     <div className="col-span-2">
//       <InputField label="Product Description *" placeholder="Brief description" textarea />
//     </div>
//     <InputField label="Intended Use *" placeholder="e.g., Urinary drainage" />
//     <InputField label="Dimensions / Size *" placeholder="e.g., 16Fr" />
//     <InputField label="Material Composition *" placeholder="e.g., Silicone" />
//     <SelectField label="Sterile / Non-Sterile *" options={["Sterile", "Non-Sterile"]} />
//     <SelectField label="Single-Use / Disposable Indicator *" options={["Single-Use", "Reusable"]} />
//     <InputField label="Compatibility (if applicable)" placeholder="e.g., with drainage bag" />
//     <SelectField label="Device Class (A / B / C / D) *" options={["A", "B", "C", "D"]} />
//     <InputField label="Country of Origin *" placeholder="e.g., India" />
//     <div className="col-span-2">
//       <InputField label="Warnings & Precautions *" placeholder="Enter safety info" textarea />
//     </div>
//     <InputField label="Product Marketing URL" placeholder="https://" />
//   </div>
// );

// const NonConsumableDeviceFields = () => (
//   <div className="grid grid-cols-2 gap-4">
//     <InputField label="Therapeutic Category *" placeholder="e.g., Radiology" />
//     <InputField label="Therapeutic Subcategory *" placeholder="e.g., X-Ray Machines" />
//     <InputField label="Device Category *" placeholder="e.g., Imaging" />
//     <InputField label="Product Name *" placeholder="e.g., Digital X-Ray System" />
//     <InputField label="Brand / Model Name *" placeholder="e.g., Siemens Multix" />
//     <InputField label="Serial Number (if applicable)" placeholder="e.g., SN7890" />
//     <div className="col-span-2">
//       <InputField label="Product Description *" placeholder="Brief description" textarea />
//     </div>
//     <InputField label="Intended Use *" placeholder="e.g., Diagnostic imaging" />
//     <InputField label="Dimensions / Size *" placeholder="e.g., 150x150x180 cm" />
//     <InputField label="Weight *" placeholder="e.g., 500 kg" />
//     <InputField label="Material Composition *" placeholder="e.g., Metal, Plastic" />
//     <InputField label="Power Requirements *" placeholder="e.g., 220V, 50Hz" />
//     <InputField label="Compatibility *" placeholder="e.g., with DR detectors" />
//     <SelectField label="Device Class *" options={["A", "B", "C", "D"]} />
//     <InputField label="Regulatory Approval Number *" placeholder="e.g., CDSCO/123/2023" />
//     <InputField label="Country of Origin *" placeholder="e.g., Germany" />
//     <SelectField label="Warranty Applicable *" options={["Yes", "No"]} />
//     <InputField label="Warranty Period *" placeholder="e.g., 2 years" />
//     <div className="col-span-2">
//       <InputField label="Warnings & Precautions *" placeholder="Enter safety info" textarea />
//     </div>
//     <InputField label="Product Marketing URL" placeholder="https://" />
//   </div>
// );

// // ==================== Packaging & Order Details ====================

// const PackagingOrderDetails = () => (
//   <div className="space-y-4">
//     <h3 className="text-h6 font-semibold text-neutral-900">Packaging & Order Details</h3>
//     <div className="grid grid-cols-2 gap-4">
//       <InputField label="Packaging Unit *" placeholder="e.g., Strip / Bottle / Box" />
//       <InputField label="Number of Units *" placeholder="e.g., 10" />
//       <InputField label="Pack Size *" placeholder="e.g., 10 tablets per strip" />
//       <InputField label="Minimum Order Quantity *" placeholder="e.g., 5" />
//       <InputField label="Maximum Order Quantity *" placeholder="e.g., 1000" />
//     </div>
//   </div>
// );

// // ==================== Batch, Stock, Pricing & Tax ====================

// const BatchStockPricingDetails = ({ category, deviceType }: any) => {
//   const isNonConsumable = category === "Medical Devices & Equipment" && deviceType === "nonConsumable";
//   return (
//     <div className="space-y-4">
//       <h3 className="text-h6 font-semibold text-neutral-900">Batch, Stock Entry, Pricing & Tax Details</h3>
//       <div className="grid grid-cols-2 gap-4">
//         {!isNonConsumable && <InputField label="Batch/Lot Number *" placeholder="e.g., BATCH001" />}
//         <InputField label="Manufacturer Name *" placeholder="e.g., Sun Pharma" />
//         <InputField label="Manufacturing Date *" type="date" />
//         <InputField label="Expiry Date *" type="date" />
//         {category === "Food & Infant Nutrition" && (
//           <InputField label="Shelf Life (Months) *" placeholder="e.g., 24" />
//         )}
//         <InputField label="Storage Condition *" placeholder="e.g., Store in cool dry place" />
//         <InputField label="Stock Quantity *" placeholder="e.g., 500" />
//         <InputField label="Date of Entry *" type="date" />
//         <InputField label="Price Per Unit *" placeholder="e.g., 45.00" />
//         <InputField label="MRP *" placeholder="e.g., 50.00" />
//         <InputField label="Discount Percentage" placeholder="e.g., 10" />
//         {category !== "Medical Devices & Equipment" && (
//           <>
//             <InputField label="Minimum Purchase Quantity" placeholder="e.g., 10" />
//             <InputField label="Discount percentage" placeholder="e.g., 5" />
//           </>
//         )}
//         <InputField label="GST % *" placeholder="e.g., 12" />
//         <InputField label="HSN Code *" placeholder="e.g., 300490" />
//       </div>
//     </div>
//   );
// };

// // ==================== Media Upload ====================

// const MediaUpload = ({ files, onFileChange, onRemoveFile }: any) => (
//   <div className="space-y-4">
//     <h3 className="text-h6 font-semibold text-neutral-900">Media</h3>
//     <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center">
//       <Upload className="mx-auto h-12 w-12 text-neutral-400" />
//       <p className="mt-2 text-sm text-neutral-600">
//         Choose a file or drag & drop it here
//       </p>
//       <p className="text-xs text-neutral-500">
//         JPEG, PNG, PDF, and MP4 formats, up to 50MB
//       </p>
//       <label className="mt-4 inline-block">
//         <input
//           type="file"
//           multiple
//           accept="image/*,video/*,application/pdf"
//           onChange={onFileChange}
//           className="hidden"
//         />
//         <span className="px-4 py-2 bg-primary-900 text-white rounded-lg cursor-pointer hover:bg-primary-800 transition-colors">
//           Browse File
//         </span>
//       </label>
//     </div>
//     {files.length > 0 && (
//       <div className="grid grid-cols-4 gap-4 mt-4">
//         {files.map((file: File, index: number) => (
//           <div key={index} className="relative group">
//             {file.type.startsWith("image/") ? (
//               <Image
//                 src={URL.createObjectURL(file)}
//                 alt={file.name}
//                 width={100}
//                 height={100}
//                 className="w-full h-24 object-cover rounded-lg border border-neutral-200"
//               />
//             ) : (
//               <div className="w-full h-24 flex items-center justify-center bg-neutral-100 rounded-lg">
//                 <span className="text-xs text-neutral-600">{file.name.split('.').pop()}</span>
//               </div>
//             )}
//             <button
//               onClick={() => onRemoveFile(index)}
//               className="absolute -top-2 -right-2 bg-warning-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
//             >
//               <X size={14} />
//             </button>
//           </div>
//         ))}
//       </div>
//     )}
//   </div>
// );

// // ==================== Helper Components ====================

// const InputField = ({ label, placeholder, textarea, type = "text" }: any) => (
//   <div className={textarea ? "col-span-2" : ""}>
//     <label className="block text-sm font-medium text-neutral-700 mb-1">
//       {label}
//     </label>
//     {textarea ? (
//       <textarea
//         rows={3}
//         placeholder={placeholder}
//         className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-600"
//       />
//     ) : (
//       <input
//         type={type}
//         placeholder={placeholder}
//         className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-600"
//       />
//     )}
//   </div>
// );

// const SelectField = ({ label, options }: any) => (
//   <div>
//     <label className="block text-sm font-medium text-neutral-700 mb-1">
//       {label}
//     </label>
//     <select className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-600">
//       <option value="">Select</option>
//       {options.map((opt: string) => (
//         <option key={opt} value={opt}>{opt}</option>
//       ))}
//     </select>
//   </div>
// );

// export default AddProduct;