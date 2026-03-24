"use client";

import React, { useState, useEffect, useRef } from "react";

import {
  Building2,
  Phone,
  MapPin,
  Landmark,
  Upload,
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

// import { SellerProfile, SellerDocument } from "@/src/types/seller/SellerProfileData";
import { 
  CompanyTypeResponse,
  SellerTypeResponse,
  ProductTypeResponse,
  StateResponse,
  DistrictResponse,
  TalukaResponse,
} from "@/src/types/seller/SellerRegMasterData";

import { 
  CompanySectionUpdate,
  CoordinatorSectionUpdate,
  GSTSectionUpdate,
  BankSectionUpdate,
  LicenseSectionUpdate , UpdateSellerProfileRequest
} from "@/src/types/seller/UpdateProfileData";

import { validateSection } from "@/src/schema/seller/UpdateProfileSchema";
import { ifscSchema } from "@/src/schema/seller/IFSCSchema";

import OtpVerificationModal from "./OtpVerificationModal";
import toast from "react-hot-toast";

export default function SellerProfile() {
  const [profileData, setProfileData] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [reviewSections, setReviewSections] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);

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
    
    // Licenses per product
    licenses: {} as Record<string, { 
      number: string; 
      file: File | null;
      fileUrl: string;
      issueDate: Date | null;
      expiryDate: Date | null;
      issuingAuthority: string;
      status: 'Active' | 'InActive' | '----';
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

  // Debug licenses
  useEffect(() => {
    console.log('📋 Current licenses in formData:', formData.licenses);
  }, [formData.licenses]);

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
          licenses[productName] = {
            documentId: doc.sellerDocumentsId,
            number: doc.documentNumber || "",
            file: null,
            fileUrl: doc.documentFileUrl || "",
            issueDate: doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null,
            expiryDate: doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null,
            issuingAuthority: doc.licenseIssuingAuthority || "",
            status: (doc.licenseStatus as 'Active' | 'InActive') || 'InActive',
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
    }
  };

  // Update the handleCancel function
  const handleCancel = () => {
    resetFormData();
    setEditingSection(null);
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
              licenses[productName] = {
                number: doc.documentNumber || "",
                file: null,
                fileUrl: doc.documentFileUrl || "",
                issueDate: doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null,
                expiryDate: doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null,
                issuingAuthority: doc.licenseIssuingAuthority || "",
                status: (doc.licenseStatus as 'Active' | 'Expired') || 
                       (doc.documentVerified ? 'Active' : 'Expired'),
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

  // License status calculator
  const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null, apiStatus?: string): 'Active' | 'InActive' => {
    if (apiStatus === 'Active' || apiStatus === 'InActive') {
      return apiStatus;
    }
    
    if (!issueDate || !expiryDate) return 'InActive';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDate);
    expDate.setHours(0, 0, 0, 0);
    return today <= expDate ? 'Active' : 'InActive';
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
        newLicenses[product.productTypeName] = {
          documentId: existingDoc.sellerDocumentsId,
          number: existingDoc.documentNumber || "",
          file: null,
          fileUrl: existingDoc.documentFileUrl || "",
          issueDate: existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null,
          expiryDate: existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null,
          issuingAuthority: existingDoc.licenseIssuingAuthority || "",
          status: (existingDoc.licenseStatus as 'Active' | 'InActive') || 'InActive',
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
          status: '----',
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
        newLicenses[name] = {
          documentId: existingDoc.sellerDocumentsId,
          number: existingDoc.documentNumber || "",
          file: null,
          fileUrl: existingDoc.documentFileUrl || "",
          issueDate: existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null,
          expiryDate: existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null,
          issuingAuthority: existingDoc.licenseIssuingAuthority || "",
          status: (existingDoc.licenseStatus as 'Active' | 'InActive') || '----',
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
          status: '----', 
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

  // File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, productName?: string) => {
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

    if (productName) {
      setFormData(prev => ({
        ...prev,
        licenses: {
          ...prev.licenses,
          [productName]: {
            ...prev.licenses[productName],
            file: file,
          },
        },
      }));
    } else if (field === 'gstFile') {
      setFormData(prev => ({ ...prev, gstFile: file }));
    } else if (field === 'cancelledChequeFile') {
      setFormData(prev => ({ ...prev, cancelledChequeFile: file }));
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
        updatedLicenses[productName] = {
          ...updatedLicenses[productName],
          issueDate: date,
        };
        if (updatedLicenses[productName].expiryDate) {
          updatedLicenses[productName].status = calculateLicenseStatus(
            date,
            updatedLicenses[productName].expiryDate
          );
        }
      }
      return { ...prev, licenses: updatedLicenses };
    });
  };

  const handleExpiryDateChange = (date: Date | null, productName: string) => {
    setFormData(prev => {
      const updatedLicenses = { ...prev.licenses };
      if (updatedLicenses[productName]) {
        updatedLicenses[productName] = {
          ...updatedLicenses[productName],
          expiryDate: date,
        };
        if (updatedLicenses[productName].issueDate) {
          updatedLicenses[productName].status = calculateLicenseStatus(
            updatedLicenses[productName].issueDate,
            date
          );
        }
      }
      return { ...prev, licenses: updatedLicenses };
    });
  };

  // Input handlers
  const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => {
    let value = e.target.value.replace(/\D/g, "");
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLicenseNumberChange = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
    setFormData(prev => ({
      ...prev,
      licenses: {
        ...prev.licenses,
        [productName]: {
          ...prev.licenses[productName],
          number: e.target.value,
        },
      },
    }));
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

const handleSaveAll = async () => {
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

      // ✅ ONLY include if this product type is still selected
      if (selectedProductTypeIds.has(productTypeId)) {
        // Get the license data from form (may contain updates)
        const licenseData = formData.licenses[productName] || {};
        
        documentsToSend.push({
          documentId: existingDoc.sellerDocumentsId,
          productTypeId: productTypeId,
          documentNumber: licenseData.number || existingDoc.documentNumber || '',
          documentFileUrl: licenseData.fileUrl || existingDoc.documentFileUrl || '',
          licenseIssueDate: licenseData.issueDate 
            ? formatDate(licenseData.issueDate) 
            : existingDoc.licenseIssueDate || '',
          licenseExpiryDate: licenseData.expiryDate 
            ? formatDate(licenseData.expiryDate) 
            : existingDoc.licenseExpiryDate || '',
          licenseIssuingAuthority: licenseData.issuingAuthority || existingDoc.licenseIssuingAuthority || '',
          // licenseStatus: licenseData.status || existingDoc.licenseStatus || 'InActive'
          licenseStatus: licenseData.status === '----' ? 'InActive' : (licenseData.status || existingDoc.licenseStatus || 'InActive')
        });
        
        processedProductTypeIds.add(productTypeId);
        console.log(`✅ Keeping document for product ${productTypeId}`);
      } else {
        console.log(`🗑️ Document for product ${productTypeId} will be REMOVED (not included in update)`);
        // ❌ DELETED - don't include in documentsToSend
      }
    }

    // 2. Add NEW documents (for selected product types that don't have documents yet)
    Object.entries(formData.licenses).forEach(([productName, licenseData]) => {
      const productType = productTypes.find(pt => pt.productTypeName === productName);
      if (!productType) return;
      
      // Only add if this product type is selected AND not already processed
      if (selectedProductTypeIds.has(productType.productTypeId) && 
          !processedProductTypeIds.has(productType.productTypeId)) {
        
        // Only add if it has some data
        const hasData = licenseData.number || 
                       licenseData.issueDate || 
                       licenseData.expiryDate || 
                       licenseData.issuingAuthority;
        
        if (hasData) {
          documentsToSend.push({
            productTypeId: productType.productTypeId,
            documentNumber: licenseData.number || '',
            documentFileUrl: licenseData.fileUrl || '',
            licenseIssueDate: licenseData.issueDate ? formatDate(licenseData.issueDate) : '',
            licenseExpiryDate: licenseData.expiryDate ? formatDate(licenseData.expiryDate) : '',
            licenseIssuingAuthority: licenseData.issuingAuthority || '',
            // licenseStatus: licenseData.status || 'InActive'
            licenseStatus: licenseData.status === '----' ? 'InActive' : (licenseData.status || 'InActive')
          });
          
          processedProductTypeIds.add(productType.productTypeId);
          console.log(`🆕 Adding NEW document for product ${productType.productTypeId}`);
        }
      }
    });

    // 3. Ensure productTypeIds matches what we're sending
    const allProductTypeIds = Array.from(selectedProductTypeIds);

    console.log('📦 Final documents to send:', documentsToSend.map(d => ({
      id: d.documentId || 'NEW',
      productId: d.productTypeId,
      number: d.documentNumber
    })));

    // 4. Build complete profile data
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
        bankDocumentFileUrl: formData.cancelledChequeFileUrl
      },
      
      gstNumber: formData.gstNumber,
      gstFileUrl: formData.gstFileUrl,
      
      documents: documentsToSend
    };

    // 5. Validate required fields
    const validationResult = validateSection('company', completeData);
    if (!validationResult.success) {
      toast.error(validationResult.error || 'Validation failed');
      return;
    }

    // 6. Check for coordinator changes
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

    // 7. Handle OTP if needed
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
      setPendingSectionData(completeData);
      setPendingSection('all');
      setShowOtpModal(true);
      return;
    }

    // 8. Save all sections
    console.log('💾 Saving with data:', completeData);
    
    const requestedBy = updateProfileService.getCurrentUserEmail();
    if (!requestedBy) {
      toast.error('User email not found');
      return;
    }

    const response = await updateProfileService.updateFullProfile(completeData, requestedBy);
    
    if (response) {
      console.log('✅ Update successful:', response);
      
      toast.success('Changes submitted for admin review.');
      
      setEditingSection(null);
      
      // Update review sections
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
    }

  } catch (error: any) {
    console.error('❌ Error in handleSaveAll:', error);
    console.error('❌ Error response:', error.response?.data);
    
    if (error.response?.status === 400) {
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
      toast.error(error.response?.data?.message || error.message || 'Failed to save changes');
    }
  } finally {
    setTimeout(() => {
      setShowSuccess(false);
      setSavedSection(null);
    }, 10000);
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
        
        // Always treat as pending update
        toast.success('Changes submitted for admin review. They will appear once approved.');
        
        // Close edit mode
        setEditingSection(null);
        
        // Add to review sections
        setReviewSections((prev) => {
          if (!prev.includes(section)) {
            return [...prev, section];
          }
          return prev;
        });
        
        // Show success message
        setSavedSection(section);
        setShowSuccess(true);
        
        // IMPORTANT: DO NOT refresh profile data
        // Keep the form data as-is with the changes the user just made
      }

    } catch (error: any) {
      console.error('❌ Error saving section:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to save changes');
    }

    setTimeout(() => {
      setShowSuccess(false);
      setSavedSection(null);
    }, 21000);
  };

  const handleOtpVerified = async (verified: { email: boolean; phone: boolean }) => {
    setShowOtpModal(false);
    
    if (pendingSection && pendingSectionData) {
      await performSave(pendingSection, pendingSectionData);
    }
    
    setPendingEmail(undefined);
    setPendingPhone(undefined);
    setPendingSectionData(null);
    setPendingSection(null);
  };

