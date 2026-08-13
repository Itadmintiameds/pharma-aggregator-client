"use client";

import React from "react";
import Image from "next/image";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import UploadedFileChip from "@/src/app/seller_7a3b9f2c/components/UploadedFileChip";
import { isRealFileUrl } from "@/src/utils/sellerRegFiles";
import { requiredBuyerDocumentCodes } from "@/src/schema/buyer/buyerRegSchema";
import { BuyerFormData, DocumentRowState } from "@/src/app/buyer_e8d45a1b/components/BuyerRegister";

interface Props {
  formData: BuyerFormData;
  // The selected buyer type's single mandatory document type (id + human
  // label), resolved by BuyerRegister.tsx from GET /buyer-types +
  // GET /document-types — not a hardcoded buyer-type-name -> label map.
  mandatoryDocumentTypeId?: number;
  mandatoryDocumentTypeName?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: "orgLogo" | "gstFile" | "panFile" | "mandatoryDocument", code?: string) => void;
  onDeleteOrgLogo: () => void;
  onDeleteGstFile: () => void;
  onDeletePanFile: () => void;
  onDeleteMandatoryDocumentFile: (code: string) => void;
  onDocumentNumberChange: (code: string, value: string) => void;
  onDocumentIssueDateChange: (code: string, date: Date | null) => void;
  onDocumentExpiryDateChange: (code: string, date: Date | null) => void;
  prevStep: () => void;
  nextStep: () => void;
}

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

function validateFile(file: File): string | null {
  if (file.size > 5 * 1024 * 1024) return "File size should be less than 5MB";
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PDF, JPG, JPEG, and PNG files are allowed";
  return null;
}

