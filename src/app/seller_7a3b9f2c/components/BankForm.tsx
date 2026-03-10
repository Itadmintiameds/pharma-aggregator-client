"use client";

import React from "react";
import { Hash, Building2, MapPin } from "lucide-react";
import { HiOutlineUser } from "react-icons/hi2";
import { IoLockClosedOutline } from "react-icons/io5";
import { RiBankLine } from "react-icons/ri";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  formData: any;
  ifscError: string;
  onIfscChange: (value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onNumericInput: (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  prevStep: () => void;
  nextStep: () => void;
}

export default function BankForm({
  formData,
  ifscError,
  onIfscChange,
  onFileChange,
  onAlphabetInput,
  onNumericInput,
  onChange,
  prevStep,
  nextStep
}: Props) {

  const router = useRouter();

  const handleIfscInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIfscChange(e.target.value);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Section */}
      <div>
        <div className="text-h2 font-semibold">Financial Setup</div>
        <div className="text-label-l3 text-neutral-600 mt-1">
          Banking details for secure settlements
        </div>
      </div>

      {/* Bank Details Section */}
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-6">
          {/* Account Holder Name */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Account Holder Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => onAlphabetInput(e, "accountHolderName")}
                placeholder="As per bank records"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
            </div>
          </div>

          {/* IFSC Code */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              IFSC Code
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleIfscInput}
                placeholder="e.g., SBIN0001234"
                maxLength={11}
                className={`w-full h-12 pl-10 pr-4 rounded-2xl border ${ifscError ? 'border-red-500' : 'border-neutral-500'
                  } focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 uppercase`}
              />
            </div>
            {ifscError && (
              <p className="mt-1 text-sm text-red-500">
                {ifscError}
              </p>
            )}
          </div>

          {/* Account Number */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Bank Account Number
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => onNumericInput(e, "accountNumber", 18)}
                placeholder="Enter Account number"
                maxLength={18}
                className="w-full h-12 pl-4 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
              />
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            </div>
          </div>

          {/* Confirm Account Number */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Confirm Account Number
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              
              <input
                type="text"
                name="confirmAccountNumber"
                value={formData.confirmAccountNumber}
                onChange={onChange}
                placeholder="Re-enter account number"
                maxLength={18}
                className={`w-full h-12 pl-4 pr-4 rounded-2xl border ${formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber
                    ? 'border-neutral-500'
                    : formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber
                      ? 'border-neutral-500'
                      : 'border-neutral-500'
                  } focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2`}
              />
              <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />
            </div>
          </div>

          {/* Bank Name (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Bank Name
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <RiBankLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                readOnly
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
              />
            </div>
          </div>

          {/* Branch (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Branch
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="branch"
                value={formData.branch}
                readOnly
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
              />
            </div>
          </div>

          {/* Bank State (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Bank State
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2  w-5 h-5" />
              <input
                type="text"
                name="bankState"
                value={formData.bankState}
                readOnly
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
              />
            </div>
          </div>

          {/* Bank District (Auto-filled) */}
          <div className="flex flex-col gap-1">
            <label className="text-label-l3 text-neutral-700 font-semibold">
              Bank District
              <span className="text-warning-500 font-semibold ml-1">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
              <input
                type="text"
                name="bankDistrict"
                value={formData.bankDistrict}
                readOnly
                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="mt-4">
        <div className="flex flex-col gap-1">
          <label className="text-xl text-black font-semibold mb-2">
            Upload cancelled Cheque / Passbook front page copy
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </label>

          <div
            className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center bg-purple-50 cursor-pointer hover:bg-purple-100 transition"
            onClick={() => document.getElementById('cheque-upload')?.click()}
          >
            <input
              id="cheque-upload"
              type="file"
              name="cancelledChequeFile"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => onFileChange(e, 'cancelledChequeFile')}
            />

            <div className="flex flex-col items-center gap-2">
              <Image
                src="/icons/folder.png"
                alt="Upload"
                width={40}
                height={40}
              />
              <p className="text-label-l3 text-neutral-900">
                Choose a file or drag & drop it here
              </p>
              <p className="text-label-l2 text-neutral-400">
                JPEG, PNG, and PDF formats, up to 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons - Updated to match DocumentForm styling */}
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
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold hover:neutral-500 hover:text-neutral-500 transition"
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
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold hover:border-primary-100 transition"
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
// import { Hash, Building2, MapPin } from "lucide-react";
// import { HiOutlineUser } from "react-icons/hi2";
// import { IoLockClosedOutline } from "react-icons/io5";
// import { RiBankLine } from "react-icons/ri";
// import Image from "next/image";

