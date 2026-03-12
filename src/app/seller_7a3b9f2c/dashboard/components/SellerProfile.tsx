"use client";

import React, { useEffect, useState } from "react";
import { FileText, User, X } from "lucide-react"; 
import Image from "next/image";
import { GoCheckCircleFill } from "react-icons/go";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";
import { SellerProfile as SellerProfileType } from "@/src/types/seller/SellerProfileData";
import toast from "react-hot-toast";

const ImageModal = ({ 
  isOpen, 
  onClose, 
  imageSrc, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageSrc: string; 
  title: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with Blur Effect*/}
      <div 
        className="absolute inset-0 bg-opacity-30 backdrop-blur-md"
        onClick={onClose}
      ></div>
      
      {/* Modal Content  */}
      <div className="relative bg-white rounded-xl shadow-xl w-11/12 max-w-5xl max-h-[90vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-white">
          <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-warning-500" />
          </button>
        </div>
        
        {/* Image Container */}
        <div className="flex-1 overflow-auto p-8 bg-neutral-500">
          <div className="relative flex items-center justify-center w-full h-full min-h-100">
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-contain w-auto h-auto max-w-full max-h-full"
              priority
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-neutral-200 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2  text-primary-900 border  border-neutral-500 rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SellerProfile = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ADD STATE FOR MODAL
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  // ADD FUNCTION TO OPEN MODAL WITH SPECIFIC IMAGE
  const openImageViewer = (imageType: 'cheque' | 'gst' | 'license', licenseName?: string) => {
    let imageSrc = '';
    let title = '';
    
    switch(imageType) {
      case 'cheque':
        imageSrc = '/assets/docs/cheque.jpg';
        title = 'Cancelled Cheque';
        break;
      case 'gst':
        imageSrc = '/assets/docs/gst-certificate.png';
        title = 'GST Certificate';
        break;
      case 'license':
        imageSrc = '/assets/docs/license-file.png';
        title = `${licenseName || 'License'} Document`;
        break;
    }
    
    setModalImage(imageSrc);
    setModalTitle(title);
    setModalOpen(true);
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await sellerProfileService.getCurrentSellerProfile();
        const transformedData = transformApiDataToUI(data);
        setProfileData(transformedData);
        
        console.log('✅ Profile data loaded successfully');
      } catch (err: any) {
        console.error('❌ Failed to load profile:', err);
        setError(err.message || 'Failed to load profile data');
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const transformApiDataToUI = (apiData: SellerProfileType) => {
    const productTypeNames = apiData.productTypes?.map(pt => pt.productTypeName) || [];
    
    const licenses: Record<string, { number: string; file: { name: string } }> = {};
    
    apiData.documents?.forEach(doc => {
      if (doc.productTypes?.productTypeName) {
        const productName = doc.productTypes.productTypeName;
        licenses[productName] = {
          number: doc.documentNumber || '-',
          file: {
            name: doc.documentFileUrl?.split('/').pop() || 'document.pdf'
          }
        };
      }
    });

    return {
      sellerName: apiData.sellerName || '-',
      companyMobile: apiData.phone || '-',
      companyEmail: apiData.email || '-',
      gstNumber: apiData.sellerGST?.gstNumber || '-',
      companyType: apiData.companyType?.companyTypeName || '-',
      sellerType: apiData.sellerType?.sellerTypeName || '-',
      companyAddress: apiData.address ? formatAddress(apiData.address) : '-',
      
      coordinatorName: apiData.coordinator?.name || '-',
      coordinatorDesignation: apiData.coordinator?.designation || '-',
      coordinatorEmail: apiData.coordinator?.email || '-',
      coordinatorMobile: apiData.coordinator?.mobile || '-',
      
      bankName: apiData.bankDetails?.bankName || '-',
      branch: apiData.bankDetails?.branch || '-',
      accountHolderName: apiData.bankDetails?.accountHolderName || '-',
      accountNumber: apiData.bankDetails?.accountNumber || '-',
      ifscCode: apiData.bankDetails?.ifscCode || '-',
      
      cancelledChequeFile: {
        name: apiData.bankDetails?.bankDocumentFileUrl?.split('/').pop() || 'cancelled-cheque.pdf'
      },
      
      productTypes: productTypeNames,
      licenses: licenses
    };
  };

  const formatAddress = (address: any): string => {
    if (!address) return '-';
    
    const parts = [
      address.buildingNo,
      address.street,
      address.landmark,
      address.city,
      address.district?.districtName,
      address.state?.stateName,
      address.pinCode
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ') || '-';
  };

  if (isLoading) {
    return (
      <div className="max-w-full mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold text-neutral-900">Profile</h1>
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 rounded-full bg-primary-200"></div>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-neutral-100 rounded-xl"></div>
          <div className="h-32 bg-neutral-100 rounded-xl"></div>
          <div className="h-64 bg-neutral-100 rounded-xl"></div>
          <div className="h-48 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-full mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold text-neutral-900">Profile</h1>
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="text-primary-600 w-8 h-8" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-900 text-white px-4 py-2 rounded-lg hover:bg-primary-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = profileData;

  return (
    <div className="max-w-full mx-auto flex flex-col gap-6">

      {/* PROFILE HEADER */}
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">
          Profile
        </h1>
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
          <Image
            src="/assets/images/sellerprofile.png"
            alt="User avatar"
            width={64}
            height={64}
            className="rounded-full w-full h-full object-cover"
          />
        </div>
      </div>

      {/* DISCLAIMER*/}
      <div className="bg-neutral-50 border border-warning-200 rounded-lg p-4 mb-2">
        <p className="text-warning-600 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Disclaimer:</span> Any changes made in the profile section will require admin approval.
        </p>
      </div>

      {/* COMPANY DETAILS */}
      <div>
        <Card title="Company Details">
          <DoubleRow
            label1="Company Name"
            value1={data.sellerName}
            label2="Company Type:"
            value2={data.companyType}
          />

          <DoubleRow
            label1="Company Phone no."
            value1={data.companyMobile}
            label2="Seller Type:"
            value2={data.sellerType}
          />

          <DoubleRow
            label1="Company email"
            value1={data.companyEmail}
            label2="Product Type(s):"
            value2={data.productTypes.join(", ")}
          />

          <DoubleRow
            label1="GST Number"
            value1={data.gstNumber}
            label2="Seller Type:"
            value2={data.sellerType}
          />

          <div className="border-t border-neutral-200 my-2"></div>

          <Row label="Company Address" value={data.companyAddress} />
        </Card>
      </div>

      {/* COORDINATOR DETAILS */}
      <Card title="Coordinator Details">
        <DoubleRow
          label1="Coordinator Name"
          value1={data.coordinatorName}
          label2="Phone Number"
          value2={data.coordinatorMobile}
        />

        <DoubleRow
          label1="Email"
          value1={data.coordinatorEmail}
          label2="Designation"
          value2={data.coordinatorDesignation}
        />
      </Card>

      {/* COMPLIANCE DOCUMENTS */}
      <div>
        <Card title="Compliance Documents">
          <LicenseRow
            productName="GST"
            licenseNumber={data.gstNumber}
            uploaded={true}
            onViewClick={() => openImageViewer('gst')}
          />

          {data.productTypes.map((product: string) => {
            const license = data.licenses[product];
            return license ? (
              <LicenseRow
                key={product}
                productName={product}
                licenseNumber={license.number}
                uploaded={true}
                onViewClick={() => openImageViewer('license', product)} 
              />
            ) : null;
          })}
        </Card>
      </div>

      {/* BANK DETAILS */}
      <div>
        <Card title="Bank Details">
          <div className="grid grid-cols-2 gap-y-4 gap-x-10">
            <Row label="Bank Name" value={data.bankName} />
            <Row label="Account Holder" value={data.accountHolderName} />

            <Row label="Branch Name" value={data.branch} />
            <Row label="IFSC Code" value={data.ifscCode} />

            <Row label="Account Number" value={data.accountNumber} />

            <FileRow
              name={data.cancelledChequeFile.name}
              uploaded={true}
              onViewClick={() => openImageViewer('cheque')}
            />
          </div>
        </Card>
      </div>

      {/* ADD MODAL */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage}
        title={modalTitle}
      />

    </div>
  );
};

export default SellerProfile;

/* ---------------- UPDATED LICENSE ROW COMPONENT ---------------- */
function LicenseRow({
  productName,
  licenseNumber,
  uploaded,
  onViewClick
}: {
  productName: string;
  licenseNumber: string;
  uploaded: boolean;
  onViewClick: () => void;
}) {
  return (
    <div className="grid grid-cols-[260px_1fr_160px] items-center w-full border-b border-neutral-200 py-2">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-neutral-700" />
        <span className="font-semibold text-neutral-900 whitespace-nowrap">
          {productName} License Number
        </span>
      </div>
      <span className="text-neutral-900 text-center">
        {licenseNumber}
      </span>
      <div className="flex items-center gap-4">
        <GoCheckCircleFill className="w-5 h-5 text-success-900" />
        <span>Uploaded</span>
        <button 
          onClick={onViewClick}
          className="text-primary-900 text-sm hover:underline"
        >
          View
        </button>
      </div>
    </div>
  );
}

/* ---------------- UPDATED FILE ROW COMPONENT ---------------- */
function FileRow({
  name,
  uploaded,
  onViewClick
}: {
  name: string;
  uploaded: boolean;
  onViewClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3 flex-1">
        <FileText className="w-5 h-5 text-neutral-700" />
        <span className="text-neutral-700 line-through">
          {name}
        </span>
      </div>
      {uploaded && (
        <button 
          onClick={onViewClick}
          className="text-primary-900 text-sm hover:underline"
        >
          View
        </button>
      )}
    </div>
  );
}

/* ---------------- CARD COMPONENT (unchanged) ---------------- */
function Card({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg text-neutral-900">
          {title}
        </h3>
        <button className="text-purple-600 text-sm flex items-center gap-1 font-medium">
          <Image
            src="/icons/EditIcon.png"
            alt="Edit"
            width={16}
            height={16}
          />
          Edit
        </button>
      </div>
      <div className="border-t border-neutral-200 mb-4"></div>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

/* ---------------- ROW COMPONENTS (unchanged) ---------------- */
function Row({
  label,
  value
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center text-md">
      <span className="text-neutral-900 font-semibold">
        {label}
      </span>
      <span className="text-neutral-900">
        {value || "-"}
      </span>
    </div>
  );
}

function DoubleRow({
  label1,
  value1,
  label2,
  value2
}: {
  label1: string;
  value1?: string;
  label2: string;
  value2?: string;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr_180px_1fr] items-center text-md gap-y-3">
      <span className="text-neutral-900 font-semibold">
        {label1}
      </span>
      <span className="text-neutral-900">
        {value1 || "-"}
      </span>
      <span className="text-neutral-900 font-semibold">
        {label2}
      </span>
      <span className="text-neutral-900">
        {value2 || "-"}
      </span>
    </div>
  );
}





















// "use client";

// import React, { useEffect, useState } from "react"; // ADD useState, useEffect
// import { FileText, User } from "lucide-react";
// import Image from "next/image";
// import { GoCheckCircleFill } from "react-icons/go";
// import { sellerProfileService } from "@/src/services/seller/sellerProfileService"; // ADD THIS IMPORT
// import { SellerProfile as SellerProfileType } from "@/src/types/seller/SellerProfileData"; // ADD THIS IMPORT
// import toast from "react-hot-toast"; // ADD for error handling

// const SellerProfile = () => {
//   // ADD STATE FOR REAL DATA
//   const [profileData, setProfileData] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   /* ---------------- FETCH REAL DATA ON COMPONENT MOUNT ---------------- */
//   useEffect(() => {
//     const loadProfileData = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
        
//         // Fetch real data from API
//         const data = await sellerProfileService.getCurrentSellerProfile();
        
//         // Transform API data to match your UI structure
//         const transformedData = transformApiDataToUI(data);
//         setProfileData(transformedData);
        
//         console.log('✅ Profile data loaded successfully');
//       } catch (err: any) {
//         console.error('❌ Failed to load profile:', err);
//         setError(err.message || 'Failed to load profile data');
//         toast.error('Failed to load profile data');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadProfileData();
//   }, []);

//   /* ---------------- TRANSFORM API DATA TO UI STRUCTURE ---------------- */
//   const transformApiDataToUI = (apiData: SellerProfileType) => {
//     // Get product type names
//     const productTypeNames = apiData.productTypes?.map(pt => pt.productTypeName) || [];
    
//     // Create licenses object from documents
//     const licenses: Record<string, { number: string; file: { name: string } }> = {};
    
//     apiData.documents?.forEach(doc => {
//       if (doc.productTypes?.productTypeName) {
//         const productName = doc.productTypes.productTypeName;
//         licenses[productName] = {
//           number: doc.documentNumber || '-',
//           file: {
//             name: doc.documentFileUrl?.split('/').pop() || 'document.pdf'
//           }
//         };
//       }
//     });

//     return {
//       // Company Details
//       sellerName: apiData.sellerName || '-',
//       companyMobile: apiData.phone || '-',
//       companyEmail: apiData.email || '-',
//       gstNumber: apiData.sellerGST?.gstNumber || '-',
//       companyType: apiData.companyType?.companyTypeName || '-',
//       sellerType: apiData.sellerType?.sellerTypeName || '-',
//       companyAddress: apiData.address ? formatAddress(apiData.address) : '-',
      
//       // Coordinator Details
//       coordinatorName: apiData.coordinator?.name || '-',
//       coordinatorDesignation: apiData.coordinator?.designation || '-',
//       coordinatorEmail: apiData.coordinator?.email || '-',
//       coordinatorMobile: apiData.coordinator?.mobile || '-',
      
//       // Bank Details
//       bankName: apiData.bankDetails?.bankName || '-',
//       branch: apiData.bankDetails?.branch || '-',
//       accountHolderName: apiData.bankDetails?.accountHolderName || '-',
//       accountNumber: apiData.bankDetails?.accountNumber || '-',
//       ifscCode: apiData.bankDetails?.ifscCode || '-',
      
//       // Files
//       cancelledChequeFile: {
//         name: apiData.bankDetails?.bankDocumentFileUrl?.split('/').pop() || 'cancelled-cheque.pdf'
//       },
      
//       // Product Types and Licenses
//       productTypes: productTypeNames,
//       licenses: licenses
//     };
//   };

//   /* ---------------- HELPER TO FORMAT ADDRESS ---------------- */
//   const formatAddress = (address: any): string => {
//     if (!address) return '-';
    
//     const parts = [
//       address.buildingNo,
//       address.street,
//       address.landmark,
//       address.city,
//       address.district?.districtName,
//       address.state?.stateName,
//       address.pinCode
//     ].filter(part => part && part.trim() !== '');
    
//     return parts.join(', ') || '-';
//   };

//   /* ---------------- LOADING STATE ---------------- */
//   if (isLoading) {
//     return (
//       <div className="max-w-full mx-auto flex flex-col gap-6">
//         <div className="flex items-center gap-4">
//           <h1 className="text-3xl font-semibold text-neutral-900">Profile</h1>
//           <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center animate-pulse">
//             <div className="w-24 h-24 rounded-full bg-primary-200"></div>
//           </div>
//         </div>
//         <div className="animate-pulse space-y-6">
//           <div className="h-48 bg-neutral-100 rounded-xl"></div>
//           <div className="h-32 bg-neutral-100 rounded-xl"></div>
//           <div className="h-64 bg-neutral-100 rounded-xl"></div>
//           <div className="h-48 bg-neutral-100 rounded-xl"></div>
//         </div>
//       </div>
//     );
//   }

//   /* ---------------- ERROR STATE ---------------- */
//   if (error || !profileData) {
//     return (
//       <div className="max-w-full mx-auto flex flex-col gap-6">
//         <div className="flex items-center gap-4">
//           <h1 className="text-3xl font-semibold text-neutral-900">Profile</h1>
//           <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
//             <User className="text-primary-600 w-8 h-8" />
//           </div>
//         </div>
//         <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
//           <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
//           <button 
//             onClick={() => window.location.reload()}
//             className="bg-primary-900 text-white px-4 py-2 rounded-lg hover:bg-primary-800"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Use profileData which now contains the transformed API data
//   const data = profileData;

//   return (
//     <div className="max-w-full mx-auto flex flex-col gap-6">

//       {/* PROFILE HEADER */}
//       <div className="flex items-center gap-4">
//         <h1 className="text-3xl font-semibold text-neutral-900">
//           Profile
//         </h1>
//         <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
//           <Image
//             src="/assets/images/sellerprofile.png"
//             alt="User avatar"
//             width={64}
//             height={64}
//             className="rounded-full w-full h-full object-cover"
//           />
//         </div>
//       </div>

//       {/* COMPANY DETAILS */}
//       <div>
//         <Card title="Company Details">
//           <DoubleRow
//             label1="Company Name"
//             value1={data.sellerName}
//             label2="Company Type:"
//             value2={data.companyType}
//           />

//           <DoubleRow
//             label1="Company Phone no."
//             value1={data.companyMobile}
//             label2="Seller Type:"
//             value2={data.sellerType}
//           />

//           <DoubleRow
//             label1="Company email"
//             value1={data.companyEmail}
//             label2="Product Type(s):"
//             value2={data.productTypes.join(", ")}
//           />

//           <DoubleRow
//             label1="GST Number"
//             value1={data.gstNumber}
//             label2="Seller Type:"
//             value2={data.sellerType}
//           />

//           <div className="border-t border-neutral-200 my-2"></div>

//           <Row label="Company Address" value={data.companyAddress} />
//         </Card>
//       </div>

//       {/* COORDINATOR DETAILS */}
//       <Card title="Coordinator Details">
//         <DoubleRow
//           label1="Coordinator Name"
//           value1={data.coordinatorName}
//           label2="Phone Number"
//           value2={data.coordinatorMobile}
//         />

//         <DoubleRow
//           label1="Email"
//           value1={data.coordinatorEmail}
//           label2="Designation"
//           value2={data.coordinatorDesignation}
//         />
//       </Card>

//       {/* COMPLIANCE DOCUMENTS */}
//       <div>
//         <Card title="Compliance Documents">
//           <LicenseRow
//             productName="GST"
//             licenseNumber={data.gstNumber}
//             uploaded={true}
//             file={{ name: 'gst-certificate.pdf' }}
//           />

//           {data.productTypes.map((product: string) => {
//             const license = data.licenses[product];
//             return license ? (
//               <LicenseRow
//                 key={product}
//                 productName={product}
//                 licenseNumber={license.number}
//                 uploaded={true}
//                 file={license.file}
//               />
//             ) : null;
//           })}
//         </Card>
//       </div>

//       {/* BANK DETAILS */}
//       <div>
//         <Card title="Bank Details">
//           <div className="grid grid-cols-2 gap-y-4 gap-x-10">
//             <Row label="Bank Name" value={data.bankName} />
//             <Row label="Account Holder" value={data.accountHolderName} />

//             <Row label="Branch Name" value={data.branch} />
//             <Row label="IFSC Code" value={data.ifscCode} />

//             <Row label="Account Number" value={data.accountNumber} />

//             <FileRow
//               name={data.cancelledChequeFile.name}
//               uploaded={true}
//             />
//           </div>
//         </Card>
//       </div>

//     </div>
//   );
// };

// export default SellerProfile;

// /* ---------------- ALL YOUR EXISTING COMPONENTS BELOW ---------------- */
// /* ---------------- NO CHANGES MADE TO ANY OF THESE ---------------- */

// function Card({
//   title,
//   children
// }: {
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">
//       <div className="flex justify-between items-center mb-3">
//         <h3 className="font-semibold text-lg text-neutral-900">
//           {title}
//         </h3>
//         <button className="text-purple-600 text-sm flex items-center gap-1 font-medium">
//           <Image
//             src="/icons/EditIcon.png"
//             alt="Edit"
//             width={16}
//             height={16}
//           />
//           Edit
//         </button>
//       </div>
//       <div className="border-t border-neutral-200 mb-4"></div>
//       <div className="flex flex-col gap-3">
//         {children}
//       </div>
//     </div>
//   );
// }

// function Row({
//   label,
//   value
// }: {
//   label: string;
//   value?: string;
// }) {
//   return (
//     <div className="grid grid-cols-[180px_1fr] items-center text-md">
//       <span className="text-neutral-900 font-semibold">
//         {label}
//       </span>
//       <span className="text-neutral-900">
//         {value || "-"}
//       </span>
//     </div>
//   );
// }

// function DoubleRow({
//   label1,
//   value1,
//   label2,
//   value2
// }: {
//   label1: string;
//   value1?: string;
//   label2: string;
//   value2?: string;
// }) {
//   return (
//     <div className="grid grid-cols-[180px_1fr_180px_1fr] items-center text-md gap-y-3">
//       <span className="text-neutral-900 font-semibold">
//         {label1}
//       </span>
//       <span className="text-neutral-900">
//         {value1 || "-"}
//       </span>
//       <span className="text-neutral-900 font-semibold">
//         {label2}
//       </span>
//       <span className="text-neutral-900">
//         {value2 || "-"}
//       </span>
//     </div>
//   );
// }

// function LicenseRow({
//   productName,
//   licenseNumber,
//   uploaded,
//   file
// }: {
//   productName: string;
//   licenseNumber: string;
//   uploaded: boolean;
//   file?: any;
// }) {
//   return (
//     <div className="grid grid-cols-[260px_1fr_160px] items-center w-full border-b border-neutral-200 py-2">
//       <div className="flex items-center gap-2">
//         <FileText className="w-5 h-5 text-neutral-700" />
//         <span className="font-semibold text-neutral-900 whitespace-nowrap">
//           {productName} License Number
//         </span>
//       </div>
//       <span className="text-neutral-900 text-center">
//         {licenseNumber}
//       </span>
//       <div className="flex items-center gap-4">
//         <GoCheckCircleFill className="w-5 h-5 text-success-900" />
//         <span>Uploaded</span>
//         <button className="text-primary-900 text-sm hover:underline">
//           View
//         </button>
//       </div>
//     </div>
//   );
// }

// function FileRow({
//   name,
//   uploaded
// }: {
//   name: string;
//   uploaded: boolean;
// }) {
//   return (
//     <div className="flex items-center justify-between text-sm">
//       <div className="flex items-center gap-3 flex-1">
//         <FileText className="w-5 h-5 text-neutral-700" />
//         <span className="text-neutral-700 line-through">
//           {name}
//         </span>
//       </div>
//       {uploaded && (
//         <button className="text-primary-900 text-sm hover:underline">
//           View
//         </button>
//       )}
//     </div>
//   );
// }




















// "use client";

// import React from "react";
// import { FileText, User } from "lucide-react";
// import Image from "next/image";
// import { GoCheckCircleFill } from "react-icons/go";

// const SellerProfile = () => {

//   /* ---------------- RAW DATA (Frontend only) ---------------- */

//   const data = {
//     sellerName: "ABC Pharma Pvt Ltd",
//     companyMobile: "9658214585",
//     companyEmail: "abc@gmail.com",
//     gstNumber: "29ABCDE1234F125",
//     companyType: "Private Limited",
//     sellerType: "Manufacturer",
//     companyAddress: "No. 602, 1st Floor, Unnati, 15th Cross, Outer Ring Rd, Jeewan Sathi Colony, 1st Phase, J. P. Nagar, Bengaluru, Karnataka 560078",

//     coordinatorName: "Rahul Sharma",
//     coordinatorDesignation: "Operations Manager",
//     coordinatorEmail: "rahul@abcpharma.com",
//     coordinatorMobile: "+91 9876543210",

//     bankName: "HDFC Bank",
//     branch: "JP Nagar",
//     accountHolderName: "ABC Pharma Pvt Ltd",
//     accountNumber: "123456789012121",
//     ifscCode: "HDFC00023345",

//     cancelledChequeFile: {
//       name: "cancelled-cheque.pdf"
//     },

//     productTypes: ["Drug", "Food", "Supply"] as const,

//     licenses: {
//       Drug: {
//         number: "29ABCDE1234F125",
//         file: { name: "drug-license.pdf" }
//       },
//       Food: {
//         number: "29ABCDE1234F125",
//         file: { name: "food-license.pdf" }
//       },
//       Supply: {
//         number: "29ABCDE1234F125",
//         file: { name: "supply-license.pdf" }
//       }
//     }
//   };

//   return (
//     <div className="max-w-full mx-auto flex flex-col gap-6">

//   {/* PROFILE HEADER */}

//   <div className="flex items-center gap-4">
//     <h1 className="text-3xl font-semibold text-neutral-900">
//       Profile
//     </h1>
//     <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
//       {/* <User className="text-primary-600 w-24 h-24" /> */}
//       <Image
//                         src="/assets/images/sellerprofile.png"
//                         alt="User avatar"
//                         width={24}
//                         height={24}
//                         className="rounded-full w-full h-full"
//                       />
//     </div>
//   </div>


//   {/* COMPANY DETAILS*/}

//   <div>

//     <Card title="Company Details">

//   <DoubleRow
//     label1="Company Name"
//     value1={data.sellerName}
//     label2="Company Type:"
//     value2={data.companyType}
//   />

//   <DoubleRow
//     label1="Company Phone no."
//     value1={data.companyMobile}
//     label2="Seller Type:"
//     value2={data.sellerType}
//   />

//   <DoubleRow
//     label1="Company email"
//     value1={data.companyEmail}
//     label2="Product Type(s):"
//     value2={data.productTypes.join(", ")}
//   />

//   <DoubleRow
//     label1="GST Number"
//     value1={data.gstNumber}
//     label2="Seller Type:"
//     value2={data.sellerType}
//   />

//   {/* <Row label="GST Number" value={data.gstNumber} /> */}

//   <div className="border-t border-neutral-200 my-2"></div>

//   <Row label="Company Address" value={data.companyAddress} />

// </Card>

//   </div>


//   {/* COORDINATOR DETAILS */}

//   <Card title="Coordinator Details">

//   <DoubleRow
//     label1="Coordinator Name"
//     value1={data.coordinatorName}
//     label2="Phone Number"
//     value2={data.coordinatorMobile}
//   />

//   <DoubleRow
//     label1="Email"
//     value1={data.coordinatorEmail}
//     label2="Designation"
//     value2={data.coordinatorDesignation}
//   />

// </Card>


//   {/* COMPLIANCE DOCUMENTS*/}

//   <div>

//     <Card title="Compliance Documents">

//       <LicenseRow
//         productName="GST"
//         licenseNumber={data.gstNumber}
//         uploaded={true}
//         file={data.cancelledChequeFile}
//       />

//       {data.productTypes.map((product) => {

//         const license = data.licenses[product];

//         return (
//           <LicenseRow
//             key={product}
//             productName={product}
//             licenseNumber={license.number}
//             uploaded={true}
//             file={license.file}
//           />
//         );

//       })}

//     </Card>

//   </div>


//   {/* BANK DETAILS */}

//   <div>

//     <Card title="Bank Details">

//       <div className="grid grid-cols-2 gap-y-4 gap-x-10">

//         <Row label="Bank Name" value={data.bankName} />
//         <Row label="Account Holder" value={data.accountHolderName} />

//         <Row label="Branch Name" value={data.branch} />
//         <Row label="IFSC Code" value={data.ifscCode} />

//         <Row label="Account Number" value={data.accountNumber} />

//         <FileRow
//           name={data.cancelledChequeFile.name}
//           uploaded={true}
//         />

//       </div>

//     </Card>

//   </div>

// </div>
//   );
// };

// export default SellerProfile;



// /* ---------------- CARD ---------------- */

// function Card({
//   title,
//   children
// }: {
//   title: string;
//   children: React.ReactNode;
// }) {

//   return (

//     <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">

//       <div className="flex justify-between items-center mb-3">

//         <h3 className="font-semibold text-lg text-neutral-900">
//           {title}
//         </h3>

//         <button className="text-purple-600 text-sm flex items-center gap-1 font-medium">

//           <Image
//             src="/icons/EditIcon.png"
//             alt="Edit"
//             width={16}
//             height={16}
//           />

//           Edit

//         </button>

//       </div>

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

//     <div className="grid grid-cols-[180px_1fr] items-center text-md">

//       <span className="text-neutral-900 font-semibold">
//         {label}
//       </span>

//       <span className="text-neutral-900">
//         {value || "-"}
//       </span>

//     </div>

//   );

// }

// function DoubleRow({
//   label1,
//   value1,
//   label2,
//   value2
// }: {
//   label1: string;
//   value1?: string;
//   label2: string;
//   value2?: string;
// }) {
//   return (
//     <div className="grid grid-cols-[180px_1fr_180px_1fr] items-center text-md gap-y-3">

//       <span className="text-neutral-900 font-semibold">
//         {label1}
//       </span>

//       <span className="text-neutral-900">
//         {value1 || "-"}
//       </span>

//       <span className="text-neutral-900 font-semibold">
//         {label2}
//       </span>

//       <span className="text-neutral-900">
//         {value2 || "-"}
//       </span>

//     </div>
//   );
// }



// /* ---------------- LICENSE ROW ---------------- */

// function LicenseRow({
//   productName,
//   licenseNumber,
//   uploaded,
//   file
// }: {
//   productName: string;
//   licenseNumber: string;
//   uploaded: boolean;
//   file?: any;
// }) {

//   return (

//     <div className="grid grid-cols-[260px_1fr_160px] items-center w-full border-b border-neutral-200 py-2">

//       <div className="flex items-center gap-2">

//         <FileText className="w-5 h-5 text-neutral-700" />

//         <span className="font-semibold text-neutral-900 whitespace-nowrap">
//           {productName} License Number
//         </span>

//       </div>

//       <span className="text-neutral-900 text-center">
//         {licenseNumber}
//       </span>

//       <div className="flex items-center gap-4">
//   <GoCheckCircleFill className="w-5 h-5 text-success-900" />
//   <span>Uploaded</span>

//   <button className="text-primary-900 text-sm hover:underline">
//     View
//   </button>
// </div>

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

//     <div className="flex items-center justify-between text-sm">

//       <div className="flex items-center gap-3 flex-1">

//         <FileText className="w-5 h-5 text-neutral-700" />

//         <span className="text-neutral-700 line-through">
//           {name}
//         </span>

//       </div>

//       {uploaded && (

//         <button className="text-primary-900 text-sm hover:underline">
//           View
//         </button>

//       )}

//     </div>

//   );

// }