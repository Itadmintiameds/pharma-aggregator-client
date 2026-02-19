// "use client";

// import React, { useState, ChangeEvent, FormEvent } from 'react';
// import { BaseFormData, FormErrors } from './ProductOnboarding';

// interface ConsumableFormData extends BaseFormData {
//   // Consumable specific fields
//   molecule: string;
//   dosageForm: string;
//   strength: string;
//   batchNumber: string;
//   manufacturingDate: string;
//   expiryDate: string;
//   storageCondition: string;
// }

// function ConsumableProductForm() {
//   const [formData, setFormData] = useState<ConsumableFormData>({
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
    
//     // Consumable specific
//     molecule: '',
//     dosageForm: '',
//     strength: '',
//     batchNumber: '',
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
//       setFormData(prev => ({
//         ...prev,
//         [name]: file
//       }));
      
//       // Create image preview
//       if (file) {
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           setImagePreview(reader.result as string);
//         };
//         reader.readAsDataURL(file);
//       } else {
//         setImagePreview(null);
//       }
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: value
//       }));
//     }
    
//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors(prev => ({
//         ...prev,
//         [name]: ''
//       }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors: FormErrors = {};
    
//     // Required fields
//     const requiredFields: (keyof ConsumableFormData)[] = [
//       'productCategory', 'productName', 'packagingUnit',
//       'moq', 'stockQuantity', 'pricePerUnit', 'gstPercentage',
//       'batchNumber', 'manufacturingDate', 'expiryDate'
//     ];
    
//     requiredFields.forEach(field => {
//       if (!formData[field]) {
//         newErrors[field] = 'This field is required';
//       }
//     });
    
//     // Date validation
//     if (formData.manufacturingDate && formData.expiryDate) {
//       const manufacturing = new Date(formData.manufacturingDate);
//       const expiry = new Date(formData.expiryDate);
//       if (expiry <= manufacturing) {
//         newErrors.expiryDate = 'Expiry date must be after manufacturing date';
//       }
//     }
    
//     // Quantity validation
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
//       console.log('Consumable form submitted:', formData);
//       alert('Consumable product registered successfully!');
//       // API call here
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
//       molecule: '',
//       dosageForm: '',
//       strength: '',
//       batchNumber: '',
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
//             <i className="fas fa-capsules"></i>
//           </div>
//           <h2>Drug Details</h2>
//           {/* <span className="po-card-badge">Required</span> */}
//           <span className="po-product-type-tag">
//             <i className="fas fa-pills"></i>
//             Consumable
//           </span>
//         </div>
        
//         <div className="po-card-body">
//           <div className="po-row po-mb-3">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="productCategory" className="po-form-label">
//                   <i className="fas fa-tag po-label-icon"></i>
//                   Drug Category *
//                 </label>
//                 <input
//                   type="text"
//                   id="productCategory"
//                   name="productCategory"
//                   className={`po-form-control ${errors.productCategory ? 'po-is-invalid' : ''}`}
//                   placeholder="e.g., Prescription Drugs, OTC"
//                   value={formData.productCategory}
//                   onChange={handleChange}
//                 />
//                 {errors.productCategory && (
//                   <div className="po-invalid-feedback">{errors.productCategory}</div>
//                 )}
//               </div>
//             </div>
            
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="therapeuticCategory" className="po-form-label">
//                   <i className="fas fa-heartbeat po-label-icon"></i>
//                   Therapeutic Category
//                 </label>
//                 <input
//                   type="text"
//                   id="therapeuticCategory"
//                   name="therapeuticCategory"
//                   className="po-form-control"
//                   placeholder="e.g., Antibiotics, Analgesics"
//                   value={formData.therapeuticCategory}
//                   onChange={handleChange}
//                 />
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
//                   placeholder="e.g., Oral Tablets, Injectable"
//                   value={formData.subCategory}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
            
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="productName" className="po-form-label">
//                   <i className="fas fa-capsules po-label-icon"></i>
//                   Drug Name *
//                 </label>
//                 <input
//                   type="text"
//                   id="productName"
//                   name="productName"
//                   className={`po-form-control ${errors.productName ? 'po-is-invalid' : ''}`}
//                   placeholder="e.g., Amoxicillin 500mg"
//                   value={formData.productName}
//                   onChange={handleChange}
//                 />
//                 {errors.productName && (
//                   <div className="po-invalid-feedback">{errors.productName}</div>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="po-row po-mb-3">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="molecule" className="po-form-label">
//                   <i className="fas fa-atom po-label-icon"></i>
//                   Molecule / API
//                 </label>
//                 <input
//                   type="text"
//                   id="molecule"
//                   name="molecule"
//                   className="po-form-control"
//                   placeholder="e.g., Amoxicillin Trihydrate"
//                   value={formData.molecule}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
            
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="dosageForm" className="po-form-label">
//                   <i className="fas fa-prescription-bottle-alt po-label-icon"></i>
//                   Dosage Form
//                 </label>
//                 <input
//                   type="text"
//                   id="dosageForm"
//                   name="dosageForm"
//                   className="po-form-control"
//                   placeholder="e.g., Tablet, Capsule"
//                   value={formData.dosageForm}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
            
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="strength" className="po-form-label">
//                   <i className="fas fa-weight po-label-icon"></i>
//                   Strength
//                 </label>
//                 <input
//                   type="text"
//                   id="strength"
//                   name="strength"
//                   className="po-form-control"
//                   placeholder="e.g., 500mg"
//                   value={formData.strength}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
            
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="warnings" className="po-form-label">
//                   <i className="fas fa-exclamation-triangle po-label-icon"></i>
//                   Warnings / Side Effects
//                 </label>
//                 <input
//                   type="text"
//                   id="warnings"
//                   name="warnings"
//                   className="po-form-control"
//                   placeholder="e.g., Take with food, Drowsiness may occur"
//                   value={formData.warnings}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="po-row">
//             <div className="po-col-md-6">
//               <div className="po-form-group">
//                 <label htmlFor="productDescription" className="po-form-label">
//                   <i className="fas fa-file-alt po-label-icon"></i>
//                   Drug Description
//                 </label>
//                 <textarea
//                   id="productDescription"
//                   name="productDescription"
//                   className="po-form-control"
//                   placeholder="Enter detailed drug description, indications, usage..."
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
//                   Drug Image
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
//       <div className="po-form-card po-card-secondary">
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
//                   placeholder="e.g., Bottle, Strip, Vial"
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
//                   placeholder="e.g., 10 units"
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

