"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Phone,
  MapPin,
  Download,
  ExternalLink,
  Pencil,
  ChevronUp,
  FileText,
  ChevronDown,
  Hash,
  Calendar,

  Globe,
  Mail,
  MapPin as MapPinIcon
} from "lucide-react";
import { GoCheckCircle } from "react-icons/go";
import { PiInfo } from "react-icons/pi";
import { MdSchedule } from "react-icons/md";
import { HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineBuildingOffice2, HiOutlineDocumentCheck, HiOutlineUser } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
import Image from "next/image";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { sellerProfileService } from "@/src/services/seller/sellerProfileService";

import { updateProfileService } from "@/src/services/seller/updateProfileService";
import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import { fetchBankDetails } from "@/src/services/seller/IFSCService";
import { type SellerProfile, type SellerDocument } from "@/src/types/seller/SellerProfileData";
import { uploadSellerDocuments, deleteUpdateRequest } from "@/src/services/seller/UpdateSellerProfileDoc";
import {
  CompanyTypeResponse,
  SellerTypeResponse,
  ProductTypeResponse,
  StateResponse,
  DistrictResponse,
  TalukaResponse,
} from "@/src/types/seller/SellerRegMasterData";

import {
  UpdateSellerProfileRequest
} from "@/src/types/seller/UpdateProfileData";

import { validateSection } from "@/src/schema/seller/UpdateProfileSchema";
import { ifscSchema } from "@/src/schema/seller/IFSCSchema";

import OtpVerificationModal from "./OtpVerificationModal";
import toast from "react-hot-toast";

// Validation regex patterns
const noConsecutiveSpaces = /^(?!.*\s{2,})[A-Za-z0-9\s.,#-]+$/;
const alphabetsOnly = /^[A-Za-z\s]+$/;
const alphanumericWithSpaces = /^[A-Za-z0-9\s]+$/;

// Helper function to calculate license status based on dates - returns only Active or InActive
const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): 'Active' | 'InActive' => {
  if (!issueDate || !expiryDate) {
    return 'InActive';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expiryDate);
  expDate.setHours(0, 0, 0, 0);

  // Check if expired
  if (expDate < today) {
    return 'InActive';
  }

  return 'Active';
};

// Function to check if date gap exceeds 5 years
// Function to check if date gap exceeds 5 years
const isDateGapExceedingFiveYears = (issueDate: Date | null, expiryDate: Date | null): boolean => {
  if (!issueDate || !expiryDate) return false;
  
  // Create copies to avoid mutating original dates
  const start = new Date(issueDate);
  const end = new Date(expiryDate);
  
  // Calculate difference in milliseconds
  const diffInMs = end.getTime() - start.getTime();
  
  // Convert to years (365.25 days average including leap years)
  const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
  
  // Return true if difference exceeds 5 years
  return diffInYears > 5;
};

// Drug License Number validation functions
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

// Function to clean and format license number on input
const formatLicenseNumber = (value: string): string => {
  let cleaned = value.toUpperCase();
  cleaned = cleaned.replace(/[^A-Z0-9\/\-]/g, '');
  return cleaned;
};

// Indian Mobile Number validation function
const validateIndianMobileNumber = (value: string): string | null => {
  const cleaned = value.replace(/\D/g, '');

  if (!cleaned) {
    return null;
  }

  if (cleaned.length !== 10) {
    return "Mobile number must be exactly 10 digits";
  }

  const firstDigit = cleaned.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return "Mobile number must start with 6, 7, 8, or 9";
  }

  return null;
};

// Seller Name validation
const validateSellerName = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Seller name is required";
  }
  if (value.length > 60) {
    return "Seller name cannot exceed 60 characters";
  }
  if (/\s{2,}/.test(value)) {
    return "Seller name should not contain consecutive spaces";
  }
  if (!noConsecutiveSpaces.test(value)) {
    return "Seller name contains invalid characters";
  }
  return null;
};

// City validation
const validateCity = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "City is required";
  }
  if (value.length > 100) {
    return "City cannot exceed 100 characters";
  }
  if (/\s{2,}/.test(value)) {
    return "City should not contain consecutive spaces";
  }
  return null;
};

// Street validation
const validateStreet = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Street is required";
  }
  if (value.length > 100) {
    return "Street cannot exceed 100 characters";
  }
  if (/\s{2,}/.test(value)) {
    return "Street should not contain consecutive spaces";
  }
  return null;
};

// Building Number validation
const validateBuildingNo = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Building number is required";
  }
  if (value.length > 50) {
    return "Building number cannot exceed 50 characters";
  }
  if (/\s{2,}/.test(value)) {
    return "Building number should not contain consecutive spaces";
  }
  return null;
};

// Pincode validation
const validatePincode = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Pin code is required";
  }
  if (value.length !== 6) {
    return "Pin code must be 6 digits";
  }
  if (!/^\d+$/.test(value)) {
    return "Pin code must contain only digits";
  }
  return null;
};

// Coordinator Name validation
const validateCoordinatorName = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Coordinator name is required";
  }
  if (value.length > 100) {
    return "Coordinator name cannot exceed 100 characters";
  }
  if (/\s{2,}/.test(value)) {
    return "Coordinator name should not contain consecutive spaces";
  }
  if (!alphanumericWithSpaces.test(value)) {
    return "Coordinator name should only contain letters, numbers, and spaces";
  }
  return null;
};

// Coordinator Designation validation
const validateCoordinatorDesignation = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Designation is required";
  }
  if (value.length > 100) {
    return "Designation cannot exceed 100 characters";
  }
  if (/\s{2,}/.test(value)) {
    return "Designation should not contain consecutive spaces";
  }
  if (!alphanumericWithSpaces.test(value)) {
    return "Designation should only contain letters, numbers, and spaces";
  }
  return null;
};

// Coordinator Email validation
const validateCoordinatorEmail = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "Invalid email format";
  }
  return null;
};

// GST Number validation
const validateGSTNumber = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "GST number is required";
  }
  if (value.length !== 15) {
    return "GST number must be 15 characters";
  }
  // Exact GST pattern from registration
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  if (!gstRegex.test(value)) {
    return "Invalid GST number format (e.g., 22AAAAA0000A1Z)";
  }
  return null;
};

// Account Number validation
const validateAccountNumber = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Account number is required";
  }
  if (!/^\d{9,18}$/.test(value)) {
    return "Account number must be 9 to 18 digits";
  }
  return null;
};

// Account Holder Name validation
const validateAccountHolderName = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Account holder name is required";
  }
  if (value.length > 100) {
    return "Account holder name cannot exceed 100 characters";
  }
  if (/\s{2,}/.test(value)) {
    return "Account holder name should not contain consecutive spaces";
  }
  if (!alphabetsOnly.test(value)) {
    return "Account holder name should only contain alphabets and spaces";
  }
  return null;
};

// IFSC validation
const validateIFSC = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "IFSC code is required";
  }
  if (value.length !== 11) {
    return "IFSC code must be 11 characters";
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(value)) {
    return "Invalid IFSC format";
  }
  return null;
};

// License Issuing Authority validation
// License Issuing Authority validation - Only alphanumeric and spaces
const validateIssuingAuthority = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Issuing authority is required";
  }
  if (value.length > 150) {
    return "Issuing authority cannot exceed 150 characters";
  }
  if (/\s{2,}/.test(value)) {
    return "Issuing authority should not contain consecutive spaces";
  }
  // Only allow alphanumeric characters and spaces (no special characters)
  if (!/^[A-Za-z0-9\s]+$/.test(value)) {
    return "Issuing authority should only contain letters, numbers, and spaces (no special characters)";
  }
  return null;
};

// Date validation
const validateIssueDate = (date: Date | null): string | null => {
  if (!date) {
    return "Issue date is required";
  }
  if (date.getFullYear() < 2000) {
    return "Year must be 2000 or greater";
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return "Issue date cannot be in the future";
  }
  return null;
};

const validateExpiryDate = (date: Date | null, issueDate: Date | null): string | null => {
  if (!date) {
    return "Expiry date is required";
  }
  if (date.getFullYear() < 2000) {
    return "Year must be 2000 or greater";
  }
  if (issueDate && date < issueDate) {
    return "Expiry date cannot be earlier than issue date";
  }
  return null;
};

interface UpdateProfileResponse {
  message?: string;
  pendingSellerId?: number;
  documents?: Array<{
    id?: number;
    pendingSellerDocumentId?: number;
    productTypeId?: number;
    productType?: {
      productTypeId: number;
    };
  }>;
  status?: string;
  data?: {
    status?: string;
    message?: string;
    data?: {
      status?: string;
      message?: string;
    };
  };
}

export default function SellerProfile() {
  const [profileData, setProfileData] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [reviewSections, setReviewSections] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [pendingRequestError, setPendingRequestError] = useState<string | null>(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | undefined>();
  const [pendingPhone, setPendingPhone] = useState<string | undefined>();
  const [pendingSectionData, setPendingSectionData] = useState<any>(null);
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const phoneCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const licenseCheckTimeoutRef = useRef<Record<string, NodeJS.Timeout | null>>({});
  const gstCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([]);
  const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([]);
  const [states, setStates] = useState<StateResponse[]>([]);
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [talukas, setTalukas] = useState<TalukaResponse[]>([]);
  const [sellerNameChanged, setSellerNameChanged] = useState(false);

  const [companyCertError, setCompanyCertError] = useState(false);
  const [gstCertError, setGSTCertError] = useState(false);
  // const [licenseCertError, setLicenseCertError] = useState(false);
  const [licenseCertErrors, setLicenseCertErrors] = useState<Record<string, boolean>>({});
  const [bankCertError, setBankCertError] = useState(false);
  const [ifscCodeChanged, setIfscCodeChanged] = useState(false);

  const [gstNumberChanged, setGstNumberChanged] = useState(false);
const [licenseNumbersChanged, setLicenseNumbersChanged] = useState<Record<string, boolean>>({});


  const handleSellerNameChangeWithTracking = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 60) return;

    setFormData(prev => ({ ...prev, sellerName: value }));
    const error = validateSellerName(value);
    setSellerNameError(error || "");

    // Track if seller name has changed from original profile data
    console.log("Profile data seller name:", profileData?.sellerName);
    console.log("Current value:", value);
    console.log("Is changed:", profileData && value !== profileData.sellerName);

    if (profileData && value !== profileData.sellerName) {
      setSellerNameChanged(true);
    } else {
      setSellerNameChanged(false);
    }
  };

  const [changedFiles, setChangedFiles] = useState<{
    gstFile: File | null;
    companyCertFile: File | null;
    bankFile: File | null;
    licenses: Array<{
      productName: string;
      productTypeId: number;
      file: File;
    }>;
  }>({
    gstFile: null,
    companyCertFile: null,
    bankFile: null,
    licenses: []
  });

  const [hasDocumentChanges, setHasDocumentChanges] = useState(false);

  const [sellerImagePreviewUrl, setSellerImagePreviewUrl] = useState<string | null>(null);
  const sellerImageInputRef = useRef<HTMLInputElement>(null);

  const [loadingStates, setLoadingStates] = useState({
    companyTypes: true,
    sellerTypes: true,
    productTypes: true,
    states: true,
    districts: false,
    talukas: false,
  });

  const [ifscError, setIfscError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExistsError, setPhoneExistsError] = useState("");
  const [companyPhoneError, setCompanyPhoneError] = useState("");
  const [coordinatorPhoneError, setCoordinatorPhoneError] = useState("");
  const [licenseErrors, setLicenseErrors] = useState<Record<string, string>>({});
  const [licenseExistsError, setLicenseExistsError] = useState<Record<string, string>>({});
  const [isCheckingLicense, setIsCheckingLicense] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inactiveLicenses, setInactiveLicenses] = useState<string[]>([]);
  const [showInactiveError, setShowInactiveError] = useState(false);

  // New validation error states
  const [sellerNameError, setSellerNameError] = useState("");
  const [cityError, setCityError] = useState("");
  const [streetError, setStreetError] = useState("");
  const [buildingNoError, setBuildingNoError] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [coordinatorNameError, setCoordinatorNameError] = useState("");
  const [coordinatorDesignationError, setCoordinatorDesignationError] = useState("");
  const [coordinatorEmailError, setCoordinatorEmailError] = useState("");
  const [gstNumberError, setGstNumberError] = useState("");
  const [accountNumberError, setAccountNumberError] = useState("");
  const [accountHolderNameError, setAccountHolderNameError] = useState("");
  const [ifscValidationError, setIfscValidationError] = useState("");
  const [licenseIssuingAuthorityErrors, setLicenseIssuingAuthorityErrors] = useState<Record<string, string>>({});
  const [licenseDateErrors, setLicenseDateErrors] = useState<Record<string, { issue?: string; expiry?: string; gap?: string }>>({});
  const [addressChanged, setAddressChanged] = useState(false);

  // GST check states
  const [isCheckingGST, setIsCheckingGST] = useState(false);
  const [gstExistsError, setGSTExistsError] = useState("");

  const [formData, setFormData] = useState({
    companyTypeId: 0,
    sellerTypeId: 0,
    productTypeIds: [] as number[],
    stateId: 0,
    districtId: 0,
    talukaId: 0,
    sellerName: "",
    companyType: "",
    sellerType: "",
    productTypes: [] as string[],
    state: "",
    district: "",
    taluka: "",
    city: "",
    street: "",
    buildingNo: "",
    landmark: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",
    coordinatorName: "",
    coordinatorDesignation: "",
    coordinatorEmail: "",
    coordinatorMobile: "",
    gstNumber: "",
    gstFile: null as File | null,
    gstFileUrl: "",
    companyRegistrationCertificateFile: null as File | null,
    companyRegistrationCertificateUrl: "",
    sellerImageFile: null as File | null,
    sellerImageUrl: "",
    licenses: {} as Record<string, {
      number: string;
      file: File | null;
      fileUrl: string;
      issueDate: Date | null;
      expiryDate: Date | null;
      issuingAuthority: string;
      status: 'Active' | 'InActive';
      productTypeId: number;
      documentId?: number;
    }>,
    bankState: "",
    bankDistrict: "",
    bankName: "",
    branch: "",
    ifscCode: "",
    accountNumber: "",
    accountHolderName: "",
    confirmAccountNumber: "",
    cancelledChequeFile: null as File | null,
    cancelledChequeFileUrl: "",
  });

  useEffect(() => {
    if (!formData.sellerImageFile) {
      setSellerImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(formData.sellerImageFile);
    setSellerImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.sellerImageFile]);

  // Helper function to scroll to specific error element
  const scrollToError = (errorType: string, productName?: string) => {
    if (errorType === 'email') {
      const emailElement = document.getElementById('coordinator-email-section');
      if (emailElement) {
        emailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
        setTimeout(() => {
          emailElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
        }, 3000);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (errorType === 'phone') {
      const phoneElement = document.getElementById('coordinator-phone-section');
      if (phoneElement) {
        phoneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
        setTimeout(() => {
          phoneElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
        }, 3000);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (errorType === 'license-exists' && productName) {
      const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        setTimeout(() => {
          element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        }, 3000);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (errorType === 'license-format' && productName) {
      const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        setTimeout(() => {
          element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        }, 3000);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (errorType === 'empty-license' && productName) {
      const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        setTimeout(() => {
          element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        }, 3000);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (errorType === 'gst') {
      const gstElement = document.getElementById('gst-section');
      if (gstElement) {
        gstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        gstElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        setTimeout(() => {
          gstElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        }, 3000);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (errorType === 'inactive-license') {
      const firstInactiveLicense = inactiveLicenses[0];
      if (firstInactiveLicense) {
        const elementId = `license-section-${firstInactiveLicense.replace(/\s/g, '-')}`;
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
          setTimeout(() => {
            element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
          }, 3000);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (errorType === 'seller-name') {
      const element = document.getElementById('seller-name-field');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        setTimeout(() => {
          element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
        }, 3000);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    return () => {
      if (phoneCheckTimeoutRef.current) {
        clearTimeout(phoneCheckTimeoutRef.current);
      }
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      if (gstCheckTimeoutRef.current) {
        clearTimeout(gstCheckTimeoutRef.current);
      }
      Object.values(licenseCheckTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  useEffect(() => {
    const inactive: string[] = [];
    Object.entries(formData.licenses).forEach(([productName, licenseData]) => {
      if (licenseData.issueDate && licenseData.expiryDate) {
        const status = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
        if (status === 'InActive') {
          inactive.push(productName);
        }
      }
    });
    setInactiveLicenses(inactive);
  }, [formData.licenses]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    fetchCompanyTypes();
    fetchStates();
    fetchSellerTypes();
    fetchProductTypes();
  }, []);

  const resetFormData = () => {
    if (profileData) {
      const licenses: Record<string, any> = {};
      profileData.documents.forEach((doc: SellerDocument) => {
        const productName = doc.productTypes?.productTypeName;
        if (productName) {
          const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
          const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
          const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

          licenses[productName] = {
            documentId: doc.sellerDocumentsId,
            number: doc.documentNumber || "",
            file: null,
            fileUrl: doc.documentFileUrl || "",
            issueDate: issueDate,
            expiryDate: expiryDate,
            issuingAuthority: doc.licenseIssuingAuthority || "",
            status: calculatedStatus,
            productTypeId: doc.productTypes?.productTypeId || 0
          };
        }
      });

      setFormData({
        companyTypeId: profileData.companyType?.companyTypeId || 0,
        sellerTypeId: profileData.sellerType?.sellerTypeId || 0,
        productTypeIds: profileData.productTypes.map(pt => pt.productTypeId),
        stateId: profileData.address?.state?.stateId || 0,
        districtId: profileData.address?.district?.districtId || 0,
        talukaId: profileData.address?.taluka?.talukaId || 0,
        sellerName: profileData.sellerName,
        companyType: profileData.companyType?.companyTypeName || '',
        sellerType: profileData.sellerType?.sellerTypeName || '',
        productTypes: profileData.productTypes.map(pt => pt.productTypeName),
        state: profileData.address?.state?.stateName || '',
        district: profileData.address?.district?.districtName || '',
        taluka: profileData.address?.taluka?.talukaName || '',
        city: profileData.address?.city || '',
        street: profileData.address?.street || '',
        buildingNo: profileData.address?.buildingNo || '',
        landmark: profileData.address?.landmark || '',
        pincode: profileData.address?.pinCode || '',
        phone: profileData.phone,
        email: profileData.email,
        website: profileData.website || '',
        coordinatorName: profileData.coordinator?.name || '',
        coordinatorDesignation: profileData.coordinator?.designation || '',
        coordinatorEmail: profileData.coordinator?.email || '',
        coordinatorMobile: profileData.coordinator?.mobile || '',
        gstNumber: profileData.sellerGST?.gstNumber || '',
        gstFile: null,
        gstFileUrl: profileData.sellerGST?.gstFileUrl || '',
        companyRegistrationCertificateFile: null,
        companyRegistrationCertificateUrl: profileData.companyRegistrationCertificateUrl || "",
        sellerImageFile: null,
        sellerImageUrl: profileData.sellerImageUrl || "",
        licenses,
        bankState: '',
        bankDistrict: '',
        bankName: profileData.bankDetails?.bankName || '',
        branch: profileData.bankDetails?.branch || '',
        ifscCode: profileData.bankDetails?.ifscCode || '',
        accountNumber: profileData.bankDetails?.accountNumber || '',
        accountHolderName: profileData.bankDetails?.accountHolderName || '',
        confirmAccountNumber: profileData.bankDetails?.accountNumber || '',
        cancelledChequeFile: null,
        cancelledChequeFileUrl: profileData.bankDetails?.bankDocumentFileUrl || '',
      });

      // Reset validation errors
      setSellerNameError("");
      setCityError("");
      setStreetError("");
      setBuildingNoError("");
      setPincodeError("");
      setCoordinatorNameError("");
      setCoordinatorDesignationError("");
      setCoordinatorEmailError("");
      setGstNumberError("");
      setAccountNumberError("");
      setAccountHolderNameError("");
      setIfscValidationError("");
      setLicenseErrors({});
      setLicenseExistsError({});
      setLicenseIssuingAuthorityErrors({});
      setLicenseDateErrors({});
      setGSTExistsError("");
      setCompanyPhoneError("");
      setCoordinatorPhoneError("");
      setPhoneExistsError("");
      setEmailExistsError("");
      setHasDocumentChanges(false);
      setInactiveLicenses([]);
      setShowInactiveError(false);
      setCompanyCertError(false);
      setGSTCertError(false);
      // setLicenseCertError(false);
      setBankCertError(false);
      setAddressChanged(false);
      setIfscCodeChanged(false);
      setLicenseCertErrors({});
      setGstNumberChanged(false);
setLicenseNumbersChanged({});

    }
  };

  const handleCancel = () => {
    resetFormData();
    setEditingSection(null);
    setChangedFiles({
      gstFile: null,
      companyCertFile: null,
      bankFile: null,
      licenses: []
    });
    setLicenseErrors({});
    setLicenseExistsError({});
    setLicenseIssuingAuthorityErrors({});
    setLicenseDateErrors({});
    setGSTExistsError("");
    setCompanyPhoneError("");
    setCoordinatorPhoneError("");
    setPhoneExistsError("");
    setEmailExistsError("");
    setHasDocumentChanges(false);
    setPendingRequestError(null);
    setInactiveLicenses([]);
    setShowInactiveError(false);
    setSellerNameError("");
    setCityError("");
    setStreetError("");
    setBuildingNoError("");
    setPincodeError("");
    setCoordinatorNameError("");
    setCoordinatorDesignationError("");
    setCoordinatorEmailError("");
    setGstNumberError("");
    setAccountNumberError("");
    setAccountHolderNameError("");
    setIfscValidationError("");
    setIfscCodeChanged(false);
    setLicenseCertErrors({});
    setGstNumberChanged(false);
setLicenseNumbersChanged({});
  };

  const fetchCompanyTypes = async () => {
    setLoadingStates(prev => ({ ...prev, companyTypes: true }));
    try {
      const data = await sellerRegMasterService.getCompanyTypes();
      setCompanyTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching company types:", error);
      toast.error("Failed to load company types");
      setCompanyTypes([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, companyTypes: false }));
    }
  };

  const fetchStates = async () => {
    setLoadingStates(prev => ({ ...prev, states: true }));
    try {
      const data = await sellerRegMasterService.getStates();
      setStates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching states:", error);
      toast.error("Failed to load states");
      setStates([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, states: false }));
    }
  };

  const fetchSellerTypes = async () => {
    setLoadingStates(prev => ({ ...prev, sellerTypes: true }));
    try {
      const data = await sellerRegMasterService.getSellerTypes();
      setSellerTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching seller types:", error);
      setSellerTypes([]);
      toast.error("Failed to load seller types");
    } finally {
      setLoadingStates(prev => ({ ...prev, sellerTypes: false }));
    }
  };

  const fetchProductTypes = async () => {
    setLoadingStates(prev => ({ ...prev, productTypes: true }));
    try {
      const data = await sellerRegMasterService.getProductTypes();
      setProductTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching product types:", error);
      setProductTypes([]);
      toast.error("Failed to load product types");
    } finally {
      setLoadingStates(prev => ({ ...prev, productTypes: false }));
    }
  };

  const fetchDistrictsByState = async (stateId: number) => {
    if (!stateId) return;
    setLoadingStates(prev => ({ ...prev, districts: true }));
    try {
      const data = await sellerRegMasterService.getDistrictsByStateId(stateId);
      setDistricts(data);
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
      toast.error("Failed to load districts");
    } finally {
      setLoadingStates(prev => ({ ...prev, districts: false }));
    }
  };

  const fetchTalukasByDistrict = async (districtId: number) => {
    if (!districtId) return;
    setLoadingStates(prev => ({ ...prev, talukas: true }));
    try {
      const data = await sellerRegMasterService.getTalukasByDistrictId(districtId);
      setTalukas(data);
    } catch (error) {
      console.error("Error fetching talukas:", error);
      setTalukas([]);
      toast.error("Failed to load talukas");
    } finally {
      setLoadingStates(prev => ({ ...prev, talukas: false }));
    }
  };

  // Function to check if GST number already exists
  const checkGSTNumberExists = async (gstNumber: string): Promise<boolean> => {
    console.log(`🔍 Checking GST number:`, gstNumber);

    if (!gstNumber || gstNumber.length < 15) {
      setGSTExistsError("");
      return false;
    }

    // Skip check if it's the same as existing GST number
    if (profileData?.sellerGST?.gstNumber?.toUpperCase() === gstNumber.toUpperCase()) {
      console.log(`GST number matches existing, skipping check`);
      setGSTExistsError("");
      return false;
    }

    setIsCheckingGST(true);
    setGSTExistsError("");

    try {
      const exists = await updateProfileService.checkGSTNumber(gstNumber);
      console.log(`GST check result for ${gstNumber}:`, exists);

      if (exists) {
        console.log(`GST number ${gstNumber} already exists!`);
        setGSTExistsError("⚠️ This GST number is already registered. Please use a different GST number.");
        return true;
      }
      console.log(`GST number ${gstNumber} is available`);
      setGSTExistsError("");
      return false;
    } catch (error: any) {
      console.error("Error checking GST number:", error);
      setGSTExistsError("");
      return false;
    } finally {
      setIsCheckingGST(false);
    }
  };

  // Function to check if license number already exists
  // const checkLicenseNumberExists = async (licenseNumber: string, productName: string): Promise<boolean> => {
  //   if (!licenseNumber || licenseNumber.length < 8) {
  //     setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
  //     return false;
  //   }

  //   const existingDoc = profileData?.documents.find(
  //     doc => doc.productTypes?.productTypeName === productName
  //   );

  //   if (existingDoc?.documentNumber?.toUpperCase() === licenseNumber.toUpperCase()) {
  //     setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
  //     return false;
  //   }

  //   setIsCheckingLicense(prev => ({ ...prev, [productName]: true }));
  //   setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));

  //   try {
  //     const exists = await updateProfileService.checkLicenseDocumentNumber(licenseNumber);
  //     if (exists) {
  //       setLicenseExistsError(prev => ({
  //         ...prev,
  //         [productName]: "This license number is already registered. Please use a different license number."
  //       }));
  //       return true;
  //     }
  //     setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
  //     return false;
  //   } catch (error: any) {
  //     console.error("Error checking license number:", error);
  //     if (error.response?.status !== 404) {
  //       setLicenseExistsError(prev => ({
  //         ...prev,
  //         [productName]: "Failed to verify license number. Please try again."
  //       }));
  //     }
  //     return false;
  //   } finally {
  //     setIsCheckingLicense(prev => ({ ...prev, [productName]: false }));
  //   }
  // };
  const checkLicenseNumberExists = async (licenseNumber: string, productName: string): Promise<boolean> => {
  if (!licenseNumber || licenseNumber.length < 8) {
    setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
    return false;
  }

  // Check if this license number already exists for the SAME product type (current seller)
  const existingDocForSameProduct = profileData?.documents.find(
    doc => doc.productTypes?.productTypeName === productName
  );

  // If it's the same license number as what this seller already has for THIS product type
  if (existingDocForSameProduct?.documentNumber?.toUpperCase() === licenseNumber.toUpperCase()) {
    setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
    return false;
  }

  // CRITICAL FIX: Check if this license number belongs to the CURRENT seller for ANY product type
  const belongsToCurrentSeller = profileData?.documents.some(
    doc => doc.documentNumber?.toUpperCase() === licenseNumber.toUpperCase()
  );

  if (belongsToCurrentSeller) {
    // ✅ Allow - it's the seller's own license (can be used across different product types)
    setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
    return false;
  }

  setIsCheckingLicense(prev => ({ ...prev, [productName]: true }));
  setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));

  try {
    // Check if ANY OTHER seller (not current) has this license number
    const exists = await updateProfileService.checkLicenseDocumentNumber(licenseNumber);
    
    if (exists) {
      // ❌ Block - it's another seller's license
      setLicenseExistsError(prev => ({
        ...prev,
        [productName]: "⚠️ This license number is already registered by another seller. Please use a different license number."
      }));
      return true;
    }
    
    // ✅ Allow - license number is available
    setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
    return false;
    
  } catch (error: any) {
    console.error("Error checking license number:", error);
    // If API returns 404, license doesn't exist (that's fine)
    if (error.response?.status === 404) {
      setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
      return false;
    }
    
    // For other errors, show warning but don't block
    setLicenseExistsError(prev => ({
      ...prev,
      [productName]: "Failed to verify license number. Please try again."
    }));
    return false;
  } finally {
    setIsCheckingLicense(prev => ({ ...prev, [productName]: false }));
  }
};

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setAddressChanged(false);

        const data = await sellerProfileService.getCurrentSellerProfile();
        setProfileData(data);

        if (data) {
          const licenses: Record<string, any> = {};
          data.documents.forEach((doc: SellerDocument) => {
            const productName = doc.productTypes?.productTypeName;
            if (productName) {
              const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
              const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
              const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

              licenses[productName] = {
                number: doc.documentNumber || "",
                file: null,
                fileUrl: doc.documentFileUrl || "",
                issueDate: issueDate,
                expiryDate: expiryDate,
                issuingAuthority: doc.licenseIssuingAuthority || "",
                status: calculatedStatus,
                productTypeId: doc.productTypes?.productTypeId || 0
              };
            }
          });

          setFormData({
            companyTypeId: data.companyType?.companyTypeId || 0,
            sellerTypeId: data.sellerType?.sellerTypeId || 0,
            productTypeIds: data.productTypes.map(pt => pt.productTypeId),
            stateId: data.address?.state?.stateId || 0,
            districtId: data.address?.district?.districtId || 0,
            talukaId: data.address?.taluka?.talukaId || 0,
            sellerName: data.sellerName,
            companyType: data.companyType?.companyTypeName || '',
            sellerType: data.sellerType?.sellerTypeName || '',
            productTypes: data.productTypes.map(pt => pt.productTypeName),
            state: data.address?.state?.stateName || '',
            district: data.address?.district?.districtName || '',
            taluka: data.address?.taluka?.talukaName || '',
            city: data.address?.city || '',
            street: data.address?.street || '',
            buildingNo: data.address?.buildingNo || '',
            landmark: data.address?.landmark || '',
            pincode: data.address?.pinCode || '',
            phone: data.phone,
            email: data.email,
            website: data.website || '',
            coordinatorName: data.coordinator?.name || '',
            coordinatorDesignation: data.coordinator?.designation || '',
            coordinatorEmail: data.coordinator?.email || '',
            coordinatorMobile: data.coordinator?.mobile || '',
            gstNumber: data.sellerGST?.gstNumber || '',
            gstFile: null,
            gstFileUrl: data.sellerGST?.gstFileUrl || '',
            companyRegistrationCertificateFile: null,
            companyRegistrationCertificateUrl: data.companyRegistrationCertificateUrl || "",
            sellerImageFile: null,
            sellerImageUrl: data.sellerImageUrl || "",
            licenses,
            bankState: '',
            bankDistrict: '',
            bankName: data.bankDetails?.bankName || '',
            branch: data.bankDetails?.branch || '',
            ifscCode: data.bankDetails?.ifscCode || '',
            accountNumber: data.bankDetails?.accountNumber || '',
            accountHolderName: data.bankDetails?.accountHolderName || '',
            confirmAccountNumber: data.bankDetails?.accountNumber || '',
            cancelledChequeFile: null,
            cancelledChequeFileUrl: data.bankDetails?.bankDocumentFileUrl || '',
          });

          setLicenseCertErrors({});
          setGstNumberChanged(false);
setLicenseNumbersChanged({});

          if (data.address?.state?.stateId) {
            fetchDistrictsByState(data.address.state.stateId);
          }
          if (data.address?.district?.districtId) {
            fetchTalukasByDistrict(data.address.district.districtId);
          }
        }

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



const checkIfAddressChanged = (): boolean => {
  if (!profileData?.address) return false;
  
  const originalAddress = profileData.address;
  const currentAddress = formData;
  
  const hasAddressChanged = (
    originalAddress.state?.stateId !== currentAddress.stateId ||
    originalAddress.district?.districtId !== currentAddress.districtId ||
    originalAddress.taluka?.talukaId !== currentAddress.talukaId ||
    originalAddress.city !== currentAddress.city ||
    originalAddress.street !== currentAddress.street ||
    originalAddress.buildingNo !== currentAddress.buildingNo ||
    originalAddress.landmark !== currentAddress.landmark ||
    originalAddress.pinCode !== currentAddress.pincode
  );
  
  return hasAddressChanged;
};

const checkIfIfscCodeChanged = (): boolean => {
  if (!profileData?.bankDetails?.ifscCode) return false;
  
  const originalIfsc = profileData.bankDetails.ifscCode;
  const currentIfsc = formData.ifscCode;
  
  const hasIfscChanged = originalIfsc !== currentIfsc;
  
  console.log("IFSC change check:", {
    originalIfsc,
    currentIfsc,
    hasIfscChanged
  });
  
  return hasIfscChanged;
};

const checkIfGstNumberChanged = (): boolean => {
  if (!profileData?.sellerGST?.gstNumber) return false;
  
  const originalGst = profileData.sellerGST.gstNumber;
  const currentGst = formData.gstNumber;
  
  const hasGstChanged = originalGst !== currentGst;
  
  console.log("GST change check:", {
    originalGst,
    currentGst,
    hasGstChanged
  });
  
  return hasGstChanged;
};


const checkIfLicenseNumberChanged = (productName: string): boolean => {
  if (!profileData?.documents) return false;
  
  const originalDoc = profileData.documents.find(
    doc => doc.productTypes?.productTypeName === productName
  );
  
  const originalNumber = originalDoc?.documentNumber || '';
  const currentNumber = formData.licenses[productName]?.number || '';
  
  const hasChanged = originalNumber !== currentNumber;
  
  if (hasChanged) {
    console.log(`License number changed for ${productName}:`, {
      original: originalNumber,
      current: currentNumber
    });
  }
  
  return hasChanged;
};

  const handleGSTFileChange = (file: File) => {
    setFormData(prev => ({
      ...prev,
      gstFile: file,
      gstFileUrl: "PENDING"
    }));
    setChangedFiles(prev => ({ ...prev, gstFile: file }));
    setHasDocumentChanges(true);

    if (gstCertError) {
    setGSTCertError(false);
  }
  };

  const handleSellerImageFileChange = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, and PNG files are allowed for the logo");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo size should be less than 5MB");
      return;
    }

    setFormData(prev => ({
      ...prev,
      sellerImageFile: file,
      sellerImageUrl: "PENDING"
    }));
    setHasDocumentChanges(true);
  };

  const handleCompanyCertFileChange = (file: File) => {
    setFormData(prev => ({
      ...prev,
      companyRegistrationCertificateFile: file,
      companyRegistrationCertificateUrl: "PENDING"
    }));
    setChangedFiles(prev => ({ ...prev, companyCertFile: file }));
    setHasDocumentChanges(true);
    if (companyCertError) {
    setCompanyCertError(false);
  }
  };

const handleBankFileChange = (file: File) => {
  setFormData(prev => ({
    ...prev,
    cancelledChequeFile: file,
    cancelledChequeFileUrl: "PENDING"
  }));
  setChangedFiles(prev => ({ ...prev, bankFile: file }));
  setHasDocumentChanges(true);
  
  // Clear bank certificate error when new file is uploaded
  if (bankCertError) {
    setBankCertError(false);
  }
};

const handleLicenseFileChange = (file: File, productName: string, productTypeId: number) => {
  setFormData(prev => ({
    ...prev,
    licenses: {
      ...prev.licenses,
      [productName]: {
        ...prev.licenses[productName],
        file: file,
        fileUrl: "PENDING",
      },
    },
  }));

  setChangedFiles(prev => ({
    ...prev,
    licenses: [
      ...prev.licenses.filter(l => l.productName !== productName),
      { productName, productTypeId, file }
    ]
  }));
  setHasDocumentChanges(true);
  
  // Clear license certificate error for THIS SPECIFIC license when file is uploaded
  if (licenseCertErrors[productName]) {
    setLicenseCertErrors(prev => ({ ...prev, [productName]: false }));
  }
};

  // const handleLicenseFileChange = (file: File, productName: string, productTypeId: number) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     licenses: {
  //       ...prev.licenses,
  //       [productName]: {
  //         ...prev.licenses[productName],
  //         file: file,
  //         fileUrl: "PENDING",
  //       },
  //     },
  //   }));

  //   setChangedFiles(prev => ({
  //     ...prev,
  //     licenses: [
  //       ...prev.licenses.filter(l => l.productName !== productName),
  //       { productName, productTypeId, file }
  //     ]
  //   }));
  //   setHasDocumentChanges(true);
  // };

  const handleSellerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 60) return;

    setFormData(prev => ({ ...prev, sellerName: value }));
    const error = validateSellerName(value);
    setSellerNameError(error || "");
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 100) return;
    value = value.replace(/\s{2,}/g, ' ');
    setFormData(prev => ({ ...prev, city: value }));
    const error = validateCity(value);
    setCityError(error || "");
     setAddressChanged(checkIfAddressChanged());
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 100) return;
    value = value.replace(/\s{2,}/g, ' ');
    setFormData(prev => ({ ...prev, street: value }));
    const error = validateStreet(value);
    setStreetError(error || "");
    setAddressChanged(checkIfAddressChanged());
  };

  const handleBuildingNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 50) return;
    value = value.replace(/\s{2,}/g, ' ');
    setFormData(prev => ({ ...prev, buildingNo: value }));
    const error = validateBuildingNo(value);
    setBuildingNoError(error || "");
    setAddressChanged(checkIfAddressChanged());
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: value }));
    const error = validatePincode(value);
    setPincodeError(error || "");
    setAddressChanged(checkIfAddressChanged());
  };

  const handleLandmarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value;
  if (value.length > 100) return;
  setFormData(prev => ({ ...prev, landmark: value }));
  
  // Track address change
  setAddressChanged(checkIfAddressChanged());
};

  const handleCoordinatorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 100) return;
    setFormData(prev => ({ ...prev, coordinatorName: value }));
    const error = validateCoordinatorName(value);
    setCoordinatorNameError(error || "");
  };

  const handleCoordinatorDesignationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 100) return;
    setFormData(prev => ({ ...prev, coordinatorDesignation: value }));
    const error = validateCoordinatorDesignation(value);
    setCoordinatorDesignationError(error || "");
  };

  const handleCoordinatorEmailChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, coordinatorEmail: value }));
    const error = validateCoordinatorEmail(value);
    setCoordinatorEmailError(error || "");
  };

  const handleGSTChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^0-9A-Z]/g, '');
    if (value.length > 15) value = value.slice(0, 15);
    setFormData(prev => ({ ...prev, gstNumber: value }));

    const error = validateGSTNumber(value);
    setGstNumberError(error || "");

    // Track if GST number has changed
  if (profileData?.sellerGST?.gstNumber?.toUpperCase() !== value) {
    setGstNumberChanged(true);
  } else {
    setGstNumberChanged(false);
  }

    if (gstExistsError) {
      setGSTExistsError("");
    }

    if (gstCheckTimeoutRef.current) {
      clearTimeout(gstCheckTimeoutRef.current);
    }

    if (profileData?.sellerGST?.gstNumber?.toUpperCase() === value.toUpperCase()) {
      setGSTExistsError("");
      return;
    }

    if (value.length === 15 && !error) {
      gstCheckTimeoutRef.current = setTimeout(async () => {
        await checkGSTNumberExists(value);
        gstCheckTimeoutRef.current = null;
      }, 500);
    }
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 18) value = value.slice(0, 18);
    setFormData(prev => ({ ...prev, accountNumber: value }));
    const error = validateAccountNumber(value);
    setAccountNumberError(error || "");

    // Also clear confirm account number if account number changes
    if (formData.confirmAccountNumber && formData.confirmAccountNumber !== value) {
      setFormData(prev => ({ ...prev, confirmAccountNumber: "" }));
    }
  };

  const handleConfirmAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 18) value = value.slice(0, 18);
    setFormData(prev => ({ ...prev, confirmAccountNumber: value }));
  };

  const handleAccountHolderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 100) return;
    value = value.replace(/[^A-Za-z\s]/g, '');
    value = value.replace(/\s{2,}/g, ' ');
    setFormData(prev => ({ ...prev, accountHolderName: value }));
    const error = validateAccountHolderName(value);
    setAccountHolderNameError(error || "");
  };

  const handleLicenseNumberChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    const value = e.target.value;
    const cleanedValue = formatLicenseNumber(value);

    if (cleanedValue !== value) {
      return;
    }

    if (cleanedValue.length > 30) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      licenses: {
        ...prev.licenses,
        [productName]: {
          ...prev.licenses[productName],
          number: cleanedValue,
        },
      },
    }));

      // Track if license number has changed
  const originalDoc = profileData?.documents.find(
    doc => doc.productTypes?.productTypeName === productName
  );
  const originalNumber = originalDoc?.documentNumber || '';
  const hasChanged = originalNumber !== cleanedValue;
  
  setLicenseNumbersChanged(prev => ({
    ...prev,
    [productName]: hasChanged
  }));

    const formatError = validateDrugLicenseNumber(cleanedValue);
    setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

    if (licenseExistsError[productName]) {
      setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
    }

    if (!formatError && cleanedValue.length >= 8) {
      if (licenseCheckTimeoutRef.current[productName]) {
        clearTimeout(licenseCheckTimeoutRef.current[productName]!);
      }

      licenseCheckTimeoutRef.current[productName] = setTimeout(async () => {
        await checkLicenseNumberExists(cleanedValue, productName);
        licenseCheckTimeoutRef.current[productName] = null;
      }, 500);
    }
  };

  // Replace the handleLicenseKeyDown function with this:
  const handleLicenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow all navigation and control keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Allow Ctrl/Cmd + V for paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      return;
    }

    // Allow Ctrl/Cmd + C for copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      return;
    }

    // Allow Ctrl/Cmd + X for cut
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
      return;
    }

    // Allow Ctrl/Cmd + A for select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      return;
    }

    // Block invalid characters - only allow alphanumeric, hyphens, and slashes
    const allowedChars = /^[A-Za-z0-9\/\-]$/;
    if (!allowedChars.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleLicensePaste = async (e: React.ClipboardEvent<HTMLInputElement>, productName: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    let cleanedText = pastedText.toUpperCase();
    cleanedText = cleanedText.replace(/[^A-Z0-9\/\-]/g, '');
    if (cleanedText.length > 30) {
      cleanedText = cleanedText.substring(0, 30);
    }

    setFormData(prev => ({
      ...prev,
      licenses: {
        ...prev.licenses,
        [productName]: {
          ...prev.licenses[productName],
          number: cleanedText,
        },
      },
    }));

    const formatError = validateDrugLicenseNumber(cleanedText);
    setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

    if (!formatError && cleanedText.length >= 8) {
      await checkLicenseNumberExists(cleanedText, productName);
    }
  };

  const handleLicenseNumberBlur = async (value: string, productName: string) => {
    const formatError = validateDrugLicenseNumber(value);
    setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

    if (!formatError && value.length >= 8) {
      await checkLicenseNumberExists(value, productName);
    }
  };

 const handleIssuingAuthorityChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
  let value = e.target.value;
  if (value.length > 150) return;
  
  // Remove any special characters (only allow alphanumeric and spaces)
  value = value.replace(/[^A-Za-z0-9\s]/g, '');
  // Prevent consecutive spaces
  value = value.replace(/\s{2,}/g, ' ');
  
  setFormData(prev => ({
    ...prev,
    licenses: {
      ...prev.licenses,
      [productName]: {
        ...prev.licenses[productName],
        issuingAuthority: value,
      },
    },
  }));
  const error = validateIssuingAuthority(value);
  setLicenseIssuingAuthorityErrors(prev => ({ ...prev, [productName]: error || "" }));
};

const handleIssuingAuthorityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Allow all navigation and control keys
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Space'];
  if (allowedKeys.includes(e.key)) {
    return;
  }

  // Allow Ctrl/Cmd + V for paste
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    return;
  }

  // Allow Ctrl/Cmd + C for copy
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    return;
  }

  // Allow Ctrl/Cmd + X for cut
  if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
    return;
  }

  // Allow Ctrl/Cmd + A for select all
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    return;
  }

  // Block special characters - only allow alphanumeric and space
  const allowedChars = /^[A-Za-z0-9]$/;
  if (!allowedChars.test(e.key) && e.key !== ' ') {
    e.preventDefault();
  }
};

 const handleIssueDateChangeWithValidation = (date: Date | null, productName: string) => {
  if (date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date > today) {
      toast.error("Issue date cannot be greater than today's date");
      return;
    }
  }

  setFormData(prev => {
    const updatedLicenses = { ...prev.licenses };
    if (updatedLicenses[productName]) {
      const newStatus = calculateLicenseStatus(date, updatedLicenses[productName].expiryDate);
      updatedLicenses[productName] = {
        ...updatedLicenses[productName],
        issueDate: date,
        status: newStatus,
      };
    }
    return { ...prev, licenses: updatedLicenses };
  });

  const error = validateIssueDate(date);
  
  // Check for date gap with existing expiry date
  const expiryDate = formData.licenses[productName]?.expiryDate;
  let gapError = "";
  if (date && expiryDate && isDateGapExceedingFiveYears(date, expiryDate)) {
    gapError = "License validity cannot exceed 5 years from issue date";
  }
  
  setLicenseDateErrors(prev => ({
    ...prev,
    [productName]: { 
      ...prev[productName], 
      issue: error || "",
      gap: gapError
    }
  }));
};

const handleExpiryDateChangeWithValidation = (date: Date | null, productName: string) => {
  // Ensure date is valid
  if (date) {
    date.setHours(0, 0, 0, 0);
  }
  
  setFormData(prev => {
    const updatedLicenses = { ...prev.licenses };
    if (updatedLicenses[productName]) {
      const newStatus = calculateLicenseStatus(updatedLicenses[productName].issueDate, date);
      updatedLicenses[productName] = {
        ...updatedLicenses[productName],
        expiryDate: date,
        status: newStatus,
      };
    }
    return { ...prev, licenses: updatedLicenses };
  });

  const issueDate = formData.licenses[productName]?.issueDate;
  const error = validateExpiryDate(date, issueDate);
  
  // Check for 5-year gap validation
  let gapError = "";
  if (issueDate && date && isDateGapExceedingFiveYears(issueDate, date)) {
    gapError = "License validity cannot exceed 5 years from issue date";
  }
  
  setLicenseDateErrors(prev => ({
    ...prev,
    [productName]: { 
      ...prev[productName], 
      expiry: error || "",
      gap: gapError
    }
  }));
};

  const handleProductTypeToggle = (product: ProductTypeResponse) => {
    if (!product) return;

    setFormData(prev => {
      let newProductTypeIds = [...prev.productTypeIds];
      let newProductTypes = [...prev.productTypes];
      const newLicenses = { ...prev.licenses };

      if (newProductTypeIds.includes(product.productTypeId)) {
        newProductTypeIds = newProductTypeIds.filter(id => id !== product.productTypeId);
        newProductTypes = newProductTypes.filter(name => name !== product.productTypeName);
        delete newLicenses[product.productTypeName];
        setLicenseErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[product.productTypeName];
          return newErrors;
        });
        setLicenseExistsError(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[product.productTypeName];
          return newErrors;
        });
        setLicenseIssuingAuthorityErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[product.productTypeName];
          return newErrors;
        });
        setLicenseDateErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[product.productTypeName];
          return newErrors;
        });
      } else {
        newProductTypeIds.push(product.productTypeId);
        newProductTypes.push(product.productTypeName);

        const existingDoc = profileData?.documents.find(
          doc => doc.productTypes?.productTypeId === product.productTypeId
        );

        if (existingDoc) {
          const issueDate = existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null;
          const expiryDate = existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null;
          const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

          newLicenses[product.productTypeName] = {
            documentId: existingDoc.sellerDocumentsId,
            number: existingDoc.documentNumber || "",
            file: null,
            fileUrl: existingDoc.documentFileUrl || "",
            issueDate: issueDate,
            expiryDate: expiryDate,
            issuingAuthority: existingDoc.licenseIssuingAuthority || "",
            status: calculatedStatus,
            productTypeId: product.productTypeId
          };
        } else {
          newLicenses[product.productTypeName] = {
            number: "",
            file: null,
            fileUrl: "",
            issueDate: null,
            expiryDate: null,
            issuingAuthority: "",
            status: 'InActive',
            productTypeId: product.productTypeId
          };
        }
      }

      return {
        ...prev,
        productTypeIds: newProductTypeIds,
        productTypes: newProductTypes,
        licenses: newLicenses,
      };
    });
  };

  const handleSelectAllProductTypes = () => {
    if (!productTypes.length) return;

    if (formData.productTypes.length === productTypes.length) {
      setFormData(prev => ({
        ...prev,
        productTypeIds: [],
        productTypes: [],
        licenses: {},
      }));
      setLicenseErrors({});
      setLicenseExistsError({});
      setLicenseIssuingAuthorityErrors({});
      setLicenseDateErrors({});
    } else {
      const allIds = productTypes.map(p => p.productTypeId);
      const allNames = productTypes.map(p => p.productTypeName);

      const newLicenses: Record<string, any> = {};

      allNames.forEach(name => {
        const product = productTypes.find(p => p.productTypeName === name);
        if (!product) return;

        const existingDoc = profileData?.documents.find(
          doc => doc.productTypes?.productTypeId === product.productTypeId
        );

        if (existingDoc) {
          const issueDate = existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null;
          const expiryDate = existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null;
          const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

          newLicenses[name] = {
            documentId: existingDoc.sellerDocumentsId,
            number: existingDoc.documentNumber || "",
            file: null,
            fileUrl: existingDoc.documentFileUrl || "",
            issueDate: issueDate,
            expiryDate: expiryDate,
            issuingAuthority: existingDoc.licenseIssuingAuthority || "",
            status: calculatedStatus,
            productTypeId: product.productTypeId
          };
        } else {
          newLicenses[name] = {
            number: "",
            file: null,
            fileUrl: "",
            issueDate: null,
            expiryDate: null,
            issuingAuthority: "",
            status: 'InActive',
            productTypeId: product.productTypeId
          };
        }
      });

      setFormData(prev => ({
        ...prev,
        productTypeIds: allIds,
        productTypes: allNames,
        licenses: newLicenses,
      }));
    }
  };

  const handleStateChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0;
    const selectedState = states.find(s => s.stateId === selectedId);

    setFormData(prev => ({
      ...prev,
      stateId: selectedId,
      state: selectedState?.stateName || "",
      districtId: 0,
      district: "",
      talukaId: 0,
      taluka: "",
    }));
    setAddressChanged(checkIfAddressChanged());

    setDistricts([]);
    setTalukas([]);

    if (selectedId) {
      fetchDistrictsByState(selectedId);
    }
  };

  const handleDistrictChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0;
    const selectedDistrict = districts.find(d => d.districtId === selectedId);

    setFormData(prev => ({
      ...prev,
      districtId: selectedId,
      district: selectedDistrict?.districtName || "",
      talukaId: 0,
      taluka: "",
    }));

    setTalukas([]);

    setAddressChanged(checkIfAddressChanged());

    if (selectedId) {
      fetchTalukasByDistrict(selectedId);
    }
  };

  const handleTalukaChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0;
    const selectedTaluka = talukas.find(t => t.talukaId === selectedId);

    setFormData(prev => ({
      ...prev,
      talukaId: selectedId,
      taluka: selectedTaluka?.talukaName || "",
    }));
    setAddressChanged(checkIfAddressChanged());
  };

  const handleCompanyTypeChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0;
    const selectedCompany = companyTypes.find(c => c.companyTypeId === selectedId);

    setFormData(prev => ({
      ...prev,
      companyTypeId: selectedId,
      companyType: selectedCompany?.companyTypeName || "",
    }));
  };

  const handleSellerTypeChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0;
    const selectedSeller = sellerTypes.find(s => s.sellerTypeId === selectedId);

    setFormData(prev => ({
      ...prev,
      sellerTypeId: selectedId,
      sellerType: selectedSeller?.sellerTypeName || "",
    }));
  };

  const handleGSTBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!value || value.length !== 15) {
      return;
    }

    if (profileData?.sellerGST?.gstNumber?.toUpperCase() === value.toUpperCase()) {
      setGSTExistsError("");
      return;
    }

    await checkGSTNumberExists(value);
  };

  const handleCompanyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);

    let cleanValue = value;
    if (cleanValue.startsWith('91')) {
      cleanValue = cleanValue.substring(2);
    }

    setFormData(prev => ({ ...prev, phone: cleanValue }));

    const error = validateIndianMobileNumber(cleanValue);
    setCompanyPhoneError(error || "");
  };

  const handleCompanyPhoneBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('91')) {
      value = value.substring(2);
    }
    const error = validateIndianMobileNumber(value);
    setCompanyPhoneError(error || "");
  };

  const handleCoordinatorPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);

    let cleanValue = value;
    if (cleanValue.startsWith('91')) {
      cleanValue = cleanValue.substring(2);
    }

    setFormData(prev => ({ ...prev, coordinatorMobile: cleanValue }));

    const error = validateIndianMobileNumber(cleanValue);
    setCoordinatorPhoneError(error || "");

    if (phoneExistsError) {
      setPhoneExistsError("");
    }

    if (phoneCheckTimeoutRef.current) {
      clearTimeout(phoneCheckTimeoutRef.current);
    }

    if (profileData?.coordinator?.mobile === cleanValue) {
      return;
    }

    if (cleanValue.length === 10 && !error) {
      phoneCheckTimeoutRef.current = setTimeout(async () => {
        await checkCoordinatorPhoneExists(cleanValue);
        phoneCheckTimeoutRef.current = null;
      }, 500);
    }
  };

  const handleCoordinatorPhoneBlur = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('91')) {
      value = value.substring(2);
    }

    if (profileData?.coordinator?.mobile === value) {
      return;
    }

    const error = validateIndianMobileNumber(value);
    setCoordinatorPhoneError(error || "");

    if (value.length === 10 && !error && !phoneExistsError) {
      await checkCoordinatorPhoneExists(value);
    }
  };

  const handleCoordinatorEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, coordinatorEmail: value }));
    handleCoordinatorEmailChangeWithValidation(e);

    if (emailExistsError) {
      setEmailExistsError("");
    }

    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    if (profileData?.coordinator?.email === value) {
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (isValidEmail && value) {
      emailCheckTimeoutRef.current = setTimeout(async () => {
        if (formData.coordinatorEmail === value) {
          await checkCoordinatorEmailExists(value);
        }
        emailCheckTimeoutRef.current = null;
      }, 500);
    }
  };

  const handleCoordinatorEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (profileData?.coordinator?.email === value) {
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (isValidEmail && value && !emailExistsError) {
      await checkCoordinatorEmailExists(value);
    }
  };

const handleIfscChange = async (value: string) => {
  const ifsc = value.toUpperCase();
  setFormData(prev => ({ ...prev, ifscCode: ifsc }));

  // Track IFSC code change
  const originalIfsc = profileData?.bankDetails?.ifscCode;
  const hasChanged = originalIfsc !== ifsc;
  setIfscCodeChanged(hasChanged);
  
  // Reset bank document error when new file is uploaded
  if (hasChanged && formData.cancelledChequeFile) {
    setBankCertError(false);
  }

  const validationError = validateIFSC(ifsc);
  setIfscValidationError(validationError || "");
  setIfscError(validationError || "");

  if (ifsc.length !== 11) {
    setFormData(prev => ({
      ...prev,
      bankName: "",
      branch: "",
      bankState: "",
      bankDistrict: "",
    }));
    return;
  }

  if (validationError) {
    setFormData(prev => ({
      ...prev,
      bankName: "",
      branch: "",
      bankState: "",
      bankDistrict: "",
    }));
    toast.error(validationError);
    return;
  }

  const parseResult = ifscSchema.safeParse(ifsc);
  if (!parseResult.success) {
    setIfscError(parseResult.error.issues[0].message);
    setIfscValidationError(parseResult.error.issues[0].message);
    setFormData(prev => ({
      ...prev,
      bankName: "",
      branch: "",
      bankState: "",
      bankDistrict: "",
    }));
    toast.error(parseResult.error.issues[0].message);
    return;
  }

  try {
    const data = await fetchBankDetails(ifsc);
    setFormData(prev => ({
      ...prev,
      bankName: data.BANK || "",
      branch: data.BRANCH || "",
      bankState: data.STATE || "",
      bankDistrict: data.DISTRICT || data.CITY || "",
    }));
  } catch {
    setIfscError("Invalid IFSC Code");
    setIfscValidationError("Invalid IFSC Code");
    setFormData(prev => ({
      ...prev,
      bankName: "",
      branch: "",
      bankState: "",
      bankDistrict: "",
    }));
    toast.error("Invalid IFSC Code");
  }
};

  const checkCoordinatorEmailExists = async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailExistsError("");
      return false;
    }

    if (profileData?.coordinator?.email === email) {
      setEmailExistsError("");
      return false;
    }

    setIsCheckingEmail(true);
    setEmailExistsError("");

    try {
      const exists = await updateProfileService.checkCoordinatorProfileEmail(email);
      if (exists) {
        setEmailExistsError("⚠️ This email is already registered. Please use a different email address.");
        return true;
      }
      setEmailExistsError("");
      return false;
    } catch (error: any) {
      console.error("Error checking email:", error);
      if (error.response?.status !== 404) {
        setEmailExistsError("Failed to verify email. Please try again.");
      }
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkCoordinatorPhoneExists = async (phone: string): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (profileData?.coordinator?.mobile === cleanPhone) {
      setPhoneExistsError("");
      return false;
    }

    const validationError = validateIndianMobileNumber(cleanPhone);
    if (validationError) {
      setPhoneExistsError(validationError);
      return false;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneExistsError("");
      return false;
    }

    setIsCheckingPhone(true);

    try {
      const exists = await sellerRegService.checkCoordinatorPhone(cleanPhone);
      if (exists) {
        setPhoneExistsError("⚠️ This phone number is already registered. Please use a different number.");
        return true;
      }
      setPhoneExistsError("");
      return false;
    } catch (error: any) {
      console.error("Error checking phone:", error);
      if (error.response?.status !== 404) {
        setPhoneExistsError("Failed to verify phone number. Please try again.");
      }
      return false;
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAlphanumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLen = 100) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, maxLen);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => {
    let value = e.target.value.replace(/\D/g, "");
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isPendingRequestError = (responseData: any): { isError: boolean; message: string; requestId: string } => {
    let errorMessage = '';
    let pendingRequestId = '';

    if (responseData?.data?.data?.message) {
      errorMessage = responseData.data.data.message;
    } else if (responseData?.data?.message) {
      errorMessage = responseData.data.message;
    } else if (responseData?.message) {
      errorMessage = responseData.message;
    }

    if (errorMessage && errorMessage.toLowerCase().includes('pending update request already exists')) {
      const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
      pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';
      return { isError: true, message: errorMessage, requestId: pendingRequestId };
    }

    return { isError: false, message: '', requestId: '' };
  };

  useEffect(() => {
    if (pendingRequestError) {
      const timer = setTimeout(() => {
        setPendingRequestError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [pendingRequestError]);

  useEffect(() => {
    if (showInactiveError) {
      const timer = setTimeout(() => {
        setShowInactiveError(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showInactiveError]);

  const hasInactiveLicenses = (): boolean => {
    return inactiveLicenses.length > 0;
  };

  const performSave = async (section: string, sectionData: any) => {
    try {
      const requestedBy = updateProfileService.getCurrentUserEmail();
      if (!requestedBy) {
        toast.error('User email not found');
        return;
      }

      if (!sectionData || Object.keys(sectionData).length === 0) {
        toast.error('No data to update');
        setEditingSection(null);
        return;
      }

      console.log(`📤 Sending ${section} update data:`, sectionData);

      let response;

      if (section === 'all') {
        response = await updateProfileService.updateFullProfile(sectionData, requestedBy);
      } else {
        switch (section) {
          case 'company':
            response = await updateProfileService.updateCompanySection(sectionData, requestedBy);
            break;
          case 'coordinator':
            response = await updateProfileService.updateCoordinatorSection(sectionData, requestedBy);
            break;
          case 'gst':
            response = await updateProfileService.updateGSTSection(sectionData, requestedBy);
            break;
          case 'bank':
            response = await updateProfileService.updateBankSection(sectionData, requestedBy);
            break;
          default:
            if (section.startsWith('license-')) {
              const index = parseInt(section.split('-')[1]);
              const doc = profileData?.documents[index];
              if (doc && sectionData && Object.keys(sectionData).length > 0) {
                response = await updateProfileService.updateLicenseSection(
                  doc.productTypes.productTypeId,
                  sectionData,
                  requestedBy
                );
              } else {
                toast.error('No license data to update');
                setEditingSection(null);
                return;
              }
            }
        }
      }

      if (response) {
        console.log('✅ Update successful:', response);

        const pendingError = isPendingRequestError(response);
        if (pendingError.isError) {
          scrollToTop();

          setPendingRequestError(
            `⚠️ Update Request Already Pending\n\n` +
            `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
            `Please wait for admin approval before submitting new changes.\n\n` +
            `You will be notified once your changes are approved.`
          );
          toast.error(
            `⚠️ Update Request Already Pending\n\n` +
            `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.`,
            { duration: 8000 }
          );
          return;
        }

        if (response.message && response.message.includes('auto-approved')) {
          toast.success(response.message);
          scrollToTop();
          const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
          setProfileData(updatedProfile);
          setSavedSection(section);
          setShowSuccess(true);
        } else {
          toast.success('Changes submitted for admin review. They will appear once approved.');
          scrollToTop();
          setSavedSection(section);
          setShowSuccess(true);
        }

        setEditingSection(null);

        if (!response.message || !response.message.includes('auto-approved')) {
          setReviewSections((prev) => {
            if (!prev.includes(section)) {
              return [...prev, section];
            }
            return prev;
          });
        }
      }

    } catch (error: any) {
      console.error('❌ Error saving section:', error);
      console.error('❌ Error response:', error.response?.data);

      let errorMessage = '';
      let pendingRequestId = '';

      if (error.response?.data?.data?.data?.message) {
        errorMessage = error.response.data.data.data.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (errorMessage.toLowerCase().includes('pending update request already exists')) {
        const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
        pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

        scrollToTop();

        setPendingRequestError(
          `⚠️ Update Request Already Pending\n\n` +
          `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
          `Please wait for admin approval before submitting new changes.\n\n` +
          `You will be notified once your changes are approved.`
        );

        toast.error(
          `⚠️ Update Request Already Pending\n\n` +
          `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.`,
          { duration: 8000 }
        );
      } else {
        toast.error(errorMessage || 'Failed to save changes');
      }
    }

    setTimeout(() => {
      setShowSuccess(false);
      setSavedSection(null);
    }, 21000);
  };

  const handleOtpVerified = async (verified: { email: boolean; phone: boolean }) => {
    setShowOtpModal(false);

    if (pendingSection && pendingSectionData) {
      if (pendingSection === 'all' && pendingSectionData.completeData && pendingSectionData.filesToUpload) {
        try {
          const requestedBy = updateProfileService.getCurrentUserEmail();
          if (!requestedBy) {
            toast.error('User email not found');
            return;
          }

          const response = await updateProfileService.updateFullProfile(
            pendingSectionData.completeData,
            requestedBy
          );

          const pendingError = isPendingRequestError(response);
          if (pendingError.isError) {
            scrollToTop();

            setPendingRequestError(
              `⚠️ Update Request Already Pending\n\n` +
              `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
              `Please wait for admin approval before submitting new changes.\n\n` +
              `You will be notified once your changes are approved.`
            );
            toast.error(
              `⚠️ Update Request Already Pending\n\n` +
              `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.`,
              { duration: 8000 }
            );
            return;
          }

          let pendingSellerId: number | null = null;
          let isAutoApproved: boolean = false;
          let documentsList: UpdateProfileResponse['documents'] = [];

          if (response) {
            if (response.message && response.message.includes('auto-approved')) {
              isAutoApproved = true;
            }

            if (response.pendingSellerId) {
              pendingSellerId = response.pendingSellerId;
            }

            if (response.documents && Array.isArray(response.documents)) {
              documentsList = response.documents;
            }
          }

          if (isAutoApproved || (!pendingSellerId && response && response.message)) {
            toast.success(response.message || 'Changes applied successfully!');
            scrollToTop();
            const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
            setProfileData(updatedProfile);
            setEditingSection(null);
            setSavedSection('all');
            setShowSuccess(true);
            return;
          }

          if (pendingSellerId) {
            console.log('✅ OTP Flow - Step 1 complete. Pending Seller ID:', pendingSellerId);

            const pendingDocumentIdMap = new Map<number, number>();

            if (documentsList && Array.isArray(documentsList)) {
              documentsList.forEach((pendingDoc: any) => {
                const productTypeId = pendingDoc.productTypeId || pendingDoc.productType?.productTypeId;
                const pendingDocId = pendingDoc.pendingSellerDocumentId || pendingDoc.id;

                if (productTypeId && pendingDocId) {
                  pendingDocumentIdMap.set(productTypeId, pendingDocId);
                  console.log(`📋 OTP Flow - Product Type ${productTypeId} → Pending Document ID: ${pendingDocId}`);
                }
              });
            }

            const filesToUpload = pendingSectionData.filesToUpload;
            const hasFilesToUpload = filesToUpload.gstFile || filesToUpload.bankFile || filesToUpload.companyCertFile || filesToUpload.sellerImageFile || filesToUpload.licenses.length > 0;

            if (hasFilesToUpload) {
              console.log('📤 OTP Flow - Step 2: Uploading documents...');

              const licensesWithIds = filesToUpload.licenses.map((license: any) => {
                const pendingDocumentId = pendingDocumentIdMap.get(license.productTypeId);
                if (!pendingDocumentId) {
                  console.warn(`⚠️ OTP Flow - No pending document ID found for product type ${license.productTypeId}`);
                }
                return {
                  file: license.file,
                  licenseName: license.productName,
                  documentId: pendingDocumentId
                };
              });

              await uploadSellerDocuments(pendingSellerId, {
                gstFile: filesToUpload.gstFile || undefined,
                bankFile: filesToUpload.bankFile || undefined,
                companyRegistrationCertificate: filesToUpload.companyCertFile || undefined,
                sellerImage: filesToUpload.sellerImageFile || undefined,
                licenses: licensesWithIds
              });

              console.log('✅ OTP Flow - Document upload successful');
            }

            toast.success('Changes submitted for admin review.');
            scrollToTop();
            setEditingSection(null);

            const sectionsToMark = ['company', 'coordinator', 'gst', 'bank'];
            formData.productTypes.forEach((_, index) => {
              sectionsToMark.push(`license-${index}`);
            });

            setReviewSections((prev) => {
              const newSections = [...prev];
              sectionsToMark.forEach(section => {
                if (!newSections.includes(section)) {
                  newSections.push(section);
                }
              });
              return newSections;
            });

            setSavedSection('all');
            setShowSuccess(true);

            setFormData(prev => ({
              ...prev,
              gstFile: null,
              companyRegistrationCertificateFile: null,
              cancelledChequeFile: null,
              sellerImageFile: null,
              licenses: Object.fromEntries(
                Object.entries(prev.licenses).map(([key, value]: [string, any]) => [key, { ...value, file: null }])
              )
            }));

            setChangedFiles({
              gstFile: null,
              companyCertFile: null,
              bankFile: null,
              licenses: []
            });

          } else {
            throw new Error('No pendingSellerId received from server');
          }

        } catch (error: any) {
          console.error('❌ Error in OTP flow:', error);

          let errorMessage = '';
          let pendingRequestId = '';

          if (error.response?.data?.data?.data?.message) {
            errorMessage = error.response.data.data.data.message;
          } else if (error.response?.data?.data?.message) {
            errorMessage = error.response.data.data.message;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          if (errorMessage.toLowerCase().includes('pending update request already exists')) {
            const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
            pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

            scrollToTop();

            setPendingRequestError(
              `⚠️ Update Request Already Pending\n\n` +
              `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
              `Please wait for admin approval before submitting new changes.\n\n` +
              `You will be notified once your changes are approved.`
            );

            toast.error(
              `⚠️ Update Request Already Pending\n\n` +
              `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.`,
              { duration: 8000 }
            );
          } else {
            toast.error(errorMessage || 'Failed to submit changes');
          }
        }
      } else {
        await performSave(pendingSection, pendingSectionData);
      }
    }

    setPendingEmail(undefined);
    setPendingPhone(undefined);
    setPendingSectionData(null);
    setPendingSection(null);
  };

  const validateAllFields = (): boolean => {
    // Validate Seller Name
    if (editingSection && !sellerNameError && formData.sellerName) {
      const error = validateSellerName(formData.sellerName);
      if (error) {
        setSellerNameError(error);
        scrollToError('seller-name');
        return false;
      }
    }

    // Validate City
    if (editingSection && !cityError && formData.city) {
      const error = validateCity(formData.city);
      if (error) {
        setCityError(error);
        return false;
      }
    }

    // Validate Street
    if (editingSection && !streetError && formData.street) {
      const error = validateStreet(formData.street);
      if (error) {
        setStreetError(error);
        return false;
      }
    }

    // Validate Building No
    if (editingSection && !buildingNoError && formData.buildingNo) {
      const error = validateBuildingNo(formData.buildingNo);
      if (error) {
        setBuildingNoError(error);
        return false;
      }
    }

    // Validate Pincode
    if (editingSection && !pincodeError && formData.pincode) {
      const error = validatePincode(formData.pincode);
      if (error) {
        setPincodeError(error);
        return false;
      }
    }

    // Validate Coordinator fields
    if (editingSection && formData.coordinatorName) {
      const error = validateCoordinatorName(formData.coordinatorName);
      if (error) {
        setCoordinatorNameError(error);
        scrollToError('coordinator');
        return false;
      }
    }

    if (editingSection && formData.coordinatorDesignation) {
      const error = validateCoordinatorDesignation(formData.coordinatorDesignation);
      if (error) {
        setCoordinatorDesignationError(error);
        scrollToError('coordinator');
        return false;
      }
    }

    if (editingSection && formData.coordinatorEmail) {
      const error = validateCoordinatorEmail(formData.coordinatorEmail);
      if (error) {
        setCoordinatorEmailError(error);
        scrollToError('email');
        return false;
      }
    }

    // Validate GST Number
    if (editingSection && formData.gstNumber) {
      const error = validateGSTNumber(formData.gstNumber);
      if (error) {
        setGstNumberError(error);
        scrollToError('gst');
        return false;
      }
    }

    // Validate Bank fields
    if (editingSection && formData.accountNumber) {
      const error = validateAccountNumber(formData.accountNumber);
      if (error) {
        setAccountNumberError(error);
        return false;
      }
    }

    if (editingSection && formData.accountHolderName) {
      const error = validateAccountHolderName(formData.accountHolderName);
      if (error) {
        setAccountHolderNameError(error);
        return false;
      }
    }

    if (editingSection && formData.ifscCode) {
      const error = validateIFSC(formData.ifscCode);
      if (error) {
        setIfscValidationError(error);
        return false;
      }
    }

    // Validate Account Number match
    if (editingSection && formData.accountNumber && formData.confirmAccountNumber) {
      if (formData.accountNumber !== formData.confirmAccountNumber) {
        toast.error("Account number and confirm account number do not match");
        return false;
      }
    }

    // Validate Licenses
    // Validate Licenses
for (const productName of formData.productTypes) {
  const licenseData = formData.licenses[productName];
  if (licenseData) {
    // Validate License Number
    if (!licenseData.number || licenseData.number.trim() === "") {
      setLicenseErrors(prev => ({ ...prev, [productName]: "License number is required" }));
      scrollToError('empty-license', productName);
      return false;
    }

    // Validate Issuing Authority
    if (!licenseData.issuingAuthority || licenseData.issuingAuthority.trim() === "") {
      setLicenseIssuingAuthorityErrors(prev => ({ ...prev, [productName]: "Issuing authority is required" }));
      scrollToError('license-format', productName);
      return false;
    }

    // Validate Dates
    if (!licenseData.issueDate) {
      setLicenseDateErrors(prev => ({ ...prev, [productName]: { ...prev[productName], issue: "Issue date is required" } }));
      scrollToError('license-format', productName);
      return false;
    }
    if (!licenseData.expiryDate) {
      setLicenseDateErrors(prev => ({ ...prev, [productName]: { ...prev[productName], expiry: "Expiry date is required" } }));
      scrollToError('license-format', productName);
      return false;
    }
    
    // NEW: Check if date gap exceeds 5 years
    if (isDateGapExceedingFiveYears(licenseData.issueDate, licenseData.expiryDate)) {
      setLicenseDateErrors(prev => ({ 
        ...prev, 
        [productName]: { 
          ...prev[productName], 
          gap: "License validity cannot exceed 5 years from issue date" 
        } 
      }));
      scrollToError('license-format', productName);
      toast.error(`${productName}: License validity cannot exceed 5 years`);
      return false;
    }
  }
}
    // NEW: Check if seller name changed and required documents are missing
    const isSellerNameChanged = profileData && formData.sellerName !== profileData.sellerName;

    if (isSellerNameChanged && editingSection) {
      const missingDocs = [];

      if (!formData.companyRegistrationCertificateFile &&
        (!formData.companyRegistrationCertificateUrl || formData.companyRegistrationCertificateUrl === "PENDING")) {
        missingDocs.push("Company Registration Certificate");
      }
      if (!formData.gstFile &&
        (!formData.gstFileUrl || formData.gstFileUrl === "PENDING")) {
        missingDocs.push("GST Certificate");
      }
      const hasLicenseFile = Object.values(formData.licenses).some(license => license.file);
      const hasLicenseUrl = Object.values(formData.licenses).some(license => license.fileUrl && license.fileUrl !== "PENDING");
      if (!hasLicenseFile && !hasLicenseUrl) {
        missingDocs.push("Drug/Relevant License(s)");
      }
      if (!formData.cancelledChequeFile &&
        (!formData.cancelledChequeFileUrl || formData.cancelledChequeFileUrl === "PENDING")) {
        missingDocs.push("Bank Proof");
      }

      if (missingDocs.length > 0) {
        toast.error(`Seller name change requires: ${missingDocs.join(", ")}`);
        scrollToError('seller-name');
        return false;
      }
    }

    return true;
  };

  const validateGSTNumberFormat = (value: string): boolean => {
  if (!value || value.length !== 15) return false;
  // Exact GST pattern from registration
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  return gstRegex.test(value);
};

  // Replace validateGSTNumber function
  const validateGSTNumber = (value: string): string | null => {
    if (!value || value.trim() === "") {
      return "GST number is required";
    }
    if (value.length !== 15) {
      return "GST number must be 15 characters";
    }
    // Exact GST pattern from registration
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    if (!gstRegex.test(value)) {
      return "Invalid GST number format (e.g., 22AAAAA0000A1Z)";
    }
    return null;
  };
const handleSaveAll = async () => {
  setIsSubmitting(true);
  setPendingRequestError(null);

  // Run all validations first
  if (!validateAllFields()) {
    setIsSubmitting(false);
    return;
  }

  // DEBUG: Log to see if seller name changed
  console.log("=== SELLER NAME CHANGE DEBUG ===");
  console.log("profileData?.sellerName:", profileData?.sellerName);
  console.log("formData.sellerName:", formData.sellerName);
  console.log("sellerNameChanged state:", sellerNameChanged);

  // Check if seller name has changed from original profile data
  const isSellerNameChanged = profileData && formData.sellerName !== profileData.sellerName;
  console.log("isSellerNameChanged calculated:", isSellerNameChanged);

  // ========== CHECK IF ADDRESS HAS CHANGED ==========
  const isAddressChanged = checkIfAddressChanged();
  console.log("=== ADDRESS CHANGE DEBUG ===");
  console.log("isAddressChanged:", isAddressChanged);
  console.log("formData.companyRegistrationCertificateFile:", formData.companyRegistrationCertificateFile?.name);
  console.log("formData.companyRegistrationCertificateUrl:", formData.companyRegistrationCertificateUrl);

  // Address change validation - Check if address changed and require NEW company registration certificate
  if (isAddressChanged) {
    console.log("Address change detected - checking for company registration certificate");
    
    // Check if NEW Company Registration Certificate is uploaded
    const hasNewCompanyCert = formData.companyRegistrationCertificateFile !== null;
    const hasPendingCert = formData.companyRegistrationCertificateUrl === "PENDING";
    
    console.log("hasNewCompanyCert:", hasNewCompanyCert);
    console.log("hasPendingCert:", hasPendingCert);
    
    if (!hasNewCompanyCert && !hasPendingCert) {
      // Show error and scroll to company registration field
      setCompanyCertError(true);
      toast.error(
        "⚠️ Address change requires a NEW Company Registration Certificate with the updated address.\n\nPlease upload the updated certificate.",
        { duration: 8000 }
      );
      scrollToError('seller-name');
      setIsSubmitting(false);
      return;
    } else {
      console.log("Company registration certificate is present for address change");
      setCompanyCertError(false);
    }
  }



  // ========== CHECK IF GST NUMBER HAS CHANGED ==========
const isGstNumberChanged = checkIfGstNumberChanged();
console.log("=== GST NUMBER CHANGE DEBUG ===");
console.log("isGstNumberChanged:", isGstNumberChanged);
console.log("formData.gstFile:", formData.gstFile?.name);
console.log("formData.gstFileUrl:", formData.gstFileUrl);

// GST number change validation - Require NEW GST certificate
if (isGstNumberChanged) {
  console.log("GST number changed - checking for GST certificate upload");
  
  // Check if NEW GST certificate is uploaded
  const hasNewGstFile = formData.gstFile !== null;
  const hasPendingGstFile = formData.gstFileUrl === "PENDING";
  
  console.log("hasNewGstFile:", hasNewGstFile);
  console.log("hasPendingGstFile:", hasPendingGstFile);
  
  if (!hasNewGstFile && !hasPendingGstFile) {
    // Show error and scroll to GST file field
    setGSTCertError(true);
    toast.error(
      "⚠️ GST number change requires a NEW GST Certificate with the updated GST number.\n\nPlease upload the new certificate.",
      { duration: 8000 }
    );
    // Scroll to GST section
    const gstSection = document.getElementById('gst-section');
    if (gstSection) {
      gstSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setIsSubmitting(false);
    return;
  } else {
    console.log("GST certificate is present for GST number change");
    setGSTCertError(false);
  }
}

// ========== CHECK IF ANY LICENSE NUMBERS HAVE CHANGED ==========
console.log("=== LICENSE NUMBER CHANGE DEBUG ===");
const changedLicenses: string[] = [];

formData.productTypes.forEach(productName => {
  const hasLicenseNumberChanged = checkIfLicenseNumberChanged(productName);
  if (hasLicenseNumberChanged) {
    changedLicenses.push(productName);
  }
});

console.log("Changed licenses:", changedLicenses);

if (changedLicenses.length > 0) {
  console.log("License numbers changed - checking for license document uploads");
  
  const missingLicenseDocs: string[] = [];
  
  changedLicenses.forEach(productName => {
    const licenseData = formData.licenses[productName];
    const hasNewFile = licenseData?.file !== null;
    const hasPendingFile = licenseData?.fileUrl === "PENDING";
    
    console.log(`License ${productName}: hasNewFile=${hasNewFile}, hasPendingFile=${hasPendingFile}`);
    
    if (!hasNewFile && !hasPendingFile) {
      missingLicenseDocs.push(productName);
      setLicenseCertErrors(prev => ({ ...prev, [productName]: true }));
    } else {
      setLicenseCertErrors(prev => ({ ...prev, [productName]: false }));
    }
  });
  
  if (missingLicenseDocs.length > 0) {
    toast.error(
      `⚠️ License number change requires NEW license copies for:\n\n• ${missingLicenseDocs.join("\n• ")}\n\nPlease upload the updated license documents.`,
      { duration: 10000 }
    );
    // Scroll to first changed license
    scrollToError('license-format', missingLicenseDocs[0]);
    setIsSubmitting(false);
    return;
  }
}

  // ========== CHECK IF IFSC CODE HAS CHANGED ==========
const isIfscCodeChanged = checkIfIfscCodeChanged();
console.log("=== IFSC CODE CHANGE DEBUG ===");
console.log("isIfscCodeChanged:", isIfscCodeChanged);
console.log("formData.cancelledChequeFile:", formData.cancelledChequeFile?.name);
console.log("formData.cancelledChequeFileUrl:", formData.cancelledChequeFileUrl);

// IFSC code change validation - Require NEW cancelled cheque/bank passbook
if (isIfscCodeChanged) {
  console.log("IFSC code changed - checking for cancelled cheque upload");
  
  // Check if NEW cancelled cheque/bank passbook is uploaded
  const hasNewBankFile = formData.cancelledChequeFile !== null;
  const hasPendingBankFile = formData.cancelledChequeFileUrl === "PENDING";
  
  console.log("hasNewBankFile:", hasNewBankFile);
  console.log("hasPendingBankFile:", hasPendingBankFile);
  
  if (!hasNewBankFile && !hasPendingBankFile) {
    // Show error and scroll to bank file field
    setBankCertError(true);
    toast.error(
      "⚠️ IFSC code change requires a NEW cancelled cheque/bank passbook with the updated bank details.\n\nPlease upload the new document.",
      { duration: 8000 }
    );
    // Scroll to bank section
    const bankSection = document.getElementById('bank-section');
    if (bankSection) {
      bankSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setIsSubmitting(false);
    return;
  } else {
    console.log("Cancelled cheque/bank passbook is present for IFSC change");
    setBankCertError(false);
  }
}

  // Seller name change document validation
  if (isSellerNameChanged) {
    const missingDocuments: string[] = [];

    // Reset error states
    setCompanyCertError(false);
    setGSTCertError(false);
    // setLicenseCertError(false);
    setBankCertError(false);

    // Check for NEW Company Registration Certificate upload
    if (!formData.companyRegistrationCertificateFile) {
      missingDocuments.push("Company Registration Certificate (Please upload a NEW certificate)");
      setCompanyCertError(true);
      console.log("Missing: Company Registration Certificate");
    } else {
      console.log("Company Registration Certificate file present:", formData.companyRegistrationCertificateFile.name);
    }

    // Check for NEW GST Certificate upload
    if (!formData.gstFile) {
      missingDocuments.push("GST Certificate (Please upload a NEW certificate)");
      setGSTCertError(true);
      console.log("Missing: GST Certificate");
    } else {
      console.log("GST Certificate file present:", formData.gstFile.name);
    }

    // Check for NEW License Copies upload
    // const hasNewLicenseFile = Object.values(formData.licenses).some(license => license.file);
    // console.log("Has new license file:", hasNewLicenseFile);
    // if (!hasNewLicenseFile) {
    //   missingDocuments.push("Drug/Relevant License(s) (Please upload NEW license copies)");
    //   setLicenseCertError(true);
    //   console.log("Missing: License files");
    // } else {
    //   console.log("License files present");
    // }

    // Check for NEW License Copies upload - check each selected product type
const missingLicenses: string[] = [];
formData.productTypes.forEach(productName => {
  const licenseData = formData.licenses[productName];
  const hasNewFile = licenseData?.file !== null;
  const hasPendingFile = licenseData?.fileUrl === "PENDING";
  
  if (!hasNewFile && !hasPendingFile) {
    missingLicenses.push(productName);
    setLicenseCertErrors(prev => ({ ...prev, [productName]: true }));
  } else {
    setLicenseCertErrors(prev => ({ ...prev, [productName]: false }));
  }
});

if (missingLicenses.length > 0) {
  missingDocuments.push(`Drug/Relevant License(s) for: ${missingLicenses.join(", ")} (Please upload NEW license copies)`);
  console.log("Missing license files for:", missingLicenses);
}

    // Check for NEW Bank Document upload
    if (!formData.cancelledChequeFile) {
      missingDocuments.push("Bank Proof (Please upload a NEW cancelled cheque/passbook)");
      setBankCertError(true);
      console.log("Missing: Bank file");
    } else {
      console.log("Bank file present:", formData.cancelledChequeFile.name);
    }

    console.log("Missing documents count:", missingDocuments.length);
    console.log("Missing documents:", missingDocuments);

    if (missingDocuments.length > 0) {
      toast.error(
        `⚠️ Seller name change requires NEW documents:\n\n• ${missingDocuments.join("\n• ")}`,
        { duration: 10000 }
      );
      scrollToError('seller-name');
      setIsSubmitting(false);
      return;
    }
  }

  // Check for license existence errors - SCROLL TO ERROR
  const hasLicenseExistsError = Object.values(licenseExistsError).some(error => error !== "");
  const hasLicenseFormatError = Object.values(licenseErrors).some(error => error !== "");

  if (hasLicenseExistsError) {
    const errorProductName = Object.entries(licenseExistsError).find(([_, error]) => error !== "")?.[0];
    if (errorProductName) {
      scrollToError('license-exists', errorProductName);
    } else {
      scrollToTop();
    }
    setIsSubmitting(false);
    return;
  }

  if (hasLicenseFormatError) {
    const errorProductName = Object.entries(licenseErrors).find(([_, error]) => error !== "")?.[0];
    if (errorProductName) {
      scrollToError('license-format', errorProductName);
    } else {
      scrollToTop();
    }
    setIsSubmitting(false);
    return;
  }

  // ========== CHECK FOR LICENSE 5-YEAR GAP VALIDATION ==========
  console.log("=== CHECKING LICENSE VALIDITY PERIOD (MAX 5 YEARS) ===");
  let hasGapError = false;
  let gapErrorProductName = "";
  
  for (const productName of formData.productTypes) {
    const licenseData = formData.licenses[productName];
    if (licenseData && licenseData.issueDate && licenseData.expiryDate) {
      const exceedsFiveYears = isDateGapExceedingFiveYears(licenseData.issueDate, licenseData.expiryDate);
      console.log(`License ${productName}: Issue: ${licenseData.issueDate}, Expiry: ${licenseData.expiryDate}, Exceeds 5 years: ${exceedsFiveYears}`);
      
      if (exceedsFiveYears) {
        hasGapError = true;
        gapErrorProductName = productName;
        // Update the error state
        setLicenseDateErrors(prev => ({ 
          ...prev, 
          [productName]: { 
            ...prev[productName], 
            gap: "License validity cannot exceed 5 years from issue date" 
          } 
        }));
        break;
      }
    }
  }

  if (hasGapError) {
    console.log(`❌ License gap error found for: ${gapErrorProductName}`);
    scrollToError('license-format', gapErrorProductName);
    toast.error(`${gapErrorProductName}: License validity cannot exceed 5 years from issue date`, { duration: 5000 });
    setIsSubmitting(false);
    return;
  }

  // Also check from existing error states
  const hasLicenseGapError = Object.entries(licenseDateErrors).some(([_, errors]) => errors?.gap);
  if (hasLicenseGapError) {
    const errorProductName = Object.entries(licenseDateErrors).find(([_, errors]) => errors?.gap)?.[0];
    if (errorProductName) {
      scrollToError('license-format', errorProductName);
      toast.error(`${errorProductName}: License validity cannot exceed 5 years from issue date`);
    } else {
      scrollToTop();
    }
    setIsSubmitting(false);
    return;
  }

  if (hasInactiveLicenses()) {
    setShowInactiveError(true);
    scrollToError('inactive-license');
    setIsSubmitting(false);
    return;
  }

  // Check for GST existence error
  if (gstExistsError) {
    scrollToError('gst');
    setIsSubmitting(false);
    return;
  }

  // Check for email existence error
  if (emailExistsError) {
    scrollToError('email');
    setIsSubmitting(false);
    return;
  }

  // Check for phone existence error
  if (phoneExistsError) {
    scrollToError('phone');
    setIsSubmitting(false);
    return;
  }

  // Check for empty license numbers
  const hasEmptyLicenseNumbers = Object.entries(formData.licenses).some(([productName, licenseData]: [string, any]) => {
    const isProductSelected = formData.productTypeIds.includes(licenseData.productTypeId);
    if (isProductSelected && (!licenseData.number || licenseData.number.trim() === "")) {
      return true;
    }
    return false;
  });

  if (hasEmptyLicenseNumbers) {
    const emptyProductName = Object.entries(formData.licenses).find(([productName, licenseData]: [string, any]) => {
      const isProductSelected = formData.productTypeIds.includes(licenseData.productTypeId);
      return isProductSelected && (!licenseData.number || licenseData.number.trim() === "");
    })?.[0];
    if (emptyProductName) {
      scrollToError('empty-license', emptyProductName);
    } else {
      scrollToTop();
    }
    setIsSubmitting(false);
    return;
  }

  const companyPhoneValidationError = validateIndianMobileNumber(formData.phone);
  const coordinatorPhoneValidationError = validateIndianMobileNumber(formData.coordinatorMobile);

  if (companyPhoneValidationError) {
    setCompanyPhoneError(companyPhoneValidationError);
    scrollToTop();
    setIsSubmitting(false);
    return;
  }

  if (coordinatorPhoneValidationError) {
    setCoordinatorPhoneError(coordinatorPhoneValidationError);
    scrollToTop();
    setIsSubmitting(false);
    return;
  }

  if (formData.coordinatorEmail && !emailExistsError && profileData?.coordinator?.email !== formData.coordinatorEmail) {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail);
    if (isValidEmail) {
      const exists = await checkCoordinatorEmailExists(formData.coordinatorEmail);
      if (exists) {
        scrollToError('email');
        setIsSubmitting(false);
        return;
      }
    }
  }

  if (formData.coordinatorMobile && !phoneExistsError && !coordinatorPhoneError && profileData?.coordinator?.mobile !== formData.coordinatorMobile) {
    const exists = await checkCoordinatorPhoneExists(formData.coordinatorMobile);
    if (exists) {
      scrollToError('phone');
      setIsSubmitting(false);
      return;
    }
  }

  // Check if account number and confirm account number match
  if (formData.accountNumber !== formData.confirmAccountNumber) {
    toast.error("Account number and confirm account number do not match");
    scrollToTop();
    setIsSubmitting(false);
    return;
  }

  try {
    let needsEmailVerification = false;
    let needsPhoneVerification = false;
    let newEmail = '';
    let newPhone = '';

    const formatDate = (date: Date | null | string): string => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const filesToUpload = {
      gstFile: null as File | null,
      bankFile: null as File | null,
      companyCertFile: null as File | null,
      sellerImageFile: null as File | null,
      licenses: [] as Array<{
        productName: string;
        productTypeId: number;
        file: File;
      }>
    };

    if (formData.gstFile) {
      filesToUpload.gstFile = formData.gstFile;
    }

    if (formData.companyRegistrationCertificateFile) {
      filesToUpload.companyCertFile = formData.companyRegistrationCertificateFile;
    }

    if (formData.cancelledChequeFile) {
      filesToUpload.bankFile = formData.cancelledChequeFile;
    }

    if (formData.sellerImageFile) {
      filesToUpload.sellerImageFile = formData.sellerImageFile;
    }

    const currentDocs = profileData?.documents || [];
    const selectedProductTypeIds = new Set(formData.productTypeIds);

    const documentsToSend = [];
    const processedProductTypeIds = new Set<number>();

    for (const existingDoc of currentDocs) {
      const productTypeId = existingDoc.productTypes?.productTypeId;
      const productName = existingDoc.productTypes?.productTypeName;

      if (!productTypeId || !productName) {
        console.warn('⚠️ Skipping document with missing product info:', existingDoc);
        continue;
      }

      if (selectedProductTypeIds.has(productTypeId)) {
        const licenseData = formData.licenses[productName] || {};

        if (licenseData.file) {
          filesToUpload.licenses.push({
            productName: productName,
            productTypeId: productTypeId,
            file: licenseData.file
          });
        }

        const documentFileUrl = licenseData.fileUrl === "PENDING" ? "PENDING" : (existingDoc.documentFileUrl || '');

        documentsToSend.push({
          documentId: existingDoc.sellerDocumentsId,
          productTypeId: productTypeId,
          documentNumber: licenseData.number || existingDoc.documentNumber || '',
          documentFileUrl: documentFileUrl,
          licenseIssueDate: licenseData.issueDate
            ? formatDate(licenseData.issueDate)
            : existingDoc.licenseIssueDate || '',
          licenseExpiryDate: licenseData.expiryDate
            ? formatDate(licenseData.expiryDate)
            : existingDoc.licenseExpiryDate || '',
          licenseIssuingAuthority: licenseData.issuingAuthority || existingDoc.licenseIssuingAuthority || '',
          licenseStatus: licenseData.status || existingDoc.licenseStatus || 'InActive'
        });

        processedProductTypeIds.add(productTypeId);
      } else {
        console.log(`🗑️ Document for product ${productTypeId} will be REMOVED`);
      }
    }

    Object.entries(formData.licenses).forEach(([productName, licenseData]: [string, any]) => {
      const productType = productTypes.find(pt => pt.productTypeName === productName);
      if (!productType) return;

      if (selectedProductTypeIds.has(productType.productTypeId) &&
        !processedProductTypeIds.has(productType.productTypeId)) {

        if (licenseData.file) {
          filesToUpload.licenses.push({
            productName: productName,
            productTypeId: productType.productTypeId,
            file: licenseData.file
          });
        }

        const hasData = licenseData.number ||
          licenseData.issueDate ||
          licenseData.expiryDate ||
          licenseData.issuingAuthority;

        if (hasData) {
          const documentFileUrl = licenseData.fileUrl === "PENDING" ? "PENDING" : '';

          documentsToSend.push({
            productTypeId: productType.productTypeId,
            documentNumber: licenseData.number || '',
            documentFileUrl: documentFileUrl,
            licenseIssueDate: licenseData.issueDate ? formatDate(licenseData.issueDate) : '',
            licenseExpiryDate: licenseData.expiryDate ? formatDate(licenseData.expiryDate) : '',
            licenseIssuingAuthority: licenseData.issuingAuthority || '',
            licenseStatus: licenseData.status || 'InActive'
          });

          processedProductTypeIds.add(productType.productTypeId);
        }
      }
    });

    const allProductTypeIds = Array.from(selectedProductTypeIds);

    const completeData: UpdateSellerProfileRequest = {
      sellerName: formData.sellerName,
      companyTypeId: formData.companyTypeId,
      sellerTypeId: formData.sellerTypeId,
      productTypeId: allProductTypeIds,
      phone: formData.phone,
      email: formData.email,
      website: formData.website || '',
      termsAccepted: profileData?.termsAccepted || true,

      address: {
        stateId: formData.stateId,
        districtId: formData.districtId,
        talukaId: formData.talukaId,
        city: formData.city,
        street: formData.street,
        buildingNo: formData.buildingNo,
        landmark: formData.landmark || '',
        pinCode: formData.pincode,
      },

      coordinator: {
        name: formData.coordinatorName,
        designation: formData.coordinatorDesignation,
        email: formData.coordinatorEmail,
        mobile: formData.coordinatorMobile
      },

      bankDetails: {
        bankName: formData.bankName,
        branch: formData.branch,
        ifscCode: formData.ifscCode,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        bankDocumentFileUrl: formData.cancelledChequeFileUrl === "PENDING" ? "PENDING" : (profileData?.bankDetails?.bankDocumentFileUrl || '')
      },

      gstNumber: formData.gstNumber,
      gstFileUrl: formData.gstFileUrl === "PENDING" ? "PENDING" : (profileData?.sellerGST?.gstFileUrl || ''),
      companyRegistrationCertificateUrl: formData.companyRegistrationCertificateUrl === "PENDING" ? "PENDING" : (profileData?.companyRegistrationCertificateUrl || ''),

      documents: documentsToSend
    };

    const validationResult = validateSection('company', completeData);
    if (!validationResult.success) {
      toast.error(validationResult.error || 'Validation failed');
      setIsSubmitting(false);
      return;
    }

    if (profileData?.coordinator) {
      if (formData.coordinatorEmail !== profileData.coordinator.email) {
        needsEmailVerification = true;
        newEmail = formData.coordinatorEmail;
      }
      if (formData.coordinatorMobile !== profileData.coordinator.mobile) {
        needsPhoneVerification = true;
        newPhone = formData.coordinatorMobile;
      }
    }

    if (needsEmailVerification || needsPhoneVerification) {
      if (needsEmailVerification && newEmail) {
        const emailExists = await checkCoordinatorEmailExists(newEmail);
        if (emailExists) {
          scrollToError('email');
          setIsSubmitting(false);
          return;
        }
      }
      if (needsPhoneVerification && newPhone) {
        const phoneExists = await checkCoordinatorPhoneExists(newPhone);
        if (phoneExists) {
          scrollToError('phone');
          setIsSubmitting(false);
          return;
        }
      }

      setPendingEmail(needsEmailVerification ? newEmail : undefined);
      setPendingPhone(needsPhoneVerification ? newPhone : undefined);
      setPendingSectionData({ completeData, filesToUpload });
      setPendingSection('all');
      setShowOtpModal(true);
      setIsSubmitting(false);
      return;
    }

    console.log('💾 Sending JSON data...');

    const requestedBy = updateProfileService.getCurrentUserEmail();
    if (!requestedBy) {
      toast.error('User email not found');
      setIsSubmitting(false);
      return;
    }

    const response = await updateProfileService.updateFullProfile(completeData, requestedBy);

    const pendingError = isPendingRequestError(response);
    if (pendingError.isError) {
      scrollToTop();

      setPendingRequestError(
        `⚠️ Update Request Already Pending\n\n` +
        `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
        `Please wait for admin approval before submitting new changes.\n\n` +
        `You will be notified once your changes are approved.`
      );
      setIsSubmitting(false);
      return;
    }

    let pendingSellerId: number | null = null;
    let isAutoApproved: boolean = false;
    let documentsList: UpdateProfileResponse['documents'] = [];

    if (response) {
      if (response.message && response.message.includes('auto-approved')) {
        isAutoApproved = true;
      }

      if (response.pendingSellerId) {
        pendingSellerId = response.pendingSellerId;
      }

      if (response.documents && Array.isArray(response.documents)) {
        documentsList = response.documents;
      }
    }

    if ((isAutoApproved || (!pendingSellerId && response && response.message)) && !hasDocumentChanges) {
      toast.success(response.message || 'Changes applied successfully!');
      scrollToTop();

      const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
      setProfileData(updatedProfile);

      if (updatedProfile) {
        const updatedLicenses: Record<string, any> = {};
        updatedProfile.documents.forEach((doc: SellerDocument) => {
          const productName = doc.productTypes?.productTypeName;
          if (productName) {
            const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
            const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
            const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

            updatedLicenses[productName] = {
              documentId: doc.sellerDocumentsId,
              number: doc.documentNumber || "",
              file: null,
              fileUrl: doc.documentFileUrl || "",
              issueDate: issueDate,
              expiryDate: expiryDate,
              issuingAuthority: doc.licenseIssuingAuthority || "",
              status: calculatedStatus,
              productTypeId: doc.productTypes?.productTypeId || 0
            };
          }
        });

        setFormData(prev => ({
          ...prev,
          sellerName: updatedProfile.sellerName,
          companyTypeId: updatedProfile.companyType?.companyTypeId || 0,
          companyType: updatedProfile.companyType?.companyTypeName || '',
          sellerTypeId: updatedProfile.sellerType?.sellerTypeId || 0,
          sellerType: updatedProfile.sellerType?.sellerTypeName || '',
          productTypeIds: updatedProfile.productTypes.map(pt => pt.productTypeId),
          productTypes: updatedProfile.productTypes.map(pt => pt.productTypeName),
          phone: updatedProfile.phone,
          email: updatedProfile.email,
          website: updatedProfile.website || '',
          coordinatorName: updatedProfile.coordinator?.name || '',
          coordinatorDesignation: updatedProfile.coordinator?.designation || '',
          coordinatorEmail: updatedProfile.coordinator?.email || '',
          coordinatorMobile: updatedProfile.coordinator?.mobile || '',
          gstNumber: updatedProfile.sellerGST?.gstNumber || '',
          gstFileUrl: updatedProfile.sellerGST?.gstFileUrl || '',
          companyRegistrationCertificateUrl: updatedProfile.companyRegistrationCertificateUrl || '',
          sellerImageUrl: updatedProfile.sellerImageUrl || '',
          bankName: updatedProfile.bankDetails?.bankName || '',
          branch: updatedProfile.bankDetails?.branch || '',
          ifscCode: updatedProfile.bankDetails?.ifscCode || '',
          accountNumber: updatedProfile.bankDetails?.accountNumber || '',
          accountHolderName: updatedProfile.bankDetails?.accountHolderName || '',
          cancelledChequeFileUrl: updatedProfile.bankDetails?.bankDocumentFileUrl || '',
          licenses: updatedLicenses,
        }));
      }

      setEditingSection(null);
      setSavedSection('all');
      setShowSuccess(true);
      setHasDocumentChanges(false);
      setSellerNameChanged(false);
      setAddressChanged(false);
      // Reset document error states
      setCompanyCertError(false);
      setGSTCertError(false);
      // setLicenseCertError(false);
      setBankCertError(false);

      setTimeout(() => {
        setShowSuccess(false);
        setSavedSection(null);
      }, 5000);

      setIsSubmitting(false);
      return;
    }

    if (pendingSellerId || hasDocumentChanges) {
      if (!pendingSellerId) {
        console.error('❌ No pendingSellerId found but document changes exist');
        toast.error('Unable to process document changes. Please contact support.');
        setIsSubmitting(false);
        return;
      }

      const pendingDocumentIdMap = new Map<number, number>();

      if (documentsList && Array.isArray(documentsList)) {
        documentsList.forEach((pendingDoc: any) => {
          const productTypeId = pendingDoc.productTypeId || pendingDoc.productType?.productTypeId;
          const pendingDocId = pendingDoc.pendingSellerDocumentId || pendingDoc.id;

          if (productTypeId && pendingDocId) {
            pendingDocumentIdMap.set(productTypeId, pendingDocId);
          }
        });
      }

      const hasFilesToUpload = filesToUpload.gstFile || filesToUpload.bankFile || filesToUpload.companyCertFile || filesToUpload.sellerImageFile || filesToUpload.licenses.length > 0;

      if (hasFilesToUpload) {
        try {
          console.log("=== PREPARING DOCUMENT UPLOAD ===");
          console.log("GST File:", filesToUpload.gstFile?.name, filesToUpload.gstFile?.size);
          console.log("Bank File:", filesToUpload.bankFile?.name, filesToUpload.bankFile?.size);
          console.log("Company Cert File:", filesToUpload.companyCertFile?.name, filesToUpload.companyCertFile?.size);
          console.log("Licenses:", filesToUpload.licenses.map(l => ({ name: l.productName, file: l.file?.name, size: l.file?.size })));

          const licensesWithIds = filesToUpload.licenses.map(license => {
            const pendingDocumentId = pendingDocumentIdMap.get(license.productTypeId);
            console.log(`License ${license.productName} (ProductTypeId: ${license.productTypeId}) -> PendingDocumentId: ${pendingDocumentId}`);
            if (!pendingDocumentId) {
              console.warn(`⚠️ No pending document ID found for product type ${license.productTypeId}`);
            }
            return {
              file: license.file,
              licenseName: license.productName,
              documentId: pendingDocumentId
            };
          });

          await uploadSellerDocuments(pendingSellerId, {
            gstFile: filesToUpload.gstFile || undefined,
            bankFile: filesToUpload.bankFile || undefined,
            companyRegistrationCertificate: filesToUpload.companyCertFile || undefined,
            sellerImage: filesToUpload.sellerImageFile || undefined,
            licenses: licensesWithIds
          });
          toast.success('Changes submitted for admin review.');
          scrollToTop();

        } catch (uploadError: any) {
          console.error('❌ Upload failed, full error:', uploadError);
          console.error('❌ Error response data:', uploadError.response?.data);
          console.error('❌ Error status:', uploadError.response?.status);
          console.error('❌ Error headers:', uploadError.response?.headers);
          console.error('❌ Upload failed, rolling back...', uploadError);
          await deleteUpdateRequest(pendingSellerId);
          toast.error(uploadError.message || 'File upload failed. Changes have been rolled back. Please try again.');
          setIsSubmitting(false);
          return;
        }
      } else {
        toast.success('Changes submitted for admin review.');
        scrollToTop();
      }

      setEditingSection(null);

      const sectionsToMark = ['company', 'coordinator', 'gst', 'bank'];
      formData.productTypes.forEach((_, index) => {
        sectionsToMark.push(`license-${index}`);
      });

      setReviewSections((prev) => {
        const newSections = [...prev];
        sectionsToMark.forEach(section => {
          if (!newSections.includes(section)) {
            newSections.push(section);
          }
        });
        return newSections;
      });

      setSavedSection('all');
      setShowSuccess(true);
      setSellerNameChanged(false);
      setAddressChanged(false);
      // Reset document error states
      setCompanyCertError(false);
      setGSTCertError(false);
      // setLicenseCertError(false);
      setBankCertError(false);

      setFormData(prev => ({
        ...prev,
        gstFile: null,
        companyRegistrationCertificateFile: null,
        cancelledChequeFile: null,
        sellerImageFile: null,
        licenses: Object.fromEntries(
          Object.entries(prev.licenses).map(([key, value]: [string, any]) => [key, { ...value, file: null }])
        )
      }));

      setChangedFiles({
        gstFile: null,
        companyCertFile: null,
        bankFile: null,
        licenses: []
      });

      setHasDocumentChanges(false);
      setIsSubmitting(false);

    } else {
      console.error('❌ Unexpected response structure:', response);
      toast.error('Unexpected server response. Please contact support.');
      setIsSubmitting(false);
      return;
    }

  } catch (error: any) {
    console.error('❌ Error in handleSaveAll:', error);
    console.error('❌ Error response:', error.response?.data);

    let errorMessage = '';
    let pendingRequestId = '';

    if (error.response?.data) {
      if (error.response.data.data?.data?.message) {
        errorMessage = error.response.data.data.data.message;
      } else if (error.response.data.data?.message) {
        errorMessage = error.response.data.data.message;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }

    if (!errorMessage && error.message) {
      errorMessage = error.message;
    }

    if (errorMessage.toLowerCase().includes('pending update request already exists')) {
      const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
      pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

      scrollToTop();

      setPendingRequestError(
        `⚠️ Update Request Already Pending\n\n` +
        `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
        `Please wait for admin approval before submitting new changes.\n\n` +
        `You will be notified once your changes are approved.`
      );
    } else if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.errors) {
        Object.entries(errorData.errors).forEach(([field, message]) => {
          toast.error(`${field}: ${message}`);
        });
      } else {
        toast.error(errorData.message || 'Validation failed');
      }
    } else if (error.response?.status === 409) {
      toast.error('Document with this number already exists');
    } else {
      toast.error(errorMessage || 'Failed to save changes');
    }
    setIsSubmitting(false);
  }
};
  const handleDownload = async (fileUrl: string, fileName: string) => {
    if (fileUrl === "PENDING") {
      toast.error('File is pending upload. Please wait for admin approval.');
      return;
    }

    try {
      toast.loading('Downloading...', { id: 'download' });

      const response = await fetch(fileUrl, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

      toast.success('Download complete!', { id: 'download' });

    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file. Please try again.', { id: 'download' });
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewInNewTab = (fileUrl: string) => {
    if (fileUrl === "PENDING") {
      toast.error('File is pending upload. Please wait for admin approval.');
      return;
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-sneutral-100 rounded-md"></div>
          <div className="h-48 bg-sneutral-100 rounded-md"></div>
          <div className="h-56 bg-sneutral-100 rounded-md"></div>
          <div className="h-40 bg-sneutral-100 rounded-md"></div>
          <div className="h-40 bg-sneutral-100 rounded-md"></div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
        <div className="bg-warning-50 border border-warning-200 rounded-md p-6 text-center">
          <p className="text-warning-600 mb-4">{error || 'Failed to load profile'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-900 text-base-white px-4 py-2 rounded-md hover:bg-primary-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const companyTypeOptions = companyTypes.map(type => ({
    value: type.companyTypeId.toString(),
    label: type.companyTypeName
  }));

  const sellerTypeOptions = sellerTypes.map(type => ({
    value: type.sellerTypeId.toString(),
    label: type.sellerTypeName
  }));

  const stateOptions = states.map(state => ({
    value: state.stateId.toString(),
    label: state.stateName
  }));

  const districtOptions = districts.map(district => ({
    value: district.districtId.toString(),
    label: district.districtName
  }));

  const talukaOptions = talukas.map(taluka => ({
    value: taluka.talukaId.toString(),
    label: taluka.talukaName
  }));


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
        {pendingRequestError && (
          <div className="bg-warning-50 border-l-4 border-warning-500 p-4 rounded-md flex gap-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-warning-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-h6 font-heading font-medium text-warning-800">Update Request Already Pending</p>
              <p className="text-p3 text-warning-700 whitespace-pre-line">{pendingRequestError}</p>
            </div>
            <button
              onClick={() => setPendingRequestError(null)}
              className="ml-auto text-warning-500 hover:text-warning-700"
            >
              ×
            </button>
          </div>
        )}

        {showInactiveError && inactiveLicenses.length > 0 && (
          <div className="p-4 bg-warning-50 border border-warning-300 rounded-md flex items-start gap-3">
            <span className="text-warning-500 text-xl mt-0.5">🚫</span>
            <div>
              <p className="text-warning-700 font-semibold">
                Inactive/Expired license{inactiveLicenses.length > 1 ? "s" : ""} detected — cannot submit
              </p>
              <p className="text-warning-600 text-p3 mt-1">
                The following license{inactiveLicenses.length > 1 ? "s are" : " is"} inactive/expired. Please provide a valid, active license before submitting:
              </p>
              <ul className="mt-2 space-y-1">
                {inactiveLicenses.map((productName) => (
                  <li key={productName} className="text-warning-600 text-p3 font-medium flex items-center gap-1">
                    <span>•</span>
                    <span>{productName} License</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setShowInactiveError(false)}
              className="ml-auto text-warning-500 hover:text-warning-700"
            >
              ×
            </button>
          </div>
        )}

        {!pendingRequestError && savedSection && showSuccess && (
          <div className="bg-success-50 border-l-4 border-success-300 p-4 rounded-md flex gap-2">
            <MdSchedule size={20} className="text-success-700 mt-1" />
            <div>
              <p className="text-h6 font-heading font-medium text-success-900">
                {savedSection === 'all' && savedSection ? 'Changes Submitted Successfully!' : 'Changes Applied!'}
              </p>
              <p className="text-p3 text-success-800">
                {savedSection === 'all' && savedSection ?
                  'Your changes have been saved and submitted for admin review. You\'ll receive a notification once they are approved.' :
                  'Your changes have been applied successfully.'}
              </p>
            </div>
          </div>
        )}

        {editingSection && (
          <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-md">
            <div className="flex gap-2">
              <PiInfo size={24} className="text-danger-700 mt-1" />
              <div>
                <p className="text-h6 font-heading font-medium text-danger-800">
                  Admin Review Required
                </p>
                <p className="text-p3 text-danger-700">
                  All changes made to your profile will be reviewed by an administrator before they are reflected in the system. You will be notified once your changes have been approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* COMPANY DETAILS */}
        <div id="company-section" className="bg-base-white rounded-md overflow-hidden border border-pneutral-200">
          <div className="flex items-center justify-between px-6 py-4 bg-pneutral-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary-100">
                <Building2 size={20} className="text-primary-900" />
              </div>
              <h2 className="text-h6 font-heading font-medium text-pneutral-900">
                Seller Company Details
              </h2>
            </div>

            {!editingSection ? (
              <button
                onClick={() => setEditingSection("editing")}
                className="flex items-center gap-2 bg-primary-900 text-base-white text-p3 px-4 py-2 rounded-md hover:bg-primary-800 transition-colors"
              >
                <Pencil size={20} />
                Edit
              </button>
            ) : (
              <ChevronUp size={18} className="text-pneutral-600" />
            )}
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-40 h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      sellerImagePreviewUrl ||
                      (formData.sellerImageUrl && formData.sellerImageUrl !== "PENDING"
                        ? formData.sellerImageUrl
                        : "/icons/companylogo.png")
                    }
                    alt="Company Logo"
                    className="w-40 h-40 rounded-md shadow object-cover"
                  />
                  {editingSection && (
                    <button
                      type="button"
                      onClick={() => sellerImageInputRef.current?.click()}
                      className="absolute bottom-1 right-1 bg-primary-900 text-base-white p-2 rounded-full shadow hover:bg-primary-800 transition-colors"
                      title="Change Logo"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <input
                    ref={sellerImageInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSellerImageFileChange(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="text-p3 text-pneutral-600">Company Logo</p>
                {formData.sellerImageUrl === "PENDING" && (
                  <p className="text-p2 text-warning-600">New logo selected — will be submitted for admin review</p>
                )}
              </div>

              <hr className="border-pneutral-200" />

              <div className="grid grid-cols-2 gap-4">
                {/* Left Column - Seller Name/Company Name */}
                <div>
                  <Input
                    label="Seller Name/Company Name"
                    value={formData.sellerName}
                    editable={!!editingSection}
                    icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
                    onChange={handleSellerNameChangeWithTracking}
                    error={sellerNameError}
                  />
                  {sellerNameChanged && editingSection && (
                    <p className="text-p2 text-warning-600 mt-1">
                      ⚠️ Changing seller name requires updated: Company Registration Certificate, GST Certificate, License(s), and Bank Proof
                    </p>
                  )}
                </div>

                {/* Right Column - Company Type */}
                <div>
                  <SelectField
                    label="Company Type"
                    value={formData.companyTypeId?.toString()}
                    options={companyTypeOptions}
                    editable={!!editingSection}
                    onChange={handleCompanyTypeChange}
                    placeholder="Select Company Type"
                    isLoading={loadingStates.companyTypes}
                    labelIcon={<Image src="/icons/companytype1.jpg" alt="Company Type" width={20} height={20} className="object-contain" />}
                  />
                </div>



                {/* Left Column - Seller Type */}
                <div>
                  <SelectField
                    label="Seller Type"
                    value={formData.sellerTypeId?.toString()}
                    options={sellerTypeOptions}
                    editable={false}
                    labelIcon={<Image src="/icons/producttype.jpg" alt="Company Type" width={20} height={20} className="object-contain" />}
                    onChange={handleSellerTypeChange}
                    placeholder="Select Seller Type"
                    isLoading={loadingStates.sellerTypes}
                  />
                </div>

                {/* Right Column - Company Registration Certificate (Half Width) */}
                {/* Company Registration Certificate (Half Width) */}
<div>
  <FileField
    key={formData.companyRegistrationCertificateUrl || 'company-cert'}
    label="Company Registration Certificate"
    file={formData.companyRegistrationCertificateUrl?.split('/').pop() || 'company_registration_certificate.pdf'}
    fileUrl={formData.companyRegistrationCertificateUrl}
    editable={!!editingSection}
    onDownload={() => handleDownload(
      formData.companyRegistrationCertificateUrl || '#',
      formData.companyRegistrationCertificateUrl?.split('/').pop() || 'company_registration_certificate.pdf'
    )}
    onView={() => handleViewInNewTab(formData.companyRegistrationCertificateUrl || '#')}
    onFileSelect={(file: File) => handleCompanyCertFileChange(file)}
    error={(addressChanged && editingSection && !formData.companyRegistrationCertificateFile && formData.companyRegistrationCertificateUrl !== "PENDING") 
      ? "Company Registration Certificate is required when changing address" 
      : (companyCertError && sellerNameChanged ? "Company Registration Certificate is required when changing seller name" : "")}
  />
  {/* {addressChanged && editingSection && !formData.companyRegistrationCertificateFile && formData.companyRegistrationCertificateUrl !== "PENDING" && (
    <p className="text-p2 text-warning-600 mt-1">
      ⚠️ Required when changing address - Please upload company registration certificate with updated address
    </p>
  )} */}
  {/* {companyCertError && sellerNameChanged && editingSection && (
    <p className="text-p2 text-warning-600 mt-1">
      ⚠️ Required when changing seller name
    </p>
  )} */}
</div>

                {/* Product Category - Full Width */}
                <div className="col-span-2">
                  <div className="flex flex-col">
                    <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
                      <Image
                        src="/icons/pcategory.jpg"
                        alt="Product Category"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                      Product Category
                      <span className="text-warning-500 ml-1">*</span>
                    </label>
                    <div className="relative" ref={productDropdownRef}>
                      <div
                        className={`w-full h-[52px] px-4 rounded-md border flex items-center justify-between ${!editingSection ? 'bg-pneutral-50 border-pneutral-100 cursor-not-allowed' : 'bg-base-white border-pneutral-200 cursor-pointer hover:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500'}`}
                        onClick={() => {
                          if (editingSection && !loadingStates.productTypes) {
                            setIsProductDropdownOpen(!isProductDropdownOpen);
                          }
                        }}
                      >
                        <span className={`text-p4 font-body font-regular ${formData.productTypes.length === 0 ? "text-pneutral-500" : editingSection ? "text-pneutral-500" : "text-pneutral-800"}`}>
                          {loadingStates.productTypes
                            ? "Loading product types..."
                            : formData.productTypes.length > 0
                              ? formData.productTypes.join(", ")
                              : "Select Product Types"}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-pneutral-500 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {editingSection && isProductDropdownOpen && !loadingStates.productTypes && (
                        <div className="absolute top-full mt-1 w-full bg-base-white border border-pneutral-200 rounded-md shadow-xlg z-50 max-h-80 overflow-y-auto">
                          <div className="p-2 border-b border-pneutral-200 sticky top-0 bg-base-white">
                            <p className="text-p3 text-pneutral-600 font-medium">
                              Select product types:
                            </p>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {productTypes.length > 0 && (
                              <div
                                className="flex items-center px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200"
                                onClick={handleSelectAllProductTypes}
                              >
                                <input
                                  type="checkbox"
                                  checked={productTypes.length > 0 && formData.productTypes.length === productTypes.length}
                                  onChange={() => { }}
                                  disabled
                                  className="h-4 w-4 text-secondary-700 rounded border-pneutral-300 focus:ring-secondary-500"
                                />
                                <label className="ml-3 text-p3 font-medium text-secondary-700 cursor-pointer">
                                  Select All
                                </label>
                              </div>
                            )}

                            {productTypes.map((product) => (
                              <div
                                key={product.productTypeId}
                                className="flex items-center px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200 last:border-b-0"
                                onClick={() => handleProductTypeToggle(product)}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.productTypeIds.includes(product.productTypeId)}
                                  onChange={() => { }}
                                  className="h-4 w-4 text-secondary-700 rounded border-pneutral-300 focus:ring-secondary-500"
                                />
                                <label className="ml-3 text-p3 text-pneutral-900 cursor-pointer">
                                  {product.productTypeName}
                                  {product.regulatoryCategory && (
                                    <span className="ml-2 text-p2 text-secondary-600">
                                      ({product.regulatoryCategory})
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="p-2 border-t border-pneutral-200 bg-secondary-50 sticky bottom-0">
                            <p className="text-p2 text-pneutral-600">
                              {formData.productTypes.length} of {productTypes.length} selected
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <hr className="border-pneutral-200" />

              <div>
                <div className="flex items-center gap-2 text-label-l5 font-heading font-semibold text-pneutral-900 mb-4">
                  <MapPin size={24} />
                  Company Address
                  <span className="text-warning-500">*</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="State"
                    value={formData.stateId?.toString()}
                    options={stateOptions}
                    editable={!!editingSection}
                    onChange={handleStateChange}
                    placeholder="Select State"
                    isLoading={loadingStates.states}
                  />

                  <SelectField
                    label="District"
                    value={formData.districtId?.toString()}
                    options={districtOptions}
                    editable={!!editingSection && formData.stateId > 0}
                    onChange={handleDistrictChange}
                    placeholder={loadingStates.districts ? "Loading..." : formData.stateId ? "Select District" : "Select State first"}
                    isLoading={loadingStates.districts}
                    isDisabled={!formData.stateId}
                  />

                  <SelectField
                    label="Taluka"
                    value={formData.talukaId?.toString()}
                    options={talukaOptions}
                    editable={!!editingSection && formData.districtId > 0}
                    onChange={handleTalukaChange}
                    placeholder={loadingStates.talukas ? "Loading..." : formData.districtId ? "Select Taluka" : "Select District first"}
                    isLoading={loadingStates.talukas}
                    isDisabled={!formData.districtId}
                  />

                  <Input
                    label="City/Town/Village"
                    value={formData.city}
                    editable={!!editingSection}
                    onChange={handleCityChange}
                    error={cityError}
                  />

                  <Input
                    label="Street/Road/Lane"
                    value={formData.street}
                    editable={!!editingSection}
                    onChange={handleStreetChange}
                    error={streetError}
                  />

                  <Input
                    label="Building/House Number"
                    value={formData.buildingNo}
                    editable={!!editingSection}
                    onChange={handleBuildingNoChange}
                    error={buildingNoError}
                  />

                  <Input
                    label="Landmark"
                    value={formData.landmark}
                    editable={!!editingSection}
                    onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                    hideAsterisk={true}
                  />

                  <Input
                    label="Pin Code"
                    value={formData.pincode}
                    editable={!!editingSection}
                    onChange={handlePincodeChange}
                    error={pincodeError}
                    maxLength={6}
                  />
                </div>
              </div>

              <hr className="border-pneutral-200" />

              <div>
                <div className="flex items-center gap-2 text-label-l4 font-heading font-medium text-pneutral-900 mb-4">
                  <Phone size={24} />
                  Contact Information
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column - Company Phone Number */}
                  <div className="flex flex-col">
                    <label className="text-label-l4 font-heading font-medium text-pneutral-900">
                      <Phone size={16} className="inline mr-2 text-pneutral-600" />
                      Company Phone Number
                      <span className="text-warning-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-0 h-[52px] flex items-center text-pneutral-800 ">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handleCompanyPhoneChange}
                        onBlur={handleCompanyPhoneBlur}
                        disabled={!editingSection}
                        maxLength={10}
                        placeholder="9876543210"
                        className={`w-full h-[52px] pl-12 pr-4 rounded-md text-p4 font-body font-regular
                          ${editingSection
                            ? `bg-base-white border ${companyPhoneError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${editingSection ? 'text-pneutral-800' : 'text-pneutral-800'}`
                            : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
                          }`}
                      />
                      {companyPhoneError && (
                        <p className="mt-1 text-p2 text-warning-500">{companyPhoneError}</p>
                      )}
                      {editingSection && !companyPhoneError && formData.phone && formData.phone.length === 10 && (
                        <p className="mt-1 text-p2 text-success-600">✓ Valid mobile number</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Company Email ID */}
                  <Input
                    label="Company Email ID"
                    value={formData.email}
                    editable={!!editingSection}
                    icon={<Mail size={16} />}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    type="email"
                  />

                  {/* Left Column - Company Website (Half Width) */}
                  <div className="col-span-1">
                    <Input
                      label="Company Website"
                      value={formData.website || ''}
                      editable={!!editingSection}
                      icon={<Globe size={16} />}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                      hideAsterisk={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COORDINATOR */}
        <div id="coordinator-section">
          <SectionCard
            title="Company Coordinator Details"
            icon={<FaRegUser size={24} />}
            iconBg="bg-info-50"
            iconColor="text-pneutral-900"
            underReview={reviewSections.includes("coordinator")}
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Coordinator Name"
                value={formData.coordinatorName}
                editable={!!editingSection}
                maxLength={100}
                icon={<HiOutlineUser size={20} />}
                onChange={handleCoordinatorNameChange}
                error={coordinatorNameError}
              />

              <Input
                label="Coordinator Designation"
                value={formData.coordinatorDesignation}
                editable={!!editingSection}
                maxLength={100}
                icon={<HiOutlineBriefcase size={20} />}
                onChange={handleCoordinatorDesignationChange}
                error={coordinatorDesignationError}
              />

              <div id="coordinator-email-section" className="flex flex-col">
                <label className="text-label-l4 font-heading font-medium text-pneutral-900">
                  <Mail size={16} className="inline mr-2 text-pneutral-600" />
                  Coordinator Email ID
                  <span className="text-warning-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.coordinatorEmail}
                    onChange={handleCoordinatorEmailChange}
                    onBlur={handleCoordinatorEmailBlur}
                    disabled={!editingSection}
                    placeholder="coordinator@company.com"
                    className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular pr-10
                      ${editingSection
                        ? `bg-base-white border ${emailExistsError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${emailExistsError ? 'text-pneutral-800' : 'text-pneutral-800'}`
                        : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
                      }`}
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
                    </div>
                  )}
                  {!isCheckingEmail && formData.coordinatorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail) && !emailExistsError && profileData?.coordinator?.email !== formData.coordinatorEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <GoCheckCircle className="text-success-600" size={20} />
                    </div>
                  )}
                  {!isCheckingEmail && emailExistsError && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-warning-500 text-xl">⚠️</span>
                    </div>
                  )}
                </div>
                {emailExistsError && (
                  <p className="text-p2 text-warning-500">{emailExistsError}</p>
                )}
                {!emailExistsError && formData.coordinatorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail) && !isCheckingEmail && profileData?.coordinator?.email !== formData.coordinatorEmail && (
                  <p className="text-p2 text-success-600">✓ Valid email format</p>
                )}
              </div>

              <div id="coordinator-phone-section" className="flex flex-col">
                <label className="text-label-l4 font-heading font-medium text-pneutral-900">
                  <Phone size={16} className="inline mr-2 text-pneutral-600" />
                  Coordinator Mobile Number
                  <span className="text-warning-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-0 h-[52px] flex items-center text-pneutral-800">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={formData.coordinatorMobile}
                    onChange={handleCoordinatorPhoneChange}
                    onBlur={handleCoordinatorPhoneBlur}
                    disabled={!editingSection}
                    maxLength={10}
                    placeholder="9876543210"
                    className={`w-full h-[52px] pl-12 pr-10 rounded-md text-p4 font-body font-regular
                      ${editingSection
                        ? `bg-base-white border ${coordinatorPhoneError || phoneExistsError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${coordinatorPhoneError || phoneExistsError ? 'text-pneutral-800' : 'text-pneutral-800'}`
                        : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
                      }`}
                  />
                  {isCheckingPhone && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
                    </div>
                  )}
                  {!isCheckingPhone && formData.coordinatorMobile.length === 10 && !coordinatorPhoneError && !phoneExistsError && profileData?.coordinator?.mobile !== formData.coordinatorMobile && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <GoCheckCircle className="text-success-600" size={20} />
                    </div>
                  )}
                  {!isCheckingPhone && phoneExistsError && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-warning-500 text-xl">⚠️</span>
                    </div>
                  )}
                  {coordinatorPhoneError && (
                    <p className="mt-1 text-p2 text-warning-500">{coordinatorPhoneError}</p>
                  )}
                  {phoneExistsError && (
                    <p className="mt-1 text-p2 text-warning-500">{phoneExistsError}</p>
                  )}
                  {editingSection && !coordinatorPhoneError && !phoneExistsError && formData.coordinatorMobile && formData.coordinatorMobile.length === 10 && (
                    <p className="mt-1 text-p2 text-success-600">✓ Valid mobile number</p>
                  )}
                </div>
              </div>

              {(isCheckingEmail || isCheckingPhone) && (
                <div className="col-span-2">
                  {isCheckingEmail && (
                    <p className="text-p3 text-secondary-600 flex items-center gap-1">
                      <span className="animate-spin">⏳</span> Checking email availability...
                    </p>
                  )}
                  {isCheckingPhone && (
                    <p className="text-p3 text-secondary-600 flex items-center gap-1">
                      <span className="animate-spin">⏳</span> Checking phone availability...
                    </p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* LICENSE Sections */}
        {formData.productTypes.map((productName: string, index: number) => {
          const licenseData = formData.licenses[productName] || {
            number: "",
            file: null,
            fileUrl: "",
            issueDate: null,
            expiryDate: null,
            issuingAuthority: "",
            status: 'InActive'
          };

          const currentStatus = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
          const isInactive = currentStatus === 'InActive';
          const hasLicenseError = licenseExistsError[productName] || licenseErrors[productName];

          return (
            <div
              key={productName}
              id={`license-section-${productName.replace(/\s/g, '-')}`}
              className={`${hasLicenseError ? 'border border-pneutral-100 rounded-md' : ''}`}
            >
              <SectionCard
                title={`${productName} License Details`}
                icon={<HiOutlineDocumentCheck size={20} />}
                iconBg="bg-primary-100"
                iconColor="text-sneutral-800"
                underReview={reviewSections.includes(`license-${index}`)}
              >
                {isInactive && licenseData.issueDate && licenseData.expiryDate && (
                  <div className="mb-4 px-4 py-2.5 bg-warning-50 border border-warning-200 rounded-md flex items-center gap-2">
                    <span className="text-warning-500 text-base">⚠️</span>
                    <p className="text-warning-600 text-p3 font-medium">
                      {productName} License is inactive/expired. Please update with a valid license.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column - License Number */}
                  <div className="flex flex-col">
                    <label className="text-label-l4 font-heading font-medium text-pneutral-900">
                      <Hash size={16} className="inline mr-2 text-pneutral-600" />
                      License Number <span className="text-warning-500 ml-1">*</span>
                    </label>
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          value={licenseData.number}
                          onChange={(e) => handleLicenseNumberChangeWithValidation(e, productName)}
                          onKeyDown={handleLicenseKeyDown}
                          onPaste={(e) => handleLicensePaste(e, productName)}
                          onBlur={(e) => handleLicenseNumberBlur(e.target.value, productName)}
                          disabled={!editingSection}
                          placeholder="e.g., TN/CBE/20B-12345"
                          maxLength={30}
                          className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular uppercase pr-10
                            ${editingSection
                              ? `bg-base-white border border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500 ${licenseErrors[productName] || licenseExistsError[productName] ? 'border-pneutral-200' : ''} ${licenseErrors[productName] || licenseExistsError[productName] ? 'text-pneutral-800' : 'text-pneutral-800'}`
                              : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
                            }`}
                        />
                        {isCheckingLicense[productName] && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
                          </div>
                        )}
                        {!isCheckingLicense[productName] && licenseData.number && licenseData.number.length >= 8 && !licenseErrors[productName] && !licenseExistsError[productName] && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <GoCheckCircle className="text-success-600" size={20} />
                          </div>
                        )}
                        {!isCheckingLicense[productName] && licenseExistsError[productName] && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-warning-500 text-xl">⚠️</span>
                          </div>
                        )}
                      </div>
                      {licenseErrors[productName] && (
                        <p className="mt-1 text-p2 text-warning-500 flex items-start">
                          <span className="mr-1">⚠️</span>
                          <span>{licenseErrors[productName]}</span>
                        </p>
                      )}
                      {licenseExistsError[productName] && !licenseErrors[productName] && (
                        <p className="mt-1 text-p2 text-warning-500 flex items-start">
                          <span className="mr-1">⚠️</span>
                          <span>{licenseExistsError[productName]}</span>
                        </p>
                      )}
                      {!licenseErrors[productName] && !licenseExistsError[productName] && licenseData.number && licenseData.number.length >= 8 && (
                        <p className="mt-1 text-p2 text-success-600">✓ Valid license number format</p>
                      )}
                    </div>
                  </div>

                  {/* Left Column - License Issue Date */}
<div className="flex flex-col">
  <label className="text-label-l4 font-heading font-medium text-pneutral-900">
    <Calendar size={16} className="inline mr-2 text-pneutral-600" />
    License Issue Date <span className="text-warning-500 ml-1">*</span>
  </label>
  {editingSection ? (
    <DatePicker
      value={licenseData.issueDate}
      onChange={(date) => handleIssueDateChangeWithValidation(date, productName)}
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
          error: !!licenseDateErrors[productName]?.issue || !!licenseDateErrors[productName]?.gap,
          helperText: licenseDateErrors[productName]?.issue || licenseDateErrors[productName]?.gap,
          sx: {
            '& .MuiOutlinedInput-root': {
              height: '52px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (licenseDateErrors[productName]?.issue || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#d1d5db',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: (licenseDateErrors[productName]?.issue || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#9659FD',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: (licenseDateErrors[productName]?.issue || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#9659FD',
                borderWidth: '2px',
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '16px',
              fontFamily: 'Noto Sans',
              fontWeight: 400,
              color: '#5A5B58',
            },
            '& .clearButton': {
              opacity: '1 !important',
            },
          },
        },
      }}
    />
  ) : (
    <div className="h-[52px] px-4 rounded-md bg-pneutral-50 border border-pneutral-100 flex items-center">
      <IoCalendarOutline className="mr-2 text-pneutral-600" />
      <span className="text-p4 font-body font-regular text-pneutral-800">{licenseData.issueDate ? licenseData.issueDate.toLocaleDateString('en-GB') : '-'}</span>
    </div>
  )}
</div>

{/* Left Column - License Expiry Date */}
<div className="flex flex-col">
  <label className="text-label-l4 font-heading font-medium text-pneutral-900">
    <Calendar size={16} className="inline mr-2 text-pneutral-600" />
    License Expiry Date <span className="text-warning-500 ml-1">*</span>
  </label>
  {editingSection ? (
    <DatePicker
      value={licenseData.expiryDate}
      onChange={(date) => handleExpiryDateChangeWithValidation(date, productName)}
      minDate={licenseData.issueDate || undefined}
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
          error: !!licenseDateErrors[productName]?.expiry || !!licenseDateErrors[productName]?.gap,
          helperText: licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap,
          sx: {
            '& .MuiOutlinedInput-root': {
              height: '52px  !important',
              minHeight: '52px !important',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#d1d5db',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: (licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#9659FD',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: (licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#9659FD',
                borderWidth: '2px',
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '16px',
              fontFamily: 'Noto Sans',
              fontWeight: 400,
              color: '#5A5B58',
            },
            '& .clearButton': {
              opacity: '1 !important',
            },
          },
        },
      }}
    />
  ) : (
    <div className="h-[52px] px-4 rounded-md bg-pneutral-50 border border-pneutral-100 flex items-center">
      <IoCalendarOutline className="mr-2 text-pneutral-800" />
      <span className="text-p4 font-body font-regular text-pneutral-800">{licenseData.expiryDate ? licenseData.expiryDate.toLocaleDateString('en-GB') : '-'}</span>
    </div>
  )}
  {/* {(licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap) && (
    <p className="text-p2 text-warning-500 mt-1">
      {licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap}
    </p>
  )} */}
</div>

                  {/* Right Column - License Issuing Authority */}
                  <Input
                    label="License Issuing Authority"
                    value={licenseData.issuingAuthority}
                    editable={!!editingSection}
                    icon={<HiOutlineAcademicCap size={20} />}
                    onChange={(e) => handleIssuingAuthorityChangeWithValidation(e, productName)}
                    error={licenseIssuingAuthorityErrors[productName]}
                  />

                  {/* Left Column - Half Width - License Copy */}
                  <div className="col-span-1">
                    <FileField
                      key={licenseData.fileUrl}
                      label="License Copy"
                      file={licenseData.fileUrl?.split('/').pop() || 'Upload Document'}
                      fileUrl={licenseData.fileUrl}
                      editable={!!editingSection}
                      onDownload={() => handleDownload(licenseData.fileUrl || '#', licenseData.fileUrl?.split('/').pop() || 'license.pdf')}
                      onView={() => handleViewInNewTab(licenseData.fileUrl || '#')}
                      onFileSelect={(file: File) => {
                        handleLicenseFileChange(file, productName, licenseData.productTypeId);
                      }}
                      // error={licenseCertError && sellerNameChanged ? "License copy is required when changing seller name" : ""}
                      // error={licenseCertErrors[productName] && sellerNameChanged ? `License copy for ${productName} is required when changing seller name` : ""}
                      error={
    (licenseNumbersChanged[productName] && editingSection && !licenseData.file && licenseData.fileUrl !== "PENDING")
      ? `⚠️ New license copy is required for ${productName} as the license number has changed`
      : (licenseCertErrors[productName] && sellerNameChanged ? `License copy for ${productName} is required when changing seller name` : "")
  }
                    />
                    {/* {licenseCertError && sellerNameChanged && editingSection && (
                      <p className="text-p2 text-warning-600 mt-1">
                        ⚠️ Required when changing seller name
                      </p>
                    )} */}
                  </div>

                  {/* Right Column - License Status */}
                  <div className="flex flex-col gap-2 py-8">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${currentStatus === 'Active' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                      }`}>
                      <GoCheckCircle size={16} />
                      <span className="text-p3 font-medium">
                        {!licenseData.issueDate || !licenseData.expiryDate ? 'Pending' : currentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          );
        })}

        {/* GST Section */}
        <div id="gst-section">
          <SectionCard
            title="GSTIN Details"
            icon={<FileText size={20} />}
            iconBg="bg-danger-50"
            iconColor="text-warning-500"
            underReview={reviewSections.includes("gst")}
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
  <label className="text-label-l4 font-heading font-medium text-pneutral-900">
    GSTIN Number
    <span className="text-warning-500 ml-1">*</span>
  </label>
  <div className="relative">
    <input
      type="text"
      value={formData.gstNumber}
      onChange={handleGSTChangeWithValidation}
      onBlur={handleGSTBlur}
      disabled={!editingSection}
      maxLength={15}
      placeholder="22AAAAA0000A1Z"
      className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular uppercase pr-10
        ${editingSection
          ? `bg-base-white border ${gstExistsError || gstNumberError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'}`
          : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
        }`}
    />
    {/* {isCheckingGST && (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
      </div>
    )} */}
    {/* {!isCheckingGST && formData.gstNumber && formData.gstNumber.length === 15 && validateGSTNumberFormat(formData.gstNumber) && !gstExistsError && !gstNumberError && profileData?.sellerGST?.gstNumber !== formData.gstNumber && (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <GoCheckCircle className="text-success-600" size={20} />
      </div>
    )} */}
    {/* {!isCheckingGST && (gstExistsError || gstNumberError) && (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <span className="text-warning-500 text-xl">⚠️</span>
      </div>
    )} */}
  </div>
  {gstNumberError && (
    <p className="text-p2 text-warning-500">{gstNumberError}</p>
  )}
  {gstExistsError && (
    <p className="text-p2 text-warning-500">{gstExistsError}</p>
  )}
  {!gstNumberError && !gstExistsError && formData.gstNumber && formData.gstNumber.length === 15 && validateGSTNumberFormat(formData.gstNumber) && !isCheckingGST && profileData?.sellerGST?.gstNumber !== formData.gstNumber && (
    <p className="text-p2 text-success-600">✓ Valid GST number format</p>
  )}
  {formData.gstNumber && formData.gstNumber.length > 0 && formData.gstNumber.length !== 15 && (
    <p className="text-p2 text-warning-500">GST number must be 15 characters</p>
  )}
</div>

              <FileField
                key={formData.gstFileUrl}
                label="GST Certificate"
                file={formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf'}
                fileUrl={formData.gstFileUrl}
                editable={!!editingSection}
                onDownload={() => handleDownload(formData.gstFileUrl || '#', formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf')}
                onView={() => handleViewInNewTab(formData.gstFileUrl || '#')}
                onFileSelect={(file: File) => handleGSTFileChange(file)}
                // error={gstCertError && sellerNameChanged ? "GST Certificate is required when changing seller name" : ""}
                error={
    (gstNumberChanged && editingSection && !formData.gstFile && formData.gstFileUrl !== "PENDING") 
      ? "⚠️ New GST Certificate is required when changing GST number" 
      : (gstCertError && sellerNameChanged ? "GST Certificate is required when changing seller name" : "")
  } 
              />
              {/* {gstCertError && sellerNameChanged && editingSection && (
                <p className="text-p2 text-warning-600 mt-1">
                  ⚠️ Required when changing seller name
                </p>
              )} */}
            </div>
          </SectionCard>
        </div>

        {/* BANK */}
        <div id="bank-section">
          <SectionCard
            title="Bank Details"
            icon={<Image
              src="/icons/bank.jpg"
              alt="Bank Details"
              width={20}
              height={20}
              className="object-contain"
            />}
            iconBg="bg-info-50"
            iconColor="text-info-700"
            underReview={reviewSections.includes("bank")}
          >
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Bank Name */}
              <div>
                <Input
                  label="Bank Name"
                  value={formData.bankName}
                  editable={false}
                />
              </div>

              {/* Right Column - Branch */}
              <div>
                <Input
                  label="Branch"
                  value={formData.branch}
                  editable={false}
                />
              </div>

              {/* Left Column - Account Number */}
              <div>
                <Input
                  label="Account Number"
                  value={formData.accountNumber}
                  editable={!!editingSection}
                  onChange={handleAccountNumberChange}
                  error={accountNumberError}
                  maxLength={18}
                />
              </div>

              {/* Right Column - IFSC Code */}
              <div>
                <Input
                  label="IFSC Code"
                  value={formData.ifscCode}
                  editable={!!editingSection}
                  onChange={(e) => handleIfscChange(e.target.value)}
                  maxLength={11}
                  className="uppercase"
                  error={ifscValidationError || ifscError}
                />
              </div>

              {/* Left Column - Beneficiary Name */}
              <div>
                <Input
                  label="Beneficiary Name"
                  value={formData.accountHolderName}
                  editable={!!editingSection}
                  onChange={handleAccountHolderNameChange}
                  error={accountHolderNameError}
                />
              </div>

              {/* Right Column - Cancelled Cheque */}
<div>
  <FileField
    key={formData.cancelledChequeFileUrl}
    label="Cancelled Cheque / Bank Passbook"
    file={formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf'}
    fileUrl={formData.cancelledChequeFileUrl}
    editable={!!editingSection}
    onDownload={() => handleDownload(formData.cancelledChequeFileUrl || '#', formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf')}
    onView={() => handleViewInNewTab(formData.cancelledChequeFileUrl || '#')}
    onFileSelect={(file: File) => handleBankFileChange(file)}
    error={(ifscCodeChanged && editingSection && !formData.cancelledChequeFile && formData.cancelledChequeFileUrl !== "PENDING") 
      ? "⚠️ New cancelled cheque/bank passbook is required when changing IFSC code" 
      : (bankCertError && sellerNameChanged ? "Bank proof is required when changing seller name" : "")}
  />
  {/* {ifscCodeChanged && editingSection && !formData.cancelledChequeFile && formData.cancelledChequeFileUrl !== "PENDING" && (
    <p className="text-p2 text-warning-600 mt-1 flex items-start gap-1">
      <span>⚠️</span>
      <span>Required when changing IFSC code - Please upload a new cancelled cheque/bank passbook with updated bank details</span>
    </p>
  )} */}
  {/* {bankCertError && sellerNameChanged && editingSection && (
    <p className="text-p2 text-warning-600 mt-1">
      ⚠️ Required when changing seller name
    </p>
  )} */}
</div>

              
            </div>
          </SectionCard>

          {editingSection && (
            <div className="flex justify-between gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  console.log('Cancel clicked');
                  handleCancel();
                }}
                className="flex items-center gap-2 border-2 border-warning-500 text-warning-500 text-p3 font-semibold px-6 py-3 rounded-md hover:bg-warning-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  console.log('Submit clicked - starting save...');
                  await handleSaveAll();
                }}
                disabled={isSubmitting}
                className={`flex items-center gap-2 bg-primary-900 font-semibold text-base-white text-p3 px-6 py-3 rounded-md transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-800'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-base-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          )}
        </div>

        <OtpVerificationModal
          show={showOtpModal}
          email={pendingEmail}
          phone={pendingPhone}
          onClose={() => {
            setShowOtpModal(false);
            setPendingEmail(undefined);
            setPendingPhone(undefined);
            setPendingSectionData(null);
            setPendingSection(null);
          }}
          onVerified={handleOtpVerified}
        />
      </div>
    </LocalizationProvider>
  );
}

function SectionCard({
  title,
  icon,
  iconBg,
  iconColor,
  children,
  underReview
}: any) {
  return (
    <div className={`bg-base-white rounded-md overflow-hidden border ${underReview ? "border-pneutral-200" : "border-pneutral-200"}`}>
      <div className="flex items-center justify-between px-6 py-4 bg-pneutral-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <h2 className="text-h6 font-heading font-medium text-pneutral-900">
            {title}
          </h2>
        </div>
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

interface InputProps {
  label: string;
  value: string;
  editable: boolean;
  icon?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  type?: string;
  className?: string;
  error?: string;
  hideAsterisk?: boolean;
  placeholder?: string;
}

function Input({
  label,
  value,
  editable,
  icon,
  onChange,
  maxLength,
  type = "text",
  className = "",
  error,
  hideAsterisk = false,
  placeholder
}: InputProps) {
  return (
    <div className="flex flex-col">
      <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
        {icon && (
          <span className="text-pneutral-600 inline-flex items-center">
            {icon}
          </span>
        )}
        {label}
        {!hideAsterisk && <span className="text-warning-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={!editable}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular ${className}
        ${editable
            ? `bg-base-white border ${error ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${editable ? 'text-pneutral-800' : 'text-pneutral-800'}`
            : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
          }
        `}
      />
      {error && (
        <p className="text-p2 text-warning-500 mt-1">{error}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  editable,
  labelIcon,
  inputIcon,
  onChange,
  placeholder,
  isLoading,
  isDisabled
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder || "Select option";

  const handleSelect = (selectedValue: string, selectedLabel: string) => {
    onChange({ value: selectedValue, label: selectedLabel });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col">
      <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
        {labelIcon && (
          <span className="text-pneutral-600 inline-flex items-center">
            {labelIcon}
          </span>
        )}
        {label}
        <span className="text-warning-500">*</span>
      </label>
      <div className="relative" ref={dropdownRef}>
        <div
          className={`w-full h-[52px] px-4 rounded-md border flex items-center justify-between cursor-pointer overflow-hidden
            ${editable && !isDisabled && !isLoading
              ? `bg-base-white border-pneutral-200  focus:outline-none focus:ring-2 focus:ring-secondary-500 ${isOpen ? 'ring-2 ring-secondary-500 border-secondary-500' : ''}`
              : "bg-pneutral-50 border-pneutral-100 cursor-not-allowed"
            }`}
          onClick={() => {
            if (editable && !isDisabled && !isLoading) {
              setIsOpen(!isOpen);
            }
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            {inputIcon && <span className="text-pneutral-800 shrink-0">{inputIcon}</span>}
            <span className={`text-p4 font-body font-regular truncate ${!selectedOption ? "text-pneutral-500" : editable ? "text-pneutral-800" : "text-pneutral-800"}`}>
              {isLoading ? "Loading..." : displayValue}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-pneutral-500 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {isOpen && editable && !isDisabled && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-base-white border border-pneutral-200 rounded-md shadow-xlg z-50 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {options.length > 0 ? (
                options.map((opt: any) => (
                  <div
                    key={opt.value}
                    className={`px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200 last:border-b-0
                      ${value === opt.value ? "bg-secondary-50 text-secondary-700 font-medium" : "text-pneutral-900"}`}
                    onClick={() => handleSelect(opt.value, opt.label)}
                  >
                    <span className="text-p3">{opt.label}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-p3 text-pneutral-500 text-center">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



function FileField({
  label,
  file,
  editable,
  onDownload,
  onView,
  onFileSelect,
  fileUrl,
  error
}: any) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevEditableRef = useRef(editable);

  useEffect(() => {
    if (prevEditableRef.current === true && editable === false) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFile(null);
    }
    prevEditableRef.current = editable;
  }, [editable]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedFile(null);
  }, [fileUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (!files || !files[0]) return;

    const file = files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png"
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
      return;
    }

    setSelectedFile(file);

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const displayFileName = selectedFile
    ? selectedFile.name
    : file ||
    (fileUrl && fileUrl !== "PENDING"
      ? fileUrl.split("/").pop()
      : "No file chosen");

  const isPending = fileUrl === "PENDING";

  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
          <FileText size={16} className="text-pneutral-600" />
          {label}
          <span className="text-warning-500">*</span>
        </label>
      )}

      {editable ? (
        <>
          <div className="w-full h-[52px] rounded-md border border-primary-600 bg-primary-100 px-4 flex items-center justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon Box */}
              <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                <FileText size={16} className="text-black" />
              </div>

              {/* File Name */}
              <div className="flex-1 min-w-0">
                <div className="h-[26px] bg-success-50 rounded-[6px] px-3 flex items-center w-fit max-w-full">
                  <span className="text-[18px] leading-[18px] font-medium text-secondary-800 truncate block max-w-[220px]">
                    {displayFileName}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={handleReplaceClick}
                className="text-secondary-900 hover:opacity-80"
                title="Replace file"
              >
                <Pencil size={18} />
              </button>

              <button
                type="button"
                onClick={onDownload}
                className="text-secondary-800 hover:opacity-80"
                title="Download file"
              >
                <Download size={20} />
              </button>

              <button
                type="button"
                onClick={onView}
                className="text-secondary-800 hover:opacity-80"
                title="Open in new tab"
              >
                <ExternalLink size={20} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {error && (
            <p className="text-p2 text-warning-500 mt-1">{error}</p>
          )}
        </>
      ) : (
        <div className="w-full h-[52px] rounded-md border border-primary-600 bg-primary-100 px-4 flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon Box */}
            <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0">
              <FileText size={16} className="text-black" />
            </div>

            {/* File Name */}
            <div className="flex-1 min-w-0">
              <div className="h-[26px] bg-success-50 rounded-[6px] px-3 flex items-center w-fit max-w-full">
                <span className="text-[18px] leading-[18px] font-medium text-secondary-800 truncate block max-w-[220px]">
                  {isPending ? "Pending Approval" : displayFileName}
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={onDownload}
              className={`transition-colors ${isPending
                ? "text-pneutral-400 cursor-not-allowed"
                : "text-secondary-800 hover:opacity-80"
                }`}
              title="Download file"
              disabled={isPending}
            >
              <Download size={20} />
            </button>

            <button
              onClick={onView}
              className={`transition-colors ${isPending
                ? "text-pneutral-400 cursor-not-allowed"
                : "text-secondary-800 hover:opacity-80"
                }`}
              title="Open in new tab"
              disabled={isPending}
            >
              <ExternalLink size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}







// old code dated 04.06.2026...................

// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import {
//   Building2,
//   Phone,
//   MapPin,
//   Download,
//   ExternalLink,
//   Pencil,
//   ChevronUp,
//   FileText,
//   ChevronDown,
//   Hash,
//   Calendar,

//   Globe,
//   Mail,
//   MapPin as MapPinIcon,
//   X
// } from "lucide-react";
// import { GoCheckCircle } from "react-icons/go";
// import { PiInfo } from "react-icons/pi";
// import { MdSchedule } from "react-icons/md";
// import { HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineBuildingOffice2, HiOutlineDocumentCheck, HiOutlineUser } from "react-icons/hi2";
// import { FaRegUser } from "react-icons/fa";
// import { IoCalendarOutline } from "react-icons/io5";
// import Image from "next/image";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import { sellerProfileService } from "@/src/services/seller/sellerProfileService";

// import { updateProfileService } from "@/src/services/seller/updateProfileService";
// import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
// import { fetchBankDetails } from "@/src/services/seller/IFSCService";
// import { type SellerProfile, type SellerDocument } from "@/src/types/seller/SellerProfileData";
// import { uploadSellerDocuments, deleteUpdateRequest } from "@/src/services/seller/UpdateSellerProfileDoc";
// import {
//   CompanyTypeResponse,
//   SellerTypeResponse,
//   ProductTypeResponse,
//   StateResponse,
//   DistrictResponse,
//   TalukaResponse,
// } from "@/src/types/seller/SellerRegMasterData";

// import {
//   UpdateSellerProfileRequest
// } from "@/src/types/seller/UpdateProfileData";

// import { validateSection } from "@/src/schema/seller/UpdateProfileSchema";
// import { ifscSchema } from "@/src/schema/seller/IFSCSchema";

// import OtpVerificationModal from "./OtpVerificationModal";
// import toast from "react-hot-toast";

// // Validation regex patterns
// const noConsecutiveSpaces = /^(?!.*\s{2,})[A-Za-z0-9\s.,#-]+$/;
// const alphabetsOnly = /^[A-Za-z\s]+$/;
// const alphanumericWithSpaces = /^[A-Za-z0-9\s]+$/;

// // Helper function to calculate license status based on dates - returns only Active or InActive
// const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): 'Active' | 'InActive' => {
//   if (!issueDate || !expiryDate) {
//     return 'InActive';
//   }

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const expDate = new Date(expiryDate);
//   expDate.setHours(0, 0, 0, 0);

//   // Check if expired
//   if (expDate < today) {
//     return 'InActive';
//   }

//   return 'Active';
// };

// // Function to check if date gap exceeds 5 years
// // Function to check if date gap exceeds 5 years
// const isDateGapExceedingFiveYears = (issueDate: Date | null, expiryDate: Date | null): boolean => {
//   if (!issueDate || !expiryDate) return false;
  
//   // Create copies to avoid mutating original dates
//   const start = new Date(issueDate);
//   const end = new Date(expiryDate);
  
//   // Calculate difference in milliseconds
//   const diffInMs = end.getTime() - start.getTime();
  
//   // Convert to years (365.25 days average including leap years)
//   const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
  
//   // Return true if difference exceeds 5 years
//   return diffInYears > 5;
// };

// // Drug License Number validation functions
// const validateDrugLicenseNumber = (value: string): string | null => {
//   const cleaned = value.trim().toUpperCase();

//   if (!cleaned) {
//     return "Drug License Number is required";
//   }

//   // Check length (minimum 8, maximum 30 characters)
//   if (cleaned.length < 8) {
//     return "Must be at least 8 characters";
//   }

//   if (cleaned.length > 30) {
//     return "Cannot exceed 30 characters";
//   }

//   // Pattern validation for common Drug License formats
//   const patterns = [
//     /^[A-Z]{2}\/[A-Z]{3}\/\d{2}[A-Z]?-\d{3,10}$/,      // TN/CBE/20B-12345
//     /^[A-Z]{2}-[A-Z0-9]{2,4}-\d{4,10}$/,                // MH-MZ2-123456
//     /^[A-Z]{2}-\d{2,3}-\d{5,10}$/,                      // DL-123-234567
//     /^\d{2}[A-Z]?-\d{3,10}$/,                           // 20B-12345
//     /^\d{2}\/\d{2}-\d{3,10}$/,                          // 20/21-12345
//     /^[A-Z]{2}\/\d{2}[A-Z]?-\d{3,10}$/,                 // MH/20B-12345
//     /^[A-Z]{2}\/\d{2,3}\/\d{4,10}$/,                    // MH/27/123456
//     /^[A-Z]{2}[A-Z0-9]{2,4}\d{4,10}$/,                  // TN20B12345
//   ];

//   const isValid = patterns.some(pattern => pattern.test(cleaned));

//   if (!isValid) {
//     return "Invalid format";
//   }

//   return null;
// };

// // Function to clean and format license number on input
// const formatLicenseNumber = (value: string): string => {
//   let cleaned = value.toUpperCase();
//   cleaned = cleaned.replace(/[^A-Z0-9\/\-]/g, '');
//   return cleaned;
// };

// // Indian Mobile Number validation function
// const validateIndianMobileNumber = (value: string): string | null => {
//   const cleaned = value.replace(/\D/g, '');

//   if (!cleaned) {
//     return null;
//   }

//   if (cleaned.length !== 10) {
//     return "Mobile number must be exactly 10 digits";
//   }

//   const firstDigit = cleaned.charAt(0);
//   if (!['6', '7', '8', '9'].includes(firstDigit)) {
//     return "Mobile number must start with 6, 7, 8, or 9";
//   }

//   return null;
// };

// // Seller Name validation
// const validateSellerName = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Seller name is required";
//   }
//   if (value.length > 60) {
//     return "Seller name cannot exceed 60 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Seller name should not contain consecutive spaces";
//   }
//   if (!noConsecutiveSpaces.test(value)) {
//     return "Seller name contains invalid characters";
//   }
//   return null;
// };

// // City validation
// const validateCity = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "City is required";
//   }
//   if (value.length > 100) {
//     return "City cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "City should not contain consecutive spaces";
//   }
//   return null;
// };

// // Street validation
// const validateStreet = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Street is required";
//   }
//   if (value.length > 100) {
//     return "Street cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Street should not contain consecutive spaces";
//   }
//   return null;
// };

// // Building Number validation
// const validateBuildingNo = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Building number is required";
//   }
//   if (value.length > 50) {
//     return "Building number cannot exceed 50 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Building number should not contain consecutive spaces";
//   }
//   return null;
// };

// // Pincode validation
// const validatePincode = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Pin code is required";
//   }
//   if (value.length !== 6) {
//     return "Pin code must be 6 digits";
//   }
//   if (!/^\d+$/.test(value)) {
//     return "Pin code must contain only digits";
//   }
//   return null;
// };

// // Coordinator Name validation
// const validateCoordinatorName = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Coordinator name is required";
//   }
//   if (value.length > 100) {
//     return "Coordinator name cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Coordinator name should not contain consecutive spaces";
//   }
//   if (!alphanumericWithSpaces.test(value)) {
//     return "Coordinator name should only contain letters, numbers, and spaces";
//   }
//   return null;
// };

// // Coordinator Designation validation
// const validateCoordinatorDesignation = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Designation is required";
//   }
//   if (value.length > 100) {
//     return "Designation cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Designation should not contain consecutive spaces";
//   }
//   if (!alphanumericWithSpaces.test(value)) {
//     return "Designation should only contain letters, numbers, and spaces";
//   }
//   return null;
// };

// // Coordinator Email validation
// const validateCoordinatorEmail = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Email is required";
//   }
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(value)) {
//     return "Invalid email format";
//   }
//   return null;
// };

// // GST Number validation
// const validateGSTNumber = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "GST number is required";
//   }
//   if (value.length !== 15) {
//     return "GST number must be 15 characters";
//   }
//   // Exact GST pattern from registration
//   const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
//   if (!gstRegex.test(value)) {
//     return "Invalid GST number format (e.g., 22AAAAA0000A1Z)";
//   }
//   return null;
// };

// // Account Number validation
// const validateAccountNumber = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Account number is required";
//   }
//   if (!/^\d{9,18}$/.test(value)) {
//     return "Account number must be 9 to 18 digits";
//   }
//   return null;
// };

// // Account Holder Name validation
// const validateAccountHolderName = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Account holder name is required";
//   }
//   if (value.length > 100) {
//     return "Account holder name cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Account holder name should not contain consecutive spaces";
//   }
//   if (!alphabetsOnly.test(value)) {
//     return "Account holder name should only contain alphabets and spaces";
//   }
//   return null;
// };

// // IFSC validation
// const validateIFSC = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "IFSC code is required";
//   }
//   if (value.length !== 11) {
//     return "IFSC code must be 11 characters";
//   }
//   const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
//   if (!ifscRegex.test(value)) {
//     return "Invalid IFSC format";
//   }
//   return null;
// };

// // License Issuing Authority validation
// // License Issuing Authority validation - Only alphanumeric and spaces
// const validateIssuingAuthority = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Issuing authority is required";
//   }
//   if (value.length > 150) {
//     return "Issuing authority cannot exceed 150 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Issuing authority should not contain consecutive spaces";
//   }
//   // Only allow alphanumeric characters and spaces (no special characters)
//   if (!/^[A-Za-z0-9\s]+$/.test(value)) {
//     return "Issuing authority should only contain letters, numbers, and spaces (no special characters)";
//   }
//   return null;
// };

// // Date validation
// const validateIssueDate = (date: Date | null): string | null => {
//   if (!date) {
//     return "Issue date is required";
//   }
//   if (date.getFullYear() < 2000) {
//     return "Year must be 2000 or greater";
//   }
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   if (date > today) {
//     return "Issue date cannot be in the future";
//   }
//   return null;
// };

// const validateExpiryDate = (date: Date | null, issueDate: Date | null): string | null => {
//   if (!date) {
//     return "Expiry date is required";
//   }
//   if (date.getFullYear() < 2000) {
//     return "Year must be 2000 or greater";
//   }
//   if (issueDate && date < issueDate) {
//     return "Expiry date cannot be earlier than issue date";
//   }
//   return null;
// };

// interface UpdateProfileResponse {
//   message?: string;
//   pendingSellerId?: number;
//   documents?: Array<{
//     id?: number;
//     pendingSellerDocumentId?: number;
//     productTypeId?: number;
//     productType?: {
//       productTypeId: number;
//     };
//   }>;
//   status?: string;
//   data?: {
//     status?: string;
//     message?: string;
//     data?: {
//       status?: string;
//       message?: string;
//     };
//   };
// }

// export default function SellerProfile() {
//   const [profileData, setProfileData] = useState<SellerProfile | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [editingSection, setEditingSection] = useState<string | null>(null);
//   const [reviewSections, setReviewSections] = useState<string[]>([]);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [savedSection, setSavedSection] = useState<string | null>(null);
//   const [pendingRequestError, setPendingRequestError] = useState<string | null>(null);

//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [pendingEmail, setPendingEmail] = useState<string | undefined>();
//   const [pendingPhone, setPendingPhone] = useState<string | undefined>();
//   const [pendingSectionData, setPendingSectionData] = useState<any>(null);
//   const [pendingSection, setPendingSection] = useState<string | null>(null);

//   const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
//   const productDropdownRef = useRef<HTMLDivElement>(null);

//   const phoneCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const licenseCheckTimeoutRef = useRef<Record<string, NodeJS.Timeout | null>>({});
//   const gstCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([]);
//   const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([]);
//   const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([]);
//   const [states, setStates] = useState<StateResponse[]>([]);
//   const [districts, setDistricts] = useState<DistrictResponse[]>([]);
//   const [talukas, setTalukas] = useState<TalukaResponse[]>([]);
//   const [sellerNameChanged, setSellerNameChanged] = useState(false);

//   const [companyCertError, setCompanyCertError] = useState(false);
//   const [gstCertError, setGSTCertError] = useState(false);
//   const [licenseCertError, setLicenseCertError] = useState(false);
//   const [bankCertError, setBankCertError] = useState(false);
//   const [ifscCodeChanged, setIfscCodeChanged] = useState(false);


//   const handleSellerNameChangeWithTracking = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     if (value.length > 60) return;

//     setFormData(prev => ({ ...prev, sellerName: value }));
//     const error = validateSellerName(value);
//     setSellerNameError(error || "");

//     // Track if seller name has changed from original profile data
//     console.log("Profile data seller name:", profileData?.sellerName);
//     console.log("Current value:", value);
//     console.log("Is changed:", profileData && value !== profileData.sellerName);

//     if (profileData && value !== profileData.sellerName) {
//       setSellerNameChanged(true);
//     } else {
//       setSellerNameChanged(false);
//     }
//   };

//   const [changedFiles, setChangedFiles] = useState<{
//     gstFile: File | null;
//     companyCertFile: File | null;
//     bankFile: File | null;
//     licenses: Array<{
//       productName: string;
//       productTypeId: number;
//       file: File;
//     }>;
//   }>({
//     gstFile: null,
//     companyCertFile: null,
//     bankFile: null,
//     licenses: []
//   });

//   const [hasDocumentChanges, setHasDocumentChanges] = useState(false);

//   const [loadingStates, setLoadingStates] = useState({
//     companyTypes: true,
//     sellerTypes: true,
//     productTypes: true,
//     states: true,
//     districts: false,
//     talukas: false,
//   });

//   const [ifscError, setIfscError] = useState("");
//   const [isCheckingEmail, setIsCheckingEmail] = useState(false);
//   const [emailExistsError, setEmailExistsError] = useState("");
//   const [isCheckingPhone, setIsCheckingPhone] = useState(false);
//   const [phoneExistsError, setPhoneExistsError] = useState("");
//   const [companyPhoneError, setCompanyPhoneError] = useState("");
//   const [coordinatorPhoneError, setCoordinatorPhoneError] = useState("");
//   const [licenseErrors, setLicenseErrors] = useState<Record<string, string>>({});
//   const [licenseExistsError, setLicenseExistsError] = useState<Record<string, string>>({});
//   const [isCheckingLicense, setIsCheckingLicense] = useState<Record<string, boolean>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [inactiveLicenses, setInactiveLicenses] = useState<string[]>([]);
//   const [showInactiveError, setShowInactiveError] = useState(false);

//   // New validation error states
//   const [sellerNameError, setSellerNameError] = useState("");
//   const [cityError, setCityError] = useState("");
//   const [streetError, setStreetError] = useState("");
//   const [buildingNoError, setBuildingNoError] = useState("");
//   const [pincodeError, setPincodeError] = useState("");
//   const [coordinatorNameError, setCoordinatorNameError] = useState("");
//   const [coordinatorDesignationError, setCoordinatorDesignationError] = useState("");
//   const [coordinatorEmailError, setCoordinatorEmailError] = useState("");
//   const [gstNumberError, setGstNumberError] = useState("");
//   const [accountNumberError, setAccountNumberError] = useState("");
//   const [accountHolderNameError, setAccountHolderNameError] = useState("");
//   const [ifscValidationError, setIfscValidationError] = useState("");
//   const [licenseIssuingAuthorityErrors, setLicenseIssuingAuthorityErrors] = useState<Record<string, string>>({});
//   const [licenseDateErrors, setLicenseDateErrors] = useState<Record<string, { issue?: string; expiry?: string; gap?: string }>>({});
//   const [addressChanged, setAddressChanged] = useState(false);

//   // GST check states
//   const [isCheckingGST, setIsCheckingGST] = useState(false);
//   const [gstExistsError, setGSTExistsError] = useState("");

//   const [formData, setFormData] = useState({
//     companyTypeId: 0,
//     sellerTypeId: 0,
//     productTypeIds: [] as number[],
//     stateId: 0,
//     districtId: 0,
//     talukaId: 0,
//     sellerName: "",
//     companyType: "",
//     sellerType: "",
//     productTypes: [] as string[],
//     state: "",
//     district: "",
//     taluka: "",
//     city: "",
//     street: "",
//     buildingNo: "",
//     landmark: "",
//     pincode: "",
//     phone: "",
//     email: "",
//     website: "",
//     coordinatorName: "",
//     coordinatorDesignation: "",
//     coordinatorEmail: "",
//     coordinatorMobile: "",
//     gstNumber: "",
//     gstFile: null as File | null,
//     gstFileUrl: "",
//     companyRegistrationCertificateFile: null as File | null,
//     companyRegistrationCertificateUrl: "",
//     licenses: {} as Record<string, {
//       number: string;
//       file: File | null;
//       fileUrl: string;
//       issueDate: Date | null;
//       expiryDate: Date | null;
//       issuingAuthority: string;
//       status: 'Active' | 'InActive';
//       productTypeId: number;
//       documentId?: number;
//     }>,
//     bankState: "",
//     bankDistrict: "",
//     bankName: "",
//     branch: "",
//     ifscCode: "",
//     accountNumber: "",
//     accountHolderName: "",
//     confirmAccountNumber: "",
//     cancelledChequeFile: null as File | null,
//     cancelledChequeFileUrl: "",
//   });

//   // Helper function to scroll to specific error element
//   const scrollToError = (errorType: string, productName?: string) => {
//     if (errorType === 'email') {
//       const emailElement = document.getElementById('coordinator-email-section');
//       if (emailElement) {
//         emailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         emailElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
//         setTimeout(() => {
//           emailElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'phone') {
//       const phoneElement = document.getElementById('coordinator-phone-section');
//       if (phoneElement) {
//         phoneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         phoneElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
//         setTimeout(() => {
//           phoneElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'license-exists' && productName) {
//       const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
//       const element = document.getElementById(elementId);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'license-format' && productName) {
//       const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
//       const element = document.getElementById(elementId);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'empty-license' && productName) {
//       const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
//       const element = document.getElementById(elementId);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'gst') {
//       const gstElement = document.getElementById('gst-section');
//       if (gstElement) {
//         gstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         gstElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           gstElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'inactive-license') {
//       const firstInactiveLicense = inactiveLicenses[0];
//       if (firstInactiveLicense) {
//         const elementId = `license-section-${firstInactiveLicense.replace(/\s/g, '-')}`;
//         const element = document.getElementById(elementId);
//         if (element) {
//           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//           element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//           setTimeout(() => {
//             element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//           }, 3000);
//         } else {
//           window.scrollTo({ top: 0, behavior: 'smooth' });
//         }
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'seller-name') {
//       const element = document.getElementById('seller-name-field');
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else {
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const scrollToTop = () => {
//     window.scrollTo({
//       top: 0,
//       behavior: 'smooth'
//     });
//   };

//   useEffect(() => {
//     return () => {
//       if (phoneCheckTimeoutRef.current) {
//         clearTimeout(phoneCheckTimeoutRef.current);
//       }
//       if (emailCheckTimeoutRef.current) {
//         clearTimeout(emailCheckTimeoutRef.current);
//       }
//       if (gstCheckTimeoutRef.current) {
//         clearTimeout(gstCheckTimeoutRef.current);
//       }
//       Object.values(licenseCheckTimeoutRef.current).forEach(timeout => {
//         if (timeout) clearTimeout(timeout);
//       });
//     };
//   }, []);

//   useEffect(() => {
//     const inactive: string[] = [];
//     Object.entries(formData.licenses).forEach(([productName, licenseData]) => {
//       if (licenseData.issueDate && licenseData.expiryDate) {
//         const status = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
//         if (status === 'InActive') {
//           inactive.push(productName);
//         }
//       }
//     });
//     setInactiveLicenses(inactive);
//   }, [formData.licenses]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         productDropdownRef.current &&
//         !productDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsProductDropdownOpen(false)
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside)
//     return () => document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   useEffect(() => {
//     fetchCompanyTypes();
//     fetchStates();
//     fetchSellerTypes();
//     fetchProductTypes();
//   }, []);

//   const resetFormData = () => {
//     if (profileData) {
//       const licenses: Record<string, any> = {};
//       profileData.documents.forEach((doc: SellerDocument) => {
//         const productName = doc.productTypes?.productTypeName;
//         if (productName) {
//           const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
//           const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
//           const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//           licenses[productName] = {
//             documentId: doc.sellerDocumentsId,
//             number: doc.documentNumber || "",
//             file: null,
//             fileUrl: doc.documentFileUrl || "",
//             issueDate: issueDate,
//             expiryDate: expiryDate,
//             issuingAuthority: doc.licenseIssuingAuthority || "",
//             status: calculatedStatus,
//             productTypeId: doc.productTypes?.productTypeId || 0
//           };
//         }
//       });

//       setFormData({
//         companyTypeId: profileData.companyType?.companyTypeId || 0,
//         sellerTypeId: profileData.sellerType?.sellerTypeId || 0,
//         productTypeIds: profileData.productTypes.map(pt => pt.productTypeId),
//         stateId: profileData.address?.state?.stateId || 0,
//         districtId: profileData.address?.district?.districtId || 0,
//         talukaId: profileData.address?.taluka?.talukaId || 0,
//         sellerName: profileData.sellerName,
//         companyType: profileData.companyType?.companyTypeName || '',
//         sellerType: profileData.sellerType?.sellerTypeName || '',
//         productTypes: profileData.productTypes.map(pt => pt.productTypeName),
//         state: profileData.address?.state?.stateName || '',
//         district: profileData.address?.district?.districtName || '',
//         taluka: profileData.address?.taluka?.talukaName || '',
//         city: profileData.address?.city || '',
//         street: profileData.address?.street || '',
//         buildingNo: profileData.address?.buildingNo || '',
//         landmark: profileData.address?.landmark || '',
//         pincode: profileData.address?.pinCode || '',
//         phone: profileData.phone,
//         email: profileData.email,
//         website: profileData.website || '',
//         coordinatorName: profileData.coordinator?.name || '',
//         coordinatorDesignation: profileData.coordinator?.designation || '',
//         coordinatorEmail: profileData.coordinator?.email || '',
//         coordinatorMobile: profileData.coordinator?.mobile || '',
//         gstNumber: profileData.sellerGST?.gstNumber || '',
//         gstFile: null,
//         gstFileUrl: profileData.sellerGST?.gstFileUrl || '',
//         companyRegistrationCertificateFile: null,
//         companyRegistrationCertificateUrl: profileData.companyRegistrationCertificateUrl || "",
//         licenses,
//         bankState: '',
//         bankDistrict: '',
//         bankName: profileData.bankDetails?.bankName || '',
//         branch: profileData.bankDetails?.branch || '',
//         ifscCode: profileData.bankDetails?.ifscCode || '',
//         accountNumber: profileData.bankDetails?.accountNumber || '',
//         accountHolderName: profileData.bankDetails?.accountHolderName || '',
//         confirmAccountNumber: profileData.bankDetails?.accountNumber || '',
//         cancelledChequeFile: null,
//         cancelledChequeFileUrl: profileData.bankDetails?.bankDocumentFileUrl || '',
//       });

//       // Reset validation errors
//       setSellerNameError("");
//       setCityError("");
//       setStreetError("");
//       setBuildingNoError("");
//       setPincodeError("");
//       setCoordinatorNameError("");
//       setCoordinatorDesignationError("");
//       setCoordinatorEmailError("");
//       setGstNumberError("");
//       setAccountNumberError("");
//       setAccountHolderNameError("");
//       setIfscValidationError("");
//       setLicenseErrors({});
//       setLicenseExistsError({});
//       setLicenseIssuingAuthorityErrors({});
//       setLicenseDateErrors({});
//       setGSTExistsError("");
//       setCompanyPhoneError("");
//       setCoordinatorPhoneError("");
//       setPhoneExistsError("");
//       setEmailExistsError("");
//       setHasDocumentChanges(false);
//       setInactiveLicenses([]);
//       setShowInactiveError(false);
//       setCompanyCertError(false);
//       setGSTCertError(false);
//       setLicenseCertError(false);
//       setBankCertError(false);
//       setAddressChanged(false);
//       setIfscCodeChanged(false);

//     }
//   };

//   const handleCancel = () => {
//     resetFormData();
//     setEditingSection(null);
//     setChangedFiles({
//       gstFile: null,
//       companyCertFile: null,
//       bankFile: null,
//       licenses: []
//     });
//     setLicenseErrors({});
//     setLicenseExistsError({});
//     setLicenseIssuingAuthorityErrors({});
//     setLicenseDateErrors({});
//     setGSTExistsError("");
//     setCompanyPhoneError("");
//     setCoordinatorPhoneError("");
//     setPhoneExistsError("");
//     setEmailExistsError("");
//     setHasDocumentChanges(false);
//     setPendingRequestError(null);
//     setInactiveLicenses([]);
//     setShowInactiveError(false);
//     setSellerNameError("");
//     setCityError("");
//     setStreetError("");
//     setBuildingNoError("");
//     setPincodeError("");
//     setCoordinatorNameError("");
//     setCoordinatorDesignationError("");
//     setCoordinatorEmailError("");
//     setGstNumberError("");
//     setAccountNumberError("");
//     setAccountHolderNameError("");
//     setIfscValidationError("");
//     setIfscCodeChanged(false);
//   };

//   const fetchCompanyTypes = async () => {
//     setLoadingStates(prev => ({ ...prev, companyTypes: true }));
//     try {
//       const data = await sellerRegMasterService.getCompanyTypes();
//       setCompanyTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching company types:", error);
//       toast.error("Failed to load company types");
//       setCompanyTypes([]);
//     } finally {
//       setLoadingStates(prev => ({ ...prev, companyTypes: false }));
//     }
//   };

//   const fetchStates = async () => {
//     setLoadingStates(prev => ({ ...prev, states: true }));
//     try {
//       const data = await sellerRegMasterService.getStates();
//       setStates(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching states:", error);
//       toast.error("Failed to load states");
//       setStates([]);
//     } finally {
//       setLoadingStates(prev => ({ ...prev, states: false }));
//     }
//   };

//   const fetchSellerTypes = async () => {
//     setLoadingStates(prev => ({ ...prev, sellerTypes: true }));
//     try {
//       const data = await sellerRegMasterService.getSellerTypes();
//       setSellerTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching seller types:", error);
//       setSellerTypes([]);
//       toast.error("Failed to load seller types");
//     } finally {
//       setLoadingStates(prev => ({ ...prev, sellerTypes: false }));
//     }
//   };

//   const fetchProductTypes = async () => {
//     setLoadingStates(prev => ({ ...prev, productTypes: true }));
//     try {
//       const data = await sellerRegMasterService.getProductTypes();
//       setProductTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching product types:", error);
//       setProductTypes([]);
//       toast.error("Failed to load product types");
//     } finally {
//       setLoadingStates(prev => ({ ...prev, productTypes: false }));
//     }
//   };

//   const fetchDistrictsByState = async (stateId: number) => {
//     if (!stateId) return;
//     setLoadingStates(prev => ({ ...prev, districts: true }));
//     try {
//       const data = await sellerRegMasterService.getDistrictsByStateId(stateId);
//       setDistricts(data);
//     } catch (error) {
//       console.error("Error fetching districts:", error);
//       setDistricts([]);
//       toast.error("Failed to load districts");
//     } finally {
//       setLoadingStates(prev => ({ ...prev, districts: false }));
//     }
//   };

//   const fetchTalukasByDistrict = async (districtId: number) => {
//     if (!districtId) return;
//     setLoadingStates(prev => ({ ...prev, talukas: true }));
//     try {
//       const data = await sellerRegMasterService.getTalukasByDistrictId(districtId);
//       setTalukas(data);
//     } catch (error) {
//       console.error("Error fetching talukas:", error);
//       setTalukas([]);
//       toast.error("Failed to load talukas");
//     } finally {
//       setLoadingStates(prev => ({ ...prev, talukas: false }));
//     }
//   };

//   // Function to check if GST number already exists
//   const checkGSTNumberExists = async (gstNumber: string): Promise<boolean> => {
//     console.log(`🔍 Checking GST number:`, gstNumber);

//     if (!gstNumber || gstNumber.length < 15) {
//       setGSTExistsError("");
//       return false;
//     }

//     // Skip check if it's the same as existing GST number
//     if (profileData?.sellerGST?.gstNumber?.toUpperCase() === gstNumber.toUpperCase()) {
//       console.log(`GST number matches existing, skipping check`);
//       setGSTExistsError("");
//       return false;
//     }

//     setIsCheckingGST(true);
//     setGSTExistsError("");

//     try {
//       const exists = await updateProfileService.checkGSTNumber(gstNumber);
//       console.log(`GST check result for ${gstNumber}:`, exists);

//       if (exists) {
//         console.log(`GST number ${gstNumber} already exists!`);
//         setGSTExistsError("⚠️ This GST number is already registered. Please use a different GST number.");
//         return true;
//       }
//       console.log(`GST number ${gstNumber} is available`);
//       setGSTExistsError("");
//       return false;
//     } catch (error: any) {
//       console.error("Error checking GST number:", error);
//       setGSTExistsError("");
//       return false;
//     } finally {
//       setIsCheckingGST(false);
//     }
//   };

//   // Function to check if license number already exists
//   const checkLicenseNumberExists = async (licenseNumber: string, productName: string): Promise<boolean> => {
//     if (!licenseNumber || licenseNumber.length < 8) {
//       setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
//       return false;
//     }

//     const existingDoc = profileData?.documents.find(
//       doc => doc.productTypes?.productTypeName === productName
//     );

//     if (existingDoc?.documentNumber?.toUpperCase() === licenseNumber.toUpperCase()) {
//       setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
//       return false;
//     }

//     setIsCheckingLicense(prev => ({ ...prev, [productName]: true }));
//     setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));

//     try {
//       const exists = await updateProfileService.checkLicenseDocumentNumber(licenseNumber);
//       if (exists) {
//         setLicenseExistsError(prev => ({
//           ...prev,
//           [productName]: "This license number is already registered. Please use a different license number."
//         }));
//         return true;
//       }
//       setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
//       return false;
//     } catch (error: any) {
//       console.error("Error checking license number:", error);
//       if (error.response?.status !== 404) {
//         setLicenseExistsError(prev => ({
//           ...prev,
//           [productName]: "Failed to verify license number. Please try again."
//         }));
//       }
//       return false;
//     } finally {
//       setIsCheckingLicense(prev => ({ ...prev, [productName]: false }));
//     }
//   };

//   useEffect(() => {
//     const loadProfileData = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
//         setAddressChanged(false);

//         const data = await sellerProfileService.getCurrentSellerProfile();
//         setProfileData(data);

//         if (data) {
//           const licenses: Record<string, any> = {};
//           data.documents.forEach((doc: SellerDocument) => {
//             const productName = doc.productTypes?.productTypeName;
//             if (productName) {
//               const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
//               const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
//               const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//               licenses[productName] = {
//                 number: doc.documentNumber || "",
//                 file: null,
//                 fileUrl: doc.documentFileUrl || "",
//                 issueDate: issueDate,
//                 expiryDate: expiryDate,
//                 issuingAuthority: doc.licenseIssuingAuthority || "",
//                 status: calculatedStatus,
//                 productTypeId: doc.productTypes?.productTypeId || 0
//               };
//             }
//           });

//           setFormData({
//             companyTypeId: data.companyType?.companyTypeId || 0,
//             sellerTypeId: data.sellerType?.sellerTypeId || 0,
//             productTypeIds: data.productTypes.map(pt => pt.productTypeId),
//             stateId: data.address?.state?.stateId || 0,
//             districtId: data.address?.district?.districtId || 0,
//             talukaId: data.address?.taluka?.talukaId || 0,
//             sellerName: data.sellerName,
//             companyType: data.companyType?.companyTypeName || '',
//             sellerType: data.sellerType?.sellerTypeName || '',
//             productTypes: data.productTypes.map(pt => pt.productTypeName),
//             state: data.address?.state?.stateName || '',
//             district: data.address?.district?.districtName || '',
//             taluka: data.address?.taluka?.talukaName || '',
//             city: data.address?.city || '',
//             street: data.address?.street || '',
//             buildingNo: data.address?.buildingNo || '',
//             landmark: data.address?.landmark || '',
//             pincode: data.address?.pinCode || '',
//             phone: data.phone,
//             email: data.email,
//             website: data.website || '',
//             coordinatorName: data.coordinator?.name || '',
//             coordinatorDesignation: data.coordinator?.designation || '',
//             coordinatorEmail: data.coordinator?.email || '',
//             coordinatorMobile: data.coordinator?.mobile || '',
//             gstNumber: data.sellerGST?.gstNumber || '',
//             gstFile: null,
//             gstFileUrl: data.sellerGST?.gstFileUrl || '',
//             companyRegistrationCertificateFile: null,
//             companyRegistrationCertificateUrl: data.companyRegistrationCertificateUrl || "",
//             licenses,
//             bankState: '',
//             bankDistrict: '',
//             bankName: data.bankDetails?.bankName || '',
//             branch: data.bankDetails?.branch || '',
//             ifscCode: data.bankDetails?.ifscCode || '',
//             accountNumber: data.bankDetails?.accountNumber || '',
//             accountHolderName: data.bankDetails?.accountHolderName || '',
//             confirmAccountNumber: data.bankDetails?.accountNumber || '',
//             cancelledChequeFile: null,
//             cancelledChequeFileUrl: data.bankDetails?.bankDocumentFileUrl || '',
//           });

//           if (data.address?.state?.stateId) {
//             fetchDistrictsByState(data.address.state.stateId);
//           }
//           if (data.address?.district?.districtId) {
//             fetchTalukasByDistrict(data.address.district.districtId);
//           }
//         }

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



// const checkIfAddressChanged = (): boolean => {
//   if (!profileData?.address) return false;
  
//   const originalAddress = profileData.address;
//   const currentAddress = formData;
  
//   const hasAddressChanged = (
//     originalAddress.state?.stateId !== currentAddress.stateId ||
//     originalAddress.district?.districtId !== currentAddress.districtId ||
//     originalAddress.taluka?.talukaId !== currentAddress.talukaId ||
//     originalAddress.city !== currentAddress.city ||
//     originalAddress.street !== currentAddress.street ||
//     originalAddress.buildingNo !== currentAddress.buildingNo ||
//     originalAddress.landmark !== currentAddress.landmark ||
//     originalAddress.pinCode !== currentAddress.pincode
//   );
  
//   return hasAddressChanged;
// };

// const checkIfIfscCodeChanged = (): boolean => {
//   if (!profileData?.bankDetails?.ifscCode) return false;
  
//   const originalIfsc = profileData.bankDetails.ifscCode;
//   const currentIfsc = formData.ifscCode;
  
//   const hasIfscChanged = originalIfsc !== currentIfsc;
  
//   console.log("IFSC change check:", {
//     originalIfsc,
//     currentIfsc,
//     hasIfscChanged
//   });
  
//   return hasIfscChanged;
// };

//   const handleGSTFileChange = (file: File) => {
//     setFormData(prev => ({
//       ...prev,
//       gstFile: file,
//       gstFileUrl: "PENDING"
//     }));
//     setChangedFiles(prev => ({ ...prev, gstFile: file }));
//     setHasDocumentChanges(true);
//   };

//   const handleCompanyCertFileChange = (file: File) => {
//     setFormData(prev => ({
//       ...prev,
//       companyRegistrationCertificateFile: file,
//       companyRegistrationCertificateUrl: "PENDING"
//     }));
//     setChangedFiles(prev => ({ ...prev, companyCertFile: file }));
//     setHasDocumentChanges(true);
//   };

// const handleBankFileChange = (file: File) => {
//   setFormData(prev => ({
//     ...prev,
//     cancelledChequeFile: file,
//     cancelledChequeFileUrl: "PENDING"
//   }));
//   setChangedFiles(prev => ({ ...prev, bankFile: file }));
//   setHasDocumentChanges(true);
  
//   // Clear bank certificate error when new file is uploaded
//   if (bankCertError) {
//     setBankCertError(false);
//   }
// };

//   const handleLicenseFileChange = (file: File, productName: string, productTypeId: number) => {
//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           file: file,
//           fileUrl: "PENDING",
//         },
//       },
//     }));

//     setChangedFiles(prev => ({
//       ...prev,
//       licenses: [
//         ...prev.licenses.filter(l => l.productName !== productName),
//         { productName, productTypeId, file }
//       ]
//     }));
//     setHasDocumentChanges(true);
//   };

//   const handleSellerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 60) return;

//     setFormData(prev => ({ ...prev, sellerName: value }));
//     const error = validateSellerName(value);
//     setSellerNameError(error || "");
//   };

//   const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     value = value.replace(/\s{2,}/g, ' ');
//     setFormData(prev => ({ ...prev, city: value }));
//     const error = validateCity(value);
//     setCityError(error || "");
//      setAddressChanged(checkIfAddressChanged());
//   };

//   const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     value = value.replace(/\s{2,}/g, ' ');
//     setFormData(prev => ({ ...prev, street: value }));
//     const error = validateStreet(value);
//     setStreetError(error || "");
//     setAddressChanged(checkIfAddressChanged());
//   };

//   const handleBuildingNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 50) return;
//     value = value.replace(/\s{2,}/g, ' ');
//     setFormData(prev => ({ ...prev, buildingNo: value }));
//     const error = validateBuildingNo(value);
//     setBuildingNoError(error || "");
//     setAddressChanged(checkIfAddressChanged());
//   };

//   const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 6) value = value.slice(0, 6);
//     setFormData(prev => ({ ...prev, pincode: value }));
//     const error = validatePincode(value);
//     setPincodeError(error || "");
//     setAddressChanged(checkIfAddressChanged());
//   };

//   const handleLandmarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//   let value = e.target.value;
//   if (value.length > 100) return;
//   setFormData(prev => ({ ...prev, landmark: value }));
  
//   // Track address change
//   setAddressChanged(checkIfAddressChanged());
// };

//   const handleCoordinatorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     setFormData(prev => ({ ...prev, coordinatorName: value }));
//     const error = validateCoordinatorName(value);
//     setCoordinatorNameError(error || "");
//   };

//   const handleCoordinatorDesignationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     setFormData(prev => ({ ...prev, coordinatorDesignation: value }));
//     const error = validateCoordinatorDesignation(value);
//     setCoordinatorDesignationError(error || "");
//   };

//   const handleCoordinatorEmailChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setFormData(prev => ({ ...prev, coordinatorEmail: value }));
//     const error = validateCoordinatorEmail(value);
//     setCoordinatorEmailError(error || "");
//   };

//   const handleGSTChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.toUpperCase();
//     value = value.replace(/[^0-9A-Z]/g, '');
//     if (value.length > 15) value = value.slice(0, 15);
//     setFormData(prev => ({ ...prev, gstNumber: value }));

//     const error = validateGSTNumber(value);
//     setGstNumberError(error || "");

//     if (gstExistsError) {
//       setGSTExistsError("");
//     }

//     if (gstCheckTimeoutRef.current) {
//       clearTimeout(gstCheckTimeoutRef.current);
//     }

//     if (profileData?.sellerGST?.gstNumber?.toUpperCase() === value.toUpperCase()) {
//       setGSTExistsError("");
//       return;
//     }

//     if (value.length === 15 && !error) {
//       gstCheckTimeoutRef.current = setTimeout(async () => {
//         await checkGSTNumberExists(value);
//         gstCheckTimeoutRef.current = null;
//       }, 500);
//     }
//   };

//   const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 18) value = value.slice(0, 18);
//     setFormData(prev => ({ ...prev, accountNumber: value }));
//     const error = validateAccountNumber(value);
//     setAccountNumberError(error || "");

//     // Also clear confirm account number if account number changes
//     if (formData.confirmAccountNumber && formData.confirmAccountNumber !== value) {
//       setFormData(prev => ({ ...prev, confirmAccountNumber: "" }));
//     }
//   };

//   const handleConfirmAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 18) value = value.slice(0, 18);
//     setFormData(prev => ({ ...prev, confirmAccountNumber: value }));
//   };

//   const handleAccountHolderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     value = value.replace(/[^A-Za-z\s]/g, '');
//     value = value.replace(/\s{2,}/g, ' ');
//     setFormData(prev => ({ ...prev, accountHolderName: value }));
//     const error = validateAccountHolderName(value);
//     setAccountHolderNameError(error || "");
//   };

//   const handleLicenseNumberChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//     const value = e.target.value;
//     const cleanedValue = formatLicenseNumber(value);

//     if (cleanedValue !== value) {
//       return;
//     }

//     if (cleanedValue.length > 30) {
//       return;
//     }

//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           number: cleanedValue,
//         },
//       },
//     }));

//     const formatError = validateDrugLicenseNumber(cleanedValue);
//     setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

//     if (licenseExistsError[productName]) {
//       setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
//     }

//     if (!formatError && cleanedValue.length >= 8) {
//       if (licenseCheckTimeoutRef.current[productName]) {
//         clearTimeout(licenseCheckTimeoutRef.current[productName]!);
//       }

//       licenseCheckTimeoutRef.current[productName] = setTimeout(async () => {
//         await checkLicenseNumberExists(cleanedValue, productName);
//         licenseCheckTimeoutRef.current[productName] = null;
//       }, 500);
//     }
//   };

//   // Replace the handleLicenseKeyDown function with this:
//   const handleLicenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     // Allow all navigation and control keys
//     const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
//     if (allowedKeys.includes(e.key)) {
//       return;
//     }

//     // Allow Ctrl/Cmd + V for paste
//     if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
//       return;
//     }

//     // Allow Ctrl/Cmd + C for copy
//     if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
//       return;
//     }

//     // Allow Ctrl/Cmd + X for cut
//     if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
//       return;
//     }

//     // Allow Ctrl/Cmd + A for select all
//     if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
//       return;
//     }

//     // Block invalid characters - only allow alphanumeric, hyphens, and slashes
//     const allowedChars = /^[A-Za-z0-9\/\-]$/;
//     if (!allowedChars.test(e.key)) {
//       e.preventDefault();
//     }
//   };

//   const handleLicensePaste = async (e: React.ClipboardEvent<HTMLInputElement>, productName: string) => {
//     e.preventDefault();
//     const pastedText = e.clipboardData.getData('text');
//     let cleanedText = pastedText.toUpperCase();
//     cleanedText = cleanedText.replace(/[^A-Z0-9\/\-]/g, '');
//     if (cleanedText.length > 30) {
//       cleanedText = cleanedText.substring(0, 30);
//     }

//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           number: cleanedText,
//         },
//       },
//     }));

//     const formatError = validateDrugLicenseNumber(cleanedText);
//     setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

//     if (!formatError && cleanedText.length >= 8) {
//       await checkLicenseNumberExists(cleanedText, productName);
//     }
//   };

//   const handleLicenseNumberBlur = async (value: string, productName: string) => {
//     const formatError = validateDrugLicenseNumber(value);
//     setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

//     if (!formatError && value.length >= 8) {
//       await checkLicenseNumberExists(value, productName);
//     }
//   };

//  const handleIssuingAuthorityChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//   let value = e.target.value;
//   if (value.length > 150) return;
  
//   // Remove any special characters (only allow alphanumeric and spaces)
//   value = value.replace(/[^A-Za-z0-9\s]/g, '');
//   // Prevent consecutive spaces
//   value = value.replace(/\s{2,}/g, ' ');
  
//   setFormData(prev => ({
//     ...prev,
//     licenses: {
//       ...prev.licenses,
//       [productName]: {
//         ...prev.licenses[productName],
//         issuingAuthority: value,
//       },
//     },
//   }));
//   const error = validateIssuingAuthority(value);
//   setLicenseIssuingAuthorityErrors(prev => ({ ...prev, [productName]: error || "" }));
// };

// const handleIssuingAuthorityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//   // Allow all navigation and control keys
//   const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Space'];
//   if (allowedKeys.includes(e.key)) {
//     return;
//   }

//   // Allow Ctrl/Cmd + V for paste
//   if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
//     return;
//   }

//   // Allow Ctrl/Cmd + C for copy
//   if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
//     return;
//   }

//   // Allow Ctrl/Cmd + X for cut
//   if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
//     return;
//   }

//   // Allow Ctrl/Cmd + A for select all
//   if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
//     return;
//   }

//   // Block special characters - only allow alphanumeric and space
//   const allowedChars = /^[A-Za-z0-9]$/;
//   if (!allowedChars.test(e.key) && e.key !== ' ') {
//     e.preventDefault();
//   }
// };

//  const handleIssueDateChangeWithValidation = (date: Date | null, productName: string) => {
//   if (date) {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     date.setHours(0, 0, 0, 0);

//     if (date > today) {
//       toast.error("Issue date cannot be greater than today's date");
//       return;
//     }
//   }

//   setFormData(prev => {
//     const updatedLicenses = { ...prev.licenses };
//     if (updatedLicenses[productName]) {
//       const newStatus = calculateLicenseStatus(date, updatedLicenses[productName].expiryDate);
//       updatedLicenses[productName] = {
//         ...updatedLicenses[productName],
//         issueDate: date,
//         status: newStatus,
//       };
//     }
//     return { ...prev, licenses: updatedLicenses };
//   });

//   const error = validateIssueDate(date);
  
//   // Check for date gap with existing expiry date
//   const expiryDate = formData.licenses[productName]?.expiryDate;
//   let gapError = "";
//   if (date && expiryDate && isDateGapExceedingFiveYears(date, expiryDate)) {
//     gapError = "License validity cannot exceed 5 years from issue date";
//   }
  
//   setLicenseDateErrors(prev => ({
//     ...prev,
//     [productName]: { 
//       ...prev[productName], 
//       issue: error || "",
//       gap: gapError
//     }
//   }));
// };

// const handleExpiryDateChangeWithValidation = (date: Date | null, productName: string) => {
//   // Ensure date is valid
//   if (date) {
//     date.setHours(0, 0, 0, 0);
//   }
  
//   setFormData(prev => {
//     const updatedLicenses = { ...prev.licenses };
//     if (updatedLicenses[productName]) {
//       const newStatus = calculateLicenseStatus(updatedLicenses[productName].issueDate, date);
//       updatedLicenses[productName] = {
//         ...updatedLicenses[productName],
//         expiryDate: date,
//         status: newStatus,
//       };
//     }
//     return { ...prev, licenses: updatedLicenses };
//   });

//   const issueDate = formData.licenses[productName]?.issueDate;
//   const error = validateExpiryDate(date, issueDate);
  
//   // Check for 5-year gap validation
//   let gapError = "";
//   if (issueDate && date && isDateGapExceedingFiveYears(issueDate, date)) {
//     gapError = "License validity cannot exceed 5 years from issue date";
//   }
  
//   setLicenseDateErrors(prev => ({
//     ...prev,
//     [productName]: { 
//       ...prev[productName], 
//       expiry: error || "",
//       gap: gapError
//     }
//   }));
// };

//   const handleProductTypeToggle = (product: ProductTypeResponse) => {
//     if (!product) return;

//     setFormData(prev => {
//       let newProductTypeIds = [...prev.productTypeIds];
//       let newProductTypes = [...prev.productTypes];
//       const newLicenses = { ...prev.licenses };

//       if (newProductTypeIds.includes(product.productTypeId)) {
//         newProductTypeIds = newProductTypeIds.filter(id => id !== product.productTypeId);
//         newProductTypes = newProductTypes.filter(name => name !== product.productTypeName);
//         delete newLicenses[product.productTypeName];
//         setLicenseErrors(prevErrors => {
//           const newErrors = { ...prevErrors };
//           delete newErrors[product.productTypeName];
//           return newErrors;
//         });
//         setLicenseExistsError(prevErrors => {
//           const newErrors = { ...prevErrors };
//           delete newErrors[product.productTypeName];
//           return newErrors;
//         });
//         setLicenseIssuingAuthorityErrors(prevErrors => {
//           const newErrors = { ...prevErrors };
//           delete newErrors[product.productTypeName];
//           return newErrors;
//         });
//         setLicenseDateErrors(prevErrors => {
//           const newErrors = { ...prevErrors };
//           delete newErrors[product.productTypeName];
//           return newErrors;
//         });
//       } else {
//         newProductTypeIds.push(product.productTypeId);
//         newProductTypes.push(product.productTypeName);

//         const existingDoc = profileData?.documents.find(
//           doc => doc.productTypes?.productTypeId === product.productTypeId
//         );

//         if (existingDoc) {
//           const issueDate = existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null;
//           const expiryDate = existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null;
//           const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//           newLicenses[product.productTypeName] = {
//             documentId: existingDoc.sellerDocumentsId,
//             number: existingDoc.documentNumber || "",
//             file: null,
//             fileUrl: existingDoc.documentFileUrl || "",
//             issueDate: issueDate,
//             expiryDate: expiryDate,
//             issuingAuthority: existingDoc.licenseIssuingAuthority || "",
//             status: calculatedStatus,
//             productTypeId: product.productTypeId
//           };
//         } else {
//           newLicenses[product.productTypeName] = {
//             number: "",
//             file: null,
//             fileUrl: "",
//             issueDate: null,
//             expiryDate: null,
//             issuingAuthority: "",
//             status: 'InActive',
//             productTypeId: product.productTypeId
//           };
//         }
//       }

//       return {
//         ...prev,
//         productTypeIds: newProductTypeIds,
//         productTypes: newProductTypes,
//         licenses: newLicenses,
//       };
//     });
//   };

//   const handleSelectAllProductTypes = () => {
//     if (!productTypes.length) return;

//     if (formData.productTypes.length === productTypes.length) {
//       setFormData(prev => ({
//         ...prev,
//         productTypeIds: [],
//         productTypes: [],
//         licenses: {},
//       }));
//       setLicenseErrors({});
//       setLicenseExistsError({});
//       setLicenseIssuingAuthorityErrors({});
//       setLicenseDateErrors({});
//     } else {
//       const allIds = productTypes.map(p => p.productTypeId);
//       const allNames = productTypes.map(p => p.productTypeName);

//       const newLicenses: Record<string, any> = {};

//       allNames.forEach(name => {
//         const product = productTypes.find(p => p.productTypeName === name);
//         if (!product) return;

//         const existingDoc = profileData?.documents.find(
//           doc => doc.productTypes?.productTypeId === product.productTypeId
//         );

//         if (existingDoc) {
//           const issueDate = existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null;
//           const expiryDate = existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null;
//           const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//           newLicenses[name] = {
//             documentId: existingDoc.sellerDocumentsId,
//             number: existingDoc.documentNumber || "",
//             file: null,
//             fileUrl: existingDoc.documentFileUrl || "",
//             issueDate: issueDate,
//             expiryDate: expiryDate,
//             issuingAuthority: existingDoc.licenseIssuingAuthority || "",
//             status: calculatedStatus,
//             productTypeId: product.productTypeId
//           };
//         } else {
//           newLicenses[name] = {
//             number: "",
//             file: null,
//             fileUrl: "",
//             issueDate: null,
//             expiryDate: null,
//             issuingAuthority: "",
//             status: 'InActive',
//             productTypeId: product.productTypeId
//           };
//         }
//       });

//       setFormData(prev => ({
//         ...prev,
//         productTypeIds: allIds,
//         productTypes: allNames,
//         licenses: newLicenses,
//       }));
//     }
//   };

//   const handleStateChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedState = states.find(s => s.stateId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       stateId: selectedId,
//       state: selectedState?.stateName || "",
//       districtId: 0,
//       district: "",
//       talukaId: 0,
//       taluka: "",
//     }));
//     setAddressChanged(checkIfAddressChanged());

//     setDistricts([]);
//     setTalukas([]);

//     if (selectedId) {
//       fetchDistrictsByState(selectedId);
//     }
//   };

//   const handleDistrictChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedDistrict = districts.find(d => d.districtId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       districtId: selectedId,
//       district: selectedDistrict?.districtName || "",
//       talukaId: 0,
//       taluka: "",
//     }));

//     setTalukas([]);

//     setAddressChanged(checkIfAddressChanged());

//     if (selectedId) {
//       fetchTalukasByDistrict(selectedId);
//     }
//   };

//   const handleTalukaChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedTaluka = talukas.find(t => t.talukaId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       talukaId: selectedId,
//       taluka: selectedTaluka?.talukaName || "",
//     }));
//     setAddressChanged(checkIfAddressChanged());
//   };

//   const handleCompanyTypeChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedCompany = companyTypes.find(c => c.companyTypeId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       companyTypeId: selectedId,
//       companyType: selectedCompany?.companyTypeName || "",
//     }));
//   };

//   const handleSellerTypeChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedSeller = sellerTypes.find(s => s.sellerTypeId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       sellerTypeId: selectedId,
//       sellerType: selectedSeller?.sellerTypeName || "",
//     }));
//   };

//   const handleGSTBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
//     const value = e.target.value;

//     if (!value || value.length !== 15) {
//       return;
//     }

//     if (profileData?.sellerGST?.gstNumber?.toUpperCase() === value.toUpperCase()) {
//       setGSTExistsError("");
//       return;
//     }

//     await checkGSTNumberExists(value);
//   };

//   const handleCompanyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 10) value = value.slice(0, 10);

//     let cleanValue = value;
//     if (cleanValue.startsWith('91')) {
//       cleanValue = cleanValue.substring(2);
//     }

//     setFormData(prev => ({ ...prev, phone: cleanValue }));

//     const error = validateIndianMobileNumber(cleanValue);
//     setCompanyPhoneError(error || "");
//   };

//   const handleCompanyPhoneBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.startsWith('91')) {
//       value = value.substring(2);
//     }
//     const error = validateIndianMobileNumber(value);
//     setCompanyPhoneError(error || "");
//   };

//   const handleCoordinatorPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 10) value = value.slice(0, 10);

//     let cleanValue = value;
//     if (cleanValue.startsWith('91')) {
//       cleanValue = cleanValue.substring(2);
//     }

//     setFormData(prev => ({ ...prev, coordinatorMobile: cleanValue }));

//     const error = validateIndianMobileNumber(cleanValue);
//     setCoordinatorPhoneError(error || "");

//     if (phoneExistsError) {
//       setPhoneExistsError("");
//     }

//     if (phoneCheckTimeoutRef.current) {
//       clearTimeout(phoneCheckTimeoutRef.current);
//     }

//     if (profileData?.coordinator?.mobile === cleanValue) {
//       return;
//     }

//     if (cleanValue.length === 10 && !error) {
//       phoneCheckTimeoutRef.current = setTimeout(async () => {
//         await checkCoordinatorPhoneExists(cleanValue);
//         phoneCheckTimeoutRef.current = null;
//       }, 500);
//     }
//   };

//   const handleCoordinatorPhoneBlur = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.startsWith('91')) {
//       value = value.substring(2);
//     }

//     if (profileData?.coordinator?.mobile === value) {
//       return;
//     }

//     const error = validateIndianMobileNumber(value);
//     setCoordinatorPhoneError(error || "");

//     if (value.length === 10 && !error && !phoneExistsError) {
//       await checkCoordinatorPhoneExists(value);
//     }
//   };

//   const handleCoordinatorEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setFormData(prev => ({ ...prev, coordinatorEmail: value }));
//     handleCoordinatorEmailChangeWithValidation(e);

//     if (emailExistsError) {
//       setEmailExistsError("");
//     }

//     if (emailCheckTimeoutRef.current) {
//       clearTimeout(emailCheckTimeoutRef.current);
//     }

//     if (profileData?.coordinator?.email === value) {
//       return;
//     }

//     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

//     if (isValidEmail && value) {
//       emailCheckTimeoutRef.current = setTimeout(async () => {
//         if (formData.coordinatorEmail === value) {
//           await checkCoordinatorEmailExists(value);
//         }
//         emailCheckTimeoutRef.current = null;
//       }, 500);
//     }
//   };

//   const handleCoordinatorEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
//     const value = e.target.value;

//     if (profileData?.coordinator?.email === value) {
//       return;
//     }

//     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

//     if (isValidEmail && value && !emailExistsError) {
//       await checkCoordinatorEmailExists(value);
//     }
//   };

// const handleIfscChange = async (value: string) => {
//   const ifsc = value.toUpperCase();
//   setFormData(prev => ({ ...prev, ifscCode: ifsc }));

//   // Track IFSC code change
//   const originalIfsc = profileData?.bankDetails?.ifscCode;
//   const hasChanged = originalIfsc !== ifsc;
//   setIfscCodeChanged(hasChanged);
  
//   // Reset bank document error when new file is uploaded
//   if (hasChanged && formData.cancelledChequeFile) {
//     setBankCertError(false);
//   }

//   const validationError = validateIFSC(ifsc);
//   setIfscValidationError(validationError || "");
//   setIfscError(validationError || "");

//   if (ifsc.length !== 11) {
//     setFormData(prev => ({
//       ...prev,
//       bankName: "",
//       branch: "",
//       bankState: "",
//       bankDistrict: "",
//     }));
//     return;
//   }

//   if (validationError) {
//     setFormData(prev => ({
//       ...prev,
//       bankName: "",
//       branch: "",
//       bankState: "",
//       bankDistrict: "",
//     }));
//     toast.error(validationError);
//     return;
//   }

//   const parseResult = ifscSchema.safeParse(ifsc);
//   if (!parseResult.success) {
//     setIfscError(parseResult.error.issues[0].message);
//     setIfscValidationError(parseResult.error.issues[0].message);
//     setFormData(prev => ({
//       ...prev,
//       bankName: "",
//       branch: "",
//       bankState: "",
//       bankDistrict: "",
//     }));
//     toast.error(parseResult.error.issues[0].message);
//     return;
//   }

//   try {
//     const data = await fetchBankDetails(ifsc);
//     setFormData(prev => ({
//       ...prev,
//       bankName: data.BANK || "",
//       branch: data.BRANCH || "",
//       bankState: data.STATE || "",
//       bankDistrict: data.DISTRICT || data.CITY || "",
//     }));
//   } catch {
//     setIfscError("Invalid IFSC Code");
//     setIfscValidationError("Invalid IFSC Code");
//     setFormData(prev => ({
//       ...prev,
//       bankName: "",
//       branch: "",
//       bankState: "",
//       bankDistrict: "",
//     }));
//     toast.error("Invalid IFSC Code");
//   }
// };

//   const checkCoordinatorEmailExists = async (email: string): Promise<boolean> => {
//     if (!email || !email.includes('@') || !email.includes('.')) {
//       setEmailExistsError("");
//       return false;
//     }

//     if (profileData?.coordinator?.email === email) {
//       setEmailExistsError("");
//       return false;
//     }

//     setIsCheckingEmail(true);
//     setEmailExistsError("");

//     try {
//       const exists = await updateProfileService.checkCoordinatorProfileEmail(email);
//       if (exists) {
//         setEmailExistsError("⚠️ This email is already registered. Please use a different email address.");
//         return true;
//       }
//       setEmailExistsError("");
//       return false;
//     } catch (error: any) {
//       console.error("Error checking email:", error);
//       if (error.response?.status !== 404) {
//         setEmailExistsError("Failed to verify email. Please try again.");
//       }
//       return false;
//     } finally {
//       setIsCheckingEmail(false);
//     }
//   };

//   const checkCoordinatorPhoneExists = async (phone: string): Promise<boolean> => {
//     const cleanPhone = phone.replace(/\D/g, '');

//     if (profileData?.coordinator?.mobile === cleanPhone) {
//       setPhoneExistsError("");
//       return false;
//     }

//     const validationError = validateIndianMobileNumber(cleanPhone);
//     if (validationError) {
//       setPhoneExistsError(validationError);
//       return false;
//     }

//     if (!cleanPhone || cleanPhone.length !== 10) {
//       setPhoneExistsError("");
//       return false;
//     }

//     setIsCheckingPhone(true);

//     try {
//       const exists = await sellerRegService.checkCoordinatorPhone(cleanPhone);
//       if (exists) {
//         setPhoneExistsError("⚠️ This phone number is already registered. Please use a different number.");
//         return true;
//       }
//       setPhoneExistsError("");
//       return false;
//     } catch (error: any) {
//       console.error("Error checking phone:", error);
//       if (error.response?.status !== 404) {
//         setPhoneExistsError("Failed to verify phone number. Please try again.");
//       }
//       return false;
//     } finally {
//       setIsCheckingPhone(false);
//     }
//   };

//   const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
//     const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleAlphanumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLen = 100) => {
//     const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, maxLen);
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => {
//     let value = e.target.value.replace(/\D/g, "");
//     if (maxLength && value.length > maxLength) {
//       value = value.substring(0, maxLength);
//     }
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const isPendingRequestError = (responseData: any): { isError: boolean; message: string; requestId: string } => {
//     let errorMessage = '';
//     let pendingRequestId = '';

//     if (responseData?.data?.data?.message) {
//       errorMessage = responseData.data.data.message;
//     } else if (responseData?.data?.message) {
//       errorMessage = responseData.data.message;
//     } else if (responseData?.message) {
//       errorMessage = responseData.message;
//     }

//     if (errorMessage && errorMessage.toLowerCase().includes('pending update request already exists')) {
//       const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
//       pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';
//       return { isError: true, message: errorMessage, requestId: pendingRequestId };
//     }

//     return { isError: false, message: '', requestId: '' };
//   };

//   useEffect(() => {
//     if (pendingRequestError) {
//       const timer = setTimeout(() => {
//         setPendingRequestError(null);
//       }, 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [pendingRequestError]);

//   useEffect(() => {
//     if (showInactiveError) {
//       const timer = setTimeout(() => {
//         setShowInactiveError(false);
//       }, 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [showInactiveError]);

//   const hasInactiveLicenses = (): boolean => {
//     return inactiveLicenses.length > 0;
//   };

//   const performSave = async (section: string, sectionData: any) => {
//     try {
//       const requestedBy = updateProfileService.getCurrentUserEmail();
//       if (!requestedBy) {
//         toast.error('User email not found');
//         return;
//       }

//       if (!sectionData || Object.keys(sectionData).length === 0) {
//         toast.error('No data to update');
//         setEditingSection(null);
//         return;
//       }

//       console.log(`📤 Sending ${section} update data:`, sectionData);

//       let response;

//       if (section === 'all') {
//         response = await updateProfileService.updateFullProfile(sectionData, requestedBy);
//       } else {
//         switch (section) {
//           case 'company':
//             response = await updateProfileService.updateCompanySection(sectionData, requestedBy);
//             break;
//           case 'coordinator':
//             response = await updateProfileService.updateCoordinatorSection(sectionData, requestedBy);
//             break;
//           case 'gst':
//             response = await updateProfileService.updateGSTSection(sectionData, requestedBy);
//             break;
//           case 'bank':
//             response = await updateProfileService.updateBankSection(sectionData, requestedBy);
//             break;
//           default:
//             if (section.startsWith('license-')) {
//               const index = parseInt(section.split('-')[1]);
//               const doc = profileData?.documents[index];
//               if (doc && sectionData && Object.keys(sectionData).length > 0) {
//                 response = await updateProfileService.updateLicenseSection(
//                   doc.productTypes.productTypeId,
//                   sectionData,
//                   requestedBy
//                 );
//               } else {
//                 toast.error('No license data to update');
//                 setEditingSection(null);
//                 return;
//               }
//             }
//         }
//       }

//       if (response) {
//         console.log('✅ Update successful:', response);

//         const pendingError = isPendingRequestError(response);
//         if (pendingError.isError) {
//           scrollToTop();

//           setPendingRequestError(
//             `⚠️ Update Request Already Pending\n\n` +
//             `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
//             `Please wait for admin approval before submitting new changes.\n\n` +
//             `You will be notified once your changes are approved.`
//           );
//           toast.error(
//             `⚠️ Update Request Already Pending\n\n` +
//             `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.`,
//             { duration: 8000 }
//           );
//           return;
//         }

//         if (response.message && response.message.includes('auto-approved')) {
//           toast.success(response.message);
//           scrollToTop();
//           const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
//           setProfileData(updatedProfile);
//           setSavedSection(section);
//           setShowSuccess(true);
//         } else {
//           toast.success('Changes submitted for admin review. They will appear once approved.');
//           scrollToTop();
//           setSavedSection(section);
//           setShowSuccess(true);
//         }

//         setEditingSection(null);

//         if (!response.message || !response.message.includes('auto-approved')) {
//           setReviewSections((prev) => {
//             if (!prev.includes(section)) {
//               return [...prev, section];
//             }
//             return prev;
//           });
//         }
//       }

//     } catch (error: any) {
//       console.error('❌ Error saving section:', error);
//       console.error('❌ Error response:', error.response?.data);

//       let errorMessage = '';
//       let pendingRequestId = '';

//       if (error.response?.data?.data?.data?.message) {
//         errorMessage = error.response.data.data.data.message;
//       } else if (error.response?.data?.data?.message) {
//         errorMessage = error.response.data.data.message;
//       } else if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       if (errorMessage.toLowerCase().includes('pending update request already exists')) {
//         const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
//         pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

//         scrollToTop();

//         setPendingRequestError(
//           `⚠️ Update Request Already Pending\n\n` +
//           `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
//           `Please wait for admin approval before submitting new changes.\n\n` +
//           `You will be notified once your changes are approved.`
//         );

//         toast.error(
//           `⚠️ Update Request Already Pending\n\n` +
//           `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.`,
//           { duration: 8000 }
//         );
//       } else {
//         toast.error(errorMessage || 'Failed to save changes');
//       }
//     }

//     setTimeout(() => {
//       setShowSuccess(false);
//       setSavedSection(null);
//     }, 21000);
//   };

//   const handleOtpVerified = async (verified: { email: boolean; phone: boolean }) => {
//     setShowOtpModal(false);

//     if (pendingSection && pendingSectionData) {
//       if (pendingSection === 'all' && pendingSectionData.completeData && pendingSectionData.filesToUpload) {
//         try {
//           const requestedBy = updateProfileService.getCurrentUserEmail();
//           if (!requestedBy) {
//             toast.error('User email not found');
//             return;
//           }

//           const response = await updateProfileService.updateFullProfile(
//             pendingSectionData.completeData,
//             requestedBy
//           );

//           const pendingError = isPendingRequestError(response);
//           if (pendingError.isError) {
//             scrollToTop();

//             setPendingRequestError(
//               `⚠️ Update Request Already Pending\n\n` +
//               `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
//               `Please wait for admin approval before submitting new changes.\n\n` +
//               `You will be notified once your changes are approved.`
//             );
//             toast.error(
//               `⚠️ Update Request Already Pending\n\n` +
//               `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.`,
//               { duration: 8000 }
//             );
//             return;
//           }

//           let pendingSellerId: number | null = null;
//           let isAutoApproved: boolean = false;
//           let documentsList: UpdateProfileResponse['documents'] = [];

//           if (response) {
//             if (response.message && response.message.includes('auto-approved')) {
//               isAutoApproved = true;
//             }

//             if (response.pendingSellerId) {
//               pendingSellerId = response.pendingSellerId;
//             }

//             if (response.documents && Array.isArray(response.documents)) {
//               documentsList = response.documents;
//             }
//           }

//           if (isAutoApproved || (!pendingSellerId && response && response.message)) {
//             toast.success(response.message || 'Changes applied successfully!');
//             scrollToTop();
//             const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
//             setProfileData(updatedProfile);
//             setEditingSection(null);
//             setSavedSection('all');
//             setShowSuccess(true);
//             return;
//           }

//           if (pendingSellerId) {
//             console.log('✅ OTP Flow - Step 1 complete. Pending Seller ID:', pendingSellerId);

//             const pendingDocumentIdMap = new Map<number, number>();

//             if (documentsList && Array.isArray(documentsList)) {
//               documentsList.forEach((pendingDoc: any) => {
//                 const productTypeId = pendingDoc.productTypeId || pendingDoc.productType?.productTypeId;
//                 const pendingDocId = pendingDoc.pendingSellerDocumentId || pendingDoc.id;

//                 if (productTypeId && pendingDocId) {
//                   pendingDocumentIdMap.set(productTypeId, pendingDocId);
//                   console.log(`📋 OTP Flow - Product Type ${productTypeId} → Pending Document ID: ${pendingDocId}`);
//                 }
//               });
//             }

//             const filesToUpload = pendingSectionData.filesToUpload;
//             const hasFilesToUpload = filesToUpload.gstFile || filesToUpload.bankFile || filesToUpload.companyCertFile || filesToUpload.licenses.length > 0;

//             if (hasFilesToUpload) {
//               console.log('📤 OTP Flow - Step 2: Uploading documents...');

//               const licensesWithIds = filesToUpload.licenses.map((license: any) => {
//                 const pendingDocumentId = pendingDocumentIdMap.get(license.productTypeId);
//                 if (!pendingDocumentId) {
//                   console.warn(`⚠️ OTP Flow - No pending document ID found for product type ${license.productTypeId}`);
//                 }
//                 return {
//                   file: license.file,
//                   licenseName: license.productName,
//                   documentId: pendingDocumentId
//                 };
//               });

//               await uploadSellerDocuments(pendingSellerId, {
//                 gstFile: filesToUpload.gstFile || undefined,
//                 bankFile: filesToUpload.bankFile || undefined,
//                 companyRegistrationCertificate: filesToUpload.companyCertFile || undefined,
//                 licenses: licensesWithIds
//               });

//               console.log('✅ OTP Flow - Document upload successful');
//             }

//             toast.success('Changes submitted for admin review.');
//             scrollToTop();
//             setEditingSection(null);

//             const sectionsToMark = ['company', 'coordinator', 'gst', 'bank'];
//             formData.productTypes.forEach((_, index) => {
//               sectionsToMark.push(`license-${index}`);
//             });

//             setReviewSections((prev) => {
//               const newSections = [...prev];
//               sectionsToMark.forEach(section => {
//                 if (!newSections.includes(section)) {
//                   newSections.push(section);
//                 }
//               });
//               return newSections;
//             });

//             setSavedSection('all');
//             setShowSuccess(true);

//             setFormData(prev => ({
//               ...prev,
//               gstFile: null,
//               companyRegistrationCertificateFile: null,
//               cancelledChequeFile: null,
//               licenses: Object.fromEntries(
//                 Object.entries(prev.licenses).map(([key, value]: [string, any]) => [key, { ...value, file: null }])
//               )
//             }));

//             setChangedFiles({
//               gstFile: null,
//               companyCertFile: null,
//               bankFile: null,
//               licenses: []
//             });

//           } else {
//             throw new Error('No pendingSellerId received from server');
//           }

//         } catch (error: any) {
//           console.error('❌ Error in OTP flow:', error);

//           let errorMessage = '';
//           let pendingRequestId = '';

//           if (error.response?.data?.data?.data?.message) {
//             errorMessage = error.response.data.data.data.message;
//           } else if (error.response?.data?.data?.message) {
//             errorMessage = error.response.data.data.message;
//           } else if (error.response?.data?.message) {
//             errorMessage = error.response.data.message;
//           } else if (error.message) {
//             errorMessage = error.message;
//           }

//           if (errorMessage.toLowerCase().includes('pending update request already exists')) {
//             const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
//             pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

//             scrollToTop();

//             setPendingRequestError(
//               `⚠️ Update Request Already Pending\n\n` +
//               `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
//               `Please wait for admin approval before submitting new changes.\n\n` +
//               `You will be notified once your changes are approved.`
//             );

//             toast.error(
//               `⚠️ Update Request Already Pending\n\n` +
//               `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.`,
//               { duration: 8000 }
//             );
//           } else {
//             toast.error(errorMessage || 'Failed to submit changes');
//           }
//         }
//       } else {
//         await performSave(pendingSection, pendingSectionData);
//       }
//     }

//     setPendingEmail(undefined);
//     setPendingPhone(undefined);
//     setPendingSectionData(null);
//     setPendingSection(null);
//   };

//   const validateAllFields = (): boolean => {
//     // Validate Seller Name
//     if (editingSection && !sellerNameError && formData.sellerName) {
//       const error = validateSellerName(formData.sellerName);
//       if (error) {
//         setSellerNameError(error);
//         scrollToError('seller-name');
//         return false;
//       }
//     }

//     // Validate City
//     if (editingSection && !cityError && formData.city) {
//       const error = validateCity(formData.city);
//       if (error) {
//         setCityError(error);
//         return false;
//       }
//     }

//     // Validate Street
//     if (editingSection && !streetError && formData.street) {
//       const error = validateStreet(formData.street);
//       if (error) {
//         setStreetError(error);
//         return false;
//       }
//     }

//     // Validate Building No
//     if (editingSection && !buildingNoError && formData.buildingNo) {
//       const error = validateBuildingNo(formData.buildingNo);
//       if (error) {
//         setBuildingNoError(error);
//         return false;
//       }
//     }

//     // Validate Pincode
//     if (editingSection && !pincodeError && formData.pincode) {
//       const error = validatePincode(formData.pincode);
//       if (error) {
//         setPincodeError(error);
//         return false;
//       }
//     }

//     // Validate Coordinator fields
//     if (editingSection && formData.coordinatorName) {
//       const error = validateCoordinatorName(formData.coordinatorName);
//       if (error) {
//         setCoordinatorNameError(error);
//         scrollToError('coordinator');
//         return false;
//       }
//     }

//     if (editingSection && formData.coordinatorDesignation) {
//       const error = validateCoordinatorDesignation(formData.coordinatorDesignation);
//       if (error) {
//         setCoordinatorDesignationError(error);
//         scrollToError('coordinator');
//         return false;
//       }
//     }

//     if (editingSection && formData.coordinatorEmail) {
//       const error = validateCoordinatorEmail(formData.coordinatorEmail);
//       if (error) {
//         setCoordinatorEmailError(error);
//         scrollToError('email');
//         return false;
//       }
//     }

//     // Validate GST Number
//     if (editingSection && formData.gstNumber) {
//       const error = validateGSTNumber(formData.gstNumber);
//       if (error) {
//         setGstNumberError(error);
//         scrollToError('gst');
//         return false;
//       }
//     }

//     // Validate Bank fields
//     if (editingSection && formData.accountNumber) {
//       const error = validateAccountNumber(formData.accountNumber);
//       if (error) {
//         setAccountNumberError(error);
//         return false;
//       }
//     }

//     if (editingSection && formData.accountHolderName) {
//       const error = validateAccountHolderName(formData.accountHolderName);
//       if (error) {
//         setAccountHolderNameError(error);
//         return false;
//       }
//     }

//     if (editingSection && formData.ifscCode) {
//       const error = validateIFSC(formData.ifscCode);
//       if (error) {
//         setIfscValidationError(error);
//         return false;
//       }
//     }

//     // Validate Account Number match
//     if (editingSection && formData.accountNumber && formData.confirmAccountNumber) {
//       if (formData.accountNumber !== formData.confirmAccountNumber) {
//         toast.error("Account number and confirm account number do not match");
//         return false;
//       }
//     }

//     // Validate Licenses
//     // Validate Licenses
// for (const productName of formData.productTypes) {
//   const licenseData = formData.licenses[productName];
//   if (licenseData) {
//     // Validate License Number
//     if (!licenseData.number || licenseData.number.trim() === "") {
//       setLicenseErrors(prev => ({ ...prev, [productName]: "License number is required" }));
//       scrollToError('empty-license', productName);
//       return false;
//     }

//     // Validate Issuing Authority
//     if (!licenseData.issuingAuthority || licenseData.issuingAuthority.trim() === "") {
//       setLicenseIssuingAuthorityErrors(prev => ({ ...prev, [productName]: "Issuing authority is required" }));
//       scrollToError('license-format', productName);
//       return false;
//     }

//     // Validate Dates
//     if (!licenseData.issueDate) {
//       setLicenseDateErrors(prev => ({ ...prev, [productName]: { ...prev[productName], issue: "Issue date is required" } }));
//       scrollToError('license-format', productName);
//       return false;
//     }
//     if (!licenseData.expiryDate) {
//       setLicenseDateErrors(prev => ({ ...prev, [productName]: { ...prev[productName], expiry: "Expiry date is required" } }));
//       scrollToError('license-format', productName);
//       return false;
//     }
    
//     // NEW: Check if date gap exceeds 5 years
//     if (isDateGapExceedingFiveYears(licenseData.issueDate, licenseData.expiryDate)) {
//       setLicenseDateErrors(prev => ({ 
//         ...prev, 
//         [productName]: { 
//           ...prev[productName], 
//           gap: "License validity cannot exceed 5 years from issue date" 
//         } 
//       }));
//       scrollToError('license-format', productName);
//       toast.error(`${productName}: License validity cannot exceed 5 years`);
//       return false;
//     }
//   }
// }
//     // NEW: Check if seller name changed and required documents are missing
//     const isSellerNameChanged = profileData && formData.sellerName !== profileData.sellerName;

//     if (isSellerNameChanged && editingSection) {
//       const missingDocs = [];

//       if (!formData.companyRegistrationCertificateFile &&
//         (!formData.companyRegistrationCertificateUrl || formData.companyRegistrationCertificateUrl === "PENDING")) {
//         missingDocs.push("Company Registration Certificate");
//       }
//       if (!formData.gstFile &&
//         (!formData.gstFileUrl || formData.gstFileUrl === "PENDING")) {
//         missingDocs.push("GST Certificate");
//       }
//       const hasLicenseFile = Object.values(formData.licenses).some(license => license.file);
//       const hasLicenseUrl = Object.values(formData.licenses).some(license => license.fileUrl && license.fileUrl !== "PENDING");
//       if (!hasLicenseFile && !hasLicenseUrl) {
//         missingDocs.push("Drug/Relevant License(s)");
//       }
//       if (!formData.cancelledChequeFile &&
//         (!formData.cancelledChequeFileUrl || formData.cancelledChequeFileUrl === "PENDING")) {
//         missingDocs.push("Bank Proof");
//       }

//       if (missingDocs.length > 0) {
//         toast.error(`Seller name change requires: ${missingDocs.join(", ")}`);
//         scrollToError('seller-name');
//         return false;
//       }
//     }

//     return true;
//   };

//   const validateGSTNumberFormat = (value: string): boolean => {
//   if (!value || value.length !== 15) return false;
//   // Exact GST pattern from registration
//   const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
//   return gstRegex.test(value);
// };

//   // Replace validateGSTNumber function
//   const validateGSTNumber = (value: string): string | null => {
//     if (!value || value.trim() === "") {
//       return "GST number is required";
//     }
//     if (value.length !== 15) {
//       return "GST number must be 15 characters";
//     }
//     // Exact GST pattern from registration
//     const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
//     if (!gstRegex.test(value)) {
//       return "Invalid GST number format (e.g., 22AAAAA0000A1Z)";
//     }
//     return null;
//   };
// const handleSaveAll = async () => {
//   setIsSubmitting(true);
//   setPendingRequestError(null);

//   // Run all validations first
//   if (!validateAllFields()) {
//     setIsSubmitting(false);
//     return;
//   }

//   // DEBUG: Log to see if seller name changed
//   console.log("=== SELLER NAME CHANGE DEBUG ===");
//   console.log("profileData?.sellerName:", profileData?.sellerName);
//   console.log("formData.sellerName:", formData.sellerName);
//   console.log("sellerNameChanged state:", sellerNameChanged);

//   // Check if seller name has changed from original profile data
//   const isSellerNameChanged = profileData && formData.sellerName !== profileData.sellerName;
//   console.log("isSellerNameChanged calculated:", isSellerNameChanged);

//   // ========== CHECK IF ADDRESS HAS CHANGED ==========
//   const isAddressChanged = checkIfAddressChanged();
//   console.log("=== ADDRESS CHANGE DEBUG ===");
//   console.log("isAddressChanged:", isAddressChanged);
//   console.log("formData.companyRegistrationCertificateFile:", formData.companyRegistrationCertificateFile?.name);
//   console.log("formData.companyRegistrationCertificateUrl:", formData.companyRegistrationCertificateUrl);

//   // Address change validation - Check if address changed and require NEW company registration certificate
//   if (isAddressChanged) {
//     console.log("Address change detected - checking for company registration certificate");
    
//     // Check if NEW Company Registration Certificate is uploaded
//     const hasNewCompanyCert = formData.companyRegistrationCertificateFile !== null;
//     const hasPendingCert = formData.companyRegistrationCertificateUrl === "PENDING";
    
//     console.log("hasNewCompanyCert:", hasNewCompanyCert);
//     console.log("hasPendingCert:", hasPendingCert);
    
//     if (!hasNewCompanyCert && !hasPendingCert) {
//       // Show error and scroll to company registration field
//       setCompanyCertError(true);
//       toast.error(
//         "⚠️ Address change requires a NEW Company Registration Certificate with the updated address.\n\nPlease upload the updated certificate.",
//         { duration: 8000 }
//       );
//       scrollToError('seller-name');
//       setIsSubmitting(false);
//       return;
//     } else {
//       console.log("Company registration certificate is present for address change");
//       setCompanyCertError(false);
//     }
//   }

//   // ========== CHECK IF IFSC CODE HAS CHANGED ==========
// const isIfscCodeChanged = checkIfIfscCodeChanged();
// console.log("=== IFSC CODE CHANGE DEBUG ===");
// console.log("isIfscCodeChanged:", isIfscCodeChanged);
// console.log("formData.cancelledChequeFile:", formData.cancelledChequeFile?.name);
// console.log("formData.cancelledChequeFileUrl:", formData.cancelledChequeFileUrl);

// // IFSC code change validation - Require NEW cancelled cheque/bank passbook
// if (isIfscCodeChanged) {
//   console.log("IFSC code changed - checking for cancelled cheque upload");
  
//   // Check if NEW cancelled cheque/bank passbook is uploaded
//   const hasNewBankFile = formData.cancelledChequeFile !== null;
//   const hasPendingBankFile = formData.cancelledChequeFileUrl === "PENDING";
  
//   console.log("hasNewBankFile:", hasNewBankFile);
//   console.log("hasPendingBankFile:", hasPendingBankFile);
  
//   if (!hasNewBankFile && !hasPendingBankFile) {
//     // Show error and scroll to bank file field
//     setBankCertError(true);
//     toast.error(
//       "⚠️ IFSC code change requires a NEW cancelled cheque/bank passbook with the updated bank details.\n\nPlease upload the new document.",
//       { duration: 8000 }
//     );
//     // Scroll to bank section
//     const bankSection = document.getElementById('bank-section');
//     if (bankSection) {
//       bankSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
//     setIsSubmitting(false);
//     return;
//   } else {
//     console.log("Cancelled cheque/bank passbook is present for IFSC change");
//     setBankCertError(false);
//   }
// }

//   // Seller name change document validation
//   if (isSellerNameChanged) {
//     const missingDocuments: string[] = [];

//     // Reset error states
//     setCompanyCertError(false);
//     setGSTCertError(false);
//     setLicenseCertError(false);
//     setBankCertError(false);

//     // Check for NEW Company Registration Certificate upload
//     if (!formData.companyRegistrationCertificateFile) {
//       missingDocuments.push("Company Registration Certificate (Please upload a NEW certificate)");
//       setCompanyCertError(true);
//       console.log("Missing: Company Registration Certificate");
//     } else {
//       console.log("Company Registration Certificate file present:", formData.companyRegistrationCertificateFile.name);
//     }

//     // Check for NEW GST Certificate upload
//     if (!formData.gstFile) {
//       missingDocuments.push("GST Certificate (Please upload a NEW certificate)");
//       setGSTCertError(true);
//       console.log("Missing: GST Certificate");
//     } else {
//       console.log("GST Certificate file present:", formData.gstFile.name);
//     }

//     // Check for NEW License Copies upload
//     const hasNewLicenseFile = Object.values(formData.licenses).some(license => license.file);
//     console.log("Has new license file:", hasNewLicenseFile);
//     if (!hasNewLicenseFile) {
//       missingDocuments.push("Drug/Relevant License(s) (Please upload NEW license copies)");
//       setLicenseCertError(true);
//       console.log("Missing: License files");
//     } else {
//       console.log("License files present");
//     }

//     // Check for NEW Bank Document upload
//     if (!formData.cancelledChequeFile) {
//       missingDocuments.push("Bank Proof (Please upload a NEW cancelled cheque/passbook)");
//       setBankCertError(true);
//       console.log("Missing: Bank file");
//     } else {
//       console.log("Bank file present:", formData.cancelledChequeFile.name);
//     }

//     console.log("Missing documents count:", missingDocuments.length);
//     console.log("Missing documents:", missingDocuments);

//     if (missingDocuments.length > 0) {
//       toast.error(
//         `⚠️ Seller name change requires NEW documents:\n\n• ${missingDocuments.join("\n• ")}`,
//         { duration: 10000 }
//       );
//       scrollToError('seller-name');
//       setIsSubmitting(false);
//       return;
//     }
//   }

//   // Check for license existence errors - SCROLL TO ERROR
//   const hasLicenseExistsError = Object.values(licenseExistsError).some(error => error !== "");
//   const hasLicenseFormatError = Object.values(licenseErrors).some(error => error !== "");

//   if (hasLicenseExistsError) {
//     const errorProductName = Object.entries(licenseExistsError).find(([_, error]) => error !== "")?.[0];
//     if (errorProductName) {
//       scrollToError('license-exists', errorProductName);
//     } else {
//       scrollToTop();
//     }
//     setIsSubmitting(false);
//     return;
//   }

//   if (hasLicenseFormatError) {
//     const errorProductName = Object.entries(licenseErrors).find(([_, error]) => error !== "")?.[0];
//     if (errorProductName) {
//       scrollToError('license-format', errorProductName);
//     } else {
//       scrollToTop();
//     }
//     setIsSubmitting(false);
//     return;
//   }

//   // ========== CHECK FOR LICENSE 5-YEAR GAP VALIDATION ==========
//   console.log("=== CHECKING LICENSE VALIDITY PERIOD (MAX 5 YEARS) ===");
//   let hasGapError = false;
//   let gapErrorProductName = "";
  
//   for (const productName of formData.productTypes) {
//     const licenseData = formData.licenses[productName];
//     if (licenseData && licenseData.issueDate && licenseData.expiryDate) {
//       const exceedsFiveYears = isDateGapExceedingFiveYears(licenseData.issueDate, licenseData.expiryDate);
//       console.log(`License ${productName}: Issue: ${licenseData.issueDate}, Expiry: ${licenseData.expiryDate}, Exceeds 5 years: ${exceedsFiveYears}`);
      
//       if (exceedsFiveYears) {
//         hasGapError = true;
//         gapErrorProductName = productName;
//         // Update the error state
//         setLicenseDateErrors(prev => ({ 
//           ...prev, 
//           [productName]: { 
//             ...prev[productName], 
//             gap: "License validity cannot exceed 5 years from issue date" 
//           } 
//         }));
//         break;
//       }
//     }
//   }

//   if (hasGapError) {
//     console.log(`❌ License gap error found for: ${gapErrorProductName}`);
//     scrollToError('license-format', gapErrorProductName);
//     toast.error(`${gapErrorProductName}: License validity cannot exceed 5 years from issue date`, { duration: 5000 });
//     setIsSubmitting(false);
//     return;
//   }

//   // Also check from existing error states
//   const hasLicenseGapError = Object.entries(licenseDateErrors).some(([_, errors]) => errors?.gap);
//   if (hasLicenseGapError) {
//     const errorProductName = Object.entries(licenseDateErrors).find(([_, errors]) => errors?.gap)?.[0];
//     if (errorProductName) {
//       scrollToError('license-format', errorProductName);
//       toast.error(`${errorProductName}: License validity cannot exceed 5 years from issue date`);
//     } else {
//       scrollToTop();
//     }
//     setIsSubmitting(false);
//     return;
//   }

//   if (hasInactiveLicenses()) {
//     setShowInactiveError(true);
//     scrollToError('inactive-license');
//     setIsSubmitting(false);
//     return;
//   }

//   // Check for GST existence error
//   if (gstExistsError) {
//     scrollToError('gst');
//     setIsSubmitting(false);
//     return;
//   }

//   // Check for email existence error
//   if (emailExistsError) {
//     scrollToError('email');
//     setIsSubmitting(false);
//     return;
//   }

//   // Check for phone existence error
//   if (phoneExistsError) {
//     scrollToError('phone');
//     setIsSubmitting(false);
//     return;
//   }

//   // Check for empty license numbers
//   const hasEmptyLicenseNumbers = Object.entries(formData.licenses).some(([productName, licenseData]: [string, any]) => {
//     const isProductSelected = formData.productTypeIds.includes(licenseData.productTypeId);
//     if (isProductSelected && (!licenseData.number || licenseData.number.trim() === "")) {
//       return true;
//     }
//     return false;
//   });

//   if (hasEmptyLicenseNumbers) {
//     const emptyProductName = Object.entries(formData.licenses).find(([productName, licenseData]: [string, any]) => {
//       const isProductSelected = formData.productTypeIds.includes(licenseData.productTypeId);
//       return isProductSelected && (!licenseData.number || licenseData.number.trim() === "");
//     })?.[0];
//     if (emptyProductName) {
//       scrollToError('empty-license', emptyProductName);
//     } else {
//       scrollToTop();
//     }
//     setIsSubmitting(false);
//     return;
//   }

//   const companyPhoneValidationError = validateIndianMobileNumber(formData.phone);
//   const coordinatorPhoneValidationError = validateIndianMobileNumber(formData.coordinatorMobile);

//   if (companyPhoneValidationError) {
//     setCompanyPhoneError(companyPhoneValidationError);
//     scrollToTop();
//     setIsSubmitting(false);
//     return;
//   }

//   if (coordinatorPhoneValidationError) {
//     setCoordinatorPhoneError(coordinatorPhoneValidationError);
//     scrollToTop();
//     setIsSubmitting(false);
//     return;
//   }

//   if (formData.coordinatorEmail && !emailExistsError && profileData?.coordinator?.email !== formData.coordinatorEmail) {
//     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail);
//     if (isValidEmail) {
//       const exists = await checkCoordinatorEmailExists(formData.coordinatorEmail);
//       if (exists) {
//         scrollToError('email');
//         setIsSubmitting(false);
//         return;
//       }
//     }
//   }

//   if (formData.coordinatorMobile && !phoneExistsError && !coordinatorPhoneError && profileData?.coordinator?.mobile !== formData.coordinatorMobile) {
//     const exists = await checkCoordinatorPhoneExists(formData.coordinatorMobile);
//     if (exists) {
//       scrollToError('phone');
//       setIsSubmitting(false);
//       return;
//     }
//   }

//   // Check if account number and confirm account number match
//   if (formData.accountNumber !== formData.confirmAccountNumber) {
//     toast.error("Account number and confirm account number do not match");
//     scrollToTop();
//     setIsSubmitting(false);
//     return;
//   }

//   try {
//     let needsEmailVerification = false;
//     let needsPhoneVerification = false;
//     let newEmail = '';
//     let newPhone = '';

//     const formatDate = (date: Date | null | string): string => {
//       if (!date) return '';
//       if (typeof date === 'string') return date;
//       const d = new Date(date);
//       const year = d.getFullYear();
//       const month = String(d.getMonth() + 1).padStart(2, '0');
//       const day = String(d.getDate()).padStart(2, '0');
//       return `${year}-${month}-${day}`;
//     };

//     const filesToUpload = {
//       gstFile: null as File | null,
//       bankFile: null as File | null,
//       companyCertFile: null as File | null,
//       licenses: [] as Array<{
//         productName: string;
//         productTypeId: number;
//         file: File;
//       }>
//     };

//     if (formData.gstFile) {
//       filesToUpload.gstFile = formData.gstFile;
//     }

//     if (formData.companyRegistrationCertificateFile) {
//       filesToUpload.companyCertFile = formData.companyRegistrationCertificateFile;
//     }

//     if (formData.cancelledChequeFile) {
//       filesToUpload.bankFile = formData.cancelledChequeFile;
//     }

//     const currentDocs = profileData?.documents || [];
//     const selectedProductTypeIds = new Set(formData.productTypeIds);

//     const documentsToSend = [];
//     const processedProductTypeIds = new Set<number>();

//     for (const existingDoc of currentDocs) {
//       const productTypeId = existingDoc.productTypes?.productTypeId;
//       const productName = existingDoc.productTypes?.productTypeName;

//       if (!productTypeId || !productName) {
//         console.warn('⚠️ Skipping document with missing product info:', existingDoc);
//         continue;
//       }

//       if (selectedProductTypeIds.has(productTypeId)) {
//         const licenseData = formData.licenses[productName] || {};

//         if (licenseData.file) {
//           filesToUpload.licenses.push({
//             productName: productName,
//             productTypeId: productTypeId,
//             file: licenseData.file
//           });
//         }

//         const documentFileUrl = licenseData.fileUrl === "PENDING" ? "PENDING" : (existingDoc.documentFileUrl || '');

//         documentsToSend.push({
//           documentId: existingDoc.sellerDocumentsId,
//           productTypeId: productTypeId,
//           documentNumber: licenseData.number || existingDoc.documentNumber || '',
//           documentFileUrl: documentFileUrl,
//           licenseIssueDate: licenseData.issueDate
//             ? formatDate(licenseData.issueDate)
//             : existingDoc.licenseIssueDate || '',
//           licenseExpiryDate: licenseData.expiryDate
//             ? formatDate(licenseData.expiryDate)
//             : existingDoc.licenseExpiryDate || '',
//           licenseIssuingAuthority: licenseData.issuingAuthority || existingDoc.licenseIssuingAuthority || '',
//           licenseStatus: licenseData.status || existingDoc.licenseStatus || 'InActive'
//         });

//         processedProductTypeIds.add(productTypeId);
//       } else {
//         console.log(`🗑️ Document for product ${productTypeId} will be REMOVED`);
//       }
//     }

//     Object.entries(formData.licenses).forEach(([productName, licenseData]: [string, any]) => {
//       const productType = productTypes.find(pt => pt.productTypeName === productName);
//       if (!productType) return;

//       if (selectedProductTypeIds.has(productType.productTypeId) &&
//         !processedProductTypeIds.has(productType.productTypeId)) {

//         if (licenseData.file) {
//           filesToUpload.licenses.push({
//             productName: productName,
//             productTypeId: productType.productTypeId,
//             file: licenseData.file
//           });
//         }

//         const hasData = licenseData.number ||
//           licenseData.issueDate ||
//           licenseData.expiryDate ||
//           licenseData.issuingAuthority;

//         if (hasData) {
//           const documentFileUrl = licenseData.fileUrl === "PENDING" ? "PENDING" : '';

//           documentsToSend.push({
//             productTypeId: productType.productTypeId,
//             documentNumber: licenseData.number || '',
//             documentFileUrl: documentFileUrl,
//             licenseIssueDate: licenseData.issueDate ? formatDate(licenseData.issueDate) : '',
//             licenseExpiryDate: licenseData.expiryDate ? formatDate(licenseData.expiryDate) : '',
//             licenseIssuingAuthority: licenseData.issuingAuthority || '',
//             licenseStatus: licenseData.status || 'InActive'
//           });

//           processedProductTypeIds.add(productType.productTypeId);
//         }
//       }
//     });

//     const allProductTypeIds = Array.from(selectedProductTypeIds);

//     const completeData: UpdateSellerProfileRequest = {
//       sellerName: formData.sellerName,
//       companyTypeId: formData.companyTypeId,
//       sellerTypeId: formData.sellerTypeId,
//       productTypeId: allProductTypeIds,
//       phone: formData.phone,
//       email: formData.email,
//       website: formData.website || '',
//       termsAccepted: profileData?.termsAccepted || true,

//       address: {
//         stateId: formData.stateId,
//         districtId: formData.districtId,
//         talukaId: formData.talukaId,
//         city: formData.city,
//         street: formData.street,
//         buildingNo: formData.buildingNo,
//         landmark: formData.landmark || '',
//         pinCode: formData.pincode,
//       },

//       coordinator: {
//         name: formData.coordinatorName,
//         designation: formData.coordinatorDesignation,
//         email: formData.coordinatorEmail,
//         mobile: formData.coordinatorMobile
//       },

//       bankDetails: {
//         bankName: formData.bankName,
//         branch: formData.branch,
//         ifscCode: formData.ifscCode,
//         accountNumber: formData.accountNumber,
//         accountHolderName: formData.accountHolderName,
//         bankDocumentFileUrl: formData.cancelledChequeFileUrl === "PENDING" ? "PENDING" : (profileData?.bankDetails?.bankDocumentFileUrl || '')
//       },

//       gstNumber: formData.gstNumber,
//       gstFileUrl: formData.gstFileUrl === "PENDING" ? "PENDING" : (profileData?.sellerGST?.gstFileUrl || ''),
//       companyRegistrationCertificateUrl: formData.companyRegistrationCertificateUrl === "PENDING" ? "PENDING" : (profileData?.companyRegistrationCertificateUrl || ''),

//       documents: documentsToSend
//     };

//     const validationResult = validateSection('company', completeData);
//     if (!validationResult.success) {
//       toast.error(validationResult.error || 'Validation failed');
//       setIsSubmitting(false);
//       return;
//     }

//     if (profileData?.coordinator) {
//       if (formData.coordinatorEmail !== profileData.coordinator.email) {
//         needsEmailVerification = true;
//         newEmail = formData.coordinatorEmail;
//       }
//       if (formData.coordinatorMobile !== profileData.coordinator.mobile) {
//         needsPhoneVerification = true;
//         newPhone = formData.coordinatorMobile;
//       }
//     }

//     if (needsEmailVerification || needsPhoneVerification) {
//       if (needsEmailVerification && newEmail) {
//         const emailExists = await checkCoordinatorEmailExists(newEmail);
//         if (emailExists) {
//           scrollToError('email');
//           setIsSubmitting(false);
//           return;
//         }
//       }
//       if (needsPhoneVerification && newPhone) {
//         const phoneExists = await checkCoordinatorPhoneExists(newPhone);
//         if (phoneExists) {
//           scrollToError('phone');
//           setIsSubmitting(false);
//           return;
//         }
//       }

//       setPendingEmail(needsEmailVerification ? newEmail : undefined);
//       setPendingPhone(needsPhoneVerification ? newPhone : undefined);
//       setPendingSectionData({ completeData, filesToUpload });
//       setPendingSection('all');
//       setShowOtpModal(true);
//       setIsSubmitting(false);
//       return;
//     }

//     console.log('💾 Sending JSON data...');

//     const requestedBy = updateProfileService.getCurrentUserEmail();
//     if (!requestedBy) {
//       toast.error('User email not found');
//       setIsSubmitting(false);
//       return;
//     }

//     const response = await updateProfileService.updateFullProfile(completeData, requestedBy);

//     const pendingError = isPendingRequestError(response);
//     if (pendingError.isError) {
//       scrollToTop();

//       setPendingRequestError(
//         `⚠️ Update Request Already Pending\n\n` +
//         `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
//         `Please wait for admin approval before submitting new changes.\n\n` +
//         `You will be notified once your changes are approved.`
//       );
//       setIsSubmitting(false);
//       return;
//     }

//     let pendingSellerId: number | null = null;
//     let isAutoApproved: boolean = false;
//     let documentsList: UpdateProfileResponse['documents'] = [];

//     if (response) {
//       if (response.message && response.message.includes('auto-approved')) {
//         isAutoApproved = true;
//       }

//       if (response.pendingSellerId) {
//         pendingSellerId = response.pendingSellerId;
//       }

//       if (response.documents && Array.isArray(response.documents)) {
//         documentsList = response.documents;
//       }
//     }

//     if ((isAutoApproved || (!pendingSellerId && response && response.message)) && !hasDocumentChanges) {
//       toast.success(response.message || 'Changes applied successfully!');
//       scrollToTop();

//       const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
//       setProfileData(updatedProfile);

//       if (updatedProfile) {
//         const updatedLicenses: Record<string, any> = {};
//         updatedProfile.documents.forEach((doc: SellerDocument) => {
//           const productName = doc.productTypes?.productTypeName;
//           if (productName) {
//             const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
//             const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
//             const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//             updatedLicenses[productName] = {
//               documentId: doc.sellerDocumentsId,
//               number: doc.documentNumber || "",
//               file: null,
//               fileUrl: doc.documentFileUrl || "",
//               issueDate: issueDate,
//               expiryDate: expiryDate,
//               issuingAuthority: doc.licenseIssuingAuthority || "",
//               status: calculatedStatus,
//               productTypeId: doc.productTypes?.productTypeId || 0
//             };
//           }
//         });

//         setFormData(prev => ({
//           ...prev,
//           sellerName: updatedProfile.sellerName,
//           companyTypeId: updatedProfile.companyType?.companyTypeId || 0,
//           companyType: updatedProfile.companyType?.companyTypeName || '',
//           sellerTypeId: updatedProfile.sellerType?.sellerTypeId || 0,
//           sellerType: updatedProfile.sellerType?.sellerTypeName || '',
//           productTypeIds: updatedProfile.productTypes.map(pt => pt.productTypeId),
//           productTypes: updatedProfile.productTypes.map(pt => pt.productTypeName),
//           phone: updatedProfile.phone,
//           email: updatedProfile.email,
//           website: updatedProfile.website || '',
//           coordinatorName: updatedProfile.coordinator?.name || '',
//           coordinatorDesignation: updatedProfile.coordinator?.designation || '',
//           coordinatorEmail: updatedProfile.coordinator?.email || '',
//           coordinatorMobile: updatedProfile.coordinator?.mobile || '',
//           gstNumber: updatedProfile.sellerGST?.gstNumber || '',
//           gstFileUrl: updatedProfile.sellerGST?.gstFileUrl || '',
//           companyRegistrationCertificateUrl: updatedProfile.companyRegistrationCertificateUrl || '',
//           bankName: updatedProfile.bankDetails?.bankName || '',
//           branch: updatedProfile.bankDetails?.branch || '',
//           ifscCode: updatedProfile.bankDetails?.ifscCode || '',
//           accountNumber: updatedProfile.bankDetails?.accountNumber || '',
//           accountHolderName: updatedProfile.bankDetails?.accountHolderName || '',
//           cancelledChequeFileUrl: updatedProfile.bankDetails?.bankDocumentFileUrl || '',
//           licenses: updatedLicenses,
//         }));
//       }

//       setEditingSection(null);
//       setSavedSection('all');
//       setShowSuccess(true);
//       setHasDocumentChanges(false);
//       setSellerNameChanged(false);
//       setAddressChanged(false);
//       // Reset document error states
//       setCompanyCertError(false);
//       setGSTCertError(false);
//       setLicenseCertError(false);
//       setBankCertError(false);

//       setTimeout(() => {
//         setShowSuccess(false);
//         setSavedSection(null);
//       }, 5000);

//       setIsSubmitting(false);
//       return;
//     }

//     if (pendingSellerId || hasDocumentChanges) {
//       if (!pendingSellerId) {
//         console.error('❌ No pendingSellerId found but document changes exist');
//         toast.error('Unable to process document changes. Please contact support.');
//         setIsSubmitting(false);
//         return;
//       }

//       const pendingDocumentIdMap = new Map<number, number>();

//       if (documentsList && Array.isArray(documentsList)) {
//         documentsList.forEach((pendingDoc: any) => {
//           const productTypeId = pendingDoc.productTypeId || pendingDoc.productType?.productTypeId;
//           const pendingDocId = pendingDoc.pendingSellerDocumentId || pendingDoc.id;

//           if (productTypeId && pendingDocId) {
//             pendingDocumentIdMap.set(productTypeId, pendingDocId);
//           }
//         });
//       }

//       const hasFilesToUpload = filesToUpload.gstFile || filesToUpload.bankFile || filesToUpload.companyCertFile || filesToUpload.licenses.length > 0;

//       if (hasFilesToUpload) {
//         try {
//           console.log("=== PREPARING DOCUMENT UPLOAD ===");
//           console.log("GST File:", filesToUpload.gstFile?.name, filesToUpload.gstFile?.size);
//           console.log("Bank File:", filesToUpload.bankFile?.name, filesToUpload.bankFile?.size);
//           console.log("Company Cert File:", filesToUpload.companyCertFile?.name, filesToUpload.companyCertFile?.size);
//           console.log("Licenses:", filesToUpload.licenses.map(l => ({ name: l.productName, file: l.file?.name, size: l.file?.size })));

//           const licensesWithIds = filesToUpload.licenses.map(license => {
//             const pendingDocumentId = pendingDocumentIdMap.get(license.productTypeId);
//             console.log(`License ${license.productName} (ProductTypeId: ${license.productTypeId}) -> PendingDocumentId: ${pendingDocumentId}`);
//             if (!pendingDocumentId) {
//               console.warn(`⚠️ No pending document ID found for product type ${license.productTypeId}`);
//             }
//             return {
//               file: license.file,
//               licenseName: license.productName,
//               documentId: pendingDocumentId
//             };
//           });

//           await uploadSellerDocuments(pendingSellerId, {
//             gstFile: filesToUpload.gstFile || undefined,
//             bankFile: filesToUpload.bankFile || undefined,
//             companyRegistrationCertificate: filesToUpload.companyCertFile || undefined,
//             licenses: licensesWithIds
//           });
//           toast.success('Changes submitted for admin review.');
//           scrollToTop();

//         } catch (uploadError: any) {
//           console.error('❌ Upload failed, full error:', uploadError);
//           console.error('❌ Error response data:', uploadError.response?.data);
//           console.error('❌ Error status:', uploadError.response?.status);
//           console.error('❌ Error headers:', uploadError.response?.headers);
//           console.error('❌ Upload failed, rolling back...', uploadError);
//           await deleteUpdateRequest(pendingSellerId);
//           toast.error(uploadError.message || 'File upload failed. Changes have been rolled back. Please try again.');
//           setIsSubmitting(false);
//           return;
//         }
//       } else {
//         toast.success('Changes submitted for admin review.');
//         scrollToTop();
//       }

//       setEditingSection(null);

//       const sectionsToMark = ['company', 'coordinator', 'gst', 'bank'];
//       formData.productTypes.forEach((_, index) => {
//         sectionsToMark.push(`license-${index}`);
//       });

//       setReviewSections((prev) => {
//         const newSections = [...prev];
//         sectionsToMark.forEach(section => {
//           if (!newSections.includes(section)) {
//             newSections.push(section);
//           }
//         });
//         return newSections;
//       });

//       setSavedSection('all');
//       setShowSuccess(true);
//       setSellerNameChanged(false);
//       setAddressChanged(false);
//       // Reset document error states
//       setCompanyCertError(false);
//       setGSTCertError(false);
//       setLicenseCertError(false);
//       setBankCertError(false);

//       setFormData(prev => ({
//         ...prev,
//         gstFile: null,
//         companyRegistrationCertificateFile: null,
//         cancelledChequeFile: null,
//         licenses: Object.fromEntries(
//           Object.entries(prev.licenses).map(([key, value]: [string, any]) => [key, { ...value, file: null }])
//         )
//       }));

//       setChangedFiles({
//         gstFile: null,
//         companyCertFile: null,
//         bankFile: null,
//         licenses: []
//       });

//       setHasDocumentChanges(false);
//       setIsSubmitting(false);

//     } else {
//       console.error('❌ Unexpected response structure:', response);
//       toast.error('Unexpected server response. Please contact support.');
//       setIsSubmitting(false);
//       return;
//     }

//   } catch (error: any) {
//     console.error('❌ Error in handleSaveAll:', error);
//     console.error('❌ Error response:', error.response?.data);

//     let errorMessage = '';
//     let pendingRequestId = '';

//     if (error.response?.data) {
//       if (error.response.data.data?.data?.message) {
//         errorMessage = error.response.data.data.data.message;
//       } else if (error.response.data.data?.message) {
//         errorMessage = error.response.data.data.message;
//       } else if (error.response.data.message) {
//         errorMessage = error.response.data.message;
//       }
//     }

//     if (!errorMessage && error.message) {
//       errorMessage = error.message;
//     }

//     if (errorMessage.toLowerCase().includes('pending update request already exists')) {
//       const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
//       pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

//       scrollToTop();

//       setPendingRequestError(
//         `⚠️ Update Request Already Pending\n\n` +
//         `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
//         `Please wait for admin approval before submitting new changes.\n\n` +
//         `You will be notified once your changes are approved.`
//       );
//     } else if (error.response?.status === 400) {
//       const errorData = error.response.data;
//       if (errorData.errors) {
//         Object.entries(errorData.errors).forEach(([field, message]) => {
//           toast.error(`${field}: ${message}`);
//         });
//       } else {
//         toast.error(errorData.message || 'Validation failed');
//       }
//     } else if (error.response?.status === 409) {
//       toast.error('Document with this number already exists');
//     } else {
//       toast.error(errorMessage || 'Failed to save changes');
//     }
//     setIsSubmitting(false);
//   }
// };
//   const handleDownload = async (fileUrl: string, fileName: string) => {
//     if (fileUrl === "PENDING") {
//       toast.error('File is pending upload. Please wait for admin approval.');
//       return;
//     }

//     try {
//       toast.loading('Downloading...', { id: 'download' });

//       const response = await fetch(fileUrl, {
//         mode: 'cors',
//         credentials: 'omit',
//       });

//       if (!response.ok) {
//         throw new Error('Download failed');
//       }

//       const blob = await response.blob();
//       const blobUrl = window.URL.createObjectURL(blob);

//       const link = document.createElement('a');
//       link.href = blobUrl;
//       link.download = fileName;

//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       window.URL.revokeObjectURL(blobUrl);

//       toast.success('Download complete!', { id: 'download' });

//     } catch (error) {
//       console.error('Download failed:', error);
//       toast.error('Failed to download file. Please try again.', { id: 'download' });
//       window.open(fileUrl, '_blank', 'noopener,noreferrer');
//     }
//   };

//   const handleViewInNewTab = (fileUrl: string) => {
//     if (fileUrl === "PENDING") {
//       toast.error('File is pending upload. Please wait for admin approval.');
//       return;
//     }
//     window.open(fileUrl, '_blank', 'noopener,noreferrer');
//   };

//   if (isLoading) {
//     return (
//       <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
//         <div className="animate-pulse space-y-6">
//           <div className="h-64 bg-sneutral-100 rounded-md"></div>
//           <div className="h-48 bg-sneutral-100 rounded-md"></div>
//           <div className="h-56 bg-sneutral-100 rounded-md"></div>
//           <div className="h-40 bg-sneutral-100 rounded-md"></div>
//           <div className="h-40 bg-sneutral-100 rounded-md"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !profileData) {
//     return (
//       <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
//         <div className="bg-warning-50 border border-warning-200 rounded-md p-6 text-center">
//           <p className="text-warning-600 mb-4">{error || 'Failed to load profile'}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="bg-primary-900 text-base-white px-4 py-2 rounded-md hover:bg-primary-800"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const companyTypeOptions = companyTypes.map(type => ({
//     value: type.companyTypeId.toString(),
//     label: type.companyTypeName
//   }));

//   const sellerTypeOptions = sellerTypes.map(type => ({
//     value: type.sellerTypeId.toString(),
//     label: type.sellerTypeName
//   }));

//   const stateOptions = states.map(state => ({
//     value: state.stateId.toString(),
//     label: state.stateName
//   }));

//   const districtOptions = districts.map(district => ({
//     value: district.districtId.toString(),
//     label: district.districtName
//   }));

//   const talukaOptions = talukas.map(taluka => ({
//     value: taluka.talukaId.toString(),
//     label: taluka.talukaName
//   }));


//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
//         {pendingRequestError && (
//           <div className="bg-warning-50 border-l-4 border-warning-500 p-4 rounded-md flex gap-2">
//             <div className="flex-shrink-0">
//               <svg className="h-5 w-5 text-warning-500" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-h6 font-heading font-medium text-warning-800">Update Request Already Pending</p>
//               <p className="text-p3 text-warning-700 whitespace-pre-line">{pendingRequestError}</p>
//             </div>
//             <button
//               onClick={() => setPendingRequestError(null)}
//               className="ml-auto text-warning-500 hover:text-warning-700"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         {showInactiveError && inactiveLicenses.length > 0 && (
//           <div className="p-4 bg-warning-50 border border-warning-300 rounded-md flex items-start gap-3">
//             <span className="text-warning-500 text-xl mt-0.5">🚫</span>
//             <div>
//               <p className="text-warning-700 font-semibold">
//                 Inactive/Expired license{inactiveLicenses.length > 1 ? "s" : ""} detected — cannot submit
//               </p>
//               <p className="text-warning-600 text-p3 mt-1">
//                 The following license{inactiveLicenses.length > 1 ? "s are" : " is"} inactive/expired. Please provide a valid, active license before submitting:
//               </p>
//               <ul className="mt-2 space-y-1">
//                 {inactiveLicenses.map((productName) => (
//                   <li key={productName} className="text-warning-600 text-p3 font-medium flex items-center gap-1">
//                     <span>•</span>
//                     <span>{productName} License</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//             <button
//               onClick={() => setShowInactiveError(false)}
//               className="ml-auto text-warning-500 hover:text-warning-700"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         {!pendingRequestError && savedSection && showSuccess && (
//           <div className="bg-success-50 border-l-4 border-success-300 p-4 rounded-md flex gap-2">
//             <MdSchedule size={20} className="text-success-700 mt-1" />
//             <div>
//               <p className="text-h6 font-heading font-medium text-success-900">
//                 {savedSection === 'all' && savedSection ? 'Changes Submitted Successfully!' : 'Changes Applied!'}
//               </p>
//               <p className="text-p3 text-success-800">
//                 {savedSection === 'all' && savedSection ?
//                   'Your changes have been saved and submitted for admin review. You\'ll receive a notification once they are approved.' :
//                   'Your changes have been applied successfully.'}
//               </p>
//             </div>
//           </div>
//         )}

//         {editingSection && (
//           <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-md">
//             <div className="flex gap-2">
//               <PiInfo size={24} className="text-danger-700 mt-1" />
//               <div>
//                 <p className="text-h6 font-heading font-medium text-danger-800">
//                   Admin Review Required
//                 </p>
//                 <p className="text-p3 text-danger-700">
//                   All changes made to your profile will be reviewed by an administrator before they are reflected in the system. You will be notified once your changes have been approved.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* COMPANY DETAILS */}
//         <div id="company-section" className="bg-base-white rounded-md overflow-hidden border border-pneutral-200">
//           <div className="flex items-center justify-between px-6 py-4 bg-pneutral-50">
//             <div className="flex items-center gap-3">
//               <div className="p-2 rounded-md bg-secondary-100">
//                 <Building2 size={20} className="text-primary-900" />
//               </div>
//               <h2 className="text-h6 font-heading font-medium text-pneutral-900">
//                 Seller Company Details
//               </h2>
//             </div>

//             {!editingSection ? (
//               <button
//                 onClick={() => setEditingSection("editing")}
//                 className="flex items-center gap-2 bg-primary-900 text-base-white text-p3 px-4 py-2 rounded-md hover:bg-primary-800 transition-colors"
//               >
//                 <Pencil size={20} />
//                 Edit
//               </button>
//             ) : (
//               <ChevronUp size={18} className="text-pneutral-600" />
//             )}
//           </div>

//           <div className="p-6">
//             <div className="space-y-6">
//               <div className="flex flex-col items-center gap-2">
//                 <Image
//                   src="/icons/companylogo.png"
//                   alt="Company Logo"
//                   width={160}
//                   height={160}
//                   className="rounded-md shadow object-cover"
//                 />
//                 <p className="text-p3 text-pneutral-600">Company Logo</p>
//               </div>

//               <hr className="border-pneutral-200" />

//               <div className="grid grid-cols-2 gap-4">
//                 {/* Left Column - Seller Name/Company Name */}
//                 <div>
//                   <Input
//                     label="Seller Name/Company Name"
//                     value={formData.sellerName}
//                     editable={!!editingSection}
//                     icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
//                     onChange={handleSellerNameChangeWithTracking}
//                     error={sellerNameError}
//                   />
//                   {sellerNameChanged && editingSection && (
//                     <p className="text-p2 text-warning-600 mt-1">
//                       ⚠️ Changing seller name requires updated: Company Registration Certificate, GST Certificate, License(s), and Bank Proof
//                     </p>
//                   )}
//                 </div>

//                 {/* Right Column - Company Type */}
//                 <div>
//                   <SelectField
//                     label="Company Type"
//                     value={formData.companyTypeId?.toString()}
//                     options={companyTypeOptions}
//                     editable={!!editingSection}
//                     onChange={handleCompanyTypeChange}
//                     placeholder="Select Company Type"
//                     isLoading={loadingStates.companyTypes}
//                     labelIcon={<Image src="/icons/companytype1.jpg" alt="Company Type" width={20} height={20} className="object-contain" />}
//                   />
//                 </div>



//                 {/* Left Column - Seller Type */}
//                 <div>
//                   <SelectField
//                     label="Seller Type"
//                     value={formData.sellerTypeId?.toString()}
//                     options={sellerTypeOptions}
//                     editable={false}
//                     labelIcon={<Image src="/icons/producttype.jpg" alt="Company Type" width={20} height={20} className="object-contain" />}
//                     onChange={handleSellerTypeChange}
//                     placeholder="Select Seller Type"
//                     isLoading={loadingStates.sellerTypes}
//                   />
//                 </div>

//                 {/* Right Column - Company Registration Certificate (Half Width) */}
//                 {/* Company Registration Certificate (Half Width) */}
// <div>
//   <FileField
//     key={formData.companyRegistrationCertificateUrl || 'company-cert'}
//     label="Company Registration Certificate"
//     file={formData.companyRegistrationCertificateUrl?.split('/').pop() || 'company_registration_certificate.pdf'}
//     fileUrl={formData.companyRegistrationCertificateUrl}
//     editable={!!editingSection}
//     onDownload={() => handleDownload(
//       formData.companyRegistrationCertificateUrl || '#',
//       formData.companyRegistrationCertificateUrl?.split('/').pop() || 'company_registration_certificate.pdf'
//     )}
//     onView={() => handleViewInNewTab(formData.companyRegistrationCertificateUrl || '#')}
//     onFileSelect={(file: File) => handleCompanyCertFileChange(file)}
//     error={(addressChanged && editingSection && !formData.companyRegistrationCertificateFile && formData.companyRegistrationCertificateUrl !== "PENDING") 
//       ? "Company Registration Certificate is required when changing address" 
//       : (companyCertError && sellerNameChanged ? "Company Registration Certificate is required when changing seller name" : "")}
//   />
//   {/* {addressChanged && editingSection && !formData.companyRegistrationCertificateFile && formData.companyRegistrationCertificateUrl !== "PENDING" && (
//     <p className="text-p2 text-warning-600 mt-1">
//       ⚠️ Required when changing address - Please upload company registration certificate with updated address
//     </p>
//   )} */}
//   {companyCertError && sellerNameChanged && editingSection && (
//     <p className="text-p2 text-warning-600 mt-1">
//       ⚠️ Required when changing seller name
//     </p>
//   )}
// </div>

//                 {/* Product Category - Full Width */}
//                 <div className="col-span-2">
//                   <div className="flex flex-col">
//                     <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
//                       <Image
//                         src="/icons/pcategory.jpg"
//                         alt="Product Category"
//                         width={20}
//                         height={20}
//                         className="object-contain"
//                       />
//                       Product Category
//                       <span className="text-warning-500 ml-1">*</span>
//                     </label>
//                     <div className="relative" ref={productDropdownRef}>
//                       <div
//                         className={`w-full h-[52px] px-4 rounded-md border flex items-center justify-between ${!editingSection ? 'bg-pneutral-50 border-pneutral-100 cursor-not-allowed' : 'bg-base-white border-pneutral-200 cursor-pointer hover:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500'}`}
//                         onClick={() => {
//                           if (editingSection && !loadingStates.productTypes) {
//                             setIsProductDropdownOpen(!isProductDropdownOpen);
//                           }
//                         }}
//                       >
//                         <span className={`text-p4 font-body font-regular ${formData.productTypes.length === 0 ? "text-pneutral-500" : editingSection ? "text-pneutral-500" : "text-pneutral-800"}`}>
//                           {loadingStates.productTypes
//                             ? "Loading product types..."
//                             : formData.productTypes.length > 0
//                               ? formData.productTypes.join(", ")
//                               : "Select Product Types"}
//                         </span>
//                         <ChevronDown className={`w-5 h-5 text-pneutral-500 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
//                       </div>

//                       {editingSection && isProductDropdownOpen && !loadingStates.productTypes && (
//                         <div className="absolute top-full mt-1 w-full bg-base-white border border-pneutral-200 rounded-md shadow-xlg z-50 max-h-80 overflow-y-auto">
//                           <div className="p-2 border-b border-pneutral-200 sticky top-0 bg-base-white">
//                             <p className="text-p3 text-pneutral-600 font-medium">
//                               Select product types:
//                             </p>
//                           </div>
//                           <div className="max-h-60 overflow-y-auto">
//                             {productTypes.length > 0 && (
//                               <div
//                                 className="flex items-center px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200"
//                                 onClick={handleSelectAllProductTypes}
//                               >
//                                 <input
//                                   type="checkbox"
//                                   checked={productTypes.length > 0 && formData.productTypes.length === productTypes.length}
//                                   onChange={() => { }}
//                                   disabled
//                                   className="h-4 w-4 text-secondary-700 rounded border-pneutral-300 focus:ring-secondary-500"
//                                 />
//                                 <label className="ml-3 text-p3 font-medium text-secondary-700 cursor-pointer">
//                                   Select All
//                                 </label>
//                               </div>
//                             )}

//                             {productTypes.map((product) => (
//                               <div
//                                 key={product.productTypeId}
//                                 className="flex items-center px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200 last:border-b-0"
//                                 onClick={() => handleProductTypeToggle(product)}
//                               >
//                                 <input
//                                   type="checkbox"
//                                   checked={formData.productTypeIds.includes(product.productTypeId)}
//                                   onChange={() => { }}
//                                   className="h-4 w-4 text-secondary-700 rounded border-pneutral-300 focus:ring-secondary-500"
//                                 />
//                                 <label className="ml-3 text-p3 text-pneutral-900 cursor-pointer">
//                                   {product.productTypeName}
//                                   {product.regulatoryCategory && (
//                                     <span className="ml-2 text-p2 text-secondary-600">
//                                       ({product.regulatoryCategory})
//                                     </span>
//                                   )}
//                                 </label>
//                               </div>
//                             ))}
//                           </div>
//                           <div className="p-2 border-t border-pneutral-200 bg-secondary-50 sticky bottom-0">
//                             <p className="text-p2 text-pneutral-600">
//                               {formData.productTypes.length} of {productTypes.length} selected
//                             </p>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//               </div>

//               <hr className="border-pneutral-200" />

//               <div>
//                 <div className="flex items-center gap-2 text-label-l5 font-heading font-semibold text-pneutral-900 mb-4">
//                   <MapPin size={24} />
//                   Company Address
//                   <span className="text-warning-500">*</span>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <SelectField
//                     label="State"
//                     value={formData.stateId?.toString()}
//                     options={stateOptions}
//                     editable={!!editingSection}
//                     onChange={handleStateChange}
//                     placeholder="Select State"
//                     isLoading={loadingStates.states}
//                   />

//                   <SelectField
//                     label="District"
//                     value={formData.districtId?.toString()}
//                     options={districtOptions}
//                     editable={!!editingSection && formData.stateId > 0}
//                     onChange={handleDistrictChange}
//                     placeholder={loadingStates.districts ? "Loading..." : formData.stateId ? "Select District" : "Select State first"}
//                     isLoading={loadingStates.districts}
//                     isDisabled={!formData.stateId}
//                   />

//                   <SelectField
//                     label="Taluka"
//                     value={formData.talukaId?.toString()}
//                     options={talukaOptions}
//                     editable={!!editingSection && formData.districtId > 0}
//                     onChange={handleTalukaChange}
//                     placeholder={loadingStates.talukas ? "Loading..." : formData.districtId ? "Select Taluka" : "Select District first"}
//                     isLoading={loadingStates.talukas}
//                     isDisabled={!formData.districtId}
//                   />

//                   <Input
//                     label="City/Town/Village"
//                     value={formData.city}
//                     editable={!!editingSection}
//                     onChange={handleCityChange}
//                     error={cityError}
//                   />

//                   <Input
//                     label="Street/Road/Lane"
//                     value={formData.street}
//                     editable={!!editingSection}
//                     onChange={handleStreetChange}
//                     error={streetError}
//                   />

//                   <Input
//                     label="Building/House Number"
//                     value={formData.buildingNo}
//                     editable={!!editingSection}
//                     onChange={handleBuildingNoChange}
//                     error={buildingNoError}
//                   />

//                   <Input
//                     label="Landmark"
//                     value={formData.landmark}
//                     editable={!!editingSection}
//                     onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
//                     hideAsterisk={true}
//                   />

//                   <Input
//                     label="Pin Code"
//                     value={formData.pincode}
//                     editable={!!editingSection}
//                     onChange={handlePincodeChange}
//                     error={pincodeError}
//                     maxLength={6}
//                   />
//                 </div>
//               </div>

//               <hr className="border-pneutral-200" />

//               <div>
//                 <div className="flex items-center gap-2 text-label-l4 font-heading font-medium text-pneutral-900 mb-4">
//                   <Phone size={24} />
//                   Contact Information
//                 </div>

//                 <div className="grid grid-cols-2 gap-6">
//                   {/* Left Column - Company Phone Number */}
//                   <div className="flex flex-col">
//                     <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                       <Phone size={16} className="inline mr-2 text-pneutral-600" />
//                       Company Phone Number
//                       <span className="text-warning-500 ml-1">*</span>
//                     </label>
//                     <div className="relative">
//                       <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pneutral-800">
//                         +91
//                       </div>
//                       <input
//                         type="tel"
//                         value={formData.phone}
//                         onChange={handleCompanyPhoneChange}
//                         onBlur={handleCompanyPhoneBlur}
//                         disabled={!editingSection}
//                         maxLength={10}
//                         placeholder="9876543210"
//                         className={`w-full h-[52px] pl-12 pr-4 rounded-md text-p4 font-body font-regular
//                           ${editingSection
//                             ? `bg-base-white border ${companyPhoneError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${editingSection ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                             : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                           }`}
//                       />
//                       {companyPhoneError && (
//                         <p className="mt-1 text-p2 text-warning-500">{companyPhoneError}</p>
//                       )}
//                       {editingSection && !companyPhoneError && formData.phone && formData.phone.length === 10 && (
//                         <p className="mt-1 text-p2 text-success-600">✓ Valid mobile number</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Right Column - Company Email ID */}
//                   <Input
//                     label="Company Email ID"
//                     value={formData.email}
//                     editable={!!editingSection}
//                     icon={<Mail size={16} />}
//                     onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
//                     type="email"
//                   />

//                   {/* Left Column - Company Website (Half Width) */}
//                   <div className="col-span-1">
//                     <Input
//                       label="Company Website"
//                       value={formData.website || ''}
//                       editable={!!editingSection}
//                       icon={<Globe size={16} />}
//                       onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
//                       placeholder="https://example.com"
//                       hideAsterisk={true}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* COORDINATOR */}
//         <div id="coordinator-section">
//           <SectionCard
//             title="Company Coordinator Details"
//             icon={<FaRegUser size={24} />}
//             iconBg="bg-info-50"
//             iconColor="text-pneutral-900"
//             underReview={reviewSections.includes("coordinator")}
//           >
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Coordinator Name"
//                 value={formData.coordinatorName}
//                 editable={!!editingSection}
//                 maxLength={100}
//                 icon={<HiOutlineUser size={20} />}
//                 onChange={handleCoordinatorNameChange}
//                 error={coordinatorNameError}
//               />

//               <Input
//                 label="Coordinator Designation"
//                 value={formData.coordinatorDesignation}
//                 editable={!!editingSection}
//                 maxLength={100}
//                 icon={<HiOutlineBriefcase size={20} />}
//                 onChange={handleCoordinatorDesignationChange}
//                 error={coordinatorDesignationError}
//               />

//               <div id="coordinator-email-section" className="flex flex-col">
//                 <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                   <Mail size={16} className="inline mr-2 text-pneutral-600" />
//                   Coordinator Email ID
//                   <span className="text-warning-500 ml-1">*</span>
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="email"
//                     value={formData.coordinatorEmail}
//                     onChange={handleCoordinatorEmailChange}
//                     onBlur={handleCoordinatorEmailBlur}
//                     disabled={!editingSection}
//                     placeholder="coordinator@company.com"
//                     className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular pr-10
//                       ${editingSection
//                         ? `bg-base-white border ${emailExistsError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${emailExistsError ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                         : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                       }`}
//                   />
//                   {isCheckingEmail && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
//                     </div>
//                   )}
//                   {!isCheckingEmail && formData.coordinatorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail) && !emailExistsError && profileData?.coordinator?.email !== formData.coordinatorEmail && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <GoCheckCircle className="text-success-600" size={20} />
//                     </div>
//                   )}
//                   {!isCheckingEmail && emailExistsError && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <span className="text-warning-500 text-xl">⚠️</span>
//                     </div>
//                   )}
//                 </div>
//                 {emailExistsError && (
//                   <p className="text-p2 text-warning-500">{emailExistsError}</p>
//                 )}
//                 {!emailExistsError && formData.coordinatorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail) && !isCheckingEmail && profileData?.coordinator?.email !== formData.coordinatorEmail && (
//                   <p className="text-p2 text-success-600">✓ Valid email format</p>
//                 )}
//               </div>

//               <div id="coordinator-phone-section" className="flex flex-col">
//                 <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                   <Phone size={16} className="inline mr-2 text-pneutral-600" />
//                   Coordinator Mobile Number
//                   <span className="text-warning-500 ml-1">*</span>
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pneutral-800">
//                     +91
//                   </div>
//                   <input
//                     type="tel"
//                     value={formData.coordinatorMobile}
//                     onChange={handleCoordinatorPhoneChange}
//                     onBlur={handleCoordinatorPhoneBlur}
//                     disabled={!editingSection}
//                     maxLength={10}
//                     placeholder="9876543210"
//                     className={`w-full h-[52px] pl-12 pr-10 rounded-md text-p4 font-body font-regular
//                       ${editingSection
//                         ? `bg-base-white border ${coordinatorPhoneError || phoneExistsError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${coordinatorPhoneError || phoneExistsError ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                         : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                       }`}
//                   />
//                   {isCheckingPhone && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
//                     </div>
//                   )}
//                   {!isCheckingPhone && formData.coordinatorMobile.length === 10 && !coordinatorPhoneError && !phoneExistsError && profileData?.coordinator?.mobile !== formData.coordinatorMobile && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <GoCheckCircle className="text-success-600" size={20} />
//                     </div>
//                   )}
//                   {!isCheckingPhone && phoneExistsError && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <span className="text-warning-500 text-xl">⚠️</span>
//                     </div>
//                   )}
//                   {coordinatorPhoneError && (
//                     <p className="mt-1 text-p2 text-warning-500">{coordinatorPhoneError}</p>
//                   )}
//                   {phoneExistsError && (
//                     <p className="mt-1 text-p2 text-warning-500">{phoneExistsError}</p>
//                   )}
//                   {editingSection && !coordinatorPhoneError && !phoneExistsError && formData.coordinatorMobile && formData.coordinatorMobile.length === 10 && (
//                     <p className="mt-1 text-p2 text-success-600">✓ Valid mobile number</p>
//                   )}
//                 </div>
//               </div>

//               {(isCheckingEmail || isCheckingPhone) && (
//                 <div className="col-span-2">
//                   {isCheckingEmail && (
//                     <p className="text-p3 text-secondary-600 flex items-center gap-1">
//                       <span className="animate-spin">⏳</span> Checking email availability...
//                     </p>
//                   )}
//                   {isCheckingPhone && (
//                     <p className="text-p3 text-secondary-600 flex items-center gap-1">
//                       <span className="animate-spin">⏳</span> Checking phone availability...
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>
//           </SectionCard>
//         </div>

//         {/* LICENSE Sections */}
//         {formData.productTypes.map((productName: string, index: number) => {
//           const licenseData = formData.licenses[productName] || {
//             number: "",
//             file: null,
//             fileUrl: "",
//             issueDate: null,
//             expiryDate: null,
//             issuingAuthority: "",
//             status: 'InActive'
//           };

//           const currentStatus = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
//           const isInactive = currentStatus === 'InActive';
//           const hasLicenseError = licenseExistsError[productName] || licenseErrors[productName];

//           return (
//             <div
//               key={productName}
//               id={`license-section-${productName.replace(/\s/g, '-')}`}
//               className={`${hasLicenseError ? 'border border-pneutral-100 rounded-md' : ''}`}
//             >
//               <SectionCard
//                 title={`${productName} License Details`}
//                 icon={<HiOutlineDocumentCheck size={20} />}
//                 iconBg="bg-primary-100"
//                 iconColor="text-sneutral-800"
//                 underReview={reviewSections.includes(`license-${index}`)}
//               >
//                 {isInactive && licenseData.issueDate && licenseData.expiryDate && (
//                   <div className="mb-4 px-4 py-2.5 bg-warning-50 border border-warning-200 rounded-md flex items-center gap-2">
//                     <span className="text-warning-500 text-base">⚠️</span>
//                     <p className="text-warning-600 text-p3 font-medium">
//                       {productName} License is inactive/expired. Please update with a valid license.
//                     </p>
//                   </div>
//                 )}

//                 <div className="grid grid-cols-2 gap-6">
//                   {/* Left Column - License Number */}
//                   <div className="flex flex-col">
//                     <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                       <Hash size={16} className="inline mr-2 text-pneutral-600" />
//                       License Number <span className="text-warning-500 ml-1">*</span>
//                     </label>
//                     <div>
//                       <div className="relative">
//                         <input
//                           type="text"
//                           value={licenseData.number}
//                           onChange={(e) => handleLicenseNumberChangeWithValidation(e, productName)}
//                           onKeyDown={handleLicenseKeyDown}
//                           onPaste={(e) => handleLicensePaste(e, productName)}
//                           onBlur={(e) => handleLicenseNumberBlur(e.target.value, productName)}
//                           disabled={!editingSection}
//                           placeholder="e.g., TN/CBE/20B-12345"
//                           maxLength={30}
//                           className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular uppercase pr-10
//                             ${editingSection
//                               ? `bg-base-white border border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500 ${licenseErrors[productName] || licenseExistsError[productName] ? 'border-pneutral-200' : ''} ${licenseErrors[productName] || licenseExistsError[productName] ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                               : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                             }`}
//                         />
//                         {isCheckingLicense[productName] && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
//                           </div>
//                         )}
//                         {!isCheckingLicense[productName] && licenseData.number && licenseData.number.length >= 8 && !licenseErrors[productName] && !licenseExistsError[productName] && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <GoCheckCircle className="text-success-600" size={20} />
//                           </div>
//                         )}
//                         {!isCheckingLicense[productName] && licenseExistsError[productName] && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <span className="text-warning-500 text-xl">⚠️</span>
//                           </div>
//                         )}
//                       </div>
//                       {licenseErrors[productName] && (
//                         <p className="mt-1 text-p2 text-warning-500 flex items-start">
//                           <span className="mr-1">⚠️</span>
//                           <span>{licenseErrors[productName]}</span>
//                         </p>
//                       )}
//                       {licenseExistsError[productName] && !licenseErrors[productName] && (
//                         <p className="mt-1 text-p2 text-warning-500 flex items-start">
//                           <span className="mr-1">⚠️</span>
//                           <span>{licenseExistsError[productName]}</span>
//                         </p>
//                       )}
//                       {!licenseErrors[productName] && !licenseExistsError[productName] && licenseData.number && licenseData.number.length >= 8 && (
//                         <p className="mt-1 text-p2 text-success-600">✓ Valid license number format</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Left Column - License Issue Date */}
// <div className="flex flex-col">
//   <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//     <Calendar size={16} className="inline mr-2 text-pneutral-600" />
//     License Issue Date <span className="text-warning-500 ml-1">*</span>
//   </label>
//   {editingSection ? (
//     <DatePicker
//       value={licenseData.issueDate}
//       onChange={(date) => handleIssueDateChangeWithValidation(date, productName)}
//       maxDate={new Date()}
//       format="dd/MM/yyyy"
//       slotProps={{
//         textField: {
//           fullWidth: true,
//           size: "small",
//           placeholder: "DD/MM/YYYY",
//           error: !!licenseDateErrors[productName]?.issue || !!licenseDateErrors[productName]?.gap,
//           helperText: licenseDateErrors[productName]?.issue || licenseDateErrors[productName]?.gap,
//           sx: {
//             '& .MuiOutlinedInput-root': {
//               height: '52px',
//               borderRadius: '6px',
//               backgroundColor: '#FFFFFF',
//               '& .MuiOutlinedInput-notchedOutline': {
//                 borderColor: (licenseDateErrors[productName]?.issue || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#d1d5db',
//               },
//               '&:hover .MuiOutlinedInput-notchedOutline': {
//                 borderColor: (licenseDateErrors[productName]?.issue || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#9659FD',
//               },
//               '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                 borderColor: (licenseDateErrors[productName]?.issue || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#9659FD',
//                 borderWidth: '2px',
//               },
//             },
//             '& .MuiInputBase-input': {
//               fontSize: '16px',
//               fontFamily: 'Noto Sans',
//               fontWeight: 400,
//               color: '#5A5B58',
//             },
//           },
//         },
//       }}
//     />
//   ) : (
//     <div className="h-[52px] px-4 rounded-md bg-pneutral-50 border border-pneutral-100 flex items-center">
//       <IoCalendarOutline className="mr-2 text-pneutral-600" />
//       <span className="text-p4 font-body font-regular text-pneutral-800">{licenseData.issueDate ? licenseData.issueDate.toLocaleDateString('en-GB') : '-'}</span>
//     </div>
//   )}
// </div>

// {/* Left Column - License Expiry Date */}
// <div className="flex flex-col">
//   <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//     <Calendar size={16} className="inline mr-2 text-pneutral-600" />
//     License Expiry Date <span className="text-warning-500 ml-1">*</span>
//   </label>
//   {editingSection ? (
//     <DatePicker
//       value={licenseData.expiryDate}
//       onChange={(date) => handleExpiryDateChangeWithValidation(date, productName)}
//       minDate={licenseData.issueDate || undefined}
//       format="dd/MM/yyyy"
//       slotProps={{
//         textField: {
//           fullWidth: true,
//           size: "small",
//           placeholder: "DD/MM/YYYY",
//           error: !!licenseDateErrors[productName]?.expiry || !!licenseDateErrors[productName]?.gap,
//           helperText: licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap,
//           sx: {
//             '& .MuiOutlinedInput-root': {
//               height: '52px  !important',
//               minHeight: '52px !important',
//               borderRadius: '8px',
//               backgroundColor: '#FFFFFF',
//               '& .MuiOutlinedInput-notchedOutline': {
//                 borderColor: (licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#d1d5db',
//               },
//               '&:hover .MuiOutlinedInput-notchedOutline': {
//                 borderColor: (licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#9659FD',
//               },
//               '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                 borderColor: (licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap) ? '#ef4444' : '#9659FD',
//                 borderWidth: '2px',
//               },
//             },
//             '& .MuiInputBase-input': {
//               fontSize: '16px',
//               fontFamily: 'Noto Sans',
//               fontWeight: 400,
//               color: '#5A5B58',
//             },
//           },
//         },
//       }}
//     />
//   ) : (
//     <div className="h-[52px] px-4 rounded-md bg-pneutral-50 border border-pneutral-100 flex items-center">
//       <IoCalendarOutline className="mr-2 text-pneutral-800" />
//       <span className="text-p4 font-body font-regular text-pneutral-800">{licenseData.expiryDate ? licenseData.expiryDate.toLocaleDateString('en-GB') : '-'}</span>
//     </div>
//   )}
//   {/* {(licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap) && (
//     <p className="text-p2 text-warning-500 mt-1">
//       {licenseDateErrors[productName]?.expiry || licenseDateErrors[productName]?.gap}
//     </p>
//   )} */}
// </div>

//                   {/* Right Column - License Issuing Authority */}
//                   <Input
//                     label="License Issuing Authority"
//                     value={licenseData.issuingAuthority}
//                     editable={!!editingSection}
//                     icon={<HiOutlineAcademicCap size={20} />}
//                     onChange={(e) => handleIssuingAuthorityChangeWithValidation(e, productName)}
//                     error={licenseIssuingAuthorityErrors[productName]}
//                   />

//                   {/* Left Column - Half Width - License Copy */}
//                   <div className="col-span-1">
//                     <FileField
//                       key={licenseData.fileUrl}
//                       label="License Copy"
//                       file={licenseData.fileUrl?.split('/').pop() || 'Upload Document'}
//                       fileUrl={licenseData.fileUrl}
//                       editable={!!editingSection}
//                       onDownload={() => handleDownload(licenseData.fileUrl || '#', licenseData.fileUrl?.split('/').pop() || 'license.pdf')}
//                       onView={() => handleViewInNewTab(licenseData.fileUrl || '#')}
//                       onFileSelect={(file: File) => {
//                         handleLicenseFileChange(file, productName, licenseData.productTypeId);
//                       }}
//                       error={licenseCertError && sellerNameChanged ? "License copy is required when changing seller name" : ""}
//                     />
//                     {licenseCertError && sellerNameChanged && editingSection && (
//                       <p className="text-p2 text-warning-600 mt-1">
//                         ⚠️ Required when changing seller name
//                       </p>
//                     )}
//                   </div>

//                   {/* Right Column - License Status */}
//                   <div className="flex flex-col gap-2 py-8">
//                     <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${currentStatus === 'Active' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
//                       }`}>
//                       <GoCheckCircle size={16} />
//                       <span className="text-p3 font-medium">
//                         {!licenseData.issueDate || !licenseData.expiryDate ? 'Pending' : currentStatus}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </SectionCard>
//             </div>
//           );
//         })}

//         {/* GST Section */}
//         <div id="gst-section">
//           <SectionCard
//             title="GSTIN Details"
//             icon={<FileText size={20} />}
//             iconBg="bg-danger-50"
//             iconColor="text-warning-500"
//             underReview={reviewSections.includes("gst")}
//           >
//             <div className="grid grid-cols-2 gap-6">
//               <div className="flex flex-col">
//   <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//     GSTIN Number
//     <span className="text-warning-500 ml-1">*</span>
//   </label>
//   <div className="relative">
//     <input
//       type="text"
//       value={formData.gstNumber}
//       onChange={handleGSTChangeWithValidation}
//       onBlur={handleGSTBlur}
//       disabled={!editingSection}
//       maxLength={15}
//       placeholder="22AAAAA0000A1Z"
//       className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular uppercase pr-10
//         ${editingSection
//           ? `bg-base-white border ${gstExistsError || gstNumberError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'}`
//           : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//         }`}
//     />
//     {/* {isCheckingGST && (
//       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
//       </div>
//     )} */}
//     {/* {!isCheckingGST && formData.gstNumber && formData.gstNumber.length === 15 && validateGSTNumberFormat(formData.gstNumber) && !gstExistsError && !gstNumberError && profileData?.sellerGST?.gstNumber !== formData.gstNumber && (
//       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//         <GoCheckCircle className="text-success-600" size={20} />
//       </div>
//     )} */}
//     {/* {!isCheckingGST && (gstExistsError || gstNumberError) && (
//       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//         <span className="text-warning-500 text-xl">⚠️</span>
//       </div>
//     )} */}
//   </div>
//   {gstNumberError && (
//     <p className="text-p2 text-warning-500">{gstNumberError}</p>
//   )}
//   {gstExistsError && (
//     <p className="text-p2 text-warning-500">{gstExistsError}</p>
//   )}
//   {!gstNumberError && !gstExistsError && formData.gstNumber && formData.gstNumber.length === 15 && validateGSTNumberFormat(formData.gstNumber) && !isCheckingGST && profileData?.sellerGST?.gstNumber !== formData.gstNumber && (
//     <p className="text-p2 text-success-600">✓ Valid GST number format</p>
//   )}
//   {formData.gstNumber && formData.gstNumber.length > 0 && formData.gstNumber.length !== 15 && (
//     <p className="text-p2 text-warning-500">GST number must be 15 characters</p>
//   )}
// </div>

//               <FileField
//                 key={formData.gstFileUrl}
//                 label="GST Certificate"
//                 file={formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf'}
//                 fileUrl={formData.gstFileUrl}
//                 editable={!!editingSection}
//                 onDownload={() => handleDownload(formData.gstFileUrl || '#', formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf')}
//                 onView={() => handleViewInNewTab(formData.gstFileUrl || '#')}
//                 onFileSelect={(file: File) => handleGSTFileChange(file)}
//                 error={gstCertError && sellerNameChanged ? "GST Certificate is required when changing seller name" : ""}
//               />
//               {gstCertError && sellerNameChanged && editingSection && (
//                 <p className="text-p2 text-warning-600 mt-1">
//                   ⚠️ Required when changing seller name
//                 </p>
//               )}
//             </div>
//           </SectionCard>
//         </div>

//         {/* BANK */}
//         <div id="bank-section">
//           <SectionCard
//             title="Bank Details"
//             icon={<Image
//               src="/icons/bank.jpg"
//               alt="Bank Details"
//               width={20}
//               height={20}
//               className="object-contain"
//             />}
//             iconBg="bg-info-50"
//             iconColor="text-info-700"
//             underReview={reviewSections.includes("bank")}
//           >
//             <div className="grid grid-cols-2 gap-6">
//               {/* Left Column - Bank Name */}
//               <div>
//                 <Input
//                   label="Bank Name"
//                   value={formData.bankName}
//                   editable={false}
//                 />
//               </div>

//               {/* Right Column - Branch */}
//               <div>
//                 <Input
//                   label="Branch"
//                   value={formData.branch}
//                   editable={false}
//                 />
//               </div>

//               {/* Left Column - Account Number */}
//               <div>
//                 <Input
//                   label="Account Number"
//                   value={formData.accountNumber}
//                   editable={!!editingSection}
//                   onChange={handleAccountNumberChange}
//                   error={accountNumberError}
//                   maxLength={18}
//                 />
//               </div>

//               {/* Right Column - IFSC Code */}
//               <div>
//                 <Input
//                   label="IFSC Code"
//                   value={formData.ifscCode}
//                   editable={!!editingSection}
//                   onChange={(e) => handleIfscChange(e.target.value)}
//                   maxLength={11}
//                   className="uppercase"
//                   error={ifscValidationError || ifscError}
//                 />
//               </div>

//               {/* Left Column - Beneficiary Name */}
//               <div>
//                 <Input
//                   label="Beneficiary Name"
//                   value={formData.accountHolderName}
//                   editable={!!editingSection}
//                   onChange={handleAccountHolderNameChange}
//                   error={accountHolderNameError}
//                 />
//               </div>

//               {/* Right Column - Cancelled Cheque */}
// <div>
//   <FileField
//     key={formData.cancelledChequeFileUrl}
//     label="Cancelled Cheque / Bank Passbook"
//     file={formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf'}
//     fileUrl={formData.cancelledChequeFileUrl}
//     editable={!!editingSection}
//     onDownload={() => handleDownload(formData.cancelledChequeFileUrl || '#', formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf')}
//     onView={() => handleViewInNewTab(formData.cancelledChequeFileUrl || '#')}
//     onFileSelect={(file: File) => handleBankFileChange(file)}
//     error={(ifscCodeChanged && editingSection && !formData.cancelledChequeFile && formData.cancelledChequeFileUrl !== "PENDING") 
//       ? "⚠️ New cancelled cheque/bank passbook is required when changing IFSC code" 
//       : (bankCertError && sellerNameChanged ? "Bank proof is required when changing seller name" : "")}
//   />
//   {/* {ifscCodeChanged && editingSection && !formData.cancelledChequeFile && formData.cancelledChequeFileUrl !== "PENDING" && (
//     <p className="text-p2 text-warning-600 mt-1 flex items-start gap-1">
//       <span>⚠️</span>
//       <span>Required when changing IFSC code - Please upload a new cancelled cheque/bank passbook with updated bank details</span>
//     </p>
//   )} */}
//   {bankCertError && sellerNameChanged && editingSection && (
//     <p className="text-p2 text-warning-600 mt-1">
//       ⚠️ Required when changing seller name
//     </p>
//   )}
// </div>

              
//             </div>
//           </SectionCard>

//           {editingSection && (
//             <div className="flex justify-between gap-4 mt-6">
//               <button
//                 type="button"
//                 onClick={() => {
//                   console.log('Cancel clicked');
//                   handleCancel();
//                 }}
//                 className="flex items-center gap-2 border-2 border-warning-500 text-warning-500 text-p3 font-semibold px-6 py-3 rounded-md hover:bg-warning-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={async (e) => {
//                   e.preventDefault();
//                   console.log('Submit clicked - starting save...');
//                   await handleSaveAll();
//                 }}
//                 disabled={isSubmitting}
//                 className={`flex items-center gap-2 bg-primary-900 font-semibold text-base-white text-p3 px-6 py-3 rounded-md transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-800'
//                   }`}
//               >
//                 {isSubmitting ? (
//                   <>
//                     <svg className="animate-spin h-5 w-5 text-base-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Submitting...
//                   </>
//                 ) : (
//                   'Submit'
//                 )}
//               </button>
//             </div>
//           )}
//         </div>

//         <OtpVerificationModal
//           show={showOtpModal}
//           email={pendingEmail}
//           phone={pendingPhone}
//           onClose={() => {
//             setShowOtpModal(false);
//             setPendingEmail(undefined);
//             setPendingPhone(undefined);
//             setPendingSectionData(null);
//             setPendingSection(null);
//           }}
//           onVerified={handleOtpVerified}
//         />
//       </div>
//     </LocalizationProvider>
//   );
// }

// function SectionCard({
//   title,
//   icon,
//   iconBg,
//   iconColor,
//   children,
//   underReview
// }: any) {
//   return (
//     <div className={`bg-base-white rounded-md overflow-hidden border ${underReview ? "border-pneutral-200" : "border-pneutral-200"}`}>
//       <div className="flex items-center justify-between px-6 py-4 bg-pneutral-50">
//         <div className="flex items-center gap-3">
//           <div className={`p-2 rounded-md ${iconBg}`}>
//             <div className={iconColor}>{icon}</div>
//           </div>
//           <h2 className="text-h6 font-heading font-medium text-pneutral-900">
//             {title}
//           </h2>
//         </div>
//       </div>

//       <div className="p-6">
//         {children}
//       </div>
//     </div>
//   );
// }

// interface InputProps {
//   label: string;
//   value: string;
//   editable: boolean;
//   icon?: React.ReactNode;
//   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   maxLength?: number;
//   type?: string;
//   className?: string;
//   error?: string;
//   hideAsterisk?: boolean;
//   placeholder?: string;
// }

// function Input({
//   label,
//   value,
//   editable,
//   icon,
//   onChange,
//   maxLength,
//   type = "text",
//   className = "",
//   error,
//   hideAsterisk = false,
//   placeholder
// }: InputProps) {
//   return (
//     <div className="flex flex-col">
//       <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
//         {icon && (
//           <span className="text-pneutral-600 inline-flex items-center">
//             {icon}
//           </span>
//         )}
//         {label}
//         {!hideAsterisk && <span className="text-warning-500">*</span>}
//       </label>
//       <input
//         type={type}
//         value={value}
//         onChange={onChange}
//         disabled={!editable}
//         maxLength={maxLength}
//         placeholder={placeholder}
//         className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular ${className}
//         ${editable
//             ? `bg-base-white border ${error ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${editable ? 'text-pneutral-800' : 'text-pneutral-800'}`
//             : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//           }
//         `}
//       />
//       {error && (
//         <p className="text-p2 text-warning-500 mt-1">{error}</p>
//       )}
//     </div>
//   );
// }

// function SelectField({
//   label,
//   value,
//   options,
//   editable,
//   labelIcon,
//   inputIcon,
//   onChange,
//   placeholder,
//   isLoading,
//   isDisabled
// }: any) {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const selectedOption = options.find((opt: any) => opt.value === value);
//   const displayValue = selectedOption?.label || placeholder || "Select option";

//   const handleSelect = (selectedValue: string, selectedLabel: string) => {
//     onChange({ value: selectedValue, label: selectedLabel });
//     setIsOpen(false);
//   };

//   return (
//     <div className="flex flex-col">
//       <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
//         {labelIcon && (
//           <span className="text-pneutral-600 inline-flex items-center">
//             {labelIcon}
//           </span>
//         )}
//         {label}
//         <span className="text-warning-500">*</span>
//       </label>
//       <div className="relative" ref={dropdownRef}>
//         <div
//           className={`w-full h-[52px] px-4 rounded-md border flex items-center justify-between cursor-pointer overflow-hidden
//             ${editable && !isDisabled && !isLoading
//               ? `bg-base-white border-pneutral-200  focus:outline-none focus:ring-2 focus:ring-secondary-500 ${isOpen ? 'ring-2 ring-secondary-500 border-secondary-500' : ''}`
//               : "bg-pneutral-50 border-pneutral-100 cursor-not-allowed"
//             }`}
//           onClick={() => {
//             if (editable && !isDisabled && !isLoading) {
//               setIsOpen(!isOpen);
//             }
//           }}
//         >
//           <div className="flex items-center gap-2 flex-1">
//             {inputIcon && <span className="text-pneutral-800 shrink-0">{inputIcon}</span>}
//             <span className={`text-p4 font-body font-regular truncate ${!selectedOption ? "text-pneutral-500" : editable ? "text-pneutral-800" : "text-pneutral-800"}`}>
//               {isLoading ? "Loading..." : displayValue}
//             </span>
//           </div>
//           <ChevronDown
//             className={`w-5 h-5 text-pneutral-500 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
//           />
//         </div>

//         {isOpen && editable && !isDisabled && !isLoading && (
//           <div className="absolute top-full left-0 right-0 mt-1 bg-base-white border border-pneutral-200 rounded-md shadow-xlg z-50 overflow-hidden">
//             <div className="max-h-60 overflow-y-auto">
//               {options.length > 0 ? (
//                 options.map((opt: any) => (
//                   <div
//                     key={opt.value}
//                     className={`px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200 last:border-b-0
//                       ${value === opt.value ? "bg-secondary-50 text-secondary-700 font-medium" : "text-pneutral-900"}`}
//                     onClick={() => handleSelect(opt.value, opt.label)}
//                   >
//                     <span className="text-p3">{opt.label}</span>
//                   </div>
//                 ))
//               ) : (
//                 <div className="px-4 py-3 text-p3 text-pneutral-500 text-center">
//                   No options available
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



// function FileField({
//   label,
//   file,
//   editable,
//   onDownload,
//   onView,
//   onFileSelect,
//   fileUrl,
//   error
// }: any) {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const prevEditableRef = useRef(editable);

//   useEffect(() => {
//     if (prevEditableRef.current === true && editable === false) {
//       // eslint-disable-next-line react-hooks/set-state-in-effect
//       setSelectedFile(null);
//     }
//     prevEditableRef.current = editable;
//   }, [editable]);

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     setSelectedFile(null);
//   }, [fileUrl]);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { files } = e.target;
//     if (!files || !files[0]) return;

//     const file = files[0];

//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("File size should be less than 5MB");
//       return;
//     }

//     const allowedTypes = [
//       "application/pdf",
//       "image/jpeg",
//       "image/jpg",
//       "image/png"
//     ];

//     if (!allowedTypes.includes(file.type)) {
//       toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
//       return;
//     }

//     setSelectedFile(file);

//     if (onFileSelect) {
//       onFileSelect(file);
//     }
//   };

//   const handleReplaceClick = () => {
//     fileInputRef.current?.click();
//   };

//   const displayFileName = selectedFile
//     ? selectedFile.name
//     : file ||
//     (fileUrl && fileUrl !== "PENDING"
//       ? fileUrl.split("/").pop()
//       : "No file chosen");

//   const isPending = fileUrl === "PENDING";

//   return (
//     <div className="flex flex-col">
//       {label && (
//         <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
//           <FileText size={16} className="text-pneutral-600" />
//           {label}
//           <span className="text-warning-500">*</span>
//         </label>
//       )}

//       {editable ? (
//         <>
//           <div className="w-full h-[52px] rounded-md border border-primary-600 bg-primary-100 px-4 flex items-center justify-between gap-4">
//             {/* Left Section */}
//             <div className="flex items-center gap-3 flex-1 min-w-0">
//               {/* Icon Box */}
//               <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0">
//                 <FileText size={16} className="text-black" />
//               </div>

//               {/* File Name */}
//               <div className="flex-1 min-w-0">
//                 <div className="h-[26px] bg-success-50 rounded-[6px] px-3 flex items-center w-fit max-w-full">
//                   <span className="text-[18px] leading-[18px] font-medium text-secondary-800 truncate block max-w-[220px]">
//                     {displayFileName}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Right Actions */}
//             <div className="flex items-center gap-4 shrink-0">
//               <button
//                 type="button"
//                 onClick={handleReplaceClick}
//                 className="text-secondary-900 hover:opacity-80"
//                 title="Remove file"
//               >
//                 <X size={20} />
//               </button>

//               <button
//                 type="button"
//                 onClick={onDownload}
//                 className="text-secondary-800 hover:opacity-80"
//                 title="Download file"
//               >
//                 <Download size={20} />
//               </button>

//               <button
//                 type="button"
//                 onClick={onView}
//                 className="text-secondary-800 hover:opacity-80"
//                 title="Open in new tab"
//               >
//                 <ExternalLink size={20} />
//               </button>
//             </div>

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept=".pdf,.jpg,.jpeg,.png"
//               onChange={handleFileChange}
//               className="hidden"
//             />
//           </div>
//           {error && (
//             <p className="text-p2 text-warning-500 mt-1">{error}</p>
//           )}
//         </>
//       ) : (
//         <div className="w-full h-[52px] rounded-md border border-primary-600 bg-primary-100 px-4 flex items-center justify-between gap-4">
//           {/* Left Section */}
//           <div className="flex items-center gap-3 flex-1 min-w-0">
//             {/* Icon Box */}
//             <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0">
//               <FileText size={16} className="text-black" />
//             </div>

//             {/* File Name */}
//             <div className="flex-1 min-w-0">
//               <div className="h-[26px] bg-success-50 rounded-[6px] px-3 flex items-center w-fit max-w-full">
//                 <span className="text-[18px] leading-[18px] font-medium text-secondary-800 truncate block max-w-[220px]">
//                   {isPending ? "Pending Approval" : displayFileName}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Right Actions */}
//           <div className="flex items-center gap-4 shrink-0">
//             <button
//               onClick={onDownload}
//               className={`transition-colors ${isPending
//                 ? "text-pneutral-400 cursor-not-allowed"
//                 : "text-secondary-800 hover:opacity-80"
//                 }`}
//               title="Download file"
//               disabled={isPending}
//             >
//               <Download size={20} />
//             </button>

//             <button
//               onClick={onView}
//               className={`transition-colors ${isPending
//                 ? "text-pneutral-400 cursor-not-allowed"
//                 : "text-secondary-800 hover:opacity-80"
//                 }`}
//               title="Open in new tab"
//               disabled={isPending}
//             >
//               <ExternalLink size={20} />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }










// old code dated 27.05.2026........

// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import {
//   Building2,
//   Phone,
//   MapPin,
//   Download,
//   ExternalLink,
//   Pencil,
//   ChevronUp,
//   FileText,
//   ChevronDown,
//   Hash,
//   Calendar,

//   Globe,
//   Mail,
//   MapPin as MapPinIcon,
//   X
// } from "lucide-react";
// import { GoCheckCircle } from "react-icons/go";
// import { PiInfo } from "react-icons/pi";
// import { MdSchedule } from "react-icons/md";
// import { HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineBuildingOffice2, HiOutlineDocumentCheck, HiOutlineUser } from "react-icons/hi2";
// import { FaRegUser } from "react-icons/fa";
// import { IoCalendarOutline } from "react-icons/io5";
// import Image from "next/image";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import { sellerProfileService } from "@/src/services/seller/sellerProfileService";

// import { updateProfileService } from "@/src/services/seller/updateProfileService";
// import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
// import { fetchBankDetails } from "@/src/services/seller/IFSCService";
// import { type SellerProfile, type SellerDocument } from "@/src/types/seller/SellerProfileData";
// import { uploadSellerDocuments, deleteUpdateRequest } from "@/src/services/seller/UpdateSellerProfileDoc";
// import {
//   CompanyTypeResponse,
//   SellerTypeResponse,
//   ProductTypeResponse,
//   StateResponse,
//   DistrictResponse,
//   TalukaResponse,
// } from "@/src/types/seller/SellerRegMasterData";

// import {
//   UpdateSellerProfileRequest
// } from "@/src/types/seller/UpdateProfileData";

// import { validateSection } from "@/src/schema/seller/UpdateProfileSchema";
// import { ifscSchema } from "@/src/schema/seller/IFSCSchema";

// import OtpVerificationModal from "./OtpVerificationModal";
// import toast from "react-hot-toast";

// // Validation regex patterns
// const noConsecutiveSpaces = /^(?!.*\s{2,})[A-Za-z0-9\s.,#-]+$/;
// const alphabetsOnly = /^[A-Za-z\s]+$/;
// const alphanumericWithSpaces = /^[A-Za-z0-9\s]+$/;

// // Helper function to calculate license status based on dates - returns only Active or InActive
// const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): 'Active' | 'InActive' => {
//   if (!issueDate || !expiryDate) {
//     return 'InActive';
//   }

//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const expDate = new Date(expiryDate);
//   expDate.setHours(0, 0, 0, 0);

//   // Check if expired
//   if (expDate < today) {
//     return 'InActive';
//   }

//   return 'Active';
// };

// // Function to check if date gap exceeds 5 years
// const isDateGapExceedingFiveYears = (issueDate: Date | null, expiryDate: Date | null): boolean => {
//   if (!issueDate || !expiryDate) return false;
//   const diffInYears = (expiryDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
//   return diffInYears > 5;
// };

// // Drug License Number validation functions
// const validateDrugLicenseNumber = (value: string): string | null => {
//   const cleaned = value.trim().toUpperCase();

//   if (!cleaned) {
//     return "Drug License Number is required";
//   }

//   // Check length (minimum 8, maximum 30 characters)
//   if (cleaned.length < 8) {
//     return "Must be at least 8 characters";
//   }

//   if (cleaned.length > 30) {
//     return "Cannot exceed 30 characters";
//   }

//   // Pattern validation for common Drug License formats
//   const patterns = [
//     /^[A-Z]{2}\/[A-Z]{3}\/\d{2}[A-Z]?-\d{3,10}$/,      // TN/CBE/20B-12345
//     /^[A-Z]{2}-[A-Z0-9]{2,4}-\d{4,10}$/,                // MH-MZ2-123456
//     /^[A-Z]{2}-\d{2,3}-\d{5,10}$/,                      // DL-123-234567
//     /^\d{2}[A-Z]?-\d{3,10}$/,                           // 20B-12345
//     /^\d{2}\/\d{2}-\d{3,10}$/,                          // 20/21-12345
//     /^[A-Z]{2}\/\d{2}[A-Z]?-\d{3,10}$/,                 // MH/20B-12345
//     /^[A-Z]{2}\/\d{2,3}\/\d{4,10}$/,                    // MH/27/123456
//     /^[A-Z]{2}[A-Z0-9]{2,4}\d{4,10}$/,                  // TN20B12345
//   ];

//   const isValid = patterns.some(pattern => pattern.test(cleaned));

//   if (!isValid) {
//     return "Invalid format";
//   }

//   return null;
// };

// // Function to clean and format license number on input
// const formatLicenseNumber = (value: string): string => {
//   let cleaned = value.toUpperCase();
//   cleaned = cleaned.replace(/[^A-Z0-9\/\-]/g, '');
//   return cleaned;
// };

// // Indian Mobile Number validation function
// const validateIndianMobileNumber = (value: string): string | null => {
//   const cleaned = value.replace(/\D/g, '');

//   if (!cleaned) {
//     return null;
//   }

//   if (cleaned.length !== 10) {
//     return "Mobile number must be exactly 10 digits";
//   }

//   const firstDigit = cleaned.charAt(0);
//   if (!['6', '7', '8', '9'].includes(firstDigit)) {
//     return "Mobile number must start with 6, 7, 8, or 9";
//   }

//   return null;
// };

// // Seller Name validation
// const validateSellerName = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Seller name is required";
//   }
//   if (value.length > 60) {
//     return "Seller name cannot exceed 60 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Seller name should not contain consecutive spaces";
//   }
//   if (!noConsecutiveSpaces.test(value)) {
//     return "Seller name contains invalid characters";
//   }
//   return null;
// };

// // City validation
// const validateCity = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "City is required";
//   }
//   if (value.length > 100) {
//     return "City cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "City should not contain consecutive spaces";
//   }
//   return null;
// };

// // Street validation
// const validateStreet = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Street is required";
//   }
//   if (value.length > 100) {
//     return "Street cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Street should not contain consecutive spaces";
//   }
//   return null;
// };

// // Building Number validation
// const validateBuildingNo = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Building number is required";
//   }
//   if (value.length > 50) {
//     return "Building number cannot exceed 50 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Building number should not contain consecutive spaces";
//   }
//   return null;
// };

// // Pincode validation
// const validatePincode = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Pin code is required";
//   }
//   if (value.length !== 6) {
//     return "Pin code must be 6 digits";
//   }
//   if (!/^\d+$/.test(value)) {
//     return "Pin code must contain only digits";
//   }
//   return null;
// };

// // Coordinator Name validation
// const validateCoordinatorName = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Coordinator name is required";
//   }
//   if (value.length > 100) {
//     return "Coordinator name cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Coordinator name should not contain consecutive spaces";
//   }
//   if (!alphanumericWithSpaces.test(value)) {
//     return "Coordinator name should only contain letters, numbers, and spaces";
//   }
//   return null;
// };

// // Coordinator Designation validation
// const validateCoordinatorDesignation = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Designation is required";
//   }
//   if (value.length > 100) {
//     return "Designation cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Designation should not contain consecutive spaces";
//   }
//   if (!alphanumericWithSpaces.test(value)) {
//     return "Designation should only contain letters, numbers, and spaces";
//   }
//   return null;
// };

// // Coordinator Email validation
// const validateCoordinatorEmail = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Email is required";
//   }
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(value)) {
//     return "Invalid email format";
//   }
//   return null;
// };

// // GST Number validation
// const validateGSTNumber = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "GST number is required";
//   }
//   if (value.length !== 15) {
//     return "GST number must be 15 characters";
//   }
//   // Exact GST pattern from registration
//   const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
//   if (!gstRegex.test(value)) {
//     return "Invalid GST number format (e.g., 22AAAAA0000A1Z)";
//   }
//   return null;
// };

// // Account Number validation
// const validateAccountNumber = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Account number is required";
//   }
//   if (!/^\d{9,18}$/.test(value)) {
//     return "Account number must be 9 to 18 digits";
//   }
//   return null;
// };

// // Account Holder Name validation
// const validateAccountHolderName = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Account holder name is required";
//   }
//   if (value.length > 100) {
//     return "Account holder name cannot exceed 100 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Account holder name should not contain consecutive spaces";
//   }
//   if (!alphabetsOnly.test(value)) {
//     return "Account holder name should only contain alphabets and spaces";
//   }
//   return null;
// };

// // IFSC validation
// const validateIFSC = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "IFSC code is required";
//   }
//   if (value.length !== 11) {
//     return "IFSC code must be 11 characters";
//   }
//   const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
//   if (!ifscRegex.test(value)) {
//     return "Invalid IFSC format";
//   }
//   return null;
// };

// // License Issuing Authority validation
// const validateIssuingAuthority = (value: string): string | null => {
//   if (!value || value.trim() === "") {
//     return "Issuing authority is required";
//   }
//   if (value.length > 150) {
//     return "Issuing authority cannot exceed 150 characters";
//   }
//   if (/\s{2,}/.test(value)) {
//     return "Issuing authority should not contain consecutive spaces";
//   }
//   return null;
// };

// // Date validation
// const validateIssueDate = (date: Date | null): string | null => {
//   if (!date) {
//     return "Issue date is required";
//   }
//   if (date.getFullYear() < 2000) {
//     return "Year must be 2000 or greater";
//   }
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   if (date > today) {
//     return "Issue date cannot be in the future";
//   }
//   return null;
// };

// const validateExpiryDate = (date: Date | null, issueDate: Date | null): string | null => {
//   if (!date) {
//     return "Expiry date is required";
//   }
//   if (date.getFullYear() < 2000) {
//     return "Year must be 2000 or greater";
//   }
//   if (issueDate && date < issueDate) {
//     return "Expiry date cannot be earlier than issue date";
//   }
//   return null;
// };

// interface UpdateProfileResponse {
//   message?: string;
//   pendingSellerId?: number;
//   documents?: Array<{
//     id?: number;
//     pendingSellerDocumentId?: number;
//     productTypeId?: number;
//     productType?: {
//       productTypeId: number;
//     };
//   }>;
//   status?: string;
//   data?: {
//     status?: string;
//     message?: string;
//     data?: {
//       status?: string;
//       message?: string;
//     };
//   };
// }

// export default function SellerProfile() {
//   const [profileData, setProfileData] = useState<SellerProfile | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [editingSection, setEditingSection] = useState<string | null>(null);
//   const [reviewSections, setReviewSections] = useState<string[]>([]);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [savedSection, setSavedSection] = useState<string | null>(null);
//   const [pendingRequestError, setPendingRequestError] = useState<string | null>(null);

//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [pendingEmail, setPendingEmail] = useState<string | undefined>();
//   const [pendingPhone, setPendingPhone] = useState<string | undefined>();
//   const [pendingSectionData, setPendingSectionData] = useState<any>(null);
//   const [pendingSection, setPendingSection] = useState<string | null>(null);

//   const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
//   const productDropdownRef = useRef<HTMLDivElement>(null);

//   const phoneCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const licenseCheckTimeoutRef = useRef<Record<string, NodeJS.Timeout | null>>({});
//   const gstCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([]);
//   const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([]);
//   const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([]);
//   const [states, setStates] = useState<StateResponse[]>([]);
//   const [districts, setDistricts] = useState<DistrictResponse[]>([]);
//   const [talukas, setTalukas] = useState<TalukaResponse[]>([]);
//   const [sellerNameChanged, setSellerNameChanged] = useState(false);

//   const [companyCertError, setCompanyCertError] = useState(false);
//   const [gstCertError, setGSTCertError] = useState(false);
//   const [licenseCertError, setLicenseCertError] = useState(false);
//   const [bankCertError, setBankCertError] = useState(false);


//   const handleSellerNameChangeWithTracking = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     if (value.length > 60) return;

//     setFormData(prev => ({ ...prev, sellerName: value }));
//     const error = validateSellerName(value);
//     setSellerNameError(error || "");

//     // Track if seller name has changed from original profile data
//     console.log("Profile data seller name:", profileData?.sellerName);
//     console.log("Current value:", value);
//     console.log("Is changed:", profileData && value !== profileData.sellerName);

//     if (profileData && value !== profileData.sellerName) {
//       setSellerNameChanged(true);
//     } else {
//       setSellerNameChanged(false);
//     }
//   };

//   const [changedFiles, setChangedFiles] = useState<{
//     gstFile: File | null;
//     companyCertFile: File | null;
//     bankFile: File | null;
//     licenses: Array<{
//       productName: string;
//       productTypeId: number;
//       file: File;
//     }>;
//   }>({
//     gstFile: null,
//     companyCertFile: null,
//     bankFile: null,
//     licenses: []
//   });

//   const [hasDocumentChanges, setHasDocumentChanges] = useState(false);

//   const [loadingStates, setLoadingStates] = useState({
//     companyTypes: true,
//     sellerTypes: true,
//     productTypes: true,
//     states: true,
//     districts: false,
//     talukas: false,
//   });

//   const [ifscError, setIfscError] = useState("");
//   const [isCheckingEmail, setIsCheckingEmail] = useState(false);
//   const [emailExistsError, setEmailExistsError] = useState("");
//   const [isCheckingPhone, setIsCheckingPhone] = useState(false);
//   const [phoneExistsError, setPhoneExistsError] = useState("");
//   const [companyPhoneError, setCompanyPhoneError] = useState("");
//   const [coordinatorPhoneError, setCoordinatorPhoneError] = useState("");
//   const [licenseErrors, setLicenseErrors] = useState<Record<string, string>>({});
//   const [licenseExistsError, setLicenseExistsError] = useState<Record<string, string>>({});
//   const [isCheckingLicense, setIsCheckingLicense] = useState<Record<string, boolean>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [inactiveLicenses, setInactiveLicenses] = useState<string[]>([]);
//   const [showInactiveError, setShowInactiveError] = useState(false);

//   // New validation error states
//   const [sellerNameError, setSellerNameError] = useState("");
//   const [cityError, setCityError] = useState("");
//   const [streetError, setStreetError] = useState("");
//   const [buildingNoError, setBuildingNoError] = useState("");
//   const [pincodeError, setPincodeError] = useState("");
//   const [coordinatorNameError, setCoordinatorNameError] = useState("");
//   const [coordinatorDesignationError, setCoordinatorDesignationError] = useState("");
//   const [coordinatorEmailError, setCoordinatorEmailError] = useState("");
//   const [gstNumberError, setGstNumberError] = useState("");
//   const [accountNumberError, setAccountNumberError] = useState("");
//   const [accountHolderNameError, setAccountHolderNameError] = useState("");
//   const [ifscValidationError, setIfscValidationError] = useState("");
//   const [licenseIssuingAuthorityErrors, setLicenseIssuingAuthorityErrors] = useState<Record<string, string>>({});
//   const [licenseDateErrors, setLicenseDateErrors] = useState<Record<string, { issue?: string; expiry?: string; gap?: string }>>({});

//   // GST check states
//   const [isCheckingGST, setIsCheckingGST] = useState(false);
//   const [gstExistsError, setGSTExistsError] = useState("");

//   const [formData, setFormData] = useState({
//     companyTypeId: 0,
//     sellerTypeId: 0,
//     productTypeIds: [] as number[],
//     stateId: 0,
//     districtId: 0,
//     talukaId: 0,
//     sellerName: "",
//     companyType: "",
//     sellerType: "",
//     productTypes: [] as string[],
//     state: "",
//     district: "",
//     taluka: "",
//     city: "",
//     street: "",
//     buildingNo: "",
//     landmark: "",
//     pincode: "",
//     phone: "",
//     email: "",
//     website: "",
//     coordinatorName: "",
//     coordinatorDesignation: "",
//     coordinatorEmail: "",
//     coordinatorMobile: "",
//     gstNumber: "",
//     gstFile: null as File | null,
//     gstFileUrl: "",
//     companyRegistrationCertificateFile: null as File | null,
//     companyRegistrationCertificateUrl: "",
//     licenses: {} as Record<string, {
//       number: string;
//       file: File | null;
//       fileUrl: string;
//       issueDate: Date | null;
//       expiryDate: Date | null;
//       issuingAuthority: string;
//       status: 'Active' | 'InActive';
//       productTypeId: number;
//       documentId?: number;
//     }>,
//     bankState: "",
//     bankDistrict: "",
//     bankName: "",
//     branch: "",
//     ifscCode: "",
//     accountNumber: "",
//     accountHolderName: "",
//     confirmAccountNumber: "",
//     cancelledChequeFile: null as File | null,
//     cancelledChequeFileUrl: "",
//   });

//   // Helper function to scroll to specific error element
//   const scrollToError = (errorType: string, productName?: string) => {
//     if (errorType === 'email') {
//       const emailElement = document.getElementById('coordinator-email-section');
//       if (emailElement) {
//         emailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         emailElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
//         setTimeout(() => {
//           emailElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'phone') {
//       const phoneElement = document.getElementById('coordinator-phone-section');
//       if (phoneElement) {
//         phoneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         phoneElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
//         setTimeout(() => {
//           phoneElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md', 'p-2');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'license-exists' && productName) {
//       const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
//       const element = document.getElementById(elementId);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'license-format' && productName) {
//       const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
//       const element = document.getElementById(elementId);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'empty-license' && productName) {
//       const elementId = `license-section-${productName.replace(/\s/g, '-')}`;
//       const element = document.getElementById(elementId);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'gst') {
//       const gstElement = document.getElementById('gst-section');
//       if (gstElement) {
//         gstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         gstElement.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           gstElement.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'inactive-license') {
//       const firstInactiveLicense = inactiveLicenses[0];
//       if (firstInactiveLicense) {
//         const elementId = `license-section-${firstInactiveLicense.replace(/\s/g, '-')}`;
//         const element = document.getElementById(elementId);
//         if (element) {
//           element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//           element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//           setTimeout(() => {
//             element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//           }, 3000);
//         } else {
//           window.scrollTo({ top: 0, behavior: 'smooth' });
//         }
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else if (errorType === 'seller-name') {
//       const element = document.getElementById('seller-name-field');
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         element.classList.add('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         setTimeout(() => {
//           element.classList.remove('border-warning-500', 'ring-2', 'ring-warning-200', 'rounded-md');
//         }, 3000);
//       } else {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     } else {
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const scrollToTop = () => {
//     window.scrollTo({
//       top: 0,
//       behavior: 'smooth'
//     });
//   };

//   useEffect(() => {
//     return () => {
//       if (phoneCheckTimeoutRef.current) {
//         clearTimeout(phoneCheckTimeoutRef.current);
//       }
//       if (emailCheckTimeoutRef.current) {
//         clearTimeout(emailCheckTimeoutRef.current);
//       }
//       if (gstCheckTimeoutRef.current) {
//         clearTimeout(gstCheckTimeoutRef.current);
//       }
//       Object.values(licenseCheckTimeoutRef.current).forEach(timeout => {
//         if (timeout) clearTimeout(timeout);
//       });
//     };
//   }, []);

//   useEffect(() => {
//     const inactive: string[] = [];
//     Object.entries(formData.licenses).forEach(([productName, licenseData]) => {
//       if (licenseData.issueDate && licenseData.expiryDate) {
//         const status = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
//         if (status === 'InActive') {
//           inactive.push(productName);
//         }
//       }
//     });
//     setInactiveLicenses(inactive);
//   }, [formData.licenses]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         productDropdownRef.current &&
//         !productDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsProductDropdownOpen(false)
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside)
//     return () => document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   useEffect(() => {
//     fetchCompanyTypes();
//     fetchStates();
//     fetchSellerTypes();
//     fetchProductTypes();
//   }, []);

//   const resetFormData = () => {
//     if (profileData) {
//       const licenses: Record<string, any> = {};
//       profileData.documents.forEach((doc: SellerDocument) => {
//         const productName = doc.productTypes?.productTypeName;
//         if (productName) {
//           const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
//           const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
//           const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//           licenses[productName] = {
//             documentId: doc.sellerDocumentsId,
//             number: doc.documentNumber || "",
//             file: null,
//             fileUrl: doc.documentFileUrl || "",
//             issueDate: issueDate,
//             expiryDate: expiryDate,
//             issuingAuthority: doc.licenseIssuingAuthority || "",
//             status: calculatedStatus,
//             productTypeId: doc.productTypes?.productTypeId || 0
//           };
//         }
//       });

//       setFormData({
//         companyTypeId: profileData.companyType?.companyTypeId || 0,
//         sellerTypeId: profileData.sellerType?.sellerTypeId || 0,
//         productTypeIds: profileData.productTypes.map(pt => pt.productTypeId),
//         stateId: profileData.address?.state?.stateId || 0,
//         districtId: profileData.address?.district?.districtId || 0,
//         talukaId: profileData.address?.taluka?.talukaId || 0,
//         sellerName: profileData.sellerName,
//         companyType: profileData.companyType?.companyTypeName || '',
//         sellerType: profileData.sellerType?.sellerTypeName || '',
//         productTypes: profileData.productTypes.map(pt => pt.productTypeName),
//         state: profileData.address?.state?.stateName || '',
//         district: profileData.address?.district?.districtName || '',
//         taluka: profileData.address?.taluka?.talukaName || '',
//         city: profileData.address?.city || '',
//         street: profileData.address?.street || '',
//         buildingNo: profileData.address?.buildingNo || '',
//         landmark: profileData.address?.landmark || '',
//         pincode: profileData.address?.pinCode || '',
//         phone: profileData.phone,
//         email: profileData.email,
//         website: profileData.website || '',
//         coordinatorName: profileData.coordinator?.name || '',
//         coordinatorDesignation: profileData.coordinator?.designation || '',
//         coordinatorEmail: profileData.coordinator?.email || '',
//         coordinatorMobile: profileData.coordinator?.mobile || '',
//         gstNumber: profileData.sellerGST?.gstNumber || '',
//         gstFile: null,
//         gstFileUrl: profileData.sellerGST?.gstFileUrl || '',
//         companyRegistrationCertificateFile: null,
//         companyRegistrationCertificateUrl: profileData.companyRegistrationCertificateUrl || "",
//         licenses,
//         bankState: '',
//         bankDistrict: '',
//         bankName: profileData.bankDetails?.bankName || '',
//         branch: profileData.bankDetails?.branch || '',
//         ifscCode: profileData.bankDetails?.ifscCode || '',
//         accountNumber: profileData.bankDetails?.accountNumber || '',
//         accountHolderName: profileData.bankDetails?.accountHolderName || '',
//         confirmAccountNumber: profileData.bankDetails?.accountNumber || '',
//         cancelledChequeFile: null,
//         cancelledChequeFileUrl: profileData.bankDetails?.bankDocumentFileUrl || '',
//       });

//       // Reset validation errors
//       setSellerNameError("");
//       setCityError("");
//       setStreetError("");
//       setBuildingNoError("");
//       setPincodeError("");
//       setCoordinatorNameError("");
//       setCoordinatorDesignationError("");
//       setCoordinatorEmailError("");
//       setGstNumberError("");
//       setAccountNumberError("");
//       setAccountHolderNameError("");
//       setIfscValidationError("");
//       setLicenseErrors({});
//       setLicenseExistsError({});
//       setLicenseIssuingAuthorityErrors({});
//       setLicenseDateErrors({});
//       setGSTExistsError("");
//       setCompanyPhoneError("");
//       setCoordinatorPhoneError("");
//       setPhoneExistsError("");
//       setEmailExistsError("");
//       setHasDocumentChanges(false);
//       setInactiveLicenses([]);
//       setShowInactiveError(false);
//       setCompanyCertError(false);
//       setGSTCertError(false);
//       setLicenseCertError(false);
//       setBankCertError(false);

//     }
//   };

//   const handleCancel = () => {
//     resetFormData();
//     setEditingSection(null);
//     setChangedFiles({
//       gstFile: null,
//       companyCertFile: null,
//       bankFile: null,
//       licenses: []
//     });
//     setLicenseErrors({});
//     setLicenseExistsError({});
//     setLicenseIssuingAuthorityErrors({});
//     setLicenseDateErrors({});
//     setGSTExistsError("");
//     setCompanyPhoneError("");
//     setCoordinatorPhoneError("");
//     setPhoneExistsError("");
//     setEmailExistsError("");
//     setHasDocumentChanges(false);
//     setPendingRequestError(null);
//     setInactiveLicenses([]);
//     setShowInactiveError(false);
//     setSellerNameError("");
//     setCityError("");
//     setStreetError("");
//     setBuildingNoError("");
//     setPincodeError("");
//     setCoordinatorNameError("");
//     setCoordinatorDesignationError("");
//     setCoordinatorEmailError("");
//     setGstNumberError("");
//     setAccountNumberError("");
//     setAccountHolderNameError("");
//     setIfscValidationError("");
//   };

//   const fetchCompanyTypes = async () => {
//     setLoadingStates(prev => ({ ...prev, companyTypes: true }));
//     try {
//       const data = await sellerRegMasterService.getCompanyTypes();
//       setCompanyTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching company types:", error);
//       toast.error("Failed to load company types");
//       setCompanyTypes([]);
//     } finally {
//       setLoadingStates(prev => ({ ...prev, companyTypes: false }));
//     }
//   };

//   const fetchStates = async () => {
//     setLoadingStates(prev => ({ ...prev, states: true }));
//     try {
//       const data = await sellerRegMasterService.getStates();
//       setStates(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching states:", error);
//       toast.error("Failed to load states");
//       setStates([]);
//     } finally {
//       setLoadingStates(prev => ({ ...prev, states: false }));
//     }
//   };

//   const fetchSellerTypes = async () => {
//     setLoadingStates(prev => ({ ...prev, sellerTypes: true }));
//     try {
//       const data = await sellerRegMasterService.getSellerTypes();
//       setSellerTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching seller types:", error);
//       setSellerTypes([]);
//       toast.error("Failed to load seller types");
//     } finally {
//       setLoadingStates(prev => ({ ...prev, sellerTypes: false }));
//     }
//   };

//   const fetchProductTypes = async () => {
//     setLoadingStates(prev => ({ ...prev, productTypes: true }));
//     try {
//       const data = await sellerRegMasterService.getProductTypes();
//       setProductTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching product types:", error);
//       setProductTypes([]);
//       toast.error("Failed to load product types");
//     } finally {
//       setLoadingStates(prev => ({ ...prev, productTypes: false }));
//     }
//   };

//   const fetchDistrictsByState = async (stateId: number) => {
//     if (!stateId) return;
//     setLoadingStates(prev => ({ ...prev, districts: true }));
//     try {
//       const data = await sellerRegMasterService.getDistrictsByStateId(stateId);
//       setDistricts(data);
//     } catch (error) {
//       console.error("Error fetching districts:", error);
//       setDistricts([]);
//       toast.error("Failed to load districts");
//     } finally {
//       setLoadingStates(prev => ({ ...prev, districts: false }));
//     }
//   };

//   const fetchTalukasByDistrict = async (districtId: number) => {
//     if (!districtId) return;
//     setLoadingStates(prev => ({ ...prev, talukas: true }));
//     try {
//       const data = await sellerRegMasterService.getTalukasByDistrictId(districtId);
//       setTalukas(data);
//     } catch (error) {
//       console.error("Error fetching talukas:", error);
//       setTalukas([]);
//       toast.error("Failed to load talukas");
//     } finally {
//       setLoadingStates(prev => ({ ...prev, talukas: false }));
//     }
//   };

//   // Function to check if GST number already exists
//   const checkGSTNumberExists = async (gstNumber: string): Promise<boolean> => {
//     console.log(`🔍 Checking GST number:`, gstNumber);

//     if (!gstNumber || gstNumber.length < 15) {
//       setGSTExistsError("");
//       return false;
//     }

//     // Skip check if it's the same as existing GST number
//     if (profileData?.sellerGST?.gstNumber?.toUpperCase() === gstNumber.toUpperCase()) {
//       console.log(`GST number matches existing, skipping check`);
//       setGSTExistsError("");
//       return false;
//     }

//     setIsCheckingGST(true);
//     setGSTExistsError("");

//     try {
//       const exists = await updateProfileService.checkGSTNumber(gstNumber);
//       console.log(`GST check result for ${gstNumber}:`, exists);

//       if (exists) {
//         console.log(`GST number ${gstNumber} already exists!`);
//         setGSTExistsError("⚠️ This GST number is already registered. Please use a different GST number.");
//         return true;
//       }
//       console.log(`GST number ${gstNumber} is available`);
//       setGSTExistsError("");
//       return false;
//     } catch (error: any) {
//       console.error("Error checking GST number:", error);
//       setGSTExistsError("");
//       return false;
//     } finally {
//       setIsCheckingGST(false);
//     }
//   };

//   // Function to check if license number already exists
//   const checkLicenseNumberExists = async (licenseNumber: string, productName: string): Promise<boolean> => {
//     if (!licenseNumber || licenseNumber.length < 8) {
//       setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
//       return false;
//     }

//     const existingDoc = profileData?.documents.find(
//       doc => doc.productTypes?.productTypeName === productName
//     );

//     if (existingDoc?.documentNumber?.toUpperCase() === licenseNumber.toUpperCase()) {
//       setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
//       return false;
//     }

//     setIsCheckingLicense(prev => ({ ...prev, [productName]: true }));
//     setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));

//     try {
//       const exists = await updateProfileService.checkLicenseDocumentNumber(licenseNumber);
//       if (exists) {
//         setLicenseExistsError(prev => ({
//           ...prev,
//           [productName]: "This license number is already registered. Please use a different license number."
//         }));
//         return true;
//       }
//       setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
//       return false;
//     } catch (error: any) {
//       console.error("Error checking license number:", error);
//       if (error.response?.status !== 404) {
//         setLicenseExistsError(prev => ({
//           ...prev,
//           [productName]: "Failed to verify license number. Please try again."
//         }));
//       }
//       return false;
//     } finally {
//       setIsCheckingLicense(prev => ({ ...prev, [productName]: false }));
//     }
//   };

//   useEffect(() => {
//     const loadProfileData = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);

//         const data = await sellerProfileService.getCurrentSellerProfile();
//         setProfileData(data);

//         if (data) {
//           const licenses: Record<string, any> = {};
//           data.documents.forEach((doc: SellerDocument) => {
//             const productName = doc.productTypes?.productTypeName;
//             if (productName) {
//               const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
//               const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
//               const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//               licenses[productName] = {
//                 number: doc.documentNumber || "",
//                 file: null,
//                 fileUrl: doc.documentFileUrl || "",
//                 issueDate: issueDate,
//                 expiryDate: expiryDate,
//                 issuingAuthority: doc.licenseIssuingAuthority || "",
//                 status: calculatedStatus,
//                 productTypeId: doc.productTypes?.productTypeId || 0
//               };
//             }
//           });

//           setFormData({
//             companyTypeId: data.companyType?.companyTypeId || 0,
//             sellerTypeId: data.sellerType?.sellerTypeId || 0,
//             productTypeIds: data.productTypes.map(pt => pt.productTypeId),
//             stateId: data.address?.state?.stateId || 0,
//             districtId: data.address?.district?.districtId || 0,
//             talukaId: data.address?.taluka?.talukaId || 0,
//             sellerName: data.sellerName,
//             companyType: data.companyType?.companyTypeName || '',
//             sellerType: data.sellerType?.sellerTypeName || '',
//             productTypes: data.productTypes.map(pt => pt.productTypeName),
//             state: data.address?.state?.stateName || '',
//             district: data.address?.district?.districtName || '',
//             taluka: data.address?.taluka?.talukaName || '',
//             city: data.address?.city || '',
//             street: data.address?.street || '',
//             buildingNo: data.address?.buildingNo || '',
//             landmark: data.address?.landmark || '',
//             pincode: data.address?.pinCode || '',
//             phone: data.phone,
//             email: data.email,
//             website: data.website || '',
//             coordinatorName: data.coordinator?.name || '',
//             coordinatorDesignation: data.coordinator?.designation || '',
//             coordinatorEmail: data.coordinator?.email || '',
//             coordinatorMobile: data.coordinator?.mobile || '',
//             gstNumber: data.sellerGST?.gstNumber || '',
//             gstFile: null,
//             gstFileUrl: data.sellerGST?.gstFileUrl || '',
//             companyRegistrationCertificateFile: null,
//             companyRegistrationCertificateUrl: data.companyRegistrationCertificateUrl || "",
//             licenses,
//             bankState: '',
//             bankDistrict: '',
//             bankName: data.bankDetails?.bankName || '',
//             branch: data.bankDetails?.branch || '',
//             ifscCode: data.bankDetails?.ifscCode || '',
//             accountNumber: data.bankDetails?.accountNumber || '',
//             accountHolderName: data.bankDetails?.accountHolderName || '',
//             confirmAccountNumber: data.bankDetails?.accountNumber || '',
//             cancelledChequeFile: null,
//             cancelledChequeFileUrl: data.bankDetails?.bankDocumentFileUrl || '',
//           });

//           if (data.address?.state?.stateId) {
//             fetchDistrictsByState(data.address.state.stateId);
//           }
//           if (data.address?.district?.districtId) {
//             fetchTalukasByDistrict(data.address.district.districtId);
//           }
//         }

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

//   const handleGSTFileChange = (file: File) => {
//     setFormData(prev => ({
//       ...prev,
//       gstFile: file,
//       gstFileUrl: "PENDING"
//     }));
//     setChangedFiles(prev => ({ ...prev, gstFile: file }));
//     setHasDocumentChanges(true);
//   };

//   const handleCompanyCertFileChange = (file: File) => {
//     setFormData(prev => ({
//       ...prev,
//       companyRegistrationCertificateFile: file,
//       companyRegistrationCertificateUrl: "PENDING"
//     }));
//     setChangedFiles(prev => ({ ...prev, companyCertFile: file }));
//     setHasDocumentChanges(true);
//   };

//   const handleBankFileChange = (file: File) => {
//     setFormData(prev => ({
//       ...prev,
//       cancelledChequeFile: file,
//       cancelledChequeFileUrl: "PENDING"
//     }));
//     setChangedFiles(prev => ({ ...prev, bankFile: file }));
//     setHasDocumentChanges(true);
//   };

//   const handleLicenseFileChange = (file: File, productName: string, productTypeId: number) => {
//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           file: file,
//           fileUrl: "PENDING",
//         },
//       },
//     }));

//     setChangedFiles(prev => ({
//       ...prev,
//       licenses: [
//         ...prev.licenses.filter(l => l.productName !== productName),
//         { productName, productTypeId, file }
//       ]
//     }));
//     setHasDocumentChanges(true);
//   };

//   const handleSellerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 60) return;

//     setFormData(prev => ({ ...prev, sellerName: value }));
//     const error = validateSellerName(value);
//     setSellerNameError(error || "");
//   };

//   const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     value = value.replace(/\s{2,}/g, ' ');
//     setFormData(prev => ({ ...prev, city: value }));
//     const error = validateCity(value);
//     setCityError(error || "");
//   };

//   const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     value = value.replace(/\s{2,}/g, ' ');
//     setFormData(prev => ({ ...prev, street: value }));
//     const error = validateStreet(value);
//     setStreetError(error || "");
//   };

//   const handleBuildingNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 50) return;
//     value = value.replace(/\s{2,}/g, ' ');
//     setFormData(prev => ({ ...prev, buildingNo: value }));
//     const error = validateBuildingNo(value);
//     setBuildingNoError(error || "");
//   };

//   const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 6) value = value.slice(0, 6);
//     setFormData(prev => ({ ...prev, pincode: value }));
//     const error = validatePincode(value);
//     setPincodeError(error || "");
//   };

//   const handleCoordinatorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     setFormData(prev => ({ ...prev, coordinatorName: value }));
//     const error = validateCoordinatorName(value);
//     setCoordinatorNameError(error || "");
//   };

//   const handleCoordinatorDesignationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     setFormData(prev => ({ ...prev, coordinatorDesignation: value }));
//     const error = validateCoordinatorDesignation(value);
//     setCoordinatorDesignationError(error || "");
//   };

//   const handleCoordinatorEmailChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setFormData(prev => ({ ...prev, coordinatorEmail: value }));
//     const error = validateCoordinatorEmail(value);
//     setCoordinatorEmailError(error || "");
//   };

//   const handleGSTChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.toUpperCase();
//     value = value.replace(/[^0-9A-Z]/g, '');
//     if (value.length > 15) value = value.slice(0, 15);
//     setFormData(prev => ({ ...prev, gstNumber: value }));

//     const error = validateGSTNumber(value);
//     setGstNumberError(error || "");

//     if (gstExistsError) {
//       setGSTExistsError("");
//     }

//     if (gstCheckTimeoutRef.current) {
//       clearTimeout(gstCheckTimeoutRef.current);
//     }

//     if (profileData?.sellerGST?.gstNumber?.toUpperCase() === value.toUpperCase()) {
//       setGSTExistsError("");
//       return;
//     }

//     if (value.length === 15 && !error) {
//       gstCheckTimeoutRef.current = setTimeout(async () => {
//         await checkGSTNumberExists(value);
//         gstCheckTimeoutRef.current = null;
//       }, 500);
//     }
//   };

//   const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 18) value = value.slice(0, 18);
//     setFormData(prev => ({ ...prev, accountNumber: value }));
//     const error = validateAccountNumber(value);
//     setAccountNumberError(error || "");

//     // Also clear confirm account number if account number changes
//     if (formData.confirmAccountNumber && formData.confirmAccountNumber !== value) {
//       setFormData(prev => ({ ...prev, confirmAccountNumber: "" }));
//     }
//   };

//   const handleConfirmAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 18) value = value.slice(0, 18);
//     setFormData(prev => ({ ...prev, confirmAccountNumber: value }));
//   };

//   const handleAccountHolderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;
//     if (value.length > 100) return;
//     value = value.replace(/[^A-Za-z\s]/g, '');
//     value = value.replace(/\s{2,}/g, ' ');
//     setFormData(prev => ({ ...prev, accountHolderName: value }));
//     const error = validateAccountHolderName(value);
//     setAccountHolderNameError(error || "");
//   };

//   const handleLicenseNumberChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//     const value = e.target.value;
//     const cleanedValue = formatLicenseNumber(value);

//     if (cleanedValue !== value) {
//       return;
//     }

//     if (cleanedValue.length > 30) {
//       return;
//     }

//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           number: cleanedValue,
//         },
//       },
//     }));

//     const formatError = validateDrugLicenseNumber(cleanedValue);
//     setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

//     if (licenseExistsError[productName]) {
//       setLicenseExistsError(prev => ({ ...prev, [productName]: "" }));
//     }

//     if (!formatError && cleanedValue.length >= 8) {
//       if (licenseCheckTimeoutRef.current[productName]) {
//         clearTimeout(licenseCheckTimeoutRef.current[productName]!);
//       }

//       licenseCheckTimeoutRef.current[productName] = setTimeout(async () => {
//         await checkLicenseNumberExists(cleanedValue, productName);
//         licenseCheckTimeoutRef.current[productName] = null;
//       }, 500);
//     }
//   };

//   // Replace the handleLicenseKeyDown function with this:
//   const handleLicenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     // Allow all navigation and control keys
//     const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
//     if (allowedKeys.includes(e.key)) {
//       return;
//     }

//     // Allow Ctrl/Cmd + V for paste
//     if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
//       return;
//     }

//     // Allow Ctrl/Cmd + C for copy
//     if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
//       return;
//     }

//     // Allow Ctrl/Cmd + X for cut
//     if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
//       return;
//     }

//     // Allow Ctrl/Cmd + A for select all
//     if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
//       return;
//     }

//     // Block invalid characters - only allow alphanumeric, hyphens, and slashes
//     const allowedChars = /^[A-Za-z0-9\/\-]$/;
//     if (!allowedChars.test(e.key)) {
//       e.preventDefault();
//     }
//   };

//   const handleLicensePaste = async (e: React.ClipboardEvent<HTMLInputElement>, productName: string) => {
//     e.preventDefault();
//     const pastedText = e.clipboardData.getData('text');
//     let cleanedText = pastedText.toUpperCase();
//     cleanedText = cleanedText.replace(/[^A-Z0-9\/\-]/g, '');
//     if (cleanedText.length > 30) {
//       cleanedText = cleanedText.substring(0, 30);
//     }

//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           number: cleanedText,
//         },
//       },
//     }));

//     const formatError = validateDrugLicenseNumber(cleanedText);
//     setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

//     if (!formatError && cleanedText.length >= 8) {
//       await checkLicenseNumberExists(cleanedText, productName);
//     }
//   };

//   const handleLicenseNumberBlur = async (value: string, productName: string) => {
//     const formatError = validateDrugLicenseNumber(value);
//     setLicenseErrors(prev => ({ ...prev, [productName]: formatError || "" }));

//     if (!formatError && value.length >= 8) {
//       await checkLicenseNumberExists(value, productName);
//     }
//   };

//   const handleIssuingAuthorityChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//     let value = e.target.value;
//     if (value.length > 150) return;
//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           issuingAuthority: value,
//         },
//       },
//     }));
//     const error = validateIssuingAuthority(value);
//     setLicenseIssuingAuthorityErrors(prev => ({ ...prev, [productName]: error || "" }));
//   };

//   const handleIssueDateChangeWithValidation = (date: Date | null, productName: string) => {
//     if (date) {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       date.setHours(0, 0, 0, 0);

//       if (date > today) {
//         toast.error("Issue date cannot be greater than today's date");
//         return;
//       }
//     }

//     setFormData(prev => {
//       const updatedLicenses = { ...prev.licenses };
//       if (updatedLicenses[productName]) {
//         const newStatus = calculateLicenseStatus(date, updatedLicenses[productName].expiryDate);
//         updatedLicenses[productName] = {
//           ...updatedLicenses[productName],
//           issueDate: date,
//           status: newStatus,
//         };
//       }
//       return { ...prev, licenses: updatedLicenses };
//     });

//     const error = validateIssueDate(date);
//     setLicenseDateErrors(prev => ({
//       ...prev,
//       [productName]: { ...prev[productName], issue: error || "" }
//     }));

//     // Check for date gap
//     const expiryDate = formData.licenses[productName]?.expiryDate;
//     if (date && expiryDate && isDateGapExceedingFiveYears(date, expiryDate)) {
//       setLicenseDateErrors(prev => ({
//         ...prev,
//         [productName]: { ...prev[productName], gap: "License validity cannot exceed 5 years" }
//       }));
//     } else {
//       setLicenseDateErrors(prev => ({
//         ...prev,
//         [productName]: { ...prev[productName], gap: "" }
//       }));
//     }
//   };

//   const handleExpiryDateChangeWithValidation = (date: Date | null, productName: string) => {
//     setFormData(prev => {
//       const updatedLicenses = { ...prev.licenses };
//       if (updatedLicenses[productName]) {
//         const newStatus = calculateLicenseStatus(updatedLicenses[productName].issueDate, date);
//         updatedLicenses[productName] = {
//           ...updatedLicenses[productName],
//           expiryDate: date,
//           status: newStatus,
//         };
//       }
//       return { ...prev, licenses: updatedLicenses };
//     });

//     const issueDate = formData.licenses[productName]?.issueDate;
//     const error = validateExpiryDate(date, issueDate);
//     setLicenseDateErrors(prev => ({
//       ...prev,
//       [productName]: { ...prev[productName], expiry: error || "" }
//     }));

//     if (issueDate && date && isDateGapExceedingFiveYears(issueDate, date)) {
//       setLicenseDateErrors(prev => ({
//         ...prev,
//         [productName]: { ...prev[productName], gap: "License validity cannot exceed 5 years" }
//       }));
//     } else {
//       setLicenseDateErrors(prev => ({
//         ...prev,
//         [productName]: { ...prev[productName], gap: "" }
//       }));
//     }
//   };

//   const handleProductTypeToggle = (product: ProductTypeResponse) => {
//     if (!product) return;

//     setFormData(prev => {
//       let newProductTypeIds = [...prev.productTypeIds];
//       let newProductTypes = [...prev.productTypes];
//       const newLicenses = { ...prev.licenses };

//       if (newProductTypeIds.includes(product.productTypeId)) {
//         newProductTypeIds = newProductTypeIds.filter(id => id !== product.productTypeId);
//         newProductTypes = newProductTypes.filter(name => name !== product.productTypeName);
//         delete newLicenses[product.productTypeName];
//         setLicenseErrors(prevErrors => {
//           const newErrors = { ...prevErrors };
//           delete newErrors[product.productTypeName];
//           return newErrors;
//         });
//         setLicenseExistsError(prevErrors => {
//           const newErrors = { ...prevErrors };
//           delete newErrors[product.productTypeName];
//           return newErrors;
//         });
//         setLicenseIssuingAuthorityErrors(prevErrors => {
//           const newErrors = { ...prevErrors };
//           delete newErrors[product.productTypeName];
//           return newErrors;
//         });
//         setLicenseDateErrors(prevErrors => {
//           const newErrors = { ...prevErrors };
//           delete newErrors[product.productTypeName];
//           return newErrors;
//         });
//       } else {
//         newProductTypeIds.push(product.productTypeId);
//         newProductTypes.push(product.productTypeName);

//         const existingDoc = profileData?.documents.find(
//           doc => doc.productTypes?.productTypeId === product.productTypeId
//         );

//         if (existingDoc) {
//           const issueDate = existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null;
//           const expiryDate = existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null;
//           const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//           newLicenses[product.productTypeName] = {
//             documentId: existingDoc.sellerDocumentsId,
//             number: existingDoc.documentNumber || "",
//             file: null,
//             fileUrl: existingDoc.documentFileUrl || "",
//             issueDate: issueDate,
//             expiryDate: expiryDate,
//             issuingAuthority: existingDoc.licenseIssuingAuthority || "",
//             status: calculatedStatus,
//             productTypeId: product.productTypeId
//           };
//         } else {
//           newLicenses[product.productTypeName] = {
//             number: "",
//             file: null,
//             fileUrl: "",
//             issueDate: null,
//             expiryDate: null,
//             issuingAuthority: "",
//             status: 'InActive',
//             productTypeId: product.productTypeId
//           };
//         }
//       }

//       return {
//         ...prev,
//         productTypeIds: newProductTypeIds,
//         productTypes: newProductTypes,
//         licenses: newLicenses,
//       };
//     });
//   };

//   const handleSelectAllProductTypes = () => {
//     if (!productTypes.length) return;

//     if (formData.productTypes.length === productTypes.length) {
//       setFormData(prev => ({
//         ...prev,
//         productTypeIds: [],
//         productTypes: [],
//         licenses: {},
//       }));
//       setLicenseErrors({});
//       setLicenseExistsError({});
//       setLicenseIssuingAuthorityErrors({});
//       setLicenseDateErrors({});
//     } else {
//       const allIds = productTypes.map(p => p.productTypeId);
//       const allNames = productTypes.map(p => p.productTypeName);

//       const newLicenses: Record<string, any> = {};

//       allNames.forEach(name => {
//         const product = productTypes.find(p => p.productTypeName === name);
//         if (!product) return;

//         const existingDoc = profileData?.documents.find(
//           doc => doc.productTypes?.productTypeId === product.productTypeId
//         );

//         if (existingDoc) {
//           const issueDate = existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null;
//           const expiryDate = existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null;
//           const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//           newLicenses[name] = {
//             documentId: existingDoc.sellerDocumentsId,
//             number: existingDoc.documentNumber || "",
//             file: null,
//             fileUrl: existingDoc.documentFileUrl || "",
//             issueDate: issueDate,
//             expiryDate: expiryDate,
//             issuingAuthority: existingDoc.licenseIssuingAuthority || "",
//             status: calculatedStatus,
//             productTypeId: product.productTypeId
//           };
//         } else {
//           newLicenses[name] = {
//             number: "",
//             file: null,
//             fileUrl: "",
//             issueDate: null,
//             expiryDate: null,
//             issuingAuthority: "",
//             status: 'InActive',
//             productTypeId: product.productTypeId
//           };
//         }
//       });

//       setFormData(prev => ({
//         ...prev,
//         productTypeIds: allIds,
//         productTypes: allNames,
//         licenses: newLicenses,
//       }));
//     }
//   };

//   const handleStateChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedState = states.find(s => s.stateId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       stateId: selectedId,
//       state: selectedState?.stateName || "",
//       districtId: 0,
//       district: "",
//       talukaId: 0,
//       taluka: "",
//     }));

//     setDistricts([]);
//     setTalukas([]);

//     if (selectedId) {
//       fetchDistrictsByState(selectedId);
//     }
//   };

//   const handleDistrictChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedDistrict = districts.find(d => d.districtId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       districtId: selectedId,
//       district: selectedDistrict?.districtName || "",
//       talukaId: 0,
//       taluka: "",
//     }));

//     setTalukas([]);

//     if (selectedId) {
//       fetchTalukasByDistrict(selectedId);
//     }
//   };

//   const handleTalukaChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedTaluka = talukas.find(t => t.talukaId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       talukaId: selectedId,
//       taluka: selectedTaluka?.talukaName || "",
//     }));
//   };

//   const handleCompanyTypeChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedCompany = companyTypes.find(c => c.companyTypeId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       companyTypeId: selectedId,
//       companyType: selectedCompany?.companyTypeName || "",
//     }));
//   };

//   const handleSellerTypeChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedSeller = sellerTypes.find(s => s.sellerTypeId === selectedId);

//     setFormData(prev => ({
//       ...prev,
//       sellerTypeId: selectedId,
//       sellerType: selectedSeller?.sellerTypeName || "",
//     }));
//   };

//   const handleGSTBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
//     const value = e.target.value;

//     if (!value || value.length !== 15) {
//       return;
//     }

//     if (profileData?.sellerGST?.gstNumber?.toUpperCase() === value.toUpperCase()) {
//       setGSTExistsError("");
//       return;
//     }

//     await checkGSTNumberExists(value);
//   };

//   const handleCompanyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 10) value = value.slice(0, 10);

//     let cleanValue = value;
//     if (cleanValue.startsWith('91')) {
//       cleanValue = cleanValue.substring(2);
//     }

//     setFormData(prev => ({ ...prev, phone: cleanValue }));

//     const error = validateIndianMobileNumber(cleanValue);
//     setCompanyPhoneError(error || "");
//   };

//   const handleCompanyPhoneBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.startsWith('91')) {
//       value = value.substring(2);
//     }
//     const error = validateIndianMobileNumber(value);
//     setCompanyPhoneError(error || "");
//   };

//   const handleCoordinatorPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.length > 10) value = value.slice(0, 10);

//     let cleanValue = value;
//     if (cleanValue.startsWith('91')) {
//       cleanValue = cleanValue.substring(2);
//     }

//     setFormData(prev => ({ ...prev, coordinatorMobile: cleanValue }));

//     const error = validateIndianMobileNumber(cleanValue);
//     setCoordinatorPhoneError(error || "");

//     if (phoneExistsError) {
//       setPhoneExistsError("");
//     }

//     if (phoneCheckTimeoutRef.current) {
//       clearTimeout(phoneCheckTimeoutRef.current);
//     }

//     if (profileData?.coordinator?.mobile === cleanValue) {
//       return;
//     }

//     if (cleanValue.length === 10 && !error) {
//       phoneCheckTimeoutRef.current = setTimeout(async () => {
//         await checkCoordinatorPhoneExists(cleanValue);
//         phoneCheckTimeoutRef.current = null;
//       }, 500);
//     }
//   };

//   const handleCoordinatorPhoneBlur = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.replace(/\D/g, '');
//     if (value.startsWith('91')) {
//       value = value.substring(2);
//     }

//     if (profileData?.coordinator?.mobile === value) {
//       return;
//     }

//     const error = validateIndianMobileNumber(value);
//     setCoordinatorPhoneError(error || "");

//     if (value.length === 10 && !error && !phoneExistsError) {
//       await checkCoordinatorPhoneExists(value);
//     }
//   };

//   const handleCoordinatorEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setFormData(prev => ({ ...prev, coordinatorEmail: value }));
//     handleCoordinatorEmailChangeWithValidation(e);

//     if (emailExistsError) {
//       setEmailExistsError("");
//     }

//     if (emailCheckTimeoutRef.current) {
//       clearTimeout(emailCheckTimeoutRef.current);
//     }

//     if (profileData?.coordinator?.email === value) {
//       return;
//     }

//     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

//     if (isValidEmail && value) {
//       emailCheckTimeoutRef.current = setTimeout(async () => {
//         if (formData.coordinatorEmail === value) {
//           await checkCoordinatorEmailExists(value);
//         }
//         emailCheckTimeoutRef.current = null;
//       }, 500);
//     }
//   };

//   const handleCoordinatorEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
//     const value = e.target.value;

//     if (profileData?.coordinator?.email === value) {
//       return;
//     }

//     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

//     if (isValidEmail && value && !emailExistsError) {
//       await checkCoordinatorEmailExists(value);
//     }
//   };

//   const handleIfscChange = async (value: string) => {
//     const ifsc = value.toUpperCase();
//     setFormData(prev => ({ ...prev, ifscCode: ifsc }));

//     const validationError = validateIFSC(ifsc);
//     setIfscValidationError(validationError || "");
//     setIfscError(validationError || "");

//     if (ifsc.length !== 11) {
//       setFormData(prev => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: "",
//       }));
//       return;
//     }

//     if (validationError) {
//       setFormData(prev => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: "",
//       }));
//       toast.error(validationError);
//       return;
//     }

//     const parseResult = ifscSchema.safeParse(ifsc);
//     if (!parseResult.success) {
//       setIfscError(parseResult.error.issues[0].message);
//       setIfscValidationError(parseResult.error.issues[0].message);
//       setFormData(prev => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: "",
//       }));
//       toast.error(parseResult.error.issues[0].message);
//       return;
//     }

//     try {
//       const data = await fetchBankDetails(ifsc);
//       setFormData(prev => ({
//         ...prev,
//         bankName: data.BANK || "",
//         branch: data.BRANCH || "",
//         bankState: data.STATE || "",
//         bankDistrict: data.DISTRICT || data.CITY || "",
//       }));
//     } catch {
//       setIfscError("Invalid IFSC Code");
//       setIfscValidationError("Invalid IFSC Code");
//       setFormData(prev => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: "",
//       }));
//       toast.error("Invalid IFSC Code");
//     }
//   };

//   const checkCoordinatorEmailExists = async (email: string): Promise<boolean> => {
//     if (!email || !email.includes('@') || !email.includes('.')) {
//       setEmailExistsError("");
//       return false;
//     }

//     if (profileData?.coordinator?.email === email) {
//       setEmailExistsError("");
//       return false;
//     }

//     setIsCheckingEmail(true);
//     setEmailExistsError("");

//     try {
//       const exists = await sellerRegService.checkCoordinatorEmail(email);
//       if (exists) {
//         setEmailExistsError("⚠️ This email is already registered. Please use a different email address.");
//         return true;
//       }
//       setEmailExistsError("");
//       return false;
//     } catch (error: any) {
//       console.error("Error checking email:", error);
//       if (error.response?.status !== 404) {
//         setEmailExistsError("Failed to verify email. Please try again.");
//       }
//       return false;
//     } finally {
//       setIsCheckingEmail(false);
//     }
//   };

//   const checkCoordinatorPhoneExists = async (phone: string): Promise<boolean> => {
//     const cleanPhone = phone.replace(/\D/g, '');

//     if (profileData?.coordinator?.mobile === cleanPhone) {
//       setPhoneExistsError("");
//       return false;
//     }

//     const validationError = validateIndianMobileNumber(cleanPhone);
//     if (validationError) {
//       setPhoneExistsError(validationError);
//       return false;
//     }

//     if (!cleanPhone || cleanPhone.length !== 10) {
//       setPhoneExistsError("");
//       return false;
//     }

//     setIsCheckingPhone(true);

//     try {
//       const exists = await sellerRegService.checkCoordinatorPhone(cleanPhone);
//       if (exists) {
//         setPhoneExistsError("⚠️ This phone number is already registered. Please use a different number.");
//         return true;
//       }
//       setPhoneExistsError("");
//       return false;
//     } catch (error: any) {
//       console.error("Error checking phone:", error);
//       if (error.response?.status !== 404) {
//         setPhoneExistsError("Failed to verify phone number. Please try again.");
//       }
//       return false;
//     } finally {
//       setIsCheckingPhone(false);
//     }
//   };

//   const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
//     const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleAlphanumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLen = 100) => {
//     const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, maxLen);
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => {
//     let value = e.target.value.replace(/\D/g, "");
//     if (maxLength && value.length > maxLength) {
//       value = value.substring(0, maxLength);
//     }
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const isPendingRequestError = (responseData: any): { isError: boolean; message: string; requestId: string } => {
//     let errorMessage = '';
//     let pendingRequestId = '';

//     if (responseData?.data?.data?.message) {
//       errorMessage = responseData.data.data.message;
//     } else if (responseData?.data?.message) {
//       errorMessage = responseData.data.message;
//     } else if (responseData?.message) {
//       errorMessage = responseData.message;
//     }

//     if (errorMessage && errorMessage.toLowerCase().includes('pending update request already exists')) {
//       const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
//       pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';
//       return { isError: true, message: errorMessage, requestId: pendingRequestId };
//     }

//     return { isError: false, message: '', requestId: '' };
//   };

//   useEffect(() => {
//     if (pendingRequestError) {
//       const timer = setTimeout(() => {
//         setPendingRequestError(null);
//       }, 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [pendingRequestError]);

//   useEffect(() => {
//     if (showInactiveError) {
//       const timer = setTimeout(() => {
//         setShowInactiveError(false);
//       }, 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [showInactiveError]);

//   const hasInactiveLicenses = (): boolean => {
//     return inactiveLicenses.length > 0;
//   };

//   const performSave = async (section: string, sectionData: any) => {
//     try {
//       const requestedBy = updateProfileService.getCurrentUserEmail();
//       if (!requestedBy) {
//         toast.error('User email not found');
//         return;
//       }

//       if (!sectionData || Object.keys(sectionData).length === 0) {
//         toast.error('No data to update');
//         setEditingSection(null);
//         return;
//       }

//       console.log(`📤 Sending ${section} update data:`, sectionData);

//       let response;

//       if (section === 'all') {
//         response = await updateProfileService.updateFullProfile(sectionData, requestedBy);
//       } else {
//         switch (section) {
//           case 'company':
//             response = await updateProfileService.updateCompanySection(sectionData, requestedBy);
//             break;
//           case 'coordinator':
//             response = await updateProfileService.updateCoordinatorSection(sectionData, requestedBy);
//             break;
//           case 'gst':
//             response = await updateProfileService.updateGSTSection(sectionData, requestedBy);
//             break;
//           case 'bank':
//             response = await updateProfileService.updateBankSection(sectionData, requestedBy);
//             break;
//           default:
//             if (section.startsWith('license-')) {
//               const index = parseInt(section.split('-')[1]);
//               const doc = profileData?.documents[index];
//               if (doc && sectionData && Object.keys(sectionData).length > 0) {
//                 response = await updateProfileService.updateLicenseSection(
//                   doc.productTypes.productTypeId,
//                   sectionData,
//                   requestedBy
//                 );
//               } else {
//                 toast.error('No license data to update');
//                 setEditingSection(null);
//                 return;
//               }
//             }
//         }
//       }

//       if (response) {
//         console.log('✅ Update successful:', response);

//         const pendingError = isPendingRequestError(response);
//         if (pendingError.isError) {
//           scrollToTop();

//           setPendingRequestError(
//             `⚠️ Update Request Already Pending\n\n` +
//             `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
//             `Please wait for admin approval before submitting new changes.\n\n` +
//             `You will be notified once your changes are approved.`
//           );
//           toast.error(
//             `⚠️ Update Request Already Pending\n\n` +
//             `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.`,
//             { duration: 8000 }
//           );
//           return;
//         }

//         if (response.message && response.message.includes('auto-approved')) {
//           toast.success(response.message);
//           scrollToTop();
//           const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
//           setProfileData(updatedProfile);
//           setSavedSection(section);
//           setShowSuccess(true);
//         } else {
//           toast.success('Changes submitted for admin review. They will appear once approved.');
//           scrollToTop();
//           setSavedSection(section);
//           setShowSuccess(true);
//         }

//         setEditingSection(null);

//         if (!response.message || !response.message.includes('auto-approved')) {
//           setReviewSections((prev) => {
//             if (!prev.includes(section)) {
//               return [...prev, section];
//             }
//             return prev;
//           });
//         }
//       }

//     } catch (error: any) {
//       console.error('❌ Error saving section:', error);
//       console.error('❌ Error response:', error.response?.data);

//       let errorMessage = '';
//       let pendingRequestId = '';

//       if (error.response?.data?.data?.data?.message) {
//         errorMessage = error.response.data.data.data.message;
//       } else if (error.response?.data?.data?.message) {
//         errorMessage = error.response.data.data.message;
//       } else if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       if (errorMessage.toLowerCase().includes('pending update request already exists')) {
//         const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
//         pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

//         scrollToTop();

//         setPendingRequestError(
//           `⚠️ Update Request Already Pending\n\n` +
//           `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
//           `Please wait for admin approval before submitting new changes.\n\n` +
//           `You will be notified once your changes are approved.`
//         );

//         toast.error(
//           `⚠️ Update Request Already Pending\n\n` +
//           `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.`,
//           { duration: 8000 }
//         );
//       } else {
//         toast.error(errorMessage || 'Failed to save changes');
//       }
//     }

//     setTimeout(() => {
//       setShowSuccess(false);
//       setSavedSection(null);
//     }, 21000);
//   };

//   const handleOtpVerified = async (verified: { email: boolean; phone: boolean }) => {
//     setShowOtpModal(false);

//     if (pendingSection && pendingSectionData) {
//       if (pendingSection === 'all' && pendingSectionData.completeData && pendingSectionData.filesToUpload) {
//         try {
//           const requestedBy = updateProfileService.getCurrentUserEmail();
//           if (!requestedBy) {
//             toast.error('User email not found');
//             return;
//           }

//           const response = await updateProfileService.updateFullProfile(
//             pendingSectionData.completeData,
//             requestedBy
//           );

//           const pendingError = isPendingRequestError(response);
//           if (pendingError.isError) {
//             scrollToTop();

//             setPendingRequestError(
//               `⚠️ Update Request Already Pending\n\n` +
//               `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
//               `Please wait for admin approval before submitting new changes.\n\n` +
//               `You will be notified once your changes are approved.`
//             );
//             toast.error(
//               `⚠️ Update Request Already Pending\n\n` +
//               `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.`,
//               { duration: 8000 }
//             );
//             return;
//           }

//           let pendingSellerId: number | null = null;
//           let isAutoApproved: boolean = false;
//           let documentsList: UpdateProfileResponse['documents'] = [];

//           if (response) {
//             if (response.message && response.message.includes('auto-approved')) {
//               isAutoApproved = true;
//             }

//             if (response.pendingSellerId) {
//               pendingSellerId = response.pendingSellerId;
//             }

//             if (response.documents && Array.isArray(response.documents)) {
//               documentsList = response.documents;
//             }
//           }

//           if (isAutoApproved || (!pendingSellerId && response && response.message)) {
//             toast.success(response.message || 'Changes applied successfully!');
//             scrollToTop();
//             const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
//             setProfileData(updatedProfile);
//             setEditingSection(null);
//             setSavedSection('all');
//             setShowSuccess(true);
//             return;
//           }

//           if (pendingSellerId) {
//             console.log('✅ OTP Flow - Step 1 complete. Pending Seller ID:', pendingSellerId);

//             const pendingDocumentIdMap = new Map<number, number>();

//             if (documentsList && Array.isArray(documentsList)) {
//               documentsList.forEach((pendingDoc: any) => {
//                 const productTypeId = pendingDoc.productTypeId || pendingDoc.productType?.productTypeId;
//                 const pendingDocId = pendingDoc.pendingSellerDocumentId || pendingDoc.id;

//                 if (productTypeId && pendingDocId) {
//                   pendingDocumentIdMap.set(productTypeId, pendingDocId);
//                   console.log(`📋 OTP Flow - Product Type ${productTypeId} → Pending Document ID: ${pendingDocId}`);
//                 }
//               });
//             }

//             const filesToUpload = pendingSectionData.filesToUpload;
//             const hasFilesToUpload = filesToUpload.gstFile || filesToUpload.bankFile || filesToUpload.companyCertFile || filesToUpload.licenses.length > 0;

//             if (hasFilesToUpload) {
//               console.log('📤 OTP Flow - Step 2: Uploading documents...');

//               const licensesWithIds = filesToUpload.licenses.map((license: any) => {
//                 const pendingDocumentId = pendingDocumentIdMap.get(license.productTypeId);
//                 if (!pendingDocumentId) {
//                   console.warn(`⚠️ OTP Flow - No pending document ID found for product type ${license.productTypeId}`);
//                 }
//                 return {
//                   file: license.file,
//                   licenseName: license.productName,
//                   documentId: pendingDocumentId
//                 };
//               });

//               await uploadSellerDocuments(pendingSellerId, {
//                 gstFile: filesToUpload.gstFile || undefined,
//                 bankFile: filesToUpload.bankFile || undefined,
//                 companyRegistrationCertificate: filesToUpload.companyCertFile || undefined,
//                 licenses: licensesWithIds
//               });

//               console.log('✅ OTP Flow - Document upload successful');
//             }

//             toast.success('Changes submitted for admin review.');
//             scrollToTop();
//             setEditingSection(null);

//             const sectionsToMark = ['company', 'coordinator', 'gst', 'bank'];
//             formData.productTypes.forEach((_, index) => {
//               sectionsToMark.push(`license-${index}`);
//             });

//             setReviewSections((prev) => {
//               const newSections = [...prev];
//               sectionsToMark.forEach(section => {
//                 if (!newSections.includes(section)) {
//                   newSections.push(section);
//                 }
//               });
//               return newSections;
//             });

//             setSavedSection('all');
//             setShowSuccess(true);

//             setFormData(prev => ({
//               ...prev,
//               gstFile: null,
//               companyRegistrationCertificateFile: null,
//               cancelledChequeFile: null,
//               licenses: Object.fromEntries(
//                 Object.entries(prev.licenses).map(([key, value]: [string, any]) => [key, { ...value, file: null }])
//               )
//             }));

//             setChangedFiles({
//               gstFile: null,
//               companyCertFile: null,
//               bankFile: null,
//               licenses: []
//             });

//           } else {
//             throw new Error('No pendingSellerId received from server');
//           }

//         } catch (error: any) {
//           console.error('❌ Error in OTP flow:', error);

//           let errorMessage = '';
//           let pendingRequestId = '';

//           if (error.response?.data?.data?.data?.message) {
//             errorMessage = error.response.data.data.data.message;
//           } else if (error.response?.data?.data?.message) {
//             errorMessage = error.response.data.data.message;
//           } else if (error.response?.data?.message) {
//             errorMessage = error.response.data.message;
//           } else if (error.message) {
//             errorMessage = error.message;
//           }

//           if (errorMessage.toLowerCase().includes('pending update request already exists')) {
//             const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
//             pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

//             scrollToTop();

//             setPendingRequestError(
//               `⚠️ Update Request Already Pending\n\n` +
//               `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
//               `Please wait for admin approval before submitting new changes.\n\n` +
//               `You will be notified once your changes are approved.`
//             );

//             toast.error(
//               `⚠️ Update Request Already Pending\n\n` +
//               `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.`,
//               { duration: 8000 }
//             );
//           } else {
//             toast.error(errorMessage || 'Failed to submit changes');
//           }
//         }
//       } else {
//         await performSave(pendingSection, pendingSectionData);
//       }
//     }

//     setPendingEmail(undefined);
//     setPendingPhone(undefined);
//     setPendingSectionData(null);
//     setPendingSection(null);
//   };

//   const validateAllFields = (): boolean => {
//     // Validate Seller Name
//     if (editingSection && !sellerNameError && formData.sellerName) {
//       const error = validateSellerName(formData.sellerName);
//       if (error) {
//         setSellerNameError(error);
//         scrollToError('seller-name');
//         return false;
//       }
//     }

//     // Validate City
//     if (editingSection && !cityError && formData.city) {
//       const error = validateCity(formData.city);
//       if (error) {
//         setCityError(error);
//         return false;
//       }
//     }

//     // Validate Street
//     if (editingSection && !streetError && formData.street) {
//       const error = validateStreet(formData.street);
//       if (error) {
//         setStreetError(error);
//         return false;
//       }
//     }

//     // Validate Building No
//     if (editingSection && !buildingNoError && formData.buildingNo) {
//       const error = validateBuildingNo(formData.buildingNo);
//       if (error) {
//         setBuildingNoError(error);
//         return false;
//       }
//     }

//     // Validate Pincode
//     if (editingSection && !pincodeError && formData.pincode) {
//       const error = validatePincode(formData.pincode);
//       if (error) {
//         setPincodeError(error);
//         return false;
//       }
//     }

//     // Validate Coordinator fields
//     if (editingSection && formData.coordinatorName) {
//       const error = validateCoordinatorName(formData.coordinatorName);
//       if (error) {
//         setCoordinatorNameError(error);
//         scrollToError('coordinator');
//         return false;
//       }
//     }

//     if (editingSection && formData.coordinatorDesignation) {
//       const error = validateCoordinatorDesignation(formData.coordinatorDesignation);
//       if (error) {
//         setCoordinatorDesignationError(error);
//         scrollToError('coordinator');
//         return false;
//       }
//     }

//     if (editingSection && formData.coordinatorEmail) {
//       const error = validateCoordinatorEmail(formData.coordinatorEmail);
//       if (error) {
//         setCoordinatorEmailError(error);
//         scrollToError('email');
//         return false;
//       }
//     }

//     // Validate GST Number
//     if (editingSection && formData.gstNumber) {
//       const error = validateGSTNumber(formData.gstNumber);
//       if (error) {
//         setGstNumberError(error);
//         scrollToError('gst');
//         return false;
//       }
//     }

//     // Validate Bank fields
//     if (editingSection && formData.accountNumber) {
//       const error = validateAccountNumber(formData.accountNumber);
//       if (error) {
//         setAccountNumberError(error);
//         return false;
//       }
//     }

//     if (editingSection && formData.accountHolderName) {
//       const error = validateAccountHolderName(formData.accountHolderName);
//       if (error) {
//         setAccountHolderNameError(error);
//         return false;
//       }
//     }

//     if (editingSection && formData.ifscCode) {
//       const error = validateIFSC(formData.ifscCode);
//       if (error) {
//         setIfscValidationError(error);
//         return false;
//       }
//     }

//     // Validate Account Number match
//     if (editingSection && formData.accountNumber && formData.confirmAccountNumber) {
//       if (formData.accountNumber !== formData.confirmAccountNumber) {
//         toast.error("Account number and confirm account number do not match");
//         return false;
//       }
//     }

//     // Validate Licenses
//     for (const productName of formData.productTypes) {
//       const licenseData = formData.licenses[productName];
//       if (licenseData) {
//         // Validate License Number
//         if (!licenseData.number || licenseData.number.trim() === "") {
//           setLicenseErrors(prev => ({ ...prev, [productName]: "License number is required" }));
//           scrollToError('empty-license', productName);
//           return false;
//         }

//         // Validate Issuing Authority
//         if (!licenseData.issuingAuthority || licenseData.issuingAuthority.trim() === "") {
//           setLicenseIssuingAuthorityErrors(prev => ({ ...prev, [productName]: "Issuing authority is required" }));
//           scrollToError('license-format', productName);
//           return false;
//         }

//         // Validate Dates
//         if (!licenseData.issueDate) {
//           setLicenseDateErrors(prev => ({ ...prev, [productName]: { ...prev[productName], issue: "Issue date is required" } }));
//           scrollToError('license-format', productName);
//           return false;
//         }
//         if (!licenseData.expiryDate) {
//           setLicenseDateErrors(prev => ({ ...prev, [productName]: { ...prev[productName], expiry: "Expiry date is required" } }));
//           scrollToError('license-format', productName);
//           return false;
//         }
//       }
//     }
//     // NEW: Check if seller name changed and required documents are missing
//     const isSellerNameChanged = profileData && formData.sellerName !== profileData.sellerName;

//     if (isSellerNameChanged && editingSection) {
//       const missingDocs = [];

//       if (!formData.companyRegistrationCertificateFile &&
//         (!formData.companyRegistrationCertificateUrl || formData.companyRegistrationCertificateUrl === "PENDING")) {
//         missingDocs.push("Company Registration Certificate");
//       }
//       if (!formData.gstFile &&
//         (!formData.gstFileUrl || formData.gstFileUrl === "PENDING")) {
//         missingDocs.push("GST Certificate");
//       }
//       const hasLicenseFile = Object.values(formData.licenses).some(license => license.file);
//       const hasLicenseUrl = Object.values(formData.licenses).some(license => license.fileUrl && license.fileUrl !== "PENDING");
//       if (!hasLicenseFile && !hasLicenseUrl) {
//         missingDocs.push("Drug/Relevant License(s)");
//       }
//       if (!formData.cancelledChequeFile &&
//         (!formData.cancelledChequeFileUrl || formData.cancelledChequeFileUrl === "PENDING")) {
//         missingDocs.push("Bank Proof");
//       }

//       if (missingDocs.length > 0) {
//         toast.error(`Seller name change requires: ${missingDocs.join(", ")}`);
//         scrollToError('seller-name');
//         return false;
//       }
//     }

//     return true;
//   };

//   // Replace validateGSTNumber function
//   const validateGSTNumber = (value: string): string | null => {
//     if (!value || value.trim() === "") {
//       return "GST number is required";
//     }
//     if (value.length !== 15) {
//       return "GST number must be 15 characters";
//     }
//     // Exact GST pattern from registration
//     const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
//     if (!gstRegex.test(value)) {
//       return "Invalid GST number format (e.g., 22AAAAA0000A1Z)";
//     }
//     return null;
//   };
//   const handleSaveAll = async () => {
//     setIsSubmitting(true);
//     setPendingRequestError(null);

//     // Run all validations first
//     if (!validateAllFields()) {
//       setIsSubmitting(false);
//       return;
//     }

//     // DEBUG: Log to see if seller name changed
//     console.log("=== SELLER NAME CHANGE DEBUG ===");
//     console.log("profileData?.sellerName:", profileData?.sellerName);
//     console.log("formData.sellerName:", formData.sellerName);
//     console.log("sellerNameChanged state:", sellerNameChanged);

//     // Check if seller name has changed from original profile data
//     const isSellerNameChanged = profileData && formData.sellerName !== profileData.sellerName;
//     console.log("isSellerNameChanged calculated:", isSellerNameChanged);

//     // Seller name change document validation
//     // In handleSaveAll, replace the seller name change validation with:
//     // In handleSaveAll, replace the seller name change validation with:
//     if (isSellerNameChanged) {
//       const missingDocuments: string[] = [];

//       // Reset error states
//       setCompanyCertError(false);
//       setGSTCertError(false);
//       setLicenseCertError(false);
//       setBankCertError(false);

//       // Check for NEW Company Registration Certificate upload
//       if (!formData.companyRegistrationCertificateFile) {
//         missingDocuments.push("Company Registration Certificate (Please upload a NEW certificate)");
//         setCompanyCertError(true);
//         console.log("Missing: Company Registration Certificate");
//       } else {
//         console.log("Company Registration Certificate file present:", formData.companyRegistrationCertificateFile.name);
//       }

//       // Check for NEW GST Certificate upload
//       if (!formData.gstFile) {
//         missingDocuments.push("GST Certificate (Please upload a NEW certificate)");
//         setGSTCertError(true);
//         console.log("Missing: GST Certificate");
//       } else {
//         console.log("GST Certificate file present:", formData.gstFile.name);
//       }

//       // Check for NEW License Copies upload
//       const hasNewLicenseFile = Object.values(formData.licenses).some(license => license.file);
//       console.log("Has new license file:", hasNewLicenseFile);
//       if (!hasNewLicenseFile) {
//         missingDocuments.push("Drug/Relevant License(s) (Please upload NEW license copies)");
//         setLicenseCertError(true);
//         console.log("Missing: License files");
//       } else {
//         console.log("License files present");
//       }

//       // Check for NEW Bank Document upload
//       if (!formData.cancelledChequeFile) {
//         missingDocuments.push("Bank Proof (Please upload a NEW cancelled cheque/passbook)");
//         setBankCertError(true);
//         console.log("Missing: Bank file");
//       } else {
//         console.log("Bank file present:", formData.cancelledChequeFile.name);
//       }

//       console.log("Missing documents count:", missingDocuments.length);
//       console.log("Missing documents:", missingDocuments);

//       if (missingDocuments.length > 0) {
//         toast.error(
//           `⚠️ Seller name change requires NEW documents:\n\n• ${missingDocuments.join("\n• ")}`,
//           { duration: 10000 }
//         );
//         scrollToError('seller-name');
//         setIsSubmitting(false);
//         return;
//       }
//     }

//     // Check for license existence errors - SCROLL TO ERROR
//     const hasLicenseExistsError = Object.values(licenseExistsError).some(error => error !== "");
//     const hasLicenseFormatError = Object.values(licenseErrors).some(error => error !== "");

//     if (hasLicenseExistsError) {
//       const errorProductName = Object.entries(licenseExistsError).find(([_, error]) => error !== "")?.[0];
//       if (errorProductName) {
//         scrollToError('license-exists', errorProductName);
//       } else {
//         scrollToTop();
//       }
//       setIsSubmitting(false);
//       return;
//     }

//     if (hasLicenseFormatError) {
//       const errorProductName = Object.entries(licenseErrors).find(([_, error]) => error !== "")?.[0];
//       if (errorProductName) {
//         scrollToError('license-format', errorProductName);
//       } else {
//         scrollToTop();
//       }
//       setIsSubmitting(false);
//       return;
//     }

//     if (hasInactiveLicenses()) {
//       setShowInactiveError(true);
//       scrollToError('inactive-license');
//       setIsSubmitting(false);
//       return;
//     }

//     // Check for GST existence error
//     if (gstExistsError) {
//       scrollToError('gst');
//       setIsSubmitting(false);
//       return;
//     }

//     // Check for email existence error
//     if (emailExistsError) {
//       scrollToError('email');
//       setIsSubmitting(false);
//       return;
//     }

//     // Check for phone existence error
//     if (phoneExistsError) {
//       scrollToError('phone');
//       setIsSubmitting(false);
//       return;
//     }

//     // Check for empty license numbers
//     const hasEmptyLicenseNumbers = Object.entries(formData.licenses).some(([productName, licenseData]: [string, any]) => {
//       const isProductSelected = formData.productTypeIds.includes(licenseData.productTypeId);
//       if (isProductSelected && (!licenseData.number || licenseData.number.trim() === "")) {
//         return true;
//       }
//       return false;
//     });

//     if (hasEmptyLicenseNumbers) {
//       const emptyProductName = Object.entries(formData.licenses).find(([productName, licenseData]: [string, any]) => {
//         const isProductSelected = formData.productTypeIds.includes(licenseData.productTypeId);
//         return isProductSelected && (!licenseData.number || licenseData.number.trim() === "");
//       })?.[0];
//       if (emptyProductName) {
//         scrollToError('empty-license', emptyProductName);
//       } else {
//         scrollToTop();
//       }
//       setIsSubmitting(false);
//       return;
//     }

//     const companyPhoneValidationError = validateIndianMobileNumber(formData.phone);
//     const coordinatorPhoneValidationError = validateIndianMobileNumber(formData.coordinatorMobile);

//     if (companyPhoneValidationError) {
//       setCompanyPhoneError(companyPhoneValidationError);
//       scrollToTop();
//       setIsSubmitting(false);
//       return;
//     }

//     if (coordinatorPhoneValidationError) {
//       setCoordinatorPhoneError(coordinatorPhoneValidationError);
//       scrollToTop();
//       setIsSubmitting(false);
//       return;
//     }

//     if (formData.coordinatorEmail && !emailExistsError && profileData?.coordinator?.email !== formData.coordinatorEmail) {
//       const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail);
//       if (isValidEmail) {
//         const exists = await checkCoordinatorEmailExists(formData.coordinatorEmail);
//         if (exists) {
//           scrollToError('email');
//           setIsSubmitting(false);
//           return;
//         }
//       }
//     }

//     if (formData.coordinatorMobile && !phoneExistsError && !coordinatorPhoneError && profileData?.coordinator?.mobile !== formData.coordinatorMobile) {
//       const exists = await checkCoordinatorPhoneExists(formData.coordinatorMobile);
//       if (exists) {
//         scrollToError('phone');
//         setIsSubmitting(false);
//         return;
//       }
//     }

//     // Check if account number and confirm account number match
//     if (formData.accountNumber !== formData.confirmAccountNumber) {
//       toast.error("Account number and confirm account number do not match");
//       scrollToTop();
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       let needsEmailVerification = false;
//       let needsPhoneVerification = false;
//       let newEmail = '';
//       let newPhone = '';

//       const formatDate = (date: Date | null | string): string => {
//         if (!date) return '';
//         if (typeof date === 'string') return date;
//         const d = new Date(date);
//         const year = d.getFullYear();
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//       };

//       const filesToUpload = {
//         gstFile: null as File | null,
//         bankFile: null as File | null,
//         companyCertFile: null as File | null,
//         licenses: [] as Array<{
//           productName: string;
//           productTypeId: number;
//           file: File;
//         }>
//       };

//       if (formData.gstFile) {
//         filesToUpload.gstFile = formData.gstFile;
//       }

//       if (formData.companyRegistrationCertificateFile) {
//         filesToUpload.companyCertFile = formData.companyRegistrationCertificateFile;
//       }

//       if (formData.cancelledChequeFile) {
//         filesToUpload.bankFile = formData.cancelledChequeFile;
//       }

//       const currentDocs = profileData?.documents || [];
//       const selectedProductTypeIds = new Set(formData.productTypeIds);

//       const documentsToSend = [];
//       const processedProductTypeIds = new Set<number>();

//       for (const existingDoc of currentDocs) {
//         const productTypeId = existingDoc.productTypes?.productTypeId;
//         const productName = existingDoc.productTypes?.productTypeName;

//         if (!productTypeId || !productName) {
//           console.warn('⚠️ Skipping document with missing product info:', existingDoc);
//           continue;
//         }

//         if (selectedProductTypeIds.has(productTypeId)) {
//           const licenseData = formData.licenses[productName] || {};

//           if (licenseData.file) {
//             filesToUpload.licenses.push({
//               productName: productName,
//               productTypeId: productTypeId,
//               file: licenseData.file
//             });
//           }

//           const documentFileUrl = licenseData.fileUrl === "PENDING" ? "PENDING" : (existingDoc.documentFileUrl || '');

//           documentsToSend.push({
//             documentId: existingDoc.sellerDocumentsId,
//             productTypeId: productTypeId,
//             documentNumber: licenseData.number || existingDoc.documentNumber || '',
//             documentFileUrl: documentFileUrl,
//             licenseIssueDate: licenseData.issueDate
//               ? formatDate(licenseData.issueDate)
//               : existingDoc.licenseIssueDate || '',
//             licenseExpiryDate: licenseData.expiryDate
//               ? formatDate(licenseData.expiryDate)
//               : existingDoc.licenseExpiryDate || '',
//             licenseIssuingAuthority: licenseData.issuingAuthority || existingDoc.licenseIssuingAuthority || '',
//             licenseStatus: licenseData.status || existingDoc.licenseStatus || 'InActive'
//           });

//           processedProductTypeIds.add(productTypeId);
//         } else {
//           console.log(`🗑️ Document for product ${productTypeId} will be REMOVED`);
//         }
//       }

//       Object.entries(formData.licenses).forEach(([productName, licenseData]: [string, any]) => {
//         const productType = productTypes.find(pt => pt.productTypeName === productName);
//         if (!productType) return;

//         if (selectedProductTypeIds.has(productType.productTypeId) &&
//           !processedProductTypeIds.has(productType.productTypeId)) {

//           if (licenseData.file) {
//             filesToUpload.licenses.push({
//               productName: productName,
//               productTypeId: productType.productTypeId,
//               file: licenseData.file
//             });
//           }

//           const hasData = licenseData.number ||
//             licenseData.issueDate ||
//             licenseData.expiryDate ||
//             licenseData.issuingAuthority;

//           if (hasData) {
//             const documentFileUrl = licenseData.fileUrl === "PENDING" ? "PENDING" : '';

//             documentsToSend.push({
//               productTypeId: productType.productTypeId,
//               documentNumber: licenseData.number || '',
//               documentFileUrl: documentFileUrl,
//               licenseIssueDate: licenseData.issueDate ? formatDate(licenseData.issueDate) : '',
//               licenseExpiryDate: licenseData.expiryDate ? formatDate(licenseData.expiryDate) : '',
//               licenseIssuingAuthority: licenseData.issuingAuthority || '',
//               licenseStatus: licenseData.status || 'InActive'
//             });

//             processedProductTypeIds.add(productType.productTypeId);
//           }
//         }
//       });

//       const allProductTypeIds = Array.from(selectedProductTypeIds);

//       const completeData: UpdateSellerProfileRequest = {
//         sellerName: formData.sellerName,
//         companyTypeId: formData.companyTypeId,
//         sellerTypeId: formData.sellerTypeId,
//         productTypeId: allProductTypeIds,
//         phone: formData.phone,
//         email: formData.email,
//         website: formData.website || '',
//         termsAccepted: profileData?.termsAccepted || true,

//         address: {
//           stateId: formData.stateId,
//           districtId: formData.districtId,
//           talukaId: formData.talukaId,
//           city: formData.city,
//           street: formData.street,
//           buildingNo: formData.buildingNo,
//           landmark: formData.landmark || '',
//           pinCode: formData.pincode,
//         },

//         coordinator: {
//           name: formData.coordinatorName,
//           designation: formData.coordinatorDesignation,
//           email: formData.coordinatorEmail,
//           mobile: formData.coordinatorMobile
//         },

//         bankDetails: {
//           bankName: formData.bankName,
//           branch: formData.branch,
//           ifscCode: formData.ifscCode,
//           accountNumber: formData.accountNumber,
//           accountHolderName: formData.accountHolderName,
//           bankDocumentFileUrl: formData.cancelledChequeFileUrl === "PENDING" ? "PENDING" : (profileData?.bankDetails?.bankDocumentFileUrl || '')
//         },

//         gstNumber: formData.gstNumber,
//         gstFileUrl: formData.gstFileUrl === "PENDING" ? "PENDING" : (profileData?.sellerGST?.gstFileUrl || ''),
//         companyRegistrationCertificateUrl: formData.companyRegistrationCertificateUrl === "PENDING" ? "PENDING" : (profileData?.companyRegistrationCertificateUrl || ''),

//         documents: documentsToSend
//       };

//       const validationResult = validateSection('company', completeData);
//       if (!validationResult.success) {
//         toast.error(validationResult.error || 'Validation failed');
//         return;
//       }

//       if (profileData?.coordinator) {
//         if (formData.coordinatorEmail !== profileData.coordinator.email) {
//           needsEmailVerification = true;
//           newEmail = formData.coordinatorEmail;
//         }
//         if (formData.coordinatorMobile !== profileData.coordinator.mobile) {
//           needsPhoneVerification = true;
//           newPhone = formData.coordinatorMobile;
//         }
//       }

//       if (needsEmailVerification || needsPhoneVerification) {
//         if (needsEmailVerification && newEmail) {
//           const emailExists = await checkCoordinatorEmailExists(newEmail);
//           if (emailExists) {
//             scrollToError('email');
//             return;
//           }
//         }
//         if (needsPhoneVerification && newPhone) {
//           const phoneExists = await checkCoordinatorPhoneExists(newPhone);
//           if (phoneExists) {
//             scrollToError('phone');
//             return;
//           }
//         }

//         setPendingEmail(needsEmailVerification ? newEmail : undefined);
//         setPendingPhone(needsPhoneVerification ? newPhone : undefined);
//         setPendingSectionData({ completeData, filesToUpload });
//         setPendingSection('all');
//         setShowOtpModal(true);
//         setIsSubmitting(false);
//         return;
//       }

//       console.log('💾 Sending JSON data...');

//       const requestedBy = updateProfileService.getCurrentUserEmail();
//       if (!requestedBy) {
//         toast.error('User email not found');
//         return;
//       }

//       const response = await updateProfileService.updateFullProfile(completeData, requestedBy);

//       const pendingError = isPendingRequestError(response);
//       if (pendingError.isError) {
//         scrollToTop();

//         setPendingRequestError(
//           `⚠️ Update Request Already Pending\n\n` +
//           `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
//           `Please wait for admin approval before submitting new changes.\n\n` +
//           `You will be notified once your changes are approved.`
//         );
//         setIsSubmitting(false);
//         return;
//       }

//       let pendingSellerId: number | null = null;
//       let isAutoApproved: boolean = false;
//       let documentsList: UpdateProfileResponse['documents'] = [];

//       if (response) {
//         if (response.message && response.message.includes('auto-approved')) {
//           isAutoApproved = true;
//         }

//         if (response.pendingSellerId) {
//           pendingSellerId = response.pendingSellerId;
//         }

//         if (response.documents && Array.isArray(response.documents)) {
//           documentsList = response.documents;
//         }
//       }

//       if ((isAutoApproved || (!pendingSellerId && response && response.message)) && !hasDocumentChanges) {
//         toast.success(response.message || 'Changes applied successfully!');
//         scrollToTop();

//         const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
//         setProfileData(updatedProfile);

//         if (updatedProfile) {
//           const updatedLicenses: Record<string, any> = {};
//           updatedProfile.documents.forEach((doc: SellerDocument) => {
//             const productName = doc.productTypes?.productTypeName;
//             if (productName) {
//               const issueDate = doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null;
//               const expiryDate = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
//               const calculatedStatus = calculateLicenseStatus(issueDate, expiryDate);

//               updatedLicenses[productName] = {
//                 documentId: doc.sellerDocumentsId,
//                 number: doc.documentNumber || "",
//                 file: null,
//                 fileUrl: doc.documentFileUrl || "",
//                 issueDate: issueDate,
//                 expiryDate: expiryDate,
//                 issuingAuthority: doc.licenseIssuingAuthority || "",
//                 status: calculatedStatus,
//                 productTypeId: doc.productTypes?.productTypeId || 0
//               };
//             }
//           });

//           setFormData(prev => ({
//             ...prev,
//             sellerName: updatedProfile.sellerName,
//             companyTypeId: updatedProfile.companyType?.companyTypeId || 0,
//             companyType: updatedProfile.companyType?.companyTypeName || '',
//             sellerTypeId: updatedProfile.sellerType?.sellerTypeId || 0,
//             sellerType: updatedProfile.sellerType?.sellerTypeName || '',
//             productTypeIds: updatedProfile.productTypes.map(pt => pt.productTypeId),
//             productTypes: updatedProfile.productTypes.map(pt => pt.productTypeName),
//             phone: updatedProfile.phone,
//             email: updatedProfile.email,
//             website: updatedProfile.website || '',
//             coordinatorName: updatedProfile.coordinator?.name || '',
//             coordinatorDesignation: updatedProfile.coordinator?.designation || '',
//             coordinatorEmail: updatedProfile.coordinator?.email || '',
//             coordinatorMobile: updatedProfile.coordinator?.mobile || '',
//             gstNumber: updatedProfile.sellerGST?.gstNumber || '',
//             gstFileUrl: updatedProfile.sellerGST?.gstFileUrl || '',
//             companyRegistrationCertificateUrl: updatedProfile.companyRegistrationCertificateUrl || '',
//             bankName: updatedProfile.bankDetails?.bankName || '',
//             branch: updatedProfile.bankDetails?.branch || '',
//             ifscCode: updatedProfile.bankDetails?.ifscCode || '',
//             accountNumber: updatedProfile.bankDetails?.accountNumber || '',
//             accountHolderName: updatedProfile.bankDetails?.accountHolderName || '',
//             cancelledChequeFileUrl: updatedProfile.bankDetails?.bankDocumentFileUrl || '',
//             licenses: updatedLicenses,
//           }));
//         }

//         setEditingSection(null);
//         setSavedSection('all');
//         setShowSuccess(true);
//         setHasDocumentChanges(false);
//         setSellerNameChanged(false);
//         // Reset document error states
//         setCompanyCertError(false);
//         setGSTCertError(false);
//         setLicenseCertError(false);
//         setBankCertError(false);

//         setTimeout(() => {
//           setShowSuccess(false);
//           setSavedSection(null);
//         }, 5000);

//         setIsSubmitting(false);
//         return;
//       }

//       if (pendingSellerId || hasDocumentChanges) {
//         if (!pendingSellerId) {
//           console.error('❌ No pendingSellerId found but document changes exist');
//           toast.error('Unable to process document changes. Please contact support.');
//           setIsSubmitting(false);
//           return;
//         }

//         const pendingDocumentIdMap = new Map<number, number>();

//         if (documentsList && Array.isArray(documentsList)) {
//           documentsList.forEach((pendingDoc: any) => {
//             const productTypeId = pendingDoc.productTypeId || pendingDoc.productType?.productTypeId;
//             const pendingDocId = pendingDoc.pendingSellerDocumentId || pendingDoc.id;

//             if (productTypeId && pendingDocId) {
//               pendingDocumentIdMap.set(productTypeId, pendingDocId);
//             }
//           });
//         }

//         const hasFilesToUpload = filesToUpload.gstFile || filesToUpload.bankFile || filesToUpload.companyCertFile || filesToUpload.licenses.length > 0;

//         if (hasFilesToUpload) {
//           try {
//             console.log("=== PREPARING DOCUMENT UPLOAD ===");
//             console.log("GST File:", filesToUpload.gstFile?.name, filesToUpload.gstFile?.size);
//             console.log("Bank File:", filesToUpload.bankFile?.name, filesToUpload.bankFile?.size);
//             console.log("Company Cert File:", filesToUpload.companyCertFile?.name, filesToUpload.companyCertFile?.size);
//             console.log("Licenses:", filesToUpload.licenses.map(l => ({ name: l.productName, file: l.file?.name, size: l.file?.size })));

//             const licensesWithIds = filesToUpload.licenses.map(license => {
//               const pendingDocumentId = pendingDocumentIdMap.get(license.productTypeId);
//               console.log(`License ${license.productName} (ProductTypeId: ${license.productTypeId}) -> PendingDocumentId: ${pendingDocumentId}`);
//               if (!pendingDocumentId) {
//                 console.warn(`⚠️ No pending document ID found for product type ${license.productTypeId}`);
//               }
//               return {
//                 file: license.file,
//                 licenseName: license.productName,
//                 documentId: pendingDocumentId
//               };
//             });

//             await uploadSellerDocuments(pendingSellerId, {
//               gstFile: filesToUpload.gstFile || undefined,
//               bankFile: filesToUpload.bankFile || undefined,
//               companyRegistrationCertificate: filesToUpload.companyCertFile || undefined,
//               licenses: licensesWithIds
//             });
//             toast.success('Changes submitted for admin review.');
//             scrollToTop();

//           } catch (uploadError: any) {
//             console.error('❌ Upload failed, full error:', uploadError);
//             console.error('❌ Error response data:', uploadError.response?.data);
//             console.error('❌ Error status:', uploadError.response?.status);
//             console.error('❌ Error headers:', uploadError.response?.headers);
//             console.error('❌ Upload failed, rolling back...', uploadError);
//             await deleteUpdateRequest(pendingSellerId);
//             toast.error(uploadError.message || 'File upload failed. Changes have been rolled back. Please try again.');
//             setIsSubmitting(false);
//             return;
//           }
//         } else {
//           toast.success('Changes submitted for admin review.');
//           scrollToTop();
//         }

//         setEditingSection(null);

//         const sectionsToMark = ['company', 'coordinator', 'gst', 'bank'];
//         formData.productTypes.forEach((_, index) => {
//           sectionsToMark.push(`license-${index}`);
//         });

//         setReviewSections((prev) => {
//           const newSections = [...prev];
//           sectionsToMark.forEach(section => {
//             if (!newSections.includes(section)) {
//               newSections.push(section);
//             }
//           });
//           return newSections;
//         });

//         setSavedSection('all');
//         setShowSuccess(true);
//         setSellerNameChanged(false);
//         // Reset document error states
//         setCompanyCertError(false);
//         setGSTCertError(false);
//         setLicenseCertError(false);
//         setBankCertError(false);

//         setFormData(prev => ({
//           ...prev,
//           gstFile: null,
//           companyRegistrationCertificateFile: null,
//           cancelledChequeFile: null,
//           licenses: Object.fromEntries(
//             Object.entries(prev.licenses).map(([key, value]: [string, any]) => [key, { ...value, file: null }])
//           )
//         }));

//         setChangedFiles({
//           gstFile: null,
//           companyCertFile: null,
//           bankFile: null,
//           licenses: []
//         });

//         setHasDocumentChanges(false);
//         setIsSubmitting(false);

//       } else {
//         console.error('❌ Unexpected response structure:', response);
//         toast.error('Unexpected server response. Please contact support.');
//         setIsSubmitting(false);
//         return;
//       }

//     } catch (error: any) {
//       console.error('❌ Error in handleSaveAll:', error);
//       console.error('❌ Error response:', error.response?.data);

//       let errorMessage = '';
//       let pendingRequestId = '';

//       if (error.response?.data) {
//         if (error.response.data.data?.data?.message) {
//           errorMessage = error.response.data.data.data.message;
//         } else if (error.response.data.data?.message) {
//           errorMessage = error.response.data.data.message;
//         } else if (error.response.data.message) {
//           errorMessage = error.response.data.message;
//         }
//       }

//       if (!errorMessage && error.message) {
//         errorMessage = error.message;
//       }

//       if (errorMessage.toLowerCase().includes('pending update request already exists')) {
//         const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
//         pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';

//         scrollToTop();

//         setPendingRequestError(
//           `⚠️ Update Request Already Pending\n\n` +
//           `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
//           `Please wait for admin approval before submitting new changes.\n\n` +
//           `You will be notified once your changes are approved.`
//         );
//       } else if (error.response?.status === 400) {
//         const errorData = error.response.data;
//         if (errorData.errors) {
//           Object.entries(errorData.errors).forEach(([field, message]) => {
//             toast.error(`${field}: ${message}`);
//           });
//         } else {
//           toast.error(errorData.message || 'Validation failed');
//         }
//       } else if (error.response?.status === 409) {
//         toast.error('Document with this number already exists');
//       } else {
//         toast.error(errorMessage || 'Failed to save changes');
//       }
//       setIsSubmitting(false);
//     }
//   };
//   const handleDownload = async (fileUrl: string, fileName: string) => {
//     if (fileUrl === "PENDING") {
//       toast.error('File is pending upload. Please wait for admin approval.');
//       return;
//     }

//     try {
//       toast.loading('Downloading...', { id: 'download' });

//       const response = await fetch(fileUrl, {
//         mode: 'cors',
//         credentials: 'omit',
//       });

//       if (!response.ok) {
//         throw new Error('Download failed');
//       }

//       const blob = await response.blob();
//       const blobUrl = window.URL.createObjectURL(blob);

//       const link = document.createElement('a');
//       link.href = blobUrl;
//       link.download = fileName;

//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       window.URL.revokeObjectURL(blobUrl);

//       toast.success('Download complete!', { id: 'download' });

//     } catch (error) {
//       console.error('Download failed:', error);
//       toast.error('Failed to download file. Please try again.', { id: 'download' });
//       window.open(fileUrl, '_blank', 'noopener,noreferrer');
//     }
//   };

//   const handleViewInNewTab = (fileUrl: string) => {
//     if (fileUrl === "PENDING") {
//       toast.error('File is pending upload. Please wait for admin approval.');
//       return;
//     }
//     window.open(fileUrl, '_blank', 'noopener,noreferrer');
//   };

//   if (isLoading) {
//     return (
//       <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
//         <div className="animate-pulse space-y-6">
//           <div className="h-64 bg-sneutral-100 rounded-md"></div>
//           <div className="h-48 bg-sneutral-100 rounded-md"></div>
//           <div className="h-56 bg-sneutral-100 rounded-md"></div>
//           <div className="h-40 bg-sneutral-100 rounded-md"></div>
//           <div className="h-40 bg-sneutral-100 rounded-md"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !profileData) {
//     return (
//       <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
//         <div className="bg-warning-50 border border-warning-200 rounded-md p-6 text-center">
//           <p className="text-warning-600 mb-4">{error || 'Failed to load profile'}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="bg-primary-900 text-base-white px-4 py-2 rounded-md hover:bg-primary-800"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const companyTypeOptions = companyTypes.map(type => ({
//     value: type.companyTypeId.toString(),
//     label: type.companyTypeName
//   }));

//   const sellerTypeOptions = sellerTypes.map(type => ({
//     value: type.sellerTypeId.toString(),
//     label: type.sellerTypeName
//   }));

//   const stateOptions = states.map(state => ({
//     value: state.stateId.toString(),
//     label: state.stateName
//   }));

//   const districtOptions = districts.map(district => ({
//     value: district.districtId.toString(),
//     label: district.districtName
//   }));

//   const talukaOptions = talukas.map(taluka => ({
//     value: taluka.talukaId.toString(),
//     label: taluka.talukaName
//   }));


//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <div className="bg-pneutral-50 min-h-screen w-full p-6 space-y-6">
//         {pendingRequestError && (
//           <div className="bg-warning-50 border-l-4 border-warning-500 p-4 rounded-md flex gap-2">
//             <div className="flex-shrink-0">
//               <svg className="h-5 w-5 text-warning-500" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-h6 font-heading font-medium text-warning-800">Update Request Already Pending</p>
//               <p className="text-p3 text-warning-700 whitespace-pre-line">{pendingRequestError}</p>
//             </div>
//             <button
//               onClick={() => setPendingRequestError(null)}
//               className="ml-auto text-warning-500 hover:text-warning-700"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         {showInactiveError && inactiveLicenses.length > 0 && (
//           <div className="p-4 bg-warning-50 border border-warning-300 rounded-md flex items-start gap-3">
//             <span className="text-warning-500 text-xl mt-0.5">🚫</span>
//             <div>
//               <p className="text-warning-700 font-semibold">
//                 Inactive/Expired license{inactiveLicenses.length > 1 ? "s" : ""} detected — cannot submit
//               </p>
//               <p className="text-warning-600 text-p3 mt-1">
//                 The following license{inactiveLicenses.length > 1 ? "s are" : " is"} inactive/expired. Please provide a valid, active license before submitting:
//               </p>
//               <ul className="mt-2 space-y-1">
//                 {inactiveLicenses.map((productName) => (
//                   <li key={productName} className="text-warning-600 text-p3 font-medium flex items-center gap-1">
//                     <span>•</span>
//                     <span>{productName} License</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//             <button
//               onClick={() => setShowInactiveError(false)}
//               className="ml-auto text-warning-500 hover:text-warning-700"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         {!pendingRequestError && savedSection && showSuccess && (
//           <div className="bg-success-50 border-l-4 border-success-300 p-4 rounded-md flex gap-2">
//             <MdSchedule size={20} className="text-success-700 mt-1" />
//             <div>
//               <p className="text-h6 font-heading font-medium text-success-900">
//                 {savedSection === 'all' && savedSection ? 'Changes Submitted Successfully!' : 'Changes Applied!'}
//               </p>
//               <p className="text-p3 text-success-800">
//                 {savedSection === 'all' && savedSection ?
//                   'Your changes have been saved and submitted for admin review. You\'ll receive a notification once they are approved.' :
//                   'Your changes have been applied successfully.'}
//               </p>
//             </div>
//           </div>
//         )}

//         {editingSection && (
//           <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-md">
//             <div className="flex gap-2">
//               <PiInfo size={24} className="text-danger-700 mt-1" />
//               <div>
//                 <p className="text-h6 font-heading font-medium text-danger-800">
//                   Admin Review Required
//                 </p>
//                 <p className="text-p3 text-danger-700">
//                   All changes made to your profile will be reviewed by an administrator before they are reflected in the system. You will be notified once your changes have been approved.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* COMPANY DETAILS */}
//         <div id="company-section" className="bg-base-white rounded-md overflow-hidden border border-pneutral-200">
//           <div className="flex items-center justify-between px-6 py-4 bg-pneutral-50">
//             <div className="flex items-center gap-3">
//               <div className="p-2 rounded-md bg-secondary-100">
//                 <Building2 size={20} className="text-primary-900" />
//               </div>
//               <h2 className="text-h6 font-heading font-medium text-pneutral-900">
//                 Seller Company Details
//               </h2>
//             </div>

//             {!editingSection ? (
//               <button
//                 onClick={() => setEditingSection("editing")}
//                 className="flex items-center gap-2 bg-primary-900 text-base-white text-p3 px-4 py-2 rounded-md hover:bg-primary-800 transition-colors"
//               >
//                 <Pencil size={20} />
//                 Edit
//               </button>
//             ) : (
//               <ChevronUp size={18} className="text-pneutral-600" />
//             )}
//           </div>

//           <div className="p-6">
//             <div className="space-y-6">
//               <div className="flex flex-col items-center gap-2">
//                 <Image
//                   src="/icons/companylogo.png"
//                   alt="Company Logo"
//                   width={160}
//                   height={160}
//                   className="rounded-md shadow object-cover"
//                 />
//                 <p className="text-p3 text-pneutral-600">Company Logo</p>
//               </div>

//               <hr className="border-pneutral-200" />

//               <div className="grid grid-cols-2 gap-4">
//                 {/* Left Column - Seller Name/Company Name */}
//                 <div>
//                   <Input
//                     label="Seller Name/Company Name"
//                     value={formData.sellerName}
//                     editable={!!editingSection}
//                     icon={<HiOutlineBuildingOffice2 className="w-5 h-5" />}
//                     onChange={handleSellerNameChangeWithTracking}
//                     error={sellerNameError}
//                   />
//                   {sellerNameChanged && editingSection && (
//                     <p className="text-p2 text-warning-600 mt-1">
//                       ⚠️ Changing seller name requires updated: Company Registration Certificate, GST Certificate, License(s), and Bank Proof
//                     </p>
//                   )}
//                 </div>

//                 {/* Right Column - Company Type */}
//                 <div>
//                   <SelectField
//                     label="Company Type"
//                     value={formData.companyTypeId?.toString()}
//                     options={companyTypeOptions}
//                     editable={!!editingSection}
//                     onChange={handleCompanyTypeChange}
//                     placeholder="Select Company Type"
//                     isLoading={loadingStates.companyTypes}
//                     labelIcon={<Image src="/icons/companytype1.jpg" alt="Company Type" width={20} height={20} className="object-contain" />}
//                   />
//                 </div>



//                 {/* Left Column - Seller Type */}
//                 <div>
//                   <SelectField
//                     label="Seller Type"
//                     value={formData.sellerTypeId?.toString()}
//                     options={sellerTypeOptions}
//                     editable={false}
//                     labelIcon={<Image src="/icons/producttype.jpg" alt="Company Type" width={20} height={20} className="object-contain" />}
//                     onChange={handleSellerTypeChange}
//                     placeholder="Select Seller Type"
//                     isLoading={loadingStates.sellerTypes}
//                   />
//                 </div>

//                 {/* Right Column - Company Registration Certificate (Half Width) */}
//                 <div>
//                   <FileField
//                     key={formData.companyRegistrationCertificateUrl || 'company-cert'}
//                     label="Company Registration Certificate"
//                     file={formData.companyRegistrationCertificateUrl?.split('/').pop() || 'company_registration_certificate.pdf'}
//                     fileUrl={formData.companyRegistrationCertificateUrl}
//                     editable={!!editingSection}
//                     onDownload={() => handleDownload(
//                       formData.companyRegistrationCertificateUrl || '#',
//                       formData.companyRegistrationCertificateUrl?.split('/').pop() || 'company_registration_certificate.pdf'
//                     )}
//                     onView={() => handleViewInNewTab(formData.companyRegistrationCertificateUrl || '#')}
//                     onFileSelect={(file: File) => handleCompanyCertFileChange(file)}
//                     error={companyCertError && sellerNameChanged ? "Company Registration Certificate is required when changing seller name" : ""}
//                   />
//                   {companyCertError && sellerNameChanged && editingSection && (
//                     <p className="text-p2 text-warning-600 mt-1">
//                       ⚠️ Required when changing seller name
//                     </p>
//                   )}
//                 </div>

//                 {/* Product Category - Full Width */}
//                 <div className="col-span-2">
//                   <div className="flex flex-col">
//                     <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
//                       <Image
//                         src="/icons/pcategory.jpg"
//                         alt="Product Category"
//                         width={20}
//                         height={20}
//                         className="object-contain"
//                       />
//                       Product Category
//                       <span className="text-warning-500 ml-1">*</span>
//                     </label>
//                     <div className="relative" ref={productDropdownRef}>
//                       <div
//                         className={`w-full h-[52px] px-4 rounded-md border flex items-center justify-between ${!editingSection ? 'bg-pneutral-50 border-pneutral-100 cursor-not-allowed' : 'bg-base-white border-pneutral-200 cursor-pointer hover:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500'}`}
//                         onClick={() => {
//                           if (editingSection && !loadingStates.productTypes) {
//                             setIsProductDropdownOpen(!isProductDropdownOpen);
//                           }
//                         }}
//                       >
//                         <span className={`text-p4 font-body font-regular ${formData.productTypes.length === 0 ? "text-pneutral-500" : editingSection ? "text-pneutral-500" : "text-pneutral-800"}`}>
//                           {loadingStates.productTypes
//                             ? "Loading product types..."
//                             : formData.productTypes.length > 0
//                               ? formData.productTypes.join(", ")
//                               : "Select Product Types"}
//                         </span>
//                         <ChevronDown className={`w-5 h-5 text-pneutral-500 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
//                       </div>

//                       {editingSection && isProductDropdownOpen && !loadingStates.productTypes && (
//                         <div className="absolute top-full mt-1 w-full bg-base-white border border-pneutral-200 rounded-md shadow-xlg z-50 max-h-80 overflow-y-auto">
//                           <div className="p-2 border-b border-pneutral-200 sticky top-0 bg-base-white">
//                             <p className="text-p3 text-pneutral-600 font-medium">
//                               Select product types:
//                             </p>
//                           </div>
//                           <div className="max-h-60 overflow-y-auto">
//                             {productTypes.length > 0 && (
//                               <div
//                                 className="flex items-center px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200"
//                                 onClick={handleSelectAllProductTypes}
//                               >
//                                 <input
//                                   type="checkbox"
//                                   checked={productTypes.length > 0 && formData.productTypes.length === productTypes.length}
//                                   onChange={() => { }}
//                                   disabled
//                                   className="h-4 w-4 text-secondary-700 rounded border-pneutral-300 focus:ring-secondary-500"
//                                 />
//                                 <label className="ml-3 text-p3 font-medium text-secondary-700 cursor-pointer">
//                                   Select All
//                                 </label>
//                               </div>
//                             )}

//                             {productTypes.map((product) => (
//                               <div
//                                 key={product.productTypeId}
//                                 className="flex items-center px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200 last:border-b-0"
//                                 onClick={() => handleProductTypeToggle(product)}
//                               >
//                                 <input
//                                   type="checkbox"
//                                   checked={formData.productTypeIds.includes(product.productTypeId)}
//                                   onChange={() => { }}
//                                   className="h-4 w-4 text-secondary-700 rounded border-pneutral-300 focus:ring-secondary-500"
//                                 />
//                                 <label className="ml-3 text-p3 text-pneutral-900 cursor-pointer">
//                                   {product.productTypeName}
//                                   {product.regulatoryCategory && (
//                                     <span className="ml-2 text-p2 text-secondary-600">
//                                       ({product.regulatoryCategory})
//                                     </span>
//                                   )}
//                                 </label>
//                               </div>
//                             ))}
//                           </div>
//                           <div className="p-2 border-t border-pneutral-200 bg-secondary-50 sticky bottom-0">
//                             <p className="text-p2 text-pneutral-600">
//                               {formData.productTypes.length} of {productTypes.length} selected
//                             </p>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//               </div>

//               <hr className="border-pneutral-200" />

//               <div>
//                 <div className="flex items-center gap-2 text-label-l5 font-heading font-semibold text-pneutral-900 mb-4">
//                   <MapPin size={24} />
//                   Company Address
//                   <span className="text-warning-500">*</span>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <SelectField
//                     label="State"
//                     value={formData.stateId?.toString()}
//                     options={stateOptions}
//                     editable={!!editingSection}
//                     onChange={handleStateChange}
//                     placeholder="Select State"
//                     isLoading={loadingStates.states}
//                   />

//                   <SelectField
//                     label="District"
//                     value={formData.districtId?.toString()}
//                     options={districtOptions}
//                     editable={!!editingSection && formData.stateId > 0}
//                     onChange={handleDistrictChange}
//                     placeholder={loadingStates.districts ? "Loading..." : formData.stateId ? "Select District" : "Select State first"}
//                     isLoading={loadingStates.districts}
//                     isDisabled={!formData.stateId}
//                   />

//                   <SelectField
//                     label="Taluka"
//                     value={formData.talukaId?.toString()}
//                     options={talukaOptions}
//                     editable={!!editingSection && formData.districtId > 0}
//                     onChange={handleTalukaChange}
//                     placeholder={loadingStates.talukas ? "Loading..." : formData.districtId ? "Select Taluka" : "Select District first"}
//                     isLoading={loadingStates.talukas}
//                     isDisabled={!formData.districtId}
//                   />

//                   <Input
//                     label="City/Town/Village"
//                     value={formData.city}
//                     editable={!!editingSection}
//                     onChange={handleCityChange}
//                     error={cityError}
//                   />

//                   <Input
//                     label="Street/Road/Lane"
//                     value={formData.street}
//                     editable={!!editingSection}
//                     onChange={handleStreetChange}
//                     error={streetError}
//                   />

//                   <Input
//                     label="Building/House Number"
//                     value={formData.buildingNo}
//                     editable={!!editingSection}
//                     onChange={handleBuildingNoChange}
//                     error={buildingNoError}
//                   />

//                   <Input
//                     label="Landmark"
//                     value={formData.landmark}
//                     editable={!!editingSection}
//                     onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
//                     hideAsterisk={true}
//                   />

//                   <Input
//                     label="Pin Code"
//                     value={formData.pincode}
//                     editable={!!editingSection}
//                     onChange={handlePincodeChange}
//                     error={pincodeError}
//                     maxLength={6}
//                   />
//                 </div>
//               </div>

//               <hr className="border-pneutral-200" />

//               <div>
//                 <div className="flex items-center gap-2 text-label-l4 font-heading font-medium text-pneutral-900 mb-4">
//                   <Phone size={24} />
//                   Contact Information
//                 </div>

//                 <div className="grid grid-cols-2 gap-6">
//                   {/* Left Column - Company Phone Number */}
//                   <div className="flex flex-col">
//                     <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                       <Phone size={16} className="inline mr-2 text-pneutral-600" />
//                       Company Phone Number
//                       <span className="text-warning-500 ml-1">*</span>
//                     </label>
//                     <div className="relative">
//                       <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pneutral-800">
//                         +91
//                       </div>
//                       <input
//                         type="tel"
//                         value={formData.phone}
//                         onChange={handleCompanyPhoneChange}
//                         onBlur={handleCompanyPhoneBlur}
//                         disabled={!editingSection}
//                         maxLength={10}
//                         placeholder="9876543210"
//                         className={`w-full h-[52px] pl-12 pr-4 rounded-md text-p4 font-body font-regular
//                           ${editingSection
//                             ? `bg-base-white border ${companyPhoneError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${editingSection ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                             : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                           }`}
//                       />
//                       {companyPhoneError && (
//                         <p className="mt-1 text-p2 text-warning-500">{companyPhoneError}</p>
//                       )}
//                       {editingSection && !companyPhoneError && formData.phone && formData.phone.length === 10 && (
//                         <p className="mt-1 text-p2 text-success-600">✓ Valid mobile number</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Right Column - Company Email ID */}
//                   <Input
//                     label="Company Email ID"
//                     value={formData.email}
//                     editable={!!editingSection}
//                     icon={<Mail size={16} />}
//                     onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
//                     type="email"
//                   />

//                   {/* Left Column - Company Website (Half Width) */}
//                   <div className="col-span-1">
//                     <Input
//                       label="Company Website"
//                       value={formData.website || ''}
//                       editable={!!editingSection}
//                       icon={<Globe size={16} />}
//                       onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
//                       placeholder="https://example.com"
//                       hideAsterisk={true}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* COORDINATOR */}
//         <div id="coordinator-section">
//           <SectionCard
//             title="Company Coordinator Details"
//             icon={<FaRegUser size={24} />}
//             iconBg="bg-info-50"
//             iconColor="text-pneutral-900"
//             underReview={reviewSections.includes("coordinator")}
//           >
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Coordinator Name"
//                 value={formData.coordinatorName}
//                 editable={!!editingSection}
//                 maxLength={100}
//                 icon={<HiOutlineUser size={20} />}
//                 onChange={handleCoordinatorNameChange}
//                 error={coordinatorNameError}
//               />

//               <Input
//                 label="Coordinator Designation"
//                 value={formData.coordinatorDesignation}
//                 editable={!!editingSection}
//                 maxLength={100}
//                 icon={<HiOutlineBriefcase size={20} />}
//                 onChange={handleCoordinatorDesignationChange}
//                 error={coordinatorDesignationError}
//               />

//               <div id="coordinator-email-section" className="flex flex-col">
//                 <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                   <Mail size={16} className="inline mr-2 text-pneutral-600" />
//                   Coordinator Email ID
//                   <span className="text-warning-500 ml-1">*</span>
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="email"
//                     value={formData.coordinatorEmail}
//                     onChange={handleCoordinatorEmailChange}
//                     onBlur={handleCoordinatorEmailBlur}
//                     disabled={!editingSection}
//                     placeholder="coordinator@company.com"
//                     className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular pr-10
//                       ${editingSection
//                         ? `bg-base-white border ${emailExistsError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${emailExistsError ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                         : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                       }`}
//                   />
//                   {isCheckingEmail && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
//                     </div>
//                   )}
//                   {!isCheckingEmail && formData.coordinatorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail) && !emailExistsError && profileData?.coordinator?.email !== formData.coordinatorEmail && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <GoCheckCircle className="text-success-600" size={20} />
//                     </div>
//                   )}
//                   {!isCheckingEmail && emailExistsError && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <span className="text-warning-500 text-xl">⚠️</span>
//                     </div>
//                   )}
//                 </div>
//                 {emailExistsError && (
//                   <p className="text-p2 text-warning-500">{emailExistsError}</p>
//                 )}
//                 {!emailExistsError && formData.coordinatorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.coordinatorEmail) && !isCheckingEmail && profileData?.coordinator?.email !== formData.coordinatorEmail && (
//                   <p className="text-p2 text-success-600">✓ Valid email format</p>
//                 )}
//               </div>

//               <div id="coordinator-phone-section" className="flex flex-col">
//                 <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                   <Phone size={16} className="inline mr-2 text-pneutral-600" />
//                   Coordinator Mobile Number
//                   <span className="text-warning-500 ml-1">*</span>
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pneutral-800">
//                     +91
//                   </div>
//                   <input
//                     type="tel"
//                     value={formData.coordinatorMobile}
//                     onChange={handleCoordinatorPhoneChange}
//                     onBlur={handleCoordinatorPhoneBlur}
//                     disabled={!editingSection}
//                     maxLength={10}
//                     placeholder="9876543210"
//                     className={`w-full h-[52px] pl-12 pr-10 rounded-md text-p4 font-body font-regular
//                       ${editingSection
//                         ? `bg-base-white border ${coordinatorPhoneError || phoneExistsError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${coordinatorPhoneError || phoneExistsError ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                         : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                       }`}
//                   />
//                   {isCheckingPhone && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
//                     </div>
//                   )}
//                   {!isCheckingPhone && formData.coordinatorMobile.length === 10 && !coordinatorPhoneError && !phoneExistsError && profileData?.coordinator?.mobile !== formData.coordinatorMobile && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <GoCheckCircle className="text-success-600" size={20} />
//                     </div>
//                   )}
//                   {!isCheckingPhone && phoneExistsError && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <span className="text-warning-500 text-xl">⚠️</span>
//                     </div>
//                   )}
//                   {coordinatorPhoneError && (
//                     <p className="mt-1 text-p2 text-warning-500">{coordinatorPhoneError}</p>
//                   )}
//                   {phoneExistsError && (
//                     <p className="mt-1 text-p2 text-warning-500">{phoneExistsError}</p>
//                   )}
//                   {editingSection && !coordinatorPhoneError && !phoneExistsError && formData.coordinatorMobile && formData.coordinatorMobile.length === 10 && (
//                     <p className="mt-1 text-p2 text-success-600">✓ Valid mobile number</p>
//                   )}
//                 </div>
//               </div>

//               {(isCheckingEmail || isCheckingPhone) && (
//                 <div className="col-span-2">
//                   {isCheckingEmail && (
//                     <p className="text-p3 text-secondary-600 flex items-center gap-1">
//                       <span className="animate-spin">⏳</span> Checking email availability...
//                     </p>
//                   )}
//                   {isCheckingPhone && (
//                     <p className="text-p3 text-secondary-600 flex items-center gap-1">
//                       <span className="animate-spin">⏳</span> Checking phone availability...
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>
//           </SectionCard>
//         </div>

//         {/* LICENSE Sections */}
//         {formData.productTypes.map((productName: string, index: number) => {
//           const licenseData = formData.licenses[productName] || {
//             number: "",
//             file: null,
//             fileUrl: "",
//             issueDate: null,
//             expiryDate: null,
//             issuingAuthority: "",
//             status: 'InActive'
//           };

//           const currentStatus = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
//           const isInactive = currentStatus === 'InActive';
//           const hasLicenseError = licenseExistsError[productName] || licenseErrors[productName];

//           return (
//             <div
//               key={productName}
//               id={`license-section-${productName.replace(/\s/g, '-')}`}
//               className={`${hasLicenseError ? 'border border-pneutral-100 rounded-md' : ''}`}
//             >
//               <SectionCard
//                 title={`${productName} License Details`}
//                 icon={<HiOutlineDocumentCheck size={20} />}
//                 iconBg="bg-primary-100"
//                 iconColor="text-sneutral-800"
//                 underReview={reviewSections.includes(`license-${index}`)}
//               >
//                 {isInactive && licenseData.issueDate && licenseData.expiryDate && (
//                   <div className="mb-4 px-4 py-2.5 bg-warning-50 border border-warning-200 rounded-md flex items-center gap-2">
//                     <span className="text-warning-500 text-base">⚠️</span>
//                     <p className="text-warning-600 text-p3 font-medium">
//                       {productName} License is inactive/expired. Please update with a valid license.
//                     </p>
//                   </div>
//                 )}

//                 <div className="grid grid-cols-2 gap-6">
//                   {/* Left Column - License Number */}
//                   <div className="flex flex-col">
//                     <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                       <Hash size={16} className="inline mr-2 text-pneutral-600" />
//                       License Number <span className="text-warning-500 ml-1">*</span>
//                     </label>
//                     <div>
//                       <div className="relative">
//                         <input
//                           type="text"
//                           value={licenseData.number}
//                           onChange={(e) => handleLicenseNumberChangeWithValidation(e, productName)}
//                           onKeyDown={handleLicenseKeyDown}
//                           onPaste={(e) => handleLicensePaste(e, productName)}
//                           onBlur={(e) => handleLicenseNumberBlur(e.target.value, productName)}
//                           disabled={!editingSection}
//                           placeholder="e.g., TN/CBE/20B-12345"
//                           maxLength={30}
//                           className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular uppercase pr-10
//                             ${editingSection
//                               ? `bg-base-white border border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500 ${licenseErrors[productName] || licenseExistsError[productName] ? 'border-pneutral-200' : ''} ${licenseErrors[productName] || licenseExistsError[productName] ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                               : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                             }`}
//                         />
//                         {isCheckingLicense[productName] && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
//                           </div>
//                         )}
//                         {!isCheckingLicense[productName] && licenseData.number && licenseData.number.length >= 8 && !licenseErrors[productName] && !licenseExistsError[productName] && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <GoCheckCircle className="text-success-600" size={20} />
//                           </div>
//                         )}
//                         {!isCheckingLicense[productName] && licenseExistsError[productName] && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <span className="text-warning-500 text-xl">⚠️</span>
//                           </div>
//                         )}
//                       </div>
//                       {licenseErrors[productName] && (
//                         <p className="mt-1 text-p2 text-warning-500 flex items-start">
//                           <span className="mr-1">⚠️</span>
//                           <span>{licenseErrors[productName]}</span>
//                         </p>
//                       )}
//                       {licenseExistsError[productName] && !licenseErrors[productName] && (
//                         <p className="mt-1 text-p2 text-warning-500 flex items-start">
//                           <span className="mr-1">⚠️</span>
//                           <span>{licenseExistsError[productName]}</span>
//                         </p>
//                       )}
//                       {!licenseErrors[productName] && !licenseExistsError[productName] && licenseData.number && licenseData.number.length >= 8 && (
//                         <p className="mt-1 text-p2 text-success-600">✓ Valid license number format</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Right Column - License Issue Date */}
//                   <div className="flex flex-col">
//                     <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                       <Calendar size={16} className="inline mr-2 text-pneutral-600" />
//                       License Issue Date <span className="text-warning-500 ml-1">*</span>
//                     </label>
//                     {editingSection ? (
//                       <DatePicker
//                         value={licenseData.issueDate}
//                         onChange={(date) => handleIssueDateChangeWithValidation(date, productName)}
//                         maxDate={new Date()}
//                         format="dd/MM/yyyy"
//                         slotProps={{
//                           textField: {
//                             fullWidth: true,
//                             size: "small",
//                             placeholder: "DD/MM/YYYY",
//                             sx: {
//                               '& .MuiOutlinedInput-root': {
//                                 height: '52px',
//                                 borderRadius: '6px',
//                                 backgroundColor: '#FFFFFF',
//                                 '& .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#d1d5db',
//                                 },
//                                 '&:hover .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#9659FD',
//                                 },
//                                 '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#9659FD',
//                                   borderWidth: '2px',
//                                 },
//                               },
//                               '& .MuiInputBase-input': {
//                                 fontSize: '16px',
//                                 fontFamily: 'Noto Sans',
//                                 fontWeight: 400,
//                                 color: '#5A5B58',
//                               },
//                             },
//                           },
//                         }}
//                       />
//                     ) : (
//                       <div className="h-[52px] px-4 rounded-md bg-pneutral-50 border border-pneutral-100 flex items-center">
//                         <IoCalendarOutline className="mr-2 text-pneutral-600" />
//                         <span className="text-p4 font-body font-regular text-pneutral-800">{licenseData.issueDate ? licenseData.issueDate.toLocaleDateString('en-GB') : '-'}</span>
//                       </div>
//                     )}
//                   </div>

//                   {/* Left Column - License Expiry Date */}
//                   <div className="flex flex-col">
//                     <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                       <Calendar size={16} className="inline mr-2 text-pneutral-600" />
//                       License Expiry Date <span className="text-warning-500 ml-1">*</span>
//                     </label>
//                     {editingSection ? (
//                       <DatePicker
//                         value={licenseData.expiryDate}
//                         onChange={(date) => handleExpiryDateChangeWithValidation(date, productName)}
//                         minDate={licenseData.issueDate || undefined}
//                         format="dd/MM/yyyy"
//                         slotProps={{
//                           textField: {
//                             fullWidth: true,
//                             size: "small",
//                             placeholder: "DD/MM/YYYY",
//                             sx: {
//                               '& .MuiOutlinedInput-root': {
//                                 height: '52px  !important',
//                                 minHeight: '52px !important',
//                                 borderRadius: '8px',
//                                 backgroundColor: '#FFFFFF',
//                                 '& .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#d1d5db',
//                                 },
//                                 '&:hover .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#9659FD',
//                                 },
//                                 '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#9659FD',
//                                   borderWidth: '2px',
//                                 },
//                               },
//                               '& .MuiInputBase-input': {
//                                 fontSize: '16px',
//                                 fontFamily: 'Noto Sans',
//                                 fontWeight: 400,
//                                 color: '#5A5B58',
//                               },
//                             },
//                           },
//                         }}
//                       />
//                     ) : (
//                       <div className="h-[52px] px-4 rounded-md bg-pneutral-50 border border-pneutral-100 flex items-center">
//                         <IoCalendarOutline className="mr-2 text-pneutral-800" />
//                         <span className="text-p4 font-body font-regular text-pneutral-800">{licenseData.expiryDate ? licenseData.expiryDate.toLocaleDateString('en-GB') : '-'}</span>
//                       </div>
//                     )}
//                   </div>

//                   {/* Right Column - License Issuing Authority */}
//                   <Input
//                     label="License Issuing Authority"
//                     value={licenseData.issuingAuthority}
//                     editable={!!editingSection}
//                     icon={<HiOutlineAcademicCap size={20} />}
//                     onChange={(e) => handleIssuingAuthorityChangeWithValidation(e, productName)}
//                   />

//                   {/* Left Column - Half Width - License Copy */}
//                   <div className="col-span-1">
//                     <FileField
//                       key={licenseData.fileUrl}
//                       label="License Copy"
//                       file={licenseData.fileUrl?.split('/').pop() || 'Upload Document'}
//                       fileUrl={licenseData.fileUrl}
//                       editable={!!editingSection}
//                       onDownload={() => handleDownload(licenseData.fileUrl || '#', licenseData.fileUrl?.split('/').pop() || 'license.pdf')}
//                       onView={() => handleViewInNewTab(licenseData.fileUrl || '#')}
//                       onFileSelect={(file: File) => {
//                         handleLicenseFileChange(file, productName, licenseData.productTypeId);
//                       }}
//                       error={licenseCertError && sellerNameChanged ? "License copy is required when changing seller name" : ""}
//                     />
//                     {licenseCertError && sellerNameChanged && editingSection && (
//                       <p className="text-p2 text-warning-600 mt-1">
//                         ⚠️ Required when changing seller name
//                       </p>
//                     )}
//                   </div>

//                   {/* Right Column - License Status */}
//                   <div className="flex flex-col gap-2 py-8">
//                     <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${currentStatus === 'Active' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
//                       }`}>
//                       <GoCheckCircle size={16} />
//                       <span className="text-p3 font-medium">
//                         {!licenseData.issueDate || !licenseData.expiryDate ? 'Pending' : currentStatus}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </SectionCard>
//             </div>
//           );
//         })}

//         {/* GST Section */}
//         <div id="gst-section">
//           <SectionCard
//             title="GSTIN Details"
//             icon={<FileText size={20} />}
//             iconBg="bg-danger-50"
//             iconColor="text-warning-500"
//             underReview={reviewSections.includes("gst")}
//           >
//             <div className="grid grid-cols-2 gap-6">
//               <div className="flex flex-col">
//                 <label className="text-label-l4 font-heading font-medium text-pneutral-900">
//                   GSTIN Number
//                   <span className="text-warning-500 ml-1">*</span>
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={formData.gstNumber}
//                     onChange={handleGSTChangeWithValidation}
//                     onBlur={handleGSTBlur}
//                     disabled={!editingSection}
//                     maxLength={15}
//                     placeholder="22AAAAA0000A1Z"
//                     className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular uppercase pr-10
//                       ${editingSection
//                         ? `bg-base-white border ${gstExistsError ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${gstExistsError ? 'text-pneutral-800' : 'text-pneutral-800'}`
//                         : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//                       }`}
//                   />
//                   {isCheckingGST && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-900"></div>
//                     </div>
//                   )}
//                   {!isCheckingGST && formData.gstNumber && formData.gstNumber.length === 15 && !gstExistsError && profileData?.sellerGST?.gstNumber !== formData.gstNumber && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <GoCheckCircle className="text-success-600" size={20} />
//                     </div>
//                   )}
//                   {!isCheckingGST && gstExistsError && (
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                       <span className="text-warning-500 text-xl">⚠️</span>
//                     </div>
//                   )}
//                 </div>
//                 {gstExistsError && (
//                   <p className="text-p2 text-warning-500">{gstExistsError}</p>
//                 )}
//                 {!gstExistsError && formData.gstNumber && formData.gstNumber.length === 15 && !isCheckingGST && profileData?.sellerGST?.gstNumber !== formData.gstNumber && (
//                   <p className="text-p2 text-success-600">✓ Valid GST number format</p>
//                 )}
//                 {formData.gstNumber && formData.gstNumber.length > 0 && formData.gstNumber.length !== 15 && (
//                   <p className="text-p2 text-warning-500">GST number must be 15 characters</p>
//                 )}
//               </div>

//               <FileField
//                 key={formData.gstFileUrl}
//                 label="GST Certificate"
//                 file={formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf'}
//                 fileUrl={formData.gstFileUrl}
//                 editable={!!editingSection}
//                 onDownload={() => handleDownload(formData.gstFileUrl || '#', formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf')}
//                 onView={() => handleViewInNewTab(formData.gstFileUrl || '#')}
//                 onFileSelect={(file: File) => handleGSTFileChange(file)}
//                 error={gstCertError && sellerNameChanged ? "GST Certificate is required when changing seller name" : ""}
//               />
//               {gstCertError && sellerNameChanged && editingSection && (
//                 <p className="text-p2 text-warning-600 mt-1">
//                   ⚠️ Required when changing seller name
//                 </p>
//               )}
//             </div>
//           </SectionCard>
//         </div>

//         {/* BANK */}
//         <div>
//           <SectionCard
//             title="Bank Details"
//             icon={<Image
//               src="/icons/bank.jpg"
//               alt="Bank Details"
//               width={20}
//               height={20}
//               className="object-contain"
//             />}
//             iconBg="bg-info-50"
//             iconColor="text-info-700"
//             underReview={reviewSections.includes("bank")}
//           >
//             <div className="grid grid-cols-2 gap-6">
//               {/* Left Column - Bank Name */}
//               <div>
//                 <Input
//                   label="Bank Name"
//                   value={formData.bankName}
//                   editable={false}
//                 />
//               </div>

//               {/* Right Column - Branch */}
//               <div>
//                 <Input
//                   label="Branch"
//                   value={formData.branch}
//                   editable={false}
//                 />
//               </div>

//               {/* Left Column - Account Number */}
//               <div>
//                 <Input
//                   label="Account Number"
//                   value={formData.accountNumber}
//                   editable={!!editingSection}
//                   onChange={handleAccountNumberChange}
//                   error={accountNumberError}
//                   maxLength={18}
//                 />
//               </div>

//               {/* Right Column - IFSC Code */}
//               <div>
//                 <Input
//                   label="IFSC Code"
//                   value={formData.ifscCode}
//                   editable={!!editingSection}
//                   onChange={(e) => handleIfscChange(e.target.value)}
//                   maxLength={11}
//                   className="uppercase"
//                   error={ifscValidationError || ifscError}
//                 />
//               </div>

//               {/* Left Column - Beneficiary Name */}
//               <div>
//                 <Input
//                   label="Beneficiary Name"
//                   value={formData.accountHolderName}
//                   editable={!!editingSection}
//                   onChange={handleAccountHolderNameChange}
//                   error={accountHolderNameError}
//                 />
//               </div>

//               {/* Right Column - Cancelled Cheque */}
//               <div>
//                 <FileField
//                   key={formData.cancelledChequeFileUrl}
//                   label="Cancelled Cheque / Bank Passbook"
//                   file={formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf'}
//                   fileUrl={formData.cancelledChequeFileUrl}
//                   editable={!!editingSection}
//                   onDownload={() => handleDownload(formData.cancelledChequeFileUrl || '#', formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf')}
//                   onView={() => handleViewInNewTab(formData.cancelledChequeFileUrl || '#')}
//                   onFileSelect={(file: File) => handleBankFileChange(file)}
//                   error={bankCertError && sellerNameChanged ? "Bank proof is required when changing seller name" : ""}
//                 />
//                 {bankCertError && sellerNameChanged && editingSection && (
//                   <p className="text-p2 text-warning-600 mt-1">
//                     ⚠️ Required when changing seller name
//                   </p>
//                 )}
//               </div>
//             </div>
//           </SectionCard>

//           {editingSection && (
//             <div className="flex justify-between gap-4 mt-6">
//               <button
//                 type="button"
//                 onClick={() => {
//                   console.log('Cancel clicked');
//                   handleCancel();
//                 }}
//                 className="flex items-center gap-2 border-2 border-warning-500 text-warning-500 text-p3 font-semibold px-6 py-3 rounded-md hover:bg-warning-50 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={async (e) => {
//                   e.preventDefault();
//                   console.log('Submit clicked - starting save...');
//                   await handleSaveAll();
//                 }}
//                 disabled={isSubmitting}
//                 className={`flex items-center gap-2 bg-primary-900 font-semibold text-base-white text-p3 px-6 py-3 rounded-md transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-800'
//                   }`}
//               >
//                 {isSubmitting ? (
//                   <>
//                     <svg className="animate-spin h-5 w-5 text-base-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Submitting...
//                   </>
//                 ) : (
//                   'Submit'
//                 )}
//               </button>
//             </div>
//           )}
//         </div>

//         <OtpVerificationModal
//           show={showOtpModal}
//           email={pendingEmail}
//           phone={pendingPhone}
//           onClose={() => {
//             setShowOtpModal(false);
//             setPendingEmail(undefined);
//             setPendingPhone(undefined);
//             setPendingSectionData(null);
//             setPendingSection(null);
//           }}
//           onVerified={handleOtpVerified}
//         />
//       </div>
//     </LocalizationProvider>
//   );
// }

// function SectionCard({
//   title,
//   icon,
//   iconBg,
//   iconColor,
//   children,
//   underReview
// }: any) {
//   return (
//     <div className={`bg-base-white rounded-md overflow-hidden border ${underReview ? "border-pneutral-200" : "border-pneutral-200"}`}>
//       <div className="flex items-center justify-between px-6 py-4 bg-pneutral-50">
//         <div className="flex items-center gap-3">
//           <div className={`p-2 rounded-md ${iconBg}`}>
//             <div className={iconColor}>{icon}</div>
//           </div>
//           <h2 className="text-h6 font-heading font-medium text-pneutral-900">
//             {title}
//           </h2>
//         </div>
//       </div>

//       <div className="p-6">
//         {children}
//       </div>
//     </div>
//   );
// }

// interface InputProps {
//   label: string;
//   value: string;
//   editable: boolean;
//   icon?: React.ReactNode;
//   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   maxLength?: number;
//   type?: string;
//   className?: string;
//   error?: string;
//   hideAsterisk?: boolean;
//   placeholder?: string;
// }

// function Input({
//   label,
//   value,
//   editable,
//   icon,
//   onChange,
//   maxLength,
//   type = "text",
//   className = "",
//   error,
//   hideAsterisk = false,
//   placeholder
// }: InputProps) {
//   return (
//     <div className="flex flex-col">
//       <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
//         {icon && (
//           <span className="text-pneutral-600 inline-flex items-center">
//             {icon}
//           </span>
//         )}
//         {label}
//         {!hideAsterisk && <span className="text-warning-500">*</span>}
//       </label>
//       <input
//         type={type}
//         value={value}
//         onChange={onChange}
//         disabled={!editable}
//         maxLength={maxLength}
//         placeholder={placeholder}
//         className={`w-full h-[52px] px-4 rounded-md text-p4 font-body font-regular ${className}
//         ${editable
//             ? `bg-base-white border ${error ? 'border-warning-500 focus:ring-warning-500' : 'border-pneutral-200 focus:outline-none focus:ring-2 focus:ring-secondary-500'} ${editable ? 'text-pneutral-800' : 'text-pneutral-800'}`
//             : "bg-pneutral-50 border border-pneutral-100 cursor-not-allowed text-pneutral-800"
//           }
//         `}
//       />
//       {error && (
//         <p className="text-p2 text-warning-500 mt-1">{error}</p>
//       )}
//     </div>
//   );
// }

// function SelectField({
//   label,
//   value,
//   options,
//   editable,
//   labelIcon,
//   inputIcon,
//   onChange,
//   placeholder,
//   isLoading,
//   isDisabled
// }: any) {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const selectedOption = options.find((opt: any) => opt.value === value);
//   const displayValue = selectedOption?.label || placeholder || "Select option";

//   const handleSelect = (selectedValue: string, selectedLabel: string) => {
//     onChange({ value: selectedValue, label: selectedLabel });
//     setIsOpen(false);
//   };

//   return (
//     <div className="flex flex-col">
//       <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
//         {labelIcon && (
//           <span className="text-pneutral-600 inline-flex items-center">
//             {labelIcon}
//           </span>
//         )}
//         {label}
//         <span className="text-warning-500">*</span>
//       </label>
//       <div className="relative" ref={dropdownRef}>
//         <div
//           className={`w-full h-[52px] px-4 rounded-md border flex items-center justify-between cursor-pointer overflow-hidden
//             ${editable && !isDisabled && !isLoading
//               ? `bg-base-white border-pneutral-200  focus:outline-none focus:ring-2 focus:ring-secondary-500 ${isOpen ? 'ring-2 ring-secondary-500 border-secondary-500' : ''}`
//               : "bg-pneutral-50 border-pneutral-100 cursor-not-allowed"
//             }`}
//           onClick={() => {
//             if (editable && !isDisabled && !isLoading) {
//               setIsOpen(!isOpen);
//             }
//           }}
//         >
//           <div className="flex items-center gap-2 flex-1">
//             {inputIcon && <span className="text-pneutral-800 shrink-0">{inputIcon}</span>}
//             <span className={`text-p4 font-body font-regular truncate ${!selectedOption ? "text-pneutral-500" : editable ? "text-pneutral-800" : "text-pneutral-800"}`}>
//               {isLoading ? "Loading..." : displayValue}
//             </span>
//           </div>
//           <ChevronDown
//             className={`w-5 h-5 text-pneutral-500 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
//           />
//         </div>

//         {isOpen && editable && !isDisabled && !isLoading && (
//           <div className="absolute top-full left-0 right-0 mt-1 bg-base-white border border-pneutral-200 rounded-md shadow-xlg z-50 overflow-hidden">
//             <div className="max-h-60 overflow-y-auto">
//               {options.length > 0 ? (
//                 options.map((opt: any) => (
//                   <div
//                     key={opt.value}
//                     className={`px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-pneutral-200 last:border-b-0
//                       ${value === opt.value ? "bg-secondary-50 text-secondary-700 font-medium" : "text-pneutral-900"}`}
//                     onClick={() => handleSelect(opt.value, opt.label)}
//                   >
//                     <span className="text-p3">{opt.label}</span>
//                   </div>
//                 ))
//               ) : (
//                 <div className="px-4 py-3 text-p3 text-pneutral-500 text-center">
//                   No options available
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



// function FileField({
//   label,
//   file,
//   editable,
//   onDownload,
//   onView,
//   onFileSelect,
//   fileUrl,
//   error
// }: any) {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const prevEditableRef = useRef(editable);

//   useEffect(() => {
//     if (prevEditableRef.current === true && editable === false) {
//       // eslint-disable-next-line react-hooks/set-state-in-effect
//       setSelectedFile(null);
//     }
//     prevEditableRef.current = editable;
//   }, [editable]);

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     setSelectedFile(null);
//   }, [fileUrl]);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { files } = e.target;
//     if (!files || !files[0]) return;

//     const file = files[0];

//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("File size should be less than 5MB");
//       return;
//     }

//     const allowedTypes = [
//       "application/pdf",
//       "image/jpeg",
//       "image/jpg",
//       "image/png"
//     ];

//     if (!allowedTypes.includes(file.type)) {
//       toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
//       return;
//     }

//     setSelectedFile(file);

//     if (onFileSelect) {
//       onFileSelect(file);
//     }
//   };

//   const handleReplaceClick = () => {
//     fileInputRef.current?.click();
//   };

//   const displayFileName = selectedFile
//     ? selectedFile.name
//     : file ||
//     (fileUrl && fileUrl !== "PENDING"
//       ? fileUrl.split("/").pop()
//       : "No file chosen");

//   const isPending = fileUrl === "PENDING";

//   return (
//     <div className="flex flex-col">
//       {label && (
//         <label className="text-label-l4 font-heading font-medium text-pneutral-900 inline-flex items-center gap-2">
//           <FileText size={16} className="text-pneutral-600" />
//           {label}
//           <span className="text-warning-500">*</span>
//         </label>
//       )}

//       {editable ? (
//         <>
//           <div className="w-full h-[52px] rounded-md border border-primary-600 bg-primary-100 px-4 flex items-center justify-between gap-4">
//             {/* Left Section */}
//             <div className="flex items-center gap-3 flex-1 min-w-0">
//               {/* Icon Box */}
//               <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0">
//                 <FileText size={16} className="text-black" />
//               </div>

//               {/* File Name */}
//               <div className="flex-1 min-w-0">
//                 <div className="h-[26px] bg-success-50 rounded-[6px] px-3 flex items-center w-fit max-w-full">
//                   <span className="text-[18px] leading-[18px] font-medium text-secondary-800 truncate block max-w-[220px]">
//                     {displayFileName}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Right Actions */}
//             <div className="flex items-center gap-4 shrink-0">
//               <button
//                 type="button"
//                 onClick={handleReplaceClick}
//                 className="text-secondary-900 hover:opacity-80"
//                 title="Remove file"
//               >
//                 <X size={20} />
//               </button>

//               <button
//                 type="button"
//                 onClick={onDownload}
//                 className="text-secondary-800 hover:opacity-80"
//                 title="Download file"
//               >
//                 <Download size={20} />
//               </button>

//               <button
//                 type="button"
//                 onClick={onView}
//                 className="text-secondary-800 hover:opacity-80"
//                 title="Open in new tab"
//               >
//                 <ExternalLink size={20} />
//               </button>
//             </div>

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept=".pdf,.jpg,.jpeg,.png"
//               onChange={handleFileChange}
//               className="hidden"
//             />
//           </div>
//           {error && (
//             <p className="text-p2 text-warning-500 mt-1">{error}</p>
//           )}
//         </>
//       ) : (
//         <div className="w-full h-[52px] rounded-md border border-primary-600 bg-primary-100 px-4 flex items-center justify-between gap-4">
//           {/* Left Section */}
//           <div className="flex items-center gap-3 flex-1 min-w-0">
//             {/* Icon Box */}
//             <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0">
//               <FileText size={16} className="text-black" />
//             </div>

//             {/* File Name */}
//             <div className="flex-1 min-w-0">
//               <div className="h-[26px] bg-success-50 rounded-[6px] px-3 flex items-center w-fit max-w-full">
//                 <span className="text-[18px] leading-[18px] font-medium text-secondary-800 truncate block max-w-[220px]">
//                   {isPending ? "Pending Approval" : displayFileName}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Right Actions */}
//           <div className="flex items-center gap-4 shrink-0">
//             <button
//               onClick={onDownload}
//               className={`transition-colors ${isPending
//                 ? "text-pneutral-400 cursor-not-allowed"
//                 : "text-secondary-800 hover:opacity-80"
//                 }`}
//               title="Download file"
//               disabled={isPending}
//             >
//               <Download size={20} />
//             </button>

//             <button
//               onClick={onView}
//               className={`transition-colors ${isPending
//                 ? "text-pneutral-400 cursor-not-allowed"
//                 : "text-secondary-800 hover:opacity-80"
//                 }`}
//               title="Open in new tab"
//               disabled={isPending}
//             >
//               <ExternalLink size={20} />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }