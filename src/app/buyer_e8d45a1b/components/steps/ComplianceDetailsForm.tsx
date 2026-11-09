"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { FileText, IdCard, Boxes, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, X } from "lucide-react";
import { isRealFileUrl } from "@/src/utils/sellerRegFiles";
import { requiredBuyerDocumentCodes } from "@/src/schema/buyer/buyerRegSchema";
import { BuyerFormData, DocumentRowState } from "@/src/app/buyer_e8d45a1b/components/BuyerRegister";

interface Props {
  formData: BuyerFormData;
  errors: Record<string, string>;
  mandatoryDocumentTypeId?: number;
  mandatoryDocumentTypeName?: string;
  onChange: (field: string, value: unknown) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: "orgLogo" | "gstFile" | "panFile" | "mandatoryDocument", code?: string) => void;
  onDeleteOrgLogo: () => void;
  onDeleteGstFile: () => void;
  onDeletePanFile: () => void;
  onDeleteMandatoryDocumentFile: (code: string) => void;
  onDocumentNumberChange: (code: string, value: string) => void;
  onDocumentIssueDateChange: (code: string, date: Date | null) => void;
  onDocumentExpiryDateChange: (code: string, date: Date | null) => void;
  onCheckGstUnique: (gst: string) => Promise<boolean>;
  onCheckPanUnique: (pan: string) => Promise<boolean>;
  prevStep: () => void;
  nextStep: () => void;
}

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

function validateFile(file: File): string | null {
  if (file.size > 5 * 1024 * 1024) return "File size should be less than 5MB";
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PDF, JPG, JPEG, and PNG files are allowed";
  return null;
}

// Best-effort display name — the backend only ever gives us the uploaded
// file's URL, never the original filename, so this derives something
// readable from the S3 key's last path segment.
function deriveFileName(url: string): string {
  try {
    const withoutQuery = url.split("?")[0];
    const lastSegment = withoutQuery.substring(withoutQuery.lastIndexOf("/") + 1);
    return decodeURIComponent(lastSegment) || "Uploaded file";
  } catch {
    return "Uploaded file";
  }
}

