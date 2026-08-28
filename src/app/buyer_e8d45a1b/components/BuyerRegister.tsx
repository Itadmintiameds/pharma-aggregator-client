"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { z } from "zod";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import BuyerSidebar from "./BuyerSidebar";
import BuyerWizardStepper from "./BuyerWizardStepper";
import OrgDetailsForm from "./steps/OrgDetailsForm";
import ContactDetailsForm from "./steps/ContactDetailsForm";
import ComplianceDetailsForm from "./steps/ComplianceDetailsForm";
import ReviewForm from "./steps/ReviewForm";

import { buyerAuthService } from "@/src/services/buyer/buyerAuthService";
import {
  buyerRegMasterService,
  BuyerTypeResponse,
  StateResponse,
  DistrictResponse,
  TalukaResponse,
  DocumentTypeResponse,
} from "@/src/services/buyer/BuyerRegMasterService";
import {
  buyerRegistrationService,
  TempBuyerPayload,
  TempBuyerAddressPayload,
  TempBuyerContactPayload,
  TempBuyerDocumentPayload,
} from "@/src/services/buyer/buyerRegistrationService";
import { uploadBuyerRegDocService, LicenseFileItem } from "@/src/services/buyer/UploadBuyerRegDoc";
import { orgDetailsSchema, contactDetailsSchema, documentsSchema, gstOrPanSchema } from "@/src/schema/buyer/buyerRegSchema";
import { isRealFileUrl } from "@/src/utils/sellerRegFiles";

const WIZARD_STEP_STORAGE_KEY = "buyerRegWizardStep";
// 3 real wizard steps + an internal 4th "review" state (see BuyerWizardStepper
// call sites below, which clamp the displayed step to 3 so the tracker never
// shows a 4th dot and "Compliance Details" stays highlighted through review —
// matches Figma's 3-point tracker, where Review isn't a separate numbered step.
const WIZARD_STEP_COUNT = 4;
const WIZARD_STEP_TITLES = ["Organization details", "Buyer Contact Details", "Compliance Details"];

export interface DocumentRowState {
  number: string;
  file: File | null;
  fileUrl?: string;
  fileName?: string;
  documentId?: number;
  issueDate: Date | null;
  expiryDate: Date | null;
}

// Shape of the wizard's single formData object, shared with every step
// component below instead of each declaring its own `formData: any` prop.
export interface BuyerFormData {
  acceptedTerms: boolean;

  organizationName: string;
  buyerTypeId: number;
  gstNumber: string;
  panNumber: string;

  orgLogoFile: File | null;
  orgLogoUrl: string;
  orgLogoFileName: string;
  gstFile: File | null;
  gstFileUrl: string;
  gstFileName: string;
  panFile: File | null;
  panFileUrl: string;
  panFileName: string;

  stateId: number;
  districtId: number;
  talukaId: number;
  state: string;
  district: string;
  taluka: string;
  city: string;
  street: string;
  buildingNo: string;
  landmark: string;
  pinCode: string;

  contactName: string;
  contactDesignation: string;
  contactEmail: string;
  contactMobile: string;
  emailVerified: boolean;
  phoneVerified: boolean;

  documents: Record<string, DocumentRowState>;
}

interface BuyerRegistrationProps {
  // Set when rendered inside the dashboard's onboarding gate (the only place
  // this component is used today) — suppresses this wizard's own 5-step
  // sidebar in favor of the gate's 3-point stepper, and on submit hands
  // control back to the gate instead of navigating away.
  embedded?: boolean;
  onSubmitted?: () => void;
  onExitToIntro?: () => void;
  // When set, opens the wizard directly at this step (1-5) instead of
  // resuming wherever sessionStorage last left off — used by the
  // onboarding hub's per-section "Edit"/"Continue" rows (see
  // BuyerOnboardingGate.tsx) so clicking "License Details" jumps straight
  // to step 3 rather than a stale in-progress step.
  initialStep?: number;
}

