"use client";

import React, { useState, useEffect, useRef } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import OtpVerification from "./OtpVerification";
import Header from "@/src/app/components/Header";
import { useRouter } from "next/navigation";
import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService";
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
import { fetchBankDetails } from "@/src/services/seller/IFSCService";
import { ifscSchema } from "@/src/schema/seller/IFSCSchema";
import { step1Schema, step2Schema, step3Schema, step4Schema } from "@/src/schema/seller/sellerRegSchema";
import { toast } from "react-toastify";
import { z } from "zod";
import {
  CompanyTypeResponse,
  SellerTypeResponse,
  ProductTypeResponse,
  StateResponse,
  DistrictResponse,
  TalukaResponse,
} from "@/src/types/seller/SellerRegMasterData";
import {
  TempSellerRequest,
  TempSellerDocument,
  TempSellerBankDetails,
  TempSellerAddress,
  TempSellerCoordinator,
} from "@/src/types/seller/sellerRegistrationData";

export default function SellerRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [ifscError, setIfscError] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // ========== Master Data State ==========
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([]);
  const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([]);
  const [states, setStates] = useState<StateResponse[]>([]);
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [talukas, setTalukas] = useState<TalukaResponse[]>([]);

  // ========== Loading States ==========
  const [loadingCompanyTypes, setLoadingCompanyTypes] = useState(true);
  const [loadingSellerTypes, setLoadingSellerTypes] = useState(true);
  const [loadingProductTypes, setLoadingProductTypes] = useState(true);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // ========== Error States ==========
  const [companyTypesError, setCompanyTypesError] = useState<string | null>(null);
  const [statesError, setStatesError] = useState<string | null>(null);

  // ========== Form State ==========
  const [form, setForm] = useState({
    // IDs for submission
    companyTypeId: 0,
    sellerTypeId: 0,
    productTypeIds: [] as number[],
    stateId: 0,
    districtId: 0,
    talukaId: 0,
    // Display names for UI
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
    // Licenses per product
    licenses: {} as Record<string, { 
      number: string; 
      file: File | null;
      issueDate: Date | null;
      expiryDate: Date | null;
      issuingAuthority: string;
      status: 'Active' | 'Expired';
    }>,
    // Bank details
    bankState: "",
    bankDistrict: "",
    bankName: "",
    branch: "",
    ifscCode: "",
    accountNumber: "",
    accountHolderName: "",
    cancelledChequeFile: null as File | null,
  });

  // ========== Close dropdown when clicking outside ==========
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ========== FETCH ALL MASTER DATA ON MOUNT ==========
  useEffect(() => {
    fetchCompanyTypes();
    fetchStates();
    fetchSellerTypes();
    fetchProductTypes();
  }, []);

  const fetchCompanyTypes = async () => {
    setLoadingCompanyTypes(true);
    setCompanyTypesError(null);
    try {
      const data = await sellerRegMasterService.getCompanyTypes();
      setCompanyTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching company types:", error);
      setCompanyTypesError("Failed to load company types");
      setCompanyTypes([]);
      toast.error("Failed to load company types. Please refresh the page.");
    } finally {
      setLoadingCompanyTypes(false);
    }
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    setStatesError(null);
    try {
      const data = await sellerRegMasterService.getStates();
      setStates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStatesError("Failed to load states");
      setStates([]);
      toast.error("Failed to load states. Please refresh the page.");
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchSellerTypes = async () => {
    setLoadingSellerTypes(true);
    try {
      const data = await sellerRegMasterService.getSellerTypes();
      setSellerTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching seller types:", error);
      setSellerTypes([]);
      toast.error("Failed to load seller types.");
    } finally {
      setLoadingSellerTypes(false);
    }
  };

  const fetchProductTypes = async () => {
    setLoadingProductTypes(true);
    try {
      const data = await sellerRegMasterService.getProductTypes();
      setProductTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching product types:", error);
      setProductTypes([]);
      toast.error("Failed to load product types.");
    } finally {
      setLoadingProductTypes(false);
    }
  };

  // ========== FETCH DISTRICTS (when state changes) ==========
  const fetchDistrictsByState = async (stateId: number) => {
    if (!stateId) return;
    
    setLoadingDistricts(true);
    try {
      const allDistricts = await sellerRegMasterService.getDistricts();
      const filtered = Array.isArray(allDistricts) 
        ? allDistricts.filter((d) => d.stateId === stateId)
        : [];
      setDistricts(filtered);
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
      toast.error("Failed to load districts.");
    } finally {
      setLoadingDistricts(false);
    }
  };

  // ========== FETCH TALUKAS (when district changes) ==========
  const fetchTalukasByDistrict = async (districtId: number) => {
    if (!districtId) return;
    
    setLoadingTalukas(true);
    try {
      const allTalukas = await sellerRegMasterService.getTalukas();
      const filtered = Array.isArray(allTalukas)
        ? allTalukas.filter((t) => t.districtId === districtId)
        : [];
      setTalukas(filtered);
    } catch (error) {
      console.error("Error fetching talukas:", error);
      setTalukas([]);
      toast.error("Failed to load talukas.");
    } finally {
      setLoadingTalukas(false);
    }
  };

  // ========== Function to Calculate License Status ==========
  const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): 'Active' | 'Expired' => {
    if (!issueDate || !expiryDate) return 'Expired';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDate);
    expDate.setHours(0, 0, 0, 0);
    
    return today <= expDate ? 'Active' : 'Expired';
  };

  // ========== Form Handlers ==========
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (e: any) => {
    const { id, value, files, type } = e.target;

    if (type === "file" && files && files[0]) {
      // Validate file size (max 5MB)
      if (files[0].size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(files[0].type)) {
        toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
        return;
      }

      if (id.startsWith("licenseFile-")) {
  const licenseId = id.replace("licenseFile-", "");
  setForm((prev) => {
    // Create a properly typed variable
    const updatedLicenses: Record<string, { 
      number: string; 
      file: File | null;
      issueDate: Date | null;
      expiryDate: Date | null;
      issuingAuthority: string;
      status: 'Active' | 'Expired';
    }> = {
      ...prev.licenses,
      [licenseId]: {
        ...prev.licenses[licenseId],
        file: files[0],
      },
    };
    
    // Recalculate status
    if (updatedLicenses[licenseId]?.issueDate && updatedLicenses[licenseId]?.expiryDate) {
      updatedLicenses[licenseId].status = calculateLicenseStatus(
        updatedLicenses[licenseId].issueDate,
        updatedLicenses[licenseId].expiryDate
      );
    }
    
    return {
      ...prev,
      licenses: updatedLicenses,
    };
  });
} else {
        setForm((prev) => ({ ...prev, [id]: files[0] }));
      }
    } else if (id.startsWith("licenseNumber-")) {
      const licenseId = id.replace("licenseNumber-", "");
      setForm((prev) => ({
        ...prev,
        licenses: {
          ...prev.licenses,
          [licenseId]: {
            ...prev.licenses[licenseId],
            number: value,
          },
        },
      }));
    } else if (id.startsWith("licenseIssuingAuthority-")) {
      const licenseId = id.replace("licenseIssuingAuthority-", "");
      setForm((prev) => ({
        ...prev,
        licenses: {
          ...prev.licenses,
          [licenseId]: {
            ...prev.licenses[licenseId],
            issuingAuthority: value,
          },
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  // MUI Date picker handlers
  const handleIssueDateChange = (date: Date | null, licenseId: string) => {
    if (date) {
      // Validate that issue date is not greater than today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      if (date > today) {
        toast.error("Issue date cannot be greater than today's date");
        return;
      }
    }

    setForm((prev) => {
    // Add the type annotation here
    const updatedLicenses: Record<string, { 
      number: string; 
      file: File | null;
      issueDate: Date | null;
      expiryDate: Date | null;
      issuingAuthority: string;
      status: 'Active' | 'Expired';
    }> = {
      ...prev.licenses,
      [licenseId]: {
        ...prev.licenses[licenseId],
        issueDate: date,
      },
    };
      
      // Recalculate status
      if (updatedLicenses[licenseId].expiryDate) {
        updatedLicenses[licenseId].status = calculateLicenseStatus(
          date,
          updatedLicenses[licenseId].expiryDate
        );
      }
      
      return {
        ...prev,
        licenses: updatedLicenses,
      };
    });
  };

  const handleExpiryDateChange = (date: Date | null, licenseId: string) => {
    setForm((prev) => {
      const updatedLicenses: Record<string, { 
      number: string; 
      file: File | null;
      issueDate: Date | null;
      expiryDate: Date | null;
      issuingAuthority: string;
      status: 'Active' | 'Expired';
    }> = {
      ...prev.licenses,
      [licenseId]: {
        ...prev.licenses[licenseId],
        expiryDate: date,
      },
    };
      
      // Recalculate status
      if (updatedLicenses[licenseId].issueDate) {
        updatedLicenses[licenseId].status = calculateLicenseStatus(
          updatedLicenses[licenseId].issueDate,
          date
        );
      }
      
      return {
        ...prev,
        licenses: updatedLicenses,
      };
    });
  };

  // Company Type Selection
  const handleCompanyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value ? parseInt(e.target.value) : 0;
    const selected = companyTypes.find((c) => c?.companyTypeId === selectedId);
    
    setForm((prev) => ({
      ...prev,
      companyTypeId: selectedId,
      companyType: selected?.companyTypeName || "",
    }));
  };

  // Seller Type Selection
  const handleSellerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = sellerTypes.find((s) => s.sellerTypeId === selectedId);
    
    setForm((prev) => ({
      ...prev,
      sellerTypeId: selectedId || 0,
      sellerType: selected?.sellerTypeName || "",
    }));
  };

  // State Selection
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = states.find((s) => s.stateId === selectedId);
    
    setForm((prev) => ({
      ...prev,
      stateId: selectedId || 0,
      state: selected?.stateName || "",
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

  // District Selection
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = districts.find((d) => d.districtId === selectedId);
    
    setForm((prev) => ({
      ...prev,
      districtId: selectedId || 0,
      district: selected?.districtName || "",
      talukaId: 0,
      taluka: "",
    }));
    
    setTalukas([]);
    
    if (selectedId) {
      fetchTalukasByDistrict(selectedId);
    }
  };

  // Taluka Selection
  const handleTalukaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selected = talukas.find((t) => t.talukaId === selectedId);
    
    setForm((prev) => ({
      ...prev,
      talukaId: selectedId || 0,
      taluka: selected?.talukaName || "",
    }));
  };

  // Product Type Toggle
  const handleProductTypeToggle = (product: ProductTypeResponse) => {
    if (!product) return;
    
    setForm((prev) => {
      let newProductTypeIds = [...prev.productTypeIds];
      let newProductTypes = [...prev.productTypes];
      const newLicenses = { ...prev.licenses };

      if (newProductTypeIds.includes(product.productTypeId)) {
        newProductTypeIds = newProductTypeIds.filter(
          (id) => id !== product.productTypeId
        );
        newProductTypes = newProductTypes.filter(
          (name) => name !== product.productTypeName
        );
        delete newLicenses[product.productTypeName];
      } else {
        newProductTypeIds.push(product.productTypeId);
        newProductTypes.push(product.productTypeName);
        
        // Initialize with empty license fields (no default dates)
        newLicenses[product.productTypeName] = { 
          number: "", 
          file: null,
          issueDate: null,
          expiryDate: null,
          issuingAuthority: "",
          status: 'Expired'
        };
      }

      return {
        ...prev,
        productTypeIds: newProductTypeIds,
        productTypes: newProductTypes,
        licenses: newLicenses,
      };
    });
  };

  // Select All Product Types
  const handleSelectAllProductTypes = () => {
    if (!productTypes.length) return;
    
    if (form.productTypes.length === productTypes.length) {
      // Deselect all
      setForm((prev) => ({
        ...prev,
        productTypeIds: [],
        productTypes: [],
        licenses: {},
      }));
    } else {
      // Select all
      const allIds = productTypes.map((p) => p.productTypeId);
      const allNames = productTypes.map((p) => p.productTypeName);
      
      const newLicenses: Record<string, { 
        number: string; 
        file: File | null;
        issueDate: Date | null;
        expiryDate: Date | null;
        issuingAuthority: string;
        status: 'Active' | 'Expired';
      }> = {};
      
      allNames.forEach((name) => {
        newLicenses[name] = { 
          number: "", 
          file: null,
          issueDate: null,
          expiryDate: null,
          issuingAuthority: "",
          status: 'Expired'
        };
      });
      
      setForm((prev) => ({
        ...prev,
        productTypeIds: allIds,
        productTypes: allNames,
        licenses: newLicenses,
      }));
    }
  };

  // ========== IFSC Auto-fill using Service and Schema ==========
  const handleIfscChange = async (value: string) => {
    const ifsc = value.toUpperCase();
    setForm((prev) => ({ ...prev, ifscCode: ifsc }));
    setIfscError("");

    if (ifsc.length !== 11) {
      setForm((prev) => ({
        ...prev,
        bankName: "",
        branch: "",
        bankState: "",
        bankDistrict: "",
      }));
      return;
    }

    // Validate format using Zod schema
    const parseResult = ifscSchema.safeParse(ifsc);
    if (!parseResult.success) {
      setIfscError(parseResult.error.issues[0].message);
      setForm((prev) => ({
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
      setForm((prev) => ({
        ...prev,
        bankName: data.BANK || "",
        branch: data.BRANCH || "",
        bankState: data.STATE || "",
        bankDistrict: data.DISTRICT || data.CITY || "",
      }));
    } catch {
      setIfscError("Invalid IFSC Code");
      setForm((prev) => ({
        ...prev,
        bankName: "",
        branch: "",
        bankState: "",
        bankDistrict: "",
      }));
      toast.error("Invalid IFSC Code. Please check and try again.");
    }
  };

  // ========== Text Input Handlers ==========
  const handleAlphabetInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
    setForm((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleAlphabetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    const isValidKey = /^[a-zA-Z\s,'.-]$/.test(key);
    if (
      !isValidKey &&
      key !== "Backspace" &&
      key !== "Delete" &&
      key !== "Tab" &&
      key !== "ArrowLeft" &&
      key !== "ArrowRight"
    ) {
      e.preventDefault();
    }
  };

  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    maxLength?: number
  ) => {
    let value = e.target.value.replace(/\D/g, "");
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength);
    }
    setForm((prev) => ({ ...prev, [fieldName]: value }));
  };

  // ========== File Upload ==========
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    // TODO: Replace with actual file upload API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUrl = `https://storage.example.com/${folder}/${Date.now()}_${file.name}`;
        resolve(mockUrl);
      }, 1500);
    });
  };

  // ========== Get License Info ==========
  const getLicenseInfo = (productName: string) => {
    const product = productTypes.find((p) => p.productTypeName === productName);
    const label = product?.regulatoryCategory
      ? `${product.regulatoryCategory} License`
      : `${productName} License`;
    return {
      label,
      placeholder: `Enter ${productName} license number`,
    };
  };

  // ========== Form Validation and Submission with Zod ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1 Validation using Zod
    if (step === 1) {
      try {
        step1Schema.parse(form);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((issue) => {
            toast.error(issue.message);
          });
        } else {
          toast.error("Please fill all required company information fields.");
        }
        return;
      }
    }

    // Step 2 Validation
    if (step === 2) {
      try {
        step2Schema.parse(form);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((issue) => {
            toast.error(issue.message);
          });
        } else {
          toast.error("Please fill all coordinator details.");
        }
        return;
      }
      if (!emailVerified || !phoneVerified) {
        toast.warning("Please verify both Email and Mobile OTP before proceeding.");
        return;
      }
    }

    // Step 3 Validation
    if (step === 3) {
      try {
        // Convert dates to strings for validation
        const licensesForValidation = Object.entries(form.licenses).reduce((acc, [key, value]) => {
          acc[key] = {
            ...value,
            issueDate: value.issueDate ? value.issueDate.toISOString().split('T')[0] : '',
            expiryDate: value.expiryDate ? value.expiryDate.toISOString().split('T')[0] : '',
            file: value.file,
          };
          return acc;
        }, {} as any);

        const schema = step3Schema(form.productTypes);
        schema.parse({
          gstNumber: form.gstNumber,
          gstFile: form.gstFile,
          licenses: licensesForValidation,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((issue) => {
            toast.error(issue.message);
          });
        } else {
          toast.error("Please fill all document fields.");
        }
        return;
      }
    }

    // Step 4 Validation
    if (step === 4) {
      try {
        step4Schema.parse(form);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach((issue) => {
            toast.error(issue.message);
          });
        } else {
          toast.error("Please fill all bank account details.");
        }
        return;
      }
      if (ifscError) {
        toast.error("Please fix IFSC code error before proceeding.");
        return;
      }
    }

    // Step navigation
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    // Final Submission
    setSubmitting(true);
    try {
      // Upload GST file
      let gstFileUrl = "";
      if (form.gstFile) {
        gstFileUrl = await uploadFile(form.gstFile, "gst-certificates");
      }

      // Upload license files and prepare documents array
      const documents: TempSellerDocument[] = [];
      
      for (const productName of form.productTypes) {
        const product = productTypes.find((p) => p.productTypeName === productName);
        if (!product) continue;

        const license = form.licenses[productName];
        let docFileUrl = "";
        if (license?.file) {
          docFileUrl = await uploadFile(license.file, "licenses");
        }

        // Format dates to YYYY-MM-DD for backend
        const licenseIssueDate = license?.issueDate 
          ? license.issueDate.toISOString().split('T')[0] 
          : undefined;
        
        const licenseExpiryDate = license?.expiryDate 
          ? license.expiryDate.toISOString().split('T')[0] 
          : undefined;

        documents.push({
          productTypeId: product.productTypeId,
          documentNumber: license?.number || "",
          documentFileUrl: docFileUrl,
          licenseIssueDate: licenseIssueDate,
          licenseExpiryDate: licenseExpiryDate,
          licenseIssuingAuthority: license?.issuingAuthority || "",
        });
      }

      // Upload cancelled cheque
      let bankDocumentFileUrl = "";
      if (form.cancelledChequeFile) {
        bankDocumentFileUrl = await uploadFile(
          form.cancelledChequeFile,
          "bank-documents"
        );
      }

      // Build request objects
      const address: TempSellerAddress = {
        stateId: form.stateId,
        districtId: form.districtId,
        talukaId: form.talukaId,
        city: form.city,
        street: form.street,
        buildingNo: form.buildingNo,
        landmark: form.landmark || "",
        pinCode: form.pincode,
      };

      const coordinator: TempSellerCoordinator = {
        name: form.coordinatorName,
        designation: form.coordinatorDesignation,
        email: form.coordinatorEmail,
        mobile: form.coordinatorMobile,
      };

      const bankDetails: TempSellerBankDetails = {
        bankName: form.bankName,
        branch: form.branch,
        ifscCode: form.ifscCode,
        accountNumber: form.accountNumber,
        accountHolderName: form.accountHolderName,
        bankDocumentFileUrl,
      };

      // Create the request according to your API structure
      const request: TempSellerRequest = {
        sellerName: form.sellerName,
        productTypeId: form.productTypeIds,
        companyTypeId: form.companyTypeId,
        sellerTypeId: form.sellerTypeId,
        phone: form.phone,
        email: form.email,
        termsAccepted: true,
        website: form.website || undefined,
        address,
        coordinator,
        bankDetails,
        gstNumber: form.gstNumber,
        gstFileUrl: gstFileUrl,
        documents,
      };

      console.log("📦 Final submission payload:", JSON.stringify(request, null, 2));

      const response = await sellerRegService.createTempSeller(request);
      console.log("✅ Registration successful:", response);
      
      setApplicationId(response.sellerRequestId);
      setShowSuccessModal(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const back = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.push("/");
  };

  // ========== Step Data ==========
  const stepData = [
    {
      title: "Company",
      icon: "bi-building",
      activeIcon: "bi-building-fill",
      description: "Provide Your Company Details",
    },
    {
      title: "Coordinator",
      icon: "bi-person-badge",
      activeIcon: "bi-person-badge-fill",
      description: "Add Coordinator Information and Verify",
    },
    {
      title: "Documents",
      icon: "bi-file-earmark-lock",
      activeIcon: "bi-file-earmark-lock-fill",
      description: "Upload Required Compliance Documents",
    },
    {
      title: "Bank",
      icon: "bi-bank",
      activeIcon: "bi-bank2",
      description: "Enter Bank Account Details",
    },
    {
      title: "Review",
      icon: "bi-shield-check",
      activeIcon: "bi-shield-check",
      description: "Review Summary",
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="bg-primary-100 min-h-screen">
        <Header />

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-90% max-w-500 animate-fadeIn">
              <div className="bg-primary-100 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-linear-to-r from-tertiary-600 to-tertiary-500 p-4 text-center text-white relative">
                  <div className="text-4xl mb-2 animate-bounce">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <h3 className="text-xl font-bold">
                    Application Submitted Successfully!
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-neutral-700 text-center text-base leading-relaxed mb-6">
                    Your seller registration application has been submitted
                    successfully. Our team will review your application and
                    contact you within 3-5 business days.
                  </p>
                  <div className="rounded-xl p-6 mt-6">
                    <div className="flex items-center mb-2">
                      <i className="bi bi-clock text-primary-700 text-xl mr-3"></i>
                      <span>
                        Application ID:{" "}
                        <strong className="text-neutral-900">
                          {applicationId}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center mb-3">
                      <i className="bi bi-calendar-check text-primary-700 text-xl mr-3"></i>
                      <span>
                        Submitted on:{" "}
                        <strong className="text-neutral-900">
                          {new Date().toLocaleDateString("en-IN")}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <i className="bi bi-envelope text-primary-700 text-xl mr-3"></i>
                      <span>
                        Confirmation sent to:{" "}
                        <strong className="text-neutral-900">
                          {form.email}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-8 py-4 bg-neutral-100 border-t border-neutral-200 flex justify-center gap-4">
                  <button
                    className="px-6 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all flex items-center shadow-md hover:shadow-lg"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Header & Stepper */}
        <div className="sticky top-0 z-40 bg-primary-100 pt-2">
          <div className="mb-1 mx-4 md:mx-10">
            <div className="mb-6 mt-2">
              <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-xl p-4 text-white">
                <div className="flex flex-col md:flex-row items-center justify-center">
                  <div className="flex items-center mb-2 md:mb-0">
                    <div className="w-6 h-6 mr-3 flex items-center justify-center">
                      <i className="bi bi-building text-white text-xl"></i>
                    </div>
                    <div className="text-center md:text-left">
                      <h2 className="text-xl font-bold">Seller Registration</h2>
                      <p className="text-primary-200 text-sm">
                        Register Your Business Here!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper */}
            <div className="mb-2">
              <div className="relative">
                <div className="flex justify-between">
                  {stepData.map((stepInfo, index) => {
                    const stepNumber = index + 1;
                    const isActive = step === stepNumber;
                    const isCompleted = step > stepNumber;
                    const isClickable = isCompleted || stepNumber === 1;
                    return (
                      <div
                        key={index}
                        className={`flex flex-col items-center relative ${
                          isClickable ? "cursor-pointer" : "cursor-default"
                        }`}
                        style={{ width: `${100 / stepData.length}%` }}
                        onClick={() => isClickable && setStep(stepNumber)}
                      >
                        {index < stepData.length - 1 && (
                          <div className="absolute top-6 left-1/2 w-full h-1.5 bg-neutral-200">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isCompleted
                                  ? "bg-linear-to-r from-success-300 to-primary-600"
                                  : "bg-transparent"
                              }`}
                              style={{ width: isCompleted ? "100%" : "0%" }}
                            ></div>
                          </div>
                        )}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 z-10 transition-all duration-300 ${
                            isActive
                              ? "bg-primary-600 text-white shadow-lg border-2 border-white"
                              : isCompleted
                              ? "bg-success-300 text-white"
                              : "bg-white text-neutral-600 border-2 border-neutral-200"
                          }`}
                        >
                          {isCompleted ? (
                            <i className="bi bi-check-circle-fill text-xl"></i>
                          ) : (
                            <i
                              className={`bi ${
                                isActive ? stepInfo.activeIcon : stepInfo.icon
                              } text-lg`}
                            ></i>
                          )}
                        </div>
                        <div className="text-center">
                          <p
                            className={`text-sm font-bold ${
                              isActive
                                ? "text-primary-600 font-bold"
                                : isCompleted
                                ? "text-success-300"
                                : "text-neutral-900"
                            }`}
                          >
                            {stepInfo.title}
                          </p>
                          <p className="text-sm text-neutral-700">
                            {stepInfo.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="mx-4 md:mx-10 pb-6">
          <form onSubmit={handleSubmit}>
            {/* STEP 1: COMPANY */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6 md:p-6 mb-6">
                <div className="mb-6">
                  <div className="space-y-5">
                    {/* Company Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="sellerName"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-building"></i>
                          Seller Name/Company Name:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="sellerName"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter your company name"
                          value={form.sellerName}
                          onKeyPress={handleAlphabetKeyPress}
                          onChange={(e) => handleAlphabetInput(e, "sellerName")}
                        />
                      </div>

                      {/* Company Type */}
                      <div>
                        <label
                          htmlFor="companyType"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-diagram-3"></i>
                          Company Type: <span className="text-error-300">*</span>
                        </label>
                        <select
                          id="companyType"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
                          value={form.companyTypeId || ""}
                          onChange={handleCompanyTypeChange}
                        >
                          <option value="">-- Select Company Type --</option>
                          {loadingCompanyTypes ? (
                            <option value="" disabled>Loading company types...</option>
                          ) : companyTypesError ? (
                            <option value="" disabled className="text-error-300">
                              ⚠️ Failed to load. Please refresh.
                            </option>
                          ) : companyTypes && companyTypes.length > 0 ? (
                            companyTypes.map((type) => (
                              <option 
                                key={type?.companyTypeId || Math.random()} 
                                value={type?.companyTypeId || ""}
                              >
                                {type?.companyTypeName || "Unknown"}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>No company types available</option>
                          )}
                        </select>
                        {companyTypesError && (
                          <p className="mt-1 text-xs text-error-300">
                            {companyTypesError}. 
                            <button 
                              type="button"
                              onClick={fetchCompanyTypes}
                              className="ml-2 text-primary-600 underline"
                            >
                              Retry
                            </button>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Seller Type & Product Types */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="sellerType"
                          className="block mb-2 text-sm font-semibold text-primary-700"
                        >
                          Seller Type <span className="text-error-300">*</span>
                        </label>
                        <select
                          id="sellerType"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
                          value={form.sellerTypeId || ""}
                          onChange={handleSellerTypeChange}
                        >
                          <option value="">-- Select Seller Type --</option>
                          {loadingSellerTypes ? (
                            <option value="" disabled>Loading seller types...</option>
                          ) : (
                            sellerTypes.map((type) => (
                              <option
                                key={type.sellerTypeId}
                                value={type.sellerTypeId}
                              >
                                {type.sellerTypeName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Product Types */}
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-primary-700">
                          Product Type(s) <span className="text-error-300">*</span>
                        </label>
                        <div className="relative" ref={productDropdownRef}>
                          <div
                            className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 cursor-pointer flex justify-between items-center hover:border-primary-300 transition-all"
                            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                          >
                            <span className={form.productTypes.length === 0 ? "text-neutral-500" : "text-neutral-900"}>
                              {loadingProductTypes
                                ? "Loading product types..."
                                : form.productTypes.length > 0
                                ? `${form.productTypes.length} product type(s) selected`
                                : "Select product types"}
                            </span>
                            <i className={`bi ${isProductDropdownOpen ? "bi-chevron-up" : "bi-chevron-down"} text-primary-600`}></i>
                          </div>

                          {isProductDropdownOpen && (
                            <div className="absolute top-full mt-1 w-full bg-white border-2 border-primary-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                              <div className="p-2 border-b border-primary-100 sticky top-0 bg-white">
                                <p className="text-sm text-neutral-600 font-medium">
                                  Select product types:
                                </p>
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {/* Select All */}
                                {productTypes.length > 0 && (
                                  <div
                                    className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100"
                                    onClick={handleSelectAllProductTypes}
                                  >
                                    <input
                                      type="checkbox"
                                      id="select-all"
                                      checked={
                                        productTypes.length > 0 && 
                                        form.productTypes.length === productTypes.length
                                      }
                                      onChange={() => {}}
                                      className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
                                    />
                                    <label
                                      htmlFor="select-all"
                                      className="ml-3 text-sm font-medium text-primary-700 cursor-pointer"
                                    >
                                      Select All
                                    </label>
                                  </div>
                                )}

                                {/* Individual Products */}
                                {loadingProductTypes ? (
                                  <div className="px-4 py-2 text-center text-neutral-500">
                                    Loading product types...
                                  </div>
                                ) : productTypes.length === 0 ? (
                                  <div className="px-4 py-2 text-center text-neutral-500">
                                    No product types available
                                  </div>
                                ) : (
                                  productTypes.map((product) => (
                                    <div
                                      key={product.productTypeId}
                                      className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100 last:border-b-0"
                                      onClick={() => handleProductTypeToggle(product)}
                                    >
                                      <input
                                        type="checkbox"
                                        id={`product-${product.productTypeId}`}
                                        checked={form.productTypeIds.includes(product.productTypeId)}
                                        onChange={() => {}}
                                        className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
                                      />
                                      <label
                                        htmlFor={`product-${product.productTypeId}`}
                                        className="ml-3 text-sm text-neutral-900 cursor-pointer"
                                      >
                                        {product.productTypeName}
                                        {product.regulatoryCategory && (
                                          <span className="ml-2 text-xs text-primary-600">
                                            ({product.regulatoryCategory})
                                          </span>
                                        )}
                                      </label>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="p-2 border-t border-primary-100 bg-primary-50 sticky bottom-0">
                                <p className="text-xs text-neutral-500">
                                  {form.productTypes.length} of {productTypes.length} selected
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {form.productTypes.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-success-300">
                              <i className="bi bi-check-circle-fill mr-1"></i>
                              Selected: {form.productTypes.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="state"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-geo-alt"></i>State:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <select
                          id="state"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
                          value={form.stateId || ""}
                          onChange={handleStateChange}
                        >
                          <option value="">-- Select State --</option>
                          {loadingStates ? (
                            <option value="" disabled>Loading states...</option>
                          ) : statesError ? (
                            <option value="" disabled className="text-error-300">
                              ⚠️ Failed to load
                            </option>
                          ) : (
                            states.map((state) => (
                              <option key={state.stateId} value={state.stateId}>
                                {state.stateName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="district"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-geo"></i>District:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <select
                          id="district"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
                          value={form.districtId || ""}
                          onChange={handleDistrictChange}
                          disabled={!form.stateId}
                        >
                          <option value="">-- Select District --</option>
                          {loadingDistricts ? (
                            <option value="" disabled>Loading districts...</option>
                          ) : (
                            districts.map((district) => (
                              <option
                                key={district.districtId}
                                value={district.districtId}
                              >
                                {district.districtName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="taluka"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-map"></i>Taluka:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <select
                          id="taluka"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
                          value={form.talukaId || ""}
                          onChange={handleTalukaChange}
                          disabled={!form.districtId}
                        >
                          <option value="">-- Select Taluka --</option>
                          {loadingTalukas ? (
                            <option value="" disabled>Loading talukas...</option>
                          ) : (
                            talukas.map((taluka) => (
                              <option key={taluka.talukaId} value={taluka.talukaId}>
                                {taluka.talukaName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="city"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-geo-fill"></i>City/Town/Village:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="city"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter city/town/village"
                          value={form.city}
                          onKeyPress={handleAlphabetKeyPress}
                          onChange={(e) => handleAlphabetInput(e, "city")}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="street"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-signpost"></i>Street/Road/Lane:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="street"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter street/road/lane"
                          value={form.street}
                          onKeyPress={handleAlphabetKeyPress}
                          onChange={(e) => handleAlphabetInput(e, "street")}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="buildingNo"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-house-door"></i>Building/House No:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="buildingNo"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter building/house no"
                          value={form.buildingNo}
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="landmark"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-geo"></i>Landmark:
                        </label>
                        <input
                          type="text"
                          id="landmark"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter landmark (optional)"
                          value={form.landmark}
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="pincode"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-pin-map"></i>Pin Code:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="pincode"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter 6-digit pin code"
                          maxLength={6}
                          value={form.pincode}
                          onChange={(e) => handleNumericInput(e, "pincode", 6)}
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="phone"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-telephone"></i>Company Phone:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter company phone"
                          maxLength={10}
                          value={form.phone}
                          onChange={(e) => handleNumericInput(e, "phone", 10)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-envelope"></i>Company Email ID:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter company email"
                          value={form.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label
                          htmlFor="website"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-globe"></i>Company Website (Optional):
                        </label>
                        <input
                          type="url"
                          id="website"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter company website"
                          value={form.website}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: COORDINATOR */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
                <div className="mb-6">
                  <div className="text-center mb-6">
                    {(!emailVerified || !phoneVerified) && (
                      <div className="mt-3 p-3 bg-warning-100 border border-warning-200 rounded-xl text-warning-800 text-sm inline-flex items-center">
                        <i className="bi bi-exclamation-triangle mr-2"></i>
                        Please verify both Email and Mobile OTP to proceed
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="coordinatorName"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-person"></i>Coordinator Name:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="coordinatorName"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter coordinator name"
                          value={form.coordinatorName}
                          onKeyPress={handleAlphabetKeyPress}
                          onChange={(e) => handleAlphabetInput(e, "coordinatorName")}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="coordinatorDesignation"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-briefcase"></i>Coordinator Designation:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="coordinatorDesignation"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter designation"
                          value={form.coordinatorDesignation}
                          onKeyPress={handleAlphabetKeyPress}
                          onChange={(e) => handleAlphabetInput(e, "coordinatorDesignation")}
                        />
                      </div>
                    </div>

                    {/* Coordinator Email and Mobile Verification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <OtpVerification
                          label="Email"
                          value={form.coordinatorEmail}
                          onChange={(val: string) =>
                            setForm((prev) => ({
                              ...prev,
                              coordinatorEmail: val,
                            }))
                          }
                          onVerified={() => {
                            setEmailVerified(true);
                          }}
                          verified={emailVerified}
                        />
                      </div>
                      <div>
                        <OtpVerification
                          label="Mobile"
                          value={form.coordinatorMobile}
                          onChange={(val: string) =>
                            setForm((prev) => ({
                              ...prev,
                              coordinatorMobile: val,
                            }))
                          }
                          onVerified={() => {
                            setPhoneVerified(true);
                          }}
                          verified={phoneVerified}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENTS */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
                <div className="mb-6">
                  {/* GST Certificate Section */}
                  <div className="mb-2">
                    <div className="bg-primary-50 rounded-xl p-1 mb-2">
                      <h3 className="text-lg font-semibold text-primary-700 flex items-center">
                        <i className="bi bi-file-earmark-text mr-2"></i>GSTIN
                        Certificate
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="gstNumber"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-hash"></i>GST Number:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="gstNumber"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          placeholder="Enter GST number"
                          value={form.gstNumber}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="gstFile"
                          className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                        >
                          <i className="bi bi-upload"></i>GST Certificate:{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="file"
                          id="gstFile"
                          className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleChange}
                        />
                        {form.gstFile && (
                          <p className="mt-2 text-sm text-success-300">
                            <i className="bi bi-check-circle-fill mr-1"></i>
                            File selected: {form.gstFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic License Sections */}
                  {form.productTypes.map((productType) => {
                    const licenseInfo = getLicenseInfo(productType);
                    const licenseData = form.licenses[productType] || {
                      number: "",
                      file: null,
                      issueDate: null,
                      expiryDate: null,
                      issuingAuthority: "",
                      status: 'Expired'
                    };

                    return (
                      <div key={productType} className="mb-6">
                        <div className="bg-primary-50 rounded-xl p-2 mb-3">
                          <h3 className="text-lg font-semibold text-primary-700 flex items-center">
                            <i className="bi bi-prescription2 mr-2"></i>
                            {licenseInfo.label}
                            <span className="ml-2 text-sm font-normal text-neutral-600">
                              (Required for: {productType})
                            </span>
                          </h3>
                        </div>

                        {/* License Number and File Upload */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label
                              htmlFor={`licenseNumber-${productType}`}
                              className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                            >
                              <i className="bi bi-hash"></i>
                              {licenseInfo.label} Number:{" "}
                              <span className="text-error-300">*</span>
                            </label>
                            <input
                              type="text"
                              id={`licenseNumber-${productType}`}
                              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                              placeholder={licenseInfo.placeholder}
                              value={licenseData.number}
                              onChange={handleChange}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`licenseFile-${productType}`}
                              className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                            >
                              <i className="bi bi-upload"></i>
                              {licenseInfo.label} File Upload:{" "}
                              <span className="text-error-300">*</span>
                            </label>
                            <input
                              type="file"
                              id={`licenseFile-${productType}`}
                              className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleChange}
                            />
                            {licenseData.file && (
                              <p className="mt-2 text-sm text-success-300">
                                <i className="bi bi-check-circle-fill mr-1"></i>
                                File selected: {licenseData.file.name}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* License Issue Date and Expiry Date with MUI DatePicker */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                              <i className="bi bi-calendar"></i>
                              License Issue Date:{" "}
                              <span className="text-error-300">*</span>
                            </label>
                            <DatePicker
                              value={licenseData.issueDate}
                              onChange={(date) => handleIssueDateChange(date, productType)}
                              maxDate={new Date()}
                              format="dd/MM/yyyy"
                              slotProps={{
                                textField: {
                                  size: "small",
                                  fullWidth: true,
                                  placeholder: "DD/MM/YYYY",
                                  sx: {
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '12px',
                                      backgroundColor: 'white',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderWidth: '2px',
                                        borderColor: 'var(--primary-200)',
                                      },
                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--primary-600)',
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--primary-600)',
                                      },
                                    },
                                  },
                                },
                              }}
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
                              <i className="bi bi-calendar-x"></i>
                              License Expiry Date:{" "}
                              <span className="text-error-300">*</span>
                            </label>
                            <DatePicker
                              value={licenseData.expiryDate}
                              onChange={(date) => handleExpiryDateChange(date, productType)}
                              minDate={licenseData.issueDate || undefined}
                              format="dd/MM/yyyy"
                              slotProps={{
                                textField: {
                                  size: "small",
                                  fullWidth: true,
                                  placeholder: "DD/MM/YYYY",
                                  sx: {
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '12px',
                                      backgroundColor: 'white',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderWidth: '2px',
                                        borderColor: 'var(--primary-200)',
                                      },
                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--primary-600)',
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--primary-600)',
                                      },
                                    },
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>

                        {/* License Issuing Authority and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor={`licenseIssuingAuthority-${productType}`}
                              className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                            >
                              <i className="bi bi-building"></i>
                              Issuing Authority:{" "}
                              <span className="text-error-300">*</span>
                            </label>
                            <input
                              type="text"
                              id={`licenseIssuingAuthority-${productType}`}
                              className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                              placeholder="Enter issuing authority"
                              value={licenseData.issuingAuthority}
                              onChange={handleChange}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`licenseStatus-${productType}`}
                              className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
                            >
                              <i className="bi bi-shield-check"></i>
                              License Status:
                            </label>
                            <div
                              className={`w-full px-4 py-2 border-2 rounded-xl font-semibold flex items-center ${
                                licenseData.status === 'Active'
                                  ? 'border-success-300 bg-success-100 text-success-300'
                                  : 'border-error-300 bg-error-100 text-error-300'
                              }`}
                            >
                              <i className={`bi ${
                                licenseData.status === 'Active' 
                                  ? 'bi-check-circle-fill' 
                                  : 'bi-exclamation-triangle-fill'
                              } mr-2`}></i>
                              {licenseData.status || 'Not Calculated'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {form.productTypes.length === 0 && (
                    <div className="mt-6 p-4 bg-warning-100 border border-warning-200 rounded-xl">
                      <div className="flex items-center">
                        <i className="bi bi-exclamation-triangle text-warning-800 text-xl mr-3"></i>
                        <div>
                          <p className="text-warning-800 font-medium">
                            No product types selected
                          </p>
                          <p className="text-warning-700 text-sm mt-1">
                            Please go back to Step 1 and select at least one
                            product type.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: BANK DETAILS */}
            {step === 4 && (
              <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
                <div className="mb-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="accountNumber"
                          className="block mb-2 text-sm font-semibold text-primary-700"
                        >
                          Account Number <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="accountNumber"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          value={form.accountNumber}
                          onChange={handleChange}
                          placeholder="Enter account number"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="accountHolderName"
                          className="block mb-2 text-sm font-semibold text-primary-700"
                        >
                          Account Holder Name{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="accountHolderName"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                          value={form.accountHolderName}
                          onChange={(e) => handleAlphabetInput(e, "accountHolderName")}
                          onKeyPress={handleAlphabetKeyPress}
                          placeholder="As per bank records"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="ifscCode"
                          className="block mb-2 text-sm font-semibold text-primary-700"
                        >
                          IFSC Code <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="text"
                          id="ifscCode"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all uppercase"
                          maxLength={11}
                          value={form.ifscCode}
                          onChange={(e) => handleIfscChange(e.target.value)}
                          placeholder="SBIN0005943"
                        />
                        {ifscError && (
                          <p className="mt-1 text-sm text-error-300">
                            {ifscError}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="cancelledChequeFile"
                          className="block mb-2 text-sm font-semibold text-primary-700"
                        >
                          Cancelled Cheque / Bank Details Proof{" "}
                          <span className="text-error-300">*</span>
                        </label>
                        <input
                          type="file"
                          id="cancelledChequeFile"
                          className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleChange}
                        />
                        {form.cancelledChequeFile && (
                          <p className="mt-2 text-sm text-success-300">
                            <i className="bi bi-check-circle-fill mr-1"></i>
                            File selected: {form.cancelledChequeFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-primary-700">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
                          value={form.bankName}
                          disabled
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-semibold text-primary-700">
                          Branch
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
                          value={form.branch}
                          disabled
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-semibold text-primary-700">
                          State
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
                          value={form.bankState}
                          disabled
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-semibold text-primary-700">
                          District
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
                          value={form.bankDistrict}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                      <div className="flex">
                        <i className="bi bi-shield-check text-primary-700 text-2xl mr-4"></i>
                        <div>
                          <h6 className="font-bold text-primary-800 mb-1">
                            Security Assurance
                          </h6>
                          <p className="text-sm text-neutral-700">
                            Your bank details are encrypted and stored securely.
                            We follow PCI-DSS compliance standards for financial
                            data protection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW */}
            {step === 5 && (
              <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-4 md:p-6 mb-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i className="bi bi-shield-check text-white text-2xl"></i>
                  </div>
                  <h4 className="text-2xl font-bold bg-linear-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                    Final Submission Summary
                  </h4>
                  <p className="text-neutral-600 mt-2">
                    Please review all details before final submission
                  </p>
                </div>

                {/* Company Section */}
                <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                  <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                    <i className="bi bi-building mr-2"></i> Company Details
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Company Name", value: form.sellerName },
                      { label: "Company Type", value: form.companyType },
                      { label: "Seller Type", value: form.sellerType },
                      {
                        label: "Product Type(s)",
                        value: form.productTypes.join(", "),
                      },
                      { label: "State", value: form.state },
                      { label: "District", value: form.district },
                      { label: "Taluka", value: form.taluka },
                      { label: "City/Town/Village", value: form.city },
                      { label: "Street/Road/Lane", value: form.street },
                      { label: "Building/House No", value: form.buildingNo },
                      { label: "Landmark", value: form.landmark || "N/A" },
                      { label: "Pin Code", value: form.pincode },
                      { label: "Phone", value: form.phone },
                      { label: "Email", value: form.email },
                      { label: "Website", value: form.website || "N/A" },
                    ].map((item, index) => (
                      <div key={index}>
                        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                          {item.label}
                        </span>
                        <p
                          className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                            !item.value ||
                            (item.value === "N/A" && item.label === "Landmark") ||
                            (item.value === "N/A" && item.label === "Website")
                              ? "text-neutral-500"
                              : "text-neutral-900"
                          }`}
                        >
                          {item.value || "Not provided"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coordinator Section */}
                <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                  <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                    <i className="bi bi-person-badge mr-2"></i> Coordinator Details
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Name", value: form.coordinatorName },
                      { label: "Designation", value: form.coordinatorDesignation },
                      {
                        label: "Email",
                        value: form.coordinatorEmail,
                        verified: emailVerified,
                      },
                      {
                        label: "Mobile",
                        value: form.coordinatorMobile,
                        verified: phoneVerified,
                      },
                    ].map((item, index) => (
                      <div key={index}>
                        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                          {item.label}
                        </span>
                        <p
                          className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                            !item.value ? "text-error-300" : "text-neutral-900"
                          }`}
                        >
                          {item.value || "Not provided"}
                          {item.verified !== undefined && item.value && (
                            <span
                              className={`ml-2 px-2 py-1 text-xs rounded ${
                                item.verified
                                  ? "bg-success-100 text-success-300"
                                  : "bg-warning-100 text-warning-300"
                              }`}
                            >
                              {item.verified ? "✔ Verified" : "Not verified"}
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                  <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                    <i className="bi bi-file-earmark-lock mr-2"></i> Compliance Documents
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                        GST Number
                      </span>
                      <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                        !form.gstNumber ? "text-error-300" : "text-neutral-900"
                      }`}>
                        {form.gstNumber || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                        GST Certificate
                      </span>
                      <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                        !form.gstFile ? "text-error-300" : "text-neutral-900"
                      }`}>
                        {form.gstFile ? (
                          <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                            <i className="bi bi-file-earmark-pdf mr-2"></i>
                            {form.gstFile.name}
                          </span>
                        ) : (
                          "Not uploaded"
                        )}
                      </p>
                    </div>

                    {form.productTypes.map((productType) => {
                      const licenseInfo = getLicenseInfo(productType);
                      const licenseData = form.licenses[productType];
                      return (
                        <React.Fragment key={productType}>
                          <div className="md:col-span-2 mt-2">
                            <h6 className="text-sm font-bold text-primary-600 mb-2">
                              {licenseInfo.label} - {productType}
                            </h6>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                              License Number
                            </span>
                            <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                              !licenseData?.number ? "text-error-300" : "text-neutral-900"
                            }`}>
                              {licenseData?.number || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                              License File
                            </span>
                            <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                              !licenseData?.file ? "text-error-300" : "text-neutral-900"
                            }`}>
                              {licenseData?.file ? (
                                <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                                  <i className="bi bi-file-earmark-pdf mr-2"></i>
                                  {licenseData.file.name}
                                </span>
                              ) : (
                                "Not uploaded"
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                              Issue Date
                            </span>
                            <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                              !licenseData?.issueDate ? "text-error-300" : "text-neutral-900"
                            }`}>
                              {licenseData?.issueDate ? new Date(licenseData.issueDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              }) : "Not provided"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                              Expiry Date
                            </span>
                            <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                              !licenseData?.expiryDate ? "text-error-300" : "text-neutral-900"
                            }`}>
                              {licenseData?.expiryDate ? new Date(licenseData.expiryDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              }) : "Not provided"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                              Issuing Authority
                            </span>
                            <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                              !licenseData?.issuingAuthority ? "text-error-300" : "text-neutral-900"
                            }`}>
                              {licenseData?.issuingAuthority || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                              License Status
                            </span>
                            <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                              licenseData?.status === 'Active' 
                                ? 'text-success-300 bg-success-100' 
                                : 'text-error-300 bg-error-100'
                            }`}>
                              <i className={`bi ${
                                licenseData?.status === 'Active' 
                                  ? 'bi-check-circle-fill' 
                                  : 'bi-exclamation-triangle-fill'
                              } mr-2`}></i>
                              {licenseData?.status || "Not calculated"}
                            </p>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Bank Details Section */}
                <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                  <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                    <i className="bi bi-bank mr-2"></i> Bank Account Details
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Bank Name", value: form.bankName },
                      { label: "Branch", value: form.branch },
                      { label: "State", value: form.bankState },
                      { label: "District", value: form.bankDistrict },
                      { label: "IFSC Code", value: form.ifscCode },
                      {
                        label: "Account Number",
                        value: form.accountNumber
                          ? "****" + form.accountNumber.slice(-4)
                          : "",
                      },
                      {
                        label: "Account Holder Name",
                        value: form.accountHolderName,
                      },
                      {
                        label: "Cancelled Cheque",
                        value: form.cancelledChequeFile ? (
                          <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                            <i className="bi bi-file-earmark-pdf mr-2"></i>
                            {form.cancelledChequeFile.name}
                          </span>
                        ) : (
                          "Not uploaded"
                        ),
                      },
                    ].map((item, index) => (
                      <div key={index}>
                        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
                          {item.label}
                        </span>
                        <p
                          className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
                            !item.value || item.value === "Not uploaded"
                              ? "text-error-300"
                              : "text-neutral-900"
                          }`}
                        >
                          {item.value || "Not provided"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Summary */}
                <div className="p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
                  <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
                    <i className="bi bi-clipboard-check mr-2"></i> Validation Summary
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        label: "Company Info",
                        complete:
                          form.sellerName &&
                          form.pincode &&
                          form.productTypes.length > 0,
                      },
                      {
                        label: "Verification",
                        complete: emailVerified && phoneVerified,
                      },
                      {
                        label: "GST Document",
                        complete: !!form.gstFile,
                      },
                      {
                        label: "Product Licenses",
                        complete:
                          form.productTypes.length > 0 &&
                          form.productTypes.every(
                            (pt) => {
                              const license = form.licenses[pt];
                              return license && 
                                     license.number && 
                                     license.file && 
                                     license.issueDate && 
                                     license.expiryDate && 
                                     license.issuingAuthority;
                            }
                          ),
                      },
                      {
                        label: "Bank Details",
                        complete:
                          form.ifscCode &&
                          form.accountNumber &&
                          form.cancelledChequeFile,
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center">
                        <i
                          className={`bi ${
                            item.complete
                              ? "bi-check-circle-fill text-success-300"
                              : "bi-x-circle-fill text-error-300"
                          } text-lg mr-3`}
                        ></i>
                        <span className="text-sm font-medium text-neutral-700">
                          {item.label}: {item.complete ? "Complete" : "Incomplete"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t border-neutral-200 gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto"
                >
                  <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
                    <i className="bi bi-arrow-left mr-2"></i> Back
                  </span>
                  <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                </button>
              )}

              <div className="w-full md:w-auto md:ml-auto flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
                    {submitting ? (
                      <>
                        <i className="bi bi-hourglass-split mr-2 animate-spin"></i>
                        Submitting...
                      </>
                    ) : step < 5 ? (
                      <>
                        Continue <i className="bi bi-arrow-right ml-2"></i>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle mr-2"></i> Submit Application
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </LocalizationProvider>
  );
}











// this code is without integration of licensce date and issuing authority............

// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import OtpVerification from "./OtpVerification";
// import Header from "@/src/app/components/Header";
// import { useRouter } from "next/navigation";
// import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
// import { fetchBankDetails } from "@/src/services/seller/IFSCService";
// import { ifscSchema } from "@/src/schema/seller/IFSCSchema";
// import { step1Schema, step2Schema, step3Schema, step4Schema } from "@/src/schema/seller/sellerRegSchema";
// import { toast } from "react-toastify";
// import { z } from "zod";
// import {
//   CompanyTypeResponse,
//   SellerTypeResponse,
//   ProductTypeResponse,
//   StateResponse,
//   DistrictResponse,
//   TalukaResponse,
// } from "@/src/types/seller/SellerRegMasterData";
// import {
//   TempSellerRequest,
//   TempSellerDocument,
//   TempSellerBankDetails,
//   TempSellerAddress,
//   TempSellerCoordinator,
// } from "@/src/types/seller/sellerRegistrationData";

// export default function SellerRegister() {
//   const router = useRouter();
//   const [step, setStep] = useState(1);
//   const [emailVerified, setEmailVerified] = useState(false);
//   const [phoneVerified, setPhoneVerified] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [applicationId, setApplicationId] = useState("");
//   const [ifscError, setIfscError] = useState("");
//   const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
//   const productDropdownRef = useRef<HTMLDivElement>(null);

//   // ========== Master Data State ==========
//   const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([]);
//   const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([]);
//   const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([]);
//   const [states, setStates] = useState<StateResponse[]>([]);
//   const [districts, setDistricts] = useState<DistrictResponse[]>([]);
//   const [talukas, setTalukas] = useState<TalukaResponse[]>([]);

//   // ========== Loading States ==========
//   const [loadingCompanyTypes, setLoadingCompanyTypes] = useState(true);
//   const [loadingSellerTypes, setLoadingSellerTypes] = useState(true);
//   const [loadingProductTypes, setLoadingProductTypes] = useState(true);
//   const [loadingStates, setLoadingStates] = useState(true);
//   const [loadingDistricts, setLoadingDistricts] = useState(false);
//   const [loadingTalukas, setLoadingTalukas] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
  
//   // ========== Error States ==========
//   const [companyTypesError, setCompanyTypesError] = useState<string | null>(null);
//   const [statesError, setStatesError] = useState<string | null>(null);

//   // ========== Form State ==========
//   const [form, setForm] = useState({
//     // IDs for submission
//     companyTypeId: 0,
//     sellerTypeId: 0,
//     productTypeIds: [] as number[],
//     stateId: 0,
//     districtId: 0,
//     talukaId: 0,
//     // Display names for UI
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
//     // Licenses per product
//     licenses: {} as Record<string, { 
//       number: string; 
//       file: File | null;
//       issueDate: Date | null;
//       expiryDate: Date | null;
//       issuingAuthority: string;
//       status: 'Active' | 'Expired';
//     }>,
//     // Bank details
//     bankState: "",
//     bankDistrict: "",
//     bankName: "",
//     branch: "",
//     ifscCode: "",
//     accountNumber: "",
//     accountHolderName: "",
//     cancelledChequeFile: null as File | null,
//   });

//   // ========== Close dropdown when clicking outside ==========
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         productDropdownRef.current &&
//         !productDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsProductDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ========== FETCH ALL MASTER DATA ON MOUNT ==========
//   useEffect(() => {
//     fetchCompanyTypes();
//     fetchStates();
//     fetchSellerTypes();
//     fetchProductTypes();
//   }, []);

//   const fetchCompanyTypes = async () => {
//     setLoadingCompanyTypes(true);
//     setCompanyTypesError(null);
//     try {
//       const data = await sellerRegMasterService.getCompanyTypes();
//       setCompanyTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching company types:", error);
//       setCompanyTypesError("Failed to load company types");
//       setCompanyTypes([]);
//       toast.error("Failed to load company types. Please refresh the page.");
//     } finally {
//       setLoadingCompanyTypes(false);
//     }
//   };

//   const fetchStates = async () => {
//     setLoadingStates(true);
//     setStatesError(null);
//     try {
//       const data = await sellerRegMasterService.getStates();
//       setStates(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching states:", error);
//       setStatesError("Failed to load states");
//       setStates([]);
//       toast.error("Failed to load states. Please refresh the page.");
//     } finally {
//       setLoadingStates(false);
//     }
//   };

//   const fetchSellerTypes = async () => {
//     setLoadingSellerTypes(true);
//     try {
//       const data = await sellerRegMasterService.getSellerTypes();
//       setSellerTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching seller types:", error);
//       setSellerTypes([]);
//       toast.error("Failed to load seller types.");
//     } finally {
//       setLoadingSellerTypes(false);
//     }
//   };

//   const fetchProductTypes = async () => {
//     setLoadingProductTypes(true);
//     try {
//       const data = await sellerRegMasterService.getProductTypes();
//       setProductTypes(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Error fetching product types:", error);
//       setProductTypes([]);
//       toast.error("Failed to load product types.");
//     } finally {
//       setLoadingProductTypes(false);
//     }
//   };

//   // ========== FETCH DISTRICTS (when state changes) ==========
//   const fetchDistrictsByState = async (stateId: number) => {
//     if (!stateId) return;
    
//     setLoadingDistricts(true);
//     try {
//       const allDistricts = await sellerRegMasterService.getDistricts();
//       const filtered = Array.isArray(allDistricts) 
//         ? allDistricts.filter((d) => d.stateId === stateId)
//         : [];
//       setDistricts(filtered);
//     } catch (error) {
//       console.error("Error fetching districts:", error);
//       setDistricts([]);
//       toast.error("Failed to load districts.");
//     } finally {
//       setLoadingDistricts(false);
//     }
//   };

//   // ========== FETCH TALUKAS (when district changes) ==========
//   const fetchTalukasByDistrict = async (districtId: number) => {
//     if (!districtId) return;
    
//     setLoadingTalukas(true);
//     try {
//       const allTalukas = await sellerRegMasterService.getTalukas();
//       const filtered = Array.isArray(allTalukas)
//         ? allTalukas.filter((t) => t.districtId === districtId)
//         : [];
//       setTalukas(filtered);
//     } catch (error) {
//       console.error("Error fetching talukas:", error);
//       setTalukas([]);
//       toast.error("Failed to load talukas.");
//     } finally {
//       setLoadingTalukas(false);
//     }
//   };

//   // ========== Function to Calculate License Status ==========
//   const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): 'Active' | 'Expired' => {
//     if (!issueDate || !expiryDate) return 'Expired';
    
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const expDate = new Date(expiryDate);
//     expDate.setHours(0, 0, 0, 0);
    
//     return today <= expDate ? 'Active' : 'Expired';
//   };

//   // ========== Form Handlers ==========
//   const handleChange = (e: any) => {
//     const { id, value, files, type } = e.target;

//     if (type === "file" && files && files[0]) {
//       // Validate file size (max 5MB)
//       if (files[0].size > 5 * 1024 * 1024) {
//         toast.error("File size should be less than 5MB");
//         return;
//       }
      
//       // Validate file type
//       const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
//       if (!allowedTypes.includes(files[0].type)) {
//         toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
//         return;
//       }

//       if (id.startsWith("licenseFile-")) {
//         const licenseId = id.replace("licenseFile-", "");
//         setForm((prev) => {
//           const updatedLicenses = {
//             ...prev.licenses,
//             [licenseId]: {
//               ...prev.licenses[licenseId],
//               file: files[0],
//             },
//           };
          
//           // Recalculate status
//           if (updatedLicenses[licenseId].issueDate && updatedLicenses[licenseId].expiryDate) {
//             updatedLicenses[licenseId].status = calculateLicenseStatus(
//               updatedLicenses[licenseId].issueDate,
//               updatedLicenses[licenseId].expiryDate
//             );
//           }
          
//           return {
//             ...prev,
//             licenses: updatedLicenses,
//           };
//         });
//       } else {
//         setForm((prev) => ({ ...prev, [id]: files[0] }));
//       }
//     } else if (id.startsWith("licenseNumber-")) {
//       const licenseId = id.replace("licenseNumber-", "");
//       setForm((prev) => ({
//         ...prev,
//         licenses: {
//           ...prev.licenses,
//           [licenseId]: {
//             ...prev.licenses[licenseId],
//             number: value,
//           },
//         },
//       }));
//     } else if (id.startsWith("licenseIssuingAuthority-")) {
//       const licenseId = id.replace("licenseIssuingAuthority-", "");
//       setForm((prev) => ({
//         ...prev,
//         licenses: {
//           ...prev.licenses,
//           [licenseId]: {
//             ...prev.licenses[licenseId],
//             issuingAuthority: value,
//           },
//         },
//       }));
//     } else {
//       setForm((prev) => ({ ...prev, [id]: value }));
//     }
//   };

//   // MUI Date picker handlers
//   const handleIssueDateChange = (date: Date | null, licenseId: string) => {
//     if (date) {
//       // Validate that issue date is not greater than today
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       date.setHours(0, 0, 0, 0);
      
//       if (date > today) {
//         toast.error("Issue date cannot be greater than today's date");
//         return;
//       }
//     }

//     setForm((prev) => {
//       const updatedLicenses = {
//         ...prev.licenses,
//         [licenseId]: {
//           ...prev.licenses[licenseId],
//           issueDate: date,
//         },
//       };
      
//       // Recalculate status
//       if (updatedLicenses[licenseId].expiryDate) {
//         updatedLicenses[licenseId].status = calculateLicenseStatus(
//           date,
//           updatedLicenses[licenseId].expiryDate
//         );
//       }
      
//       return {
//         ...prev,
//         licenses: updatedLicenses,
//       };
//     });
//   };

//   const handleExpiryDateChange = (date: Date | null, licenseId: string) => {
//     setForm((prev) => {
//       const updatedLicenses = {
//         ...prev.licenses,
//         [licenseId]: {
//           ...prev.licenses[licenseId],
//           expiryDate: date,
//         },
//       };
      
//       // Recalculate status
//       if (updatedLicenses[licenseId].issueDate) {
//         updatedLicenses[licenseId].status = calculateLicenseStatus(
//           updatedLicenses[licenseId].issueDate,
//           date
//         );
//       }
      
//       return {
//         ...prev,
//         licenses: updatedLicenses,
//       };
//     });
//   };

//   // Company Type Selection
//   const handleCompanyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = e.target.value ? parseInt(e.target.value) : 0;
//     const selected = companyTypes.find((c) => c?.companyTypeId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       companyTypeId: selectedId,
//       companyType: selected?.companyTypeName || "",
//     }));
//   };

//   // Seller Type Selection
//   const handleSellerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = sellerTypes.find((s) => s.sellerTypeId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       sellerTypeId: selectedId || 0,
//       sellerType: selected?.sellerTypeName || "",
//     }));
//   };

//   // State Selection
//   const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = states.find((s) => s.stateId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       stateId: selectedId || 0,
//       state: selected?.stateName || "",
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

//   // District Selection
//   const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = districts.find((d) => d.districtId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       districtId: selectedId || 0,
//       district: selected?.districtName || "",
//       talukaId: 0,
//       taluka: "",
//     }));
    
//     setTalukas([]);
    
//     if (selectedId) {
//       fetchTalukasByDistrict(selectedId);
//     }
//   };

//   // Taluka Selection
//   const handleTalukaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = talukas.find((t) => t.talukaId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       talukaId: selectedId || 0,
//       taluka: selected?.talukaName || "",
//     }));
//   };

//   // Product Type Toggle
//   const handleProductTypeToggle = (product: ProductTypeResponse) => {
//     if (!product) return;
    
//     setForm((prev) => {
//       let newProductTypeIds = [...prev.productTypeIds];
//       let newProductTypes = [...prev.productTypes];
//       let newLicenses = { ...prev.licenses };

//       if (newProductTypeIds.includes(product.productTypeId)) {
//         newProductTypeIds = newProductTypeIds.filter(
//           (id) => id !== product.productTypeId
//         );
//         newProductTypes = newProductTypes.filter(
//           (name) => name !== product.productTypeName
//         );
//         delete newLicenses[product.productTypeName];
//       } else {
//         newProductTypeIds.push(product.productTypeId);
//         newProductTypes.push(product.productTypeName);
        
//         // Initialize with empty license fields
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const nextYear = new Date();
//         nextYear.setFullYear(nextYear.getFullYear() + 1);
        
//         newLicenses[product.productTypeName] = { 
//           number: "", 
//           file: null,
//           issueDate: today,
//           expiryDate: nextYear,
//           issuingAuthority: "",
//           status: 'Active'
//         };
//       }

//       return {
//         ...prev,
//         productTypeIds: newProductTypeIds,
//         productTypes: newProductTypes,
//         licenses: newLicenses,
//       };
//     });
//   };

//   // Select All Product Types
//   const handleSelectAllProductTypes = () => {
//     if (!productTypes.length) return;
    
//     if (form.productTypes.length === productTypes.length) {
//       // Deselect all
//       setForm((prev) => ({
//         ...prev,
//         productTypeIds: [],
//         productTypes: [],
//         licenses: {},
//       }));
//     } else {
//       // Select all
//       const allIds = productTypes.map((p) => p.productTypeId);
//       const allNames = productTypes.map((p) => p.productTypeName);
      
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const nextYear = new Date();
//       nextYear.setFullYear(nextYear.getFullYear() + 1);
      
//       const newLicenses: Record<string, { 
//         number: string; 
//         file: File | null;
//         issueDate: Date | null;
//         expiryDate: Date | null;
//         issuingAuthority: string;
//         status: 'Active' | 'Expired';
//       }> = {};
      
//       allNames.forEach((name) => {
//         newLicenses[name] = { 
//           number: "", 
//           file: null,
//           issueDate: today,
//           expiryDate: nextYear,
//           issuingAuthority: "",
//           status: 'Active'
//         };
//       });
      
//       setForm((prev) => ({
//         ...prev,
//         productTypeIds: allIds,
//         productTypes: allNames,
//         licenses: newLicenses,
//       }));
//     }
//   };

//   // ========== IFSC Auto-fill using Service and Schema ==========
//   const handleIfscChange = async (value: string) => {
//     const ifsc = value.toUpperCase();
//     setForm((prev) => ({ ...prev, ifscCode: ifsc }));
//     setIfscError("");

//     if (ifsc.length !== 11) {
//       setForm((prev) => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: "",
//       }));
//       return;
//     }

//     // Validate format using Zod schema
//     const parseResult = ifscSchema.safeParse(ifsc);
//     if (!parseResult.success) {
//       setIfscError(parseResult.error.issues[0].message);
//       setForm((prev) => ({
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
//       setForm((prev) => ({
//         ...prev,
//         bankName: data.BANK || "",
//         branch: data.BRANCH || "",
//         bankState: data.STATE || "",
//         bankDistrict: data.DISTRICT || data.CITY || "",
//       }));
//     } catch {
//       setIfscError("Invalid IFSC Code");
//       setForm((prev) => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: "",
//       }));
//       toast.error("Invalid IFSC Code. Please check and try again.");
//     }
//   };

//   // ========== Text Input Handlers ==========
//   const handleAlphabetInput = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     fieldName: string
//   ) => {
//     const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
//     setForm((prev) => ({ ...prev, [fieldName]: value }));
//   };

//   const handleAlphabetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const key = e.key;
//     const isValidKey = /^[a-zA-Z\s,'.-]$/.test(key);
//     if (
//       !isValidKey &&
//       key !== "Backspace" &&
//       key !== "Delete" &&
//       key !== "Tab" &&
//       key !== "ArrowLeft" &&
//       key !== "ArrowRight"
//     ) {
//       e.preventDefault();
//     }
//   };

//   const handleNumericInput = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     fieldName: string,
//     maxLength?: number
//   ) => {
//     let value = e.target.value.replace(/\D/g, "");
//     if (maxLength && value.length > maxLength) {
//       value = value.substring(0, maxLength);
//     }
//     setForm((prev) => ({ ...prev, [fieldName]: value }));
//   };

//   // ========== File Upload Mock ==========
//   const uploadFile = async (file: File, folder: string): Promise<string> => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         const mockUrl = `https://storage.example.com/${folder}/${Date.now()}_${file.name}`;
//         resolve(mockUrl);
//       }, 1500);
//     });
//   };

//   // ========== Get License Info ==========
//   const getLicenseInfo = (productName: string) => {
//     const product = productTypes.find((p) => p.productTypeName === productName);
//     const label = product?.regulatoryCategory
//       ? `${product.regulatoryCategory} License`
//       : `${productName} License`;
//     return {
//       label,
//       placeholder: `Enter ${productName} license number`,
//     };
//   };

//   // ========== Form Validation and Submission with Zod ==========
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Step 1 Validation using Zod
//     if (step === 1) {
//       try {
//         step1Schema.parse(form);
//       } catch (error) {
//         if (error instanceof z.ZodError) {
//           error.issues.forEach((issue) => {
//             toast.error(issue.message);
//           });
//         } else {
//           toast.error("Please fill all required company information fields.");
//         }
//         return;
//       }
//     }

//     // Step 2 Validation
//     if (step === 2) {
//       try {
//         step2Schema.parse(form);
//       } catch (error) {
//         if (error instanceof z.ZodError) {
//           error.issues.forEach((issue) => {
//             toast.error(issue.message);
//           });
//         } else {
//           toast.error("Please fill all coordinator details.");
//         }
//         return;
//       }
//       if (!emailVerified || !phoneVerified) {
//         toast.warning("Please verify both Email and Mobile OTP before proceeding.");
//         return;
//       }
//     }

//     // Step 3 Validation
//     if (step === 3) {
//       try {
//         // Convert dates to strings for validation
//         const licensesForValidation = Object.entries(form.licenses).reduce((acc, [key, value]) => {
//           acc[key] = {
//             ...value,
//             issueDate: value.issueDate ? value.issueDate.toISOString().split('T')[0] : '',
//             expiryDate: value.expiryDate ? value.expiryDate.toISOString().split('T')[0] : '',
//             file: value.file,
//           };
//           return acc;
//         }, {} as any);

//         const schema = step3Schema(form.productTypes);
//         schema.parse({
//           gstNumber: form.gstNumber,
//           gstFile: form.gstFile,
//           licenses: licensesForValidation,
//         });
//       } catch (error) {
//         if (error instanceof z.ZodError) {
//           error.issues.forEach((issue) => {
//             toast.error(issue.message);
//           });
//         } else {
//           toast.error("Please fill all document fields.");
//         }
//         return;
//       }
//     }

//     // Step 4 Validation
//     if (step === 4) {
//       try {
//         step4Schema.parse(form);
//       } catch (error) {
//         if (error instanceof z.ZodError) {
//           error.issues.forEach((issue) => {
//             toast.error(issue.message);
//           });
//         } else {
//           toast.error("Please fill all bank account details.");
//         }
//         return;
//       }
//       if (ifscError) {
//         toast.error("Please fix IFSC code error before proceeding.");
//         return;
//       }
//     }

//     // Step navigation
//     if (step < 5) {
//       setStep(step + 1);
//       return;
//     }

//     // Final Submission
//     setSubmitting(true);
//     try {
//       // Upload GST file
//       let gstFileUrl = "";
//       if (form.gstFile) {
//         gstFileUrl = await uploadFile(form.gstFile, "gst-certificates");
//       }

//       // Upload license files
//       const documents: TempSellerDocument[] = [];
//       for (const productName of form.productTypes) {
//         const product = productTypes.find((p) => p.productTypeName === productName);
//         if (!product) continue;

//         const license = form.licenses[productName];
//         let docFileUrl = "";
//         if (license?.file) {
//           docFileUrl = await uploadFile(license.file, "licenses");
//         }

//         documents.push({
//           productTypeId: product.productTypeId,
//           gstNumber: form.gstNumber,
//           gstFileUrl: gstFileUrl,
//           documentNumber: license?.number || "",
//           documentFileUrl: docFileUrl,
//         });
//       }

//       // Upload cancelled cheque
//       let bankDocumentFileUrl = "";
//       if (form.cancelledChequeFile) {
//         bankDocumentFileUrl = await uploadFile(
//           form.cancelledChequeFile,
//           "bank-documents"
//         );
//       }

//       // Build request objects
//       const address: TempSellerAddress = {
//         stateId: form.stateId,
//         districtId: form.districtId,
//         talukaId: form.talukaId,
//         city: form.city,
//         street: form.street,
//         buildingNo: form.buildingNo,
//         landmark: form.landmark || "",
//         pinCode: form.pincode,
//       };

//       const coordinator: TempSellerCoordinator = {
//         name: form.coordinatorName,
//         designation: form.coordinatorDesignation,
//         email: form.coordinatorEmail,
//         mobile: form.coordinatorMobile,
//       };

//       const bankDetails: TempSellerBankDetails = {
//         bankName: form.bankName,
//         branch: form.branch,
//         ifscCode: form.ifscCode,
//         accountNumber: form.accountNumber,
//         accountHolderName: form.accountHolderName,
//         bankDocumentFileUrl,
//       };

//       const request: TempSellerRequest = {
//         sellerName: form.sellerName,
//         productTypeId: form.productTypeIds,
//         companyTypeId: form.companyTypeId,
//         sellerTypeId: form.sellerTypeId,
//         phone: form.phone,
//         email: form.email,
//         termsAccepted: true,
//         website: form.website || undefined,
//         address,
//         coordinator,
//         bankDetails,
//         documents,
//       };

//       const response = await sellerRegService.createTempSeller(request);
//       setApplicationId(response.sellerRequestId);
//       setShowSuccessModal(true);
//       toast.success("Application submitted successfully!");
//     } catch (error) {
//       console.error("Registration failed:", error);
//       toast.error("Submission failed. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const back = (e: React.MouseEvent) => {
//     e.preventDefault();
//     if (step > 1) {
//       setStep(step - 1);
//     }
//   };

//   const handleCloseModal = () => {
//     setShowSuccessModal(false);
//     router.push("/");
//   };

//   // ========== Step Data ==========
//   const stepData = [
//     {
//       title: "Company",
//       icon: "bi-building",
//       activeIcon: "bi-building-fill",
//       description: "Provide Your Company Details",
//     },
//     {
//       title: "Coordinator",
//       icon: "bi-person-badge",
//       activeIcon: "bi-person-badge-fill",
//       description: "Add Coordinator Information and Verify",
//     },
//     {
//       title: "Documents",
//       icon: "bi-file-earmark-lock",
//       activeIcon: "bi-file-earmark-lock-fill",
//       description: "Upload Required Compliance Documents",
//     },
//     {
//       title: "Bank",
//       icon: "bi-bank",
//       activeIcon: "bi-bank2",
//       description: "Enter Bank Account Details",
//     },
//     {
//       title: "Review",
//       icon: "bi-shield-check",
//       activeIcon: "bi-shield-check",
//       description: "Review Summary",
//     },
//   ];

//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <div className="bg-primary-100 min-h-screen">
//         <Header />

//         {/* Success Modal */}
//         {showSuccessModal && (
//           <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50">
//             <div className="w-90% max-w-500 animate-fadeIn">
//               <div className="bg-primary-100 rounded-2xl shadow-xl overflow-hidden">
//                 <div className="bg-linear-to-r from-tertiary-600 to-tertiary-500 p-4 text-center text-white relative">
//                   <div className="text-4xl mb-2 animate-bounce">
//                     <i className="bi bi-check-circle-fill"></i>
//                   </div>
//                   <h3 className="text-xl font-bold">
//                     Application Submitted Successfully!
//                   </h3>
//                 </div>
//                 <div className="p-4">
//                   <p className="text-neutral-700 text-center text-base leading-relaxed mb-6">
//                     Your seller registration application has been submitted
//                     successfully. Our team will review your application and
//                     contact you within 3-5 business days.
//                   </p>
//                   <div className="rounded-xl p-6 mt-6">
//                     <div className="flex items-center mb-2">
//                       <i className="bi bi-clock text-primary-700 text-xl mr-3"></i>
//                       <span>
//                         Application ID:{" "}
//                         <strong className="text-neutral-900">
//                           {applicationId}
//                         </strong>
//                       </span>
//                     </div>
//                     <div className="flex items-center mb-3">
//                       <i className="bi bi-calendar-check text-primary-700 text-xl mr-3"></i>
//                       <span>
//                         Submitted on:{" "}
//                         <strong className="text-neutral-900">
//                           {new Date().toLocaleDateString("en-IN")}
//                         </strong>
//                       </span>
//                     </div>
//                     <div className="flex items-center">
//                       <i className="bi bi-envelope text-primary-700 text-xl mr-3"></i>
//                       <span>
//                         Confirmation sent to:{" "}
//                         <strong className="text-neutral-900">
//                           {form.email}
//                         </strong>
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="px-8 py-4 bg-neutral-100 border-t border-neutral-200 flex justify-center gap-4">
//                   <button
//                     className="px-6 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all flex items-center shadow-md hover:shadow-lg"
//                     onClick={handleCloseModal}
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Sticky Header & Stepper */}
//         <div className="sticky top-0 z-40 bg-primary-100 pt-2">
//           <div className="mb-1 mx-4 md:mx-10">
//             <div className="mb-6 mt-2">
//               <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-xl p-4 text-white">
//                 <div className="flex flex-col md:flex-row items-center justify-center">
//                   <div className="flex items-center mb-2 md:mb-0">
//                     <div className="w-6 h-6 mr-3 flex items-center justify-center">
//                       <i className="bi bi-building text-white text-xl"></i>
//                     </div>
//                     <div className="text-center md:text-left">
//                       <h2 className="text-xl font-bold">Seller Registration</h2>
//                       <p className="text-primary-200 text-sm">
//                         Register Your Business Here!
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Stepper */}
//             <div className="mb-2">
//               <div className="relative">
//                 <div className="flex justify-between">
//                   {stepData.map((stepInfo, index) => {
//                     const stepNumber = index + 1;
//                     const isActive = step === stepNumber;
//                     const isCompleted = step > stepNumber;
//                     const isClickable = isCompleted || stepNumber === 1;
//                     return (
//                       <div
//                         key={index}
//                         className={`flex flex-col items-center relative ${
//                           isClickable ? "cursor-pointer" : "cursor-default"
//                         }`}
//                         style={{ width: `${100 / stepData.length}%` }}
//                         onClick={() => isClickable && setStep(stepNumber)}
//                       >
//                         {index < stepData.length - 1 && (
//                           <div className="absolute top-6 left-1/2 w-full h-1.5 bg-neutral-200">
//                             <div
//                               className={`h-full transition-all duration-300 ${
//                                 isCompleted
//                                   ? "bg-linear-to-r from-success-300 to-primary-600"
//                                   : "bg-transparent"
//                               }`}
//                               style={{ width: isCompleted ? "100%" : "0%" }}
//                             ></div>
//                           </div>
//                         )}
//                         <div
//                           className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 z-10 transition-all duration-300 ${
//                             isActive
//                               ? "bg-primary-600 text-white shadow-lg border-2 border-white"
//                               : isCompleted
//                               ? "bg-success-300 text-white"
//                               : "bg-white text-neutral-600 border-2 border-neutral-200"
//                           }`}
//                         >
//                           {isCompleted ? (
//                             <i className="bi bi-check-circle-fill text-xl"></i>
//                           ) : (
//                             <i
//                               className={`bi ${
//                                 isActive ? stepInfo.activeIcon : stepInfo.icon
//                               } text-lg`}
//                             ></i>
//                           )}
//                         </div>
//                         <div className="text-center">
//                           <p
//                             className={`text-sm font-bold ${
//                               isActive
//                                 ? "text-primary-600 font-bold"
//                                 : isCompleted
//                                 ? "text-success-300"
//                                 : "text-neutral-900"
//                             }`}
//                           >
//                             {stepInfo.title}
//                           </p>
//                           <p className="text-sm text-neutral-700">
//                             {stepInfo.description}
//                           </p>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Scrollable Form Content */}
//         <div className="mx-4 md:mx-10 pb-6">
//           <form onSubmit={handleSubmit}>
//             {/* STEP 1: COMPANY */}
//             {step === 1 && (
//               <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6 md:p-6 mb-6">
//                 <div className="mb-6">
//                   <div className="space-y-5">
//                     {/* Company Name */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label
//                           htmlFor="sellerName"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-building"></i>
//                           Seller Name/Company Name:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="sellerName"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter your company name"
//                           value={form.sellerName}
//                           onKeyPress={handleAlphabetKeyPress}
//                           onChange={(e) => handleAlphabetInput(e, "sellerName")}
//                         />
//                       </div>

//                       {/* Company Type */}
//                       <div>
//                         <label
//                           htmlFor="companyType"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-diagram-3"></i>
//                           Company Type: <span className="text-error-300">*</span>
//                         </label>
//                         <select
//                           id="companyType"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                           value={form.companyTypeId || ""}
//                           onChange={handleCompanyTypeChange}
//                         >
//                           <option value="">-- Select Company Type --</option>
//                           {loadingCompanyTypes ? (
//                             <option value="" disabled>Loading company types...</option>
//                           ) : companyTypesError ? (
//                             <option value="" disabled className="text-error-300">
//                               ⚠️ Failed to load. Please refresh.
//                             </option>
//                           ) : companyTypes && companyTypes.length > 0 ? (
//                             companyTypes.map((type) => (
//                               <option 
//                                 key={type?.companyTypeId || Math.random()} 
//                                 value={type?.companyTypeId || ""}
//                               >
//                                 {type?.companyTypeName || "Unknown"}
//                               </option>
//                             ))
//                           ) : (
//                             <option value="" disabled>No company types available</option>
//                           )}
//                         </select>
//                         {companyTypesError && (
//                           <p className="mt-1 text-xs text-error-300">
//                             {companyTypesError}. 
//                             <button 
//                               type="button"
//                               onClick={fetchCompanyTypes}
//                               className="ml-2 text-primary-600 underline"
//                             >
//                               Retry
//                             </button>
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Seller Type & Product Types */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label
//                           htmlFor="sellerType"
//                           className="block mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           Seller Type <span className="text-error-300">*</span>
//                         </label>
//                         <select
//                           id="sellerType"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                           value={form.sellerTypeId || ""}
//                           onChange={handleSellerTypeChange}
//                         >
//                           <option value="">-- Select Seller Type --</option>
//                           {loadingSellerTypes ? (
//                             <option value="" disabled>Loading seller types...</option>
//                           ) : (
//                             sellerTypes.map((type) => (
//                               <option
//                                 key={type.sellerTypeId}
//                                 value={type.sellerTypeId}
//                               >
//                                 {type.sellerTypeName}
//                               </option>
//                             ))
//                           )}
//                         </select>
//                       </div>

//                       {/* Product Types */}
//                       <div>
//                         <label className="block mb-2 text-sm font-semibold text-primary-700">
//                           Product Type(s) <span className="text-error-300">*</span>
//                         </label>
//                         <div className="relative" ref={productDropdownRef}>
//                           <div
//                             className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 cursor-pointer flex justify-between items-center hover:border-primary-300 transition-all"
//                             onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
//                           >
//                             <span className={form.productTypes.length === 0 ? "text-neutral-500" : "text-neutral-900"}>
//                               {loadingProductTypes
//                                 ? "Loading product types..."
//                                 : form.productTypes.length > 0
//                                 ? `${form.productTypes.length} product type(s) selected`
//                                 : "Select product types"}
//                             </span>
//                             <i className={`bi ${isProductDropdownOpen ? "bi-chevron-up" : "bi-chevron-down"} text-primary-600`}></i>
//                           </div>

//                           {isProductDropdownOpen && (
//                             <div className="absolute top-full mt-1 w-full bg-white border-2 border-primary-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
//                               <div className="p-2 border-b border-primary-100 sticky top-0 bg-white">
//                                 <p className="text-sm text-neutral-600 font-medium">
//                                   Select product types:
//                                 </p>
//                               </div>
//                               <div className="max-h-60 overflow-y-auto">
//                                 {/* Select All */}
//                                 {productTypes.length > 0 && (
//                                   <div
//                                     className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100"
//                                     onClick={handleSelectAllProductTypes}
//                                   >
//                                     <input
//                                       type="checkbox"
//                                       id="select-all"
//                                       checked={
//                                         productTypes.length > 0 && 
//                                         form.productTypes.length === productTypes.length
//                                       }
//                                       onChange={() => {}}
//                                       className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
//                                     />
//                                     <label
//                                       htmlFor="select-all"
//                                       className="ml-3 text-sm font-medium text-primary-700 cursor-pointer"
//                                     >
//                                       Select All
//                                     </label>
//                                   </div>
//                                 )}

//                                 {/* Individual Products */}
//                                 {loadingProductTypes ? (
//                                   <div className="px-4 py-2 text-center text-neutral-500">
//                                     Loading product types...
//                                   </div>
//                                 ) : productTypes.length === 0 ? (
//                                   <div className="px-4 py-2 text-center text-neutral-500">
//                                     No product types available
//                                   </div>
//                                 ) : (
//                                   productTypes.map((product) => (
//                                     <div
//                                       key={product.productTypeId}
//                                       className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100 last:border-b-0"
//                                       onClick={() => handleProductTypeToggle(product)}
//                                     >
//                                       <input
//                                         type="checkbox"
//                                         id={`product-${product.productTypeId}`}
//                                         checked={form.productTypeIds.includes(product.productTypeId)}
//                                         onChange={() => {}}
//                                         className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
//                                       />
//                                       <label
//                                         htmlFor={`product-${product.productTypeId}`}
//                                         className="ml-3 text-sm text-neutral-900 cursor-pointer"
//                                       >
//                                         {product.productTypeName}
//                                         {product.regulatoryCategory && (
//                                           <span className="ml-2 text-xs text-primary-600">
//                                             ({product.regulatoryCategory})
//                                           </span>
//                                         )}
//                                       </label>
//                                     </div>
//                                   ))
//                                 )}
//                               </div>
//                               <div className="p-2 border-t border-primary-100 bg-primary-50 sticky bottom-0">
//                                 <p className="text-xs text-neutral-500">
//                                   {form.productTypes.length} of {productTypes.length} selected
//                                 </p>
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                         {form.productTypes.length > 0 && (
//                           <div className="mt-2">
//                             <p className="text-sm text-success-300">
//                               <i className="bi bi-check-circle-fill mr-1"></i>
//                               Selected: {form.productTypes.join(", ")}
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {/* Address Fields */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label
//                           htmlFor="state"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-geo-alt"></i>State:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <select
//                           id="state"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                           value={form.stateId || ""}
//                           onChange={handleStateChange}
//                         >
//                           <option value="">-- Select State --</option>
//                           {loadingStates ? (
//                             <option value="" disabled>Loading states...</option>
//                           ) : statesError ? (
//                             <option value="" disabled className="text-error-300">
//                               ⚠️ Failed to load
//                             </option>
//                           ) : (
//                             states.map((state) => (
//                               <option key={state.stateId} value={state.stateId}>
//                                 {state.stateName}
//                               </option>
//                             ))
//                           )}
//                         </select>
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="district"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-geo"></i>District:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <select
//                           id="district"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                           value={form.districtId || ""}
//                           onChange={handleDistrictChange}
//                           disabled={!form.stateId}
//                         >
//                           <option value="">-- Select District --</option>
//                           {loadingDistricts ? (
//                             <option value="" disabled>Loading districts...</option>
//                           ) : (
//                             districts.map((district) => (
//                               <option
//                                 key={district.districtId}
//                                 value={district.districtId}
//                               >
//                                 {district.districtName}
//                               </option>
//                             ))
//                           )}
//                         </select>
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="taluka"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-map"></i>Taluka:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <select
//                           id="taluka"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                           value={form.talukaId || ""}
//                           onChange={handleTalukaChange}
//                           disabled={!form.districtId}
//                         >
//                           <option value="">-- Select Taluka --</option>
//                           {loadingTalukas ? (
//                             <option value="" disabled>Loading talukas...</option>
//                           ) : (
//                             talukas.map((taluka) => (
//                               <option key={taluka.talukaId} value={taluka.talukaId}>
//                                 {taluka.talukaName}
//                               </option>
//                             ))
//                           )}
//                         </select>
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="city"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-geo-fill"></i>City/Town/Village:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="city"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter city/town/village"
//                           value={form.city}
//                           onKeyPress={handleAlphabetKeyPress}
//                           onChange={(e) => handleAlphabetInput(e, "city")}
//                         />
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="street"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-signpost"></i>Street/Road/Lane:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="street"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter street/road/lane"
//                           value={form.street}
//                           onKeyPress={handleAlphabetKeyPress}
//                           onChange={(e) => handleAlphabetInput(e, "street")}
//                         />
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="buildingNo"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-house-door"></i>Building/House No:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="buildingNo"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter building/house no"
//                           value={form.buildingNo}
//                           onChange={handleChange}
//                         />
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="landmark"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-geo"></i>Landmark:
//                         </label>
//                         <input
//                           type="text"
//                           id="landmark"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter landmark (optional)"
//                           value={form.landmark}
//                           onChange={handleChange}
//                         />
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="pincode"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-pin-map"></i>Pin Code:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="pincode"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter 6-digit pin code"
//                           maxLength={6}
//                           value={form.pincode}
//                           onChange={(e) => handleNumericInput(e, "pincode", 6)}
//                         />
//                       </div>
//                     </div>

//                     {/* Contact Information */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label
//                           htmlFor="phone"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-telephone"></i>Company Phone:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="tel"
//                           id="phone"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter company phone"
//                           maxLength={10}
//                           value={form.phone}
//                           onChange={(e) => handleNumericInput(e, "phone", 10)}
//                         />
//                       </div>
//                       <div>
//                         <label
//                           htmlFor="email"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-envelope"></i>Company Email ID:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="email"
//                           id="email"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter company email"
//                           value={form.email}
//                           onChange={handleChange}
//                         />
//                       </div>
//                       <div className="md:col-span-2">
//                         <label
//                           htmlFor="website"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-globe"></i>Company Website (Optional):
//                         </label>
//                         <input
//                           type="url"
//                           id="website"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter company website"
//                           value={form.website}
//                           onChange={handleChange}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* STEP 2: COORDINATOR */}
//             {step === 2 && (
//               <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//                 <div className="mb-6">
//                   <div className="text-center mb-6">
//                     {(!emailVerified || !phoneVerified) && (
//                       <div className="mt-3 p-3 bg-warning-100 border border-warning-200 rounded-xl text-warning-800 text-sm inline-flex items-center">
//                         <i className="bi bi-exclamation-triangle mr-2"></i>
//                         Please verify both Email and Mobile OTP to proceed
//                       </div>
//                     )}
//                   </div>

//                   <div className="space-y-5">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label
//                           htmlFor="coordinatorName"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-person"></i>Coordinator Name:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="coordinatorName"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter coordinator name"
//                           value={form.coordinatorName}
//                           onKeyPress={handleAlphabetKeyPress}
//                           onChange={(e) => handleAlphabetInput(e, "coordinatorName")}
//                         />
//                       </div>
//                       <div>
//                         <label
//                           htmlFor="coordinatorDesignation"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-briefcase"></i>Coordinator Designation:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="coordinatorDesignation"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter designation"
//                           value={form.coordinatorDesignation}
//                           onKeyPress={handleAlphabetKeyPress}
//                           onChange={(e) => handleAlphabetInput(e, "coordinatorDesignation")}
//                         />
//                       </div>
//                     </div>

//                     {/* Coordinator Email and Mobile Verification */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <OtpVerification
//                           label="Email"
//                           value={form.coordinatorEmail}
//                           onChange={(val: string) =>
//                             setForm((prev) => ({
//                               ...prev,
//                               coordinatorEmail: val,
//                             }))
//                           }
//                           onVerified={() => {
//                             setEmailVerified(true);
//                           }}
//                           verified={emailVerified}
//                         />
//                       </div>
//                       <div>
//                         <OtpVerification
//                           label="Mobile"
//                           value={form.coordinatorMobile}
//                           onChange={(val: string) =>
//                             setForm((prev) => ({
//                               ...prev,
//                               coordinatorMobile: val,
//                             }))
//                           }
//                           onVerified={() => {
//                             setPhoneVerified(true);
//                           }}
//                           verified={phoneVerified}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* STEP 3: DOCUMENTS */}
//             {step === 3 && (
//               <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//                 <div className="mb-6">
//                   {/* GST Certificate Section */}
//                   <div className="mb-2">
//                     <div className="bg-primary-50 rounded-xl p-1 mb-2">
//                       <h3 className="text-lg font-semibold text-primary-700 flex items-center">
//                         <i className="bi bi-file-earmark-text mr-2"></i>GSTIN
//                         Certificate
//                       </h3>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label
//                           htmlFor="gstNumber"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-hash"></i>GST Number:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="gstNumber"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           placeholder="Enter GST number"
//                           value={form.gstNumber}
//                           onChange={handleChange}
//                         />
//                       </div>
//                       <div>
//                         <label
//                           htmlFor="gstFile"
//                           className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           <i className="bi bi-upload"></i>GST Certificate:{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="file"
//                           id="gstFile"
//                           className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//                           accept=".pdf,.jpg,.jpeg,.png"
//                           onChange={handleChange}
//                         />
//                         {form.gstFile && (
//                           <p className="mt-2 text-sm text-success-300">
//                             <i className="bi bi-check-circle-fill mr-1"></i>
//                             File selected: {form.gstFile.name}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Dynamic License Sections */}
//                   {form.productTypes.map((productType) => {
//                     const licenseInfo = getLicenseInfo(productType);
//                     const licenseData = form.licenses[productType] || {
//                       number: "",
//                       file: null,
//                       issueDate: null,
//                       expiryDate: null,
//                       issuingAuthority: "",
//                       status: 'Expired'
//                     };

//                     return (
//                       <div key={productType} className="mb-6">
//                         <div className="bg-primary-50 rounded-xl p-2 mb-3">
//                           <h3 className="text-lg font-semibold text-primary-700 flex items-center">
//                             <i className="bi bi-prescription2 mr-2"></i>
//                             {licenseInfo.label}
//                             <span className="ml-2 text-sm font-normal text-neutral-600">
//                               (Required for: {productType})
//                             </span>
//                           </h3>
//                         </div>

//                         {/* License Number and File Upload */}
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                           <div>
//                             <label
//                               htmlFor={`licenseNumber-${productType}`}
//                               className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                             >
//                               <i className="bi bi-hash"></i>
//                               {licenseInfo.label} Number:{" "}
//                               <span className="text-error-300">*</span>
//                             </label>
//                             <input
//                               type="text"
//                               id={`licenseNumber-${productType}`}
//                               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                               placeholder={licenseInfo.placeholder}
//                               value={licenseData.number}
//                               onChange={handleChange}
//                             />
//                           </div>
//                           <div>
//                             <label
//                               htmlFor={`licenseFile-${productType}`}
//                               className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                             >
//                               <i className="bi bi-upload"></i>
//                               {licenseInfo.label} File Upload:{" "}
//                               <span className="text-error-300">*</span>
//                             </label>
//                             <input
//                               type="file"
//                               id={`licenseFile-${productType}`}
//                               className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//                               accept=".pdf,.jpg,.jpeg,.png"
//                               onChange={handleChange}
//                             />
//                             {licenseData.file && (
//                               <p className="mt-2 text-sm text-success-300">
//                                 <i className="bi bi-check-circle-fill mr-1"></i>
//                                 File selected: {licenseData.file.name}
//                               </p>
//                             )}
//                           </div>
//                         </div>

//                         {/* License Issue Date and Expiry Date with MUI DatePicker */}
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                           <div>
//                             <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                               <i className="bi bi-calendar"></i>
//                               License Issue Date:{" "}
//                               <span className="text-error-300">*</span>
//                             </label>
//                             <DatePicker
//                               value={licenseData.issueDate}
//                               onChange={(date) => handleIssueDateChange(date, productType)}
//                               maxDate={new Date()}
//                               format="dd/MM/yyyy"
//                               slotProps={{
//                                 textField: {
//                                   size: "small",
//                                   fullWidth: true,
//                                   sx: {
//                                     '& .MuiOutlinedInput-root': {
//                                       borderRadius: '12px',
//                                       backgroundColor: 'white',
//                                       '& .MuiOutlinedInput-notchedOutline': {
//                                         borderWidth: '2px',
//                                         borderColor: 'var(--primary-200)',
//                                       },
//                                       '&:hover .MuiOutlinedInput-notchedOutline': {
//                                         borderColor: 'var(--primary-600)',
//                                       },
//                                       '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                         borderColor: 'var(--primary-600)',
//                                       },
//                                     },
//                                   },
//                                 },
//                               }}
//                             />
//                           </div>
//                           <div>
//                             <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700">
//                               <i className="bi bi-calendar-x"></i>
//                               License Expiry Date:{" "}
//                               <span className="text-error-300">*</span>
//                             </label>
//                             <DatePicker
//                               value={licenseData.expiryDate}
//                               onChange={(date) => handleExpiryDateChange(date, productType)}
//                               minDate={licenseData.issueDate || new Date()}
//                               format="dd/MM/yyyy"
//                               slotProps={{
//                                 textField: {
//                                   size: "small",
//                                   fullWidth: true,
//                                   sx: {
//                                     '& .MuiOutlinedInput-root': {
//                                       borderRadius: '12px',
//                                       backgroundColor: 'white',
//                                       '& .MuiOutlinedInput-notchedOutline': {
//                                         borderWidth: '2px',
//                                         borderColor: 'var(--primary-200)',
//                                       },
//                                       '&:hover .MuiOutlinedInput-notchedOutline': {
//                                         borderColor: 'var(--primary-600)',
//                                       },
//                                       '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                                         borderColor: 'var(--primary-600)',
//                                       },
//                                     },
//                                   },
//                                 },
//                               }}
//                             />
//                           </div>
//                         </div>

//                         {/* License Issuing Authority and Status */}
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                           <div>
//                             <label
//                               htmlFor={`licenseIssuingAuthority-${productType}`}
//                               className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                             >
//                               <i className="bi bi-building"></i>
//                               Issuing Authority:{" "}
//                               <span className="text-error-300">*</span>
//                             </label>
//                             <input
//                               type="text"
//                               id={`licenseIssuingAuthority-${productType}`}
//                               className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                               placeholder="Enter issuing authority"
//                               value={licenseData.issuingAuthority}
//                               onChange={handleChange}
//                             />
//                           </div>
//                           <div>
//                             <label
//                               htmlFor={`licenseStatus-${productType}`}
//                               className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                             >
//                               <i className="bi bi-shield-check"></i>
//                               License Status:
//                             </label>
//                             <div
//                               className={`w-full px-4 py-2 border-2 rounded-xl font-semibold flex items-center ${
//                                 licenseData.status === 'Active'
//                                   ? 'border-success-300 bg-success-100 text-success-300'
//                                   : 'border-error-300 bg-error-100 text-error-300'
//                               }`}
//                             >
//                               <i className={`bi ${
//                                 licenseData.status === 'Active' 
//                                   ? 'bi-check-circle-fill' 
//                                   : 'bi-exclamation-triangle-fill'
//                               } mr-2`}></i>
//                               {licenseData.status || 'Not Calculated'}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}

//                   {form.productTypes.length === 0 && (
//                     <div className="mt-6 p-4 bg-warning-100 border border-warning-200 rounded-xl">
//                       <div className="flex items-center">
//                         <i className="bi bi-exclamation-triangle text-warning-800 text-xl mr-3"></i>
//                         <div>
//                           <p className="text-warning-800 font-medium">
//                             No product types selected
//                           </p>
//                           <p className="text-warning-700 text-sm mt-1">
//                             Please go back to Step 1 and select at least one
//                             product type.
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* STEP 4: BANK DETAILS */}
//             {step === 4 && (
//               <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//                 <div className="mb-6">
//                   <div className="space-y-6">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label
//                           htmlFor="accountNumber"
//                           className="block mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           Account Number <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="accountNumber"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           value={form.accountNumber}
//                           onChange={handleChange}
//                           placeholder="Enter account number"
//                         />
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="accountHolderName"
//                           className="block mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           Account Holder Name{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="accountHolderName"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                           value={form.accountHolderName}
//                           onChange={(e) => handleAlphabetInput(e, "accountHolderName")}
//                           onKeyPress={handleAlphabetKeyPress}
//                           placeholder="As per bank records"
//                         />
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label
//                           htmlFor="ifscCode"
//                           className="block mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           IFSC Code <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           id="ifscCode"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all uppercase"
//                           maxLength={11}
//                           value={form.ifscCode}
//                           onChange={(e) => handleIfscChange(e.target.value)}
//                           placeholder="SBIN0005943"
//                         />
//                         {ifscError && (
//                           <p className="mt-1 text-sm text-error-300">
//                             {ifscError}
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label
//                           htmlFor="cancelledChequeFile"
//                           className="block mb-2 text-sm font-semibold text-primary-700"
//                         >
//                           Cancelled Cheque / Bank Details Proof{" "}
//                           <span className="text-error-300">*</span>
//                         </label>
//                         <input
//                           type="file"
//                           id="cancelledChequeFile"
//                           className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//                           accept=".pdf,.jpg,.jpeg,.png"
//                           onChange={handleChange}
//                         />
//                         {form.cancelledChequeFile && (
//                           <p className="mt-2 text-sm text-success-300">
//                             <i className="bi bi-check-circle-fill mr-1"></i>
//                             File selected: {form.cancelledChequeFile.name}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block mb-2 text-sm font-semibold text-primary-700">
//                           Bank Name
//                         </label>
//                         <input
//                           type="text"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//                           value={form.bankName}
//                           disabled
//                           readOnly
//                         />
//                       </div>

//                       <div>
//                         <label className="block mb-2 text-sm font-semibold text-primary-700">
//                           Branch
//                         </label>
//                         <input
//                           type="text"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//                           value={form.branch}
//                           disabled
//                           readOnly
//                         />
//                       </div>

//                       <div>
//                         <label className="block mb-2 text-sm font-semibold text-primary-700">
//                           State
//                         </label>
//                         <input
//                           type="text"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//                           value={form.bankState}
//                           disabled
//                           readOnly
//                         />
//                       </div>

//                       <div>
//                         <label className="block mb-2 text-sm font-semibold text-primary-700">
//                           District
//                         </label>
//                         <input
//                           type="text"
//                           className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//                           value={form.bankDistrict}
//                           disabled
//                           readOnly
//                         />
//                       </div>
//                     </div>

//                     <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-xl">
//                       <div className="flex">
//                         <i className="bi bi-shield-check text-primary-700 text-2xl mr-4"></i>
//                         <div>
//                           <h6 className="font-bold text-primary-800 mb-1">
//                             Security Assurance
//                           </h6>
//                           <p className="text-sm text-neutral-700">
//                             Your bank details are encrypted and stored securely.
//                             We follow PCI-DSS compliance standards for financial
//                             data protection.
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* STEP 5: REVIEW */}
//             {step === 5 && (
//               <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-4 md:p-6 mb-6">
//                 <div className="text-center mb-8">
//                   <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
//                     <i className="bi bi-shield-check text-white text-2xl"></i>
//                   </div>
//                   <h4 className="text-2xl font-bold bg-linear-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
//                     Final Submission Summary
//                   </h4>
//                   <p className="text-neutral-600 mt-2">
//                     Please review all details before final submission
//                   </p>
//                 </div>

//                 {/* Company Section */}
//                 <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                   <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                     <i className="bi bi-building mr-2"></i> Company Details
//                   </h6>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {[
//                       { label: "Company Name", value: form.sellerName },
//                       { label: "Company Type", value: form.companyType },
//                       { label: "Seller Type", value: form.sellerType },
//                       {
//                         label: "Product Type(s)",
//                         value: form.productTypes.join(", "),
//                       },
//                       { label: "State", value: form.state },
//                       { label: "District", value: form.district },
//                       { label: "Taluka", value: form.taluka },
//                       { label: "City/Town/Village", value: form.city },
//                       { label: "Street/Road/Lane", value: form.street },
//                       { label: "Building/House No", value: form.buildingNo },
//                       { label: "Landmark", value: form.landmark || "N/A" },
//                       { label: "Pin Code", value: form.pincode },
//                       { label: "Phone", value: form.phone },
//                       { label: "Email", value: form.email },
//                       { label: "Website", value: form.website || "N/A" },
//                     ].map((item, index) => (
//                       <div key={index}>
//                         <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                           {item.label}
//                         </span>
//                         <p
//                           className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                             !item.value ||
//                             (item.value === "N/A" && item.label === "Landmark") ||
//                             (item.value === "N/A" && item.label === "Website")
//                               ? "text-neutral-500"
//                               : "text-neutral-900"
//                           }`}
//                         >
//                           {item.value || "Not provided"}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Coordinator Section */}
//                 <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                   <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                     <i className="bi bi-person-badge mr-2"></i> Coordinator Details
//                   </h6>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {[
//                       { label: "Name", value: form.coordinatorName },
//                       { label: "Designation", value: form.coordinatorDesignation },
//                       {
//                         label: "Email",
//                         value: form.coordinatorEmail,
//                         verified: emailVerified,
//                       },
//                       {
//                         label: "Mobile",
//                         value: form.coordinatorMobile,
//                         verified: phoneVerified,
//                       },
//                     ].map((item, index) => (
//                       <div key={index}>
//                         <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                           {item.label}
//                         </span>
//                         <p
//                           className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                             !item.value ? "text-error-300" : "text-neutral-900"
//                           }`}
//                         >
//                           {item.value || "Not provided"}
//                           {item.verified !== undefined && item.value && (
//                             <span
//                               className={`ml-2 px-2 py-1 text-xs rounded ${
//                                 item.verified
//                                   ? "bg-success-100 text-success-300"
//                                   : "bg-warning-100 text-warning-300"
//                               }`}
//                             >
//                               {item.verified ? "✔ Verified" : "Not verified"}
//                             </span>
//                           )}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Documents Section */}
//                 <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                   <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                     <i className="bi bi-file-earmark-lock mr-2"></i> Compliance Documents
//                   </h6>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                         GST Number
//                       </span>
//                       <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                         !form.gstNumber ? "text-error-300" : "text-neutral-900"
//                       }`}>
//                         {form.gstNumber || "Not provided"}
//                       </p>
//                     </div>
//                     <div>
//                       <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                         GST Certificate
//                       </span>
//                       <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                         !form.gstFile ? "text-error-300" : "text-neutral-900"
//                       }`}>
//                         {form.gstFile ? (
//                           <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//                             <i className="bi bi-file-earmark-pdf mr-2"></i>
//                             {form.gstFile.name}
//                           </span>
//                         ) : (
//                           "Not uploaded"
//                         )}
//                       </p>
//                     </div>

//                     {form.productTypes.map((productType) => {
//                       const licenseInfo = getLicenseInfo(productType);
//                       const licenseData = form.licenses[productType];
//                       return (
//                         <React.Fragment key={productType}>
//                           <div className="md:col-span-2 mt-2">
//                             <h6 className="text-sm font-bold text-primary-600 mb-2">
//                               {licenseInfo.label} - {productType}
//                             </h6>
//                           </div>
//                           <div>
//                             <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                               License Number
//                             </span>
//                             <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                               !licenseData?.number ? "text-error-300" : "text-neutral-900"
//                             }`}>
//                               {licenseData?.number || "Not provided"}
//                             </p>
//                           </div>
//                           <div>
//                             <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                               License File
//                             </span>
//                             <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                               !licenseData?.file ? "text-error-300" : "text-neutral-900"
//                             }`}>
//                               {licenseData?.file ? (
//                                 <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//                                   <i className="bi bi-file-earmark-pdf mr-2"></i>
//                                   {licenseData.file.name}
//                                 </span>
//                               ) : (
//                                 "Not uploaded"
//                               )}
//                             </p>
//                           </div>
//                           <div>
//                             <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                               Issue Date
//                             </span>
//                             <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                               !licenseData?.issueDate ? "text-error-300" : "text-neutral-900"
//                             }`}>
//                               {licenseData?.issueDate ? new Date(licenseData.issueDate).toLocaleDateString('en-IN', {
//                                 day: '2-digit',
//                                 month: '2-digit',
//                                 year: 'numeric'
//                               }) : "Not provided"}
//                             </p>
//                           </div>
//                           <div>
//                             <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                               Expiry Date
//                             </span>
//                             <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                               !licenseData?.expiryDate ? "text-error-300" : "text-neutral-900"
//                             }`}>
//                               {licenseData?.expiryDate ? new Date(licenseData.expiryDate).toLocaleDateString('en-IN', {
//                                 day: '2-digit',
//                                 month: '2-digit',
//                                 year: 'numeric'
//                               }) : "Not provided"}
//                             </p>
//                           </div>
//                           <div>
//                             <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                               Issuing Authority
//                             </span>
//                             <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                               !licenseData?.issuingAuthority ? "text-error-300" : "text-neutral-900"
//                             }`}>
//                               {licenseData?.issuingAuthority || "Not provided"}
//                             </p>
//                           </div>
//                           <div>
//                             <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                               License Status
//                             </span>
//                             <p className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                               licenseData?.status === 'Active' 
//                                 ? 'text-success-300 bg-success-100' 
//                                 : 'text-error-300 bg-error-100'
//                             }`}>
//                               <i className={`bi ${
//                                 licenseData?.status === 'Active' 
//                                   ? 'bi-check-circle-fill' 
//                                   : 'bi-exclamation-triangle-fill'
//                               } mr-2`}></i>
//                               {licenseData?.status || "Not calculated"}
//                             </p>
//                           </div>
//                         </React.Fragment>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 {/* Bank Details Section */}
//                 <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                   <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                     <i className="bi bi-bank mr-2"></i> Bank Account Details
//                   </h6>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {[
//                       { label: "Bank Name", value: form.bankName },
//                       { label: "Branch", value: form.branch },
//                       { label: "State", value: form.bankState },
//                       { label: "District", value: form.bankDistrict },
//                       { label: "IFSC Code", value: form.ifscCode },
//                       {
//                         label: "Account Number",
//                         value: form.accountNumber
//                           ? "****" + form.accountNumber.slice(-4)
//                           : "",
//                       },
//                       {
//                         label: "Account Holder Name",
//                         value: form.accountHolderName,
//                       },
//                       {
//                         label: "Cancelled Cheque",
//                         value: form.cancelledChequeFile ? (
//                           <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//                             <i className="bi bi-file-earmark-pdf mr-2"></i>
//                             {form.cancelledChequeFile.name}
//                           </span>
//                         ) : (
//                           "Not uploaded"
//                         ),
//                       },
//                     ].map((item, index) => (
//                       <div key={index}>
//                         <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                           {item.label}
//                         </span>
//                         <p
//                           className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                             !item.value || item.value === "Not uploaded"
//                               ? "text-error-300"
//                               : "text-neutral-900"
//                           }`}
//                         >
//                           {item.value || "Not provided"}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Validation Summary */}
//                 <div className="p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                   <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                     <i className="bi bi-clipboard-check mr-2"></i> Validation Summary
//                   </h6>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {[
//                       {
//                         label: "Company Info",
//                         complete:
//                           form.sellerName &&
//                           form.pincode &&
//                           form.productTypes.length > 0,
//                       },
//                       {
//                         label: "Verification",
//                         complete: emailVerified && phoneVerified,
//                       },
//                       {
//                         label: "GST Document",
//                         complete: !!form.gstFile,
//                       },
//                       {
//                         label: "Product Licenses",
//                         complete:
//                           form.productTypes.length > 0 &&
//                           form.productTypes.every(
//                             (pt) => {
//                               const license = form.licenses[pt];
//                               return license && 
//                                      license.number && 
//                                      license.file && 
//                                      license.issueDate && 
//                                      license.expiryDate && 
//                                      license.issuingAuthority;
//                             }
//                           ),
//                       },
//                       {
//                         label: "Bank Details",
//                         complete:
//                           form.ifscCode &&
//                           form.accountNumber &&
//                           form.cancelledChequeFile,
//                       },
//                     ].map((item, index) => (
//                       <div key={index} className="flex items-center">
//                         <i
//                           className={`bi ${
//                             item.complete
//                               ? "bi-check-circle-fill text-success-300"
//                               : "bi-x-circle-fill text-error-300"
//                           } text-lg mr-3`}
//                         ></i>
//                         <span className="text-sm font-medium text-neutral-700">
//                           {item.label}: {item.complete ? "Complete" : "Incomplete"}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Navigation Buttons */}
//             <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t border-neutral-200 gap-4">
//               {step > 1 && (
//                 <button
//                   type="button"
//                   onClick={back}
//                   className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto"
//                 >
//                   <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
//                     <i className="bi bi-arrow-left mr-2"></i> Back
//                   </span>
//                   <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//                 </button>
//               )}

//               <div className="w-full md:w-auto md:ml-auto flex justify-end">
//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
//                     {submitting ? (
//                       <>
//                         <i className="bi bi-hourglass-split mr-2 animate-spin"></i>
//                         Submitting...
//                       </>
//                     ) : step < 5 ? (
//                       <>
//                         Continue <i className="bi bi-arrow-right ml-2"></i>
//                       </>
//                     ) : (
//                       <>
//                         <i className="bi bi-check-circle mr-2"></i> Submit Application
//                       </>
//                     )}
//                   </span>
//                   <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//                 </button>
//               </div>
//             </div>
//           </form>
//         </div>
//       </div>
//     </LocalizationProvider>
//   );
// }




























// original code without sms integration and sending the mail to seller after completion of registration....................

// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import OtpVerification from "./OtpVerification";
// import Header from "@/src/app/components/Header";
// import { useRouter } from "next/navigation";
// import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService";
// import { sellerRegService } from "@/src/services/seller/sellerRegistrationService";
// import {
//   CompanyTypeResponse,
//   SellerTypeResponse,
//   ProductTypeResponse,
//   StateResponse,
//   DistrictResponse,
//   TalukaResponse,
// } from "@/src/types/seller/SellerRegMasterData";
// import {
//   TempSellerRequest,
//   TempSellerDocument,
//   TempSellerBankDetails,
//   TempSellerAddress,
//   TempSellerCoordinator,
// } from "@/src/types/seller/sellerRegistrationData";

// // ========== IFSC API ==========
// const IFSC_API = "https://ifsc.razorpay.com";
// const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// export default function SellerRegister() {
//   const router = useRouter();
//   const [step, setStep] = useState(1);
//   const [emailVerified, setEmailVerified] = useState(false);
//   const [phoneVerified, setPhoneVerified] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [applicationId, setApplicationId] = useState("");
//   const [ifscError, setIfscError] = useState("");
//   const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
//   const productDropdownRef = useRef<HTMLDivElement>(null);

//   // ========== Master Data State - Initialize as empty arrays ==========
//   const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([]);
//   const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([]);
//   const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([]);
//   const [states, setStates] = useState<StateResponse[]>([]);
//   const [districts, setDistricts] = useState<DistrictResponse[]>([]);
//   const [talukas, setTalukas] = useState<TalukaResponse[]>([]);

//   // ========== Loading States ==========
//   const [loadingCompanyTypes, setLoadingCompanyTypes] = useState(true);
//   const [loadingSellerTypes, setLoadingSellerTypes] = useState(false);
//   const [loadingProductTypes, setLoadingProductTypes] = useState(false);
//   const [loadingStates, setLoadingStates] = useState(true);
//   const [loadingDistricts, setLoadingDistricts] = useState(false);
//   const [loadingTalukas, setLoadingTalukas] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
  
//   // ========== Error States ==========
//   const [companyTypesError, setCompanyTypesError] = useState<string | null>(null);
//   const [statesError, setStatesError] = useState<string | null>(null);

//   // ========== Form State ==========
//   const [form, setForm] = useState({
//     // IDs for submission
//     companyTypeId: 0,
//     sellerTypeId: 0,
//     productTypeIds: [] as number[],
//     stateId: 0,
//     districtId: 0,
//     talukaId: 0,
//     // Display names for UI
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
//     // Licenses per product
//     licenses: {} as Record<string, { number: string; file: File | null }>,
//     // Bank details
//     bankState: "",
//     bankDistrict: "",
//     bankName: "",
//     branch: "",
//     ifscCode: "",
//     accountNumber: "",
//     accountHolderName: "",
//     cancelledChequeFile: null as File | null,
//   });

//   // ========== Close dropdown when clicking outside ==========
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         productDropdownRef.current &&
//         !productDropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsProductDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ========== 1. FETCH COMPANY TYPES AND STATES ON MOUNT ==========
//   useEffect(() => {
//     fetchCompanyTypes();
//     fetchStates();
//   }, []);

// const fetchCompanyTypes = async () => {
//   setLoadingCompanyTypes(true);
//   setCompanyTypesError(null);
//   try {
//     console.log("📡 [Master] Fetching company types...");
//     const data = await sellerRegMasterService.getCompanyTypes();
//     console.log("✅ [Master] Company types received:", data);
    
//     if (Array.isArray(data) && data.length > 0) {
//       setCompanyTypes(data);
//       console.log("✅ Company types set in state:", data.length, "items");
//     } else {
//       console.warn("⚠️ Company types data is empty:", data);
//       setCompanyTypes([]);
//     }
//   } catch (error) {
//     console.error("❌ [Master] Error fetching company types:", error);
//     setCompanyTypesError("Failed to load company types");
//     setCompanyTypes([]);
//   } finally {
//     setLoadingCompanyTypes(false);
//   }
// };

// const fetchStates = async () => {
//   setLoadingStates(true);
//   setStatesError(null);
//   try {
//     console.log("📡 [Master] Fetching states...");
//     const data = await sellerRegMasterService.getStates();
//     console.log("✅ [Master] States received:", data);
    
//     if (Array.isArray(data) && data.length > 0) {
//       setStates(data);
//       console.log("✅ States set in state:", data.length, "items");
//     } else {
//       console.warn("⚠️ States data is empty:", data);
//       setStates([]);
//     }
//   } catch (error) {
//     console.error("❌ [Master] Error fetching states:", error);
//     setStatesError("Failed to load states");
//     setStates([]);
//   } finally {
//     setLoadingStates(false);
//   }
// };

//   // ========== 2. FETCH SELLER TYPES (after company type selected) ==========
// const fetchSellerTypes = async () => {
//   if (!form.companyTypeId) return;
  
//   setLoadingSellerTypes(true);
//   try {
//     console.log("📡 [Master] Fetching seller types...");
//     const data = await sellerRegMasterService.getSellerTypes();
//     console.log("✅ [Master] Seller types received:", data);
    
//     if (Array.isArray(data) && data.length > 0) {
//       setSellerTypes(data);
//       console.log("✅ Seller types set in state:", data.length, "items");
//     } else {
//       console.warn("⚠️ Seller types data is empty:", data);
//       setSellerTypes([]);
//     }
//   } catch (error) {
//     console.error("❌ [Master] Error fetching seller types:", error);
//     setSellerTypes([]);
//   } finally {
//     setLoadingSellerTypes(false);
//   }
// };

//   // ========== 3. FETCH PRODUCT TYPES (after seller type selected) ==========
// const fetchProductTypes = async () => {
//   if (!form.sellerTypeId) return;
  
//   setLoadingProductTypes(true);
//   try {
//     console.log("📡 [Master] Fetching product types...");
//     const data = await sellerRegMasterService.getProductTypes();
//     console.log("✅ [Master] Product types received:", data);
    
//     if (Array.isArray(data) && data.length > 0) {
//       setProductTypes(data);
//       console.log("✅ Product types set in state:", data.length, "items");
//     } else {
//       console.warn("⚠️ Product types data is empty:", data);
//       setProductTypes([]);
//     }
//   } catch (error) {
//     console.error("❌ [Master] Error fetching product types:", error);
//     setProductTypes([]);
//   } finally {
//     setLoadingProductTypes(false);
//   }
// };

//   // ========== 4. FETCH DISTRICTS (when state changes) ==========
// const fetchDistrictsByState = async (stateId: number) => {
//   if (!stateId) return;
  
//   setLoadingDistricts(true);
//   try {
//     console.log(`📡 [Master] Fetching districts for stateId: ${stateId}`);
//     const allDistricts = await sellerRegMasterService.getDistricts();
//     console.log("✅ [Master] All districts received:", allDistricts);
    
//     const filtered = Array.isArray(allDistricts) 
//       ? allDistricts.filter((d) => d.stateId === stateId)
//       : [];
    
//     console.log(`✅ Filtered districts for state ${stateId}:`, filtered.length, "items");
//     setDistricts(filtered);
//   } catch (error) {
//     console.error("❌ [Master] Error fetching districts:", error);
//     setDistricts([]);
//   } finally {
//     setLoadingDistricts(false);
//   }
// };

//   // ========== 5. FETCH TALUKAS (when district changes) ==========
// const fetchTalukasByDistrict = async (districtId: number) => {
//   if (!districtId) return;
  
//   setLoadingTalukas(true);
//   try {
//     console.log(`📡 [Master] Fetching talukas for districtId: ${districtId}`);
//     const allTalukas = await sellerRegMasterService.getTalukas();
//     console.log("✅ [Master] All talukas received:", allTalukas);
    
//     const filtered = Array.isArray(allTalukas)
//       ? allTalukas.filter((t) => t.districtId === districtId)
//       : [];
    
//     console.log(`✅ Filtered talukas for district ${districtId}:`, filtered.length, "items");
//     setTalukas(filtered);
//   } catch (error) {
//     console.error("❌ [Master] Error fetching talukas:", error);
//     setTalukas([]);
//   } finally {
//     setLoadingTalukas(false);
//   }
// };

//   // ========== Form Handlers ==========
//   const handleChange = (e: any) => {
//     const { id, value, files, type } = e.target;

//     if (type === "file" && files && files[0]) {
//       if (id.startsWith("licenseFile-")) {
//         const licenseId = id.replace("licenseFile-", "");
//         setForm((prev) => ({
//           ...prev,
//           licenses: {
//             ...prev.licenses,
//             [licenseId]: {
//               ...prev.licenses[licenseId],
//               file: files[0],
//             },
//           },
//         }));
//       } else {
//         setForm((prev) => ({ ...prev, [id]: files[0] }));
//       }
//     } else if (id.startsWith("licenseNumber-")) {
//       const licenseId = id.replace("licenseNumber-", "");
//       setForm((prev) => ({
//         ...prev,
//         licenses: {
//           ...prev.licenses,
//           [licenseId]: {
//             ...prev.licenses[licenseId],
//             number: value,
//           },
//         },
//       }));
//     } else {
//       setForm((prev) => ({ ...prev, [id]: value }));
//     }
//   };

//   // Company Type Selection
//  const handleCompanyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//   const selectedId = e.target.value ? parseInt(e.target.value) : 0;
//   console.log("📝 Company type selected - ID:", selectedId);
  
//   const selected = companyTypes.find((c) => c?.companyTypeId === selectedId);
//   console.log("📝 Selected company type object:", selected);
  
//   setForm((prev) => ({
//     ...prev,
//     companyTypeId: selectedId,
//     companyType: selected?.companyTypeName || "",
//     // Reset dependent fields
//     sellerTypeId: 0,
//     sellerType: "",
//     productTypeIds: [],
//     productTypes: [],
//     licenses: {},
//   }));
  
//   setSellerTypes([]);
//   setProductTypes([]);
  
//   if (selectedId) {
//     fetchSellerTypes();
//   }
// };

//   // Seller Type Selection
//   const handleSellerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = sellerTypes.find((s) => s.sellerTypeId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       sellerTypeId: selectedId || 0,
//       sellerType: selected?.sellerTypeName || "",
//       // Reset product selection
//       productTypeIds: [],
//       productTypes: [],
//       licenses: {},
//     }));
    
//     setProductTypes([]);
    
//     if (selectedId) {
//       fetchProductTypes();
//     }
//   };

//   // State Selection
//   const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = states.find((s) => s.stateId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       stateId: selectedId || 0,
//       state: selected?.stateName || "",
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

//   // District Selection
//   const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = districts.find((d) => d.districtId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       districtId: selectedId || 0,
//       district: selected?.districtName || "",
//       talukaId: 0,
//       taluka: "",
//     }));
    
//     setTalukas([]);
    
//     if (selectedId) {
//       fetchTalukasByDistrict(selectedId);
//     }
//   };

//   // Taluka Selection
//   const handleTalukaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = parseInt(e.target.value);
//     const selected = talukas.find((t) => t.talukaId === selectedId);
    
//     setForm((prev) => ({
//       ...prev,
//       talukaId: selectedId || 0,
//       taluka: selected?.talukaName || "",
//     }));
//   };

//   // Product Type Toggle
//   const handleProductTypeToggle = (product: ProductTypeResponse) => {
//     if (!product) return;
    
//     setForm((prev) => {
//       let newProductTypeIds = [...prev.productTypeIds];
//       let newProductTypes = [...prev.productTypes];
//       // eslint-disable-next-line prefer-const
//       let newLicenses = { ...prev.licenses };

//       if (newProductTypeIds.includes(product.productTypeId)) {
//         newProductTypeIds = newProductTypeIds.filter(
//           (id) => id !== product.productTypeId
//         );
//         newProductTypes = newProductTypes.filter(
//           (name) => name !== product.productTypeName
//         );
//         delete newLicenses[product.productTypeName];
//       } else {
//         newProductTypeIds.push(product.productTypeId);
//         newProductTypes.push(product.productTypeName);
//         newLicenses[product.productTypeName] = { number: "", file: null };
//       }

//       return {
//         ...prev,
//         productTypeIds: newProductTypeIds,
//         productTypes: newProductTypes,
//         licenses: newLicenses,
//       };
//     });
//   };

//   // Select All Product Types
//   const handleSelectAllProductTypes = () => {
//     if (!productTypes.length) return;
    
//     if (form.productTypes.length === productTypes.length) {
//       // Deselect all
//       setForm((prev) => ({
//         ...prev,
//         productTypeIds: [],
//         productTypes: [],
//         licenses: {},
//       }));
//     } else {
//       // Select all
//       const allIds = productTypes.map((p) => p.productTypeId);
//       const allNames = productTypes.map((p) => p.productTypeName);
//       const newLicenses: Record<string, { number: string; file: File | null }> =
//         {};
//       allNames.forEach((name) => {
//         newLicenses[name] = { number: "", file: null };
//       });
//       setForm((prev) => ({
//         ...prev,
//         productTypeIds: allIds,
//         productTypes: allNames,
//         licenses: newLicenses,
//       }));
//     }
//   };

//   // ========== IFSC Auto-fill ==========
//   const handleIfscChange = async (value: string) => {
//     const ifsc = value.toUpperCase();
//     setForm((prev) => ({ ...prev, ifscCode: ifsc }));
//     setIfscError("");

//     if (ifsc.length !== 11) {
//       setForm((prev) => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: "",
//       }));
//       return;
//     }

//     if (!IFSC_REGEX.test(ifsc)) {
//       setIfscError("Invalid IFSC format");
//       return;
//     }

//     try {
//       const res = await fetch(`${IFSC_API}/${ifsc}`);
//       if (!res.ok) throw new Error();
//       const data = await res.json();
//       setForm((prev) => ({
//         ...prev,
//         bankName: data.BANK || "",
//         branch: data.BRANCH || "",
//         bankState: data.STATE || "",
//         bankDistrict: data.DISTRICT || data.CITY || "",
//       }));
//     } catch {
//       setIfscError("Invalid IFSC Code");
//       setForm((prev) => ({
//         ...prev,
//         bankName: "",
//         branch: "",
//         bankState: "",
//         bankDistrict: "",
//       }));
//     }
//   };

//   // ========== Text Input Handlers ==========
//   const handleAlphabetInput = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     fieldName: string
//   ) => {
//     const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "");
//     setForm((prev) => ({ ...prev, [fieldName]: value }));
//   };

//   const handleAlphabetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const key = e.key;
//     const isValidKey = /^[a-zA-Z\s,'.-]$/.test(key);
//     if (
//       !isValidKey &&
//       key !== "Backspace" &&
//       key !== "Delete" &&
//       key !== "Tab" &&
//       key !== "ArrowLeft" &&
//       key !== "ArrowRight"
//     ) {
//       e.preventDefault();
//     }
//   };

//   const handleNumericInput = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     fieldName: string,
//     maxLength?: number
//   ) => {
//     let value = e.target.value.replace(/\D/g, "");
//     if (maxLength && value.length > maxLength) {
//       value = value.substring(0, maxLength);
//     }
//     setForm((prev) => ({ ...prev, [fieldName]: value }));
//   };

//   // ========== File Upload Mock ==========
//   const uploadFile = async (file: File, folder: string): Promise<string> => {
//     console.log(`📡 Uploading file to ${folder}:`, file.name);
//     await new Promise((resolve) => setTimeout(resolve, 500));
//     const mockUrl = `https://storage.example.com/${folder}/${Date.now()}_${file.name}`;
//     console.log(`✅ File uploaded, URL: ${mockUrl}`);
//     return mockUrl;
//   };

//   // ========== Get License Info ==========
//   const getLicenseInfo = (productName: string) => {
//     const product = productTypes.find((p) => p.productTypeName === productName);
//     const label = product?.regulatoryCategory
//       ? `${product.regulatoryCategory} License`
//       : `${productName} License`;
//     return {
//       label,
//       placeholder: `Enter ${productName} license number`,
//     };
//   };

//   // ========== Form Validation and Submission ==========
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Step 1 Validation
//     if (step === 1) {
//       if (
//         !form.sellerName ||
//         !form.companyTypeId ||
//         !form.sellerTypeId ||
//         form.productTypeIds.length === 0 ||
//         !form.phone ||
//         !form.email ||
//         !form.stateId ||
//         !form.districtId ||
//         !form.talukaId ||
//         !form.city ||
//         !form.pincode
//       ) {
//         alert("Please fill all required company information fields.");
//         return;
//       }
//       if (!/^\d{6}$/.test(form.pincode)) {
//         alert("Please enter a valid 6-digit PIN code.");
//         return;
//       }
//       if (!/^\d{10}$/.test(form.phone)) {
//         alert("Please enter a valid 10-digit phone number.");
//         return;
//       }
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(form.email)) {
//         alert("Please enter a valid email address.");
//         return;
//       }
//     }

//     if (step === 2) {
//       if (
//         !form.coordinatorName ||
//         !form.coordinatorDesignation ||
//         !form.coordinatorEmail ||
//         !form.coordinatorMobile
//       ) {
//         alert("Please fill all coordinator details.");
//         return;
//       }
//       if (!emailVerified || !phoneVerified) {
//         alert("Please verify both Email and Mobile OTP before proceeding.");
//         return;
//       }
//     }

//     if (step === 3) {
//       if (!form.gstNumber || !form.gstFile) {
//         alert("Please fill GST fields and upload required file.");
//         return;
//       }
//       let allLicensesValid = true;
//       const missingLicenses: string[] = [];
//       form.productTypes.forEach((productType) => {
//         const license = form.licenses[productType];
//         if (!license || !license.number || !license.file) {
//           allLicensesValid = false;
//           missingLicenses.push(productType);
//         }
//       });
//       if (!allLicensesValid) {
//         alert(
//           `Please fill all license fields for: ${missingLicenses.join(", ")}`
//         );
//         return;
//       }
//     }

//     if (step === 4) {
//       if (
//         !form.accountNumber ||
//         !form.accountHolderName ||
//         !form.ifscCode ||
//         !form.cancelledChequeFile
//       ) {
//         alert("Please fill all bank account details and upload cancelled cheque.");
//         return;
//       }
//       if (ifscError) {
//         alert("Please fix IFSC code error before proceeding.");
//         return;
//       }
//     }

//     if (step < 5) {
//       setStep(step + 1);
//       return;
//     }

//     // Final Submission
//     setSubmitting(true);
//     try {
//       console.log("🚀 Starting final submission...");

//       // Upload GST file
//       let gstFileUrl = "";
//       if (form.gstFile) {
//         gstFileUrl = await uploadFile(form.gstFile, "gst-certificates");
//       }

//       // Upload license files
//       const documents: TempSellerDocument[] = [];
//       for (const productName of form.productTypes) {
//         const product = productTypes.find((p) => p.productTypeName === productName);
//         if (!product) continue;

//         const license = form.licenses[productName];
//         let docFileUrl = "";
//         if (license?.file) {
//           docFileUrl = await uploadFile(license.file, "licenses");
//         }

//         documents.push({
//           productTypeId: product.productTypeId,
//           gstNumber: form.gstNumber,
//           gstFileUrl: gstFileUrl,
//           documentNumber: license?.number || "",
//           documentFileUrl: docFileUrl,
//         });
//       }

//       // Upload cancelled cheque
//       let bankDocumentFileUrl = "";
//       if (form.cancelledChequeFile) {
//         bankDocumentFileUrl = await uploadFile(
//           form.cancelledChequeFile,
//           "bank-documents"
//         );
//       }

//       // Build request objects
//       const address: TempSellerAddress = {
//         stateId: form.stateId,
//         districtId: form.districtId,
//         talukaId: form.talukaId,
//         city: form.city,
//         street: form.street,
//         buildingNo: form.buildingNo,
//         landmark: form.landmark || "",
//         pinCode: form.pincode,
//       };

//       const coordinator: TempSellerCoordinator = {
//         name: form.coordinatorName,
//         designation: form.coordinatorDesignation,
//         email: form.coordinatorEmail,
//         mobile: form.coordinatorMobile,
//       };

//       const bankDetails: TempSellerBankDetails = {
//         bankName: form.bankName,
//         branch: form.branch,
//         ifscCode: form.ifscCode,
//         accountNumber: form.accountNumber,
//         accountHolderName: form.accountHolderName,
//         bankDocumentFileUrl,
//       };

//       const request: TempSellerRequest = {
//         sellerName: form.sellerName,
//         productTypeId: form.productTypeIds,
//         companyTypeId: form.companyTypeId,
//         sellerTypeId: form.sellerTypeId,
//         phone: form.phone,
//         email: form.email,
//         termsAccepted: true,
//         website: form.website || undefined,
//         address,
//         coordinator,
//         bankDetails,
//         documents,
//       };

//       console.log("📦 Registration payload:", JSON.stringify(request, null, 2));

//       const response = await sellerRegService.createTempSeller(request);
//       console.log("✅ Registration successful:", response);
//       console.log("✅ Application ID received:", response.sellerRequestId);
//     console.log("✅ Seller ID:", response.tempSellerId);
//     console.log("✅ Status:", response.status);

//       setApplicationId(response.sellerRequestId);
//       setShowSuccessModal(true);

//     } catch (error) {
//       console.error("❌ Registration failed:", error);
//       alert("Submission failed. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const back = (e: React.MouseEvent) => {
//     e.preventDefault();
//     if (step > 1) setStep(step - 1);
//   };

//   const handleCloseModal = () => {
//     setShowSuccessModal(false);
//     router.push("/");
//   };

//   // ========== Step Data ==========
//   const stepData = [
//     {
//       title: "Company",
//       icon: "bi-building",
//       activeIcon: "bi-building-fill",
//       description: "Provide Your Company Details",
//     },
//     {
//       title: "Coordinator",
//       icon: "bi-person-badge",
//       activeIcon: "bi-person-badge-fill",
//       description: "Add Coordinator Information and Verify",
//     },
//     {
//       title: "Documents",
//       icon: "bi-file-earmark-lock",
//       activeIcon: "bi-file-earmark-lock-fill",
//       description: "Upload Required Compliance Documents",
//     },
//     {
//       title: "Bank",
//       icon: "bi-bank",
//       activeIcon: "bi-bank2",
//       description: "Enter Bank Account Details",
//     },
//     {
//       title: "Review",
//       icon: "bi-shield-check",
//       activeIcon: "bi-shield-check",
//       description: "Review Summary",
//     },
//   ];


//   useEffect(() => {
//   console.log("🔄 State updated - companyTypes:", companyTypes);
//   console.log("🔄 State updated - companyTypes length:", companyTypes?.length);
//   console.log("🔄 State updated - loadingCompanyTypes:", loadingCompanyTypes);
//   console.log("🔄 State updated - companyTypesError:", companyTypesError);
// }, [companyTypes, loadingCompanyTypes, companyTypesError]);

// useEffect(() => {
//   console.log("🔄 Form state - companyTypeId:", form.companyTypeId);
//   console.log("🔄 Form state - companyType:", form.companyType);
// }, [form.companyTypeId, form.companyType]);

//   return (
//     <div className="bg-primary-100 min-h-screen">
//       <Header />

//       {/* Success Modal */}
//       {showSuccessModal && (
//         <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50">
//           <div className="w-90% max-w-500 animate-fadeIn">
//             <div className="bg-primary-100 rounded-2xl shadow-xl overflow-hidden">
//               <div className="bg-linear-to-r from-tertiary-600 to-tertiary-500 p-4 text-center text-white relative">
//                 <div className="text-4xl mb-2 animate-bounce">
//                   <i className="bi bi-check-circle-fill"></i>
//                 </div>
//                 <h3 className="text-xl font-bold">
//                   Application Submitted Successfully!
//                 </h3>
//               </div>
//               <div className="p-4">
//                 <p className="text-neutral-700 text-center text-base leading-relaxed mb-6">
//                   Your seller registration application has been submitted
//                   successfully. Our team will review your application and
//                   contact you within 3-5 business days.
//                 </p>
//                 <div className="rounded-xl p-6 mt-6">
//                   <div className="flex items-center mb-2">
//                     <i className="bi bi-clock text-primary-700 text-xl mr-3"></i>
//                     <span>
//                       Application ID:{" "}
//                       <strong className="text-neutral-900">
//                         {applicationId}
//                       </strong>
//                     </span>
//                   </div>
//                   <div className="flex items-center mb-3">
//                     <i className="bi bi-calendar-check text-primary-700 text-xl mr-3"></i>
//                     <span>
//                       Submitted on:{" "}
//                       <strong className="text-neutral-900">
//                         {new Date().toLocaleDateString("en-IN")}
//                       </strong>
//                     </span>
//                   </div>
//                   <div className="flex items-center">
//                     <i className="bi bi-envelope text-primary-700 text-xl mr-3"></i>
//                     <span>
//                       Confirmation sent to:{" "}
//                       <strong className="text-neutral-900">
//                         {form.email}
//                       </strong>
//                     </span>
//                   </div>
//                 </div>
//               </div>
//               <div className="px-8 py-4 bg-neutral-100 border-t border-neutral-200 flex justify-center gap-4">
//                 <button
//                   className="px-6 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all flex items-center shadow-md hover:shadow-lg"
//                   onClick={handleCloseModal}
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Sticky Header & Stepper */}
//       <div className="sticky top-0 z-40 bg-primary-100 pt-2">
//         <div className="mb-1 mx-4 md:mx-10">
//           <div className="mb-6 mt-2">
//             <div className="bg-linear-to-r from-primary-600 to-primary-800 rounded-xl p-4 text-white">
//               <div className="flex flex-col md:flex-row items-center justify-center">
//                 <div className="flex items-center mb-2 md:mb-0">
//                   <div className="w-6 h-6 mr-3 flex items-center justify-center">
//                     <i className="bi bi-building text-white text-xl"></i>
//                   </div>
//                   <div className="text-center md:text-left">
//                     <h2 className="text-xl font-bold">Seller Registration</h2>
//                     <p className="text-primary-200 text-sm">
//                       Register Your Business Here!
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Stepper */}
//           <div className="mb-2">
//             <div className="relative">
//               <div className="flex justify-between">
//                 {stepData.map((stepInfo, index) => {
//                   const stepNumber = index + 1;
//                   const isActive = step === stepNumber;
//                   const isCompleted = step > stepNumber;
//                   const isClickable = isCompleted || stepNumber === 1;
//                   return (
//                     <div
//                       key={index}
//                       className={`flex flex-col items-center relative ${
//                         isClickable ? "cursor-pointer" : "cursor-default"
//                       }`}
//                       style={{ width: `${100 / stepData.length}%` }}
//                       onClick={() => isClickable && setStep(stepNumber)}
//                     >
//                       {index < stepData.length - 1 && (
//                         <div className="absolute top-6 left-1/2 w-full h-1.5 bg-neutral-200">
//                           <div
//                             className={`h-full transition-all duration-300 ${
//                               isCompleted
//                                 ? "bg-linear-to-r from-success-300 to-primary-600"
//                                 : "bg-transparent"
//                             }`}
//                             style={{ width: isCompleted ? "100%" : "0%" }}
//                           ></div>
//                         </div>
//                       )}
//                       <div
//                         className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 z-10 transition-all duration-300 ${
//                           isActive
//                             ? "bg-primary-600 text-white shadow-lg border-2 border-white"
//                             : isCompleted
//                             ? "bg-success-300 text-white"
//                             : "bg-white text-neutral-600 border-2 border-neutral-200"
//                         }`}
//                       >
//                         {isCompleted ? (
//                           <i className="bi bi-check-circle-fill text-xl"></i>
//                         ) : (
//                           <i
//                             className={`bi ${
//                               isActive ? stepInfo.activeIcon : stepInfo.icon
//                             } text-lg`}
//                           ></i>
//                         )}
//                       </div>
//                       <div className="text-center">
//                         <p
//                           className={`text-sm font-bold ${
//                             isActive
//                               ? "text-primary-600 font-bold"
//                               : isCompleted
//                               ? "text-success-300"
//                               : "text-neutral-900"
//                           }`}
//                         >
//                           {stepInfo.title}
//                         </p>
//                         <p className="text-sm text-neutral-700">
//                           {stepInfo.description}
//                         </p>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Scrollable Form Content */}
//       <div className="mx-4 md:mx-10 pb-6">
//         <form onSubmit={handleSubmit}>
//           {/* STEP 1: COMPANY */}
//           {step === 1 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6 md:p-6 mb-6">
//               <div className="mb-6">
//                 <div className="space-y-5">
//                   {/* Company Name */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label
//                         htmlFor="sellerName"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-building"></i>
//                         Seller Name/Company Name:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="sellerName"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter your company name"
//                         value={form.sellerName}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, "sellerName")}
//                       />
//                     </div>

//                     {/* Company Type */}
//                     <div>
//   <label
//     htmlFor="companyType"
//     className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//   >
//     <i className="bi bi-diagram-3"></i>
//     Company Type: <span className="text-error-300">*</span>
//   </label>
//   <select
//     id="companyType"
//     name="companyType"
//     className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//     value={form.companyTypeId || ""}
//     onChange={handleCompanyTypeChange}
//   >
//     <option value="">-- Select Company Type --</option>
//     {loadingCompanyTypes ? (
//       <option value="" disabled>Loading company types...</option>
//     ) : companyTypesError ? (
//       <option value="" disabled className="text-error-300">
//         ⚠️ Failed to load. Please refresh.
//       </option>
//     ) : companyTypes && companyTypes.length > 0 ? (
//       companyTypes.map((type) => (
//         <option 
//           key={type?.companyTypeId || Math.random()} 
//           value={type?.companyTypeId || ""}
//         >
//           {type?.companyTypeName || "Unknown"}
//         </option>
//       ))
//     ) : (
//       <option value="" disabled>No company types available</option>
//     )}
//   </select>
//   {companyTypesError && (
//     <p className="mt-1 text-xs text-error-300">
//       {companyTypesError}. 
//       <button 
//         type="button"
//         onClick={fetchCompanyTypes}
//         className="ml-2 text-primary-600 underline"
//       >
//         Retry
//       </button>
//     </p>
//   )}
//   {!loadingCompanyTypes && !companyTypesError && companyTypes.length === 0 && (
//     <p className="mt-1 text-xs text-warning-600">
//       No company types found. Please contact support.
//     </p>
//   )}
// </div>
//                   </div>

//                   {/* Seller Type & Product Types */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label
//                         htmlFor="sellerType"
//                         className="block mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         Seller Type <span className="text-error-300">*</span>
//                       </label>
//                       <select
//                         id="sellerType"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                         value={form.sellerTypeId || ""}
//                         onChange={handleSellerTypeChange}
//                         disabled={!form.companyTypeId}
//                       >
//                         <option value="">-- Select Seller Type --</option>
//                         {loadingSellerTypes ? (
//                           <option value="" disabled>Loading seller types...</option>
//                         ) : (
//                           sellerTypes.map((type) => (
//                             <option
//                               key={type.sellerTypeId}
//                               value={type.sellerTypeId}
//                             >
//                               {type.sellerTypeName}
//                             </option>
//                           ))
//                         )}
//                       </select>
//                     </div>

//                     {/* Product Types */}
//                     <div>
//                       <label className="block mb-2 text-sm font-semibold text-primary-700">
//                         Product Type(s) <span className="text-error-300">*</span>
//                       </label>
//                       <div className="relative" ref={productDropdownRef}>
//                         <div
//                           className={`w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 cursor-pointer flex justify-between items-center hover:border-primary-300 transition-all ${
//                             !form.sellerTypeId ? 'bg-neutral-100 cursor-not-allowed' : ''
//                           }`}
//                           onClick={() => {
//                             if (form.sellerTypeId) {
//                               setIsProductDropdownOpen(!isProductDropdownOpen);
//                             }
//                           }}
//                         >
//                           <span
//                             className={
//                               form.productTypes.length === 0
//                                 ? "text-neutral-500"
//                                 : "text-neutral-900"
//                             }
//                           >
//                             {!form.sellerTypeId
//                               ? "Select seller type first"
//                               : loadingProductTypes
//                               ? "Loading product types..."
//                               : form.productTypes.length > 0
//                               ? `${form.productTypes.length} product type(s) selected`
//                               : "Select product types"}
//                           </span>
//                           <i
//                             className={`bi ${
//                               isProductDropdownOpen
//                                 ? "bi-chevron-up"
//                                 : "bi-chevron-down"
//                             } text-primary-600`}
//                           ></i>
//                         </div>

//                         {isProductDropdownOpen && form.sellerTypeId && (
//                           <div className="absolute top-full mt-1 w-full bg-white border-2 border-primary-200 rounded-xl shadow-xl z-50">
//                             <div className="p-2 border-b border-primary-100">
//                               <p className="text-sm text-neutral-600 font-medium">
//                                 Select product types:
//                               </p>
//                             </div>
//                             <div className="max-h-60 overflow-y-auto">
//                               {/* Select All */}
//                               {productTypes.length > 0 && (
//                                 <div
//                                   className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100"
//                                   onClick={handleSelectAllProductTypes}
//                                 >
//                                   <input
//                                     type="checkbox"
//                                     id="select-all"
//                                     checked={
//                                       productTypes.length > 0 && 
//                                       form.productTypes.length === productTypes.length
//                                     }
//                                     onChange={() => {}}
//                                     className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
//                                   />
//                                   <label
//                                     htmlFor="select-all"
//                                     className="ml-3 text-sm font-medium text-primary-700 cursor-pointer"
//                                   >
//                                     Select All
//                                   </label>
//                                 </div>
//                               )}

//                               {/* Individual Products */}
//                               {loadingProductTypes ? (
//                                 <div className="px-4 py-2 text-center text-neutral-500">
//                                   Loading product types...
//                                 </div>
//                               ) : productTypes.length === 0 ? (
//                                 <div className="px-4 py-2 text-center text-neutral-500">
//                                   No product types available
//                                 </div>
//                               ) : (
//                                 productTypes.map((product) => (
//                                   <div
//                                     key={product.productTypeId}
//                                     className="flex items-center px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-primary-100 last:border-b-0"
//                                     onClick={() =>
//                                       handleProductTypeToggle(product)
//                                     }
//                                   >
//                                     <input
//                                       type="checkbox"
//                                       id={`product-${product.productTypeId}`}
//                                       checked={form.productTypeIds.includes(
//                                         product.productTypeId
//                                       )}
//                                       onChange={() => {}}
//                                       className="h-4 w-4 text-primary-600 rounded border-primary-300 focus:ring-primary-200"
//                                     />
//                                     <label
//                                       htmlFor={`product-${product.productTypeId}`}
//                                       className="ml-3 text-sm text-neutral-900 cursor-pointer"
//                                     >
//                                       {product.productTypeName}
//                                       {product.regulatoryCategory && (
//                                         <span className="ml-2 text-xs text-primary-600">
//                                           ({product.regulatoryCategory})
//                                         </span>
//                                       )}
//                                     </label>
//                                   </div>
//                                 ))
//                               )}
//                             </div>
//                             <div className="p-2 border-t border-primary-100 bg-primary-50">
//                               <p className="text-xs text-neutral-500">
//                                 {form.productTypes.length} of{" "}
//                                 {productTypes.length} selected
//                               </p>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                       {form.productTypes.length > 0 && (
//                         <div className="mt-2">
//                           <p className="text-sm text-success-300">
//                             <i className="bi bi-check-circle-fill mr-1"></i>
//                             Selected: {form.productTypes.join(", ")}
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Address Fields */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label
//                         htmlFor="state"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-geo-alt"></i>State:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <select
//                         id="state"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                         value={form.stateId || ""}
//                         onChange={handleStateChange}
//                       >
//                         <option value="">-- Select State --</option>
//                         {loadingStates ? (
//                           <option value="" disabled>Loading states...</option>
//                         ) : statesError ? (
//                           <option value="" disabled className="text-error-300">
//                             ⚠️ Failed to load
//                           </option>
//                         ) : (
//                           states.map((state) => (
//                             <option key={state.stateId} value={state.stateId}>
//                               {state.stateName}
//                             </option>
//                           ))
//                         )}
//                       </select>
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="district"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-geo"></i>District:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <select
//                         id="district"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                         value={form.districtId || ""}
//                         onChange={handleDistrictChange}
//                         disabled={!form.stateId}
//                       >
//                         <option value="">-- Select District --</option>
//                         {loadingDistricts ? (
//                           <option value="" disabled>Loading districts...</option>
//                         ) : (
//                           districts.map((district) => (
//                             <option
//                               key={district.districtId}
//                               value={district.districtId}
//                             >
//                               {district.districtName}
//                             </option>
//                           ))
//                         )}
//                       </select>
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="taluka"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-map"></i>Taluka:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <select
//                         id="taluka"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all appearance-none"
//                         value={form.talukaId || ""}
//                         onChange={handleTalukaChange}
//                         disabled={!form.districtId}
//                       >
//                         <option value="">-- Select Taluka --</option>
//                         {loadingTalukas ? (
//                           <option value="" disabled>Loading talukas...</option>
//                         ) : (
//                           talukas.map((taluka) => (
//                             <option key={taluka.talukaId} value={taluka.talukaId}>
//                               {taluka.talukaName}
//                             </option>
//                           ))
//                         )}
//                       </select>
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="city"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-geo-fill"></i>City/Town/Village:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="city"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter city/town/village"
//                         value={form.city}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, "city")}
//                       />
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="street"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-signpost"></i>Street/Road/Lane:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="street"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter street/road/lane"
//                         value={form.street}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) => handleAlphabetInput(e, "street")}
//                       />
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="buildingNo"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-house-door"></i>Building/House No:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="buildingNo"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter building/house no"
//                         value={form.buildingNo}
//                         onChange={handleChange}
//                       />
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="landmark"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-geo"></i>Landmark:
//                       </label>
//                       <input
//                         type="text"
//                         id="landmark"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter landmark (optional)"
//                         value={form.landmark}
//                         onChange={handleChange}
//                       />
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="pincode"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-pin-map"></i>Pin Code:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="pincode"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter 6-digit pin code"
//                         maxLength={6}
//                         value={form.pincode}
//                         onChange={(e) => handleNumericInput(e, "pincode", 6)}
//                       />
//                     </div>
//                   </div>

//                   {/* Contact Information */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label
//                         htmlFor="phone"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-telephone"></i>Company Phone:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="tel"
//                         id="phone"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter company phone"
//                         maxLength={10}
//                         value={form.phone}
//                         onChange={(e) => handleNumericInput(e, "phone", 10)}
//                       />
//                     </div>
//                     <div>
//                       <label
//                         htmlFor="email"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-envelope"></i>Company Email ID:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="email"
//                         id="email"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter company email"
//                         value={form.email}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div className="md:col-span-2">
//                       <label
//                         htmlFor="website"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-globe"></i>Company Website (Optional):
//                       </label>
//                       <input
//                         type="url"
//                         id="website"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter company website"
//                         value={form.website}
//                         onChange={handleChange}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* STEP 2: COORDINATOR */}
//           {step === 2 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//               <div className="mb-6">
//                 <div className="text-center mb-6">
//                   {(!emailVerified || !phoneVerified) && (
//                     <div className="mt-3 p-3 bg-warning-100 border border-warning-200 rounded-xl text-warning-800 text-sm inline-flex items-center">
//                       <i className="bi bi-exclamation-triangle mr-2"></i>
//                       Please verify both Email and Mobile OTP to proceed
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-5">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label
//                         htmlFor="coordinatorName"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-person"></i>Coordinator Name:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="coordinatorName"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter coordinator name"
//                         value={form.coordinatorName}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) =>
//                           handleAlphabetInput(e, "coordinatorName")
//                         }
//                       />
//                     </div>
//                     <div>
//                       <label
//                         htmlFor="coordinatorDesignation"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-briefcase"></i>Coordinator Designation:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="coordinatorDesignation"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter designation"
//                         value={form.coordinatorDesignation}
//                         onKeyPress={handleAlphabetKeyPress}
//                         onChange={(e) =>
//                           handleAlphabetInput(e, "coordinatorDesignation")
//                         }
//                       />
//                     </div>
//                   </div>

//                   {/* Coordinator Email and Mobile Verification */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <OtpVerification
//                         label="Email"
//                         value={form.coordinatorEmail}
//                         onChange={(val: string) =>
//                           setForm((prev) => ({
//                             ...prev,
//                             coordinatorEmail: val,
//                           }))
//                         }
//                         onVerified={() => setEmailVerified(true)}
//                         verified={emailVerified}
//                       />
//                     </div>
//                     <div>
//                       <OtpVerification
//                         label="Mobile"
//                         value={form.coordinatorMobile}
//                         onChange={(val: string) =>
//                           setForm((prev) => ({
//                             ...prev,
//                             coordinatorMobile: val,
//                           }))
//                         }
//                         onVerified={() => setPhoneVerified(true)}
//                         verified={phoneVerified}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* STEP 3: DOCUMENTS */}
//           {step === 3 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//               <div className="mb-6">
//                 {/* GST Certificate Section */}
//                 <div className="mb-2">
//                   <div className="bg-primary-50 rounded-xl p-1 mb-2">
//                     <h3 className="text-lg font-semibold text-primary-700 flex items-center">
//                       <i className="bi bi-file-earmark-text mr-2"></i>GSTIN
//                       Certificate
//                     </h3>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label
//                         htmlFor="gstNumber"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-hash"></i>GST Number:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="gstNumber"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         placeholder="Enter GST number"
//                         value={form.gstNumber}
//                         onChange={handleChange}
//                       />
//                     </div>
//                     <div>
//                       <label
//                         htmlFor="gstFile"
//                         className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         <i className="bi bi-upload"></i>GST Certificate:{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="file"
//                         id="gstFile"
//                         className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//                         accept=".pdf,.jpg,.jpeg,.png"
//                         onChange={handleChange}
//                       />
//                       {form.gstFile && (
//                         <p className="mt-2 text-sm text-success-300">
//                           <i className="bi bi-check-circle-fill mr-1"></i>
//                           File selected: {form.gstFile.name}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Dynamic License Sections */}
//                 {form.productTypes.map((productType) => {
//                   const licenseInfo = getLicenseInfo(productType);
//                   const licenseData = form.licenses[productType] || {
//                     number: "",
//                     file: null,
//                   };

//                   return (
//                     <div key={productType} className="mb-4">
//                       <div className="bg-primary-50 rounded-xl p-2 mb-2">
//                         <h3 className="text-lg font-semibold text-primary-700 flex items-center">
//                           <i className="bi bi-prescription2 mr-2"></i>
//                           {licenseInfo.label}
//                           <span className="ml-2 text-sm font-normal text-neutral-600">
//                             (Required for: {productType})
//                           </span>
//                         </h3>
//                       </div>

//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         <div>
//                           <label
//                             htmlFor={`licenseNumber-${productType}`}
//                             className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                           >
//                             <i className="bi bi-hash"></i>
//                             {licenseInfo.label} Number:{" "}
//                             <span className="text-error-300">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             id={`licenseNumber-${productType}`}
//                             className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                             placeholder={licenseInfo.placeholder}
//                             value={licenseData.number}
//                             onChange={handleChange}
//                           />
//                         </div>
//                         <div>
//                           <label
//                             htmlFor={`licenseFile-${productType}`}
//                             className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary-700"
//                           >
//                             <i className="bi bi-upload"></i>
//                             {licenseInfo.label} File Upload:{" "}
//                             <span className="text-error-300">*</span>
//                           </label>
//                           <input
//                             type="file"
//                             id={`licenseFile-${productType}`}
//                             className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//                             accept=".pdf,.jpg,.jpeg,.png"
//                             onChange={handleChange}
//                           />
//                           {licenseData.file && (
//                             <p className="mt-2 text-sm text-success-300">
//                               <i className="bi bi-check-circle-fill mr-1"></i>
//                               File selected: {licenseData.file.name}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}

//                 {form.productTypes.length === 0 && (
//                   <div className="mt-6 p-4 bg-warning-100 border border-warning-200 rounded-xl">
//                     <div className="flex items-center">
//                       <i className="bi bi-exclamation-triangle text-warning-800 text-xl mr-3"></i>
//                       <div>
//                         <p className="text-warning-800 font-medium">
//                           No product types selected
//                         </p>
//                         <p className="text-warning-700 text-sm mt-1">
//                           Please go back to Step 1 and select at least one
//                           product type.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* STEP 4: BANK DETAILS */}
//           {step === 4 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-3 md:p-6 mb-6">
//               <div className="mb-6">
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label
//                         htmlFor="accountNumber"
//                         className="block mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         Account Number <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="accountNumber"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         value={form.accountNumber}
//                         onChange={handleChange}
//                         placeholder="Enter account number"
//                       />
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="accountHolderName"
//                         className="block mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         Account Holder Name{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="accountHolderName"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
//                         value={form.accountHolderName}
//                         onChange={(e) =>
//                           handleAlphabetInput(e, "accountHolderName")
//                         }
//                         onKeyPress={handleAlphabetKeyPress}
//                         placeholder="As per bank records"
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label
//                         htmlFor="ifscCode"
//                         className="block mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         IFSC Code <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         id="ifscCode"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all uppercase"
//                         maxLength={11}
//                         value={form.ifscCode}
//                         onChange={(e) => handleIfscChange(e.target.value)}
//                         placeholder="SBIN0005943"
//                       />
//                       {ifscError && (
//                         <p className="mt-1 text-sm text-error-300">
//                           {ifscError}
//                         </p>
//                       )}
//                     </div>

//                     <div>
//                       <label
//                         htmlFor="cancelledChequeFile"
//                         className="block mb-2 text-sm font-semibold text-primary-700"
//                       >
//                         Cancelled Cheque / Bank Details Proof{" "}
//                         <span className="text-error-300">*</span>
//                       </label>
//                       <input
//                         type="file"
//                         id="cancelledChequeFile"
//                         className="w-full px-4 py-2 border-2 border-dashed border-primary-300 rounded-xl bg-primary-50 text-neutral-900 cursor-pointer hover:border-primary-400 hover:bg-primary-100 transition-all"
//                         accept=".pdf,.jpg,.jpeg,.png"
//                         onChange={handleChange}
//                       />
//                       {form.cancelledChequeFile && (
//                         <p className="mt-2 text-sm text-success-300">
//                           <i className="bi bi-check-circle-fill mr-1"></i>
//                           File selected: {form.cancelledChequeFile.name}
//                         </p>
//                       )}
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block mb-2 text-sm font-semibold text-primary-700">
//                         Bank Name
//                       </label>
//                       <input
//                         type="text"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//                         value={form.bankName}
//                         disabled
//                         readOnly
//                       />
//                     </div>

//                     <div>
//                       <label className="block mb-2 text-sm font-semibold text-primary-700">
//                         Branch
//                       </label>
//                       <input
//                         type="text"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//                         value={form.branch}
//                         disabled
//                         readOnly
//                       />
//                     </div>

//                     <div>
//                       <label className="block mb-2 text-sm font-semibold text-primary-700">
//                         State
//                       </label>
//                       <input
//                         type="text"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//                         value={form.bankState}
//                         disabled
//                         readOnly
//                       />
//                     </div>

//                     <div>
//                       <label className="block mb-2 text-sm font-semibold text-primary-700">
//                         District
//                       </label>
//                       <input
//                         type="text"
//                         className="w-full px-4 py-2 border-2 border-primary-200 rounded-xl bg-neutral-50 text-neutral-700"
//                         value={form.bankDistrict}
//                         disabled
//                         readOnly
//                       />
//                     </div>
//                   </div>

//                   <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-xl">
//                     <div className="flex">
//                       <i className="bi bi-shield-check text-primary-700 text-2xl mr-4"></i>
//                       <div>
//                         <h6 className="font-bold text-primary-800 mb-1">
//                           Security Assurance
//                         </h6>
//                         <p className="text-sm text-neutral-700">
//                           Your bank details are encrypted and stored securely.
//                           We follow PCI-DSS compliance standards for financial
//                           data protection.
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* STEP 5: REVIEW */}
//           {step === 5 && (
//             <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-4 md:p-6 mb-6">
//               <div className="text-center mb-8">
//                 <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
//                   <i className="bi bi-shield-check text-white text-2xl"></i>
//                 </div>
//                 <h4 className="text-2xl font-bold bg-linear-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
//                   Final Submission Summary
//                 </h4>
//                 <p className="text-neutral-600 mt-2">
//                   Please review all details before final submission
//                 </p>
//               </div>

//               {/* Company Section */}
//               <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-building mr-2"></i> Company Details
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {[
//                     { label: "Company Name", value: form.sellerName },
//                     { label: "Company Type", value: form.companyType },
//                     { label: "Seller Type", value: form.sellerType },
//                     {
//                       label: "Product Type(s)",
//                       value: form.productTypes.join(", "),
//                     },
//                     { label: "State", value: form.state },
//                     { label: "District", value: form.district },
//                     { label: "Taluka", value: form.taluka },
//                     { label: "City/Town/Village", value: form.city },
//                     { label: "Street/Road/Lane", value: form.street },
//                     { label: "Building/House No", value: form.buildingNo },
//                     { label: "Landmark", value: form.landmark || "N/A" },
//                     { label: "Pin Code", value: form.pincode },
//                     { label: "Phone", value: form.phone },
//                     { label: "Email", value: form.email },
//                     { label: "Website", value: form.website || "N/A" },
//                   ].map((item, index) => (
//                     <div key={index}>
//                       <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                         {item.label}
//                       </span>
//                       <p
//                         className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                           !item.value ||
//                           (item.value === "N/A" && item.label === "Landmark") ||
//                           (item.value === "N/A" && item.label === "Website")
//                             ? "text-neutral-500"
//                             : "text-neutral-900"
//                         }`}
//                       >
//                         {item.value || "Not provided"}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Coordinator Section */}
//               <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-person-badge mr-2"></i> Coordinator Details
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {[
//                     { label: "Name", value: form.coordinatorName },
//                     { label: "Designation", value: form.coordinatorDesignation },
//                     {
//                       label: "Email",
//                       value: form.coordinatorEmail,
//                       verified: emailVerified,
//                     },
//                     {
//                       label: "Mobile",
//                       value: form.coordinatorMobile,
//                       verified: phoneVerified,
//                     },
//                   ].map((item, index) => (
//                     <div key={index}>
//                       <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                         {item.label}
//                       </span>
//                       <p
//                         className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                           !item.value ? "text-error-300" : "text-neutral-900"
//                         }`}
//                       >
//                         {item.value || "Not provided"}
//                         {item.verified !== undefined && item.value && (
//                           <span
//                             className={`ml-2 px-2 py-1 text-xs rounded ${
//                               item.verified
//                                 ? "bg-success-100 text-success-300"
//                                 : "bg-warning-100 text-warning-300"
//                             }`}
//                           >
//                             {item.verified ? "✔ Verified" : "Not verified"}
//                           </span>
//                         )}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Documents Section */}
//               <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-file-earmark-lock mr-2"></i> Compliance Documents
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                       GST Number
//                     </span>
//                     <p
//                       className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                         !form.gstNumber ? "text-error-300" : "text-neutral-900"
//                       }`}
//                     >
//                       {form.gstNumber || "Not provided"}
//                     </p>
//                   </div>
//                   <div>
//                     <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                       GST Certificate
//                     </span>
//                     <p
//                       className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                         !form.gstFile ? "text-error-300" : "text-neutral-900"
//                       }`}
//                     >
//                       {form.gstFile ? (
//                         <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//                           <i className="bi bi-file-earmark-pdf mr-2"></i>
//                           {form.gstFile.name}
//                         </span>
//                       ) : (
//                         "Not uploaded"
//                       )}
//                     </p>
//                   </div>

//                   {form.productTypes.map((productType) => {
//                     const licenseInfo = getLicenseInfo(productType);
//                     const licenseData = form.licenses[productType];
//                     return (
//                       <React.Fragment key={productType}>
//                         <div>
//                           <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                             {licenseInfo.label} for {productType}
//                           </span>
//                           <p
//                             className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                               !licenseData?.number
//                                 ? "text-error-300"
//                                 : "text-neutral-900"
//                             }`}
//                           >
//                             {licenseData?.number || "Not provided"}
//                           </p>
//                         </div>
//                         <div>
//                           <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                             {licenseInfo.label} File
//                           </span>
//                           <p
//                             className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                               !licenseData?.file
//                                 ? "text-error-300"
//                                 : "text-neutral-900"
//                             }`}
//                           >
//                             {licenseData?.file ? (
//                               <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//                                 <i className="bi bi-file-earmark-pdf mr-2"></i>
//                                 {licenseData.file.name}
//                               </span>
//                             ) : (
//                               "Not uploaded"
//                             )}
//                           </p>
//                         </div>
//                       </React.Fragment>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Bank Details Section */}
//               <div className="mb-8 p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-bank mr-2"></i> Bank Account Details
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {[
//                     { label: "Bank Name", value: form.bankName },
//                     { label: "Branch", value: form.branch },
//                     { label: "State", value: form.bankState },
//                     { label: "District", value: form.bankDistrict },
//                     { label: "IFSC Code", value: form.ifscCode },
//                     {
//                       label: "Account Number",
//                       value: form.accountNumber
//                         ? "****" + form.accountNumber.slice(-4)
//                         : "",
//                     },
//                     {
//                       label: "Account Holder Name",
//                       value: form.accountHolderName,
//                     },
//                     {
//                       label: "Cancelled Cheque",
//                       value: form.cancelledChequeFile ? (
//                         <span className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-lg text-sm font-semibold">
//                           <i className="bi bi-file-earmark-pdf mr-2"></i>
//                           {form.cancelledChequeFile.name}
//                         </span>
//                       ) : (
//                         "Not uploaded"
//                       ),
//                     },
//                   ].map((item, index) => (
//                     <div key={index}>
//                       <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider block mb-1">
//                         {item.label}
//                       </span>
//                       <p
//                         className={`text-sm font-medium p-3 bg-white rounded-lg min-h-12 flex items-center ${
//                           !item.value || item.value === "Not uploaded"
//                             ? "text-error-300"
//                             : "text-neutral-900"
//                         }`}
//                       >
//                         {item.value || "Not provided"}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Validation Summary */}
//               <div className="p-6 bg-primary-50 rounded-2xl border-l-4 border-primary-600">
//                 <h6 className="text-lg font-bold text-primary-700 mb-4 flex items-center">
//                   <i className="bi bi-clipboard-check mr-2"></i> Validation Summary
//                 </h6>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {[
//                     {
//                       label: "Company Info",
//                       complete:
//                         form.sellerName &&
//                         form.pincode &&
//                         form.productTypes.length > 0,
//                     },
//                     {
//                       label: "Verification",
//                       complete: emailVerified && phoneVerified,
//                     },
//                     {
//                       label: "GST Document",
//                       complete: !!form.gstFile,
//                     },
//                     {
//                       label: "Product Licenses",
//                       complete:
//                         form.productTypes.length > 0 &&
//                         form.productTypes.every(
//                           (pt) =>
//                             form.licenses[pt]?.number && form.licenses[pt]?.file
//                         ),
//                     },
//                     {
//                       label: "Bank Details",
//                       complete:
//                         form.ifscCode &&
//                         form.accountNumber &&
//                         form.cancelledChequeFile,
//                     },
//                   ].map((item, index) => (
//                     <div key={index} className="flex items-center">
//                       <i
//                         className={`bi ${
//                           item.complete
//                             ? "bi-check-circle-fill text-success-300"
//                             : "bi-x-circle-fill text-error-300"
//                         } text-lg mr-3`}
//                       ></i>
//                       <span className="text-sm font-medium text-neutral-700">
//                         {item.label}: {item.complete ? "Complete" : "Incomplete"}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Navigation Buttons */}
//           <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-6 border-t border-neutral-200 gap-4">
//             {step > 1 && (
//               <button
//                 type="button"
//                 onClick={back}
//                 className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto"
//               >
//                 <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
//                   <i className="bi bi-arrow-left mr-2"></i> Back
//                 </span>
//                 <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//               </button>
//             )}

//             <div className="w-full md:w-auto md:ml-auto flex justify-end">
//               <button
//                 type="submit"
//                 disabled={submitting}
//                 className="group relative px-8 py-3 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300 flex items-center justify-center w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-lg">
//                   {submitting ? (
//                     <>
//                       <i className="bi bi-hourglass-split mr-2 animate-spin"></i>
//                       Submitting...
//                     </>
//                   ) : step < 5 ? (
//                     <>
//                       Continue <i className="bi bi-arrow-right ml-2"></i>
//                     </>
//                   ) : (
//                     <>
//                       <i className="bi bi-check-circle mr-2"></i> Submit Application
//                     </>
//                   )}
//                 </span>
//                 <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
//               </button>
//             </div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }



















