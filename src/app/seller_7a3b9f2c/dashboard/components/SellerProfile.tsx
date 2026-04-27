"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Phone,
  MapPin,
  Landmark,
  Download,
  ExternalLink,
  Pencil,
  ChevronUp,
  FileText,
  ChevronDown
} from "lucide-react";
import { GoCheckCircle } from "react-icons/go";
import { PiInfo } from "react-icons/pi";
import { MdSchedule } from "react-icons/md";
import { HiOutlineBuildingOffice2, HiOutlineDocumentCheck } from "react-icons/hi2";
import { CiMail, CiGlobe } from "react-icons/ci";
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

// Function to clean and format license number on input - BLOCKS invalid characters
const formatLicenseNumber = (value: string): string => {
  let cleaned = value.toUpperCase();
  // Allow only alphanumeric, hyphens, and slashes - BLOCK everything else
  cleaned = cleaned.replace(/[^A-Z0-9\/\-]/g, '');
  return cleaned;
};

// Indian Mobile Number validation function
const validateIndianMobileNumber = (value: string): string | null => {
  const cleaned = value.replace(/\D/g, '');
  
  if (!cleaned) {
    return null; // Empty is allowed, will be caught by required validation
  }
  
  if (cleaned.length !== 10) {
    return "Mobile number must be exactly 10 digits";
  }
  
  // Check if first digit is 6, 7, 8, or 9
  const firstDigit = cleaned.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return "Mobile number must start with 6, 7, 8, or 9";
  }
  
  return null;
};

