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
import SaveBeforeLogoutModal from "./SaveBeforeLogoutModal";
import SignupForm from "./SignupForm";
import LoginModals from "@/src/app/modals/LoginModals/LoginModals";
import { uploadSellerRegDocService, LicenseFileItem } from "@/src/services/seller/UploadSellerRegDoc";
import SellerRegistrationLayout from "./SellerRegistrationLayout"
import { sellerRegMasterService } from "@/src/services/seller/SellerRegMasterService"
import { sellerRegService } from "@/src/services/seller/sellerRegistrationService"
import { sellerAuthService } from "@/src/services/seller/authService"
import { sellerProfileService } from "@/src/services/seller/sellerProfileService"
import { fetchBankDetails } from "@/src/services/seller/IFSCService"
import { ifscSchema } from "@/src/schema/seller/IFSCSchema"
import { step1Schema, step2Schema, step3Schema, step4Schema } from "@/src/schema/seller/sellerRegSchema"
import { CompanyTypeResponse, SellerTypeResponse, ProductTypeResponse, StateResponse, DistrictResponse, TalukaResponse, DocumentTypeResponse, } from "@/src/types/seller/SellerRegMasterData"
import { TempSellerRequest, TempSellerDocument, TempSellerBankDetails, TempSellerAddress, TempSellerCoordinator, TempSellerDraftRequest } from "@/src/types/seller/sellerRegistrationData"
import { isRealFileUrl } from "@/src/utils/sellerRegFiles"
import LogoutConfirmationModal from "@/src/app/seller_7a3b9f2c/dashboard/components/LogoutConfirmationModal"

// GET /temp-sellers/user/{userId} returns the raw TempSeller JPA entity, not
// a flat DTO — every master reference (state/district/taluka/companyType/
// sellerType/productType/documentType) comes back as a nested object (e.g.
// address.state.stateName, not address.stateName). These interfaces describe
// only the fields this file actually reads back into formData.
interface DraftDocumentRow {
  // Present (non-null) for a per-product license row; the placeholder
  // seller-level product type is used for agreements, so distinguish by
  // documentType instead (see TempSellerServiceImpl#documentKey).
  productTypes?: { productTypeId?: number; productTypeName?: string };
  documentType?: { documentTypeId?: number; documentTypeCode?: string; documentTypeName?: string };
  documentNumber?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseIssuingAuthority?: string;
  // The raw entity's document row id - needed to call the per-document
  // delete endpoint (DELETE /temp-sellers/{id}/documents/{documentId}/file).
  DocumentsId?: number;
  documentFileUrl?: string;
  documentFileName?: string;
}

interface SellerRegistrationProps {
  // Set when rendered inside the dashboard's onboarding gate rather than the
  // standalone marketing page: suppresses this wizard's own 5-step sidebar
  // (the gate renders its own 3-point stepper instead) and, on submit,
  // hands control back to the gate instead of navigating away.
  embedded?: boolean
  onSubmitted?: () => void
  // Called by the very first step's "Back" button when embedded, since
  // there's no earlier wizard step for it to fall back to (see CompanyForm).
  onExitToIntro?: () => void
}