// interface Props {
//   formData: any;
//   ifscError: string;
//   onIfscChange: (value: string) => void;
//   onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
//   onAlphabetInput: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
//   onNumericInput: (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => void;
//   onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
//   prevStep: () => void;
//   nextStep: () => void;
// }

// export default function BankForm({
//   formData,
//   ifscError,
//   onIfscChange,
//   onFileChange,
//   onAlphabetInput,
//   onNumericInput,
//   onChange,
//   prevStep,
//   nextStep
// }: Props) {

//   const handleIfscInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     onIfscChange(e.target.value);
//   };

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">Financial Setup</div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           Banking details for secure settlements
//         </div>
//       </div>

//       {/* Bank Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-6">
//           {/* Account Holder Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Account Holder Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="text"
//                 name="accountHolderName"
//                 value={formData.accountHolderName}
//                 onChange={(e) => onAlphabetInput(e, "accountHolderName")}
//                 placeholder="As per bank records"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* IFSC Code */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               IFSC Code
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="text"
//                 name="ifscCode"
//                 value={formData.ifscCode}
//                 onChange={handleIfscInput}
//                 placeholder="e.g., SBIN0001234"
//                 maxLength={11}
//                 className={`w-full h-12 pl-10 pr-4 rounded-2xl border ${ifscError ? 'border-red-500' : 'border-neutral-500'
//                   } focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2 uppercase`}
//               />
//             </div>
//             {ifscError && (
//               <p className="mt-1 text-sm text-red-500">
//                 {ifscError}
//               </p>
//             )}
//           </div>

//           {/* Account Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Bank Account Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <input
//                 type="text"
//                 name="accountNumber"
//                 value={formData.accountNumber}
//                 onChange={(e) => onNumericInput(e, "accountNumber", 18)}
//                 placeholder="Enter Account number"
//                 maxLength={18}
//                 className="w-full h-12 pl-4 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//               <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//             </div>
//             {/* {formData.accountNumber && formData.accountNumber.length > 0 && formData.accountNumber.length < 9 && (
//               <p className="mt-1 text-xs text-yellow-600">
//                 Account number should be at least 9 digits
//               </p>
//             )} */}
//           </div>

//           {/* Confirm Account Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Confirm Account Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
              
//               <input
//                 type="text"
//                 name="confirmAccountNumber"
//                 value={formData.confirmAccountNumber}
//                 onChange={onChange}
//                 placeholder="Re-enter account number"
//                 maxLength={18}
//                 className={`w-full h-12 pl-4 pr-4 rounded-2xl border ${formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber
//                     ? 'border-neutral-500'
//                     : formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber
//                       ? 'border-neutral-500'
//                       : 'border-neutral-500'
//                   } focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2`}
//               />
//               <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//             </div>
//             {/* {formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber && (
//               <p className="mt-1 text-xs text-green-600 flex items-center">
//                 <CheckCircle className="w-3 h-3 mr-1" />
//                 Account numbers match
//               </p>
//             )}
//             {formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber && (
//               <p className="mt-1 text-xs text-red-500">
//                 Account numbers do not match
//               </p>
//             )} */}
//           </div>

          

//           {/* Bank Name (Auto-filled) */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Bank Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <RiBankLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="text"
//                 name="bankName"
//                 value={formData.bankName}
//                 readOnly
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Branch (Auto-filled) */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Branch
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="text"
//                 name="branch"
//                 value={formData.branch}
//                 readOnly
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Bank State (Auto-filled) */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Bank State
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2  w-5 h-5" />
//               <input
//                 type="text"
//                 name="bankState"
//                 value={formData.bankState}
//                 readOnly
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Bank District (Auto-filled) */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Bank District
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
//               <input
//                 type="text"
//                 name="bankDistrict"
//                 value={formData.bankDistrict}
//                 readOnly
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-300 bg-gray-50 text-neutral-700 text-label-l2"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Document Upload Section */}
//       <div className="mt-4">
//         <div className="flex flex-col gap-1">
//           <label className="text-xl text-black font-semibold mb-2">
//             Upload cancelled Cheque / Passbook front page copy
//             <span className="text-warning-500 font-semibold ml-1">*</span>
//           </label>

//           <div
//             className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center bg-purple-50 cursor-pointer hover:bg-purple-100 transition"
//             onClick={() => document.getElementById('cheque-upload')?.click()}
//           >
//             <input
//               id="cheque-upload"
//               type="file"
//               name="cancelledChequeFile"
//               className="hidden"
//               accept=".pdf,.jpg,.jpeg,.png"
//               onChange={(e) => onFileChange(e, 'cancelledChequeFile')}
//             />