// Define response interface for type safety
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
  
  // Edit states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [reviewSections, setReviewSections] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [pendingRequestError, setPendingRequestError] = useState<string | null>(null);

  // OTP Modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | undefined>();
  const [pendingPhone, setPendingPhone] = useState<string | undefined>();
  const [pendingSectionData, setPendingSectionData] = useState<any>(null);
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  // Product dropdown state
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Master Data States
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([]);
  const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([]);
  const [states, setStates] = useState<StateResponse[]>([]);
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [talukas, setTalukas] = useState<TalukaResponse[]>([]);
  
  // Track changed files for upload
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

  // ✅ Track if any document has been changed (to force admin approval)
  const [hasDocumentChanges, setHasDocumentChanges] = useState(false);

  // Loading States for master data
  const [loadingStates, setLoadingStates] = useState({
    companyTypes: true,
    sellerTypes: true,
    productTypes: true,
    states: true,
    districts: false,
    talukas: false,
  });

  // IFSC error state
  const [ifscError, setIfscError] = useState("");

  // Email/Phone validation states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExistsError, setPhoneExistsError] = useState("");

  // Phone number validation errors
  const [companyPhoneError, setCompanyPhoneError] = useState("");
  const [coordinatorPhoneError, setCoordinatorPhoneError] = useState("");

  // License validation errors
  const [licenseErrors, setLicenseErrors] = useState<Record<string, string>>({});

  // Submit loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ State to track inactive licenses for blocking submission
  const [inactiveLicenses, setInactiveLicenses] = useState<string[]>([]);
  const [showInactiveError, setShowInactiveError] = useState(false);

  // Form State for editing
  const [formData, setFormData] = useState({
    // IDs for submission
    companyTypeId: 0,
    sellerTypeId: 0,
    productTypeIds: [] as number[],
    stateId: 0,
    districtId: 0,
    talukaId: 0,
    
    // Display values
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
    
    // Coordinator
    coordinatorName: "",
    coordinatorDesignation: "",
    coordinatorEmail: "",
    coordinatorMobile: "",
    
    // GST
    gstNumber: "",
    gstFile: null as File | null,
    gstFileUrl: "",
    
    companyRegistrationCertificateFile: null as File | null,
    companyRegistrationCertificateUrl: "",
    
    // Licenses per product
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
    
    // Bank details
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

  // ✅ Effect to check for inactive licenses whenever licenses data changes
  useEffect(() => {
    const inactive: string[] = [];
    
    Object.entries(formData.licenses).forEach(([productName, licenseData]) => {
      // Only check if both dates are present
      if (licenseData.issueDate && licenseData.expiryDate) {
        const status = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
        if (status === 'InActive') {
          inactive.push(productName);
        }
      }
    });
    
    setInactiveLicenses(inactive);
  }, [formData.licenses]);

  // Debug licenses
  useEffect(() => {
    console.log('📋 Current licenses in formData:', formData.licenses);
    console.log('📋 Inactive licenses:', inactiveLicenses);
  }, [formData.licenses, inactiveLicenses]);

  // Close dropdown when clicking outside
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

  // Fetch master data on mount
  useEffect(() => {
    fetchCompanyTypes();
    fetchStates();
    fetchSellerTypes();
    fetchProductTypes();
  }, []);

  const resetFormData = () => {
    if (profileData) {
      // Re-initialize licenses from documents with all fields
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
        // IDs
        companyTypeId: profileData.companyType?.companyTypeId || 0,
        sellerTypeId: profileData.sellerType?.sellerTypeId || 0,
        productTypeIds: profileData.productTypes.map(pt => pt.productTypeId),
        stateId: profileData.address?.state?.stateId || 0,
        districtId: profileData.address?.district?.districtId || 0,
        talukaId: profileData.address?.taluka?.talukaId || 0,
        
        // Display values
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
        
        // Coordinator
        coordinatorName: profileData.coordinator?.name || '',
        coordinatorDesignation: profileData.coordinator?.designation || '',
        coordinatorEmail: profileData.coordinator?.email || '',
        coordinatorMobile: profileData.coordinator?.mobile || '',
        
        // GST
        gstNumber: profileData.sellerGST?.gstNumber || '',
        gstFile: null,
        gstFileUrl: profileData.sellerGST?.gstFileUrl || '',

        companyRegistrationCertificateFile: null,
        companyRegistrationCertificateUrl: profileData.companyRegistrationCertificateUrl || "",
        
        // Licenses
        licenses,
        
        // Bank details
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
      
      // Reset license errors
      setLicenseErrors({});
      
      // Reset phone errors
      setCompanyPhoneError("");
      setCoordinatorPhoneError("");
      
      // ✅ Reset document changes flag
      setHasDocumentChanges(false);
      setInactiveLicenses([]);
      setShowInactiveError(false);
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
    setCompanyPhoneError("");
    setCoordinatorPhoneError("");
    // ✅ Reset document changes flag
    setHasDocumentChanges(false);
    setPendingRequestError(null);
    setInactiveLicenses([]);
    setShowInactiveError(false);
  };

  // Master data fetch functions
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

  // Fetch profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await sellerProfileService.getCurrentSellerProfile();
        setProfileData(data);
        
        // Initialize form data with current values
        if (data) {
          // Initialize licenses from documents with all fields
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
            // IDs
            companyTypeId: data.companyType?.companyTypeId || 0,
            sellerTypeId: data.sellerType?.sellerTypeId || 0,
            productTypeIds: data.productTypes.map(pt => pt.productTypeId),
            stateId: data.address?.state?.stateId || 0,
            districtId: data.address?.district?.districtId || 0,
            talukaId: data.address?.taluka?.talukaId || 0,
            
            // Display values
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
            
            // Coordinator
            coordinatorName: data.coordinator?.name || '',
            coordinatorDesignation: data.coordinator?.designation || '',
            coordinatorEmail: data.coordinator?.email || '',
            coordinatorMobile: data.coordinator?.mobile || '',
            
            // GST
            gstNumber: data.sellerGST?.gstNumber || '',
            gstFile: null,
            gstFileUrl: data.sellerGST?.gstFileUrl || '',

            companyRegistrationCertificateFile: null,
            companyRegistrationCertificateUrl: data.companyRegistrationCertificateUrl || "",
            
            // Licenses
            licenses,
            
            // Bank details
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

          // Fetch districts and talukas if state and district exist
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

  // ✅ UPDATED: Update GST file handler - marks document change and sets URL to PENDING
  const handleGSTFileChange = (file: File) => {
    setFormData(prev => ({ 
      ...prev, 
      gstFile: file,
      gstFileUrl: "PENDING" // Set URL to PENDING when file is changed
    }));
    setChangedFiles(prev => ({ ...prev, gstFile: file }));
    setHasDocumentChanges(true); // ✅ Force admin approval
  };

  // ✅ UPDATED: registration certificate file handler - marks document change and sets URL to PENDING
  const handleCompanyCertFileChange = (file: File) => {
    setFormData(prev => ({ 
      ...prev, 
      companyRegistrationCertificateFile: file,
      companyRegistrationCertificateUrl: "PENDING" // Set URL to PENDING when file is changed
    }));
    setChangedFiles(prev => ({ ...prev, companyCertFile: file }));
    setHasDocumentChanges(true); // ✅ Force admin approval
  };

  // ✅ UPDATED: Update Bank file handler - marks document change and sets URL to PENDING
  const handleBankFileChange = (file: File) => {
    setFormData(prev => ({ 
      ...prev, 
      cancelledChequeFile: file,
      cancelledChequeFileUrl: "PENDING" // Set URL to PENDING when file is changed
    }));
    setChangedFiles(prev => ({ ...prev, bankFile: file }));
    setHasDocumentChanges(true); // ✅ Force admin approval
  };

  // ✅ UPDATED: Update License file handler - marks document change and sets URL to PENDING
  const handleLicenseFileChange = (file: File, productName: string, productTypeId: number) => {
    setFormData(prev => ({
      ...prev,
      licenses: {
        ...prev.licenses,
        [productName]: {
          ...prev.licenses[productName],
          file: file,
          fileUrl: "PENDING", // Set URL to PENDING when file is changed
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
    setHasDocumentChanges(true); // ✅ Force admin approval
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
    
    // Update the form data
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
    
    // Validate the license number
    const error = validateDrugLicenseNumber(cleanedValue);
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
  };

  // Handle key down to block invalid keys
  const handleLicenseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Handle paste to clean invalid characters
  const handleLicensePaste = (e: React.ClipboardEvent<HTMLInputElement>, productName: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    let cleanedText = pastedText.toUpperCase();
    // Remove invalid characters
    cleanedText = cleanedText.replace(/[^A-Z0-9\/\-]/g, '');
    // Limit to 30 characters
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
    
    // Validate
    const error = validateDrugLicenseNumber(cleanedText);
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
  };

  // Handle license number blur for final validation
  const handleLicenseNumberBlur = (value: string, productName: string) => {
    const error = validateDrugLicenseNumber(value);
    setLicenseErrors(prev => ({ ...prev, [productName]: error || "" }));
  };

  // Product selection handlers
  const handleProductTypeToggle = (product: ProductTypeResponse) => {
    if (!product) return;
    
    setFormData(prev => {
      let newProductTypeIds = [...prev.productTypeIds];
      let newProductTypes = [...prev.productTypes];
      const newLicenses = { ...prev.licenses };

      if (newProductTypeIds.includes(product.productTypeId)) {
        // Removing product
        newProductTypeIds = newProductTypeIds.filter(id => id !== product.productTypeId);
        newProductTypes = newProductTypes.filter(name => name !== product.productTypeName);
        delete newLicenses[product.productTypeName];
      } else {
        // Adding product - FIRST CHECK IF IT ALREADY EXISTS IN PROFILE
        newProductTypeIds.push(product.productTypeId);
        newProductTypes.push(product.productTypeName);
        
        // Check if this product already has a document in the current profile
        const existingDoc = profileData?.documents.find(
          doc => doc.productTypes?.productTypeId === product.productTypeId
        );
        
        if (existingDoc) {
          // ✅ If it exists, use the existing data (preserves documentId, number, dates, etc.)
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
      // Deselect all
      setFormData(prev => ({
        ...prev,
        productTypeIds: [],
        productTypes: [],
        licenses: {},
      }));
    } else {
      // Select all - preserve existing document data
      const allIds = productTypes.map(p => p.productTypeId);
      const allNames = productTypes.map(p => p.productTypeName);
      
      const newLicenses: Record<string, any> = {};
      
      allNames.forEach(name => {
        const product = productTypes.find(p => p.productTypeName === name);
        if (!product) return;
        
        // Check if this product already has a document
        const existingDoc = profileData?.documents.find(
          doc => doc.productTypes?.productTypeId === product.productTypeId
        );
        
        if (existingDoc) {
          // Use existing data
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

  // State/District/Taluka handlers
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
  };

  // Company type handler
  const handleCompanyTypeChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0;
    const selectedCompany = companyTypes.find(c => c.companyTypeId === selectedId);
    
    setFormData(prev => ({
      ...prev,
      companyTypeId: selectedId,
      companyType: selectedCompany?.companyTypeName || "",
    }));
  };

  // Seller type handler
  const handleSellerTypeChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0;
    const selectedSeller = sellerTypes.find(s => s.sellerTypeId === selectedId);
    
    setFormData(prev => ({
      ...prev,
      sellerTypeId: selectedId,
      sellerType: selectedSeller?.sellerTypeName || "",
    }));
  };

  // GST handler
  const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^0-9A-Z]/g, '');
    if (value.length > 15) value = value.slice(0, 15);
    setFormData(prev => ({ ...prev, gstNumber: value }));
  };

  // Phone number handlers with validation
  const handleCompanyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    setFormData(prev => ({ ...prev, phone: value }));
    
    // Validate
    const error = validateIndianMobileNumber(value);
    setCompanyPhoneError(error || "");
  };

  const handleCompanyPhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validateIndianMobileNumber(e.target.value);
    setCompanyPhoneError(error || "");
  };

  const handleCoordinatorPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    setFormData(prev => ({ ...prev, coordinatorMobile: value }));
    
    // Validate
    const error = validateIndianMobileNumber(value);
    setCoordinatorPhoneError(error || "");
  };

  const handleCoordinatorPhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validateIndianMobileNumber(e.target.value);
    setCoordinatorPhoneError(error || "");
  };

  // IFSC handler with auto-fill
  const handleIfscChange = async (value: string) => {
    const ifsc = value.toUpperCase();
    setFormData(prev => ({ ...prev, ifscCode: ifsc }));
    setIfscError("");

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

    const parseResult = ifscSchema.safeParse(ifsc);
    if (!parseResult.success) {
      setIfscError(parseResult.error.issues[0].message);
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

  // Coordinator email/phone check functions
  const checkCoordinatorEmailExists = async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailExistsError("");
      return false;
    }
    
    setIsCheckingEmail(true);
    setEmailExistsError("");
    
    try {
      const exists = await sellerRegService.checkCoordinatorEmail(email);
      if (exists) {
        setEmailExistsError("This email is already registered. Please use a different email address.");
        return true;
      }
      setEmailExistsError("");
      return false;
    } catch (error: any) {
      console.error("Error checking email:", error);
      setEmailExistsError(error.message || "Failed to verify email");
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkCoordinatorPhoneExists = async (phone: string): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // First validate the phone number format
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
    setPhoneExistsError("");
    
    try {
      const exists = await sellerRegService.checkCoordinatorPhone(cleanPhone);
      if (exists) {
        setPhoneExistsError("This phone number is already registered. Please use a different number.");
        return true;
      }
      setPhoneExistsError("");
      return false;
    } catch (error: any) {
      console.error("Error checking phone:", error);
      setPhoneExistsError(error.message || "Failed to verify phone");
      return false;
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Date handlers for licenses
  const handleIssueDateChange = (date: Date | null, productName: string) => {
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
  };

  const handleExpiryDateChange = (date: Date | null, productName: string) => {
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
  };

  // Input handlers
  const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ NEW: Alphanumeric handler for coordinator fields (letters, numbers, spaces only)
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

  const handleIssuingAuthorityChange = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    setFormData(prev => ({
      ...prev,
      licenses: {
        ...prev.licenses,
        [productName]: {
          ...prev.licenses[productName],
          issuingAuthority: e.target.value,
        },
      },
    }));
  };

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Helper function to check if response contains pending request error
  const isPendingRequestError = (responseData: any): { isError: boolean; message: string; requestId: string } => {
    let errorMessage = '';
    let pendingRequestId = '';
    
    // Check nested response structure
    if (responseData?.data?.data?.message) {
      errorMessage = responseData.data.data.message;
    } else if (responseData?.data?.message) {
      errorMessage = responseData.data.message;
    } else if (responseData?.message) {
      errorMessage = responseData.message;
    }
    
    // Check if error message contains pending request indicator
    if (errorMessage && errorMessage.toLowerCase().includes('pending update request already exists')) {
      const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
      pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';
      return { isError: true, message: errorMessage, requestId: pendingRequestId };
    }
    
    return { isError: false, message: '', requestId: '' };
  };

  // Auto dismiss pending error after 10 seconds (same as success message)
  useEffect(() => {
    if (pendingRequestError) {
      const timer = setTimeout(() => {
        setPendingRequestError(null);
      }, 10000); // 10 seconds - same as success message
      return () => clearTimeout(timer);
    }
  }, [pendingRequestError]);

  // Auto dismiss inactive error after 10 seconds
  useEffect(() => {
    if (showInactiveError) {
      const timer = setTimeout(() => {
        setShowInactiveError(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showInactiveError]);

  // ✅ Function to check if any license is inactive before submission
  const hasInactiveLicenses = (): boolean => {
    return inactiveLicenses.length > 0;
  };

  const handleSaveAll = async () => {
    setIsSubmitting(true);
    setPendingRequestError(null);
    
    // ✅ Check for inactive licenses first
    if (hasInactiveLicenses()) {
      setShowInactiveError(true);
      scrollToTop();
      toast.error(
        `Cannot submit: The following license(s) are inactive/expired:\n${inactiveLicenses.join('\n')}\n\nPlease update with valid licenses.`,
        { duration: 8000 }
      );
      setIsSubmitting(false);
      return;
    }
    
    // Validate phone numbers before proceeding
    const companyPhoneValidationError = validateIndianMobileNumber(formData.phone);
    const coordinatorPhoneValidationError = validateIndianMobileNumber(formData.coordinatorMobile);
    
    if (companyPhoneValidationError) {
      toast.error(`Company Phone: ${companyPhoneValidationError}`);
      setCompanyPhoneError(companyPhoneValidationError);
      setIsSubmitting(false);
      return;
    }
    
    if (coordinatorPhoneValidationError) {
      toast.error(`Coordinator Mobile: ${coordinatorPhoneValidationError}`);
      setCoordinatorPhoneError(coordinatorPhoneValidationError);
      setIsSubmitting(false);
      return;
    }
    
    try {
      let needsEmailVerification = false;
      let needsPhoneVerification = false;
      let newEmail = '';
      let newPhone = '';

      // Helper function to format dates to YYYY-MM-DD
      const formatDate = (date: Date | null | string): string => {
        if (!date) return '';
        if (typeof date === 'string') return date;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Track changed files for upload
      const filesToUpload = {
        gstFile: null as File | null,
        bankFile: null as File | null,
        companyCertFile: null as File | null,
        licenses: [] as Array<{
          productName: string;
          productTypeId: number;
          file: File;
        }>
      };

      // Check if GST file changed
      if (formData.gstFile) {
        filesToUpload.gstFile = formData.gstFile;
      }

      // Check if Company Certificate file changed
      if (formData.companyRegistrationCertificateFile) {
        filesToUpload.companyCertFile = formData.companyRegistrationCertificateFile;
      }

      // Check if Bank file changed
      if (formData.cancelledChequeFile) {
        filesToUpload.bankFile = formData.cancelledChequeFile;
      }

      // Get current profile documents
      const currentDocs = profileData?.documents || [];
      
      // Get currently SELECTED product types from form
      const selectedProductTypeIds = new Set(formData.productTypeIds);
      
      console.log('📦 Selected product types:', Array.from(selectedProductTypeIds));
      console.log('📦 Current documents:', currentDocs.map(d => d.productTypes?.productTypeId));

      // Build documents array - ONLY include documents for SELECTED product types
      const documentsToSend = [];
      const processedProductTypeIds = new Set<number>();

      // 1. Add existing documents ONLY if their product type is still selected
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
          
          // ✅ Use the URL from formData (which may be "PENDING" if file changed)
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
          console.log(`✅ Keeping document for product ${productTypeId} with URL: ${documentFileUrl}`);
        } else {
          console.log(`🗑️ Document for product ${productTypeId} will be REMOVED`);
        }
      }

      // 2. Add NEW documents
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
            // ✅ For new documents with file change, use "PENDING" URL
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
            console.log(`🆕 Adding NEW document for product ${productType.productTypeId} with URL: ${documentFileUrl}`);
          }
        }
      });

      const allProductTypeIds = Array.from(selectedProductTypeIds);

      console.log('📦 Final documents to send:', documentsToSend.map(d => ({
        id: d.documentId || 'NEW',
        productId: d.productTypeId,
        number: d.documentNumber,
        fileUrl: d.documentFileUrl
      })));
      
      console.log('📦 Files to upload:', {
        gst: filesToUpload.gstFile?.name,
        bank: filesToUpload.bankFile?.name,
        companyCert: filesToUpload.companyCertFile?.name,
        licenses: filesToUpload.licenses.map(l => ({ name: l.productName, file: l.file.name }))
      });

      // Build complete profile data
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

      // Validate required fields
      const validationResult = validateSection('company', completeData);
      if (!validationResult.success) {
        toast.error(validationResult.error || 'Validation failed');
        return;
      }

      // Check for coordinator changes
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

      // Handle OTP if needed
      if (needsEmailVerification || needsPhoneVerification) {
        if (needsEmailVerification && newEmail) {
          const emailExists = await checkCoordinatorEmailExists(newEmail);
          if (emailExists) {
            toast.error("This email is already registered.");
            return;
          }
        }
        if (needsPhoneVerification && newPhone) {
          const phoneExists = await checkCoordinatorPhoneExists(newPhone);
          if (phoneExists) {
            toast.error("This phone number is already registered.");
            return;
          }
        }

        setPendingEmail(needsEmailVerification ? newEmail : undefined);
        setPendingPhone(needsPhoneVerification ? newPhone : undefined);
        setPendingSectionData({ completeData, filesToUpload });
        setPendingSection('all');
        setShowOtpModal(true);
        return;
      }

      console.log('💾 Sending JSON data...');
      
      const requestedBy = updateProfileService.getCurrentUserEmail();
      if (!requestedBy) {
        toast.error('User email not found');
        return;
      }

      const response = await updateProfileService.updateFullProfile(completeData, requestedBy);
      
      console.log('🔍 Full response:', response);
      
      // ✅ CRITICAL: Check if response contains pending request error
      const pendingError = isPendingRequestError(response);
      if (pendingError.isError) {
        // Scroll to top before showing error
        scrollToTop();
        
        setPendingRequestError(
          `⚠️ Update Request Already Pending\n\n` +
          `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
          `Please wait for admin approval before submitting new changes.\n\n` +
          `You will be notified once your changes are approved.`
        );
        toast.error(
          `⚠️ Update Request Already Pending\n\n` +
          `Your previous update request (ID: ${pendingError.requestId || 'N/A'}) is still under review.\n\n` +
          `Please wait for admin approval before submitting new changes.`,
          { duration: 8000 }
        );
        return;
      }
      
      // Check if this was auto-approved (no pendingSellerId) or needs admin approval (has pendingSellerId)
      let pendingSellerId: number | null = null;
      let isAutoApproved: boolean = false;
      let documentsList: UpdateProfileResponse['documents'] = [];
      
      if (response) {
        // Check for auto-approval message
        if (response.message && response.message.includes('auto-approved')) {
          isAutoApproved = true;
          console.log('✅ Auto-approved update detected');
        }
        
        // Try to find pendingSellerId directly from response
        if (response.pendingSellerId) {
          pendingSellerId = response.pendingSellerId;
        }
        
        // Get documents list directly from response
        if (response.documents && Array.isArray(response.documents)) {
          documentsList = response.documents;
        }
        
        console.log('🔍 Found pendingSellerId:', pendingSellerId);
        console.log('🔍 Is auto-approved:', isAutoApproved);
      }
      
      // Handle auto-approved case (no pendingSellerId) - ONLY if no document changes
      if ((isAutoApproved || (!pendingSellerId && response && response.message)) && !hasDocumentChanges) {
        console.log('✅ Update was auto-approved. No pending review needed.');
        toast.success(response.message || 'Changes applied successfully!');
        
        // Scroll to top to show success message
        scrollToTop();
        
        // Refresh profile data to show updated values
        const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
        setProfileData(updatedProfile);
        
        // Reset form data with updated values
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
        // ✅ Reset document changes flag
        setHasDocumentChanges(false);
        
        setTimeout(() => {
          setShowSuccess(false);
          setSavedSection(null);
        }, 5000);
        
        return;
      }
      
      // Handle admin approval case (has pendingSellerId) OR when document changes exist
      if (pendingSellerId || hasDocumentChanges) {
        if (!pendingSellerId) {
          console.error('❌ No pendingSellerId found but document changes exist');
          toast.error('Unable to process document changes. Please contact support.');
          return;
        }
        
        console.log('✅ Step 1 complete. Pending Seller ID:', pendingSellerId);
        
        // Create a map of productTypeId -> pendingDocumentId from the response
        const pendingDocumentIdMap = new Map<number, number>();
        
        if (documentsList && Array.isArray(documentsList)) {
          documentsList.forEach((pendingDoc: any) => {
            // Extract productTypeId - it might be nested or direct
            const productTypeId = pendingDoc.productTypeId || pendingDoc.productType?.productTypeId;
            // Extract pending document ID - could be pendingSellerDocumentId or id
            const pendingDocId = pendingDoc.pendingSellerDocumentId || pendingDoc.id;
            
            if (productTypeId && pendingDocId) {
              pendingDocumentIdMap.set(productTypeId, pendingDocId);
              console.log(`📋 Product Type ${productTypeId} → Pending Document ID: ${pendingDocId}`);
            }
          });
        }
        
        const hasFilesToUpload = filesToUpload.gstFile || filesToUpload.bankFile || filesToUpload.companyCertFile || filesToUpload.licenses.length > 0;
        
        if (hasFilesToUpload) {
          console.log('📤 Step 2: Uploading documents...');
          
          try {
            // Prepare licenses with their pending document IDs
            const licensesWithIds = filesToUpload.licenses.map(license => {
              const pendingDocumentId = pendingDocumentIdMap.get(license.productTypeId);
              if (!pendingDocumentId) {
                console.warn(`⚠️ No pending document ID found for product type ${license.productTypeId} (${license.productName})`);
              }
              return {
                file: license.file,
                licenseName: license.productName,
                documentId: pendingDocumentId // This can be undefined for new documents
              };
            });
            
            // Upload all documents - the UploadDocPayload type doesn't support individual pending IDs
            // The backend will map documents based on the pendingSellerId
            await uploadSellerDocuments(pendingSellerId, {
              gstFile: filesToUpload.gstFile || undefined,
              bankFile: filesToUpload.bankFile || undefined,
              companyRegistrationCertificate: filesToUpload.companyCertFile || undefined,
              licenses: licensesWithIds
            });
            console.log('✅ Step 2 complete. Document upload successful');
            toast.success('Changes submitted for admin review.');
            
            // Scroll to top to show success message
            scrollToTop();
            
          } catch (uploadError: any) {
            console.error('❌ Upload failed, rolling back...', uploadError);
            // Rollback: delete the pending update request
            await deleteUpdateRequest(pendingSellerId);
            toast.error(uploadError.message || 'File upload failed. Changes have been rolled back. Please try again.');
            return;
          }
        } else {
          console.log('✅ No files to upload. Update complete.');
          toast.success('Changes submitted for admin review.');
          
          // Scroll to top to show success message
          scrollToTop();
        }
        
        setEditingSection(null);
        
        // Mark all sections as under review
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
        
        // Clear file selections after successful upload
        setFormData(prev => ({
          ...prev,
          gstFile: null,
          companyRegistrationCertificateFile: null,
          cancelledChequeFile: null,
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
        
        // ✅ Reset document changes flag
        setHasDocumentChanges(false);
        
      } else {
        console.error('❌ Unexpected response structure:', response);
        toast.error('Unexpected server response. Please contact support.');
        return;
      }

    } catch (error: any) {
      console.error('❌ Error in handleSaveAll:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // ✅ CRITICAL FIX: Parse the nested error structure
      let errorMessage = '';
      let pendingRequestId = '';
      
      // Check error response data
      if (error.response?.data) {
        // Deep nested structure: response.data.data.data.message
        if (error.response.data.data?.data?.message) {
          errorMessage = error.response.data.data.data.message;
          console.log('📋 Found error at data.data.data.message:', errorMessage);
        } 
        // Alternative: response.data.data.message
        else if (error.response.data.data?.message) {
          errorMessage = error.response.data.data.message;
          console.log('📋 Found error at data.data.message:', errorMessage);
        } 
        // Alternative: response.data.message
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
          console.log('📋 Found error at data.message:', errorMessage);
        }
      }
      
      // Also check error.message
      if (!errorMessage && error.message) {
        errorMessage = error.message;
        console.log('📋 Found error at error.message:', errorMessage);
      }
      
      // Check if the error is about pending update request
      if (errorMessage.toLowerCase().includes('pending update request already exists')) {
        // Extract the Pending Request ID if present
        const pendingIdMatch = errorMessage.match(/Pending Request ID:\s*(\d+)/i);
        pendingRequestId = pendingIdMatch ? pendingIdMatch[1] : '';
        
        // Scroll to top before showing error
        scrollToTop();
        
        // Set pending request error state
        setPendingRequestError(
          `⚠️ Update Request Already Pending\n\n` +
          `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
          `Please wait for admin approval before submitting new changes.\n\n` +
          `You will be notified once your changes are approved.`
        );
        
        // Show error toast - DO NOT show success message
        toast.error(
          `⚠️ Update Request Already Pending\n\n` +
          `Your previous update request (ID: ${pendingRequestId || 'N/A'}) is still under review.\n\n` +
          `Please wait for admin approval before submitting new changes.`,
          { duration: 8000 }
        );
        
        // CRITICAL: Do NOT set savedSection or showSuccess
        // This prevents the success message from appearing
        return;
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
    } finally {
      setIsSubmitting(false);
      // Only clear success message if it was set
      if (savedSection) {
        setTimeout(() => {
          setShowSuccess(false);
          setSavedSection(null);
        }, 10000);
      }
    }
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
        
        // Check if response contains pending request error
        const pendingError = isPendingRequestError(response);
        if (pendingError.isError) {
          // Scroll to top before showing error
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
        
        // Check if auto-approved or needs admin review
        if (response.message && response.message.includes('auto-approved')) {
          toast.success(response.message);
          // Scroll to top to show success message
          scrollToTop();
          // Refresh profile data
          const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
          setProfileData(updatedProfile);
          setSavedSection(section);
          setShowSuccess(true);
        } else {
          toast.success('Changes submitted for admin review. They will appear once approved.');
          // Scroll to top to show success message
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
      
      // Parse the nested error structure
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
        
        // Scroll to top before showing error
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
          
          // Check if response contains pending request error
          const pendingError = isPendingRequestError(response);
          if (pendingError.isError) {
            // Scroll to top before showing error
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
            
            // Access properties directly from response
            if (response.pendingSellerId) {
              pendingSellerId = response.pendingSellerId;
            }
            
            // Get documents list directly from response
            if (response.documents && Array.isArray(response.documents)) {
              documentsList = response.documents;
            }
          }
          
          // Handle auto-approved case
          if (isAutoApproved || (!pendingSellerId && response && response.message)) {
            toast.success(response.message || 'Changes applied successfully!');
            // Scroll to top to show success message
            scrollToTop();
            const updatedProfile = await sellerProfileService.getCurrentSellerProfile();
            setProfileData(updatedProfile);
            setEditingSection(null);
            setSavedSection('all');
            setShowSuccess(true);
            return;
          }
          
          // Handle admin approval case
          if (pendingSellerId) {
            console.log('✅ OTP Flow - Step 1 complete. Pending Seller ID:', pendingSellerId);
            
            // Create a map of productTypeId -> pendingDocumentId
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
            const hasFilesToUpload = filesToUpload.gstFile || filesToUpload.bankFile || filesToUpload.companyCertFile || filesToUpload.licenses.length > 0;
            
            if (hasFilesToUpload) {
              console.log('📤 OTP Flow - Step 2: Uploading documents...');
              
              // Prepare licenses with their pending document IDs
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
                licenses: licensesWithIds
              });
              
              console.log('✅ OTP Flow - Document upload successful');
            }
            
            toast.success('Changes submitted for admin review.');
            // Scroll to top to show success message
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
            
            // Clear file selections
            setFormData(prev => ({
              ...prev,
              gstFile: null,
              companyRegistrationCertificateFile: null,
              cancelledChequeFile: null,
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
          
          // Parse the nested error structure
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
            
            // Scroll to top before showing error
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

  const handleDownload = async (fileUrl: string, fileName: string) => {
    // Don't download if URL is "PENDING"
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
    // Don't open if URL is "PENDING"
    if (fileUrl === "PENDING") {
      toast.error('File is pending upload. Please wait for admin approval.');
      return;
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="bg-secondary-50 min-h-screen w-full p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-neutral-100 rounded-xl"></div>
          <div className="h-48 bg-neutral-100 rounded-xl"></div>
          <div className="h-56 bg-neutral-100 rounded-xl"></div>
          <div className="h-40 bg-neutral-100 rounded-xl"></div>
          <div className="h-40 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-secondary-50 min-h-screen w-full p-6 space-y-6">
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
      <div className="bg-secondary-50 min-h-screen w-full p-6 space-y-6">
        {/* Pending Request Error Message - Auto dismisses after 10 seconds */}
        {pendingRequestError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex gap-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-red-800">Update Request Already Pending</p>
              <p className="text-sm text-red-700 whitespace-pre-line">{pendingRequestError}</p>
            </div>
            <button
              onClick={() => setPendingRequestError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* ✅ INACTIVE LICENSE ERROR BANNER */}
        {showInactiveError && inactiveLicenses.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
            <span className="text-red-500 text-xl mt-0.5">🚫</span>
            <div>
              <p className="text-red-700 font-semibold">
                Inactive/Expired license{inactiveLicenses.length > 1 ? "s" : ""} detected — cannot submit
              </p>
              <p className="text-red-600 text-sm mt-1">
                The following license{inactiveLicenses.length > 1 ? "s are" : " is"} inactive/expired. Please provide a valid, active license before submitting:
              </p>
              <ul className="mt-2 space-y-1">
                {inactiveLicenses.map((productName) => (
                  <li key={productName} className="text-red-600 text-sm font-medium flex items-center gap-1">
                    <span>•</span>
                    <span>{productName} License</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setShowInactiveError(false)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message - Only show when there's no pending error */}
        {!pendingRequestError && savedSection && showSuccess && (
          <div className="bg-success-50 border-l-4 border-success-300 p-4 rounded-md flex gap-2">
            <MdSchedule size={20} className="text-success-700 mt-1" />
            <div>
              <p className="text-lg font-semibold text-success-900">
                {savedSection === 'all' && savedSection ? 'Changes Submitted Successfully!' : 'Changes Applied!'}
              </p>
              <p className="text-sm text-success-800">
                {savedSection === 'all' && savedSection ? 
                  'Your changes have been saved and submitted for admin review. You\'ll receive a notification once they are approved.' :
                  'Your changes have been applied successfully.'}
              </p>
            </div>
          </div>
        )}

        {/* Admin Message when editing */}
        {editingSection && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex gap-2">
              <PiInfo size={24} className="text-yellow-700 mt-1" />
              <div>
                <p className="text-lg font-semibold text-yellow-800">
                  Admin Review Required
                </p>
                <p className="text-sm text-yellow-700">
                  Some changes made to your profile will be reviewed by an administrator
                  before they are reflected in the system. You will be notified once
                  your changes have been approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* COMPANY DETAILS - With the main Edit button */}
        <div className="bg-white rounded-xl overflow-hidden border border-grey-200">
          <div className="flex items-center justify-between px-6 py-4 bg-neutral-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary-100">
                <Building2 size={20} className="text-primary-900" />
              </div>
              <h2 className="font-semibold text-xl text-neutral-900">
                Seller Company Details
              </h2>
            </div>
            
            {/* Single Edit button */}
            {!editingSection ? (
              <button
                onClick={() => setEditingSection("editing")}
                className="flex items-center gap-2 bg-primary-900 text-white text-sm px-4 py-2 rounded-md hover:bg-primary-800 transition-colors"
              >
                <Pencil size={20} />
                Edit
              </button>
            ) : (
              <ChevronUp size={18} className="text-gray-600" />
            )}
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <Image
                  src="/icons/companylogo.png"
                  alt="Company Logo"
                  width={160}
                  height={160}
                  className="rounded-2xl shadow object-cover"
                />
                <p className="text-sm text-gray-600">Company Logo</p>
              </div>

              <hr />

              <div className="grid grid-cols-2 gap-6">
                <Input 
                  label="Seller Name/Company Name"
                  value={formData.sellerName}
                  editable={!!editingSection}
                  icon={<HiOutlineBuildingOffice2 />}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerName: e.target.value }))}
                />

                <SelectField
                  label="Company Type"
                  value={formData.companyTypeId?.toString()}
                  options={companyTypeOptions}
                  editable={!!editingSection}
                  onChange={handleCompanyTypeChange}
                  placeholder="Select Company Type"
                  isLoading={loadingStates.companyTypes}
                />

                <div className="col-span-2">
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                      Product Category
                      <span className="text-warning-500">*</span>
                    </label>
                    <div className="relative" ref={productDropdownRef}>
                      <div
                        className={`w-full h-14 px-4 rounded-xl border flex items-center justify-between cursor-pointer
                          ${editingSection 
                            ? "bg-white border-secondary-200 hover:border-primary-900" 
                            : "bg-neutral-50 border-neutral-100 cursor-not-allowed"
                          }`}
                        onClick={() => editingSection && setIsProductDropdownOpen(!isProductDropdownOpen)}
                      >
                        <span className={`${formData.productTypes.length === 0 ? "text-neutral-500" : "text-neutral-900"}`}>
                          {loadingStates.productTypes
                            ? "Loading product types..."
                            : formData.productTypes.length > 0
                            ? formData.productTypes.join(", ")
                            : "Select Product Types"}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {editingSection && isProductDropdownOpen && !loadingStates.productTypes && (
                        <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                          <div className="p-2 border-b border-neutral-200 sticky top-0 bg-white">
                            <p className="text-sm text-neutral-600 font-medium">
                              Select product types:
                            </p>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {productTypes.length > 0 && (
                              <div
                                className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200"
                                onClick={handleSelectAllProductTypes}
                              >
                                <input
                                  type="checkbox"
                                  checked={productTypes.length > 0 && formData.productTypes.length === productTypes.length}
                                  onChange={() => {}}
                                  className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
                                />
                                <label className="ml-3 text-sm font-medium text-[#4B0082] cursor-pointer">
                                  Select All
                                </label>
                              </div>
                            )}

                            {productTypes.map((product) => (
                              <div
                                key={product.productTypeId}
                                className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                                onClick={() => handleProductTypeToggle(product)}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.productTypeIds.includes(product.productTypeId)}
                                  onChange={() => {}}
                                  className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
                                />
                                <label className="ml-3 text-sm text-neutral-900 cursor-pointer">
                                  {product.productTypeName}
                                  {product.regulatoryCategory && (
                                    <span className="ml-2 text-xs text-[#4B0082]">
                                      ({product.regulatoryCategory})
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="p-2 border-t border-neutral-200 bg-purple-50 sticky bottom-0">
                            <p className="text-xs text-neutral-600">
                              {formData.productTypes.length} of {productTypes.length} selected
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <SelectField
                  label="Seller Type"
                  value={formData.sellerTypeId?.toString()}
                  options={sellerTypeOptions}
                  editable={false}
                  icon={<HiOutlineBuildingOffice2 />}
                  onChange={handleSellerTypeChange}
                  placeholder="Select Seller Type"
                  isLoading={loadingStates.sellerTypes}
                />

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
                />
              </div>

              <hr />

              <div>
                <div className="flex items-center gap-2 font-semibold text-sm mb-4">
                  <MapPin size={24} />
                  Company Address
                  <span className="text-red-500">*</span>
                </div>

                <div className="grid grid-cols-2 gap-6">
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
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />

                  <Input 
                    label="Street/Road/Lane" 
                    value={formData.street} 
                    editable={!!editingSection}
                    onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  />

                  <Input 
                    label="Building/House Number" 
                    value={formData.buildingNo} 
                    editable={!!editingSection}
                    onChange={(e) => setFormData(prev => ({ ...prev, buildingNo: e.target.value }))}
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
                    onChange={(e) => handleNumericInput(e, 'pincode', 6)}
                    maxLength={6}
                  />
                </div>
              </div>

              <hr />

              <div>
                <div className="flex items-center gap-2 font-semibold text-sm mb-4">
                  <Phone size={24} />
                  Contact Information
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Company Phone Number with Country Code and Validation */}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                      <Phone size={18} />
                      Company Phone Number
                      <span className="text-warning-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="w-24 h-14 px-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center">
                        <span className="text-neutral-700 font-medium">+91</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={handleCompanyPhoneChange}
                          onBlur={handleCompanyPhoneBlur}
                          disabled={!editingSection}
                          maxLength={10}
                          placeholder="9876543210"
                          className={`w-full h-14 px-4 rounded-xl text-[16px]
                            ${editingSection
                              ? `bg-white border ${companyPhoneError ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500'}`
                              : "bg-neutral-50 border border-neutral-100 cursor-not-allowed"
                            }`}
                        />
                        {companyPhoneError && (
                          <p className="mt-1 text-xs text-red-500">{companyPhoneError}</p>
                        )}
                        {editingSection && !companyPhoneError && formData.phone && formData.phone.length === 10 && (
                          <p className="mt-1 text-xs text-green-500">✓ Valid mobile number</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Input
                    label="Company Email ID"
                    value={formData.email}
                    editable={!!editingSection}
                    icon={<CiMail />}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    type="email"
                  />

                  <div className="col-span-2">
                    <Input
                      label="Company Website"
                      value={formData.website || ''}
                      editable={!!editingSection}
                      icon={<CiGlobe />}
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
        <SectionCard
          title="Company Coordinator Details"
          icon={<FaRegUser size={24} />}
          iconBg="bg-[#DCFCE7]"
          iconColor="text-neutral-900"
          underReview={reviewSections.includes("coordinator")}
        >
          <div className="grid grid-cols-2 gap-6">
            {/* ✅ UPDATED: Using handleAlphanumericInput for Coordinator Name */}
            <Input 
              label="Coordinator Name" 
              value={formData.coordinatorName} 
              editable={!!editingSection}
              maxLength={100}
              icon={<FaRegUser />}
              onChange={(e) => handleAlphanumericInput(e, 'coordinatorName')}
            />
            
            {/* ✅ UPDATED: Using handleAlphanumericInput for Coordinator Designation */}
            <Input 
              label="Coordinator Designation"
              value={formData.coordinatorDesignation} 
              editable={!!editingSection}
              maxLength={100}
              onChange={(e) => handleAlphanumericInput(e, 'coordinatorDesignation')}
            />

            <Input 
              label="Coordinator Email ID" 
              value={formData.coordinatorEmail} 
              editable={!!editingSection}
              icon={<CiMail />}
              onChange={(e) => setFormData(prev => ({ ...prev, coordinatorEmail: e.target.value }))}
              type="email"
            />

            {/* Coordinator Mobile Number with Country Code and Validation */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <Phone size={18} />
                Coordinator Mobile Number
                <span className="text-warning-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="w-24 h-14 px-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center">
                  <span className="text-neutral-700 font-medium">+91</span>
                </div>
                <div className="flex-1">
                  <input
                    type="tel"
                    value={formData.coordinatorMobile}
                    onChange={handleCoordinatorPhoneChange}
                    onBlur={handleCoordinatorPhoneBlur}
                    disabled={!editingSection}
                    maxLength={10}
                    placeholder="9876543210"
                    className={`w-full h-14 px-4 rounded-xl text-[16px]
                      ${editingSection
                        ? `bg-white border ${coordinatorPhoneError ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500'}`
                        : "bg-neutral-50 border border-neutral-100 cursor-not-allowed"
                      }`}
                  />
                  {coordinatorPhoneError && (
                    <p className="mt-1 text-xs text-red-500">{coordinatorPhoneError}</p>
                  )}
                  {editingSection && !coordinatorPhoneError && formData.coordinatorMobile && formData.coordinatorMobile.length === 10 && (
                    <p className="mt-1 text-xs text-green-500">✓ Valid mobile number</p>
                  )}
                </div>
              </div>
            </div>

            {(isCheckingEmail || isCheckingPhone) && (
              <div className="col-span-2">
                {isCheckingEmail && (
                  <p className="text-sm text-purple-600 flex items-center gap-1">
                    <span className="animate-spin">⏳</span> Checking email availability...
                  </p>
                )}
                {isCheckingPhone && (
                  <p className="text-sm text-purple-600 flex items-center gap-1">
                    <span className="animate-spin">⏳</span> Checking phone availability...
                  </p>
                )}
              </div>
            )}
            {emailExistsError && (
              <div className="col-span-2">
                <p className="text-sm text-red-500">{emailExistsError}</p>
              </div>
            )}
            {phoneExistsError && (
              <div className="col-span-2">
                <p className="text-sm text-red-500">{phoneExistsError}</p>
              </div>
            )}
          </div>
        </SectionCard>

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

          // Calculate current status based on dates
          const currentStatus = calculateLicenseStatus(licenseData.issueDate, licenseData.expiryDate);
          const isInactive = currentStatus === 'InActive';

          return (
            <div key={productName}>
              <SectionCard
                title={`${productName} License Details`}
                icon={<HiOutlineDocumentCheck size={20} />}
                iconBg="bg-[#F3E8FF]"
                iconColor="text-secondary-800"
                underReview={reviewSections.includes(`license-${index}`)}
              >
                {/* ✅ Inactive warning per license */}
                {isInactive && licenseData.issueDate && licenseData.expiryDate && (
                  <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <span className="text-red-500 text-base">⚠️</span>
                    <p className="text-red-600 text-sm font-medium">
                      {productName} License is inactive/expired. Please update with a valid license.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  {/* LICENSE NUMBER with validation */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-neutral-700">
                      License Number <span className="text-warning-500">*</span>
                    </label>
                    <div>
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
                        className={`w-full h-14 px-4 rounded-xl text-[16px] uppercase
                          ${editingSection
                            ? `bg-white border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${licenseErrors[productName] ? 'border-red-500' : ''}`
                            : "bg-neutral-50 border border-neutral-100 cursor-not-allowed"
                          }`}
                      />
                      {licenseErrors[productName] && (
                        <p className="mt-1 text-xs text-red-500 flex items-start">
                          <span className="mr-1">⚠️</span>
                          <span>{licenseErrors[productName]}</span>
                        </p>
                      )}
                      {/* {editingSection && !licenseErrors[productName] && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Use: A-Z, 0-9, /, - only | Examples: TN/CBE/20B-12345, MH-MZ2-123456
                        </p>
                      )} */}
                    </div>
                  </div>

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
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-neutral-700">
                      License Issue Date <span className="text-warning-500">*</span>
                    </label>
                    {editingSection ? (
                      <DatePicker
                        value={licenseData.issueDate}
                        onChange={(date) => handleIssueDateChange(date, productName)}
                        maxDate={new Date()}
                        format="dd/MM/yyyy"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            placeholder: "DD/MM/YYYY",
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                height: '56px',
                                borderRadius: '12px',
                                backgroundColor: '#FFFFFF',
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
                    ) : (
                      <div className="h-14 px-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center">
                        <IoCalendarOutline className="mr-2 text-neutral-600" />
                        <span>{licenseData.issueDate ? licenseData.issueDate.toLocaleDateString('en-GB') : '-'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-neutral-700">
                      License Expiry Date <span className="text-warning-500">*</span>
                    </label>
                    {editingSection ? (
                      <DatePicker
                        value={licenseData.expiryDate}
                        onChange={(date) => handleExpiryDateChange(date, productName)}
                        minDate={licenseData.issueDate || undefined}
                        format="dd/MM/yyyy"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            placeholder: "DD/MM/YYYY",
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                height: '56px',
                                borderRadius: '12px',
                                backgroundColor: '#FFFFFF',
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
                    ) : (
                      <div className="h-14 px-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center">
                        <IoCalendarOutline className="mr-2 text-neutral-600" />
                        <span>{licenseData.expiryDate ? licenseData.expiryDate.toLocaleDateString('en-GB') : '-'}</span>
                      </div>
                    )}
                  </div>

                  <Input
                    label="License Issuing Authority"
                    value={licenseData.issuingAuthority}
                    editable={!!editingSection}
                    icon={<Building2 size={18} />}
                    onChange={(e) => handleIssuingAuthorityChange(e, productName)}
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-neutral-700">
                      License Status
                    </label>
                    <div className="flex items-center h-14 px-4 rounded-xl bg-neutral-50 border border-neutral-100">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        currentStatus === 'Active' ? 'bg-success-50 text-success-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <GoCheckCircle size={16} />
                        <span className="text-sm font-medium">
                          {!licenseData.issueDate || !licenseData.expiryDate ? 'Pending' : currentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          );
        })}

        {/* GST Section */}
        <SectionCard
          title="GSTIN Details"
          icon={<FileText size={20} />}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          underReview={reviewSections.includes("gst")}
        >
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="GSTIN Number"
              value={formData.gstNumber}
              editable={!!editingSection}
              onChange={handleGSTChange}
              maxLength={15}
              className="uppercase"
            />

            <FileField
              key={formData.gstFileUrl} 
              label="GST Certificate"
              file={formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf'}
              fileUrl={formData.gstFileUrl}
              editable={!!editingSection}
              onDownload={() => handleDownload(formData.gstFileUrl || '#', formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf')}
              onView={() => handleViewInNewTab(formData.gstFileUrl || '#')}
              onFileSelect={(file: File) => handleGSTFileChange(file)}
            />
          </div>
        </SectionCard>

        {/* BANK */}
        <div>
          <SectionCard
            title="Bank Details"
            icon={<Landmark size={20} />}
            iconBg="bg-[#E0E7FF]"
            iconColor="text-secondary-800"
            underReview={reviewSections.includes("bank")}
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <Input 
                  label="Bank Name" 
                  value={formData.bankName} 
                  editable={false}
                />

                <Input 
                  label="Branch" 
                  value={formData.branch} 
                  editable={false}
                />

                <Input 
                  label="Account Number" 
                  value={formData.accountNumber} 
                  editable={!!editingSection}
                  onChange={(e) => handleNumericInput(e, 'accountNumber', 18)}
                  maxLength={18}
                />
              </div>

              <div className="space-y-6">
                <Input 
                  label="IFSC Code" 
                  value={formData.ifscCode} 
                  editable={!!editingSection}
                  onChange={(e) => handleIfscChange(e.target.value)}
                  maxLength={11}
                  className="uppercase"
                  error={ifscError}
                />

                <Input
                  label="Beneficiary Name"
                  value={formData.accountHolderName}
                  editable={!!editingSection}
                  onChange={(e) => handleAlphabetInput(e, 'accountHolderName')}
                />

                <FileField
                  key={formData.cancelledChequeFileUrl}
                  label="Cancelled Cheque / Bank Passbook"
                  file={formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf'}
                  fileUrl={formData.cancelledChequeFileUrl}
                  editable={!!editingSection}
                  onDownload={() => handleDownload(formData.cancelledChequeFileUrl || '#', formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf')}
                  onView={() => handleViewInNewTab(formData.cancelledChequeFileUrl || '#')}
                  onFileSelect={(file: File) => handleBankFileChange(file)}
                />
              </div>
            </div>
          </SectionCard>

          {/* Save/Cancel buttons - only show when editing */}
          {editingSection && (
            <div className="flex justify-between gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  console.log('Cancel clicked');
                  handleCancel();
                }}
                className="flex items-center gap-2 border-2 border-warning-500 text-warning-500 text-md font-semibold px-6 py-3 rounded-lg hover:bg-warning-50 transition-colors"
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
                className={`flex items-center gap-2 bg-primary-900 font-semibold text-white text-md px-6 py-3 rounded-lg transition-colors ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-800'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

        {/* OTP Modal */}
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
    <div className={`bg-white rounded-xl overflow-hidden border ${underReview ? "border-gray-200" : "border-gray-200"}`}>
      <div className="flex items-center justify-between px-6 py-4 bg-neutral-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <h2 className="font-semibold text-xl text-neutral-900">
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

// ✅ FIXED: Removed internal useState/useEffect so the Input is fully controlled.
// Previously, the component cached raw input in local state before the parent's
// onChange filter could clean it — allowing special characters like @#$% to display.
// Now value flows directly from props, so parent filters take effect immediately.
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
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
        {icon && (
          <span className="text-neutral-600 text-lg">
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
        className={`w-full h-14 px-4 rounded-xl text-[16px] ${className}
        ${editable
          ? "bg-white border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          : "bg-neutral-50 border border-neutral-100 cursor-not-allowed"
        }
        ${error ? "border-red-500 focus:ring-red-500" : ""}`}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  editable,
  icon,
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
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
        {icon && (
          <span className="text-neutral-600 text-lg">
            {icon}
          </span>
        )}
        {label}
        <span className="text-warning-500">*</span>
      </label>
      <div className="relative" ref={dropdownRef}>
        <div
          className={`w-full h-14 px-4 rounded-xl border flex items-center justify-between cursor-pointer overflow-hidden
            ${editable && !isDisabled
              ? "bg-white border-secondary-200 hover:border-primary-900" 
              : "bg-neutral-50 border-neutral-100 cursor-not-allowed"
          }`}
          onClick={() => {
            if (editable && !isDisabled && !isLoading) {
              setIsOpen(!isOpen);
            }
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            {icon && <span className="text-neutral-500 shrink-0">{icon}</span>}
            <span className={`${!selectedOption ? "text-neutral-500" : "text-neutral-900"} truncate`}>
              {isLoading ? "Loading..." : displayValue}
            </span>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-neutral-500 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>

        {isOpen && editable && !isDisabled && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {options.length > 0 ? (
                options.map((opt: any) => (
                  <div
                    key={opt.value}
                    className={`px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0
                      ${value === opt.value ? "bg-purple-50 text-primary-900 font-medium" : "text-neutral-900"}`}
                    onClick={() => handleSelect(opt.value, opt.label)}
                  >
                    <span className="text-sm">{opt.label}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
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
  fileUrl
}: any) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevEditableRef = useRef(editable);
  
  useEffect(() => {
    if (prevEditableRef.current === true && editable === false) {
      setSelectedFile(null);
    }
    prevEditableRef.current = editable;
  }, [editable]);

  useEffect(() => {
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
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
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
    : (file || (fileUrl && fileUrl !== "PENDING" ? fileUrl.split('/').pop() : 'No file chosen'));

  // Check if file is pending
  const isPending = fileUrl === "PENDING";

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-neutral-700">
          {label} <span className="text-warning-500">*</span>
        </label>
      )}
      
      {editable ? (
        <div className="flex items-center justify-between h-14 px-3 rounded-xl border-2 border-dashed border-primary-50 bg-primary-05">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-primary-900" />
            </div>
            <span className="text-[16px] text-neutral-800 truncate flex-1">
              {displayFileName}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReplaceClick}
            className="text-primary-900 text-md font-semibold hover:text-primary-700 transition-colors ml-3 shrink-0"
          >
            Click to replace
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between h-14 px-3 rounded-xl border-2 border-dashed border-primary-50 bg-primary-05">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-primary-900" />
            </div>
            <span className="text-[16px] text-neutral-800 truncate flex-1">
              {isPending ? "Pending Approval" : (displayFileName)}
            </span>
            {isPending && (
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                Pending Admin Approval
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            <button 
              onClick={onDownload} 
              className={`transition-colors ${isPending ? 'text-gray-400 cursor-not-allowed' : 'text-primary-900 hover:text-primary-700'}`}
              title="Download file"
              disabled={isPending}
            >
              <Download size={20} />
            </button>
            <button 
              onClick={onView} 
              className={`transition-colors ${isPending ? 'text-gray-400 cursor-not-allowed' : 'text-neutral-900 hover:text-neutral-700'}`}
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