//       {/* Batch, Stock, Pricing & Tax Details Card */}
//       <div className="po-form-card po-card-accent">
//         <div className="po-card-header">
//           <div className="po-card-icon">
//             <i className="fas fa-chart-line"></i>
//           </div>
//           <h2>Batch, Stock, Pricing & Tax Details</h2>
//         </div>
        
//         <div className="po-card-body">
//           <div className="po-row po-mb-4">
//             <div className="po-col-md-3">
//               <div className="po-form-group">
//                 <label htmlFor="batchNumber" className="po-form-label">
//                   <i className="fas fa-barcode po-label-icon"></i>
//                   Batch Number *
//                 </label>
//                 <input
//                   type="text"
//                   id="batchNumber"
//                   name="batchNumber"
//                   className={`po-form-control ${errors.batchNumber ? 'po-is-invalid' : ''}`}
//                   placeholder="e.g., BATCH2024-001"
//                   value={formData.batchNumber}
//                   onChange={handleChange}
//                 />
//                 {errors.batchNumber && (
//                   <div className="po-invalid-feedback">{errors.batchNumber}</div>
//                 )}
//               </div>
//             </div>
            
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
//                   <option value="Refrigerated (2-8°C)">Refrigerated (2-8°C)</option>
//                   <option value="Cool & Dry Place">Cool & Dry Place</option>
//                   <option value="Protect from Light">Protect from Light</option>
//                   <option value="Dry Place">Dry Place</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="po-row po-mb-4">
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
//                   placeholder="e.g., 500"
//                   min="0"
//                   value={formData.stockQuantity}
//                   onChange={handleChange}
//                 />
//                 {errors.stockQuantity && (
//                   <div className="po-invalid-feedback">{errors.stockQuantity}</div>
//                 )}
//               </div>
//             </div>
            
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
//           </div>

//           <div className="po-row">
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
//                     placeholder="e.g., 12"
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
//                   placeholder="e.g., 3004"
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
//             | Product Type: <strong>Consumables (Pharmaceuticals)</strong>
//           </span>
//         </div>
//         <div className="po-button-group">
//           <button type="button" className="po-btn po-btn-secondary po-btn-lg" onClick={handleReset}>
//             <i className="fas fa-redo"></i> Reset Form
//           </button>
//           <button type="submit" className="po-btn po-btn-primary po-btn-lg po-submit-btn">
//             <i className="fas fa-check-circle"></i> Add Product
//           </button>
//         </div>
//       </div>
//     </form>
//   );
// }

// export default ConsumableProductForm;















// // "use client";

// // import React, { useState, ChangeEvent, FormEvent } from 'react';
// // import { BaseFormData, FormErrors } from './ProductOnboarding';

