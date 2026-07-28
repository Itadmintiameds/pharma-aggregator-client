"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CompanyForm from "./CompanyForm";
import CoordinatorForm from "./CoordinatorForm";
import DocumentForm from "./DocumentForm";
import BankForm from "./BankForm";
import ReviewForm from "./ReviewForm";
import SuccessModal from "./SuccessModal";
import SignupForm from "./SignupForm";
import LoginModals from "@/src/app/modals/LoginModals/LoginModals";
import { uploadSellerRegDocService } from "@/src/services/seller/UploadSellerRegDoc";
import SellerRegistrationLayout from "./SellerRegistrationLayout"
import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService"
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService"
import { sellerAuthService } from "@/src/services/seller/authService"
import { sellerProfileService } from "@/src/services/seller/sellerProfileService"
import { fetchBankDetails } from "@/src/services/seller/IFSCService"
import { ifscSchema } from "@/src/schema/seller/IFSCSchema"
import { step1Schema, step2Schema, step3Schema, step4Schema } from "@/src/schema/seller/sellerRegSchema"
import { CompanyTypeResponse, SellerTypeResponse, ProductTypeResponse, StateResponse, DistrictResponse, TalukaResponse, DocumentTypeResponse, } from "@/src/types/seller/SellerRegMasterData"
import { TempSellerRequest, TempSellerDocument, TempSellerBankDetails, TempSellerAddress, TempSellerCoordinator } from "@/src/types/seller/sellerRegistrationData"

