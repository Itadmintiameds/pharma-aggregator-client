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

        {/* COMPLIANCE DOCUMENTS - Combined GST + Licenses */}
        <Card title="Compliance Documents" onEdit={() => onEdit("documents")}>
          {/* GST Document */}
          <div>
            <FileRow
              name={formData.gstFile?.name || "GST Certificate.pdf"}
              uploaded={!!formData.gstFile}
              file={formData.gstFile}
            />
          </div>

          {/* License Documents */}
          {formData.productTypes && formData.productTypes.length > 0 && (
            <div>
              <div className="space-y-2">
                {formData.productTypes.map((productName: string) => {
                  const license = formData.licenses?.[productName];
                  return (
                    <FileRow
                      key={productName}
                      name={license?.file?.name || `${productName} License.pdf`}
                      uploaded={!!license?.file}
                      file={license?.file}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* BANK DETAILS - Combined Card */}
        <Card title="Bank Details" onEdit={() => onEdit("bank")}>
          {/* Bank Account Details */}
          <div className="space-y-3">
            <Row label="Bank Name" value={formData.bankName} />
            <Row label="Branch Name" value={formData.branch} />
            <Row
              label="Account Number"
              value={
                formData.accountNumber
                  ? `****${formData.accountNumber.slice(-4)}`
                  : ""
              }
            />
            <Row label="Account Holder" value={formData.accountHolderName} />
            <Row label="IFSC Code" value={formData.ifscCode} />
          </div>

          {/* Cancelled Cheque Document */}
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <FileRow
              name={formData.cancelledChequeFile?.name || "cancelled-cheque.pdf"}
              uploaded={!!formData.cancelledChequeFile}
              file={formData.cancelledChequeFile}
              showStatus={false}
            />
          </div>
        </Card>

      </div>

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
      <div className="flex items-center gap-2 text-md flex-1">
        <FileText className="w-4 h-4 shrink-0 text-neutral-700" />
        <div className="flex items-center gap-2 flex-wrap">
          {label && <span className="font-medium text-neutral-900">{label}:</span>}
          <span className="truncate max-w-50 text-lg text-neutral-900 font-semibold">{name}</span>
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
//   CheckCircle,
//   FileText
// } from "lucide-react";
// import Image from "next/image";
// import { GoCheckCircleFill } from "react-icons/go";

// interface Props {
//   formData: any;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   onEdit: (section: string) => void;
//   onSubmit: () => void;
//   submitting: boolean;
// }

// export default function ReviewForm({
//   formData,
//   onEdit,
//   onSubmit,
//   submitting
// }: Props) {

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
//                       // label={productName}
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
//             {/* <Row label="Bank State" value={formData.bankState} />
//             <Row label="Bank District" value={formData.bankDistrict} /> */}
            
            
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
//       <div className="bg-green-100 border border-green-200 text-green-700 rounded-lg px-4 py-3 flex items-center gap-2">
//         <CheckCircle className="w-5 h-5 text-green-700" />
//         <span className="text-sm font-medium">
//           All registration steps completed. Your application is ready for submission.
//         </span>
//       </div>

//       {/* ACTION BUTTONS */}
//       <div className="flex justify-between items-center pt-4">

//         <div className="flex gap-3">
//           <button
//             className="px-5 py-2 border border-red-400 text-red-500 rounded-lg hover:bg-red-50 transition"
//             onClick={() => window.location.href = '/'}
//           >
//             Cancel
//           </button>

//           <button className="px-5 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
//             Save Draft
//           </button>
//         </div>

//         <div className="flex gap-3">
//           <button
//             className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
//             onClick={() => onEdit("bank")}
//           >
//             Back
//           </button>

//           <button
//             onClick={onSubmit}
//             disabled={submitting}
//             className="px-6 py-2 bg-[#4B0082] text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a0066] transition"
//           >
//             {submitting ? "Submitting..." : "Continue"}
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







// "use client";

// import React from "react";
// import {
//   CheckCircle,
//   FileText
// } from "lucide-react";
// import Image from "next/image";

// interface Props {
//   formData: any;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   onEdit: (section: string) => void;
//   onSubmit: () => void;
//   submitting: boolean;
// }

// export default function ReviewForm({
//   formData,
//   // emailVerified,
//   // phoneVerified,
//   onEdit,
//   onSubmit,
//   submitting
// }: Props) {

//   return (
//     <div className="flex flex-col gap-6">

//       {/* HEADER */}
//       <div>
//         <h1 className="text-2xl font-semibold text-neutral-900">
//           Review & Confirm Your Registration
//         </h1>
//         <p className="text-neutral-500 text-sm mt-1">
//           Please verify your details before submission.
//         </p>
//       </div>

//       {/* GRID */}
//       <div className="grid grid-cols-2 gap-6">

//         {/* COMPANY DETAILS - Simplified */}
//         <Card title="Company Details" onEdit={() => onEdit("company")}>
//           <Row label="Company Name" value={formData.sellerName} />
//           <Row label="Company Type" value={formData.companyType} />
//           <Row label="Seller Type" value={formData.sellerType} />
//           <Row label="GST Number" value={formData.gstNumber} />
//         </Card>

//         {/* COORDINATOR DETAILS - No badges */}
//         <Card title="Coordinator Details" onEdit={() => onEdit("coordinator")}>
//           <Row label="Coordinator Name" value={formData.coordinatorName} />
//           <Row label="Designation" value={formData.coordinatorDesignation} />
//           <Row label="Email" value={formData.coordinatorEmail} />
//           <Row label="Phone Number" value={formData.coordinatorMobile} />
//         </Card>

//         {/* COMPLIANCE DOCUMENTS - GST Section */}
//         <Card title="GST Details" onEdit={() => onEdit("documents")}>
//           <FileRow
//             name={formData.gstFile?.name || "GST Certificate.pdf"}
//             uploaded={!!formData.gstFile}
//             file={formData.gstFile}
//           />
//         </Card>

//         {/* COMPLIANCE DOCUMENTS - Licenses Section */}
//         {formData.productTypes.map((productName: string) => {
//           const license = formData.licenses[productName];

//           return (
//             <Card
//               key={productName}
//               title={`License: ${productName}`}
//               onEdit={() => onEdit("documents")}
//             >
//               <FileRow
//                 name={license?.file?.name || `${productName} License.pdf`}
//                 uploaded={!!license?.file}
//                 file={license?.file}
//               />
//             </Card>
//           );
//         })}

//         {/* BANK DETAILS - Left Column */}
//         <Card title="Bank Details" onEdit={() => onEdit("bank")}>
//           <Row label="Bank Name" value={formData.bankName} />
//           <Row label="Branch Name" value={formData.branch} />
//           <Row label="Bank State" value={formData.bankState} />
//           <Row label="Bank District" value={formData.bankDistrict} />
//           <FileRowWithEdit
//             fileName={formData.cancelledChequeFile?.name || "cancelled-cheque.pdf"}
//             uploaded={!!formData.cancelledChequeFile}
//             file={formData.cancelledChequeFile}
//             onEdit={() => onEdit("bank")}
//           />
//         </Card>

//         {/* BANK DETAILS - Right Column */}
//         <Card title="Bank Account Details" onEdit={() => onEdit("bank")}>
//           <Row label="Account Holder" value={formData.accountHolderName} />
//           <Row
//             label="Account Number"
//             value={
//               formData.accountNumber
//                 ? `****${formData.accountNumber.slice(-4)}`
//                 : ""
//             }
//           />
//           <Row label="IFSC Code" value={formData.ifscCode} />
//         </Card>

//       </div>

//       {/* SUCCESS MESSAGE - Always shows success message since user reached review page */}
//       <div className="bg-green-100 border border-green-200 text-green-700 rounded-lg px-4 py-3 flex items-center gap-2">
//         <CheckCircle className="w-5 h-5 text-green-700" />
//         <span className="text-sm font-medium">
//           All registration steps completed. Your application is ready for submission.
//         </span>
//       </div>

//       {/* ACTION BUTTONS */}
//       <div className="flex justify-between items-center pt-4">

//         <div className="flex gap-3">
//           <button
//             className="px-5 py-2 border border-red-400 text-red-500 rounded-lg hover:bg-red-50 transition"
//             onClick={() => window.location.href = '/'}
//           >
//             Cancel
//           </button>

//           <button className="px-5 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
//             Save Draft
//           </button>
//         </div>

//         <div className="flex gap-3">
//           <button
//             className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
//             onClick={() => onEdit("bank")}
//           >
//             Back
//           </button>

//           <button
//             onClick={onSubmit}
//             disabled={submitting}
//             className="px-6 py-2 bg-[#4B0082] text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a0066] transition"
//           >
//             {submitting ? "Submitting..." : "Continue"}
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
//     <div className="flex justify-between text-sm">
//       <span className="text-neutral-500">{label}</span>
//       <span className="text-neutral-900 font-medium">{value || "-"}</span>
//     </div>
//   );
// }

// /* ---------------- FILE ROW with View Option ---------------- */

// function FileRow({
//   name,
//   uploaded,
//   file
// }: {
//   name: string;
//   uploaded: boolean;
//   file?: File | null;
// }) {
//   const handleView = () => {
//     if (file) {
//       // Create a URL for the file and open it
//       const fileUrl = URL.createObjectURL(file);
//       window.open(fileUrl, '_blank');
//     }
//   };

//   return (
//     <div className="flex justify-between items-center text-sm">

//       <div className="flex items-center gap-2 text-neutral-700">
//         <FileText className="w-4 h-4" />
//         <span className="truncate max-w-[200px]">{name}</span>
//       </div>

//       <div className="flex items-center gap-2">
//         {uploaded ? (
//           <>
//             <CheckCircle className="w-4 h-4 text-green-600" />
//             <span className="text-green-600 text-xs">Uploaded</span>
//             {file && (
//               <button
//                 onClick={handleView}
//                 className="text-purple-600 text-xs hover:underline cursor-pointer"
//               >
//                 View
//               </button>
//             )}
//           </>
//         ) : (
//           <span className="text-red-500 text-xs">Not Uploaded</span>
//         )}
//       </div>

//     </div>
//   );
// }

// /* ---------------- FILE ROW WITH EDIT (for Bank) ---------------- */

// function FileRowWithEdit({
//   fileName,
//   uploaded,
//   file,
//   onEdit
// }: {
//   fileName?: string;
//   uploaded: boolean;
//   file?: File | null;
//   onEdit: () => void;
// }) {
//   const handleView = () => {
//     if (file) {
//       const fileUrl = URL.createObjectURL(file);
//       window.open(fileUrl, '_blank');
//     }
//   };

//   return (
//     <div className="flex justify-between items-center pt-3 border-t border-neutral-200">

//       <div className="flex items-center gap-2 text-neutral-500">
//         <FileText className="w-4 h-4" />
//         <span className={!uploaded ? "line-through" : ""}>
//           {fileName || "cancelled-cheque.pdf"}
//         </span>
//       </div>

//       {!uploaded ? (
//         <button
//           onClick={onEdit}
//           className="text-purple-600 text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition"
//         >
//           Upload
//           <span className="text-lg">»</span>
//         </button>
//       ) : (
//         <div className="flex items-center gap-3">
//           <CheckCircle className="w-4 h-4 text-green-600" />
//           <span className="text-green-600 text-xs">Uploaded</span>
//           <button
//             onClick={handleView}
//             className="text-purple-600 text-xs hover:underline cursor-pointer"
//           >
//             View
//           </button>
//           <button
//             onClick={onEdit}
//             className="text-purple-600 text-sm font-medium flex items-center gap-1 hover:text-purple-700 transition"
//           >
//             Edit
//             <span className="text-lg">»</span>
//           </button>
//         </div>
//       )}

//     </div>
//   );
// }









// "use client";

// import React from "react";
// import {
//   Edit2,
//   CheckCircle,
//   FileText
// } from "lucide-react";

// interface Props {
//   formData: any;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   onEdit: (section: string) => void;
//   onSubmit: () => void;
//   submitting: boolean;
// }

// export default function ReviewForm({
//   formData,
//   emailVerified,
//   phoneVerified,
//   onEdit,
//   onSubmit,
//   submitting
// }: Props) {

//   return (
//     <div className="flex flex-col gap-6">

//       {/* HEADER */}
//       <div>
//         <h1 className="text-2xl font-semibold text-neutral-900">
//           Review & Confirm Your Registration
//         </h1>
//         <p className="text-neutral-500 text-sm mt-1">
//           Please verify your details before submission.
//         </p>
//       </div>

//       {/* GRID */}
//       <div className="grid grid-cols-2 gap-6">

//         {/* COMPANY DETAILS */}
//         <Card title="Company Details" onEdit={() => onEdit("company")}>
//           <Row label="Company Name" value={formData.sellerName} />
//           <Row label="Seller Type" value={formData.sellerType} />
//           <Row label="GST Number" value={formData.gstNumber} />
//           <Row label="PAN Number" value={formData.panNumber} />
//         </Card>

//         {/* COORDINATOR DETAILS */}
//         <Card title="Coordinator Details" onEdit={() => onEdit("coordinator")}>
//           <Row label="Coordinator Name" value={formData.coordinatorName} />
//           <Row label="Email" value={formData.coordinatorEmail} />
//           <Row label="Phone Number" value={formData.coordinatorMobile} />
//           <Row label="Designation" value={formData.coordinatorDesignation} />
//         </Card>

//         {/* COMPLIANCE DOCUMENTS */}
//         <Card title="Compliance Documents" onEdit={() => onEdit("documents")}>
//           <FileRow name="Drug License" uploaded={true} />
//           <FileRow
//             name={formData.gstFile?.name || "GST Certificate.pdf"}
//             uploaded={!!formData.gstFile}
//           />
//           <FileRow name="PAN Card.pdf" uploaded={true} />
//         </Card>

//         {/* COMPLIANCE DOCUMENTS RIGHT */}
//         <Card title="Compliance Documents" onEdit={() => onEdit("documents")}>
//           <FileRow name="Drug License" uploaded={true} />
//           <FileRow
//             name={formData.gstFile?.name || "GST Certificate.pdf"}
//             uploaded={!!formData.gstFile}
//           />
//           <FileRow name="PAN Card.pdf" uploaded={true} />
//         </Card>

//         {/* BANK DETAILS LEFT */}
//         <Card title="Bank Details" onEdit={() => onEdit("bank")}>
//           <Row label="Bank Name" value={formData.bankName} />
//           <Row label="Branch Name" value={formData.branch} />
//           <Row label="Bank Name" value={formData.bankName} />
//           <Row label="Branch Name" value={formData.branch} />

//           <FileRowWithEdit
//             fileName={formData.cancelledChequeFile?.name}
//             onEdit={() => onEdit("bank")}
//           />
//         </Card>

//         {/* BANK DETAILS RIGHT */}
//         <Card title="Bank Details" onEdit={() => onEdit("bank")}>
//           <Row
//             label="Account Number"
//             value={
//               formData.accountNumber
//                 ? `****${formData.accountNumber.slice(-4)}`
//                 : ""
//             }
//           />
//           <Row label="Account Holder" value={formData.accountHolderName} />
//           <Row label="IFSC Code" value={formData.ifscCode} />
//         </Card>

//       </div>

//       {/* SUCCESS MESSAGE */}
//       <div className="bg-green-100 border border-green-200 text-green-700 rounded-lg px-4 py-3 flex items-center gap-2">
//         <CheckCircle className="w-5 h-5" />
//         <span className="text-sm font-medium">
//           All registration steps completed. Your application is ready for
//           submission.
//         </span>
//       </div>

//       {/* ACTION BUTTONS */}
//       <div className="flex justify-between items-center pt-4">

//         <div className="flex gap-3">
//           <button className="px-5 py-2 border border-red-400 text-red-500 rounded-lg">
//             Cancel
//           </button>

//           <button className="px-5 py-2 bg-purple-500 text-white rounded-lg">
//             Save Draft
//           </button>
//         </div>

//         <div className="flex gap-3">
//           <button className="px-6 py-2 border border-neutral-300 rounded-lg">
//             Back
//           </button>

//           <button
//             onClick={onSubmit}
//             disabled={submitting}
//             className="px-6 py-2 bg-[#4B0082] text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
//           >
//             {submitting ? "Submitting..." : "Continue"}
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
//           className="text-purple-600 text-sm flex items-center gap-1 font-medium"
//         >
//           <Edit2 className="w-4 h-4" />
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

// /* ---------------- ROW ---------------- */

// function Row({
//   label,
//   value
// }: {
//   label: string;
//   value?: string;
// }) {
//   return (
//     <div className="flex justify-between text-sm">
//       <span className="text-neutral-500">{label}</span>
//       <span className="text-neutral-900 font-medium">{value || "-"}</span>
//     </div>
//   );
// }

// /* ---------------- FILE ROW ---------------- */

// function FileRow({
//   name,
//   uploaded
// }: {
//   name: string;
//   uploaded: boolean;
// }) {
//   return (
//     <div className="flex justify-between items-center text-sm">

//       <div className="flex items-center gap-2 text-neutral-700">
//         <FileText className="w-4 h-4" />
//         {name}
//       </div>

//       <div className="flex items-center gap-2">
//         {uploaded ? (
//           <>
//             <CheckCircle className="w-4 h-4 text-green-600" />
//             <span className="text-green-600 text-xs">Uploaded</span>
//             <span className="text-purple-600 text-xs cursor-pointer">
//               View
//             </span>
//           </>
//         ) : (
//           <span className="text-red-500 text-xs">Not Uploaded</span>
//         )}
//       </div>

//     </div>
//   );
// }

// function FileRowWithEdit({
//   fileName,
//   onEdit
// }: {
//   fileName?: string;
//   onEdit: () => void;
// }) {
//   return (
//     <div className="flex justify-between items-center pt-3 border-t border-neutral-200">

//       <div className="flex items-center gap-2 text-neutral-500">

//         <FileText className="w-4 h-4" />

//         <span className="line-through">
//           {fileName || "cancelled-cheque.pdf"}
//         </span>

//       </div>

//       <button
//         onClick={onEdit}
//         className="text-purple-600 text-sm font-medium flex items-center gap-1"
//       >
//         Edit
//         <span className="text-lg">»»</span>
//       </button>

//     </div>
//   );
// }



// "use client";

// import React from "react";
// import { Edit2, CheckCircle, Shield, Building2, User, FileText, Landmark, XCircle } from "lucide-react";

// interface Props {
//   formData: any;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   onEdit: (section: string) => void;
//   onSubmit: () => void;
//   submitting: boolean;
// }

// export default function ReviewForm({
//   formData,
//   emailVerified,
//   phoneVerified,
//   onEdit,
//   onSubmit,
//   submitting
// }: Props) {

//   const formatDate = (date: Date | null) => {
//     if (!date) return 'Not provided';
//     return date.toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     });
//   };

//   return (
//     <div className="flex flex-col gap-8">

//       {/* Header Section */}
//       <div>
//         <div className="text-h2 font-semibold">
//           Review Your Information
//         </div>
//         <div className="text-label-l3 text-neutral-600 mt-1">
//           Please verify all details before submitting your registration
//         </div>
//       </div>

//       {/* Validation Summary */}
//       <div className="p-4 bg-purple-50 rounded-xl border-l-4 border-[#4B0082]">
//         <h6 className="text-lg font-bold text-[#4B0082] mb-3 flex items-center">
//           <Shield className="mr-2 w-5 h-5" />
//           Validation Summary
//         </h6>
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//           {[
//             {
//               label: "Company Info",
//               complete: formData.sellerName && formData.pincode && formData.productTypes.length > 0,
//             },
//             {
//               label: "Email Verification",
//               complete: emailVerified,
//             },
//             {
//               label: "Phone Verification",
//               complete: phoneVerified,
//             },
//             {
//               label: "GST Document",
//               complete: !!formData.gstFile,
//             },
//             {
//               label: "Product Licenses",
//               complete: formData.productTypes.length > 0 &&
//                 formData.productTypes.every((pt: string) => {
//                   const license = formData.licenses[pt];
//                   return license && license.number && license.file && license.issueDate &&
//                          license.expiryDate && license.issuingAuthority;
//                 }),
//             },
//             {
//               label: "Bank Details",
//               complete: formData.ifscCode && formData.accountNumber && formData.cancelledChequeFile &&
//                        formData.accountNumber === formData.confirmAccountNumber,
//             },
//           ].map((item, index) => (
//             <div key={index} className="flex items-center">
//               {item.complete ? (
//                 <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
//               ) : (
//                 <XCircle className="w-5 h-5 text-red-500 mr-2" />
//               )}
//               <span className="text-sm font-medium text-neutral-700">
//                 {item.label}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* COMPANY DETAILS */}
//       <SummarySection
//         title="Company Details"
//         icon={<Building2 className="w-5 h-5" />}
//         onEdit={() => onEdit("company")}
//         data={[
//           { label: "Company Name", value: formData.sellerName },
//           { label: "Company Type", value: formData.companyType },
//           { label: "Seller Type", value: formData.sellerType },
//           { label: "Product Type(s)", value: formData.productTypes.join(", ") },
//           { label: "State", value: formData.state },
//           { label: "District", value: formData.district },
//           { label: "Taluka", value: formData.taluka },
//           { label: "City", value: formData.city },
//           { label: "Street/Area/Road", value: formData.street },
//           { label: "Building/House No.", value: formData.buildingNo },
//           { label: "Pin Code", value: formData.pincode },
//           { label: "Landmark", value: formData.landmark || "N/A" },
//           { label: "Company Phone", value: formData.phone },
//           { label: "Company Email", value: formData.email },
//           { label: "Website", value: formData.website || "N/A" }
//         ]}
//       />

//       {/* COORDINATOR DETAILS */}
//       <SummarySection
//         title="Coordinator Details"
//         icon={<User className="w-5 h-5" />}
//         onEdit={() => onEdit("coordinator")}
//         data={[
//           { label: "Coordinator Name", value: formData.coordinatorName },
//           { label: "Designation", value: formData.coordinatorDesignation },
//           {
//             label: "Coordinator Email",
//             value: formData.coordinatorEmail,
//             badge: emailVerified ? { text: "Verified", color: "green" } : { text: "Not Verified", color: "red" }
//           },
//           {
//             label: "Coordinator Mobile",
//             value: formData.coordinatorMobile,
//             badge: phoneVerified ? { text: "Verified", color: "green" } : { text: "Not Verified", color: "red" }
//           }
//         ]}
//       />

//       {/* GST DETAILS */}
//       <SummarySection
//         title="GST Details"
//         icon={<FileText className="w-5 h-5" />}
//         onEdit={() => onEdit("documents")}
//         data={[
//           { label: "GST Number", value: formData.gstNumber },
//           {
//             label: "GST Certificate",
//             value: formData.gstFile ? formData.gstFile.name : "Not uploaded",
//             highlight: formData.gstFile ? "green" : "red"
//           }
//         ]}
//       />

//       {/* LICENSE SECTIONS - Dynamic per product */}
//       {formData.productTypes.map((productName: string) => {
//         const license = formData.licenses[productName];
//         return (
//           <SummarySection
//             key={productName}
//             title={`License: ${productName}`}
//             icon={<Shield className="w-5 h-5" />}
//             onEdit={() => onEdit("documents")}
//             data={[
//               { label: "License Number", value: license?.number || "Not provided" },
//               {
//                 label: "License File",
//                 value: license?.file ? license.file.name : "Not uploaded",
//                 highlight: license?.file ? "green" : "red"
//               },
//               { label: "Issue Date", value: formatDate(license?.issueDate) },
//               { label: "Expiry Date", value: formatDate(license?.expiryDate) },
//               { label: "Issuing Authority", value: license?.issuingAuthority || "Not provided" },
//               {
//                 label: "License Status",
//                 value: license?.status || "Not calculated",
//                 badge: license?.status === 'Active'
//                   ? { text: "Active", color: "green" }
//                   : license?.status === 'Expired'
//                   ? { text: "Expired", color: "red" }
//                   : undefined
//               }
//             ]}
//           />
//         );
//       })}

//       {/* BANK DETAILS */}
//       <SummarySection
//         title="Bank Details"
//         icon={<Landmark className="w-5 h-5" />}
//         onEdit={() => onEdit("bank")}
//         data={[
//           { label: "Account Holder Name", value: formData.accountHolderName },
//           { label: "Bank Name", value: formData.bankName },
//           { label: "Branch", value: formData.branch },
//           { label: "IFSC Code", value: formData.ifscCode },
//           { label: "Account Number", value: formData.accountNumber ? `****${formData.accountNumber.slice(-4)}` : "" },
//           { label: "Bank State", value: formData.bankState },
//           { label: "Bank District", value: formData.bankDistrict },
//           {
//             label: "Cancelled Cheque",
//             value: formData.cancelledChequeFile ? formData.cancelledChequeFile.name : "Not uploaded",
//             highlight: formData.cancelledChequeFile ? "green" : "red"
//           }
//         ]}
//       />

//       {/* FINAL ACTION */}
//       <div className="flex justify-end pt-4">
//         <button
//           onClick={onSubmit}
//           disabled={submitting}
//           className="bg-[#4B0082] text-white px-8 py-3 rounded-lg hover:bg-[#3a0066] transition text-label-l2 font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {submitting ? (
//             <>
//               <span className="animate-spin">⏳</span>
//               Submitting...
//             </>
//           ) : (
//             <>
//               <CheckCircle className="w-5 h-5" />
//               Submit Application
//             </>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }

// function SummarySection({
//   title,
//   icon,
//   data,
//   onEdit
// }: {
//   title: string;
//   icon: React.ReactNode;
//   data: { label: string; value: string; badge?: { text: string; color: string }; highlight?: string }[];
//   onEdit: () => void;
// }) {
//   return (
//     <div className="relative border border-neutral-200 rounded-xl p-6 bg-white">
//       {/* Section Title with Icon */}
//       <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold flex items-center gap-2 text-[#4B0082]">
//         {icon}
//         {title}
//       </div>

//       {/* Edit Button */}
//       <div className="flex justify-end items-center mb-4 pt-2">
//         <button
//           onClick={onEdit}
//           className="text-label-l4 text-[#4B0082] font-medium hover:text-[#3a0066] transition flex items-center gap-1 cursor-pointer"
//         >
//           <Edit2 className="w-4 h-4" />
//           Edit
//         </button>
//       </div>

//       {/* Data Grid */}
//       <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
//         {data.map((item, index) => (
//           <div key={index} className="flex flex-col gap-1">
//             <p className="text-label-l4 text-neutral-500">
//               {item.label}
//             </p>
//             <p className={`text-label-l2 font-medium ${
//               item.highlight === 'green'
//                 ? 'text-green-600'
//                 : item.highlight === 'red'
//                 ? 'text-red-500'
//                 : 'text-neutral-900'
//             } flex items-center gap-2`}>
//               {item.value || '-'}
//               {item.badge && (
//                 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
//                   item.badge.color === 'green'
//                     ? 'bg-green-100 text-green-700'
//                     : 'bg-red-100 text-red-700'
//                 }`}>
//                   {item.badge.text}
//                 </span>
//               )}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }














// "use client";

// import React, { useState } from "react";
// import { Edit2, CheckCircle } from "lucide-react";
// import SuccessModal from "./SuccessModal";

// interface Props {
//   formData: any;
//   onEdit: (section: string) => void;
//   onSubmit?: () => void;
// }

// export default function ReviewForm({ formData, onEdit, onSubmit }: Props) {

//   const [showSuccess, setShowSuccess] = useState(false);

//   const handleSubmit = () => {
//     // Only call onSubmit if it exists and is a function
//     if (onSubmit && typeof onSubmit === 'function') {
//       onSubmit();
//     }
//     // Show success modal
//     setShowSuccess(true);
//   };

//   return (
//     <>
//       <div className="flex flex-col gap-8">

//         {/* Header Section */}
//         <div>
//           <div className="text-h2 font-semibold">
//             Review Your Information
//           </div>

//           <div className="text-label-l3 text-neutral-600 mt-1">
//             Please verify all details before submitting your registration
//           </div>
//         </div>


//         {/* COMPANY DETAILS */}
//         <SummarySection
//           title="Company Details"
//           onEdit={() => onEdit("company")}
//           data={[
//             { label: "Company Name", value: formData.companyName },
//             { label: "Company Type", value: formData.companyType },
//             { label: "Seller Type", value: formData.sellerType },
//             { label: "Product Type", value: formData.productType },
//             { label: "State", value: formData.state },
//             { label: "District", value: formData.district },
//             { label: "Taluka", value: formData.taluka },
//             { label: "City", value: formData.city },
//             { label: "Street/Area/Road", value: formData.street },
//             { label: "Building/House No.", value: formData.building },
//             { label: "Pincode", value: formData.pincode },
//             { label: "Landmark", value: formData.landmark },
//             { label: "Website", value: formData.website },
//             { label: "Company Phone", value: formData.phone },
//             { label: "Company Email", value: formData.email }
//           ]}
//         />


//         {/* COORDINATOR DETAILS */}
//         <SummarySection
//           title="Coordinator Details"
//           onEdit={() => onEdit("coordinator")}
//           data={[
//             { label: "Coordinator Name", value: formData.coordinatorName },
//             { label: "Designation", value: formData.designation },
//             { label: "Coordinator Mobile", value: formData.mobile },
//             { label: "Coordinator Email", value: formData.email }
//           ]}
//         />


//         {/* LICENSE / DOCUMENTS */}
//         <SummarySection
//           title="Statutory Documents"
//           onEdit={() => onEdit("documents")}
//           data={[
//             { label: "License Number", value: formData.licenseNumber },
//             { label: "Issue Date", value: formData.licenseIssueDate },
//             { label: "Expiry Date", value: formData.licenseExpiryDate },
//             { label: "Issuing Authority", value: formData.issuingAuthority },
//             {
//               label: "License Status",
//               value: formData.licenseStatus ? "Active" : "Inactive"
//             },
//             { label: "GSTIN", value: formData.gstNumber }
//           ]}
//         />


//         {/* BANK DETAILS */}
//         <SummarySection
//           title="Financial Setup"
//           onEdit={() => onEdit("bank")}
//           data={[
//             { label: "Account Holder Name", value: formData.accountHolderName },
//             { label: "IFSC Code", value: formData.ifsc },
//             { label: "Account Number", value: formData.accountNumber },
//             { label: "Confirm Account Number", value: formData.confirmAccountNumber },
//             { label: "Bank Name", value: formData.bankName },
//             { label: "Branch", value: formData.branch },
//             { label: "State", value: formData.bankState },
//             { label: "District", value: formData.bankDistrict }
//           ]}
//         />


//         {/* FINAL ACTION */}
//         <div className="flex justify-end pt-4">

//           <button
//             onClick={handleSubmit}
//             className="bg-primary-900 text-white px-8 py-3 rounded-lg hover:bg-primary-900/90 transition text-label-l2 font-semibold cursor-pointer flex items-center gap-2"
//           >
//             <CheckCircle className="w-5 h-5" />
//             Submit
//           </button>

//         </div>

//       </div>


//       {/* SUCCESS MODAL */}
//       <SuccessModal
//         open={showSuccess}
//         onClose={() => setShowSuccess(false)}
//       />

//     </>
//   );
// }

// function SummarySection({
//   title,
//   data,
//   onEdit
// }: {
//   title: string;
//   data: { label: string; value: string }[];
//   onEdit: () => void;
// }) {
//   return (

//     <div className="relative border border-neutral-200 rounded-xl p-6 bg-white">

//       {/* Section Title */}
//       <div className="absolute -top-5 left-4 bg-white px-2 text-h3 font-semibold flex items-center gap-2">
//         {title}
//       </div>


//       {/* Edit Button */}
//       <div className="flex justify-end items-center mb-4 pt-2">

//         <button
//           onClick={onEdit}
//           className="text-label-l4 text-primary-900 font-medium hover:text-primary-900/80 transition flex items-center gap-1 cursor-pointer"
//         >
//           <Edit2 className="w-4 h-4" />
//           Edit
//         </button>

//       </div>


//       {/* Data Grid */}
//       <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">

//         {data.map((item, index) => (

//           <div key={index} className="flex flex-col gap-1">

//             <p className="text-label-l4 text-neutral-500">
//               {item.label}
//             </p>

//             <p className="text-label-l2 font-medium text-neutral-900">
//               {item.value || "-"}
//             </p>

//           </div>

//         ))}

//       </div>

//     </div>

//   );
// }
