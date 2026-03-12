"use client";

import React from "react";
import {
  FileText
} from "lucide-react";
import Image from "next/image";
import { GoCheckCircleFill } from "react-icons/go";
import { useRouter } from "next/navigation";

interface Props {
  formData: any;
  emailVerified: boolean;
  phoneVerified: boolean;
  onEdit: (section: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  prevStep: () => void;
}

export default function ReviewForm({
  formData,
  onEdit,
  onSubmit,
  submitting,
  prevStep
}: Props) {

  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900">
          Review & Confirm Your Registration
        </h1>
        <p className="text-[#4A5565] text-md mt-1">
          Please verify your details before submission.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-6">

        {/* COMPANY DETAILS */}
        <Card title="Company Details" onEdit={() => onEdit("company")}>
          <Row label="Company Name" value={formData.sellerName} />
          <Row label="Company Type" value={formData.companyType} />
          <Row label="Seller Type" value={formData.sellerType} />
          <Row label="GST Number" value={formData.gstNumber} />
        </Card>

        {/* COORDINATOR DETAILS */}
        <Card title="Coordinator Details" onEdit={() => onEdit("coordinator")}>
          <Row label="Coordinator Name" value={formData.coordinatorName} />
          <Row label="Designation" value={formData.coordinatorDesignation} />
          <Row label="Email" value={formData.coordinatorEmail} />
          <Row label="Phone Number" value={formData.coordinatorMobile} />
        </Card>
        </div>

        {/* COMPLIANCE DOCUMENTS - Combined GST + Licenses */}
        <Card title="Compliance Documents" onEdit={() => onEdit("documents")}>
          {/* GST Document */}
          <div className="mb-4">
            <LicenseRow
              productName="GST"
              licenseNumber={formData.gstNumber}
              uploaded={!!formData.gstFile}
              file={formData.gstFile}
              showView={true}
            />
          </div>

          {/* License Documents */}
          {formData.productTypes && formData.productTypes.length > 0 && (
            <div>
              <div className="space-y-4">
                {formData.productTypes.map((productName: string) => {
                  const license = formData.licenses?.[productName];
                  return (
                    <LicenseRow
                      key={productName}
                      productName={productName}
                      licenseNumber={license?.number || ""}
                      uploaded={!!license?.file}
                      file={license?.file}
                      showView={true}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* BANK DETAILS - Combined Card */}
       <Card title="Bank Details" onEdit={() => onEdit("bank")}>

  <div className="grid grid-cols-2 gap-y-4 gap-x-10">

    <Row label="Bank Name" value={formData.bankName} />

    <Row label="Account Holder" value={formData.accountHolderName} />

    <Row label="Branch Name" value={formData.branch} />

    <Row label="IFSC Code" value={formData.ifscCode} />

    <Row
      label="Account Number"
      value={
        formData.accountNumber
          // ? `****${formData.accountNumber.slice(-4)}`
          // : ""
      }
    />

    <FileRow
      label=""
      name={formData.cancelledChequeFile?.name || "cancelled-cheque.pdf"}
      uploaded={!!formData.cancelledChequeFile}
      file={formData.cancelledChequeFile}
      showStatus={false}
    />

  </div>

</Card>

      {/* SUCCESS MESSAGE */}
      <div className="bg-success-50 border border-green-200  rounded-lg px-4 py-3 flex items-center gap-2">
        <GoCheckCircleFill className="w-5 h-5 text-success-900" />
        <span className="text-sm font-semibold text-neutral-900">
          All registration steps completed.
        </span>
        <span className="text-sm font-semibold text-[#4A5565]">
        Your application is ready for submission.
        </span>
      </div>

      {/* ACTION BUTTONS - Updated to match DocumentForm styling */}
      <div className="flex justify-between items-center pt-4">
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
            onClick={onSubmit}
            disabled={submitting}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold hover:border-primary-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Continue"}
            {!submitting && (
              <Image
                src="/icons/continueicon.png"
                alt="Continue"
                width={18}
                height={18}
              />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

/* ---------------- CARD ---------------- */

function Card({
  title,
  children,
  onEdit
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg text-neutral-900">
          {title}
        </h3>

        <button
          onClick={onEdit}
          className="text-purple-600 text-sm flex items-center gap-1 font-medium hover:text-purple-700 transition"
        >
          <Image
            src="/icons/EditIcon.png"
            alt="Edit"
            width={16.87}
            height={16.87}
          />
          Edit
        </button>
      </div>

      {/* Divider line */}
      <div className="border-t border-neutral-200 mb-4"></div>

      <div className="flex flex-col gap-3">
        {children}
      </div>

    </div>
  );
}

/* ---------------- ROW - Simple label-value pair ---------------- */

function Row({
  label,
  value
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center text-md">
      <span className="text-neutral-900 font-semibold">{label}</span>
      <span className="text-neutral-900 ">{value || "-"}</span>
    </div>
  );
}

/* ---------------- LICENSE ROW - New component for license display ---------------- */

function LicenseRow({
  productName,
  licenseNumber,
  uploaded,
  file,
  showView = true
}: {
  productName: string;
  licenseNumber: string;
  uploaded: boolean;
  file?: File | null;
  showView?: boolean;
}) {
  const handleView = () => {
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      window.open(fileUrl, '_blank');
    }
  };

  return (
    
    // <div className="flex items-center justify-between w-full">
    <div className="w-full">
    <div className="grid grid-cols-[260px_1fr_auto] items-center">
      {/* Left: Product name + "License Number" text */}
      <div className="flex items-center gap-2 min-w-50">
        <FileText className="w-5 h-5 shrink-0 text-neutral-700" />
        <span className="text-neutral-900 font-semibold whitespace-nowrap">
          {productName} License Number
        </span>
      </div>

      {/* Middle: License number value */}
      <div className="text-neutral-900 text-center">
    {licenseNumber || "-"}
  </div>

      {/* Right: Status and View button */}
      <div className="flex items-center gap-3 justify-end">
        {uploaded ? (
          <>
            <GoCheckCircleFill className="w-5 h-5 text-success-900" />
            <span className="text-neutral-900">Uploaded</span>
            {showView && file && (
              <button
                onClick={handleView}
                className="text-primary-900 ml-2 text-sm hover:underline cursor-pointer font-medium"
              >
                View
              </button>
            )}
          </>
        ) : (
          <span className="text-warning-500 text-sm">Not Uploaded</span>
        )}
      </div>
      </div>
      <div className="border-b border-neutral-200"></div>
    </div>
  );
}

/* ---------------- FILE ROW with Label Option ---------------- */

function FileRow({
  name,
  uploaded,
  file,
  label,
  showStatus = true
}: {
  name: string;
  uploaded: boolean;
  file?: File | null;
  label?: string;
   showStatus?: boolean;
}) {
  const handleView = () => {
    if (file) {
      // Create a URL for the file and open it
      const fileUrl = URL.createObjectURL(file);
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3 flex-1">
        <FileText className="w-5 h-5 shrink-0 text-neutral-700" />
        <div className="flex items-center gap-2 flex-wrap">
          {label && <span className="font-medium text-neutral-900">{label}:</span>}
          <span className="truncate max-w-50 text-sm line-through text-neutral-700">{name}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {uploaded ? (
  <>
    {showStatus && (
      <>
        <GoCheckCircleFill className="w-5 h-5 text-success-900" />
        <span className="text-neutral-900 text-lg">Uploaded</span>
      </>
    )}

    {file && (
      <button
        onClick={handleView}
        className="text-primary-900 ml-3 text-sm hover:underline cursor-pointer font-medium"
      >
        View
      </button>
    )}
  </>
) : (
  showStatus && (
    <span className="text-warning-500 text-xs">Not Uploaded</span>
  )
)}
      </div>
    </div>
  );
}









// "use client";

// import React from "react";
// import {
//   FileText
// } from "lucide-react";
// import Image from "next/image";
// import { GoCheckCircleFill } from "react-icons/go";
// import { useRouter } from "next/navigation";

// interface Props {
//   formData: any;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   onEdit: (section: string) => void;
//   onSubmit: () => void;
//   submitting: boolean;
//   prevStep: () => void;
// }

// export default function ReviewForm({
//   formData,
//   onEdit,
//   onSubmit,
//   submitting,
//   prevStep
// }: Props) {

//   const router = useRouter();

//   return (
//     <div className="flex flex-col gap-6">

//       {/* HEADER */}
//       <div>
//         <h1 className="text-3xl font-semibold text-neutral-900">
//           Review & Confirm Your Registration
//         </h1>
//         <p className="text-[#4A5565] text-md mt-1">
//           Please verify your details before submission.
//         </p>
//       </div>

//       {/* GRID */}
//       <div className="grid grid-cols-2 gap-6">

//         {/* COMPANY DETAILS */}
//         <Card title="Company Details" onEdit={() => onEdit("company")}>
//           <Row label="Company Name" value={formData.sellerName} />
//           <Row label="Company Type" value={formData.companyType} />
//           <Row label="Seller Type" value={formData.sellerType} />
//           <Row label="GST Number" value={formData.gstNumber} />
//         </Card>

//         {/* COORDINATOR DETAILS */}
//         <Card title="Coordinator Details" onEdit={() => onEdit("coordinator")}>
//           <Row label="Coordinator Name" value={formData.coordinatorName} />
//           <Row label="Designation" value={formData.coordinatorDesignation} />
//           <Row label="Email" value={formData.coordinatorEmail} />
//           <Row label="Phone Number" value={formData.coordinatorMobile} />
//         </Card>
//         </div>

//         {/* COMPLIANCE DOCUMENTS - Combined GST + Licenses */}
//         <Card title="Compliance Documents" onEdit={() => onEdit("documents")}>
//           {/* GST Document */}
//           <div>
//             <FileRow
//               name={formData.gstFile?.name || "GST Certificate.pdf"}
//               uploaded={!!formData.gstFile}
//               file={formData.gstFile}
//             />
//           </div>

//           {/* License Documents */}
//           {formData.productTypes && formData.productTypes.length > 0 && (
//             <div>
//               <div className="space-y-2">
//                 {formData.productTypes.map((productName: string) => {
//                   const license = formData.licenses?.[productName];
//                   return (
//                     <FileRow
//                       key={productName}
//                       name={license?.file?.name || `${productName} License.pdf`}
//                       uploaded={!!license?.file}
//                       file={license?.file}
//                     />
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </Card>

//         {/* BANK DETAILS - Combined Card */}
//        <Card title="Bank Details" onEdit={() => onEdit("bank")}>

//   <div className="grid grid-cols-2 gap-y-4 gap-x-10">

//     <Row label="Bank Name" value={formData.bankName} />

//     <Row label="Account Holder" value={formData.accountHolderName} />

//     <Row label="Branch Name" value={formData.branch} />

//     <Row label="IFSC Code" value={formData.ifscCode} />

//     <Row
//       label="Account Number"
//       value={
//         formData.accountNumber
//           // ? `****${formData.accountNumber.slice(-4)}`
//           // : ""
//       }
//     />

//     <FileRow
//       label=""
//       name={formData.cancelledChequeFile?.name || "cancelled-cheque.pdf"}
//       uploaded={!!formData.cancelledChequeFile}
//       file={formData.cancelledChequeFile}
//       showStatus={false}
//     />

//   </div>

// </Card>

      

//       {/* SUCCESS MESSAGE */}
//       <div className="bg-success-50 border border-green-200  rounded-lg px-4 py-3 flex items-center gap-2">
//         <GoCheckCircleFill className="w-5 h-5 text-success-900" />
//         <span className="text-sm font-semibold text-neutral-900">
//           All registration steps completed.
//         </span>
//         <span className="text-sm font-semibold text-[#4A5565]">
//         Your application is ready for submission.
//         </span>
//       </div>

//       {/* ACTION BUTTONS - Updated to match DocumentForm styling */}
//       <div className="flex justify-between items-center pt-4">
//         <div className="flex gap-4">
//           <button 
//           onClick={() => router.push("/")}
//           className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold">
//             Cancel
//           </button>

//           <button className="flex h-12 px-6 py-3 justify-center items-center gap-2 rounded-md bg-[#9F75FC] text-white font-semibold hover:bg-[#B08DFC] transition">
//             <Image
//               src="/icons/savedrafticon.png"
//               alt="Save Draft"
//               width={18}
//               height={18}
//             />
//             Save Draft
//           </button>
//         </div>

//         <div className="flex gap-4">
//           <button
//             onClick={prevStep}
//             className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold hover:neutral-500 hover:text-neutral-500 transition"
//           >
//             <Image
//               src="/icons/backbuttonicon.png"
//               alt="Back"
//               width={18}
//               height={18}
//             />
//             Back
//           </button>

//           <button
//             onClick={onSubmit}
//             disabled={submitting}
//             className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold hover:border-primary-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {submitting ? "Submitting..." : "Continue"}
//             {!submitting && (
//               <Image
//                 src="/icons/continueicon.png"
//                 alt="Continue"
//                 width={18}
//                 height={18}
//               />
//             )}
//           </button>
//         </div>
//       </div>

//     </div>
//   );
// }

// /* ---------------- CARD ---------------- */

// function Card({
//   title,
//   children,
//   onEdit
// }: {
//   title: string;
//   children: React.ReactNode;
//   onEdit: () => void;
// }) {
//   return (
//     <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">

//       {/* Header */}
//       <div className="flex justify-between items-center mb-3">
//         <h3 className="font-semibold text-lg text-neutral-900">
//           {title}
//         </h3>

//         <button
//           onClick={onEdit}
//           className="text-purple-600 text-sm flex items-center gap-1 font-medium hover:text-purple-700 transition"
//         >
//           <Image
//             src="/icons/EditIcon.png"
//             alt="Edit"
//             width={16.87}
//             height={16.87}
//           />
//           Edit
//         </button>
//       </div>

//       {/* Divider line */}
//       <div className="border-t border-neutral-200 mb-4"></div>

//       <div className="flex flex-col gap-3">
//         {children}
//       </div>

//     </div>
//   );
// }

// /* ---------------- ROW - Simple label-value pair ---------------- */

// function Row({
//   label,
//   value
// }: {
//   label: string;
//   value?: string;
// }) {
//   return (
//     <div className="grid grid-cols-[180px_1fr] items-center text-md">
//       <span className="text-neutral-900 font-semibold">{label}</span>
//       <span className="text-neutral-900 ">{value || "-"}</span>
//     </div>
//   );
// }

// /* ---------------- FILE ROW with Label Option ---------------- */

// function FileRow({
//   name,
//   uploaded,
//   file,
//   label,
//   showStatus = true
// }: {
//   name: string;
//   uploaded: boolean;
//   file?: File | null;
//   label?: string;
//    showStatus?: boolean;
// }) {
//   const handleView = () => {
//     if (file) {
//       // Create a URL for the file and open it
//       const fileUrl = URL.createObjectURL(file);
//       window.open(fileUrl, '_blank');
//     }
//   };

//   return (
//     <div className="flex items-center justify-between text-sm">
//       {/* <div className="flex items-center gap-2 text-md flex-1"> */}
//       <div className="flex items-center gap-3  flex-1">
//         <FileText className="w-5 h-5 shrink-0 text-neutral-700" />
//         <div className="flex items-center gap-2 flex-wrap">
//           {label && <span className="font-medium text-neutral-900">{label}:</span>}
//           {/* <span className="truncate max-w-50 text-lg text-neutral-900 font-semibold">{name}</span> */}
//           <span className="truncate max-w-50 text-sm line-through text-neutral-700">{name}</span>
//         </div>
//       </div>

//       <div className="flex items-center gap-3 shrink-0">
//         {uploaded ? (
//   <>
//     {showStatus && (
//       <>
//         <GoCheckCircleFill className="w-5 h-5 text-success-900" />
//         <span className="text-neutral-900 text-lg">Uploaded</span>
//       </>
//     )}

//     {file && (
//       <button
//         onClick={handleView}
//         className="text-primary-900 ml-3 text-sm hover:underline cursor-pointer font-medium"
//       >
//         View
//       </button>
//     )}
//   </>
// ) : (
//   showStatus && (
//     <span className="text-warning-500 text-xs">Not Uploaded</span>
//   )
// )}
//       </div>
//     </div>
//   );
// }































// "use client";

// import React from "react";
// import {
//   FileText
// } from "lucide-react";
// import Image from "next/image";
// import { GoCheckCircleFill } from "react-icons/go";
// import { useRouter } from "next/navigation";

// interface Props {
//   formData: any;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   onEdit: (section: string) => void;
//   onSubmit: () => void;
//   submitting: boolean;
//   prevStep: () => void;
// }

// export default function ReviewForm({
//   formData,
//   onEdit,
//   onSubmit,
//   submitting,
//   prevStep
// }: Props) {

//   const router = useRouter();

//   return (
//     <div className="flex flex-col gap-6">

//       {/* HEADER */}
//       <div>
//         <h1 className="text-3xl font-semibold text-neutral-900">
//           Review & Confirm Your Registration
//         </h1>
//         <p className="text-[#4A5565] text-md mt-1">
//           Please verify your details before submission.
//         </p>
//       </div>

//       {/* GRID */}
//       <div className="grid grid-cols-2 gap-6">

//         {/* COMPANY DETAILS */}
//         <Card title="Company Details" onEdit={() => onEdit("company")}>
//           <Row label="Company Name" value={formData.sellerName} />
//           <Row label="Company Type" value={formData.companyType} />
//           <Row label="Seller Type" value={formData.sellerType} />
//           <Row label="GST Number" value={formData.gstNumber} />
//         </Card>

//         {/* COORDINATOR DETAILS */}
//         <Card title="Coordinator Details" onEdit={() => onEdit("coordinator")}>
//           <Row label="Coordinator Name" value={formData.coordinatorName} />
//           <Row label="Designation" value={formData.coordinatorDesignation} />
//           <Row label="Email" value={formData.coordinatorEmail} />
//           <Row label="Phone Number" value={formData.coordinatorMobile} />
//         </Card>

//         {/* COMPLIANCE DOCUMENTS - Combined GST + Licenses */}
//         <Card title="Compliance Documents" onEdit={() => onEdit("documents")}>
//           {/* GST Document */}
//           <div>
//             <FileRow
//               name={formData.gstFile?.name || "GST Certificate.pdf"}
//               uploaded={!!formData.gstFile}
//               file={formData.gstFile}
//             />
//           </div>

//           {/* License Documents */}
//           {formData.productTypes && formData.productTypes.length > 0 && (
//             <div>
//               <div className="space-y-2">
//                 {formData.productTypes.map((productName: string) => {
//                   const license = formData.licenses?.[productName];
//                   return (
//                     <FileRow
//                       key={productName}
//                       name={license?.file?.name || `${productName} License.pdf`}
//                       uploaded={!!license?.file}
//                       file={license?.file}
//                     />
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </Card>

//         {/* BANK DETAILS - Combined Card */}
//         <Card title="Bank Details" onEdit={() => onEdit("bank")}>
//           {/* Bank Account Details */}
//           <div className="space-y-3">
//             <Row label="Bank Name" value={formData.bankName} />
//             <Row label="Branch Name" value={formData.branch} />
//             <Row
//               label="Account Number"
//               value={
//                 formData.accountNumber
//                   ? `****${formData.accountNumber.slice(-4)}`
//                   : ""
//               }
//             />
//             <Row label="Account Holder" value={formData.accountHolderName} />
//             <Row label="IFSC Code" value={formData.ifscCode} />
//           </div>

//           {/* Cancelled Cheque Document */}
//           <div className="mt-4 pt-4 border-t border-neutral-200">
//             <FileRow
//               name={formData.cancelledChequeFile?.name || "cancelled-cheque.pdf"}
//               uploaded={!!formData.cancelledChequeFile}
//               file={formData.cancelledChequeFile}
//               showStatus={false}
//             />
//           </div>
//         </Card>

//       </div>

//       {/* SUCCESS MESSAGE */}
//       <div className="bg-success-50 border border-green-200  rounded-lg px-4 py-3 flex items-center gap-2">
//         <GoCheckCircleFill className="w-5 h-5 text-success-900" />
//         <span className="text-sm font-semibold text-neutral-900">
//           All registration steps completed.
//         </span>
//         <span className="text-sm font-semibold text-[#4A5565]">
//         Your application is ready for submission.
//         </span>
//       </div>

//       {/* ACTION BUTTONS - Updated to match DocumentForm styling */}
//       <div className="flex justify-between items-center pt-4">
//         <div className="flex gap-4">
//           <button 
//           onClick={() => router.push("/")}
//           className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold">
//             Cancel
//           </button>

//           <button className="flex h-12 px-6 py-3 justify-center items-center gap-2 rounded-md bg-[#9F75FC] text-white font-semibold hover:bg-[#B08DFC] transition">
//             <Image
//               src="/icons/savedrafticon.png"
//               alt="Save Draft"
//               width={18}
//               height={18}
//             />
//             Save Draft
//           </button>
//         </div>

//         <div className="flex gap-4">
//           <button
//             onClick={prevStep}
//             className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold hover:neutral-500 hover:text-neutral-500 transition"
//           >
//             <Image
//               src="/icons/backbuttonicon.png"
//               alt="Back"
//               width={18}
//               height={18}
//             />
//             Back
//           </button>

//           <button
//             onClick={onSubmit}
//             disabled={submitting}
//             className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-900 text-primary-900 font-semibold hover:border-primary-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {submitting ? "Submitting..." : "Continue"}
//             {!submitting && (
//               <Image
//                 src="/icons/continueicon.png"
//                 alt="Continue"
//                 width={18}
//                 height={18}
//               />
//             )}
//           </button>
//         </div>
//       </div>

//     </div>
//   );
// }

// /* ---------------- CARD ---------------- */

// function Card({
//   title,
//   children,
//   onEdit
// }: {
//   title: string;
//   children: React.ReactNode;
//   onEdit: () => void;
// }) {
//   return (
//     <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">

//       {/* Header */}
//       <div className="flex justify-between items-center mb-3">
//         <h3 className="font-semibold text-lg text-neutral-900">
//           {title}
//         </h3>

//         <button
//           onClick={onEdit}
//           className="text-purple-600 text-sm flex items-center gap-1 font-medium hover:text-purple-700 transition"
//         >
//           <Image
//             src="/icons/EditIcon.png"
//             alt="Edit"
//             width={16.87}
//             height={16.87}
//           />
//           Edit
//         </button>
//       </div>

//       {/* Divider line */}
//       <div className="border-t border-neutral-200 mb-4"></div>

//       <div className="flex flex-col gap-3">
//         {children}
//       </div>

//     </div>
//   );
// }

// /* ---------------- ROW - Simple label-value pair ---------------- */

// function Row({
//   label,
//   value
// }: {
//   label: string;
//   value?: string;
// }) {
//   return (
//     <div className="grid grid-cols-[180px_1fr] items-center text-md">
//       <span className="text-neutral-900 font-semibold">{label}</span>
//       <span className="text-neutral-900 ">{value || "-"}</span>
//     </div>
//   );
// }

// /* ---------------- FILE ROW with Label Option ---------------- */

// function FileRow({
//   name,
//   uploaded,
//   file,
//   label,
//   showStatus = true
// }: {
//   name: string;
//   uploaded: boolean;
//   file?: File | null;
//   label?: string;
//    showStatus?: boolean;
// }) {
//   const handleView = () => {
//     if (file) {
//       // Create a URL for the file and open it
//       const fileUrl = URL.createObjectURL(file);
//       window.open(fileUrl, '_blank');
//     }
//   };

//   return (
//     <div className="flex items-center justify-between text-sm">
//       <div className="flex items-center gap-2 text-md flex-1">
//         <FileText className="w-4 h-4 shrink-0 text-neutral-700" />
//         <div className="flex items-center gap-2 flex-wrap">
//           {label && <span className="font-medium text-neutral-900">{label}:</span>}
//           <span className="truncate max-w-50 text-lg text-neutral-900 font-semibold">{name}</span>
//         </div>
//       </div>

//       <div className="flex items-center gap-3 shrink-0">
//         {uploaded ? (
//   <>
//     {showStatus && (
//       <>
//         <GoCheckCircleFill className="w-5 h-5 text-success-900" />
//         <span className="text-neutral-900 text-lg">Uploaded</span>
//       </>
//     )}

//     {file && (
//       <button
//         onClick={handleView}
//         className="text-primary-900 ml-3 text-sm hover:underline cursor-pointer font-medium"
//       >
//         View
//       </button>
//     )}
//   </>
// ) : (
//   showStatus && (
//     <span className="text-warning-500 text-xs">Not Uploaded</span>
//   )
// )}
//       </div>
//     </div>
//   );
// }