function UploadSlot({ uploaded, fileUrl, fileName, fileObj, onPick, onDelete, placeholder }: {
  uploaded: boolean;
  fileUrl?: string;
  fileName?: string;
  fileObj?: File | null;
  onPick: () => void;
  onDelete: () => void;
  placeholder: string;
}) {
  const displayName = fileObj?.name || fileName || (isRealFileUrl(fileUrl) ? deriveFileName(fileUrl as string) : "");
  const isUploaded = uploaded && (!!fileObj || isRealFileUrl(fileUrl));

  return (
    <div className="flex items-center w-full h-11 border border-neutral-500 rounded-xl overflow-hidden bg-white">
      <div
        role="button"
        tabIndex={0}
        onClick={onPick}
        className="w-11 h-full bg-secondary-800 flex items-center justify-center shrink-0 cursor-pointer"
      >
        <Image src="/icons/upload.png" alt="Upload" width={16} height={16} className="brightness-0 invert" />
      </div>
      {isUploaded ? (
        <>
          <button
            type="button"
            onClick={() => isRealFileUrl(fileUrl) && window.open(fileUrl, "_blank", "noopener,noreferrer")}
            className="flex items-center gap-2 ml-3 my-1.5 h-8 pl-3 pr-2 rounded-md bg-pneutral-800 text-white shrink-0 max-w-[60%]"
            title={isRealFileUrl(fileUrl) ? "View file" : displayName}
          >
            <span className="text-p4 font-body font-medium truncate">{displayName}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="shrink-0 text-white/70 hover:text-white"
              aria-label="Remove file"
            >
              <X size={14} />
            </span>
          </button>
          <div className="flex-1" />
          <div className="pr-3 shrink-0 text-success-600">
            <CheckCircle2 size={18} />
          </div>
        </>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={onPick}
          className="flex-1 h-full flex items-center px-3 truncate text-p4 font-body font-regular text-pneutral-500 cursor-pointer"
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}

function DocumentValidityBanner({ expiryDate }: { expiryDate: Date | null }) {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formattedDate = expiry.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (daysLeft < 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-warning-100 px-4 py-3 mt-2">
        <AlertTriangle size={16} className="text-warning-600 shrink-0" />
        <p className="text-p3 font-body font-medium text-warning-700">Document has expired on {formattedDate}. Please upload a valid document.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 mt-2">
      <CheckCircle2 size={16} className="text-success-600 shrink-0" />
      <p className="text-p3 font-body font-medium text-success-700">
        Document is valid. Expires in {daysLeft} days on {formattedDate}
      </p>
    </div>
  );
}

// Step 3: Compliance Details — a single accordion combining the mandatory
// license document, GST certificate, PAN card, and organization logo
// (previously three separate steps: License, GST). Matches Figma's
// "Compliance documents" accordion layout. GST/PAN numbers live here now,
// not on Organization Details — see gstOrPanSchema in buyerRegSchema.ts.
export default function ComplianceDetailsForm({
  formData,
  errors,
  mandatoryDocumentTypeId,
  mandatoryDocumentTypeName,
  onChange,
  onFileChange,
  onDeleteOrgLogo,
  onDeleteGstFile,
  onDeletePanFile,
  onDeleteMandatoryDocumentFile,
  onDocumentNumberChange,
  onDocumentIssueDateChange,
  onDocumentExpiryDateChange,
  onCheckGstUnique,
  onCheckPanUnique,
  prevStep,
  nextStep,
}: Props) {
  const mandatoryCode = requiredBuyerDocumentCodes(mandatoryDocumentTypeId)[0];
  const mandatoryDoc: DocumentRowState | undefined = mandatoryCode ? formData.documents?.[mandatoryCode] : undefined;
  const licenseUploaded = !!mandatoryDoc?.file || isRealFileUrl(mandatoryDoc?.fileUrl);
  const gstUploaded = !!formData.gstFile || isRealFileUrl(formData.gstFileUrl);
  const panUploaded = !!formData.panFile || isRealFileUrl(formData.panFileUrl);
  const logoUploaded = !!formData.orgLogoFile || isRealFileUrl(formData.orgLogoUrl);

  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set(["license"]));
  const [gstExistsError, setGstExistsError] = useState("");
  const [panExistsError, setPanExistsError] = useState("");

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGstBlur = async () => {
    const gst = (formData.gstNumber || "").trim();
    if (!gst) return setGstExistsError("");
    setGstExistsError((await onCheckGstUnique(gst)) ? "This GST number is already registered. Please use a different GST number." : "");
  };

  const handlePanBlur = async () => {
    const pan = (formData.panNumber || "").trim();
    if (!pan) return setPanExistsError("");
    setPanExistsError((await onCheckPanUnique(pan)) ? "This PAN number is already registered. Please use a different PAN number." : "");
  };

  const handleSimpleFileInput = (e: React.ChangeEvent<HTMLInputElement>, field: "orgLogo" | "gstFile" | "panFile" | "mandatoryDocument", code?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      e.target.value = "";
      window.alert(error);
      return;
    }
    onFileChange(e, field, code);
  };

  const handleContinue = () => {
    if (gstExistsError || panExistsError) return;
    nextStep();
  };

  const items = [
    {
      id: "license",
      title: mandatoryDocumentTypeName || "Drug License",
      description: "License to procure / buy / sell medicines as issued by the authority.",
      icon: FileText,
      required: true,
      uploaded: licenseUploaded,
    },
    {
      id: "gst",
      title: "GST Certificate",
      description: "Upload your organization's GST certificate.",
      icon: FileText,
      required: false,
      uploaded: gstUploaded,
    },
    {
      id: "pan",
      title: "PAN Card",
      description: "Upload a clear copy of PAN card.",
      icon: IdCard,
      required: false,
      uploaded: panUploaded,
    },
    {
      id: "logo",
      title: "Organization Logo",
      description: "Upload your organization logo (JPG, PNG).",
      icon: Boxes,
      required: false,
      uploaded: logoUploaded,
    },
  ];

  return (
    <div className="flex flex-col gap-6 bg-white">
      <div>
        <div className="text-h3 font-heading font-medium text-pneutral-900 leading-[40px]">
          Compliance documents
        </div>
        <div className="text-label-l4 font-heading font-regular text-pneutral-800 leading-[24px] mt-1">
          Upload the documents required to verify your organization
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-primary-100 px-4 py-3.5">
        <ShieldCheck size={18} className="text-secondary-700 mt-0.5 shrink-0" />
        <div>
          <p className="text-p3 font-body font-semibold text-pneutral-900">Your documents are secure</p>
          <p className="text-p4 font-body font-regular text-pneutral-600 mt-0.5">
            Documents are used only for account verification and compliance review.
          </p>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-200">
        {items.map((item, index) => {
          const isOpen = openItems.has(item.id);
          const Icon = item.icon;

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary-700 text-white text-p4 font-body font-semibold shrink-0">
                  {index + 1}
                </span>
                <Icon size={18} className="text-pneutral-700 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-p3 font-body font-semibold text-pneutral-900">{item.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-p4 font-body font-medium shrink-0 ${
                        item.required ? "bg-primary-100 text-secondary-700" : "bg-neutral-100 text-pneutral-500"
                      }`}
                    >
                      {item.required ? "Required" : "Optional"}
                    </span>
                  </span>
                  <span className="block text-p4 font-body font-regular text-pneutral-500 mt-0.5">{item.description}</span>
                </span>
                <span
                  className={`flex items-center gap-1 px-3 py-1 rounded-full border text-p4 font-body font-medium shrink-0 ${
                    item.uploaded ? "bg-success-50 border-success-200 text-success-600" : "bg-white border-warning-300 text-warning-600"
                  }`}
                >
                  {item.uploaded ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  {item.uploaded ? "Uploaded" : "Not Uploaded"}
                </span>
                {isOpen ? <ChevronUp size={18} className="text-pneutral-400 shrink-0" /> : <ChevronDown size={18} className="text-pneutral-400 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5">
                  {item.id === "license" && mandatoryCode && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-label-l4 font-heading font-medium text-pneutral-900">
                            Document Number<span className="text-warning-500 font-semibold ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            value={mandatoryDoc?.number || ""}
                            onChange={(e) => onDocumentNumberChange(mandatoryCode, e.target.value)}
                            placeholder="Enter document number"
                            className="w-full h-11 pl-4 pr-3 rounded-xl border border-neutral-500 bg-white text-pneutral-900 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-label-l4 font-heading font-medium text-pneutral-900">Issue Date</label>
                          <DatePicker
                            value={mandatoryDoc?.issueDate ?? null}
                            onChange={(date) => onDocumentIssueDateChange(mandatoryCode, date as Date | null)}
                            slotProps={{ textField: { size: "small" as const } }}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-label-l4 font-heading font-medium text-pneutral-900">Expiry Date</label>
                          <DatePicker
                            value={mandatoryDoc?.expiryDate ?? null}
                            onChange={(date) => onDocumentExpiryDateChange(mandatoryCode, date as Date | null)}
                            slotProps={{ textField: { size: "small" as const } }}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-label-l4 font-heading font-medium text-pneutral-900">
                            Upload File<span className="text-warning-500 font-semibold ml-1">*</span>
                          </label>
                          <input
                            id={`compliance-upload-${mandatoryCode}`}
                            type="file"
                            onChange={(e) => handleSimpleFileInput(e, "mandatoryDocument", mandatoryCode)}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                          />
                          <UploadSlot
                            uploaded={licenseUploaded}
                            fileUrl={mandatoryDoc?.fileUrl}
                            fileName={mandatoryDoc?.fileName}
                            fileObj={mandatoryDoc?.file}
                            onPick={() => document.getElementById(`compliance-upload-${mandatoryCode}`)?.click()}
                            onDelete={() => onDeleteMandatoryDocumentFile(mandatoryCode)}
                            placeholder="Upload document"
                          />
                        </div>
                      </div>
                      {errors.mandatoryDocument && (
                        <p className="text-p2 font-body font-regular text-red-500 mt-2">{errors.mandatoryDocument}</p>
                      )}
                      {licenseUploaded && !errors.mandatoryDocument && (
                        <DocumentValidityBanner expiryDate={mandatoryDoc?.expiryDate ?? null} />
                      )}
                    </>
                  )}

                  {item.id === "gst" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-label-l4 font-heading font-medium text-pneutral-900">GST Number</label>
                        <input
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => {
                            onChange("gstNumber", e.target.value.toUpperCase());
                            setGstExistsError("");
                          }}
                          onBlur={handleGstBlur}
                          placeholder="Enter GST number"
                          maxLength={15}
                          className={`w-full h-11 pl-4 pr-3 rounded-xl border uppercase ${
                            errors.gstNumber || gstExistsError ? "border-red-500" : "border-neutral-500"
                          } bg-white text-pneutral-900 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200`}
                        />
                        {(errors.gstNumber || gstExistsError) && (
                          <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.gstNumber || gstExistsError}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-label-l4 font-heading font-medium text-pneutral-900">Upload File</label>
                        <input
                          id="compliance-upload-gst"
                          type="file"
                          onChange={(e) => handleSimpleFileInput(e, "gstFile")}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <UploadSlot
                          uploaded={gstUploaded}
                          fileUrl={formData.gstFileUrl}
                          fileName={formData.gstFileName}
                          fileObj={formData.gstFile}
                          onPick={() => document.getElementById("compliance-upload-gst")?.click()}
                          onDelete={onDeleteGstFile}
                          placeholder="Upload GST certificate"
                        />
                      </div>
                    </div>
                  )}

                  {item.id === "pan" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-label-l4 font-heading font-medium text-pneutral-900">PAN Number</label>
                        <input
                          type="text"
                          value={formData.panNumber}
                          onChange={(e) => {
                            onChange("panNumber", e.target.value.toUpperCase());
                            setPanExistsError("");
                          }}
                          onBlur={handlePanBlur}
                          placeholder="Enter PAN number"
                          maxLength={10}
                          className={`w-full h-11 pl-4 pr-3 rounded-xl border uppercase ${
                            errors.panNumber || panExistsError ? "border-red-500" : "border-neutral-500"
                          } bg-white text-pneutral-900 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200`}
                        />
                        {(errors.panNumber || panExistsError) && (
                          <p className="text-p2 font-body font-regular text-red-500 mt-1">{errors.panNumber || panExistsError}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-label-l4 font-heading font-medium text-pneutral-900">Upload File</label>
                        <input
                          id="compliance-upload-pan"
                          type="file"
                          onChange={(e) => handleSimpleFileInput(e, "panFile")}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                        <UploadSlot
                          uploaded={panUploaded}
                          fileUrl={formData.panFileUrl}
                          fileName={formData.panFileName}
                          fileObj={formData.panFile}
                          onPick={() => document.getElementById("compliance-upload-pan")?.click()}
                          onDelete={onDeletePanFile}
                          placeholder="Upload PAN card"
                        />
                      </div>
                    </div>
                  )}

                  {item.id === "logo" && (
                    <div className="flex flex-col gap-1 w-full max-w-[24rem]">
                      <label className="text-label-l4 font-heading font-medium text-pneutral-900">Upload File</label>
                      <input
                        id="compliance-upload-logo"
                        type="file"
                        onChange={(e) => handleSimpleFileInput(e, "orgLogo")}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                      <UploadSlot
                        uploaded={logoUploaded}
                        fileUrl={formData.orgLogoUrl}
                        fileName={formData.orgLogoFileName}
                        fileObj={formData.orgLogoFile}
                        onPick={() => document.getElementById("compliance-upload-logo")?.click()}
                        onDelete={onDeleteOrgLogo}
                        placeholder="Upload organization logo"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-2 pt-5 border-t border-neutral-200">
        <button
          onClick={prevStep}
          className="h-12 px-6 border-2 border-secondary-600 text-secondary-600 rounded-xl flex items-center gap-2 font-semibold"
        >
          <Image src="/icons/backbuttonicon.png" alt="Back" width={18} height={18} />
          Back
        </button>

        <span className="hidden sm:flex items-center gap-1.5 text-p3 font-body font-regular text-success-600">
          <CheckCircle2 size={16} />
          All changes are saved automatically
        </span>

        <button
          onClick={handleContinue}
          className="h-12 px-6 rounded-xl bg-primary-800 text-white flex items-center gap-2 font-semibold"
        >
          Continue
          <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} className="brightness-0 invert" />
        </button>
      </div>
    </div>
  );
}