export default function SellerRegistration() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [step, setStep] = useState(1)
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [applicationId, setApplicationId] = useState("")
  const [ifscError, setIfscError] = useState("")
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const productDropdownRef = useRef<HTMLDivElement>(null)

  // Email/Phone validation states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailExistsError, setEmailExistsError] = useState("")
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const [phoneExistsError, setPhoneExistsError] = useState("")

  // Master Data States
  const [companyTypes, setCompanyTypes] = useState<CompanyTypeResponse[]>([])
  const [sellerTypes, setSellerTypes] = useState<SellerTypeResponse[]>([])
  const [productTypes, setProductTypes] = useState<ProductTypeResponse[]>([])
  const [states, setStates] = useState<StateResponse[]>([])
  const [districts, setDistricts] = useState<DistrictResponse[]>([])
  const [talukas, setTalukas] = useState<TalukaResponse[]>([])
  const [bankDistricts, setBankDistricts] = useState<DistrictResponse[]>([])
  const [bankTalukas, setBankTalukas] = useState<TalukaResponse[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeResponse[]>([])

  // Loading States
  const [loadingStates, setLoadingStates] = useState({
    companyTypes: true,
    sellerTypes: true,
    productTypes: true,
    states: true,
    districts: false,
    talukas: false,
    bankDistricts: false,
    bankTalukas: false,
    documentTypes: true,
  })
  const [submitting, setSubmitting] = useState(false)

  // Form State (Full old version state)
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
    parentManufacturerName: "",
    brandOwnerName: "",
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
    authorizationLetterFile: null as File | null,

    // GST
    gstNumber: "",
    gstFile: null as File | null,

    // company registration certificate
    companyRegistrationCertificateFile: null as File | null,

    // Licenses per product
    licenses: {} as Record<string, {
      number: string;
      file: File | null;
      issueDate: Date | null;
      expiryDate: Date | null;
      issuingAuthority: string;
      status: 'Active' | 'Expired';
    }>,

    // Seller-type-driven agreement documents, keyed by documentTypeCode
    agreements: {} as Record<string, {
      number: string;
      file: File | null;
      issueDate: Date | null;
      expiryDate: Date | null;
    }>,

    // Bank details
    bankStateId: 0,
    bankDistrictId: 0,
    bankTalukaId: 0,
    bankState: "",
    bankDistrict: "",
    bankTaluka: "",
    bankName: "",
    branch: "",
    ifscCode: "",
    accountNumber: "",
    accountHolderName: "",
    confirmAccountNumber: "",
    cancelledChequeFile: null as File | null,
  })

  // Registration now requires a login (created via the signup-first flow) —
  // check once on mount so returning users skip straight to the wizard.
  useEffect(() => {
    setIsAuthenticated(sellerAuthService.isAuthenticated())
    setAuthChecked(true)
  }, [])

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

  // Fetch all master data on mount
  useEffect(() => {
    fetchCompanyTypes()
    fetchStates()
    fetchSellerTypes()
    fetchProductTypes()
    fetchDocumentTypes()
  }, [])

  // Master data fetch functions (exactly as in old version)
  const fetchCompanyTypes = async () => {
    setLoadingStates(prev => ({ ...prev, companyTypes: true }))
    try {
      const data = await sellerRegMasterService.getCompanyTypes()
      setCompanyTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching company types:", error)
      toast.error("Failed to load company types")
      setCompanyTypes([])
    } finally {
      setLoadingStates(prev => ({ ...prev, companyTypes: false }))
    }
  }

  const fetchStates = async () => {
    setLoadingStates(prev => ({ ...prev, states: true }))
    try {
      const data = await sellerRegMasterService.getStates()
      setStates(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching states:", error)
      toast.error("Failed to load states")
      setStates([])
    } finally {
      setLoadingStates(prev => ({ ...prev, states: false }))
    }
  }

  const fetchSellerTypes = async () => {
    setLoadingStates(prev => ({ ...prev, sellerTypes: true }))
    try {
      const data = await sellerRegMasterService.getSellerTypes()
      setSellerTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching seller types:", error)
      setSellerTypes([])
      toast.error("Failed to load seller types")
    } finally {
      setLoadingStates(prev => ({ ...prev, sellerTypes: false }))
    }
  }

  const fetchProductTypes = async () => {
    setLoadingStates(prev => ({ ...prev, productTypes: true }))
    try {
      const data = await sellerRegMasterService.getProductTypes()
      setProductTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching product types:", error)
      setProductTypes([])
      toast.error("Failed to load product types")
    } finally {
      setLoadingStates(prev => ({ ...prev, productTypes: false }))
    }
  }

  const fetchDocumentTypes = async () => {
    setLoadingStates(prev => ({ ...prev, documentTypes: true }))
    try {
      const data = await sellerRegMasterService.getDocumentTypes()
      setDocumentTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching document types:", error)
      setDocumentTypes([])
      toast.error("Failed to load document types")
    } finally {
      setLoadingStates(prev => ({ ...prev, documentTypes: false }))
    }
  }

  const fetchBankDistrictsByState = async (stateId: number) => {
    if (!stateId) return
    setLoadingStates(prev => ({ ...prev, bankDistricts: true }))
    try {
      const data = await sellerRegMasterService.getDistrictsByStateId(stateId)
      setBankDistricts(data)
    } catch (error) {
      console.error("Error fetching bank districts:", error)
      setBankDistricts([])
      toast.error("Failed to load districts")
    } finally {
      setLoadingStates(prev => ({ ...prev, bankDistricts: false }))
    }
  }

  const fetchBankTalukasByDistrict = async (districtId: number) => {
    if (!districtId) return
    setLoadingStates(prev => ({ ...prev, bankTalukas: true }))
    try {
      const data = await sellerRegMasterService.getTalukasByDistrictId(districtId)
      setBankTalukas(data)
    } catch (error) {
      console.error("Error fetching bank talukas:", error)
      setBankTalukas([])
      toast.error("Failed to load talukas")
    } finally {
      setLoadingStates(prev => ({ ...prev, bankTalukas: false }))
    }
  }

  const fetchDistrictsByState = async (stateId: number) => {
    if (!stateId) return
    setLoadingStates(prev => ({ ...prev, districts: true }))
    try {
      const data = await sellerRegMasterService.getDistrictsByStateId(stateId)
      setDistricts(data)
    } catch (error) {
      console.error("Error fetching districts:", error)
      setDistricts([])
      toast.error("Failed to load districts")
    } finally {
      setLoadingStates(prev => ({ ...prev, districts: false }))
    }
  }

  const fetchTalukasByDistrict = async (districtId: number) => {
    if (!districtId) return
    setLoadingStates(prev => ({ ...prev, talukas: true }))
    try {
      const data = await sellerRegMasterService.getTalukasByDistrictId(districtId)
      setTalukas(data)
    } catch (error) {
      console.error("Error fetching talukas:", error)
      setTalukas([])
      toast.error("Failed to load talukas")
    } finally {
      setLoadingStates(prev => ({ ...prev, talukas: false }))
    }
  }

  // Coordinator email/phone check functions (exactly as in old version)
  const checkCoordinatorEmailExists = async (email: string) => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailExistsError("")
      return false
    }

    setIsCheckingEmail(true)
    setEmailExistsError("")

    try {
      const exists = await sellerRegService.checkCoordinatorEmail(email)
      if (exists) {
        setEmailExistsError("This email is already registered. Please use a different email address.")
        return true
      }
      setEmailExistsError("")
      return false
    } catch (error: any) {
      console.error("Error checking email:", error)
      setEmailExistsError(error.message || "Failed to verify email")
      return false
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const checkCoordinatorPhoneExists = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneExistsError("")
      return false
    }

    setIsCheckingPhone(true)
    setPhoneExistsError("")

    try {
      const exists = await sellerRegService.checkCoordinatorPhone(cleanPhone)
      if (exists) {
        setPhoneExistsError("This phone number is already registered. Please use a different number.")
        return true
      }
      setPhoneExistsError("")
      return false
    } catch (error: any) {
      console.error("Error checking phone:", error)
      setPhoneExistsError(error.message || "Failed to verify phone")
      return false
    } finally {
      setIsCheckingPhone(false)
    }
  }

  // GST handler
  const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase()
    value = value.replace(/[^0-9A-Z]/g, '')
    if (value.length > 15) value = value.slice(0, 15)
    setFormData(prev => ({ ...prev, gstNumber: value }))
  }

  // Clears the bank name/branch/location fields and the bank State/District/
  // Taluka dropdown selections — shared by every "IFSC lookup didn't work" path.
  const clearBankLookupFields = () => {
    setFormData(prev => ({
      ...prev,
      bankName: "",
      branch: "",
      bankState: "",
      bankDistrict: "",
      bankTaluka: "",
      bankStateId: 0,
      bankDistrictId: 0,
      bankTalukaId: 0,
    }))
    setBankDistricts([])
    setBankTalukas([])
  }

  // IFSC handler with auto-fill — also drives the bank State/District/Taluka
  // dropdowns by matching the IFSC lookup's STATE/DISTRICT/CITY strings against
  // the master-data lists, so the user isn't asked to re-pick what IFSC already told us.
  const handleIfscChange = async (value: string) => {
    const ifsc = value.toUpperCase()
    setFormData(prev => ({ ...prev, ifscCode: ifsc }))
    setIfscError("")

    if (ifsc.length !== 11) {
      clearBankLookupFields()
      return
    }

    const parseResult = ifscSchema.safeParse(ifsc)
    if (!parseResult.success) {
      setIfscError(parseResult.error.issues[0].message)
      clearBankLookupFields()
      toast.error(parseResult.error.issues[0].message)
      return
    }

    try {
      const data = await fetchBankDetails(ifsc)
      setFormData(prev => ({
        ...prev,
        bankName: data.BANK || "",
        branch: data.BRANCH || "",
        bankState: data.STATE || "",
        bankDistrict: data.DISTRICT || data.CITY || "",
      }))

      const matchedState = states.find(
        s => s.stateName.trim().toLowerCase() === (data.STATE || "").trim().toLowerCase()
      )

      if (!matchedState) {
        setFormData(prev => ({ ...prev, bankStateId: 0, bankDistrictId: 0, bankTalukaId: 0 }))
        setBankDistricts([])
        setBankTalukas([])
        return
      }

      setFormData(prev => ({
        ...prev,
        bankStateId: matchedState.stateId,
        bankDistrictId: 0,
        bankTalukaId: 0,
      }))
      setBankTalukas([])

      setLoadingStates(prev => ({ ...prev, bankDistricts: true }))
      let districtList: DistrictResponse[] = []
      try {
        const districtsData = await sellerRegMasterService.getDistrictsByStateId(matchedState.stateId)
        districtList = Array.isArray(districtsData) ? districtsData : []
        setBankDistricts(districtList)
      } catch (error) {
        console.error("Error fetching bank districts:", error)
        setBankDistricts([])
      } finally {
        setLoadingStates(prev => ({ ...prev, bankDistricts: false }))
      }

      const districtName = (data.DISTRICT || data.CITY || "").trim().toLowerCase()
      const matchedDistrict = districtList.find(
        d => d.districtName.trim().toLowerCase() === districtName
      )

      if (!matchedDistrict) return

      setFormData(prev => ({ ...prev, bankDistrictId: matchedDistrict.districtId, bankTalukaId: 0 }))

      setLoadingStates(prev => ({ ...prev, bankTalukas: true }))
      let talukaList: TalukaResponse[] = []
      try {
        const talukasData = await sellerRegMasterService.getTalukasByDistrictId(matchedDistrict.districtId)
        talukaList = Array.isArray(talukasData) ? talukasData : []
        setBankTalukas(talukaList)
      } catch (error) {
        console.error("Error fetching bank talukas:", error)
        setBankTalukas([])
      } finally {
        setLoadingStates(prev => ({ ...prev, bankTalukas: false }))
      }

      const cityName = (data.CITY || "").trim().toLowerCase()
      const matchedTaluka = cityName
        ? talukaList.find(t => t.talukaName.trim().toLowerCase() === cityName)
        : undefined

      if (matchedTaluka) {
        setFormData(prev => ({ ...prev, bankTalukaId: matchedTaluka.talukaId }))
      }
    } catch {
      setIfscError("Invalid IFSC Code")
      clearBankLookupFields()
      toast.error("Invalid IFSC Code")
    }
  }

  // License status calculator
  const calculateLicenseStatus = (issueDate: Date | null, expiryDate: Date | null): 'Active' | 'Expired' => {
    if (!issueDate || !expiryDate) return 'Expired'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expDate = new Date(expiryDate)
    expDate.setHours(0, 0, 0, 0)
    return today <= expDate ? 'Active' : 'Expired'
  }

  // Product selection handlers
  const handleProductTypeToggle = (product: ProductTypeResponse) => {
    if (!product) return

    setFormData(prev => {
      let newProductTypeIds = [...prev.productTypeIds]
      let newProductTypes = [...prev.productTypes]
      const newLicenses = { ...prev.licenses }

      if (newProductTypeIds.includes(product.productTypeId)) {
        newProductTypeIds = newProductTypeIds.filter(id => id !== product.productTypeId)
        newProductTypes = newProductTypes.filter(name => name !== product.productTypeName)
        delete newLicenses[product.productTypeName]
      } else {
        newProductTypeIds.push(product.productTypeId)
        newProductTypes.push(product.productTypeName)
        newLicenses[product.productTypeName] = {
          number: "",
          file: null,
          issueDate: null,
          expiryDate: null,
          issuingAuthority: "",
          status: 'Expired'
        }
      }

      return {
        ...prev,
        productTypeIds: newProductTypeIds,
        productTypes: newProductTypes,
        licenses: newLicenses,
      }
    })
  }

  const handleCompanyRegFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, companyRegistrationCertificateFile: file }));
  };

  const handleSelectAllProductTypes = () => {
    if (!productTypes.length) return

    if (formData.productTypes.length === productTypes.length) {
      // Deselect all
      setFormData(prev => ({
        ...prev,
        productTypeIds: [],
        productTypes: [],
        licenses: {},
      }))
    } else {
      // Select all
      const allIds = productTypes.map(p => p.productTypeId)
      const allNames = productTypes.map(p => p.productTypeName)

      const newLicenses: Record<string, any> = {}
      allNames.forEach(name => {
        newLicenses[name] = {
          number: "",
          file: null,
          issueDate: null,
          expiryDate: null,
          issuingAuthority: "",
          status: 'Expired'
        }
      })

      setFormData(prev => ({
        ...prev,
        productTypeIds: allIds,
        productTypes: allNames,
        licenses: newLicenses,
      }))
    }
  }

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, productName?: string) => {
    const { files } = e.target
    if (!files || !files[0]) return

    const file = files[0]

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB")
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, JPEG, and PNG files are allowed")
      return
    }

    if (productName) {
      // License file
      setFormData(prev => ({
        ...prev,
        licenses: {
          ...prev.licenses,
          [productName]: {
            ...prev.licenses[productName],
            file: file,
          },
        },
      }))
    } else if (field === 'gstFile') {
      setFormData(prev => ({ ...prev, gstFile: file }))
    } else if (field === 'cancelledChequeFile') {
      setFormData(prev => ({ ...prev, cancelledChequeFile: file }))
    }
  }

  // Handle date changes
  const handleIssueDateChange = (date: Date | null, productName: string) => {
    if (date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)

      if (date > today) {
        toast.error("Issue date cannot be greater than today's date")
        return
      }
    }

    setFormData(prev => {
      const updatedLicenses = { ...prev.licenses }
      if (updatedLicenses[productName]) {
        updatedLicenses[productName] = {
          ...updatedLicenses[productName],
          issueDate: date,
        }
        if (updatedLicenses[productName].expiryDate) {
          updatedLicenses[productName].status = calculateLicenseStatus(
            date,
            updatedLicenses[productName].expiryDate
          )
        }
      }
      return { ...prev, licenses: updatedLicenses }
    })
  }

  const handleExpiryDateChange = (date: Date | null, productName: string) => {
    setFormData(prev => {
      const updatedLicenses = { ...prev.licenses }
      if (updatedLicenses[productName]) {
        updatedLicenses[productName] = {
          ...updatedLicenses[productName],
          expiryDate: date,
        }
        if (updatedLicenses[productName].issueDate) {
          updatedLicenses[productName].status = calculateLicenseStatus(
            updatedLicenses[productName].issueDate,
            date
          )
        }
      }
      return { ...prev, licenses: updatedLicenses }
    })
  }

  const handleFormDataUpdate = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

  // Input handlers with validation
  const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "")
    setFormData(prev => ({ ...prev, [field]: value }))    
  }

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => {
    let value = e.target.value.replace(/\D/g, "")
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength)
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'file') return // Handled separately

    // Handle nested license fields
    if (name.startsWith('licenseNumber-')) {
      const productName = name.replace('licenseNumber-', '')
      setFormData(prev => ({
        ...prev,
        licenses: {
          ...prev.licenses,
          [productName]: {
            ...prev.licenses[productName],
            number: value,
          },
        },
      }))
    } else if (name.startsWith('issuingAuthority-')) {
      const productName = name.replace('issuingAuthority-', '')
      setFormData(prev => ({
        ...prev,
        licenses: {
          ...prev.licenses,
          [productName]: {
            ...prev.licenses[productName],
            issuingAuthority: value,
          },
        },
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Company type handler
  const handleCompanyTypeChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0
    const selectedCompany = companyTypes.find(c => c.companyTypeId === selectedId)

    setFormData(prev => ({
      ...prev,
      companyTypeId: selectedId,
      companyType: selectedCompany?.companyTypeName || "",
    }))
  }

  // Seller type handler
  const handleSellerTypeChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0
    const selectedSeller = sellerTypes.find(s => s.sellerTypeId === selectedId)

    setFormData(prev => ({
      ...prev,
      sellerTypeId: selectedId,
      sellerType: selectedSeller?.sellerTypeName || "",
    }))
  }

  // State handler
  const handleStateChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0
    const selectedState = states.find(s => s.stateId === selectedId)

    setFormData(prev => ({
      ...prev,
      stateId: selectedId,
      state: selectedState?.stateName || "",
      districtId: 0,
      district: "",
      talukaId: 0,
      taluka: "",
    }))

    setDistricts([])
    setTalukas([])

    if (selectedId) {
      fetchDistrictsByState(selectedId)
    }
  }

  // District handler
  const handleDistrictChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0
    const selectedDistrict = districts.find(d => d.districtId === selectedId)

    setFormData(prev => ({
      ...prev,
      districtId: selectedId,
      district: selectedDistrict?.districtName || "",
      talukaId: 0,
      taluka: "",
    }))

    setTalukas([])

    if (selectedId) {
      fetchTalukasByDistrict(selectedId)
    }
  }

  // Taluka handler
  const handleTalukaChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0
    const selectedTaluka = talukas.find(t => t.talukaId === selectedId)

    setFormData(prev => ({
      ...prev,
      talukaId: selectedId,
      taluka: selectedTaluka?.talukaName || "",
    }))
  }

  // Bank State handler - mirrors handleStateChange (company address) but
  // writes to the bank-branch-specific fields/master lists.
  const handleBankStateChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0
    const selectedState = states.find(s => s.stateId === selectedId)

    setFormData(prev => ({
      ...prev,
      bankStateId: selectedId,
      bankState: selectedState?.stateName || "",
      bankDistrictId: 0,
      bankDistrict: "",
      bankTalukaId: 0,
      bankTaluka: "",
    }))

    setBankDistricts([])
    setBankTalukas([])

    if (selectedId) {
      fetchBankDistrictsByState(selectedId)
    }
  }

  const handleBankDistrictChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0
    const selectedDistrict = bankDistricts.find(d => d.districtId === selectedId)

    setFormData(prev => ({
      ...prev,
      bankDistrictId: selectedId,
      bankDistrict: selectedDistrict?.districtName || "",
      bankTalukaId: 0,
      bankTaluka: "",
    }))

    setBankTalukas([])

    if (selectedId) {
      fetchBankTalukasByDistrict(selectedId)
    }
  }

  const handleBankTalukaChange = (selected: any) => {
    const selectedId = selected ? parseInt(selected.value) : 0
    const selectedTaluka = bankTalukas.find(t => t.talukaId === selectedId)

    setFormData(prev => ({
      ...prev,
      bankTalukaId: selectedId,
      bankTaluka: selectedTaluka?.talukaName || "",
    }))
  }

  // Authorization letter handler (Coordinator step - required for all seller types)
  const handleAuthorizationLetterChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, authorizationLetterFile: file }))
  }

  // Agreement document handlers (seller-type-driven, keyed by documentTypeCode)
  const handleAgreementFileChange = (code: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [code]: {
          ...(prev.agreements[code] || { number: "", file: null, issueDate: null, expiryDate: null }),
          file,
        },
      },
    }))
  }

  const handleAgreementNumberChange = (code: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [code]: {
          ...(prev.agreements[code] || { number: "", file: null, issueDate: null, expiryDate: null }),
          number: value,
        },
      },
    }))
  }

  const handleAgreementIssueDateChange = (date: Date | null, code: string) => {
    setFormData(prev => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [code]: {
          ...(prev.agreements[code] || { number: "", file: null, issueDate: null, expiryDate: null }),
          issueDate: date,
        },
      },
    }))
  }

  const handleAgreementExpiryDateChange = (date: Date | null, code: string) => {
    setFormData(prev => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [code]: {
          ...(prev.agreements[code] || { number: "", file: null, issueDate: null, expiryDate: null }),
          expiryDate: date,
        },
      },
    }))
  }

  // Upload file function
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUrl = `https://storage.example.com/${folder}/${Date.now()}_${file.name}`
        resolve(mockUrl)
      }, 1500)
    })
  }

  // Step navigation and validation
  const nextStep = async () => {
    // Step 1 Validation
    if (step === 1) {
      try {
        // step1Schema's conditional Parent Manufacturer Name requirement keys
        // off `sellerTypeName`, while formData tracks the same value under
        // `sellerType` - map it across before validating.
        step1Schema.parse({ ...formData, sellerTypeName: formData.sellerType });
        // Check if company registration certificate is uploaded
        if (!formData.companyRegistrationCertificateFile) {
          toast.error("Please upload Company Registration Certificate");
          return;
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach(issue => toast.error(issue.message))
        } else {
          toast.error("Please fill all required company information fields.")
        }
        return
      }
    }

    // Step 2 Validation
    if (step === 2) {
      try {
        step2Schema.parse(formData)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach(issue => toast.error(issue.message))
        } else {
          toast.error("Please fill all coordinator details.")
        }
        return
      }

      // Check if email already exists
      if (formData.coordinatorEmail) {
        const emailExists = await checkCoordinatorEmailExists(formData.coordinatorEmail)
        if (emailExists) {
          toast.error("This email is already registered. Please use a different email address.")
          return
        }
      }

      // Check if phone already exists
      if (formData.coordinatorMobile) {
        const cleanPhone = formData.coordinatorMobile.replace(/\D/g, '')
        if (cleanPhone.length === 10) {
          const phoneExists = await checkCoordinatorPhoneExists(formData.coordinatorMobile)
          if (phoneExists) {
            toast.error("This phone number is already registered. Please use a different number.")
            return
          }
        }
      }
      return
    }

    // Step 3 Validation
    if (step === 3) {
      try {
        const licensesForValidation = Object.entries(formData.licenses).reduce((acc, [key, value]) => {
          acc[key] = {
            ...value,
            issueDate: value.issueDate ? value.issueDate.toISOString().split('T')[0] : '',
            expiryDate: value.expiryDate ? value.expiryDate.toISOString().split('T')[0] : '',
            file: value.file,
          }
          return acc
        }, {} as any)

        const agreementsForValidation = Object.entries(formData.agreements).reduce((acc, [key, value]: [string, any]) => {
          acc[key] = {
            ...value,
            issueDate: value.issueDate ? value.issueDate.toISOString().split('T')[0] : '',
            expiryDate: value.expiryDate ? value.expiryDate.toISOString().split('T')[0] : '',
            file: value.file,
          }
          return acc
        }, {} as any)

        const schema = step3Schema(formData.productTypes, formData.sellerType)
        schema.parse({
          gstNumber: formData.gstNumber,
          gstFile: formData.gstFile,
          licenses: licensesForValidation,
          agreements: agreementsForValidation,
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach(issue => toast.error(issue.message))
        } else {
          toast.error("Please fill all document fields.")
        }
        return
      }
    }

    // Step 4 Validation
    if (step === 4) {
      try {
        step4Schema.parse(formData)
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach(issue => toast.error(issue.message))
        } else {
          toast.error("Please fill all bank account details.")
        }
        return
      }
      if (ifscError) {
        toast.error("Please fix IFSC code error before proceeding.")
        return
      }
    }

    setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }
  const handleSubmit = async () => {
    setSubmitting(true);
    let tempSellerId: number | null = null;
    let tempSellerRequestId: string | null = null;

    try {
      // Generate placeholder URLs that will be replaced
      const placeholderUrl = "PENDING";

      // Build address object
      const address: TempSellerAddress = {
        stateId: formData.stateId,
        districtId: formData.districtId,
        talukaId: formData.talukaId,
        city: formData.city,
        street: formData.street,
        buildingNo: formData.buildingNo,
        landmark: formData.landmark || "",
        pinCode: formData.pincode,
      };

      // Build coordinator object
      const coordinator: TempSellerCoordinator = {
        name: formData.coordinatorName,
        designation: formData.coordinatorDesignation,
        email: formData.coordinatorEmail,
        mobile: formData.coordinatorMobile,
        // Same "PENDING" placeholder pattern used for gstFileUrl/bankDocumentFileUrl
        // below - the real URL is filled in once the upload step completes.
        authorizationLetterUrl: placeholderUrl,
      };

      // Build bank details WITH placeholder
      const bankDetails: TempSellerBankDetails = {
        bankName: formData.bankName,
        branch: formData.branch,
        ifscCode: formData.ifscCode,
        stateId: formData.bankStateId,
        districtId: formData.bankDistrictId,
        talukaId: formData.bankTalukaId,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        bankDocumentFileUrl: placeholderUrl,
      };

      // Prepare per-product license documents array WITH placeholder.
      // productTypeId alone identifies these rows server-side; documentTypeId
      // is intentionally omitted here (left undefined) — it's only required
      // for seller-level documents that have no product type (see agreements
      // below). The backend enforces "exactly one of productTypeId/
      // documentTypeId must be present" per document row.
      const licenseDocuments: TempSellerDocument[] = formData.productTypes.map((productName: string) => {
        const product = productTypes.find(p => p.productTypeName === productName);
        const license = formData.licenses[productName];

        return {
          productTypeId: product?.productTypeId,
          documentNumber: license?.number || "",
          documentFileUrl: placeholderUrl,
          licenseIssueDate: license?.issueDate ? license.issueDate.toISOString().split('T')[0] : undefined,
          licenseExpiryDate: license?.expiryDate ? license.expiryDate.toISOString().split('T')[0] : undefined,
          licenseIssuingAuthority: license?.issuingAuthority || "",
        };
      });

      // Seller-level agreement/compliance documents (Brand Owner/White Labeling/
      // Distribution/PCD Agreement, GMP/WHO-GMP Certificate, Trademark
      // Certificate, IEC Certificate, Import Licences) - no productTypeId,
      // documentTypeId is resolved from the /document-types master list by
      // matching code. Includes every code the user actually attached a file
      // for, not just the required ones — optional docs (e.g. Import Licence)
      // should still be submitted if the seller chose to provide them.
      const attachedAgreementCodes = Object.keys(formData.agreements || {});
      const agreementDocuments: TempSellerDocument[] = attachedAgreementCodes
        .filter((code) => formData.agreements[code]?.file)
        .map((code) => {
          const agreement = formData.agreements[code];
          const documentTypeId = documentTypes.find(dt => dt.documentTypeCode === code)?.documentTypeId;

          return {
            documentTypeId,
            documentNumber: agreement.number || "N/A",
            documentFileUrl: placeholderUrl,
            licenseIssueDate: agreement.issueDate ? agreement.issueDate.toISOString().split('T')[0] : undefined,
            licenseExpiryDate: agreement.expiryDate ? agreement.expiryDate.toISOString().split('T')[0] : undefined,
          };
        });

      const documents: TempSellerDocument[] = [...licenseDocuments, ...agreementDocuments];

      // Create the request WITH placeholders
      const request: TempSellerRequest = {
        sellerName: formData.sellerName,
        productTypeId: formData.productTypeIds,
        companyTypeId: formData.companyTypeId,
        sellerTypeId: formData.sellerTypeId,
        phone: formData.phone,
        email: formData.email,
        termsAccepted: true,
        website: formData.website || undefined,
        parentManufacturerName: formData.parentManufacturerName || undefined,
        brandOwnerName: formData.brandOwnerName || undefined,
        address,
        coordinator,
        bankDetails,
        gstNumber: formData.gstNumber,
        gstFileUrl: placeholderUrl,
        companyRegistrationCertificateUrl: placeholderUrl,
        documents,
      };

      // STEP 1: Create temp seller with placeholder URLs
      console.log("📡 Step 1: Creating temp seller...");
      const response = await sellerRegService.createTempSeller(request);
      console.log("✅ Temp seller created:", response);

      tempSellerId = response.tempSellerId;
      tempSellerRequestId = response.sellerRequestId;

      // STEP 2: Fetch the created temp seller details to get document IDs
      console.log(`📡 Step 2: Fetching temp seller details to get document IDs...`);
      const tempSellerDetails = await sellerRegService.getTempSellerById(tempSellerId);
      console.log("✅ Temp seller details:", tempSellerDetails);

      // STEP 3: Upload actual documents using the tempSellerId and document IDs
      console.log(`📡 Step 3: Uploading documents for temp seller ID: ${tempSellerId}`);

      // Prepare license files in correct order
      const licensesPayload = uploadSellerRegDocService.prepareLicenseFiles(
        formData.licenses,
        tempSellerDetails.documents || []
      );

      // Agreement documents are uploaded through the SAME licenseFiles/
      // licenseNames/documentIds convention as per-product licenses (the
      // backend attaches by documentId regardless of licence vs. agreement).
      const documentTypeIdByCode: Record<string, number> = {};
      documentTypes.forEach(dt => { documentTypeIdByCode[dt.documentTypeCode] = dt.documentTypeId; });
      const agreementsPayload = uploadSellerRegDocService.prepareAgreementFiles(
        formData.agreements,
        tempSellerDetails.documents || [],
        documentTypeIdByCode
      );
      const combinedLicensesPayload = [...licensesPayload, ...agreementsPayload];

      try {
        // Attempt document upload
        const uploadResponse = await uploadSellerRegDocService.uploadDocuments(tempSellerId, {
          sellerImage: undefined,
          gstFile: formData.gstFile || undefined,
          bankFile: formData.cancelledChequeFile || undefined,
          licenses: combinedLicensesPayload.length > 0 ? combinedLicensesPayload : undefined,
          companyRegistrationCertificate: formData.companyRegistrationCertificateFile || undefined,
          authorizationLetter: formData.authorizationLetterFile || undefined,
        });

        console.log("✅ Documents uploaded successfully:", uploadResponse);

        // Set application ID and show success modal
        setApplicationId(tempSellerRequestId);
        setShowSuccessModal(true);
        toast.success("Application submitted successfully!");

      } catch (uploadError) {
        // Document upload failed - clean up by deleting the temp seller
        console.error("❌ Document upload failed:", uploadError);

        // Show specific error message to user
        let errorMessage = "Document upload failed. ";

        if (uploadError instanceof Error) {
          if (uploadError.message.includes("file size")) {
            errorMessage = "File size exceeds limit (max 5MB). ";
          } else if (uploadError.message.includes("file type")) {
            errorMessage = "Invalid file type. Please upload PDF, JPG, JPEG, or PNG files. ";
          } else {
            errorMessage += uploadError.message;
          }
        }

        toast.error(errorMessage + "Your application could not be completed. Please try again.");

        // Delete the incomplete temp seller record
        if (tempSellerId) {
          toast.info("Please Try Again");
          await uploadSellerRegDocService.deleteTempSeller(tempSellerId);
          toast.info("Please Try Again");
        }

        // Re-throw to be caught by outer catch
        throw new Error(errorMessage + "Please try again.");
      }

    } catch (error) {
      console.error("Registration failed:", error);

      // If error occurred before document upload or during cleanup
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Submission failed. Please try again.");
      }

      if (tempSellerId && !showSuccessModal) {
        try {
          await uploadSellerRegDocService.deleteTempSeller(tempSellerId);
          console.log("✅ Cleaned up incomplete registration");
        } catch (cleanupError) {
          console.error("Cleanup failed:", cleanupError);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };
  // Logging in from the "Already have an account?" link doesn't mean the
  // wizard should just unlock at step 1 — an existing seller with an
  // approved profile should land on the dashboard, not Company Details.
  const handleLoginSuccess = async () => {
    try {
      await sellerProfileService.getCurrentSellerProfile()
      router.push("/seller_7a3b9f2c/dashboard")
    } catch (error: any) {
      if (error?.message === "Seller profile not found") {
        setIsAuthenticated(true)
      } else {
        console.error("Error checking seller profile after login:", error)
        toast.error("Unable to verify your account status. Please try logging in again.")
      }
    }
  }

  const handleEdit = (section: string) => {
    switch (section) {
      case 'company': setStep(1); break
      case 'coordinator': setStep(2); break
      case 'documents': setStep(3); break
      case 'bank': setStep(4); break
    }
  }

  if (!authChecked) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4">
        <SignupForm onOpenLogin={() => setShowLoginModal(true)} />
        <LoginModals
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <SellerRegistrationLayout step={step}>
        {step === 1 && (
          <CompanyForm
            formData={formData}
            onCompanyRegFileChange={handleCompanyRegFileChange}
            companyTypes={companyTypes}
            sellerTypes={sellerTypes}
            productTypes={productTypes}
            states={states}
            districts={districts}
            talukas={talukas}
            loadingStates={loadingStates}
            isProductDropdownOpen={isProductDropdownOpen}
            productDropdownRef={productDropdownRef}
            onCompanyTypeChange={handleCompanyTypeChange}
            onSellerTypeChange={handleSellerTypeChange}
            onStateChange={handleStateChange}
            onDistrictChange={handleDistrictChange}
            onTalukaChange={handleTalukaChange}
            onProductToggle={handleProductTypeToggle}
            onSelectAll={handleSelectAllProductTypes}
            onAlphabetInput={handleAlphabetInput}
            onNumericInput={handleNumericInput}
            onChange={handleChange}
            setIsProductDropdownOpen={setIsProductDropdownOpen}
            prevStep={prevStep}
            nextStep={nextStep}
          />
        )}

        {step === 2 && (
          <CoordinatorForm
            formData={formData}
            isCheckingEmail={isCheckingEmail}
            isCheckingPhone={isCheckingPhone}
            emailExistsError={emailExistsError}
            phoneExistsError={phoneExistsError}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            onEmailChange={async (email) => {
              setFormData(prev => ({ ...prev, coordinatorEmail: email }))
              if (email && email.includes('@') && email.includes('.')) {
                await checkCoordinatorEmailExists(email)
              } else {
                setEmailExistsError("")
              }
              if (emailVerified) {
                setEmailVerified(false)
              }
            }}
            onPhoneChange={async (phone) => {
              setFormData(prev => ({ ...prev, coordinatorMobile: phone }))
              const cleanPhone = phone.replace(/\D/g, '')
              if (cleanPhone.length === 10) {
                await checkCoordinatorPhoneExists(phone)
              } else {
                setPhoneExistsError("")
              }
              if (phoneVerified) {
                setPhoneVerified(false)
              }
            }}
            onEmailVerified={() => setEmailVerified(true)}
            onPhoneVerified={() => setPhoneVerified(true)}
            onAlphabetInput={handleAlphabetInput}
            onAuthorizationLetterChange={handleAuthorizationLetterChange}
            prevStep={prevStep}
            nextStep={() => setStep(3)}
          />
        )}

        {step === 3 && (

          <DocumentForm
            formData={formData}
            productTypes={productTypes}
            onGSTChange={handleGSTChange}
            onFileChange={handleFileChange}
            onIssueDateChange={handleIssueDateChange}
            onExpiryDateChange={handleExpiryDateChange}
            onLicenseNumberChange={handleChange}
            onIssuingAuthorityChange={handleChange}
            onClearLicenseNumber={(productName: string) => {
              setFormData(prev => ({
                ...prev,
                licenses: {
                  ...prev.licenses,
                  [productName]: {
                    ...prev.licenses[productName],
                    number: ""
                  }
                }
              }));
            }}
            onAgreementNumberChange={handleAgreementNumberChange}
            onAgreementFileChange={handleAgreementFileChange}
            onAgreementIssueDateChange={handleAgreementIssueDateChange}
            onAgreementExpiryDateChange={handleAgreementExpiryDateChange}
            prevStep={prevStep}
            nextStep={nextStep}
          />

          // this is without warning pop up in license......
          // <DocumentForm
          //   formData={formData}
          //   productTypes={productTypes}
          //   onGSTChange={handleGSTChange}
          //   onFileChange={handleFileChange}
          //   onIssueDateChange={handleIssueDateChange}
          //   onExpiryDateChange={handleExpiryDateChange}
          //   onLicenseNumberChange={handleChange}
          //   onIssuingAuthorityChange={handleChange}
          //   prevStep={prevStep}
          //   nextStep={nextStep}
          // />
        )}

        {step === 4 && (
          <BankForm
            formData={formData}
            ifscError={ifscError}
            states={states}
            bankDistricts={bankDistricts}
            bankTalukas={bankTalukas}
            loadingStates={loadingStates}
            onIfscChange={handleIfscChange}
            onFileChange={handleFileChange}
            onAlphabetInput={handleAlphabetInput}
            onNumericInput={handleNumericInput}
            onChange={handleChange}
            onCheckAccountMatch={() => formData.accountNumber === formData.confirmAccountNumber}
            onUpdateFormData={handleFormDataUpdate}
            onBankStateChange={handleBankStateChange}
            onBankDistrictChange={handleBankDistrictChange}
            onBankTalukaChange={handleBankTalukaChange}
            prevStep={prevStep}
            nextStep={nextStep}
          />
        )}

        {step === 5 && (
          <ReviewForm
            formData={formData}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            submitting={submitting}
            prevStep={prevStep}
          />
        )}
      </SellerRegistrationLayout>

      <SuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          router.push("/")
        }}
        applicationId={applicationId}
        email={formData.coordinatorEmail}
      />
    </LocalizationProvider>
  )
}
