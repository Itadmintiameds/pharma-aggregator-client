"use client";

import React, { useState, useRef, useEffect } from "react";
import { Building2, FileText } from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ProductTypeResponse } from "@/src/types/seller/SellerRegMasterData";
import { toast } from "react-toastify";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import { debounce } from "lodash";

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

// Function to check if date gap is more than 5 years
const isDateGapExceedingFiveYears = (issueDate: Date | null, expiryDate: Date | null): boolean => {
  if (!issueDate || !expiryDate) return false;
  
  const diffInYears = (expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return diffInYears > 5;
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

// ✅ Helper: intercept manual year typing in MUI DatePicker and block years < 2000.
// MUI DatePicker renders an <input> internally. When the user is in the "year" segment,
// we track the digits they type. As soon as 4 digits are collected we check if the
// resulting year is < 2000 and, if so, replace the segment value via execCommand so the
// picker sees "2000" instead.  We also keep a running buffer so we can block the entry
// the moment the 4th digit produces an invalid year.
const useDateYearGuard = () => {
  // We store a per-input digit buffer keyed by a ref so we don't re-render
  const bufferRef = useRef<string>("");

  const handleDateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectionStart = input.selectionStart ?? 0;
    const fullValue = input.value; // e.g. "DD/MM/YYYY" or "01/01/0000"

    // Only act on digit keys
    if (!/^\d$/.test(e.key)) {
      // Reset buffer on non-digit navigation
      if (!['ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        bufferRef.current = "";
      }
      return;
    }

    // Detect if the cursor is in the YEAR segment.
    // MUI DatePicker with format "dd/MM/yyyy" places year characters at indices 6,7,8,9
    const inYearSegment = selectionStart >= 6;

    if (!inYearSegment) {
      bufferRef.current = "";
      return;
    }

    // Accumulate digits for the year
    bufferRef.current = (bufferRef.current + e.key).slice(-4);

    // Once we have 4 digits, validate
    if (bufferRef.current.length === 4) {
      const typedYear = parseInt(bufferRef.current, 10);
      if (typedYear < 2000) {
        // Block the keystroke and clear buffer
        e.preventDefault();
        bufferRef.current = "";
        toast.error("Year must be 2000 or greater", { toastId: "year-guard" });
      } else {
        // Valid – reset buffer for next entry
        bufferRef.current = "";
      }
    }
  };

  // Called on change – if the picker has resolved to a date, validate year >= 2000
  const handleDateInputChange = (
    date: Date | null,
    productName: string,
    type: "issue" | "expiry",
    originalHandler: (date: Date | null, productName: string) => void,
    setDateErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) => {
    if (date && date.getFullYear() < 2000) {
      setDateErrors(prev => ({
        ...prev,
        [`${productName}_${type}`]: "Year must be 2000 or greater",
      }));
      // Do NOT propagate invalid date
      return;
    }
    originalHandler(date, productName);
  };

  return { handleDateInputKeyDown, handleDateInputChange };
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
  const [licenseExistsErrors, setLicenseExistsErrors] = useState<Record<string, string>>({});
  const [checkingLicense, setCheckingLicense] = useState<Record<string, boolean>>({});
  const [showExpiredError, setShowExpiredError] = useState(false);
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});
  
  // ==================== GST VALIDATION STATES ====================
  const [gstError, setGstError] = useState<string>("");
  const [gstExistsError, setGstExistsError] = useState<string>("");
  const [checkingGST, setCheckingGST] = useState(false);

  // Create a ref for debounced functions
  const debouncedCheckLicenseExists = useRef<Record<string, ReturnType<typeof debounce>>>({});
  // Create a ref for debounced GST check - FIXED: initialize with null
  const debouncedCheckGST = useRef<ReturnType<typeof debounce> | null>(null);

  // ✅ Year guard hook
  const { handleDateInputKeyDown, handleDateInputChange } = useDateYearGuard();

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

  // ==================== GST VALIDATION FUNCTIONS ====================
  
  // Function to check if GST number exists in the system
  const checkGSTExists = async (gstNumber: string) => {
    if (!gstNumber || gstNumber.length !== 15) {
      setGstExistsError("");
      return;
    }

    setCheckingGST(true);

    try {
      const exists = await sellerRegService.checkGSTNumber(gstNumber);

      if (exists) {
        setGstExistsError("This GST number already exists in the system");
        toast.error(`GST number ${gstNumber} already exists`, { 
          toastId: `gst-exists-${gstNumber}` 
        });
      } else {
        setGstExistsError("");
      }
    } catch (error: any) {
      console.error("Error checking GST:", error);
      setGstExistsError("");
    } finally {
      setCheckingGST(false);
    }
  };

  // Initialize debounced GST check
  useEffect(() => {
    if (!debouncedCheckGST.current) {
      debouncedCheckGST.current = debounce((gstNumber: string) => {
        checkGSTExists(gstNumber);
      }, 800);
    }

    return () => {
      debouncedCheckGST.current?.cancel();
    };
  }, []);

  const validateGSTFormat = (gstNumber: string) => {
    if (gstNumber.length === 15) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
      if (!gstRegex.test(gstNumber)) {
        const input = document.querySelector('input[name="gstNumber"]') as HTMLInputElement;
        if (input) {
          input.classList.add('border-red-500');
        }
      }
    }
  };

  // Updated GST change handler with existence check
  const handleGSTChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^0-9A-Z]/g, '');
    if (value.length > 15) value = value.slice(0, 15);

    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: 'gstNumber', value }
    } as React.ChangeEvent<HTMLInputElement>;

    onGSTChange(syntheticEvent);
    
    // Validate GST format
    if (value.length === 15) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
      if (!gstRegex.test(value)) {
        setGstError("Invalid GST number format");
        setGstExistsError("");
      } else {
        setGstError("");
        validateGSTFormat(value);
        // Check if GST exists (debounced)
        debouncedCheckGST.current?.(value);
      }
    } else if (value.length > 0 && value.length < 15) {
      setGstError("GST number must be 15 characters");
      setGstExistsError("");
    } else {
      setGstError("");
      setGstExistsError("");
    }
  };

  // Handle GST blur for final validation
  const handleGSTBlur = (value: string) => {
    if (value.length === 15) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
      if (gstRegex.test(value)) {
        checkGSTExists(value);
      }
    }
  };

  // ==================== LICENSE VALIDATION FUNCTIONS ====================
  
  // Function to check if license number exists
  const checkLicenseExists = async (licenseNumber: string, productName: string) => {
    if (!licenseNumber || licenseNumber.length < 8) {
      setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
      return;
    }

    // Don't check if there's already a format error
    if (licenseErrors[productName]) {
      return;
    }

    setCheckingLicense(prev => ({ ...prev, [productName]: true }));

    try {
      const exists = await sellerRegService.checkDocumentExists(
        "DRUG_LICENSE",
        licenseNumber
      );

      if (exists) {
        setLicenseExistsErrors(prev => ({ 
          ...prev, 
          [productName]: "This license number already exists in the system" 
        }));
        toast.error(`License number ${licenseNumber} already exists`, { 
          toastId: `license-exists-${licenseNumber}` 
        });
      } else {
        setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
      }
    } catch (error: any) {
      console.error("Error checking license:", error);
      // Don't show error to user for network issues, just log
    } finally {
      setCheckingLicense(prev => ({ ...prev, [productName]: false }));
    }
  };

  // Initialize debounced functions for each product
  useEffect(() => {
    formData.productTypes.forEach((productName: string) => {
      if (!debouncedCheckLicenseExists.current[productName]) {
        debouncedCheckLicenseExists.current[productName] = debounce(
          (licenseNumber: string) => checkLicenseExists(licenseNumber, productName),
          800
        );
      }
    });

    // Cleanup debounced functions
    return () => {
      Object.values(debouncedCheckLicenseExists.current).forEach(debounced => {
        debounced.cancel();
      });
    };
  }, [formData.productTypes]);

  // Enhanced issue date change handler with validation
  const handleIssueDateChangeWithValidation = (date: Date | null, productName: string) => {
    if (date) {
      // Validate year is >= 2000
      if (date.getFullYear() < 2000) {
        setDateErrors(prev => ({ 
          ...prev, 
          [`${productName}_issue`]: "Year must be 2000 or greater" 
        }));
        return;
      }
      
      // Validate date is not in future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        setDateErrors(prev => ({ 
          ...prev, 
          [`${productName}_issue`]: "Issue date cannot be in the future" 
        }));
        return;
      }
      
      // Clear error for this product
      setDateErrors(prev => ({ ...prev, [`${productName}_issue`]: "" }));
    } else {
      setDateErrors(prev => ({ ...prev, [`${productName}_issue`]: "" }));
    }
    
    onIssueDateChange(date, productName);
    
    // Validate gap if both dates exist
    const licenseData = formData.licenses[productName];
    const expiryDate = licenseData?.expiryDate || null;
    
    if (date && expiryDate && isDateGapExceedingFiveYears(date, expiryDate)) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_gap`]: "License validity cannot exceed 5 years" 
      }));
    } else {
      setDateErrors(prev => ({ ...prev, [`${productName}_gap`]: "" }));
    }
  };
  
  // Enhanced expiry date change handler with validation
  const handleExpiryDateChangeWithValidation = (date: Date | null, productName: string) => {
    if (date) {
      // Validate year is >= 2000
      if (date.getFullYear() < 2000) {
        setDateErrors(prev => ({ 
          ...prev, 
          [`${productName}_expiry`]: "Year must be 2000 or greater" 
        }));
        return;
      }
      
      // Clear error for this product
      setDateErrors(prev => ({ ...prev, [`${productName}_expiry`]: "" }));
    } else {
      setDateErrors(prev => ({ ...prev, [`${productName}_expiry`]: "" }));
    }
    
    onExpiryDateChange(date, productName);
    
    // Validate gap if both dates exist
    const licenseData = formData.licenses[productName];
    const issueDate = licenseData?.issueDate || null;
    
    if (issueDate && date && isDateGapExceedingFiveYears(issueDate, date)) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_gap`]: "License validity cannot exceed 5 years" 
      }));
    } else {
      setDateErrors(prev => ({ ...prev, [`${productName}_gap`]: "" }));
    }
  };

  // Handle License Number change with validation - BLOCKS invalid input
  const handleLicenseNumberChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    let value = e.target.value;
    const cleanedValue = formatLicenseNumber(value);
    
    if (cleanedValue !== value) {
      return;
    }
    
    if (cleanedValue.length > 30) {
      return;
    }
    
    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: `licenseNumber-${productName}`, value: cleanedValue }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onLicenseNumberChange(syntheticEvent);
    
    const error = validateDrugLicenseNumber(cleanedValue);
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
    
    // Clear existing existence error if format is invalid
    if (error) {
      setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
      return;
    }
    
    // Check if license exists (debounced)
    if (cleanedValue.length >= 8) {
      debouncedCheckLicenseExists.current[productName]?.(cleanedValue);
    } else {
      setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
    }
  };

  // Handle key down to block invalid keys
  const handleLicenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    const allowedChars = /^[A-Za-z0-9\/\-]$/;
    if (!allowedChars.test(e.key)) {
      e.preventDefault();
    }
  };

  // Handle license number blur for final validation
  const handleLicenseNumberBlur = (value: string, productName: string) => {
    const error = validateDrugLicenseNumber(value);
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
    
    // Also check on blur if not already checked and format is valid
    if (value.length >= 8 && !error) {
      checkLicenseExists(value, productName);
    }
  };

  // Function to restrict input to alphanumeric characters and spaces only
  const handleIssuingAuthorityInput = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    let value = e.target.value;
    // Allow only alphanumeric characters (letters A-Z a-z and numbers 0-9) and spaces
    const filteredValue = value.replace(/[^a-zA-Z0-9\s]/g, '');
    
    if (filteredValue !== value) {
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

  // Get all expired licenses
  const expiredProducts = formData.productTypes.filter((productName: string) => {
    const licenseData = formData.licenses[productName];
    const status = calculateLicenseStatus(licenseData?.issueDate || null, licenseData?.expiryDate || null);
    return status === "Expired";
  });

  // Get products with gap exceeding 5 years
  const invalidGapProducts = formData.productTypes.filter((productName: string) => {
    const licenseData = formData.licenses[productName];
    return isDateGapExceedingFiveYears(licenseData?.issueDate || null, licenseData?.expiryDate || null);
  });

  // Handle continue button click with expired license check
  const handleContinue = () => {
    // Check for expired licenses
    if (expiredProducts.length > 0) {
      setShowExpiredError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    // Check for gap errors
    if (invalidGapProducts.length > 0) {
      toast.error("Some licenses have validity period exceeding 5 years. Please correct them.");
      return;
    }
    
    // Check for any license existence errors
    const hasLicenseExistsErrors = Object.values(licenseExistsErrors).some(error => error !== "");
    if (hasLicenseExistsErrors) {
      toast.error("Please fix duplicate license numbers before continuing.");
      return;
    }
    
    // Check for GST existence error
    if (gstExistsError) {
      toast.error("Please fix duplicate GST number before continuing.");
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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

          const licenseFileName = licenseData.file?.name || "";
          const isUploading = uploadingLicenses[productName];
          const licenseError = licenseErrors[productName];
          const licenseExistsError = licenseExistsErrors[productName];
          const isCheckingLicense = checkingLicense[productName];
          const issueDateError = dateErrors[`${productName}_issue`];
          const expiryDateError = dateErrors[`${productName}_expiry`];
          const gapError = dateErrors[`${productName}_gap`];
          
          const currentStatus = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
          const isExpired = currentStatus === "Expired" && (licenseData.issueDate || licenseData.expiryDate);
          const hasGapError = !!gapError;

          // Determine status color
          const getStatusColor = () => {
            if (!licenseData.issueDate || !licenseData.expiryDate) return "bg-gray-100 text-gray-600";
            if (currentStatus === "Active") return "bg-green-100 text-green-700 border-green-200";
            if (currentStatus === "Expired") return "bg-red-100 text-red-700 border-red-200";
            return "bg-gray-100 text-gray-600";
          };

          const getStatusDotColor = () => {
            if (!licenseData.issueDate || !licenseData.expiryDate) return "bg-gray-400";
            if (currentStatus === "Active") return "bg-green-500";
            if (currentStatus === "Expired") return "bg-red-500";
            return "bg-gray-400";
          };

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
              
              {/* Gap warning per license */}
              {hasGapError && (
                <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <span className="text-red-500 text-base">⚠️</span>
                  <p className="text-red-600 text-sm font-medium">
                    {gapError}
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
                        licenseError || licenseExistsError ? 'border-red-500 bg-red-50' : 'border-neutral-300 bg-neutral-50'
                      }`}
                    />
                    {isCheckingLicense && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      </div>
                    )}
                  </div>
                  {licenseError && (
                    <p className="mt-1 text-xs text-red-500 flex items-start">
                      <span className="mr-1">⚠️</span>
                      <span>{licenseError}</span>
                    </p>
                  )}
                  {licenseExistsError && !licenseError && (
                    <p className="mt-1 text-xs text-red-500 flex items-start">
                      <span className="mr-1">⚠️</span>
                      <span>{licenseExistsError}</span>
                    </p>
                  )}
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

                  <div>
                    <DatePicker
                      value={licenseData.issueDate}
                      onChange={(date) =>
                        // ✅ Year guard: reject dates with year < 2000 before passing upstream
                        handleDateInputChange(
                          date,
                          productName,
                          "issue",
                          handleIssueDateChangeWithValidation,
                          setDateErrors
                        )
                      }
                      maxDate={new Date()}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          placeholder: "DD/MM/YYYY",
                          error: !!issueDateError,
                          // ✅ onKeyDown on the inner <input> blocks year < 2000 while typing
                          inputProps: {
                            onKeyDown: handleDateInputKeyDown,
                          },
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              height: '48px',
                              borderRadius: '12px',
                              backgroundColor: '#F5F5F5',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: issueDateError ? '#ef4444' : '#d1d5db',
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
                    {issueDateError && (
                      <p className="mt-1 text-xs text-red-500 flex items-start">
                        <span className="mr-1">⚠️</span>
                        <span>{issueDateError}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* EXPIRY DATE */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-neutral-700">
                    {licenseInfo.expiryDateLabel}
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <div>
                    <DatePicker
                      value={licenseData.expiryDate}
                      onChange={(date) =>
                        // ✅ Year guard: reject dates with year < 2000 before passing upstream
                        handleDateInputChange(
                          date,
                          productName,
                          "expiry",
                          handleExpiryDateChangeWithValidation,
                          setDateErrors
                        )
                      }
                      minDate={licenseData.issueDate || undefined}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          placeholder: "DD/MM/YYYY",
                          error: !!expiryDateError,
                          // ✅ onKeyDown on the inner <input> blocks year < 2000 while typing
                          inputProps: {
                            onKeyDown: handleDateInputKeyDown,
                          },
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              height: '48px',
                              borderRadius: '12px',
                              backgroundColor: '#F5F5F5',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: expiryDateError ? '#ef4444' : '#d1d5db',
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
                    {expiryDateError && (
                      <p className="mt-1 text-xs text-red-500 flex items-start">
                        <span className="mr-1">⚠️</span>
                        <span>{expiryDateError}</span>
                      </p>
                    )}
                  </div>
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
                      maxLength={150}
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-300 bg-neutral-50 focus:outline-none focus:border-[#4B0082]"
                    />
                  </div>
                </div>

                {/* LICENSE STATUS - Without toggle button */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-neutral-700">
                    {licenseInfo.statusLabel}
                  </label>

                  <div className={`h-12 px-4 rounded-xl flex items-center border ${getStatusColor()}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor()} mr-2`}></div>
                    <span className="font-medium">
                      {!licenseData.issueDate || !licenseData.expiryDate
                        ? "Pending"
                        : currentStatus}
                      {currentStatus === "Expired" && (
                        <span className="ml-2 text-xs font-normal text-red-500">— renewal required</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* GST SECTION - UPDATED WITH EXISTENCE CHECK */}
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
                onBlur={(e) => handleGSTBlur(e.target.value)}
                placeholder="Enter GST number"
                maxLength={15}
                className={`w-full h-12 pl-10 pr-4 rounded-xl border focus:outline-none focus:border-[#4B0082] uppercase ${
                  gstError || gstExistsError ? 'border-red-500 bg-red-50' : 'border-neutral-300 bg-neutral-50'
                }`}
              />
              {checkingGST && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
            {gstError && (
              <p className="mt-1 text-xs text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{gstError}</span>
              </p>
            )}
            {gstExistsError && !gstError && (
              <p className="mt-1 text-xs text-red-500 flex items-start">
                <span className="mr-1">⚠️</span>
                <span>{gstExistsError}</span>
              </p>
            )}
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
              disabled={expiredProducts.length > 0 || invalidGapProducts.length > 0 || Object.values(licenseExistsErrors).some(error => error !== "") || !!gstExistsError}
              className={`flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 font-semibold transition ${
                expiredProducts.length > 0 || invalidGapProducts.length > 0 || Object.values(licenseExistsErrors).some(error => error !== "") || !!gstExistsError
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
    </LocalizationProvider>
  );
}