// // interface ConsumableFormData extends BaseFormData {
// //   // Consumable specific fields
// //   molecule: string;
// //   dosageForm: string;
// //   strength: string;
// //   batchNumber: string;
// //   manufacturingDate: string;
// //   expiryDate: string;
// //   storageCondition: string;
// // }

// // function ConsumableProductForm() {
// //   const [formData, setFormData] = useState<ConsumableFormData>({
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
    
// //     // Consumable specific
// //     molecule: '',
// //     dosageForm: '',
// //     strength: '',
// //     batchNumber: '',
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
// //       setFormData(prev => ({
// //         ...prev,
// //         [name]: file
// //       }));
      
// //       // Create image preview
// //       if (file) {
// //         const reader = new FileReader();
// //         reader.onloadend = () => {
// //           setImagePreview(reader.result as string);
// //         };
// //         reader.readAsDataURL(file);
// //       } else {
// //         setImagePreview(null);
// //       }
// //     } else {
// //       setFormData(prev => ({
// //         ...prev,
// //         [name]: value
// //       }));
// //     }
    
// //     // Clear error when user starts typing
// //     if (errors[name]) {
// //       setErrors(prev => ({
// //         ...prev,
// //         [name]: ''
// //       }));
// //     }
// //   };

// //   const validateForm = () => {
// //     const newErrors: FormErrors = {};
    
// //     // Required fields
// //     const requiredFields: (keyof ConsumableFormData)[] = [
// //       'productCategory', 'productName', 'packagingUnit',
// //       'moq', 'stockQuantity', 'pricePerUnit', 'gstPercentage',
// //       'batchNumber', 'manufacturingDate', 'expiryDate'
// //     ];
    
// //     requiredFields.forEach(field => {
// //       if (!formData[field]) {
// //         newErrors[field] = 'This field is required';
// //       }
// //     });
    
// //     // Date validation
// //     if (formData.manufacturingDate && formData.expiryDate) {
// //       const manufacturing = new Date(formData.manufacturingDate);
// //       const expiry = new Date(formData.expiryDate);
// //       if (expiry <= manufacturing) {
// //         newErrors.expiryDate = 'Expiry date must be after manufacturing date';
// //       }
// //     }
    
// //     // Quantity validation
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
// //       console.log('Consumable form submitted:', formData);
// //       alert('Consumable product registered successfully!');
// //       // API call here
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
// //       molecule: '',
// //       dosageForm: '',
// //       strength: '',
// //       batchNumber: '',
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
// //             <i className="fas fa-capsules"></i>
// //           </div>
// //           <h2>Drug Details</h2>
// //           {/* <span className="po-card-badge">Required</span> */}
// //           <span className="po-product-type-tag">
// //             <i className="fas fa-pills"></i>
// //             Consumable
// //           </span>
// //         </div>
        
