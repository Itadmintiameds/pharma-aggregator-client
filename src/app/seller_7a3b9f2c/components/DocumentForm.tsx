"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ProductTypeResponse } from "@/src/types/seller/SellerRegMasterData";
import { toast } from "react-toastify";
import Image from "next/image";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import { debounce } from "lodash";
import LicenseWarning from "./LicenseWarning";
import { classifySellerType, requiredAgreementCodes, mandatoryExtraDocumentCodes, optionalExtraDocumentCodes, documentTypeLabel, type SellerTypeCategory } from "@/src/schema/seller/sellerRegSchema";
import { isRealFileUrl } from "@/src/utils/sellerRegFiles";
import UploadedFileChip from "./UploadedFileChip";
import FormInput from "./FormInput";

interface Props {
  formData: any;
  productTypes: ProductTypeResponse[];
  onGSTChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string, productName?: string) => void;
  onIssueDateChange: (date: Date | null, productName: string) => void;
  onExpiryDateChange: (date: Date | null, productName: string) => void;
  onLicenseNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIssuingAuthorityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearLicenseNumber?: (productName: string) => void;
  onAgreementNumberChange: (code: string, value: string) => void;
  onAgreementFileChange: (code: string, file: File | null) => void;
  onAgreementIssueDateChange: (date: Date | null, code: string) => void;
  onAgreementExpiryDateChange: (date: Date | null, code: string) => void;
  onDeleteGstFile: () => void;
  onDeleteLicenseFile: (productName: string) => void;
  onDeleteAgreementFile: (code: string) => void;
  prevStep: () => void;
  nextStep: () => void;
}

// Human-readable labels for seller-type-driven agreement document codes.
// Single source of truth for document-type labels lives in sellerRegSchema.ts
// (documentTypeLabel) so the frontend schema, this form, and SellerRegister's
// submit payload all describe the same code the same way.
const getAgreementLabel = (code: string): string => documentTypeLabel(code);

// MUI's DatePicker can't take Tailwind classes, so its look has to be
// hand-matched to FormInput.tsx's default ("lg") field instead of drifting
// per call site. This is the one place that mapping lives - every DatePicker
// on this page should use it so date fields are indistinguishable from the
// text fields around them. #737373/#f5f5f5 mirror Tailwind's built-in
// neutral-500/neutral-100 (the "neutral" palette FormInput's default border
// uses is never overridden in global.css, so it's Tailwind's stock color,
// not one of this app's custom --pneutral-* tokens); #ef4444 mirrors
// Tailwind's stock red-500 (FormInput's `border-red-500` error state). The
// focus color intentionally *does* use a custom token (var(--secondary-500))
// since FormInput's focus ring is themed, not a Tailwind default.
const dateFieldSx = (hasError: boolean, disabled?: boolean) => ({
  "& .MuiOutlinedInput-root": {
    height: "52px",
    borderRadius: "12px",
    backgroundColor: disabled ? "#f5f5f5" : "#ffffff",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: hasError ? "#ef4444" : "#737373",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: hasError ? "#ef4444" : "#737373",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: hasError ? "#ef4444" : "var(--secondary-500)",
      borderWidth: "2px",
    },
    "&.Mui-focused": {
      boxShadow: hasError ? "none" : "0 0 0 2px var(--secondary-200)",
    },
  },
  "& .MuiInputBase-input": {
    padding: "0 14px",
    fontSize: "16px",
    fontFamily: "var(--font-body)",
    fontWeight: 400,
    color: disabled ? "var(--pneutral-500)" : "var(--pneutral-900)",
    "&::placeholder": {
      fontSize: "16px",
      fontFamily: "var(--font-body)",
      fontWeight: 400,
      color: "var(--pneutral-500)",
      opacity: 1,
    },
  },
  "& .Mui-disabled": {
    WebkitTextFillColor: "var(--pneutral-500) !important",
  },
  "& .clearButton": {
    opacity: "1 !important",
  },
});