const handleDownload = async (fileUrl: string, fileName: string) => {
  try {
    // Show loading toast
    toast.loading('Downloading...', { id: 'download' });
    
    // Fetch the file first
    const response = await fetch(fileUrl, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    // Convert to blob
    const blob = await response.blob();
    
    // Create blob URL
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName; // This will now work for images too
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    window.URL.revokeObjectURL(blobUrl);
    
    // Success toast
    toast.success('Download complete!', { id: 'download' });
    
  } catch (error) {
    console.error('Download failed:', error);
    toast.error('Failed to download file. Please try again.', { id: 'download' });
    
    // Fallback: open in new tab if download fails
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
};

  const handleViewInNewTab = (fileUrl: string) => {
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

  const portalTarget = typeof window !== "undefined" ? document.body : null;

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      height: "56px",
      minHeight: "56px",
      borderRadius: "12px",
      borderColor: state.isFocused ? "#4B0082" : "#737373",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: "#4B0082",
      },
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "0 16px",
      cursor: "pointer",
      height: "56px",
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: "56px",
      cursor: "pointer",
    }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused ? "#4B0082" : "#737373",
      cursor: "pointer",
      "&:hover": {
        color: "#4B0082",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#4B0082"
        : state.isFocused
          ? "#F3E8FF"
          : "white",
      color: state.isSelected ? "white" : "#1E1E1E",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#4B0082",
        color: "white",
      },
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#A3A3A3",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#1E1E1E",
    }),
    input: (base: any) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
  };

  const selectWithIconStyles = {
    ...selectStyles,
    control: (base: any, state: any) => ({
      ...selectStyles.control(base, state),
      paddingLeft: "30px",
    }),
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="bg-secondary-50 min-h-screen w-full p-6 space-y-6">
        {/* Success Message */}
        {savedSection && showSuccess && (
          <div className="bg-success-50 border-l-4 border-success-300 p-4 rounded-md flex gap-2">
            <MdSchedule size={20} className="text-success-700 mt-1" />
            <div>
              <p className="text-lg font-semibold text-success-900">
                Changes Submitted Successfully!
              </p>
              <p className="text-sm text-success-800">
                Your changes have been saved and submitted for admin review.
                You&apos;ll receive a notification once they are approved and reflected
                in your profile.
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
                  All changes made to your profile will be reviewed by an administrator
                  before they are reflected in the system. You will be notified once
                  your changes have been approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* COMPANY DETAILS - With the main Edit button */}
        <div className="bg-white rounded-xl overflow-hidden  border border-grey-200">
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
                 // portalTarget={portalTarget}
                 // styles={selectWithIconStyles}
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

                      {isProductDropdownOpen && editingSection && !loadingStates.productTypes && (
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
                  editable={!!editingSection}
                  icon={<HiOutlineBuildingOffice2 />}
                  onChange={handleSellerTypeChange}
                  placeholder="Select Seller Type"
                  isLoading={loadingStates.sellerTypes}
                 // portalTarget={portalTarget}
                 // styles={selectWithIconStyles}
                />

                <FileField
  label="Company Type Certificate"
  file="company_registration_cert.pdf"
  fileUrl="/assets/docs/company-cert.pdf"
  editable={!!editingSection}
  onDownload={() => handleDownload('/assets/docs/company-cert.pdf', 'company_registration_cert.pdf')}
  onView={() => handleViewInNewTab('/assets/docs/company-cert.pdf')}
  onFileSelect={(file: File) => {
    setFormData(prev => ({ ...prev, companyCertFile: file }));
  }}
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
                  //  portalTarget={portalTarget}
                   // styles={selectWithIconStyles}
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
                   // portalTarget={portalTarget}
                   // styles={selectWithIconStyles}
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
                   // portalTarget={portalTarget}
                   // styles={selectWithIconStyles}
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
                  <Input
                    label="Company Phone Number"
                    value={formData.phone}
                    editable={!!editingSection}
                    icon={<Phone size={18} />}
                    onChange={(e) => handleNumericInput(e, 'phone', 10)}
                    maxLength={10}
                  />

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
            <Input 
              label="Coordinator Name" 
              value={formData.coordinatorName} 
              editable={!!editingSection}
              icon={<FaRegUser />}
              onChange={(e) => handleAlphabetInput(e, 'coordinatorName')}
            />
            <Input 
              label="Coordinator Designation"
              value={formData.coordinatorDesignation} 
              editable={!!editingSection}
              onChange={(e) => handleAlphabetInput(e, 'coordinatorDesignation')}
            />

            <Input 
              label="Coordinator Email ID" 
              value={formData.coordinatorEmail} 
              editable={!!editingSection}
              icon={<CiMail />}
              onChange={(e) => setFormData(prev => ({ ...prev, coordinatorEmail: e.target.value }))}
              type="email"
            />

            <Input 
              label="Coordinator Mobile Number" 
              value={formData.coordinatorMobile} 
              editable={!!editingSection}
              icon={<Phone size={18} />}
              onChange={(e) => handleNumericInput(e, 'coordinatorMobile', 10)}
              maxLength={10}
            />

            <FileField
              label="Authorization Letter"
              file="authorization_letter.pdf"
              editable={!!editingSection}
              onDownload={() => handleDownload('/assets/docs/auth-letter.pdf', 'authorization_letter.pdf')}
              onView={() => handleViewInNewTab('/assets/docs/auth-letter.pdf')}
            />

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
    status: 'Expired'
  };

  return (
    <div key={productName}>
      <SectionCard
        title={`${productName} License Details`}
        icon={<HiOutlineDocumentCheck size={20} />}
        iconBg="bg-[#F3E8FF]"
        iconColor="text-secondary-800"
        underReview={reviewSections.includes(`license-${index}`)}
      >
        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="License Number" 
            value={licenseData.number} 
            editable={!!editingSection}
            onChange={(e) => handleLicenseNumberChange(e, productName)}
          />

          {/* License Copy FileField - works in both edit and view mode */}
          <FileField
          key={licenseData.fileUrl}
            label="License Copy"
            file={licenseData.fileUrl?.split('/').pop() || 'Upload Document'}
            fileUrl={licenseData.fileUrl}
            editable={!!editingSection}
            onDownload={() => handleDownload(licenseData.fileUrl || '#', licenseData.fileUrl?.split('/').pop() || 'license.pdf')}
            onView={() => handleViewInNewTab(licenseData.fileUrl || '#')}
            onFileSelect={(file: File) => {
              setFormData(prev => ({
                ...prev,
                licenses: {
                  ...prev.licenses,
                  [productName]: {
                    ...prev.licenses[productName],
                    file: file,
                  },
                },
              }));
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
                licenseData.status === 'Active' ? 'bg-success-50 text-success-700' : 'bg-orange-50 text-orange-700'
              }`}>
                <GoCheckCircle size={16} />
                <span className="text-sm font-medium">{licenseData.status}</span>
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

    {/* Use FileField for GST Certificate */}
    <FileField
    key={formData.gstFileUrl} 
      label="GST Certificate"
      file={formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf'}
      fileUrl={formData.gstFileUrl}
      editable={!!editingSection}
      onDownload={() => handleDownload(formData.gstFileUrl || '#', formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf')}
      onView={() => handleViewInNewTab(formData.gstFileUrl || '#')}
      onFileSelect={(file: File) => setFormData(prev => ({ ...prev, gstFile: file }))}
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

        {/* Cancelled Cheque FileField */}
        <FileField
        key={formData.cancelledChequeFileUrl}
          label="Cancelled Cheque / Bank Passbook"
          file={formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf'}
          fileUrl={formData.cancelledChequeFileUrl}
          editable={!!editingSection}
          onDownload={() => handleDownload(formData.cancelledChequeFileUrl || '#', formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf')}
          onView={() => handleViewInNewTab(formData.cancelledChequeFileUrl || '#')}
          onFileSelect={(file: File) => setFormData(prev => ({ ...prev, cancelledChequeFile: file }))}
        />
      </div>
    </div>
  </SectionCard>

  {/* Save/Cancel buttons - only show when editing */}
  {editingSection && (
    <div className="flex justify-between gap-4 mt-6">
      <button
        onClick={handleCancel}
        className="flex items-center gap-2 border-2 border-warning-500 text-warning-500 text-md font-semibold px-6 py-3 rounded-lg"
      >
        Cancel
      </button>
      <button
        onClick={handleSaveAll}
        className="flex items-center gap-2 bg-primary-900 font-semibold text-white text-md px-6 py-3 rounded-lg"
      >
        Submit
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
  hideAsterisk = false 
}: InputProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
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
        {!hideAsterisk && <span className="text-warning-500">*</span>}
      </label>
      <input
        type={type}
        value={inputValue}
        onChange={handleChange}
        disabled={!editable}
        maxLength={maxLength}
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get selected option label
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
        {/* Main select button */}
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

        {/* Dropdown menu */}
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

  // Reset selected file when editable changes from true to false (when cancel is clicked)
  const prevEditableRef = useRef(editable);
  useEffect(() => {
    // If we're going from edit mode to view mode (cancel clicked)
    if (prevEditableRef.current === true && editable === false) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFile(null);
    }
    prevEditableRef.current = editable;
  }, [editable]);

  // Also reset when fileUrl changes (for license sections)
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

  // Determine which filename to show
  const displayFileName = selectedFile 
    ? selectedFile.name 
    : (file || (fileUrl ? fileUrl.split('/').pop() : 'No file chosen'));

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-neutral-700">
          {label} <span className="text-warning-500">*</span>
        </label>
      )}
      
      {editable ? (
        // Edit mode - show file name and replace option
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
        // View mode - show file with download/view options
        <div className="flex items-center justify-between h-14 px-3 rounded-xl border-2 border-dashed border-primary-50 bg-primary-05">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-primary-900" />
            </div>
            <span className="text-[16px] text-neutral-800 truncate flex-1">
              {file || (fileUrl ? fileUrl.split('/').pop() : 'No file uploaded')}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            <button 
              onClick={onDownload} 
              className="text-primary-900 hover:text-primary-700 transition-colors"
              title="Download file"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={onView} 
              className="text-neutral-900 hover:text-neutral-700 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}















// this code is without bug fixed...........

// "use client";

// import { useState, useEffect, useRef } from "react";

// import {
//   Building2,
//   Phone,
//   MapPin,
//   Landmark,
//   Upload,
//   Download,
//   ExternalLink,
//   Pencil,
//   ChevronUp,
//   FileText,
//   ChevronDown
// } from "lucide-react";
// import { GoCheckCircle } from "react-icons/go";
// import { PiInfo } from "react-icons/pi";
// import { MdSchedule } from "react-icons/md";
// import { HiOutlineBuildingOffice2, HiOutlineDocumentCheck } from "react-icons/hi2";
// import { CiMail, CiGlobe } from "react-icons/ci";
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

// // import { SellerProfile, SellerDocument } from "@/src/types/seller/SellerProfileData";
// import { 
//   CompanyTypeResponse,
//   SellerTypeResponse,
//   ProductTypeResponse,
//   StateResponse,
//   DistrictResponse,
//   TalukaResponse,
// } from "@/src/types/seller/SellerRegMasterData";

// import { 
//   CompanySectionUpdate,
//   CoordinatorSectionUpdate,
//   GSTSectionUpdate,
//   BankSectionUpdate,
//   LicenseSectionUpdate , UpdateSellerProfileRequest
// } from "@/src/types/seller/UpdateProfileData";

// import { validateSection } from "@/src/schema/seller/UpdateProfileSchema";
// import { ifscSchema } from "@/src/schema/seller/IFSCSchema";

// import OtpVerificationModal from "./OtpVerificationModal";
// import toast from "react-hot-toast";

// export default function SellerProfile() {
//   const [profileData, setProfileData] = useState<SellerProfile | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // Edit states
//   const [editingSection, setEditingSection] = useState<string | null>(null);
//   const [reviewSections, setReviewSections] = useState<string[]>([]);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [savedSection, setSavedSection] = useState<string | null>(null);

//   // OTP Modal states
//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [pendingEmail, setPendingEmail] = useState<string | undefined>();
//   const [pendingPhone, setPendingPhone] = useState<string | undefined>();
//   const [pendingSectionData, setPendingSectionData] = useState<any>(null);
//   const [pendingSection, setPendingSection] = useState<string | null>(null);

//   // Product dropdown state
//   const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
//   const productDropdownRef = useRef<HTMLDivElement>(null);

//   // Master Data States
//   const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([]);
//   const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([]);
//   const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([]);
//   const [states, setStates] = useState<StateResponse[]>([]);
//   const [districts, setDistricts] = useState<DistrictResponse[]>([]);
//   const [talukas, setTalukas] = useState<TalukaResponse[]>([]);

//   // Loading States for master data
//   const [loadingStates, setLoadingStates] = useState({
//     companyTypes: true,
//     sellerTypes: true,
//     productTypes: true,
//     states: true,
//     districts: false,
//     talukas: false,
//   });

//   // IFSC error state
//   const [ifscError, setIfscError] = useState("");

//   // Email/Phone validation states
//   const [isCheckingEmail, setIsCheckingEmail] = useState(false);
//   const [emailExistsError, setEmailExistsError] = useState("");
//   const [isCheckingPhone, setIsCheckingPhone] = useState(false);
//   const [phoneExistsError, setPhoneExistsError] = useState("");

//   // Form State for editing
//   const [formData, setFormData] = useState({
//     // IDs for submission
//     companyTypeId: 0,
//     sellerTypeId: 0,
//     productTypeIds: [] as number[],
//     stateId: 0,
//     districtId: 0,
//     talukaId: 0,
    
//     // Display values
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
    
//     // Coordinator
//     coordinatorName: "",
//     coordinatorDesignation: "",
//     coordinatorEmail: "",
//     coordinatorMobile: "",
    
//     // GST
//     gstNumber: "",
//     gstFile: null as File | null,
//     gstFileUrl: "",
    
//     // Licenses per product
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
    
//     // Bank details
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

//   // Debug licenses
//   useEffect(() => {
//     console.log('📋 Current licenses in formData:', formData.licenses);
//   }, [formData.licenses]);

//   // Close dropdown when clicking outside
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

//   // Fetch master data on mount
//   useEffect(() => {
//     fetchCompanyTypes();
//     fetchStates();
//     fetchSellerTypes();
//     fetchProductTypes();
//   }, []);

//   const resetFormData = () => {
//     if (profileData) {
//       // Re-initialize licenses from documents with all fields
//       const licenses: Record<string, any> = {};
//       profileData.documents.forEach((doc: SellerDocument) => {
//         const productName = doc.productTypes?.productTypeName;
//         if (productName) {
//           licenses[productName] = {
//             documentId: doc.sellerDocumentsId,
//             number: doc.documentNumber || "",
//             file: null,
//             fileUrl: doc.documentFileUrl || "",
//             issueDate: doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null,
//             expiryDate: doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null,
//             issuingAuthority: doc.licenseIssuingAuthority || "",
//             status: (doc.licenseStatus as 'Active' | 'InActive') || 'InActive',
//             productTypeId: doc.productTypes?.productTypeId || 0
//           };
//         }
//       });

//       setFormData({
//         // IDs
//         companyTypeId: profileData.companyType?.companyTypeId || 0,
//         sellerTypeId: profileData.sellerType?.sellerTypeId || 0,
//         productTypeIds: profileData.productTypes.map(pt => pt.productTypeId),
//         stateId: profileData.address?.state?.stateId || 0,
//         districtId: profileData.address?.district?.districtId || 0,
//         talukaId: profileData.address?.taluka?.talukaId || 0,
        
//         // Display values
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
        
//         // Coordinator
//         coordinatorName: profileData.coordinator?.name || '',
//         coordinatorDesignation: profileData.coordinator?.designation || '',
//         coordinatorEmail: profileData.coordinator?.email || '',
//         coordinatorMobile: profileData.coordinator?.mobile || '',
        
//         // GST
//         gstNumber: profileData.sellerGST?.gstNumber || '',
//         gstFile: null,
//         gstFileUrl: profileData.sellerGST?.gstFileUrl || '',
        
//         // Licenses
//         licenses,
        
//         // Bank details
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
//     }
//   };

//   // Update the handleCancel function
//   const handleCancel = () => {
//     resetFormData();
//     setEditingSection(null);
//   };

//   // Master data fetch functions
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

//   // Fetch profile data
//   useEffect(() => {
//     const loadProfileData = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
        
//         const data = await sellerProfileService.getCurrentSellerProfile();
//         setProfileData(data);
        
//         // Initialize form data with current values
//         if (data) {
//           // Initialize licenses from documents with all fields
//           const licenses: Record<string, any> = {};
//           data.documents.forEach((doc: SellerDocument) => {
//             const productName = doc.productTypes?.productTypeName;
//             if (productName) {
//               licenses[productName] = {
//                 number: doc.documentNumber || "",
//                 file: null,
//                 fileUrl: doc.documentFileUrl || "",
//                 issueDate: doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null,
//                 expiryDate: doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null,
//                 issuingAuthority: doc.licenseIssuingAuthority || "",
//                 status: (doc.licenseStatus as 'Active' | 'Expired') || 
//                        (doc.documentVerified ? 'Active' : 'Expired'),
//                 productTypeId: doc.productTypes?.productTypeId || 0
//               };
//             }
//           });

//           setFormData({
//             // IDs
//             companyTypeId: data.companyType?.companyTypeId || 0,
//             sellerTypeId: data.sellerType?.sellerTypeId || 0,
//             productTypeIds: data.productTypes.map(pt => pt.productTypeId),
//             stateId: data.address?.state?.stateId || 0,
//             districtId: data.address?.district?.districtId || 0,
//             talukaId: data.address?.taluka?.talukaId || 0,
            
//             // Display values
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
            
//             // Coordinator
//             coordinatorName: data.coordinator?.name || '',
//             coordinatorDesignation: data.coordinator?.designation || '',
//             coordinatorEmail: data.coordinator?.email || '',
//             coordinatorMobile: data.coordinator?.mobile || '',
            
//             // GST
//             gstNumber: data.sellerGST?.gstNumber || '',
//             gstFile: null,
//             gstFileUrl: data.sellerGST?.gstFileUrl || '',
            
//             // Licenses
//             licenses,
            
//             // Bank details
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

//           // Fetch districts and talukas if state and district exist
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

//   // License status calculator
//   const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null, apiStatus?: string): 'Active' | 'InActive' => {
//     if (apiStatus === 'Active' || apiStatus === 'InActive') {
//       return apiStatus;
//     }
    
//     if (!issueDate || !expiryDate) return 'InActive';
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const expDate = new Date(expiryDate);
//     expDate.setHours(0, 0, 0, 0);
//     return today <= expDate ? 'Active' : 'InActive';
//   };

//   // Product selection handlers
//   const handleProductTypeToggle = (product: ProductTypeResponse) => {
//   if (!product) return;
  
//   setFormData(prev => {
//     let newProductTypeIds = [...prev.productTypeIds];
//     let newProductTypes = [...prev.productTypes];
//     const newLicenses = { ...prev.licenses };

//     if (newProductTypeIds.includes(product.productTypeId)) {
//       // Removing product
//       newProductTypeIds = newProductTypeIds.filter(id => id !== product.productTypeId);
//       newProductTypes = newProductTypes.filter(name => name !== product.productTypeName);
//       delete newLicenses[product.productTypeName];
//     } else {
//       // Adding product - FIRST CHECK IF IT ALREADY EXISTS IN PROFILE
//       newProductTypeIds.push(product.productTypeId);
//       newProductTypes.push(product.productTypeName);
      
//       // Check if this product already has a document in the current profile
//       const existingDoc = profileData?.documents.find(
//         doc => doc.productTypes?.productTypeId === product.productTypeId
//       );
      
//       if (existingDoc) {
//         // ✅ If it exists, use the existing data (preserves documentId, number, dates, etc.)
//         newLicenses[product.productTypeName] = {
//           documentId: existingDoc.sellerDocumentsId,
//           number: existingDoc.documentNumber || "",
//           file: null,
//           fileUrl: existingDoc.documentFileUrl || "",
//           issueDate: existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null,
//           expiryDate: existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null,
//           issuingAuthority: existingDoc.licenseIssuingAuthority || "",
//           status: (existingDoc.licenseStatus as 'Active' | 'InActive') || 'InActive',
//           productTypeId: product.productTypeId
//         };
//       } else {
//         // ✅ If it's truly new, create empty license with correct status format
//         newLicenses[product.productTypeName] = { 
//           number: "", 
//           file: null,
//           fileUrl: "",
//           issueDate: null,
//           expiryDate: null,
//           issuingAuthority: "",
//           status: 'InActive',
//           productTypeId: product.productTypeId
//         };
//       }
//     }

//     return {
//       ...prev,
//       productTypeIds: newProductTypeIds,
//       productTypes: newProductTypes,
//       licenses: newLicenses,
//     };
//   });
// };

//   const handleSelectAllProductTypes = () => {
//   if (!productTypes.length) return;
  
//   if (formData.productTypes.length === productTypes.length) {
//     // Deselect all
//     setFormData(prev => ({
//       ...prev,
//       productTypeIds: [],
//       productTypes: [],
//       licenses: {},
//     }));
//   } else {
//     // Select all - preserve existing document data
//     const allIds = productTypes.map(p => p.productTypeId);
//     const allNames = productTypes.map(p => p.productTypeName);
    
//     const newLicenses: Record<string, any> = {};
    
//     allNames.forEach(name => {
//       const product = productTypes.find(p => p.productTypeName === name);
//       if (!product) return;
      
//       // Check if this product already has a document
//       const existingDoc = profileData?.documents.find(
//         doc => doc.productTypes?.productTypeId === product.productTypeId
//       );
      
//       if (existingDoc) {
//         // Use existing data
//         newLicenses[name] = {
//           documentId: existingDoc.sellerDocumentsId,
//           number: existingDoc.documentNumber || "",
//           file: null,
//           fileUrl: existingDoc.documentFileUrl || "",
//           issueDate: existingDoc.licenseIssueDate ? new Date(existingDoc.licenseIssueDate) : null,
//           expiryDate: existingDoc.licenseExpiryDate ? new Date(existingDoc.licenseExpiryDate) : null,
//           issuingAuthority: existingDoc.licenseIssuingAuthority || "",
//           status: (existingDoc.licenseStatus as 'Active' | 'InActive') || 'InActive',
//           productTypeId: product.productTypeId
//         };
//       } else {
//         // New product - empty license with correct status
//         newLicenses[name] = { 
//           number: "", 
//           file: null,
//           fileUrl: "",
//           issueDate: null,
//           expiryDate: null,
//           issuingAuthority: "",
//           status: 'InActive', 
//           productTypeId: product.productTypeId
//         };
//       }
//     });
    
//     setFormData(prev => ({
//       ...prev,
//       productTypeIds: allIds,
//       productTypes: allNames,
//       licenses: newLicenses,
//     }));
//   }
// };

//   // State/District/Taluka handlers
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

//   // Company type handler
//   const handleCompanyTypeChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedCompany = companyTypes.find(c => c.companyTypeId === selectedId);
    
//     setFormData(prev => ({
//       ...prev,
//       companyTypeId: selectedId,
//       companyType: selectedCompany?.companyTypeName || "",
//     }));
//   };

//   // Seller type handler
//   const handleSellerTypeChange = (selected: any) => {
//     const selectedId = selected ? parseInt(selected.value) : 0;
//     const selectedSeller = sellerTypes.find(s => s.sellerTypeId === selectedId);
    
//     setFormData(prev => ({
//       ...prev,
//       sellerTypeId: selectedId,
//       sellerType: selectedSeller?.sellerTypeName || "",
//     }));
//   };

//   // GST handler
//   const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value.toUpperCase();
//     value = value.replace(/[^0-9A-Z]/g, '');
//     if (value.length > 15) value = value.slice(0, 15);
//     setFormData(prev => ({ ...prev, gstNumber: value }));
//   };

//   // IFSC handler with auto-fill
//   const handleIfscChange = async (value: string) => {
//     const ifsc = value.toUpperCase();
//     setFormData(prev => ({ ...prev, ifscCode: ifsc }));
//     setIfscError("");

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

//     const parseResult = ifscSchema.safeParse(ifsc);
//     if (!parseResult.success) {
//       setIfscError(parseResult.error.issues[0].message);
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

//   // Coordinator email/phone check functions
//   const checkCoordinatorEmailExists = async (email: string): Promise<boolean> => {
//     if (!email || !email.includes('@') || !email.includes('.')) {
//       setEmailExistsError("");
//       return false;
//     }
    
//     setIsCheckingEmail(true);
//     setEmailExistsError("");
    
//     try {
//       const exists = await sellerRegService.checkCoordinatorEmail(email);
//       if (exists) {
//         setEmailExistsError("This email is already registered. Please use a different email address.");
//         return true;
//       }
//       setEmailExistsError("");
//       return false;
//     } catch (error: any) {
//       console.error("Error checking email:", error);
//       setEmailExistsError(error.message || "Failed to verify email");
//       return false;
//     } finally {
//       setIsCheckingEmail(false);
//     }
//   };

//   const checkCoordinatorPhoneExists = async (phone: string): Promise<boolean> => {
//     const cleanPhone = phone.replace(/\D/g, '');
//     if (!cleanPhone || cleanPhone.length !== 10) {
//       setPhoneExistsError("");
//       return false;
//     }
    
//     setIsCheckingPhone(true);
//     setPhoneExistsError("");
    
//     try {
//       const exists = await sellerRegService.checkCoordinatorPhone(cleanPhone);
//       if (exists) {
//         setPhoneExistsError("This phone number is already registered. Please use a different number.");
//         return true;
//       }
//       setPhoneExistsError("");
//       return false;
//     } catch (error: any) {
//       console.error("Error checking phone:", error);
//       setPhoneExistsError(error.message || "Failed to verify phone");
//       return false;
//     } finally {
//       setIsCheckingPhone(false);
//     }
//   };

//   // File upload handlers
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, productName?: string) => {
//     const { files } = e.target;
//     if (!files || !files[0]) return;

//     const file = files[0];
    
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("File size should be less than 5MB");
//       return;
//     }
    
//     const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
//     if (!allowedTypes.includes(file.type)) {
//       toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
//       return;
//     }

//     if (productName) {
//       setFormData(prev => ({
//         ...prev,
//         licenses: {
//           ...prev.licenses,
//           [productName]: {
//             ...prev.licenses[productName],
//             file: file,
//           },
//         },
//       }));
//     } else if (field === 'gstFile') {
//       setFormData(prev => ({ ...prev, gstFile: file }));
//     } else if (field === 'cancelledChequeFile') {
//       setFormData(prev => ({ ...prev, cancelledChequeFile: file }));
//     }
//   };

//   // Date handlers for licenses
//   const handleIssueDateChange = (date: Date | null, productName: string) => {
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
//         updatedLicenses[productName] = {
//           ...updatedLicenses[productName],
//           issueDate: date,
//         };
//         if (updatedLicenses[productName].expiryDate) {
//           updatedLicenses[productName].status = calculateLicenseStatus(
//             date,
//             updatedLicenses[productName].expiryDate
//           );
//         }
//       }
//       return { ...prev, licenses: updatedLicenses };
//     });
//   };

//   const handleExpiryDateChange = (date: Date | null, productName: string) => {
//     setFormData(prev => {
//       const updatedLicenses = { ...prev.licenses };
//       if (updatedLicenses[productName]) {
//         updatedLicenses[productName] = {
//           ...updatedLicenses[productName],
//           expiryDate: date,
//         };
//         if (updatedLicenses[productName].issueDate) {
//           updatedLicenses[productName].status = calculateLicenseStatus(
//             updatedLicenses[productName].issueDate,
//             date
//           );
//         }
//       }
//       return { ...prev, licenses: updatedLicenses };
//     });
//   };

//   // Input handlers
//   const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
//     const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => {
//     let value = e.target.value.replace(/\D/g, "");
//     if (maxLength && value.length > maxLength) {
//       value = value.substring(0, maxLength);
//     }
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleLicenseNumberChange = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           number: e.target.value,
//         },
//       },
//     }));
//   };

//   const handleIssuingAuthorityChange = (e: React.ChangeEvent<HTMLInputElement>, productName: string) => {
//     setFormData(prev => ({
//       ...prev,
//       licenses: {
//         ...prev.licenses,
//         [productName]: {
//           ...prev.licenses[productName],
//           issuingAuthority: e.target.value,
//         },
//       },
//     }));
//   };

// const handleSaveAll = async () => {
//   try {
//     let needsEmailVerification = false;
//     let needsPhoneVerification = false;
//     let newEmail = '';
//     let newPhone = '';

//     // Helper function to format dates to YYYY-MM-DD
//     const formatDate = (date: Date | null | string): string => {
//       if (!date) return '';
//       if (typeof date === 'string') return date;
//       const d = new Date(date);
//       const year = d.getFullYear();
//       const month = String(d.getMonth() + 1).padStart(2, '0');
//       const day = String(d.getDate()).padStart(2, '0');
//       return `${year}-${month}-${day}`;
//     };

//     // Get current profile documents
//     const currentDocs = profileData?.documents || [];
    
//     // Get currently SELECTED product types from form
//     const selectedProductTypeIds = new Set(formData.productTypeIds);
    
//     console.log('📦 Selected product types:', Array.from(selectedProductTypeIds));
//     console.log('📦 Current documents:', currentDocs.map(d => d.productTypes?.productTypeId));

//     // Build documents array - ONLY include documents for SELECTED product types
//     const documentsToSend = [];
//     const processedProductTypeIds = new Set<number>();

//     // 1. Add existing documents ONLY if their product type is still selected
//     for (const existingDoc of currentDocs) {
//       const productTypeId = existingDoc.productTypes?.productTypeId;
//       const productName = existingDoc.productTypes?.productTypeName;
      
//       if (!productTypeId || !productName) {
//         console.warn('⚠️ Skipping document with missing product info:', existingDoc);
//         continue;
//       }

//       // ✅ ONLY include if this product type is still selected
//       if (selectedProductTypeIds.has(productTypeId)) {
//         // Get the license data from form (may contain updates)
//         const licenseData = formData.licenses[productName] || {};
        
//         documentsToSend.push({
//           documentId: existingDoc.sellerDocumentsId,
//           productTypeId: productTypeId,
//           documentNumber: licenseData.number || existingDoc.documentNumber || '',
//           documentFileUrl: licenseData.fileUrl || existingDoc.documentFileUrl || '',
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
//         console.log(`✅ Keeping document for product ${productTypeId}`);
//       } else {
//         console.log(`🗑️ Document for product ${productTypeId} will be REMOVED (not included in update)`);
//         // ❌ DELETED - don't include in documentsToSend
//       }
//     }

//     // 2. Add NEW documents (for selected product types that don't have documents yet)
//     Object.entries(formData.licenses).forEach(([productName, licenseData]) => {
//       const productType = productTypes.find(pt => pt.productTypeName === productName);
//       if (!productType) return;
      
//       // Only add if this product type is selected AND not already processed
//       if (selectedProductTypeIds.has(productType.productTypeId) && 
//           !processedProductTypeIds.has(productType.productTypeId)) {
        
//         // Only add if it has some data
//         const hasData = licenseData.number || 
//                        licenseData.issueDate || 
//                        licenseData.expiryDate || 
//                        licenseData.issuingAuthority;
        
//         if (hasData) {
//           documentsToSend.push({
//             productTypeId: productType.productTypeId,
//             documentNumber: licenseData.number || '',
//             documentFileUrl: licenseData.fileUrl || '',
//             licenseIssueDate: licenseData.issueDate ? formatDate(licenseData.issueDate) : '',
//             licenseExpiryDate: licenseData.expiryDate ? formatDate(licenseData.expiryDate) : '',
//             licenseIssuingAuthority: licenseData.issuingAuthority || '',
//             licenseStatus: licenseData.status || 'InActive'
//           });
          
//           processedProductTypeIds.add(productType.productTypeId);
//           console.log(`🆕 Adding NEW document for product ${productType.productTypeId}`);
//         }
//       }
//     });

//     // 3. Ensure productTypeIds matches what we're sending
//     const allProductTypeIds = Array.from(selectedProductTypeIds);

//     console.log('📦 Final documents to send:', documentsToSend.map(d => ({
//       id: d.documentId || 'NEW',
//       productId: d.productTypeId,
//       number: d.documentNumber
//     })));

//     // 4. Build complete profile data
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
//         bankDocumentFileUrl: formData.cancelledChequeFileUrl
//       },
      
//       gstNumber: formData.gstNumber,
//       gstFileUrl: formData.gstFileUrl,
      
//       documents: documentsToSend
//     };

//     // 5. Validate required fields
//     const validationResult = validateSection('company', completeData);
//     if (!validationResult.success) {
//       toast.error(validationResult.error || 'Validation failed');
//       return;
//     }

//     // 6. Check for coordinator changes
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

//     // 7. Handle OTP if needed
//     if (needsEmailVerification || needsPhoneVerification) {
//       if (needsEmailVerification && newEmail) {
//         const emailExists = await checkCoordinatorEmailExists(newEmail);
//         if (emailExists) {
//           toast.error("This email is already registered.");
//           return;
//         }
//       }
//       if (needsPhoneVerification && newPhone) {
//         const phoneExists = await checkCoordinatorPhoneExists(newPhone);
//         if (phoneExists) {
//           toast.error("This phone number is already registered.");
//           return;
//         }
//       }

//       setPendingEmail(needsEmailVerification ? newEmail : undefined);
//       setPendingPhone(needsPhoneVerification ? newPhone : undefined);
//       setPendingSectionData(completeData);
//       setPendingSection('all');
//       setShowOtpModal(true);
//       return;
//     }

//     // 8. Save all sections
//     console.log('💾 Saving with data:', completeData);
    
//     const requestedBy = updateProfileService.getCurrentUserEmail();
//     if (!requestedBy) {
//       toast.error('User email not found');
//       return;
//     }

//     const response = await updateProfileService.updateFullProfile(completeData, requestedBy);
    
//     if (response) {
//       console.log('✅ Update successful:', response);
      
//       toast.success('Changes submitted for admin review.');
      
//       setEditingSection(null);
      
//       // Update review sections
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
//     }

//   } catch (error: any) {
//     console.error('❌ Error in handleSaveAll:', error);
//     console.error('❌ Error response:', error.response?.data);
    
//     if (error.response?.status === 400) {
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
//       toast.error(error.response?.data?.message || error.message || 'Failed to save changes');
//     }
//   } finally {
//     setTimeout(() => {
//       setShowSuccess(false);
//       setSavedSection(null);
//     }, 10000);
//   }
// };

// //  const handleSaveAll = async () => {
// //   try {
// //     let needsEmailVerification = false;
// //     let needsPhoneVerification = false;
// //     let newEmail = '';
// //     let newPhone = '';

// //     // Log all form data to see what's being captured
// //     console.log('🔍 Form Data State:', {
// //       coordinator: {
// //         name: formData.coordinatorName,
// //         designation: formData.coordinatorDesignation,
// //         email: formData.coordinatorEmail,
// //         mobile: formData.coordinatorMobile
// //       },
// //       bank: {
// //         bankName: formData.bankName,
// //         branch: formData.branch,
// //         ifscCode: formData.ifscCode,
// //         accountNumber: formData.accountNumber,
// //         accountHolderName: formData.accountHolderName,
// //         cancelledChequeFileUrl: formData.cancelledChequeFileUrl
// //       },
// //       gst: {
// //         gstNumber: formData.gstNumber,
// //         gstFileUrl: formData.gstFileUrl
// //       },
// //       licenses: formData.licenses
// //     });

// //     // Build complete profile data from ALL form sections
// //     const completeData = {
// //       // Company details
// //       sellerName: formData.sellerName,
// //       companyTypeId: formData.companyTypeId,
// //       sellerTypeId: formData.sellerTypeId,
// //       productTypeId: formData.productTypeIds,
// //       phone: formData.phone,
// //       email: formData.email,
// //       website: formData.website || '',
// //       termsAccepted: profileData?.termsAccepted || true,
      
// //       // Address
// //       address: {
// //         stateId: formData.stateId,
// //         districtId: formData.districtId,
// //         talukaId: formData.talukaId,
// //         city: formData.city,
// //         street: formData.street,
// //         buildingNo: formData.buildingNo,
// //         landmark: formData.landmark || '',
// //         pinCode: formData.pincode,
// //       },
      
// //       // Coordinator - Use formData values directly
// //       coordinator: {
// //         name: formData.coordinatorName,
// //         designation: formData.coordinatorDesignation,
// //         email: formData.coordinatorEmail,
// //         mobile: formData.coordinatorMobile
// //       },
      
// //       // Bank Details - Use formData values
// //       bankDetails: {
// //         bankName: formData.bankName,
// //         branch: formData.branch,
// //         ifscCode: formData.ifscCode,
// //         accountNumber: formData.accountNumber,
// //         accountHolderName: formData.accountHolderName,
// //         bankDocumentFileUrl: formData.cancelledChequeFileUrl
// //       },
      
// //       // GST - Use formData values
// //       gstNumber: formData.gstNumber,
// //       gstFileUrl: formData.gstFileUrl,
      
// //       // Documents - Build from licenses in formData
// //       documents: profileData?.documents.map(doc => {
// //         const productName = doc.productTypes?.productTypeName || '';
// //         const licenseData = formData.licenses[productName];
        
// //         console.log(`📄 Processing license for ${productName}:`, licenseData);
        
// //         return {
// //           documentId: doc.sellerDocumentsId,
// //           productTypeId: doc.productTypes?.productTypeId || 0,
// //           documentNumber: licenseData?.number || doc.documentNumber || '',
// //           documentFileUrl: licenseData?.fileUrl || doc.documentFileUrl || '',
// //           licenseIssueDate: licenseData?.issueDate ? licenseData.issueDate.toISOString().split('T')[0] : doc.licenseIssueDate || '',
// //           licenseExpiryDate: licenseData?.expiryDate ? licenseData.expiryDate.toISOString().split('T')[0] : doc.licenseExpiryDate || '',
// //           licenseIssuingAuthority: licenseData?.issuingAuthority || doc.licenseIssuingAuthority || ''
// //         };
// //       }) || []
// //     };

// //     console.log('📦 Complete Data being sent:', JSON.stringify(completeData, null, 2));

// //     // Check ONLY for coordinator email/phone changes that need verification
// //     if (profileData?.coordinator) {
// //       // Check coordinator email
// //       if (formData.coordinatorEmail !== profileData.coordinator.email) {
// //         needsEmailVerification = true;
// //         newEmail = formData.coordinatorEmail;
// //         console.log('📧 Coordinator email changed:', { old: profileData.coordinator.email, new: newEmail });
// //       }
      
// //       // Check coordinator phone
// //       if (formData.coordinatorMobile !== profileData.coordinator.mobile) {
// //         needsPhoneVerification = true;
// //         newPhone = formData.coordinatorMobile;
// //         console.log('📱 Coordinator phone changed:', { old: profileData.coordinator.mobile, new: newPhone });
// //       }
// //     }

// //     // Validate the complete data
// //     const validationResult = validateSection('company', completeData);
// //     if (!validationResult.success) {
// //       toast.error(validationResult.error || 'Validation failed');
// //       return;
// //     }

// //     // Handle OTP if needed (only for coordinator changes)
// //     if (needsEmailVerification || needsPhoneVerification) {
// //       // Only check email existence if email changed
// //       if (needsEmailVerification && newEmail) {
// //         const emailExists = await checkCoordinatorEmailExists(newEmail);
// //         if (emailExists) {
// //           toast.error("This email is already registered. Please use a different email address.");
// //           return;
// //         }
// //       }

// //       // Only check phone existence if phone changed
// //       if (needsPhoneVerification && newPhone) {
// //         const phoneExists = await checkCoordinatorPhoneExists(newPhone);
// //         if (phoneExists) {
// //           toast.error("This phone number is already registered. Please use a different number.");
// //           return;
// //         }
// //       }

// //       // Set ONLY the pending fields that need verification
// //       setPendingEmail(needsEmailVerification ? newEmail : undefined);
// //       setPendingPhone(needsPhoneVerification ? newPhone : undefined);
// //       setPendingSectionData(completeData);
// //       setPendingSection('all');
// //       setShowOtpModal(true);
// //       return;
// //     }

// //     // Save all sections at once (no OTP needed)
// //     console.log('💾 Saving all sections with data:', completeData);
// //     await performSave('all', completeData);

// //   } catch (error: any) {
// //     console.error('❌ Error preparing save:', error);
// //     toast.error(error.message || 'Failed to save changes');
// //   }
// // };

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
        
//         // Always treat as pending update
//         toast.success('Changes submitted for admin review. They will appear once approved.');
        
//         // Close edit mode
//         setEditingSection(null);
        
//         // Add to review sections
//         setReviewSections((prev) => {
//           if (!prev.includes(section)) {
//             return [...prev, section];
//           }
//           return prev;
//         });
        
//         // Show success message
//         setSavedSection(section);
//         setShowSuccess(true);
        
//         // IMPORTANT: DO NOT refresh profile data
//         // Keep the form data as-is with the changes the user just made
//       }

//     } catch (error: any) {
//       console.error('❌ Error saving section:', error);
//       console.error('❌ Error response:', error.response?.data);
//       toast.error(error.response?.data?.message || error.message || 'Failed to save changes');
//     }

//     setTimeout(() => {
//       setShowSuccess(false);
//       setSavedSection(null);
//     }, 21000);
//   };

//   const handleOtpVerified = async (verified: { email: boolean; phone: boolean }) => {
//     setShowOtpModal(false);
    
//     if (pendingSection && pendingSectionData) {
//       await performSave(pendingSection, pendingSectionData);
//     }
    
//     setPendingEmail(undefined);
//     setPendingPhone(undefined);
//     setPendingSectionData(null);
//     setPendingSection(null);
//   };

// const handleDownload = async (fileUrl: string, fileName: string) => {
//   try {
//     // Show loading toast
//     toast.loading('Downloading...', { id: 'download' });
    
//     // Fetch the file first
//     const response = await fetch(fileUrl, {
//       mode: 'cors',
//       credentials: 'omit',
//     });
    
//     if (!response.ok) {
//       throw new Error('Download failed');
//     }
    
//     // Convert to blob
//     const blob = await response.blob();
    
//     // Create blob URL
//     const blobUrl = window.URL.createObjectURL(blob);
    
//     // Create download link
//     const link = document.createElement('a');
//     link.href = blobUrl;
//     link.download = fileName; // This will now work for images too
    
//     // Append to body, click, and remove
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     // Clean up blob URL
//     window.URL.revokeObjectURL(blobUrl);
    
//     // Success toast
//     toast.success('Download complete!', { id: 'download' });
    
//   } catch (error) {
//     console.error('Download failed:', error);
//     toast.error('Failed to download file. Please try again.', { id: 'download' });
    
//     // Fallback: open in new tab if download fails
//     window.open(fileUrl, '_blank', 'noopener,noreferrer');
//   }
// };

//   const handleViewInNewTab = (fileUrl: string) => {
//     window.open(fileUrl, '_blank', 'noopener,noreferrer');
//   };

//   if (isLoading) {
//     return (
//       <div className="bg-secondary-50 min-h-screen w-full p-6 space-y-6">
//         <div className="animate-pulse space-y-6">
//           <div className="h-64 bg-neutral-100 rounded-xl"></div>
//           <div className="h-48 bg-neutral-100 rounded-xl"></div>
//           <div className="h-56 bg-neutral-100 rounded-xl"></div>
//           <div className="h-40 bg-neutral-100 rounded-xl"></div>
//           <div className="h-40 bg-neutral-100 rounded-xl"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error || !profileData) {
//     return (
//       <div className="bg-secondary-50 min-h-screen w-full p-6 space-y-6">
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

//   const portalTarget = typeof window !== "undefined" ? document.body : null;

//   const selectStyles = {
//     control: (base: any, state: any) => ({
//       ...base,
//       height: "56px",
//       minHeight: "56px",
//       borderRadius: "12px",
//       borderColor: state.isFocused ? "#4B0082" : "#737373",
//       boxShadow: "none",
//       cursor: "pointer",
//       "&:hover": {
//         borderColor: "#4B0082",
//       },
//     }),
//     menuPortal: (base: any) => ({
//       ...base,
//       zIndex: 9999,
//     }),
//     valueContainer: (base: any) => ({
//       ...base,
//       padding: "0 16px",
//       cursor: "pointer",
//       height: "56px",
//     }),
//     indicatorsContainer: (base: any) => ({
//       ...base,
//       height: "56px",
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

//   const selectWithIconStyles = {
//     ...selectStyles,
//     control: (base: any, state: any) => ({
//       ...selectStyles.control(base, state),
//       paddingLeft: "30px",
//     }),
//   };

//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <div className="bg-secondary-50 min-h-screen w-full p-6 space-y-6">
//         {/* Success Message */}
//         {savedSection && showSuccess && (
//           <div className="bg-success-50 border-l-4 border-success-300 p-4 rounded-md flex gap-2">
//             <MdSchedule size={20} className="text-success-700 mt-1" />
//             <div>
//               <p className="text-lg font-semibold text-success-900">
//                 Changes Submitted Successfully!
//               </p>
//               <p className="text-sm text-success-800">
//                 Your changes have been saved and submitted for admin review.
//                 You&apos;ll receive a notification once they are approved and reflected
//                 in your profile.
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Admin Message when editing */}
//         {editingSection && (
//           <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
//             <div className="flex gap-2">
//               <PiInfo size={24} className="text-yellow-700 mt-1" />
//               <div>
//                 <p className="text-lg font-semibold text-yellow-800">
//                   Admin Review Required
//                 </p>
//                 <p className="text-sm text-yellow-700">
//                   All changes made to your profile will be reviewed by an administrator
//                   before they are reflected in the system. You will be notified once
//                   your changes have been approved.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* COMPANY DETAILS - With the main Edit button */}
//         <div className="bg-white rounded-xl overflow-hidden  border border-grey-200">
//           <div className="flex items-center justify-between px-6 py-4 bg-neutral-50">
//             <div className="flex items-center gap-3">
//               <div className="p-2 rounded-md bg-secondary-100">
//                 <Building2 size={20} className="text-primary-900" />
//               </div>
//               <h2 className="font-semibold text-xl text-neutral-900">
//                 Seller Company Details
//               </h2>
//             </div>
            
//             {/* Single Edit button */}
//             {!editingSection ? (
//               <button
//                 onClick={() => setEditingSection("editing")}
//                 className="flex items-center gap-2 bg-primary-900 text-white text-sm px-4 py-2 rounded-md hover:bg-primary-800 transition-colors"
//               >
//                 <Pencil size={20} />
//                 Edit
//               </button>
//             ) : (
//               <ChevronUp size={18} className="text-gray-600" />
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
//                   className="rounded-2xl shadow object-cover"
//                 />
//                 <p className="text-sm text-gray-600">Company Logo</p>
//               </div>

//               <hr />

//               <div className="grid grid-cols-2 gap-6">
//                 <Input 
//                   label="Seller Name/Company Name"
//                   value={formData.sellerName}
//                   editable={!!editingSection}
//                   icon={<HiOutlineBuildingOffice2 />}
//                   onChange={(e) => setFormData(prev => ({ ...prev, sellerName: e.target.value }))}
//                 />

//                 <SelectField
//                   label="Company Type"
//                   value={formData.companyTypeId?.toString()}
//                   options={companyTypeOptions}
//                   editable={!!editingSection}
//                   onChange={handleCompanyTypeChange}
//                   placeholder="Select Company Type"
//                   isLoading={loadingStates.companyTypes}
//                   portalTarget={portalTarget}
//                   styles={selectWithIconStyles}
//                 />

//                 <div className="col-span-2">
//                   <div className="flex flex-col gap-1">
//                     <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
//                       Product Category
//                       <span className="text-warning-500">*</span>
//                     </label>
//                     <div className="relative" ref={productDropdownRef}>
//                       <div
//                         className={`w-full h-14 px-4 rounded-xl border flex items-center justify-between cursor-pointer
//                           ${editingSection 
//                             ? "bg-white border-secondary-200 hover:border-primary-900" 
//                             : "bg-neutral-50 border-neutral-100 cursor-not-allowed"
//                           }`}
//                         onClick={() => editingSection && setIsProductDropdownOpen(!isProductDropdownOpen)}
//                       >
//                         <span className={`${formData.productTypes.length === 0 ? "text-neutral-500" : "text-neutral-900"}`}>
//                           {loadingStates.productTypes
//                             ? "Loading product types..."
//                             : formData.productTypes.length > 0
//                             ? formData.productTypes.join(", ")
//                             : "Select Product Types"}
//                         </span>
//                         <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
//                       </div>

//                       {isProductDropdownOpen && editingSection && !loadingStates.productTypes && (
//                         <div className="absolute top-full mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
//                           <div className="p-2 border-b border-neutral-200 sticky top-0 bg-white">
//                             <p className="text-sm text-neutral-600 font-medium">
//                               Select product types:
//                             </p>
//                           </div>
//                           <div className="max-h-60 overflow-y-auto">
//                             {productTypes.length > 0 && (
//                               <div
//                                 className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200"
//                                 onClick={handleSelectAllProductTypes}
//                               >
//                                 <input
//                                   type="checkbox"
//                                   checked={productTypes.length > 0 && formData.productTypes.length === productTypes.length}
//                                   onChange={() => {}}
//                                   className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
//                                 />
//                                 <label className="ml-3 text-sm font-medium text-[#4B0082] cursor-pointer">
//                                   Select All
//                                 </label>
//                               </div>
//                             )}

//                             {productTypes.map((product) => (
//                               <div
//                                 key={product.productTypeId}
//                                 className="flex items-center px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
//                                 onClick={() => handleProductTypeToggle(product)}
//                               >
//                                 <input
//                                   type="checkbox"
//                                   checked={formData.productTypeIds.includes(product.productTypeId)}
//                                   onChange={() => {}}
//                                   className="h-4 w-4 text-[#4B0082] rounded border-neutral-300 focus:ring-purple-200"
//                                 />
//                                 <label className="ml-3 text-sm text-neutral-900 cursor-pointer">
//                                   {product.productTypeName}
//                                   {product.regulatoryCategory && (
//                                     <span className="ml-2 text-xs text-[#4B0082]">
//                                       ({product.regulatoryCategory})
//                                     </span>
//                                   )}
//                                 </label>
//                               </div>
//                             ))}
//                           </div>
//                           <div className="p-2 border-t border-neutral-200 bg-purple-50 sticky bottom-0">
//                             <p className="text-xs text-neutral-600">
//                               {formData.productTypes.length} of {productTypes.length} selected
//                             </p>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <SelectField
//                   label="Seller Type"
//                   value={formData.sellerTypeId?.toString()}
//                   options={sellerTypeOptions}
//                   editable={!!editingSection}
//                   icon={<HiOutlineBuildingOffice2 />}
//                   onChange={handleSellerTypeChange}
//                   placeholder="Select Seller Type"
//                   isLoading={loadingStates.sellerTypes}
//                   portalTarget={portalTarget}
//                   styles={selectWithIconStyles}
//                 />

//                 <FileField
//                   label="Company Type Certificate"
//                   file="company_registration_cert.pdf"
//                   editable={!!editingSection}
//                   onDownload={() => handleDownload('/assets/docs/company-cert.pdf', 'company_registration_cert.pdf')}
//                   onView={() => handleViewInNewTab('/assets/docs/company-cert.pdf')}
//                 />
//               </div>

//               <hr />

//               <div>
//                 <div className="flex items-center gap-2 font-semibold text-sm mb-4">
//                   <MapPin size={24} />
//                   Company Address
//                   <span className="text-red-500">*</span>
//                 </div>

//                 <div className="grid grid-cols-2 gap-6">
//                   <SelectField
//                     label="State"
//                     value={formData.stateId?.toString()}
//                     options={stateOptions}
//                     editable={!!editingSection}
//                     onChange={handleStateChange}
//                     placeholder="Select State"
//                     isLoading={loadingStates.states}
//                     portalTarget={portalTarget}
//                     styles={selectWithIconStyles}
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
//                     portalTarget={portalTarget}
//                     styles={selectWithIconStyles}
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
//                     portalTarget={portalTarget}
//                     styles={selectWithIconStyles}
//                   />

//                   <Input 
//                     label="City/Town/Village" 
//                     value={formData.city} 
//                     editable={!!editingSection}
//                     onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
//                   />

//                   <Input 
//                     label="Street/Road/Lane" 
//                     value={formData.street} 
//                     editable={!!editingSection}
//                     onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
//                   />

//                   <Input 
//                     label="Building/House Number" 
//                     value={formData.buildingNo} 
//                     editable={!!editingSection}
//                     onChange={(e) => setFormData(prev => ({ ...prev, buildingNo: e.target.value }))}
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
//                     onChange={(e) => handleNumericInput(e, 'pincode', 6)}
//                     maxLength={6}
//                   />
//                 </div>
//               </div>

//               <hr />

//               <div>
//                 <div className="flex items-center gap-2 font-semibold text-sm mb-4">
//                   <Phone size={24} />
//                   Contact Information
//                 </div>

//                 <div className="grid grid-cols-2 gap-6">
//                   <Input
//                     label="Company Phone Number"
//                     value={formData.phone}
//                     editable={!!editingSection}
//                     icon={<Phone size={18} />}
//                     onChange={(e) => handleNumericInput(e, 'phone', 10)}
//                     maxLength={10}
//                   />

//                   <Input
//                     label="Company Email ID"
//                     value={formData.email}
//                     editable={!!editingSection}
//                     icon={<CiMail />}
//                     onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
//                     type="email"
//                   />

//                   <div className="col-span-2">
//                     <Input
//                       label="Company Website"
//                       value={formData.website || ''}
//                       editable={!!editingSection}
//                       icon={<CiGlobe />}
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
//         <SectionCard
//           title="Company Coordinator Details"
//           icon={<FaRegUser size={24} />}
//           iconBg="bg-[#DCFCE7]"
//           iconColor="text-neutral-900"
//           underReview={reviewSections.includes("coordinator")}
//         >
//           <div className="grid grid-cols-2 gap-6">
//             <Input 
//               label="Coordinator Name" 
//               value={formData.coordinatorName} 
//               editable={!!editingSection}
//               icon={<FaRegUser />}
//               onChange={(e) => handleAlphabetInput(e, 'coordinatorName')}
//             />
//             <Input 
//               label="Coordinator Designation"
//               value={formData.coordinatorDesignation} 
//               editable={!!editingSection}
//               onChange={(e) => handleAlphabetInput(e, 'coordinatorDesignation')}
//             />

//             <Input 
//               label="Coordinator Email ID" 
//               value={formData.coordinatorEmail} 
//               editable={!!editingSection}
//               icon={<CiMail />}
//               onChange={(e) => setFormData(prev => ({ ...prev, coordinatorEmail: e.target.value }))}
//               type="email"
//             />

//             <Input 
//               label="Coordinator Mobile Number" 
//               value={formData.coordinatorMobile} 
//               editable={!!editingSection}
//               icon={<Phone size={18} />}
//               onChange={(e) => handleNumericInput(e, 'coordinatorMobile', 10)}
//               maxLength={10}
//             />

//             <FileField
//               label="Authorization Letter"
//               file="authorization_letter.pdf"
//               editable={!!editingSection}
//               onDownload={() => handleDownload('/assets/docs/auth-letter.pdf', 'authorization_letter.pdf')}
//               onView={() => handleViewInNewTab('/assets/docs/auth-letter.pdf')}
//             />

//             {(isCheckingEmail || isCheckingPhone) && (
//               <div className="col-span-2">
//                 {isCheckingEmail && (
//                   <p className="text-sm text-purple-600 flex items-center gap-1">
//                     <span className="animate-spin">⏳</span> Checking email availability...
//                   </p>
//                 )}
//                 {isCheckingPhone && (
//                   <p className="text-sm text-purple-600 flex items-center gap-1">
//                     <span className="animate-spin">⏳</span> Checking phone availability...
//                   </p>
//                 )}
//               </div>
//             )}
//             {emailExistsError && (
//               <div className="col-span-2">
//                 <p className="text-sm text-red-500">{emailExistsError}</p>
//               </div>
//             )}
//             {phoneExistsError && (
//               <div className="col-span-2">
//                 <p className="text-sm text-red-500">{phoneExistsError}</p>
//               </div>
//             )}
//           </div>
//         </SectionCard>

//         {/* LICENSE Sections */}
//         {formData.productTypes.map((productName: string, index: number) => {
//           const licenseData = formData.licenses[productName] || {
//             number: "",
//             file: null,
//             fileUrl: "",
//             issueDate: null,
//             expiryDate: null,
//             issuingAuthority: "",
//             status: 'Expired'
//           };

//           return (
//             <div key={productName}>
//               <SectionCard
//                 title={`${productName} License Details`}
//                 icon={<HiOutlineDocumentCheck size={20} />}
//                 iconBg="bg-[#F3E8FF]"
//                 iconColor="text-secondary-800"
//                 underReview={reviewSections.includes(`license-${index}`)}
//               >
//                 <div className="grid grid-cols-2 gap-6">
//                   <Input 
//                     label="License Number" 
//                     value={licenseData.number} 
//                     editable={!!editingSection}
//                     onChange={(e) => handleLicenseNumberChange(e, productName)}
//                   />

//                   <div className="flex flex-col gap-2">
//                     <label className="text-sm font-semibold text-neutral-700">
//                       License Copy <span className="text-warning-500">*</span>
//                     </label>
//                     {editingSection ? (
//                       <div className="flex items-center border-2 border-dashed border-primary-50 bg-primary-05 rounded-xl h-14 px-3">
//                         <div className="flex items-center gap-3 flex-1">
//                           <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center">
//                             <Upload size={20} className="text-primary-900" />
//                           </div>
//                           <input
//                             type="file"
//                             accept=".pdf,.jpg,.jpeg,.png"
//                             onChange={(e) => handleFileChange(e, 'license', productName)}
//                             className="flex-1 text-sm"
//                           />
//                         </div>
//                       </div>
//                     ) : (
//                       <FileField
//                         label=""
//                         file={licenseData.fileUrl?.split('/').pop() || 'license_document.pdf'}
//                         editable={false}
//                         onDownload={() => handleDownload(licenseData.fileUrl || '#', licenseData.fileUrl?.split('/').pop() || 'license.pdf')}
//                         onView={() => handleViewInNewTab(licenseData.fileUrl || '#')}
//                       />
//                     )}
//                   </div>

//                   <div className="flex flex-col gap-2">
//                     <label className="text-sm font-semibold text-neutral-700">
//                       License Issue Date <span className="text-warning-500">*</span>
//                     </label>
//                     {editingSection ? (
//                       <DatePicker
//                         value={licenseData.issueDate}
//                         onChange={(date) => handleIssueDateChange(date, productName)}
//                         maxDate={new Date()}
//                         format="dd/MM/yyyy"
//                         slotProps={{
//                           textField: {
//                             fullWidth: true,
//                             size: "small",
//                             placeholder: "DD/MM/YYYY",
//                             sx: {
//                               '& .MuiOutlinedInput-root': {
//                                 height: '56px',
//                                 borderRadius: '12px',
//                                 backgroundColor: '#FFFFFF',
//                                 '& .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#d1d5db',
//                                 },
//                                 '&:hover .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#4B0082',
//                                 },
//                                 '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#4B0082',
//                                 },
//                               },
//                             },
//                           },
//                         }}
//                       />
//                     ) : (
//                       <div className="h-14 px-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center">
//                         <IoCalendarOutline className="mr-2 text-neutral-600" />
//                         <span>{licenseData.issueDate ? licenseData.issueDate.toLocaleDateString('en-GB') : '-'}</span>
//                       </div>
//                     )}
//                   </div>

//                   <div className="flex flex-col gap-2">
//                     <label className="text-sm font-semibold text-neutral-700">
//                       License Expiry Date <span className="text-warning-500">*</span>
//                     </label>
//                     {editingSection ? (
//                       <DatePicker
//                         value={licenseData.expiryDate}
//                         onChange={(date) => handleExpiryDateChange(date, productName)}
//                         minDate={licenseData.issueDate || undefined}
//                         format="dd/MM/yyyy"
//                         slotProps={{
//                           textField: {
//                             fullWidth: true,
//                             size: "small",
//                             placeholder: "DD/MM/YYYY",
//                             sx: {
//                               '& .MuiOutlinedInput-root': {
//                                 height: '56px',
//                                 borderRadius: '12px',
//                                 backgroundColor: '#FFFFFF',
//                                 '& .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#d1d5db',
//                                 },
//                                 '&:hover .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#4B0082',
//                                 },
//                                 '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                   borderColor: '#4B0082',
//                                 },
//                               },
//                             },
//                           },
//                         }}
//                       />
//                     ) : (
//                       <div className="h-14 px-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center">
//                         <IoCalendarOutline className="mr-2 text-neutral-600" />
//                         <span>{licenseData.expiryDate ? licenseData.expiryDate.toLocaleDateString('en-GB') : '-'}</span>
//                       </div>
//                     )}
//                   </div>

//                   <Input
//                     label="License Issuing Authority"
//                     value={licenseData.issuingAuthority}
//                     editable={!!editingSection}
//                     icon={<Building2 size={18} />}
//                     onChange={(e) => handleIssuingAuthorityChange(e, productName)}
//                   />

//                   <div className="flex flex-col gap-2">
//                     <label className="text-sm font-semibold text-neutral-700">
//                       License Status
//                     </label>
//                     <div className="flex items-center h-14 px-4 rounded-xl bg-neutral-50 border border-neutral-100">
//                       <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
//                         licenseData.status === 'Active' ? 'bg-success-50 text-success-700' : 'bg-orange-50 text-orange-700'
//                       }`}>
//                         <GoCheckCircle size={16} />
//                         <span className="text-sm font-medium">{licenseData.status}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </SectionCard>
//             </div>
//           );
//         })}

//         {/* GST */}
//         <SectionCard
//           title="GSTIN Details"
//           icon={<FileText size={20} />}
//           iconBg="bg-orange-100"
//           iconColor="text-orange-600"
//           underReview={reviewSections.includes("gst")}
//         >
//           <div className="grid grid-cols-2 gap-6">
//             <Input
//               label="GSTIN Number"
//               value={formData.gstNumber}
//               editable={!!editingSection}
//               onChange={handleGSTChange}
//               maxLength={15}
//               className="uppercase"
//             />

//             <div className="flex flex-col gap-2">
//               <label className="text-sm font-semibold text-neutral-700">
//                 GST Certificate <span className="text-warning-500">*</span>
//               </label>
//               {editingSection ? (
//                 <div className="flex items-center border-2 border-dashed border-primary-50 bg-primary-05 rounded-xl h-14 px-3">
//                   <div className="flex items-center gap-3 flex-1">
//                     <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center">
//                       <Upload size={20} className="text-primary-900" />
//                     </div>
//                     <input
//                       type="file"
//                       accept=".pdf,.jpg,.jpeg,.png"
//                       onChange={(e) => handleFileChange(e, 'gstFile')}
//                       className="flex-1 text-sm"
//                     />
//                   </div>
//                 </div>
//               ) : (
//                 <FileField
//                   label=""
//                   file={formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf'}
//                   editable={false}
//                   onDownload={() => handleDownload(formData.gstFileUrl || '#', formData.gstFileUrl?.split('/').pop() || 'gst_certificate.pdf')}
//                   onView={() => handleViewInNewTab(formData.gstFileUrl || '#')}
//                 />
//               )}
//             </div>
//           </div>
//         </SectionCard>

//         {/* BANK */}
//         <div>
//           <SectionCard
//             title="Bank Details"
//             icon={<Landmark size={20} />}
//             iconBg="bg-[#E0E7FF]"
//             iconColor="text-secondary-800"
//             underReview={reviewSections.includes("bank")}
//           >
//             <div className="grid grid-cols-2 gap-6">
//               <div className="space-y-6">
//                 <Input 
//                   label="Bank Name" 
//                   value={formData.bankName} 
//                   editable={false}
//                 />

//                 <Input 
//                   label="Branch" 
//                   value={formData.branch} 
//                   editable={false}
//                 />

//                 <Input 
//                   label="Account Number" 
//                   value={formData.accountNumber} 
//                   editable={!!editingSection}
//                   onChange={(e) => handleNumericInput(e, 'accountNumber', 18)}
//                   maxLength={18}
//                 />
//               </div>

//               <div className="space-y-6">
//                 <Input 
//                   label="IFSC Code" 
//                   value={formData.ifscCode} 
//                   editable={!!editingSection}
//                   onChange={(e) => handleIfscChange(e.target.value)}
//                   maxLength={11}
//                   className="uppercase"
//                   error={ifscError}
//                 />

//                 <Input
//                   label="Beneficiary Name"
//                   value={formData.accountHolderName}
//                   editable={!!editingSection}
//                   onChange={(e) => handleAlphabetInput(e, 'accountHolderName')}
//                 />

//                 <div className="col-span-2 mt-4">
//                   <div className="flex flex-col gap-2">
//                     <label className="text-sm font-semibold text-neutral-700">
//                       Cancelled Cheque / Bank Passbook <span className="text-warning-500">*</span>
//                     </label>
//                     {editingSection ? (
//                       <div className="flex items-center border-2 border-dashed border-primary-50 bg-primary-05 rounded-xl h-14 px-3">
//                         <div className="flex items-center gap-3 flex-1">
//                           <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center">
//                             <Upload size={20} className="text-primary-900" />
//                           </div>
//                           <input
//                             type="file"
//                             accept=".pdf,.jpg,.jpeg,.png"
//                             onChange={(e) => handleFileChange(e, 'cancelledChequeFile')}
//                             className="flex-1 text-sm"
//                           />
//                         </div>
//                       </div>
//                     ) : (
//                       <FileField
//                         label=""
//                         file={formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf'}
//                         editable={false}
//                         onDownload={() => handleDownload(formData.cancelledChequeFileUrl || '#', formData.cancelledChequeFileUrl?.split('/').pop() || 'cancelled_cheque.pdf')}
//                         onView={() => handleViewInNewTab(formData.cancelledChequeFileUrl || '#')}
//                       />
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </SectionCard>

//           {/* Save/Cancel buttons - only show when editing */}
//           {editingSection && (
//             <div className="flex justify-between gap-4 mt-6">
//               <button
//                 onClick={handleCancel}
//                 className="flex items-center gap-2 border-2 border-warning-500 text-warning-500 text-md font-semibold px-6 py-3 rounded-lg"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveAll}
//                 className="flex items-center gap-2 bg-primary-900 font-semibold text-white text-md px-6 py-3 rounded-lg"
//               >
//                 Submit
//               </button>
//             </div>
//           )}
//         </div>

//         {/* OTP Modal */}
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
//     <div className={`bg-white rounded-xl overflow-hidden border ${underReview ? "border-gray-200" : "border-gray-200"}`}>
//       <div className="flex items-center justify-between px-6 py-4 bg-neutral-50">
//         <div className="flex items-center gap-3">
//           <div className={`p-2 rounded-md ${iconBg}`}>
//             <div className={iconColor}>{icon}</div>
//           </div>
//           <h2 className="font-semibold text-xl text-neutral-900">
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
//   hideAsterisk = false 
// }: InputProps) {
//   const [inputValue, setInputValue] = useState(value);

//   useEffect(() => {
//     setInputValue(value);
//   }, [value]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setInputValue(e.target.value);
//     if (onChange) {
//       onChange(e);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-2">
//       <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
//         {icon && (
//           <span className="text-neutral-600 text-lg">
//             {icon}
//           </span>
//         )}
//         {label}
//         {!hideAsterisk && <span className="text-warning-500">*</span>}
//       </label>
//       <input
//         type={type}
//         value={inputValue}
//         onChange={handleChange}
//         disabled={!editable}
//         maxLength={maxLength}
//         className={`w-full h-14 px-4 rounded-xl text-[16px] ${className}
//         ${editable
//           ? "bg-white border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
//           : "bg-neutral-50 border border-neutral-100 cursor-not-allowed"
//         }
//         ${error ? "border-red-500 focus:ring-red-500" : ""}`}
//       />
//       {error && (
//         <p className="text-sm text-red-500 mt-1">{error}</p>
//       )}
//     </div>
//   );
// }

// function SelectField({
//   label,
//   value,
//   options,
//   editable,
//   icon,
//   onChange,
//   placeholder,
//   isLoading,
//   isDisabled,
//   portalTarget,
//   styles
// }: any) {
//   return (
//     <div className="flex flex-col gap-2">
//       <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
//         {icon && (
//           <span className="text-neutral-600 text-lg">
//             {icon}
//           </span>
//         )}
//         {label}
//         <span className="text-warning-500">*</span>
//       </label>
//       <div className="relative">
//         {icon && (
//           <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
//             {icon}
//           </div>
//         )}
//         <select
//           value={value}
//           onChange={(e) => {
//             const selected = options.find((opt: any) => opt.value === e.target.value);
//             onChange(selected);
//           }}
//           disabled={!editable || isLoading || isDisabled}
//           className={`w-full h-14 px-4 rounded-xl text-[16px] appearance-none
//             ${icon ? "pl-10" : "pl-4"} pr-10
//             ${editable && !isDisabled
//               ? "bg-white border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
//               : "bg-neutral-50 border border-neutral-100 cursor-not-allowed"
//             }`}
//         >
//           <option value="">{isLoading ? "Loading..." : placeholder}</option>
//           {options.map((opt: any) => (
//             <option key={opt.value} value={opt.value}>
//               {opt.label}
//             </option>
//           ))}
//         </select>
//         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
//       </div>
//     </div>
//   );
// }

// function FileField({
//   label,
//   file,
//   editable,
//   onDownload,
//   onView
// }: any) {
//   return (
//     <div className="flex flex-col gap-2">
//       {label && (
//         <label className="text-sm font-semibold text-neutral-700">
//           {label} <span className="text-warning-500">*</span>
//         </label>
//       )}
//       <div className={`flex items-center justify-between h-14 px-3 rounded-xl
//       ${editable
//           ? "border-2 border-dashed border-primary-50 bg-primary-05 cursor-pointer hover:bg-primary-10 transition-colors"
//           : "border-2 border-dashed border-primary-50 bg-primary-05"
//         }`}>
//         <div className="flex items-center gap-3">
//           <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center">
//             <Upload size={20} className="text-primary-900" />
//           </div>
//           <span className="text-[16px] text-neutral-800 truncate max-w-[200px]">
//             {file}
//           </span>
//         </div>

//         <div className="flex items-center gap-3 text-gray-600">
//           {editable ? (
//             <span className="text-primary-900 text-md font-semibold">
//               Click to replace
//             </span>
//           ) : (
//             <>
//               <button 
//                 onClick={onDownload} 
//                 className="text-primary-900 hover:text-primary-700 transition-colors"
//                 title="Download file"
//               >
//                 <Download size={20} />
//               </button>
//               <button 
//                 onClick={onView} 
//                 className="text-neutral-900 hover:text-neutral-700 transition-colors"
//                 title="Open in new tab"
//               >
//                 <ExternalLink size={20} />
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }