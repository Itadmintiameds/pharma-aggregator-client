"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { z } from "zod"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"

import CompanyForm from "./CompanyForm"
import CoordinatorForm from "./CoordinatorForm"
import DocumentForm from "./DocumentForm"
import BankForm from "./BankForm"
import ReviewForm from "./ReviewForm"
import SuccessModal from "./SuccessModal"
import SellerRegistrationLayout from "./SellerRegistrationLayout"

// Import services and types from old version
import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService"
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService"
import { fetchBankDetails } from "@/src/services/seller/IFSCService"
import { ifscSchema } from "@/src/schema/seller/IFSCSchema"
import { step1Schema, step2Schema, step3Schema, step4Schema } from "@/src/schema/seller/sellerRegSchema"
import {
  CompanyTypeResponse,
  SellerTypeResponse,
  ProductTypeResponse,
  StateResponse,
  DistrictResponse,
  TalukaResponse,
} from "@/src/types/seller/SellerRegMasterData"
import {
  TempSellerRequest,
  TempSellerDocument,
  TempSellerBankDetails,
  TempSellerAddress,
  TempSellerCoordinator,
} from "@/src/types/seller/sellerRegistrationData"

export default function SellerRegistration() {
  const router = useRouter()
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

  // Loading States
  const [loadingStates, setLoadingStates] = useState({
    companyTypes: true,
    sellerTypes: true,
    productTypes: true,
    states: true,
    districts: false,
    talukas: false,
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
    confirmAccountNumber: "",
    cancelledChequeFile: null as File | null,
  })

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

  // IFSC handler with auto-fill
  const handleIfscChange = async (value: string) => {
    const ifsc = value.toUpperCase()
    setFormData(prev => ({ ...prev, ifscCode: ifsc }))
    setIfscError("")

    if (ifsc.length !== 11) {
      setFormData(prev => ({
        ...prev,
        bankName: "",
        branch: "",
        bankState: "",
        bankDistrict: "",
      }))
      return
    }

    const parseResult = ifscSchema.safeParse(ifsc)
    if (!parseResult.success) {
      setIfscError(parseResult.error.issues[0].message)
      setFormData(prev => ({
        ...prev,
        bankName: "",
        branch: "",
        bankState: "",
        bankDistrict: "",
      }))
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
    } catch {
      setIfscError("Invalid IFSC Code")
      setFormData(prev => ({
        ...prev,
        bankName: "",
        branch: "",
        bankState: "",
        bankDistrict: "",
      }))
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

  // Upload file function
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    // TODO: Replace with actual file upload API call
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
        step1Schema.parse(formData)
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
      
      // if (!emailVerified || !phoneVerified) {
      //   toast.warning("Please verify both Email and Mobile OTP before proceeding.")
      //   return
      // }

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

        const schema = step3Schema(formData.productTypes)
        schema.parse({
          gstNumber: formData.gstNumber,
          gstFile: formData.gstFile,
          licenses: licensesForValidation,
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
    setSubmitting(true)
    try {
      // Upload GST file
      let gstFileUrl = ""
      if (formData.gstFile) {
        gstFileUrl = await uploadFile(formData.gstFile, "gst-certificates")
      }

      // Upload license files and prepare documents array
      const documents: TempSellerDocument[] = []
      
      for (const productName of formData.productTypes) {
        const product = productTypes.find(p => p.productTypeName === productName)
        if (!product) continue

        const license = formData.licenses[productName]
        let docFileUrl = ""
        if (license?.file) {
          docFileUrl = await uploadFile(license.file, "licenses")
        }

        const licenseIssueDate = license?.issueDate 
          ? license.issueDate.toISOString().split('T')[0] 
          : undefined
        
        const licenseExpiryDate = license?.expiryDate 
          ? license.expiryDate.toISOString().split('T')[0] 
          : undefined

        documents.push({
          productTypeId: product.productTypeId,
          documentNumber: license?.number || "",
          documentFileUrl: docFileUrl,
          licenseIssueDate: licenseIssueDate,
          licenseExpiryDate: licenseExpiryDate,
          licenseIssuingAuthority: license?.issuingAuthority || "",
        })
      }

      // Upload cancelled cheque
      let bankDocumentFileUrl = ""
      if (formData.cancelledChequeFile) {
        bankDocumentFileUrl = await uploadFile(
          formData.cancelledChequeFile,
          "bank-documents"
        )
      }

      // Build request objects
      const address: TempSellerAddress = {
        stateId: formData.stateId,
        districtId: formData.districtId,
        talukaId: formData.talukaId,
        city: formData.city,
        street: formData.street,
        buildingNo: formData.buildingNo,
        landmark: formData.landmark || "",
        pinCode: formData.pincode,
      }

      const coordinator: TempSellerCoordinator = {
        name: formData.coordinatorName,
        designation: formData.coordinatorDesignation,
        email: formData.coordinatorEmail,
        mobile: formData.coordinatorMobile,
      }

      const bankDetails: TempSellerBankDetails = {
        bankName: formData.bankName,
        branch: formData.branch,
        ifscCode: formData.ifscCode,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        bankDocumentFileUrl,
      }

      // Create the request according to API structure
      const request: TempSellerRequest = {
        sellerName: formData.sellerName,
        productTypeId: formData.productTypeIds,
        companyTypeId: formData.companyTypeId,
        sellerTypeId: formData.sellerTypeId,
        phone: formData.phone,
        email: formData.email,
        termsAccepted: true,
        website: formData.website || undefined,
        address,
        coordinator,
        bankDetails,
        gstNumber: formData.gstNumber,
        gstFileUrl: gstFileUrl,
        documents,
      }

      const response = await sellerRegService.createTempSeller(request)
      setApplicationId(response.sellerRequestId)
      setShowSuccessModal(true)
      toast.success("Application submitted successfully!")
    } catch (error) {
      console.error("Registration failed:", error)
      toast.error("Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (section: string) => {
    switch(section) {
      case 'company': setStep(1); break
      case 'coordinator': setStep(2); break
      case 'documents': setStep(3); break
      case 'bank': setStep(4); break
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <SellerRegistrationLayout step={step}>
        {step === 1 && (
          <CompanyForm
            formData={formData}
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
    onEmailChange={async (email) => {
      setFormData(prev => ({ ...prev, coordinatorEmail: email }))
      if (email && email.includes('@') && email.includes('.')) {
        await checkCoordinatorEmailExists(email)
      } else {
        setEmailExistsError("")
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
    }}
    onAlphabetInput={handleAlphabetInput}
    prevStep={prevStep}
    onOTPSuccess={() => setStep(3)}
  />
)}

        {/* {step === 2 && (
          <CoordinatorForm
            formData={formData}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            isCheckingEmail={isCheckingEmail}
            isCheckingPhone={isCheckingPhone}
            emailExistsError={emailExistsError}
            phoneExistsError={phoneExistsError}
            onEmailVerify={() => setEmailVerified(true)}
            onPhoneVerify={() => setPhoneVerified(true)}
            onEmailChange={async (email) => {
              setFormData(prev => ({ ...prev, coordinatorEmail: email }))
              if (emailVerified) setEmailVerified(false)
              if (email && email.includes('@') && email.includes('.')) {
                await checkCoordinatorEmailExists(email)
              } else {
                setEmailExistsError("")
              }
            }}
            onPhoneChange={async (phone) => {
              setFormData(prev => ({ ...prev, coordinatorMobile: phone }))
              if (phoneVerified) setPhoneVerified(false)
              const cleanPhone = phone.replace(/\D/g, '')
              if (cleanPhone.length === 10) {
                await checkCoordinatorPhoneExists(phone)
              } else {
                setPhoneExistsError("")
              }
            }}
            onAlphabetInput={handleAlphabetInput}
            onChange={handleChange}
            prevStep={prevStep}
            nextStep={nextStep}
          />
        )} */}

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
            prevStep={prevStep}
            nextStep={nextStep}
          />
        )}

        {step === 4 && (
          <BankForm
            formData={formData}
            ifscError={ifscError}
            onIfscChange={handleIfscChange}
            onFileChange={handleFileChange}
            onAlphabetInput={handleAlphabetInput}
            onNumericInput={handleNumericInput}
            onChange={handleChange}
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

