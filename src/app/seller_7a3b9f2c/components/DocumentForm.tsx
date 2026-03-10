"use client";

import React from "react";
import { Building2, FileText } from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ProductTypeResponse } from "@/src/types/seller/SellerRegMasterData";
import { toast } from "react-toastify";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  formData: any;
  productTypes: ProductTypeResponse[];
  onGSTChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string, productName?: string) => void;
  onIssueDateChange: (date: Date | null, productName: string) => void;
  onExpiryDateChange: (date: Date | null, productName: string) => void;
  onLicenseNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIssuingAuthorityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prevStep: () => void;
  nextStep: () => void;
}

export default function DocumentForm({
  formData,
  productTypes,
  onGSTChange,
  onFileChange,
  onIssueDateChange,
  onExpiryDateChange,
  onLicenseNumberChange,
  onIssuingAuthorityChange,
  prevStep,
  nextStep,
}: Props) {

  const router = useRouter();

  const getLicenseInfo = (productName: string) => {
    const product = productTypes.find((p) => p.productTypeName === productName);
    const label = product?.regulatoryCategory
      ? `${product.regulatoryCategory} License`
      : `${productName} License`;

    return {
      label,
      placeholder: `Enter ${productName} license number`,
      numberLabel: `${productName} License Number`,
      fileLabel: `${productName} License Copy Upload`,
      issueDateLabel: `${productName} License Issue Date`,
      expiryDateLabel: `${productName} License Expiry Date`,
      authorityLabel: `${productName} License Issuing Authority`,
      statusLabel: `${productName} License Status`,
    };
  };

  const validateGSTFormat = (gstNumber: string) => {
    if (gstNumber.length === 15) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
      if (!gstRegex.test(gstNumber)) {
        toast.warning("GST number format appears incorrect");
      }
    }
  };

  const handleGSTChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^0-9A-Z]/g, '');
    if (value.length > 15) value = value.slice(0, 15);

    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: 'gstNumber', value }
    } as React.ChangeEvent<HTMLInputElement>;

    onGSTChange(syntheticEvent);

    if (value.length === 15) validateGSTFormat(value);
  };

  // Show warning if no products selected
  if (formData.productTypes.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-h3 font-semibold">Statutory Documents</div>
          <div className="text-neutral-600 text-sm"> 
            License and GST compliance upload
          </div>
        </div>
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center">
            <span className="text-yellow-800 text-xl mr-3">⚠️</span>
            <div>
              <p className="text-yellow-800 font-medium">
                No product types selected
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Please go back to Step 1 and select at least one product type.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-10">
          <button onClick={prevStep} className="border border-neutral-400 px-6 py-2 rounded-lg">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* HEADER */}
      <div>
        <div className="text-2xl font-semibold">Statutory Documents</div>
        <div className="text-neutral-600 text-sm">
          License and GST compliance upload
        </div>
      </div>

      {/* LICENSE SECTIONS */}
      {formData.productTypes.map((productName: string) => {

        const licenseInfo = getLicenseInfo(productName);

        const licenseData = formData.licenses[productName] || {
          number: "",
          file: null,
          issueDate: null,
          expiryDate: null,
          issuingAuthority: "",
          status: "Expired"
        };

        return (
          <div key={productName} className="mb-2">
            {/* Product Section Header */}
            {/* <div className="bg-purple-50 rounded-xl p-3 mb-4">
              <h3 className="text-lg font-semibold text-[#4B0082] flex items-center">
                <Shield className="mr-2 w-5 h-5" />
                {licenseInfo.label}
                <span className="ml-2 text-sm font-normal text-neutral-600">
                  (Required for: {productName})
                </span>
              </h3>
            </div> */}

            <div className="grid grid-cols-2 gap-6">
              {/* LICENSE NUMBER */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-neutral-700">
                  {licenseInfo.numberLabel}
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                  <input
                    type="text"
                    name={`licenseNumber-${productName}`}
                    value={licenseData.number}
                    onChange={onLicenseNumberChange}
                    placeholder={licenseInfo.placeholder}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-[#4B0082]"
                  />
                </div>
              </div>

              {/* LICENSE FILE */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-neutral-700">
                  {licenseInfo.fileLabel}
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-12 bg-neutral-50">
                  <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
                    <Image
        src="/icons/upload.png"
        alt="Upload"
        width={20}
        height={20}
      />
                  </div>

                  <input
                    type="file"
                    name={`licenseFile-${productName}`}
                    onChange={(e) => onFileChange(e, 'license', productName)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="flex-1 px-3 text-sm cursor-pointer"
                  />
                </div>
              </div>

              {/* ISSUE DATE */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-neutral-700">
                  {licenseInfo.issueDateLabel}
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <DatePicker
                  value={licenseData.issueDate}
                  onChange={(date) => onIssueDateChange(date, productName)}
                  maxDate={new Date()}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      placeholder: "DD/MM/YYYY",
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          height: '48px',
                          borderRadius: '12px',
                          backgroundColor: '#F5F5F5',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4B0082',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4B0082',
                          },
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* EXPIRY DATE */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-neutral-700">
                  {licenseInfo.expiryDateLabel}
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <DatePicker
                  value={licenseData.expiryDate}
                  onChange={(date) => onExpiryDateChange(date, productName)}
                  minDate={licenseData.issueDate || undefined}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      placeholder: "DD/MM/YYYY",
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          height: '48px',
                          borderRadius: '12px',
                          backgroundColor: '#F5F5F5',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4B0082',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4B0082',
                          },
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* ISSUING AUTHORITY */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-neutral-700">
                  {licenseInfo.authorityLabel}
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

                  <input
                    type="text"
                    name={`issuingAuthority-${productName}`}
                    value={licenseData.issuingAuthority}
                    onChange={onIssuingAuthorityChange}
                    placeholder="Enter issuing authority"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-[#4B0082]"
                  />
                </div>
              </div>

              {/* LICENSE STATUS */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-neutral-700">
                  {licenseInfo.statusLabel}
                </label>

                <div className="h-12 px-4 rounded-xl bg-neutral-200 flex items-center justify-between">
                  <span className="text-neutral-700 font-medium">
                    {!licenseData.issueDate || !licenseData.expiryDate
                      ? "Pending"
                      : licenseData.status}
                  </span>

                  <div
                    className={`w-10 h-6 rounded-full flex items-center px-1 transition
                    ${licenseData.status === "Active"
                        ? "bg-purple-300"
                        : "bg-neutral-400"
                      }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transform transition
                      ${licenseData.status === "Active"
                          ? "translate-x-4"
                          : "translate-x-0"
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* GST SECTION */}
      <div className="grid grid-cols-2 gap-6 mt-4">

        <div className="flex flex-col gap-1">
          <label className="font-medium text-neutral-700">
            GSTIN Number
            <span className="text-red-500 ml-1">*</span>
          </label>

          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleGSTChangeWithValidation}
              placeholder="Enter GST number"
              maxLength={15}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-[#4B0082] uppercase"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-medium text-neutral-700">
            GST Certificate
            <span className="text-red-500 ml-1">*</span>
          </label>

          <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-12 bg-neutral-50">
            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
              <Image
        src="/icons/upload.png"
        alt="Upload"
        width={20}
        height={20}
      />
            </div>

            <input
              type="file"
              name="gstFile"
              onChange={(e) => onFileChange(e, 'gstFile')}
              accept=".pdf,.jpg,.jpeg,.png"
              className="flex-1 px-3 text-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex justify-between mt-10">

        <div className="flex gap-4">
          <button 
          onClick={() => router.push("/")}
          className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold">
            Cancel
          </button>

          <button className="flex h-12 px-6 py-3 justify-center items-center gap-2 rounded-md bg-[#9F75FC] text-white font-semibold hover:bg-[#B08DFC] transition">
  <Image
    src="/icons/savedrafticon.png"
    alt="Save Draft"
    width={18}
    height={18}
  />
  Save Draft
</button>
        </div>

        <div className="flex gap-4">

          <button
  onClick={prevStep}
  className="flex h-12  px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold hover:neutral-500 hover:text-neutral-500 transition"
>
  <Image
    src="/icons/backbuttonicon.png"
    alt="Back"
    width={18}
    height={18}
  />
  Back
</button>

          <button
  onClick={nextStep}
  className="flex h-12  px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold hover:border-primary-100 transition"
>
  Continue
  <Image
    src="/icons/continueicon.png"
    alt="Continue"
    width={18}
    height={18}
  />
</button>

        </div>
      </div>

    </div>
  );
}

















// "use client";

// import React from "react";
// import { FileUp, Calendar, Building2, FileText, Shield } from "lucide-react";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { ProductTypeResponse } from "@/src/types/seller/SellerRegMasterData";
// import { toast } from "react-toastify";

// interface Props {
//   formData: any;
//   productTypes: ProductTypeResponse[];
//   onGSTChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string, productName?: string) => void;
//   onIssueDateChange: (date: Date | null, productName: string) => void;
//   onExpiryDateChange: (date: Date | null, productName: string) => void;
//   onLicenseNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onIssuingAuthorityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   prevStep: () => void;
//   nextStep: () => void;
// }

// export default function DocumentForm({
//   formData,
//   productTypes,
//   onGSTChange,
//   onFileChange,
//   onIssueDateChange,
//   onExpiryDateChange,
//   onLicenseNumberChange,
//   onIssuingAuthorityChange,
//   prevStep,
//   nextStep,
// }: Props) {

//   const getLicenseInfo = (productName: string) => {
//     const product = productTypes.find((p) => p.productTypeName === productName);
//     const label = product?.regulatoryCategory
//       ? `${product.regulatoryCategory} License`
//       : `${productName} License`;
//     return {
//       label,
//       placeholder: `Enter ${productName} license number`,
//     };
//   };

//   // GST validation function (exactly like old version)
//   const validateGSTFormat = (gstNumber: string) => {
//     if (gstNumber.length === 15) {
//       const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
//       if (!gstRegex.test(gstNumber)) {
//         toast.warning("GST number format appears incorrect");
//       }
//     }
//   };

//   // Enhanced GST change handler with validation
//   const handleGSTChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.toUpperCase();
    
//     // Remove any invalid characters (only allow alphanumeric)
//     value = value.replace(/[^0-9A-Z]/g, '');
    
//     // Limit to 15 characters
//     if (value.length > 15) {
//       value = value.slice(0, 15);
//     }
    
//     // Create a synthetic event to pass to the parent handler
//     const syntheticEvent = {
//       ...e,
//       target: {
//         ...e.target,
//         name: 'gstNumber',
//         value: value
//       }
//     } as React.ChangeEvent<HTMLInputElement>;
    
//     // Call the parent handler
//     onGSTChange(syntheticEvent);
    
//     // Validate format when length is 15 (shows toast warning if invalid)
//     if (value.length === 15) {
//       validateGSTFormat(value);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">Statutory Documents</div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           License and GST compliance upload
//         </div>
//       </div>

//       {/* GST Certificate Section */}
//       <div className="mb-6">
//         <div className="bg-purple-50 rounded-xl p-3 mb-4">
//           <h3 className="text-lg font-semibold text-[#4B0082] flex items-center">
//             <FileText className="mr-2 w-5 h-5" />
//             GSTIN Certificate
//           </h3>
//         </div>

//         <div className="grid grid-cols-2 gap-x-6 gap-y-4">
//           {/* GST Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               GST Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="gstNumber"
//                 value={formData.gstNumber}
//                 onChange={handleGSTChangeWithValidation}
//                 placeholder="Enter GST number"
//                 maxLength={15}
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 uppercase"
//               />
//             </div>
//             {/* No messages shown below */}
//           </div>

//           {/* GST Certificate Upload */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               GST Certificate
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="file"
//                 name="gstFile"
//                 onChange={(e) => onFileChange(e, 'gstFile')}
//                 accept=".pdf,.jpg,.jpeg,.png"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-[#4B0082] hover:file:bg-purple-100 cursor-pointer"
//               />
//             </div>
//             {/* No file selected message */}
//           </div>
//         </div>
//       </div>

//       {/* Dynamic License Sections for each product */}
//       {formData.productTypes.map((productName: string) => {
//         const licenseInfo = getLicenseInfo(productName);
//         const licenseData = formData.licenses[productName] || {
//           number: "",
//           file: null,
//           issueDate: null,
//           expiryDate: null,
//           issuingAuthority: "",
//           status: 'Expired'
//         };

//         return (
//           <div key={productName} className="mb-6">
//             <div className="bg-purple-50 rounded-xl p-3 mb-4">
//               <h3 className="text-lg font-semibold text-[#4B0082] flex items-center">
//                 <Shield className="mr-2 w-5 h-5" />
//                 {licenseInfo.label}
//                 <span className="ml-2 text-sm font-normal text-neutral-600">
//                   (Required for: {productName})
//                 </span>
//               </h3>
//             </div>

//             <div className="grid grid-cols-2 gap-x-6 gap-y-4">
//               {/* License Number */}
//               <div className="flex flex-col gap-1">
//                 <label className="text-label-l3 text-neutral-700 font-semibold">
//                   License Number
//                   <span className="text-warning-500 font-semibold ml-1">*</span>
//                 </label>
//                 <div className="relative">
//                   <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//                   <input
//                     type="text"
//                     name={`licenseNumber-${productName}`}
//                     value={licenseData.number}
//                     onChange={onLicenseNumberChange}
//                     placeholder={licenseInfo.placeholder}
//                     className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//                   />
//                 </div>
//               </div>

//               {/* License File Upload */}
//               <div className="flex flex-col gap-1">
//                 <label className="text-label-l3 text-neutral-700 font-semibold">
//                   License Copy Upload
//                   <span className="text-warning-500 font-semibold ml-1">*</span>
//                 </label>
//                 <div className="relative">
//                   <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//                   <input
//                     type="file"
//                     name={`licenseFile-${productName}`}
//                     onChange={(e) => onFileChange(e, 'license', productName)}
//                     accept=".pdf,.jpg,.jpeg,.png"
//                     className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-[#4B0082] hover:file:bg-purple-100 cursor-pointer"
//                   />
//                 </div>
//                 {/* No file selected message */}
//               </div>

//               {/* Issue Date */}
//               <div className="flex flex-col gap-1">
//                 <label className="text-label-l3 text-neutral-700 font-semibold">
//                   License Issue Date
//                   <span className="text-warning-500 font-semibold ml-1">*</span>
//                 </label>
//                 <DatePicker
//                   value={licenseData.issueDate}
//                   onChange={(date) => onIssueDateChange(date, productName)}
//                   maxDate={new Date()}
//                   format="dd/MM/yyyy"
//                   slotProps={{
//                     textField: {
//                       size: "small",
//                       fullWidth: true,
//                       placeholder: "DD/MM/YYYY",
//                       className: "w-full",
//                       sx: {
//                         '& .MuiOutlinedInput-root': {
//                           height: '48px',
//                           borderRadius: '16px',
//                           backgroundColor: 'white',
//                           '& .MuiOutlinedInput-notchedOutline': {
//                             borderColor: '#737373',
//                           },
//                           '&:hover .MuiOutlinedInput-notchedOutline': {
//                             borderColor: '#4B0082',
//                           },
//                           '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                             borderColor: '#4B0082',
//                           },
//                         },
//                       },
//                     },
//                   }}
//                 />
//               </div>

//               {/* Expiry Date */}
//               <div className="flex flex-col gap-1">
//                 <label className="text-label-l3 text-neutral-700 font-semibold">
//                   License Expiry Date
//                   <span className="text-warning-500 font-semibold ml-1">*</span>
//                 </label>
//                 <DatePicker
//                   value={licenseData.expiryDate}
//                   onChange={(date) => onExpiryDateChange(date, productName)}
//                   minDate={licenseData.issueDate || undefined}
//                   format="dd/MM/yyyy"
//                   slotProps={{
//                     textField: {
//                       size: "small",
//                       fullWidth: true,
//                       placeholder: "DD/MM/YYYY",
//                       className: "w-full",
//                       sx: {
//                         '& .MuiOutlinedInput-root': {
//                           height: '48px',
//                           borderRadius: '16px',
//                           backgroundColor: 'white',
//                           '& .MuiOutlinedInput-notchedOutline': {
//                             borderColor: '#737373',
//                           },
//                           '&:hover .MuiOutlinedInput-notchedOutline': {
//                             borderColor: '#4B0082',
//                           },
//                           '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                             borderColor: '#4B0082',
//                           },
//                         },
//                       },
//                     },
//                   }}
//                 />
//               </div>

//               {/* Issuing Authority - Input Field */}
//               <div className="flex flex-col gap-1">
//                 <label className="text-label-l3 text-neutral-700 font-semibold">
//                   Issuing Authority
//                   <span className="text-warning-500 font-semibold ml-1">*</span>
//                 </label>
//                 <div className="relative">
//                   <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//                   <input
//                     type="text"
//                     name={`issuingAuthority-${productName}`}
//                     value={licenseData.issuingAuthority}
//                     onChange={onIssuingAuthorityChange}
//                     placeholder="Enter issuing authority"
//                     className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//                   />
//                 </div>
//               </div>

//               {/* License Status - Simplified, no colors */}
//               <div className="flex flex-col gap-1">
//                 <label className="text-label-l3 text-neutral-700 font-semibold">
//                   License Status
//                 </label>
//                 <div className="h-12 px-4 rounded-2xl border border-neutral-300 bg-neutral-50 flex items-center text-neutral-700">
//                   <Shield className="mr-2 w-5 h-5 text-neutral-500" />
//                   {!licenseData.issueDate || !licenseData.expiryDate 
//                     ? 'Pending' 
//                     : licenseData.status}
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       })}

//       {formData.productTypes.length === 0 && (
//         <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
//           <div className="flex items-center">
//             <span className="text-yellow-800 text-xl mr-3">⚠️</span>
//             <div>
//               <p className="text-yellow-800 font-medium">
//                 No product types selected
//               </p>
//               <p className="text-yellow-700 text-sm mt-1">
//                 Please go back to Step 1 and select at least one product type.
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Buttons */}
//       <div className="flex justify-between mt-4 mb-10">
//         <button
//           type="button"
//           onClick={prevStep}
//           className="border border-warning-500 text-warning-500 px-6 py-3 rounded-md hover:bg-warning-500 hover:text-black transition text-label-l2 font-semibold cursor-pointer"
//         >
//           Back
//         </button>

//         <button
//           type="button"
//           onClick={nextStep}
//           className="bg-white border border-primary-900 text-md hover:text-white text-primary-900 px-8 py-3 rounded-md hover:bg-primary-900 transition text-label-l2 font-semibold cursor-pointer"
//         >
//           Continue →
//         </button>
//       </div>
//     </div>
//   );
// }










// "use client";

// import React from "react";
// import { FileUp, Calendar, Building2, FileText } from "lucide-react";
// import Select from "react-select";

// interface Props {
//   formData: any;
//   handleChange: (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => void;
//   prevStep: () => void;
//   nextStep: () => void;
// }

// interface SelectOption {
//   value: string;
//   label: string;
// }

// export default function DocumentForm({
//   formData,
//   handleChange,
//   prevStep,
//   nextStep,
// }: Props) {
//   // Issuing Authority options
//   const issuingAuthorityOptions: SelectOption[] = [
//     { label: "State Drug Authority", value: "state_drug" },
//     { label: "Central Drug Authority", value: "central_drug" },
//   ];

//   // Common select styles with h-12 and dropdown border radius
//   const selectStyles = {
//     control: (base: any, state: any) => ({
//       ...base,
//       height: "48px",
//       minHeight: "48px",
//       borderRadius: "16px",
//       borderColor: state.isFocused ? "#4B0082" : "#737373",
//       boxShadow: "none",
//       cursor: "pointer",
//       paddingLeft: "30px",
//       "&:hover": {
//         borderColor: "#4B0082",
//       },
//     }),
//     valueContainer: (base: any) => ({
//       ...base,
//       padding: "0 16px",
//       cursor: "pointer",
//       height: "48px",
//     }),
//     indicatorsContainer: (base: any) => ({
//       ...base,
//       height: "48px",
//       cursor: "pointer",
//     }),
//     dropdownIndicator: (base: any, state: any) => ({
//       ...base,
//       color: state.isFocused ? "#4B0082" : "#737373",
//       cursor: "pointer",
//       "&:hover": {
//         color: "#4B0082",
//       },
//     }),
//     menu: (base: any) => ({
//       ...base,
//       borderRadius: "24px",
//       overflow: "hidden",
//     }),
//     option: (base: any, state: any) => ({
//       ...base,
//       backgroundColor: state.isSelected
//         ? "#4B0082"
//         : state.isFocused
//           ? "#F3E8FF"
//           : "white",
//       color: state.isSelected ? "white" : "#1E1E1E",
//       cursor: "pointer",
//       "&:active": {
//         backgroundColor: "#4B0082",
//         color: "white",
//       },
//     }),
//     placeholder: (base: any) => ({
//       ...base,
//       color: "#A3A3A3",
//     }),
//     singleValue: (base: any) => ({
//       ...base,
//       color: "#1E1E1E",
//     }),
//     input: (base: any) => ({
//       ...base,
//       margin: 0,
//       padding: 0,
//     }),
//   };

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">Statutory Documents</div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           License and GST compliance upload
//         </div>
//       </div>

//       {/* License Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
//           {/* License Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Relevant License Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="licenseNumber"
//                 value={formData.licenseNumber}
//                 onChange={handleChange}
//                 placeholder="Enter your License Number"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* License Upload */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Relevant Licence Copy Upload
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="file"
//                 name="licenseFile"
//                 onChange={handleChange}
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-[#4B0082] hover:file:bg-purple-100 cursor-pointer"
//               />
//             </div>
//           </div>

//           {/* Issue Date */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Relevant License Issue Date
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="date"
//                 name="licenseIssueDate"
//                 value={formData.licenseIssueDate}
//                 onChange={handleChange}
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Expiry Date */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Relevant License Expiry Date
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="date"
//                 name="licenseExpiryDate"
//                 value={formData.licenseExpiryDate}
//                 onChange={handleChange}
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Issuing Authority */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Relevant License Issuing Authority
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 z-10" />
//               <Select
//                 options={issuingAuthorityOptions}
//                 value={issuingAuthorityOptions.find(
//                   (option) => option.value === formData.issuingAuthority
//                 ) || null}
//                 onChange={(selected) => {
//                   const event = {
//                     target: {
//                       name: "issuingAuthority",
//                       value: selected?.value || "",
//                     },
//                   } as React.ChangeEvent<HTMLSelectElement>;
//                   handleChange(event);
//                 }}
//                 placeholder="Select issuing authority"
//                 theme={(theme) => ({
//                   ...theme,
//                   colors: {
//                     ...theme.colors,
//                     primary: "#4B0082",
//                     primary25: "#F3E8FF",
//                     primary50: "#E9D5FF",
//                   },
//                 })}
//                 styles={selectStyles}
//               />
//             </div>
//           </div>

//           {/* License Status */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Relevant License Status
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="flex items-center justify-between border border-neutral-500 rounded-2xl px-4 h-12">
//               <span className="text-label-l2 text-neutral-700">Active</span>
//               <input
//                 type="checkbox"
//                 name="licenseStatus"
//                 checked={formData.licenseStatus}
//                 onChange={handleChange}
//                 className="h-5 w-5 rounded accent-[#4B0082] cursor-pointer"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* GST Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
//           {/* GSTIN Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               GSTIN Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="gstNumber"
//                 value={formData.gstNumber}
//                 onChange={handleChange}
//                 placeholder="Enter GSTIN"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* GST Certificate */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               GST Certificate
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <FileUp className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="file"
//                 name="gstCertificate"
//                 onChange={handleChange}
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-[#4B0082] hover:file:bg-purple-100 cursor-pointer"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Buttons */}
//       <div className="flex justify-between mt-4 mb-10">
//         <button
//           onClick={prevStep}
//           className="border border-warning-500 text-warning-500 px-6 py-3 rounded-md hover:bg-warning-500 hover:text-black transition text-label-l2 font-semibold cursor-pointer"
//         >
//           Back
//         </button>

//         <button
//           onClick={nextStep}
//           className="bg-white border border-primary-900 text-md hover:text-white text-primary-900 px-8 py-3 rounded-md hover:bg-primary-900 transition text-label-l2 font-semibold cursor-pointer"
//         >
//           Continue →
//         </button>
//       </div>
//     </div>
//   );
// }