export default function SellerRegistration({ embedded = false, onSubmitted, onExitToIntro }: SellerRegistrationProps = {}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  // Gates rendering the wizard's inputs until the draft-resume fetch below
  // has settled (success, 404, or error) - otherwise a seller who starts
  // typing before that (necessarily async) fetch resolves can have their
  // fresh edit silently overwritten moments later when the fetch's
  // setFormData call finally lands with the OLDER, pre-edit server value.
  const [resumeChecked, setResumeChecked] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [step, setStep] = useState(1)
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [applicationId, setApplicationId] = useState("")
  const [ifscError, setIfscError] = useState("")
  // Per-field inline validation errors for steps 1/2/4 (zod issue.path[0] -> message).
  // Cleared wholesale at the start of each step's nextStep() validation attempt,
  // and per-field whenever the user edits that specific field.
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})
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

  // Draft support: when a temp seller row already exists for this user (either
  // resumed on mount or created by an earlier "Save Draft" click this session),
  // subsequent saves PUT to it instead of POSTing a new one, and final submit
  // finalizes it instead of creating a brand-new temp seller.
  const [tempSellerId, setTempSellerId] = useState<number | null>(null)

  // Save-before-logout prompt: Header.tsx has no access to this component's
  // formData/handleSaveDraft, so it dispatches this event instead of logging
  // out directly whenever Logout is clicked on the wizard page - see the
  // listener effect below.
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOutSaving, setLoggingOutSaving] = useState(false)
  // Shown instead when there's nothing unsaved to offer saving - a plain
  // "are you sure?" rather than the 3-option save prompt above.
  const [showPlainLogoutConfirm, setShowPlainLogoutConfirm] = useState(false)

  // Snapshot of the draft payload as of the last successful save (or the
  // freshly-resumed state) - "unsaved changes" is decided by comparing the
  // CURRENT payload's content against this, not by "did formData change at
  // all". A blanket "any setFormData call means dirty" check is wrong: e.g.
  // retyping the exact same text into a field still fires onChange/
  // setFormData, but produces no actual content difference and shouldn't
  // trigger a save prompt. A ref, not state, since the logout-request
  // listener below is registered once on mount and needs to read the
  // LATEST snapshot at click time without needing to re-subscribe.
  const lastSavedPayloadRef = useRef<string>("")
  // Set to true immediately before a setFormData call that represents newly
  // LOADED (not edited) state - resuming a draft - so the effect below can
  // re-baseline the snapshot to the freshly-resumed content once it lands,
  // rather than comparing against the pre-resume (usually blank) baseline.
  // Starts true so the very first snapshot (the initial blank form, before
  // any resume or edit) is captured too.
  const pendingResumeSnapshotRef = useRef(true)

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
    authorizationLetterUrl: "",
    authorizationLetterFileName: "",

    // GST
    gstNumber: "",
    gstFile: null as File | null,
    gstFileUrl: "",
    gstFileName: "",

    // company registration certificate
    companyRegistrationCertificateFile: null as File | null,
    companyRegistrationCertificateUrl: "",
    companyRegistrationCertificateFileName: "",

    // Licenses per product
    licenses: {} as Record<string, {
      number: string;
      file: File | null;
      fileUrl?: string;
      fileName?: string;
      // Real TempSellerDocument row id, needed to call the per-document
      // delete-file endpoint once a license file has actually been uploaded.
      documentId?: number;
      issueDate: Date | null;
      expiryDate: Date | null;
      issuingAuthority: string;
      status: 'Active' | 'Expired';
    }>,

    // Seller-type-driven agreement documents, keyed by documentTypeCode
    agreements: {} as Record<string, {
      number: string;
      file: File | null;
      fileUrl?: string;
      fileName?: string;
      documentId?: number;
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
    cancelledChequeUrl: "",
    cancelledChequeFileName: "",
  })

  useEffect(() => {
    if (pendingResumeSnapshotRef.current) {
      pendingResumeSnapshotRef.current = false
      lastSavedPayloadRef.current = JSON.stringify(buildDraftPayload())
    }
  }, [formData])

  // Registration now requires a login (created via the signup-first flow) —
  // check once on mount so returning users skip straight to the wizard.
  useEffect(() => {
    setIsAuthenticated(sellerAuthService.isAuthenticated())
    setAuthChecked(true)
  }, [])

  // Header.tsx dispatches this instead of logging out directly when Logout
  // is clicked while on this page - see handleLogout in Header.tsx.
  useEffect(() => {
    const handleLogoutRequest = () => {
      // Compare the CURRENT draft payload's actual content against the
      // last-saved snapshot - not just "did some setFormData call happen" -
      // so retyping the same value (or a save-triggered sync) never counts
      // as an unsaved change.
      const hasUnsavedChanges = JSON.stringify(buildDraftPayload()) !== lastSavedPayloadRef.current
      if (!hasUnsavedChanges) {
        // Nothing unsaved - there's nothing to offer saving, but still
        // confirm the logout itself rather than acting on a single click
        // with zero confirmation.
        setShowPlainLogoutConfirm(true)
        return
      }
      setShowLogoutModal(true)
    }
    window.addEventListener("seller-wizard-logout-request", handleLogoutRequest)
    return () => window.removeEventListener("seller-wizard-logout-request", handleLogoutRequest)
  }, [])

  // Resume an in-progress draft (if one exists) so a returning seller doesn't
  // have to retype everything. GET /temp-sellers/user/{userId} 404s when the
  // user has never started a registration - that's the normal "nothing to
  // resume" case, not an error, so it's swallowed silently.
  useEffect(() => {
    const resumeDraft = async () => {
      try {
        // getUserIdFromToken() reads a "token" localStorage key that this app
        // never actually writes (real key is "accessToken", set by
        // authService.ts) — it always returns null. sellerAuthService's
        // getCurrentUser() reads the "user" key that IS reliably set on
        // login, and is the same source SellerJourney.tsx already uses.
        const userId = sellerAuthService.getCurrentUser()?.userId
        if (!userId) return

        const row = await sellerRegService.getTempSellerByUserId(userId)
        if (!row || typeof row.status !== "string" || row.status.toUpperCase() !== "DRAFT") {
          return
        }

        setTempSellerId(row.tempSellerId ?? null)

        // productTypes comes back as an array of full ProductTypeMaster
        // objects ({productTypeId, productTypeName, ...}), not parallel
        // id/name arrays.
        const draftProductTypes: Array<{ productTypeId?: number; productTypeName?: string }> =
          Array.isArray(row.productTypes) ? row.productTypes : []

        // This is loading already-saved state, not a new edit - re-baseline
        // the "last saved" snapshot to this resumed content once it lands,
        // instead of comparing future edits against the pre-resume (blank) state.
        pendingResumeSnapshotRef.current = true
        setFormData(prev => ({
          ...prev,
          companyTypeId: row.companyType?.companyTypeId ?? prev.companyTypeId,
          sellerTypeId: row.sellerType?.sellerTypeId ?? prev.sellerTypeId,
          productTypeIds: draftProductTypes.length
            ? draftProductTypes.map(pt => pt.productTypeId).filter((id): id is number => id != null)
            : prev.productTypeIds,
          sellerName: row.sellerName ?? prev.sellerName,
          companyType: row.companyType?.companyTypeName ?? prev.companyType,
          sellerType: row.sellerType?.sellerTypeName ?? prev.sellerType,
          productTypes: draftProductTypes.length
            ? draftProductTypes.map(pt => pt.productTypeName).filter((name): name is string => !!name)
            : prev.productTypes,
          parentManufacturerName: row.parentManufacturerName ?? prev.parentManufacturerName,
          brandOwnerName: row.brandOwnerName ?? prev.brandOwnerName,

          stateId: row.address?.state?.stateId ?? prev.stateId,
          districtId: row.address?.district?.districtId ?? prev.districtId,
          talukaId: row.address?.taluka?.talukaId ?? prev.talukaId,
          state: row.address?.state?.stateName ?? prev.state,
          district: row.address?.district?.districtName ?? prev.district,
          taluka: row.address?.taluka?.talukaName ?? prev.taluka,
          city: row.address?.city ?? prev.city,
          street: row.address?.street ?? prev.street,
          buildingNo: row.address?.buildingNo ?? prev.buildingNo,
          landmark: row.address?.landmark ?? prev.landmark,
          pincode: row.address?.pinCode ?? prev.pincode,

          phone: row.phone ?? prev.phone,
          email: row.email ?? prev.email,
          website: row.website ?? prev.website,

          coordinatorName: row.coordinator?.name ?? prev.coordinatorName,
          coordinatorDesignation: row.coordinator?.designation ?? prev.coordinatorDesignation,
          coordinatorEmail: row.coordinator?.email ?? prev.coordinatorEmail,
          coordinatorMobile: row.coordinator?.mobile ?? prev.coordinatorMobile,
          // Files themselves are never part of a draft — authorizationLetterFile,
          // gstFile, companyRegistrationCertificateFile, cancelledChequeFile,
          // and every license/agreement `file` stay null/untouched here.
          // Their already-uploaded *Url counterparts ARE restored below (when
          // real, i.e. not the backend's "PENDING" placeholder) so the forms
          // can render the "already uploaded — View / Delete" branch instead
          // of the empty upload prompt.
          companyRegistrationCertificateUrl: isRealFileUrl(row.companyRegistrationCertificateUrl)
            ? row.companyRegistrationCertificateUrl
            : prev.companyRegistrationCertificateUrl,
          companyRegistrationCertificateFileName: row.companyRegistrationCertificateFileName ?? prev.companyRegistrationCertificateFileName,
          gstFileUrl: isRealFileUrl(row.gstFileUrl) ? row.gstFileUrl : prev.gstFileUrl,
          gstFileName: row.gstFileName ?? prev.gstFileName,
          authorizationLetterUrl: isRealFileUrl(row.coordinator?.authorizationLetterUrl)
            ? row.coordinator.authorizationLetterUrl
            : prev.authorizationLetterUrl,
          authorizationLetterFileName: row.coordinator?.authorizationLetterFileName ?? prev.authorizationLetterFileName,
          cancelledChequeUrl: isRealFileUrl(row.bankDetails?.bankDocumentFileUrl)
            ? row.bankDetails.bankDocumentFileUrl
            : prev.cancelledChequeUrl,
          cancelledChequeFileName: row.bankDetails?.bankDocumentFileName ?? prev.cancelledChequeFileName,

          gstNumber: row.gstNumber ?? prev.gstNumber,

          bankName: row.bankDetails?.bankName ?? prev.bankName,
          branch: row.bankDetails?.branch ?? prev.branch,
          ifscCode: row.bankDetails?.ifscCode ?? prev.ifscCode,
          bankStateId: row.bankDetails?.state?.stateId ?? prev.bankStateId,
          bankDistrictId: row.bankDetails?.district?.districtId ?? prev.bankDistrictId,
          bankTalukaId: row.bankDetails?.taluka?.talukaId ?? prev.bankTalukaId,
          bankState: row.bankDetails?.state?.stateName ?? prev.bankState,
          bankDistrict: row.bankDetails?.district?.districtName ?? prev.bankDistrict,
          bankTaluka: row.bankDetails?.taluka?.talukaName ?? prev.bankTaluka,
          accountNumber: row.bankDetails?.accountNumber ?? prev.accountNumber,
          accountHolderName: row.bankDetails?.accountHolderName ?? prev.accountHolderName,
          confirmAccountNumber: row.bankDetails?.accountNumber ?? prev.confirmAccountNumber,
        }))

        // formData.districtId/talukaId (and the bank equivalents) are now set,
        // but the `districts`/`talukas` dropdown OPTION LISTS are separate
        // state arrays that only ever get populated by the cascading
        // fetch*ByState/District functions the manual dropdown onChange
        // handlers call — restoring the ids alone leaves those lists empty,
        // so the district/taluka selects render with no matching <option>
        // and look blank even though the underlying id is correct. Trigger
        // the same fetches here so the resumed selection actually renders.
        const resumedStateId = row.address?.state?.stateId
        const resumedDistrictId = row.address?.district?.districtId
        const resumedBankStateId = row.bankDetails?.state?.stateId
        const resumedBankDistrictId = row.bankDetails?.district?.districtId

        if (resumedStateId) await fetchDistrictsByState(resumedStateId)
        if (resumedDistrictId) await fetchTalukasByDistrict(resumedDistrictId)
        if (resumedBankStateId) await fetchBankDistrictsByState(resumedBankStateId)
        if (resumedBankDistrictId) await fetchBankTalukasByDistrict(resumedBankDistrictId)

        // Best-effort restore of per-product license metadata (number/dates/
        // issuing authority) from the draft's saved documents, keyed by the
        // product type name the same way formData.licenses is keyed elsewhere.
        // A row with a documentType is a seller-level agreement (its
        // productTypes is only the reserved placeholder); otherwise it's a
        // per-product license — see TempSellerServiceImpl#documentKey.
        if (Array.isArray(row.documents) && row.documents.length > 0) {
          const draftDocuments: DraftDocumentRow[] = row.documents
          pendingResumeSnapshotRef.current = true
          setFormData(prev => {
            const licenses = { ...prev.licenses }
            const agreements = { ...prev.agreements }

            draftDocuments.forEach((doc) => {
              if (doc.documentType?.documentTypeCode) {
                agreements[doc.documentType.documentTypeCode] = {
                  number: doc.documentNumber || "",
                  file: null,
                  ...(isRealFileUrl(doc.documentFileUrl) && {
                    fileUrl: doc.documentFileUrl,
                    documentId: doc.DocumentsId,
                    fileName: doc.documentFileName,
                  }),
                  issueDate: doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null,
                  expiryDate: doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null,
                }
              } else if (doc.productTypes?.productTypeName) {
                licenses[doc.productTypes.productTypeName] = {
                  number: doc.documentNumber || "",
                  file: null,
                  ...(isRealFileUrl(doc.documentFileUrl) && {
                    fileUrl: doc.documentFileUrl,
                    documentId: doc.DocumentsId,
                    fileName: doc.documentFileName,
                  }),
                  issueDate: doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null,
                  expiryDate: doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null,
                  issuingAuthority: doc.licenseIssuingAuthority || "",
                  status: calculateLicenseStatus(
                    doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null,
                    doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null
                  ),
                }
              }
            })

            return { ...prev, licenses, agreements }
          })
        }
      } catch (error) {
        // 404 just means no draft/temp seller exists yet for this user - stay
        // on step 1 blank, matching today's default behavior.
        console.log("ℹ️ No draft to resume (or resume check failed):", error)
      } finally {
        // Always unblock rendering - whether a draft was found, there was
        // none (404), the user isn't logged in yet, or the fetch errored.
        setResumeChecked(true)
      }
    }

    resumeDraft()
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

  // Clears a single field's inline stepErrors entry (steps 1/2/4 only) - called
  // from every input handler that touches a step1/2/4 schema field, so the
  // error disappears as soon as the user starts correcting it rather than
  // waiting for the next Continue click.
  const clearStepError = (field: string) => {
    setStepErrors(prev => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
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
    clearStepError("ifscCode")

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
      setIfscError("Please enter valid IFSC code")
      clearBankLookupFields()
      toast.error("Please enter valid IFSC code")
    }
  }

  // Catches the "typed 10 chars then tabbed away" gap — handleIfscChange only
  // flags incomplete input silently (no error) so it doesn't nag mid-typing.
  const handleIfscBlur = () => {
    const ifsc = formData.ifscCode
    if (ifsc && ifsc.length !== 11) {
      setIfscError("Please enter valid IFSC code")
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

    clearStepError("productTypeIds")
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
    clearStepError("companyRegistrationCertificateFile")
  };

  const handleSelectAllProductTypes = () => {
    if (!productTypes.length) return

    clearStepError("productTypeIds")

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
      clearStepError("cancelledChequeFile")
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
  clearStepError(field)
};

  // Input handlers with validation
  const handleAlphabetInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.replace(/[^a-zA-Z\s,'.-]/g, "")
    setFormData(prev => ({ ...prev, [field]: value }))
    clearStepError(field)
  }

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string, maxLength?: number) => {
    let value = e.target.value.replace(/\D/g, "")
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength)
    }
    setFormData(prev => ({ ...prev, [field]: value }))
    clearStepError(field)
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
      clearStepError(name)
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
    clearStepError("companyTypeId")
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
    clearStepError("sellerTypeId")
    clearStepError("parentManufacturerName")
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
    clearStepError("stateId")

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
    clearStepError("districtId")

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
    clearStepError("talukaId")
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
    clearStepError("bankStateId")

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
    clearStepError("bankDistrictId")

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
    clearStepError("bankTalukaId")
  }

  // Authorization letter handler (Coordinator step - required for all seller types)
  const handleAuthorizationLetterChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, authorizationLetterFile: file }))
    clearStepError("authorizationLetterFile")
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

  // Draft file deletion handlers - the "Delete" half of the "already
  // uploaded — View / Delete" branch each form renders once formData holds a
  // real *Url. Every one of these needs an existing tempSellerId (nothing to
  // delete server-side otherwise) and, on success, clears both the url and
  // any stray local File so the form falls back to the empty upload prompt.
  const handleDeleteCompanyRegistrationCertificate = async () => {
    if (!tempSellerId) return;
    try {
      await uploadSellerRegDocService.deleteDraftCompanyRegistrationCertificate(tempSellerId);
      setFormData(prev => ({ ...prev, companyRegistrationCertificateUrl: "", companyRegistrationCertificateFile: null }));
      toast.success("Company registration certificate removed");
    } catch (error) {
      console.error("Failed to delete company registration certificate:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleDeleteGstFile = async () => {
    if (!tempSellerId) return;
    try {
      await uploadSellerRegDocService.deleteDraftGstFile(tempSellerId);
      setFormData(prev => ({ ...prev, gstFileUrl: "", gstFile: null }));
      toast.success("GST file removed");
    } catch (error) {
      console.error("Failed to delete GST file:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleDeleteAuthorizationLetter = async () => {
    if (!tempSellerId) return;
    try {
      await uploadSellerRegDocService.deleteDraftAuthorizationLetter(tempSellerId);
      setFormData(prev => ({ ...prev, authorizationLetterUrl: "", authorizationLetterFile: null }));
      toast.success("Authorization letter removed");
    } catch (error) {
      console.error("Failed to delete authorization letter:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleDeleteBankDocument = async () => {
    if (!tempSellerId) return;
    try {
      await uploadSellerRegDocService.deleteDraftBankDocument(tempSellerId);
      setFormData(prev => ({ ...prev, cancelledChequeUrl: "", cancelledChequeFile: null }));
      toast.success("Bank document removed");
    } catch (error) {
      console.error("Failed to delete bank document:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleDeleteLicenseFile = async (productName: string) => {
    const documentId = formData.licenses[productName]?.documentId;
    if (!tempSellerId || !documentId) return;
    try {
      await uploadSellerRegDocService.deleteDraftDocumentFile(tempSellerId, documentId);
      setFormData(prev => ({
        ...prev,
        licenses: {
          ...prev.licenses,
          [productName]: { ...prev.licenses[productName], fileUrl: "", documentId: undefined, file: null },
        },
      }));
      toast.success("License file removed");
    } catch (error) {
      console.error("Failed to delete license file:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleDeleteAgreementFile = async (code: string) => {
    const documentId = formData.agreements[code]?.documentId;
    if (!tempSellerId || !documentId) return;
    try {
      await uploadSellerRegDocService.deleteDraftDocumentFile(tempSellerId, documentId);
      setFormData(prev => ({
        ...prev,
        agreements: {
          ...prev.agreements,
          [code]: { ...prev.agreements[code], fileUrl: "", documentId: undefined, file: null },
        },
      }));
      toast.success("Document removed");
    } catch (error) {
      console.error("Failed to delete agreement document:", error);
      toast.error("Failed to delete file. Please try again.");
    }
  };

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
      setStepErrors({})
      try {
        // step1Schema's conditional Parent Manufacturer Name requirement keys
        // off `sellerTypeName`, while formData tracks the same value under
        // `sellerType` - map it across before validating. A resumed draft
        // never restores the raw File object for an already-uploaded
        // certificate, only its URL, so fall back to that URL when there's
        // no local File - otherwise the schema would wrongly reject an
        // already-uploaded certificate as missing.
        step1Schema.parse({
          ...formData,
          sellerTypeName: formData.sellerType,
          companyRegistrationCertificateFile: formData.companyRegistrationCertificateFile
            || (isRealFileUrl(formData.companyRegistrationCertificateUrl) ? formData.companyRegistrationCertificateUrl : undefined),
        });
        // Check if company registration certificate is uploaded (locally picked OR already uploaded)
        if (!formData.companyRegistrationCertificateFile && !isRealFileUrl(formData.companyRegistrationCertificateUrl)) {
          setStepErrors({ companyRegistrationCertificateFile: "Please upload Company Registration Certificate" })
          return;
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {}
          error.issues.forEach(issue => {
            fieldErrors[String(issue.path[0])] = issue.message
          })
          setStepErrors(fieldErrors)
        } else {
          toast.error("Please fill all required company information fields.")
        }
        return
      }
    }

    // Step 2 Validation
    if (step === 2) {
      setStepErrors({})
      try {
        // Same already-uploaded-file fallback as step 1, for the authorization letter.
        step2Schema.parse({
          ...formData,
          authorizationLetterFile: formData.authorizationLetterFile
            || (isRealFileUrl(formData.authorizationLetterUrl) ? formData.authorizationLetterUrl : undefined),
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {}
          error.issues.forEach(issue => {
            fieldErrors[String(issue.path[0])] = issue.message
          })
          setStepErrors(fieldErrors)
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
      // All step 2 checks passed — fall through to the shared setStep(step + 1)
      // at the end of this function, same as steps 1/3/4 already do on success.
    }

    // Step 3 Validation
    if (step === 3) {
      try {
        // Same already-uploaded-file fallback as steps 1/2 — a resumed
        // draft's licenses/agreements only carry a `fileUrl`, not the raw
        // File object, once already uploaded.
        const licensesForValidation = Object.entries(formData.licenses).reduce((acc, [key, value]) => {
          acc[key] = {
            ...value,
            issueDate: value.issueDate ? value.issueDate.toISOString().split('T')[0] : '',
            expiryDate: value.expiryDate ? value.expiryDate.toISOString().split('T')[0] : '',
            file: value.file || (isRealFileUrl(value.fileUrl) ? value.fileUrl : undefined),
          }
          return acc
        }, {} as any)

        const agreementsForValidation = Object.entries(formData.agreements).reduce((acc, [key, value]: [string, any]) => {
          acc[key] = {
            ...value,
            issueDate: value.issueDate ? value.issueDate.toISOString().split('T')[0] : '',
            expiryDate: value.expiryDate ? value.expiryDate.toISOString().split('T')[0] : '',
            file: value.file || (isRealFileUrl(value.fileUrl) ? value.fileUrl : undefined),
          }
          return acc
        }, {} as any)

        const schema = step3Schema(formData.productTypes, formData.sellerType)
        schema.parse({
          gstNumber: formData.gstNumber,
          gstFile: formData.gstFile || (isRealFileUrl(formData.gstFileUrl) ? formData.gstFileUrl : undefined),
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
      setStepErrors({})
      try {
        // Same already-uploaded-file fallback as steps 1/2/3, for the cancelled cheque.
        step4Schema.parse({
          ...formData,
          cancelledChequeFile: formData.cancelledChequeFile
            || (isRealFileUrl(formData.cancelledChequeUrl) ? formData.cancelledChequeUrl : undefined),
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {}
          error.issues.forEach(issue => {
            fieldErrors[String(issue.path[0])] = issue.message
          })
          setStepErrors(fieldErrors)
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

    // Auto-save this step's progress now that validation passed, so closing
    // the tab right after Continue doesn't lose it. Silent on success (the
    // step transition itself is the feedback); a failure still surfaces via
    // its own toast but must never block advancing - the step's own
    // validation already passed, so the seller should keep moving forward
    // regardless, same "never trap the user over a save failure" principle
    // the rest of the draft-save feature already follows.
    await handleSaveDraft(true)

    setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  // Builds the partial, file-less payload sent to the draft endpoints.
  // Mirrors the address/coordinator/bankDetails/documents nesting handleSubmit
  // builds for the real submission below, but every field is optional and no
  // schema validation runs — the draft endpoint accepts whatever's filled in
  // so far.
  const buildDraftPayload = (): TempSellerDraftRequest => {
    // Note: string fields below are sent as-is (including "") rather than
    // falling back to `undefined` when empty - the backend's saveDraft only
    // touches a field when it's present (`!= null`) in the request, by
    // design, so a user CLEARING a field (e.g. removing their website) must
    // still reach the backend as an explicit "" to actually take effect;
    // omitting it via `|| undefined` would make the clear silently a no-op
    // and leave the old value in place. Numeric id fields (dropdowns) keep
    // `|| undefined` for 0 since there's no "explicitly clear to zero" case.
    const address = {
      stateId: formData.stateId || undefined,
      districtId: formData.districtId || undefined,
      talukaId: formData.talukaId || undefined,
      city: formData.city,
      street: formData.street,
      buildingNo: formData.buildingNo,
      landmark: formData.landmark,
      pinCode: formData.pincode,
    };

    const coordinator = {
      name: formData.coordinatorName,
      designation: formData.coordinatorDesignation,
      email: formData.coordinatorEmail,
      mobile: formData.coordinatorMobile,
    };

    const bankDetails = {
      bankName: formData.bankName,
      branch: formData.branch,
      ifscCode: formData.ifscCode,
      stateId: formData.bankStateId || undefined,
      districtId: formData.bankDistrictId || undefined,
      talukaId: formData.bankTalukaId || undefined,
      accountNumber: formData.accountNumber,
      accountHolderName: formData.accountHolderName,
    };

    // Per-product license metadata (no file — drafts never carry files).
    const licenseDocuments = formData.productTypes.map((productName: string) => {
      const product = productTypes.find(p => p.productTypeName === productName);
      const license = formData.licenses[productName];
      return {
        productTypeId: product?.productTypeId,
        documentNumber: license?.number || undefined,
        licenseIssueDate: license?.issueDate ? license.issueDate.toISOString().split('T')[0] : undefined,
        licenseExpiryDate: license?.expiryDate ? license.expiryDate.toISOString().split('T')[0] : undefined,
        licenseIssuingAuthority: license?.issuingAuthority || undefined,
      };
    });

    // Seller-level agreement/compliance document metadata (no file).
    const agreementDocuments = Object.keys(formData.agreements || {}).map((code) => {
      const agreement = formData.agreements[code];
      const documentTypeId = documentTypes.find(dt => dt.documentTypeCode === code)?.documentTypeId;
      return {
        documentTypeId,
        documentNumber: agreement?.number || undefined,
        licenseIssueDate: agreement?.issueDate ? agreement.issueDate.toISOString().split('T')[0] : undefined,
        licenseExpiryDate: agreement?.expiryDate ? agreement.expiryDate.toISOString().split('T')[0] : undefined,
      };
    });

    const documents = [...licenseDocuments, ...agreementDocuments];

    return {
      sellerName: formData.sellerName,
      productTypeId: formData.productTypeIds?.length ? formData.productTypeIds : undefined,
      companyTypeId: formData.companyTypeId || undefined,
      sellerTypeId: formData.sellerTypeId || undefined,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
      parentManufacturerName: formData.parentManufacturerName,
      brandOwnerName: formData.brandOwnerName,
      gstNumber: formData.gstNumber,
      address,
      coordinator,
      bankDetails,
      documents: documents.length > 0 ? documents : undefined,
    };
  };

  // Shared multipart-request shape for POST /temp-sellers/{id}/documents/upload -
  // used by both handleSubmit (final submit) and handleSaveDraft (draft file
  // upload) so the two flows send identical field names to
  // uploadSellerRegDocService.uploadDocuments instead of two hand-maintained
  // copies of the same object literal.
  const buildDocumentUploadRequest = (combinedLicensesPayload: LicenseFileItem[]) => ({
    sellerImage: undefined,
    gstFile: formData.gstFile || undefined,
    bankFile: formData.cancelledChequeFile || undefined,
    licenses: combinedLicensesPayload.length > 0 ? combinedLicensesPayload : undefined,
    companyRegistrationCertificate: formData.companyRegistrationCertificateFile || undefined,
    authorizationLetter: formData.authorizationLetterFile || undefined,
  });

  // Save-for-later: usable from every step, doesn't go through any step's
  // Continue validation. Creates the draft temp seller row on first save,
  // then PUTs to the same row on every subsequent save this session.
  //
  // Unlike handleSubmit, files are no longer deferred to final submit -
  // any file the user has already picked locally gets uploaded right here,
  // immediately after the text-field draft save succeeds. A failure in the
  // file-upload step only shows an error toast; it must NOT roll back or
  // delete the draft row that was just saved (that all-or-nothing behavior
  // is specific to handleSubmit's final-submit flow).
  // `silent` suppresses the "Draft saved successfully" toast - used when this
  // save is an automatic side-effect (advancing a step, logging out) rather
  // than an explicit "Save Draft" click, where success is expected/invisible
  // and a toast on every action would be noise. The failure toast always
  // shows regardless, since a failed save is actionable either way.
  const handleSaveDraft = async (silent: boolean = false) => {
    let currentTempSellerId = tempSellerId;

    try {
      const draftPayload = buildDraftPayload();

      if (currentTempSellerId) {
        await sellerRegService.updateDraftTempSeller(currentTempSellerId, draftPayload);
      } else {
        const result = await sellerRegService.createDraftTempSeller(draftPayload);
        currentTempSellerId = result.tempSellerId;
        setTempSellerId(currentTempSellerId);
      }

      // This exact payload is now saved server-side - re-baseline the
      // snapshot to it so a later logout-click comparison sees no
      // difference (file-only changes never show up here either way,
      // since buildDraftPayload never reads file/fileUrl/documentId fields).
      lastSavedPayloadRef.current = JSON.stringify(draftPayload);

      if (!silent) {
        toast.success("Draft saved successfully");
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft. Please try again.");
      return;
    }

    const hasAnyFileToUpload =
      !!formData.companyRegistrationCertificateFile ||
      !!formData.authorizationLetterFile ||
      !!formData.gstFile ||
      !!formData.cancelledChequeFile ||
      Object.values(formData.licenses).some((license) => !!license?.file) ||
      Object.values(formData.agreements).some((agreement) => !!agreement?.file);

    if (!hasAnyFileToUpload || !currentTempSellerId) {
      return;
    }

    try {
      // The draft save above just made the backend create placeholder
      // document rows (real documentIds) for any license/agreement entry
      // that has a documentNumber - re-fetch so prepareLicenseFiles/
      // prepareAgreementFiles below have those ids to match files against,
      // the same way handleSubmit's STEP 2 does after creating the temp
      // seller.
      const tempSellerDetails = await sellerRegService.getTempSellerById(currentTempSellerId);
      const draftDocuments = tempSellerDetails.documents || [];

      const licensesPayload = uploadSellerRegDocService.prepareLicenseFiles(
        formData.licenses,
        draftDocuments
      );

      const documentTypeIdByCode: Record<string, number> = {};
      documentTypes.forEach(dt => { documentTypeIdByCode[dt.documentTypeCode] = dt.documentTypeId; });
      const agreementsPayload = uploadSellerRegDocService.prepareAgreementFiles(
        formData.agreements,
        draftDocuments,
        documentTypeIdByCode
      );
      const combinedLicensesPayload = [...licensesPayload, ...agreementsPayload];

      const uploadResponse = await uploadSellerRegDocService.uploadDocuments(
        currentTempSellerId,
        buildDocumentUploadRequest(combinedLicensesPayload)
      );

      // Move every freshly-uploaded field into the "already uploaded" state:
      // record the returned URL and clear the local File so the forms
      // switch from the upload picker to the View/Delete chip. No dirty-
      // snapshot handling needed here - buildDraftPayload never reads
      // file/fileUrl/documentId, so this sync can't change its output.
      setFormData(prev => {
        const next = { ...prev };
        const data = uploadResponse.data;

        if (data?.gstFileUrl) {
          next.gstFileUrl = data.gstFileUrl;
          next.gstFileName = data.gstFileName ?? "";
          next.gstFile = null;
        }
        if (data?.bankDocumentFileUrl) {
          next.cancelledChequeUrl = data.bankDocumentFileUrl;
          next.cancelledChequeFileName = data.bankDocumentFileName ?? "";
          next.cancelledChequeFile = null;
        }
        if (data?.companyRegistrationCertificateUrl) {
          next.companyRegistrationCertificateUrl = data.companyRegistrationCertificateUrl;
          next.companyRegistrationCertificateFileName = data.companyRegistrationCertificateFileName ?? "";
          next.companyRegistrationCertificateFile = null;
        }
        if (data?.authorizationLetterUrl) {
          next.authorizationLetterUrl = data.authorizationLetterUrl;
          next.authorizationLetterFileName = data.authorizationLetterFileName ?? "";
          next.authorizationLetterFile = null;
        }

        // licenseResults covers both per-product licenses and seller-level
        // agreements (they share the licenseFiles/licenseNames/documentIds
        // upload convention) - licenseName is the productName for a license
        // entry or the documentTypeCode for an agreement entry, matching the
        // keys prepareLicenseFiles/prepareAgreementFiles used to build the
        // request above.
        if (data?.licenseResults?.length) {
          const licenses = { ...next.licenses };
          const agreements = { ...next.agreements };

          data.licenseResults.forEach((result) => {
            if (licenses[result.licenseName]) {
              licenses[result.licenseName] = {
                ...licenses[result.licenseName],
                fileUrl: result.documentFileUrl,
                fileName: result.documentFileName,
                documentId: result.documentId,
                file: null,
              };
            } else if (agreements[result.licenseName]) {
              agreements[result.licenseName] = {
                ...agreements[result.licenseName],
                fileUrl: result.documentFileUrl,
                fileName: result.documentFileName,
                documentId: result.documentId,
                file: null,
              };
            }
          });

          next.licenses = licenses;
          next.agreements = agreements;
        }

        return next;
      });

      if (!silent) {
        toast.success("Files uploaded successfully");
      }
    } catch (error) {
      // Deliberately NOT deleting/rolling back the temp seller here - the
      // draft's text fields already saved successfully above, and a file
      // upload failure during Save Draft shouldn't cost the user that
      // progress. They can retry the upload on a later Save Draft click.
      console.error("Failed to upload draft files:", error);
      toast.error("Draft saved, but uploading your file(s) failed. Please try again.");
    }
  };

  const finishLogout = async () => {
    await sellerAuthService.logout();
    setShowLogoutModal(false);
    setShowPlainLogoutConfirm(false);
    router.push("/");
  };

  const handleSaveAndLogout = async () => {
    setLoggingOutSaving(true);
    try {
      // Never trap the seller on the page over a failed save - handleSaveDraft
      // already shows its own error toast on failure, so logout proceeds
      // regardless of the outcome here.
      await handleSaveDraft(true);
    } finally {
      setLoggingOutSaving(false);
    }
    await finishLogout();
  };

  const handleLogoutWithoutSaving = async () => {
    await finishLogout();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let createdTempSellerId: number | null = null;
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

      // STEP 1: Create (or finalize an existing draft into) the temp seller
      // with placeholder URLs. If a draft was already created earlier this
      // session (via Save Draft or resumed on mount), finalize it instead of
      // creating a brand-new temp seller row.
      console.log("📡 Step 1: Creating temp seller...");
      const response = tempSellerId
        ? await sellerRegService.finalizeDraftTempSeller(tempSellerId, request)
        : await sellerRegService.createTempSeller(request);
      console.log("✅ Temp seller created:", response);

      createdTempSellerId = response.tempSellerId;
      tempSellerRequestId = response.sellerRequestId;

      // STEP 2: Fetch the created temp seller details to get document IDs
      console.log(`📡 Step 2: Fetching temp seller details to get document IDs...`);
      const tempSellerDetails = await sellerRegService.getTempSellerById(createdTempSellerId);
      console.log("✅ Temp seller details:", tempSellerDetails);

      // STEP 3: Upload actual documents using the tempSellerId and document IDs
      console.log(`📡 Step 3: Uploading documents for temp seller ID: ${createdTempSellerId}`);

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
        const uploadResponse = await uploadSellerRegDocService.uploadDocuments(
          createdTempSellerId,
          buildDocumentUploadRequest(combinedLicensesPayload)
        );

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
        if (createdTempSellerId) {
          toast.info("Please Try Again");
          await uploadSellerRegDocService.deleteTempSeller(createdTempSellerId);
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

      if (createdTempSellerId && !showSuccessModal) {
        try {
          await uploadSellerRegDocService.deleteTempSeller(createdTempSellerId);
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

  if (!authChecked || !resumeChecked) {
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
      <SellerRegistrationLayout step={step} hideSidebar={embedded}>
        {step === 1 && (
          <CompanyForm
            formData={formData}
            errors={stepErrors}
            onCompanyRegFileChange={handleCompanyRegFileChange}
            onDeleteCompanyRegistrationCertificate={handleDeleteCompanyRegistrationCertificate}
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
            onExitToIntro={embedded ? onExitToIntro : undefined}
          />
        )}

        {step === 2 && (
          <CoordinatorForm
            formData={formData}
            errors={stepErrors}
            isCheckingEmail={isCheckingEmail}
            isCheckingPhone={isCheckingPhone}
            emailExistsError={emailExistsError}
            phoneExistsError={phoneExistsError}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            onEmailChange={async (email) => {
              setFormData(prev => ({ ...prev, coordinatorEmail: email }))
              clearStepError("coordinatorEmail")
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
              clearStepError("coordinatorMobile")
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
            onDeleteAuthorizationLetter={handleDeleteAuthorizationLetter}
            prevStep={prevStep}
            nextStep={nextStep}
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
            onDeleteGstFile={handleDeleteGstFile}
            onDeleteLicenseFile={handleDeleteLicenseFile}
            onDeleteAgreementFile={handleDeleteAgreementFile}
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
            errors={stepErrors}
            ifscError={ifscError}
            states={states}
            bankDistricts={bankDistricts}
            bankTalukas={bankTalukas}
            loadingStates={loadingStates}
            onIfscChange={handleIfscChange}
            onIfscBlur={handleIfscBlur}
            onFileChange={handleFileChange}
            onDeleteBankDocument={handleDeleteBankDocument}
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
          if (embedded) {
            onSubmitted?.()
          } else {
            router.push("/")
          }
        }}
        applicationId={applicationId}
        email={formData.coordinatorEmail}
      />

      <SaveBeforeLogoutModal
        isOpen={showLogoutModal}
        saving={loggingOutSaving}
        onCancel={() => setShowLogoutModal(false)}
        onSaveAndLogout={handleSaveAndLogout}
        onLogoutWithoutSaving={handleLogoutWithoutSaving}
      />

      <LogoutConfirmationModal
        isOpen={showPlainLogoutConfirm}
        onClose={() => setShowPlainLogoutConfirm(false)}
        onConfirm={finishLogout}
      />
    </LocalizationProvider>
  )
}