//             <div className="flex flex-col items-center gap-2">
//               <Image
//                 src="/icons/folder.png"
//                 alt="Upload"
//                 width={40}
//                 height={40}
//               />
//               <p className="text-label-l3 text-neutral-900">
//                 Choose a file or drag & drop it here
//               </p>
//               <p className="text-label-l2 text-neutral-400">
//                 JPEG, PNG, and PDF formats, up to 5MB
//               </p>
//             </div>
//           </div>

//           {/* {formData.cancelledChequeFile && (
//             <p className="text-sm text-green-600 mt-2 flex items-center">
//               <CheckCircle className="w-4 h-4 mr-1" />
//               File selected: {formData.cancelledChequeFile.name}
//             </p>
//           )} */}
//         </div>
//       </div>

//       {/* Security Assurance */}
//       {/* <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
//         <div className="flex">
//           <Lock className="text-[#4B0082] w-6 h-6 mr-4 shrink-0" />
//           <div>
//             <h6 className="font-bold text-[#4B0082] mb-1">
//               Security Assurance
//             </h6>
//             <p className="text-sm text-neutral-700">
//               Your bank details are encrypted and stored securely.
//               We follow PCI-DSS compliance standards for financial data protection.
//             </p>
//           </div>
//         </div>
//       </div> */}

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
// import { User, Lock, Hash, Landmark, Building2, MapPin, Upload } from "lucide-react";

// interface Props {
//   formData: any;
//   handleChange: (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => void;
//   prevStep: () => void;
//   nextStep: () => void;
// }

// export default function BankForm({
//   formData,
//   handleChange,
//   prevStep,
//   nextStep
// }: Props) {

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">Financial Setup</div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           Banking details for secure settlements
//         </div>
//       </div>

//       {/* Bank Details Section */}
//       <div>
//         <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6">
//           {/* Account Holder Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Account Holder Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="accountHolderName"
//                 value={formData.accountHolderName}
//                 onChange={handleChange}
//                 placeholder="e.g., Rajesh Kumar"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* IFSC Code */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               IFSC Code
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="ifsc"
//                 value={formData.ifsc}
//                 onChange={handleChange}
//                 placeholder="e.g., SBIN0001234"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Bank Account Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Bank Account Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="accountNumber"
//                 value={formData.accountNumber}
//                 onChange={handleChange}
//                 placeholder="e.g., 12345678901"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Confirm Account Number */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Confirm Account Number
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="confirmAccountNumber"
//                 value={formData.confirmAccountNumber}
//                 onChange={handleChange}
//                 placeholder="Re-enter account number"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Bank Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Bank Name
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="bankName"
//                 value={formData.bankName}
//                 onChange={handleChange}
//                 placeholder="e.g., State Bank of India"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* Branch */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               Branch
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="branch"
//                 value={formData.branch}
//                 onChange={handleChange}
//                 placeholder="e.g., JP Nagar"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* State */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               State
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="bankState"
//                 value={formData.bankState}
//                 onChange={handleChange}
//                 placeholder="e.g., Karnataka"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>

//           {/* District */}
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold">
//               District
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>
//             <div className="relative">
//               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
//               <input
//                 type="text"
//                 name="bankDistrict"
//                 value={formData.bankDistrict}
//                 onChange={handleChange}
//                 placeholder="e.g., Bangalore"
//                 className="w-full h-12 pl-10 pr-4 rounded-2xl border border-neutral-500 focus:border-[#4B0082] focus:outline-none focus:ring-0 text-label-l2"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Document Upload Section */}
//       <div>
//         <div>
//           <div className="flex flex-col gap-1">
//             <label className="text-label-l3 text-neutral-700 font-semibold mb-2">
//               Upload cancelled Cheque/Passbook front page copy
//               <span className="text-warning-500 font-semibold ml-1">*</span>
//             </label>

//             <div
//               className="border-2 border-dashed border-purple-300 rounded-2xl p-8 text-center bg-purple-50 cursor-pointer hover:bg-purple-100 transition"
//               onClick={() => document.getElementById('cheque-upload')?.click()}
//             >
//               <input
//                 id="cheque-upload"
//                 type="file"
//                 name="cancelledCheque"
//                 className="hidden"
//                 onChange={handleChange}
//               />

//               <div className="flex flex-col items-center gap-2">
//                 <Upload className="w-10 h-10 text-[#4B0082]" />
//                 <p className="text-label-l2 text-neutral-700">
//                   Choose a file or drag & drop it here
//                 </p>
//                 <p className="text-label-l4 text-neutral-500">
//                   JPEG, PNG, and PDF formats, up to 50MB
//                 </p>
//               </div>
//             </div>

//             {formData.cancelledCheque && (
//               <p className="text-sm text-green-600 mt-2">
//                 File selected: {(formData.cancelledCheque as any).name}
//               </p>
//             )}
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