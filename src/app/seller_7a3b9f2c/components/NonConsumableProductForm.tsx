// "use client";

// import React, { useState, ChangeEvent, FormEvent } from 'react';
// import { BaseFormData, FormErrors } from './ProductOnboarding';

// interface NonConsumableFormData extends BaseFormData {
//   manufacturer: string;
//   model: string;
//   serialNumber: string;
//   intendedUse: string;
//   dimensions: string;
//   weight: string;
//   materialComposition: string;
//   powerRequirement: string;
//   compatibility: string;
//   deviceClass: string;
//   regulatoryApprovalNumber: string;
//   countryOfOrigin: string;
//   warrantyApplicable: string;
//   warrantyPeriod: string;
//   manufacturingDate: string;
//   expiryDate: string;
//   storageCondition: string;
// }

// function NonConsumableProductForm() {
//   const [formData, setFormData] = useState<NonConsumableFormData>({
//     // Common fields
//     productCategory: '',
//     therapeuticCategory: '',
//     subCategory: '',
//     productName: '',
//     productDescription: '',
//     warnings: '',
//     productImage: null,

//     // Packaging & Order Details
//     packagingUnit: '',
//     moq: '',
//     maxOrderQuantity: '',

//     // Stock, Pricing & Tax Details
//     stockQuantity: '',
//     dateOfEntry: '',
//     pricePerUnit: '',
//     discountPercentage: '',
//     gstPercentage: '',
//     hsnCode: '',

//     // Non-Consumable specific
//     manufacturer: '',
//     model: '',
//     serialNumber: '',
//     intendedUse: '',
//     dimensions: '',
//     weight: '',
//     materialComposition: '',
//     powerRequirement: '',
//     compatibility: '',
//     deviceClass: '',
//     regulatoryApprovalNumber: '',
//     countryOfOrigin: '',
//     warrantyApplicable: '',
//     warrantyPeriod: '',
//     manufacturingDate: '',
//     expiryDate: '',
//     storageCondition: '',
//   });

//   const [errors, setErrors] = useState<FormErrors>({});
//   const [imagePreview, setImagePreview] = useState<string | null>(null);

//   const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;

//     if (type === 'file') {
//       const fileInput = e.target as HTMLInputElement;
//       const file = fileInput.files?.[0] || null;
//       setFormData(prev => ({ ...prev, [name]: file }));

//       if (file) {
//         const reader = new FileReader();
//         reader.onloadend = () => setImagePreview(reader.result as string);
//         reader.readAsDataURL(file);
//       } else {
//         setImagePreview(null);
//       }
//     } else {
//       setFormData(prev => ({ ...prev, [name]: value }));
//     }

//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors: FormErrors = {};

//     const requiredFields: (keyof NonConsumableFormData)[] = [
//       'productCategory', 'productName', 'packagingUnit',
//       'moq', 'stockQuantity', 'pricePerUnit', 'gstPercentage',
//       'manufacturingDate', 'expiryDate'
//     ];

//     requiredFields.forEach(field => {
//       if (!formData[field]) {
//         newErrors[field] = 'This field is required';
//       }
//     });

//     if (formData.manufacturingDate && formData.expiryDate) {
//       const manufacturing = new Date(formData.manufacturingDate);
//       const expiry = new Date(formData.expiryDate);
//       if (expiry <= manufacturing) {
//         newErrors.expiryDate = 'Expiry date must be after manufacturing date';
//       }
//     }