// //         <div className="po-card-body">
// //           <div className="po-row po-mb-3">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="productCategory" className="po-form-label">
// //                   <i className="fas fa-tag po-label-icon"></i>
// //                   Drug Category *
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="productCategory"
// //                   name="productCategory"
// //                   className={`po-form-control ${errors.productCategory ? 'po-is-invalid' : ''}`}
// //                   placeholder="e.g., Prescription Drugs, OTC"
// //                   value={formData.productCategory}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.productCategory && (
// //                   <div className="po-invalid-feedback">{errors.productCategory}</div>
// //                 )}
// //               </div>
// //             </div>
            
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="therapeuticCategory" className="po-form-label">
// //                   <i className="fas fa-heartbeat po-label-icon"></i>
// //                   Therapeutic Category
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="therapeuticCategory"
// //                   name="therapeuticCategory"
// //                   className="po-form-control"
// //                   placeholder="e.g., Antibiotics, Analgesics"
// //                   value={formData.therapeuticCategory}
// //                   onChange={handleChange}
// //                 />
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
// //                   placeholder="e.g., Oral Tablets, Injectable"
// //                   value={formData.subCategory}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
            
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="productName" className="po-form-label">
// //                   <i className="fas fa-capsules po-label-icon"></i>
// //                   Drug Name *
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="productName"
// //                   name="productName"
// //                   className={`po-form-control ${errors.productName ? 'po-is-invalid' : ''}`}
// //                   placeholder="e.g., Amoxicillin 500mg"
// //                   value={formData.productName}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.productName && (
// //                   <div className="po-invalid-feedback">{errors.productName}</div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           <div className="po-row po-mb-3">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="molecule" className="po-form-label">
// //                   <i className="fas fa-atom po-label-icon"></i>
// //                   Molecule / API
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="molecule"
// //                   name="molecule"
// //                   className="po-form-control"
// //                   placeholder="e.g., Amoxicillin Trihydrate"
// //                   value={formData.molecule}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
            
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="dosageForm" className="po-form-label">
// //                   <i className="fas fa-prescription-bottle-alt po-label-icon"></i>
// //                   Dosage Form
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="dosageForm"
// //                   name="dosageForm"
// //                   className="po-form-control"
// //                   placeholder="e.g., Tablet, Capsule"
// //                   value={formData.dosageForm}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
            
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="strength" className="po-form-label">
// //                   <i className="fas fa-weight po-label-icon"></i>
// //                   Strength
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="strength"
// //                   name="strength"
// //                   className="po-form-control"
// //                   placeholder="e.g., 500mg"
// //                   value={formData.strength}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
            
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="warnings" className="po-form-label">
// //                   <i className="fas fa-exclamation-triangle po-label-icon"></i>
// //                   Warnings / Side Effects
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="warnings"
// //                   name="warnings"
// //                   className="po-form-control"
// //                   placeholder="e.g., Take with food, Drowsiness may occur"
// //                   value={formData.warnings}
// //                   onChange={handleChange}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           <div className="po-row">
// //             <div className="po-col-md-6">
// //               <div className="po-form-group">
// //                 <label htmlFor="productDescription" className="po-form-label">
// //                   <i className="fas fa-file-alt po-label-icon"></i>
// //                   Drug Description
// //                 </label>
// //                 <textarea
// //                   id="productDescription"
// //                   name="productDescription"
// //                   className="po-form-control"
// //                   placeholder="Enter detailed drug description, indications, usage..."
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
// //                   Drug Image
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
// //       <div className="po-form-card po-card-secondary">
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
// //                   placeholder="e.g., Bottle, Strip, Vial"
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
// //                   placeholder="e.g., 10 units"
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

// //       {/* Batch, Stock, Pricing & Tax Details Card */}
// //       <div className="po-form-card po-card-accent">
// //         <div className="po-card-header">
// //           <div className="po-card-icon">
// //             <i className="fas fa-chart-line"></i>
// //           </div>
// //           <h2>Batch, Stock, Pricing & Tax Details</h2>
// //         </div>
        
// //         <div className="po-card-body">
// //           <div className="po-row po-mb-4">
// //             <div className="po-col-md-3">
// //               <div className="po-form-group">
// //                 <label htmlFor="batchNumber" className="po-form-label">
// //                   <i className="fas fa-barcode po-label-icon"></i>
// //                   Batch Number *
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="batchNumber"
// //                   name="batchNumber"
// //                   className={`po-form-control ${errors.batchNumber ? 'po-is-invalid' : ''}`}
// //                   placeholder="e.g., BATCH2024-001"
// //                   value={formData.batchNumber}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.batchNumber && (
// //                   <div className="po-invalid-feedback">{errors.batchNumber}</div>
// //                 )}
// //               </div>
// //             </div>
            
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
// //                   <option value="Refrigerated (2-8°C)">Refrigerated (2-8°C)</option>
// //                   <option value="Cool & Dry Place">Cool & Dry Place</option>
// //                   <option value="Protect from Light">Protect from Light</option>
// //                   <option value="Dry Place">Dry Place</option>
// //                 </select>
// //               </div>
// //             </div>
// //           </div>

// //           <div className="po-row po-mb-4">
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
// //                   placeholder="e.g., 500"
// //                   min="0"
// //                   value={formData.stockQuantity}
// //                   onChange={handleChange}
// //                 />
// //                 {errors.stockQuantity && (
// //                   <div className="po-invalid-feedback">{errors.stockQuantity}</div>
// //                 )}
// //               </div>
// //             </div>
            
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
// //           </div>

// //           <div className="po-row">
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
// //                     placeholder="e.g., 12"
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
// //                   placeholder="e.g., 3004"
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
// //             | Product Type: <strong>Consumables (Pharmaceuticals)</strong>
// //           </span>
// //         </div>
// //         <div className="po-button-group">
// //           <button type="button" className="po-btn po-btn-secondary po-btn-lg" onClick={handleReset}>
// //             <i className="fas fa-redo"></i> Reset Form
// //           </button>
// //           <button type="submit" className="po-btn po-btn-primary po-btn-lg po-submit-btn">
// //             <i className="fas fa-check-circle"></i> Add Product
// //           </button>
// //         </div>
// //       </div>
// //     </form>
// //   );
// // }

// // export default ConsumableProductForm;