export default function DocumentsForm({
  formData,
  mandatoryDocumentTypeId,
  mandatoryDocumentTypeName,
  onFileChange,
  onDeleteOrgLogo,
  onDeleteGstFile,
  onDeletePanFile,
  onDeleteMandatoryDocumentFile,
  onDocumentNumberChange,
  onDocumentIssueDateChange,
  onDocumentExpiryDateChange,
  prevStep,
  nextStep,
}: Props) {
  const requiredCodes = requiredBuyerDocumentCodes(mandatoryDocumentTypeId);
  const mandatoryCode = requiredCodes[0];
  const mandatoryDoc: DocumentRowState | undefined = mandatoryCode ? formData.documents?.[mandatoryCode] : undefined;

  const handleSimpleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "orgLogo" | "gstFile" | "panFile" | "mandatoryDocument",
    code?: string
  ) => {
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

      {mandatoryCode && (
        <div className="border border-neutral-200 rounded-xl p-5 bg-white flex flex-col gap-4">
          <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900">
            {mandatoryDocumentTypeName || "Mandatory Document"}
            <span className="text-warning-500 font-semibold ml-1">*</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-label-l4 font-heading font-medium text-pneutral-900">Document Number</label>
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
              <label className="text-label-l4 font-heading font-medium text-pneutral-900">Upload File</label>
              <input
                id={`mandatory-doc-upload-${mandatoryCode}`}
                type="file"
                onChange={(e) => handleSimpleFileInput(e, "mandatoryDocument", mandatoryCode)}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              {!mandatoryDoc?.file && isRealFileUrl(mandatoryDoc?.fileUrl) ? (
                <UploadedFileChip
                  url={mandatoryDoc!.fileUrl as string}
                  fileName={mandatoryDoc?.fileName}
                  inputId={`mandatory-doc-upload-${mandatoryCode}`}
                  onDelete={() => onDeleteMandatoryDocumentFile(mandatoryCode)}
                />
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => document.getElementById(`mandatory-doc-upload-${mandatoryCode}`)?.click()}
                  className="flex items-center h-11 border border-neutral-500 rounded-xl overflow-hidden bg-white cursor-pointer"
                >
                  <div className="w-11 h-full bg-secondary-800 flex items-center justify-center shrink-0">
                    <Image src="/icons/upload.png" alt="Upload" width={16} height={16} className="brightness-0 invert" />
                  </div>
                  <div className="flex-1 px-3 truncate text-p4 font-body font-regular text-pneutral-500">
                    {mandatoryDoc?.file?.name || "Upload document"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Optional: GST Certificate */}
      {formData.gstNumber && (
        <div className="border border-neutral-200 rounded-xl p-5 bg-white flex flex-col gap-3">
          <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900">GST Certificate</h3>
          <input
            id="org-gst-upload"
            type="file"
            onChange={(e) => handleSimpleFileInput(e, "gstFile")}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
          {!formData.gstFile && isRealFileUrl(formData.gstFileUrl) ? (
            <UploadedFileChip url={formData.gstFileUrl} fileName={formData.gstFileName} inputId="org-gst-upload" onDelete={onDeleteGstFile} />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => document.getElementById("org-gst-upload")?.click()}
              className="flex items-center h-11 border border-neutral-500 rounded-xl overflow-hidden bg-white cursor-pointer max-w-md"
            >
              <div className="w-11 h-full bg-secondary-800 flex items-center justify-center shrink-0">
                <Image src="/icons/upload.png" alt="Upload" width={16} height={16} className="brightness-0 invert" />
              </div>
              <div className="flex-1 px-3 truncate text-p4 font-body font-regular text-pneutral-500">
                {formData.gstFile?.name || "Upload GST certificate (optional)"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional: PAN Card */}
      {formData.panNumber && (
        <div className="border border-neutral-200 rounded-xl p-5 bg-white flex flex-col gap-3">
          <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900">PAN Card</h3>
          <input
            id="org-pan-upload"
            type="file"
            onChange={(e) => handleSimpleFileInput(e, "panFile")}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
          {!formData.panFile && isRealFileUrl(formData.panFileUrl) ? (
            <UploadedFileChip url={formData.panFileUrl} fileName={formData.panFileName} inputId="org-pan-upload" onDelete={onDeletePanFile} />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => document.getElementById("org-pan-upload")?.click()}
              className="flex items-center h-11 border border-neutral-500 rounded-xl overflow-hidden bg-white cursor-pointer max-w-md"
            >
              <div className="w-11 h-full bg-secondary-800 flex items-center justify-center shrink-0">
                <Image src="/icons/upload.png" alt="Upload" width={16} height={16} className="brightness-0 invert" />
              </div>
              <div className="flex-1 px-3 truncate text-p4 font-body font-regular text-pneutral-500">
                {formData.panFile?.name || "Upload PAN card (optional)"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional: Organization Logo */}
      <div className="border border-neutral-200 rounded-xl p-5 bg-white flex flex-col gap-3">
        <h3 className="text-label-l5 font-heading font-semibold text-pneutral-900">Organization Logo</h3>
        <input
          id="org-logo-upload"
          type="file"
          onChange={(e) => handleSimpleFileInput(e, "orgLogo")}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
        />
        {!formData.orgLogoFile && isRealFileUrl(formData.orgLogoUrl) ? (
          <UploadedFileChip url={formData.orgLogoUrl} fileName={formData.orgLogoFileName} inputId="org-logo-upload" onDelete={onDeleteOrgLogo} />
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => document.getElementById("org-logo-upload")?.click()}
            className="flex items-center h-11 border border-neutral-500 rounded-xl overflow-hidden bg-white cursor-pointer max-w-md"
          >
            <div className="w-11 h-full bg-secondary-800 flex items-center justify-center shrink-0">
              <Image src="/icons/upload.png" alt="Upload" width={16} height={16} className="brightness-0 invert" />
            </div>
            <div className="flex-1 px-3 truncate text-p4 font-body font-regular text-pneutral-500">
              {formData.orgLogoFile?.name || "Upload organization logo (optional)"}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2">
        <button
          onClick={prevStep}
          className="h-12 px-6 border-2 border-pneutral-900 text-pneutral-900 rounded-xl flex items-center gap-2"
        >
          <Image src="/icons/backbuttonicon.png" alt="Back" width={18} height={18} />
          Back
        </button>

        <button
          onClick={nextStep}
          className="h-12 px-6 border-2 border-primary-800 text-primary-800 rounded-xl flex items-center gap-2"
        >
          Continue
          <Image src="/icons/continueicon.png" alt="Continue" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}