//     if (formData.moq && formData.maxOrderQuantity) {
//       const moqNum = parseInt(formData.moq);
//       const maxOrderNum = parseInt(formData.maxOrderQuantity);
//       if (maxOrderNum <= moqNum) {
//         newErrors.maxOrderQuantity = 'Maximum order must be greater than MOQ';
//       }
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     if (validateForm()) {
//       console.log('Non-Consumable form submitted:', formData);
//       alert('Non-Consumable product registered successfully!');
//     }
//   };

//   const handleReset = () => {
//     setFormData({
//       productCategory: '',
//       therapeuticCategory: '',
//       subCategory: '',
//       productName: '',
//       productDescription: '',
//       warnings: '',
//       productImage: null,
//       packagingUnit: '',
//       moq: '',
//       maxOrderQuantity: '',
//       stockQuantity: '',
//       dateOfEntry: '',
//       pricePerUnit: '',
//       discountPercentage: '',
//       gstPercentage: '',
//       hsnCode: '',
//       manufacturer: '',
//       model: '',
//       serialNumber: '',
//       intendedUse: '',
//       dimensions: '',
//       weight: '',
//       materialComposition: '',
//       powerRequirement: '',
//       compatibility: '',
//       deviceClass: '',
//       regulatoryApprovalNumber: '',
//       countryOfOrigin: '',
//       warrantyApplicable: '',
//       warrantyPeriod: '',
//       manufacturingDate: '',
//       expiryDate: '',
//       storageCondition: '',
//     });
//     setImagePreview(null);
//     setErrors({});
//   };

//   return (
//     <form onSubmit={handleSubmit} className="po-seller-register-form">
//       {/* Product Details Card */}
//       <div className="po-form-card po-card-primary">
//         <div className="po-card-header">
//           <div className="po-card-icon">
//             <i className="fas fa-toolbox"></i>
//           </div>
//           <h2>Equipment Details</h2>
//           {/* <span className="po-card-badge">Required</span> */}
//           <span className="po-product-type-tag">
//             <i className="fas fa-stethoscope"></i>
//             Non-Consumable
//           </span>
//         </div>

//         <div className="po-card-body">
//           {/* Row 1: Basic Details */}
//           <div className="po-row po-mb-3">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="productCategory" className="po-form-label">
//                   <i className="fas fa-tag po-label-icon"></i>
//                   Equipment Category *
//                 </label>
//                 <select
//                   id="productCategory"
//                   name="productCategory"
//                   className={`po-form-control ${errors.productCategory ? 'po-is-invalid' : ''}`}
//                   value={formData.productCategory}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select category</option>
//                   <option value="Surgical Instruments">Surgical Instruments</option>
//                   <option value="Diagnostic Equipment">Diagnostic Equipment</option>
//                   <option value="Patient Monitoring">Patient Monitoring</option>
//                   <option value="Therapeutic Equipment">Therapeutic Equipment</option>
//                   <option value="Laboratory Equipment">Laboratory Equipment</option>
//                   <option value="Disposable Equipment">Disposable Equipment</option>
//                   <option value="Mobility Aids">Mobility Aids</option>
//                   <option value="Hospital Furniture">Hospital Furniture</option>
//                 </select>
//                 {errors.productCategory && (
//                   <div className="po-invalid-feedback">{errors.productCategory}</div>
//                 )}
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="therapeuticCategory" className="po-form-label">
//                   <i className="fas fa-heartbeat po-label-icon"></i>
//                   Medical Specialty
//                 </label>
//                 <select
//                   id="therapeuticCategory"
//                   name="therapeuticCategory"
//                   className="po-form-control"
//                   value={formData.therapeuticCategory}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select specialty</option>
//                   <option value="Cardiology">Cardiology</option>
//                   <option value="Orthopedics">Orthopedics</option>
//                   <option value="Neurology">Neurology</option>
//                   <option value="General Surgery">General Surgery</option>
//                   <option value="Dental">Dental</option>
//                   <option value="Ophthalmology">Ophthalmology</option>
//                   <option value="Emergency Medicine">Emergency Medicine</option>
//                   <option value="Critical Care">Critical Care</option>
//                 </select>
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="subCategory" className="po-form-label">
//                   <i className="fas fa-sitemap po-label-icon"></i>
//                   Sub Category
//                 </label>
//                 <input
//                   type="text"
//                   id="subCategory"
//                   name="subCategory"
//                   className="po-form-control"
//                   placeholder="e.g., Surgical Instruments, Monitors"
//                   value={formData.subCategory}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="productName" className="po-form-label">
//                   <i className="fas fa-tools po-label-icon"></i>
//                   Equipment Name *
//                 </label>
//                 <input
//                   type="text"
//                   id="productName"
//                   name="productName"
//                   className={`po-form-control ${errors.productName ? 'po-is-invalid' : ''}`}
//                   placeholder="e.g., Surgical Scissors, BP Monitor"
//                   value={formData.productName}
//                   onChange={handleChange}
//                 />
//                 {errors.productName && (
//                   <div className="po-invalid-feedback">{errors.productName}</div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Row 2: Manufacturer Details */}
//           <div className="po-row po-mb-3">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="manufacturer" className="po-form-label">
//                   <i className="fas fa-industry po-label-icon"></i>
//                   Manufacturer
//                 </label>
//                 <input
//                   type="text"
//                   id="manufacturer"
//                   name="manufacturer"
//                   className="po-form-control"
//                   placeholder="e.g., GE Healthcare, Philips"
//                   value={formData.manufacturer}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="model" className="po-form-label">
//                   <i className="fas fa-microchip po-label-icon"></i>
//                   Model
//                 </label>
//                 <input
//                   type="text"
//                   id="model"
//                   name="model"
//                   className="po-form-control"
//                   placeholder="e.g., Model X-2000"
//                   value={formData.model}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="serialNumber" className="po-form-label">
//                   <i className="fas fa-barcode po-label-icon"></i>
//                   Serial Number
//                 </label>
//                 <input
//                   type="text"
//                   id="serialNumber"
//                   name="serialNumber"
//                   className="po-form-control"
//                   placeholder="e.g., SN-123456789"
//                   value={formData.serialNumber}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="intendedUse" className="po-form-label">
//                   <i className="fas fa-stethoscope po-label-icon"></i>
//                   Intended Use
//                 </label>
//                 <input
//                   type="text"
//                   id="intendedUse"
//                   name="intendedUse"
//                   className="po-form-control"
//                   placeholder="e.g., Surgical procedures, Patient monitoring"
//                   value={formData.intendedUse}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Row 3: Physical Specifications */}
//           <div className="po-row po-mb-3">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="dimensions" className="po-form-label">
//                   <i className="fas fa-ruler-combined po-label-icon"></i>
//                   Dimensions / Size
//                 </label>
//                 <input
//                   type="text"
//                   id="dimensions"
//                   name="dimensions"
//                   className="po-form-control"
//                   placeholder="e.g., 100x50x30 cm"
//                   value={formData.dimensions}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="weight" className="po-form-label">
//                   <i className="fas fa-weight po-label-icon"></i>
//                   Weight
//                 </label>
//                 <input
//                   type="text"
//                   id="weight"
//                   name="weight"
//                   className="po-form-control"
//                   placeholder="e.g., 15 kg"
//                   value={formData.weight}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="materialComposition" className="po-form-label">
//                   <i className="fas fa-layer-group po-label-icon"></i>
//                   Material Composition
//                 </label>
//                 <input
//                   type="text"
//                   id="materialComposition"
//                   name="materialComposition"
//                   className="po-form-control"
//                   placeholder="e.g., Stainless Steel, Plastic"
//                   value={formData.materialComposition}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="powerRequirement" className="po-form-label">
//                   <i className="fas fa-plug po-label-icon"></i>
//                   Power Requirement
//                 </label>
//                 <input
//                   type="text"
//                   id="powerRequirement"
//                   name="powerRequirement"
//                   className="po-form-control"
//                   placeholder="e.g., 220V AC, Battery operated"
//                   value={formData.powerRequirement}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Row 4: Technical & Regulatory */}
//           <div className="po-row po-mb-3">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="compatibility" className="po-form-label">
//                   <i className="fas fa-link po-label-icon"></i>
//                   Compatibility
//                 </label>
//                 <input
//                   type="text"
//                   id="compatibility"
//                   name="compatibility"
//                   className="po-form-control"
//                   placeholder="e.g., Compatible with standard systems"
//                   value={formData.compatibility}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="deviceClass" className="po-form-label">
//                   <i className="fas fa-shield-alt po-label-icon"></i>
//                   Device Class
//                 </label>
//                 <select
//                   id="deviceClass"
//                   name="deviceClass"
//                   className="po-form-control"
//                   value={formData.deviceClass}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select class</option>
//                   <option value="Class I">Class I (Low risk)</option>
//                   <option value="Class II">Class II (Medium risk)</option>
//                   <option value="Class III">Class III (High risk)</option>
//                   <option value="Not Applicable">Not Applicable</option>
//                 </select>
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="regulatoryApprovalNumber" className="po-form-label">
//                   <i className="fas fa-certificate po-label-icon"></i>
//                   Regulatory Approval Number
//                 </label>
//                 <input
//                   type="text"
//                   id="regulatoryApprovalNumber"
//                   name="regulatoryApprovalNumber"
//                   className="po-form-control"
//                   placeholder="e.g., FDA 510(k), CE Mark"
//                   value={formData.regulatoryApprovalNumber}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="countryOfOrigin" className="po-form-label">
//                   <i className="fas fa-globe po-label-icon"></i>
//                   Country of Origin
//                 </label>
//                 <input
//                   type="text"
//                   id="countryOfOrigin"
//                   name="countryOfOrigin"
//                   className="po-form-control"
//                   placeholder="e.g., USA, Germany, Japan"
//                   value={formData.countryOfOrigin}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Row 5: Warranty & Warnings */}
//           <div className="po-row po-mb-3">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="warrantyApplicable" className="po-form-label">
//                   <i className="fas fa-calendar-check po-label-icon"></i>
//                   Warranty Applicable
//                 </label>
//                 <select
//                   id="warrantyApplicable"
//                   name="warrantyApplicable"
//                   className="po-form-control"
//                   value={formData.warrantyApplicable}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select</option>
//                   <option value="Yes">Yes</option>
//                   <option value="No">No</option>
//                 </select>
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="warrantyPeriod" className="po-form-label">
//                   <i className="fas fa-clock po-label-icon"></i>
//                   Warranty Period
//                 </label>
//                 <select
//                   id="warrantyPeriod"
//                   name="warrantyPeriod"
//                   className="po-form-control"
//                   value={formData.warrantyPeriod}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select period</option>
//                   <option value="3 Months">3 Months</option>
//                   <option value="6 Months">6 Months</option>
//                   <option value="1 Year">1 Year</option>
//                   <option value="2 Years">2 Years</option>
//                   <option value="3 Years">3 Years</option>
//                   <option value="5 Years">5 Years</option>
//                   <option value="Lifetime">Lifetime</option>
//                 </select>
//               </div>
//             </div>

//             <div className="po-col-md-6">
//               <div className="po-form-group">
//                 <label htmlFor="warnings" className="po-form-label">
//                   <i className="fas fa-exclamation-triangle po-label-icon"></i>
//                   Warnings / Precautions
//                 </label>
//                 <input
//                   type="text"
//                   id="warnings"
//                   name="warnings"
//                   className="po-form-control"
//                   placeholder="e.g., For professional use only, Read manual before use"
//                   value={formData.warnings}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Row 6: Description & Image */}
//           <div className="po-row">
//             <div className="po-col-md-6">
//               <div className="po-form-group">
//                 <label htmlFor="productDescription" className="po-form-label">
//                   <i className="fas fa-file-alt po-label-icon"></i>
//                   Equipment Description
//                 </label>
//                 <textarea
//                   id="productDescription"
//                   name="productDescription"
//                   className="po-form-control"
//                   placeholder="Enter detailed equipment description, features, usage instructions..."
//                   rows={3}
//                   value={formData.productDescription}
//                   onChange={handleChange}
//                 />
//                 <small className="po-form-text po-text-muted">Max 500 characters</small>
//               </div>
//             </div>

//             <div className="po-col-md-6">
//               <div className="po-form-group">
//                 <label htmlFor="productImage" className="po-form-label">
//                   <i className="fas fa-image po-label-icon"></i>
//                   Equipment Image
//                 </label>
//                 <div className="po-image-upload-container">
//                   <div className="po-image-preview">
//                     {imagePreview ? (
//                       <img src={imagePreview} alt="Preview" className="po-preview-image" />
//                     ) : (
//                       <div className="po-preview-placeholder">
//                         <i className="fas fa-image"></i>
//                         <span>Image preview</span>
//                       </div>
//                     )}
//                   </div>
//                   <div className="po-upload-controls">
//                     <input
//                       type="file"
//                       id="productImage"
//                       name="productImage"
//                       className="po-file-input"
//                       accept=".jpg,.jpeg,.png,.webp"
//                       onChange={handleChange}
//                       style={{ display: 'none' }}
//                     />
//                     <label htmlFor="productImage" className="po-upload-btn">
//                       Choose Image
//                     </label>
//                     <small className="po-form-text po-d-block po-mt-2">JPG, PNG or WebP. Max 5MB</small>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Packaging & Order Details Card */}
//       <div className="po-form-card po-card-secondary po-mt-4">
//         <div className="po-card-header">
//           <div className="po-card-icon">
//             <i className="fas fa-box"></i>
//           </div>
//           <h2>Packaging & Order Details</h2>
//         </div>

//         <div className="po-card-body">
//           <div className="po-row">
//             <div className="po-col-md-4">
//               <div className="po-form-group">
//                 <label htmlFor="packagingUnit" className="po-form-label">
//                   <i className="fas fa-box-open po-label-icon"></i>
//                   Packaging Unit *
//                 </label>
//                 <input
//                   type="text"
//                   id="packagingUnit"
//                   name="packagingUnit"
//                   className={`po-form-control ${errors.packagingUnit ? 'po-is-invalid' : ''}`}
//                   placeholder="e.g., Box, Case, Kit"
//                   value={formData.packagingUnit}
//                   onChange={handleChange}
//                 />
//                 {errors.packagingUnit && (
//                   <div className="po-invalid-feedback">{errors.packagingUnit}</div>
//                 )}
//               </div>
//             </div>

//             <div className="po-col-md-4">
//               <div className="po-form-group">
//                 <label htmlFor="moq" className="po-form-label">
//                   <i className="fas fa-sort-amount-down po-label-icon"></i>
//                   Minimum Order Quantity (MOQ) *
//                 </label>
//                 <input
//                   type="number"
//                   id="moq"
//                   name="moq"
//                   className={`po-form-control ${errors.moq ? 'po-is-invalid' : ''}`}
//                   placeholder="e.g., 1 unit"
//                   min="1"
//                   value={formData.moq}
//                   onChange={handleChange}
//                 />
//                 {errors.moq && (
//                   <div className="po-invalid-feedback">{errors.moq}</div>
//                 )}
//               </div>
//             </div>

//             <div className="po-col-md-4">
//               <div className="po-form-group">
//                 <label htmlFor="maxOrderQuantity" className="po-form-label">
//                   <i className="fas fa-sort-amount-up po-label-icon"></i>
//                   Maximum Order Quantity *
//                 </label>
//                 <input
//                   type="number"
//                   id="maxOrderQuantity"
//                   name="maxOrderQuantity"
//                   className={`po-form-control ${errors.maxOrderQuantity ? 'po-is-invalid' : ''}`}
//                   placeholder="e.g., 1000"
//                   min="1"
//                   value={formData.maxOrderQuantity}
//                   onChange={handleChange}
//                 />
//                 {errors.maxOrderQuantity && (
//                   <div className="po-invalid-feedback">{errors.maxOrderQuantity}</div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Manufacturing, Stock, Pricing & Tax Details Card */}
//       <div className="po-form-card po-card-accent po-mt-4">
//         <div className="po-card-header">
//           <div className="po-card-icon">
//             <i className="fas fa-chart-line"></i>
//           </div>
//           <h2>Manufacturing, Stock, Pricing & Tax Details</h2>
//         </div>

//         <div className="po-card-body">
//           {/* Row 1: Manufacturing & Storage */}
//           <div className="po-row po-mb-4">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="manufacturingDate" className="po-form-label">
//                   <i className="fas fa-calendar-plus po-label-icon"></i>
//                   Manufacturing Date *
//                 </label>
//                 <input
//                   type="date"
//                   id="manufacturingDate"
//                   name="manufacturingDate"
//                   className={`po-form-control ${errors.manufacturingDate ? 'po-is-invalid' : ''}`}
//                   value={formData.manufacturingDate}
//                   onChange={handleChange}
//                 />
//                 {errors.manufacturingDate && (
//                   <div className="po-invalid-feedback">{errors.manufacturingDate}</div>
//                 )}
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="expiryDate" className="po-form-label">
//                   <i className="fas fa-calendar-times po-label-icon"></i>
//                   Expiry Date *
//                 </label>
//                 <input
//                   type="date"
//                   id="expiryDate"
//                   name="expiryDate"
//                   className={`po-form-control ${errors.expiryDate ? 'po-is-invalid' : ''}`}
//                   value={formData.expiryDate}
//                   onChange={handleChange}
//                 />
//                 {errors.expiryDate && (
//                   <div className="po-invalid-feedback">{errors.expiryDate}</div>
//                 )}
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="storageCondition" className="po-form-label">
//                   <i className="fas fa-temperature-low po-label-icon"></i>
//                   Storage Condition
//                 </label>
//                 <select
//                   id="storageCondition"
//                   name="storageCondition"
//                   className="po-form-control"
//                   value={formData.storageCondition}
//                   onChange={handleChange}
//                 >
//                   <option value="">Select condition</option>
//                   <option value="Room Temperature">Room Temperature</option>
//                   <option value="Dry Place">Dry Place</option>
//                   <option value="Avoid Moisture">Avoid Moisture</option>
//                   <option value="No Special Requirements">No Special Requirements</option>
//                 </select>
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="stockQuantity" className="po-form-label">
//                   <i className="fas fa-boxes po-label-icon"></i>
//                   Stock Quantity *
//                 </label>
//                 <input
//                   type="number"
//                   id="stockQuantity"
//                   name="stockQuantity"
//                   className={`po-form-control ${errors.stockQuantity ? 'po-is-invalid' : ''}`}
//                   placeholder="e.g., 50"
//                   min="0"
//                   value={formData.stockQuantity}
//                   onChange={handleChange}
//                 />
//                 {errors.stockQuantity && (
//                   <div className="po-invalid-feedback">{errors.stockQuantity}</div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Row 2: Pricing & Discount */}
//           <div className="po-row po-mb-4">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="dateOfEntry" className="po-form-label">
//                   <i className="fas fa-calendar-day po-label-icon"></i>
//                   Date of Entry
//                 </label>
//                 <input
//                   type="date"
//                   id="dateOfEntry"
//                   name="dateOfEntry"
//                   className="po-form-control"
//                   value={formData.dateOfEntry}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="pricePerUnit" className="po-form-label">
//                   <i className="fas fa-rupee-sign po-label-icon"></i>
//                   Price per Unit *
//                 </label>
//                 <div className="po-input-group">
//                   <div className="po-input-group-prepend">
//                     <span className="po-input-group-text">₹</span>
//                   </div>
//                   <input
//                     type="number"
//                     id="pricePerUnit"
//                     name="pricePerUnit"
//                     className={`po-form-control ${errors.pricePerUnit ? 'po-is-invalid' : ''}`}
//                     placeholder="0.00"
//                     step="0.01"
//                     min="0"
//                     value={formData.pricePerUnit}
//                     onChange={handleChange}
//                   />
//                 </div>
//                 {errors.pricePerUnit && (
//                   <div className="po-invalid-feedback">{errors.pricePerUnit}</div>
//                 )}
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="discountPercentage" className="po-form-label">
//                   <i className="fas fa-percentage po-label-icon"></i>
//                   Discount Percentage
//                 </label>
//                 <div className="po-input-group">
//                   <input
//                     type="number"
//                     id="discountPercentage"
//                     name="discountPercentage"
//                     className="po-form-control"
//                     placeholder="0.00"
//                     step="0.01"
//                     min="0"
//                     max="100"
//                     value={formData.discountPercentage}
//                     onChange={handleChange}
//                   />
//                   <div className="po-input-group-append">
//                     <span className="po-input-group-text">%</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="gstPercentage" className="po-form-label">
//                   <i className="fas fa-receipt po-label-icon"></i>
//                   GST % *
//                 </label>
//                 <div className="po-input-group">
//                   <input
//                     type="number"
//                     id="gstPercentage"
//                     name="gstPercentage"
//                     className={`po-form-control ${errors.gstPercentage ? 'po-is-invalid' : ''}`}
//                     placeholder="e.g., 18"
//                     step="0.01"
//                     min="0"
//                     value={formData.gstPercentage}
//                     onChange={handleChange}
//                   />
//                   <div className="po-input-group-append">
//                     <span className="po-input-group-text">%</span>
//                   </div>
//                 </div>
//                 {errors.gstPercentage && (
//                   <div className="po-invalid-feedback">{errors.gstPercentage}</div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Row 3: HSN Code */}
//           <div className="po-row">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="hsnCode" className="po-form-label">
//                   <i className="fas fa-code po-label-icon"></i>
//                   HSN Code
//                 </label>
//                 <input
//                   type="text"
//                   id="hsnCode"
//                   name="hsnCode"
//                   className="po-form-control"
//                   placeholder="e.g., 9018"
//                   value={formData.hsnCode}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="po-form-actions">
//         <div className="po-form-note">
//           <i className="fas fa-info-circle"></i>
//           <span>Fields marked with * are required</span>
//           <span className="po-product-type-display">
//             | Product Type: <strong>Non-Consumables (Medical Equipment)</strong>
//           </span>
//         </div>
//         <div className="po-button-group">
//           <button type="button" className="po-btn po-btn-secondary po-btn-lg" onClick={handleReset}>
//             <i className="fas fa-redo"></i> Reset Form
//           </button>
//           <button type="submit" className="po-btn po-btn-primary po-btn-lg po-submit-btn">
//             <i className="fas fa-check-circle"></i> Register Equipment
//           </button>
//         </div>
//       </div>
//     </form>
//   );
// }

// export default NonConsumableProductForm;




















// // "use client";

// // import React, { useState, ChangeEvent, FormEvent } from 'react';
// // import { BaseFormData, FormErrors } from './ProductOnboarding';

// // interface NonConsumableFormData extends BaseFormData {
// //   manufacturer: string;
// //   model: string;
// //   serialNumber: string;
// //   intendedUse: string;
// //   dimensions: string;
// //   weight: string;
// //   materialComposition: string;
// //   powerRequirement: string;
// //   compatibility: string;
// //   deviceClass: string;
// //   regulatoryApprovalNumber: string;
// //   countryOfOrigin: string;
// //   warrantyApplicable: string;
// //   warrantyPeriod: string;
// //   manufacturingDate: string;
// //   expiryDate: string;
// //   storageCondition: string;
// // }

// // function NonConsumableProductForm() {
// //   const [formData, setFormData] = useState<NonConsumableFormData>({
// //     // Common fields
// //     productCategory: '',
// //     therapeuticCategory: '',
// //     subCategory: '',
// //     productName: '',
// //     productDescription: '',
// //     warnings: '',
// //     productImage: null,

// //     // Packaging & Order Details
// //     packagingUnit: '',
// //     moq: '',
// //     maxOrderQuantity: '',

// //     // Stock, Pricing & Tax Details
// //     stockQuantity: '',
// //     dateOfEntry: '',
// //     pricePerUnit: '',
// //     discountPercentage: '',
// //     gstPercentage: '',
// //     hsnCode: '',

// //     // Non-Consumable specific
// //     manufacturer: '',
// //     model: '',
// //     serialNumber: '',
// //     intendedUse: '',
// //     dimensions: '',
// //     weight: '',
// //     materialComposition: '',
// //     powerRequirement: '',
// //     compatibility: '',
// //     deviceClass: '',
// //     regulatoryApprovalNumber: '',
// //     countryOfOrigin: '',
// //     warrantyApplicable: '',
// //     warrantyPeriod: '',
// //     manufacturingDate: '',
// //     expiryDate: '',
// //     storageCondition: '',
// //   });

// //   const [errors, setErrors] = useState<FormErrors>({});
// //   const [imagePreview, setImagePreview] = useState<string | null>(null);

// //   const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
// //     const { name, value, type } = e.target;

// //     if (type === 'file') {
// //       const fileInput = e.target as HTMLInputElement;
// //       const file = fileInput.files?.[0] || null;
// //       setFormData(prev => ({ ...prev, [name]: file }));

// //       if (file) {
// //         const reader = new FileReader();
// //         reader.onloadend = () => setImagePreview(reader.result as string);
// //         reader.readAsDataURL(file);
// //       } else {
// //         setImagePreview(null);
// //       }
// //     } else {
// //       setFormData(prev => ({ ...prev, [name]: value }));
// //     }

// //     if (errors[name]) {
// //       setErrors(prev => ({ ...prev, [name]: '' }));
// //     }
// //   };

// //   const validateForm = () => {
// //     const newErrors: FormErrors = {};

// //     const requiredFields: (keyof NonConsumableFormData)[] = [
// //       'productCategory', 'productName', 'packagingUnit',
// //       'moq', 'stockQuantity', 'pricePerUnit', 'gstPercentage',
// //       'manufacturingDate', 'expiryDate'
// //     ];

// //     requiredFields.forEach(field => {
// //       if (!formData[field]) {
// //         newErrors[field] = 'This field is required';
// //       }
// //     });

// //     if (formData.manufacturingDate && formData.expiryDate) {
// //       const manufacturing = new Date(formData.manufacturingDate);
// //       const expiry = new Date(formData.expiryDate);
// //       if (expiry <= manufacturing) {
// //         newErrors.expiryDate = 'Expiry date must be after manufacturing date';
// //       }
// //     }

// //     if (formData.moq && formData.maxOrderQuantity) {
// //       const moqNum = parseInt(formData.moq);
// //       const maxOrderNum = parseInt(formData.maxOrderQuantity);
// //       if (maxOrderNum <= moqNum) {
// //         newErrors.maxOrderQuantity = 'Maximum order must be greater than MOQ';
// //       }
// //     }

// //     setErrors(newErrors);
// //     return Object.keys(newErrors).length === 0;
// //   };

// //   const handleSubmit = (e: FormEvent) => {
// //     e.preventDefault();
// //     if (validateForm()) {
// //       console.log('Non-Consumable form submitted:', formData);
// //       alert('Non-Consumable product registered successfully!');
// //     }
// //   };

// //   const handleReset = () => {
// //     setFormData({
// //       productCategory: '',
// //       therapeuticCategory: '',
// //       subCategory: '',
// //       productName: '',
// //       productDescription: '',
// //       warnings: '',
// //       productImage: null,
// //       packagingUnit: '',
// //       moq: '',
// //       maxOrderQuantity: '',
// //       stockQuantity: '',
// //       dateOfEntry: '',
// //       pricePerUnit: '',
// //       discountPercentage: '',
// //       gstPercentage: '',
// //       hsnCode: '',
// //       manufacturer: '',
// //       model: '',
// //       serialNumber: '',
// //       intendedUse: '',
// //       dimensions: '',
// //       weight: '',
// //       materialComposition: '',
// //       powerRequirement: '',
// //       compatibility: '',
// //       deviceClass: '',
// //       regulatoryApprovalNumber: '',
// //       countryOfOrigin: '',
// //       warrantyApplicable: '',
// //       warrantyPeriod: '',
// //       manufacturingDate: '',
// //       expiryDate: '',
// //       storageCondition: '',
// //     });
// //     setImagePreview(null);
// //     setErrors({});
// //   };

// //   return (
// //     <form onSubmit={handleSubmit} className="po-seller-register-form">
// //       {/* Product Details Card */}
// //       <div className="po-form-card po-card-primary">
// //         <div className="po-card-header">
// //           <div className="po-card-icon">
// //             <i className="fas fa-toolbox"></i>
// //           </div>
// //           <h2>Equipment Details</h2>
// //           {/* <span className="po-card-badge">Required</span> */}
// //           <span className="po-product-type-tag">
// //             <i className="fas fa-stethoscope"></i>
// //             Non-Consumable
// //           </span>
// //         </div>

// //         <div className="po-card-body">
// //           {/* Row 1: Basic Details */}
// //           <div className="po-row po-mb-3">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="productCategory" className="po-form-label">
// //                   <i className="fas fa-tag po-label-icon"></i>
// //                   Equipment Category *
// //                 </label>
// //                 <select
// //                   id="productCategory"
// //                   name="productCategory"
// //                   className={`po-form-control ${errors.productCategory ? 'po-is-invalid' : ''}`}
// //                   value={formData.productCategory}
// //                   onChange={handleChange}
// //                 >
// //                   <option value="">Select category</option>
// //                   <option value="Surgical Instruments">Surgical Instruments</option>
// //                   <option value="Diagnostic Equipment">Diagnostic Equipment</option>
// //                   <option value="Patient Monitoring">Patient Monitoring</option>
// //                   <option value="Therapeutic Equipment">Therapeutic Equipment</option>
// //                   <option value="Laboratory Equipment">Laboratory Equipment</option>
// //                   <option value="Disposable Equipment">Disposable Equipment</option>
// //                   <option value="Mobility Aids">Mobility Aids</option>
// //                   <option value="Hospital Furniture">Hospital Furniture</option>
// //                 </select>
// //                 {errors.productCategory && (
// //                   <div className="po-invalid-feedback">{errors.productCategory}</div>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="therapeuticCategory" className="po-form-label">
// //                   <i className="fas fa-heartbeat po-label-icon"></i>
// //                   Medical Specialty
// //                 </label>
// //                 <select
// //                   id="therapeuticCategory"
// //                   name="therapeuticCategory"
// //                   className="po-form-control"
// //                   value={formData.therapeuticCategory}
// //                   onChange={handleChange}
// //                 >
// //                   <option value="">Select specialty</option>
// //                   <option value="Cardiology">Cardiology</option>
// //                   <option value="Orthopedics">Orthopedics</option>
// //                   <option value="Neurology">Neurology</option>
// //                   <option value="General Surgery">General Surgery</option>
// //                   <option value="Dental">Dental</option>
// //                   <option value="Ophthalmology">Ophthalmology</option>
// //                   <option value="Emergency Medicine">Emergency Medicine</option>
// //                   <option value="Critical Care">Critical Care</option>
// //                 </select>
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="subCategory" className="po-form-label">
// //                   <i className="fas fa-sitemap po-label-icon"></i>
// //                   Sub Category
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="subCategory"
// //                   name="subCategory"
// //                   className="po-form-control"
// //                   placeholder="e.g., Surgical Instruments, Monitors"
// //                   value={formData.subCategory}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="productName" className="po-form-label">
// //                   <i className="fas fa-tools po-label-icon"></i>
// //                   Equipment Name *
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="productName"
// //                   name="productName"
// //                   className={`po-form-control ${errors.productName ? 'po-is-invalid' : ''}`}
// //                   placeholder="e.g., Surgical Scissors, BP Monitor"
// //                   value={formData.productName}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.productName && (
// //                   <div className="po-invalid-feedback">{errors.productName}</div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           {/* Row 2: Manufacturer Details */}
// //           <div className="po-row po-mb-3">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="manufacturer" className="po-form-label">
// //                   <i className="fas fa-industry po-label-icon"></i>
// //                   Manufacturer
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="manufacturer"
// //                   name="manufacturer"
// //                   className="po-form-control"
// //                   placeholder="e.g., GE Healthcare, Philips"
// //                   value={formData.manufacturer}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="model" className="po-form-label">
// //                   <i className="fas fa-microchip po-label-icon"></i>
// //                   Model
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="model"
// //                   name="model"
// //                   className="po-form-control"
// //                   placeholder="e.g., Model X-2000"
// //                   value={formData.model}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="serialNumber" className="po-form-label">
// //                   <i className="fas fa-barcode po-label-icon"></i>
// //                   Serial Number
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="serialNumber"
// //                   name="serialNumber"
// //                   className="po-form-control"
// //                   placeholder="e.g., SN-123456789"
// //                   value={formData.serialNumber}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="intendedUse" className="po-form-label">
// //                   <i className="fas fa-stethoscope po-label-icon"></i>
// //                   Intended Use
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="intendedUse"
// //                   name="intendedUse"
// //                   className="po-form-control"
// //                   placeholder="e.g., Surgical procedures, Patient monitoring"
// //                   value={formData.intendedUse}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Row 3: Physical Specifications */}
// //           <div className="po-row po-mb-3">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="dimensions" className="po-form-label">
// //                   <i className="fas fa-ruler-combined po-label-icon"></i>
// //                   Dimensions / Size
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="dimensions"
// //                   name="dimensions"
// //                   className="po-form-control"
// //                   placeholder="e.g., 100x50x30 cm"
// //                   value={formData.dimensions}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="weight" className="po-form-label">
// //                   <i className="fas fa-weight po-label-icon"></i>
// //                   Weight
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="weight"
// //                   name="weight"
// //                   className="po-form-control"
// //                   placeholder="e.g., 15 kg"
// //                   value={formData.weight}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="materialComposition" className="po-form-label">
// //                   <i className="fas fa-layer-group po-label-icon"></i>
// //                   Material Composition
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="materialComposition"
// //                   name="materialComposition"
// //                   className="po-form-control"
// //                   placeholder="e.g., Stainless Steel, Plastic"
// //                   value={formData.materialComposition}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="powerRequirement" className="po-form-label">
// //                   <i className="fas fa-plug po-label-icon"></i>
// //                   Power Requirement
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="powerRequirement"
// //                   name="powerRequirement"
// //                   className="po-form-control"
// //                   placeholder="e.g., 220V AC, Battery operated"
// //                   value={formData.powerRequirement}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Row 4: Technical & Regulatory */}
// //           <div className="po-row po-mb-3">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="compatibility" className="po-form-label">
// //                   <i className="fas fa-link po-label-icon"></i>
// //                   Compatibility
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="compatibility"
// //                   name="compatibility"
// //                   className="po-form-control"
// //                   placeholder="e.g., Compatible with standard systems"
// //                   value={formData.compatibility}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="deviceClass" className="po-form-label">
// //                   <i className="fas fa-shield-alt po-label-icon"></i>
// //                   Device Class
// //                 </label>
// //                 <select
// //                   id="deviceClass"
// //                   name="deviceClass"
// //                   className="po-form-control"
// //                   value={formData.deviceClass}
// //                   onChange={handleChange}
// //                 >
// //                   <option value="">Select class</option>
// //                   <option value="Class I">Class I (Low risk)</option>
// //                   <option value="Class II">Class II (Medium risk)</option>
// //                   <option value="Class III">Class III (High risk)</option>
// //                   <option value="Not Applicable">Not Applicable</option>
// //                 </select>
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="regulatoryApprovalNumber" className="po-form-label">
// //                   <i className="fas fa-certificate po-label-icon"></i>
// //                   Regulatory Approval Number
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="regulatoryApprovalNumber"
// //                   name="regulatoryApprovalNumber"
// //                   className="po-form-control"
// //                   placeholder="e.g., FDA 510(k), CE Mark"
// //                   value={formData.regulatoryApprovalNumber}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="countryOfOrigin" className="po-form-label">
// //                   <i className="fas fa-globe po-label-icon"></i>
// //                   Country of Origin
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="countryOfOrigin"
// //                   name="countryOfOrigin"
// //                   className="po-form-control"
// //                   placeholder="e.g., USA, Germany, Japan"
// //                   value={formData.countryOfOrigin}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Row 5: Warranty & Warnings */}
// //           <div className="po-row po-mb-3">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="warrantyApplicable" className="po-form-label">
// //                   <i className="fas fa-calendar-check po-label-icon"></i>
// //                   Warranty Applicable
// //                 </label>
// //                 <select
// //                   id="warrantyApplicable"
// //                   name="warrantyApplicable"
// //                   className="po-form-control"
// //                   value={formData.warrantyApplicable}
// //                   onChange={handleChange}
// //                 >
// //                   <option value="">Select</option>
// //                   <option value="Yes">Yes</option>
// //                   <option value="No">No</option>
// //                 </select>
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="warrantyPeriod" className="po-form-label">
// //                   <i className="fas fa-clock po-label-icon"></i>
// //                   Warranty Period
// //                 </label>
// //                 <select
// //                   id="warrantyPeriod"
// //                   name="warrantyPeriod"
// //                   className="po-form-control"
// //                   value={formData.warrantyPeriod}
// //                   onChange={handleChange}
// //                 >
// //                   <option value="">Select period</option>
// //                   <option value="3 Months">3 Months</option>
// //                   <option value="6 Months">6 Months</option>
// //                   <option value="1 Year">1 Year</option>
// //                   <option value="2 Years">2 Years</option>
// //                   <option value="3 Years">3 Years</option>
// //                   <option value="5 Years">5 Years</option>
// //                   <option value="Lifetime">Lifetime</option>
// //                 </select>
// //               </div>
// //             </div>

// //             <div className="po-col-md-6">
// //               <div className="po-form-group">
// //                 <label htmlFor="warnings" className="po-form-label">
// //                   <i className="fas fa-exclamation-triangle po-label-icon"></i>
// //                   Warnings / Precautions
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="warnings"
// //                   name="warnings"
// //                   className="po-form-control"
// //                   placeholder="e.g., For professional use only, Read manual before use"
// //                   value={formData.warnings}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Row 6: Description & Image */}
// //           <div className="po-row">
// //             <div className="po-col-md-6">
// //               <div className="po-form-group">
// //                 <label htmlFor="productDescription" className="po-form-label">
// //                   <i className="fas fa-file-alt po-label-icon"></i>
// //                   Equipment Description
// //                 </label>
// //                 <textarea
// //                   id="productDescription"
// //                   name="productDescription"
// //                   className="po-form-control"
// //                   placeholder="Enter detailed equipment description, features, usage instructions..."
// //                   rows={3}
// //                   value={formData.productDescription}
// //                   onChange={handleChange}
// //                 />
// //                 <small className="po-form-text po-text-muted">Max 500 characters</small>
// //               </div>
// //             </div>

// //             <div className="po-col-md-6">
// //               <div className="po-form-group">
// //                 <label htmlFor="productImage" className="po-form-label">
// //                   <i className="fas fa-image po-label-icon"></i>
// //                   Equipment Image
// //                 </label>
// //                 <div className="po-image-upload-container">
// //                   <div className="po-image-preview">
// //                     {imagePreview ? (
// //                       <img src={imagePreview} alt="Preview" className="po-preview-image" />
// //                     ) : (
// //                       <div className="po-preview-placeholder">
// //                         <i className="fas fa-image"></i>
// //                         <span>Image preview</span>
// //                       </div>
// //                     )}
// //                   </div>
// //                   <div className="po-upload-controls">
// //                     <input
// //                       type="file"
// //                       id="productImage"
// //                       name="productImage"
// //                       className="po-file-input"
// //                       accept=".jpg,.jpeg,.png,.webp"
// //                       onChange={handleChange}
// //                       style={{ display: 'none' }}
// //                     />
// //                     <label htmlFor="productImage" className="po-upload-btn">
// //                       Choose Image
// //                     </label>
// //                     <small className="po-form-text po-d-block po-mt-2">JPG, PNG or WebP. Max 5MB</small>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Packaging & Order Details Card */}
// //       <div className="po-form-card po-card-secondary po-mt-4">
// //         <div className="po-card-header">
// //           <div className="po-card-icon">
// //             <i className="fas fa-box"></i>
// //           </div>
// //           <h2>Packaging & Order Details</h2>
// //         </div>

// //         <div className="po-card-body">
// //           <div className="po-row">
// //             <div className="po-col-md-4">
// //               <div className="po-form-group">
// //                 <label htmlFor="packagingUnit" className="po-form-label">
// //                   <i className="fas fa-box-open po-label-icon"></i>
// //                   Packaging Unit *
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="packagingUnit"
// //                   name="packagingUnit"
// //                   className={`po-form-control ${errors.packagingUnit ? 'po-is-invalid' : ''}`}
// //                   placeholder="e.g., Box, Case, Kit"
// //                   value={formData.packagingUnit}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.packagingUnit && (
// //                   <div className="po-invalid-feedback">{errors.packagingUnit}</div>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="po-col-md-4">
// //               <div className="po-form-group">
// //                 <label htmlFor="moq" className="po-form-label">
// //                   <i className="fas fa-sort-amount-down po-label-icon"></i>
// //                   Minimum Order Quantity (MOQ) *
// //                 </label>
// //                 <input
// //                   type="number"
// //                   id="moq"
// //                   name="moq"
// //                   className={`po-form-control ${errors.moq ? 'po-is-invalid' : ''}`}
// //                   placeholder="e.g., 1 unit"
// //                   min="1"
// //                   value={formData.moq}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.moq && (
// //                   <div className="po-invalid-feedback">{errors.moq}</div>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="po-col-md-4">
// //               <div className="po-form-group">
// //                 <label htmlFor="maxOrderQuantity" className="po-form-label">
// //                   <i className="fas fa-sort-amount-up po-label-icon"></i>
// //                   Maximum Order Quantity *
// //                 </label>
// //                 <input
// //                   type="number"
// //                   id="maxOrderQuantity"
// //                   name="maxOrderQuantity"
// //                   className={`po-form-control ${errors.maxOrderQuantity ? 'po-is-invalid' : ''}`}
// //                   placeholder="e.g., 1000"
// //                   min="1"
// //                   value={formData.maxOrderQuantity}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.maxOrderQuantity && (
// //                   <div className="po-invalid-feedback">{errors.maxOrderQuantity}</div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Manufacturing, Stock, Pricing & Tax Details Card */}
// //       <div className="po-form-card po-card-accent po-mt-4">
// //         <div className="po-card-header">
// //           <div className="po-card-icon">
// //             <i className="fas fa-chart-line"></i>
// //           </div>
// //           <h2>Manufacturing, Stock, Pricing & Tax Details</h2>
// //         </div>

// //         <div className="po-card-body">
// //           {/* Row 1: Manufacturing & Storage */}
// //           <div className="po-row po-mb-4">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="manufacturingDate" className="po-form-label">
// //                   <i className="fas fa-calendar-plus po-label-icon"></i>
// //                   Manufacturing Date *
// //                 </label>
// //                 <input
// //                   type="date"
// //                   id="manufacturingDate"
// //                   name="manufacturingDate"
// //                   className={`po-form-control ${errors.manufacturingDate ? 'po-is-invalid' : ''}`}
// //                   value={formData.manufacturingDate}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.manufacturingDate && (
// //                   <div className="po-invalid-feedback">{errors.manufacturingDate}</div>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="expiryDate" className="po-form-label">
// //                   <i className="fas fa-calendar-times po-label-icon"></i>
// //                   Expiry Date *
// //                 </label>
// //                 <input
// //                   type="date"
// //                   id="expiryDate"
// //                   name="expiryDate"
// //                   className={`po-form-control ${errors.expiryDate ? 'po-is-invalid' : ''}`}
// //                   value={formData.expiryDate}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.expiryDate && (
// //                   <div className="po-invalid-feedback">{errors.expiryDate}</div>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="storageCondition" className="po-form-label">
// //                   <i className="fas fa-temperature-low po-label-icon"></i>
// //                   Storage Condition
// //                 </label>
// //                 <select
// //                   id="storageCondition"
// //                   name="storageCondition"
// //                   className="po-form-control"
// //                   value={formData.storageCondition}
// //                   onChange={handleChange}
// //                 >
// //                   <option value="">Select condition</option>
// //                   <option value="Room Temperature">Room Temperature</option>
// //                   <option value="Dry Place">Dry Place</option>
// //                   <option value="Avoid Moisture">Avoid Moisture</option>
// //                   <option value="No Special Requirements">No Special Requirements</option>
// //                 </select>
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="stockQuantity" className="po-form-label">
// //                   <i className="fas fa-boxes po-label-icon"></i>
// //                   Stock Quantity *
// //                 </label>
// //                 <input
// //                   type="number"
// //                   id="stockQuantity"
// //                   name="stockQuantity"
// //                   className={`po-form-control ${errors.stockQuantity ? 'po-is-invalid' : ''}`}
// //                   placeholder="e.g., 50"
// //                   min="0"
// //                   value={formData.stockQuantity}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.stockQuantity && (
// //                   <div className="po-invalid-feedback">{errors.stockQuantity}</div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           {/* Row 2: Pricing & Discount */}
// //           <div className="po-row po-mb-4">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="dateOfEntry" className="po-form-label">
// //                   <i className="fas fa-calendar-day po-label-icon"></i>
// //                   Date of Entry
// //                 </label>
// //                 <input
// //                   type="date"
// //                   id="dateOfEntry"
// //                   name="dateOfEntry"
// //                   className="po-form-control"
// //                   value={formData.dateOfEntry}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="pricePerUnit" className="po-form-label">
// //                   <i className="fas fa-rupee-sign po-label-icon"></i>
// //                   Price per Unit *
// //                 </label>
// //                 <div className="po-input-group">
// //                   <div className="po-input-group-prepend">
// //                     <span className="po-input-group-text">₹</span>
// //                   </div>
// //                   <input
// //                     type="number"
// //                     id="pricePerUnit"
// //                     name="pricePerUnit"
// //                     className={`po-form-control ${errors.pricePerUnit ? 'po-is-invalid' : ''}`}
// //                     placeholder="0.00"
// //                     step="0.01"
// //                     min="0"
// //                     value={formData.pricePerUnit}
// //                     onChange={handleChange}
// //                   />
// //                 </div>
// //                 {errors.pricePerUnit && (
// //                   <div className="po-invalid-feedback">{errors.pricePerUnit}</div>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="discountPercentage" className="po-form-label">
// //                   <i className="fas fa-percentage po-label-icon"></i>
// //                   Discount Percentage
// //                 </label>
// //                 <div className="po-input-group">
// //                   <input
// //                     type="number"
// //                     id="discountPercentage"
// //                     name="discountPercentage"
// //                     className="po-form-control"
// //                     placeholder="0.00"
// //                     step="0.01"
// //                     min="0"
// //                     max="100"
// //                     value={formData.discountPercentage}
// //                     onChange={handleChange}
// //                   />
// //                   <div className="po-input-group-append">
// //                     <span className="po-input-group-text">%</span>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>

// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="gstPercentage" className="po-form-label">
// //                   <i className="fas fa-receipt po-label-icon"></i>
// //                   GST % *
// //                 </label>
// //                 <div className="po-input-group">
// //                   <input
// //                     type="number"
// //                     id="gstPercentage"
// //                     name="gstPercentage"
// //                     className={`po-form-control ${errors.gstPercentage ? 'po-is-invalid' : ''}`}
// //                     placeholder="e.g., 18"
// //                     step="0.01"
// //                     min="0"
// //                     value={formData.gstPercentage}
// //                     onChange={handleChange}
// //                   />
// //                   <div className="po-input-group-append">
// //                     <span className="po-input-group-text">%</span>
// //                   </div>
// //                 </div>
// //                 {errors.gstPercentage && (
// //                   <div className="po-invalid-feedback">{errors.gstPercentage}</div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           {/* Row 3: HSN Code */}
// //           <div className="po-row">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="hsnCode" className="po-form-label">
// //                   <i className="fas fa-code po-label-icon"></i>
// //                   HSN Code
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="hsnCode"
// //                   name="hsnCode"
// //                   className="po-form-control"
// //                   placeholder="e.g., 9018"
// //                   value={formData.hsnCode}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Action Buttons */}
// //       <div className="po-form-actions">
// //         <div className="po-form-note">
// //           <i className="fas fa-info-circle"></i>
// //           <span>Fields marked with * are required</span>
// //           <span className="po-product-type-display">
// //             | Product Type: <strong>Non-Consumables (Medical Equipment)</strong>
// //           </span>
// //         </div>
// //         <div className="po-button-group">
// //           <button type="button" className="po-btn po-btn-secondary po-btn-lg" onClick={handleReset}>
// //             <i className="fas fa-redo"></i> Reset Form
// //           </button>
// //           <button type="submit" className="po-btn po-btn-primary po-btn-lg po-submit-btn">
// //             <i className="fas fa-check-circle"></i> Register Equipment
// //           </button>
// //         </div>
// //       </div>
// //     </form>
// //   );
// // }

// // export default NonConsumableProductForm;