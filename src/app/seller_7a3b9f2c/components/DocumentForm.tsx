"use client";

import React, { useState } from "react";
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

// Helper function to calculate license status based on dates
const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): string => {
  if (!issueDate || !expiryDate) {
    return "Pending";
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if expired
  if (expiryDate < today) {
    return "Expired";
  }
  
  // Check if active (not expired and issue date is valid)
  return "Active";
};

// Drug License Number validation function
const validateDrugLicenseNumber = (value: string): string | null => {
  const cleaned = value.trim().toUpperCase();
  
  if (!cleaned) {
    return "Drug License Number is required";
  }
  
  // Check length (minimum 8, maximum 30 characters)
  if (cleaned.length < 8) {
    return "Must be at least 8 characters";
  }
  
  if (cleaned.length > 30) {
    return "Cannot exceed 30 characters";
  }
  
  // Pattern validation for common Drug License formats
  const patterns = [
    /^[A-Z]{2}\/[A-Z]{3}\/\d{2}[A-Z]?-\d{3,10}$/,      // TN/CBE/20B-12345
    /^[A-Z]{2}-[A-Z0-9]{2,4}-\d{4,10}$/,                // MH-MZ2-123456
    /^[A-Z]{2}-\d{2,3}-\d{5,10}$/,                      // DL-123-234567
    /^\d{2}[A-Z]?-\d{3,10}$/,                           // 20B-12345
    /^\d{2}\/\d{2}-\d{3,10}$/,                          // 20/21-12345
    /^[A-Z]{2}\/\d{2}[A-Z]?-\d{3,10}$/,                 // MH/20B-12345
    /^[A-Z]{2}\/\d{2,3}\/\d{4,10}$/,                    // MH/27/123456
    /^[A-Z]{2}[A-Z0-9]{2,4}\d{4,10}$/,                  // TN20B12345
  ];
  
  const isValid = patterns.some(pattern => pattern.test(cleaned));
  
  if (!isValid) {
    return "Invalid format";
  }
  
  return null;
};

// Function to clean and format license number on input - BLOCKS invalid characters
const formatLicenseNumber = (value: string): string => {
  let cleaned = value.toUpperCase();
  // Allow only alphanumeric, hyphens, and slashes - BLOCK everything else
  cleaned = cleaned.replace(/[^A-Z0-9\/\-]/g, '');
  return cleaned;
};

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
  const [uploadingGST, setUploadingGST] = useState(false);
  const [uploadingLicenses, setUploadingLicenses] = useState<Record<string, boolean>>({});
  const [licenseErrors, setLicenseErrors] = useState<Record<string, string>>({});
  const [showExpiredError, setShowExpiredError] = useState(false);

  // Derive GST file name from formData
  const gstFileName = formData.gstFile?.name || "";

  const getLicenseInfo = (productName: string) => {
    const product = productTypes.find((p) => p.productTypeName === productName);
    const label = product?.regulatoryCategory
      ? `${product.regulatoryCategory} License`
      : `${productName} License`;

    return {
      label,
      placeholder: `e.g., TN/CBE/20B-12345`,
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
        // Just show visual error without alert
        const input = document.querySelector('input[name="gstNumber"]') as HTMLInputElement;
        if (input) {
          input.classList.add('border-red-500');
        }
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

  // Handle License Number change with validation - BLOCKS invalid input
  const handleLicenseNumberChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    let value = e.target.value;
    // Format and clean the input - removes invalid characters
    const cleanedValue = formatLicenseNumber(value);
    
    // If cleaning removed characters, don't update (blocks them)
    if (cleanedValue !== value) {
      return;
    }
    
    // Limit length to 30
    if (cleanedValue.length > 30) {
      return;
    }
    
    // Create synthetic event with cleaned value
    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: `licenseNumber-${productName}`, value: cleanedValue }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onLicenseNumberChange(syntheticEvent);
    
    // Validate the license number
    const error = validateDrugLicenseNumber(cleanedValue);
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
  };

  // Handle key down to block invalid keys
  const handleLicenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Allow only A-Z, 0-9, /, -
    const allowedChars = /^[A-Za-z0-9\/\-]$/;
    if (!allowedChars.test(e.key)) {
      e.preventDefault();
    }
  };

  // Handle license number blur for final validation
  const handleLicenseNumberBlur = (value: string, productName: string) => {
    const error = validateDrugLicenseNumber(value);
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
  };

  // Function to restrict input to letters, spaces, dots, commas, apostrophes, and hyphens
  const handleIssuingAuthorityInput = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    let value = e.target.value;
    // Allow only letters, spaces, dots, commas, apostrophes, and hyphens
    const filteredValue = value.replace(/[^a-zA-Z\s.,'-]/g, '');
    
    if (filteredValue !== value) {
      // Create a synthetic event with the filtered value
      const syntheticEvent = {
        ...e,
        target: { ...e.target, name: `issuingAuthority-${productName}`, value: filteredValue }
      } as React.ChangeEvent<HTMLInputElement>;
      onIssuingAuthorityChange(syntheticEvent);
    } else {
      onIssuingAuthorityChange(e);
    }
  };

  const handleGSTFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingGST(true);
      toast.info("Uploading GST certificate...");
      
      setTimeout(() => {
        onFileChange(e, 'gstFile');
        setUploadingGST(false);
        toast.success("GST certificate uploaded");
      }, 2000);
    }
  };

  const handleLicenseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingLicenses(prev => ({ ...prev, [productName]: true }));
      toast.info("Uploading license");
      
      setTimeout(() => {
        onFileChange(e, 'license', productName);
        setUploadingLicenses(prev => ({ ...prev, [productName]: false }));
        toast.success("license uploaded");
      }, 2000);
    }
  };

  // Get all expired licenses - Now using calculateLicenseStatus function
  const expiredProducts = formData.productTypes.filter((productName: string) => {
    const licenseData = formData.licenses[productName];
    const status = calculateLicenseStatus(licenseData?.issueDate || null, licenseData?.expiryDate || null);
    return status === "Expired";
  });

  // Handle continue button click with expired license check
  const handleContinue = () => {
    if (expiredProducts.length > 0) {
      setShowExpiredError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setShowExpiredError(false);
    nextStep();
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

      {/* EXPIRED LICENSE ERROR BANNER */}
      {showExpiredError && expiredProducts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
          <span className="text-red-500 text-xl mt-0.5">🚫</span>
          <div>
            <p className="text-red-700 font-semibold">
              Expired license{expiredProducts.length > 1 ? "s" : ""} detected — cannot proceed
            </p>
            <p className="text-red-600 text-sm mt-1">
              The following license{expiredProducts.length > 1 ? "s are" : " is"} expired. Please provide a valid, active license before continuing:
            </p>
            <ul className="mt-2 space-y-1">
              {expiredProducts.map((productName: string) => (
                <li key={productName} className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <span>•</span>
                  <span>{productName} License</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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

        // Derive license file name from formData
        const licenseFileName = licenseData.file?.name || "";
        const isUploading = uploadingLicenses[productName];
        const licenseError = licenseErrors[productName];
        
        // Calculate status and expiry based on actual dates
        const currentStatus = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
        const isExpired = currentStatus === "Expired" && (licenseData.issueDate || licenseData.expiryDate);

        return (
          <div key={productName} className="mb-2">
            {/* Expired warning per license */}
            {isExpired && (
              <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <span className="text-red-500 text-base">⚠️</span>
                <p className="text-red-600 text-sm font-medium">
                  {productName} License is expired. Please update with a valid license.
                </p>
              </div>
            )}

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
                    onChange={(e) => handleLicenseNumberChangeWithValidation(e, productName)}
                    onKeyDown={(e) => handleLicenseKeyDown(e, licenseData.number)}
                    onBlur={(e) => handleLicenseNumberBlur(e.target.value, productName)}
                    placeholder={licenseInfo.placeholder}
                    maxLength={30}
                    className={`w-full h-12 pl-10 pr-4 rounded-xl border focus:outline-none focus:border-[#4B0082] uppercase ${
                      licenseError ? 'border-red-500 bg-red-50' : 'border-neutral-300 bg-neutral-50'
                    }`}
                  />
                </div>
                {licenseError && (
                  <p className="mt-1 text-xs text-red-500 flex items-start">
                    <span className="mr-1">⚠️</span>
                    <span>{licenseError}</span>
                  </p>
                )}
                {/* <p className="mt-1 text-xs text-neutral-500">
                  Use: A-Z, 0-9, /, - only | Examples: TN/CBE/20B-12345, MH-MZ2-123456
                </p> */}
              </div>

              {/* LICENSE FILE */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-neutral-700">
                  {licenseInfo.fileLabel}
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div
                  className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-12 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition"
                  onClick={() => document.getElementById(`license-upload-${productName}`)?.click()}
                >
                  <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
                    <Image
                      src="/icons/upload.png"
                      alt="Upload"
                      width={20}
                      height={20}
                    />
                  </div>

                  <div className="flex-1 px-3 text-sm">
                    {isUploading ? (
                      <span className="text-neutral-500">Uploading...</span>
                    ) : licenseFileName ? (
                      <span className="text-neutral-900 font-medium truncate block">
                        {licenseFileName}
                      </span>
                    ) : (
                      <span className="text-neutral-400">Upload the Certificate</span>
                    )}
                  </div>

                  <input
                    id={`license-upload-${productName}`}
                    type="file"
                    name={`licenseFile-${productName}`}
                    onChange={(e) => handleLicenseFileUpload(e, productName)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={isUploading}
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
                    onChange={(e) => handleIssuingAuthorityInput(e, productName)}
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

                <div className={`h-12 px-4 rounded-xl flex items-center justify-between ${
                  currentStatus === "Expired" ? "bg-red-100 border border-red-300" : "bg-neutral-200"
                }`}>
                  <span className={`font-medium ${
                    currentStatus === "Expired" ? "text-red-600" : "text-neutral-700"
                  }`}>
                    {!licenseData.issueDate || !licenseData.expiryDate
                      ? "Pending"
                      : currentStatus}
                    {currentStatus === "Expired" && (
                      <span className="ml-2 text-xs font-normal text-red-500">— renewal required</span>
                    )}
                  </span>

                  <div
                    className={`w-10 h-6 rounded-full flex items-center px-1 transition
                    ${currentStatus === "Active"
                        ? "bg-purple-300"
                        : "bg-neutral-400"
                      }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transform transition
                      ${currentStatus === "Active"
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

          <div
            className="flex items-center border border-neutral-300 rounded-xl overflow-hidden h-12 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition"
            onClick={() => document.getElementById('gst-upload')?.click()}
          >
            <div className="w-12 h-full bg-[#DED0FE] flex items-center justify-center">
              <Image
                src="/icons/upload.png"
                alt="Upload"
                width={20}
                height={20}
              />
            </div>

            <div className="flex-1 px-3 text-sm">
              {uploadingGST ? (
                <span className="text-neutral-500">Uploading...</span>
              ) : gstFileName ? (
                <span className="text-neutral-900 font-medium truncate block">
                  {gstFileName}
                </span>
              ) : (
                <span className="text-neutral-400">Upload the Certificate</span>
              )}
            </div>

            <input
              id="gst-upload"
              type="file"
              name="gstFile"
              onChange={handleGSTFileUpload}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              disabled={uploadingGST}
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
        </div>

        <div className="flex gap-4">

          <button
            onClick={prevStep}
            className="flex h-12  px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-neutral-500 text-neutral-500 font-semibold hover:neutral-500 hover:text-neutral-500 transition"
          >
            <Image
              src="/icons/backbuttonicon.png"
              alt="Back"
              width={20}
              height={20}
            />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={expiredProducts.length > 0}
            className={`flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 font-semibold transition ${
              expiredProducts.length > 0
                ? "border-neutral-300 text-neutral-400 bg-neutral-100 cursor-not-allowed opacity-60"
                : "border-primary-900 text-primary-900 hover:border-primary-100"
            }`}
          >
            Continue
            <Image
              src="/icons/continueicon.png"
              alt="Continue"
              width={20}
              height={20}
            />
          </button>

        </div>
      </div>

    </div>
  );
}