// Helper function to calculate license status based on dates
const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): string => {
  if (!issueDate || !expiryDate) {
    return "Pending";
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (expiryDate < today) {
    return "Expired";
  }
  
  return "Active";
};

// Function to check if date gap is more than 5 years
const isDateGapExceedingFiveYears = (issueDate: Date | null, expiryDate: Date | null): boolean => {
  if (!issueDate || !expiryDate) return false;
  
  const diffInYears = (expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return diffInYears > 5;
};

// Function to get max expiry date (issue date + 5 years)
const getMaxExpiryDate = (issueDate: Date | null): Date | null => {
  if (!issueDate) return null;
  const maxDate = new Date(issueDate);
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  return maxDate;
};

// Function to get min issue date (5 years ago from today + 1 day, exclusive)
const getMinIssueDate = (): Date => {
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 5);
  minDate.setDate(minDate.getDate() + 1); // Add 1 day to make it exclusive
  minDate.setHours(0, 0, 0, 0);
  return minDate;
};

// Function to get max issue date (today)
const getMaxIssueDate = (): Date => {
  const maxDate = new Date();
  maxDate.setHours(0, 0, 0, 0);
  return maxDate;
};

// License number format category, per the regulatory format table (Drugs,
// Supplements/Nutraceuticals FSSAI, Food & Infant FSSAI, Cosmetic, Medical
// Devices). Supplements and Food/Infant share the same FSSAI 14-digit rule.
type LicenseValidationCategory = "DRUG" | "FSSAI" | "COSMETIC" | "MEDICAL_DEVICE" | "OTHER";

const getLicenseValidationCategory = (productName: string): LicenseValidationCategory => {
  const name = productName.toLowerCase();
  if (name.includes("drug")) return "DRUG";
  if (name.includes("cosmetic")) return "COSMETIC";
  if (name.includes("medical device")) return "MEDICAL_DEVICE";
  if (name.includes("food") || name.includes("supplement") || name.includes("nutraceutical") || name.includes("nutrition")) return "FSSAI";
  return "OTHER";
};

const LICENSE_MAX_LENGTH: Record<LicenseValidationCategory, number> = {
  DRUG: 30,
  FSSAI: 30,
  COSMETIC: 30,
  MEDICAL_DEVICE: 30,
  OTHER: 30,
};

// License Number validation function, format rules keyed off product category
const validateLicenseNumber = (value: string, licenseName: string, category: LicenseValidationCategory): string | null => {
  const cleaned = value.trim().toUpperCase();

  if (!cleaned) {
    return `${licenseName} Number is required`;
  }

  switch (category) {
    case "FSSAI": {
      if (!/^\d+$/.test(cleaned)) {
        return `${licenseName} Number must contain digits only`;
      }
      if (cleaned.length !== 14) {
        return `${licenseName} Number must be exactly 14 digits`;
      }
      return null;
    }
    case "DRUG": {
      if (cleaned.length < 10) {
        return `${licenseName} Number must be at least 10 characters`;
      }
      if (cleaned.length > 30) {
        return `${licenseName} Number cannot exceed 30 characters`;
      }
      if (!/^[A-Z0-9\/\-]+$/.test(cleaned)) {
        return `${licenseName} Number can only contain letters, numbers, "/" and "-"`;
      }
      return null;
    }
    case "COSMETIC": {
      if (cleaned.length < 10) {
        return `${licenseName} Number must be at least 10 characters`;
      }
      if (cleaned.length > 30) {
        return `${licenseName} Number cannot exceed 30 characters`;
      }
      if (!/^[A-Z0-9\-]+$/.test(cleaned)) {
        return `${licenseName} Number can only contain letters, numbers and "-"`;
      }
      return null;
    }
    case "MEDICAL_DEVICE": {
      if (cleaned.length < 10) {
        return `${licenseName} Number must be at least 10 characters`;
      }
      if (cleaned.length > 30) {
        return `${licenseName} Number cannot exceed 30 characters`;
      }
      if (!/^[A-Z0-9\/\-]+$/.test(cleaned)) {
        return `${licenseName} Number can only contain letters, numbers, "/" and "-"`;
      }
      return null;
    }
    default: {
      if (cleaned.length < 10) {
        return `${licenseName} Number must be at least 10 characters`;
      }
      if (cleaned.length > 30) {
        return `${licenseName} Number cannot exceed 30 characters`;
      }

      const patterns = [
        /^[A-Z]{2}\/[A-Z]{3}\/\d{2}[A-Z]?-\d{3,10}$/,
        /^[A-Z]{2}-[A-Z0-9]{2,4}-\d{4,10}$/,
        /^[A-Z]{2}-\d{2,3}-\d{5,10}$/,
        /^\d{2}[A-Z]?-\d{3,10}$/,
        /^\d{2}\/\d{2}-\d{3,10}$/,
        /^[A-Z]{2}\/\d{2}[A-Z]?-\d{3,10}$/,
        /^[A-Z]{2}\/\d{2,3}\/\d{4,10}$/,
        /^[A-Z]{2}[A-Z0-9]{2,4}\d{4,10}$/,
      ];

      const isValid = patterns.some(pattern => pattern.test(cleaned));

      if (!isValid) {
        return `Invalid ${licenseName} Number format`;
      }
      return null;
    }
  }
};

// Import Licence agreement codes that carry a real regulatory license number
// format (same rules as the mandatory per-product licenses above). Other
// agreement codes (e.g. distributorship agreement number, IEC Certificate)
// have no standardized format, so they stay free text.
const AGREEMENT_LICENSE_CATEGORY: Record<string, LicenseValidationCategory> = {
  DRUG_IMPORT_LICENCE: "DRUG",
  FSSAI_IMPORT_LICENCE: "FSSAI",
  COSMETIC_IMPORT_LICENCE: "COSMETIC",
  MEDICAL_DEVICE_IMPORT_LICENCE: "MEDICAL_DEVICE",
};

const formatLicenseNumber = (value: string, category: LicenseValidationCategory): string => {
  let cleaned = value.toUpperCase();
  if (category === "FSSAI") {
    cleaned = cleaned.replace(/[^0-9]/g, '');
  } else if (category === "COSMETIC") {
    cleaned = cleaned.replace(/[^A-Z0-9\-]/g, '');
  } else {
    cleaned = cleaned.replace(/[^A-Z0-9\/\-]/g, '');
  }
  return cleaned;
};

const useDateYearGuard = () => {
  const bufferRef = useRef<string>("");

  const handleDateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectionStart = input.selectionStart ?? 0;

    if (!/^\d$/.test(e.key)) {
      if (!['ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        bufferRef.current = "";
      }
      return;
    }

    const inYearSegment = selectionStart >= 6;

    if (!inYearSegment) {
      bufferRef.current = "";
      return;
    }

    bufferRef.current = (bufferRef.current + e.key).slice(-4);

    if (bufferRef.current.length === 4) {
      const typedYear = parseInt(bufferRef.current, 10);
      if (typedYear < 2000) {
        e.preventDefault();
        bufferRef.current = "";
        toast.error("Year must be 2000 or greater", { toastId: "year-guard" });
      } else {
        bufferRef.current = "";
      }
    }
  };

  return { handleDateInputKeyDown };
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
  onClearLicenseNumber,
  onAgreementNumberChange,
  onAgreementFileChange,
  onAgreementIssueDateChange,
  onAgreementExpiryDateChange,
  onDeleteGstFile,
  onDeleteLicenseFile,
  onDeleteAgreementFile,
  prevStep,
  nextStep,
}: Props) {

  const [uploadingGST, setUploadingGST] = useState(false);
  const [uploadingLicenses, setUploadingLicenses] = useState<Record<string, boolean>>({});
  const [uploadingAgreements, setUploadingAgreements] = useState<Record<string, boolean>>({});
  const [licenseErrors, setLicenseErrors] = useState<Record<string, string>>({});
  const [licenseExistsErrors, setLicenseExistsErrors] = useState<Record<string, string>>({});
  const [checkingLicense, setCheckingLicense] = useState<Record<string, boolean>>({});
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});
  const [agreementErrors, setAgreementErrors] = useState<Record<string, string>>({});
  const [warningState, setWarningState] = useState<{
    isOpen: boolean;
    licenseNumber: string;
    existingProductNames: string[];
    newProductName: string;
    pendingProductName: string;
    pendingLicenseNumber: string;
  } | null>(null);
  
  // Inline feedback for a rejected keystroke on the per-product Issuing
  // Authority field - shown until the next valid keystroke or blur, keyed by
  // productName the same way licenseErrors already is.
  const [issuingAuthorityFormatErrors, setIssuingAuthorityFormatErrors] = useState<Record<string, string>>({});

  const [gstError, setGstError] = useState<string>("");
  const [gstExistsError, setGstExistsError] = useState<string>("");
  const [gstFileError, setGstFileError] = useState<string>("");
  const [checkingGST, setCheckingGST] = useState(false);

  const debouncedCheckLicenseExists = useRef<Record<string, ReturnType<typeof debounce>>>({});
  const debouncedCheckGST = useRef<ReturnType<typeof debounce> | null>(null);

  const { handleDateInputKeyDown } = useDateYearGuard();

  const gstFileName = formData.gstFile?.name || "";

  // Seller-level agreement documents required for this seller's type
  // (Manufacturer requires none). Reuses formData.sellerType (already
  // tracked seller type display name) rather than a new prop.
  const sellerCategory = classifySellerType(formData.sellerType);
  const agreementCodes = requiredAgreementCodes(sellerCategory);
  // Additional mandatory compliance docs beyond the agreement codes above
  // (Manufacturer's GMP/WHO-GMP Certificate, White Labeling's Trademark
  // Certificate). Rendered together with agreementCodes as one required set.
  const mandatoryExtraCodes = mandatoryExtraDocumentCodes(sellerCategory);
  const requiredDocumentCodes = [...agreementCodes, ...mandatoryExtraCodes];
  // Documents a seller MAY attach but is never required to (Import Licences,
  // IEC Certificate, and type-specific optionals like Trademark Certificate
  // for Manufacturer/Distributor or Distribution Agreement for White Labeling).
  const optionalDocumentCodes = optionalExtraDocumentCodes(sellerCategory, formData.productTypes);

  // Names the mandatory per-product-category licence per the requirement spec:
  // Manufacturer needs a *Manufacturing* Licence, everyone else needs a
  // *Wholesale*/*Trade*/*Marketing* Licence for the same product category.
  // regulatory_category is empty for every seeded product today, so this
  // previously fell back to the bare product name (e.g. "Drugs License Number"),
  // which is genuinely ambiguous with the separate, optional "Drug Import
  // Licence" field — this naming makes clear which one it is.
  const getLicenseName = (productName: string, category: SellerTypeCategory): string => {
    const name = productName.toLowerCase();
    const isManufacturer = category === "MANUFACTURER";

    if (name.includes("drug")) {
      return isManufacturer ? "Drug Manufacturing Licence" : "Wholesale Drug Licence (20B/21B)";
    }
    if (name.includes("cosmetic")) {
      if (isManufacturer) return "Cosmetic Manufacturing Licence";
      if (category === "WHITE_LABELING") return "Cosmetic Marketing Licence";
      return "Cosmetic Wholesale Licence";
    }
    if (name.includes("medical device")) {
      return isManufacturer ? "Medical Device Manufacturing Licence" : "Medical Device Wholesale Licence (MD-42)";
    }
    if (name.includes("food") || name.includes("supplement") || name.includes("nutraceutical") || name.includes("nutrition")) {
      if (isManufacturer) return "FSSAI Manufacturing Licence";
      if (category === "WHITE_LABELING") return "FSSAI Trade / Marketing Licence";
      return "FSSAI Trade Licence";
    }
    return productName;
  };

  const LICENSE_PLACEHOLDER: Record<LicenseValidationCategory, string> = {
    DRUG: "e.g., KA-BLR-20B-123456",
    FSSAI: "e.g., 11223344556677",
    COSMETIC: "e.g., COS-KA-2026-12345",
    MEDICAL_DEVICE: "e.g., MD-KA-2026-123456",
    OTHER: "e.g., TN/CBE/20B-12345",
  };

  const getLicenseInfo = (productName: string) => {
    const category = classifySellerType(formData.sellerType);
    const licenseName = getLicenseName(productName, category);
    const validationCategory = getLicenseValidationCategory(productName);

    return {
      licenseName,
      validationCategory,
      maxLength: LICENSE_MAX_LENGTH[validationCategory],
      placeholder: LICENSE_PLACEHOLDER[validationCategory],
      numberLabel: `${licenseName} Number`,
      fileLabel: `${licenseName} Copy Upload`,
      issueDateLabel: `${licenseName} Issue Date`,
      expiryDateLabel: `${licenseName} Expiry Date`,
      authorityLabel: `${licenseName} Issuing Authority`,
      statusLabel: `${licenseName} Status`,
    };
  };

  // Check for duplicate license numbers within the same form and show warning
  const checkDuplicateLicenseWithWarning = (licenseNumber: string, currentProductName: string): boolean => {
    if (!licenseNumber || licenseNumber.length < 8) return false;
    
    const duplicateProductNames: string[] = [];
    
    for (const productName of formData.productTypes) {
      if (productName !== currentProductName) {
        const otherLicense = formData.licenses[productName];
        if (otherLicense?.number && otherLicense.number.toUpperCase() === licenseNumber.toUpperCase()) {
          duplicateProductNames.push(productName);
        }
      }
    }
    
    if (duplicateProductNames.length > 0) {
      // Clear any existing database error for this product before showing warning
      setLicenseExistsErrors(prev => ({ ...prev, [currentProductName]: "" }));
      
      // Show warning popup with all duplicate product names
      setWarningState({
        isOpen: true,
        licenseNumber: licenseNumber,
        existingProductNames: duplicateProductNames,
        newProductName: currentProductName,
        pendingProductName: currentProductName,
        pendingLicenseNumber: licenseNumber,
      });
      return true; // Duplicate found
    }
    
    return false;
  };

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

  const handleGSTChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^0-9A-Z]/g, '');
    if (value.length > 15) value = value.slice(0, 15);

    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: 'gstNumber', value }
    } as React.ChangeEvent<HTMLInputElement>;

    onGSTChange(syntheticEvent);
    
    // Clear errors first
    setGstError("");
    setGstExistsError("");
    
    if (value.length === 15) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
      if (!gstRegex.test(value)) {
        setGstError("Invalid GST number format");
      } else {
        debouncedCheckGST.current?.(value);
      }
    } else if (value.length > 0 && value.length < 15) {
      setGstError("GST number must be 15 characters");
    }
  };

  const handleGSTBlur = (value: string) => {
    if (value.length === 15) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
      if (gstRegex.test(value)) {
        checkGSTExists(value);
      }
    }
    // Hide the transient "must be 15 characters"/"invalid format" message once
    // focus leaves - gstExistsError (a real duplicate-GST conflict, checked
    // above) is left alone, same as the coordinator email/phone exists-checks.
    setGstError("");
  };

  const checkLicenseExists = async (licenseNumber: string, productName: string, licenseName: string) => {
    if (!licenseNumber || licenseNumber.length < 8) {
      setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
      return;
    }

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
          [productName]: `This ${licenseName} license number already exists in the system` 
        }));
        toast.error(`${licenseName} license number ${licenseNumber} already exists`, { 
          toastId: `license-exists-${licenseNumber}` 
        });
      } else {
        setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
      }
    } catch (error: any) {
      console.error("Error checking license:", error);
    } finally {
      setCheckingLicense(prev => ({ ...prev, [productName]: false }));
    }
  };

  useEffect(() => {
    formData.productTypes.forEach((productName: string) => {
      const licenseInfo = getLicenseInfo(productName);
      if (!debouncedCheckLicenseExists.current[productName]) {
        debouncedCheckLicenseExists.current[productName] = debounce(
          (licenseNumber: string) => checkLicenseExists(licenseNumber, productName, licenseInfo.licenseName),
          800
        );
      }
    });

    return () => {
      Object.values(debouncedCheckLicenseExists.current).forEach(debounced => {
        debounced.cancel();
      });
    };
  }, [formData.productTypes, productTypes]);

  const handleIssueDateChangeWithValidation = (date: Date | null, productName: string) => {
    // Clear existing errors for this product's issue date and gap
    setDateErrors(prev => ({ 
      ...prev, 
      [`${productName}_issue`]: "",
      [`${productName}_gap`]: "" 
    }));
    
    if (!date) {
      onIssueDateChange(null, productName);
      return;
    }
    
    // Check year 2000 validation first
    if (date.getFullYear() < 2000) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_issue`]: "Year must be 2000 or greater" 
      }));
      return;
    }
    
    // Check 5-year lookback validation (exclusive)
    const minIssueDate = getMinIssueDate();
    if (date < minIssueDate) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_issue`]: `Issue date cannot be older than ${minIssueDate.toLocaleDateString('en-GB')}` 
      }));
      return;
    }
    
    // Check future date validation
    const today = getMaxIssueDate();
    if (date > today) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_issue`]: "Issue date cannot be in the future" 
      }));
      return;
    }
    
    // Get current expiry date
    const licenseData = formData.licenses[productName];
    const currentExpiryDate = licenseData?.expiryDate || null;
    
    // If expiry date exists and exceeds 5 years from new issue date, clear it
    if (currentExpiryDate && isDateGapExceedingFiveYears(date, currentExpiryDate)) {
      onExpiryDateChange(null, productName);
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_gap`]: "License validity cannot exceed 5 years." 
      }));
    }
    
    onIssueDateChange(date, productName);
  };
  
  const handleExpiryDateChangeWithValidation = (date: Date | null, productName: string) => {
    // Clear existing expiry date errors
    setDateErrors(prev => ({ 
      ...prev, 
      [`${productName}_expiry`]: "",
      [`${productName}_gap`]: "" 
    }));
    
    const licenseData = formData.licenses[productName];
    const issueDate = licenseData?.issueDate || null;
    
    if (!date) {
      onExpiryDateChange(null, productName);
      return;
    }
    
    // Must have issue date first
    if (!issueDate) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_expiry`]: "Please select issue date first" 
      }));
      return;
    }
    
    // Check year 2000 validation
    if (date.getFullYear() < 2000) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_expiry`]: "Year must be 2000 or greater" 
      }));
      return;
    }
    
    // Check if expiry date is before issue date
    if (date < issueDate) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_expiry`]: "Expiry date cannot be before issue date" 
      }));
      return;
    }
    
    // Check 5-year gap validation
    if (isDateGapExceedingFiveYears(issueDate, date)) {
      setDateErrors(prev => ({ 
        ...prev, 
        [`${productName}_gap`]: "License validity cannot exceed 5 years" 
      }));
      return;
    }
    
    onExpiryDateChange(date, productName);
  };

  const handleLicenseNumberChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    let value = e.target.value;
    const licenseInfo = getLicenseInfo(productName);
    const cleanedValue = formatLicenseNumber(value, licenseInfo.validationCategory);

    if (cleanedValue !== value) {
      setLicenseErrors(prev => ({ ...prev, [productName]: "Invalid character in license number" }));
      return;
    }

    if (cleanedValue.length > licenseInfo.maxLength) {
      setLicenseErrors(prev => ({ ...prev, [productName]: "License number exceeds maximum length" }));
      return;
    }

    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: `licenseNumber-${productName}`, value: cleanedValue }
    } as React.ChangeEvent<HTMLInputElement>;

    onLicenseNumberChange(syntheticEvent);

    const error = validateLicenseNumber(cleanedValue, licenseInfo.licenseName, licenseInfo.validationCategory);
    
    // Clear existing errors first
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
    
    if (error) {
      setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
      return;
    }
    
    // Clear duplicate warning state if it exists for this product
    if (warningState?.pendingProductName === productName) {
      setWarningState(null);
    }
    
    // Check for duplicate within the same form (show warning popup)
    const isDuplicate = checkDuplicateLicenseWithWarning(cleanedValue, productName);
    if (isDuplicate) {
      // Clear any existing backend error
      setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
      return;
    }
    
    // Clear any existing backend error before checking again
    setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
    
    // Check in backend if not duplicate
    if (cleanedValue.length >= 8) {
      debouncedCheckLicenseExists.current[productName]?.(cleanedValue);
    }
  };

  const handleLicenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string, category: LicenseValidationCategory, onInvalidKey?: () => void) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) {
      return;
    }

    const allowedChars = category === "FSSAI"
      ? /^[0-9]$/
      : category === "COSMETIC"
        ? /^[A-Za-z0-9\-]$/
        : /^[A-Za-z0-9\/\-]$/;
    if (!allowedChars.test(e.key)) {
      e.preventDefault();
      onInvalidKey?.();
    }
  };

  const handleLicenseNumberBlur = (value: string, productName: string) => {
    const licenseInfo = getLicenseInfo(productName);
    const error = validateLicenseNumber(value, licenseInfo.licenseName, licenseInfo.validationCategory);
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
    
    if (value.length >= 8 && !error) {
      // Check for duplicate within the same form (show warning popup)
      const isDuplicate = checkDuplicateLicenseWithWarning(value, productName);
      if (!isDuplicate) {
        // Clear existing error before checking
        setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
        checkLicenseExists(value, productName, licenseInfo.licenseName);
      }
    }
  };

  const handleWarningConfirm = () => {
    if (warningState) {
      // User chose to continue with the duplicate license number
      const licenseInfo = getLicenseInfo(warningState.pendingProductName);
      const licenseNumber = warningState.pendingLicenseNumber;
      
      // Clear any existing error
      setLicenseExistsErrors(prev => ({ ...prev, [warningState.pendingProductName]: "" }));
      
      if (licenseNumber.length >= 8) {
        // Check backend for existing license
        checkLicenseExists(licenseNumber, warningState.pendingProductName, licenseInfo.licenseName);
      }
      
      setWarningState(null);
    }
  };

  const handleWarningCancel = () => {
    if (warningState) {
      // Clear the license number field
      const syntheticEvent = {
        target: { 
          name: `licenseNumber-${warningState.pendingProductName}`, 
          value: "" 
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onLicenseNumberChange(syntheticEvent);
      
      // Clear the license number from formData using the callback prop
      if (onClearLicenseNumber) {
        onClearLicenseNumber(warningState.pendingProductName);
      }
      
      // Clear any errors for this product
      setLicenseErrors(prev => ({ ...prev, [warningState.pendingProductName]: "" }));
      setLicenseExistsErrors(prev => ({ ...prev, [warningState.pendingProductName]: "" }));
      
      setWarningState(null);
    }
  };

  const handleIssuingAuthorityInput = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    let value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z0-9\s]/g, '');

    if (filteredValue !== value) {
      setIssuingAuthorityFormatErrors(prev => ({ ...prev, [productName]: "Issuing authority can only contain letters, numbers, and spaces" }));
      const syntheticEvent = {
        ...e,
        target: { ...e.target, name: `issuingAuthority-${productName}`, value: filteredValue }
      } as React.ChangeEvent<HTMLInputElement>;
      onIssuingAuthorityChange(syntheticEvent);
    } else {
      setIssuingAuthorityFormatErrors(prev => ({ ...prev, [productName]: "" }));
      onIssuingAuthorityChange(e);
    }
  };

  const handleAgreementNumberChangeWithValidation = (code: string, value: string, label: string) => {
    const category = AGREEMENT_LICENSE_CATEGORY[code];

    if (!category) {
      onAgreementNumberChange(code, value);
      return;
    }

    const cleaned = formatLicenseNumber(value, category);
    if (cleaned.length > LICENSE_MAX_LENGTH[category]) {
      return;
    }

    onAgreementNumberChange(code, cleaned);

    if (!cleaned) {
      setAgreementErrors(prev => ({ ...prev, [code]: "" }));
      return;
    }

    const error = validateLicenseNumber(cleaned, label, category);
    setAgreementErrors(prev => ({ ...prev, [code]: error || "" }));
  };

  const handleGSTFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
        return;
      }

      setUploadingGST(true);
      toast.info("Uploading GST certificate...");
      
      setTimeout(() => {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, files: e.target.files }
        };
        onFileChange(syntheticEvent, 'gstFile');
        setUploadingGST(false);
        toast.success("GST certificate uploaded");
      }, 1000);
    }
  };

  const handleLicenseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
        return;
      }

      setUploadingLicenses(prev => ({ ...prev, [productName]: true }));
      toast.info("Uploading license...");
      
      setTimeout(() => {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, files: e.target.files }
        };
        onFileChange(syntheticEvent, 'license', productName);
        setUploadingLicenses(prev => ({ ...prev, [productName]: false }));
        toast.success("License uploaded successfully");
      }, 1000);
    }
  };

  const handleAgreementFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, code: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
        return;
      }

      setUploadingAgreements(prev => ({ ...prev, [code]: true }));
      toast.info(`Uploading ${getAgreementLabel(code)}...`);

      setTimeout(() => {
        onAgreementFileChange(code, file);
        setUploadingAgreements(prev => ({ ...prev, [code]: false }));
        toast.success(`${getAgreementLabel(code)} uploaded successfully`);
      }, 1000);
    }
  };

  const expiredProducts = formData.productTypes.filter((productName: string) => {
    const licenseData = formData.licenses[productName];
    const status = calculateLicenseStatus(licenseData?.issueDate || null, licenseData?.expiryDate || null);
    return status === "Expired";
  });

  const invalidGapProducts = formData.productTypes.filter((productName: string) => {
    const licenseData = formData.licenses[productName];
    return isDateGapExceedingFiveYears(licenseData?.issueDate || null, licenseData?.expiryDate || null);
  });

  const handleContinue = () => {
    // Show toast for expired licenses instead of inline banner
    if (expiredProducts.length > 0) {
      const expiredNames = expiredProducts.map((p:any) => {
        const licenseInfo = getLicenseInfo(p);
        return licenseInfo.licenseName;
      }).join(", ");
      toast.error(`Expired license(s) detected: ${expiredNames}. Please update with valid licenses.`);
      return;
    }
    
    if (invalidGapProducts.length > 0) {
      const gapNames = invalidGapProducts.map((p:any) => {
        const licenseInfo = getLicenseInfo(p);
        return licenseInfo.licenseName;
      }).join(", ");
      toast.error(`${gapNames} license validity cannot exceed 5 years. Please correct.`);
      return;
    }
    
    const hasLicenseExistsErrors = Object.values(licenseExistsErrors).some(error => error !== "");
    if (hasLicenseExistsErrors) {
      toast.error("Please fix duplicate license numbers before continuing.");
      return;
    }
    
    if (gstExistsError) {
      toast.error("Please fix duplicate GST number before continuing.");
      return;
    }

    const hasAgreementNumberErrors = Object.values(agreementErrors).some(error => error !== "");
    if (hasAgreementNumberErrors) {
      toast.error("Please fix invalid import licence numbers before continuing.");
      return;
    }

    // ---- Required-field inline validation ----
    // Below, missing-value checks are surfaced as per-field inline errors
    // (reusing the same local error-state buckets already rendered per row)
    // instead of a single generic toast, so the seller can see exactly which
    // field on which product/document is empty.
    let hasRequiredFieldErrors = false;

    // GST number / GST certificate required
    const trimmedGstNumber = (formData.gstNumber || "").trim();
    if (!trimmedGstNumber) {
      setGstError("GST Number is required");
      hasRequiredFieldErrors = true;
    }
    const hasGstFile = !!formData.gstFile || isRealFileUrl(formData.gstFileUrl);
    if (!hasGstFile) {
      setGstFileError("GST Certificate is required");
      hasRequiredFieldErrors = true;
    } else {
      setGstFileError("");
    }

    // Per-product license required fields (number, file, issue date, expiry
    // date, issuing authority). Skips a product that already has a more
    // specific error (format error or duplicate-exists error) so we don't
    // clobber it with a generic "required" message.
    const newLicenseErrors: Record<string, string> = {};
    formData.productTypes.forEach((productName: string) => {
      if (licenseErrors[productName] || licenseExistsErrors[productName]) {
        return;
      }
      const licenseData = formData.licenses[productName] || {};
      const licenseInfo = getLicenseInfo(productName);
      const hasLicenseFile = !!licenseData.file || isRealFileUrl(licenseData.fileUrl);

      if (!licenseData.number || !licenseData.number.trim()) {
        newLicenseErrors[productName] = `${licenseInfo.numberLabel} is required`;
      } else if (!hasLicenseFile) {
        newLicenseErrors[productName] = `${licenseInfo.fileLabel} is required`;
      } else if (!licenseData.issueDate) {
        newLicenseErrors[productName] = `${licenseInfo.issueDateLabel} is required`;
      } else if (!licenseData.expiryDate) {
        newLicenseErrors[productName] = `${licenseInfo.expiryDateLabel} is required`;
      } else if (!licenseData.issuingAuthority || !licenseData.issuingAuthority.trim()) {
        newLicenseErrors[productName] = `${licenseInfo.authorityLabel} is required`;
      }
    });
    if (Object.keys(newLicenseErrors).length > 0) {
      setLicenseErrors(prev => ({ ...prev, ...newLicenseErrors }));
      hasRequiredFieldErrors = true;
    }

    // Per-agreement required document check (replaces the old generic
    // "Please upload the X document" toast with an inline error next to
    // the relevant agreement block, keyed the same way agreementErrors
    // already is). Only the document file is enforced here — the number
    // field on these agreement codes is explicitly optional in the UI and
    // in step3Schema's refine, so it is intentionally not required here.
    const newAgreementErrors: Record<string, string> = {};
    requiredDocumentCodes.forEach((code: string) => {
      if (agreementErrors[code]) {
        return;
      }
      const agreementData = formData.agreements?.[code];
      const hasAgreementFile = !!agreementData?.file || isRealFileUrl(agreementData?.fileUrl);
      if (!hasAgreementFile) {
        newAgreementErrors[code] = `${getAgreementLabel(code)} document is required`;
      }
    });
    if (Object.keys(newAgreementErrors).length > 0) {
      setAgreementErrors(prev => ({ ...prev, ...newAgreementErrors }));
      hasRequiredFieldErrors = true;
    }

    if (hasRequiredFieldErrors) {
      return;
    }

    nextStep();
  };

  if (formData.productTypes.length === 0) {
    return (
      <div className="flex flex-col gap-5 bg-white">
        <div>
          <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
            Statutory Documents
          </div>
          <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
            License and GST compliance upload
          </div>
        </div>
        <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-xl">
          <div className="flex items-center">
            <span className="text-warning-800 text-xl mr-3">⚠️</span>
            <div>
              <p className="text-warning-800 font-medium">
                No product types selected
              </p>
              <p className="text-warning-700 text-p3 font-body font-regular mt-1">
                Please go back to Step 1 and select at least one product type.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-10">
          <button onClick={prevStep} className="h-12 px-6 border-2 border-pneutral-900 text-pneutral-900 rounded-xl flex items-center gap-2">
            <Image src="/icons/backbuttonicon.png" alt="Back" width={18} height={18} />
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="flex flex-col gap-6 bg-white">

        {/* HEADER */}
        <div>
          <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
            Statutory Documents
          </div>
          <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
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

          const licenseFileName = licenseData.file?.name || "";
          const isUploading = uploadingLicenses[productName];
          const licenseError = licenseErrors[productName];
          const licenseExistsError = licenseExistsErrors[productName];
          const isCheckingLicense = checkingLicense[productName];
          const issueDateError = dateErrors[`${productName}_issue`];
          const expiryDateError = dateErrors[`${productName}_expiry`];
          const gapError = dateErrors[`${productName}_gap`];
          
          const currentStatus = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
          const hasGapError = !!gapError;
          
          // Calculate min and max dates for expiry picker
          const issueDate = licenseData.issueDate;
          const minExpiryDate = issueDate || undefined;
          const maxExpiryDate = getMaxExpiryDate(issueDate) || undefined;
          
          // Check if expiry date picker should be disabled
          const isExpiryDisabled = !issueDate;

          // Status styling based on design system
          const getStatusStyles = () => {
            if (!licenseData.issueDate || !licenseData.expiryDate) {
              return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
            }
            if (currentStatus === "Active") {
              return { bg: "bg-success-300", text: "text-success-600", dot: "bg-success-600" };
            }
            if (currentStatus === "Expired") {
              return { bg: "bg-warning-300", text: "text-warning-500", dot: "bg-warning-500" };
            }
            return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
          };

          const statusStyles = getStatusStyles();
          const minIssueDate = getMinIssueDate();
          const maxIssueDate = getMaxIssueDate();

          return (
            <div key={productName} className="mb-2">
              
              {hasGapError && (
                <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <span className="text-red-500 text-base">⚠️</span>
                  <p className="text-red-600 text-p3 font-body font-medium">
                    {gapError}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {/* LICENSE NUMBER */}
                <FormInput
                  label={licenseInfo.numberLabel}
                  required
                  type="text"
                  autoComplete="off"
                  name={`licenseNumber-${productName}`}
                  value={licenseData.number}
                  onChange={(e) => handleLicenseNumberChangeWithValidation(e, productName)}
                  onKeyDown={(e) => handleLicenseKeyDown(e, licenseData.number, licenseInfo.validationCategory, () => setLicenseErrors(prev => ({ ...prev, [productName]: "Invalid character" })))}
                  onBlur={(e) => handleLicenseNumberBlur(e.target.value, productName)}
                  placeholder={licenseInfo.placeholder}
                  maxLength={licenseInfo.maxLength}
                  uppercase
                  error={licenseError || (!licenseError && licenseExistsError ? licenseExistsError : undefined)}
                  rightSlot={isCheckingLicense ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  ) : undefined}
                />

                {/* LICENSE FILE UPLOAD WITH CROSS BUTTON */}
                <div className="flex flex-col gap-1">
                  <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
                    {licenseInfo.fileLabel}
                    <span className="text-warning-500 font-semibold ml-1">*</span>
                  </label>

                  <input
                    id={`license-upload-${productName}`}
                    type="file"
                    name={`licenseFile-${productName}`}
                    onChange={(e) => handleLicenseFileUpload(e, productName)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={isUploading}
                  />

                  {!licenseFileName && isRealFileUrl(licenseData.fileUrl) ? (
                    <UploadedFileChip
                      url={licenseData.fileUrl}
                      fileName={licenseData.fileName}
                      inputId={`license-upload-${productName}`}
                      onDelete={() => onDeleteLicenseFile(productName)}
                    />
                  ) : (
                  <div
                    tabIndex={isUploading ? -1 : 0}
                    role="button"
                    aria-label={`Upload ${licenseInfo.fileLabel}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        document.getElementById(`license-upload-${productName}`)?.click();
                      }
                    }}
                    className="flex items-center border border-neutral-500 rounded-xl overflow-hidden h-13 bg-white cursor-pointer focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
                    onClick={() => document.getElementById(`license-upload-${productName}`)?.click()}
                  >
                    <div className="w-12 h-full bg-secondary-800 flex items-center justify-center">
                      <Image
                        src="/icons/upload.png"
                        alt="Upload"
                        width={18}
                        height={18}
                        className="brightness-0 invert"
                      />
                    </div>

                    <div className="flex-1 h-full flex items-center justify-between px-3">
                      <div className="flex-1 flex items-center min-w-0">
                        {isUploading ? (
                          <span className="text-p4 font-body font-regular text-pneutral-500">Uploading...</span>
                        ) : licenseFileName ? (
                          <div className="flex items-center gap-2 bg-sneutral-800 rounded-md px-3 py-1 max-w-fit">
                            <span className="text-p4 font-body font-regular text-white truncate max-w-[120px]">
                              {licenseFileName}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const syntheticEvent = {
                                  target: { files: null }
                                } as any;
                                onFileChange(syntheticEvent, 'license', productName);
                                const fileInput = document.getElementById(`license-upload-${productName}`) as HTMLInputElement;
                                if (fileInput) fileInput.value = "";
                              }}
                              className="shrink-0"
                              aria-label="Remove file"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-p4 font-body font-regular text-pneutral-500">Upload the Certificate</span>
                        )}
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                {/* ISSUE DATE - With 5 year lookback restriction (exclusive) */}
                <div className="flex flex-col gap-1">
                  <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
                    {licenseInfo.issueDateLabel}
                    <span className="text-warning-500 font-semibold ml-1">*</span>
                  </label>

                  <div>
                    <DatePicker
                      value={licenseData.issueDate}
                      onChange={(date) => {
                        handleIssueDateChangeWithValidation(date, productName);
                      }}
                      minDate={minIssueDate}
                      maxDate={maxIssueDate}
                      format="dd/MM/yyyy"
                      slotProps={{
                        field: {
                          clearable: true,
                        },
                        actionBar: {
                          actions: ["clear"],
                        },
                        textField: {
                          fullWidth: true,
                          size: "small",
                          placeholder: "DD/MM/YYYY",
                          error: !!issueDateError,
                          inputProps: {
                            onKeyDown: handleDateInputKeyDown,
                          },
                          sx: dateFieldSx(!!issueDateError),
                        },
                      }}
                    />
                    {issueDateError && (
                      <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                        <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                        <span>{issueDateError}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* EXPIRY DATE - Disabled until issue date is selected */}
                <div className="flex flex-col gap-1">
                  <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
                    {licenseInfo.expiryDateLabel}
                    <span className="text-warning-500 font-semibold ml-1">*</span>
                  </label>

                  <div>
                    <DatePicker
                      value={licenseData.expiryDate}
                      onChange={(date) => handleExpiryDateChangeWithValidation(date, productName)}
                      minDate={minExpiryDate}
                      maxDate={maxExpiryDate}
                      disabled={isExpiryDisabled}
                      format="dd/MM/yyyy"
                      slotProps={{
                        field: {
                          clearable: true,
                        },
                        actionBar: {
                          actions: ["clear"],
                        },
                        textField: {
                          fullWidth: true,
                          size: "small",
                          placeholder: isExpiryDisabled ? "Select issue date first" : "DD/MM/YYYY",
                          error: !!expiryDateError,
                          inputProps: {
                            onKeyDown: handleDateInputKeyDown,
                            readOnly: isExpiryDisabled,
                          },
                          sx: dateFieldSx(!!expiryDateError, isExpiryDisabled),
                        },
                      }}
                    />
                    {expiryDateError && (
                      <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                        <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                        <span>{expiryDateError}</span>
                      </p>
                    )}
                    {/* {isExpiryDisabled && !expiryDateError && (
                      <p className="mt-1 text-p2 font-body font-regular text-pneutral-500 flex items-start">
                        <span className="mr-1">ℹ️</span>
                        <span>Please select issue date first</span>
                      </p>
                    )}
                    {!isExpiryDisabled && !expiryDateError && maxExpiryDate && (
                      <p className="mt-1 text-p3 font-body font-regular text-pneutral-500">
                        Expiry date must be within 5 years of issue date (max: {maxExpiryDate.toLocaleDateString('en-GB')})
                      </p>
                    )} */}
                  </div>
                </div>

                {/* ISSUING AUTHORITY */}
                <FormInput
                  label={licenseInfo.authorityLabel}
                  required
                  type="text"
                  autoComplete="off"
                  name={`issuingAuthority-${productName}`}
                  value={licenseData.issuingAuthority}
                  onChange={(e) => handleIssuingAuthorityInput(e, productName)}
                  onBlur={() => setIssuingAuthorityFormatErrors(prev => ({ ...prev, [productName]: "" }))}
                  placeholder="Enter issuing authority"
                  maxLength={150}
                  error={issuingAuthorityFormatErrors[productName]}
                />

                {/* LICENSE STATUS */}
                <div className="flex items-center gap-4 mt-1">
                  <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
                    {licenseInfo.statusLabel}
                    <span className="text-warning-500 font-semibold ml-1">*</span>
                  </label>

                  <div
                    className={`inline-flex items-center gap-2 px-4 h-8 rounded-full border
                      ${
                        currentStatus === "Active"
                          ? "bg-success-50 border-success-600"
                          : currentStatus === "Expired"
                          ? "bg-warning-100 border-warning-500"
                          : "bg-neutral-100 border-neutral-400"
                      }
                    `}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full
                        ${
                          currentStatus === "Active"
                            ? "bg-success-600"
                            : currentStatus === "Expired"
                            ? "bg-warning-500"
                            : "bg-neutral-500"
                        }
                      `}
                    />

                    <span
                      className={`text-p4 font-body font-medium
                        ${
                          currentStatus === "Active"
                            ? "text-success-600"
                            : currentStatus === "Expired"
                            ? "text-warning-500"
                            : "text-neutral-500"
                        }
                      `}
                    >
                      {!licenseData.issueDate || !licenseData.expiryDate
                        ? "Pending"
                        : currentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* AGREEMENT & COMPLIANCE DOCUMENTS - seller-type-driven, separate from
            per-product licenses above. renderDocumentBlock is shared between
            the mandatory set (agreements + GMP/Trademark) and the purely
            optional set (Import Licences, IEC Certificate, etc.) below —
            only the "required" flag changes what's shown/enforced. */}
        {(() => {
          const renderDocumentBlock = (code: string, isRequired: boolean) => {
            const agreementData = formData.agreements?.[code] || {
              number: "",
              file: null,
              issueDate: null,
              expiryDate: null,
            };
            const agreementFileName = agreementData.file?.name || "";
            const isUploading = uploadingAgreements[code];
            const label = getAgreementLabel(code);
            const licenseCategory = AGREEMENT_LICENSE_CATEGORY[code];
            const agreementNumberError = agreementErrors[code];

            return (
              <div key={code} className="mb-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {/* NUMBER (optional) */}
                  <FormInput
                    label={`${label} Number (optional)`}
                    type="text"
                    autoComplete="off"
                    value={agreementData.number}
                    onChange={(e) => handleAgreementNumberChangeWithValidation(code, e.target.value, label)}
                    onKeyDown={licenseCategory ? (e) => handleLicenseKeyDown(e, agreementData.number, licenseCategory, () => setAgreementErrors(prev => ({ ...prev, [code]: "Invalid character" }))) : undefined}
                    onBlur={() => setAgreementErrors(prev => ({ ...prev, [code]: "" }))}
                    placeholder={licenseCategory ? LICENSE_PLACEHOLDER[licenseCategory] : `Enter ${label} number`}
                    maxLength={licenseCategory ? LICENSE_MAX_LENGTH[licenseCategory] : 30}
                    uppercase={!!licenseCategory}
                    error={agreementNumberError}
                  />

                  {/* DOCUMENT UPLOAD (required only if isRequired) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
                      {label} Document
                      {isRequired ? (
                        <span className="text-warning-500 font-semibold ml-1">*</span>
                      ) : (
                        <span className="text-pneutral-500 font-normal ml-1">(optional)</span>
                      )}
                    </label>

                    <input
                      id={`agreement-upload-${code}`}
                      type="file"
                      onChange={(e) => handleAgreementFileUpload(e, code)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={isUploading}
                    />

                    {!agreementFileName && isRealFileUrl(agreementData.fileUrl) ? (
                      <UploadedFileChip
                        url={agreementData.fileUrl}
                        fileName={agreementData.fileName}
                        inputId={`agreement-upload-${code}`}
                        onDelete={() => onDeleteAgreementFile(code)}
                      />
                    ) : (
                    <div
                      tabIndex={isUploading ? -1 : 0}
                      role="button"
                      aria-label={`Upload ${label} Document`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          document.getElementById(`agreement-upload-${code}`)?.click();
                        }
                      }}
                      className="flex items-center border border-neutral-500 rounded-xl overflow-hidden h-13 bg-white cursor-pointer focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
                      onClick={() => document.getElementById(`agreement-upload-${code}`)?.click()}
                    >
                      <div className="w-12 h-full bg-secondary-800 flex items-center justify-center">
                        <Image
                          src="/icons/upload.png"
                          alt="Upload"
                          width={18}
                          height={18}
                          className="brightness-0 invert"
                        />
                      </div>

                      <div className="flex-1 h-full flex items-center justify-between px-3">
                        <div className="flex-1 flex items-center min-w-0">
                          {isUploading ? (
                            <span className="text-p4 font-body font-regular text-pneutral-500">Uploading...</span>
                          ) : agreementFileName ? (
                            <div className="flex items-center gap-2 bg-sneutral-800 rounded-md px-3 py-1 max-w-fit">
                              <span className="text-p4 font-body font-regular text-white truncate max-w-[120px]">
                                {agreementFileName}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAgreementFileChange(code, null);
                                  const fileInput = document.getElementById(`agreement-upload-${code}`) as HTMLInputElement;
                                  if (fileInput) fileInput.value = "";
                                }}
                                className="shrink-0"
                                aria-label="Remove file"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className="text-p4 font-body font-regular text-pneutral-500">
                              Upload the {label}{isRequired ? "" : " (optional)"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    )}
                  </div>

                  {/* ISSUE DATE (optional) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
                      {label} Issue Date (optional)
                    </label>
                    <DatePicker
                      value={agreementData.issueDate}
                      onChange={(date) => onAgreementIssueDateChange(date, code)}
                      maxDate={new Date()}
                      format="dd/MM/yyyy"
                      slotProps={{
                        field: {
                          clearable: true,
                        },
                        actionBar: {
                          actions: ["clear"],
                        },
                        textField: {
                          fullWidth: true,
                          size: "small",
                          placeholder: "DD/MM/YYYY",
                          sx: dateFieldSx(false),
                        },
                      }}
                    />
                  </div>

                  {/* EXPIRY DATE (optional) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
                      {label} Expiry Date (optional)
                    </label>
                    <DatePicker
                      value={agreementData.expiryDate}
                      onChange={(date) => onAgreementExpiryDateChange(date, code)}
                      minDate={agreementData.issueDate || undefined}
                      format="dd/MM/yyyy"
                      slotProps={{
                        field: {
                          clearable: true,
                        },
                        actionBar: {
                          actions: ["clear"],
                        },
                        textField: {
                          fullWidth: true,
                          size: "small",
                          placeholder: "DD/MM/YYYY",
                          sx: dateFieldSx(false),
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          };

          return (
            <>
              {requiredDocumentCodes.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900 mb-3">
                    Agreement &amp; Compliance Documents
                  </h3>
                  {requiredDocumentCodes.map((code: string) => renderDocumentBlock(code, true))}
                </div>
              )}

              {optionalDocumentCodes.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900 mb-3">
                    Additional Documents (Optional)
                  </h3>
                  <p className="text-p4 font-body font-regular text-pneutral-500 mb-3">
                    These aren&apos;t required to submit your registration — attach them only if applicable (e.g. import licences only apply if you import).
                  </p>
                  {optionalDocumentCodes.map((code: string) => renderDocumentBlock(code, false))}
                </div>
              )}
            </>
          );
        })()}

        {/* GST SECTION */}
        <div className="mt-2">
          <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900 mb-3">
            GSTIN Details
          </h3>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <FormInput
              label="GSTIN Number"
              required
              type="text"
              name="gstNumber"
              autoComplete="off"
              value={formData.gstNumber}
              onChange={handleGSTChangeWithValidation}
              onBlur={(e) => handleGSTBlur(e.target.value)}
              placeholder="Enter GST number"
              maxLength={15}
              uppercase
              error={gstError || (!gstError && gstExistsError ? gstExistsError : undefined)}
              rightSlot={checkingGST ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              ) : undefined}
            />

            {/* GST FILE UPLOAD WITH CROSS BUTTON */}
            <div className="flex flex-col gap-1">
              <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
                GST Certificate
                <span className="text-warning-500 font-semibold ml-1">*</span>
              </label>

              <input
                id="gst-upload"
                type="file"
                name="gstFile"
                onChange={handleGSTFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                disabled={uploadingGST}
              />

              {!gstFileName && isRealFileUrl(formData.gstFileUrl) ? (
                <UploadedFileChip
                  url={formData.gstFileUrl}
                  fileName={formData.gstFileName}
                  inputId="gst-upload"
                  onDelete={onDeleteGstFile}
                />
              ) : (
              <div
                tabIndex={uploadingGST ? -1 : 0}
                role="button"
                aria-label="Upload GST Certificate"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    document.getElementById('gst-upload')?.click();
                  }
                }}
                className="flex items-center border border-neutral-500 rounded-xl overflow-hidden h-13 bg-white cursor-pointer focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
                onClick={() => document.getElementById('gst-upload')?.click()}
              >
                <div className="w-12 h-full bg-secondary-800 flex items-center justify-center">
                  <Image
                    src="/icons/upload.png"
                    alt="Upload"
                    width={18}
                    height={18}
                    className="brightness-0 invert"
                  />
                </div>

                <div className="flex-1 h-full flex items-center justify-between px-3">
                  <div className="flex-1 flex items-center min-w-0">
                    {uploadingGST ? (
                      <span className="text-p4 font-body font-regular text-pneutral-500">Uploading...</span>
                    ) : gstFileName ? (
                      <div className="flex items-center gap-2 bg-sneutral-800 rounded-md px-3 py-1 max-w-fit">
                        <span className="text-p4 font-body font-regular text-white truncate max-w-[120px]">
                          {gstFileName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const syntheticEvent = {
                              target: { files: null }
                            } as any;
                            onFileChange(syntheticEvent, 'gstFile');
                            const fileInput = document.getElementById('gst-upload') as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                          }}
                          className="shrink-0"
                          aria-label="Remove file"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-p4 font-body font-regular text-pneutral-500">Upload the Certificate</span>
                    )}
                  </div>
                </div>
              </div>
              )}
              {gstFileError && (
                <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 mt-0.5 shrink-0 text-warning-500" />
                  <span>{gstFileError}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-between mt-10">
          <button
            onClick={prevStep}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-pneutral-900 text-pneutral-900 font-semibold"
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
            onClick={handleContinue}
            className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-800 text-primary-800 font-semibold"
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

      {/* License Warning Popup */}
      {warningState && (
        <LicenseWarning
          isOpen={warningState.isOpen}
          licenseNumber={warningState.licenseNumber}
          existingProductNames={warningState.existingProductNames}
          newProductName={warningState.newProductName}
          onConfirm={handleWarningConfirm}
          onCancel={handleWarningCancel}
        />
      )}
    </LocalizationProvider>
  );
}













// code dated 11.06.2026
// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { ProductTypeResponse } from "@/src/types/seller/SellerRegMasterData";
// import { toast } from "react-toastify";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
// import { debounce } from "lodash";
// import LicenseWarning from "./LicenseWarning";

// interface Props {
//   formData: any;
//   productTypes: ProductTypeResponse[];
//   onGSTChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string, productName?: string) => void;
//   onIssueDateChange: (date: Date | null, productName: string) => void;
//   onExpiryDateChange: (date: Date | null, productName: string) => void;
//   onLicenseNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onIssuingAuthorityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onClearLicenseNumber?: (productName: string) => void;
//   prevStep: () => void;
//   nextStep: () => void;
// }

// // Helper function to calculate license status based on dates
// const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): string => {
//   if (!issueDate || !expiryDate) {
//     return "Pending";
//   }
  
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
  
//   if (expiryDate < today) {
//     return "Expired";
//   }
  
//   return "Active";
// };

// // Function to check if date gap is more than 5 years
// const isDateGapExceedingFiveYears = (issueDate: Date | null, expiryDate: Date | null): boolean => {
//   if (!issueDate || !expiryDate) return false;
  
//   const diffInYears = (expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
//   return diffInYears > 5;
// };

// // License Number validation function with dynamic license name
// const validateLicenseNumber = (value: string, licenseName: string): string | null => {
//   const cleaned = value.trim().toUpperCase();
  
//   if (!cleaned) {
//     return `${licenseName} Number is required`;
//   }
  
//   if (cleaned.length < 8) {
//     return `${licenseName} Number must be at least 8 characters`;
//   }
  
//   if (cleaned.length > 30) {
//     return `${licenseName} Number cannot exceed 30 characters`;
//   }
  
//   const patterns = [
//     /^[A-Z]{2}\/[A-Z]{3}\/\d{2}[A-Z]?-\d{3,10}$/,
//     /^[A-Z]{2}-[A-Z0-9]{2,4}-\d{4,10}$/,
//     /^[A-Z]{2}-\d{2,3}-\d{5,10}$/,
//     /^\d{2}[A-Z]?-\d{3,10}$/,
//     /^\d{2}\/\d{2}-\d{3,10}$/,
//     /^[A-Z]{2}\/\d{2}[A-Z]?-\d{3,10}$/,
//     /^[A-Z]{2}\/\d{2,3}\/\d{4,10}$/,
//     /^[A-Z]{2}[A-Z0-9]{2,4}\d{4,10}$/,
//   ];
  
//   const isValid = patterns.some(pattern => pattern.test(cleaned));
  
//   if (!isValid) {
//     return `Invalid ${licenseName} Number format`;
//   }
  
//   return null;
// };

// const formatLicenseNumber = (value: string): string => {
//   let cleaned = value.toUpperCase();
//   cleaned = cleaned.replace(/[^A-Z0-9\/\-]/g, '');
//   return cleaned;
// };

// const useDateYearGuard = () => {
//   const bufferRef = useRef<string>("");

//   const handleDateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const input = e.currentTarget;
//     const selectionStart = input.selectionStart ?? 0;

//     if (!/^\d$/.test(e.key)) {
//       if (!['ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
//         bufferRef.current = "";
//       }
//       return;
//     }

//     const inYearSegment = selectionStart >= 6;

//     if (!inYearSegment) {
//       bufferRef.current = "";
//       return;
//     }

//     bufferRef.current = (bufferRef.current + e.key).slice(-4);

//     if (bufferRef.current.length === 4) {
//       const typedYear = parseInt(bufferRef.current, 10);
//       if (typedYear < 2000) {
//         e.preventDefault();
//         bufferRef.current = "";
//         toast.error("Year must be 2000 or greater", { toastId: "year-guard" });
//       } else {
//         bufferRef.current = "";
//       }
//     }
//   };

//   const handleDateInputChange = (
//     date: Date | null,
//     productName: string,
//     type: "issue" | "expiry",
//     originalHandler: (date: Date | null, productName: string) => void,
//     setDateErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
//   ) => {
//     if (date && date.getFullYear() < 2000) {
//       setDateErrors(prev => ({
//         ...prev,
//         [`${productName}_${type}`]: "Year must be 2000 or greater",
//       }));
//       return;
//     }
//     originalHandler(date, productName);
//   };

//   return { handleDateInputKeyDown, handleDateInputChange };
// };

// export default function DocumentForm({
//   formData,
//   productTypes,
//   onGSTChange,
//   onFileChange,
//   onIssueDateChange,
//   onExpiryDateChange,
//   onLicenseNumberChange,
//   onIssuingAuthorityChange,
//   onClearLicenseNumber,
//   prevStep,
//   nextStep,
// }: Props) {

//   const router = useRouter();
//   const [uploadingGST, setUploadingGST] = useState(false);
//   const [uploadingLicenses, setUploadingLicenses] = useState<Record<string, boolean>>({});
//   const [licenseErrors, setLicenseErrors] = useState<Record<string, string>>({});
//   const [licenseExistsErrors, setLicenseExistsErrors] = useState<Record<string, string>>({});
//   const [checkingLicense, setCheckingLicense] = useState<Record<string, boolean>>({});
//   const [dateErrors, setDateErrors] = useState<Record<string, string>>({});
//   const [warningState, setWarningState] = useState<{
//     isOpen: boolean;
//     licenseNumber: string;
//    existingProductNames: string[];
//     newProductName: string;
//     pendingProductName: string;
//     pendingLicenseNumber: string;
//   } | null>(null);
  
//   const [gstError, setGstError] = useState<string>("");
//   const [gstExistsError, setGstExistsError] = useState<string>("");
//   const [checkingGST, setCheckingGST] = useState(false);

//   const debouncedCheckLicenseExists = useRef<Record<string, ReturnType<typeof debounce>>>({});
//   const debouncedCheckGST = useRef<ReturnType<typeof debounce> | null>(null);

//   const { handleDateInputKeyDown, handleDateInputChange } = useDateYearGuard();

//   const gstFileName = formData.gstFile?.name || "";

//   const getLicenseInfo = (productName: string) => {
//     const product = productTypes.find((p) => p.productTypeName === productName);
//     const licenseName = product?.regulatoryCategory || productName;
    
//     return {
//       licenseName,
//       placeholder: `e.g., TN/CBE/20B-12345`,
//       numberLabel: `${licenseName} License Number`,
//       fileLabel: `${licenseName} License Copy Upload`,
//       issueDateLabel: `${licenseName} License Issue Date`,
//       expiryDateLabel: `${licenseName} License Expiry Date`,
//       authorityLabel: `${licenseName} License Issuing Authority`,
//       statusLabel: `${licenseName} License Status`,
//     };
//   };

//   // Check for duplicate license numbers within the same form and show warning
// // const checkDuplicateLicenseWithWarning = (licenseNumber: string, currentProductName: string): boolean => {
// //   if (!licenseNumber || licenseNumber.length < 8) return false;
  
// //   const duplicateProductNames: string[] = [];
  
// //   for (const productName of formData.productTypes) {
// //     if (productName !== currentProductName) {
// //       const otherLicense = formData.licenses[productName];
// //       if (otherLicense?.number && otherLicense.number.toUpperCase() === licenseNumber.toUpperCase()) {
// //         duplicateProductNames.push(productName);
// //       }
// //     }
// //   }
  
// //   if (duplicateProductNames.length > 0) {
// //     // Show warning popup with all duplicate product names
// //     setWarningState({
// //       isOpen: true,
// //       licenseNumber: licenseNumber,
// //       existingProductNames: duplicateProductNames,
// //       newProductName: currentProductName,
// //       pendingProductName: currentProductName,
// //       pendingLicenseNumber: licenseNumber,
// //     });
// //     return true; // Duplicate found
// //   }
  
// //   return false;
// // };

// // Check for duplicate license numbers within the same form and show warning
// const checkDuplicateLicenseWithWarning = (licenseNumber: string, currentProductName: string): boolean => {
//   if (!licenseNumber || licenseNumber.length < 8) return false;
  
//   const duplicateProductNames: string[] = [];
  
//   for (const productName of formData.productTypes) {
//     if (productName !== currentProductName) {
//       const otherLicense = formData.licenses[productName];
//       if (otherLicense?.number && otherLicense.number.toUpperCase() === licenseNumber.toUpperCase()) {
//         duplicateProductNames.push(productName);
//       }
//     }
//   }
  
//   if (duplicateProductNames.length > 0) {
//     // Clear any existing database error for this product before showing warning
//     setLicenseExistsErrors(prev => ({ ...prev, [currentProductName]: "" }));
    
//     // Show warning popup with all duplicate product names
//     setWarningState({
//       isOpen: true,
//       licenseNumber: licenseNumber,
//       existingProductNames: duplicateProductNames,
//       newProductName: currentProductName,
//       pendingProductName: currentProductName,
//       pendingLicenseNumber: licenseNumber,
//     });
//     return true; // Duplicate found
//   }
  
//   return false;
// };

//   const checkGSTExists = async (gstNumber: string) => {
//     if (!gstNumber || gstNumber.length !== 15) {
//       setGstExistsError("");
//       return;
//     }

//     setCheckingGST(true);

//     try {
//       const exists = await sellerRegService.checkGSTNumber(gstNumber);

//       if (exists) {
//         setGstExistsError("This GST number already exists in the system");
//         toast.error(`GST number ${gstNumber} already exists`, { 
//           toastId: `gst-exists-${gstNumber}` 
//         });
//       } else {
//         setGstExistsError("");
//       }
//     } catch (error: any) {
//       console.error("Error checking GST:", error);
//       setGstExistsError("");
//     } finally {
//       setCheckingGST(false);
//     }
//   };

//   useEffect(() => {
//     if (!debouncedCheckGST.current) {
//       debouncedCheckGST.current = debounce((gstNumber: string) => {
//         checkGSTExists(gstNumber);
//       }, 800);
//     }

//     return () => {
//       debouncedCheckGST.current?.cancel();
//     };
//   }, []);

//   const handleGSTChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.toUpperCase();
//     value = value.replace(/[^0-9A-Z]/g, '');
//     if (value.length > 15) value = value.slice(0, 15);

//     const syntheticEvent = {
//       ...e,
//       target: { ...e.target, name: 'gstNumber', value }
//     } as React.ChangeEvent<HTMLInputElement>;

//     onGSTChange(syntheticEvent);
    
//     if (value.length === 15) {
//       const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
//       if (!gstRegex.test(value)) {
//         setGstError("Invalid GST number format");
//         setGstExistsError("");
//       } else {
//         setGstError("");
//         debouncedCheckGST.current?.(value);
//       }
//     } else if (value.length > 0 && value.length < 15) {
//       setGstError("GST number must be 15 characters");
//       setGstExistsError("");
//     } else {
//       setGstError("");
//       setGstExistsError("");
//     }
//   };

//   const handleGSTBlur = (value: string) => {
//     if (value.length === 15) {
//       const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
//       if (gstRegex.test(value)) {
//         checkGSTExists(value);
//       }
//     }
//   };

//   const checkLicenseExists = async (licenseNumber: string, productName: string, licenseName: string) => {
//     if (!licenseNumber || licenseNumber.length < 8) {
//       setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
//       return;
//     }

//     if (licenseErrors[productName]) {
//       return;
//     }

//     setCheckingLicense(prev => ({ ...prev, [productName]: true }));

//     try {
//       const exists = await sellerRegService.checkDocumentExists(
//         "DRUG_LICENSE",
//         licenseNumber
//       );

//       if (exists) {
//         setLicenseExistsErrors(prev => ({ 
//           ...prev, 
//           [productName]: `This ${licenseName} license number already exists in the system` 
//         }));
//         toast.error(`${licenseName} license number ${licenseNumber} already exists`, { 
//           toastId: `license-exists-${licenseNumber}` 
//         });
//       } else {
//         setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
//       }
//     } catch (error: any) {
//       console.error("Error checking license:", error);
//     } finally {
//       setCheckingLicense(prev => ({ ...prev, [productName]: false }));
//     }
//   };

//   useEffect(() => {
//     formData.productTypes.forEach((productName: string) => {
//       const licenseInfo = getLicenseInfo(productName);
//       if (!debouncedCheckLicenseExists.current[productName]) {
//         debouncedCheckLicenseExists.current[productName] = debounce(
//           (licenseNumber: string) => checkLicenseExists(licenseNumber, productName, licenseInfo.licenseName),
//           800
//         );
//       }
//     });

//     return () => {
//       Object.values(debouncedCheckLicenseExists.current).forEach(debounced => {
//         debounced.cancel();
//       });
//     };
//   }, [formData.productTypes, productTypes]);

//   const handleIssueDateChangeWithValidation = (date: Date | null, productName: string) => {
//     if (date) {
//       if (date.getFullYear() < 2000) {
//         setDateErrors(prev => ({ 
//           ...prev, 
//           [`${productName}_issue`]: "Year must be 2000 or greater" 
//         }));
//         return;
//       }
      
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       if (date > today) {
//         setDateErrors(prev => ({ 
//           ...prev, 
//           [`${productName}_issue`]: "Issue date cannot be in the future" 
//         }));
//         return;
//       }
      
//       setDateErrors(prev => ({ ...prev, [`${productName}_issue`]: "" }));
//     } else {
//       setDateErrors(prev => ({ ...prev, [`${productName}_issue`]: "" }));
//     }
    
//     onIssueDateChange(date, productName);
    
//     const licenseData = formData.licenses[productName];
//     const expiryDate = licenseData?.expiryDate || null;
    
//     if (date && expiryDate && isDateGapExceedingFiveYears(date, expiryDate)) {
//       setDateErrors(prev => ({ 
//         ...prev, 
//         [`${productName}_gap`]: "License validity cannot exceed 5 years" 
//       }));
//     } else {
//       setDateErrors(prev => ({ ...prev, [`${productName}_gap`]: "" }));
//     }
//   };
  
//   const handleExpiryDateChangeWithValidation = (date: Date | null, productName: string) => {
//     if (date) {
//       if (date.getFullYear() < 2000) {
//         setDateErrors(prev => ({ 
//           ...prev, 
//           [`${productName}_expiry`]: "Year must be 2000 or greater" 
//         }));
//         return;
//       }
      
//       setDateErrors(prev => ({ ...prev, [`${productName}_expiry`]: "" }));
//     } else {
//       setDateErrors(prev => ({ ...prev, [`${productName}_expiry`]: "" }));
//     }
    
//     onExpiryDateChange(date, productName);
    
//     const licenseData = formData.licenses[productName];
//     const issueDate = licenseData?.issueDate || null;
    
//     if (issueDate && date && isDateGapExceedingFiveYears(issueDate, date)) {
//       setDateErrors(prev => ({ 
//         ...prev, 
//         [`${productName}_gap`]: "License validity cannot exceed 5 years" 
//       }));
//     } else {
//       setDateErrors(prev => ({ ...prev, [`${productName}_gap`]: "" }));
//     }
//   };

//   const handleLicenseNumberChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//     let value = e.target.value;
//     const cleanedValue = formatLicenseNumber(value);
    
//     if (cleanedValue !== value) {
//       return;
//     }
    
//     if (cleanedValue.length > 30) {
//       return;
//     }
    
//     const syntheticEvent = {
//       ...e,
//       target: { ...e.target, name: `licenseNumber-${productName}`, value: cleanedValue }
//     } as React.ChangeEvent<HTMLInputElement>;
    
//     onLicenseNumberChange(syntheticEvent);
    
//     const licenseInfo = getLicenseInfo(productName);
//     const error = validateLicenseNumber(cleanedValue, licenseInfo.licenseName);
//     setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
    
//     if (error) {
//       setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
//       return;
//     }
    
//     // Check for duplicate within the same form (show warning popup)
//     const isDuplicate = checkDuplicateLicenseWithWarning(cleanedValue, productName);
//     if (isDuplicate) {
//       // Don't do backend check if duplicate warning is shown
//       return;
//     }
    
//     // Check in backend if not duplicate
//     if (cleanedValue.length >= 8) {
//       debouncedCheckLicenseExists.current[productName]?.(cleanedValue);
//     } else {
//       setLicenseExistsErrors(prev => ({ ...prev, [productName]: "" }));
//     }
//   };

//   const handleLicenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => {
//     const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
//     if (allowedKeys.includes(e.key)) {
//       return;
//     }
    
//     const allowedChars = /^[A-Za-z0-9\/\-]$/;
//     if (!allowedChars.test(e.key)) {
//       e.preventDefault();
//     }
//   };

//   const handleLicenseNumberBlur = (value: string, productName: string) => {
//     const licenseInfo = getLicenseInfo(productName);
//     const error = validateLicenseNumber(value, licenseInfo.licenseName);
//     setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
    
//     if (value.length >= 8 && !error) {
//       // Check for duplicate within the same form (show warning popup)
//       const isDuplicate = checkDuplicateLicenseWithWarning(value, productName);
//       if (!isDuplicate) {
//         checkLicenseExists(value, productName, licenseInfo.licenseName);
//       }
//     }
//   };

// const handleWarningConfirm = () => {
//   if (warningState) {
//     // User chose to continue with the duplicate license number
//     // Now check if this license number exists in the database
//     const licenseInfo = getLicenseInfo(warningState.pendingProductName);
//     const licenseNumber = warningState.pendingLicenseNumber;
    
//     if (licenseNumber.length >= 8) {
//       // Check backend for existing license
//       checkLicenseExists(licenseNumber, warningState.pendingProductName, licenseInfo.licenseName);
//     }
    
//     setWarningState(null);
//   }
// };

// const handleWarningCancel = () => {
//   if (warningState) {
//     // Clear the license number field
//     const syntheticEvent = {
//       target: { 
//         name: `licenseNumber-${warningState.pendingProductName}`, 
//         value: "" 
//       }
//     } as React.ChangeEvent<HTMLInputElement>;
//     onLicenseNumberChange(syntheticEvent);
    
//     // Clear the license number from formData using the callback prop
//     if (onClearLicenseNumber) {
//       onClearLicenseNumber(warningState.pendingProductName);
//     }
    
//     // Clear any errors for this product
//     setLicenseErrors(prev => ({ ...prev, [warningState.pendingProductName]: "" }));
//     setLicenseExistsErrors(prev => ({ ...prev, [warningState.pendingProductName]: "" }));
    
//     setWarningState(null);
//   }
// };

//   //   if (warningState) {
//   //     // Clear the license number field
//   //     const syntheticEvent = {
//   //       target: { 
//   //         name: `licenseNumber-${warningState.pendingProductName}`, 
//   //         value: "" 
//   //       }
//   //     } as React.ChangeEvent<HTMLInputElement>;
//   //     onLicenseNumberChange(syntheticEvent);
      
//   //     // Clear the license number from formData using the callback prop
//   //     if (onClearLicenseNumber) {
//   //       onClearLicenseNumber(warningState.pendingProductName);
//   //     }
      
//   //     setWarningState(null);
//   //   }
//   // };

//   const handleIssuingAuthorityInput = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//     let value = e.target.value;
//     const filteredValue = value.replace(/[^a-zA-Z0-9\s]/g, '');
    
//     if (filteredValue !== value) {
//       const syntheticEvent = {
//         ...e,
//         target: { ...e.target, name: `issuingAuthority-${productName}`, value: filteredValue }
//       } as React.ChangeEvent<HTMLInputElement>;
//       onIssuingAuthorityChange(syntheticEvent);
//     } else {
//       onIssuingAuthorityChange(e);
//     }
//   };

//   const handleGSTFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error("File size should be less than 5MB");
//         return;
//       }

//       const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
//       if (!allowedTypes.includes(file.type)) {
//         toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
//         return;
//       }

//       setUploadingGST(true);
//       toast.info("Uploading GST certificate...");
      
//       setTimeout(() => {
//         const syntheticEvent = {
//           ...e,
//           target: { ...e.target, files: e.target.files }
//         };
//         onFileChange(syntheticEvent, 'gstFile');
//         setUploadingGST(false);
//         toast.success("GST certificate uploaded");
//       }, 1000);
//     }
//   };

//   const handleLicenseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error("File size should be less than 5MB");
//         return;
//       }

//       const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
//       if (!allowedTypes.includes(file.type)) {
//         toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
//         return;
//       }

//       setUploadingLicenses(prev => ({ ...prev, [productName]: true }));
//       toast.info("Uploading license...");
      
//       setTimeout(() => {
//         const syntheticEvent = {
//           ...e,
//           target: { ...e.target, files: e.target.files }
//         };
//         onFileChange(syntheticEvent, 'license', productName);
//         setUploadingLicenses(prev => ({ ...prev, [productName]: false }));
//         toast.success("License uploaded successfully");
//       }, 1000);
//     }
//   };

//   const expiredProducts = formData.productTypes.filter((productName: string) => {
//     const licenseData = formData.licenses[productName];
//     const status = calculateLicenseStatus(licenseData?.issueDate || null, licenseData?.expiryDate || null);
//     return status === "Expired";
//   });

//   const invalidGapProducts = formData.productTypes.filter((productName: string) => {
//     const licenseData = formData.licenses[productName];
//     return isDateGapExceedingFiveYears(licenseData?.issueDate || null, licenseData?.expiryDate || null);
//   });

//   const handleContinue = () => {
//     // Show toast for expired licenses instead of inline banner
//     if (expiredProducts.length > 0) {
//       const expiredNames = expiredProducts.map((p:any) => {
//         const licenseInfo = getLicenseInfo(p);
//         return licenseInfo.licenseName;
//       }).join(", ");
//       toast.error(`Expired license(s) detected: ${expiredNames}. Please update with valid licenses.`);
//       return;
//     }
    
//     if (invalidGapProducts.length > 0) {
//       const gapNames = invalidGapProducts.map((p:any) => {
//         const licenseInfo = getLicenseInfo(p);
//         return licenseInfo.licenseName;
//       }).join(", ");
//       toast.error(`${gapNames} license validity cannot exceed 5 years. Please correct.`);
//       return;
//     }
    
//     const hasLicenseExistsErrors = Object.values(licenseExistsErrors).some(error => error !== "");
//     if (hasLicenseExistsErrors) {
//       toast.error("Please fix duplicate license numbers before continuing.");
//       return;
//     }
    
//     if (gstExistsError) {
//       toast.error("Please fix duplicate GST number before continuing.");
//       return;
//     }
    
//     nextStep();
//   };

//   if (formData.productTypes.length === 0) {
//     return (
//       <div className="flex flex-col gap-5 bg-white">
//         <div>
//           <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
//             Statutory Documents
//           </div>
//           <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
//             License and GST compliance upload
//           </div>
//         </div>
//         <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-xl">
//           <div className="flex items-center">
//             <span className="text-warning-800 text-xl mr-3">⚠️</span>
//             <div>
//               <p className="text-warning-800 font-medium">
//                 No product types selected
//               </p>
//               <p className="text-warning-700 text-p3 font-body font-regular mt-1">
//                 Please go back to Step 1 and select at least one product type.
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="flex justify-between mt-10">
//           <button onClick={prevStep} className="h-12 px-6 border-2 border-pneutral-900 text-pneutral-900 rounded-xl flex items-center gap-2">
//             <Image src="/icons/backbuttonicon.png" alt="Back" width={18} height={18} />
//             Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <div className="flex flex-col gap-6 bg-white">

//         {/* HEADER */}
//         <div>
//           <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
//             Statutory Documents
//           </div>
//           <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
//             License and GST compliance upload
//           </div>
//         </div>

//         {/* LICENSE SECTIONS */}
//         {formData.productTypes.map((productName: string) => {

//           const licenseInfo = getLicenseInfo(productName);

//           const licenseData = formData.licenses[productName] || {
//             number: "",
//             file: null,
//             issueDate: null,
//             expiryDate: null,
//             issuingAuthority: "",
//             status: "Expired"
//           };

//           const licenseFileName = licenseData.file?.name || "";
//           const isUploading = uploadingLicenses[productName];
//           const licenseError = licenseErrors[productName];
//           const licenseExistsError = licenseExistsErrors[productName];
//           const isCheckingLicense = checkingLicense[productName];
//           const issueDateError = dateErrors[`${productName}_issue`];
//           const expiryDateError = dateErrors[`${productName}_expiry`];
//           const gapError = dateErrors[`${productName}_gap`];
          
//           const currentStatus = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
//           const hasGapError = !!gapError;

//           // Status styling based on design system
//           const getStatusStyles = () => {
//             if (!licenseData.issueDate || !licenseData.expiryDate) {
//               return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
//             }
//             if (currentStatus === "Active") {
//               return { bg: "bg-success-300", text: "text-success-600", dot: "bg-success-600" };
//             }
//             if (currentStatus === "Expired") {
//               return { bg: "bg-warning-300", text: "text-warning-500", dot: "bg-warning-500" };
//             }
//             return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
//           };

//           const statusStyles = getStatusStyles();

//           return (
//             <div key={productName} className="mb-2">
              
//               {hasGapError && (
//                 <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
//                   <span className="text-red-500 text-base">⚠️</span>
//                   <p className="text-red-600 text-p3 font-body font-medium">
//                     {gapError}
//                   </p>
//                 </div>
//               )}

//               <div className="grid grid-cols-2 gap-x-6 gap-y-3">
//                 {/* LICENSE NUMBER */}
//                 <div className="flex flex-col gap-1">
//                   <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
//                     {licenseInfo.numberLabel}
//                     <span className="text-warning-500 font-semibold ml-1">*</span>
//                   </label>

//                   <div className="relative">
//                     <input
//                       type="text"
//                       autoComplete="off"
//                       name={`licenseNumber-${productName}`}
//                       value={licenseData.number}
//                       onChange={(e) => handleLicenseNumberChangeWithValidation(e, productName)}
//                       onKeyDown={(e) => handleLicenseKeyDown(e, licenseData.number)}
//                       onBlur={(e) => handleLicenseNumberBlur(e.target.value, productName)}
//                       placeholder={licenseInfo.placeholder}
//                       maxLength={30}
//                       className={`w-full h-13 pl-5 pr-4 rounded-xl border focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500 uppercase ${
//                         licenseError || licenseExistsError ? 'border-neutral-500' : 'border-neutral-500'
//                       }`}
//                     />
//                     {isCheckingLicense && (
//                       <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
//                       </div>
//                     )}
//                   </div>
//                   {licenseError && (
//                     <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
//                       <span className="mr-1">⚠️</span>
//                       <span>{licenseError}</span>
//                     </p>
//                   )}
//                   {licenseExistsError && !licenseError && (
//                     <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
//                       <span className="mr-1">⚠️</span>
//                       <span>{licenseExistsError}</span>
//                     </p>
//                   )}
//                 </div>

//                 {/* LICENSE FILE UPLOAD WITH CROSS BUTTON */}
//                 <div className="flex flex-col gap-1">
//                   <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
//                     {licenseInfo.fileLabel}
//                     <span className="text-warning-500 font-semibold ml-1">*</span>
//                   </label>

//                   <input
//                     id={`license-upload-${productName}`}
//                     type="file"
//                     name={`licenseFile-${productName}`}
//                     onChange={(e) => handleLicenseFileUpload(e, productName)}
//                     accept=".pdf,.jpg,.jpeg,.png"
//                     className="hidden"
//                     disabled={isUploading}
//                   />

//                   <div
//                     className="flex items-center border border-neutral-500 rounded-xl overflow-hidden h-13 bg-white cursor-pointer"
//                     onClick={() => document.getElementById(`license-upload-${productName}`)?.click()}
//                   >
//                     <div className="w-12 h-full bg-secondary-800 flex items-center justify-center">
//                       <Image
//                         src="/icons/upload.png"
//                         alt="Upload"
//                         width={18}
//                         height={18}
//                         className="brightness-0 invert"
//                       />
//                     </div>

//                     <div className="flex-1 h-full flex items-center justify-between px-3">
//                       <div className="flex-1 flex items-center min-w-0">
//                         {isUploading ? (
//                           <span className="text-p4 font-body font-regular text-pneutral-500">Uploading...</span>
//                         ) : licenseFileName ? (
//                           <div className="flex items-center gap-2 bg-sneutral-800 rounded-md px-3 py-1 max-w-fit">
//                             <span className="text-p4 font-body font-regular text-white truncate max-w-[120px]">
//                               {licenseFileName}
//                             </span>
//                             <button
//                               type="button"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 const syntheticEvent = {
//                                   target: { files: null }
//                                 } as any;
//                                 onFileChange(syntheticEvent, 'license', productName);
//                                 const fileInput = document.getElementById(`license-upload-${productName}`) as HTMLInputElement;
//                                 if (fileInput) fileInput.value = "";
//                               }}
//                               className="shrink-0"
//                               aria-label="Remove file"
//                             >
//                               <svg
//                                 xmlns="http://www.w3.org/2000/svg"
//                                 width="14"
//                                 height="14"
//                                 viewBox="0 0 24 24"
//                                 fill="none"
//                                 stroke="white"
//                                 strokeWidth="2"
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                               >
//                                 <line x1="18" y1="6" x2="6" y2="18" />
//                                 <line x1="6" y1="6" x2="18" y2="18" />
//                               </svg>
//                             </button>
//                           </div>
//                         ) : (
//                           <span className="text-p4 font-body font-regular text-pneutral-500">Upload the Certificate</span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* ISSUE DATE */}
//                 <div className="flex flex-col gap-1">
//                   <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
//                     {licenseInfo.issueDateLabel}
//                     <span className="text-warning-500 font-semibold ml-1">*</span>
//                   </label>

//                   <div>
//                     <DatePicker
//                       value={licenseData.issueDate}
//                       onChange={(date) =>
//                         handleDateInputChange(
//                           date,
//                           productName,
//                           "issue",
//                           handleIssueDateChangeWithValidation,
//                           setDateErrors
//                         )
//                       }
//                       maxDate={new Date()}
//                       format="dd/MM/yyyy"
//                       slotProps={{
//                         textField: {
//                           fullWidth: true,
//                           size: "small",
//                           placeholder: "DD/MM/YYYY",
//                           error: !!issueDateError,
//                           inputProps: {
//                             onKeyDown: handleDateInputKeyDown,
//                           },
//                           sx: {
//                             '& .MuiOutlinedInput-root': {
//                               height: '52px',
//                               borderRadius: '12px',
//                               backgroundColor: '#ffffff',
//                               '& .MuiOutlinedInput-notchedOutline': {
//                                 borderColor: issueDateError ? '#ef4444' : '#d1d5db',
//                               },
//                               '&:hover .MuiOutlinedInput-notchedOutline': {
//                                 borderColor: '#d1d5db',
//                               },
//                               '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                 borderColor: '#d1d5db',
//                               },
//                             },
//                             '& .MuiInputBase-input': {
//                               padding: '0 14px',
//                               fontSize: '16px',
//                               fontFamily: 'var(--font-body)',
//                               fontWeight: 400,
//                               color: '#1E1E1D',
//                               '&::placeholder': {
//                                 fontSize: '16px',
//                                 fontFamily: 'var(--font-body)',
//                                 fontWeight: 400,
//                                 color: '#969793',
//                               },
//                             },
//                           },
//                         },
//                       }}
//                     />
//                     {issueDateError && (
//                       <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
//                         <span className="mr-1">⚠️</span>
//                         <span>{issueDateError}</span>
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 {/* EXPIRY DATE */}
//                 <div className="flex flex-col gap-1">
//                   <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
//                     {licenseInfo.expiryDateLabel}
//                     <span className="text-warning-500 font-semibold ml-1">*</span>
//                   </label>

//                   <div>
//                     <DatePicker
//                       value={licenseData.expiryDate}
//                       onChange={(date) =>
//                         handleDateInputChange(
//                           date,
//                           productName,
//                           "expiry",
//                           handleExpiryDateChangeWithValidation,
//                           setDateErrors
//                         )
//                       }
//                       minDate={licenseData.issueDate || undefined}
//                       format="dd/MM/yyyy"
//                       slotProps={{
//                         textField: {
//                           fullWidth: true,
//                           size: "small",
//                           placeholder: "DD/MM/YYYY",
//                           error: !!expiryDateError,
//                           inputProps: {
//                             onKeyDown: handleDateInputKeyDown,
//                           },
//                           sx: {
//                             '& .MuiOutlinedInput-root': {
//                               height: '52px',
//                               borderRadius: '12px',
//                               backgroundColor: '#ffffff',
//                               '& .MuiOutlinedInput-notchedOutline': {
//                                 borderColor: expiryDateError ? '#ef4444' : '#d1d5db',
//                               },
//                               '&:hover .MuiOutlinedInput-notchedOutline': {
//                                 borderColor: '#d1d5db',
//                               },
//                               '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                 borderColor: '#d1d5db',
//                               },
//                             },
//                             '& .MuiInputBase-input': {
//                               padding: '0 14px',
//                               fontSize: '16px',
//                               fontFamily: 'var(--font-body)',
//                               fontWeight: 400,
//                               color: '#1E1E1D',
//                               '&::placeholder': {
//                                 fontSize: '16px',
//                                 fontFamily: 'var(--font-body)',
//                                 fontWeight: 400,
//                                 color: '#969793',
//                               },
//                             },
//                           },
//                         },
//                       }}
//                     />
//                     {expiryDateError && (
//                       <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
//                         <span className="mr-1">⚠️</span>
//                         <span>{expiryDateError}</span>
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 {/* ISSUING AUTHORITY */}
//                 <div className="flex flex-col gap-1">
//                   <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
//                     {licenseInfo.authorityLabel}
//                     <span className="text-warning-500 font-semibold ml-1">*</span>
//                   </label>

//                   <div className="relative">
//                     <input
//                       type="text"
//                       autoComplete="off"
//                       name={`issuingAuthority-${productName}`}
//                       value={licenseData.issuingAuthority}
//                       onChange={(e) => handleIssuingAuthorityInput(e, productName)}
//                       placeholder="Enter issuing authority"
//                       maxLength={150}
//                       className="w-full h-13 pl-5 pr-4 rounded-xl border border-neutral-500 focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500"
//                     />
//                   </div>
//                 </div>

//                 {/* LICENSE STATUS */}
//                 <div className="flex items-center gap-4 mt-1">
//                   <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
//                     {licenseInfo.statusLabel}
//                     <span className="text-warning-500 font-semibold ml-1">*</span>
//                   </label>

//                   <div
//                     className={`inline-flex items-center gap-2 px-4 h-8 rounded-full border
//                       ${
//                         currentStatus === "Active"
//                           ? "bg-success-50 border-success-600"
//                           : currentStatus === "Expired"
//                           ? "bg-warning-100 border-warning-500"
//                           : "bg-neutral-100 border-neutral-400"
//                       }
//                     `}
//                   >
//                     <div
//                       className={`w-2.5 h-2.5 rounded-full
//                         ${
//                           currentStatus === "Active"
//                             ? "bg-success-600"
//                             : currentStatus === "Expired"
//                             ? "bg-warning-500"
//                             : "bg-neutral-500"
//                         }
//                       `}
//                     />

//                     <span
//                       className={`text-p4 font-body font-medium
//                         ${
//                           currentStatus === "Active"
//                             ? "text-success-600"
//                             : currentStatus === "Expired"
//                             ? "text-warning-500"
//                             : "text-neutral-500"
//                         }
//                       `}
//                     >
//                       {!licenseData.issueDate || !licenseData.expiryDate
//                         ? "Pending"
//                         : currentStatus}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}

//         {/* GST SECTION */}
//         <div className="mt-2">
//           <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900 mb-3">
//             GSTIN Details
//           </h3>

//           <div className="grid grid-cols-2 gap-x-6 gap-y-3">
//             <div className="flex flex-col gap-1">
//               <label className="text-label-l4 font-heading font-semibold text-pneutral-900 leading-[24px]">
//                 GSTIN Number
//                 <span className="text-warning-500 font-semibold ml-1">*</span>
//               </label>

//               <div className="relative">
//                 <input
//                   type="text"
//                   name="gstNumber"
//                   autoComplete="off"
//                   value={formData.gstNumber}
//                   onChange={handleGSTChangeWithValidation}
//                   onBlur={(e) => handleGSTBlur(e.target.value)}
//                   placeholder="Enter GST number"
//                   maxLength={15}
//                   className={`w-full h-13 pl-5 pr-4 rounded-xl border focus:outline-none focus:ring-0 text-p4 font-body font-regular text-pneutral-900 placeholder:text-p4 placeholder:font-body placeholder:font-regular placeholder:text-pneutral-500 uppercase ${
//                     gstError || gstExistsError ? 'border-red-500' : 'border-neutral-500'
//                   }`}
//                 />
//                 {checkingGST && (
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
//                   </div>
//                 )}
//               </div>
//               {gstError && (
//                 <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
//                   <span className="mr-1">⚠️</span>
//                   <span>{gstError}</span>
//                 </p>
//               )}
//               {gstExistsError && !gstError && (
//                 <p className="mt-1 text-p2 font-body font-regular text-red-500 flex items-start">
//                   <span className="mr-1">⚠️</span>
//                   <span>{gstExistsError}</span>
//                 </p>
//               )}
//             </div>

//             {/* GST FILE UPLOAD WITH CROSS BUTTON */}
//             <div className="flex flex-col gap-1">
//               <label className="text-label-l4 font-heading font-medium text-pneutral-900 leading-[24px]">
//                 GST Certificate
//                 <span className="text-warning-500 font-semibold ml-1">*</span>
//               </label>

//               <input
//                 id="gst-upload"
//                 type="file"
//                 name="gstFile"
//                 onChange={handleGSTFileUpload}
//                 accept=".pdf,.jpg,.jpeg,.png"
//                 className="hidden"
//                 disabled={uploadingGST}
//               />

//               <div
//                 className="flex items-center border border-neutral-500 rounded-xl overflow-hidden h-13 bg-white cursor-pointer"
//                 onClick={() => document.getElementById('gst-upload')?.click()}
//               >
//                 <div className="w-12 h-full bg-secondary-800 flex items-center justify-center">
//                   <Image
//                     src="/icons/upload.png"
//                     alt="Upload"
//                     width={18}
//                     height={18}
//                     className="brightness-0 invert"
//                   />
//                 </div>

//                 <div className="flex-1 h-full flex items-center justify-between px-3">
//                   <div className="flex-1 flex items-center min-w-0">
//                     {uploadingGST ? (
//                       <span className="text-p4 font-body font-regular text-pneutral-500">Uploading...</span>
//                     ) : gstFileName ? (
//                       <div className="flex items-center gap-2 bg-sneutral-800 rounded-md px-3 py-1 max-w-fit">
//                         <span className="text-p4 font-body font-regular text-white truncate max-w-[120px]">
//                           {gstFileName}
//                         </span>
//                         <button
//                           type="button"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             const syntheticEvent = {
//                               target: { files: null }
//                             } as any;
//                             onFileChange(syntheticEvent, 'gstFile');
//                             const fileInput = document.getElementById('gst-upload') as HTMLInputElement;
//                             if (fileInput) fileInput.value = "";
//                           }}
//                           className="shrink-0"
//                           aria-label="Remove file"
//                         >
//                           <svg
//                             xmlns="http://www.w3.org/2000/svg"
//                             width="14"
//                             height="14"
//                             viewBox="0 0 24 24"
//                             fill="none"
//                             stroke="white"
//                             strokeWidth="2"
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                           >
//                             <line x1="18" y1="6" x2="6" y2="18" />
//                             <line x1="6" y1="6" x2="18" y2="18" />
//                           </svg>
//                         </button>
//                       </div>
//                     ) : (
//                       <span className="text-p4 font-body font-regular text-pneutral-500">Upload the Certificate</span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* BUTTONS */}
//         <div className="flex justify-between mt-10">
//           <div className="flex gap-4">
//             <button
//               onClick={() => router.push("/")}
//               className="flex h-12 border-2 justify-center items-center border-warning-500 text-warning-500 px-6 py-2 rounded-xl font-semibold"
//             >
//               Cancel
//             </button>
//           </div>

//           <div className="flex gap-4">
//             <button
//               onClick={prevStep}
//               className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-pneutral-900 text-pneutral-900 font-semibold"
//             >
//               <Image
//                 src="/icons/backbuttonicon.png"
//                 alt="Back"
//                 width={18}
//                 height={18}
//               />
//               Back
//             </button>

//             <button
//               onClick={handleContinue}
//               className="flex h-12 px-6 py-2 justify-center items-center gap-2 rounded-xl border-2 border-primary-800 text-primary-800 font-semibold"
//             >
//               Continue
//               <Image
//                 src="/icons/continueicon.png"
//                 alt="Continue"
//                 width={20}
//                 height={20}
//               />
//             </button>
//           </div>
//         </div>

//       </div>

//       {/* License Warning Popup */}
//       {warningState && (
//         <LicenseWarning
//           isOpen={warningState.isOpen}
//           licenseNumber={warningState.licenseNumber}
//            existingProductNames={warningState.existingProductNames}
//           newProductName={warningState.newProductName}
//           onConfirm={handleWarningConfirm}
//           onCancel={handleWarningCancel}
//         />
//       )}
//     </LocalizationProvider>
//   );
// }