export default function BuyerRegister({ embedded = false, onSubmitted, onExitToIntro, initialStep }: BuyerRegistrationProps = {}) {
  const router = useRouter();

  const [resumeChecked, setResumeChecked] = useState(false);
  const [step, setStep] = useState(() => {
    if (initialStep && initialStep >= 1 && initialStep <= WIZARD_STEP_COUNT) return initialStep;
    if (typeof window === "undefined") return 1;
    const saved = parseInt(sessionStorage.getItem(WIZARD_STEP_STORAGE_KEY) || "", 10);
    return saved >= 1 && saved <= WIZARD_STEP_COUNT ? saved : 1;
  });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [tempBuyerId, setTempBuyerId] = useState<number | null>(null);
  // The final Review page's own confirmation checkbox — replaces the old
  // standalone Terms step; this is what sets formData.acceptedTerms now.
  const [confirmChecked, setConfirmChecked] = useState(false);

  const [buyerTypes, setBuyerTypes] = useState<BuyerTypeResponse[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeResponse[]>([]);
  const [states, setStates] = useState<StateResponse[]>([]);
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [talukas, setTalukas] = useState<TalukaResponse[]>([]);
  const [loadingBuyerTypes, setLoadingBuyerTypes] = useState(true);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas] = useState(false);

  // Same "compare current draft payload to the last-saved snapshot" dirty
  // check convention as SellerRegister.tsx — see its extensive comment on
  // lastSavedPayloadRef/pendingResumeSnapshotRef for the reasoning.
  const lastSavedPayloadRef = useRef<string>("");
  const pendingResumeSnapshotRef = useRef(true);

  const [formData, setFormData] = useState({
    acceptedTerms: false,

    organizationName: "",
    buyerTypeId: 0,
    gstNumber: "",
    panNumber: "",

    orgLogoFile: null as File | null,
    orgLogoUrl: "",
    orgLogoFileName: "",
    gstFile: null as File | null,
    gstFileUrl: "",
    gstFileName: "",
    panFile: null as File | null,
    panFileUrl: "",
    panFileName: "",

    stateId: 0,
    districtId: 0,
    talukaId: 0,
    state: "",
    district: "",
    taluka: "",
    city: "",
    street: "",
    buildingNo: "",
    landmark: "",
    pinCode: "",

    contactName: "",
    contactDesignation: "",
    contactEmail: "",
    contactMobile: "",
    emailVerified: false,
    phoneVerified: false,

    // Keyed by document type id, stringified (there is exactly one
    // mandatory document type id per selected buyer type — see
    // requiredBuyerDocumentCodes).
    documents: {} as Record<string, DocumentRowState>,
  });

  const selectedBuyerType = buyerTypes.find((bt) => bt.buyerTypeId === formData.buyerTypeId);
  const buyerTypeName = selectedBuyerType?.buyerTypeName;
  const mandatoryDocumentTypeId = selectedBuyerType?.mandatoryDocumentTypeId;
  const mandatoryDocumentTypeName = documentTypes.find(
    (dt) => dt.documentTypeId === mandatoryDocumentTypeId
  )?.documentTypeName;

  useEffect(() => {
    sessionStorage.setItem(WIZARD_STEP_STORAGE_KEY, String(step));
  }, [step]);

  useEffect(() => {
    if (pendingResumeSnapshotRef.current) {
      pendingResumeSnapshotRef.current = false;
      lastSavedPayloadRef.current = JSON.stringify(buildDraftPayload());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Fetch master data once on mount.
  useEffect(() => {
    (async () => {
      try {
        setBuyerTypes(await buyerRegMasterService.getBuyerTypes());
      } catch {
        toast.error("Failed to load buyer types");
      } finally {
        setLoadingBuyerTypes(false);
      }
    })();
    (async () => {
      try {
        setStates(await buyerRegMasterService.getStates());
      } catch {
        toast.error("Failed to load states");
      } finally {
        setLoadingStates(false);
      }
    })();
    (async () => {
      try {
        setDocumentTypes(await buyerRegMasterService.getDocumentTypes());
      } catch {
        toast.error("Failed to load document types");
      }
    })();
  }, []);

  const fetchDistricts = async (stateId: number) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    try {
      setDistricts(await buyerRegMasterService.getDistrictsByStateId(stateId));
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchTalukas = async (districtId: number) => {
    if (!districtId) {
      setTalukas([]);
      return;
    }
    setLoadingTalukas(true);
    try {
      setTalukas(await buyerRegMasterService.getTalukasByDistrictId(districtId));
    } catch {
      setTalukas([]);
    } finally {
      setLoadingTalukas(false);
    }
  };

  // Resume an in-progress draft, if one exists — same "404 just means no
  // draft yet, not an error" convention as SellerRegister.tsx.
  useEffect(() => {
    (async () => {
      try {
        const userId = buyerAuthService.getCurrentUser()?.buyerUserId;
        if (!userId) return;

        const raw = await buyerRegistrationService.getTempBuyerByUserId(userId);
        if (!raw || typeof raw.status !== "string" || raw.status.toUpperCase() !== "DRAFT") {
          return;
        }

        setTempBuyerId(raw.tempBuyerId ?? null);

        pendingResumeSnapshotRef.current = true;
        setFormData((prev) => ({
          ...prev,
          organizationName: raw.organizationName ?? prev.organizationName,
          buyerTypeId: raw.buyerType?.buyerTypeId ?? prev.buyerTypeId,
          gstNumber: raw.gstNumber ?? prev.gstNumber,
          panNumber: raw.panNumber ?? prev.panNumber,
          orgLogoUrl: isRealFileUrl(raw.orgLogoUrl) ? (raw.orgLogoUrl as string) : prev.orgLogoUrl,

          stateId: raw.address?.state?.stateId ?? prev.stateId,
          districtId: raw.address?.district?.districtId ?? prev.districtId,
          talukaId: raw.address?.taluka?.talukaId ?? prev.talukaId,
          state: raw.address?.state?.stateName ?? prev.state,
          district: raw.address?.district?.districtName ?? prev.district,
          taluka: raw.address?.taluka?.talukaName ?? prev.taluka,
          city: raw.address?.city ?? prev.city,
          street: raw.address?.street ?? prev.street,
          buildingNo: raw.address?.buildingNo ?? prev.buildingNo,
          landmark: raw.address?.landmark ?? prev.landmark,
          pinCode: raw.address?.pinCode ?? prev.pinCode,

          contactName: raw.contact?.name ?? prev.contactName,
          contactDesignation: raw.contact?.designation ?? prev.contactDesignation,
          contactEmail: raw.contact?.email ?? prev.contactEmail,
          contactMobile: raw.contact?.mobile ?? prev.contactMobile,
          emailVerified: raw.contact?.emailVerified ?? prev.emailVerified,
          phoneVerified: raw.contact?.phoneVerified ?? prev.phoneVerified,
        }));

        if (raw.address?.state?.stateId) await fetchDistricts(raw.address.state.stateId);
        if (raw.address?.district?.districtId) await fetchTalukas(raw.address.district.districtId);

        if (Array.isArray(raw.documents) && raw.documents.length > 0) {
          pendingResumeSnapshotRef.current = true;
          setFormData((prev) => {
            const documents = { ...prev.documents };
            raw.documents!.forEach((doc) => {
              const documentTypeId = doc.documentType?.documentTypeId;
              if (!documentTypeId) return;
              const code = String(documentTypeId);
              documents[code] = {
                number: doc.documentNumber || "",
                file: null,
                ...(isRealFileUrl(doc.documentFileUrl) && {
                  fileUrl: doc.documentFileUrl,
                  fileName: doc.documentFileName,
                  documentId: doc.DocumentsId ?? doc.documentId,
                }),
                issueDate: doc.licenseIssueDate ? new Date(doc.licenseIssueDate) : null,
                expiryDate: doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null,
              };
            });
            return { ...prev, documents };
          });
        }
      } catch (error) {
        console.log("No draft to resume (or resume check failed):", error);
      } finally {
        setResumeChecked(true);
      }
    })();
  }, []);

  const clearStepError = (field: string) => {
    setStepErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearStepError(field);
  };

  const handleBuyerTypeChange = (buyerTypeId: number) => {
    setFormData((prev) => ({ ...prev, buyerTypeId, documents: {} }));
    clearStepError("buyerTypeId");
  };

  const handleStateChange = (stateId: number) => {
    const selected = states.find((s) => s.stateId === stateId);
    setFormData((prev) => ({
      ...prev,
      stateId,
      state: selected?.stateName || "",
      districtId: 0,
      district: "",
      talukaId: 0,
      taluka: "",
    }));
    setDistricts([]);
    setTalukas([]);
    clearStepError("stateId");
    if (stateId) fetchDistricts(stateId);
  };

  const handleDistrictChange = (districtId: number) => {
    const selected = districts.find((d) => d.districtId === districtId);
    setFormData((prev) => ({ ...prev, districtId, district: selected?.districtName || "", talukaId: 0, taluka: "" }));
    setTalukas([]);
    clearStepError("districtId");
    if (districtId) fetchTalukas(districtId);
  };

  const handleTalukaChange = (talukaId: number) => {
    const selected = talukas.find((t) => t.talukaId === talukaId);
    setFormData((prev) => ({ ...prev, talukaId, taluka: selected?.talukaName || "" }));
    clearStepError("talukaId");
  };

  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "orgLogo" | "gstFile" | "panFile" | "mandatoryDocument",
    code?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PDF, JPG, JPEG, and PNG files are allowed");
      return;
    }

    if (field === "orgLogo") {
      setFormData((prev) => ({ ...prev, orgLogoFile: file }));
    } else if (field === "gstFile") {
      setFormData((prev) => ({ ...prev, gstFile: file }));
    } else if (field === "panFile") {
      setFormData((prev) => ({ ...prev, panFile: file }));
    } else if (field === "mandatoryDocument" && code) {
      setFormData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [code]: { ...(prev.documents[code] || emptyDocRow()), file },
        },
      }));
    }
  };

  function emptyDocRow(): DocumentRowState {
    return { number: "", file: null, issueDate: null, expiryDate: null };
  }

  const handleDocumentNumberChange = (code: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [code]: { ...(prev.documents[code] || emptyDocRow()), number: value } },
    }));
  };

  const handleDocumentIssueDateChange = (code: string, date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [code]: { ...(prev.documents[code] || emptyDocRow()), issueDate: date } },
    }));
  };

  const handleDocumentExpiryDateChange = (code: string, date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [code]: { ...(prev.documents[code] || emptyDocRow()), expiryDate: date } },
    }));
  };

  const handleDeleteOrgLogo = async () => {
    if (!tempBuyerId) return;
    try {
      await uploadBuyerRegDocService.deleteDraftOrgLogo(tempBuyerId);
      setFormData((prev) => ({ ...prev, orgLogoUrl: "", orgLogoFile: null }));
      toast.success("Organization logo removed");
    } catch {
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleDeleteGstFile = async () => {
    if (!tempBuyerId) return;
    try {
      await uploadBuyerRegDocService.deleteDraftGstFile(tempBuyerId);
      setFormData((prev) => ({ ...prev, gstFileUrl: "", gstFile: null }));
      toast.success("GST file removed");
    } catch {
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleDeletePanFile = async () => {
    if (!tempBuyerId) return;
    try {
      await uploadBuyerRegDocService.deleteDraftPanFile(tempBuyerId);
      setFormData((prev) => ({ ...prev, panFileUrl: "", panFile: null }));
      toast.success("PAN file removed");
    } catch {
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const handleDeleteMandatoryDocumentFile = async (code: string) => {
    const documentId = formData.documents[code]?.documentId;
    if (!tempBuyerId || !documentId) return;
    try {
      await uploadBuyerRegDocService.deleteDraftDocumentFile(tempBuyerId, documentId);
      setFormData((prev) => ({
        ...prev,
        documents: { ...prev.documents, [code]: { ...prev.documents[code], fileUrl: "", documentId: undefined, file: null } },
      }));
      toast.success("Document file removed");
    } catch {
      toast.error("Failed to delete file. Please try again.");
    }
  };

  const buildDraftPayload = (): TempBuyerPayload => {
    const address: TempBuyerAddressPayload = {
      stateId: formData.stateId || undefined,
      districtId: formData.districtId || undefined,
      talukaId: formData.talukaId || undefined,
      city: formData.city,
      street: formData.street,
      buildingNo: formData.buildingNo,
      landmark: formData.landmark,
      pinCode: formData.pinCode,
    };

    const contact: TempBuyerContactPayload = {
      name: formData.contactName,
      designation: formData.contactDesignation,
      email: formData.contactEmail,
      mobile: formData.contactMobile,
      emailVerified: formData.emailVerified,
      phoneVerified: formData.phoneVerified,
    };

    const documents: TempBuyerDocumentPayload[] = Object.entries(formData.documents).map(([, doc]) => ({
      documentTypeId: mandatoryDocumentTypeId,
      documentNumber: doc.number || undefined,
      licenseIssueDate: doc.issueDate ? doc.issueDate.toISOString().split("T")[0] : undefined,
      licenseExpiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split("T")[0] : undefined,
    }));

    return {
      organizationName: formData.organizationName,
      buyerTypeId: formData.buyerTypeId || undefined,
      termsAccepted: formData.acceptedTerms,
      orgLogoUrl: isRealFileUrl(formData.orgLogoUrl) ? formData.orgLogoUrl : undefined,
      gstNumber: formData.gstNumber,
      panNumber: formData.panNumber,
      address,
      contact,
      documents: documents.length ? documents : undefined,
    };
  };

  const handleSaveDraft = async (silent = false) => {
    let currentId = tempBuyerId;

    try {
      const payload = buildDraftPayload();
      if (currentId) {
        await buyerRegistrationService.updateDraftTempBuyer(currentId, payload);
      } else {
        const result = await buyerRegistrationService.createDraftTempBuyer(payload);
        currentId = result.tempBuyerId;
        setTempBuyerId(currentId);
      }
      lastSavedPayloadRef.current = JSON.stringify(payload);
      if (!silent) toast.success("Draft saved successfully");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft. Please try again.");
      return;
    }

    const hasFileToUpload =
      !!formData.orgLogoFile ||
      !!formData.gstFile ||
      !!formData.panFile ||
      Object.values(formData.documents).some((doc) => !!doc?.file);

    if (!hasFileToUpload || !currentId) return;

    try {
      const raw = await buyerRegistrationService.getTempBuyerById(currentId);
      const draftDocuments = raw.documents || [];

      const licenses: LicenseFileItem[] = [];
      const codeByDocumentId: Record<number, string> = {};
      Object.entries(formData.documents).forEach(([code, doc]) => {
        const item = uploadBuyerRegDocService.prepareLicenseFile(
          doc.file,
          mandatoryDocumentTypeName || code,
          mandatoryDocumentTypeId,
          draftDocuments
        );
        if (item) {
          licenses.push(item);
          codeByDocumentId[item.documentId] = code;
        }
      });

      const uploadResponse = await uploadBuyerRegDocService.uploadDocuments(currentId, {
        orgLogo: formData.orgLogoFile || undefined,
        gstFile: formData.gstFile || undefined,
        panFile: formData.panFile || undefined,
        licenses: licenses.length ? licenses : undefined,
      });

      setFormData((prev) => {
        const next = { ...prev };
        if (uploadResponse.orgLogoUrl) {
          next.orgLogoUrl = uploadResponse.orgLogoUrl;
          next.orgLogoFileName = uploadResponse.orgLogoFileName ?? "";
          next.orgLogoFile = null;
        }
        if (uploadResponse.gstFileUrl) {
          next.gstFileUrl = uploadResponse.gstFileUrl;
          next.gstFileName = uploadResponse.gstFileName ?? "";
          next.gstFile = null;
        }
        if (uploadResponse.panFileUrl) {
          next.panFileUrl = uploadResponse.panFileUrl;
          next.panFileName = uploadResponse.panFileName ?? "";
          next.panFile = null;
        }
        if (uploadResponse.licenseResults?.length) {
          const documents = { ...next.documents };
          uploadResponse.licenseResults.forEach((result) => {
            const code = codeByDocumentId[result.documentId];
            if (code && documents[code]) {
              documents[code] = {
                ...documents[code],
                fileUrl: result.documentFileUrl,
                fileName: result.documentFileName,
                documentId: result.documentId,
                file: null,
              };
            }
          });
          next.documents = documents;
        }
        return next;
      });

      if (!silent) toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("Failed to upload draft files:", error);
      toast.error("Draft saved, but uploading your file(s) failed. Please try again.");
    }
  };

  const nextStep = async () => {
    // Step 1: Organization Details
    if (step === 1) {
      try {
        orgDetailsSchema.parse({
          organizationName: formData.organizationName,
          buyerTypeId: formData.buyerTypeId,
          stateId: formData.stateId,
          districtId: formData.districtId,
          talukaId: formData.talukaId,
          city: formData.city,
          street: formData.street,
          buildingNo: formData.buildingNo,
          landmark: formData.landmark,
          pinCode: formData.pinCode,
        });
        setStepErrors({});
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.issues.forEach((issue) => {
            fieldErrors[String(issue.path[0])] = issue.message;
          });
          setStepErrors(fieldErrors);
        }
        return;
      }
    }

    // Step 2: Contact Details
    if (step === 2) {
      try {
        contactDetailsSchema.parse({
          name: formData.contactName,
          designation: formData.contactDesignation,
          email: formData.contactEmail,
          mobile: formData.contactMobile,
          emailVerified: formData.emailVerified,
          phoneVerified: formData.phoneVerified,
        });
        setStepErrors({});
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.issues.forEach((issue) => {
            fieldErrors[String(issue.path[0])] = issue.message;
          });
          setStepErrors(fieldErrors);
          if (fieldErrors.emailVerified || fieldErrors.phoneVerified) {
            toast.error("Please verify both email and mobile number");
          }
        }
        return;
      }
    }

    // Step 3: Compliance Details (mandatory license doc + either GST or PAN)
    if (step === 3) {
      const documentsForValidation = Object.entries(formData.documents).reduce((acc, [code, doc]) => {
        acc[code] = {
          ...doc,
          issueDate: doc.issueDate ? doc.issueDate.toISOString().split("T")[0] : "",
          expiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split("T")[0] : "",
          file: doc.file || (isRealFileUrl(doc.fileUrl) ? doc.fileUrl : undefined),
        };
        return acc;
      }, {} as Record<string, unknown>);

      const docResult = documentsSchema(mandatoryDocumentTypeId).safeParse({ documents: documentsForValidation });
      const gstResult = gstOrPanSchema.safeParse({ gstNumber: formData.gstNumber, panNumber: formData.panNumber });

      const fieldErrors: Record<string, string> = {};
      if (!docResult.success) {
        fieldErrors.mandatoryDocument = docResult.error.issues[0]?.message ?? "Please provide the mandatory license document";
      }
      if (!gstResult.success) {
        gstResult.error.issues.forEach((issue) => {
          fieldErrors[String(issue.path[0])] = issue.message;
        });
      }
      if (Object.keys(fieldErrors).length) {
        setStepErrors(fieldErrors);
        if (fieldErrors.mandatoryDocument) toast.error(fieldErrors.mandatoryDocument);
        return;
      }
      setStepErrors({});
    }

    await handleSaveDraft(true);
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleEdit = (section: string) => {
    switch (section) {
      case "org":
        setStep(1);
        break;
      case "contact":
        setStep(2);
        break;
      case "license":
      case "gst":
        setStep(3);
        break;
    }
  };

  const checkGstUnique = async (gst: string) => {
    try {
      return await buyerRegistrationService.checkGSTNumber(gst, tempBuyerId);
    } catch {
      return false;
    }
  };

  const checkPanUnique = async (pan: string) => {
    try {
      return await buyerRegistrationService.checkPANNumber(pan, tempBuyerId);
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!confirmChecked) {
      toast.error("Please confirm the declaration before submitting");
      return;
    }
    setSubmitting(true);
    try {
      const placeholderUrl = "PENDING";

      const address: TempBuyerAddressPayload = {
        stateId: formData.stateId,
        districtId: formData.districtId,
        talukaId: formData.talukaId,
        city: formData.city,
        street: formData.street,
        buildingNo: formData.buildingNo,
        landmark: formData.landmark || "",
        pinCode: formData.pinCode,
      };

      const contact: TempBuyerContactPayload = {
        name: formData.contactName,
        designation: formData.contactDesignation,
        email: formData.contactEmail,
        mobile: formData.contactMobile,
        emailVerified: formData.emailVerified,
        phoneVerified: formData.phoneVerified,
      };

      const documents: TempBuyerDocumentPayload[] = Object.entries(formData.documents).map(([, doc]) => ({
        documentTypeId: mandatoryDocumentTypeId,
        documentNumber: doc.number || "N/A",
        documentFileUrl: isRealFileUrl(doc.fileUrl) ? (doc.fileUrl as string) : placeholderUrl,
        licenseIssueDate: doc.issueDate ? doc.issueDate.toISOString().split("T")[0] : undefined,
        licenseExpiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split("T")[0] : undefined,
      }));

      const request: TempBuyerPayload = {
        organizationName: formData.organizationName,
        buyerTypeId: formData.buyerTypeId,
        termsAccepted: true,
        orgLogoUrl: isRealFileUrl(formData.orgLogoUrl) ? formData.orgLogoUrl : undefined,
        gstNumber: formData.gstNumber || undefined,
        panNumber: formData.panNumber || undefined,
        address,
        contact,
        documents,
      };

      let idToFinalize = tempBuyerId;
      if (!idToFinalize) {
        const draftResult = await buyerRegistrationService.createDraftTempBuyer(request);
        idToFinalize = draftResult.tempBuyerId;
        setTempBuyerId(idToFinalize);
      }

      // Re-check uniqueness right before finalize — the mobile/email field
      // is disabled (and its onBlur check skipped) once verified, so a
      // resumed draft or a duplicate created elsewhere in the meantime would
      // otherwise only surface as a raw duplicate-key 500 from finalize.
      const [mobileTaken, emailTaken] = await Promise.all([
        buyerRegistrationService.checkMobileUnique(formData.contactMobile, idToFinalize),
        buyerRegistrationService.checkEmailUnique(formData.contactEmail, idToFinalize),
      ]);
      if (mobileTaken || emailTaken) {
        toast.error(
          mobileTaken
            ? "This mobile number is already registered with another account. Please use a different number."
            : "This email is already registered with another account. Please use a different email address."
        );
        setStep(2);
        return;
      }

      const response = await buyerRegistrationService.finalizeDraftTempBuyer(idToFinalize, request);
      const createdId = response.tempBuyerId;

      const raw = await buyerRegistrationService.getTempBuyerById(createdId);
      const draftDocuments = raw.documents || [];

      const licenses: LicenseFileItem[] = [];
      Object.entries(formData.documents).forEach(([code, doc]) => {
        const item = uploadBuyerRegDocService.prepareLicenseFile(
          doc.file,
          mandatoryDocumentTypeName || code,
          mandatoryDocumentTypeId,
          draftDocuments
        );
        if (item) licenses.push(item);
      });

      try {
        await uploadBuyerRegDocService.uploadDocuments(createdId, {
          orgLogo: formData.orgLogoFile || undefined,
          gstFile: formData.gstFile || undefined,
          panFile: formData.panFile || undefined,
          licenses: licenses.length ? licenses : undefined,
        });

        sessionStorage.removeItem(WIZARD_STEP_STORAGE_KEY);
        toast.success("Application submitted successfully!");

        if (embedded) {
          onSubmitted?.();
        } else {
          router.push("/buyer_e8d45a1b/dashboard");
        }
      } catch (uploadError) {
        console.error("Document upload failed:", uploadError);
        toast.error("Document upload failed. Your application could not be completed. Please try again.");
        await uploadBuyerRegDocService.deleteTempBuyer(createdId);
        setTempBuyerId(null);
        throw uploadError;
      }
    } catch (error) {
      console.error("Registration failed:", error);
      const backendMessage = axios.isAxiosError(error) ? (error.response?.data?.message as string | undefined) : undefined;
      if (backendMessage?.toLowerCase().includes("duplicate key")) {
        const friendlyMessage = backendMessage.toLowerCase().includes("mobile")
          ? "This mobile number is already registered with another account. Please use a different number."
          : backendMessage.toLowerCase().includes("email")
          ? "This email is already registered with another account. Please use a different email address."
          : "Some of the details you entered are already registered with another account.";
        toast.error(friendlyMessage);
      } else if (backendMessage) {
        toast.error(backendMessage);
      } else if (error instanceof Error && error.message) {
        toast.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!resumeChecked) return null;

  const content = (
    <>
      {step === 1 && (
        <OrgDetailsForm
          formData={formData}
          errors={stepErrors}
          buyerTypes={buyerTypes}
          states={states}
          districts={districts}
          talukas={talukas}
          loadingBuyerTypes={loadingBuyerTypes}
          loadingStates={loadingStates}
          loadingDistricts={loadingDistricts}
          loadingTalukas={loadingTalukas}
          onChange={handleFieldChange}
          onBuyerTypeChange={handleBuyerTypeChange}
          onStateChange={handleStateChange}
          onDistrictChange={handleDistrictChange}
          onTalukaChange={handleTalukaChange}
          nextStep={nextStep}
          onExitToIntro={embedded ? onExitToIntro : undefined}
        />
      )}

      {step === 2 && (
        <ContactDetailsForm
          formData={formData}
          errors={stepErrors}
          buyerTypeName={buyerTypeName}
          tempBuyerId={tempBuyerId}
          onChange={handleFieldChange}
          onEmailVerifiedChange={(verified) => handleFieldChange("emailVerified", verified)}
          onPhoneVerifiedChange={(verified) => handleFieldChange("phoneVerified", verified)}
          prevStep={prevStep}
          nextStep={nextStep}
        />
      )}

      {step === 3 && (
        <ComplianceDetailsForm
          formData={formData}
          errors={stepErrors}
          mandatoryDocumentTypeId={mandatoryDocumentTypeId}
          mandatoryDocumentTypeName={mandatoryDocumentTypeName}
          onChange={handleFieldChange}
          onFileChange={handleFileChange}
          onDeleteOrgLogo={handleDeleteOrgLogo}
          onDeleteGstFile={handleDeleteGstFile}
          onDeletePanFile={handleDeletePanFile}
          onDeleteMandatoryDocumentFile={handleDeleteMandatoryDocumentFile}
          onDocumentNumberChange={handleDocumentNumberChange}
          onDocumentIssueDateChange={handleDocumentIssueDateChange}
          onDocumentExpiryDateChange={handleDocumentExpiryDateChange}
          onCheckGstUnique={checkGstUnique}
          onCheckPanUnique={checkPanUnique}
          prevStep={prevStep}
          nextStep={nextStep}
        />
      )}

      {step === 4 && (
        <ReviewForm
          formData={formData}
          buyerTypeName={buyerTypeName}
          mandatoryDocumentTypeId={mandatoryDocumentTypeId}
          mandatoryDocumentTypeName={mandatoryDocumentTypeName}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          submitting={submitting}
          prevStep={prevStep}
          confirmChecked={confirmChecked}
          onConfirmChange={(checked) => {
            setConfirmChecked(checked);
            handleFieldChange("acceptedTerms", checked);
          }}
        />
      )}
    </>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {embedded ? (
        <div className="flex flex-col gap-6">
          <BuyerWizardStepper step={Math.min(step, WIZARD_STEP_TITLES.length)} titles={WIZARD_STEP_TITLES} />
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-visible">
            <div className="p-4 sm:p-6 lg:p-10">{content}</div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen pt-12">
          <BuyerSidebar step={step} />
          <div className="flex-1 bg-white overflow-visible">
            <div className="p-4 sm:p-6 lg:p-10">
              <BuyerWizardStepper step={Math.min(step, WIZARD_STEP_TITLES.length)} titles={WIZARD_STEP_TITLES} />
              <div className="mt-6">{content}</div>
            </div>
          </div>
        </div>
      )}
    </LocalizationProvider>
  );
}
